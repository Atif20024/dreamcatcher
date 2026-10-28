// The tree kit (round 2 WP4): every tree in the game at its real height.
//
// The owner: "trees are about the same height as Jo, which is impossible".
// A street tree is 6–12 m and a plane, pine or cypress 15–25 m; at 1 m = 44 px
// (src/data/scale.js) that is 260–1100 px on the play plane. So a tree on the
// play plane is painted whole at real height and the camera crops it; a tree
// on a backdrop layer at scroll factor s is painted at m × 44 × s (the depth
// rule, critique §7.1.2). Sizes come from TREE_SPECS; nothing here is in px.
//
// drawTree(ctx, x, groundY, kind, s, rand, opts) paints onto any canvas (the
// backdrop bands use it); paintTreeTexture(scene, key, kind, opts) makes a
// texture whose bottom centre is the foot of the trunk.
import { TREE_SPECS, treePx, PX_PER_M } from '../data/scale.js';
import { foliage, trunk, dab, stamp, mix, shade, hex, rgba, paintTexture } from './paint.js';

// palettes per kind (leaf base, trunk, bark highlight)
const PAL = {
  plane: { leaf: 0x6a9446, trunk: 0x8a8468, bark: 0xd8d0b0 },
  street: { leaf: 0x5a8a44, trunk: 0x5a4430 },
  hill: { leaf: 0x5a8a44, trunk: 0x4e3824 },
  apple: { leaf: 0x6a9a48, trunk: 0x5a4028 },
  olive: { leaf: 0x8a9a6a, trunk: 0x6a5a48 },
  grey: { leaf: 0x6a7080, trunk: 0x5a5560 },
  pine: { leaf: 0x2e5a44, trunk: 0x4a3222 },
  cypress: { leaf: 0x2e5a3a, trunk: 0x4a3424 },
};

// a forked bough: a tapered stroke from (x0,y0) to (x1,y1)
function bough(ctx, x0, y0, x1, y1, w0, w1, col) {
  const nx = -(y1 - y0);
  const ny = x1 - x0;
  const L = Math.hypot(nx, ny) || 1;
  const ux = nx / L;
  const uy = ny / L;
  ctx.fillStyle = hex(col);
  ctx.beginPath();
  ctx.moveTo(x0 + (ux * w0) / 2, y0 + (uy * w0) / 2);
  ctx.lineTo(x1 + (ux * w1) / 2, y1 + (uy * w1) / 2);
  ctx.lineTo(x1 - (ux * w1) / 2, y1 - (uy * w1) / 2);
  ctx.lineTo(x0 - (ux * w0) / 2, y0 - (uy * w0) / 2);
  ctx.closePath();
  ctx.fill();
  // the lit west edge of the limb
  ctx.fillStyle = rgba(shade(col, 1.35), 0.6);
  ctx.beginPath();
  ctx.moveTo(x0 - (ux * w0) / 2, y0 - (uy * w0) / 2);
  ctx.lineTo(x1 - (ux * w1) / 2, y1 - (uy * w1) / 2);
  ctx.lineTo(x1 - (ux * w1) / 6, y1 - (uy * w1) / 6);
  ctx.lineTo(x0 - (ux * w0) / 6, y0 - (uy * w0) / 6);
  ctx.closePath();
  ctx.fill();
}

