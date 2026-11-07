// The race's hand-off, its pedals and its engine note.
import { describe, it, expect, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Math: { RandomDataGenerator: class {} }, Display: { Color: {} }, GameObjects: { BitmapText: class {} } } }));
import { applyResult, restarted, prizeOwed, softAid, flagOf, clock, costliest, spoken, shownTime, SOFT_AID_AFTER } from '../src/dreams/racer/race/result.js';
import { sanitizeFlags } from '../src/play/RunState.js';
import { TRACKS } from '../src/dreams/racer/race/tracks.js';
import { RACE_KEYS, RACE_PAD, stick, wheel, driveInput } from '../src/dreams/racer/race/controls.js';
import { sheetPace } from '../src/dreams/racer/race/pace.js';
import { InputMap } from '../src/input/InputMap.js';
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

describe('the pedals and the slab (phone layout)', () => {
  const L = layoutRace({ cssW: 844, cssH: 390 });
  const by = (id) => L.buttons.find((b) => b.id === id);
  it('presses the same keys as the keyboard', () => {
    expect(keysAt(L, by('up').x, by('up').y)).toEqual(['ArrowUp']);
    expect(keysAt(L, by('down').x, by('down').y)).toEqual(['ArrowDown']);
    expect(keysAt(L, by('left').x, by('left').y)).toEqual(['ArrowLeft']);
    expect(keysAt(L, by('right').x, by('right').y)).toEqual(['ArrowRight']);
  });
  it('a thumb slides across the slab: a dead strip between the sides, and the plate edge does not let go', () => {
    expect(keysAt(L, L.slab.mid, by('left').y)).toEqual([]);
    expect(keysAt(L, L.slab.mid - L.slab.dead, by('left').y)).toEqual(['ArrowLeft']);
    expect(keysAt(L, L.slab.mid + L.slab.dead, by('left').y)).toEqual(['ArrowRight']);
    expect(keysAt(L, by('right').x, L.slab.top - 10)).toEqual(['ArrowRight']);
    expect(keysAt(L, 2, 538)).toEqual(['ArrowLeft']);
  });
  it('steps aside under a menu, and pause stays', () => {
    expect(keysAt(L, by('left').x, by('left').y, { play: false })).toEqual([]);
    expect(keysAt(L, by('pause').x, by('pause').y, { play: false })).toEqual(['Escape']);
  });
  it('has no d-pad and stays on screen, clear of itself and of the speedometer', () => {
    expect(L.pad).toBeNull();
    for (const b of L.buttons) {
      const w = b.w ? b.w / 2 : b.r;
      const h = b.h ? b.h / 2 : b.r;
      expect(b.x - w).toBeGreaterThanOrEqual(0);
      expect(b.x + w).toBeLessThanOrEqual(960);
      expect(b.y - h).toBeGreaterThanOrEqual(0);
      expect(b.y + h).toBeLessThanOrEqual(540);
    }
    expect(L.slab.x1).toBeLessThan(346);
    expect(by('down').x - by('down').w / 2).toBeGreaterThan(614);
  });
});

