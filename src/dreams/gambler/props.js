// THE LAST HAND's props (FRAMEWORK §4.3): the Lantern Queen and Port Merrow,
// painted in code at the scale system's 1 m = 44 px (Jo is 1.8 m). Real
// materials of the river in 1884: white-painted pine and gingerbread
// fretwork outside, walnut panelling, brass, cut glass and Brussels carpet
// in the saloon, green baize in the card room, an iron and brass cage at
// the purser's, tarred line and sheet iron up top. No lattice patterns, no
// neon. Words are never painted here: every sign is a `sign` entity in the
// bitmap font on its board (src/play/dreamAdapters.js spawnSign).
//   { w, h, anchor: [ax, ay], paint(ctx, w, h, P), light?, live? }
import { mix, rgba, hex, stamp, gradientV, grain } from '../../art/paint.js';

const K = 44; // px per metre
const NIGHT = 0x14122a;
const WARM = 0xffc870;
const LAMP = 0xffd890;
const BRASS = 0xc8a050;
const BRASS_DK = 0x7a5a24;
const WALNUT = 0x4a2a1a;
const WALNUT_DK = 0x2a160e;
const PINE_WHITE = 0xe8e2d0; // the boat's paint
const CLARET = 0x6a2430;
const BAIZE = 0x1e5a3a;
const IRON = 0x2a2630;

// a lit rectangle: top and west edge lit, east and bottom in shade
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

// planks laid across (a deck, a gangway): boards with caulked seams and grain
function planks(ctx, x, y, w, h, col, seam = 6) {
  ctx.fillStyle = hex(col);
  ctx.fillRect(x, y, w, h);
  for (let yy = y + seam; yy < y + h; yy += seam) {
    ctx.fillStyle = rgba(0x14100e, 0.45);
    ctx.fillRect(x, yy, w, 1);
  }
  for (let i = 0; i < w / 9; i++) {
    ctx.fillStyle = rgba(0xfff4dc, 0.06);
    ctx.fillRect(x + ((i * 37) % w), y + ((i * 13) % h), 6, 1);
  }
}

// a turned brass or walnut baluster rail (a stair, the guard, the gallery)
function rail(ctx, x, y, w, h, col, every = 10) {
  ctx.fillStyle = hex(col);
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y + h - 2, w, 2);
  for (let xx = x + 3; xx < x + w - 2; xx += every) {
    ctx.fillRect(xx, y + 3, 2, h - 5);
    ctx.fillRect(xx - 1, y + h / 2, 4, 2);
  }
  ctx.fillStyle = rgba(0xfff4dc, 0.3);
  ctx.fillRect(x, y, w, 1);
}

// a panelled door with a transom light (the boat's staterooms and offices)
function door(ctx, x, y, w, h, wood, lit) {
  box(ctx, x - 4, y - 6, w + 8, h + 6, mix(wood, 0x000000, 0.3), 0.15, 0.4);
  box(ctx, x, y + 12, w, h - 12, wood, 0.18, 0.35);
  ctx.fillStyle = hex(lit ? 0xf2c880 : 0x2a2430);
  ctx.fillRect(x + 2, y, w - 4, 9);
  if (lit) glow(ctx, x + w / 2, y + 4, 20, WARM, 0.3);
  for (const [py, ph] of [[y + 18, (h - 30) * 0.45], [y + 22 + (h - 30) * 0.45, (h - 30) * 0.45]]) {
    box(ctx, x + 4, py, w / 2 - 6, ph, mix(wood, 0x000000, 0.15), 0.1, 0.3);
    box(ctx, x + w / 2 + 2, py, w / 2 - 6, ph, mix(wood, 0x000000, 0.15), 0.1, 0.3);
  }
  stamp(ctx, x + w - 6, y + h * 0.58, 1.8, BRASS, 1, 0.2);
}

// a playing card at table scale (6 × 9 cm is 3 × 4 px: a pip of white)
function tinyCard(ctx, x, y, back = false) {
  ctx.fillStyle = hex(back ? 0x8a2a2a : 0xf2ead8);
  ctx.fillRect(x, y, 3, 2);
}

