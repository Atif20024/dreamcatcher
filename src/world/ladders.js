// Ladders ('H') that climb both ways and lead somewhere.
//
//   - a ladder with open air over its head gets a cap: an invisible one-way
//     ledge on its top rung, so Jo climbs out onto it and stands there, and
//     can walk over it (a hatch reads as floor until DOWN is pressed). Before
//     the cap the top rung was nothing to stand on: he popped off the top,
//     fell back into the ladder and either caught it again or dropped the
//     whole shaft.
//   - while Jo is climbing, the plank, cap or one-tile lid over the ladder in
//     his column lets him through (ladderPass), so DOWN on top of a ladder
//     climbs down it instead of pinning him there in the climb pose.
//
// Pure helpers (the Phaser bodies are made by the builders).
import { roleOf } from '../builders/legend.js';

const T = 32;

// a ladder cell whose cell above is open air (and inside the grid): it needs a cap
export function openLadderTop(charAt, x, y) {
  return y > 0 && roleOf(charAt(x, y)) === 'ladder' && roleOf(charAt(x, y - 1)) === 'empty';
}

// the cap's body: a one-way ledge 12 px deep on the top rung's top edge
export function addLadderCap(scene, group, wx, wy) {
  const z = scene.add.zone(wx, wy, T, 12).setOrigin(0, 0);
  scene.physics.add.existing(z, true);
  z.body.checkCollision.down = false;
  z.body.checkCollision.left = false;
  z.body.checkCollision.right = false;
  z.ladderCap = true;
  group.add(z);
  return z;
}

// is this body (one tile deep at most) the plank, cap or lid on Jo's ladder
// column: a rung in its own row (a cap) or right under it (a plank, a lid)?
// A plank under a ladder's foot has neither, so he still lands on it.
export function overLadder(lg, p, body) {
  if (!lg || !body || body.height > T) return false;
  if (p.x < body.left || p.x > body.right) return false;
  const tx = Math.floor(p.x / T);
  // its own row by its bottom edge (a plank's top can sit a little above
  // the row it belongs to)
  const row = Math.floor((body.bottom - 1) / T);
  return !!((lg[row] && lg[row][tx]) || (lg[row + 1] && lg[row + 1][tx]));
}

// a collider's process callback: no collision with the cover over the ladder
// Jo is climbing (he climbs through it, both ways)
export function ladderPass(scene) {
  return (p, o) => !(p.climbing && overLadder(scene.ladderGrid, p, o.body || o));
}

// room over a ladder's head: can a body `h` px tall stand with its feet on
// `surface` (a world y) in column tx? Every tile it would occupy is clear.
// (Player.js asks before stepping Jo out at the head: where it is not, he
// stays on the top rung instead of being shoved back into the shaft and
// re-grabbing it, the loop the roof rib had.)
export function headroomClear(solidAt, tx, surface, h) {
  if (!solidAt) return true;
  const r0 = Math.floor((surface - h) / T);
  const r1 = Math.floor((surface - 1) / T);
  for (let r = r0; r <= r1; r++) if (solidAt(tx, r)) return false;
  return true;
}

// DOWN on a hatch (a cap, a plank or a lid over a ladder) grabs it only on a
// fresh press: one made on the hatch, or just before arriving on it (within
// `grace` ms). Walking across a hatch with DOWN already held does not drop
// Jo into the ladder (ladder review r1, NICE 5).
export const HATCH_PRESS_GRACE_MS = 200;
export function freshDown(pressedAt, overHatchSince, grace = HATCH_PRESS_GRACE_MS) {
  if (pressedAt === null || pressedAt === undefined || overHatchSince === null || overHatchSince === undefined) return false;
  return pressedAt >= overHatchSince - grace;
}
