#!/usr/bin/env node
// D11.2 — string-art -> PNG atlases. Runs before `vite` and `vite build`.
//
//   node scripts/build-atlas.js            build every pack
//   node scripts/build-atlas.js --only jo  one pack
//   node scripts/build-atlas.js --watch    rebuild a pack when its art changes
//
// For every pack in src/art/index.js: compose rig frames (Rig.frames),
// rasterize each grid at 1x with the named palette, shelf-pack into a
// power-of-two sheet with 1 px padding, and write
//   public/atlas/<pack>.png        the sheet
//   public/atlas/<pack>.json       Phaser JSON-hash atlas (+ pivot per frame)
//   public/atlas/<pack>.meta.json  animations, strides, foot contacts
//   sheets/<pack>-<anim>.png       review strips at 2x, with an onion skin
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Canvas } from './lib/png.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'atlas');
const SHEETS = path.join(ROOT, 'sheets');
const ART_DIR = path.join(ROOT, 'src', 'art');
const RIG_DIR = path.join(ROOT, 'src', 'data', 'rigs');

// --- rasterize -------------------------------------------------------------
// `outline`: a colour painted into every empty cell that touches a filled
// one, inside the grid's own bounds (the same rim createPixelTexture drew).
export function rasterize(grid, palette, colorOf, outline) {
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  const c = new Canvas(w, h);
  const filled = (x, y) => x >= 0 && y >= 0 && y < h && x < (grid[y] || '').length && grid[y][x] !== '.' && grid[y][x] !== ' ' && palette[grid[y][x]] !== undefined;
  if (outline !== undefined) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (filled(x, y)) continue;
      if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) c.set(x, y, colorOf(outline));
    }
  }
  grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return;
      const name = palette[ch];
      if (name === undefined) throw new Error(`no palette entry for "${ch}"`);
      c.set(x, y, colorOf(name));
    });
  });
  return c;
}

// --- shelf packer ----------------------------------------------------------
function pack(frames, pad = 1) {
  // frames: [{ name, canvas }] -> places + sheet size (power of two)
  const sorted = [...frames].sort((a, b) => b.canvas.height - a.canvas.height);
  const total = sorted.reduce((s, f) => s + (f.canvas.width + pad) * (f.canvas.height + pad), 0);
  let width = 64;
  while (width * width < total * 1.4) width *= 2;
  let x = pad;
  let y = pad;
  let shelf = 0;
  const places = new Map();
  for (const f of sorted) {
    const fw = f.canvas.width;
    const fh = f.canvas.height;
    if (x + fw + pad > width) {
      x = pad;
      y += shelf + pad;
      shelf = 0;
    }
    places.set(f.name, { x, y, w: fw, h: fh });
    x += fw + pad;
    shelf = Math.max(shelf, fh);
  }
  let height = 1;
  const used = y + shelf + pad;
  while (height < used) height *= 2;
  return { width, height, places };
}

// --- one pack --------------------------------------------------------------
async function loadRegistry() {
  const url = pathToFileURL(path.join(ART_DIR, 'index.js')).href + `?t=${Date.now()}`;
  const mod = await import(url);
  return mod;
}

export async function buildPack(name, registry) {
  const { PACKS } = registry;
  const { colorOf } = await import(pathToFileURL(path.join(ROOT, 'src', 'data', 'palettes.js')).href + `?t=${Date.now()}`);
  const def = PACKS[name];
  if (!def) throw new Error(`no pack "${name}"`);
  const frames = []; // { name, canvas, anchor:[x,y] (px from top-left), anim, index, contact }
  const animations = {};
  const meta = { animations: {}, stride: {}, contacts: {}, footstep: {}, scale: {} };

  for (const item of def.frames()) {
    // item: { anim, index?, grid, palette, origin:[x,y] | anchor, contact?, footstep? }
    const canvas = rasterize(item.grid, item.palette, colorOf, item.outline);
    const frameName = item.index === undefined ? item.anim : `${item.anim}_${item.index}`;
    if (item.scale !== undefined) meta.scale[item.anim] = item.scale;
    frames.push({ name: frameName, canvas, origin: item.origin || [Math.floor(canvas.width / 2), canvas.height - 1] });
    if (item.index !== undefined) {
      (animations[item.anim] ||= [])[item.index] = frameName;
      if (item.contact !== undefined) (meta.contacts[item.anim] ||= [])[item.index] = item.contact;
      if (item.footstep) (meta.footstep[item.anim] ||= []).push(item.index);
    }
    if (item.stride !== undefined) meta.stride[item.anim] = item.stride;
  }
  meta.animations = animations;

  const { width, height, places } = pack(frames);
  const sheet = new Canvas(width, height);
  const json = { frames: {}, meta: { app: 'dreamcatcher build-atlas', version: '1', image: `${name}.png`, format: 'RGBA8888', size: { w: width, h: height }, scale: '1' }, animations };
  for (const f of frames) {
    const p = places.get(f.name);
    sheet.blit(f.canvas, p.x, p.y);
    json.frames[f.name] = {
      frame: { x: p.x, y: p.y, w: p.w, h: p.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: p.w, h: p.h },
      sourceSize: { w: p.w, h: p.h },
      // Phaser's JSON-hash loader reads `anchor` as a NORMALIZED pivot and
      // applies it on every setFrame() (frame.customPivot). The feet anchor
      // is the bottom edge of the contact row.
      anchor: { x: (f.origin[0] + 0.5) / p.w, y: (f.origin[1] + 1) / p.h },
      // the same anchor in pixels, for tools and tests
      origin: { x: f.origin[0], y: f.origin[1] },
    };
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `${name}.png`), sheet.png());
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(json));
  fs.writeFileSync(path.join(OUT, `${name}.meta.json`), JSON.stringify(meta));

  // review strips (D11.2 step 5): every animation at 2x, plus an onion skin
  fs.mkdirSync(SHEETS, { recursive: true });
  for (const [anim, names] of Object.entries(animations)) {
    writeStrip(name, anim, names.map((n) => frames.find((f) => f.name === n)));
  }
  return { frames: frames.length, animations: Object.keys(animations).length, width, height };
}

