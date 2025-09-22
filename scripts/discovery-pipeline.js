#!/usr/bin/env node
/**
 * Discovery Pipeline (Steps 1–9)
 * - Zero external deps; Node >= 18 required (global fetch available)
 * - Optional network fetching (use --fetch). Default is no-fetch with stub data.
 * - Parses HTML/JSON-LD heuristically; scores fit/vibe/alignment; filters/ranks; exports JSON/CSV.
 */

const fs = require('fs');
const path = require('path');

// -------------------- CLI --------------------
const args = process.argv.slice(2);
function getArg(name, defVal = undefined) {
  const i = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i === -1) return defVal;
  const a = args[i];
  const eq = a.indexOf('=');
  if (eq !== -1) return a.slice(eq + 1);
  const next = args[i + 1];
  if (next && !next.startsWith('--')) return next;
  return true;
}

const enableFetch = !!getArg('fetch', false) && getArg('fetch') !== 'false';
const sourcesFile = getArg('sources', 'docs/discovery-sources.json');
const outFile = getArg('out', 'api/discovered-roles.json');
const outCsv = getArg('outCsv', 'docs/discovered-roles.csv');
const networkFile = getArg('network', 'docs/network-trust.json');
const archetypesFile = getArg('archetypes', 'docs/leader-archetypes.json');
const limit = parseInt(getArg('limit', '0')) || 0;
const metricsFile = getArg('metrics', 'docs/company-metrics.json');
const verbose = !!getArg('verbose', false);

function log(...m) { if (verbose) console.log('[discover]', ...m); }

// -------------------- Step 0: Config --------------------
function loadSources(file) {
  try {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      const json = JSON.parse(fs.readFileSync(p, 'utf8'));
      return json && Array.isArray(json.targets) ? json.targets : [];
    }
  } catch (e) { log('Failed to load sources', e.message); }
  // Fallback sample sources
  return [
    { company: 'Coinbase', sector: 'Crypto', url: 'https://www.coinbase.com/careers' },
    { company: 'Stripe', sector: 'FinTech', url: 'https://stripe.com/jobs' },
    { company: 'OpenAI', sector: 'AI', url: 'https://openai.com/careers' }
  ];
}

function loadNetworkTrust(file) {
  try {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      const json = JSON.parse(fs.readFileSync(p, 'utf8'));
      return {
        trustedCompanies: json.trustedCompanies || [],
        trustedLeaders: json.trustedLeaders || [],
        redFlagCompanies: json.redFlagCompanies || [],
        redFlagKeywords: json.redFlagKeywords || []
      };
    }
  } catch (e) { log('Failed to load network trust', e.message); }
  return { trustedCompanies: [], trustedLeaders: [], redFlagCompanies: [], redFlagKeywords: [] };
}

function loadCompanyMetrics(file) {
  try {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return { companies: {} };
}

function saveCompanyMetrics(file, data) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) { /* ignore */ }
}

function updateCompanyMetrics(metrics, company, count) {
  const key = String(company || 'Unknown');
  const today = new Date().toISOString().slice(0,10);
  metrics.companies[key] = metrics.companies[key] || [];
  const arr = metrics.companies[key];
  if (!arr.length || arr[arr.length-1].date !== today) {
    arr.push({ date: today, count });
    if (arr.length > 30) arr.shift();
  } else {
    arr[arr.length-1].count = count;
  }
}

function computeMomentum(metrics, company) {
  const arr = (metrics.companies[String(company || 'Unknown')] || []);
  if (arr.length < 2) return { momentum: 'flat', delta: 0 };
  const a = arr[arr.length-2].count;
  const b = arr[arr.length-1].count;
  if (a === 0) return { momentum: b>0 ? 'up' : 'flat', delta: 1 };
  const change = (b - a) / a;
  if (change > 0.1) return { momentum: 'up', delta: change };
  if (change < -0.1) return { momentum: 'down', delta: change };
  return { momentum: 'flat', delta: change };
}

function loadLeaderArchetypes(file) {
  try {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      const json = JSON.parse(fs.readFileSync(p, 'utf8'));
      return Array.isArray(json.archetypes) ? json.archetypes : [];
    }
  } catch(e) { log('Failed to load archetypes', e.message); }
  return [];
}

