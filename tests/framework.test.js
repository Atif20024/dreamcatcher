import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { RoomGraph } from '../src/world/RoomGraph.js';
import { frameCrossing, sideOf, dipFor, DIPS, FRAME_HALF } from '../src/world/thresholds.js';
import { classifyTile, gridView, variantAt, classifyRoom, evaluateDecor, materialMap, headroomSpans } from '../src/world/terrainRules.js';
import { BeatRunner } from '../src/play/BeatRunner.js';
import { DialogueRunner, conversationIssues } from '../src/narrative/DialogueRunner.js';
import { InputMap } from '../src/input/InputMap.js';
import { clockwork } from '../src/engines/clockwork.js';
import { Encounters } from '../src/play/Encounters.js';
import { countObjects, estimateDrawCalls } from '../src/core/PerfBudget.js';

const T = 32;
const box = (w, h, floor = h - 2) => Array.from({ length: h }, (_, y) => (y >= floor ? '#'.repeat(w) : '.'.repeat(w)));

function twoRooms(opts = {}) {
  return new RoomGraph([
    // the seam's frame: an arch standing at b's first columns (centre x = 40 T + 64)
    { id: 'a', origin: { tx: 0, ty: 0 }, grid: box(40, 12), backdrop: { set: 'dusk' }, entities: [{ type: 'portal', id: 'a>b', kind: 'seam', x: 39, y: 9, to: { room: 'b', portal: 'b<a' }, seam: { prop: 'arch' } }, { type: 'portal', id: 'a>in', kind: 'door', x: 10, y: 9, to: { room: 'in', portal: 'in>a' } }] },
    { id: 'b', origin: { tx: 40, ty: 0 }, grid: box(40, 12), backdrop: { set: 'night' }, props: [{ prop: 'arch', x: 1.5 }], entities: [{ type: 'portal', id: 'b<a', kind: 'seam', x: 0, y: 9, to: { room: 'a', portal: 'a>b' }, seam: { prop: 'arch' } }] },
    { id: 'in', origin: { tx: 0, ty: 30 }, grid: box(20, 10), entities: [{ type: 'portal', id: 'in>a', kind: 'door', x: 3, y: 7, to: { room: 'a', portal: 'a>in' } }] },
  ], opts);
}

