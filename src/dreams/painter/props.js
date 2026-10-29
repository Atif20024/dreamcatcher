// THE MASTER'S LADDER's props (FRAMEWORK §4.3): painted canvases at the scale
// system's 1 m = 44 px. Buildings are the building kit at s = 1 (a storey is
// 132 px, a door 2.2 m); the cypress is the tree kit's. Light comes from the
// west (top left), warm late-afternoon sun outside, north light and the
// hearth inside. No text on signs: a shop is known by its hanging emblem
// (a mortar, a brush and shell), as it was. Panels and plaster, not canvas;
// trestles and leaning panels, not studio easels.
//   { w, h, anchor: [ax, ay], paint(ctx, w, h, P), light?, live? }
import { mix, rgba, hex, stamp, gradientV, grain, dab } from '../../art/paint.js';
import { drawBuilding } from '../../art/buildingKit.js';
import { drawTree } from '../../art/treeKit.js';
import { paintAltarpiece, paintVault } from './works.js';

const K = 44; // px per metre on the play plane
const T = 32;
const NIGHT = 0x14122a;
const WARM = 0xffc870;
const STONE = 0xd8ccb0; // pietra: the grey-gold sandstone of the city
const STONE_DK = 0x9a8e78;
const OCHRE = 0xd8a868;
const SIENNA = 0xb8703e;
const COTTO = 0xb85a34; // terracotta
const WOOD = 0x6a4a2e;
const WOOD_DK = 0x3e2a1c;
const LAPIS = 0x22408a;
const GOLD = 0xd8a840;

function rand(seed) {
  let s = (seed * 7919 + 17) % 233280;
  const r = {
    frac() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    },
    between: (a, b) => Math.floor(a + r.frac() * (b - a + 1)),
    realInRange: (a, b) => a + r.frac() * (b - a),
  };
  return r;
}

// a lit rectangle: west edge and top lit, east edge and bottom in shade
function box(ctx, x, y, w, h, col, lit = 0.2, dark = 0.3) {
  ctx.fillStyle = hex(col);
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.fillStyle = rgba(0xfff4dc, lit);
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), 1);
  ctx.fillRect(Math.round(x), Math.round(y), 1, Math.round(h));
  ctx.fillStyle = rgba(NIGHT, dark);
  ctx.fillRect(Math.round(x + w - 1), Math.round(y), 1, Math.round(h));
  ctx.fillRect(Math.round(x), Math.round(y + h - 1), Math.round(w), 1);
}

function glow(ctx, x, y, r, col, a = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// a round arch opening (x, y = top-left of the springing box)
function archPath(ctx, x, y, w, h) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

// voussoirs round an arch: alternating stones, the keystone lit
function voussoirs(ctx, x, y, w, depth, col) {
  const r = w / 2;
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + (i / n) * Math.PI;
    const a1 = Math.PI + ((i + 1) / n) * Math.PI;
    ctx.fillStyle = hex(i % 2 ? col : mix(col, 0xfff4dc, 0.18));
    ctx.beginPath();
    ctx.arc(x + r, y + r, r + depth, a0, a1);
    ctx.arc(x + r, y + r, r, a1, a0, true);
    ctx.closePath();
    ctx.fill();
  }
}

// a building on the play plane (the kit at s = 1): its foot on the canvas's bottom
function building(ctx, w, h, opts, seed) {
  drawBuilding(ctx, 0, h, { s: 1, w, quoins: true, lit: 0.08, flowers: true, shutterOdds: 0.85, ...opts }, rand(seed));
}

// a hanging iron sign with an emblem (no letters: a shop is known by its sign)
function hangingSign(ctx, x, y, emblem) {
  ctx.fillStyle = hex(0x2a2226);
  ctx.fillRect(x - 2, y - 8, 46, 3);
  ctx.beginPath();
  ctx.moveTo(x + 40, y - 8);
  ctx.quadraticCurveTo(x + 46, y - 18, x + 30, y - 22);
  ctx.lineWidth = 2;
  ctx.strokeStyle = hex(0x2a2226);
  ctx.stroke();
  ctx.fillRect(x + 8, y - 5, 1, 6);
  ctx.fillRect(x + 32, y - 5, 1, 6);
  box(ctx, x + 2, y, 38, 34, 0x4a3424, 0.25, 0.35);
  box(ctx, x + 5, y + 3, 32, 28, 0xe8d8b0, 0.2, 0.2);
  emblem(ctx, x + 21, y + 17);
}
const EMBLEMS = {
  // the bottega: a brush crossed over a shell of colour
  brush(ctx, cx, cy) {
    ctx.fillStyle = hex(LAPIS);
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy + 3, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hex(WOOD_DK);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 10);
    ctx.lineTo(cx + 10, cy - 10);
    ctx.stroke();
    ctx.fillStyle = hex(GOLD);
    ctx.fillRect(cx + 8, cy - 12, 4, 4);
  },
  // the colour-seller: a mortar and pestle
  mortar(ctx, cx, cy) {
    ctx.fillStyle = hex(0x8a7a6a);
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 2);
    ctx.lineTo(cx + 10, cy - 2);
    ctx.lineTo(cx + 6, cy + 10);
    ctx.lineTo(cx - 6, cy + 10);
    ctx.fill();
    ctx.fillStyle = hex(LAPIS);
    ctx.fillRect(cx - 9, cy - 4, 18, 3);
    ctx.strokeStyle = hex(WOOD_DK);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 2);
    ctx.lineTo(cx + 9, cy - 12);
    ctx.stroke();
  },
  // the rival workshop: a gilded star
  star(ctx, cx, cy) {
    ctx.fillStyle = hex(0x2e5a3a);
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(GOLD);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 3.5 : 8;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.fill();
  },
};

// a workshop front: two storeys over a wide arched shop mouth with its
// shutters folded open, a counter, a pentice; the emblem sign hangs out
function shopFront(ctx, w, h, o, seed) {
  building(ctx, w, h, { storeys: 2, ground: 'plain', bays: 3, wall: o.wall, roof: 'pitched', roofCol: COTTO, shutter: o.shutter, doorBay: -1 }, seed);
  const aw = 3.2 * K;
  const ah = 3.3 * K;
  const ax = (w - aw) / 2 - 20;
  const ay = h - ah;
  // the stone surround, the dark mouth, the warm room beyond
  voussoirs(ctx, ax, ay, aw, 10, mix(o.wall, STONE, 0.6));
  archPath(ctx, ax, ay, aw, ah);
  ctx.fillStyle = hex(0x2a1e1c);
  ctx.fill();
  ctx.save();
  archPath(ctx, ax, ay, aw, ah);
  ctx.clip();
  gradientV(ctx, ax, ay, aw, ah, [[0, 0x3a2a22, 1], [1, 0x6a4a32, 1]]);
  glow(ctx, ax + aw * 0.6, ay + ah * 0.6, aw * 0.6, WARM, 0.35);
  if (o.inside) o.inside(ctx, ax, ay, aw, ah);
  ctx.restore();
  // the counter across the lower mouth, the shutters folded back
  box(ctx, ax - 4, h - 0.95 * K, aw + 8, 0.95 * K, WOOD, 0.25, 0.35);
  box(ctx, ax - 4, h - 0.95 * K, aw + 8, 6, mix(WOOD, 0xfff4dc, 0.2));
  box(ctx, ax - 26, ay + aw * 0.5, 18, ah - aw * 0.5 - 0.95 * K, o.shutter, 0.2, 0.35);
  box(ctx, ax + aw + 8, ay + aw * 0.5, 18, ah - aw * 0.5 - 0.95 * K, o.shutter, 0.2, 0.35);
  // the door beside it
  const dx = ax + aw + 40;
  box(ctx, dx - 6, h - 2.3 * K - 6, 1.05 * K + 12, 2.3 * K + 6, mix(o.wall, STONE, 0.5));
  box(ctx, dx, h - 2.2 * K, 1.05 * K, 2.2 * K, o.door || WOOD_DK, 0.15, 0.4);
  for (let y = h - 2.1 * K; y < h - 8; y += 18) ctx.fillRect(dx + 4, y, 1.05 * K - 8, 1);
  stamp(ctx, dx + 1.05 * K - 9, h - 1.1 * K, 2, GOLD, 1, 0.3);
  if (o.emblem) hangingSign(ctx, ax + aw + 4, ay - 46, EMBLEMS[o.emblem]);
}

