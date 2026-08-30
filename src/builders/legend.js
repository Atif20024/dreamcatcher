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
export const SLOPES = new Set(['slope_r', 'slope_l', 'slope_r_low', 'slope_r_high']);
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
  switch (role) {
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
