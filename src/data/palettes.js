// D11.3 — named colours. Rig and art palettes map letters to these names so
// the same letter means the same material everywhere, and a level can swap
// a palette without touching a single grid. `jo-blue` (J) is reserved for
// friendlies; `hazard-red` (X) for foes and hazards.
export const COLORS = {
  outline: 0x14141c,
  // Jo
  hat: 0x23233a,
  'hat-hi': 0x3a3a58,
  'hat-band': 0x8a3a3a,
  skin: 0x8a5a3b,
  'skin-hi': 0xa8744e,
  'skin-sh': 0x5e3d28,
  eye: 0x1a1a20,
  'eye-white': 0xf0ece4,
  'jo-blue': 0x3d5a80,
  'jo-blue-hi': 0x5f80a8,
  'jo-blue-sh': 0x2a3f5c,
  belt: 0x2a2230,
  pants: 0x494356,
  'pants-hi': 0x605a70,
  'pants-sh': 0x33303f,
  boots: 0x1e1e28,
  'boots-hi': 0x3a3a48,
  brass: 0xb8862c,
  'brass-hi': 0xf2d580,
  steel: 0x9a9aa8,
  // foes / hazards
  'hazard-red': 0xc03a2a,
  'hazard-red-hi': 0xe86a6a,
  cream: 0xf2e6cc,
  shirt: 0xe8e4d8,
};

export function colorOf(name) {
  if (typeof name === 'number') return name;
  if (!(name in COLORS)) throw new Error(`palettes.js: unknown colour "${name}"`);
  return COLORS[name];
}
