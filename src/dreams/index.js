// Framework dreams (plan 4.1): DreamDefinitions played by DreamScene.
// THE STOPPED HOUR (clockmaker) began as the framework's proof dream; it is
// now a train on platform 9. `proof` stays as a warp alias. THE BIG STAGE
// (musician) is the reference dream rebuilt on the framework (phase 3b);
// the old MusicianScene stays behind ?legacy=1 for comparison.
import clockmaker from './clockmaker/dream.js';
import musician from './musician/dream.js';
// THE MASTER'S LADDER (painter, platform 5) replaces THE YELLOW HOUSE; the
// old PainterScene stays behind ?legacy=1 / ?warp=painter_legacy
import painter from './painter/dream.js';
// THE LAST HAND (gambler, platform 7): the Lantern Queen, 1884, replaces the
// neon casino; the old GamblerScene stays behind ?legacy=1 / ?warp=gambler_legacy
import gambler from './gambler/dream.js';

export const FRAMEWORK_DREAMS = { clockmaker, musician, painter, gambler };

// old ids that still resolve (?warp=proof:start)
export const DREAM_ALIASES = { proof: 'clockmaker' };

export function frameworkDream(id) {
  return FRAMEWORK_DREAMS[id] || FRAMEWORK_DREAMS[DREAM_ALIASES[id]] || null;
}
