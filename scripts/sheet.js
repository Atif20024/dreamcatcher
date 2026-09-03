#!/usr/bin/env node
// motion skill §7 step 3:  node scripts/sheet.js <rig> <anim>
// Composes every frame of one animation and writes sheets/<rig>-<anim>.png
// (a strip with a ground line and the feet anchor) plus an onion-skin image.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { rasterize, writeStrip } from './build-atlas.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [rigName, anim] = process.argv.slice(2);
if (!rigName || !anim) {
  console.error('usage: node scripts/sheet.js <rig> <anim>');
  process.exit(1);
}
const { frames: composeFrames, footContacts } = await import(pathToFileURL(path.join(ROOT, 'src', 'art', 'Rig.js')).href);
const { colorOf } = await import(pathToFileURL(path.join(ROOT, 'src', 'data', 'palettes.js')).href);
const rig = (await import(pathToFileURL(path.join(ROOT, 'src', 'data', 'rigs', `${rigName}.js`)).href)).default;
const grids = composeFrames(rig, anim);
const frames = grids.map((g, i) => ({ name: `${anim}_${i}`, canvas: rasterize(g, rig.palette, colorOf), origin: rig.origin }));
writeStrip(rigName, anim, frames);
console.log(`sheets/${rigName}-${anim}.png  (${frames.length} frames)  contacts: ${footContacts(rig, anim).join(' ')}`);
