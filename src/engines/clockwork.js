// Clockwork engine (pure logic, no Phaser): the proof dream's encounter.
// A hand sweeps the dial; each gear has a window (degrees). Press `act`
// while the hand is inside the current gear's window to seat it. A miss
// slows the hand a little (assist) and never fails: the dial is patient.
//
//   const e = clockwork({ gears: 3 });
//   e.update(dtMs); e.press(); e.state(); e.done; e.result
// Deterministic: windows come from the seed, time from update(dt).

export function clockwork({ gears = 3, speed = 150, window = 34, seed = 7, assist = 0.85, minSpeed = 70 } = {}) {
  // windows spread round the dial, away from the hand's start (0°)
  const windows = [];
  for (let i = 0; i < gears; i++) {
    const base = 90 + (i * 360) / gears + (((seed * (i + 3) * 37) % 50) - 25);
    windows.push({ center: ((base % 360) + 360) % 360, half: window / 2 });
  }
  const s = { angle: 0, speed, seated: 0, misses: 0, presses: 0, last: null, time: 0 };
  const inWindow = (a, w) => {
    const d = Math.abs(((a - w.center + 540) % 360) - 180);
    return d <= w.half;
  };
  const api = {
    windows,
    get done() {
      return s.seated >= gears;
    },
    get result() {
      return api.done ? { ok: true, misses: s.misses, presses: s.presses, ms: Math.round(s.time) } : null;
    },
    update(dt) {
      if (api.done) return;
      s.time += dt;
      s.angle = (s.angle + (s.speed * dt) / 1000) % 360;
    },
    // the player's press: 'hit' | 'miss' | 'done'
    press() {
      if (api.done) return 'done';
      s.presses += 1;
      const w = windows[s.seated];
      if (inWindow(s.angle, w)) {
        s.seated += 1;
        s.last = 'hit';
        s.speed *= 1.12; // each gear makes the next a touch livelier
      } else {
        s.misses += 1;
        s.last = 'miss';
        s.speed = Math.max(minSpeed, s.speed * assist);
      }
      return s.last;
    },
    // what a presenter draws
    state() {
      return { angle: s.angle, seated: s.seated, gears, current: api.done ? null : windows[s.seated], windows, last: s.last, misses: s.misses, inWindow: !api.done && inWindow(s.angle, windows[s.seated]) };
    },
  };
  return api;
}

export default clockwork;