describe('RoomGraph', () => {
  it('places rooms and finds neighbours, zones and partners', () => {
    const g = twoRooms();
    expect(g.room('b').x0).toBe(40 * T);
    expect(g.neighbours('a').sort()).toEqual(['b', 'in']);
    expect([...g.zone('a')].sort()).toEqual(['a', 'b']);
    expect([...g.zone('in')]).toEqual(['in']);
    expect(g.partner('a>in').id).toBe('in>a');
    expect(g.validate()).toEqual([]);
    expect([...g.reachable('a')].sort()).toEqual(['a', 'b', 'in']);
  });
  it('never blends: a seam is crossed inside its drawn frame, with hysteresis', () => {
    const g = twoRooms();
    const fx = 40 * T + 64; // the arch's centre
    const [s] = g.seams();
    expect(s.x).toBe(fx);
    expect(s.edge).toBe(40 * T);
    expect(s.dip).toBe(DIPS.outout); // both rooms have a sky
    expect('t' in s).toBe(false);
    expect(g.blendAt).toBeUndefined();
    // walking right: nothing until Jo is a half-tile past the arch's centre
    expect(g.crossing(fx, 200, 'a')).toBeNull();
    expect(g.crossing(40 * T + 8, 200, 'a')).toBeNull(); // over the edge, not yet through the arch
    expect(g.crossing(fx + FRAME_HALF, 200, 'a')).toBeNull();
    const c = g.crossing(fx + FRAME_HALF + 1, 200, 'a');
    expect(c).toMatchObject({ from: 'a', to: 'b', dir: 1 });
    // standing in the arch never flips back and forth
    for (let x = fx - FRAME_HALF; x <= fx + FRAME_HALF; x += 4) {
      expect(g.crossing(x, 200, 'a')).toBeNull();
      expect(g.crossing(x, 200, 'b')).toBeNull();
    }
    expect(g.crossing(fx - FRAME_HALF - 1, 200, 'b')).toMatchObject({ from: 'b', to: 'a', dir: -1 });
    // a room behind a door is never part of it
    expect(g.crossing(fx + 100, 31 * T, 'in')).toBeNull();
  });
  it('lets the camera show a room only out to its frames', () => {
    const g = twoRooms({ frameWidth: () => 160 });
    const fx = 40 * T + 64;
    expect(g.viewX('a')).toEqual({ x0: 0, x1: fx + 80 });
    expect(g.viewX('b')).toEqual({ x0: fx - 80, x1: 80 * T });
    expect(g.viewX('in')).toEqual({ x0: 0, x1: 20 * T });
  });
  it('dips by kind: outside to inside, outdoor to outdoor, room to room', () => {
    expect(dipFor(true, false)).toEqual({ down: 120, hold: 60, up: 160 });
    expect(dipFor(false, true)).toBe(DIPS.inout);
    expect(dipFor(true, true)).toEqual({ down: 180, hold: 80, up: 220 });
    expect(dipFor(false, false)).toEqual({ down: 90, hold: 40, up: 110 });
    const frames = [
      { x: 100, left: 'out', right: 'hall', y0: 0 },
      { x: 500, left: 'hall', right: 'shed', open: true },
    ];
    expect(sideOf(frames, 50, 10)).toBe('out');
    expect(sideOf(frames, 300, 10)).toBe('hall');
    expect(sideOf(frames, 900, 10)).toBe('shed');
    expect(frameCrossing(frames, 120, 10, 'out')).toMatchObject({ to: 'hall' });
    expect(frameCrossing(frames, 120, -10, 'out')).toBeNull(); // above the band (the roof)
    expect(frameCrossing(frames, 520, 10, 'hall')).toMatchObject({ to: 'shed', open: true });
  });
  it('reports unpaired portals, missing seam props, gaps and overlaps', () => {
    const g = new RoomGraph([
      { id: 'a', grid: box(10, 8), entities: [{ type: 'portal', id: 'a>b', kind: 'seam', x: 9, y: 5, to: { room: 'b', portal: 'b<a' } }] },
      { id: 'd', origin: { tx: 40, ty: 0 }, grid: box(10, 8), entities: [{ type: 'portal', id: 'd>e', kind: 'seam', x: 9, y: 5, to: { room: 'e', portal: 'e<d' }, seam: { prop: 'gate' } }] },
      { id: 'e', origin: { tx: 50, ty: 0 }, grid: box(10, 8), entities: [{ type: 'portal', id: 'e<d', kind: 'seam', x: 0, y: 5, to: { room: 'd', portal: 'd>e' }, seam: { prop: 'gate' } }] },
      { id: 'b', origin: { tx: 12, ty: 0 }, grid: box(10, 8), entities: [{ type: 'portal', id: 'b<a', kind: 'seam', x: 0, y: 5, to: { room: 'a', portal: 'nope' } }] },
      { id: 'c', origin: { tx: 1, ty: 1 }, grid: box(3, 3) },
    ]);
    const issues = g.validate().join('\n');
    expect(issues).toMatch(/do not share an edge/);
    expect(issues).toMatch(/does not point back/);
    expect(issues).toMatch(/physical seam prop/);
    expect(issues).toMatch(/partner portal "nope"/);
    expect(issues).toMatch(/overlap in the world/);
    // a seam's frame has to be drawn, at the seam
    expect(issues).toMatch(/seam prop "gate" is not placed in d or e/);
    expect([...g.reachable('a')].sort()).toEqual(['a', 'b']);
  });
});

