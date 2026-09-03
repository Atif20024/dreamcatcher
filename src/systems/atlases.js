// D11 — the runtime only ever sees atlases. Scenes call loadAtlases() in
// preload(); frames are named `<anim>_<i>` (or a bare name for stills), and
// atlasFrames() gives an animation's frame list in order.
export const ATLAS_PATH = 'atlas';

// Textures live on the game, not the scene, so a pack is loaded once for
// the whole run. `requested` also covers packs still in flight: a second
// scene starting before the first loader finished would otherwise queue the
// same atlas again and Phaser logs "Texture key already in use".
const requested = new Set();
export function loadAtlases(scene, packs) {
  for (const pack of packs) {
    if (requested.has(pack) || scene.textures.exists(pack)) continue;
    requested.add(pack);
    scene.load.atlas(pack, `${ATLAS_PATH}/${pack}.png`, `${ATLAS_PATH}/${pack}.json`);
  }
}

const cache = new Map();
export function atlasFrames(scene, pack, anim) {
  const key = `${pack}/${anim}`;
  if (cache.has(key)) return cache.get(key);
  const tex = scene.textures.get(pack);
  const names = tex
    .getFrameNames()
    .filter((n) => n.startsWith(`${anim}_`) && /_\d+$/.test(n))
    .sort((a, b) => Number(a.slice(a.lastIndexOf('_') + 1)) - Number(b.slice(b.lastIndexOf('_') + 1)));
  const out = names.length ? names : tex.has(anim) ? [anim] : [];
  cache.set(key, out);
  return out;
}

// per-frame data the build wrote next to the atlas (contacts, stride)
export function atlasMeta(scene, pack) {
  return scene.cache.json.get(`${pack}-meta`) || {};
}
const requestedMeta = new Set();
export function loadAtlasMeta(scene, packs) {
  for (const pack of packs) {
    if (requestedMeta.has(pack) || scene.cache.json.exists(`${pack}-meta`)) continue;
    requestedMeta.add(pack);
    scene.load.json(`${pack}-meta`, `${ATLAS_PATH}/${pack}.meta.json`);
  }
}
