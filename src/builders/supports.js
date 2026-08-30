import { createPixelTexture } from '../utils/pixelart.js';

// D3 — auto-supports: nothing floats unexplained. For every platform tile with
// empty space beneath it, drop a themed support column (pipe / bracket / chain
// / table leg) to the next solid tile, max 4 tiles, plus a shadow strip.
const COLUMNS = {
  pipe: ['..pppp..', '.pPPPPp.', '.pPPPPp.', '.pPPPPp.', '.pPPPPp.', '.pPPPPp.', '.pPPPPp.', '..pppp..'],
  bracket: ['..p..p..', '..p..p..', '..p..p..', '.pPppPp.', '..p..p..', '..p..p..', '..p..p..', '.pPppPp.'],
  chain: ['...pp...', '..pPPp..', '...pp...', '..pPPp..', '...pp...', '..pPPp..', '...pp...', '..pPPp..'],
  leg: ['.pPPPPp.', '.pP..Pp.', '.pP..Pp.', '.pP..Pp.', '.pP..Pp.', '.pP..Pp.', '.pP..Pp.', '.pPPPPp.'],
};

export function buildSupportTextures(scene, key, kind, colorDark, colorLight) {
  createPixelTexture(scene, `${key}_support`, COLUMNS[kind] || COLUMNS.bracket, { p: colorDark, P: colorLight }, 4);
}

// grid: array of strings; isSolid(tx,ty): bool; needsSupport(tx,ty): bool
export function addSupports(scene, { key, T, width, height, isSolid, needsSupport, depth = 3 }) {
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      if (!needsSupport(tx, ty)) continue;
      if (isSolid(tx, ty + 1)) continue; // already grounded
      let run = 0;
      for (let d = 1; d <= 4; d++) {
        if (isSolid(tx, ty + d)) break;
        run = d;
      }
      if (run === 0) continue;
      // only every other column so platforms read as supported, not walled in
      if (tx % 2 === 1) continue;
      for (let d = 1; d <= run; d++) {
        scene.add.image(tx * T + T / 2, (ty + d) * T + T / 2, `${key}_support`).setDepth(depth).setAlpha(0.9);
      }
      // contact shadow under the platform
      scene.add
        .rectangle(tx * T + T / 2, (ty + 1) * T, T, 6, 0x000000, 0.4)
        .setDepth(depth + 1);
    }
  }
}
