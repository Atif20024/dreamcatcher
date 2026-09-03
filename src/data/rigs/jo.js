// Jo — placeholder rig, 20x40 at 1x (40x80 on screen, 2.5 tiles). Authored
// facing right; parts follow the proportions in the motion skill §1:
// hat 5, face 6, neck 1, torso 11, belt 1, legs 16.
//
// Every leg variant records where its contact pixel lands relative to the
// origin (feet anchor, x = 10). The walk table's planted foot must travel
// exactly -10 px over four frames: +5, +3, 0, -2, -5 (deltas alternate 2/3,
// the integer form of -2.5 px per frame), and `contact` on each walk frame
// is that value, so the ground-speed lock can be measured, not assumed.
//
// Letters: k outline · H/h hat base/hi · s/S/d skin base/hi/shadow · e eye
// · w eye white · J/L/D shirt base/hi/shade · B belt · p/P/q pants
// base/hi/shade · b/c boots base/hi.
const PALETTE = {
  k: 'outline',
  H: 'hat',
  h: 'hat-hi',
  s: 'skin',
  S: 'skin-hi',
  d: 'skin-sh',
  e: 'eye',
  w: 'eye-white',
  J: 'jo-blue',
  L: 'jo-blue-hi',
  D: 'jo-blue-sh',
  B: 'belt',
  p: 'pants',
  P: 'pants-hi',
  q: 'pants-sh',
  b: 'boots',
  c: 'boots-hi',
};

// --- head (with neck), 10x7, at [5,5] ------------------------------------
const HEAD = [
  '.kdssSSSsk',
  'kdsSSSSSSk',
  'kdswewSSsk',
  'kdssSSSSsk',
  '.kdsSSSsk.',
  '..kddssk..',
  '...kdsk...',
];
const HEAD_DOWN = ['..........', '.kdssSSSsk', 'kdsSSSSSSk', 'kdsweSwSsk', 'kdssSSSSsk', '.kdsSSSsk.', '..kddssk..'];

// --- hat, 14x5, at [3,0] (an extra: lags the body one frame) ------------
const HAT = ['...kkkkkkkk...', '..kHHHhhhhHk..', '.kHHHHHhhhhhk.', '.kHHHHHHHHHHk.', 'kkkkkkkkkkkkkk'];

// --- torso, 12x12, at [4,11]: collar, shoulders 12 wide, waist 8, belt --
const TORSO = [
  '...kkJJJkk..',
  '.kkDJJJLLLkk',
  'kDDJJJJJLLLLk',
  'kDDJJJJJJLLLk',
  '.kDDJJJJJLLk.',
  '.kDDJJJJJLLk.',
  '.kDDDJJJJLLk.',
  '.kDDDJJJJLLk.',
  '..kDDDJJJLk..',
  '..kDDDJJJLk..',
  '..kBBBBBBBk..',
  '...kkkkkkk...',
];
const TORSO_LEAN_FWD = TORSO.map((r) => r.slice(1) + '.'); // shifted 1 px forward
const TORSO_LEAN_BACK = TORSO.map((r) => '.' + r.slice(0, -1));

// --- arms, 5x9. Back arm drawn first (left of torso), front arm last -----
// swing_fwd: hangs and swings forward (toward +x); swing_back: behind
const ARM_SWING_FWD = ['kDDk.', 'kDDk.', '.kDDk', '.kDJk', '..kJk', '..kdk', '..ksk', '..kSk', '...k.'];
const ARM_SWING_BACK = ['.kDDk', '.kDDk', 'kDDk.', 'kDJk.', 'kJk..', 'kdk..', 'ksk..', 'kSk..', '.k...'];
const ARM_CROSSING = ['.kDDk', '.kDDk', '.kDDk', '.kDJk', '.kJJk', '.kdsk', '.kssk', '.kSSk', '..kk.'];
const ARM_BENT_FWD = ['kDDk.', 'kDDk.', '.kDDk', '..kJJk', '..kds', '.kssk', 'kSSk.', '.kk..', '.....'];

