// The importer path for outside art (plan §2.17.2): art-src/imported/<pack>/
// manifest.json + PNG sheets → named frames with a foot pivot. Each pack
// must declare its licence; credits are aggregated into public/CREDITS.txt.
//
// manifest.json:
// { "pack": "jo_portraits_v1", "licence": "CC0", "credits": "…", "source": "…",
//   "scale": 1, "palette": ["#1a1828", …]            (optional: snap colours)
//   "sheets": [{ "file": "walk.png", "frameWidth": 32, "frameHeight": 48,
//                "anchor": [16, 47] | "auto", "prefix": "npc/street/side",
//                "animations": { "walk": { "from": 0, "count": 8 }, "idle": [8, 9] } }],
//   "images": [{ "file": "smile.png", "name": "jo/portrait/smile", "anchor": [0.5, 0.5] }],
//   "aliases": { "portrait-jo-smile": "jo/portrait/smile" }, "explode": false }
import fs from 'node:fs';
import path from 'node:path';
import * as R from './raster.js';
import { decodePNG } from './png.js';

const pad2 = (n) => String(n).padStart(2, '0');
export function trimmed(img, ax, ay) {
  const b = R.bbox(img);
  if (!b) return null;
  return { img: R.crop(img, b.x, b.y, b.w, b.h), pivot: { x: (ax - b.x) / b.w, y: (ay - b.y) / b.h } };
}

export function importPack(dir) {
  const man = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  if (!man.pack || !man.licence) throw new Error(`${dir}: manifest needs "pack" and "licence"`);
  const scale = man.scale || 1;
  const snap = man.palette ? man.palette.map((h) => parseInt(String(h).replace('#', ''), 16)) : null;
  const frames = [];
  const quantise = (img) => {
    if (!snap) return img;
    for (let p = 0; p < img.data.length; p += 4) {
      if (!img.data[p + 3]) continue;
      let best = snap[0], bd = Infinity;
      for (const c of snap) {
        const d = ((c >> 16) - img.data[p]) ** 2 + (((c >> 8) & 255) - img.data[p + 1]) ** 2 + ((c & 255) - img.data[p + 2]) ** 2;
        if (d < bd) [bd, best] = [d, c];
      }
      img.data[p] = best >> 16;
      img.data[p + 1] = (best >> 8) & 255;
      img.data[p + 2] = best & 255;
      img.data[p + 3] = 255;
    }
    return img;
  };
  for (const sh of man.sheets || []) {
    const src = decodePNG(fs.readFileSync(path.join(dir, sh.file)));
    const fw = sh.frameWidth, fh = sh.frameHeight;
    const cols = Math.floor(src.width / fw);
    const cellAt = (i) => R.crop(src, (i % cols) * fw, Math.floor(i / cols) * fh, fw, fh);
    for (const [anim, spec] of Object.entries(sh.animations || {})) {
      const idx = Array.isArray(spec) ? spec : Array.from({ length: spec.count }, (_, k) => spec.from + k);
      idx.forEach((ci, n) => {
        const cell = quantise(cellAt(ci));
        // the foot anchor: given, or the bottom-most opaque row's centre
        let [axx, ayy] = sh.anchor === 'auto' || !sh.anchor ? [null, null] : sh.anchor;
        if (axx == null) {
          const b = R.bbox(cell) || { x: 0, y: 0, w: fw, h: fh };
          axx = b.x + b.w / 2;
          ayy = b.y + b.h;
        }
        const img = R.scaleNearest(cell, scale);
        const t = trimmed(img, axx * scale, ayy * scale) || { img, pivot: { x: 0.5, y: 1 } };
        frames.push({ name: `${sh.prefix || man.pack}/${anim}/${pad2(n)}`, ...t });
      });
    }
  }
  for (const im of man.images || []) {
    const img = R.scaleNearest(quantise(decodePNG(fs.readFileSync(path.join(dir, im.file)))), im.scale || scale);
    frames.push({ name: im.name, img, pivot: { x: (im.anchor || [0.5, 0.5])[0], y: (im.anchor || [0.5, 0.5])[1] } });
  }
  return { man, frames };
}
