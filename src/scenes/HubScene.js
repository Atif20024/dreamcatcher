import Phaser from 'phaser';
import Player from '../entities/Player.js';
import BaseLevel from './BaseLevel.js';
import RoomBuilder from '../builders/RoomBuilder.js';
import Parallax from '../builders/parallax.js';
import { doorway, FRAME_W } from '../builders/hubThresholds.js';
import { frameCrossing, sideOf, DIPS } from '../world/thresholds.js';
import { dipThroughDark } from '../world/TransitionDirector.js';
import { D } from '../builders/depths.js';
import hubRooms, { BAYS, bayIndex } from '../data/hub/rooms.js';
import hubTiles from '../data/hub/tiles.js';
import { HUB_ROWS, buildHubMap } from '../data/hub/map.js';
import { reachGrid } from '../world/reach.js';
import { DREAMS, LAST_STOP, dreamById } from '../data/dreams.js';
import { createHubTextures, HUB_PROP_KEYS } from '../entities/hubArt.js';
import { stationTex, pigeonTex, doorWingTex } from '../art/trainArt.js';
import { hubTex } from '../art/hubArt.js';
import { attachStride } from '../art/stride.js';
import SplitFlapBoard from '../systems/SplitFlapBoard.js';
import Train from '../entities/Train.js';
import Silhouettes from '../entities/Silhouette.js';
import Phrases from '../systems/rhythm.js';
import { hubState, HEADLINES } from '../systems/hubState.js';
import { getSave, updateSave, getRun } from '../utils/save.js';
import { getWallet, spend } from '../systems/wallet.js';
import { HATS, hatById } from '../data/hats.js';
import { sfx, music, musicDirector, sting, accordion, chime } from '../systems/audio.js';
import { ambience } from '../audio/Ambience.js';
import { dreamcatcherTexture, caughtRounds, WEB_ORDER, glowTexture } from '../art/identityArt.js';
import { PLACES } from '../ui/theme.js';
import { trainWipe } from '../ui/TrainWipe.js';
import { boardTitle } from '../ui/BoardTitle.js';
import { addTapZone } from '../input/touchTaps.js';
import { readDocument } from '../ui/ReadingPanel.js';
import { uiText } from '../ui/text.js';
import { hud } from '../ui/hud.js';

