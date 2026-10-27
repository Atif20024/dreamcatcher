import Phaser from 'phaser';
import { WALK_LEGS } from './jo.js';
import { mix, hsl } from '../art/paint.js';
import { HUB_PROPS, paintTrainTexture } from '../art/hubArt.js';

// The people and furniture of Crossroads Station.
//
// People are pixel rigs, like Jo and the Evening's cast: 16x24 at 2px, the
// same eight walk frames (WALK_LEGS), a sit pose, a breathing idle done by
// the scene. What is new since the station's first pass is how a cell is
// coloured: every garment is three tones -- lit on the west, a mid, and a
// hue-shifted shade on the east -- and the outline is selective: cut on the
// shadow side, half-strength on the lit side, so the figure reads as a
// drawing with light on it rather than a sticker.
//
// Furniture is painted (src/art/hubArt.js) under the same keys and sizes the
// scene has always used.

const SUN = 0xfff0c8;
const SHADE = 0x2a2048;
const INK = 0x14141c;

// --- people ----------------------------------------------------------------
const HATS = {
  none: ['................', '................', '................', '................'],
  peaked: ['................', '....HHHHHHHH....', '...HHHHHHHHHH...', '..hhhhhhhhhhhh..'],
  scarf: ['................', '................', '....HHHHHHHH....', '...HHHhhhhHHH...'],
  cap: ['................', '................', '....HHHHHHHH....', '..HHHHHHHHHHhh..'],
  wrap: ['................', '....HHHHHHHH....', '...HHHhhHHHHH...', '...HHHHHHHHHH...'],
  tuft: ['................', '................', '......HHHH......', '....HHHHHHHH....'],
  broom: ['................', '................', '....HHHHHHHH....', '...HHhhhhhhHH...'],
};
// a face: brows over the eyes, a mouth, the chin in shade
const HEAD = ['.....SSSSSS.....', '....SwSSSSwS....', '....SbSSSSbS....', '....SSSmmSSS....', '.....ssSSSS.....'];
const TORSO = ['....TTTTTTTT....', '..TTTTTTTTTTTT..', '.TTtTTTTTTTTtTT.', '.TTtTTTTTTTTtTT.', '.TTtTTTTTTTTtTT.', '.SSTTTTTTTTTTSS.', '....TTTTTTTT....'];
const LEGS_STAND = ['....PPPPPPPP....', '....PPPPPPPP....', '....PPP..PPP....', '....PPP..PPP....', '....ppp..ppp....', '....ppp..ppp....', '..BBBB....BBBB..', '..BBBB....BBBB..'];
const LEGS_SIT = ['................', '................', '....PPPPPPPP....', '..PPPPPPPPPPPP..', '..PPPPPPPPPPPP..', '..ppp......ppp..', '..ppp......ppp..', '..BBB......BBB..'];
const HELD = {
  ledger: [[15, 0, 'AA'], [16, 0, 'AA'], [17, 0, 'AA']],
  brush: [[16, 13, 'AA.'], [17, 13, '.A.']],
  tray: [[15, 12, 'AAAA'], [16, 12, 'aAAa']],
  accordion: [[14, 11, 'AAAAA'], [15, 11, 'AaAaA'], [16, 11, 'AAAAA'], [17, 11, 'AaAaA']],
  kite_string: [[13, 14, '.A'], [12, 15, 'A']],
  broom: [[13, 14, '.A'], [14, 14, '.A'], [15, 14, '.A'], [16, 14, '.A'], [17, 14, '.A'], [18, 13, 'aAa'], [19, 13, 'aaa']],
  flower: [[15, 13, '.A.'], [16, 13, 'AAA'], [17, 13, '.a.']],
};
function person(hat, legs, held) {
  const rows = [...(HATS[hat] || HATS.none), ...HEAD, ...TORSO, ...legs].map((r) => [...r]);
  if (held && HELD[held]) {
    for (const [y, x, chars] of HELD[held]) {
      [...chars].forEach((ch, i) => {
        if (ch !== '.' && rows[y] && rows[y][x + i] !== undefined) rows[y][x + i] = ch;
      });
    }
  }
  return rows.map((r) => r.join(''));
}
// H hat, h hat band, S skin, T coat, t coat trim, P trousers, B shoes, A the
// thing they hold (a its shadow)
const P = (H, S, T, t, Pp, B, A, h) => ({
  H,
  h: h ?? mix(H, 0x000000, 0.35),
  S,
  s: mix(S, 0x4a2a20, 0.35),
  w: mix(S, 0x2a1a10, 0.55),
  m: mix(S, 0x4a2a20, 0.45),
  b: 0x1a1a20,
  T,
  t,
  P: Pp,
  p: mix(Pp, 0x000000, 0.25),
  B,
  A: A ?? 0xe8e4d8,
  a: 0x6a5a4a,
});