// ---- via dei pittori ----------------------------------------------------------
const bottega_front = {
  // Maestro Gualtiero's workshop: ochre, green shutters, the brush-and-shell sign
  w: 420, h: 580, anchor: [0.5, 1],
  paint(ctx, w, h) {
    shopFront(ctx, w, h, {
      wall: OCHRE, shutter: 0x4a6a4a, emblem: 'brush',
      inside(c, x, y, aw, ah) {
        // panels leaning in the gloom, gold catching the light
        box(c, x + 12, y + ah * 0.35, 30, 70, 0xe8dcc0, 0.2, 0.3);
        box(c, x + 46, y + ah * 0.42, 26, 60, GOLD, 0.3, 0.3);
        box(c, x + aw - 50, y + ah * 0.3, 34, 80, 0xe0d0b0, 0.2, 0.3);
      },
    }, 3);
    grain(ctx, 0, 0, w, h, 0.04, 3);
  },
};

const dori_front = {
  // the rival's workshop: grander, green and gold, the star over the door
  w: 460, h: 600, anchor: [0.5, 1],
  paint(ctx, w, h) {
    shopFront(ctx, w, h, {
      wall: 0xe0c898, shutter: 0x2e5a3a, door: 0x2a3a2a, emblem: 'star',
      inside(c, x, y, aw, ah) {
        for (let i = 0; i < 3; i++) box(c, x + 14 + i * 34, y + ah * 0.3 + i * 6, 28, 76, i === 1 ? GOLD : 0xe8dcc0, 0.2, 0.3);
      },
    }, 9);
    grain(ctx, 0, 0, w, h, 0.04, 9);
  },
};

const speziale_front = {
  // the colour-seller's: jars in the shop mouth, the mortar sign
  w: 420, h: 560, anchor: [0.5, 1],
  paint(ctx, w, h) {
    shopFront(ctx, w, h, {
      wall: 0xc89a78, shutter: 0x6a3a3a, emblem: 'mortar',
      inside(c, x, y, aw) {
        for (let r = 0; r < 3; r++) {
          box(c, x + 6, y + 50 + r * 34, aw - 12, 4, WOOD_DK, 0.2, 0.3);
          for (let j = 0; j < 6; j++) {
            const col = [LAPIS, 0xc83a2a, 0xe8c040, 0x3a7a5a, 0xe8e0d0, 0x8a5a3a][(j + r * 2) % 6];
            box(c, x + 12 + j * ((aw - 24) / 6), y + 50 + r * 34 - 18, 12, 18, col, 0.3, 0.3);
          }
        }
      },
    }, 7);
    grain(ctx, 0, 0, w, h, 0.04, 7);
  },
};

const via_house = {
  w: 330, h: 560, anchor: [0.5, 1],
  paint(ctx, w, h, P) {
    building(ctx, w, h, { storeys: 2, ground: 'house', bays: 3, wall: P.wall ?? 0xe0c090, roof: 'pitched', roofCol: COTTO, shutter: P.shutter ?? 0x6a5a3a }, P.seed ?? 21);
    grain(ctx, 0, 0, w, h, 0.04, 21);
  },
};

const pentice = {
  // a wooden lean-to roof over a shop mouth (a ledge: Jo can stand on it)
  w: 7 * T, h: 1.2 * K, anchor: [0, 1],
  paint(ctx, w, h) {
    for (let x = 0; x < w; x += 12) box(ctx, x, 0, 12, 10, x % 24 ? COTTO : mix(COTTO, 0xfff0d0, 0.15), 0.25, 0.3);
    box(ctx, 0, 10, w, 4, WOOD_DK);
    for (const bx of [10, w - 16]) {
      ctx.strokeStyle = hex(WOOD_DK);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bx, 12);
      ctx.lineTo(bx + 6, h);
      ctx.stroke();
    }
    gradientV(ctx, 0, 14, w, 20, [[0, NIGHT, 0.25], [1, NIGHT, 0]]);
  },
};

const washing_line = {
  // linen on a line between upper windows (decor, high on the back layer)
  w: 10 * T, h: 70, anchor: [0, 0],
  paint(ctx, w, h) {
    ctx.strokeStyle = hex(0x5a4a3a);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.quadraticCurveTo(w / 2, 22, w, 6);
    ctx.stroke();
    const r = rand(4);
    for (let x = 22; x < w - 20; x += r.between(30, 50)) {
      const y = 6 + 16 * (1 - ((2 * x) / w - 1) ** 2);
      const cw = r.between(16, 30);
      const ch = r.between(20, 40);
      const col = [0xf0e8d8, 0xd8c8a8, 0xb84a3a, 0x8aa0c0, 0xe8d8a0][r.between(0, 4)];
      box(ctx, x, y, cw, ch, col, 0.3, 0.25);
      ctx.fillStyle = rgba(NIGHT, 0.12);
      ctx.fillRect(x + cw * 0.6, y, 2, ch);
    }
  },
};

const city_arch = {
  // the gate between the street and the square (the seam's physical arch):
  // a 7 m stone arch in a wall with a battlemented top, the square bright beyond
  w: 5 * T, h: 8.5 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 30, w, h - 30, STONE, 0.25, 0.3);
    for (let y = 40; y < h; y += 22) for (let x = (y / 22) % 2 ? 0 : 20; x < w; x += 40) ctx.fillRect(x, y, 1, 22);
    ctx.fillStyle = rgba(NIGHT, 0.12);
    for (let y = 40; y < h; y += 22) ctx.fillRect(0, y, w, 1);
    for (let x = 0; x < w; x += 32) box(ctx, x, 6, 20, 26, STONE, 0.25, 0.3);
    const aw = w - 44;
    const ah = h - 90;
    voussoirs(ctx, 22, h - ah, aw, 12, mix(STONE, 0xfff4dc, 0.1));
    archPath(ctx, 22, h - ah, aw, ah);
    const g = ctx.createLinearGradient(0, h - ah, 0, h);
    g.addColorStop(0, hex(0xf2e0b0));
    g.addColorStop(1, hex(0xe8c890));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    archPath(ctx, 22, h - ah, aw, ah);
    ctx.clip();
    gradientV(ctx, 22, h - ah, aw, 40, [[0, NIGHT, 0.5], [1, NIGHT, 0]]);
    ctx.restore();
    grain(ctx, 0, 0, w, h, 0.05, 13);
  },
};

const well = {
  // a stone well-head with an iron hoop and a pulley
  w: 1.6 * K, h: 2.6 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 4, h - 0.9 * K, w - 8, 0.9 * K, STONE, 0.25, 0.35);
    box(ctx, 0, h - 0.9 * K, w, 6, mix(STONE, 0xfff4dc, 0.2));
    ctx.strokeStyle = hex(0x2a2226);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, h - 0.9 * K);
    ctx.lineTo(8, 14);
    ctx.quadraticCurveTo(w / 2, -4, w - 8, 14);
    ctx.lineTo(w - 8, h - 0.9 * K);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, 18, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 + 6, 18);
    ctx.lineTo(w / 2 + 6, h - 1.4 * K);
    ctx.stroke();
    box(ctx, w / 2, h - 1.4 * K, 12, 14, WOOD, 0.25, 0.35);
  },
};

const barrel_stack = {
  // wine and lime barrels stacked two high against a wall (a ledge: its
  // top is the grid's one-way, 3 tiles across, 3 up)
  w: 3 * T, h: 3 * T, anchor: [0, 1],
  paint(ctx, w, h) {
    const barrel = (x, y, bw, bh) => {
      const g = ctx.createLinearGradient(x, 0, x + bw, 0);
      g.addColorStop(0, hex(0x8a6038));
      g.addColorStop(0.35, hex(0xa87a4a));
      g.addColorStop(1, hex(0x4a3020));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x + bw / 2, y + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hex(0x3a3034);
      for (const k of [0.22, 0.5, 0.78]) ctx.fillRect(x + 2, y + bh * k - 1, bw - 4, 2);
    };
    barrel(2, h - 46, 44, 46);
    barrel(48, h - 46, 44, 46);
    barrel(22, h - 94, 46, 48);
    box(ctx, 0, 0, w, 4, WOOD, 0.3, 0.3);
  },
};