const T = 32;
const px = (tile) => tile * T + T / 2;
const line = (row) => (row + 1) * T; // the floor line under a tile row
const FLOOR = line(HUB_ROWS.FLOOR - 1); // 832: hall floor / concourse
const ROOF = line(HUB_ROWS.ROOF - 1); // 256
const UNDER = line(HUB_ROWS.UNDER - 1); // 1056
const DREAMCATCHER_PX = 128; // the hall's dreamcatcher: a 2.9 m hoop (WP6)
const DOORS_X = px(22);
const SHED_END_X = px(156);

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
    // one-shot: Phaser reuses a scene's last data when it is started again
    // without any (the Evening's end, a dev warp), which replayed an old
    // return — the train backing out, Jo locked for 7.5 s
    if (data) data.returnedFrom = null;
  }

  create() {
    createHubTextures(this);
    void HUB_PROP_KEYS;
    this.save = getSave();
    this.N = Math.min(5, this.save.dreamsCaught);
    this.state = hubState(this.N);
    this.firstVisit = this.save.flags.hub.visits === 0 && !this.returnedFrom;
    updateSave((s) => (s.flags.hub.visits += 1));

    const built = RoomBuilder.build(this, hubRooms, hubTiles);
    this.built = built;
    // one room's backdrop at a time: it changes inside a doorway or an arch
    // (buildThresholds), at the full dark of a short dip
    this.parallax = new Parallax(this, built.rooms, { cut: true });
    // the station has an undercroft under its floor: the backdrops hang from
    // the concourse (rooms.js says where), not from the lowest solid row
    for (const r of built.rooms) if (r.horizon) r._horizon = r.horizon;
    this.solids = built.solids;
    this.oneWays = built.oneWays;
    this.slopeGrid = built.slopeGrid;
    this.solidGrid = built.solidGrid;
    this.climbGrid = built.climbGrid;
    this.ladderGrid = built.ladderGrid;
    this.surfaceGrid = built.surfaceGrid;
    this.objects = built.objects;

    // where Jo starts: the street on a first visit, otherwise his platform
    let spawn = { x: px(3), y: line(29) - 24 };
    if (this.returnedFrom) {
      const d = dreamById(this.returnedFrom);
      if (d) spawn = { x: BAYS[bayIndex(d.platform)] * T + 176, y: FLOOR - 24 }; // at the bay's gate (WP3)
    } else if (!this.firstVisit) {
      spawn = { x: px(26), y: FLOOR - 24 };
    }
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.noTool = true; // the ladle belongs to the Chef's dream, not the station
    // the station is walked (80 px/s); hold Shift / LB to run (owner, phase 2)
    this.player.walkByDefault = true;
    // the same long shadow east as everyone else, on the ground under him
    this.player.shadow.set({ texture: hubTex(this, 'shadow', 64, 8), originX: 0.05, offsetX: -4, tint: 0x2a3050, alpha: 0.42 });
    this.dreamCoinId = 'musician'; // the station pays in busker change
    this.hudProfile = 'hub'; // nothing here can hurt you: no hearts on the HUD
    this.setupCommon({ worldW: built.worldW, worldH: built.worldH, levelName: 'CROSSROADS STATION', spawn });

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
    this.buildThresholds();
    this.buildSafetyNet();
    this.buildUndercroft();
    this.buildRoof();
    this.buildTravelers();
    this.buildDayCycle();
    this.applyState();

    // while Jo is on a ladder the floor tile over it stops being a floor, so
    // he can climb down through the concourse into the undercroft and back
    this.physics.add.collider(this.player, this.solids, null, () => !this.player.climbing);
    this.physics.add.collider(this.player, this.oneWays, null, () => !this.player.climbing);

    this.promptText = hud.prompt(); // the HUD's interact prompt, pinned over the world point

    musicDirector.setMix(this.state.music); // the station's band (setupCommon)
    // the hall's air and its crowd, thinner with every dream caught
    // (kept under the band: a bed, not a wall of noise)
    ambience.set({ hub_hall: 0.7, hub_crowd: Math.min(0.6, 0.1 + this.state.travelers / 60) });
    this.events.once('shutdown', () => ambience.stop());
    this.boardIdle = this.time.addEvent({ delay: this.state.boardIdleMs, loop: true, callback: () => this.board.idleClack() });
    this.clockTick = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tickClock() });
    this.events.once('shutdown', () => this.persistClock());

    const worn = hatById(getSave().shop.hat);
    if (worn) this.wearHat(worn);
    if (this.returnedFrom) this.runReturn();
    else if (this.firstVisit) this.setObjective('');
    else this.setObjective('board any train — or the last stop');
    // the place's name on the board (WP6, §9): not over the opening (it has
    // its own) and not over a train coming home
    if (!this.returnedFrom && !this.firstVisit) this.placeBoard = boardTitle(this, 'CROSSROADS STATION', { sub: "NINE O'CLOCK", y: 64, place: 'hub', hold: 1800 });
  }

  // ---- thresholds: the screen changes rooms only inside a frame ----------
  // (room transitions advice). The front doorway (outside to inside), the
  // brick arch onto the platforms and the one to the service gate (room to
  // room) each dip through dark as Jo walks through, never locked. The two
  // platform rooms are one train shed: they meet with no frame and no dip.
  buildThresholds() {
    const rooms = this.built.rooms;
    const id = (k) => rooms[k].id;
    const edge = (k) => rooms[k]._x0 * T;
    const door = this.hallEntryX;
    // the hall's end wall: clear of the undercroft ladder, bay 1's buffer
    // stops against it; the shed's end wall clear of the gate room's step
    const shed = edge(2) - 16;
    const gate = edge(4) - 12;
    // below the roof only: on the leads Jo is outside every room
    const band = { y0: ROOF + T };
    this.hubFrames = [
      { x: door, left: 'steps', right: 'hall', dip: DIPS.inout, ...band },
      { x: shed, left: id(1), right: id(2), dip: DIPS.inin, ...band },
      { x: edge(3), left: id(2), right: id(3), open: true },
      { x: gate, left: id(3), right: id(4), dip: DIPS.inin, ...band },
    ];
    const bottom = this.built.worldH + 200;
    const top = ROOF + T;
    // the front wall stands on solid ground; the two inner walls carry on
    // down over the undercroft's passage (an arch at its floor line)
    const at = { top, floor: FLOOR, bottom };
    this.walls = [
      { frame: this.hubFrames[0], d: doorway(this, { x: door, ...at, left: 'stationFront', right: 'hallFront' }) },
      { frame: this.hubFrames[1], d: doorway(this, { x: shed, ...at, under: UNDER, left: 'hallEnd', right: 'shedEnd' }) },
      { frame: this.hubFrames[3], d: doorway(this, { x: gate, ...at, under: UNDER, left: 'shedGate', right: 'gateBack' }) },
    ];
    this.dips = 0;
    // Phaser reuses the scene: nothing from the last visit (its rooms, a dip
    // cut short by a warp) carries over
    this._room = null;
    this._lastJo = null;
    this.dipping = null;
    this._camBounds = null;
  }

  // ---- the safety net: no drop ends in a pocket ---------------------------
  // The map is sound (tests/reach.test.js: every place Jo can reach has a way
  // back to the hall). If he still ends up somewhere with no way out, or
  // below the undercroft's floor, he is put back on his last safe footing
  // through the station's short dip. Nothing here can hurt: no heart lost.
  buildSafetyNet() {
    const g = reachGrid(buildHubMap());
    const row = HUB_ROWS.FLOOR - 1;
    const hall = [];
    for (let c = 31; c < 79; c++) hall.push([c, row]);
    this.reach = g;
    this.homeCells = g.to(hall);
    this.rescues = 0;
    this.rescuing = false;
    this._stuckSince = 0;
    // last safe footing (BaseLevel.trackSafeGround) only where home is in reach
    this.isSafeHere = (p) => this.atHome(p);
  }

  // Jo's feet cell, or one beside it (stairs and slopes put his feet a little
  // into the tile the reach map stands him on), is one with a way home
  atHome(p) {
    const c = Math.floor(p.x / T);
    const r = Math.floor((p.y + 24) / T) - 1;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (this.reach.has(this.homeCells, c + dx, r + dy)) return true;
    return false;
  }

  updateSafetyNet(time) {
    const p = this.player;
    if (!this.reach || this.rescuing || this.dipping || this.respawning || this.cardActive) return;
    const below = p.y > UNDER + 2 * T; // under the undercroft's floor
    const grounded = (p.body.blocked.down || p.onSlope) && !p.climbing;
    if (grounded && !this.atHome(p)) this._stuckSince ||= time;
    else this._stuckSince = 0;
    if (below || (this._stuckSince && time - this._stuckSince > 500)) this.rescue();
  }

  rescue() {
    this.rescuing = true;
    this._stuckSince = 0;
    const pt = this.safeGround || this.checkpoint || { x: px(26), y: FLOOR - 24 };
    dipThroughDark(
      this,
      DIPS.inin,
      () => {
        this.rescues += 1;
        this.placePlayer(pt);
        // the room he lands in, at once, while the screen is dark
        this._room = null;
        this.updateThreshold();
      },
      () => (this.rescuing = false)
    );
  }

  // what the camera may show of the room on screen: out to the far edge of
  // the doorway frames either side of it and no further (a room narrower than
  // the view, the gate, opens out toward its wall, where the wall's face
  // carries on). On the roof, where every room's leads join, the whole station.
  camBounds() {
    const cam = this.cameras.main;
    const W = this.built.worldW;
    const H = this.built.worldH;
    const p = this.player;
    let x0 = 0;
    let x1 = W;
    if (this._room && p.y >= ROOF + T) {
      const r = this._room;
      const mid = (r._x0 + Math.max(...r.grid.map((g) => g.length)) / 2) * T;
      for (const w of this.walls) {
        if (w.d.x < mid) x0 = Math.max(x0, w.d.x - FRAME_W / 2);
        else x1 = Math.min(x1, w.d.x + FRAME_W / 2);
      }
      if (x1 - x0 < cam.width) {
        if (x1 === W) x0 = W - cam.width;
        else x1 = x0 + cam.width;
      }
    }
    const key = `${x0}|${x1}`;
    if (key === this._camBounds) return;
    this._camBounds = key;
    cam.setBounds(x0, 0, x1 - x0, H);
  }

  // the room on screen (its backdrop, its sound, which face of each wall
  // shows); called at the full dark of a dip, or at once for a fresh placement
  enterHubRoom(room) {
    const was = this._room;
    this._room = room;
    this.parallax.setRoom(room);
    const k = this.built.rooms.indexOf(room);
    for (const w of this.walls || []) w.d.setSide(k <= this.built.rooms.findIndex((r) => r.id === w.frame.left) ? 'left' : 'right');
    this.camBounds();
    if (room !== was) {
      this.enterAudioRoom(room);
      if (was && this.player.locate) this.player.locate('room', room.id);
    }
  }

  updateThreshold() {
    const p = this.player;
    const rooms = this.built.rooms;
    const byId = (id) => rooms.find((r) => r.id === id);
    // (Jo's last place is kept through a dip: a move made under it still counts)
    if (this.dipping) return;
    this.camBounds(); // up on the roof, or back down off it
    const moved = this._lastJo ? Math.abs(p.x - this._lastJo.x) + Math.abs(p.y - this._lastJo.y) : 0;
    this._lastJo = { x: p.x, y: p.y };
    // a fresh placement (the scene starting, a dream's return, a big move):
    // the side of the frames Jo stands on, at once
    if (!this._room || moved > 4 * T) {
      const side = byId(sideOf(this.hubFrames, p.x, p.y, null)) || RoomBuilder.roomAt(rooms, p.x);
      if (side !== this._room) this.enterHubRoom(side);
      return;
    }
    const f = frameCrossing(this.hubFrames, p.x, p.y, this._room.id);
    if (!f) return;
    if (f.open) return this.enterHubRoom(byId(f.to));
    // only on the ground: a jump through the doorway waits for the landing
    if (!(p.body.blocked.down || p.climbing)) return;
    this.dipping = f;
    dipThroughDark(
      this,
      f.dip,
      () => {
        this.dips += 1;
        this.enterHubRoom(byId(f.to));
      },
      () => (this.dipping = null)
    );
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

  // the light on the people: each rim and shadow follows its person every
  // frame (they are tweened, ridden in dumbwaiters, flipped), and Jo casts
  // the same long shadow east as everyone else
  dressPeople(p) {
    for (const s of Object.values(this.npcs)) {
      if (!s.rim || !s.active) continue;
      if (s.rim.texture.key !== s.texture.key) s.rim.setTexture(s.texture.key);
      s.rim.setPosition(s.x - 1.5, s.y).setFlipX(s.flipX).setAlpha(s.alpha * 0.5).setVisible(s.visible).setDepth(s.depth - 0.5).setScale(s.scaleX, s.scaleY);
      s.shadow.setPosition(s.x - 4, s.y + 23).setAlpha(s.alpha * 0.3).setVisible(s.visible);
    }
  }

  // an NPC: a sprite planted on its floor line, an idle bob, a name
  npc(who, o, opts = {}) {
    const floor = line(o.ty);
    const s = this.add.image(o.wx, floor - 24, `hub-${who}`).setDepth(D.INTERACT + 1);
    s.who = who;
    s.floorY = floor;
    if (opts.flip) s.setFlipX(true);
    if (!opts.still) {
      this.tweens.add({ targets: s, y: s.y - 1.5, duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'sine.inout' });
    }
    // their own lamp: the one thing in the hall that never dims
    s.lamp = this.add.image(o.wx, floor - 30, hubTex(this, 'glow', 64, 64)).setDisplaySize(120, 120).setTint(0xf2c078).setAlpha(0.3).setDepth(D.INTERACT);
    // the sun is low in the west: a warm rim on that side, a shadow east
    s.shadow = this.add.image(o.wx - 4, floor - 1, hubTex(this, 'shadow', 64, 8)).setOrigin(0.05, 0.5).setTint(0x2a3050).setAlpha(0.3).setDepth(D.INTERACT - 3);
    s.rim = this.add.image(o.wx - 1.5, floor - 24, `hub-${who}`).setTintFill(0xffd890).setAlpha(0.5).setDepth(D.INTERACT + 0.5);
    // legs from the ground actually covered, the task loop while standing
    // (phase 2 motion: src/art/stride.js); Bilal's walk to the dumbwaiter
    // and the sweeper's rounds step with them, never slide
    s.stride = attachStride(this, s, `hub-${who}`);
    this.npcs[who] = s;
    return s;
  }

  say(who, text, portrait = true) {
    const names = { pemberton: 'Mr. Pemberton', ro: 'Auntie Ro', bilal: 'Bilal', busker: 'The Busker', kite: 'Kite Kid', flower: 'Flower Seller', jo: 'Jo', gate: '…' };
    return this.dialog.show([{ name: names[who] || who, text, portrait: portrait && who !== 'gate' && who !== 'jo' ? `hub-${who}` : undefined }]);
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
    // (round 2 WP3: a 2.5 m kiosk, the headline on its board)
    const k = this.obj('kiosk');
    this.add.image(k.wx, street, stationTex(this, 'hub-news-kiosk')).setOrigin(0.5, 1).setDepth(D.INTERACT - 2);
    this.add.image(k.wx, street - 110 - 24, hubTex(this, 'signboard', 118, 50, { body: 0x1a1a22, trim: 0xc4a25c })).setDepth(D.INTERACT - 2);
    uiText(this, k.wx, street - 110 - 25, HEADLINES[this.N], { size: 'body', color: '#f2e6cc', wordWrap: { width: 104 }, align: 'center', backing: 0x1a1a22 })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 1);
    // feedback 3: [E] reads the paper on a page, large
    this.addInteract(k.wx, street - 20, 'read the paper', () => readDocument(this, { title: 'The Evening Crossroads', text: HEADLINES[this.N], name: 'paper' }));

    // three station doors at full size (2.6 m pairs, a 2.4 m revolving door
    // in the middle); only the middle one turns
    this.doors = this.objs('door').map((o) => {
      if (o.chained) {
        const img = this.add.image(o.wx, FLOOR, stationTex(this, 'hub-double-door')).setOrigin(0.5, 1).setDepth(D.INTERACT - 2);
        this.add.image(o.wx, FLOOR - 50, 'hub-chain').setDepth(D.INTERACT - 1);
        uiText(this, o.wx, FLOOR - 36, '🔒', { fontSize: '10px' }).setOrigin(0.5).setDepth(D.INTERACT - 1).setAlpha(0.8);
        return img;
      }
      const img = this.add.image(o.wx, FLOOR, stationTex(this, 'hub-revolving-door')).setOrigin(0.5, 1).setDepth(D.INTERACT - 3);
      // the wings turn inside the drum: one wing seen flat narrows to its edge
      const wing = this.add.image(o.wx, FLOOR - 6, doorWingTex(this)).setOrigin(0.5, 1).setDepth(D.INTERACT - 2);
      this.mainDoor = wing;
      this.tweens.add({ targets: wing, scaleX: 0.15, duration: 1400, yoyo: true, repeat: -1, ease: 'sine.inout', paused: true });
      return img;
    });
    this.hallEntryX = this.obj('hall_entry').wx;

    // Auntie Ro at her shoeshine stand
    const ro = this.obj('npc', (o) => o.who === 'ro');
    this.add.image(this.obj('shoeshine').wx, FLOOR - 14, 'hub-shoeshine').setDepth(D.INTERACT - 2);
    const roS = this.npc('ro', ro, { still: true });
    roS.y = FLOOR - 26;
    this.addInteract(ro.wx, FLOOR - 20, 'ro', () => this.talkRo());

    // rain on the wet stone
    const rainObj = this.obj('rain');
    if (rainObj) this.buildRain(rainObj.wx, (rainObj.w || 30) * T);

    // the station's plinth: the name carved into the stone, brass rails
    const plinthX = px(21);
    this.add.image(plinthX, FLOOR + 66, hubTex(this, 'plinth', 14 * T, 64)).setDepth(D.HAZARD);

    // the clock tower: real time, but only while Jo is in the station
    const c = this.obj('clock');
    this.clockFace = this.add.image(c.wx + 16, c.wy + 56, 'hub-clock').setDepth(D.INTERACT - 2).setScale(1.4);
    this.clockHands = this.add.graphics().setDepth(D.INTERACT - 1);
    this.drawClock();
  }

  buildRain(x0, w) {
    this.rain = this.add.particles(0, 0, 'hub-rain', {
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
    this.add.image(desk.wx, FLOOR - 14, 'hub-desk').setDepth(D.INTERACT + 2) // in front of Pemberton: he stands behind it;
    const pem = this.npc('pemberton', this.obj('npc', (o) => o.who === 'pemberton'));
    pem.y = FLOOR - 40;
    pem.setDepth(D.INTERACT - 2); // behind the counter
    this.addInteract(desk.wx, FLOOR - 20, 'pemberton', () => this.talkPemberton());

    // ticket booths, phone booths, lost & found
    const booths = this.obj('booths');
    // (round 2 WP3: one 2.6 m ticket booth with a counter at 1.1 m, and two
    // 2.3 m telephone boxes, clear of the sleeper's bench and the desk)
    this.add.image(booths.wx + 40, FLOOR, stationTex(this, 'hub-ticket-booth')).setOrigin(0.5, 1).setDepth(D.INTERACT - 3);
    const phones = this.obj('phones');
    [4, 48].forEach((dx) => this.add.image(phones.wx + dx, FLOOR, stationTex(this, 'hub-phone-box')).setOrigin(0.5, 1).setDepth(D.INTERACT - 3));
    const lf = this.obj('lostfound');
    this.add.image(lf.wx, lf.wy, hubTex(this, 'lostfound', 90, 40)).setDepth(D.INTERACT - 3);
    uiText(this, lf.wx, lf.wy - 8, 'LOST & FOUND', { fontSize: '9px', color: '#c4a25c', backing: 0x2a2230 }).setOrigin(0.5).setDepth(D.INTERACT - 2);

    // the bench and the man who sleeps on it under a coat
    const bench = this.obj('bench', (o) => o.sleeper);
    this.add.image(bench.wx, FLOOR - 10, 'hub-bench').setDepth(D.INTERACT - 2);
    const sl = this.npc('sleeper', this.obj('npc', (o) => o.who === 'sleeper'), { still: true });
    sl.y = FLOOR - 22;
    sl.lamp.setAlpha(0.06);
    this.sleeperCoat = this.add.image(sl.x, FLOOR - 18, hubTex(this, 'coat', 30, 22)).setDepth(D.INTERACT + 2);
    this.tweens.add({ targets: this.sleeperCoat, scaleY: 1.04, duration: 2600, yoyo: true, repeat: -1, ease: 'sine.inout' });

    // fountain, pigeons, flowers, luggage carts
    const f = this.obj('fountain');
    this.fountain = this.add.image(f.wx, FLOOR - 16, 'hub-fountain').setDepth(D.INTERACT - 2);
    this.fountainTimer = this.time.addEvent({ delay: 240, loop: true, callback: () => this.fountainDrop() });
    const pg = this.obj('pigeons');
    this.pigeons = [0, 1, 2, 3].map((i) =>
      this.add.image(pg.wx + i * 18 - 27, FLOOR - 6, pigeonTex(this)).setDepth(D.INTERACT - 1).setFlipX(i % 2 === 0)
    );
    this.pigeonHome = { x: pg.wx, y: FLOOR - 6 };
    const fl = this.obj('flowers');
    this.flowerCart = this.add.image(fl.wx, FLOOR - 12, 'hub-flowers').setDepth(D.INTERACT - 2);
    const fs = this.npc('flower', this.obj('npc', (o) => o.who === 'flower'), { still: true, flip: true });
    fs.y = FLOOR - 26;
    // luggage carts roll when Jo bumps them but never block him: a cart
    // shoved into a corner must not become a wall between him and a train
    this.carts = this.objs('cart').slice(0, 1).map((o) => {
      const c = this.physics.add.image(o.wx, FLOOR - 8, 'hub-cart').setDepth(D.INTERACT - 2);
      c.body.setSize(40, 12).setOffset((c.width - 40) / 2, c.height - 12);
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
      this.add.image(px(c), (mezzY + FLOOR) / 2, hubTex(this, 'column', 14, FLOOR - mezzY)).setDepth(D.INTERACT - 4);
      this.add.image(px(c), mezzY + 6, hubTex(this, 'capital', 26, 8)).setDepth(D.INTERACT - 4);
    }
    this.add.image(px(47.5), mezzY - 11, hubTex(this, 'balustrade', 22 * T, 24)).setDepth(D.INTERACT - 4);
    // the balcony's own slab: the one-way lip alone reads as a wire
    this.add.image(px(47), mezzY + 4, hubTex(this, 'slab', 23 * T, 10)).setDepth(D.TERRAIN + 1);

    // the way down: an open grate in the floor, a sign, and a prompt
    const hatchX = px(77);
    this.add.image(hatchX, FLOOR + 3, hubTex(this, 'grate', 38, 12)).setDepth(D.TERRAIN + 1);
    // (the sign stands on the hall side of the grate: the end wall's doorway
    // is just past it)
    this.add.image(hatchX - 56, FLOOR - 30, hubTex(this, 'signpost', 4, 60)).setDepth(D.INTERACT - 3);
    this.add.image(hatchX - 56, FLOOR - 58, hubTex(this, 'signboard', 120, 24)).setDepth(D.INTERACT - 3);
    uiText(this, hatchX - 56, FLOOR - 59, '\u2193 LEFT LUGGAGE', { fontSize: '9px', color: '#f2e6cc', backing: 0x2e3a52 })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 2);
    this.hatchPrompt = uiText(this, hatchX, FLOOR - 40, '[\u2193] down', { fontSize: '12px', color: '#88b8d8', backgroundColor: '#14101c' })
      .setOrigin(0.5)
      .setDepth(80)
      .setVisible(false);
    this.hatchX = hatchX;

    // mezzanine café: Bilal, the dumbwaiter he calls the express
    const cafe = this.obj('cafe');
    this.add.image(cafe.wx, line(cafe.ty) - 12, 'hub-cafe').setDepth(D.INTERACT - 2);
    const bl = this.npc('bilal', this.obj('npc', (o) => o.who === 'bilal'), { still: true });
    this.addInteract(bl.x, bl.y, 'bilal', () => this.tea());
    this.dumbwaiters = this.objs('dumbwaiter').map((o) => this.add.image(o.wx, line(o.ty) - 12, 'hub-dumbwaiter').setDepth(D.INTERACT - 2));
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
        .image(px(38) + i * 330, FLOOR - 270, hubTex(this, 'shaft', 64, 560))
        .setAlpha(0.09)
        .setDepth(D.HAZARD)
        .setAngle(-12);
      this.lightBars.push(bar);
    }

    this.buildDreamcatcher();
  }

  // ---- the station's dreamcatcher (round 2 WP6, critique §9 "Motifs") ------
  // A big one hangs in the hall on a chain from the roof: one round of web,
  // in that dream's colour, for every dream caught. A dream caught tonight
  // is woven in when Jo comes back (runReturn).
  buildDreamcatcher() {
    const x = px(72); // its plaque clear of the hall's end wall
    const top = FLOOR - 266; // the hoop at eye height from the concourse, over the heads of the hall
    const size = DREAMCATCHER_PX;
    const caught = { ...this.save.dreams };
    // the dream Jo has just come back from is woven in on his return
    if (this.returnedFrom && caught[this.returnedFrom]) {
      this.weaveNext = this.returnedFrom;
      delete caught[this.returnedFrom];
    }
    this.webRounds = caughtRounds(caught);
    const key = dreamcatcherTexture(this, 'hub-dreamcatcher', size, { rounds: this.webRounds, ghost: WEB_ORDER.length - this.webRounds.length });
    const chain = this.add.graphics().setDepth(D.INTERACT - 5);
    chain.lineStyle(2, 0x3a3448, 1).lineBetween(x, ROOF, x, top + 4);
    for (let y = ROOF + 6; y < top; y += 8) chain.fillStyle(0x5a5068, 1).fillRect(x - 2, y, 4, 4);
    this.dreamcatcher = this.add.image(x, top, key).setOrigin(0.5, 0).setDepth(D.INTERACT - 4);
    // it turns a little in the draught from the doors
    this.tweens.add({ targets: this.dreamcatcher, angle: { from: -1.6, to: 1.6 }, duration: 3800, yoyo: true, repeat: -1, ease: 'sine.inout' });
    // the lamp over it: the hall's practical, warm on the web
    this.add.image(x, top + size / 2, glowTexture(this)).setBlendMode('ADD').setTint(0xf2c078).setAlpha(0.12).setScale(2.6).setDepth(D.INTERACT - 4.5);
    const plaque = uiText(this, x + size / 2 + 12, top + size / 2, 'ONE STRAND FOR EVERY DREAM CAUGHT', { size: 'small', color: '#f2d580', backing: 0x2a2230, wrap: 96 }).setOrigin(0, 0.5).setDepth(11.3); // over the night grade
    plaque.name = 'dreamcatcher-plaque';
  }

  // weave the round for a dream just caught, then the chime (runReturn)
  weaveStrand() {
    const id = this.weaveNext;
    if (!id || !this.dreamcatcher) return;
    this.weaveNext = null;
    const color = PLACES[id] ? PLACES[id].accent : 0xf2e6cc;
    const rounds = this.webRounds;
    const left = WEB_ORDER.length - rounds.length - 1;
    const st = { p: 0 };
    this.tweens.add({
      targets: st,
      p: 1,
      duration: 1600,
      ease: 'sine.inout',
      onUpdate: () => dreamcatcherTexture(this, 'hub-dreamcatcher', DREAMCATCHER_PX, { rounds, partial: st.p, partialColor: color, ghost: left }),
      onComplete: () => {
        this.webRounds = [...rounds, color];
        dreamcatcherTexture(this, 'hub-dreamcatcher', DREAMCATCHER_PX, { rounds: this.webRounds, ghost: Math.max(0, left) });
        chime('strand', 'hub');
      },
    });
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
    const t = uiText(this, bk.x + 14, bk.y - 30, '♪', { fontSize: '13px', color: '#f2d580' }).setDepth(D.INTERACT + 2);
    this.tweens.add({ targets: t, y: t.y - 24, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }

  boardRows() {
    const rows = DREAMS.map((d) => {
      const caught = !!this.save.dreams[d.id];
      return caught
        ? { platform: d.platform, title: d.title, departs: '—', status: 'CAUGHT — NO RETURN', dim: true }
        : getRun(d.id)
          ? { platform: d.platform, title: d.title, departs: 'NOW', status: 'CONTINUE', dim: false, hot: true }
          : { platform: d.platform, title: d.title, departs: 'NOW', status: d.scene ? 'BOARDING' : 'DELAYED', dim: false };
    });
    // the last stop is a train like any other: no chain, no count to clear
    rows.push({ platform: LAST_STOP.platform, title: LAST_STOP.title, departs: 'NOW', status: 'BOARDING', hot: true });
    return rows;
  }

  // ---- screens 3-4: the platforms ----------------------------------------

  buildPlatforms() {
    // THE LAST STOP is a train like any other (platform G): never caught,
    // always running, boarded through the same gate and door
    for (const d of [...DREAMS, LAST_STOP]) {
      const caught = d !== LAST_STOP && !!this.save.dreams[d.id];
      const running = !!d.scene;
      const bayX0 = BAYS[bayIndex(d.platform)] * T;
      const bayMid = bayX0 + 3.5 * T;

      // the bay at full scale (round 2 WP3): the buffer end of the last
      // carriage at the stop, the rest of the train running away beside the
      // platform, the platform gate and its 3.5 m lamp at the mouth
      const train = new Train(this, d.platform, bayX0, FLOOR, {
        id: d.id,
        livery: d.livery,
        outOfService: !running,
        dead: caught && d.id !== this.returnedFrom,
      });
      this.trains[d.id] = train;
      // the overhead sign: readable from the far end of the shed
      this.platformSign(d, bayMid, caught, running);
      // the kitchen line smells of its dream
      if (d.propsKind === 'produce' && running) this.time.addEvent({ delay: 900, loop: true, callback: () => this.smell(train.gateX - 30, FLOOR - 110) });

      if (caught) {
        // the platform goes quiet: dimmed, pigeons roost on the gate and lamp
        this.add.rectangle(bayMid, FLOOR - 150, 7 * T, 300, 0x0a0a14, 0.35).setDepth(D.INTERACT + 3);
        this.add.image(train.gateX - 26, FLOOR - 52, pigeonTex(this)).setDepth(D.INTERACT - 1);
        this.add.image(train.lampX + 4, FLOOR - 160, pigeonTex(this)).setDepth(D.INTERACT - 1).setFlipX(true);
      }
      this.addInteract(train.gateX, FLOOR - 20, 'train', () => this.board_(d), { radius: 56, when: () => this.trains[d.id].state === 'idle' });
      d._lamp = train;
    }
  }

  // "PLATFORM 1 · FIVE-STAR DREAM", hung from the shed roof in the train's own
  // colours. Lines that don't run get a red bar you can read from the hall.
  platformSign(d, x, caught, running) {
    const y = FLOOR - 196; // above the carriage roof (round 2 WP3)
    const w = 196;
    const body = caught ? 0x2a2a30 : running ? d.livery.body : 0x2e2e36;
    const trim = caught ? 0x4a4a52 : running ? d.livery.trim : 0x5a5a62;
    const text = caught ? '#8a8478' : running ? '#f2e6cc' : '#8a8a90';
    this.add.image(x, y - 58, hubTex(this, 'signpost', 3, 88)).setDepth(D.INTERACT - 3);
    this.add.image(x, y + 1, hubTex(this, 'signboard', w, 42, { body, trim })).setDepth(D.INTERACT - 2);
    uiText(this, x, y - 9, `PLATFORM ${d.platform}`, { fontSize: '10px', color: text, backing: body })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 1);
    uiText(this, x, y + 7, d.title, { fontSize: '13px', color: text, backing: body })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 1);
    if (caught) {
      uiText(this, x, y + 30, 'CAUGHT — NO RETURN SERVICE', { fontSize: '9px', color: '#6a6478' }).setOrigin(0.5).setDepth(D.INTERACT - 1);
    } else if (!running) {
      // the bar across the sign is what you read from far away
      this.add.image(x, y + 30, hubTex(this, 'redbar', w, 16)).setDepth(D.INTERACT - 1);
      uiText(this, x, y + 30, 'NOT IN SERVICE', { fontSize: '10px', color: '#f2e6cc', backing: 0xc03a2a }).setOrigin(0.5).setDepth(D.INTERACT);
    } else {
      const tag = uiText(this, x, y + 30, '● BOARDING', { fontSize: '10px', color: '#7ec87e' }).setOrigin(0.5).setDepth(D.INTERACT - 1);
      this.tweens.add({ targets: tag, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
    }
  }


  smell(x, y) {
    if (this.save.dreams.chef) return;
    const s = uiText(this, x, y, '~', { fontSize: '12px', color: '#c8c0b0' }).setDepth(D.INTERACT - 1).setAlpha(0.6);
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
    this.add.image(gx, (top + bottom) / 2, hubTex(this, 'gate', 64, bottom - top)).setDepth(D.HAZARD);
    this.tallyG = this.add.graphics().setDepth(D.HAZARD + 1);
    this.drawTally(this.state.tally);
    const sign = this.obj('sign');
    this.add.image(sign.wx + 16, sign.wy, hubTex(this, 'creamsign', 120, 28)).setDepth(D.INTERACT - 2).setAngle(-2);
    uiText(this, sign.wx + 16, sign.wy - 1, sign.text, { fontSize: '11px', color: '#2a2230', backing: 0xf2e6cc }).setOrigin(0.5).setDepth(D.INTERACT - 1); // level (feedback 3)

    // a bar of cold blue light between the leaves once it is ajar
    this.gateLight = this.add.image(gx, (top + bottom) / 2, hubTex(this, 'lightbar', 10, 8)).setDisplaySize(10, bottom - top).setAlpha(0).setDepth(D.INTERACT + 2);
    this.gateGlow = this.add.image(gx - 40, (top + bottom) / 2, hubTex(this, 'sideglow', 80, 8)).setDisplaySize(80, bottom - top).setAlpha(0).setDepth(D.INTERACT + 1);

    // no chain, no padlock: the gate stands ajar from the first visit
    this.gateLight.setAlpha(0.35);
    this.gateGlow.setAlpha(0.12);

    // turnstile with a mechanical counter reading dreamsCaught
    const t = this.obj('turnstile');
    this.add.image(t.wx, FLOOR - 14, 'hub-turnstile').setDepth(D.INTERACT - 2);
    this.add.image(t.wx, FLOOR - 52, 'hub-counter').setDepth(D.INTERACT - 2);
    uiText(this, t.wx, FLOOR - 52, String(this.save.dreamsCaught).padStart(3, '0'), { fontSize: '11px', color: '#f2e6cc', backing: 0x2a2a30 })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 1);

    // under the dream counter: the wallet, in tally strokes (§6 — The
    // Counter counts everything, and none of it can be spent here)
    const w = getWallet().total;
    const strokes = Math.min(40, Math.ceil(w / 25));
    const tg = this.add.graphics().setDepth(D.INTERACT - 1);
    tg.lineStyle(1, 0xd8cbb0, 0.8);
    for (let i = 0; i < strokes; i++) {
      const tx0 = t.wx - 20 + (i % 10) * 4 + Math.floor(i / 10) * 0;
      const ty0 = FLOOR - 40 + Math.floor(i / 10) * 7;
      if (i % 5 === 4) tg.lineBetween(tx0 - 13, ty0 + 5, tx0 - 2, ty0);
      else tg.lineBetween(tx0, ty0, tx0, ty0 + 5);
    }
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
    if (!this.save.flags.hub.gateSpoke) {
      updateSave((s) => (s.flags.hub.gateSpoke = true));
      this.save.flags.hub.gateSpoke = true;
      await this.say('gate', `${this.N || 'None'} so far. Come in whenever you're done counting. Or don't. I'll count for both of us.`, false);
      sfx('click'); // the turnstile clicks once by itself
      return;
    }
    this.boardLastStop();
  }

  // ---- undercroft & roof ---------------------------------------------------

  buildUndercroft() {
    const tk = this.obj('tea_kitchen');
    this.add.image(tk.wx, UNDER - 30, hubTex(this, 'teakitchen', 120, 60)).setDepth(D.INTERACT - 3);
    this.add.image(tk.wx - 30, UNDER - 10, 'hub-teapot').setDepth(D.INTERACT - 2);
    this.add.image(tk.wx + 20, UNDER - 10, 'hub-teapot').setDepth(D.INTERACT - 2);
    uiText(this, tk.wx, UNDER - 66, "THE EXPRESS · BILAL'S", { fontSize: '9px', color: '#f2d580' })
      .setOrigin(0.5)
      .setDepth(D.INTERACT - 2);
    this.addInteract(tk.wx, UNDER - 20, 'shop', () => this.shop());
    const cg = this.obj('cages');
    [-44, 0, 44].forEach((dx) => this.add.image(cg.wx + dx, UNDER - 12, 'hub-cage').setDepth(D.INTERACT - 2));

    const sb = this.obj('signal_box');
    this.add.image(sb.wx, UNDER - 40, hubTex(this, 'signalbox', 110, 80)).setDepth(D.INTERACT - 3);
    const levers = [-30, 0, 30].map((dx) => this.add.image(sb.wx + dx, UNDER - 10, 'hub-lever').setDepth(D.INTERACT - 2));
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
        this.add.image(x + k * 20, y, this.save.dreams[d.id] && k === 5 ? 'hub-suitcase-tag' : 'hub-suitcase').setDepth(D.INTERACT - 2).setAlpha(0.85);
      }
    });
    uiText(this, ld.wx, UNDER - 106, 'LEFT LUGGAGE', { fontSize: '9px', color: '#8a8478' }).setOrigin(0.5).setDepth(D.INTERACT - 2);

    // the slot: the far side of the service gate. A corridor of tally under
    // one bulb, receding. Nothing moves in it.
    const slot = this.obj('gate_slot');
    const sx = slot.wx;
    const sy = UNDER - 40;
    this.add.image(sx, sy, hubTex(this, 'slot', 56, 40)).setDepth(D.INTERACT - 3);
    this.addInteract(sx, sy + 10, 'slot', () => this.floatText(sx, sy - 40, 'a corridor. tally marks. one bulb.\nnothing moves.', '#8a8478'));
  }

  buildRoof() {
    const wt = this.obj('water_tower');
    this.add.image(wt.wx, wt.wy + 6, 'hub-watertower').setDepth(D.INTERACT - 3);
    const lofts = this.obj('lofts');
    [-30, 20].forEach((dx) => this.add.image(lofts.wx + dx, ROOF - 12, 'hub-loft').setDepth(D.INTERACT - 3));
    const hatch = this.obj('hatch');
    this.add.image(hatch.wx, hatch.wy, 'hub-hatch').setDepth(D.TERRAIN + 1).setAlpha(0.6);

    const kid = this.npc('kite', this.obj('npc', (o) => o.who === 'kite'));
    kid.y = ROOF - 24;
    this.kite = this.add.image(kid.x + 60, ROOF - 120, 'hub-kite').setDepth(D.INTERACT - 1);
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
      x1: px(5), // the street, short of the first stair
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
  // the hall grows larger and emptier as dreams are caught (advice §2)
  acousticsTweak() {
    const k = this.N / 5;
    return this._room && this._room.id !== 'steps' ? { wet: 0.14 + 0.16 * k } : null;
  }

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
    if (st.fountain === 'dry') this.fountain.setTexture('hub-fountain-dry');
    this.flowerCart.setAlpha(st.flowers === 0 ? 0.35 : 1);
    if (st.flowers < 6) {
      const cover = this.add.rectangle(this.flowerCart.x + (st.flowers / 6) * 18 + 18, this.flowerCart.y - 12, (1 - st.flowers / 6) * 36, 12, 0x2a2230, 1).setDepth(D.INTERACT - 1);
      cover.setOrigin(1, 0.5).x = this.flowerCart.x + 18;
    }
    // gate light: never below the open-door glow, brighter as the hall empties
    this.gateLight.setAlpha(Math.max(0.35, st.gateLight * 0.9));
    this.gateGlow.setAlpha(Math.max(0.12, st.gateLight * 0.25));
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
    this.openingActive = true;
    this.player.controlLockUntil = this.time.now + 4000;
    this.player.body.setVelocity(0, 0);
    this.tweens.add({ targets: this.mainDoor, scaleX: 0.1, duration: 500, yoyo: true });
    sfx('click');
    const cam = this.cameras.main;
    const timers = [];
    // §8: the HUD steps aside for the vista
    const profile = this.hud.get('profile');
    this.hud.set('profile', 'none');
    // Any key (E, Esc, anything) skips straight back to Jo with control.
    const finish = () => {
      if (!this.openingActive) return;
      this.openingActive = false;
      this.hud.set('profile', profile);
      this.input.keyboard.off('keydown', finish);
      timers.forEach((t) => t.remove(false));
      if (this.openingBoard && this.openingBoard.scene) this.openingBoard.destroy();
      this.tweens.killTweensOf(cam);
      cam.setZoom(1);
      cam.startFollow(this.player, true, 0.1, 0.1);
      cam.centerOn(this.player.x, this.player.y);
      this.player.controlLockUntil = 0;
    };
    this.openingSkip = finish;
    this.input.keyboard.on('keydown', finish);
    // touch screens: a tap skips it too (src/input/touchTaps.js)
    addTapZone(this, { when: () => this.openingActive, onTap: finish });
    // pull back to the vista -> brief hold -> come back to Jo (about 3 s). The
    // board and the steam carry the moment; the title was already shown.
    timers.push(
      this.time.delayedCall(400, () => {
        if (!this.openingActive) return;
        cam.stopFollow();
        this.tweens.killTweensOf(cam);
        for (const t of Object.values(this.trains)) for (let i = 0; i < 8; i++) timers.push(this.time.delayedCall(i * 120, () => t.puff()));
        this.board.rows.forEach((r, i) => timers.push(this.time.delayedCall(200 + i * 160, () => this.board.setRow(i, r))));
        // the one title: the station's name on a board line, with the chime (WP6)
        this.openingBoard = boardTitle(this, 'CROSSROADS STATION', { sub: "NINE O'CLOCK. EVERY TRAIN LEAVES NOW.", y: 64, place: 'hub', hold: 1500 });
        this.tweens.add({
          targets: cam,
          scrollX: px(60) - 480,
          scrollY: FLOOR - 250 - 270,
          zoom: 0.62,
          duration: 1400,
          ease: 'sine.inout',
          onComplete: () => {
            if (!this.openingActive) return;
            timers.push(this.time.delayedCall(500, () => {
              if (!this.openingActive) return;
              this.tweens.add({
                targets: cam,
                scrollX: this.player.x - 480,
                scrollY: this.player.y - 270,
                zoom: 1,
                duration: 800,
                ease: 'sine.inout',
                onComplete: finish,
              });
            }));
          },
        });
      }),
    );
  }

  async firstDesk() {
    await this.dialog.show([
      { name: 'Mr. Pemberton', text: 'New face. Which dream, sir? They all leave at the same time.', portrait: 'hub-pemberton' },
      { name: 'Jo', text: 'How do I choose?' },
      { name: 'Mr. Pemberton', text: "People usually don't. They just get on the first one that stops.", portrait: 'hub-pemberton' },
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
    if (this.N >= 2) return this.say('pemberton', 'Mind the gap.');
    if (this.N > 0 && !this.visitLines.luggage) {
      this.visitLines.luggage = true;
      return this.say('pemberton', "Left luggage is downstairs, sir -- the grate past the fountain. You'll want to see whose name is on the tag.");
    }
    return this.say('pemberton', this.N === 0 ? `Any platform, sir. They all leave now. The ledger has you at $${getWallet().total}.` : `${this.N} caught, $${getWallet().total} carried. The board keeps one count, I keep the other.`);
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
    const cup = this.add.image(this.player.x, this.player.y - 40, 'hub-teapot').setDepth(D.INTERACT + 3).setScale(0.6);
    this.tweens.add({ targets: cup, y: cup.y - 20, alpha: 0, duration: 1800, onComplete: () => cup.destroy() });
    const lineN = BILAL_TEA[this.N];
    if (lineN) return this.say('bilal', lineN);
    await this.dialog.show([{ name: 'Bilal', text: '…', portrait: 'hub-bilal' }]);
    return this.say('bilal', "You know the sweeper's been here longer than the trains?");
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
      // Jo steps down from the door he left by and walks out through the gate
      train.walkOut(this.player);
      train.returnAndDie(() => {
        const idx = DREAMS.findIndex((x) => x.id === d.id);
        const rows = this.boardRows();
        this.board.setRow(idx, rows[idx]);
        d._lamp.setLamp(false);
        sfx('scratch');
        this.time.delayedCall(300, () => sfx('scratch'));
        this.drawTally(this.state.tally);
        // its lamp is out; its round is woven into the hall's dreamcatcher
        this.time.delayedCall(600, () => this.weaveStrand());
        // then, and only then, the tint darkens
        this.tweens.add({ targets: this.washRect, fillAlpha: this.state.sat * 0.55, duration: 2400 });
        this.setObjective('board any train — or the last stop');
      });
      this.washRect.setFillStyle(0x3a3a44, hubState(Math.max(0, this.N - 1)).sat * 0.55);
    }
  }

  // ---- boarding --------------------------------------------------------------

  async board_(d) {
    if (d !== LAST_STOP && this.save.dreams[d.id]) {
      await this.dialog.show([{ name: 'Conductor', text: 'No return service on this line, sir. Never was.' }]);
      return;
    }
    if (!d.scene) {
      await this.dialog.show([{ name: 'Conductor', text: `${d.title}? Not in service. The rails go out that way, but nothing runs on them yet.` }]);
      return;
    }
    // a dream in progress (plan §2.8): continue it from its last flag
    const run = d === LAST_STOP ? null : getRun(d.id);
    const where = run && run.checkpointLabel ? ` — ${run.checkpointLabel}` : '';
    // a question about the journey ahead, and a real choice
    const answer = await this.dialog.show([
      {
        name: 'Conductor',
        text: run ? `You've a seat kept on this one, sir. Same carriage, same stop${run.checkpointLabel ? `: ${run.checkpointLabel.toLowerCase()}` : ''}.` : d.conductor,
        choices: run
          ? [
              { label: `Continue dream${where}`, value: 'continue' },
              { label: 'Board from the start', value: 'board' },
              { label: 'Not yet', value: 'wait' },
            ]
          : [
              { label: 'Board this train', value: 'board' },
              { label: 'Not yet', value: 'wait' },
            ],
      },
    ]);
    if (answer !== 'board' && answer !== 'continue') {
      this.floatText(this.player.x, this.player.y - 50, 'the doors stay open.', '#c8c0b0');
      return;
    }
    const train = this.trains[d.id];
    this.player.controlLockUntil = this.time.now + 99999;
    this.player.body.setVelocity(0, 0);
    this.persistClock();
    this.boarding = d.id;
    // through the gate and up the platform into the lit door (about 1.4 s),
    // the door shuts, and the train runs away into the shed (round 2 WP3)
    train.walkIn(this.player, () => {
      sfx('snap');
      train.depart(() => {});
      // the passing-train wipe in the dream's livery, with the chime (WP6, §9):
      // the next scene starts under it at the middle
      this.time.delayedCall(900, () => {
        trainWipe(
          this,
          () => {
            music.stop();
            // a continued run skips the intro card and wakes at its flag
            if (d === LAST_STOP) this.scene.start('Evening', { fromDoor: true });
            else if (answer === 'continue') this.scene.start(d.scene, { levelKey: d.id, resume: true });
            else this.scene.start('Intro', { levelKey: d.id });
          },
          { place: d === LAST_STOP ? 'evening' : PLACES[d.id] ? d.id : 'hub', event: 'boarding' }
        );
      });
    });
  }

  // The Counter's own level is still being laid; past his gate, a door
  // stands open onto THE LONG EVENING, and that part is here.
  boardLastStop() {
    this.showCard(
      ['THE LAST STOP', '', 'No ticket. No count to clear.', 'Past the turnstile, a door stands open.', 'It is warm on the other side.', '', '[E] Go through      [Q] Not yet'],
      () => {
        this.persistClock();
        this.player.controlLockUntil = this.time.now + 99999;
        this.cameras.main.fadeOut(1200, 20, 14, 8);
        this.time.delayedCall(1250, () => {
          music.stop();
          this.scene.start('Evening', { fromDoor: true });
        });
      },
      () => {}
    );
  }

  // ---- Bilal's stall (collectibles §2) -----------------------------------

  async shop() {
    if (this.N >= 5) {
      await this.say('bilal', 'Keep the change.');
      return;
    }
    for (;;) {
      const sv = getSave();
      const w = getWallet().total;
      const shardCost = [150, 300, 600][Math.min(2, sv.shop.shardsBought)];
      const choices = [
        { label: `tea ·20`, value: 'tea' },
        { label: `shard ·${shardCost}`, value: 'shard' },
        { label: `postcard ·100`, value: 'postcard' },
        { label: `ticket ·250`, value: 'ticket' },
        { label: 'hats…', value: 'hats' },
        { label: 'done', value: 'done' },
      ];
      const pick = await this.dialog.show([
        { name: 'Bilal', portrait: 'hub-bilal', text: `The Express. You're carrying $${w}. Tea steadies the first stretch of a dream; a shard is a piece of a heart; a postcard marks a dream's small moments; a ticket forgives one bad night.`, choices },
      ]);
      if (!pick || pick === 'done') return;
      if (pick === 'tea') {
        if (sv.shop.tea) await this.say('bilal', 'One is enough. Drink that one first.');
        else if (spend(20)) {
          updateSave((x) => (x.shop.tea = true));
          sfx('buy');
          await this.say('bilal', 'On the counter when you board. Warm through the first section.');
        } else await this.say('bilal', 'Twenty. Come back with change in your coat.');
      } else if (pick === 'shard') {
        if (sv.shop.shardsBought >= 3) await this.say('bilal', 'Three is all I ever find.');
        else if (spend(shardCost)) {
          updateSave((x) => {
            x.shop.shardsBought += 1;
            x.shards = (x.shards || 0) + 1;
          });
          sfx('shard');
          this.updateShardHud();
          await this.say('bilal', 'Found it under a seat on the 4:15. Careful with it.');
        } else await this.say('bilal', `That one costs ${shardCost}.`);
      } else if (pick === 'postcard') {
        const target = await this.dialog.show([
          { name: 'Bilal', portrait: 'hub-bilal', text: 'A postcard from which dream? It marks the three small moments on your way.', choices: [
            { label: 'chef', value: 'chef' },
            { label: 'musician', value: 'musician' },
            { label: 'never mind', value: null },
          ] },
        ]);
        if (!target) continue;
        if (sv.shop.postcards[target]) await this.say('bilal', 'You have that one. Read the back again.');
        else if (spend(100)) {
          updateSave((x) => (x.shop.postcards[target] = true));
          sfx('buy');
          await this.say('bilal', 'Somebody mailed it and never came back for it. The X marks are theirs.');
        } else await this.say('bilal', 'A hundred. The stamps alone, you understand.');
      } else if (pick === 'ticket') {
        if (sv.shop.ticket) await this.say('bilal', 'You still have one. Try not to need it.');
        else if (spend(250)) {
          updateSave((x) => (x.shop.ticket = true));
          sfx('buy');
          await this.say('bilal', 'A return ticket. One bad night, forgiven. Once.');
        } else await this.say('bilal', 'Two hundred fifty. Hope is not cheap, friend.');
      } else if (pick === 'hats') {
        const owned = sv.shop.hats;
        const hatChoices = HATS.map((h) => ({ label: owned.includes(h.id) ? `${h.name} ✓` : `${h.name} ·${h.cost}`, value: h.id })).slice(0, 3);
        const hatChoices2 = HATS.map((h) => ({ label: owned.includes(h.id) ? `${h.name} ✓` : `${h.name} ·${h.cost}`, value: h.id })).slice(3);
        const page = await this.dialog.show([
          { name: 'Bilal', portrait: 'hub-bilal', text: 'Hats. Lost property, technically. Six of them.', choices: [...hatChoices, { label: 'more…', value: 'more' }] },
        ]);
        const hatPick = page === 'more'
          ? await this.dialog.show([{ name: 'Bilal', portrait: 'hub-bilal', text: 'The good shelf.', choices: [...hatChoices2, { label: 'back', value: null }] }])
          : page;
        if (!hatPick) continue;
        const hat = hatById(hatPick);
        if (!hat) continue;
        if (sv.shop.hats.includes(hat.id)) {
          updateSave((x) => (x.shop.hat = hat.id));
          this.wearHat(hat);
          await this.say('bilal', 'Wearing it well.');
        } else if (spend(hat.cost)) {
          updateSave((x) => {
            x.shop.hats.push(hat.id);
            x.shop.hat = hat.id;
          });
          sfx('buy');
          this.wearHat(hat);
          await this.say('bilal', 'It found the right head.');
        } else await this.say('bilal', `${hat.cost} for that one.`);
      }
    }
  }

  wearHat(hat) {
    if (this.player && this.player.hat) this.player.hat.setTint(hat.tint);
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
        if (passes >= 1) {
          this.markMoment('moment1', "He'd been playing to the board for years.");
          // the hub's only coin: the hat gives one back (worth 1)
          if (this.coinMgr) this.coinMgr.spawn(this.npcs.busker.x + 20, this.npcs.busker.y + 10);
        }
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
      // the cards say "[E] Go through  [Q] Not yet": E (or X) answers yes,
      // Q no. (This read only X before, so the last stop's card could
      // neither be taken nor dismissed with the keys it named.) The press
      // that opened the card is swallowed for a moment.
      const E = Phaser.Input.Keyboard.JustDown(this.player.keys.E);
      const X = Phaser.Input.Keyboard.JustDown(this.player.keys.X);
      const Q = Phaser.Input.Keyboard.JustDown(this.keyQ);
      if (this.time.now - (this.cardShownAt || 0) < 250) return true;
      if (E || X) {
        const fn = this.cardConfirm;
        this.closeCard();
        if (fn) fn();
      } else if (Q || Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
        const fn = this.cardAlt;
        this.closeCard();
        if (fn) fn();
      }
      return true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.showCard(['Paused', '', 'The station keeps the time.', '', '← → walk    hold SHIFT (LB) to run', '', '[E] Back'], null);
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
    this.dressPeople(p);
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

    // the first steps: the run is on Shift here, the reverse of the dreams
    if (!this.runHint && (!this.firstVisit || this.openingDone) && Math.abs(p.body.velocity.x) > 20 && time > p.controlLockUntil) {
      this.runHint = true;
      this.time.delayedCall(700, () => this.floatText(p.x, p.y - 70, 'walking. hold SHIFT (LB) to run', '#c8c0b0'));
    }

    // the opening: crossing the door on the first visit
    // (inside: the vista only after the doorway's dip has come back up)
    if (this.firstVisit && !this.openingDone && !this.dipping && this._room && this._room.id === 'hall' && p.x > this.hallEntryX) this.opening();
    // H2: Pemberton never takes control by proximity. Walking past, he
    // looks up and calls once; the conversation opens on [E] (talkPemberton).
    const pem = this.npcs.pemberton;
    if (pem && !this.visitLines.pemCall && (this.openingDone || !this.firstVisit) && Math.abs(p.x - pem.x) < 110 && Math.abs(p.y - pem.y) < 60) {
      if ((this.N === 0 && !this.visitLines.desk0) || (this.returnedFrom && !this.visitLines.deskReturn)) {
        this.visitLines.pemCall = true;
        this.floatText(pem.x, pem.y - 56, this.N === 0 ? 'Sir? A word, at the desk.  [E]' : 'Welcome back, sir.  [E]', '#f2e6cc');
      }
    }
    // the last walk: single lines, no box, as Jo passes each lamp
    if (this.N >= 2) {
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
        this.npcs.sleeper.setTexture('hub-sleeper#1');
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
      if (sw.x > px(155)) sw.dir = -1;
      if (sw.x < px(28)) sw.dir = 1;
      if (!sw.stride) sw.setTexture(`hub-sweeper#${(Math.floor(sw.x / 6) % 8) + 1}`);
      sw.lamp.setPosition(sw.x, sw.y - 6);
      if (Math.floor(time / 2400) !== sw.lastHum && Math.abs(p.x - sw.x) < 300) {
        sw.lastHum = Math.floor(time / 2400);
        const t = uiText(this, sw.x + 10, sw.y - 28, '♩', { fontSize: '11px', color: '#c8c0b0' }).setDepth(D.INTERACT + 2).setAlpha(0.6);
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

    this.updatePickups(time, delta);
    this.travelers.update(dt);
    this.queue.update(dt);
    if (this.rain) this.rain.setVisible(p.x < px(40));
    this.updateSafetyNet(time);
    if (this.updateMusicRoom) {
      this.updateThreshold();
      this.parallax.update(); // the room on screen, alone
    }
    if (this.placeAudio) this.placeAudio.update(time);
    if (this.look) this.look.update(time, delta, null);
    musicDirector.setMix(this.state.music);
  }
}
