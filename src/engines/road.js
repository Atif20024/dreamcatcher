// The road: pure arithmetic, no Phaser (tests/road.test.js pins it). A track is
// written as pieces; compile() turns them into 4 m segments, and project() turns
// the segments ahead of a camera into screen strips, nearest first. The view
// draws a quad between each visible strip and the next; the engine only reads
// `bends`.
//
//   const track = compile({ pieces: [{ straight: 200 }, { bend: 'R', len: 90, safe: 24, outside: 'straw', hill: 6 }], lamps, things, cues });
//   track.segments[i]: { i, d, curve, y, things }
//   project(track, jo.d - CAM.back, jo.x): [{ seg, z, x, y, scale, halfW, visible }]

export const SEG_LEN = 4; // m
export const ROAD_M = 4; // m from the middle of the road to its edge: 1 road width in x
export const CURVE_K = 325; // curve = K / safe²: a tight 19 m/s hairpin is about 0.9
export const BOARDS = [150, 100, 50]; // m before a bend
const RUN_OFF = 120; // segments past the line, for the car rolling down and the road ahead of it

export const CAM = {
  height: 2.2, // m above the road: high enough to see the road over her (at 1.4 m the car hid everything nearer than 25 m)
  back: 5.3, // m behind the car's middle: her tail sits 3.4 m ahead of the lens, 190 px wide on the screen
  horizon: 0.42, // of the screen's height
  depth: 0.84, // focal length in half-screen widths
  near: 1, // m: nothing nearer than this is drawn
  draw: 60, // segments: 240 m, 6.7 s at the top speed
  curveDraw: 0.13, // curve is drift at full speed; this makes it a road you can see round (a little more than the true geometry of a 0.8 g bend: a bend must read at a glance)
};

// what stands in the road, and how much of it there is (len m, wide in road widths)
const SIZE = { cart: { len: 3, wide: 0.5 }, bale: { len: 1, wide: 0.3 } };

const ease = (k) => k * k * (3 - 2 * k);

// the road's height at d, eased across each hill piece
export function heightAt(track, d) {
  let y = 0;
  for (const h of track.hills) {
    if (d >= h.to) y = h.y1;
    else if (d > h.from) return h.y0 + (h.y1 - h.y0) * ease((d - h.from) / (h.to - h.from));
    else break;
  }
  return y;
}

export function compile(track) {
  const bends = [];
  const hills = [];
  let d = 0;
  let y = 0;
  for (const p of track.pieces) {
    const len = p.straight ?? p.len;
    if (p.bend) {
      const turn = p.bend === 'R' ? 1 : -1;
      bends.push({ name: p.name, from: d, to: d + len, safe: p.safe, side: -turn, outside: p.outside, lineSpeed: p.lineSpeed, lineLen: p.lineLen, curve: (turn * CURVE_K) / (p.safe * p.safe) });
    }
    if (p.hill) {
      hills.push({ from: d, to: d + len, y0: y, y1: y + p.hill });
      y += p.hill;
    }
    d += len;
  }
  const length = d;
  const obstacles = (track.things || []).filter((o) => SIZE[o.kind]).map((o) => ({ x: 0, ...SIZE[o.kind], ...o }));
  const lamps = [...(track.lamps || [])].sort((a, b) => a - b);
  const boards = bends.flatMap((b) => BOARDS.map((dist) => ({ kind: 'board', d: b.from - dist, dist, bend: b })));
  const out = { ...track, length, bends, hills, obstacles, lamps, boards, cues: track.cues || [] };

  out.segments = Array.from({ length: Math.ceil(length / SEG_LEN) + RUN_OFF }, (_, i) => {
    const at = i * SEG_LEN;
    const mid = at + SEG_LEN / 2;
    const b = bends.find((x) => mid >= x.from && mid < x.to);
    return { i, d: at, curve: b ? b.curve : 0, y: heightAt(out, at), things: [] };
  });
  const standing = [...(track.things || []).filter((o) => !SIZE[o.kind]), ...obstacles, ...lamps.map((l) => ({ kind: 'lamp', d: l })), ...boards];
  for (const o of standing) {
    if (o.d >= 0 && o.d < length) out.segments[Math.floor(o.d / SEG_LEN)].things.push(o);
  }
  return out;
}

// One strip per segment from the camera out. The road's middle is accumulated
// from the camera (`dx += curve`, `x += dx`), and the camera sits over `playerX`,
// so the car stays put on the screen and the road moves under it. A segment
// that would not rise above everything nearer is behind a crest: not visible.
export function project(track, camD, playerX = 0, { w = 960, h = 540, draw = CAM.draw } = {}) {
  const segs = track.segments;
  const focal = (CAM.depth * w) / 2;
  const horizon = h * CAM.horizon;
  const eye = heightAt(track, Math.max(0, camD)) + CAM.height;
  const first = Math.floor(camD / SEG_LEN);
  const part = camD / SEG_LEN - first;
  // (before the grid the road runs on as segment 0)
  const at = (i) => segs[Math.max(0, i)];
  let dx = -at(first).curve * CAM.curveDraw * part;
  let wx = 0; // the road's middle, in road widths
  let top = Infinity;
  const out = [];
  for (let n = 0; n <= draw; n++) {
    const i = first + n;
    if (i >= segs.length) break;
    const seg = at(i);
    const z = i * SEG_LEN - camD;
    if (z >= CAM.near) {
      const scale = focal / z; // px per metre
      const y = horizon - scale * (seg.y - eye);
      const visible = y < top;
      if (visible) top = y;
      out.push({ seg, z, x: w / 2 + scale * (wx - playerX) * ROAD_M, y, scale, halfW: scale * ROAD_M, visible });
    }
    wx += dx;
    dx += seg.curve * CAM.curveDraw;
  }
  return out;
}
