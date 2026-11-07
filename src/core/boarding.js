// What a train needs before it leaves (SPEED_REPORT round 2): the JS chunk and
// the atlas packs of the place it goes to. Started when Jo commits at the door;
// the train wipe holds at full cover until it is done, and a failure leaves him
// at the station.
//
//   const ready = prepareDream(hubScene, 'gambler', 'Dream');
//   trainWipe(hub, () => ready.then(startIt, showWhy), ...)
import { packsFor, evictPacks, registerPacks } from '../art/baked.js';
import { loadFrameworkDream, loadAllFrameworkDreams } from '../dreams/index.js';

const SCENES = {
  Dream: () => import('../scenes/DreamScene.js'),
  Astronaut: () => import('../scenes/AstronautScene.js'),
  Writer: () => import('../scenes/WriterScene.js'),
  Evening: () => import('../scenes/EveningScene.js'),
  Race: () => import('../scenes/RaceScene.js'), // the racer's driving, started from a door in its garage
};

async function loadScene(game, key) {
  if (!SCENES[key] || game.scene.getScene(key)) return;
  const mod = await SCENES[key]();
  if (game.scene.getScene(key)) return; // (two boardings raced)
  game.scene.add(key, mod.default, false);
  game.scene.bringToTop('UI'); // the HUD and the wipe stay over it
}

// dev: warps jump straight in, so everything loads at boot
export async function loadEverything(game) {
  await Promise.all([loadAllFrameworkDreams(), ...Object.keys(SCENES).map((k) => loadScene(game, k))]);
}

// a scene's chunk on its own, for a door inside a dream (a failure is the door's to tell)
export const loadSceneChunk = (game, key) => loadScene(game, key);

export function prepareDream(scene, place, sceneKey) {
  const ready = Promise.all([loadScene(scene.game, sceneKey), loadFrameworkDream(place), loadPacks(scene, place)]);
  // the caller reads a failure seconds later, inside the wipe: not an unhandled rejection
  ready.catch(() => {});
  return ready;
}

function loadPacks(scene, place) {
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
