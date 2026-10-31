// THE BIG STAGE's props (FRAMEWORK §4.3): painted canvases, at the scale
// system's 1 m = 44 px (critique §7). Buildings come from the building kit
// (src/art/buildingKit.js) at s = 1, so a storey is 132 px and a door 2.2 m;
// trees from the tree kit; signs are bitmap glyphs (paintGlyphs), never a
// web font. Light comes from the top left; the city is cool indigo with warm
// practicals and the dream's teal accent (WP6 §9).
//   { w, h, anchor: [ax, ay], paint(ctx, w, h, P), light?, live? }
import { mix, rgba, hex, stamp, gradientV, grain } from '../../art/paint.js';
import { drawBuilding } from '../../art/buildingKit.js';
import { drawTree } from '../../art/treeKit.js';
import { paintGlyphs } from '../../ui/BitmapFonts.js';
import { paintBackdropLayer } from '../../art/backdrops/painted.js';

const K = 44; // px per metre on the play plane
const TEAL = 0x2e7d9a;
const NEON = 0x7fe0f0;
const WARM = 0xffc870;
const NIGHT = 0x14122a;

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

function box(ctx, x, y, w, h, col, lit = 0.18, dark = 0.3) {
  ctx.fillStyle = hex(col);
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  ctx.fillStyle = rgba(0xfff0d8, lit);
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), 1);
  ctx.fillRect(Math.round(x), Math.round(y), 1, Math.round(h));
  ctx.fillStyle = rgba(NIGHT, dark);
  ctx.fillRect(Math.round(x + w - 1), Math.round(y), 1, Math.round(h));
  ctx.fillRect(Math.round(x), Math.round(y + h - 1), Math.round(w), 1);
}

// a glow on the canvas itself (neon, bulbs, windows): additive soft disc
function glow(ctx, x, y, r, col, a = 0.6) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// neon letters: a soft halo, a coloured tube, a white-hot core
function neonText(ctx, text, x, y, col, { size = 'display', scale = 1, lit = true } = {}) {
  if (!lit) {
    paintGlyphs(ctx, text, x, y, { size, scale, color: mix(col, 0x302838, 0.75), align: 'center', baseline: 'middle' });
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) paintGlyphs(ctx, text, x + dx, y + dy, { size, scale, color: mix(col, 0x000000, 0.65), align: 'center', baseline: 'middle' });
  ctx.restore();
  paintGlyphs(ctx, text, x, y, { size, scale, color: col, align: 'center', baseline: 'middle' });
  paintGlyphs(ctx, text, x, y - 1, { size, scale, color: mix(col, 0xffffff, 0.6), align: 'center', baseline: 'middle' });
}

// a building on the play plane (the kit at s = 1): its foot on the canvas's bottom
function building(ctx, w, h, opts, seed) {
  const r = rand(seed);
  drawBuilding(ctx, 0, h, { s: 1, w, quoins: true, lit: 0.55, ...opts }, r);
}

// iron: a lit top edge, a shaded body
function iron(ctx, x, y, w, h, P) {
  box(ctx, x, y, w, h, P.iron ?? 0x2a2630, 0.25, 0.4);
}

// ---- the street ------------------------------------------------------------------
const theatre_front = {
  // the Meridian: a three-storey theatre front, its marquee over the pavement
  w: 560, h: 600, anchor: [0.5, 1], light: { x: 280, y: 400, r: 220, color: WARM },
  paint(ctx, w, h, P) {
    building(ctx, w, h, { storeys: 2, ground: 'shop', bays: 5, wall: 0x6a4a5a, roof: 'parapet', roofCol: 0x3a2a3a, awning: null, sign: 0x2a2030, lit: 0.7, balconies: false }, 11);
    // the marquee canopy: 3.2 m up, 1 m deep, rows of bulbs
    const my = h - 3.2 * K - 30;
    gradientV(ctx, 20, my, w - 40, 64, [[0, 0x8a2a3a, 1], [1, 0x4a1420, 1]]);
    box(ctx, 20, my + 64, w - 40, 10, 0x2a1a24);
    for (let x = 28; x < w - 28; x += 9) {
      stamp(ctx, x, my + 4, 2.4, 0xfff0b0, 1, 0.2);
      stamp(ctx, x, my + 60, 2.4, 0xfff0b0, 1, 0.2);
    }
    // the letter board: what the dream is about, twice the cap height a sign needs
    box(ctx, 36, my + 10, w - 72, 46, 0xf2e6cc, 0.1, 0.1);
    paintGlyphs(ctx, 'MERIDIAN JAZZ FESTIVAL', w / 2, my + 22, { size: 'small', scale: 2, color: 0x1a1428, align: 'center', baseline: 'middle' });
    paintGlyphs(ctx, 'SATURDAY  -  THE BIG STAGE', w / 2, my + 44, { size: 'small', scale: 2, color: 0x8a2a3a, align: 'center', baseline: 'middle' });
    // under the canopy: lit doors and a poster case
    glow(ctx, w / 2, h - 60, 140, WARM, 0.35);
    // the vertical blade sign
    box(ctx, w - 70, h - 560, 44, 240, 0x2a1a24);
    for (let i = 0, t = 'MERIDIAN'; i < t.length; i++) neonText(ctx, t[i], w - 48, h - 538 + i * 28, 0xf2d580, { size: 'display' });
    grain(ctx, 0, 0, w, h, 0.04, 21);
  },
};