// ---- the quay: Port Merrow at dusk ------------------------------------------
// the Lantern Queen alongside: a white side-wheel packet of 1884, from her
// main deck up (the deck itself is the terrain). Boiler deck with its
// arched cabin windows lit, the texas, the pilot house and two tall chimneys
// with feathered crowns; the paddlebox with its fan of rays. 30 m of her.
const lq_boat = {
  w: Math.round(30 * K),
  h: Math.round(17 * K),
  anchor: [0, 1],
  paint(ctx, w, h) {
    const deck = h; // the main deck line (the canvas bottom)
    const boiler = deck - Math.round(3.4 * K);
    const texas = boiler - Math.round(3.2 * K);
    // the main deck: posts, the freight in shadow, the boilers' glow
    ctx.fillStyle = hex(0x1a1418);
    ctx.fillRect(0, boiler, w, deck - boiler);
    glow(ctx, w * 0.62, deck - 30, 110, 0xff8a3a, 0.35);
    for (let x = 10; x < w; x += Math.round(2.6 * K)) box(ctx, x, boiler + 6, 6, deck - boiler - 6, PINE_WHITE, 0.25, 0.3);
    // cotton bales and barrels stowed forward, in silhouette
    for (let x = 30; x < w * 0.4; x += 46) {
      box(ctx, x, deck - 34, 40, 34, 0x8a7a62, 0.12, 0.4);
      ctx.fillStyle = rgba(0x2a2018, 0.6);
      ctx.fillRect(x, deck - 24, 40, 2);
      ctx.fillRect(x, deck - 12, 40, 2);
    }
    // the boiler deck: the guard, its rail and the cabin wall of arched windows
    box(ctx, 0, boiler - 8, w, 10, PINE_WHITE, 0.3, 0.3);
    box(ctx, 0, texas, w, boiler - texas - 8, mix(PINE_WHITE, 0xd8c8a8, 0.3), 0.2, 0.25);
    for (let x = 18; x < w - 20; x += 30) {
      const lit = (x * 7) % 5 !== 0;
      ctx.fillStyle = hex(lit ? 0xf2c070 : 0x3a3448);
      ctx.beginPath();
      ctx.moveTo(x, texas + 70);
      ctx.lineTo(x, texas + 30);
      ctx.arc(x + 8, texas + 30, 8, Math.PI, 0);
      ctx.lineTo(x + 16, texas + 70);
      ctx.fill();
      if (lit) glow(ctx, x + 8, texas + 45, 26, WARM, 0.22);
      ctx.fillStyle = rgba(NIGHT, 0.35);
      ctx.fillRect(x + 7, texas + 24, 2, 46);
    }
    rail(ctx, 0, boiler - 34, w, 26, PINE_WHITE, 9);
    // gingerbread under the eaves: a scalloped fret, painted white
    ctx.fillStyle = hex(PINE_WHITE);
    for (let x = 0; x < w; x += 12) {
      ctx.beginPath();
      ctx.arc(x + 6, texas + 4, 6, 0, Math.PI);
      ctx.fill();
    }
    box(ctx, 0, texas - 6, w, 8, PINE_WHITE, 0.3, 0.3);
    // the texas deck and its cabins (short), the pilot house on top, aft
    const tx0 = w * 0.3;
    const tx1 = w * 0.78;
    box(ctx, tx0, texas - Math.round(2.6 * K), tx1 - tx0, Math.round(2.6 * K) - 6, mix(PINE_WHITE, 0xc8bca0, 0.35), 0.2, 0.3);
    for (let x = tx0 + 14; x < tx1 - 20; x += 26) {
      ctx.fillStyle = hex((x * 3) % 4 ? 0x3a3448 : 0xe8b060);
      ctx.fillRect(x, texas - 2 * K, 10, 14);
    }
    const ph = Math.round(2.4 * K);
    const px = tx1 - 120;
    const py = texas - Math.round(2.6 * K) - ph;
    box(ctx, px, py + 8, 110, ph - 8, PINE_WHITE, 0.25, 0.3);
    for (let x = px + 8; x < px + 100; x += 20) {
      ctx.fillStyle = hex(0x6a7a8a);
      ctx.fillRect(x, py + 18, 14, 30);
      glow(ctx, x + 7, py + 30, 14, LAMP, 0.25);
    }
    ctx.fillStyle = hex(0x5a2a2a);
    ctx.beginPath();
    ctx.moveTo(px - 8, py + 10);
    ctx.quadraticCurveTo(px + 55, py - 10, px + 118, py + 10);
    ctx.fill();
    // the chimneys: tall, black, the crowns cut into feathers, a brace between
    const chH = Math.round(14 * K);
    for (const cx of [w * 0.42, w * 0.52]) {
      const top = deck - chH;
      gradientV(ctx, cx - 14, top + 20, 28, chH - 20 - (deck - texas), [[0, 0x2a2630, 1], [1, 0x14121a, 1]]);
      ctx.fillStyle = rgba(0xfff4dc, 0.12);
      ctx.fillRect(cx - 12, top + 20, 3, chH - 20 - (deck - texas));
      ctx.fillStyle = hex(0x1e1a22);
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 22 + i * 5, top + 22);
        ctx.lineTo(cx - 20 + i * 5, top + 2 + (i % 2) * 6);
        ctx.lineTo(cx - 17 + i * 5, top + 22);
        ctx.fill();
      }
      box(ctx, cx - 22, top + 20, 44, 6, BRASS_DK, 0.2, 0.3);
    }
    ctx.strokeStyle = hex(0x1e1a22);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.42, deck - chH + 90);
    ctx.lineTo(w * 0.52, deck - chH + 90);
    ctx.stroke();
    // the paddlebox: a half wheel's housing with its fan of rays, the name board above
    const bx = w * 0.7;
    const br = Math.round(4.2 * K);
    ctx.fillStyle = hex(PINE_WHITE);
    ctx.beginPath();
    ctx.arc(bx, boiler + 8, br, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = hex(0xc8bca0);
    for (let i = 0; i < 13; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      ctx.save();
      ctx.translate(bx, boiler + 8);
      ctx.rotate(a);
      ctx.fillRect(18, -2, br - 24, 4);
      ctx.restore();
    }
    stamp(ctx, bx, boiler + 6, 16, 0xd8a840, 1, 0.2);
    ctx.fillStyle = hex(0x2a2018);
    ctx.fillRect(bx - br, boiler + 6, br * 2, 4);
    grain(ctx, 0, 0, w, h, 0.03, 9);
  },
};

// the gangway: the stage plank from the quay to the main deck, rope rails
const gangway = {
  w: Math.round(4.4 * K),
  h: 44,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    planks(ctx, 0, h - 10, w, 8, 0x8a6a42, 4);
    ctx.fillStyle = hex(0x3a2a1a);
    for (let x = 4; x < w; x += 30) ctx.fillRect(x, h - 40, 3, 32);
    ctx.strokeStyle = hex(0xc8b080);
    ctx.lineWidth = 2;
    for (const y of [h - 40, h - 26]) {
      ctx.beginPath();
      ctx.moveTo(4, y);
      for (let x = 4; x < w; x += 30) ctx.quadraticCurveTo(x + 15, y + 6, x + 30, y);
      ctx.stroke();
    }
  },
};

