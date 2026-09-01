import { createFrames } from '../utils/pixelart.js';

// D4/C1.2 — every foe gets a silhouette you can name at a glance and frames
// that move when it moves. Before this, seven of the fifteen kinds shared one
// tinted person grid and nothing animated, so they read as sliding blobs.
//
// People are composed: 4 rows of headwear + a shared head/torso + a leg set,
// with an optional accessory painted over the arms. That way a sous chef, a
// bouncer and a scalper differ in outline, not just in hue.

const OUTLINE = 0x14141c;

// --- shared person parts (16 wide) -----------------------------------------
const HEAD_TORSO = [
  '.....SSSSSS.....',
  '....SSSSSSSS....',
  '....SbSSSSbS....',
  '....SSSSSSSS....',
  '.....SSSSSS.....',
  '....TTTTTTTT....',
  '..TTTTTTTTTTTT..',
  '.TTtTTTTTTTTtTT.',
  '.TTtTTTTTTTTtTT.',
  '.TTtTTTTTTTTtTT.',
  '.SSTTTTTTTTTTSS.',
  '....TTTTTTTT....',
];

const LEGS_STAND = [
  '....PPPPPPPP....',
  '....PPPPPPPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '..BBBB....BBBB..',
  '..BBBB....BBBB..',
];
const LEGS_STRIDE = [
  '....PPPPPPPP....',
  '...PPPPPPPPPP...',
  '...PPP....PPP...',
  '..PPP......PPP..',
  '..ppp......ppp..',
  '.ppp........ppp.',
  '.BBBB......BBBB.',
  'BBBB........BBBB',
];
const LEGS_PASS = [
  '....PPPPPPPP....',
  '....PPPPPPPP....',
  '....PPPPPPP.....',
  '....PPPPPP......',
  '.....ppppp......',
  '.....ppp.pp.....',
  '...BBBB..BBB....',
  '...BBBB...BBB...',
];

// --- headwear (4 rows each) ------------------------------------------------
const HATS = {
  none: ['................', '................', '................', '................'],
  toque: ['..HHHHHHHHHHHH..', '..HHHHHHHHHHHH..', '...HHHHHHHHHH...', '...HHHHHHHHHH...'],
  cap: ['................', '................', '....HHHHHHHH....', '..HHHHHHHHHHhh..'],
  beanie: ['................', '................', '....HHHHHHHH....', '...HHHHHHHHHH...'],
  fedora: ['................', '....HHHHHHHH....', '....hhhhhhhh....', '..HHHHHHHHHHHH..'],
  headset: ['................', '................', '....HHHHHHHH....', '...AHHHHHHHHA...'],
  crop: ['................', '................', '................', '....HHHHHHHH....'],
  bandana: ['................', '................', '................', '...HHHHHHHHHH...'],
};

// accessories are painted over the finished grid: [row, col, chars]
const HELD = {
  clipboard: [[16, 0, 'AA'], [17, 0, 'AA'], [18, 0, 'Aa'], [15, 0, 'AA']],
  tickets: [[15, 13, 'AAA'], [16, 13, 'AAA'], [17, 14, 'Aa']],
  bottle: [[14, 13, '.A.'], [15, 13, '.A.'], [16, 13, 'AAA'], [17, 13, 'AAA'], [18, 13, 'aaa']],
  crate: [[15, 11, 'AAAA'], [16, 11, 'AaaA'], [17, 11, 'AaaA'], [18, 11, 'AAAA']],
  coil: [[16, 12, '.AA.'], [17, 12, 'A..A'], [18, 12, '.AA.']],
  ladle: [[14, 13, '..A'], [15, 13, '.A.'], [16, 13, 'AA.'], [17, 13, 'AA.']],
};

function paint(rows, held) {
  if (!held) return rows;
  const grid = rows.map((r) => [...r]);
  for (const [y, x, chars] of HELD[held]) {
    [...chars].forEach((ch, i) => {
      if (ch !== '.' && grid[y] && grid[y][x + i] !== undefined) grid[y][x + i] = ch;
    });
  }
  return grid.map((r) => r.join(''));
}

function person(hat, held) {
  const build = (legs) => paint([...HATS[hat], ...HEAD_TORSO, ...legs], held);
  return [build(LEGS_STAND), build(LEGS_STRIDE), build(LEGS_PASS)];
}

// --- the cast --------------------------------------------------------------
// pal: H hat, h band, S skin, b eye, T torso, t torso shade, P legs,
//      p leg shade, B shoes, A accessory, a accessory shade
const P = (H, S, T, t, Pp, B, A, h) => ({
  H,
  h: h ?? H,
  S,
  b: 0x1a1a20,
  T,
  t,
  P: Pp,
  p: t,
  B,
  A: A ?? 0xd8d8d0,
  a: 0x8a8a90,
});

