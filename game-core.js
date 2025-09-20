// Game Core (local-only). Exposes window.GameCore
(function() {
  const SEGMENTS = ['Crypto','DeFi','AI','FinTech','Payments','Infrastructure','Exchange','L1','Oracle','Other'];

  function segmentOf(job) {
    if (!job || !Array.isArray(job.tags)) return 'Other';
    for (const t of job.tags) {
      if (SEGMENTS.includes(t)) return t;
    }
    return 'Other';
  }

  function buildSegmentStats(items, events) {
    const stats = {};
    SEGMENTS.forEach(s => stats[s] = { shows: 0, likes: 0, dislikes: 0 });
    const itemById = new Map(items.map(j => [j.id, j]));
    (events || []).forEach(ev => {
      const job = itemById.get(ev.item_id);
      const seg = segmentOf(job);
      if (!stats[seg]) stats[seg] = { shows: 0, likes: 0, dislikes: 0 };
      stats[seg].shows++;
      if (ev.action === 'like' || ev.action === 'super') stats[seg].likes++;
      else if (ev.action === 'dislike') stats[seg].dislikes++;
    });
    return stats;
  }

  let totalShows = 1;

  function pickTopSegment(stats) {
    totalShows = Object.values(stats).reduce((a,b) => a + Math.max(0, b.shows), 0) || 1;
    let best = 'Other';
    let bestScore = -Infinity;
    for (const [seg, s] of Object.entries(stats)) {
      const n = Math.max(1, s.shows);
      const mean = s.likes / n;
      const bonus = Math.sqrt(2 * Math.log(totalShows + 1) / n);
      const u = mean + bonus;
      if (u > bestScore) { bestScore = u; best = seg; }
    }
    return best;
  }

  function chooseNext(items, events, settings = {}) {
    const stats = buildSegmentStats(items, events);
    const targetSeg = pickTopSegment(stats);
    const recentIds = new Set((events || []).slice(-50).map(e => e.item_id));
    const pool = items.filter(j => segmentOf(j) === targetSeg && !recentIds.has(j.id));
    const fallbackPool = items.filter(j => !recentIds.has(j.id));
    const choicePool = pool.length ? pool : (fallbackPool.length ? fallbackPool : items);
    if (choicePool.length === 0) return null;
    const scored = choicePool.map(j => ({ j, s: (j.fitScore || 7.5) + Math.random()*0.2 }));
    scored.sort((a,b) => b.s - a.s);
    return scored[0].j;
  }

  function recordEvent(events, item, action, reason) {
    const ev = {
      item_id: item.id,
      company: item.company,
      roleTitle: item.roleTitle,
      segment: segmentOf(item),
      action,
      reason: reason || '',
      ts: new Date().toISOString()
    };
    return [...(events || []), ev];
  }

  function whyChips(item, insights, isExplore = false) {
    const seg = segmentOf(item);
    const fit = (item.fitScore || 0).toFixed(1);
    const chips = [`Seg=${seg}`, `Fit≈${fit}`];
    if (isExplore) chips.push('Explore');
    const segStat = (insights?.topSegments || []).find(s => s.name === seg);
    if (segStat) chips.push(`SegScore=${segStat.score.toFixed(2)}`);
    return chips;
  }

  window.GameCore = { segmentOf, buildSegmentStats, chooseNext, recordEvent, whyChips };
})();