// -------------------- Step 1: Fetch + Parse --------------------
async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'job-tracker-pro/1.0 (+cli)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally { clearTimeout(t); }
}

function extractJsonLd(html) {
  const scripts = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) scripts.push(...parsed);
      else scripts.push(parsed);
    } catch {}
  }
  return scripts.filter(Boolean);
}

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function guessListingsFromHtml(html) {
  // Heuristic: find anchor tags with job-like hrefs and text
  const out = [];
  const anchorRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = anchorRe.exec(html))) {
    const href = m[1];
    const text = m[2].replace(/<[^>]*>/g, '').trim();
    if (!href || !text) continue;
    const norm = text.toLowerCase();
    if (/(job|role|product|engineer|manager|director|lead)/.test(norm) && !/apply now|learn more|benefits|about/.test(norm)) {
      out.push({ title: text, url: href });
    }
  }
  return out;
}

function parseJobPostings(company, sector, url, html) {
  const jobs = [];
  const jsonld = extractJsonLd(html).filter(x => (x['@type'] || x.type || '').toString().toLowerCase().includes('jobposting'));
  if (jsonld.length) {
    for (const j of jsonld) {
      const title = j.title || j.name || '';
      if (!title) continue;
      const loc = j.jobLocation?.address?.addressLocality || j.jobLocation?.address?.addressRegion || j.jobLocation?.address?.addressCountry || (j.jobLocationType || '').includes('TELECOMMUTE') ? 'Remote' : 'Unknown';
      const comp = j.hiringOrganization?.name || company;
      const salary = j.baseSalary?.value?.value ? `$${j.baseSalary.value.value}` : (j.salary || j.baseSalary?.value || '');
      const desc = (j.description || '').toString();
      jobs.push({
        company: comp || company,
        sector,
        sourceUrl: url,
        applyUrl: j.url || j.hiringOrganization?.sameAs || url,
        roleTitle: title,
        location: loc || 'Unknown',
        salary: salary || '',
        rawText: desc
      });
    }
  } else {
    // Fallback heuristic from anchors + whole-page text for scoring
    const anchors = guessListingsFromHtml(html);
    const text = extractText(html);
    for (const a of anchors) {
      jobs.push({
        company,
        sector,
        sourceUrl: url,
        applyUrl: new URL(a.url, url).toString(),
        roleTitle: a.title,
        location: 'Unknown',
        salary: '',
        rawText: text
      });
    }
  }
  return jobs;
}

// -------------------- Step 2–3: Scoring --------------------
const FIT_CUES = [
  { re: /(institutional|enterprise|b2b)/i, w: 1.2 },
  { re: /(regulated|compliance|risk|licen[cs]ing|sox|gdpr)/i, w: 1.1 },
  { re: /(cross[- ]functional|matrix|stakeholder|leadership)/i, w: 1.0 },
  { re: /(outcome[- ]driven|impact|results|metrics|kpi)/i, w: 0.9 },
  { re: /(product strategy|roadmap|portfolio|platform)/i, w: 0.9 },
  { re: /(crypto|defi|payments|fintech|ai|ml|safety)/i, w: 0.8 },
];

const VIBE_POS = [
  { re: /(boundar|balance|family|parental|caregiver)/i, w: 1.0 },
  { re: /(flexible|remote|hybrid|async|4[- ]day)/i, w: 0.8 },
  { re: /(transparent|open communication|direct|candor)/i, w: 0.7 },
  { re: /(sustainable pace|no crunch|no overtime)/i, w: 0.7 },
];
const VIBE_NEG = [
  { re: /(hustle|grind|996|work hard play hard|fast[- ]paced|pressure)/i, w: -1.2 },
  { re: /(rockstar|ninja|superstar)/i, w: -0.8 },
  { re: /(must|only the best|top 1%)/i, w: -0.6 },
];

