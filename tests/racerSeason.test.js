// THE LONG STRAIGHT: the four-race season, old saves, the ending, TUNE, what nuts buy, the tin, the papers.
import { describe, it, expect } from 'vitest';
import { HOOKS, nextHook, atTheDoor, notYet, doneOf, PRIZE_TRACKS, softPrice, PRICES, tinLeft, short, TIN, JARS, signPapers, PAPERS, SEASON_GOALS, slateRows, endingLines, medOk } from '../src/dreams/racer/season.js';
import { applyResult, flagOf, prizeOwed } from '../src/dreams/racer/race/result.js';
import quay from '../src/dreams/racer/rooms/quay.js';
import { coppaBot, runRace } from './raceBots.js';
import { SABLE_OIL } from '../src/dreams/racer/race/car.js';
import { tune, jetBeat, BEAT_MAX, TUNE_SLOT, SLOT_PER_MISS, SLOT_MAX, DETENT_RATE } from '../src/engines/tune.js';
import { RECIPES } from '../src/audio/eraLoops.js';
import { carTune, SOFT_TYRES } from '../src/dreams/racer/race/car.js';
import { TRACKS } from '../src/dreams/racer/race/tracks.js';
import { Race, TUNE, gripFactor, bendSafe, brakeDistance } from '../src/engines/race.js';
import { roomObjective } from '../src/play/Objectives.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const T = TRACKS.test;

