// Colour tokens (ui-type skill): the single source of truth for UI colour.
// Scene code passes a token name ('accent') or a legacy '#rrggbb' string to
// uiText; both resolve here.
export const THEME = Object.freeze({
  ink: 0xf2e9d8,
  'ink-dim': 0x9c8f7a,
  'ink-shadow': 0x0e0b14,
  accent: 0xe9b84a,
  danger: 0xd5443c,
  calm: 0x7fb7c9,
  good: 0x7ec87e,
  'brass-light': 0xf6d98a,
  'brass-dark': 0x6b4a1f,
  panel: 0x1b1725,
  'panel-edge': 0x4a3f5c,
  dim: 0x000000,
});

export const PANEL_ALPHA = 0.97;

// '#abc', '#aabbcc', '#aabbccdd', 0xaabbcc or a token → 0xaabbcc
export function toColor(c, fallback = THEME.ink) {
  if (c === undefined || c === null || c === '') return fallback;
  if (typeof c === 'number') return c;
  if (THEME[c] !== undefined) return THEME[c];
  let s = String(c).trim();
  if (s[0] === '#') s = s.slice(1);
  if (s.length === 3) s = s.split('').map((ch) => ch + ch).join('');
  if (s.length === 8) s = s.slice(0, 6);
  const n = parseInt(s, 16);
  return Number.isFinite(n) ? n : fallback;
}

// the alpha of an 8-digit '#rrggbbaa' (1 otherwise)
export function toAlpha(c) {
  if (typeof c !== 'string') return 1;
  const s = c.replace('#', '');
  return s.length === 8 ? parseInt(s.slice(6), 16) / 255 : 1;
}