const horn_shop = {
  // a music shop: a trumpet under a spot in the window (Jo's first note)
  w: 340, h: 470, anchor: [0.5, 1],
  paint(ctx, w, h, P) {
    building(ctx, w, h, { storeys: 2, ground: 'plain', bays: 3, wall: 0x7a5a48, roof: 'pitched', roofCol: 0x3a2a34, lit: 0.4 }, 5);
    // the shop window 2.4 × 2.2 m on a 0.5 m stall riser
    const ww = 2.4 * K;
    const wh = 2.0 * K;
    const wx = 26;
    const wy = h - 0.5 * K - wh;
    box(ctx, wx - 6, wy - 30, ww + 110, 26, 0x1e2a3a);
    paintGlyphs(ctx, 'HORNS & REPAIRS', wx + (ww + 98) / 2, wy - 17, { size: 'small', scale: 2, color: 0xf2d580, align: 'center', baseline: 'middle' });
    box(ctx, wx - 4, wy - 4, ww + 8, wh + 8, 0x2a2028);
    gradientV(ctx, wx, wy, ww, wh, [[0, 0x3a3048, 1], [1, 0x6a5040, 1]]);
    glow(ctx, wx + ww / 2, wy + wh * 0.55, 70, WARM, 0.55);
    // the trumpet on its stand: bell, valves, mouthpiece
    const tx = wx + ww / 2;
    const ty = wy + wh * 0.6;
    ctx.fillStyle = hex(0xd8a840);
    ctx.fillRect(tx - 26, ty - 2, 40, 4);
    ctx.fillRect(tx - 18, ty + 6, 30, 3);
    ctx.beginPath();
    ctx.moveTo(tx + 14, ty - 2);
    ctx.lineTo(tx + 28, ty - 10);
    ctx.lineTo(tx + 28, ty + 12);
    ctx.lineTo(tx + 14, ty + 4);
    ctx.fill();
    for (let k = 0; k < 3; k++) box(ctx, tx - 8 + k * 6, ty - 10, 4, 10, 0xf2d080, 0.3, 0.2);
    ctx.fillStyle = hex(0x5a4a3a);
    ctx.fillRect(tx - 2, ty + 9, 3, wh * 0.38);
    // the door
    box(ctx, wx + ww + 18, h - 2.2 * K, 0.95 * K, 2.2 * K, 0x2e3a4a);
    box(ctx, wx + ww + 26, h - 2.1 * K, 0.95 * K - 16, 0.9 * K, 0x6a5a48);
    grain(ctx, 0, 0, w, h, 0.04, 9);
  },
};

const cellar_front = {
  // the Blue Cellar: a brick block with the club down a flight of steps
  w: 420, h: 600, anchor: [0.5, 1], light: { x: 210, y: 380, r: 150, color: NEON },
  paint(ctx, w, h, P) {
    building(ctx, w, h, { storeys: 3, ground: 'plain', bays: 4, wall: 0x7a3a30, roof: 'parapet', roofCol: 0x3a2224, lit: 0.45 }, 17);
    // the sign: a blue neon script over the area steps
    const sy = h - 3.3 * K;
    box(ctx, 70, sy - 26, w - 140, 54, 0x14182a, 0.1, 0.4);
    glow(ctx, w / 2, sy, 160, NEON, 0.28);
    neonText(ctx, 'THE BLUE CELLAR', w / 2, sy + 1, NEON, { size: 'display' });
    // the area: railings, steps going down, a lit door half below the street
    ctx.fillStyle = hex(0x1a1624);
    ctx.fillRect(110, h - 1.1 * K, 200, 1.1 * K);
    for (let x = 112; x < 310; x += 9) iron(ctx, x, h - 1.1 * K - 30, 3, 30, P);
    iron(ctx, 108, h - 1.1 * K - 32, 206, 4, P);
    box(ctx, 190, h - 2.0 * K, 44, 1.6 * K, 0x2e3a5a);
    glow(ctx, 212, h - 1.2 * K, 60, WARM, 0.4);
    grain(ctx, 0, 0, w, h, 0.04, 23);
  },
};

const brick_row = {
  w: 360, h: 620, anchor: [0.5, 1],
  paint(ctx, w, h) {
    building(ctx, w, h, { storeys: 3, ground: 'shop', bays: 3, wall: 0x6a4a44, roof: 'parapet', roofCol: 0x3a2a30, awning: TEAL, lit: 0.5 }, 31);
    grain(ctx, 0, 0, w, h, 0.04, 31);
  },
};

const street_lamp = {
  // 4.5 m, a lantern on a swan neck (the shared lamp is a 3.8 m village lamp)
  w: 70, h: 200, anchor: [0.5, 1], light: { x: 50, y: 22, r: 140, color: WARM },
  paint(ctx, w, h, P) {
    iron(ctx, 30, 30, 6, h - 40, P);
    iron(ctx, 24, h - 14, 18, 14, P);
    ctx.strokeStyle = hex(P.iron ?? 0x2a2630);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(33, 34);
    ctx.quadraticCurveTo(36, 8, 52, 12);
    ctx.stroke();
    box(ctx, 42, 14, 18, 6, 0x2a2630);
    gradientV(ctx, 44, 20, 14, 14, [[0, 0xfff0c0, 1], [1, WARM, 1]]);
    glow(ctx, 51, 28, 26, WARM, 0.5);
  },
};

