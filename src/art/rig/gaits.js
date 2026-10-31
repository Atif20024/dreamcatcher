// Per-character gaits (motion skill §6, Phase 2 motion package). The gait is
// the character: a bouncer rolls his weight over twelve frames, a guard walks
// with his hands behind his back, the landlady hurries on short steps, the
// scalper skulks and then sprints, a kid bounces. Every cycle is generated so
// the planted foot moves back exactly `step` 1× px a frame: the runtime plays
// it locked to distance (2 × step screen px a frame at the 2× bake), so no
// figure ever slides. Pure JS: the atlas bake and the runtime both read it.

const STAND = { fF: [1, 0, 'flat'], fB: [-1, 0, 'flat'], aF: [-4, 10], aB: [6, 12] };
const P = (o = {}) => ({ ...STAND, ...o });
const mirror = (f) => ({ ...f, fF: f.fB, fB: f.fF, aF: f.aB, aB: f.aF, handF: f.handB, handB: f.handF, heldArm: f.heldArmB, heldArmB: f.heldArm });
const headLag = (frames) => frames.map((f, i) => ({ ...f, headDy: frames[(i + frames.length - 1) % frames.length].hips || 0 }));

// body leg length (1×) → amplitudes scale with it; steps are per body
const LEGS = { m: 16, f: 15, big: 19, elderly: 14, teen: 14, child: 9 };
const legK = (body) => (LEGS[body] || 16) / 16;

// ---- the walk generator ---------------------------------------------------------
// g: n (frames, even), step (1× px a frame), lift, hips[n/2], lean, sway (lean
// rocking ±, opposite each half), chest, torso, head, arms(p) → {aF, aB,
// handF, handB} for p ∈ [0,1) of a half cycle (front leg forward at p = 0)
export function walkCycle(g) {
  const m = g.n / 2;
  const s = g.step;
  const half = m * s;
  const c = Math.round(half / 2); // the heel strikes this far ahead of the hips
  const half1 = [];
  for (let i = 0; i < m; i++) {
    const p = i / m;
    const planted = [c - i * s, 0, i === 0 ? 'heel' : 'flat'];
    const swingX = Math.round(c - half + half * p);
    const h = i === 0 ? 0 : Math.max(1, Math.round(g.lift * Math.sin(Math.PI * p)));
    const swing = [swingX, h, i === 0 ? 'toe' : p >= 0.7 ? 'heel' : p <= 0.25 ? 'toe' : 'lift'];
    const arms = g.arms(p, i);
    half1.push(P({ hips: g.hips[i], lean: g.lean || 0, chest: g.chest || 0, torso: g.torso, head: g.head || 'base', fF: planted, fB: swing, ...arms, _sway: g.sway ? g.sway * Math.sin(Math.PI * p) : 0 }));
  }
  const half2 = half1.map((f) => ({ ...mirror(f), _sway: -f._sway }));
  return headLag([...half1, ...half2].map(({ _sway, ...f }) => ({ ...f, lean: (f.lean || 0) + Math.round(_sway) })));
}

// the run: Jo's four key poses (contact, drive, airborne, reach) with the
// contact frames moving exactly `step` (skill §3)
export function runCycle({ step, k = 1, lean = 2, hips = [0, -1, 2, 1], pump = 1, head = 'base' }) {
  const c = Math.ceil(step * 0.85);
  const d = c - step;
  const H = (v) => Math.max(1, Math.round(v * k));
  const half = [
    { hips: hips[0], fF: [c, 0, 'heel'], fB: [-c, H(5), 'point'], aF: [-40 * pump, 80], aB: [36 * pump, 85] },
    { hips: hips[1], fF: [d, 0, 'flat'], fB: [d + 2, H(7), 'lift'], aF: [-22 * pump, 80], aB: [20 * pump, 85] },
    { hips: hips[2], fF: [d - step, H(2), 'toe'], fB: [c, H(6), 'lift'], aF: [10 * pump, 85], aB: [-14 * pump, 80] },
    { hips: hips[3], fF: [d - step + 1, H(6), 'point'], fB: [c + 2, H(2), 'heel'], aF: [30 * pump, 85], aB: [-36 * pump, 80] },
  ].map((f) => P({ lean, head, handF: 'fist', handB: 'fist', ...f }));
  return headLag([...half, ...half.map(mirror)]);
}