const handcart = {
  // a handcart of sacks and a pail of lime
  w: 2.0 * K, h: 1.3 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 4, h - 30, w - 20, 10, WOOD, 0.25, 0.35);
    ctx.strokeStyle = hex(WOOD_DK);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w - 18, h - 26);
    ctx.lineTo(w, h - 44);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(26, h - 14, 13, 0, Math.PI * 2);
    ctx.stroke();
    for (let a = 0; a < 6; a++) {
      ctx.beginPath();
      ctx.moveTo(26, h - 14);
      ctx.lineTo(26 + Math.cos(a) * 12, h - 14 + Math.sin(a) * 12);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) dab(ctx, 16 + i * 18, h - 38, 11, 9, 0, [0xd8c8a0, 0xc8b890, 0xe0d0a8][i], 1, 0.15);
    box(ctx, 64, h - 50, 14, 20, 0xe8e4d8, 0.3, 0.3);
  },
};

const cypress = {
  // a cypress at the end of the street: 13 m, the tree kit's dark flame
  w: 140, h: 13.4 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    drawTree(ctx, w / 2, h, 'cypress', 1, rand(5), { m: 13 });
  },
};

// ---- the square -----------------------------------------------------------------
const guild_front = {
  // the guild hall: dressed stone, a row of painted arms of the arts, a
  // battlemented top, a round-arched door up three steps
  w: 15 * T, h: 13 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    gradientV(ctx, 0, 40, w, h - 40, [[0, mix(STONE, 0xfff4dc, 0.1), 1], [1, STONE, 1]]);
    ctx.fillStyle = rgba(NIGHT, 0.1);
    for (let y = 60; y < h; y += 24) {
      ctx.fillRect(0, y, w, 1);
      for (let x = (y / 24) % 2 ? 0 : 28; x < w; x += 56) ctx.fillRect(x, y, 1, 24);
    }
    ctx.fillStyle = rgba(0xfff4dc, 0.25);
    ctx.fillRect(0, 40, 3, h - 40);
    ctx.fillStyle = rgba(NIGHT, 0.2);
    ctx.fillRect(w - 6, 40, 6, h - 40);
    for (let x = 4; x < w; x += 34) box(ctx, x, 10, 22, 32, STONE, 0.25, 0.3);
    box(ctx, -2, 40, w + 4, 10, STONE_DK, 0.2, 0.3);
    // the arms of the arts: shields in a row under the cornice
    const arms = [[0xc83a2a, GOLD], [LAPIS, 0xf0e8d8], [0x2e6a4a, GOLD], [0xf0e8d8, 0xc83a2a], [GOLD, LAPIS], [0x8a2a5a, 0xf0e8d8]];
    arms.forEach(([a, b], i) => {
      const sx = 40 + i * ((w - 80) / 5) - 14;
      ctx.fillStyle = hex(a);
      ctx.beginPath();
      ctx.moveTo(sx, 70);
      ctx.lineTo(sx + 28, 70);
      ctx.lineTo(sx + 28, 90);
      ctx.quadraticCurveTo(sx + 14, 110, sx, 90);
      ctx.fill();
      ctx.fillStyle = hex(b);
      ctx.fillRect(sx + 11, 74, 6, 22);
      ctx.fillRect(sx + 5, 80, 18, 5);
    });
    // mullioned windows, two lights under a round head
    for (const wx of [60, w - 120]) {
      for (const k of [0, 1]) {
        archPath(ctx, wx + k * 32, 150, 26, 80);
        ctx.fillStyle = hex(0x2a2a3a);
        ctx.fill();
        ctx.fillStyle = rgba(0xd8e0e8, 0.2);
        ctx.fillRect(wx + k * 32 + 4, 168, 8, 22);
      }
      box(ctx, wx - 6, 230, 70, 6, mix(STONE, 0xfff4dc, 0.2));
    }
    // the door: a round arch over oak leaves studded with iron
    const dw = 1.8 * K;
    const dh = 3.6 * K;
    const dx = (w - dw) / 2;
    voussoirs(ctx, dx, h - dh - 14, dw, 14, mix(STONE, 0xfff4dc, 0.08));
    archPath(ctx, dx, h - dh - 14, dw, dh);
    ctx.fillStyle = hex(0x4a3020);
    ctx.fill();
    ctx.fillStyle = rgba(NIGHT, 0.4);
    ctx.fillRect(dx + dw / 2 - 1, h - dh + dw / 2, 2, dh - dw / 2 - 14);
    for (let y = h - dh + dw / 2; y < h - 20; y += 16) for (let x = dx + 8; x < dx + dw - 6; x += 14) stamp(ctx, x, y, 1.4, 0x1a1418, 0.8, 0.2);
    for (let s = 0; s < 3; s++) box(ctx, dx - 20 - s * 8, h - 14 + s * 0 - (2 - s) * 5, dw + 40 + s * 16, 5, mix(STONE, 0xfff4dc, 0.1 + s * 0.05));
    grain(ctx, 0, 0, w, h, 0.05, 17);
  },
};

const loggia = {
  // a free-standing loggia: three round arches on columns, a tiled roof Jo
  // can stand on (the grid's one-way at the roof line), its vault in shade
  w: 12 * T, h: 7.4 * T, anchor: [0, 1],
  paint(ctx, w, h) {
    const top = 18;
    const col = 16;
    const spring = h - 4.2 * K;
    box(ctx, 0, top, w, spring - top + 40, mix(STONE, 0xfff4dc, 0.05), 0.25, 0.3);
    gradientV(ctx, col, spring - 60, w - 2 * col, h - spring + 60, [[0, NIGHT, 0.45], [1, NIGHT, 0.2]]);
    const bays = 3;
    const bw = (w - col) / bays;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let b = 0; b < bays; b++) {
      archPath(ctx, col + b * bw, spring - (bw - col) / 2, bw - col, h - spring + (bw - col) / 2);
      ctx.fill();
    }
    ctx.restore();
    // the vault behind the arches: warm plaster in shade, a painted roundel
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    gradientV(ctx, 0, top, w, h - top, [[0, 0x8a7458, 1], [1, 0x5a4a3a, 1]]);
    ctx.restore();
    for (let b = 0; b <= bays; b++) {
      const cx = col / 2 + b * bw;
      box(ctx, cx - col / 2, spring - 4, col, h - spring + 4, 0xece2c8, 0.3, 0.3);
      box(ctx, cx - col / 2 - 3, spring - 10, col + 6, 8, mix(STONE, 0xfff4dc, 0.25));
      box(ctx, cx - col / 2 - 2, h - 8, col + 4, 8, STONE_DK);
    }
    for (let b = 0; b < bays; b++) voussoirs(ctx, col + b * bw, spring - (bw - col) / 2, bw - col, 7, mix(STONE, 0xfff4dc, 0.15));
    // the roof: a low pitch of terracotta tiles
    for (let x = -6; x < w + 6; x += 10) box(ctx, x, 0, 10, top + 2, x % 20 ? COTTO : mix(COTTO, 0xfff0d0, 0.15), 0.25, 0.25);
    box(ctx, -6, top, w + 12, 6, STONE_DK);
    grain(ctx, 0, 0, w, h, 0.05, 23);
  },
};

