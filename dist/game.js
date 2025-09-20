// Local-only training game script
(function(){
  const $ = (s) => document.querySelector(s);
  const KEY_EVENTS = 'game:events';
  const SOURCES = ['game:data','disco:jobSearchData','jobSearchData'];

  let items = [];
  let events = [];
  let current = null;

  function showToast(message, type = 'info') {
    const container = $('#toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class=\"toast-icon ${type==='success'?'fas fa-check-circle':type==='error'?'fas fa-exclamation-circle':'fas fa-info-circle'}\"></i><span class=\"toast-message\">${message}</span><button class=\"toast-close\" onclick=\"this.parentElement.remove()\"><i class=\"fas fa-times\"></i></button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function loadEvents() {
    try { return JSON.parse(localStorage.getItem(KEY_EVENTS) || '[]'); } catch(e) { return []; }
  }
  function saveEvents(evs) {
    try { localStorage.setItem(KEY_EVENTS, JSON.stringify(evs)); } catch(e) {}
  }

  function loadItems() {
    for (const key of SOURCES) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) {
            if (key !== 'game:data') {
              const doImport = confirm('Import roles from existing data into the game?');
              if (doImport) localStorage.setItem('game:data', raw);
            }
            return parsed;
          }
        } catch(e) {}
      }
    }
    return [];
  }

  function fitClass(score) {
    if (score >= 9.0) return 'excellent';
    if (score >= 8.0) return 'good';
    if (score >= 7.0) return 'fair';
    return 'poor';
  }

  function renderCard(job, reveal=false, isExplore=false) {
    const title = $('#card-title');
    const sub = $('#card-sub');
    const chips = $('#why-chips');
    if (!job) {
      title.textContent = 'No items available';
      sub.textContent = 'Import data from the main app or discovery.';
      chips.innerHTML = '';
      return;
    }
    if (!reveal) {
      title.textContent = 'Make a choice to reveal';
      sub.textContent = 'We will show the label after your decision.';
      chips.innerHTML = '';
    } else {
      title.textContent = `${job.company} — ${job.roleTitle}`;
      sub.innerHTML = `<span class=\"fit-score-value ${fitClass(job.fitScore||0)}\">${(job.fitScore||0).toFixed(1)}</span> · ${job.location || ''}`;
      const insights = window.DiscoveryCore.analyzeLearningSignals(items);
      const why = window.GameCore.whyChips(job, insights, isExplore);
      chips.innerHTML = why.map(c => `<span class=\"chip\">${c}</span>`).join('');
    }
  }

  function next() {
    current = window.GameCore.chooseNext(items, events, {});
    renderCard(current, false);
  }

  function onAction(action, reason='') {
    if (!current) return;
    events = window.GameCore.recordEvent(events, current, action, reason);
    saveEvents(events);
    renderCard(current, true, action==='skip');
    setTimeout(() => next(), 500);
  }

  function openReasonOverlay() { $('#reason-overlay').style.display = 'flex'; }
  function closeReasonOverlay() { $('#reason-overlay').style.display = 'none'; $('#reason-select').value=''; }

  document.addEventListener('DOMContentLoaded', () => {
    items = loadItems();
    events = loadEvents();
    if (!items.length) showToast('No data found. Import from main app or discovery.', 'info');
    next();
    $('#btn-like').addEventListener('click', () => onAction('like'));
    $('#btn-super').addEventListener('click', () => onAction('super'));
    $('#btn-skip').addEventListener('click', () => onAction('skip'));
    $('#btn-dislike').addEventListener('click', () => openReasonOverlay());
    $('#reason-cancel').addEventListener('click', () => closeReasonOverlay());
    $('#reason-confirm').addEventListener('click', () => {
      const r = $('#reason-select').value;
      if (!r) { showToast('Please select a reason', 'error'); return; }
      closeReasonOverlay();
      onAction('dislike', r);
    });
  });
})();

