import Phaser from 'phaser';
import Player from '../entities/Player.js';
import BaseLevel from './BaseLevel.js';
import { THEMES } from '../themes/index.js';
import { M_DIALOGUES, M_MOMENTS, SONGS, noRests, ZONES, GROUND } from '../data/musicianData.js';
import RoomBuilder from '../builders/RoomBuilder.js';
import Parallax from '../builders/parallax.js';
import musicianRooms from '../data/musician/rooms.js';
import musicianTiles from '../data/musician/tiles.js';
import Phrases from '../systems/rhythm.js';
import { tuning, playTheRoom, theMix } from '../systems/puzzles.js';
import { completeDream } from '../utils/save.js';
import { sfx, music, sting, trumpet, bassNote } from '../systems/audio.js';

const T = 32;
const px = (t) => t * T + T / 2;
const overlaps = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);

export default class MusicianScene extends BaseLevel {
  constructor() {
    super('Musician');
  }

  create() {
    this.theme = THEMES.musician;
    this.theme.createTextures(this);

    // D2/D3 — generic RoomBuilder terrain: autotiled, supported, with slopes,
    // stairs, one-ways and the climbable fire-escape wall.
    const built = RoomBuilder.build(this, musicianRooms, musicianTiles);
    this.built = built;
    const worldW = built.worldW;
    const worldH = built.worldH;
    // D7 — three parallax layers + foreground + per-room landmark
    this.parallax = new Parallax(this, built.rooms);
    for (const [c0, c1, color, alpha] of ZONES) {
      this.add.rectangle(((c0 + c1) / 2) * T, worldH / 2, (c1 - c0) * T, worldH, color, alpha).setDepth(2);
    }

    this.solids = built.solids;
    this.oneWays = built.oneWays;
    this.slopeGrid = built.slopeGrid;
    this.climbGrid = built.climbGrid;

    const spawn = { x: px(3), y: px(GROUND - 2) };
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,X,E,Q,F');
    this.setupCommon({ worldW, worldH, levelName: 'DREAM — THE BIG STAGE', spawn });

    this.F = {};
    this.moments = 0;
    this.interacts = [];
    this.coins = 0;
    this.breath = 100;
    this.nerve = 0;
    this.gig = null;
    this.bridges = [];
    this.anchors = [];
    this.resonants = [];
    this.wisps = this.physics.add.group({ allowGravity: false });
    this.walkers = this.physics.add.group();
    this.bottles = this.physics.add.group();
    this.hasCase = true;
    this.caseSprite = null;
    this.caseDown = null;

    this.flags = this.physics.add.staticGroup();
    this.orbs = this.physics.add.staticGroup();
    built.objects
      .filter((o) => o.type === 'checkpoint')
      .forEach((c) => this.flags.create(c.wx, c.wy, 'flag'));

    this.buildGates();
    this.buildDay0();
    this.buildDay1();
    this.buildDay2();
    this.buildDay3();
    this.buildDay4();
    this.buildDay5();
    this.buildDay6();
    this.buildDay7();

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.oneWays);
    this.physics.add.collider(this.walkers, this.solids);
    this.physics.add.collider(this.bottles, this.solids, (b) => b.destroy());
    this.physics.add.overlap(this.player, this.flags, (_p, f) => this.activateCheckpoint(f));
    this.physics.add.overlap(this.player, this.orbs, (_p, o) => this.catchOrb(o));
    this.physics.add.overlap(this.player, this.bottles, (_p, b) => {
      b.destroy();
      this.addNerve(12);
      this.hurt();
    });
    this.physics.add.overlap(this.player, this.walkers, () => this.hurt());
    this.physics.add.overlap(this.player, this.wisps, () => this.addNerve(6));

