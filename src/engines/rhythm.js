// Rhythm engine (pure logic, no Phaser): the Musician's call and response,
// lifted out of src/systems/rhythm.js so it can be an encounter (plan 2.10).
//
// A set is a list of phrases. Each phrase is played to Jo first (LISTEN: one
// beat per note, a click on a rest), then he answers it (PLAY: press on every
// note beat, leave every rest empty). A phrase can be
//   [1, 1, 0, 1]                 notes (1) and rests (0)
//   { beats: [...], blind: true } the icons are hidden: play it by ear
//   { hold: 4 }                  one long note: press on the beat, hold for 4
// Variants per set: rests: false turns every rest into a note (Mr. Tally's
// set list: "no silences"); a phrase of only rests is "do nothing for a bar"
// (Ray's lesson), judged by staying silent.
//
// The gig is patient, like the clock: a missed phrase is played again a
// little slower (assist), up to `retries` times, then the band carries on.
// Misses raise NERVE; a passed phrase lowers it; at 100 Jo freezes for a
// moment (no input) and the phrase starts over. The encounter always ends in
// a finished set unless Jo walks off ([Esc]).
//
//   const e = rhythm({ bpm: 96, phrases: [[1,1,1,1], [1,0,1,1]] });
//   e.update(dtMs); e.press(); e.release(); e.state(); e.takeEvents(); e.done; e.result
// Deterministic: everything comes from update(dt).

const norm = (p, rests) => {
  if (Array.isArray(p)) p = { beats: p };
  if (p.hold) return { beats: [1], hold: p.hold, blind: !!p.blind, voice: p.voice || null };
  const beats = rests === false && p.beats.some((b) => b === 1) ? p.beats.map(() => 1) : p.beats.slice();
  return { beats, blind: !!p.blind, hold: 0, silent: beats.every((b) => b === 0), voice: p.voice || null };
};

