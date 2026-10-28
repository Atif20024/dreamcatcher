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
