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

const BLANK_ROW = '................';

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

// the walk: contact (legs apart, the near leg lit, the far leg in shade),
// pass (legs together, the far foot lifted, the body a row higher), the
// other contact, the other pass. Player steps through them by distance
// walked, never by the clock, so the feet never slide.
const RUN = [
  ...HEAD_AND_TORSO,
  '....PPPPPPPP....',
  '...PPPPPPPPPP...',
  '...ppp....PPP...',
  '..ppp......PPP..',
  '..ppp......ppp..',
  '.ppp........ppp.',
  '.BBBB......BBBB.',
  'BBBB........BBBB',
];
const RUN_B = [
  ...HEAD_AND_TORSO,
  '....PPPPPPPP....',
  '...PPPPPPPPPP...',
  '...PPP....ppp...',
  '..PPP......ppp..',
  '..ppp......ppp..',
  '.ppp........ppp.',
  '.BBBB......BBBB.',
  'BBBB........BBBB',
];
const PASS = [
  BLANK_ROW,
  ...HEAD_AND_TORSO.slice(1),
  '....PPPPPPPP....',
  '....PPPPPPPP....',
  '....PPPPpp......',
  '....PPP.ppp.....',
  '....ppp..ppp....',
  '....ppp..BBBB...',
  '..BBBB..........',
  '..BBBB..........',
];
const PASS_B = [
  BLANK_ROW,
  ...HEAD_AND_TORSO.slice(1),
  '....PPPPPPPP....',
  '....PPPPPPPP....',
  '......ppPPPP....',
  '.....ppp.PPP....',
  '....ppp..ppp....',
  '...BBBB..ppp....',
  '..........BBBB..',
  '..........BBBB..',
];
export const JO_WALK = ['jo-run', 'jo-run-p', 'jo-run-b', 'jo-run-pb'];

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
  createPixelTexture(scene, 'jo-run-p', PASS, PALETTE, 2, RIM);
  createPixelTexture(scene, 'jo-run-b', RUN_B, PALETTE, 2, RIM);
  createPixelTexture(scene, 'jo-run-pb', PASS_B, PALETTE, 2, RIM);
  createPixelTexture(scene, 'jo-hat', HAT, PALETTE, 2, RIM);
  createPixelTexture(scene, 'tool-ladle', LADLE, TOOL_PAL, 3, RIM);
  createPixelTexture(scene, 'tool-trumpet', TRUMPET, TOOL_PAL, 3, RIM);
}

// D5 — dust colours for Jo's own death burst
export const JO_DUST = [0x3d5a80, 0x8a5a3b, 0xe8e4d8, 0x23233a];

// --- the long evening: the poses a place with nothing to do asks for --------
// Sitting drops the head four grid rows (8 px), so the scene sets
// player.poseDy = 8 and the hat/trumpet follow it down.
const BLANK = '................';
const FACE = ['.....SSSSSS.....', '....SSSSSSSS....', '..GGLLSSSLLGG...', '....SSSSSSSS....', '....sSSSSSSs....', '.....SSSSSS.....'];
const FACE_UP = ['.....SSSSSS.....', '..GGLLSSSLLGG...', '....SSSSSSSS....', '....SSSSSSSS....', '....sSSSSSSs....', '.....SSSSSS.....'];
const FACE_LAUGH = ['.....SSSSSS.....', '....SSSSSSSS....', '..GGGGSSSGGGG...', '....SSSSSSSS....', '....sSSGGSSs....', '.....SSSSSS.....'];
const FACE_SLEEP = ['.....SSSSSS.....', '....SSSSSSSS....', '....SSSSSSSS....', '..GGGGSSSGGGG...', '....sSSSSSSs....', '.....SSSSSS.....'];
const TORSO = ['....JJJJJJJJ....', '..JJJJJJJJJJJJ..', '.JJjWWWWWWWWjJJ.', '.JJjWWWWWWWWjJJ.', '.JJjWWWWWWWWjJJ.', '.SSJJJJJJJJJJSS.'];
const TORSO_SHRUG = ['S...JJJJJJJJ...S', 'SJJJJJJJJJJJJJJS', '...jWWWWWWWWj...', '...jWWWWWWWWj...', '...jWWWWWWWWj...', '....JJJJJJJJ....'];
const LAP = ['....PPPPPPPPPPP.', '....pppppppPPPP.', '...........PPP..', '...........BBBB.'];
const CROUCH_LEGS = ['....PPPPPPPP....', '...PPPPPPPPPP...', '..PPP......PPP..', '..ppp......ppp..', '..BBBB....BBBB..', '..BBBB....BBBB..'];
const STANDING_LEGS = STAND.slice(16);
const up4 = [BLANK, BLANK, BLANK, BLANK];

const POSES = {
  'jo-sit': [...up4, ...up4, ...FACE, ...TORSO, ...LAP],
  'jo-sitdown': [...up4, BLANK, BLANK, ...FACE, ...TORSO, ...CROUCH_LEGS], // head 2 rows down: poseDy 4
  'jo-sit-up': [...up4, ...up4, ...FACE_UP, ...TORSO, ...LAP],
  'jo-sleep': [...up4, ...up4, BLANK, ...FACE_SLEEP.slice(0, 5), ...TORSO, ...LAP],
  'jo-lookup': [...up4, ...FACE_UP, ...TORSO, ...STANDING_LEGS],
  'jo-laugh': [...up4, ...FACE_LAUGH, ...TORSO, ...STANDING_LEGS],
  'jo-shrug': [...up4, ...FACE, ...TORSO_SHRUG, ...STANDING_LEGS],
};

// shoes off (A4.6): the same grids with the soles painted skin
const BARE = { ...PALETTE, B: 0x8a5a3b };

export function createJoEveningTextures(scene) {
  createJoTextures(scene);
  for (const [key, rows] of Object.entries(POSES)) createPixelTexture(scene, key, rows, PALETTE, 2, RIM);
  createPixelTexture(scene, 'jo-stand-bare', STAND, BARE, 2, RIM);
  createPixelTexture(scene, 'jo-run-bare', RUN, BARE, 2, RIM);
  createPixelTexture(scene, 'jo-run-p-bare', PASS, BARE, 2, RIM);
  createPixelTexture(scene, 'jo-run-b-bare', RUN_B, BARE, 2, RIM);
  createPixelTexture(scene, 'jo-run-pb-bare', PASS_B, BARE, 2, RIM);
  createPixelTexture(scene, 'jo-sit-bare', POSES['jo-sit'], BARE, 2, RIM);
}
