import { createPixelTexture } from '../utils/pixelart.js';

// THE QUIET ABOVE — props and people. One material language: worn gym kit,
// safety orange, white spacecraft, grey regolith.

// generic 16x22 person, palette-swapped per NPC (H hair/hat, h band, S skin,
// b eye, T torso, t trim, P legs, p shade)
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
];

// Priya in a flight suit; Adaeze with the skipping rope over the shoulder;
// Halvorsen in the white coat; a board silhouette.
const NPCS = {
  'npc-priya': { H: 0x1a1a20, h: 0x1a1a20, S: 0x8a5a3b, b: 0x14141c, T: 0x3a5a80, t: 0xf2c078, P: 0x2e4668, p: 0x22334c },
  'npc-adaeze': { H: 0xd8d4c8, h: 0xb8b4a8, S: 0x6a4630, b: 0x14141c, T: 0xc03a2a, t: 0xf2d580, P: 0x2a2a34, p: 0x1e1e26 },
  'npc-halvorsen': { H: 0x9a9aa8, h: 0x8a8a98, S: 0xc09070, b: 0x14141c, T: 0xf0ede4, t: 0x88b8d8, P: 0x4a4c54, p: 0x3a3c44 },
  'npc-osei': { H: 0x14141c, h: 0x14141c, S: 0x5a3a28, b: 0x14141c, T: 0x2e3440, t: 0xe8a030, P: 0x22262e, p: 0x1a1e24 },
};

// Jo in the flight suit (worn from the centrifuge onward): the same stand
// pose as jo-stand but white, with the patch.
const SUIT_TINT = 0xdce4f0;

const P8 = (rows, pal) => ({ rows, pal });

