// The road's arithmetic: pieces to segments, segments to the screen.
import { describe, it, expect } from 'vitest';
import { compile, project, heightAt, SEG_LEN, CURVE_K, BOARDS, CAM, ROAD_M } from '../src/engines/road.js';
import { TRACKS } from '../src/dreams/racer/race/tracks.js';

const W = 960;
const flat = (m = 1000) => compile({ pieces: [{ straight: m }] });
const stripAt = (strips, d) => strips.find((s) => s.seg.d >= d);

describe('compile', () => {
  it('cuts the road into 4 m segments, with a run-off past the line', () => {
    const t = flat(1000);
    expect(SEG_LEN).toBe(4);
    expect(t.length).toBe(1000);
    expect(t.segments.filter((s) => s.d < t.length).length).toBe(250);
    expect(t.segments.length).toBeGreaterThan(250 + CAM.draw);
  });
  it('derives the curve from the safe speed: a 19 m/s hairpin is about 0.9, signed by the way it turns', () => {
    const t = compile({ pieces: [{ straight: 100 }, { bend: 'R', len: 40, safe: 19 }, { bend: 'L', len: 40, safe: 38 }, { straight: 100 }] });
    const [r, l] = t.bends;
    expect(r.curve).toBeCloseTo(CURVE_K / 361, 5);
    expect(r.curve).toBeGreaterThan(0.85);
    expect(r.curve).toBeLessThan(0.95);
    expect(l.curve).toBeCloseTo(-r.curve / 4, 5);
    expect(t.segments[0].curve).toBe(0);
    expect(t.segments[30].curve).toBe(r.curve);
    expect(t.segments[40].curve).toBe(l.curve);
    expect([r.from, r.to, l.from, l.to]).toEqual([100, 140, 140, 180]);
  });
  it('a bend throws you away from the way it turns', () => {
    const t = compile({ pieces: [{ bend: 'R', len: 40, safe: 20 }, { bend: 'L', len: 40, safe: 20 }] });
    expect(t.bends[0].side).toBe(-1);
    expect(t.bends[1].side).toBe(1);
  });
  it('eases a hill and holds its height after', () => {
    const t = compile({ pieces: [{ straight: 40 }, { straight: 80, hill: 6 }, { straight: 40 }, { straight: 40, hill: -2 }, { straight: 40 }] });
    expect(heightAt(t, 0)).toBe(0);
    expect(heightAt(t, 40)).toBe(0);
    expect(heightAt(t, 80)).toBeCloseTo(3, 5);
    expect(heightAt(t, 120)).toBe(6);
    expect(heightAt(t, 150)).toBe(6);
    expect(heightAt(t, 220)).toBe(4);
    expect(heightAt(t, 44)).toBeLessThan(0.1); // eased: no step at the foot
  });
  it('stands things on their segments and derives the boards', () => {
    const t = compile({ pieces: [{ straight: 300 }, { bend: 'L', len: 40, safe: 20 }], lamps: [200, 100], things: [{ d: 50, kind: 'cart', x: 0.5 }, { d: 70, kind: 'goat' }] });
    expect(t.lamps).toEqual([100, 200]);
    expect(t.obstacles.map((o) => o.kind)).toEqual(['cart']);
    expect(t.obstacles[0].len).toBeGreaterThan(0);
    expect(t.segments[12].things.map((o) => o.kind)).toContain('cart');
    expect(t.segments[17].things.map((o) => o.kind)).toContain('goat');
    expect(t.segments[25].things.map((o) => o.kind)).toContain('lamp');
    expect(t.boards.map((b) => b.d)).toEqual(BOARDS.map((m) => 300 - m));
    expect(t.segments[Math.floor(t.boards[0].d / SEG_LEN)].things).toContain(t.boards[0]);
  });
});

