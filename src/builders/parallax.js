import Phaser from 'phaser';
import { isSolidChar } from './legend.js';
import { D } from './depths.js';

// D7 — parallax backdrops.
//
// The rule this file follows: a backdrop layer is a *place*, not a texture
// stretched over the screen. Distant things sit on the horizon with sky above
// them, nearer things sit on the ground, and everything in between is empty.
// (The first pass tiled every layer over the whole viewport and stacked them
// with a scrim on top, which read as speckled noise rather than depth.)
const W = 512;

// how fast each slot tracks the camera: 0 = pinned to the screen, 1 = pinned
// to the terrain. The gaps are wide so the three read as separate distances.
const F = { far: 0.12, scenery: 0.22, mid: 0.34, near: 0.62 };

// Aerial perspective: the further back a layer is, the more it washes out
// into the sky behind it. This is what lets the play layer read as "in
// front" -- a backdrop drawn at full strength competes with the terrain no
// matter how pretty it is.
const HAZE = { far: 0.62, scenery: 0.74, mid: 0.86, near: 1 };

// ---------------------------------------------------------------------------
// texture generators — content sits on the BOTTOM edge of a transparent
// canvas so the layer can be anchored to the horizon.
// ---------------------------------------------------------------------------
const GENERATORS = {
  // a run of buildings against the sky
  skyline(g, rand, c, H) {
    let x = 0;
    while (x < W) {
      let bw = rand.between(52, 104);
      if (W - x < bw + 40) bw = W - x; // close the row exactly: no seam
      const bh = rand.between(Math.round(H * 0.34), Math.round(H * 0.94));
      const top = H - bh;
      g.fillStyle(c.main, 1);
      g.fillRect(x, top, bw, bh);
      // roofline furniture — the thing that stops a skyline reading as bars
      const r = rand.frac();
      if (r < 0.22) g.fillRect(x + bw / 2 - 2, top - rand.between(14, 30), 4, 30);
      else if (r < 0.36) {
        g.fillRect(x + bw / 2 - 11, top - 16, 22, 16);
        g.fillRect(x + bw / 2 - 8, top - 22, 16, 6);
      } else if (r < 0.46) g.fillRect(x + 4, top - 6, bw - 8, 6);
      // windows: dim, sparse, on a grid, only on the taller blocks
      if (bh > H * 0.45) {
        g.fillStyle(c.accent, 0.5);
        for (let wy = top + 16; wy < H - 12; wy += 20)
          for (let wx = x + 9; wx < x + bw - 11; wx += 15)
            if (rand.frac() < 0.2) g.fillRect(wx, wy, 4, 6);
      }
      x += bw + rand.between(0, 12);
    }
  },

  // a continuous building face the player walks past
  facade(g, rand, c, H) {
    const base = Math.round(H * 0.62);
    for (let x = 0; x < W; x += 64) {
      const h = base + rand.between(-14, 26);
      g.fillStyle(c.main, 1);
      g.fillRect(x, H - h, 66, h);
      g.fillStyle(c.accent, 0.45);
      g.fillRect(x, H - h, 66, 3); // lit cornice
    }
    // courses and openings
    g.fillStyle(c.accent, 0.22);
    for (let y = H - Math.round(H * 0.5); y < H; y += 26) g.fillRect(0, y, W, 1);
    for (let x = 18; x < W; x += 96) {
      if (rand.frac() < 0.55) {
        g.fillStyle(c.accent, 0.5); // a window with something on behind it
        g.fillRect(x, H - rand.between(60, 90), 26, 34);
      } else {
        g.fillStyle(0x000000, 0.4); // a doorway
        g.fillRect(x + 4, H - 54, 22, 54);
      }
    }
  },

  // an interior surface: the only kind that legitimately fills the frame
  wall(g, rand, c, H) {
    g.fillStyle(c.main, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(c.accent, 0.3);
    for (let y = 0; y < H; y += 32) g.fillRect(0, y, W, 2);
    for (let y = 0; y < H; y += 32) {
      const off = (y / 32) % 2 ? 0 : 32;
      for (let x = off; x < W; x += 64) g.fillRect(x, y, 2, 32);
    }
  },

  // things standing on the ground: crates, cases, planters, benches
  strip(g, rand, c, H) {
    for (let x = rand.between(0, 70); x < W; x += rand.between(74, 168)) {
      const w = rand.between(26, 52);
      const h = rand.between(20, Math.round(H * 0.7));
      g.fillStyle(c.main, 1);
      g.fillRect(x, H - h, w, h);
      g.fillStyle(c.accent, 0.7);
      g.fillRect(x + 4, H - h + 5, w - 8, 3);
      g.fillRect(x + 4, H - 9, w - 8, 3);
      if (rand.frac() < 0.35) {
        // something stacked on top
        g.fillStyle(c.main, 1);
        g.fillRect(x + 7, H - h - 16, w - 14, 16);
      }
    }
  },

  // things hanging from above: lamps, chandeliers, hooks, lanterns
  hanging(g, rand, c, H) {
    for (let x = rand.between(20, 90); x < W; x += rand.between(80, 150)) {
      const len = rand.between(Math.round(H * 0.2), Math.round(H * 0.62));
      g.fillStyle(c.main, 1);
      g.fillRect(x, 0, 3, len);
      g.fillRect(x - 12, len, 27, 12);
      g.fillStyle(c.accent, 0.75);
      g.fillRect(x - 9, len + 12, 21, 4);
    }
  },

  // a railing / fence / low stand: waist height, sits on the ground
  railing(g, rand, c, H) {
    g.fillStyle(c.main, 1);
    for (let x = 4; x < W; x += 34) g.fillRect(x, H - Math.round(H * 0.8), 3, H);
    g.fillRect(0, H - Math.round(H * 0.82), W, 4);
    g.fillStyle(c.accent, 0.45);
    g.fillRect(0, H - Math.round(H * 0.86), W, 2);
    for (let x = rand.between(30, 120); x < W; x += rand.between(150, 260)) {
      g.fillStyle(c.main, 1); // a post with something on it
      g.fillRect(x, H - H, 6, H);
      g.fillStyle(c.accent, 0.5);
      g.fillRect(x - 2, H - H, 10, 5);
    }
  },

  // tall vertical structure: trusses, cables, pipe runs, fire escapes
  poles(g, rand, c, H) {
    for (let x = 0; x < W; x += 96) {
      g.fillStyle(c.main, 0.95);
      g.fillRect(x, 0, 6, H);
      g.fillStyle(c.accent, 0.4);
      g.fillRect(x + 6, 0, 2, H);
      g.fillStyle(c.main, 0.8); // cross bracing
      for (let y = 12; y < H; y += 46) g.fillRect(x, y, 96, 3);
    }
  },

  // a soft wash of light sitting on the horizon
  glow(g, rand, c, H) {
    const from = Phaser.Display.Color.ValueToColor(c.main);
    const to = Phaser.Display.Color.ValueToColor(c.accent);
    const slices = 40;
    for (let i = 0; i < slices; i++) {
      const t = i / (slices - 1); // 0 at the top of the band, 1 on the horizon
      const col = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, slices - 1, i);
      g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 0.08 + 0.72 * t * t);
      g.fillRect(0, Math.floor((i * H) / slices), W, Math.ceil(H / slices) + 1);
    }
    // a low sun / lamp sitting on the line
    g.fillStyle(c.accent, 0.3);
    g.fillCircle(W * 0.62, H - 10, 54);
    g.fillStyle(c.accent, 0.5);
    g.fillCircle(W * 0.62, H - 10, 30);
  },
};

