// Scenarios assert the CORRECT future behaviour. `expect: 'fail'` marks the
// ones that are known-broken today (the redesign's Phase 1 turns them green).
import backgroundSnap from './backgroundSnap.js';
import evaTether from './evaTether.js';
import betCard from './betCard.js';

export const SCENARIOS = [backgroundSnap, evaTether, betCard];