// a gas lamp on an iron post (Port Merrow's quay), lit
const gas_lamp = {
  w: 36,
  h: Math.round(3.9 * K),
  anchor: [0.5, 1],
  light: { x: 18, y: 18, r: 150, color: 0xffd080 },
  paint(ctx, w, h) {
    box(ctx, w / 2 - 6, h - 14, 12, 14, IRON, 0.15, 0.4);
    box(ctx, w / 2 - 3, 30, 6, h - 44, IRON, 0.2, 0.4);
    box(ctx, w / 2 - 9, 26, 18, 5, IRON, 0.2, 0.4);
    ctx.fillStyle = hex(0xfff0c0);
    ctx.beginPath();
    ctx.moveTo(w / 2 - 8, 26);
    ctx.lineTo(w / 2 - 11, 8);
    ctx.lineTo(w / 2 + 11, 8);
    ctx.lineTo(w / 2 + 8, 26);
    ctx.fill();
    glow(ctx, w / 2, 17, 16, LAMP, 0.7);
    ctx.fillStyle = hex(IRON);
    ctx.fillRect(w / 2 - 12, 5, 24, 4);
    ctx.beginPath();
    ctx.moveTo(w / 2 - 8, 5);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w / 2 + 8, 5);
    ctx.fill();
  },
};

// an iron bollard with a hawser made fast round it
const bollard = {
  w: 34,
  h: 30,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 7, 8, 20, h - 8, IRON, 0.2, 0.4);
    box(ctx, 4, 4, 26, 6, 0x3a3440, 0.25, 0.4);
    ctx.strokeStyle = hex(0xb8a078);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(w / 2, 16, 13, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - 4, 16);
    ctx.lineTo(w, 10);
    ctx.stroke();
  },
};

// cotton bales stacked two high (1.5 × 0.7 m each), hooped, the quay's freight
const bales = {
  w: Math.round(1.6 * K) * 2,
  h: 64,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    const bw = w / 2;
    for (const [x, y] of [[0, 32], [bw, 32], [bw / 2, 0]]) {
      box(ctx, x + 1, y + 1, bw - 2, 30, 0xd8ccb0, 0.25, 0.35);
      ctx.fillStyle = rgba(0x6a5a40, 0.25);
      for (let i = 0; i < 8; i++) ctx.fillRect(x + 4 + i * 8, y + 4 + ((i * 5) % 20), 4, 1);
      ctx.fillStyle = hex(0x5a4a36);
      for (const hx of [0.25, 0.5, 0.75]) ctx.fillRect(x + bw * hx, y + 1, 2, 30);
    }
  },
};

// a stack of crates (the line's freight), two high
const crates = {
  w: 70,
  h: 64,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    for (const [x, y, s] of [[2, 32, 32], [36, 32, 32], [18, 0, 32]]) {
      box(ctx, x, y, s, s, 0x8a6a42, 0.22, 0.4);
      ctx.strokeStyle = hex(0x5a4228);
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, s - 6, s - 6);
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 3);
      ctx.lineTo(x + s - 3, y + s - 3);
      ctx.stroke();
    }
  },
};

// the wharf office: a clapboard shed on the quay, its window lit, a bench
const wharf_office = {
  w: Math.round(6 * K),
  h: Math.round(4.6 * K),
  anchor: [0.5, 1],
  light: { x: 70, y: 120, r: 120, color: WARM },
  paint(ctx, w, h) {
    const top = 34;
    ctx.fillStyle = hex(0x6a6258);
    for (let y = top; y < h; y += 7) {
      ctx.fillRect(0, y, w, 6);
      ctx.fillStyle = hex(y % 14 ? 0x6a6258 : 0x625a50);
    }
    for (let y = top + 6; y < h; y += 7) {
      ctx.fillStyle = rgba(NIGHT, 0.35);
      ctx.fillRect(0, y, w, 1);
    }
    ctx.fillStyle = hex(0x3a2a24);
    ctx.beginPath();
    ctx.moveTo(-6, top + 2);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w + 6, top + 2);
    ctx.fill();
    box(ctx, 40, 90, 60, 50, 0x3a3028, 0.2, 0.4);
    ctx.fillStyle = hex(0xf2c070);
    ctx.fillRect(44, 94, 52, 42);
    glow(ctx, 70, 115, 40, WARM, 0.3);
    ctx.fillStyle = hex(0x3a3028);
    ctx.fillRect(69, 94, 2, 42);
    ctx.fillRect(44, 114, 52, 2);
    door(ctx, w - 80, h - Math.round(2.2 * K), 46, Math.round(2.2 * K), 0x4a3424, false);
  },
};

// the gangway slate: a chalk slate on an easel by the purser's clerk
const slate_easel = {
  w: 60,
  h: Math.round(1.7 * K),
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    ctx.strokeStyle = hex(0x5a4228);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, h);
    ctx.lineTo(26, 6);
    ctx.moveTo(w - 10, h);
    ctx.lineTo(w - 26, 6);
    ctx.moveTo(w / 2, h);
    ctx.lineTo(w / 2, 20);
    ctx.stroke();
    box(ctx, 4, 6, w - 8, 44, 0x6a4a2e, 0.25, 0.35);
    box(ctx, 8, 10, w - 16, 36, 0x2a3030, 0.06, 0.2);
    ctx.fillStyle = rgba(0xe8e8e0, 0.55);
    for (let i = 0; i < 3; i++) ctx.fillRect(13, 16 + i * 10, 16 + ((i * 11) % 14), 2);
    box(ctx, 6, 50, w - 12, 4, 0x6a4a2e, 0.25, 0.35);
    ctx.fillStyle = hex(0xf2ead8);
    ctx.fillRect(w - 20, 48, 6, 2);
  },
};

