// Jo's pose tables (character-motion skill §3–4, references/walk-run-tables.md).
// Every frame is a pose for the human skeleton (src/art/rig/human.js):
// numbers, not drawings. Feet: [x from hip, height above ground, boot].
// Arms: [shoulder angle from straight down, + forward; elbow bend].

const STAND = { fF: [1, 0, 'flat'], fB: [-1, 0, 'flat'], aF: [-4, 10], aB: [6, 12] };
const P = (o = {}) => ({ ...STAND, ...o });
const mirrorLegs = (f) => ({ ...f, fF: f.fB, fB: f.fF, aF: f.aB, aB: f.aF });
// head lags the hips by one frame (skill §3)
const withHeadLag = (frames) => frames.map((f, i) => ({ ...f, headDy: frames[(i + frames.length - 1) % frames.length].hips || 0 }));

// ---- walk: N=8, the planted foot moves 3 px a frame (step 3 → S=12) -------
const WALK_HALF = [
  { hips: 0, fF: [6, 0, 'heel'], fB: [-6, 0, 'toe'], aF: [-26, 14], aB: [24, 24] }, // contact
  { hips: -1, fF: [3, 0, 'flat'], fB: [-5, 2, 'toe'], aF: [-16, 14], aB: [16, 20] }, // recoil
  { hips: 0, fF: [0, 0, 'flat'], fB: [-1, 4, 'lift'], aF: [-3, 14], aB: [3, 16] }, // passing
  { hips: 1, fF: [-3, 0, 'flat'], fB: [4, 2, 'heel'], aF: [12, 20], aB: [-12, 14] }, // high
];
const WALK = withHeadLag([...WALK_HALF, ...WALK_HALF.map(mirrorLegs)].map((f) => P({ head: 'base', ...f })));

// ---- run: N=8, contact frames move 7 px a frame (step 7); two airborne ----
const RUN_HALF = (k = 1) => [
  { hips: 0, fF: [6, 0, 'heel'], fB: [-6, Math.round(5 * k), 'point'], aF: [-40 * k, 80], aB: [36 * k, 85] }, // contact
  { hips: -1, fF: [-1, 0, 'flat'], fB: [1, Math.round(7 * k), 'lift'], aF: [-22 * k, 80], aB: [20 * k, 85] }, // drive
  { hips: 2, fF: [-8, 2, 'toe'], fB: [6, Math.round(6 * k), 'lift'], aF: [10 * k, 85], aB: [-14 * k, 80] }, // airborne push-off
  { hips: 1, fF: [-7, Math.round(6 * k), 'point'], fB: [8, 2, 'heel'], aF: [30 * k, 85], aB: [-36 * k, 80] }, // reach
];
const run = (k, lean) => withHeadLag([...RUN_HALF(k), ...RUN_HALF(k).map(mirrorLegs)].map((f) => P({ lean, handF: 'fist', handB: 'fist', ...f })));
const RUN = run(1, 2);
const JOG = run(0.7, 1);

// ---- idle: a breath (chest up on 3–6), a blink on 6 ---------------------
const IDLE = [0, 0, 0, 1, 1, 1, 1, 0].map((c, i) => P({ chest: c, head: i === 6 ? 'blink' : 'base' }));
// fidget: lift the hat brim with the front hand, settle it, look back
const IDLE_FIDGET = [
  P({ aF: [60, 70] }),
  P({ aF: [110, 70], handF: 'up' }),
  P({ aF: [140, 60], handF: 'up', hat: { dy: -1 } }),
  P({ aF: [140, 60], handF: 'up', hat: { dy: -1, dx: 1 } }),
  P({ aF: [120, 70], handF: 'up' }),
  P({ aF: [40, 40] }),
  P({ head: 'base', headFlip: true }),
  P({ head: 'base', headFlip: true, chest: 1 }),
];
const POCKETS = [0, 0, 1, 1, 1, 0].map((c) => P({ chest: c, aF: [-2, 30], aB: [2, 30], handF: 'none', handB: 'none' }));

