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

// The walk, from the motion tables: contact, recoil, passing, high — then
// the same four with the legs swapped. The near leg (P) is lit, the far leg
// (p) in shade; the hips drop a row on recoil and rise a row on high (the
// Player applies that as a y offset so the feet stay planted); arms swing
// opposite the legs. Player steps through the eight frames by ground
// covered, never by the clock, so a foot never slides.
export const WALK_LEGS = [
  // 0 contact: front heel down ahead, back toe down behind
  ['....PPPPPPPP....', '...pppPPPPPP....', '...ppp....PPP...', '..ppp......PPP..', '..ppp......PPP..', '.ppp........PPP.', '.BBBB......BBBB.', 'BBBB........BBBB'],
  // 1 recoil: front knee takes the weight, back heel lifts
  ['....PPPPPPPP....', '...pppPPPPPP....', '...ppp....PPP...', '..ppp.....PPPP..', '..ppp......PPP..', '.ppp.......PPP..', '.BBBB......BBBB.', '..BB.......BBBB.'],
  // 2 passing: legs together under the hips, back leg swinging through bent
  ['....PPPPPPPP....', '....PPPPPPPP....', '....PPPPpp......', '....PPP.ppp.....', '....PPP..ppp....', '....PPP..BBB....', '...BBBB.........', '...BBBB.........'],
  // 3 high: support leg straight, free leg reaching, heel about to strike
  ['....PPPPPPPP....', '....PPPPPPpp....', '....PPP..ppp....', '....PPP...ppp...', '....PPP....ppp..', '....PPP.....ppp.', '...BBBB.....BBB.', '...BBBB.........'],
  // 4 contact, legs swapped
  ['....PPPPPPPP....', '...PPPPPPppp....', '...PPP....ppp...', '..PPP......ppp..', '..PPP......ppp..', '.PPP........ppp.', '.BBBB......BBBB.', 'BBBB........BBBB'],
  // 5 recoil
  ['....PPPPPPPP....', '...PPPPPPppp....', '...PPP....ppp...', '..PPP.....pppp..', '..PPP......ppp..', '.PPP.......ppp..', '.BBBB......BBBB.', '..BB.......BBBB.'],
  // 6 passing
  ['....PPPPPPPP....', '....PPPPPPPP....', '....pppPPPP.....', '....ppp.PPP.....', '....ppp..PPP....', '....ppp..BBB....', '...BBBB.........', '...BBBB.........'],
  // 7 high
  ['....PPPPPPPP....', '....ppppppPP....', '....ppp..PPP....', '....ppp...PPP...', '....ppp....PPP..', '....ppp.....PPP.', '...BBBB.....BBB.', '...BBBB.........'],
];
// hips, in rows: 0 contact, -1 recoil (down), 0 passing, +1 high (up)
export const WALK_HIPS = [0, -1, 0, 1, 0, -1, 0, 1];

const HEAD = HEAD_AND_TORSO.slice(0, 10);
// arms: both swung out (front forward, back back), both crossing the body
// (front back, back forward), hanging (passing), and raised (a jump)
const TORSO_OUT = ['....JJJJJJJJ....', '..JJJJJJJJJJJJ..', '.JJjWWWWWWWWjJJ.', 'JJJjWWWWWWWWjJJJ', 'JJ.jWWWWWWWWj.JJ', 'SS.JJJJJJJJJJ.SS'];
const TORSO_CROSS = ['....JJJJJJJJ....', '..JJJJJJJJJJJJ..', '.JJjWWWWWWWWjJJ.', '..JjWJWWWWJWjJ..', '...jWJWWWWJWj...', '...JJSJJJJSJJ...'];
const TORSO_HANG = HEAD_AND_TORSO.slice(10);
const TORSO_UP = ['.J..JJJJJJJJ..J.', '.JJJJJJJJJJJJJJ.', '.JJjWWWWWWWWjJJ.', '..JjWWWWWWWWjJ..', '...jWWWWWWWWj...', '...JJJJJJJJJJ...'];
const WALK_ARMS = [TORSO_CROSS, TORSO_CROSS, TORSO_HANG, TORSO_OUT, TORSO_OUT, TORSO_OUT, TORSO_HANG, TORSO_CROSS];
export const JO_WALK = WALK_LEGS.map((_, i) => `jo-walk-${i}`);
const walkFrame = (i) => [...HEAD, ...WALK_ARMS[i], ...WALK_LEGS[i]];
// in the air: knees tucked and arms up on the rise; legs reaching on the fall
const JUMP = [...HEAD, ...TORSO_UP, '....PPPPPPPP....', '...PPPPPPPPPP...', '..PPPP....PPPP..', '..ppp......ppp..', '.BBBB......BBBB.', BLANK_ROW, BLANK_ROW, BLANK_ROW];
const FALL = [...HEAD, ...TORSO_OUT, '....PPPPPPPP....', '....PPPPPPPP....', '...ppp..PPPP....', '...ppp....PPP...', '..ppp.....PPP...', '..ppp......PPP..', '.BBBB......BBBB.', BLANK_ROW];
// breathing: the chest a row higher for the second half of a breath
const IDLE_B = [...HEAD.slice(1), ...TORSO_HANG, ...STAND.slice(16)];
const RUN = walkFrame(0);
export const JO_POSE_KEYS = () => ['jo-stand', 'jo-idle-b', 'jo-run', 'jo-jump', 'jo-fall', ...JO_WALK];

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
  createPixelTexture(scene, 'jo-idle-b', IDLE_B, PALETTE, 2, RIM);
  createPixelTexture(scene, 'jo-jump', JUMP, PALETTE, 2, RIM);
  createPixelTexture(scene, 'jo-fall', FALL, PALETTE, 2, RIM);
  WALK_LEGS.forEach((_, i) => createPixelTexture(scene, `jo-walk-${i}`, walkFrame(i), PALETTE, 2, RIM));
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
  createPixelTexture(scene, 'jo-idle-b-bare', IDLE_B, BARE, 2, RIM);
  createPixelTexture(scene, 'jo-jump-bare', JUMP, BARE, 2, RIM);
  createPixelTexture(scene, 'jo-fall-bare', FALL, BARE, 2, RIM);
  WALK_LEGS.forEach((_, i) => createPixelTexture(scene, `jo-walk-${i}-bare`, walkFrame(i), BARE, 2, RIM));
  createPixelTexture(scene, 'jo-sit-bare', POSES['jo-sit'], BARE, 2, RIM);
}
