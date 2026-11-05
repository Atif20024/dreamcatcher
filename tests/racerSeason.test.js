// THE LONG STRAIGHT, stage 2: the season's order, TUNE, what nuts buy, the tin, the papers.
import { describe, it, expect } from 'vitest';
import { HOOKS, nextHook, atTheDoor, doneOf, STAND_IN, softPrice, PRICES, tinLeft, short, TIN, JARS, signPapers, PAPERS, SEASON_GOALS } from '../src/dreams/racer/season.js';
import { applyResult, flagOf } from '../src/dreams/racer/race/result.js';
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
  it('every hook is a stand-in on the test road, plainly', () => {
    for (const h of HOOKS) expect(h.track).toBe(STAND_IN);
    expect(atTheDoor({}).track).toBe(STAND_IN);
  });
  it('opens in order, and no hook skips what it needs', () => {
    expect(nextHook({}).id).toBe('race1');
    const F = { [doneOf('race1')]: true };
    expect(nextHook(F)).toBe(null); // Aldo first
    F.tyres_settled = true;
    expect(nextHook(F).id).toBe('race2');
    F[doneOf('race2')] = true;
    F.gloves_left = true;
    expect(nextHook(F)).toBe(null); // the kitchen too
    F.jars_done = true;
    expect(nextHook(F).id).toBe('race3');
    F[doneOf('race3')] = true;
    expect(nextHook(F)).toBe(null);
    F.signed = true;
    expect(nextHook(F).id).toBe('race4');
    F[doneOf('race4')] = true;
    F.garage_again = true;
    expect(nextHook(F).id).toBe('race5');
    F[doneOf('race5')] = true;
    expect(nextHook(F)).toBe(null); // the Coppa is not written
    expect(atTheDoor(F).pending).toBe(null);
  });
  it('a finish counts for the hook the door named, first or second, once', () => {
    const f = applyResult({ season_pending: 'race2' }, T, { place: 2, time: 50 });
    expect(f[doneOf('race2')]).toBe(true);
    expect(f.season_pending).toBeUndefined();
    const g = applyResult({ [doneOf('race1')]: true }, T, { place: 1, time: 44 });
    expect(g[doneOf('race2')]).toBeUndefined();
  });
  it('second place still pays its 6 nuts', () => {
    const f = applyResult({}, T, { place: 2, time: 50 });
    expect(f[flagOf('test', 'prize')]).toBe(6);
  });
  it('the goal follows the story, room by room', () => {
    const room = { objective: SEASON_GOALS };
    expect(roomObjective(room, {})).toBe('tune');
    expect(roomObjective(room, { tuned: true })).toBe('drive');
    expect(roomObjective(room, { tuned: true, done_race1: true })).toBe('aldo');
    expect(roomObjective(room, { tuned: true, done_race1: true, tyres_settled: true, done_race2: true })).toBe('take_gloves');
    expect(roomObjective(room, { done_race5: true, pit_drilled: true })).toBe('written');
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
    expect(whole.binds.sort()).toEqual(['sable_cut', 'sable_lien', 'sable_orders']);
    const careful = signPapers(Object.fromEntries(PAPERS.map((p) => [`strike_${p.id}`, 'a'])));
    expect(careful.binds).toEqual([]);
    expect(whole.advance).toBeGreaterThan(careful.advance * 3);
  });
});

describe('the words', () => {
  const src = readFileSync(resolve(import.meta.dirname, '../src/dreams/racer/dialogue.js'), 'utf8');
  it('the corridor shows no injury and names no blame', () => {
    const corridor = src.slice(src.indexOf('corridor: conv('), src.indexOf('corridor_after'));
    expect(corridor).not.toMatch(/bandage|blood|burn|broken|crash/i);
  });
  it('nobody but the Roche boy is said to block, and no rival is named but him', () => {
    expect(src).not.toMatch(/Lena|Bruno|Varga|Dante/);
    expect(src).toMatch(/Roche boy covers his mirror/);
  });
});
