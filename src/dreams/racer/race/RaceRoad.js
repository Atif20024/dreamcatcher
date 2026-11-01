// The road and the land behind it, for RaceScene: the sky, three parallax
// layers at the design's 0.1, 0.35 and 0.7 of the road's speed, the road band
// with its three depth lanes, and a kerb streak in front. All tile sprites on a
// camera that does not scroll: the world moves past the car, so 50 km of metres
// never meet float precision. The world itself is the track's `theme` (themes.js).
import { paintBackdropLayer, paintSky, forgetPainted, LAYER_W } from '../../../art/backdrops/painted.js';
import { paintTexture, hex, rgba, grain } from '../../../art/paint.js';

export const M = 44; // px per metre
export const LANE_Y = [340, 382, 424]; // where a car's wheels stand in each lane
export const ROAD_TOP = 316;
export const ROAD_BOT = 448;
// the far lane 8 percent smaller, the near one 8 percent larger (design §3)
export const laneY = (y) => LANE_Y[0] + (LANE_Y[2] - LANE_Y[0]) * (y / 2);
export const laneScale = (y) => 0.92 + 0.08 * y;

// a bend slides the land towards its outside, the far land the most (px at full lean)
export const ROAD_SLIDE = 8;
const LAND_SLIDE = [14, 9, 5];
const POLE_WIRE_Y = ROAD_TOP + 3 - 298; // the pole's crossarm: 7 m over the far verge

// crowned dust: two dark wheel tracks to a lane, a paler crown between them, stones at the edge.
// The lanes read by their tracks; there are no painted lines on a road of 1958.
const paintRoad = (R) => (ctx, w, h) => {
  ctx.fillStyle = hex(R.dust);
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 6) {
    ctx.fillStyle = rgba(R.crown, 0.5 * (1 - Math.abs(y / h - 0.5) * 2));
    ctx.fillRect(0, y, w, 6);
  }
  grain(ctx, 0, 0, w, h, 0.09, 7);
  for (const c of LANE_Y) {
    const y = c - ROAD_TOP;
    for (const off of [-5, 3]) {
      ctx.fillStyle = rgba(R.track, 0.55);
      ctx.fillRect(0, y + off, w, 4);
      for (let x = 0; x < w; x += 23) {
        ctx.fillStyle = rgba(R.dust, 0.5);
        ctx.fillRect(x + ((y * 7) % 19), y + off, 5 + (x % 9), 2);
      }
    }
  }
  for (const y of [0, h - 5]) {
    ctx.fillStyle = hex(R.edge);
    ctx.fillRect(0, y, w, 5);
    for (let x = 0; x < w; x += 17) {
      ctx.fillStyle = hex(x % 3 ? R.stone : R.track);
      ctx.fillRect(x, y + (x % 4), 3 + (x % 3), 2);
    }
  }
};

const paintVerge = (V) => (ctx, w, h) => {
  ctx.fillStyle = hex(V.ground);
  ctx.fillRect(0, 0, w, h);
  grain(ctx, 0, 0, w, h, 0.1, 11);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = hex(V.specks[i % V.specks.length]);
    ctx.fillRect((i * 97) % w, (i * 41) % h, 6 + (i % 4), 2);
  }
};

const paintFarVerge = (V) => (ctx, w, h) => {
  ctx.fillStyle = hex(V.ground);
  ctx.fillRect(0, 0, w, h);
  grain(ctx, 0, 0, w, h, 0.08, 3);
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = hex(V.speck);
    ctx.fillRect((i * 53) % w, (i * 11) % h, 4, 1);
  }
};

// a dry-stone wall and its weeds past the lens: a smear at speed, a wall when stopped
const paintKerb = (K) => (ctx, w, h) => {
  ctx.fillStyle = hex(K.gap);
  ctx.fillRect(0, 0, w, h);
  for (let row = 0, y = 4; y < h; row++, y += 12) {
    for (let x = row % 2 ? -12 : 0; x < w; x += 24 + ((row + x) % 3) * 2) {
      ctx.fillStyle = hex((x + row) % 5 ? K.wall : K.wallLit);
      ctx.fillRect(x + 1, y, 22, 10);
    }
  }
  for (let x = 6; x < w; x += 31) {
    ctx.fillStyle = hex(K.weed);
    ctx.fillRect(x, 0, 3, 7);
    ctx.fillRect(x + 3, 2, 3, 5);
  }
};

// a telegraph pole, 7 m at the road's scale: tarred at the foot, a crossarm, white
// insulators. Painted with the theme, so it goes with it: 308 px in the cars atlas
// would make the whole sheet that tall.
const paintPole = (ctx, w, h) => {
  ctx.fillStyle = hex(0x6a5238);
  ctx.fillRect(16, 6, 4, h - 6);
  ctx.fillStyle = hex(0x8e7250);
  ctx.fillRect(16, 6, 1, h - 6);
  ctx.fillStyle = hex(0x2e2620);
  ctx.fillRect(16, h - 44, 4, 44);
  ctx.fillStyle = hex(0x5a4630);
  ctx.fillRect(2, 8, 32, 3);
  ctx.fillStyle = hex(0xe8e4d8);
  ctx.fillRect(3, 4, 3, 4);
  ctx.fillRect(31, 4, 3, 4);
};

export const keyOf = (theme, part) => `race:${theme.id}:${part}`;
const layerPalette = (theme, L) => (L.land ? { ...theme.land, ...L.land } : theme.land);

