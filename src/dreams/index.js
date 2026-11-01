// Framework dreams (plan 4.1): DreamDefinitions played by DreamScene, each its
// own JS chunk, loaded on boarding (src/core/boarding.js).
// THE STOPPED HOUR (clockmaker) began as the framework's proof dream; it is
// now a train on platform 9. `proof` stays as a warp alias. THE BIG STAGE
// (musician) is the reference dream rebuilt on the framework (phase 3b).
const LOADERS = {
  clockmaker: () => import('./clockmaker/dream.js'),
  musician: () => import('./musician/dream.js'),
  // THE MASTER'S LADDER (painter, platform 5)
  painter: () => import('./painter/dream.js'),
  // THE LAST HAND (gambler, platform 7): the Lantern Queen, 1884
  gambler: () => import('./gambler/dream.js'),
  // FIVE-STAR DREAM (chef, platform 1): Le Rêve, 1957, the ticket rail
  chef: () => import('./chef/dream.js'),
  // THE LONG STRAIGHT (racer, platform 10): the garage; the driving is RaceScene
  racer: () => import('./racer/dream.js'),
};

// the dreams loaded so far: id → the module (default: its definition)
const MODULES = {};
export const FRAMEWORK_DREAMS = {};

// old ids that still resolve (?warp=proof:start)
export const DREAM_ALIASES = { proof: 'clockmaker' };

export async function loadFrameworkDream(id) {
  const key = DREAM_ALIASES[id] || id;
  if (!LOADERS[key] || MODULES[key]) return;
  MODULES[key] = await LOADERS[key]();
  FRAMEWORK_DREAMS[key] = MODULES[key].default;
}

export const loadAllFrameworkDreams = () => Promise.all(Object.keys(LOADERS).map(loadFrameworkDream));

export function frameworkDream(id) {
  return FRAMEWORK_DREAMS[id] || FRAMEWORK_DREAMS[DREAM_ALIASES[id]] || null;
}

// a dream's other exports (the Intro paints with its sky and palette)
export const dreamModule = (id) => MODULES[id] || null;