// ---- arm styles ---------------------------------------------------------------
export const swing = (A, e, eb = 6, off = 0) => (p) => {
  const c = Math.cos(Math.PI * p);
  const aF = -A * c + off;
  const aB = A * c + off;
  return { aF: [aF, e + Math.max(0, aF) * (eb / Math.max(1, A))], aB: [aB, e + Math.max(0, aB) * (eb / Math.max(1, A))] };
};
// hands clasped at the small of the back: elbows back, forearms in
const BEHIND = { aF: [-28, 62], aB: [-24, 58], handF: 'fist', handB: 'fist' };
const behind = () => () => BEHIND;
const bentUp = (A, e) => (p) => {
  const c = Math.cos(Math.PI * p);
  return { aF: [20 - A * c, e], aB: [20 + A * c, e], handF: 'fist', handB: 'fist' };
};

// ---- the gaits ----------------------------------------------------------------
// steps per body (1× px a frame); `run` is the chase / hurry cycle
const STEP = { m: 3, f: 3, big: 3, elderly: 2, teen: 3, child: 2 };
const RUN_STEP = { m: 6, f: 5, big: 6, elderly: 4, teen: 6, child: 4 };

export const GAITS = {
  // an ordinary person: upright, arms low and loose, a gentle bob
  plain: (b) => ({ walk: { n: 8, step: STEP[b], lift: 3, hips: [0, -1, 0, 1], arms: swing(20, 8, 8) }, runAbove: 95 }),
  // the bouncer: twelve frames, weight rolled side to side, arms hang wide
  heavy: (b) => ({ walk: { n: 12, step: 2, lift: 2, hips: [0, 0, -1, -1, 0, 1], sway: 1.4, chest: 1, arms: swing(12, 6, 4, 10) }, runAbove: 80, run: { lean: 1, pump: 0.7 } }),
  // cops, guards, security: measured, hands behind the back, chest out
  measured: (b) => ({ walk: { n: 10, step: 3, lift: 2, hips: [0, -1, 0, 0, 1], chest: 1, arms: behind() }, runAbove: 90, handsBehind: true }),
  // the landlady, managers, the collector: hurried, leaning in, short quick steps
  hurried: (b) => ({ walk: { n: 8, step: 2, lift: 2, hips: [0, -1, 0, 0], lean: 2, arms: swing(28, 40, 20) }, runAbove: 110 }),
  // the scalper, the chip runner: a crouched skulk, then a flat-out sprint
  skulk: (b) => ({ walk: { n: 8, step: 3, lift: 2, hips: [-2, -3, -2, -1], lean: 3, torso: 'hunch', arms: (p) => ({ ...swing(10, 50, 0, 25)(p), handF: 'fist', handB: 'fist' }) }, runAbove: 80, run: { lean: 3, step: 7, pump: 1.2 } }),
  // the sous-chef: quick, arms up and bent, ready to pivot
  busy: (b) => ({ walk: { n: 8, step: 3, lift: 3, hips: [0, -1, 0, 1], lean: 1, arms: bentUp(14, 85) }, runAbove: 100 }),
  // carrying a load (roadie, dock hand): leaning back, wide, slow
  carry: (b) => ({ walk: { n: 12, step: 2, lift: 1, hips: [0, -1, -1, 0, 0, 0], lean: -1, sway: 1, arms: swing(8, 20) }, runAbove: 85, run: { lean: 0, pump: 0.6 } }),
  // a child: bouncy, hips ±2, six frames
  kid: (b) => ({ walk: { n: 6, step: 2, lift: 3, hips: [0, -2, 2], arms: swing(30, 20, 10) }, runAbove: 90 }),
  // the elderly: a short, stooped stroll
  stroll: (b) => ({ walk: { n: 8, step: 2, lift: 1, hips: [0, 0, 0, 1], lean: 1, arms: swing(10, 14) }, runAbove: 100 }),
  // the gym rat: chest out, arms held off the lats
  swagger: (b) => ({ walk: { n: 8, step: 3, lift: 3, hips: [0, -1, 0, 1], chest: 1, lean: -1, arms: swing(18, 30, 10, 12) }, runAbove: 95 }),
  // farmers, cleaners: a plodding, heavy-footed walk
  plod: (b) => ({ walk: { n: 10, step: 3, lift: 3, hips: [0, -1, -1, 0, 1], lean: 1, arms: swing(16, 18) }, runAbove: 95 }),
};

