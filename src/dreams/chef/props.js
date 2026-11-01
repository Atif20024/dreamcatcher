// FIVE-STAR DREAM's props (FRAMEWORK 4.3): Le Rêve, a grand hotel's kitchen in
// 1957, painted at the scale system's 1 m = 44 px (Jo is 1.8 m, a table's top
// 0.9 m = 40 px). White glazed tile, cast iron, copper, zinc, butcher's maple,
// marble, galvanised rack; out front, dark panelling and white linen. No plastic,
// no stainless steel benches, nothing after 1957. Words are never painted here:
// every sign is a `sign` entity in the bitmap font.
//   { w, h, anchor: [ax, ay], paint(ctx, w, h, P), light?, live? }
import { mix, rgba, hex, stamp, grain } from '../../art/paint.js';

const NIGHT = 0x14122a;
const TILE = 0xe4e0d0;
const IRON = 0x24242c;
const IRON_LT = 0x4a4a56;
const COPPER = 0xc87a42;
const COPPER_DK = 0x7a4426;
const COPPER_LT = 0xf2b888;
const ZINC = 0x8a929a;
const ZINC_LT = 0xc8d0d8;
const MAPLE = 0xb8905c;
const MAPLE_DK = 0x6a4e2e;
const MARBLE = 0xd8d4cc;
const LINEN = 0xece6d6;
const WALNUT = 0x3a2218;
const BRASS = 0xc8a050;
const BRASS_DK = 0x7a5a24;

