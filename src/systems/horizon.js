import Phaser from 'phaser';
import { PLACES, EV } from '../data/evening/map.js';
import { lerpC } from './sky.js';
import { fbmTiled, fbm, gradientV, grain, wash, foliage, trunk, clump, dab, stamp, mix, shade, hex as phex, rgba } from '../art/paint.js';
import { drawRow, drawBuilding, drawGroundLine, drawFigure, logRow } from '../art/buildingKit.js';
import { drawTree } from '../art/treeKit.js';
import { BACKDROP_ROWS, facadeMetrics } from '../data/scale.js';

// A1 — the horizon: four bands behind everything, and the reason this place
// feels bigger than every other level.
//
//   band 4 (0.05) the sea        band 3 (0.10) the mountains
//   band 2 (0.18) the town, seen from inside, windows lighting one by one
//   band 1 (0.25) near facades: balconies, shutters, awnings, wires, pigeons
//
// The town wraps, so every town band is a tile whose width is exactly the
// wrap distance times its parallax factor: at the one-frame wrap the bands
// land on the very same pixels. Things that live ON a band (lit windows,
// silhouettes, smoke, balcony people) are positioned with the same modulo.
//
// The road gets its own bands (fields, the lake, pines, snow slopes) that
// crossfade in once Jo is up on the viaduct.

const WRAP_PX = EV.E0 * 32;
const T = 32;
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
const mod = (a, n) => ((a % n) + n) % n;

function canvasTex(scene, key, w, h) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return scene.textures.createCanvas(key, w, h);
}

// periodic noise: integer frequencies only, so a band tiles without a seam
function ridge(x, W, seed, amps) {
  let y = 0;
  amps.forEach(([k, a], i) => {
    y += Math.sin((2 * Math.PI * k * x) / W + seed * (i + 1) * 1.7) * a;
  });
  return y;
}

export default class Horizon {
  constructor(scene, depth) {
    this.scene = scene;
    this.depth = depth;
    const cam = scene.cameras.main;
    this.camW = cam.width;
    this.camH = cam.height;
    this.spanW = Math.ceil(this.camW / 0.55);
    this.spanX = -(this.spanW - this.camW) / 2;
    this.horizonY = this.camH * 0.62;
    this.refScroll = EV.GROUND * T - 24 - 90 - this.camH / 2; // the street view
    this.rand = new Phaser.Math.RandomDataGenerator(['horizon']);
    this.lit = []; // lit window overlays
    this.silhouettes = [];
    this.puffs = [];
    this.balconyFolk = [];
    this.startedAt = scene.time.now;
    this.nextLight = 1500;
    this.snowCap = 0;
    this.roadMix = 0;
    this.rain = 0;

    this.bands = {};
    this.makeSea();
    this.makeMountains();
    this.makeTown();
    this.makeNear();
    this.makeRoad();
    this.makeSeaExtras();
    this.makeTownLights();
  }

  // base: the screen y (in the street view) of the band's bottom edge — or,
  // for the sea, of its top edge, which IS the horizon
  band(key, W, H, f, fy, depth, base, anchorTop = false) {
    const ts = this.scene.add.tileSprite(this.spanX, 0, this.spanW, H, key).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
    return { ts, W, H, f, fy, base, key, anchorTop };
  }

