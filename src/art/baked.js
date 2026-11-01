// The runtime side of the atlas pipeline. BootScene loads public/atlas/
// index.json and every pack; this module answers "is there baked art for
// this key?" so the texture creators (createPixelTexture, paintRig, …) use
// the atlas pixels and only paint at runtime as a fallback. Code keeps using
// the same texture keys — it never branches on where the art came from.

import { ownerOf, PLACE_OWNERS } from './packOwners.js';

let INDEX = null;
const OWNER = new Map(); // placeholder texture key → atlas pack key
const ALIAS = new Map(); // legacy key → [atlas key, frame]
const RIG_PACKS = new Set(); // the people: drawn straight from their pack (shareFrame)
const stats = { baked: 0, missed: new Set() };
export const artAsked = new Set(); // dev: every person key the game asked for (scenario dream-packs-cover)

export function registerAtlases(textures, index) {
  INDEX = index;
  for (const [k, v] of Object.entries(index.aliases || {})) ALIAS.set(k, v);
  registerPacks(textures);
}

// every pack now in the texture manager answers for its frames
export function registerPacks(textures) {
  for (const p of (INDEX && INDEX.packs) || []) {
    if (!p.explode || !textures.exists(p.key)) continue;
    if (p.kind === 'rig-cast') RIG_PACKS.add(p.key);
    for (const name of textures.get(p.key).getFrameNames()) {
      if (ALIAS.has(name) || OWNER.get(name) === p.key) continue;
      OWNER.set(name, p.key);
      // old string art painted under this key while its pack was away gives way
      if (textures.exists(name) && !textures.get(name).customData.baked) textures.remove(name);
    }
  }
}

// a person whose pack is not loaded just now
export function artAway(textures, key) {
  return !!INDEX && !OWNER.has(key) && (INDEX.packs || []).some((p) => p.owner === ownerOf(key) && !textures.exists(p.key));
}

// the packs a place needs (the hub's are always loaded)
export function packsFor(place) {
  const want = new Set(['hub', ...(PLACE_OWNERS[place] || [])]);
  return ((INDEX && INDEX.packs) || []).filter((p) => want.has(p.owner || 'hub'));
}

// free every pack not in `keep`, and the textures cut from it
export function evictPacks(textures, keep) {
  for (const p of (INDEX && INDEX.packs) || []) {
    if (!p.owner || keep.has(p) || !textures.exists(p.key)) continue;
    for (const name of textures.get(p.key).getFrameNames()) {
      if (OWNER.get(name) !== p.key) continue;
      OWNER.delete(name);
      if (textures.exists(name)) textures.remove(name);
    }
    textures.remove(p.key);
  }
}

export const atlasIndex = () => INDEX;
export const characterManifest = (id) => (INDEX && INDEX.characters && INDEX.characters[id]) || null;
export const artStats = () => ({ placeholders: INDEX ? INDEX.placeholders.total : 0, baked: stats.baked, packs: INDEX ? INDEX.packs.length : 0 });

// a texture made from an atlas frame is flagged so painters leave it alone
export function isBaked(scene, key) {
  if (!scene.textures.exists(key)) return false;
  const t = scene.textures.get(key);
  return !!(t.customData && t.customData.baked);
}

// A person's frame as a texture of its own name that draws from the pack: no
// canvas, no upload, and the cast batches on one bind (it used to cost 1421
// canvases and 30 MB). Keeps the trim and the foot pivot, as an atlas frame does.
function shareFrame(textures, key, pack, fr) {
  const from = textures.get(pack);
  const t = new from.constructor(textures, key, []);
  t.source = from.source;
  const f = t.add('__BASE', fr.sourceIndex, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight);
  if (fr.trimmed) f.setTrim(fr.realWidth, fr.realHeight, fr.x, fr.y, fr.cutWidth, fr.cutHeight);
  if (fr.customPivot) {
    f.customPivot = true;
    f.pivotX = fr.pivotX;
    f.pivotY = fr.pivotY;
  }
  t.customData.baked = true;
  // the source is the pack's: removing this name must not free it
  const destroy = t.destroy;
  t.destroy = function () {
    this.source = [];
    destroy.call(this);
  };
  textures.list[key] = t;
}

// make `key` from its atlas frame if the atlas has one; true when it exists
export function bakeFromAtlas(scene, key) {
  if (import.meta.env && import.meta.env.DEV) artAsked.add(key);
  if (isBaked(scene, key)) return true;
  const pack = OWNER.get(key);
  if (!pack || !scene.textures.exists(pack)) return false;
  const fr = scene.textures.getFrame(pack, key);
  if (!fr) return false;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  if (RIG_PACKS.has(pack)) {
    shareFrame(scene.textures, key, pack, fr);
    stats.baked += 1;
    return true;
  }
  const w = fr.cutWidth;
  const h = fr.cutHeight;
  // a trimmed frame (the rigged cast is packed by its opaque box): restore
  // the full canvas, so the pivot and every caller's origin still hold
  const ss = fr.trimmed && fr.data && fr.data.spriteSourceSize;
  const W = ss ? fr.realWidth : w;
  const H = ss ? fr.realHeight : h;
  const ct = scene.textures.createCanvas(key, W, H);
  ct.context.drawImage(fr.source.image, fr.cutX, fr.cutY, w, h, ss ? ss.x : 0, ss ? ss.y : 0, w, h);
  ct.refresh();
  // the rigged cast carry a foot pivot (scripts/lib/cast-bake.js): keep it, so
  // every image of a person stands on the same floor point whatever its size
  if (fr.customPivot) {
    const f0 = ct.get();
    f0.customPivot = true;
    f0.pivotX = fr.pivotX;
    f0.pivotY = fr.pivotY;
  }
  ct.customData.baked = true;
  stats.baked += 1;
  return true;
}

// [texture, frame] for an art reference: an alias ('portrait-jo'), a plain
// texture key, or null
export function resolveArt(scene, ref) {
  if (!ref) return null;
  const a = ALIAS.get(ref);
  if (a && scene.textures.exists(a[0])) return a;
  if (scene.textures.exists(ref)) return [ref, undefined];
  if (bakeFromAtlas(scene, ref)) return [ref, undefined];
  return null;
}

// a person frame by key: the texture, baked from the atlas on first use (new
// animation frames — talk, idle, foe windup — have no runtime painter)
export function castFrame(scene, key) {
  if (import.meta.env && import.meta.env.DEV) artAsked.add(key);
  return scene.textures.exists(key) || bakeFromAtlas(scene, key) ? key : null;
}

// a physics image of a rigged person: Jo's body size at the feet (the frame
// is taller than the old 48 px sprite; the body must not be)
export function personBody(img, w = 24, h = 46) {
  if (!img || !img.body || !img.frame || !img.frame.customPivot) return img;
  img.body.setSize(w, h, false);
  img.body.setOffset((img.width - w) / 2, img.height - h);
  return img;
}