const bus_shelter = {
  // 3 m long, 2.5 m high: glass sides, a lit ad panel, a roof Jo can stand on
  w: 3.2 * K, h: 2.6 * K, anchor: [0.5, 1],
  paint(ctx, w, h, P) {
    iron(ctx, 0, 0, w, 8, P);
    iron(ctx, 4, 8, 5, h - 8, P);
    iron(ctx, w - 9, 8, 5, h - 8, P);
    ctx.fillStyle = rgba(0x88b8d8, 0.16);
    ctx.fillRect(9, 10, w - 18, h - 30);
    box(ctx, w - 50, 16, 36, 64, 0xf2e6cc, 0.1, 0.1);
    gradientV(ctx, w - 48, 18, 32, 60, [[0, TEAL, 1], [1, 0x14303a, 1]]);
    // lint-allow readability: decoration (the maker's mark on the drum)
    paintGlyphs(ctx, 'JAZZ', w - 32, 40, { size: 'small', color: 0xf2d580, align: 'center', baseline: 'middle' });
    box(ctx, 16, h - 26, w - 70, 6, 0x5a4a3a);
  },
};

const parked_car = {
  // 4.3 × 1.45 m: a dark saloon, rain beading on the roof
  w: 4.3 * K, h: 1.5 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const body = 0x2a3a5a;
    ctx.fillStyle = hex(body);
    ctx.beginPath();
    ctx.moveTo(4, h - 14);
    ctx.lineTo(8, h - 34);
    ctx.lineTo(48, h - 38);
    ctx.lineTo(66, h - 62);
    ctx.lineTo(136, h - 62);
    ctx.lineTo(158, h - 38);
    ctx.lineTo(w - 6, h - 34);
    ctx.lineTo(w - 2, h - 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(0xfff0d8, 0.2);
    ctx.fillRect(66, h - 62, 70, 2);
    ctx.fillStyle = hex(0x6a8aa8);
    ctx.beginPath();
    ctx.moveTo(72, h - 58);
    ctx.lineTo(98, h - 58);
    ctx.lineTo(98, h - 40);
    ctx.lineTo(58, h - 40);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(104, h - 58);
    ctx.lineTo(132, h - 58);
    ctx.lineTo(148, h - 40);
    ctx.lineTo(104, h - 40);
    ctx.fill();
    for (const cx of [38, w - 40]) {
      ctx.fillStyle = hex(0x141218);
      ctx.beginPath();
      ctx.arc(cx, h - 14, 14, 0, Math.PI * 2);
      ctx.fill();
      stamp(ctx, cx, h - 14, 5, 0x8a8a98, 1, 0.2);
    }
    stamp(ctx, w - 6, h - 28, 3, 0xfff0c0, 1, 0.2);
    stamp(ctx, 6, h - 28, 2.5, 0xd04040, 1, 0.2);
  },
};

const dumpster = {
  // 1.8 m wide, 1.2 m high: green steel, a lid ajar
  w: 1.9 * K, h: 1.3 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 4, 12, w - 8, h - 16, 0x2e4a3a, 0.2, 0.4);
    box(ctx, 0, 6, w, 8, 0x243a2e);
    ctx.fillStyle = rgba(NIGHT, 0.3);
    for (let x = 14; x < w - 8; x += 16) ctx.fillRect(x, 18, 2, h - 26);
    box(ctx, 8, h - 6, 10, 6, 0x1a1820);
    box(ctx, w - 18, h - 6, 10, 6, 0x1a1820);
  },
};

const street_tree = {
  // a young street tree, 7 m (the tree kit at s = 1)
  w: 300, h: 7 * K + 8, anchor: [0.5, 1],
  paint(ctx, w, h) {
    drawTree(ctx, w / 2, h, 'street', 1, rand(4), { m: 7 });
    ctx.fillStyle = rgba(NIGHT, 0.25);
    ctx.fillRect(0, 0, w, h);
  },
};

const alley_arch = {
  // the alley mouth: two brick piers and an iron arch with a hanging sign
  w: 6 * 32, h: 4.2 * K, anchor: [0.5, 1],
  paint(ctx, w, h, P) {
    box(ctx, 0, 30, 26, h - 30, 0x6a3a30);
    box(ctx, w - 26, 30, 26, h - 30, 0x6a3a30);
    ctx.strokeStyle = hex(P.iron ?? 0x2a2630);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(13, 34);
    ctx.quadraticCurveTo(w / 2, -10, w - 13, 34);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let x = 30; x < w - 30; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 30 - Math.sin(((x - 13) / (w - 26)) * Math.PI) * 18);
      ctx.lineTo(x, 34);
      ctx.stroke();
    }
    box(ctx, w / 2 - 70, 44, 140, 30, NIGHT, 0.1, 0.2);
    ctx.strokeStyle = hex(0xc8a24a);
    ctx.strokeRect(w / 2 - 70, 44, 140, 30);
    paintGlyphs(ctx, 'STAGE DOOR >', w / 2, 59, { size: 'small', scale: 2, color: 0xf2d580, align: 'center', baseline: 'middle' });
  },
};


const hydrant = {
  w: 22, h: 0.75 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 5, 8, 12, h - 8, 0x9a3a2a);
    box(ctx, 3, 4, 16, 6, 0x7a2a20);
    box(ctx, 0, 14, 22, 5, 0x7a2a20);
  },
};