  // ---- band 4: the sea -----------------------------------------------------------
  makeSea() {
    const W = Math.round(WRAP_PX * 0.05);
    const H = 140;
    const ct = canvasTex(this.scene, 'ev-band-sea', W, H);
    const ctx = ct.getContext();
    // painted water: a gradient from the pale horizon to the deep, with
    // long swells of noise and a scatter of glints where the light catches
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) {
      const t = Math.min(1, y / 90);
      const base = lerpC(0xb8c8d4, 0x3a5878, t);
      for (let x = 0; x < W; x++) {
        const n = fbmTiled(x / 60, y / 6, W / 60, 5, 3);
        const swell = (n - 0.5) * 0.35 * (0.3 + t);
        const glint = n > 0.68 && y > 3 ? (n - 0.68) * 2.5 * (1 - t * 0.6) : 0;
        const c = mix(mix(base, 0x1e3a58, Math.max(0, -swell)), 0xfff4d8, Math.max(0, swell) * 0.5 + glint);
        const k = (y * W + x) * 4;
        d[k] = (c >> 16) & 255;
        d[k + 1] = (c >> 8) & 255;
        d[k + 2] = c & 255;
        d[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = 'rgba(255,240,210,0.7)';
    ctx.fillRect(0, 0, W, 1);
    ct.refresh();
    this.bands.sea = this.band('ev-band-sea', W, H, W / WRAP_PX, 0.08, this.depth, this.horizonY, true);
  }

  // the gold road under the sun, and three slow sails
  makeSeaExtras() {
    const s = this.scene;
    this.goldRoad = [];
    for (let i = 0; i < 16; i++) {
      const r = s.add.rectangle(0, 0, 10, 1, 0xf8d890, 0.8).setScrollFactor(0).setDepth(this.depth + 0.1);
      r.k = i;
      this.goldRoad.push(r);
    }
    this.sails = [0, 1, 2].map((i) => {
      const g = s.add.graphics().setScrollFactor(0).setDepth(this.depth + 0.15);
      g.fillStyle(0xf2ece0, 1).fillTriangle(0, 0, 0, -12 - i * 2, 7, 0);
      g.fillStyle(0x6a4a3a, 1).fillRect(-4, 0, 12, 2);
      g.x = 200 + i * 290;
      g.speed = 1.2 + i * 0.5;
      return g;
    });
  }

  // ---- band 3: the mountains ---------------------------------------------------------
  makeMountains() {
    const W = Math.round(WRAP_PX * 0.1);
    const H = 210;
    const ct = canvasTex(this.scene, 'ev-band-mtn', W, H);
    const snow = canvasTex(this.scene, 'ev-band-mtn-snow', W, H);
    const ctx = ct.getContext();
    const sctx = snow.getContext();
    const layers = [
      { col: 0xb8b8d0, base: 150, amps: [[2, 26], [5, 12], [11, 5]], seed: 1 },
      { col: 0x9a9cc0, base: 160, amps: [[3, 30], [7, 12], [13, 4]], seed: 2 },
      { col: 0x7a80a8, base: 172, amps: [[2, 20], [4, 22], [9, 8]], seed: 3 },
      { col: 0x5a6488, base: 190, amps: [[3, 34], [6, 16], [17, 5]], seed: 4, snow: true, pines: true },
    ];
    // painted ridges: a noisy skyline, faces that catch the western sun,
    // haze thickening toward the foot of each range, pines on the nearest
    layers.forEach((L, li) => {
      const tops = new Float32Array(W);
      for (let x = 0; x < W; x++) tops[x] = L.base - 60 - ridge(x, W, L.seed, L.amps) - (fbmTiled(x / 14, li * 9, W / 14, 40 + li, 3) - 0.5) * 14;
      const litCol = mix(L.col, 0xf8d8a8, 0.42);
      const shadeCol = mix(L.col, 0x2a3050, 0.28);
      const footCol = mix(L.col, 0xe8c8a8, 0.45 - li * 0.08);
      const faces = new Float32Array(W);
      for (let x = 0; x < W; x++) faces[x] = Math.max(-1, Math.min(1, (tops[(x - 4 + W) % W] - tops[(x + 4) % W]) / 8));
      for (let x = 0; x < W; x++) {
        const top = Math.round(tops[x]);
        let face = 0;
        for (let k = -6; k <= 6; k++) face += faces[(x + k + W) % W];
        face /= 13; // >0: faces west, lit
        const col = face > 0 ? mix(L.col, litCol, face) : mix(L.col, shadeCol, -face);
        const gr = ctx.createLinearGradient(0, top, 0, H);
        gr.addColorStop(0, phex(col));
        gr.addColorStop(0.55, phex(mix(col, footCol, 0.35)));
        gr.addColorStop(1, phex(footCol));
        ctx.fillStyle = gr;
        ctx.fillRect(x, top, 1, H - top);
        if (L.snow) {
          // the always-there caps, and a much bigger cap for when it snows
          const peak = 1 - (top - (L.base - 110)) / 110;
          if (peak > 0.55) {
            ctx.fillStyle = face > 0 ? '#fbf8f0' : '#d8dce8';
            ctx.fillRect(x, top, 1, Math.round((peak - 0.55) * 30 * (0.7 + fbmTiled(x / 5, 3, W / 5, 9, 2) * 0.6)));
          }
          sctx.fillStyle = face > 0 ? '#fbfaff' : '#dfe4f0';
          sctx.fillRect(x, top, 1, Math.max(3, Math.round(peak * 46)));
        }
      }
      if (L.pines) {
        for (let x = 0; x < W; x += 2) {
          if (this.rand.frac() > 0.55) continue;
          const py = tops[x] + this.rand.between(22, 70);
          dab(ctx, x, py, 1.6, 4, 0, 0x2a3e48, 0.45, 0.2);
        }
      }
      // a soft strip of shadow where the next range stands in front
      if (li > 0) {
        for (let x = 0; x < W; x++) {
          const top = Math.round(tops[x]);
          ctx.fillStyle = 'rgba(40,50,80,0.16)';
          ctx.fillRect(x, top, 1, 6);
        }
      }
    });
    grain(ctx, 0, 0, W, H, 0.035, 17);
    ct.refresh();
    snow.refresh();
    this.bands.mtn = this.band('ev-band-mtn', W, H, W / WRAP_PX, 0.12, this.depth + 1, this.horizonY + 8);
    this.bands.mtnSnow = this.band('ev-band-mtn-snow', W, H, W / WRAP_PX, 0.12, this.depth + 1.1, this.horizonY + 8);
    this.bands.mtnSnow.ts.setAlpha(0);
  }

  // ---- band 2: the town, climbing the hill -------------------------------------------
  makeTown() {
    const W = Math.round(WRAP_PX * 0.18);
    const H = 250;
    const ct = canvasTex(this.scene, 'ev-band-town', W, H);
    const ctx = ct.getContext();
    this.windows = [];
    this.chimneys = [];
    const walls = [0xe8d0a8, 0xd8b890, 0xc8a078, 0xe0c8b0, 0xd0b098];
    const roofs = [0xb85a3a, 0xa04a30, 0xc86a48, 0x8a4a3a];
    const hill = (x) => 150 - ridge(x, W, 7, [[1, 40], [3, 18], [7, 6]]);
    const TM = facadeMetrics(BACKDROP_ROWS['evening.town'].s);
    logRow('evening.town', TM.s, TM.storey);
    // the hill itself, behind the houses: a warm green, lit on the crown,
    // a little olive in the folds
    for (let x = 0; x < W; x++) {
      const top = Math.round(hill(x) - 30);
      const n = fbmTiled(x / 40, 2, W / 40, 4, 3);
      const gr = ctx.createLinearGradient(0, top, 0, H);
      gr.addColorStop(0, phex(mix(0x9ab070, 0xc8c880, n * 0.6)));
      gr.addColorStop(0.5, phex(mix(0x7e9460, 0x9aa070, n * 0.5)));
      gr.addColorStop(1, '#6a8054');
      ctx.fillStyle = gr;
      ctx.fillRect(x, top, 1, H - top);
    }
    // olive groves dotted over the slope
    for (let i = 0; i < 160; i++) {
      const x = this.rand.between(0, W);
      const y = Math.round(hill(x)) - 24 + this.rand.between(-4, 26);
      for (const dx of [0, -W, W]) clump(ctx, x + dx, y, this.rand.realInRange(2, 4), i % 2 ? 0x6a8a50 : 0x5a7a48, 0.85, this.rand, 4);
    }
    const drawHouse = (x0, w, h, wall, roof) => {
      for (const x of [x0, x0 - W]) {
        const base = Math.round(hill(Math.max(0, Math.min(W - 1, x0 + w / 2)))) + 60;
        const top = base - h;
        // the wall: lit from the west, shaded on the east, a warm bounce low down
        const gw = ctx.createLinearGradient(x, 0, x + w, 0);
        gw.addColorStop(0, phex(mix(wall, 0xfff0d0, 0.3)));
        gw.addColorStop(0.5, phex(wall));
        gw.addColorStop(1, phex(mix(wall, 0x6a5060, 0.3)));
        ctx.fillStyle = gw;
        ctx.fillRect(x, top, w, H - top);
        ctx.fillStyle = 'rgba(50,40,60,0.18)';
        ctx.fillRect(x, top, w, 3); // shadow under the eaves
        // the roof: tiles, the sunny slope lighter
        for (let r = 0; r < 10; r++) {
          ctx.fillStyle = phex(mix(roof, r % 2 ? 0x000000 : 0xffd0a0, r % 2 ? 0.12 : 0.15));
          ctx.fillRect(x - 2 + r, top - r, w + 4 - r * 2, 1);
        }
        if (x === x0) {
          // round 2 WP4: storeys of 3 m and 1.0 x 1.5 m windows at this
          // band's depth (s 0.18: 24 px a storey, 8 x 12 px a window)
          for (let fl = base - TM.storey; fl > top + TM.winH * 0.6; fl -= TM.storey) {
            const wy = Math.round(fl + TM.storey - TM.sill - TM.winH);
            for (let wx = x + (w % TM.bay) / 2 + (TM.bay - TM.winW) / 2; wx + TM.winW < x + w - 1; wx += TM.bay) {
              if (this.rand.frac() < 0.55) this.windows.push({ x: Math.round(wx), y: wy, w: Math.round(TM.winW), h: Math.round(TM.winH) });
            }
          }
          if (this.rand.frac() < 0.6) this.chimneys.push({ x: x + Math.round(w * 0.7), y: top - 14 });
        }
        ctx.fillStyle = '#4a3a40';
        for (const win of this.windows) if (win.x >= x0 && win.x < x0 + w) ctx.fillRect(win.x - (x0 - x), win.y, win.w, win.h);
        // chimneys, tanks, dishes: roofline furniture
        ctx.fillStyle = hex(lerpC(roof, 0x3a2a2a, 0.4));
        if (this.chimneys.length && this.chimneys[this.chimneys.length - 1].x >= x0 && this.chimneys[this.chimneys.length - 1].x < x0 + w) {
          const c = this.chimneys[this.chimneys.length - 1];
          ctx.fillRect(c.x - (x0 - x), c.y, 4, 10);
        }
      }
    };
    let x = 0;
    while (x < W) {
      const w = Math.round(TM.bay * this.rand.between(2, 4) + 2);
      const h = Math.round(TM.storey * this.rand.between(2, 4) + TM.cornice);
      drawHouse(x, w, h, walls[this.rand.between(0, walls.length - 1)], roofs[this.rand.between(0, roofs.length - 1)]);
      // a water tank or a dish on some roofs
      if (this.rand.frac() < 0.2) {
        ctx.fillStyle = '#6a6e7a';
        const base = Math.round(hill(x + w / 2)) + 60 - h;
        ctx.fillRect(x + 4, base - 16, 10, 8);
      }
      x += w + this.rand.between(-4, 4);
    }
    // minaret, steeple, clocktower: three silhouettes you can steer by
    const spires = [
      { x: Math.round(W * 0.18), kind: 'minaret' },
      { x: Math.round(W * 0.52), kind: 'steeple' },
      { x: Math.round(W * 0.8), kind: 'clock' },
    ];
    for (const sp of spires) {
      const base = Math.round(hill(sp.x)) + 30;
      ctx.fillStyle = '#c8b090';
      if (sp.kind === 'minaret') {
        ctx.fillRect(sp.x, base - 110, 8, 110);
        ctx.fillRect(sp.x - 3, base - 80, 14, 4);
        ctx.fillStyle = '#a89070';
        ctx.fillRect(sp.x + 1, base - 122, 6, 12);
        ctx.fillRect(sp.x + 3, base - 128, 2, 6);
      } else if (sp.kind === 'steeple') {
        ctx.fillRect(sp.x, base - 90, 14, 90);
        for (let r = 0; r < 30; r++) ctx.fillRect(sp.x + Math.floor(r / 4), base - 90 - r, 14 - Math.floor(r / 2), 1);
      } else {
        ctx.fillRect(sp.x, base - 100, 18, 100);
        ctx.fillStyle = '#f2ece0';
        ctx.beginPath();
        ctx.arc(sp.x + 9, base - 84, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a2a2a';
        ctx.fillRect(sp.x + 8, base - 88, 1, 5);
        ctx.fillRect(sp.x + 8, base - 84, 4, 1);
      }
    }
    // tiny laundry between some houses
    for (let i = 0; i < 18; i++) {
      const lx = this.rand.between(0, W - 30);
      const ly = Math.round(hill(lx)) + this.rand.between(10, 30);
      ctx.fillStyle = 'rgba(40,30,30,0.5)';
      ctx.fillRect(lx, ly, 26, 1);
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = ['#f2ece0', '#88b8d8', '#e86a6a', '#f2d580'][k];
        ctx.fillRect(lx + 2 + k * 6, ly + 1, 4, 5);
      }
    }
    wash(ctx, 0, 0, W, H, 0xc09070, 0xf0e0c8, 0.14, 8, 0.03);
    grain(ctx, 0, 0, W, H, 0.04, 23);
    ct.refresh();
    this.bands.town = this.band('ev-band-town', W, H, W / WRAP_PX, 0.3, this.depth + 2, this.horizonY + 70);
    // ten windows with someone in them doing something
    const picks = Phaser.Utils.Array.Shuffle([...this.windows]).slice(0, 10);
    const acts = ['cook', 'hug', 'read', 'dance', 'cook', 'read', 'dance', 'hug', 'read', 'cook'];
    picks.forEach((w, i) => (w.act = acts[i]));
  }

  // ---- band 1: near buildings, place by place ----------------------------------------
  makeNear() {
    // round 2 WP4: the near town at its depth. This band moves at 0.25 of
    // the camera, so by the depth rule (critique §7.1.2) a 3 m storey is 33
    // px, a door 24 px and a passer-by 19 px, painted by the building kit in
    // metres. Between Jo's street and the facades lies their own street (a
    // pavement, a kerb, a strip of road, a few people and lamps on it): the
    // ground line that makes them read as across the way, not as a doll's
    // house standing right behind the townsfolk.
    const S = BACKDROP_ROWS['evening.near'].s;
    const fm = facadeMetrics(S);
    const W = Math.round(WRAP_PX * 0.25);
    const HIDDEN = 42; // the band's foot, behind the terrain in the street view
    const LIFT = HIDDEN + Math.round(fm.k * 2.6); // + the far street, 2.6 m of it seen
    const H = 360;
    const GY = H - LIFT;
    const f = W / WRAP_PX;
    const ct = canvasTex(this.scene, 'ev-band-near', W, H);
    const ctx = ct.getContext();
    this.balconies = [];
    const texAt = (worldX) => mod((worldX - this.camW / 2) * f + this.camW / 2 - this.spanX, W);
    const rect = (x, y, w, h, c) => {
      ctx.fillStyle = typeof c === 'number' ? hex(c) : c;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
      if (x + w > W) ctx.fillRect(Math.round(x - W), Math.round(y), Math.round(w), Math.round(h));
    };
    const tops = [];
    // the far street first, under everything
    drawGroundLine(ctx, 0, W, GY, H - GY, S, { pave: 0xc8b898, road: 0x8a7a6a });
    const keep = (b) => {
      tops.push({ x: b.x, w: b.w, top: b.top });
      for (const bal of b.balconies) this.balconies.push({ x: Math.round(bal.x - 4), y: Math.round(bal.y - 6), washing: bal.washing });
    };
    const row = (x0, x1, o) => drawRow(ctx, x0, x1, GY, S, this.rand, { wrapW: W, logId: 'evening.near', close: true, flowers: true, ...o }).forEach(keep);
    const tree = (x, kind = 'street', m = null) => {
      drawTree(ctx, x, GY + 2, kind, S, this.rand, m ? { m } : {});
      if (x + 60 > W) drawTree(ctx, x - W, GY + 2, kind, S, this.rand, m ? { m } : {});
    };
    // scale cues on the far pavement: people, a lamp
    const folk = (x0, x1, n) => {
      const cols = [0x3a5a80, 0xc03a2a, 0x6a4a3a, 0x2e6a4a, 0xd89a4a];
      for (let i = 0; i < n; i++) drawFigure(ctx, mod(x0 + this.rand.frac() * (x1 - x0), W), GY + fm.k * 0.6, S, cols[i % cols.length], this.rand);
    };
    const lamp = (x) => {
      rect(x, GY - fm.k * 4.5, Math.max(1, fm.k * 0.12), fm.k * 4.5, 0x2e2e38);
      rect(x - fm.k * 0.2, GY - fm.k * 4.7, fm.k * 0.5, fm.k * 0.4, 0xf2d580);
    };
    const style = {
      arch: (x0, x1) => {
        rect(x0, GY - fm.k * 1.2, x1 - x0, fm.k * 1.2, 0xc8b898); // a garden wall
        rect(x0, GY - fm.k * 1.3, x1 - x0, fm.k * 0.15, 0xe0d4b8);
        for (let x = x0 + 30; x < x1; x += 70) tree(x, 'street');
      },
      orchard: (x0, x1) => {
        for (let x = x0 + 18; x < x1; x += 52) tree(x, 'apple');
      },
      laundry: (x0, x1) => {
        row(x0, x1, { storeys: [3, 5], bays: [2, 3], balconies: true, shutter: 0x3a6a8a, walls: [0xe8d0a8, 0xd8b890, 0xe0c0a0], ground: () => 'house' });
        folk(x0, x1, 3);
      },
      square: (x0, x1) => {
        row(x0, x1, {
          storeys: [3, 5], bays: [3, 4], balconies: true, walls: [0xf0d8b0, 0xe8c898, 0xd8b090, 0xe8d8c0],
          signs: [0x2e6a4a, 0x8a2c2c, 0x2e3a52, 0x6a4a2a], awnings: [0xc03a2a, 0x2e6a4a], ground: () => 'shop', shutter: 0x4a7a6a,
        });
        lamp(x0 + (x1 - x0) * 0.3);
        lamp(x0 + (x1 - x0) * 0.75);
        folk(x0, x1, 6);
      },
      canal: (x0, x1) => {
        row(x0, x1, { storeys: [3, 4], bays: [3, 4], walls: [0xb86a4a, 0xa05a3a, 0xc07a58], shutter: 0x2e3a52, roof: () => 'parapet', ground: () => 'plain' });
        folk(x0, x1, 2);
      },
      steep: (x0, x1) => {
        // the houses climb with the street: each one a storey higher
        let x = x0;
        let st = 2;
        while (x < x1 - fm.bay) {
          const w = Math.min(x1 - x, fm.bay * 2 + fm.k * 0.4);
          keep(drawBuilding(ctx, x, GY, { s: S, w, storeys: st, ground: 'house', wall: [0xe8c8a0, 0xf0d8b8, 0xd8a888][st % 3], roof: 'pitched', shutter: 0x4a7a6a, balconies: true, flowers: true, wrapW: W, logId: 'evening.near' }, this.rand));
          st = Math.min(6, st + 1);
          x += w + 1;
        }
      },
      rooftops: (x0, x1) => {
        // seen from up here: roofs below, chimneys, and the sky
        for (let x = x0; x < x1; x += fm.bay * 3) drawBuilding(ctx, x, GY + fm.storey * 1.5, { s: S, w: fm.bay * 3 - 2, storeys: 0, ground: 'plain', wall: 0xd8b890, roof: 'pitched', roofCol: 0xb85a3a, wrapW: W }, this.rand);
      },
      school: (x0, x1) => {
        keep(drawBuilding(ctx, x0 + 10, GY, { s: S, w: x1 - x0 - 20, storeys: 2, ground: 'house', wall: 0xc8906a, roof: 'pitched', roofCol: 0x8a4a3a, shutter: 0x5a7aa8, wrapW: W, logId: 'evening.near' }, this.rand));
        folk(x0, x1, 4);
      },
      allotments: (x0, x1) => {
        for (let x = x0; x < x1; x += 70) {
          rect(x, GY - fm.k * 2.2, fm.k * 3, fm.k * 2.2, 0x7a6a4a); // sheds
          rect(x - 2, GY - fm.k * 2.4, fm.k * 3 + 4, fm.k * 0.25, 0x8a8a94);
        }
        for (let x = x0 + 40; x < x1; x += 90) tree(x, 'street', 7);
      },
      hill: () => {},
      station: (x0, x1) => {
        rect(x0, GY - fm.k * 4.2, x1 - x0, fm.k * 0.6, 0x4a4650); // the canopy
        for (let x = x0; x < x1; x += fm.k * 6) rect(x, GY - fm.k * 3.6, Math.max(2, fm.k * 0.25), fm.k * 3.6, 0x4a4650);
      },
    };
    // one pass per place, laid out where that place sits in the band
    for (const p of PLACES) {
      const a = texAt(p.c0 * T);
      let b = texAt(p.c1 * T);
      if (b < a) b += W;
      (style[p.id] || (() => {}))(a, b);
    }
    // wires strung between the facades
    tops.sort((a, b) => a.x - b.x);
    for (let i = 0; i < tops.length - 1; i++) {
      const A = tops[i];
      const B = tops[i + 1];
      if (B.x - (A.x + A.w) > 40 || this.rand.frac() < 0.5) continue;
      const y0 = A.top + 30;
      const y1 = B.top + 26;
      for (let t = 0; t <= 1; t += 0.02) {
        const x = A.x + A.w - 6 + (B.x + 6 - (A.x + A.w - 6)) * t;
        const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 10;
        rect(x, y, 1, 1, 'rgba(30,30,40,0.6)');
      }
    }
    wash(ctx, 0, 0, W, H, 0xb08868, 0xf8ecd8, 0.2, 12, 0.02);
    grain(ctx, 0, 0, W, H, 0.06, 29);
    // where the facades meet the street: a band of shadow, so they stand
    // on the ground instead of floating behind it
    gradientV(ctx, 0, H - 26, W, 26, [[0, 0x2a2030, 0], [1, 0x2a2030, 0.38]]);
    ct.refresh();
    this.bands.near = this.band('ev-band-near', W, H, f, 0.55, this.depth + 3, this.horizonY + 92);
    // the ground the facades stand on, continued a long way down: when the
    // camera rises (a jump, the rooftops, the hill) the bands slide up and
    // this is what shows between them and the terrain, instead of the sea
    const gt = canvasTex(this.scene, 'ev-band-under', 8, 420);
    const gctx = gt.getContext();
    gradientV(gctx, 0, 0, 8, 420, [[0, 0x8a9a68, 1], [0.08, 0x7a8858, 1], [0.2, 0xb8a078, 1], [0.6, 0x9a8460, 1], [1, 0x6a5a44, 1]]);
    grain(gctx, 0, 0, 8, 420, 0.05, 33);
    gt.refresh();
    this.bands.under = this.band('ev-band-under', 8, 420, f, 0.55, this.depth + 2.4, this.horizonY + 60, true);
  }

  // ---- the road's own bands --------------------------------------------------------
  makeRoad() {
    // round 2 WP4 (critique §5.9, "the translucent grey band"): the band was
    // 2600 px wide and the road scrolls it 2312 px plus a screen, so from the
    // lake on it wrapped (a hard vertical seam, wheat against snow), its foot
    // ended in mid-air above the lake, and the rock was painted one column at
    // a time from fine noise (grey vertical streaks). Now it is wide enough
    // never to wrap, it runs 200 px further down under the terrain, and the
    // snow country is painted in patches, not columns.
    const W = 4096;
    const H = 430;
    const ct = canvasTex(this.scene, 'ev-band-road', W, H);
    const ctx = ct.getContext();
    const hill = (x) => 120 - Math.sin(x / 230) * 20 - Math.sin(x / 90 + 1) * 8 - Math.min(96, Math.max(0, (x - 1500) / 900) * 70) + (fbm(x / 30, 1, 51, 3) - 0.5) * 10;
    // the land: wheat, then meadow, then forest, then snow; each painted as
    // a slope that catches the last of the light on its western faces
    for (let x = 0; x < W; x++) {
      const top = Math.round(hill(x));
      const face = Math.max(-1, Math.min(1, (hill(x - 5) - hill(x + 5)) / 6));
      // the land changes hands gradually: wheat into meadow into forest
      // into the snow country, each blended over a hundred pixels or so
      const wheat = mix(0xc0a858, 0xd8c070, fbm(x / 22, 0, 52, 2));
      const meadow = mix(0x6a8a52, 0x8aa460, fbm(x / 30, 0, 53, 2));
      const forest = mix(0x3e5a48, 0x4e6a50, fbm(x / 18, 0, 55, 2));
      const rock = mix(0x3e5450, 0x5a6670, fbm(x / 120, 0, 56, 2));
      const snowy = mix(rock, 0xd8e0ee, Math.max(0, fbm(x / 70, 1, 57, 2) - 0.5) * 0.8 * Math.min(1, (x - 1600) / 500));
      const blend = (a, b, from, to) => mix(a, b, Math.max(0, Math.min(1, (x - from) / (to - from))));
      const col = blend(blend(blend(wheat, meadow, 620, 780), forest, 1020, 1180), snowy, 1600, 1760);
      // the slope's light only on its face near the crest: carried all the
      // way down the column it painted vertical stripes
      const lit = face > 0 ? mix(col, 0xf8e0b0, face * 0.3) : mix(col, 0x2a3050, -face * 0.25);
      const gr = ctx.createLinearGradient(0, top, 0, H);
      gr.addColorStop(0, phex(lit));
      gr.addColorStop(Math.min(0.2, 40 / (H - top)), phex(col));
      gr.addColorStop(0.45, phex(mix(col, 0x4a4050, 0.25)));
      gr.addColorStop(1, phex(mix(col, 0x4a4050, 0.4)));
      ctx.fillStyle = gr;
      ctx.fillRect(x, top, 1, H - top);
      if (x > 1650) {
        ctx.fillStyle = face > 0 ? 'rgba(244,246,252,0.9)' : 'rgba(208,216,234,0.9)';
        ctx.fillRect(x, top, 1, Math.round(Math.min(1, (x - 1650) / 200) * (4 + (x - 1650) / 60 + fbm(x / 9, 2, 54, 2) * 8)));
      }
    }
    // the snow country in patches: drifts on the slopes, rock showing
    // through, dark stands of forest below the snowline
    for (let i = 0; i < 900; i++) {
      const x = 1550 + this.rand.frac() * (W - 1550);
      const y = hill(x) + 8 + Math.pow(this.rand.frac(), 1.6) * 150;
      const k = Math.min(1, (x - 1550) / 400);
      const r = this.rand.frac();
      if (r < 0.45) dab(ctx, x, y, this.rand.realInRange(8, 26), this.rand.realInRange(2, 5), this.rand.realInRange(-0.3, 0.3), 0xe8eef8, 0.55 * k, 0.6);
      else if (r < 0.75) dab(ctx, x, y, this.rand.realInRange(6, 18), this.rand.realInRange(2, 4), this.rand.realInRange(-0.4, 0.4), 0x5a6478, 0.4 * k, 0.6);
      else dab(ctx, x, y + 20, this.rand.realInRange(10, 30), this.rand.realInRange(4, 9), 0, 0x2a4440, 0.5 * k, 0.5);
    }
    // the wheat in rows, a hedgerow between fields
    for (let x = 0; x < 700; x += 3) {
      const top = hill(x);
      ctx.fillStyle = rgba(x % 36 < 18 ? 0xa88a40 : 0xe8d080, 0.35);
      ctx.fillRect(x, top + 2, 2, 10 + (x % 7));
    }
    for (const hx of [230, 470]) for (let i = 0; i < 14; i++) clump(ctx, hx + i * 5, hill(hx) + 4 + (i % 3), 4, i % 2 ? 0x4a6a3a : 0x5a7a44, 0.9, this.rand, 4);
    // the lake, a silver sheet in the middle distance
    const ly = Math.round(hill(760)) + 20;
    gradientV(ctx, 760, ly, 260, 12, [[0, 0xd8e4f0, 1], [1, 0x98b0c8, 1]]);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(790, ly + 2, 180, 1);
    // pines, thicker as the road climbs: dark fans of dabs, snow on the top ones
    for (let x = 900; x < W; x += this.rand.between(4, 12)) {
      const top = hill(x) + this.rand.between(-4, 12);
      const h = this.rand.between(14, 32);
      const c = x > 1800 ? 0x2a4448 : 0x2e4a38;
      for (let t = 0; t < 5; t++) dab(ctx, x, top - h + (t / 4) * h, 2 + t * 1.4, 2.4, 0, mix(c, 0x6a8a70, t === 0 ? 0.4 : 0.1), 0.95, 0.25);
      if (x > 1800) dab(ctx, x - 0.5, top - h + 3, 2, 1.4, 0, 0xeef2fa, 0.9, 0.2);
    }
    // orchards, a mill, a farmhouse with one lit window
    for (let x = 100; x < 700; x += 70) {
      trunk(ctx, x + 8, hill(x) - 8, hill(x) + 2, 1.5, 2.5, 0x4a3a2a, this.rand);
      foliage(ctx, x + 8, hill(x) - 12, 9, 7, 0x5a7a4a, this.rand, { density: 0.6 });
    }
    ctx.fillStyle = '#c8b898';
    ctx.fillRect(1180, Math.round(hill(1180)) - 30, 20, 30);
    ctx.fillStyle = '#8a4a3a';
    ctx.fillRect(1178, Math.round(hill(1180)) - 34, 24, 5);
    ctx.fillStyle = '#f2d580';
    ctx.fillRect(1186, Math.round(hill(1180)) - 20, 4, 5);
    grain(ctx, 0, 0, W, H, 0.05, 61);
    ct.refresh();
    this.bands.road = this.band('ev-band-road', W, H, 0.2, 0.3, this.depth + 2.5, this.horizonY + 280);
    this.bands.road.ts.setAlpha(0);
  }

  // on the road, the town behind: a handful of orange dots, far below
  makeTownLights() {
    const s = this.scene;
    this.townDots = [];
    const rand = new Phaser.Math.RandomDataGenerator(['dots']);
    // round 2 WP4: a cluster you can read from the ridge (the critique's
    // closing shot): more lights, bunched toward the middle, a warm glow
    this.townGlow = s.add.ellipse(0, 0, 150, 26, 0xf2a050, 1).setScrollFactor(0).setDepth(this.depth + 2.55).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    for (let i = 0; i < 64; i++) {
      const d = s.add.circle(0, 0, rand.frac() < 0.3 ? 1.6 : 1.1, rand.frac() < 0.2 ? 0xfff0c0 : 0xf2b060, 1).setScrollFactor(0).setDepth(this.depth + 2.6).setAlpha(0);
      d.ox = Math.round((rand.frac() - 0.5) * (rand.frac() < 0.6 ? 70 : 150));
      d.oy = Math.round((rand.frac() - 0.5) * 16 - Math.max(0, 30 - Math.abs(d.ox)) * 0.25);
      d.tw = rand.realInRange(0, 6);
      this.townDots.push(d);
    }
  }

  // ---- per frame -------------------------------------------------------------------

  // where a band's layer-x lands on screen (single copy: every band that
  // carries overlays is wider than the view span)
  screenX(b, lx) {
    const tp = b.ts.tilePositionX;
    let sx = this.spanX + mod(lx - tp, b.W);
    if (sx > this.spanX + this.spanW + 20) sx -= b.W;
    return sx;
  }

  update(time, delta, { ambient, horizonColour, player, sunX, snow, rain, onRoad, roadProgress }) {
    const cam = this.scene.cameras.main;
    const sx = cam.scrollX;
    const sy = cam.scrollY;
    const dt = delta / 1000;
    this.rain = rain;

    // the road crossfade: only ever up on the viaduct, never in the wrap
    const target = onRoad ? Phaser.Math.Clamp((player.x - 396 * T) / ((470 - 396) * T), 0, 1) : 0;
    this.roadMix += (target - this.roadMix) * Math.min(1, dt * 1.5);
    const town = 1 - this.roadMix;

    for (const [name, b] of Object.entries(this.bands)) {
      if (name === 'road') {
        b.ts.tilePositionX = (sx - EV.R0 * T) * b.f + 200;
      } else {
        b.ts.tilePositionX = sx * b.f;
      }
      b.ts.y = (b.anchorTop ? b.base : b.base - b.H) + (this.refScroll - sy) * b.fy * 0.6;
      // aerial perspective: far bands wash toward the horizon colour
      const haze = name === 'sea' ? 0.35 : name === 'mtn' || name === 'mtnSnow' ? 0.5 : name === 'town' ? 0.25 : name === 'road' ? 0.2 : name === 'under' ? 0.15 : 0.16;
      b.ts.setTint(lerpC(ambient, horizonColour, haze));
    }
    this.bands.sea.ts.setAlpha(town * (1 - rain * 0.3));
    this.bands.town.ts.setAlpha(town);
    this.bands.near.ts.setAlpha(town);
    this.bands.under.ts.setAlpha(town);
    this.bands.road.ts.setAlpha(this.roadMix);
    // the mountains take the snow half a minute before the town does
    this.snowCap += ((snow > 0 ? 1 : 0) - this.snowCap) * Math.min(1, dt / (snow > 0 ? 25 : 40));
    this.bands.mtnSnow.ts.setAlpha(this.snowCap);
    // rain: the sea goes matte, the mountains blur
    this.bands.mtn.ts.setAlpha(1 - rain * 0.35);

    // gold road on the sea, under the sun
    const seaY = this.bands.sea.ts.y;
    this.goldRoad.forEach((r) => {
      const k = r.k;
      const w = 6 + k * 3 + Math.sin(time / 300 + k) * 3;
      r.setPosition(sunX + Math.sin(time / 500 + k * 1.3) * (2 + k * 0.6), seaY + 3 + k * 5).setSize(w, 1).setAlpha(town * (0.75 - k * 0.04) * (1 - rain * 0.9));
    });
    this.sails.forEach((g) => {
      g.x += g.speed * dt;
      if (g.x > this.spanX + this.spanW) g.x = this.spanX - 20;
      g.y = seaY + 6 + g.speed * 3;
      g.setAlpha(town * 0.85);
    });

    // windows light one by one over the first ten minutes (a Poisson clock)
    const since = (time - this.startedAt) / 1000;
    this.nextLight -= delta;
    if (this.nextLight <= 0 && this.lit.length < this.windows.length * 0.7) {
      const rate = since < 600 ? 1 + since / 120 : 6; // lights per minute
      this.nextLight = -Math.log(1 - Math.random()) * (60000 / rate);
      const cand = this.windows.filter((w) => !w.on);
      if (cand.length) this.lightWindow(cand[Math.floor(Math.random() * cand.length)]);
    }
    const tb = this.bands.town;
    for (const w of this.lit) {
      const x = this.screenX(tb, w.x);
      w.img.setPosition(x, tb.ts.y + w.y).setAlpha(town * w.alpha);
      if (w.sil) {
        w.sil.setPosition(x, tb.ts.y + w.y).setAlpha(town);
        w.silT += delta;
        if (w.silT > 700) {
          w.silT = 0;
          w.silF = 1 - w.silF;
          this.drawSilhouette(w);
        }
      }
    }
    // smoke from chimneys, drifting east
    if (Math.random() < dt * 2.5 && this.chimneys.length) {
      const c = this.chimneys[Math.floor(Math.random() * this.chimneys.length)];
      const x = this.screenX(tb, c.x);
      if (x > this.spanX && x < this.spanX + this.spanW) {
        const p = this.scene.add.circle(0, 0, 2, 0xe8e0e8, 0.5).setScrollFactor(0).setDepth(this.depth + 2.1);
        p.lx = c.x;
        p.ly = c.y;
        p.life = 0;
        this.puffs.push(p);
      }
    }
    this.puffs = this.puffs.filter((p) => {
      p.life += dt;
      p.lx += dt * 3 * (1 + rain);
      p.ly -= dt * 6;
      p.setPosition(this.screenX(tb, p.lx), tb.ts.y + p.ly).setRadius(2 + p.life * 1.5).setAlpha(Math.max(0, 0.45 - p.life * 0.09) * town);
      if (p.life > 5) {
        p.destroy();
        return false;
      }
      return true;
    });

    // balcony folk: leaning, watering, calling down; in the rain, washing in
    const nb = this.bands.near;
    if (!this.folkMade) this.makeBalconyFolk();
    for (const f of this.balconyFolk) {
      const x = this.screenX(nb, f.x);
      const on = x > this.spanX - 20 && x < this.spanX + this.spanW + 20;
      f.g.setVisible(on).setPosition(x, nb.ts.y + f.y).setAlpha(town);
      f.t += delta;
      if (f.t > f.period) {
        f.t = 0;
        f.frame = 1 - f.frame;
        this.drawFolk(f);
      }
    }

    // on the road: the town, far behind, lights up as it gets dark
    const night = Phaser.Math.Clamp((roadProgress - 3) / 3, 0, 1);
    const dx = Math.max(this.spanX + 60, this.camW * 0.3 - roadProgress * 26);
    const dy = this.horizonY + 26 + Math.max(0, roadProgress - 6) * 6 + (this.refScroll - sy) * 0.05;
    for (const d of this.townDots) {
      d.setPosition(dx + d.ox, dy + d.oy).setAlpha(this.roadMix * night * (0.6 + 0.4 * Math.sin(time / 700 + d.tw)));
    }
    if (this.townGlow) this.townGlow.setPosition(dx, dy).setAlpha(this.roadMix * night * 0.12);
  }

  lightWindow(w) {
    w.on = true;
    const img = this.scene.add.rectangle(0, 0, w.w, w.h, 0xf8c870, 1).setOrigin(0).setScrollFactor(0).setDepth(this.depth + 2.05);
    w.img = img;
    w.alpha = 0;
    this.scene.tweens.add({ targets: w, alpha: 0.95, duration: 1400 });
    if (w.act) {
      w.sil = this.scene.add.graphics().setScrollFactor(0).setDepth(this.depth + 2.06);
      w.silT = 0;
      w.silF = 0;
      this.drawSilhouette(w);
    }
    this.lit.push(w);
  }

  // 2-frame loops: cooking, a hug, reading, dancing badly
  drawSilhouette(w) {
    const g = w.sil;
    g.clear();
    g.fillStyle(0x3a2420, 0.9);
    const f = w.silF;
    if (w.act === 'cook') {
      g.fillRect(1, 2, 2, 4);
      g.fillRect(f ? 3 : 2, 3, 1, 1);
    } else if (w.act === 'hug') {
      g.fillRect(f ? 0 : 0, 2, 2, 4);
      g.fillRect(f ? 2 : 3, 2, 2, 4);
    } else if (w.act === 'read') {
      g.fillRect(1, 2 + f * 0.5, 2, 4);
      g.fillStyle(0xf2ece0, 0.9).fillRect(3, 3, 1, 1);
    } else {
      g.fillRect(f ? 0 : 2, 2, 2, 4);
    }
  }

  makeBalconyFolk() {
    this.folkMade = true;
    const cols = [0xc03a2a, 0x2e6a4a, 0x3a5a80, 0xd89a4a, 0x7a3a5a];
    this.balconies.forEach((b, i) => {
      const g = this.scene.add.graphics().setScrollFactor(0).setDepth(this.depth + 3.05);
      const f = { g, x: b.x, y: b.y, t: Math.random() * 2000, period: 1200 + Math.random() * 2400, frame: 0, col: cols[i % cols.length], washing: b.washing, act: ['lean', 'water', 'call'][i % 3] };
      this.drawFolk(f);
      this.balconyFolk.push(f);
    });
  }

  drawFolk(f) {
    const g = f.g;
    g.clear();
    // washing on the rail — pulled in when it rains
    if (f.washing && this.rain < 0.3) {
      g.fillStyle(0xf2ece0, 1).fillRect(-8, 6, 5, 6);
      g.fillStyle(0x88b8d8, 1).fillRect(10, 6, 5, 6);
    }
    g.fillStyle(0x3a2a2a, 1).fillRect(0, -4 + (f.act === 'lean' && f.frame ? 1 : 0), 5, 5); // head
    g.fillStyle(f.col, 1).fillRect(-1, 1, 7, 6);
    if (f.act === 'water' && f.frame) g.fillStyle(0x88b8d8, 1).fillRect(7, 4, 3, 1);
    if (f.act === 'call' && f.frame) g.fillStyle(0x3a2a2a, 1).fillRect(6, -2, 2, 1);
  }
}
