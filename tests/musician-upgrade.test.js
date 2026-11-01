// THE BIG STAGE upgrade (docs/redesign/advice/deep_review_writer_musician.md,
// Part 2): the gigs are music, how Jo plays changes what happens, and the story
// lines are only said when they are true. Pure: engine, data, beats, dialogue.
import { describe, it, expect } from 'vitest';
import { rhythm, beatCorrection } from '../src/engines/rhythm.js';
import { neon, cellarGig, rayDrill, bigSet, bigSetPhrases, bigSetParams, bigSetCues, cellarPhrases, gigFlags, endingLines, bar } from '../src/dreams/musician/encounters/sets.js';
import { MUSIC_KEYS } from '../src/dreams/musician/music.js';
import { noteHz } from '../src/audio/modes.js';
import { BeatRunner } from '../src/play/BeatRunner.js';
import { Encounters } from '../src/play/Encounters.js';
import { DialogueRunner, conversationIssues } from '../src/narrative/DialogueRunner.js';
import beats from '../src/dreams/musician/beats.js';
import { slateEnc, faroEnc } from '../src/dreams/gambler/encounters/tables.js';
import { CONVERSATIONS, BARKS, CAST } from '../src/dreams/musician/dialogue.js';
import cellar from '../src/dreams/musician/rooms/cellar.js';
import backstage from '../src/dreams/musician/rooms/backstage.js';
import street from '../src/dreams/musician/rooms/street.js';
import escape from '../src/dreams/musician/rooms/escape.js';
import alley from '../src/dreams/musician/rooms/alley.js';
import { drowned } from '../src/dreams/musician/verbs/trumpet.js';

const DT = 1000 / 60;

// an auto-player: `offset` ms from each note's slot, nothing on a rest, holds
// a long note; returns every event (undrained, in order)
function perform(e, { offset = 0, skip = () => false, restPress = () => false } = {}) {
  const pressed = new Set();
  const out = [];
  let holding = false;
  for (let f = 0; f < 60000 && !e.done; f++) {
    e.update(DT);
    const st = e.state();
    const d = e.due();
    if (d && d.hold) {
      if (!holding && d.hits[0] === null) {
        holding = true;
        e.press();
      }
    } else if (d) {
      d.beats.forEach((b, i) => {
        const key = `${st.idx}:${st.tries}:${i}`;
        if (pressed.has(key) || d.t < i * d.beatMs + offset) return;
        pressed.add(key);
        if (b === 1 && !skip(st, i)) e.press();
        else if (b === 0 && restPress(st, i)) e.press();
      });
    } else holding = false;
    out.push(...e.takeEvents());
  }
  out.push(...e.takeEvents());
  return out;
}

// [call pitches], [answer pitches] per phrase and try
function callAndAnswer(events) {
  const bars = [];
  let cur = null;
  for (const ev of events) {
    if (ev.type === 'phrase') bars.push((cur = { idx: ev.idx, tries: ev.tries, call: [], answer: [] }));
    else if (ev.type === 'preview' && ev.note) cur.call.push(ev.pitch);
    else if (ev.type === 'hit') cur.answer.push(ev.pitch);
  }
  return bars;
}

const GIGS = [
  ['the neon', neon.params],
  ['the open mic', cellarGig.params],
  ["Ray's drill", rayDrill.params],
  ["the set on Nia's list", bigSetParams({ choice_nia: true })],
  ["the set on Tally's list", bigSetParams({ choice_tally: true })],
];

describe('the gigs are tunes: the answer is the call', () => {
  for (const [name, params] of GIGS) {
    it(`${name}: every bar's answer plays the notes of its call`, () => {
      const bars = callAndAnswer(perform(rhythm(params)));
      expect(bars.length).toBeGreaterThan(1);
      for (const b of bars) expect(b.answer).toEqual(b.call);
    });
  }

  it('the second bar is not the first bar carried on (the old counter bug)', () => {
    const bars = callAndAnswer(perform(rhythm(cellarGig.params)));
    expect(bars[1].answer[0]).toBe(bars[1].call[0]);
    expect(bars[1].answer[0]).not.toBe(bars[0].answer[bars[0].answer.length - 1] + 2);
    // (the first tune comes back in the second song, across the beat: on purpose)
    const c = cellarPhrases();
    expect(new Set(c.map((p) => `${p.div || 1}:${p.notes.join()}`)).size).toBe(c.length);
  });

  it('a bar played again is the same tune, and its answer still matches', () => {
    const e = rhythm({ bpm: 120, retries: 2, phrases: [bar('0 2 4 5')] });
    const bars = callAndAnswer(perform(e, { skip: (st, i) => st.tries === 0 && i === 1 }));
    expect(bars.length).toBe(2);
    expect(bars[1].call).toEqual(bars[0].call);
    expect(bars[1].answer).toEqual(bars[1].call);
  });

  it("a rest filled on Tally's list hammers the note before it", () => {
    const e = rhythm({ rests: false, phrases: [bar('4 . 7 .'), bar('. 2 3 4')] });
    expect(e.phrases[0].notes).toEqual([4, 4, 7, 7]);
    expect(e.phrases[1].notes).toEqual([2, 2, 3, 4]); // a leading rest takes the first note
  });
});