const KIND_H = { skyline: 230, facade: 210, wall: 288, strip: 108, hanging: 130, poles: 190, railing: 74, glow: 190 };

// name -> [kind, main, accent, sky top, sky bottom]
// mains are chosen by aerial perspective: the far layer sits closer in value
// to its sky, the near layer is the darkest thing behind the terrain.
const LAYERS = {
  // --- exteriors, far ---
  city: ['skyline', 0x2f3157, 0xf2d590, 0x1a1f3d, 0x6a4a63],
  rain_city: ['skyline', 0x2b3350, 0x8aa0c8, 0x161d34, 0x3f4a68],
  cold_city: ['skyline', 0x2c3348, 0xd8a850, 0x151b2c, 0x4a4258],
  street: ['skyline', 0x342a4a, 0xd8a850, 0x1c1730, 0x5e3f52],
  crowd: ['skyline', 0x241a26, 0x4a2a3a, 0x140d16, 0x2e1b2a],
  dawn: ['glow', 0x8a5a52, 0xf2c078, 0x3a3560, 0xe0a074],
  river: ['glow', 0x2a3a4a, 0x88b8d8, 0x1e2c46, 0x54748e],
  // --- interiors, far ---
  frost: ['wall', 0x38495a, 0x6a90a4, 0x28323e, 0x28323e],
  foam: ['wall', 0x3b4248, 0x555f66, 0x2a3036, 0x2a3036],
  brown_wall: ['wall', 0x3a2a1e, 0x54402c, 0x281c14, 0x281c14],
  kitchen_wall: ['wall', 0x424553, 0x5c6070, 0x2f313c, 0x2f313c],
  pans: ['wall', 0x3a3844, 0xb87333, 0x2a2833, 0x2a2833],
  sugar: ['glow', 0x6a5a72, 0xe8d8ec, 0x4a3f52, 0x8a7a90],
  dining_room: ['glow', 0x3a2a30, 0xf2d580, 0x2a1e24, 0x5a3f3a],
  // --- the station ---
  hall_vault: ['wall', 0xe8dcc0, 0xc4a25c, 0xd9cbb0, 0xd9cbb0],
  gate_dark: ['wall', 0x2e3a30, 0x1e2a22, 0x1a241c, 0x1a241c],
  station_facade: ['facade', 0xd8cbb0, 0xc4a25c],
  ticket_hall: ['facade', 0xcfc0a2, 0x2e6a4a],
  ticket_booths: ['strip', 0x4a3a2a, 0x50c878],
  shed_ribs: ['poles', 0x4a4650, 0x8a8490],
  shed_lamps: ['hanging', 0x3a3a44, 0xf2d580],
  // --- mid ---
  brick: ['facade', 0x46332d, 0xd8a060],
  theatre: ['facade', 0x3f1e28, 0xf2d580],
  club_wall: ['facade', 0x3a2030, 0xc86a90],
  subway_mouth: ['facade', 0x2d333d, 0x7a8496],
  booth_glass: ['facade', 0x3a4a52, 0x86b0c0],
  pavilion: ['facade', 0x33402e, 0xf2c078],
  shelving: ['strip', 0x4e5c64, 0x9ac4dc],
  bowls: ['strip', 0x5a4c40, 0xd8c8a0],
  herb_beds: ['strip', 0x33452c, 0x76a057],
  posters: ['strip', 0x4a3e32, 0xd8c8a0],
  flightcases: ['strip', 0x26262e, 0x5a5a68],
  chandeliers: ['hanging', 0x4a3a30, 0xf2e0a0],
  truss: ['poles', 0x33333e, 0x70707e],
  // --- near ---
  fence: ['railing', 0x2a2a32, 0x4a4a56],
  crates: ['strip', 0x4a3423, 0x8a6844],
  carcasses: ['hanging', 0x543a3a, 0x8a5a5a],
  cooks: ['strip', 0x22222c, 0x44444f],
  chandelier: ['hanging', 0x4a4050, 0xf0e8f8],
  heat_lamps: ['hanging', 0x3a3038, 0xf09040],
  beehive: ['strip', 0x5a4c28, 0xd8b858],
  fire_escape: ['poles', 0x21212a, 0x44444f],
  bar_rail: ['railing', 0x2e2118, 0x6a4a32],
  railings: ['railing', 0x2c2c36, 0x54545f],
  pipes: ['poles', 0x3a2e22, 0x6a5a3a],
  mic_stands: ['railing', 0x22222a, 0x44444f],
  cables: ['poles', 0x16161c, 0x32323c],
  lanterns: ['hanging', 0x3a2e28, 0xf2c078],
  banner: ['strip', 0x40243a, 0x8a4a5a],
  loading_dock: ['strip', 0x3a3540, 0x5c5768],
};