describe('terrain rules', () => {
  const grid = ['..........', '....###...', '..........', '##......##', '###....###', '##########'];
  const v = gridView(grid);
  it('classifies lip, underside, edges and depth', () => {
    const lip = classifyTile(v, 4, 1);
    expect(lip.top && lip.bottom && lip.left && lip.capL).toBe(true);
    expect(lip.capR).toBe(false);
    expect(classifyTile(v, 5, 1).capL).toBe(false);
    const deep = classifyTile(v, 0, 5);
    expect(deep.top).toBe(false);
    expect(deep.depth).toBe(2);
    expect(classifyTile(v, 2, 4).stepL).toBe(true);
    expect(classifyTile(v, 3, 0)).toBeNull();
  });
  it('variants are deterministic and never three alike in a row', () => {
    for (let y = 0; y < 20; y++) {
      for (let x = 2; x < 200; x++) {
        const a = variantAt(x - 2, y, 2, 9);
        const b = variantAt(x - 1, y, 2, 9);
        const c = variantAt(x, y, 2, 9);
        expect(a === b && b === c).toBe(false);
      }
    }
    expect(variantAt(5, 5, 4, 1)).toBe(variantAt(5, 5, 4, 1));
    expect(classifyRoom(grid).length).toBe(grid.join('').split('#').length - 1);
  });
  it('evaluates decor rules deterministically, with materials, chance and spacing', () => {
    const rules = [
      { id: 'grass', when: 'topExposed', place: 'tuft_*', variants: 3, chance: 1, materials: ['meadow'] },
      { id: 'roots', when: 'ceilingExposed', place: 'roots', chance: 1 },
      { id: 'pebbles', when: 'wallBase', place: 'pebble', chance: 1 },
      { id: 'sparse', when: 'topExposed', place: 'flower', chance: 1, every: 3 },
    ];
    const mat = materialMap({ material: 'meadow', regions: [{ rect: [0, 3, 2, 5], material: 'stone' }] });
    const a = evaluateDecor(rules, grid, { seed: 4, materialAt: mat });
    expect(evaluateDecor(rules, grid, { seed: 4, materialAt: mat })).toEqual(a);
    const grass = a.filter((p) => p.rule === 'grass');
    expect(grass.every((p) => /^tuft_[0-2]$/.test(p.key))).toBe(true);
    expect(grass.some((p) => p.x <= 2 && p.y >= 3)).toBe(false); // stone region excluded
    expect(a.filter((p) => p.rule === 'roots').map((p) => [p.x, p.y])).toEqual([[4, 1], [5, 1], [6, 1]]);
    const peb = a.filter((p) => p.rule === 'pebbles');
    expect(new Set(peb.map((p) => p.side))).toEqual(new Set(['left', 'right']));
    expect(peb.length).toBeGreaterThanOrEqual(2);
    const row = a.filter((p) => p.rule === 'sparse' && p.y === 1).map((p) => p.x);
    for (let i = 1; i < row.length; i++) expect(row[i] - row[i - 1]).toBeGreaterThanOrEqual(3);
    expect(() => evaluateDecor([{ id: 'x', when: 'nope', place: 'y' }], grid)).toThrow(/unknown/);
  });
  it('headroom: 2-tile ceilings are flagged for the 80 px Jo, open sky is not', () => {
    expect(headroomSpans(['####', '....', '....', '####']).length).toBe(4);
    expect(headroomSpans(['####', '....', '....', '....', '####']).length).toBe(0);
    expect(headroomSpans(['....', '....', '####']).length).toBe(0);
  });
});

