// TUNE (THE LONG STRAIGHT, the garage): pure, no Phaser. Hold [E] and the jet
// screw turns; the engine's note moves against a reference (the trumpet note Jo
// knows); the two beat, and the beat slows to nothing when they agree. Let go
// when it has stopped. Past the end of the screw the carburettor floods, and
// the jet is back where it started.
//   const t = tune(); t.press(); t.update(ms); t.release(); t.state(); t.done; t.result
// Deterministic: time comes only from update(dt). `release` reverses the screw
// for the next hold, so a miss can be walked back.
export const TUNE_SLOT = 0.06; // of the screw's half-travel: the beat has stopped
export const BEAT_EDGE = 1.2; // Hz just outside the slot
export const BEAT_MAX = 9; // Hz at the end of the screw

// the jet's distance from the note → the beat you hear and see, in Hz
export function jetBeat(jet) {
  const a = Math.abs(jet);
  if (a <= TUNE_SLOT) return 0;
  return BEAT_EDGE + ((a - TUNE_SLOT) / (1 - TUNE_SLOT)) * (BEAT_MAX - BEAT_EDGE);
}

export function tune({ start = -0.7, rate = 0.36, floodMs = 1400 } = {}) {
  const s = { jet: start, dir: 1, holding: false, floodT: 0, floods: 0, misses: 0, ok: false };
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
      s.jet += (s.dir * rate * dt) / 1000;
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
      if (jetBeat(s.jet) === 0) {
        s.ok = true;
        return 'hit';
      }
      s.misses += 1;
      s.dir = s.jet > 0 ? -1 : 1; // the next hold turns it back towards the note
      return 'miss';
    },
    state() {
      return { jet: s.jet, hz: jetBeat(s.jet), holding: s.holding, flooded: s.floodT > 0, floods: s.floods, misses: s.misses };
    },
  };
  return api;
}

export default tune;
