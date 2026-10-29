// SaveStore v2 (plan §2.8, §4.10, §8.2 #4): versioned, three slots plus
// global settings, storage behind an adapter. Slot 0 is used automatically.
//
// The v1 save (the flat `dreamcatcher.save` object of utils/save.js) is
// migrated losslessly: every v1 key maps into a v2 slot section, and
// `legacyFromSlot` maps it back, so today's callers keep their flat view
// (getSave/updateSave) while the file on disk is v2. Unknown keys ride
// along in `slot.extra`. Plain JS, unit-tested in Node.

export const SAVE_KEY = 'dreamcatcher.save';
export const SAVE_VERSION = 2;
export const SLOT_COUNT = 3;

const clone = (o) => JSON.parse(JSON.stringify(o));

// ---- the v1 (flat) shape, as utils/save.js has always defined it ---------
export const LEGACY_DEFAULTS = Object.freeze({
  dreamsCaught: 0,
  dreams: {},
  seen: [],
  flags: { hub: { moment1: false, moment2: false, moment3: false, gateOpened: false, gateSpoke: false, visits: 0 }, wr: {}, pt: {}, gm: {} },
  stationSeconds: 0,
  lastDream: null,
  wallet: { total: 0, byDream: {} },
  shards: 0,
  shop: { shardsBought: 0, postcards: {}, tea: false, ticket: false, hats: [], hat: null },
  moments: {},
  met: {},
  cast: {},
  evening: { visited: false, map: {}, finished: false, finds: {} },
});

// v1 load(): defaults merged under whatever was stored (unchanged logic)
export function normalizeLegacy(raw) {
  const D = clone(LEGACY_DEFAULTS);
  const s = raw && typeof raw === 'object' ? clone(raw) : {};
  return {
    ...D,
    ...s,
    flags: { ...D.flags, ...(s.flags || {}), hub: { ...D.flags.hub, ...((s.flags || {}).hub || {}) } },
    wallet: { ...D.wallet, ...(s.wallet || {}), byDream: { ...((s.wallet || {}).byDream || {}) } },
    shop: { ...D.shop, ...(s.shop || {}), postcards: { ...((s.shop || {}).postcards || {}) }, hats: [...((s.shop || {}).hats || [])] },
    moments: { ...(s.moments || {}) },
    met: { ...(s.met || {}) },
    cast: { ...(s.cast || {}) },
    evening: { ...D.evening, ...(s.evening || {}), map: { ...((s.evening || {}).map || {}) }, finds: { ...((s.evening || {}).finds || {}) } },
    seen: [...(Array.isArray(s.seen) ? s.seen : D.seen)],
  };
}

const LEGACY_KNOWN = new Set(Object.keys(LEGACY_DEFAULTS));

export function emptySlot() {
  return slotFromLegacy({});
}

// flat v1 → v2 slot. `prev` keeps v2-only data (runs, convs) across writes.
export function slotFromLegacy(legacy, prev = null) {
  const s = normalizeLegacy(legacy);
  const { hub, ...dreamFlags } = s.flags;
  const extra = {};
  for (const [k, v] of Object.entries(legacy || {})) if (!LEGACY_KNOWN.has(k)) extra[k] = clone(v);
  return {
    progress: {
      dreamsCaught: s.dreamsCaught,
      caught: s.dreams,
      shards: s.shards,
      moments: s.moments,
      met: s.met,
      cast: s.cast,
      lastDream: s.lastDream,
    },
    wallet: s.wallet,
    shop: s.shop,
    hub: { flags: hub, stationSeconds: s.stationSeconds },
    // per-dream flag namespaces (wr / pt / gm): progress-level state today
    flags: dreamFlags,
    // cards: '*' is the legacy global list (scope 'once'); every other key is
    // a dream's own seen list (scope 'perDream', phase 1.4), kept from prev
    seen: { cards: { ...(prev && prev.seen ? clone(prev.seen.cards || {}) : {}), '*': s.seen }, convs: prev && prev.seen ? [...(prev.seen.convs || [])] : [] },
    evening: s.evening,
    runs: prev && prev.runs ? clone(prev.runs) : {},
    extra,
  };
}

// v2 slot → flat v1 view (what getSave() returns)
export function legacyFromSlot(slot) {
  const sl = slot || emptySlot();
  const p = sl.progress || {};
  const raw = {
    ...clone(sl.extra || {}),
    dreamsCaught: p.dreamsCaught,
    dreams: p.caught,
    seen: ((sl.seen || {}).cards || {})['*'],
    flags: { ...(sl.flags || {}), hub: (sl.hub || {}).flags },
    stationSeconds: (sl.hub || {}).stationSeconds,
    lastDream: p.lastDream,
    wallet: sl.wallet,
    shards: p.shards,
    shop: sl.shop,
    moments: p.moments,
    met: p.met,
    cast: p.cast,
    evening: sl.evening,
  };
  for (const k of Object.keys(raw)) if (raw[k] === undefined) delete raw[k];
  return normalizeLegacy(raw);
}

export function defaultSettings() {
  // volumes: the player's Music and Ambience sliders, a fraction of each
  // bus's default level (feedback 3)
  return { musicOff: false, savedHereShown: false, volumes: { music: 1, ambience: 1 } };
}

export function emptySave() {
  return { v: SAVE_VERSION, activeSlot: 0, settings: defaultSettings(), slots: [emptySlot(), null, null] };
}