// ---- the alley -------------------------------------------------------------------
const stage_door = {
  // a steel stage door in a brick surround, a caged lamp over it
  w: 2.2 * K, h: 3.2 * K, anchor: [0.5, 1],
  paint(ctx, w, h, P) {
    box(ctx, 4, 20, w - 8, h - 20, 0x5a3028);
    box(ctx, (w - 0.95 * K) / 2, h - 2.15 * K, 0.95 * K, 2.15 * K, 0x2e3440, 0.22, 0.4);
    ctx.fillStyle = rgba(0xfff0d8, 0.12);
    for (let y = h - 2.0 * K; y < h - 6; y += 18) ctx.fillRect((w - 0.95 * K) / 2 + 6, y, 0.95 * K - 12, 1);
    box(ctx, w / 2 + 10, h - 1.2 * K, 6, 14, 0xc8a24a);
    box(ctx, w / 2 - 70, 0, 140, 28, NIGHT);
    paintGlyphs(ctx, 'STAGE DOOR', w / 2, 14, { size: 'small', scale: 2, color: 0xc8c0b0, align: 'center', baseline: 'middle' });
    void P;
  },
};

function neonSign(lit) {
  return {
    // the dead neon over the stage door: a horn and BLUE CELLAR
    w: 260, h: 80, anchor: [0.5, 0.5], live: true, light: lit ? { x: 130, y: 40, r: 170, color: NEON } : undefined,
    paint(ctx, w, h) {
      box(ctx, 6, 6, w - 12, h - 12, 0x14182a, 0.1, 0.4);
      ctx.strokeStyle = hex(0x3a3448);
      ctx.strokeRect(6.5, 6.5, w - 13, h - 13);
      if (lit) glow(ctx, w / 2, h / 2, 120, NEON, 0.3);
      neonText(ctx, 'BLUE CELLAR', w / 2 + 18, h / 2, NEON, { size: 'display', lit });
      // the horn in tube light
      ctx.strokeStyle = lit ? hex(0xf2d580) : hex(0x4a4250);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(18, h / 2);
      ctx.lineTo(40, h / 2);
      ctx.lineTo(48, h / 2 - 9);
      ctx.moveTo(40, h / 2);
      ctx.lineTo(48, h / 2 + 9);
      ctx.stroke();
    },
  };
}

const escape_landing = {
  // an iron fire-escape landing's rail: 1.1 m, uprights every 0.4 m
  w: 7 * 32, h: 1.1 * K + 6, anchor: [0, 1],
  paint(ctx, w, h, P) {
    iron(ctx, 0, 0, w, 4, P);
    iron(ctx, 0, h * 0.45, w, 3, P);
    for (let x = 0; x <= w - 4; x += 18) iron(ctx, x, 0, 3, h - 4, P);
    iron(ctx, 0, h - 6, w, 6, P);
  },
};

const roller_door = {
  // a 3 × 3 m loading-dock shutter, its stencil, a hazard kerb
  w: 3.4 * K, h: 3.4 * K, anchor: [0.5, 1], light: { x: 75, y: 6, r: 90, color: 0xf2e6cc },
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, 0x3a3a44);
    for (let y = 14; y < h - 4; y += 7) {
      ctx.fillStyle = rgba(0xfff0d8, 0.1);
      ctx.fillRect(10, y, w - 20, 1);
      ctx.fillStyle = rgba(NIGHT, 0.3);
      ctx.fillRect(10, y + 3, w - 20, 1);
    }
    gradientV(ctx, 10, 12, w - 20, h - 16, [[0, 0x6a6a74, 0.3], [1, 0x2a2a34, 0.3]]);
    paintGlyphs(ctx, 'MERIDIAN FEST', w / 2, h * 0.38, { size: 'small', scale: 2, color: 0xf2e6cc, align: 'center', baseline: 'middle' });
    paintGlyphs(ctx, 'DELIVERIES', w / 2, h * 0.38 + 20, { size: 'small', scale: 2, color: 0xf2d580, align: 'center', baseline: 'middle' });
    for (let x = 0; x < w; x += 16) {
      ctx.fillStyle = hex((x / 16) % 2 ? 0xd8a840 : 0x1a1820);
      ctx.fillRect(x, h - 6, 16, 6);
    }
    stamp(ctx, w / 2, 6, 5, 0xf2e6cc, 1, 0.3);
  },
};

const poster_board = {
  w: 3 * K, h: 1.6 * K, anchor: [0.5, 0.5],
  paint(ctx, w, h) {
    const r = rand(8);
    const cols = [0xe8dcc8, 0xd8a840, 0x8a2a3a, 0x2e7d9a, 0xf2e6cc];
    for (let i = 0; i < 6; i++) {
      const pw = 34 + r.frac() * 20;
      const ph = 44 + r.frac() * 16;
      const px = 4 + i * 22 + r.frac() * 6;
      const py = 4 + r.frac() * (h - ph - 8);
      box(ctx, px, py, pw, ph, cols[i % cols.length], 0.1, 0.2);
      ctx.fillStyle = rgba(NIGHT, 0.5);
      ctx.fillRect(px + 4, py + 6, pw - 8, 3);
      ctx.fillRect(px + 4, py + ph - 10, pw - 14, 2);
    }
    ctx.fillStyle = rgba(NIGHT, 0.35);
    ctx.fillRect(0, 0, w, h);
  },
};