describe('BeatRunner', () => {
  it('runs steps in order, awaits async handlers, branches on flags, nests beats', async () => {
    const calls = [];
    const F = { met: true };
    const r = new BeatRunner({
      beats: { intro: [{ say: 'hi' }, { wait: 10 }, { if: 'met', then: [{ say: 'again' }], else: [{ say: 'first' }] }, { beat: 'tail' }], tail: [{ set: 'done' }] },
      handlers: {
        say: async (v) => {
          await Promise.resolve();
          calls.push(`say:${v}`);
        },
        set: (v) => {
          F[v] = true;
          calls.push(`set:${v}`);
        },
      },
      delay: async (ms) => calls.push(`wait:${ms}`),
      flags: () => F,
    });
    await r.play('intro');
    expect(calls).toEqual(['say:hi', 'wait:10', 'say:again', 'set:done']);
    expect(F.done).toBe(true);
    expect(r.busy).toBe(false);
  });
  it('an unknown step throws; cancelAll stops at the next step', async () => {
    const r = new BeatRunner({ beats: { bad: [{ fly: 1 }] }, delay: async () => {} });
    await expect(r.play('bad')).rejects.toThrow(/no handler/);
    const seen = [];
    let release;
    const r2 = new BeatRunner({
      beats: { b: [{ say: 1 }, { say: 2 }] },
      handlers: { say: (v) => (seen.push(v), v === 1 ? new Promise((res) => (release = res)) : null) },
    });
    const p = r2.play('b');
    await Promise.resolve();
    r2.cancelAll();
    release();
    await p;
    expect(seen).toEqual([1]);
  });
  it('a handler result lands in ctx.last (encounter results)', async () => {
    const r = new BeatRunner({ beats: { e: [{ encounter: 'x' }, { if: { flag: 'never', not: true }, then: [{ encounter: 'y' }] }] }, handlers: { encounter: async (id) => ({ id, ok: true }) } });
    const ctx = await r.play('e');
    expect(ctx.last).toEqual({ id: 'y', ok: true });
  });
});

describe('DialogueRunner', () => {
  const conv = {
    id: 'c',
    nodes: {
      start: { who: 'wren', text: 'Hello.', next: 'ask' },
      ask: { who: 'jo', text: '…', choices: [{ text: 'Yes', next: 'yes', set: { agreed: true } }, { text: 'Later', next: 'later' }, { text: 'Secret', next: 'yes', if: 'secret' }] },
      yes: { who: 'wren', text: 'Good.', effects: [{ objective: 'go' }], end: true },
      later: { who: 'wren', text: 'Fine.', if: '!agreed', end: true },
    },
  };
  it('walks nodes, filters choices, applies sets and effects', () => {
    const F = {};
    const fx = [];
    const r = new DialogueRunner(conv, { flags: () => F, onSet: (k, v) => (F[k] = v), onEffect: (e) => fx.push(e) });
    expect(r.node.text).toBe('Hello.');
    r.next();
    expect(r.choices().map((c) => c.text)).toEqual(['Yes', 'Later']);
    r.next(0);
    expect(F.agreed).toBe(true);
    expect(r.node.id).toBe('yes');
    expect(fx).toEqual([{ objective: 'go' }]);
    r.next();
    expect(r.done).toBe(true);
    expect(r.chosen).toBe('Yes');
  });
  it('lints dangling and unreachable nodes', () => {
    expect(conversationIssues(conv)).toEqual([]);
    const bad = { id: 'b', nodes: { start: { who: 'x', text: 'a', next: 'zz' }, orphan: { who: 'x', text: 'b' } } };
    const out = conversationIssues(bad).join('\n');
    expect(out).toMatch(/"zz" does not exist/);
    expect(out).toMatch(/orphan: unreachable/);
  });
});