// a panelled cabin door with its transom, the boat's (a door portal stands here)
const cabin_door = {
  w: Math.round(1.1 * K) + 12,
  h: Math.round(2.3 * K) + 6,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    door(ctx, 6, 6, w - 12, h - 6, WALNUT, true);
  },
};
// the same in the boat's white paint (outside)
const cabin_door_white = {
  w: cabin_door.w,
  h: cabin_door.h,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    door(ctx, 6, 6, w - 12, h - 6, 0xd8d0bc, true);
  },
};

// ---- the main saloon ---------------------------------------------------------
// a crystal chandelier on a brass stem: three tiers of drops round oil lamps
const chandelier = {
  w: 64,
  h: 74,
  anchor: [0.5, 0],
  light: { x: 32, y: 48, r: 170, color: 0xffd890 },
  paint(ctx, w, h) {
    ctx.fillStyle = hex(BRASS_DK);
    ctx.fillRect(w / 2 - 1, 0, 3, 30);
    stamp(ctx, w / 2, 30, 5, BRASS, 1, 0.2);
    for (const [y, r] of [[38, 26], [48, 20], [58, 12]]) {
      ctx.strokeStyle = hex(BRASS);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(w / 2, y, r, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < r / 3; i++) {
        const x = w / 2 - r + (i * 2 * r) / (r / 3);
        stamp(ctx, x, y + 5, 1.6, 0xf2f0ff, 0.9, 0.2);
      }
    }
    for (const x of [w / 2 - 22, w / 2, w / 2 + 22]) {
      ctx.fillStyle = hex(0xfff0c8);
      ctx.fillRect(x - 2, 30, 4, 7);
      glow(ctx, x, 32, 10, LAMP, 0.8);
    }
    stamp(ctx, w / 2, h - 6, 3, 0xf2f0ff, 1, 0.2);
  },
};

// the back bar: walnut, a long mirror, decanters and glasses lit by the lamps
const back_bar = {
  w: Math.round(7 * K),
  h: Math.round(2.6 * K),
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, WALNUT, 0.15, 0.4);
    gradientV(ctx, 10, 10, w - 20, 50, [[0, 0x5a5a6a, 1], [1, 0x2a2a3a, 1]]);
    ctx.fillStyle = rgba(0xffffff, 0.12);
    for (let x = 30; x < w; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x + 18, 10);
      ctx.lineTo(x - 8, 60);
      ctx.lineTo(x - 26, 60);
      ctx.fill();
    }
    for (const sy of [70, 92]) {
      box(ctx, 6, sy, w - 12, 4, WALNUT_DK, 0.2, 0.3);
      for (let x = 14; x < w - 14; x += 11) {
        const kind = (x * 13 + sy) % 3;
        ctx.fillStyle = hex([0x6a3a1a, 0x2e4a2a, 0xd8c8a0][kind]);
        const bh = kind === 2 ? 7 : 14;
        ctx.fillRect(x, sy - bh, 5, bh);
        ctx.fillRect(x + 1, sy - bh - 4, 3, 4);
        stamp(ctx, x + 1, sy - bh + 3, 1, 0xffffff, 0.4, 0.2);
      }
    }
  },
};

// the bar counter: walnut, a brass foot rail, a marble top (1.1 m)
const bar_counter = {
  w: Math.round(7 * K),
  h: Math.round(1.1 * K),
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, 6, 0xd8d0c4, 0.4, 0.2);
    box(ctx, 4, 6, w - 8, h - 6, WALNUT, 0.15, 0.4);
    for (let x = 14; x < w - 20; x += 46) box(ctx, x, 12, 36, h - 22, WALNUT_DK, 0.1, 0.3);
    ctx.fillStyle = hex(BRASS);
    ctx.fillRect(0, h - 10, w, 3);
    for (let x = 6; x < w; x += 60) ctx.fillRect(x, h - 10, 2, 10);
    for (let x = 40; x < w; x += 90) {
      ctx.fillStyle = rgba(0xe8f0ff, 0.6);
      ctx.fillRect(x, -6, 4, 6);
    }
  },
};

// the band's riser: a step of walnut with a fringe, a parlour upright on it
const bandstand = {
  w: Math.round(7 * K),
  h: Math.round(1.6 * K) + 14,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, h - 14, w, 14, WALNUT, 0.2, 0.4);
    ctx.fillStyle = hex(CLARET);
    ctx.fillRect(0, h - 8, w, 6);
    ctx.fillStyle = hex(BRASS);
    for (let x = 2; x < w; x += 6) ctx.fillRect(x, h - 3, 2, 3);
    // the upright piano at the left of the riser
    box(ctx, 10, h - 14 - Math.round(1.3 * K), Math.round(1.5 * K), Math.round(1.3 * K), 0x2a1a12, 0.12, 0.4);
    ctx.fillStyle = hex(0xf2ead8);
    ctx.fillRect(14, h - 14 - 26, Math.round(1.5 * K) - 8, 4);
    for (let x = 16; x < 10 + Math.round(1.5 * K) - 6; x += 4) {
      ctx.fillStyle = hex(0x14121a);
      ctx.fillRect(x, h - 14 - 26, 2, 2);
    }
    for (const cx of [26, 52]) stamp(ctx, cx, h - 14 - Math.round(1.3 * K) + 10, 3, 0xffd890, 0.9, 0.3);
    // a snare on its stand at the right
    const sx = w - 40;
    ctx.fillStyle = hex(IRON);
    ctx.fillRect(sx, h - 40, 2, 26);
    box(ctx, sx - 14, h - 52, 30, 12, 0xd8ccb0, 0.3, 0.3);
    ctx.fillStyle = hex(CLARET);
    ctx.fillRect(sx - 14, h - 48, 30, 3);
  },
};

