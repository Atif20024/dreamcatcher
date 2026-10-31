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
export const NPCS = {
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
// a ring's corner post: 1.3 m over the canvas (57 px at size 3), a padded
// cushion at the top and a steel foot
const ROPE_POST = P8(['.cc.', 'cCCc', 'cCCc', 'cCCc', '.rr.', '.rr.', '.rr.', '.rr.', '.rr.', '.rr.', '.rr.', '.rr.', '.rr.', '.rr.', '.rr.', '.rr.', '.rr.', '.rr.', 'RRRR'], { c: 0x8a2a20, C: 0xc03a2a, r: 0x8a8e9a, R: 0x4a4c54 });
const NOTEBOOK = P8(['NNNNNN', 'NwwwwN', 'NwwwwN', 'NwwwwN', 'NNNNNN'], { N: 0x3a5a80, w: 0xe8e4d8 });
const DESK = P8(['TTTTTTTTTT', 'T........T', 'T........T'], { T: 0x6a4a32 });
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


// Spacecraft are too big for a pixel grid at size 3: drawn in code, at real
// scale, onto a texture once.
const M = 44; // px per metre

// the lunar lander as it stands on the moon: a gold-foil descent stage on
// four splayed legs (two near, two far and dimmer), a faceted white cabin,
// the hatch on its front face and the ladder down the near leg. 4.4 m tall.
function drawLander(scene) {
  if (scene.textures.exists('astro-lander-site')) return;
  const W = Math.round(4.6 * M);
  const H = Math.round(4.6 * M);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const cx = W / 2;
  const foot = H - 4;
  const deckY = H - Math.round(0.9 * M); // underside of the descent stage
  const stageH = Math.round(1.5 * M);
  const stageW = Math.round(3.2 * M);
  // far legs
  g.lineStyle(4, 0x6a6e7a, 1);
  g.lineBetween(cx - stageW * 0.3, deckY - 10, cx - W * 0.36, foot - 4);
  g.lineBetween(cx + stageW * 0.3, deckY - 10, cx + W * 0.36, foot - 4);
  // descent stage: an octagon in gold foil, crinkled
  g.fillStyle(0xb8862c, 1).fillRect(cx - stageW / 2, deckY - stageH, stageW, stageH);
  g.fillStyle(0xd8a848, 1).fillRect(cx - stageW / 2 + 8, deckY - stageH + 4, stageW - 16, stageH - 8);
  g.fillStyle(0x8a6420, 1);
  for (let i = 0; i < 9; i++) g.fillRect(cx - stageW / 2 + 12 + i * 15, deckY - stageH + 8 + (i % 3) * 14, 6, 3);
  g.fillStyle(0x5a4418, 1).fillRect(cx - stageW / 2, deckY - 4, stageW, 4);
  // the engine bell under it
  g.fillStyle(0x4a4c54, 1).fillTriangle(cx - 16, deckY, cx + 16, deckY, cx, deckY + 18);
  // near legs, struts, footpads
  g.lineStyle(5, 0xb8bcc8, 1);
  g.lineBetween(cx - stageW / 2 + 4, deckY - stageH * 0.6, cx - W / 2 + 14, foot - 4);
  g.lineBetween(cx + stageW / 2 - 4, deckY - stageH * 0.6, cx + W / 2 - 14, foot - 4);
  g.lineStyle(3, 0x8a8e9a, 1);
  g.lineBetween(cx - stageW / 2 + 10, deckY, cx - W / 2 + 22, foot - 18);
  g.lineBetween(cx + stageW / 2 - 10, deckY, cx + W / 2 - 22, foot - 18);
  g.fillStyle(0x8a8e9a, 1).fillEllipse(cx - W / 2 + 14, foot - 2, 26, 6).fillEllipse(cx + W / 2 - 14, foot - 2, 26, 6);
  // the ladder down the near-left leg (rungs 0.3 m apart)
  g.lineStyle(2, 0xd8dce8, 1);
  const [ax, ay, bx, bY] = [cx - stageW / 2 + 4, deckY - stageH * 0.6, cx - W / 2 + 14, foot - 4];
  for (let k = 1; k < 6; k++) {
    const t = k / 6;
    const lx = ax + (bx - ax) * t;
    const ly = ay + (bY - ay) * t;
    g.lineBetween(lx - 2, ly, lx + 12, ly);
  }
  // ascent stage: the cabin, faceted, white
  const cabW = Math.round(2.6 * M);
  const cabH = Math.round(2.0 * M);
  const cabY = deckY - stageH - cabH;
  g.fillStyle(0xd8dce8, 1);
  g.fillPoints([
    { x: cx - cabW / 2, y: cabY + cabH },
    { x: cx - cabW / 2, y: cabY + 28 },
    { x: cx - cabW / 2 + 26, y: cabY },
    { x: cx + cabW / 2 - 20, y: cabY },
    { x: cx + cabW / 2, y: cabY + 22 },
    { x: cx + cabW / 2, y: cabY + cabH },
  ], true);
  g.fillStyle(0xa8acb8, 1).fillRect(cx + cabW / 2 - 24, cabY + 22, 24, cabH - 22); // the side in shade
  g.fillStyle(0x2a2a34, 1).fillTriangle(cx - cabW / 2 + 14, cabY + 34, cx - cabW / 2 + 34, cabY + 12, cx - cabW / 2 + 36, cabY + 36); // windows
  g.fillTriangle(cx + 4, cabY + 34, cx + 22, cabY + 12, cx + 26, cabY + 36);
  // the hatch: 0.8 m square, on the front face, over the porch
  const hw = Math.round(0.8 * M);
  g.fillStyle(0xb8bcc8, 1).fillRect(cx - hw / 2 - 18, cabY + cabH - hw - 4, hw, hw);
  g.lineStyle(2, 0x6a6e7a, 1).strokeRect(cx - hw / 2 - 18, cabY + cabH - hw - 4, hw, hw);
  g.fillStyle(0x6a6e7a, 1).fillRect(cx - 22, cabY + cabH - hw / 2 - 6, 6, 4);
  // the dish and the antenna
  g.lineStyle(2, 0xb8bcc8, 1).lineBetween(cx + cabW / 2 - 30, cabY, cx + cabW / 2 - 14, cabY - 22);
  g.fillStyle(0xe8e4d8, 1).fillEllipse(cx + cabW / 2 - 12, cabY - 26, 22, 10);
  g.generateTexture('astro-lander-site', W, H);
  g.destroy();
}

// the centrifuge's housing on its plinth: a 3.2 m dome, 2.4 m high, a band
// of rivets, a 2 m door (Jo walks into it)
function drawDome(scene) {
  if (scene.textures.exists('astro-dome')) return;
  const W = Math.round(3.2 * M);
  const H = Math.round(2.4 * M);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x5a5e6a, 1).fillRect(0, H - 10, W, 10);
  g.fillStyle(0x8a8e9a, 1).fillEllipse(W / 2, H - 10, W - 4, (H - 10) * 2);
  g.fillStyle(0xa8acb8, 1).fillEllipse(W / 2 - 14, H - 34, W * 0.5, H * 0.6);
  g.fillStyle(0x8a8e9a, 1).fillRect(0, H - 22, W, 12);
  g.fillStyle(0x5a5e6a, 1);
  for (let x = 8; x < W - 4; x += 12) g.fillRect(x, H - 17, 3, 3);
  const door = Math.round(2 * M);
  g.fillStyle(0x2e3440, 1).fillRect(W / 2 + 10, H - 10 - door, 40, door);
  g.fillStyle(0xe8762a, 1).fillRect(W / 2 + 10, H - 14 - door, 40, 3);
  g.generateTexture('astro-dome', W, H);
  g.destroy();
}