// which gait each foe walks with (src/data/kinds.js textures)
export const FOE_GAITS = {
  'foe-sous-chef': 'busy',
  'foe-dock-hand': 'carry',
  'foe-bouncer': 'heavy',
  'foe-lounge-bouncer': 'heavy',
  'foe-heckler': 'plain',
  'foe-scalper': 'skulk',
  'foe-runner': 'skulk',
  'foe-manager': 'hurried',
  'foe-collector': 'hurried',
  'foe-landlady': 'hurried',
  'foe-proofreader': 'hurried',
  'foe-roadie': 'carry',
  'foe-floor-security': 'measured',
  'foe-security': 'measured',
  'foe-guard': 'measured',
  'foe-gendarme': 'measured',
  'foe-pit': 'stroll',
  'foe-gardener': 'stroll',
  'foe-gym-rat': 'swagger',
  'foe-cleaner': 'plod',
  'foe-farmer': 'plod',
  'foe-talker': 'plain',
  'foe-petitioner': 'plain',
  'foe-shopkeeper': 'busy',
  // THE MASTER'S LADDER: the rival's apprentices skulk then sprint, the
  // guild's inspectors walk hands behind the back, the foreman rolls his weight
  'foe-rn-rival': 'skulk',
  'foe-rn-inspector': 'measured',
  'foe-rn-foreman': 'heavy',
  // THE LAST HAND: Crake, the debt man, walks with his hands behind him; he never runs
  'foe-lq-crake': 'measured',
};
// people who stand still for a living get no run (saves atlas space)
export const NO_RUN = new Set(['foe-heckler', 'foe-talker', 'foe-lq-crake']);

export function gaitName(key, body) {
  if (FOE_GAITS[key]) return FOE_GAITS[key];
  if (body === 'child') return 'kid';
  if (body === 'elderly') return 'stroll';
  if (body === 'big') return 'heavy';
  return 'plain';
}

// the walk + run pose tables for one body and gait
export function gaitPoses(name, body) {
  const g = (GAITS[name] || GAITS.plain)(body);
  const walk = walkCycle(g.walk);
  const r = g.run || {};
  const run = runCycle({ step: r.step || RUN_STEP[body] || 6, k: legK(body), lean: r.lean ?? 2, pump: r.pump ?? 1 });
  return { walk, run, walkStep: g.walk.step, walkN: g.walk.n, runStep: r.step || RUN_STEP[body] || 6, runAbove: g.runAbove, handsBehind: !!g.handsBehind };
}