function layerDef(name) {
  return LAYERS[name] || LAYERS.city;
}

// `as` overrides the layer's natural kind: only the far slot may fill the
// frame, so a wall used as a mid layer becomes a facade you walk past instead
// of a curtain that hides everything behind it.
function ensureLayerTexture(scene, name, as) {
  const [natural, main, accent] = layerDef(name);
  const kind = as || natural;
  const key = `bg_${name}_${kind}`;
  if (scene.textures.exists(key)) return key;
  const H = KIND_H[kind];
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const rand = new Phaser.Math.RandomDataGenerator([name]);
  GENERATORS[kind](g, rand, { main, accent }, H);
  g.generateTexture(key, W, H);
  g.destroy();
  return key;
}

function ensureSkyTexture(scene, name) {
  const key = `sky_${name}`;
  if (scene.textures.exists(key)) return key;
  const d = layerDef(name);
  const top = Phaser.Display.Color.ValueToColor(d[3] ?? 0x1a1f3d);
  const bot = Phaser.Display.Color.ValueToColor(d[4] ?? d[3] ?? 0x1a1f3d);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const bands = 48;
  for (let i = 0; i < bands; i++) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, bands - 1, i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
    g.fillRect(0, (i * 256) / bands, 8, 256 / bands + 1);
  }
  g.generateTexture(key, 8, 256);
  g.destroy();
  return key;
}

// ---------------------------------------------------------------------------
// Background scenery — the actual *things* that pass by as Jo walks. Layer
// textures give a place its material; these give it landmarks you can name,
// and they differ room to room so forward motion is legible.
// A prop is a list of primitives in a local space where y=0 is the ground
// line and up is negative.
// ---------------------------------------------------------------------------
const r = (x, y, w, h, c, a = 1) => ['r', x, y, w, h, c, a];
const c_ = (x, y, rad, c, a = 1) => ['c', x, y, rad, c, a];
const t_ = (pts, c, a = 1) => ['t', pts, c, a];