const market_stall = {
  // a market stall: trestle, an awning (a ledge to stand on), onions,
  // cabbages, loaves, straw flasks of wine
  w: 4 * T, h: 3 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    for (let x = 0; x < w; x += 14) box(ctx, x, 0, 14, 16, (x / 14) % 2 ? 0xe8dcc0 : 0xa8443a, 0.25, 0.25);
    gradientV(ctx, 0, 16, w, 18, [[0, NIGHT, 0.3], [1, NIGHT, 0]]);
    for (const px of [6, w - 10]) box(ctx, px, 14, 4, h - 14, WOOD_DK);
    box(ctx, 0, h - 0.95 * K, w, 8, WOOD, 0.3, 0.35);
    box(ctx, 6, h - 0.95 * K + 8, w - 12, 0.95 * K - 8, mix(WOOD, NIGHT, 0.3));
    const r = rand(8);
    for (let i = 0; i < 9; i++) {
      const x = 12 + i * ((w - 24) / 8);
      const kind = i % 3;
      if (kind === 0) dab(ctx, x, h - 0.95 * K - 6, 6, 5, 0, 0xd8a868, 1, 0.2);
      else if (kind === 1) dab(ctx, x, h - 0.95 * K - 7, 7, 6, 0, 0x6a9a4a, 1, 0.2);
      else dab(ctx, x, h - 0.95 * K - 6, 9, 5, r.frac(), 0xc89058, 1, 0.2);
    }
    box(ctx, w - 30, h - 0.95 * K - 26, 10, 20, 0xc8a860, 0.3, 0.3);
    box(ctx, w - 27, h - 0.95 * K - 34, 4, 9, 0x5a7a4a);
  },
};

const fountain = {
  // the square's fountain: an octagonal basin, a column, a bronze boy with a dolphin
  w: 5 * T, h: 4.4 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const bh = 0.85 * K;
    box(ctx, 0, h - bh, w, bh, STONE, 0.25, 0.35);
    for (const x of [w * 0.25, w * 0.5, w * 0.75]) ctx.fillRect(x, h - bh, 1, bh);
    box(ctx, -2, h - bh, w + 4, 6, mix(STONE, 0xfff4dc, 0.25));
    gradientV(ctx, 4, h - bh + 6, w - 8, 10, [[0, 0x6a9ab8, 0.9], [1, 0x4a7a98, 0.6]]);
    box(ctx, w / 2 - 8, h - bh - 1.8 * K, 16, 1.8 * K, mix(STONE, 0xfff4dc, 0.1), 0.3, 0.3);
    box(ctx, w / 2 - 22, h - bh - 1.8 * K - 8, 44, 8, STONE);
    // the bronze figure, green with age, lit on the west
    const fx = w / 2;
    const fy = h - bh - 1.8 * K - 8;
    ctx.fillStyle = hex(0x4a6a5a);
    ctx.fillRect(fx - 4, fy - 34, 8, 24);
    ctx.fillRect(fx - 6, fy - 10, 4, 10);
    ctx.fillRect(fx + 2, fy - 10, 4, 10);
    ctx.beginPath();
    ctx.arc(fx, fy - 40, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(fx + 4, fy - 30, 14, 5);
    ctx.fillStyle = rgba(0xd8f0e0, 0.35);
    ctx.fillRect(fx - 4, fy - 34, 2, 24);
    // water from the dolphin's mouth
    ctx.strokeStyle = rgba(0xc8e4f0, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx + 18, fy - 28);
    ctx.quadraticCurveTo(fx + 40, fy - 30, fx + 46, h - bh + 6);
    ctx.stroke();
  },
};

const torso_plinth = {
  // an antique marble torso dug up from the old forum (a study for [Q])
  w: 1.2 * K, h: 2.2 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 6, h - 1.0 * K, w - 12, 1.0 * K, STONE_DK, 0.25, 0.35);
    const mx = w / 2;
    const top = h - 1.0 * K;
    ctx.fillStyle = hex(0xece6d8);
    ctx.beginPath();
    ctx.moveTo(mx - 14, top);
    ctx.lineTo(mx - 16, top - 26);
    ctx.quadraticCurveTo(mx - 20, top - 46, mx - 10, top - 50);
    ctx.lineTo(mx + 12, top - 48);
    ctx.quadraticCurveTo(mx + 18, top - 40, mx + 14, top - 22);
    ctx.lineTo(mx + 12, top);
    ctx.fill();
    ctx.fillStyle = rgba(0x8a8070, 0.45);
    ctx.fillRect(mx + 4, top - 46, 8, 44);
    ctx.fillStyle = rgba(0x8a8070, 0.3);
    ctx.fillRect(mx - 8, top - 30, 12, 1);
    ctx.fillRect(mx - 6, top - 20, 10, 1);
  },
};

const palazzo_front = {
  // Palazzo Bardelli: rusticated stone below, smoother above, paired round
  // windows, a deep cornice, the family arms, iron rings for torches
  w: 14 * T, h: 13.5 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const r = rand(31);
    const g1 = h - 5 * K;
    // the ground storey: rough blocks, each with its own lit edge
    for (let y = g1; y < h; y += 26)
      for (let x = (y / 26) % 2 ? -20 : 0; x < w; x += 54) {
        const c = mix(0xa8987a, 0xc8b898, r.frac() * 0.6);
        box(ctx, x + 1, y + 1, 52, 24, c, 0.35, 0.4);
        stamp(ctx, x + 16 + r.frac() * 20, y + 12, 6, mix(c, NIGHT, 0.2), 0.25, 0.8);
      }
    gradientV(ctx, 0, 30, w, g1 - 30, [[0, 0xe0d4b8, 1], [1, 0xd0c4a4, 1]]);
    ctx.fillStyle = rgba(NIGHT, 0.08);
    for (let y = 40; y < g1; y += 20) ctx.fillRect(0, y, w, 1);
    box(ctx, 0, g1 - 10, w, 10, mix(STONE, 0xfff4dc, 0.25));
    // paired windows on the piano nobile
    for (let i = 0; i < 4; i++) {
      const wx = 30 + i * ((w - 60) / 3) - 26;
      for (const k of [0, 1]) {
        archPath(ctx, wx + k * 28, g1 - 160, 22, 92);
        ctx.fillStyle = hex(0x2a2a3a);
        ctx.fill();
        ctx.fillStyle = rgba(0xf2d8a0, 0.18);
        for (let gy = g1 - 140; gy < g1 - 72; gy += 8) for (let gx = wx + k * 28 + 4; gx < wx + k * 28 + 20; gx += 8) stamp(ctx, gx, gy, 2.4, 0xe8e0c8, 0.25, 0.4);
      }
      voussoirs(ctx, wx - 4, g1 - 164, 58, 6, mix(STONE, 0xfff4dc, 0.15));
      box(ctx, wx - 6, g1 - 66, 62, 6, mix(STONE, 0xfff4dc, 0.2));
    }
    // the cornice, deep, throwing its shadow
    box(ctx, -6, 18, w + 12, 16, mix(STONE, 0xfff4dc, 0.2));
    gradientV(ctx, 0, 34, w, 22, [[0, NIGHT, 0.35], [1, NIGHT, 0]]);
    // the portal: a tall arch, oak leaves, the arms above it
    const dw = 2.0 * K;
    const dh = 4.0 * K;
    const dx = (w - dw) / 2;
    voussoirs(ctx, dx, h - dh, dw, 18, 0xb0a080);
    archPath(ctx, dx, h - dh, dw, dh);
    ctx.fillStyle = hex(0x3e2818);
    ctx.fill();
    ctx.fillStyle = rgba(NIGHT, 0.4);
    ctx.fillRect(w / 2 - 1, h - dh + dw / 2, 2, dh - dw / 2);
    ctx.fillStyle = hex(LAPIS);
    ctx.beginPath();
    ctx.moveTo(w / 2 - 18, h - dh - 60);
    ctx.lineTo(w / 2 + 18, h - dh - 60);
    ctx.lineTo(w / 2 + 18, h - dh - 36);
    ctx.quadraticCurveTo(w / 2, h - dh - 18, w / 2 - 18, h - dh - 36);
    ctx.fill();
    for (let i = 0; i < 3; i++) stamp(ctx, w / 2 - 9 + i * 9, h - dh - 46, 3, GOLD, 1, 0.2);
    for (const rx of [dx - 40, dx + dw + 30]) {
      ctx.strokeStyle = hex(0x2a2226);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rx + 5, h - 2.4 * K, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    grain(ctx, 0, 0, w, h, 0.05, 31);
  },
};

