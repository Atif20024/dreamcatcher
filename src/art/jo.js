// Jo's non-rig art: the hat (its own sprite, one frame behind the body,
// D5), the level tools, and the dream-dust colours. Jo's body is the rig in
// src/data/rigs/jo.js. Everything here is compiled into the `jo` atlas by
// scripts/build-atlas.js; nothing is drawn at runtime.
const PALETTE = { H: 'hat', h: 'hat-band' };

// 16x4 @1x -> 32x8 on screen
export const HAT = ['.....HHHHHH.....', '....HHHHHHHH....', '....hhhhhhhh....', '..HHHHHHHHHHHH..'];

// the level tool: a ladle in the kitchen, a trumpet on the stage
const LADLE = ['.mmmmmm.', '........', '..bbbb..', '.bBBBBb.', '.bBBBBb.', '..bbbb..'];
const TRUMPET = ['..bbbbb.', '.bBBBBBb', 'bBB....b', '.bBBBBBb', '..bbbbb.'];
const TOOL_PAL = { m: 'steel', b: 'brass', B: 'brass-hi' };

// D5 — dust colours for Jo's own death burst
export const JO_DUST = [0x3d5a80, 0x8a5a3b, 0xe8e4d8, 0x23233a];

export const JO_STILLS = [
  { anim: 'hat', grid: HAT, palette: PALETTE, origin: [8, 3] },
  { anim: 'tool_ladle', grid: LADLE, palette: TOOL_PAL, origin: [4, 3], scale: 1.5 },
  { anim: 'tool_trumpet', grid: TRUMPET, palette: TOOL_PAL, origin: [4, 2], scale: 1.5 },
];