// (stops: [t, colour], the colour a number or a css string)
function gradientV(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  for (const [t, col] of stops) g.addColorStop(t, typeof col === 'number' ? hex(col) : col);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function box(ctx, x, y, w, h, col, lit = 0.2, dark = 0.3) {
  const X = Math.round(x);
  const Y = Math.round(y);
  const W = Math.round(w);
  const H = Math.round(h);
  ctx.fillStyle = hex(col);
  ctx.fillRect(X, Y, W, H);
  ctx.fillStyle = rgba(0xfff4dc, lit);
  ctx.fillRect(X, Y, W, 1);
  ctx.fillRect(X, Y, 1, H);
  ctx.fillStyle = rgba(NIGHT, dark);
  ctx.fillRect(X + W - 1, Y, 1, H);
  ctx.fillRect(X, Y + H - 1, W, 1);
}
const ell = (ctx, x, y, rx, ry, col) => {
  ctx.fillStyle = typeof col === 'string' ? col : hex(col);
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
};
function glow(ctx, x, y, r, col, a = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// a copper pot in profile, hanging or standing: body, band, handle, a lit flank
function pot(ctx, x, y, w, h, col = COPPER, handle = true) {
  box(ctx, x, y, w, h, col, 0.25, 0.35);
  ctx.fillStyle = rgba(0xffffff, 0.28);
  ctx.fillRect(x + 2, y + 2, 2, h - 4);
  ctx.fillStyle = rgba(NIGHT, 0.22);
  ctx.fillRect(x + w - 4, y + 2, 3, h - 3);
  box(ctx, x - 1, y, w + 2, 2, mix(col, 0xffffff, 0.2), 0.3, 0.2);
  if (handle) {
    ctx.fillStyle = hex(IRON);
    ctx.fillRect(x + w, y + 2, Math.max(8, w * 0.5), 2);
  }
}
// a white-tile field: glazed squares, dark grout, a little crazing
function tiles(ctx, x, y, w, h, s = 12, col = TILE, grout = 0x8a8678) {
  ctx.fillStyle = hex(col);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rgba(grout, 0.55);
  for (let yy = y; yy < y + h; yy += s) ctx.fillRect(x, yy, w, 1);
  for (let xx = x; xx < x + w; xx += s) ctx.fillRect(xx, y, 1, h);
  for (let i = 0; i < w * h * 0.0014; i++) {
    const tx = x + ((i * 53) % w);
    const ty = y + ((i * 37) % h);
    ctx.fillStyle = rgba(0x6a6658, 0.14);
    ctx.fillRect(tx, ty, 5, 1);
  }
}
function door(ctx, w, h, col, port = true, kick = BRASS) {
  box(ctx, 0, 0, w, h, mix(col, NIGHT, 0.35), 0.15, 0.4);
  box(ctx, 3, 3, w - 6, h - 3, col, 0.2, 0.25);
  ctx.fillStyle = rgba(NIGHT, 0.3);
  ctx.fillRect(w / 2 - 1, 3, 1, h);
  if (port) {
    for (const px of [w * 0.28, w * 0.72]) {
      ell(ctx, px, 30, 9, 9, BRASS_DK);
      ell(ctx, px, 30, 7, 7, 0x3a3428);
      ctx.fillStyle = rgba(0xffe8b0, 0.5);
      ctx.fillRect(px - 4, 26, 3, 2);
    }
  }
  box(ctx, 3, h - 16, w - 6, 13, kick, 0.35, 0.3);
}

const FLOOR = [0.5, 1];
const MID = [0.5, 0.5];
const TOP = [0.5, 0];

export default {
  // ---- doors -----------------------------------------------------------------
  swing_door: { w: 62, h: 100, anchor: FLOOR, paint: (c, w, h) => door(c, w, h, 0x6a5a48) },
  swing_door_cold: { w: 62, h: 100, anchor: FLOOR, paint(c, w, h) {
    door(c, w, h, 0x5a6a78, false, ZINC);
    for (const y of [24, 72]) box(c, 6, y, 16, 6, ZINC_LT, 0.3, 0.3);
    box(c, w - 18, 46, 12, 18, ZINC_LT, 0.4, 0.3);
  } },
  swing_door_chef: { w: 62, h: 100, anchor: FLOOR, paint: (c, w, h) => door(c, w, h, 0x5a2420) },
  swing_door_salle: { w: 62, h: 100, anchor: FLOOR, paint: (c, w, h) => door(c, w, h, 0x3a2a30) },
  back_door: { w: 66, h: 108, anchor: FLOOR, paint(c, w, h) {
    door(c, w, h - 8, 0x4a5a4a, false, IRON);
    box(c, 0, h - 8, w, 8, 0x6a6a70, 0.3, 0.3); // the worn step
    glow(c, w / 2, 4, 26, 0xffd080, 0.8);
    ell(c, w / 2, 4, 3, 3, 0xfff2c0);
  } },

  // ---- the yard --------------------------------------------------------------
  hotel_wall: { w: 960, h: 500, anchor: FLOOR, paint(c, w, h) {
    gradientV(c, 0, 0, w, h, [[0, hex(0x2a2636)], [0.7, hex(0x3a3442)], [1, hex(0x2a2632)]]);
    // rendered brick, courses and stains
    for (let y = 0; y < h; y += 11) for (let x = (y / 11) % 2 ? -13 : 0; x < w; x += 26) {
      c.fillStyle = rgba(0x1e1a26, 0.5);
      c.fillRect(x, y, 26, 1);
      c.fillRect(x, y, 1, 11);
    }
    grain(c, 0, 0, w, h, 0.05, 11, 2);
    // the kitchen's windows, high and lit, running with steam
    for (const x of [80, 240, 400, 640, 800]) {
      box(c, x, 150, 92, 150, 0x1e1a26, 0.2, 0.4);
      gradientV(c, x + 4, 154, 84, 142, [[0, '#ffd890'], [1, '#c88a50']]);
      for (let i = 1; i < 3; i++) {
        c.fillStyle = hex(0x2a2430);
        c.fillRect(x + 4 + i * 28, 154, 2, 142);
        c.fillRect(x + 4, 154 + i * 47, 84, 2);
      }
      for (let i = 0; i < 18; i++) stamp(c, x + 10 + (i * 37) % 70, 158 + (i * 61) % 130, 9, 0xf6efe0, 0.14);
    }
    // the drainpipe and a soil stack
    for (const x of [200, 590]) {
      box(c, x, 0, 8, h, IRON_LT, 0.2, 0.35);
      for (let y = 40; y < h; y += 110) box(c, x - 2, y, 12, 5, IRON, 0.2, 0.3);
    }
    // the extract fan: a square hood breathing steam up the wall
    box(c, 500, 86, 66, 40, IRON, 0.25, 0.4);
    for (let i = 0; i < 14; i++) stamp(c, 533 + Math.sin(i) * 12, 82 - i * 6, 10 + i, 0xe8e4ec, 0.05);
  } },
  yard_crates: { w: 96, h: 66, anchor: FLOOR, paint(c, w, h) {
    const crate = (x, y, cw, ch, fill) => {
      box(c, x, y, cw, ch, 0x8a6a42, 0.25, 0.3);
      for (let yy = y + 7; yy < y + ch; yy += 8) {
        c.fillStyle = rgba(NIGHT, 0.4);
        c.fillRect(x + 1, yy, cw - 2, 1);
      }
      for (let i = 0; i < 6; i++) ell(c, x + 6 + i * ((cw - 12) / 5), y + 1, 4, 3, fill);
    };
    crate(0, h - 30, 50, 30, 0xb84a2a);
    crate(46, h - 30, 50, 30, 0x5a7a3a);
    crate(20, h - 58, 50, 28, 0xd8a840);
  } },
  milk_churn: { w: 26, h: 44, anchor: FLOOR, paint(c, w, h) {
    box(c, 3, 12, 20, h - 12, ZINC, 0.3, 0.35);
    box(c, 8, 3, 10, 10, ZINC, 0.3, 0.35);
    box(c, 6, 0, 14, 4, ZINC_LT, 0.3, 0.3);
    c.fillStyle = rgba(0xffffff, 0.3);
    c.fillRect(6, 14, 2, h - 18);
  } },
  yard_bins: { w: 74, h: 50, anchor: FLOOR, paint(c, w, h) {
    for (const x of [2, 38]) {
      box(c, x, 8, 32, h - 8, 0x4a4e56, 0.2, 0.35);
      for (let i = 1; i < 5; i++) {
        c.fillStyle = rgba(NIGHT, 0.3);
        c.fillRect(x + i * 6, 10, 1, h - 12);
      }
      box(c, x - 2, 2, 36, 6, 0x5a5e66, 0.3, 0.3);
    }
  } },

  // ---- tile and plumbing ------------------------------------------------------
  tile_band: { w: 300, h: 120, anchor: FLOOR, paint: (c, w, h) => {
    tiles(c, 0, 0, w, h);
    box(c, 0, 0, w, 4, 0x3a5a7a, 0.2, 0.2); // the blue border every kitchen had
  } },
  pipe_run: { w: 260, h: 30, anchor: TOP, paint(c, w) {
    box(c, 0, 8, w, 8, ZINC, 0.35, 0.35);
    box(c, 0, 20, w, 5, COPPER_DK, 0.3, 0.3);
    for (let x = 30; x < w; x += 70) box(c, x, 4, 6, 24, IRON_LT, 0.2, 0.3);
  } },
  // an enamel gooseneck on the yard wall, the kind every back door had
  yard_lamp: { w: 44, h: 40, anchor: TOP, light: { x: 22, y: 34, r: 210, color: 0xd8c8a0 }, paint(c, w, h) {
    c.fillStyle = hex(IRON);
    c.fillRect(w / 2 - 1, 0, 3, 10);
    c.fillRect(w / 2 - 6, 0, 12, 3);
    box(c, w / 2 - 15, 10, 30, 12, 0x2e4a40, 0.3, 0.35);
    box(c, w / 2 - 20, 20, 40, 4, 0x3a5a4a, 0.3, 0.3);
    ell(c, w / 2, h - 12, 6, 4, 0xfff0c8);
    glow(c, w / 2, h - 10, 14, 0xfff0c0, 0.5);
  } },
  hanging_bulb: { w: 40, h: 60, anchor: TOP, light: { x: 20, y: 50, r: 120, color: 0xfff0d0 }, paint(c, w, h) {
    c.fillStyle = hex(IRON);
    c.fillRect(w / 2, 0, 1, h - 16);
    box(c, w / 2 - 12, h - 18, 24, 6, 0x3a5a4a, 0.3, 0.3);
    ell(c, w / 2, h - 10, 5, 5, 0xfff6d8);
    glow(c, w / 2, h - 10, 16, 0xfff0c0, 0.6);
  } },
  wireless: { w: 54, h: 36, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, h - 3, w, 3, MAPLE_DK, 0.2, 0.3);
    box(c, 6, 2, w - 12, h - 5, 0x5a3a24, 0.3, 0.35);
    box(c, 10, 6, 18, h - 13, 0xc8a878, 0.2, 0.3);
    for (let y = 8; y < h - 8; y += 3) {
      c.fillStyle = rgba(NIGHT, 0.5);
      c.fillRect(11, y, 16, 1);
    }
    box(c, 32, 7, 12, 6, 0xf2d580, 0.3, 0.2);
    ell(c, 35, 19, 2.5, 2.5, BRASS);
    ell(c, 41, 19, 2.5, 2.5, BRASS);
  } },
  speaking_tube: { w: 44, h: 96, anchor: FLOOR, paint(c, w, h) {
    c.strokeStyle = hex(BRASS_DK);
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(w / 2, 0);
    c.lineTo(w / 2, 40);
    c.quadraticCurveTo(w / 2, 56, w / 2 - 12, 56);
    c.stroke();
    c.strokeStyle = hex(BRASS);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(w / 2 - 1, 0);
    c.lineTo(w / 2 - 1, 40);
    c.stroke();
    ell(c, w / 2 - 14, 56, 5, 9, BRASS);
    ell(c, w / 2 - 15, 56, 3, 6, 0x1a1414);
  } },

  // ---- the pit ----------------------------------------------------------------
  wash_sink: { w: 150, h: 84, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 34, w, h - 34, 0xc8c8c0, 0.3, 0.35); // salt-glazed trough
    box(c, -1, 30, w, 6, ZINC_LT, 0.45, 0.3);
    box(c, 8, 42, 60, 26, 0x6a7078, 0.2, 0.2);
    box(c, 82, 42, 60, 26, 0x6a7078, 0.2, 0.2);
    for (let i = 0; i < 16; i++) stamp(c, 12 + (i * 23) % 125, 36 + (i * 11) % 8, 4 + (i % 3), 0xffffff, 0.55);
    // taps on a riser
    box(c, 70, 2, 6, 30, ZINC, 0.4, 0.3);
    box(c, 54, 2, 40, 5, ZINC, 0.4, 0.3);
    box(c, 54, 6, 4, 8, ZINC_LT, 0.4, 0.3);
    box(c, 90, 6, 4, 8, ZINC_LT, 0.4, 0.3);
    // a stack of dirty plates on the drainer
    for (let i = 0; i < 6; i++) box(c, 110, 26 - i * 3, 34, 3, LINEN, 0.5, 0.25);
    for (const x of [6, w - 14]) box(c, x, h - 14, 8, 14, IRON_LT, 0.2, 0.3);
  } },
  wet_floor: { w: 200, h: 8, anchor: FLOOR, paint(c, w, h) {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = rgba(0xd8e8f0, 0.32 - (i % 3) * 0.06);
      c.beginPath();
      c.ellipse(16 + i * 24, h - 3, 18 + (i % 3) * 4, 2.5, 0, 0, Math.PI * 2);
      c.fill();
    }
  } },
  scour_bench: { w: 96, h: 48, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 8, w, 7, MAPLE, 0.4, 0.3);
    for (const x of [4, w - 12]) box(c, x, 14, 8, h - 14, MAPLE_DK, 0.2, 0.35);
    box(c, 10, 22, w - 20, 4, MAPLE_DK, 0.2, 0.3);
    pot(c, 14, 28, 24, 15, COPPER_DK, false);
    box(c, 54, 1, 20, 7, 0xd8c8a0, 0.3, 0.3); // the sand and lemon
    ell(c, 44, 4, 5, 4, 0xe8c840);
  } },
  plate_rack: { w: 84, h: 130, anchor: FLOOR, paint(c, w, h) {
    for (const x of [0, w - 5]) box(c, x, 0, 5, h, ZINC, 0.35, 0.3);
    for (let y = 16; y < h - 8; y += 38) {
      box(c, 0, y + 28, w, 4, ZINC, 0.4, 0.3);
      for (let x = 7; x < w - 8; x += 7) {
        ell(c, x, y + 14, 3, 15, LINEN);
        c.fillStyle = rgba(NIGHT, 0.25);
        c.fillRect(x + 2, y, 1, 28);
      }
    }
  } },
  copper_hooks: { w: 230, h: 64, anchor: TOP, paint(c, w) {
    box(c, 0, 0, w, 6, IRON, 0.25, 0.35);
    const sizes = [[12, 28, 22], [52, 24, 18], [86, 34, 26], [132, 22, 16], [164, 30, 24], [204, 18, 14]];
    for (const [x, pw, ph] of sizes) {
      c.fillStyle = hex(IRON_LT);
      c.fillRect(x + pw / 2, 6, 1, 8);
      pot(c, x, 14, pw, ph, COPPER, false);
    }
  } },
  hatch: { w: 108, h: 120, anchor: FLOOR, paint(c, w) {
    box(c, 0, 20, w, 62, 0x2a2622, 0.2, 0.3);
    gradientV(c, 4, 24, w - 8, 54, [[0, '#6a4a2c'], [1, '#c88a4a']]);
    for (let i = 0; i < 9; i++) stamp(c, 12 + i * 11, 40 + (i % 3) * 6, 8, 0xfff0c0, 0.12);
    box(c, -1, 80, w, 8, ZINC_LT, 0.45, 0.3);
    box(c, 6, 14, w - 12, 6, IRON, 0.25, 0.3);
  } },

  // ---- the cold store --------------------------------------------------------
  compressor: { w: 110, h: 122, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 26, w, h - 26, 0x3a4652, 0.25, 0.35);
    ell(c, 34, 74, 28, 28, 0x2a3440);
    ell(c, 34, 74, 24, 24, 0x4a5866);
    for (let i = 0; i < 6; i++) {
      c.strokeStyle = rgba(0xc0d8e8, 0.4);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(34, 74);
      c.lineTo(34 + Math.cos(i) * 22, 74 + Math.sin(i) * 22);
      c.stroke();
    }
    box(c, 72, 40, 30, 54, 0x2a3440, 0.2, 0.3);
    ell(c, 87, 54, 9, 9, MARBLE);
    c.fillStyle = hex(0x8a2a22);
    c.fillRect(87, 48, 1, 7);
    for (const x of [14, 50, 86]) box(c, x, 0, 8, 28, ZINC, 0.3, 0.3);
    // frost on the pipes
    for (let i = 0; i < 26; i++) stamp(c, 8 + (i * 17) % 96, (i * 7) % 26, 3, 0xf0f8ff, 0.45);
  } },
  cold_rack: { w: 150, h: 96, anchor: FLOOR, paint(c, w, h) {
    for (const x of [0, w / 2 - 2, w - 4]) box(c, x, 0, 4, h, ZINC, 0.35, 0.3);
    for (const y of [28, 62]) box(c, 0, y, w, 3, ZINC_LT, 0.45, 0.3);
    const shelf = (y) => {
      for (let i = 0; i < 6; i++) {
        const x = 8 + i * 23;
        if (i % 3 === 2) ell(c, x + 8, y - 8, 9, 7, 0xd8cca0); // cheeses
        else if (i % 3 === 1) box(c, x, y - 18, 16, 18, 0x7a5a3a, 0.2, 0.3); // crates
        else box(c, x, y - 14, 14, 14, 0x9aa8b4, 0.35, 0.3); // tins
      }
    };
    shelf(28);
    shelf(62);
    for (let i = 0; i < 30; i++) stamp(c, (i * 37) % w, (i * 23) % h, 2.5, 0xe8f4ff, 0.35);
  } },
  beef_rail: { w: 320, h: 8, anchor: TOP, paint(c, w) {
    box(c, 0, 0, w, 6, ZINC, 0.4, 0.35);
  } },
  warm_pipe: { w: 190, h: 34, anchor: FLOOR, light: { x: 95, y: 18, r: 80, color: 0xffa050 }, paint(c, w, h) {
    box(c, 0, 8, w, 18, COPPER_DK, 0.3, 0.35);
    gradientV(c, 1, 9, w - 2, 16, [[0, hex(0xe89a5a)], [1, hex(0xa85a2a)]]);
    for (const x of [20, 95, 170]) box(c, x, 2, 10, 30, IRON_LT, 0.25, 0.3);
    for (let i = 0; i < 8; i++) stamp(c, 16 + i * 22, 6 - (i % 2) * 2, 5, 0xfff0d8, 0.12);
  } },
  curled_cat: { w: 44, h: 24, anchor: FLOOR, paint(c, w, h) {
    ell(c, 21, h - 9, 18, 9, 0xe0a860);
    ell(c, 31, h - 13, 8, 7, 0xe0a860);
    c.fillStyle = hex(0xe0a860);
    c.beginPath();
    c.moveTo(27, h - 19);
    c.lineTo(29, h - 23);
    c.lineTo(31, h - 19);
    c.moveTo(33, h - 19);
    c.lineTo(36, h - 23);
    c.lineTo(37, h - 18);
    c.fill();
    for (let i = 0; i < 4; i++) {
      c.fillStyle = hex(0x9a5e2a);
      c.fillRect(10 + i * 6, h - 16 + (i % 2), 3, 6);
    }
    c.strokeStyle = hex(0xb87a3e);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(6, h - 5);
    c.quadraticCurveTo(18, h - 1, 26, h - 3);
    c.stroke();
    c.fillStyle = hex(0x2a1e16);
    c.fillRect(31, h - 13, 3, 1);
  } },

  // ---- prep ------------------------------------------------------------------
  sack_pile: { w: 110, h: 60, anchor: FLOOR, paint(c, w, h) {
    const sack = (x, y, sw, sh) => {
      c.fillStyle = hex(0xb8a074);
      c.beginPath();
      c.moveTo(x + 4, y + sh);
      c.quadraticCurveTo(x - 2, y + sh * 0.3, x + sw * 0.3, y + 4);
      c.lineTo(x + sw * 0.7, y + 4);
      c.quadraticCurveTo(x + sw + 2, y + sh * 0.3, x + sw - 4, y + sh);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(NIGHT, 0.2);
      c.fillRect(x + sw * 0.55, y + 8, sw * 0.35, sh - 8);
      box(c, x + sw * 0.34, y, sw * 0.32, 5, 0x8a7652, 0.2, 0.3);
    };
    sack(0, h - 40, 44, 40);
    sack(36, h - 44, 46, 44);
    sack(72, h - 36, 38, 36);
    grain(c, 0, 0, w, h, 0.04, 5, 2);
  } },
  ice_chest: { w: 96, h: 56, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 8, w, h - 8, 0x7a8a92, 0.3, 0.35);
    box(c, -1, 2, w, 8, ZINC_LT, 0.4, 0.3);
    box(c, 40, 14, 18, 8, BRASS, 0.4, 0.3);
    for (let i = 0; i < 10; i++) stamp(c, 12 + i * 8, 2, 4, 0xf4fbff, 0.7);
    // a tail out of the ice
    c.fillStyle = hex(0x6a8a9a);
    c.beginPath();
    c.moveTo(70, 2);
    c.lineTo(80, -2);
    c.lineTo(80, 7);
    c.fill();
  } },
  chop_block: { w: 100, h: 48, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 4, w, 14, MAPLE, 0.45, 0.3);
    for (let i = 0; i < 10; i++) {
      c.fillStyle = rgba(MAPLE_DK, 0.35);
      c.fillRect(i * 10, 5, 1, 12);
    }
    for (const x of [4, w - 14]) box(c, x, 18, 10, h - 18, MAPLE_DK, 0.2, 0.3);
    for (let i = 0; i < 12; i++) ell(c, 20 + (i * 13) % 60, 3, 3, 1.5, i % 2 ? 0xe8e4c8 : 0x7a9a4a);
  } },
  fish_slab: { w: 112, h: 48, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 6, w, 10, MARBLE, 0.5, 0.3);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = rgba(0x8a8a90, 0.3);
      c.fillRect(6 + i * 13, 8 + (i % 2) * 2, 9, 1);
    }
    for (const x of [4, w - 12]) box(c, x, 16, 8, h - 16, IRON_LT, 0.2, 0.3);
    // a bass on the marble, waiting
    c.fillStyle = hex(0x7a8e9a);
    c.beginPath();
    c.ellipse(52, 3, 24, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(74, 3);
    c.lineTo(84, -1);
    c.lineTo(84, 7);
    c.fill();
    c.fillStyle = hex(0x1a1e24);
    c.fillRect(34, 1, 2, 2);
  } },
  wall_oven: { w: 78, h: 92, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 0, w, h, IRON, 0.25, 0.4);
    box(c, 8, 12, w - 16, 44, IRON_LT, 0.3, 0.4);
    box(c, 16, 20, w - 32, 6, BRASS, 0.5, 0.3);
    gradientV(c, 12, 34, w - 24, 18, [[0, '#3a1a10'], [1, '#c85a20']]);
    for (const x of [20, 40, 58]) ell(c, x, h - 22, 5, 5, BRASS_DK);
  } },
  window_herbs: { w: 110, h: 118, anchor: FLOOR, paint(c, w, h) {
    box(c, 4, 0, w - 8, h - 14, 0x2a2622, 0.2, 0.3);
    gradientV(c, 8, 4, w - 16, h - 22, [[0, '#141a3a'], [1, '#2a3a5a']]);
    for (let i = 0; i < 3; i++) {
      c.fillStyle = hex(0x3a3028);
      c.fillRect(8 + i * 32, 4, 2, h - 22);
    }
    for (let i = 0; i < 16; i++) {
      c.fillStyle = rgba(0xd8e8f0, 0.22);
      c.fillRect(12 + (i * 29) % (w - 26), 6 + (i * 37) % (h - 28), 1, 4);
    }
    box(c, 0, h - 14, w, 14, 0x7a5a3a, 0.3, 0.35);
    for (let i = 0; i < 14; i++) ell(c, 8 + i * 7, h - 18 - (i % 3) * 3, 5, 6, i % 2 ? 0x4a7a3a : 0x6a9a4a);
  } },
  line_shelf: { w: 104, h: 120, anchor: FLOOR, paint(c, w, h) {
    for (const x of [0, w - 5]) box(c, x, 0, 5, h, MAPLE_DK, 0.25, 0.3);
    for (const y of [28, 68, 104]) box(c, 0, y, w, 5, MAPLE, 0.4, 0.3);
  } },
  hanging_pans: { w: 170, h: 66, anchor: TOP, paint(c, w) {
    box(c, 0, 0, w, 5, IRON, 0.25, 0.35);
    for (let i = 0; i < 6; i++) {
      const x = 8 + i * 28;
      c.fillStyle = hex(IRON);
      c.fillRect(x + 8, 5, 3, 24);
      ell(c, x + 9, 42, 12, 13, i % 2 ? IRON_LT : COPPER_DK);
      ell(c, x + 9, 42, 9, 10, i % 2 ? IRON : COPPER);
    }
  } },

  // ---- the line --------------------------------------------------------------
  reserve_shelf: { w: 92, h: 134, anchor: FLOOR, paint(c, w, h) {
    for (const x of [0, w - 5]) box(c, x, 0, 5, h, ZINC, 0.3, 0.3);
    for (const y of [36, 78, 118]) box(c, 0, y, w, 5, ZINC_LT, 0.4, 0.3);
    for (let i = 0; i < 5; i++) pot(c, 8 + i * 16, 18, 12, 18, COPPER_DK, false);
    for (let i = 0; i < 3; i++) box(c, 8 + i * 27, 56, 22, 22, 0x8a6a42, 0.25, 0.3);
    for (let i = 0; i < 4; i++) box(c, 8 + i * 20, 96, 16, 22, 0x9aa8b4, 0.35, 0.3);
  } },
  larder: { w: 118, h: 134, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 0, w, h, 0x7a8a8a, 0.3, 0.35);
    box(c, 6, 6, w - 12, 72, 0x2a3036, 0.2, 0.2);
    for (const y of [32, 58]) box(c, 6, y, w - 12, 3, ZINC_LT, 0.3, 0.3);
    for (let i = 0; i < 4; i++) {
      box(c, 12 + i * 25, 14, 20, 18, 0xc8886a, 0.25, 0.3); // terrines
      box(c, 12 + i * 25, 42, 20, 16, 0xe8dcb8, 0.3, 0.3); // the jars
    }
    box(c, 0, 82, w, 40, 0xc8c8c0, 0.35, 0.35);
    box(c, -1, 80, w, 5, MARBLE, 0.5, 0.3);
    for (const x of [8, w - 16]) box(c, x, 122, 8, 12, IRON, 0.2, 0.3);
  } },
  sauce_bench: { w: 150, h: 72, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 26, w, h - 26, 0x4a4a52, 0.2, 0.35);
    box(c, -1, 22, w, 6, MARBLE, 0.5, 0.3);
    for (const [x, pw, ph] of [[8, 28, 22], [44, 24, 18], [76, 30, 22], [114, 24, 16]]) pot(c, x, 22 - ph, pw, ph, COPPER, x !== 114);
    for (let i = 0; i < 8; i++) stamp(c, 20 + i * 15, 0, 6, 0xfff4e0, 0.09);
    for (const x of [14, 60, 110]) box(c, x, 38, 26, 18, IRON_LT, 0.2, 0.3);
  } },
  range: { w: 400, h: 96, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 8, w, h - 8, IRON, 0.2, 0.4);
    box(c, -1, 6, w, 8, IRON_LT, 0.3, 0.3);
    for (let x = 8; x < w - 40; x += 72) {
      box(c, x, 26, 60, 46, 0x1a1a22, 0.15, 0.35);
      box(c, x + 8, 32, 44, 5, BRASS, 0.4, 0.3);
      gradientV(c, x + 8, 48, 44, 18, [[0, '#2a1a14'], [1, '#c8541e']]);
    }
    for (let i = 0; i < 7; i++) pot(c, 16 + i * 56, 6 - 16 - (i % 2) * 2 + 2, 26 + (i % 3) * 4, 14 + (i % 2) * 2, i % 2 ? COPPER : COPPER_DK, false);
  } },
  hood: { w: 420, h: 44, anchor: TOP, paint(c, w, h) {
    c.fillStyle = hex(0x3a3a44);
    c.beginPath();
    c.moveTo(20, 0);
    c.lineTo(w - 20, 0);
    c.lineTo(w, h);
    c.lineTo(0, h);
    c.fill();
    box(c, 0, h - 5, w, 5, ZINC, 0.4, 0.3);
    for (let x = 30; x < w; x += 54) box(c, x, 8, 2, h - 14, 0x24242c, 0.1, 0.1);
  } },
  grill_top: { w: 110, h: 54, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 18, w, h - 18, IRON, 0.25, 0.4);
    box(c, -1, 12, w, 8, 0x3a3a44, 0.35, 0.3);
    for (let x = 4; x < w - 4; x += 7) {
      c.fillStyle = hex(0x6a6a74);
      c.fillRect(x, 12, 3, 8);
    }
    gradientV(c, 8, 26, w - 16, 20, [[0, '#3a1a10'], [1, '#e8701e']]);
    for (let i = 0; i < 12; i++) ell(c, 12 + i * 8, 44 - (i % 3) * 4, 3, 3, 0xffb860);
  } },
  stock_burner: { w: 44, h: 22, anchor: FLOOR, paint(c, w, h) {
    box(c, 6, 8, w - 12, h - 8, IRON, 0.25, 0.4);
    box(c, 0, 4, w, 5, IRON_LT, 0.4, 0.35);
    for (let i = 0; i < 5; i++) ell(c, 6 + i * 8, 5, 2, 1, 0x4a7ac8);
    for (const x of [6, w - 12]) box(c, x, 12, 6, h - 12, IRON, 0.2, 0.3);
  } },
  risotto_pot: { w: 92, h: 66, anchor: FLOOR, paint(c, w, h) {
    box(c, 4, 34, w - 8, h - 34, IRON, 0.25, 0.4);
    box(c, 0, 30, w, 6, IRON_LT, 0.4, 0.3);
    pot(c, 20, 4, 50, 26, COPPER, true);
    ell(c, 45, 6, 24, 3, 0xe8c040);
    for (let i = 0; i < 4; i++) stamp(c, 34 + i * 8, -2, 5, 0xfff4d0, 0.15);
    gradientV(c, 10, 40, w - 20, 16, [[0, '#2a1a10'], [1, '#d8601e']]);
  } },
  pass_window: { w: 170, h: 170, anchor: FLOOR, light: { x: 85, y: 36, r: 110, color: 0xffb060 }, paint(c, w, h) {
    // the wall with a hole in it, tile below
    tiles(c, 0, h - 70, w, 70);
    box(c, 0, 0, w, 8, IRON, 0.2, 0.3);
    box(c, 0, 8, 10, h - 78, IRON_LT, 0.3, 0.3);
    box(c, w - 10, 8, 10, h - 78, IRON_LT, 0.3, 0.3);
    box(c, -1, h - 74, w, 8, MARBLE, 0.55, 0.3);
    // the lamp and the rail of spent tickets over it
    box(c, 20, 14, w - 40, 7, ZINC, 0.45, 0.3);
    glow(c, w / 2, 24, 60, 0xffb060, 0.4);
    for (let x = 28; x < w - 30; x += 18) {
      c.fillStyle = rgba(0xf2e6cc, 0.8);
      c.fillRect(x, 21, 10, 18);
    }
  } },

  // ---- the pass ---------------------------------------------------------------
  hot_glass: { w: 150, h: 170, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 0, w, h - 66, 0x2a2622, 0.2, 0.3);
    gradientV(c, 6, 6, w - 12, h - 78, [[0, '#7a4a2a'], [1, '#c8783a']]);
    for (let i = 0; i < 20; i++) stamp(c, 12 + (i * 29) % (w - 24), 12 + (i * 17) % (h - 90), 7, 0xfff0c0, 0.08);
    // the line through the glass: the brigade with their backs to him, and fire
    for (const [x, tall] of [[22, 58], [58, 64], [96, 60], [124, 54]]) {
      c.fillStyle = rgba(0x3a1e12, 0.75);
      c.fillRect(x, h - 72 - tall + 16, 12, tall - 16);
      ell(c, x + 6, h - 72 - tall + 12, 6, 7, rgba(0xf6e8d0, 0.85));
      c.fillStyle = rgba(0xf6e8d0, 0.85);
      c.fillRect(x + 1, h - 72 - tall - 2, 10, 10);
    }
    glow(c, 78, h - 78, 26, 0xff8a3a, 0.8);
    tiles(c, 0, h - 66, w, 66);
    box(c, -1, h - 70, w, 7, MARBLE, 0.55, 0.3);
  } },
  chef_table: { w: 250, h: 44, anchor: FLOOR, paint(c, w, h) {
    box(c, 0, 4, w, 10, MARBLE, 0.55, 0.3);
    for (const x of [8, w / 2 - 6, w - 20]) box(c, x, 14, 12, h - 14, IRON, 0.25, 0.35);
    box(c, 0, 26, w, 4, IRON_LT, 0.2, 0.3);
  } },
  gold_tin: { w: 34, h: 16, anchor: FLOOR, paint(c, w, h) {
    box(c, 2, 4, w - 4, h - 4, 0x3a2a1a, 0.3, 0.35);
    box(c, 0, 1, w, 5, BRASS, 0.5, 0.3);
    glow(c, w / 2, 2, 14, 0xf2d580, 0.4);
  } },
  plate_up: { w: 56, h: 16, anchor: FLOOR, light: { x: 28, y: 8, r: 30, color: 0xffe0a0 }, paint(c, w, h) {
    ell(c, w / 2, h - 5, 25, 5, LINEN);
    ell(c, w / 2, h - 7, 16, 4, 0xe8c040);
    for (let i = 0; i < 8; i++) ell(c, w / 2 - 12 + i * 3.4, h - 7 - (i % 2), 1.6, 1, 0xf6e080);
    c.fillStyle = hex(0xf6d98a);
    c.fillRect(w / 2 - 3, h - 11, 6, 3);
  } },
  heat_lamp: { w: 80, h: 50, anchor: TOP, light: { x: 40, y: 46, r: 110, color: 0xffb060 }, paint(c, w, h) {
    c.fillStyle = hex(IRON);
    c.fillRect(w / 2 - 1, 0, 2, 24);
    c.fillStyle = hex(0x4a2020);
    c.beginPath();
    c.moveTo(w / 2 - 8, 22);
    c.lineTo(w / 2 + 8, 22);
    c.lineTo(w, h - 6);
    c.lineTo(0, h - 6);
    c.fill();
    ell(c, w / 2, h - 5, 12, 4, 0xffc070);
  } },
  ticket_spike: { w: 16, h: 40, anchor: FLOOR, paint(c, w, h) {
    box(c, 1, h - 5, w - 2, 5, IRON, 0.3, 0.3);
    c.fillStyle = hex(ZINC_LT);
    c.fillRect(w / 2 - 1, 0, 2, h - 5);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = rgba(0xf2e6cc, 1 - i * 0.04);
      c.fillRect(1 + (i % 3), h - 8 - i * 3, w - 3 - (i % 2) * 2, 2);
    }
  } },

  // ---- the dining room --------------------------------------------------------
  tall_window: { w: 120, h: 230, anchor: FLOOR, paint(c, w, h) {
    box(c, 22, 0, w - 44, h - 8, 0x1a1422, 0.15, 0.3);
    gradientV(c, 26, 4, w - 52, h - 16, [[0, '#0e1228'], [1, '#1e2238']]);
    for (let i = 0; i < 10; i++) stamp(c, 34 + (i * 17) % (w - 68), 12 + (i * 37) % (h - 40), 1.6, 0xffe0a0, 0.5);
    // the drapes
    for (const [x, dw] of [[0, 30], [w - 30, 30]]) {
      gradientV(c, x, 0, dw, h, [[0, hex(0x5a1e24)], [1, hex(0x3a1218)]]);
      for (let i = 0; i < 5; i++) {
        c.fillStyle = rgba(NIGHT, 0.28);
        c.fillRect(x + 3 + i * 6, 0, 2, h);
      }
    }
    box(c, -4, 0, w + 8, 8, BRASS_DK, 0.3, 0.3);
  } },
  chandelier_salle: { w: 92, h: 66, anchor: TOP, paint(c, w) {
    c.fillStyle = hex(BRASS_DK);
    c.fillRect(w / 2 - 1, 0, 2, 30);
    ell(c, w / 2, 34, 34, 7, BRASS_DK);
    ell(c, w / 2, 33, 30, 5, BRASS);
    for (let i = 0; i < 7; i++) {
      const x = w / 2 - 30 + i * 10;
      c.fillStyle = hex(0xf2ead8);
      c.fillRect(x, 22, 2, 8);
      ell(c, x + 1, 20, 2, 3, 0xffe0a0);
      for (let k = 0; k < 3; k++) ell(c, x + 1, 42 + k * 6, 1.5, 3, 0xd8e4f0);
    }
  } },
  table_laid: { w: 132, h: 96, anchor: FLOOR, paint(c, w, h) {
    // two chairs drawn back from it a little, as if expected
    const chair = (x, flip) => {
      const s = flip ? -1 : 1;
      box(c, x, h - 44, 5, 44, WALNUT, 0.2, 0.3);
      box(c, x + s * 2 - (flip ? 22 : 0), h - 26, 24, 5, 0x5a1e24, 0.3, 0.3);
      box(c, x + s * 20 - (flip ? 3 : 0), h - 22, 4, 22, WALNUT, 0.2, 0.3);
      box(c, x - (flip ? -1 : 1), h - 70, 6, 28, WALNUT, 0.25, 0.3);
    };
    chair(6, false);
    chair(w - 11, true);
    // the cloth to the floor
    box(c, 26, h - 44, w - 52, 6, LINEN, 0.6, 0.2);
    gradientV(c, 28, h - 38, w - 56, 38, [[0, hex(LINEN)], [1, hex(0xb8b2a2)]]);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = rgba(NIGHT, 0.08);
      c.fillRect(32 + i * 12, h - 38, 2, 38);
    }
    // the candle
    c.fillStyle = hex(BRASS);
    c.fillRect(w / 2 - 12, h - 56, 3, 12);
    c.fillStyle = hex(LINEN);
    c.fillRect(w / 2 - 12, h - 70, 3, 14);
    ell(c, w / 2 - 11, h - 73, 2, 3, 0xffd890);
    // glass, fork, knife
    c.fillStyle = rgba(0xd8e4f0, 0.8);
    c.fillRect(w / 2 + 18, h - 54, 4, 8);
    c.fillStyle = hex(ZINC_LT);
    c.fillRect(38, h - 46, 8, 1);
    c.fillRect(w - 46, h - 46, 8, 1);
  } },
  plate_cold: { w: 34, h: 10, anchor: FLOOR, paint(c, w, h) {
    ell(c, w / 2, h - 3, 15, 3, LINEN);
    ell(c, w / 2, h - 4, 9, 2.5, 0x8a7a5a);
    c.fillStyle = hex(0x5a4a34);
    c.fillRect(w / 2 - 4, h - 5, 8, 1);
  } },
  table_one: { w: 170, h: 100, anchor: FLOOR, light: { x: 85, y: 32, r: 100, color: 0xffd890 }, paint(c, w, h) {
    // one chair, drawn back, nobody
    box(c, w - 18, h - 72, 6, 30, WALNUT, 0.25, 0.3);
    box(c, w - 40, h - 26, 26, 5, 0x5a1e24, 0.3, 0.3);
    box(c, w - 18, h - 44, 5, 44, WALNUT, 0.2, 0.3);
    box(c, w - 38, h - 22, 4, 22, WALNUT, 0.2, 0.3);
    box(c, 14, h - 46, w - 58, 7, 0xfaf4e6, 0.7, 0.2);
    gradientV(c, 16, h - 39, w - 62, 39, [[0, hex(0xfaf4e6)], [1, hex(0xc8c0ae)]]);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = rgba(NIGHT, 0.07);
      c.fillRect(20 + i * 13, h - 39, 2, 39);
    }
    c.fillStyle = hex(ZINC_LT);
    c.fillRect(26, h - 48, 12, 1);
    c.fillRect(w - 74, h - 48, 12, 1);
    c.fillStyle = hex(BRASS);
    c.fillRect(44, h - 60, 3, 14);
    c.fillStyle = hex(LINEN);
    c.fillRect(44, h - 74, 3, 14);
    ell(c, 45, h - 77, 2.2, 3.4, 0xffd890);
    glow(c, 45, h - 77, 22, 0xffd890, 0.45);
  } },
};

