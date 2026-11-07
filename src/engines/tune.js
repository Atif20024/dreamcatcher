// TUNE (THE LONG STRAIGHT, the garage): pure, no Phaser. Hold [E] and the jet
// screw turns; the engine's note moves against a reference (the trumpet note Jo
// knows); the two beat, and the beat slows to nothing when they agree. Let go
// when it has stopped. Past the end of the screw the carburettor floods, and
// the jet is back where it started.
//   const t = tune(); t.press(); t.update(ms); t.release(); t.state(); t.done; t.result
// Deterministic: time comes only from update(dt). `release` reverses the screw
// for the next hold, so a miss can be walked back. The house rule (escapement's
// `assist`): a poor hand cannot loop here. Each miss or flood widens the slot, and the
// screw drags near the note, so the stop can be heard coming.
export const TUNE_SLOT = 0.06; // of the screw's half-travel: the beat has stopped
export const SLOT_PER_MISS = 0.03;
export const SLOT_MAX = 0.12;
export const DETENT = 0.25; // inside this the screw turns at DETENT_RATE of its speed
export const DETENT_RATE = 0.5;
export const BEAT_EDGE = 1.2; // Hz just outside the slot
export const BEAT_MAX = 9; // Hz at the end of the screw

// the jet's distance from the note → the beat you hear and see, in Hz
export function jetBeat(jet, slot = TUNE_SLOT) {
  const a = Math.abs(jet);
  if (a <= slot) return 0;
  return BEAT_EDGE + ((a - slot) / (1 - slot)) * (BEAT_MAX - BEAT_EDGE);
}

export function tune({ start = -0.7, rate = 0.36, floodMs = 1400 } = {}) {
  const s = { jet: start, dir: 1, holding: false, floodT: 0, floods: 0, misses: 0, last: null, ok: false };
  const slot = () => Math.min(SLOT_MAX, TUNE_SLOT + SLOT_PER_MISS * (s.misses + s.floods));
  const api = {
    get done() {
      return s.ok;
    },
    get result() {
      return s.ok ? { ok: true, misses: s.misses, floods: s.floods, clean: !s.misses && !s.floods } : null;
    },
    update(dt) {
      if (s.ok) return;
      if (s.floodT > 0) {
        s.floodT -= dt;
        return;
      }
      if (!s.holding) return;
      s.jet += (s.dir * rate * (Math.abs(s.jet) < DETENT ? DETENT_RATE : 1) * dt) / 1000;
      if (Math.abs(s.jet) >= 1) {
        s.floods += 1;
        s.floodT = floodMs;
        s.holding = false;
        s.jet = start;
        s.dir = 1;
      }
    },
    press() {
      if (s.ok || s.floodT > 0) return 'wait';
      s.holding = true;
      return 'turn';
    },
    release() {
      if (!s.holding) return null;
      s.holding = false;
      if (jetBeat(s.jet, slot()) === 0) {
        s.ok = true;
        return 'hit';
      }
      s.misses += 1;
      s.last = s.jet * s.dir > 0 ? 'past' : 'early'; // turning away from the note: it went by
      s.dir = s.jet > 0 ? -1 : 1; // the next hold turns it back towards the note
      return 'miss';
    },
    state() {
      return { jet: s.jet, hz: jetBeat(s.jet, slot()), slot: slot(), holding: s.holding, flooded: s.floodT > 0, floods: s.floods, misses: s.misses, last: s.last };
    },
  };
  return api;
}

export default tune;