const PROPS = {
  water_tower: (p) => [
    r(-2, -34, 4, 34, p.main), r(-20, -34, 4, 34, p.main), r(16, -34, 4, 34, p.main),
    r(-22, -74, 44, 40, p.main), t_([-24, -74, 24, -74, 0, -92], p.main),
    r(-22, -60, 44, 3, p.accent, 0.4),
  ],
  billboard: (p) => [
    r(-3, -40, 5, 40, p.main), r(14, -40, 5, 40, p.main),
    r(-30, -84, 62, 46, p.main), r(-26, -80, 54, 38, p.accent, 0.28),
    r(-30, -88, 62, 5, p.accent, 0.55),
  ],
  crane: (p) => [
    r(-4, -110, 9, 110, p.main), r(-46, -110, 104, 6, p.main),
    r(-46, -104, 14, 12, p.main), r(30, -104, 3, 26, p.main), r(22, -80, 19, 8, p.main),
    c_(0, -116, 3, p.accent, 0.8),
  ],
  radio_mast: (p) => [
    t_([-9, 0, 9, 0, 0, -120], p.main), r(-11, -40, 22, 3, p.main), r(-7, -76, 14, 3, p.main),
    c_(0, -122, 3, 0xe8604a, 0.9),
  ],
  church: (p) => [
    r(-16, -70, 32, 70, p.main), t_([-20, -70, 20, -70, 0, -116], p.main),
    r(-6, -50, 12, 16, p.accent, 0.4), c_(0, -120, 2, p.accent, 0.7),
  ],
  ac_units: (p) => [
    r(-26, -18, 24, 18, p.main), r(2, -26, 26, 26, p.main),
    c_(-14, -9, 6, p.accent, 0.35), c_(15, -13, 8, p.accent, 0.35),
  ],
  pylon: (p) => [
    t_([-22, 0, -8, 0, 0, -96], p.main), t_([22, 0, 8, 0, 0, -96], p.main),
    r(-30, -70, 60, 4, p.main), r(-24, -50, 48, 4, p.main),
  ],
  bridge: (p) => [
    r(-70, -26, 140, 6, p.main), r(-40, -84, 7, 64, p.main), r(34, -84, 7, 64, p.main),
    t_([-37, -84, -37, -30, -74, -26], p.accent, 0.5), t_([37, -84, 37, -30, 74, -26], p.accent, 0.5),
  ],
  tree: (p) => [
    r(-4, -34, 8, 34, p.main), c_(0, -50, 20, p.main), c_(-16, -40, 14, p.main), c_(16, -42, 13, p.main),
    c_(-6, -56, 10, p.accent, 0.25),
  ],
  hedge: (p) => [r(-34, -18, 68, 18, p.main), r(-34, -20, 68, 4, p.accent, 0.35)],
  bench: (p) => [
    r(-22, -12, 44, 5, p.main), r(-22, -24, 44, 4, p.main),
    r(-20, -12, 4, 12, p.main), r(16, -12, 4, 12, p.main),
  ],
  streetlamp: (p) => [
    r(-2, -76, 5, 76, p.main), r(-2, -78, 22, 4, p.main),
    c_(18, -72, 6, p.accent, 0.85), c_(18, -72, 16, p.accent, 0.16),
  ],
  neon: (p) => [
    r(-24, -60, 48, 34, p.main), r(-18, -54, 36, 8, p.accent, 0.85),
    r(-18, -40, 24, 6, p.accent, 0.6), r(-1, -26, 3, 26, p.main),
  ],
  awning: (p) => [
    t_([-30, -30, 30, -30, 22, -12], p.main), r(-24, -14, 46, 4, p.accent, 0.6),
    r(-30, -32, 60, 4, p.main),
  ],
  phone_booth: (p) => [
    r(-11, -46, 23, 46, p.main), r(-8, -42, 17, 26, p.accent, 0.45), r(-13, -50, 27, 5, p.main),
  ],
  van: (p) => [
    r(-34, -30, 46, 30, p.main), r(12, -22, 22, 22, p.main), r(16, -19, 13, 9, p.accent, 0.5),
    c_(-22, 0, 7, p.main), c_(22, 0, 7, p.main),
  ],
  market_stall: (p) => [
    r(-30, -12, 60, 12, p.main), r(-32, -46, 6, 34, p.main), r(26, -46, 6, 34, p.main),
    r(-34, -52, 68, 8, p.accent, 0.7), r(-34, -44, 68, 3, p.main),
  ],
  bandstand: (p) => [
    r(-36, -8, 72, 8, p.main), r(-30, -44, 5, 36, p.main), r(25, -44, 5, 36, p.main), r(-2, -44, 5, 36, p.main),
    t_([-42, -44, 42, -44, 0, -74], p.main), c_(0, -78, 3, p.accent, 0.8),
  ],
  speaker_stack: (p) => [
    r(-18, -34, 36, 34, p.main), r(-18, -66, 36, 32, p.main),
    c_(0, -18, 9, p.accent, 0.4), c_(0, -50, 9, p.accent, 0.4),
  ],
  spotlight_rig: (p) => [
    r(-40, -96, 80, 7, p.main),
    r(-28, -89, 12, 12, p.main), r(-4, -89, 12, 12, p.main), r(20, -89, 12, 12, p.main),
    t_([-22, -77, -46, -6, 2, -6], p.accent, 0.09), t_([26, -77, 2, -6, 50, -6], p.accent, 0.09),
  ],
  amp_wall: (p) => [
    r(-30, -46, 28, 46, p.main), r(2, -38, 28, 38, p.main),
    r(-26, -42, 20, 20, p.accent, 0.3), r(6, -34, 20, 16, p.accent, 0.3),
  ],
  mic_boom: (p) => [
    r(-1, -70, 3, 70, p.main), r(-1, -70, 26, 3, p.main), r(22, -68, 7, 12, p.main),
    r(-14, -2, 30, 4, p.main),
  ],
  crate_stack: (p) => [
    r(-24, -22, 24, 22, p.main), r(2, -30, 24, 30, p.main), r(-16, -38, 22, 16, p.main),
    r(-22, -16, 20, 3, p.accent, 0.5), r(4, -24, 20, 3, p.accent, 0.5),
  ],
  poster_board: (p) => [
    r(-22, -54, 44, 54, p.main), r(-17, -48, 15, 20, p.accent, 0.45), r(1, -44, 15, 26, p.accent, 0.3),
  ],
  ice_stack: (p) => [
    r(-26, -20, 26, 20, p.main), r(2, -34, 24, 34, p.main), r(-20, -34, 18, 14, p.main),
    r(-24, -18, 22, 3, p.accent, 0.55), r(4, -32, 20, 3, p.accent, 0.55),
  ],
  fan: (p) => [
    r(-24, -48, 48, 44, p.main), c_(0, -26, 17, p.accent, 0.3), c_(0, -26, 5, p.accent, 0.7),
    r(-24, -52, 48, 5, p.main),
  ],
  shelf_ladder: (p) => [
    r(-14, -66, 4, 66, p.main), r(10, -66, 4, 66, p.main),
    r(-14, -14, 28, 3, p.main), r(-14, -32, 28, 3, p.main), r(-14, -50, 28, 3, p.main),
  ],
  pot_rack: (p) => [
    r(-34, -74, 68, 5, p.main),
    c_(-20, -60, 10, p.main), c_(2, -56, 12, p.main), c_(22, -62, 8, p.main),
    r(-22, -69, 4, 8, p.main), r(0, -69, 4, 8, p.main), r(20, -69, 4, 8, p.main),
  ],
  extractor: (p) => [
    t_([-38, -46, 38, -46, 26, -20], p.main), r(-38, -52, 76, 7, p.main),
    r(-24, -22, 48, 3, p.accent, 0.4),
  ],
  prep_table: (p) => [
    r(-30, -26, 60, 5, p.main), r(-26, -21, 5, 21, p.main), r(21, -21, 5, 21, p.main),
    r(-18, -34, 12, 8, p.main), c_(10, -32, 6, p.main),
  ],
  mixer: (p) => [
    r(-14, -8, 28, 8, p.main), r(-8, -44, 16, 36, p.main), r(-20, -56, 40, 14, p.main),
    c_(-6, -20, 9, p.accent, 0.35),
  ],
  cake_stand: (p) => [
    r(-3, -22, 7, 22, p.main), r(-18, -26, 36, 5, p.main), r(-13, -38, 26, 12, p.accent, 0.6),
    r(-9, -46, 18, 8, p.main),
  ],
  column: (p) => [
    r(-11, -96, 23, 96, p.main), r(-15, -100, 31, 6, p.main), r(-15, -6, 31, 6, p.main),
    r(-4, -90, 3, 84, p.accent, 0.2),
  ],
  table_setting: (p) => [
    r(-24, -22, 48, 4, p.main), r(-20, -18, 4, 18, p.main), r(16, -18, 4, 18, p.main),
    c_(-8, -26, 5, p.accent, 0.5), r(8, -32, 3, 10, p.accent, 0.7),
  ],
};