// the carried and hung things (dishes on plates, loads off stations), painted
// once per name: a player can tell the sole from the terrine across the room
export function paintDish(c, name) {
  const plate = () => {
    ell(c, 15, 12, 14, 4, LINEN);
    ell(c, 15, 11, 10, 3, 0xf6f0e2);
  };
  switch (name) {
    case 'VELOUTE':
      ell(c, 15, 12, 11, 4, LINEN);
      ell(c, 15, 9, 10, 3, 0xe8d8a0);
      return;
    case 'TERRINE':
      plate();
      box(c, 8, 4, 14, 7, 0xc8886a, 0.3, 0.3);
      c.fillStyle = hex(0xe8dcb8);
      c.fillRect(8, 4, 14, 2);
      return;
    case 'SOLE':
      plate();
      ell(c, 15, 8, 10, 2.5, 0xd8c8a0);
      c.fillStyle = hex(0xa88a5a);
      c.fillRect(7, 8, 16, 1);
      return;
    case 'BASS':
      plate();
      ell(c, 14, 7, 9, 3, 0x9aa8a8);
      c.fillStyle = hex(0x7a8a8a);
      c.beginPath();
      c.moveTo(22, 7);
      c.lineTo(27, 4);
      c.lineTo(27, 10);
      c.fill();
      return;
    case 'TOURNEDOS':
      plate();
      box(c, 8, 4, 14, 7, 0x5a2a1a, 0.3, 0.3);
      ell(c, 15, 4, 5, 1.5, 0xc8a050);
      return;
    case 'RISOTTO':
      plate();
      ell(c, 15, 9, 9, 3, 0xe8c040);
      return;
    case 'PLATES':
      for (let i = 0; i < 5; i++) ell(c, 15, 12 - i * 2, 12, 2, i % 2 ? LINEN : 0xfaf4e6);
      return;
    case 'COPPER POTS':
      pot(c, 6, 3, 18, 11, COPPER, true);
      return;
    case 'THE TUREEN':
      ell(c, 15, 9, 13, 6, LINEN);
      ell(c, 15, 4, 8, 2.5, 0xfaf4e6);
      ell(c, 15, 2, 2, 1.5, BRASS);
      return;
    case 'BASS FOR THE GRILL':
    case 'SHALLOTS':
      ell(c, 15, 9, 12, 5, 0xb8a074);
      ell(c, 15, 4, 6, 2, 0x8a7652);
      return;
    case 'HERBS':
      ell(c, 15, 10, 12, 3, 0x6a9a4a);
      for (let i = 0; i < 6; i++) ell(c, 6 + i * 3.5, 6 - (i % 2), 2, 4, i % 2 ? 0x4a7a3a : 0x6a9a4a);
      return;
    default:
      plate();
  }
}

