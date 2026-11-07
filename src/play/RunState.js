// RunState (plan §2.8): the in-dream state that survives a game over and a
// closed tab. Saved into SaveStore `runs[dreamId]` whenever a checkpoint
// lights and when Jo returns to the station; restored by BaseLevel on resume.
// Plain JS, JSON round-trips.

// keep only JSON-safe primitives from a scene's flag bag (F)
export function sanitizeFlags(F = {}) {
  const out = {};
  for (const [k, v] of Object.entries(F || {})) {
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) out[k] = v;
  }
  return out;
}

// a short stable key for a conversation (FNV-1a over its texts)
export function convKey(entries = []) {
  const s = (entries || []).map((e) => `${e.name || ''}:${e.text || ''}`).join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

export class RunState {
  constructor({ dreamId, sceneKey = null } = {}) {
    if (!dreamId) throw new Error('RunState needs a dreamId');
    this.dreamId = dreamId;
    this.sceneKey = sceneKey;
    this.checkpointId = null;
    this.checkpointLabel = null;
    this.pos = null; // respawn point {x, y}
    this.lit = []; // checkpoint ids lit this run
    this.hearts = null;
    this.flags = {};
    this.inventory = [];
    this.walletDelta = 0; // the dream's coins this run
    this.extra = {}; // per-dream state (scene.runExtra())
    this.seenConvs = [];
    this.elapsed = 0;
    this.savedAt = 0;
    // conversations seen BEFORE this session (only those are skipped on resume)
    this._seenAtLoad = new Set();
  }

  static from(obj) {
    const r = new RunState({ dreamId: obj.dreamId, sceneKey: obj.sceneKey });
    for (const k of ['checkpointId', 'checkpointLabel', 'pos', 'hearts', 'walletDelta', 'elapsed', 'savedAt']) {
      if (obj[k] !== undefined) r[k] = obj[k];
    }
    r.lit = [...(obj.lit || [])];
    r.flags = { ...(obj.flags || {}) };
    r.inventory = [...(obj.inventory || [])];
    r.extra = JSON.parse(JSON.stringify(obj.extra || {}));
    r.seenConvs = [...(obj.seenConvs || [])];
    r._seenAtLoad = new Set(r.seenConvs);
    return r;
  }

  lightCheckpoint(id, label, pos) {
    this.checkpointId = id || null;
    this.checkpointLabel = label || null;
    this.pos = pos ? { x: Math.round(pos.x), y: Math.round(pos.y) } : this.pos;
    if (id && !this.lit.includes(id)) this.lit.push(id);
  }

  markConv(key) {
    if (key && !this.seenConvs.includes(key)) this.seenConvs.push(key);
  }

  hasSeenConv(key) {
    return this.seenConvs.includes(key);
  }

  // seen in an earlier session of this run (a resumed run skips these)
  seenBeforeResume(key) {
    return this._seenAtLoad.has(key);
  }

  // copy the live scene values in (flags, satchel, hearts, coins, extra)
  capture({ flags, inventory, hearts, walletDelta, extra, elapsed } = {}) {
    if (flags) this.flags = sanitizeFlags(flags);
    if (inventory) this.inventory = [...inventory].filter((x) => ['string', 'number'].includes(typeof x));
    if (hearts !== undefined) this.hearts = hearts;
    if (walletDelta !== undefined) this.walletDelta = walletDelta;
    if (extra !== undefined) this.extra = JSON.parse(JSON.stringify(extra || {}));
    if (elapsed !== undefined) this.elapsed = elapsed;
    return this;
  }

  toJSON() {
    return {
      dreamId: this.dreamId,
      sceneKey: this.sceneKey,
      checkpointId: this.checkpointId,
      checkpointLabel: this.checkpointLabel,
      pos: this.pos,
      lit: [...this.lit],
      hearts: this.hearts,
      flags: { ...this.flags },
      inventory: [...this.inventory],
      walletDelta: this.walletDelta,
      extra: JSON.parse(JSON.stringify(this.extra || {})),
      seenConvs: [...this.seenConvs],
      elapsed: this.elapsed,
      savedAt: this.savedAt,
    };
  }
}
