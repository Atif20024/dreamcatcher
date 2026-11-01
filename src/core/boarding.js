// What a train needs before it leaves (SPEED_REPORT round 2): the atlas packs
// of the place it goes to. Started when Jo commits at the door; the train wipe
// holds at full cover until it is done, and a failure leaves him at the station.
//
//   const ready = prepareDream(hubScene, 'gambler');
//   trainWipe(hub, () => ready.then(startIt, showWhy), ...)
import { packsFor, evictPacks, registerPacks } from '../art/baked.js';

export function prepareDream(scene, place) {
  const want = packsFor(place);
  // (a dev page loads everything at boot, for warps: nothing to do)
  if (!scene.registry.get('leanPacks')) return Promise.resolve();
  const tm = scene.textures;
  evictPacks(tm, new Set(want));
  const missing = want.filter((p) => !tm.exists(p.key));
  if (!missing.length) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const L = scene.load;
    let failed = null;
    const onError = (file) => (failed = file.key);
    L.on('loaderror', onError);
    L.once('complete', () => {
      L.off('loaderror', onError);
      registerPacks(tm);
      if (failed) reject(new Error(`could not load ${failed}`));
      else resolve();
    });
    for (const p of missing) L.atlas(p.key, p.png, p.json);
    L.start();
  });
}