describe('the trumpet is in the band\'s key', () => {
  const pc = (hz, root) => ((Math.round(12 * Math.log2(hz / root)) % 12) + 12) % 12;

  it('the data: the old C major scale really did clash with the stage band', () => {
    expect(MUSIC_KEYS.stage.mode).toBe('mixolydian');
    expect(MUSIC_KEYS.stage.root).toBeCloseTo(82.41, 1); // E2
    const OLD_C_MAJOR = [262, 294, 330, 349, 392, 440, 494].map((f) => pc(f, 82.41));
    const E_MIXOLYDIAN = [0, 2, 4, 5, 7, 9, 10];
    expect(OLD_C_MAJOR.filter((n) => !E_MIXOLYDIAN.includes(n)).length).toBe(3); // C, F and G: each a semitone off
  });

  it('every note of the set is in E Mixolydian; the Cellar gig in D Dorian', () => {
    const inKey = (scale, phrases, allowed) => {
      for (const p of phrases) for (const n of p.notes) if (n != null) expect(allowed).toContain(pc(noteHz(scale, n), scale.root));
    };
    inKey(bigSet.scale, rhythm(bigSetParams({ choice_nia: true })).phrases, [0, 2, 4, 5, 7, 9, 10]);
    inKey(bigSet.scale, rhythm(bigSetParams({ choice_tally: true })).phrases, [0, 2, 4, 5, 7, 9, 10]);
    inKey(cellarGig.scale, rhythm(cellarGig.params).phrases, [0, 2, 3, 5, 7, 9, 10]);
    inKey(neon.scale, rhythm(neon.params).phrases, [0, 2, 3, 5, 7, 9, 10]);
    expect(bigSet.scale.root).toBe(MUSIC_KEYS.stage.root);
    expect(cellarGig.scale.root).toBe(MUSIC_KEYS.cellar.root);
  });

  it('a gig runs at the tempo of the band in its room', () => {
    expect(cellarGig.params.bpm).toBe(MUSIC_KEYS.cellar.bpm);
    expect(neon.params.bpm).toBe(MUSIC_KEYS.cellar.bpm); // the alley hears the cellar's trio
    expect(rayDrill.params.bpm).toBe(MUSIC_KEYS.cellar.bpm);
    expect(bigSetParams({}).bpm).toBe(MUSIC_KEYS.stage.bpm);
  });

  it('waiting for the beat keeps the call in time: the first interval is the grid', () => {
    const e = rhythm({ bpm: 86, lead: 0, phrases: [[1, 1, 1]] });
    e.takeEvents();
    e.nudge(beatCorrection(340, 60000 / 86));
    const at = [];
    for (let t = 0; at.length < 2 && t < 5000; t += DT) {
      e.update(DT);
      for (const x of e.takeEvents()) if (x.type === 'preview') at.push(t);
    }
    expect(Math.abs(at[1] - at[0] - 60000 / 86)).toBeLessThan(DT + 1);
  });

  it('a call only ever waits for the band', () => {
    expect(beatCorrection(10, 500)).toBe(-10); // on the beat, near enough
    expect(beatCorrection(490, 500)).toBe(10); // just before: wait a little
    expect(beatCorrection(1010, 500)).toBe(-10);
    expect(beatCorrection(0, 500) === 0).toBe(true);
    // well past a beat: wait for the next one, never run ahead
    expect(beatCorrection(100, 500)).toBe(400);
    expect(beatCorrection(340, 697)).toBe(357);
    for (let x = 25; x < 697; x += 7) expect(beatCorrection(x, 697)).toBeGreaterThan(0);
    const e = rhythm({ bpm: 120, lead: 0, phrases: [[1, 1]] });
    e.takeEvents();
    e.nudge(100);
    e.update(50);
    expect(e.takeEvents().filter((x) => x.type === 'preview').length).toBe(0); // not before its time
    e.update(60);
    expect(e.takeEvents().filter((x) => x.type === 'preview').length).toBe(1);
  });
});