const church_front = {
  // the church of the new chapel: a marble front inlaid white and green,
  // a round window, a portal with a painted lunette, three steps
  w: 17 * T, h: 15 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const white = 0xf0eadc;
    const green = 0x4a6a5a;
    const top = 60;
    ctx.fillStyle = hex(white);
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, top + 160);
    ctx.lineTo(w * 0.22, top + 160);
    ctx.lineTo(w * 0.22, top + 40);
    ctx.lineTo(w / 2, top - 40);
    ctx.lineTo(w * 0.78, top + 40);
    ctx.lineTo(w * 0.78, top + 160);
    ctx.lineTo(w, top + 160);
    ctx.lineTo(w, h);
    ctx.fill();
    ctx.fillStyle = hex(green);
    for (let x = 0; x <= w; x += w / 8) ctx.fillRect(x - 3, top + 160, 6, h - top - 160);
    for (let y = top + 200; y < h - 40; y += 90) ctx.fillRect(0, y, w, 4);
    for (const x of [w * 0.22, w * 0.78]) ctx.fillRect(x - 3, top + 40, 6, 120);
    // square panels with inlaid circles (green on white)
    for (let i = 0; i < 8; i++) {
      const px = i * (w / 8) + w / 16;
      ctx.strokeStyle = hex(green);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, top + 250, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    // the round window: tracery spokes, roundel glass
    const rx = w / 2;
    const ry = top + 90;
    ctx.fillStyle = hex(green);
    ctx.beginPath();
    ctx.arc(rx, ry, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0x2a3a5a);
    ctx.beginPath();
    ctx.arc(rx, ry, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hex(white);
    ctx.lineWidth = 3;
    for (let a = 0; a < 12; a++) {
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos((a * Math.PI) / 6) * 44, ry + Math.sin((a * Math.PI) / 6) * 44);
      ctx.stroke();
    }
    for (let a = 0; a < 12; a++) stamp(ctx, rx + Math.cos((a * Math.PI) / 6 + 0.26) * 30, ry + Math.sin((a * Math.PI) / 6 + 0.26) * 30, 5, [0xc83a2a, LAPIS, GOLD][a % 3], 0.6, 0.3);
    // the portal and its lunette (a painted figure in a blue mantle)
    const dw = 2.2 * K;
    const dh = 4.4 * K;
    const dx = (w - dw) / 2;
    voussoirs(ctx, dx, h - dh - 20, dw, 16, white);
    archPath(ctx, dx, h - dh - 20, dw, dh);
    ctx.fillStyle = hex(0x3a2a1c);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(dx + dw / 2, h - dh - 20 + dw / 2, dw / 2 - 2, Math.PI, 0);
    ctx.clip();
    gradientV(ctx, dx, h - dh - 20, dw, dw / 2, [[0, GOLD, 1], [1, 0xb8883a, 1]]);
    ctx.fillStyle = hex(LAPIS);
    ctx.beginPath();
    ctx.moveTo(dx + dw / 2, h - dh - 20 + 12);
    ctx.lineTo(dx + dw / 2 + 18, h - dh - 20 + dw / 2);
    ctx.lineTo(dx + dw / 2 - 18, h - dh - 20 + dw / 2);
    ctx.fill();
    stamp(ctx, dx + dw / 2, h - dh - 20 + 14, 6, 0xe8c8a8, 1, 0.2);
    ctx.restore();
    ctx.fillStyle = hex(white);
    ctx.fillRect(dx, h - dh - 20 + dw / 2, dw, 5);
    for (let s = 0; s < 3; s++) box(ctx, dx - 30 - s * 12, h - 18 + s * 6, dw + 60 + s * 24, 6, mix(white, STONE, 0.4));
    ctx.fillStyle = rgba(0xfff4dc, 0.25);
    ctx.fillRect(0, top + 160, 4, h);
    grain(ctx, 0, 0, w, h, 0.05, 41);
  },
};

const torch_ring = {
  // an iron ring and a lit torch on a wall (evening: the contest ends at dusk)
  w: 30, h: 70, anchor: [0.5, 0.5], light: { x: 15, y: 10, r: 120, color: WARM },
  paint(ctx, w, h) {
    ctx.fillStyle = hex(0x2a2226);
    ctx.fillRect(12, 20, 6, 40);
    ctx.fillRect(8, 56, 14, 4);
    dab(ctx, 15, 14, 7, 12, 0, 0xf2a040, 1, 0.3);
    dab(ctx, 15, 12, 4, 7, 0, 0xfff0b0, 1, 0.3);
  },
};

// ---- interiors: the bottega ------------------------------------------------------
const north_window = {
  // a tall window of roundel glass: the cool even light painters wanted
  w: 2.0 * K, h: 3.0 * K, anchor: [0.5, 0.5], light: { x: 44, y: 66, r: 200, color: 0xe8f0ff },
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, 0x8a7458, 0.25, 0.35);
    archPath(ctx, 8, 8, w - 16, h - 16);
    ctx.fillStyle = hex(0xb8c8d8);
    ctx.fill();
    ctx.save();
    archPath(ctx, 8, 8, w - 16, h - 16);
    ctx.clip();
    for (let y = 14; y < h; y += 13) for (let x = 14 + ((y / 13) % 2) * 6; x < w - 8; x += 12) {
      stamp(ctx, x, y, 5.5, 0xe8f0f8, 0.55, 0.5);
      ctx.strokeStyle = rgba(0x5a5a6a, 0.6);
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    box(ctx, w / 2 - 2, 8, 4, h - 16, 0x5a4a3a);
    box(ctx, 4, h - 10, w - 8, 8, 0xa08a68);
  },
};

const trestle = {
  // a trestle with a panel on it (panels lean or lie flat; no studio easels)
  w: 2.2 * K, h: 1.7 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    for (const lx of [10, w - 16]) {
      ctx.strokeStyle = hex(WOOD_DK);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lx, h);
      ctx.lineTo(lx + 6, h - 0.8 * K);
      ctx.moveTo(lx + 12, h);
      ctx.lineTo(lx + 6, h - 0.8 * K);
      ctx.stroke();
    }
    box(ctx, 0, h - 0.85 * K, w, 8, WOOD, 0.3, 0.35);
    // a panel leaning on the wall behind, gessoed white with a drawing
    box(ctx, 16, 0, 0.9 * K, h - 0.85 * K, 0xece4d0, 0.2, 0.3);
    ctx.strokeStyle = rgba(0x6a3a2a, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(16 + 0.45 * K, 14, 6, 8, 0, 0, Math.PI * 2);
    ctx.moveTo(16 + 0.45 * K, 22);
    ctx.lineTo(16 + 0.3 * K, h - 0.95 * K);
    ctx.moveTo(16 + 0.45 * K, 22);
    ctx.lineTo(16 + 0.65 * K, h - 0.95 * K);
    ctx.stroke();
    box(ctx, 60, h - 0.85 * K - 6, 40, 6, GOLD, 0.4, 0.3);
  },
};

const panel_rack = {
  // panels drying on a rack: poplar, gessoed, one with gold already laid
  w: 2.4 * K, h: 2.2 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, h - 10, w, 10, WOOD_DK);
    box(ctx, 4, 6, 6, h - 6, WOOD);
    box(ctx, w - 10, 6, 6, h - 6, WOOD);
    for (let i = 0; i < 6; i++) {
      const x = 14 + i * ((w - 30) / 6);
      const col = i === 2 ? GOLD : i === 4 ? 0xd8b088 : 0xece4d0;
      box(ctx, x, 20 + (i % 2) * 6, 12, h - 30 - (i % 2) * 6, col, 0.3, 0.35);
    }
  },
};