describe('the season', () => {
  it('four real races, in order: no stand-ins', () => {
    expect(HOOKS.map((h) => h.track)).toEqual(['pinewood', 'harbour', 'salt', 'coppa']);
    for (const h of HOOKS) expect(TRACKS[h.track], h.track).toBeTruthy();
    expect(TRACKS.pinewood.gate.time).toBeDefined();
    expect(TRACKS.harbour.gate.scripted).toBe(true);
    expect(TRACKS.salt.gate.place).toBe(3);
    expect(TRACKS.coppa.gate.place).toBe(1);
    expect(atTheDoor({}).track).toBe('pinewood');
  });
  it('opens in order, and no hook skips what it needs; the door says why not', () => {
    expect(nextHook({}).id).toBe('race1');
    const F = { [doneOf('race1')]: true };
    expect(nextHook(F)).toBe(null); // Aldo first
    expect(atTheDoor(F)).toEqual({ track: null, pending: null });
    expect(notYet(F)).toMatch(/Aldo/);
    F.tyres_settled = true;
    expect(nextHook(F)).toBe(null); // the sea wall first
    expect(notYet(F)).toMatch(/sea wall/);
    F.tide_asked = true;
    expect(nextHook(F).id).toBe('race2');
    F[doneOf('race2')] = true;
    expect(notYet(F)).toMatch(/gloves/);
    F.gloves_left = true;
    expect(notYet(F)).toMatch(/tin/);
    F.jars_done = true;
    expect(nextHook(F)).toBe(null); // Sable's money pays for the Salt Road now
    expect(notYet(F)).toMatch(/Sable/);
    F.signed = true;
    expect(nextHook(F).id).toBe('race3');
    F[doneOf('race3')] = true;
    expect(notYet(F)).toMatch(/Ottavia/);
    F.garage_again = true;
    expect(notYet(F)).toMatch(/Bend/);
    F.chalked = true;
    expect(notYet(F)).toMatch(/pit lane/);
    F.pit_drilled = true;
    expect(nextHook(F).id).toBe('coppa');
    F[doneOf('coppa')] = true;
    expect(nextHook(F)).toBe(null);
    expect(notYet(F)).toMatch(/enough/);
  });
  it('the story goes on only when the gate is passed, on the road the door named', () => {
    const sheet = TRACKS.salt;
    const short = applyResult({ season_pending: 'race3' }, sheet, { place: 4, time: 70 });
    expect(short[doneOf('race3')]).toBeUndefined();
    expect(short.season_pending).toBe('race3'); // (Race again keeps counting)
    const made = applyResult(short, sheet, { place: 3, time: 69 });
    expect(made[doneOf('race3')]).toBe(true);
    expect(made.season_pending).toBeUndefined();
    const wrongRoad = applyResult({ season_pending: 'race3' }, T, { place: 1, time: 44 });
    expect(wrongRoad[doneOf('race3')]).toBeUndefined();
    const stale = applyResult({ season_pending: 'race5' }, sheet, { place: 1, time: 60 });
    expect(stale.done_race5).toBeUndefined();
  });
  it('the Coppa cannot end in a loss: second is "again", and a later worse run takes nothing away', () => {
    const C = TRACKS.coppa;
    let f = applyResult({ season_pending: 'coppa' }, C, { place: 2, time: 100 });
    expect(f[doneOf('coppa')]).toBeUndefined();
    expect(nextHook({ ...f, garage_again: true, chalked: true, pit_drilled: true, done_race1: true, done_race2: true, done_race3: true }).id).toBe('coppa');
    f = applyResult(f, C, { place: 1, time: 98 });
    expect(f[doneOf('coppa')]).toBe(true);
    f = applyResult(f, C, { place: 3, time: 120 });
    expect(f[doneOf('coppa')]).toBe(true);
    expect(f[flagOf('coppa', 'best')]).toBe(1);
  });
  it('every track that can owe a prize is walked, and a stand-in from an old run is too', () => {
    for (const id of ['pinewood', 'salt', 'test']) expect(PRIZE_TRACKS).toContain(id);
    expect(prizeOwed({ race_test_prize: 6 }, 'test')).toBe(6);
    expect(prizeOwed(applyResult({}, TRACKS.salt, { place: 3, time: 70 }), 'salt')).toBe(8);
  });
  it('the goal follows the story, room by room', () => {
    const room = { objective: SEASON_GOALS };
    const go = (F) => roomObjective(room, F);
    expect(go({})).toBe('tune');
    expect(go({ tuned: true })).toBe('drive_pinewood');
    expect(go({ tuned: true, done_race1: true })).toBe('aldo');
    expect(go({ tuned: true, done_race1: true, tyres_settled: true })).toBe('aldo_wall');
    expect(go({ tuned: true, done_race1: true, tyres_settled: true, tide_asked: true })).toBe('drive_harbour');
    expect(go({ tuned: true, done_race1: true, tyres_settled: true, done_race2: true })).toBe('take_gloves');
    const salt = { jars_done: true, signed: true };
    expect(go(salt)).toBe('drive_salt');
    expect(go({ ...salt, done_race3: true })).toBe('ottavia_again');
    expect(go({ jars_done: true, done_race3: true })).toBe('to_sable'); // an old run
    const walk = { ...salt, done_race3: true, garage_again: true };
    expect(go(walk)).toBe('to_gull');
    expect(go({ ...walk, chalked: true })).toBe('to_pit');
    expect(go({ ...walk, pit_drilled: true })).toBe('to_gull');
    const ready = { ...walk, chalked: true, pit_drilled: true };
    expect(go(ready)).toBe('coppa');
    expect(go({ ...ready, race_coppa_tries: 1 })).toBe('coppa_again');
    expect(go({ ...ready, done_coppa: true })).toBe('the_note');
  });
  it('every goal has words', () => {
    const src = readFileSync(resolve(import.meta.dirname, '../src/dreams/racer/dream.js'), 'utf8');
    for (const g of SEASON_GOALS) expect(src, g.text).toMatch(new RegExp(`\\b${g.text}: '`));
  });
  it('the slate says how far he has come', () => {
    expect(slateRows({})).not.toMatch(/P\d|0:|no finish/);
    const r = slateRows({ race_pinewood_passed: true, race_pinewood_time: 33.84, done_race2: true, race_salt_passed: true, race_salt_best: 3, garage_again: true });
    expect(r).toMatch(/0:33\.8/);
    expect(r).toMatch(/no finish/);
    expect(r).toMatch(/SALT ROAD\s+P3/);
    expect(r).toMatch(/nine days/);
  });
});

