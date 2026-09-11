import Phaser from 'phaser';
import { PLACES, EV } from '../data/evening/map.js';
import { lerpC } from './sky.js';

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
    for (let y = 0; y < H; y++) {
      ctx.fillStyle = hex(lerpC(0x9ab0c0, 0x3a5470, Math.min(1, y / 70)));
      ctx.fillRect(0, y, W, 1);
    }
    // long low swells
    for (let i = 0; i < 90; i++) {
      const y = Math.floor(4 + Math.pow(this.rand.frac(), 1.5) * (H - 10));
      const x = this.rand.between(0, W);
      const w = this.rand.between(6, 30);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x, y, w, 1);
      if (x + w > W) ctx.fillRect(x - W, y, w, 1);
    }
    ctx.fillStyle = '#f8e8c0';
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
    for (const L of layers) {
      for (let x = 0; x < W; x++) {
        const top = Math.round(L.base - 60 - ridge(x, W, L.seed, L.amps));
        ctx.fillStyle = hex(L.col);
        ctx.fillRect(x, top, 1, H - top);
        if (L.pines && x % 3 === 0 && this.rand.frac() < 0.5) {
          ctx.fillStyle = 'rgba(30,50,60,0.35)';
          const py = top + this.rand.between(26, 60);
          ctx.fillRect(x, py, 1, 3);
        }
        if (L.snow) {
          // the always-there caps, and a much bigger cap for when it snows
          const peak = 1 - (top - (L.base - 110)) / 110;
          if (peak > 0.55) {
            ctx.fillStyle = '#f2f4fa';
            ctx.fillRect(x, top, 1, Math.round((peak - 0.55) * 30));
          }
          sctx.fillStyle = '#f8faff';
          sctx.fillRect(x, top, 1, Math.max(3, Math.round(peak * 46)));
        }
      }
    }
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
    // the hill itself, behind the houses
    for (let x = 0; x < W; x++) {
      ctx.fillStyle = '#8a9a70';
      const top = Math.round(hill(x) - 30);
      ctx.fillRect(x, top, 1, H - top);
    }
    const drawHouse = (x0, w, h, wall, roof) => {
      for (const x of [x0, x0 - W]) {
        const base = Math.round(hill(Math.max(0, Math.min(W - 1, x0 + w / 2)))) + 60;
        const top = base - h;
        ctx.fillStyle = hex(wall);
        ctx.fillRect(x, top, w, H - top);
        ctx.fillStyle = hex(roof);
        for (let r = 0; r < 10; r++) ctx.fillRect(x - 2 + r, top - r, w + 4 - r * 2, 1);
        if (x === x0) {
          for (let wy = top + 8; wy < base - 8; wy += 14) {
            for (let wx = x + 5; wx < x + w - 7; wx += 11) {
              if (this.rand.frac() < 0.55) this.windows.push({ x: wx, y: wy, w: 4, h: 6 });
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
      const w = this.rand.between(18, 38);
      const h = this.rand.between(30, 70);
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
    ct.refresh();
    this.bands.town = this.band('ev-band-town', W, H, W / WRAP_PX, 0.3, this.depth + 2, this.horizonY + 70);
    // ten windows with someone in them doing something
    const picks = Phaser.Utils.Array.Shuffle([...this.windows]).slice(0, 10);
    const acts = ['cook', 'hug', 'read', 'dance', 'cook', 'read', 'dance', 'hug', 'read', 'cook'];
    picks.forEach((w, i) => (w.act = acts[i]));
  }

  // ---- band 1: near buildings, place by place ----------------------------------------
  makeNear() {
    const W = Math.round(WRAP_PX * 0.25);
    const H = 300;
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
    const facade = (x, w, h, wall, opts = {}) => {
      const top = H - h;
      rect(x, top, w, h, wall);
      rect(x, top, w, 3, lerpC(wall, 0xfff4e0, 0.35)); // lit cornice
      rect(x + w - 3, top, 3, h, lerpC(wall, 0x3a2a3a, 0.25)); // the shade side (sun is west)
      // cracked plaster
      if (this.rand.frac() < 0.5) rect(x + this.rand.between(4, w - 10), top + this.rand.between(10, 40), 1, 8, 'rgba(60,40,40,0.3)');
      const rows = Math.floor((h - 40) / 36);
      for (let r = 0; r < rows; r++) {
        const wy = top + 16 + r * 36;
        for (let wx = x + 8; wx < x + w - 16; wx += 22) {
          rect(wx, wy, 12, 18, 0x4a3a44);
          // shutters, some open
          if (this.rand.frac() < 0.6) {
            rect(wx - 5, wy, 4, 18, opts.shutter || 0x4a7a6a);
            rect(wx + 13, wy, 4, 18, opts.shutter || 0x4a7a6a);
          }
          // a balcony with someone on it
          if (opts.balconies && r < rows - 1 && this.rand.frac() < 0.3) {
            rect(wx - 4, wy + 18, 20, 2, 0x3a3a44);
            for (let b = 0; b < 5; b++) rect(wx - 4 + b * 5, wy + 20, 1, 6, 0x3a3a44);
            if (this.rand.frac() < 0.55) this.balconies.push({ x: wx + 4, y: wy + 12, washing: this.rand.frac() < 0.5 });
            // geraniums
            if (this.rand.frac() < 0.5) rect(wx - 3, wy + 16, 18, 2, 0xd84a4a);
          }
          // pigeons on the ledge
          if (this.rand.frac() < 0.12) rect(wx + 2, wy - 3, 3, 2, 0x8a8a98);
        }
      }
      // ivy up the west side
      if (opts.ivy) for (let i = 0; i < 40; i++) rect(x + this.rand.between(0, 8), top + this.rand.between(10, h - 4), 2, 2, i % 2 ? 0x5a8a4a : 0x4a7a3a);
      // a painted sign
      if (opts.sign) {
        rect(x + 10, H - 70, w - 20, 12, opts.sign);
        rect(x + 14, H - 66, w - 28, 2, 0xf2e6cc);
      }
      // an awning
      if (opts.awning) for (let a = 0; a < w - 10; a += 6) rect(x + 5 + a, H - 56, 6, 8, a % 12 ? 0xf2e6cc : opts.awning);
      return top;
    };
    const tree = (x, s = 1) => {
      rect(x - 2, H - 40 * s, 4, 40 * s, 0x4a3a2a);
      for (let i = 0; i < 30; i++) rect(x - 20 * s + this.rand.between(0, 40 * s), H - 40 * s - this.rand.between(0, 40 * s), 6 * s, 5 * s, i % 3 ? 0x5a8a4a : 0x4a7a3a);
    };
    const tops = [];
    const style = {
      arch: (x0, x1) => {
        rect(x0, H - 30, x1 - x0, 30, 0xc8b898);
        for (let x = x0; x < x1; x += 60) tree(x + 30, 1.1);
      },
      orchard: (x0, x1) => {
        for (let x = x0; x < x1; x += 46) tree(x + 20, 1.2);
        rect(x0, H - 14, x1 - x0, 14, 0x6a8a4a);
      },
      laundry: (x0, x1) => {
        let x = x0;
        while (x < x1) {
          const w = this.rand.between(56, 80);
          tops.push({ x, w, top: facade(x, w, this.rand.between(170, 230), [0xe8d0a8, 0xd8b890, 0xe0c0a0][this.rand.between(0, 2)], { balconies: true, shutter: 0x3a6a8a }) });
          x += w + 4;
        }
      },
      square: (x0, x1) => {
        let x = x0;
        const signs = [0x2e6a4a, 0x8a2c2c, 0x2e3a52, 0x6a4a2a];
        while (x < x1) {
          const w = this.rand.between(64, 90);
          tops.push({ x, w, top: facade(x, w, this.rand.between(200, 260), [0xf0d8b0, 0xe8c898, 0xd8b090, 0xe8d8c0][this.rand.between(0, 3)], { balconies: true, sign: signs[this.rand.between(0, 3)], awning: this.rand.frac() < 0.5 ? 0xc03a2a : 0x2e6a4a }) });
          x += w + 3;
        }
      },
      canal: (x0, x1) => {
        let x = x0;
        while (x < x1) {
          const w = this.rand.between(80, 110);
          const top = facade(x, w, this.rand.between(180, 220), [0xb86a4a, 0xa05a3a][this.rand.between(0, 1)], { shutter: 0x2e3a52 });
          rect(x + w / 2 - 12, H - 60, 24, 60, 0x3a2a22); // a loading door
          tops.push({ x, w, top });
          x += w + 6;
        }
      },
      steep: (x0, x1) => {
        let x = x0;
        let h = 160;
        while (x < x1) {
          const w = this.rand.between(40, 56);
          tops.push({ x, w, top: facade(x, w, h, [0xe8c8a0, 0xf0d8b8, 0xd8a888][this.rand.between(0, 2)], { balconies: true, ivy: this.rand.frac() < 0.4 }) });
          h = Math.min(270, h + 16);
          x += w + 2;
        }
      },
      rooftops: (x0, x1) => {
        for (let x = x0; x < x1; x += 40) {
          rect(x, H - 50, 36, 50, 0xb85a3a);
          rect(x + 24, H - 70, 6, 20, 0x8a4a3a);
        }
      },
      school: (x0, x1) => {
        tops.push({ x: x0 + 10, w: x1 - x0 - 20, top: facade(x0 + 10, x1 - x0 - 20, 190, 0xc8906a, { sign: 0x2e3a52, shutter: 0x5a7aa8 }) });
      },
      allotments: (x0, x1) => {
        for (let x = x0; x < x1; x += 70) {
          rect(x, H - 40, 50, 40, 0x7a6a4a);
          rect(x - 2, H - 44, 54, 4, 0x8a8a94);
        }
        for (let x = x0; x < x1; x += 90) tree(x + 60, 0.9);
      },
      hill: () => {},
      station: (x0, x1) => {
        rect(x0, H - 110, x1 - x0, 8, 0x4a4650);
        for (let x = x0; x < x1; x += 40) rect(x, H - 102, 4, 102, 0x4a4650);
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
      if (B.x - (A.x + A.w) > 40) continue;
      const y0 = A.top + 30;
      const y1 = B.top + 26;
      for (let t = 0; t <= 1; t += 0.02) {
        const x = A.x + A.w - 6 + (B.x + 6 - (A.x + A.w - 6)) * t;
        const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 10;
        rect(x, y, 1, 1, 'rgba(30,30,40,0.6)');
      }
    }
    ct.refresh();
    this.bands.near = this.band('ev-band-near', W, H, f, 0.55, this.depth + 3, this.horizonY + 92);
  }

  // ---- the road's own bands --------------------------------------------------------
  makeRoad() {
    const W = 2600;
    const H = 230;
    const ct = canvasTex(this.scene, 'ev-band-road', W, H);
    const ctx = ct.getContext();
    const hill = (x) => 120 - Math.sin(x / 230) * 20 - Math.sin(x / 90 + 1) * 8 - Math.max(0, (x - 1500) / 900) * 70;
    for (let x = 0; x < W; x++) {
      const top = Math.round(hill(x));
      let col = 0x8a9a60;
      if (x < 700) col = x % 36 < 18 ? 0xc8b060 : 0xb8a050; // fields in stripes
      else if (x < 1100) col = 0x6a8a5a;
      else if (x < 1700) col = 0x3e5a48;
      else col = 0x8a98a8;
      ctx.fillStyle = hex(col);
      ctx.fillRect(x, top, 1, H - top);
      if (x > 1700) {
        ctx.fillStyle = '#e8eef8';
        ctx.fillRect(x, top, 1, 4 + Math.round((x - 1700) / 60));
      }
    }
    // the lake, a silver sheet in the middle distance
    ctx.fillStyle = '#b8c8d8';
    ctx.fillRect(760, Math.round(hill(760)) + 20, 260, 10);
    ctx.fillStyle = '#d8e4f0';
    ctx.fillRect(780, Math.round(hill(760)) + 22, 200, 2);
    // pines, thicker as the road climbs
    for (let x = 900; x < W; x += this.rand.between(5, 14)) {
      const top = Math.round(hill(x)) + this.rand.between(-4, 10);
      const h = this.rand.between(14, 30);
      ctx.fillStyle = x > 1800 ? '#2e4a48' : '#2e4a38';
      for (let r = 0; r < h; r++) ctx.fillRect(x - Math.floor(r / 3), top - h + r, 1 + Math.floor(r / 3) * 2, 1);
      if (x > 1800) {
        ctx.fillStyle = '#e8eef8';
        ctx.fillRect(x - 1, top - h + 2, 3, 2);
      }
    }
    // orchards, a mill, a farmhouse with one lit window
    for (let x = 100; x < 700; x += 70) {
      ctx.fillStyle = '#5a7a4a';
      ctx.fillRect(x, Math.round(hill(x)) - 14, 16, 12);
    }
    ctx.fillStyle = '#c8b898';
    ctx.fillRect(1180, Math.round(hill(1180)) - 30, 20, 30);
    ctx.fillStyle = '#f2d580';
    ctx.fillRect(1186, Math.round(hill(1180)) - 20, 4, 5);
    ct.refresh();
    this.bands.road = this.band('ev-band-road', W, H, 0.2, 0.3, this.depth + 2.5, this.horizonY + 80);
    this.bands.road.ts.setAlpha(0);
  }

  // on the road, the town behind: a handful of orange dots, far below
  makeTownLights() {
    const s = this.scene;
    this.townDots = [];
    const rand = new Phaser.Math.RandomDataGenerator(['dots']);
    for (let i = 0; i < 26; i++) {
      const d = s.add.circle(0, 0, rand.frac() < 0.3 ? 1.5 : 1, 0xf2b060, 1).setScrollFactor(0).setDepth(this.depth + 2.6).setAlpha(0);
      d.ox = rand.between(-50, 50) + rand.between(-20, 20);
      d.oy = rand.between(-10, 8);
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
      const haze = name === 'sea' ? 0.35 : name === 'mtn' || name === 'mtnSnow' ? 0.5 : name === 'town' ? 0.25 : name === 'road' ? 0.2 : 0.08;
      b.ts.setTint(lerpC(ambient, horizonColour, haze));
    }
    this.bands.sea.ts.setAlpha(town * (1 - rain * 0.3));
    this.bands.town.ts.setAlpha(town);
    this.bands.near.ts.setAlpha(town);
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