// the faro table: the enamelled layout of thirteen spades on green baize,
// the dealer's box (a brass card box with a slot), the casekeeper's abacus
const faro_table = {
  w: Math.round(2.4 * K),
  h: Math.round(0.8 * K) + 26,
  anchor: [0.5, 1],
  light: { x: 52, y: 0, r: 110, color: WARM },
  paint(ctx, w, h) {
    const top = 26;
    box(ctx, 0, top, w, 8, BAIZE, 0.2, 0.3);
    box(ctx, 4, top + 8, w - 8, 10, WALNUT, 0.2, 0.4);
    for (const x of [10, w - 14]) box(ctx, x, top + 18, 5, h - top - 18, WALNUT_DK, 0.15, 0.4);
    // the layout: thirteen cards in two rows, flat on the baize (the face
    // up the table: seen edge on, a row of ivory)
    for (let i = 0; i < 13; i++) tinyCard(ctx, 8 + i * 6.5, top + 2);
    // the box and the abacus stand on the table
    box(ctx, w - 30, top - 10, 14, 10, BRASS, 0.3, 0.3);
    box(ctx, 6, top - 16, 22, 16, WALNUT_DK, 0.2, 0.3);
    for (let r = 0; r < 4; r++) for (let b = 0; b < 5; b++) stamp(ctx, 9 + b * 4, top - 13 + r * 4, 1.2, b < r + 1 ? 0xf2ead8 : 0x8a2a2a, 1, 0.2);
    // chips in front of the bank: a stack of checks, a stack of coin
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = hex(k % 2 ? 0x8a2a2a : 0xf2ead8);
      ctx.fillRect(w / 2 - 4, top - 2 - k * 2, 8, 2);
    }
  },
};

// a saloon chair: bentwood, cane seat
const saloon_chair = {
  w: 28,
  h: Math.round(0.95 * K),
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    ctx.strokeStyle = hex(0x5a3420);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, h);
    ctx.lineTo(9, h - 20);
    ctx.lineTo(8, 4);
    ctx.quadraticCurveTo(6, 0, 12, 2);
    ctx.moveTo(w - 6, h);
    ctx.lineTo(w - 7, h - 20);
    ctx.stroke();
    box(ctx, 6, h - 22, w - 10, 4, 0xc8a870, 0.3, 0.3);
  },
};

// a stained glass clerestory light (the saloon's ceiling band), lit from outside
const clerestory = {
  w: 70,
  h: 26,
  anchor: [0.5, 0],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, WALNUT_DK, 0.1, 0.3);
    const cols = [0xc8a050, 0x8a2a3a, 0x3a6a8a, 0x5a8a4a];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = hex(cols[i % 4]);
      ctx.fillRect(4 + i * 10.5, 4, 9, h - 8);
      ctx.fillStyle = rgba(0xffffff, 0.2);
      ctx.fillRect(4 + i * 10.5, 4, 9, 3);
    }
  },
};

// a carpet runner on the saloon floor (Brussels weave: a border, a medallion)
const carpet_runner = {
  w: 16 * 32,
  h: 6,
  anchor: [0, 1],
  paint(ctx, w, h) {
    ctx.fillStyle = hex(CLARET);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hex(0xb08a3a);
    ctx.fillRect(0, 1, w, 1);
    ctx.fillRect(0, h - 2, w, 1);
    for (let x = 10; x < w; x += 24) {
      ctx.fillStyle = hex(0x2e4a3a);
      ctx.fillRect(x, 2, 6, 2);
    }
  },
};

// a stateroom door between the saloon's panels: walnut, a transom of coloured glass
const stateroom = {
  w: Math.round(1 * K) + 10,
  h: Math.round(2.3 * K) + 6,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    door(ctx, 5, 6, w - 10, h - 6, 0x5a3420, false);
    const c = [0xc8a050, 0x8a2a3a, 0x3a6a8a];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = hex(c[i]);
      ctx.fillRect(9 + i * ((w - 18) / 3), 7, (w - 18) / 3 - 1, 7);
    }
  },
};

// ---- the card room -----------------------------------------------------------
// a round card table, green baize on walnut, 1.5 m across, 0.75 m high,
// a few cards and a stack of checks in front of each place
const card_table = {
  w: Math.round(1.6 * K),
  h: Math.round(0.78 * K),
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    ctx.fillStyle = hex(BAIZE);
    ctx.beginPath();
    ctx.ellipse(w / 2, 6, w / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(0xfff4dc, 0.12);
    ctx.fillRect(6, 3, w - 12, 1);
    box(ctx, 2, 8, w - 4, 6, WALNUT, 0.25, 0.4);
    box(ctx, w / 2 - 4, 14, 8, h - 20, WALNUT_DK, 0.15, 0.4);
    box(ctx, w / 2 - 16, h - 6, 32, 6, WALNUT_DK, 0.15, 0.4);
    tinyCard(ctx, 14, 3, true);
    tinyCard(ctx, w - 18, 3, true);
    tinyCard(ctx, w / 2 - 1, 4);
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = hex(k % 2 ? 0xf2ead8 : 0x8a2a2a);
      ctx.fillRect(w / 2 + 8, 2 - k * 2, 5, 2);
    }
  },
};

