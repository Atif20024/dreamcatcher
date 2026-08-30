import Phaser from 'phaser';

// D7 — three parallax layers (0.2 / 0.5 / 0.8) plus a foreground at 1.2 and a
// landmark sprite per room. Layer art is generated procedurally into tileable
// textures so the game still ships with no binary assets.
const W = 256;
const H = 256;

const GENERATORS = {
  // distant silhouettes: buildings, trusses, a crowd
  silhouette(g, rand, c) {
    for (let x = 0; x < W; ) {
      const bw = rand.between(28, 64);
      const bh = rand.between(70, 190);
      g.fillStyle(c.main, 1);
      g.fillRect(x, H - bh, bw, bh);
      g.fillStyle(c.accent, 0.8);
      for (let wy = H - bh + 12; wy < H - 14; wy += 20) {
        for (let wx = x + 6; wx < x + bw - 8; wx += 16) {
          if (rand.frac() < 0.4) g.fillRect(wx, wy, 5, 7);
        }
      }
      x += bw + rand.between(4, 16);
    }
  },
  // flat wall with courses / panels
  wall(g, rand, c) {
    g.fillStyle(c.main, 1);
    g.fillRect(0, 0, W, H);
    g.lineStyle(2, c.accent, 0.5);
    for (let y = 0; y < H; y += 22) {
      g.lineBetween(0, y, W, y);
      const off = (y / 22) % 2 ? 0 : 24;
      for (let x = off; x < W; x += 48) g.lineBetween(x, y, x, y + 22);
    }
  },
  // hanging or stacked clutter
  clutter(g, rand, c) {
    for (let i = 0; i < 14; i++) {
      const x = rand.between(8, W - 24);
      const y = rand.between(10, H - 40);
      const s = rand.between(12, 26);
      g.fillStyle(c.main, 1);
      g.fillRect(x, y, s, s);
      g.fillStyle(c.accent, 1);
      g.fillRect(x + 3, y + 3, s - 6, 4);
    }
  },
  // soft glow bands: dawn, water, a lit dining room
  glow(g, rand, c) {
    for (let i = 0; i < 8; i++) {
      g.fillStyle(i % 2 ? c.main : c.accent, 0.25);
      g.fillRect(0, (i * H) / 8, W, H / 8);
    }
    g.fillStyle(c.accent, 0.35);
    g.fillCircle(W * 0.6, H * 0.7, 46);
  },
  // vertical or horizontal runs: fences, cables, pipes, railings
  lines(g, rand, c) {
    g.lineStyle(3, c.main, 0.85);
    for (let x = 0; x < W; x += 26) g.lineBetween(x, 0, x + 10, H);
    g.lineStyle(2, c.accent, 0.6);
    for (let y = 20; y < H; y += 54) g.lineBetween(0, y, W, y - 8);
  },
};

// layer name -> [generator, main, accent]
const LAYERS = {
  city: ['silhouette', 0x232342, 0xf2d590],
  rain_city: ['silhouette', 0x1c1c34, 0x8aa0c8],
  cold_city: ['silhouette', 0x1e2434, 0xd8a850],
  crowd: ['silhouette', 0x14090c, 0x2a1a24],
  truss: ['lines', 0x3a3a46, 0x6a6a7a],
  street: ['silhouette', 0x2a2038, 0xd8a850],
  theatre: ['silhouette', 0x3a1420, 0xf2d580],
  pavilion: ['silhouette', 0x2e3a2a, 0xf2c078],
  brick: ['wall', 0x3a2c28, 0x241a16],
  kitchen_wall: ['wall', 0x4a4550, 0x37323c],
  brown_wall: ['wall', 0x3a2a1e, 0x2a1e16],
  foam: ['wall', 0x4a5258, 0x3a4248],
  club_wall: ['wall', 0x3a2030, 0x2a1626],
  shelving: ['clutter', 0x5a6a72, 0x9ac4dc],
  frost: ['wall', 0x3a4a56, 0x5a7a8c],
  pans: ['clutter', 0x3e3a44, 0xb87333],
  bowls: ['clutter', 0x6a5a4a, 0xd8c8a0],
  sugar: ['glow', 0xd8c0d0, 0xf0e8f8],
  crates: ['clutter', 0x6a4a32, 0x8a6844],
  flightcases: ['clutter', 0x2a2a32, 0x4a4a56],
  dining_room: ['glow', 0x3a2a30, 0xf2d580],
  chandeliers: ['clutter', 0x4a3a30, 0xf2e0a0],
  chandelier: ['clutter', 0x6a5a70, 0xf0e8f8],
  dawn: ['glow', 0x8a5a52, 0xf2c078],
  river: ['glow', 0x2a3a4a, 0x88b8d8],
  herb_beds: ['clutter', 0x3a4a32, 0x6a8a52],
  fence: ['lines', 0x4a4a54, 0x6a6a74],
  fire_escape: ['lines', 0x2a2a32, 0x4a4a56],
  railings: ['lines', 0x3a3a44, 0x5a5a68],
  cables: ['lines', 0x1a1a20, 0x3a3a46],
  pipes: ['lines', 0x4a3a2a, 0x6a5a3a],
  carcasses: ['clutter', 0x6a4a4a, 0x8a5a5a],
  cooks: ['silhouette', 0x2a2a34, 0x4a4a58],
  posters: ['clutter', 0x5a4a3a, 0xd8c8a0],
  bar_rail: ['lines', 0x3a2a20, 0x6a4a32],
  subway_mouth: ['wall', 0x2a303a, 0x1a2028],
  booth_glass: ['wall', 0x3a4a52, 0x5a7a86],
  mic_stands: ['lines', 0x2a2a32, 0x4a4a56],
  beehive: ['clutter', 0x6a5a30, 0xd8b858],
  banner: ['clutter', 0x4a2a3a, 0x8a4a5a],
  loading_dock: ['clutter', 0x4a4450, 0x6a6478],
};

