import Phaser from 'phaser';
import Player from '../entities/Player.js';
import BaseLevel from './BaseLevel.js';
import RoomBuilder from '../builders/RoomBuilder.js';
import Parallax from '../builders/parallax.js';
import { D } from '../builders/depths.js';
import { lightThemeProps } from '../art/levelArt.js';
import writerRooms, { PARAGRAPHS } from '../data/writer/rooms.js';
import writerTiles from '../data/writer/tiles.js';
import { DIALOGUES, MOMENTS, FIRST_PARAGRAPH, CARD_LINES } from '../data/writer/cast.js';
import { createWriterTextures } from '../data/writer/sprites.js';
import Labels from '../systems/labels.js';
import Typing from '../systems/typing.js';
import { napkin, structure, memory, pageThree } from '../systems/writerPuzzles.js';
import InnerEditor from '../entities/InnerEditor.js';
import { completeDream, recordMoment, markMet, updateSave } from '../utils/save.js';
import { sfx, music, sting, musicDirector } from '../systems/audio.js';
import { showTutorial } from '../systems/tutorial.js';

const T = 32;
const px = (tile) => tile * T + T / 2;
const overlaps = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);
const SPEED = 280;

// a word's weight in the book, for the rewrite (P3): what he wrote down is
// what he can build with, and some of it carries more tension than the rest
const TENSION = { working: 1, light: 2, honest: 3, wide: 2, quiet: 1, fixed: 2, awake: 3, dry: 2, true: 4, necessary: 4, low: 1, lit: 2, old: 2, kind: 3, far: 3, cold: 4, gone: 5, again: 5 };

// THE SECOND DRAFT — the dream about the slowest kind of work. The world is
// labelled and the labels can be edited (systems/labels.js); the manuscript
// is a thing that is written, lost, rewritten and cut; and from Chapter 4 an
// ink silhouette walks behind Jo erasing what he has crossed.
export default class WriterScene extends BaseLevel {
  constructor() {
    super('Writer');
  }

  // restart reuses the instance: everything per-run starts here
  init() {
    this.F = {};
    this.pages = 0;
    this.typos = 0;
    this.words = [];
    this.everWords = new Set();
    this.sources = [];
    this.machinesFixed = 0;
    this.posted = 0;
    this.slipsSpawned = 0;
    this.slips = [];
    this.structureOrder = null;
    this.memoryUsed = 0;
    this.pageThreeChoice = null;
    this.deadline = null;
    this.noise = 0;
    this.loudNow = false;
    this.carry = null;
    this.carrySprite = null;
    this.moments = 0;
    this.interacts = [];
    this.props = {};
    this.erased = [];
    this.leversPulled = [];
    this.typing = null;
    this.editors = [];
    this.orbCaught = false;
    this.cut = {};
    this.told = {};
  }