const pigment_table = {
  // the grinding table by the window: a porphyry slab and its muller, shells
  // of colour, a basket of eggs, the pattern book open
  w: 3.4 * K, h: 1.5 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const ty = h - 0.95 * K;
    for (const lx of [8, w - 14]) box(ctx, lx, ty, 6, 0.95 * K, WOOD_DK);
    box(ctx, 0, ty, w, 10, WOOD, 0.3, 0.35);
    // the porphyry slab (dark red stone, flecked) and the muller on it
    box(ctx, 14, ty - 8, 60, 8, 0x6a2a2e, 0.3, 0.3);
    for (let i = 0; i < 14; i++) stamp(ctx, 16 + ((i * 37) % 56), ty - 4 - (i % 3), 0.8, 0xd8a8a0, 0.7, 0.2);
    box(ctx, 36, ty - 22, 14, 14, 0x7a3a3a, 0.35, 0.3);
    dab(ctx, 30, ty - 9, 10, 2, 0, LAPIS, 0.9, 0.2);
    // mussel shells of colour
    [0xc83a2a, 0xe8c040, 0x3a7a5a, LAPIS, 0xe8e0d0].forEach((c, i) => {
      ctx.fillStyle = hex(0xe8e0d0);
      ctx.beginPath();
      ctx.ellipse(86 + i * 12, ty - 3, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      dab(ctx, 86 + i * 12, ty - 4, 4, 2, 0, c, 1, 0.2);
    });
    // the egg basket and a cracked egg
    box(ctx, w - 44, ty - 14, 26, 14, 0xa07a48, 0.3, 0.35);
    for (let i = 0; i < 3; i++) stamp(ctx, w - 38 + i * 7, ty - 15, 3.5, 0xf2ead8, 1, 0.2);
    stamp(ctx, w - 12, ty - 4, 3, 0xf2c040, 1, 0.3);
  },
};

const hearth = {
  // the hearth with the glue pot on its trivet: warm light, a little smoke
  w: 2.6 * K, h: 2.6 * K, anchor: [0.5, 1], light: { x: 57, y: 92, r: 170, color: 0xffa860 },
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, 18, mix(STONE, NIGHT, 0.1), 0.3, 0.3);
    box(ctx, 6, 18, w - 12, h - 18, 0x8a7a68, 0.2, 0.35);
    archPath(ctx, 22, 36, w - 44, h - 36);
    ctx.fillStyle = hex(0x1e1418);
    ctx.fill();
    glow(ctx, w / 2, h - 20, 46, 0xffa040, 0.7);
    for (let i = 0; i < 5; i++) dab(ctx, w / 2 - 16 + i * 8, h - 14 - (i % 2) * 6, 5, 9, 0, [0xf2a040, 0xffd070][i % 2], 1, 0.3);
    box(ctx, w / 2 - 14, h - 46, 28, 20, 0x3a3030, 0.3, 0.3);
    ctx.fillStyle = hex(0x2a2226);
    ctx.fillRect(w / 2 - 18, h - 26, 36, 3);
  },
};

const cast_hand = {
  // a plaster cast of a hand hanging on the wall: a model for drawing
  w: 34, h: 50, anchor: [0.5, 0.5],
  paint(ctx, w, h) {
    ctx.strokeStyle = hex(0x5a4a3a);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, 10);
    ctx.stroke();
    ctx.fillStyle = hex(0xece6d8);
    ctx.fillRect(10, 12, 14, 18);
    for (let f = 0; f < 4; f++) ctx.fillRect(10 + f * 3.6, 30, 3, 12 + (f % 2) * 4);
    ctx.fillRect(22, 16, 6, 4);
    ctx.fillStyle = rgba(0x8a8070, 0.4);
    ctx.fillRect(20, 12, 4, 30);
  },
};

const bench = {
  // a low bench with a drawing board on it (Bice's place)
  w: 2.0 * K, h: 0.9 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, h - 0.5 * K, w, 7, WOOD, 0.3, 0.35);
    for (const lx of [6, w - 12]) box(ctx, lx, h - 0.5 * K + 7, 6, 0.5 * K - 7, WOOD_DK);
    box(ctx, 24, h - 0.5 * K - 10, 30, 10, 0xd8cca8, 0.3, 0.3);
  },
};

// ---- the colour-seller ---------------------------------------------------------------
const jar_wall = {
  // shelves of jars to the beams (back layer): every colour a city could buy
  w: 10 * T, h: 4 * T, anchor: [0, 1],
  paint(ctx, w, h) {
    const r = rand(11);
    for (let row = 0; row < 3; row++) {
      const y = h - 6 - row * 40;
      box(ctx, 0, y, w, 6, WOOD_DK, 0.25, 0.35);
      for (let x = 6; x < w - 14; x += r.between(16, 24)) {
        const jh = r.between(18, 28);
        const col = [0xc83a2a, 0xe8c040, 0x3a7a5a, 0x8a5a3a, 0xe8e0d0, 0x6a4a7a, 0xd88a3a, 0x2a2a30][r.between(0, 7)];
        box(ctx, x, y - jh, 12, jh, mix(col, 0xf0e8d8, 0.15), 0.3, 0.3);
        box(ctx, x + 2, y - jh - 4, 8, 4, 0x8a6a4a);
      }
    }
  },
};

const counter = {
  // the colour-seller's counter: a balance, weights, a ledger, a lapis rock under glass
  w: 4 * K, h: 1.9 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const ty = h - 1.0 * K;
    box(ctx, 0, ty, w, 1.0 * K, WOOD, 0.3, 0.35);
    for (let x = 10; x < w; x += 40) box(ctx, x, ty + 12, 30, 1.0 * K - 20, mix(WOOD, NIGHT, 0.2), 0.15, 0.3);
    box(ctx, -4, ty, w + 8, 8, mix(WOOD, 0xfff4dc, 0.2));
    // the balance
    const bx = 40;
    ctx.fillStyle = hex(0xb08a3a);
    ctx.fillRect(bx - 1, ty - 44, 3, 44);
    ctx.fillRect(bx - 26, ty - 44, 54, 2);
    ctx.strokeStyle = hex(0xb08a3a);
    for (const px of [bx - 24, bx + 26]) {
      ctx.beginPath();
      ctx.moveTo(px, ty - 43);
      ctx.lineTo(px - 6, ty - 22);
      ctx.moveTo(px, ty - 43);
      ctx.lineTo(px + 6, ty - 22);
      ctx.stroke();
      ctx.fillRect(px - 8, ty - 22, 16, 3);
    }
    // a cut of lapis under a glass bell: the precious thing, catching the light
    const lx = w - 50;
    dab(ctx, lx, ty - 8, 10, 7, 0.3, LAPIS, 1, 0.2);
    for (let i = 0; i < 5; i++) stamp(ctx, lx - 6 + i * 3, ty - 9 + (i % 2) * 3, 0.9, GOLD, 1, 0.2);
    ctx.strokeStyle = rgba(0xe8f0f8, 0.5);
    ctx.beginPath();
    ctx.arc(lx, ty - 14, 16, Math.PI, 0);
    ctx.lineTo(lx + 16, ty);
    ctx.moveTo(lx - 16, ty - 14);
    ctx.lineTo(lx - 16, ty);
    ctx.stroke();
    box(ctx, w / 2 - 14, ty - 8, 28, 8, 0x6a3a2a);
  },
};

const alembic = {
  // a copper still on its brazier, glowing (the shard is up above it)
  w: 1.6 * K, h: 2.4 * K, anchor: [0.5, 1], light: { x: 35, y: 90, r: 110, color: 0xffa860 },
  paint(ctx, w, h) {
    box(ctx, 8, h - 26, w - 16, 26, 0x4a3a32, 0.3, 0.35);
    glow(ctx, w / 2, h - 18, 22, 0xff9040, 0.8);
    ctx.fillStyle = hex(0xb86a3a);
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 46, 20, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(0xffe0b0, 0.4);
    ctx.fillRect(w / 2 - 14, h - 56, 4, 14);
    ctx.fillStyle = hex(0xa85a30);
    ctx.fillRect(w / 2 - 6, h - 84, 12, 24);
    ctx.strokeStyle = hex(0xa85a30);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w / 2 + 4, h - 80);
    ctx.lineTo(w - 2, h - 56);
    ctx.stroke();
  },
};

const sacks = {
  w: 1.6 * K, h: 0.9 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    dab(ctx, w * 0.3, h - 16, 18, 16, 0, 0xc8b088, 1, 0.15);
    dab(ctx, w * 0.68, h - 14, 16, 14, 0, 0xb8a078, 1, 0.15);
    dab(ctx, w * 0.5, h - 30, 14, 12, 0, 0xd8c098, 1, 0.15);
    stamp(ctx, w * 0.5, h - 40, 4, 0xc83a2a, 1, 0.3);
  },
};

