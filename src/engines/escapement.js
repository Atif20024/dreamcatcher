// Escapement engine (pure logic, no Phaser): THE STOPPED HOUR's hand-timed
// work. A pendulum swings; press `act` as it crosses the middle. Once per
// crossing.
//   seat a gear   beats: 4, slip: true   a press off the middle lets the
//                 escapement slip one back (never below nothing, never a fail)
//   strike seven  beats: 7, patient: ms  a press off the middle is only late;
//                 and if Jo just stands and watches, the clock strikes by
//                 itself at the next crossing (the gentlest dream cannot be lost
//                 at its own payoff)
//
//   const e = escapement({ beats: 7, patient: 4000 });
//   e.update(dtMs); e.press(); e.state(); e.done; e.result
// Deterministic: time comes only from update(dt).

export function escapement({ beats = 4, period = 1600, window = 0.16, slip = false, patient = 0 } = {}) {
  const s = { t: 0, count: 0, misses: 0, presses: 0, slips: 0, last: null, cross: -1, since: 0, auto: 0 };
  // how far (in fractions of a period) the bob is from the middle, and which crossing that is
  const off = () => {
    const ph = (s.t % period) / period;
    return Math.min(ph, Math.abs(ph - 0.5), 1 - ph);
  };
  const crossing = () => Math.round((s.t / period) * 2);
  const strike = () => {
    s.count += 1;
    s.cross = crossing();
    s.since = 0;
  };
  const api = {
    get done() {
      return s.count >= beats;
    },
    get result() {
      return api.done ? { ok: true, misses: s.misses, presses: s.presses, slips: s.slips, auto: s.auto, clean: s.misses === 0 && s.auto === 0, ms: Math.round(s.t) } : null;
    },
    update(dt) {
      if (api.done) return;
      s.t += dt;
      s.since += dt;
      if (patient && s.since >= patient && off() <= window / 2 && crossing() !== s.cross) {
        s.auto += 1;
        s.last = 'auto';
        strike();
      }
    },
    // the player's press: 'hit' | 'miss' | 'done'
    press() {
      if (api.done) return 'done';
      s.presses += 1;
      if (off() <= window / 2 && crossing() !== s.cross) {
        s.last = 'hit';
        strike();
      } else {
        s.misses += 1;
        s.last = 'miss';
        if (slip && s.count > 0) {
          s.count -= 1;
          s.slips += 1;
        }
      }
      return s.last;
    },
    // what a presenter draws: x runs -1..1, 0 is the middle
    state() {
      return { x: Math.sin((2 * Math.PI * (s.t % period)) / period), count: s.count, beats, misses: s.misses, slips: s.slips, auto: s.auto, last: s.last, window, inWindow: !api.done && off() <= window / 2 && crossing() !== s.cross };
    },
  };
  return api;
}

export default escapement;
