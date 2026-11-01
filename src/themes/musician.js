// The Big Stage's people: the npc placeholders the cast bake measures and
// redraws (scripts/lib/cast-bake.js), and Jo's fallback portrait. Build-time
// only; the framework dream (src/dreams/musician/) plays them from the atlas.
import { createPixelTexture } from '../utils/pixelart.js';

// generic 16x24 person, palette-swapped per NPC
const PERSON = [
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....hhhhhhhh....',
  '...HHHHHHHHHH...',
  '.....SSSSSS.....',
  '....SSSSSSSS....',
  '....SbSSSSbS....',
  '....SSSSSSSS....',
  '.....SSSSSS.....',
  '....TTTTTTTT....',
  '..TTTTTTTTTTTT..',
  '.TTtTTTTTTTTtTT.',
  '.TTtTTTTTTTTtTT.',
  '.TTtTTTTTTTTtTT.',
  '.SSTTTTTTTTTTSS.',
  '....TTTTTTTT....',
  '....PPPPPPPP....',
  '....PPPPPPPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '..BBBB....BBBB..',
  '..BBBB....BBBB..',
];
export const NPCS = {
  'npc-delphine': { H: 0xb8b8c0, h: 0xb8b8c0, S: 0x9a6a48, b: 0x222228, T: 0x6a3a4a, t: 0x4a2a36, P: 0x3a3a44, p: 0x2e2e36, B: 0x1e1e28 },
  'npc-nia': { H: 0x2a2230, h: 0x2a2230, S: 0x7a4a30, b: 0x222228, T: 0x3a6a5a, t: 0x2a5044, P: 0x2e2e40, p: 0x242432, B: 0x1e1e28 },
  'npc-marcus': { H: 0x1a1a20, h: 0x1a1a20, S: 0x5a3a26, b: 0x222228, T: 0xb8683a, t: 0x96502c, P: 0x44444e, p: 0x36363e, B: 0x1e1e28 },
  'npc-ray': { H: 0x3a3a44, h: 0x8a3a3a, S: 0x6a4630, b: 0x222228, T: 0x50505c, t: 0x3e3e48, P: 0x3a3a44, p: 0x2e2e36, B: 0x1e1e28 },
  'npc-tally': { H: 0x2e3440, h: 0x2e3440, S: 0xc0a088, b: 0x222228, T: 0x2e3440, t: 0x232834, P: 0x2e3440, p: 0x232834, B: 0x14161c },
  'npc-sol': { H: 0xd8d8dc, h: 0xd8d8dc, S: 0xb08868, b: 0x222228, T: 0x6a5a40, t: 0x54462f, P: 0x4a4a52, p: 0x3a3a42, B: 0x1e1e28 },
  'npc-scalper': { H: 0x3a4436, h: 0x3a4436, S: 0x8a6a4a, b: 0x222228, T: 0x3a4436, t: 0x2c3428, P: 0x2e2e36, p: 0x24242c, B: 0x1e1e28 },
  'npc-roadie': { H: 0x1a1a20, h: 0x1a1a20, S: 0x9a6a48, b: 0x222228, T: 0x2a2a32, t: 0x202028, P: 0x2a2a32, p: 0x202028, B: 0x1e1e28 },
};
const PORTRAIT_JO = { rows: ['..HHHHHH..', '..hhhhhh..', '.HHHHHHHH.', '.SSSSSSSS.', '.GLSSSSLG.', '.SSSSSSSS.', '.SSssssSS.', '..SSSSSS..', '.JJJJJJJJ.', 'JJJJJJJJJJ'], pal: { H: 0x23233a, h: 0x8a3a3a, S: 0x8a5a3b, G: 0x1a1a24, L: 0x9ac8d8, s: 0x6f4630, J: 0x3d5a80 } };

export const musicianTheme = {
  createTextures(scene) {
    Object.entries(NPCS).forEach(([key, pal]) => createPixelTexture(scene, key, PERSON, pal, 2));
    createPixelTexture(scene, 'portrait-jo', PORTRAIT_JO.rows, PORTRAIT_JO.pal, 5);
  },
};