// ---- the guild hall --------------------------------------------------------------------
const banner = {
  // a banner of one of the arts hanging from a pole
  w: 1.4 * K, h: 3.4 * K, anchor: [0.5, 0],
  paint(ctx, w, h, P) {
    const a = P.a ?? 0xc83a2a;
    const b = P.b ?? GOLD;
    box(ctx, 0, 0, w, 6, WOOD_DK);
    ctx.fillStyle = hex(a);
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(w - 6, 6);
    ctx.lineTo(w - 6, h - 20);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(6, h - 20);
    ctx.fill();
    ctx.fillStyle = rgba(NIGHT, 0.18);
    ctx.fillRect(w / 2 + 6, 6, w / 2 - 12, h - 30);
    // the art's sign, in the second colour: a lily, a tower, a wheel, a star, a key
    ctx.fillStyle = hex(b);
    ctx.strokeStyle = hex(b);
    ctx.lineWidth = 3;
    const cx = w / 2;
    const cy = h * 0.38;
    const e = P.e || 'lily';
    if (e === 'lily') {
      for (const dx of [-9, 0, 9]) {
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy - (dx ? 4 : 10), 4, 11, dx * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillRect(cx - 12, cy + 4, 24, 4);
      ctx.fillRect(cx - 2, cy + 8, 4, 12);
    } else if (e === 'tower') {
      ctx.fillRect(cx - 9, cy - 10, 18, 30);
      for (const dx of [-9, -2, 5]) ctx.fillRect(cx + dx, cy - 16, 4, 6);
    } else if (e === 'wheel') {
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      for (let a = 0; a < 4; a++) {
        ctx.moveTo(cx + Math.cos((a * Math.PI) / 4) * 14, cy + Math.sin((a * Math.PI) / 4) * 14);
        ctx.lineTo(cx - Math.cos((a * Math.PI) / 4) * 14, cy - Math.sin((a * Math.PI) / 4) * 14);
      }
      ctx.stroke();
    } else if (e === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx.lineTo(cx + Math.cos(a) * (i % 2 ? 6 : 15), cy + Math.sin(a) * (i % 2 ? 6 : 15));
      }
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(cx - 2, cy - 1, 4, 22);
      ctx.fillRect(cx, cy + 14, 8, 3);
      ctx.fillRect(cx, cy + 9, 6, 3);
    }
  },
};

const dais_table = {
  // the consuls' long table on the dais: a cloth, the book of members, a brass measure
  w: 6 * T, h: 1.6 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const ty = h - 0.9 * K;
    gradientV(ctx, 0, ty, w, 0.9 * K, [[0, 0x8a2a2a, 1], [1, 0x5a1a1e, 1]]);
    ctx.fillStyle = hex(GOLD);
    ctx.fillRect(0, ty + 6, w, 2);
    box(ctx, -4, ty - 4, w + 8, 6, WOOD, 0.3, 0.3);
    box(ctx, w / 2 - 20, ty - 12, 40, 8, 0xe8dcc0, 0.3, 0.3);
    ctx.fillStyle = hex(0x6a3a2a);
    ctx.fillRect(w / 2 - 1, ty - 12, 2, 8);
    box(ctx, 20, ty - 18, 6, 14, 0xb08a3a);
    stamp(ctx, 23, ty - 20, 3, 0xffd890, 1, 0.3);
  },
};

const stone_bench = {
  w: 4 * K, h: 0.5 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, STONE_DK, 0.3, 0.35);
  },
};

const high_window = {
  w: 1.0 * K, h: 2.2 * K, anchor: [0.5, 0.5], light: { x: 22, y: 50, r: 120, color: 0xfff0d0 },
  paint(ctx, w, h) {
    archPath(ctx, 4, 4, w - 8, h - 8);
    ctx.fillStyle = hex(0xd8d0b8);
    ctx.fill();
    ctx.fillStyle = rgba(0xfff8e0, 0.6);
    ctx.fillRect(8, 20, 6, h - 30);
  },
};

// ---- the palazzo --------------------------------------------------------------------------
const courtyard_arcade = {
  // the cortile's arcade along the back: columns with leafy capitals and
  // round arches, the vaults in shade, the sky in the courtyard above
  w: 12 * T, h: 6 * T, anchor: [0, 1],
  paint(ctx, w, h) {
    const bays = 3;
    const bw = w / bays;
    gradientV(ctx, 0, 0, w, h, [[0, 0x6a5a48, 1], [1, 0x4a3e32, 1]]);
    for (let b = 0; b < bays; b++) {
      const x = b * bw;
      box(ctx, x + 10, h - 2.4 * K, bw - 20, 2.4 * K, 0x8a7458, 0.1, 0.2);
      box(ctx, x + bw / 2 - 14, h - 2.3 * K, 28, 2.3 * K, 0x3e2a1c, 0.15, 0.3);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    for (let b = 0; b <= bays; b++) {
      const cx = b * bw;
      box(ctx, cx - 7, h - 3.8 * K, 14, 3.8 * K, 0xe8e0cc, 0.3, 0.3);
      box(ctx, cx - 12, h - 3.8 * K - 8, 24, 8, mix(STONE, 0xfff4dc, 0.3));
      box(ctx, cx - 10, h - 8, 20, 8, STONE_DK);
    }
    for (let b = 0; b < bays; b++) voussoirs(ctx, b * bw + 7, h - 3.8 * K - (bw - 14) / 2 - 8, bw - 14, 6, mix(STONE, 0xfff4dc, 0.2));
    ctx.restore();
    box(ctx, 0, 0, w, h - 3.8 * K - bw / 2, 0xe0d4b8, 0.2, 0.2);
  },
};

const tapestry = {
  // a hanging of the family's colours: a lattice of lozenges in ultramarine
  // and gold round the Bardelli arms, a woven border, a fringe
  w: 4 * K, h: 2.6 * K, anchor: [0.5, 0.5],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, 0x8a2a2a, 0.2, 0.3);
    ctx.fillStyle = hex(0xe8d8b0);
    ctx.fillRect(7, 7, w - 14, h - 14);
    const s = 18;
    for (let y = 7; y < h - 7; y += s)
      for (let x = 7; x < w - 7; x += s) {
        ctx.fillStyle = hex(((x + y) / s) % 2 ? LAPIS : 0x2e4e9a);
        ctx.beginPath();
        ctx.moveTo(x + s / 2, y);
        ctx.lineTo(x + s, y + s / 2);
        ctx.lineTo(x + s / 2, y + s);
        ctx.lineTo(x, y + s / 2);
        ctx.fill();
        stamp(ctx, x + s / 2, y + s / 2, 1.6, GOLD, 1, 0.2);
      }
    // the arms in the middle: a gold shield with three blue balls of the bank
    const cx = w / 2;
    ctx.fillStyle = hex(0xe8d8b0);
    ctx.fillRect(cx - 26, h / 2 - 30, 52, 60);
    ctx.fillStyle = hex(GOLD);
    ctx.beginPath();
    ctx.moveTo(cx - 20, h / 2 - 24);
    ctx.lineTo(cx + 20, h / 2 - 24);
    ctx.lineTo(cx + 20, h / 2 + 6);
    ctx.quadraticCurveTo(cx, h / 2 + 28, cx - 20, h / 2 + 6);
    ctx.fill();
    for (const [dx, dy] of [[-8, -12], [8, -12], [0, 2]]) {
      ctx.fillStyle = hex(LAPIS);
      ctx.beginPath();
      ctx.arc(cx + dx, h / 2 + dy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = hex(GOLD);
    for (let x = 4; x < w; x += 6) ctx.fillRect(x, h - 3, 2, 3);
  },
};

const strongbox = {
  w: 1.2 * K, h: 0.8 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 6, w, h - 6, 0x5a3a24, 0.3, 0.35);
    for (const x of [6, w / 2 - 2, w - 10]) box(ctx, x, 6, 4, h - 6, 0x3a3a40);
    box(ctx, -2, 0, w + 4, 8, 0x6a4a2e, 0.3, 0.3);
    stamp(ctx, w / 2, h / 2 + 4, 3, GOLD, 1, 0.3);
  },
};

