// The race's hand-off, its pedals and its engine note.
import { describe, it, expect, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Math: { RandomDataGenerator: class {} }, Display: { Color: {} }, GameObjects: { BitmapText: class {} } } }));
import { applyResult, restarted, prizeOwed, softAid, flagOf, clock, SOFT_AID_AFTER } from '../src/dreams/racer/race/result.js';
import { sanitizeFlags } from '../src/play/RunState.js';
import { TRACKS } from '../src/dreams/racer/race/tracks.js';
import { layoutRace, controlsAt, keysAt } from '../src/input/touchLayout.js';
import { engineNote, pickAudible, distanceGain, MAX_ENGINES } from '../src/audio/engineSynth.js';
import { carFrames, CAR_SIZE, LIVERIES } from '../src/art/carKit.js';
import { px } from '../src/data/scale.js';
import { BAYS, bayIndex } from '../src/data/hub/rooms.js';
import hubRooms from '../src/data/hub/rooms.js';
import { DREAMS, LAST_STOP } from '../src/data/dreams.js';
import { runningDreams, caughtRunning, headline } from '../src/systems/hubState.js';
import { WEB_ORDER } from '../src/art/identityArt.js';
import { buildHubMap } from '../src/data/hub/map.js';

const T = TRACKS.test;
const f = (w) => flagOf('test', w);

describe('the result in the run', () => {
  it('a win records, passes and owes the prize', () => {
    const fl = applyResult({}, T, { place: 1, time: 43.214 });
    expect(fl[f('best')]).toBe(1);
    expect(fl[f('time')]).toBe(43.21);
    expect(fl[f('passed')]).toBe(true);
    expect(prizeOwed(fl, 'test')).toBe(12);
  });
  it('survives the save: only primitives', () => {
    const fl = applyResult({}, T, { place: 1, time: 43.2 });
    expect(sanitizeFlags(fl)).toEqual(fl);
  });
  it('is paid once, and only the difference if a later run does better', () => {
    let fl = applyResult({}, { ...T, passPlace: 2 }, { place: 2, time: 50 });
    expect(prizeOwed(fl, 'test')).toBe(6);
    fl = { ...fl, [f('paid')]: 6 };
    expect(prizeOwed(fl, 'test')).toBe(0);
    expect(prizeOwed(applyResult(fl, { ...T, passPlace: 2 }, { place: 2, time: 60 }), 'test')).toBe(0); // the same again pays nothing
    expect(prizeOwed(applyResult(fl, { ...T, passPlace: 2 }, { place: 1, time: 40 }), 'test')).toBe(6);
  });
  it('a worse run takes nothing away', () => {
    let fl = applyResult({}, T, { place: 1, time: 43 });
    fl = applyResult(fl, T, { place: 2, time: 60 });
    expect(fl[f('best')]).toBe(1);
    expect(fl[f('time')]).toBe(43);
    expect(fl[f('passed')]).toBe(true);
  });
  it('short of the gate is a try, no pay; three tries bring the whisper', () => {
    let fl = {};
    for (let i = 0; i < SOFT_AID_AFTER - 1; i++) fl = applyResult(fl, T, { place: 2, time: 50 });
    expect(prizeOwed(fl, 'test')).toBe(0);
    expect(fl[f('passed')]).toBeUndefined();
    expect(softAid(fl, 'test')).toBe(false);
    fl = restarted(fl, T);
    expect(softAid(fl, 'test')).toBe(true);
  });
  it('reads the clock', () => {
    expect(clock(43.21)).toBe('0:43.2');
    expect(clock(61.04)).toBe('1:01.0');
  });
});

