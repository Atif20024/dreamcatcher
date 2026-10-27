import Phaser from 'phaser';
import { hex, rgba, mix, shade, hsl, fbm, stamp, dab, gradientV, grain, wash, paintTexture } from './paint.js';

// Crossroads Station, painted. The same toolkit as THE LONG EVENING, the
// station's own palette: cream stone, brass, dark-green ironwork, warm
// lamplight. One sun, low in the west (the left), so every lit face is on the
// left and every shadow falls right. Value before hue; far edges soft, near
// edges cut; grain felt, not seen.
//
// Three families live here:
//   paintHubLayer     the parallax bands (vault, facade, ticket hall, shed)
//   paintHubLandmark  the single readable shapes (clocks, signs, the shed)
//   HUB_PROPS/hubTex  every prop the scene stands on the floor
// and the people are in entities/hubArt.js, still pixel rigs.

// ---- palette ------------------------------------------------------------------
const SUN = 0xfff0c8; // warm gold rim light
const SHADE = 0x2a2048; // the cool it falls into
const CREAM = 0xe8dcc0;
const STONE = 0xd8cbb0;
const BRASS = 0xc4a25c;
const GREEN = 0x2e6a4a;
const IRON = 0x3a3a44;
const LAMP = 0xf2d580;
const WOOD = 0x5a4632;
const INK = 0x14141c;

export const lit = (c, k = 0.3) => mix(c, SUN, k);
export const dim = (c, k = 0.35) => mix(hsl(c, 0.03, 0.06, 0), SHADE, k);

// ---- brushes for built things -------------------------------------------------------
function rr(ctx, x, y, w, h, r = 1.5) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

// A solid: lit from the west, shaded east, a highlight on the top edge, weight
// at the foot. The workhorse for anything box-shaped.
export function block(ctx, x, y, w, h, base, o = {}) {
  const { r = 1.5, litK = 0.3, dimK = 0.4, top = 0.35, foot = 0.3, alpha = 1, mid = 0.35 } = o;
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, rgba(lit(base, litK), alpha));
  g.addColorStop(mid, rgba(base, alpha));
  g.addColorStop(1, rgba(dim(base, dimK), alpha));
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
  const gv = ctx.createLinearGradient(0, y, 0, y + h);
  gv.addColorStop(0, rgba(SUN, top * 0.7 * alpha));
  gv.addColorStop(Math.min(0.5, 2 / Math.max(2, h)), rgba(SUN, 0));
  gv.addColorStop(0.7, rgba(SHADE, 0));
  gv.addColorStop(1, rgba(SHADE, foot * alpha));
  ctx.fillStyle = gv;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
}

// A vertical cylinder: post, column, pipe. A specular band a third in from the sun.
export function cyl(ctx, x, y, w, h, base, o = {}) {
  const { alpha = 1, litK = 0.45, dimK = 0.5 } = o;
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, rgba(mix(base, SUN, litK * 0.5), alpha));
  g.addColorStop(0.28, rgba(lit(base, litK), alpha));
  g.addColorStop(0.55, rgba(base, alpha));
  g.addColorStop(1, rgba(dim(base, dimK), alpha));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// A horizontal rail, tube, beam: lit along its top, dark under.
export function bar(ctx, x, y, w, h, base, o = {}) {
  const { alpha = 1 } = o;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgba(lit(base, 0.45), alpha));
  g.addColorStop(0.4, rgba(base, alpha));
  g.addColorStop(1, rgba(dim(base, 0.5), alpha));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// The contact shadow: the thing sits on the ground, and the sun is in the
// west so its shadow leans east.
export function cshadow(ctx, cx, y, w, a = 0.35, h = 3) {
  dab(ctx, cx + w * 0.12, y, w * 0.6, h, 0, 0x1a1428, a, 0.7);
}

export function glow(ctx, x, y, r, color = LAMP, a = 0.35) {
  stamp(ctx, x, y, r, color, a, 0.9);
}

// a pane of glass with something warm behind it
export function pane(ctx, x, y, w, h, o = {}) {
  const { warm = 0.6, bars = 0, base = 0x3a3a48 } = o;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, hex(mix(base, LAMP, warm * 0.5)));
  g.addColorStop(0.5, hex(mix(base, 0xf2c078, warm)));
  g.addColorStop(1, hex(mix(base, 0x8a6a40, warm * 0.8)));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // a reflection: a pale diagonal streak top-left
  const rg = ctx.createLinearGradient(x, y, x + w * 0.6, y + h * 0.6);
  rg.addColorStop(0, rgba(0xffffff, 0.28));
  rg.addColorStop(0.5, rgba(0xffffff, 0.04));
  rg.addColorStop(1, rgba(0xffffff, 0));
  ctx.fillStyle = rg;
  ctx.fillRect(x, y, w, h);
  if (bars) {
    ctx.fillStyle = rgba(INK, 0.55);
    for (let i = 1; i < bars; i++) ctx.fillRect(x + Math.round((w * i) / bars), y, 1, h);
    ctx.fillRect(x, y + Math.round(h / 2), w, 1);
  }
  // the reveal: the top and the sunward side are in shadow (the glass is set in)
  ctx.fillStyle = rgba(INK, 0.4);
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = rgba(SUN, 0.35);
  ctx.fillRect(x, y + h - 1, w, 1);
}

// painted lettering: a serif face, a cut shadow under it, as on a sign
export function letters(ctx, text, x, y, size, color, o = {}) {
  const { align = 'center', weight = 'bold', shadow = 0.5, spacing = 0, font = 'Georgia, "Times New Roman", serif' } = o;
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (spacing && ctx.letterSpacing !== undefined) ctx.letterSpacing = `${spacing}px`;
  if (shadow) {
    ctx.fillStyle = rgba(INK, shadow);
    ctx.fillText(text, x + 1, y + 1);
  }
  ctx.fillStyle = hex(color);
  ctx.fillText(text, x, y);
  ctx.restore();
}

// the last pass on everything: a slow wash so no fill is one colour, and grain
export function finish(ctx, w, h, seed = 1, o = {}) {
  const { washA = 0.1, grainA = 0.05, a = 0xb08868, b = 0xf8ecd8 } = o;
  if (washA) wash(ctx, 0, 0, w, h, a, b, washA, seed, 0.03);
  if (grainA) grain(ctx, 0, 0, w, h, grainA, seed + 7);
}

// ashlar: stone courses with staggered joints, a lit lip on each course
function courses(ctx, x, y, w, h, step = 32, a = 0.22, seed = 1) {
  for (let cy = y; cy < y + h; cy += step) {
    ctx.fillStyle = rgba(SHADE, a);
    ctx.fillRect(x, cy, w, 1);
    ctx.fillStyle = rgba(SUN, a * 0.9);
    ctx.fillRect(x, cy + 1, w, 1);
    const off = (Math.floor((cy - y) / step) % 2) * (step * 1.5) + seed * 7;
    for (let jx = x + (off % (step * 3)); jx < x + w; jx += step * 3) {
      ctx.fillStyle = rgba(SHADE, a * 0.8);
      ctx.fillRect(jx, cy + 2, 1, step - 2);
    }
  }
}

// a round-headed opening: returns nothing, paints glass then reveals
function arch(ctx, x, y, w, h, fill) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + w / 2);
  ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.clip();
  fill(x, y, w, h);
  // the reveal: shadow on the sunward jamb and the crown, light on the far jamb
  const gl = ctx.createLinearGradient(x, 0, x + w, 0);
  gl.addColorStop(0, rgba(INK, 0.45));
  gl.addColorStop(0.12, rgba(INK, 0));
  gl.addColorStop(0.9, rgba(SUN, 0));
  gl.addColorStop(1, rgba(SUN, 0.35));
  ctx.fillStyle = gl;
  ctx.fillRect(x, y, w, h);
  const gt = ctx.createLinearGradient(0, y, 0, y + w * 0.6);
  gt.addColorStop(0, rgba(INK, 0.4));
  gt.addColorStop(1, rgba(INK, 0));
  ctx.fillStyle = gt;
  ctx.fillRect(x, y, w, w);
  ctx.restore();
}