// the lamp over a card table: a green glass shade on a brass chain
const table_lamp = {
  w: 60,
  h: 120,
  anchor: [0.5, 0],
  light: { x: 30, y: 110, r: 130, color: 0xffe0a0 },
  paint(ctx, w, h) {
    ctx.fillStyle = hex(BRASS_DK);
    for (let y = 0; y < h - 22; y += 4) ctx.fillRect(w / 2 - 1, y, 2, 3);
    ctx.fillStyle = hex(0x2e6a4a);
    ctx.beginPath();
    ctx.moveTo(w / 2 - 6, h - 24);
    ctx.lineTo(w / 2 + 6, h - 24);
    ctx.lineTo(w / 2 + 24, h - 10);
    ctx.lineTo(w / 2 - 24, h - 10);
    ctx.fill();
    ctx.fillStyle = rgba(0xfff4dc, 0.25);
    ctx.fillRect(w / 2 - 20, h - 13, 40, 2);
    glow(ctx, w / 2, h - 6, 18, LAMP, 0.7);
    ctx.fillStyle = hex(0xfff0c0);
    ctx.fillRect(w / 2 - 6, h - 10, 12, 3);
  },
};

// the guard through open French doors: the rail, the river at night
// beyond (the far bank, a light or two, the paddlewheel's wake). The card
// room's air: tilt comes down while Jo walks here.
const guard_view = {
  w: 10 * 32,
  h: 8 * 32,
  anchor: [0, 1],
  paint(ctx, w, h) {
    gradientV(ctx, 0, 0, w, h, [[0, 0x141a30, 1], [0.6, 0x2a2e48, 1], [1, 0x1a2030, 1]]);
    for (let i = 0; i < 26; i++) stamp(ctx, (i * 97) % w, (i * 41) % (h * 0.45), i % 5 ? 0.7 : 1.2, 0xfff6e0, 0.8, 0.3);
    // the far bank and its trees, one lamp in a window
    ctx.fillStyle = hex(0x10141e);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.62);
    for (let x = 0; x <= w; x += 16) ctx.lineTo(x, h * 0.6 - ((x * 7) % 13));
    ctx.lineTo(w, h * 0.66);
    ctx.lineTo(0, h * 0.66);
    ctx.fill();
    stamp(ctx, w * 0.7, h * 0.6, 2, 0xffc060, 1, 0.3);
    // the river: dark, a moon's broken path
    gradientV(ctx, 0, h * 0.66, w, h * 0.34, [[0, 0x1e2840, 1], [1, 0x0c1018, 1]]);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = rgba(0xd8e0f0, 0.25);
      ctx.fillRect(w * 0.35 + ((i * 29) % 70) - 30, h * 0.68 + i * 4, 20 + ((i * 13) % 20), 1);
    }
    // the French doors folded back at each side, walnut and glass
    for (const x of [0, w - 26]) {
      box(ctx, x, 0, 26, h, WALNUT, 0.2, 0.4);
      for (let y = 10; y < h * 0.7; y += 34) {
        ctx.fillStyle = rgba(0x8aa0c0, 0.3);
        ctx.fillRect(x + 5, y, 16, 28);
      }
    }
    // the guard rail: a white rail on turned posts
    rail(ctx, 26, h - 46, w - 52, 30, PINE_WHITE, 12);
  },
};

// ---- the purser's office -------------------------------------------------------
// the cage: an iron and brass grille over a walnut counter, the window cut in it
const purser_cage = {
  w: Math.round(4.6 * K),
  h: Math.round(2.9 * K),
  anchor: [0.5, 1],
  light: { x: 100, y: 40, r: 130, color: WARM },
  paint(ctx, w, h) {
    const counter = h - Math.round(1.1 * K);
    box(ctx, 0, counter, w, h - counter, WALNUT, 0.2, 0.4);
    for (let x = 10; x < w - 10; x += 50) box(ctx, x, counter + 10, 40, h - counter - 18, WALNUT_DK, 0.1, 0.3);
    box(ctx, -2, counter - 4, w + 4, 6, 0x8a6a42, 0.3, 0.3);
    // the grille: brass bars, a scrolled top, the window
    for (let x = 4; x < w; x += 8) {
      if (x > w / 2 - 22 && x < w / 2 + 22) continue;
      ctx.fillStyle = hex(BRASS);
      ctx.fillRect(x, 10, 2, counter - 14);
    }
    box(ctx, 0, 6, w, 6, BRASS_DK, 0.3, 0.3);
    ctx.strokeStyle = hex(BRASS);
    ctx.lineWidth = 2;
    for (let x = 10; x < w - 10; x += 22) {
      ctx.beginPath();
      ctx.arc(x + 11, 6, 8, Math.PI, 0);
      ctx.stroke();
    }
    ctx.strokeRect(w / 2 - 22, counter - 44, 44, 40);
    // the ledger and the marker book open on the sill
    box(ctx, w / 2 - 18, counter - 8, 36, 5, 0xf2ead8, 0.3, 0.2);
    ctx.fillStyle = hex(0x5a2a22);
    ctx.fillRect(w / 2 - 1, counter - 8, 2, 5);
    glow(ctx, w / 2 + 40, 40, 22, LAMP, 0.4);
  },
};

// a ship's safe with a brass dial (behind the purser)
const safe = {
  w: 50,
  h: 62,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 0, 0, w, h, 0x2a3a2e, 0.2, 0.4);
    box(ctx, 5, 5, w - 10, h - 14, 0x34483a, 0.15, 0.3);
    stamp(ctx, w / 2, 26, 7, BRASS, 1, 0.2);
    stamp(ctx, w / 2, 26, 3, BRASS_DK, 1, 0.2);
    ctx.fillStyle = hex(BRASS);
    ctx.fillRect(w / 2 + 10, 34, 8, 3);
  },
};