// ---- starts, stops, turns --------------------------------------------------
const RUN_START = [
  P({ hips: -1, lean: 3, fF: [2, 0, 'flat'], fB: [-6, 0, 'toe'], aF: [-30, 60], aB: [30, 70], handF: 'fist', handB: 'fist' }),
  P({ hips: 0, lean: 3, fF: [5, 3, 'lift'], fB: [-7, 1, 'toe'], aF: [20, 80], aB: [-30, 70], handF: 'fist', handB: 'fist' }),
  P({ hips: 1, lean: 2, fF: [7, 2, 'heel'], fB: [-7, 4, 'point'], aF: [-30, 80], aB: [30, 80], handF: 'fist', handB: 'fist' }),
];
const SKID = [
  P({ hips: -1, lean: -2, fF: [7, 0, 'heel'], fB: [-4, 0, 'toe'], aF: [40, 30], aB: [-30, 30] }),
  P({ hips: -2, lean: -3, fF: [8, 0, 'heel'], fB: [-3, 0, 'flat'], aF: [55, 30], aB: [-40, 30] }),
  P({ hips: -2, lean: -2, fF: [7, 0, 'heel'], fB: [-3, 0, 'flat'], aF: [45, 30], aB: [-30, 30] }),
  P({ hips: -1, lean: 0, fF: [4, 0, 'flat'], fB: [-3, 0, 'flat'], aF: [15, 20], aB: [-5, 20] }),
];
// turn, drawn in the NEW facing (the sprite flips with the input): momentum
// still carries back, the feet cross, then he pushes off the other way
const TURN = [
  P({ hips: -1, lean: -2, fF: [-3, 0, 'flat'], fB: [-6, 0, 'toe'], aF: [-30, 30], aB: [30, 30], head: 'base' }),
  P({ hips: -1, lean: 0, fF: [-1, 0, 'flat'], fB: [1, 0, 'flat'], aF: [-10, 30], aB: [10, 30] }),
  P({ hips: 0, lean: 2, fF: [4, 2, 'lift'], fB: [-4, 0, 'toe'], aF: [20, 60], aB: [-20, 60], handF: 'fist', handB: 'fist' }),
];

// ---- jump ------------------------------------------------------------------
const JUMP_ANTICIPATE = [
  P({ hips: -3, lean: 1, fF: [2, 0, 'flat'], fB: [-2, 0, 'flat'], aF: [-30, 20], aB: [-20, 20], head: 'down' }),
  P({ hips: -4, lean: 2, fF: [2, 0, 'flat'], fB: [-2, 0, 'flat'], aF: [-45, 20], aB: [-35, 20], head: 'down' }),
];
const RISE = [
  P({ hips: 1, lean: 1, fF: [2, 2, 'toe'], fB: [-3, 4, 'point'], aF: [140, 20], aB: [110, 30], head: 'up' }),
  P({ hips: 1, fF: [4, 6, 'point'], fB: [-2, 4, 'point'], aF: [150, 15], aB: [125, 25], head: 'up' }),
  P({ hips: 1, fF: [4, 7, 'point'], fB: [-2, 5, 'point'], aF: [145, 15], aB: [120, 25], head: 'up' }),
];
const APEX = [
  P({ hips: 1, fF: [5, 6, 'point'], fB: [-3, 6, 'point'], aF: [105, 10], aB: [95, 15] }),
  P({ hips: 1, fF: [5, 6, 'point'], fB: [-3, 6, 'point'], aF: [100, 15], aB: [90, 20] }),
];
const FALL = [
  P({ hips: 1, fF: [3, 2, 'flat'], fB: [-3, 3, 'point'], aF: [125, -5], aB: [100, 10], head: 'down' }),
  P({ hips: 1, fF: [3, 1, 'flat'], fB: [-3, 2, 'point'], aF: [135, -10], aB: [110, 5], head: 'down' }),
  P({ hips: 1, fF: [3, 1, 'flat'], fB: [-3, 2, 'point'], aF: [130, -5], aB: [105, 10], head: 'down' }),
];
const LAND = [
  P({ hips: -4, lean: 1, fF: [3, 0, 'flat'], fB: [-3, 0, 'flat'], aF: [35, 20], aB: [30, 20], head: 'down' }),
  P({ hips: -3, lean: 1, fF: [3, 0, 'flat'], fB: [-3, 0, 'flat'], aF: [25, 20], aB: [20, 20] }),
  P({ hips: -1, fF: [2, 0, 'flat'], fB: [-2, 0, 'flat'], aF: [10, 15], aB: [10, 15] }),
  P({ hips: 0 }),
];
const HARD_LAND = [
  P({ hips: -8, lean: 4, torso: 'hunch', fF: [4, 0, 'flat'], fB: [-4, 0, 'toe'], aF: [55, -20], aB: [45, -10], head: 'down', hat: { dy: 1, dx: 1 } }),
  P({ hips: -8, lean: 4, torso: 'hunch', fF: [4, 0, 'flat'], fB: [-4, 0, 'toe'], aF: [55, -20], aB: [45, -10], head: 'down', hat: { dy: 1, dx: 1 } }),
  P({ hips: -6, lean: 3, torso: 'hunch', fF: [4, 0, 'flat'], fB: [-4, 0, 'toe'], aF: [40, 0], aB: [35, 0], head: 'down', hat: { dy: 1 } }),
  P({ hips: -4, lean: 2, fF: [3, 0, 'flat'], fB: [-3, 0, 'flat'], aF: [25, 10], aB: [20, 10] }),
  P({ hips: -2, lean: 1, fF: [2, 0, 'flat'], fB: [-2, 0, 'flat'], aF: [10, 10], aB: [10, 10] }),
  P({ hips: 0 }),
];

