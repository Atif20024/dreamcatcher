import Phaser from 'phaser';
import Player from '../entities/Player.js';
import BaseLevel from './BaseLevel.js';
import { THEMES } from '../themes/index.js';
import RoomBuilder from '../builders/RoomBuilder.js';
import Parallax from '../builders/parallax.js';
import { D } from '../builders/depths.js';
import astroRooms from '../data/astronaut/rooms.js';
import astroTiles from '../data/astronaut/tiles.js';
import { A_DIALOGUES, A_MOMENTS, NOTEBOOK } from '../data/astronautData.js';
import { systemsCards, selectionBoard, docking, hinge, BOLT_ORDER } from '../systems/astroPuzzles.js';
import { completeDream } from '../utils/save.js';
import { sfx, music, sting } from '../systems/audio.js';

const T = 32;
const px = (t) => t * T + T / 2;

// zone tints: gym fluorescents → gate grey → campus dusk → space → moon → field
const ZONES = [
  [0, 130, 0xf2d580, 0.05],
  [130, 153, 0x50525e, 0.1],
  [153, 241, 0xe8762a, 0.05],
  [241, 257, 0x88b8d8, 0.04],
  [257, 334, 0x0a0a16, 0.22],
  [334, 472, 0x08080a, 0.28],
  [472, 522, 0x7ec86a, 0.06],
];

export default class AstronautScene extends BaseLevel {
  constructor() {
    super('Astronaut');
  }

  create() {
    this.theme = THEMES.astronaut;
    this.theme.createTextures(this);

    const built = RoomBuilder.build(this, astroRooms, astroTiles);
    this.built = built;
    this.parallax = new Parallax(this, built.rooms);
    for (const [c0, c1, color, alpha] of ZONES) {
      this.add.rectangle(((c0 + c1) / 2) * T, built.worldH / 2, (c1 - c0) * T, built.worldH, color, alpha).setDepth(D.ZONE_TINT);
    }

    this.solids = built.solids;
    this.oneWays = built.oneWays;
    this.slopeGrid = built.slopeGrid;
    this.climbGrid = built.climbGrid;
    this.ladderGrid = built.ladderGrid;
    this.surfaceGrid = built.surfaceGrid;

    const spawnO = built.objects.find((o) => o.type === 'spawn');
    const spawn = { x: spawnO.wx, y: spawnO.wy };
    this.player = new Player(this, spawn.x, spawn.y);
    this.dreamCoinId = 'astronaut';
    this.setupCommon({ worldW: built.worldW, worldH: built.worldH, levelName: 'DREAM — THE QUIET ABOVE', spawn });

    // Phase 1-3 the tool is just his hands; the multitool arrives with the suit
    this.player.tool.setTexture('astro-wrench').setVisible(false);
    this.player.tool.setScale(0); // syncAttachments never writes scale on the tool
    this.F = {};
    this.moments = 0;
    this.interacts = [];
    // §3.1 — the four fitness stats, 0-5 pips, trained in the gym rooms
    this.stats = { lungs: 2, grip: 1, legs: 2, nerve: 1 };
    this.minStat = 3 + (this.difficulty >= 2 ? 1 : 0);
    // §3.3 — the suit: O2 (length = Lungs), power. Off-duty until Phase 4.
    this.o2Max = 40 + 10 * this.stats.lungs;
    this.o2 = this.o2Max;
    this.power = 100;
    this.breath = 100; // pool breath, Phase 1/3
    this.signal = 3;
    this.visorOn = false;
    this.carry = null; // 'panel' | 'core'
    this.carryingPriya = false;
    this.tether = null; // the hook we're clipped to (EVA)
    this.railHold = null;
    this.aim = { x: 1, y: 0 };
    this.puncturedAt = 0;

    this.flags = this.physics.add.staticGroup();
    built.objects.filter((o) => o.type === 'checkpoint').forEach((c) => this.flags.create(c.wx, c.wy, 'flag'));

    this.initFoes('astronaut');
    this.spawnRoomFoes(built.objects, (o) => o.human);
    this.addHideSpots(built.objects);
    this.spawnPickups(built.objects);
    this.buildGates();

    // rails (0g grab lines) and tether hooks
    this.rails = built.objects
      .filter((o) => o.type === 'rail')
      .map((o) => {
        const w = (o.len || 4) * T;
        this.add.rectangle(o.wx - T / 2 + w / 2, o.wy, w, 6, 0xf2c078, 0.55).setDepth(D.INTERACT);
        return { x0: o.wx - T / 2, x1: o.wx - T / 2 + w, y: o.wy };
      });
    this.hooks = built.objects
      .filter((o) => o.type === 'hook')
      .map((o) => {
        this.add.image(o.wx, o.wy, 'astro-hook').setDepth(D.INTERACT);
        return { x: o.wx, y: o.wy };
      });

    this.buildArrival();
    this.buildBody();
    this.buildGateRoom();
    this.buildGround();
    this.buildSky();
    this.buildMoon();
    this.buildField();
    this.buildHud();

    this.physics.add.collider(this.player, this.solids, (_p, tile) => this.onSolidTouch(tile));
    this.physics.add.collider(this.player, this.oneWays);
    this.physics.add.overlap(this.player, built.hazards, () => this.hurt());
    this.physics.add.overlap(this.player, this.flags, (_p, f) => this.activateCheckpoint(f));

    this.keyTab = this.input.keyboard.addKey('TAB');
    this.input.keyboard.on('keydown-TAB', (e) => e.preventDefault());
    this.keyF = this.input.keyboard.addKey('F');

    this.promptText = this.add
      .text(0, 0, '[E]', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580', backgroundColor: '#14101c' })
      .setOrigin(0.5)
      .setDepth(80)
      .setVisible(false);
    this.hintText = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height - 24, '[E] interact · [Tab] visor · [F] tether / Priya', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#6a6478',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(150);

    this.setObjective('reach 3 pips in every stat');
    music.bass();
    this.time.delayedCall(900, async () => {
      await this.dialog.show(A_DIALOGUES.d0);
      this.setFlag('d0');
    });
  }

  // ------- shared plumbing (verbatim musician pattern) -------------------

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
          const img = this.add.image(g.wx, px(r), `${astroTiles.key}_s_15_${(g.tx * 7 + r * 13) % 3}`).setTint(0x4a5a6a);
          this.physics.add.existing(img, true);
          this.solids.add(img);
          tiles.push(img);
        }
        const light = this.add.circle(g.wx, px(g.ty) - 18, 5, 0xe83a2a).setDepth(20);
        this.add.rectangle(g.wx, px(g.ty) - 18, 22, 3, 0x2a2a34).setDepth(19);
        return { ...g, id: g.id, requires: g.requires || [], tiles, light, open: false };
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

  addInteract(x, y, label, cb, { radius = 44, once = true, when = () => true } = {}) {
    const it = { x, y, label, cb, radius, once, when, used: false };
    this.interacts.push(it);
    return it;
  }

  obj(id, n = 0) {
    const all = this.built.objects.filter((o) => o.id === id || (o.type === 'mark' && o.id === id));
    return all[n];
  }

  objAll(id) {
    return this.built.objects.filter((o) => o.type === 'mark' && o.id === id);
  }

