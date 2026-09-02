const KEY = 'dreamcatcher.save';

const DEFAULTS = {
  dreamsCaught: 0,
  dreams: {},
  seen: [],
  // hub: small moments, whether the chain has dropped, how long Jo has stood
  // in the only place where time is real, and which dream he just came from
  flags: { hub: { moment1: false, moment2: false, moment3: false, gateOpened: false, gateSpoke: false, visits: 0 } },
  stationSeconds: 0,
  lastDream: null,
};

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    return { ...DEFAULTS, ...s, flags: { ...DEFAULTS.flags, ...(s.flags || {}), hub: { ...DEFAULTS.flags.hub, ...((s.flags || {}).hub || {}) } } };
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

// read-modify-write for anything else (hub flags, the station clock)
export function updateSave(fn) {
  const s = load();
  fn(s);
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}