// ---- signature idles (foes) ---------------------------------------------------
// every foe stands like himself: the bouncer rolls his shoulders, the guard
// taps a foot, the landlady checks her watch, the scalper looks over his
// shoulder. 8 frames at IDLE_FPS.
export const IDLE_FPS = 5;
const sig = {
  plain: () => [0, 0, 1, 1, 1, 0, 0, 0].map((c, i) => P({ chest: c, head: i === 4 ? 'blink' : 'base', headFlip: i === 6 || i === 7 })),
  heavy: () => [0, 1, 2, 3, 2, 1, 0, 0].map((t, i) => P({ chest: t > 1 ? 1 : 0, lean: [0, -1, -1, 0, 1, 1, 0, 0][i], fF: [3, 0, 'flat'], fB: [-3, 0, 'flat'], aF: [8 + t * 3, 8], aB: [10 - t * 3, 8], handF: 'fist', handB: 'fist', head: i === 5 ? 'blink' : 'base' })),
  measured: () => [0, 1, 0, 1, 0, 0, 0, 0].map((t, i) => P({ ...BEHIND, chest: 1, fF: [3, t, t ? 'heel' : 'flat'], fB: [-2, 0, 'flat'], head: i === 6 ? 'blink' : 'base', headFlip: i === 5 })),
  hurried: () => [0, 1, 2, 2, 2, 1, 0, 0].map((t, i) => P({ lean: 1, aF: t === 0 ? [-6, 12] : t === 1 ? [40, 80] : [55, 110], handF: 'fist', head: t === 2 ? 'down' : i === 7 ? 'blink' : 'base', fF: [2, i === 6 ? 1 : 0, i === 6 ? 'heel' : 'flat'] })),
  skulk: () => [0, 0, 1, 1, 0, 0, 1, 0].map((t, i) => P({ hips: -2, lean: 3, torso: 'hunch', aF: [20, 50], aB: [25, 50], handF: 'fist', handB: 'fist', headFlip: !!t, head: i === 4 ? 'blink' : 'base' })),
  busy: () => [0, 1, 0, 1, 0, 1, 0, 0].map((t, i) => P({ lean: 1, aF: [45 + t * 10, 70 - t * 10], aB: [50 - t * 10, 60 + t * 10], handF: 'flat', handB: 'flat', head: i === 6 ? 'blink' : 'down' })),
  carry: () => [0, 0, 1, 2, 2, 1, 0, 0].map((t, i) => P({ lean: -1, fF: [3, 0, 'flat'], fB: [-3, 0, 'flat'], aB: t ? [120 + t * 10, 100] : [10, 20], chest: t ? 1 : 0, head: t === 2 ? 'blink' : 'base' })),
  kid: () => [0, 1, 0, 1, 2, 1, 0, 0].map((t, i) => P({ hips: t, fF: [1, t ? 1 : 0, t ? 'toe' : 'flat'], fB: [-1, t ? 1 : 0, t ? 'toe' : 'flat'], aF: [10 + t * 10, 20], aB: [-10, 20], head: i === 4 ? 'talk' : 'base' })),
  stroll: () => [0, 0, 1, 1, 1, 0, 0, 0].map((c, i) => P({ chest: c, lean: 1, aF: [10, 30], aB: [15, 30], head: i === 5 ? 'blink' : 'base' })),
  swagger: () => [0, 1, 2, 1, 0, 0, 0, 0].map((t, i) => P({ chest: 1, lean: -1, fF: [3, 0, 'flat'], fB: [-3, 0, 'flat'], aF: t ? [60 + t * 15, 110] : [12, 30], aB: [14, 30], handF: 'fist', head: i === 6 ? 'blink' : 'base' })),
  plod: () => [0, 0, 1, 2, 2, 1, 0, 0].map((t, i) => P({ lean: 1, aF: t ? [100 + t * 20, 120] : [10, 20], handF: t ? 'fist' : 'open', head: t === 2 ? 'blink' : 'base' })),
};
export function signatureIdle(name) {
  return (sig[name] || sig.plain)();
}