const ALIGN_POS = [
  { re: /(values|mission|principles|ethics)/i, w: 0.8 },
  { re: /(outcome focus|impact over output)/i, w: 0.8 },
  { re: /(feedback culture|psychological safety|blameless)/i, w: 1.0 },
  { re: /(autonomy|craftsmanship|mastery)/i, w: 0.7 }
];
const ALIGN_NEG = [
  { re: /(cult[- ]of[- ]busy|always on|grindset)/i, w: -1.0 },
  { re: /(vague promises|unlimited pto)/i, w: -0.6 },
];

function scoreByCues(text, cues) {
  let s = 0; if (!text) return 0; const t = String(text);
  for (const c of cues) if (c.re.test(t)) s += c.w;
  return s;
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function computeFitScore(job) {
  const base = 6.5;
  const s = base + scoreByCues(job.rawText, FIT_CUES);
  // Sector bonus
  const sectorBonus = /Crypto|FinTech|AI/i.test(job.sector || '') ? 0.6 : 0;
  return clamp(s + sectorBonus, 1.0, 10.0);
}

function computeVibe(job) {
  const s = 5 + scoreByCues(job.rawText, VIBE_POS) + scoreByCues(job.rawText, VIBE_NEG);
  const vibeScore = clamp(s, 1.0, 10.0);
  const emoji = vibeScore >= 7.5 ? '😊' : vibeScore <= 4.5 ? '😞' : '😐';
  return { vibeScore, emoji };
}

function computeAlignment(job) {
  const s = 5 + scoreByCues(job.rawText, ALIGN_POS) + scoreByCues(job.rawText, ALIGN_NEG);
  const alignment = clamp(s, 1.0, 10.0);
  const antiSignals = [];
  for (const c of ALIGN_NEG.concat(VIBE_NEG)) if (c.re.test(job.rawText || '')) antiSignals.push(c.re.source);
  return { alignment, antiSignals };
}

function computeNetworkTrust(job, trust) {
  let score = 0; const notes = [];
  const company = (job.company || '').toLowerCase();
  if (trust.trustedCompanies.map(c=>c.toLowerCase()).includes(company)) { score += 1.0; notes.push('trustedCompany'); }
  if (trust.redFlagCompanies.map(c=>c.toLowerCase()).includes(company)) { score -= 1.0; notes.push('redFlagCompany'); }
  const text = (job.rawText || '') + ' ' + (job.roleTitle || '') + ' ' + (job.sourceUrl || '');
  for (const leader of trust.trustedLeaders) {
    if (new RegExp(leader, 'i').test(text)) { score += 0.5; notes.push(`leader:${leader}`); }
  }
  for (const kw of trust.redFlagKeywords) {
    if (new RegExp(kw, 'i').test(text)) { score -= 0.5; notes.push(`redkw:${kw}`); }
  }
  return { networkTrust: score, dyorNotes: notes };
}

function computeArchetype(job, archetypes) {
  const text = `${job.roleTitle || ''} ${job.rawText || ''}`;
  let best = { id: null, label: null, score: 0 };
  for (const a of archetypes) {
    const hits = (a.signals || []).filter(sig => new RegExp(sig, 'i').test(text)).length;
    const score = hits > 0 ? Math.min(1, hits / 3) : 0;
    if (score > best.score) best = { id: a.id, label: a.label, score };
  }
  return best;
}

// -------------------- Step 4: Rank + Cluster --------------------
function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a,b)=>a-b);
  const idx = Math.floor((p/100) * (s.length-1));
  return s[idx];
}

function rankAndCluster(jobs) {
  const fitArr = jobs.map(j=>j.fitScore);
  const vibeArr = jobs.map(j=>j.vibeNumeric);
  const alignArr = jobs.map(j=>j.alignmentScore);
  const fitP90 = percentile(fitArr, 90);
  const vibeP90 = percentile(vibeArr, 90);
  const alignP90 = percentile(alignArr, 90);

  const filtered = jobs.filter(j => j.fitScore >= fitP90 && j.vibeNumeric >= vibeP90 && j.alignmentScore >= alignP90);
  filtered.sort((a,b) => b.finalScore - a.finalScore);
  const top = filtered.slice(0, 50);

  const clusters = {};
  for (const j of top) {
    const key = `${j.sector || 'Unknown'}|${j.remoteFlex || 'Unknown'}`;
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(j);
  }
  return { top, clusters, thresholds: { fitP90, vibeP90, alignP90 } };
}