export function rhythm({ bpm = 96, phrases = [[1, 1, 1, 1]], window = 150, rests = true, retries = 2, assist = 0.88, lead = 2, nervePerMiss = 16, nerveRelief = 12, freezeMs = 1500, judgeBeats = 0.75 } = {}) {
  const list = phrases.map((p) => norm(p, rests));
  const s = {
    t: 0,
    idx: 0,
    phase: lead > 0 ? 'lead' : 'listen',
    phaseT: 0,
    beatMs: 60000 / bpm,
    hits: [],
    passes: 0,
    misses: 0,
    tries: 0,
    nerve: 0,
    lastOk: null,
    previewed: -1,
    holding: false,
    holdStart: 0,
    held: 0,
    presses: 0,
    freezes: 0,
  };
  const events = [];
  const cur = () => list[s.idx];
  const len = (p) => (p.hold ? p.hold : p.beats.length);
  const startListen = () => {
    s.phase = 'listen';
    s.phaseT = 0;
    s.previewed = -1;
    s.hits = cur().beats.map(() => null);
    s.holding = false;
    s.held = 0;
    events.push({ type: 'phrase', idx: s.idx, tries: s.tries });
  };
  const addNerve = (n) => {
    s.nerve = Math.max(0, Math.min(100, s.nerve + n));
  };
  const judge = () => {
    const p = cur();
    let ok;
    if (p.hold) ok = s.hits[0] === true;
    else ok = p.beats.every((b, i) => (b === 1 ? s.hits[i] === true : s.hits[i] !== false));
    s.lastOk = ok;
    events.push({ type: 'judge', idx: s.idx, ok });
    if (ok) {
      s.passes += 1;
      addNerve(-nerveRelief);
    } else {
      const missed = p.hold ? 1 : p.beats.filter((b, i) => (b === 1 ? s.hits[i] !== true : s.hits[i] === false)).length;
      s.misses += missed;
      addNerve(nervePerMiss * Math.max(1, missed));
    }
    s.phase = 'judge';
    s.phaseT = 0;
  };
  const advance = () => {
    const ok = s.lastOk;
    const again = !ok && s.tries < retries;
    if (again) {
      s.tries += 1;
      s.beatMs /= assist; // a touch slower: the band waits for him
    } else {
      s.tries = 0;
      s.idx += 1;
      if (s.idx >= list.length) {
        s.phase = 'done';
        events.push({ type: 'done' });
        return;
      }
    }
    if (s.nerve >= 100) {
      // the freeze: the room goes quiet for a moment, then the band goes on
      s.phase = 'frozen';
      s.phaseT = 0;
      s.freezes += 1;
      s.nerve = 60;
      events.push({ type: 'freeze' });
      return;
    }
    startListen();
  };
  if (s.phase === 'listen') startListen();
  const api = {
    get done() {
      return s.phase === 'done';
    },
    get result() {
      return api.done ? { ok: true, passes: s.passes, misses: s.misses, total: list.length, perfect: s.misses === 0, freezes: s.freezes, ms: Math.round(s.t) } : null;
    },
    phrases: list,
    retries,
    update(dt) {
      if (api.done) return;
      s.t += dt;
      s.phaseT += dt;
      const p = cur();
      const B = s.beatMs;
      if (s.phase === 'lead') {
        if (s.phaseT >= lead * B) startListen();
        return;
      }
      if (s.phase === 'frozen') {
        if (s.phaseT >= freezeMs) startListen();
        return;
      }
      if (s.phase === 'listen') {
        const beat = Math.floor(s.phaseT / B);
        if (beat !== s.previewed && beat < len(p)) {
          s.previewed = beat;
          if (p.hold) {
            if (beat === 0) events.push({ type: 'preview', i: 0, note: true, hold: p.hold, voice: p.voice });
          } else events.push({ type: 'preview', i: beat, note: p.beats[beat] === 1, voice: p.voice });
        }
        if (s.phaseT >= (len(p) + 0.5) * B) {
          s.phase = 'play';
          s.phaseT = 0;
          events.push({ type: 'play', idx: s.idx });
        }
        return;
      }
      if (s.phase === 'play') {
        if (p.hold) {
          if (s.holding) {
            s.held = s.phaseT - s.holdStart;
            if (s.held >= (p.hold - 0.5) * B) {
              s.holding = false;
              s.hits[0] = true;
              events.push({ type: 'held', ok: true });
              judge();
            }
          } else if (s.hits[0] === null && s.phaseT > window * 1.5) {
            s.hits[0] = false;
            events.push({ type: 'miss', i: 0 });
            judge();
          }
          return;
        }
        // a note beat that passed unplayed is a miss
        p.beats.forEach((b, i) => {
          if (b === 1 && s.hits[i] === null && s.phaseT > i * B + window) {
            s.hits[i] = false;
            events.push({ type: 'miss', i });
          }
        });
        if (s.phaseT >= (p.beats.length - 1) * B + window + 60) judge();
        return;
      }
      if (s.phase === 'judge' && s.phaseT >= judgeBeats * B) advance();
    },
    // Jo plays a note: 'hit' | 'miss' (off the beat) | 'rest' (over a rest)
    // | 'stray' (not in a play bar) | 'frozen' | 'done'
    press() {
      if (api.done) return 'done';
      s.presses += 1;
      if (s.phase === 'frozen') return 'frozen';
      const p = cur();
      const B = s.beatMs;
      // ms into the play bar; a press up to one window early (still in the
      // listen bar's last half beat) counts for the first beat
      let t = null;
      if (s.phase === 'play') t = s.phaseT;
      else if (s.phase === 'listen') {
        const left = (len(p) + 0.5) * B - s.phaseT;
        if (left <= window) t = -left;
      }
      if (t === null) {
        events.push({ type: 'stray' });
        return 'stray';
      }
      if (p.hold) {
        if (s.hits[0] !== null || s.holding) return 'stray';
        if (Math.abs(t) <= window * 1.5) {
          s.holding = true;
          s.holdStart = t;
          events.push({ type: 'hit', i: 0, hold: true });
          return 'hit';
        }
        if (s.phase !== 'play') return 'stray';
        s.hits[0] = false;
        events.push({ type: 'miss', i: 0 });
        judge();
        return 'miss';
      }
      let best = -1;
      let bestD = Infinity;
      p.beats.forEach((b, i) => {
        const d = Math.abs(t - i * B);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best < 0 || bestD > window) {
        events.push({ type: 'stray' });
        return 'stray';
      }
      if (p.beats[best] === 0) {
        if (s.hits[best] === null) {
          s.hits[best] = false;
          events.push({ type: 'rest', i: best });
        }
        return 'rest';
      }
      if (s.hits[best] === null) {
        s.hits[best] = true;
        events.push({ type: 'hit', i: best });
        return 'hit';
      }
      return 'stray';
    },
    // the key comes up: only a held note cares
    release() {
      const p = cur();
      if (s.phase !== 'play' || !p || !p.hold || !s.holding) return null;
      s.holding = false;
      s.hits[0] = false;
      events.push({ type: 'held', ok: false });
      judge();
      return 'short';
    },
    // what a presenter draws
    state() {
      const p = api.done ? null : cur();
      const n = p ? len(p) : 0;
      return {
        idx: s.idx,
        total: list.length,
        phase: s.phase,
        beat: s.phaseT / s.beatMs,
        beatMs: s.beatMs,
        beats: p ? p.beats : [],
        len: n,
        blind: !!(p && p.blind),
        hold: p ? p.hold : 0,
        silent: !!(p && p.silent),
        hits: s.hits.slice(),
        holding: s.holding,
        heldFrac: p && p.hold ? Math.min(1, s.held / ((p.hold - 0.5) * s.beatMs)) : 0,
        passes: s.passes,
        misses: s.misses,
        tries: s.tries,
        nerve: s.nerve,
        lastOk: s.lastOk,
      };
    },
    // the events since the last call (presenter sounds and reactions)
    takeEvents() {
      return events.splice(0, events.length);
    },
    // the auto-player's view: when (ms into the play bar) each press is due
    due() {
      const p = api.done ? null : cur();
      if (!p || s.phase !== 'play') return null;
      return { t: s.phaseT, beatMs: s.beatMs, beats: p.beats, hold: p.hold, hits: s.hits.slice() };
    },
  };
  return api;
}

export default rhythm;