  moment(id) {
    const m = A_MOMENTS[id];
    this.moments += 1;
    this.setFlag(id);
    sfx('chime');
    this.player.controlLockUntil = this.time.now + 5000;
    this.player.body.setVelocity(0, 0);
    const cam = this.cameras.main;
    const t1 = this.add.text(cam.width / 2, cam.height - 150, m.sub, { fontFamily: 'monospace', fontSize: '14px', color: '#c8c0b0' }).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
    const t2 = this.add.text(cam.width / 2, cam.height - 120, m.text, { fontFamily: 'monospace', fontSize: '17px', color: '#f2e0a0', fontStyle: 'italic' }).setOrigin(0.5).setScrollFactor(0).setDepth(160).setAlpha(0);
    this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 900 });
    this.time.delayedCall(5000, () => this.tweens.add({ targets: [t1, t2], alpha: 0, duration: 800, onComplete: () => [t1, t2].forEach((t) => t.destroy()) }));
  }

  // ------- HUD -----------------------------------------------------------

  buildHud() {
    const cam = this.cameras.main;
    // the clipboard: four stats as pips, up while the gym is the world
    this.statHud = this.add
      .text(16, 112, '', { fontFamily: 'monospace', fontSize: '11px', color: '#e8dcc8', backgroundColor: '#14101cbb', padding: { x: 6, y: 4 } })
      .setScrollFactor(0)
      .setDepth(150);
    // suit meters
    this.o2BarBg = this.add.rectangle(28, 78, 90, 8, 0x2a2a34).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150).setVisible(false);
    this.o2Bar = this.add.rectangle(28, 78, 90, 8, 0x88b8d8).setOrigin(0, 0.5).setScrollFactor(0).setDepth(151).setVisible(false);
    this.o2Label = this.add.text(122, 78, 'O₂', { fontFamily: 'monospace', fontSize: '10px', color: '#88b8d8' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150).setVisible(false);
    this.pwrBarBg = this.add.rectangle(28, 90, 90, 8, 0x2a2a34).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150).setVisible(false);
    this.pwrBar = this.add.rectangle(28, 90, 90, 8, 0xe8a030).setOrigin(0, 0.5).setScrollFactor(0).setDepth(151).setVisible(false);
    this.pwrLabel = this.add.text(122, 90, 'PWR', { fontFamily: 'monospace', fontSize: '10px', color: '#e8a030' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150).setVisible(false);
    // pool breath (phase 1/3)
    this.breathBar = this.add.rectangle(28, 78, 90, 8, 0x9ac4dc).setOrigin(0, 0.5).setScrollFactor(0).setDepth(151).setVisible(false);
    // §3.4 — the radio
    this.signalHud = this.add
      .text(16, 112, '', { fontFamily: 'monospace', fontSize: '11px', color: '#7ec87e' })
      .setScrollFactor(0)
      .setDepth(150)
      .setVisible(false);
    // the visor: a translucent overlay the player must learn to read
    this.visor = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x1a3a5a, 0).setScrollFactor(0).setDepth(140);
    this.visorText = this.add
      .text(cam.width / 2, 60, '', { fontFamily: 'monospace', fontSize: '12px', color: '#7ec8d8', align: 'center' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(141)
      .setVisible(false);
    this.updateStatHud();
  }

  updateStatHud() {
    const pip = (n) => '●'.repeat(n) + '○'.repeat(5 - n);
    const s = this.stats;
    this.statHud.setText(`LUNGS ${pip(s.lungs)}\nGRIP  ${pip(s.grip)}\nLEGS  ${pip(s.legs)}\nNERVE ${pip(s.nerve)}`);
    this.o2Max = 40 + 10 * s.lungs;
  }

  gainStat(k, to, label) {
    if (this.stats[k] >= to) return false;
    this.stats[k] = Math.min(5, to);
    this.updateStatHud();
    sfx('chime');
    this.floatText(this.player.x, this.player.y - 60, label || `${k.toUpperCase()} ${this.stats[k]}/5`, '#7ec87e');
    return true;
  }

  statsReady() {
    const s = this.stats;
    return s.lungs >= this.minStat && s.grip >= this.minStat && s.legs >= this.minStat && s.nerve >= this.minStat;
  }

  // ------- phase builders -------------------------------------------------

  buildArrival() {
    const o = this.obj('poster_fence');
    this.add.rectangle(o.wx, o.wy - 20, 84, 60, 0x2e3a52).setDepth(D.INTERACT - 1);
    this.add
      .text(o.wx, o.wy - 20, 'MERIDIAN\nORBITAL\nPROGRAM', { fontFamily: 'monospace', fontSize: '9px', color: '#88b8d8', align: 'center' })
      .setOrigin(0.5)
      .setDepth(D.INTERACT);
    const ad = this.built.objects.find((v) => v.type === 'npc' && v.who === 'adaeze');
    this.adaeze = this.add.image(ad.wx, ad.wy, 'npc-adaeze').setDepth(D.FOE);
    this.addInteract(ad.wx, ad.wy, 'Coach Adaeze', async () => {
      await this.dialog.show(A_DIALOGUES.d0);
      this.setFlag('d0');
    }, { once: false, when: () => !this.F.d0 });
  }

  buildBody() {
    // -- the Track (Legs): laps on the mezzanine, medicine balls rolling
    const start = this.obj('track_start');
    const far = this.obj('track_far');
    this.add.rectangle(start.wx, start.wy + 10, 4, 40, 0xf2d580, 0.8).setDepth(D.INTERACT);
    this.add.text(start.wx - 10, start.wy - 26, 'LAP', { fontFamily: 'monospace', fontSize: '10px', color: '#f2d580' }).setDepth(D.INTERACT);
    this.track = { start: start.wx, far: far.wx, phase: 'home', laps: 0 };
    this.balls = [0, 1].map((i) => {
      const b = this.add.circle(start.wx + 120 + i * 220, px(30), 12, 0x8a2a20).setDepth(D.FOE);
      b.dir = i % 2 ? -1 : 1;
      b.speed = 90 + this.difficulty * 10;
      return b;
    });

    // -- the Pool (Lungs): hoops in one breath, the deep end holds the shard
    this.hoops = this.objAll('hoop').map((o) => {
      const img = this.add.image(o.wx, o.wy, 'astro-hoop').setDepth(D.INTERACT).setAlpha(0.9);
      return { x: o.wx, y: o.wy, img, hit: false };
    });
    const pb = this.obj('pool_board');
    this.add.text(pb.wx - 30, pb.wy - 40, 'THE POOL\n5 hoops,\none breath', { fontFamily: 'monospace', fontSize: '9px', color: '#9ac4dc' }).setDepth(D.INTERACT);

    // -- the Wall (Grip): the bell at the top
    const bell = this.obj('bell');
    this.bellImg = this.add.image(bell.wx, bell.wy, 'astro-bell').setDepth(D.INTERACT);
    this.groundedSinceBell = true;
    this.addInteract(bell.wx, bell.wy, 'the bell', () => {
      if (!this.groundedSinceBell) return;
      this.groundedSinceBell = false;
      sfx('bell');
      this.tweens.add({ targets: this.bellImg, angle: 20, duration: 90, yoyo: true, repeat: 3 });
      if (this.stats.grip < 3) this.gainStat('grip', 3, 'GRIP 3/5 — the bell, first try');
      else this.gainStat('grip', this.stats.grip + 1, `GRIP ${Math.min(5, this.stats.grip + 1)}/5 — again, faster`);
    }, { once: false });
    const plaque = this.obj('plaque');
    this.add.rectangle(plaque.wx + 26, plaque.wy, 92, 30, 0x6a5a3a).setDepth(D.INTERACT - 1);
    this.add
      .text(plaque.wx + 26, plaque.wy, 'FIRST MERIDIAN CREW\nOKONKWO · VANCE · LIU', { fontFamily: 'monospace', fontSize: '7px', color: '#f2e0a0', align: 'center' })
      .setOrigin(0.5)
      .setDepth(D.INTERACT);

    // -- the Ring (Nerve): three rounds, then Priya
    const ring = this.obj('ring');
    [ring.wx - 5 * T, ring.wx + 5 * T].forEach((x) => this.add.image(x, px(31) + 8, 'astro-rope-post').setDepth(D.INTERACT));
    [0, 1, 2].forEach((i) =>
      this.add.rectangle(ring.wx, px(31) - 2 - i * 10, 10 * T, 2, 0xc03a2a, 0.8 - i * 0.15).setDepth(D.INTERACT)
    );
    this.addInteract(ring.wx, px(31), 'the ring', () => this.boxing(), { once: false, when: () => !this.bout && this.stats.nerve < 5 });

    // -- the Study: flashcards + the notebook
    const pr = this.built.objects.find((v) => v.type === 'npc' && v.who === 'priya');
    this.priyaStudy = this.add.image(pr.wx, pr.wy, 'npc-priya').setDepth(D.FOE);
    this.add.image(pr.wx + 30, pr.wy + 12, 'astro-desk').setDepth(D.INTERACT - 1);
    const fc = this.obj('flashcards');
    this.addInteract(fc.wx + 20, fc.wy, 'flashcards, with Priya', async () => {
      const right = await systemsCards(this);
      this.floatText(fc.wx, fc.wy - 50, right >= 8 ? `${right}/10. "you're ready."` : `${right}/10. "again, before Thursday."`, right >= 8 ? '#7ec87e' : '#c8c0b0');
      if (right >= 8) this.setFlag('cards_done');
    }, { once: false });
    const nb = this.obj('notebook');
    this.add.image(nb.wx, nb.wy + 8, 'astro-notebook').setDepth(D.INTERACT);
    this.notebookPage = 0;
    this.addInteract(nb.wx, nb.wy, "Priya's notebook", async () => {
      for (let i = this.notebookPage; i < NOTEBOOK.length; i++) {
        const r = await this.dialog.show([{ name: "Priya's notebook", text: NOTEBOOK[i], choices: i < NOTEBOOK.length - 1 ? [{ label: 'keep reading', value: 'on' }, { label: 'enough', value: 'stop' }] : undefined }]);
        this.notebookPage = i + 1;
        if (r === 'stop') return;
      }
      if (this.notebookPage >= NOTEBOOK.length && !this.F.notebook_read) {
        this.setFlag('notebook_read');
        this.floatText(nb.wx, nb.wy - 50, 'every page. her handwriting slants left.', '#f2e0a0');
      }
      this.notebookPage = 0;
    }, { once: false });

    // -- the physical
    const hv = this.built.objects.find((v) => v.type === 'npc' && v.who === 'halvorsen');
    this.halvorsen = this.add.image(hv.wx, hv.wy, 'npc-halvorsen').setDepth(D.FOE);
    const ph = this.obj('physical');
    this.addInteract(ph.wx, ph.wy, 'the physical', async () => {
      await this.runPhysical();
    }, { once: false, when: () => !this.F.physical });
  }

  async runPhysical() {
    const p = this.player;
    p.controlLockUntil = this.time.now + 99999;
    p.body.setVelocity(0, 0);
    const hold = (label, ms) =>
      new Promise((res) => {
        this.floatText(p.x, p.y - 70, label, '#88b8d8');
        let held = 0;
        const ev = this.time.addEvent({
          delay: 100,
          loop: true,
          callback: () => {
            if (p.keys.SPACE.isDown) held += 100;
            if (held >= ms) {
              ev.remove();
              sfx('chime');
              res();
            }
          },
        });
      });
    await hold('TREADMILL — hold [Space]', 1800);
    await hold(`BREATH — hold [Space]  (lungs ${this.stats.lungs}/5)`, 1200 + this.stats.lungs * 300);
    await hold('GRIP — hold [Space], don\'t shake', 1500);
    this.cameras.main.flash(300, 255, 255, 255);
    p.controlLockUntil = 0;
    await this.dialog.show(A_DIALOGUES.d1);
    this.setFlag('physical');
    this.setObjective('the Board. Thursday.');
  }

  // ------- boxing (§5.1 the Ring) ----------------------------------------

  async boxing() {
    if (this.bout) return;
    const ring = this.obj('ring');
    const round = this.stats.nerve < 3 ? this.stats.nerve + 1 : 4; // 1..3 then Priya
    const vsPriya = round >= 4;
    this.bout = {
      round,
      vsPriya,
      hits: 0,
      taken: 0,
      lastAttack: this.time.now,
      open: false,
      opp: this.physics.add.image(ring.wx + 80, px(31) - 20, vsPriya ? 'npc-priya' : 'foe-gym-rat').setDepth(D.FOE),
      state: 'circle',
      stateUntil: 0,
    };
    this.bout.opp.body.setSize(20, 40);
    this.physics.add.collider(this.bout.opp, this.solids);
    this.floatText(ring.wx, px(29), vsPriya ? 'ROUND 4 — PRIYA.\nshe parries everything. wait her out.' : `ROUND ${round} — land 5, eat none you can duck.`, '#f2d580');
    sfx('bell');
  }

  updateBoxing(time) {
    const b = this.bout;
    if (!b || !b.opp.active) return;
    const p = this.player;
    const opp = b.opp;
    const d = p.x - opp.x;
    opp.setFlipX(d < 0);

    if (b.state === 'circle') {
      opp.setVelocityX(Math.abs(d) > 60 ? Math.sign(d) * 70 : -Math.sign(d) * 30);
      if (Math.abs(d) < 70 && time > b.stateUntil && Math.random() < 0.012) {
        b.state = 'windup';
        b.stateUntil = time + 400;
        opp.setTint(0xffa0a0);
        sfx('click');
      }
      // Priya opens up only when Jo stops swinging — the Nerve lesson
      if (b.vsPriya && !b.open && time - b.lastAttack > 4000) {
        b.open = true;
        b.openUntil = time + 2500;
        opp.setTint(0xa0e8a0);
        this.floatText(opp.x, opp.y - 50, 'she drops her guard —', '#7ec87e');
      }
      if (b.open && time > b.openUntil) {
        b.open = false;
        opp.clearTint();
      }
    } else if (b.state === 'windup') {
      opp.setVelocityX(0);
      if (time > b.stateUntil) {
        b.state = 'swing';
        b.stateUntil = time + 200;
        opp.clearTint();
        if (Math.abs(p.x - opp.x) < 60 && !p.crouching) {
          b.taken += 1;
          sfx('hurt');
          this.cameras.main.shake(120, 0.006);
          p.body.setVelocityX(Math.sign(d) * 200);
          this.floatText(p.x, p.y - 50, `caught you — ${b.taken}/3`, '#e86a6a');
        } else if (Math.abs(p.x - opp.x) < 60) {
          this.floatText(p.x, p.y - 50, 'slipped it', '#88b8d8');
        }
      }
    } else if (b.state === 'swing' && time > b.stateUntil) {
      b.state = 'circle';
      b.stateUntil = time + 600;
    }

    // Jo's jab
    if (Phaser.Input.Keyboard.JustDown(p.keys.X)) {
      b.lastAttack = time;
      if (b.open) b.open = false;
      const rect = p.swingLadle();
      if (rect && Phaser.Geom.Rectangle.Contains(rect, opp.x, opp.y)) {
        const lands = !b.vsPriya || b.openUntil > time;
        if (lands) {
          b.hits += 1;
          sfx('clang');
          opp.setVelocityX(-Math.sign(d) * 140);
          this.floatText(opp.x, opp.y - 44, `${b.hits}/5`, '#f2d580');
        } else {
          sfx('snap');
          this.floatText(opp.x, opp.y - 44, 'parried.', '#c8c0b0');
          opp.setVelocityX(0);
        }
      }
    }

    if (b.taken >= 3) {
      this.endBout(false);
    } else if (b.hits >= 5) {
      this.endBout(true);
    }
  }

  endBout(won) {
    const b = this.bout;
    sfx('bell');
    this.tweens.add({ targets: b.opp, alpha: 0, duration: 500, onComplete: () => b.opp.destroy() });
    this.bout = null;
    if (won) {
      if (b.vsPriya) this.gainStat('nerve', 5, 'NERVE 5/5 — you let her come to you');
      else this.gainStat('nerve', this.stats.nerve + 1, `NERVE ${Math.min(5, this.stats.nerve + 1)}/5`);
    } else {
      this.floatText(this.player.x, this.player.y - 60, 'down. count of eight.\nthe round restarts when you do.', '#e86a6a');
    }
  }

  // ------- Phase 2: the Gate ---------------------------------------------

  buildGateRoom() {
    const door = this.obj('board_door');
    for (let c = -4; c <= 3; c++) this.add.rectangle(door.wx + c * 60 - 220, px(35) - 8, 30, 26, 0x3c3c46).setDepth(D.INTERACT - 1);
    this.doorLight = this.add.circle(door.wx, door.wy - 60, 6, 0xf2d580).setDepth(D.INTERACT);
    this.addInteract(door.wx, door.wy, 'the Board', () => this.faceTheBoard(), { once: false, when: () => this.F.physical && !this.F.selected });
  }

  async faceTheBoard() {
    const attempt = this.F.rejected ? 2 : 1;
    const res = await selectionBoard(this, { attempt });
    if (!res || !res.passed) {
      this.doorLight.setFillStyle(0xe83a2a);
      this.floatText(this.player.x, this.player.y - 60, attempt === 1 ? 'three red blinks. the door does not open.' : 'the letter again. "reapply." the year passes. read the notebook.', '#e86a6a');
      if (attempt === 1) await this.rejection();
      return;
    }
    if (!this.statsReady()) {
      // §5 — rigged: even at 7/7, the numbers are the numbers
      await this.dialog.show(A_DIALOGUES.d_rejected);
      await this.rejection();
      return;
    }
    await this.dialog.show(A_DIALOGUES.d_selected);
    this.setFlag('selected');
    sting.checkpoint();
    this.setObjective('the bus is waiting — training campus');
    this.statHud.setVisible(false);
  }

  async rejection() {
    if (this.F.rejected) return;
    this.setFlag('rejected');
    const cam = this.cameras.main;
    // the grey year: palette drops, the posters fade, Priya is packing
    this.greyYear = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x50525e, 0.4).setScrollFactor(0).setDepth(89);
    music.stop();
    await this.dialog.show(A_DIALOGUES.d_rejected);
    this.cameras.main.fadeOut(900, 20, 20, 24);
    await new Promise((res) => this.time.delayedCall(1000, res));
    this.player.setPosition(px(115), px(33));
    this.cameras.main.fadeIn(900);
    await this.dialog.show(A_DIALOGUES.d2);
    this.priyaStudy.setAlpha(0.4);
    this.floatText(px(115), px(31), 'TWELVE MONTHS LATER', '#c8c0b0');
    this.setObjective('a year to train. every stat to 3. read the notebook.');
    music.bass();
  }

  // ------- Phase 3: the Ground -------------------------------------------

  buildGround() {
    // centrifuge
    const cf = this.obj('centrifuge');
    this.add.image(cf.wx, cf.wy - 30, 'astro-dome').setDepth(D.INTERACT - 1);
    this.addInteract(cf.wx, cf.wy, 'the centrifuge', () => this.runCentrifuge(), { once: false, when: () => this.F.selected && !this.F.centrifuge });

    // neutral-buoyancy tank
    const rack = this.obj('panel_rack');
    this.add.image(rack.wx, rack.wy, 'astro-panel').setDepth(D.INTERACT);
    this.addInteract(rack.wx, rack.wy, 'take the panel', () => {
      this.carry = 'panel';
      this.updateSatchel();
      this.floatText(rack.wx, rack.wy - 40, 'the spare panel. heavy, then weightless.', '#88b8d8');
    }, { once: false, when: () => this.F.centrifuge && !this.carry && !this.F.pool });
    const slot = this.obj('panel_slot');
    this.add.rectangle(slot.wx, slot.wy, 30, 30, 0x2a3a52, 0.9).setDepth(D.INTERACT - 1).setStrokeStyle(2, 0xf2c078);
    this.addInteract(slot.wx, slot.wy, 'seat the panel', () => {
      if (this.carry !== 'panel') return this.floatText(slot.wx, slot.wy - 40, 'the slot is empty. the panel is on the rack.', '#c8c0b0');
      this.carry = null;
      this.updateSatchel();
      sfx('clang');
      this.setFlag('pool');
      this.floatText(slot.wx, slot.wy - 40, 'seated. the divers give two okays.', '#7ec87e');
      this.setObjective('the simulator — dock it');
    }, { once: false, when: () => this.F.centrifuge && !this.F.pool });
    const hatch = this.obj('tank_hatch');
    this.tankHatchOpen = false;
    this.addInteract(hatch.wx, hatch.wy, 'a two-person hatch — [F] calls Priya', () => {
      this.floatText(hatch.wx, hatch.wy - 40, 'it needs a hand on the other side. [F]', '#88b8d8');
    }, { once: false, when: () => this.F.centrifuge && !this.tankHatchOpen });

    // simulator
    const sim = this.obj('simulator');
    this.add.rectangle(sim.wx, sim.wy - 6, 60, 44, 0x2e3440).setDepth(D.INTERACT - 1).setStrokeStyle(2, 0x88b8d8);
    this.addInteract(sim.wx, sim.wy, 'the simulator', async () => {
      const ok = await docking(this, { label: 'SIM — DOCKING', fuel: 34 - 2 * this.difficulty });
      if (!ok) return this.floatText(sim.wx, sim.wy - 50, '"again." Osei does not smile.', '#c8c0b0');
      const q = await this.dialog.show([
        {
          name: 'SIM — MASTER ALARM',
          text: 'The sim fails a system: CABIN DEPRESS.\nFirst action?',
          choices: [
            { label: 'Seal the hatch, then mask', value: 'no' },
            { label: 'Mask on, then seal the hatch', value: 'yes' },
            { label: 'Call the ground first', value: 'no2' },
          ],
        },
      ]);
      if (q === 'yes') {
        this.setFlag('sim');
        this.floatText(sim.wx, sim.wy - 50, '"copy." from Osei, that is a medal.', '#7ec87e');
        this.setObjective('the survival course — night, rain');
      } else {
        this.floatText(sim.wx, sim.wy - 50, 'wrong order. the notebook knew.', '#e86a6a');
      }
    }, { once: false, when: () => this.F.pool && !this.F.sim });

    // survival forest
    const dz = this.obj('dark_zone');
    this.darkZone = this.add
      .rectangle((dz.wx - T / 2) + (dz.w * T) / 2, this.worldH / 2, dz.w * T, this.worldH, 0x060a08, 0.7)
      .setDepth(88);
    this.rainZone = { x0: dz.wx - T / 2, x1: dz.wx - T / 2 + dz.w * T };
    this.campItems = 0;
    this.objAll('camp_item').forEach((o, i) => {
      const img = this.add.image(o.wx, o.wy, ['astro-bag', 'astro-cone', 'astro-buoy'][i]).setDepth(D.INTERACT);
      this.addInteract(o.wx, o.wy, ['a tarp', 'a pole', 'a dry box'][i], () => {
        img.destroy();
        this.campItems += 1;
        sfx('pickup');
        this.floatText(o.wx, o.wy - 40, `shelter kit ${this.campItems}/3`, '#88b8d8');
      }, { when: () => this.F.sim });
    });
    const camp = this.obj('camp');
    this.addInteract(camp.wx, camp.wy, 'build the shelter', () => {
      if (this.campItems < 3) return this.floatText(camp.wx, camp.wy - 40, `${this.campItems}/3 — the rain disagrees`, '#c8c0b0');
      this.add.triangle(camp.wx, camp.wy + 10, -30, 16, 30, 16, 0, -20, 0x4a5a42).setDepth(D.INTERACT - 1);
      sfx('clang');
      this.setFlag('shelter');
      this.floatText(camp.wx, camp.wy - 40, 'the shelter holds. now the beacon — and Priya is not answering.', '#f2d580');
    }, { once: false, when: () => this.F.sim && !this.F.shelter });
    const ph = this.obj('priya_hurt');
    this.addInteract(ph.wx, ph.wy, 'Priya — her ankle', () => {
      this.carryingPriya = true;
      this.priyaFollow && this.priyaFollow.setVisible(false);
      this.floatText(ph.wx, ph.wy - 40, 'she says nothing. you pick her up.\n(slow. no big jumps. the beacon.)', '#88b8d8');
    }, { once: false, when: () => this.F.shelter && !this.carryingPriya && !this.F.survival });
    const bc = this.obj('beacon');
    this.beaconImg = this.add.image(bc.wx, bc.wy, 'astro-beacon').setDepth(D.INTERACT);
    this.addInteract(bc.wx, bc.wy, 'the beacon', async () => {
      if (!this.carryingPriya) return this.floatText(bc.wx, bc.wy - 40, 'the beacon can wait. Priya cannot.', '#c8c0b0');
      this.carryingPriya = false;
      sfx('chime');
      this.tweens.add({ targets: this.beaconImg, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
      await this.dialog.show(A_DIALOGUES.d3);
      this.setFlag('survival');
      this.setObjective('the pad, before dawn');
    }, { once: false, when: () => this.F.shelter && !this.F.survival });
    const wt = this.obj('water_tower');
    this.addInteract(wt.wx, wt.wy, 'the water tower', () => this.moment('m2'), { when: () => this.F.survival && !this.F.m2 });
  }

  async runCentrifuge() {
    const p = this.player;
    p.controlLockUntil = this.time.now + 99999;
    p.body.setVelocity(0, 0);
    const cam = this.cameras.main;
    const bg = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0).setScrollFactor(0).setDepth(200);
    const barBg = this.add.rectangle(cam.width / 2, cam.height / 2, 300, 22, 0x2a2a34).setScrollFactor(0).setDepth(201);
    const band = this.add.rectangle(cam.width / 2, cam.height / 2, 90, 22, 0x3a6a3a).setScrollFactor(0).setDepth(201);
    const needle = this.add.rectangle(cam.width / 2 - 150, cam.height / 2, 5, 30, 0xe86a6a).setScrollFactor(0).setDepth(202);
    const label = this.add.text(cam.width / 2, cam.height / 2 - 60, '', { fontFamily: 'monospace', fontSize: '15px', color: '#e8dcc8', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    let stage = 0;
    let pos = 0;
    let ok = true;
    await new Promise((res) => {
      const ev = this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          const target = 0.35 + stage * 0.15;
          pos += ((p.keys.SPACE.isDown ? 0.02 : -0.03) + Math.sin(this.time.now / 300) * 0.004);
          pos = Phaser.Math.Clamp(pos, 0, 1);
          needle.x = cam.width / 2 - 150 + pos * 300;
          band.x = cam.width / 2 - 150 + target * 300;
          const inBand = Math.abs(pos - target) < 0.15;
          needle.fillColor = inBand ? 0x7ec87e : 0xe86a6a;
          label.setText(`CENTRIFUGE — stage ${stage + 1}/4\nhold [Space]: keep the needle in the green`);
          bg.setAlpha(Math.min(0.75, stage * 0.18 + (inBand ? 0 : 0.1))); // G-lock closes in
          if (inBand) stage += 0.008;
          else stage = Math.max(0, stage - 0.004);
          if (stage >= 4) {
            ev.remove();
            res();
          }
        },
      });
    });
    [bg, barBg, band, needle, label].forEach((o) => o.destroy());
    p.controlLockUntil = 0;
    if (ok) {
      this.setFlag('centrifuge');
      // the flight suit: Jo's sprite changes for the rest of the dream
      this.player.art.setTint(this.theme.suitTint);
      this.player.tool.setVisible(true).setScale(1);
      this.cameras.main.flash(400, 255, 255, 255);
      this.floatText(p.x, p.y - 60, 'the flight suit. it fits like a decision.\n(+ the multitool)', '#f2d580');
      this.setObjective('the tank — seat the spare panel');
    }
  }

  // ------- Phase 4: the Sky ----------------------------------------------

  buildSky() {
    const hatch = this.obj('hatch');
    this.addInteract(hatch.wx, hatch.wy, 'the hatch', () => this.launch(), { once: false, when: () => this.F.survival && !this.F.docked });

    const valve = this.obj('valve');
    this.add.image(valve.wx, valve.wy, 'astro-valve').setDepth(D.INTERACT);
    this.addInteract(valve.wx, valve.wy, 'the coolant valve — [F] Priya takes the far hatch', () => {
      this.floatText(valve.wx, valve.wy - 40, 'two-person job. [F] first, then [E].', '#88b8d8');
    }, { once: false, when: () => this.F.docked && !this.F.coolant && !this.priyaOnHatch });
    this.addInteract(valve.wx, valve.wy, 'close the valve', () => {
      sfx('clang');
      this.setFlag('coolant');
      this.coolantDrops && this.coolantDrops.forEach((d) => d.destroy());
      this.floatText(valve.wx, valve.wy - 40, 'the spray dies. Priya, on comms: "isolated."', '#7ec87e');
      this.setObjective('the node — report to the ground');
    }, { once: false, when: () => this.F.docked && !this.F.coolant && this.priyaOnHatch });

    const comms = this.obj('comms');
    this.add.image(comms.wx, comms.wy, 'astro-comms').setDepth(D.INTERACT);
    this.addInteract(comms.wx, comms.wy, 'report', async () => {
      if (!this.F.debris_done) return this.floatText(comms.wx, comms.wy - 40, 'the panels are still tumbling — dodge through first.', '#c8c0b0');
      await this.dialog.show(A_DIALOGUES.d_osei_dock);
      this.setFlag('reported');
      this.setObjective('the airlock — the array is stuck');
    }, { once: false, when: () => this.F.coolant && !this.F.reported });

    const locker = this.obj('wrench_locker');
    this.add.image(locker.wx, locker.wy, 'astro-wrench').setDepth(D.INTERACT);
    this.addInteract(locker.wx, locker.wy, 'the torque wrench', () => {
      sfx('pickup');
      this.setFlag('wrench');
      this.satchel = ['WRENCH'];
      this.updateSatchelHud();
      this.floatText(locker.wx, locker.wy - 40, 'TORQUE WRENCH — six bolts, one order.', '#f2d580');
    }, { when: () => this.F.reported });

    const air = this.obj('airlock');
    this.addInteract(air.wx, air.wy, 'the airlock', async () => {
      if (!this.F.array_fixed) {
        this.o2 = this.o2Max;
        sfx('chime');
        this.floatText(air.wx, air.wy - 40, 'O₂ topped. outside, the tether is life:\n[F] clips to the next hook. never push off unclipped.', '#88b8d8');
        this.setFlag('eva_out');
      } else {
        await this.descend();
      }
    }, { once: false, when: () => this.F.wrench });

    const plate = this.obj('code_plate');
    this.add.rectangle(plate.wx, plate.wy, 70, 20, 0x4a4c54).setDepth(D.INTERACT - 1);
    this.add.text(plate.wx, plate.wy, BOLT_ORDER.join(' '), { fontFamily: 'monospace', fontSize: '10px', color: '#f2d580' }).setOrigin(0.5).setDepth(D.INTERACT);
    const arr = this.obj('array');
    this.arrayImg = this.add.rectangle(arr.wx + 20, arr.wy - 40, 16, 110, 0x2a3a52).setDepth(D.INTERACT - 1).setStrokeStyle(2, 0x88b8d8).setAngle(50);
    this.addInteract(arr.wx, arr.wy, 'the jammed hinge', async () => {
      const ok = await hinge(this);
      if (!ok) return;
      this.setFlag('array_fixed');
      this.setFlag('eva_done');
      this.tweens.add({ targets: this.arrayImg, angle: 0, duration: 1200, ease: 'sine.out' });
      this.cameras.main.flash(600, 255, 250, 220);
      this.floatText(arr.wx, arr.wy - 60, 'the array unfolds. light floods the hull.\nOsei: "copy." (that is all.)', '#f2e0a0');
      this.setObjective('back to the airlock — the moon is next');
    }, { once: false, when: () => this.F.eva_out && !this.F.array_fixed });

    const cup = this.obj('cupola');
    this.addInteract(cup.wx, cup.wy, 'the cupola — hold [↑]', () => {
      this.cupolaHold = this.time.now;
    }, { once: false, when: () => this.F.docked && !this.F.m3 });
  }

  async launch() {
    if (this.launching) return;
    this.launching = true;
    const p = this.player;
    p.controlLockUntil = this.time.now + 99999;
    p.body.setVelocity(0, 0);
    music.stop();
    const cam = this.cameras.main;
    const say = (t, c = '#e8dcc8') =>
      this.add.text(cam.width / 2, 140, t, { fontFamily: 'monospace', fontSize: '18px', color: c, align: 'center', stroke: '#14101c', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(210);
    // countdown
    for (let n = 3; n >= 1; n--) {
      const t = say(String(n));
      sfx('click');
      await new Promise((res) => this.time.delayedCall(600, res));
      t.destroy();
    }
    sfx('clang');
    cam.shake(9000, 0.004);
    const callouts = [
      { text: '"BREATHE." — hold [Space]', check: () => p.keys.SPACE.isDown },
      { text: '"BRACE." — hold [↓]', check: () => p.cursors.down.isDown || p.keys.S.isDown },
      { text: '"CALLOUT." — press [E]', just: 'E' },
      { text: '"BREATHE." — hold [Space]', check: () => p.keys.SPACE.isDown },
      { text: '"BRACE." — hold [↓]', check: () => p.cursors.down.isDown || p.keys.S.isDown },
      { text: '"CALLOUT." — press [E]', just: 'E' },
    ];
    let misses = 0;
    for (const c of callouts) {
      const t = say(c.text, '#f2d580');
      let ok = false;
      if (c.just) {
        ok = await new Promise((res) => {
          let done = false;
          const ev = this.time.addEvent({ delay: 60, repeat: 25, callback: () => {
            if (!done && Phaser.Input.Keyboard.JustDown(p.keys.E)) { done = true; ev.remove(); res(true); }
            if (ev.getOverallProgress() >= 1 && !done) res(false);
          } });
        });
      } else {
        let held = 0;
        ok = await new Promise((res) => {
          const ev = this.time.addEvent({ delay: 100, repeat: 15, callback: () => {
            if (c.check()) held += 100;
            if (held >= 900) { ev.remove(); res(true); }
            if (ev.getOverallProgress() >= 1) res(held >= 900);
          } });
        });
      }
      t.destroy();
      if (!ok) {
        misses += 1;
        sfx('fail');
        const m = say(`— steady. (${misses}/3)`, '#e86a6a');
        this.time.delayedCall(700, () => m.destroy());
        if (misses >= 3) {
          const ab = say('ABORT. ABORT.\nthe arms swing back in.', '#e86a6a');
          await new Promise((res) => this.time.delayedCall(1800, res));
          ab.destroy();
          p.controlLockUntil = 0;
          this.launching = false;
          return;
        }
      }
    }
    // staging — a lurch, then silence, then the window
    cam.shake(300, 0.012);
    sfx('clang');
    await new Promise((res) => this.time.delayedCall(600, res));
    cam.fadeOut(700, 4, 4, 10);
    await new Promise((res) => this.time.delayedCall(900, res));
    music.stop();
    const sp = this.obj('station_spawn');
    p.setPosition(sp.wx, sp.wy);
    p.setVelocity(0, 0);
    this.checkpoint = { x: sp.wx, y: sp.wy };
    this.coinsSinceCP = 0;
    cam.fadeIn(1600);
    const w1 = say('', '#e8dcc8');
    w1.setText('the engines stop.\n\nand there it is, in the window.');
    this.time.delayedCall(2600, () => {
      w1.setText('Osei: "copy."\n\nthat\'s all.');
      this.time.delayedCall(2000, () => w1.destroy());
    });
    this.setFlag('docked');
    this.launching = false;
    p.controlLockUntil = 0;
    this.o2 = this.o2Max;
    this.setObjective('the coolant leak — follow the droplets');
    // the leak: droplets drifting toward the valve
    const valve = this.obj('valve');
    this.coolantDrops = [];
    for (let i = 0; i < 8; i++) {
      const d = this.add.circle(sp.wx + 60 + i * 32, px(20 + (i % 3)), 3, 0x9ac4dc, 0.9).setDepth(D.INTERACT);
      this.tweens.add({ targets: d, x: valve.wx, y: valve.wy, duration: 2600 + i * 300, repeat: -1 });
      this.coolantDrops.push(d);
    }
  }

  spawnDebris() {
    if (this.F.debris_done || this.debris) return;
    this.debris = [];
    this.cameras.main.shake(400, 0.008);
    this.floatText(this.player.x, this.player.y - 60, 'the station shudders — loose panels!', '#e86a6a');
    const n = 4 + Math.min(3, this.difficulty);
    for (let i = 0; i < n; i++) {
      const s = this.physics.add.image(px(275 + (i * 3) % 10), px(19 + (i % 8)), `astro-debris-${i % 2}`).setDepth(D.FOE);
      s.body.setAllowGravity(false);
      s.setVelocity(Phaser.Math.Between(-90, 90), Phaser.Math.Between(-70, 70));
      s.setBounce(1, 1);
      this.physics.add.collider(s, this.solids);
      this.physics.add.overlap(this.player, s, () => {
        if (this.time.now < this.invulnUntil) return;
        this.invulnUntil = this.time.now + 1500;
        sfx('hurt');
        this.player.body.setVelocity(Phaser.Math.Between(-160, 160), -120);
        this.lives -= 1;
        this.updateHearts();
        if (this.lives <= 0 && !this.tryReturnTicket()) this.sectionRestart();
      });
      this.debris.push(s);
    }
    this.time.delayedCall(14000, () => {
      this.setFlag('debris_done');
      this.debris.forEach((d) => this.tweens.add({ targets: d, alpha: 0, duration: 600, onComplete: () => d.destroy() }));
      this.floatText(this.player.x, this.player.y - 60, 'the tumbling stops. the ground needs to know.', '#88b8d8');
    });
  }

  async descend() {
    const p = this.player;
    p.controlLockUntil = this.time.now + 99999;
    const cam = this.cameras.main;
    cam.fadeOut(700, 4, 4, 8);
    await new Promise((res) => this.time.delayedCall(900, res));
    // §5 descent — a vertical thrust puzzle with dust in the last stretch
    const hard = await this.landing();
    const l = this.obj('lander');
    this.add.image(l.wx, l.wy, 'astro-lander').setDepth(D.INTERACT - 1);
    p.setPosition(l.wx + 40, l.wy);
    p.setVelocity(0, 0);
    this.checkpoint = { x: l.wx + 40, y: l.wy };
    this.coinsSinceCP = 0;
    this.o2 = this.o2Max;
    this.power = hard ? 60 : 100;
    cam.fadeIn(1200);
    this.setFlag('landed');
    if (hard) {
      this.lives -= 1;
      this.updateHearts();
      this.floatText(p.x, p.y - 60, 'hard. the lander will forgive you. the power budget won\'t.', '#e86a6a');
    }
    this.setObjective('the dead probe — cross the crevasse field');
    p.controlLockUntil = 0;
    this.addInteract(l.wx, l.wy, 'the lander — O₂ / power', () => {
      this.o2 = this.o2Max;
      this.power = Math.max(this.power, 90);
      sfx('chime');
    }, { radius: 80, once: false, when: () => !this.F.priya_safe });
  }

  landing() {
    return new Promise((resolve) => {
      const cam = this.cameras.main;
      const bg = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x08080a, 1).setScrollFactor(0).setDepth(220);
      const ellipse = this.add.ellipse(cam.width / 2, cam.height - 60, 140, 24, 0x2e6a4a).setScrollFactor(0).setDepth(221);
      const lander = this.add.image(cam.width / 2 - 120, 60, 'astro-lander').setScrollFactor(0).setDepth(223);
      const dust = this.add.rectangle(cam.width / 2, cam.height - 70, cam.width, 140, 0x38383e, 0).setScrollFactor(0).setDepth(224);
      const label = this.add.text(cam.width / 2, 30, 'DESCENT — [Space] thrust · [←][→] drift · land in the ellipse, slow', { fontFamily: 'monospace', fontSize: '13px', color: '#e8dcc8' }).setOrigin(0.5).setScrollFactor(0).setDepth(225);
      const vel = { x: 24, y: 0 };
      const p = this.player;
      const ev = this.time.addEvent({
        delay: 33,
        loop: true,
        callback: () => {
          vel.y += 3.2; // lunar-ish
          if (p.keys.SPACE.isDown) vel.y -= 6.4;
          if (p.cursors.left.isDown || p.keys.A.isDown) vel.x -= 1.4;
          if (p.cursors.right.isDown || p.keys.D.isDown) vel.x += 1.4;
          lander.x += vel.x * 0.033;
          lander.y += vel.y * 0.033;
          if (lander.y > cam.height - 190) dust.setAlpha(Math.min(0.85, dust.alpha + 0.02));
          if (lander.y >= cam.height - 76) {
            ev.remove();
            const onPad = Math.abs(lander.x - ellipse.x) < 80;
            const soft = vel.y < 46;
            sfx(onPad && soft ? 'chime' : 'clang');
            label.setText(onPad ? (soft ? 'CONTACT. engines stop.' : 'CONTACT — hard.') : 'off the ellipse. dust everywhere. hard.');
            this.time.delayedCall(1200, () => {
              [bg, ellipse, lander, dust, label].forEach((o) => o.destroy());
              resolve(!(onPad && soft));
            });
          }
        },
      });
    });
  }

  // ------- Phase 5: the Moon ---------------------------------------------

  buildMoon() {
    // dust devils
    this.devils = this.objAll('dust_devil').map((o) => {
      const s = this.add.image(o.wx, o.wy, 'astro-devil-0').setDepth(D.FOE).setAlpha(0.85);
      this.tweens.add({ targets: s, x: o.wx + 4 * T, duration: 2600, yoyo: true, repeat: -1 });
      this.time.addEvent({ delay: 160, loop: true, callback: () => s.setTexture(s.texture.key === 'astro-devil-0' ? 'astro-devil-1' : 'astro-devil-0') });
      return s;
    });
    // sharp rocks: a puncture field
    const sr = this.obj('sharp_rocks');
    for (let i = 0; i < 4; i++) this.add.triangle(sr.wx + i * 22 - 30, sr.wy + 12, -8, 8, 8, 8, 0, -8, 0x4a4a50).setDepth(D.HAZARD);
    this.sharpRocks = { x0: sr.wx - 40, x1: sr.wx + 70, y: sr.wy };
    const pk = this.obj('patch_kit');
    this.add.image(pk.wx, pk.wy, 'astro-patch').setDepth(D.INTERACT);
    this.addInteract(pk.wx, pk.wy, 'patch the suit', () => {
      if (!this.puncturedAt) return;
      this.puncturedAt = 0;
      sfx('chime');
      this.floatText(pk.wx, pk.wy - 40, 'patched. the hiss stops.', '#7ec87e');
    }, { once: false, when: () => this.puncturedAt > 0 });

    // deep shadow: visor country
    this.shadows = this.objAll('shadow').map((o) => {
      const w = (o.w || 6) * T;
      return this.add.rectangle(o.wx - T / 2 + w / 2, this.worldH / 2, w, this.worldH, 0x020203, 0.88).setDepth(87);
    });

    // the probe and its core
    const probe = this.obj('probe');
    this.add.image(probe.wx, probe.wy - 8, 'astro-probe').setDepth(D.INTERACT - 1).setAngle(-12);
    this.add.image(probe.wx + 8, probe.wy + 2, 'astro-core').setDepth(D.INTERACT);
    this.addInteract(probe.wx, probe.wy, 'the data core', () => {
      this.carry = 'core';
      this.satchel = this.F.wrench ? ['WRENCH', 'CORE'] : ['CORE'];
      this.updateSatchelHud();
      sfx('pickup');
      this.floatText(probe.wx, probe.wy - 50, 'DATA CORE — heavy. jumps drop by half.\nradio: "…Jo. the rover— " and then the crater.', '#f2d580');
      this.startRescue();
    }, { when: () => this.F.landed });

    // the winch and the crater
    const winch = this.obj('winch');
    this.add.image(winch.wx, winch.wy, 'astro-winch').setDepth(D.INTERACT);
    const fl = this.obj('flare');
    this.addInteract(fl.wx, fl.wy, 'plant the flare', () => {
      this.add.image(fl.wx, fl.wy + 6, 'astro-flare').setDepth(D.INTERACT);
      this.add.circle(fl.wx, fl.wy, 46, 0xf2a060, 0.14).setDepth(D.INTERACT - 1);
      sfx('chime');
      this.setFlag('flare');
    }, { when: () => this.F.rescue_on });

    const pd = this.obj('priya_down');
    this.priyaDown = this.add.image(pd.wx, pd.wy + 8, 'npc-priya').setDepth(D.FOE).setAngle(80).setVisible(false);
    this.priyaLight = this.add.circle(pd.wx, pd.wy, 8, 0xf2e0a0, 0.5).setDepth(D.FOE).setVisible(false);
    this.addInteract(pd.wx, pd.wy, 'Priya', () => {
      this.carryingPriya = true;
      this.priyaDown.setVisible(false);
      this.priyaLight.setVisible(false);
      this.floatText(pd.wx, pd.wy - 50, 'she is breathing. you pick her up.\nthe Alarm is still screaming on your back.', '#88b8d8');
      this.time.delayedCall(4000, () => {
        if (this.alarmOn) this.floatText(this.player.x, this.player.y - 60, 'Priya, faint, on the radio:\n"…left shoulder. loose cable. [F]"', '#f2e0a0');
      });
    }, { once: false, when: () => this.F.rescue_on && this.priyaDown.visible && !this.carryingPriya });

    this.addInteract(winch.wx, winch.wy, 'the winch — hold [F] to reel', () => {}, { once: false, when: () => false });
  }

  startRescue() {
    if (this.F.rescue_on) return;
    this.setFlag('rescue_on');
    this.priyaDown.setVisible(true);
    this.priyaLight.setVisible(true);
    this.alarmOn = true;
    this.setObjective('the crater. her signal is one pip.');
    // the Alarm: a screech that follows him
    this.alarmMark = this.add.text(0, 0, '⚠', { fontFamily: 'monospace', fontSize: '16px', color: '#e83a2a' }).setDepth(D.PLAYER + 1);
    this.alarmEv = this.time.addEvent({
      delay: 1800,
      loop: true,
      callback: () => {
        if (!this.alarmOn) return;
        sfx('buzz');
        this.cameras.main.shake(90, 0.003);
        this.power = Math.max(0, this.power - 2);
      },
    });
  }

  fixAlarm() {
    if (!this.alarmOn || !this.carryingPriya) return;
    this.alarmOn = false;
    this.alarmMark && this.alarmMark.destroy();
    sfx('chime');
    this.floatText(this.player.x, this.player.y - 60, 'the cable seats. the Alarm dies mid-scream.\nthe quiet is enormous.', '#7ec87e');
    this.setObjective('the winch, at the rim — hold [F]');
  }

  async rimScene() {
    if (this.F.priya_safe) return;
    this.setFlag('priya_safe');
    this.carryingPriya = false;
    const p = this.player;
    p.controlLockUntil = this.time.now + 9000;
    p.setPosition(px(464), px(34)); // onto the rim, clear of the shaft
    p.body.reset(p.x, p.y);
    p.body.setAllowGravity(true);
    p.body.setVelocity(0, 0);
    music.stop();
    await this.dialog.show(A_DIALOGUES.d4);
    // Earth. four seconds. no music.
    const cam = this.cameras.main;
    const hold = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0).setScrollFactor(0).setDepth(230);
    await new Promise((res) => this.time.delayedCall(4000, res));
    hold.destroy();
    p.controlLockUntil = 0;
    this.setObjective('the lander. home.');
    this.addInteract(this.obj('lander').wx, this.obj('lander').wy, 'the lander — leave the moon', () => this.reentry(), { radius: 80, once: false, when: () => this.F.priya_safe && !this.F.reentry });
  }

  async reentry() {
    if (this.F.reentry) return;
    this.setFlag('reentry');
    const p = this.player;
    p.controlLockUntil = this.time.now + 99999;
    const cam = this.cameras.main;
    cam.fadeOut(800, 8, 4, 2);
    await new Promise((res) => this.time.delayedCall(1000, res));
    const fire = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xe8762a, 0.5).setScrollFactor(0).setDepth(220);
    const label = this.add.text(cam.width / 2, cam.height / 2, 'RE-ENTRY. comms blackout.\n\nhold [Space]. just hold it.', { fontFamily: 'monospace', fontSize: '17px', color: '#fff2c8', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(221);
    this.signal = 0;
    music.stop();
    cam.shake(9000, 0.006);
    let held = 0;
    await new Promise((res) => {
      const ev = this.time.addEvent({ delay: 100, loop: true, callback: () => {
        if (p.keys.SPACE.isDown) held += 100;
        label.setAlpha(0.7 + Math.sin(this.time.now / 200) * 0.3);
        if (held >= 9000) { ev.remove(); res(); }
      } });
    });
    sfx('snap');
    label.setText('a jolt. parachutes.\n\nsilence. then wind.');
    this.tweens.add({ targets: fire, alpha: 0, duration: 2500 });
    await new Promise((res) => this.time.delayedCall(2600, res));
    label.destroy();
    fire.destroy();
    const c = this.obj('capsule');
    p.setPosition(c.wx + 40, px(34));
    p.setVelocity(0, 0);
    this.checkpoint = { x: c.wx + 40, y: px(34) };
    this.signal = 3;
    this.carry = null;
    this.satchel = [];
    this.updateSatchelHud();
    cam.fadeIn(1800);
    p.controlLockUntil = 0;
    this.setFlag('field');
    this.setObjective('walk.');
  }

  // ------- Phase 6: the field --------------------------------------------

  buildField() {
    const c = this.obj('capsule');
    this.add.image(c.wx, c.wy + 6, 'astro-capsule').setDepth(D.INTERACT - 1);
    // grass: little blades that lean as he passes
    for (let x = c.wx + 80; x < px(514); x += 26) {
      const g = this.add.rectangle(x, px(35) + 12, 2, 8 + (x % 7), 0x6a9a4a, 0.9).setDepth(D.INTERACT - 1);
      this.tweens.add({ targets: g, angle: 8, duration: 1200 + (x % 800), yoyo: true, repeat: -1 });
    }
    const tr = this.obj('truck');
    this.add.rectangle(tr.wx, tr.wy + 4, 70, 30, 0x3e4650).setDepth(D.INTERACT - 1);
    this.add.rectangle(tr.wx - 20, tr.wy - 12, 28, 16, 0x3e4650).setDepth(D.INTERACT - 1);
    const ad2 = this.built.objects.filter((v) => v.type === 'npc' && v.who === 'adaeze')[1];
    this.adaezeField = this.add.image(ad2.wx, ad2.wy, 'npc-adaeze').setDepth(D.FOE).setVisible(false);
    const orbO = this.obj('orb');
    this.orbs = this.physics.add.staticGroup();
    const o = this.orbs.create(orbO.wx, orbO.wy, 'orb').setDepth(95);
    this.tweens.add({ targets: o, y: orbO.wy - 10, duration: 1000, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.physics.add.overlap(this.player, this.orbs, () => this.catchOrb());
  }

  async catchOrb() {
    if (this.orbCaught || !this.F.field) return;
    this.orbCaught = true;
    sfx('orb');
    completeDream('astronaut');
    const cam = this.cameras.main;
    const white = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xffffff, 0).setScrollFactor(0).setDepth(240);
    this.tweens.add({ targets: white, alpha: 1, duration: 1600 });
    await new Promise((res) => this.time.delayedCall(1800, res));
    const lines = ['"Eleven days."', '"Was it enough?"'];
    if (this.F.notebook_read) lines.push('"She\'d written the answers for him."');
    if (this.rejectedTwice) lines.push('"Twelve months, twice. He\'d have done twelve more."');
    const txt = this.add.text(cam.width / 2, cam.height / 2, '', { fontFamily: 'monospace', fontSize: '20px', color: '#2a2a34', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(241);
    for (const l of lines) {
      txt.setText(l).setAlpha(0);
      this.tweens.add({ targets: txt, alpha: 1, duration: 700 });
      await new Promise((res) => this.time.delayedCall(2400, res));
    }
    music.stop();
    this.scene.start('Hub');
  }

  // ------- motion models ---------------------------------------------------

  roomPhys() {
    const room = RoomBuilder.roomAt(this.built.rooms, this.player.x);
    return { room, phys: room.phys };
  }

  inWater() {
    const p = this.player;
    const tx = Math.floor(p.x / T);
    const ty = Math.floor(p.y / T);
    return this.built.charAt(tx, ty) === '~';
  }

  headAboveWater() {
    const p = this.player;
    const tx = Math.floor(p.x / T);
    const ty = Math.floor((p.y - 16) / T);
    return this.built.charAt(tx, ty) !== '~';
  }

  swimUpdate(time, delta) {
    const p = this.player;
    const b = p.body;
    b.setAllowGravity(false);
    const dt = delta / 1000;
    const left = p.cursors.left.isDown || p.keys.A.isDown;
    const right = p.cursors.right.isDown || p.keys.D.isDown;
    const up = p.cursors.up.isDown || p.keys.W.isDown || p.keys.SPACE.isDown;
    const down = p.cursors.down.isDown || p.keys.S.isDown;
    const vx = left ? -150 : right ? 150 : 0;
    const vy = up ? -140 : down ? 140 : 20;
    b.setVelocityX(Phaser.Math.Linear(b.velocity.x, vx, 0.12));
    // the vault out of the water is immune to the swim damping for a beat,
    // or the deck lip stays unreachable and the pool is a trap
    if (time < (this.vaultUntil || 0)) {
      // keep the upward impulse
    } else {
      b.setVelocityY(Phaser.Math.Linear(b.velocity.y, vy, 0.12));
    }
    const jumpJust =
      Phaser.Input.Keyboard.JustDown(p.keys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(p.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(p.keys.W);
    // "near the surface" is one tile of grace — demanding a dry head makes
    // the vault miss whenever a ripple of sink drops him a few pixels
    const nearSurface = this.built.charAt(Math.floor(p.x / T), Math.floor((p.y - 34) / T)) !== '~' || this.built.charAt(Math.floor(p.x / T), Math.floor((p.y - 58) / T)) !== '~';
    if (jumpJust && nearSurface) {
      this.vaultUntil = time + 300;
      p.y -= 10; // clear the surface tile at once so the boost isn't re-damped
      b.setVelocityY(-540);
      sfx('jump');
      for (let i = 0; i < 4; i++) {
        const dr = this.add.circle(p.x + Phaser.Math.Between(-8, 8), p.y + 8, 2, 0x9ac4dc, 0.8).setDepth(D.PLAYER + 1);
        this.tweens.add({ targets: dr, y: dr.y + 24, alpha: 0, duration: 500, onComplete: () => dr.destroy() });
      }
    }
    if (left) p.setFlipX(true);
    if (right) p.setFlipX(false);
    p.art.setTexture('jo-run');
    // breath
    if (this.headAboveWater()) this.breath = Math.min(100, this.breath + 60 * dt);
    else this.breath = Math.max(0, this.breath - (100 / (14 + 5 * this.stats.lungs)) * dt);
    if (Math.random() < 0.06) {
      const bub = this.add.circle(p.x + (p.flipX ? -8 : 8), p.y - 12, 2, 0xd8ecf8, 0.7).setDepth(D.PLAYER + 1);
      this.tweens.add({ targets: bub, y: bub.y - 40, alpha: 0, duration: 900, onComplete: () => bub.destroy() });
    }
    if (this.breath <= 0) {
      this.floatText(p.x, p.y - 40, 'no air—', '#e86a6a');
      this.hurt();
      this.breath = 100;
    }
  }

  zeroUpdate(time, delta) {
    const p = this.player;
    const b = p.body;
    b.setAllowGravity(false);
    const left = p.cursors.left.isDown || p.keys.A.isDown;
    const right = p.cursors.right.isDown || p.keys.D.isDown;
    const up = p.cursors.up.isDown || p.keys.W.isDown;
    const down = p.cursors.down.isDown || p.keys.S.isDown;
    if (left || right || up || down) this.aim = { x: left ? -1 : right ? 1 : 0, y: up ? -1 : down ? 1 : 0 };
    if (left) p.setFlipX(true);
    if (right) p.setFlipX(false);

    const onRail = this.rails.find((r) => p.x > r.x0 - 8 && p.x < r.x1 + 8 && Math.abs(p.y - r.y) < 30);
    // Arcade only reports blocked while moving into a wall; a floater at rest
    // reads as touching nothing. Probe the tiles just past the body instead.
    const solid = this.built.solidAt;
    const near = (dx, dy) => solid(Math.floor((p.x + dx) / T), Math.floor((p.y + dy) / T));
    const touching =
      b.blocked.up || b.blocked.down || b.blocked.left || b.blocked.right ||
      near(0, 28) || near(0, -28) || near(-18, 0) || near(18, 0);

    if (this.railHold) {
      // crawling along the rail, hand over hand
      b.setVelocity(0, 0);
      const r = this.railHold;
      if (left) p.x = Math.max(r.x0, p.x - 90 * (delta / 1000));
      if (right) p.x = Math.min(r.x1, p.x + 90 * (delta / 1000));
      p.y += (r.y + 14 - p.y) * 0.2;
      if (Phaser.Input.Keyboard.JustDown(p.keys.SPACE)) {
        // push off in the aimed direction (nudged clear of the rail first, or
        // Arcade catches the body on the next tile seam and kills the impulse)
        this.railHold = null;
        const a = this.aim.x || this.aim.y ? this.aim : { x: p.flipX ? -1 : 1, y: 0 };
        const n = Math.hypot(a.x, a.y) || 1;
        p.setPosition(p.x + (a.x / n) * 10, p.y + (a.y / n) * 10);
        b.reset(p.x, p.y);
        b.setAllowGravity(false);
        b.setVelocity((a.x / n) * 210, (a.y / n) * 210);
        sfx('jump');
      }
      if (Phaser.Input.Keyboard.JustDown(p.keys.E) && !this.nearestInteract) this.railHold = null;
    } else if (touching) {
      // against a surface: hand-over-hand crawl along it, or rest and damp.
      // The crawl moves the sprite directly — velocity-based crawling in 0g
      // snags on every tile seam and goes nowhere.
      b.setVelocity(b.velocity.x * 0.9, b.velocity.y * 0.9);
      if (left || right) {
        const dir = left ? -1 : 1;
        const ahead = solid(Math.floor((p.x + dir * 16) / T), Math.floor(p.y / T));
        if (!ahead) p.x += dir * 85 * (delta / 1000);
      }
      if (Phaser.Input.Keyboard.JustDown(p.keys.SPACE)) {
        const evaRoom = this.roomPhys().room.id === 'p4_eva';
        if (evaRoom && !this.tether) {
          this.driftAway();
          return;
        }
        const a = this.aim.x || this.aim.y ? this.aim : { x: p.flipX ? -1 : 1, y: 0 };
        const n = Math.hypot(a.x, a.y) || 1;
        p.setPosition(p.x + (a.x / n) * 10, p.y + (a.y / n) * 10);
        b.reset(p.x, p.y);
        b.setAllowGravity(false);
        b.setVelocity((a.x / n) * 210, (a.y / n) * 210);
        sfx('jump');
        p.dust(2);
      }
      if (onRail && Phaser.Input.Keyboard.JustDown(p.keys.E) && !this.nearestInteract) {
        this.railHold = onRail;
        sfx('pickup');
      }
    } else {
      // drifting: no control, slow cosmetic tumble
      if (onRail && Phaser.Input.Keyboard.JustDown(p.keys.E) && !this.nearestInteract) {
        this.railHold = onRail;
        b.setVelocity(0, 0);
        sfx('pickup');
      }
    }
    p.art.setTexture('jo-run');
    p.art.setAngle(this.railHold || touching ? 0 : Math.sin(time / 900) * 14);

    // the tether: [F] clips to the nearest hook in range; holding F reels
    if (this.roomPhys().room.id === 'p4_eva' || this.hooks.some((h) => Math.abs(h.x - p.x) < 300)) {
      const near = this.hooks.filter((h) => Phaser.Math.Distance.Between(p.x, p.y, h.x, h.y) < 6.5 * T);
      if (Phaser.Input.Keyboard.JustDown(this.keyF) && near.length) {
        this.tether = near.sort((a, c) => Math.abs(a.x - p.x) - Math.abs(c.x - p.x))[0];
        sfx('snap');
        this.floatText(this.tether.x, this.tether.y - 30, 'clipped', '#7ec87e');
      }
      if (this.tether && this.keyF.isDown && this.keyF.getDuration() > 350 && this.power > 0) {
        const d = Phaser.Math.Distance.Between(p.x, p.y, this.tether.x, this.tether.y);
        if (d > 20) {
          b.setVelocity(((this.tether.x - p.x) / d) * 130, ((this.tether.y - p.y) / d) * 130);
          this.power = Math.max(0, this.power - 5 * (delta / 1000));
        }
      }
      if (this.tether) {
        const d = Phaser.Math.Distance.Between(p.x, p.y, this.tether.x, this.tether.y);
        if (d > 7.5 * T) {
          // taut: the line holds, springs him back
          b.setVelocity(((this.tether.x - p.x) / d) * 120, ((this.tether.y - p.y) / d) * 120);
        }
        if (!this.tetherLine) this.tetherLine = this.add.line(0, 0, 0, 0, 0, 0, 0xf2c078, 0.8).setOrigin(0).setDepth(D.PLAYER - 1).setLineWidth(1.5);
        this.tetherLine.setTo(p.x, p.y, this.tether.x, this.tether.y).setVisible(true);
      } else if (this.tetherLine) this.tetherLine.setVisible(false);
    }
  }

  driftAway() {
    if (this.drifting) return;
    this.drifting = true;
    const p = this.player;
    p.controlLockUntil = this.time.now + 4000;
    p.body.setVelocity(40, -70);
    music.stop();
    this.floatText(p.x, p.y - 60, 'no tether.\n\nEarth does not get closer.', '#e86a6a');
    this.tweens.add({ targets: [p.art, p.hat], scale: 0.3, alpha: 0, duration: 3200, ease: 'sine.in' });
    this.time.delayedCall(3400, () => {
      p.art.setScale(1).setAlpha(1);
      p.hat.setScale(1).setAlpha(1);
      p.setPosition(this.checkpoint.x, this.checkpoint.y);
      p.setVelocity(0, 0);
      this.drifting = false;
      this.tether = null;
      this.o2 = this.o2Max;
      this.loseHeart();
    });
  }

  moonPrep() {
    const p = this.player;
    p.body.setAllowGravity(true);
    p.body.setGravityY(-700); // net 500: high slow arcs without flying the level
    p.slippery = true;
    p.slipFactor = 0.05; // momentum is hard to kill
  }

  earthPrep() {
    const p = this.player;
    p.body.setAllowGravity(true);
    p.body.setGravityY(0);
    p.slippery = false;
  }

  onSolidTouch(tile) {
    // crumbling holds and rim tiles: they fall SLOWLY, which is worse.
    // In the gym they re-set (someone re-chalks them); on the moon they don't.
    if (tile.tileRole === 'loose' && !tile.falling && this.player.body.bottom <= tile.body.top + 6) {
      tile.falling = true;
      const home = { x: tile.x, y: tile.y };
      const onMoon = tile.x > px(330);
      this.time.delayedCall(onMoon ? 600 : 850, () => {
        if (!tile.body) return;
        tile.body.enable = false;
        this.tweens.add({ targets: tile, y: tile.y + 300, alpha: 0, duration: 2600, ease: 'sine.in' });
        if (!onMoon)
          this.time.delayedCall(5000, () => {
            if (!tile.body) return;
            this.tweens.killTweensOf(tile);
            tile.setPosition(home.x, home.y).setAlpha(1);
            tile.body.enable = true;
            tile.falling = false;
          });
      });
    }
  }

  updateSatchel() {
    this.satchel = [];
    if (this.F.wrench) this.satchel.push('WRENCH');
    if (this.carry === 'panel') this.satchel.push('PANEL');
    if (this.carry === 'core') this.satchel.push('CORE');
    this.updateSatchelHud();
  }

  dropCarry() {
    this.carry = null;
    this.carryingPriya = false;
    this.updateSatchel();
  }

  // ------- update ---------------------------------------------------------

  update(time, delta) {
    if (this.handleModalUpdate()) return;
    const p = this.player;
    const dt = delta / 1000;
    const { room, phys } = this.roomPhys();
    const swimming = this.inWater();

    // motion
    if (swimming) {
      this.swimUpdate(time, delta);
    } else if (phys === 'zero') {
      this.zeroUpdate(time, delta);
    } else if (phys === 'moon') {
      this.moonPrep();
      p.update(time, delta);
      // the bound: high but not continental — air speed capped so the wide
      // crevasses take a real run-up; heavy carries cap the jump too
      if (!p.body.onFloor()) p.body.velocity.x = Phaser.Math.Clamp(p.body.velocity.x, -185, 185);
      if (p.body.velocity.y < -520) p.body.setVelocityY(-520);
      if ((this.carry === 'core' || this.carryingPriya) && p.body.velocity.y < -350) p.body.setVelocityY(-350);
      // landing dust hangs
      if (p.body.onFloor() && Math.abs(p.body.velocity.x) > 40 && Math.random() < 0.1) {
        const d = this.add.circle(p.x, p.y + 22, 3, 0xb8b4a8, 0.5).setDepth(D.PLAYER - 1);
        this.tweens.add({ targets: d, y: d.y - 10, alpha: 0, duration: 3000, onComplete: () => d.destroy() });
      }
    } else {
      this.earthPrep();
      if (this.railHold) this.railHold = null;
      // bobbing at the water line flickers between swim and freefall; in the
      // freefall frames the surface still counts as ground for a jump
      const overWater = this.built.charAt(Math.floor(p.x / T), Math.floor((p.y + 26) / T)) === '~';
      if (overWater && !p.body.onFloor()) p.lastGrounded = time;
      p.update(time, delta);
      if (this.carryingPriya) {
        p.body.velocity.x = Phaser.Math.Clamp(p.body.velocity.x, -140, 140);
        if (p.body.velocity.y < -420) p.body.setVelocityY(-420);
      }
    }

    // carried things ride on his back
    if (this.carryPix) this.carryPix.destroy();
    if (this.carry || this.carryingPriya) {
      const key = this.carryingPriya ? 'npc-priya' : this.carry === 'panel' ? 'astro-panel' : 'astro-core';
      this.carryPix = this.add.image(p.x + (p.flipX ? 12 : -12), p.y - 10, key).setDepth(D.PLAYER + 1).setAngle(this.carryingPriya ? -70 : 0).setAlpha(0.95);
    }

    // suit meters run wherever the suit is the only air
    const suited = phys === 'zero' || phys === 'moon';
    this.o2Bar.setVisible(suited).width = (this.o2 / this.o2Max) * 90;
    this.o2BarBg.setVisible(suited);
    this.o2Label.setVisible(suited);
    this.pwrBar.setVisible(suited).width = (this.power / 100) * 90;
    this.pwrBarBg.setVisible(suited);
    this.pwrLabel.setVisible(suited);
    this.breathBar.setVisible(swimming && !suited).width = (this.breath / 100) * 90;
    if (swimming && !suited) this.o2BarBg.setVisible(true);
    if (suited) {
      const leak = this.puncturedAt ? 3 : 1;
      this.o2 = Math.max(0, this.o2 - leak * dt);
      if (this.puncturedAt && time - this.puncturedAt > 30000) {
        this.puncturedAt = 0;
        this.floatText(p.x, p.y - 50, 'the leak seals itself in the cold. barely.', '#c8c0b0');
      }
      // an invisible grace while carrying Priya — the rescue cannot fail here
      if (this.o2 <= 0 && !this.carryingPriya) {
        this.o2 = this.o2Max;
        this.floatText(p.x, p.y - 50, 'the suit wins. you wake at the flag.', '#e86a6a');
        this.hurt();
      }
      this.o2Bar.fillColor = this.o2 < 10 ? 0xe83a2a : 0x88b8d8;
    }

    // stat clipboard only while the gym is the story
    this.statHud.setVisible(!this.F.selected);
    // signal
    const inCrater = room.id === 'p5_crater' && p.y > px(40);
    this.signal = inCrater ? 0 : this.F.rescue_on && room.id.startsWith('p5') ? 1 : 3;
    this.signalHud.setVisible(this.F.docked || room.id.startsWith('p5'));
    this.signalHud.setText(`radio ${'▮'.repeat(this.signal)}${'▯'.repeat(3 - this.signal)}${this.signal === 0 ? '  — alone' : ''}`);
    this.signalHud.setColor(this.signal === 0 ? '#e86a6a' : '#7ec87e');
    if (inCrater && !this.wasInCrater) music.stop();
    this.wasInCrater = inCrater;

    // §3.3 visor
    if (Phaser.Input.Keyboard.JustDown(this.keyTab)) {
      this.visorOn = !this.visorOn;
      sfx('click');
    }
    this.visor.setAlpha(this.visorOn && this.power > 0 ? 0.16 : 0);
    this.visorText.setVisible(this.visorOn && this.power > 0);
    if (this.visorOn) this.visorText.setText(`VISOR — ${this.objectiveText.text || 'no objective'}\n${'★ '.repeat(3)}`);
    for (const s of this.shadows || []) s.setAlpha(this.visorOn && this.power > 0 ? 0.35 : 0.88);

    // the gym minigames
    this.updateTrack(time);
    this.updateHoops();
    if (p.body.onFloor()) this.groundedSinceBell = true;
    if (this.bout) this.updateBoxing(time);

    // survival rain
    if (this.rainZone && p.x > this.rainZone.x0 && p.x < this.rainZone.x1 && Math.random() < 0.3) {
      const r = this.add.rectangle(p.x + Phaser.Math.Between(-240, 240), p.y - 200, 1, 10, 0x88b8d8, 0.5).setDepth(86);
      this.tweens.add({ targets: r, y: r.y + 300, alpha: 0, duration: 500, onComplete: () => r.destroy() });
    }

    // Priya follows through training
    this.updatePriya(time, delta);

    // station events
    if (this.F.coolant && !this.F.debris_done && p.x > px(273) && p.x < px(286)) this.spawnDebris();
    // two-person calls: [F] posts Priya to the far side
    if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
      const hatch = this.obj('tank_hatch');
      if (Math.abs(p.x - hatch.wx) < 100 && !this.tankHatchOpen && this.F.centrifuge) {
        this.tankHatchOpen = true;
        this.openMockWall();
      }
      const valve = this.obj('valve');
      if (this.F.docked && !this.F.coolant && Math.abs(p.x - valve.wx) < 140) {
        this.priyaOnHatch = true;
        this.floatText(valve.wx, valve.wy - 60, 'Priya, on comms: "on the hatch. go."', '#f2e0a0');
      }
      if (this.alarmOn && this.carryingPriya) this.fixAlarm();
    }

    // moon hazards
    if (room.id.startsWith('p5')) {
      for (const dv of this.devils) {
        if (Phaser.Math.Distance.Between(p.x, p.y, dv.x, dv.y) < 40) {
          p.body.velocity.x += (p.x > dv.x ? 1 : -1) * 22;
          this.power = Math.max(0, this.power - 8 * dt);
        }
      }
      if (!this.puncturedAt && this.sharpRocks && p.x > this.sharpRocks.x0 && p.x < this.sharpRocks.x1 && p.body.onFloor() && Math.abs(p.body.velocity.x) > 60) {
        this.puncturedAt = time;
        sfx('hurt');
        this.floatText(p.x, p.y - 50, 'PUNCTURE — O₂ hissing.\nthe patch kit. 30 seconds.', '#e86a6a');
      }
      // the winch: hold F at the rim with Priya
      const winch = this.obj('winch');
      if (this.carryingPriya && !this.alarmOn && this.keyF.isDown && Math.abs(p.x - winch.wx) < 8 * T && p.y > px(36)) {
        p.body.setAllowGravity(false);
        p.body.setVelocity(((px(459) - p.x) / 60) * 8, -(40 + this.stats.grip * 14)); // the line hangs in the clear column
        if (!this.reeling) {
          this.reeling = true;
          this.floatText(winch.wx, winch.wy - 40, 'the winch bites. hold on. hold her.', '#f2d580');
        }
      } else if (this.reeling && p.y <= px(36)) {
        this.reeling = false;
        p.body.setAllowGravity(true);
        this.rimScene();
      } else if (this.reeling && !this.keyF.isDown) {
        this.reeling = false;
        p.body.setAllowGravity(true);
      }
      if (this.alarmMark && this.alarmOn) this.alarmMark.setPosition(p.x + 16, p.y - 30 - Math.sin(time / 90) * 3);
    }

    // the cupola small moment: hold up for ~2.5s
    if (this.cupolaHold && !this.F.m3) {
      const up = p.cursors.up.isDown || p.keys.W.isDown;
      if (!up) this.cupolaHold = null;
      else if (time - this.cupolaHold > 2500) this.moment('m3');
    }

    // the field: auto-walk right, the one Good, the stretcher
    if (this.F.field && !this.orbCaught) {
      if (!this.fieldBeats && p.x > px(495)) {
        this.fieldBeats = true;
        this.floatText(px(510), px(31), 'Osei, from the truck, not on radio:\n"…Good."', '#f2e0a0');
        this.adaezeField.setVisible(true);
        const stretcher = this.add.image(px(500), px(34), 'npc-priya').setDepth(D.FOE).setAngle(90);
        this.tweens.add({ targets: stretcher, x: px(480), duration: 6000, onComplete: () => stretcher.destroy() });
        this.time.delayedCall(3000, () => this.floatText(px(492), px(32), 'Priya, past on a stretcher: thumbs up.', '#c8c0b0'));
      }
    }

    // arrival: the m1 moment fires from its interact list entry via prompt
    const m1 = this.obj('m1_door');
    if (!this.F.m1 && !this.m1Added) {
      this.m1Added = true;
      this.addInteract(m1.wx, m1.wy, 'watch, from the door', () => this.moment('m1'), { when: () => !this.F.m1 });
    }

    // interactions
    let nearest = null;
    for (const it of this.interacts) {
      if (it.used && it.once) continue;
      if (!it.when()) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, it.x, it.y);
      if (d < it.radius && (!nearest || d < nearest.d)) nearest = { it, d };
    }
    this.nearestInteract = nearest;
    if (nearest) {
      this.promptText.setVisible(true).setPosition(nearest.it.x, nearest.it.y - 40).setText(`[E] ${nearest.it.label}`);
      if (Phaser.Input.Keyboard.JustDown(p.keys.E)) {
        nearest.it.used = true;
        nearest.it.cb();
      }
    } else {
      this.promptText.setVisible(false);
    }

    this.updateMusicRoom();
    this.updatePickups(time, delta);
    this.updateFoes(time);

    if (p.y > this.worldH + 60) {
      p.setPosition(this.checkpoint.x, this.checkpoint.y);
      p.setVelocity(0, 0);
      this.hurt();
    }
  }

  openMockWall() {
    sfx('clang');
    this.floatText(this.obj('tank_hatch').wx, this.obj('tank_hatch').wy - 50, 'Priya takes the other side. the hatch swings.', '#f2e0a0');
    this.built.solids.children.iterate((img) => {
      if (img && img.tx === 186 + 0 && img.ty >= 36 && img.ty <= 38) {
        if (img.body) img.body.enable = false;
        this.tweens.add({ targets: img, alpha: 0.15, duration: 500 });
      }
    });
  }

  updateTrack(time) {
    const p = this.player;
    const t = this.track;
    if (!t) return;
    for (const ball of this.balls) {
      ball.x += ball.dir * ball.speed * 0.016;
      if (ball.x < t.start + 40) ball.dir = 1;
      if (ball.x > t.far - 40) ball.dir = -1;
      const onMezz = Math.abs(p.y - px(30)) < 30;
      if (onMezz && Math.abs(p.x - ball.x) < 20 && time > (this.ballHitAt || 0)) {
        this.ballHitAt = time + 1200;
        sfx('hurt');
        p.body.setVelocity(-Math.sign(ball.dir) * 100, -300);
        this.floatText(p.x, p.y - 40, 'medicine ball!', '#e86a6a');
        t.phase = 'home';
      }
    }
    const onMezz = Math.abs(p.y - px(30)) < 40;
    if (!onMezz) return;
    if (t.phase === 'home' && p.x > t.far - 20) t.phase = 'out';
    else if (t.phase === 'out' && p.x < t.start + 20) {
      t.phase = 'home';
      t.laps += 1;
      sfx('chime');
      if (this.stats.legs < 3 + Math.min(2, t.laps - 1)) this.gainStat('legs', Math.min(5, 2 + t.laps), `LEGS ${Math.min(5, 2 + t.laps)}/5 — lap ${t.laps}`);
      else this.floatText(p.x, p.y - 40, `lap ${t.laps}`, '#88b8d8');
    }
  }

  updateHoops() {
    const p = this.player;
    if (!this.inWater()) {
      if (this.hoops.some((h) => h.hit)) {
        const clean = this.hoops.every((h) => h.hit);
        if (clean) {
          const to = Math.min(5, Math.max(3, this.stats.lungs + 1));
          this.gainStat('lungs', to, `LUNGS ${to}/5 — five hoops, one breath`);
        }
        this.hoops.forEach((h) => {
          h.hit = false;
          h.img.clearTint();
        });
      }
      return;
    }
    for (const h of this.hoops) {
      if (!h.hit && Phaser.Math.Distance.Between(p.x, p.y, h.x, h.y) < 26) {
        h.hit = true;
        h.img.setTint(0x7ec87e);
        sfx('pop');
      }
    }
  }

  updatePriya(time, delta) {
    // she trains beside you on the campus, then is a voice
    const want = this.F.selected && !this.F.docked && this.player.x > px(153) && this.player.x < px(241) && !this.carryingPriya && !this.F.survival;
    if (want && !this.priyaFollow) {
      this.priyaFollow = this.physics.add.image(this.player.x - 50, this.player.y - 10, 'npc-priya').setDepth(D.FOE - 1);
      this.priyaFollow.body.setSize(18, 40);
      this.physics.add.collider(this.priyaFollow, this.solids);
    }
    if (this.priyaFollow) {
      this.priyaFollow.setVisible(want);
      if (!want) return;
      const d = this.player.x - 54 * (this.player.flipX ? -1 : 1) - this.priyaFollow.x;
      this.priyaFollow.setVelocityX(Math.abs(d) > 24 ? Math.sign(d) * Math.min(200, Math.abs(d) * 2) : 0);
      this.priyaFollow.setFlipX(d < 0);
      if (this.priyaFollow.body.blocked.left || this.priyaFollow.body.blocked.right) this.priyaFollow.setVelocityY(-330);
    }
  }
}
