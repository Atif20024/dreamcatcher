// Rig.compose — the paper-doll compositor (character-motion skill §1).
//
// A rig is parts (small string grids: head, hat, torso, boots, hands) plus a
// skeleton whose limbs are drawn as shaded capsules, so a pose is a handful
// of numbers (hips, lean, foot targets, arm angles) instead of a hand-drawn
// grid. Pure JS: the atlas build runs it in Node; nothing here touches Phaser.
//
// Coordinates are 1× art pixels on a W×H work canvas, y down. The foot
// anchor (ax, ay) is the pixel boundary the soles stand on.
//
// Output of composeFrame: { body, hat, attach, contacts } where body/hat are
// letter grids (arrays of arrays; null = empty) ready for the palette.

const deg = (d) => (d * Math.PI) / 180;

export function grid(w, h) {
  return { w, h, px: new Array(w * h).fill(null), part: new Array(w * h).fill(null) };
}
const inside = (g, x, y) => x >= 0 && y >= 0 && x < g.w && y < g.h;
const get = (g, x, y) => (inside(g, x, y) ? g.px[y * g.w + x] : null);
const partAt = (g, x, y) => (inside(g, x, y) ? g.part[y * g.w + x] : null);
function put(g, x, y, ch, part) {
  if (!inside(g, x, y) || ch == null) return;
  g.px[y * g.w + x] = ch;
  g.part[y * g.w + x] = part;
}

// tone families: [highlight, base, shadow, deep]; letters are the palette
export function familyOf(rig, ch) {
  for (const [name, tones] of Object.entries(rig.families)) if (tones.includes(ch)) return name;
  return null;
}
const toneIdx = (rig, fam, ch) => rig.families[fam].indexOf(ch);
const tone = (rig, fam, i) => rig.families[fam][Math.max(0, Math.min(3, i))];

// stamp a string grid with its anchor (ox, oy) at (x, y); flip mirrors it
export function stamp(g, rows, x, y, ox, oy, part, opts = {}) {
  const { flip = false, darken = 0, rig = null, shearTop = 0 } = opts;
  const h = opts.shearRows || rows.length;
  rows.forEach((row, r) => {
    const shift = shearTop ? Math.round((shearTop * (h - 1 - r)) / Math.max(1, h - 1)) : 0;
    [...row].forEach((ch, c) => {
      if (ch === '.' || ch === ' ') return;
      const cc = flip ? row.length - 1 - c : c;
      let out = ch;
      if (darken && rig) {
        const fam = familyOf(rig, ch);
        if (fam) out = tone(rig, fam, toneIdx(rig, fam, ch) + darken);
      }
      put(g, x + cc - (flip ? row.length - 1 - ox : ox) + shift, y + r - oy, out, part);
    });
  });
}

// rotate a string grid by quarter turns (1 = 90° clockwise)
export function rotRows(rows, q) {
  let out = rows;
  for (let i = 0; i < ((q % 4) + 4) % 4; i++) {
    const h = out.length;
    const w = Math.max(...out.map((r) => r.length));
    const next = [];
    for (let x = 0; x < w; x++) {
      let line = '';
      for (let y = h - 1; y >= 0; y--) line += out[y][x] || '.';
      next.push(line);
    }
    out = next;
  }
  return out;
}

// A limb: a capsule from a to b with radius r, shaded as a lit cylinder
// (light from the top-left). `darken` pushes every tone one step (far limbs).
// `ring` draws a deep-tone separation line where it crosses same-family
// pixels already on the canvas (the skill's selective inner outline).
export function capsule(g, rig, a, b, r, fam, part, opts = {}) {
  const { darken = 0, ring = false, rim = false } = opts;
  const minX = Math.floor(Math.min(a[0], b[0]) - r - 1);
  const maxX = Math.ceil(Math.max(a[0], b[0]) + r + 1);
  const minY = Math.floor(Math.min(a[1], b[1]) - r - 1);
  const maxY = Math.ceil(Math.max(a[1], b[1]) + r + 1);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy || 1;
  const mask = [];
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / L2));
      const cx = a[0] + dx * t;
      const cy = a[1] + dy * t;
      const ox = px - cx;
      const oy = py - cy;
      const d = Math.hypot(ox, oy);
      if (d <= r) mask.push([x, y, ox, oy, d]);
    }
  const inMask = new Set(mask.map(([x, y]) => `${x},${y}`));
  if (ring) {
    for (const [x, y] of mask)
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (inMask.has(`${nx},${ny}`)) continue;
        const cur = get(g, nx, ny);
        if (cur && familyOf(rig, cur) === fam && partAt(g, nx, ny) !== part) put(g, nx, ny, tone(rig, fam, 3), partAt(g, nx, ny));
      }
  }
  for (const [x, y, ox, oy] of mask) {
    // the edge facing the light (up-left) is lit, the far edge in shade
    const lit = (-ox - oy) / Math.SQRT2;
    let t = 1;
    if (lit > r * 0.45) t = 0;
    else if (lit < -r * 0.3) t = 2;
    if (rim && ox > r * 0.5) t = 0; // rim light on the leading edge
    put(g, x, y, tone(rig, fam, t + darken), part);
  }
}

