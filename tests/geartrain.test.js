import { describe, it, expect, vi } from 'vitest';

// the dream imports painters that import phaser (browser-only)
vi.mock('phaser', () => ({ default: { Math: { RandomDataGenerator: class {} }, Display: { Color: {} } } }));

import { newTrain, take, hang, lift, lay, goHome, trainState, teeth } from '../src/engines/geartrain.js';
import { BENCH_TRAIN } from '../src/dreams/clockmaker/rooms/clockhouse.js';
import { SHAFT_TRAIN } from '../src/dreams/clockmaker/rooms/shaft.js';
import belfry, { BELFRY_TRAIN } from '../src/dreams/clockmaker/rooms/belfry.js';
import clockhouse from '../src/dreams/clockmaker/rooms/clockhouse.js';
import shaft from '../src/dreams/clockmaker/rooms/shaft.js';
import { floorUnder, hillFloor, keeperAtStrike } from '../src/dreams/clockmaker/logic.js';
import { CAST } from '../src/data/evening/cast.js';
const { default: dream } = await import('../src/dreams/clockmaker/dream.js');

const place = (def, plan) => {
  const st = newTrain(def);
  for (const [arbor, wheel] of Object.entries(plan)) {
    take(def, st, wheel);
    expect(hang(def, st, arbor)).toBe('hung');
  }
  return st;
};

// every way of hanging some wheels on some pegs that runs (a hang refused as fouling never gets here)
function solutions(def) {
  const out = [];
  const walk = (i, st) => {
    if (trainState(def, st).running) out.push({ ...st.hung });
    if (i === def.arbors.length) return;
    walk(i + 1, st);
    for (const w of Object.keys(st.lying)) {
      const next = JSON.parse(JSON.stringify(st));
      take(def, next, w);
      if (hang(def, next, def.arbors[i].id) === 'hung') walk(i + 1, next);
    }
  };
  walk(0, newTrain(def));
  return out;
}

describe('a wheel in the hand', () => {
  it('takes one at a time, hangs on an empty peg, lifts off again', () => {
    const st = newTrain(BENCH_TRAIN);
    expect(take(BENCH_TRAIN, st, 'bench1')).toBe(true);
    expect(take(BENCH_TRAIN, st, 'bench2')).toBe(false);
    expect(hang(BENCH_TRAIN, st, 'a')).toBe('hung');
    expect(st.carried).toBe(null);
    take(BENCH_TRAIN, st, 'bench2');
    expect(hang(BENCH_TRAIN, st, 'a')).toBe(null); // occupied
    goHome(BENCH_TRAIN, st);
    expect(st.lying.bench2).toEqual({ x: 512, y: 320 });
    expect(lift(BENCH_TRAIN, st, 'a')).toBe(true);
    expect(lay(st, 100, 200)).toBe('bench1');
    expect(st.lying.bench1).toEqual({ x: 100, y: 200 });
  });
  it('a wheel that would sit inside its neighbour fouls and stays on his back', () => {
    const st = newTrain(SHAFT_TRAIN);
    take(SHAFT_TRAIN, st, 'shaft_big');
    expect(hang(SHAFT_TRAIN, st, 'p2')).toBe('fouls'); // big next to the ratchet
    expect(st.carried).toBe('shaft_big');
  });
  it('survives JSON (a run keeps it as a string)', () => {
    const st = place(BENCH_TRAIN, { b: 'bench1' });
    expect(JSON.parse(JSON.stringify(st))).toEqual(st);
  });
});

describe('the wall', () => {
  it('neighbours turn opposite ways, smaller wheels faster', () => {
    const t = trainState(SHAFT_TRAIN, place(SHAFT_TRAIN, { p1: 'shaft_big' }));
    expect(t.turning.shaft_big.ratio).toBeCloseTo(-24 / 32);
    expect(t.reached).toBe(false);
    expect(t.held).toBe(false);
  });
  it('the teeth interleave: a big and a small keep one module', () => {
    expect(teeth(32) / 32).toBeCloseTo(teeth(24) / 24);
  });
  it('one wheel on the bench reaches the ratchet, and the pawl holds it', () => {
    const t = trainState(BENCH_TRAIN, place(BENCH_TRAIN, { a: 'bench1' }));
    expect(t.reached).toBe(true);
    expect(t.wrongWay).toBe(true);
    expect(t.running).toBe(false);
  });
  it('three that all touch lock, whichever way the ratchet goes', () => {
    const t = trainState(BENCH_TRAIN, place(BENCH_TRAIN, { a: 'bench1', b: 'bench2' }));
    expect(t.bound).toBe(true);
    expect(t.held).toBe(true);
  });
  it('a wheel that does not touch does nothing', () => {
    const st = place(SHAFT_TRAIN, { p1: 'shaft_small' });
    expect(trainState(SHAFT_TRAIN, st).turning.shaft_small).toBeUndefined();
  });
});