// ---- crouch (fits a two-tile corridor: about 31 rows, 62 px) ---------------
const CROUCHED = { hips: -10, lean: 3, torso: 'hunch', fF: [5, 0, 'flat'], fB: [-4, 0, 'toe'], aF: [40, 50], aB: [30, 50] };
const CROUCH = [P({ ...CROUCHED, hips: -4, lean: 1 }), P({ ...CROUCHED, hips: -8 }), P(CROUCHED)];
const CROUCH_WALK = withHeadLag(
  [
    { fF: [6, 0, 'flat'], fB: [-5, 0, 'toe'], hips: -10 },
    { fF: [3, 0, 'flat'], fB: [-3, 2, 'toe'], hips: -11 },
    { fF: [0, 0, 'flat'], fB: [1, 3, 'lift'], hips: -10 },
    { fB: [6, 0, 'flat'], fF: [-5, 0, 'toe'], hips: -10 },
    { fB: [3, 0, 'flat'], fF: [-3, 2, 'toe'], hips: -11 },
    { fB: [0, 0, 'flat'], fF: [1, 3, 'lift'], hips: -10 },
  ].map((f, i) => P({ ...CROUCHED, ...f, aF: [30 + (i % 3) * 8, 50], aB: [36 - (i % 3) * 8, 50] }))
);

// ---- ladder: hands and feet alternate; hips sway ±1 ------------------------
const CLIMB = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
  const s = i < 4 ? 1 : -1;
  const t = i % 4;
  const hi = [8, 5, 2, 0][t];
  return P({
    hips: [0, 1, 0, -1][t],
    hx: s,
    fF: [2, s > 0 ? hi : 8 - hi, 'flat'],
    fB: [1, s > 0 ? 8 - hi : hi, 'flat'],
    aF: [s > 0 ? 165 - t * 12 : 130 + t * 12, 10],
    aB: [s > 0 ? 130 + t * 12 : 165 - t * 12, 10],
    head: 'up',
    lean: 1,
  });
});
const CLIMB_IDLE = [P({ fF: [2, 4, 'flat'], fB: [1, 0, 'flat'], aF: [160, 10], aB: [135, 10], head: 'up', lean: 1 })];

// ---- walls -----------------------------------------------------------------
const WALL_SLIDE = [
  P({ hips: 2, lean: 1, fF: [6, 7, 'flat'], fB: [-1, 3, 'point'], aF: [95, -10], aB: [150, 10], handF: 'flat', head: 'down' }),
  P({ hips: 2, lean: 1, fF: [6, 6, 'flat'], fB: [-1, 2, 'point'], aF: [95, -5], aB: [155, 10], handF: 'flat', head: 'down' }),
];
const WALL_JUMP = [
  P({ hips: 1, lean: 2, fF: [3, 5, 'lift'], fB: [-8, 4, 'toe'], aF: [150, 10], aB: [120, 30], head: 'up' }),
  P({ hips: 1, lean: 1, fF: [4, 7, 'point'], fB: [-6, 5, 'point'], aF: [145, 15], aB: [125, 25], head: 'up' }),
  P({ hips: 1, fF: [4, 7, 'point'], fB: [-2, 5, 'point'], aF: [140, 15], aB: [120, 25] }),
];

