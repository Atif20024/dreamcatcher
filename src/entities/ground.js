// Round 2 (§10.2): the continuous ground solver. Arcade has no slopes, so
// anything that walks (Jo, foes, carts) asks here where the ground is under
// the centre of its feet and is laid on it exactly, every frame:
//
//   groundAt(g, x, yMin, yMax)  the highest walkable surface in one column
//                               within [yMin, yMax]: slope tiles (piecewise
//                               linear, continuous across seams), the tops of
//                               live solid tiles with air above, one-way tops
//   solveGround(scene, ...)     a grounded walker is set on that surface
//                               (step-up ≤ 10 px, eased ≤ 4 px a frame past
//                               the gradient; snap-down by the ground covered
//                               this frame), a falling one lands on slopes
//
// Only the foot centre is sampled for height, so a crest, a valley or the top
// and foot of a flight of stairs is one continuous line. The builders turn off
// the side collision of solid tiles flush with a slope's high end
// (legend.crestSides), so Arcade never reads a crest as a wall.
import { slopeSurface } from '../builders/legend.js';

export const T = 32;
export const STEP_UP = 10;
export const MAX_LIFT = 4; // a lip is eased over: at most this much per frame beyond the gradient
// Arcade's own Y separation can lift a body up to its overlap bias (4 px)
// plus a frame of gravity onto a crest tile before the solver runs: the
// snap-down reaches past that so the feet always end on the centre line
export const SNAP_SLACK = 7;

// the collision grids a scene exposes (legacy RoomBuilder scenes and the
// framework's DreamScene both copy them onto the scene)
export function gridsOf(scene) {
  const b = scene.built || {};
  const slopeGrid = scene.slopeGrid || b.slopeGrid;
  const solidGrid = scene.solidGrid || b.solidGrid;
  if (!slopeGrid && !solidGrid) return null;
  const bodies = b.tileBodies || null;
  return {
    slopeGrid: slopeGrid || {},
    solidGrid: solidGrid || {},
    oneWayGrid: scene.oneWayGrid || b.oneWayGrid || {},
    // a tile whose body was switched off (an open gate, an erased floor, a
    // broken crate) is not ground any more
    live: bodies
      ? (tx, ty) => {
          const img = bodies[ty] && bodies[ty][tx];
          return !img || !!(img.active !== false && img.body && img.body.enable);
        }
      : null,
  };
}

const at = (grid, tx, ty) => grid[ty] && grid[ty][tx];

// the walkable surface of one tile cell under column x, or null
export function surfaceInCell(g, tx, ty, x, opts = {}) {
  const role = at(g.slopeGrid, tx, ty);
  if (role) return ty * T + slopeSurface(role, x / T - tx) * T;
  if (opts.slopesOnly) return null;
  const live = g.live || (() => true);
  if (at(g.solidGrid, tx, ty) && live(tx, ty)) {
    const above = (at(g.solidGrid, tx, ty - 1) && live(tx, ty - 1)) || at(g.slopeGrid, tx, ty - 1);
    return above ? null : ty * T;
  }
  const ow = at(g.oneWayGrid, tx, ty);
  if (ow && live(tx, ty)) return typeof ow === 'number' ? ow : ty * T;
  return null;
}

// the highest surface in [yMin, yMax] under column x, or null
export function groundAt(g, x, yMin, yMax, opts = {}) {
  const tx = Math.floor(x / T);
  let best = null;
  // one-way tops may sit a little above their row: look one row further up
  for (let ty = Math.floor(yMin / T) - 1; ty <= Math.floor(yMax / T) + 1; ty++) {
    const s = surfaceInCell(g, tx, ty, x, opts);
    if (s !== null && s >= yMin && s <= yMax && (best === null || s < best)) best = s;
  }
  return best;
}

// dy/dx of the ground at x near y (0 on the flat, −1 up a 45° ramp to the right)
export function gradientAt(g, x, y, reach = 12) {
  const a = groundAt(g, x - 2, y - reach, y + reach);
  const b = groundAt(g, x + 2, y - reach, y + reach);
  if (a === null || b === null) return 0;
  return (b - a) / 4;
}

// Move a body (and its sprite) by dy inside scene update. Arcade writes the
// sprite from the body in its post-update as (position − prevFrame), so the
// frame origin moves with it: the sprite and the body end up moved exactly
// once. (Moving both without prevFrame moved the sprite twice: the old snap
// sank Jo into a ramp, then threw him off its crest.)
export function shiftBody(sprite, body, dy) {
  if (!dy) return;
  body.y += dy;
  if (body.prevFrame) body.prevFrame.y += dy;
  sprite.y += dy;
  if (body.updateCenter) body.updateCenter();
}

// dtSec: the frame's time step (the walk's ground covered sets the snap-down)
export function solveGround(scene, sprite, body, dtSec = 1 / 60) {
  const st = sprite.__ground || (sprite.__ground = { grounded: false, surface: null });
  const g = gridsOf(scene);
  if (!g || !body || !body.enable) {
    st.grounded = false;
    return false;
  }
  const dt = Math.min(Math.max(dtSec || 1 / 60, 1 / 120), 1 / 15);
  const vy = body.velocity.y;
  const x = body.x + body.width / 2;
  const feet = body.bottom;
  const run = Math.abs(body.velocity.x) * dt; // ground covered this frame
  const wasGrounded = st.grounded || body.blocked.down;
  let s = null;
  if (vy >= -10 && wasGrounded) {
    // a walker: stay on the line, up a lip or down a ramp or over a crest
    s = groundAt(g, x, feet - Math.max(STEP_UP, run + MAX_LIFT), feet + run + SNAP_SLACK);
  } else if (vy >= 0) {
    // falling: Arcade lands on solids itself; the solver lands on slopes
    // (the feet crossed the surface this frame, from above or from the side)
    s = groundAt(g, x, feet - (vy * dt + run + 2), feet + 0.5, { slopesOnly: true });
  }
  if (s === null) {
    // walked off a ledge (gravity and coyote time take it), or standing on
    // something Arcade carries (a crate, a lift)
    st.grounded = !!body.blocked.down;
    st.surface = null;
    return false;
  }
  let dy = s - feet;
  const lift = run + MAX_LIFT;
  if (-dy > lift) dy = -lift; // a lip: eased up over a few frames
  shiftBody(sprite, body, dy);
  body.velocity.y = 0;
  body.blocked.down = true;
  st.grounded = true;
  st.surface = s;
  return true;
}
