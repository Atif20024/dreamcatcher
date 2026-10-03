import Phaser from 'phaser';
import { paintTexture, gradientV, grain, wash, stamp, mix, shade, hex, rgba, fbm } from './paint.js';
import { TOP, RIGHT, BOTTOM, LEFT } from '../builders/autotile.js';

// The design pattern from THE LONG EVENING, for every level: nothing is a
// flat fill. Ground is painted stone with courses, a lit lip and weight in
// its lower half; backdrops get a wash, grain and a light direction; props
// stand in that light. The palette stays the theme's own — this changes how
// a colour is laid down, not which colour.

const LINEAR = Phaser.Textures.FilterMode.LINEAR;

// ---- ground ------------------------------------------------------------------------
// Paints `${key}_s_<mask>_<wear>`, `_ow_<v>` and `_sl_<role>_<w>` from a
// theme's palette, in place of the gridded autotiles (which skip any key
// that already exists). `theme.material`: 'stone' (default, courses),
// 'plate' (metal seams and rivets), 'tile' (small square tiles).
export function paintTileset(scene, theme) {
  const key = theme.key;
  const pal = theme.palette;
  const t = theme.tiles;
  const fill = pal[t.fill];
  const dark = pal[t.dark];
  const lipLit = pal[t.lipLight];
  const lip = pal[t.lipDark];
  const edge = pal[t.edge];
  const deco = pal[t.deco];
  // what the ground is made of, per level: cream stone in the station,
  // kitchen tiles, the club's brick and boards, the programme's steel plate
  const MATERIALS = { hub: 'stone', chef: 'tile', mus: 'stone', astro: 'plate', wr: 'board', pt: 'stroke', gm: 'carpet' };
  const material = theme.material || MATERIALS[key] || 'stone';
  const T = 32;

  const body = (ctx, wear, seed) => {
    ctx.fillStyle = hex(fill);
    ctx.fillRect(0, 0, T, T);
    const img = ctx.getImageData(0, 0, T, T);
    const d = img.data;
    const sc = material === 'tile' ? 5 : material === 'plate' ? 14 : material === 'board' ? 4 : 9;
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        const n = fbm(x / sc + wear * 5, y / sc + seed, 21 + wear, 3);
        const m = material === 'plate' ? 0.94 + n * 0.12 : 0.9 + n * 0.2;
        const k = (y * T + x) * 4;
        d[k] = Math.min(255, d[k] * m);
        d[k + 1] = Math.min(255, d[k + 1] * (m - 0.01));
        d[k + 2] = Math.min(255, d[k + 2] * (m - 0.03));
      }
    }
    ctx.putImageData(img, 0, 0);
    if (material === 'stone') {
      // two courses per tile, joints staggered, one block a touch lighter
      const jointA = 15 + ((wear * 3 + seed) % 3);
      ctx.fillStyle = rgba(dark, 0.55);
      ctx.fillRect(0, jointA, T, 1);
      ctx.fillStyle = rgba(lipLit, 0.3);
      ctx.fillRect(0, jointA + 1, T, 1);
      for (const [y0, y1, off] of [[0, jointA, (seed * 7 + wear * 11) % 20 + 6], [jointA + 1, T, (seed * 13 + wear * 5) % 20 + 6]]) {
        ctx.fillStyle = rgba(dark, 0.5);
        ctx.fillRect(off, y0, 1, y1 - y0);
        ctx.fillStyle = rgba(lipLit, 0.28);
        ctx.fillRect(off + 1, y0, 1, y1 - y0);
        ctx.fillStyle = rgba((seed + wear) % 2 ? lipLit : dark, 0.07);
        ctx.fillRect(0, y0, off, y1 - y0);
      }
    } else if (material === 'board') {
      // floorboards: three planks a tile, the grain running along them, a
      // nail head or two, and a board that is a shade different
      for (const y0 of [0, 11, 22]) {
        ctx.fillStyle = rgba(dark, 0.55);
        ctx.fillRect(0, y0, T, 1);
        ctx.fillStyle = rgba(lipLit, 0.22);
        ctx.fillRect(0, y0 + 1, T, 1);
        const shade = ((y0 / 11 + wear + seed) % 3) - 1;
        ctx.fillStyle = rgba(shade > 0 ? lipLit : dark, 0.06);
        ctx.fillRect(0, y0 + 2, T, 9);
        const joint = (seed * 7 + wear * 5 + y0) % 30 + 1;
        ctx.fillStyle = rgba(dark, 0.5);
        ctx.fillRect(joint, y0 + 1, 1, 10);
        stamp(ctx, (joint + 6) % T, y0 + 6, 1, dark, 0.5, 0.5);
      }
    } else if (material === 'carpet') {
      // THE LAST HAND: red carpet with a gold pattern — a soft pile (no
      // joints), a diamond lattice in the deco colour, a fleur at each
      // crossing, and the pile worn a shade paler where feet go
      ctx.fillStyle = rgba(deco, 0.35);
      for (let i = -T; i < T * 2; i += 16) {
        for (let k = 0; k < T; k++) {
          ctx.fillRect((i + k + T) % T, k, 1, 1);
          ctx.fillRect((i - k + T * 2) % T, k, 1, 1);
        }
      }
      ctx.fillStyle = rgba(lipLit, 0.55);
      for (const [x, y] of [[8, 8], [24, 8], [8, 24], [24, 24], [16, 16], [0, 16], [16, 0]]) {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
      ctx.fillStyle = rgba(lipLit, 0.05 + (wear % 3) * 0.03);
      ctx.fillRect(0, 0, T, 10);
    } else if (material === 'stroke') {
      // THE YELLOW HOUSE §5.1: a tile is six to eight visible brushstrokes
      // with direction (up-right, like wheat), each with a ridge — a lighter
      // line on its lit edge and a darker one under it. Impasto.
      const n = 6 + ((wear + seed) % 3);
      for (let i = 0; i < n; i++) {
        const x0 = ((i * 11 + seed * 5 + wear * 3) % 30) - 2;
        const y0 = ((i * 17 + seed * 7 + wear * 11) % 30) + 2;
        const len = 10 + ((i + seed) % 3) * 4;
        const dx = 0.82, dy = -0.57; // up-right
        const col = i % 3 === 0 ? lipLit : i % 3 === 1 ? fill : deco;
        ctx.strokeStyle = rgba(col, 0.75);
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + dx * len, y0 + dy * len);
        ctx.stroke();
        // the ridge: lit above, shadow below
        ctx.strokeStyle = rgba(mix(col, 0xffffff, 0.45), 0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0 - 1, y0 - 2);
        ctx.lineTo(x0 + dx * len - 1, y0 + dy * len - 2);
        ctx.stroke();
        ctx.strokeStyle = rgba(mix(dark, 0x5b3a7a, 0.5), 0.6);
        ctx.beginPath();
        ctx.moveTo(x0 + 1, y0 + 2);
        ctx.lineTo(x0 + dx * len + 1, y0 + dy * len + 2);
        ctx.stroke();
      }
    } else if (material === 'plate') {
      // a seam and four rivets
      ctx.fillStyle = rgba(dark, 0.6);
      ctx.fillRect(0, 15, T, 1);
      ctx.fillStyle = rgba(lipLit, 0.25);
      ctx.fillRect(0, 16, T, 1);
      for (const [x, y] of [[4, 4], [27, 4], [4, 27], [27, 27]]) {
        stamp(ctx, x, y, 2, dark, 0.6, 0.5);
        stamp(ctx, x - 0.5, y - 0.5, 1, lipLit, 0.5, 0.5);
      }
    } else {
      // small tiles with grout
      ctx.fillStyle = rgba(dark, 0.5);
      for (let y = 0; y < T; y += 8) ctx.fillRect(0, y, T, 1);
      for (let x = 0; x < T; x += 8) ctx.fillRect(x, 0, 1, T);
      ctx.fillStyle = rgba(lipLit, 0.14);
      for (let y = 1; y < T; y += 8) ctx.fillRect(0, y, T, 1);
    }
    // a couple of marks
    for (let i = 0; i < 2; i++) {
      const x = ((i * 11 + wear * 7 + seed * 3) % 28) + 2;
      const y = ((i * 17 + wear * 5 + seed) % 26) + 4;
      stamp(ctx, x, y, 2, i % 2 ? dark : deco, 0.3, 0.7);
    }
    grain(ctx, 0, 0, T, T, 0.06, 31 + wear + seed, 1);
  };

  for (let mask = 0; mask < 16; mask++) {
    for (let w = 0; w < 3; w++) {
      paintTexture(scene, `${key}_s_${mask}_${w}`, T, T, (ctx) => {
        body(ctx, w, mask);
        const top = !(mask & TOP);
        if (top) {
          gradientV(ctx, 0, 0, T, 7, [[0, lipLit, 1], [0.5, lip, 0.75], [1, lip, 0]]);
          ctx.fillStyle = rgba(mix(lipLit, 0xffffff, 0.4), 0.9);
          ctx.fillRect(0, 0, T, 1);
          ctx.fillStyle = rgba(dark, 0.35);
          ctx.fillRect(0, 7, T, 1);
          if (w > 0) {
            ctx.fillStyle = rgba(lip, 0.8);
            ctx.fillRect((w * 9 + 3) % 26, 0, 3, 2);
          }
        }
        if (!(mask & BOTTOM)) gradientV(ctx, 0, T - 6, T, 6, [[0, dark, 0], [1, dark, 0.8]]);
        gradientV(ctx, 0, 0, T, T, [[0, dark, 0], [0.5, dark, 0.02], [1, dark, 0.14]]);
        if (!(mask & LEFT)) {
          const g = ctx.createLinearGradient(0, 0, 4, 0);
          g.addColorStop(0, rgba(lipLit, 0.35));
          g.addColorStop(1, rgba(lipLit, 0));
          ctx.fillStyle = g;
          ctx.fillRect(0, top ? 4 : 0, 4, T);
        }
        if (!(mask & RIGHT)) {
          const g = ctx.createLinearGradient(T - 5, 0, T, 0);
          g.addColorStop(0, rgba(edge, 0));
          g.addColorStop(1, rgba(edge, 0.7));
          ctx.fillStyle = g;
          ctx.fillRect(T - 5, top ? 4 : 0, 5, T);
        }
      });
    }
  }
  for (let v = 0; v < 4; v++) {
    paintTexture(scene, `${key}_ow_${v}`, T, T, (ctx) => {
      ctx.clearRect(0, 0, T, T);
      gradientV(ctx, 0, 0, T, 12, [[0, lipLit, 1], [0.3, fill, 1], [1, dark, 1]]);
      ctx.fillStyle = rgba(dark, 0.3);
      ctx.fillRect(0, 12, T, 1);
      grain(ctx, 0, 0, T, 12, 0.06, 40 + v);
    });
  }
  const cut = (ctx, role) => {
    ctx.beginPath();
    if (role === 'slope_r') (ctx.moveTo(0, T), ctx.lineTo(T, 0), ctx.lineTo(T, T));
    else if (role === 'slope_l') (ctx.moveTo(0, 0), ctx.lineTo(T, T), ctx.lineTo(0, T));
    else if (role === 'slope_r_low') (ctx.moveTo(0, T), ctx.lineTo(T, T / 2), ctx.lineTo(T, T));
    else (ctx.moveTo(0, T / 2), ctx.lineTo(T, 0), ctx.lineTo(T, T), ctx.lineTo(0, T));
    ctx.closePath();
  };
  for (const role of ['slope_r', 'slope_l', 'slope_r_low', 'slope_r_high']) {
    for (let w = 0; w < 3; w++) {
      paintTexture(scene, `${key}_sl_${role}_${w}`, T, T, (ctx) => {
        body(ctx, w, 9);
        ctx.globalCompositeOperation = 'destination-in';
        cut(ctx, role);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = rgba(lipLit, 0.9);
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (role === 'slope_r') (ctx.moveTo(0, T), ctx.lineTo(T, 0));
        else if (role === 'slope_l') (ctx.moveTo(0, 0), ctx.lineTo(T, T));
        else if (role === 'slope_r_low') (ctx.moveTo(0, T), ctx.lineTo(T, T / 2));
        else (ctx.moveTo(0, T / 2), ctx.lineTo(T, 0));
        ctx.stroke();
      });
    }
  }
}