// ---- the Blue Cellar -------------------------------------------------------------
const bar_counter = {
  // 1.1 m high, a zinc top lit by the back bar
  w: 7 * 32, h: 1.1 * K, anchor: [0, 1],
  paint(ctx, w, h) {
    gradientV(ctx, 0, 6, w, h - 6, [[0, 0x5a2a20, 1], [1, 0x2a1418, 1]]);
    box(ctx, 0, 0, w, 7, 0xa8a8b0, 0.4, 0.3);
    ctx.fillStyle = rgba(0xf2d580, 0.12);
    for (let x = 12; x < w; x += 28) ctx.fillRect(x, 12, 18, h - 18);
    box(ctx, 0, h - 6, w, 6, 0xc8963a, 0.3, 0.2);
  },
};

const back_bar = {
  // shelves of bottles in front of a smoky mirror
  w: 7 * 32, h: 2.2 * K, anchor: [0, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, 0x2a1a1c);
    gradientV(ctx, 6, 6, w - 12, h * 0.55, [[0, 0x4a4a5a, 1], [1, 0x2a2a34, 1]]);
    glow(ctx, w / 2, h * 0.3, 90, WARM, 0.25);
    const r = rand(3);
    const cols = [0x5a8a6a, 0xa86a3a, 0xd8c890, 0x6a2a3a, 0x3a5a8a];
    for (const sy of [h * 0.48, h * 0.78]) {
      box(ctx, 4, sy, w - 8, 4, 0x6a4a34);
      for (let x = 10; x < w - 10; x += 9 + r.frac() * 5) {
        const bh = 14 + r.frac() * 10;
        ctx.fillStyle = hex(cols[Math.floor(r.frac() * cols.length)]);
        ctx.fillRect(x, sy - bh, 5, bh);
        ctx.fillRect(x + 1.5, sy - bh - 5, 2, 5);
        ctx.fillStyle = rgba(0xfff0d8, 0.35);
        ctx.fillRect(x, sy - bh, 1, bh);
      }
    }
  },
};

const club_chair = {
  w: 22, h: 0.9 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 2, 0, 4, h, 0x3a2a24);
    box(ctx, 2, h * 0.5, w - 4, 4, 0x6a3a2a);
    box(ctx, w - 6, h * 0.5, 3, h * 0.5, 0x3a2a24);
    box(ctx, 2, h * 0.5, 3, h * 0.5, 0x3a2a24);
  },
};

const club_table = {
  // a café table, 0.75 m, a candle in a red glass
  w: 34, h: 0.75 * K + 10, anchor: [0.5, 1], light: { x: 17, y: 4, r: 40, color: 0xf2a060 },
  paint(ctx, w, h) {
    box(ctx, 0, 10, w, 4, 0x2a1a1c);
    box(ctx, w / 2 - 2, 14, 4, h - 18, 0x2a1a1c);
    box(ctx, w / 2 - 9, h - 4, 18, 4, 0x2a1a1c);
    box(ctx, w / 2 - 3, 2, 6, 8, 0xa02a2a, 0.3, 0.2);
    stamp(ctx, w / 2, 2, 2, 0xfff0b0, 1, 0.2);
  },
};

const piano_upright = {
  w: 1.5 * K, h: 1.3 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h - 4, 0x2a1418, 0.25, 0.4);
    box(ctx, -2, h * 0.5, w + 4, 6, 0x3a2024);
    ctx.fillStyle = hex(0xe8e0d0);
    ctx.fillRect(2, h * 0.5 + 6, w - 4, 5);
    ctx.fillStyle = hex(0x1a1418);
    for (let x = 5; x < w - 4; x += 5) ctx.fillRect(x, h * 0.5 + 6, 2, 3);
    box(ctx, 4, h - 6, 6, 6, 0x1a1418);
    box(ctx, w - 10, h - 6, 6, 6, 0x1a1418);
  },
};

const drum_kit = {
  // kick, snare, a tom, a ride and a hi-hat: 1.6 m wide, cymbals at 1.3 m
  w: 1.7 * K, h: 1.4 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const shell = 0x8a2a2a;
    ctx.fillStyle = hex(shell);
    ctx.beginPath();
    ctx.arc(w / 2, h - 22, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0xe8dcc8);
    ctx.beginPath();
    ctx.arc(w / 2, h - 22, 17, 0, Math.PI * 2);
    ctx.fill();
    // lint-allow readability: decoration (initials stencilled on a case)
    paintGlyphs(ctx, 'BC', w / 2, h - 22, { size: 'small', color: shell, align: 'center', baseline: 'middle' });
    box(ctx, 8, h - 38, 22, 12, shell);
    box(ctx, w - 30, h - 46, 20, 14, shell);
    for (const [cx, cy, rw] of [[14, h - 56, 18], [w - 14, h - 60, 22]]) {
      ctx.fillStyle = hex(0xd8a840);
      ctx.fillRect(cx - rw, cy, rw * 2, 3);
      ctx.fillStyle = hex(0x6a6a74);
      ctx.fillRect(cx - 1, cy + 3, 2, h - cy - 3);
    }
  },
};