// which props belong to which place — keyed off the room's far layer, so
// every room already carries a different cast without touching room data
const SCENERY = {
  city: ['water_tower', 'billboard', 'ac_units', 'crane', 'church', 'radio_mast'],
  rain_city: ['water_tower', 'neon', 'ac_units', 'radio_mast', 'billboard'],
  cold_city: ['pylon', 'streetlamp', 'bridge', 'radio_mast', 'ac_units'],
  street: ['neon', 'awning', 'streetlamp', 'phone_booth', 'van'],
  crowd: ['speaker_stack', 'spotlight_rig', 'amp_wall'],
  dawn: ['tree', 'hedge', 'bench', 'market_stall', 'streetlamp'],
  river: ['bridge', 'tree', 'bandstand', 'bench', 'hedge'],
  frost: ['ice_stack', 'fan', 'shelf_ladder', 'crate_stack'],
  foam: ['amp_wall', 'speaker_stack', 'mic_boom'],
  brown_wall: ['amp_wall', 'poster_board', 'crate_stack', 'mic_boom'],
  kitchen_wall: ['extractor', 'prep_table', 'pot_rack', 'shelf_ladder'],
  pans: ['pot_rack', 'extractor', 'prep_table'],
  sugar: ['mixer', 'cake_stand', 'shelf_ladder', 'prep_table'],
  dining_room: ['column', 'table_setting', 'cake_stand'],
  hall_vault: ['column', 'streetlamp', 'bench', 'phone_booth'],
  gate_dark: ['crate_stack', 'pylon'],
};

function drawPrimitives(g, prims) {
  for (const p of prims) {
    if (p[0] === 'r') {
      g.fillStyle(p[5], p[6]);
      g.fillRect(p[1], p[2], p[3], p[4]);
    } else if (p[0] === 'c') {
      g.fillStyle(p[4], p[5]);
      g.fillCircle(p[1], p[2], p[3]);
    } else {
      g.fillStyle(p[2], p[3]);
      const q = p[1];
      g.fillTriangle(q[0], q[1], q[2], q[3], q[4], q[5]);
    }
  }
}