// a pendant lamp: chain, shade, bulb, its glow
function pendant(ctx, x, top, len, o = {}) {
  const { r = 14, on = true, shadeCol = GREEN } = o;
  const y = top + len;
  ctx.fillStyle = rgba(IRON, 0.9);
  ctx.fillRect(x - 1, top, 2, len);
  if (on) glow(ctx, x, y + 6, r * 3.2, LAMP, 0.3);
  // the shade: a cone, dark green outside, its lip lit
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 10);
  ctx.lineTo(x + 4, y - 10);
  ctx.lineTo(x + r, y + 2);
  ctx.lineTo(x - r, y + 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(x - r, 0, x + r, 0);
  g.addColorStop(0, hex(lit(shadeCol, 0.35)));
  g.addColorStop(0.5, hex(shadeCol));
  g.addColorStop(1, hex(dim(shadeCol, 0.5)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = rgba(on ? LAMP : 0x8a8478, on ? 0.9 : 0.5);
  ctx.fillRect(x - r + 1, y + 1, r * 2 - 2, 2);
  if (on) {
    stamp(ctx, x, y + 4, 5, 0xfff6dc, 0.95, 0.5);
    stamp(ctx, x, y + 5, 10, LAMP, 0.35, 0.8);
  } else {
    ctx.fillStyle = rgba(0x8a8478, 0.7);
    ctx.fillRect(x - 2, y + 2, 4, 3);
  }
}

// ---- the parallax bands -----------------------------------------------------------------
// Each painter gets a horizontally tileable canvas of the kind's height. The
// wall kind (hall_vault, gate_dark) is tiled vertically by the parallax too;
// 576 is the hall's floor-to-roof height so the pattern repeats at the roof.
const LAYER_PAINTERS = {
  hall_vault: [576, (ctx, W, H, rand) => {
    // Drawn in "design" coordinates where y 36 is the concourse floor and
    // one period up (y 36 of the tile above) is the roof walkway; the
    // wrapper shifts it onto the parallax's tiling. Reading down: a plinth
    // band (0-36, just above the floor), the slab (36-76, hidden below the
    // floor -- and, one tile up, the shadowed top of the wall under the
    // roof), a string course, a plain upper wall with small niches
    // (100-260, which the undercroft also sees, as vents), then the arcade
    // (276-500) and the dado at the foot of the wall (500-576).
    gradientV(ctx, 0, 0, W, H, [[0, 0xd6c8ab], [0.35, CREAM], [1, 0xe4d6b8]]);
    courses(ctx, 0, 76, W, 424, 32, 0.12, 3);
    const dado = (y, h) => {
      gradientV(ctx, 0, y, W, h, [[0, 0xc8b898], [1, 0xb9a885]]);
      courses(ctx, 0, y, W, h, 18, 0.2, 9);
    };
    dado(500, 76);
    dado(0, 36);
    bar(ctx, 0, 498, W, 4, 0xcbbb9a); // the moulding on top of it
    ctx.fillStyle = rgba(SHADE, 0.22);
    ctx.fillRect(0, 502, W, 2);
    // the slab band: dark, the roof's shadow on the top of the wall
    gradientV(ctx, 0, 36, W, 40, [[0, 0x9a8c70], [1, 0xc4b494]]);
    gradientV(ctx, 0, 36, W, 40, [[0, SHADE, 0.3], [1, SHADE, 0]]);
    // string courses
    for (const y of [76, 262]) {
      bar(ctx, 0, y, W, 8, 0xd4c4a2);
      ctx.fillStyle = rgba(SHADE, 0.22);
      ctx.fillRect(0, y + 8, W, 3);
      ctx.fillStyle = rgba(SUN, 0.3);
      ctx.fillRect(0, y, W, 1);
    }
    // the upper wall: plain ashlar, a row of small round-headed niches
    for (let i = 0; i < 8; i++) {
      const nx = i * 64 + 22;
      arch(ctx, nx, 150, 20, 50, (x, y, w, h) => {
        gradientV(ctx, x, y, w, h, [[0, 0x8a7c62], [1, 0x5a5044]]);
        if (i % 3 === 1) glow(ctx, x + w / 2, y + h * 0.6, 16, 0xf2c078, 0.35);
      });
      bar(ctx, nx - 3, 200, 26, 4, 0xd4c4a2);
      ctx.fillStyle = rgba(SHADE, 0.2);
      ctx.fillRect(nx - 3, 204, 26, 2);
    }
    // the arcade: four bays, a pier between each
    const bays = 4;
    const bw = W / bays;
    for (let i = 0; i < bays; i++) {
      const x0 = i * bw;
      const wx = x0 + 34;
      const ww = bw - 68;
      // the window: light coming through from a sky we cannot see
      arch(ctx, wx, 288, ww, 196, (x, y, w, h) => {
        gradientV(ctx, x, y, w, h, [[0, 0xf8f0dc], [0.4, 0xefe3c8], [1, 0xdccfb0]]);
        ctx.fillStyle = rgba(0x6a5a48, 0.35);
        for (let gx = x + 12; gx < x + w; gx += 14) ctx.fillRect(gx, y, 1, h);
        for (let gy = y + 14; gy < y + h; gy += 16) ctx.fillRect(x, gy, w, 1);
        stamp(ctx, x + w * 0.3, y + h * 0.75, w * 0.5, 0xfff0c0, 0.35, 0.9);
      });
      bar(ctx, wx - 6, 484, ww + 12, 6, 0xd4c4a2);
      ctx.fillStyle = rgba(SHADE, 0.25);
      ctx.fillRect(wx - 6, 490, ww + 12, 3);
      // the pier: a shallow pilaster, lit on its west edge, with a capital
      const pxx = x0 + 4;
      cyl(ctx, pxx, 270, 26, 230, 0xdccfb2, { litK: 0.35, dimK: 0.35 });
      bar(ctx, pxx - 4, 274, 34, 8, 0xd8caa8);
      bar(ctx, pxx - 3, 490, 32, 10, 0xd0c09e);
      const sg = ctx.createLinearGradient(pxx + 30, 0, pxx + 50, 0);
      sg.addColorStop(0, rgba(SHADE, 0.2));
      sg.addColorStop(1, rgba(SHADE, 0));
      ctx.fillStyle = sg;
      ctx.fillRect(pxx + 30, 274, 20, 226);
    }
    // light bouncing up from the floor onto the dado; soot high up
    gradientV(ctx, 0, 440, W, 60, [[0, 0xf0c090, 0], [1, 0xf0c090, 0.12]]);
    for (let i = 0; i < 26; i++) stamp(ctx, rand.between(0, W), rand.between(80, 140), rand.between(20, 50), 0x3a3030, 0.05, 0.9);
  }, { shift: 396, wash: [0xb8a080, 0xfaf0dc, 0.14], grain: 0.045 }],

  gate_dark: [576, (ctx, W, H, rand) => {
    // the service end: engineering brick, damp, one barred window's cold light
    gradientV(ctx, 0, 0, W, H, [[0, 0x1a221c], [0.4, 0x243028], [1, 0x1e2a22]]);
    // brick courses
    for (let y = 0; y < H; y += 10) {
      ctx.fillStyle = rgba(0x0a0e0c, 0.35);
      ctx.fillRect(0, y, W, 1);
      const off = (y / 10) % 2 ? 12 : 0;
      for (let x = off; x < W; x += 24) {
        ctx.fillStyle = rgba(0x0a0e0c, 0.3);
        ctx.fillRect(x, y, 1, 10);
        if (rand.frac() < 0.12) {
          ctx.fillStyle = rgba(rand.frac() < 0.5 ? 0x3a4a3c : 0x2a3a30, 0.5);
          ctx.fillRect(x + 1, y + 1, 23, 9);
        }
      }
    }
    // damp running down from the top, rust under an old bracket
    for (let i = 0; i < 18; i++) {
      const x = rand.between(0, W);
      const g = ctx.createLinearGradient(0, 0, 0, rand.between(120, 400));
      g.addColorStop(0, rgba(0x0a1410, 0.5));
      g.addColorStop(1, rgba(0x0a1410, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, rand.between(3, 14), 400);
    }
    for (let i = 0; i < 6; i++) {
      const x = rand.between(0, W);
      const y = rand.between(100, 300);
      ctx.fillStyle = rgba(IRON, 0.8);
      ctx.fillRect(x, y, 30, 4);
      const g = ctx.createLinearGradient(0, y, 0, y + 90);
      g.addColorStop(0, rgba(0x8a4a2a, 0.35));
      g.addColorStop(1, rgba(0x8a4a2a, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x + 4, y + 4, 22, 90);
    }
    // a pipe run along the wall, and one barred vent with cold light behind it
    bar(ctx, 0, 150, W, 8, 0x3a3a3c);
    ctx.fillStyle = rgba(INK, 0.4);
    ctx.fillRect(0, 158, W, 3);
    const vx = 340;
    ctx.fillStyle = hex(0x0c1210);
    ctx.fillRect(vx, 210, 60, 40);
    stamp(ctx, vx + 30, 230, 70, 0x88b8d8, 0.12, 0.9);
    ctx.fillStyle = rgba(0x88b8d8, 0.5);
    for (let i = 0; i < 5; i++) ctx.fillRect(vx + 6 + i * 12, 210, 2, 40);
    // the floor line: a little bounced light so the foot of the wall reads
    gradientV(ctx, 0, 0, W, 36, [[0, 0x88b8d8, 0.05], [1, 0x88b8d8, 0]]);
    gradientV(ctx, 0, 520, W, 56, [[0, 0x0a0e0c, 0], [1, 0x0a0e0c, 0.4]]);
  }, { shift: 396, wash: [0x1a1a24, 0x3a4a3a, 0.2], grain: 0.06 }],

  station_facade: [1080, (ctx, W, H, rand) => {
    // The front of the station, hung from the STREET (the steps room's
    // horizon is the pavement, 160px below the hall floor). The tile is two
    // screens tall: the building fills its top half (roofline at y 0, the
    // pavement at y 540) and the lower half is left clear, which is what
    // shows above the roofline when the tile repeats -- sky. Reading down:
    // parapet and cornice, an attic of small windows, the main storey of
    // tall arched windows whose sills meet the hall floor (y 380), and a
    // rusticated base standing on the pavement, in the terrace's shadow.
    const B = 540; // the pavement line
    gradientV(ctx, 0, 0, W, B, [[0, 0xd2c4a4], [0.3, 0xe0d3b6], [0.75, 0xd8cbb0], [1, 0xb8a888]]);
    courses(ctx, 0, 60, W, 320, 22, 0.14, 2);
    // parapet, cornice with dentils, its shadow
    bar(ctx, 0, 0, W, 10, 0xe6dabd);
    ctx.fillStyle = rgba(SHADE, 0.3);
    ctx.fillRect(0, 10, W, 2);
    for (let x = 0; x < W; x += 12) {
      ctx.fillStyle = rgba(SHADE, 0.28);
      ctx.fillRect(x + 6, 12, 4, 6);
      ctx.fillStyle = rgba(SUN, 0.3);
      ctx.fillRect(x + 4, 12, 2, 6);
    }
    bar(ctx, 0, 18, W, 5, 0xd6c8a8);
    gradientV(ctx, 0, 23, W, 26, [[0, SHADE, 0.22], [1, SHADE, 0]]);
    // the attic: small square windows between the pilaster tops
    for (let i = 0; i < 8; i++) {
      const x = i * 64 + 22;
      pane(ctx, x, 30, 20, 16, { warm: rand.frac() < 0.4 ? 0.6 : 0.15, base: 0x3a3440 });
      bar(ctx, x - 2, 46, 24, 3, 0xd8caa8);
    }
    bar(ctx, 0, 56, W, 6, 0xd8caa8);
    ctx.fillStyle = rgba(SHADE, 0.22);
    ctx.fillRect(0, 62, W, 2);
    // the main storey: four bays of tall arched windows, lit from inside
    const bw = 128;
    for (let i = 0; i < W / bw; i++) {
      const x0 = i * bw;
      const wx = x0 + 38;
      const ww = 52;
      arch(ctx, wx, 130, ww, 240, (x, y, w, h) => {
        pane(ctx, x, y, w, h, { warm: 0.6, base: 0x3a3440 });
        ctx.fillStyle = rgba(INK, 0.5);
        for (let gx = x + 9; gx < x + w; gx += 9) ctx.fillRect(gx, y, 1, h);
        for (let gy = y + 12; gy < y + h; gy += 14) ctx.fillRect(x, gy, w, 1);
        glow(ctx, x + w * 0.5, y + h * 0.6, w * 0.8, 0xf2c078, 0.3);
        // a figure at one window, in silhouette
        if (i === 1) {
          ctx.fillStyle = rgba(0x2a2230, 0.7);
          ctx.fillRect(x + 20, y + 150, 10, 40);
          stamp(ctx, x + 25, y + 146, 5, 0x2a2230, 0.8, 0.3);
        }
      });
      ctx.fillStyle = rgba(0xe6dabd, 0.9);
      ctx.fillRect(wx + ww / 2 - 4, 126, 8, 10);
      ctx.strokeStyle = rgba(SUN, 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wx + ww / 2, 130 + ww / 2, ww / 2 + 3, Math.PI, 0);
      ctx.stroke();
      bar(ctx, wx - 6, 368, ww + 12, 5, 0xd8caa8);
      ctx.fillStyle = rgba(SHADE, 0.25);
      ctx.fillRect(wx - 6, 373, ww + 12, 3);
      // pilaster
      cyl(ctx, x0 + 6, 64, 20, 316, 0xdccfb2, { litK: 0.4, dimK: 0.4 });
      bar(ctx, x0 + 2, 64, 28, 7, 0xe0d3b6);
      bar(ctx, x0 + 3, 372, 26, 8, 0xd0c09e);
      const sg = ctx.createLinearGradient(x0 + 26, 0, x0 + 44, 0);
      sg.addColorStop(0, rgba(SHADE, 0.22));
      sg.addColorStop(1, rgba(SHADE, 0));
      ctx.fillStyle = sg;
      ctx.fillRect(x0 + 26, 70, 18, 310);
    }
    // the base: a string course at the hall floor, rusticated courses below,
    // the terrace's long shadow, and a plinth on the pavement
    bar(ctx, 0, 380, W, 8, 0xd8caa8);
    ctx.fillStyle = rgba(SHADE, 0.3);
    ctx.fillRect(0, 388, W, 3);
    gradientV(ctx, 0, 391, W, 149, [[0, 0xc8b898], [1, 0xa89878]]);
    for (let y = 391; y < 528; y += 18) {
      ctx.fillStyle = rgba(SHADE, 0.35);
      ctx.fillRect(0, y, W, 2);
      ctx.fillStyle = rgba(SUN, 0.25);
      ctx.fillRect(0, y + 2, W, 1);
      const off = ((y - 391) / 18) % 2 ? 40 : 0;
      for (let x = off; x < W; x += 80) {
        ctx.fillStyle = rgba(SHADE, 0.3);
        ctx.fillRect(x, y + 2, 2, 16);
      }
    }
    // a barred basement window or two in the base
    for (const x of [90, 346]) {
      ctx.fillStyle = hex(0x2a2a34);
      ctx.fillRect(x, 470, 30, 18);
      ctx.fillStyle = rgba(0x8a8a90, 0.8);
      for (let g = 0; g < 4; g++) ctx.fillRect(x + 4 + g * 7, 470, 1, 18);
      ctx.fillStyle = rgba(INK, 0.4);
      ctx.fillRect(x, 470, 30, 1);
    }
    bar(ctx, 0, 528, W, 12, 0xb0a080);
    ctx.fillStyle = rgba(SUN, 0.25);
    ctx.fillRect(0, 528, W, 1);
    // rain has darkened the foot of the wall; the terrace throws a shadow
    gradientV(ctx, 0, 391, W, 40, [[0, SHADE, 0.28], [1, SHADE, 0]]);
    gradientV(ctx, 0, 470, W, 70, [[0, 0x2a2a40, 0], [1, 0x2a2a40, 0.45]]);
    for (let i = 0; i < 24; i++) stamp(ctx, rand.between(0, W), rand.between(470, 530), rand.between(10, 30), 0x2a2a40, 0.07, 0.9);
    // the pavement it stands on, a little of it, then nothing (sky above
    // the roofline when the tile repeats)
    gradientV(ctx, 0, B, W, 24, [[0, 0x5a5a64, 1], [1, 0x4a4a54, 1]]);
  }, { shift: 540, wash: [0xa89070, 0xf4e8d0, 0.14], grain: 0.05 }],

  station_street: [210, (ctx, W, H, rand) => {
    // the street outside, at the foot of the facade: pavement and kerb,
    // a lamp, bollards, bins, a parked cab, puddles with the lamp in them
    const floor = H - 10;
    // pavement with flags, a kerb, the wet road edge
    gradientV(ctx, 0, floor - 6, W, 16, [[0, 0x7a7a84], [0.4, 0x66666e], [1, 0x50505a]]);
    ctx.fillStyle = rgba(SUN, 0.25);
    ctx.fillRect(0, floor - 6, W, 1);
    ctx.fillStyle = rgba(INK, 0.35);
    for (let x = 0; x < W; x += 28) ctx.fillRect(x, floor - 6, 1, 8);
    ctx.fillRect(0, floor + 2, W, 1);
    // puddles: pale streaks that catch the lamps
    for (let i = 0; i < 6; i++) {
      const x = rand.between(0, W);
      dab(ctx, x, floor - 2, rand.between(14, 30), 2, 0, 0x8a9ab0, 0.35, 0.6);
      dab(ctx, x + 4, floor - 2.5, 6, 1, 0, 0xf2d580, 0.3, 0.6);
    }
    // the lamp: a tall iron post, a lantern head, its pool of light
    const lamp = (x) => {
      glow(ctx, x, floor - 118, 60, LAMP, 0.28);
      stamp(ctx, x, floor - 6, 40, LAMP, 0.12, 0.9);
      cshadow(ctx, x, floor, 30, 0.3, 2);
      cyl(ctx, x - 2, floor - 110, 4, 110, 0x2e2e38);
      block(ctx, x - 6, floor - 6, 12, 6, 0x2e2e38, { r: 2 });
      lampHead(ctx, x, floor - 118, true);
    };
    const bollard = (x) => {
      cshadow(ctx, x, floor, 16, 0.3, 2);
      cyl(ctx, x - 3, floor - 22, 6, 22, IRON);
      stamp(ctx, x, floor - 23, 4, IRON, 1, 0.2);
      stamp(ctx, x - 1, floor - 24, 1.5, lit(IRON, 0.8), 0.9, 0.4);
    };
    const bins = (x) => {
      cshadow(ctx, x + 14, floor, 40, 0.35, 3);
      for (let i = 0; i < 2; i++) {
        const bx = x + i * 14;
        cyl(ctx, bx, floor - 24, 12, 24, 0x4a4a52);
        ctx.fillStyle = rgba(INK, 0.3);
        for (let y = floor - 20; y < floor; y += 6) ctx.fillRect(bx, y, 12, 1);
        bar(ctx, bx - 1, floor - 26, 14, 3, 0x5a5a62);
      }
    };
    const cab = (x) => {
      cshadow(ctx, x + 44, floor, 100, 0.45, 4);
      for (const wx of [x + 18, x + 70]) {
        stamp(ctx, wx, floor - 6, 7, 0x1a1a20, 1, 0.15);
        stamp(ctx, wx - 0.5, floor - 6.5, 2.5, 0x6a6a72, 1, 0.3);
      }
      const body = 0x1e1e26;
      const g = ctx.createLinearGradient(x, 0, x + 88, 0);
      g.addColorStop(0, hex(mix(body, SUN, 0.28)));
      g.addColorStop(0.4, hex(body));
      g.addColorStop(1, hex(dim(body, 0.3)));
      ctx.fillStyle = g;
      rr(ctx, x, floor - 22, 88, 18, 5);
      ctx.fill();
      rr(ctx, x + 18, floor - 38, 50, 20, 6);
      ctx.fill();
      ctx.fillStyle = rgba(SUN, 0.3);
      ctx.fillRect(x + 22, floor - 38, 42, 1);
      pane(ctx, x + 22, floor - 35, 18, 12, { warm: 0.1, base: 0x4a5a6a });
      pane(ctx, x + 44, floor - 35, 20, 12, { warm: 0.1, base: 0x4a5a6a });
      // the TAXI light, lit
      glow(ctx, x + 43, floor - 41, 10, 0xf2c078, 0.4);
      block(ctx, x + 36, floor - 43, 14, 5, 0xf2c078, { r: 1 });
      stamp(ctx, x + 84, floor - 16, 3, 0xfff6dc, 0.9, 0.4);
      stamp(ctx, x + 4, floor - 16, 2.5, 0xe84a3a, 0.9, 0.4);
    };
    const poster = (x) => {
      cshadow(ctx, x + 14, floor, 30, 0.3, 2);
      cyl(ctx, x + 12, floor - 60, 4, 60, IRON);
      block(ctx, x, floor - 92, 28, 36, 0x2e3a52, { r: 1 });
      block(ctx, x + 3, floor - 89, 22, 30, 0xe8dcc8, { r: 0.5, litK: 0.1, dimK: 0.2 });
      ctx.fillStyle = rgba(0x8a3a3a, 0.9);
      ctx.fillRect(x + 6, floor - 84, 16, 3);
      stamp(ctx, x + 14, floor - 70, 6, 0x3a5a80, 0.7, 0.5);
    };
    cab(400);
    bins(20);
    lamp(70);
    bollard(120);
    bollard(144);
    poster(200);
    lamp(300);
    bollard(340);
    bins(500);
    grain(ctx, 0, 0, W, H, 0.05, 15);
  }],

  ticket_hall: [210, (ctx, W, H, rand) => {
    // the hall's inner wall: plaster above, a dark-green panelled ticket
    // office below with brass-grilled windows, TICKETS lettered in gold
    gradientV(ctx, 0, 0, W, 70, [[0, 0xd4c6a8], [1, CREAM]]);
    wash(ctx, 0, 0, W, 70, 0xb8a080, 0xfaf0dc, 0.14, 4, 0.03);
    courses(ctx, 0, 0, W, 70, 24, 0.1, 5);
    // the woodwork
    gradientV(ctx, 0, 70, W, 140, [[0, 0x2a5e42], [0.5, GREEN], [1, 0x24503a]]);
    wash(ctx, 0, 70, W, 140, 0x1e4030, 0x4a8a5a, 0.18, 17, 0.03);
    // a cornice on the office, brass-edged
    bar(ctx, 0, 66, W, 6, 0x3a7a56);
    bar(ctx, 0, 72, W, 2, BRASS);
    // panelling: recessed panels below the windows
    for (let x = 0; x < W; x += 32) {
      ctx.fillStyle = rgba(INK, 0.28);
      ctx.fillRect(x + 3, 160, 26, 40);
      ctx.fillStyle = rgba(SUN, 0.14);
      ctx.fillRect(x + 3, 199, 26, 1);
      ctx.fillRect(x + 28, 160, 1, 40);
      ctx.fillStyle = rgba(INK, 0.3);
      ctx.fillRect(x + 3, 160, 26, 1);
      ctx.fillRect(x + 3, 160, 1, 40);
    }
    bar(ctx, 0, 156, W, 4, 0x3a7a56);
    // the windows: brass frame, warm inside, a grille
    for (let i = 0; i < 4; i++) {
      const x = i * 128 + 42;
      bar(ctx, x - 4, 92, 52, 4, BRASS);
      cyl(ctx, x - 4, 92, 4, 60, BRASS);
      cyl(ctx, x + 44, 92, 4, 60, BRASS);
      pane(ctx, x, 96, 44, 56, { warm: 0.75, base: 0x4a3a30 });
      glow(ctx, x + 22, 130, 36, 0xf2c078, 0.35);
      ctx.fillStyle = rgba(BRASS, 0.8);
      for (let g = 0; g < 6; g++) ctx.fillRect(x + 4 + g * 7, 100, 1, 26);
      ctx.fillRect(x + 2, 126, 40, 1);
      // the counter shelf under it, brass, and its shadow on the panelling
      bar(ctx, x - 6, 152, 56, 4, BRASS);
      ctx.fillStyle = rgba(INK, 0.3);
      ctx.fillRect(x - 6, 156, 56, 3);
      // a little number plate
      block(ctx, x + 14, 82, 16, 8, 0xf2e6cc, { r: 1 });
      letters(ctx, String(i + 1), x + 22, 86, 7, 0x2a2230, { shadow: 0 });
    }
    letters(ctx, 'TICKETS', 128, 56, 15, BRASS, { spacing: 4, shadow: 0.55 });
    letters(ctx, 'ENQUIRIES', 384, 56, 13, BRASS, { spacing: 3, shadow: 0.55 });
    // the light: the west is warm, the office throws a shadow at its foot
    const gl = ctx.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, rgba(SUN, 0.12));
    gl.addColorStop(0.5, rgba(SUN, 0));
    gl.addColorStop(1, rgba(SHADE, 0.12));
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W, H);
    gradientV(ctx, 0, 186, W, 24, [[0, INK, 0], [1, INK, 0.4]]);
    void rand;
    grain(ctx, 0, 0, W, H, 0.05, 31);
  }],

  ticket_booths: [108, (ctx, W, H, rand) => {
    // what stands along the hall floor, close: trunks, a trolley, a palm in
    // a brass pot, a newspaper rack
    const floor = H - 6;
    const trunkStack = (x) => {
      const cols = [0x6a5a3a, 0x5a4632, 0x7a6244];
      let y = floor;
      for (let i = 0; i < 3; i++) {
        const w = 44 - i * 6;
        const h = 14;
        y -= h;
        const xx = x + i * 3;
        block(ctx, xx, y, w, h, cols[i % 3], { r: 2 });
        ctx.fillStyle = rgba(BRASS, 0.85);
        ctx.fillRect(xx + 1, y + 1, 3, 3);
        ctx.fillRect(xx + w - 4, y + 1, 3, 3);
        ctx.fillRect(xx + 1, y + h - 4, 3, 3);
        ctx.fillRect(xx + w - 4, y + h - 4, 3, 3);
        ctx.fillStyle = rgba(INK, 0.3);
        ctx.fillRect(xx, y + h / 2, w, 1);
      }
      cshadow(ctx, x + 22, floor, 60, 0.35, 4);
    };
    const trolley = (x) => {
      cshadow(ctx, x + 24, floor, 60, 0.3, 4);
      bar(ctx, x, floor - 22, 48, 4, IRON);
      cyl(ctx, x + 2, floor - 50, 3, 30, IRON);
      bar(ctx, x - 2, floor - 52, 12, 3, IRON);
      for (const wx of [x + 8, x + 40]) {
        stamp(ctx, wx, floor - 4, 6, IRON, 1, 0.2);
        stamp(ctx, wx, floor - 4, 2, 0x8a8a90, 1, 0.3);
      }
      block(ctx, x + 6, floor - 40, 36, 18, 0x8a7a52, { r: 2 });
      ctx.fillStyle = rgba(INK, 0.3);
      ctx.fillRect(x + 6, floor - 31, 36, 1);
    };
    const palm = (x) => {
      cshadow(ctx, x, floor, 40, 0.3, 4);
      block(ctx, x - 12, floor - 20, 24, 20, BRASS, { r: 3 });
      bar(ctx, x - 14, floor - 22, 28, 3, lit(BRASS, 0.3));
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.32;
        const len = 30 + rand.between(0, 12);
        const col = i < 4 ? lit(0x4a7a3a, 0.3) : i > 5 ? dim(0x4a7a3a, 0.4) : 0x4a7a3a;
        ctx.strokeStyle = rgba(col, 0.95);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, floor - 22);
        ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.6, floor - 22 + Math.sin(a) * len * 0.9 - 8, x + Math.cos(a) * len, floor - 22 + Math.sin(a) * len + 10);
        ctx.stroke();
      }
    };
    const rack = (x) => {
      cshadow(ctx, x + 12, floor, 34, 0.3, 4);
      block(ctx, x, floor - 46, 26, 46, WOOD, { r: 2 });
      for (let i = 0; i < 3; i++) {
        block(ctx, x + 3, floor - 42 + i * 14, 20, 10, 0xe8e0d0, { r: 0.5, litK: 0.1, dimK: 0.2 });
        ctx.fillStyle = rgba(INK, 0.5);
        ctx.fillRect(x + 5, floor - 40 + i * 14, 12, 1);
        ctx.fillRect(x + 5, floor - 37 + i * 14, 16, 1);
      }
    };
    trunkStack(30);
    trolley(150);
    palm(270);
    rack(360);
    trunkStack(440);
    grain(ctx, 0, 0, W, H, 0.05, 37);
  }],

  shed_ribs: [190, (ctx, W, H, rand) => {
    // the train shed's ironwork: dark-green columns with flared heads,
    // lattice girders between them, rivets, rust where the rain gets in
    const col = 0x2e4a3a;
    for (let i = 0; i < 4; i++) {
      const x = i * 128 + 60;
      // the column's shadow on whatever is behind
      const sg = ctx.createLinearGradient(x + 12, 0, x + 30, 0);
      sg.addColorStop(0, rgba(SHADE, 0.2));
      sg.addColorStop(1, rgba(SHADE, 0));
      ctx.fillStyle = sg;
      ctx.fillRect(x + 12, 0, 18, H);
      cyl(ctx, x, 0, 12, H, col, { litK: 0.5, dimK: 0.55 });
      // the flared head, the base
      ctx.fillStyle = hex(col);
      ctx.beginPath();
      ctx.moveTo(x - 10, 0);
      ctx.lineTo(x + 22, 0);
      ctx.lineTo(x + 12, 22);
      ctx.lineTo(x, 22);
      ctx.closePath();
      ctx.fill();
      bar(ctx, x - 10, 0, 32, 5, col);
      block(ctx, x - 4, H - 14, 20, 14, col, { r: 1 });
      // rivets: a lit dot and a dark dot
      for (let y = 30; y < H - 20; y += 16) {
        ctx.fillStyle = rgba(SUN, 0.5);
        ctx.fillRect(x + 3, y, 1, 1);
        ctx.fillStyle = rgba(INK, 0.6);
        ctx.fillRect(x + 8, y + 1, 1, 1);
      }
      // rust bleeding down from the head
      const rg = ctx.createLinearGradient(0, 22, 0, 90);
      rg.addColorStop(0, rgba(0x8a4a2a, 0.35));
      rg.addColorStop(1, rgba(0x8a4a2a, 0));
      ctx.fillStyle = rg;
      ctx.fillRect(x + 6, 22, 5, 70);
    }
    // one lattice girder up high, a plain tie-rod lower down
    bar(ctx, 0, 104, W, 3, col);
    ctx.fillStyle = rgba(SUN, 0.3);
    ctx.fillRect(0, 104, W, 1);
    for (const gy of [24]) {
      bar(ctx, 0, gy, W, 4, col);
      bar(ctx, 0, gy + 14, W, 3, col);
      ctx.strokeStyle = rgba(col, 0.9);
      ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, gy + 4);
        ctx.lineTo(x + 8, gy + 14);
        ctx.lineTo(x + 16, gy + 4);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(SUN, 0.35);
      ctx.fillRect(0, gy, W, 1);
      ctx.fillStyle = rgba(INK, 0.4);
      ctx.fillRect(0, gy + 17, W, 2);
    }
    // steam has been at all of it
    for (let i = 0; i < 16; i++) stamp(ctx, rand.between(0, W), rand.between(0, 60), rand.between(20, 40), 0x2a2a30, 0.08, 0.9);
    grain(ctx, 0, 0, W, H, 0.05, 41);
  }],

  shed_lamps: [130, (ctx, W, H, rand) => {
    // a low canopy girder overhead, the lamps and signs hung from it
    const col = 0x2e4a3a;
    bar(ctx, 0, 0, W, 6, col);
    ctx.strokeStyle = rgba(col, 0.9);
    ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 6);
      ctx.lineTo(x + 8, 16);
      ctx.lineTo(x + 16, 6);
      ctx.stroke();
    }
    bar(ctx, 0, 16, W, 3, col);
    ctx.fillStyle = rgba(INK, 0.35);
    ctx.fillRect(0, 19, W, 2);
    for (let i = 0; i < 4; i++) {
      const x = i * 128 + 64 + rand.between(-10, 10);
      pendant(ctx, x, 19, rand.between(14, 30), { r: 15 });
    }
    // a couple of hanging enamel signs between them
    for (const x of [16, 300]) {
      ctx.fillStyle = rgba(IRON, 0.9);
      ctx.fillRect(x + 6, 19, 2, 14);
      ctx.fillRect(x + 50, 19, 2, 14);
      block(ctx, x, 33, 58, 16, 0x2e3a52, { r: 1 });
      bar(ctx, x + 1, 34, 56, 1, BRASS);
      letters(ctx, x < 100 ? 'WAY OUT' : 'TEA ROOM', x + 29, 42, 8, 0xf2e6cc, { spacing: 1 });
    }
    grain(ctx, 0, 0, W, H, 0.04, 43);
  }],
};

