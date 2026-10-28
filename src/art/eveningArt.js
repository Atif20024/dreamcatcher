import Phaser from 'phaser';
import { paintTexture, stamp, dab, clump, gradientV, grain, wash, mix, shade, hsl, hex, rgba, fbm } from './paint.js';
import { TOP, RIGHT, BOTTOM, LEFT } from '../builders/autotile.js';
import { paintTreeTexture } from './treeKit.js';
import { paintFrontTexture, paintDoorTexture } from './buildingKit.js';
import { FRONT_TABLE } from '../data/scale.js';

// THE LONG EVENING, painted. Every texture here replaces a gridded or
// primitive one of the same key and size, so nothing in the scene moves.
// The light is always low and from the west (the left): lit sides face
// left, shadows fall right.

const LINEAR = Phaser.Textures.FilterMode.LINEAR;
const smoothTex = (scene, key) => scene.textures.get(key).setFilter(LINEAR);

// ---- clouds ---------------------------------------------------------------------
// Two textures per cloud: the body (white, tinted by the sky) and the belly
// (an alpha mask along the underside, tinted by the horizon colour). Both are
// grown from noise so no two are alike and none has a hard edge.
export function paintClouds(scene) {
  const keys = [];
  for (let i = 0; i < 6; i++) {
    const W = 220 + i * 30;
    const H = 70 + (i % 3) * 14;
    const body = `ev-cloud-${i}`;
    const belly = `ev-cloud-${i}-belly`;
    paintTexture(scene, body, W, H, (ctx, w, h, rand) => {
      const img = ctx.createImageData(w, h);
      const d = img.data;
      const seed = 100 + i * 7;
      const lumps = [];
      for (let k = 0; k < 4 + (i % 3); k++) lumps.push({ x: 0.2 + rand.frac() * 0.6, y: 0.45 + rand.frac() * 0.25, r: 0.22 + rand.frac() * 0.2 });
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const u = x / w;
          const v = y / h;
          // a soft blob field, the tops lumpy and the base flatter
          let f = 0;
          for (const L of lumps) {
            const dx = (u - L.x) / L.r;
            const dy = ((v - L.y) / L.r) * 1.7;
            f = Math.max(f, 1 - Math.sqrt(dx * dx + dy * dy));
          }
          const n = fbm(x / 26, y / 18, seed, 4);
          const base = v > 0.78 ? 1 - (v - 0.78) / 0.22 : 1;
          let a = (f + (n - 0.5) * 0.7) * base;
          a = Math.max(0, Math.min(1, (a - 0.18) * 2.2));
          // lit tops: brighter where the surface faces up and west
          const lite = 0.88 + 0.12 * Math.max(0, 1 - v * 1.2) - Math.max(0, u - 0.5) * 0.06;
          const k = (y * w + x) * 4;
          d[k] = 255 * lite;
          d[k + 1] = 250 * lite;
          d[k + 2] = 244 * lite;
          d[k + 3] = 255 * a;
        }
      }
      ctx.putImageData(img, 0, 0);
    });
    paintTexture(scene, belly, W, H, (ctx, w, h) => {
      const src = scene.textures.get(body).getSourceImage();
      ctx.drawImage(src, 0, 0);
      // keep only the underside, fading up
      ctx.globalCompositeOperation = 'destination-in';
      gradientV(ctx, 0, 0, w, h, [[0, 0x000000, 0], [0.45, 0x000000, 0], [0.8, 0x000000, 0.75], [1, 0x000000, 1]]);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    });
    smoothTex(scene, body);
    smoothTex(scene, belly);
    keys.push(body);
  }
  return keys;
}