// the re-entry capsule in the field, upright on its scorched heat shield:
// 3.9 m across the base, 3.3 m tall, chute lines slack from the top
function drawCapsule(scene) {
  if (scene.textures.exists('astro-capsule')) return;
  const base = Math.round(3.9 * M);
  const tall = Math.round(3.3 * M);
  const W = base + 40;
  const H = tall + 8;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const cx = W / 2;
  const by = H - 2;
  const top = Math.round(1.2 * M); // the hatch-ring at the top, 1.2 m across
  // the cone
  g.fillStyle(0xd8dce8, 1).fillPoints([{ x: cx - base / 2 + 8, y: by - 20 }, { x: cx - top / 2, y: by - tall + 14 }, { x: cx + top / 2, y: by - tall + 14 }, { x: cx + base / 2 - 8, y: by - 20 }], true);
  g.fillStyle(0xa8acb8, 1).fillPoints([{ x: cx + base / 6, y: by - 20 }, { x: cx + top / 4, y: by - tall + 14 }, { x: cx + top / 2, y: by - tall + 14 }, { x: cx + base / 2 - 8, y: by - 20 }], true);
  // scorch running up from the shield
  g.fillStyle(0x6a4a32, 0.55);
  for (let i = 0; i < 7; i++) {
    const x = cx - base / 2 + 24 + i * 20;
    g.fillTriangle(x - 5, by - 20, x + 5, by - 20, x + (i % 2 ? 6 : -4), by - 46 - (i % 3) * 16);
  }
  // window and the side hatch (0.9 m)
  g.fillStyle(0x2a2a34, 1).fillEllipse(cx - 30, by - tall * 0.62, 20, 16);
  g.lineStyle(2, 0x8a8e9a, 1).strokeRect(cx + 4, by - tall * 0.66, Math.round(0.9 * M), Math.round(0.9 * M));
  // the top ring and the docking nose
  g.fillStyle(0x8a8e9a, 1).fillRect(cx - top / 2, by - tall + 6, top, 10);
  g.fillStyle(0x6a6e7a, 1).fillRect(cx - 12, by - tall, 24, 8);
  // the heat shield
  g.fillStyle(0x4a3222, 1).fillEllipse(cx, by - 12, base, 22);
  g.fillStyle(0x6a4a32, 1).fillEllipse(cx, by - 16, base - 10, 14);
  // the chute lines, slack, off to the right on the grass
  g.lineStyle(1, 0xe8e4d8, 0.8);
  for (let i = 0; i < 4; i++) g.lineBetween(cx - 6 + i * 4, by - tall + 2, W - 6, by - 4 - i * 3);
  g.generateTexture('astro-capsule', W, H);
  g.destroy();
}

