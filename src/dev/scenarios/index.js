// Scenarios assert the CORRECT future behaviour. `expect: 'fail'` marks the
// ones that are known-broken today (the redesign's Phase 1 turns them green).
import backgroundSnap from './backgroundSnap.js';
import evaTether from './evaTether.js';
import betCard from './betCard.js';
import failure from './failure.js';
import hudScale from './hudScale.js';
import phase14 from './phase14.js';
import phase2 from './phase2.js';
import phase3 from './phase3.js';
import round2 from './round2.js';
import round2flow from './round2flow.js';
import readability from './readability.js';
import scale from './scale.js';
import wp3 from './wp3.js';

export const SCENARIOS = [...backgroundSnap, evaTether, betCard, ...failure, hudScale, ...phase14, ...phase2, ...phase3, ...round2, ...round2flow, ...readability, ...scale, ...wp3];

// round 2 WP4: backdrops at the depth rule, trees at real height, the Evening's budget
import backdrops from './backdrops.js';
SCENARIOS.push(...backdrops);
// THE STOPPED HOUR on platform 9 (the proof dream, made a train)
import proofTrain from './proofTrain.js';
SCENARIOS.push(...proofTrain);
// round 2 WP6: the identity system (lamps, the board, the wipe, the chime, Jo's contrast)
import wp6 from './wp6.js';
SCENARIOS.push(...wp6);
// Phase 3b: THE BIG STAGE on the framework (the Musician rebuilt)
import musician from './musician.js';
SCENARIOS.push(...musician);
// THE MASTER'S LADDER on the framework (the painter rebuilt)
import painter from './painter.js';
SCENARIOS.push(...painter);
// feedback 3: restarts, volumes, the reading panel, Jo's light and locator, ladder jumps
import feedback3 from './feedback3.js';
SCENARIOS.push(...feedback3);
// room transitions: a dip through dark inside a drawn frame, never a blend
import transitions from './transitions.js';
SCENARIOS.push(...transitions);
// the station's soft-lock: every roof drop has a way back, and a safety net
import softlock from './softlock.js';
SCENARIOS.push(...softlock);
// THE QUIET ABOVE's pool at Jo's scale: 2 m hoops, a deep pool, the climb out
import astroPool from './astroPool.js';
SCENARIOS.push(...astroPool);
// THE LAST HAND on the framework (the gambler rebuilt aboard the Lantern Queen)
import gambler from './gambler.js';
SCENARIOS.push(...gambler);