// a side of beef on its rail hook
export function paintBeef(c, w, h) {
  c.fillStyle = hex(ZINC);
  c.fillRect(w / 2 - 1, 0, 2, 14);
  c.fillStyle = hex(0xa84a3a);
  c.beginPath();
  c.moveTo(w / 2 - 6, 12);
  c.quadraticCurveTo(w + 2, 30, w - 6, h - 16);
  c.quadraticCurveTo(w / 2, h, 8, h - 20);
  c.quadraticCurveTo(-2, 34, w / 2 - 6, 12);
  c.fill();
  c.fillStyle = hex(0xf2e6d0);
  for (let i = 0; i < 5; i++) c.fillRect(10 + i * 3, 26 + i * 12, w - 24, 2);
  c.fillStyle = rgba(0xe8d8c0, 0.6);
  c.fillRect(6, 20, 4, h - 44);
  c.fillStyle = rgba(0x3a1410, 0.4);
  c.fillRect(w - 10, 26, 6, h - 50);
}

// the trolley the porter pushes: a zinc tray on four castors, crates on it
export function paintTrolley(c, w, h) {
  box(c, 2, h - 26, w - 4, 6, ZINC_LT, 0.45, 0.3);
  box(c, 4, h - 12, w - 8, 3, ZINC, 0.3, 0.3);
  for (const x of [4, w - 8]) {
    box(c, x, h - 26, 3, 20, ZINC, 0.3, 0.3);
    ell(c, x + 1.5, h - 4, 3.5, 3.5, IRON);
  }
  box(c, 8, h - 46, 22, 20, 0x8a6a42, 0.25, 0.3);
  box(c, 32, h - 42, 18, 16, 0x8a6a42, 0.25, 0.3);
  for (let i = 0; i < 3; i++) ell(c, 14 + i * 7, h - 47, 3, 2.5, 0xb84a2a);
}

