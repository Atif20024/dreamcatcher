import { slopeSurface } from '../builders/legend.js';

const T = 32;

// D3 — Arcade has no slopes. Anything that walks (Jo, people, carts) calls
// this each frame: if its feet are over a slope tile, it is snapped onto the
// surface and treated as grounded. Returns true when it did.
export function resolveSlope(scene, sprite, body) {
  const sg = scene.slopeGrid;
  if (!sg) return false;
  const footTx = Math.floor(sprite.x / T);
  const footY = body.bottom;
  for (const ty of [Math.floor(footY / T), Math.floor(footY / T) - 1]) {
    const role = sg[ty] && sg[ty][footTx];
    if (!role) continue;
    const fx = sprite.x / T - footTx;
    const surfaceY = ty * T + slopeSurface(role, fx) * T;
    if (footY >= surfaceY - 8 && footY <= surfaceY + T && body.velocity.y >= -10) {
      sprite.y += surfaceY - footY;
      body.y += surfaceY - footY;
      body.velocity.y = 0;
      body.blocked.down = true;
      return true;
    }
  }
  return false;
}
