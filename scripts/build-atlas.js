#!/usr/bin/env node
// scripts/build-atlas.js — every character reaches the runtime as an atlas
// (plan §2.17, Part D §D11). Three sources, one output format:
//
//   1. rigs      src/art/characters/<id>/manifest.js + src/data/rigs/<rig>.js
//                (+ .poses.js, .portrait.js) → composed, shaded, outlined
//   2. imported  art-src/imported/<pack>/manifest.json (+ PNG sheets),
//                sliced, re-anchored, optionally palette-snapped; licence
//                and credits recorded → public/CREDITS.txt
//   3. placeholders  today's runtime string-art for every other character,
//                captured headless under the SAME texture keys the code uses
//
// Output: public/atlas/<pack>.png + .json (Phaser JSON hash, a custom pivot
// per frame = the foot anchor), public/atlas/index.json, review strips in
// sheets/<rig>-<anim>.png (frames + onion skin + contact marks).
//
//   npm run atlas            rebuild everything
//   node scripts/build-atlas.js --if-stale   skip when the inputs are unchanged
import { register } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

register('./lib/stub-loader.js', import.meta.url);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/atlas');
const SHEETS = path.join(ROOT, 'sheets');
const IMPORTED = path.join(ROOT, 'art-src/imported');
const args = new Set(process.argv.slice(2));

const { encodePNG, decodePNG } = await import('./lib/png.js');
const R = await import('./lib/raster.js');
const { fakeScene } = await import('./lib/capture.js');
const { validateManifest } = await import('../src/core/manifest.js');

// ---- staleness -------------------------------------------------------------
const INPUT_DIRS = ['src/art', 'src/data', 'src/entities', 'src/themes', 'art-src', 'scripts/lib'];
function inputsHash() {
  const h = crypto.createHash('sha1');
  const walk = (d) => {
    const abs = path.join(ROOT, d);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = path.join(d, e.name);
      if (e.isDirectory()) walk(rel);
      else if (/\.(js|json|png)$/.test(e.name)) h.update(rel).update(fs.readFileSync(path.join(ROOT, rel)));
    }
  };
  INPUT_DIRS.forEach(walk);
  h.update(fs.readFileSync(fileURLToPath(import.meta.url)));
  return h.digest('hex');
}
const HASH = inputsHash();
if (args.has('--if-stale')) {
  try {
    const idx = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));
    if (idx.inputsHash === HASH && idx.packs.every((p) => fs.existsSync(path.join(ROOT, 'public', p.png)))) {
      console.log('[atlas] up to date');
      process.exit(0);
    }
  } catch {
    /* no index yet: build */
  }
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SHEETS, { recursive: true });

// ---- helpers ---------------------------------------------------------------
const pad2 = (n) => String(n).padStart(2, '0');
function lettersToImage(g, palette, recolor = {}) {
  const img = R.image(g.w, g.h);
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      let ch = g.px[y * g.w + x];
      if (!ch) continue;
      ch = recolor[ch] || ch;
      const c = palette[ch];
      if (c === undefined) throw new Error(`no palette colour for '${ch}'`);
      R.setPx(img, x, y, c);
    }
  return img;
}
function rowsToImage(rows, palette) {
  const img = R.image(rows[0].length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && palette[ch] !== undefined && R.setPx(img, x, y, palette[ch])));
  return img;
}
// trim to the opaque box; the pivot keeps the anchor where it was
function trimmed(img, ax, ay) {
  const b = R.bbox(img);
  if (!b) return null;
  return { img: R.crop(img, b.x, b.y, b.w, b.h), pivot: { x: (ax - b.x) / b.w, y: (ay - b.y) / b.h } };
}