describe('the wheel and the pedals', () => {
  const pad = (axes = [0, 0], pressed = []) => ({ axes, buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i), value: pressed.includes(i) ? 1 : 0 })) });
  const map = () => {
    const m = new InputMap();
    for (const [a, c] of Object.entries(RACE_KEYS)) m.bind(a, 'keyboard', c);
    for (const [a, c] of Object.entries(RACE_PAD)) m.bind(a, 'gamepad', c);
    return m;
  };
  it('a pad: triggers and face buttons are the pedals, the d-pad the wheel', () => {
    const m = map();
    for (const [btn, action] of [[7, 'up'], [0, 'up'], [6, 'down'], [1, 'down'], [14, 'left'], [15, 'right']]) {
      m.update({ keys: new Set(), pad: pad([0, 0], [btn]) });
      expect(m.isDown(action)).toBe(true);
    }
  });
  it('the stick is proportional past a dead zone of 0.18, and beats the keys', () => {
    expect(stick(0.1)).toBe(0);
    expect(stick(0.18)).toBe(0);
    expect(stick(1)).toBeCloseTo(1);
    expect(stick(-0.59)).toBeCloseTo(-0.5);
    const m = map();
    m.update({ keys: new Set(), pad: pad([0.59, 0]) });
    expect(driveInput(m, pad([0.59, 0]), 0, 16).steer).toBeCloseTo(0.5);
  });
  it('a key takes the wheel over in under 100 ms and lets it go sooner', () => {
    let w = 0;
    for (let i = 0; i < 6; i++) w = wheel(w, 1, 16.67);
    expect(w).toBe(1);
    for (let i = 0; i < 4; i++) w = wheel(w, 0, 16.67);
    expect(w).toBe(0);
  });
  it('Shift and W are gas too, and Ctrl is nothing (Ctrl+W shuts the tab)', () => {
    const m = map();
    for (const code of ['ArrowUp', 'KeyW', 'ShiftLeft']) {
      m.update({ keys: new Set([code]), pad: null });
      expect(m.isDown('up')).toBe(true);
    }
    m.update({ keys: new Set(['ControlLeft']), pad: null });
    expect(m.isDown('down')).toBe(false);
  });
});

describe('the sheet', () => {
  const pace = sheetPace(TRACKS.pinewood);
  it('Aldo is on the line exactly at his time, and never goes backwards', () => {
    const sheet = TRACKS.pinewood.gate.time;
    expect(Math.abs(pace.dAt(sheet) - TRACKS.pinewood.length)).toBeLessThan(5); // (sampled every quarter second)
    expect(pace.at(TRACKS.pinewood.length)).toBeCloseTo(sheet, 0);
    let last = -1;
    for (let t = 0; t <= sheet; t += 0.5) {
      expect(pace.dAt(t)).toBeGreaterThanOrEqual(last);
      last = pace.dAt(t);
    }
    expect(pace.at(90)).toBeLessThan(pace.at(350));
  });
  it('a race with no time on a sheet has no pace', () => {
    expect(sheetPace(TRACKS.test)).toBeNull();
  });
});

describe('what a time gate pays and says', () => {
  const T = TRACKS.pinewood;
  it('over the time pays nothing; under it pays the prize', () => {
    const [over, under] = [T.gate.time + 1, T.gate.time - 0.5];
    expect(prizeOwed(applyResult({}, T, { place: 1, time: over }), T.id)).toBe(0);
    expect(prizeOwed(applyResult({}, T, { place: 1, time: under }), T.id)).toBe(T.prize[1]);
    expect(prizeOwed(applyResult(applyResult({}, T, { place: 1, time: over }), T, { place: 1, time: under }), T.id)).toBe(T.prize[1]);
  });
  it('the timekeeper says it; a miss never reads as the time on the sheet', () => {
    expect(spoken(33.8)).toBe('Thirty-three eight');
    expect(spoken(35.1)).toBe('Thirty-five one');
    expect(spoken(30.04)).toBe('Thirty point nought');
    expect(spoken(40.7)).toBe('Forty point seven');
    expect(spoken(60.2)).toBe('Sixty point two');
    expect(shownTime(T.gate.time + 0.04, T.gate, false)).toBeCloseTo(T.gate.time + 0.1);
    expect(shownTime(T.gate.time - 0.1, T.gate, true)).toBe(T.gate.time - 0.1);
    expect(shownTime(T.gate.time + 1, T.gate, false)).toBe(T.gate.time + 1);
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

describe('the racer counts, now it has an ending', () => {
  it('runs, and is on the web', () => {
    expect(runningDreams().map((d) => d.id)).toContain('racer');
    expect(caughtRunning({ dreams: { racer: true } })).toBe(1);
    expect(WEB_ORDER).toContain('racer');
  });
  it('the headline counts ten platforms', () => {
    expect(headline(0)).toMatch(/^TEN PLATFORMS/);
  });
});
