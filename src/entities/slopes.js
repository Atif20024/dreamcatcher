// Kept for the old import path: the snapping resolver this file held is
// replaced by the continuous ground solver (round 2, §10.2; see ground.js).
// Returns true when the walker was laid on a surface this frame.
import { solveGround } from './ground.js';

export function resolveSlope(scene, sprite, body, dtSec) {
  return solveGround(scene, sprite, body, dtSec);
}
