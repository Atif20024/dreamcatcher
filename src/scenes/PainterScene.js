import Phaser from 'phaser';
import Player from '../entities/Player.js';
import BaseLevel from './BaseLevel.js';
import RoomBuilder from '../builders/RoomBuilder.js';
import Parallax from '../builders/parallax.js';
import { D } from '../builders/depths.js';
import { lightThemeProps } from '../art/levelArt.js';
import painterRooms from '../data/painter/rooms.js';
import painterTiles from '../data/painter/tiles.js';
import { DIALOGUES, MOMENTS, CARD_LINES, VIOLET } from '../data/painter/cast.js';
import { createPainterTextures, swatchTexture } from '../data/painter/sprites.js';
import { SUBJECTS, subjectById } from '../data/painter/subjects.js';
import { PIGMENTS, Palette, Clock, tintFor, underTint, vibratingTiles, complementOf } from '../systems/paint.js';
import Stroke from '../entities/Stroke.js';
import { completeDream, recordMoment, markMet, updateSave } from '../utils/save.js';
import { sfx, music, sting, musicDirector } from '../systems/audio.js';
import { showTutorial } from '../systems/tutorial.js';
import { hitStop } from '../systems/effects.js';
import world from './painter/world.js';
import beats from './painter/beats.js';
import { T, px, overlaps } from './painter/util.js';

const NIGHT_ROOMS = new Set(['cafe', 'roofs', 'cypress', 'sky']);

// THE YELLOW HOUSE — the dream that looks like nothing else in the game.
// The world starts as underpainting and is finished by Jo; the palette is the
// health bar; the brush lays strokes you can stand on; the clock only moves
// when he paints. Seven canvases, left to right.
export default class PainterScene extends BaseLevel {
  constructor() {
    super('Painter');
  }

  // restart reuses the instance: everything per-run starts here
  init() {
    this.F = {};
    this.told = {};
    this.props = {};
    this.interacts = [];
    this.surfaces = {};
    this.subjects = {};
    this.easels = [];
    this.painted = new Map(); // 'tx,ty' -> colour
    this.tileImgs = new Map(); // 'tx,ty' -> terrain image
    this.bgPaint = {}; // surface id -> overlay sprite
    this.vibrating = new Set();
    this.shimmers = new Map();
    this.strokes = [];
    this.stroke = null;
    this.strokeHeld = 0;
    this.strokeAnchor = null;
    this.canvases = [];
    this.canvasSeq = 0;
    this.lostToWind = 0;
    this.day = 1;
    this.wind = 0;
    this.gustAt = 0;
    this.paul = null;
    this.owed = 0;
    this.quarrel = null;
    this.moments = 0;
    this.carry = null;
    this.carrySprite = null;
    this.riding = null;
    this.rideLockUntil = 0;
    this.darks = {};
    this.shutters = [];
    this.stars = [];
    this.currents = [];
    this.buds = [];
    this.crowWaveAt = 0;
    this.blind = false;
    this.orbCaught = false;
    this.inIsak = false;
    this.lastBrush = null;
    this.swatches = 0;
  }

