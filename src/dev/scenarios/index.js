// Scenarios assert the CORRECT future behaviour. `expect: 'fail'` marks the
// ones that are known-broken today (the redesign's Phase 1 turns them green).
import backgroundSnap from './backgroundSnap.js';
import evaTether from './evaTether.js';
import betCard from './betCard.js';
import failure from './failure.js';
import hudScale from './hudScale.js';
import phase14 from './phase14.js';
import phase2 from './phase2.js';

export const SCENARIOS = [...backgroundSnap, evaTether, betCard, ...failure, hudScale, ...phase14, ...phase2];