describe('the gigs are different', () => {
  const rhythmOf = (p) => `${p.div || 1}:${p.beats.join('')}`;

  it('the neon and the open mic are no longer four even taps', () => {
    const n = neon.params.phrases.map(rhythmOf);
    const c = cellarPhrases().map(rhythmOf);
    expect(n.filter((r) => c.includes(r)).length).toBeLessThanOrEqual(1);
    expect(neon.params.phrases[0].beats.length).toBe(3);
    expect(new Set(c).size).toBeGreaterThanOrEqual(4);
    expect(new Set(neon.params.phrases.map((p) => p.notes.join())).size).toBe(2);
  });

  it('the open mic teaches in tiers: even, then rests, then a push across the beat', () => {
    const c = cellarPhrases();
    expect(c[0].beats.every((b) => b === 1) && c[1].beats.every((b) => b === 1)).toBe(true);
    expect(c[2].beats).toContain(0);
    expect(c[3].beats).toContain(0);
    expect(c[4].div).toBe(0.5);
    expect(c.findIndex((p) => p.div)).toBeGreaterThan(c.findIndex((p) => p.beats.includes(0)));
    expect(cellarGig.cues.phrase[c.findIndex((p) => p.beats.includes(0))].who).toBe('delphine');
  });

  it('every bar fills whole beats (the grid the band is on)', () => {
    const all = [...neon.params.phrases, ...cellarPhrases(), ...rayDrill.params.phrases, ...bigSetPhrases({ choice_nia: true }), ...bigSetPhrases({ choice_tally: true })];
    for (const p of all) if (!p.hold) expect(Number.isInteger(p.beats.length * (p.div || 1))).toBe(true);
  });

  it('an eighth-note bar is played on the eighths', () => {
    const e = rhythm({ bpm: 120, lead: 0, retries: 0, phrases: [bar('0 . 2 3 . 4 . .', { div: 0.5 })] });
    const ev = perform(e);
    expect(ev.filter((x) => x.type === 'hit').length).toBe(4);
    expect(e.result.perfect).toBe(true);
    // and on the quarters it fails
    const late = rhythm({ bpm: 120, lead: 0, retries: 0, phrases: [bar('0 . 2 3 . 4 . .', { div: 0.5 })] });
    perform(late, { offset: 0, skip: (st, i) => i === 3 });
    expect(late.result.perfect).toBe(false);
  });
});

describe('the third bar is mechanical', () => {
  const third = () => [bar('0 2 3 4'), bar('0 2 3 4'), bar('0 2 . 4', { third: true })];

  it('hit offsets are recorded, negative is early', () => {
    const e = rhythm({ bpm: 90, lead: 0, phrases: third() });
    const ev = perform(e, { offset: 20 });
    const hits = ev.filter((x) => x.type === 'hit');
    expect(hits.length).toBe(11);
    for (const h of hits) expect(h.off).toBeGreaterThanOrEqual(19);
    expect(e.result.offsets.length).toBe(11);
  });

  // an early press: during the play bar, ~70 ms before the slot
  function rushing(phrases, earlyOn) {
    const e = rhythm({ bpm: 90, lead: 0, phrases });
    const pressed = new Set();
    for (let f = 0; f < 60000 && !e.done; f++) {
      e.update(DT);
      const st = e.state();
      const d = e.due();
      if (!d) continue;
      d.beats.forEach((b, i) => {
        const key = `${st.idx}:${st.tries}:${i}`;
        if (b !== 1 || pressed.has(key)) return;
        const early = earlyOn(st) ? 70 : 0;
        if (i === 0 ? d.t >= 0 : d.t >= i * d.beatMs - early) {
          pressed.add(key);
          e.press();
        }
      });
    }
    return e;
  }

  it('early on the third bar is a rush; on time is not', () => {
    expect(rushing(third(), (st) => st.third).result.rushed).toBe(true);
    expect(rushing(third(), () => false).result.rushed).toBe(false);
    expect(rushing(third(), (st) => st.third).result.rush).toBeLessThan(-35);
  });

  it("it is measured against Jo's own bars: a late or early player is not a rusher", () => {
    for (const offset of [100, 60, 20]) {
      const e = rhythm({ bpm: 90, lead: 0, phrases: third() });
      perform(e, { offset });
      expect(e.result.rushed).toBe(false);
      expect(Math.abs(e.result.rush)).toBeLessThan(20);
    }
    // a player with 100 ms of speaker lag who hurries the third bar still rushes
    const e = rhythm({ bpm: 90, lead: 0, phrases: third() });
    const pressed = new Set();
    for (let f = 0; f < 60000 && !e.done; f++) {
      e.update(DT);
      const st = e.state();
      const d = e.due();
      if (!d) continue;
      d.beats.forEach((b, i) => {
        const key = `${st.idx}:${st.tries}:${i}`;
        if (b === 1 && !pressed.has(key) && d.t >= i * d.beatMs + (st.third ? 40 : 100)) {
          pressed.add(key);
          e.press();
        }
      });
    }
    expect(e.result.rushed).toBe(true);
  });

  it('rushing the other bars does not count', () => {
    const r = rushing(third(), (st) => !st.third).result;
    expect(r.rushed).toBe(false);
    expect(r.offsets.some((o) => o < -35)).toBe(true);
  });

  it('playing into a third bar\'s rest is the rush itself (the blank)', () => {
    const e = rhythm({ bpm: 120, lead: 0, retries: 0, phrases: [{ beats: [0, 0, 0, 0], third: true, voice: 'bass' }] });
    perform(e, { offset: -40, restPress: (st, i) => i === 1 });
    expect(e.result.rushed).toBe(true);
    // a press that lands late, nearest a rest, is lag and not hurry
    const lag = rhythm({ bpm: 120, lead: 0, retries: 0, phrases: [{ beats: [0, 0, 0, 0], third: true, voice: 'bass' }] });
    perform(lag, { offset: 40, restPress: (st, i) => i === 1 });
    expect(lag.result.rushed).toBe(false);
    const calm = rhythm({ bpm: 120, lead: 0, retries: 0, phrases: [{ beats: [0, 0, 0, 0], third: true, voice: 'bass' }] });
    perform(calm);
    expect(calm.result.rushed).toBe(false);
  });

  it('the judge says so at the bar, and the set has a third bar in every song', () => {
    const e = rhythm({ bpm: 90, lead: 0, phrases: third() });
    perform(e, { offset: 0 });
    expect(rushing(third(), (st) => st.third).takeEvents().some((x) => x.type === 'judge' && x.rushed)).toBe(true);
    for (const list of [bigSetPhrases({ choice_nia: true }), bigSetPhrases({ choice_tally: true })]) {
      for (const song of [0, 1, 2]) expect(list.filter((p) => p.song === song && p.third).length).toBe(1);
    }
    expect(cellarPhrases().filter((p) => p.third).length).toBe(2);
    expect(bigSetCues({ choice_nia: true }).third.who).toBe('nia');
    // whatever the list, somebody says so live: the ending never comes out of nowhere
    expect(bigSetCues({ choice_tally: true }).third.who).toBe('session');
    expect(bigSetCues({ choice_tally: true, marcus_stays: true }).third.who).toBe('marcus');
  });
});