const double_bass = {
  // Nia's upright bass, 1.8 m
  w: 0.8 * K, h: 1.85 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const wood = 0x8a4a24;
    ctx.fillStyle = hex(wood);
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 26, 15, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(w / 2, h - 52, 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(0xfff0d8, 0.25);
    ctx.fillRect(w / 2 - 12, h - 40, 2, 24);
    box(ctx, w / 2 - 2, 4, 4, h - 60, 0x1a1418);
    ctx.fillStyle = hex(0xd8c890);
    for (let k = -2; k <= 1; k++) ctx.fillRect(w / 2 + k * 2, 8, 1, h - 40);
    box(ctx, w / 2 - 1, h - 6, 2, 6, 0x6a6a74);
  },
};

const mic_stand = {
  w: 26, h: 1.6 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, w / 2 - 1, 8, 3, h - 10, 0x6a6a74);
    box(ctx, w / 2 - 10, h - 3, 20, 3, 0x3a3a44);
    box(ctx, w / 2 - 3, 0, 6, 12, 0x2a2a30);
    ctx.fillStyle = rgba(0xfff0d8, 0.4);
    ctx.fillRect(w / 2 - 3, 1, 2, 9);
  },
};

const amp = {
  w: 0.7 * K, h: 0.6 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, 0x1e1c22, 0.2, 0.3);
    ctx.fillStyle = hex(0x3a3440);
    ctx.fillRect(3, 8, w - 6, h - 11);
    box(ctx, 3, 2, w - 6, 5, 0xc8a24a, 0.3, 0.2);
    stamp(ctx, w - 6, 4, 1.4, 0xd04040, 1, 0.2);
  },
};

const monitor_wedge = {
  w: 1.0 * K, h: 0.45 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    ctx.fillStyle = hex(0x1e1c22);
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(6, 0);
    ctx.lineTo(w - 2, h * 0.4);
    ctx.lineTo(w, h);
    ctx.fill();
    ctx.fillStyle = hex(0x3a3440);
    ctx.fillRect(10, 6, w - 22, h - 9);
  },
};

const pendant_bulb = {
  // a bare bulb on a flex, hung from the ceiling (wall prop: its top at y)
  w: 30, h: 70, anchor: [0.5, 0], light: { x: 15, y: 60, r: 120, color: WARM },
  paint(ctx, w, h) {
    ctx.fillStyle = hex(0x1a1418);
    ctx.fillRect(w / 2 - 1, 0, 2, h - 18);
    box(ctx, w / 2 - 4, h - 20, 8, 6, 0x3a3440);
    glow(ctx, w / 2, h - 8, 14, WARM, 0.8);
    stamp(ctx, w / 2, h - 9, 5, 0xfff0c0, 1, 0.3);
  },
};

const pipe_run = {
  // pipes under the cellar ceiling: lagging, brackets, a drip
  w: 12 * 32, h: 28, anchor: [0, 0],
  paint(ctx, w, h) {
    gradientV(ctx, 0, 4, w, 10, [[0, 0x8a7a6a, 1], [1, 0x3a3030, 1]]);
    gradientV(ctx, 0, 16, w, 8, [[0, 0x6a3a2a, 1], [1, 0x2a1a18, 1]]);
    for (let x = 30; x < w; x += 64) box(ctx, x, 0, 6, h, 0x2a2630);
  },
};

const desk_lamp_desk = {
  // Delphine's desk by the door: the sign-up book under a green banker's lamp
  w: 1.4 * K, h: 1.25 * K, anchor: [0.5, 1], light: { x: 18, y: 14, r: 60, color: 0xd8f0a0 },
  paint(ctx, w, h) {
    box(ctx, 0, h * 0.42, w, 6, 0x5a3424);
    box(ctx, 4, h * 0.42 + 6, w - 8, h * 0.58 - 6, 0x3a2018);
    box(ctx, 26, h * 0.42 - 4, 22, 4, 0xe8dcc8);
    box(ctx, 12, 8, 14, 6, 0x2a6a3a, 0.4, 0.2);
    box(ctx, 18, 14, 2, h * 0.42 - 14, 0xc8a24a);
  },
};

const cellar_sign = {
  // inside: the club's name over the stage in blue neon (a wall prop)
  w: 300, h: 60, anchor: [0.5, 0.5], light: { x: 150, y: 30, r: 160, color: NEON },
  paint(ctx, w, h) {
    glow(ctx, w / 2, h / 2, 140, NEON, 0.25);
    neonText(ctx, 'THE BLUE CELLAR', w / 2, h / 2, NEON, { size: 'display' });
  },
};

// ---- backstage -------------------------------------------------------------------
const road_case = {
  // a flight case, 1.2 × 0.8 m: black ply, aluminium edges, stencilled
  w: 1.2 * K, h: 0.8 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, 0x1e1c24, 0.15, 0.3);
    ctx.strokeStyle = hex(0x9a9aa8);
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    for (const [x, y] of [[1, 1], [w - 7, 1], [1, h - 7], [w - 7, h - 7]]) box(ctx, x, y, 6, 6, 0xc8c8d0);
    // lint-allow readability: decoration (a crate's stencil)
    paintGlyphs(ctx, 'FRAGILE', w / 2, h / 2, { size: 'small', color: 0xd8a840, align: 'center', baseline: 'middle' });
  },
};

const case_stack = {
  // two flight cases stacked: 1.6 m (the room's step up to the catwalk)
  w: 2 * 32, h: 2 * 32, anchor: [0, 1],
  paint(ctx, w, h) {
    road_case.paint(ctx, w, h / 2);
    ctx.save();
    ctx.translate(0, h / 2);
    road_case.paint(ctx, w, h / 2);
    ctx.restore();
  },
};