function layerTex(scene, key, canvas) {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
  return key;
}

// (paintTexture repaints an existing key: these are the same every race)
const painted = (s, key, w, h, fn) => (s.textures.exists(key) ? key : paintTexture(s, key, w, h, fn));

// every painted texture of a theme, one call each: the garage paints them a frame
// apart, so the door's dip has nothing left to paint (a first race cost 110 ms in one frame)
export const paintSteps = (theme) => [
  (s) => layerTex(s, keyOf(theme, 'sky'), paintSky(theme.sky)),
  ...theme.layers.map((L, i) => (s) => layerTex(s, keyOf(theme, `layer${i}`), paintBackdropLayer(L.kind, layerPalette(theme, L), L.seed))),
  (s) => painted(s, keyOf(theme, 'farverge'), 256, 32, paintFarVerge(theme.farVerge)),
  (s) => painted(s, keyOf(theme, 'road'), 512, ROAD_BOT - ROAD_TOP, paintRoad(theme.road)),
  (s) => painted(s, keyOf(theme, 'verge'), 512, 128, paintVerge(theme.verge)),
  (s) => painted(s, keyOf(theme, 'kerb'), 256, 80, paintKerb(theme.kerb)),
  (s) => painted(s, keyOf(theme, 'pole'), 36, Math.round(7 * M), paintPole),
];

// leaving the race: the theme's textures go, with the canvases behind them (the packs
// sit near their budget; a race only has to paint them again)
export function freeTheme(scene, theme) {
  for (const key of scene.textures.getTextureKeys()) {
    if (!key.startsWith(`race:${theme.id}:`)) continue;
    const src = scene.textures.get(key).getSourceImage();
    forgetPainted(src);
    scene.textures.remove(key);
  }
}

export class RaceRoad {
  constructor(scene, theme) {
    const s = (this.scene = scene);
    this.theme = theme;
    const W = 1200; // past the screen's edges: the camera zooms out to 0.9
    const x0 = 480 - W / 2;
    const tile = (x, y, w, h, key, depth, oy = 0) => s.add.tileSprite(x, y, w, h, key).setOrigin(0, oy).setDepth(depth);
    for (const paint of paintSteps(theme)) paint(s);
    const k = (part) => keyOf(theme, part);
    const h = (key) => s.textures.get(key).getSourceImage().height;
    this.sky = s.add.image(480, 200, k('sky')).setDisplaySize(W, 620).setDepth(0);
    const horizon = ROAD_TOP - 20;
    this.layers = theme.layers.map((L, i) => ({ ts: tile(x0, horizon + (L.dy || 0), W, h(k(`layer${i}`)), k(`layer${i}`), i + 1, 1), f: L.f, y: horizon + (L.dy || 0) }));
    this.horizon = horizon;
    // (taller than the gap it fills: when the land slides up, it follows and no sky shows under the hills)
    this.farVerge = tile(x0, horizon, W, ROAD_TOP - horizon + LAND_SLIDE[0], k('farverge'), 4);
    this.road = tile(x0, ROAD_TOP, W, ROAD_BOT - ROAD_TOP, k('road'), 5);
    this.verge = tile(x0, ROAD_BOT, W, 180, k('verge'), 6);
    this.kerb = tile(x0, 522, W, 80, k('kerb'), 60);
    this.layerW = LAYER_W;
    // the telegraph wires, pole to pole (a span is wider than an atlas frame should be)
    this.poles = (theme.scenery || []).find((c) => c.wires) || null;
    this.wires = this.poles ? s.add.graphics().setDepth(4.45) : null;
  }

  // d in metres; the picture rounds to whole pixels so a slow car does not shimmer.
  // lean: -1..1, the bend's side as far as the car has taken it (the camera slides the road)
  // camX: where the car stands on the screen, for what hangs off the road's own metres
  update(d, v, lean = 0, camX = 360) {
    const px = d * M;
    this.layers.forEach((L, i) => {
      L.ts.tilePositionX = Math.round(px * L.f) % this.layerW;
      L.ts.y = L.y + Math.round(lean * LAND_SLIDE[i]);
    });
    this.farVerge.y = this.horizon + Math.min(0, Math.round(lean * LAND_SLIDE[0]));
    this.farVerge.tilePositionX = Math.round(px * 0.95) % 256;
    this.road.tilePositionX = Math.round(px) % 512;
    this.verge.tilePositionX = Math.round(px * 1.05) % 512;
    this.kerb.tilePositionX = Math.round(px * 1.3) % 256;
    this.kerb.setAlpha(Math.min(1, v / 20));
    if (this.wires) this.drawWires(d, camX);
  }

  drawWires(d, camX) {
    const { at, every } = this.poles;
    const g = this.wires.clear().lineStyle(1, 0x2a2622, 0.8);
    const span = every * M;
    // from the last pole off the left edge (the view reaches about 60 px past it at zoom 0.9)
    const first = Math.floor((d - (camX + 60) / M - at) / every) * every + at;
    for (let x = camX + (first - d) * M; x < 1200; x += span) {
      for (const y of [POLE_WIRE_Y, POLE_WIRE_Y + 6]) {
        g.beginPath();
        g.moveTo(x, y);
        // a wire's droop, in six straight pieces
        for (let i = 1; i <= 6; i++) g.lineTo(x + (span * i) / 6, y + 16 * (1 - ((2 * i) / 6 - 1) ** 2));
        g.strokePath();
      }
    }
  }
}