export const PEOPLE = {
  // chef dream
  'foe-sous-chef': { art: person('toque', 'ladle'), pal: P(0xe8e4d8, 0x8a5a3b, 0xdcdcd4, 0x9a9a94, 0x2e3440, 0x1e1e28, 0xb8bcc8) },
  'foe-dock-hand': { art: person('cap', 'crate'), pal: P(0x4a6a58, 0x9a6a48, 0x6a7a5a, 0x4a5a42, 0x3a3a44, 0x2a2118, 0x8a6844) },
  // musician dream
  'foe-bouncer': { art: person('crop', null), pal: P(0x2a2230, 0x6a4630, 0x2e2e3a, 0x20202a, 0x22222c, 0x14141a, 0xc03a2a) },
  'foe-heckler': { art: person('bandana', 'bottle'), pal: P(0x8a3a3a, 0xc09070, 0xb08858, 0x86643f, 0x44404c, 0x241f1a, 0x6a9a6a) },
  'foe-scalper': { art: person('fedora', 'tickets'), pal: P(0x3a4436, 0x8a6a4a, 0x55634d, 0x3d4838, 0x2e2e36, 0x1e1e28, 0xf2d580) },
  'foe-manager': { art: person('headset', 'clipboard'), pal: P(0x6a6a52, 0xc0a088, 0x9a9a76, 0x70705a, 0x3a3a44, 0x1e1e28, 0xe8e4d8) },
  'foe-roadie': { art: person('beanie', 'coil'), pal: P(0x1f1f26, 0x9a6a48, 0x33333d, 0x24242c, 0x2a2a32, 0x1a1a20, 0xd8a840) },
};

// --- creatures: things, not people -----------------------------------------
// Each has at least two frames, cycled by distance travelled.
export const CREATURES = {
  'foe-crawler': {
    // a kitchen roach: amber shell, antennae, legs that alternate
    art: [
      ['.a......a.', '..a....a..', '..bBBBBb..', '.bBBBBBBb.', '..bBBBBb..', '.L.L..L.L.'],
      ['.a......a.', '..a....a..', '..bBBBBb..', '.bBBBBBBb.', '..bBBBBb..', 'L..L..L..L'],
    ],
    pal: { b: 0x6a4526, B: 0xa8703c, a: 0x4a3220, L: 0x4a3220 },
    size: 3,
  },
  'foe-rat': {
    // pale body against a dark floor, ears and tail so the shape reads
    art: [
      ['..........', '.......EE.', 'ttt..BBBBB', '..tBBBBBBB', '..BBBBBBeB', '..BBBBBBBB', '..L..L..L.'],
      ['..........', '.......EE.', '...t.BBBBB', 'ttt.BBBBBB', '..BBBBBBeB', '..BBBBBBBB', '.L..L..L..'],
    ],
    pal: { B: 0xa89a84, t: 0x7a6a58, E: 0xc0a894, e: 0x1a1a20, L: 0x6a5a4a },
    size: 3,
  },
  'foe-grease': {
    art: [
      ['..GGGG..', '.GGGGGG.', 'GGwGGwGG', 'GGGGGGGG', '.GGGGGG.'],
      ['..GGGG..', '.GGGGGG.', 'GGwGGwGG', 'GGGGGGGG', 'GGGGGGGG'],
    ],
    pal: { G: 0x5a606e, w: 0xd8ecf8 },
    size: 4,
  },
  'foe-mill': {
    art: [
      ['..MMMM..', '..mMMm..', '.MMMMMM.', '.MMMMMM.', '.MmMMmM.', '.MMMMMM.', 'MMMMMMMM'],
      ['...MMMM.', '...mMMm.', '..MMMMMM', '..MMMMMM', '.MmMMmM.', '.MMMMMM.', 'MMMMMMMM'],
    ],
    pal: { M: 0x8a6446, m: 0x5a3f2a },
    size: 4,
  },
  'foe-meringue': {
    art: [
      ['...ww...', '..wWWw..', '.wWWWWw.', '.wWWWWw.', '..wwww..'],
      ['..wwww..', '.wWWWWw.', 'wWWWWWWw', '.wWWWWw.', '..w..w..'],
    ],
    pal: { W: 0xf6f2ea, w: 0xd0c6ba },
    size: 4,
  },
  'foe-cart': {
    art: [
      ['SSSSSSSSSS', 'SsssssssaS', 'SSSSSSSSSS', '.w..ww..w.', '..w.ww.w..'],
      ['SSSSSSSSSS', 'SsssssssaS', 'SSSSSSSSSS', '..w.ww.w..', '.w..ww..w.'],
    ],
    pal: { S: 0x9a9eaa, s: 0xc8ccd8, a: 0xc03a2a, w: 0x2a2a30 },
    size: 4,
  },
  'foe-walker': {
    art: [
      ['..MMMM..', '.MMMMMM.', '.MmMMmM.', '.MMMMMM.', '..M..M..', '..M..M..', '.MM..MM.'],
      ['..MMMM..', '.MMMMMM.', '.MmMMmM.', '.MMMMMM.', '..M..M..', '.M....M.', 'MM....MM'],
    ],
    pal: { M: 0x9a94a4, m: 0xe86a6a },
    size: 4,
  },
  'foe-wisp': {
    art: [
      ['.w..w..w.', '..wwwww..', '.wwWwWww.', 'wwwwwwwww', '.wwwwwww.', '..w.w.w..'],
      ['..w.w.w..', '.wwwwwww.', 'wwWwwwWww', 'wwwwwwwww', '..wwwww..', '.w..w..w.'],
      ['.w.w.w.w.', '..wwwww..', '.wwWwWww.', '.wwwwwww.', '..wwwww..', '...w.w...'],
    ],
    pal: { w: 0xb4bce8, W: 0x2a2a40 },
    size: 4,
  },
};

export function createFoeTextures(scene) {
  for (const [key, def] of Object.entries(PEOPLE)) {
    createFrames(scene, key, def.art, def.pal, 2, { outline: OUTLINE });
  }
  for (const [key, def] of Object.entries(CREATURES)) {
    createFrames(scene, key, def.art, def.pal, def.size, { outline: OUTLINE });
  }
}