// Jo's hands held out, painted from the run: src/engines/tickets.js readHands
// marks. Everything he has done tonight is on them.
export function paintHands(c, w, h, m) {
  gradientV(c, 0, 0, w, h, [[0, 0x2a2018], [1, 0x4a3020]]);
  glow(c, w / 2, h * 0.45, 170, 0xffc070, 0.22);
  const SKIN = 0xd8a884;
  const PALM = 0xe2b698;
  const CREASE = 0xa87a58;
  // palms up, as he holds them out: the cuff at the bottom, four fingers up, the
  // thumb on the inside. `inner` is the side the thumb is on (+1 right, -1 left)
  const hand = (cx, inner) => {
    box(c, cx - 36, h - 34, 72, 34, 0xece8dc, 0.4, 0.3); // the cuff
    c.fillStyle = rgba(NIGHT, 0.2);
    c.fillRect(cx - 36, h - 12, 72, 1);
    box(c, cx - 28, h - 44, 56, 14, SKIN, 0.2, 0.25); // the wrist
    box(c, cx - 33, h - 88, 66, 46, PALM, 0.3, 0.3); // the palm
    ell(c, cx - inner * 4, h - 66, 22, 16, mix(PALM, 0xd88870, 0.3));
    c.strokeStyle = rgba(CREASE, 0.8);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx - 28, h - 76);
    c.quadraticCurveTo(cx, h - 66, cx + 28, h - 80);
    c.moveTo(cx + inner * 26, h - 54);
    c.quadraticCurveTo(cx, h - 62, cx - inner * 10, h - 84);
    c.stroke();
    // four fingers, little to index toward the thumb
    [24, 30, 33, 28].forEach((len, i) => {
      const fx = cx + inner * (-30 + i * 15) - 7;
      box(c, fx, h - 88 - len, 14, len + 2, SKIN, 0.35, 0.3);
      c.fillStyle = rgba(CREASE, 0.8);
      c.fillRect(fx + 1, h - 88 - len * 0.5, 12, 1);
      c.fillRect(fx + 1, h - 88 - len * 0.82, 12, 1);
      box(c, fx + 2, h - 88 - len, 10, 5, 0xf2d2c0, 0.2, 0.15); // the nail side
    });
    // the thumb, out to the inside
    c.fillStyle = hex(SKIN);
    c.beginPath();
    c.moveTo(cx + inner * 30, h - 52);
    c.lineTo(cx + inner * 58, h - 88);
    c.lineTo(cx + inner * 46, h - 96);
    c.lineTo(cx + inner * 24, h - 76);
    c.closePath();
    c.fill();
  };
  const L = w * 0.3;
  const R = w * 0.7;
  hand(L, 1);
  hand(R, -1);
  // a burn on the left thumb; more if there were more
  if (m.burn) {
    ell(c, L + 46, h - 84, 8, 6, 0xc84a3a);
    ell(c, L + 46, h - 84, 4, 3, 0xf0a090);
    if (m.burns > 1) ell(c, R + 6, h - 68, 13, 5, 0xc84a3a);
    if (m.burns > 2) ell(c, L - 16, h - 94, 5, 8, 0xc84a3a);
  }
  // frost still on the cuffs
  if (m.frost) for (let i = 0; i < 44; i++) stamp(c, (i % 2 ? L : R) - 34 + (i * 13) % 68, h - 32 + (i * 7) % 30, 3, 0xdcecff, 0.85);
  // flour in the nails and the creases
  if (m.flour) for (let i = 0; i < 60; i++) stamp(c, (i % 2 ? L : R) - 34 + (i * 19) % 68, h - 122 + (i * 11) % 60, 1.8, 0xfff8ec, 0.8);
  // onion: the tips of the right hand, stained
  if (m.onion) {
    c.fillStyle = rgba(0x8a6a2a, 0.55);
    c.fillRect(R - 38, h - 124, 60, 14);
  }
  // split knuckles from the pit's soap
  if (m.soap) for (let i = 0; i < 5; i++) {
    c.fillStyle = rgba(0xc86a5a, 0.75);
    c.fillRect(L - 30 + i * 15, h - 96, 5, 1);
  }
}