    // HUD: breath + nerve + coins
    this.breathBarBg = this.add.rectangle(28, 78, 90, 8, 0x2a2a34).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150);
    this.breathBar = this.add.rectangle(28, 78, 90, 8, 0x88b8d8).setOrigin(0, 0.5).setScrollFactor(0).setDepth(151);
    this.nerveBar = this.add.rectangle(28, 90, 90, 8, 0xe86a6a).setOrigin(0, 0.5).setScrollFactor(0).setDepth(151).setVisible(false);
    this.coinText = this.add
      .text(126, 78, '', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580' })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(150);
    this.promptText = this.add
      .text(0, 0, '[E]', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580', backgroundColor: '#14101c' })
      .setOrigin(0.5)
      .setDepth(80)
      .setVisible(false);
    this.hintText = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height - 24, '[Q] play · [E] interact/case · [F] call Nia', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#6a6478',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(150);

    this.setObjective('get to The Blue Cellar');
    music.bass();
    this.time.delayedCall(900, async () => {
      await this.dialog.show(M_DIALOGUES.d0);
      this.setFlag('d0');
    });
  }

  // ------- shared plumbing (gates/interacts/moments/case) ---------------

  setFlag(name) {
    this.F[name] = true;
    if (this.F.choice === 'tally' || this.F.choice === 'nia') {
      this.F.choice_made = true;
      this.F.choice_final = true;
    } else if (this.F.choice === 'think') {
      this.F.choice_made = true;
    }
    this.refreshGates();
  }

  // D2/D4 — gates from the room object lists.
  buildGates() {
    this.gates = this.built.objects
      .filter((o) => o.type === 'gate')
      .map((g) => {
        const tiles = [];
        for (let r = g.ty; r < g.ty + (g.h || 5); r++) {
          const img = this.add.image(g.wx, px(r), `${musicianTiles.key}_s_15_${(g.tx * 7 + r * 13) % 3}`).setTint(0x6a4a5a);
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
        sting.gate(); // D7: distant clank, heard level-wide
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

  moment(id, x, y) {
    this.addInteract(x, y, 'pause', () => {
      const m = M_MOMENTS[id];
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
    });
  }

  resonant(x, y, texture, onRing, { once = true, label = null } = {}) {
    const img = texture ? this.add.image(x, y, texture).setDepth(6) : null;
    const glow = this.add.circle(x, y, 20, 0xf2d580, 0).setDepth(5);
    this.resonants.push({ x, y, img, glow, onRing, once, used: false });
    return img;
  }

  addNerve(amt) {
    if (!this.gig) return;
    this.nerve = Phaser.Math.Clamp(this.nerve + amt, 0, 100);
    if (this.nerve >= 100) {
      this.nerve = 70;
      this.player.controlLockUntil = this.time.now + 1500;
      this.player.body.setVelocity(0, 0);
      this.floatText(this.player.x, this.player.y - 60, '…frozen. the crowd murmurs.', '#e86a6a');
      sfx('fail');
    }
  }

  // ------- day builders -------------------------------------------------

  buildDay0() {
    this.add.text(px(12), px(28), 'MERIDIAN JAZZ FESTIVAL — SAT\n     THE  BIG  STAGE', { fontFamily: 'monospace', fontSize: '15px', color: '#f2d580', align: 'center' }).setDepth(4);
    this.resonant(px(8), px(34), 'mus-lamp', () => {
      sfx('bell');
      this.floatText(px(8), px(33), 'the horn in the window rings back');
    });
  }

  buildDay1() {
    this.anchors.push({ x: px(38), y: px(31), dir: 1, len: 5 * T, row: 29 });
    this.hecklers = [
      { x: px(36), y: px(27), next: 0, img: this.add.image(px(36), px(27), 'npc-roadie').setDepth(10) },
      { x: px(43), y: px(27), next: 0, img: this.add.image(px(43), px(27), 'npc-roadie').setDepth(10) },
    ];
    // dead neon → ladder
    this.neonLadder = [];
    this.resonant(px(44), px(31), 'mus-lamp', () => {
      sfx('buzz');
      this.floatText(px(44), px(30), 'the neon hums on — a ladder!');
      [34, 32, 30].forEach((r) => {
        const step = this.add.image(px(45), px(r), 'mus-key');
        this.solids.add(step);
        this.neonLadder.push(step);
      });
    });
    this.pendulum = { ax: px(52), ay: px(28), len: 62, img: this.add.image(0, 0, 'mus-lamp').setDepth(16) };
    this.add.image(px(56), px(35), 'npc-delphine').setDepth(10);
    this.addInteract(px(56), px(35), 'Delphine', () => this.dialog.show(M_DIALOGUES.d1));
    // the room
    this.chairs = [];
    for (let c = 60; c <= 68; c += 1) {
      this.chairs.push(this.add.image(px(c), px(35) + 6, 'mus-chair').setDepth(6).setAlpha(0.8));
    }
    this.ray = this.add.image(px(62), px(35), 'npc-ray').setDepth(10);
    this.addInteract(px(70), px(35), 'take the stage', () => this.gigCellar(), { once: false, when: () => !this.F.cellar_gig });
    this.moment('m1', px(72), px(33));
    this.interacts[this.interacts.length - 1].when = () => this.F.cellar_gig && !this.F.m1;
    // alley scalper
    this.scalper = null;
  }

  async gigCellar() {
    this.setObjective('SONG 1 — nine chairs');
    const wispsAt = [px(72), px(70)];
    let spawned = false;
    const passes = await this.runGig({
      phrases: SONGS.gig1,
      bpm: 96,
      label: 'The Blue Cellar — open mic',
      onPhrase: (ok, i) => {
        if (ok && this.chairs[i]) this.chairs[i].setTint(0xf2d580);
        if (i === 2 && !spawned) {
          spawned = true;
          wispsAt.forEach((x) => this.spawnWisp(x, px(30)));
        }
      },
    });
    if (passes >= 4) {
      this.cameras.main.zoomTo(1.15, 600, 'Sine.easeOut', false, (c, p) => {
        if (p === 1) this.cameras.main.zoomTo(1, 800);
      });
      trumpet(7, 1.4, 0.35);
      this.lives = this.maxLives;
      this.updateHearts();
      this.floatText(px(70), px(31), 'nine people clap.\nthe bartender has stopped washing glasses.\nRay has not looked up.');
      await this.dialog.show(M_DIALOGUES.d2);
      this.setFlag('cellar_gig');
      this.setObjective('the alley — watch your case');
      this.spawnScalper(px(80));
    } else {
      this.floatText(px(70), px(31), 'scattered claps. try the set again.', '#e86a6a');
    }
  }

  spawnWisp(x, y) {
    const w = this.wisps.create(x, y, 'mus-wisp');
    w.setDepth(14);
    return w;
  }

  spawnScalper(x) {
    this.scalper = this.physics.add.image(x, px(34), 'npc-scalper').setDepth(12);
    this.scalper.state = 'lurk';
    this.physics.add.collider(this.scalper, this.solids);
  }

  buildDay2() {
    this.peds = [];
    this.pedNext = 0;
    this.copCooldown = 0;
    this.kid = null;
    this.buskPhrase = null;
    // rooftop hazards
    [112, 124].forEach((c) => {
      this.add.image(px(c), px(25) + 10, 'chef-vent');
    });
    this.roofVents = [112, 124].map((c) => ({ x: px(c), y: px(25), phase: c * 37 }));
    this.slates = [];
    for (let c = 117; c <= 119; c++) {
      const img = this.physics.add.image(px(c), px(26), 'mus-key').setImmovable(true);
      img.body.setAllowGravity(false);
      this.physics.add.collider(this.player, img);
      this.slates.push({ img, x: px(c), steppedAt: 0, state: 'solid' });
    }
    [115, 127, 134].forEach((c) => {
      const w = this.walkers.create(px(c), px(25), 'mus-walker');
      w.setVelocityX(-40);
      w.homeX = px(c);
    });
    this.anchors.push({ x: px(120), y: px(25), dir: 1, len: 4 * T, row: 26 });
    this.anchors.push({ x: px(128), y: px(25), dir: 1, len: 4 * T, row: 26 });
    // repair shop
    this.addInteract(px(145), px(35), "Old Sol's bench", async () => {
      const ok = await tuning(this);
      if (ok) {
        this.setFlag('valve_fixed');
        await this.dialog.show(M_DIALOGUES.d3);
        this.floatText(px(148), px(33), 'a bass note answers from across the street…');
        this.niaStreet = this.add.image(px(148), px(35), 'npc-nia').setDepth(10);
        bassNote(2, 0.8);
      }
    }, { once: false, when: () => !this.F.valve_fixed });
    this.addInteract(px(148), px(35), 'Nia', async () => {
      await this.dialog.show(M_DIALOGUES.d4);
      this.setFlag('met_nia');
      this.setObjective('basement, Thursday');
    }, { once: false, when: () => this.F.valve_fixed && !this.F.met_nia });
  }

  buildDay3() {
    this.marcus = this.add.image(px(158), px(35), 'npc-marcus').setDepth(10);
    this.addInteract(px(158), px(35), 'Marcus', () => this.dialog.show(M_DIALOGUES.d5));
    // heater puzzle: both plates weighted, then play the cue
    this.plateA = { x: px(162), on: false };
    this.plateB = { x: px(168), on: false };
    this.add.rectangle(px(162), px(35) + 12, 40, 6, 0xd8b858).setDepth(5);
    this.add.rectangle(px(168), px(35) + 12, 40, 6, 0xd8b858).setDepth(5);
    this.addInteract(px(165), px(35), 'the cue', async () => {
      if (!(this.plateA.on && this.plateB.on)) {
        this.floatText(px(165), px(33), 'both plates need weight —\nJo on one, Nia [F] on the other');
        return;
      }
      const passes = await this.runGig({ phrases: [SONGS.gig2[0]], bpm: 104, label: 'cue Marcus', quiet: true });
      if (passes === 1) {
        sfx('clang');
        this.floatText(px(165), px(32), 'Marcus hits the breaker — lights stay ON');
        this.setFlag('rehearsal');
      }
    }, { radius: 150, once: false, when: () => this.F.met_nia && !this.F.rehearsal });
    // boiler wisps + bass grate
    [px(183), px(186), px(188)].forEach((x, i) => this.spawnWisp(x, px(26 - i * 2)));
    this.addInteract(px(188), px(23), 'bass-clef grate', () => {
      if (this.niaNear()) {
        bassNote(1, 0.8);
        this.floatText(px(188), px(21), 'the grate shudders open');
        this.setFlag('grate_open');
      } else {
        this.floatText(px(188), px(21), 'too low for a trumpet — call Nia [F]');
      }
    }, { once: false, when: () => !this.F.grate_open });
    // jam night
    this.addInteract(px(196), px(35), 'jam night', () => this.gigJam(), { once: false, when: () => this.F.rehearsal && !this.F.jam_done });
    this.rayJam = this.add.image(px(200), px(35), 'npc-ray').setDepth(10);
    this.addInteract(px(206), px(35), 'the dark stage', async () => {
      const ok = await playTheRoom(this);
      if (ok) {
        this.setFlag('ray_lesson');
        this.floatText(px(206), px(33), 'from now on: rests are part of the phrase.\n(hollow icon = DON\'T play)');
        this.setObjective('the road — three towns');
      }
    }, { once: false, when: () => this.F.jam_done && !this.F.ray_lesson });
    this.moment('m3', px(208), px(35));
    this.interacts[this.interacts.length - 1].when = () => this.F.jam_done && !this.F.m3;
  }

  async gigJam() {
    this.setObjective('jam night — twenty people');
    let rayGone = false;
    const passes = await this.runGig({
      phrases: SONGS.gig2,
      bpm: 104,
      label: 'The Blue Cellar — jam night',
      onPhrase: (_ok, i) => {
        if (i === 2 && !rayGone) {
          rayGone = true;
          this.tweens.add({ targets: this.rayJam, x: px(204), alpha: 0, duration: 1500 });
          this.nerve = Math.max(this.nerve, 60);
          this.floatText(px(200), px(33), 'Ray gets up.\nHe walks out mid-song.', '#e86a6a');
        }
      },
    });
    if (passes >= 4) {
      this.setFlag('jam_done');
      await this.dialog.show(M_DIALOGUES.d6);
      this.setObjective('the alley — understand him');
    } else {
      this.floatText(px(196), px(33), 'the song falls apart. again.', '#e86a6a');
    }
  }

  buildDay4() {
    // pavilion
    this.lanterns = [];
    for (let c = 213; c <= 227; c += 2) {
      this.lanterns.push(this.add.image(px(c), px(30), 'mus-lantern').setDepth(6).setAlpha(0.35));
    }
    this.addInteract(px(218), px(35), 'Riverside Pavilion', () => this.gigPavilion(), { once: false, when: () => this.F.ray_lesson && !this.F.pavilion_done });
    // saltbox
    this.add.text(px(233), px(32), 'BAND CANCELLED\n   TV NIGHT', { fontFamily: 'monospace', fontSize: '13px', color: '#a05a4a' }).setDepth(6);
    this.dogCalmUntil = 0;
    this.dog = this.resonant(px(238), px(35), 'mus-walker', () => {
      this.dogCalmUntil = this.time.now + 10000;
      this.floatText(px(238), px(33), 'the dog settles.');
    }, { once: false });
    this.manager = { x0: px(240), x1: px(246), img: this.add.image(px(240), px(35), 'npc-roadie').setDepth(11), dir: 1 };
    this.managerCone = this.add.rectangle(px(240), px(34), 90, 80, 0xf2e0a0, 0.12).setDepth(10);
    this.addInteract(px(247), px(34), 'office vent', () => {
      if (this.niaNear()) {
        bassNote(0, 0.9);
        this.setFlag('office_open');
      } else this.floatText(px(247), px(32), 'bass-clef vent — call Nia [F]');
    }, { once: false, when: () => this.F.pavilion_done && !this.F.office_open });
    this.addInteract(px(248), px(34), 'the deposit', () => {
      this.floatText(px(248), px(31), 'the envelope is empty.\n\n(the rain keeps raining)', '#8a8478');
      this.setFlag('saltbox_done');
    }, { once: false, when: () => this.F.office_open && !this.F.saltbox_done });
    // highway
    this.anchors.push({ x: px(263), y: px(34), dir: 1, len: 3 * T, row: 35 });
    this.anchors.push({ x: px(266), y: px(34), dir: 1, len: 3 * T, row: 35 });
    this.truckNext = 0;
    this.addInteract(px(275), px(35), 'shelter under the bridge', async () => {
      const choice = await this.dialog.show(M_DIALOGUES.d8);
      this.F.marcus_left = choice || 'silent';
      await this.dialog.show(M_DIALOGUES[`d8_${this.F.marcus_left}`]);
      this.setFlag('d8_done');
      if (this.F.marcus_left !== 'stay') {
        this.tweens.add({ targets: this.marcusRoad, x: px(255), alpha: 0, duration: 3000 });
      }
    }, { once: false, when: () => this.F.saltbox_done && !this.F.d8_done });
    this.marcusRoad = this.add.image(px(273), px(35), 'npc-marcus').setDepth(10).setVisible(false);
    this.resonant(px(288), px(34), 'mus-phone', () => {
      sfx('bell');
      this.floatText(px(288), px(32), 'it rings. weirdly.\nno one answers.');
      this.setFlag('tour_done');
      this.setObjective('the studio — session work pays');
    }, { once: false });
  }

  async gigPavilion() {
    this.setObjective('SONG — golden hour, ninety people');
    music.trumpet();
    const passes = await this.runGig({
      phrases: SONGS.pavilion,
      bpm: 120,
      label: 'Riverside Pavilion — sunset',
      onPhrase: (ok, i) => {
        if (ok && this.lanterns[i]) {
          this.lanterns[i].setAlpha(1);
          sfx('chime');
        }
      },
    });
    music.trumpet(false);
    if (passes >= 5) {
      if (passes === 7) {
        for (let i = 0; i < 10; i++) {
          const f = this.add.circle(px(215 + Math.random() * 12), px(24 + Math.random() * 4), 3, [0xf2d580, 0xe86a6a, 0x88b8d8][i % 3]);
          this.tweens.add({ targets: f, y: f.y - 40, alpha: 0, duration: 1800, onComplete: () => f.destroy() });
        }
      }
      this.floatText(px(220), px(30), "Delphine, from the crowd:\n\"drove two hours. don't make it weird.\"");
      this.setFlag('pavilion_done');
      this.marcusRoad.setVisible(true);
      await this.dialog.show(M_DIALOGUES.d7);
      this.setObjective('stop 2 — The Saltbox');
    } else {
      this.floatText(px(218), px(33), 'not tonight. again.', '#e86a6a');
    }
  }

  buildDay5() {
    this.recordLight = this.add.circle(px(300), px(28), 8, 0xe83a2a, 0.2).setDepth(20);
    this.recordOn = false;
    [298, 304].forEach((c) => {
      const w = this.walkers.create(px(c), px(35), 'mus-walker');
      w.setVelocityX(-40);
      w.homeX = px(c);
    });
    this.addInteract(px(306), px(35), 'the take', async () => {
      this.setObjective('"sell it, sell it!" — fill EVERY bar');
      let winced = false;
      const passes = await this.runGig({
        phrases: SONGS.studio,
        bpm: 110,
        label: 'session — car commercial',
        invertRests: true,
        onRestFilled: () => {
          if (!winced) {
            winced = true;
            this.floatText(this.player.x, this.player.y - 60, 'Jo winces. the producer\ngives a thumbs-up.', '#a0c860');
          }
        },
      });
      if (passes >= 6) {
        this.setFlag('take_done');
        this.floatText(px(306), px(32), '"perfect. again exactly like that, twice."');
        this.setObjective('the control room — the mix');
      }
    }, { once: false, when: () => this.F.tour_done && !this.F.take_done });
    this.addInteract(px(313), px(35), 'the mixing desk', async () => {
      const ok = await theMix(this);
      if (ok) {
        this.setFlag('mix_done');
        this.floatText(px(313), px(32), 'the van gets fixed. that\'s what it was for.');
        this.setObjective('the rooftop — someone is waiting');
      }
    }, { once: false, when: () => this.F.take_done && !this.F.mix_done });
    this.tally = this.add.image(px(320), px(35), 'npc-tally').setDepth(10);
    this.addInteract(px(320), px(35), 'Mr. Tally', async () => {
      const choice = await this.dialog.show(M_DIALOGUES.d9);
      this.F.choice = choice || 'think';
      if (choice === 'nia') await this.dialog.show(M_DIALOGUES.d9_nia);
      if (choice === 'think') await this.dialog.show(M_DIALOGUES.d9_think);
      this.setFlag('offer_done');
      this.setObjective('Saturday. the festival.');
    }, { once: false, when: () => this.F.mix_done && !this.F.offer_done });
    this.addInteract(px(328), px(35), 'Tally, at the dock', async () => {
      const choice = await this.dialog.show(M_DIALOGUES.d9_dock);
      this.F.choice = choice || 'tally';
      this.setFlag('dock_done');
    }, { once: false, when: () => this.F.choice === 'think' && !this.F.dock_done });
  }

  buildDay6() {
    // roadies on the catwalk
    this.roadies = [334, 340].map((c) => {
      const r = this.add.image(px(c), px(27), 'npc-roadie').setDepth(12);
      this.tweens.add({ targets: r, x: px(c + 3), duration: 2600, yoyo: true, repeat: -1 });
      return r;
    });
    // moving-head beams: white-out, not damage
    this.beams6 = [333, 339].map((c, i) => {
      const beam = this.add.rectangle(px(c), px(31), 30, 280, 0xffffff, 0.16).setDepth(14);
      this.tweens.add({ targets: beam, x: px(c) + 70, duration: 2000, yoyo: true, repeat: -1, delay: i * 800 });
      return beam;
    });
    this.whiteout = this.add.rectangle(480, 270, 960, 540, 0xffffff, 0).setScrollFactor(0).setDepth(180);
    [336, 341, 343].forEach((c) => this.spawnWisp(px(c), px(26)));
    this.addInteract(px(344), px(27), 'the wing', async () => {
      if (this.F.choice === 'nia') await this.dialog.show(M_DIALOGUES.d_wing_nia);
      if (this.F.m2) this.floatText(px(344), px(24), "front row, on someone's shoulders:\nthe kid with the backpack.");
      this.floatText(px(344), px(26), 'Jo scans the crowd for Ray.\nRay is not there.', '#8a8478');
      this.setFlag('wing_done');
    }, { once: false, when: () => !this.F.wing_done });
    // risers
    this.risers = [];
    [350, 356, 362, 368, 374].forEach((c, i) => {
      const r = this.physics.add.image(px(c), px(30), 'mus-key').setImmovable(true).setScale(2, 1);
      r.body.setAllowGravity(false);
      this.physics.add.collider(this.player, r);
      this.risers.push({ img: r, baseY: px(30), phase: i });
    });
    this.staticWall = this.add.rectangle(px(345), px(28), 60, 500, 0x9a9aa8, 0.75).setDepth(40).setVisible(false);
    this.crowd = [];
    for (let c = 347; c <= 379; c += 2) {
      this.crowd.push(this.add.circle(px(c), px(35), 12, 0x14090c, 0.9).setDepth(8));
    }
  }

  buildDay7() {
    this.add.image(px(392), px(34), 'mus-chair').setDepth(6);
    this.add.image(px(392), px(33) - 6, 'mus-case').setDepth(7);
    const o = this.orbs.create(px(392), px(31), 'orb').setDepth(95);
    this.tweens.add({ targets: o, y: px(31) - 10, duration: 1000, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.addInteract(px(384), px(35), 'listen', () => this.dialog.show(M_DIALOGUES.d_after), { once: true, when: () => this.F.set_done });
  }

  // ------- the gig runner ----------------------------------------------

  runGig(opts) {
    return new Promise((resolve) => {
      this.nerve = opts.keepNerve ? this.nerve : 0;
      this.gig = new Phrases(this, {
        ...opts,
        window: 140 - 10 * this.difficulty,
        onPhrase: (ok, i) => {
          if (!ok) {
            this.addNerve(18);
            if (this.staticActive) this.staticWall.x += (this.difficulty >= 2 ? 2 : 1) * T;
          } else {
            this.nerve = Math.max(0, this.nerve - 8);
            sfx('chime');
            if (this.staticActive) this.staticWall.x = Math.max(px(345), this.staticWall.x - 24);
          }
          (opts.onPhrase || (() => {}))(ok, i);
        },
        onDone: (passes) => {
          const g = this.gig;
          this.gig = null;
          this.time.delayedCall(100, () => g.destroy());
          resolve(passes);
        },
      });
      this.gig.start();
    });
  }

  // ------- the big stage sequence --------------------------------------

  async gigBigStage() {
    this.F.stage_started = true;
    const withRests = this.F.choice === 'nia';
    const song = (p) => (withRests ? p : noRests(p));
    music.trumpet();
    this.staticActive = true;
    this.staticWall.setVisible(true);
    this.setObjective('SONG 1 — "Tuesday"');
    await this.runGig({ phrases: song(SONGS.stage1), bpm: 128, label: 'THE BIG STAGE — Tuesday' });
    this.setObjective('SONG 2 — "The Corner"');
    this.hecklers.push({ x: px(352), y: px(26), next: 0, img: this.add.image(px(352), px(26), 'npc-roadie').setDepth(10) });
    await this.runGig({ phrases: song(SONGS.stage2), bpm: 128, label: 'THE BIG STAGE — The Corner', keepNerve: true });
    this.setObjective('SONG 3 — "The Road"');
    const part1 = song(SONGS.stage3).slice(0, 6);
    await this.runGig({ phrases: part1, bpm: 128, label: 'THE BIG STAGE — The Road', keepNerve: true });

    // THE BLANK
    this.nerve = 100;
    const black = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.92).setScrollFactor(0).setDepth(175);
    music.stop();
    this.floatText(this.player.x, this.player.y - 70, '…', '#8a8478');
    if (this.F.choice === 'nia') {
      await new Promise((res) => {
        this.time.delayedCall(1500, () => {
          bassNote(2, 1.2);
          this.floatText(this.player.x, this.player.y - 60, "a bass note, from the dark.\ndon't play. let the bar pass.", '#88b8d8');
          this.blankHold = { until: this.time.now + 2600, res, black };
        });
      });
    } else {
      this.floatText(this.player.x, this.player.y - 60, 'no bass note comes.\nplay it blind.', '#e86a6a');
      await new Promise((res) => this.time.delayedCall(1800, res));
      await this.runGig({ phrases: SONGS.blind, bpm: 128, label: '(blind)', hideIcons: true, keepNerve: true });
      black.destroy();
    }
    music.bass();
    const part2 = song(SONGS.stage3).slice(6);
    await this.runGig({ phrases: part2, bpm: 128, label: 'THE BIG STAGE — The Road', keepNerve: true });

    // final sustained note
    this.setObjective('HOLD [Q] — one long note');
    this.sustain = { need: 4000, held: 0 };
    await new Promise((res) => {
      this.sustainDone = res;
    });
    this.staticActive = false;
    this.staticWall.setVisible(false);
    sfx('clang');
    const flash = this.add.rectangle(480, 270, 960, 540, 0xffffff, 0.9).setScrollFactor(0).setDepth(185);
    this.cameras.main.shake(150, 0.004);
    sfx('orb');
    this.time.delayedCall(3000, () => {
      flash.destroy();
      music.stop();
      this.floatText(this.player.x, this.player.y - 70, 'the applause is huge.\nand then it simply stops.', '#c8c0b0');
    });
    this.setFlag('set_done');
    this.setObjective('backstage. after.');
  }

  // ------- helpers ------------------------------------------------------

  niaNear() {
    return this.nia && Phaser.Math.Distance.Between(this.nia.x, this.nia.y, this.player.x, this.player.y) < 120;
  }

  playRing() {
    const ring = this.add.circle(this.player.x, this.player.y - 10, 12, 0xf2d580, 0).setStrokeStyle(3, 0xf2d580, 0.9).setDepth(30);
    this.tweens.add({ targets: ring, radius: 140, alpha: 0.1, duration: 450, onComplete: () => ring.destroy() });
    for (const r of this.resonants) {
      if (r.used && r.once) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, r.x, r.y) < 150) {
        r.used = true;
        r.onRing();
      }
    }
    // wisps silenced inside the ring
    this.wisps.children.iterate((w) => {
      if (!w) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, w.x, w.y);
      if (d < 150) {
        if (this.inBoiler() && !this.niaNear()) {
          this.floatText(w.x, w.y - 20, 'it needs two voices — Nia [F]', '#88b8d8');
        } else {
          sfx('pop');
          if (this.inBoiler()) bassNote(3, 0.4);
          w.destroy();
        }
      }
    });
    // scalper drops the case
    if (this.scalper && this.scalper.state === 'flee' && Math.abs(this.scalper.x - this.player.x) < 400) {
      this.scalper.state = 'dropped';
      this.hasCase = true;
      sfx('snap');
      this.floatText(this.scalper.x, this.scalper.y - 30, 'he drops it and bolts!');
      this.tweens.add({ targets: this.scalper, alpha: 0, x: this.scalper.x + 200, duration: 900, onComplete: () => this.scalper.destroy() });
      this.scalper = null;
    }
  }

  inBoiler() {
    return this.player.x > px(179) && this.player.x < px(191);
  }

  inZone(c0, c1) {
    return this.player.x > px(c0) && this.player.x < px(c1);
  }

  // ------- update -------------------------------------------------------

  update(time, delta) {
    if (this.handleModalUpdate()) return;
    const p = this.player;
    const pb = p.getBounds();
    const dt = delta / 1000;

    // Day 4 wind + heavy case
    if (this.inZone(251, 290)) {
      p.body.velocity.x -= 26;
    }
    p.update(time, delta);

    const qJust = Phaser.Input.Keyboard.JustDown(p.keys.Q);
    const qDown = p.keys.Q.isDown;

    // breath
    const drainRate = this.sustain ? 23 : this.inZone(231, 291) ? 55 : 28;
    if (qDown) this.breath = Math.max(0, this.breath - drainRate * dt);
    else this.breath = Math.min(100, this.breath + 50 * dt);
    this.breathBar.width = (this.breath / 100) * 90;
    this.nerveBar.setVisible(!!this.gig);
    this.nerveBar.width = (this.nerve / 100) * 90;
    this.coinText.setText(this.inZone(86, 106) ? `¢ ${this.coins}/12` : '');

    if (qJust) {
      // stuck valve: notes land late until it's fixed
      const delay = !this.F.valve_fixed && this.inZone(86, 151) ? Math.random() * 300 : 0;
      this.time.delayedCall(delay, () => {
        this.playRing();
        if (this.gig) this.gig.notePressed(this.time.now);
        if (this.buskPhrase) this.buskPhrase.notePressed(this.time.now);
      });
      if (delay > 120) this.floatText(p.x, p.y - 52, '(the valve sticks)', '#8a8478');
    }
    if (this.gig) this.gig.update(time);
    if (this.buskPhrase) this.buskPhrase.update(time);

    // sustained final note
    if (this.sustain) {
      if (qDown && this.breath > 0) {
        this.sustain.held += delta;
        if (this.sustain.held > 400 && !this.sustainTone) {
          this.sustainTone = true;
          trumpet(7, 4, 0.4);
        }
        if (this.sustain.held >= this.sustain.need) {
          const res = this.sustainDone;
          this.sustain = null;
          this.sustainTone = false;
          res();
        }
      } else if (this.sustain.held > 0) {
        this.sustain.held = 0;
        this.sustainTone = false;
      }
    }

    // the blank: recover by doing nothing
    if (this.blankHold) {
      if (qJust) {
        this.blankHold.until = time + 2600;
        this.floatText(p.x, p.y - 60, 'no. let it breathe.', '#e86a6a');
      } else if (time > this.blankHold.until) {
        const { res, black } = this.blankHold;
        this.blankHold = null;
        black.destroy();
        this.floatText(p.x, p.y - 60, 'the lights come back, one at a time.');
        res();
      }
    }

    // sound bridges
    for (const a of this.anchors) {
      const near = Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) < 150;
      if (near && qDown && this.breath > 5 && !p.body.onFloor()) {
        if (!a.bridge) {
          a.bridge = this.physics.add.image(a.x + a.dir * (a.len / 2), px(a.row) + 8, 'mus-beat').setImmovable(true);
          a.bridge.setScale(a.len / 32, 0.5).setAlpha(0.85);
          a.bridge.body.setAllowGravity(false);
          a.collider = this.physics.add.collider(p, a.bridge);
          sfx('chime');
        }
        a.fadeAt = time + 500;
      }
      if (a.bridge && time > (a.fadeAt || 0) && !qDown) {
        a.bridge.destroy();
        a.collider && this.physics.world.removeCollider(a.collider);
        a.bridge = null;
      }
    }

    // interactions + case
    let nearest = null;
    for (const it of this.interacts) {
      if (it.used && it.once) continue;
      if (!it.when()) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, it.x, it.y);
      if (d < it.radius && (!nearest || d < nearest.d)) nearest = { it, d };
    }
    if (nearest) {
      this.promptText.setVisible(true).setPosition(nearest.it.x, nearest.it.y - 40);
      if (Phaser.Input.Keyboard.JustDown(p.keys.E)) {
        nearest.it.used = true;
        nearest.it.cb();
      }
    } else {
      this.promptText.setVisible(false);
      if (Phaser.Input.Keyboard.JustDown(p.keys.E) && this.hasCase) {
        if (!this.caseDown) {
          this.caseDown = this.physics.add.image(p.x + (p.flipX ? -24 : 24), p.y + 10, 'mus-case').setImmovable(true);
          this.caseDown.body.setAllowGravity(false);
          this.caseCollider = this.physics.add.collider(p, this.caseDown);
          sfx('clang');
        } else {
          this.caseDown.destroy();
          this.physics.world.removeCollider(this.caseCollider);
          this.caseDown = null;
          sfx('pickup');
        }
      }
    }

    // scalper steal
    if (this.scalper) {
      if (this.scalper.state === 'lurk' && Math.abs(this.scalper.x - p.x) < 60) {
        this.scalper.state = 'flee';
        this.hasCase = false;
        if (this.caseDown) {
          this.caseDown.destroy();
          this.caseDown = null;
        }
        this.scalper.setVelocityX(160);
        this.floatText(this.scalper.x, this.scalper.y - 30, 'HE TOOK THE CASE!\nplay [Q] to stop him!', '#e86a6a');
      }
      if (this.scalper && this.scalper.state === 'flee' && this.scalper.x > px(104)) this.scalper.setVelocityX(0);
    }

    this.updateMusicRoom(); // D7 room-driven mix
    this.updateBusking(time);
    this.updateHazards(time, pb, dt);
    this.updateNia(time);

    // day 6 stage trigger
    if (!this.F.stage_started && this.F.wing_done && (this.F.choice === 'nia' || this.F.choice === 'tally') && this.inZone(348, 380)) {
      this.gigBigStage();
    }
    // static wall touch
    if (this.staticActive && p.x < this.staticWall.x + 40 && this.inZone(345, 381)) {
      this.hurt();
      p.x += 60;
    }

    if (p.y > this.worldH + 60) {
      p.setPosition(this.checkpoint.x, this.checkpoint.y);
      p.setVelocity(0, 0);
      this.hurt();
    }
  }

  updateBusking(time) {
    if (!this.inZone(86, 106) || this.F.busking_done) return;
    if (this.coins >= 12 && !this.F.busking_done) {
      this.setFlag('busking_done');
      this.floatText(this.player.x, this.player.y - 60, 'twelve coins. enough for the spring.');
      this.setObjective('rooftops → the repair shop');
      return;
    }
    if (time > this.pedNext) {
      this.pedNext = time + 4200;
      const isCop = Math.random() < 0.25;
      const ped = this.add.image(px(86), px(35), isCop ? 'npc-tally' : 'npc-sol').setDepth(9);
      if (isCop) ped.setTint(0x88a8d8);
      ped.isCop = isCop;
      this.peds.push(ped);
      this.tweens.add({ targets: ped, x: px(105), duration: 9000, onComplete: () => {
        this.peds = this.peds.filter((q) => q !== ped);
        ped.destroy();
      } });
      // the kid
      if (!this.kid && this.coins >= 6 && !this.F.m2) {
        this.kid = this.add.image(px(88), px(35), 'npc-kid').setDepth(9);
        this.tweens.add({ targets: this.kid, x: px(93), duration: 3000 });
        this.addInteract(px(93), px(35), 'play for her', async () => {
          const passes = await this.runGig({ phrases: [[1, 1, 1, 1]], bpm: 88, label: 'for the kid' });
          if (passes >= 0) {
            this.moments += 1;
            this.setFlag('m2');
            this.floatText(px(93), px(32), M_MOMENTS.m2.text, '#f2e0a0');
            this.tweens.add({ targets: this.kid, x: px(86), alpha: 0, duration: 2500 });
          }
        }, { once: true });
      }
    }
    // busk at a passer-by
    if (!this.buskPhrase && !this.gig && this.caseDown) {
      const mark = this.peds.find((ped) => !ped.isCop && !ped.busked && Math.abs(ped.x - this.player.x) < 90);
      if (mark) {
        mark.busked = true;
        this.buskPhrase = new Phrases(this, {
          phrases: [[1, 1, 1, 1].slice(0, 3 + Math.floor(Math.random() * 2))],
          bpm: 88,
          label: 'a passer-by slows…',
          onDone: (passes) => {
            const g = this.buskPhrase;
            this.buskPhrase = null;
            this.time.delayedCall(60, () => g.destroy());
            if (passes > 0) {
              const got = 1 + Math.floor(Math.random() * 2);
              this.coins += got;
              sfx('pickup');
              this.floatText(this.caseDown ? this.caseDown.x : this.player.x, this.player.y - 40, `+${got}¢`);
            }
          },
        });
        this.buskPhrase.start();
      }
    }
    // cops
    const cop = this.peds.find((ped) => ped.isCop && Math.abs(ped.x - this.player.x) < 260);
    if (cop && this.player.keys.Q.isDown && time > this.copCooldown) {
      this.copCooldown = time + 3000;
      this.coins = Math.max(0, this.coins - 3);
      sfx('fail');
      this.floatText(cop.x, cop.y - 40, '"permit?" −3¢', '#e86a6a');
    }
  }

  updateHazards(time, pb, dt) {
    // hecklers
    for (const h of this.hecklers) {
      if (time > h.next && Math.abs(this.player.x - h.x) < 350) {
        h.next = time + 3600;
        this.tweens.add({ targets: h.img, angle: -12, duration: 350, yoyo: true });
        this.time.delayedCall(400, () => {
          const b = this.bottles.create(h.x, h.y, 'mus-bottle');
          b.setVelocity(Math.sign(this.player.x - h.x) * 120, -160);
        });
      }
    }
    // corridor pendulum
    if (this.pendulum) {
      const a = Math.sin(time / 650) * 1.0;
      this.pendulum.img.setPosition(this.pendulum.ax + Math.sin(a) * this.pendulum.len, this.pendulum.ay + Math.cos(a) * this.pendulum.len);
      if (overlaps(pb, this.pendulum.img.getBounds())) this.hurt();
    }
    // roof vents + slates + walkers stomp on beat
    for (const v of this.roofVents) {
      const t = (time + v.phase) % 1800;
      if (t > 1200 && Math.abs(this.player.x - v.x) < 20 && Math.abs(this.player.y - v.y) < 40) {
        this.player.body.setVelocityY(-700);
        sfx('steam');
      }
    }
    for (const s of this.slates) {
      if (s.state === 'solid' && this.player.body.blocked.down && Math.abs(this.player.x - s.x) < 22 && Math.abs(this.player.y + 24 - s.img.y) < 20) {
        if (!s.steppedAt) s.steppedAt = time;
      }
      if (s.state === 'solid' && s.steppedAt && time - s.steppedAt > 800) {
        s.state = 'gone';
        sfx('crack');
        s.img.setVisible(false);
        s.img.body.enable = false;
        this.time.delayedCall(2600, () => {
          s.state = 'solid';
          s.steppedAt = 0;
          s.img.setVisible(true);
          s.img.body.enable = true;
        });
      }
    }
    this.walkers.children.iterate((w) => {
      if (!w || !w.body) return;
      const beat = Math.floor(time / 500);
      if (w.homeX !== undefined) {
        if (w.x < w.homeX - 70) w.stompDir = 1;
        else if (w.x > w.homeX + 70) w.stompDir = -1;
      }
      if (w.body.blocked.left) w.stompDir = 1;
      if (w.body.blocked.right) w.stompDir = -1;
      w.setVelocityX(beat % 2 === 0 ? (w.stompDir || -1) * 60 : 0);
    });
    // wisps chase
    this.wisps.children.iterate((w) => {
      if (!w) return;
      const dx = this.player.x - w.x;
      const dy = this.player.y - w.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 320) w.setVelocity((dx / d) * 55, (dy / d) * 55);
      else w.setVelocity(0, 0);
    });
    // saltbox manager cone
    if (this.manager) {
      this.manager.img.x += this.manager.dir * 30 * dt;
      if (this.manager.img.x > this.manager.x1) this.manager.dir = -1;
      if (this.manager.img.x < this.manager.x0) this.manager.dir = 1;
      this.managerCone.x = this.manager.img.x + this.manager.dir * 60;
      const inCone = overlaps(pb, this.managerCone.getBounds());
      const crouching = this.player.cursors.down.isDown || this.player.keys.S.isDown;
      if (inCone && !crouching && this.inZone(236, 249)) {
        this.player.setPosition(px(236), px(34));
        this.player.setVelocity(0, 0);
        this.floatText(px(240), px(31), '"hey! we\'re CLOSED."', '#e86a6a');
      }
      // dog barks if not calmed
      if (this.inZone(237, 240) && time > this.dogCalmUntil && time > (this.dogNext || 0)) {
        this.dogNext = time + 2000;
        this.floatText(px(238), px(33), 'BARK BARK — a soft note [Q] might help', '#e86a6a');
      }
    }
    // highway trucks
    if (this.inZone(251, 290) && time > this.truckNext) {
      this.truckNext = time + 7000;
      const spray = this.add.rectangle(px(290), px(34), 90, 60, 0xa0b8c8, 0.4).setDepth(15);
      this.tweens.add({ targets: spray, x: px(251), duration: 2200, onComplete: () => spray.destroy() });
      spray.isSpray = true;
      this.spray = spray;
      sfx('hiss');
    }
    if (this.spray && this.spray.active && overlaps(pb, this.spray.getBounds())) this.hurt();
    // studio record light
    const cycle = time % 9000;
    this.recordOn = cycle < 5000;
    if (this.recordLight) this.recordLight.setAlpha(this.recordOn ? 0.9 : 0.2);
    if (this.recordOn && this.inZone(291, 311)) {
      const landed = this.player.body.onFloor() && this.playerWasAir;
      const crouching = this.player.cursors.down.isDown || this.player.keys.S.isDown;
      if (landed && !crouching) {
        this.floatText(this.player.x, this.player.y - 60, 'TAKE RUINED — footsteps on the mic', '#e86a6a');
        this.player.setPosition(px(292), px(35));
        this.player.setVelocity(0, 0);
      }
    }
    this.playerWasAir = !this.player.body.onFloor();
    // day 6 white-out beams
    for (const b of this.beams6 || []) {
      if (Math.abs(this.player.x - b.x) < 18 && Math.abs(this.player.y - b.y) < 140) {
        this.whiteout.setAlpha(0.85);
        this.time.delayedCall(400, () => this.whiteout.setAlpha(0));
      }
    }
    // risers bob on the beat during the set
    if (this.F.stage_started && !this.F.set_done) {
      for (const r of this.risers) {
        r.img.y = r.baseY + Math.sin(time / 469 + r.phase) * 14;
        r.img.body.updateFromGameObject && r.img.body.updateFromGameObject();
      }
      // crowd pit
      if (this.inZone(346, 380) && this.player.y > px(34)) {
        this.addNerve(20);
        this.player.setPosition(px(350), px(29));
        this.player.setVelocity(0, 0);
        this.floatText(px(350), px(28), 'hands hoist Jo back up', '#c8c0b0');
      }
    }
    // heater plates (day 3)
    if (this.plateA) {
      this.plateA.on = Math.abs(this.player.x - this.plateA.x) < 40 || (this.nia && Math.abs(this.nia.x - this.plateA.x) < 40);
      this.plateB.on = Math.abs(this.player.x - this.plateB.x) < 40 || (this.nia && Math.abs(this.nia.x - this.plateB.x) < 40);
    }
  }

  updateNia(time) {
    const present =
      (this.F.met_nia && this.inZone(151, 291)) || (this.F.choice === 'nia' && this.inZone(326, 400) && this.F.set_done !== undefined);
    if (present && !this.nia) {
      this.nia = this.physics.add.image(this.player.x - 40, this.player.y - 10, 'npc-nia').setDepth(11);
      this.physics.add.collider(this.nia, this.solids);
    } else if (!present && this.nia) {
      this.nia.destroy();
      this.nia = null;
    }
    if (!this.nia) return;
    const dx = this.player.x - this.nia.x;
    if (Phaser.Input.Keyboard.JustDown(this.player.keys.F)) {
      if (Math.abs(dx) > 400 || Math.abs(this.player.y - this.nia.y) > 100) {
        this.nia.setPosition(this.player.x - 30, this.player.y - 10);
        bassNote(4, 0.3);
      }
      this.niaCalled = { x: this.player.x, until: time + 6000 };
      bassNote(2, 0.4);
    }
    const target = this.niaCalled && time < this.niaCalled.until ? this.niaCalled.x : this.player.x - 40;
    const d = target - this.nia.x;
    this.nia.setVelocityX(Math.abs(d) > 16 ? Math.sign(d) * 110 : 0);
    this.nia.setFlipX(d < 0);
  }

  catchOrb(orb) {
    if (this.cardActive || this.orbCaught || !this.F.set_done) return;
    this.orbCaught = true;
    completeDream('musician');
    music.stop();
    music.soloPiano();
    sfx('orb');
    this.tweens.add({ targets: orb, scale: 2.5, alpha: 0, duration: 700 });
    const momentMsg =
      this.moments === 0 ? "You didn't notice anything on the way." : this.moments < 3 ? 'You noticed a little.' : 'You noticed. Maybe that was the point.';
    const lines = ['The Big Stage.', '', 'Eleven minutes.', '', 'Was it enough?', '', momentMsg];
    if (this.F.choice === 'tally') lines.push('', "You didn't rush the third bar. Nobody was listening for it.");
    if (this.F.choice === 'nia') lines.push('', 'Somebody was listening for the third bar.');
    if (this.F.marcus_left === 'stay') lines.push('', 'Marcus drove home Sunday. He kept the napkin.');
    lines.push('', '[X] Return to Crossroads Station');
    this.showCard(lines, () => {
      music.stop();
      this.scene.start('Select');
    });
  }
}
