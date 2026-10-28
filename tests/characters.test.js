import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateManifest } from '../src/core/manifest.js';
import { AnimationController, resolveState, transitionInsert } from '../src/art/AnimationController.js';
import joManifest from '../src/art/characters/jo/manifest.js';
import { POSES } from '../src/data/rigs/jo.poses.js';
import joRig from '../src/data/rigs/jo.js';
import { composeHuman } from '../src/art/rig/human.js';
import { encodePNG, decodePNG } from '../scripts/lib/png.js';
import { image, setPx } from '../scripts/lib/raster.js';
import { importPack } from '../scripts/lib/importer.js';

const counts = Object.fromEntries(Object.keys(joManifest.animations).map((a) => [a, POSES[a].length]));
const withFrames = { ...joManifest, animations: Object.fromEntries(Object.entries(joManifest.animations).map(([a, m]) => [a, { ...m, frames: counts[a] }])) };

describe('manifest validator', () => {
  it("accepts Jo's manifest with the pose tables' frame counts", () => {
    expect(validateManifest(joManifest, counts)).toEqual([]);
  });
  it('rejects a missing idle, bad refs, cycles, bad events and modes', () => {
    const bad = {
      id: 'x', source: 'rig', frame: [10, 10], anchor: [5, 20],
      animations: {
        walk: { mode: 'stride' },
        a: { fps: 5, fallback: 'b' },
        b: { fps: 5, fallback: 'a' },
        c: { fps: 5, next: 'nope', events: { 9: 'footstep' } },
        d: {},
      },
    };
    const e = validateManifest(bad, { walk: 8, a: 1, b: 1, c: 2, d: 1 }).join('\n');
    expect(e).toMatch(/anchor: outside/);
    expect(e).toMatch(/needs idle/);
    expect(e).toMatch(/walk: stride mode needs step/);
    expect(e).toMatch(/fallback cycle/);
    expect(e).toMatch(/c.next: unknown/);
    expect(e).toMatch(/events: frame 9 out of range/);
    expect(e).toMatch(/d: needs fps/);
  });
  it('flags animations with no frames', () => {
    expect(validateManifest(joManifest, { ...counts, walk: 0 }).join()).toMatch(/walk: no frames/);
  });
});

const snap = (o = {}) => ({ grounded: true, vx: 0, vy: 0, inputX: 0, x: 0, y: 0, facing: 1, ...o });

