(() => {
  const YES_REASONS = [
    'High fit', 'Strategic value', 'Great team/culture', 'Exciting product', 'Growth opportunity', 'Compensation', 'Location', 'Other'
  ];
  const NO_REASONS = [
    'Compensation', 'Seniority/Level', 'Location/Visa', 'Timing/Headcount', 'Domain Fit', 'Skills/Experience', 'Other'
  ];

  const STORAGE_KEY = 'jobSearchData'; // main app jobs
  const REJECT_KEY = 'disco:rejections';

  function getJobs(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; }
  }
  function setJobs(arr){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch(e) {}
  }

  function addJobFromReco(reco, opts={}){
    const jobs = getJobs();
    const job = {
      id: `${reco.id}-${Date.now()}`,
      company: reco.company,
      roleTitle: reco.roleTitle,
      location: reco.location || 'Remote',
      status: 'not-started',
      vibe: opts.vibe || '😐',
      fitScore: Number((reco.expectedFit || 0).toFixed(1)),
      salary: reco.salary || '',
      tags: Array.from(new Set(['Remote', ...(reco.tags||[])] )).slice(0,5),
      appliedDate: null,
      notes: `Discovered via Table View (${reco.sector||''})`,
      activityLog: [],
      dateAdded: new Date().toISOString().split('T')[0]
    };
    if (opts.archiveTag) job.archiveTag = opts.archiveTag;
    if (opts.archiveReason) job.archiveReason = opts.archiveReason;
    if (opts.activity) job.activityLog.push(opts.activity);
    jobs.unshift(job);
    setJobs(jobs);
    return job;
  }

  // Persist lightweight rejection record for future refinement
  function recordRejection(reco, reason, notes){
    try {
      const list = JSON.parse(localStorage.getItem(REJECT_KEY) || '[]');
      list.unshift({ id: reco.id, company: reco.company, roleTitle: reco.roleTitle, sector: reco.sector, reason, notes, ts: Date.now() });
      localStorage.setItem(REJECT_KEY, JSON.stringify(list.slice(0,200)));
    } catch(e) {}
  }

  function fitClass(v){
    if (v >= 9.0) return 'fit-good';
    if (v >= 7.5) return 'fit-fair';
    return 'fit-poor';
  }

  // Render table
  function render(recos){
    const tbody = document.getElementById('disco-tbody');
    if (!tbody) return;
    tbody.innerHTML = recos.map((r,i) => `
      <tr>
        <td>${r.company}</td>
        <td>${r.roleTitle}</td>
        <td><span class="badge">${r.sector||'—'}</span></td>
        <td><span class="${fitClass(r.expectedFit)}">${(r.expectedFit||0).toFixed(1)}</span></td>
        <td class="actions">
          <button class="btn btn--sm" data-yes="${i}"><i class="fas fa-thumbs-up"></i> Yes</button>
          <button class="btn btn--outline btn--sm" data-no="${i}"><i class="fas fa-thumbs-down"></i> No</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-yes]').forEach(btn => btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.getAttribute('data-yes'));
      openReason('yes', recos[idx], (reason, notes) => {
        const activity = (reason || notes) ? { type: 'Positive', reason: reason||'Yes', note: notes||'', ts: new Date().toISOString() } : undefined;
        addJobFromReco(recos[idx], { vibe: '😍', activity });
        showToast(`Added to Not Started: ${recos[idx].company}`, 'success');
      });
    }));

    tbody.querySelectorAll('[data-no]').forEach(btn => btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.getAttribute('data-no'));
      openReason('no', recos[idx], (reason, notes) => {
        recordRejection(recos[idx], reason, notes);
        addJobFromReco(recos[idx], {
          vibe: '😟',
          archiveTag: 'Backlog',
          archiveReason: reason ? `${reason}${notes?`: ${notes}`:''}` : 'Archive-Pending',
          activity: { type: 'Archived', reason: reason||'', note: notes||'', ts: new Date().toISOString() }
        });
        showToast(`Archived (Backlog): ${recos[idx].company}`, 'info');
      });
    }));
  }

  // Quick feedback popup
  function openReason(kind, reco, onDone){
    const pop = document.getElementById('reason-pop');
    const title = document.getElementById('reason-title');
    const select = document.getElementById('reason-select');
    const notes = document.getElementById('reason-notes');
    const btnSave = document.getElementById('reason-save');
    const btnSkip = document.getElementById('reason-skip');
    if (!pop || !title || !select || !notes) return onDone();
    title.textContent = kind === 'yes' ? `Why Yes for ${reco.company}?` : `Why No for ${reco.company}?`;
    select.innerHTML = (kind==='yes'?YES_REASONS:NO_REASONS).map(r=>`<option value="${r}">${r}</option>`).join('');
    notes.value = '';
    pop.style.display = 'flex';

    function close(){ pop.style.display='none'; btnSave.onclick = btnSkip.onclick = null; }
    btnSave.onclick = () => { const v=select.value; const n=notes.value.trim(); close(); onDone(v, n); };
    btnSkip.onclick = () => { close(); onDone('', ''); };
  }

  function init(){
    // Build recos from DiscoveryCore using current jobs to bias sectors
    const jobs = getJobs();
    const insights = window.DiscoveryCore?.analyzeLearningSignals(jobs) || { topSegments: [] };
    const recos = window.DiscoveryCore?.generateRecommendations(jobs, insights, Date.now()%97) || [];
    render(recos);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