const truss_tower = {
  // a box truss, 0.3 m square, 6 m: lacing on both faces
  w: 24, h: 6 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const al = 0xa8a8b4;
    box(ctx, 0, 0, 3, h, al, 0.4, 0.2);
    box(ctx, w - 3, 0, 3, h, al, 0.4, 0.2);
    ctx.strokeStyle = rgba(al, 0.9);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let y = 0; y < h; y += 22) {
      ctx.moveTo(3, y);
      ctx.lineTo(w - 3, y + 11);
      ctx.lineTo(3, y + 22);
    }
    ctx.stroke();
  },
};

const mirror_station = {
  // a dressing-room mirror ringed with bulbs, on the wall
  w: 2 * K, h: 1.2 * K, anchor: [0.5, 0.5], light: { x: 44, y: 26, r: 90, color: 0xfff0c8 },
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, 0x3a3440);
    gradientV(ctx, 8, 8, w - 16, h - 16, [[0, 0x8a98a8, 1], [1, 0x3a4250, 1]]);
    for (let x = 6; x < w; x += 12) {
      stamp(ctx, x, 4, 2.5, 0xfff0c0, 1, 0.2);
      stamp(ctx, x, h - 4, 2.5, 0xfff0c0, 1, 0.2);
    }
  },
};

const fire_door = {
  // the fire exit to the stairs: a push-bar door, a green running man sign
  w: 1.6 * K, h: 3.0 * K, anchor: [0.5, 1], light: { x: 35, y: 10, r: 60, color: 0x60e090 },
  paint(ctx, w, h) {
    box(ctx, 4, 0.7 * K, w - 8, h - 0.7 * K, 0x4a4a54);
    box(ctx, 12, h - 2.1 * K, w - 24, 2.1 * K, 0x6a2a2a, 0.25, 0.4);
    box(ctx, 16, h - 1.1 * K, w - 32, 5, 0xb8b8c0);
    box(ctx, w / 2 - 30, 4, 60, 22, 0x1a6a3a, 0.3, 0.2);
    paintGlyphs(ctx, 'EXIT', w / 2, 15, { size: 'small', scale: 2, color: 0xe8ffe8, align: 'center', baseline: 'middle' });
  },
};

const catwalk_rail = {
  w: 8 * 32, h: 1.0 * K, anchor: [0, 1],
  paint(ctx, w, h, P) {
    escape_landing.paint(ctx, w, h, P);
  },
};

const work_lamp = {
  // a caged work light clamped high on the wall
  w: 30, h: 30, anchor: [0.5, 0.5], light: { x: 15, y: 18, r: 110, color: 0xf2e6cc },
  paint(ctx, w, h) {
    box(ctx, 6, 2, 18, 14, 0x2a2a30);
    glow(ctx, 15, 18, 12, 0xfff0d0, 0.9);
    ctx.strokeStyle = hex(0x2a2a30);
    for (let x = 7; x < 24; x += 4) ctx.strokeRect(x, 14, 0.5, 10);
  },
};

const sofa = {
  // the green room's tired sofa
  w: 2.0 * K, h: 0.85 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h * 0.6, 0x4a5a3a);
    box(ctx, 0, h * 0.45, w, h * 0.4, 0x5a6a44);
    box(ctx, 0, h * 0.2, 10, h * 0.7, 0x3a4a2e);
    box(ctx, w - 10, h * 0.2, 10, h * 0.7, 0x3a4a2e);
    box(ctx, 6, h - 5, 6, 5, 0x1a1418);
    box(ctx, w - 12, h - 5, 6, 5, 0x1a1418);
  },
};

// ---- the fire stairs -------------------------------------------------------------
const building_face = {
  // the theatre's brick flank, nine storeys of it, the stairs bolted to it
  w: 21 * 32, h: 44 * 32, anchor: [0, 1],
  paint(ctx, w, h) {
    const r = rand(77);
    drawBuilding(ctx, 0, h, { s: 1, w, storeys: 9, ground: 'plain', bays: 7, wall: 0x6a3a34, roof: 'parapet', roofCol: 0x2a1a20, lit: 0.35, quoins: false, balconies: false }, r);
    ctx.fillStyle = rgba(NIGHT, 0.35);
    ctx.fillRect(0, 0, w, h);
    gradientV(ctx, 0, 0, w, h, [[0, NIGHT, 0.2], [1, NIGHT, 0]]);
  },
};

// ---- the Big Stage ---------------------------------------------------------------
const speaker_stack = {
  // a PA wing: 1.2 m wide, 3.6 m of boxes
  w: 1.3 * K, h: 3.6 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    for (let y = 0; y < h - 4; y += h / 4) {
      box(ctx, 0, y, w, h / 4 - 3, 0x1a1820, 0.15, 0.3);
      ctx.fillStyle = hex(0x2e2c36);
      ctx.beginPath();
      ctx.arc(w / 2, y + h / 8, h / 12, 0, Math.PI * 2);
      ctx.fill();
      stamp(ctx, w / 2, y + h / 8, 3, 0x4a4856, 1, 0.3);
    }
  },
};