// The hook the parallax calls: paints `name` at `kind` into `key` if the
// station has its own painting for it. Returns true when it did.
export function paintHubLayer(scene, name, kind, key, W) {
  const p = LAYER_PAINTERS[name];
  if (!p) return false;
  const [H, painter, tile] = p;
  if (!tile) {
    paintTexture(scene, key, W, H, painter, name);
  } else {
    // A wall band is a TileSprite five screens tall hung from horizon +
    // one screen, and Phaser tiles it from its TOP edge, so the horizon
    // lands at tile-y (4 * 540) mod H. The painters draw in their own
    // coordinates; here the picture is laid down twice, shifted, so it
    // wraps onto that tiling, and washed and grained once, whole.
    paintTexture(scene, key, W, H, (ctx, w, h, rand) => {
      for (const dy of [tile.shift, tile.shift - H]) {
        ctx.save();
        ctx.translate(0, dy);
        painter(ctx, w, h, rand);
        ctx.restore();
      }
      if (tile.wash) wash(ctx, 0, 0, w, h, tile.wash[0], tile.wash[1], tile.wash[2], 5, 0.02);
      if (tile.grain) grain(ctx, 0, 0, w, h, tile.grain, 11);
    }, name);
  }
  void kind;
  return true;
}

// ---- landmarks ------------------------------------------------------------------------------
// Painted as one canvas each, anchored bottom-centre at the landmark's origin.
function clockFace(ctx, cx, cy, r, o = {}) {
  const { h = 6.7, m = 40 } = o;
  // bezel: brass, lit on the west
  const bg = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.2, cx, cy, r);
  bg.addColorStop(0, hex(lit(BRASS, 0.5)));
  bg.addColorStop(0.7, hex(BRASS));
  bg.addColorStop(1, hex(dim(BRASS, 0.5)));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // face: cream, deeper at the rim
  const fg = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r * 0.9);
  fg.addColorStop(0, hex(0xf8f0dc));
  fg.addColorStop(0.8, hex(0xece0c4));
  fg.addColorStop(1, hex(0xd8caa8));
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(INK, 0.35);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rgba(INK, 0.35);
  ctx.stroke();
  // hour marks
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const long = i % 3 === 0;
    ctx.strokeStyle = rgba(0x2a2230, long ? 0.9 : 0.6);
    ctx.lineWidth = long ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(a) * r * 0.8, cy - Math.cos(a) * r * 0.8);
    ctx.lineTo(cx + Math.sin(a) * r * (long ? 0.68 : 0.74), cy - Math.cos(a) * r * (long ? 0.68 : 0.74));
    ctx.stroke();
  }
  const hand = (ang, len, w) => {
    ctx.strokeStyle = hex(0x2a2230);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - Math.sin(ang) * r * 0.1, cy + Math.cos(ang) * r * 0.1);
    ctx.lineTo(cx + Math.sin(ang) * len, cy - Math.cos(ang) * len);
    ctx.stroke();
  };
  if (o.hands !== false) {
    hand((h / 12) * Math.PI * 2, r * 0.48, Math.max(2, r * 0.06));
    hand((m / 60) * Math.PI * 2, r * 0.7, Math.max(1.5, r * 0.04));
  }
  stamp(ctx, cx, cy, r * 0.07, 0x2a2230, 1, 0.2);
  // the glass: a pale arc top-left
  ctx.strokeStyle = rgba(0xffffff, 0.35);
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, Math.PI * 1.1, Math.PI * 1.55);
  ctx.stroke();
}

