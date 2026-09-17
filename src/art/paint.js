import Phaser from 'phaser';

// The painting toolkit. Everything in the world used to be drawn from
// primitives — a cloud was five ellipses, a tree a rectangle with circles on
// it. These helpers paint onto a 2D canvas the way a brush would: soft
// stamps, layered noise, a lit side and a shadow side, grain over the top.
// The result becomes a Phaser texture like any other, so nothing downstream
// changes; a hand-painted PNG can replace any of them (see overrides.js).

// ---- colour ---------------------------------------------------------------------
export const hex = (c) => `#${(c >>> 0).toString(16).padStart(6, '0')}`;
export const rgba = (c, a) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

export function mix(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t;
  const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t;
  const bl = (a & 255) + ((b & 255) - (a & 255)) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}
// darken (k < 1) or lighten (k > 1) toward white
export function shade(c, k) {
  if (k <= 1) return mix(c, 0x000000, 1 - k);
  return mix(c, 0xffffff, Math.min(1, k - 1));
}
// shift hue/saturation/lightness by deltas (h in turns, s/l in 0..1)
export function hsl(c, dh = 0, ds = 0, dl = 0) {
  const col = Phaser.Display.Color.IntegerToColor(c);
  const h = (col.h + dh + 1) % 1;
  const s = Phaser.Math.Clamp(col.s + ds, 0, 1);
  const l = Phaser.Math.Clamp(col.v * (1 - col.s / 2) + dl, 0, 1);
  // HSV -> HSL is lossy enough here; go through HSV with an adjusted value
  const v = Phaser.Math.Clamp(col.v + dl, 0, 1);
  const out = Phaser.Display.Color.HSVToRGB(h, s, v);
  void l;
  return Phaser.Display.Color.GetColor(out.r, out.g, out.b);
}

// ---- noise ----------------------------------------------------------------------
// deterministic hash noise: same seed, same picture, every boot
function hash(x, y, seed) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (seed | 0) * 1274126177;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}
const smooth = (t) => t * t * (3 - 2 * t);

export function noise2(x, y, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

// fractal noise, 0..1
export function fbm(x, y, seed = 0, octaves = 4, lac = 2, gain = 0.5) {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    v += noise2(x * f, y * f, seed + i * 31) * amp;
    norm += amp;
    amp *= gain;
    f *= lac;
  }
  return v / norm;
}

// noise that tiles horizontally with period `W` (in the same units as x)
export function fbmTiled(x, y, W, seed = 0, octaves = 4) {
  const t = (x % W + W) % W;
  const k = t / W;
  const a = fbm(t, y, seed, octaves);
  const b = fbm(t - W, y, seed, octaves);
  // blend the two ends across the whole width so there is no seam anywhere
  return a * (1 - k) + b * k;
}