function ensureLayerTexture(scene, name) {
  const key = `bg_${name}`;
  if (scene.textures.exists(key)) return key;
  const [gen, main, accent] = LAYERS[name] || LAYERS.city;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const rand = new Phaser.Math.RandomDataGenerator([name]);
  GENERATORS[gen](g, rand, { main, accent });
  g.generateTexture(key, W, H);
  g.destroy();
  return key;
}

// Landmarks are single readable shapes so each room is recognisable.
function drawLandmark(scene, name, x, y) {
  const c = scene.add.container(x, y).setDepth(3).setScrollFactor(0.5);
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
    case 'folding_chair':
      add(scene.add.rectangle(0, 0, 40, 6, 0x8a8494));
      add(scene.add.rectangle(-16, -20, 6, 40, 0x8a8494));
      break;
    default:
      add(scene.add.circle(0, -40, 30, 0x6a6478, 0.35));
  }
  return c;
}

export default class Parallax {
  constructor(scene, rooms) {
    this.scene = scene;
    this.rooms = rooms;
    const cam = scene.cameras.main;

    // depth stays behind the play layer (terrain is depth 4) and each layer is
    // progressively fainter so the playfield always reads first
    this.far = scene.add.tileSprite(0, 0, cam.width, cam.height, ensureLayerTexture(scene, 'city')).setOrigin(0).setScrollFactor(0).setDepth(0).setAlpha(0.6);
    this.mid = scene.add.tileSprite(0, 0, cam.width, cam.height, ensureLayerTexture(scene, 'brick')).setOrigin(0).setScrollFactor(0).setDepth(1).setAlpha(0.3);
    this.near = scene.add.tileSprite(0, 0, cam.width, cam.height, ensureLayerTexture(scene, 'crates')).setOrigin(0).setScrollFactor(0).setDepth(2).setAlpha(0.18);
    this.fore = scene.add.tileSprite(0, 0, cam.width, cam.height, ensureLayerTexture(scene, 'cables')).setOrigin(0).setScrollFactor(0).setDepth(70).setAlpha(0.12);

    // a scrim keeps the background from competing with the tiles
    this.tint = scene.add.rectangle(0, 0, cam.width, cam.height, 0x0a0a14, 0.34).setOrigin(0).setScrollFactor(0).setDepth(2.5);
    this.landmark = null;
    this.current = null;
  }

  // called whenever the player's room changes
  setRoom(room) {
    if (!room || room === this.current) return;
    this.current = room;
    const bg = room.bg || {};
    if (bg.far) this.far.setTexture(ensureLayerTexture(this.scene, bg.far));
    if (bg.mid) this.mid.setTexture(ensureLayerTexture(this.scene, bg.mid));
    if (bg.near) this.near.setTexture(ensureLayerTexture(this.scene, bg.near));
    if (this.landmark) this.landmark.destroy();
    this.landmark = bg.landmark
      ? drawLandmark(this.scene, bg.landmark, this.scene.cameras.main.width * 0.62, this.scene.cameras.main.height * 0.55)
      : null;
  }

  update() {
    const cam = this.scene.cameras.main;
    this.far.tilePositionX = cam.scrollX * 0.2;
    this.mid.tilePositionX = cam.scrollX * 0.5;
    this.near.tilePositionX = cam.scrollX * 0.8;
    this.fore.tilePositionX = cam.scrollX * 1.2;
    this.far.tilePositionY = cam.scrollY * 0.2;
    this.mid.tilePositionY = cam.scrollY * 0.5;
    this.near.tilePositionY = cam.scrollY * 0.8;
  }
}