function shedRoof(ctx, W, top, ribsY0, ribsY1, label) {
  const col = 0x3e4a44;
  // the main beam and its lattice, nine ribs down from it
  bar(ctx, 20, top, W - 40, 10, col);
  ctx.fillStyle = rgba(SUN, 0.3);
  ctx.fillRect(20, top, W - 40, 1);
  for (let i = 0; i < 9; i++) {
    const x = W / 2 + (i - 4) * 50;
    cyl(ctx, x - 3, ribsY0, 6, ribsY1 - ribsY0, col, { litK: 0.45, dimK: 0.5 });
    ctx.fillStyle = rgba(SUN, 0.4);
    for (let y = ribsY0 + 8; y < ribsY1; y += 12) ctx.fillRect(x - 2, y, 1, 1);
  }
  ctx.strokeStyle = rgba(col, 0.85);
  ctx.lineWidth = 2;
  for (let x = 24; x < W - 24; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, top + 10);
    ctx.lineTo(x + 10, top + 22);
    ctx.lineTo(x + 20, top + 10);
    ctx.stroke();
  }
  bar(ctx, 20, top + 22, W - 40, 3, col);
  // a lower tie
  bar(ctx, 20, ribsY1, W - 40, 4, col);
  ctx.fillStyle = rgba(INK, 0.35);
  ctx.fillRect(20, ribsY1 + 4, W - 40, 2);
  if (label) {
    // a hanging enamel board with the platform numbers
    const bw = 250;
    const bx = W / 2 - bw / 2;
    const by = ribsY1 + 14;
    ctx.fillStyle = rgba(IRON, 0.9);
    ctx.fillRect(bx + 20, ribsY1 + 4, 2, 10);
    ctx.fillRect(bx + bw - 22, ribsY1 + 4, 2, 10);
    dab(ctx, W / 2 + 6, by + 32, bw * 0.5, 4, 0, INK, 0.25, 0.8);
    block(ctx, bx, by, bw, 30, 0x2e3a52, { r: 2 });
    ctx.strokeStyle = rgba(BRASS, 0.9);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + 3.5, by + 3.5, bw - 7, 23);
    letters(ctx, label, W / 2, by + 15, 14, 0xf2e6cc, { spacing: 3 });
  }
}

const LANDMARK_PAINTERS = {
  great_clock: [520, 270, (ctx, W, H) => {
    // seven brass columns behind the concourse, the great clock hung between
    for (let i = -3; i <= 3; i++) {
      const x = W / 2 + i * 70;
      cyl(ctx, x - 5, H - 180, 10, 168, BRASS, { alpha: 0.42 });
      bar(ctx, x - 9, H - 184, 18, 6, BRASS, { alpha: 0.42 });
      bar(ctx, x - 8, H - 18, 16, 6, BRASS, { alpha: 0.42 });
    }
    // the bracket
    bar(ctx, W / 2 - 40, H - 214, 80, 5, IRON);
    ctx.fillStyle = rgba(IRON, 0.9);
    ctx.fillRect(W / 2 - 1, H - 220, 2, 14);
    dab(ctx, W / 2 + 8, H - 158, 40, 14, 0, INK, 0.22, 0.85);
    clockFace(ctx, W / 2, H - 168, 46, { h: 6.7, m: 40 });
  }],
  train_shed: [460, 340, (ctx, W, H) => shedRoof(ctx, W, H - 320, H - 310, H - 220, 'PLATFORMS  1 — 4')],
  shed_clock: [460, 340, (ctx, W, H) => {
    shedRoof(ctx, W, H - 320, H - 310, H - 220, 'PLATFORMS  5 — 8');
    ctx.fillStyle = rgba(IRON, 0.9);
    ctx.fillRect(W / 2 - 1, H - 310, 2, 30);
    clockFace(ctx, W / 2, H - 258, 22, { h: 6.7, m: 40 });
  }],
  station_sign: [420, 130, (ctx, W, H, rand) => {
    // the enamel board over the doors, a row of bulbs along its top
    const bx = 20;
    const by = H - 96;
    dab(ctx, W / 2 + 10, by + 60, 190, 8, 0, INK, 0.3, 0.85);
    block(ctx, bx, by, W - 40, 52, 0x2e3a52, { r: 3 });
    ctx.strokeStyle = rgba(BRASS, 0.95);
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 4, by + 4, W - 48, 44);
    ctx.strokeStyle = rgba(BRASS, 0.4);
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 8.5, by + 8.5, W - 57, 35);
    letters(ctx, 'CROSSROADS  STATION', W / 2, by + 27, 20, 0xf2e6cc, { spacing: 3, shadow: 0.6 });
    for (let i = -8; i <= 8; i++) {
      const x = W / 2 + i * 22;
      const flicker = rand.frac() < 0.12 ? 0.35 : 1;
      glow(ctx, x, by - 6, 14, LAMP, 0.22 * flicker);
      stamp(ctx, x, by - 6, 3.5, mix(LAMP, 0xffffff, 0.4 * flicker), 0.95 * flicker, 0.4);
      ctx.fillStyle = rgba(IRON, 0.9);
      ctx.fillRect(x - 1, by - 3, 2, 4);
    }
  }],
  no_passengers: [170, 240, (ctx, W, H, rand) => {
    // a doorway into the dark, a chalk tally on the wall beside it
    const x = 15;
    const y = H - 230;
    const w = 140;
    const h = 220;
    ctx.fillStyle = hex(0x141c16);
    ctx.fillRect(x, y, w, h);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, rgba(0x2a3a30, 0.6));
    g.addColorStop(0.5, rgba(0x0a0e0c, 0.4));
    g.addColorStop(1, rgba(0x1e2a22, 0.7));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    gradientV(ctx, x, y, w, 60, [[0, 0x000000, 0.5], [1, 0x000000, 0]]);
    // a cold light from somewhere down the corridor, on the floor
    stamp(ctx, x + w * 0.5, y + h - 10, 60, 0x88b8d8, 0.12, 0.9);
    // the surround: pale stone, lit on the west jamb; a caged bulb over it
    cyl(ctx, x - 8, y - 6, 10, h + 6, 0xa89878);
    cyl(ctx, x + w - 2, y - 6, 10, h + 6, 0xa89878, { litK: 0.15 });
    bar(ctx, x - 8, y - 10, w + 18, 10, 0xb0a080);
    glow(ctx, x + w / 2, y - 2, 60, 0xf2e6cc, 0.3);
    stamp(ctx, x + w / 2, y - 3, 4, 0xfff6dc, 0.95, 0.4);
    ctx.fillStyle = rgba(IRON, 0.9);
    ctx.fillRect(x + w / 2 - 5, y - 8, 10, 1);
    ctx.fillRect(x + w / 2 - 5, y - 8, 1, 6);
    ctx.fillRect(x + w / 2 + 4, y - 8, 1, 6);
    // the light falling in through the door, on the near floor
    gradientV(ctx, x, y + h - 40, w, 40, [[0, 0xf2e6cc, 0], [1, 0xf2e6cc, 0.12]]);
    // the tally: four rows of ten, chalked, a fifth stroke across each five
    ctx.strokeStyle = rgba(0xe8dcc0, 0.8);
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const tx = x + 22 + (i % 10) * 10 + rand.realInRange(-1, 1);
      const ty = y + 40 + Math.floor(i / 10) * 30;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + rand.realInRange(-1, 1), ty + 12);
      ctx.stroke();
      if (i % 5 === 4) {
        ctx.beginPath();
        ctx.moveTo(tx - 42, ty + 12);
        ctx.lineTo(tx + 2, ty + 1);
        ctx.stroke();
      }
    }
  }],
};

