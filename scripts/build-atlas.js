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
    // a trimmed frame (the rigged cast): packed by its opaque box, the full
    // canvas restored at runtime (src/art/baked.js) so feet stay on the pivot
    if (f.trim && !f.src) {
      const b = R.bbox(f.img);
      f.src = { w: f.img.width, h: f.img.height, x: b ? b.x : 0, y: b ? b.y : 0 };
      f.packImg = b ? R.crop(f.img, b.x, b.y, b.w, b.h) : f.img;
    }
    const pimg = f.packImg || f.img;
    const h = R.hashImage(pimg);
    if (!byHash.has(h)) {
      const it = { img: pimg };
      byHash.set(h, it);
      items.push(it);
    }
    f.rect = byHash.get(h);
  }
  const sheet = R.pack(items, 2048);
  const json = { frames: {}, meta: { app: 'dreamcatcher build-atlas', image: `${key}.png`, format: 'RGBA8888', size: { w: sheet.width, h: sheet.height }, scale: '1', ...meta } };
  for (const f of frames) {
    const { x, y } = f.rect;
    const { width: w, height: h } = f.packImg || f.img;
    json.frames[f.name] = {
      frame: { x, y, w, h },
      rotated: false,
      trimmed: !!f.src,
      spriteSourceSize: f.src ? { x: f.src.x, y: f.src.y, w, h } : { x: 0, y: 0, w, h },
      sourceSize: f.src ? { w: f.src.w, h: f.src.h } : { w, h },
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
  if (file) fs.writeFileSync(file, encodePNG(img));
  return img;
}
// strips stacked into one sheet (walk over run, …)
function stackSheets(file, imgs) {
  const w = Math.max(...imgs.map((i) => i.width));
  const out = R.image(w, imgs.reduce((a, i) => a + i.height + 4, -4));
  let y = 0;
  for (const i of imgs) {
    R.blit(out, i, 0, y);
    y += i.height + 4;
  }
  fs.writeFileSync(file, encodePNG(out));
}

// ---- 1. rig characters ------------------------------------------------------
const index = { version: 1, inputsHash: HASH, packs: [], characters: {}, aliases: {}, placeholders: {}, credits: [] };
const STRIPS = {};
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
      if (cells.length) STRIPS[`${id}-${anim}`] = reviewStrip(path.join(SHEETS, `${id}-${anim}.png`), cells, 64 * S, 64 * S, ay * S, marks);
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

// Phase 2 motion: Jo's walk over his run, and his weight changes, one sheet each
if (STRIPS['jo-walk'] && STRIPS['jo-run']) stackSheets(path.join(SHEETS, 'jo-walk-vs-run.png'), [STRIPS['jo-walk'], STRIPS['jo-jog'], STRIPS['jo-run']].filter(Boolean));
if (STRIPS['jo-turn']) stackSheets(path.join(SHEETS, 'jo-start-stop-turn.png'), [STRIPS['jo-run_start'], STRIPS['jo-skid'], STRIPS['jo-turn']].filter(Boolean));

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
// the people: rebuilt as rigs at Jo's scale (round 2 WP2), same keys + new frames
const { bakeCast } = await import('./lib/cast-bake.js');
const rigged = await bakeCast(ROOT, scene.store);
const riggedNames = new Set(rigged.frames.map((f) => f.name));
// a rigged person's old walk frames beyond the rig's cycle (a kid walks on 6
// now) must not survive as old-scale string art
const riggedKeys = new Set(rigged.report.map((r) => r.key));
const staleWalk = (n) => {
  const m = /^(.*?)(-free|-walk)?#\d+$/.exec(n);
  return !!m && riggedKeys.has(m[1]);
};
const keepPlain = (arr) => arr.filter((f) => !riggedNames.has(f.name) && !staleWalk(f.name));
const castPlain = keepPlain(castFrames);
const foePlain = keepPlain(foeFrames);
const castRig = rigged.frames.filter((f) => !f.foe);
const foeRig = rigged.frames.filter((f) => f.foe);
// packs stay within 2048×2048: chunk by area
function writePacks(base, frames, kind) {
  const chunks = [[]];
  let area = 0;
  for (const f of frames) {
    if (f.trim && !f.src) {
      const b = R.bbox(f.img);
      f.src = { w: f.img.width, h: f.img.height, x: b ? b.x : 0, y: b ? b.y : 0 };
      f.packImg = b ? R.crop(f.img, b.x, b.y, b.w, b.h) : f.img;
    }
    const pi = f.packImg || f.img;
    const a = (pi.width + 3) * (pi.height + 3);
    if (area + a > 2048 * 2048 * 0.62 && chunks[chunks.length - 1].length) {
      chunks.push([]);
      area = 0;
    }
    chunks[chunks.length - 1].push(f);
    area += a;
  }
  chunks.forEach((c, i) => index.packs.push({ ...writePack(i ? `${base}${i + 1}` : base, c), kind, explode: true }));
}
for (const old of fs.readdirSync(OUT)) if (/^(cast|foes|people)\d*\.(png|json)$/.test(old)) fs.rmSync(path.join(OUT, old));
writePacks('cast', castPlain, 'placeholder');
writePacks('foes', foePlain, 'placeholder');
writePacks('people', [...castRig, ...foeRig], 'rig-cast');
index.placeholders = { cast: castPlain.length, foes: foePlain.length, total: castPlain.length + foePlain.length, rigged: rigged.frames.length, runtimeOnly };
index.castReport = rigged.report;
index.gaits = rigged.gaits;
castFrames.length = 0;
castFrames.push(...castPlain, ...castRig);
foeFrames.length = 0;
foeFrames.push(...foePlain, ...foeRig);
// a contact sheet of every placeholder, for review
{
  const all = [...castPlain, ...foePlain];
  const cw = 96, chh = 100, cols = 24;
  const sh = R.image(cw * cols, chh * Math.ceil(all.length / cols));
  all.forEach((f, i) => {
    const cx = (i % cols) * cw, cy = Math.floor(i / cols) * chh;
    for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) R.setPx(sh, cx + x, cy + y, (i + Math.floor(i / cols)) % 2 ? 0xb4b8c0 : 0xc4c8d0);
    const img = f.img.width > cw || f.img.height > chh ? R.crop(f.img, 0, 0, Math.min(cw, f.img.width), Math.min(chh, f.img.height)) : f.img;
    R.blit(sh, img, cx + Math.floor((cw - img.width) / 2), cy + chh - img.height);
  });
  fs.writeFileSync(path.join(SHEETS, 'placeholders.png'), encodePNG(sh));
}
// the cast line-up: Jo, then each person's key frames, on a ground line
{
  const byName = new Map(rigged.frames.map((f) => [f.name, f]));
  const joComp = composeHuman((await import('../src/data/rigs/jo.js')).default, { fF: [1, 0, 'flat'], fB: [-1, 0, 'flat'], aF: [-4, 10], aB: [6, 12] });
  const joRig = (await import('../src/data/rigs/jo.js')).default;
  const joBody = R.scaleNearest(lettersToImage(joComp.body, joRig.palette), 2);
  const joHat = R.scaleNearest(lettersToImage(joComp.hat, joRig.palette), 2);
  const want = (k) => [k, `${k}-idle#3`, `${k}#2`, `${k}#6`, `${k}-walk#2`, `${k}-run#3`, `${k}-talk#2`, `${k}-wave#2`, `${k}-sit`, `${k}-laugh`, `${k}-alert#1`, `${k}-alert#3`, `${k}-windup#3`, `${k}-grab#1`, `${k}-throw#2`, `${k}-search#1`, `${k}-stagger#1`].filter((n) => byName.has(n));
  const rows = rigged.report.map((r) => want(r.key));
  const cw = 84, chh = 100, cols = 18;
  const sh = R.image(cw * cols, chh * rows.length);
  rows.forEach((names, ri) => {
    for (let y = 0; y < chh; y++) for (let x = 0; x < sh.width; x++) R.setPx(sh, x, ri * chh + y, y >= chh - 6 ? 0x6c6458 : ri % 2 ? 0xb4b8c0 : 0xc4c8d0);
    for (let x = 0; x < sh.width; x += 32) for (let y = chh - 5; y < chh; y++) R.setPx(sh, x, ri * chh + y, 0x50483e);
    // Jo for scale (feet on the line)
    R.blit(sh, joBody, Math.floor((cw - 128) / 2), ri * chh + chh - 6 - 116);
    R.blit(sh, joHat, Math.floor((cw - 128) / 2), ri * chh + chh - 6 - 116);
    names.forEach((n, i) => {
      const f = byName.get(n);
      R.blit(sh, f.img, (i + 1) * cw + Math.floor((cw - f.img.width) / 2), ri * chh + chh - 6 - f.img.height);
    });
  });
  fs.writeFileSync(path.join(SHEETS, 'cast-lineup.png'), encodePNG(sh));
  // gait strips (phase 2 motion): walk, run and the signature idle of a few
  // people, with the planted-foot contacts marked — the feet must not slide
  for (const k of ['foe-bouncer', 'foe-guard', 'foe-landlady', 'foe-scalper', 'foe-sous-chef', 'foe-roadie', 'ev-p-kite', 'ev-p-baker', 'npc-nia']) {
    const g = rigged.gaits[k];
    if (!g) continue;
    const strip = (names) => {
      const fs_ = names.map((n) => byName.get(n)).filter(Boolean);
      if (!fs_.length) return null;
      const cw2 = Math.max(...fs_.map((f) => f.img.width)) + 8;
      const ch2 = Math.max(...fs_.map((f) => f.img.height)) + 4;
      const cells = fs_.map((f) => {
        const c = R.image(cw2, ch2);
        R.blit(c, f.img, Math.floor((cw2 - f.img.width) / 2), ch2 - f.img.height);
        return c;
      });
      const marks = fs_.map((f) => (f.contacts || []).map((x) => Math.floor((cw2 - f.img.width) / 2) + x));
      return reviewStrip(null, cells, cw2, ch2 + 8, ch2, marks);
    };
    const rowsG = [
      strip(Array.from({ length: g.walk[0] }, (_, i) => `${k}#${i + 1}`)),
      g.run && strip(Array.from({ length: g.run[0] }, (_, i) => `${k}-run#${i + 1}`)),
      strip(Array.from({ length: g.idle[0] }, (_, i) => `${k}-idle#${i + 1}`)),
      strip([`${k}-alert#1`, `${k}-alert#2`, `${k}-alert#3`, `${k}-windup#1`, `${k}-windup#2`, `${k}-windup#3`, `${k}-grab#1`, `${k}-grab#2`]),
      strip([`${k}~b`, `${k}~b#2`, `${k}~b-run#3`, `${k}~b-idle#4`]),
    ].filter(Boolean);
    stackSheets(path.join(SHEETS, `gait-${k}.png`), rowsG);
  }
}
console.log(`[atlas] placeholders: ${castPlain.length} cast + ${foePlain.length} foe frames; rigged cast: ${rigged.frames.length} frames (${rigged.report.length} people); runtime-only: ${runtimeOnly.length}`);

// ---- index + credits ---------------------------------------------------------
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
const credits = ['Dreamcatcher art credits (generated by scripts/build-atlas.js)', '', 'Characters, rigs and portraits: drawn in code for this project (no third-party art).'];
for (const c of index.credits) credits.push('', `${c.pack} — licence: ${c.licence}`, c.credits, c.source).filter(Boolean);
fs.writeFileSync(path.join(ROOT, 'public/CREDITS.txt'), `${credits.join('\n')}\n`);
// the old hand-made atlases are superseded by the rig build
for (const old of ['jo.meta.json', 'foes.meta.json', 'hub.meta.json', 'hub.png', 'hub.json']) fs.rmSync(path.join(OUT, old), { force: true });
console.log(`[atlas] wrote ${index.packs.length} packs → public/atlas/index.json`);