// --- legs, 12x16 canvas, hip at column 6. The contact pixel is the last
// boot row's centre column; `foot` records it as an offset from the hip.
// fwd_straight: heel at +5 (planted, contact)
const LEG_FWD_STRAIGHT = {
  foot: 5,
  grid: [
    '.....kqppPk.',
    '.....kqppPk.',
    '.....kqpPPk.',
    '......kppPk.',
    '......kqpPPk',
    '......kqpPPk',
    '.......kpPPk',
    '.......kppPk',
    '.......kqpPk',
    '........kpPk',
    '........kpPk',
    '........kqPk',
    '........kbbk',
    '........kbck',
    '.......kbbbk',
    '.......kkkkk',
  ],
};
// fwd_bent: knee forward, foot at +3 (planted, taking weight)
const LEG_FWD_BENT = {
  foot: 3,
  grid: [
    '.....kqppPk.',
    '.....kqppPk.',
    '......kppPk.',
    '......kqpPPk',
    '.......kpPPk',
    '.......kpPPk',
    '.......kqPk.',
    '.......kpPk.',
    '.......kpPk.',
    '.......kqPk.',
    '.......kpPk.',
    '.......kqPk.',
    '.......kbbk.',
    '.......kbck.',
    '......kbbbk.',
    '......kkkkk.',
  ],
};
// pass: straight under the hips, foot at 0 (planted, mid-stride)
const LEG_PASS = {
  foot: 0,
  grid: [
    '.....kqppPk.',
    '.....kqppPk.',
    '.....kqppPk.',
    '.....kqpPPk.',
    '.....kqpPPk.',
    '.....kqpPPk.',
    '.....kqpPk..',
    '.....kqpPk..',
    '.....kqpPk..',
    '.....kqpPk..',
    '.....kqpPk..',
    '.....kqpPk..',
    '.....kbbbk..',
    '.....kbcbk..',
    '....kbbbbk..',
    '....kkkkkk..',
  ],
};
// base: straight, foot at -2 (planted, the high frame)
const LEG_BASE = {
  foot: -2,
  grid: [
    '.....kqppPk.',
    '.....kqppPk.',
    '.....kqppPk.',
    '....kqppPk..',
    '....kqppPk..',
    '....kqpPk...',
    '....kqpPk...',
    '....kqpPk...',
    '...kqppPk...',
    '...kqppk....',
    '...kqpPk....',
    '...kqpPk....',
    '...kbbbk....',
    '...kbcbk....',
    '..kbbbbk....',
    '..kkkkkk....',
  ],
};
// back_straight: trailing, toe at -5 (contact: the foot about to lift)
const LEG_BACK_STRAIGHT = {
  foot: -5,
  grid: [
    '.....kqppPk.',
    '.....kqppk..',
    '....kqppPk..',
    '....kqppk...',
    '...kqppPk...',
    '...kqppk....',
    '..kqppPk....',
    '..kqppk.....',
    '..kqpPk.....',
    '.kqppk......',
    '.kqppk......',
    '.kqpk.......',
    '.kbbbk......',
    'kbbbck......',
    'kbbbbk......',
    'kkkkkk......',
  ],
};
// back_bent: lifted and swinging through, toe at -4 (2 px off the ground)
const LEG_BACK_BENT = {
  foot: -4,
  lifted: 2,
  grid: [
    '.....kqppPk.',
    '.....kqppk..',
    '....kqppPk..',
    '....kqppk...',
    '...kqppPk...',
    '...kqpPk....',
    '..kqppk.....',
    '..kqpPk.....',
    '..kqpk......',
    '.kqppk......',
    '.kqpPk......',
    '.kqpk.......',
    '.kbbbk......',
    '.kbbck......',
    '............',
    '............',
  ],
};
// fwd_bent_reach: knee up, heel reaching for +3 (the high frame's free leg)
const LEG_FWD_REACH = {
  foot: 3,
  lifted: 1,
  grid: [
    '.....kqppPk.',
    '.....kqppPk.',
    '......kppPk.',
    '......kqpPPk',
    '.......kpPPk',
    '.......kpPPk',
    '........kPPk',
    '........kpPk',
    '........kpPk',
    '........kqPk',
    '........kpPk',
    '........kbbk',
    '........kbck',
    '.......kbbbk',
    '.......kkkkk',
    '............',
  ],
};