// -------------------- Step 5–7: Feedback + Anti-patterns + Pacing (stubs) --------------------
function loadFeedback() {
  const p = path.resolve(process.cwd(), 'docs/feedback.json');
  if (fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
  }
  return { positives: [], negatives: [] };
}

function adjustWeightsWithFeedback(jobs, feedback) {
  // Minimal stub: boost family/boundaries if marked positive, penalize hustle if negative
  let fitAdj = 0, vibeAdj = 0, alignAdj = 0;
  const txt = (feedback.positives||[]).join(' ') + ' ' + (feedback.negatives||[]).join(' ');
  if (/family|boundar|support/i.test(txt)) vibeAdj += 0.3;
  if (/hustle|996|grind/i.test(txt)) vibeAdj -= 0.3; alignAdj -= 0.2;
  return jobs.map(j => ({
    ...j,
    fitScore: clamp(j.fitScore + fitAdj, 1, 10),
    vibeNumeric: clamp(j.vibeNumeric + vibeAdj, 1, 10),
    alignmentScore: clamp(j.alignmentScore + alignAdj, 1, 10),
    finalScore: clamp(0.5*j.fitScore + 0.3*j.vibeNumeric + 0.2*j.alignmentScore, 1, 10)
  }));
}

function updateAntipatternsLibrary(jobs) {
  const p = path.resolve(process.cwd(), 'docs/anti-patterns.json');
  let lib = { patterns: {}, updatedAt: new Date().toISOString() };
  if (fs.existsSync(p)) {
    try { lib = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
  }
  for (const j of jobs) {
    (j.flags || []).forEach(f => { lib.patterns[f] = (lib.patterns[f]||0) + 1; });
  }
  lib.updatedAt = new Date().toISOString();
  try { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(lib, null, 2)); } catch {}
}

