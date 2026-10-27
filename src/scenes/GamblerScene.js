import Phaser from 'phaser';
import Player from '../entities/Player.js';
import BaseLevel from './BaseLevel.js';
import RoomBuilder from '../builders/RoomBuilder.js';
import Parallax from '../builders/parallax.js';
import { D } from '../builders/depths.js';
import { lightThemeProps } from '../art/levelArt.js';
import gamblerRooms from '../data/gambler/rooms.js';
import gamblerTiles from '../data/gambler/tiles.js';
import { DIALOGUES, MOMENTS, CARD_LINES, LOU_NOTE } from '../data/gambler/cast.js';
import { createGamblerTextures } from '../data/gambler/sprites.js';
import { DECKS, dealSequence } from '../data/gambler/decks.js';
import { stakeSelector, higherLower, twentyOne, concentration, threeCups, fiveCardDraw, faceUp, roulette } from '../systems/gamblerPuzzles.js';
import { cardTextureKey, rankLabel, SUIT_GLYPH, seededRng } from '../systems/cards.js';
import Pit from '../entities/Pit.js';
import { completeDream, recordMoment, markMet, updateSave } from '../utils/save.js';
import { sfx, music, sting, musicDirector, playTone, trumpet } from '../systems/audio.js';
import { showTutorial } from '../systems/tutorial.js';
import { coinWorth, deductWorth, setPending, addMarker, getMarker, cash, voidPending } from '../systems/wallet.js';

const T = 32;
const px = (tile) => tile * T + T / 2;
const overlaps = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);
const SPEED = 280;
const REEL_SYMBOLS = ['7', 'BAR', '♦', '♥', '♠', '$'];
const REEL_STEP = 10;
const SYMBOL_COLOR = { 7: '#ff3aa0', BAR: '#e9b84a', '♦': '#d5443c', '♥': '#d5443c', '♠': '#e9b84a', $: '#7fb7c9' };

// THE LAST HAND — the dream you don't earn. Chips are house money until a
// cage makes them real; a BET prompt never leaves the screen; every table is
// honest exactly as far as a casino is; and at dawn the only winning move is
// the small dim option where [Esc] usually sits.
export default class GamblerScene extends BaseLevel {
  constructor() {
    super('Gambler');
  }

  // restart reuses the instance: everything per-run starts here
  init() {
    this.F = {};
    this.told = {};
    this.pending = 1; // Jo arrives with one chip
    this.marker = 0;
    this.cashedWorth = 0;
    this.favour = 0;
    this.hasTrumpet = true;
    this.hornWithFavour = false;
    this.interacts = [];
    this.props = {};
    this.tables = [];
    this.cards = [];
    this.reels = [];
    this.wheels = [];
    this.dice = null;
    this.balls = [];
    this.pockets = [];
    this.lift = null;
    this.moments = 0;
    this.stingNotes = 6;
    this.stillSince = 0;
    this.orbCaught = false;
    this.pit = null;
    this.rouletteSpins = 0;
    this.counting = null;
    this.ending = null;
    this.salChip = false;
    this.p5Holder = 'pot';
    this.qCool = 0;
  }