const light_truss = {
  // the overhead truss with par cans (a wall prop hung high, in front)
  w: 24 * 32, h: 60, anchor: [0, 0],
  paint(ctx, w, h) {
    const al = 0xa8a8b4;
    box(ctx, 0, 0, w, 3, al, 0.4, 0.2);
    box(ctx, 0, 17, w, 3, al, 0.4, 0.2);
    ctx.strokeStyle = rgba(al, 0.9);
    ctx.beginPath();
    for (let x = 0; x < w; x += 20) {
      ctx.moveTo(x, 3);
      ctx.lineTo(x + 10, 17);
      ctx.lineTo(x + 20, 3);
    }
    ctx.stroke();
    for (let x = 40; x < w - 20; x += 64) {
      box(ctx, x - 7, 20, 14, 18, 0x1a1820);
      stamp(ctx, x, 40, 5, 0xf2d0ff, 0.9, 0.3);
    }
  },
};

const stage_lights_on = {
  // the wash: beams from the truss down onto the deck (live, gone after)
  w: 24 * 32, h: 9 * 32, anchor: [0, 0], live: true,
  paint(ctx, w, h) {
    ctx.globalCompositeOperation = 'lighter';
    const cols = [0xd040c0, 0x40c0e0, 0xf2e6cc, 0xd040c0, 0x40c0e0, 0xf2d580];
    let i = 0;
    for (let x = 40; x < w - 20; x += 64, i++) {
      const c = cols[i % cols.length];
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, rgba(c, 0.32));
      g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 6, 40);
      ctx.lineTo(x + 6, 40);
      ctx.lineTo(x + 50 + (i % 2) * 20, h);
      ctx.lineTo(x - 50 - (i % 3) * 10, h);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  },
};

const drum_riser = {
  w: 3 * K, h: 0.5 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, 0x1a1820, 0.2, 0.3);
    ctx.fillStyle = hex(0x2a2830);
    ctx.fillRect(4, 4, w - 8, 3);
  },
};

const folding_chair = {
  // a folding chair, Jo's case on the seat (the last thing in the dream)
  w: 1.0 * K, h: 0.9 * K, anchor: [0.5, 1],
  paint(ctx, w, h) {
    const st = 0x8a8a98;
    ctx.strokeStyle = hex(st);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, h);
    ctx.lineTo(28, h * 0.5);
    ctx.moveTo(28, h);
    ctx.lineTo(8, h * 0.5);
    ctx.moveTo(26, h * 0.5);
    ctx.lineTo(24, 2);
    ctx.stroke();
    box(ctx, 6, h * 0.5 - 2, 24, 4, 0x6a6a78);
    box(ctx, 20, 4, 10, h * 0.35, 0x6a6a78);
    // the battered case
    box(ctx, 4, h * 0.5 - 16, 30, 14, 0x5a4632, 0.25, 0.3);
    box(ctx, 16, h * 0.5 - 19, 8, 3, 0x3a3222);
  },
};

const crowd_front = {
  // eight thousand: heads and arms over the front of the stage (fg)
  w: 30 * 32, h: 130, anchor: [0, 1], live: true,
  paint(ctx, w, h, P) {
    const c = paintBackdropLayer('crowd', { sky: 0x8a4a9a, deep: 0x1e1430, house: 0x2a2030, window: WARM, light: WARM, mist: 0x3a1a4a, mistA: 0 }, 7);
    for (let x = 0; x < w; x += c.width) ctx.drawImage(c, x, h - c.height);
    // the stage wash catches the tops of their heads (magenta, then cyan)
    ctx.globalCompositeOperation = 'source-atop';
    const g = ctx.createLinearGradient(0, h - c.height, 0, h);
    g.addColorStop(0, rgba(0xf0a0f0, 0.55));
    g.addColorStop(0.35, rgba(0x60c0e0, 0.18));
    g.addColorStop(1, rgba(NIGHT, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    void P;
  },
};

const work_lights = {
  // after: the house lights up, flat and grey (live, when the set is done)
  w: 24 * 32, h: 9 * 32, anchor: [0, 0], live: true,
  paint(ctx, w, h) {
    gradientV(ctx, 0, 0, w, h, [[0, 0xf2e6cc, 0.12], [1, 0xf2e6cc, 0]]);
  },
};

const banner = {
  // the festival banner over the stage
  w: 14 * 32, h: 70, anchor: [0.5, 0],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, 0x1a1428, 0.1, 0.3);
    ctx.strokeStyle = hex(0xc8a24a);
    ctx.strokeRect(3, 3, w - 6, h - 6);
    neonText(ctx, 'MERIDIAN JAZZ FESTIVAL', w / 2, h / 2, 0xf2d580, { size: 'display' });
  },
};

export default {
  theatre_front, horn_shop, cellar_front, brick_row, street_lamp, bus_shelter, parked_car, dumpster, street_tree, alley_arch, hydrant,
  stage_door, neon_dead: neonSign(false), neon_lit: neonSign(true), escape_landing, roller_door, poster_board,
  bar_counter, back_bar, club_chair, club_table, piano_upright, drum_kit, double_bass, mic_stand, amp, monitor_wedge, pendant_bulb, pipe_run, desk_lamp_desk, cellar_sign,
  road_case, case_stack, truss_tower, mirror_station, fire_door, catwalk_rail, work_lamp, sofa,
  building_face,
  speaker_stack, light_truss, stage_lights_on, drum_riser, folding_chair, crowd_front, work_lights, banner,
};