// two-bone IK: knee/elbow position for a joint chain root→end with lengths
// l1, l2; `bendSign` picks which side the joint goes (+1 = toward +x)
export function ik(root, end, l1, l2, bendSign = 1) {
  const dx = end[0] - root[0];
  const dy = end[1] - root[1];
  let d = Math.hypot(dx, dy);
  const L = l1 + l2;
  if (d >= L - 1.2) {
    // straight (a little stretch keeps a planted foot on the ground)
    const k = l1 / L;
    return { mid: [root[0] + dx * k, root[1] + dy * k], end, straight: true };
  }
  d = Math.max(d, Math.abs(l1 - l2) + 0.01);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / d;
  const uy = dy / d;
  const mx = root[0] + ux * a;
  const my = root[1] + uy * a;
  // perpendicular; choose the one whose x sign matches bendSign
  let px = -uy;
  let py = ux;
  if (Math.sign(px || 1) !== Math.sign(bendSign)) {
    px = -px;
    py = -py;
  }
  return { mid: [mx + px * h, my + py * h], end, straight: false };
}

// forward kinematics for an arm: angle from straight down (+ = forward),
// bend of the forearm relative to the upper arm (+ = further forward/up)
export function fk(root, a, bend, l1, l2) {
  const mid = [root[0] + Math.sin(deg(a)) * l1, root[1] + Math.cos(deg(a)) * l1];
  const a2 = a + bend;
  const end = [mid[0] + Math.sin(deg(a2)) * l2, mid[1] + Math.cos(deg(a2)) * l2];
  return { mid, end };
}

// the outline: every empty pixel touching the figure gets the outline letter
export function outline(g, letter = 'k') {
  const add = [];
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      if (get(g, x, y)) continue;
      if (get(g, x - 1, y) || get(g, x + 1, y) || get(g, x, y - 1) || get(g, x, y + 1)) add.push([x, y]);
    }
  for (const [x, y] of add) put(g, x, y, letter, 'outline');
  return g;
}

// rotate a whole composed grid about a pivot by an angle (nearest neighbour;
// used for the few lying/tumbling frames: a fall, a KO, a float tumble)
export function rotateGrid(g, angleDeg, cx, cy) {
  if (!angleDeg) return g;
  const out = grid(g.w, g.h);
  const c = Math.cos(deg(-angleDeg));
  const s = Math.sin(deg(-angleDeg));
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      const rx = x + 0.5 - cx;
      const ry = y + 0.5 - cy;
      const sx = Math.floor(cx + rx * c - ry * s);
      const sy = Math.floor(cy + rx * s + ry * c);
      const v = get(g, sx, sy);
      if (v) put(out, x, y, v, partAt(g, sx, sy));
    }
  return out;
}

export function translateGrid(g, dx, dy) {
  if (!dx && !dy) return g;
  const out = grid(g.w, g.h);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.px[y * g.w + x]) put(out, x + dx, y + dy, g.px[y * g.w + x], g.part[y * g.w + x]);
  return out;
}

// letter grid → rows of strings (for tests and review)
export function toRows(g) {
  const rows = [];
  for (let y = 0; y < g.h; y++) {
    let s = '';
    for (let x = 0; x < g.w; x++) s += g.px[y * g.w + x] || '.';
    rows.push(s);
  }
  return rows;
}