export function writeStrip(packName, anim, frames) {
  const scale = 2;
  const fw = Math.max(...frames.map((f) => f.canvas.width));
  const fh = Math.max(...frames.map((f) => f.canvas.height));
  const gap = 4;
  const strip = new Canvas((fw * scale + gap) * frames.length + gap, fh * scale + gap * 2 + 12);
  // a ground line under the feet so contact pixels can be read against it
  frames.forEach((f, i) => {
    const x = gap + i * (fw * scale + gap);
    const groundY = gap + f.origin[1] * scale + scale;
    for (let gx = 0; gx < fw * scale; gx++) strip.set(x + gx, groundY, 0x50c878, 120);
    // origin tick (feet anchor)
    for (let t = 0; t < 6; t++) strip.set(x + f.origin[0] * scale, groundY + t, 0xf2d580, 255);
    strip.blit(f.canvas, x, gap, scale);
  });
  fs.writeFileSync(path.join(SHEETS, `${packName}-${anim}.png`), strip.png());
  // onion skin: all frames over each other, later frames stronger
  const onion = new Canvas(fw * scale + gap * 2, fh * scale + gap * 2);
  frames.forEach((f, i) => {
    const a = Math.round(60 + (195 * i) / Math.max(1, frames.length - 1));
    for (let y = 0; y < f.canvas.height; y++) {
      for (let x = 0; x < f.canvas.width; x++) {
        const k = (y * f.canvas.width + x) * 4;
        if (!f.canvas.data[k + 3]) continue;
        const c = (f.canvas.data[k] << 16) | (f.canvas.data[k + 1] << 8) | f.canvas.data[k + 2];
        for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) onion.set(gap + x * scale + sx, gap + y * scale + sy, c, a);
      }
    }
  });
  fs.writeFileSync(path.join(SHEETS, `${packName}-${anim}-onion.png`), onion.png());
}

// --- CLI ---------------------------------------------------------------------
async function buildAll(only) {
  const registry = await loadRegistry();
  const names = only ? [only] : Object.keys(registry.PACKS);
  for (const n of names) {
    const t0 = Date.now();
    const r = await buildPack(n, registry);
    console.log(`atlas ${n}: ${r.frames} frames, ${r.animations} anims, ${r.width}x${r.height}  (${Date.now() - t0} ms)`);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
  await buildAll(only);
  if (args.includes('--watch')) {
    console.log('watching src/art and src/data/rigs …');
    let timer = null;
    const rebuild = (file) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const registry = await loadRegistry();
          // a rig or art file maps to the packs that declare it
          const hit = Object.entries(registry.PACKS).filter(([, d]) => !d.sources || d.sources.some((s) => file.includes(s)));
          for (const [n] of hit.length ? hit : Object.entries(registry.PACKS)) {
            const r = await buildPack(n, registry);
            console.log(`rebuilt ${n} (${r.frames} frames) <- ${file}`);
          }
        } catch (e) {
          console.error('rebuild failed:', e.message);
        }
      }, 120);
    };
    for (const dir of [ART_DIR, RIG_DIR]) {
      fs.watch(dir, { recursive: true }, (_ev, file) => file && file.endsWith('.js') && rebuild(file));
    }
  }
}