describe('the pedals (phone layout)', () => {
  const L = layoutRace({ cssW: 844, cssH: 390 });
  const by = (id) => L.buttons.find((b) => b.id === id);
  it('presses the same keys as the keyboard', () => {
    expect(keysAt(L, by('right').x, by('right').y)).toEqual(['ArrowRight']);
    expect(keysAt(L, by('left').x, by('left').y)).toEqual(['ArrowLeft']);
    expect(keysAt(L, by('up').x, by('up').y)).toEqual(['ArrowUp']);
    expect(keysAt(L, by('down').x, by('down').y)).toEqual(['ArrowDown']);
    expect(keysAt(L, by('jump').x, by('jump').y)).toEqual(['Space']);
  });
  it('has no d-pad and stays on screen, clear of itself', () => {
    expect(L.pad).toBeNull();
    for (const b of L.buttons) {
      const w = b.w ? b.w / 2 : b.r;
      const h = b.h ? b.h / 2 : b.r;
      expect(b.x - w).toBeGreaterThanOrEqual(0);
      expect(b.x + w).toBeLessThanOrEqual(960);
      expect(b.y - h).toBeGreaterThanOrEqual(0);
      expect(b.y + h).toBeLessThanOrEqual(540);
    }
    expect(by('left').x + by('left').w / 2).toBeLessThanOrEqual(by('right').x - by('right').w / 2);
  });
  it('rolls from gas to brake without a dead gap', () => {
    const y = by('left').y;
    for (let x = by('left').x; x <= by('right').x; x += 4) expect(controlsAt(L, x, y).length).toBe(1);
  });
  it('only pause under a menu', () => {
    expect(controlsAt(L, by('right').x, by('right').y, { play: false })).toEqual([]);
    expect(controlsAt(L, by('pause').x, by('pause').y, { play: false })).toEqual(['pause']);
  });
  it('the left cluster leaves the car (its rear at x 156) alone at top speed', () => {
    expect(L.clusters.left.w).toBeLessThan(250);
  });
});

describe('the engine note', () => {
  it('climbs with speed, opens on the throttle', () => {
    expect(engineNote({ v: 30, throttle: true }).freq).toBeGreaterThan(engineNote({ v: 10, throttle: true }).freq);
    expect(engineNote({ v: 20, throttle: true }).filter).toBeGreaterThan(engineNote({ v: 20, throttle: false }).filter);
  });
  it('swoops as a car passes', () => {
    expect(engineNote({ v: 30, closing: 10 }).freq).toBeGreaterThan(engineNote({ v: 30, closing: -10 }).freq);
  });
  it('hears three cars at most: Jo and the two nearest', () => {
    const cars = ['jo', 'a', 'b', 'c', 'd'].map((id, i) => ({ id, dx: i ? 100 - i * 10 : 0 }));
    expect(pickAudible(cars).map((c) => c.id)).toEqual(['jo', 'd', 'c']);
    expect(MAX_ENGINES).toBe(3);
    expect(distanceGain(0)).toBe(1);
    expect(distanceGain(80)).toBeLessThan(0.25);
  });
});

describe('the car kit', () => {
  const frames = carFrames();
  it('paints every car at 3.8 m', () => {
    expect(px(CAR_SIZE.lenM)).toBe(167);
    for (const id of Object.keys(LIVERIES)) expect(frames[`car-${id}`].width).toBeGreaterThanOrEqual(167);
  });
  it('fits the budget: a small pack', () => {
    const bytes = Object.values(frames).reduce((n, m) => n + m.width * m.height * 4, 0);
    expect(bytes).toBeLessThan(1024 * 1024);
  });
});

describe('platform 10', () => {
  it('has its own bay, clear of G and of every other', () => {
    expect(bayIndex(10)).not.toBe(bayIndex('G'));
    expect(BAYS[bayIndex(10)]).toBe(155);
    const seen = [...DREAMS, LAST_STOP].map((d) => BAYS[bayIndex(d.platform)]);
    expect(new Set(seen).size).toBe(seen.length);
    const sorted = [...BAYS].sort((a, b) => a - b);
    sorted.forEach((c, i) => i && expect(c - sorted[i - 1]).toBeGreaterThanOrEqual(7));
  });
  it('stands on the flat concourse, inside the shed room', () => {
    const rows = buildHubMap();
    for (let c = 155; c <= 161; c++) {
      expect(rows[25][c]).toBe('.');
      expect(rows[26][c]).toBe('#');
    }
    const shed = hubRooms.find((r) => r.id === 'platforms_b');
    expect(shed.grid[0].length).toBe(164 - 110);
    expect(hubRooms.find((r) => r.id === 'gate').grid[0].length).toBe(10);
  });
  it('the map is one width all the way', () => {
    const rows = buildHubMap();
    expect(new Set(rows.map((r) => r.length))).toEqual(new Set([174]));
  });
});

describe('an unfinished dream counts for nothing', () => {
  it('boards but is not running', () => {
    expect(DREAMS.find((d) => d.id === 'racer').scene).toBe('Dream');
    expect(runningDreams().map((d) => d.id)).not.toContain('racer');
    expect(caughtRunning({ dreams: { racer: true } })).toBe(0);
    expect(WEB_ORDER).not.toContain('racer');
  });
  it('leaves the headline alone', () => {
    expect(headline(0)).toMatch(/^NINE PLATFORMS/);
  });
});