// the sun's glow, painted at full size so nothing scales it into blocks
export function paintGlows(scene) {
  paintTexture(scene, 'ev-sunglow', 512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.08, 'rgba(255,255,255,0.7)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.28)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  smoothTex(scene, 'ev-sunglow');
  paintTexture(scene, 'ev-sundisc', 96, 96, (ctx) => {
    const g = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.62, 'rgba(255,255,255,1)');
    g.addColorStop(0.72, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 96, 96);
  });
  smoothTex(scene, 'ev-sundisc');
  // a soft haze band that sits on the horizon line
  paintTexture(scene, 'ev-haze', 8, 160, (ctx, w, h) => {
    gradientV(ctx, 0, 0, w, h, [[0, 0xffffff, 0], [0.5, 0xffffff, 0.55], [1, 0xffffff, 0]]);
  });
  smoothTex(scene, 'ev-haze');
  // screen grain: a tile of fine noise, jittered each frame
  paintTexture(scene, 'ev-grain', 256, 256, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = 128 + (Math.random() - 0.5) * 255;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
}

// ---- trees --------------------------------------------------------------------------
export function paintTrees(scene) {
  // round 2 WP4: the trees at their real height (src/art/treeKit.js): a
  // street tree 9 m (396 px), an old apple 6 m with its fruit in the crown;
  // the camera crops them, as it would a real one
  paintTreeTexture(scene, 'ev-tree', 'street', { seed: 'ev-tree' });
  smoothTex(scene, 'ev-tree');
  paintTreeTexture(scene, 'ev-tree-apple', 'apple', { fruit: 26, seed: 'ev-tree-apple' });
  smoothTex(scene, 'ev-tree-apple');
  // grass along the top of the ground where the town goes green: three
  // kinds — meadow green, field gold, the pale grass of the foothills
  for (const [k, cols] of Object.entries({ g: [0x5a8a3a, 0x7aa84a, 0x9cc25c], y: [0xa08840, 0xc8a850, 0xe8cc70], p: [0x7a8a60, 0x9aa878, 0xb8c498] })) {
    for (let v = 0; v < 3; v++) {
      paintTexture(scene, `ev-grass-${k}-${v}`, 32, 16, (ctx, w, h, rand) => {
        // the turf itself, sitting on the lip of the stone
        gradientV(ctx, 0, h - 6, w, 6, [[0, cols[0], 0], [0.5, cols[0], 0.9], [1, cols[0], 1]]);
        for (let i = 0; i < 26; i++) {
          const x0 = rand.frac() * w;
          const lean = (rand.frac() - 0.5) * 5 - 1;
          const hh = 5 + rand.frac() * 9;
          const c = cols[rand.frac() < 0.35 ? 0 : rand.frac() < 0.6 ? 1 : 2];
          ctx.strokeStyle = rgba(c, 0.95);
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(x0, h);
          ctx.quadraticCurveTo(x0 + lean * 0.3, h - hh * 0.6, x0 + lean, h - hh);
          ctx.stroke();
        }
      });
    }
  }
  // the hill tree: big and alone, 12 m; the pines 16 m (the camera shows
  // their trunks and lower boughs, as walking through a pine wood does), and
  // the high road's pines with snow on every tier
  paintTreeTexture(scene, 'ev-hilltree', 'hill', { seed: 'ev-hilltree' });
  smoothTex(scene, 'ev-hilltree');
  paintTreeTexture(scene, 'ev-pine', 'pine', { seed: 'ev-pine' });
  paintTreeTexture(scene, 'ev-pine-b', 'pine', { seed: 'ev-pine-b', m: 13 });
  paintTreeTexture(scene, 'ev-pine-snow', 'pine', { seed: 'ev-pine-snow', snow: true });
  paintTreeTexture(scene, 'ev-pine-snow-b', 'pine', { seed: 'ev-pine-snow-b', snow: true, m: 13 });
  // hedge tile: dense clipped foliage that tiles
  paintTexture(scene, 'ev-hedge', 32, 32, (ctx, w, h, rand) => {
    ctx.fillStyle = hex(0x2c5230);
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = ((i * 53) % 96) / 3;
      const y = ((i * 29) % 96) / 3;
      const c = i % 3 === 0 ? 0x4a7a3a : i % 3 === 1 ? 0x3a6a34 : 0x5a8a44;
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) clump(ctx, x + dx, y + dy, 4 + (i % 3), c, 0.9, rand, 4);
    }
    grain(ctx, 0, 0, w, h, 0.1, 11);
  });
}

// ---- the arch ---------------------------------------------------------------------
export function paintArch(scene) {
  paintTexture(scene, 'ev-arch', 80, 92, (ctx, w, h, rand) => {
    const stone = 0xd4c4a4;
    // the two piers and the ring, in cut stone
    ctx.fillStyle = hex(stone);
    ctx.beginPath();
    ctx.rect(0, 30, 20, 62);
    ctx.rect(60, 30, 20, 62);
    ctx.moveTo(0, 30);
    ctx.arc(40, 30, 40, Math.PI, 0);
    ctx.lineTo(80, 30);
    ctx.lineTo(0, 30);
    ctx.fill();
    // the opening
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.rect(20, 34, 40, 58);
    ctx.moveTo(20, 34);
    ctx.arc(40, 34, 20, Math.PI, 0);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // stone courses
    ctx.strokeStyle = rgba(0x8a7a5a, 0.5);
    ctx.lineWidth = 1;
    for (let y = 40; y < h; y += 9) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(20, y);
      ctx.moveTo(60, y);
      ctx.lineTo(80, y);
      ctx.stroke();
    }
    for (let a = Math.PI; a <= Math.PI * 2 + 0.01; a += Math.PI / 9) {
      ctx.beginPath();
      ctx.moveTo(40 + Math.cos(a) * 21, 32 + Math.sin(a) * 21);
      ctx.lineTo(40 + Math.cos(a) * 40, 30 + Math.sin(a) * 40);
      ctx.stroke();
    }
    wash(ctx, 0, 0, w, h, 0xb8a080, 0xe8dcc0, 0.3, 5, 0.06);
    // the sun from the west: the left pier lit, the right in shade
    ctx.fillStyle = rgba(0xfff0c8, 0.25);
    ctx.fillRect(0, 30, 6, 62);
    ctx.fillStyle = rgba(0x3a2a30, 0.22);
    ctx.fillRect(72, 30, 8, 62);
    ctx.fillRect(60, 34, 4, 58);
    grain(ctx, 0, 0, w, h, 0.09, 4);
    // ivy: from the top corners down
    for (let i = 0; i < 26; i++) {
      const left = i % 2 === 0;
      const x = left ? 4 + rand.frac() * 18 : 58 + rand.frac() * 18;
      const y = 10 + rand.frac() * 60;
      const c = rand.frac() < 0.4 ? 0x4a7a3a : rand.frac() < 0.5 ? 0x5a8a4a : 0x6a9a50;
      clump(ctx, x, y, 3 + rand.frac() * 2.5, c, 0.95, rand, 4);
    }
    for (let i = 0; i < 12; i++) clump(ctx, 22 + rand.frac() * 36, 4 + rand.frac() * 12, 3 + rand.frac() * 2, i % 2 ? 0x5a8a4a : 0x4a7a3a, 0.95, rand, 4);
  });
}

