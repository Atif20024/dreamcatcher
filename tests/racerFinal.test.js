// The final Racer review's fixes (docs/redesign/advice/racer_final_review.md), held: the numbers in the
// lines are the game's own, the crossing is a choice, the help is no farm, the wheel is worth something
// everywhere, Sable's clauses cost, and worn tyres at the Salt Road are a fight a careful car wins.
import { describe, it, expect } from 'vitest';
import { TUNE } from '../src/engines/race.js';
import { TRACKS } from '../src/dreams/racer/race/tracks.js';
import { raceFor } from '../src/dreams/racer/race/script.js';
import { applyResult, prizeOwed, flagOf, spoken, clock } from '../src/dreams/racer/race/result.js';
import { CUES, STORY, AIR, RADIO, DRILL, aldoGrid, gridLine, cardLines, numberWord, seconds } from '../src/dreams/racer/race/words.js';
import { CONVERSATIONS, BARKS } from '../src/dreams/racer/dialogue.js';
import beats from '../src/dreams/racer/beats.js';
import { endingLines, settlePrize, clausePay, PAPERS, TIN, PRICES } from '../src/dreams/racer/season.js';
import { MARKS } from '../src/dreams/racer/rooms/nightbefore.js';
import { carTune } from '../src/dreams/racer/race/car.js';
import { driveInput } from '../src/dreams/racer/race/controls.js';
import { layoutRace, slabSteer } from '../src/input/touchLayout.js';
import { tidy, coppaBot, runRace, rusty, newcomer } from './raceBots.js';
import { dodge, steerTo } from '../src/engines/rivals.js';

const F = { tuned: true };
const P = TRACKS.pinewood;
const S = TRACKS.salt;
const C = TRACKS.coppa;
const driven = (T, drive, cassian = 'pass') => (T.id === 'coppa' ? coppaBot({ drive, cassian }) : drive);