// ---- brushes ----------------------------------------------------------------------
// a soft round stamp: solid in the middle, fading to nothing at r
export function stamp(ctx, x, y, r, color, alpha = 1, soft = 0.55) {
  const g = ctx.createRadialGradient(x, y, r * (1 - soft), x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// an elliptical dab, rotated: the mark of a flat brush
export function dab(ctx, x, y, rx, ry, angle, color, alpha = 1, soft = 0.4) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const g = ctx.createRadialGradient(0, 0, Math.max(0.5, rx * (1 - soft)), 0, 0, rx);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.scale(1, ry / rx);
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// a hard-edged leaf-cluster: a rough blob with a little grain at the rim
export function clump(ctx, x, y, r, color, alpha, rand, lobes = 5) {
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  for (let i = 0; i <= lobes * 4; i++) {
    const a = (i / (lobes * 4)) * Math.PI * 2;
    const rr = r * (0.75 + 0.25 * Math.sin(a * lobes + rand.frac() * 0.6) + rand.frac() * 0.12);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// a vertical gradient fill: stops = [[t, color], ...]
export function gradientV(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  for (const [t, c, a] of stops) g.addColorStop(t, a === undefined ? hex(c) : rgba(c, a));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// paper grain over a region: multiplies by fine noise so nothing reads flat
export function grain(ctx, x, y, w, h, amount = 0.08, seed = 7, scale = 1) {
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const k = (j * w + i) * 4;
      if (d[k + 3] === 0) continue;
      const n = (hash(i * scale, j * scale, seed) - 0.5) * 2 * amount;
      const m = 1 + n;
      d[k] = Math.max(0, Math.min(255, d[k] * m));
      d[k + 1] = Math.max(0, Math.min(255, d[k + 1] * m));
      d[k + 2] = Math.max(0, Math.min(255, d[k + 2] * m));
    }
  }
  ctx.putImageData(img, x, y);
}

// a slow colour wash driven by low-frequency noise: the "hand" in a wall
export function wash(ctx, x, y, w, h, colA, colB, amount = 0.25, seed = 3, scale = 0.02) {
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  const ar = (colA >> 16) & 255, ag = (colA >> 8) & 255, ab = colA & 255;
  const br = (colB >> 16) & 255, bg = (colB >> 8) & 255, bb = colB & 255;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const k = (j * w + i) * 4;
      if (d[k + 3] === 0) continue;
      const n = fbm(i * scale, j * scale, seed, 3);
      const t = amount * (n - 0.5) * 2;
      d[k] = Math.max(0, Math.min(255, d[k] + (t > 0 ? (br - d[k]) * t : (ar - d[k]) * -t)));
      d[k + 1] = Math.max(0, Math.min(255, d[k + 1] + (t > 0 ? (bg - d[k + 1]) * t : (ag - d[k + 1]) * -t)));
      d[k + 2] = Math.max(0, Math.min(255, d[k + 2] + (t > 0 ? (bb - d[k + 2]) * t : (ab - d[k + 2]) * -t)));
    }
  }
  ctx.putImageData(img, x, y);
}

// ---- things ---------------------------------------------------------------------
// A canopy: many leaf clusters, dark ones first, lit ones last, the light
// coming from `lightDir` (-1 = the left / west). Returns nothing; paints.
export function foliage(ctx, cx, cy, rx, ry, base, rand, { lightDir = -1, density = 1, seed = 0 } = {}) {
  const deep = shade(hsl(base, 0.04, 0.08, 0), 0.42);
  const mid = shade(base, 0.8);
  const lit = shade(hsl(base, -0.02, 0, 0), 1.2);
  const rim = mix(lit, 0xffe8a0, 0.35);
  const n = Math.round(rx * ry * 0.02 * density) + 50;
  const pts = [];
  for (let i = 0; i < n; i++) {
    // fill the ellipse more toward the middle
    const a = rand.frac() * Math.PI * 2;
    const r = Math.sqrt(rand.frac());
    pts.push({ x: cx + Math.cos(a) * r * rx, y: cy + Math.sin(a) * r * ry, r: rand.realInRange(rx * 0.1, rx * 0.22) });
  }
  // shadow mass
  for (const p of pts) clump(ctx, p.x + 2, p.y + 3, p.r * 1.05, deep, 0.9, rand);
  // mid tone, with a little colour drift
  for (const p of pts) {
    const t = (p.x - cx) / rx; // -1 west .. 1 east
    const k = lightDir < 0 ? -t : t;
    clump(ctx, p.x, p.y, p.r, mix(mid, lit, 0.5 + k * 0.4 - (p.y - cy) / ry * 0.25), 0.95, rand);
  }
  // lit clusters on the sun side and the top
  for (const p of pts) {
    const t = (p.x - cx) / rx;
    const up = -(p.y - cy) / ry;
    const k = (lightDir < 0 ? -t : t) * 0.6 + up * 0.5;
    if (k > 0.2 && rand.frac() < 0.6) clump(ctx, p.x + lightDir * 2, p.y - 2, p.r * 0.6, mix(lit, rim, Math.min(1, (k - 0.2) * 1.2)), 0.8, rand, 4);
    else if (k < -0.35 && rand.frac() < 0.5) clump(ctx, p.x - lightDir * 2, p.y + 2, p.r * 0.6, deep, 0.7, rand, 4);
  }
  // a few sky holes: tiny gaps of nothing near the edge
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < n / 8; i++) {
    const a = rand.frac() * Math.PI * 2;
    const r = 0.7 + rand.frac() * 0.3;
    stamp(ctx, cx + Math.cos(a) * r * rx, cy + Math.sin(a) * r * ry, rand.realInRange(2, 5), 0x000000, 0.9, 0.8);
  }
  ctx.restore();
  void seed;
}

// A trunk: a tapered column with bark strokes, lit on the sun side
export function trunk(ctx, x, yTop, yBot, wTop, wBot, base, rand, lightDir = -1) {
  const dark = shade(base, 0.6);
  const lit = shade(base, 1.3);
  ctx.beginPath();
  ctx.moveTo(x - wTop / 2, yTop);
  ctx.lineTo(x + wTop / 2, yTop);
  ctx.lineTo(x + wBot / 2 + 2, yBot);
  ctx.lineTo(x - wBot / 2 - 2, yBot);
  ctx.closePath();
  const g = ctx.createLinearGradient(x - wBot / 2, 0, x + wBot / 2, 0);
  if (lightDir < 0) {
    g.addColorStop(0, hex(lit));
    g.addColorStop(0.45, hex(base));
    g.addColorStop(1, hex(dark));
  } else {
    g.addColorStop(0, hex(dark));
    g.addColorStop(0.55, hex(base));
    g.addColorStop(1, hex(lit));
  }
  ctx.fillStyle = g;
  ctx.fill();
  // bark: short vertical strokes
  const h = yBot - yTop;
  for (let i = 0; i < h / 3; i++) {
    const t = rand.frac();
    const y = yTop + t * h;
    const w = wTop + (wBot - wTop) * t;
    const bx = x + (rand.frac() - 0.5) * w * 0.9;
    ctx.fillStyle = rgba(rand.frac() < 0.5 ? dark : lit, 0.35);
    ctx.fillRect(bx, y, 1, rand.between(3, 9));
  }
}

// ---- canvas -> texture ------------------------------------------------------------------
// Paint into a fresh canvas texture. painter(ctx, w, h, rand). Skips the work
// when an override PNG with the same key has already been loaded.
export function paintTexture(scene, key, w, h, painter, seed = key) {
  if (scene.textures.exists(key)) {
    const src = scene.textures.get(key).getSourceImage();
    // a loaded PNG (an override) is an HTMLImageElement; our own canvases are
    // regenerated so a hot reload picks up changes
    if (src && src.tagName === 'IMG') return key;
    scene.textures.remove(key);
  }
  const ct = scene.textures.createCanvas(key, w, h);
  const ctx = ct.getContext();
  ctx.imageSmoothingEnabled = true;
  painter(ctx, w, h, new Phaser.Math.RandomDataGenerator([String(seed)]));
  ct.refresh();
  return key;
}