// ---- ground: the 'eve' tileset, painted limestone --------------------------------------
// Runs BEFORE RoomBuilder builds the gridded set, which then skips these keys.
export function paintEveTiles(scene) {
  const key = 'eve';
  const stone = 0xd8c4a4;
  const dark = 0x9a7e5e;
  const lipLit = 0xfff0c8;
  const lip = 0xe8cc98;
  const T = 32;
  const body = (ctx, wear, seed) => {
    ctx.fillStyle = hex(stone);
    ctx.fillRect(0, 0, T, T);
    // blocks of slightly different stone, offset per row like coursing
    const img = ctx.getImageData(0, 0, T, T);
    const d = img.data;
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        const n = fbm(x / 9 + wear * 5, y / 9 + seed, 21 + wear, 3);
        const m = 0.92 + n * 0.16;
        const k = (y * T + x) * 4;
        // warmer where lighter, cooler in the pits
        d[k] = Math.min(255, d[k] * m);
        d[k + 1] = Math.min(255, d[k + 1] * (m - 0.01));
        d[k + 2] = Math.min(255, d[k + 2] * (m - 0.03));
      }
    }
    ctx.putImageData(img, 0, 0);
    // cut stone: two courses per tile, the joints staggered per course,
    // each block its own shade
    const jointA = 15 + ((wear * 3 + seed) % 3);
    ctx.fillStyle = rgba(dark, 0.55);
    ctx.fillRect(0, jointA, T, 1);
    ctx.fillStyle = rgba(0xfff0c8, 0.35);
    ctx.fillRect(0, jointA + 1, T, 1);
    for (const [y0, y1, off] of [[0, jointA, (seed * 7 + wear * 11) % 20 + 6], [jointA + 1, T, (seed * 13 + wear * 5) % 20 + 6]]) {
      ctx.fillStyle = rgba(dark, 0.5);
      ctx.fillRect(off, y0, 1, y1 - y0);
      ctx.fillStyle = rgba(0xfff0c8, 0.3);
      ctx.fillRect(off + 1, y0, 1, y1 - y0);
      // the block on one side a touch lighter than the other
      ctx.fillStyle = rgba((seed + wear) % 2 ? 0xfff4e0 : dark, 0.07);
      ctx.fillRect(0, y0, off, y1 - y0);
    }
    // a couple of pebbles and pits
    for (let i = 0; i < 3; i++) {
      const x = ((i * 11 + wear * 7 + seed * 3) % 28) + 2;
      const y = ((i * 17 + wear * 5 + seed) % 26) + 4;
      stamp(ctx, x, y, 2.2, i % 2 ? dark : 0xe8dcc0, 0.3, 0.7);
    }
    grain(ctx, 0, 0, T, T, 0.07, 31 + wear + seed, 1);
  };
  for (let mask = 0; mask < 16; mask++) {
    for (let w = 0; w < 3; w++) {
      paintTexture(scene, `${key}_s_${mask}_${w}`, T, T, (ctx) => {
        body(ctx, w, mask);
        const top = !(mask & TOP);
        const bottom = !(mask & BOTTOM);
        const left = !(mask & LEFT);
        const right = !(mask & RIGHT);
        if (top) {
          // the sunlit lip and the thin shadow under it
          gradientV(ctx, 0, 0, T, 7, [[0, lipLit, 1], [0.5, lip, 0.75], [1, lip, 0]]);
          ctx.fillStyle = rgba(0xfffaf0, 0.9);
          ctx.fillRect(0, 0, T, 1);
          ctx.fillStyle = rgba(dark, 0.35);
          ctx.fillRect(0, 7, T, 1);
          // a chipped lip, per wear
          if (w > 0) {
            ctx.fillStyle = rgba(lip, 0.8);
            ctx.fillRect((w * 9 + 3) % 26, 0, 3, 2);
          }
        }
        if (bottom) gradientV(ctx, 0, T - 6, T, 6, [[0, dark, 0], [1, dark, 0.8]]);
        // the lower half of every tile is a touch deeper: weight
        gradientV(ctx, 0, 0, T, T, [[0, dark, 0], [0.5, dark, 0.02], [1, dark, 0.14]]);
        if (left) {
          const g = ctx.createLinearGradient(0, 0, 4, 0);
          g.addColorStop(0, rgba(0xfff0c8, 0.35));
          g.addColorStop(1, rgba(0xfff0c8, 0));
          ctx.fillStyle = g;
          ctx.fillRect(0, top ? 4 : 0, 4, T);
        }
        if (right) {
          const g = ctx.createLinearGradient(T - 5, 0, T, 0);
          g.addColorStop(0, rgba(dark, 0));
          g.addColorStop(1, rgba(dark, 0.6));
          ctx.fillStyle = g;
          ctx.fillRect(T - 5, top ? 4 : 0, 5, T);
        }
        // deep in the ground it goes darker and cooler (RoomBuilder also
        // tints buried tiles; this adds the join line between courses)
        if (!top && (w + mask) % 2 === 0) {
          ctx.fillStyle = rgba(dark, 0.18);
          ctx.fillRect(0, 15 + (w * 5) % 9, T, 1);
        }
      });
    }
  }
  for (let v = 0; v < 4; v++) {
    paintTexture(scene, `${key}_ow_${v}`, T, T, (ctx) => {
      ctx.clearRect(0, 0, T, T);
      gradientV(ctx, 0, 0, T, 12, [[0, lipLit, 1], [0.3, stone, 1], [1, dark, 1]]);
      ctx.fillStyle = rgba(dark, 0.3);
      ctx.fillRect(0, 12, T, 1);
      grain(ctx, 0, 0, T, 12, 0.06, 40 + v);
    });
  }
  for (const role of ['slope_r', 'slope_l', 'slope_r_low', 'slope_r_high']) {
    for (let w = 0; w < 3; w++) {
      paintTexture(scene, `${key}_sl_${role}_${w}`, T, T, (ctx) => {
        // the body, then cut to the slope's profile
        body(ctx, w, 9);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        if (role === 'slope_r') {
          ctx.moveTo(0, T);
          ctx.lineTo(T, 0);
          ctx.lineTo(T, T);
        } else if (role === 'slope_l') {
          ctx.moveTo(0, 0);
          ctx.lineTo(T, T);
          ctx.lineTo(0, T);
        } else if (role === 'slope_r_low') {
          ctx.moveTo(0, T);
          ctx.lineTo(T, T / 2);
          ctx.lineTo(T, T);
        } else {
          ctx.moveTo(0, T / 2);
          ctx.lineTo(T, 0);
          ctx.lineTo(T, T);
          ctx.lineTo(0, T);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        // the lit edge along the slope
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

// ---- odds and ends ----------------------------------------------------------------
export function paintProps(scene) {
  // grass: a painted tuft, three variants, used instead of a green rectangle
  for (let v = 0; v < 3; v++) {
    paintTexture(scene, `ev-tuft-${v}`, 14, 16, (ctx, w, h, rand) => {
      for (let i = 0; i < 6 + v; i++) {
        const x0 = 3 + rand.frac() * 8;
        const lean = (rand.frac() - 0.5) * 6;
        const hh = 8 + rand.frac() * 7;
        const c = rand.frac() < 0.5 ? 0x7a9a4a : rand.frac() < 0.5 ? 0x9ab85a : 0x5a8a3a;
        ctx.strokeStyle = rgba(c, 0.95);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x0, h);
        ctx.quadraticCurveTo(x0 + lean * 0.4, h - hh * 0.6, x0 + lean, h - hh);
        ctx.stroke();
      }
    });
  }
  // the long shadow every standing thing casts east: softer at the far end
  paintTexture(scene, 'ev-shadow', 64, 8, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(10, 0);
    ctx.lineTo(64, 2.5);
    ctx.lineTo(64, 6.5);
    ctx.lineTo(10, 8);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
  });
  smoothTex(scene, 'ev-shadow');
  paintTexture(scene, 'ev-glow', 32, 32, (ctx) => {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  });
  smoothTex(scene, 'ev-glow');
  // a lost thing: a small bright shape, tinted per item; and its glint
  paintTexture(scene, 'ev-find', 10, 10, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(5, 6, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(5, 7.5, 3.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(3, 4, 2, 1);
  });
  paintTexture(scene, 'ev-glint', 16, 16, (ctx) => {
    ctx.strokeStyle = 'rgba(255,250,220,0.95)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8, 1);
    ctx.lineTo(8, 15);
    ctx.moveTo(1, 8);
    ctx.lineTo(15, 8);
    ctx.stroke();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 6);
    g.addColorStop(0, 'rgba(255,250,220,0.8)');
    g.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
  });
  smoothTex(scene, 'ev-glint');
  // a snowflake: soft, round, never a square
  paintTexture(scene, 'ev-flake', 8, 8, (ctx) => {
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 8);
  });
  smoothTex(scene, 'ev-flake');
}

// earth: the same masks as the stone set, painted as packed soil with the
// odd stone in it. Swapped in by bucketTerrain where the ground is turf.
export function paintEarthTiles(scene) {
  const T = 32;
  const soil = 0xb08c64;
  const dark = 0x6a4a34;
  const body = (ctx, wear, seed) => {
    ctx.fillStyle = hex(soil);
    ctx.fillRect(0, 0, T, T);
    const img = ctx.getImageData(0, 0, T, T);
    const d = img.data;
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        const n = fbm(x / 7 + wear * 3, y / 7 + seed * 2, 71 + wear, 3);
        const m = 0.8 + n * 0.36;
        const k = (y * T + x) * 4;
        d[k] = Math.min(255, d[k] * m);
        d[k + 1] = Math.min(255, d[k + 1] * (m - 0.02));
        d[k + 2] = Math.min(255, d[k + 2] * (m - 0.05));
      }
    }
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < 5; i++) {
      const x = ((i * 13 + wear * 7 + seed * 5) % 28) + 2;
      const y = ((i * 19 + wear * 3 + seed) % 26) + 3;
      stamp(ctx, x, y, 1.6 + (i % 2), i % 3 ? dark : 0xd8c8a8, 0.45, 0.6);
    }
    grain(ctx, 0, 0, T, T, 0.08, 81 + wear + seed, 1);
  };
  for (let mask = 0; mask < 16; mask++) {
    for (let w = 0; w < 3; w++) {
      paintTexture(scene, `evd_s_${mask}_${w}`, T, T, (ctx) => {
        body(ctx, w, mask);
        if (!(mask & TOP)) gradientV(ctx, 0, 0, T, 6, [[0, dark, 0.55], [1, dark, 0]]);
        if (!(mask & BOTTOM)) gradientV(ctx, 0, T - 6, T, 6, [[0, dark, 0], [1, dark, 0.7]]);
        if (!(mask & LEFT)) {
          const g = ctx.createLinearGradient(0, 0, 4, 0);
          g.addColorStop(0, rgba(0xfff0c8, 0.25));
          g.addColorStop(1, rgba(0xfff0c8, 0));
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, 4, T);
        }
        if (!(mask & RIGHT)) {
          const g = ctx.createLinearGradient(T - 5, 0, T, 0);
          g.addColorStop(0, rgba(dark, 0));
          g.addColorStop(1, rgba(dark, 0.55));
          ctx.fillStyle = g;
          ctx.fillRect(T - 5, 0, 5, T);
        }
        gradientV(ctx, 0, 0, T, T, [[0, dark, 0], [1, dark, 0.12]]);
      });
    }
  }
  for (const role of ['slope_r', 'slope_l', 'slope_r_low', 'slope_r_high']) {
    for (let w = 0; w < 3; w++) {
      paintTexture(scene, `evd_sl_${role}_${w}`, T, T, (ctx) => {
        body(ctx, w, 9);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        if (role === 'slope_r') (ctx.moveTo(0, T), ctx.lineTo(T, 0), ctx.lineTo(T, T));
        else if (role === 'slope_l') (ctx.moveTo(0, 0), ctx.lineTo(T, T), ctx.lineTo(0, T));
        else if (role === 'slope_r_low') (ctx.moveTo(0, T), ctx.lineTo(T, T / 2), ctx.lineTo(T, T));
        else (ctx.moveTo(0, T / 2), ctx.lineTo(T, 0), ctx.lineTo(T, T), ctx.lineTo(0, T));
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = rgba(0x7aa04a, 0.9);
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

// The gridded props (benches, lamps, carts, the fountain) keep their
// drawings but get the light: a lit left edge, a shaded right edge, a
// lit top, a darker foot, and grain — so a flat block reads as a thing
// standing in the evening sun. Runs on whatever createEveningTextures made;
// painted keys (canvas with smoothing) and overrides are left alone.
export function lightProps(scene, keys) {
  for (const key of keys) {
    if (!scene.textures.exists(key)) continue;
    const tex = scene.textures.get(key);
    const src = tex.getSourceImage();
    if (!src || src.tagName === 'IMG') continue;
    const w = src.width;
    const h = src.height;
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(src, 0, 0);
    const img = tctx.getImageData(0, 0, w, h);
    const d = img.data;
    const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
    const out = new Uint8ClampedArray(d);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const k = (y * w + x) * 4;
        if (d[k + 3] === 0) continue;
        let m = 1.04 - (y / h) * 0.14; // top lit, foot in shade
        // silhouette edges, three pixels deep
        for (let r = 1; r <= 3; r++) {
          const f = (4 - r) / 3;
          if (!a(x - r, y)) m += 0.1 * f;
          if (!a(x + r, y)) m -= 0.09 * f;
          if (!a(x, y - r)) m += 0.06 * f;
          if (!a(x, y + r)) m -= 0.05 * f;
        }
        m *= 1 + (fbm(x / 2.5, y / 2.5, 91, 2) - 0.5) * 0.12;
        out[k] = Math.max(0, Math.min(255, d[k] * m));
        out[k + 1] = Math.max(0, Math.min(255, d[k + 1] * m));
        out[k + 2] = Math.max(0, Math.min(255, d[k + 2] * (m - 0.02)));
      }
    }
    scene.textures.remove(key);
    const ct = scene.textures.createCanvas(key, w, h);
    ct.getContext().putImageData(new ImageData(out, w, h), 0, 0);
    ct.refresh();
  }
}

export function paintEveningArt(scene) {
  paintEarthTiles(scene);
  paintGlows(scene);
  paintClouds(scene);
  paintTrees(scene);
  paintArch(scene);
  paintProps(scene);
  paintFronts(scene);
  paintEveTiles(scene);
}

// round 2 WP4 (critique §5.9, "the roofs"): Jo walked on flat stone past
// knee-high houses. The roofs place (cols 248–282) is now the top of a row of
// houses at the play plane's scale: Jo walks the ridge of pitched tile roofs
// (2 m of tiles seen from the street side, a gutter, the eaves' shadow), the
// facades go down 3 m a storey to the school yard's level, the goat's
// chimney (col 279) is a brick stack with pots, and more chimneys (1.2 m)
// and skylights stand on the roofs. Painted once, baked with the terrain.
export function paintRoofBlock(scene, groundY) {
  const T = 32;
  const c0 = 248;
  const c1 = 283; // the ladder's column stays as it is
  const X0 = c0 * T;
  const W = (c1 - c0) * T;
  const street = 32 * T;
  const k = 44;
  const surf = [];
  // (the goat's chimney is a solid column; the roof runs on under it)
  for (let x = 0; x < W; x++) surf.push(Math.floor((X0 + x) / T) === 279 ? 22 * T : groundY(X0 + x + 0.5, 0));
  const top = Math.floor(Math.min(...surf)) - 70;
  const H = street - top;
  const key = 'ev-roofblock';
  const houses = [
    { a: 0, b: 12 * T, wall: 0xe8d0a8, roof: 0xb85a3a, shutter: 0x3a6a8a },
    { a: 12 * T, b: 25 * T, wall: 0xd8a888, roof: 0xa04a30, shutter: 0x4a7a6a },
    { a: 25 * T, b: W, wall: 0xe8d8c0, roof: 0xc86a48, shutter: 0x2e3a52 },
  ];
  const BAND = Math.round(2.0 * k); // the roof slope, seen from below its eave
  paintTexture(scene, key, W, H, (ctx, w, h, rand) => {
    const Y = (y) => y - top;
    for (const hs of houses) {
      // the facade, eave to street
      for (let x = hs.a; x < hs.b; x++) {
        const eave = Y(surf[x]) + BAND;
        const g = ctx.createLinearGradient(0, eave, 0, h);
        g.addColorStop(0, hex(mix(hs.wall, 0x3a2a40, 0.35)));
        g.addColorStop(0.08, hex(hs.wall));
        g.addColorStop(1, hex(mix(hs.wall, 0xf0c090, 0.2)));
        ctx.fillStyle = g;
        ctx.fillRect(x, eave, 1, h - eave);
      }
      for (let i = 0; i < 30; i++) stamp(ctx, hs.a + rand.frac() * (hs.b - hs.a), Y(surf[hs.a]) + BAND + rand.frac() * 200, 10 + rand.frac() * 30, rand.frac() < 0.5 ? shade(hs.wall, 1.1) : shade(hs.wall, 0.9), 0.2, 0.9);
      // windows: the ground floor (sill 0.9 m), then whatever of the first
      // floor shows under the eaves (a full window, or a low attic one)
      const eaveMax = Math.max(...surf.slice(hs.a, hs.b).map(Y)) + BAND + 6;
      for (let bx = hs.a + 30; bx < hs.b - 50; bx += Math.round(2.6 * k)) {
        const win = (y, wh) => {
          ctx.fillStyle = hex(mix(hs.wall, 0x2a2030, 0.45));
          ctx.fillRect(bx - 2, y - 2, k + 4, wh + 3);
          ctx.fillStyle = rand.frac() < 0.3 ? '#f8c870' : '#3a3448';
          ctx.fillRect(bx, y, k, wh);
          ctx.fillStyle = rgba(0xf2ece0, 0.85);
          ctx.fillRect(bx + k / 2 - 1, y, 2, wh);
          ctx.fillRect(bx, y + wh * 0.45, k, 2);
          ctx.fillStyle = hex(mix(hs.wall, 0xfff4e0, 0.45));
          ctx.fillRect(bx - 4, y + wh, k + 8, 4);
          for (const sx of [bx - 24, bx + k + 2]) {
            ctx.fillStyle = hex(hs.shutter);
            ctx.fillRect(sx, y, 22, wh);
            ctx.fillStyle = rgba(0x000000, 0.2);
            for (let yy = y + 4; yy < y + wh; yy += 5) ctx.fillRect(sx + 2, yy, 18, 1);
          }
        };
        win(h - Math.round(0.9 * k) - Math.round(1.5 * k), Math.round(1.5 * k));
        const fl = h - Math.round(3 * k);
        const full = fl - Math.round(0.9 * k) - Math.round(1.5 * k);
        if (full > eaveMax) win(full, Math.round(1.5 * k));
        else if (fl - Math.round(0.5 * k) - Math.round(0.8 * k) > eaveMax) win(fl - Math.round(0.5 * k) - Math.round(0.8 * k), Math.round(0.8 * k));
      }
      // a party wall between neighbours
      ctx.fillStyle = rgba(0x2a2030, 0.35);
      ctx.fillRect(hs.a, Y(surf[hs.a]), 3, h);
      // the tiles: courses 0.3 m apart, each tile 0.35 m, lighter toward the
      // ridge (it catches the sky), the gutter at the bottom
      for (let x = hs.a; x < hs.b; x++) {
        const t0 = Y(surf[x]);
        for (let r = 0; r < BAND; r++) {
          const course = Math.floor(r / 13);
          const inCourse = r % 13;
          const off = course % 2 ? 7 : 0;
          const edge = (x + off) % 15 === 0;
          let c = mix(hs.roof, 0xffd0a0, 0.18 - (r / BAND) * 0.2);
          if (inCourse > 9) c = shade(c, 0.72); // the lap's shadow
          if (edge) c = shade(c, 0.8);
          if (inCourse === 0) c = mix(c, 0xffe0c0, 0.2);
          ctx.fillStyle = hex(c);
          ctx.fillRect(x, t0 + r, 1, 1);
        }
        ctx.fillStyle = '#3a3440';
        ctx.fillRect(x, t0 + BAND, 1, 4); // the gutter
        ctx.fillStyle = rgba(0x2a2030, 0.4);
        ctx.fillRect(x, t0 + BAND + 4, 1, 6);
      }
    }
    // weathering and moss on the tiles
    for (let i = 0; i < 160; i++) {
      const x = rand.frac() * W;
      dab(ctx, x, Y(surf[Math.floor(x)]) + rand.frac() * BAND, 4 + rand.frac() * 10, 2 + rand.frac() * 3, 0, rand.frac() < 0.5 ? 0x6a7a4a : 0x5a3a2a, 0.25, 0.7);
    }
    // the goat's chimney: the solid stack at col 279, brick, with pots
    const cx = (279 - c0) * T;
    const cTop = Y(19 * T);
    ctx.fillStyle = '#9a5a44';
    const cFoot = Y(22 * T) + 12;
    ctx.fillRect(cx, cTop, T, cFoot - cTop);
    ctx.fillStyle = rgba(0x3a1a10, 0.35);
    for (let y = cTop; y < cFoot; y += 6) ctx.fillRect(cx, y, T, 1);
    for (let y = cTop, i = 0; y < cFoot; y += 6, i++) for (let x = cx + (i % 2 ? 4 : 10); x < cx + T; x += 12) ctx.fillRect(x, y, 1, 6);
    ctx.fillStyle = rgba(0xffe0c0, 0.35);
    ctx.fillRect(cx, cTop, 3, cFoot - cTop);
    ctx.fillStyle = '#7a4a3a';
    ctx.fillRect(cx - 3, cTop, T + 6, 5);
    // more chimneys (1.2 m over the ridge) and skylights, behind the walk
    for (const [lx, pots] of [[3.2, 2], [9.5, 1], [15.6, 3], [22.4, 2], [31.2, 1]]) {
      const x = Math.round(lx * T);
      const base = Y(surf[x]);
      const ch = Math.round(1.2 * k);
      ctx.fillStyle = '#a86a52';
      ctx.fillRect(x, base - ch, 26, ch + 18);
      ctx.fillStyle = rgba(0xffe0c0, 0.3);
      ctx.fillRect(x, base - ch, 3, ch + 18);
      ctx.fillStyle = rgba(0x2a1a10, 0.3);
      ctx.fillRect(x + 20, base - ch, 6, ch + 18);
      ctx.fillStyle = '#7a4a3a';
      ctx.fillRect(x - 3, base - ch, 32, 5);
      for (let p = 0; p < pots; p++) {
        ctx.fillStyle = '#c8784a';
        ctx.fillRect(x + 3 + p * 8, base - ch - 9, 6, 9);
      }
    }
    for (const lx of [6.4, 18.2, 27.5]) {
      const x = Math.round(lx * T);
      const y = Y(surf[x]) + 28;
      ctx.fillStyle = '#5a5a64';
      ctx.fillRect(x - 3, y - 3, 46, 32);
      ctx.fillStyle = lx > 18 ? '#f8c870' : '#4a5a70';
      ctx.fillRect(x, y, 40, 26);
      ctx.fillStyle = rgba(0xd8e4f0, 0.3);
      ctx.fillRect(x + 3, y + 3, 14, 8);
    }
    grain(ctx, 0, 0, w, h, 0.05, 71);
  }, key);
  const img = scene.add.image(X0, top, key).setOrigin(0).setDepth(-9.95);
  return img;
}

// round 2 WP4 (critique §5.9, the ridge): "the ground is a flat slab with a
// rectangular bump". The treeline and the ridge (from col 740) are a granite
// crag: strata, cracks, snow on its ledges, the aurora catching its rim. Past
// the world's east edge it falls away into the dark, so the closing shot can
// put the three of them on the rock in the lower left with the whole sky and
// the drop beside them. Painted once, baked with the terrain.
export function paintRidgeRock(scene, groundY, worldW, bottom) {
  const T = 32;
  const X0 = 740 * T;
  const EXTRA = 1500;
  const W = worldW - X0 + EXTRA;
  const surf = (x) => (X0 + x < worldW ? groundY(X0 + x + 0.5, 0) : null);
  let top = Infinity;
  for (let x = 0; x < worldW - X0; x += 8) top = Math.min(top, surf(x));
  const y0 = Math.floor(top) - 70;
  const H = bottom - y0;
  const edgeY = surf(worldW - X0 - 1) - y0;
  const key = 'ev-ridgerock';
  paintTexture(scene, key, W, H, (ctx, w, h, rand) => {
    // the outline: the walk surface exactly, then the fall past the end
    const pts = [];
    // the block at the end of everything (cols 785–787) becomes a crag: a
    // buttress leaning up to it from the west and a broken peak on top
    const bx = 785 * T - X0;
    const by = 5 * T - y0;
    for (let x = 0; x <= w; x += 4) {
      let s = surf(Math.min(x, w - 1));
      if (s !== null && x > bx - 56 && x < bx) s = Math.min(s, y0 + by + ((bx - x) / 56) * (s - y0 - by) + (fbm(x / 9, 2, 85, 2) - 0.5) * 10);
      if (s !== null && x >= bx) s = Math.min(s, y0 + by - Math.max(0, 46 - Math.abs(x - bx - 34) * 0.9) - (fbm(x / 7, 1, 86, 2) - 0.5) * 12);
      if (s !== null) pts.push([x, s - y0]);
      else {
        const d = (x - (worldW - X0)) / EXTRA;
        pts.push([x, edgeY + Math.pow(d, 1.35) * (h - edgeY) * 0.9 + (fbm(x / 40, 3, 81, 3) - 0.5) * 40 * Math.min(1, d * 4)]);
      }
    }
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(w, h);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8a90a0');
    g.addColorStop(0.25, '#6a7080');
    g.addColorStop(1, '#3a3e4a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // strata: long tilted bands, lighter and darker
    for (let i = 0; i < 90; i++) {
      const x = rand.frac() * w;
      const y = edgeY * 0.5 + rand.frac() * h;
      dab(ctx, x, y, 40 + rand.frac() * 140, 3 + rand.frac() * 7, -0.18 + rand.frac() * 0.1, rand.frac() < 0.5 ? 0xa8acb8 : 0x2a2e38, 0.35, 0.6);
    }
    // cracks
    ctx.strokeStyle = 'rgba(20,22,30,0.55)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 40; i++) {
      let x = rand.frac() * w;
      let y = 20 + rand.frac() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (rand.frac() - 0.5) * 20;
        y += 8 + rand.frac() * 14;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // snow on the ledges, thickest along the top
    for (const [x, y] of pts) {
      if (rand.frac() < 0.6) dab(ctx, x, y + 3, 6 + rand.frac() * 10, 2 + rand.frac() * 2, 0, 0xeef2fa, 0.85, 0.4);
    }
    for (let i = 0; i < 70; i++) dab(ctx, rand.frac() * w, edgeY + 30 + rand.frac() * (h - 60), 8 + rand.frac() * 16, 2 + rand.frac() * 2, -0.15, 0xdfe6f2, 0.55, 0.5);
    ctx.restore();
    // the rim the sky lights
    ctx.strokeStyle = 'rgba(190,240,220,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 1) : ctx.moveTo(x, y + 1)));
    ctx.stroke();
    grain(ctx, 0, 0, w, h, 0.06, 83);
  }, key);
  return scene.add.image(X0, y0, key).setOrigin(0).setDepth(-9.95);
}

// round 2 WP4: the doors the town goes in and out of, and the houses they
// belong to, at the play plane's scale (a storey 132 px, a door 2.2 m): the
// old 32×56 door stood alone on the street like a wardrobe
export function paintFronts(scene) {
  paintDoorTexture(scene, 'ev-door', { leaf: 0x2e6a4a, stone: 0xd8c8a8 });
  paintFrontTexture(scene, 'ev-bakery', FRONT_TABLE['ev-bakery'], { wall: 0xe8c89a, sign: 0x8a4a2a, doorBay: 1, doorCol: 0x6a3a22, lit: 0.9, shutter: null });
  const houses = [
    { wall: 0xe8d0a8, roofCol: 0xb85a3a, shutter: 0x3a6a8a },
    { wall: 0xd8b088, roofCol: 0xa04a30, shutter: 0x4a7a6a },
    { wall: 0xe8d8c0, roofCol: 0xc86a48, shutter: 0x2e3a52 },
  ];
  houses.forEach((h, i) => paintFrontTexture(scene, `ev-house-${i}`, { storeys: 1, ground: 'house', bays: 3 }, { ...h, doorBay: 1, balconies: true, lit: 0.15 }));
  for (const k of ['ev-door', 'ev-bakery', 'ev-house-0', 'ev-house-1', 'ev-house-2']) smoothTex(scene, k);
}