const BELL = P8(['..rr..', '.BBBB.', 'BBBBBB', 'BBBBBB', '.BBBB.', '..bb..'], { r: 0x6a4a32, B: 0xd8b858, b: 0x8a6a2c });
const HOOP = P8(['..hhhh..', '.h....h.', 'h......h', 'h......h', 'h......h', '.h....h.', '..hhhh..'], { h: 0xf2c078 });
const ROPE_POST = P8(['rr', 'rr', 'rr', 'rr', 'rr', 'rr', 'rr', 'RR'], { r: 0xc03a2a, R: 0x8a2a20 });
const NOTEBOOK = P8(['NNNNNN', 'NwwwwN', 'NwwwwN', 'NwwwwN', 'NNNNNN'], { N: 0x3a5a80, w: 0xe8e4d8 });
const DESK = P8(['TTTTTTTTTT', 'T........T', 'T........T'], { T: 0x6a4a32 });
const DOME = P8(['...DDDD...', '..DDDDDD..', '.DDDDDDDD.', 'DDDDDDDDDD', 'DDDDDDDDDD', 'wwwwwwwwww'], { D: 0x8a8e9a, w: 0x5a5e6a });
const VALVE = P8(['.vvvv.', 'v.vv.v', 'vvVVvv', 'vvVVvv', 'v.vv.v', '.vvvv.'], { v: 0xc03a2a, V: 0x8a2a20 });
const WRENCH = P8(['ww...w', '.ww.ww', '..www.', '..ww..', '.ww...', 'ww....'], { w: 0xb8bcc8 });
const PANEL = P8(['PPPPPPPP', 'PggggggP', 'PggggggP', 'PPPPPPPP'], { P: 0x8a8e9a, g: 0x3a5a80 });
const COMMS = P8(['..a...', '..a...', 'AAAAAA', 'AgggAA', 'AgggAA', 'AAAAAA'], { a: 0xb8bcc8, A: 0x4a4c54, g: 0x50c878 });
const HOOK = P8(['.kk.', 'k..k', 'k..k', '.kk.', '.kk.'], { k: 0xf2c078 });
const LANDER = P8(
  ['...LLLLLL...', '..LLLLLLLL..', '.LLwwLLwwLL.', '.LLLLLLLLLL.', '..GGGGGGGG..', '..G......G..', '.ll......ll.', 'll........ll'],
  { L: 0xd8dce8, w: 0x2a2a34, G: 0xb8862c, l: 0x8a8e9a }
);
const PROBE = P8(['....pp......', '...pppp.....', '..pPPPPp....', '.pPPccPPp...', '.pPPPPPPp...', '..ll..ll....', '.ll....ll...'], { p: 0x8a8e9a, P: 0xb8bcc8, c: 0x50c878, l: 0x5a5e6a });
const CORE = P8(['.cc.', 'cCCc', 'cCCc', '.cc.'], { c: 0x2e6a4a, C: 0x50c878 });
const PATCH_KIT = P8(['KKKKKK', 'KwKKwK', 'KKKKKK'], { K: 0xc03a2a, w: 0xe8e4d8 });
const FLARE = P8(['.f.', 'fFf', '.f.', '.s.', '.s.'], { f: 0xf2a060, F: 0xfff2c8, s: 0x8a8e9a });
const WINCH = P8(['WWWWWW', 'W.ww.W', 'W.ww.W', 'WWWWWW', '..rr..'], { W: 0x6a6e7a, w: 0x2a2a34, r: 0xb8862c });
const CAPSULE = P8(
  ['...CCCC...', '..CCCCCC..', '.CCwwwwCC.', '.CCCCCCCC.', 'bCCCCCCCCb', '.bbbbbbbb.'],
  { C: 0xd8dce8, w: 0x2a2a34, b: 0x6a4a32 }
);
const BUOY = P8(['.ff.', 'ffff', '.ff.'], { f: 0xf2a060 });
const CONE = P8(['..o..', '.ooo.', '.ooo.', 'ooooo'], { o: 0xe8762a });
const BAG = P8(['.bb.', 'bBBb', 'bBBb', 'bBBb', '.bb.'], { b: 0x8a2a20, B: 0xc03a2a });
const BEACON = P8(['..r..', '..r..', '.aaa.', '.aaa.', '..s..', '..s..'], { r: 0xe83a2a, a: 0xb8bcc8, s: 0x6a6e7a });
const DEVIL = [
  P8(['..dd..dd', '.dddddd.', '..dddd..', '.dddddd.', 'dd..dd..'], { d: 0xb8b4a8 }),
  P8(['dd..dd..', '.dddddd.', '..dddd..', '.dddddd.', '..dd..dd'], { d: 0xb8b4a8 }),
];
const DEBRIS = [
  P8(['PPPPPP..', '.PPPPPP.', '..PPPPPP'], { P: 0x9a9eaa }),
  P8(['..PPPPPP', '.PPPPPP.', 'PPPPPP..'], { P: 0x9a9eaa }),
];

export const astronautTheme = {
  suitTint: SUIT_TINT,
  createTextures(scene) {
    const mk = (key, def, size = 3) => createPixelTexture(scene, key, def.rows, def.pal, size);
    mk('astro-bell', BELL);
    mk('astro-hoop', HOOP);
    mk('astro-rope-post', ROPE_POST);
    mk('astro-notebook', NOTEBOOK);
    mk('astro-desk', DESK);
    mk('astro-dome', DOME, 4);
    mk('astro-valve', VALVE);
    mk('astro-wrench', WRENCH);
    mk('astro-panel', PANEL);
    mk('astro-comms', COMMS);
    mk('astro-hook', HOOK);
    mk('astro-lander', LANDER, 4);
    mk('astro-probe', PROBE, 4);
    mk('astro-core', CORE, 3);
    mk('astro-patch', PATCH_KIT);
    mk('astro-flare', FLARE);
    mk('astro-winch', WINCH, 3);
    mk('astro-capsule', CAPSULE, 5);
    mk('astro-buoy', BUOY);
    mk('astro-cone', CONE);
    mk('astro-bag', BAG);
    mk('astro-beacon', BEACON, 3);
    DEVIL.forEach((f, i) => mk(`astro-devil-${i}`, f, 5));
    DEBRIS.forEach((f, i) => mk(`astro-debris-${i}`, f, 3));
    Object.entries(NPCS).forEach(([key, pal]) => createPixelTexture(scene, key, PERSON, { ...pal, b: pal.b }, 2));
  },
};
