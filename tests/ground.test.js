// Round 2 WP1: the continuous ground solver (src/entities/ground.js) and the
// ground shadow's height → look mapping (src/entities/PlayerShadow.js).
import { describe, it, expect } from 'vitest';
import { groundAt, solveGround, gradientAt } from '../src/entities/ground.js';
import { shadowLook } from '../src/entities/PlayerShadow.js';
import { slopeRoleAt, crestSides, roleOf, isSolidChar } from '../src/builders/legend.js';

const T = 32;

// a scene from a tile map (rows of legend chars), as the builders fill it
function sceneOf(rows, extra = {}) {
  const charAt = (x, y) => (rows[y] && rows[y][x]) || '.';
  const slopeGrid = {};
  const solidGrid = {};
  const oneWayGrid = {};
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const s = slopeRoleAt(charAt, x, y);
      if (s) (slopeGrid[y] ||= {})[x] = s;
      else if (isSolidChar(ch)) (solidGrid[y] ||= {})[x] = true;
      else if (roleOf(ch) === 'oneway') (oneWayGrid[y] ||= {})[x] = y * T;
    }),
  );
  return { slopeGrid, solidGrid, oneWayGrid, ...extra, charAt };
}

// a walker: a 24×44 body under gravity, integrated like Arcade, then solved
function walker(x, feet) {
  const body = {
    x: x - 12,
    y: feet - 44,
    width: 24,
    height: 44,
    enable: true,
    allowGravity: true,
    velocity: { x: 0, y: 0 },
    blocked: { down: true },
    prevFrame: { x: 0, y: 0 },
    get bottom() {
      return this.y + this.height;
    },
  };
  const sprite = { y: body.y + 22, __ground: { grounded: true } }; // standing (Arcade landed it)
  return { body, sprite };
}

// walk at vx for n frames (or until x passes `toX`); log feet and grounding
function walk(scene, w, vx, { frames = 600, toX = null } = {}) {
  const dt = 1 / 60;
  const log = [];
  for (let i = 0; i < frames; i++) {
    const b = w.body;
    b.blocked.down = false; // Arcade resets the flags each step (no tile bodies here)
    b.velocity.x = vx;
    b.velocity.y += 1200 * dt;
    b.x += vx * dt;
    b.y += b.velocity.y * dt;
    b.prevFrame.y = b.y;
    solveGround(scene, w.sprite, b, dt);
    log.push({ x: b.x + 12, y: b.bottom, down: b.blocked.down });
    if (toX !== null && (vx > 0 ? b.x + 12 >= toX : b.x + 12 <= toX)) break;
  }
  return log;
}

// the 2 px rule against the true surface, and no airborne frame
function check(scene, log) {
  const g = { slopeGrid: scene.slopeGrid, solidGrid: scene.solidGrid, oneWayGrid: scene.oneWayGrid };
  let worst = 0;
  let air = 0;
  for (let i = 1; i < log.length; i++) {
    const a = log[i - 1];
    const c = log[i];
    const sa = groundAt(g, a.x, a.y - 12, a.y + 12);
    const sc = groundAt(g, c.x, a.y - 12, a.y + 12);
    if (sa !== null && sc !== null) worst = Math.max(worst, Math.abs(c.y - a.y - (sc - sa)));
    if (!c.down) air += 1;
  }
  return { worst, air };
}

function run(rows, fromCol, toCol, floorRow, speeds = [120, 215, 280]) {
  const out = [];
  for (const v of speeds) {
    for (const dir of [1, -1]) {
      const scene = sceneOf(rows);
      const [c0, c1] = dir > 0 ? [fromCol, toCol] : [toCol, fromCol];
      const x0 = c0 * T + T / 2;
      const g = { slopeGrid: scene.slopeGrid, solidGrid: scene.solidGrid, oneWayGrid: scene.oneWayGrid };
      const feet = groundAt(g, x0, 0, floorRow * T + T * 4);
      const w = walker(x0, feet);
      const log = walk(scene, w, dir * v, { toX: c1 * T + T / 2 });
      out.push({ v, dir, ...check(scene, log), reached: Math.abs(log[log.length - 1].x - (c1 * T + T / 2)) < 8 });
    }
  }
  return out;
}

const expectSmooth = (res) => {
  for (const r of res) {
    expect(r.reached, JSON.stringify(r)).toBe(true);
    expect(r.air, JSON.stringify(r)).toBe(0);
    expect(r.worst, JSON.stringify(r)).toBeLessThanOrEqual(2);
  }
};