// a lamp on a wall bracket (the corridor's: it dims a notch for each marker)
const wall_lamp = {
  w: 26,
  h: 42,
  anchor: [0.5, 0.5],
  paint(ctx, w, h) {
    ctx.fillStyle = hex(BRASS_DK);
    ctx.fillRect(2, 20, 10, 3);
    ctx.fillRect(2, 14, 3, 16);
    ctx.fillStyle = rgba(0xfff0c8, 0.85);
    ctx.beginPath();
    ctx.ellipse(16, 18, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    box(ctx, 10, 28, 12, 6, BRASS, 0.3, 0.3);
  },
};

// the companion stair up to the hurricane deck (a door portal stands at its foot)
const stair_up = {
  w: Math.round(2.4 * K),
  h: Math.round(3.6 * K),
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    ctx.fillStyle = hex(0x1a1418);
    ctx.fillRect(0, 0, w, h);
    const n = 12;
    for (let i = 0; i < n; i++) {
      const y = h - (i + 1) * (h / n);
      const x = 6 + i * ((w - 30) / n);
      box(ctx, x, y, w - x - 6, 5, 0x7a5a3a, 0.3, 0.3);
    }
    rail(ctx, 4, 6, 6, h - 10, BRASS, 40);
    ctx.strokeStyle = hex(BRASS);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, h - 40);
    ctx.lineTo(w - 10, 10);
    ctx.stroke();
    glow(ctx, w - 20, 10, 30, 0xb8c8e0, 0.4); // grey dawn at the top
  },
};

// ---- the hurricane deck at dawn -------------------------------------------------
// a chimney seen close: 1.2 m across, black sheet iron, rivets, a brass band
const chimney = {
  w: Math.round(1.3 * K),
  h: Math.round(12 * K),
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    gradientV(ctx, 4, 30, w - 8, h - 30, [[0, 0x2a2630, 1], [1, 0x1a1820, 1]]);
    ctx.fillStyle = rgba(0xd8c0d0, 0.18);
    ctx.fillRect(8, 30, 4, h - 30);
    for (let y = 60; y < h; y += 40) {
      ctx.fillStyle = rgba(0x000000, 0.4);
      ctx.fillRect(4, y, w - 8, 1);
      for (let x = 8; x < w - 8; x += 7) stamp(ctx, x, y + 3, 0.9, 0x6a6470, 1, 0.2);
    }
    // the feathered crown
    ctx.fillStyle = hex(0x1e1a22);
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * (w / 8), 32);
      ctx.lineTo(i * (w / 8) + w / 16, 4 + (i % 2) * 8);
      ctx.lineTo((i + 1) * (w / 8), 32);
      ctx.fill();
    }
    box(ctx, 0, 30, w, 6, BRASS_DK, 0.25, 0.3);
    box(ctx, 0, h - 120, w, 5, BRASS_DK, 0.25, 0.3);
  },
};

// an escape pipe: the boilers blow off steam through it (a vent's mouth)
const escape_pipe = {
  w: 22,
  h: Math.round(3 * K),
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 6, 10, 10, h - 10, 0x6a6470, 0.25, 0.4);
    box(ctx, 3, 4, 16, 8, 0x8a8478, 0.3, 0.4);
    ctx.fillStyle = hex(0x14121a);
    ctx.fillRect(6, 4, 10, 2);
    box(ctx, 2, h - 8, 18, 8, 0x4a4450, 0.2, 0.4);
  },
};

// a coil of line flaked down on the deck
const rope_coil = {
  w: 40,
  h: 14,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    ctx.strokeStyle = hex(0xb8a078);
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 5, 16 - i * 3, 4 - i * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
};

// the ship's bell on its yoke (forward on the hurricane deck)
const ship_bell = {
  w: 40,
  h: Math.round(1.6 * K),
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    box(ctx, 4, 10, 4, h - 10, WALNUT, 0.2, 0.4);
    box(ctx, w - 8, 10, 4, h - 10, WALNUT, 0.2, 0.4);
    box(ctx, 2, 8, w - 4, 5, WALNUT, 0.2, 0.4);
    ctx.fillStyle = hex(BRASS);
    ctx.beginPath();
    ctx.moveTo(w / 2 - 6, 14);
    ctx.lineTo(w / 2 + 6, 14);
    ctx.lineTo(w / 2 + 11, 34);
    ctx.lineTo(w / 2 - 11, 34);
    ctx.fill();
    ctx.fillStyle = rgba(0xfff4dc, 0.4);
    ctx.fillRect(w / 2 - 5, 16, 2, 16);
  },
};

// the texas cabin's face (its wall under the roof Jo climbs onto): white
// pine boards, cabin doors and windows, a gingerbread fret under the eave
const texas_face = {
  w: 25 * 32,
  h: 7 * 32,
  anchor: [0, 1],
  paint(ctx, w, h) {
    ctx.fillStyle = hex(0xd8d0bc);
    ctx.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 8) {
      ctx.fillStyle = rgba(0x6a6458, 0.35);
      ctx.fillRect(0, y, w, 1);
    }
    for (let x = 40; x < w - 40; x += 96) {
      door(ctx, x, h - Math.round(2.2 * K), 40, Math.round(2.2 * K), 0xb8b0a0, false);
      box(ctx, x + 54, h - 80, 26, 30, 0x5a6878, 0.2, 0.3);
    }
    ctx.fillStyle = hex(0xe8e2d0);
    for (let x = 0; x < w; x += 12) {
      ctx.beginPath();
      ctx.arc(x + 6, 4, 6, 0, Math.PI);
      ctx.fill();
    }
    grain(ctx, 0, 0, w, h, 0.03, 4);
  },
};

