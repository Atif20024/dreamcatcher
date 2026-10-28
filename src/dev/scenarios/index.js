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

export const SCENARIOS = [...backgroundSnap, evaTether, betCard, ...failure, hudScale, ...phase14, ...phase2, ...phase3, ...round2, ...round2flow, ...readability, ...scale];

// round 2 WP4: backdrops at the depth rule, trees at real height, the Evening's budget
import backdrops from './backdrops.js';
SCENARIOS.push(...backdrops);