// any stored value → a v2 save (v1 objects and garbage included)
export function migrate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptySave();
  if (raw.v === SAVE_VERSION) {
    const out = { ...emptySave(), ...clone(raw) };
    out.settings = { ...defaultSettings(), ...(raw.settings || {}) };
    out.slots = Array.from({ length: SLOT_COUNT }, (_, i) => (raw.slots && raw.slots[i] ? clone(raw.slots[i]) : i === 0 ? emptySlot() : null));
    out.activeSlot = Math.min(SLOT_COUNT - 1, Math.max(0, raw.activeSlot | 0));
    if (!out.slots[out.activeSlot]) out.slots[out.activeSlot] = emptySlot();
    return out;
  }
  if (raw.v && raw.v > SAVE_VERSION) throw new Error(`save v${raw.v} is newer than this build (v${SAVE_VERSION})`);
  // v1: the flat object
  const out = emptySave();
  out.slots[0] = slotFromLegacy(raw);
  return out;
}

// ---- storage adapters ------------------------------------------------------
export function localStorageAdapter(key = SAVE_KEY, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  return {
    read() {
      try {
        return storage ? storage.getItem(key) : null;
      } catch {
        return null;
      }
    },
    write(str) {
      try {
        if (storage) storage.setItem(key, str);
      } catch {
        /* full or blocked storage: play on */
      }
    },
    remove() {
      try {
        if (storage) storage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

export function memoryAdapter(initial = null) {
  let v = initial === null ? null : typeof initial === 'string' ? initial : JSON.stringify(initial);
  return {
    read: () => v,
    write: (s) => {
      v = s;
    },
    remove: () => {
      v = null;
    },
  };
}

// ---- the store ---------------------------------------------------------------
export class SaveStore {
  constructor(adapter = localStorageAdapter()) {
    this.adapter = adapter;
  }

  // read and migrate (fresh each call: other code may write the same key)
  load() {
    let raw = null;
    try {
      raw = JSON.parse(this.adapter.read() || 'null');
    } catch {
      raw = null;
    }
    return migrate(raw);
  }

  write(save) {
    this.adapter.write(JSON.stringify(save));
    return save;
  }

  // read-modify-write of the whole v2 file
  mutate(fn) {
    const s = this.load();
    fn(s);
    return this.write(s);
  }

  get() {
    return this.load();
  }

  slot() {
    const s = this.load();
    return s.slots[s.activeSlot];
  }

  update(fn) {
    let out;
    this.mutate((s) => {
      out = fn(s.slots[s.activeSlot], s);
    });
    return out;
  }

  // flat v1 view of the active slot
  legacy() {
    return legacyFromSlot(this.slot());
  }

  updateLegacy(fn) {
    let view;
    this.mutate((s) => {
      const prev = s.slots[s.activeSlot];
      view = legacyFromSlot(prev);
      fn(view);
      s.slots[s.activeSlot] = slotFromLegacy(view, prev);
    });
    return view;
  }

  settings() {
    return this.load().settings;
  }

  updateSettings(fn) {
    let out;
    this.mutate((s) => {
      out = fn(s.settings);
    });
    return out;
  }

  selectSlot(i) {
    if (i < 0 || i >= SLOT_COUNT) throw new Error(`no slot ${i}`);
    this.mutate((s) => {
      s.activeSlot = i;
      if (!s.slots[i]) s.slots[i] = emptySlot();
    });
  }

  // ---- in-dream runs --------------------------------------------------------
  run(dreamId) {
    const r = (this.slot().runs || {})[dreamId];
    return r ? clone(r) : null;
  }

  runs() {
    return clone(this.slot().runs || {});
  }

  setRun(dreamId, run) {
    const data = run && typeof run.toJSON === 'function' ? run.toJSON() : clone(run);
    this.update((slot) => {
      slot.runs = slot.runs || {};
      slot.runs[dreamId] = data;
    });
    return data;
  }

  clearRun(dreamId) {
    this.update((slot) => {
      if (slot.runs) delete slot.runs[dreamId];
    });
  }

  // ---- tutorial cards seen, per dream ('*' = once per save) -----------------
  seenCards(dream) {
    const c = ((this.slot().seen || {}).cards || {})[dream || '*'];
    return Array.isArray(c) ? [...c] : [];
  }

  markCard(dream, id) {
    const k = dream || '*';
    this.update((slot) => {
      slot.seen = slot.seen || { cards: {}, convs: [] };
      slot.seen.cards = slot.seen.cards || {};
      const list = (slot.seen.cards[k] ||= []);
      if (!list.includes(id)) list.push(id);
    });
  }

  unmarkCard(dream, id) {
    this.update((slot) => {
      const cards = (slot.seen || {}).cards || {};
      for (const k of dream ? [dream, '*'] : Object.keys(cards)) if (cards[k]) cards[k] = cards[k].filter((x) => x !== id);
    });
  }

  // New game: the active slot is wiped (settings are global and stay)
  resetSlot() {
    this.mutate((s) => {
      s.slots[s.activeSlot] = emptySlot();
    });
  }

  // dev: export / import the whole file
  exportJSON() {
    return JSON.stringify(this.load(), null, 2);
  }

  importJSON(str) {
    return this.write(migrate(JSON.parse(str)));
  }
}

export const saveStore = new SaveStore();
