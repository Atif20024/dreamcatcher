// Framework dreams (plan 4.1): DreamDefinitions played by DreamScene.
// THE STOPPED HOUR (clockmaker) began as the framework's proof dream; it is
// now a train on platform 9. `proof` stays as a warp alias. THE BIG STAGE
// (musician) is the reference dream rebuilt on the framework (phase 3b);
// the old MusicianScene stays behind ?legacy=1 for comparison.
import clockmaker from './clockmaker/dream.js';
import musician from './musician/dream.js';

export const FRAMEWORK_DREAMS = { clockmaker, musician };

// old ids that still resolve (?warp=proof:start)
export const DREAM_ALIASES = { proof: 'clockmaker' };

export function frameworkDream(id) {
  return FRAMEWORK_DREAMS[id] || FRAMEWORK_DREAMS[DREAM_ALIASES[id]] || null;
}
