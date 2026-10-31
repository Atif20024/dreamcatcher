// Wren, the lamplighter (the proof dream's speaking NPC). Built on the shared
// human skeleton (src/art/rig/human.js) with Jo's metrics, so she stands at
// the same ~82 px scale class. Her own parts: no glasses, a profile face
// with an eye and a brow, auburn hair in a low knot, a green newsboy cap,
// an ochre lamplighter's coat over a plum shirt. Letters follow Jo's rig
// (src/data/rigs/jo.js) so the skeleton's tone families work unchanged.
import jo from './jo.js';

export const PALETTE = {
  ...jo.palette,
  // coat (ochre): hi / base / shade (hue-shifted cooler) / deep
  I: 0xe6b86a, J: 0xc08a3e, j: 0x8a5a34, q: 0x523424,
  // shirt (plum)
  W: 0xa8708e, w: 0x7a4a6a, v: 0x5a3450,
  // trousers (moss brown)
  Q: 0x6a6448, P: 0x4a4636, p: 0x34322a, o: 0x24221e,
  // skin (warm, a touch lighter than Jo's)
  R: 0xe2b48c, S: 0xc48c66, s: 0x8e5c48, t: 0x5a3a36,
  // boots (oxblood)
  C: 0x7a3a34, B: 0x542626, b: 0x381a1c, d: 0x200e12,
  // cap (bottle green)
  U: 0x5a7a5a, H: 0x36543e, h: 0x243a2c, g: 0x142218,
  // band → the cap button / brim edge
  y: 0xd8b050, r: 0x9a7a30, n: 0x5a4418,
  a: 0x7a3426, // auburn hair
  T: 0xd8867a, // cheeks
  K: 0x3a2418, u: 0xc8963a, m: 0x8a3a3a, e: 0x1a1218,
};

const H = {
  base: [
    '..aaaaa.',
    'aaaaaSRR',
    'aaaSaaSS',
    'aaasSeSR',
    '.aasSSSS',
    '.a.sSSm.',
    '..tsSSS.',
    '...ss...',
  ],
  blink: [
    '..aaaaa.',
    'aaaaaSRR',
    'aaaSaaSS',
    'aaasSsSR',
    '.aasSSSS',
    '.a.sSSm.',
    '..tsSSS.',
    '...ss...',
  ],
  down: [
    '..aaaaa.',
    'aaaaaSRR',
    'aaaSSSSS',
    'aaasaaSS',
    '.aasSeSR',
    '.a.sSSSS',
    '..tsSSm.',
    '...ss...',
  ],
  up: [
    '..aaaSRR',
    'aaaaaaSS',
    'aaasSeSR',
    'aaasSSSS',
    '.aasSSSm',
    '.a.sSSS.',
    '..tss...',
    '...ss...',
  ],
  laugh: [
    '..aaaaa.',
    'aaaaaSRR',
    'aaaSaaSS',
    'aaasSsSR',
    '.aasSSSS',
    '.a.sSmm.',
    '..tsSSS.',
    '...ss...',
  ],
  talk: [
    '..aaaaa.',
    'aaaaaSRR',
    'aaaSaaSS',
    'aaasSeSR',
    '.aasSSSS',
    '.a.sSSmm',
    '..tsSSm.',
    '...ss...',
  ],
};
H.wince = H.blink;
H.blow = H.base;
H.sleep = H.blink;

// a newsboy cap: a soft crown leaning forward, a short brim, a brass button
const HAT = {
  rows: ['...UHHHH..', '..UHHHHHHh', '.UHHHHHHHHh', '..hhhhhyHHHh'],
  ox: 4,
  oy: 9,
  flipShift: 0,
};

export const PARTS = { ...jo.parts, head: H, hat: HAT };

export const OUTFITS = { street: {} };

export default { id: 'wren', palette: PALETTE, families: jo.families, metrics: jo.metrics, parts: PARTS, outfits: OUTFITS };
