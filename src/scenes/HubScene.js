import Phaser from 'phaser';
import Player from '../entities/Player.js';
import BaseLevel from './BaseLevel.js';
import RoomBuilder from '../builders/RoomBuilder.js';
import Parallax from '../builders/parallax.js';
import { D } from '../builders/depths.js';
import hubRooms, { BAYS } from '../data/hub/rooms.js';
import hubTiles from '../data/hub/tiles.js';
import { HUB_ROWS } from '../data/hub/map.js';
import { DREAMS, LAST_STOP, dreamById } from '../data/dreams.js';
import { loadAtlases, loadAtlasMeta, atlasFrames, atlasMeta } from '../systems/atlases.js';
import SplitFlapBoard from '../systems/SplitFlapBoard.js';
import Train from '../entities/Train.js';
import Silhouettes from '../entities/Silhouette.js';
import Phrases from '../systems/rhythm.js';
import { hubState, HEADLINES } from '../systems/hubState.js';
import { getSave, updateSave } from '../utils/save.js';
import { sfx, music, musicDirector, sting, accordion } from '../systems/audio.js';

const T = 32;
const px = (tile) => tile * T + T / 2;
const line = (row) => (row + 1) * T; // the floor line under a tile row
const FLOOR = line(HUB_ROWS.FLOOR - 1); // 832: hall floor / concourse
const ROOF = line(HUB_ROWS.ROOF - 1); // 256
const UNDER = line(HUB_ROWS.UNDER - 1); // 1056
const DOORS_X = px(22);
const SHED_END_X = px(139);

// --- the people of the station: what they say, per dreamsCaught -----------
const PEMBERTON_RETURN = [
  null,
  'Back already. Was it everything?',
  'Two. The service gate will have noticed.',
  'Three. You look… thinner around the eyes.',
  'Four. Most people stop at two.',
  "Five. The board's out of dreams, sir.",
];
const BILAL_TEA = [
  'On the house.',
  'On the house.',
  'Still on the house.',
  "You're not sleeping.",
  "Drink it here. Don't take it on the train.",
  null, // silence, then the line about the sweeper
];
const LAST_WALK = {
  pemberton: 'Mind the gap.',
  ro: 'Sit a minute.',
  bilal: "It's still on the house.",
  flower: '…the last one. Take it.',
};

// Crossroads Station. A cathedral built for leaving; the only fully safe
// place before the finale, and the game's message told in architecture.
export default class HubScene extends BaseLevel {
  constructor() {
    super('Hub');
  }

  init(data) {
    this.returnedFrom = data && data.returnedFrom ? data.returnedFrom : null;
  }

  preload() {
    super.preload();
    loadAtlases(this, ['hub']);
    loadAtlasMeta(this, ['hub']);
  }

  // an image from the hub atlas at the pixel size it was drawn for
  img(x, y, frame) {
    const meta = atlasMeta(this, 'hub');
    const sc = (meta.scale && meta.scale[frame]) || 2;
    return this.add.image(x, y, 'hub', frame).setScale(sc);
  }

  create() {
    this.save = getSave();
    this.N = Math.min(5, this.save.dreamsCaught);
    this.state = hubState(this.N);
    this.firstVisit = this.save.flags.hub.visits === 0 && !this.returnedFrom;
    updateSave((s) => (s.flags.hub.visits += 1));

    const built = RoomBuilder.build(this, hubRooms, hubTiles);
    this.built = built;
    this.parallax = new Parallax(this, built.rooms);
    this.solids = built.solids;
    this.oneWays = built.oneWays;
    this.slopeGrid = built.slopeGrid;
    this.climbGrid = built.climbGrid;
    this.ladderGrid = built.ladderGrid;
    this.surfaceGrid = built.surfaceGrid;
    this.objects = built.objects;

    // where Jo starts: the street on a first visit, otherwise his platform
    let spawn = { x: px(3), y: line(29) - 24 };
    if (this.returnedFrom) {
      const d = dreamById(this.returnedFrom);
      if (d) spawn = { x: px(BAYS[d.platform - 1] + 3), y: FLOOR - 24 };
    } else if (!this.firstVisit) {
      spawn = { x: px(26), y: FLOOR - 24 };
    }
    this.player = new Player(this, spawn.x, spawn.y);
    this.setupCommon({ worldW: built.worldW, worldH: built.worldH, levelName: 'CROSSROADS STATION', spawn });
    this.hearts.forEach((h) => h.setVisible(false)); // nothing here can hurt you

    this.interacts = [];
    this.npcs = {};
    this.trains = {};
    this.moments = { ...this.save.flags.hub };
    this.visitLines = {};
    this.stationSeconds = this.save.stationSeconds || 0;

    this.buildSteps();
    this.buildHall();
    this.buildPlatforms();
    this.buildGate();
    this.buildUndercroft();
    this.buildRoof();
    this.buildTravelers();
    this.buildDayCycle();
    this.applyState();

    // while Jo is on a ladder the floor tile over it stops being a floor, so
    // he can climb down through the concourse into the undercroft and back
    this.physics.add.collider(this.player, this.solids, null, () => !this.player.climbing);
    this.physics.add.collider(this.player, this.oneWays, null, () => !this.player.climbing);

    this.promptText = this.add
      .text(0, 0, '[E]', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580', backgroundColor: '#14101c' })
      .setOrigin(0.5)
      .setDepth(80)
      .setVisible(false);

    musicDirector.setBpm(104);
    musicDirector.setMix(this.state.music);
    this.boardIdle = this.time.addEvent({ delay: this.state.boardIdleMs, loop: true, callback: () => this.board.idleClack() });
    this.clockTick = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tickClock() });
    this.events.once('shutdown', () => this.persistClock());