// ---- backdrops ---------------------------------------------------------------------
// Takes a texture that was drawn from primitives and paints over it: a slow
// colour wash so no fill is one colour, light from the top-left on every
// silhouette, deeper shadow toward the ground, grain. The drawing stays; it
// stops looking like a drawing.
export function paintOverLayer(scene, key, kind, main, accent) {
  if (!scene.textures.exists(key)) return key;
  const tex = scene.textures.get(key);
  const src = tex.getSourceImage();
  if (!src || src.tagName === 'IMG') return key;
  const w = src.width;
  const h = src.height;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  const out = new Uint8ClampedArray(d);
  const isWall = kind === 'wall' || kind === 'glow';
  const lit = mix(accent, 0xffffff, 0.3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4;
      if (d[k + 3] === 0) continue;
      // the wash: low-frequency drift between the main colour's cool and warm
      const n = fbm(x / 40, y / 40, 5, 3) - 0.5;
      let m = 1 + n * 0.16;
      // weight: the ground end of every layer sits in shadow
      m *= isWall ? 1.06 - (y / h) * 0.2 : 1.02 - Math.max(0, (y / h - 0.6)) * 0.35;
      // silhouette light from the top-left, three pixels deep
      let rim = 0;
      if (!isWall) {
        for (let r = 1; r <= 3; r++) {
          const f = (4 - r) / 3;
          if (!a(x - r, y)) rim += 0.09 * f;
          if (!a(x + r, y)) rim -= 0.07 * f;
          if (!a(x, y - r)) rim += 0.08 * f;
        }
      }
      m *= 1 + (fbm(x / 2.2, y / 2.2, 91, 2) - 0.5) * 0.08;
      const r0 = d[k], g0 = d[k + 1], b0 = d[k + 2];
      out[k] = Math.max(0, Math.min(255, r0 * m + ((lit >> 16) & 255) * rim));
      out[k + 1] = Math.max(0, Math.min(255, g0 * m + ((lit >> 8) & 255) * rim));
      out[k + 2] = Math.max(0, Math.min(255, b0 * (m - 0.02) + (lit & 255) * rim));
    }
  }
  scene.textures.remove(key);
  const ct = scene.textures.createCanvas(key, w, h);
  ct.getContext().putImageData(new ImageData(out, w, h), 0, 0);
  ct.refresh();
  void main;
  return key;
}