function writePack(key, frames, meta = {}) {
  // dedupe identical frames onto one rect
  const byHash = new Map();
  const items = [];
  for (const f of frames) {
    const h = R.hashImage(f.img);
    if (!byHash.has(h)) {
      const it = { img: f.img };
      byHash.set(h, it);
      items.push(it);
    }
    f.rect = byHash.get(h);
  }
  const sheet = R.pack(items, 2048);
  const json = { frames: {}, meta: { app: 'dreamcatcher build-atlas', image: `${key}.png`, format: 'RGBA8888', size: { w: sheet.width, h: sheet.height }, scale: '1', ...meta } };
  for (const f of frames) {
    const { x, y } = f.rect;
    const { width: w, height: h } = f.img;
    json.frames[f.name] = {
      frame: { x, y, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      ...(f.pivot ? { anchor: { x: +f.pivot.x.toFixed(4), y: +f.pivot.y.toFixed(4) } } : {}),
    };
  }
  fs.writeFileSync(path.join(OUT, `${key}.png`), encodePNG(sheet));
  fs.writeFileSync(path.join(OUT, `${key}.json`), JSON.stringify(json));
  return { key, png: `atlas/${key}.png`, json: `atlas/${key}.json`, frames: frames.length, unique: items.length, size: [sheet.width, sheet.height] };
}

// review strip: frames on a ground line at the game's scale, an onion skin,
// the planted feet marked; tile ticks every 32 px for scale
function reviewStrip(file, cells, cellW, cellH, groundY, contacts = []) {
  const n = cells.length;
  const img = R.image(cellW * (n + 1), cellH);
  for (let y = 0; y < cellH; y++)
    for (let x = 0; x < img.width; x++) {
      const cell = Math.floor(x / cellW);
      const bg = y >= groundY ? 0x6c6458 : cell === n ? 0xd8d4cc : cell % 2 ? 0xb4b8c0 : 0xc4c8d0;
      R.setPx(img, x, y, bg);
      if (y === groundY) R.setPx(img, x, y, 0x3c8c3c);
      if (y > groundY && x % 32 === 0) R.setPx(img, x, y, 0x50483e);
    }
  cells.forEach((c, i) => {
    if (c) R.blit(img, c, i * cellW, 0);
    // the onion skin: every frame faintly in the last cell
    if (c) {
      const ghost = R.image(c.width, c.height);
      ghost.data.set(c.data);
      for (let p = 3; p < ghost.data.length; p += 4) ghost.data[p] = Math.round(ghost.data[p] * 0.32);
      R.blit(img, ghost, n * cellW, 0);
    }
    for (const cx of contacts[i] || []) for (let d = -1; d <= 1; d++) R.setPx(img, i * cellW + cx + d, groundY + 2, 0xe02828), R.setPx(img, i * cellW + cx, groundY + 2 + d + 1, 0xe02828);
  });
  fs.writeFileSync(file, encodePNG(img));
}

// ---- 1. rig characters ------------------------------------------------------
const index = { version: 1, inputsHash: HASH, packs: [], characters: {}, aliases: {}, placeholders: {}, credits: [] };
const charDir = path.join(ROOT, 'src/art/characters');
const { composeHuman } = await import('../src/art/rig/human.js');

for (const id of fs.readdirSync(charDir)) {
  const mf = path.join(charDir, id, 'manifest.js');
  if (!fs.existsSync(mf)) continue;
  const manifest = (await import(pathToFileURL(mf).href)).default;
  if (manifest.source !== 'rig') continue;
  const rig = (await import(pathToFileURL(path.join(ROOT, 'src/data/rigs', `${manifest.rig}.js`)).href)).default;
  const { POSES } = await import(pathToFileURL(path.join(ROOT, 'src/data/rigs', `${manifest.rig}.poses.js`)).href);
  const counts = Object.fromEntries(Object.keys(manifest.animations).map((a) => [a, (POSES[a] || []).length]));
  const errors = validateManifest(manifest, counts);
  if (errors.length) {
    console.error(`[atlas] ${id} manifest:\n  ${errors.join('\n  ')}`);
    process.exit(1);
  }
  const S = manifest.scale || 1;
  const [ax, ay] = manifest.anchor;
  const frames = [];
  const frameData = {};
  for (const outfit of manifest.outfits) {
    const recolor = rig.outfits[outfit] || {};
    for (const anim of Object.keys(manifest.animations)) {
      const cells = [];
      const marks = [];
      POSES[anim].forEach((pose, i) => {
        const comp = composeHuman(rig, pose);
        const body = R.scaleNearest(lettersToImage(comp.body, rig.palette, recolor), S);
        const name = `${id}/${outfit}/side/${anim}/${pad2(i)}`;
        const t = trimmed(body, ax * S, ay * S);
        frames.push({ name, ...t });
        const hatImg = R.scaleNearest(lettersToImage(comp.hat, rig.palette, recolor), S);
        const th = trimmed(hatImg, ax * S, ay * S);
        if (th) frames.push({ name: `${name}/hat`, ...th });
        if (outfit === manifest.outfits[0]) {
          const rel = (p) => (p ? [(p[0] - ax) * S, (p[1] - ay) * S] : null);
          (frameData[anim] ||= []).push({
            hat: !!th,
            attach: Object.fromEntries(Object.entries(comp.attach).map(([k, v]) => [k, rel(v)])),
            contacts: { f: comp.contacts.f == null ? null : comp.contacts.f * S, b: comp.contacts.b == null ? null : comp.contacts.b * S },
          });
          const cell = R.image(64 * S, 64 * S);
          R.blit(cell, body, 0, 0);
          R.blit(cell, hatImg, 0, 0);
          cells.push(cell);
          marks.push([comp.contacts.f, comp.contacts.b].filter((c) => c != null).map((c) => (c + ax) * S));
        }
      });
      if (cells.length) reviewStrip(path.join(SHEETS, `${id}-${anim}.png`), cells, 64 * S, 64 * S, ay * S, marks);
    }
  }
  // portraits
  if (manifest.portraits) {
    const P = await import(pathToFileURL(path.join(ROOT, 'src/data/rigs', `${manifest.rig}.portrait.js`)).href);
    const cells = [];
    for (const expr of manifest.portraits) {
      const img = R.scaleNearest(rowsToImage(P.portraitRows(expr), rig.palette), P.PORTRAIT_SCALE);
      frames.push({ name: `${id}/portrait/${expr}`, img, pivot: { x: 0.5, y: 0.5 } });
      index.aliases[expr === 'neutral' ? `portrait-${id}` : `portrait-${id}-${expr}`] = [id, `${id}/portrait/${expr}`];
      cells.push(img);
    }
    const w = cells[0].width;
    const strip = R.image(w * cells.length + 8 * (cells.length - 1), cells[0].height);
    cells.forEach((c, i) => R.blit(strip, c, i * (w + 8), 0));
    fs.writeFileSync(path.join(SHEETS, `${id}-portraits.png`), encodePNG(R.scaleNearest(strip, 2)));
  }
  const pack = writePack(id, frames);
  index.packs.push({ ...pack, kind: 'character' });
  index.characters[id] = {
    ...manifest,
    texture: id,
    animations: Object.fromEntries(Object.entries(manifest.animations).map(([a, m]) => [a, { ...m, frames: counts[a] }])),
    frameData,
  };
  // the overview: frame 0 of every animation, side by side
  const anims = Object.keys(manifest.animations);
  const ov = R.image(64 * S * 8, 64 * S * Math.ceil(anims.length / 8));
  anims.forEach((a, i) => {
    const comp = composeHuman(rig, POSES[a][Math.min(POSES[a].length - 1, Math.floor(POSES[a].length / 2))]);
    const cx = (i % 8) * 64 * S, cy = Math.floor(i / 8) * 64 * S;
    for (let y = 0; y < 64 * S; y++) for (let x = 0; x < 64 * S; x++) R.setPx(ov, cx + x, cy + y, y >= ay * S ? 0x6c6458 : (i + Math.floor(i / 8)) % 2 ? 0xb4b8c0 : 0xc4c8d0);
    R.blit(ov, R.scaleNearest(lettersToImage(comp.body, rig.palette), S), cx, cy);
    R.blit(ov, R.scaleNearest(lettersToImage(comp.hat, rig.palette), S), cx, cy);
  });
  fs.writeFileSync(path.join(SHEETS, `${id}-overview.png`), encodePNG(ov));
  console.log(`[atlas] ${id}: ${frames.length} frames (${pack.unique} unique), ${anims.length} animations, ${pack.size.join('×')}`);
}

// ---- 2. imported packs ----------------------------------------------------
const { importPack } = await import('./lib/importer.js');
if (fs.existsSync(IMPORTED)) {
  for (const d of fs.readdirSync(IMPORTED, { withFileTypes: true })) {
    if (!d.isDirectory() || !fs.existsSync(path.join(IMPORTED, d.name, 'manifest.json'))) continue;
    const { man, frames } = importPack(path.join(IMPORTED, d.name));
    const pack = writePack(man.pack, frames, { licence: man.licence });
    index.packs.push({ ...pack, kind: 'imported', explode: !!man.explode });
    for (const [alias, frame] of Object.entries(man.aliases || {})) index.aliases[alias] = [man.pack, frame];
    index.credits.push({ pack: man.pack, licence: man.licence, credits: man.credits || '', source: man.source || '' });
    console.log(`[atlas] imported ${man.pack}: ${frames.length} frames (${man.licence})`);
  }
}

// ---- 3. placeholders: today's runtime art, same keys -------------------------
const scene = fakeScene();
const run = async (mod, fn) => {
  const m = await import(pathToFileURL(path.join(ROOT, mod)).href);
  const f = fn.split('.').reduce((o, k) => o[k], m);
  f.call(fn.includes('.') ? m[fn.split('.')[0]] : null, scene);
};
await run('src/entities/foeArt.js', 'createFoeTextures');
await run('src/entities/jo.js', 'createJoTextures');
await run('src/entities/hubArt.js', 'createHubTextures');
await run('src/data/evening/sprites.js', 'createEveningTextures');
await run('src/themes/musician.js', 'musicianTheme.createTextures');
await run('src/themes/chef.js', 'chefTheme.createTextures');
await run('src/themes/astronaut.js', 'astronautTheme.createTextures');
await run('src/data/writer/sprites.js', 'createWriterTextures');
await run('src/data/painter/sprites.js', 'createPainterTextures');
await run('src/data/gambler/sprites.js', 'createGamblerTextures');
const { HUB_PROP_KEYS } = await import(pathToFileURL(path.join(ROOT, 'src/entities/hubArt.js')).href);
const hubProps = new Set(HUB_PROP_KEYS);
const CAST = /^(hub-|ev-(p|x)-|ev-(cat|dog|swallow|pigeon|heron)|wr-p-|pt-p-|gm-p-|npc-|portrait-|mus-(critic|walker)|chef-(crawler|cat)|tool-|wr-editor)/;
const FOES = /^foe-/;
const castFrames = [];
const foeFrames = [];
const runtimeOnly = [];
for (const [key, rec] of scene.store) {
  const isFoe = FOES.test(key);
  const isCast = !isFoe && CAST.test(key) && !hubProps.has(key) && key !== 'hub-rain' && !key.endsWith('-tmp');
  if (!isFoe && !isCast) continue;
  if (rec.unsupported) {
    runtimeOnly.push(`${key} (${rec.unsupported})`);
    continue;
  }
  (isFoe ? foeFrames : castFrames).push({ name: key, img: rec.img });
}
const castPack = writePack('cast', castFrames);
const foePack = writePack('foes', foeFrames);
index.packs.push({ ...castPack, kind: 'placeholder', explode: true }, { ...foePack, kind: 'placeholder', explode: true });
index.placeholders = { cast: castFrames.length, foes: foeFrames.length, total: castFrames.length + foeFrames.length, runtimeOnly };
// a contact sheet of every placeholder, for review
{
  const all = [...castFrames, ...foeFrames];
  const cw = 72, chh = 80, cols = 24;
  const sh = R.image(cw * cols, chh * Math.ceil(all.length / cols));
  all.forEach((f, i) => {
    const cx = (i % cols) * cw, cy = Math.floor(i / cols) * chh;
    for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) R.setPx(sh, cx + x, cy + y, (i + Math.floor(i / cols)) % 2 ? 0xb4b8c0 : 0xc4c8d0);
    const img = f.img.width > cw || f.img.height > chh ? R.crop(f.img, 0, 0, Math.min(cw, f.img.width), Math.min(chh, f.img.height)) : f.img;
    R.blit(sh, img, cx + Math.floor((cw - img.width) / 2), cy + chh - img.height);
  });
  fs.writeFileSync(path.join(SHEETS, 'placeholders.png'), encodePNG(sh));
}
console.log(`[atlas] placeholders: ${castFrames.length} cast + ${foeFrames.length} foe frames; runtime-only: ${runtimeOnly.length}`);

// ---- index + credits ---------------------------------------------------------
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
const credits = ['Dreamcatcher art credits (generated by scripts/build-atlas.js)', '', 'Characters, rigs and portraits: drawn in code for this project (no third-party art).'];
for (const c of index.credits) credits.push('', `${c.pack} — licence: ${c.licence}`, c.credits, c.source).filter(Boolean);
fs.writeFileSync(path.join(ROOT, 'public/CREDITS.txt'), `${credits.join('\n')}\n`);
// the old hand-made atlases are superseded by the rig build
for (const old of ['jo.meta.json', 'foes.meta.json', 'hub.meta.json', 'hub.png', 'hub.json']) fs.rmSync(path.join(OUT, old), { force: true });
console.log(`[atlas] wrote ${index.packs.length} packs → public/atlas/index.json`);
