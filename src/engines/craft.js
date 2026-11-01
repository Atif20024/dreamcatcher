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
// A step's `mode` is the job's own way to play (default 'tap', as above):
//   mash    press `need` times while the brush is on the gold (a press off it
//           loses one back): crushing the stone
//   hold    the brush moves only while act is held; let go on the gold. Off
//           the gold, or run off the end, it starts again: the muller
//   double  two marks, at then at2, on one left-to-right pass: from the knee,
//           then it breaks. A pass that ends between them goes slack and the
//           fold starts again
// `stock` ({ ultramarine: 1, ... }) is what the job carries. A step with
// `uses` spends it on a hit; a miss on that step wastes it; a step whose
// colour is gone is finished in the cheap stuff (`instead` names it). Nothing
// here ever fails the job: the result says what was kept, wasted, substituted.
//   const e = craft({ steps: [{ label: 'grind it fine' }, …], speed: 0.7 });
//   e.update(dtMs); e.press(); e.state(); e.done; e.result
// Deterministic: marks come from the seed, time from update(dt).

const STEP_REST_MS = 250;

export function craft({ steps = [], speed = 0.7, zone = 0.18, assist = 0.85, minSpeed = 0.3, clock = null, rival = null, stock = null, seed = 5, driedMs = 900 } = {}) {
  const S = steps.map((st, i) => {
    const w = st.zone ?? zone;
    const c = st.at ?? 0.22 + ((seed * (i + 3) * 37) % 56) / 100;
    return { label: st.label || `step ${i + 1}`, section: st.section ?? 0, at: Math.min(1 - w / 2, Math.max(w / 2, c)), zone: w, auto: st.auto || 0, speed: st.speed ?? null, mode: st.mode || 'tap', need: st.need || 5, at2: st.at2 ?? null, zone2: st.zone2 ?? w, uses: st.uses || null, instead: st.instead || null, hint: st.hint || null };
  });
  const sectionStart = (i) => {
    let k = i;
    while (k > 0 && S[k - 1].section === S[i].section) k--;
    return k;
  };
  const s = { p: 0, dir: 1, speed, idx: 0, misses: 0, presses: 0, dried: 0, time: 0, clockLeft: clock, phase: 'play', phaseT: 0, last: null, autoT: 0, rival: 0, rivalDoneAt: null, rest: 0, mash: 0, sub: 0, holding: false, stock: stock ? { ...stock } : null, used: [], wasted: [], subbed: [] };
  // where the brush must be now (double: the mark it has not hit yet)
  const target = (st) => (st.mode === 'double' && s.sub ? { at: st.at2, zone: st.zone2 } : { at: st.at, zone: st.zone });
  const onTarget = (st) => {
    const t = target(st);
    return Math.abs(s.p - t.at) <= t.zone / 2;
  };
  const missed = (why = 'miss') => {
    s.misses += 1;
    s.last = why;
    s.speed = Math.max(minSpeed, s.speed * assist);
    const st = S[s.idx];
    // a miss on the precious step wastes the precious stuff
    if (s.stock && st.uses && s.stock[st.uses] > 0) {
      s.stock[st.uses] -= 1;
      s.wasted.push(st.uses);
    }
  };
  const api = {
    steps: S,
    get done() {
      return s.idx >= S.length;
    },
    get result() {
      if (!api.done) return null;
      return { ok: true, misses: s.misses, presses: s.presses, dried: s.dried, clean: s.misses <= Math.ceil(S.length / 3) && s.dried === 0, rivalFirst: s.rivalDoneAt !== null && s.rivalDoneAt < s.time, rival: Math.round(s.rival * 100) / 100, ms: Math.round(s.time), ...(s.stock ? { used: [...s.used], wasted: [...s.wasted], subbed: [...s.subbed] } : {}) };
    },
    update(dt) {
      if (api.done) return;
      s.time += dt;
      s.rest = Math.max(0, s.rest - dt);
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
        // (a step's own pace steadies after a miss like every other)
        const v = (st.speed ?? speed) * (s.speed / speed);
        if (st.mode !== 'hold' || s.holding) s.p += (s.dir * v * dt) / 1000;
        if (st.mode === 'hold' && s.p >= 1) {
          // ran off the end of the slab: start again
          s.holding = false;
          s.p = 0;
          missed();
        } else if (st.mode === 'double' && s.p >= 1) {
          // one way only: a pass that ends between the marks goes slack
          s.p -= 1;
          if (s.sub) {
            s.sub = 0;
            missed('slack');
          }
        } else if (s.p >= 1) {
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
      if (s.stock && prev.uses) {
        if (s.stock[prev.uses] > 0) {
          s.stock[prev.uses] -= 1;
          s.used.push(prev.uses);
        } else s.subbed.push(prev.uses);
      }
      s.idx += 1;
      s.p = 0;
      s.dir = 1;
      s.mash = 0;
      s.sub = 0;
      s.holding = false;
      // the last tap of a mash must not spill into the next step
      s.rest = STEP_REST_MS;
      // a new section of plaster is laid wet: the clock starts again
      if (clock && s.idx < S.length && S[s.idx].section !== prev.section) s.clockLeft = clock * (1 + 0.2 * s.dried);
    },
    // the player's press: 'hit' | 'miss' | 'wait' | 'done' | 'hold'
    press() {
      if (api.done) return 'done';
      const st = S[s.idx];
      if (s.phase !== 'play' || st.auto || s.rest > 0) return 'wait';
      if (st.mode === 'hold') {
        s.holding = true;
        s.last = 'hold';
        return 'hold';
      }
      s.presses += 1;
      if (onTarget(st)) {
        s.last = 'hit';
        if (st.mode === 'mash') {
          s.mash += 1;
          if (s.mash >= st.need) api.advance();
        } else if (st.mode === 'double' && !s.sub) s.sub = 1;
        else api.advance();
      } else {
        if (st.mode === 'mash') s.mash = Math.max(0, s.mash - 1);
        s.sub = 0;
        missed();
      }
      return s.last;
    },
    // the key came up (Encounters calls this): a held step lands or starts again
    release() {
      if (api.done || !s.holding) return null;
      const st = S[s.idx];
      s.holding = false;
      s.presses += 1;
      if (onTarget(st)) {
        s.last = 'hit';
        api.advance();
      } else {
        s.p = 0;
        missed();
      }
      return s.last;
    },
    // when the mark is next over the zone (ms from now): the auto-player's aim
    due() {
      if (api.done || s.phase !== 'play') return null;
      const st = S[s.idx];
      if (st.auto) return null;
      const t = target(st);
      return { p: s.p, dir: s.dir, at: t.at, half: t.zone / 2, inZone: onTarget(st), mode: st.mode, holding: s.holding };
    },
    // what a presenter draws
    state() {
      const st = S[Math.min(s.idx, S.length - 1)];
      return {
        p: s.p,
        idx: s.idx,
        n: S.length,
        label: api.done ? 'done' : s.stock && st.uses && !(s.stock[st.uses] > 0) && st.instead ? st.instead : st.label,
        at: target(st).at,
        zone: target(st).zone,
        mode: st.mode,
        hint: st.hint,
        marks: st.mode === 'double' ? [{ at: st.at, zone: st.zone, done: !!s.sub }, { at: st.at2, zone: st.zone2, done: false }] : [{ at: st.at, zone: st.zone, done: false }],
        mash: s.mash,
        need: st.need,
        holding: s.holding,
        stock: s.stock,
        wasted: s.wasted,
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
        inZone: !api.done && onTarget(st),
      };
    },
  };
  return api;
}

export default craft;
