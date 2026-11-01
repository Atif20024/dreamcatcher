// Every baked frame of every character, against that character's own frames: a
// figure must not lose its head, its body or its hat on one frame of a loop.
// Runs on the bake's own composition (no browser, no built atlas).
import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { partCounts, stamp, grid } from '../src/art/rig/compose.js';
import { composeHuman } from '../src/art/rig/human.js';
import * as R from '../scripts/lib/raster.js';

// the bake imports hubArt, which imports phaser (browser-only)
vi.mock('phaser', () => ({ default: { Math: { RandomDataGenerator: class {} }, Display: { Color: {} } } }));

const MIN_H = 0.8; // of the animation's median opaque height
const MIN_AREA = 0.5; // of its median width×height (a reaching arm is most of a frame's width)
const MIN_HEAD = 0.5; // of the character's fullest head
const MIN_TORSO = 0.33; // of the fullest torso (a child's swinging arm covers half of one)

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const gridBox = (g) => {
  let x0 = g.w, x1 = -1, y0 = g.h, y1 = -1;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.px[y * g.w + x]) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
  return x1 < 0 ? { w: 0, h: 0 } : { w: x1 - x0 + 1, h: y1 - y0 + 1 };
};

// frames: [{ who, anim, name, box: {w, h}, parts, hatless }]
function frameIssues(frames) {
  const issues = [];
  const byWho = Map.groupBy(frames, (f) => f.who);
  for (const [, mine] of byWho) {
    const most = (part) => Math.max(...mine.map((f) => f.parts[part] || 0));
    const hatPx = most('hat');
    const headPx = most('head');
    const torsoPx = most('torso');
    for (const f of mine) {
      if ((f.parts.head || 0) < headPx * MIN_HEAD) issues.push(`${f.name}: head ${f.parts.head || 0}px of ${headPx}`);
      if ((f.parts.torso || 0) < torsoPx * MIN_TORSO) issues.push(`${f.name}: torso ${f.parts.torso || 0}px of ${torsoPx}`);
      if (hatPx && !f.parts.hat && !f.hatless) issues.push(`${f.name}: no hat`);
      if (/wave/.test(f.anim) && !f.parts.hand_f) issues.push(`${f.name}: waving with no hand`);
    }
    for (const [anim, group] of Map.groupBy(mine, (f) => f.anim)) {
      if (group.length < 2) continue;
      const midH = median(group.map((f) => f.box.h));
      const midA = median(group.map((f) => f.box.w * f.box.h));
      for (const f of group)
        if (!f.lying && (f.box.h < midH * MIN_H || f.box.w * f.box.h < midA * MIN_AREA)) issues.push(`${f.name}: ${f.box.w}×${f.box.h} against ${anim}'s median height ${midH}, area ${midA}`);
    }
  }
  return issues;
}

// the rigged cast, from the bake itself: the image's box, the composition's parts
async function castFrames() {
  const { bakeCast } = await import('../scripts/lib/cast-bake.js');
  const { frames } = await bakeCast(path.resolve(import.meta.dirname, '..'), new Map());
  return frames.map((f) => {
    const b = R.bbox(f.img) || { w: 0, h: 0 };
    return { who: f.owner, anim: f.name.replace(/#\d+$/, ''), name: f.name, box: { w: b.w, h: b.h }, parts: partCounts(f.grid) };
  });
}
// Jo and Wren, as scripts/build-atlas.js composes them (the outfits only recolour)
async function rigFrames(id) {
  const { default: rig } = await import(`../src/data/rigs/${id}.js`);
  const { POSES } = await import(`../src/data/rigs/${id}.poses.js`);
  const { default: manifest } = await import(`../src/art/characters/${id}/manifest.js`);
  return Object.keys(manifest.animations).flatMap((anim) =>
    POSES[anim].map((pose, i) => {
      const { body, hat } = composeHuman(rig, pose);
      return { who: id, anim, name: `${id}/${anim}/${i}`, box: gridBox(body), parts: { ...partCounts(body), hat: partCounts(hat).hat }, hatless: pose.hat === false, lying: !!pose.rot };
    }),
  );
}

describe('baked frames are whole', () => {
  it('no frame of any character loses its head, its torso, its hat or its size', async () => {
    const frames = [...(await castFrames()), ...(await rigFrames('jo')), ...(await rigFrames('nell'))];
    expect(new Set(frames.map((f) => f.who)).size).toBeGreaterThan(100); // the walk really walked the cast
    expect(frameIssues(frames)).toEqual([]);
  }, 120000);

  it('the check catches a headless frame, and a stamp survives a fractional hip', () => {
    const whole = { who: 'x', anim: 'idle', box: { w: 24, h: 80 }, parts: { head: 60, torso: 80, hat: 20 } };
    const bad = { ...whole, name: 'x#3', box: { w: 22, h: 58 }, parts: { arm_f: 30 } };
    const out = frameIssues([{ ...whole, name: 'x#1' }, { ...whole, name: 'x#2' }, bad]).join('\n');
    expect(out).toMatch(/x#3: head 0px/);
    expect(out).toMatch(/x#3: torso 0px/);
    expect(out).toMatch(/x#3: no hat/);
    expect(out).toMatch(/x#3: 22×58/);
    const g = grid(8, 8);
    stamp(g, ['ab'], 2.0625, 3, 0, 0, 'head');
    expect(partCounts(g).head).toBe(2);
  });
});