// Landmarks are single readable shapes so each room is recognisable.
function drawLandmark(scene, name) {
  const c = scene.add.container(0, 0).setDepth(D.BG_LANDMARK).setScrollFactor(0);
  const add = (o) => {
    c.add(o);
    return o;
  };
  const label = (t, col = '#f2d580', size = 14) =>
    add(scene.add.text(0, -70, t, { fontFamily: 'monospace', fontSize: `${size}px`, color: col }).setOrigin(0.5));
  switch (name) {
    case 'meridian_sign':
      add(scene.add.rectangle(0, -60, 260, 46, 0x3a2c28));
      label('HOTEL MERIDIAN', '#a05a4a', 15);
      break;
    case 'marquee':
      add(scene.add.rectangle(0, -70, 320, 60, 0x3a1420));
      for (let i = -6; i <= 6; i++) add(scene.add.circle(i * 24, -42, 4, 0xf2d580, 0.9));
      label('THE BIG STAGE', '#f2d580', 16);
      break;
    case 'compressor':
      add(scene.add.rectangle(0, -40, 120, 90, 0x4a5a66));
      add(scene.add.circle(0, -40, 26, 0x6a8a9c));
      add(scene.add.circle(0, -40, 12, 0x9ac4dc));
      break;
    case 'pass_window':
      add(scene.add.rectangle(0, -60, 200, 70, 0x2a2a34));
      for (let i = -2; i <= 2; i++) add(scene.add.circle(i * 40, -78, 9, 0xf09040, 0.8));
      break;
    case 'chocolate_river':
      add(scene.add.rectangle(0, 10, 300, 26, 0x4a2c1a, 0.8));
      add(scene.add.rectangle(0, -4, 300, 8, 0x6a4028, 0.9));
      break;
    case 'the_pass':
      add(scene.add.rectangle(0, -30, 260, 16, 0xb8bcc8));
      for (let i = -3; i <= 3; i++) add(scene.add.circle(i * 36, -62, 10, 0xf2c078, 0.7));
      break;
    case 'sunrise':
    case 'dawn':
      add(scene.add.circle(0, 10, 70, 0xf2c078, 0.5));
      add(scene.add.circle(0, 10, 110, 0xf2c078, 0.18));
      break;
    case 'blue_cellar_sign':
      add(scene.add.rectangle(0, -60, 180, 44, 0x1e2a3a));
      label('THE BLUE CELLAR', '#88b8d8', 12);
      break;
    case 'sodium_lamp':
      add(scene.add.rectangle(0, -30, 5, 120, 0x3a3a44));
      add(scene.add.circle(0, -92, 12, 0xf2b060, 0.95));
      add(scene.add.circle(0, -86, 34, 0xf2b060, 0.16));
      break;
    case 'hanging_bulb':
      add(scene.add.rectangle(0, -90, 2, 60, 0x2a2230));
      add(scene.add.circle(0, -56, 10, 0xf2e0a0));
      add(scene.add.circle(0, -56, 30, 0xf2e0a0, 0.15));
      break;
    case 'bandstand':
      add(scene.add.arc(0, -40, 90, 180, 360, false, 0x3a4a3a));
      add(scene.add.rectangle(0, -6, 190, 10, 0x5a4a32));
      break;
    case 'record_light':
      add(scene.add.rectangle(0, -70, 90, 30, 0x2a2a30));
      add(scene.add.circle(0, -70, 9, 0xe83a2a, 0.9));
      break;
    case 'the_big_stage':
      add(scene.add.rectangle(0, -80, 380, 14, 0x2a2a34));
      for (let i = -5; i <= 5; i++) {
        add(scene.add.circle(i * 34, -66, 7, 0xf2d580, 0.8));
        add(scene.add.triangle(i * 34, -30, -14, 40, 14, 40, 0, 0, 0xf2d580, 0.06));
      }
      break;
    case 'great_clock':
      add(scene.add.circle(0, -150, 46, 0xf2e6cc));
      add(scene.add.circle(0, -150, 42, 0x2a2230).setStrokeStyle(2, 0xc4a25c));
      add(scene.add.rectangle(0, -162, 3, 24, 0xf2e6cc));
      add(scene.add.rectangle(10, -150, 20, 2, 0xf2e6cc));
      for (let i = -3; i <= 3; i++) add(scene.add.rectangle(i * 70, -60, 8, 160, 0xc4a25c, 0.35));
      break;
    case 'train_shed':
      add(scene.add.rectangle(0, -170, 420, 10, 0x4a4650));
      for (let i = -4; i <= 4; i++) add(scene.add.rectangle(i * 50, -120, 6, 100, 0x4a4650, 0.8));
      add(scene.add.rectangle(0, -60, 420, 4, 0x4a4650, 0.5));
      label('PLATFORMS  1 — 4', '#f2e6cc', 13);
      break;
    case 'shed_clock':
      add(scene.add.rectangle(0, -170, 420, 10, 0x4a4650));
      for (let i = -4; i <= 4; i++) add(scene.add.rectangle(i * 50, -120, 6, 100, 0x4a4650, 0.8));
      add(scene.add.circle(0, -120, 22, 0xf2e6cc));
      add(scene.add.rectangle(0, -128, 2, 14, 0x2a2230));
      label('PLATFORMS  5 — 8', '#f2e6cc', 13);
      break;
    case 'no_passengers':
      add(scene.add.rectangle(0, -100, 140, 220, 0x1e2a22, 0.9));
      for (let i = 0; i < 40; i++) add(scene.add.rectangle(-50 + (i % 10) * 11, -190 + Math.floor(i / 10) * 30, 1, 10, 0xd8cbb0, 0.5));
      break;
    case 'station_sign':
      add(scene.add.rectangle(0, -70, 380, 52, 0x2e3a52));
      add(scene.add.rectangle(0, -70, 372, 44, 0x1e2a3c).setStrokeStyle(2, 0xc4a25c));
      label('CROSSROADS  STATION', '#f2e6cc', 18);
      for (let i = -8; i <= 8; i++) add(scene.add.circle(i * 22, -96, 3, 0xf2d580, 0.9));
      break;
    case 'folding_chair':
      add(scene.add.rectangle(0, 0, 40, 6, 0x8a8494));
      add(scene.add.rectangle(-16, -20, 6, 40, 0x8a8494));
      break;
    default:
      add(scene.add.circle(0, -40, 30, 0x6a6478, 0.35));
  }
  return c;
}

