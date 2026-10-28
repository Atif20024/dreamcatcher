// Jo's rig (character-motion skill §1): parts, palette and metrics for the
// shared human skeleton (src/art/rig/human.js). Authored 1×, facing right;
// the game draws it at 2×, so the ~41-row figure stands about 82 px tall.
//
// Letters: k outline · I/J/j/q jacket (hi/base/shade/deep) · W/w/v shirt ·
// Q/P/p/o trousers · R/S/s/t skin · C/B/b/d boots · U/H/h/g hat ·
// y/r/n hat band · G glasses frame · L/l lens/glint · a hair · K belt ·
// u buckle · m mouth · e eye.

export const PALETTE = {
  k: 0x1a1828,
  I: 0x6488b6, J: 0x3d5a86, j: 0x2b3d6a, q: 0x1e2850,
  W: 0xece6d6, w: 0xb6b2c4, v: 0x8a88a2,
  Q: 0x6a6480, P: 0x4a4560, p: 0x332f4a, o: 0x231f36,
  R: 0xc48c5e, S: 0x9a6440, s: 0x6e4234, t: 0x4a2c30,
  C: 0x6e4a3a, B: 0x48302a, b: 0x2e1e22, d: 0x1c1418,
  U: 0x4c4c72, H: 0x2c2c4a, h: 0x1e1e36, g: 0x141428,
  y: 0xc8564c, r: 0x9a3238, n: 0x682232,
  G: 0x121218, L: 0x86b6d0, l: 0xeef6ff,
  a: 0x1e1a24, K: 0x281e26, u: 0xd8b050, m: 0x5a2a2c, e: 0x16121a,
  T: 0xe8b84a, // (portrait/tool accents)
};

// tone families: [highlight, base, shadow, deep] — limbs are shaded from
// these, far limbs take one step darker, and the selective inner outline
// uses the deep tone where a near limb crosses its own material
export const FAMILIES = {
  jacket: ['I', 'J', 'j', 'q'],
  pants: ['Q', 'P', 'p', 'o'],
  skin: ['R', 'S', 's', 't'],
  boot: ['C', 'B', 'b', 'd'],
  hat: ['U', 'H', 'h', 'g'],
  shirt: ['W', 'W', 'w', 'v'],
  band: ['y', 'r', 'n', 'n'],
};

export const METRICS = {
  W: 64, H: 64, // work canvas
  ax: 32, ay: 58, // foot anchor (the boundary the soles stand on)
  sole: 56, // the boot sole's row when planted (outline row 57)
  hipY: 39,
  thigh: 8, shin: 8, upper: 7, fore: 6,
  thighR: 2.15, shinR: 1.75, armR: 1.7, foreR: 1.5,
  hipSep: 0.6,
};

// torso, facing right: jacket open over a white shirt, a belt, trouser top.
// Anchor = the hip point (col 4, row 10).
const TORSO_BASE = [
  '...IJJWW.',
  '..IJJJJWj',
  '.IJJJJJWw',
  '.IJJJJJWw',
  '.IJJJJWWj',
  '.IJJJJWwj',
  '.IJJJJWWj',
  '..IJJJJWj',
  '..jJJJJjj',
  '..KKKKuK.',
  '..QPPPPp.',
];
const TORSO_HUNCH = [
  '.........',
  '..IJJWW..',
  '.IJJJJWj.',
  'IJJJJJWwj',
  'IJJJJJWWj',
  'IJJJJJWwj',
  '.IJJJJWWj',
  '..IJJJJWj',
  '..jJJJJjj',
  '..KKKKuK.',
  '..QPPPPp.',
];