    if (this.returnedFrom) this.runReturn();
    else if (this.firstVisit) this.setObjective('');
    else this.setObjective(this.N >= 2 ? 'board any train — or the last stop' : 'board any train');
  }

  // ---- helpers ------------------------------------------------------------

  obj(type, pred = () => true) {
    return this.objects.find((o) => o.type === type && pred(o));
  }

  objs(type, pred = () => true) {
    return this.objects.filter((o) => o.type === type && pred(o));
  }

  addInteract(x, y, label, cb, { radius = 44, once = false, when = () => true } = {}) {
    const it = { x, y, label, cb, radius, once, when, used: false };
    this.interacts.push(it);
    return it;
  }

  // an NPC: a sprite planted on its floor line, an idle bob, a name
  npc(who, o, opts = {}) {
    const floor = line(o.ty);
    const s = this.add.image(o.wx, floor - 24, 'hub', `hub-${who}_0`).setScale(2).setDepth(D.INTERACT + 1);
    s.who = who;
    s.floorY = floor;
    if (opts.flip) s.setFlipX(true);
    if (!opts.still) {
      this.tweens.add({ targets: s, y: s.y - 1.5, duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'sine.inout' });
    }
    // their own lamp: the one thing in the hall that never dims
    s.lamp = this.add.circle(o.wx, floor - 30, 44, 0xf2c078, 0.13).setDepth(D.INTERACT);
    this.npcs[who] = s;
    return s;
  }

  say(who, text, portrait = true) {
    const names = { pemberton: 'Mr. Pemberton', ro: 'Auntie Ro', bilal: 'Bilal', busker: 'The Busker', kite: 'Kite Kid', flower: 'Flower Seller', jo: 'Jo', gate: '…' };
    return this.dialog.show([{ name: names[who] || who, text, portrait: portrait && who !== 'gate' && who !== 'jo' ? `hub:hub-${who}_0` : undefined }]);
  }

  once(id, fn) {
    if (this.visitLines[id]) return;
    this.visitLines[id] = true;
    fn();
  }

  // ---- screen 1: the front steps ----------------------------------------

  buildSteps() {
    const street = line(29);
    // newspaper kiosk with headlines that change with the count
    const k = this.obj('kiosk');
    this.img(k.wx, street - 16, 'hub-kiosk').setDepth(D.INTERACT - 2);
    this.add
      .text(k.wx, street - 44, HEADLINES[this.N], { fontFamily: 'monospace', fontSize: '8px', color: '#f2e6cc', wordWrap: { width: 90 }, align: 'center' })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 1);
    this.addInteract(k.wx, street - 20, 'paper', () => this.floatText(k.wx, street - 70, `"${HEADLINES[this.N]}"`, '#c8c0b0'));

    // three brass revolving doors; only the middle one turns
    this.doors = this.objs('door').map((o) => {
      const img = this.img(o.wx, FLOOR - 20, 'hub-door').setDepth(D.INTERACT - 2);
      if (o.chained) {
        this.img(o.wx, FLOOR - 24, 'hub-chain').setDepth(D.INTERACT - 1);
        this.add.text(o.wx, FLOOR - 50, '🔒', { fontSize: '10px' }).setOrigin(0.5).setDepth(D.INTERACT - 1).setAlpha(0.8);
      } else {
        this.mainDoor = img;
        this.tweens.add({ targets: img, scaleX: 0.15, duration: 1400, yoyo: true, repeat: -1, ease: 'sine.inout', paused: true });
      }
      return img;
    });
    this.hallEntryX = this.obj('hall_entry').wx;

    // Auntie Ro at her shoeshine stand
    const ro = this.obj('npc', (o) => o.who === 'ro');
    this.img(this.obj('shoeshine').wx, FLOOR - 14, 'hub-shoeshine').setDepth(D.INTERACT - 2);
    const roS = this.npc('ro', ro, { still: true });
    roS.y = FLOOR - 26;
    this.addInteract(ro.wx, FLOOR - 20, 'ro', () => this.talkRo());

    // rain on the wet stone
    const rainObj = this.obj('rain');
    if (rainObj) this.buildRain(rainObj.wx, (rainObj.w || 30) * T);

    // the station's plinth: the name carved into the stone, brass rails
    const plinthX = px(21);
    this.add.rectangle(plinthX, FLOOR + 40, 14 * T, 3, 0xc4a25c, 0.7).setDepth(D.HAZARD);
    this.add.rectangle(plinthX, FLOOR + 90, 14 * T, 3, 0xc4a25c, 0.4).setDepth(D.HAZARD);
    this.add
      .text(plinthX, FLOOR + 64, 'C R O S S R O A D S', { fontFamily: 'monospace', fontSize: '15px', color: '#a08f70' })
      .setOrigin(0.5)
      .setDepth(D.HAZARD);
    [px(15), px(27)].forEach((x) => this.add.rectangle(x, FLOOR + 66, 10, 60, 0xb8a98c).setDepth(D.HAZARD).setStrokeStyle(2, 0xa08f70));

    // the clock tower: real time, but only while Jo is in the station
    const c = this.obj('clock');
    this.clockFace = this.img(c.wx + 16, c.wy + 56, 'hub-clock').setDepth(D.INTERACT - 2).setScale(1.4);
    this.clockHands = this.add.graphics().setDepth(D.INTERACT - 1);
    this.drawClock();
  }

  buildRain(x0, w) {
    this.rain = this.add.particles(0, 0, 'hub', {
      frame: 'hub-rain',
      x: { min: x0, max: x0 + w },
      y: { min: 0, max: 200 },
      lifespan: 1600,
      speedY: { min: 420, max: 560 },
      speedX: -40,
      alpha: { start: 0.5, end: 0.1 },
      quantity: 4,
      frequency: 22,
    });
    this.rain.setDepth(D.INTERACT + 4);
    // wet stone at the bottom of the steps, dry at the top
    this.add.rectangle(x0 + w * 0.2, line(29) + 2, w * 0.4, 6, 0x88a0b8, 0.25).setDepth(D.HAZARD);
  }

  drawClock() {
    const g = this.clockHands;
    g.clear();
    const cx = this.clockFace.x;
    const cy = this.clockFace.y;
    const s = this.stationSeconds;
    const m = (s / 60) % 60;
    const h = (s / 3600) % 12;
    g.lineStyle(2, 0x2a2230, 1);
    g.lineBetween(cx, cy, cx + Math.sin((h / 12) * Math.PI * 2) * 12, cy - Math.cos((h / 12) * Math.PI * 2) * 12);
    g.lineStyle(1.5, 0x2a2230, 1);
    g.lineBetween(cx, cy, cx + Math.sin((m / 60) * Math.PI * 2) * 17, cy - Math.cos((m / 60) * Math.PI * 2) * 17);
  }

  tickClock() {
    if (this.state.clockStutter && Math.floor(this.stationSeconds) % 9 === 0) {
      // ticks, then stops for 2 s, then ticks
      this.clockTick.paused = true;
      this.time.delayedCall(2000, () => (this.clockTick.paused = false));
      return;
    }
    sfx('tick');
  }

  persistClock() {
    const secs = this.stationSeconds;
    updateSave((s) => (s.stationSeconds = secs));
  }

  // ---- screens 2-3: the great hall --------------------------------------

  buildHall() {
    const b = this.obj('board');
    this.board = new SplitFlapBoard(this, b.wx, b.wy, this.boardRows());

    // the information desk and Mr. Pemberton
    const desk = this.obj('desk');
    this.img(desk.wx, FLOOR - 14, 'hub-desk').setDepth(D.INTERACT - 1);
    const pem = this.npc('pemberton', this.obj('npc', (o) => o.who === 'pemberton'));
    pem.y = FLOOR - 40;
    pem.setDepth(D.INTERACT - 2); // behind the counter
    this.addInteract(desk.wx, FLOOR - 20, 'pemberton', () => this.talkPemberton());

    // ticket booths, phone booths, lost & found
    const booths = this.obj('booths');
    [-40, 0, 40].forEach((dx) => this.img(booths.wx + dx, FLOOR - 18, 'hub-booth').setDepth(D.INTERACT - 3));
    const phones = this.obj('phones');
    [-14, 14].forEach((dx) => this.img(phones.wx + dx, FLOOR - 16, 'hub-phone').setDepth(D.INTERACT - 3));
    const lf = this.obj('lostfound');
    this.add.rectangle(lf.wx, lf.wy, 90, 40, 0x2a2230).setStrokeStyle(2, 0xc4a25c).setDepth(D.INTERACT - 3);
    this.add.text(lf.wx, lf.wy, 'LOST & FOUND', { fontFamily: 'monospace', fontSize: '9px', color: '#c4a25c' }).setOrigin(0.5).setDepth(D.INTERACT - 2);

    // the bench and the man who sleeps on it under a coat
    const bench = this.obj('bench', (o) => o.sleeper);
    this.img(bench.wx, FLOOR - 10, 'hub-bench').setDepth(D.INTERACT - 2);
    const sl = this.npc('sleeper', this.obj('npc', (o) => o.who === 'sleeper'), { still: true });
    sl.y = FLOOR - 22;
    sl.lamp.setAlpha(0.06);
    this.sleeperCoat = this.add.rectangle(sl.x, FLOOR - 18, 30, 22, 0x6a6a62).setDepth(D.INTERACT + 2);
    this.tweens.add({ targets: this.sleeperCoat, scaleY: 1.04, duration: 2600, yoyo: true, repeat: -1, ease: 'sine.inout' });

    // fountain, pigeons, flowers, luggage carts
    const f = this.obj('fountain');
    this.fountain = this.img(f.wx, FLOOR - 16, 'hub-fountain').setDepth(D.INTERACT - 2);
    this.fountainTimer = this.time.addEvent({ delay: 240, loop: true, callback: () => this.fountainDrop() });
    const pg = this.obj('pigeons');
    this.pigeons = [0, 1, 2, 3].map((i) =>
      this.img(pg.wx + i * 18 - 27, FLOOR - 5, 'hub-pigeon').setDepth(D.INTERACT - 1).setFlipX(i % 2 === 0)
    );
    this.pigeonHome = { x: pg.wx, y: FLOOR - 5 };
    const fl = this.obj('flowers');
    this.flowerCart = this.img(fl.wx, FLOOR - 12, 'hub-flowers').setDepth(D.INTERACT - 2);
    const fs = this.npc('flower', this.obj('npc', (o) => o.who === 'flower'), { still: true, flip: true });
    fs.y = FLOOR - 26;
    // luggage carts roll when Jo bumps them but never block him: a cart
    // shoved into a corner must not become a wall between him and a train
    this.carts = this.objs('cart').slice(0, 1).map((o) => {
      const c = this.physics.add.image(o.wx, FLOOR - 8, 'hub', 'hub-cart').setScale(4).setDepth(D.INTERACT - 2);
      c.body.setSize(10, 3).setOffset(0, 1); // in unscaled frame px (x4 on screen)
      c.setDrag(500, 0).setMaxVelocity(140, 600).setCollideWorldBounds(true);
      this.physics.add.collider(c, this.solids);
      this.physics.add.overlap(this.player, c, (pl, cart) => {
        const dir = Math.sign(cart.x - pl.x) || 1;
        if (Math.abs(pl.body.velocity.x) > 20) cart.setVelocityX(dir * Math.max(80, Math.abs(pl.body.velocity.x) * 0.6));
      });
      return c;
    });

    // the busker at the far pillar
    const bk = this.npc('busker', this.obj('npc', (o) => o.who === 'busker'), { flip: true });
    this.buskerNote = this.time.addEvent({ delay: 1500, loop: true, callback: () => this.buskerPuff(bk) });
    this.addInteract(bk.x, FLOOR - 20, 'busker', () => this.duet(), { when: () => !this.moments.moment1 && this.N < 3 });

    // the mezzanine is a balcony: brass columns under it, a rail along it
    const mezzY = line(HUB_ROWS.MEZZ - 1);
    for (const c of [38, 48, 58]) {
      this.add.rectangle(px(c), (mezzY + FLOOR) / 2, 12, FLOOR - mezzY, 0xc4a25c).setDepth(D.INTERACT - 4).setStrokeStyle(2, 0xa08f70);
      this.add.rectangle(px(c), mezzY + 6, 26, 8, 0xc4a25c).setDepth(D.INTERACT - 4);
    }
    this.add.rectangle(px(47.5), mezzY - 22, 22 * T, 3, 0xa08f70).setDepth(D.INTERACT - 4);
    for (let c = 37; c <= 58; c += 2) this.add.rectangle(px(c), mezzY - 11, 2, 22, 0xa08f70).setDepth(D.INTERACT - 4);
    // the balcony's own slab: the one-way lip alone reads as a wire
    this.add.rectangle(px(47), mezzY + 4, 23 * T, 10, 0xc9b894).setDepth(D.TERRAIN + 1).setStrokeStyle(2, 0xa08f70);

    // the way down: an open grate in the floor, a sign, and a prompt
    const hatchX = px(77);
    this.add.rectangle(hatchX, FLOOR + 3, 34, 8, 0x0a0a12).setDepth(D.TERRAIN + 1);
    this.add.rectangle(hatchX, FLOOR + 3, 38, 12, 0xc4a25c, 0).setStrokeStyle(2, 0xc4a25c).setDepth(D.TERRAIN + 1);
    this.add.rectangle(hatchX + 36, FLOOR - 30, 4, 60, 0x4a4650).setDepth(D.INTERACT - 3);
    this.add.rectangle(hatchX + 36, FLOOR - 58, 96, 22, 0x2e3a52).setStrokeStyle(2, 0xc4a25c).setDepth(D.INTERACT - 3);
    this.add
      .text(hatchX + 36, FLOOR - 58, '\u2193 LEFT LUGGAGE', { fontFamily: 'monospace', fontSize: '9px', color: '#f2e6cc' })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 2);
    this.hatchPrompt = this.add
      .text(hatchX, FLOOR - 40, '[\u2193] down', { fontFamily: 'monospace', fontSize: '12px', color: '#88b8d8', backgroundColor: '#14101c' })
      .setOrigin(0.5)
      .setDepth(80)
      .setVisible(false);
    this.hatchX = hatchX;

    // mezzanine café: Bilal, the dumbwaiter he calls the express
    const cafe = this.obj('cafe');
    this.img(cafe.wx, line(cafe.ty) - 12, 'hub-cafe').setDepth(D.INTERACT - 2);
    const bl = this.npc('bilal', this.obj('npc', (o) => o.who === 'bilal'), { still: true });
    this.addInteract(bl.x, bl.y, 'bilal', () => this.tea());
    this.dumbwaiters = this.objs('dumbwaiter').map((o) => this.img(o.wx, line(o.ty) - 12, 'hub-dumbwaiter').setDepth(D.INTERACT - 2));
    this.bilalUpstairs = true;

    // the sweeper: everywhere, humming, never noticed
    const sw = this.npc('sweeper', this.obj('npc', (o) => o.who === 'sweeper'), { still: true });
    sw.dir = 1;
    sw.lamp.setAlpha(0.08);
    this.sweeper = sw;

    // skylight light bars across the checkered floor
    this.lightBars = [];
    for (let i = 0; i < 4; i++) {
      const bar = this.add
        .rectangle(px(38) + i * 330, FLOOR - 270, 48, 560, 0xf2e6cc, 0.05)
        .setDepth(D.HAZARD)
        .setAngle(-12);
      this.lightBars.push(bar);
    }
  }

  fountainDrop() {
    const mode = this.state.fountain;
    if (mode === 'dry') return;
    if (mode === 'drip' && Math.random() > 0.08) return;
    if (mode === 'trickle' && Math.random() > 0.4) return;
    const d = this.add.circle(this.fountain.x + Phaser.Math.Between(-10, 10), this.fountain.y - 28, 2, 0xd8ecf8, 0.8).setDepth(D.INTERACT - 1);
    this.tweens.add({ targets: d, y: d.y + 26, alpha: 0, duration: 420, ease: 'quad.in', onComplete: () => d.destroy() });
    if (mode === 'drip') sfx('drip');
  }

  buskerPuff(bk) {
    if (this.N >= 3 || this.duetting) return; // the busker has stopped
    const t = this.add.text(bk.x + 14, bk.y - 30, '♪', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580' }).setDepth(D.INTERACT + 2);
    this.tweens.add({ targets: t, y: t.y - 24, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }

  boardRows() {
    const rows = DREAMS.map((d) => {
      const caught = !!this.save.dreams[d.id];
      return caught
        ? { platform: d.platform, title: d.title, departs: '—', status: 'CAUGHT — NO RETURN', dim: true }
        : { platform: d.platform, title: d.title, departs: 'NOW', status: d.scene ? 'BOARDING' : 'DELAYED', dim: false };
    });
    const opened = this.save.flags.hub.gateOpened;
    rows.push(
      opened
        ? { platform: LAST_STOP.platform, title: LAST_STOP.title, departs: '——', status: "WHEN YOU'RE READY", hot: true }
        : { platform: '—', title: '———————————', departs: '—', status: '—', dim: true }
    );
    return rows;
  }

  // ---- screens 3-4: the platforms ----------------------------------------

  buildPlatforms() {
    for (const d of DREAMS) {
      const caught = !!this.save.dreams[d.id];
      const running = !!d.scene;
      const p = this.obj('platform', (o) => o.platform === d.platform);
      const bench = this.obj('bench', (o) => o.platform === d.platform);
      const lamp = this.obj('lamp', (o) => o.platform === d.platform);
      const bayX0 = BAYS[d.platform - 1] * T;
      const bayMid = bayX0 + 3.5 * T;

      // the overhead sign: readable from the far end of the shed
      this.platformSign(d, bayMid, caught, running);
      // a low brass post marks the bay's edge (decor, never a wall)
      this.add.rectangle(bayX0 + 6, FLOOR - 14, 6, 28, 0xc4a25c).setDepth(D.INTERACT - 3);
      this.add.circle(bayX0 + 6, FLOOR - 30, 5, 0xc4a25c).setDepth(D.INTERACT - 3);

      this.img(bench.wx, FLOOR - 10, 'hub-bench').setDepth(D.INTERACT - 2);
      const lampImg = this.img(lamp.wx, FLOOR - 50, caught || !running ? 'hub-lamp-off' : 'hub-lamp').setDepth(D.INTERACT - 2);
      if (!caught && running) this.add.circle(lamp.wx, FLOOR - 62, 30, 0xf2d580, 0.1).setDepth(D.INTERACT - 3);

      this.platformProps(d, bayX0);
      const texture = running ? `train_${d.id}` : `train_${d.id}_dark`;
      const train = new Train(this, d.platform, p.wx, FLOOR, {
        texture,
        outOfService: !running,
        dead: caught && d.id !== this.returnedFrom,
      });
      this.trains[d.id] = train;

      if (caught) {
        // the platform goes quiet: 60% brightness, RESERVED, pigeons roost
        this.add.rectangle(bayMid, FLOOR - 160, 7 * T, 320, 0x0a0a14, 0.4).setDepth(D.INTERACT + 3);
        this.img(bench.wx - 10, FLOOR - 24, 'hub-pigeon').setDepth(D.INTERACT - 1);
        this.img(lamp.wx + 6, FLOOR - 66, 'hub-pigeon').setDepth(D.INTERACT - 1).setFlipX(true);
      }
      this.addInteract(p.wx, FLOOR - 20, 'train', () => this.board_(d), { radius: 52, when: () => this.trains[d.id].state === 'idle' });
      d._lamp = lampImg;
    }
  }

  // "PLATFORM 1 · FIVE-STAR DREAM", hung from the shed roof in the train's own
  // colours. Lines that don't run get a red bar you can read from the hall.
  platformSign(d, x, caught, running) {
    const y = FLOOR - 118;
    const w = 196;
    const body = caught ? 0x2a2a30 : running ? d.livery.body : 0x2e2e36;
    const trim = caught ? 0x4a4a52 : running ? d.livery.trim : 0x5a5a62;
    const text = caught ? '#8a8478' : running ? '#f2e6cc' : '#8a8a90';
    this.add.rectangle(x, y - 34, 3, 40, 0x4a4650).setDepth(D.INTERACT - 3);
    this.add.rectangle(x, y, w, 40, body).setStrokeStyle(3, trim).setDepth(D.INTERACT - 2);
    this.add
      .text(x, y - 9, `PLATFORM ${d.platform}`, { fontFamily: 'monospace', fontSize: '10px', color: text })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 1);
    this.add
      .text(x, y + 8, d.title, { fontFamily: 'monospace', fontSize: '13px', color: text, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 1);
    if (caught) {
      this.add.text(x, y + 30, 'CAUGHT — NO RETURN SERVICE', { fontFamily: 'monospace', fontSize: '9px', color: '#6a6478' }).setOrigin(0.5).setDepth(D.INTERACT - 1);
    } else if (!running) {
      // the bar across the sign is what you read from far away
      this.add.rectangle(x, y + 30, w, 16, 0xc03a2a).setDepth(D.INTERACT - 1);
      this.add.text(x, y + 30, 'NOT IN SERVICE', { fontFamily: 'monospace', fontSize: '10px', color: '#f2e6cc', fontStyle: 'bold' }).setOrigin(0.5).setDepth(D.INTERACT);
    } else {
      const tag = this.add.text(x, y + 30, '● BOARDING', { fontFamily: 'monospace', fontSize: '10px', color: '#7ec87e' }).setOrigin(0.5).setDepth(D.INTERACT - 1);
      this.tweens.add({ targets: tag, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
    }
  }

  // one identifying prop set per dream, readable from a distance
  platformProps(d, x0) {
    const y = FLOOR;
    const dep = D.INTERACT - 3;
    const g = this.add.graphics().setDepth(dep);
    const at = (dx) => x0 + dx;
    switch (d.propsKind) {
      case 'produce':
        g.fillStyle(0x6a4a32, 1);
        g.fillRect(at(12), y - 26, 26, 26);
        g.fillRect(at(40), y - 18, 22, 18);
        g.fillStyle(0xe86a6a, 1);
        [14, 22, 30].forEach((dx) => g.fillCircle(at(dx), y - 30, 4));
        g.fillStyle(0x2a2230, 1);
        g.fillRect(at(150), y - 60, 40, 30);
        this.add.text(at(170), y - 45, 'MENU', { fontFamily: 'monospace', fontSize: '8px', color: '#f2e6cc' }).setOrigin(0.5).setDepth(dep + 1);
        this.time.addEvent({ delay: 700, loop: true, callback: () => this.smell(at(26), y - 34) });
        break;
      case 'posters':
        [0, 1, 2].forEach((i) => {
          g.fillStyle(i === 1 ? 0xe8dcc8 : 0x3a1420, 1);
          g.fillRect(at(130 + i * 26), y - 92, 22, 30);
        });
        g.fillStyle(0x1a1a20, 0.5);
        g.fillRect(at(60), y - 6, 36, 6); // case-shaped shadow
        break;
      case 'blocks':
        g.fillStyle(0xd8d8e0, 1);
        g.fillRect(at(20), y - 14, 30, 6);
        g.fillRect(at(24), y - 22, 8, 8);
        g.fillRect(at(40), y - 18, 8, 4);
        break;
      case 'easels':
        g.lineStyle(3, 0x6a5a3a, 1);
        g.lineBetween(at(30), y, at(40), y - 60);
        g.lineBetween(at(50), y, at(40), y - 60);
        g.fillStyle(0xf2e6cc, 1);
        g.fillRect(at(28), y - 56, 26, 22);
        g.fillStyle(0x88b8d8, 1);
        g.fillRect(at(32), y - 50, 10, 8);
        break;
      case 'boxes':
        g.fillStyle(0xb8a98c, 1);
        [0, 1, 2].forEach((i) => g.fillRect(at(20 + i * 6), y - 18 - i * 16, 34, 16));
        break;
      case 'crates':
        g.fillStyle(0x4a5a42, 1);
        g.fillRect(at(20), y - 30, 40, 30);
        g.lineStyle(2, 0x2a3a26, 1);
        g.strokeRect(at(20), y - 30, 40, 30);
        break;
      case 'lights':
        [0, 1, 2, 3].forEach((i) => this.add.circle(at(24 + i * 16), y - 96, 4, 0xf2d580, 0.9).setDepth(dep));
        g.fillStyle(0x3a1420, 1);
        g.fillRect(at(16), y - 90, 60, 6);
        break;
      case 'lockers':
        g.fillStyle(0x8a9aa8, 1);
        [0, 1, 2].forEach((i) => g.fillRect(at(20 + i * 16), y - 60, 14, 60));
        g.fillStyle(0xf2e6cc, 1);
        g.fillRect(at(150), y - 40, 26, 30);
        break;
      default:
        break;
    }
  }

  smell(x, y) {
    if (this.save.dreams.chef) return;
    const s = this.add.text(x, y, '~', { fontFamily: 'monospace', fontSize: '12px', color: '#c8c0b0' }).setDepth(D.INTERACT - 1).setAlpha(0.6);
    this.tweens.add({ targets: s, y: y - 30, x: x + 6, alpha: 0, duration: 1600, onComplete: () => s.destroy() });
  }

  // ---- screen 5: the service gate ----------------------------------------

  buildGate() {
    const g = this.obj('gate');
    const gx = g.wx + 16;
    const top = g.ty * T;
    const bottom = (g.ty + g.h) * T;
    this.gateX = gx;
    // the gate tiles themselves are solid (RoomBuilder). Over them: paint,
    // tally, sign, light.
    this.add.rectangle(gx, (top + bottom) / 2, 64, bottom - top, 0x2e4a34, 0.55).setDepth(D.HAZARD);
    this.tallyG = this.add.graphics().setDepth(D.HAZARD + 1);
    this.drawTally(this.state.tally);
    const sign = this.obj('sign');
    this.add.rectangle(sign.wx + 16, sign.wy, 120, 26, 0xf2e6cc).setDepth(D.INTERACT - 2).setAngle(-2);
    this.add.text(sign.wx + 16, sign.wy, sign.text, { fontFamily: 'monospace', fontSize: '11px', color: '#2a2230' }).setOrigin(0.5).setDepth(D.INTERACT - 1).setAngle(-2);

    // a bar of cold blue light between the leaves once it is ajar
    this.gateLight = this.add.rectangle(gx, (top + bottom) / 2, 8, bottom - top, 0x88b8d8, 0).setDepth(D.INTERACT + 2);
    this.gateGlow = this.add.rectangle(gx - 40, (top + bottom) / 2, 80, bottom - top, 0x88b8d8, 0).setDepth(D.INTERACT + 1);

    // chain + padlock with the ribbon "2"
    this.gateChain = this.img(gx, FLOOR - 200, 'hub-chain').setDepth(D.INTERACT + 3).setScale(1.6, 1.4);
    this.gateLock = this.add.text(gx, FLOOR - 220, '🔒 2', { fontSize: '12px', fontFamily: 'monospace', color: '#f2e6cc' }).setOrigin(0.5).setDepth(D.INTERACT + 4);
    if (this.save.flags.hub.gateOpened) {
      this.gateChain.setVisible(false);
      this.gateLock.setVisible(false);
    }

    // turnstile with a mechanical counter reading dreamsCaught
    const t = this.obj('turnstile');
    this.img(t.wx, FLOOR - 14, 'hub-turnstile').setDepth(D.INTERACT - 2);
    this.img(t.wx, FLOOR - 52, 'hub-counter').setDepth(D.INTERACT - 2);
    this.add
      .text(t.wx, FLOOR - 52, String(this.save.dreamsCaught).padStart(3, '0'), { fontFamily: 'monospace', fontSize: '11px', color: '#f2e6cc' })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 1);

    this.addInteract(gx - 40, FLOOR - 20, 'gate', () => this.pushGate(), { radius: 76 }); // the turnstile step raises Jo
  }

  drawTally(count) {
    const g = this.tallyG;
    g.clear();
    const rand = new Phaser.Math.RandomDataGenerator(['tally']);
    const gate = this.obj('gate');
    const top = gate.ty * T + 12;
    const bottom = (gate.ty + gate.h) * T - 8;
    const left = this.gateX - 28;
    let x = left;
    let y = top;
    g.lineStyle(1, 0xf2e6cc, 1);
    for (let i = 0; i < count; i++) {
      if (i % 5 === 4) g.lineBetween(x - 9, y + 9, x + 2, y - 1);
      else g.lineBetween(x, y, x + rand.between(-1, 1), y + 9);
      x += i % 5 === 4 ? 6 : 3;
      if (x > left + 52) {
        x = left;
        y += 13;
        if (y > bottom) {
          // more tally than gate: start layering, fainter
          y = top + rand.between(0, 6);
          g.lineStyle(1, 0xf2e6cc, 0.5);
        }
      }
    }
  }

  async pushGate() {
    if (this.save.flags.hub.gateOpened) {
      if (!this.save.flags.hub.gateSpoke) {
        updateSave((s) => (s.flags.hub.gateSpoke = true));
        this.save.flags.hub.gateSpoke = true;
        await this.say('gate', "Two. Come in when you're done counting. Or don't. I'll count for both of us.", false);
        sfx('click'); // the turnstile clicks once by itself
        return;
      }
      this.boardLastStop();
      return;
    }
    sfx('knock');
    this.cameras.main.shake(80, 0.002);
    this.time.delayedCall(900, () => {
      sfx('knock'); // something on the other side knocks back once
      this.cameras.main.shake(60, 0.003);
    });
    this.floatText(this.gateX - 40, FLOOR - 80, `chained.  ${2 - this.save.dreamsCaught} more.`, '#c8c0b0');
  }

  // ---- undercroft & roof ---------------------------------------------------

  buildUndercroft() {
    const tk = this.obj('tea_kitchen');
    this.add.rectangle(tk.wx, UNDER - 30, 120, 60, 0x3a2a22).setDepth(D.INTERACT - 3);
    this.img(tk.wx - 30, UNDER - 10, 'hub-teapot').setDepth(D.INTERACT - 2);
    this.img(tk.wx + 20, UNDER - 10, 'hub-teapot').setDepth(D.INTERACT - 2);
    this.add.text(tk.wx, UNDER - 52, "BILAL'S", { fontFamily: 'monospace', fontSize: '9px', color: '#f2d580' }).setOrigin(0.5).setDepth(D.INTERACT - 2);
    const cg = this.obj('cages');
    [-44, 0, 44].forEach((dx) => this.img(cg.wx + dx, UNDER - 12, 'hub-cage').setDepth(D.INTERACT - 2));

    const sb = this.obj('signal_box');
    this.add.rectangle(sb.wx, UNDER - 40, 110, 80, 0x2a2a34).setStrokeStyle(2, 0x4a4a52).setDepth(D.INTERACT - 3);
    const levers = [-30, 0, 30].map((dx) => this.img(sb.wx + dx, UNDER - 10, 'hub-lever').setDepth(D.INTERACT - 2));
    this.addInteract(sb.wx, UNDER - 20, 'levers', () => {
      sfx('clang');
      const l = Phaser.Utils.Array.GetRandom(levers);
      this.tweens.add({ targets: l, angle: l.angle === 0 ? -30 : 0, duration: 150 });
    });

    // the wall of lost dreams: one row per catchable dream; a "JO" tag per catch
    const ld = this.obj('lost_dreams');
    DREAMS.forEach((d, i) => {
      const y = UNDER - 14 - (i % 4) * 22;
      const x = ld.wx - 120 + Math.floor(i / 4) * 130;
      for (let k = 0; k < 6; k++) {
        this.img(x + k * 20, y, this.save.dreams[d.id] && k === 5 ? 'hub-suitcase-tag' : 'hub-suitcase').setDepth(D.INTERACT - 2).setAlpha(0.85);
      }
    });
    this.add.text(ld.wx, UNDER - 106, 'LEFT LUGGAGE', { fontFamily: 'monospace', fontSize: '9px', color: '#8a8478' }).setOrigin(0.5).setDepth(D.INTERACT - 2);

    // the slot: the far side of the service gate. A corridor of tally under
    // one bulb, receding. Nothing moves in it.
    const slot = this.obj('gate_slot');
    const sx = slot.wx;
    const sy = UNDER - 40;
    this.add.rectangle(sx, sy, 56, 40, 0x0a0a10).setDepth(D.INTERACT - 3).setStrokeStyle(2, 0x4a4a52);
    const g = this.add.graphics().setDepth(D.INTERACT - 2);
    g.lineStyle(1, 0x8a8478, 0.7);
    for (let i = 0; i < 14; i++) {
      const d = i / 14;
      g.lineBetween(sx - 24 + d * 20, sy - 14 + d * 6, sx - 24 + d * 20, sy - 6 + d * 3);
      g.lineBetween(sx + 24 - d * 20, sy - 14 + d * 6, sx + 24 - d * 20, sy - 6 + d * 3);
    }
    this.add.circle(sx, sy - 12, 3, 0xf2e6cc, 0.9).setDepth(D.INTERACT - 1);
    this.add.circle(sx, sy - 6, 16, 0xf2e6cc, 0.08).setDepth(D.INTERACT - 1);
    this.addInteract(sx, sy + 10, 'slot', () => this.floatText(sx, sy - 40, 'a corridor. tally marks. one bulb.\nnothing moves.', '#8a8478'));
  }

  buildRoof() {
    const wt = this.obj('water_tower');
    this.img(wt.wx, wt.wy + 6, 'hub-watertower').setDepth(D.INTERACT - 3);
    const lofts = this.obj('lofts');
    [-30, 20].forEach((dx) => this.img(lofts.wx + dx, ROOF - 12, 'hub-loft').setDepth(D.INTERACT - 3));
    const hatch = this.obj('hatch');
    this.img(hatch.wx, hatch.wy, 'hub-hatch').setDepth(D.TERRAIN + 1).setAlpha(0.6);

    const kid = this.npc('kite', this.obj('npc', (o) => o.who === 'kite'));
    kid.y = ROOF - 24;
    this.kite = this.img(kid.x + 60, ROOF - 120, 'hub-kite').setDepth(D.INTERACT - 1);
    this.kiteString = this.add.graphics().setDepth(D.INTERACT - 2);
    this.addInteract(kid.x, ROOF - 20, 'kite', () => this.holdKite(), { when: () => !this.moments.moment3 });
  }

  buildTravelers() {
    this.travelers = new Silhouettes(this, {
      count: this.state.travelers,
      y: FLOOR,
      x0: DOORS_X,
      x1: SHED_END_X,
      spawnX: DOORS_X,
    });
    // the queue on the steps, moving in, never out
    const q = this.obj('queue');
    this.queue = new Silhouettes(this, {
      count: Math.round(this.state.travelers / 6),
      y: line(29),
      x0: px(2),
      x1: px(10),
      spawnX: px(2),
    });
  }

  // a 6-minute day: light bars sweep across the floor, the sky warms and cools
  buildDayCycle() {
    this.lightBars.forEach((bar, i) => {
      this.tweens.add({ targets: bar, x: bar.x + 160, duration: 360000, yoyo: true, repeat: -1, ease: 'sine.inout', delay: -i * 30000 });
    });
    this.dayTint = this.add
      .rectangle(480, 270, 1800, 1000, 0xf2c078, 0)
      .setScrollFactor(0)
      .setDepth(D.INTERACT + 5);
    this.tweens.add({ targets: this.dayTint, fillAlpha: 0.08, duration: 180000, yoyo: true, repeat: -1, ease: 'sine.inout' });
  }

  // §4 applied in one place
  applyState() {
    const st = this.state;
    // desaturation: a cool grey wash over everything but the people and HUD
    this.washRect = this.add
      .rectangle(480, 270, 1800, 1000, 0x3a3a44, st.sat * 0.55)
      .setScrollFactor(0)
      .setDepth(D.INTERACT + 6);
    // skylight bars: fewer as the hall darkens
    this.lightBars.forEach((b, i) => b.setVisible(i < st.skylightBars));
    // fountain, flowers
    if (st.fountain === 'dry') this.fountain.setFrame('hub-fountain-dry');
    this.flowerCart.setAlpha(st.flowers === 0 ? 0.35 : 1);
    if (st.flowers < 6) {
      const cover = this.add.rectangle(this.flowerCart.x + (st.flowers / 6) * 18 + 18, this.flowerCart.y - 12, (1 - st.flowers / 6) * 36, 12, 0x2a2230, 1).setDepth(D.INTERACT - 1);
      cover.setOrigin(1, 0.5).x = this.flowerCart.x + 18;
    }
    // gate light
    this.gateLight.setFillStyle(0x88b8d8, st.gateLight * 0.9);
    this.gateGlow.setFillStyle(0x88b8d8, st.gateLight * 0.12);
    // NPCs stay warm: their lamps brighten as the hall dims
    for (const s of Object.values(this.npcs)) {
      if (s.lamp && s.who !== 'sleeper' && s.who !== 'sweeper') s.lamp.setAlpha(0.13 + st.sat * 0.5);
    }
  }

  // ---- scripts -------------------------------------------------------------

  // Opening: the middle door turns, the hall opens, the camera pulls back to
  // the vista — light bars, the board clacking through every destination,
  // steam from eight trains — and the title fades in over the board.
  async opening() {
    if (this.openingDone) return;
    this.openingDone = true;
    this.player.controlLockUntil = this.time.now + 12000;
    this.player.body.setVelocity(0, 0);
    this.tweens.add({ targets: this.mainDoor, scaleX: 0.1, duration: 500, yoyo: true });
    sfx('click');
    const cam = this.cameras.main;
    const inv = 1 / 0.62;
    // Camera, title and return are one chain, so nothing can overlap: pull
    // back to the vista -> hold while the title reads -> come back to Jo.
    this.time.delayedCall(500, () => {
      cam.stopFollow();
      this.tweens.killTweensOf(cam);
      for (const t of Object.values(this.trains)) for (let i = 0; i < 8; i++) this.time.delayedCall(i * 160, () => t.puff());
      this.board.rows.forEach((r, i) => this.time.delayedCall(300 + i * 220, () => this.board.setRow(i, r)));
      this.tweens.add({
        targets: cam,
        scrollX: px(60) - 480,
        scrollY: FLOOR - 250 - 270,
        zoom: 0.62,
        duration: 2600,
        ease: 'sine.inout',
        onComplete: () => {
          const title = this.add
            .text(480, 270 - 90 * inv, 'DREAMCATCHER', { fontFamily: 'monospace', fontSize: '44px', color: '#f2e6cc', stroke: '#14141c', strokeThickness: 6 })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(240)
            .setScale(inv)
            .setAlpha(0);
          const sub = this.add
            .text(480, 270 - 50 * inv, 'Crossroads Station. Everyone here is going somewhere else.', { fontFamily: 'monospace', fontSize: '14px', color: '#e8dcc8', stroke: '#14141c', strokeThickness: 4 })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(240)
            .setScale(inv)
            .setAlpha(0);
          this.tweens.add({ targets: title, alpha: 1, duration: 1200 });
          this.tweens.add({
            targets: sub,
            alpha: 1,
            duration: 1200,
            delay: 700,
            hold: 2200,
            yoyo: true,
            onComplete: () => {
              this.tweens.add({ targets: title, alpha: 0, duration: 700, onComplete: () => [title, sub].forEach((t) => t.destroy()) });
              this.tweens.add({
                targets: cam,
                scrollX: this.player.x - 480,
                scrollY: this.player.y - 270,
                zoom: 1,
                duration: 1200,
                ease: 'sine.inout',
                onComplete: () => {
                  cam.startFollow(this.player, true, 0.1, 0.1);
                  this.player.controlLockUntil = 0;
                },
              });
            },
          });
        },
      });
    });
  }

  async firstDesk() {
    await this.dialog.show([
      { name: 'Mr. Pemberton', text: 'New face. Which dream, sir? They all leave at the same time.', portrait: 'hub:hub-pemberton_0' },
      { name: 'Jo', text: 'How do I choose?' },
      { name: 'Mr. Pemberton', text: "People usually don't. They just get on the first one that stops.", portrait: 'hub:hub-pemberton_0' },
    ]);
    this.setObjective('board any train');
    this.floatText(this.hatchX, FLOOR - 90, 'the grate past the fountain goes down', '#88b8d8');
  }

  async talkPemberton() {
    if (this.N === 0 && !this.visitLines.desk0) {
      this.visitLines.desk0 = true;
      return this.firstDesk();
    }
    if (this.returnedFrom && !this.visitLines.deskReturn) {
      this.visitLines.deskReturn = true;
      return this.say('pemberton', PEMBERTON_RETURN[this.N] || 'Back again.');
    }
    if (this.save.flags.hub.gateOpened) return this.say('pemberton', 'Mind the gap.');
    if (this.N > 0 && !this.visitLines.luggage) {
      this.visitLines.luggage = true;
      return this.say('pemberton', "Left luggage is downstairs, sir -- the grate past the fountain. You'll want to see whose name is on the tag.");
    }
    return this.say('pemberton', this.N === 0 ? 'Any platform, sir. They all leave now.' : `${this.N} caught. The board keeps the count.`);
  }

  async talkRo() {
    if (this.returnedFrom && !this.visitLines.ro) {
      this.visitLines.ro = true;
      const d = dreamById(this.returnedFrom);
      return this.say('ro', d ? d.roLine : 'You have been somewhere.');
    }
    return this.say('ro', this.N === 0 ? 'Shoes first. Dreams after. Sit.' : 'Sit a minute. The trains wait, whatever the board says.');
  }

  async tea() {
    if (this.visitLines.tea) return this.say('bilal', 'Still warm.');
    this.visitLines.tea = true;
    sfx('tea');
    const cup = this.img(this.player.x, this.player.y - 40, 'hub-teapot').setDepth(D.INTERACT + 3).setScale(0.6);
    this.tweens.add({ targets: cup, y: cup.y - 20, alpha: 0, duration: 1800, onComplete: () => cup.destroy() });
    const lineN = BILAL_TEA[this.N];
    if (lineN) return this.say('bilal', lineN);
    await this.dialog.show([{ name: 'Bilal', text: '…', portrait: 'hub:hub-bilal_0' }]);
    return this.say('bilal', "You know the sweeper's been here longer than the trains?");
  }

  // the chain drops the first time Jo re-enters the hall with two dreams
  async chainDrop() {
    if (this.save.flags.hub.gateOpened || this.N < 2) return;
    updateSave((s) => (s.flags.hub.gateOpened = true));
    this.save.flags.hub.gateOpened = true;
    const cam = this.cameras.main;
    this.player.controlLockUntil = this.time.now + 5200;
    cam.stopFollow();
    this.tweens.add({ targets: cam, scrollX: this.gateX - 120 - 480, scrollY: FLOOR - 160 - 270, duration: 1800, ease: 'sine.inout' });
    this.time.delayedCall(1800, () => {
      sfx('scrape');
      this.tweens.add({ targets: this.gateChain, y: FLOOR - 10, angle: 40, alpha: 0.4, duration: 900, ease: 'bounce.out' });
      this.tweens.add({ targets: this.gateLock, y: FLOOR - 6, alpha: 0, duration: 900 });
      this.tweens.add({ targets: this.gateLight, fillAlpha: 0.35, duration: 1400 });
      this.tweens.add({ targets: this.gateGlow, fillAlpha: 0.06, duration: 1400 });
      sfx('adding');
    });
    this.time.delayedCall(3400, () => {
      const rows = this.boardRows();
      this.board.setRow(rows.length - 1, rows[rows.length - 1]);
      this.tweens.add({
        targets: cam,
        scrollX: this.player.x - 480,
        scrollY: this.player.y - 270,
        duration: 1400,
        ease: 'sine.inout',
        onComplete: () => cam.startFollow(this.player, true, 0.1, 0.1),
      });
      this.setObjective('board any train — or the last stop');
    });
  }

  // return from a dream: the only returning train the player ever sees
  runReturn() {
    const d = dreamById(this.returnedFrom);
    const train = d && this.trains[d.id];
    this.player.controlLockUntil = this.time.now + 7500;
    this.setObjective('');
    if (train) {
      // the row still says BOARDING while the train stands there; it flips
      // the moment the train has gone for good
      const idx0 = DREAMS.findIndex((x) => x.id === d.id);
      this.board.setRow(idx0, { platform: d.platform, title: d.title, departs: 'NOW', status: 'ARRIVED', dim: false }, true);
      train.returnAndDie(() => {
        const idx = DREAMS.findIndex((x) => x.id === d.id);
        const rows = this.boardRows();
        this.board.setRow(idx, rows[idx]);
        d._lamp.setFrame('hub-lamp-off');
        sfx('scratch');
        this.time.delayedCall(300, () => sfx('scratch'));
        this.drawTally(this.state.tally);
        // then, and only then, the tint darkens
        this.tweens.add({ targets: this.washRect, fillAlpha: this.state.sat * 0.55, duration: 2400 });
        this.setObjective(this.N >= 2 ? 'board any train — or the last stop' : 'board any train');
      });
      this.washRect.setFillStyle(0x3a3a44, hubState(Math.max(0, this.N - 1)).sat * 0.55);
    }
  }

  // ---- boarding --------------------------------------------------------------

  async board_(d) {
    if (this.save.dreams[d.id]) {
      await this.dialog.show([{ name: 'Conductor', text: 'No return service on this line, sir. Never was.' }]);
      return;
    }
    if (!d.scene) {
      await this.dialog.show([{ name: 'Conductor', text: `${d.title}? Not in service. The rails go out that way, but nothing runs on them yet.` }]);
      return;
    }
    // a question about the journey ahead, and a real choice
    const answer = await this.dialog.show([
      {
        name: 'Conductor',
        text: d.conductor,
        choices: [
          { label: 'Board this train', value: 'board' },
          { label: 'Not yet', value: 'wait' },
        ],
      },
    ]);
    if (answer !== 'board') {
      this.floatText(this.player.x, this.player.y - 50, 'the doors stay open.', '#c8c0b0');
      return;
    }
    const train = this.trains[d.id];
    this.player.controlLockUntil = this.time.now + 99999;
    this.player.body.setVelocity(0, 0);
    this.player.shown = false;
    this.persistClock();
    sfx('snap');
    train.depart(() => {
      const cam = this.cameras.main;
      cam.fadeOut(600, 8, 8, 12);
      this.time.delayedCall(650, () => {
        music.stop();
        this.scene.start('Intro', { levelKey: d.id });
      });
    });
  }

  boardLastStop() {
    this.showCard(
      ['THE LAST STOP', '', 'The Counter is waiting on the other side.', 'That part of the line is still being laid.', '', '[X] Back to the hall'],
      () => {}
    );
  }

  // ---- small moments -----------------------------------------------------

  markMoment(id, text) {
    this.moments[id] = true;
    updateSave((s) => (s.flags.hub[id] = true));
    sting.secret();
    this.floatText(this.player.x, this.player.y - 70, text, '#f2d580');
  }

  duet() {
    if (this.duetting) return;
    this.duetting = true;
    this.player.controlLockUntil = this.time.now + 99999;
    this.player.body.setVelocity(0, 0);
    this.phrase = new Phrases(this, {
      bpm: 92,
      phrases: [[1, 0, 1, 1, 0, 1, 1, 0]],
      window: 170,
      voice: accordion,
      label: 'the busker plays. answer him.',
      onDone: (passes) => {
        this.phrase.destroy();
        this.phrase = null;
        this.duetting = false;
        this.player.controlLockUntil = 0;
        if (passes >= 1) this.markMoment('moment1', "He'd been playing to the board for years.");
        else this.floatText(this.player.x, this.player.y - 60, 'he smiles anyway.', '#c8c0b0');
      },
    });
    this.phrase.start();
  }

  holdKite() {
    if (this.holdingKite) return;
    this.holdingKite = true;
    this.player.controlLockUntil = this.time.now + 4200;
    this.player.body.setVelocity(0, 0);
    this.floatText(this.npcs.kite.x, ROOF - 70, '"hold this? my shoe."', '#c8c0b0');
    this.kiteHolder = this.player;
    this.time.delayedCall(4000, () => {
      this.kiteHolder = null;
      this.holdingKite = false;
      this.markMoment('moment3', 'Up there, the platforms looked like piano keys.');
    });
  }

  // ---- update ---------------------------------------------------------------

  handleModalUpdate() {
    if (this.dialogActive || this.puzzleActive) return true;
    if (this.cardActive) {
      if (Phaser.Input.Keyboard.JustDown(this.player.keys.X)) {
        const fn = this.cardConfirm;
        this.closeCard();
        if (fn) fn();
      }
      return true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.showCard(['Paused', '', 'The station keeps the time.', '', '[X] Back'], null);
      return true;
    }
    this.cameras.main.followOffset.x = this.player.flipX ? 48 : -48;
    return false;
  }

  update(time, delta) {
    if (this.handleModalUpdate()) return;
    const dt = delta / 1000;
    const p = this.player;
    p.update(time, delta);
    this.stationSeconds += dt;
    if (Math.floor(this.stationSeconds) % 5 === 0 && !this._clockDrawn) this.drawClock();
    this._clockDrawn = Math.floor(this.stationSeconds) % 5 === 0;

    if (this.phrase) {
      this.phrase.update(time);
      if (Phaser.Input.Keyboard.JustDown(this.keyQ) || Phaser.Input.Keyboard.JustDown(p.keys.E)) this.phrase.notePressed(time);
    }

    // interacts
    let nearest = null;
    for (const it of this.interacts) {
      if (it.used && it.once) continue;
      if (!it.when()) continue;
      const d = Phaser.Math.Distance.Between(p.x, p.y, it.x, it.y);
      if (d < it.radius && (!nearest || d < nearest.d)) nearest = { it, d };
    }
    if (nearest && !this.phrase) {
      this.promptText.setVisible(true).setPosition(nearest.it.x, nearest.it.y - 34);
      if (Phaser.Input.Keyboard.JustDown(p.keys.E)) {
        nearest.it.used = true;
        nearest.it.cb();
      }
    } else {
      this.promptText.setVisible(false);
    }

    // the opening: crossing the door on the first visit
    if (this.firstVisit && !this.openingDone && p.x > this.hallEntryX) this.opening();
    // the chain drops on the first re-entry with two dreams
    if (this.N >= 2 && !this.save.flags.hub.gateOpened && p.x > px(30) && !this.chainDropping) {
      this.chainDropping = true;
      this.chainDrop();
    }
    // Pemberton meets Jo at the desk on the way in
    const pem = this.npcs.pemberton;
    if (pem && Math.abs(p.x - pem.x) < 70 && Math.abs(p.y - pem.y) < 60) {
      if (this.N === 0 && !this.visitLines.desk0 && this.openingDone) {
        this.visitLines.desk0 = true;
        this.firstDesk();
      } else if (this.returnedFrom && !this.visitLines.deskReturn && time > 8000) {
        this.visitLines.deskReturn = true;
        this.say('pemberton', PEMBERTON_RETURN[this.N] || 'Back again.');
      }
    }
    // the last walk: single lines, no box, as Jo passes each lamp
    if (this.save.flags.hub.gateOpened) {
      for (const [who, text] of Object.entries(LAST_WALK)) {
        const s = this.npcs[who];
        if (!s || this.visitLines[`walk_${who}`]) continue;
        if (Math.abs(p.x - s.x) < 40 && Math.abs(p.y - s.y) < 50) {
          this.visitLines[`walk_${who}`] = true;
          this.floatText(s.x, s.y - 50, text, '#f2e6cc');
          if (who === 'flower' && this.state.flowers <= 1) updateSave((sv) => (sv.flags.hub.lastFlower = true));
        }
      }
      if (this.moments.moment1 && this.moments.moment2 && this.moments.moment3 && !this.sleeperAwake) {
        this.sleeperAwake = true;
        this.sleeperCoat.setVisible(false);
        this.npcs.sleeper.setFrame('hub-sleeper_1');
        this.tweens.add({ targets: this.npcs.sleeper, y: this.npcs.sleeper.y - 3, duration: 600, yoyo: true, repeat: 2 });
      }
    }

    // the bench: sit next to the sleeping man for 8 s
    const sl = this.npcs.sleeper;
    if (!this.moments.moment2 && sl && Math.abs(p.x - sl.x) < 48 && Math.abs(p.y - sl.y) < 40 && p.crouching) {
      this.benchTime = (this.benchTime || 0) + dt;
      if (this.benchTime > 8) this.markMoment('moment2', "He wasn't waiting for a train.");
    } else this.benchTime = 0;

    // pigeons scatter and come back
    for (const bird of this.pigeons) {
      const near = Math.abs(p.x - bird.x) < 60 && Math.abs(p.y - bird.y) < 60;
      if (near && !bird.flying) {
        bird.flying = true;
        this.tweens.add({ targets: bird, y: bird.y - 120, x: bird.x + Phaser.Math.Between(-60, 60), duration: 700, ease: 'quad.out', onComplete: () => {
          this.time.delayedCall(2500, () => this.tweens.add({ targets: bird, y: this.pigeonHome.y, duration: 900, onComplete: () => (bird.flying = false) }));
        } });
      }
    }

    // the sweeper drifts between screens, humming
    const sw = this.sweeper;
    if (sw) {
      sw.x += sw.dir * 18 * dt;
      if (sw.x > px(138)) sw.dir = -1;
      if (sw.x < px(28)) sw.dir = 1;
      sw.setFlipX(sw.dir < 0);
      sw.setFrame(Math.floor(sw.x / 14) % 2 ? 'hub-sweeper_1' : 'hub-sweeper_0');
      sw.lamp.setPosition(sw.x, sw.y - 6);
      if (Math.floor(time / 2400) !== sw.lastHum && Math.abs(p.x - sw.x) < 300) {
        sw.lastHum = Math.floor(time / 2400);
        const t = this.add.text(sw.x + 10, sw.y - 28, '♩', { fontFamily: 'monospace', fontSize: '11px', color: '#c8c0b0' }).setDepth(D.INTERACT + 2).setAlpha(0.6);
        this.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 1600, onComplete: () => t.destroy() });
      }
    }

    // Bilal takes the express -- the dumbwaiter -- to whichever floor Jo is
    // on: he steps into the one on his level, and steps out of the other.
    const bl = this.npcs.bilal;
    if (bl && !this.bilalRiding) {
      // he stays in his café unless Jo is on the other floor AND nearby --
      // then the tea comes to you
      const wantUp = p.y < FLOOR - 120;
      if (wantUp !== this.bilalUpstairs && Math.abs(p.x - bl.x) < 420) {
        this.bilalRiding = true;
        const [upDw, downDw] = this.dumbwaiters;
        const from = this.bilalUpstairs ? upDw : downDw;
        const to = this.bilalUpstairs ? downDw : upDw;
        this.tweens.add({
          targets: bl,
          x: from.x,
          duration: 700,
          onComplete: () => {
            sfx('click');
            this.tweens.add({
              targets: [bl, bl.lamp],
              alpha: 0,
              duration: 250,
              onComplete: () => {
                this.bilalUpstairs = wantUp;
                bl.setPosition(to.x, to.y + 12 - 24);
                bl.lamp.setPosition(bl.x, bl.y - 6);
                const it = this.interacts.find((i) => i.label === 'bilal');
                if (it) {
                  it.x = bl.x;
                  it.y = bl.y;
                }
                this.tweens.add({ targets: [bl, bl.lamp], alpha: 1, duration: 250, onComplete: () => (this.bilalRiding = false) });
              },
            });
          },
        });
      }
    }

    // the kite in the wind
    if (this.kite) {
      const kid = this.npcs.kite;
      const holder = this.kiteHolder || kid;
      const wind = Math.sin(time / 1700) * 30 + Math.sin(time / 530) * 8;
      this.kite.x += ((holder.x + 70 + wind) - this.kite.x) * 0.04;
      this.kite.y += ((ROOF - 130 + Math.sin(time / 900) * 14) - this.kite.y) * 0.04;
      this.kiteString.clear().lineStyle(1, 0xf2e6cc, 0.7).lineBetween(holder.x + 8, holder.y - 4, this.kite.x, this.kite.y + 12);
    }

    // the hatch prompt: standing on the grate, and downstairs at the ladder
    if (this.hatchPrompt) {
      const onGrate = Math.abs(p.x - this.hatchX) < 24 && Math.abs(p.y - (FLOOR - 24)) < 20;
      this.hatchPrompt.setVisible(onGrate && !p.climbing);
    }

    // vista from the roof
    const onRoof = p.y < ROOF + 40;
    if (onRoof && !this.vista) {
      this.vista = true;
      this.cameras.main.zoomTo(0.8, 800);
    } else if (!onRoof && this.vista) {
      this.vista = false;
      this.cameras.main.zoomTo(1, 600);
    }

    this.travelers.update(dt);
    this.queue.update(dt);
    if (this.rain) this.rain.setVisible(p.x < px(40));
    if (this.updateMusicRoom) {
      const room = RoomBuilder.roomAt(this.built.rooms, p.x);
      if (room !== this._room) {
        this._room = room;
        this.parallax.setRoom(room);
      }
      this.parallax.update();
    }
    musicDirector.setMix(this.state.music);
  }
}
