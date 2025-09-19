const state = {
  jobs: [
    { id: '1', company: 'Stripe', role: 'PM – Payments', status: 'Research', tags: ['Payments','FinTech'] },
    { id: '2', company: 'OpenAI', role: 'Product Lead – ChatGPT', status: 'Applied', tags: ['AI','ML'] },
    { id: '3', company: 'Coinbase', role: 'Director – Institutional', status: 'Interviewing', tags: ['Crypto'] }
  ],
  filter: ''
};

const el = {
  tbody: document.querySelector('#jobs tbody'),
  search: document.querySelector('#search'),
  add: document.querySelector('#add')
};

function uid() { return Math.random().toString(36).slice(2,9); }

function render() {
  const q = state.filter.toLowerCase();
  const rows = state.jobs.filter(j =>
    [j.company, j.role, j.status, (j.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)
  ).map(j => `
    <tr>
      <td>${escapeHtml(j.company)}</td>
      <td>${escapeHtml(j.role)}</td>
      <td><span class="badge">${escapeHtml(j.status)}</span></td>
      <td>${(j.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</td>
      <td><button class="btn" data-id="${j.id}">Remove</button></td>
    </tr>
  `).join('');
  el.tbody.innerHTML = rows || '<tr><td colspan="5" style="color:#9ca3af;">No jobs yet</td></tr>';
  el.tbody.querySelectorAll('button[data-id]').forEach(b => b.onclick = () => remove(b.dataset.id));
}

function remove(id){
  state.jobs = state.jobs.filter(j => j.id !== id);
  render();
}

function add(){
  const company = prompt('Company?'); if (!company) return;
  const role = prompt('Role?') || 'Role';
  state.jobs.unshift({ id: uid(), company, role, status: 'Research', tags: [] });
  render();
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }

el.search.addEventListener('input', (e)=>{ state.filter = e.target.value; render(); });
el.add.addEventListener('click', add);
render();

