// Job Search Optimization Platform - Complete Application JavaScript

// Complete dataset of 50 realistic roles tailored for Zach Harris profile
const initialJobsData = [
  // Crypto/Web3 Companies (20 roles)
  {
    id: "coinbase-director-institutional-platform",
    company: "Coinbase",
    roleTitle: "Director Product Management - Institutional Platform",
    location: "Remote (SF Bay Area preferred)",
    status: "not-started",
    vibe: "😐",
    fitScore: 9.8,
    salary: "$280k - $330k + equity",
    tags: ["Crypto", "Director", "Remote", "Institutional", "Platform"],
    appliedDate: null,
    notes: "Leading crypto exchange focused on institutional infrastructure. Strong regulatory compliance culture.",
    research: {
      companyIntel: "Global crypto exchange leader, expanding institutional offerings, strong regulatory positioning",
      keyPeople: ["Brian Armstrong (CEO)", "Alesia Haas (CFO)", "Paul Grewal (Chief Legal Officer)"],
      recentNews: "Q3 2025 institutional trading volume up 67%, expanding European operations",
      competitiveAdvantage: "First-mover advantage, regulatory compliance, institutional relationships",
      challenges: "Regulatory uncertainty, traditional finance competition"
    },
    iceBreakers: [
      "How is Coinbase differentiating institutional vs retail platform architecture?",
      "What role does regulatory compliance play in product roadmap decisions?",
      "How do you balance innovation speed with institutional-grade reliability requirements?"
    ],
    objections: [
      "May prefer deeper crypto technical background",
      "Could question cross-functional leadership at this scale",
      "Might want traditional institutional finance experience"
    ],
    fitAnalysis: "Perfect match - regulatory experience from CTF, cross-functional leadership, institutional focus aligns with Grayscale background",
    activityLog: [],
    dateAdded: "2025-09-18"
  },
  {
    id: "stripe-staff-pm-crypto",
    company: "Stripe",
    roleTitle: "Staff Product Manager - Crypto Infrastructure",
    location: "Remote (Global)",
    status: "not-started",
    vibe: "😐",
    fitScore: 9.7,
    salary: "$240k - $300k + equity",
    tags: ["FinTech", "Crypto", "Remote", "Infrastructure", "Staff"],
    appliedDate: null,
    notes: "Global payments leader expanding crypto infrastructure post-Bridge acquisition. Strong developer ecosystem.",
    research: {
      companyIntel: "Leading payments platform, recently acquired Bridge for $1.1B, expanding stablecoin capabilities",
      keyPeople: ["Patrick Collison (CEO)", "John Collison (President)", "Jeanne DeWitt Grosser (CFO)"],
      recentNews: "Bridge acquisition accelerating stablecoin strategy, expanding crypto payment rails globally",
      competitiveAdvantage: "Massive merchant network, developer ecosystem, global regulatory relationships",
      challenges: "Crypto-native competition, complex international regulations"
    },
    iceBreakers: [
      "How does the Bridge acquisition change Stripe's crypto infrastructure strategy?",
      "What regulatory challenges do you see in global stablecoin payments?",
      "How do you balance merchant crypto demand with compliance requirements?"
    ],
    objections: [
      "May prefer deeper payments industry background",
      "Could question global developer ecosystem experience",
      "Might want more hands-on technical product management"
    ],
    fitAnalysis: "Strong fit - payments infrastructure aligns with fintech experience, regulatory expertise highly valued",
    activityLog: [],
    dateAdded: "2025-09-18"
  }
];