export const HUB_PEOPLE = {
  pemberton: { hat: 'peaked', held: 'ledger', pal: P(0x2e3a52, 0xc8a080, 0x2e3a52, 0x1f2a3c, 0x2e3a52, 0x1a1a20, 0xf2e6cc, 0xc4a25c) },
  ro: { hat: 'wrap', held: 'brush', sit: true, pal: P(0xc0503a, 0x7a4a30, 0xd88a4a, 0xa8683a, 0x5a3a44, 0x2a1a20, 0x8a6844, 0xf2d580) },
  bilal: { hat: 'cap', held: 'tray', pal: P(0xf2e6cc, 0x9a6a48, 0x6a8a5a, 0x4e6a44, 0x3a3a44, 0x2a2a30, 0xf2d580) },
  busker: { hat: 'scarf', held: 'accordion', pal: P(0x8a3a3a, 0xb08868, 0x5a4a3a, 0x40342a, 0x3a3a44, 0x1e1e28, 0xc03a2a, 0xf2d580) },
  sleeper: { hat: 'none', held: null, sit: true, pal: P(0x8a8478, 0xb09070, 0x6a6a62, 0x50504a, 0x4a4a44, 0x2a2a28, 0x8a8478) },
  kite: { hat: 'tuft', held: 'kite_string', kid: true, pal: P(0x2a2230, 0x8a5a3b, 0xf2c078, 0xc89a5a, 0x3a5a80, 0x2a2a32, 0xe8e4d8) },
  sweeper: { hat: 'broom', held: 'broom', pal: P(0x3a3a44, 0x6a4630, 0x4a5a6a, 0x36444f, 0x3a3a44, 0x1e1e28, 0xb8a06a, 0x8a3a3a) },
  flower: { hat: 'scarf', held: 'flower', sit: true, pal: P(0x6a8a5a, 0xc8a080, 0x9a5a6a, 0x74434f, 0x4a4a52, 0x2a2a30, 0xe86a8a, 0xf2d580) },
};

// The shading pass. Draws a grid at `size` px per cell onto a canvas: each
// filled cell takes its palette colour, lit where the west neighbour is
// open, shaded and hue-shifted where the east one is, a touch darker on an
// underside. The outline is drawn only where it does work.
export function paintRig(scene, key, rows, pal, size = 2, o = {}) {
  const { soft = false, alpha = 1 } = o;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  if (scene.textures.exists(key)) {
    const src = scene.textures.get(key).getSourceImage();
    if (src && src.tagName === 'IMG') return key;
    scene.textures.remove(key);
  }
  const ct = scene.textures.createCanvas(key, w * size, h * size);
  const ctx = ct.getContext();
  const at = (x, y) => (y >= 0 && y < h && x >= 0 && x < w ? rows[y][x] : '.');
  const filled = (x, y) => pal[at(x, y)] !== undefined;
  const cell = (x, y, c, a = 1) => {
    ctx.fillStyle = `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a * alpha})`;
    ctx.fillRect(x * size, y * size, size, size);
  };
  // the outline: full on the east and under, half on the west and above
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (filled(x, y)) continue;
      if (filled(x - 1, y) || filled(x, y - 1)) cell(x, y, INK, soft ? 0.5 : 1);
      else if (filled(x + 1, y) || filled(x, y + 1)) cell(x, y, INK, soft ? 0.25 : 0.55);
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ch = at(x, y);
      const base = pal[ch];
      if (base === undefined) continue;
      let c = base;
      if (ch !== 'b' && ch !== 'w' && ch !== 'm') {
        const westOpen = !filled(x - 1, y);
        const eastOpen = !filled(x + 1, y);
        const westDiff = at(x - 1, y) !== ch;
        const eastDiff = at(x + 1, y) !== ch;
        if (westOpen) c = mix(base, SUN, 0.34);
        else if (westDiff) c = mix(base, SUN, 0.14);
        else if (eastOpen) c = mix(hsl(base, 0.04, 0.08, 0), SHADE, 0.38);
        else if (eastDiff) c = mix(base, SHADE, 0.16);
        if (!filled(x, y + 1) && ch !== 'B') c = mix(c, SHADE, 0.2);
        if (!filled(x, y - 1)) c = mix(c, SUN, 0.1);
      }
      cell(x, y, c);
    }
  ct.refresh();
  return key;
}

function createPerson(scene, key, def) {
  const legs = def.sit ? LEGS_SIT : LEGS_STAND;
  paintRig(scene, key, person(def.hat, legs, def.held), def.pal);
  if (def.sit) {
    // sitters keep a '#1' so old callers (the sleeper waking) still resolve
    paintRig(scene, `${key}#1`, person(def.hat, LEGS_SIT, def.held), def.pal);
    paintRig(scene, `${key}-stand`, person(def.hat, LEGS_STAND, def.held), def.pal);
  }
  WALK_LEGS.forEach((l, i) => paintRig(scene, `${key}${def.sit ? '-walk' : ''}#${i + 1}`, person(def.hat, l, def.held), def.pal));
}