describe('InputMap', () => {
  it('maps keyboard and gamepad to actions with edges', () => {
    const m = new InputMap();
    m.update({ keys: new Set(['KeyA']) });
    expect(m.isDown('left')).toBe(true);
    expect(m.justDown('left')).toBe(true);
    m.update({ keys: new Set(['KeyA']) });
    expect(m.justDown('left')).toBe(false);
    m.update({ keys: new Set() });
    expect(m.justUp('left')).toBe(true);
    m.update({ keys: new Set(), pad: { buttons: [{ pressed: true }], axes: [0.9, 0] } });
    expect(m.isDown('jump')).toBe(true);
    expect(m.isDown('right')).toBe(true);
    expect(m.lastDevice).toBe('gamepad');
    expect(m.label('jump')).toBe('A');
    m.update({ keys: new Set(), pad: { buttons: [], axes: [0.2, 0] } });
    expect(m.isDown('right')).toBe(false); // deadzone
  });
  it('suspends, remaps and rejects unknown actions', () => {
    const m = new InputMap();
    m.suspend(true);
    m.update({ keys: new Set(['KeyE']) });
    expect(m.isDown('act1')).toBe(false);
    m.suspend(false);
    m.bind('act1', 'keyboard', ['KeyF']);
    m.update({ keys: new Set(['KeyF']) });
    expect(m.justDown('act1')).toBe(true);
    expect(m.label('act1')).toBe('F');
    expect(() => m.bind('fly', 'keyboard', ['KeyZ'])).toThrow();
  });
});

describe('Encounters: logic engine and presenter are separate', () => {
  it('the clockwork engine seats gears on hits and slows on misses, deterministically', () => {
    const e = clockwork({ gears: 2, speed: 100 });
    expect(e.press()).toBe('miss');
    const s0 = e.state();
    expect(s0.misses).toBe(1);
    // step until the hand is in the window, then press
    for (let g = 0; g < 2; g++) {
      let n = 0;
      while (!e.state().inWindow && n++ < 10000) e.update(5);
      expect(e.press()).toBe('hit');
    }
    expect(e.done).toBe(true);
    expect(e.result.ok).toBe(true);
    expect(e.result.misses).toBe(1);
  });
  it('the engine imports nothing from Phaser', () => {
    expect(readFileSync(new URL('../src/engines/clockwork.js', import.meta.url), 'utf8')).not.toMatch(/from ['"]phaser/);
    expect(readFileSync(new URL('../src/play/Encounters.js', import.meta.url), 'utf8')).not.toMatch(/from 'phaser'/);
  });
  it('Encounters drives engine → presenter and resolves with the result', async () => {
    const rendered = [];
    const host = { makePresenter: () => ({ enter: vi.fn(), render: (s, o) => rendered.push(o), destroy: vi.fn() }), enter: vi.fn(), exit: vi.fn() };
    const enc = new Encounters({ defs: { cw: { engine: clockwork, params: { gears: 1, speed: 120 } } }, host });
    const p = enc.start('cw', { anchor: { x: 0, y: 0 } });
    expect(enc.busy).toBe(true);
    let press = false;
    const input = { justDown: (k) => press && k === 'act1' };
    for (let i = 0; i < 2000 && enc.busy; i++) {
      press = enc.active.t > 300 && enc.active.engine.state().inWindow;
      enc.update(10, input);
    }
    const r = await p;
    expect(r.ok).toBe(true);
    expect(rendered).toContain('hit');
    expect(host.exit).toHaveBeenCalled();
    await expect(enc.start('nope')).rejects.toThrow();
  });
  it('back leaves without a result', async () => {
    const enc = new Encounters({ defs: { cw: { engine: clockwork } } });
    const p = enc.start('cw');
    enc.update(300, { justDown: (k) => k === 'back' });
    expect((await p).left).toBe(true);
  });
});

describe('PerfBudget', () => {
  it('counts objects into containers and estimates batches', () => {
    const tex = (k) => ({ texture: { key: k } });
    const list = [tex('a'), tex('a'), { list: [tex('a'), tex('b')] }, { type: 'Graphics' }, tex('b'), { ...tex('c'), visible: false }];
    expect(countObjects(list)).toBe(8);
    expect(estimateDrawCalls(list)).toBe(4);
  });
});
