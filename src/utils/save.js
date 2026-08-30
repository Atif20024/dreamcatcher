const KEY = 'dreamcatcher.save';

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    return { dreamsCaught: 0, dreams: {}, seen: [], ...s };
  } catch {
    return { dreamsCaught: 0, dreams: {}, seen: [] };
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
  if (!s.dreams[key]) {
    s.dreams[key] = true;
    s.dreamsCaught += 1;
    localStorage.setItem(KEY, JSON.stringify(s));
  }
  return s;
}