  create() {
    createPainterTextures(this);
    lightThemeProps(this, ['pt-'], ['pt-stroke', 'pt-well', 'pt-halo', 'pt-star', 'pt-moon', 'pt-sky', 'pt-glow', 'pt-shadow', 'pt-canvas', 'pt-tube']);

    const built = RoomBuilder.build(this, painterRooms, painterTiles);
    this.built = built;
    this.parallax = new Parallax(this, built.rooms);
    this.solids = built.solids;
    this.oneWays = built.oneWays;
    this.spikes = built.hazards;
    this.slopeGrid = built.slopeGrid;
    this.solidGrid = built.solidGrid;
    this.climbGrid = built.climbGrid;
    this.surfaceGrid = built.surfaceGrid;
    this.ladderGrid = built.ladderGrid;
    this.orbs = this.physics.add.staticGroup();
    this.flags = this.physics.add.staticGroup();
    this.strokeGroup = this.physics.add.staticGroup();

    const spawn = { x: px(3), y: px(33) - 10 };
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.tool.setTexture('tool-brush');
    this.dreamCoinId = 'painter';
    markMet('painter');
    this.setupCommon({ worldW: built.worldW, worldH: built.worldH, levelName: 'DREAM — THE YELLOW HOUSE', spawn });
    // §3.7 — no hearts in this dream: the palette is the health bar
    this.hearts.forEach((h) => h.setVisible(false));

    // §8 difficulty: less paint, more wind
    const d = this.difficulty;
    this.palette = new Palette({ wells: d >= 3 ? 2 : 3, capacity: d >= 2 ? 8 : 12 });
    this.clock = new Clock({ perStroke: d >= 2 ? 2 : 1 });
    this.mistralDay = d >= 2 ? 3 : 6;
    this.crowWaves = 1 + d;
    this.currentSpeed = 1 + 0.2 * d;
    this.shutterDims = d >= 2 ? 2 : 1;

    this.keyF = this.input.keyboard.addKey('F');
    this.keyV = this.input.keyboard.addKey('V');
    this.keyNums = this.input.keyboard.addKeys('ONE,TWO,THREE');

    this.initFoes('painter');
    this.enemies = this.foeGroup;
    this.spawnRoomFoes(built.objects, (o) => !o.wave);
    for (const f of this.foes) {
      const def = built.objects.find((o) => o.type === 'foe' && Math.abs(o.wx - f.homeX) < 1 && o.kind === f.kind);
      if (def && def.id) f.id = def.id;
      if (def && def.passive) f.passive = true;
      if (def && def.can) f.hasCan = true;
      if (f.kind === 'crow') this.makeCrow(f);
    }
    this.spawnPickups(built.objects);
    this.indexTiles();
    this.buildGates();
    this.buildCheckpoints();
    this.buildSky();
    this.buildWorld();
    this.applyUnderpainting();
    this.buildHud();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.oneWays);
    this.physics.add.collider(this.player, this.strokeGroup, (p, s) => this.onStrokeContact(p, s));
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.oneWays);
    this.physics.add.overlap(this.player, this.flags, (_p, f) => this.activateCheckpoint(f));
    this.physics.add.overlap(this.player, this.spikes, (_p, h) => h.body.enable && this.hurt());
    this.physics.add.overlap(this.player, this.orbs, (_p, o) => this.catchOrb(o));

    this.promptText = this.add
      .text(0, 0, '[E]', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580', backgroundColor: '#14101c' })
      .setOrigin(0.5)
      .setDepth(80)
      .setVisible(false);

    this.setObjective('the yellow house. two streets.');
    music.piano();
    if (!this.devWarp()) {
      this.time.delayedCall(900, async () => {
        await this.dialog.show(DIALOGUES.d0);
        this.setFlag('d0');
        showTutorial(this, 'wells');
      });
    }
  }

  // ---------- infrastructure ------------------------------------------

  setFlag(name) {
    this.F[name] = true;
    this.refreshGates();
  }

  buildGates() {
    this.gates = this.built.objects
      .filter((o) => o.type === 'gate')
      .map((g) => {
        const tiles = [];
        for (let r = g.ty; r < g.ty + (g.h || 5); r++) {
          const img = this.add.image(g.wx, px(r), `${painterTiles.key}_s_15_${(g.tx * 7 + r * 13) % 3}`).setTint(0x5b3a7a).setDepth(D.TERRAIN);
          this.physics.add.existing(img, true);
          this.solids.add(img);
          tiles.push(img);
        }
        const light = this.add.circle(g.wx, px(g.ty) - 20, 5, 0xc03a2a).setDepth(20);
        this.add.rectangle(g.wx, px(g.ty) - 20, 22, 3, 0x1f3a5f).setDepth(19);
        return { ...g, requires: g.requires || [], tiles, light, open: false };
      });
  }

  refreshGates() {
    for (const g of this.gates) {
      if (!g.open && g.requires.every((f) => this.F[f])) {
        g.open = true;
        g.light.setFillStyle(0xf2d060);
        sting.gate();
        g.tiles.forEach((t) => {
          if (t.body) t.body.enable = false;
          this.tweens.add({ targets: t, alpha: 0, duration: 400 });
        });
      }
    }
  }

  buildCheckpoints() {
    this.built.objects
      .filter((o) => o.type === 'checkpoint' && !(o.loseAt && this.difficulty >= o.loseAt))
      .forEach((c) => {
        const f = this.flags.create(c.wx, c.wy, 'flag');
        f.cpId = c.id;
      });
  }

  checkpointAt(id) {
    const f = this.flags.getChildren().find((c) => c.cpId === id);
    return f ? { x: f.x, y: f.y - 8 } : this.checkpoint;
  }

  addInteract(x, y, label, cb, { radius = 44, once = true, when = () => true, follow = null } = {}) {
    const it = { x, y, label, cb, radius, once, when, follow, used: false };
    this.interacts.push(it);
    return it;
  }

  roomOf(o) {
    return this.built.rooms.find((r) => r.id === o.room);
  }

  roomById(id) {
    return this.built.rooms.find((r) => r.id === id);
  }

  // the first solid row under a point, in px (the ground a person stands on)
  groundY(x, fromY) {
    const tx = Math.floor(x / T);
    for (let ty = Math.max(0, Math.floor(fromY / T)); ty < this.built.height; ty++) {
      if (this.built.solidAt(tx, ty)) return ty * T;
    }
    return this.worldH;
  }

  // a pixel person standing on the ground, with a violet shadow that follows the sun
  person(id, x, floorY, { flip = false, sit = false } = {}) {
    const key = `pt-p-${id}${sit ? '-sit' : ''}`;
    const img = this.add.image(x, floorY, this.textures.exists(key) ? key : `pt-p-${id}`).setOrigin(0.5, 1).setDepth(11).setFlipX(flip);
    img.setAngle((Math.random() - 0.5) * 3); // nothing is tidy
    const shadow = this.add.image(x, floorY - 1, 'pt-shadow').setDepth(10.5).setAlpha(0.7);
    shadow.ownerX = x;
    img.shadowImg = shadow;
    (this.shadows ||= []).push(shadow);
    this.tweens.add({ targets: img, scaleY: 1.015, duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'sine.inout' });
    return img;
  }

  walkPerson(img, id, toX, cb, speed = 70) {
    const from = img.x;
    const dist = Math.abs(toX - from);
    img.setFlipX(toX < from);
    const state = { d: 0 };
    this.tweens.add({
      targets: state,
      d: dist,
      duration: (dist / speed) * 1000,
      onUpdate: () => {
        img.x = from + Math.sign(toX - from) * state.d;
        if (img.shadowImg) img.shadowImg.x = img.x;
        const stride = (Math.floor(state.d / 14) % 8) + 1;
        const k = `pt-p-${id}#${stride}`;
        if (this.textures.exists(k)) img.setTexture(k);
      },
      onComplete: () => {
        img.setTexture(`pt-p-${id}`);
        if (cb) cb();
      },
    });
  }

  // ---------- the palette (and it is the health bar) -------------------

  takeTube(colour, { from = null } = {}) {
    const dropped = this.palette.take(colour, { capacity: this.palette.capacity });
    sfx('pickup');
    const where = from ? ` (${from})` : '';
    this.floatText(this.player.x, this.player.y - 60, `${colour}${where}`, `#${PIGMENTS[colour].hex.toString(16).padStart(6, '0')}`);
    if (dropped) this.floatText(this.player.x, this.player.y - 78, `(${dropped} — dropped)`, '#8a8478');
    if (!this.told.brush) {
      this.told.brush = true;
      showTutorial(this, 'brush');
    }
    this.updateHud();
  }

  spillWell(why = 'spilled') {
    const lost = this.palette.spill();
    if (lost) {
      this.floatText(this.player.x, this.player.y - 60, `${lost} ${why}.`, '#e86a6a');
      // the pigment on the ground, briefly
      for (let i = 0; i < 6; i++) {
        const b = this.add.circle(this.player.x + Phaser.Math.Between(-16, 16), this.player.y + 20, Phaser.Math.Between(2, 5), PIGMENTS[lost].hex).setDepth(11);
        this.tweens.add({ targets: b, y: b.y + 6, alpha: 0, duration: 2500, delay: 1200, onComplete: () => b.destroy() });
      }
    }
    this.updateHud();
    if (lost && this.palette.empty() && !this.F.in_wind_section) this.goBlind();
    return lost;
  }

  // §3.7 — all three wells empty: he can't see colour. The world drops to
  // underpainting, the music to one instrument, and he wakes at the
  // checkpoint with the last tube back.
  goBlind() {
    if (this.blind) return;
    this.blind = true;
    const cam = this.cameras.main;
    const grey = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x4a5566, 0).setScrollFactor(0).setDepth(88);
    const label = this.add.text(cam.width / 2, cam.height / 2, "he can't see colour.", { fontFamily: 'monospace', fontSize: '20px', color: '#c8c0b0' }).setOrigin(0.5).setScrollFactor(0).setDepth(231).setAlpha(0);
    this.tweens.add({ targets: grey, alpha: 0.7, duration: 900 });
    this.tweens.add({ targets: label, alpha: 1, duration: 900 });
    this.player.controlLockUntil = this.time.now + 2600;
    this.player.body.setVelocity(0, 0);
    musicDirector.setMix({ pad: 0.5 });
    this.time.delayedCall(2200, () => {
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
      const back = this.palette.lastLost || 'yellow';
      this.palette.take(back);
      this.floatText(this.player.x, this.player.y - 60, `${back}, found at the bottom of the bag.`, '#f2e0a0');
      this.tweens.add({ targets: [grey, label], alpha: 0, duration: 900, onComplete: () => {
        grey.destroy();
        label.destroy();
        this.blind = false;
        musicDirector.clearMix();
      } });
      this.updateHud();
    });
  }

  onHurtExtra() {}

  // a hit spills a well instead of a heart (BaseLevel.hurt is replaced whole)
  hurt() {
    if (this.cardActive || this.dialogActive || this.puzzleActive || this.blind) return;
    if (this.time.now < this.invulnUntil) return;
    sfx('hurt');
    this.scatterCoins();
    hitStop(this, 60);
    this.cameras.main.shake(240, 0.008);
    this.player.burst();
    this.player.knockHat();
    this.dropCarry();
    this.endStroke();
    this.spillWell();
    this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
    this.player.setVelocity(0, 0);
    this.stopRiding();
    this.invulnUntil = this.time.now + 2000;
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 150, yoyo: true, repeat: 6, onComplete: () => this.player.setAlpha(1) });
  }

  loseHeart() {
    this.spillWell('spilled in the scuffle');
  }

  // caught by a person: who it was decides where he wakes
  throwOut(foe) {
    if (this.thrownOut || this.cardActive) return;
    const kind = foe && foe.kind;
    if (kind === 'gardener') this.checkpoint = this.checkpointAt('CP5a');
    if (kind === 'petitioner') this.checkpoint = this.checkpointAt('CP4b');
    const label = kind === 'gardener' ? 'BACK TO BED' : kind === 'gendarme' ? 'GO HOME, PAINTER' : kind === 'petitioner' ? 'SEEN HOME' : kind === 'farmer' ? 'OFF THE WHEAT' : 'THROWN OUT';
    this.thrownOut = true;
    this.scatterCoins();
    sfx('fail');
    this.cameras.main.shake(200, 0.008);
    this.player.controlLockUntil = this.time.now + 1500;
    this.player.body.setVelocity(0, 0);
    this.dropCarry();
    this.endStroke();
    const cam = this.cameras.main;
    const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x1f3a5f, 0).setScrollFactor(0).setDepth(230);
    const t = this.add.text(cam.width / 2, cam.height / 2, label, { fontFamily: 'monospace', fontSize: '26px', color: '#e8dcc8' }).setOrigin(0.5).setScrollFactor(0).setDepth(231).setAlpha(0);
    this.tweens.add({ targets: wipe, alpha: 0.9, duration: 500 });
    this.tweens.add({ targets: t, alpha: 1, duration: 500 });
    this.time.delayedCall(1000, () => {
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
      this.tweens.add({ targets: [wipe, t], alpha: 0, duration: 500, onComplete: () => {
        wipe.destroy();
        t.destroy();
        this.thrownOut = false;
      } });
      this.loseHeart();
    });
  }

  dropCarry() {
    if (!this.carry) return;
    this.carry = null;
    if (this.carrySprite) this.carrySprite.destroy();
    this.carrySprite = null;
    this.updateSatchel();
  }

  take(id, texKey) {
    this.carry = id;
    if (this.carrySprite) this.carrySprite.destroy();
    this.carrySprite = this.add.image(this.player.x, this.player.y - 42, texKey).setDepth(40);
    sfx('pickup');
    this.updateSatchel();
  }

  updateSatchel() {
    this.satchel = [];
    if (this.canvases.length) this.satchel.push(`CRATE ${this.canvases.length}`);
    if (this.carry) this.satchel.push(this.carry.toUpperCase());
    this.updateSatchelHud();
  }

  // ---------- the underpainting and the paint ----------------------------

  indexTiles() {
    for (const img of this.solids.getChildren()) if (img.tx !== undefined) this.tileImgs.set(`${img.tx},${img.ty}`, img);
    for (const img of this.oneWays.getChildren()) {
      const tx = Math.floor(img.x / T);
      const ty = Math.floor((img.y + 10) / T);
      img.tx = tx;
      img.ty = ty;
      this.tileImgs.set(`${tx},${ty}`, img);
    }
    // slopes are plain images at the terrain depth
    for (const img of this.children.list) {
      if (img.texture && typeof img.texture.key === 'string' && img.texture.key.startsWith('pt_sl_') && img.tx === undefined) {
        const tx = Math.floor(img.x / T);
        const ty = Math.floor(img.y / T);
        img.tx = tx;
        img.ty = ty;
        this.tileImgs.set(`${tx},${ty}`, img);
      }
    }
  }

  // §3.1 — every room begins unfinished: umber and grey-blue only. Isak's
  // room is far north and already painted; the gates are their own colour.
  applyUnderpainting() {
    const isak = this.roomById('isak');
    for (const [k, img] of this.tileImgs) {
      if (img.tx >= isak._x0 || img.keepTint) continue;
      img.baseTint = img.tintTopLeft;
      img.setTint(underTint(img.tx, img.ty));
      void k;
    }
  }

  paintTile(tx, ty, colour, { quiet = false } = {}) {
    const k = `${tx},${ty}`;
    const img = this.tileImgs.get(k);
    if (colour === 'white' || !colour) {
      this.painted.delete(k);
      if (img) img.setTint(underTint(tx, ty));
    } else {
      this.painted.set(k, colour);
      if (img) {
        img.setTint(tintFor(colour));
        if (!quiet) {
          // the 6-frame wipe along the stroke: a flash of the lit ridge
          img.setAlpha(0.6);
          this.tweens.add({ targets: img, alpha: 1, duration: 180 });
        }
      }
    }
    this.paintDirty = true;
  }

  // a rectangle of the world, painted (terrain tiles tint; a backdrop surface
  // gets a stroke field laid over it)
  paintRect(x0, x1, y0, h, colour, { bg = false, id = null } = {}) {
    for (let ty = y0; ty < y0 + h; ty++) for (let tx = x0; tx <= x1; tx++) this.paintTile(tx, ty, colour, { quiet: tx !== x0 });
    if (bg && id) {
      if (this.bgPaint[id]) this.bgPaint[id].destroy();
      delete this.bgPaint[id];
      if (colour && colour !== 'white') {
        const w = (x1 - x0 + 1) * T;
        const hh = h * T;
        const ts = this.add.tileSprite(x0 * T + w / 2, y0 * T + hh / 2, w, hh, `pt-stroke-${colour}`).setDepth(D.ZONE_TINT).setAlpha(0);
        ts.setAngle((Math.random() - 0.5) * 2);
        this.tweens.add({ targets: ts, alpha: 0.85, duration: 400 });
        this.bgPaint[id] = ts;
      }
    }
  }

  // Canvas 4 — the dream forgets: everything back to underpainting
  clearAllPaint() {
    for (const [k] of this.painted) {
      const [tx, ty] = k.split(',').map(Number);
      const img = this.tileImgs.get(k);
      if (img) img.setTint(underTint(tx, ty));
    }
    this.painted.clear();
    for (const ts of Object.values(this.bgPaint)) ts.destroy();
    this.bgPaint = {};
    for (const s of Object.values(this.surfaces)) s.colour = null;
    for (const st of this.strokes) st.destroy();
    this.strokes = [];
    for (const [, sh] of this.shimmers) sh.destroy();
    this.shimmers.clear();
    this.vibrating.clear();
    for (const [id, z] of Object.entries(this.darks)) if (z.lit) {
      z.lit = false;
      z.rect.setAlpha(0.88);
    }
    for (const img of this.spikes.getChildren()) img.body.enable = true;
    this.paintDirty = true;
  }

  // §3.4 — complementaries: where a colour sits beside its complement the
  // edge vibrates. Vibrating tiles are launchers; a hazard beside one sleeps.
  refreshVibrato() {
    this.paintDirty = false;
    const list = vibratingTiles(this.painted);
    const keys = new Set(list.map((v) => `${v.tx},${v.ty}`));
    for (const [k, sh] of this.shimmers) if (!keys.has(k)) {
      sh.destroy();
      this.shimmers.delete(k);
    }
    for (const v of list) {
      const k = `${v.tx},${v.ty}`;
      if (!this.shimmers.has(k)) {
        const sh = this.add.image(px(v.tx), px(v.ty) - 10, 'pt-glow').setDepth(D.HAZARD + 0.5).setScale(0.9, 0.5).setAlpha(0.5).setTint(PIGMENTS[v.other].hex).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: sh, alpha: 0.9, scaleX: 1.1, duration: 160, yoyo: true, repeat: -1 });
        this.shimmers.set(k, sh);
        if (!this.told.vibrato) {
          this.told.vibrato = true;
          showTutorial(this, 'vibrato');
        }
        sfx('buzz');
      }
    }
    this.vibrating = keys;
    // hazards beside a vibrating edge go dormant
    for (const h of this.spikes.getChildren()) {
      const tx = Math.floor(h.x / T);
      const ty = Math.floor(h.y / T);
      let near = false;
      for (let dx = -1; dx <= 1 && !near; dx++) for (let dy = -1; dy <= 1; dy++) if (keys.has(`${tx + dx},${ty + dy}`)) near = true;
      if (h.lit !== undefined && !h.lit) continue; // a cold stove is not a hazard anyway
      h.body.enable = !near;
      h.setTint(near ? 0x8a8a94 : 0xffffff);
    }
  }

  // ---------- the stroke -------------------------------------------------

  beginStroke(colour) {
    if (!colour) return null;
    if (colour === 'white') {
      this.floatText(this.player.x, this.player.y - 60, 'white primes a surface. it is not for the air.', '#c8c0b0');
      this.strokeHeld = -9999;
      return null;
    }
    if (!this.palette.spend(1)) return null;
    this.clock.stroke(1);
    const st = new Stroke(this, colour, { onTile: (t) => this.onStrokeTile(t) });
    this.strokes.push(st);
    this.stroke = st;
    this.strokeUsed = 0;
    this.strokeAnchor = { x: this.player.x, y: this.player.y };
    sfx('swing');
    if (colour !== 'violet') this.slamShuttersNear(this.player.x, this.player.y);
    if (!this.told.stroke) {
      this.told.stroke = true;
      showTutorial(this, 'stroke');
    }
    if (!this.told.clock && this.clock.hour > 9) {
      this.told.clock = true;
      showTutorial(this, 'clock');
    }
    this.updateHud();
    return st;
  }

  onStrokeTile(t) {
    // a second pass over a wet tile of another stroke: thick, at double paint
    for (const other of this.strokes) {
      if (other === this.stroke || other.done) continue;
      const hit = other.tiles.find((o) => !o.gone && o.tx === t.tx && o.ty === t.ty);
      if (hit && !hit.thick) {
        other.thicken(hit);
        this.palette.spend(1);
        this.floatText(t.img.x, t.img.y - 20, 'thick.', '#f2e0a0');
        t.gone = true;
        t.img.destroy();
        return;
      }
    }
    if (t.img.stroke && this.stroke.colour === 'blue') {
      // a blue stroke is swum through, not stood on
      t.img.body.enable = false;
      t.img.setAlpha(0.6);
    }
  }

  endStroke() {
    if (this.stroke) this.checkOverpaint(this.stroke);
    this.stroke = null;
    this.strokeArmed = false;
    this.strokeAnchor = null;
    this.strokeHeld = 0;
  }

  // the brush key: a tap swipes (crows, people); a hold while moving paints
  updateBrush(time, dt, grounded, strokeUnder) {
    const p = this.player;
    const held = p.keys.X.isDown;
    if (Phaser.Input.Keyboard.JustDown(p.keys.X)) {
      this.strokeHeld = 0;
      const hit = p.swingLadle();
      if (hit) {
        for (const e of this.foes) {
          if (!e.active || !overlaps(hit, e.getBounds())) continue;
          if (e.human) e.shove(p.x);
          else {
            if (e.kind === 'crow' && e.stolen) this.dropStolen(e);
            e.die();
            if (this.coinMgr) this.coinMgr.spawn(e.x, e.y - 10);
          }
        }
      }
    }
    if (!held) {
      if (this.stroke) this.endStroke();
      this.strokeArmed = true; // one ribbon per press
      return;
    }
    this.strokeHeld += dt * 1000;
    const moving = Math.abs(p.body.velocity.x) > 40 || !grounded;
    if (!this.stroke) {
      if (!this.strokeArmed || this.strokeHeld < 110 || !moving) return;
      const colour = this.palette.brush();
      if (!colour) {
        if (this.strokeHeld < 130) this.floatText(p.x, p.y - 60, this.palette.empty() ? 'no paint.' : 'the well is dry.', '#c8c0b0');
        return;
      }
      if (this.F.in_wind_section) return; // no paint at all here
      if (!this.beginStroke(colour)) return;
    }
    const st = this.stroke;
    if (grounded && !strokeUnder) {
      // a stroke on the ground paints the ground gold (or whatever it is)
      const tx = Math.floor(p.x / T);
      const ty = Math.floor((p.y + 24) / T);
      const k = `${tx},${ty}`;
      if (this.tileImgs.has(k) && this.painted.get(k) !== st.colour && this.lastGroundTile !== k) {
        this.lastGroundTile = k;
        this.paintTile(tx, ty, st.colour);
        this.strokeUsed += 1;
        if (this.strokeUsed >= 6) this.endStroke();
      }
      return;
    }
    const tx = Math.floor(p.x / T);
    const ty = strokeUnder && strokeUnder === st && st.tiles.length ? st.tiles[st.tiles.length - 1].ty : Math.ceil((p.y + 32) / T);
    if (this.strokeUsed + st.length >= 6 && !st.keys.has(`${tx},${ty}`)) {
      this.endStroke();
      return;
    }
    const ok = st.add(tx, ty);
    if (!ok) this.endStroke();
  }

  // standing on a stroke: slippery while fresh; red kicks; violet hides
  onStrokeContact(p, s) {
    const t = s.strokeTile;
    if (!t || !s.stroke) return;
    this.onStrokeNow = s.stroke;
    if (this.time.now < s.stroke.slipUntil) this.slipNow = true;
    if (s.stroke.colour === 'violet') this.hiddenByStroke = true;
  }

  // ---------- update ---------------------------------------------------

  update(time, delta) {
    if (this.handleModalUpdate()) return;
    const p = this.player;
    const dt = delta / 1000;
    const room = RoomBuilder.roomAt(this.built.rooms, p.x);
    const pb = p.getBounds();
    const grounded = p.body.blocked.down || p.onSlope;
    // the colliders have already run this frame: read what they left, then clear it
    const strokeUnder = this.onStrokeNow;
    this.onStrokeNow = null;
    p.slippery = !!this.slipNow;
    p.slipFactor = 0.08;
    this.slipNow = false;
    this.playerHidden = !!this.hiddenByStroke;
    this.hiddenByStroke = false;

    // the night rooms lock the clock; the garden runs it from noon
    this.clock.locked = NIGHT_ROOMS.has(room.id) || this.inIsak ? 'night' : null;

    const wasRiding = !!this.riding;
    if (this.riding) this.updateRiding(time, dt);
    else p.update(time, delta);
    if (!wasRiding && grounded) p.body.setAllowGravity(true);

    // §3.4 launcher: a jump from a vibrating edge (or a red stroke) goes higher
    if (p.body.velocity.y < -550 && !p.launched) {
      p.launched = true;
      const ftx = Math.floor(p.x / T);
      const fty = Math.floor((p.y + 26) / T);
      const onVib = this.vibrating.has(`${ftx},${fty}`);
      const onRed = strokeUnder && strokeUnder.colour === 'red';
      if (onVib) {
        p.body.setVelocityY(-600 * 1.72);
        sfx('chime');
      } else if (onRed) {
        p.body.setVelocityY(-600 * 1.4);
        sfx('pop');
      }
    }
    if (grounded) p.launched = false;

    this.updateWind(room, time, dt, grounded);
    this.updateBrush(time, dt, grounded, strokeUnder);
    this.updateKeys(time);
    this.updateInteracts(p);
    this.updateStrokes(time, dt);
    if (this.paintDirty) this.refreshVibrato();
    this.updateMusicRoom();
    this.updateRoom(room, time, dt, pb);
    this.updateFoesExtra(time, dt, pb);
    this.updateMusicMix();
    this.updatePickups(time, delta);
    this.updateDialogueZones(p);
    this.updateLight(time, dt);
    this.updatePaul(time, dt);
    this.updateHudLive();
    if (this.carrySprite) this.carrySprite.setPosition(p.x, p.y - 42);

    // the violet in painted tiles hides him too
    const ftx = Math.floor(p.x / T);
    const fty = Math.floor((p.y + 26) / T);
    if (this.painted.get(`${ftx},${fty}`) === 'violet') this.playerHidden = true;

    if (p.y > this.worldH + 60) {
      p.setPosition(this.checkpoint.x, this.checkpoint.y);
      p.setVelocity(0, 0);
      this.hurt();
    }
  }

  updateKeys(time) {
    const p = this.player;
    const K = this.keyNums;
    if (Phaser.Input.Keyboard.JustDown(K.ONE)) this.selectWell(0);
    if (Phaser.Input.Keyboard.JustDown(K.TWO)) this.selectWell(1);
    if (Phaser.Input.Keyboard.JustDown(K.THREE)) this.selectWell(2);
    if (Phaser.Input.Keyboard.JustDown(this.keyV)) {
      if (!this.F.p1) this.floatText(p.x, p.y - 60, "he can't mix yet. (the palette, in the square)", '#c8c0b0');
      else {
        this.palette.mixing = !this.palette.mixing;
        sfx('click');
        this.floatText(p.x, p.y - 60, this.palette.mixing ? `mixing: ${this.palette.brush() || '—'}` : 'one well', '#f2e0a0');
        this.updateHud();
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyF)) this.callPaul();
    // Q: throw the empty tube — it rattles, and people turn to look
    if (Phaser.Input.Keyboard.JustDown(this.keyQ) && time > (this.qCool || 0)) {
      this.qCool = time + 3000;
      sfx('clack');
      const tube = this.add.image(p.x, p.y - 10, 'pt-tube-yellow').setDepth(30).setAlpha(0.7);
      const dir = p.flipX ? -1 : 1;
      this.tweens.add({ targets: tube, x: p.x + dir * 170, y: p.y + 20, angle: 540, duration: 600, ease: 'quad.in', onComplete: () => {
        sfx('clang');
        for (const f of this.foes) if (f.human && f.active && Math.abs(f.x - tube.x) < 160) f.distract(tube.x);
        this.tweens.add({ targets: tube, alpha: 0, duration: 800, onComplete: () => tube.destroy() });
      } });
    }
  }

  selectWell(i) {
    if (i >= this.palette.max) return;
    this.palette.select(i);
    sfx('click');
    this.updateHud();
  }

  updateStrokes(time, dt) {
    for (const st of this.strokes) {
      st.update(time);
      if (this.wind) st.bend(this.wind, dt);
    }
    this.strokes = this.strokes.filter((s) => !s.done);
    // blue strokes: a slow drift you can swim through
    const p = this.player;
    const pb = p.getBounds();
    let inBlue = false;
    for (const st of this.strokes) {
      if (st.colour !== 'blue') continue;
      for (const t of st.tiles) {
        if (t.gone) continue;
        if (overlaps(pb, new Phaser.Geom.Rectangle(t.img.x - 16, t.img.y - 40, 32, 56))) inBlue = true;
      }
    }
    if (inBlue && !this.riding) {
      const up = p.cursors.up.isDown || p.keys.W.isDown || p.keys.SPACE.isDown;
      p.body.setVelocityY(up ? -130 : Math.min(p.body.velocity.y, 40));
      p.body.velocity.x *= 0.85;
    }
  }

  updateInteracts(p) {
    let nearest = null;
    for (const it of this.interacts) {
      if (it.used && it.once) continue;
      if (!it.when()) continue;
      if (it.follow) {
        it.x = it.follow.x;
        it.y = it.follow.y;
      }
      const d = Phaser.Math.Distance.Between(p.x, p.y, it.x, it.y);
      if (d < it.radius && (!nearest || d < nearest.d)) nearest = { it, d };
    }
    if (nearest) {
      const label = typeof nearest.it.label === 'function' ? nearest.it.label() : nearest.it.label;
      this.promptText.setText(`[E] ${label}`).setVisible(true).setPosition(nearest.it.x, nearest.it.y - 34);
      if (Phaser.Input.Keyboard.JustDown(p.keys.E)) {
        nearest.it.used = true;
        nearest.it.cb();
      }
    } else this.promptText.setVisible(false);
  }

  updateDialogueZones(p) {
    for (const z of this.dialogueZones || []) {
      if (z.done || Math.abs(p.x - z.wx) > 40 || Math.abs(p.y - z.wy) > 60) continue;
      z.done = true;
      this.runDialogueZone(z);
    }
  }

  // §3.5 — the light: a wash by the hour, violet shadows that lengthen
  updateLight(time, dt) {
    const [col, a] = this.clock.tint();
    const room = this._room;
    const under = room && room.underpainted && !this.F.colours_back;
    this.lightWash.setFillStyle(under ? 0x4a5566 : col, under ? Math.max(a, 0.22) : a);
    const sh = this.clock.shadow();
    for (const s of this.shadows || []) {
      s.setScale(sh.len, 1);
      s.x = (s.ownerX ?? s.x) + sh.dir * (sh.len - 0.5) * 10;
    }
    // the sky's currents: the stroke field scrolls along its spirals
    if (this.skyFar) {
      const z = this.cameras.main.zoom || 1;
      const night = this.clock.phase === 'night';
      this.skyFar.setTexture(night ? 'pt-sky-night' : 'pt-sky-day');
      this.skyFar.tilePositionX = this.cameras.main.scrollX * 0.1 + time * 0.012;
      this.skyFar.tilePositionY = Math.sin(time / 7000) * 20;
      this.skyFar.setScale(1 / z);
      this.skyFar.setAlpha(night ? 0.75 : 0.45);
      this.skyNear.tilePositionX = this.cameras.main.scrollX * 0.16 - time * 0.02;
      this.skyNear.tilePositionY = Math.cos(time / 9000) * 30;
      this.skyNear.setScale(1 / z);
      this.skyNear.setAlpha(night ? 0.5 : 0.25);
      this.skyNear.setTexture(night ? 'pt-sky-night' : 'pt-sky-day');
    }
    for (const h of this.halos || []) h.angle = (time / 1000) * 6; // 1 rpm
    void dt;
  }

  // music thins as the wells empty: one well, one instrument
  updateMusicMix() {
    if (this.inIsak) return;
    const n = this.palette.filled();
    const max = this.palette.max;
    const room = this._room;
    const violin = room && (room.id === 'quarrel' && this.F.quarrel) || (room && room.section === 'wind');
    if (violin) {
      musicDirector.setMix({ trumpet: 0.55, pad: 0.15 });
      return;
    }
    if (n >= max && !this.blind) {
      if (room && room.night) musicDirector.setMix({ trumpet: 0.3, piano: 0.6, pad: 0.45, bass: 0.3 });
      else musicDirector.clearMix();
      return;
    }
    const k = Math.max(0.15, n / max);
    musicDirector.setMix({ bass: 0.9 * k, piano: 0.5 * k, brushes: 0.4 * k, pad: 0.4 });
  }

  // ---------- HUD --------------------------------------------------------

  buildHud() {
    const cam = this.cameras.main;
    this.lightWash = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xfff2a0, 0.04).setScrollFactor(0).setDepth(86).setBlendMode(Phaser.BlendModes.MULTIPLY);
    const mk = (x, y, color = '#c8c0b0', size = 12) => this.add.text(x, y, '', { fontFamily: 'monospace', fontSize: `${size}px`, color, stroke: '#14101c', strokeThickness: 3 }).setScrollFactor(0).setDepth(150);
    // §3.2 the palette, bottom-left: three wells as smears
    this.wellHud = [];
    for (let i = 0; i < this.palette.max; i++) {
      const x = 30 + i * 58;
      const y = cam.height - 40;
      const frame = this.add.rectangle(x, y, 50, 30, 0x14101c, 0.7).setScrollFactor(0).setDepth(148).setStrokeStyle(2, 0x4a3f5c);
      const smear = this.add.image(x, y, 'pt-well-yellow').setScrollFactor(0).setDepth(149).setVisible(false);
      const n = mk(x + 14, y - 6, '#e8dcc8', 11).setOrigin(0.5);
      const key = mk(x - 18, y - 24, '#8a8478', 10).setText(`${i + 1}`);
      this.wellHud.push({ frame, smear, n, key });
    }
    this.brushHud = mk(16, cam.height - 70, '#f2e0a0');
    this.clockHud = mk(16, 112, '#e8c060');
    this.crateHud = mk(16, 130, '#c8c0b0');
    this.updateHud();
  }

  updateHud() {
    const pal = this.palette;
    pal.wells.forEach((w, i) => {
      const h = this.wellHud[i];
      if (!h) return;
      const on = w.colour && w.strokes > 0;
      h.smear.setVisible(!!w.colour).setTexture(`pt-well-${w.colour || 'yellow'}`).setAlpha(on ? 1 : 0.25);
      h.n.setText(w.colour ? `${w.strokes}` : '');
      h.frame.setStrokeStyle(2, i === pal.sel ? 0xf2d580 : 0x4a3f5c);
    });
    const b = pal.brush();
    this.brushHud.setText(b ? `brush: ${b}${pal.mixing && b !== pal.selected.colour ? ' (mixed)' : ''}` : 'brush: dry');
    this.updateHudLive();
    this.updateSatchel();
  }

  updateHudLive() {
    const c = this.clock;
    const h = Math.floor(c.h);
    const m = Math.floor((c.h - h) * 60);
    const inFields = this._room && (this._room.id === 'fields' || this._room.id === 'hill');
    this.clockHud.setText(`${inFields ? `day ${this.day}/10 · ` : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} · ${c.phase}`);
    this.crateHud.setText(this.canvases.length ? `crate: ${this.canvases.length} canvas${this.canvases.length > 1 ? 'es' : ''}` : '');
  }

  // ---------- the ending ----------------------------------------------------

  catchOrb(orb) {
    if (this.cardActive || this.orbCaught) return;
    this.orbCaught = true;
    completeDream('painter');
    const allMoments = this.moments >= 4;
    updateSave((s) => {
      s.flags.pt = { ...(s.flags.pt || {}), quarrel: this.quarrel, ten_canvases: !!this.F.ten_canvases, canvases: this.canvases.length, climbed: true, colours_back: !!this.F.colours_back, moments: this.moments };
    });
    music.stop();
    music.soloPiano();
    sfx('orb');
    this.tweens.add({ targets: orb, scale: 2.5, alpha: 0, duration: 700 });
    const momentMsg = this.moments === 0 ? "You didn't notice anything on the way." : this.moments < 4 ? 'You noticed a little.' : 'You noticed. Maybe that was the point.';
    const lines = [CARD_LINES.sold, '', CARD_LINES.enough, '', momentMsg];
    if (this.F.ten_canvases) lines.push(CARD_LINES.ten);
    if (this.quarrel === 'agreed') lines.push(CARD_LINES.agreed);
    else if (this.quarrel === 'disagreed') lines.push(CARD_LINES.disagreed);
    if (allMoments) lines.push(CARD_LINES.irises);
    lines.push('', '[X] Return to Crossroads Station');
    this.showCard(lines, () => {
      music.stop();
      this.scene.start('Hub', { returnedFrom: 'painter' });
    });
  }

  // ---------- dev warp ----------------------------------------------------

  devWarp() {
    let at = null;
    try {
      at = new URLSearchParams(window.location.search).get('pt');
    } catch {
      return false;
    }
    if (!at) return false;
    const A0 = ['d0', 'door_lit'];
    const A1 = [...A0, 'letter1', 'brush', 'bedroom_canvas', 'p1', 'd1'];
    const A2 = [...A1, 'cart', 'vautrin', 'bridge_down', 'lock_full'];
    const A3 = [...A2, 'd3', 'terrace_canvas', 'paul', 'p3', 'terrace'];
    const A4 = [...A3, 'quarrel', 'emptied', 'paul_gone'];
    const A4b = [...A4, 'roulin_yellow', 'in_wind_section'];
    const A5 = [...A4, 'roulin_yellow', 'boarded', 'd6'];
    const A6 = [...A5, 'colours_back', 'd7', 'violet_back', 'blue_back', 'yellow_back', 'red_back', 'green_back', 'white_back'];
    const FULL = ['yellow', 'blue', 'red'];
    const PH = {
      arrival: { flags: ['d0'], col: 4, row: 33, wells: [], obj: 'the yellow house. two streets.' },
      studio: { flags: A0, col: 44, row: 33, wells: ['yellow'], obj: 'the house. no curtains.' },
      square: { flags: [...A0, 'letter1', 'brush', 'bedroom_canvas'], col: 101, row: 33, wells: FULL, canvases: 1, obj: 'the square. the postman.' },
      fields: { flags: A1, col: 141, row: 33, wells: ['yellow', 'blue', 'green'], canvases: 1, hour: 7, obj: 'ten canvases in ten days' },
      hill: { flags: A1, col: 261, row: 33, wells: FULL, canvases: 8, hour: 14, day: 9, obj: 'the hill. the view.' },
      vautrin: { flags: [...A1, 'cart'], col: 291, row: 33, wells: FULL, canvases: 9, hour: 16, day: 10, obj: 'the city. the dealer.' },
      cafe: { flags: A2, col: 311, row: 33, wells: ['yellow', 'blue', 'red'], canvases: 9, hour: 22, day: 10, obj: 'the café at night', low: true },
      roofs: { flags: [...A2, 'd3', 'terrace_canvas', 'paul', 'terrace'], col: 351, row: 23, wells: ['green', 'blue', 'yellow'], canvases: 10, hour: 22, paul: true, obj: 'the rooftops. the bell tower.' },
      quarrel: { flags: A3, col: 392, row: 33, wells: FULL, canvases: 10, hour: 8, paul: true, obj: 'the same chair' },
      wind: { flags: [...A4, 'in_wind_section'], col: 422, row: 33, wells: [], canvases: 10, hour: 18, obj: 'home. with no paint.', emptied: true },
      petition: { flags: A4b, col: 501, row: 33, wells: ['yellow'], canvases: 10, hour: 19, obj: 'the house is being boarded. get inside.', emptied: true },
      garden: { flags: A5, col: 542, row: 33, wells: [], canvases: 10, hour: 11, obj: 'one colour a day', emptied: true },
      cypress: { flags: A6, col: 603, row: 33, wells: ['violet', 'blue', 'yellow'], canvases: 10, hour: 22, obj: 'the cypress. up.' },
      sky: { flags: [...A6, 'climbed'], col: 613, row: 2, wells: ['violet', 'blue', 'yellow'], canvases: 11, hour: 22, obj: 'the currents. the stars.' },
      isak: { flags: [...A6, 'climbed', 'star_chosen'], col: 674, row: 3, wells: ['violet', 'blue', 'yellow'], canvases: 11, hour: 22, obj: 'the star.', isak: true },
    };
    const ph = PH[at];
    if (!ph) return false;
    this.warped = true;
    ph.flags.forEach((f) => this.setFlag(f));
    (ph.wells || []).forEach((c) => this.palette.take(c));
    if (ph.low) this.palette.wells.forEach((w) => (w.strokes = Math.min(w.strokes, 3)));
    if (ph.flags.includes('p1')) this.palette.mixing = false;
    if (ph.hour) this.clock.set(ph.hour);
    if (ph.day) this.day = ph.day;
    for (let i = 0; i < (ph.canvases || 0); i++) this.fakeCanvas(i);
    if (ph.flags.includes('bedroom_canvas')) this.devPaintBedroom();
    if (ph.flags.includes('bridge_down')) this.dropBridge(true);
    if (ph.flags.includes('lock_full')) this.fillSurface(this.surfaces.lock, true);
    if (ph.flags.includes('terrace')) this.devPaintTerrace();
    if (ph.flags.includes('colours_back')) this.gardenPainted(true);
    if (ph.flags.includes('boarded')) this.boardHouse(true);
    if (ph.flags.includes('quarrel')) this.quarrel = 'disagreed';
    if (ph.flags.includes('paul_gone') && this.props.planks) this.props.planks.setVisible(true);
    if (ph.paul) this.paulArrives(true);
    if (ph.flags.includes('bedroom_canvas') && this.foes.find((f) => f.id === 'shopkeeper')) this.F.met_roulin = false;
    this.player.setPosition(px(ph.col), px(ph.row) - 10);
    this.checkpoint = { x: px(ph.col), y: px(ph.row) - 10 };
    this.setObjective(ph.obj);
    this.updateHud();
    if (ph.isak) this.time.delayedCall(400, () => this.afterStarChosen(10));
    return true;
  }

  fakeCanvas(i) {
    const ids = SUBJECTS.filter((s) => s.room !== 'sky').map((s) => s.id);
    const s = subjectById(ids[i % ids.length]);
    const key = `pt-canvas-${this.canvasSeq++}`;
    swatchTexture(this, key, s.requires[0] === 'any' ? ['yellow', 'violet'] : s.requires, key);
    this.canvases.push({ id: s.id, title: s.title, colours: s.requires, thumb: key, day: i + 1 });
    this.updateSatchel();
  }
}

Object.assign(PainterScene.prototype, world, beats);
void VIOLET;
void MOMENTS;
void complementOf;
void recordMoment;
void D;