describe('results change what happens, never whether it finishes', () => {
  // scripted players: clean, sloppy (misses a note a bar), silent (presses nothing)
  const players = {
    clean: {},
    sloppy: { skip: (st, i) => st.tries === 0 && i === 0 },
    silent: { skip: () => true },
  };
  for (const [who, how] of Object.entries(players)) {
    it(`a ${who} player finishes every gig`, () => {
      for (const [, params] of GIGS) {
        const e = rhythm(params);
        perform(e, how);
        expect(e.done).toBe(true);
        expect(e.result.ok).toBe(true);
      }
    });
  }

  // the masher: a key every 110 ms, whatever is on the staff
  const mash = (params) => {
    const e = rhythm(params);
    for (let f = 0, t = 0; f < 60000 && !e.done; f++) {
      e.update(DT);
      t += DT;
      if (t >= 110) {
        t = 0;
        e.press();
        e.release();
      }
      e.takeEvents();
    }
    return e;
  };

  it('mashing is not playing, on either list, and it still finishes', () => {
    for (const F of [{ choice_tally: true }, { choice_nia: true }]) {
      const e = mash(bigSetParams(F));
      expect(e.done).toBe(true);
      expect(e.result.perfect).toBe(false);
      expect(e.result.passes).toBeLessThan(e.result.total / 2);
    }
  });

  it('one slip in a bar is forgiven; the second is mashing', () => {
    const slip = rhythm({ bpm: 90, lead: 0, retries: 0, phrases: [[1, 1, 1, 1]] });
    perform(slip, { skip: () => false });
    expect(slip.result.perfect).toBe(true);
    const e = rhythm({ bpm: 90, lead: 0, retries: 0, phrases: [[1, 1]] });
    while (e.state().phase !== 'play') e.update(DT);
    expect(e.press()).toBe('hit');
    expect(e.press()).toBe('stray'); // one, free
    expect(e.press()).toBe('miss'); // two: mashing
  });

  it("Tally's list has no four-taps-a-second bar", () => {
    const t = rhythm(bigSetParams({ choice_tally: true }));
    expect(t.phrases.some((p) => p.div < 1)).toBe(false);
    expect(rhythm(bigSetParams({ choice_nia: true })).phrases.filter((p) => p.div < 1).length).toBe(1);
  });

  it('a freeze on the last bar of a song still gets the song change', () => {
    const e = rhythm({ bpm: 120, lead: 0, retries: 0, nervePerMiss: 60, phrases: [bar('0 1', { breath: 1500, song: 0 }), bar('0 1', { song: 1 })] });
    const seen = [];
    for (let f = 0; f < 60000 && !e.done; f++) {
      e.update(DT);
      for (const x of e.takeEvents()) if (x.type === 'freeze' || x.type === 'breath' || x.type === 'phrase') seen.push(x.type);
    }
    const i = seen.indexOf('freeze');
    expect(i).toBeGreaterThan(-1);
    expect(seen[i + 1]).toBe('breath');
    expect(seen[i + 2]).toBe('phrase');
  });

  it('a retried bar slows that bar, not the rest of the set', () => {
    const e = rhythm({ bpm: 120, retries: 2, nervePerMiss: 0, phrases: [[1, 1], [1, 1]] });
    const seen = [];
    for (let f = 0; f < 60000 && !e.done; f++) {
      e.update(DT);
      const st = e.state();
      if (st.phase === 'listen') seen.push([st.idx, st.tries, Math.round(st.beatMs)]);
    }
    const at = (i, t) => seen.find((x) => x[0] === i && x[1] === t)[2];
    expect(at(0, 2)).toBeGreaterThan(at(0, 0));
    expect(at(1, 0)).toBe(at(0, 0));
  });

  it('how it went reads: perfect, misses, freezes', () => {
    const clean = rhythm(cellarGig.params);
    perform(clean);
    expect(gigFlags('cellar', clean.result)).toEqual({ cellar_played: true, cellar_perfect: true, cellar_froze: false, cellar_rushed: false });
    const silent = rhythm(cellarGig.params);
    perform(silent, { skip: () => true });
    expect(silent.result.freezes).toBeGreaterThan(0);
    expect(gigFlags('cellar', silent.result)).toMatchObject({ cellar_perfect: false, cellar_froze: true });
    const sloppy = rhythm(cellarGig.params);
    perform(sloppy, { skip: (st, i) => st.idx === 1 && st.tries === 0 && i === 0 });
    expect(gigFlags('cellar', sloppy.result)).toMatchObject({ cellar_perfect: false, cellar_froze: false });
  });

  it('the encounter writes the flags before the win beat runs', async () => {
    const order = [];
    const F = {};
    const enc = new Encounters({
      defs: { gig: { ...cellarGig, params: { bpm: 120, lead: 0, phrases: [[1]] } } },
      host: { exit: () => order.push(`exit perfect=${F.cellar_perfect}`) },
    });
    const done = enc.start('gig', { flags: F });
    enc.finish({ ok: true, perfect: true, freezes: 0, rushed: false });
    await done;
    expect(order).toEqual(['exit perfect=true']);
    // the Gambler's own onResult(scene, result) belongs to its presenter: a
    // real def through the real Encounters must exit, and call nothing of its own
    const gambler = new Encounters({ defs: { slate: slateEnc }, host: {} });
    const p3 = gambler.start('slate', { flags: {} });
    gambler.finish({ ok: true, buyin: 100, down: 50, up: 300 });
    await p3;
    expect(gambler.busy).toBe(false);
    expect(faroEnc.onFlags).toBeUndefined();
    const left = {};
    const enc2 = new Encounters({ defs: { gig: { ...cellarGig, params: { phrases: [[1]] } } }, host: {} });
    const p2 = enc2.start('gig', { flags: left });
    enc2.finish({ ok: false, left: true }); // walking off writes nothing
    await p2;
    expect(left.cellar_perfect).toBeUndefined();
  });

  const said = async (beat, F) => {
    const lines = [];
    const noop = () => undefined;
    const r = new BeatRunner({
      beats,
      flags: () => F,
      delay: () => Promise.resolve(),
      handlers: { say: (v) => lines.push(v.text), set: (v) => (typeof v === 'string' ? (F[v] = true) : Object.assign(F, v)), music: noop, camera: noop, fade: noop, talk: noop, objective: noop, sting: noop, sfx: noop, anim: noop, lock: noop, call: noop, encounter: noop },
    });
    await r.play(beat);
    return lines;
  };

  it("the Cellar's clap follows the gig", async () => {
    const perfect = await said('cellar_done', { cellar_perfect: true });
    const froze = await said('cellar_done', { cellar_froze: true });
    const missed = await said('cellar_done', {});
    expect(perfect[0]).toMatch(/stopped washing glasses/);
    expect(froze[0]).toMatch(/Politely/);
    expect(missed[0]).not.toEqual(perfect[0]);
    expect(missed[0]).not.toEqual(froze[0]);
    expect(froze[1]).toMatch(/looked up once/);
    expect(perfect[1]).toMatch(/has not looked up/);
  });

  it('the set and the neon follow too', async () => {
    expect((await said('set_done', { set_froze: true }))[0]).toMatch(/forgave me/);
    expect((await said('set_done', {}))[0]).toMatch(/All of them/);
    expect(await said('neon_done', { neon_perfect: true })).not.toEqual(await said('neon_done', {}));
    expect((await said('ray_drill_done', { ray_drill_perfect: true }))[0]).not.toEqual((await said('ray_drill_done', {}))[0]);
  });

  it('what comes next: the Cellar and Ray reach into the set', () => {
    expect(rhythm(bigSetParams({ cellar_froze: true })).state().nerve).toBe(24);
    expect(rhythm(bigSetParams({})).state().nerve).toBe(0);
    expect(bigSetParams({ ray_drill_perfect: true }).nerveRelief).toBeGreaterThan(bigSetParams({}).nerveRelief);
    expect(bigSetParams({ marcus_stays: true }).window).toBeGreaterThan(bigSetParams({}).window);
    // N4: he cues the third bar ahead of time; letting him go costs that
    expect(bigSetCues({ choice_nia: true, marcus_stays: true }).thirdAhead.who).toBe('marcus');
    expect(bigSetCues({ choice_nia: true }).thirdAhead).toBeNull();
    // a shaken Jo freezes sooner: the same bad run, a worse night
    const run = (F) => {
      const e = rhythm(bigSetParams({ choice_nia: true, ...F }));
      perform(e, { skip: (st, i) => st.tries === 0 && i < 2 });
      return e.result.freezes;
    };
    expect(run({ cellar_froze: true })).toBeGreaterThanOrEqual(run({}));
  });

  it('the people around him react to a freeze and a rush', () => {
    for (const F of [{ choice_nia: true }, { choice_tally: true }, { choice_tally: true, marcus_stays: true }]) {
      const c = bigSetCues(F);
      expect(CAST[c.freeze.who]).toBeTruthy();
      if (c.third) expect(CAST[c.third.who]).toBeTruthy();
    }
  });

  it('the ending says what happened to the third bar, and only that', () => {
    const line = (F) => endingLines(F)[1];
    expect(line({ choice_nia: true, set_rushed: true })).toBe('Third bar. Every time. Somebody was listening.');
    expect(line({ choice_nia: true })).toMatch(/didn't rush.*Somebody/);
    expect(line({ choice_tally: true })).toMatch(/didn't rush.*Nobody/);
    expect(line({ choice_tally: true, set_rushed: true })).toMatch(/You rushed.*Nobody/);
    expect(endingLines({ marcus_stays: true }).join(' ')).toMatch(/napkin/);
    expect(endingLines({}).join(' ')).not.toMatch(/napkin/);
  });
});

// walk a conversation, always taking the first choice (or `pick`)
function walk(id, F = {}, pick = 0) {
  const fx = [];
  const r = new DialogueRunner(CONVERSATIONS[id], { flags: () => F, onSet: (k, v) => (F[k] = v), onEffect: (e) => fx.push(e) });
  const lines = [];
  while (r.node) {
    lines.push({ who: r.node.who, text: r.node.text, id: r.node.id });
    r.next(pick);
  }
  return { lines, fx, F };
}

describe('the story holds together', () => {
  it('every conversation is sound (speakers, targets, reachable)', () => {
    for (const c of Object.values(CONVERSATIONS)) expect(conversationIssues(c)).toEqual([]);
    for (const c of Object.values(CONVERSATIONS)) for (const n of Object.values(c.nodes)) expect(CAST[n.who]).toBeTruthy();
  });

  it('nine chairs hold nine different people', () => {
    const a = cellar.entities.filter((e) => e.type === 'audience');
    expect(a.length).toBe(9);
    expect(new Set(a.map((e) => e.cast)).size).toBe(9);
    expect(a.every((e) => e.cast.startsWith('ev-p-'))).toBe(true);
    // none of them is someone Jo meets elsewhere in this dream
    for (const name of ['marcus', 'nia', 'ray', 'delphine']) expect(a.some((e) => e.cast === `ev-p-${name}`)).toBe(false);
    const chairs = cellar.props.filter((p) => p.prop === 'club_chair');
    expect(chairs.length).toBe(9);
    // each sits on a chair
    for (const seat of a) expect(chairs.some((c) => c.x === seat.x && (c.dx || 0) === (seat.dx || 0))).toBe(true);
  });

  it('Ray says "every note right" only after every note was right', () => {
    const perfect = walk('ray_lesson', { cellar_perfect: true }).lines.map((l) => l.text).join(' ');
    const most = walk('ray_lesson', {}).lines.map((l) => l.text).join(' ');
    const froze = walk('ray_lesson', { cellar_froze: true }).lines.map((l) => l.text).join(' ');
    expect(perfect).toMatch(/You played every note right/);
    expect(most).not.toMatch(/You played every note right/);
    expect(froze).not.toMatch(/You played every note right/);
    expect(most).toMatch(/most of the notes/);
    expect(froze).toMatch(/Best thing you played/);
    // and every way in lands on the same lesson and starts the drill
    for (const F of [{ cellar_perfect: true }, {}, { cellar_froze: true }]) {
      const w = walk('ray_lesson', F);
      expect(w.lines.map((l) => l.text).join(' ')).toMatch(/A rest is a note too/);
      expect(w.lines.map((l) => l.text).join(' ')).toMatch(/Play the room/);
      expect(w.lines.length).toBeLessThanOrEqual(5);
      expect(w.fx).toContainEqual({ beat: 'ray_drill_start' });
      expect(w.F.ray_talked).toBe(true);
      expect(w.F.ray_lesson).toBeUndefined(); // the gate waits for the drill
    }
  });

  it("Ray's lesson is played: the drill opens the gate, with no nerve, and ends on a bar of nothing", async () => {
    const e = rhythm(rayDrill.params);
    expect(e.phrases[0].beats).toEqual([1, 1, 0, 1]);
    expect(e.phrases[1].silent).toBe(true);
    expect(e.phrases.length).toBe(2);
    perform(e, { skip: () => true });
    expect(e.result.freezes).toBe(0);
    const g = alley.entities.find((x) => x.id === 'g_dock');
    expect(g.requires).toContain('ray_lesson');
    expect(beats.ray_drill_done[0]).toEqual({ set: 'ray_lesson' });
    expect(rayDrill.onWin).toBe('ray_drill_done');
  });

  it('a laminate has a cause, in Marcus\'s first line', () => {
    expect(CONVERSATIONS.marcus_call.nodes.start.who).toBe('marcus');
    expect(CONVERSATIONS.marcus_call.nodes.start.text).toMatch(/laminate/);
    expect(CONVERSATIONS.marcus_call.nodes.start.text).toMatch(/catwalk/);
    // one voice on entry: the roadie bark waits for Marcus
    expect(BARKS.find((b) => b.id === 'roadie_mind').when.flag).toBe('marcus_left');
    expect(BARKS.find((b) => b.id === 'marcus_hey')).toBeUndefined();
  });

  it("Marcus speaks his own lines; narration is Jo's caption", async () => {
    const n = CONVERSATIONS.marcus_call.nodes;
    for (const k of ['go', 'stay', 'silent']) {
      expect(n[k].who).toBe('marcus');
      expect(n[k].text).not.toMatch(/\b(He|he|hugs|walks)\b/);
    }
    expect(n.go.effects).toContainEqual({ beat: 'marcus_goes' });
    expect(n.silent.effects).toContainEqual({ beat: 'marcus_walks' });
    // every line of narration anywhere is out of other people's mouths
    for (const c of Object.values(CONVERSATIONS)) {
      for (const node of Object.values(c.nodes)) if (node.who !== 'jo') expect(node.text).not.toMatch(/^(He|She) (hands|hugs|waits|picks)/);
    }
    const caption = beats.marcus_goes.find((s) => s.say);
    expect(caption.say.who).toBe('jo');
    expect(beats.marcus_goes[0]).toEqual({ call: 'afterTalk' }); // not over his line
    expect(beats.marcus_goes.some((s) => s.set === 'marcus_gone')).toBe(true);
    expect(backstage.entities.find((e) => e.id === 'marcus').unless).toBe('marcus_gone');
  });

  it('the napkin is planted before the ending pays it', () => {
    expect(CONVERSATIONS.marcus_call.nodes.m3.text).toMatch(/set list on his wall/);
    expect(CONVERSATIONS.marcus_call.nodes.m3.text).toMatch(/napkin/);
    expect(endingLines({ marcus_stays: true })[2]).toMatch(/his boy's wall/);
  });

  it("Marcus's scene cannot be walked past", async () => {
    const lines = [];
    const noop = () => undefined;
    const run = async (F) => {
      lines.length = 0;
      const r = new BeatRunner({ beats, flags: () => F, delay: () => Promise.resolve(), handlers: { talk: (id) => lines.push(id), say: noop, set: noop, call: (v) => v === 'markRoom' && (F._in_backstage = !F.left) } });
      await r.play('marcus_calls');
      return [...lines];
    };
    expect(await run({})).toEqual(['marcus_call']);
    expect(await run({ marcus_left: 'go' })).toEqual([]); // not a second time
    expect(await run({ left: true })).toEqual([]); // he walked back out in time
  });

  it('every path through Marcus leaves the flag the Evening reads', () => {
    expect(walk('marcus_call', {}, 0).F.marcus_left).toBe('go');
    expect(walk('marcus_call', {}, 1).F.marcus_left).toBe('stay');
    expect(walk('marcus_call', {}, 1).F.marcus_stays).toBe(true);
    expect(walk('marcus_call', {}, 2).F.marcus_left).toBe('silent');
  });

  it('Nia and Tally say what the gig earned', () => {
    expect(walk('nia_rush', { cellar_rushed: true }).lines[0].text).toBe('You rush the third bar.');
    expect(walk('nia_rush', {}).lines[0].text).toMatch(/held/);
    expect(walk('tally_offer', { cellar_froze: true }).lines[0].text).toMatch(/stopped dead/);
    expect(walk('tally_offer', { cellar_perfect: true }).lines[0].text).toMatch(/not one wrong note/);
    expect(walk('tally_offer', {}).lines[0].text).toBe("Nine people at the Cellar. I count. It's what I'm for.");
    expect(walk('delphine_after', { cellar_froze: true }).lines[0].text).toMatch(/You came back from it/);
    expect(walk('barkeep_after', { cellar_perfect: true }).lines[0].text).toMatch(/I stopped/);
    expect(walk('nia_coffee', { set_rushed: true }).lines.map((l) => l.text)[0]).toBe('Third bar.');
    expect(walk('nia_coffee', {}).lines[0].who).toBe('jo');
  });
});

describe('the climax is staged', () => {
  const nia = () => rhythm(bigSetParams({ choice_nia: true, marcus_stays: true }));

  it('three songs: a breath between each, then a held last note', () => {
    const ev = perform(nia());
    expect(ev.filter((x) => x.type === 'breath').map((x) => x.song)).toEqual([0, 1]);
    expect(ev.filter((x) => x.type === 'lead').length).toBe(4); // the crowd claps him in
    expect(ev.filter((x) => x.type === 'held' && x.ok).length).toBe(1);
    expect(bigSetCues({ choice_nia: true }).songs.length).toBe(3);
  });

  it('runs 60 to 90 seconds played cleanly', () => {
    const e = nia();
    perform(e);
    expect(e.result.perfect).toBe(true);
    expect(e.result.ms).toBeGreaterThan(60000);
    expect(e.result.ms).toBeLessThan(90000);
  });

  it("the blank: Nia's bass plays through the bar Jo leaves empty", () => {
    const ev = perform(nia());
    const bass = ev.filter((x) => x.voice === 'bass');
    expect(bass.filter((x) => x.type === 'preview').map((x) => x.pitch)).toEqual([0, 0, 3, 4]);
    expect(bass.filter((x) => x.type === 'answer').map((x) => x.pitch)).toEqual([0, 0, 3, 4]);
    expect(bigSetCues({ choice_nia: true }).soloist).toBe('nia_set');
    expect(bigSetCues({ choice_tally: true }).soloist).toBeNull();
  });

  it('the set list still follows the choice', () => {
    const t = rhythm(bigSetParams({ choice_tally: true }));
    expect(t.phrases.filter((p) => p.beats.includes(0)).length).toBe(0);
    expect(t.phrases.filter((p) => p.blind).length).toBe(2);
    const n = nia();
    expect(n.phrases.filter((p) => p.beats.includes(0) && !p.silent).length).toBeGreaterThanOrEqual(8);
    expect(n.phrases.some((p) => p.silent && p.voice === 'bass')).toBe(true);
    expect(n.phrases[n.phrases.length - 1].hold).toBe(4);
  });
});

describe('the rooms use what they have', () => {
  it('the street has people and two more things that answer the horn', () => {
    const res = street.entities.filter((e) => e.type === 'resonant');
    expect(res.map((e) => e.id).sort()).toEqual(['bin', 'horn', 'pane']);
    for (const r of res) expect(beats[r.beat]).toBeTruthy();
    const people = street.entities.filter((e) => e.type === 'npc' && e.x > 29 && e.x < 71);
    expect(people.length).toBeGreaterThanOrEqual(1);
    for (const p of people) for (const t of p.talk) expect(CONVERSATIONS[t.conv]).toBeTruthy();
  });

  it('backstage: Marcus sits, Nia sits on the sofa by her bass, the mirror and the amp answer', () => {
    const by = (id) => backstage.entities.find((e) => e.id === id);
    expect(by('marcus').pose).toBe('sit');
    expect(by('nia').pose).toBe('sit');
    const sofa = backstage.props.find((p) => p.prop === 'sofa');
    expect(by('nia').x).toBe(sofa.x);
    expect(Math.abs(backstage.props.find((p) => p.prop === 'double_bass').x - sofa.x)).toBeLessThanOrEqual(3);
    expect(backstage.props.some((p) => p.prop === 'road_case' && p.x === by('marcus').x)).toBe(true);
    expect(by('mirror').record).toBe(false);
    expect(beats.mirror[0].say.text).toBe("Tuesday's face. Saturday's jacket.");
    expect(beats[by('amp').beat]).toBeTruthy();
  });

  it('the stairs: one landing where the horn is drowned, with a wisp on it', () => {
    const room = { data: escape, ty: escape.origin.ty };
    const py = (row) => (row + escape.origin.ty) * 32 + 16;
    expect(drowned(room, py(20))).toBe(true);
    expect(drowned(room, py(25))).toBe(false);
    expect(drowned(room, py(17))).toBe(false);
    expect(drowned({ data: street, ty: 0 }, py(20))).toBe(false);
    const wisp = escape.entities.find((e) => e.id === 'wisp_s2');
    expect(wisp.y).toBeGreaterThanOrEqual(escape.roar.rows[0]);
    expect(wisp.y).toBeLessThanOrEqual(escape.roar.rows[1]);
    // only the one: the other two wisps still fall to the horn
    expect(escape.entities.filter((e) => e.kind === 'wisp' && e.y >= escape.roar.rows[0] && e.y <= escape.roar.rows[1]).length).toBe(1);
  });
});