// the world row a room's floor sits on, so backdrops can be hung off the
// horizon rather than smeared over the viewport
function horizonOf(room) {
  const g = room.grid;
  const solidFrac = (y) => {
    let n = 0;
    for (const ch of g[y]) if (isSolidChar(ch)) n++;
    return n / Math.max(1, g[y].length);
  };
  // walk up from the bottom through the floor mass: the horizon is the top of
  // it. (Scanning downwards instead finds a room's *ceiling*.)
  let y = g.length - 1;
  while (y > 0 && solidFrac(y) > 0.5) y--;
  if (y < g.length - 1) return (y + 1) * 32;
  // no floor mass at the bottom (a vertical shaft): use the lowest solid row
  for (let i = g.length - 1; i >= 0; i--) if (solidFrac(i) > 0.5) return i * 32;
  return g.length * 32;
}

export default class Parallax {
  constructor(scene, rooms) {
    this.scene = scene;
    this.rooms = rooms;
    const cam = scene.cameras.main;
    this.camW = cam.width;
    this.camH = cam.height;
    // Screen-space layers shrink with the camera zoom, so at the vista zoom
    // (0.62) a viewport-sized band would leave bare canvas at the edges.
    // Everything is drawn wider and centred, and covers down to zoom 0.55.
    this.spanW = Math.ceil(this.camW / 0.55);
    this.spanX = -(this.spanW - this.camW) / 2;
    for (const room of rooms) room._horizon = horizonOf(room);

    // Two of everything: a room change crossfades instead of popping.
    const sky = () =>
      scene.add
        .image(this.spanX, -this.camH, ensureSkyTexture(scene, 'city'))
        .setOrigin(0)
        .setDisplaySize(this.spanW, this.camH * 3)
        .setScrollFactor(0)
        .setDepth(D.SKY);
    this.sky = [sky(), sky().setAlpha(0)];

    const slot = (depth) => {
      const mk = () =>
        scene.add
          .tileSprite(this.spanX, 0, this.spanW, 200, ensureLayerTexture(scene, 'city'))
          .setOrigin(0, 1)
          // x is screen-space (tilePositionX does the parallax); y tracks the
          // world 1:1 so a layer standing on the ground stays on the ground
          .setScrollFactor(0, 1)
          .setDepth(depth);
      return { pair: [mk(), mk().setAlpha(0)], i: 0, name: null, haze: 1 };
    };
    this.far = slot(D.BG_FAR);
    this.far.haze = HAZE.far;
    this.mid = slot(D.BG_MID);
    this.mid.haze = HAZE.mid;
    this.near = slot(D.BG_NEAR);
    this.near.haze = HAZE.near;
    this.slots = [
      ['far', this.far, F.far],
      ['mid', this.mid, F.mid],
      ['near', this.near, F.near],
    ];

    this.scenery = null;
    this.landmark = null;
    this.current = null;
  }

  applyTexture(sprite, name, slotName) {
    let [kind] = layerDef(name);
    if (kind === 'wall' && slotName !== 'far') kind = 'facade';
    sprite.setTexture(ensureLayerTexture(this.scene, name, kind));
    sprite.kind = kind;
    // A wall is hung from the same ground line as everything else, just tall
    // enough to cover the view from well below it to several screens above.
    sprite.setOrigin(0, 1);
    if (kind === 'wall') sprite.setSize(this.spanW, this.camH * 5);
    else sprite.setSize(this.spanW, KIND_H[kind]);
    sprite.wallBand = kind === 'wall';
    return sprite;
  }