// head, profile facing right; anchor = the neck (col 3, row 7)
const H = {
  base: [
    '..aaaaa.',
    '.aaaSSRR',
    '.aaGGLlG',
    '.asSSLLS',
    '.asSSSSS',
    '..sSSSm.',
    '..tsSSS.',
    '...ss...',
  ],
  blink: [
    '..aaaaa.',
    '.aaaSSRR',
    '.aaGGGGG',
    '.asSSSSS',
    '.asSSSSS',
    '..sSSSm.',
    '..tsSSS.',
    '...ss...',
  ],
  down: [
    '..aaaaa.',
    '.aaaSSRR',
    '.aaSSSSS',
    '.asGGLlG',
    '.asSSLLS',
    '..sSSSSS',
    '..tsSSm.',
    '...ss...',
  ],
  up: [
    '..aaaSRR',
    '.aaGGLlG',
    '.asSSLLS',
    '.asSSSSS',
    '.asSSSSm',
    '..sSSSS.',
    '..tss...',
    '...ss...',
  ],
  wince: [
    '..aaaaa.',
    '.aaaSSRR',
    '.aaGGGGG',
    '.asSSeeS',
    '.asSSSSS',
    '..sSSmm.',
    '..tsSSS.',
    '...ss...',
  ],
  laugh: [
    '..aaaaa.',
    '.aaaSSRR',
    '.aaGGGGG',
    '.asSSSSS',
    '.asSSSSm',
    '..sSSmm.',
    '..tsSSS.',
    '...ss...',
  ],
  blow: [ // trumpet: cheeks out
    '..aaaaa.',
    '.aaaSSRR',
    '.aaGGLlG',
    '.asSSLLS',
    '.asSSSSSS',
    '..sSSSSS',
    '..tsSSS.',
    '...ss...',
  ],
  sleep: [
    '..aaaaa.',
    '.aaaSSRR',
    '.aaSSSSS',
    '.asGGGGG',
    '.asSSSSS',
    '..sSSSS.',
    '..tsSm..',
    '...ss...',
  ],
};

// porkpie: flat crown, red band, short brim; anchor = the neck point below
const HAT = {
  rows: ['...UHHHH..', '..UHHHHHh.', '..yrrrrrn.', '.hHHHHHHHHh'],
  ox: 4,
  oy: 9,
  flipShift: 0,
};

// boots: anchor = the ankle (ox, oy); ankleUp = rows from ankle to sole
const BOOTS = {
  flat: { rows: ['BB....', 'CBBBBb', 'dddddd'], ox: 1, oy: 0, ankleUp: 2 },
  heel: { rows: ['BB..b.', 'CBBBb.', 'dddd..'], ox: 1, oy: 0, ankleUp: 2 },
  toe: { rows: ['BB...', 'CBB..', '.BBBb', '..ddd'], ox: 1, oy: 0, ankleUp: 3 },
  point: { rows: ['BB.', 'CBB', '.Bb', '.dd'], ox: 1, oy: 0, ankleUp: 3 },
  lift: { rows: ['BB...', 'CBBBb', '.dddd'], ox: 1, oy: 0, ankleUp: 2 },
};

const HANDS = {
  open: { rows: ['RS', 'Ss'], ox: 1, oy: 0 },
  fist: { rows: ['RS', 'ss'], ox: 1, oy: 0 },
  flat: { rows: ['RSS', '.ss'], ox: 1, oy: 0 },
  up: { rows: ['S.', 'RS', 'Ss'], ox: 1, oy: 1 },
};

export const PARTS = {
  torso: { base: TORSO_BASE, hunch: TORSO_HUNCH },
  torsoAnchor: [4, 10],
  neckAt: [5, -1],
  shoulderF: [5, 1],
  shoulderB: [4, 1],
  head: H,
  headAnchor: [3, 7],
  hat: HAT,
  boots: BOOTS,
  hands: HANDS,
};

export const OUTFITS = {
  street: {},
  // the long evening: shoes off (the boots take the skin tones)
  bare: { C: 'R', B: 'S', b: 's', d: 't' },
};

export default { id: 'jo', palette: PALETTE, families: FAMILIES, metrics: METRICS, parts: PARTS, outfits: OUTFITS };