describe('ground solver', () => {
  it('flat ground: feet stay put, always grounded', () => {
    expectSmooth(run(['..........', '##########'], 1, 8, 1));
  });

  it('a 45° slope, up and down, with the joins to the flat at both ends', () => {
    const rows = ['............', '......./####', '....../#####', '############'];
    expectSmooth(run(rows, 1, 11, 3));
  });

  it('a crest: a mound, up one side and down the other', () => {
    expectSmooth(run(['..............', '...../###\\....', '##############'], 1, 13, 2));
  });

  it('a valley: down into a dip and up out of it', () => {
    expectSmooth(run(['##\\..../##', '###\\../###', '##########'], 0, 9, 0));
  });

  it('a staircase of S steps walks as a 45° flight, top and bottom joins included', () => {
    const rows = ['..........', '......S###', '.....S####', '....S#####', '##########'];
    expect(slopeRoleAt(sceneOf(rows).charAt, 4, 3)).toBe('slope_stair_r');
    expectSmooth(run(rows, 1, 9, 4));
  });

  it('a half-pitch flight (k/K pairs) walks at 16 px a tile', () => {
    const rows = ['............', '.......kK###', '.....kK#####', '############'];
    const res = run(rows, 1, 11, 3);
    expectSmooth(res);
    const g = { ...sceneOf(rows) };
    expect(gradientAt(g, 7.5 * T, T + 24)).toBeCloseTo(-0.5, 5);
  });

  it('steps up a low lip (≤ 10 px) eased at most 4 px a frame past the gradient', () => {
    // a one-way top 8 px above the floor, from column 5 on
    const scene = sceneOf(['..........', '##########']);
    scene.oneWayGrid = { 0: { 5: T - 8, 6: T - 8, 7: T - 8, 8: T - 8, 9: T - 8 } };
    const w = walker(2 * T, T);
    const log = walk(scene, w, 280, { toX: 8 * T });
    const rises = log.slice(1).map((l, i) => log[i].y - l.y);
    expect(Math.max(...rises)).toBeLessThanOrEqual(280 / 60 + 4 + 1e-6);
    expect(log.every((l) => l.down)).toBe(true);
    expect(log[log.length - 1].y).toBe(T - 8);
  });

  it('snaps down a small drop (the ground covered + slack) instead of going airborne', () => {
    const scene = sceneOf(['..........', '##########']);
    scene.oneWayGrid = { 0: { 0: T - 6, 1: T - 6, 2: T - 6, 3: T - 6 } };
    const w = walker(1 * T, T - 6);
    const log = walk(scene, w, 215, { toX: 7 * T });
    expect(log.every((l) => l.down)).toBe(true);
    expect(log[log.length - 1].y).toBe(T);
  });

  it('walks off a real ledge: no ground in the window, gravity takes it', () => {
    const scene = sceneOf(['#####.....', '#####.....', '#####.....', '##########']);
    const w = walker(2 * T, 0);
    const log = walk(scene, w, 215, { frames: 40 });
    expect(log.some((l) => !l.down)).toBe(true);
  });

  it('a jump (rising) bypasses the snap', () => {
    const scene = sceneOf(['..........', '##########']);
    const w = walker(3 * T, T);
    w.body.velocity.y = -600;
    w.body.y -= 10;
    const before = w.body.bottom;
    solveGround(scene, w.sprite, w.body, 1 / 60);
    expect(w.body.bottom).toBe(before);
  });

  it("lands on a slope from the air at the surface under the foot centre", () => {
    const scene = sceneOf(['..........', '..../#####', '##########']);
    const w = walker(4.5 * T, T + T / 2 - 6);
    w.body.blocked.down = false;
    w.sprite.__ground = { grounded: false };
    w.body.velocity.y = 400; // falling, the feet just past the line
    w.body.y += 9;
    expect(solveGround(scene, w.sprite, w.body, 1 / 60)).toBe(true);
    expect(w.body.bottom).toBeCloseTo(T + T / 2, 5);
  });

  it('crest sides: a solid tile flush with a slope high end is no wall on that side', () => {
    const rows = ['...../###\\..', '############'];
    const sc = sceneOf(rows);
    const slopeAt = (x, y) => slopeRoleAt(sc.charAt, x, y);
    expect(crestSides(slopeAt, 6, 0)).toEqual({ left: true, right: false });
    expect(crestSides(slopeAt, 8, 0)).toEqual({ left: false, right: true });
    expect(crestSides(slopeAt, 7, 0)).toEqual({ left: false, right: false });
  });
});

describe('ground shadow: height → look', () => {
  it('full size and base alpha on the ground', () => {
    expect(shadowLook(0, { alpha: 0.4 })).toEqual({ visible: true, alpha: 0.4, scale: 1 });
  });
  it('shrinks and fades monotonically with height', () => {
    let last = shadowLook(0);
    for (let h = 10; h <= 230; h += 10) {
      const l = shadowLook(h);
      expect(l.alpha).toBeLessThanOrEqual(last.alpha);
      expect(l.scale).toBeLessThanOrEqual(last.scale);
      last = l;
    }
    expect(shadowLook(160).scale).toBeCloseTo(0.5, 5);
  });
  it('still readable at the apex of a full jump (150 px)', () => {
    expect(shadowLook(150, { alpha: 0.5 }).alpha).toBeGreaterThan(0.2);
  });
  it('hidden with no ground in reach, or far below', () => {
    expect(shadowLook(null).visible).toBe(false);
    expect(shadowLook(260).visible).toBe(false);
  });
});