// -------------------- Step 8: Export --------------------
function toJobAppObject(j) {
  const id = `${j.company} ${j.roleTitle}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  return {
    id,
    company: j.company,
    roleTitle: j.roleTitle,
    location: j.location || (j.remoteFlex || 'Unknown'),
    status: 'not-started',
    vibe: j.vibeEmoji || '😐',
    fitScore: parseFloat(j.fitScore.toFixed(1)),
    salary: j.salary || '$-',
    tags: [j.sector, j.remoteFlex].filter(Boolean),
    appliedDate: null,
    notes: j.notes || '',
    research: { companyIntel: '', keyPeople: [], recentNews: '', competitiveAdvantage: '', challenges: '' },
    iceBreakers: [],
    objections: [],
    fitAnalysis: j.analysis || '',
    activityLog: [],
    dateAdded: new Date().toISOString().slice(0,10),
    links: { apply: j.applyUrl, source: j.sourceUrl },
    trust: { network: j.networkTrust || 0, dyorNotes: j.dyorNotes || [], archetype: j.archetype || null },
    quality: { clarity: j.clarityScore || 0, transparency: j.transparencyScore || 0, burnoutRisk: j.burnoutRisk || 0, momentum: j.momentum || 'flat' }
  };
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function writeCsv(file, rows) {
  const esc = v => {
    const s = (v==null? '': String(v));
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const headers = ['company','roleTitle','status','location','salary','fitScore','tags','applyUrl','networkTrust'];
  const out = [headers.join(',')].concat(rows.map(r => [
    r.company, r.roleTitle, r.status, r.location, r.salary, r.fitScore, (r.tags||[]).join(';'), r.links?.apply || '', r.trust?.network || 0
  ].map(esc).join(',')));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out.join('\n'));
}

// -------------------- Main --------------------
(async function main(){
  const sources = loadSources(sourcesFile);
  const all = [];
  log('Sources:', sources.length);
  const metrics = loadCompanyMetrics(metricsFile);
  for (const s of sources.slice(0, limit || sources.length)) {
    let html = '';
    if (enableFetch) {
      try { html = await fetchText(s.url); log('Fetched', s.company); } catch (e) { log('Fetch failed', s.url, e.message); html = ''; }
    }
    if (!html) {
      // Stub text for offline scoring
      html = `
        <html><head><title>${s.company} Careers</title></head>
        <body>
          <script type="application/ld+json">
            [{"@type":"JobPosting","title":"Director Product - Institutional Platform","url":"${s.url}/director-product","hiringOrganization":{"name":"${s.company}"},"jobLocationType":"TELECOMMUTE","description":"Lead cross-functional teams in regulated markets to deliver outcome-driven strategy for enterprise clients. Flexible/remote with strong boundaries and family support."}]
          </script>
        </body></html>`;
    }

    const parsed = parseJobPostings(s.company, s.sector, s.url, html);
    // Update company metrics with total roles detected for this source
    try { updateCompanyMetrics(metrics, s.company, parsed.length); } catch {}
    const arch = loadLeaderArchetypes(archetypesFile);
    for (const p of parsed) {
      // Derive remote/flex tag
      const text = p.rawText || '';
      const remoteFlex = /(remote|telecommute|hybrid|flex)/i.test(text) ? 'Remote/Flex' : 'Onsite/Unknown';
      // Quality/clarity/transparency/burnout signals (lightweight)
      const clarityScore = ((/report(s)? to|scope|responsibilit(y|ies)|success metric/i.test(text)) ? 0.5 : 0) + ((/role|title|level/i.test(text)) ? 0.3 : 0);
      const transparencyScore = (/\$\d+|compensation|salary|benefits|parental|caregiver|process|stages?/i.test(text)) ? 0.8 : 0;
      const burnoutRisk = (/(hustle|grind|fast[- ]paced|wear many hats|rockstar|ninja|always on|996)/i.test(text)) ? 1 : 0;
      const fitScore = computeFitScore(p);
      const { vibeScore, emoji } = computeVibe(p);
      const { alignment, antiSignals } = computeAlignment(p);
      const trustCfg = loadNetworkTrust(networkFile);
      const { networkTrust, dyorNotes } = computeNetworkTrust(p, trustCfg);
      const archetype = computeArchetype(p, arch);
      const { momentum } = computeMomentum(metrics, s.company);
      const finalScore = clamp(0.5*fitScore + 0.3*vibeScore + 0.2*alignment + 0.2*networkTrust - 0.2*burnoutRisk + 0.1*transparencyScore + 0.1*clarityScore, 1, 10);
      const flags = antiSignals;
      const exclude = flags.length >= 2 || vibeScore < 4.0;
      all.push({ ...p, remoteFlex, fitScore, vibeNumeric: vibeScore, vibeEmoji: emoji, alignmentScore: alignment, finalScore, flags, exclude, networkTrust, dyorNotes, clarityScore, transparencyScore, burnoutRisk, archetype, momentum });
    }
  }

  // Step 5 feedback adjustments
  const fb = loadFeedback();
  const adjusted = adjustWeightsWithFeedback(all, fb);

  // Step 6 anti-patterns library update (non-blocking)
  try { updateAntipatternsLibrary(adjusted); } catch {}

  // Step 4: rank/cluster of candidates not excluded
  const candidates = adjusted.filter(j => !j.exclude);
  const { top, clusters, thresholds } = rankAndCluster(candidates);

  // Step 7 pacing/goals (stub recommendations)
  const recommendations = {
    appTargetsPerWeek: Math.min(20, Math.max(5, Math.round(top.length / 2))),
    note: 'Tune targets based on conversion; celebrate consistent top-decile matches.'
  };

  // Step 8: export
  const exportJobs = top.map(toJobAppObject);
  // Persist updated metrics
  saveCompanyMetrics(metricsFile, metrics);
  writeJson(outFile, {
    generatedAt: new Date().toISOString(),
    thresholds,
    totals: { parsed: all.length, eligible: candidates.length, exported: exportJobs.length },
    clusters,
    recommendations,
    jobs: exportJobs
  });
  writeCsv(outCsv, exportJobs);

  console.log(`✔ Discovery complete: ${exportJobs.length} roles → ${outFile}`);
})();