export function paintHubLandmark(scene, name) {
  const p = LANDMARK_PAINTERS[name];
  if (!p) return null;
  const [W, H, painter] = p;
  const key = `hub-lm-${name}`;
  // painted once: the outgoing landmark is still fading on the old texture
  if (scene.textures.exists(key)) return key;
  paintTexture(scene, key, W, H, (ctx, w, h, rand) => {
    painter(ctx, w, h, rand);
    grain(ctx, 0, 0, w, h, 0.04, 53);
  }, key);
  return key;
}

// ---- the props ------------------------------------------------------------------------------
// Same keys and the same sizes as the old grids, so the scene's placements
// hold. Every painter gets (ctx, w, h, rand); the floor is the bottom edge.
const lampHead = (ctx, x, y, on) => {
  // a square lantern: iron frame, four warm panes
  if (on) glow(ctx, x, y + 6, 22, LAMP, 0.35);
  block(ctx, x - 6, y - 6, 12, 12, IRON, { r: 1 });
  ctx.fillStyle = hex(on ? LAMP : 0x4a4a52);
  ctx.fillRect(x - 5, y - 5, 10, 10);
  if (on) {
    stamp(ctx, x - 1, y - 1, 5, 0xfff6dc, 0.9, 0.5);
  } else {
    ctx.fillStyle = rgba(0x6a6a72, 0.6);
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
  ctx.fillStyle = rgba(IRON, 0.9);
  ctx.fillRect(x - 1, y - 5, 1, 10);
  ctx.fillRect(x - 5, y - 1, 10, 1);
  ctx.fillStyle = rgba(SUN, 0.5);
  ctx.fillRect(x - 6, y - 6, 1, 12);
  // a finial
  ctx.fillStyle = hex(IRON);
  ctx.fillRect(x - 2, y - 9, 4, 3);
};

const suitcase = (ctx, x, y, w, h, base, tag) => {
  cshadow(ctx, x + w / 2, y + h, w * 1.3, 0.3, 2);
  block(ctx, x, y, w, h, base, { r: 2 });
  ctx.fillStyle = rgba(lit(base, 0.5), 0.6);
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
  ctx.fillStyle = rgba(INK, 0.3);
  ctx.fillRect(x, y + h * 0.4, w, 1);
  ctx.fillStyle = rgba(BRASS, 0.9);
  ctx.fillRect(x + 3, y + h * 0.4 - 1, 2, 3);
  ctx.fillRect(x + w - 5, y + h * 0.4 - 1, 2, 3);
  // the handle
  ctx.fillStyle = hex(dim(base, 0.5));
  ctx.fillRect(x + w / 2 - 3, y - 3, 6, 3);
  ctx.fillStyle = rgba(SUN, 0.4);
  ctx.fillRect(x + w / 2 - 3, y - 3, 1, 3);
  if (tag) {
    ctx.fillStyle = hex(0xf2e6cc);
    ctx.fillRect(x + w - 5, y + h - 6, 4, 4);
    ctx.fillStyle = rgba(0xc03a2a, 0.9);
    ctx.fillRect(x + w - 4, y + h - 5, 2, 1);
  }
};

const booth = (ctx, x, y, w, h, o = {}) => {
  // a wooden booth: a green sign over it, a lit window, panelled front
  const { sign = true, wide = 1 } = o;
  cshadow(ctx, x + w / 2, y + h, w * 1.3, 0.32, 3);
  block(ctx, x, y + 10, w, h - 10, WOOD, { r: 1.5 });
  pane(ctx, x + 3, y + 14, w - 6, (h - 14) * 0.45, { warm: 0.7, bars: wide });
  glow(ctx, x + w / 2, y + 14 + (h - 14) * 0.25, w * 0.5, 0xf2c078, 0.25);
  ctx.fillStyle = rgba(INK, 0.3);
  ctx.fillRect(x + 3, y + 14 + (h - 14) * 0.55, w - 6, (h - 14) * 0.4);
  ctx.fillStyle = rgba(SUN, 0.15);
  ctx.fillRect(x + 3, y + 14 + (h - 14) * 0.55, 1, (h - 14) * 0.4);
  bar(ctx, x + 1, y + 14 + (h - 14) * 0.47, w - 2, 2, BRASS);
  if (sign) {
    block(ctx, x + 2, y, w - 4, 10, GREEN, { r: 2 });
    ctx.fillStyle = rgba(0x50c878, 0.9);
    ctx.fillRect(x + 5, y + 4, w - 10, 2);
  }
};

export const HUB_PROPS = {
  'hub-train': [128, 36, (ctx) => train(ctx, 128, 36, { body: 0x7a3a3a, trim: 0x9a4a44, window: 0xf2e6cc, emblem: null })],
  'hub-bench': [48, 20, (ctx, w, h) => {
    cshadow(ctx, w / 2, h, w * 1.2, 0.32, 3);
    for (const lx of [5, w - 9]) cyl(ctx, lx, 8, 4, 12, IRON);
    bar(ctx, 0, 0, w, 4, WOOD);
    bar(ctx, 0, 6, w, 5, WOOD);
    ctx.fillStyle = rgba(SUN, 0.35);
    ctx.fillRect(0, 0, w, 1);
    ctx.fillRect(0, 6, w, 1);
    ctx.fillStyle = rgba(INK, 0.35);
    ctx.fillRect(0, 10, w, 1);
    // the grain of the slats
    ctx.fillStyle = rgba(INK, 0.15);
    for (let x = 4; x < w; x += 9) ctx.fillRect(x, 7, 1, 3);
    bar(ctx, 3, 12, w - 6, 2, IRON);
  }],
  'hub-lamp': [24, 33, (ctx, w, h) => {
    cshadow(ctx, w / 2, h, 24, 0.3, 2);
    cyl(ctx, w / 2 - 2, 12, 4, 20, 0x2e2e38);
    block(ctx, w / 2 - 5, h - 3, 10, 3, 0x2e2e38, { r: 1 });
    lampHead(ctx, w / 2, 8, true);
  }],
  'hub-lamp-off': [24, 33, (ctx, w, h) => {
    cshadow(ctx, w / 2, h, 24, 0.3, 2);
    cyl(ctx, w / 2 - 2, 12, 4, 20, 0x2e2e38);
    block(ctx, w / 2 - 5, h - 3, 10, 3, 0x2e2e38, { r: 1 });
    lampHead(ctx, w / 2, 8, false);
  }],
  'hub-post': [24, 27, (ctx, w, h) => {
    // a pillar postbox in the station's dark blue-grey, a brass mouth
    cshadow(ctx, w / 2, h, 26, 0.3, 2);
    cyl(ctx, w / 2 - 2, 12, 4, 15, IRON);
    block(ctx, 0, 0, w, 12, 0x2e3440, { r: 3 });
    ctx.fillStyle = hex(0x1a1e26);
    ctx.fillRect(3, 4, w - 6, 3);
    ctx.fillStyle = rgba(BRASS, 0.9);
    ctx.fillRect(3, 3, w - 6, 1);
  }],
  'hub-desk': [56, 28, (ctx, w, h) => {
    // the information desk: a brass-fronted counter with a dark top
    cshadow(ctx, w / 2, h, w * 1.2, 0.3, 3);
    block(ctx, 0, 4, w, h - 4, BRASS, { r: 2, litK: 0.35, dimK: 0.45 });
    // panels
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = rgba(INK, 0.22);
      ctx.fillRect(3 + i * 13, 12, 10, 12);
      ctx.fillStyle = rgba(SUN, 0.3);
      ctx.fillRect(3 + i * 13, 12, 1, 12);
    }
    bar(ctx, 0, 4, w, 4, 0x2a2230);
    ctx.fillStyle = rgba(SUN, 0.25);
    ctx.fillRect(0, 4, w, 1);
    // a brass bell and a card on the counter
    stamp(ctx, 10, 4, 3, lit(BRASS, 0.4), 1, 0.4);
    ctx.fillStyle = hex(0xf2e6cc);
    ctx.fillRect(38, 2, 10, 4);
  }],
  'hub-booth': [32, 36, (ctx, w, h) => booth(ctx, 0, 0, w, h, { wide: 2 })],
  'hub-phone': [24, 32, (ctx, w, h) => {
    // a red telephone box with a lit blue window
    cshadow(ctx, w / 2, h, w * 1.3, 0.3, 2);
    block(ctx, 0, 0, w, h, 0x8a2c2c, { r: 2 });
    pane(ctx, 4, 4, w - 8, 14, { warm: 0.2, base: 0x5a7a8a, bars: 2 });
    ctx.fillStyle = rgba(INK, 0.3);
    ctx.fillRect(4, 20, w - 8, 10);
    ctx.fillStyle = rgba(0xf2e6cc, 0.8);
    ctx.fillRect(6, 1, w - 12, 2);
  }],
  'hub-fountain': [40, 32, (ctx, w, h) => {
    cshadow(ctx, w / 2, h, w * 1.2, 0.3, 3);
    // the basin: stone, water in it, a jet
    block(ctx, 4, h - 8, w - 8, 8, 0xc8bb9c, { r: 2 });
    block(ctx, 0, 12, w, 10, 0xd8cbb0, { r: 3 });
    const wg = ctx.createLinearGradient(0, 14, 0, 20);
    wg.addColorStop(0, hex(0xa8d0e8));
    wg.addColorStop(1, hex(0x6a9ab8));
    ctx.fillStyle = wg;
    ctx.fillRect(3, 14, w - 6, 6);
    ctx.fillStyle = rgba(0xffffff, 0.5);
    ctx.fillRect(6, 14, 8, 1);
    // the jet and its spray
    ctx.fillStyle = rgba(0xd8ecf8, 0.9);
    ctx.fillRect(w / 2 - 1, 2, 2, 12);
    stamp(ctx, w / 2, 3, 5, 0xf0fff8, 0.7, 0.5);
    stamp(ctx, w / 2 - 6, 8, 4, 0xd8ecf8, 0.4, 0.6);
    stamp(ctx, w / 2 + 6, 8, 4, 0xd8ecf8, 0.4, 0.6);
  }],
  'hub-fountain-dry': [40, 32, (ctx, w, h) => {
    cshadow(ctx, w / 2, h, w * 1.2, 0.3, 3);
    block(ctx, 4, h - 8, w - 8, 8, 0xa89a7e, { r: 2 });
    block(ctx, 0, 12, w, 10, 0xb8a98c, { r: 3 });
    ctx.fillStyle = hex(0x7a7468);
    ctx.fillRect(3, 14, w - 6, 6);
    ctx.fillStyle = rgba(INK, 0.3);
    ctx.fillRect(3, 14, w - 6, 1);
    // dead leaves in the bowl
    ctx.fillStyle = rgba(0x8a6a3a, 0.8);
    ctx.fillRect(8, 17, 3, 2);
    ctx.fillRect(24, 16, 3, 2);
  }],
  'hub-cart': [40, 16, (ctx, w, h) => {
    cshadow(ctx, w / 2, h, w * 1.1, 0.3, 2);
    for (const wx of [8, w - 8]) {
      stamp(ctx, wx, h - 3, 3.5, IRON, 1, 0.2);
      stamp(ctx, wx - 0.5, h - 3.5, 1.2, 0x8a8a90, 1, 0.3);
    }
    block(ctx, 0, 0, w, 10, 0x6a5a3a, { r: 1.5 });
    ctx.fillStyle = rgba(INK, 0.3);
    ctx.fillRect(2, 3, w - 4, 5);
    // a case on it
    block(ctx, 6, -0, 14, 6, 0x8a7a52, { r: 1 });
  }],
  'hub-flowers': [36, 21, (ctx, w, h, rand) => {
    cshadow(ctx, w / 2, h, w * 1.1, 0.3, 2);
    for (const wx of [6, w - 6]) stamp(ctx, wx, h - 3, 3, IRON, 1, 0.2);
    block(ctx, 0, 9, w, 8, 0x6a5a3a, { r: 1.5 });
    ctx.fillStyle = rgba(INK, 0.3);
    ctx.fillRect(2, 11, w - 4, 4);
    // buckets of flowers: leaves, then blooms, the sunward ones brighter
    const cols = [0xe86a6a, 0xf2d580, 0xc88ad8, 0xe86a6a, 0xf2d580, 0xc88ad8];
    for (let i = 0; i < 6; i++) {
      const x = 4 + i * 5.4;
      ctx.fillStyle = rgba(0x4a7a3a, 0.9);
      ctx.fillRect(x, 5, 3, 5);
      const c = cols[i];
      stamp(ctx, x + 1.5 + rand.realInRange(-1, 1), 3 + rand.realInRange(-1, 1), 3, dim(c, 0.3), 0.9, 0.3);
      stamp(ctx, x + 0.5, 2, 2, lit(c, 0.3), 0.9, 0.3);
    }
  }],
  'hub-kiosk': [48, 32, (ctx, w, h) => {
    booth(ctx, 0, 0, w, h, { wide: 3 });
    // papers on the front
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = hex(0xe8e0d0);
      ctx.fillRect(5 + i * 14, 24, 10, 6);
      ctx.fillStyle = rgba(INK, 0.5);
      ctx.fillRect(6 + i * 14, 25, 6, 1);
      ctx.fillRect(6 + i * 14, 27, 8, 1);
    }
  }],
  'hub-shoeshine': [40, 28, (ctx, w, h) => {
    // Ro's chair: a raised red seat on a wooden box, brass footrests
    cshadow(ctx, w / 2, h, w * 1.2, 0.3, 3);
    for (const lx of [4, w - 8]) cyl(ctx, lx, 18, 4, 10, WOOD);
    block(ctx, 0, 8, w, 10, WOOD, { r: 1.5 });
    block(ctx, 8, 0, 24, 4, 0x8a3a3a, { r: 1 });
    cyl(ctx, 8, 3, 3, 6, 0x8a3a3a);
    cyl(ctx, 29, 3, 3, 6, 0x8a3a3a);
    block(ctx, 6, 8, 28, 4, 0x8a3a3a, { r: 1 });
    ctx.fillStyle = rgba(BRASS, 0.9);
    ctx.fillRect(12, 16, 6, 2);
    ctx.fillRect(22, 16, 6, 2);
    // tins and a brush on the box
    ctx.fillStyle = hex(0x2a2230);
    ctx.fillRect(2, 5, 4, 3);
    ctx.fillStyle = hex(BRASS);
    ctx.fillRect(34, 5, 4, 3);
  }],
  'hub-door': [48, 40, (ctx, w, h) => {
    // a brass revolving door: two glass leaves, a drum, its shine
    cshadow(ctx, w / 2, h, w * 1.1, 0.3, 3);
    block(ctx, 0, 0, w, h, BRASS, { r: 3, litK: 0.4, dimK: 0.5 });
    for (const lx of [4, 26]) {
      pane(ctx, lx, 4, 18, h - 8, { warm: 0.3, base: 0x5a8aa0, bars: 2 });
      glow(ctx, lx + 9, h / 2, 12, 0xf2c078, 0.15);
    }
    cyl(ctx, 22, 2, 4, h - 4, BRASS);
    ctx.fillStyle = rgba(SUN, 0.5);
    ctx.fillRect(1, 1, 2, h - 2);
  }],
  'hub-chain': [39, 6, (ctx, w) => {
    for (let x = 1; x < w; x += 6) {
      ctx.strokeStyle = hex(0x8a8a90);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x + 3, 3, 3, 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = rgba(SUN, 0.5);
      ctx.fillRect(x + 1, 1, 1, 1);
    }
  }],
  'hub-cafe': [64, 24, (ctx, w, h) => {
    // Bilal's mezzanine café: a striped awning over a small counter
    cshadow(ctx, w / 2 + 6, h, 40, 0.3, 2);
    for (let x = 0; x < w; x += 8) {
      const g = ctx.createLinearGradient(0, 0, 0, 8);
      const c = (x / 8) % 2 ? 0xf2e6cc : 0xc03a2a;
      g.addColorStop(0, hex(lit(c, 0.2)));
      g.addColorStop(1, hex(dim(c, 0.3)));
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 8, 8);
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x + 8, 8);
      ctx.lineTo(x + 4, 11);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = rgba(INK, 0.25);
    ctx.fillRect(0, 7, w, 1);
    block(ctx, 16, 12, 32, 10, WOOD, { r: 1.5 });
    bar(ctx, 14, 12, 36, 2, BRASS);
    // a samovar and cups
    block(ctx, 22, 6, 6, 6, BRASS, { r: 2 });
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = hex(0xf2e6cc);
      ctx.fillRect(32 + i * 5, 9, 3, 3);
    }
    for (const lx of [18, 42]) cyl(ctx, lx, 22, 3, 2, WOOD);
  }],
  'hub-dumbwaiter': [24, 24, (ctx, w, h) => {
    block(ctx, 0, 0, w, h - 4, WOOD, { r: 1.5 });
    ctx.fillStyle = hex(0x2a2230);
    ctx.fillRect(4, 4, w - 8, h - 12);
    glow(ctx, w / 2, h / 2 - 2, 8, 0xf2c078, 0.15);
    ctx.fillStyle = rgba(0x8a8a90, 0.9);
    ctx.fillRect(w / 2 - 1, h - 4, 2, 4);
    ctx.fillStyle = rgba(SUN, 0.3);
    ctx.fillRect(4, 4, 1, h - 12);
  }],
  'hub-cage': [40, 24, (ctx, w, h) => {
    cshadow(ctx, w / 2, h, w * 1.1, 0.3, 2);
    ctx.fillStyle = rgba(0x1a1a20, 0.6);
    ctx.fillRect(2, 2, w - 4, h - 4);
    block(ctx, 0, 0, w, 3, 0x4a4a52, { r: 1 });
    block(ctx, 0, h - 3, w, 3, 0x4a4a52, { r: 1 });
    for (let x = 0; x < w; x += 8) cyl(ctx, x, 0, 3, h, 0x4a4a52);
    ctx.fillStyle = rgba(0x6a6a72, 0.6);
    for (let y = 3; y < h - 3; y += 6) ctx.fillRect(0, y, w, 1);
  }],
  'hub-suitcase': [18, 15, (ctx, w, h) => suitcase(ctx, 0, 3, w, h - 3, 0x6a5a3a, false)],
  'hub-suitcase-tag': [18, 15, (ctx, w, h) => suitcase(ctx, 0, 3, w, h - 3, 0x6a5a3a, true)],
  'hub-lever': [24, 20, (ctx, w, h) => {
    block(ctx, 0, h - 8, w, 8, IRON, { r: 1.5 });
    ctx.fillStyle = rgba(SUN, 0.3);
    ctx.fillRect(0, h - 8, w, 1);
    cyl(ctx, w / 2 - 1, 2, 3, h - 8, 0x8a8a90);
    stamp(ctx, w / 2 + 0.5, 3, 3, 0xc03a2a, 1, 0.3);
    stamp(ctx, w / 2 - 0.5, 2, 1.2, 0xf2a0a0, 0.9, 0.3);
  }],
  'hub-turnstile': [24, 28, (ctx, w, h) => {
    cshadow(ctx, w / 2, h, w, 0.3, 2);
    cyl(ctx, w / 2 - 2, 4, 4, h - 4, 0x6a6a72);
    for (const y of [4, 14]) {
      bar(ctx, 0, y, w, 3, 0x7a7a82);
      ctx.fillStyle = rgba(INK, 0.3);
      ctx.fillRect(0, y + 3, w, 1);
    }
    stamp(ctx, w / 2, 3, 3, 0x8a8a90, 1, 0.3);
  }],
  'hub-counter': [30, 12, (ctx, w, h) => {
    block(ctx, 0, 0, w, h, 0x2a2a30, { r: 2 });
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = hex(0xf2e6cc);
      ctx.fillRect(3 + i * 9, 3, 7, 6);
      ctx.fillStyle = rgba(INK, 0.35);
      ctx.fillRect(3 + i * 9, 3, 7, 1);
    }
    ctx.fillStyle = rgba(BRASS, 0.7);
    ctx.fillRect(1, 1, w - 2, 1);
  }],
  'hub-loft': [40, 24, (ctx, w, h) => {
    // a pigeon loft on the roof: a little gabled hutch with rows of holes
    cshadow(ctx, w / 2, h, w * 1.1, 0.3, 2);
    for (const lx of [4, w - 8]) cyl(ctx, lx, h - 6, 4, 6, WOOD);
    block(ctx, 0, 6, w, 12, WOOD, { r: 1 });
    ctx.fillStyle = hex(dim(WOOD, 0.6));
    ctx.beginPath();
    ctx.moveTo(-1, 7);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w + 1, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(SUN, 0.35);
    ctx.fillRect(0, 6, w / 2, 1);
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = hex(0x1e1a18);
        ctx.fillRect(4 + i * 9, 8 + r * 5, 4, 3);
      }
  }],
  'hub-watertower': [40, 36, (ctx, w, h) => {
    cshadow(ctx, w / 2, h, w * 1.1, 0.3, 2);
    for (const lx of [3, 17, 33]) cyl(ctx, lx, 22, 4, 14, IRON);
    bar(ctx, 2, 26, w - 4, 2, IRON);
    // the tank: a riveted drum with a conical lid
    cyl(ctx, 0, 6, w, 18, 0x6a5a4a, { litK: 0.4, dimK: 0.45 });
    ctx.fillStyle = rgba(INK, 0.3);
    for (const y of [10, 16, 22]) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = hex(dim(0x6a5a4a, 0.4));
    ctx.beginPath();
    ctx.moveTo(-1, 6);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w + 1, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(SUN, 0.4);
    ctx.fillRect(0, 6, w / 2, 1);
  }],
  'hub-kite': [27, 27, (ctx, w) => {
    const c = w / 2;
    const g = ctx.createLinearGradient(c - 10, 0, c + 10, 0);
    g.addColorStop(0, hex(lit(0xe86a6a, 0.35)));
    g.addColorStop(0.5, hex(0xe86a6a));
    g.addColorStop(1, hex(dim(0xe86a6a, 0.35)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(c, 0);
    ctx.lineTo(c + 11, 9);
    ctx.lineTo(c, 20);
    ctx.lineTo(c - 11, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(INK, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c, 0);
    ctx.lineTo(c, 20);
    ctx.moveTo(c - 11, 9);
    ctx.lineTo(c + 11, 9);
    ctx.stroke();
    ctx.fillStyle = hex(0xf2d580);
    ctx.fillRect(c - 1, 21, 2, 2);
    ctx.fillRect(c - 3, 24, 2, 2);
    ctx.fillRect(c + 1, 24, 2, 2);
  }],
  'hub-pigeon': [10, 10, (ctx) => {
    dab(ctx, 5.5, 5.5, 3.8, 2.6, 0, 0x8a8a98, 1, 0.15);
    stamp(ctx, 7, 3, 2.2, 0x9a9aa8, 1, 0.2);
    ctx.fillStyle = hex(0x6a6a78);
    ctx.fillRect(2, 5, 3, 2);
    ctx.fillStyle = hex(0xd8a840);
    ctx.fillRect(9, 3, 1, 1);
    ctx.fillRect(4, 8, 1, 2);
    ctx.fillRect(6, 8, 1, 2);
    ctx.fillStyle = rgba(SUN, 0.5);
    ctx.fillRect(6, 2, 1, 1);
  }],
  // the tower clock: the scene draws the real time's hands over it
  'hub-clock': [40, 32, (ctx, w, h) => clockFace(ctx, w / 2, h / 2, 15, { hands: false })],
  'hub-hatch': [32, 16, (ctx, w, h) => {
    block(ctx, 0, 0, w, h, IRON, { r: 1 });
    ctx.fillStyle = rgba(0x0a0a12, 0.85);
    ctx.fillRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = rgba(0x6a6a72, 0.6);
    for (let x = 6; x < w - 4; x += 5) ctx.fillRect(x, 3, 1, h - 6);
  }],
  'hub-teapot': [18, 15, (ctx, w, h) => {
    cshadow(ctx, w / 2, h, 20, 0.25, 2);
    const g = ctx.createRadialGradient(6, 7, 1, 9, 9, 8);
    g.addColorStop(0, hex(lit(BRASS, 0.6)));
    g.addColorStop(0.6, hex(BRASS));
    g.addColorStop(1, hex(dim(BRASS, 0.5)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(9, 9, 7, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(BRASS);
    ctx.fillRect(7, 3, 4, 2);
    ctx.strokeStyle = hex(dim(BRASS, 0.3));
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(15, 8);
    ctx.lineTo(18, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(2, 8, 2.5, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
  }],
};

// the train body: a livery, four windows, a door with the line's emblem
function train(ctx, w, h, livery, emblemRows) {
  const body = livery.body;
  const trim = livery.trim;
  const win = livery.window;
  const dead = !!livery.dead;
  const floor = h - 4;
  cshadow(ctx, w / 2 + 6, h - 1, w * 1.1, 0.45, 3);
  // bogies and wheels
  bar(ctx, 6, floor - 2, w - 12, 3, 0x2a2a30);
  for (const wx of [12, 26, 90, 104]) {
    stamp(ctx, wx, floor, 4, 0x1e1e26, 1, 0.15);
    stamp(ctx, wx - 0.5, floor - 0.5, 1.5, 0x6a6a72, 1, 0.3);
  }
  // the body: rounded ends, a curved roof, lit from the west
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, hex(lit(body, 0.3)));
  g.addColorStop(0.3, hex(body));
  g.addColorStop(1, hex(dim(body, 0.35)));
  ctx.fillStyle = g;
  rr(ctx, 2, 6, w - 4, floor - 8, 5);
  ctx.fill();
  // the roof: a paler curve, its highlight
  const rg = ctx.createLinearGradient(0, 2, 0, 10);
  rg.addColorStop(0, hex(lit(body, 0.45)));
  rg.addColorStop(1, hex(body));
  ctx.fillStyle = rg;
  rr(ctx, 6, 2, w - 12, 8, 4);
  ctx.fill();
  ctx.fillStyle = rgba(SUN, 0.45);
  ctx.fillRect(10, 2, w - 20, 1);
  // trim lines
  bar(ctx, 4, 8, w - 8, 2, trim);
  bar(ctx, 4, floor - 8, w - 8, 2, trim);
  // windows, warm inside
  for (const wx of [10, 34, 82, 106]) {
    pane(ctx, wx, 12, 14, 9, { warm: dead ? 0 : 0.6, base: dead ? 0x1e1e26 : 0x3a3a48 });
    if (!dead) glow(ctx, wx + 7, 17, 10, 0xf2c078, 0.2);
  }
  // the door in the middle with the emblem
  ctx.fillStyle = hex(dim(body, 0.5));
  ctx.fillRect(56, 11, 16, floor - 14);
  ctx.fillStyle = rgba(SUN, 0.3);
  ctx.fillRect(56, 11, 1, floor - 14);
  ctx.fillStyle = rgba(INK, 0.4);
  ctx.fillRect(71, 11, 1, floor - 14);
  if (emblemRows) {
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const ch = emblemRows[y][x];
        if (ch === '.') continue;
        ctx.fillStyle = hex(ch === 'E' ? win : trim);
        ctx.fillRect(58 + x * 3, 14 + y * 3, 3, 3);
      }
  }
  // a lamp at each end
  if (!dead) {
    stamp(ctx, 4, 16, 2.5, 0xfff6dc, 0.95, 0.4);
    stamp(ctx, w - 4, 16, 2.5, 0xffb0a0, 0.8, 0.4);
  }
  // steam has greyed the lower body
  gradientV(ctx, 2, floor - 12, w - 4, 8, [[0, 0x2a2a30, 0], [1, 0x2a2a30, 0.25]]);
}

export function paintTrainTexture(scene, key, livery, emblemRows) {
  return paintTexture(scene, key, 128, 32, (ctx, w, h) => {
    train(ctx, w, h, livery, emblemRows);
    grain(ctx, 0, 0, w, h, 0.04, 61);
  }, key);
}

// ---- things the scene asks for by size ---------------------------------------------------
// hubTex(scene, kind, w, h, opts) paints a keyed texture on demand: columns,
// rails, signboards, the plinth, the gate. Memoised by its key.
const ON_DEMAND = {
  glow: (ctx, w, h) => {
    const r = Math.min(w, h) / 2;
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
    g.addColorStop(0, rgba(0xffffff, 1));
    g.addColorStop(0.25, rgba(0xffffff, 0.55));
    g.addColorStop(0.6, rgba(0xffffff, 0.14));
    g.addColorStop(1, rgba(0xffffff, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
  shadow: (ctx, w, h) => {
    // the long shadow east, like ev-shadow but soft at the far end
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, rgba(0xffffff, 0.9));
    g.addColorStop(0.2, rgba(0xffffff, 1));
    g.addColorStop(1, rgba(0xffffff, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(w * 0.45, h / 2, w * 0.5, h / 2 - 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  },
  puff: (ctx, w, h, rand) => {
    for (let i = 0; i < 6; i++) stamp(ctx, w / 2 + rand.realInRange(-4, 4), h / 2 + rand.realInRange(-3, 3), w * 0.32, 0xffffff, 0.35, 0.8);
  },
  stain: (ctx, w, h, rand) => {
    dab(ctx, w / 2, h / 2, w * 0.48, h * 0.45, 0, 0x1a1a20, 0.6, 0.8);
    for (let i = 0; i < 5; i++) dab(ctx, rand.between(10, w - 10), h / 2 + rand.realInRange(-2, 2), rand.between(6, 14), 2.5, 0, 0x0a0a10, 0.5, 0.7);
  },
  column: (ctx, w, h) => {
    // a brass column: shaft, a moulded base, a capital
    cyl(ctx, 2, 8, w - 4, h - 14, BRASS, { litK: 0.5, dimK: 0.55 });
    ctx.fillStyle = rgba(INK, 0.15);
    for (let y = 30; y < h - 20; y += 40) ctx.fillRect(2, y, w - 4, 1);
    bar(ctx, 0, 0, w, 8, BRASS);
    bar(ctx, 0, h - 6, w, 6, dim(BRASS, 0.2));
    ctx.fillStyle = rgba(SUN, 0.45);
    ctx.fillRect(0, 0, w, 1);
  },
  capital: (ctx, w, h) => {
    bar(ctx, 0, 0, w, h, BRASS);
    ctx.fillStyle = rgba(SUN, 0.5);
    ctx.fillRect(0, 0, w, 1);
    ctx.fillStyle = rgba(INK, 0.3);
    for (let x = 3; x < w; x += 6) ctx.fillRect(x, 2, 1, h - 3);
  },
  balustrade: (ctx, w, h) => {
    // a brass handrail on turned balusters, the shadow of each on the next
    for (let x = 6; x < w - 4; x += 32) {
      cyl(ctx, x, 5, 3, h - 5, 0xa08f70);
      stamp(ctx, x + 1.5, h * 0.45, 2.5, lit(0xa08f70, 0.3), 1, 0.3);
    }
    bar(ctx, 0, 0, w, 4, BRASS);
    ctx.fillStyle = rgba(SUN, 0.5);
    ctx.fillRect(0, 0, w, 1);
    bar(ctx, 0, h - 3, w, 3, 0xa08f70);
  },
  slab: (ctx, w, h) => {
    gradientV(ctx, 0, 0, w, h, [[0, 0xd6c8a8], [0.4, 0xc9b894], [1, 0xb0a07c]]);
    ctx.fillStyle = rgba(SUN, 0.5);
    ctx.fillRect(0, 0, w, 1);
    ctx.fillStyle = rgba(INK, 0.35);
    ctx.fillRect(0, h - 1, w, 1);
    courses(ctx, 0, 0, w, h, h, 0.12, 2);
    finish(ctx, w, h, 71, { washA: 0.08, grainA: 0.05 });
  },
  plinth: (ctx, w, h) => {
    // the station's name carved into the plinth between two pilasters and
    // two brass rails
    for (const x of [8, w - 18]) {
      cyl(ctx, x, 6, 10, h - 10, 0xc4b494, { litK: 0.4, dimK: 0.4 });
      bar(ctx, x - 2, 4, 14, 4, 0xd0c09e);
      bar(ctx, x - 2, h - 6, 14, 4, 0xb8a888);
    }
    bar(ctx, 20, 6, w - 40, 3, BRASS, { alpha: 0.85 });
    bar(ctx, 20, h - 9, w - 40, 3, BRASS, { alpha: 0.6 });
    // the carving: incised, so the cut's upper-left face is in shadow and
    // its lower-right lip catches the light
    const T = 'C R O S S R O A D S';
    letters(ctx, T, w / 2 + 1.5, h / 2 + 1.5, 16, 0xfaf2e0, { shadow: 0, weight: 'bold' });
    letters(ctx, T, w / 2 - 1, h / 2 - 1, 16, 0x5a4a34, { shadow: 0, weight: 'bold' });
    letters(ctx, T, w / 2, h / 2, 16, 0x9a8a68, { shadow: 0, weight: 'bold' });
    grain(ctx, 0, 0, w, h, 0.04, 73);
  },
  grate: (ctx, w, h) => {
    ctx.fillStyle = hex(0x0a0a12);
    ctx.fillRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = rgba(BRASS, 0.9);
    ctx.fillRect(0, 0, w, 2);
    ctx.fillRect(0, h - 2, w, 2);
    ctx.fillRect(0, 0, 2, h);
    ctx.fillRect(w - 2, 0, 2, h);
    ctx.fillStyle = rgba(0x6a6a72, 0.7);
    for (let x = 5; x < w - 3; x += 4) ctx.fillRect(x, 2, 1, h - 4);
  },
  signpost: (ctx, w, h) => cyl(ctx, 0, 0, w, h, 0x4a4650),
  signboard: (ctx, w, h, rand, o) => {
    const { body = 0x2e3a52, trim = BRASS } = o;
    dab(ctx, w / 2 + 4, h - 1, w * 0.45, 3, 0, INK, 0.3, 0.8);
    block(ctx, 0, 0, w, h - 2, body, { r: 2 });
    ctx.strokeStyle = rgba(trim, 0.95);
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, w - 4, h - 6);
    ctx.fillStyle = rgba(SUN, 0.25);
    ctx.fillRect(3, 3, w - 6, 1);
  },
  redbar: (ctx, w, h) => {
    block(ctx, 0, 0, w, h, 0xc03a2a, { r: 1 });
    ctx.fillStyle = rgba(SUN, 0.3);
    ctx.fillRect(0, 0, w, 1);
  },
  coat: (ctx, w, h, rand) => {
    // a heavy coat thrown over a sleeping man
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, hex(lit(0x6a6a62, 0.25)));
    g.addColorStop(0.5, hex(0x6a6a62));
    g.addColorStop(1, hex(dim(0x6a6a62, 0.4)));
    ctx.fillStyle = g;
    rr(ctx, 0, 2, w, h - 2, 5);
    ctx.fill();
    // folds
    ctx.strokeStyle = rgba(INK, 0.25);
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const x = 5 + i * 6 + rand.realInRange(-1, 1);
      ctx.beginPath();
      ctx.moveTo(x, 4);
      ctx.quadraticCurveTo(x + 3, h / 2, x - 1, h - 2);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(SUN, 0.25);
    ctx.fillRect(2, 2, w - 8, 1);
  },
  bollard: (ctx, w, h) => {
    cshadow(ctx, w / 2, h, w * 1.6, 0.3, 2);
    cyl(ctx, w / 2 - 3, 8, 6, h - 8, BRASS);
    stamp(ctx, w / 2, 6, 5, BRASS, 1, 0.2);
    stamp(ctx, w / 2 - 1.5, 4.5, 2, lit(BRASS, 0.7), 1, 0.4);
  },
  gate: (ctx, w, h, rand) => {
    // the service gate: two leaves of dark-green iron, bars and a plate
    const col = 0x2e4a34;
    ctx.fillStyle = rgba(col, 0.55);
    ctx.fillRect(0, 0, w, h);
    for (const lx of [2, w / 2 + 2]) {
      const lw = w / 2 - 4;
      block(ctx, lx, 0, lw, h, col, { r: 1, litK: 0.25, dimK: 0.4 });
      for (let x = lx + 5; x < lx + lw - 3; x += 8) cyl(ctx, x, 8, 3, h - 16, 0x203828);
      for (const y of [8, h / 2 - 3, h - 12]) {
        bar(ctx, lx, y, lw, 5, col);
        ctx.fillStyle = rgba(SUN, 0.25);
        ctx.fillRect(lx, y, lw, 1);
      }
      // rivets
      for (let y = 20; y < h - 20; y += 24) {
        ctx.fillStyle = rgba(SUN, 0.5);
        ctx.fillRect(lx + 2, y, 1, 1);
      }
    }
    // the meeting stile, and the dark between the leaves
    ctx.fillStyle = rgba(INK, 0.6);
    ctx.fillRect(w / 2 - 2, 0, 4, h);
    // rust weeping from the top hinge
    const g = ctx.createLinearGradient(0, 30, 0, 160);
    g.addColorStop(0, rgba(0x8a4a2a, 0.35));
    g.addColorStop(1, rgba(0x8a4a2a, 0));
    ctx.fillStyle = g;
    ctx.fillRect(6 + rand.between(0, 4), 30, 6, 130);
    grain(ctx, 0, 0, w, h, 0.05, 79);
  },
  creamsign: (ctx, w, h) => {
    dab(ctx, w / 2 + 3, h - 1, w * 0.45, 2, 0, INK, 0.3, 0.8);
    block(ctx, 0, 0, w, h - 2, 0xf2e6cc, { r: 1.5, litK: 0.1, dimK: 0.2 });
    ctx.strokeStyle = rgba(0x2a2230, 0.6);
    ctx.lineWidth = 1;
    ctx.strokeRect(2.5, 2.5, w - 5, h - 7);
    // two screws
    ctx.fillStyle = rgba(0x6a6a72, 0.9);
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(w - 6, 4, 2, 2);
  },
  lightbar: (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, rgba(0x88b8d8, 0));
    g.addColorStop(0.5, rgba(0xd8f0ff, 1));
    g.addColorStop(1, rgba(0x88b8d8, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
  shaft: (ctx, w, h) => {
    // a skylight beam: soft at both edges, fading toward the floor
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, rgba(0xfff0c8, 0));
    g.addColorStop(0.3, rgba(0xfff0c8, 1));
    g.addColorStop(0.7, rgba(0xfff0c8, 1));
    g.addColorStop(1, rgba(0xfff0c8, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-in';
    const v = ctx.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(0,0,0,1)');
    v.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  },
  sideglow: (ctx, w, h) => {
    // light spilling from a gap on the east edge, fading west
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, rgba(0x88b8d8, 0));
    g.addColorStop(1, rgba(0x88b8d8, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
  teakitchen: (ctx, w, h, rand) => {
    // Bilal's back room: a brick wall, a shelf of cups, a samovar, a cloth
    gradientV(ctx, 0, 0, w, h, [[0, 0x3a2a22], [1, 0x2e2018]]);
    for (let y = 0; y < h; y += 8) {
      ctx.fillStyle = rgba(INK, 0.3);
      ctx.fillRect(0, y, w, 1);
      for (let x = (y / 8) % 2 ? 10 : 0; x < w; x += 20) ctx.fillRect(x, y, 1, 8);
    }
    wash(ctx, 0, 0, w, h, 0x2a1a14, 0x6a4a3a, 0.2, 83, 0.04);
    // the shelf and its cups
    bar(ctx, 6, 16, w - 12, 3, WOOD);
    ctx.fillStyle = rgba(INK, 0.35);
    ctx.fillRect(6, 19, w - 12, 3);
    for (let i = 0; i < 7; i++) {
      const x = 12 + i * 15;
      block(ctx, x, 9, 8, 7, i % 2 ? 0xf2e6cc : 0xd8c8a0, { r: 2 });
      ctx.fillStyle = rgba(0xc03a2a, 0.8);
      ctx.fillRect(x + 2, 12, 4, 1);
    }
    // a warm lamp over it
    glow(ctx, w / 2, 8, 50, LAMP, 0.25);
    stamp(ctx, w / 2, 3, 3, 0xfff6dc, 0.95, 0.4);
    // a cloth on the wall
    ctx.fillStyle = rgba(0xc03a2a, 0.85);
    ctx.fillRect(w - 26, 26, 16, 22);
    ctx.fillStyle = rgba(0xf2e6cc, 0.8);
    for (let y = 28; y < 46; y += 5) ctx.fillRect(w - 24, y, 12, 1);
    void rand;
    grain(ctx, 0, 0, w, h, 0.05, 89);
  },
  signalbox: (ctx, w, h) => {
    // the signal frame: a dark cabinet with a row of dials and a diagram
    block(ctx, 0, 0, w, h, 0x2a2a34, { r: 2, litK: 0.2, dimK: 0.4 });
    ctx.strokeStyle = rgba(0x4a4a52, 0.9);
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    // the track diagram: a cream panel with a line and lamps
    block(ctx, 10, 8, w - 20, 22, 0xd8cbb0, { r: 1, litK: 0.1, dimK: 0.2 });
    ctx.strokeStyle = rgba(INK, 0.7);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(14, 20);
    ctx.lineTo(w - 14, 20);
    ctx.moveTo(30, 20);
    ctx.lineTo(44, 13);
    ctx.lineTo(w - 30, 13);
    ctx.stroke();
    for (let i = 0; i < 4; i++) stamp(ctx, 22 + i * 20, 20, 2, i === 1 ? 0xc03a2a : 0x50c878, 0.95, 0.3);
    // dials
    for (let i = 0; i < 3; i++) {
      const cx = 22 + i * 33;
      stamp(ctx, cx, 46, 8, 0x1a1a20, 1, 0.1);
      stamp(ctx, cx, 46, 6.5, 0xe8e0d0, 1, 0.1);
      ctx.strokeStyle = hex(INK);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, 46);
      ctx.lineTo(cx + 3, 42 - i);
      ctx.stroke();
    }
    glow(ctx, w / 2, 20, 40, LAMP, 0.12);
  },
  slot: (ctx, w, h, rand) => {
    // the far side of the gate: a corridor of tally under one bulb, receding
    ctx.fillStyle = hex(0x0a0a10);
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h * 0.3, 2, w / 2, h * 0.5, w * 0.6);
    g.addColorStop(0, rgba(0xf2e6cc, 0.22));
    g.addColorStop(1, rgba(0xf2e6cc, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = rgba(0x8a8478, 0.7);
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const d = i / 14;
      for (const s of [-1, 1]) {
        const x = w / 2 + s * (24 - d * 20);
        ctx.beginPath();
        ctx.moveTo(x, h / 2 - 14 + d * 6);
        ctx.lineTo(x + rand.realInRange(-0.5, 0.5), h / 2 - 6 + d * 3);
        ctx.stroke();
      }
    }
    stamp(ctx, w / 2, h / 2 - 12, 3, 0xfff6dc, 0.95, 0.4);
    ctx.fillStyle = rgba(0x6a6a72, 0.8);
    ctx.fillRect(w / 2 - 0.5, 0, 1, h / 2 - 14);
    ctx.strokeStyle = rgba(0x4a4a52, 0.9);
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  },
  lostfound: (ctx, w, h) => {
    // a hatch in the wall with a brass frame and a shelf of odd things
    block(ctx, 0, 0, w, h, 0x2a2230, { r: 2, litK: 0.15, dimK: 0.35 });
    ctx.strokeStyle = rgba(BRASS, 0.95);
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    // a shelf with an umbrella, a hat, a glove
    bar(ctx, 8, h - 10, w - 16, 2, BRASS, { alpha: 0.7 });
    ctx.fillStyle = hex(0x3a5a80);
    ctx.fillRect(12, h - 16, 12, 5);
    ctx.fillStyle = hex(0x23233a);
    ctx.fillRect(34, h - 15, 12, 4);
    ctx.fillRect(37, h - 18, 6, 3);
    ctx.fillStyle = hex(0x8a5a3b);
    ctx.fillRect(58, h - 16, 6, 6);
    glow(ctx, w / 2, h / 2, w * 0.4, LAMP, 0.08);
  },
  // the identifying props on each platform, painted in place of the old graphics
  pp_produce: (ctx, w, h) => {
    const y = h;
    cshadow(ctx, 30, y, 70, 0.3, 3);
    block(ctx, 12, y - 26, 26, 26, 0x6a4a32, { r: 1.5 });
    block(ctx, 40, y - 18, 22, 18, 0x7a5a3a, { r: 1.5 });
    ctx.fillStyle = rgba(INK, 0.3);
    ctx.fillRect(14, y - 14, 22, 1);
    for (const dx of [14, 22, 30]) {
      stamp(ctx, dx, y - 30, 4.5, 0xc84a4a, 1, 0.2);
      stamp(ctx, dx - 1.5, y - 31.5, 2, 0xf29090, 0.8, 0.5);
    }
    for (const dx of [46, 54]) stamp(ctx, dx, y - 21, 3.5, 0xe8a030, 1, 0.3);
    // the menu board on the wall
    cyl(ctx, 168, y - 60, 3, 60, IRON);
    block(ctx, 150, y - 60, 40, 30, 0x2a2230, { r: 1.5 });
    ctx.strokeStyle = rgba(BRASS, 0.8);
    ctx.lineWidth = 1;
    ctx.strokeRect(152.5, y - 57.5, 35, 25);
  },
  pp_posters: (ctx, w, h) => {
    const y = h;
    [0, 1, 2].forEach((i) => {
      const x = 130 + i * 26;
      dab(ctx, x + 13, y - 62, 12, 3, 0, INK, 0.25, 0.8);
      block(ctx, x, y - 92, 22, 30, i === 1 ? 0xe8dcc8 : 0x3a1420, { r: 0.5, litK: 0.12, dimK: 0.25 });
      ctx.fillStyle = rgba(i === 1 ? 0x3a1420 : 0xf2d580, 0.8);
      ctx.fillRect(x + 4, y - 86, 14, 2);
      ctx.fillRect(x + 6, y - 80, 10, 1);
      stamp(ctx, x + 11, y - 72, 5, i === 1 ? 0x8a3a3a : 0xf2d580, 0.6, 0.5);
    });
    // a flight case on the ground
    cshadow(ctx, 78, y, 50, 0.4, 3);
    block(ctx, 60, y - 14, 36, 14, 0x26262e, { r: 2 });
    ctx.fillStyle = rgba(0x8a8a90, 0.9);
    ctx.fillRect(62, y - 12, 2, 2);
    ctx.fillRect(92, y - 12, 2, 2);
  },
  pp_blocks: (ctx, w, h) => {
    const y = h;
    cshadow(ctx, 36, y, 44, 0.3, 3);
    block(ctx, 20, y - 14, 30, 6, 0xd8d8e0, { r: 1 });
    block(ctx, 24, y - 22, 8, 8, 0xe8e8f0, { r: 1 });
    block(ctx, 40, y - 18, 8, 4, 0xd0d0d8, { r: 1 });
    ctx.fillStyle = rgba(0xe8762a, 0.9);
    ctx.fillRect(26, y - 20, 4, 1);
  },
  pp_easels: (ctx, w, h) => {
    const y = h;
    cshadow(ctx, 40, y, 40, 0.3, 3);
    ctx.strokeStyle = hex(0x6a5a3a);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(40, y - 60);
    ctx.moveTo(50, y);
    ctx.lineTo(40, y - 60);
    ctx.stroke();
    ctx.strokeStyle = hex(lit(0x6a5a3a, 0.4));
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(29, y);
    ctx.lineTo(39, y - 60);
    ctx.stroke();
    block(ctx, 28, y - 56, 26, 22, 0xf2e6cc, { r: 0.5, litK: 0.1, dimK: 0.2 });
    // the painting on it: a little sky and a hill
    gradientV(ctx, 31, y - 53, 20, 10, [[0, 0x88b8d8], [1, 0xf2c078]]);
    dab(ctx, 41, y - 41, 12, 5, 0, 0x4a7a3a, 1, 0.3);
  },
  pp_boxes: (ctx, w, h) => {
    const y = h;
    cshadow(ctx, 40, y, 60, 0.35, 3);
    [0, 1, 2].forEach((i) => {
      block(ctx, 20 + i * 6, y - 18 - i * 16, 34, 16, [0xb8a98c, 0xc4b498, 0xb0a084][i], { r: 1 });
      ctx.fillStyle = rgba(INK, 0.25);
      ctx.fillRect(22 + i * 6, y - 10 - i * 16, 30, 1);
      ctx.fillStyle = rgba(0x8a6a4a, 0.6);
      ctx.fillRect(34 + i * 6, y - 18 - i * 16, 6, 16);
    });
  },
  pp_crates: (ctx, w, h) => {
    const y = h;
    cshadow(ctx, 42, y, 56, 0.35, 3);
    block(ctx, 20, y - 30, 40, 30, 0x4a5a42, { r: 1 });
    ctx.strokeStyle = rgba(0x2a3a26, 0.9);
    ctx.lineWidth = 2;
    ctx.strokeRect(21, y - 29, 38, 28);
    ctx.beginPath();
    ctx.moveTo(22, y - 28);
    ctx.lineTo(58, y - 2);
    ctx.stroke();
    ctx.fillStyle = rgba(0xf2e6cc, 0.7);
    ctx.fillRect(26, y - 24, 12, 4);
  },
  pp_lights: (ctx, w, h) => {
    const y = h;
    bar(ctx, 16, y - 90, 60, 6, 0x3a1420);
    [0, 1, 2, 3].forEach((i) => {
      const x = 24 + i * 16;
      glow(ctx, x, y - 96, 12, LAMP, 0.3);
      stamp(ctx, x, y - 96, 4, 0xfff6dc, 0.95, 0.4);
    });
  },
  pp_lockers: (ctx, w, h) => {
    const y = h;
    cshadow(ctx, 44, y, 70, 0.35, 3);
    [0, 1, 2].forEach((i) => {
      block(ctx, 20 + i * 16, y - 60, 14, 60, 0x8a9aa8, { r: 1 });
      ctx.fillStyle = rgba(INK, 0.35);
      ctx.fillRect(22 + i * 16, y - 54, 10, 1);
      ctx.fillRect(22 + i * 16, y - 30, 10, 1);
      ctx.fillStyle = rgba(0x3a3a44, 0.9);
      ctx.fillRect(30 + i * 16, y - 40, 2, 4);
    });
    block(ctx, 150, y - 40, 26, 30, 0xf2e6cc, { r: 0.5, litK: 0.1, dimK: 0.2 });
    ctx.fillStyle = rgba(0x2e4a56, 0.8);
    ctx.fillRect(154, y - 34, 18, 2);
    ctx.fillRect(154, y - 28, 12, 1);
  },
};

export function hubTex(scene, kind, w, h, o = {}) {
  const key = `hub-${kind}-${w}x${h}${o.body !== undefined ? `-${o.body.toString(16)}` : ''}`;
  if (scene.textures.exists(key)) return key;
  const painter = ON_DEMAND[kind];
  if (!painter) return null;
  return paintTexture(scene, key, w, h, (ctx, ww, hh, rand) => painter(ctx, ww, hh, rand, o), key);
}

void shade;
void fbm;
void Phaser;
