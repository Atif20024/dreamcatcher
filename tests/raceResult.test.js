// The race's hand-off, its pedals and its engine note.
import { describe, it, expect, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Math: { RandomDataGenerator: class {} }, Display: { Color: {} }, GameObjects: { BitmapText: class {} } } }));
import { applyResult, restarted, prizeOwed, softAid, flagOf, clock, costliest, SOFT_AID_AFTER } from '../src/dreams/racer/race/result.js';
import { sanitizeFlags } from '../src/play/RunState.js';
import { TRACKS, RACE_PAD } from '../src/dreams/racer/race/tracks.js';
import { InputMap } from '../src/input/InputMap.js';
import { sightOf } from '../src/dreams/racer/race/RaceHud.js';
import { layoutRace, controlsAt, keysAt } from '../src/input/touchLayout.js';
import { engineNote, pickAudible, distanceGain, tuneToBeat, MAX_ENGINES } from '../src/audio/engineSynth.js';
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
    let fl = applyResult({}, { ...T, gate: { place: 2 } }, { place: 2, time: 50 });
    expect(prizeOwed(fl, 'test')).toBe(6);
    fl = { ...fl, [f('paid')]: 6 };
    expect(prizeOwed(fl, 'test')).toBe(0);
    expect(prizeOwed(applyResult(fl, { ...T, gate: { place: 2 } }, { place: 2, time: 60 }), 'test')).toBe(0); // the same again pays nothing
    expect(prizeOwed(applyResult(fl, { ...T, gate: { place: 2 } }, { place: 1, time: 40 }), 'test')).toBe(6);
  });
  it('a worse run takes nothing away', () => {
    let fl = applyResult({}, T, { place: 1, time: 43 });
    fl = applyResult(fl, T, { place: 2, time: 60 });
    expect(fl[f('best')]).toBe(1);
    expect(fl[f('time')]).toBe(43);
    expect(fl[f('passed')]).toBe(true);
  });
  it('second place is short of the gate and still pays second place, once, and first pays the rest', () => {
    let fl = applyResult({}, T, { place: 2, time: 50 });
    expect(fl[f('passed')]).toBeUndefined();
    expect(prizeOwed(fl, 'test')).toBe(T.prize[2]);
    fl = { ...fl, [f('paid')]: T.prize[2] };
    fl = applyResult(fl, T, { place: 2, time: 49 });
    expect(prizeOwed(fl, 'test')).toBe(0);
    fl = applyResult(fl, T, { place: 1, time: 44 });
    expect(prizeOwed(fl, 'test')).toBe(T.prize[1] - T.prize[2]);
  });
  it('short of the gate is a try; three tries bring the whisper', () => {
    let fl = {};
    for (let i = 0; i < SOFT_AID_AFTER - 1; i++) fl = applyResult(fl, T, { place: 2, time: 50 });
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

describe('what cost the most, on the card', () => {
  it('names the biggest single thing', () => {
    expect(costliest({ launched: false })).toMatch(/green/);
    expect(costliest({ launched: false, offroads: 1 })).toMatch(/straw/);
    expect(costliest({ resets: 1, offroads: 2, rubs: 3 })).toMatch(/lamp/);
    expect(costliest({ slowest: { name: 'kink', under: 2.5 } })).toBe('Slowest into the kink: 9 km/h under. That cost you the most.');
  });
  it('a big undershoot outweighs a missed green, a small one does not', () => {
    expect(costliest({ launched: false, slowest: { name: 'kink', under: 7 } })).toMatch(/kink/);
    expect(costliest({ launched: false, slowest: { name: 'kink', under: 3 } })).toMatch(/green/);
  });
  it('says nothing about a clean run', () => {
    expect(costliest({ slowest: { name: 'kink', under: 1 } })).toBe('');
    expect(costliest({ slowest: null })).toBe('');
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

describe('the draft by ear', () => {
  const jo = engineNote({ v: 34, throttle: true, base: 52, detune: 6 });
  const rival = engineNote({ v: 33, throttle: true, base: 65, detune: 9, closing: 1 });
  it('in the slot the two notes are one, and nothing else in them beats', () => {
    const t = tuneToBeat(jo, rival, { hz: 0, hear: 1 });
    expect(t.rival.freq).toBeCloseTo(t.jo.freq, 6);
    expect(t.rival.sub).toBeCloseTo(t.jo.freq / 2, 6);
    expect(t.jo.detune).toBe(0);
    expect(t.rival.detune).toBe(0);
    expect(t.jo.flutter).toBe(0);
    expect(t.rival.flutter).toBe(0);
  });
  it('out of it they stand hz apart, in the sub as well', () => {
    const t = tuneToBeat(jo, rival, { hz: 4, hear: 1 });
    expect(t.rival.freq - t.jo.freq).toBeCloseTo(4, 6);
    expect(t.rival.sub - t.jo.freq / 2).toBeCloseTo(4, 6);
  });
  it('far off the rival keeps its own note, and a voice that was never pulled is unchanged', () => {
    const t = tuneToBeat(jo, rival, { hz: 9, hear: 0 });
    expect(t.rival.freq).toBeCloseTo(rival.freq, 6);
    expect(t.jo.freq).toBe(jo.freq);
    expect(t.jo.detune).toBe(jo.detune);
  });
});

describe('the sight strip', () => {
  it('reads time to contact: grows, then pulses under 1.5 s', () => {
    const far = sightOf({ dist: 150, v: 0 }, 30, 0);
    const near = sightOf({ dist: 50, v: 0 }, 36, 0.1);
    expect(far.ttc).toBe(5);
    expect(far.scale).toBe(1);
    expect(near.ttc).toBeLessThan(1.5);
    expect(near.scale).toBeGreaterThan(far.scale);
    const samples = [0, 0.05, 0.1, 0.15, 0.2].map((t) => sightOf({ dist: 40, v: 0 }, 36, t).alpha);
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.2);
  });
  it('a car pulling away is no contact at all', () => {
    expect(sightOf({ dist: 40, v: 36 }, 30, 0).ttc).toBe(Infinity);
  });
});

describe('a pad', () => {
  const pad = (axes = [0, 0], pressed = []) => ({ axes, buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i), value: pressed.includes(i) ? 1 : 0 })) });
  const map = () => {
    const m = new InputMap();
    for (const [a, c] of Object.entries(RACE_PAD)) m.bind(a, 'gamepad', c);
    return m;
  };
  const feed = (m, p) => m.update({ keys: new Set(), pad: p });
  it('the triggers are the pedals, the d-pad too, and the d-pad changes lanes', () => {
    const m = map();
    feed(m, pad([0, 0], [7]));
    expect(m.isDown('right')).toBe(true);
    feed(m, pad([0, 0], [6]));
    expect(m.isDown('left')).toBe(true);
    feed(m, pad([0, 0], [15]));
    expect(m.isDown('right')).toBe(true);
    feed(m, pad([0, 0], [12]));
    expect(m.justDown('up')).toBe(true);
    feed(m, pad([0, 0], [13]));
    expect(m.justDown('down')).toBe(true);
  });
  it('a thumb on the stick for the throttle cannot flick a lane by tilting', () => {
    const m = map();
    feed(m, pad([1, 0]));
    feed(m, pad([0.8, -0.6]));
    expect(m.isDown('right')).toBe(true);
    expect(m.isDown('up')).toBe(false);
    feed(m, pad([0.8, 0.6]));
    expect(m.isDown('down')).toBe(false);
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