// ratlines: tarred shrouds with rope rungs, up the jackstaff's stays
const ratline = {
  w: 40,
  h: 7 * 32,
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    ctx.strokeStyle = hex(0x3a2e24);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, h);
    ctx.lineTo(16, 0);
    ctx.moveTo(w - 8, h);
    ctx.lineTo(w - 16, 0);
    ctx.stroke();
    ctx.strokeStyle = hex(0xb8a078);
    ctx.lineWidth = 2;
    for (let y = 8; y < h; y += 14) {
      const k = y / h;
      ctx.beginPath();
      ctx.moveTo(16 - 8 * k, y);
      ctx.quadraticCurveTo(w / 2, y + 3, w - 16 + 8 * k, y);
      ctx.stroke();
    }
  },
};

// the pilot house from outside: glass on three sides, a carved crest on the roof
const pilot_house = {
  w: Math.round(5 * K),
  h: Math.round(3.4 * K),
  anchor: [0.5, 1],
  light: { x: 110, y: 70, r: 120, color: LAMP },
  paint(ctx, w, h) {
    box(ctx, 0, 30, w, h - 30, PINE_WHITE, 0.25, 0.3);
    for (let x = 10; x < w - 20; x += 32) {
      ctx.fillStyle = hex(0x8a9aaa);
      ctx.fillRect(x, 42, 24, 46);
      glow(ctx, x + 12, 64, 20, LAMP, 0.3);
    }
    ctx.fillStyle = hex(0x5a2a2a);
    ctx.beginPath();
    ctx.moveTo(-8, 34);
    ctx.quadraticCurveTo(w / 2, 4, w + 8, 34);
    ctx.fill();
    stamp(ctx, w / 2, 12, 8, BRASS, 1, 0.2);
    door(ctx, 14, h - Math.round(2.2 * K), 42, Math.round(2.2 * K), 0xd8d0bc, true);
  },
};

// ---- the pilot house (inside) ------------------------------------------------------
// the wheel: 3.6 m across, half of it down through the floor, brass bosses
const pilot_wheel = {
  w: Math.round(3.6 * K),
  h: Math.round(1.9 * K),
  anchor: [0.5, 1],
  paint(ctx, w, h) {
    const cx = w / 2;
    const cy = h + 4;
    const R = w / 2 - 6;
    ctx.strokeStyle = hex(WALNUT);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI, 0);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10));
      ctx.stroke();
      stamp(ctx, cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10), 3, WALNUT_DK, 1, 0.2);
    }
    stamp(ctx, cx, cy - 4, 10, BRASS, 1, 0.2);
  },
};

// the pilot house's glass: the river at first light through tall sashes
const dawn_windows = {
  w: 20 * 32,
  h: 6 * 32,
  anchor: [0, 0.5],
  paint(ctx, w, h) {
    gradientV(ctx, 0, 0, w, h, [[0, 0x6a7a9a, 1], [0.55, 0xd8b0a0, 1], [0.7, 0xf2d0a0, 1], [1, 0x4a5868, 1]]);
    ctx.fillStyle = hex(0x3a4250);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h * 0.66 - ((x * 11) % 9));
    ctx.lineTo(w, h * 0.72);
    ctx.lineTo(0, h * 0.72);
    ctx.fill();
    for (let x = 0; x < w; x += 64) {
      box(ctx, x, 0, 8, h, PINE_WHITE, 0.3, 0.3);
      ctx.fillStyle = rgba(0xfff4dc, 0.12);
      ctx.fillRect(x + 14, 8, 6, h - 16);
    }
    box(ctx, 0, h - 10, w, 10, PINE_WHITE, 0.3, 0.3);
  },
};

// a private card table (the last table): the same baize, a brass lamp on it
const last_table = {
  w: Math.round(1.8 * K),
  h: Math.round(0.78 * K) + 26,
  anchor: [0.5, 1],
  light: { x: 40, y: 8, r: 110, color: LAMP },
  paint(ctx, w, h) {
    const top = 26;
    box(ctx, 0, top, w, 6, BAIZE, 0.2, 0.3);
    box(ctx, 3, top + 6, w - 6, 6, WALNUT, 0.25, 0.4);
    box(ctx, w / 2 - 4, top + 12, 8, h - top - 18, WALNUT_DK, 0.15, 0.4);
    box(ctx, w / 2 - 18, h - 6, 36, 6, WALNUT_DK, 0.15, 0.4);
    box(ctx, w / 2 + 10, top - 6, 8, 6, BRASS, 0.3, 0.3);
    ctx.fillStyle = hex(BRASS);
    ctx.fillRect(w / 2 + 13, top - 18, 2, 12);
    ctx.fillStyle = rgba(0xfff0c8, 0.9);
    ctx.fillRect(w / 2 + 10, top - 26, 8, 8);
    glow(ctx, w / 2 + 14, top - 22, 14, LAMP, 0.6);
    tinyCard(ctx, 12, top + 1);
    tinyCard(ctx, w - 18, top + 1);
  },
};

export default {
  lq_boat, gangway, gas_lamp, bollard, bales, crates, wharf_office, slate_easel, cabin_door, cabin_door_white,
  chandelier, back_bar, bar_counter, bandstand, faro_table, saloon_chair, clerestory, carpet_runner, stateroom,
  card_table, table_lamp, guard_view,
  purser_cage, safe, wall_lamp, stair_up,
  chimney, escape_pipe, rope_coil, ship_bell, texas_face, ratline, pilot_house,
  pilot_wheel, dawn_windows, last_table,
};