  create() {
    createWriterTextures(this);
    lightThemeProps(this, ['wr-'], ['wr-editor', 'wr-rain', 'wr-glow', 'wr-shadow', 'wr-glass']);

    const built = RoomBuilder.build(this, writerRooms, writerTiles);
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
    this.inkZones = [];
    for (let ty = 0; ty < built.height; ty++) {
      for (let tx = 0; tx < built.width; tx++) {
        if (built.surfaceGrid[ty] && built.surfaceGrid[ty][tx] === 'liquid') this.inkZones.push(new Phaser.Geom.Rectangle(px(tx) - 16, px(ty) - 10, 32, 42));
      }
    }
    // the top tile of every column can be erased by the Inner Editor
    this.erasable = built.solids.getChildren().filter((img) => img.tileRole === 'solid' && !built.solidAt(img.tx, img.ty - 1));

    const spawn = { x: px(3), y: px(33) - 10 };
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.tool.setTexture('tool-pen');
    this.player.typing = false;
    this.dreamCoinId = 'writer';
    markMet('writer');
    this.setupCommon({ worldW: built.worldW, worldH: built.worldH, levelName: 'DREAM — THE SECOND DRAFT', spawn });

    // §7 — difficulty: ink, vocabulary, noise, the Editor's pace
    this.inkMax = this.difficulty >= 2 ? 4 : 6;
    this.ink = this.inkMax;
    this.wordCap = this.difficulty >= 2 ? 6 : 8;
    this.noiseThreshold = this.difficulty >= 2 ? 0.55 : 0.7;
    this.editorSpeed = SPEED * (this.difficulty >= 2 ? 0.75 : 0.6);
    this.editorLead = (this.difficulty >= 2 ? 5 : 8) * T;
    this.slipTotal = this.difficulty >= 2 ? 60 : 40;
    this.deadlineMs = 360000 * (1 - 0.1 * this.difficulty);

    this.labels = new Labels(this);
    this.initFoes('writer');
    this.enemies = this.foeGroup;
    this.spawnRoomFoes(built.objects, (o) => !o.wave);
    for (const f of this.foes) {
      const def = built.objects.find((o) => o.type === 'foe' && o.wx === f.homeX && o.kind === f.kind);
      if (def && def.asleep) {
        f.asleep = true;
        f.setFlipX(true);
        this.labels.add({ id: 'sleeper', x: f.x, y: f.y - 44, noun: 'guard', adj: 'sleeping', bound: true, follow: f });
      }
      if (def && def.word) {
        f.word = def.word;
        f.line = def.line;
        f.setFlipX(true);
        f.bubbleAt = this.time.now + 1500 + Math.random() * 3000;
      }
      if (def && def.id) f.id = def.id;
    }
    this.addHideSpots(built.objects);
    this.spawnPickups(built.objects);

    this.buildGates();
    this.buildCheckpoints();
    this.buildWorld();
    this.buildFlat();
    this.buildPress();
    this.buildBookshop();
    this.buildHud();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.oneWays);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.oneWays);
    this.physics.add.overlap(this.player, this.flags, (_p, f) => this.activateCheckpoint(f));
    this.physics.add.overlap(this.player, this.spikes, () => this.hurt());
    this.physics.add.overlap(this.player, this.orbs, (_p, o) => this.catchOrb(o));

    this.promptText = this.add
      .text(0, 0, '[E]', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580', backgroundColor: '#14101c' })
      .setOrigin(0.5)
      .setDepth(80)
      .setVisible(false);

    // rain, for the rooms that have it
    this.rain = this.add
      .tileSprite(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width / 0.5, this.cameras.main.height / 0.5, 'wr-rain')
      .setScrollFactor(0)
      .setDepth(85)
      .setAlpha(0);

    this.setObjective('write chapter one (12 pages)');
    music.piano();
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
          const img = this.add.image(g.wx, px(r), `${writerTiles.key}_s_15_${(g.tx * 7 + r * 13) % 3}`).setTint(0xa05a4a).setDepth(D.TERRAIN);
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

  // a pixel person (data/evening/sprites.js rig) standing on the ground
  person(id, x, floorY, { flip = false, sit = false } = {}) {
    const key = `wr-p-${id}${sit ? '-sit' : ''}`;
    const img = this.add.image(x, floorY, this.textures.exists(key) ? key : `wr-p-${id}`).setOrigin(0.5, 1).setDepth(11).setFlipX(flip);
    this.add.image(x, floorY - 1, 'wr-shadow').setDepth(10.5).setAlpha(0.7);
    // breathing: the chest a hair higher on the in-breath
    this.tweens.add({ targets: img, scaleY: 1.015, duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'sine.inout' });
    return img;
  }

  // she walks: stepped by distance, feet never slide
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
        const k = `wr-p-${id}#${stride}`;
        if (this.textures.exists(k)) img.setTexture(k);
      },
      onComplete: () => {
        img.setTexture(`wr-p-${id}`);
        if (cb) cb();
      },
    });
  }

  take(id, texKey) {
    this.carry = id;
    if (this.carrySprite) this.carrySprite.destroy();
    this.carrySprite = this.add.image(this.player.x, this.player.y - 42, texKey).setDepth(40);
    sfx('pickup');
    this.updateSatchel();
  }

  dropCarry() {
    if (!this.carry) return;
    const id = this.carry;
    this.floatText(this.player.x, this.player.y - 56, `the ${id} is dropped.`, '#e86a6a');
    const p = this.props[id];
    if (p && p.item) {
      p.item.setVisible(true);
      p.taken = false;
    }
    this.carry = null;
    if (this.carrySprite) this.carrySprite.destroy();
    this.carrySprite = null;
    this.updateSatchel();
  }

  onHurtExtra() {
    this.dropCarry();
    if (this.typing) {
      this.typing.destroy();
      this.typing = null;
      this.player.typing = false;
    }
  }

  // ---------- the pen: ink and words ----------------------------------

  spendInk(n) {
    if (this.ink < n) {
      this.floatText(this.player.x, this.player.y - 60, 'the pen is dry.', '#c8c0b0');
      return false;
    }
    this.ink -= n;
    this.updateHud();
    return true;
  }

  addWord(word, from = null) {
    if (this.words.includes(word)) {
      this.floatText(this.player.x, this.player.y - 60, `${word}. he has that one.`, '#c8c0b0');
      return;
    }
    if (this.words.length >= this.wordCap) {
      // drop the oldest word that is not the honest one
      const idx = this.words.findIndex((w) => w !== 'honest');
      const gone = this.words.splice(idx, 1)[0];
      this.floatText(this.player.x, this.player.y - 76, `(${gone} — dropped)`, '#8a8478');
    }
    this.words.push(word);
    this.everWords.add(word);
    sfx('clack');
    this.floatText(this.player.x, this.player.y - 60, from ? `${word}. (${from})` : `${word}.`, '#f2e0a0');
    this.updateSatchel();
  }

  updateSatchel() {
    this.satchel = [...this.words];
    if (this.carry) this.satchel.push(this.carry.toUpperCase());
    this.updateSatchelHud();
  }

  addPages(n, why) {
    this.pages = Math.max(0, this.pages + n);
    if (n > 0) this.floatText(this.player.x, this.player.y - 70, `+${n} pages${why ? ` — ${why}` : ''}`, '#f2e0a0');
    if (this.pages >= 12) this.setFlag('pages12');
    if (this.pages >= 30) this.setFlag('pages30');
    if (this.pages >= 60) this.setFlag('pages60');
    this.updateHud();
  }

  // what an edit does to the thing it is written on (§3.1)
  onEdit(id, adj, prev, { revert } = {}) {
    const p = this.props[id];
    switch (id) {
      case 'typewriter':
        if (adj === 'working') this.setObjective('sit. write. (four pages)');
        break;
      case 'trunk':
      case 'cart':
        if (p && p.body) {
          const light = adj === 'light';
          p.body.setMass(light ? 1 : 1000);
          p.body.setMaxVelocityX(light ? 80 : 0);
          if (!light) p.body.setVelocityX(0);
        }
        break;
      case 'toner':
        if (adj === 'light' && p) p.liftable = true;
        break;
      case 'machine1':
      case 'machine2':
      case 'machine3':
      case 'machine4':
        if (adj === 'working' && !revert) this.fixMachine(id);
        break;
      case 'rollers':
        for (const h of this.spikes.getChildren()) {
          if (h.x >= px(100) && h.x <= px(103)) {
            h.body.enable = adj !== 'cold';
            h.setTint(adj === 'cold' ? 0x88b8d8 : 0xffffff);
          }
        }
        break;
      case 'spill':
        for (let tx = 103; tx <= 106; tx++) {
          if (adj === 'dry') delete this.surfaceGrid[34][tx];
          else (this.surfaceGrid[34] ||= {})[tx] = 'grease';
        }
        break;
      case 'gap':
        if (adj === 'wide') this.setFlag('gap_wide');
        break;
      case 'espresso':
        this.espressoQuiet = adj === 'quiet';
        break;
      case 'ladder':
        this.cafeLadder.forEach((img, i) => {
          img.setVisible(adj === 'fixed');
          if (adj === 'fixed') (this.ladderGrid[28 + i] ||= {})[141] = true;
          else if (this.ladderGrid[28 + i]) delete this.ladderGrid[28 + i][141];
        });
        break;
      case 'bench':
        break;
      case 'alcove':
        if (this.alcoveDark) this.tweens.add({ targets: this.alcoveDark, alpha: adj === 'lit' ? 0 : 0.92, duration: 500 });
        if (adj === 'lit') this.reveal('weather');
        break;
      case 'shelf':
        if (this.historyBook) this.tweens.add({ targets: this.historyBook, y: adj === 'low' ? px(13) : px(11), duration: 700, ease: 'sine.inout' });
        break;
      case 'dumbwaiter':
        break;
      case 'ledge':
        this.ledgeTiles.forEach((img) => {
          img.setAlpha(adj === 'wide' ? 1 : 0.15);
          img.body.enable = adj === 'wide';
        });
        break;
      case 'crane':
        if (this.crane) this.crane.fast = adj === 'fast';
        break;
      default:
        break;
    }
  }

  // ---------- the world ------------------------------------------------

  buildWorld() {
    const B = this.built.objects;
    for (const o of B) {
      const floor = (o.ty + 1) * T;
      switch (o.type) {
        case 'prop':
          this.buildProp(o, floor);
          break;
        case 'label':
          this.labels.add({ id: o.id, x: o.wx, y: o.wy - 6, noun: o.noun, adj: o.adj, bound: !!o.bound, to: o.to });
          break;
        case 'word': {
          const g = this.add.image(o.wx, o.wy, 'wr-page').setDepth(20);
          const t = this.add.text(o.wx, o.wy - 16, o.word, { fontFamily: 'monospace', fontSize: '11px', color: '#f2e0a0', fontStyle: 'italic', backgroundColor: '#14101c' }).setOrigin(0.5).setDepth(21);
          this.tweens.add({ targets: [g, t], y: '-=4', duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
          (this.wordPickups ||= []).push({ ...o, g, t, taken: false });
          break;
        }
        case 'inkwell': {
          this.add.image(o.wx, floor, 'wr-inkwell').setOrigin(0.5, 1).setDepth(9);
          this.addInteract(o.wx, floor - 16, 'refill the pen', () => {
            this.ink = this.inkMax;
            sfx('drip');
            this.floatText(o.wx, floor - 50, 'ink.', '#88b8d8');
            this.updateHud();
          }, { once: false, when: () => this.ink < this.inkMax });
          break;
        }
        case 'desk':
          this.buildDesk(o, floor);
          break;
        case 'npc':
          this.buildNpc(o, floor);
          break;
        case 'dialogue':
          (this.dialogueZones ||= []).push({ ...o, done: false });
          break;
        case 'panel':
          this.buildPanel(o, floor);
          break;
        case 'source':
          this.buildSource(o, floor);
          break;
        case 'glass':
          this.buildGlass(o);
          break;
        case 'dumbwaiter':
          this.buildDumbwaiter(o);
          break;
        case 'crane':
          this.buildCrane(o);
          break;
        case 'ledge':
          this.ledgeTiles = [];
          for (let tx = o.tx; tx <= o.x1 + this.roomOf(o)._x0; tx++) {
            const img = this.add.image(px(tx), px(o.ty), `${writerTiles.key}_s_15_${tx % 3}`).setDepth(D.TERRAIN).setAlpha(0.15);
            this.physics.add.existing(img, true);
            img.body.enable = false;
            this.solids.add(img);
            this.ledgeTiles.push(img);
          }
          break;
        case 'plate': {
          this.add.image(o.wx, floor, 'wr-plate').setOrigin(0.5, 1).setDepth(9);
          (this.plates ||= []).push({ ...o, floor, pressed: false });
          break;
        }
        case 'lever': {
          const img = this.add.image(o.wx, floor, 'wr-lever').setOrigin(0.5, 1).setDepth(9);
          if (o.name) this.add.text(o.wx, floor - 30, o.name, { fontFamily: 'monospace', fontSize: '10px', color: '#e8762a' }).setOrigin(0.5).setDepth(9);
          const lever = { ...o, img, pulled: false };
          (this.levers ||= []).push(lever);
          this.addInteract(o.wx, floor - 12, `pull ${o.name || 'the lever'}`, () => this.pullLever(lever), { once: false, when: () => !lever.pulled });
          break;
        }
        case 'hazard':
          this.buildHazard(o, floor);
          break;
        case 'wake':
          this.wakeX = o.wx;
          break;
        case 'editor': {
          const ed = new InnerEditor(this, { x: o.wx, y: floor, stopX: o.stop ? px(o.stop) : (this.roomOf(o)._x0 + this.roomOf(o).grid[0].length - 2) * T, speed: o.slow ? 40 : this.editorSpeed });
          ed.from = px(o.from); // `from` and `stop` are written in world columns
          ed.follow = !!o.follow; // the chase across the city: it keeps Jo's level
          ed.room = this.roomOf(o).id;
          this.editors.push(ed);
          break;
        }
        case 'editor_wait': {
          const ed = new InnerEditor(this, { x: o.wx, y: floor, stopX: o.wx, speed: 0, waiting: true });
          ed.room = 'rewrite';
          this.editorWait = ed;
          break;
        }
        case 'pencil': {
          const img = this.add.image(o.wx, floor - 6, 'wr-pencil').setDepth(20);
          this.tweens.add({ targets: img, y: img.y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
          this.addInteract(o.wx, floor - 10, 'take the red pencil', () => {
            img.destroy();
            this.player.tool.setTexture('tool-pencil');
            this.pencil = true;
            sfx('pickup');
            this.floatText(o.wx, floor - 60, 'THE RED PENCIL — it does not write. it takes away.', '#f2d580');
            this.setObjective(`forty pages are the book. (${this.pages} now)`);
          });
          break;
        }
        case 'chair': {
          this.add.image(o.wx, floor, 'wr-chair').setOrigin(0.5, 1).setDepth(8);
          (this.chairs ||= []).push({ ...o, floor });
          break;
        }
        case 'lectern':
          this.lectern = { x: o.wx, y: floor };
          this.add.image(o.wx, floor, 'wr-lectern').setOrigin(0.5, 1).setDepth(9);
          break;
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
    // the café's broken ladder, hidden until it is fixed
    this.cafeLadder = [];
    for (let r = 28; r <= 33; r++) this.cafeLadder.push(this.add.image(px(141), px(r), `${writerTiles.key}_ladder`).setDepth(D.TERRAIN).setVisible(false));
    // the landlady wants the rent
    const landlady = this.foes.find((f) => f.kind === 'landlady');
    if (landlady) {
      this.addInteract(landlady.x, landlady.y, 'the rent', async () => {
        if (this.machinesFixed >= 4) {
          await this.dialog.show(DIALOGUES.rent_yes);
          this.setFlag('rent_paid');
          this.standDown(landlady);
          this.setObjective(this.pages >= 12 ? 'the café' : 'the back-room desk (12 pages)');
        } else {
          await this.dialog.show(DIALOGUES.rent_no);
          this.setObjective('the copy shop. fix four machines.');
        }
      }, { once: false, follow: landlady, when: () => !this.F.rent_paid && landlady.active && landlady.state !== 'windup' && landlady.state !== 'grabbing' });
    }
  }

  standDown(foe) {
    foe.passive = true;
    foe.enter('patrol', 0);
    foe.speedBase = 0;
    foe.setVelocityX(0);
    foe.clearTint();
    if (foe.sightCone) foe.sightCone.setVisible(false);
  }

  roomOf(o) {
    return this.built.rooms.find((r) => r.id === o.room);
  }

  buildProp(o, floor) {
    const key = `wr-${o.kind.replace(/_/g, '-')}`;
    let img;
    if (o.kind === 'trunk' || o.kind === 'cart') {
      // a thing to push: immovable while `heavy`
      const h = o.kind === 'trunk' ? 90 : 36;
      img = this.physics.add.image(o.wx, floor - h / 2, key).setDepth(9);
      img.setDisplaySize(o.kind === 'trunk' ? 36 : 48, h);
      // heavy = a huge mass and no horizontal speed at all (immovable would
      // stop it colliding with the static floor and it fell through)
      img.body.setMass(1000).setDragX(600).setMaxVelocityX(0);
      img.body.setSize(img.width, img.height, true); // unscaled: Arcade applies the sprite's scale itself
      this.physics.add.collider(img, this.solids);
      this.physics.add.collider(img, this.oneWays);
      this.physics.add.collider(this.player, img);
      this.props[o.id] = img;
      if (o.kind === 'cart') img.setDepth(9).setTint(0xd8d0c0);
    } else if (o.kind === 'lamp_post') {
      img = this.add.image(o.wx, floor, key).setOrigin(0.5, 1).setDepth(6);
      this.add.image(o.wx, floor - 40, 'wr-glow').setDepth(7).setScale(2.2).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    } else {
      img = this.add.image(o.wx, floor, key).setOrigin(0.5, 1).setDepth(o.kind === 'mattress' || o.kind === 'table' || o.kind === 'bench' ? 7 : 9);
      if (o.id) this.props[o.id] = img;
    }
    if (o.noun) {
      const top = o.kind === 'trunk' ? floor - 96 : floor - img.displayHeight;
      this.labels.add({ id: o.id, x: o.wx, y: top - 14, noun: o.noun, adj: o.adj, bound: !!o.bound, to: o.to, follow: o.kind === 'trunk' || o.kind === 'cart' ? img : null });
    }
    if (o.kind === 'machine') {
      img.setTint(0xb8a8a8);
      (this.machines ||= {})[o.id] = { ...o, img, floor, fixed: false };
      if (o.accepts) {
        this.addInteract(o.wx, floor - 20, `the ${o.accepts}`, () => {
          this.carry = null;
          this.carrySprite.destroy();
          this.carrySprite = null;
          this.updateSatchel();
          this.fixMachine(o.id);
        }, { once: false, when: () => this.carry === o.accepts && !this.machines[o.id].fixed });
      }
    }
    if (o.carry) {
      const p = { item: img, taken: false, liftable: o.kind !== 'toner' };
      this.props[o.id] = Object.assign(img, p);
      this.addInteract(o.wx, floor - 16, `take the ${o.id}`, () => {
        if (!img.liftable) {
          this.floatText(o.wx, floor - 50, 'too heavy.', '#c8c0b0');
          return;
        }
        img.setVisible(false);
        img.taken = true;
        this.labels.hide(o.id, true);
        this.take(o.id, key);
      }, { once: false, when: () => !img.taken && !this.carry });
    }
    if (o.kind === 'cabinet') {
      this.addInteract(o.wx, floor - 20, 'the key', () => {
        this.carry = null;
        this.carrySprite.destroy();
        this.carrySprite = null;
        this.updateSatchel();
        sfx('click');
        this.labels.apply(this.labels.get('cabinet'), 'open', { free: true });
        this.reveal('maps');
      }, { once: false, when: () => this.carry === 'key' && !this.F.cabinet_open });
    }
    if (o.kind === 'dog') {
      this.dog = img;
      img.setFlipX(true);
    }
    if (o.kind === 'espresso') {
      this.espresso = { x: o.wx, y: floor };
      const steam = this.add.circle(o.wx, floor - 40, 8, 0xe8e4d8, 0.2).setDepth(10);
      this.tweens.add({ targets: steam, y: floor - 80, alpha: 0, duration: 1800, repeat: -1 });
    }
    if (o.kind === 'bag') this.bag = img;
    if (o.kind === 'tray') this.tray = { x: o.wx, y: floor };
  }

  fixMachine(id) {
    const m = this.machines[id];
    if (!m || m.fixed) return;
    m.fixed = true;
    m.img.clearTint();
    this.machinesFixed += 1;
    sfx('deliver');
    const l = this.labels.get(id);
    if (l && l.adj !== 'working') this.labels.apply(l, 'working', { free: true });
    // it pays in pennies
    if (this.coinMgr) for (let i = 0; i < 3; i++) this.coinMgr.spawn(m.img.x - 24 + i * 24, m.floor - 60);
    this.floatText(m.img.x, m.floor - 70, `machine ${this.machinesFixed}/4 running`, '#f2d580');
    if (this.machinesFixed >= 4 && !this.F.rent_paid) {
      this.setObjective('the rent. (she is outside)');
      // she has heard the machines running: she waits at her door now
      const landlady = this.foes.find((f) => f.kind === 'landlady');
      if (landlady) this.standDown(landlady);
    }
  }

  buildDesk(o, floor) {
    this.add.image(o.wx, floor, 'wr-desk').setOrigin(0.5, 1).setDepth(7);
    if (!o.fixTypos && o.id !== 'desk1') this.add.image(o.wx, floor - 14, 'wr-typewriter').setOrigin(0.5, 1).setDepth(8).setScale(0.8);
    this.add.image(o.wx, floor - 30, 'wr-glow').setDepth(6).setScale(1.6).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);
    const desk = { ...o, floor, done: false };
    (this.desks ||= []).push(desk);
    if (o.fixTypos) {
      this.addInteract(o.wx, floor - 16, 'fix a typo (2 s)', () => {
        this.player.controlLockUntil = this.time.now + 2000;
        this.player.body.setVelocity(0, 0);
        this.player.typing = true;
        this.time.delayedCall(2000, () => {
          this.player.typing = false;
          this.typos = Math.max(0, this.typos - 1);
          sfx('clack');
          this.floatText(o.wx, floor - 60, this.typos ? `${this.typos} left` : 'clean.', '#f2e0a0');
          this.updateHud();
        });
      }, { once: false, when: () => this.typos > 0 });
      return;
    }
    const ready = () => {
      if (o.needs === 'typewriter') return this.labels.get('typewriter').adj === 'working';
      if (o.needs === 'bench') return this.labels.get('bench').adj === 'dry';
      return true;
    };
    this.addInteract(o.wx, floor - 16, 'sit and write', () => {
      if (!ready()) {
        this.floatText(o.wx, floor - 56, o.needs === 'typewriter' ? 'the typewriter is jammed.' : 'the bench is wet.', '#c8c0b0');
        return;
      }
      this.startTyping(desk);
    }, { once: false, when: () => !desk.done });
  }

  startTyping(desk) {
    const p = this.player;
    p.controlLockUntil = this.time.now + 999999;
    p.body.setVelocity(0, 0);
    p.typing = true;
    showTutorial(this, 'typing');
    this.typing = new Typing(this, {
      count: desk.bars * 2,
      bpm: 84 + Math.min(24, desk.bars * 2),
      cat: !!desk.cat,
      onDone: (hits, typos) => {
        this.typing = null;
        p.typing = false;
        p.controlLockUntil = 0;
        desk.done = true;
        this.typos += typos;
        this.addPages(desk.pages, `${hits} clean`);
        this.afterDesk(desk.id);
      },
    });
  }

  afterDesk(id) {
    if (id === 'desk1') this.setObjective('the trunk. then the street.');
    if (id === 'desk2') this.setObjective(this.F.rent_paid ? 'the café' : 'the rent. (she is outside)');
    if (id === 'desk3') this.setObjective('the library');
    if (id === 'desk4') this.setObjective(this.F.research && this.F.structure ? 'post it. forty addresses.' : 'five sources, and the shape of it');
  }

  buildNpc(o, floor) {
    const who = o.who;
    const img = this.person(who, o.wx, floor, { flip: o.id !== 'wren2' });
    this.props[o.id || who] = img;
    if (who === 'wren' && !o.id) {
      this.addInteract(o.wx, floor - 20, 'Wren', async () => {
        if (!this.F.met_wren) {
          await this.dialog.show(DIALOGUES.d1);
          this.setFlag('met_wren');
          this.addWord('honest', 'the napkin');
          this.setObjective('the napkin: her challenge');
          return;
        }
        const ok = await napkin(this);
        if (ok) {
          this.setFlag('lines');
          this.addWord('true', 'the napkin');
          this.addPages(6, 'her lines');
          this.setObjective('the garden table (30 pages)');
        }
      }, { once: false, when: () => !this.F.lines });
    }
    if (who === 'emmerich' && !o.id) {
      this.addInteract(o.wx, floor - 20, 'Emmerich', async () => {
        await this.dialog.show(DIALOGUES.d2);
        this.setFlag('page_three_planted');
      }, { once: true });
    }
    if (who === 'tomasz') {
      this.addInteract(o.wx, floor - 20, 'Tomasz', async () => {
        await this.dialog.show(this.F.rent_paid ? DIALOGUES.tomasz2 : DIALOGUES.tomasz);
      }, { once: false });
    }
  }

  buildPanel(o, floor) {
    if (o.puzzle === 'structure') {
      this.addInteract(o.wx, floor - 20, 'the cards', async () => {
        if (!this.told.d2b) {
          this.told.d2b = true;
          await this.dialog.show(DIALOGUES.d2b);
        }
        const order = await structure(this);
        if (order) {
          this.structureOrder = order;
          this.setFlag('structure');
          this.addWord('necessary', 'the shape');
          this.reveal('grief');
          this.setObjective(this.F.research ? 'the desk (60 pages)' : 'the stacks: five sources');
        }
      }, { once: false, when: () => !this.F.structure && this.pages >= 30 });
    }
    if (o.puzzle === 'memory') {
      this.addInteract(o.wx, floor - 20, 'the wall of cards', async () => {
        const fragments = [];
        for (const w of this.everWords) fragments.push({ id: `w_${w}`, name: w, t: TENSION[w] || 2 });
        for (const s of this.sources) if (!fragments.some((f) => f.name === s.word)) fragments.push({ id: `s_${s.id}`, name: s.name.toLowerCase(), t: TENSION[s.word] || 3 });
        const res = await memory(this, this.structureOrder || [], fragments);
        if (res) {
          this.memoryUsed = res.used;
          this.pages = 30 + res.used * 5;
          this.updateHud();
          this.floatText(o.wx, floor - 70, `${this.pages} pages. from memory.`, '#f2e0a0');
          this.setFlag('rewritten_p');
          this.wrenArrives();
        }
      }, { once: false, when: () => this.F.draft_lost && !this.F.rewritten_p });
    }
  }

  buildSource(o, floor) {
    const img = this.add.image(o.wx, o.shelf ? px(11) : floor - 4, 'wr-book').setOrigin(0.5, 1).setDepth(20);
    const t = this.add.text(o.wx, img.y - 30, o.name, { fontFamily: 'monospace', fontSize: '9px', color: '#e8e4d8' }).setOrigin(0.5).setDepth(21);
    const src = { ...o, img, t, shown: !o.hidden, taken: false };
    if (o.hidden) {
      img.setVisible(false);
      t.setVisible(false);
    }
    if (o.shelf) this.historyBook = img;
    (this.sourceItems ||= []).push(src);
    this.addInteract(o.wx, o.shelf ? px(13) : floor - 16, `take: ${o.name}`, () => {
      src.taken = true;
      img.destroy();
      t.destroy();
      this.sources.push(src);
      sfx('pickup');
      this.addWord(o.word, o.name.toLowerCase());
      this.floatText(o.wx, floor - 80, `${o.name} — ${this.sources.length}/5`, '#f2d580');
      if (this.sources.length >= 5) {
        this.setFlag('research');
        this.setObjective(this.F.structure ? 'the desk (60 pages)' : 'the shape of it: the cards');
      }
    }, { once: false, when: () => src.shown && !src.taken && (!o.shelf || this.labels.get('shelf').adj === 'low') && Math.abs(this.player.y - (o.shelf ? px(13) : floor - 16)) < 44 });
  }

  reveal(id) {
    const s = (this.sourceItems || []).find((x) => x.id === id);
    if (!s || s.shown) return;
    s.shown = true;
    s.img.setVisible(true).setAlpha(0);
    s.t.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: [s.img, s.t], alpha: 1, duration: 500 });
    if (id === 'maps') this.setFlag('cabinet_open');
  }

  buildGlass(o) {
    this.glass = [];
    const x0 = o.tx;
    const x1 = o.x1 + this.roomOf(o)._x0;
    for (let tx = x0; tx <= x1; tx++) {
      const img = this.add.image(px(tx), px(o.ty) - T / 2 + 6, 'wr-glass').setDepth(D.TERRAIN).setAlpha(0.8);
      this.physics.add.existing(img, true);
      img.body.setSize(T, 12).setOffset(0, 0);
      img.body.checkCollision.down = false;
      img.body.checkCollision.left = false;
      img.body.checkCollision.right = false;
      this.oneWays.add(img);
      this.glass.push(img);
    }
    this.glassRange = { x0, x1, ty: o.ty };
    this.labels.add({ id: 'glass', x: px((x0 + x1) / 2), y: px(o.ty) - 30, noun: 'floor', adj: 'fragile', bound: true });
    // a dark alcove on floor 2, lit by a word
    this.alcoveDark = this.add.rectangle(px(205), px(24) + 10, 96, 60, 0x0a0a12, 0.92).setDepth(19);
  }

  buildDumbwaiter(o) {
    const bottomY = (o.ty + 1) * T - 6; // its floor sits a step above the stacks' floor, so Jo lands on it, not beside it
    const topY = o.top * T + 6 + T;
    const lift = this.physics.add.image(o.wx, bottomY, 'wr-lift').setImmovable(true).setDepth(D.TERRAIN + 1);
    lift.body.setAllowGravity(false);
    lift.body.checkCollision.down = false;
    this.physics.add.collider(this.player, lift);
    this.lift = { img: lift, bottomY, topY, up: false };
    this.labels.add({ id: 'dumbwaiter', x: o.wx, y: bottomY - 30, noun: o.noun, adj: o.adj, bound: false, to: o.to, follow: lift });
    // the shaft
    this.add.rectangle(o.wx, (topY + bottomY) / 2, 30, bottomY - topY + 40, 0x0a0a12, 0.5).setDepth(D.TERRAIN - 0.5);
  }

  buildCrane(o) {
    const x0 = o.wx;
    const x1 = px(o.x1 + this.roomOf(o)._x0);
    const img = this.physics.add.image(x0, o.ty * T + 6, 'wr-crane').setImmovable(true).setDepth(D.TERRAIN + 1);
    img.body.setAllowGravity(false);
    img.body.checkCollision.down = false;
    this.physics.add.collider(this.player, img);
    this.crane = { img, x0, x1, dir: 1, fast: false, lastX: x0 };
    // the cable and the hook, so it reads as a crane and not a raft
    this.add.rectangle((x0 + x1) / 2, o.ty * T - 120, x1 - x0 + 64, 4, 0x3a3a44).setDepth(D.TERRAIN);
    this.labels.add({ id: 'crane', x: x0, y: o.ty * T - 20, noun: o.noun, adj: o.adj, to: o.to, follow: img });
  }

  buildHazard(o, floor) {
    if (o.kind === 'roller') {
      const img = this.add.image(o.wx, floor - 60, 'wr-roller').setDepth(15);
      (this.rollers ||= []).push({ ...o, img, up: floor - 60, down: floor - 16, floor, state: 'up' });
    } else if (o.kind === 'folder') {
      const img = this.add.image(o.wx, floor - 14, 'wr-folder').setDepth(15).setOrigin(0.5, 1);
      (this.folders ||= []).push({ ...o, img, floor });
    }
  }

  moment(id, x, y) {
    this.addInteract(x, y, 'pause', async () => {
      const m = MOMENTS[id];
      this.moments += 1;
      recordMoment('writer', id);
      this.setFlag(id);
      sfx('chime');
      this.player.controlLockUntil = this.time.now + 5000;
      this.player.body.setVelocity(0, 0);
      const cam = this.cameras.main;
      const t1 = this.add.text(cam.width / 2, cam.height - 150, m.sub, { fontFamily: 'monospace', fontSize: '14px', color: '#c8c0b0', align: 'center', wordWrap: { width: 700 } }).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
      const t2 = this.add.text(cam.width / 2, cam.height - 116, m.text, { fontFamily: 'monospace', fontSize: '17px', color: '#f2e0a0', fontStyle: 'italic' }).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
      this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 900 });
      this.time.delayedCall(5000, () => this.tweens.add({ targets: [t1, t2], alpha: 0, duration: 800, onComplete: () => [t1, t2].forEach((t) => t.destroy()) }));
    });
  }

  // ---------- chapter 5: the flat is made of paragraphs ----------------

  buildFlat() {
    this.paragraphs = PARAGRAPHS.map((p) => ({ ...p, tiles: [], gone: false }));
    for (const p of this.paragraphs) {
      for (let tx = p.x0; tx <= p.x1; tx++) {
        const img = this.add.image(px(tx), px(p.y), `${writerTiles.key}_s_${tx === p.x0 ? 7 : tx === p.x1 ? 13 : 5}_${tx % 3}`).setDepth(D.TERRAIN).setTint(p.three ? 0xf2e0c0 : p.bound ? 0xc8d8e8 : 0xe8e4d8);
        this.physics.add.existing(img, true);
        this.solids.add(img);
        p.tiles.push(img);
      }
      const cx = px((p.x0 + p.x1) / 2);
      p.label = this.labels.add({ id: `para_${p.id}`, x: cx, y: px(p.y) - 30, noun: '', adj: p.name, bound: !!p.bound });
      p.label.para = p;
      if (p.three) {
        // warm light and a vignette of its own: it is the most beautiful thing in the room
        this.add.image(cx, px(p.y) - 40, 'wr-glow').setDepth(6).setScale(3.5).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
      }
    }
    this.pagesAtFlat = null;
  }

  // the red pencil: strike a paragraph and it goes
  cutParagraph(p, { erased = false } = {}) {
    if (p.gone) return;
    if (p.bound) {
      this.floatText(p.label.x, p.label.y - 20, 'necessary. it stays.', '#c8c0b0');
      return;
    }
    p.gone = true;
    this.cut[p.id] = true;
    this.pages = Math.max(0, this.pages - p.w);
    sfx('scratch');
    this.labels.hide(p.label.id, true);
    p.tiles.forEach((t, i) => {
      t.setAlpha(0.4);
      this.time.delayedCall(350 + i * 30, () => {
        if (t.body) t.body.enable = false;
        this.tweens.add({ targets: t, y: t.y + 60, alpha: 0, duration: 500, ease: 'quad.in' });
      });
    });
    this.floatText(p.label.x, p.label.y - 24, erased ? `(erased) −${p.w}` : `−${p.w} pages`, erased ? '#8a8478' : '#e86a6a');
    if (this.editorFlat && !erased) this.editorFlat.haltUntil = this.time.now + 2000;
    // what rested on it drops a second later
    for (const q of this.paragraphs) if (q.on === p.id && !q.gone) this.time.delayedCall(1000, () => this.cutParagraph(q, { erased: true }));
    this.updateHud();
    if (this.pages <= 40 && !this.F.cut_done) {
      this.setFlag('cut_done');
      this.floatText(px(456), px(17), 'the door light turns green.', '#7ec87e');
      this.setObjective('the door.');
    } else if (!this.F.cut_done) this.setObjective(`forty pages are the book. (${this.pages} now)`);
  }

  restoreParagraphs() {
    for (const p of this.paragraphs) {
      if (!p.gone) continue;
      p.gone = false;
      this.labels.hide(p.label.id, false);
      p.tiles.forEach((t) => {
        this.tweens.killTweensOf(t);
        t.setAlpha(1);
        t.y = px(p.y);
        if (t.body) {
          t.body.enable = true;
          t.body.updateFromGameObject();
        }
      });
    }
    this.cut = {};
    if (this.pagesAtFlat !== null) this.pages = this.pagesAtFlat;
    this.updateHud();
  }

  // ---------- chapter 6: the press ------------------------------------

  buildPress() {
    this.fed = false;
    this.printed = false;
  }

  pullLever(lever) {
    lever.pulled = true;
    lever.img.setFlipX(true);
    sfx('clang');
    if (lever.fixes) {
      this.fixMachine(lever.fixes);
      return;
    }
    const expect = this.leversPulled.length;
    if (lever.order !== expect) {
      this.jam();
      return;
    }
    this.leversPulled.push(lever.id);
    this.floatText(lever.img.x, lever.img.y - 50, `${lever.name}. ${['then the press.', 'then the fold.', ''][expect] || ''}`, '#f2d580');
    if (this.leversPulled.length === 3) this.printBook();
  }

  jam() {
    sfx('fail');
    this.cameras.main.shake(300, 0.01);
    this.floatText(this.player.x, this.player.y - 70, 'JAMMED. the web stops. the rollers do not.', '#e86a6a');
    this.leversPulled = [];
    for (const l of this.levers || []) {
      l.pulled = false;
      l.img.setFlipX(false);
    }
    this.time.delayedCall(700, () => this.hurt());
  }

  printBook() {
    if (!this.fed) {
      this.floatText(this.player.x, this.player.y - 70, 'nothing in the feed. (the plate at the top)', '#c8c0b0');
      this.leversPulled = [];
      for (const l of this.levers || []) {
        l.pulled = false;
        l.img.setFlipX(false);
      }
      return;
    }
    sfx('thump');
    const book = this.add.image(this.tray.x, this.tray.y - 300, 'wr-book-bound').setDepth(20);
    this.tweens.add({ targets: book, y: this.tray.y - 12, duration: 1400, ease: 'bounce.out' });
    this.addInteract(this.tray.x, this.tray.y - 16, 'take the book', () => {
      book.destroy();
      this.take('book', 'wr-book-bound');
      this.setFlag('printed');
      this.deadline = null;
      this.updateHud();
      for (const ed of this.editors) if (ed.room === 'agent') ed.leave();
      musicDirector.setState('quiet');
      this.floatText(this.tray.x, this.tray.y - 70, `${this.pages} pages, bound. it leaves his hands.`, '#f2d580');
      this.setObjective('the reading');
    }, { once: true });
  }

  // ---------- chapter 7: the bookshop ---------------------------------

  buildBookshop() {
    for (const c of this.chairs || []) {
      const key = `wr-p-${c.who}`;
      if (this.textures.exists(key)) this.person(c.who, c.wx, c.floor, { sit: true, flip: false });
    }
    if (this.lectern) {
      this.addInteract(this.lectern.x, this.lectern.y - 20, 'read', () => this.reading(), { once: true, when: () => this.F.printed });
    }
  }

  reading() {
    const p = this.player;
    p.controlLockUntil = this.time.now + 999999;
    p.body.setVelocity(0, 0);
    p.typing = true;
    music.stop();
    music.soloPiano();
    const cam = this.cameras.main;
    const bg = this.add.rectangle(cam.width / 2, cam.height - 110, 700, 120, 0x14101c, 0.9).setScrollFactor(0).setDepth(170).setStrokeStyle(1, 0x8a8aa8);
    const t = this.add.text(cam.width / 2 - 330, cam.height - 160, '', { fontFamily: 'monospace', fontSize: '15px', color: '#e8dcc8', wordWrap: { width: 660 }, lineSpacing: 6 }).setScrollFactor(0).setDepth(171);
    const hint = this.add.text(cam.width / 2, cam.height - 40, 'any key. any speed. there are no misses.', { fontFamily: 'monospace', fontSize: '11px', color: '#8a8478' }).setOrigin(0.5).setScrollFactor(0).setDepth(171);
    const words = FIRST_PARAGRAPH.split(' ');
    let i = 0;
    const handler = () => {
      if (i >= words.length) return;
      i += 1;
      t.setText(words.slice(0, i).join(' '));
      sfx('clack');
      if (i >= words.length) {
        this.input.keyboard.off('keydown', handler);
        this.time.delayedCall(1200, async () => {
          [bg, t, hint].forEach((o) => o.destroy());
          // nine people clap
          for (let k = 0; k < 9; k++) this.time.delayedCall(k * 140, () => sfx('click'));
          this.time.delayedCall(1400, async () => {
            const d6 = DIALOGUES.d6.map((e) => ({ ...e, text: e.text.replace('{page_three}', this.pageThreeChoice === 'kept' ? 'Kept.' : 'Cut.') }));
            await this.dialog.show(d6);
            p.typing = false;
            p.controlLockUntil = 0;
            const o = this.orbs.create(this.orbAt.x, this.orbAt.y, 'orb').setDepth(95).setAlpha(0);
            this.tweens.add({ targets: o, alpha: 1, duration: 900 });
            this.tweens.add({ targets: o, y: this.orbAt.y - 6, duration: 1000, yoyo: true, repeat: -1, ease: 'sine.inout' });
            this.setObjective('the shelf. spine out.');
          });
        });
      }
    };
    this.time.delayedCall(400, () => this.input.keyboard.on('keydown', handler));
  }

  catchOrb(orb) {
    if (this.cardActive || this.orbCaught) return;
    this.orbCaught = true;
    completeDream('writer');
    updateSave((s) => {
      s.flags.wr = { page_three: this.pageThreeChoice, pages: this.pages, attentive: this.memoryUsed >= 6 };
    });
    music.stop();
    music.soloPiano();
    sfx('orb');
    this.tweens.add({ targets: orb, scale: 2.5, alpha: 0, duration: 700 });
    const momentMsg = this.moments === 0 ? "You didn't notice anything on the way." : this.moments < 3 ? 'You noticed a little.' : 'You noticed. Maybe that was the point.';
    const lines = [`${this.pages} pages.`, '', 'Was it enough?', '', momentMsg, this.pageThreeChoice === 'kept' ? CARD_LINES.kept : CARD_LINES.cut];
    if (this.memoryUsed >= 6) lines.push(CARD_LINES.attentive);
    lines.push('', '[X] Return to Crossroads Station');
    this.showCard(lines, () => {
      music.stop();
      this.scene.start('Hub', { returnedFrom: 'writer' });
    });
  }

  // ---------- chapter 4 ------------------------------------------------

  wrenArrives() {
    const floor = px(20) + 16;
    const wren = this.person('wren', px(370), floor);
    wren.setAlpha(0);
    this.tweens.add({ targets: wren, alpha: 1, duration: 400 });
    this.walkPerson(wren, 'wren', this.player.x - 40, async () => {
      const soup = this.add.image(wren.x + 16, floor - 30, 'wr-soup').setDepth(12);
      await this.dialog.show(DIALOGUES.d3b);
      soup.destroy();
      this.addWord('again', 'the soup');
      this.setFlag('rewritten');
      this.setObjective('the editor. (the stairs, past the door)');
      if (this.editorWait) {
        this.editorWait.done = true;
        this.tweens.add({ targets: this.editorWait.art, alpha: 0, duration: 1500 });
        this.tweens.add({ targets: this.editorWait.shadow, alpha: 0, duration: 1500 });
      }
    });
  }

  later() {
    if (this.F.later) return;
    this.setFlag('later');
    const cam = this.cameras.main;
    const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0).setScrollFactor(0).setDepth(230);
    const label = this.add.text(cam.width / 2, cam.height / 2, 'later.', { fontFamily: 'monospace', fontSize: '22px', color: '#e8dcc8', fontStyle: 'italic' }).setOrigin(0.5).setScrollFactor(0).setDepth(231).setAlpha(0);
    this.player.controlLockUntil = this.time.now + 2400;
    this.player.body.setVelocity(0, 0);
    this.tweens.add({ targets: wipe, alpha: 1, duration: 700 });
    this.tweens.add({ targets: label, alpha: 1, duration: 700, delay: 500 });
    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets: [wipe, label], alpha: 0, duration: 600, onComplete: () => [wipe, label].forEach((o) => o.destroy()) });
      // the boxes open
      this.slipTimer = this.time.addEvent({ delay: 1100, loop: true, callback: () => this.spawnSlips() });
      this.setObjective('the pen tears paper. get to the door.');
      musicDirector.setState('danger');
    });
  }

  spawnSlips() {
    if (this.slipsSpawned >= this.slipTotal) {
      this.slipTimer.remove();
      return;
    }
    const n = Math.min(5, this.slipTotal - this.slipsSpawned);
    for (let i = 0; i < n; i++) {
      const x = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-260, 300), px(252), px(287));
      const f = this.addFoe({ kind: 'slip', wx: x, wy: px(19) + Phaser.Math.Between(-30, 30) });
      if (f) {
        f.wob = Math.random() * 6;
        this.slips.push(f);
      }
    }
    this.slipsSpawned += n;
  }

  wake() {
    if (this.F.draft_lost) return;
    this.setFlag('draft_lost');
    const cam = this.cameras.main;
    const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0).setScrollFactor(0).setDepth(230);
    this.player.controlLockUntil = this.time.now + 3000;
    this.player.body.setVelocity(0, 0);
    this.tweens.add({ targets: wipe, alpha: 1, duration: 800 });
    this.time.delayedCall(1400, () => {
      if (this.bag) this.bag.destroy();
      this.pages = 0;
      this.words = this.words.filter((w) => w === 'honest');
      this.updateSatchel();
      this.updateHud();
      music.stop();
      this.tweens.add({ targets: wipe, alpha: 0, duration: 900, onComplete: () => wipe.destroy() });
      this.floatText(this.player.x, this.player.y - 70, 'the bag is gone.', '#e8dcc8');
      this.setObjective('');
      this.satchelHud.setText('[honest]');
    });
  }

  // ---------- the Inner Editor --------------------------------------------

  eraseBehind(x) {
    const ed = this.activeEditor;
    if (!ed) return;
    const lo = ed.from - 3 * T;
    for (const img of this.erasable) {
      if (img.erased || img.x > x || img.x < lo) continue;
      img.erased = true;
      img.origY = img.y;
      this.erased.push(img);
      img.setAlpha(0.35);
      this.time.delayedCall(400, () => {
        if (!img.erased) return;
        if (img.body) img.body.enable = false;
        this.tweens.add({ targets: img, y: img.origY + 50, alpha: 0, duration: 600, ease: 'quad.in' });
      });
    }
    if (ed.room === 'editor') {
      for (const p of this.paragraphs) if (!p.gone && !p.bound && px(p.x1) + 16 < x) this.cutParagraph(p, { erased: true });
    } else {
      for (const l of this.labels.list) if (l.x < x && l.x > lo && l.changed) this.labels.revert(l);
    }
  }

  restoreErased() {
    for (const img of this.erased) {
      img.erased = false;
      this.tweens.killTweensOf(img);
      img.setAlpha(1);
      img.y = img.origY;
      if (img.body) {
        img.body.enable = true;
        img.body.updateFromGameObject();
      }
    }
    this.erased = [];
  }

  pageGoesBlank(ed) {
    if (this.blanking || this.cardActive) return;
    this.blanking = true;
    sfx('fail');
    music.stop();
    const cam = this.cameras.main;
    const wipe = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xf2eee4, 0).setScrollFactor(0).setDepth(230);
    const label = this.add.text(cam.width / 2, cam.height / 2, 'the page goes blank.', { fontFamily: 'monospace', fontSize: '20px', color: '#14101c' }).setOrigin(0.5).setScrollFactor(0).setDepth(231).setAlpha(0);
    this.player.controlLockUntil = this.time.now + 1600;
    this.player.body.setVelocity(0, 0);
    this.tweens.add({ targets: wipe, alpha: 1, duration: 500 });
    this.tweens.add({ targets: label, alpha: 1, duration: 500 });
    this.time.delayedCall(900, () => {
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
      this.restoreErased();
      if (ed.room === 'editor') this.restoreParagraphs();
      ed.reset();
      if (ed.room === 'agent') {
        ed.startX = this.checkpoint.x - this.editorLead;
        ed.x = ed.startX;
        ed.art.x = ed.x;
      }
      ed.started = false;
      this.activeEditor = null;
      this.loseHeart();
      this.tweens.add({ targets: [wipe, label], alpha: 0, duration: 500, onComplete: () => {
        wipe.destroy();
        label.destroy();
        this.blanking = false;
      } });
    });
  }

  // ---------- HUD ------------------------------------------------------

  buildHud() {
    const mk = (y, color = '#c8c0b0') => this.add.text(16, y, '', { fontFamily: 'monospace', fontSize: '12px', color, stroke: '#14101c', strokeThickness: 3 }).setScrollFactor(0).setDepth(150);
    this.inkHud = mk(112, '#88b8d8');
    this.draftHud = mk(130, '#f2e0a0');
    this.noiseBg = this.add.rectangle(16, 152, 90, 8, 0x2a2a34).setOrigin(0, 0.5).setScrollFactor(0).setDepth(149).setVisible(false);
    this.noiseBar = this.add.rectangle(16, 152, 0, 8, 0xe8a030).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150).setVisible(false);
    this.noiseLabel = mk(158, '#8a8478');
    this.deadlineHud = this.add.text(this.cameras.main.width / 2, 30, '', { fontFamily: 'monospace', fontSize: '18px', color: '#e86a6a', stroke: '#14101c', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(150);
    this.updateHud();
  }

  updateHud() {
    this.inkHud.setText(`ink  ${'▮'.repeat(this.ink)}${'▯'.repeat(Math.max(0, this.inkMax - this.ink))}`);
    this.draftHud.setText(`DRAFT  ${this.pages} pp.${this.typos ? `   typos ${this.typos}` : ''}`);
    this.draftHud.setColor(this.typos ? '#e8a090' : '#f2e0a0');
    if (this.deadline !== null) {
      const s = Math.max(0, Math.ceil(this.deadline / 1000));
      this.deadlineHud.setText(`FRIDAY  ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
    } else this.deadlineHud.setText('');
  }

  // ---------- update ---------------------------------------------------

  update(time, delta) {
    if (this.typing) {
      this.typing.update(time);
      this.labels.update(time);
      return;
    }
    if (this.handleModalUpdate()) return;
    const p = this.player;
    const pb = p.getBounds();
    const dt = delta / 1000;
    const room = RoomBuilder.roomAt(this.built.rooms, p.x);
    const footTx = Math.floor(p.x / T);
    const footTy = Math.floor((p.y + p.body.height / 2 + 6) / T);
    const surface = this.surfaceGrid[footTy] && this.surfaceGrid[footTy][footTx];
    p.slippery = surface === 'grease';
    p.slipFactor = 0.08;
    const wasGrounded = p.body.blocked.down || p.onSlope;
    p.update(time, delta);
    if (p.body.blocked.down) {
      if (surface === 'conveyor_l') p.body.velocity.x -= 90;
      else if (surface === 'conveyor_r') p.body.velocity.x += 90;
    }
    if (this.carrySprite) this.carrySprite.setPosition(p.x, p.y - 42);

    // the pen (X): shoves people, tears paper
    if (Phaser.Input.Keyboard.JustDown(p.keys.X)) {
      const hit = p.swingLadle();
      if (hit) {
        for (const e of this.foes) {
          if (!e.active || !overlaps(hit, e.getBounds())) continue;
          if (e.human) e.shove(p.x);
          else e.die();
        }
      }
    }
    // Q: a noise — wakes a dog, turns the talkers' heads, and costs quiet
    if (Phaser.Input.Keyboard.JustDown(this.keyQ) && time > (this.qCool || 0)) {
      this.qCool = time + 4000;
      this.noiseBurst();
    }

    this.updateInteracts(p);
    this.labels.update(time);
    this.updateWords(pb);
    this.updateRoom(room, time, dt);
    this.updateFoesExtra(time, dt, pb, wasGrounded);
    this.updateMusicRoom();
    this.updatePickups(time, delta);
    this.updateDialogueZones(p);
    for (const ed of this.editors) ed.update(time, dt, p);
    if (this.editorWait) this.editorWait.update(time, dt, p);

    for (const z of this.inkZones) {
      if (overlaps(pb, z)) {
        this.hurt();
        break;
      }
    }
    if (p.y > this.worldH + 60) {
      p.setPosition(this.checkpoint.x, this.checkpoint.y);
      p.setVelocity(0, 0);
      this.hurt();
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
    // a label the pen could edit, or a paragraph the pencil could cut
    const label = this.labels.nearest(p.x, p.y);
    const ld = label ? Phaser.Math.Distance.Between(p.x, p.y, label.x, label.y + 24) : 1e9;
    // the pen wins the spot while the word on the thing can still be changed;
    // once it has been, the thing itself (the desk, the machine) takes E
    const usable = label && (label.para || (!label.changed && this.words.some((w) => w !== label.adj)));
    if (label && (usable ? ld < 48 || !nearest || ld < nearest.d : !nearest)) {
      const para = label.para;
      const text = para ? '[E] cut' : '[E] the pen';
      this.promptText.setText(text).setVisible(true).setPosition(label.x, label.y + 20);
      if (Phaser.Input.Keyboard.JustDown(p.keys.E)) {
        if (para) this.strikeParagraph(para);
        else this.labels.open(label);
      }
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

  async strikeParagraph(para) {
    if (!this.pencil) {
      this.floatText(para.label.x, para.label.y - 20, 'the pen only writes. Emmerich has the pencil.', '#c8c0b0');
      return;
    }
    if (para.three && !this.pageThreeChoice) {
      const choice = await pageThree(this);
      if (!choice) return;
      this.pageThreeChoice = choice;
      updateSave((s) => (s.flags.wr = { ...(s.flags.wr || {}), page_three: choice }));
      if (choice === 'cut') {
        this.player.art.setTexture('jo-idle-b');
        this.cutParagraph(para);
        this.dialog.show(DIALOGUES.d4_cut);
      } else {
        this.floatText(para.label.x, para.label.y - 20, 'kept. six more pages to find elsewhere.', '#f2e0a0');
        this.dialog.show(DIALOGUES.d4_kept);
      }
      return;
    }
    if (para.three) return;
    this.cutParagraph(para);
  }

  updateWords(pb) {
    for (const w of this.wordPickups || []) {
      if (w.taken) continue;
      if (overlaps(pb, new Phaser.Geom.Rectangle(w.wx - 14, w.wy - 24, 28, 40))) {
        w.taken = true;
        w.g.destroy();
        w.t.destroy();
        this.addWord(w.word, w.on);
        if (w.word === 'working') showTutorial(this, 'pen');
      }
    }
  }

  updateDialogueZones(p) {
    for (const z of this.dialogueZones || []) {
      if (z.done || Math.abs(p.x - z.wx) > 40 || Math.abs(p.y - z.wy) > 60) continue;
      if (z.id === 'd3' && !this.F.later) continue;
      z.done = true;
      (async () => {
        await this.dialog.show(DIALOGUES[z.id]);
        if (z.id === 'd3') {
          this.setFlag('rejected');
          this.setObjective('the night bus');
        }
        if (z.id === 'd5') this.startDeadline();
      })();
    }
  }

  startDeadline() {
    this.setFlag('deadline');
    this.deadline = this.deadlineMs;
    this.updateHud();
    this.setObjective('the printworks. feed it, then ink → press → fold.');
    musicDirector.setBpm(124);
  }

  noiseBurst() {
    const p = this.player;
    sfx('knock');
    const ring = this.add.circle(p.x, p.y, 10, 0xf2e0a0, 0).setStrokeStyle(2, 0xf2e0a0).setDepth(30);
    this.tweens.add({ targets: ring, radius: 120, alpha: 0, duration: 500, onUpdate: () => ring.setRadius(ring.radius) });
    this.noise = Math.min(1, this.noise + 0.35);
    for (const f of this.foes) {
      if (!f.active) continue;
      const d = Math.abs(f.x - p.x);
      if (f.def.pushes && d < 140) {
        f.distractedUntil = this.time.now + 3500;
        f.setFlipX(p.x < f.x);
      }
      if (f.def.hears && d < 260) this.loudNow = true;
    }
    if (this.dog && Math.abs(this.dog.x - p.x) < 140 && !this.F.dog_awake) {
      this.setFlag('dog_awake');
      sfx('woof');
      this.labels.apply(this.labels.get('dog'), 'awake', { free: true });
      this.tweens.add({ targets: this.dog, x: this.dog.x + 90, y: this.dog.y - 20, duration: 500, ease: 'quad.out', onComplete: () => this.tweens.add({ targets: this.dog, y: this.dog.y + 20, duration: 300 }) });
    }
  }

  // per-room: noise, rain, tints, the chapter's own machinery
  updateRoom(room, time, dt) {
    const p = this.player;
    const id = room.id;
    // §3.3 noise: the café makes it; in the library Jo makes it
    let noisy = false;
    if (id === 'cafe') {
      noisy = true;
      let gain = 0;
      if (this.espresso && !this.espressoQuiet && Math.abs(p.x - this.espresso.x) < 130) gain += 0.28;
      for (const f of this.foes) if (f.def.pushes && f.active && Math.abs(f.x - p.x) < 110) gain += 0.14;
      this.noise = Phaser.Math.Clamp(this.noise + (gain - 0.14) * dt, 0, 1);
    } else if (id === 'library') {
      noisy = true;
      let gain = -0.3;
      if (Math.abs(p.body.velocity.x) > 200 && p.body.blocked.down) gain += 0.55;
      if (Phaser.Input.Keyboard.JustDown(p.keys.SPACE) || Phaser.Input.Keyboard.JustDown(p.keys.W) || Phaser.Input.Keyboard.JustDown(p.cursors.up)) this.noise = Math.min(1, this.noise + 0.22);
      const cart = this.props.cart;
      if (cart && Math.abs(cart.body.velocity.x) > 5) gain += 0.5;
      if (this.lift && this.lift.moving && this.labels.get('dumbwaiter').adj === 'loud') gain += 0.7;
      this.noise = Phaser.Math.Clamp(this.noise + gain * dt, 0, 1);
      this.loudNow = this.noise > this.noiseThreshold;
      // the sleeper wakes to noise nearby
      const sleeper = this.foes.find((f) => f.id === 'sleeper' && f.active);
      if (sleeper && sleeper.asleep && this.loudNow && Math.abs(sleeper.x - p.x) < 220 && Math.abs(sleeper.y - p.y) < 80) {
        sleeper.asleep = false;
        this.labels.apply(this.labels.get('sleeper'), 'awake', { free: true, revert: true });
        this.floatText(sleeper.x, sleeper.y - 50, '!', '#e86a6a');
      }
    } else {
      this.noise = Math.max(0, this.noise - dt * 0.5);
      this.loudNow = false;
    }
    this.noiseBg.setVisible(noisy);
    this.noiseBar.setVisible(noisy).setSize(90 * this.noise, 8);
    this.noiseBar.setFillStyle(this.noise > this.noiseThreshold ? 0xe86a6a : 0xe8a030);
    this.noiseLabel.setText(noisy ? (this.noise > this.noiseThreshold ? (id === 'library' ? 'they can hear you' : "can't hear himself think") : id === 'library' ? 'quiet' : 'noise') : '');

    // rain, and the dark
    const wantRain = id === 'bus' || id === 'rain' ? 0.55 : id === 'postoffice' && this.F.later ? 0.25 : 0;
    this.rain.setAlpha(Phaser.Math.Linear(this.rain.alpha, wantRain, 0.05));
    this.rain.tilePositionY -= 9;
    this.rain.tilePositionX += 1.5;
    this.rain.setScale(1 / (this.cameras.main.zoom || 1));

    if (id === 'copyshop') {
      for (const m of Object.values(this.machines || {})) if (!m.fixed && Math.floor(time / 400) % 2) m.img.setTint(0xd8a8a8);
      else if (!m.fixed) m.img.setTint(0xb8a8a8);
    }
    if (id === 'library') this.updateLibrary(time, dt);
    if (id === 'postoffice') this.updatePostOffice(time, dt);
    if (id === 'bus' && this.wakeX && p.x > this.wakeX) this.wake();
    if (id === 'rain' && !this.F.rain_walk) {
      this.setFlag('rain_walk');
      music.stop();
      this.setObjective('');
    }
    if (id === 'rewrite' && !this.F.at_attic2) {
      this.setFlag('at_attic2');
      this.setObjective('the wall of cards. from memory.');
      music.piano();
    }
    if (id === 'editor') this.updateFlat(time);
    if (id === 'city' || id === 'press' || id === 'agent') this.updateDeadline(time, dt);
    if (id === 'press') this.updatePress(time, dt);
    if (id === 'bookshop' && !this.F.at_shop) {
      this.setFlag('at_shop');
      music.stop();
      this.setObjective('the lectern');
    }
    // the Inner Editor steps out when Jo passes its mark
    for (const ed of this.editors) {
      if (ed.room === id && !ed.started && !ed.done && p.x > ed.from && (id !== 'agent' || this.F.deadline)) {
        ed.started = true;
        ed.start();
        this.activeEditor = ed;
        if (id === 'editor') {
          this.editorFlat = ed;
          if (this.pagesAtFlat === null) this.pagesAtFlat = this.pages;
        }
        if (id === 'rain') showTutorial(this, 'editor');
      }
      if (ed.started && ed.active) {
        this.activeEditor = ed;
        if (ed.follow) ed.y += (p.y + 22 - ed.y) * 0.08;
        ed.art.y = ed.y;
        if (ed.haltUntil && time < ed.haltUntil) ed.x -= ed.speed * dt; // the decision holds it
        if (ed.near) musicDirector.setState('caught');
      }
    }
  }

  updateLibrary(time, dt) {
    const p = this.player;
    // the glass floor: run on it and it cracks
    if (this.glass && !this.glassBroken) {
      const g = this.glassRange;
      const tx = Math.floor(p.x / T);
      const onIt = tx >= g.x0 && tx <= g.x1 && Math.abs(p.y + 22 - px(g.ty) + T / 2) < 20 && p.body.blocked.down;
      if (onIt && !this.glassSeen) {
        this.glassSeen = true;
        showTutorial(this, 'glass');
      }
      if (onIt && Math.abs(p.body.velocity.x) > 150 && !p.crouching) {
        this.glassBroken = true;
        sfx('crack');
        this.cameras.main.shake(200, 0.006);
        this.glass.forEach((img, i) => {
          this.time.delayedCall(i * 40, () => {
            img.body.enable = false;
            this.tweens.add({ targets: img, y: img.y + 40, alpha: 0, angle: Phaser.Math.Between(-30, 30), duration: 600, ease: 'quad.in' });
          });
        });
        this.floatText(p.x, p.y - 60, 'the glass goes.', '#e86a6a');
        this.time.delayedCall(6000, () => {
          this.glass.forEach((img) => {
            this.tweens.killTweensOf(img);
            img.setAlpha(0.8).setAngle(0);
            img.y = px(g.ty) - T / 2 + 6;
            img.body.enable = true;
            img.body.updateFromGameObject();
          });
          this.glassBroken = false;
        });
      }
    }
    // the dumbwaiter: rides up with Jo on it, comes back down empty
    if (this.lift) {
      const L = this.lift;
      const riding = p.body.touching.down && L.img.body.touching.up;
      const target = riding || (L.up && L.img.y > L.topY + 2 && riding) ? L.topY : L.bottomY;
      const want = riding ? L.topY : L.bottomY;
      void target;
      const dy = want - L.img.y;
      const v = Math.abs(dy) < 2 ? 0 : Math.sign(dy) * 70;
      L.img.body.setVelocityY(v);
      L.moving = v !== 0 && riding;
      L.riding = riding;
    }
  }

  updatePostOffice(time, dt) {
    const p = this.player;
    for (const pl of this.plates || []) {
      if (pl.pressed || pl.feed) continue;
      if (Math.abs(p.x - pl.wx) < 18 && Math.abs(p.y + 22 - pl.floor) < 12) {
        pl.pressed = true;
        this.posted += 5;
        sfx('snap');
        this.floatText(pl.wx, pl.floor - 60, `posted ${this.posted}/40`, '#f2e0a0');
        if (this.posted >= 40) this.time.delayedCall(600, () => this.later());
      }
    }
    if (!this.F.at_post) {
      this.setFlag('at_post');
      this.setObjective('forty addresses. every box.');
    }
  }

  updateFlat(time) {
    if (!this.told.d4 && this.player.x > px(427)) {
      this.told.d4 = true;
      this.dialog.show(DIALOGUES.d4);
    }
    void time;
  }

  updateDeadline(time, dt) {
    if (this.deadline === null || this.F.printed) return;
    this.deadline -= delta_(dt);
    if (Math.floor(this.deadline / 1000) !== this._lastSec) {
      this._lastSec = Math.floor(this.deadline / 1000);
      this.updateHud();
      if (this._lastSec <= 30 && this._lastSec % 5 === 0) sfx('tick');
    }
    if (this.deadline <= 0) {
      this.deadline = Math.max(240000, this.deadlineMs * 0.7);
      this.dialog.show(DIALOGUES.isolde_late);
      const cp = this.flags.getChildren().find((f) => Math.abs(f.x - px(544)) < 40);
      this.checkpoint = cp ? { x: cp.x, y: cp.y - 8 } : this.checkpoint;
      this.leversPulled = [];
      for (const l of this.levers || []) {
        l.pulled = false;
        l.img.setFlipX(false);
      }
      this.time.delayedCall(300, () => this.hurt());
    }
  }

  updatePress(time, dt) {
    const p = this.player;
    const pb = p.getBounds();
    // the feed plate at the top
    for (const pl of this.plates || []) {
      if (!pl.feed || this.fed) continue;
      if (Math.abs(p.x - pl.wx) < 18 && Math.abs(p.y + 22 - pl.floor) < 12) {
        this.fed = true;
        sfx('deliver');
        this.floatText(pl.wx, pl.floor - 60, 'the Draft goes in. ride it down: INK, PRESS, FOLD.', '#f2e0a0');
        showTutorial(this, 'press');
      }
    }
    // rollers slam on their period; the folder swings
    for (const r of this.rollers || []) {
      const t = (time + r.offset) % r.period;
      const down = t > r.period * 0.6;
      r.img.y = down ? r.down : r.up + Math.sin(time / 120) * 2;
      if (down && overlaps(pb, r.img.getBounds())) this.hurt();
      r.img.setTint(t > r.period * 0.5 && !down ? 0xffa0a0 : 0xffffff);
    }
    for (const f of this.folders || []) {
      const t = ((time + f.offset) % f.period) / f.period;
      f.img.setAngle(Math.sin(t * Math.PI * 2) * 70);
      const blade = new Phaser.Geom.Rectangle(f.img.x - 30 + Math.sin(t * Math.PI * 2) * 30, f.floor - 40, 20, 40);
      if (overlaps(pb, blade)) this.hurt();
    }
    // the crane, the city's one moving thing (updated here as the rooms share the deadline)
    void dt;
  }

  updateFoesExtra(time, dt, pb, wasGrounded) {
    const p = this.player;
    this.updateFoes(time);
    // the crane carries whoever stands on it
    if (this.crane) {
      const c = this.crane;
      const speed = c.fast ? 150 : 40;
      if (c.img.x >= c.x1) c.dir = -1;
      if (c.img.x <= c.x0) c.dir = 1;
      c.img.body.setVelocityX(c.dir * speed);
      if (p.body.touching.down && c.img.body.touching.up) p.x += c.img.x - c.lastX;
      c.lastX = c.img.x;
    }
    for (const f of this.foes) {
      if (!f.active) continue;
      // the talkers: a wall of sound. Stand in front of one and it pushes you back.
      if (f.def.pushes) {
        const front = f.flipX ? p.x < f.x : p.x > f.x;
        const d = Math.abs(p.x - f.x);
        const distracted = time < (f.distractedUntil || 0);
        if (front && d < 64 && Math.abs(p.y - f.y) < 50 && !p.crouching && !distracted && time > (f.pushedAt || 0)) {
          f.pushedAt = time + 500;
          p.body.setVelocityX(f.flipX ? -260 : 260);
          p.body.setVelocityY(-120);
          sfx('buzz');
          this.floatText(f.x, f.y - 50, '— and ANOTHER thing —', '#c8c0b0');
          if (!this.told.slide) {
            this.told.slide = true;
            showTutorial(this, 'talker');
          }
        }
        // the bubble, with its one good word
        if (f.word && !f.wordTaken) {
          if (!f.bubble && time > f.bubbleAt) {
            f.bubble = this.makeBubble(f);
            f.bubbleUntil = time + 4200;
          }
          if (f.bubble) {
            f.bubble.c.setPosition(f.x, f.y - 66);
            const rect = new Phaser.Geom.Rectangle(f.x - 60, f.y - 86, 120, 44);
            if (overlaps(pb, rect)) {
              f.wordTaken = true;
              this.addWord(f.word, 'overheard');
              f.bubble.c.destroy();
              f.bubble = null;
            } else if (time > f.bubbleUntil) {
              f.bubble.c.destroy();
              f.bubble = null;
              f.bubbleAt = time + 3000 + Math.random() * 2000;
            }
          }
        }
        continue;
      }
      // slips chase and steal pages; the pigeon takes one
      if (f.kind === 'slip') {
        const dx = p.x - f.x;
        const dy = p.y - 10 - f.y;
        const len = Math.hypot(dx, dy) || 1;
        f.wob = (f.wob || 0) + dt * 6;
        f.setVelocity((dx / len) * f.speedBase + Math.sin(f.wob) * 40, (dy / len) * f.speedBase * 0.8 + Math.cos(f.wob) * 30);
        f.setFlipX(dx < 0);
        if (overlaps(pb, f.getBounds())) {
          if (this.pages > 0) {
            this.pages = Math.max(0, this.pages - 2);
            this.floatText(p.x, p.y - 60, '−2 pages', '#e86a6a');
            this.updateHud();
          }
          f.die();
        }
      } else if (f.kind === 'pigeon' && overlaps(pb, f.getBounds()) && !f.stole) {
        f.stole = true;
        if (this.pages > 0) {
          this.pages -= 1;
          this.floatText(p.x, p.y - 60, 'a pigeon takes a page.', '#e86a6a');
          this.updateHud();
        }
        sfx('flap');
        this.tweens.add({ targets: f, y: f.y - 200, x: f.x + 80, alpha: 0, duration: 900, onComplete: () => f.cleanup() });
      }
    }
    void wasGrounded;
  }

  makeBubble(f) {
    const parts = f.line.split('*');
    const c = this.add.container(f.x, f.y - 66).setDepth(41);
    const bg = this.add.rectangle(0, 0, 10, 20, 0xe8e4d8, 0.95).setStrokeStyle(1, 0x14101c);
    const before = this.add.text(0, 0, parts[0], { fontFamily: 'monospace', fontSize: '10px', color: '#2a2230' }).setOrigin(0, 0.5);
    const word = this.add.text(0, 0, parts[1], { fontFamily: 'monospace', fontSize: '10px', color: '#c03a2a', fontStyle: 'bold' }).setOrigin(0, 0.5);
    const after = this.add.text(0, 0, parts[2] || '', { fontFamily: 'monospace', fontSize: '10px', color: '#2a2230' }).setOrigin(0, 0.5);
    const w = before.width + word.width + after.width;
    before.x = -w / 2;
    word.x = before.x + before.width;
    after.x = word.x + word.width;
    bg.setSize(w + 12, 20);
    c.add([bg, before, word, after]);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 200 });
    return { c };
  }

  // ---------- dev warp ----------------------------------------------------

  devWarp() {
    let at = null;
    try {
      at = new URLSearchParams(window.location.search).get('wr');
    } catch {
      return false;
    }
    if (!at) return false;
    const ALL1 = ['d0', 'rent_paid', 'pages12'];
    const ALL2 = [...ALL1, 'met_wren', 'lines', 'pages30', 'gap_wide', 'dog_awake'];
    const ALL3 = [...ALL2, 'research', 'structure', 'pages60'];
    const ALL4 = [...ALL3, 'later', 'rejected', 'draft_lost', 'rain_walk', 'at_attic2', 'rewritten_p', 'rewritten'];
    const ALL5 = [...ALL4, 'cut_done'];
    const ALL6 = [...ALL5, 'deadline', 'printed'];
    const WORDS3 = ['working', 'light', 'honest', 'wide', 'quiet', 'fixed', 'true', 'low'];
    const PH = {
      attic: { flags: ['d0'], col: 31, row: 20, obj: 'write chapter one (12 pages)' },
      copyshop: { flags: ['d0'], col: 62, row: 33, pages: 4, words: ['working', 'light'], obj: 'the copy shop' },
      cafe: { flags: ALL1, col: 121, row: 33, pages: 12, words: ['working', 'light'], obj: 'the café' },
      library: { flags: ALL2, col: 182, row: 33, pages: 30, words: WORDS3, obj: 'five sources' },
      post: { flags: ALL3, col: 251, row: 33, pages: 60, words: WORDS3, obj: 'forty addresses' },
      bus: { flags: [...ALL3, 'later', 'rejected'], col: 291, row: 33, pages: 60, words: WORDS3, obj: 'the night bus' },
      rain: { flags: [...ALL3, 'later', 'rejected', 'draft_lost'], col: 321, row: 33, pages: 0, words: ['honest'], obj: '' },
      rewrite: { flags: [...ALL3, 'later', 'rejected', 'draft_lost', 'rain_walk'], col: 372, row: 20, pages: 0, words: ['honest'], obj: 'the wall of cards' },
      editor: { flags: ALL4, col: 402, row: 33, pages: 60, words: ['honest', 'again'], obj: 'the editor' },
      agent: { flags: ALL5, col: 461, row: 19, pages: 40, words: ['honest', 'again'], pencil: true, obj: 'the agent' },
      city: { flags: [...ALL5, 'deadline'], col: 491, row: 19, pages: 40, words: ['honest', 'again', 'wide', 'fast'], pencil: true, deadline: true, obj: 'the printworks' },
      press: { flags: [...ALL5, 'deadline'], col: 541, row: 33, pages: 40, words: ['honest', 'again'], pencil: true, deadline: true, typos: 2, obj: 'feed it, then ink → press → fold' },
      reading: { flags: ALL6, col: 601, row: 33, pages: 40, words: ['honest', 'again'], pencil: true, carry: 'book', obj: 'the lectern' },
    };
    const ph = PH[at];
    if (!ph) return false;
    this.warped = true;
    ph.flags.forEach((f) => this.setFlag(f));
    this.pages = ph.pages || 0;
    (ph.words || []).forEach((w) => {
      this.words.push(w);
      this.everWords.add(w);
    });
    if (ph.flags.includes('research')) {
      for (const s of this.sourceItems || []) {
        s.taken = true;
        s.img.destroy();
        s.t.destroy();
        this.sources.push(s);
      }
    }
    if (ph.flags.includes('structure')) this.structureOrder = structureDefault();
    if (ph.flags.includes('rent_paid')) {
      const l = this.foes.find((f) => f.kind === 'landlady');
      if (l) this.standDown(l);
      this.machinesFixed = 4;
    }
    if (ph.pencil) {
      this.pencil = true;
      this.player.tool.setTexture('tool-pencil');
    }
    if (ph.deadline) this.deadline = this.deadlineMs;
    if (ph.typos) this.typos = ph.typos;
    if (ph.carry) this.take(ph.carry, 'wr-book-bound');
    if (at === 'rewrite' || at === 'editor' || at === 'agent' || at === 'city' || at === 'press' || at === 'reading') this.memoryUsed = 6;
    if (at === 'agent' || at === 'city' || at === 'press' || at === 'reading') this.pageThreeChoice = 'cut';
    this.updateSatchel();
    this.updateHud();
    this.player.setPosition(px(ph.col), px(ph.row) - 10);
    this.checkpoint = { x: px(ph.col), y: px(ph.row) - 10 };
    this.setObjective(ph.obj);
    return true;
  }
}

const delta_ = (dt) => dt * 1000;

function structureDefault() {
  // the shape the game accepts by default when the puzzle was warped past
  return [
    { id: 's1', name: 'the attic', t: 1 }, { id: 's2', name: 'the copy shop', t: 2 }, { id: 's3', name: 'the café', t: 2 }, { id: 's4', name: 'the napkin', t: 3 },
    { id: 's5', name: 'the stacks', t: 3 }, { id: 's6', name: 'forty envelopes', t: 4 }, { id: 's7', name: 'the bus', t: 5 }, { id: 's8', name: 'the rain', t: 2 },
    { id: 's9', name: 'the rewrite', t: 3 }, { id: 's10', name: 'the red pencil', t: 4 }, { id: 's11', name: 'friday', t: 4 }, { id: 's12', name: 'nine chairs', t: 5 },
  ];
}
