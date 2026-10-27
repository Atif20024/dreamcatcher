import { slopeSurface } from '../builders/legend.js';

const T = 32;

// D3 — Arcade has no slopes. Anything that walks (Jo, people, carts) calls
// this each frame: if its feet are over a slope tile, it is snapped onto the
// surface and treated as grounded. Returns true when it did.
//
// The surface is sampled under both edges of the body as well as its centre,
// and the highest sample wins. Sampling only the centre left the leading
// edge of the body poking into the solid tile at the top of a ramp while the
// feet were still a few pixels lower — Arcade read that as a wall and the
// walker stuck just short of the crest.
export function resolveSlope(scene, sprite, body) {
  const sg = scene.slopeGrid;
  if (!sg) return false;
  const solid = scene.solidGrid;
  const footY = body.bottom;
  const rows = [Math.floor(footY / T), Math.floor(footY / T) - 1];
  let best = null;
  let onSlope = false;
  for (const sx of [body.left + 1, sprite.x, body.right - 1]) {
    const tx = Math.floor(sx / T);
    for (const ty of rows) {
      const role = sg[ty] && sg[ty][tx];
      if (role) {
        const surfaceY = ty * T + slopeSurface(role, sx / T - tx) * T;
        if (footY >= surfaceY - 8 && footY <= surfaceY + T) {
          onSlope = true;
          if (best === null || surfaceY < best) best = surfaceY;
        }
      } else if (solid && solid[ty] && solid[ty][tx]) {
        // the block a ramp runs up to: step onto its top if it is within
        // reach, so the crest is one continuous surface
        const top = ty * T;
        if (footY > top && footY <= top + T / 2 + 4 && (best === null || top < best)) best = top;
      }
    }
  }
  if (!onSlope || best === null || body.velocity.y < -10) return false;
  sprite.y += best - footY;
  body.y += best - footY;
  body.velocity.y = 0;
  body.blocked.down = true;
  return true;
}
