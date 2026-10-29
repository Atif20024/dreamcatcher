// Craft engine (pure logic, no Phaser): THE MASTER'S LADDER's encounters.
// A workshop job is a list of steps (grind the stone, temper it with yolk,
// lay the gold ground, paint the fold…). For each step a brush mark sweeps
// along a bar and back; press `act` while it is over the step's gold mark to
// do the step. A miss slows the sweep a little (the hand steadies) and never
// fails: the master is patient.
//
// Plaster dries: with `clock` (ms) every section of steps must be finished
// before the clock runs out. If it dries, that patch is chipped off and laid
// fresh: the section starts again, the sweep slows, the clock refills.
// A `rival` ({ ms }) paints alongside at his own pace (the contest): he is
// shown, he is never waited for, and he never ends the job.
// A step with `auto: ms` is done by someone else while Jo holds the ladder
// (Bice paints the face): presses are ignored until it is done.
//
//   const e = craft({ steps: [{ label: 'grind it fine' }, …], speed: 0.7 });
//   e.update(dtMs); e.press(); e.state(); e.done; e.result
// Deterministic: marks come from the seed, time from update(dt).

export function craft({ steps = [], speed = 0.7, zone = 0.18, assist = 0.85, minSpeed = 0.3, clock = null, rival = null, seed = 5, driedMs = 900 } = {}) {
  const S = steps.map((st, i) => {
    const w = st.zone ?? zone;
    const c = st.at ?? 0.22 + ((seed * (i + 3) * 37) % 56) / 100;
    return { label: st.label || `step ${i + 1}`, section: st.section ?? 0, at: Math.min(1 - w / 2, Math.max(w / 2, c)), zone: w, auto: st.auto || 0, speed: st.speed ?? null };
  });
  const sectionStart = (i) => {
    let k = i;
    while (k > 0 && S[k - 1].section === S[i].section) k--;
    return k;
  };
  const s = { p: 0, dir: 1, speed, idx: 0, misses: 0, presses: 0, dried: 0, time: 0, clockLeft: clock, phase: 'play', phaseT: 0, last: null, autoT: 0, rival: 0, rivalDoneAt: null };
  const api = {
    steps: S,
    get done() {
      return s.idx >= S.length;
    },
    get result() {
      if (!api.done) return null;
      return { ok: true, misses: s.misses, presses: s.presses, dried: s.dried, clean: s.misses <= Math.ceil(S.length / 3) && s.dried === 0, rivalFirst: s.rivalDoneAt !== null && s.rivalDoneAt < s.time, rival: Math.round(s.rival * 100) / 100, ms: Math.round(s.time) };
    },
    update(dt) {
      if (api.done) return;
      s.time += dt;
      if (rival && s.rival < 1) {
        s.rival = Math.min(1, s.rival + dt / rival.ms);
        if (s.rival >= 1 && s.rivalDoneAt === null) s.rivalDoneAt = s.time;
      }
      if (s.phase === 'dried') {
        s.phaseT -= dt;
        if (s.phaseT <= 0) s.phase = 'play';
        return;
      }
      const st = S[s.idx];
      if (st.auto) {
        s.autoT += dt;
        if (s.autoT >= st.auto) {
          s.autoT = 0;
          api.advance();
        }
      } else {
        const v = st.speed ?? s.speed;
        s.p += (s.dir * v * dt) / 1000;
        if (s.p >= 1) {
          s.p = 2 - s.p;
          s.dir = -1;
        } else if (s.p <= 0) {
          s.p = -s.p;
          s.dir = 1;
        }
      }
      if (clock && !api.done) {
        s.clockLeft -= dt;
        if (s.clockLeft <= 0) {
          // the plaster dried: chip the patch off, lay it fresh, slow the sweep
          s.dried += 1;
          s.idx = sectionStart(Math.min(s.idx, S.length - 1));
          s.speed = Math.max(minSpeed, s.speed * assist);
          s.clockLeft = clock * (1 + 0.2 * s.dried);
          s.phase = 'dried';
          s.phaseT = driedMs;
          s.last = 'dried';
        }
      }
    },
    advance() {
      const prev = S[s.idx];
      s.idx += 1;
      s.p = 0;
      s.dir = 1;
      // a new section of plaster is laid wet: the clock starts again
      if (clock && s.idx < S.length && S[s.idx].section !== prev.section) s.clockLeft = clock * (1 + 0.2 * s.dried);
    },
    // the player's press: 'hit' | 'miss' | 'wait' | 'done'
    press() {
      if (api.done) return 'done';
      const st = S[s.idx];
      if (s.phase !== 'play' || st.auto) return 'wait';
      s.presses += 1;
      if (Math.abs(s.p - st.at) <= st.zone / 2) {
        s.last = 'hit';
        api.advance();
      } else {
        s.misses += 1;
        s.last = 'miss';
        s.speed = Math.max(minSpeed, s.speed * assist);
      }
      return s.last;
    },
    // when the mark is next over the zone (ms from now): the auto-player's aim
    due() {
      if (api.done || s.phase !== 'play') return null;
      const st = S[s.idx];
      if (st.auto) return null;
      return { p: s.p, dir: s.dir, at: st.at, half: st.zone / 2, inZone: Math.abs(s.p - st.at) <= st.zone / 2 };
    },
    // what a presenter draws
    state() {
      const st = S[Math.min(s.idx, S.length - 1)];
      return {
        p: s.p,
        idx: s.idx,
        n: S.length,
        label: api.done ? 'done' : st.label,
        at: st.at,
        zone: st.zone,
        auto: !api.done && !!st.auto,
        autoK: st.auto ? s.autoT / st.auto : 0,
        section: st.section,
        sections: S.length ? S[S.length - 1].section + 1 : 0,
        phase: api.done ? 'done' : s.phase,
        clock: clock ? Math.max(0, s.clockLeft) / (clock * (1 + 0.2 * s.dried)) : null,
        rival: rival ? s.rival : null,
        misses: s.misses,
        dried: s.dried,
        last: s.last,
        inZone: !api.done && Math.abs(s.p - st.at) <= st.zone / 2,
      };
    },
  };
  return api;
}

export default craft;
