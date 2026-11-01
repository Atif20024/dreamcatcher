// The road and the land behind it, for RaceScene: the sky, three parallax
// layers at the design's 0.1, 0.35 and 0.7 of the road's speed, the road band
// with its three depth lanes, and a kerb streak in front. All tile sprites on a
// camera that does not scroll: the world moves past the car, so 50 km of metres
// never meet float precision. A flat road by day: Pinewood.
import { paintBackdropLayer, paintSky, LAYER_W } from '../../../art/backdrops/painted.js';
import { paintTexture, hex, grain } from '../../../art/paint.js';

export const M = 44; // px per metre
export const LANE_Y = [340, 382, 424]; // where a car's wheels stand in each lane
export const ROAD_TOP = 316;
export const ROAD_BOT = 448;
// the far lane 8 percent smaller, the near one 8 percent larger (design §3)
export const laneY = (y) => LANE_Y[0] + (LANE_Y[2] - LANE_Y[0]) * (y / 2);
export const laneScale = (y) => 0.92 + 0.08 * y;

const PINEWOOD = { sky: 0x8ec4e0, hill: 0x4a7a5a, house: 0xd8c8a4, roof: 0xb86a4a, window: 0x3a3a4a, light: 0xf2e6cc, rim: 0xf2e6cc, deep: 0x24402e, leaf: 0x2e6a44, trunk: 0x5a4030, mist: 0xc0dce8, mistA: 0.28, haze: 0.2, fade: 0.08 };
// a bend slides the land towards its outside, the far land the most (px at full lean)
export const ROAD_SLIDE = 8;
const LAND_SLIDE = [14, 9, 5];
const SKY = { top: 0x5a9ccc, mid: 0x8ec4e0, bottom: 0xd8ecf0, clouds: 5, cloud: 0xf0f6f8, cloudLit: 0xffffff, seed: 21 };

function paintRoad(ctx, w, h) {
  // gravel shoulder, tarmac, the kerb stripes top and bottom, dashes between lanes
  ctx.fillStyle = hex(0x4e4c50);
  ctx.fillRect(0, 0, w, h);
  grain(ctx, 0, 0, w, h, 0.07, 7);
  ctx.fillStyle = hex(0x45434a);
  ctx.fillRect(0, 40, w, 6);
  ctx.fillRect(0, 84, w, 6);
  for (let x = 0; x < w; x += 128) {
    ctx.fillStyle = hex(0xd8d4c4);
    ctx.fillRect(x, 44, 64, 3);
    ctx.fillRect(x + 32, 87, 64, 3);
  }
  for (let x = 0; x < w; x += 64) {
    ctx.fillStyle = hex(x % 128 ? 0xf2e6cc : 0xb8302a);
    ctx.fillRect(x, 0, 64, 6);
    ctx.fillRect(x, h - 6, 64, 6);
  }
}

function paintVerge(ctx, w, h) {
  ctx.fillStyle = hex(0xb89a58); // gravel gold
  ctx.fillRect(0, 0, w, h);
  grain(ctx, 0, 0, w, h, 0.1, 11);
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = hex(i % 3 ? 0x8e7a44 : 0x6e8a4a);
    ctx.fillRect((i * 97) % w, (i * 41) % h, 6 + (i % 4), 2);
  }
}

function paintFarVerge(ctx, w, h) {
  ctx.fillStyle = hex(0x7a8a50);
  ctx.fillRect(0, 0, w, h);
  grain(ctx, 0, 0, w, h, 0.08, 3);
}

function paintKerb(ctx, w, h) {
  // near-field grass and posts, a smear past the lens at speed
  for (let x = 0; x < w; x += 128) {
    ctx.fillStyle = hex(0x5a6a3a);
    ctx.fillRect(x, 0, 90, h);
    ctx.fillStyle = hex(0x4a5a30);
    ctx.fillRect(x + 90, 0, 38, h);
  }
}

function layerTex(scene, key, canvas) {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
  return key;
}

// (paintTexture repaints an existing key: these are the same every race)
const painted = (s, key, w, h, fn) => (s.textures.exists(key) ? key : paintTexture(s, key, w, h, fn));

// every painted texture, one call each: the garage paints them a frame apart, so
// the door's dip has nothing left to paint (a first race cost 110 ms in one frame)
export const PAINT_STEPS = [
  (s) => layerTex(s, 'race:sky', paintSky(SKY)),
  (s) => layerTex(s, 'race:far', paintBackdropLayer('far_ridge', PINEWOOD, 5)),
  (s) => layerTex(s, 'race:mid', paintBackdropLayer('town_row', { ...PINEWOOD, mistA: 0.16 }, 9)),
  (s) => layerTex(s, 'race:near', paintBackdropLayer('tree_band', { ...PINEWOOD, haze: 0.06, mistA: 0.06 }, 12)),
  (s) => painted(s, 'race:farverge', 256, 32, paintFarVerge),
  (s) => painted(s, 'race:road', 512, ROAD_BOT - ROAD_TOP, paintRoad),
  (s) => painted(s, 'race:verge', 512, 128, paintVerge),
  (s) => painted(s, 'race:kerb', 256, 32, paintKerb),
];

export class RaceRoad {
  constructor(scene) {
    const s = (this.scene = scene);
    const W = 1200; // past the screen's edges: the camera zooms out to 0.9
    const x0 = 480 - W / 2;
    const tile = (x, y, w, h, key, depth, oy = 0) => s.add.tileSprite(x, y, w, h, key).setOrigin(0, oy).setDepth(depth);
    const [skyT, farT, midT, nearT, farVergeT, roadT, vergeT, kerbT] = PAINT_STEPS.map((p) => p(s));
    const h = (key) => s.textures.get(key).getSourceImage().height;
    this.sky = s.add.image(480, 200, skyT).setDisplaySize(W, 620).setDepth(0);
    const horizon = ROAD_TOP - 20;
    this.layers = [
      { ts: tile(x0, horizon, W, h(farT), farT, 1, 1), f: 0.1, y: horizon },
      { ts: tile(x0, horizon + 4, W, h(midT), midT, 2, 1), f: 0.35, y: horizon + 4 },
      { ts: tile(x0, horizon + 8, W, h(nearT), nearT, 3, 1), f: 0.7, y: horizon + 8 },
    ];
    this.horizon = horizon;
    // (taller than the gap it fills: when the land slides up, it follows and no sky shows under the hills)
    this.farVerge = tile(x0, horizon, W, ROAD_TOP - horizon + LAND_SLIDE[0], farVergeT, 4);
    this.road = tile(x0, ROAD_TOP, W, ROAD_BOT - ROAD_TOP, roadT, 5);
    this.verge = tile(x0, ROAD_BOT, W, 180, vergeT, 6);
    this.kerb = tile(x0, 522, W, 80, kerbT, 60);
    this.layerW = LAYER_W;
  }

  // d in metres; the picture rounds to whole pixels so a slow car does not shimmer.
  // lean: -1..1, the bend's side as far as the car has taken it (the camera slides the road)
  update(d, v, lean = 0) {
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
  }
}