const lemon_pot = {
  // a lemon tree in a terracotta pot (citrus grew in courtyards)
  w: 1.4 * K, h: 2.4 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, w / 2 - 18, h - 30, 36, 30, COTTO, 0.3, 0.35);
    box(ctx, w / 2 - 3, h - 70, 6, 42, WOOD_DK);
    const r = rand(2);
    for (let i = 0; i < 10; i++) dab(ctx, w / 2 + (r.frac() - 0.5) * 44, h - 80 + (r.frac() - 0.5) * 36, 9, 8, 0, 0x3a6a3a, 1, 0.3);
    for (let i = 0; i < 6; i++) stamp(ctx, w / 2 + (r.frac() - 0.5) * 40, h - 80 + (r.frac() - 0.5) * 30, 3, 0xf2d040, 1, 0.3);
  },
};

// ---- the chapel ------------------------------------------------------------------------------
const scaffold_poles = {
  // pole-and-beam scaffolding lashed with rope, drawn over a bay of the grid
  // (the planks are the grid's one-ways): every 5 rows a ledger beam
  w: 18 * T, h: 33 * T, anchor: [0, 1],
  paint(ctx, w, h) {
    const pole = 0x8a6a42;
    for (const x of [8, w / 3, (2 * w) / 3, w - 14]) {
      box(ctx, x, 0, 7, h, pole, 0.25, 0.35);
      for (let y = 60; y < h; y += 5 * T) {
        ctx.strokeStyle = hex(0xc8b080);
        ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(x - 2, y + k * 3);
          ctx.lineTo(x + 9, y + 2 + k * 3);
          ctx.stroke();
        }
      }
    }
    // diagonal braces
    ctx.strokeStyle = rgba(pole, 0.85);
    ctx.lineWidth = 3;
    for (let y = 0; y < h - 5 * T; y += 10 * T) {
      ctx.beginPath();
      ctx.moveTo(10, y + 5 * T);
      ctx.lineTo(w / 3, y);
      ctx.moveTo(w - 12, y + 5 * T);
      ctx.lineTo((2 * w) / 3, y);
      ctx.stroke();
    }
  },
};

const vault_rival = {
  // Dori's bay of the vault: his giornate going in day by day (his figures
  // in green and rose; as the contest runs it is all there)
  w: 15 * T, h: 6 * T, anchor: [0, 0],
  paint(ctx, w, h) {
    paintVault(ctx, w, h, 7, 7, { rival: true });
  },
};

const vault_bare = {
  // our bay before the giornata: the rough plaster with the red sinopia
  w: 17 * T, h: 6 * T, anchor: [0, 0], unless: 'judged',
  paint(ctx, w, h) {
    paintVault(ctx, w, h, 0, 7, {});
  },
};

const vault_done = {
  w: 17 * T, h: 6 * T, anchor: [0, 0], when: 'judged',
  paint(ctx, w, h) {
    paintVault(ctx, w, h, 7, 7, {});
  },
};

const altar = {
  // the chapel's altar, a cloth, two candles (the room's warm light)
  w: 3 * K, h: 2.2 * K, anchor: [0.5, 1], light: { x: 66, y: 30, r: 160, color: WARM },
  paint(ctx, w, h) {
    box(ctx, 10, h - 1.0 * K, w - 20, 1.0 * K, 0xe8e0cc, 0.3, 0.35);
    box(ctx, 6, h - 1.0 * K, w - 12, 10, 0xf2ece0);
    gradientV(ctx, 14, h - 1.0 * K + 10, w - 28, 24, [[0, 0x8a2a2a, 1], [1, 0x6a1e22, 1]]);
    for (const cx of [26, w - 26]) {
      box(ctx, cx - 3, h - 1.0 * K - 36, 6, 36, 0xf2ead8, 0.3, 0.2);
      dab(ctx, cx, h - 1.0 * K - 42, 3, 6, 0, 0xffd070, 1, 0.3);
      glow(ctx, cx, h - 1.0 * K - 42, 20, WARM, 0.5);
    }
    box(ctx, w / 2 - 4, h - 1.0 * K - 50, 8, 50, GOLD, 0.4, 0.3);
    box(ctx, w / 2 - 16, h - 1.0 * K - 40, 32, 7, GOLD, 0.4, 0.3);
  },
};

const plaster_trough = {
  // the plasterer's trough of lime and sand, a trowel, a bucket of water
  w: 2.2 * K, h: 0.9 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, h - 0.6 * K, w * 0.7, 0.6 * K, WOOD, 0.3, 0.35);
    box(ctx, 4, h - 0.6 * K, w * 0.7 - 8, 8, 0xe8e4d8);
    box(ctx, w * 0.78, h - 0.7 * K, 0.4 * K, 0.7 * K, 0x6a5a48, 0.3, 0.35);
    box(ctx, w * 0.78 + 2, h - 0.7 * K, 0.4 * K - 4, 5, 0x6a9ab8);
    ctx.fillStyle = hex(0x9a9aa8);
    ctx.beginPath();
    ctx.moveTo(30, h - 0.6 * K - 2);
    ctx.lineTo(48, h - 0.6 * K - 8);
    ctx.lineTo(50, h - 0.6 * K - 2);
    ctx.fill();
  },
};

const candle_stand = {
  w: 26, h: 1.6 * K, anchor: [0.5, 1], light: { x: 13, y: 6, r: 110, color: WARM },
  paint(ctx, w, h) {
    box(ctx, w / 2 - 2, 14, 4, h - 14, 0x3a3030);
    box(ctx, 2, h - 4, w - 4, 4, 0x3a3030);
    box(ctx, w / 2 - 3, 6, 6, 10, 0xf2ead8);
    dab(ctx, w / 2, 2, 3, 5, 0, 0xffd070, 1, 0.3);
  },
};

// ---- the altarpiece in the bottega (the drapery job paints it) -------------------------------
const altarpiece = {
  // a gabled panel on its trestle, 2.4 m: gesso and the underdrawing before
  // the job, the gold ground and the ultramarine robe after
  w: 2.0 * K, h: 3.3 * K, anchor: [0.5, 1], unless: 'drapery_done',
  paint(ctx, w, h) {
    altarpieceOn(ctx, w, h, 0);
  },
};
const altarpiece_done = {
  w: 2.0 * K, h: 3.3 * K, anchor: [0.5, 1], when: 'drapery_done',
  paint(ctx, w, h) {
    altarpieceOn(ctx, w, h, 99);
  },
};
function altarpieceOn(ctx, w, h, k) {
  // the trestle feet
  for (const lx of [10, w - 16]) box(ctx, lx, h - 0.6 * K, 6, 0.6 * K, WOOD_DK);
  box(ctx, 0, h - 0.6 * K, w, 8, WOOD, 0.3, 0.35);
  // the panel: ALTAR_W × ALTAR_H at (ALTAR_X, ALTAR_Y) (shared with the encounter)
  paintAltarpiece(ctx, ALTAR.x, ALTAR.y, ALTAR.w, ALTAR.h, k);
}
// where the panel sits on the altarpiece prop (the drapery encounter paints over it)
export const ALTAR = { x: 10, y: 0, w: 2.0 * K - 20, h: 3.3 * K - 0.6 * K - 4 };

export default {
  bottega_front, dori_front, speziale_front, via_house, pentice, washing_line, city_arch, well, handcart, barrel_stack, cypress,
  guild_front, loggia, market_stall, fountain, torso_plinth, palazzo_front, church_front, torch_ring,
  north_window, trestle, panel_rack, pigment_table, hearth, cast_hand, bench,
  jar_wall, counter, alembic, sacks,
  banner, dais_table, stone_bench, high_window,
  courtyard_arcade, tapestry, strongbox, lemon_pot,
  scaffold_poles, vault_rival, vault_bare, vault_done, altar, plaster_trough, candle_stand,
  altarpiece, altarpiece_done,
};
