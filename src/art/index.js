// D11.1 — the packs. Each pack lists `frames()` -> items the builder
// rasterizes: { anim, index?, grid, palette, origin, outline?, contact?,
// footstep?, stride? }. Palettes may name colours (palettes.js) or be
// literal numbers. `sources` tells watch mode which files rebuild the pack.
import { frames as rigFrames, footContacts } from './Rig.js';
import joRig from '../data/rigs/jo.js';
import { JO_STILLS } from './jo.js';
import { foeFrames } from './foes.js';
import { hubFrames } from './hub.js';

function rigPack(rig) {
  const out = [];
  for (const anim of Object.keys(rig.frames)) {
    const grids = rigFrames(rig, anim);
    const contacts = footContacts(rig, anim);
    grids.forEach((grid, i) => {
      const spec = rig.frames[anim][i];
      out.push({ anim, index: i, grid, palette: rig.palette, origin: rig.origin, contact: contacts[i], footstep: !!spec.footstep, stride: rig.stride && rig.stride[anim] });
    });
  }
  for (const [name, ex] of Object.entries(rig.extras || {})) {
    out.push({ anim: `rig_${name}`, grid: ex.grid, palette: rig.palette, origin: [Math.floor(ex.grid[0].length / 2), ex.grid.length - 1] });
  }
  return out;
}

export const PACKS = {
  jo: { sources: ['rigs/jo.js', 'art/jo.js', 'Rig.js', 'palettes.js'], frames: () => [...rigPack(joRig), ...JO_STILLS] },
  foes: { sources: ['art/foes.js'], frames: foeFrames },
  hub: { sources: ['art/hub.js', 'dreams.js'], frames: hubFrames },
};
