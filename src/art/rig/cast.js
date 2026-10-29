// The cast rig (round 2 WP2). Every NPC, crowd figure and human foe is built
// on Jo's skeleton (src/art/rig/human.js) from a "look" — the hat, palette and
// held thing today's string-art used — plus a body (adult m/f, big, elderly,
// teen, child) from src/data/scale.js CAST_BODIES. So they stand at Jo's
// scale (1 m = 44 px), walk with real legs, and keep the faces and colours
// they already had. Pure JS: the atlas build (scripts/build-atlas.js) runs it
// in Node and bakes every frame under the texture keys the scenes already use.
import jo from '../../data/rigs/jo.js';
import { composeHuman } from './human.js';
import { stamp, outline } from './compose.js';
import { gaitPoses, gaitName as gaitNameOf, signatureIdle, taskLoop } from './gaits.js';


// ---- colour ---------------------------------------------------------------------
const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const hex = ([r, g, b]) => (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
export const mix = (a, b, t) => {
  const A = rgb(a);
  const B = rgb(b);
  return hex(A.map((v, i) => v + (B[i] - v) * t));
};
const LIGHT = 0xfff0d0; // warm key light, top-left
const COOL = 0x262046; // shadows go cool (hue-shifted, not just darker)
const lum = (c) => {
  const [r, g, b] = rgb(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
// [hi, base, shade, deep] for one material
export function tones(c) {
  const dark = lum(c) < 0.18;
  return [mix(c, LIGHT, dark ? 0.24 : 0.3), c, mix(mix(c, 0x000000, 0.22), COOL, 0.28), mix(mix(c, 0x000000, 0.48), COOL, 0.3)];
}

// ---- bodies ----------------------------------------------------------------------
// Torsos face right: a coat (base colour) with a lighter placket/collar (the
// look's trim), a belt and the trouser top. Anchor = the hip point.
const TORSO_ADULT = jo.parts.torso.base;
const TORSO_HUNCH = jo.parts.torso.hunch;
const TORSO_DRESS = TORSO_ADULT.map((r, i) => (i === 9 ? '..jJJJJj.' : i === 10 ? '..JJJJJj.' : r));
const TORSO_F = [
  '...IJWW..',
  '..IJJJJWj',
  '.IJJJJJWw',
  '.IJJJJJWw',
  '..IJJJWWj',
  '..IJJJWwj',
  '..IJJJJWj',
  '..IJJJJWj',
  '..jJJJJjj',
  '..KKKKuK.',
  '..QPPPPp.',
];
const TORSO_F_DRESS = TORSO_F.map((r, i) => (i === 9 ? '..jJJJJj.' : i === 10 ? '..JJJJJj.' : r));
const TORSO_BIG = [
  '....IJJWW..',
  '..IIJJJJJWj',
  '.IJJJJJJJWw',
  'IJJJJJJJJWw',
  'IJJJJJJJJWj',
  'IJJJJJJJJWj',
  'IJJJJJJJJWj',
  '.IJJJJJJJWj',
  '.IJJJJJJJWj',
  '..jJJJJJJjj',
  '..KKKKKKuK.',
  '..QPPPPPPp.',
];
const TORSO_CHILD = [
  '..IJWW.',
  '.IJJJWj',
  '.IJJJWw',
  '.IJJJWj',
  '.IJJJWj',
  '.jJJJjj',
  '.KKKuK.',
  '.QPPPp.',
];
const TORSO_CHILD_DRESS = TORSO_CHILD.map((r, i) => (i === 6 ? '.jJJJj.' : i === 7 ? '.JJJJj.' : r));
// a skirt / dress hem / apron, stamped over the front leg (anchor = the hip)
const SKIRT = { rows: ['..JJJJJj.', '.IJJJJJjj', '.IJJJJJJj', 'IJJJJJJJj', 'IJJJJJJJjj', 'jjjjjjjjjj'], ox: 4, oy: 0 };
const SKIRT_CHILD = { rows: ['.JJJJj.', 'IJJJJjj', 'IJJJJJj', 'jjjjjjj'], ox: 3, oy: 0 };
const APRON = { rows: ['....WWw.', '...WWWWw', '...WWWWw', '...WWWWw', '...WWWWw', '...wwwww'], ox: 4, oy: 1 };

const SOLE = 56;
function metrics(m) {
  const legLen = m.thigh + m.shin + 2;
  return { W: 64, H: 64, ax: 32, ay: 58, sole: SOLE, hipY: SOLE - legLen + 1, hipSep: 0.6, ...m };
}
export const BODIES = {
  // Jo's metrics: 76 px hatless, the reference adult (1.73 m)
  m: { metrics: metrics({ thigh: 8, shin: 8, upper: 7, fore: 6, thighR: 2.15, shinR: 1.75, armR: 1.7, foreR: 1.5 }), torso: TORSO_ADULT, dress: TORSO_DRESS, anchor: [4, 10], neck: [5, -1], sF: [5, 1], sB: [4, 1], skirt: SKIRT, k: 1 },
  // 1.66 m, narrower shoulders
  f: { metrics: metrics({ thigh: 7, shin: 8, upper: 6, fore: 6, thighR: 2.0, shinR: 1.6, armR: 1.55, foreR: 1.35 }), torso: TORSO_F, dress: TORSO_F_DRESS, anchor: [4, 10], neck: [5, -1], sF: [5, 1], sB: [4, 1], skirt: SKIRT, k: 15 / 16 },
  // 1.95 m and broad: bouncers, security, Marcus
  big: { metrics: metrics({ thigh: 9, shin: 10, upper: 8, fore: 7, thighR: 2.6, shinR: 2.1, armR: 2.1, foreR: 1.85, hipSep: 1 }), torso: TORSO_BIG, dress: TORSO_BIG, anchor: [5, 11], neck: [6, -1], sF: [7, 2], sB: [4, 2], skirt: SKIRT, k: 19 / 16 },
  // 1.62 m with a stoop
  elderly: { metrics: metrics({ thigh: 7, shin: 7, upper: 6, fore: 6, thighR: 2.0, shinR: 1.6, armR: 1.55, foreR: 1.35 }), torso: TORSO_HUNCH, dress: TORSO_HUNCH.map((r, i) => (i === 9 ? '..jJJJJj.' : i === 10 ? '..JJJJJj.' : r)), anchor: [4, 10], neck: [5, 0], sF: [5, 2], sB: [4, 2], skirt: SKIRT, k: 14 / 16, lean: 1 },
  // 1.62 m, slight
  teen: { metrics: metrics({ thigh: 7, shin: 7, upper: 6, fore: 6, thighR: 1.9, shinR: 1.5, armR: 1.45, foreR: 1.3 }), torso: TORSO_F, dress: TORSO_F_DRESS, anchor: [4, 10], neck: [5, -1], sF: [5, 1], sB: [4, 1], skirt: SKIRT, k: 14 / 16 },
  // 1.25 m: a big head on a short body
  child: { metrics: metrics({ thigh: 5, shin: 4, upper: 4, fore: 4, thighR: 1.7, shinR: 1.4, armR: 1.3, foreR: 1.2 }), torso: TORSO_CHILD, dress: TORSO_CHILD_DRESS, anchor: [3, 7], neck: [4, -1], sF: [4, 1], sB: [3, 1], skirt: SKIRT_CHILD, k: 9 / 16 },
};

// ---- heads (9×9, profile facing right, anchor = the neck at (3, 8)) -----------------
// Phase 2 motion: a row and a column bigger than WP2's 8×8 so the face reads
// at game zoom: a brow (hair colour) over a 2×2 eye (white + pupil), a nose
// that sticks out, a 2 px mouth, an ear. a hair, N hair light, R/S/s/t skin,
// i eye white, e pupil, m mouth, X the foe's red glint (alert)
const HAIR = {
  short: ['..aaaaa..', '.aNNaaaa.', '.aaaaSSRR', '.aasSaaS.', '.aasSieSS', '.aasSieSS', '..sSSSmm.', '..tsSSSs.', '...ss....'],
  crop: ['...aaa...', '..aNaaa..', '.aaaaSSRR', '.asSSaaS.', '.asSSieSS', '.asSSieSS', '..sSSSmm.', '..tsSSSs.', '...ss....'],
  long: ['..aaaaa..', '.aNNaaaa.', 'aaaaaSSRR', 'aaaSSaaS.', 'aaasSieSS', 'aaasSieSS', '.aasSSmm.', '.aatsSSs.', '...ss....'],
  bob: ['.aaaaaa..', 'aaNNaaaa.', 'aaaaaSSRR', 'aaaSSaaS.', 'aaasSieSS', 'aaasSieSS', '.a.sSSmm.', '..tsSSSs.', '...ss....'],
  bun: ['aa.aaaa..', 'aaaNaaaa.', '.aaaaSSRR', '.aasSaaS.', '.aasSieSS', '.aasSieSS', '..sSSSmm.', '..tsSSSs.', '...ss....'],
  tuft: ['...a.a...', '..aaaaa..', '.aNaaSSRR', '.asSSaaS.', '.asSSieSS', '.asSSieSS', '..sSSSmm.', '..tsSSSs.', '...ss....'],
  bald: ['...RRR...', '..RSSSRR.', '.RSSSSSRR', '.sSSSaaS.', '.ssSSieSS', '.ssSSieSS', '..sSSSmm.', '..tsSSSs.', '...ss....'],
};
HAIR.grey = HAIR.short;
const setAt = (rows, r, c, ch) => rows.map((x, i) => (i === r ? x.slice(0, c) + ch + x.slice(c + ch.length) : x));
export function headSet(base, beard) {
  let b = base;
  if (beard === 'moustache') b = setAt(b, 6, 5, 'aaa');
  else if (beard) b = setAt(setAt(setAt(b, 6, 2, 'aSaaa'), 7, 2, 'taaaa'), 8, 3, 'aa');
  const eyes = (r, a, c) => setAt(setAt(r, 4, 5, a), 5, 5, c);
  const mouth = (r, a, c) => setAt(setAt(r, 6, 6, a), 7, 6, c);
  const blink = eyes(b, 'SS', 'ee');
  const talk = beard ? setAt(b, 7, 6, 'm') : mouth(b, 'mm', 'mS');
  const laugh = beard ? setAt(blink, 7, 6, 'mm') : mouth(blink, 'mm', 'mm');
  // the foe's notice: the brow drops toward the nose, the pupil goes red
  const alert = setAt(setAt(eyes(b, 'iX', 'iX'), 3, 5, 'Sa'), 3, 7, 'a');
  const shout = beard ? setAt(alert, 7, 6, 'mm') : mouth(alert, 'mm', 'mm');
  // puzzled: the brow up, the pupil glancing back
  const search = setAt(setAt(eyes(b, 'ei', 'ei'), 3, 5, 'SS'), 2, 5, 'aa');
  return { base: b, blink, talk, laugh, wince: blink, sleep: blink, down: b, up: b, blow: b, alert, shout, search };
}

// ---- hats (anchor at the neck like Jo's porkpie: rows sit above the head) --------
// H/U/h/g hat, y/r/n band, a hair under it
const HATS = {
  cap: { rows: ['..UHHHH...', '.UHHHHHH..', '.hhhhhhhhh'], ox: 4, oy: 8 },
  broom: { rows: ['..UHHHH...', '.UHHHHHH..', '.hhhhhhhhh'], ox: 4, oy: 8 },
  peaked: { rows: ['..UHHHHH..', '.UHHHHHHH.', '.yyyyyyyr.', '..hhhhhhhh'], ox: 4, oy: 9 },
  beanie: { rows: ['...UHH....', '.UUHHHHH..', '.UHHHHHHh.', '.hhhhhhhh.'], ox: 4, oy: 8 },
  fedora: { rows: ['...UHHH...', '..UHHHHh..', '..yyyyyr..', 'hhHHHHHHhh'], ox: 4, oy: 9 },
  toque: { rows: ['..UUHHH...', '.UHHHHHHh.', '.UHHHHHHh.', '..UHHHHh..', '..hhhhhh..'], ox: 4, oy: 10 },
  baker: { rows: ['..UHHHHH..', '.UHHHHHHh.', '..hhhhhh..'], ox: 4, oy: 9 },
  straw: { rows: ['....UHHH....', '...UHHHHH...', '...yyyyyr...', 'hhHHHHHHHHhh'], ox: 6, oy: 9 },
  bandana: { rows: ['..UHHHH...', '.UHHHHHHh.', 'hHhhhhhh..', 'h.........'], ox: 4, oy: 8 },
  headset: { rows: ['..hhhhh...', '.h.....h..', '.......h..', '......yh..', '....yy....'], ox: 4, oy: 8 },
  scarf: { rows: ['..UHHHH...', '.UHHHHHH..', 'UHHHHh....', 'HHHHh.....', 'HHHh......', 'HHHh......', '.Hh.......'], ox: 4, oy: 8 },
  wrap: { rows: ['..UHHHH...', '.UHHHHHH..', '.HhHHhHHh.', '.hhhhhhhh.'], ox: 4, oy: 9 },
  veil: { rows: ['..UHHHH...', '.UHHHHHH..', 'UHHHHh....', 'HHHHh.....', 'HHHh......', 'HHHh......', 'HHh.......', 'Hh........'], ox: 4, oy: 8 },
  // Phase 2 motion: silhouettes a line of foes can be told apart by
  kepi: { rows: ['..UHHHH...', '..UHHHHh..', '..UHHHHh..', '..yyyyyr..', '..hhhhhhhh'], ox: 4, oy: 10 },
  helmet: { rows: ['..UUHHHH..', 'UHHHHHHHHh', 'UHHHHHHHhh', 'yyyyyyyyyr', 'h........h'], ox: 5, oy: 8 },
  earpiece: { rows: ['.i', '.i', 'i.', 'i.'], ox: 1, oy: 3 },
  // THE MASTER'S LADDER (era costume): the soft flat berretta of a workshop,
  // and the mazzocchio, a padded roll with its tail hanging behind
  berretta: { rows: ['...UHHHH...', '.UHHHHHHHh.', 'hhhhhhhhhhh'], ox: 5, oy: 8 },
  mazzocchio: { rows: ['...UHHHH...', '.UyyyyyyyH.', 'Uyyyyyyyyyh', '.hnnnnnnnh.', 'H..........', 'H..........', 'h..........'], ox: 5, oy: 9 },
};
// heads grew a row (phase 2 motion): every hat sits one row higher
for (const h of Object.values(HATS)) h.oy += 1;
// look hats that are really hair
const HAIR_HATS = { none: null, tuft: 'tuft', bob: 'bob', bun: 'bun', crop: 'crop' };

// ---- held things (anchor = the grip, at the front hand) ---------------------------
// A prop base, Z light, x shade; F/f wood or metal
const HELD = {
  basket: { rows: ['..FFF.', '.F...F', 'ZAAAAA', 'AxAxAA', '.AAAx.'], ox: 3, oy: 0, arm: [8, 6] },
  accordion: { rows: ['ZAZAZ', 'AxAxA', 'ZAZAZ', 'AxAxA', 'FFFFF'], ox: 1, oy: 2, arm: [15, 75], back: [10, 80] },
  rope: { rows: ['.AAA.', 'A...A', 'A.x.A', '.AAA.'], ox: 2, oy: 0, arm: [12, 20] },
  string: { rows: ['..Z', '.Z.', '.Z.', 'Z..', 'Z..'], ox: 0, oy: 4, arm: [70, 40] },
  tray: { rows: ['.ZA.ZA.', 'ZZZZZZZ', 'xAAAAAx'], ox: 2, oy: 2, arm: [25, 110], hand: 'flat' },
  rod: { rows: ['..........Z', '.........F.', '........F..', '.......F...', '......F....', '.....F.....', '....F......', '...F.......', '..F........', '.FF........', 'FF.........'], ox: 1, oy: 9, arm: [45, 30] },
  book: { rows: ['ZAA', 'AAx', 'xxx'], ox: 1, oy: 1, arm: [12, 80] },
  bass: { rows: ['....F', '....F', '...FF', '..AAA', '.ZAxA', 'AZAAA', 'AAxAA', '.AAA.'], ox: 3, oy: 3, arm: [20, 70], back: [40, 50] },
  can: { rows: ['F.....', '.FZAA.', '..AAAA', '..AxAA', '..AAA.'], ox: 3, oy: 1, arm: [10, 10] },
  brush: { rows: ['A', 'F', 'F', 'F'], ox: 0, oy: 2, arm: [30, 70] },
  broom: { rows: ['.F.', '.F.', '.F.', '.F.', '.F.', '.F.', '.F.', '.F.', '.F.', '.F.', '.F.', 'ZAA', 'AxA', 'AxA'], ox: 1, oy: 4, arm: [28, 40] },
  ledger: { rows: ['ZZZ', 'AxA', 'AAA', 'AxA'], ox: 1, oy: 1, arm: [12, 80] },
  clipboard: { rows: ['.F.', 'ZZZ', 'AxA', 'AAA', 'AxA'], ox: 1, oy: 2, arm: [12, 80] },
  tickets: { rows: ['ZA', 'Ax'], ox: 0, oy: 1, arm: [40, 70] },
  bottle: { rows: ['.Z.', '.A.', 'ZAA', 'AxA', 'AAA'], ox: 1, oy: 3, arm: [20, 50] },
  crate: { rows: ['FFFFFFF', 'FfffffF', 'FFFFFFF', 'FfffffF', 'FFFFFFF'], ox: 1, oy: 2, arm: [65, 75], back: [55, 80] },
  coil: { rows: ['.AAA.', 'A.Z.A', 'A...A', '.AAx.'], ox: 2, oy: 0, arm: [15, 25] },
  ladle: { rows: ['F', 'F', 'F', 'AA', 'Ax'], ox: 0, oy: 1, arm: [30, 60] },
  flower: { rows: ['.Z.', 'ZAZ', '.F.', '.F.'], ox: 1, oy: 2, arm: [30, 70] },
  kite_string: null,
  case: { rows: ['..FF..', '.F..F.', 'AAAAAA', 'AZAAAx', 'AAAAAx', 'AAAAAx', 'xxxxxx'], ox: 3, oy: 0, arm: [6, 4] },
};
HELD.kite_string = HELD.string;

// ---- the rig ------------------------------------------------------------------
const SKIN_EYE = 0x16121a;
export function bodyOf(spec, look) {
  if (spec.body === 'child' || (look.kid && !spec.body)) return 'child';
  if (spec.body) return spec.body;
  return spec.sex === 'f' ? 'f' : 'm';
}

export function castRig(look, spec = {}) {
  const pal = look.pal || {};
  const bodyName = bodyOf(spec, look);
  const B = BODIES[bodyName === 'elderly' && spec.sex === 'f' ? 'elderly' : bodyName];
  const hatName = spec.hat || look.hat || 'none';
  const hairStyle = spec.hair || (hatName in HAIR_HATS ? HAIR_HATS[hatName] : null) || 'short';
  const hairIsHat = hatName in HAIR_HATS; // the look's H was the hair colour
  const H = pal.H ?? 0x2a2230;
  const hairC = spec.hair === 'grey' ? 0xb8b4b0 : hairIsHat || hatName === 'none' ? H : spec.sex === 'f' ? 0x3a2418 : 0x2a2024;
  const T = pal.T ?? 0x5a5a66;
  const trim = pal.t ?? mix(T, 0xffffff, 0.3);
  const P = pal.P ?? 0x3a3a44;
  const S = pal.S ?? 0xc09070;
  const boot = pal.B ?? 0x1e1e28;
  const A = pal.A ?? 0xe8e4d8;
  const band = pal.h && pal.h !== pal.H ? pal.h : mix(H, 0x000000, 0.4);
  const [I, J, j, q] = tones(T);
  const [Wl, W, w, v] = tones(trim);
  const [Q, Pp, p, o] = tones(P);
  const [R, Ss, s, t] = tones(S);
  const [C, Bb, b, d] = tones(boot);
  const [U, Hh, h, g] = tones(H);
  const [y, r, n] = tones(band);
  const [N, a] = tones(hairC);
  const [Z, Ab, x] = tones(A);
  const palette = {
    k: 0x1a1828,
    I, J, j, q, W: mix(W, Wl, 0.3), w, v, Q, P: Pp, p, o, R, S: Ss, s, t, C, B: Bb, b, d, U, H: Hh, h, g, y, r, n,
    a, N, Z, A: Ab, x, F: 0x6a4a32, f: 0x4a3222,
    K: mix(P, 0x000000, 0.55), u: 0xd8b050, m: mix(S, 0x4a1a20, 0.55), e: SKIN_EYE, i: 0xf0ece0, X: 0xe02828,
  };
  const families = {
    jacket: ['I', 'J', 'j', 'q'],
    pants: ['Q', 'P', 'p', 'o'],
    skin: ['R', 'S', 's', 't'],
    boot: ['C', 'B', 'b', 'd'],
    hat: ['U', 'H', 'h', 'g'],
    shirt: ['W', 'W', 'w', 'v'],
    band: ['y', 'r', 'n', 'n'],
    hair: ['N', 'a', 'a', 'a'],
    prop: ['Z', 'A', 'x', 'x'],
    wood: ['F', 'F', 'f', 'f'],
  };
  const torso = spec.dress ? B.dress : B.torso;
  // variant 'b' (a second foe of the same kind): facial hair toggled and, if
  // the hair shows, a different cut — same palette, never a clone
  const alt = spec.variant === 'b';
  const SWAP = { short: 'crop', crop: 'short', long: 'bob', bob: 'long', bun: 'bob', bald: 'crop', tuft: 'short', grey: 'bald' };
  const hairShows = hairIsHat || hatName === 'none' || hatName === 'earpiece' || hatName === 'headset';
  const variantHair = alt && hairShows ? SWAP[hairStyle] || hairStyle : hairStyle;
  const variantBeard = alt ? (spec.beard ? null : 'moustache') : spec.beard || null;
  const parts = {
    ...jo.parts,
    torso: { base: torso, hunch: torso },
    torsoAnchor: B.anchor,
    neckAt: B.neck,
    shoulderF: B.sF,
    shoulderB: B.sB,
    head: headSet(HAIR[variantHair] || HAIR.short, variantBeard),
    headAnchor: [3, 8],
    hat: HATS[hatName] || { rows: [], ox: 0, oy: 0, flipShift: 0 },
    over: spec.dress ? B.skirt : spec.apron ? APRON : null,
  };
  return { id: 'cast', palette, families, metrics: B.metrics, parts, body: bodyName, k: B.k, lean: B.lean || 0 };
}

// ---- poses -------------------------------------------------------------------
// Jo's tables, scaled to the body's leg length (so planted feet still move
// exactly one step a frame), with the held thing's arm swapped in.
function scalePose(pose, k) {
  if (k === 1) return pose;
  const f = (ft) => (ft ? [ft[0] * k, Math.round(ft[1] * k), ft[2]] : ft);
  return { ...pose, fF: f(pose.fF), fB: f(pose.fB), hips: Math.round((pose.hips || 0) * (k < 0.8 ? 0.7 : k)), hx: pose.hx ? pose.hx * k : pose.hx };
}
const STAND = { fF: [1, 0, 'flat'], fB: [-1, 0, 'flat'], aF: [-4, 10], aB: [6, 12] };
const P = (o = {}) => ({ ...STAND, ...o });
const TALK = [
  P({ aF: [30, 60], head: 'talk' }),
  P({ aF: [55, 50], head: 'base', chest: 1, handF: 'flat' }),
  P({ aF: [70, 40], head: 'talk', chest: 1, handF: 'flat', headDy: 1 }),
  P({ aF: [40, 55], head: 'base' }),
];
const IDLE = [0, 1, 1, 0].map((c, i) => P({ chest: c, head: i === 3 ? 'blink' : 'base' }));
const WAVE = [0, 1, 2, 1].map((i) => P({ aF: [150, -20 + i * 25], handF: 'up', head: 'talk' }));
const SEATED = { hips: -7, fF: [6, 0, 'flat'], fB: [5, 0, 'flat'], aF: [30, 50], aB: [25, 50] };
// foes: the notice (3 frames: the head snaps round, the brow drops, the red
// glint, then a point), the tell (0.4 s, weight back, arms back then up), the
// grab (lunge, both hands out), the throw (lift and heave), the search
// (scratch the head, look both ways) and a stagger when Jo shoves him
const FOE = {
  alert: [
    P({ head: 'alert', hips: 1, lean: -2, aF: [30, 50], aB: [25, 50], chest: 1, headDy: 2, handF: 'open', handB: 'open' }),
    P({ head: 'shout', hips: 0, lean: -1, fF: [3, 0, 'flat'], fB: [-2, 0, 'flat'], aF: [40, 70], aB: [20, 60], chest: 1 }),
    P({ head: 'alert', hips: 0, lean: 1, fF: [3, 0, 'flat'], fB: [-2, 0, 'flat'], aF: [85, 5], aB: [10, 30], handF: 'flat' }),
  ],
  windup: [
    P({ head: 'alert', hips: -1, lean: -1, fF: [4, 0, 'flat'], fB: [-4, 0, 'flat'], aF: [-30, 40], aB: [-40, 40] }),
    P({ head: 'shout', hips: -2, lean: -2, fF: [5, 0, 'flat'], fB: [-5, 0, 'toe'], aF: [-60, 60], aB: [-65, 60] }),
    P({ head: 'shout', hips: -3, lean: -2, fF: [5, 0, 'flat'], fB: [-5, 0, 'toe'], aF: [120, 40], aB: [110, 40], handF: 'open', handB: 'open' }),
  ],
  grab: [
    P({ head: 'shout', hips: -1, lean: 3, fF: [7, 0, 'flat'], fB: [-6, 0, 'toe'], aF: [85, 0], aB: [80, 5], handF: 'flat', handB: 'flat' }),
    P({ head: 'alert', hips: 0, lean: 2, fF: [6, 0, 'flat'], fB: [-5, 0, 'toe'], aF: [95, -10], aB: [88, -5], handF: 'fist', handB: 'fist' }),
  ],
  throw: [
    P({ head: 'shout', hips: -2, lean: -1, aF: [120, 20], aB: [110, 20], handF: 'fist', handB: 'fist' }),
    P({ head: 'shout', hips: 0, lean: 2, fF: [5, 0, 'flat'], fB: [-4, 0, 'toe'], aF: [160, -10], aB: [150, -10], handF: 'open', handB: 'open' }),
    P({ head: 'base', hips: 0, lean: 1, aF: [40, 20], aB: [30, 20] }),
  ],
  search: [
    P({ head: 'search', aF: [140, 70], aB: [6, 12], handF: 'fist' }),
    P({ head: 'search', aF: [150, 80], aB: [6, 12], handF: 'fist' }),
    P({ head: 'search', headFlip: true, aF: [10, 30], aB: [10, 30] }),
    P({ head: 'blink', aF: [10, 30], aB: [10, 30] }),
  ],
  stagger: [
    P({ head: 'blink', hips: 0, lean: -3, fF: [3, 2, 'point'], fB: [-4, 0, 'toe'], aF: [70, 40], aB: [50, 30] }),
    P({ head: 'shout', hips: -1, lean: -2, fF: [4, 0, 'flat'], fB: [-4, 0, 'flat'], aF: [40, 30], aB: [30, 30] }),
  ],
};

// opts: { key, gait }. Walks and runs come from the gait generator
// (src/art/rig/gaits.js) per body: exact integer steps, never scaled, so the
// planted foot moves one step a frame.
export function castPoses(rig, held, opts = {}) {
  const k = rig.k;
  const lean = rig.lean;
  const H = HELD[held] || null;
  const withHeld = (pose) => {
    if (!H) return pose;
    const out = { ...pose, aF: pose.heldArm || H.arm, handF: H.hand || 'fist' };
    if (H.back) out.aB = pose.heldArmB || H.back;
    return out;
  };
  const hold = (pose) => scalePose(withHeld({ ...pose, lean: (pose.lean || 0) + lean }), k);
  const plain = (pose) => scalePose({ ...pose, lean: (pose.lean || 0) + lean }, k);
  const gait = opts.gait || gaitNameOf(opts.key, rig.body);
  const G = gaitPoses(gait, rig.body);
  // a guard walks with both hands behind his back: the clipboard is tucked away
  const tucked = G.handsBehind;
  const gaitHold = (pose) => {
    const p = { ...pose, lean: (pose.lean || 0) + lean };
    return tucked ? { ...p, noHeld: true } : withHeld(p);
  };
  // the signature gesture wins: a held thing follows the gesturing hand
  const sigHold = (pose) => (tucked ? scalePose({ ...pose, noHeld: true, lean: (pose.lean || 0) + lean }, k) : hold({ ...pose, heldArm: pose.aF }));
  const gaitPlain = (pose) => ({ ...pose, lean: (pose.lean || 0) + lean });
  return {
    gait,
    walkStep: G.walkStep,
    runStep: G.runStep,
    runAbove: G.runAbove,
    run: G.run.map(gaitHold),
    sig: signatureIdle(gait).map(sigHold),
    task: taskLoop(held).map(hold),
    freetask: taskLoop(null).map(plain),
    stagger: FOE.stagger.map(plain),
    idle: IDLE.map(hold),
    walk: G.walk.map(gaitHold),
    talk: TALK.map((p) => (H ? hold({ ...p, aB: p.aF, aF: undefined }) : plain(p))),
    wave: WAVE.map(plain),
    laugh: [P({ head: 'laugh', lean: -1, chest: 1 }), P({ head: 'laugh' })].map(hold),
    sit: [P(SEATED), P({ ...SEATED, chest: 1 })].map(hold),
    sitlaugh: [P({ ...SEATED, head: 'laugh', lean: -1 })].map(hold),
    free: IDLE.map(plain),
    freewalk: G.walk.map(gaitPlain),
    alert: FOE.alert.map(plain),
    windup: FOE.windup.map(plain),
    grab: FOE.grab.map(plain),
    throw: FOE.throw.map(plain),
    search: FOE.search.map(plain),
  };
}

// compose one frame: body + skirt/apron + hat + held thing, one outline
export function composeCast(rig, pose, held) {
  const comp = composeHuman(rig, pose);
  const g = comp.body;
  // the composer outlined the body: strip that ring so the extras join it cleanly
  for (let i = 0; i < g.px.length; i++) if (g.px[i] === 'k' && g.part[i] === 'outline') g.px[i] = null;
  const H = HELD[held];
  if (H && comp.attach.hand_f && !pose.noHeld) {
    const [hx, hy] = comp.attach.hand_f;
    // the hand stays in front of the grip
    const keep = [];
    for (let i = 0; i < g.px.length; i++) if (g.part[i] === 'hand_f') keep.push([i, g.px[i]]);
    stamp(g, H.rows, Math.round(hx), Math.round(hy), H.ox, H.oy, 'held');
    for (const [i, ch] of keep) g.px[i] = ch;
  }
  // the hat layer over the head
  const hg = comp.hat;
  for (let i = 0; i < hg.px.length; i++) if (hg.px[i] && hg.px[i] !== 'k') g.px[i] = hg.px[i];
  outline(g, 'k');
  return { grid: g, attach: comp.attach, contacts: comp.contacts };
}

export const HELD_NAMES = Object.keys(HELD);