// --- travellers: soft silhouettes ------------------------------------------
// The same rig, but a silhouette: one dark value, no face, a suitcase, and
// the whole thing painted soft (a second, blurred pass under a lighter one)
// so a crowd reads as people in the distance, not tinted stickers.
const CASE = [[15, 12, 'AAAA'], [16, 12, 'AAAA'], [17, 12, 'AAAA'], [18, 12, 'AAAA'], [14, 13, '.AA.']];
function traveller(legs, withCase) {
  const rows = [...HATS.cap, ...HEAD, ...TORSO, ...legs].map((r) => [...r]);
  if (withCase) for (const [y, x, chars] of CASE) [...chars].forEach((ch, i) => ch !== '.' && rows[y] && (rows[y][x + i] = ch));
  return rows.map((r) => r.join(''));
}
const SIL = { H: 0x262a34, h: 0x262a34, S: 0x2e2a34, s: 0x2e2a34, w: 0x2e2a34, m: 0x2e2a34, b: 0x2e2a34, T: 0x2a2a34, t: 0x2a2a34, P: 0x24242c, p: 0x24242c, B: 0x1a1a20, A: 0x3a3226, a: 0x3a3226 };
function paintSilhouette(scene, key, rows) {
  const w = 16 * 2;
  const h = 24 * 2;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tmp = `${key}-tmp`;
  paintRig(scene, tmp, rows, SIL, 2, { soft: true });
  const src = scene.textures.get(tmp).getSourceImage();
  const ct = scene.textures.createCanvas(key, w, h);
  const ctx = ct.getContext();
  // the soft pass: the figure smeared a pixel each way, faint
  ctx.globalAlpha = 0.22;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [2, 1]]) ctx.drawImage(src, dx, dy);
  ctx.globalAlpha = 0.9;
  ctx.drawImage(src, 0, 0);
  // fading toward the feet, as a figure seen through the hall's haze does
  ctx.globalCompositeOperation = 'destination-out';
  const g = ctx.createLinearGradient(0, h * 0.6, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ct.refresh();
  scene.textures.remove(tmp);
  return key;
}

// --- trains ----------------------------------------------------------------
const EMBLEMS = {
  cloche: ['.ee.', 'eEEe', 'EEEE', 'eeee'],
  trumpet: ['..EE', '.EEE', 'EEE.', 'eE..'],
  stripe: ['EEEE', 'eeee', 'EEEE', 'eeee'],
  palette: ['eEEe', 'EeEE', 'EEeE', 'eEEe'],
  chart: ['e..E', 'e.EE', 'eEEE', 'EEEE'],
  wings: ['E..E', 'EEEE', '.EE.', '..e.'],
  star: ['.eE.', 'eEEe', 'EEEE', 'e..e'],
  cross: ['.EE.', 'EEEE', 'EEEE', '.EE.'],
};
export function createTrainTexture(scene, id, livery) {
  const key = `hub-train-${id}`;
  if (scene.textures.exists(key)) return key;
  return paintTrainTexture(scene, key, { body: livery.body, trim: livery.trim, window: livery.window }, EMBLEMS[livery.emblem] || EMBLEMS.stripe);
}
// a dark, unlit version for lines that are not running
export function createDeadTrainTexture(scene, id) {
  const key = `hub-train-${id}-dark`;
  if (scene.textures.exists(key)) return key;
  return paintTrainTexture(scene, key, { body: 0x2e2e36, trim: 0x3a3a44, window: 0x1e1e26, dead: true }, null);
}

export const HUB_PROP_KEYS = Object.keys(HUB_PROPS);

export function createHubTextures(scene) {
  for (const [who, def] of Object.entries(HUB_PEOPLE)) createPerson(scene, `hub-${who}`, def);
  paintSilhouette(scene, 'hub-traveler', traveller(LEGS_STAND, true));
  WALK_LEGS.forEach((l, i) => paintSilhouette(scene, `hub-traveler#${i + 1}`, traveller(l, true)));
  for (const [key, [w, h, painter]] of Object.entries(HUB_PROPS)) {
    if (scene.textures.exists(key) && scene.textures.get(key).getSourceImage().tagName === 'IMG') continue;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const ct = scene.textures.createCanvas(key, w, h);
    const ctx = ct.getContext();
    painter(ctx, w, h, new Phaser.Math.RandomDataGenerator([key]));
    ct.refresh();
  }
  // the rain: a streak, not a thing
  if (!scene.textures.exists('hub-rain')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xb8c8d8, 1).fillRect(0, 0, 1, 10);
    g.generateTexture('hub-rain', 1, 10);
    g.destroy();
  }
}
