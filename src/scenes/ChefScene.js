import Phaser from 'phaser';
import Player from '../entities/Player.js';
import BaseLevel from './BaseLevel.js';
import { THEMES } from '../themes/index.js';
import { buildChefMap, GATES, DIALOGUES, MOMENTS } from '../data/chefMap.js';
import { freezerValve, ticketRail, piping } from '../systems/puzzles.js';
import { completeDream } from '../utils/save.js';
import { sfx, music } from '../systems/audio.js';

const T = 32;
const overlaps = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);
const px = (tile) => tile * T + T / 2;

export default class ChefScene extends BaseLevel {
  constructor() {
    super('Chef');
  }

  create() {
    this.theme = THEMES.chef;
    const map = buildChefMap();
    const worldW = 320 * T;
    const worldH = 40 * T;

    this.theme.createTextures(this);
    this.theme.drawBackdrop(this, worldW, worldH);

    this.solids = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.orbs = this.physics.add.staticGroup();
    this.flags = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.conveyorGrid = {};
    this.oilGrid = {};
    this.iceGrid = {};
    this.chocoZones = [];

    map.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const cx = px(tx);
        const cy = px(ty);
        if (ch === '#') this.solids.add(this.add.image(cx, cy, 'chef-tile'));
        else if (ch === '*') {
          this.solids.add(this.add.image(cx, cy, 'chef-ice'));
          (this.iceGrid[ty] ||= {})[tx] = true;
        } else if (ch === 'I') {
          this.solids.add(this.add.image(cx, cy, 'chef-oil'));
          (this.oilGrid[ty] ||= {})[tx] = true;
        } else if (ch === '<' || ch === '>') {
          this.solids.add(this.add.image(cx, cy, 'chef-belt').setFlipX(ch === '<'));
          (this.conveyorGrid[ty] ||= {})[tx] = ch === '<' ? -1 : 1;
        } else if (ch === '~') {
          this.add.rectangle(cx, cy, T, T, 0x4a2c1a, 0.9);
          this.add.rectangle(cx, cy - 10, T, 6, 0x6a4028, 0.9);
          this.chocoZones.push(new Phaser.Geom.Rectangle(cx - 16, cy - 10, 32, 42));
        }
      });
    });

    const spawn = { x: px(3), y: px(32) };
    this.player = new Player(this, spawn.x, spawn.y);
    this.setupCommon({ worldW, worldH, levelName: 'DREAM 03 — FIVE-STAR DREAM', spawn });

    this.F = {};
    this.moments = 0;
    this.interacts = [];
    this.carry = null;
    this.carrySprite = null;

    this.buildGates();
    this.buildCheckpoints();
    this.buildAlleyAndDock();
    this.buildDryStore();
    this.buildFreezer();
    this.buildLine();
    this.buildLoft();
    this.buildArena();
    this.buildRoof();
    this.decorate();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.projectiles, this.solids, (pr) => pr.hazard && pr.destroy());
    this.physics.add.overlap(this.player, this.flags, (_p, f) => this.activateCheckpoint(f));
    this.physics.add.overlap(this.player, this.orbs, (_p, o) => this.catchOrb(o));

    this.promptText = this.add
      .text(0, 0, '[E]', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580', backgroundColor: '#14101c' })
      .setOrigin(0.5)
      .setDepth(80)
      .setVisible(false);

    this.setObjective('find the service entrance');
    music.bass();
    this.time.delayedCall(900, async () => {
      await this.dialog.show(DIALOGUES.d0);
      this.setFlag('d0');
      this.setObjective('find saffron → deliver to pass');
    });
  }

  // ---------- infrastructure ------------------------------------------

  setFlag(name) {
    this.F[name] = true;
    this.refreshGates();
  }

  buildGates() {
    this.gates = GATES.map((g) => {
      const tiles = [];
      for (let r = g.rows[0]; r <= g.rows[1]; r++) {
        const img = this.add.image(px(g.col), px(r), 'chef-tile').setTint(0xa05a4a);
        this.solids.add(img);
        tiles.push(img);
      }
      const light = this.add.circle(px(g.col), px(g.rows[0]) - 20, 5, 0xe83a2a).setDepth(20);
      return { ...g, tiles, light, open: false };
    });
  }

  refreshGates() {
    for (const g of this.gates) {
      if (!g.open && g.requires.every((f) => this.F[f])) {
        g.open = true;
        g.light.setFillStyle(0x50c878);
        sfx('clang');
        g.tiles.forEach((t) => {
          if (t.body) t.body.enable = false;
          this.tweens.add({ targets: t, alpha: 0, duration: 400 });
        });
      }
    }
  }

  buildCheckpoints() {
    [
      [23, 33],
      [79, 29],
      [129, 33],
      [132, 33],
      [200, 33],
      [258, 13],
      [266, 33],
    ].forEach(([c, r]) => this.flags.create(px(c), px(r), 'flag'));
  }

  addInteract(x, y, label, cb, { radius = 40, once = true, when = () => true } = {}) {
    const it = { x, y, label, cb, radius, once, when, used: false };
    this.interacts.push(it);
    return it;
  }

  take(id, texKey) {
    this.carry = id;
    if (this.carrySprite) this.carrySprite.destroy();
    this.carrySprite = this.add.image(this.player.x, this.player.y - 42, texKey).setDepth(40);
    sfx('pickup');
  }

  dropCarry() {
    if (!this.carry) return;
    this.floatText(this.player.x, this.player.y - 56, `the ${this.carry} is lost!`, '#e86a6a');
    if (this.carry === 'saffron') this.saffronItem.used = false;
    if (this.carry === 'gold leaf') this.goldItem.used = false;
    if (this.rush && this.rush.active && this.rush.sources[this.carry]) this.rush.sources[this.carry].used = false;
    if (this.service && this.service.order) this.service.plateLost = true;
    this.carry = null;
    if (this.carrySprite) this.carrySprite.destroy();
    this.carrySprite = null;
  }

  onHurtExtra() {
    this.dropCarry();
  }

  moment(id, x, y) {
    this.addInteract(x, y, 'pause', async () => {
      const m = MOMENTS[id];
      this.moments += 1;
      this.setFlag(id);
      sfx(id === 'm2' ? 'purr' : 'chime');
      this.player.controlLockUntil = this.time.now + 5000;
      this.player.body.setVelocity(0, 0);
      const cam = this.cameras.main;
      const t1 = this.add
        .text(cam.width / 2, cam.height - 150, m.sub, { fontFamily: 'monospace', fontSize: '14px', color: '#c8c0b0' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(160)
        .setAlpha(0);
      const t2 = this.add
        .text(cam.width / 2, cam.height - 120, m.text, { fontFamily: 'monospace', fontSize: '17px', color: '#f2e0a0', fontStyle: 'italic' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(160)
        .setAlpha(0);
      this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 900 });
      this.time.delayedCall(5000, () =>
        this.tweens.add({ targets: [t1, t2], alpha: 0, duration: 800, onComplete: () => [t1, t2].forEach((t) => t.destroy()) })
      );
    });
  }

  spawnEnemy(kind, x, y, opts = {}) {
    const tex = { crawler: 'chef-crawler', blob: 'chef-pot', mill: 'chef-mill', meringue: 'chef-meringue', pot: 'chef-pot' }[kind];
    const e = this.enemies.create(x, y, tex);
    e.kind = kind;
    e.patrol = opts.patrol;
    e.speedBase = (opts.speed || 60) * (1 + 0.08 * this.difficulty);
    e.setVelocityX(-e.speedBase);
    if (kind === 'meringue') {
      e.body.setAllowGravity(false);
      e.setVelocity(0, 0);
    }
    if (kind === 'mill') e.sprayNext = this.time.now + 2500;
    return e;
  }

  // ---------- sections -------------------------------------------------

  buildAlleyAndDock() {
    this.carts = [];
    this.time.addEvent({
      delay: 6000,
      loop: true,
      callback: () => {
        if (this.player.x > px(20) && this.player.x < px(50)) sfx('crack');
        if (this.player.x > px(56)) return;
        const cart = this.add.image(px(38), px(33), 'chef-cart').setDepth(15);
        this.carts.push(cart);
        this.tweens.add({
          targets: cart,
          x: px(27),
          duration: 1900,
          onComplete: () => {
            this.carts = this.carts.filter((c) => c !== cart);
            cart.destroy();
          },
        });
      },
    });
    [44, 48, 52].forEach((c) => this.spawnEnemy('crawler', px(c), px(33), { speed: 70 }));
  }

  buildDryStore() {
    // pushable crates of heights 1/2/3 (visualised by scale)
    this.crates = [1, 2, 3].map((h, i) => {
      const c = this.physics.add.image(px(63 + i * 3), px(33) - (h * 32) / 2 + 8, 'chef-crate');
      c.setScale(1, h).setImmovable(false);
      c.body.setDragX(600).setMaxVelocityX(80);
      this.physics.add.collider(c, this.solids);
      this.physics.add.collider(this.player, c);
      this.physics.add.collider(c, this.crates || []);
      return c;
    });
    this.plate = { x: px(72), y: px(33) + 8, pressed: 0 };
    this.add.rectangle(this.plate.x, this.plate.y + 4, 60, 8, 0x8a6844).setDepth(5);
    this.hatchTiles = [];
    for (let r = 30; r <= 33; r++) {
      const img = this.add.image(px(74), px(r), 'chef-tile').setTint(0x7a5a3a);
      this.solids.add(img);
      this.hatchTiles.push(img);
    }
    this.hatchOpenUntil = 0;
    this.moment('m1', px(77), px(33));
  }

  buildFreezer() {
    this.coldMax = 40 - 4 * this.difficulty;
    this.cold = this.coldMax;
    this.coldBar = this.add.rectangle(28, 78, 90, 10, 0x88b8d8).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150).setVisible(false);
    this.coldBarBg = this.add
      .rectangle(28, 78, 90, 10, 0x2a2a34)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(149)
      .setVisible(false);

    if (this.difficulty < 3) {
      this.heatLamp = { x: px(105), y: px(30) };
      this.add.image(this.heatLamp.x, this.heatLamp.y, 'chef-lamp');
      this.add.circle(this.heatLamp.x, this.heatLamp.y + 20, 40, 0xf09040, 0.12);
    }

    this.icicles = [86, 94, 102, 110].map((c) => ({
      img: this.add.image(px(c), px(28), 'chef-icicle'),
      x: px(c),
      state: 'idle',
    }));

    this.jets = [97, 101, 105, 109].map((c, i) => ({
      x: px(c),
      dir: i % 2 ? -1 : 1,
      phase: i * 750,
      plume: this.add.rectangle(px(c), px(32), 64, 60, 0xd8ecf8, 0).setDepth(12),
    }));

    // pans clear a standing player's head — they punish jumps, not existence
    this.pendulums = [
      { ax: px(126), ay: px(20), len: 58, phase: 0, img: this.add.image(0, 0, 'chef-pan').setDepth(16) },
      { ax: px(128), ay: px(24), len: 58, phase: 1.5, img: this.add.image(0, 0, 'chef-pan').setDepth(16) },
      { ax: px(141), ay: px(25), len: 60, phase: 0.7, img: this.add.image(0, 0, 'chef-pan').setDepth(16) },
      { ax: px(146), ay: px(25), len: 60, phase: 2.2, img: this.add.image(0, 0, 'chef-pan').setDepth(16) },
    ];

    this.addInteract(px(115), px(32), 'valve', async () => {
      const ok = await freezerValve(this);
      if (ok) {
        this.setFlag('freezer_valve');
        this.jets.forEach((j) => j.plume.setVisible(false));
        this.jetsOff = true;
        this.floatText(px(115), px(30), 'the compressor sighs and stops.\nthe ice sweats.');
        this.setObjective('climb to the saffron vault');
      }
    }, { once: false, when: () => !this.F.freezer_valve });

    this.saffronItem = this.addInteract(px(127), px(18), 'saffron', async () => {
      this.take('saffron', 'chef-saffron');
      this.setFlag('has_saffron');
      this.setObjective('deliver saffron → risotto station');
      await this.dialog.show(DIALOGUES.d2);
    }, { once: false, when: () => !this.F.has_saffron || (!this.carry && !this.F.saffron_delivered) });
    this.add.image(px(127), px(18), 'chef-saffron').setDepth(3).setAlpha(0.5);
    this.moment('m2', px(91), px(33));
  }

  buildLine() {
    this.flames = [136, 139, 143, 147, 151, 155].map((c, i) => ({
      img: this.add.image(px(c), px(30) + 12, 'chef-flame').setAlpha(0),
      x: px(c),
      baseY: px(30) + 16,
      phase: (i % 3) * 500,
      active: false,
    }));
    this.vents = [149, 152, 155, 177, 179].map((c) => {
      this.add.image(px(c), px(33) + 10, 'chef-vent');
      return { x: px(c), y: px(33), phase: (c % 3) * 600 };
    });

    this.spawnEnemy('blob', px(162), px(33), { speed: 40 });
    this.spawnEnemy('blob', px(165), px(33), { speed: 40 });
    this.spawnEnemy('mill', px(170), px(29), { speed: 50, patrol: [px(168), px(173)] });
    if (this.difficulty >= 1) this.spawnEnemy('mill', px(145), px(30), { speed: 50, patrol: [px(140), px(155)] });

    this.addInteract(px(140), px(30), 'risotto', async () => {
      if (this.carry !== 'saffron') {
        this.floatText(px(140), px(28), 'the risotto waits for saffron…');
        return;
      }
      this.carry = null;
      this.carrySprite.destroy();
      this.carrySprite = null;
      this.F.saffron_delivered = true;
      sfx('deliver');
      await this.dialog.show(DIALOGUES.d3);
      this.setObjective('sort the ticket rail');
    }, { once: false, when: () => !this.F.saffron_delivered });
    this.add.image(px(140), px(30), 'chef-table').setScale(0.7);

    this.addInteract(px(150), px(26), 'tickets', async () => {
      const ok = await ticketRail(this);
      if (ok) {
        this.setFlag('ticket_rail');
        this.startRush();
      }
    }, { once: false, when: () => this.F.saffron_delivered && !this.F.ticket_rail });

    // oven room door
    this.ovenDoor = [];
    this.ovenCycleStart = 0;
    // bread / fish / herbs handled by the rush

    this.moment('m3', px(201), px(33));
    this.addInteract(px(207), px(32), 'dumbwaiter', async () => {
      await this.dialog.show(DIALOGUES.d4);
      this.startLift();
    }, { once: false, when: () => this.F.rush_done && this.lift.state === 'idle' });

    this.lift = {
      state: 'idle',
      img: this.physics.add.image(px(207), px(33) + 6, 'chef-table').setImmovable(true),
    };
    this.lift.img.body.setAllowGravity(false);
    this.physics.add.collider(this.player, this.lift.img);
    this.weights = [
      { y: px(24), phase: 0, img: this.add.rectangle(px(207), px(24), 60, 14, 0x3a3a40).setDepth(16) },
      { y: px(16), phase: 2, img: this.add.rectangle(px(207), px(16), 60, 14, 0x3a3a40).setDepth(16) },
    ];
  }

  startRush() {
    const d = this.difficulty;
    this.rush = {
      active: true,
      total: Math.round(90 * (1 - 0.1 * d)),
      left: Math.round(90 * (1 - 0.1 * d)),
      delivered: 0,
      sources: {
        fish: this.addInteract(px(170), px(30), 'fish', () => this.take('fish', 'chef-cloche'), { once: false, when: () => this.rushWants('fish') }),
        herbs: this.addInteract(px(182), px(23), 'herbs', () => this.take('herbs', 'chef-cloche'), { once: false, when: () => this.rushWants('herbs') }),
        bread: this.addInteract(px(195), px(32), 'bread', () => this.take('bread', 'chef-cloche'), { once: false, when: () => this.rushWants('bread') }),
      },
      done: new Set(),
    };
    this.addInteract(px(158), px(33), 'pass', () => {
      if (['fish', 'herbs', 'bread'].includes(this.carry) && !this.rush.done.has(this.carry)) {
        this.rush.done.add(this.carry);
        sfx('next');
        this.floatText(px(158), px(31), `"NEXT."  (${this.rush.done.size}/3)`);
        this.carry = null;
        this.carrySprite.destroy();
        this.carrySprite = null;
        if (this.rush.done.size >= 3) {
          this.rush.active = false;
          this.setFlag('rush_done');
          this.rushBar && this.rushBar.destroy();
          this.rushBarBg && this.rushBarBg.destroy();
          music.trumpet(false);
          this.setObjective('take the dumbwaiter up');
        }
      }
    }, { once: false, when: () => this.rush && this.rush.active });
    const cam = this.cameras.main;
    this.rushBarBg = this.add.rectangle(cam.width / 2, 24, 300, 14, 0x2a2a34).setScrollFactor(0).setDepth(150);
    this.rushBar = this.add.rectangle(cam.width / 2 - 150, 24, 300, 14, 0xe86a6a).setOrigin(0, 0.5).setScrollFactor(0).setDepth(151);
    music.trumpet();
    this.setObjective('RUSH: fish · herbs · bread → the pass');
    this.floatText(this.player.x, this.player.y - 60, 'SERVICE!');
  }

  rushWants(item) {
    return this.rush && this.rush.active && !this.rush.done.has(item) && this.carry !== item && !this.carry;
  }

  startLift() {
    this.lift.state = 'rising';
    this.lift.img.body.setVelocityY(-55);
    sfx('clang');
    this.setObjective('ride up — dodge the counterweights');
  }

  buildLoft() {
    // dough pedal + platform over first river gap
    this.dough = this.physics.add.image(px(223), px(14), 'chef-dough').setImmovable(true);
    this.dough.body.setAllowGravity(false);
    this.dough.setVisible(false);
    this.dough.body.enable = false;
    this.physics.add.collider(this.player, this.dough);
    this.add.rectangle(px(218), px(13) + 10, 24, 8, 0xd8b858).setDepth(5);
    this.doughUntil = 0;

    this.sugarPlanks = [];
    for (let c = 232; c <= 238; c++) {
      const img = this.physics.add.image(px(c), px(14), 'chef-sugar').setImmovable(true);
      img.body.setAllowGravity(false);
      this.physics.add.collider(this.player, img);
      this.sugarPlanks.push({ img, steppedAt: 0, state: 'solid', x: px(c) });
    }

    this.creamBags = [228, 240].map((c, i) => ({ x: px(c), y: px(8), next: 0, phase: i * 1200 }));
    this.stickies = [];

    [245, 250, 255].forEach((c, i) => this.spawnEnemy('meringue', px(c), px(10 + (i % 3)), {}));

    this.addInteract(px(252), px(13), 'plating table', async () => {
      const ok = await piping(this);
      if (ok) {
        this.setFlag('piping');
        this.floatText(px(254), px(12), 'a drawer clicks open…');
      }
    }, { once: false, when: () => !this.F.piping });

    this.goldItem = this.addInteract(px(254), px(13), 'gold leaf', async () => {
      this.take('gold leaf', 'chef-gold');
      this.setFlag('has_gold_leaf');
      await this.dialog.show(DIALOGUES.d5);
      this.setObjective('bring the gold to the pass — yourself');
    }, { once: false, when: () => this.F.piping && !this.F.has_gold_leaf });
  }

  buildArena() {
    this.stationDefs = [
      { id: 'hot', x: px(271), y: px(30), color: 0xe86a3a },
      { id: 'cold', x: px(279), y: px(30), color: 0x88b8d8 },
      { id: 'dessert', x: px(287), y: px(30), color: 0xe8a8c8 },
    ];
    this.stationDefs.forEach((s) => {
      this.add.image(s.x, s.y, 'chef-table').setScale(0.7);
      this.add.rectangle(s.x, s.y - 34, 30, 10, s.color).setDepth(10);
      this.addInteract(s.x, s.y, s.id, () => {
        if (this.service && this.service.awaiting && !this.carry) this.take(`plate:${s.id}`, 'chef-cloche');
      }, { once: false, when: () => this.service && this.service.awaiting });
    });
    this.aurelio = this.add.image(px(297), px(29), 'portrait-aurelio').setScale(0.9).setTint(0x777788);
    this.passPoint = { x: px(296), y: px(30) };
    this.addInteract(this.passPoint.x, this.passPoint.y, 'the pass', () => this.deliverPlate(), {
      once: false,
      when: () => this.service && this.service.awaiting && this.carry && this.carry.startsWith('plate:'),
    });
    this.service = null;
    this.hotTiles = [];
  }

  startService() {
    const extra = this.difficulty >= 2 ? 1 : 0;
    this.service = {
      wave: 1,
      counts: [3 + extra, 4 + extra, 5 + extra],
      remaining: 3 + extra,
      missed: 0,
      awaiting: false,
      order: null,
      deadline: 0,
      decoy: null,
    };
    music.trumpet();
    this.setObjective('WAVE 1 — read the icon, feed the pass');
    this.time.delayedCall(1200, () => this.nextOrder());
    this.panTimer = this.time.addEvent({ delay: 3000, loop: true, callback: () => this.throwPan() });
    this.hotTimer = this.time.addEvent({ delay: 2500, loop: true, callback: () => this.heatRandomTile() });
  }

  nextOrder() {
    const s = this.service;
    if (!s) return;
    if (s.remaining <= 0) {
      if (s.wave >= 3) {
        this.endService();
        return;
      }
      s.wave += 1;
      s.remaining = s.counts[s.wave - 1];
      this.setObjective(`WAVE ${s.wave} — "${s.wave === 3 ? 'the lights go out' : 'watch for decoys'}"`);
      if (s.wave === 2) {
        this.spawnEnemy('mill', px(282), px(33), { speed: 55, patrol: [px(268), px(292)] });
        this.spawnEnemy('mill', px(274), px(33), { speed: 55, patrol: [px(268), px(292)] });
      }
      if (s.wave === 3) {
        this.darkness = this.add
          .rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.62)
          .setScrollFactor(0)
          .setDepth(85);
        [270, 280, 290].forEach((c) => this.spawnEnemy('crawler', px(c), px(33), { speed: 85 }));
      }
      this.time.delayedCall(1500, () => this.nextOrder());
      return;
    }
    const pick = Phaser.Utils.Array.GetRandom(this.stationDefs);
    s.order = pick.id;
    s.awaiting = true;
    s.deadline = this.time.now + 12000;
    s.plateLost = false;
    sfx('bell');
    if (this.orderIcon) this.orderIcon.destroy();
    this.orderIcon = this.add
      .rectangle(this.passPoint.x, this.passPoint.y - 70, 26, 26, pick.color)
      .setDepth(60)
      .setStrokeStyle(2, 0xf2d580);
    if (this.orderLabel) this.orderLabel.destroy();
    this.orderLabel = this.add
      .text(this.passPoint.x, this.passPoint.y - 96, pick.id.toUpperCase(), { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580' })
      .setOrigin(0.5)
      .setDepth(60);
    // wave 2+: a decoy station glows — the icon is the truth
    if (s.wave >= 2) {
      const wrong = Phaser.Utils.Array.GetRandom(this.stationDefs.filter((d) => d.id !== pick.id));
      if (this.decoyGlow) this.decoyGlow.destroy();
      this.decoyGlow = this.add.circle(wrong.x, wrong.y - 20, 26, 0xf2d580, 0.25).setDepth(9);
    }
  }

  deliverPlate() {
    const s = this.service;
    const got = this.carry.split(':')[1];
    this.carry = null;
    this.carrySprite.destroy();
    this.carrySprite = null;
    if (got === s.order) {
      sfx('next');
      this.floatText(this.passPoint.x, this.passPoint.y - 50, '"Next."', '#c8c0b0');
      s.remaining -= 1;
      s.awaiting = false;
      this.clearOrderUI();
      this.time.delayedCall(1000, () => this.nextOrder());
    } else {
      this.missOrder('wrong dish');
    }
  }

  missOrder(why) {
    const s = this.service;
    s.missed += 1;
    s.awaiting = false;
    this.clearOrderUI();
    sfx('fail');
    this.floatText(this.passPoint.x, this.passPoint.y - 50, `✗ ${why} (${s.missed}/3)`, '#e86a6a');
    if (s.missed >= 3) {
      this.floatText(this.passPoint.x, this.passPoint.y - 80, '"REFIRE."', '#e86a6a');
      s.remaining = s.counts[s.wave - 1];
      s.missed = 0;
      this.player.setPosition(px(266), px(32));
      this.time.delayedCall(1500, () => this.nextOrder());
    } else {
      this.time.delayedCall(1000, () => this.nextOrder());
    }
  }

  clearOrderUI() {
    this.orderIcon && this.orderIcon.destroy();
    this.orderLabel && this.orderLabel.destroy();
    this.decoyGlow && this.decoyGlow.destroy();
    this.orderIcon = this.orderLabel = this.decoyGlow = null;
  }

  async endService() {
    this.service.awaiting = false;
    this.panTimer.remove();
    this.hotTimer.remove();
    this.clearOrderUI();
    music.trumpet(false);
    await this.dialog.show(DIALOGUES.d6);
    if (this.darkness) this.tweens.add({ targets: this.darkness, alpha: 0.25, duration: 2000 });
    this.aurelio.setTint(0x333344);
    this.setFlag('service_survived');
    this.service = null;
    this.setObjective('the roof door is open');
  }

  throwPan() {
    if (!this.service) return;
    const pan = this.projectiles.create(px(299), px(28), 'chef-pan');
    pan.hazard = true;
    pan.setVelocity(-260, -280);
    pan.deathTime = this.time.now + 4000;
    sfx('swing');
  }

  heatRandomTile() {
    if (!this.service) return;
    const c = Phaser.Math.Between(266, 300);
    const glow = this.add.rectangle(px(c), px(33) + 10, T, 8, 0xe83a2a, 0.7).setDepth(8);
    this.time.delayedCall(600, () => {
      const flame = this.add.image(px(c), px(33), 'chef-flame');
      this.hotTiles.push({ rect: new Phaser.Geom.Rectangle(px(c) - 14, px(33) - 30, 28, 40), until: this.time.now + 500 + 600 });
      this.time.delayedCall(500, () => flame.destroy());
      glow.destroy();
    });
  }

  buildRoof() {
    this.add.rectangle(px(312), px(20), 480, 700, 0xf2b878, 0.1).setDepth(2);
    [0, 1, 2].forEach((i) => {
      const gull = this.add.circle(px(310 + i * 3), px(24 - i), 6, 0xe8e4d8).setDepth(3);
      this.tweens.add({ targets: gull, x: gull.x + 90, y: gull.y - 20, duration: 3000 + i * 800, yoyo: true, repeat: -1, ease: 'sine.inout' });
    });
    const o = this.orbs.create(px(314), px(29), 'orb').setDepth(95);
    this.tweens.add({ targets: o, y: px(29) - 10, duration: 1000, yoyo: true, repeat: -1, ease: 'sine.inout' });
  }

  decorate() {
    // ambient steam along the line, flour sacks, dish-pit bubbles
    [140, 148, 156, 168].forEach((c) => {
      const s = this.add.circle(px(c), px(29), 10, 0xd8d8e0, 0.15).setDepth(4);
      this.tweens.add({ targets: s, y: px(26), alpha: 0, duration: 2600, repeat: -1, delay: (c % 5) * 300 });
    });
    [75, 76, 77, 78].forEach((c, i) => this.add.circle(px(c), px(33) + 6, 12 - (i % 2) * 3, 0xe8e0d0, 0.9).setDepth(4));
    [200, 201, 202].forEach((c) => {
      const b = this.add.circle(px(c), px(32), 4, 0xd8ecf8, 0.5).setDepth(4);
      this.tweens.add({ targets: b, y: px(29), alpha: 0, duration: 3000, repeat: -1, delay: (c % 3) * 700 });
    });
    // neon sign + posters in the alley
    this.add.text(px(10), px(28), 'HOTEL MERIDIAN — DELIVERIES', { fontFamily: 'monospace', fontSize: '13px', color: '#8a4a4a' });
    const neon = this.add.text(px(21), px(30), 'OPEN', { fontFamily: 'monospace', fontSize: '15px', color: '#e86a6a' });
    this.tweens.add({ targets: neon, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
  }

  catchOrb(orb) {
    if (this.cardActive || this.orbCaught) return;
    this.orbCaught = true;
    completeDream('chef');
    music.stop();
    music.soloPiano();
    sfx('orb');
    this.tweens.add({ targets: orb, scale: 2.5, alpha: 0, duration: 700 });
    const momentMsg =
      this.moments === 0
        ? "You didn't notice anything on the way."
        : this.moments < 3
          ? 'You noticed a little.'
          : 'You noticed. Maybe that was the point.';
    this.showCard(['Five stars.', '', 'Was it enough?', '', momentMsg, '', '[X] Return to Crossroads Station'], () => {
      music.stop();
      this.scene.start('Select');
    });
  }

  // ---------- update ---------------------------------------------------

  update(time, delta) {
    if (this.handleModalUpdate()) return;
    const p = this.player;
    const pb = p.getBounds();
    const dt = delta / 1000;
    const footTx = Math.floor(p.x / T);
    const footTy = Math.floor((p.y + p.body.height / 2 + 6) / T);

    p.slippery = false;
    if (this.iceGrid[footTy]?.[footTx]) {
      p.slippery = true;
      p.slipFactor = this.F.freezer_valve ? 0.3 : 0.04;
    } else if (this.oilGrid[footTy]?.[footTx]) {
      p.slippery = true;
      p.slipFactor = 0.08;
    }
    p.update(time, delta);
    if (p.body.blocked.down) {
      const dir = this.conveyorGrid[footTy]?.[footTx];
      if (dir) p.body.velocity.x += dir * 90;
    }
    if (this.stickies.some((s) => time < s.until && overlaps(pb, s.rect))) {
      p.body.velocity.x *= 0.5;
    }
    if (this.carrySprite) this.carrySprite.setPosition(p.x, p.y - 42);

    // ladle
    if (Phaser.Input.Keyboard.JustDown(p.keys.X)) {
      const hit = p.swingLadle();
      if (hit) {
        this.enemies.children.iterate((e) => {
          if (!e || !overlaps(hit, e.getBounds())) return;
          if (e.kind === 'blob' && !e.isSmall) {
            sfx('squish');
            const { x, y } = e;
            e.destroy();
            [-1, 1].forEach((d) => {
              const s = this.spawnEnemy('blob', x + d * 14, y, { speed: 90 });
              s.isSmall = true;
              s.setScale(0.55);
            });
          } else {
            sfx('pop');
            e.destroy();
          }
        });
      }
    }

    // interactions
    let nearest = null;
    for (const it of this.interacts) {
      if (it.used && it.once) continue;
      if (!it.when()) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, it.x, it.y);
      if (d < it.radius && (!nearest || d < nearest.d)) nearest = { it, d };
    }
    if (nearest) {
      this.promptText.setVisible(true).setPosition(nearest.it.x, nearest.it.y - 34);
      if (Phaser.Input.Keyboard.JustDown(p.keys.E)) {
        nearest.it.used = true;
        nearest.it.cb();
      }
    } else {
      this.promptText.setVisible(false);
    }

    this.updateAlley(pb);
    this.updateDryStore(time);
    this.updateFreezer(time, dt, pb);
    this.updateLine(time, pb);
    this.updateLift(time, pb);
    this.updateLoft(time, pb);
    this.updateArenaAndService(time, pb);
    this.updateEnemies(time, pb);

    // chocolate rivers
    for (const z of this.chocoZones) {
      if (overlaps(pb, z)) {
        this.hurt();
        break;
      }
    }
    // service trigger on arena entry
    if (!this.service && !this.F.service_survived && this.F.has_gold_leaf && p.x > px(266) && p.y > px(20)) {
      this.startService();
    }
    if (p.y > this.worldH + 60) {
      p.setPosition(this.checkpoint.x, this.checkpoint.y);
      p.setVelocity(0, 0);
      this.hurt();
    }
  }

  updateAlley(pb) {
    for (const cart of this.carts) {
      if (overlaps(pb, cart.getBounds())) {
        this.hurt();
        break;
      }
    }
  }

  updateDryStore(time) {
    const onPlate = this.crates.filter(
      (c) => Math.abs(c.x - this.plate.x) < 40 && Math.abs(c.y - this.plate.y) < 60
    ).length;
    if (onPlate >= 2) this.hatchOpenUntil = time + 4000;
    const open = time < this.hatchOpenUntil;
    this.hatchTiles.forEach((t) => {
      t.setAlpha(open ? 0.25 : 1);
      if (t.body) t.body.enable = !open;
    });
    if (open && !this.F.crates && this.player.x > px(74)) {
      this.setFlag('crates');
      this.floatText(this.player.x, this.player.y - 50, 'through the hatch!');
    }
  }

  updateFreezer(time, dt, pb) {
    const inZone = this.player.x > px(81) && this.player.x < px(131);
    this.coldBar.setVisible(inZone);
    this.coldBarBg.setVisible(inZone);
    if (inZone) {
      let drain = dt;
      if (this.heatLamp && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.heatLamp.x, this.heatLamp.y) < 70) {
        drain = -dt * 6;
      }
      this.cold = Phaser.Math.Clamp(this.cold - drain, 0, this.coldMax);
      this.coldBar.width = (this.cold / this.coldMax) * 90;
      if (this.cold <= 0) {
        this.cold = this.coldMax * 0.6;
        this.hurt();
      }
    }

    for (const ic of this.icicles) {
      if (ic.state === 'idle' && Math.abs(this.player.x - ic.x) < 22 && this.player.y > px(28)) {
        ic.state = 'shaking';
        sfx('crack');
        this.tweens.add({ targets: ic.img, x: ic.x + 2, duration: 60, yoyo: true, repeat: 7 });
        this.time.delayedCall(500, () => {
          ic.state = 'falling';
          this.tweens.add({
            targets: ic.img,
            y: px(33),
            duration: 450,
            ease: 'quad.in',
            onComplete: () => {
              sfx('snap');
              ic.img.setVisible(false);
              ic.state = 'done';
              this.time.delayedCall(4000, () => {
                ic.img.setPosition(ic.x, px(28)).setVisible(true);
                ic.state = 'idle';
              });
            },
          });
        });
      }
      if (ic.state === 'falling' && overlaps(pb, ic.img.getBounds())) this.hurt();
    }

    if (!this.jetsOff) {
      for (const j of this.jets) {
        const t = (time + j.phase) % 3000;
        const active = t > 2000;
        j.plume.setAlpha(active ? 0.35 : t > 1700 ? 0.12 : 0);
        if (active && Math.abs(this.player.x - j.x) < 40 && this.player.y > px(29)) {
          this.player.body.velocity.x += j.dir * 26;
        }
      }
    }

    for (const pd of this.pendulums) {
      const a = Math.sin(time / 700 + pd.phase) * 1.1;
      pd.img.setPosition(pd.ax + Math.sin(a) * pd.len, pd.ay + Math.cos(a) * pd.len);
      pd.img.setRotation(-a);
      if (overlaps(pb, pd.img.getBounds())) this.hurt();
    }
  }

  updateLine(time, pb) {
    const d = this.difficulty;
    const period = 2000 - 150 * d;
    for (const f of this.flames) {
      const t = (time + f.phase) % period;
      const warnAt = period * 0.5;
      const fireAt = period * 0.7;
      if (t < warnAt) {
        f.img.setAlpha(0);
        f.active = false;
      } else if (t < fireAt) {
        f.img.setAlpha(0.5).setScale(1, 0.4);
        f.img.y = f.baseY - 8;
        f.active = false;
        if (t - warnAt < 40) sfx('click');
      } else {
        f.img.setAlpha(1).setScale(1, 1);
        f.img.y = f.baseY - 20;
        f.active = true;
      }
      if (f.active && overlaps(pb, new Phaser.Geom.Rectangle(f.x - 14, f.baseY - 40, 28, 40))) this.hurt();
    }

    for (const v of this.vents) {
      const t = (time + v.phase) % 1800;
      const active = t > 1200;
      if (active && Math.abs(this.player.x - v.x) < 20 && Math.abs(this.player.y - v.y) < 30) {
        this.player.body.setVelocityY(-760);
        sfx('steam');
      }
      if (active && (time + v.phase) % 200 < 30) {
        const plume = this.add.circle(v.x, v.y - 10, 8, 0xd8ecf8, 0.4);
        this.tweens.add({ targets: plume, y: v.y - 90, alpha: 0, duration: 500, onComplete: () => plume.destroy() });
      }
    }

    // oven door cycle: open 4s of every 12s
    const cycle = time % 12000;
    const doorOpen = cycle < 4000;
    if (!this.ovenDoorTiles) {
      this.ovenDoorTiles = [];
      for (let r = 31; r <= 33; r++) {
        const img = this.add.image(px(191), px(r), 'chef-tile').setTint(0x9a6a4a);
        this.solids.add(img);
        this.ovenDoorTiles.push(img);
      }
    }
    this.ovenDoorTiles.forEach((tImg) => {
      tImg.setAlpha(doorOpen ? 0.2 : 1);
      if (tImg.body) tImg.body.enable = !doorOpen;
    });
    const insideOven = this.player.x > px(191) && this.player.x < px(198) && this.player.y > px(29);
    if (insideOven) {
      this.ovenSince = this.ovenSince || time;
      if (time - this.ovenSince > 3000 && time - (this.ovenLastBurn || 0) > 1000) {
        this.ovenLastBurn = time;
        this.hurt();
      }
    } else {
      this.ovenSince = 0;
    }

    if (this.rush && this.rush.active) {
      this.rush.left -= 0.016;
      this.rushBar.width = Math.max(0, (this.rush.left / this.rush.total) * 300);
      if (this.rush.left <= 0) {
        this.rush.left = this.rush.total;
        sfx('fail');
        this.floatText(this.player.x, this.player.y - 60, '"REFIRE." — the clock resets,\nyour deliveries stand.', '#e86a6a');
        this.player.setPosition(px(132), px(32));
        this.player.setVelocity(0, 0);
      }
    }
  }

  updateLift(time, pb) {
    const lift = this.lift;
    for (const w of this.weights) {
      w.img.x = px(207) + Math.sin(time / 900 + w.phase) * 70;
      if (overlaps(pb, w.img.getBounds())) this.hurt();
    }
    if (lift.state === 'rising') {
      if (lift.img.y <= px(11)) {
        lift.img.body.setVelocityY(0);
        lift.state = 'top';
        lift.topAt = time;
        this.floatText(lift.img.x, lift.img.y - 40, 'the cable frays — JUMP!', '#e86a6a');
        sfx('crack');
      }
    } else if (lift.state === 'top') {
      if (time - lift.topAt > 2600) {
        lift.state = 'falling';
        sfx('snap');
        this.cameras.main.shake(300, 0.008);
        lift.img.body.setVelocityY(520);
      }
    } else if (lift.state === 'falling') {
      if (lift.img.y >= px(33)) {
        lift.img.setY(px(33) + 6);
        lift.img.body.setVelocityY(0);
        lift.state = 'idle';
      }
    }
  }

  updateLoft(time, pb) {
    // dough pedal
    if (Math.abs(this.player.x - px(218)) < 18 && Math.abs(this.player.y - px(13)) < 30 && this.player.body.blocked.down) {
      if (time > this.doughUntil - 5800) {
        this.doughUntil = time + 6000;
        this.dough.setVisible(true).setScale(0.3);
        this.dough.body.enable = true;
        this.tweens.add({ targets: this.dough, scaleX: 1.4, scaleY: 1, duration: 400 });
        sfx('squish');
      }
    }
    if (this.dough.body.enable && time > this.doughUntil) {
      this.dough.body.enable = false;
      this.tweens.add({ targets: this.dough, scaleX: 0.2, scaleY: 0.2, duration: 300, onComplete: () => this.dough.setVisible(false) });
    }

    for (const s of this.sugarPlanks) {
      if (s.state === 'solid' && this.player.body.blocked.down && Math.abs(this.player.x - s.x) < 22 && Math.abs(this.player.y + 24 - px(14)) < 20) {
        if (!s.steppedAt) {
          s.steppedAt = time;
          this.tweens.add({ targets: s.img, y: px(14) + 2, duration: 80, yoyo: true, repeat: 3 });
          sfx('crack');
        }
      }
      if (s.state === 'solid' && s.steppedAt && time - s.steppedAt > 1500) {
        s.state = 'gone';
        sfx('snap');
        s.img.setVisible(false);
        s.img.body.enable = false;
        this.time.delayedCall(3000, () => {
          s.state = 'solid';
          s.steppedAt = 0;
          s.img.setVisible(true);
          s.img.body.enable = true;
        });
      }
    }

    for (const bag of this.creamBags) {
      if (time > bag.next) {
        bag.next = time + 2500 + bag.phase / 2;
        const blob = this.projectiles.create(bag.x, bag.y + 10, 'chef-cream');
        blob.hazard = false;
        blob.creamAt = px(14) - 20;
        blob.deathTime = time + 3000;
        blob.isCream = true;
      }
    }
    this.projectiles.children.iterate((pr) => {
      if (!pr) return;
      if (pr.isCream && pr.y >= px(14) - 22) {
        this.stickies.push({ rect: new Phaser.Geom.Rectangle(pr.x - 18, px(14) - 30, 36, 20), until: time + 4000 });
        const splat = this.add.image(pr.x, px(14) - 18, 'chef-cream').setAlpha(0.8).setScale(1.4, 0.6);
        this.time.delayedCall(4000, () => splat.destroy());
        pr.destroy();
        return;
      }
      if (pr.deathTime && time > pr.deathTime) {
        pr.destroy();
        return;
      }
      if (pr.active && overlaps(this.player.getBounds(), pr.getBounds()) && pr.hazard) {
        pr.destroy();
        this.hurt();
      }
    });
    this.stickies = this.stickies.filter((s) => time < s.until);
  }

  updateArenaAndService(time, pb) {
    if (!this.service) return;
    const s = this.service;
    if (s.awaiting) {
      if (this.orderIcon) {
        const frac = Phaser.Math.Clamp((s.deadline - time) / 12000, 0, 1);
        this.orderIcon.setScale(1, Math.max(0.2, frac));
      }
      if (time > s.deadline) this.missOrder('died under the lamp');
      if (s.plateLost) {
        s.plateLost = false;
        this.missOrder('the plate hit the floor');
      }
    }
    for (const h of this.hotTiles) {
      if (time < h.until && overlaps(pb, h.rect)) {
        this.hurt();
        break;
      }
    }
    this.hotTiles = this.hotTiles.filter((h) => time < h.until);
  }

  updateEnemies(time, pb) {
    this.enemies.children.iterate((e) => {
      if (!e || !e.body) return;
      if (e.kind === 'meringue') {
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 300) e.setVelocity((dx / dist) * 40, (dy / dist) * 40);
        if (overlaps(pb, e.getBounds())) {
          this.player.body.velocity.x += (dx > 0 ? -1 : 1) * 160;
          this.player.body.velocity.y -= 80;
        }
        return;
      }
      if (e.kind === 'mill') {
        if (e.patrol) {
          if (e.x < e.patrol[0]) e.setVelocityX(e.speedBase);
          if (e.x > e.patrol[1]) e.setVelocityX(-e.speedBase);
        }
        if (time > e.sprayNext && Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < 90) {
          e.sprayNext = time + 4000;
          const cloud = this.add.circle(e.x, e.y - 10, 46, 0xd8f0a0, 0.35).setDepth(18);
          this.tweens.add({ targets: e, angle: 15, duration: 100, yoyo: true, repeat: 3 });
          this.time.delayedCall(2000, () => cloud.destroy());
          if (Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < 80) {
            this.player.reversedUntil = time + 2000;
            this.floatText(this.player.x, this.player.y - 56, 'pepper! controls reversed!', '#d8f0a0');
          }
        }
      }
      // walkers: turn at walls/edges; stomp check
      const dir = Math.sign(e.body.velocity.x) || -1;
      if (e.body.blocked.left) e.setVelocityX(e.speedBase);
      else if (e.body.blocked.right) e.setVelocityX(-e.speedBase);
      if (overlaps(pb, e.getBounds())) {
        if (this.player.body.velocity.y > 60 && this.player.y < e.y - 8) {
          sfx('squish');
          e.destroy();
          this.player.body.setVelocityY(-350);
        } else {
          this.hurt();
        }
      }
    });
  }
}
