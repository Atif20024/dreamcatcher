// Hand-painted art, dropped in over the painted-in-code art.
//
// public/art/<level>/manifest.json lists texture keys; for each, the loader
// fetches public/art/<level>/<key>.png and registers it under that key. The
// painters (paint.js `paintTexture`) leave any key whose source is a loaded
// image alone, so a PNG replaces its procedural twin with no other change.
// A missing manifest, or a missing file, is simply the painted version.
export function loadArtOverrides(scene, level) {
  const base = `art/${level}/`;
  const mkey = `art-manifest-${level}`;
  scene.load.json(mkey, `${base}manifest.json`);
  scene.load.once(`filecomplete-json-${mkey}`, (_k, _t, list) => {
    if (!Array.isArray(list)) return;
    for (const key of list) if (typeof key === 'string') scene.load.image(key, `${base}${key}.png`);
  });
}