const legs = () => ({
  at: [4, 23], // hip column 6 lands on x = 10 (the origin)
  base: LEG_BASE.grid,
  variants: {
    fwd_straight: LEG_FWD_STRAIGHT,
    fwd_bent: LEG_FWD_BENT,
    pass: LEG_PASS,
    back_straight: LEG_BACK_STRAIGHT,
    back_bent: LEG_BACK_BENT,
    fwd_reach: LEG_FWD_REACH,
  },
});

const arms = (x) => ({
  at: [x, 13],
  base: ARM_CROSSING,
  variants: { swing_fwd: ARM_SWING_FWD, swing_back: ARM_SWING_BACK, crossing: ARM_CROSSING, bent_fwd: ARM_BENT_FWD },
});

// --- the walk: references/walk-run-tables.md, N=8, S=10 -------------------
// contact = the planted foot's x (front leg in F0-3, back leg in F4-7).
const WALK = [
  { leg_f: 'fwd_straight', leg_b: 'back_straight', arm_f: 'swing_back', arm_b: 'swing_fwd', dy: 0, contact: 5, footstep: true },
  { leg_f: 'fwd_bent', leg_b: 'back_bent', arm_f: 'swing_back', arm_b: 'swing_fwd', dy: -1, contact: 3 },
  { leg_f: 'pass', leg_b: 'back_bent', arm_f: 'crossing', arm_b: 'crossing', dy: 0, contact: 0 },
  { leg_f: 'base', leg_b: 'fwd_reach', arm_f: 'swing_fwd', arm_b: 'swing_back', dy: 1, contact: -2 },
  { leg_f: 'back_straight', leg_b: 'fwd_straight', arm_f: 'swing_fwd', arm_b: 'swing_back', dy: 0, contact: 5, footstep: true },
  { leg_f: 'back_bent', leg_b: 'fwd_bent', arm_f: 'swing_fwd', arm_b: 'swing_back', dy: -1, contact: 3 },
  { leg_f: 'back_bent', leg_b: 'pass', arm_f: 'crossing', arm_b: 'crossing', dy: 0, contact: 0 },
  { leg_f: 'fwd_reach', leg_b: 'base', arm_f: 'swing_back', arm_b: 'swing_fwd', dy: 1, contact: -2 },
];

// idle: 8 frames, chest rises 1 px on frames 3-6
const IDLE = [0, 0, 0, -1, -1, -1, -1, 0].map((dy) => ({ leg_f: 'pass', leg_b: 'base', arm_f: 'crossing', arm_b: 'crossing', dy, contact: 0 }));

export default {
  name: 'jo',
  size: [20, 40],
  origin: [10, 38], // the contact row of the boots
  palette: PALETTE,
  stride: { walk: 10, idle: 0 }, // S per animation (1x px)
  parts: {
    head: { at: [5, 5], base: HEAD, variants: { look_down: HEAD_DOWN } },
    torso: { at: [4, 11], base: TORSO, variants: { lean_fwd: TORSO_LEAN_FWD, lean_back: TORSO_LEAN_BACK } },
    arm_b: arms(0),
    arm_f: arms(14),
    leg_b: legs(),
    leg_f: legs(),
  },
  extras: { hat: { at: [3, 0], grid: HAT } },
  defaultExtras: { hat: false }, // the hat is its own sprite at runtime (D5)
  frames: { walk: WALK, idle: IDLE },
};
