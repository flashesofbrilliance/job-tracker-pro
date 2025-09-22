// Minimal page script that uses DiscoveryCore and local storage from the main app

(function() {
  const $ = (sel) => document.querySelector(sel);

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="toast-icon ${type === 'success' ? 'fas fa-check-circle' : type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle'}"></i>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  const DISCO_KEY = 'disco:jobSearchData';

  function getJobs() {
    try {
      let raw = localStorage.getItem(DISCO_KEY);
      if (!raw) {
        // Offer import from main app on first load
        const mainRaw = localStorage.getItem('jobSearchData');
        if (mainRaw) {
          const doImport = window.confirm('Import existing data from main app into Discovery?');
          if (doImport) {
            localStorage.setItem(DISCO_KEY, mainRaw);
            raw = mainRaw;
          }
        }
      }
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }

  function saveJobs(jobs) {
    try { localStorage.setItem(DISCO_KEY, JSON.stringify(jobs)); } catch (e) {}
  }

  function fitClass(score) {
    if (score >= 9.0) return 'excellent';
    if (score >= 8.0) return 'good';
    if (score >= 7.0) return 'fair';
    return 'poor';
  }

  function render() {
    const jobs = getJobs();
    const insights = window.DiscoveryCore.analyzeLearningSignals(jobs);
    const signals = $('#signals');
    signals.innerHTML = `
      <div class="segment-stats">
        ${insights.topSegments.map(s => `
          <div class="segment-stat"><span class="segment-name">${s.name} (${s.count})</span><span class="segment-score">${s.score.toFixed(2)}</span></div>
        `).join('') || '<div class="empty">No signals yet. Add activities in the main app.</div>'}
      </div>
      <div style="margin-top:12px;">
        <h4 style="margin:0 0 8px 0;">Common Rejection Reasons</h4>
        <div class="segment-stats">
          ${insights.rejectionReasons.map(r => `
            <div class="segment-stat"><span class="segment-name">${r.reason}</span><span class="segment-score">${r.count}</span></div>
          `).join('') || '<div class="empty">No rejections logged yet.</div>'}
        </div>
      </div>`;

    const recos = window.DiscoveryCore.generateRecommendations(jobs, insights, Date.now() % 97);
    const recosEl = $('#recos');
    recosEl.innerHTML = `
      <div role="row" style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr auto;gap:12px;font-weight:600;padding:8px 6px;opacity:0.8;">
        <div>Company</div><div>Role</div><div>Expected Fit</div><div>Sector</div><div></div>
      </div>
      ${recos.map((r,i) => `
        <div class="table-row" style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr auto;gap:12px;align-items:center;border-bottom:1px solid var(--border-color,#e5e7eb);padding:10px 6px;">
          <div><strong>${r.company}</strong></div>
          <div>${r.roleTitle}</div>
          <div><span class="fit-score-value ${fitClass(r.expectedFit)}">${r.expectedFit.toFixed(1)}</span></div>
          <div>${r.sector}</div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn btn--sm btn--primary" data-add-idx="${i}"><i class="fas fa-plus"></i> Add</button>
          </div>
        </div>`).join('')}`;

    recosEl.querySelectorAll('[data-add-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-add-idx'));
        const r = recos[idx];
        const newJob = {
          id: `${r.id}-${Date.now()}`,
          company: r.company,
          roleTitle: r.roleTitle,
          location: r.location,
          status: 'not-started',
          vibe: '😐',
          fitScore: parseFloat(r.expectedFit.toFixed(1)),
          salary: r.salary,
          tags: ['Remote', ...r.tags].slice(0,5),
          appliedDate: null,
          notes: `${r.company} (${r.sector}) suggested by discovery engine`,
          research: { companyIntel: `${r.company} in ${r.sector}.`, keyPeople: ["CEO","CTO","Head of Product"], recentNews: "", competitiveAdvantage: "", challenges: "" },
          iceBreakers: [],
          objections: [],
          fitAnalysis: 'Suggested based on learning signals',
          activityLog: [],
          dateAdded: new Date().toISOString().split('T')[0]
        };
        const all = [newJob, ...jobs];
        saveJobs(all);
        showToast(`Added ${r.company} — ${r.roleTitle}`, 'success');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const refresh = document.getElementById('refresh-btn');
    if (refresh) refresh.addEventListener('click', render);
    render();
  });
})();
