// Framework dreams (plan 4.1): DreamDefinitions played by DreamScene.
// THE STOPPED HOUR (clockmaker) began as the framework's proof dream; it is
// now a train on platform 9. `proof` stays as a warp alias. THE BIG STAGE
// (musician) is the reference dream rebuilt on the framework (phase 3b).
import clockmaker from './clockmaker/dream.js';
import musician from './musician/dream.js';
// THE MASTER'S LADDER (painter, platform 5)
import painter from './painter/dream.js';
// THE LAST HAND (gambler, platform 7): the Lantern Queen, 1884
import gambler from './gambler/dream.js';

export const FRAMEWORK_DREAMS = { clockmaker, musician, painter, gambler };

// old ids that still resolve (?warp=proof:start)
export const DREAM_ALIASES = { proof: 'clockmaker' };

export function frameworkDream(id) {
  return FRAMEWORK_DREAMS[id] || FRAMEWORK_DREAMS[DREAM_ALIASES[id]] || null;
}
