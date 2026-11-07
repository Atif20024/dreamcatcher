// D2 — one legend for every dream. The level's tileset decides how each looks;
// this file decides what each DOES.
//
// NOTE (spec conflict): Part D lists '.' as both a 22.5° slope half and as
// empty. Empty wins (every grid uses it); the 22.5° halves are ',' and ';'.

export const CHARS = {
  '.': 'empty',
  '#': 'solid',
  '=': 'oneway',
  '/': 'slope_r', // rises to the right
  '\\': 'slope_l', // rises to the left
  ',': 'slope_r_low', // 22.5° lower half
  ';': 'slope_r_high', // 22.5° upper half
  k: 'slope_stair_r_low', // a flight of stairs at half pitch (16 px rise per tile): lower half
  K: 'slope_stair_r_high', // ... upper half (treads and risers drawn, walked as a slope)
  S: 'stair',
  '|': 'climbable', // ONLY tile that permits wall-slide / wall-jump
  L: 'loose',
  '^': 'hazard',
  '~': 'liquid',
  H: 'ladder',
  G: 'gate',
  P: 'plate',
  l: 'lever',
  V: 'valve',
  r: 'pull',
  B: 'breakable',
  '>': 'conveyor_r',
  '<': 'conveyor_l',
  A: 'anchor',
  R: 'resonant',
};

// Per-dream surface extensions: change physics, not just looks.
export const EXTRAS = {
  '*': 'ice',
  I: 'grease',
};

export const SOLID = new Set(['solid', 'stair', 'climbable', 'loose', 'gate', 'breakable', 'ice', 'grease', 'conveyor_r', 'conveyor_l']);
export const SLOPES = new Set(['slope_r', 'slope_l', 'slope_r_low', 'slope_r_high', 'slope_stair_r_low', 'slope_stair_r_high']);
export const ONEWAY = new Set(['oneway']);

export function roleOf(ch) {
  return CHARS[ch] || EXTRAS[ch] || 'empty';
}

export function isSolidChar(ch) {
  return SOLID.has(roleOf(ch));
}

export function isSlopeChar(ch) {
  return SLOPES.has(roleOf(ch));
}

// Slope surface height at a fraction across the tile (0 = left, 1 = right).
// Returns 0..1 where 0 is the tile's top edge and 1 is its bottom.
export function slopeSurface(role, fx) {
  const f = Math.max(0, Math.min(1, fx));
  switch (baseSlope(role)) {
    case 'slope_r':
      return 1 - f;
    case 'slope_l':
      return f;
    case 'slope_r_low':
      return 1 - f * 0.5;
    case 'slope_r_high':
      return 0.5 - f * 0.5;
    default:
      return 0;
  }
}

// Stairs walk as slopes (round 2, §10.2): 'slope_stair_r' is a 45° flight,
// 'slope_stair_r_low/high' a half-pitch one. The base role is the shape.
export function baseSlope(role) {
  return role ? role.replace('stair_', '') : role;
}
export const isStairRole = (role) => !!role && role.includes('stair');

// dy/dx of a slope role's surface (y grows down: rising right is negative)
export function slopeGradient(role) {
  switch (baseSlope(role)) {
    case 'slope_r':
      return -1;
    case 'slope_l':
      return 1;
    case 'slope_r_low':
    case 'slope_r_high':
      return -0.5;
    default:
      return 0;
  }
}

// The walking role of the tile at (tx, ty): a slope char's own role, or a
// staircase 'S' read as a 45° stair-slope when it is one step of a flight
// (air above it, a lower step or floor on exactly one side). A lone block,
// a peak, or a step with a ceiling on it stays solid.
export function slopeRoleAt(charAt, tx, ty) {
  const ch = charAt(tx, ty);
  const role = roleOf(ch);
  if (SLOPES.has(role)) return role;
  if (role !== 'stair') return null;
  const solidish = (x, y) => isSolidChar(charAt(x, y)) || SLOPES.has(roleOf(charAt(x, y)));
  const air = (x, y) => !solidish(x, y);
  const isS = (x, y) => roleOf(charAt(x, y)) === 'stair';
  if (!air(tx, ty - 1)) return null;
  const lowL = air(tx - 1, ty) && solidish(tx - 1, ty + 1);
  const lowR = air(tx + 1, ty) && solidish(tx + 1, ty + 1);
  if (lowL && !lowR) return 'slope_stair_r';
  if (lowR && !lowL) return 'slope_stair_l';
  if (!lowL || !lowR) return null;
  // both sides lower: follow the flight's diagonal
  if (isS(tx - 1, ty + 1) !== isS(tx + 1, ty + 1)) return isS(tx - 1, ty + 1) ? 'slope_stair_r' : 'slope_stair_l';
  if (isS(tx + 1, ty - 1) !== isS(tx - 1, ty - 1)) return isS(tx + 1, ty - 1) ? 'slope_stair_r' : 'slope_stair_l';
  return null;
}

// The sides of the solid tile at (tx, ty) that sit flush against the high
// end of a slope in the same row. Arcade must never treat such a side as a
// wall (the crest), so the builders turn its collision off.
export function crestSides(slopeAt, tx, ty) {
  const L = slopeAt(tx - 1, ty);
  const R = slopeAt(tx + 1, ty);
  return {
    left: !!L && slopeSurface(L, 1) === 0,
    right: !!R && slopeSurface(R, 0) === 0,
  };
}
