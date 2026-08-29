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

const HEAD_AND_TORSO = [
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....hhhhhhhh....',
  '..HHHHHHHHHHHH..',
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

export function createJoTextures(scene) {
  createPixelTexture(scene, 'jo-stand', STAND, PALETTE, 2);
  createPixelTexture(scene, 'jo-run', RUN, PALETTE, 2);
}
