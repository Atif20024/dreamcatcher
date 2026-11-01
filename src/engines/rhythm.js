// Rhythm engine (pure logic, no Phaser): the Musician's call and response,
// lifted out of src/systems/rhythm.js so it can be an encounter (plan 2.10).
//
// A set is a list of phrases. Each phrase is played to Jo first (LISTEN: one
// beat per note, a click on a rest), then he answers it (PLAY: press on every
// note beat, leave every rest empty). A phrase can be
//   [1, 1, 0, 1]                 notes (1) and rests (0)
//   { beats: [...], blind: true } the icons are hidden: play it by ear
//   { hold: 4 }                  one long note: press on the beat, hold for 4
// and it may carry the music:
//   notes: [0, 2, null, 4]       a scale degree per slot; the preview and the hit
//                                events carry it as `pitch`, so a right answer
//                                plays the tune it was just played
//   div: 0.5                     each slot is an eighth (real syncopation)
//   third: true                  a "third bar": the offsets of its hits make `rush`
//   breath: 1500, song: 0        a pause after this bar (between songs)
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
  const common = { blind: !!p.blind, voice: p.voice || null, div: p.div || 1, third: !!p.third, breath: p.breath || 0, song: p.song ?? null };
  if (p.hold) return { ...common, beats: [1], hold: p.hold, notes: [p.notes ? p.notes[0] : null], div: 1 };
  const beats = rests === false && p.beats.some((b) => b === 1) ? p.beats.map(() => 1) : p.beats.slice();
  // a filled rest hammers the note before it (Tally's list: no silences)
  const given = p.notes || [];
  let last = given.find((n) => n !== null && n !== undefined) ?? null;
  const notes = beats.map((b, i) => {
    const n = given[i];
    if (n !== null && n !== undefined) return (last = n);
    return b === 1 ? last : null;
  });
  return { ...common, beats, notes, hold: 0, silent: beats.every((b) => b === 0) };
};

// how far to move a phrase's start so it lands on the band's nearest beat:
// sinceBeat ms after the band's last beat → ms to wait (negative: already late)
export function beatCorrection(sinceBeat, bandBeatMs) {
  const x = ((sinceBeat % bandBeatMs) + bandBeatMs) % bandBeatMs;
  return x > bandBeatMs / 2 ? bandBeatMs - x : -x;
}