// ---- push, carry, interact -------------------------------------------------
const PUSH = [0, 1, 2, 3, 4, 5].map((i) => {
  const a = [[3, -7], [2, -6], [4, -7], [-6, 2], [-7, 3], [-6, 4]][i];
  return P({ hips: -2 + (i % 3 === 1 ? -1 : 0), lean: 4, fF: [a[0], 0, a[0] < 0 ? 'toe' : 'flat'], fB: [a[1], 0, a[1] < 0 ? 'toe' : 'flat'], aF: [78, 8], aB: [72, 12], handF: 'flat', handB: 'flat', head: 'down' });
});
const CARRY_ARMS = { aF: [65, 75], aB: [55, 80] };
const CARRY_IDLE = [0, 0, 1, 1].map((c) => P({ ...CARRY_ARMS, chest: c }));
const CARRY_WALK = WALK.map((f) => ({ ...f, ...CARRY_ARMS }));
const INTERACT = [
  P({ aF: [40, 30], lean: 1 }),
  P({ aF: [70, 15], lean: 2, hx: 1, fF: [3, 0, 'flat'] }),
  P({ aF: [85, 5], lean: 2, hx: 1, fF: [3, 0, 'flat'], handF: 'flat' }),
  P({ aF: [75, 30], lean: 1, hx: 1, fF: [3, 0, 'flat'], handF: 'fist' }),
  P({ aF: [45, 50], lean: 0, handF: 'fist' }),
  P({ aF: [10, 20] }),
];

// ---- hurt, caught, death, wake ---------------------------------------------
const HURT = [
  P({ hips: 0, lean: -3, fF: [2, 2, 'point'], fB: [-3, 0, 'toe'], aF: [60, 40], aB: [40, 30], head: 'wince' }),
  P({ hips: 1, lean: -4, fF: [3, 3, 'point'], fB: [-2, 2, 'point'], aF: [75, 30], aB: [55, 30], head: 'wince' }),
  P({ hips: 0, lean: -2, fF: [3, 1, 'flat'], fB: [-3, 0, 'toe'], aF: [45, 30], aB: [35, 30], head: 'wince' }),
  P({ hips: -1, lean: 0, fF: [2, 0, 'flat'], fB: [-2, 0, 'flat'], aF: [15, 20], aB: [10, 20] }),
];
const CAUGHT = [
  P({ lean: -2, aF: [120, 40], aB: [80, 60], head: 'wince', fF: [3, 0, 'heel'], fB: [-3, 0, 'toe'] }),
  P({ lean: -2, aF: [80, 60], aB: [120, 40], head: 'wince', fF: [2, 1, 'point'], fB: [-3, 0, 'toe'] }),
  P({ hips: 2, lean: -1, aF: [130, 30], aB: [100, 50], head: 'wince', fF: [2, 4, 'point'], fB: [-2, 3, 'point'] }),
  P({ hips: 3, lean: -1, aF: [100, 50], aB: [130, 30], head: 'wince', fF: [3, 6, 'point'], fB: [-1, 5, 'point'] }),
  P({ hips: 3, lean: -1, aF: [125, 40], aB: [95, 50], head: 'wince', fF: [2, 6, 'point'], fB: [-2, 6, 'point'] }),
  P({ hips: 2, rot: -30, aF: [140, 20], aB: [120, 30], head: 'wince', fF: [4, 5, 'point'], fB: [-3, 4, 'point'] }),
  P({ hips: 2, rot: -60, aF: [150, 10], aB: [130, 20], head: 'wince', fF: [4, 5, 'point'], fB: [-3, 4, 'point'] }),
  P({ hips: 2, rot: -90, aF: [160, 10], aB: [140, 20], head: 'wince', fF: [4, 5, 'point'], fB: [-3, 4, 'point'] }),
];
const KNEEL = { hips: -8, lean: 2, torso: 'hunch', fF: [5, 0, 'flat'], fB: [-5, 0, 'toe'], aF: [30, 20], aB: [20, 20], head: 'down' };
const DEATH = [
  P({ lean: -2, aF: [60, 40], aB: [40, 30], head: 'wince', fF: [2, 1, 'flat'], fB: [-3, 0, 'toe'] }),
  P({ hips: -4, lean: 1, aF: [30, 30], aB: [25, 30], head: 'wince', fF: [3, 0, 'flat'], fB: [-3, 0, 'toe'] }),
  P(KNEEL),
  P({ ...KNEEL, hips: -10, aF: [60, -10], aB: [50, -10] }),
  P({ ...KNEEL, rot: 35, rotPivot: 'feet', aF: [80, -10], aB: [70, -10], hat: { dx: 2, dy: 1 } }),
  P({ ...KNEEL, rot: 70, rotPivot: 'feet', aF: [100, 0], aB: [90, 0], hat: { dx: 3, dy: 2, q: 1 } }),
  P({ hips: -2, rot: 90, rotPivot: 'feet', shift: [-2, -3], fF: [1, 0, 'flat'], fB: [-1, 1, 'flat'], aF: [150, 20], aB: [30, 20], head: 'sleep', hat: false }),
  P({ hips: -2, rot: 90, rotPivot: 'feet', shift: [-2, -3], fF: [1, 0, 'flat'], fB: [-1, 1, 'flat'], aF: [150, 20], aB: [30, 20], head: 'sleep', hat: false }),
];
const WAKE = [P(KNEEL), P({ ...KNEEL, hips: -6, head: 'base' }), P({ hips: -3, lean: 1, fF: [3, 0, 'flat'], fB: [-3, 0, 'flat'], aF: [20, 20], aB: [15, 20] }), P({ chest: 1 })];