describe('project', () => {
  it('a straight runs up the middle to the horizon, smaller as it goes', () => {
    const strips = project(flat(), 100, 0);
    expect(strips.length).toBeLessThanOrEqual(CAM.draw + 1);
    for (const s of strips) expect(s.x).toBeCloseTo(W / 2, 5);
    for (let i = 1; i < strips.length; i++) {
      expect(strips[i].y).toBeLessThan(strips[i - 1].y);
      expect(strips[i].scale).toBeLessThan(strips[i - 1].scale);
      expect(strips[i].visible).toBe(true);
    }
    expect(strips.at(-1).y).toBeGreaterThan(540 * CAM.horizon);
    expect(strips.at(-1).z).toBeLessThanOrEqual(CAM.draw * SEG_LEN + SEG_LEN);
  });
  it('the road moves under the car: steer right and the road goes left', () => {
    const [s] = project(flat(), 100, 0.5);
    expect(s.x).toBeCloseTo(W / 2 - 0.5 * s.scale * ROAD_M, 5);
    expect(s.halfW).toBeCloseTo(s.scale * ROAD_M, 5);
  });
  it('the car sits on the road at the bottom of the screen', () => {
    const y = 540 * CAM.horizon + (CAM.depth * W) / 2 * (CAM.height / (CAM.back - 1.9)); // under its tail
    expect(y).toBeGreaterThan(450);
    expect(y).toBeLessThan(540);
  });
  it("a 24 m/s bend's inside edge stays on the screen, and bends the right way", () => {
    for (const [bend, sign] of [['R', 1], ['L', -1]]) {
      const t = compile({ pieces: [{ straight: 200 }, { bend, len: 400, safe: 24 }, { straight: 200 }] });
      const strips = project(t, 230, 0);
      const far = strips.filter((s) => s.z >= 40 && s.z <= 120);
      expect(far.length).toBeGreaterThan(10);
      for (const s of far) {
        const inside = s.x + sign * s.halfW;
        expect(inside).toBeGreaterThan(0);
        expect(inside).toBeLessThan(W);
        expect((s.x - W / 2) * sign).toBeGreaterThan(0);
      }
    }
  });
  it('moves smoothly from one segment to the next', () => {
    const t = compile({ pieces: [{ straight: 200 }, { bend: 'R', len: 400, safe: 24 }] });
    const at = (cam) => stripAt(project(t, cam), 300).x;
    expect(Math.abs(at(230.1) - at(230))).toBeLessThan(3);
    expect(Math.abs(at(232.01) - at(231.99))).toBeLessThan(3); // across the join
  });
  it('the crest hides the blind right until the top, and the board is all you have', () => {
    const T = TRACKS.pinewood;
    const blind = T.bends.find((b) => b.name === 'blind right');
    const hidden = (d) => project(T, d - CAM.back).filter((s) => s.seg.d >= blind.from && s.seg.d < blind.to).every((s) => !s.visible);
    expect(hidden(blind.from - 80)).toBe(true);
    expect(hidden(blind.from - 60)).toBe(true);
    expect(hidden(blind.from - 15)).toBe(false);
    expect(T.boards.filter((b) => b.bend === blind).some((b) => b.d > T.hills[0].from && b.d < T.hills[0].to)).toBe(true); // the boards start on the climb
  });
  it('the cart is in view 150 m out', () => {
    const T = TRACKS.pinewood;
    const cart = T.obstacles.find((o) => o.kind === 'cart');
    const s = stripAt(project(T, cart.d - 150 - CAM.back), cart.d);
    expect(s.visible).toBe(true);
    expect(s.x).toBeGreaterThan(0);
    expect(s.x).toBeLessThan(W);
  });
  it('the road runs on behind the grid, so the first frame has a road under the car', () => {
    const strips = project(flat(), -CAM.back);
    expect(strips[0].z).toBeLessThanOrEqual(CAM.near + SEG_LEN);
    expect(strips[0].seg.i).toBe(0);
  });
});