export function rhythm({ bpm = 96, phrases = [[1, 1, 1, 1]], window = 150, rests = true, retries = 2, assist = 0.88, lead = 2, nervePerMiss = 16, nerveRelief = 12, freezeMs = 1500, judgeBeats = 0.75, gap = 0.5, nerve = 0, rushMs = 35 } = {}) {
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
    nerve,
    lastOk: null,
    previewed: -1,
    holding: false,
    holdStart: 0,
    held: 0,
    presses: 0,
    freezes: 0,
    offs: [], // every hit's offset from its slot (ms, negative is early)
    answered: -1,
    breathMs: 0,
  };
  const events = [];
  const cur = () => list[s.idx];
  const len = (p) => (p.hold ? p.hold : p.beats.length);
  const slot = (p) => s.beatMs * (p.div || 1);
  const mean = (a) => (a.length ? a.reduce((t, n) => t + n, 0) / a.length : 0);
  const thirdOffs = () => s.offs.filter((o) => o.third).map((o) => o.off);
  const startListen = () => {
    s.phase = 'listen';
    s.phaseT = 0;
    s.previewed = -1;
    s.answered = -1;
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
    const barOffs = s.offs.filter((o) => o.idx === s.idx && o.tries === s.tries).map((o) => o.off);
    events.push({ type: 'judge', idx: s.idx, ok, rushed: p.third && barOffs.length > 0 && mean(barOffs) < -rushMs });
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
    const from = cur();
    if (again) {
      s.tries += 1;
      s.beatMs /= assist; // a touch slower: the band waits for him
    } else {
      s.tries = 0;
      s.beatMs = 60000 / bpm; // the band waited for that bar, not for the rest of the set
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
    if (!again && from.breath) {
      s.phase = 'breath';
      s.phaseT = 0;
      s.breathMs = from.breath;
      events.push({ type: 'breath', song: from.song });
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
      if (!api.done) return null;
      const third = thirdOffs();
      const rush = Math.round(mean(third));
      return { ok: true, passes: s.passes, misses: s.misses, total: list.length, perfect: s.misses === 0, freezes: s.freezes, ms: Math.round(s.t), offsets: s.offs.map((o) => o.off), rush, rushed: third.length > 0 && rush < -rushMs };
    },
    phrases: list,
    retries,
    update(dt) {
      if (api.done) return;
      s.t += dt;
      s.phaseT += dt;
      const p = cur();
      const B = slot(p);
      if (s.phase === 'lead') {
        const b = Math.floor(s.phaseT / s.beatMs);
        if (b !== s.previewed && b < lead) {
          s.previewed = b;
          events.push({ type: 'lead', i: b, of: lead });
        }
        if (s.phaseT >= lead * s.beatMs) startListen();
        return;
      }
      if (s.phase === 'breath') {
        if (s.phaseT >= s.breathMs) startListen();
        return;
      }
      if (s.phase === 'frozen') {
        if (s.phaseT >= freezeMs) startListen();
        return;
      }
      if (s.phase === 'listen') {
        const beat = Math.floor(s.phaseT / B);
        if (beat >= 0 && beat !== s.previewed && beat < len(p)) {
          s.previewed = beat;
          if (p.hold) {
            if (beat === 0) events.push({ type: 'preview', i: 0, note: true, hold: p.hold, voice: p.voice, pitch: p.notes[0] });
          } else events.push({ type: 'preview', i: beat, note: p.beats[beat] === 1, voice: p.voice, pitch: p.notes[beat] });
        }
        if (s.phaseT >= len(p) * B + gap * s.beatMs) {
          s.phase = 'play';
          s.phaseT = 0;
          events.push({ type: 'play', idx: s.idx });
        }
        return;
      }
      if (s.phase === 'play') {
        // a voiced bar (Nia's, in the blank) keeps playing while Jo says nothing
        if (p.voice && !p.hold) {
          const b = Math.floor(s.phaseT / B);
          if (b !== s.answered && b < p.beats.length) {
            s.answered = b;
            events.push({ type: 'answer', i: b, voice: p.voice, pitch: p.notes[b] });
          }
        }
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
      const B = slot(p);
      // ms into the play bar; a press up to one window early (still in the
      // listen bar's last half beat) counts for the first beat
      let t = null;
      if (s.phase === 'play') t = s.phaseT;
      else if (s.phase === 'listen') {
        const left = len(p) * B + gap * s.beatMs - s.phaseT;
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
          s.offs.push({ idx: s.idx, tries: s.tries, off: t, third: p.third });
          events.push({ type: 'hit', i: 0, hold: true, off: t, pitch: p.notes[0] });
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
          // playing into a third bar's rest is the rush itself
          if (p.third) s.offs.push({ idx: s.idx, tries: s.tries, off: -window, third: true });
          events.push({ type: 'rest', i: best });
        }
        return 'rest';
      }
      if (s.hits[best] === null) {
        s.hits[best] = true;
        const off = t - best * B;
        s.offs.push({ idx: s.idx, tries: s.tries, off, third: p.third });
        events.push({ type: 'hit', i: best, off, pitch: p.notes[best] });
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
        beat: s.phaseT / (p ? slot(p) : s.beatMs),
        beatMs: p ? slot(p) : s.beatMs,
        beats: p ? p.beats : [],
        notes: p ? p.notes : [],
        div: p ? p.div : 1,
        third: !!(p && p.third),
        song: p ? p.song : null,
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
      return { t: s.phaseT, beatMs: slot(p), beats: p.beats, hold: p.hold, hits: s.hits.slice() };
    },
    // move the phrase's clock (the presenter lands a call on the band's beat)
    nudge(ms) {
      s.phaseT -= ms;
    },
  };
  return api;
}

export default rhythm;