// ---- celebrate: one hop, hat raised in the hand, back on --------------------
const CELEBRATE = [
  P({ hips: -3, lean: 1, fF: [2, 0, 'flat'], fB: [-2, 0, 'flat'], aF: [-30, 30], aB: [-20, 30] }),
  P({ hips: 2, fF: [2, 3, 'point'], fB: [-2, 2, 'point'], aF: [170, 5], aB: [150, 20], handF: 'fist', head: 'up' }),
  P({ hips: 2, fF: [3, 5, 'point'], fB: [-2, 4, 'point'], aF: [175, 0], aB: [140, 20], handF: 'fist', head: 'laugh', hat: { dy: -4, dx: 1 } }),
  P({ hips: 1, fF: [3, 3, 'point'], fB: [-2, 2, 'point'], aF: [170, 5], aB: [130, 20], handF: 'fist', head: 'laugh', hat: { dy: -2 } }),
  P({ hips: -3, lean: 1, fF: [3, 0, 'flat'], fB: [-3, 0, 'flat'], aF: [120, 40], aB: [40, 30], handF: 'fist', head: 'laugh' }),
  P({ hips: -1, fF: [2, 0, 'flat'], fB: [-2, 0, 'flat'], aF: [100, 80], aB: [20, 20], handF: 'fist', head: 'laugh' }),
  P({ fF: [2, 0, 'flat'], fB: [-2, 0, 'flat'], aF: [90, 100], aB: [10, 20], handF: 'fist', head: 'laugh' }),
  P({ chest: 1 }),
];

// ---- zero-g: limbs loose, a slow drift (rotatable at runtime) ---------------
const FLOAT = [0, 1, 2, 3].map((i) => {
  const w = [0, 1, 0, -1][i];
  return P({ hips: 1, fF: [3 + w, 5, 'point'], fB: [-3, 3 - w, 'point'], aF: [95 + w * 8, 25], aB: [70 - w * 8, 30], lean: -1, head: 'base' });
});

// ---- dream tools -----------------------------------------------------------
// trumpet: both hands up at the mouth, cheeks out, a lean back on the long note
const PLAY_TRUMPET = [0, 1, 2, 3, 4, 5].map((i) => {
  const sway = [0, -1, -1, -2, -1, 0][i];
  return P({ lean: sway, hips: i === 3 ? -1 : 0, aF: [95, 78], aB: [85, 85], head: 'blow', handF: 'fist', handB: 'fist' });
});
// a swing (ladle, shove): anticipation 2, hit 1, recovery 3
const SWING = [
  P({ lean: -1, aF: [-70, 60], aB: [20, 30], handF: 'fist', fF: [2, 0, 'flat'], fB: [-3, 0, 'flat'] }),
  P({ lean: -2, hips: -1, aF: [-100, 60], aB: [30, 30], handF: 'fist', fF: [3, 0, 'flat'], fB: [-4, 0, 'toe'] }),
  P({ lean: 3, hips: -1, hx: 2, aF: [85, 0], aB: [-30, 30], handF: 'fist', fF: [7, 0, 'heel'], fB: [-4, 0, 'toe'] }),
  P({ lean: 2, hips: -1, hx: 2, aF: [70, 10], aB: [-20, 30], handF: 'fist', fF: [6, 0, 'flat'], fB: [-4, 0, 'toe'] }),
  P({ lean: 1, hx: 1, aF: [45, 30], aB: [0, 20], fF: [4, 0, 'flat'], fB: [-3, 0, 'flat'] }),
  P({ aF: [10, 20] }),
];
const PEN = [
  P({ aF: [120, 40], handF: 'fist', head: 'down' }),
  P({ aF: [140, 30], handF: 'fist', head: 'down', lean: -1 }),
  P({ aF: [60, 10], handF: 'fist', head: 'down', lean: 2, hx: 1 }),
  P({ aF: [50, 30], handF: 'fist', head: 'down', lean: 1 }),
];
const TYPE = [0, 1, 2, 3].map((i) => P({ aF: [62 + (i % 2) * 6, 60 - (i % 2) * 10], aB: [56 + ((i + 1) % 2) * 6, 64], head: 'down', lean: 1 }));
const BRUSH = [150, 120, 90, 60, 35].map((a, i) => P({ aF: [a, 10], handF: 'fist', lean: i < 2 ? -1 : 1, hx: i > 2 ? 1 : 0 }));
const BRUSH_HOLD = RUN.map((f) => ({ ...f, aF: [70, 10], handF: 'fist' }));