// broadleaf: trunk, boughs into the crown, the crown as several lobes
function broadleaf(ctx, x, gy, h, k, spec, pal, rand, o) {
  const cw = spec.crown[0] * h;
  const ch = spec.crown[1] * h;
  const crownTop = gy - h;
  const crownMid = crownTop + ch * 0.5;
  const crownBase = crownTop + ch;
  const tw = Math.max(1.5, spec.trunk * k);
  const fork = crownBase + (gy - crownBase) * 0.05;
  // ground shadow at the foot
  dab(ctx, x + tw * 0.4, gy - 1, tw * 2.4, Math.max(1, tw * 0.35), 0, 0x1e1810, 0.35, 0.6);
  // the trunk, flared at the root
  trunk(ctx, x, fork, gy, tw * 0.8, tw, pal.trunk, rand);
  if (tw > 4) {
    ctx.fillStyle = hex(shade(pal.trunk, 0.8));
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.9, gy);
    ctx.quadraticCurveTo(x - tw * 0.5, gy - tw * 0.6, x - tw * 0.4, gy - tw * 1.4);
    ctx.lineTo(x + tw * 0.45, gy - tw * 1.4);
    ctx.quadraticCurveTo(x + tw * 0.55, gy - tw * 0.6, x + tw, gy);
    ctx.closePath();
    ctx.fill();
  }
  // plane bark: pale patches where the old bark has flaked off
  if (pal.bark) {
    for (let i = 0; i < (gy - fork) / Math.max(2, tw * 0.5); i++) {
      const yy = fork + rand.frac() * (gy - fork);
      stamp(ctx, x + (rand.frac() - 0.6) * tw * 0.7, yy, rand.realInRange(tw * 0.12, tw * 0.28), rand.frac() < 0.6 ? pal.bark : 0x9aa070, 0.75, 0.3);
    }
  }
  // boughs: two to four limbs from the fork up into the crown
  const limbs = o.bare ? 6 : Math.max(2, Math.round(cw / (ch * 0.45)));
  for (let i = 0; i < limbs; i++) {
    const t = limbs === 1 ? 0.5 : i / (limbs - 1);
    const ex = x + (t - 0.5) * cw * 0.8 + (rand.frac() - 0.5) * cw * 0.1;
    const ey = crownMid - ch * (0.1 + rand.frac() * 0.3);
    bough(ctx, x + (t - 0.5) * tw * 0.5, fork + tw * 0.4, ex, ey, tw * 0.55, Math.max(1, tw * 0.15), shade(pal.trunk, 0.92));
    if (o.bare) {
      // twigs: the grey tree has more branch than leaf
      for (let j = 0; j < 4; j++) {
        const sx = x + (ex - x) * (0.4 + j * 0.15);
        const sy = fork + (ey - fork) * (0.4 + j * 0.15);
        bough(ctx, sx, sy, sx + (rand.frac() - 0.5) * cw * 0.3, sy - ch * (0.08 + rand.frac() * 0.12), Math.max(1, tw * 0.18), 0.8, shade(pal.trunk, 0.9));
      }
    }
  }
  // shadow cast by the crown on the upper trunk
  ctx.fillStyle = rgba(0x1e1810, 0.35);
  ctx.fillRect(x - tw * 0.45, fork - 1, tw * 0.9, Math.max(2, (gy - fork) * 0.18));
  // the crown: lobes laid out over an ellipse, back ones first
  const lobes = Math.max(1, Math.round(cw / Math.max(10, ch * 0.42)) + 2);
  const rx = cw / Math.max(2, lobes - 0.8);
  const density = (o.density || 1) * (o.bare ? 0.35 : 1);
  const centres = [];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + rand.frac() * 0.5;
    centres.push({ x: x + Math.cos(a) * (cw / 2 - rx * 0.75), y: crownMid + Math.sin(a) * (ch / 2 - rx * 0.6) * 0.8 });
  }
  centres.sort((a, b) => a.y - b.y);
  for (const c of centres) foliage(ctx, c.x, c.y, rx, rx * 0.82, pal.leaf, rand, { density });
  // the middle and the lit crown
  foliage(ctx, x, crownMid, cw * 0.36, ch * 0.34, pal.leaf, rand, { density });
  foliage(ctx, x - cw * 0.06, crownTop + ch * 0.28, cw * 0.28, ch * 0.24, shade(pal.leaf, 1.08), rand, { density });
  // fruit, if any (painted into the crown, not separate images)
  if (o.fruit) {
    for (let i = 0; i < o.fruit; i++) {
      const fx = x + (rand.frac() - 0.5) * cw * 0.8;
      const fy = crownTop + ch * (0.35 + rand.frac() * 0.55);
      const r = Math.max(1, 0.05 * k);
      stamp(ctx, fx, fy, r * 1.4, 0xb8302a, 1, 0.25);
      stamp(ctx, fx - r * 0.4, fy - r * 0.4, r * 0.5, 0xf2a080, 0.9, 0.4);
    }
  }
}

// a spruce/pine: a straight stem and drooping tiers, widest at the foot
function conifer(ctx, x, gy, h, k, spec, pal, rand, o) {
  const tw = Math.max(1, spec.trunk * k);
  const cw = spec.crown[0] * h;
  const crownBase = gy - h * (1 - spec.crown[1]) * 0.6;
  dab(ctx, x + tw, gy - 1, cw * 0.5, Math.max(1, tw * 0.4), 0, 0x1e1810, 0.3, 0.6);
  trunk(ctx, x, gy - h * 0.9, gy, tw * 0.3, tw, pal.trunk, rand);
  const base = pal.leaf;
  const deep = shade(base, 0.5);
  const lit = mix(shade(base, 1.35), 0xd8e8b0, 0.2);
  const tiers = Math.max(4, Math.round(h / Math.max(6, 0.9 * k)));
  const top = gy - h;
  for (let t = 0; t < tiers; t++) {
    const u = (t + 1) / tiers; // 0 at the tip .. 1 at the foot
    const y = top + u * (crownBase - top);
    const half = Math.max(1.5, (cw / 2) * Math.pow(u, 0.9) * (0.85 + rand.frac() * 0.25));
    const droop = Math.max(1, half * 0.28);
    const n = Math.max(3, Math.round(half / Math.max(1.2, 0.18 * k)));
    for (let i = 0; i <= n; i++) {
      const v = i / n;
      const bx = x - half + v * half * 2;
      const by = y + Math.abs(v - 0.5) * 2 * droop;
      dab(ctx, bx + 1, by + droop * 0.6, Math.max(1.2, half / n * 2.4), Math.max(1, droop * 0.9), (v - 0.5) * 0.5, deep, 0.95, 0.3);
    }
    for (let i = 0; i <= n; i++) {
      const v = i / n;
      const bx = x - half + v * half * 2;
      const by = y + Math.abs(v - 0.5) * 2 * droop - droop * 0.3;
      dab(ctx, bx, by, Math.max(1, half / n * 2), Math.max(0.8, droop * 0.7), (v - 0.5) * 0.5, mix(lit, base, Math.min(1, v * 1.4)), 0.95, 0.3);
    }
    if (o.snow) {
      // snow lies along the top of each tier, thickest on the sunlit west
      // half and in drifts where the boughs dip
      for (let i = 0; i < 4; i++) {
        const v = 0.15 + rand.frac() * 0.7;
        const sx = x - half + v * half * 2;
        const sy = y + Math.abs(v - 0.5) * 2 * droop - droop * 0.75;
        dab(ctx, sx, sy, Math.max(1.5, half * (0.18 + rand.frac() * 0.2)), Math.max(0.7, droop * 0.28), (v - 0.5) * 0.6, v < 0.55 ? 0xf6f8ff : 0xc8d2e6, 0.9, 0.45);
      }
    }
  }
  dab(ctx, x, top + 2, Math.max(1, cw * 0.04), Math.max(2, h * 0.02), 0, lit, 1, 0.3);
  if (o.snow) dab(ctx, x, top + 3, Math.max(1, cw * 0.035), Math.max(1.5, h * 0.012), 0, 0xf6f8ff, 1, 0.3);
}