// the ending: one plate, one lamp, a white cloth. finish = menu | own | plain
export function paintEnding(c, w, h, finish) {
  gradientV(c, 0, 0, w, h, [[0, hex(0x0c0a10)], [0.65, hex(0x140e12)], [1, hex(0x1e1416)]]);
  const cx = w / 2;
  const cy = h * 0.62;
  // far off, the swing door, with its line of kitchen light
  box(c, w - 76, h * 0.2, 36, 76, 0x241a1c, 0.1, 0.3);
  c.fillStyle = rgba(0xffc070, 0.55);
  c.fillRect(w - 58, h * 0.2 + 2, 1, 74);
  if (finish === 'own') {
    // she has gone back to the door; a shape in the crack of light, a wrist at her mouth
    c.fillStyle = hex(0xe8e4d8);
    c.fillRect(w - 72, h * 0.2 + 22, 13, 54);
    ell(c, w - 65, h * 0.2 + 16, 6, 7, 0x3a4a6a);
    ell(c, w - 64, h * 0.2 + 18, 4, 4, 0xc8a084);
    c.fillStyle = hex(0xe8e4d8);
    c.fillRect(w - 62, h * 0.2 + 22, 3, 12);
  }
  // the empty chair, drawn back
  for (const x of [cx - 30, cx + 24]) box(c, x, cy - 94, 6, 90, 0x1e1012, 0.12, 0.3);
  box(c, cx - 30, cy - 94, 60, 8, 0x241416, 0.2, 0.3);
  box(c, cx - 24, cy - 84, 48, 40, 0x4a161c, 0.15, 0.2);
  // the lamp's pool on the cloth
  glow(c, cx, cy, 190, 0xffd890, 0.42);
  ell(c, cx, cy + 22, 180, 42, 0xfaf4e6);
  gradientV(c, cx - 180, cy + 24, 360, h - cy, [[0, hex(0xc8c0ae)], [1, hex(0x4a4238)]]);
  ell(c, cx, cy + 18, 180, 36, 0xfaf4e6);
  glow(c, cx, cy + 10, 150, 0xffd890, 0.25);
  // the plate
  ell(c, cx, cy + 16, 74, 18, 0xc8c0ae);
  ell(c, cx, cy + 12, 72, 18, 0xfffaf0);
  ell(c, cx, cy + 12, 50, 12, 0xf2ead8);
  ell(c, cx, cy + 10, 38, 10, finish === 'own' ? 0xc89830 : 0xe8c040);
  for (let i = 0; i < 40; i++) ell(c, cx - 34 + (i * 7) % 66, cy + 4 + (i * 5) % 12, 1.6, 1, 0xf6e080);
  if (finish !== 'plain') {
    c.fillStyle = hex(0xf6d98a);
    c.beginPath();
    c.moveTo(cx - 6, cy + 4);
    c.lineTo(cx + 7, cy + 2);
    c.lineTo(cx + 5, cy + 9);
    c.lineTo(cx - 8, cy + 8);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillRect(cx - 2, cy + 4, 3, 1);
  }
  // the fork: squared to the plate, unless someone has used it
  c.fillStyle = hex(0x5a6068);
  if (finish === 'own') {
    // one forkful gone: a clean bite out of the rice; the fork laid back crooked
    ell(c, cx + 22, cy + 10, 10, 5, 0xf2ead8);
    c.save();
    c.translate(cx + 100, cy + 16);
    c.rotate(-0.5);
    c.fillRect(-2, -26, 4, 44);
    c.fillRect(-5, -34, 10, 10);
    c.restore();
  } else {
    c.fillRect(cx + 94, cy + 2, 4, 26);
    c.fillRect(cx + 90, cy - 4, 12, 8);
  }
  c.fillRect(cx - 98, cy + 2, 4, 28);
  // the card
  box(c, cx - 150, cy + 6, 30, 20, 0xf2ead8, 0.6, 0.3);
  c.fillStyle = 'rgba(40,20,20,0.7)';
  c.fillRect(cx - 145, cy + 12, 20, 1);
  c.fillRect(cx - 145, cy + 17, 14, 1);
  grain(c, 0, 0, w, h, 0.05, 9, 2);
}
