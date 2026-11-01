// How much harder a dream plays with dreams already caught (DESIGN.md §4). One
// table per dream, three tiers like the Chef's rail (engines/tickets.js): first
// time, one caught, two or more. Light on purpose: a dream picked late has more
// hearts too, and nothing here can stop anyone finishing.
export const tier = (d) => Math.max(0, Math.min(2, d | 0));

export const TUNING = {
  musician: { window: [1, 0.93, 0.86], nervePerMiss: [0, 2, 4], retriesOff: [0, 0, 1], foePace: [1, 1.05, 1.1] },
  painter: { speed: [1, 1.08, 1.16], zone: [1, 0.93, 0.86], plaster: [1, 0.93, 0.87], rivalMs: [1, 0.93, 0.87], foePace: [1, 1.08, 1.16] },
  // the odds never move (faro and the deal are the dream's honesty); what moves is
  // how often Lou misreads a table, and how much warning the boat's pipes give
  gambler: { louWrongEvery: [4, 4, 3], ventWarnMs: [450, 400, 320], ventOn: [1, 1.1, 1.2], foePace: [1, 1.05, 1.1] },
  // the gentle one stays gentle: a hand a touch livelier, the same brass, the same patience
  clockmaker: { dialSpeed: [1, 1.05, 1.1], foePace: [1, 1, 1] },
};

const scaled = (v, k) => (v == null ? v : v * k);

// an encounter's params → the same params at this difficulty (dream ids without a table pass through)
export function tuneEncounter(dreamId, params, difficulty = 0) {
  const t = TUNING[dreamId];
  if (!t) return params;
  const d = tier(difficulty);
  if (dreamId === 'musician') {
    const out = { ...params, window: (params.window ?? 150) * t.window[d] };
    if (params.retries != null) out.retries = Math.max(1, params.retries - t.retriesOff[d]);
    if (params.nervePerMiss) out.nervePerMiss = params.nervePerMiss + t.nervePerMiss[d];
    return out;
  }
  if (dreamId === 'painter') {
    return {
      ...params,
      speed: scaled(params.speed, t.speed[d]),
      zone: scaled(params.zone, t.zone[d]),
      clock: scaled(params.clock, t.plaster[d]),
      rival: params.rival ? { ...params.rival, ms: params.rival.ms * t.rivalMs[d] } : params.rival,
      steps: params.steps && params.steps.map((st) => ({ ...st, ...(st.zone ? { zone: st.zone * t.zone[d] } : {}), ...(st.zone2 ? { zone2: st.zone2 * t.zone[d] } : {}), ...(st.speed ? { speed: st.speed * t.speed[d] } : {}) })),
    };
  }
  if (dreamId === 'gambler') {
    return params.lou && params.lou.wrongEvery ? { ...params, lou: { ...params.lou, wrongEvery: t.louWrongEvery[d] } } : params;
  }
  if (dreamId === 'clockmaker') {
    return params.speed ? { ...params, speed: params.speed * t.dialSpeed[d] } : params;
  }
  return params;
}

// a person's walking pace (the older dreams keep the old 8 % a catch)
export function foePace(dreamId, difficulty = 0) {
  const t = TUNING[dreamId];
  return t ? t.foePace[tier(difficulty)] : 1 + 0.08 * (difficulty || 0);
}