describe("the dream's three trains", () => {
  it('the bench has one answer: the two lower pegs', () => {
    expect(solutions(BENCH_TRAIN).map((s) => Object.keys(s).sort().join())).toEqual(expect.arrayContaining(['b,c']));
    for (const s of solutions(BENCH_TRAIN)) expect(Object.keys(s).sort()).toEqual(['b', 'c']);
  });
  it('the shaft has one answer: big to the drive, small to the ratchet', () => {
    const all = solutions(SHAFT_TRAIN);
    expect(all).toEqual([{ p1: 'shaft_big', p2: 'shaft_small' }]);
  });
  it('the bell chamber needs all four, and the top row of three is wrong', () => {
    const all = solutions(BELFRY_TRAIN);
    expect(all.length).toBeGreaterThan(0);
    for (const s of all) expect(Object.keys(s)).toHaveLength(4);
    const top = trainState(BELFRY_TRAIN, place(BELFRY_TRAIN, { s0: 'bell1', s1: 'bell2', s2: 'bell3' }));
    expect(top.wrongWay).toBe(true);
    const low = trainState(BELFRY_TRAIN, place(BELFRY_TRAIN, { s3: 'bell1', s4: 'bell2', s5: 'bell3', s6: 'bell4' }));
    expect(low.running).toBe(true);
  });
  it('pegs a press must tell apart are a tile apart, or on another floor', () => {
    for (const def of [BENCH_TRAIN, SHAFT_TRAIN, BELFRY_TRAIN]) {
      const xs = def.arbors.map((a) => a.x).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(32);
    }
  });
  it('every wheel lies on a floor, inside its room', () => {
    for (const [room, def] of [[clockhouse, BENCH_TRAIN], [shaft, SHAFT_TRAIN], [belfry, BELFRY_TRAIN]]) {
      for (const w of def.wheels) {
        const r = w.size === 'big' ? 32 : 24;
        expect(floorUnder(room.grid, w.x, w.y)).toBe(w.y + r);
      }
    }
  });
});

describe('where things come to rest', () => {
  const rows = ['....', '.=..', '.H..', '####'];
  it('a dropped wheel falls past a ladder to the first floor', () => {
    expect(floorUnder(rows, 40, 0)).toBe(32);
    expect(floorUnder(rows, 40, 66)).toBe(96);
    expect(floorUnder(rows, 8, 0)).toBe(96);
    expect(floorUnder(['..', '..'], 8, 0)).toBe(null);
  });
  it("the yard's hill rises under the keeper, a row a slope", () => {
    expect(hillFloor(4 * 32)).toBe(16 * 32);
    expect(hillFloor(9.5 * 32)).toBe(15.5 * 32);
    expect(hillFloor(11 * 32)).toBe(15 * 32);
    expect(hillFloor(25 * 32)).toBe(12 * 32);
  });
  it('seven strokes take him from the rope to the gate', () => {
    expect(keeperAtStrike(0)).toBe(25);
    expect(keeperAtStrike(7)).toBe(3);
    expect(keeperAtStrike(9)).toBe(3);
  });
});

describe('the dreamer', () => {
  it('the ending has a line for each choice, and Nell keeps the last one', () => {
    const a = dream.ending.lines({ keeper_goes: true });
    const b = dream.ending.lines({ keeper_stays: true });
    expect(a[1]).not.toBe(b[1]);
    expect(a[3]).toBe('Nell knew. Nell lit the last lamp.');
  });
  it('the choice sets one flag either way, and both reach the third gear', () => {
    const n = dream.conversations.keeper_why.nodes;
    const [go, stay] = n.j3.choices;
    expect(go.set).toEqual({ keeper_goes: true });
    expect(stay.set).toEqual({ keeper_stays: true });
    expect(n.g2.next).toBe('give');
    expect(n.s1.next).toBe('give');
    expect(n.give.set.gear3_given).toBe(true);
  });
  it('no beat opens a conversation with the input locked (the box would never close)', () => {
    const walk = (steps, locked) => {
      for (const st of steps) {
        if ('lock' in st) locked = st.lock;
        if (st.talk) expect(locked).toBe(false);
        if (st.if) {
          walk(st.then || [], locked);
          walk(st.else || [], locked);
        }
      }
    };
    for (const steps of Object.values(dream.beats)) walk(steps, false);
  });
  it('the Evening has him only if Jo saw him home, not for boarding the train', () => {
    expect(CAST.ansel.knows).toBe('ansel');
    expect(dream.persist.home).toBe('met.ansel');
  });
});
