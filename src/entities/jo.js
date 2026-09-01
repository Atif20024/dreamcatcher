import { createPixelTexture } from '../utils/pixelart.js';

// Jo — 16x24 @2px = 32x48. Porkpie hat with red band, glasses, blue jacket.
const PALETTE = {
  H: 0x23233a, // hat
  h: 0x8a3a3a, // hat band
  S: 0x8a5a3b, // skin
  s: 0x6f4630, // skin shadow
  G: 0x1a1a24, // glasses frame
  L: 0x9ac8d8, // lens
  W: 0xe8e4d8, // shirt
  J: 0x3d5a80, // jacket
  j: 0x2f4766, // jacket shadow
  P: 0x494356, // trousers
  p: 0x3a3547, // trouser shadow
  B: 0x1e1e28, // shoes
};

// D5 — the hat is its own sprite so it can lag a frame behind the body and
// get knocked askew on a hit. The body grids keep four blank rows where it
// used to sit so every other offset stays put.
export const HAT = [
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....hhhhhhhh....',
  '..HHHHHHHHHHHH..',
];

const HEAD_AND_TORSO = [
  '................',
  '................',
  '................',
  '................',
  '.....SSSSSS.....',
  '....SSSSSSSS....',
  '..GGLLSSSLLGG...',
  '....SSSSSSSS....',
  '....sSSSSSSs....',
  '.....SSSSSS.....',
  '....JJJJJJJJ....',
  '..JJJJJJJJJJJJ..',
  '.JJjWWWWWWWWjJJ.',
  '.JJjWWWWWWWWjJJ.',
  '.JJjWWWWWWWWjJJ.',
  '.SSJJJJJJJJJJSS.',
];

const STAND = [
  ...HEAD_AND_TORSO,
  '....PPPPPPPP....',
  '....PPPPPPPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '..BBBB....BBBB..',
  '..BBBB....BBBB..',
];

const RUN = [
  ...HEAD_AND_TORSO,
  '....PPPPPPPP....',
  '...PPPPPPPPPP...',
  '...PPP....PPP...',
  '..PPP......PPP..',
  '..ppp......ppp..',
  '.ppp........ppp.',
  '.BBBB......BBBB.',
  'BBBB........BBBB',
];

// the level tool: a ladle in the kitchen, a trumpet on the stage
const LADLE = ['.mmmmmm.', '........', '..bbbb..', '.bBBBBb.', '.bBBBBb.', '..bbbb..'];
const TRUMPET = ['..bbbbb.', '.bBBBBBb', 'bBB....b', '.bBBBBBb', '..bbbbb.'];
const TOOL_PAL = { m: 0x9a9aa8, b: 0x8a6a2c, B: 0xd8a840 };

// a dark rim on every piece of Jo, so he reads against a pale pavement and a
// dark kitchen alike
const RIM = { outline: 0x14141c };

export function createJoTextures(scene) {
  createPixelTexture(scene, 'jo-stand', STAND, PALETTE, 2, RIM);
  createPixelTexture(scene, 'jo-run', RUN, PALETTE, 2, RIM);
  createPixelTexture(scene, 'jo-hat', HAT, PALETTE, 2, RIM);
  createPixelTexture(scene, 'tool-ladle', LADLE, TOOL_PAL, 3, RIM);
  createPixelTexture(scene, 'tool-trumpet', TRUMPET, TOOL_PAL, 3, RIM);
}

// D5 — dust colours for Jo's own death burst
export const JO_DUST = [0x3d5a80, 0x8a5a3b, 0xe8e4d8, 0x23233a];