// ---- NPC task loops (by what they hold) ---------------------------------------
// the world looks employed: a broom sweeps, a ledger gets read, a tray gets
// wiped. `heldArm` replaces the prop's carrying arm for that frame.
const LOOP = {
  broom: [28, 34, 42, 50, 46, 38, 30, 24].map((a, i) => P({ heldArm: [a, 40 - (a - 28)], lean: i > 2 && i < 6 ? 1 : 0, head: 'down' })),
  tray: [0, 1, 2, 3, 2, 1, 0, 0].map((t) => P({ aB: [40 + t * 6, 50 - t * 8], handB: 'flat' })),
  clipboard: [0, 0, 1, 1, 0, 2, 2, 0].map((t) => P({ head: 'down', aB: t === 2 ? [60, 60] : [8, 14], heldArm: t === 1 ? [16, 90] : null })),
  ledger: [0, 0, 1, 1, 0, 2, 2, 0].map((t) => P({ head: 'down', aB: t === 2 ? [60, 60] : [8, 14], heldArm: t === 1 ? [16, 90] : null })),
  book: [0, 0, 0, 1, 2, 0, 0, 0].map((t) => P({ head: 'down', aB: t ? [55 + t * 5, 50] : [8, 14] })),
  accordion: [0, 1, 2, 3, 2, 1, 0, 0].map((t) => P({ heldArm: [15 + t * 3, 75 - t * 5], heldArmB: [10 - t * 2, 80 + t * 4], head: t === 3 ? 'blink' : 'base', chest: t > 1 ? 1 : 0 })),
  bass: [0, 1, 0, 1, 0, 1, 0, 0].map((t) => P({ aF: [40 + t * 12, 60], handF: 'fist', head: 'down', hips: t ? -1 : 0 })),
  string: [0, 1, 2, 1, 0, 1, 2, 1].map((t) => P({ heldArm: [70 + t * 8, 40 - t * 6], head: 'up' })),
  rod: [0, 0, 1, 2, 1, 0, 0, 0].map((t) => P({ heldArm: [45 + t * 6, 30 - t * 4], head: 'base' })),
  bottle: [0, 0, 1, 2, 2, 1, 0, 0].map((t) => P({ heldArm: t ? [70 + t * 30, 70 - t * 10] : [20, 50], head: t === 2 ? 'up' : 'base', lean: t === 2 ? -1 : 0 })),
  can: [0, 1, 0, 1, 0, 0, 0, 0].map((t) => P({ heldArm: [10 + t * 25, 10 + t * 20], lean: t })),
  tickets: [0, 1, 0, 1, 0, 2, 0, 0].map((t) => P({ heldArm: [40 + t * 20, 70 - t * 10], headFlip: t === 2 })),
  flower: [0, 0, 1, 2, 2, 1, 0, 0].map((t) => P({ heldArm: t ? [60 + t * 30, 80] : [30, 70], head: t === 2 ? 'blink' : 'base' })),
  brush: [0, 1, 2, 3, 2, 1, 0, 0].map((t) => P({ heldArm: [40 + t * 12, 60 - t * 8], lean: t > 1 ? 1 : 0 })),
  ladle: [0, 1, 2, 1, 0, 1, 2, 1].map((t) => P({ heldArm: [30 + t * 10, 60 - t * 10], head: 'down' })),
  coil: [0, 1, 2, 3, 2, 1, 0, 0].map((t) => P({ aB: [30 + t * 10, 60], handB: 'fist', head: 'down' })),
  rope: [0, 1, 2, 3, 2, 1, 0, 0].map((t) => P({ aB: [30 + t * 10, 60], handB: 'fist', head: 'down' })),
  basket: [0, 0, 1, 1, 0, 0, 0, 0].map((t, i) => P({ hips: t ? -1 : 0, hx: 0, chest: t, head: i === 5 ? 'blink' : 'base', headFlip: i === 6 })),
  crate: [0, 0, 1, 1, 0, 0, 0, 0].map((t) => P({ hips: t ? -1 : 0, lean: -t, chest: t })),
  case: [0, 0, 1, 1, 0, 0, 0, 0].map((t, i) => P({ chest: t, headFlip: i === 4 || i === 5 })),
};
LOOP.kite_string = LOOP.string;
LOOP.suitcase = LOOP.case;
// empty hands: shift the weight, look along the street, check the time
const LOOP_FREE = [0, 0, 1, 1, 0, 0, 2, 2].map((t, i) =>
  P({ chest: t === 1 ? 1 : 0, fF: [t === 1 ? 2 : 1, 0, 'flat'], headFlip: t === 2, aF: t === 1 ? [30, 90] : [-4, 10], handF: t === 1 ? 'fist' : 'open', head: i === 3 ? 'blink' : 'base' })
);
export function taskLoop(held) {
  return LOOP[held] || LOOP_FREE;
}

// what the runtime needs to play a key: frame counts and screen px per frame
// (2× bake), and when the walk gives way to the run
export function strideInfo(name, body, hasRun) {
  const g = gaitPoses(name, body);
  return {
    gait: name,
    walk: [g.walkN, g.walkStep * 2],
    run: hasRun ? [8, g.runStep * 2] : null,
    runAbove: g.runAbove,
    idle: [8, IDLE_FPS],
  };
}
