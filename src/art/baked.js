// The runtime side of the atlas pipeline. BootScene loads public/atlas/
// index.json and every pack; this module answers "is there baked art for
// this key?" so the texture creators (createPixelTexture, paintRig, …) use
// the atlas pixels and only paint at runtime as a fallback. Code keeps using
// the same texture keys — it never branches on where the art came from.

let INDEX = null;
const OWNER = new Map(); // placeholder texture key → atlas pack key
const ALIAS = new Map(); // legacy key → [atlas key, frame]
const stats = { baked: 0, missed: new Set() };

export function registerAtlases(textures, index) {
  INDEX = index;
  for (const [k, v] of Object.entries(index.aliases || {})) ALIAS.set(k, v);
  for (const p of index.packs || []) {
    if (!p.explode || !textures.exists(p.key)) continue;
    for (const name of textures.get(p.key).getFrameNames()) if (!ALIAS.has(name)) OWNER.set(name, p.key);
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

// make `key` from its atlas frame if the atlas has one; true when it exists
export function bakeFromAtlas(scene, key) {
  if (isBaked(scene, key)) return true;
  const pack = OWNER.get(key);
  if (!pack || !scene.textures.exists(pack)) return false;
  const fr = scene.textures.getFrame(pack, key);
  if (!fr) return false;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const w = fr.cutWidth;
  const h = fr.cutHeight;
  const ct = scene.textures.createCanvas(key, w, h);
  ct.context.drawImage(fr.source.image, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
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
