import { createPixelTexture } from '../utils/pixelart.js';

const PALETTE = {
  H: 0x23233a, // porkpie hat
  h: 0x35355a, // hat band highlight
  S: 0x8a5a3b, // skin
  G: 0x1a1a24, // glasses
  W: 0xe8e4d8, // shirt
  J: 0x3d5a80, // jacket
  P: 0x494356, // trousers
  B: 0x1e1e28, // shoes
};

const STAND = [
  '....HHHH....',
  '....hhhh....',
  '..HHHHHHHH..',
  '...SSSSSS...',
  '..GGSSSSGG..',
  '...SSSSSS...',
  '...SSSSSS...',
  '....SSSS....',
  '..JJJJJJJJ..',
  '.JJWWWWWWJJ.',
  '.JJWWWWWWJJ.',
  '.JJJJJJJJJJ.',
  '.SSJJJJJJSS.',
  '....PPPP....',
  '...PPPPPP...',
  '...PP..PP...',
  '...PP..PP...',
  '..BB....BB..',
];

const RUN = [
  '....HHHH....',
  '....hhhh....',
  '..HHHHHHHH..',
  '...SSSSSS...',
  '..GGSSSSGG..',
  '...SSSSSS...',
  '...SSSSSS...',
  '....SSSS....',
  '..JJJJJJJJ..',
  '.JJWWWWWWJJ.',
  '.JJWWWWWWJJ.',
  '.JJJJJJJJJJ.',
  '.SSJJJJJJSS.',
  '....PPPP....',
  '...PPPPPP...',
  '..PP....PP..',
  '.PP......PP.',
  'BB........BB',
];

export function createJoTextures(scene) {
  createPixelTexture(scene, 'jo-stand', STAND, PALETTE, 2);
  createPixelTexture(scene, 'jo-run', RUN, PALETTE, 2);
}
