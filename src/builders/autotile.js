import { createPixelTexture } from '../utils/pixelart.js';

// D3 — autotiling by 4-neighbour mask, with deterministic wear variants.
// Rather than hand-authoring 16x3 grids per theme, we generate them from a
// small theme description: an 8x8 letter grid per (mask, wear).
//
// mask bits: 1 = solid above, 2 = solid right, 4 = solid below, 8 = solid left
export const TOP = 1;
export const RIGHT = 2;
export const BOTTOM = 4;
export const LEFT = 8;

const N = 8; // logical pixels per tile edge
const WEARS = 3;

// theme: { fill, dark, lipLight, lipDark, edge, deco }
// every letter must exist in the theme's palette
function solidGrid(mask, wear, theme) {
  const g = Array.from({ length: N }, () => Array(N).fill(theme.fill));

  // interior speckle — deterministic, gives flat fills some tooth
  for (let y = 2; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if ((x * 7 + y * 13 + wear * 5) % 11 === 0) g[y][x] = theme.deco;
    }
  }

  const exposedTop = !(mask & TOP);
  const exposedBottom = !(mask & BOTTOM);
  const exposedLeft = !(mask & LEFT);
  const exposedRight = !(mask & RIGHT);

  if (exposedTop) {
    for (let x = 0; x < N; x++) {
      g[0][x] = theme.lipLight;
      g[1][x] = theme.lipDark;
    }
    // chipped lip: wear removes a pixel or two from the highlight
    if (wear > 0) {
      const c = (wear * 3 + 1) % N;
      g[0][c] = theme.lipDark;
      if (wear === 2) g[0][(c + 3) % N] = theme.lipDark;
    }
  }
  if (exposedBottom) {
    for (let x = 0; x < N; x++) g[N - 1][x] = theme.dark;
  }
  if (exposedLeft) {
    for (let y = exposedTop ? 2 : 0; y < N; y++) g[y][0] = theme.edge;
    if (wear === 1) g[(wear * 2 + 3) % N][1] = theme.edge;
  }
  if (exposedRight) {
    for (let y = exposedTop ? 2 : 0; y < N; y++) g[y][N - 1] = theme.edge;
    if (wear === 2) g[(wear * 2 + 1) % N][N - 2] = theme.edge;
  }
  return g.map((row) => row.join(''));
}

function onewayGrid(variant, theme) {
  const g = Array.from({ length: N }, () => Array(N).fill('.'));
  for (let x = 0; x < N; x++) {
    g[0][x] = theme.lipLight;
    g[1][x] = theme.fill;
    g[2][x] = theme.lipDark;
  }
  if (variant & 1) g[0][1] = theme.lipDark; // left cap wear
  if (variant & 2) g[0][N - 2] = theme.lipDark; // right cap wear
  return g.map((row) => row.join(''));
}

function slopeGrid(role, wear, theme) {
  const g = Array.from({ length: N }, () => Array(N).fill('.'));
  for (let x = 0; x < N; x++) {
    let top;
    if (role === 'slope_r') top = N - 1 - x;
    else if (role === 'slope_l') top = x;
    else if (role === 'slope_r_low') top = Math.floor(N - 1 - x / 2);
    else top = Math.floor(N / 2 - 1 - x / 2);
    top = Math.max(0, Math.min(N - 1, top));
    for (let y = top; y < N; y++) {
      g[y][x] = y === top ? theme.lipLight : y === top + 1 ? theme.lipDark : theme.fill;
      if (y > top + 1 && (x * 7 + y * 13 + wear * 5) % 11 === 0) g[y][x] = theme.deco;
    }
  }
  return g.map((row) => row.join(''));
}

const LADDER = ['.rr..rr.', '.rr..rr.', '.rrrrrr.', '.rr..rr.', '.rr..rr.', '.rrrrrr.', '.rr..rr.', '.rr..rr.'];
const CLIMB = ['cc....cc', 'cc.dd.cc', 'cc.dd.cc', 'cc....cc', 'cc....cc', 'cc.dd.cc', 'cc.dd.cc', 'cc....cc'];
const HAZARD = ['...X...X', '...X...X', '..XXX.XX', '..XXX.XX', '.XXXXXXX', '.XXXXXXX', 'XXXXXXXX', 'XXXXXXXX'];

// Builds every texture a room needs for one theme. Called once per scene.
// key prefix e.g. 'chef' -> 'chef_s_<mask>_<wear>', 'chef_ow_<v>', 'chef_sl_<role>_<wear>'
export function buildTileset(scene, key, theme, pal) {
  for (let mask = 0; mask < 16; mask++) {
    for (let w = 0; w < WEARS; w++) {
      createPixelTexture(scene, `${key}_s_${mask}_${w}`, solidGrid(mask, w, theme), pal, 4);
    }
  }
  for (let v = 0; v < 4; v++) {
    createPixelTexture(scene, `${key}_ow_${v}`, onewayGrid(v, theme), pal, 4);
  }
  for (const role of ['slope_r', 'slope_l', 'slope_r_low', 'slope_r_high']) {
    for (let w = 0; w < WEARS; w++) {
      createPixelTexture(scene, `${key}_sl_${role}_${w}`, slopeGrid(role, w, theme), pal, 4);
    }
  }
  createPixelTexture(scene, `${key}_ladder`, LADDER, { ...pal, r: theme.ladderColor || 0xb8862c }, 4);
  createPixelTexture(scene, `${key}_climb`, CLIMB, { ...pal, c: theme.climbColor || 0x6a6e7a, d: theme.climbDeco || 0x2a2a34 }, 4);
  createPixelTexture(scene, `${key}_hazard`, HAZARD, { ...pal, X: theme.hazardColor || 0xc0c4cc }, 4);
}

export function maskAt(isSolid, tx, ty) {
  return (
    (isSolid(tx, ty - 1) ? TOP : 0) |
    (isSolid(tx + 1, ty) ? RIGHT : 0) |
    (isSolid(tx, ty + 1) ? BOTTOM : 0) |
    (isSolid(tx - 1, ty) ? LEFT : 0)
  );
}

export function wearAt(tx, ty) {
  return (tx * 7 + ty * 13) % WEARS;
}