// a cypress: a dark flame, the strokes running up it
function cypress(ctx, x, gy, h, k, spec, pal, rand) {
  const tw = Math.max(1, spec.trunk * k);
  const cw = spec.crown[0] * h;
  const top = gy - h;
  const foot = gy - h * (1 - spec.crown[1]);
  dab(ctx, x + tw, gy - 1, cw * 0.6, Math.max(1, tw * 0.4), 0, 0x1e1810, 0.3, 0.6);
  trunk(ctx, x, foot - 4, gy, tw * 0.7, tw, pal.trunk, rand);
  const widthAt = (u) => (cw / 2) * Math.sin(Math.PI * Math.pow(u, 0.75)) * (u < 0.15 ? u / 0.15 : 1);
  const base = pal.leaf;
  const deep = shade(base, 0.5);
  const lit = mix(shade(base, 1.4), 0xe8e0a0, 0.18);
  const n = Math.round(h * cw * 0.02) + 80;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < n; i++) {
      const u = rand.frac();
      const y = top + u * (foot - top);
      const half = widthAt(u);
      const v = rand.frac() * 2 - 1;
      const px = x + v * half;
      const col = pass === 0 ? deep : pass === 1 ? mix(base, lit, Math.max(0, -v) * 0.5) : lit;
      if (pass === 2 && (v > -0.3 || rand.frac() < 0.5)) continue;
      // flame strokes: tall, thin, leaning in toward the spine at the top
      dab(ctx, px, y, Math.max(1.2, 0.09 * k), Math.max(2, 0.4 * k), -v * 0.35, col, 0.95, 0.35);
    }
  }
}

export function drawTree(ctx, x, gy, kind, s = 1, rand, o = {}) {
  const spec = TREE_SPECS[kind] || TREE_SPECS.street;
  const k = PX_PER_M * s;
  const h = (o.m || spec.m) * k;
  const pal = { ...(PAL[kind] || PAL.street), ...(o.pal || {}) };
  if (kind === 'pine') conifer(ctx, x, gy, h, k, spec, pal, rand, o);
  else if (kind === 'cypress') cypress(ctx, x, gy, h, k, spec, pal, rand);
  else broadleaf(ctx, x, gy, h, k, spec, pal, rand, { bare: kind === 'grey', ...o });
}

// a play-plane (or backdrop) tree texture; the foot of the trunk is the
// bottom centre. Returns the key.
export function paintTreeTexture(scene, key, kind, o = {}) {
  const s = o.s || 1;
  const { w, h } = treePx(kind, s, o.m);
  return paintTexture(scene, key, w, h + 2, (ctx, W, H, rand) => drawTree(ctx, W / 2, H - 1, kind, s, rand, o), o.seed || key);
}

// the measured drawn height of a tree texture (the lint's runtime check)
export function treeHeightPx(kind, s = 1, m = null) {
  return treePx(kind, s, m).h;
}

// little trees for a primitive-drawn backdrop prop (parallax scenery): a
// texture per kind and scroll factor, cached
export function backdropTreeKey(scene, kind, s, variant = 0) {
  const key = `tree_${kind}_${Math.round(s * 100)}_${variant}`;
  if (!scene.textures.exists(key)) paintTreeTexture(scene, key, kind, { s, seed: key, m: TREE_SPECS[kind].m * (0.85 + variant * 0.15) });
  return key;
}
