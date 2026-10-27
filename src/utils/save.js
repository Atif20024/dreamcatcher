const KEY = 'dreamcatcher.save';

const DEFAULTS = {
  dreamsCaught: 0,
  dreams: {},
  seen: [],
  // hub: small moments, whether the chain has dropped, how long Jo has stood
  // in the only place where time is real, and which dream he just came from
  flags: { hub: { moment1: false, moment2: false, moment3: false, gateOpened: false, gateSpoke: false, visits: 0 }, wr: {}, pt: {}, gm: {} },
  stationSeconds: 0,
  lastDream: null,
  // collectibles: the wallet persists across dreams; shards are permanent
  // (3 = +1 max heart); shop holds Bilal's stall purchases.
  wallet: { total: 0, byDream: {} },
  shards: 0,
  shop: { shardsBought: 0, postcards: {}, tea: false, ticket: false, hats: [], hat: null },
  // small moments found, per dream ({ chef: ['m1', ...] }) — the evening's
  // last cards count them; and the cast Jo actually met, per dream, so the
  // town only roasts him about things that happened
  moments: {},
  met: {},
  cast: {},
  // THE LONG EVENING saves almost nothing: that it was visited, the child's
  // map of it, and (on the ridge) that it was finished
  evening: { visited: false, map: {}, finished: false, finds: {} },
};

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    return {
      ...DEFAULTS,
      ...s,
      flags: { ...DEFAULTS.flags, ...(s.flags || {}), hub: { ...DEFAULTS.flags.hub, ...((s.flags || {}).hub || {}) } },
      wallet: { ...DEFAULTS.wallet, ...(s.wallet || {}), byDream: { ...((s.wallet || {}).byDream || {}) } },
      shop: { ...DEFAULTS.shop, ...(s.shop || {}), postcards: { ...((s.shop || {}).postcards || {}) }, hats: [...(((s.shop || {}).hats) || [])] },
      moments: { ...(s.moments || {}) },
      met: { ...(s.met || {}) },
      cast: { ...(s.cast || {}) },
      evening: { ...DEFAULTS.evening, ...(s.evening || {}), map: { ...((s.evening || {}).map || {}) }, finds: { ...((s.evening || {}).finds || {}) } },
    };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

// D8 — remember which just-in-time tutorial cards have been shown.
export function markSeen(id) {
  const s = load();
  if (!s.seen.includes(id)) {
    s.seen.push(id);
    localStorage.setItem(KEY, JSON.stringify(s));
  }
}

export function getSave() {
  return load();
}

export function getDifficulty() {
  return Math.min(5, load().dreamsCaught);
}

export function completeDream(key) {
  const s = load();
  s.lastDream = key;
  if (!s.dreams[key]) {
    s.dreams[key] = true;
    s.dreamsCaught += 1;
  }
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

// a small moment, found: kept per dream so the evening can count them
export function recordMoment(dream, id) {
  updateSave((s) => {
    const list = (s.moments[dream] ||= []);
    if (!list.includes(id)) list.push(id);
  });
}

// the dream's people have met Jo (called when a dream starts)
export function markMet(dream) {
  updateSave((s) => (s.met[dream] = true));
}

// every small moment the built game holds: hub 3 + chef 3 + musician 3 +
// astronaut 3 + writer 3 + painter 4 + gambler 3
export const MOMENT_TOTAL = 22;
export function momentsFound(s = load()) {
  const hub = ['moment1', 'moment2', 'moment3'].filter((k) => s.flags.hub[k]).length;
  return hub + Object.values(s.moments).reduce((n, l) => n + l.length, 0);
}

// read-modify-write for anything else (hub flags, the station clock)
export function updateSave(fn) {
  const s = load();
  fn(s);
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}
