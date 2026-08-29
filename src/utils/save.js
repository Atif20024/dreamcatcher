const KEY = 'dreamcatcher.save';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { dreamsCaught: 0, dreams: {} };
  } catch {
    return { dreamsCaught: 0, dreams: {} };
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