export const astronautTheme = {
  suitTint: SUIT_TINT,
  createTextures(scene) {
    const mk = (key, def, size = 3) => createPixelTexture(scene, key, def.rows, def.pal, size);
    // Sizes at Jo's scale (1 m = 44 px, src/data/scale.js). The pixel size
    // is picked so each prop lands near its real height: a station comms
    // panel 1 m, the spare solar panel 0.9 x 0.45 m, the winch 0.8 m, a
    // traffic cone 0.65 m, the dry bag 0.7 m, the life ring 0.55 m, the
    // probe 1.4 m. The lander, the capsule and the centrifuge are drawn in code.
    mk('astro-bell', BELL);
    mk('astro-hoop', HOOP);
    mk('astro-rope-post', ROPE_POST);
    mk('astro-notebook', NOTEBOOK);
    mk('astro-desk', DESK);
    drawDome(scene); // the centrifuge's housing: 3.2 m across, drawn in code
    mk('astro-valve', VALVE);
    mk('astro-wrench', WRENCH);
    mk('astro-panel', PANEL, 5);
    mk('astro-comms', COMMS, 7);
    mk('astro-hook', HOOK);
    mk('astro-lander', LANDER, 4); // the descent puzzle's icon (screen, not world)
    drawLander(scene); // the one standing on the moon: 4.4 m
    mk('astro-probe', PROBE, 9);
    mk('astro-core', CORE, 3);
    mk('astro-patch', PATCH_KIT);
    mk('astro-flare', FLARE);
    mk('astro-winch', WINCH, 6);
    drawCapsule(scene); // 3.9 m across the heat shield, drawn in code
    mk('astro-buoy', BUOY, 6);
    mk('astro-cone', CONE, 7);
    mk('astro-bag', BAG, 6);
    mk('astro-beacon', BEACON, 4);
    DEVIL.forEach((f, i) => mk(`astro-devil-${i}`, f, 5));
    DEBRIS.forEach((f, i) => mk(`astro-debris-${i}`, f, 3));
    Object.entries(NPCS).forEach(([key, pal]) => createPixelTexture(scene, key, PERSON, { ...pal, b: pal.b }, 2));
  },
};