// ---- the long evening -----------------------------------------------------
const SEATED = { hips: -7, fF: [6, 0, 'flat'], fB: [5, 0, 'flat'], aF: [30, 50], aB: [25, 50] };
const SIT_DOWN = [P({ hips: -2, lean: 1, aF: [20, 20] }), P({ hips: -4, lean: 2, fF: [3, 0, 'flat'], fB: [-1, 0, 'flat'], aF: [30, 30] }), P({ ...SEATED, hips: -6, lean: 1 }), P(SEATED)];
const SIT = [P(SEATED), P({ ...SEATED, chest: 1 })];
// on the ground (no bench): hips down on the grass, knees up, hands behind
const GROUND = { hips: -14, lean: -1, fF: [10, 0, 'heel'], fB: [8, 0, 'heel'], aF: [-35, 10], aB: [-45, 10], handF: 'flat', handB: 'flat' };
const SIT_GROUND = [P(GROUND), P({ ...GROUND, chest: 1 })];
const SIT_UP = [P({ ...SEATED, head: 'up' }), P({ ...SEATED, head: 'up', chest: 1 })];
const SLEEP = [P({ ...SEATED, head: 'sleep', lean: -1 }), P({ ...SEATED, head: 'sleep', lean: -1, chest: 1 })];
const LOOK_UP = [P({ head: 'up', lean: -1 }), P({ head: 'up', lean: -1, chest: 1 })];
const LAUGH = [0, 1, 0, 1].map((c) => P({ head: 'laugh', chest: c, lean: c ? -1 : 0, aF: [20, 70], aB: [15, 60] }));
const SHRUG = [P({ aF: [20, 60], aB: [15, 60] }), P({ aF: [35, 95], aB: [30, 95], chest: 1, handF: 'flat', handB: 'flat' }), P({ aF: [35, 100], aB: [30, 100], chest: 1, handF: 'flat', handB: 'flat' })];
const WAVE = [0, 1, 2, 1].map((i) => P({ aF: [150, -20 + i * 25], handF: 'up', head: 'laugh' }));

export const POSES = {
  idle: IDLE, idle_fidget: IDLE_FIDGET, pockets: POCKETS,
  walk: WALK, jog: JOG, run: RUN, run_start: RUN_START, skid: SKID, turn: TURN,
  jump_anticipate: JUMP_ANTICIPATE, rise: RISE, apex: APEX, fall: FALL, land: LAND, hard_land: HARD_LAND,
  crouch: CROUCH, crouch_walk: CROUCH_WALK, climb: CLIMB, climb_idle: CLIMB_IDLE,
  wall_slide: WALL_SLIDE, wall_jump: WALL_JUMP, push: PUSH, carry_idle: CARRY_IDLE, carry_walk: CARRY_WALK, interact: INTERACT,
  hurt: HURT, caught: CAUGHT, death: DEATH, wake: WAKE, celebrate: CELEBRATE, float: FLOAT,
  play_trumpet: PLAY_TRUMPET, swing: SWING, pen: PEN, type: TYPE, brush: BRUSH, brush_hold: BRUSH_HOLD,
  sit_down: SIT_DOWN, sit: SIT, sit_ground: SIT_GROUND, sit_up: SIT_UP, sleep: SLEEP, look_up: LOOK_UP, laugh: LAUGH, shrug: SHRUG, wave: WAVE,
};