  fadeSlot(slot, name, ms, slotName) {
    if (!name || name === slot.name) return;
    slot.name = name;
    const incoming = slot.pair[1 - slot.i];
    const outgoing = slot.pair[slot.i];
    this.applyTexture(incoming, name, slotName);
    slot.i = 1 - slot.i;
    if (ms <= 0) {
      incoming.setAlpha(slot.haze);
      outgoing.setAlpha(0);
      return;
    }
    this.scene.tweens.add({ targets: incoming, alpha: slot.haze, duration: ms });
    this.scene.tweens.add({ targets: outgoing, alpha: 0, duration: ms });
  }

  // the cast of background objects for one room, laid out along its width
  buildScenery(room) {
    const bg = room.bg || {};
    const kinds = SCENERY[bg.far] || SCENERY[bg.mid] || SCENERY.city;
    const [, main, accent] = layerDef(bg.mid || bg.far || 'city');
    const rand = new Phaser.Math.RandomDataGenerator([room.id || String(room._x0)]);
    const f = F.scenery;
    const cont = this.scene.add.container(0, 0).setScrollFactor(f, 1).setDepth(D.BG_SCENERY).setAlpha(0);

    // Outdoors the cast is rooftop furniture, so it stands above the street
    // facade instead of hiding behind it.
    const midKind = layerDef(bg.mid || 'brick')[0];
    const lift = layerDef(bg.far || 'city')[0] === 'skyline' || midKind === 'wall' ? 122 : 0;
    cont.lift = lift;

    const x0 = room._x0 * 32;
    const x1 = x0 + Math.max(...room.grid.map((g) => g.length)) * 32;
    let wx = x0 + rand.between(40, 220);
    let n = 0;
    while (wx < x1 && n < 14) {
      const kind = kinds[rand.between(0, kinds.length - 1)];
      const depth = rand.frac(); // 0 = further back and paler, 1 = nearer
      const g = this.scene.add.graphics();
      drawPrimitives(g, PROPS[kind]({ main, accent }));
      // placed in layer space, so the prop sits over its world position
      g.x = (this.camW / 2) * (1 - f) + wx * f;
      g.y = -rand.between(0, 10);
      g.setScale(0.75 + depth * 0.45).setAlpha(0.55 + depth * 0.4);
      cont.add(g);
      wx += rand.between(168, 330);
      n++;
    }
    return cont;
  }

  // called whenever the player's room changes
  setRoom(room) {
    if (!room || room === this.current) return;
    const first = this.current === null;
    const ms = first ? 0 : 550;
    this.current = room;
    const bg = room.bg || {};

    if (bg.far && bg.far !== this._skyName) {
      this._skyName = bg.far;
      const inc = this.sky[1 - (this._skyI || 0)];
      const out = this.sky[this._skyI || 0];
      inc.setTexture(ensureSkyTexture(this.scene, bg.far)).setDisplaySize(this.spanW, this.camH * 3);
      this._skyI = 1 - (this._skyI || 0);
      if (ms <= 0) {
        inc.setAlpha(1);
        out.setAlpha(0);
      } else {
        this.scene.tweens.add({ targets: inc, alpha: 1, duration: ms });
        this.scene.tweens.add({ targets: out, alpha: 0, duration: ms });
      }
    }
    this.fadeSlot(this.far, bg.far, ms, 'far');
    this.fadeSlot(this.mid, bg.mid, ms, 'mid');
    this.fadeSlot(this.near, bg.near, ms, 'near');

    const retire = (obj) => {
      if (!obj) return;
      if (ms <= 0) return obj.destroy();
      this.scene.tweens.add({ targets: obj, alpha: 0, duration: ms, onComplete: () => obj.destroy() });
    };
    retire(this.scenery);
    retire(this.landmark);

    this.scenery = this.buildScenery(room);
    this.scene.tweens.add({ targets: this.scenery, alpha: HAZE.scenery, duration: ms || 1 });

    if (bg.landmark) {
      this.landmark = drawLandmark(this.scene, bg.landmark).setScrollFactor(F.mid, 1).setDepth(D.BG_LANDMARK).setAlpha(0);
      const centre = (room._x0 + Math.max(...room.grid.map((g) => g.length)) / 2) * 32;
      this.landmark.x = (this.camW / 2) * (1 - F.mid) + centre * F.mid;
      this.scene.tweens.add({ targets: this.landmark, alpha: HAZE.mid, duration: ms || 1 });
    } else {
      this.landmark = null;
    }
  }

  update() {
    const cam = this.scene.cameras.main;
    // Depth is a HORIZONTAL cue only. Everything back here stands on the same
    // ground Jo does, so the layers are pinned to the world's horizon and move
    // with the terrain exactly -- give them a vertical parallax factor instead
    // and every jump pans the camera and slides the buildings out of the
    // ground. Being world-anchored also means no one-frame lag against the
    // camera, so nothing shimmers on landing.
    const horizon = this.current ? this.current._horizon : cam.scrollY + this.camH * 0.66;

    for (const [, slot, f] of this.slots) {
      for (const s of slot.pair) {
        s.y = s.wallBand ? horizon + this.camH : horizon;
        s.tilePositionX = cam.scrollX * f;
      }
    }

    if (this.scenery) this.scenery.y = horizon - this.scenery.lift;
    if (this.landmark) this.landmark.y = horizon - 18;
  }
}
