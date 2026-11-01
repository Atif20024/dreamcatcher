import { describe, it, expect } from 'vitest';
import { escapement } from '../src/engines/escapement.js';
import { bobAt, bobHits, strainAt, lampFlags } from '../src/dreams/clockmaker/logic.js';

const toWindow = (e) => {
  for (let i = 0; i < 2000 && !e.state().inWindow; i++) e.update(10);
};

describe('the escapement', () => {
  it('one press a crossing: a second press on the same swing is a miss', () => {
    const e = escapement({ beats: 2, period: 1000, window: 0.2 });
    toWindow(e);
    expect(e.press()).toBe('hit');
    expect(e.state().inWindow).toBe(false);
    expect(e.press()).toBe('miss');
    expect(e.state().count).toBe(1);
  });
  it('seating a gear: a press off the middle slips one back, never below nothing, never a fail', () => {
    const e = escapement({ beats: 2, period: 1000, window: 0.1, slip: true });
    e.update(250);
    expect(e.press()).toBe('miss');
    expect(e.state().count).toBe(0);
    toWindow(e);
    e.press();
    e.update(200);
    expect(e.press()).toBe('miss');
    expect(e.state().count).toBe(0);
    expect(e.state().slips).toBe(1);
    toWindow(e);
    e.press();
    e.update(50);
    toWindow(e);
    e.press();
    expect(e.done).toBe(true);
    expect(e.result.ok).toBe(true);
    expect(e.result.clean).toBe(false);
  });
  it('striking seven: stand and watch, and the clock strikes by itself', () => {
    const e = escapement({ beats: 7, period: 1000, window: 0.1, patient: 2000 });
    for (let i = 0; i < 2000 && !e.done; i++) e.update(10);
    expect(e.done).toBe(true);
    expect(e.result.presses).toBe(0);
    expect(e.result.auto).toBe(7);
    expect(e.result.clean).toBe(false);
  });
  it('striking seven by hand is clean, and a late press costs nothing', () => {
    const e = escapement({ beats: 7, period: 1000, window: 0.1, patient: 4000 });
    e.update(250);
    expect(e.press()).toBe('miss');
    expect(e.state().count).toBe(0);
    for (let k = 0; k < 7; k++) {
      toWindow(e);
      e.press();
      e.update(60);
    }
    expect(e.done).toBe(true);
    expect(e.result.auto).toBe(0);
  });
});

describe('the third gear is gentle', () => {
  it('each miss widens the window, up to three', () => {
    const e = escapement({ beats: 4, period: 1000, window: 0.1, slip: true, assist: 0.25 });
    expect(e.state().window).toBeCloseTo(0.1);
    e.update(250);
    e.press();
    expect(e.state().window).toBeCloseTo(0.125);
    for (let k = 0; k < 5; k++) e.press();
    expect(e.state().window).toBeCloseTo(0.175);
  });
  it('the wider window really takes a press the narrow one would not', () => {
    const narrow = escapement({ beats: 4, period: 1000, window: 0.1, slip: true, assist: 0.25 });
    narrow.update(60); // 0.06 of a period off the middle: outside 0.05, inside 0.0625
    expect(narrow.press()).toBe('miss');
    narrow.update(1000);
    expect(narrow.press()).toBe('hit');
  });
  it('no assist by default: the strike stays as it was', () => {
    const e = escapement({ beats: 7, period: 1000, window: 0.1, patient: 4000 });
    e.update(250);
    e.press();
    expect(e.state().window).toBeCloseTo(0.1);
  });
});

describe('the pendulum', () => {
  const def = { x: 10, row: 4, len: 4, amp: 0.8, period: 2000 };
  it('swings through the middle, low, and out to its ends, high', () => {
    const mid = bobAt(def, 0);
    const end = bobAt(def, 500);
    expect(mid.x).toBeCloseTo(10.5 * 32);
    expect(mid.y).toBeCloseTo(8 * 32);
    expect(end.x).toBeGreaterThan(mid.x + 80);
    expect(end.y).toBeLessThan(mid.y - 30);
  });
  it('caught by the wound clock it barely moves', () => {
    expect(Math.abs(bobAt(def, 500, true).x - bobAt(def, 0, true).x)).toBeLessThan(30);
  });
  it('hits a body it touches and not one it misses', () => {
    const bob = { x: 100, y: 100 };
    expect(bobHits(bob, { left: 110, right: 134, top: 90, bottom: 134 })).toBe(true);
    expect(bobHits(bob, { left: 130, right: 154, top: 90, bottom: 134 })).toBe(false);
  });
  it('a held train winds up slowly and snaps back, from rest, a little', () => {
    expect(strainAt(0)).toBe(0);
    expect(strainAt(800)).toBeGreaterThan(strainAt(200));
    expect(strainAt(1099)).toBeLessThan(strainAt(900) / 2);
    for (let t = 0; t < 2200; t += 50) expect(strainAt(t)).toBeLessThanOrEqual(0.24);
  });
});

describe('the lamps', () => {
  it('light in order, a strike each, and stay lit', () => {
    const F = {};
    lampFlags(F, 3);
    expect(Object.keys(F).sort()).toEqual(['lamp_1', 'lamp_2', 'lamp_3']);
    lampFlags(F, 7);
    expect(F.lamp_7).toBe(true);
  });
});
