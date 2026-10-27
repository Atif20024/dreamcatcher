import Phaser from 'phaser';
import { D } from '../../builders/depths.js';
import { DIALOGUES, MOMENTS, LETTERS, VIOLET } from '../../data/painter/cast.js';
import { SUBJECTS } from '../../data/painter/subjects.js';
import { PIGMENTS, tintFor } from '../../systems/paint.js';
import { sfx } from '../../systems/audio.js';
import { showTutorial } from '../../systems/tutorial.js';
import { recordMoment } from '../../utils/save.js';
import { T, px, overlaps, hex } from './util.js';

// THE YELLOW HOUSE — the world: everything rooms.js places, built. Mixed into
// PainterScene.prototype.
export default {
  // the sky: two painted stroke fields that scroll against each other
  buildSky() {
    const cam = this.cameras.main;
    const W = Math.ceil(cam.width / 0.55);
    const H = Math.ceil(cam.height / 0.55);
    this.skyFar = this.add.tileSprite(cam.width / 2, cam.height / 2, W, H, 'pt-sky-day').setScrollFactor(0).setDepth(D.SKY + 1).setAlpha(0.45);
    this.skyNear = this.add.tileSprite(cam.width / 2, cam.height / 2, W, H, 'pt-sky-day').setScrollFactor(0).setDepth(D.SKY + 2).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD);
    this.halos = [];
  },

  halo(x, y, colour, scale = 1, depth = 7) {
    const h = this.add.image(x, y, `pt-halo-${colour}`).setDepth(depth).setScale(scale).setAlpha(0.85).setBlendMode(Phaser.BlendModes.ADD);
    this.halos.push(h);
    return h;
  },

  buildWorld() {
    const B = this.built.objects;
    for (const o of B) {
      const floor = (o.ty + 1) * T;
      switch (o.type) {
        case 'prop':
          this.buildProp(o, floor);
          break;
        case 'pickup':
          this.buildTube(o, floor);
          break;
        case 'letter':
          this.buildLetter(o, floor);
          break;
        case 'surface':
          this.buildSurface(o);
          break;
        case 'subject':
          this.buildSubject(o);
          break;
        case 'easel':
          this.buildEasel(o, floor);
          break;
        case 'panel':
          this.buildPanel(o, floor);
          break;
        case 'npc':
          this.buildNpc(o, floor);
          break;
        case 'dialogue':
          (this.dialogueZones ||= []).push({ ...o, done: false });
          break;
        case 'dark': {
          const w = (o.x1 - o.x + 1) * T;
          const rect = this.add.rectangle(o.tx * T + w / 2, o.ty * T + (o.h * T) / 2, w, o.h * T, 0x1e1a22, 0.88).setDepth(14);
          this.darks[o.id] = { ...o, rect, lit: false };
          break;
        }
        case 'zone':
          (this.zones ||= {})[o.id] = new Phaser.Geom.Rectangle(o.tx * T, o.ty * T, (o.x1 - o.x + 1) * T, o.h * T);
          break;
        case 'shutter':
          this.buildShutter(o);
          break;
        case 'bell':
          this.bell = { ...o, img: this.add.image(o.wx + 16, o.ty * T - 10, 'pt-bell').setOrigin(0.5, 1).setDepth(9), rangAt: 0 };
          break;
        case 'current':
          this.buildCurrent(o);
          break;
        case 'star':
          this.buildStar(o);
          break;
        case 'moon':
          this.buildMoon(o);
          break;
        case 'bud':
          this.buildBud(o, floor);
          break;
        case 'bridge':
          this.bridgeTiles = [];
          for (let tx = o.tx; tx <= o.x1 + this.roomOf(o)._x0; tx++) for (let ty = o.ty; ty < o.ty + o.h; ty++) {
            const img = this.tileImgs.get(`${tx},${ty}`);
            if (img) this.bridgeTiles.push(img);
          }
          break;
        case 'iris':
          this.iris = { ...o, img: this.add.image(o.wx, floor, 'pt-iris').setOrigin(0.5, 1).setDepth(9), sat: 0 };
          this.halo(o.wx, floor - 14, 'violet', 0.35, 8);
          break;
        case 'fountain':
          this.add.image(o.wx, floor + 10, 'pt-fountain').setOrigin(0.5, 1).setDepth(6);
          break;
        case 'arches':
          this.buildArches(o);
          break;
        case 'poppies': {
          const img = this.add.image(o.wx, floor, 'pt-poppies').setOrigin(0.5, 1).setDepth(9).setTint(0x8a8a94);
          this.addInteract(o.wx, floor - 10, 'the poppies — red', () => {
            img.clearTint();
            this.colourBack('red', 'the poppies on the wall');
          }, { when: () => this.F.d6 && !this.F.red_back });
          break;
        }
        case 'cart': {
          const img = this.add.image(o.wx, floor, 'pt-cart').setOrigin(0.5, 1).setDepth(9);
          this.props.cart = img;
          this.addInteract(o.wx, floor - 16, () => `the cart to the city (${this.canvases.length} canvases)`, () => this.takeCart(), {
            when: () => !this.F.cart && (this.canvases.length >= 8 || this.day >= 10),
          });
          break;
        }
        case 'stack':
          this.buildStack(o, floor);
          break;
        case 'frame':
          this.frame = { ...o, img: this.add.rectangle(o.wx, o.wy, 56, 44, 0x6b4e2e).setStrokeStyle(3, 0xd8a840).setDepth(8).setAngle(-2) };
          break;
        case 'moment':
          this.moment(o.id, o.wx, o.wy);
          break;
        default:
          break;
      }
    }
    // the drawbridge: its rope is a surface; the tiles fall when it burns
    this.buildPaulBeats();
  },

  buildProp(o, floor) {
    const key = `pt-${o.kind}`;
    if (!this.textures.exists(key)) return;
    const img = this.add.image(o.wx, floor, key).setOrigin(0.5, 1).setDepth(o.kind === 'bed' || o.kind === 'table' || o.kind === 'house_front' || o.kind === 'cafe_front' || o.kind === 'train' ? 6 : 9);
    img.setAngle((Math.random() - 0.5) * 3);
    if (o.id) this.props[o.id] = img;
    if (o.kind === 'planks') img.setVisible(false);
    if (o.kind === 'lamp') {
      this.halo(o.wx, floor - 40, o.halo || 'yellow', 0.9, 8);
      this.add.image(o.wx, floor - 40, 'pt-glow').setDepth(7).setScale(2.4).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    }
    if (o.kind === 'stove_north') {
      this.halo(o.wx, floor - 20, 'orange', 0.5, 8);
    }
    if (o.kind === 'dead_sunflower') img.setAngle(o.n % 2 ? 40 : -35);
    if (o.kind === 'cypress_tall') img.setVisible(false); // the trunk is the ladder; the tree is painted by the parallax landmark
    if (o.kind === 'train') {
      this.props.train = img;
      // Paul is on it; it leaves when Jo arrives at the platform
      this.paulOnTrain = this.add.image(o.wx + 20, floor - 20, 'pt-p-paul').setOrigin(0.5, 1).setDepth(7).setScale(0.8);
    }
    const sh = this.add.image(o.wx, floor - 1, 'pt-shadow').setDepth(5).setAlpha(0.6).setScale(img.displayWidth / 64 + 0.3, 1);
    sh.ownerX = o.wx;
    (this.shadows ||= []).push(sh);
  },

  buildTube(o, floor) {
    const img = this.add.image(o.wx, o.wy, `pt-tube-${o.colour}`).setDepth(20);
    this.tweens.add({ targets: img, y: o.wy - 4, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
    const tube = { ...o, img, taken: false };
    (this.tubes ||= []).push(tube);
    this.addInteract(o.wx, o.wy, () => (o.shop ? `take the ${o.colour} (it is not yours)` : `take: ${o.colour}`), () => {
      tube.taken = true;
      img.destroy();
      this.takeTube(o.colour, { from: o.shop ? 'the shop window' : o.hour ? 'the light, now' : null });
      if (o.shop) this.provokeShopkeeper();
    }, { once: true, when: () => !tube.taken && (!o.hour || this.clock.within(o.hour)) && !this.F.in_wind_section });
    void floor;
  },

  // Isak's letters: readable, with money and pigment inside
  buildLetter(o, floor) {
    const img = this.add.image(o.wx, floor - 8, 'pt-letter').setDepth(20);
    this.tweens.add({ targets: img, y: img.y - 3, duration: 1100, yoyo: true, repeat: -1, ease: 'sine.inout' });
    const letter = { ...o, img, read: false };
    this.addInteract(o.wx, floor - 12, 'a letter from the north', async () => {
      letter.read = true;
      img.destroy();
      await this.showLetter(o.id);
      for (const c of o.tubes) this.takeTube(c, { from: 'Isak' });
      this.setFlag(o.id);
      if (o.id === 'letter1') this.setObjective('blue fills the channel. upstairs, the bedroom.');
    }, { when: () => !letter.read });
  },

  // §5.9 — a letter, in his hand: blue ink, a slant, a jitter
  showLetter(id) {
    return new Promise((resolve) => {
      const cam = this.cameras.main;
      this.puzzleActive = true;
      this.physics.pause();
      const lines = LETTERS[id] || ['—'];
      const objs = [];
      objs.push(this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.55).setScrollFactor(0).setDepth(300));
      objs.push(this.add.rectangle(cam.width / 2, cam.height / 2, 560, 60 + lines.length * 26, 0xf2ece0, 0.98).setScrollFactor(0).setDepth(301).setStrokeStyle(2, 0x1f3a5f).setAngle(-1.5));
      lines.forEach((l, i) => {
        const t = this.add.text(cam.width / 2 - 250, cam.height / 2 - (lines.length * 26) / 2 + i * 26, l, { fontFamily: 'monospace', fontSize: '14px', color: '#1f3a5f', fontStyle: 'italic' }).setScrollFactor(0).setDepth(302).setAngle(-1.5);
        this.tweens.add({ targets: t, y: t.y + 1, duration: 300 + i * 40, yoyo: true, repeat: -1 });
        objs.push(t);
      });
      objs.push(this.add.text(cam.width / 2, cam.height / 2 + (lines.length * 26) / 2 + 36, '[any key]', { fontFamily: 'monospace', fontSize: '11px', color: '#8a8478' }).setOrigin(0.5).setScrollFactor(0).setDepth(302));
      sfx('clack');
      const close = () => {
        this.input.keyboard.off('keydown', close);
        objs.forEach((o) => o.destroy());
        this.puzzleActive = false;
        if (!this.cardActive && !this.dialogActive) this.physics.resume();
        resolve();
      };
      this.time.delayedCall(300, () => this.input.keyboard.on('keydown', close));
    });
  },

  // §3.2 — a paintable rectangle of the world
  buildSurface(o) {
    const room = this.roomOf(o);
    const x1 = o.x1 + room._x0;
    const s = { ...o, x1, colour: null };
    this.surfaces[o.id] = s;
    const cx = ((o.tx + x1) / 2) * T + T / 2;
    // the prompt sits where Jo stands to paint it: on the ground under the
    // rectangle (a pit's prompt is at its lip)
    const iy = o.fills ? o.ty * T - 22 : this.groundY(cx, (o.ty + o.h) * T) - 22;
    s.ix = cx;
    s.iy = iy;
    this.addInteract(cx, iy, () => `paint ${o.label} — ${this.palette.brush()}`, () => this.paintSurface(s, this.palette.brush()), {
      once: false,
      radius: Math.max(96, ((x1 - o.tx + 1) * T) / 2 + 48),
      when: () => {
        const b = this.palette.brush();
        if (!b || this.F.in_wind_section) return false;
        if (b !== 'white' && !o.accepts.includes(b)) return false;
        if (b === 'white' && !s.colour) return false;
        if (o.hour && !this.clock.within(o.hour)) return false;
        if (o.needs && this.carry !== o.needs) return false;
        if (s.colour === b) return false;
        if (o.id === 'bed_walls2' && !this.F.inside_house) return false;
        return true;
      },
    });
  },

  paintSurface(s, colour, { free = false } = {}) {
    if (!colour) return;
    if (!free) {
      this.palette.spend(1);
      this.clock.stroke(1);
    }
    const prev = s.colour;
    s.colour = colour === 'white' ? null : colour;
    this.paintRect(s.tx, s.x1, s.ty, s.h, s.colour, { bg: !!s.bg, id: s.id });
    if (s.prop && this.props[s.prop]) {
      if (s.colour) this.props[s.prop].setTint(tintFor(s.colour));
      else this.props[s.prop].clearTint();
    }
    sfx('squish');
    if (colour !== 'violet') this.slamShuttersNear(s.ix, s.iy);
    this.floatText(s.ix, s.iy - 30, s.colour ? `${s.label}: ${s.colour}.` : `${s.label}: primed back.`, s.colour ? hex(PIGMENTS[s.colour].hex) : '#e8e4d8');
    this.onSurfacePainted(s, s.colour, prev);
    this.updateHud();
  },

  // the effects table (§3.2): what a colour does to a thing
  onSurfacePainted(s, colour, prev) {
    if (s.lights) {
      const z = this.darks[s.lights];
      if (z) {
        z.lit = colour === 'yellow';
        this.tweens.add({ targets: z.rect, alpha: z.lit ? 0 : 0.88, duration: 700 });
        if (z.lit && s.id === 'bed_walls2') this.roomLit();
        if (z.lit && s.id === 'frontwall' && !this.F.front_lit) {
          this.setFlag('front_lit');
          this.setObjective('a letter on the mat.');
        }
      }
    }
    if (s.fills) this.fillSurface(s, colour === 'blue');
    if (s.vine) this.growVine(s, colour === 'green');
    if (s.id === 'rope' && colour === 'red') this.dropBridge();
    if (s.hazardWhen) this.stoveLit(s, colour === s.hazardWhen);
    if (s.id === 'sunwall' && colour === 'yellow' && !this.F.door_lit) {
      this.setFlag('door_lit');
      const door = this.add.rectangle(px(36), px(31) + 8, 30, 64, 0x6b4e2e).setDepth(-9.6).setStrokeStyle(2, 0x1f3a5f);
      door.setAlpha(0);
      this.tweens.add({ targets: door, alpha: 1, duration: 900 });
      this.floatText(px(36), px(29), 'a door that was a shadow.', '#f2e0a0');
      this.setObjective('the yellow house. two streets.');
    }
    if (s.id === 'chair' && colour === 'yellow') this.setFlag('chair_yellow');
    if (s.id === 'skylight' && colour === 'blue' && !this.F.skylight) {
      this.setFlag('skylight');
      for (let i = 0; i < 6; i++) {
        const st = this.add.image(px(54 + i * 0.7), px(11) - i * 7, 'pt-star').setDepth(-9.4).setScale(0.3).setAlpha(0);
        this.tweens.add({ targets: st, alpha: 0.9, duration: 1200, delay: i * 150 });
      }
      this.floatText(px(56), px(12), 'the first stars, through the crack.', '#e8e4d8');
    }
    if (s.id === 'basin' && colour === 'blue') {
      this.dropCarry();
      this.colourBack('blue', 'the fountain');
    }
    if (s.id === 'terrace' || s.id === 'sky') this.checkTerrace();
    if (s.id === 'endwall' && colour === 'yellow' && !this.F.yellow_back) this.colourBack('yellow', 'the light on the end wall');
    void prev;
  },

  // blue fills a channel: water, and a board you can cross on
  fillSurface(s, on) {
    if (s.water) {
      s.water.forEach((w) => w.destroy());
      s.boards.forEach((b) => b.destroy());
      s.water = null;
    }
    if (!on) return;
    s.water = [];
    s.boards = [];
    for (let tx = s.tx; tx <= s.x1; tx++) {
      for (let ty = s.ty; ty < s.ty + s.h; ty++) {
        const r = this.add.rectangle(px(tx), px(ty), T, T, 0x2e4a80, 0.85).setDepth(D.TERRAIN);
        s.water.push(r);
        if (ty === s.ty) {
          const top = this.add.rectangle(px(tx), ty * T + 3, T, 6, 0x88b8d8, 0.9).setDepth(D.LIQUID_TOP);
          s.water.push(top);
          // a board floats up to the floor's level: a solid plank, flush
          const b = this.add.image(px(tx), px(ty), `pt_s_15_${tx % 3}`).setDepth(D.TERRAIN + 0.5).setTint(0xc8a060).setAlpha(0.95);
          this.physics.add.existing(b, true);
          this.solids.add(b);
          s.boards.push(b);
        }
      }
    }
    if (s.id === 'lock') this.setFlag('lock_full');
    if (s.id === 'channel') this.setFlag('channel_full');
  },

  // green grows vines: a ladder up a bare wall
  growVine(s, on) {
    if (s.vines) {
      s.vines.forEach((v) => v.destroy());
      for (let ty = s.ty; ty < s.ty + s.h; ty++) if (this.ladderGrid[ty]) delete this.ladderGrid[ty][s.tx];
      s.vines = null;
    }
    if (!on) return;
    s.vines = [];
    for (let ty = s.ty; ty < s.ty + s.h; ty++) {
      const v = this.add.image(px(s.tx), px(ty), 'pt_ladder').setDepth(D.TERRAIN).setTint(0x6aa060).setAlpha(0);
      this.tweens.add({ targets: v, alpha: 1, duration: 300, delay: (s.ty + s.h - ty) * 120 });
      (this.ladderGrid[ty] ||= {})[s.tx] = true;
      s.vines.push(v);
    }
    this.setFlag('vine');
  },

  dropBridge(quiet = false) {
    if (this.F.bridge_down || !this.bridgeTiles) return;
    this.setFlag('bridge_down');
    if (!quiet) sfx('crack');
    this.bridgeTiles.forEach((t, i) => {
      if (t.body) t.body.enable = false;
      this.tweens.add({ targets: t, alpha: 0.12, x: t.x + 40, angle: 80, duration: quiet ? 1 : 700, delay: quiet ? 0 : i * 40, ease: 'quad.in' });
    });
    if (!quiet) this.floatText(px(200), px(26), 'the rope burns. the bridge comes down.', '#f2e0a0');
  },

  // red lights the stove; it is a hazard once lit, unless green sits beside it
  stoveLit(s, on) {
    if (!s.hazard) {
      const h = this.add.image(s.ix, (s.ty + s.h) * T - 22, 'pt-glow').setDepth(D.HAZARD).setScale(1.2, 0.9).setTint(0xe8762a).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
      this.physics.add.existing(h, true);
      h.body.setSize(28, 30).setOffset(18, 17);
      h.body.enable = false;
      h.lit = false;
      this.spikes.add(h);
      s.hazard = h;
      s.halo = this.halo(s.ix, h.y - 10, 'orange', 0.5, 8).setVisible(false);
    }
    s.hazard.lit = on;
    s.hazard.body.enable = on;
    s.halo.setVisible(on);
    this.tweens.add({ targets: s.hazard, alpha: on ? 0.8 : 0, duration: 400 });
    if (on) this.setFlag('stove_lit');
  },

  buildSubject(o) {
    const def = SUBJECTS.find((s) => s.id === o.id);
    if (!def) return;
    const y = o.wy - 44;
    const mark = this.add.text(o.wx, y, `✦ ${def.title}`, { fontFamily: 'monospace', fontSize: '11px', color: '#f2e0a0', backgroundColor: '#14101c' }).setOrigin(0.5).setDepth(21).setAlpha(0.85);
    this.tweens.add({ targets: mark, y: y - 5, duration: 1300, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.subjects[o.id] = { def, mark, done: false, x: o.wx, y: o.wy };
  },

  buildEasel(o, floor) {
    const img = this.add.image(o.wx, floor, 'pt-easel').setOrigin(0.5, 1).setDepth(8).setAngle((Math.random() - 0.5) * 6);
    const canvas = this.add.image(o.wx, floor - 20, 'pt-canvas_blank').setDepth(8.5).setAngle(img.angle);
    const easel = { ...o, img, canvas, floor };
    this.easels.push(easel);
    this.addInteract(o.wx, floor - 16, () => this.easelLabel(easel), () => this.useEasel(easel), { once: false, when: () => !o.still });
  },

  buildPanel(o, floor) {
    const p = { ...o, floor };
    (this.panels ||= {})[o.id] = p;
    const labels = { palette: 'the mixing board', hour: 'the sundial', vibrato: 'the tower door', chair: 'the same chair', tree: "Dr. Rey's question", star: 'which star' };
    if (o.puzzle === 'hour') this.add.image(o.wx, floor, 'pt-sundial').setOrigin(0.5, 1).setDepth(8);
    this.addInteract(o.wx, floor - 16, labels[o.puzzle], () => this.openPanel(p), { once: false, when: () => this.panelWhen(p) });
  },

  buildNpc(o, floor) {
    const who = o.who;
    const img = this.person(who, o.wx, floor, { flip: who !== 'clerk' && who !== 'isak', sit: !!o.sit });
    this.props[o.id || who] = img;
    if (who === 'clerk') this.addInteract(o.wx, floor - 20, 'the clerk', () => this.dialog.show(DIALOGUES.d0), { once: false });
    if (o.id === 'roulin') {
      this.addInteract(o.wx, floor - 20, () => (this.F.d1 ? 'paint him (blue is traditional)' : 'Roulin'), async () => {
        if (!this.F.d1) {
          await this.dialog.show(DIALOGUES.d1);
          this.setFlag('d1');
          await this.showLetter('letter2');
          this.takeTube('green', { from: 'Isak, mixed' });
          this.setObjective(this.F.bedroom_canvas ? 'the mixing board at the shop' : 'the bedroom upstairs, then the shop');
          return;
        }
        this.captureCanvas('roulin');
      }, { once: false, when: () => !this.F.roulin_canvas });
    }
    if (o.id === 'roulin_wind') {
      img.setFlipX(true);
      this.addInteract(o.wx, floor - 20, 'Roulin', async () => {
        await this.dialog.show(DIALOGUES.d5_yellow);
        this.F.in_wind_section = false;
        this.takeTube('yellow', { from: "Roulin's bag" });
        this.setFlag('roulin_yellow');
        this.setObjective('home. the square. carefully.');
      }, { when: () => !this.F.roulin_yellow });
    }
    if (o.id === 'ginoux') {
      this.addInteract(o.wx, floor - 20, 'Madame Ginoux', async () => {
        await this.dialog.show(DIALOGUES.d3);
        this.setFlag('d3');
        this.setObjective('the terrace, yellow. the sky, blue. the edge will sing.');
      }, { when: () => !this.F.d3 });
    }
    if (o.id === 'rey_office') {
      this.addInteract(o.wx, floor - 20, 'Dr. Rey — a letter came', async () => {
        await this.dialog.show(DIALOGUES.d7);
        this.setFlag('d7');
        this.colourBack('white', "Isak's letter");
      }, { when: () => this.F.d6 && !this.F.white_back });
    }
  },

  // night shutters: a window with a sleeper; it slams when Jo paints near
  buildShutter(o) {
    const img = this.add.image(o.wx, o.wy, 'pt-shutter').setDepth(7);
    const glow = this.add.image(o.wx, o.wy, 'pt-glow').setDepth(6).setScale(1.3).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);
    this.shutters.push({ ...o, img, glow, shut: false });
  },

  slamShuttersNear(x, y) {
    for (const sh of this.shutters) {
      if (sh.shut || Math.abs(sh.wx - x) > 170 || Math.abs(sh.wy - y) > 140) continue;
      sh.shut = true;
      sh.img.setTexture('pt-shutter_shut');
      sh.glow.setVisible(false);
      sfx('shutter');
      this.cameras.main.shake(120, 0.004);
      this.floatText(sh.wx, sh.wy - 30, 'SLAM', '#e86a6a');
      if (sh.dims) this.dimStar(sh.dims);
      for (const f of this.foes) if (f.kind === 'gendarme' && f.active && Math.abs(f.x - x) < 400) {
        f.distract(x);
        f.seenPlayerAt = this.time.now;
      }
      this.time.delayedCall(7000, () => {
        sh.shut = false;
        sh.img.setTexture('pt-shutter');
        sh.glow.setVisible(true);
      });
    }
  },

  // ---- the night sky: currents, stars, the moon ---------------------------------

  buildCurrent(o) {
    const room = this.roomOf(o);
    const pts = o.pts.map(([x, y]) => ({ x: (x + room._x0) * T + T / 2, y: y * T + T / 2 }));
    const cur = { ...o, pts, dabs: [], length: 0, segs: [] };
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      cur.segs.push({ a, b, len, start: cur.length });
      cur.length += len;
    }
    for (let d = 0; d < cur.length; d += 22) {
      const p = this.pointOnCurrent(cur, d);
      const img = this.add.image(p.x, p.y, 'pt-stroke-blue').setDepth(-9.3).setAlpha(0.55).setScale(0.8, 0.6).setAngle(Phaser.Math.RadToDeg(p.angle)).setBlendMode(Phaser.BlendModes.ADD);
      img.d0 = d;
      cur.dabs.push(img);
    }
    this.currents.push(cur);
  },

  pointOnCurrent(cur, d) {
    const dd = Phaser.Math.Clamp(d, 0, cur.length - 0.01);
    const s = cur.segs.find((g) => dd >= g.start && dd < g.start + g.len) || cur.segs[cur.segs.length - 1];
    const t = (dd - s.start) / s.len;
    return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t, angle: Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x) };
  },

  tryRide(time) {
    if (this.riding || time < this.rideLockUntil) return;
    const p = this.player;
    for (const cur of this.currents) {
      for (let d = 0; d < cur.length; d += 12) {
        const q = this.pointOnCurrent(cur, d);
        if (Math.abs(q.x - p.x) < 26 && Math.abs(q.y - p.y) < 26) {
          this.riding = { cur, d };
          p.body.setAllowGravity(false);
          sfx('hiss');
          if (!this.told.currents) {
            this.told.currents = true;
            this.showTutorialSafe('currents');
          }
          return;
        }
      }
    }
  },

  updateRiding(time, dt) {
    const p = this.player;
    const r = this.riding;
    const speed = r.cur.speed * this.currentSpeed;
    r.d += speed * dt;
    const q = this.pointOnCurrent(r.cur, r.d);
    p.setPosition(q.x, q.y);
    p.body.setVelocity(Math.cos(q.angle) * speed, Math.sin(q.angle) * speed);
    p.art.setTexture('jo-jump');
    p.setFlipX(Math.cos(q.angle) < 0);
    const jump = Phaser.Input.Keyboard.JustDown(p.keys.SPACE) || Phaser.Input.Keyboard.JustDown(p.keys.W) || Phaser.Input.Keyboard.JustDown(p.cursors.up);
    if (jump || r.d >= r.cur.length) {
      this.stopRiding();
      p.body.setVelocity(Math.cos(q.angle) * speed * 0.8, jump ? -540 : Math.sin(q.angle) * speed * 0.5);
      if (jump) sfx('jump');
    }
    for (const dab of r.cur.dabs) dab.setAlpha(0.55 + 0.4 * Math.sin(time / 120 + dab.d0 / 30));
    void time;
  },

  stopRiding() {
    if (!this.riding) return;
    this.riding = null;
    this.player.body.setAllowGravity(true);
    this.rideLockUntil = this.time.now + 500;
  },

  buildStar(o) {
    const img = this.add.image(o.wx, o.wy, 'pt-star').setDepth(7).setScale(1.6);
    const halo = this.halo(o.wx, o.wy, 'yellow', 1, 6);
    const thumb = this.add.image(o.wx, o.wy, 'pt-canvas-swatch').setDepth(7.5).setDisplaySize(36, 27).setAlpha(0).setAngle((Math.random() - 0.5) * 8);
    const plat = this.add.rectangle(o.wx, o.wy - 24, 44, 12, 0xffffff, 0).setDepth(7);
    this.physics.add.existing(plat, true);
    plat.body.checkCollision.down = false;
    plat.body.checkCollision.left = false;
    plat.body.checkCollision.right = false;
    this.oneWays.add(plat);
    this.stars.push({ ...o, img, halo, thumb, plat, dim: false });
  },

  refreshStars() {
    for (const s of this.stars) {
      const c = this.canvases[s.index];
      if (c) {
        s.thumb.setTexture(c.thumb).setDisplaySize(36, 27).setAlpha(0.9);
      }
    }
  },

  dimStar(id) {
    const s = this.stars.find((x) => x.id === id);
    if (!s || s.dim) return;
    s.dim = true;
    s.plat.body.enable = false;
    this.tweens.add({ targets: [s.img, s.halo, s.thumb], alpha: 0.15, duration: 400 });
    this.floatText(s.wx, s.wy - 40, 'a star goes out.', '#8a8478');
    this.time.delayedCall(8000, () => {
      s.dim = false;
      s.plat.body.enable = true;
      this.tweens.add({ targets: [s.img, s.halo], alpha: 1, duration: 900 });
      this.tweens.add({ targets: s.thumb, alpha: 0.9, duration: 900 });
    });
  },

  buildMoon(o) {
    const img = this.add.image(o.wx + 16, o.ty * T + 32, 'pt-moon').setOrigin(0.5, 1).setDepth(-9.8);
    this.tweens.add({ targets: img, angle: 4, duration: 9000, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.halo(o.wx + 16, o.ty * T + 10, 'yellow', 1.6, -9.9);
    for (let tx = 651; tx <= 660; tx++) for (let ty = 14; ty <= 17; ty++) {
      const t = this.tileImgs.get(`${tx},${ty}`);
      if (t) {
        t.keepTint = true;
        t.setTint(0xe8dca0);
      }
    }
  },

  // ---- the fields: sunflowers ------------------------------------------------------

  buildBud(o, floor) {
    const img = this.add.image(o.wx, floor + 32, 'pt-bud').setOrigin(0.5, 1).setDepth(9);
    const bud = { ...o, img, bloomed: false, plat: null, floor: floor + 32 };
    this.buds.push(bud);
    this.addInteract(o.wx, floor + 8, 'paint the bud — yellow', () => this.bloom(bud), { when: () => !bud.bloomed && this.palette.brush() === 'yellow' && !this.F.in_wind_section, radius: 60 });
  },

  bloom(bud) {
    bud.bloomed = true;
    this.palette.spend(1);
    this.clock.stroke(1);
    bud.img.setTexture('pt-bloom').setOrigin(0.5, 1);
    const top = bud.floor - bud.img.displayHeight + 8;
    const plat = this.add.rectangle(bud.wx, top, 36, 12, 0xffffff, 0).setDepth(9);
    this.physics.add.existing(plat, true);
    plat.body.checkCollision.down = false;
    plat.body.checkCollision.left = false;
    plat.body.checkCollision.right = false;
    this.oneWays.add(plat);
    bud.plat = plat;
    sfx('pop');
    this.floatText(bud.wx, top - 20, 'it blooms. it faces the sun.', '#f2e0a0');
    this.paintTile(Math.floor(bud.wx / T), Math.floor(top / T), 'yellow');
    this.updateHud();
  },

  updateBuds() {
    const dusk = this.clock.h >= 18 || this.clock.phase === 'night';
    const sh = this.clock.shadow();
    for (const b of this.buds) {
      if (!b.bloomed) continue;
      const want = dusk ? 38 : -sh.dir * 6;
      b.img.setAngle(Phaser.Math.Linear(b.img.angle, want, 0.05));
      if (b.plat.body.enable === !dusk) continue;
      b.plat.body.enable = !dusk;
      if (dusk) this.floatText(b.wx, b.plat.y - 20, 'the heads drop.', '#8a8478');
    }
  },

  // ---- the garden ----------------------------------------------------------------

  buildArches(o) {
    const room = this.roomOf(o);
    const x0 = o.tx * T;
    const x1 = (o.x1 + room._x0) * T + T;
    const spot = this.add.image(x0, o.ty * T, 'pt-glow').setDepth(8).setScale(2.2, 3).setAlpha(0).setTint(0xfff2a0).setBlendMode(Phaser.BlendModes.ADD);
    this.arches = { ...o, x0, x1, spot, progress: 0, out: 0, done: false };
  },

  buildStack(o, floor) {
    this.stack = { ...o, floor, imgs: [] };
    for (let i = 0; i < 9; i++) {
      const img = this.add.image(o.wx - 10 + i * 4, floor - (i % 3) * 2, 'pt-canvas_blank').setOrigin(0.5, 1).setDepth(6 + i * 0.01).setAngle(78 + (i % 4) * 2).setTint(0xb8a888);
      this.stack.imgs.push(img);
    }
  },

  // ---- small moments -------------------------------------------------------------

  moment(id, x, y) {
    const need = { m1: () => this.F.chair_yellow, m2: () => this.F.roulin_canvas, m3: () => this.F.terrace_canvas && this.F.paul, m4: () => this.F.colours_back };
    this.addInteract(x, y, 'pause', async () => {
      const m = MOMENTS[id];
      this.moments += 1;
      recordMoment('painter', id);
      this.setFlag(id);
      sfx('chime');
      this.player.controlLockUntil = this.time.now + 8000;
      this.player.body.setVelocity(0, 0);
      if (id === 'm4' && this.props.rey_office) {
        const rey = this.props.rey_office;
        this.walkPerson(rey, 'rey', x + 36, () => rey.setTexture('pt-p-rey-sit'));
      }
      // the light moves across the floor for eight seconds
      const beam = this.add.rectangle(x - 80, y + 10, 40, 60, 0xfff2a0, 0.18).setDepth(13).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: beam, x: x + 80, duration: 8000, onComplete: () => beam.destroy() });
      const cam = this.cameras.main;
      const t1 = this.add.text(cam.width / 2, cam.height - 150, m.sub, { fontFamily: 'monospace', fontSize: '14px', color: '#c8c0b0', align: 'center', wordWrap: { width: 700 } }).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
      const t2 = this.add.text(cam.width / 2, cam.height - 116, m.text, { fontFamily: 'monospace', fontSize: '17px', color: '#f2e0a0', fontStyle: 'italic' }).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
      this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 900 });
      this.time.delayedCall(8000, () => this.tweens.add({ targets: [t1, t2], alpha: 0, duration: 800, onComplete: () => [t1, t2].forEach((t) => t.destroy()) }));
    }, { when: () => need[id]() });
  },

  // ---- crows ---------------------------------------------------------------------

  makeCrow(f) {
    f.body.setAllowGravity(false);
    f.body.setSize(24, 16, true);
    f.homeY = f.y;
    f.mode = 'hover';
    f.diveAt = 0;
    f.update = (time, player) => this.updateCrow(f, time, player);
  },

  updateCrow(f, time, player) {
    if (!f.body) return;
    f.animate(time);
    f.shadow.setVisible(false);
    const p = player;
    const dx = p.x - f.x;
    const dy = p.y - f.y;
    if (f.mode === 'hover') {
      if (f.patrol) {
        if (f.x < f.patrol[0]) f.dir = 1;
        if (f.x > f.patrol[1]) f.dir = -1;
      }
      f.setVelocity(f.dir * f.speedBase * 0.5, Math.sin(time / 300 + f.homeX) * 30);
      f.setFlipX(f.dir < 0);
      const canSee = !this.playerHidden && !this.F.in_isak;
      if (canSee && Math.abs(dx) < 220 && Math.abs(dy) < 160 && time > f.diveAt && !this.palette.empty()) {
        f.mode = 'dive';
        f.diveAt = time + 5000;
        sfx('flap');
      }
      return;
    }
    if (f.mode === 'dive') {
      const len = Math.hypot(dx, dy) || 1;
      f.setVelocity((dx / len) * f.speedBase * 1.6, (dy / len) * f.speedBase * 1.6);
      f.setFlipX(dx < 0);
      if (overlaps(p.getBounds(), f.getBounds()) && !this.playerHidden && time > this.invulnUntil) {
        const lost = this.spillWell('taken by a crow');
        f.stolen = lost;
        if (lost) f.tube = this.add.image(f.x, f.y + 8, `pt-tube-${lost}`).setDepth(13).setScale(0.7);
        f.mode = 'flee';
        f.fleeUntil = time + 3200;
        sfx('flap');
      } else if (this.playerHidden || Math.abs(dx) > 320 || (dy < 0 && Math.abs(dy) > 60) || f.body.blocked.down) {
        f.mode = 'return';
      }
      return;
    }
    if (f.mode === 'flee') {
      f.setVelocity(Math.sign(f.x - p.x || 1) * 60, -70);
      if (f.tube) f.tube.setPosition(f.x, f.y + 10);
      if (time > f.fleeUntil) {
        if (f.tube) f.tube.destroy();
        f.cleanup();
      }
      return;
    }
    // return to height
    f.setVelocity(Math.sign(f.homeX - f.x) * f.speedBase * 0.5, Math.sign(f.homeY - f.y) * 60);
    if (Math.abs(f.y - f.homeY) < 8) f.mode = 'hover';
  },

  dropStolen(f) {
    if (!f.stolen) return;
    const c = f.stolen;
    if (f.tube) f.tube.destroy();
    const o = { type: 'pickup', colour: c, wx: f.x, wy: f.y + 10, ty: Math.floor(f.y / T), tx: Math.floor(f.x / T), id: `drop${this.time.now}` };
    this.buildTube(o, f.y + 20);
    this.floatText(f.x, f.y - 20, `it drops the ${c}.`, '#f2e0a0');
    f.stolen = null;
  },

  provokeShopkeeper() {
    const k = this.foes.find((f) => f.id === 'shopkeeper');
    if (!k || !this.F.stole) {
      this.setFlag('stole');
      this.dialog.show(DIALOGUES.shop);
    }
    if (k) {
      k.passive = false;
      k.seenPlayerAt = this.time.now;
      k.enter('alert', 0);
    }
  },

  // ---- per-frame: the wind, the rooms, the foes -------------------------------------

  updateWind(room, time, dt, grounded) {
    const p = this.player;
    let w = 0;
    if ((room.id === 'fields' || room.id === 'hill') && this.day >= this.mistralDay) w = (this.day >= 8 ? 120 : 80) * (0.6 + 0.4 * Math.sin(time / 1300));
    else if (room.id === 'wind' && this.zones && this.zones.wind_fields && this.zones.wind_fields.contains(p.x, p.y)) w = -(150 + 70 * Math.sin(time / 900));
    else if (room.id === 'cypress') w = 70 * Math.sin(time / 700);
    this.wind = w;
    if (w && time > p.controlLockUntil && !this.riding) {
      p.body.velocity.x += w * dt * (grounded ? 0.9 : 3.2);
      // a leaf, a stroke, a bit of chaff
      if (Math.random() < 0.08) {
        const cam = this.cameras.main;
        const leaf = this.add.rectangle(cam.scrollX + (w > 0 ? -10 : cam.width + 10), cam.scrollY + Math.random() * cam.height, 8, 2, room.underpainted ? 0x8a8a94 : 0xd8b858).setDepth(30).setAngle(20);
        this.tweens.add({ targets: leaf, x: leaf.x + Math.sign(w) * (cam.width + 60), y: leaf.y + 60, duration: 1400 + Math.random() * 600, onComplete: () => leaf.destroy() });
      }
      // §6 canvas 2: the Mistral tears unframed canvases out of the crate
      if (room.id !== 'wind' && this.canvases.length && time > this.gustAt) {
        this.gustAt = time + 9000;
        const violetNear = [...this.painted].some(([k, c]) => {
          if (c !== 'violet') return false;
          const [tx, ty] = k.split(',').map(Number);
          return Math.abs(px(tx) - p.x) < 100 && Math.abs(px(ty) - p.y) < 80;
        });
        if (!p.crouching && !violetNear && !this.F.cart) {
          const gone = this.canvases.pop();
          this.lostToWind += 1;
          sfx('flap');
          this.floatText(p.x, p.y - 70, `the wind takes a canvas. (${gone.title})`, '#e86a6a');
          this.updateSatchel();
          this.refreshStars();
        } else if (p.crouching) this.floatText(p.x, p.y - 60, 'the crate, held down.', '#8a8478');
      }
    }
  },

  updateRoom(room, time, dt, pb) {
    const p = this.player;
    const id = room.id;
    if (id !== this.lastRoomId) {
      this.lastRoomId = id;
      this.enterRoom(room);
    }
    if (id === 'fields' || id === 'hill') {
      this.updateBuds();
      // crows in waves on the late days
      if (this.day >= 8 && time > this.crowWaveAt && id === 'fields') {
        this.crowWaveAt = time + 22000;
        for (let i = 0; i < this.crowWaves; i++) {
          const f = this.addFoe({ kind: 'crow', wx: p.x + Phaser.Math.Between(-260, 260), wy: Math.max(px(12), p.y - 150 - i * 30), patrol: [Math.floor(p.x / T) - 10, Math.floor(p.x / T) + 10] });
          if (f) this.makeCrow(f);
        }
        this.floatText(p.x, p.y - 80, 'crows.', '#1f3a5f');
      }
      // night falls: sleep at an easel
      if (this.clock.h >= 21 && !this.told.night) {
        this.told.night = true;
        this.setObjective('night. sleep at an easel.');
        this.showTutorialSafe('sleep');
      }
    }
    if (id === 'roofs' && this.bell) {
      const ftx = Math.floor(p.x / T);
      const fty = Math.floor((p.y + 26) / T);
      if (p.body.blocked.down && fty === this.bell.ty && (ftx === this.bell.tx || ftx === this.bell.tx + 1) && time > this.bell.rangAt) {
        this.bell.rangAt = time + 4000;
        sfx('bell');
        this.tweens.add({ targets: this.bell.img, angle: 25, duration: 150, yoyo: true, repeat: 3 });
        this.floatText(this.bell.wx, this.bell.wy - 40, 'the bell. the whole street wakes.', '#e86a6a');
        for (const sh of this.shutters) if (!sh.shut && Math.abs(sh.wx - p.x) < 600) this.slamShuttersNear(sh.wx, sh.wy);
      }
    }
    if (room.sky) {
      this.tryRide(time);
      if (p.y > px(26) && !this.riding && !this.inIsak) {
        this.checkpoint = this.F.moon_cp ? this.checkpointAt('CP6b') : this.checkpointAt('CP6top');
        this.hurt();
      }
    }
    if (id === 'cypress') this.updateCypress(time);
    if (id === 'garden') this.updateGarden(time, dt);
    if (id === 'petition' && this.zones && this.zones.inside_house && this.zones.inside_house.contains(p.x, p.y) && !this.F.inside_house) {
      this.setFlag('inside_house');
      this.setObjective('the bedroom. the one wall. the one tube.');
    }
    if (id === 'cafe' && this.F.terrace_canvas && !this.F.paul && !this.paulComing) this.paulArrives();
    if (id === 'quarrel' && this.F.paul && !this.F.quarrel && !this.told.chairs) {
      this.told.chairs = true;
      this.setObjective('the same chair. [E] at it.');
    }
    // the farmer minds the standing wheat
    const farmer = this.foes.find((f) => f.id === 'farmer');
    if (farmer && farmer.active && this.zones && this.zones.wheat) {
      const inWheat = this.zones.wheat.contains(p.x, p.y);
      if (inWheat && farmer.passive) {
        farmer.passive = false;
        farmer.enter('alert', 0);
        if (!this.told.farmer) {
          this.told.farmer = true;
          this.dialog.show(DIALOGUES.farmer);
        }
      } else if (!inWheat && !farmer.passive && time - farmer.seenPlayerAt > 2500) farmer.passive = true;
    }
    void pb;
  },

  updateFoesExtra(time, dt, pb) {
    this.updateFoes(time);
    void dt;
    void pb;
  },

  runDialogueZone(z) {
    (async () => {
      if (z.id === 'd2') await this.vautrinLooks();
      if (z.id === 'd6') {
        await this.dialog.show(DIALOGUES.d6);
        this.setFlag('d6');
        this.setObjective('six colours. the irises first: sit by the one that blooms.');
      }
    })();
  },

  showTutorialSafe(id) {
    if (this.dialogActive || this.puzzleActive || this.cardActive) return;
    showTutorial(this, id);
  },
};

void VIOLET;