// ---- 1. every number in a line is one the game makes true ----------------------------
describe('the numbers in the lines', () => {
  const NUM = /\b(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|hundred|half|twice|once)\b/gi;
  const lines = [];
  for (const [id, c] of Object.entries(CONVERSATIONS)) {
    for (const [k, n] of Object.entries(c.nodes)) {
      if (n.text) lines.push([`${id}.${k}`, n.text]);
      for (const ch of n.choices || []) lines.push([`${id}.${k}`, ch.text]);
    }
  }
  for (const b of BARKS) lines.push([`bark.${b.id}`, b.text]);
  const walk = (k, list) => list.forEach((s) => (s.say && lines.push([`beat.${k}`, s.say.text]), s.then && walk(k, s.then), s.else && walk(k, s.else)));
  for (const [k, list] of Object.entries(beats)) walk(k, list);
  for (const [name, tbl] of Object.entries({ CUES, STORY, AIR })) for (const [k, [, t]] of Object.entries(tbl)) lines.push([`${name}.${k}`, t]);
  for (const [k, t] of Object.entries({ ...RADIO, ...DRILL })) lines.push([`radio.${k}`, t]);
  for (const flags of [{}, { helped_cassian: true, broke_orders: true }, { passed_cassian: true, sable_whole: true, roche_burnt: true }]) endingLines(flags).forEach((t) => lines.push(['ending', t]));

  // what the game makes true (built from its own numbers) …
  const GAME = [
    new RegExp(`Pinewood in ${spoken(P.gate.time).toLowerCase()}`),
    new RegExp(`costs\\. ${numberWord(PRICES.medicine)}\\.`, 'i'),
    new RegExp(`dresser\\. ${numberWord(TIN)}\\.`, 'i'),
    /what we paid you to hold/,
    new RegExp(`pays ${numberWord(S.prize[S.gate.place])}\\.`),
    new RegExp(`Top ${numberWord(S.gate.place)} go on the sheet`),
    new RegExp(`^${numberWord(PAPERS.length)} papers`, 'i'),
    new RegExp(`^${numberWord(MARKS.length)} marks`, 'i'),
    new RegExp(seconds(TUNE.pitClean), 'i'),
    new RegExp(seconds(TUNE.pitBox), 'i'),
    new RegExp(seconds(TUNE.pitMiss), 'i'),
    /Strike one clause on each/, // (PAPERS: two clauses a paper, one struck)
    /One late/, // (the drill's miss count: beats.js pit_done)
  ];
  // … and what is only the story's (a time of day, a life, a count that is nobody's rule)
  const STORY_ONLY = [
    /the one who plays/, /one note from another/, /one of these/, /1958/, /Forty years on/, /every one/, /one new set/, /Thirty years/i, /thirty years/, /the two of us/, /in by nine/, /looked at it twice/,
    /Thirty days/, /thirty days/, /in nine\b/, /checked them twice/, /at four/, /counting it twice/, /never once/, /two hours/, /one thing nobody/,
    /at eight, a clean shirt/, /a fifth of what you won/, /the one who saw/, /burnt one/, /I do not have one/, /nine times/, /This one/, /new one/,
    /in a week/, /been a week/, /at seven/, /The real one is the old one/, /Fourth pays nothing/, /coughed till four/, /four tyres/, /Eight rows/, /not one of them/,
    /the one time/, /the last one/, /into that one/, /no tyres by the second lap/i, /every night for a month/, /angry with you for a month/,
  ];
  const found = (t) => t.match(NUM) || [];
  it('no line states a number that is not the game\'s, or plainly the story\'s', () => {
    const left = [];
    for (const [where, text] of lines) {
      let t = text;
      for (const re of [...GAME, ...STORY_ONLY]) t = t.replace(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`), ' ');
      if (found(t).length) left.push(`${where}: ${text}`);
    }
    expect(left).toEqual([]);
  });
  it('the game\'s own numbers are said where they are meant to be', () => {
    for (const re of GAME) expect(lines.some(([, t]) => re.test(t)), re.source).toBe(true);
    // (the ones the review named, gone: Aldo's thirty-four, the four seconds at the gate, the six for Roche)
    const all = lines.map(([, t]) => t).join(' ');
    expect(all).not.toMatch(/thirty-four|Four seconds|six seconds|Six seconds|long way back|on the left\. I like|past the second straight/i);
  });
  it("Aldo's time is his: the grid, the card and a retry agree, and the eased bar is said as what he will take", () => {
    const own = P.gate.time;
    expect(aldoGrid(raceFor(P, F).track.gate)).toContain(spoken(own));
    const eased = raceFor(P, F, { tries: 2 }).track.gate;
    expect(eased.was).toBe(own);
    const said = aldoGrid(eased);
    expect(said.startsWith(spoken(own))).toBe(true);
    expect(said).toContain(spoken(eased.time).toLowerCase());
    expect(gridLine({ ...P, gate: eased })[1]).toBe(said);
    const run = { place: 1, time: own + 1, gap: null, flags: { clean: true, rubs: 0, spins: 0, offroads: 0, slings: 0, lifts: 0, launched: true } };
    const card = cardLines({ ...P, gate: eased }, run, true, {}, 12, 0, null).join(' ');
    expect(card).toContain(`Aldo's time: ${clock(own)}. He will take ${clock(eased.time)}.`);
    expect(card).toContain('The seat is yours');
    expect(cardLines(P, run, false, { [flagOf('pinewood', 'time')]: own + 1 }, 0, 0, null).join(' ')).toContain(`Aldo's time: ${clock(own)}.`);
  });
  it('a stop the crew drills is what Tullio says it is', () => {
    expect(DRILL.clean).toMatch(/a second and a half/i);
    expect(seconds(1.5)).toBe('a second and a half');
    expect(seconds(2.5)).toBe('two and a half seconds');
    expect(seconds(5)).toBe('five seconds');
  });
});

// ---- 2. the crossing: tests/script.test.js 'brake and wait is a real choice' and 'the bell' ----
describe('the crossing, by the radio', () => {
  it('the radio does not promise a wait it cannot keep', () => {
    expect(STORY.crossing_bell[1]).toBe('The bell. Make it, or brake and wait.');
    expect(STORY.gate[1]).not.toMatch(/\d|second/i);
  });
});

// ---- 3. the help after a miss: a pack a little off, never a farm --------------------
describe('the help is no farm', () => {
  it('about 0.06 a try on average, never under a quarter off, four tries at most', () => {
    const eased = (n) => raceFor(C, F, { tries: n }).rivals.find((c) => c.id === 'dante').top / C.rivals.find((c) => c.id === 'dante').top;
    const steps = [1, 2, 3, 4].map((n) => eased(n));
    expect(steps[0]).toBeCloseTo(1 - TUNE.easeFirst, 5);
    expect((1 - steps[3]) / 4).toBeLessThan(0.07);
    expect(eased(9)).toBeGreaterThanOrEqual(TUNE.easeFloor - 1e-9);
    expect(TUNE.easeFloor).toBeGreaterThanOrEqual(0.75);
  });
  it('a helped run is paid what the gate pays: P1 at the Salt Road after a miss is third\'s money', () => {
    const helped = raceFor(S, F, { tries: 2 }).track;
    const f = applyResult({ [flagOf('salt', 'tries')]: 2 }, helped, { place: 1, time: 60 });
    expect(prizeOwed(f, 'salt')).toBe(S.prize[S.gate.place]);
    expect(prizeOwed(applyResult({}, S, { place: 1, time: 53 }), 'salt')).toBe(S.prize[1]); // (unhelped, the place pays)
  });
  it('giving up twice past half the road and winning pays no more than third', () => {
    let f = {};
    for (let i = 0; i < 2; i++) f = { ...f, [flagOf('salt', 'tries')]: (f[flagOf('salt', 'tries')] || 0) + 1 };
    const r = raceFor(S, F, { tries: f[flagOf('salt', 'tries')] });
    expect(prizeOwed(applyResult(f, r.track, { place: 1, time: 55 }), 'salt')).toBe(S.prize[3]);
  });
});

// ---- 4. the wheel: never steering costs on every road, and the line is a question on each --
describe('the wheel is worth something everywhere', () => {
  // only round what stands in the road or a car's tail: never for a bend
  const noWheel = (base) => (r) => {
    const o = base(r);
    const c = r.jo;
    const near = r.obstacles.some((q) => !q.gone && q.d + q.len > c.d - 4 && q.d - c.d < 60) || r.rivals.some((q) => q.state === 'run' && q.d > c.d - 4 && q.d - c.d < 12 && Math.abs(q.x - c.x) < 0.5);
    return { ...o, steer: near ? steerTo(c, dodge(r, c) ?? c.x) : 0 };
  };
  for (const T of [P, S, C]) {
    it(`${T.id}: never steering costs more than a second, alone or in the pack`, () => {
      for (const road of [{ ...T, rivals: [], rival: undefined }, T]) {
        const steered = runRace(road, F, driven(road, tidy())).r.result.time;
        const { r } = runRace(road, F, driven(road, noWheel(tidy())), { secs: 200 });
        expect(r.result ? r.result.time - steered : Infinity).toBeGreaterThan(1);
      }
    });
  }
  it('the rusty and the new driver still get there (tests/script.test.js holds the tries)', () => {
    for (const T of [P, S, C]) {
      const { r } = runRace(T, F, driven(T, rusty({ track: T })), { tries: 2 });
      expect(r.result.passed).toBe(true);
      expect(runRace(T, F, driven(T, newcomer({ track: T })), { tries: 4 }).r.result.passed).toBe(true);
    }
  });
});

// ---- 5. Sable's clauses: each costs, and HOLD is not a nut ------------------------------
describe("Sable's papers", () => {
  it('breaking HOLD costs more than holding: second on HOLD broken pays less than third held', () => {
    for (const cut of [false, true]) {
      const broke = settlePrize({ sable_orders: true, broke_orders: true, sable_cut: cut }, 'salt', S.prize[2]).paid;
      const held = settlePrize({ sable_orders: true, sable_cut: cut }, 'salt', S.prize[3]).paid;
      expect(held - broke).toBeGreaterThan(1);
      // (and winning on HOLD broken is still worth less than third held)
      expect(held).toBeGreaterThanOrEqual(settlePrize({ sable_orders: true, broke_orders: true, sable_cut: cut }, 'salt', S.prize[1]).paid);
    }
  });
  it('every clause left standing costs something: the fifth, the laundry, the lien, the heat', () => {
    expect(settlePrize({ sable_cut: true }, 'salt', 12).fifth).toBeGreaterThan(0);
    expect(settlePrize({ sable_dinners: true }, 'salt', 12).laundry).toBe(clausePay('sable_dinners'));
    expect(settlePrize({ sable_dinners: true, papers_settled: true }, 'salt', 12).laundry).toBe(0); // (once)
    expect(clausePay('sable_lien')).toBeGreaterThan(0); // (verbs/garage.js callLien takes it back at the Coppa)
    const T = { ...S, rivals: [] };
    const plain = runRace(T, F, tidy()).r.result.time;
    expect(runRace(T, { ...F, oil_sable: true }, tidy(), { tune: carTune(T, { ...F, oil_sable: true }) }).r.result.time - plain).toBeGreaterThan(0.15);
  });
  it('the dinners are heard of again, at the pit wall', () => {
    expect(CONVERSATIONS.tullio_pit.nodes.dine).toMatchObject({ if: 'sable_dinners' });
    expect(CONVERSATIONS.tullio_pit.nodes.start.else).toBe('dine');
  });
});

// ---- 6. worn tyres at the Salt Road: a careful car wins it, a sloppy one does not -------
describe('worn tyres against Brasca', () => {
  const worn = { ...F, tyres_short: true };
  it('a careful car is on the sheet with room, and ahead of Brasca', () => {
    for (const bot of [tidy(), tidy({ margin: 15, k: 0.95 })]) {
      const { r } = runRace(S, worn, bot);
      expect(r.result.place).toBeLessThanOrEqual(3);
      const t0 = r.result.time;
      for (let i = 0; i < 60 * 120 && r.rivals.some((c) => c.finished === null); i++) r.step(bot(r));
      const fourth = [...r.rivals.map((c) => c.finished)].sort((a, b) => a - b)[2];
      expect(fourth - t0).toBeGreaterThan(1.5);
      expect(r.rivals.find((c) => c.id === 'teo').finished).toBeGreaterThan(t0);
    }
  });
  it('a sloppy car is not, the first time', () => {
    expect(runRace(S, worn, rusty({ track: S })).r.result.passed).toBe(false);
  });
  it('Brasca is bald by the crossing, as he says', () => {
    const r = raceFor(S, F);
    const bot = tidy();
    const gate = S.things.find((o) => o.kind === 'crossing');
    let faded = null;
    for (let i = 0; i < 120 * 120 && !r.result; i++) {
      r.step(bot(r));
      for (const e of r.drain()) if (e.type === 'fade' && e.id === 'teo') faded = r.rivals.find((c) => c.id === 'teo').d;
    }
    expect(faded).not.toBeNull();
    expect(faded).toBeLessThan(gate.d);
  });
});

// ---- 9. the slab is a wheel, not two keys --------------------------------------------
describe('touch steering is analog', () => {
  const L = layoutRace({ cssW: 960, cssH: 540 });
  const y = L.slab.top + 20;
  it('nothing in the dead strip, more the further out, full lock short of the edge', () => {
    const S2 = L.slab;
    expect(slabSteer(L, S2.mid, y)).toBe(0);
    expect(slabSteer(L, S2.mid + S2.dead / 2 - 1, y)).toBe(0);
    const a = slabSteer(L, S2.mid + S2.sw * 0.3, y);
    const b = slabSteer(L, S2.mid + S2.sw * 0.6, y);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(slabSteer(L, S2.mid + S2.sw * 0.85, y)).toBe(1);
    expect(slabSteer(L, S2.mid - S2.sw * 0.85, y)).toBe(-1);
    expect(slabSteer(L, S2.mid - S2.sw * 0.3, y)).toBeCloseTo(-a, 5);
    expect(slabSteer(L, 900, 100)).toBeNull(); // (off the slab)
  });
  it('the thumb is taken as it stands; keys and the pad are as they were without one', () => {
    const inputs = { isDown: (a) => a === 'right' };
    expect(driveInput(inputs, null, 0, 16, 0.4).steer).toBe(0.4);
    expect(driveInput(inputs, null, 0, 16, null).steer).toBeGreaterThan(0);
    expect(driveInput(inputs, null, 0, 16, null).steer).toBeLessThan(1); // (the key's ramp)
  });
});

// ---- 10. the card: one thing a sentence ----------------------------------------------
describe('the card', () => {
  const run = (o = {}) => ({ place: 2, time: 54, gap: 0.6, flags: { clean: false, rubs: 0, spins: 0, offroads: 0, slings: 0, lifts: 1, launched: true, slowest: null, ...o } });
  const card = (track, r, pass, flags = {}, owed = 0, sang = 0, nearest = 'teo') => cardLines(track, r, pass, flags, owed, sang, nearest);
  it('the gap, the manners and the slings are each their own sentence', () => {
    const c = card(S, run({ clean: true, slings: 2 }), true, {}, 12, 1);
    expect(c).toContain('Brasca came in 0.6 s behind you.');
    expect(c).toContain('A clean run.');
    expect(c).toContain("You slung out of a car's air twice.");
    expect(c).toContain('One of four bends sang.');
    expect(c.join(' ')).not.toMatch(/Out of his air|, and she sang/);
  });
  it('every variant reads: spins and rubs, the hay, ahead, a miss, the Coppa', () => {
    expect(card(S, run({ spins: 1, rubs: 2 }), true)).toContain('One spin, two rubs.');
    expect(card(S, run({ offroads: 1 }), true)).toContain('Into the hay once.');
    expect(card(S, { ...run(), gap: -1.2 }, true, {}, 0, 0, 'cassian')).toContain('Roche was home 1.2 s before you.');
    const miss = card(S, { ...run(), place: 4 }, false, { [flagOf('salt', 'time')]: 60.3 });
    expect(miss).toContain('Ottavia: "Fourth. Not on the sheet. Again."');
    expect(miss).toContain(`Your best here: ${clock(60.3)}.`);
    expect(miss).toContain('The sheet takes the first three.');
    const coppa = card(C, { ...run(), place: 2 }, false, { [flagOf('coppa', 'time')]: 90 });
    expect(coppa).toContain('Ottavia: "Second. The Coppa pays first, and nothing else. Again."');
    expect(coppa).toContain('Only first will do.');
    expect(card(S, run(), true, { sable_orders: true }).join(' ')).not.toMatch(/You held/);
    for (const lines of [card(S, run(), true), miss, coppa]) for (const l of lines) expect(l.length).toBeLessThan(90);
  });
});

