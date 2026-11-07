// Jo's rig (character-motion skill §1): parts, palette and metrics for the
// shared human skeleton (src/art/rig/human.js). Authored 1×, facing right;
// the game draws it at 2×, so the ~41-row figure stands about 82 px tall.
//
// Letters: k outline · I/J/j/q jacket (hi/base/shade/deep) · W/w/v shirt ·
// Q/P/p/o trousers · R/S/s/t skin · C/B/b/d boots · U/H/h/g hat ·
// y/r/n hat band · G glasses frame · L/l lens/glint · a hair · K belt ·
// u buckle · m mouth · e eye.

export const PALETTE = {
  // a blacker line than the cast's: on a dim street his outline is what holds 3:1
  k: 0x0c0a16,
  I: 0x8ab0dc, J: 0x4d72a8, j: 0x34508a, q: 0x243466,
  W: 0xece6d6, w: 0xb6b2c4, v: 0x8a88a2,
  Q: 0x8a84a6, P: 0x524c6c, p: 0x332f4a, o: 0x231f36,
  R: 0xc48c5e, S: 0x9a6440, s: 0x6e4234, t: 0x4a2c30,
  C: 0x6e4a3a, B: 0x48302a, b: 0x2e1e22, d: 0x1c1418,
  U: 0x4c4c72, H: 0x2c2c4a, h: 0x1e1e36, g: 0x141428,
  y: 0xc8564c, r: 0x9a3238, n: 0x682232,
  G: 0x2a1c1c, L: 0x86b6d0, l: 0xeef6ff,
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

// torso, facing right: jacket open over a white shirt, a lapel, the band's red
// in the tie, a pocket flap, a belt and the trouser top.
// Anchor = the hip point (col 4, row 10).
const TORSO_BASE = [
  '...IJJWW.',
  '..IJJJjWj',
  '.IJJJjWyw',
  '.IJJJJWyw',
  '.IJJJJWyj',
  '.IJJJJWrj',
  '.IJJJJWWj',
  '.IJwwwJWj',
  '..jJJJJjj',
  '..KKKKuK.',
  '..QPPPPp.',
];
const TORSO_HUNCH = [
  '.........',
  '..IJJWW..',
  '.IJJJjWj.',
  'IJJJJjWyj',
  'IJJJJJWyj',
  'IJJJJJWrj',
  '.IJJJJWWj',
  '.IJwwwJWj',
  '..jJJJJjj',
  '..KKKKuK.',
  '..QPPPPp.',
];
// square-on, his back to us: he faces the ladder. Shoulders wide, a centre seam.
const TORSO_FRONT = [
  '...IJJj..',
  '.IIJJJJj.',
  '.IJJJJJj.',
  '.IJJJqJj.',
  '.IJJJqJj.',
  '..IJJqj..',
  '..IJJqj..',
  '..IJJqj..',
  '..jJJqj..',
  '..KKKKK..',
  '..QPPPp..',
];
// the jacket's back hem, hanging past the belt: it swings on pose.trail
const HEM = { rows: ['.IJJ', '.IJj', '.jj.'], ox: 4, oy: 1, trail: true };

// head, profile facing right; anchor = the neck (col 3, row 7). The brim sits
// above row 1 now: a brow over the lens, the lens with its glint and a skin
// gap below it, a nose that sticks out (col 8)
const H = {
  base: [
    '..aaaaa.',
    '.aaaRaaR',
    '.aasGLlG',
    '.asRRLLRS',
    '.asRRRRR',
    '..sRRRm.',
    '..tsRRS.',
    '...ss...',
  ],
  blink: [
    '..aaaaa.',
    '.aaaRaaR',
    '.aasGGGG',
    '.asRRRRRS',
    '.asRRRRR',
    '..sRRRm.',
    '..tsRRS.',
    '...ss...',
  ],
  down: [
    '..aaaaa.',
    '.aaaRRRR',
    '.aasRaaR',
    '.asRGLlG',
    '.asRRLLRS',
    '..sRRRRR',
    '..tsRRm.',
    '...ss...',
  ],
  up: [
    '..aaaRaa',
    '.aasGLlG',
    '.asRRLLRS',
    '.asRRRRR',
    '.asRRRRm',
    '..sRRRR.',
    '..tss...',
    '...ss...',
  ],
  wince: [
    '..aaaaa.',
    '.aaaRaaR',
    '.aasGGGG',
    '.asRReeRS',
    '.asRRRRR',
    '..sRRmm.',
    '..tsRRS.',
    '...ss...',
  ],
  laugh: [
    '..aaaaa.',
    '.aaaRaaR',
    '.aasGGGG',
    '.asRRRRRS',
    '.asRRRRm',
    '..sRRmm.',
    '..tsRRS.',
    '...ss...',
  ],
  blow: [ // trumpet: cheeks out
    '..aaaaa.',
    '.aaaRaaR',
    '.aasGLlG',
    '.asRRLLRS',
    '.asRRRRRR',
    '..sRRRRR',
    '..tsRRS.',
    '...ss...',
  ],
  sleep: [
    '..aaaaa.',
    '.aaaRRRR',
    '.aasRRRR',
    '.asGGGGGS',
    '.asRRRRR',
    '..sRRRR.',
    '..tsRm..',
    '...ss...',
  ],
  back: [ // from behind, on the ladder: hair and the nape
    '..aaaaa.',
    '.aaaaaaa',
    '.aaaaaaa',
    '.aaaaaaa',
    '.aaaaaaa',
    '..asssa.',
    '..sssss.',
    '...ss...',
  ],
};

// porkpie: flat crown, a two-row red band, short brim; anchor = the neck point below
const HAT = {
  rows: ['..UHHHHHh.', '..yyrrrrn.', '..rnnnnnn.', '.hHHHHHHHHh'],
  ox: 4,
  oy: 10,
  flipShift: 0,
};

// boots: anchor = the ankle (ox, oy); ankleUp = rows from ankle to sole
const BOOTS = {
  flat: { rows: ['BB....', 'CBBBBb', 'dddddd'], ox: 1, oy: 0, ankleUp: 2 },
  heel: { rows: ['BB..b.', 'CBBBb.', 'dddd..'], ox: 1, oy: 0, ankleUp: 2 },
  toe: { rows: ['BB...', 'CBB..', '.BBBb', '..ddd'], ox: 1, oy: 0, ankleUp: 3 },
  point: { rows: ['BB..', 'CBB.', '.BBb', '..dd'], ox: 1, oy: 0, ankleUp: 3 },
  lift: { rows: ['BB...', 'CBBBb', '.dddd'], ox: 1, oy: 0, ankleUp: 2 },
  front: { rows: ['BBb', 'CBb', 'ddd'], ox: 1, oy: 0, ankleUp: 2 }, // seen from behind
};

const HANDS = {
  open: { rows: ['RS', 'Ss'], ox: 1, oy: 0 },
  fist: { rows: ['RS', 'ss'], ox: 1, oy: 0 },
  flat: { rows: ['RSS', '.ss'], ox: 1, oy: 0 },
  up: { rows: ['S.', 'RS', 'Ss'], ox: 1, oy: 1 },
  watch: { rows: ['RS', 'uu'], ox: 1, oy: 0 }, // the pocket watch, gold in the fist
};

export const PARTS = {
  torso: { base: TORSO_BASE, hunch: TORSO_HUNCH, front: TORSO_FRONT },
  torsoAnchor: [4, 10],
  neckAt: [5, -1],
  shoulderF: [5, 1],
  shoulderB: [4, 1],
  head: H,
  headAnchor: [3, 7],
  hat: HAT,
  boots: BOOTS,
  hands: HANDS,
  over: HEM,
};

export const OUTFITS = {
  street: {},
  // the long evening: shoes off (the boots take the skin tones)
  bare: { C: 'R', B: 'S', b: 's', d: 't' },
};

export default { id: 'jo', palette: PALETTE, families: FAMILIES, metrics: METRICS, parts: PARTS, outfits: OUTFITS };