// --- Lightweight UX Enhancements: saved filter UI + badge ---
// Keeps the Filters panel, search, and the small counter bubble in sync with
// any previously saved state in localStorage for a smooth reload experience.
(function enhanceFiltersUI(){
  function qs(id){ return document.getElementById(id); }
  function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

  function updateFilterBadge(filters){
    try {
      const countEl = qs('filter-count');
      if (!countEl) return;
      const active = [
        (filters.status && filters.status.length>0),
        (typeof filters.fitScore==='number' && filters.fitScore>0),
        (typeof filters.salary==='number' && filters.salary>150),
        (filters.search && String(filters.search).trim().length>0),
        (!!filters.backlogOnly)
      ].filter(Boolean).length;
      countEl.textContent = String(active);
      countEl.classList.toggle('hidden', active === 0);
    } catch(e) { /* no-op */ }
  }

  function applySavedToUI(filters){
    try {
      // Status checkboxes
      if (Array.isArray(filters.status)) {
        $all('.status-filter').forEach(cb => {
          cb.checked = filters.status.includes(cb.value);
        });
      }
      // Fit score
      const fitRange = qs('fit-score-range');
      const fitVal = qs('fit-score-value');
      if (fitRange && typeof filters.fitScore==='number') {
        fitRange.value = String(filters.fitScore);
        if (fitVal) fitVal.textContent = `${filters.fitScore}+`;
      }
      // Salary
      const salRange = qs('salary-range');
      const salVal = qs('salary-value');
      if (salRange && typeof filters.salary==='number') {
        salRange.value = String(filters.salary);
        if (salVal) salVal.textContent = `$${filters.salary}k+`;
      }
      // Search
      const search = qs('search-input');
      if (search && typeof filters.search==='string') {
        search.value = filters.search;
      }
      // Backlog only
      const backlog = qs('backlog-only');
      if (backlog) backlog.checked = !!filters.backlogOnly;
    } catch(e) { /* no-op */ }
  }

  function init(){
    try {
      const saved = localStorage.getItem('jobSearchFilters');
      if (!saved) return;
      const filters = { status: [], fitScore: 0, salary: 150, search: '', backlogOnly: false, ...JSON.parse(saved) };
      applySavedToUI(filters);
      updateFilterBadge(filters);
      // Re-apply filtering if app-level handler exists
      if (typeof applyFilters === 'function') {
        try { applyFilters(); } catch(e) {}
      }
    } catch(e) {
      // ignore
    }

    // Keep badge live-updated when user adjusts controls
    try {
      const computeNow = () => {
        const f = {
          status: Array.from(document.querySelectorAll('.status-filter:checked')).map(el=>el.value),
          fitScore: parseFloat((qs('fit-score-range')||{}).value || 0) || 0,
          salary: parseInt((qs('salary-range')||{}).value || 150) || 150,
          search: (qs('search-input')||{}).value || '',
          backlogOnly: !!((qs('backlog-only')||{}).checked)
        };
        updateFilterBadge(f);
      };
      ['input','change'].forEach(evt => {
        document.addEventListener(evt, (e) => {
          const t = e.target;
          if (!t) return;
          if (t.matches?.('.status-filter, #fit-score-range, #salary-range, #search-input, #backlog-only')) {
            computeNow();
          }
        }, true);
      });
    } catch(e) { /* no-op */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// --- CSV Import: basic parser and merger ---
(function enableCsvImport(){
  function qs(id){ return document.getElementById(id); }
  const importBtn = qs('import-btn');
  const fileInput = qs('csv-input');
  if (!importBtn || !fileInput) return;

  importBtn.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const { rows, headers } = parseCSV(text);
        if (!rows.length) { showToast('No rows found in CSV', 'error'); return; }
        const added = mergeCsvRows(rows, headers);
        // Persist and refresh views
        if (typeof saveDataToStorage === 'function') saveDataToStorage();
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof renderCurrentView === 'function') renderCurrentView();
        showToast(`Imported ${added} jobs from CSV`, 'success');
      } catch(err) {
        console.error('CSV import failed', err);
        if (typeof showToast === 'function') showToast('CSV import failed', 'error');
      } finally {
        fileInput.value = '';
      }
    };
    reader.onerror = () => { if (typeof showToast === 'function') showToast('Failed to read file', 'error'); };
    reader.readAsText(file);
  });

  function parseCSV(text){
    // Simple CSV parser with basic quoted value support
    const lines = text.split(/\r?\n/).filter(l => l.trim().length>0);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = splitCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map(line => splitCsvLine(line));
    return { headers, rows };
  }
  function splitCsvLine(line){
    const out = []; let cur=''; let inQ=false;
    for (let i=0;i<line.length;i++){
      const ch=line[i];
      if (ch==='"'){
        if (inQ && line[i+1]==='"'){ cur+='"'; i++; }
        else { inQ=!inQ; }
      } else if (ch===',' && !inQ){ out.push(cur); cur=''; }
      else { cur+=ch; }
    }
    out.push(cur);
    return out;
  }

  function validateHeaders(headers){
    const required = ['company','roletitle'];
    const missing = required.filter(k => headers.indexOf(k) === -1);
    if (missing.length) {
      showToast && showToast(`Missing required columns: ${missing.join(', ')}`, 'error');
      const err = new Error('Missing columns'); err.missing = missing; throw err;
    }
  }

  function normalizeStatus(val){
    const v = String(val||'').toLowerCase().trim();
    const map = {
      'not started': 'not-started', 'not-started': 'not-started', 'new':'not-started',
      'research':'research',
      'applied':'applied', 'submitted':'applied',
      'interviewing':'interviewing', 'interview':'interviewing',
      'offer':'offer', 'offers':'offer',
      'rejected':'rejected', 'reject':'rejected', 'archived':'rejected'
    };
    return map[v] || 'not-started';
  }

  function mergeCsvRows(rows, headers){
    // Expect headers like: company,roleTitle,status,location,salary,fitScore,tags
    validateHeaders(headers);
    const idx = (name) => headers.indexOf(name.toLowerCase());
    const iCompany=idx('company'), iRole=idx('roletitle'), iStatus=idx('status'), iLoc=idx('location'), iSalary=idx('salary'), iFit=idx('fitscore'), iTags=idx('tags');
    let added=0, skipped=0;
    rows.forEach(cols => {
      const company = (cols[iCompany]||'').trim();
      const roleTitle = (cols[iRole]||'').trim();
      if (!company || !roleTitle) { skipped++; return; }
      const id = `${company} ${roleTitle}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      if (Array.isArray(jobsData) && !jobsData.find(j=>j.id===id)){
        const fitScore = Math.max(0, Math.min(10, parseFloat(cols[iFit]||'') || 0));
        const tags = (cols[iTags]||'').split(/\s*[,;]\s*/).filter(Boolean);
        const job = {
          id,
          company,
          roleTitle,
          location: (cols[iLoc]||'').trim() || 'Remote',
          status: normalizeStatus(cols[iStatus]||'not-started'),
          vibe: '😐',
          fitScore,
          salary: (cols[iSalary]||'').trim() || '$-',
          tags,
          appliedDate: null,
          notes: '',
          research: { companyIntel: '', keyPeople: [], recentNews: '', competitiveAdvantage: '', challenges: '' },
          iceBreakers: [],
          objections: [],
          fitAnalysis: '',
          activityLog: [],
          dateAdded: new Date().toISOString().slice(0,10)
        };
        jobsData.unshift(job);
        added++;
      } else {
        skipped++;
      }
    });
    // Refresh filtered dataset
    if (Array.isArray(jobsData)) {
      if (typeof applyFilters === 'function') {
        try { applyFilters(); } catch(e) { /* ignore */ }
      }
    }
    if (skipped>0 && showToast) showToast(`Skipped ${skipped} duplicate/invalid rows`, 'info');
    return added;
  }
})();

// --- Import Discovered Roles (JSON generated by discovery pipeline) ---
(function wireImportDiscovered(){
  function qs(id){ return document.getElementById(id); }
  const btn = qs('import-discovered-btn');
  if (!btn) return;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('api/discovered-roles.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !Array.isArray(data.jobs)) { showToast('No discovered roles found', 'info'); return; }
      const added = mergeDiscoveredJobs(data.jobs);
      if (typeof saveDataToStorage === 'function') saveDataToStorage();
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof renderCurrentView === 'function') renderCurrentView();
      showToast(`Imported ${added} discovered roles`, 'success');
    } catch(err) {
      console.error('Import discovered failed', err);
      showToast('Failed to import discovered roles', 'error');
    }
  });

  function mergeDiscoveredJobs(jobs){
    let added = 0;
    const existing = new Set((jobsData||[]).map(j => j.id));
    for (const j of jobs) {
      if (!j || !j.id || existing.has(j.id)) continue;
      const job = {
        id: j.id,
        company: j.company || '',
        roleTitle: j.roleTitle || '',
        location: j.location || 'Remote',
        status: 'not-started',
        vibe: j.vibe || '😐',
        fitScore: parseFloat(j.fitScore) || 0,
        salary: j.salary || '$-',
        tags: Array.isArray(j.tags) ? j.tags : [],
        appliedDate: null,
        notes: 'Imported from discovery pipeline',
        research: { companyIntel: '', keyPeople: [], recentNews: '', competitiveAdvantage: '', challenges: '' },
        iceBreakers: [],
        objections: [],
        fitAnalysis: j.fitAnalysis || '',
        activityLog: [],
        dateAdded: new Date().toISOString().slice(0,10),
        links: j.links || {},
        trust: j.trust || { network: 0, dyorNotes: [] },
        quality: j.quality || { clarity: 0, transparency: 0, burnoutRisk: 0 }
      };
      jobsData.unshift(job);
      try { pushVibeSnapshot(job, 'imported'); } catch {}
      existing.add(job.id);
      added++;
    }
    if (typeof applyFilters === 'function') { try { applyFilters(); } catch {} }
    return added;
  }
})();

// --- Archive/Backlog with "Why not" reason (Not Started) ---
function archiveJobWithReason(jobId) {
  const job = jobsData.find(j => j.id === jobId);
  if (!job) return;
  const reason = window.prompt('Why is this not a fit right now? (optional)');
  job.status = 'rejected';
  job.archiveTag = reason && reason.trim() ? 'Backlog' : 'Archive-Pending';
  if (reason && reason.trim()) job.archiveReason = reason.trim();
  if (reason && reason.trim()) {
    addRejectionActivity(job, reason.trim(), 'Why not (Not Started)');
  } else {
    // still log an archive action for traceability
    job.activityLog.push({
      date: new Date().toISOString().split('T')[0],
      type: 'Archive',
      note: 'Archived from Not Started (no reason provided)'
    });
  }
  saveDataToStorage();
  renderCurrentView();
  renderDashboard();
  showToast(`${job.company} archived${reason?` — ${reason}`:''}`, 'success');
}

// Generate remaining 48 jobs programmatically
function generateRemainingJobs() {
  const companies = [
    // Crypto/Web3 (18 more)
    { name: "Circle", sector: "Crypto", role: "VP Product - USDC Ecosystem", salary: "$275k - $350k + equity", fitScore: 9.5 },
    { name: "Polygon", sector: "Crypto", role: "Director Product Strategy", salary: "$220k - $280k + equity", fitScore: 8.9 },
    { name: "Uniswap", sector: "DeFi", role: "Head of Product - Protocol", salary: "$250k - $320k + equity", fitScore: 8.7 },
    { name: "Compound", sector: "DeFi", role: "Director Product Management", salary: "$230k - $290k + equity", fitScore: 8.8 },
    { name: "Chainlink", sector: "Oracle", role: "VP Product Strategy", salary: "$260k - $330k + equity", fitScore: 9.1 },
    { name: "Solana", sector: "L1", role: "Director Product - Developer Experience", salary: "$240k - $300k + equity", fitScore: 8.9 },
    { name: "Avalanche", sector: "L1", role: "Head of Product - Institutional", salary: "$250k - $310k + equity", fitScore: 8.7 },
    { name: "ConsenSys", sector: "Infrastructure", role: "Director Product - Infura", salary: "$220k - $280k + equity", fitScore: 8.5 },
    { name: "Alchemy", sector: "Infrastructure", role: "VP Product Platform", salary: "$250k - $320k + equity", fitScore: 9.0 },
    { name: "The Graph", sector: "Infrastructure", role: "Director Product Strategy", salary: "$230k - $290k + equity", fitScore: 8.6 },
    { name: "Kraken", sector: "Exchange", role: "Director Product - Institutional", salary: "$240k - $300k + equity", fitScore: 8.8 },
    { name: "Gemini", sector: "Exchange", role: "VP Product Management", salary: "$260k - $330k + equity", fitScore: 9.2 },
    { name: "Ripple", sector: "Payments", role: "Director Product - Enterprise", salary: "$230k - $290k + equity", fitScore: 8.4 },
    { name: "Dapper Labs", sector: "NFT", role: "Head of Product - Flow", salary: "$220k - $280k + equity", fitScore: 7.9 },
    { name: "MakerDAO", sector: "DeFi", role: "Director Product Strategy", salary: "$240k - $300k + equity", fitScore: 8.3 },
    { name: "Aave", sector: "DeFi", role: "VP Product Development", salary: "$250k - $320k + equity", fitScore: 8.7 },
    { name: "Binance US", sector: "Exchange", role: "Director Product Management", salary: "$230k - $290k + equity", fitScore: 8.1 },
    { name: "Celsius Network", sector: "Lending", role: "Head of Product - Institutional", salary: "$240k - $300k + equity", fitScore: 7.8 },
    
    // AI/ML Companies (15 roles)
    { name: "OpenAI", sector: "AI", role: "Lead Product Manager - Core Product", salary: "$300k - $400k + equity", fitScore: 9.8 },
    { name: "Anthropic", sector: "AI", role: "Product Manager - Research Commercialization", salary: "$250k - $350k + equity", fitScore: 9.5 },
    { name: "Scale AI", sector: "AI", role: "Product Manager - Gen AI Platform", salary: "$220k - $280k + equity", fitScore: 8.9 },
    { name: "Cohere", sector: "AI", role: "Director Product Strategy", salary: "$240k - $300k + equity", fitScore: 8.7 },
    { name: "Stability AI", sector: "AI", role: "Head of Product - Enterprise", salary: "$230k - $290k + equity", fitScore: 8.4 },
    { name: "Hugging Face", sector: "AI", role: "VP Product Strategy", salary: "$250k - $320k + equity", fitScore: 8.8 },
    { name: "Midjourney", sector: "AI", role: "Director Product Management", salary: "$240k - $300k + equity", fitScore: 8.2 },
    { name: "Runway", sector: "AI", role: "Head of Product - Creative Tools", salary: "$230k - $290k + equity", fitScore: 8.5 },
    { name: "Character.AI", sector: "AI", role: "Director Product Strategy", salary: "$220k - $280k + equity", fitScore: 8.1 },
    { name: "Replicate", sector: "AI", role: "VP Product Platform", salary: "$240k - $300k + equity", fitScore: 8.6 },
    { name: "LangChain", sector: "AI", role: "Director Product - Enterprise", salary: "$230k - $290k + equity", fitScore: 8.3 },
    { name: "Pinecone", sector: "AI", role: "Head of Product - Vector Database", salary: "$240k - $300k + equity", fitScore: 8.7 },
    { name: "Together AI", sector: "AI", role: "Director Product Strategy", salary: "$220k - $280k + equity", fitScore: 8.4 },
    { name: "Modal", sector: "AI", role: "VP Product Platform", salary: "$230k - $290k + equity", fitScore: 8.5 },
    { name: "Weights & Biases", sector: "AI", role: "Director Product Management", salary: "$240k - $300k + equity", fitScore: 8.8 },
    
    // Fintech/Payments (15 roles)
    { name: "Plaid", sector: "FinTech", role: "Director Product - Financial Institutions", salary: "$250k - $320k + equity", fitScore: 9.3 },
    { name: "Mercury", sector: "FinTech", role: "VP Product Strategy", salary: "$240k - $300k + equity", fitScore: 9.0 },
    { name: "Ramp", sector: "FinTech", role: "Director Product Management", salary: "$230k - $290k + equity", fitScore: 8.8 },
    { name: "Brex", sector: "FinTech", role: "Head of Product - Corporate Cards", salary: "$250k - $310k + equity", fitScore: 8.9 },
    { name: "Chime", sector: "FinTech", role: "Director Product Strategy", salary: "$220k - $280k + equity", fitScore: 8.2 },
    { name: "Affirm", sector: "FinTech", role: "VP Product - Merchant Platform", salary: "$240k - $300k + equity", fitScore: 8.5 },
    { name: "Block (Square)", sector: "FinTech", role: "Director Product - Seller Platform", salary: "$230k - $290k + equity", fitScore: 8.7 },
    { name: "Robinhood", sector: "FinTech", role: "Head of Product - Investing", salary: "$250k - $320k + equity", fitScore: 8.4 },
    { name: "Nubank", sector: "FinTech", role: "Director Product - International", salary: "$220k - $280k + equity", fitScore: 8.1 },
    { name: "Klarna", sector: "FinTech", role: "VP Product Strategy", salary: "$240k - $300k + equity", fitScore: 8.3 },
    { name: "Checkout.com", sector: "FinTech", role: "Director Product Management", salary: "$230k - $290k + equity", fitScore: 8.6 },
    { name: "Wise", sector: "FinTech", role: "Head of Product - Business", salary: "$250k - $310k + equity", fitScore: 8.8 },
    { name: "Revolut", sector: "FinTech", role: "Director Product Strategy", salary: "$220k - $280k + equity", fitScore: 8.0 },
    { name: "Monzo", sector: "FinTech", role: "VP Product Development", salary: "$240k - $300k + equity", fitScore: 8.2 },
    { name: "N26", sector: "FinTech", role: "Director Product Management", salary: "$230k - $290k + equity", fitScore: 7.9 }
  ];

  const locations = ["Remote (Global)", "Remote (US)", "San Francisco, CA", "New York, NY", "Remote (EU/US)"];
  const vibes = ["😐", "😐", "😐", "😊", "😟"]; // Mostly neutral to start
  const tags = {
    "DeFi": ["DeFi", "Protocol", "Smart Contracts", "Governance"],
    "Exchange": ["Trading", "Institutional", "Compliance", "Crypto"],
    "L1": ["Blockchain", "Protocol", "Developer Tools", "Ecosystem"],
    "Infrastructure": ["APIs", "Developer Tools", "Platform", "SaaS"],
    "AI": ["Machine Learning", "LLMs", "Platform", "Research"],
    "FinTech": ["Payments", "Banking", "Compliance", "B2B"],
    "Payments": ["International", "Enterprise", "Platform", "Compliance"]
  };

  return companies.map((company, index) => ({
    id: `${company.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${index}`,
    company: company.name,
    roleTitle: company.role,
    location: locations[index % locations.length],
    status: "not-started",
    vibe: vibes[index % vibes.length],
    fitScore: company.fitScore,
    salary: company.salary,
    tags: ["Remote", company.sector, ...(tags[company.sector] || ["Product", "Strategy"])].slice(0, 5),
    appliedDate: null,
    notes: `${company.name} is a leading ${company.sector} company with strong market position and growth trajectory.`,
    research: {
      companyIntel: `${company.name} is well-positioned in the ${company.sector} space with strong leadership and market presence.`,
      keyPeople: ["CEO", "CTO", "Head of Product"],
      recentNews: `Recent product launches and funding rounds driving growth in ${company.sector} market.`,
      competitiveAdvantage: "Strong technical team, market-leading products, and solid regulatory positioning.",
      challenges: "Competitive market dynamics and evolving regulatory landscape."
    },
    iceBreakers: [
      `How is ${company.name} approaching the current market conditions in ${company.sector}?`,
      "What are the key technical challenges you're solving?",
      "How do you see the competitive landscape evolving?"
    ],
    objections: [
      "May prefer candidates with more industry-specific experience",
      "Could question technical depth in the domain",
      "Might want more hands-on product management experience"
    ],
    fitAnalysis: `${company.fitScore >= 9.0 ? 'Excellent' : company.fitScore >= 8.5 ? 'Strong' : 'Good'} fit - aligns well with background and career progression goals.`,
    activityLog: [],
    dateAdded: "2025-09-18"
  }));
}

// Global application state
let jobsData = [...initialJobsData, ...generateRemainingJobs()];
let currentView = 'kanban';
let filteredJobs = [...jobsData];
let selectedJobs = new Set();
let currentFilters = {
  status: [],
  fitScore: 0,
  salary: 150,
  search: '',
  backlogOnly: false
};
let sortConfig = { key: null, direction: 'asc' };
let charts = {};
let draggedElement = null;
let currentEditingJob = null;
let discoveryState = { recommendations: [], lastSeed: 0 };

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // Load data from localStorage if available
  loadDataFromStorage();
  
  // Initialize filtered jobs
  filteredJobs = [...jobsData];
  
  // Bind all event listeners
  bindEventListeners();
  
  // Render initial state
  renderDashboard();
  renderCurrentView();
  
  // Initialize charts after a short delay
  setTimeout(() => {
    if (currentView === 'analytics') {
      initializeCharts();
    }
  }, 500);
  
  console.log('Job Search Optimizer initialized with', jobsData.length, 'roles');
}

// Data Persistence
function saveDataToStorage() {
  try {
    localStorage.setItem('jobSearchData', JSON.stringify(jobsData));
    localStorage.setItem('jobSearchFilters', JSON.stringify(currentFilters));
    console.log('Data saved to localStorage');
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
    showToast('Failed to save data', 'error');
  }
}

function loadDataFromStorage() {
  try {
    const savedData = localStorage.getItem('jobSearchData');
    const savedFilters = localStorage.getItem('jobSearchFilters');
    
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Only load if we have a reasonable amount of data
      if (parsed && parsed.length >= 40) {
        jobsData = parsed;
        console.log('Loaded', jobsData.length, 'jobs from localStorage');
      }
    }
    
    if (savedFilters) {
      currentFilters = { ...currentFilters, ...JSON.parse(savedFilters) };
    }
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    // Continue with default data
  }
}

function bindEventListeners() {
  // View switcher
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const view = btn.dataset.view;
      if (view) switchView(view);
    });
  });
  
  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keyup', handleSearch);
  }
  
  // Filters
  const filterBtn = document.getElementById('filter-btn');
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFilters();
    });
  }
  
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      applyFilters();
    });
  }
  
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearFilters();
    });
  }
  
  // Range sliders
  const fitScoreRange = document.getElementById('fit-score-range');
  if (fitScoreRange) {
    fitScoreRange.addEventListener('input', updateFitScoreLabel);
  }
  
  const salaryRange = document.getElementById('salary-range');
  if (salaryRange) {
    salaryRange.addEventListener('input', updateSalaryLabel);
  }
  
  // Select all checkbox
  const selectAll = document.getElementById('select-all');
  if (selectAll) {
    selectAll.addEventListener('change', handleSelectAll);
  }
  
  // Bulk actions
  const bulkEditBtn = document.getElementById('bulk-edit-btn');
  if (bulkEditBtn) {
    bulkEditBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleBulkEdit();
    });
  }
  
  const bulkArchiveBtn = document.getElementById('bulk-archive-btn');
  if (bulkArchiveBtn) {
    bulkArchiveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleBulkArchive();
    });
  }
  
  const bulkResetBtn = document.getElementById('bulk-reset-btn');
  if (bulkResetBtn) {
    bulkResetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleBulkReset();
    });
  }
  
  // Export
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleExport();
    });
  }
  
  // Quick Backlog chip toggle
  const backlogChip = document.getElementById('backlog-chip');
  if (backlogChip) {
    const syncChip = () => backlogChip.classList.toggle('is-active', !!currentFilters.backlogOnly);
    backlogChip.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.backlogOnly = !currentFilters.backlogOnly;
      const backlogCb = document.getElementById('backlog-only');
      if (backlogCb) backlogCb.checked = currentFilters.backlogOnly;
      applyAllFilters();
      updateFilterIndicator();
      saveDataToStorage();
      syncChip();
    });
    // Initialize state on load
    syncChip();
  }
  
  // Pipeline reset
  const resetPipelineBtn = document.getElementById('reset-pipeline-btn');
  if (resetPipelineBtn) {
    resetPipelineBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showResetModal();
    });
  }
  
  // Modal close handlers
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeModals();
    });
  });
  
  // Prevent modal close when clicking modal content
  document.querySelectorAll('.modal-content').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
  
  // Setup modal-specific handlers
  setupModalHandlers();
  setupActivityModal();
  setupResetModal();
}

function setupModalHandlers() {
  // Job modal handlers
  const modalCancel = document.getElementById('modal-cancel');
  if (modalCancel) {
    modalCancel.addEventListener('click', closeModals);
  }
  
  const modalSave = document.getElementById('modal-save');
  if (modalSave) {
    modalSave.addEventListener('click', saveJobChanges);
  }
}

function setupActivityModal() {
  const activitySave = document.getElementById('activity-save');
  if (activitySave) {
    activitySave.addEventListener('click', saveActivity);
  }
  
  const activityCancel = document.getElementById('activity-cancel');
  if (activityCancel) {
    activityCancel.addEventListener('click', () => {
      document.getElementById('activity-modal').classList.add('hidden');
    });
  }
  
  // Set default date to today
  const activityDate = document.getElementById('activity-date');
  if (activityDate) {
    activityDate.value = new Date().toISOString().split('T')[0];
  }

  // Show reason selector only for Rejection
  const typeSel = document.getElementById('activity-type');
  const reasonGroup = document.getElementById('activity-reason-group');
  if (typeSel && reasonGroup) {
    const toggleReason = () => {
      if (typeSel.value === 'Rejection') {
        reasonGroup.classList.remove('hidden');
      } else {
        reasonGroup.classList.add('hidden');
      }
    };
    typeSel.addEventListener('change', toggleReason);
    toggleReason();
  }
}

function setupResetModal() {
  const resetConfirm = document.getElementById('reset-confirm');
  if (resetConfirm) {
    resetConfirm.addEventListener('click', handleResetConfirm);
  }
  
  const resetCancel = document.getElementById('reset-cancel');
  if (resetCancel) {
    resetCancel.addEventListener('click', closeModals);
  }
}

// Dashboard and View Management
function renderDashboard() {
  const stats = calculateDashboardStats();
  
  const elements = {
    'total-roles': stats.total,
    'active-roles': stats.active,
    'avg-fit-score': stats.avgFitScore,
    'offers-count': stats.offers,
    'interviewing-count': stats.interviewing,
    'applied-count': stats.applied,
    'not-started-count': stats.notStarted
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  // Render Why‑Not summary widget
  try {
    const { totalReasons, top } = computeWhyNotStats();
    const sumEl = document.getElementById('why-not-summary');
    if (sumEl) sumEl.textContent = totalReasons > 0 ? `${totalReasons} notes` : '—';
    const ul = document.getElementById('why-not-list');
    if (ul) {
      ul.innerHTML = '';
      top.slice(0,5).forEach(({ reason, count }) => {
        const li = document.createElement('li');
        li.textContent = `${reason} — ${count}`;
        ul.appendChild(li);
      });
      if (totalReasons === 0) {
        const li = document.createElement('li');
        li.textContent = 'No feedback yet';
        ul.appendChild(li);
      }
    }
  } catch {}
}

function calculateDashboardStats() {
  const total = jobsData.length;
  const active = jobsData.filter(job => !['rejected'].includes(job.status)).length;
  const avgFitScore = (jobsData.reduce((sum, job) => sum + job.fitScore, 0) / total).toFixed(1);
  
  const statusCounts = jobsData.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total,
    active,
    avgFitScore,
    offers: statusCounts.offer || 0,
    interviewing: statusCounts.interviewing || 0,
    applied: statusCounts.applied || 0,
    notStarted: statusCounts['not-started'] || 0
  };
}

function computeWhyNotStats() {
  const counts = {};
  let total = 0;
  for (const job of jobsData) {
    (job.activityLog || []).forEach(a => {
      if (a.type === 'Rejection') {
        const r = String(a.reason || '').trim();
        if (r) { counts[r] = (counts[r]||0) + 1; total++; }
      }
    });
  }
  const top = Object.entries(counts).map(([reason, count]) => ({ reason, count })).sort((a,b)=>b.count-a.count);
  return { totalReasons: total, top };
}

function switchView(view) {
  if (currentView === view) return;
  
  currentView = view;
  
  // Update active button
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  // Update active view
  document.querySelectorAll('.view-content').forEach(content => {
    content.classList.toggle('active', content.id === `${view}-view`);
  });
  
  // Render the new view
  renderCurrentView();
}

function renderCurrentView() {
  switch(currentView) {
    case 'table':
      renderTableView();
      break;
    case 'kanban':
      renderKanbanView();
      break;
    case 'analytics':
      renderAnalyticsView();
      break;
    case 'discover':
      renderDiscoverView();
      break;
  }
}

// Discover View
function renderDiscoverView() {
  // Build insights and recos each time (lightweight)
  const insights = analyzeLearningSignals(jobsData);
  const insightsEl = document.getElementById('discover-insights');
  if (insightsEl) {
    insightsEl.innerHTML = `
      <div class="segment-stats">
        ${insights.topSegments.map(s => `
          <div class="segment-stat">
            <span class="segment-name">${s.name} (${s.count})</span>
            <span class="segment-score">${s.score.toFixed(2)}</span>
          </div>
        `).join('') || '<div class="empty">No signals yet. Start adding activities.</div>'}
      </div>
      <div style="margin-top:12px;">
        <h4 style="margin:0 0 8px 0;">Common Rejection Reasons</h4>
        <div class="segment-stats">
          ${insights.rejectionReasons.map(r => `
            <div class="segment-stat">
              <span class="segment-name">${r.reason}</span>
              <span class="segment-score">${r.count}</span>
            </div>
          `).join('') || '<div class="empty">No rejections logged yet.</div>'}
        </div>
      </div>
    `;
  }

  // Recommendations
  if (!discoveryState.recommendations.length) {
    discoveryState.recommendations = generateRecommendations(jobsData, insights);
  }
  const listEl = document.getElementById('discover-list');
  if (listEl) {
    if (discoveryState.recommendations.length === 0) {
      listEl.innerHTML = '<div class="empty" style="padding:12px;">No recommendations yet. Try refreshing.</div>';
    } else {
      const rows = discoveryState.recommendations.map((rec, idx) => `
        <div class="table-row" style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr auto;gap:12px;align-items:center;border-bottom:1px solid var(--border-color, #e5e7eb);padding:10px 6px;">
          <div><strong>${rec.company}</strong></div>
          <div>${rec.roleTitle}</div>
          <div><span class="fit-score-value ${getFitScoreClass(rec.expectedFit)}">${rec.expectedFit.toFixed(1)}</span></div>
          <div>${rec.sector}</div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn btn--sm btn--primary" data-add-idx="${idx}"><i class="fas fa-plus"></i> Add</button>
          </div>
        </div>
      `).join('');
      listEl.innerHTML = `
        <div class="table" role="table">
          <div role="row" style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr auto;gap:12px;font-weight:600;padding:8px 6px;opacity:0.8;">
            <div>Company</div><div>Role</div><div>Expected Fit</div><div>Sector</div><div></div>
          </div>
          ${rows}
        </div>
      `;
      // Bind add buttons
      listEl.querySelectorAll('[data-add-idx]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-add-idx'));
          addDiscoveredRole(idx);
        });
      });
    }
  }

  // Refresh button
  const refreshBtn = document.getElementById('refresh-recos-btn');
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      discoveryState.lastSeed++;
      discoveryState.recommendations = generateRecommendations(jobsData, insights, discoveryState.lastSeed);
      renderDiscoverView();
    };
  }
}

function analyzeLearningSignals(jobs) {
  // Map vibe to numeric
  const vibeScore = v => (v === '😊' ? 0.1 : v === '😟' ? -0.1 : 0);
  const sectorOf = job => job.tags.find(t => ['Crypto','DeFi','AI','FinTech','Payments','Infrastructure','Exchange','L1','Oracle'].includes(t)) || 'Other';

  // Success score per job
  const statusScore = s => s === 'offer' ? 1.0 : s === 'interviewing' ? 0.6 : s === 'applied' ? 0.2 : s === 'rejected' ? -0.5 : 0.0;

  const segMap = {};
  const rejectionCounts = {};
  jobs.forEach(job => {
    const seg = sectorOf(job);
    if (!segMap[seg]) segMap[seg] = { count: 0, score: 0 };
    segMap[seg].count++;
    segMap[seg].score += statusScore(job.status) + vibeScore(job.vibe) + (job.fitScore - 7.5) * 0.05; // center ~7.5

    // Parse rejection activities
    (job.activityLog || []).forEach(act => {
      if ((act.type || '').toLowerCase() === 'rejection') {
        const cat = (act.reason && typeof act.reason === 'string' && act.reason.trim())
          ? act.reason.trim()
          : categorizeRejectionReason(act.note || '');
        rejectionCounts[cat] = (rejectionCounts[cat] || 0) + 1;
      }
    });
  });

  const topSegments = Object.entries(segMap)
    .map(([name, v]) => ({ name, count: v.count, score: v.score / Math.max(1, v.count) }))
    .sort((a,b) => b.score - a.score)
    .slice(0, 4);

  const rejectionReasons = Object.entries(rejectionCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a,b) => b.count - a.count)
    .slice(0, 6);

  return { topSegments, rejectionReasons };
}

function categorizeRejectionReason(text) {
  const t = text.toLowerCase();
  if (/comp|salary|pay|band|budget/.test(t)) return 'Compensation';
  if (/senior|overqualified|junior|level|seniority/.test(t)) return 'Seniority/Level';
  if (/location|relocat|onsite|hybrid|visa|work auth/.test(t)) return 'Location/Visa';
  if (/timing|freeze|headcount|hiring|hold/.test(t)) return 'Timing/Headcount';
  if (/domain|industry|crypto|web3|ai|fintech|payments/.test(t)) return 'Domain Fit';
  if (/skills|experience|background|requirement|stack/.test(t)) return 'Skills/Experience';
  return 'Other';
}

function generateRecommendations(jobs, insights, seed = 0) {
  const existingKeys = new Set(jobs.map(j => `${j.company}::${j.roleTitle}`));
  const topSectors = insights.topSegments.length ? insights.topSegments.map(s => s.name) : ['Crypto','AI','FinTech','Infrastructure'];
  const catalog = getDiscoveryCatalog();

  // Score candidates by sector match + not in existing + slight randomness by seed
  const rand = (i) => ((Math.sin(i + seed * 1337) + 1) / 2); // deterministic but varied
  const recos = catalog
    .filter(c => !existingKeys.has(`${c.company}::${c.role}`))
    .map((c, i) => {
      const secBonus = topSectors.includes(c.sector) ? 0.5 : 0.0;
      const baseFit = 7.8 + (c.baseFitAdj || 0);
      const expectedFit = Math.max(6.5, Math.min(9.9, baseFit + secBonus + rand(i) * 0.6 - 0.3));
      return {
        id: `${c.company.toLowerCase().replace(/[^a-z0-9]/g,'-')}-${c.role.toLowerCase().replace(/[^a-z0-9]/g,'-')}`,
        company: c.company,
        roleTitle: c.role,
        sector: c.sector,
        expectedFit,
        tags: [c.sector, ...(c.tags || [])].slice(0,5),
        salary: c.salary || '$200k - $300k + equity',
        location: c.location || 'Remote (Global)'
      };
    })
    .sort((a,b) => b.expectedFit - a.expectedFit)
    .slice(0, 12);
  return recos;
}

function getDiscoveryCatalog() {
  // Lightweight, static catalog — extend as needed
  return [
    { company: 'Ledger', sector: 'Infrastructure', role: 'Director Product - Enterprise Wallets', tags: ['Crypto','Security'], baseFitAdj: 0.2 },
    { company: 'Fireblocks', sector: 'Infrastructure', role: 'VP Product - Institutional', tags: ['Crypto','Institutional'], baseFitAdj: 0.3 },
    { company: 'MoonPay', sector: 'Payments', role: 'Head of Product - On/Off Ramp', tags: ['FinTech','Payments'], baseFitAdj: 0.1 },
    { company: 'Plaid', sector: 'FinTech', role: 'Director Product - Identity & Risk', tags: ['Risk','Compliance'], baseFitAdj: 0.1 },
    { company: 'Ripple', sector: 'Crypto', role: 'Director Product - Liquidity Hub', tags: ['Crypto','Enterprise'], baseFitAdj: 0.1 },
    { company: 'Worldcoin', sector: 'AI', role: 'Director Product - Trust & Safety', tags: ['AI','Identity'], baseFitAdj: 0.0 },
    { company: 'Chime', sector: 'FinTech', role: 'VP Product - Platform', tags: ['Banking','Platform'], baseFitAdj: -0.1 },
    { company: 'Wise', sector: 'Payments', role: 'Head of Product - Enterprise', tags: ['FX','Compliance'], baseFitAdj: 0.0 },
    { company: 'Airtm', sector: 'FinTech', role: 'Director Product - Cross-Border', tags: ['Payments'], baseFitAdj: 0.0 },
    { company: 'OpenAI', sector: 'AI', role: 'Head of Product - Safety Systems', tags: ['AI','Safety'], baseFitAdj: 0.2 },
    { company: 'Anthropic', sector: 'AI', role: 'Director Product - Enterprise', tags: ['AI','Platform'], baseFitAdj: 0.1 },
    { company: 'Ramp', sector: 'FinTech', role: 'Director Product - Risk', tags: ['FinTech','Risk'], baseFitAdj: 0.0 },
    { company: 'Checkout.com', sector: 'Payments', role: 'Director Product - Crypto', tags: ['Payments','Crypto'], baseFitAdj: 0.1 },
    { company: 'StarkWare', sector: 'L1', role: 'Head of Product - Developer Experience', tags: ['L1','DevTools'], baseFitAdj: 0.0 },
    { company: 'EigenLayer', sector: 'Infrastructure', role: 'Director Product - Protocol', tags: ['Crypto','Protocol'], baseFitAdj: 0.0 },
  ];
}

function addDiscoveredRole(idx) {
  const rec = discoveryState.recommendations[idx];
  if (!rec) return;
  const newJob = {
    id: `${rec.id}-${Date.now()}`,
    company: rec.company,
    roleTitle: rec.roleTitle,
    location: rec.location,
    status: 'not-started',
    vibe: '😐',
    fitScore: parseFloat(rec.expectedFit.toFixed(1)),
    salary: rec.salary,
    tags: ['Remote', ...rec.tags].slice(0,5),
    appliedDate: null,
    notes: `${rec.company} (${rec.sector}) suggested by discovery engine`,
    research: {
      companyIntel: `${rec.company} operates in ${rec.sector}.`,
      keyPeople: ["CEO","CTO","Head of Product"],
      recentNews: "",
      competitiveAdvantage: "",
      challenges: ""
    },
    iceBreakers: [],
    objections: [],
    fitAnalysis: 'Suggested based on learning signals',
    activityLog: [],
    dateAdded: new Date().toISOString().split('T')[0]
  };

  jobsData.unshift(newJob);
  // Initial vibe snapshot
  try { pushVibeSnapshot(newJob, 'added from recommendations'); } catch {}
  saveDataToStorage();
  applyAllFilters();
  renderDashboard();
  showToast(`Added ${rec.company} — ${rec.roleTitle}`, 'success');
}

// Table View
function renderTableView() {
  const tbody = document.getElementById('jobs-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  filteredJobs.forEach(job => {
    const row = createTableRow(job);
    tbody.appendChild(row);
  });
  
  updateSelectAllState();
}

function createTableRow(job) {
  const row = document.createElement('tr');
  row.dataset.jobId = job.id;
  
  const isSelected = selectedJobs.has(job.id);
  
  // Create checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = isSelected;
  checkbox.addEventListener('change', () => toggleJobSelection(job.id));
  
  // Create action buttons
  const viewBtn = document.createElement('button');
  viewBtn.className = 'action-btn';
  viewBtn.title = 'View Details';
  viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
  viewBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    viewJobDetails(job.id);
  });
  
  const editBtn = document.createElement('button');
  editBtn.className = 'action-btn';
  editBtn.title = 'Edit';
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    editJob(job.id);
  });
  
  row.innerHTML = `
    <td class="select-col"></td>
    <td class="company-cell">${job.company}</td>
    <td class="role-cell">
      <div class="role-title">${job.roleTitle}</div>
      ${renderMiniBadges(job)}
    </td>
    <td>
      <span class="status-badge ${job.status}">${formatStatus(job.status)}</span>
      ${job.archiveTag ? `<span class="status-badge muted" title="${job.archiveReason||job.archiveTag}">${job.archiveTag}</span>` : ''}
    </td>
    <td class="fit-score">
      <span class="fit-score-value ${getFitScoreClass(job.fitScore)}">${job.fitScore}</span>
      <span class="vibe-indicator">${job.vibe} ${vibeTrendArrow(job)}</span>
    </td>
    <td class="salary-cell">${job.salary}</td>
    <td class="date-cell">${job.appliedDate ? formatDate(job.appliedDate) : '-'}</td>
    <td class="actions-cell"></td>
  `;
  
  // Insert the actual elements
  row.querySelector('.select-col').appendChild(checkbox);
  const actionsCell = row.querySelector('.actions-cell');
  actionsCell.appendChild(viewBtn);
  actionsCell.appendChild(editBtn);
  
  // Quick archive/backlog for not-started with "why not" feedback
  if (job.status === 'not-started') {
    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'action-btn';
    archiveBtn.title = 'Archive (capture why-not feedback)';
    archiveBtn.innerHTML = '<i class="fas fa-box-archive"></i>';
    archiveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      archiveJobWithReason(job.id);
    });
    actionsCell.appendChild(archiveBtn);
  }
  
  return row;
}

function renderMiniBadges(job) {
  try {
    const trust = job.trust || {};
    const quality = job.quality || {};
    const bits = [];
    if (typeof trust.network === 'number') {
      if (trust.network >= 1) bits.push(`<span class="mini-badge trust-pos" title="Trusted network signal">🛡️</span>`);
      else if (trust.network <= -1) bits.push(`<span class="mini-badge trust-neg" title="Network red flag">⚠️</span>`);
    }
    if (typeof quality.burnoutRisk === 'number' && quality.burnoutRisk >= 1) {
      bits.push(`<span class="mini-badge burnout-high" title="Potential burnout risk">🔥</span>`);
    }
    if (typeof quality.transparency === 'number' && quality.transparency > 0) {
      bits.push(`<span class="mini-badge transparency" title="Transparency signals present">✅</span>`);
    }
    if (!bits.length) return '';
    return `<div class="mini-badges">${bits.join('')}</div>`;
  } catch { return ''; }
}

function pushVibeSnapshot(job, context) {
  if (!job) return;
  job.activityLog = job.activityLog || [];
  job.activityLog.push({
    date: new Date().toISOString().split('T')[0],
    type: 'Vibe',
    note: `Vibe snapshot (${context || 'event'}): ${job.vibe}`
  });
}

function vibeTrendArrow(job) {
  try {
    const hist = (job.activityLog || []).filter(a => a.type === 'Vibe').slice(-3);
    if (hist.length < 2) return '';
    const map = { '😞': 1, '😐': 2, '😊': 3 };
    const last = hist[hist.length - 1].note.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    const first = hist[0].note.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    const lv = last ? (map[last[0]] || 0) : 0;
    const fv = first ? (map[first[0]] || 0) : 0;
    if (lv > fv) return '↑';
    if (lv < fv) return '↓';
    return '→';
  } catch { return ''; }
}

// Kanban View with Fixed Drag and Drop
function renderKanbanView() {
  const statuses = ['not-started', 'research', 'applied', 'interviewing', 'offer', 'rejected'];
  
  statuses.forEach(status => {
    const column = document.getElementById(`${status}-column`);
    const countEl = document.getElementById(`${status}-kanban-count`);
    
    if (!column || !countEl) return;
    
    const jobs = filteredJobs.filter(job => job.status === status);
    countEl.textContent = jobs.length;
    
    column.innerHTML = '';
    jobs.forEach(job => {
      const card = createKanbanCard(job);
      column.appendChild(card);
    });
    
    // Setup drop zone
    setupColumnDropZone(column, status);
  });
}

function createKanbanCard(job) {
  const card = document.createElement('div');
  card.className = 'kanban-card';
  card.dataset.jobId = job.id;
  card.draggable = true;
  
  card.innerHTML = `
    <div class="kanban-card-header">
      <span class="kanban-card-company">${job.company}</span>
      <div class="kanban-card-fit">
        <span class="fit-score-value ${getFitScoreClass(job.fitScore)}">${job.fitScore}</span>
        <span class="vibe-indicator">${job.vibe}</span>
      </div>
    </div>
    <div class="kanban-card-title">${job.roleTitle}</div>
    <div class="kanban-card-meta">
      <span class="kanban-card-location">${job.location}</span>
      <span class="kanban-card-salary">${job.salary.split(' ')[0]}</span>
      ${job.archiveTag ? `<span class="kanban-badge" title="${job.archiveReason||job.archiveTag}">${job.archiveTag}</span>` : ''}
      ${renderMiniBadges(job)}
    </div>
  `;
  
  // Add event listeners
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);
  
  // Add click handler for modal
  card.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    viewJobDetails(job.id);
  });
  
  return card;
}

function setupColumnDropZone(column, status) {
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });
  
  column.addEventListener('drop', (e) => {
    e.preventDefault();
    handleDrop(e, status);
  });
  
  column.addEventListener('dragenter', (e) => {
    e.preventDefault();
    const columnEl = e.currentTarget.closest('.kanban-column');
    if (columnEl) columnEl.classList.add('drag-over');
  });
  
  column.addEventListener('dragleave', (e) => {
    const columnEl = e.currentTarget.closest('.kanban-column');
    if (columnEl && !columnEl.contains(e.relatedTarget)) {
      columnEl.classList.remove('drag-over');
    }
  });
}

function handleDragStart(e) {
  draggedElement = e.target;
  e.target.classList.add('dragging');
  
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.target.dataset.jobId);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  
  // Remove drag-over class from all columns
  document.querySelectorAll('.kanban-column').forEach(col => {
    col.classList.remove('drag-over');
  });
  
  draggedElement = null;
}

function handleDrop(e, newStatus) {
  e.preventDefault();
  
  const column = e.target.closest('.kanban-column');
  if (column) {
    column.classList.remove('drag-over');
  }
  
  const jobId = e.dataTransfer.getData('text/plain');
  if (!jobId) return;
  
  const job = jobsData.find(j => j.id === jobId);
  
  if (job && job.status !== newStatus) {
    const oldStatus = job.status;
    job.status = newStatus;
    
    // Add activity log entry
    job.activityLog.push({
      date: new Date().toISOString().split('T')[0],
      type: 'Status Change',
      note: `Moved from ${formatStatus(oldStatus)} to ${formatStatus(newStatus)}`
    });

    // Snapshot vibe at status change for trend over time
    try { pushVibeSnapshot(job, `status→${newStatus}`); } catch {}
    
    // Update applied date if moving to applied status
    if (newStatus === 'applied' && !job.appliedDate) {
      job.appliedDate = new Date().toISOString().split('T')[0];
    }

    // Quick rejection reason capture
    if (newStatus === 'rejected') {
      const reason = promptRejectionReason();
      if (reason) {
        addRejectionActivity(job, reason, 'Captured on status change');
      }
    }
    
    // Save to localStorage
    saveDataToStorage();
    
    // Re-render views
    renderKanbanView();
    renderDashboard();
    
    showToast(`${job.company} moved to ${formatStatus(newStatus)}`, 'success');
  }
}

function promptRejectionReason() {
  const options = [
    'Compensation',
    'Seniority/Level',
    'Location/Visa',
    'Timing/Headcount',
    'Domain Fit',
    'Skills/Experience',
    'Other'
  ];
  const input = window.prompt(
    'Rejection reason?\n1) Compensation\n2) Seniority/Level\n3) Location/Visa\n4) Timing/Headcount\n5) Domain Fit\n6) Skills/Experience\n7) Other\n\nEnter number or type a custom reason (Esc to skip).'
  );
  if (!input) return '';
  const n = parseInt(input.trim(), 10);
  if (!isNaN(n) && n >= 1 && n <= options.length) return options[n - 1];
  return input.trim();
}

function addRejectionActivity(job, reason, notes = '') {
  job.activityLog.push({
    date: new Date().toISOString().split('T')[0],
    type: 'Rejection',
    note: notes,
    reason
  });
  // Keep activity log sorted newest first
  job.activityLog.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Job Details and Editing - FIXED MODAL FUNCTIONALITY
function viewJobDetails(jobId) {
  const job = jobsData.find(j => j.id === jobId);
  if (!job) {
    console.error('Job not found:', jobId);
    return;
  }
  
  currentEditingJob = { ...job }; // Create a copy for editing
  
  const modal = document.getElementById('job-modal');
  const title = document.getElementById('modal-job-title');
  const body = document.getElementById('modal-body');
  
  if (!modal || !title || !body) {
    console.error('Modal elements not found');
    return;
  }
  
  title.textContent = `${job.company} - ${job.roleTitle}`;
  body.innerHTML = createJobEditForm(job);
  modal.classList.remove('hidden');
  
  console.log('Modal opened for job:', job.company);
}

function editJob(jobId) {
  viewJobDetails(jobId);
}

function createJobEditForm(job) {
  return `
    <div class="job-edit-form">
      <!-- Basic Information -->
      <div class="form-section">
        <h4>Job Information</h4>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Company</label>
            <input type="text" class="form-control" id="edit-company" value="${job.company}">
          </div>
          <div class="form-group">
            <label class="form-label">Role Title</label>
            <input type="text" class="form-control" id="edit-role" value="${job.roleTitle}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-control" id="edit-location" value="${job.location}">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="edit-status">
              <option value="not-started" ${job.status === 'not-started' ? 'selected' : ''}>Not Started</option>
              <option value="research" ${job.status === 'research' ? 'selected' : ''}>Research</option>
              <option value="applied" ${job.status === 'applied' ? 'selected' : ''}>Applied</option>
              <option value="interviewing" ${job.status === 'interviewing' ? 'selected' : ''}>Interviewing</option>
              <option value="offer" ${job.status === 'offer' ? 'selected' : ''}>Offer</option>
              <option value="rejected" ${job.status === 'rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Salary</label>
            <input type="text" class="form-control" id="edit-salary" value="${job.salary}">
          </div>
          <div class="form-group">
            <label class="form-label">Fit Score</label>
            <input type="number" class="form-control" id="edit-fit-score" min="0" max="10" step="0.1" value="${job.fitScore}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Vibe</label>
            <select class="form-control" id="edit-vibe">
              <option value="😊" ${job.vibe === '😊' ? 'selected' : ''}>😊 Positive</option>
              <option value="😐" ${job.vibe === '😐' ? 'selected' : ''}>😐 Neutral</option>
              <option value="😟" ${job.vibe === '😟' ? 'selected' : ''}>😟 Concerned</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Applied Date</label>
            <input type="date" class="form-control" id="edit-applied-date" value="${job.appliedDate || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tags (comma-separated)</label>
          <input type="text" class="form-control" id="edit-tags" value="${job.tags.join(', ')}">
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-control" id="edit-notes" rows="3">${job.notes}</textarea>
        </div>
      </div>

      <!-- Research Section -->
      <div class="form-section">
        <h4>Company Research</h4>
        <div class="form-group">
          <label class="form-label">Company Intel</label>
          <textarea class="form-control" id="edit-company-intel" rows="2">${job.research.companyIntel}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Recent News</label>
          <textarea class="form-control" id="edit-recent-news" rows="2">${job.research.recentNews}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Competitive Advantage</label>
          <textarea class="form-control" id="edit-competitive-advantage" rows="2">${job.research.competitiveAdvantage}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Challenges</label>
          <textarea class="form-control" id="edit-challenges" rows="2">${job.research.challenges}</textarea>
        </div>
      </div>

      <!-- Ice Breakers -->
      <div class="form-section">
        <h4>Ice Breakers</h4>
        <div class="editable-list" id="ice-breakers-list">
          ${job.iceBreakers.map((ice, index) => `
            <div class="editable-list-item">
              <input type="text" value="${ice.replace(/"/g, '&quot;')}" data-index="${index}">
              <button type="button" onclick="removeIceBreaker(${index})"><i class="fas fa-trash"></i></button>
            </div>
          `).join('')}
        </div>
        <button type="button" class="add-item-btn" onclick="addIceBreaker()">
          <i class="fas fa-plus"></i> Add Ice Breaker
        </button>
      </div>

      <!-- Objections -->
      <div class="form-section">
        <h4>Potential Objections</h4>
        <div class="editable-list" id="objections-list">
          ${job.objections.map((obj, index) => `
            <div class="editable-list-item">
              <input type="text" value="${obj.replace(/"/g, '&quot;')}" data-index="${index}">
              <button type="button" onclick="removeObjection(${index})"><i class="fas fa-trash"></i></button>
            </div>
          `).join('')}
        </div>
        <button type="button" class="add-item-btn" onclick="addObjection()">
          <i class="fas fa-plus"></i> Add Objection
        </button>
      </div>

      <!-- Fit Analysis -->
      <div class="form-section">
        <h4>Fit Analysis</h4>
        <div class="form-group">
          <label class="form-label">Why This Role Matches</label>
          <textarea class="form-control" id="edit-fit-analysis" rows="3">${job.fitAnalysis}</textarea>
        </div>
      </div>

      <!-- Activity Timeline -->
      <div class="form-section">
        <h4>Activity Timeline</h4>
        <div class="activity-timeline" id="activity-timeline">
          ${job.activityLog.map((activity, index) => `
            <div class="activity-item">
              <div class="activity-date">${formatDate(activity.date)}</div>
              <div class="activity-content">
                <div class="activity-type">${activity.type}</div>
                <div class="activity-note">${activity.note}${(activity.type === 'Rejection' && activity.reason) ? ` <em>(Reason: ${activity.reason})</em>` : ''}</div>
              </div>
              <div class="activity-actions">
                <button class="activity-delete-btn" onclick="removeActivity(${index})">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn btn--outline btn--sm" onclick="showAddActivityModal()">
          <i class="fas fa-plus"></i> Add Activity
        </button>
      </div>
    </div>
  `;
}

function saveJobChanges() {
  if (!currentEditingJob) return;
  
  // Find the original job
  const jobIndex = jobsData.findIndex(j => j.id === currentEditingJob.id);
  if (jobIndex === -1) return;
  
  const prevStatus = jobsData[jobIndex].status;
  const prevVibe = jobsData[jobIndex].vibe;
  // Collect form data
  const updatedJob = {
    ...jobsData[jobIndex],
    company: document.getElementById('edit-company')?.value || jobsData[jobIndex].company,
    roleTitle: document.getElementById('edit-role')?.value || jobsData[jobIndex].roleTitle,
    location: document.getElementById('edit-location')?.value || jobsData[jobIndex].location,
    status: document.getElementById('edit-status')?.value || jobsData[jobIndex].status,
    salary: document.getElementById('edit-salary')?.value || jobsData[jobIndex].salary,
    fitScore: parseFloat(document.getElementById('edit-fit-score')?.value) || jobsData[jobIndex].fitScore,
    vibe: document.getElementById('edit-vibe')?.value || jobsData[jobIndex].vibe,
    appliedDate: document.getElementById('edit-applied-date')?.value || jobsData[jobIndex].appliedDate,
    notes: document.getElementById('edit-notes')?.value || jobsData[jobIndex].notes,
    fitAnalysis: document.getElementById('edit-fit-analysis')?.value || jobsData[jobIndex].fitAnalysis
  };
  
  // Update tags
  const tagsValue = document.getElementById('edit-tags')?.value || '';
  updatedJob.tags = tagsValue.split(',').map(tag => tag.trim()).filter(tag => tag);
  
  // Update research
  updatedJob.research = {
    ...jobsData[jobIndex].research,
    companyIntel: document.getElementById('edit-company-intel')?.value || jobsData[jobIndex].research.companyIntel,
    recentNews: document.getElementById('edit-recent-news')?.value || jobsData[jobIndex].research.recentNews,
    competitiveAdvantage: document.getElementById('edit-competitive-advantage')?.value || jobsData[jobIndex].research.competitiveAdvantage,
    challenges: document.getElementById('edit-challenges')?.value || jobsData[jobIndex].research.challenges
  };
  
  // Update ice breakers
  const iceBreakersInputs = document.querySelectorAll('#ice-breakers-list input');
  updatedJob.iceBreakers = Array.from(iceBreakersInputs).map(input => input.value).filter(val => val);
  
  // Update objections
  const objectionsInputs = document.querySelectorAll('#objections-list input');
  updatedJob.objections = Array.from(objectionsInputs).map(input => input.value).filter(val => val);
  
  // Update the job in the array
  jobsData[jobIndex] = updatedJob;

  // If vibe changed, log vibe change
  if (updatedJob.vibe !== prevVibe) {
    jobsData[jobIndex].activityLog.push({
      date: new Date().toISOString().split('T')[0],
      type: 'Vibe',
      note: `Vibe changed ${prevVibe} → ${updatedJob.vibe}`
    });
  }

  // If status was changed to rejected, capture reason quickly
  if (prevStatus !== 'rejected' && updatedJob.status === 'rejected') {
    const reason = promptRejectionReason();
    if (reason) {
      addRejectionActivity(jobsData[jobIndex], reason, 'Captured on save');
    }
  }
  
  // Save to localStorage
  saveDataToStorage();
  
  // Close modal and refresh views
  closeModals();
  applyAllFilters();
  renderCurrentView();
  renderDashboard();
  
  showToast('Job updated successfully', 'success');
}

// Search and Filter Functions - FIXED
function handleSearch(e) {
  currentFilters.search = e.target.value.toLowerCase();
  applyAllFilters();
}

function toggleFilters() {
  const panel = document.getElementById('filters-panel');
  const btn = document.getElementById('filter-btn');
  
  if (!panel || !btn) return;
  
  panel.classList.toggle('hidden');
  btn.classList.toggle('active');
}

function applyFilters() {
  // Get status filters
  currentFilters.status = Array.from(document.querySelectorAll('.status-filter:checked'))
    .map(cb => cb.value);
  
  // Get range filters
  const fitScoreRange = document.getElementById('fit-score-range');
  if (fitScoreRange) {
    currentFilters.fitScore = parseFloat(fitScoreRange.value);
  }
  
  const salaryRange = document.getElementById('salary-range');
  if (salaryRange) {
    currentFilters.salary = parseInt(salaryRange.value);
  }
  
  // Backlog only
  const backlog = document.getElementById('backlog-only');
  if (backlog) {
    currentFilters.backlogOnly = !!backlog.checked;
  }
  
  applyAllFilters();
  updateFilterIndicator();
  saveDataToStorage();
}

function applyAllFilters() {
  filteredJobs = jobsData.filter(job => {
    // Search filter
    if (currentFilters.search) {
      const searchText = `${job.company} ${job.roleTitle} ${job.tags.join(' ')}`.toLowerCase();
      if (!searchText.includes(currentFilters.search)) {
        return false;
      }
    }
    
    // Status filter
    if (currentFilters.status.length > 0 && !currentFilters.status.includes(job.status)) {
      return false;
    }
    
    // Fit score filter
    if (job.fitScore < currentFilters.fitScore) {
      return false;
    }
    
    // Salary filter
    const salaryMatch = job.salary.match(/\$(\d+)k/);
    if (salaryMatch) {
      const salaryNum = parseInt(salaryMatch[1]);
      if (salaryNum < currentFilters.salary) {
        return false;
      }
    }
    
    // Backlog-only tag filter
    if (currentFilters.backlogOnly) {
      if (job.status !== 'rejected') return false;
      if ((job.archiveTag || '') !== 'Backlog') return false;
    }
    
    return true;
  });
  
  renderCurrentView();
}

function clearFilters() {
  currentFilters = {
    status: [],
    fitScore: 0,
    salary: 150,
    search: '',
    backlogOnly: false
  };
  
  // Reset UI
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  
  document.querySelectorAll('.status-filter').forEach(cb => cb.checked = false);
  
  const fitScoreRange = document.getElementById('fit-score-range');
  if (fitScoreRange) fitScoreRange.value = 0;
  const salaryRange = document.getElementById('salary-range');
  if (salaryRange) salaryRange.value = 150;
  const backlog = document.getElementById('backlog-only');
  if (backlog) backlog.checked = false;
  updateFitScoreLabel();
  updateSalaryLabel();
  
  applyAllFilters();
  updateFilterIndicator();
  saveDataToStorage();
}

function updateFilterIndicator() {
  const activeFilters = [
    ...currentFilters.status,
    currentFilters.fitScore > 0 ? 'fit-score' : null,
    currentFilters.salary > 150 ? 'salary' : null,
    currentFilters.search ? 'search' : null,
    currentFilters.backlogOnly ? 'backlog' : null
  ].filter(Boolean);
  
  const countEl = document.getElementById('filter-count');
  if (!countEl) return;
  
  if (activeFilters.length > 0) {
    countEl.textContent = activeFilters.length;
    countEl.classList.remove('hidden');
  } else {
    countEl.classList.add('hidden');
  }
}

function updateFitScoreLabel() {
  const range = document.getElementById('fit-score-range');
  const label = document.getElementById('fit-score-value');
  if (range && label) {
    label.textContent = range.value + '+';
  }
}

function updateSalaryLabel() {
  const range = document.getElementById('salary-range');
  const label = document.getElementById('salary-value');
  if (range && label) {
    label.textContent = '$' + range.value + 'k+';
  }
}

// Activity Management
function showAddActivityModal() {
  const modal = document.getElementById('activity-modal');
  if (modal) {
    modal.classList.remove('hidden');
    // Reset form
    document.getElementById('activity-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('activity-type').value = 'Research';
    const reasonGroup = document.getElementById('activity-reason-group');
    const reasonSel = document.getElementById('activity-reason');
    if (reasonGroup) reasonGroup.classList.add('hidden');
    if (reasonSel) reasonSel.value = '';
    document.getElementById('activity-notes').value = '';
  }
}

function saveActivity() {
  if (!currentEditingJob) return;
  
  const type = document.getElementById('activity-type')?.value;
  const date = document.getElementById('activity-date')?.value;
  const notes = document.getElementById('activity-notes')?.value;
  const reason = document.getElementById('activity-reason')?.value || '';
  
  if (!type || !date) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  // Find the job and add the activity
  const job = jobsData.find(j => j.id === currentEditingJob.id);
  if (job) {
    const entry = {
      date,
      type,
      note: notes || ''
    };
    if (type === 'Rejection' && reason) entry.reason = reason;
    job.activityLog.push(entry);
    
    // Sort activity log by date (newest first)
    job.activityLog.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    saveDataToStorage();
    
    // Update the current editing job copy
    currentEditingJob = { ...job };
    
    // Refresh the modal content
    const body = document.getElementById('modal-body');
    if (body) {
      body.innerHTML = createJobEditForm(job);
    }
  }
  
  // Close activity modal
  document.getElementById('activity-modal').classList.add('hidden');
  showToast('Activity added successfully', 'success');
}

function removeActivity(index) {
  if (!currentEditingJob) return;
  
  const job = jobsData.find(j => j.id === currentEditingJob.id);
  if (job && job.activityLog[index]) {
    job.activityLog.splice(index, 1);
    saveDataToStorage();
    
    // Update the current editing job copy
    currentEditingJob = { ...job };
    
    // Refresh the modal content
    const body = document.getElementById('modal-body');
    if (body) {
      body.innerHTML = createJobEditForm(job);
    }
    
    showToast('Activity removed', 'success');
  }
}

// Ice Breakers and Objections Management
function addIceBreaker() {
  const list = document.getElementById('ice-breakers-list');
  if (list) {
    const index = list.children.length;
    const item = document.createElement('div');
    item.className = 'editable-list-item';
    item.innerHTML = `
      <input type="text" value="" data-index="${index}" placeholder="Enter ice breaker question...">
      <button type="button" onclick="removeIceBreaker(${index})"><i class="fas fa-trash"></i></button>
    `;
    list.appendChild(item);
  }
}

function removeIceBreaker(index) {
  const item = document.querySelector(`#ice-breakers-list .editable-list-item:nth-child(${index + 1})`);
  if (item) {
    item.remove();
  }
}

function addObjection() {
  const list = document.getElementById('objections-list');
  if (list) {
    const index = list.children.length;
    const item = document.createElement('div');
    item.className = 'editable-list-item';
    item.innerHTML = `
      <input type="text" value="" data-index="${index}" placeholder="Enter potential objection...">
      <button type="button" onclick="removeObjection(${index})"><i class="fas fa-trash"></i></button>
    `;
    list.appendChild(item);
  }
}

function removeObjection(index) {
  const item = document.querySelector(`#objections-list .editable-list-item:nth-child(${index + 1})`);
  if (item) {
    item.remove();
  }
}

// Selection and Bulk Actions
function toggleJobSelection(jobId) {
  if (selectedJobs.has(jobId)) {
    selectedJobs.delete(jobId);
  } else {
    selectedJobs.add(jobId);
  }
  updateBulkActions();
  renderCurrentView();
}

function handleSelectAll(e) {
  if (e.target.checked) {
    filteredJobs.forEach(job => selectedJobs.add(job.id));
  } else {
    selectedJobs.clear();
  }
  updateBulkActions();
  renderCurrentView();
}

function updateSelectAllState() {
  const selectAll = document.getElementById('select-all');
  if (!selectAll) return;
  
  const visibleJobIds = new Set(filteredJobs.map(job => job.id));
  const selectedVisibleJobs = Array.from(selectedJobs).filter(id => visibleJobIds.has(id));
  
  if (selectedVisibleJobs.length === 0) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  } else if (selectedVisibleJobs.length === filteredJobs.length) {
    selectAll.checked = true;
    selectAll.indeterminate = false;
  } else {
    selectAll.checked = false;
    selectAll.indeterminate = true;
  }
}

function updateBulkActions() {
  const bulkActions = document.getElementById('bulk-actions');
  const counter = document.getElementById('bulk-counter');
  
  if (!bulkActions || !counter) return;
  
  if (selectedJobs.size > 0) {
    bulkActions.classList.remove('hidden');
    counter.textContent = `${selectedJobs.size} selected`;
  } else {
    bulkActions.classList.add('hidden');
  }
  
  updateSelectAllState();
}

function handleBulkEdit() {
  if (selectedJobs.size === 0) return;
  
  const newStatus = prompt('Enter new status for selected jobs:\n- not-started\n- research\n- applied\n- interviewing\n- offer\n- rejected');
  
  if (newStatus && ['not-started', 'research', 'applied', 'interviewing', 'offer', 'rejected'].includes(newStatus)) {
    let bulkReason = '';
    if (newStatus === 'rejected') {
      bulkReason = promptRejectionReason();
    }
    selectedJobs.forEach(jobId => {
      const job = jobsData.find(j => j.id === jobId);
      if (job) {
        job.status = newStatus;
        job.activityLog.push({
          date: new Date().toISOString().split('T')[0],
          type: 'Bulk Update',
          note: `Status changed to ${formatStatus(newStatus)} via bulk action`
        });
        if (newStatus === 'rejected' && bulkReason) {
          addRejectionActivity(job, bulkReason, 'Captured via bulk edit');
        }
      }
    });
    
    const selectedCount = selectedJobs.size;
    selectedJobs.clear();
    saveDataToStorage();
    applyAllFilters();
    updateBulkActions();
    renderDashboard();
    showToast(`Updated ${selectedCount} jobs to ${formatStatus(newStatus)}`, 'success');
  }
}

function handleBulkArchive() {
  if (selectedJobs.size === 0) return;
  
  if (confirm(`Archive ${selectedJobs.size} selected jobs?`)) {
    // Ask once for a rejection reason to apply to all
    const bulkReason = promptRejectionReason();
    selectedJobs.forEach(jobId => {
      const job = jobsData.find(j => j.id === jobId);
      if (job) {
        job.status = 'rejected';
        job.archiveTag = bulkReason ? 'Backlog' : 'Archive-Pending';
        if (bulkReason) job.archiveReason = bulkReason;
        job.activityLog.push({
          date: new Date().toISOString().split('T')[0],
          type: 'Archived',
          note: 'Job archived via bulk action'
        });
        if (bulkReason) {
          addRejectionActivity(job, bulkReason, 'Captured via bulk archive');
        }
      }
    });
    
    const selectedCount = selectedJobs.size;
    selectedJobs.clear();
    saveDataToStorage();
    applyAllFilters();
    updateBulkActions();
    renderDashboard();
    showToast(`Archived ${selectedCount} jobs`, 'success');
  }
}

function handleBulkReset() {
  if (selectedJobs.size === 0) return;
  
  if (confirm(`Reset ${selectedJobs.size} selected jobs to 'Not Started' status?`)) {
    selectedJobs.forEach(jobId => {
      const job = jobsData.find(j => j.id === jobId);
      if (job) {
        job.status = 'not-started';
        job.appliedDate = null;
        job.activityLog.push({
          date: new Date().toISOString().split('T')[0],
          type: 'Reset',
          note: 'Job reset to Not Started via bulk action'
        });
      }
    });
    
    const selectedCount = selectedJobs.size;
    selectedJobs.clear();
    saveDataToStorage();
    applyAllFilters();
    updateBulkActions();
    renderDashboard();
    showToast(`Reset ${selectedCount} jobs`, 'success');
  }
}

// Export Functions
function handleExport() {
  const csvContent = exportToCSV(filteredJobs);
  downloadCSV(csvContent, 'job-search-data.csv');
  showToast('Data exported successfully', 'success');
}

function exportToCSV(jobs) {
  const headers = ['Company', 'Role', 'Status', 'Fit Score', 'Salary', 'Applied Date', 'Location', 'Notes', 'Tags', 'Archive Tag', 'Archive Reason'];
  
  const rows = jobs.map(job => [
    job.company,
    job.roleTitle,
    job.status,
    job.fitScore,
    job.salary,
    job.appliedDate || '',
    job.location,
    job.notes || '',
    job.tags.join('; '),
    job.archiveTag || '',
    job.archiveReason || ''
  ]);
  
  return [headers, ...rows].map(row => 
    row.map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Analytics View
function renderAnalyticsView() {
  setTimeout(() => {
    initializeCharts();
    renderSegmentStats();
  }, 100);
}

function initializeCharts() {
  initSuccessRateChart();
  initFitScoreChart();
  initTimelineChart();
}

function initSuccessRateChart() {
  const ctx = document.getElementById('success-rate-chart');
  if (!ctx) return;
  
  if (charts.successRate) {
    charts.successRate.destroy();
  }
  
  const statusCounts = calculateDashboardStats();
  
  charts.successRate = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Not Started', 'Research', 'Applied', 'Interviewing', 'Offers', 'Rejected'],
      datasets: [{
        data: [
          statusCounts.notStarted,
          jobsData.filter(j => j.status === 'research').length,
          statusCounts.applied,
          statusCounts.interviewing,
          statusCounts.offers,
          jobsData.filter(j => j.status === 'rejected').length
        ],
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function initFitScoreChart() {
  const ctx = document.getElementById('fit-score-chart');
  if (!ctx) return;
  
  if (charts.fitScore) {
    charts.fitScore.destroy();
  }
  
  const buckets = { '6.0-6.9': 0, '7.0-7.9': 0, '8.0-8.9': 0, '9.0-9.9': 0, '10.0': 0 };
  jobsData.forEach(job => {
    const score = job.fitScore;
    if (score >= 10.0) buckets['10.0']++;
    else if (score >= 9.0) buckets['9.0-9.9']++;
    else if (score >= 8.0) buckets['8.0-8.9']++;
    else if (score >= 7.0) buckets['7.0-7.9']++;
    else buckets['6.0-6.9']++;
  });
  
  charts.fitScore = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(buckets),
      datasets: [{
        label: 'Number of Roles',
        data: Object.values(buckets),
        backgroundColor: '#1FB8CD'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function initTimelineChart() {
  const ctx = document.getElementById('timeline-chart');
  if (!ctx) return;
  
  if (charts.timeline) {
    charts.timeline.destroy();
  }
  
  charts.timeline = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Research Activities',
          data: [15, 20, 12, 18],
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          tension: 0.4
        },
        {
          label: 'Applications',
          data: [0, 2, 5, 8],
          borderColor: '#FFC185',
          backgroundColor: 'rgba(255, 193, 133, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function renderSegmentStats() {
  const segmentStats = {};
  
  jobsData.forEach(job => {
    const sector = job.tags.find(tag => ['Crypto', 'AI', 'FinTech', 'DeFi'].includes(tag)) || 'Other';
    if (!segmentStats[sector]) {
      segmentStats[sector] = { total: 0, totalScore: 0 };
    }
    segmentStats[sector].total++;
    segmentStats[sector].totalScore += job.fitScore;
  });
  
  const sortedSegments = Object.entries(segmentStats)
    .map(([name, data]) => ({
      name,
      avgScore: (data.totalScore / data.total).toFixed(1),
      count: data.total
    }))
    .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore));
  
  const container = document.getElementById('segment-stats');
  if (!container) return;
  
  container.innerHTML = sortedSegments.map(segment => `
    <div class="segment-stat">
      <span class="segment-name">${segment.name} (${segment.count})</span>
      <span class="segment-score">${segment.avgScore}</span>
    </div>
  `).join('');
}

// Reset Pipeline Functions
function showResetModal() {
  const modal = document.getElementById('reset-modal');
  if (!modal) return;
  
  modal.classList.remove('hidden');
}

function handleResetConfirm() {
  const resetStages = document.getElementById('reset-stages');
  const resetDates = document.getElementById('reset-dates');
  const resetNotes = document.getElementById('reset-notes');
  
  if ((!resetStages || !resetStages.checked) && 
      (!resetDates || !resetDates.checked) && 
      (!resetNotes || !resetNotes.checked)) {
    showToast('Please select at least one reset option', 'error');
    return;
  }
  
  let resetCount = 0;
  
  jobsData.forEach(job => {
    if (resetStages && resetStages.checked) {
      job.status = 'not-started';
      resetCount++;
    }
    if (resetDates && resetDates.checked) {
      job.appliedDate = null;
    }
    if (resetNotes && resetNotes.checked) {
      job.notes = '';
      job.activityLog = [];
    }
  });
  
  saveDataToStorage();
  closeModals();
  applyAllFilters();
  renderDashboard();
  showToast(`Pipeline reset completed for ${resetCount} jobs`, 'success');
}

// Utility Functions
function formatStatus(status) {
  return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getFitScoreClass(score) {
  if (score >= 9.0) return 'excellent';
  if (score >= 8.0) return 'good';
  if (score >= 7.0) return 'fair';
  return 'poor';
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function closeModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.add('hidden');
  });
  currentEditingJob = null;
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };
  
  toast.innerHTML = `
    <i class="toast-icon ${icons[type]}"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// Global functions for inline event handlers
window.toggleJobSelection = toggleJobSelection;
window.viewJobDetails = viewJobDetails;
window.editJob = editJob;
window.removeIceBreaker = removeIceBreaker;
window.addIceBreaker = addIceBreaker;
window.removeObjection = removeObjection;
window.addObjection = addObjection;
window.showAddActivityModal = showAddActivityModal;
window.removeActivity = removeActivity;
window.addDiscoveredRole = addDiscoveredRole;
window.importDiscoveredJson = importDiscoveredJson;
window.archiveJobWithReason = archiveJobWithReason;