// a sky: a painted gradient with a little noise so it never bands, and a
// haze lying on its lower third
export function paintSky(scene, key, top, bottom) {
  paintTexture(scene, key, 64, 256, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      const t = y / (h - 1);
      const base = mix(top, bottom, t * t * 0.4 + t * 0.6);
      for (let x = 0; x < w; x++) {
        const n = (fbm(x / 20, y / 20, 3, 3) - 0.5) * 0.05;
        const hz = Math.max(0, t - 0.55) * 0.3;
        const c = mix(base, mix(bottom, 0xffffff, 0.25), hz);
        const k = (y * w + x) * 4;
        d[k] = Math.max(0, Math.min(255, ((c >> 16) & 255) * (1 + n)));
        d[k + 1] = Math.max(0, Math.min(255, ((c >> 8) & 255) * (1 + n)));
        d[k + 2] = Math.max(0, Math.min(255, (c & 255) * (1 + n)));
        d[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  scene.textures.get(key).setFilter(LINEAR);
  return key;
}

// ---- props ------------------------------------------------------------------------
// The same light pass the Evening's benches and lamps got: a lit left edge, a
// shaded right edge, a lit top, a darker foot, grain. For gridded textures
// only; painted canvases and loaded images are left alone.
export function lightTextures(scene, keys) {
  for (const key of keys) {
    if (!scene.textures.exists(key)) continue;
    const tex = scene.textures.get(key);
    if (tex.lit) continue;
    const src = tex.getSourceImage();
    if (!src || src.tagName === 'IMG') continue;
    const w = src.width;
    const h = src.height;
    if (w > 512 || h > 512) continue;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
    const out = new Uint8ClampedArray(d);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const k = (y * w + x) * 4;
        if (d[k + 3] === 0) continue;
        let m = 1.04 - (y / h) * 0.12;
        for (let r = 1; r <= 3; r++) {
          const f = (4 - r) / 3;
          if (!a(x - r, y)) m += 0.09 * f;
          if (!a(x + r, y)) m -= 0.08 * f;
          if (!a(x, y - r)) m += 0.06 * f;
          if (!a(x, y + r)) m -= 0.05 * f;
        }
        m *= 1 + (fbm(x / 2.5, y / 2.5, 91, 2) - 0.5) * 0.1;
        out[k] = Math.max(0, Math.min(255, d[k] * m));
        out[k + 1] = Math.max(0, Math.min(255, d[k + 1] * m));
        out[k + 2] = Math.max(0, Math.min(255, d[k + 2] * (m - 0.02)));
      }
    }
    scene.textures.remove(key);
    const ct = scene.textures.createCanvas(key, w, h);
    ct.getContext().putImageData(new ImageData(out, w, h), 0, 0);
    ct.refresh();
    ct.lit = true;
  }
}

// every gridded texture with a prefix (a theme's props), lit
export function lightThemeProps(scene, prefixes, skip = []) {
  const keys = Object.keys(scene.textures.list).filter((k) => prefixes.some((p) => k.startsWith(p)) && !skip.some((s) => k.startsWith(s)));
  lightTextures(scene, keys);
}

void shade;
void wash;