describe('AnimationController: state → animation', () => {
  it('maps physics to the core states', () => {
    expect(resolveState(snap())).toBe('idle');
    expect(resolveState(snap({ vx: 60 }))).toBe('walk');
    expect(resolveState(snap({ vx: 200 }))).toBe('jog');
    expect(resolveState(snap({ vx: 280 }))).toBe('run');
    expect(resolveState(snap({ vx: 280, walkOnly: true }))).toBe('walk');
    expect(resolveState(snap({ grounded: false, vy: -400 }))).toBe('rise');
    expect(resolveState(snap({ grounded: false, vy: 30 }))).toBe('apex');
    expect(resolveState(snap({ grounded: false, vy: 400 }))).toBe('fall');
    expect(resolveState(snap({ grounded: false, vy: 60, wallSlide: true }))).toBe('wall_slide');
    expect(resolveState(snap({ crouch: true }))).toBe('crouch');
    expect(resolveState(snap({ crouch: true, vx: 100 }))).toBe('crouch_walk');
    expect(resolveState(snap({ climbing: true, vy: -150 }))).toBe('climb');
    expect(resolveState(snap({ climbing: true }))).toBe('climb_idle');
    expect(resolveState(snap({ pushing: true, vx: 0 }))).toBe('push');
    expect(resolveState(snap({ carrying: true, vx: 100 }))).toBe('carry_walk');
    expect(resolveState(snap({ floating: true, vx: 280 }))).toBe('float');
    expect(resolveState(snap({ dead: true, vx: 280 }))).toBe('death');
    expect(resolveState(snap({ pockets: true }))).toBe('pockets');
  });
  it('inserts skid, turn, start, land and the jump anticipation', () => {
    expect(transitionInsert('run', 'idle', snap({ vx: 140 }))).toBe('skid');
    expect(transitionInsert('run', 'run', snap({ vx: -10, inputX: -1, prevVx: 280 }))).toBe('turn');
    expect(transitionInsert('idle', 'walk', snap({ vx: 60, inputX: 1 }))).toBe('run_start');
    expect(transitionInsert('fall', 'idle', snap(), { landed: { hard: false } })).toBe('land');
    expect(transitionInsert('fall', 'idle', snap(), { landed: { hard: true } })).toBe('hard_land');
    expect(transitionInsert('idle', 'rise', snap({ grounded: false }), { jumped: true })).toBe('jump_anticipate');
  });
  it('follows fallback chains for missing animations (logged once)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const thin = { ...withFrames, animations: { ...withFrames.animations, skid: { ...withFrames.animations.skid, frames: 0 }, run: { ...withFrames.animations.run, frames: 0 } } };
    const a = new AnimationController(thin);
    expect(a.pick('skid')).toBe('walk'); // skid → run → walk
    expect(a.pick('skid')).toBe('walk');
    expect(warn).toHaveBeenCalledTimes(2); // once for skid, once for run
    warn.mockRestore();
  });
  it('plays a skid then idles when the input drops at speed', () => {
    const a = new AnimationController(withFrames);
    let x = 0;
    for (let i = 0; i < 30; i++) a.update(16.7, snap({ vx: 280, inputX: 1, x: (x += 4.67) }));
    expect(a.name).toBe('run');
    a.update(16.7, snap({ vx: 140, x: (x += 2.3) }));
    expect(a.name).toBe('skid');
    for (let i = 0; i < 40; i++) a.update(16.7, snap({ x }));
    expect(a.name).toBe('idle');
  });
  it('locks the run to ground covered: one frame per step', () => {
    const a = new AnimationController(withFrames);
    a.set('run');
    const step = joManifest.animations.run.step * joManifest.scale; // screen px per frame
    let x = 0;
    a.update(16.7, snap({ vx: 280, inputX: 1, x }));
    a.set('run', { force: true });
    a.oneShot = null;
    for (let f = 1; f <= 3; f++) {
      x += step;
      a.update(16.7, snap({ vx: 280, inputX: 1, x }));
      expect(a.name).toBe('run');
      expect(a.frame).toBe(f);
    }
  });
  it('fires footstep events on contact frames', () => {
    const a = new AnimationController(withFrames);
    const ev = [];
    a.onEvent = (e) => ev.push(e);
    let x = 0;
    a.update(16.7, snap({ x }));
    a.set('walk', { force: true });
    for (let i = 0; i < 24; i++) a.update(16.7, snap({ vx: 60, inputX: 1, x: (x += 6) }));
    expect(ev.filter((e) => e === 'footstep').length).toBeGreaterThanOrEqual(2);
  });
  it('a forced verb (swing) plays through and resolves', async () => {
    const a = new AnimationController(withFrames);
    const done = a.playOnce('swing');
    for (let i = 0; i < 20; i++) a.update(16.7, snap());
    await expect(done).resolves.toBe(true);
    expect(a.name).toBe('idle');
  });
});

describe('Jo rig', () => {
  it('stands about 41 rows (82 px at 2×) with legs ≥ 40% of his height', () => {
    const c = composeHuman(joRig, POSES.idle[0]);
    const rows = [];
    for (let y = 0; y < c.body.h; y++) if (c.body.px.slice(y * c.body.w, (y + 1) * c.body.w).some(Boolean) || c.hat.px.slice(y * c.hat.w, (y + 1) * c.hat.w).some(Boolean)) rows.push(y);
    const h = rows[rows.length - 1] - rows[0] + 1;
    expect(h * joManifest.scale).toBeGreaterThanOrEqual(78);
    expect(h * joManifest.scale).toBeLessThanOrEqual(88);
    const legs = joRig.metrics.sole - joRig.metrics.hipY + 1;
    expect(legs / h).toBeGreaterThanOrEqual(0.4);
  });
  it('walk contacts move exactly one step per frame (no slide in the art)', () => {
    const step = joManifest.animations.walk.step;
    const f = POSES.walk.map((p) => composeHuman(joRig, p).contacts.f);
    for (let i = 1; i < 4; i++) expect(f[i - 1] - f[i]).toBe(step);
  });
});

describe('importer', () => {
  it('slices a sheet, anchors the feet and records the licence', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-import-'));
    const img = image(8, 4);
    for (let x = 0; x < 8; x++) for (let y = 1; y < 4; y++) setPx(img, x, y, x < 4 ? 0xff0000 : 0x00ff00);
    fs.writeFileSync(path.join(dir, 'sheet.png'), encodePNG(img));
    expect(decodePNG(fs.readFileSync(path.join(dir, 'sheet.png'))).data[4 * 8 + 3]).toBe(255);
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ pack: 'test', licence: 'CC0', scale: 2, sheets: [{ file: 'sheet.png', frameWidth: 4, frameHeight: 4, anchor: 'auto', prefix: 'npc/street/side', animations: { idle: { from: 0, count: 2 } } }] }));
    const { man, frames } = importPack(dir);
    expect(man.licence).toBe('CC0');
    expect(frames.map((f) => f.name)).toEqual(['npc/street/side/idle/00', 'npc/street/side/idle/01']);
    expect(frames[0].img.width).toBe(8);
    expect(frames[0].pivot.y).toBeCloseTo(1);
  });
});
