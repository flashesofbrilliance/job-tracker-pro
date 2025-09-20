// Discovery Engine Core (standalone, no framework)
// Exposes window.DiscoveryCore with reusable functions

(function() {
  function categorizeRejectionReason(text) {
    const t = (text || '').toLowerCase();
    if (/comp|salary|pay|band|budget/.test(t)) return 'Compensation';
    if (/senior|overqualified|junior|level|seniority/.test(t)) return 'Seniority/Level';
    if (/location|relocat|onsite|hybrid|visa|work auth/.test(t)) return 'Location/Visa';
    if (/timing|freeze|headcount|hiring|hold/.test(t)) return 'Timing/Headcount';
    if (/domain|industry|crypto|web3|ai|fintech|payments/.test(t)) return 'Domain Fit';
    if (/skills|experience|background|requirement|stack/.test(t)) return 'Skills/Experience';
    return 'Other';
  }

  function analyzeLearningSignals(jobs) {
    const vibeScore = v => (v === '😊' ? 0.1 : v === '😟' ? -0.1 : 0);
    const sectorOf = job => (job.tags || []).find(t => ['Crypto','DeFi','AI','FinTech','Payments','Infrastructure','Exchange','L1','Oracle'].includes(t)) || 'Other';
    const statusScore = s => s === 'offer' ? 1.0 : s === 'interviewing' ? 0.6 : s === 'applied' ? 0.2 : s === 'rejected' ? -0.5 : 0.0;

    const segMap = {};
    const rejectionCounts = {};
    (jobs || []).forEach(job => {
      const seg = sectorOf(job);
      if (!segMap[seg]) segMap[seg] = { count: 0, score: 0 };
      segMap[seg].count++;
      segMap[seg].score += statusScore(job.status) + vibeScore(job.vibe) + ((job.fitScore || 0) - 7.5) * 0.05;

      (job.activityLog || []).forEach(act => {
        if ((act.type || '').toLowerCase() === 'rejection') {
          const cat = (act.reason && String(act.reason).trim()) || categorizeRejectionReason(act.note || '');
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
      .slice(0, 10);

    return { topSegments, rejectionReasons };
  }

  function getDiscoveryCatalog() {
    return [
      { company: 'Ledger', sector: 'Infrastructure', role: 'Director Product - Enterprise Wallets', tags: ['Crypto','Security'], baseFitAdj: 0.2 },
      { company: 'Fireblocks', sector: 'Infrastructure', role: 'VP Product - Institutional', tags: ['Crypto','Institutional'], baseFitAdj: 0.3 },
      { company: 'MoonPay', sector: 'Payments', role: 'Head of Product - On/Off Ramp', tags: ['FinTech','Payments'], baseFitAdj: 0.1 },
      { company: 'Plaid', sector: 'FinTech', role: 'Director Product - Identity & Risk', tags: ['Risk','Compliance'], baseFitAdj: 0.1 },
      { company: 'Ripple', sector: 'Crypto', role: 'Director Product - Liquidity Hub', tags: ['Crypto','Enterprise'], baseFitAdj: 0.1 },
      { company: 'Worldcoin', sector: 'AI', role: 'Director Product - Trust & Safety', tags: ['AI','Identity'], baseFitAdj: 0.0 },
      { company: 'Chime', sector: 'FinTech', role: 'VP Product - Platform', tags: ['Banking','Platform'], baseFitAdj: -0.1 },
      { company: 'Wise', sector: 'Payments', role: 'Head of Product - Enterprise', tags: ['FX','Compliance'], baseFitAdj: 0.0 },
      { company: 'OpenAI', sector: 'AI', role: 'Head of Product - Safety Systems', tags: ['AI','Safety'], baseFitAdj: 0.2 },
      { company: 'Anthropic', sector: 'AI', role: 'Director Product - Enterprise', tags: ['AI','Platform'], baseFitAdj: 0.1 },
      { company: 'Ramp', sector: 'FinTech', role: 'Director Product - Risk', tags: ['FinTech','Risk'], baseFitAdj: 0.0 },
      { company: 'Checkout.com', sector: 'Payments', role: 'Director Product - Crypto', tags: ['Payments','Crypto'], baseFitAdj: 0.1 },
      { company: 'StarkWare', sector: 'L1', role: 'Head of Product - Developer Experience', tags: ['L1','DevTools'], baseFitAdj: 0.0 },
      { company: 'EigenLayer', sector: 'Infrastructure', role: 'Director Product - Protocol', tags: ['Crypto','Protocol'], baseFitAdj: 0.0 },
    ];
  }

  function generateRecommendations(jobs, insights, seed = 0) {
    const existingKeys = new Set((jobs || []).map(j => `${j.company}::${j.roleTitle}`));
    const topSectors = (insights?.topSegments?.length ? insights.topSegments.map(s => s.name) : ['Crypto','AI','FinTech','Infrastructure']);
    const catalog = getDiscoveryCatalog();
    const rand = (i) => ((Math.sin(i + seed * 1337) + 1) / 2);
    return catalog
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
      .slice(0, 20);
  }

  window.DiscoveryCore = {
    analyzeLearningSignals,
    categorizeRejectionReason,
    generateRecommendations,
    getDiscoveryCatalog
  };
})();