  create() {
    createGamblerTextures(this);
    lightThemeProps(this, ['gm-'], ['gm-sign', 'gm-glow', 'gm-shadow', 'gm-smoke', 'gm-rain', 'gm-mirror', 'gm-card']);

    const built = RoomBuilder.build(this, gamblerRooms, gamblerTiles);
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
    this.cardGroup = this.physics.add.staticGroup();
    this.bridgeGroup = this.physics.add.staticGroup();

    const spawn = { x: px(3), y: px(33) - 10 };
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.tool.setTexture('tool-trumpet');
    this.dreamCoinId = 'gambler';
    markMet('gambler');
    this.setupCommon({ worldW: built.worldW, worldH: built.worldH, levelName: 'DREAM — THE LAST HAND', spawn });

    // §7 — the house wins more, not meaner
    this.snatchMs = this.difficulty >= 2 ? 3000 : 5000;
    this.markerPerCatch = this.difficulty >= 3 ? 4 : 2;
    this.compWeight = this.difficulty >= 2 ? 3 : 1;
    this.pitSpeed = SPEED * (this.difficulty >= 2 ? 0.7 : 0.5);

    this.initFoes('gambler');
    this.enemies = this.foeGroup;
    this.spawnRoomFoes(built.objects);
    for (const f of this.foes) {
      const def = built.objects.find((o) => o.type === 'foe' && o.wx === f.homeX && o.kind === f.kind);
      if (def && def.id) f.id = def.id;
      if (f.kind === 'runner') f.passive = true; // they do not grab: they snatch (updateRunners)
    }
    this.addHideSpots(built.objects);
    this.spawnPickups(built.objects);

    this.buildGates();
    this.buildCheckpoints();
    this.buildWorld();
    this.buildHud();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.oneWays);
    this.physics.add.collider(this.player, this.bridgeGroup);
    this.physics.add.collider(this.player, this.cardGroup, (_p, c) => this.onCard(c));
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.oneWays);
    this.physics.add.collider(this.enemies, this.bridgeGroup);
    this.physics.add.overlap(this.player, this.flags, (_p, f) => this.activateCheckpoint(f));
    this.physics.add.overlap(this.player, this.spikes, () => this.hurt());
    this.physics.add.overlap(this.player, this.orbs, (_p, o) => this.catchOrb(o));

    this.promptText = this.add
      .text(0, 0, '[E]', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580', backgroundColor: '#14101c' })
      .setOrigin(0.5)
      .setDepth(80)
      .setVisible(false);
    this.rain = this.add
      .tileSprite(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width / 0.5, this.cameras.main.height / 0.5, 'gm-rain')
      .setScrollFactor(0)
      .setDepth(85)
      .setAlpha(0);
    // the mirror ceiling over the floor, and the second Jo in it
    this.mirror = this.add.tileSprite(px(100), px(10), 120 * T, 48, 'gm-mirror').setDepth(D.BEHIND).setAlpha(0.9);
    this.mirrorJo = this.add.image(0, 0, 'jo-stand').setDepth(D.BEHIND + 0.5).setFlipY(true).setAlpha(0.45).setTint(0x9a7aa0).setVisible(false);
    this.mirrorLast = { x: 0, y: 0, key: 'jo-stand', flip: false };

    this.pit = new Pit(this, { x: 0, y: 0, speed: this.pitSpeed, onReach: (x, y) => this.pitReaches(x, y) });

    this.setObjective('the door. one chip.');
    this.setMusicMix('arrival');
    this.updateHud();
    if (!this.devWarp()) {
      this.time.delayedCall(900, async () => {
        await this.dialog.show(DIALOGUES.d0);
        this.setFlag('d0');
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
          const img = this.add.image(g.wx, px(r), `${gamblerTiles.key}_s_15_${(g.tx * 7 + r * 13) % 3}`).setTint(0x8a3a4a).setDepth(D.TERRAIN);
          this.physics.add.existing(img, true);
          this.solids.add(img);
          tiles.push(img);
        }
        const light = this.add.circle(g.wx, px(g.ty) - 20, 5, 0xe83a2a).setDepth(20);
        this.add.rectangle(g.wx, px(g.ty) - 20, 22, 3, 0x2a2a34).setDepth(19);
        return { ...g, requires: g.requires || [], tiles, light, open: false };
      });
  }

  refreshGates() {
    for (const g of this.gates) {
      if (!g.open && g.requires.every((f) => this.F[f])) {
        g.open = true;
        g.light.setFillStyle(0x50c878);
        sting.gate();
        g.tiles.forEach((t) => {
          if (t.body) t.body.enable = false;
          this.tweens.add({ targets: t, alpha: 0, duration: 400 });
        });
      }
    }
  }

  buildCheckpoints() {
    this.built.objects.filter((o) => o.type === 'checkpoint').forEach((c) => this.flags.create(c.wx, c.wy, 'flag'));
  }

  addInteract(x, y, label, cb, { radius = 44, once = true, when = () => true, follow = null } = {}) {
    const it = { x, y, label, cb, radius, once, when, follow, used: false };
    this.interacts.push(it);
    return it;
  }

  // a pixel person standing (or sitting) on the ground
  person(id, x, floorY, { flip = false, sit = false } = {}) {
    const key = `gm-p-${id}${sit ? '-sit' : ''}`;
    const img = this.add.image(x, floorY, this.textures.exists(key) ? key : `gm-p-${id}`).setOrigin(0.5, 1).setDepth(11).setFlipX(flip);
    this.add.image(x, floorY - 1, 'gm-shadow').setDepth(10.5).setAlpha(0.7);
    this.tweens.add({ targets: img, scaleY: 1.015, duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'sine.inout' });
    return img;
  }

  walkPerson(img, id, toX, cb) {
    const from = img.x;
    const dist = Math.abs(toX - from);
    img.setFlipX(toX < from);
    const state = { d: 0 };
    this.tweens.add({
      targets: state,
      d: dist,
      duration: (dist / 70) * 1000,
      onUpdate: () => {
        img.x = from + Math.sign(toX - from) * state.d;
        const stride = (Math.floor(state.d / 14) % 8) + 1;
        const k = `gm-p-${id}#${stride}`;
        if (this.textures.exists(k)) img.setTexture(k);
      },
      onComplete: () => {
        img.setTexture(`gm-p-${id}`);
        if (cb) cb();
      },
    });
  }

  roomOf(o) {
    return this.built.rooms.find((r) => r.id === o.room);
  }

  // ---------- chips: house money ----------------------------------------

  addChips(n, why, { quiet = false } = {}) {
    this.pending = Math.max(0, this.pending + n);
    setPending(this.pending);
    if (!quiet && n > 0) this.floatText(this.player.x, this.player.y - 64, `+${n} chip${n > 1 ? 's' : ''}${why ? ` — ${why}` : ''}  (pending)`, '#f2d580');
    if (!quiet && n < 0) this.floatText(this.player.x, this.player.y - 64, `${n} chip${n < -1 ? 's' : ''}${why ? ` — ${why}` : ''}`, '#c8c0b0');
    this.updateHud();
    this.checkPit();
  }

  addDebt(n, why) {
    this.marker += n;
    addMarker(n);
    this.floatText(this.player.x, this.player.y - 80, `MARKER +${n}${why ? ` — ${why}` : ''}`, '#e86a6a');
    sfx('adding');
    this.updateHud();
  }

  // the big one. Gold confetti, a swell, chips raining into the stack, and
  // the brass stinger — which is 7% shorter every time it plays (§4).
  winFx(n, { big = false } = {}) {
    const cam = this.cameras.main;
    const count = big ? 70 : 36;
    for (let i = 0; i < count; i++) {
      const c = this.add
        .rectangle(cam.width / 2 + Phaser.Math.Between(-220, 220), cam.height / 2 - 160 + Phaser.Math.Between(-30, 30), Phaser.Math.Between(3, 6), Phaser.Math.Between(6, 10), i % 3 ? 0xe9b84a : 0xff3aa0)
        .setScrollFactor(0)
        .setDepth(320)
        .setAngle(Phaser.Math.Between(0, 180));
      this.tweens.add({ targets: c, y: c.y + Phaser.Math.Between(260, 420), x: c.x + Phaser.Math.Between(-60, 60), angle: c.angle + 360, alpha: 0, duration: Phaser.Math.Between(1200, 2200), ease: 'quad.in', onComplete: () => c.destroy() });
    }
    for (let i = 0; i < Math.min(12, n + 2); i++) {
      const chip = this.add.image(cam.width / 2 + Phaser.Math.Between(-120, 120), -20, 'gm-chip').setScrollFactor(0).setDepth(321).setScale(1.5);
      this.tweens.add({ targets: chip, y: cam.height - 60, duration: 600 + i * 60, ease: 'bounce.out', delay: i * 70, onComplete: () => this.tweens.add({ targets: chip, alpha: 0, duration: 400, onComplete: () => chip.destroy() }) });
    }
    cam.flash(180, 240, 200, 120);
    this.playStinger();
  }

  playStinger(full = false) {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    const n = full ? notes.length : Math.max(1, Math.round(this.stingNotes));
    try {
      for (let i = 0; i < n; i++) playTone(notes[i], 0.32, 'square', 0.16, i * 0.11);
      playTone(392, 0.9, 'triangle', 0.1, 0);
    } catch {
      /* silent */
    }
    if (!full) this.stingNotes = Math.max(1, this.stingNotes * 0.93);
  }

  // the small one. One chip slides away, a tick.
  lossFx() {
    const cam = this.cameras.main;
    const chip = this.add.image(cam.width / 2, cam.height / 2 + 150, 'gm-chip').setScrollFactor(0).setDepth(321);
    this.tweens.add({ targets: chip, x: chip.x + 160, alpha: 0, duration: 700, ease: 'sine.in', onComplete: () => chip.destroy() });
    sfx('tick');
  }

  checkPit() {
    const room = this._room && this._room.id;
    if (this.pending > 10 && !this.pit.active && (room === 'floor' || room === 'lounge')) {
      const r = this._room;
      this.pit.start(Math.max(r._x0 * T + 60, this.player.x - 520), this.player.y + 22);
    } else if (this.pending <= 10 && this.pit.active) this.pit.stop();
  }

  pitReaches(x, y) {
    for (const t of this.tables) {
      if (!t.closed && t.game === 'wheel' && Math.abs(t.x - x) < 56 && Math.abs(t.floor - y) < 60) {
        t.closed = true;
        t.label.setText(`${t.name} — CLOSED`).setColor('#8a8478');
        this.floatText(t.x, t.floor - 70, 'the Pit closes the table.', '#c8c0b0');
        sfx('snap');
      }
    }
  }

  cashAt(cage) {
    showTutorial(this, 'cage');
    if (this.pending <= 0) {
      this.floatText(cage.x, cage.floor - 60, 'nothing pending.', '#c8c0b0');
      return;
    }
    const r = cash('gambler');
    this.pending = 0;
    this.marker = r.debt - r.paid;
    this.cashedWorth += r.remainder * coinWorth('gambler');
    sfx('buy');
    const lines = [`${r.chips} chips`];
    if (r.debt > 0) lines.push(`→ marker −${r.paid}`);
    lines.push(`→ $${r.remainder * coinWorth('gambler')} real`);
    this.floatText(cage.x, cage.floor - 70, lines.join('  '), r.remainder > 0 ? '#f2d580' : '#e86a6a');
    if (!this.F.cashed_once) this.setFlag('cashed_once');
    this.updateHud();
  }

  // ---------- the trumpet ----------------------------------------------

  setTrumpet(on, why) {
    this.hasTrumpet = on;
    // (Player re-shows the tool every frame: an empty texture is how it hides)
    this.player.tool.setTexture(on ? 'tool-trumpet' : 'gm-none');
    this.setMusicMix(this._room ? this._room.id : 'arrival');
    if (!on) {
      showTutorial(this, 'no_trumpet');
      this.floatText(this.player.x, this.player.y - 70, why || 'the horn is gone.', '#c8c0b0');
    } else {
      this.floatText(this.player.x, this.player.y - 70, why || 'the horn is back.', '#f2d580');
      try {
        trumpet(7, 0.6, 0.3);
      } catch {
        /* silent */
      }
    }
    this.updateHud();
  }

  // the trumpet (Q): a note. Rings a checkpoint from a distance, turns
  // security's heads, and in the lounge gets Jo caught.
  noiseBurst() {
    if (!this.hasTrumpet) return;
    const p = this.player;
    try {
      trumpet(4 + (Math.floor(this.time.now / 700) % 5), 0.3, 0.25);
    } catch {
      /* silent */
    }
    const ring = this.add.circle(p.x, p.y, 10, 0xf2e0a0, 0).setStrokeStyle(2, 0xf2e0a0).setDepth(30);
    this.tweens.add({ targets: ring, radius: 140, alpha: 0, duration: 500, onUpdate: () => ring.setRadius(ring.radius) });
    for (const f of this.flags.getChildren()) {
      if (f.texture.key === 'flag' && Phaser.Math.Distance.Between(p.x, p.y, f.x, f.y) < 150) {
        this.activateCheckpoint(f);
        this.floatText(f.x, f.y - 40, 'rung.', '#f2d580');
      }
    }
    for (const f of this.foes) {
      if (!f.active) continue;
      const d = Math.abs(f.x - p.x);
      if (f.kind === 'bouncer' && d < 280) {
        f.enter('alert', 0);
        f.seenPlayerAt = this.time.now;
        f.setFlipX(p.x < f.x);
        this.floatText(f.x, f.y - 50, 'no noise in here.', '#e86a6a');
      } else if (f.kind === 'security' && d < 240) f.distract(p.x);
    }
    if (this._room && this._room.id === 'lounge' && this.pianist && Math.abs(this.pianist.x - p.x) < 120) this.duet();
  }

  // ---------- the world --------------------------------------------------

  buildWorld() {
    const B = this.built.objects;
    for (const o of B) {
      const floor = (o.ty + 1) * T;
      switch (o.type) {
        case 'prop':
          this.buildProp(o, floor);
          break;
        case 'npc':
          this.buildNpc(o, floor);
          break;
        case 'dialogue':
          (this.dialogueZones ||= []).push({ ...o, done: false });
          break;
        case 'panel':
          if (o.puzzle === 'p1') this.buildDoorGame(o, floor);
          break;
        case 'table':
          this.buildTable(o, floor);
          break;
        case 'card':
          this.buildCard(o);
          break;
        case 'mural':
          this.buildMural(o, floor);
          break;
        case 'reel':
          this.buildReel(o);
          break;
        case 'wheel':
          this.buildWheel(o, floor);
          break;
        case 'dice':
          this.buildDice(o, floor);
          break;
        case 'cage':
          this.buildCage(o, floor);
          break;
        case 'comp':
          this.buildComp(o, floor);
          break;
        case 'ball':
          this.buildBall(o, floor);
          break;
        case 'pocket':
          this.add.image(o.wx, floor, 'gm-pocket').setOrigin(0.5, 1).setDepth(8);
          this.pockets.push({ ...o, floor, sunk: false });
          break;
        case 'lift':
          this.buildLift(o, floor);
          break;
        case 'window':
          this.buildMarkerWindow(o, floor);
          break;
        case 'pawn':
          this.buildPawn(o, floor);
          break;
        case 'safe':
          this.buildSafe(o, floor);
          break;
        case 'vent':
          this.vent = { x: o.wx, y: o.wy };
          this.add.image(o.wx, o.wy, 'gm-vent').setDepth(7);
          break;
        case 'lamp':
          this.buildLamp(o, floor);
          break;
        case 'smoke': {
          const s = this.add.image(o.wx, o.wy, 'gm-smoke').setDepth(14).setAlpha(0.8).setScale(2.2, 1.6);
          this.tweens.add({ targets: s, x: o.wx + 40, alpha: 0.5, duration: 5000, yoyo: true, repeat: -1, ease: 'sine.inout' });
          this.smoke = s;
          break;
        }
        case 'barrier':
          this.buildBarrier(o, floor);
          break;
        case 'van':
          this.buildVan(o, floor);
          break;
        case 'wet':
          break; // the grease tiles are in the grid; this marks the puddle
        case 'orb':
          this.orbAt = { x: o.wx, y: o.wy };
          break;
        case 'moment':
          this.moment(o.id, o.wx, o.wy);
          break;
        default:
          break;
      }
    }
    // the neon sign over the arrival, and the rain
    this.sign = this.add.image(px(20), px(16), 'gm-sign').setDepth(D.BEHIND).setScale(1.6);
    this.signGlow = this.add.image(px(20), px(16), 'gm-glow-pink').setDepth(D.BEHIND - 0.5).setScale(9, 4).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: this.sign, alpha: 0.82, duration: 90, yoyo: true, repeat: -1, repeatDelay: 2600 });
    // the chip fountain: the most beautiful pile of money in the game, and
    // none of it can be picked up
    if (this.fountain) this.buildFountain(this.fountain);
    // birds over the car park, once it is light
    this.birds = [];
    for (let i = 0; i < 6; i++) {
      const b = this.add.text(px(340 + i * 24), px(8 + (i % 3) * 2), '~', { fontFamily: 'monospace', fontSize: '12px', color: '#2a2e3a' }).setDepth(D.BEHIND);
      b.baseX = b.x;
      this.birds.push(b);
    }
    // the Collector is in his corridor: a word outside is a bigger marker
    const collector = this.foes.find((f) => f.kind === 'collector');
    if (collector) collector.setFlipX(true);
  }

  buildProp(o, floor) {
    const key = `gm-${o.kind.replace(/_/g, '-')}`;
    if (!this.textures.exists(key)) return;
    const depth = o.kind === 'car' || o.kind === 'shelter' || o.kind === 'booth' ? 6 : 9;
    const img = this.add.image(o.wx, o.kind === 'umbrellas' ? o.wy + 16 : floor, key).setOrigin(0.5, 1).setDepth(depth);
    if (o.id) this.props[o.id] = img;
    if (o.kind === 'fountain') this.fountain = { x: o.wx, floor, img };
    if (o.kind === 'box') this.buildBox(o, floor, img);
    if (o.kind === 'car') img.setAlpha(0.9);
    if (o.kind === 'door') {
      // the revolving door turns
      this.tweens.add({ targets: img, scaleX: 0.3, duration: 1400, yoyo: true, repeat: -1, ease: 'sine.inout' });
    }
    if (o.kind === 'piano') this.piano = { x: o.wx, floor };
  }

  buildFountain({ x, floor }) {
    this.add.image(x, floor - 70, 'gm-glow').setDepth(7).setScale(3.4).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setTint(0xe84a5a);
    this.fountainChips = [];
    for (let i = 0; i < 28; i++) {
      const c = this.add.image(x + Phaser.Math.Between(-40, 40), floor - 30 - Phaser.Math.Between(0, 20), `coin-gambler-${i % 4}`).setDepth(8).setScale(0.8);
      this.fountainChips.push({ img: c, t: Math.random() * Math.PI * 2, x0: c.x, y0: c.y });
    }
    // chips in the air, falling into the pile forever
    this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        if (!this.cameras.main.worldView.contains(x, floor - 60)) return;
        const c = this.add.image(x + Phaser.Math.Between(-10, 10), floor - 110, `coin-gambler-${Phaser.Math.Between(0, 3)}`).setDepth(8).setScale(0.7);
        this.tweens.add({ targets: c, x: c.x + Phaser.Math.Between(-46, 46), y: floor - 34, duration: 700, ease: 'quad.in', onComplete: () => c.destroy() });
        this.tweens.add({ targets: c, angle: Phaser.Math.Between(-180, 180), duration: 700 });
      },
    });
    this.add.text(x, floor - 126, 'THE MERIDIAN FOUNTAIN', { fontFamily: 'monospace', fontSize: '9px', color: '#e9b84a' }).setOrigin(0.5).setDepth(8).setAlpha(0.8);
  }

  buildLamp(o, floor) {
    if (o.kind === 'sodium') {
      this.add.image(o.wx, floor, 'gm-lamp-post').setOrigin(0.5, 1).setDepth(6);
      this.add.image(o.wx, floor - 40, 'gm-glow').setDepth(7).setScale(2.4).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setTint(0xf2b060);
    } else if (o.kind === 'bulb') {
      const b = this.add.image(o.wx, (o.ty - 10) * T, 'gm-bulb').setOrigin(0.5, 0).setDepth(6);
      const g = this.add.image(o.wx, (o.ty - 10) * T + 20, 'gm-glow').setDepth(7).setScale(2.6).setAlpha(0.26).setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff2c0);
      this.tweens.add({ targets: [b, g], x: o.wx + 3, duration: 1900 + Math.random() * 800, yoyo: true, repeat: -1, ease: 'sine.inout' });
      this.tweens.add({ targets: g, alpha: 0.18, duration: 110, yoyo: true, repeat: -1, repeatDelay: 2300 + Math.random() * 3000 });
    } else if (o.kind === 'big' || o.kind === 'baize') {
      const y = o.kind === 'big' ? floor - 170 : floor - 120;
      this.add.image(o.wx, y, 'gm-biglamp').setOrigin(0.5, 0).setDepth(6);
      this.add.image(o.wx, y + 60, 'gm-glow').setDepth(7).setScale(o.kind === 'big' ? 4.5 : 3.2).setAlpha(0.32).setBlendMode(Phaser.BlendModes.ADD);
      // the pool of light on the felt
      this.add.ellipse(o.wx, floor - 2, o.kind === 'big' ? 220 : 160, 26, 0xf2e0a0, 0.12).setDepth(5);
    }
  }

  buildNpc(o, floor) {
    const who = o.who;
    const img = this.person(who, o.wx, floor, { flip: true, sit: !!o.sit });
    this.props[o.id || who] = img;
    if (o.behind) img.setAlpha(0.8).setDepth(7);
    if (who === 'pianist') this.pianist = img;
    if (who === 'lou') {
      this.lou = img;
      this.addInteract(o.wx, floor - 20, 'Lou', async () => this.dialog.show(this.F.first_win ? DIALOGUES.d2 : DIALOGUES.lou_open), { once: false, when: () => !this.nearTable || this.nearTable.closed });
    }
    if (who === 'favour' && o.id === 'favour') {
      this.addInteract(o.wx, floor - 20, 'Mr. Favour', async () => {
        if (!this.F.coat_taken) {
          const choice = await this.dialog.show(DIALOGUES.d3);
          this.setFlag('coat_taken');
          this.player.bodyTint = 0xd8d8e8; // the coat is gone; the jacket shows
          if (choice === 'hand') {
            this.hornWithFavour = true;
            await this.dialog.show(DIALOGUES.d3_hand);
            this.setTrumpet(false, 'the horn goes to the cloakroom.');
            this.satchel = ['TICKET'];
            this.updateSatchelHud();
          } else {
            await this.dialog.show(DIALOGUES.d3_keep);
            this.lounge_watch = true;
          }
          this.setObjective('the high-roller key: his game');
        } else if (!this.F.key) await this.dialog.show(DIALOGUES.favour_game);
        else await this.dialog.show(DIALOGUES.favour_key);
      }, { once: false, when: () => !this.nearTable || this.nearTable.id !== 't_favour' || !this.F.coat_taken || this.F.key });
    }
    if (who === 'sal' && o.id === 'sal') {
      this.salImg = img;
      this.addInteract(o.wx, floor - 20, 'Sal', async () => {
        if (this.F.sal) return this.dialog.show(this.salChip ? DIALOGUES.d7_take : DIALOGUES.d7_keep);
        const choice = await this.dialog.show(DIALOGUES.d7);
        this.setFlag('sal');
        if (choice === 'take') {
          this.salChip = true;
          this.setFlag('sal_chip');
          await this.dialog.show(DIALOGUES.d7_take);
          this.addChips(1, "Sal's chip");
          // he goes home with none, waving
          this.walkPerson(img, 'sal', o.wx + 240, () => this.tweens.add({ targets: img, alpha: 0, duration: 800 }));
          this.floatText(img.x, floor - 70, '(he waves)', '#c8c0b0');
        } else await this.dialog.show(DIALOGUES.d7_keep);
        this.floatText(o.wx - 60, floor - 90, 'the bus leaves without him.', '#c8c0b0');
        this.setObjective('the ramp: a table between two cars');
      }, { once: false });
    }
    if (who === 'dede' && o.id === 'dede2') this.cashier = img;
    if (who === 'security' && o.id === 'doorman') this.doorman = img;
  }

  // P1 — the door game, at the revolving door
  buildDoorGame(o, floor) {
    this.addInteract(o.wx, floor - 20, 'higher or lower', async () => {
      if (!this.told.d0b) {
        this.told.d0b = true;
        await this.dialog.show(DIALOGUES.d0b);
      }
      const r = await higherLower(this);
      if (r && r.won) {
        this.addChips(2, 'the door game');
        this.winFx(2);
        this.setFlag('p1');
        this.setObjective('the floor');
        sting.secret();
      }
    }, { once: false, when: () => !this.F.p1 });
  }

  // ---------- tables and the BET prompt ------------------------------------

  buildTable(o, floor) {
    const t = { ...o, x: o.wx, floor, closed: false };
    // the felt and its lamp-lit label
    this.add.rectangle(o.wx, floor - 14, 76, 20, 0x245a3a).setDepth(7).setStrokeStyle(2, 0x8a5a24);
    this.add.rectangle(o.wx - 30, floor - 2, 6, 10, 0x4a3a2a).setDepth(7);
    this.add.rectangle(o.wx + 30, floor - 2, 6, 10, 0x4a3a2a).setDepth(7);
    this.add.image(o.wx - 20, floor - 26, 'gm-chipstack').setDepth(8).setScale(0.8);
    t.label = this.add.text(o.wx, floor - 40, o.name, { fontFamily: 'monospace', fontSize: '9px', color: '#e9b84a' }).setOrigin(0.5).setDepth(8);
    this.tables.push(t);
  }

  async openTable(t) {
    if (t.closed) {
      this.floatText(t.x, t.floor - 60, 'closed.', '#c8c0b0');
      return;
    }
    showTutorial(this, 'bet');
    const chips = this.pending;
    const hearts = this.lives;
    switch (t.game) {
      case 'wheel': {
        const stake = await stakeSelector(this, { chips, hearts, odds: 'even money on a colour, 35:1 on a number', name: 'ROULETTE' });
        if (!stake) return;
        const r = await roulette(this, stake);
        if (!r) return;
        this.settle(stake, r.won, r.mult, 'roulette');
        break;
      }
      case 'p2': {
        if (this.F.first_win) {
          await this.dialog.show(DIALOGUES.d2);
          return;
        }
        if (!this.told.lou) {
          this.told.lou = true;
          await this.dialog.show(DIALOGUES.lou_open);
        }
        const stake = await stakeSelector(this, { chips, hearts, odds: 'even money, blackjack 3:2, ties to the house', name: 'TWENTY-ONE' });
        if (!stake) return;
        const r = await twentyOne(this, stake, { chips, hearts, difficulty: this.difficulty });
        if (!r) return;
        if (r.netChips) this.addChips(r.netChips, 'twenty-one');
        if (r.netHearts) this.changeHearts(r.netHearts);
        if (r.won) {
          this.setFlag('first_win');
          this.satchel = ['LOUNGE TICKET'];
          this.updateSatchelHud();
          sting.secret();
          this.floatText(t.x, t.floor - 70, 'THE LOUNGE TICKET — Lou slides it over.', '#f2d580');
          this.setObjective('the lounge: the curved stair');
          await this.dialog.show(DIALOGUES.d2);
        }
        break;
      }
      case 'p3': {
        if (!this.F.coat_taken) {
          this.floatText(t.x, t.floor - 60, 'he is waiting to take your coat.', '#c8c0b0');
          return;
        }
        if (this.F.key) return;
        const r = await concentration(this, { difficulty: this.difficulty });
        if (!r) return;
        if (r.won) {
          this.setFlag('key');
          this.satchel = [...this.satchel.filter((s) => s !== 'LOUNGE TICKET'), 'HIGH-ROLLER KEY'];
          this.updateSatchelHud();
          sting.secret();
          this.winFx(3, { big: true });
          await this.dialog.show(DIALOGUES.favour_key);
          this.setObjective('the billiards room: three balls, then the lift');
        } else {
          this.lossFx();
          await this.dialog.show(DIALOGUES.favour_again);
          this.loseHeart();
        }
        break;
      }
      case 'p4': {
        if (this.F.p4) {
          this.floatText(t.x, t.floor - 60, 'he has packed the cups away.', '#c8c0b0');
          return;
        }
        const stake = await stakeSelector(this, { chips, hearts: 0, odds: 'two to one', name: 'THREE CUPS' });
        if (!stake) return;
        const r = await threeCups(this, stake, { chips, difficulty: this.difficulty });
        if (!r) return;
        if (r.net) this.addChips(r.net, 'three cups');
        this.setFlag('p4');
        if (r.lostThird) {
          this.setFlag('marker_offer');
          this.setObjective('the window at the end. or the pawn hatch.');
          await this.collectorOffer();
        } else this.setObjective('the safe door takes twenty-five');
        break;
      }
      case 'p5':
        await this.pokerRoom(t);
        break;
      case 'p6':
        await this.lastHand(t);
        break;
      default:
        break;
    }
  }

  settle(stake, won, mult, why) {
    if (stake.kind === 'chips') {
      if (won) {
        this.addChips(stake.n * mult, why);
        this.winFx(stake.n * mult, { big: mult > 1 || stake.n >= 5 });
      } else {
        this.addChips(-stake.n, why, { quiet: true });
        this.lossFx();
      }
    } else {
      if (won) {
        this.changeHearts(1);
        this.winFx(1, { big: true });
      } else {
        this.lossFx();
        this.loseHeart();
      }
    }
  }

  changeHearts(n) {
    if (n > 0) {
      const before = this.lives;
      this.lives = Math.min(this.maxLives, this.lives + n);
      this.floatText(this.player.x, this.player.y - 80, this.lives > before ? 'a heart. real.' : 'a heart. he has them all.', '#e86a6a');
      this.updateHearts();
    } else for (let i = 0; i < -n; i++) this.loseHeart();
  }

  // Jo at a table, still, too long: a runner takes a stack
  updateRunners(time) {
    const p = this.player;
    const t = this.nearTable;
    const still = Math.abs(p.body.velocity.x) < 6 && p.body.blocked.down;
    if (!t || !still || this.puzzleActive || this.dialogActive) {
      this.stillSince = time;
      return;
    }
    if (time - this.stillSince > this.snatchMs && this.pending > 0) {
      const runner = this.foes.find((f) => f.kind === 'runner' && f.active && Math.abs(f.y - p.y) < 80 && Math.abs(f.x - p.x) < 520);
      if (!runner) return;
      this.stillSince = time + 4000;
      const take = Math.min(3, this.pending);
      const fromX = runner.x;
      this.tweens.add({ targets: runner, x: p.x + (p.x < runner.x ? 26 : -26), duration: 320, ease: 'quad.in', onComplete: () => {
        this.addChips(-take, 'a chip runner', { quiet: true });
        this.floatText(p.x, p.y - 64, `−${take} — a runner takes a stack.`, '#e86a6a');
        sfx('snap');
        this.tweens.add({ targets: runner, x: fromX, duration: 700, ease: 'quad.out' });
      } });
    }
  }

  // ---------- the Deal: card platforms ---------------------------------------

  buildCard(o) {
    const seq = (this.dealCache ||= {});
    if (!seq[o.deck]) {
      const n = this.built.objects.filter((c) => c.type === 'card' && c.deck === o.deck).length;
      seq[o.deck] = dealSequence(o.deck, n, this.difficulty);
    }
    const card = seq[o.deck][o.index];
    const img = this.add.image(o.wx, o.wy, 'gm-card-back').setDisplaySize(30, 42).setDepth(D.TERRAIN + 1);
    this.physics.add.existing(img, true);
    img.body.setSize(30, 10).setOffset(0, 0);
    img.body.checkCollision.down = false;
    img.body.checkCollision.left = false;
    img.body.checkCollision.right = false;
    this.cardGroup.add(img);
    this.add.rectangle(o.wx, o.wy - 40, 1, 36, 0x8a5a24, 0.5).setDepth(D.TERRAIN); // the thread it hangs by
    const c = { ...o, img, card, flipped: false, kind: card.kind };
    img.deal = c;
    this.cards.push(c);
  }

  onCard(img) {
    const c = img.deal;
    const p = this.player;
    if (!c || c.flipped || !p.body.touching.down) return;
    if (p.y + 22 > img.y - 2) return; // only from above
    c.flipped = true;
    showTutorial(this, 'deal');
    img.setTexture(cardTextureKey(this, c.card));
    img.setDisplaySize(30, 42);
    sfx('clack');
    if (c.kind === 'face') {
      // flipped off backward: a one-tile launch the way he came
      const dir = p.flipX ? 1 : -1;
      p.body.setVelocity(dir * 230, -330);
      p.controlLockUntil = this.time.now + 220;
      this.floatText(img.x, img.y - 30, `${rankLabel(c.card.r)}${SUIT_GLYPH[c.card.s]} — a face.`, '#e86a6a');
      img.body.enable = false;
      this.tweens.add({ targets: img, angle: 40, y: img.y + 20, alpha: 0.4, duration: 400, yoyo: true, onComplete: () => {
        img.body.enable = true;
        img.setAngle(0).setAlpha(1);
      } });
    } else if (c.kind === 'ace') {
      sting.secret();
      this.floatText(img.x, img.y - 30, 'an ace.', '#f2d580');
      if (this.coinMgr) this.coinMgr.spawn(img.x, img.y - 50);
      img.setTint(0xfff2c0);
    }
  }

  // the room's deck, shown: a tray of small cards in order
  buildMural(o, floor) {
    const deck = DECKS[o.deck];
    if (!deck || !deck.shown) return;
    const seq = (this.dealCache ||= {})[o.deck] || dealSequence(o.deck, 12, this.difficulty);
    const w = seq.length * 16 + 20;
    this.add.rectangle(o.wx, floor - 30, w, 44, 0x1a0e14, 0.9).setDepth(6).setStrokeStyle(1, 0x8a5a24);
    this.add.text(o.wx, floor - 52, 'DISCARDS — IN ORDER', { fontFamily: 'monospace', fontSize: '8px', color: '#e9b84a' }).setOrigin(0.5).setDepth(6);
    seq.forEach((c, i) => {
      this.add.image(o.wx - w / 2 + 14 + i * 16, floor - 28, cardTextureKey(this, c)).setScale(0.8).setDepth(6).setAngle(-6 + (i % 3) * 6);
    });
  }

  // ---------- the slot reels ----------------------------------------------------

  buildReel(o) {
    const rng = seededRng(`reel-${o.id}`);
    // thirteen symbols and ten steps a spin: every position comes round
    const strip = Array.from({ length: 13 }, () => REEL_SYMBOLS[rng.between(0, REEL_SYMBOLS.length - 1)]);
    strip[2] = '7';
    strip[5] = 'BAR';
    strip[9] = '7';
    const topY = o.ty * T;
    const x = o.wx;
    // the window on the wall beside the reel: the symbol now, and the two to come
    const bg = this.add.rectangle(x, topY - 60, 36, 96, 0x1a0e14, 0.92).setDepth(6).setStrokeStyle(2, 0xe9b84a);
    void bg;
    const texts = [0, 1, 2].map((i) => this.add.text(x, topY - 92 + i * 32, '', { fontFamily: 'monospace', fontSize: i === 0 ? '18px' : '12px', color: '#e8dcc8' }).setOrigin(0.5).setDepth(7));
    this.add.rectangle(x, topY - 92, 34, 26, 0xe9b84a, 0).setDepth(7).setStrokeStyle(1, 0xff3aa0);
    const topTile = this.solids.getChildren().find((img) => img.tx === o.tx && img.ty === o.ty);
    const reel = { ...o, x, topY, strip, idx: 0, texts, spinning: false, onIt: false, topTile };
    this.reels.push(reel);
    this.renderReel(reel);
  }

  // the window: the symbol showing, then what the next landing brings, and the one after
  renderReel(r) {
    for (let i = 0; i < 3; i++) {
      const s = r.strip[(r.idx + i * REEL_STEP) % r.strip.length];
      r.texts[i].setText(s).setColor(i === 0 ? SYMBOL_COLOR[s] : '#8a8478');
    }
  }

  spinReel(r) {
    if (r.spinning) return;
    r.spinning = true;
    showTutorial(this, 'reel');
    let n = 0;
    const ev = this.time.addEvent({
      delay: 70,
      repeat: REEL_STEP - 1,
      callback: () => {
        n += 1;
        r.idx = (r.idx + 1) % r.strip.length;
        this.renderReel(r);
        sfx('tick');
        if (n === REEL_STEP) {
          r.spinning = false;
          this.cameras.main.shake(80, 0.002);
          this.checkReels(r);
          ev.remove();
        }
      },
    });
  }

  checkReels(landed) {
    const syms = this.reels.map((r) => r.strip[r.idx]);
    const all = syms.every((s) => s === syms[0]);
    if (!all) return;
    if (syms[0] === '7') {
      if (!this.F.slots777) {
        this.setFlag('slots777');
        sting.secret();
        this.floatText(landed.x, landed.topY - 120, '7 · 7 · 7 — a door opens somewhere up here.', '#ff3aa0');
      }
    } else if (syms[0] === 'BAR') {
      // the reel drops a floor: its top tile gives way under him
      this.floatText(landed.x, landed.topY - 120, 'BAR · BAR · BAR — the reel drops.', '#e86a6a');
      sfx('crack');
      const tile = landed.topTile;
      if (tile && tile.body) {
        tile.body.enable = false;
        this.tweens.add({ targets: tile, alpha: 0.2, duration: 150 });
        this.time.delayedCall(2500, () => {
          tile.body.enable = true;
          this.tweens.add({ targets: tile, alpha: 1, duration: 300 });
        });
      }
    } else {
      this.floatText(landed.x, landed.topY - 120, 'three of a kind. a chip.', '#f2d580');
      if (this.coinMgr) this.coinMgr.spawn(landed.x, landed.topY - 60);
      sting.secret();
    }
  }

  updateReels() {
    const p = this.player;
    for (const r of this.reels) {
      const on = p.body.blocked.down && Math.abs(p.x - r.x) < 18 && Math.abs(p.y + 22 - r.topY) < 8;
      if (on && !r.onIt) this.spinReel(r);
      r.onIt = on;
    }
  }

  // ---------- roulette doors ----------------------------------------------------

  buildWheel(o, floor) {
    const y = floor - 74;
    const img = this.add.image(o.wx, y, 'gm-wheel').setDepth(8);
    const ball = this.add.circle(o.wx, y - 20, 4, 0xf2eee4).setDepth(9);
    const mark = this.add.text(o.wx, y - 46, `STOP ON ${o.colour.toUpperCase()}`, { fontFamily: 'monospace', fontSize: '9px', color: o.colour === 'red' ? '#e84a5a' : '#e8dcc8' }).setOrigin(0.5).setDepth(9);
    const w = { ...o, img, ball, mark, y, angle: 0, omega: 5.2, stopping: false, travel: 0, done: false };
    this.wheels.push(w);
    this.addInteract(o.wx, floor - 20, 'stop the wheel', () => {
      if (w.stopping) return;
      showTutorial(this, 'wheel');
      w.stopping = true;
      w.travel = Math.PI * 4.5; // the ball always runs two and a quarter turns more
      sfx('click');
    }, { once: false, when: () => !w.done });
  }

  updateWheels(dt) {
    for (const w of this.wheels) {
      if (w.done) continue;
      let step = w.omega * dt;
      if (w.stopping) {
        step = Math.min(w.travel, Math.max(0.6, w.travel * 1.6) * dt);
        w.travel -= step;
        if (w.travel <= 0.001) {
          w.stopping = false;
          const pocket = Math.floor(((w.angle % (Math.PI * 2)) / (Math.PI * 2)) * 38);
          const green = pocket === 0 || pocket === 19;
          const colour = green ? 'green' : pocket % 2 ? 'red' : 'black';
          if (colour === w.colour) {
            w.done = true;
            this.setFlag(w.opens === 'g_roulette' ? 'wheel1' : w.opens);
            this.floatText(w.img.x, w.y - 60, `${colour}. the door opens.`, '#f2d580');
            sting.secret();
          } else {
            this.floatText(w.img.x, w.y - 60, `${colour}. no.`, '#c8c0b0');
            sfx('tick');
          }
        }
      }
      w.angle += step;
      w.img.setRotation(w.angle);
      w.ball.setPosition(w.img.x + Math.cos(w.angle - Math.PI / 2) * 20, w.y + Math.sin(w.angle - Math.PI / 2) * 20);
    }
  }

  // ---------- the dice bridge ------------------------------------------------------

  buildDice(o, floor) {
    const plate = this.add.rectangle(o.wx, floor - 3, 30, 6, 0xe9b84a).setDepth(8);
    this.add.text(o.wx, floor - 20, 'ROLL', { fontFamily: 'monospace', fontSize: '8px', color: '#e9b84a' }).setOrigin(0.5).setDepth(8);
    const b = o.bridge;
    const wallX = px((b.x0 + b.x1) / 2);
    const wallY = px(b.y - 8);
    const d1 = this.add.image(wallX - 50, wallY, 'gm-dice').setScale(3).setDepth(6).setAlpha(0.25);
    const d2 = this.add.image(wallX + 50, wallY, 'gm-dice').setScale(3).setDepth(6).setAlpha(0.25);
    const t1 = this.add.text(wallX - 50, wallY, '', { fontFamily: 'monospace', fontSize: '40px', color: '#1a1a20', fontStyle: 'bold' }).setOrigin(0.5).setDepth(7);
    const t2 = this.add.text(wallX + 50, wallY, '', { fontFamily: 'monospace', fontSize: '40px', color: '#1a1a20', fontStyle: 'bold' }).setOrigin(0.5).setDepth(7);
    const sum = this.add.text(wallX, wallY + 70, '', { fontFamily: 'monospace', fontSize: '14px', color: '#e9b84a' }).setOrigin(0.5).setDepth(7);
    this.dice = { ...o, plate, floor, d1, d2, t1, t2, sum, rolled: 0, tiles: [], rng: seededRng('dice'), rolling: false };
    this.addInteract(o.wx, floor - 20, 're-roll (1 chip)', () => {
      if (this.pending < 1) {
        this.floatText(o.wx, floor - 60, 'a chip to re-roll. none left.', '#c8c0b0');
        return;
      }
      this.addChips(-1, 're-roll', { quiet: true });
      this.rollDice();
    }, { once: false, when: () => this.dice.rolled > 0 && !this.dice.rolling });
  }

  rollDice() {
    const d = this.dice;
    if (d.rolling) return;
    d.rolling = true;
    showTutorial(this, 'dice');
    d.tiles.forEach((t) => t.destroy());
    d.tiles = [];
    d.d1.setAlpha(1);
    d.d2.setAlpha(1);
    let n = 0;
    const ev = this.time.addEvent({
      delay: 80,
      repeat: 11,
      callback: () => {
        n += 1;
        d.t1.setText(String(d.rng.between(1, 6)));
        d.t2.setText(String(d.rng.between(1, 6)));
        sfx('tick');
        if (n === 12) {
          const a = d.rng.between(1, 6);
          const b = d.rng.between(1, 6);
          d.t1.setText(String(a));
          d.t2.setText(String(b));
          const roll = a + b;
          d.rolled = roll;
          d.rolling = false;
          d.sum.setText(`${roll}: the bridge is ${roll}. the gap is ${12 - roll}.`);
          sfx('thump');
          for (let i = 0; i < roll; i++) {
            const tx = d.bridge.x0 + i;
            if (tx > d.bridge.x1) break;
            const img = this.add.image(px(tx), px(d.bridge.y), `${gamblerTiles.key}_s_15_${tx % 3}`).setDepth(D.TERRAIN).setAlpha(0);
            this.physics.add.existing(img, true);
            this.bridgeGroup.add(img);
            this.tweens.add({ targets: img, alpha: 1, duration: 200, delay: i * 50 });
            d.tiles.push(img);
          }
          ev.remove();
        }
      },
    });
  }

  updateDice() {
    const d = this.dice;
    if (!d || d.rolled || d.rolling) return;
    const p = this.player;
    if (Math.abs(p.x - d.wx) < 16 && Math.abs(p.y + 22 - d.floor) < 10 && p.body.blocked.down) this.rollDice();
  }

  // ---------- cages, comps, the lift, the billiards room -----------------------------

  buildCage(o, floor) {
    this.add.image(o.wx, floor, 'gm-cage').setOrigin(0.5, 1).setDepth(7);
    this.add.text(o.wx, floor - 76, 'CASHIER', { fontFamily: 'monospace', fontSize: '9px', color: '#e9b84a' }).setOrigin(0.5).setDepth(8);
    const cage = { ...o, x: o.wx, floor };
    this.addInteract(o.wx, floor - 20, 'cash out', async () => {
      if (o.id === 'cage2' && !this.told.d6) {
        this.told.d6 = true;
        await this.dialog.show(this.marker > 0 ? [...DIALOGUES.d6, ...DIALOGUES.d6_marker] : DIALOGUES.d6);
      }
      this.cashAt(cage);
    }, { once: false });
  }

  buildComp(o, floor) {
    const img = this.person('waiter', o.wx, floor, { flip: true });
    const tray = this.add.image(o.wx - 14, floor - 30, o.gives === 'heart' ? 'heart' : 'gm-chipstack').setDepth(12).setScale(0.8);
    this.addInteract(o.wx, floor - 20, o.gives === 'heart' ? 'a drink, with a heart in it' : `${o.n} chip${o.n > 1 ? 's' : ''}, compliments of the house`, () => {
      tray.destroy();
      this.favour += this.compWeight;
      if (o.gives === 'heart') this.changeHearts(1);
      else this.addChips(o.n, 'comped');
      sfx('tea');
      this.floatText(o.wx, floor - 70, '"Compliments of Mr. Favour."', '#c8c0b0');
      this.walkPerson(img, 'waiter', o.wx + 90);
    }, { once: true });
  }

  buildBall(o, floor) {
    const ball = this.physics.add.image(o.wx, floor - 10, 'gm-ball').setDepth(9);
    ball.body.setSize(ball.width, ball.height, true);
    ball.body.setMass(0.6).setDragX(140).setMaxVelocityX(120).setBounce(0.2, 0);
    this.physics.add.collider(ball, this.solids);
    this.physics.add.collider(this.player, ball);
    this.balls.push({ ...o, img: ball, sunk: false });
  }

  updateBalls() {
    for (const b of this.balls) {
      if (b.sunk) continue;
      // the balls roll: spin with travel
      b.img.setAngle(b.img.angle + b.img.body.velocity.x * 0.08);
      const pocket = this.pockets.find((p) => !p.sunk && Math.abs(p.wx - b.img.x) < 12 && Math.abs(p.floor - (b.img.y + 10)) < 20);
      if (pocket) {
        b.sunk = true;
        pocket.sunk = true;
        sfx('pop');
        this.tweens.add({ targets: b.img, scale: 0.2, alpha: 0, y: b.img.y + 10, duration: 300, onComplete: () => b.img.destroy() });
        const n = this.balls.filter((x) => x.sunk).length;
        this.floatText(pocket.wx, pocket.floor - 50, `${n} of three.`, '#f2d580');
        if (n >= 3) {
          this.setFlag('lift_ready');
          this.floatText(pocket.wx, pocket.floor - 80, 'the private lift hums.', '#f2d580');
          sting.gate();
        }
      }
    }
  }

  buildLift(o, floor) {
    const topY = floor - 6;
    const bottomY = px(33) + 6;
    const lift = this.physics.add.image(o.wx, topY, 'gm-lift').setImmovable(true).setDepth(D.TERRAIN + 1);
    lift.body.setAllowGravity(false);
    lift.body.checkCollision.down = false;
    this.physics.add.collider(this.player, lift);
    this.add.rectangle(o.wx, (topY + bottomY) / 2, 96, bottomY - topY + 40, 0x0a0a12, 0.55).setDepth(D.TERRAIN - 0.5);
    this.add.text(o.wx, topY - 70, 'PRIVATE', { fontFamily: 'monospace', fontSize: '9px', color: '#e9b84a' }).setOrigin(0.5).setDepth(8);
    this.lift = { img: lift, topY, bottomY, down: false };
  }

  updateLift() {
    const L = this.lift;
    if (!L) return;
    const p = this.player;
    // by geometry, not touching flags: a body at rest on an immovable
    // platform only reports `touching` on the frames it is being separated
    const riding = Math.abs(p.body.bottom - L.img.body.top) < 10 && Math.abs(p.x - L.img.x) < 46 && p.body.velocity.y >= 0;
    const go = riding && this.F.lift_ready && this.F.key;
    const want = go || L.down ? L.bottomY : L.topY;
    if (riding && !go && !this.told.lift) {
      this.told.lift = true;
      this.floatText(L.img.x, L.topY - 50, this.F.key ? 'the lift wants the balls sunk.' : 'the lift wants the key.', '#c8c0b0');
    }
    const dy = want - L.img.y;
    const v = Math.abs(dy) < 2 ? 0 : Math.sign(dy) * 90;
    L.img.body.setVelocityY(v);
    if (v === 0 && go && !L.down) {
      L.down = true;
      this.setFlag('lift_down');
      this.setObjective('the back rooms');
    }
  }

  // ---------- the back rooms --------------------------------------------------------

  buildMarkerWindow(o, floor) {
    this.add.image(o.wx, floor - 20, 'gm-window').setOrigin(0.5, 1).setDepth(7);
    this.add.text(o.wx, floor - 54, 'MARKERS', { fontFamily: 'monospace', fontSize: '8px', color: '#c8c0b0' }).setOrigin(0.5).setDepth(8);
    this.markerWindow = { x: o.wx, floor };
    this.addInteract(o.wx, floor - 20, 'the window (a marker: +10 chips)', () => this.collectorOffer(), { once: false, when: () => this.F.marker_offer || this.F.marker || this.pending === 0 });
  }

  async collectorOffer() {
    await this.dialog.show(this.F.marker ? DIALOGUES.marker_more : DIALOGUES.d4);
    const choice = await this.dialog.show([{ name: 'THE COLLECTOR', portrait: 'portrait-collector', text: 'Ten?', choices: [{ label: 'Take the marker', value: 'take' }, { label: 'No', value: 'no' }] }]);
    if (choice !== 'take') return;
    showTutorial(this, 'marker');
    this.setFlag('marker');
    this.addDebt(10, 'no paperwork');
    this.addChips(10, 'a marker');
  }

  buildPawn(o, floor) {
    this.add.image(o.wx, floor - 20, 'gm-hatch').setOrigin(0.5, 1).setDepth(7);
    this.add.text(o.wx, floor - 54, 'PAWN', { fontFamily: 'monospace', fontSize: '8px', color: '#c8c0b0' }).setOrigin(0.5).setDepth(8);
    this.addInteract(o.wx, floor - 20, 'the hatch', async () => {
      await this.dialog.show(this.hornWithFavour ? DIALOGUES.d5_ticket : DIALOGUES.d5);
      const choice = await this.dialog.show([{ name: 'THE PAWN WINDOW', portrait: 'portrait-pawn', text: 'Twenty-five.', choices: [{ label: 'Not yet', value: 'no' }, { label: this.hornWithFavour ? 'Pawn the ticket' : 'Pawn the horn', value: 'pawn' }] }]);
      if (choice !== 'pawn') return;
      this.setFlag('trumpet_pawned');
      this.satchel = this.satchel.filter((s) => s !== 'TICKET');
      this.updateSatchelHud();
      if (this.hasTrumpet) this.setTrumpet(false, 'the horn goes through the hatch.');
      else this.floatText(o.wx, floor - 70, 'the ticket goes through the hatch.', '#c8c0b0');
      this.addChips(25, 'the horn');
      sfx('adding');
      this.setObjective('the safe door takes twenty-five');
      this.time.delayedCall(2200, () => this.louVent());
    }, { once: false, when: () => !this.F.trumpet_pawned && !this.F.safe });
  }

  louVent() {
    if (this.told.vent || !this.vent) return;
    this.told.vent = true;
    const t = this.add.text(this.vent.x, this.vent.y - 20, '"Sir, I\'d go."', { fontFamily: 'monospace', fontSize: '11px', color: '#c8c0b0', fontStyle: 'italic' }).setOrigin(0.5).setDepth(40).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 0.8, y: t.y - 10, duration: 1200, yoyo: true, hold: 2500, onComplete: () => t.destroy() });
    sfx('groan');
    this.dialog.show(DIALOGUES.lou_vent);
  }

  buildSafe(o, floor) {
    this.add.image(o.wx, floor, 'gm-safe').setOrigin(0.5, 1).setDepth(7);
    this.add.text(o.wx, floor - 46, 'THE SLOT COUNTS 25', { fontFamily: 'monospace', fontSize: '8px', color: '#c8c0b0' }).setOrigin(0.5).setDepth(8);
    this.addInteract(o.wx, floor - 20, 'feed twenty-five chips', () => {
      if (this.pending < 25) {
        this.floatText(o.wx, floor - 70, `${this.pending} of 25. the slot waits.`, '#c8c0b0');
        return;
      }
      this.addChips(-25, 'the safe door', { quiet: true });
      sfx('adding');
      this.time.delayedCall(600, () => {
        sting.gate();
        this.setFlag('safe');
        this.floatText(o.wx, floor - 70, 'twenty-five. the bolts draw back.', '#f2d580');
        this.setObjective('the poker room');
      });
    }, { once: false, when: () => !this.F.safe });
  }

  async pokerRoom(t) {
    if (this.F.p5) {
      this.floatText(t.x, t.floor - 60, 'the game is over.', '#c8c0b0');
      return;
    }
    if (this.pending < 1) {
      this.floatText(t.x, t.floor - 60, 'ante is one. Jo has nothing.', '#e86a6a');
      await this.bust();
      return;
    }
    if (!this.told.poker) {
      this.told.poker = true;
      await this.dialog.show(DIALOGUES.poker_open);
    }
    showTutorial(this, 'face');
    const r = await fiveCardDraw(this, { chips: this.pending, difficulty: this.difficulty, trumpetHolder: this.p5Holder });
    if (!r) return;
    const net = r.chips - this.pending;
    this.pending = r.chips;
    setPending(this.pending);
    this.updateHud();
    if (net > 0) this.floatText(t.x, t.floor - 70, `+${net} chips`, '#f2d580');
    else if (net < 0) this.floatText(t.x, t.floor - 70, `${net} chips`, '#c8c0b0');
    if (r.trumpet && !this.hasTrumpet) {
      this.setFlag('trumpet_back');
      this.setTrumpet(true, 'the horn, back in his hands.');
      this.crackChandelier();
    }
    if (r.bust) {
      await this.bust();
      return;
    }
    this.setFlag('p5');
    this.setObjective('the fire door');
  }

  // the first note after the horn comes back cracks a chandelier
  crackChandelier() {
    const p = this.player;
    sfx('crack');
    for (let i = 0; i < 14; i++) {
      const g = this.add.rectangle(p.x + Phaser.Math.Between(-80, 80), p.y - 180, 3, 8, 0xd8ecf8).setDepth(30);
      this.tweens.add({ targets: g, y: p.y + 20, angle: 200, alpha: 0, duration: 900 + i * 40, ease: 'quad.in', onComplete: () => g.destroy() });
    }
  }

  // bust: the Collector escorts Jo to the car park with the marker at +5
  async bust() {
    this.setFlag('p5');
    this.addDebt(5, 'a word outside');
    await this.dialog.show(DIALOGUES.bust);
    const cam = this.cameras.main;
    const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0).setScrollFactor(0).setDepth(230);
    this.tweens.add({ targets: wipe, alpha: 1, duration: 600 });
    this.time.delayedCall(800, () => {
      this.player.setPosition(px(334), px(33) - 10);
      this.player.setVelocity(0, 0);
      this.checkpoint = { x: px(334), y: px(33) - 10 };
      this.tweens.add({ targets: wipe, alpha: 0, duration: 600, onComplete: () => wipe.destroy() });
      this.setObjective('dawn. the cage, the bus.');
    });
  }

  // ---------- hand 4: the car park ----------------------------------------------------

  buildBarrier(o, floor) {
    this.add.image(o.wx - 14, floor, 'gm-barrier-post').setOrigin(0.5, 1).setDepth(8);
    const arm = this.add.image(o.wx - 14, floor - 24, 'gm-barrier-arm').setOrigin(0, 0.5).setDepth(9);
    this.barrier = { ...o, floor, arm, down: false };
  }

  updateBarrier() {
    const b = this.barrier;
    if (!b) return;
    // down for one beat in four: it drops on the beat
    const phase = this.beatNum % 4;
    const want = phase === 0 ? 0 : -78;
    b.arm.angle += (want - b.arm.angle) * 0.25;
    b.down = b.arm.angle > -20;
    b.arm.setTint(phase === 3 ? 0xffb0b0 : 0xffffff);
    if (b.down) {
      const rect = new Phaser.Geom.Rectangle(b.arm.x, b.floor - 30, 72, 12);
      if (overlaps(this.player.getBounds(), rect) && this.time.now > (b.hitAt || 0)) {
        b.hitAt = this.time.now + 1200;
        this.hurt();
      }
    }
  }

  buildVan(o, floor) {
    const img = this.physics.add.image(o.wx, floor - 14, 'gm-van').setImmovable(true).setDepth(9);
    img.body.setAllowGravity(false);
    this.physics.add.collider(this.player, img);
    const x0 = o.wx;
    const x1 = px(o.x1 + this.roomOf(o)._x0);
    const beep = this.add.text(o.wx, floor - 50, '', { fontFamily: 'monospace', fontSize: '11px', color: '#e86a6a' }).setOrigin(0.5).setDepth(30);
    this.van = { img, x0, x1, dir: 1, floor, beep, waitUntil: 0, lastX: img.x };
  }

  updateVan(time) {
    const v = this.van;
    if (!v) return;
    const p = this.player;
    if (time < v.waitUntil) {
      v.img.body.setVelocityX(0);
      v.beep.setPosition(v.img.x, v.floor - 50).setText(Math.floor(time / 250) % 2 ? 'BEEP' : '').setVisible(true);
    } else {
      v.beep.setVisible(false);
      v.img.body.setVelocityX(v.dir * 110);
      if ((v.dir > 0 && v.img.x >= v.x1) || (v.dir < 0 && v.img.x <= v.x0)) {
        v.dir = -v.dir;
        v.waitUntil = time + 1600; // reversing: it beeps first
      }
      v.img.setFlipX(v.dir < 0);
    }
    const onVan = Math.abs(p.body.bottom - v.img.body.top) < 10 && Math.abs(p.x - v.img.x) < 34 && p.body.velocity.y >= 0;
    if (onVan) p.x += v.img.x - v.lastX;
    else if ((p.body.touching.left && v.img.body.touching.right) || (p.body.touching.right && v.img.body.touching.left)) {
      if (Math.abs(v.img.body.velocity.x) > 5 && time > (v.hitAt || 0)) {
        v.hitAt = time + 1500;
        this.hurt();
      }
    }
    v.lastX = v.img.x;
  }

  // ---------- hand 5: the last hand ---------------------------------------------------

  async lastHand(t) {
    if (this.F.p6) return;
    if (!this.told.d8) {
      this.told.d8 = true;
      await this.dialog.show(DIALOGUES.d8);
    }
    const choice = await faceUp(this, { marker: this.marker, chips: this.pending });
    if (choice === 'stand') {
      this.setFlag('stood_up');
      this.setFlag('p6');
      await this.dialog.show(DIALOGUES.stood);
      // the table folds itself away. the music stops. birds.
      this.tweens.add({ targets: t.label, alpha: 0, duration: 600 });
      musicDirector.setMix({});
      music.stop();
      this.floatText(t.x, t.floor - 70, 'the table folds itself away.', '#c8c0b0');
      for (let i = 0; i < 3; i++) this.time.delayedCall(600 + i * 900, () => sfx('flap'));
      this.silence = true;
      this.setObjective('lost and found: past the booth');
      return;
    }
    // BET: a second marker, a win, a flood, the counting voice, the orb
    this.setFlag('took_marker');
    this.setFlag('p6');
    this.addDebt(10, 'the second marker');
    await this.dialog.show(DIALOGUES.bet);
    this.stingNotes = 6;
    this.playStinger(true);
    this.winFx(40, { big: true });
    musicDirector.setMix({ bass: 1, brushes: 1, piano: 1, trumpet: 1, pad: 0.4 });
    this.addChips(this.marker * 2 + 20, 'everything', { quiet: true });
    this.chipFlood(t);
    this.tweens.add({ targets: this.signGlow, alpha: 0.6, scaleX: 14, scaleY: 7, duration: 2000, yoyo: true });
    this.player.controlLockUntil = this.time.now + 10000;
    this.player.body.setVelocity(0, 0);
    this.time.delayedCall(10000, async () => {
      musicDirector.setMix({});
      music.stop();
      this.silence = true;
      await this.dialog.show(DIALOGUES.count);
      this.startCounting(t);
      const o = this.orbs.create(t.x + 10, t.floor - 14, 'orb').setDepth(95).setAlpha(0);
      this.tweens.add({ targets: o, alpha: 1, y: t.floor - 40, duration: 1200 });
      this.floatText(t.x, t.floor - 90, 'a hand comes out from under the table with the orb in it. like a prize.', '#c8c0b0');
      this.setObjective('');
    });
  }

  chipFlood(t) {
    for (let i = 0; i < 90; i++) {
      this.time.delayedCall(i * 60, () => {
        const c = this.add.image(t.x + Phaser.Math.Between(-300, 300), t.floor - 400, `coin-gambler-${i % 4}`).setDepth(40);
        this.tweens.add({ targets: c, y: t.floor - 8 - Phaser.Math.Between(0, 30), angle: Phaser.Math.Between(-360, 360), duration: Phaser.Math.Between(700, 1300), ease: 'bounce.out' });
      });
    }
  }

  // the voice from behind the lamp: flat, pleasant, the one from the station
  // gate. It counts for as long as the player stands there.
  startCounting(t) {
    let n = 6;
    this.counting = this.time.addEvent({
      delay: 1400,
      loop: true,
      callback: () => {
        if (this.orbCaught) return this.counting.remove();
        n += 1;
        const txt = this.add.text(t.x + 30, t.floor - 150, `${n}.`, { fontFamily: 'monospace', fontSize: '13px', color: '#c8c0b0' }).setOrigin(0.5).setDepth(40).setAlpha(0);
        this.tweens.add({ targets: txt, alpha: 0.9, y: txt.y - 14, duration: 500, yoyo: true, hold: 500, onComplete: () => txt.destroy() });
        sfx('tick');
      },
    });
  }

  // ---------- hand 6: lost and found ------------------------------------------------

  buildBox(o, floor, img) {
    this.add.text(o.wx, floor - 36, 'LOST & FOUND', { fontFamily: 'monospace', fontSize: '8px', color: '#3a3a44' }).setOrigin(0.5).setDepth(10);
    this.addInteract(o.wx, floor - 16, 'the box', async () => {
      if (this.F.took_marker || this.orbCaught) {
        this.floatText(o.wx, floor - 60, 'an empty box. a note, in pencil.', '#c8c0b0');
        this.time.delayedCall(900, () => this.floatText(o.wx, floor - 80, `"${LOU_NOTE}"`, '#e8dcc8'));
        return;
      }
      const note = this.add.image(o.wx + 20, floor - 40, 'gm-note').setDepth(20);
      this.floatText(o.wx, floor - 80, `a note in Lou's hand: "${LOU_NOTE}"`, '#e8dcc8');
      await new Promise((r) => this.time.delayedCall(1400, r));
      note.destroy();
      this.setFlag('trumpet_back');
      this.setTrumpet(true, 'the trumpet. in the box. one note — it cracks nothing.');
      this.setObjective('');
      await new Promise((r) => this.time.delayedCall(900, r));
      // the orb is in the bell, glowing through the brass
      const orb = this.orbs.create(o.wx, floor - 30, 'orb').setDepth(95).setAlpha(0).setScale(0.6);
      this.tweens.add({ targets: orb, alpha: 1, scale: 1, y: floor - 44, duration: 1400 });
      this.floatText(o.wx, floor - 100, 'something glows through the brass. he tips it out into his hand.', '#f2d580');
    }, { once: false, when: () => true });
    void img;
  }

  catchOrb(orb) {
    if (this.cardActive || this.orbCaught) return;
    this.orbCaught = true;
    if (this.counting) this.counting.remove();
    completeDream('gambler');
    const voided = voidPending();
    this.pending = 0;
    updateSave((s) => {
      s.flags.gm = { ...(s.flags.gm || {}), stood_up: !!this.F.stood_up, took_marker: !!this.F.took_marker, sal_chip: !!this.F.sal_chip, trumpet_pawned: !!this.F.trumpet_pawned, marker: getMarker(), voided, cashed: this.cashedWorth, favour: this.favour };
    });
    music.stop();
    musicDirector.setMix({});
    sfx('orb');
    try {
      trumpet(9, 1.2, 0.3);
    } catch {
      /* silent */
    }
    this.tweens.add({ targets: orb, scale: 2.5, alpha: 0, duration: 700 });
    const momentMsg = this.moments === 0 ? "You didn't notice anything on the way." : this.moments < 3 ? 'You noticed a little.' : 'You noticed. Maybe that was the point.';
    const lines = ['One night.', '', 'Was it enough?', '', momentMsg, this.F.took_marker ? CARD_LINES.took_marker : CARD_LINES.stood_up];
    if (this.F.sal) lines.push(this.F.sal_chip ? CARD_LINES.sal_took : CARD_LINES.sal_kept);
    if (voided > 0) lines.push(`${voided} chip${voided > 1 ? 's' : ''}, never cashed.`);
    if (getMarker() > 0) lines.push(`A marker for ${getMarker()}. It never goes away.`);
    lines.push('', '[X] Return to Crossroads Station');
    const cam = this.cameras.main;
    const white = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xffffff, 0).setScrollFactor(0).setDepth(240);
    this.tweens.add({ targets: white, alpha: 1, duration: 1200 });
    this.time.delayedCall(1300, () => {
      white.destroy();
      this.showCard(lines, () => {
        music.stop();
        this.scene.start('Hub', { returnedFrom: 'gambler' });
      });
    });
  }

  // ---------- small moments ------------------------------------------------------------

  moment(id, x, y) {
    this.addInteract(x, y, 'pause', async () => {
      const m = MOMENTS[id];
      this.moments += 1;
      recordMoment('gambler', id);
      this.setFlag(id);
      sfx('chime');
      this.player.controlLockUntil = this.time.now + (id === 'm2' ? 8000 : 6000);
      this.player.body.setVelocity(0, 0);
      if (id === 'm2') this.duet();
      const cam = this.cameras.main;
      const t1 = this.add.text(cam.width / 2, cam.height - 150, m.sub, { fontFamily: 'monospace', fontSize: '14px', color: '#c8c0b0', align: 'center', wordWrap: { width: 700 } }).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
      const t2 = this.add.text(cam.width / 2, cam.height - 116, m.text, { fontFamily: 'monospace', fontSize: '17px', color: '#f2e0a0', fontStyle: 'italic' }).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
      this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 900 });
      this.time.delayedCall(id === 'm2' ? 7000 : 5000, () => this.tweens.add({ targets: [t1, t2], alpha: 0, duration: 800, onComplete: () => [t1, t2].forEach((t) => t.destroy()) }));
    });
  }

  // the piano bar at three in the morning: the pianist plays, and Jo with him
  duet() {
    if (this.told.duet) return;
    this.told.duet = true;
    const notes = [392, 440, 494, 523, 587, 523, 494, 440];
    notes.forEach((f, i) => {
      this.time.delayedCall(i * 420, () => {
        try {
          playTone(f / 2, 0.6, 'sine', 0.12);
          if (this.hasTrumpet) trumpet(4 + (i % 4), 0.3, 0.18);
        } catch {
          /* silent */
        }
      });
    });
    if (!this.hasTrumpet) this.floatText(this.player.x, this.player.y - 60, '(he sits.)', '#c8c0b0');
  }

  // ---------- foes: security, the Collector ---------------------------------------------

  throwOut(foe) {
    if (this.thrownOut || this.cardActive) return;
    this.thrownOut = true;
    this.scatterCoins();
    sfx('fail');
    this.cameras.main.shake(200, 0.008);
    this.player.controlLockUntil = this.time.now + 1500;
    this.player.body.setVelocity(0, 0);
    const collector = foe && foe.kind === 'collector';
    if (collector) this.addDebt(this.markerPerCatch, 'a word outside');
    const cam = this.cameras.main;
    const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0).setScrollFactor(0).setDepth(230);
    const label = this.add.text(cam.width / 2, cam.height / 2, collector ? 'A WORD OUTSIDE' : 'ESCORTED OUT', { fontFamily: 'monospace', fontSize: '26px', color: '#e8dcc8' }).setOrigin(0.5).setScrollFactor(0).setDepth(231).setAlpha(0);
    this.tweens.add({ targets: [wipe], alpha: 0.9, duration: 500 });
    this.tweens.add({ targets: [label], alpha: 1, duration: 500 });
    this.time.delayedCall(1000, () => {
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
      this.tweens.add({ targets: [wipe, label], alpha: 0, duration: 500, onComplete: () => {
        wipe.destroy();
        label.destroy();
        this.thrownOut = false;
      } });
      this.loseHeart();
    });
  }

  // ---------- music ------------------------------------------------------------------------

  setMusicMix(roomId) {
    if (this.silence) return;
    const tr = this.hasTrumpet ? 1 : 0;
    const MIX = {
      arrival: { bass: 0.5, brushes: 0.3, piano: 0.2, trumpet: 0.3 * tr, pad: 0.2 },
      floor: { bass: 1, brushes: 0.7, piano: 0.8, trumpet: 0.5 * tr, pad: 0 }, // the vibraphone: the winning sound
      lounge: { bass: 0.7, brushes: 0.3, piano: 0.5, trumpet: 0.35 * tr, pad: 0.2 },
      backrooms: { bass: 0.6, brushes: 0.2, piano: 0.45, trumpet: 0.3 * tr, pad: 0.3 }, // low piano chords
      carpark: { bass: 0.4, brushes: 0.15, piano: 0.4, trumpet: 0.25 * tr, pad: 0.4 },
      lasthand: { bass: 0, brushes: 0.5, piano: 0, trumpet: 0, pad: 0 }, // one ride cymbal
      lostfound: { bass: 0, brushes: 0, piano: 0, trumpet: 0, pad: 0 },
    };
    musicDirector.setMix(MIX[roomId] || MIX.floor);
  }

  // ---------- HUD ---------------------------------------------------------------------------

  buildHud() {
    const mk = (y, color = '#c8c0b0', size = 12) => this.add.text(16, y, '', { fontFamily: 'monospace', fontSize: `${size}px`, color, stroke: '#14101c', strokeThickness: 3 }).setScrollFactor(0).setDepth(150);
    this.chipHud = mk(112, '#f2d580');
    this.markerHud = mk(130, '#e86a6a');
    this.betHud = mk(150, '#6a6478', 15);
    this.betHud.setText('[E] BET');
    this.hornHud = mk(172, '#8a8478', 11);
    this.updateHud();
  }

  updateHud() {
    if (!this.chipHud) return;
    this.chipHud.setText(`CHIPS   pending ${this.pending}   ·   real $${this.cashedWorth}`);
    this.markerHud.setText(this.marker > 0 ? `MARKER  ${'|'.repeat(Math.min(30, this.marker))}  ${this.marker}` : '');
    this.hornHud.setText(this.hasTrumpet ? '' : this.hornWithFavour && !this.F.trumpet_pawned ? 'the horn: cloakroom' : 'the horn: gone');
  }

  // ---------- update ------------------------------------------------------------------------

  update(time, delta) {
    if (this.handleModalUpdate()) {
      this.modalWas = true;
      return;
    }
    if (this.modalWas) {
      // a panel or a conversation just closed: nobody grabs a man the
      // moment he stands up from a table
      this.modalWas = false;
      this.stillSince = time;
      for (const f of this.foes) {
        if (f.active && f.human && (f.state === 'alert' || f.state === 'windup' || f.state === 'grabbing')) {
          f.clearTint();
          f.distract(f.homeX);
        }
      }
    }
    const p = this.player;
    const pb = p.getBounds();
    const dt = delta / 1000;
    const room = RoomBuilder.roomAt(this.built.rooms, p.x);
    const footTx = Math.floor(p.x / T);
    const footTy = Math.floor((p.y + p.body.height / 2 + 6) / T);
    const surface = this.surfaceGrid[footTy] && this.surfaceGrid[footTy][footTx];
    p.slippery = surface === 'grease';
    p.slipFactor = 0.06;
    p.update(time, delta);
    // hands in pockets: the carry-idle after the pawn
    if (!this.hasTrumpet && p.body.blocked.down && (p.art.texture.key === 'jo-stand' || p.art.texture.key === 'jo-idle-b')) p.art.setTexture('jo-pockets');

    // the trumpet: X shoves, Q plays. Neither without it.
    if (Phaser.Input.Keyboard.JustDown(p.keys.X)) {
      if (this.hasTrumpet) {
        const hit = p.swingLadle();
        if (hit) {
          for (const e of this.foes) {
            if (!e.active || !overlaps(hit, e.getBounds())) continue;
            if (e.human) e.shove(p.x);
            else e.die();
          }
        }
      } else if (time > this.qCool) {
        this.qCool = time + 1500;
        this.floatText(p.x, p.y - 60, 'nothing to swing.', '#8a8478');
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyQ) && time > this.qCool) {
      this.qCool = time + 900;
      if (this.hasTrumpet) this.noiseBurst();
      else this.floatText(p.x, p.y - 60, 'no horn.', '#8a8478');
    }

    this.updateTables(p);
    this.updateInteracts(p);
    this.updateRoom(room, time, dt);
    this.updateFoes(time);
    this.updateRunners(time);
    this.updateReels();
    this.updateWheels(dt);
    this.updateDice();
    this.updateBalls();
    this.updateLift();
    this.updateBarrier();
    this.updateVan(time);
    this.updateMusicRoom();
    this.updatePickups(time, delta);
    this.updateDialogueZones(p);
    this.pit.update(time, dt, p);
    this.updateMirror(p, room);

    if (p.y > this.worldH + 60) {
      p.setPosition(this.checkpoint.x, this.checkpoint.y);
      p.setVelocity(0, 0);
      this.hurt();
    }
    void pb;
  }

  // coins are chips: pending, not real, until a cage says so
  updatePickups(time, delta) {
    if (this.coinMgr) {
      this.coinMgr.update(time, delta / 1000, this.player, (n) => {
        this.levelCoins += n;
        this.coinsSinceCP += n;
        deductWorth('gambler', n * coinWorth('gambler')); // the wallet took it; take it back: it is pending
        this.addChips(n, null, { quiet: true });
        this.updateCoinHud();
      });
    }
    for (const img of this.shardItems || []) {
      if (!img.active) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, img.x, img.y) < 22) {
        img.destroy();
        sfx('shard');
        const sv = updateSave((x) => (x.shards = (x.shards || 0) + 1));
        this.updateShardHud();
        this.floatText(this.player.x, this.player.y - 60, sv.shards % 3 === 0 ? 'a heart, whole.' : `heart shard — ${sv.shards % 3}/3`, '#7ec8d8');
        if (sv.shards % 3 === 0) {
          this.maxLives = Math.min(6, this.maxLives + 1);
          this.lives += 1;
          this.updateHearts();
        }
      }
    }
  }

  scatterCoins() {
    // a fall scatters pending chips since the checkpoint, not the wallet
    if (!this.coinMgr || this.coinsSinceCP <= 0) return;
    const n = Math.min(this.coinsSinceCP, this.pending);
    this.levelCoins = Math.max(0, this.levelCoins - n);
    this.addChips(-n, null, { quiet: true });
    this.coinMgr.scatter(this.player.x, this.player.y, n);
    this.coinsSinceCP = 0;
    this.updateCoinHud();
  }

  updateCoinHud() {
    if (!this.coinHud) return;
    this.coinHud.setText(`${this.levelCoins}   $${this.cashedWorth}`);
  }

  updateTables(p) {
    let near = null;
    for (const t of this.tables) {
      if (Math.abs(p.x - t.x) < 60 && Math.abs(p.y + 22 - t.floor) < 50) near = t;
    }
    this.nearTable = near;
    this.betHud.setColor(near && !near.closed ? '#f2d580' : '#6a6478');
    this.betHud.setText(near && !near.closed ? `[E] BET — ${near.name}` : '[E] BET');
    if (near) this.betHud.setAlpha(0.85 + Math.sin(this.time.now / 200) * 0.15);
    else this.betHud.setAlpha(1);
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
    const t = this.nearTable;
    // the table takes E unless something closer wants it (the pawn hatch, a person)
    if (t && !t.closed && (!nearest || nearest.d > 30)) {
      this.promptText.setText(`[E] BET — ${t.name}`).setVisible(true).setPosition(t.x, t.floor - 58);
      if (Phaser.Input.Keyboard.JustDown(p.keys.E)) this.openTable(t);
      return;
    }
    if (nearest) {
      this.promptText.setText(`[E] ${nearest.it.label}`).setVisible(true).setPosition(nearest.it.x, nearest.it.y - 34);
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
      (async () => {
        if (z.id === 'd1') {
          await this.dialog.show(DIALOGUES.d1);
          this.setObjective("the cage, or Lou's table");
        }
        if (z.id === 'd8') {
          this.told.d8 = true;
          await this.dialog.show(DIALOGUES.d8);
        }
      })();
    }
  }

  // the mirror ceiling reflects a second Jo, a frame late
  updateMirror(p, room) {
    const on = room && room.id === 'floor';
    this.mirrorJo.setVisible(on && p.shown);
    if (on) {
      const L = this.mirrorLast;
      const mirrorY = px(10) + 24;
      this.mirrorJo.setPosition(L.x, mirrorY * 2 - L.y).setTexture(L.key).setFlipX(L.flip);
      this.mirrorLast = { x: p.art.x, y: p.art.y, key: p.art.texture.key, flip: p.flipX };
    }
  }

  // per-room: rain, the sign, music, dawn, the chip runners' tables
  updateRoom(room, time, dt) {
    const id = room.id;
    if (id !== this._lastRoomId) {
      this._lastRoomId = id;
      this.setMusicMix(id);
      if (id === 'floor' && !this.told.floor) {
        this.told.floor = true;
        this.setObjective('the slots. the pit. the cage. Lou.');
      }
      if (id === 'lounge' && !this.told.lounge) {
        this.told.lounge = true;
        this.setObjective('Mr. Favour, at the top');
      }
      if (id === 'backrooms' && !this.told.back) {
        this.told.back = true;
        this.setObjective('three rooms. no numbers.');
      }
      if (id === 'carpark' && !this.told.carpark) {
        this.told.carpark = true;
        this.setFlag('dawn');
        this.setObjective('dawn. the cage, the bus.');
        for (let i = 0; i < 3; i++) this.time.delayedCall(800 + i * 1300, () => sfx('flap'));
      }
      if (id === 'lostfound' && !this.told.lf) {
        this.told.lf = true;
        this.setObjective('a cardboard box');
      }
      this.checkPit();
      if (id !== 'floor' && id !== 'lounge') this.pit.stop();
    }
    const wantRain = id === 'arrival' ? 0.5 : 0;
    this.rain.setAlpha(Phaser.Math.Linear(this.rain.alpha, wantRain, 0.05));
    this.rain.tilePositionY -= 9;
    this.rain.tilePositionX += 1.5;
    this.rain.setScale(1 / (this.cameras.main.zoom || 1));
    if (id === 'carpark' || id === 'lasthand') {
      for (const b of this.birds) {
        b.x = b.baseX + Math.sin(time / 900 + b.baseX) * 60 + ((time / 40) % 900);
        b.setText(Math.floor(time / 300 + b.baseX) % 2 ? '~' : 'v');
      }
    }
    // the lounge: a bouncer who has noticed Jo with the horn out
    if (id === 'lounge' && this.hasTrumpet && this.lounge_watch) {
      for (const f of this.foes) if (f.kind === 'bouncer' && f.active) f.def.sight = 200;
    }
    void dt;
  }

  // ---------- dev warp -----------------------------------------------------------------------

  devWarp() {
    let at = null;
    try {
      at = new URLSearchParams(window.location.search).get('gm');
    } catch {
      return false;
    }
    if (!at) return false;
    const H1 = ['d0', 'p1'];
    const H2 = [...H1, 'first_win', 'cashed_once'];
    const H3 = [...H2, 'coat_taken', 'key', 'lift_ready', 'lift_down'];
    const H4 = [...H3, 'p4', 'marker', 'trumpet_pawned', 'safe', 'p5'];
    const H5 = [...H4, 'dawn', 'sal'];
    const PH = {
      arrival: { flags: [], col: 3, row: 33, obj: 'the door. one chip.' },
      floor: { flags: H1, col: 51, row: 25, chips: 3, obj: 'the slots. the pit. the cage. Lou.' },
      pit: { flags: H1, col: 86, row: 25, chips: 3, obj: 'the pit' },
      cage: { flags: H1, col: 128, row: 25, chips: 8, obj: 'the cage' },
      lou: { flags: H1, col: 146, row: 25, chips: 8, obj: "Lou's table" },
      lounge: { flags: H2, col: 157, row: 25, chips: 6, obj: 'the curved stair' },
      favour: { flags: H2, col: 171, row: 17, chips: 6, obj: 'Mr. Favour' },
      billiards: { flags: [...H2, 'coat_taken', 'key'], col: 209, row: 17, chips: 9, obj: 'three balls, then the lift' },
      backrooms: { flags: H3, col: 233, row: 33, chips: 9, obj: 'three rooms. no numbers.' },
      cups: { flags: H3, col: 243, row: 33, chips: 9, obj: 'three cups' },
      pawn: { flags: [...H3, 'p4', 'marker_offer'], col: 286, row: 33, chips: 4, obj: 'the hatch, or the window' },
      poker: { flags: [...H3, 'p4', 'marker', 'trumpet_pawned', 'safe'], col: 304, row: 33, chips: 10, marker: 10, noHorn: true, obj: 'the poker room' },
      carpark: { flags: H4, col: 334, row: 33, chips: 6, marker: 15, noHorn: true, obj: 'dawn. the cage, the bus.' },
      sal: { flags: H4, col: 426, row: 33, chips: 0, marker: 15, noHorn: true, obj: 'the bus stop' },
      lasthand: { flags: H5, col: 443, row: 33, chips: 1, marker: 15, noHorn: true, obj: 'a table between two cars' },
      lostfound: { flags: [...H5, 'stood_up', 'p6'], col: 484, row: 33, chips: 1, marker: 15, noHorn: true, silence: true, obj: 'a cardboard box' },
    };
    const ph = PH[at];
    if (!ph) return false;
    this.warped = true;
    ph.flags.forEach((f) => this.setFlag(f));
    this.pending = ph.chips === undefined ? 1 : ph.chips;
    setPending(this.pending);
    if (ph.marker) {
      this.marker = ph.marker;
      updateSave((s) => (s.wallet.marker = ph.marker));
    } else {
      this.marker = 0;
      updateSave((s) => (s.wallet.marker = 0));
    }
    if (ph.noHorn) {
      this.hasTrumpet = false;
      this.player.tool.setTexture('gm-none');
    }
    if (ph.flags.includes('coat_taken')) this.player.bodyTint = 0xd8d8e8;
    if (ph.flags.includes('key')) this.satchel = ['HIGH-ROLLER KEY'];
    else if (ph.flags.includes('first_win')) this.satchel = ['LOUNGE TICKET'];
    if (ph.flags.includes('lift_down') && this.lift) {
      this.lift.img.y = this.lift.bottomY;
      this.lift.down = true;
    }
    if (ph.flags.includes('lift_ready')) for (const b of this.balls) b.sunk = true;
    if (ph.silence) this.silence = true;
    this.told.d8 = false;
    this.updateSatchelHud();
    this.updateHud();
    this.player.setPosition(px(ph.col), px(ph.row) - 10);
    this.checkpoint = { x: px(ph.col), y: px(ph.row) - 10 };
    this.setObjective(ph.obj);
    return true;
  }
}
