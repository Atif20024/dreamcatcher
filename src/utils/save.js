// The save file is SaveStore v2 (src/meta/SaveStore.js): three slots,
// global settings and in-dream runs. This module keeps the flat v1 view
// every caller already uses (getSave / updateSave), read from and written
// to the active slot.
import { saveStore } from '../meta/SaveStore.js';

function load() {
  return saveStore.legacy();
}

function store(fn) {
  return saveStore.updateLegacy(fn);
}

// D8 — remember which just-in-time tutorial cards have been shown.
export function markSeen(id) {
  if (load().seen.includes(id)) return;
  store((s) => {
    if (!s.seen.includes(id)) s.seen.push(id);
  });
}

// dev/scenarios: forget a card so it shows again
export function unmarkSeen(id, dream = null) {
  store((s) => (s.seen = s.seen.filter((x) => x !== id)));
  saveStore.unmarkCard(dream, id);
}

export function getSave() {
  return load();
}

export function getDifficulty() {
  return Math.min(5, load().dreamsCaught);
}

export function completeDream(key) {
  const s = store((x) => {
    x.lastDream = key;
    if (!x.dreams[key]) {
      x.dreams[key] = true;
      x.dreamsCaught += 1;
    }
  });
  // the dream is caught: its in-progress run is over
  saveStore.clearRun(key);
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
  return store(fn);
}

// in-dream runs (plan §2.8): one per dream, in the active slot
export const getRun = (dreamId) => saveStore.run(dreamId);
export const setRun = (dreamId, run) => saveStore.setRun(dreamId, run);
export const clearRun = (dreamId) => saveStore.clearRun(dreamId);
export const getSettings = () => saveStore.settings();
export const updateSettings = (fn) => saveStore.updateSettings(fn);