// A player mid-season under old flags must never get a lock. The walk reads the real
// doors and the real goals: from any old run, what the HUD asks for can be done, and the
// next thing leads on, until the Coppa is won.
describe('old saves: from any run, the season reaches the Coppa', () => {
  const door = (id) => quay.entities.find((e) => e.id === id).door.requires || [];
  const open = (F, id) => door(id).every((f) => F[f]);
  const STEPS = {
    race: { can: (F) => !!nextHook(F), run: (F) => (F[doneOf(nextHook(F).id)] = true) },
    aldo: { can: (F) => F.done_race1 && !F.tyres_settled, run: (F) => (F.tyres_settled = true) },
    wall: { can: (F) => F.tyres_settled && !F.done_race2 && !F.tide_asked, run: (F) => (F.tide_asked = true) },
    gloves: { can: (F) => F.done_race2 && !F['item:gloves'] && !F.gloves_left, run: (F) => (F['item:gloves'] = true) },
    ward: { can: (F) => open(F, 'quay>hospital') && F['item:gloves'] && !F.gloves_left, run: (F) => (F.gloves_left = true) },
    kitchen: { can: (F) => open(F, 'quay>kitchen') && !F.jars_done, run: (F) => (F.jars_done = true) },
    sable: { can: (F) => open(F, 'quay>sponsor') && !F.signed, run: (F) => (F.signed = true) },
    whose: { can: (F) => F.done_race3 && F.signed && !F.garage_again, run: (F) => (F.garage_again = true) },
    gull: { can: (F) => open(F, 'quay>gull') && !F.chalked, run: (F) => (F.chalked = true) },
    pit: { can: (F) => open(F, 'quay>pit') && !F.pit_drilled, run: (F) => (F.pit_drilled = true) },
  };
  const GOAL_STEP = { tune: 'race', drive_pinewood: 'race', aldo: 'aldo', aldo_wall: 'wall', drive_harbour: 'race', take_gloves: 'gloves', to_hospital: 'ward', to_kitchen: 'kitchen', to_sable: 'sable', drive_salt: 'race', ottavia_again: 'whose', to_gull: 'gull', to_pit: 'pit', coppa: 'race', coppa_again: 'race' };
  const base = { tuned: true, done_race1: true, tyres_settled: true };
  const told = { ...base, done_race2: true, cup_told: true };
  const home = { ...told, 'item:gloves': true, gloves_left: true, jars_done: true };
  const RUNS = {
    'a new run': {},
    'done_race1, Aldo not yet': { done_race1: true },
    'done_race1, Aldo done': base,
    'done_race2, gloves on the bench': told,
    'done_race2, gloves in hand': { ...told, 'item:gloves': true },
    'done_race2, the kitchen next': { ...told, 'item:gloves': true, gloves_left: true },
    'jars done': home,
    'done_race3, the old order: Sable not yet': { ...home, done_race3: true },
    'done_race3, signed': { ...home, done_race3: true, signed: true },
    'done_race4, the question not asked': { ...home, done_race3: true, signed: true, done_race4: true },
    'done_race4, the question asked': { ...home, done_race3: true, signed: true, done_race4: true, garage_again: true },
    'done_race5, nothing walked': { ...home, done_race3: true, signed: true, done_race4: true, garage_again: true, done_race5: true },
    'done_race5, chalked': { ...home, done_race3: true, signed: true, done_race4: true, garage_again: true, done_race5: true, chalked: true },
    'done_race5, the old end of the road': { ...home, done_race3: true, signed: true, done_race4: true, garage_again: true, done_race5: true, chalked: true, pit_drilled: true, race_test_prize: 12, race_test_paid: 12 },
    'a stale pending from an old door': { ...home, done_race3: true, signed: true, season_pending: 'race4', done_race4: true },
  };
  for (const [name, flags] of Object.entries(RUNS)) {
    it(name, () => {
      const F = { ...flags };
      const room = { objective: SEASON_GOALS };
      for (let n = 0; n < 30 && !F.done_coppa; n++) {
        const goal = roomObjective(room, F);
        const want = STEPS[GOAL_STEP[goal]];
        expect(want, `no step for goal ${goal}`).toBeTruthy();
        expect(!!want.can(F), `the goal is ${goal}, and it cannot be done: ${JSON.stringify(F)}`).toBe(true);
        want.run(F);
      }
      expect(F.done_coppa).toBe(true);
    });
  }
  it('done_race4 and done_race5 are not the Coppa', () => {
    expect(nextHook({ ...RUNS['done_race5, the old end of the road'] }).id).toBe('coppa');
    expect(doneOf(HOOKS.at(-1).id)).toBe('done_coppa');
  });
});

describe('the ending', () => {
  const won = { done_coppa: true, signed: true, sable_struck: true };
  it('the Cassian choice is in the lines, whichever it was, and it always lands on the win', () => {
    const stopped = endingLines({ ...won, helped_cassian: true }).join(' ');
    const passed = endingLines({ ...won, passed_cassian: true }).join(' ');
    expect(stopped).toMatch(/stopped for Roche/);
    expect(passed).toMatch(/went by Roche/);
    for (const t of [stopped, passed]) {
      expect(t).toMatch(/Pereval Corse, first/);
      expect(t).toMatch(/Dead on/);
      expect(t).not.toMatch(/Second\.|lost the|Nobody asked/);
    }
  });
  it('the life is in them: the rent, the paper', () => {
    expect(endingLines({ ...won, rent_short: true, rent_paid: true }).join(' ')).toMatch(/rent was late/);
    expect(endingLines({ ...won, rent_ok: true }).join(' ')).toMatch(/rent was paid/);
    expect(endingLines({ ...won, sable_whole: true }).join(' ')).toMatch(/every one/);
    expect(endingLines({ ...won, broke_orders: true }).join(' ')).toMatch(/kept his fifth/);
  });
  it('the chest is answered: the jar or the chemist, the wall or the window', () => {
    expect(medOk({})).toBe(true);
    expect(medOk({ med_short: true })).toBe(false);
    expect(medOk({ med_short: true, med_paid: true })).toBe(true);
    expect(endingLines({ ...won, med_short: true }).join(' ')).toMatch(/only her chest/);
    expect(endingLines({ ...won, med_short: true, med_paid: true }).join(' ')).toMatch(/with soup/);
  });
  it("what a kept letter did is in the lines", () => {
    expect(endingLines({ ...won, roche_kept: true, roche_fitted: true }).join(' ')).toMatch(/Roche's tyres/);
    expect(endingLines({ ...won, roche_burnt: true }).join(' ')).toMatch(/stove/);
  });
  it('a run with nothing on the road still reads as a win', () => {
    expect(endingLines({}).length).toBeGreaterThan(3);
  });
});

describe('TUNE', () => {
  it('the beat stops only in the slot, and rises away from it', () => {
    expect(jetBeat(0)).toBe(0);
    expect(jetBeat(0.05)).toBe(0);
    expect(jetBeat(0.1)).toBeGreaterThan(0);
    expect(jetBeat(0.8)).toBeGreaterThan(jetBeat(0.2));
    expect(jetBeat(1)).toBe(BEAT_MAX);
  });
  it('let go in the slot: done. Off it: a miss, and the next hold turns back', () => {
    const t = tune();
    t.press();
    while (t.state().jet < 0.3) t.update(16);
    expect(t.release()).toBe('miss');
    expect(t.done).toBe(false);
    t.press();
    while (t.state().hz > 0) t.update(16);
    expect(t.state().jet).toBeGreaterThan(0);
    expect(t.release()).toBe('hit');
    expect(t.done).toBe(true);
    expect(t.result).toMatchObject({ ok: true, misses: 1, floods: 0 });
  });
  it('held past the end it floods, waits, and starts again', () => {
    const t = tune({ start: -0.7 });
    t.press();
    for (let i = 0; i < 500 && !t.state().flooded; i++) t.update(16);
    expect(t.state()).toMatchObject({ flooded: true, floods: 1, holding: false, jet: -0.7 });
    expect(t.press()).toBe('wait');
    for (let i = 0; i < 120; i++) t.update(16);
    expect(t.state().flooded).toBe(false);
    expect(t.press()).toBe('turn');
  });
  it('has about four seconds of hold to the slot: time to hear it', () => {
    const t = tune();
    t.press();
    let ms = 0;
    while (t.state().hz > 0) {
      t.update(16);
      ms += 16;
    }
    expect(ms).toBeGreaterThan(1500);
    expect(ms).toBeLessThan(2600);
  });
  it('a poor hand cannot loop: each miss or flood widens the slot, up to its limit', () => {
    const t = tune();
    expect(t.state().slot).toBe(TUNE_SLOT);
    const missAt = (test) => {
      t.press();
      while (!test(t.state().jet)) t.update(16);
      t.release();
    };
    missAt((j) => j > -0.5);
    expect(t.state().slot).toBeCloseTo(TUNE_SLOT + SLOT_PER_MISS);
    missAt((j) => j > -0.4);
    missAt((j) => j > -0.3);
    expect(t.state().slot).toBe(SLOT_MAX);
    const f = tune();
    f.press();
    while (!f.state().flooded) f.update(16);
    expect(f.state().slot).toBeCloseTo(TUNE_SLOT + SLOT_PER_MISS);
  });
  it('the screw drags near the note, so the slot lasts over half a second, not a third', () => {
    const t = tune();
    t.press();
    while (t.state().hz > 0) t.update(4);
    let ms = 0;
    while (t.state().hz === 0) {
      t.update(4);
      ms += 4;
    }
    expect(ms).toBeGreaterThan(600);
    const free = tune({ start: 0.5 });
    free.press();
    free.update(100);
    expect(free.state().jet - 0.5).toBeCloseTo(0.036);
    const near = tune({ start: 0.1 });
    near.press();
    near.update(100);
    expect(near.state().jet - 0.1).toBeCloseTo(0.036 * DETENT_RATE);
  });
  it('a miss knows which side it fell: early keeps turning, past turns back', () => {
    const t = tune();
    t.press();
    while (t.state().jet < -0.4) t.update(16);
    t.release();
    expect(t.state().last).toBe('early');
    t.press();
    while (t.state().jet < 0.4) t.update(16);
    t.release();
    expect(t.state().last).toBe('past');
    t.press();
    while (t.state().jet > 0.3) t.update(16);
    t.release();
    expect(t.state().last).toBe('early'); // on its way back, still short of the note
  });
});

describe('the garage idle', () => {
  const hums = (k) => RECIPES[k].layers.filter(([n]) => n === 'hum').map(([, o]) => o.f);
  it('beats against itself until she is tuned, then holds one note', () => {
    const [a, b] = hums('pv_garage');
    expect(b - a).toBe(2);
    expect(hums('pv_garage_tuned')).toEqual([a]);
    // whole cycles in the loop, or the seam would click
    for (const f of [a, b]) expect(Number.isInteger(f * RECIPES.pv_garage.seconds)).toBe(true);
  });
});

describe('what nuts buy: tyres and chalk, never speed', () => {
  const FAST = ['vMax', 'accel', 'accelPow', 'brake', 'coast', 'coastAero', 'draftSpeed', 'slingSpeed', 'launchPull', 'lineSpeed'];
  it('the base car is the base car', () => {
    const t = carTune(T, {});
    for (const k of Object.keys(TUNE)) expect(t[k], k).toBe(TUNE[k]);
    expect(t.chalk).toBe(false);
  });
  it('a track can override, as rain will', () => {
    expect(carTune({ tune: { wearSlip: 1 } }, {}).wearSlip).toBe(1);
  });
  it('soft tyres and chalk touch no number of speed', () => {
    const t = carTune(T, { tyre_soft: true, buy_chalk: true });
    for (const k of FAST) expect(t[k], k).toBe(TUNE[k]);
    expect(t.gripMin).toBe(SOFT_TYRES.gripMin);
    expect(t.chalk).toBe(true);
    expect(Object.keys(SOFT_TYRES)).toEqual(['gripMin']);
  });
  // a tidy line on the road, on either set: new tyres are the same tyres
  const lap = (tune) => {
    const r = new Race({ ...T, obstacles: [] }, { tune });
    let n = 0;
    while (!r.result && n < 120 * 150) {
      const c = r.jo;
      const b = r.nextBend(c.d);
      const gf = gripFactor(c.grip, tune);
      const aim = b && bendSafe(b, c.x, gf) * 0.98;
      const brake = !!b && c.v > aim && (c.d >= b.from || brakeDistance(c.v, aim, gf) + 8 >= b.from - c.d);
      r.step({ throttle: !brake, brake, steer: Math.max(-1, Math.min(1, -c.x / 0.05)) });
      n += 1;
    }
    return r.result ? r.result.time : Infinity;
  };
  it('on new tyres the soft set gains next to nothing over a lap', () => {
    const base = lap(carTune(T, {}));
    const soft = lap(carTune(T, { tyre_soft: true }));
    expect(Number.isFinite(base)).toBe(true);
    expect(Math.abs(base - soft)).toBeLessThan(0.25);
  });
  it('the jar comes off the soft set, down to a floor', () => {
    expect(softPrice({})).toBe(PRICES.soft);
    expect(softPrice({ jar_tyres: 3 })).toBe(PRICES.soft - 6);
    expect(softPrice({ jar_tyres: 12 })).toBe(12);
  });
});

describe('the tin', () => {
  it('holds less than the jars want: something goes short', () => {
    expect(JARS.reduce((n, j) => n + j.wants, 0)).toBeGreaterThan(TIN);
    const F = { jar_rent: 6, jar_tyres: 2, jar_medicine: 4 };
    expect(tinLeft(F)).toBe(0);
    expect(short(F, 'rent')).toBe(false);
    expect(short(F, 'tyres')).toBe(true);
  });
});

describe("Mr Sable's papers", () => {
  it('whole pays most and binds all; striking the binding clauses pays least and binds none', () => {
    const whole = signPapers({ strike_team: 'none', strike_money: 'none', strike_garage: 'none' });
    expect(whole.binds).toEqual(expect.arrayContaining(['sable_cut', 'sable_lien', 'sable_orders', 'oil_sable']));
    const bad = (p) => (p.a.pays > p.b.pays ? 'a' : 'b');
    const careful = signPapers(Object.fromEntries(PAPERS.map((p) => [`strike_${p.id}`, bad(p)])));
    expect(careful.binds).not.toEqual(expect.arrayContaining(['sable_cut']));
    expect(careful.binds).not.toContain('sable_lien');
    expect(careful.binds).not.toContain('sable_orders');
    expect(whole.advance).toBeGreaterThan(careful.advance * 3);
  });
  it('the bad clause is not always first: you have to read them', () => {
    expect(new Set(PAPERS.map((p) => (p.a.pays > p.b.pays ? 'a' : 'b'))).size).toBe(2);
  });
  it("Sable's oil costs on the road, and the win survives it, stopping for Cassian", () => {
    const t = carTune(T, { tuned: true, oil_sable: true });
    expect(t).toMatchObject({ untuned: true, ...SABLE_OIL });
    expect(carTune(T, { tuned: true }).untuned).toBe(false);
    expect(carTune(T, { oil_sable: true }).hotAfter).toBe(TUNE.hotAfter); // (beating is worse, and stays so)
    const { r } = runRace(TRACKS.coppa, { tuned: true, oil_sable: true }, coppaBot({ cassian: 'stop' }));
    expect(r.result).toMatchObject({ place: 1, passed: true });
  });
});

describe('the words', () => {
  const src = readFileSync(resolve(import.meta.dirname, '../src/dreams/racer/dialogue.js'), 'utf8');
  it('the corridor shows no injury and names no blame', () => {
    const corridor = src.slice(src.indexOf('corridor: conv('), src.indexOf('corridor_after'));
    expect(corridor).not.toMatch(/bandage|blood|burn|broken|crash/i);
  });
  it('nobody but the Roche boy is said to block, and the cut names are gone', () => {
    expect(src).not.toMatch(/Lena|Bruno|Varga/);
    expect(src).toMatch(/Roche boy covers his mirror/);
  });
});
