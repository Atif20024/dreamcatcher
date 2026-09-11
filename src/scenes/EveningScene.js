import Phaser from 'phaser';
import Player from '../entities/Player.js';
import BaseLevel from './BaseLevel.js';
import RoomBuilder from '../builders/RoomBuilder.js';
import eveningRooms from '../data/evening/rooms.js';
import eveningTiles from '../data/evening/tiles.js';
import { EV, placeAt } from '../data/evening/map.js';
import { CAST, HER, HER_NAME } from '../data/evening/cast.js';
import { HER_LINES, SIT_EVENT_LINES, CARDS } from '../data/evening/talk.js';
import { createEveningTextures, CAT_COATS } from '../data/evening/sprites.js';
import { createJoEveningTextures } from '../entities/jo.js';
import { createPixelTexture } from '../utils/pixelart.js';
import Townsfolk from '../entities/Townsfolk.js';
import Companion from '../entities/Companion.js';
import { Cat, Dog, Flock, Heron, Stander, Motes } from '../entities/critters.js';
import Sky, { lerpC } from '../systems/sky.js';
import Horizon from '../systems/horizon.js';
import Weather from '../systems/weather.js';
import { Soundscape, Ensemble, joNote, ORB_THEME, THEME_PARTS } from '../systems/soundscape.js';
import Talk from '../systems/talk.js';
import { makeActivities } from '../systems/activities.js';
import Director from '../systems/evening.js';
import { takePhoto, loadAlbum, photoTextures, randomPhotos } from '../systems/album.js';
import { getSave, updateSave, momentsFound, MOMENT_TOTAL } from '../utils/save.js';
import { sfx, music, laughSfx, toggleMusic, playFx, audioOut } from '../systems/audio.js';
import DialogueBox from '../systems/DialogueBox.js';
import { buildWorld, buildArchitecture, makeGround, bucketTerrain, mulC } from './evening/world.js';

// THE LONG EVENING — the last place in the game, and the only fully
// beautiful one (docs/finale_long_evening.md).
//
// No objective, no HUD, no hearts, no coins, no timer, no enemies, no death,
// no orb. The HUD fades out in the first six seconds and that is the whole
// tutorial. The only verb is help, and even that is optional. The town wraps;
// the road, once the hedge opens, walks into the night.
const T = 32;
const px = (t) => t * T + T / 2;
const WRAP_DX = EV.E0 * T;
const HEART = { rows: ['.hh.hh.', 'hhhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...'], pal: { h: 0xe86a6a } };
const DREAM_CAST = ['priya', 'nia', 'delphine', 'ray', 'marguerite', 'bastien'];
const wait = (scene, ms) => new Promise((res) => scene.time.delayedCall(ms, res));

export default class EveningScene extends BaseLevel {
  constructor() {
    super('Evening');
  }

  // a restart re-runs create() on this same instance; everything per-visit
  // is reset here (see AstronautScene.init for why that matters)
  init(data) {
    this.fromDoor = !!(data && data.fromDoor);
    this.joSitting = false;
    this.joSeated = null;
    this.sitBench = null;
    this.sitT = 0;
    this.downHeld = 0;
    this.upHeld = 0;
    this.lookingUp = false;
    this.stillSince = 0;
    this.stillFor = 0;
    this.activity = null;
    this.carrying = null;
    this.holdImg = null;
    this.helped = new Set();
    this.ending = false;
    this.stationEnded = false;
    this.ridgeEnded = false;
    this.roadOpen = false;
    this.her = null;
    this.herWalking = false;
    this.walkedAlone = false;
    this.herDecided = false;
    this.hasCamera = false;
    this.photos = 0;
    this.trumpetDown = null;
    this.trumpetKid = null;
    this.barefoot = false;
    this.shoesImg = null;
    this.wetUntil = 0;
    this.distance = 0;
    this.lastX = null;
    this.poseKey = null;
    this.poseUntil = 0;
    this.noteStep = 4;
    this.lastJoinAt = 0;
    this.placeNow = 'arch';
    this.visitedPlaces = new Set();
    this.maxFall = 0;
    this.nextFidget = 0;
    this.napAt = 0;
    this.napping = false;
    this.snowmanDone = false;
    this.snowmanHeadPlaced = false;
    this.noorGone = false;
    this.kiteFlying = false;
    this.roadBeats = new Set();
    this.paused = null;
    this.rainbowUntil = 0;
    this.saturateUntil = 0;
    this.lastRoaster = null;
    this.prints = [];
    this.tintT = 0;
    this.lightCache = null;
    this.uiPins = [];
    this.wasOnRoad = false;
    // (these also outlive a visit if not reset: a stale herWaiting sets Wren
    // off from the chess table, a stale catComing stops every cat coming, a
    // stale snowBody means it never snows a snowman again)
    this.herWaiting = false;
    this.herStopT = 0;
    this.catComing = null;
    this.snowBody = null;
    this.snowHeadImg = null;
    this.snowballFight = null;
    this.leafOnHat = null;
    this.umbrella = null;
    this.weddingFolk = null;
    this.sheltered = [];
    this.sitAnim = null;
    this._room = null;
  }

  create() {
    const params = new URLSearchParams(window.location.search);
    this.save = getSave();
    this.firstVisit = !this.save.evening.visited || params.get('first') === '1';
    updateSave((s) => (s.evening.visited = true));
    music.stop();

    createEveningTextures(this);
    createJoEveningTextures(this);
    createPixelTexture(this, 'heart', HEART.rows, HEART.pal, 3);

    const built = RoomBuilder.build(this, eveningRooms, eveningTiles);
    this.built = built;
    this.solids = built.solids;
    this.oneWays = built.oneWays;
    this.slopeGrid = built.slopeGrid;
    this.climbGrid = built.climbGrid;
    this.ladderGrid = built.ladderGrid;
    this.surfaceGrid = built.surfaceGrid;
    this.ground = makeGround(built);
    this.groundY = (x, fromY) => this.ground.groundY(x, fromY);
    this.terrainCols = bucketTerrain(this);

    // Jo, walking a little slower than anywhere else, trumpet in hand
    const spawnO = built.objects.find((o) => o.type === 'spawn');
    const p = new Player(this, spawnO.wx, this.groundY(spawnO.wx, spawnO.wy - 40) - 24);
    this.player = p;
    p.speed = 215;
    p.upJumps = false;
    p.tool.setTexture('tool-trumpet');
    this.hatBase = p.hat.tintTopLeft; // whatever Bilal sold him, under the evening's light
    this.joShadow = this.add.image(p.x, p.y, 'ev-shadow').setOrigin(0.05, 0.5).setDepth(9).setAlpha(0.3);
    this.joRim = this.add.image(p.x, p.y, 'jo-stand').setDepth(11.9).setTintFill(0xffd890).setAlpha(0.5);
    this.hatSnow = this.add.rectangle(0, 0, 18, 3, 0xf4f8ff).setDepth(13.2).setVisible(false);

    this.setupEvening(built);

    // the far things: the sky, the four bands of the horizon
    this.sky = new Sky(this, -30);
    this.horizon = new Horizon(this, -27.4);
    this.sky.onShootingStar = () => {
      if (this.joSitting && !this.ending) this.pose('jo-sit-up', 2200);
      if (this.her && this.herWalking) this.her.line('…did you see that.', false);
    };
    this.weather = new Weather(this, { firstVisit: this.firstVisit, forced: params.get('weather') });
    this.soundscape = new Soundscape();
    this.ensemble = new Ensemble();

    this.world = buildWorld(this, built.objects);
    buildArchitecture(this);
    this.laundryLine = this.world.laundry;
    this.laundryDoor = (this.world.doors.find((d) => d.id === 'door_laundry_e') || { x: px(141) }).x;
    this.buildLine();
    this.buildPeople(built.objects);
    this.buildCritters(built.objects);
    this.talk = new Talk(this, this.folk, { knows: (id) => this.knows(id) });
    this.activities = makeActivities(this);
    this.director = new Director(this);
    if (params.get('rare')) this.director.force(params.get('rare'));
    this.buildLeaves();
    this.buildLight();
    this.weatherHooks();
    if (params.get('weather')) this.weather.force(params.get('weather'));

    this.physics.add.collider(p, this.solids, null, () => !p.climbing);
    this.physics.add.collider(p, this.oneWays, null, () => !p.climbing);

    this.prompt = this.add
      .text(0, 0, '', { fontFamily: 'monospace', fontSize: '11px', color: '#f2e9d8', backgroundColor: '#1b1725c0', padding: { x: 5, y: 2 } })
      .setOrigin(0.5, 1)
      .setDepth(90)
      .setVisible(false);

    // after everything that draws Jo, paint the evening's light onto him
    this._joLight = () => this.lightJo();
    this.events.on('postupdate', this._joLight);
    this.events.once('shutdown', () => {
      this.events.off('postupdate', this._joLight);
      if (this.soundscape) this.soundscape.stop();
      const out = audioOut();
      if (out) out.gain.value = 0.35;
    });

    const warped = this.devWarp(params.get('ev'));
    if (!warped) this.arrive();
    if (params.get('nohud') !== '1') this.hudRitual();
    this.markPlace(true);
  }

  // ---- plumbing: camera, keys, the dialogue host --------------------------
  setupEvening(built) {
    this.cardActive = false;
    this.dialogActive = false;
    this.puzzleActive = false;
    this.flagsState = {};
    this.worldH = built.worldH;
    this.checkpoint = { x: this.player.x, y: this.player.y };
    this.dialog = new DialogueBox(this);
    this.physics.world.setBounds(0, 0, built.worldW, built.worldH + 200);
    const cam = this.cameras.main;
    // bounds reach far above the world: looking up is looking at sky
    cam.setBounds(0, -800, built.worldW, (EV.GROUND + 7) * T + 800);
    cam.startFollow(this.player, true, 0.08, 0.08);
    cam.setDeadzone(80, 60);
    cam.followOffset.y = 90; // more sky than street: it's that kind of place
    cam.fadeIn(900, 20, 14, 8);
    this.baseOffsetY = 90;
    this.keyEsc = this.input.keyboard.addKey('ESC');
    this.keyQ = this.input.keyboard.addKey('Q');
    this.keyC = this.input.keyboard.addKey('C');
    this.keyA = this.input.keyboard.addKey('A');
    this.input.keyboard.on('keydown-M', () => toggleMusic());
    this.input.keyboard.on('keydown-B', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });
  }

  pressed(k) {
    if (!this._pressed) return false;
    if (k in this._pressed) return this._pressed[k];
    if (k === 'SPACE') return (this._pressed.SPACE = Phaser.Input.Keyboard.JustDown(this.player.keys.SPACE));
    return false;
  }

  canHear(x, tiles) {
    return Math.abs(x - this.player.x) < tiles * T;
  }

  knows(id) {
    const def = CAST[id];
    if (!def || !def.knows) return false;
    if (def.knows === 'always') return true;
    return !!(this.save.met[def.knows] || this.save.dreams[def.knows]);
  }

  noteHelped(id) {
    if (id) this.helped.add(id);
  }

  // ---- the people -----------------------------------------------------------
  buildPeople(objects) {
    this.folk = {};
    const s = this.save;
    // §8 reseeding: a few people swap corners from visit to visit
    const swaps = { delphine: 'marguerite', bastien: 'nia' };
    const pos = {};
    for (const o of objects.filter((x) => x.type === 'npc')) pos[o.who] = o;
    for (const [a, b] of Object.entries(swaps)) {
      if (Math.random() < 0.5 && pos[a] && pos[b]) [pos[a], pos[b]] = [{ ...pos[b], who: a }, { ...pos[a], who: b }];
    }
    for (const o of Object.values(pos)) {
      const def = CAST[o.who];
      if (!def) continue;
      // the dreams' people are here only if Jo met them
      if (DREAM_CAST.includes(o.who) && !this.knows(o.who)) continue;
      // Marcus only if he walked out into the rain to be with her
      if ((o.who === 'marcus' || o.who === 'marcus_kid') && !['go', 'silent'].includes(s.cast.marcus_left)) continue;
      const f = new Townsfolk(this, o.who, def, o.wx, o.wy, { sit: !!o.sit, still: !!o.still });
      f.homeSit = !!o.sit;
      this.folk[o.who] = f;
    }
    // the fisherman says something different every visit
    if (this.folk.fisherman) this.folk.fisherman.def = { ...CAST.fisherman, idle: Phaser.Utils.Array.Shuffle([...CAST.fisherman.idle]) };
    // Noor's mum is on her way, always, until she isn't
    const mum = new Townsfolk(this, 'mother', CAST.mother, px(311), px(31));
    mum.hide();
    this.folk.mother = mum;
  }

  buildCritters(objects) {
    this.cats = [];
    this.flocks = [];
    this.herons = [];
    this.standers = [];
    this.motes = [];
    const coats = Phaser.Utils.Array.Shuffle(CAT_COATS.map((_, i) => i));
    let ci = 0;
    for (const o of objects) {
      switch (o.type) {
        case 'cat':
          this.cats.push(new Cat(this, o.wx, o.wy, o.routine, coats[ci++ % coats.length]));
          break;
        case 'dog':
          this.dog = new Dog(this, o.wx, o.wy);
          break;
        case 'pigeons':
          this.flocks.push(new Flock(this, o.wx, this.groundY(o.wx, o.wy - 40) - (o.lift || 20), o.n || 5));
          break;
        case 'swallows':
          this.flocks.push(new Flock(this, o.wx, o.wy, 6, 'swallow'));
          break;
        case 'heron':
          this.herons.push(new Heron(this, o.wx, o.wy));
          break;
        case 'goat': {
          // the goat is on a roof nobody explains — a different roof each visit
          const roofs = [o.wx, px(266), px(255)];
          const gx = roofs[Math.floor(Math.random() * roofs.length)];
          this.goat = new Stander(this, gx, gx === o.wx ? o.wy : px(19), 'ev-goat', { chew: true, depth: 10.1 });
          this.standers.push(this.goat);
          break;
        }
        case 'sheep':
          this.standers.push(new Stander(this, o.wx, o.wy, 'ev-sheep', { wander: 3 }));
          break;
        case 'deer':
          this.deer = new Stander(this, o.wx, o.wy, 'ev-deer', { faceJo: true });
          this.standers.push(this.deer);
          break;
        case 'owl': {
          const owl = this.add.image(o.wx, this.groundY(o.wx, o.wy) - 46, 'ev-owl').setDepth(-11);
          this.owl = { x: o.wx, img: owl };
          // it blinks, slowly, as owls do
          this.time.addEvent({
            delay: 4000,
            loop: true,
            callback: () => {
              owl.setScale(1, 0.85);
              this.time.delayedCall(140, () => owl.setScale(1));
            },
          });
          break;
        }
        case 'fireflies':
          this.motes.push(new Motes(this, o.wx + (o.w || 6) * 16, o.wy, 22, 'firefly'));
          break;
        case 'bees':
          this.motes.push(new Motes(this, o.wx, o.wy, 8, 'bee'));
          break;
        case 'moths':
          this.motes.push(new Motes(this, o.wx, o.wy + 8, 6, 'moth'));
          break;
        default:
          break;
      }
    }
    // moths at every lamp at the east end
    for (const l of this.world.lamps) if (l.x > px(370)) this.motes.push(new Motes(this, l.x, l.y, 5, 'moth'));
  }

  // ---- the washing line ------------------------------------------------------
  buildLine() {
    const L = this.laundryLine;
    if (!L) return;
    this.lineSheets = [];
    for (let i = 0; i < 3; i++) this.hangSheet(false, true);
  }

  hangSheet(caught = false, quiet = false) {
    const L = this.laundryLine;
    if (!L || this.lineSheets.length >= 8) return;
    const i = this.lineSheets.length;
    const x = L.x0 + 26 + i * ((L.x1 - L.x0 - 40) / 7);
    const key = i % 3 === 1 ? 'ev-sheet-b' : 'ev-sheet';
    const sh = this.add.image(x, L.y + 4, key).setOrigin(0.5, 0).setDepth(-10.5);
    // its shadow moves on the wall behind
    sh.shadow = this.add.image(x + 8, L.y + 10, key).setOrigin(0.5, 0).setDepth(-10.52).setTintFill(0x3a3050).setAlpha(0.22);
    sh.ph = Math.random() * 6;
    this.lineSheets.push(sh);
    if (!quiet && caught) sfx('flap');
  }

  lineSheetCount() {
    return this.lineSheets ? this.lineSheets.length : 0;
  }

  takeSheets(n) {
    let k = 0;
    while (k < n && this.lineSheets.length) {
      const sh = this.lineSheets.pop();
      sh.shadow.destroy();
      sh.destroy();
      k++;
    }
    return k;
  }

  // one gets away down the lane, and somebody has to chase it
  escapeSheet(fromX) {
    const sh = this.lineSheets.pop();
    if (!sh) return null;
    sh.shadow.destroy();
    const y = this.groundY(fromX + 10 * T, sh.y) - 10;
    this.tweens.add({ targets: sh, x: fromX + 10 * T, y, angle: 360 * 2, duration: 5200, ease: 'sine.out' });
    return sh;
  }

  updateLine(time) {
    const L = this.laundryLine;
    if (!L) return;
    L.lineG.clear().lineStyle(1, 0x3a3030, 0.8).lineBetween(L.x0, L.y, L.x1, L.y);
    // four states of wind: calm, breeze, wind, gust
    const w = this.weather.wind;
    for (const sh of this.lineSheets) {
      const gust = w > 0.8 ? Math.sin(time / 90 + sh.ph) * 8 : 0;
      const ang = -(w * 62) + Math.sin(time / (700 - w * 400) + sh.ph) * (4 + w * 10) + gust;
      const sy = 1 - w * 0.45;
      sh.setAngle(ang).setScale(1, sy);
      sh.shadow.setAngle(ang).setScale(1, sy).setPosition(sh.x + 8 + w * 10, sh.y + 8);
    }
  }

  // ---- arrival --------------------------------------------------------------
  arrive() {
    const p = this.player;
    p.controlLockUntil = this.time.now + 1400;
    p.setFlipX(false);
  }

  // A1-§5 — the HUD, one element at a time, in the order the game introduced
  // them, each with a soft sound. Nothing replaces them.
  hudRitual() {
    const cam = this.cameras.main;
    const hud = [];
    const hearts = [0, 1, 2].map((i) => this.add.image(28 + i * 30, 30, 'heart').setScrollFactor(0).setDepth(150));
    const coin = [
      this.add.circle(cam.width - 150, 82, 6, 0xc08a50).setScrollFactor(0).setDepth(150),
      this.add.text(cam.width - 138, 82, `${this.save.wallet.total ? '0   $' + this.save.wallet.total : '0'}`, { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150),
    ];
    const objective = [this.add.text(cam.width - 16, 52, '—', { fontFamily: 'monospace', fontSize: '13px', color: '#f2d580', stroke: '#14101c', strokeThickness: 4 }).setOrigin(1, 0).setScrollFactor(0).setDepth(150)];
    const meters = [
      this.add.rectangle(16, 112, 90, 6, 0x2a2a34).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150),
      this.add.rectangle(16, 112, 70, 6, 0x88b8d8).setOrigin(0, 0.5).setScrollFactor(0).setDepth(150),
    ];
    const rest = [
      this.add.text(16, 52, 'THE LONG EVENING', { fontFamily: 'monospace', fontSize: '14px', color: '#e8dcc8', stroke: '#14101c', strokeThickness: 4 }).setScrollFactor(0).setDepth(150),
      this.add.text(cam.width - 16, 26, '[Esc] pause', { fontFamily: 'monospace', fontSize: '12px', color: '#c8c0b0', stroke: '#14101c', strokeThickness: 3 }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(150),
    ];
    hud.push(hearts, coin, objective, meters, rest);
    hud.forEach((group, i) => {
      this.time.delayedCall(700 + i * 1150, () => {
        sfx('hud_fade');
        this.tweens.add({ targets: group, alpha: 0, duration: 800, onComplete: () => group.forEach((o) => o.destroy()) });
      });
    });
  }

  // ---- dev: ?ev=<place> opens the evening there ------------------------------
  devWarp(at) {
    if (!at) return false;
    const WARPS = {
      arch: 58, orchard: 92, laundry: 126, square: 160, canal: 200, steep: 226, roofs: 252, school: 296, gardens: 320, hill: 358, station: 390,
      road: 470, orchard_road: 500, fields: 530, lake: 556, stars: 584, foothills: 620, pines: 650, stream: 680, switchbacks: 712, treeline: 740, ridge: 770,
    };
    const col = WARPS[at];
    if (col === undefined) return false;
    const p = this.player;
    const x = px(col);
    const y = this.groundY(x, 0) - 26;
    p.setPosition(x, y);
    p.body.reset(x, y);
    this.cameras.main.centerOn(x, y - 90);
    if (col >= 400) {
      this.openRoad(true);
      if (this.dog) {
        this.dog.following = true;
        this.dog.x = x - 40;
      }
      this.startHer(x - 30, true);
      this.sky.phase = this.sky.target = Math.max(0, Math.min(10, (col - EV.R0) / 30));
      this.sky.starPhase = this.sky.phase;
    }
    if (at === 'station') this.stationEnded = false;
    this.lastX = p.x;
    const t = this.add.text(p.x, p.y - 70, `[dev] ${at}`, { fontFamily: 'monospace', fontSize: '12px', color: '#7ec8d8' }).setOrigin(0.5).setDepth(90);
    this.tweens.add({ targets: t, alpha: 0, delay: 1500, duration: 800, onComplete: () => t.destroy() });
    return true;
  }

  // ===========================================================================
  // the frame
  // ===========================================================================
  update(time, delta) {
    if (this.paused) return this.updatePause();
    if (this.dialogActive) return;
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc) && !this.ending) return this.openPause();
    const p = this.player;
    const dt = delta / 1000;
    const k = p.keys;
    const ak = p.art.texture.key;
    if (ak.endsWith('-bare')) p.art.setTexture(ak.replace('-bare', ''));
    this._pressed = {
      E: Phaser.Input.Keyboard.JustDown(k.E),
      Q: Phaser.Input.Keyboard.JustDown(this.keyQ),
      C: Phaser.Input.Keyboard.JustDown(this.keyC),
      X: Phaser.Input.Keyboard.JustDown(k.X),
    };
    const left = p.cursors.left.isDown || k.A.isDown;
    const right = p.cursors.right.isDown || k.D.isDown;
    const jump = k.W.isDown || k.SPACE.isDown;
    const down = p.cursors.down.isDown || k.S.isDown;
    const up = p.cursors.up.isDown;

    // stillness is a verb here: cats come, fireflies gather, someone stands by
    if (left || right || jump || Math.abs(p.body.velocity.x) > 12 || !p.body.onFloor()) this.stillSince = time;
    this.stillFor = time - this.stillSince;

    // --- motion -------------------------------------------------------------
    if (this.ending) {
      p.body.setVelocityX(0);
    } else if (this.joSeated) {
      this.updateSeat(time, dt, { left, right, jump });
    } else if (this.joSitting) {
      if (left || right || jump) this.joStand();
    } else {
      const nearLadder = this.ladderNear();
      if (down && p.body.onFloor() && !nearLadder && !left && !right) {
        this.downHeld += delta;
        if (this.downHeld > 320) this.joSit({});
      } else this.downHeld = 0;
      if (up && p.body.onFloor() && !nearLadder && !left && !right && !this.lookingUp) {
        this.upHeld += delta;
        if (this.upHeld > 240) this.startLookUp();
      }
      if (this.lookingUp && (!up || left || right || jump)) this.stopLookUp();
      if (!up) this.upHeld = 0;
      if (!this.joSitting) {
        if (this.lookingUp) p.body.setVelocityX(0);
        else {
          p.slippery = this.onIce();
          p.update(time, delta);
        }
      }
    }

    // --- the verbs ----------------------------------------------------------
    if (!this.ending) {
      if (this.pressed('Q') && !(this.activity && this.activity.id === 'bo')) this.playNote(up, down);
      if (this.pressed('C') && this.hasCamera) this.photograph();
      if (this.pressed('X')) this.throwThing();
      this.interactions();
    }
    if (this.activity) {
      if (this.activity.running) this.activity.update(time, delta);
      else this.activity = null;
    }

    this.wrapCheck();
    this.trackWalk(time);
    this.markPlace(false);
    this.updateSits(time, delta);
    this.updateCameraFrame();
    this.updateArrival();

    // --- the world ------------------------------------------------------------
    const onRoad = (p.y < (EV.DECK + 1) * T && p.x > px(390)) || p.x > px(EV.R0);
    this.onRoadNow = onRoad && p.x > px(404);
    const prog = this.onRoadNow ? Phaser.Math.Clamp((p.x / T - EV.R0) / 30, 0, 10) : 0;
    this.roadProgress = prog;
    this.sky.setTarget(prog);
    this.sky.setWeather(this.weather.rain, this.weather.snow);
    this.sky.update(time, delta);
    const light = this.light();
    this.weather.update(time, delta, {
      edges: (cam) => this.ground.edges(cam),
      water: (cam) => this.ground.water(cam),
      surfaceY: (x) => this.ground.surfaceFrom(x, this.cameras.main.scrollY),
      tops: (a, b) => this.ground.tops(a, b),
    });
    this.horizon.update(time, delta, {
      ambient: light.ambient,
      horizonColour: this.sky.skyCols ? this.sky.skyCols[2] : 0xf8d890,
      player: p,
      sunX: this.sky.sunPos ? this.sky.sunPos.x : 150,
      snow: this.weather.snow,
      rain: this.weather.rain,
      onRoad,
      roadProgress: prog,
    });
    this.updateTerrainLight(time, light);
    this.updateLeaves(time, dt);
    this.updateLine(time);
    this.updatePuddles(time);
    this.updateLake(time);
    this.updateTufts(time);
    this.updateLamps(prog);

    // people and animals
    this.talk.update(time, delta, {
      player: p,
      busy: !!this.activity || this.ending,
      sittingNear: (members) => this.joSitting && members.some((m) => Math.abs(m.x - p.x) < 5 * T),
    });
    if (this.her && this.her.update) this.her.update(time, delta);
    for (const f of Object.values(this.folk)) f.update(time, delta, light);
    if (this.weddingFolk) this.weddingFolk = this.weddingFolk.filter((f) => f.art.active && (f.update(time, delta, light), true));
    this.updateHerAtHedge(time);
    const cctx = this.critterCtx(light);
    this.cats.forEach((c) => c.update(time, delta, cctx));
    if (this.dog) this.dog.update(time, delta, cctx);
    this.flocks.forEach((f) => f.update(time, delta, cctx));
    this.herons.forEach((h) => h.update(time, delta, cctx));
    this.standers.forEach((s) => s.update(time, delta, cctx));
    this.motes.forEach((m) => m.update(time, delta, cctx));
    if (this.owl) this.owl.img.setTint(light.ambient);
    this.director.update(time, delta);
    this.updateTrumpetKid(time);
    this.updateRoad(time);
    this.updateSound(time, delta);
    this.updateOverlay(time, light);

    // Jo's small life: steps, footprints, fidgets, looking at things
    this.joSmallLife(time, delta);
    this.updateSwingIdle(dt);
    this.updateUIPins();
  }

  // ---- light ------------------------------------------------------------------
  light() {
    const amb = this.sky.ambient();
    const night = Phaser.Math.Clamp((this.sky.phase - 4) / 4, 0, 1);
    const rim = this.sky.rim();
    this.lightCache = {
      ambient: amb,
      rim,
      rimAlpha: (0.55 - night * 0.3) * (1 - this.weather.rain * 0.7) + (this.sky.moonUp || 0) * 0.25,
      // shadows lie long and blue from the low sun; the moon's are short
      shadow: night > 0.5 ? 0x101830 : 0x2a3050,
      shadowAlpha: (0.34 - this.weather.rain * 0.2) * (1 - night * 0.5),
      shadowLen: night > 0.6 ? 0.6 : 1.1 - this.weather.rain * 0.4,
      aurora: this.sky.aurora,
    };
    return this.lightCache;
  }

  // the terrain takes the light a few dozen columns at a time
  updateTerrainLight(time, light) {
    if (time < this.tintT) return;
    this.tintT = time + 200;
    const cam = this.cameras.main;
    const z = cam.zoom;
    const tx0 = Math.floor((cam.scrollX - (cam.width / z - cam.width) / 2) / T) - 3;
    const tx1 = Math.ceil((cam.scrollX + cam.width + (cam.width / z - cam.width) / 2) / T) + 3;
    for (let tx = Math.max(0, tx0); tx <= Math.min(this.terrainCols.length - 1, tx1); tx++) {
      const col = this.terrainCols[tx];
      if (!col) continue;
      for (const img of col) {
        const c = mulC(mulC(img.baseTint === undefined ? 0xffffff : img.baseTint, img.zone), light.ambient);
        if (img.lastTint !== c) {
          img.setTint(c);
          img.lastTint = c;
        }
      }
    }
  }

  // Jo in the light: tint, rim, long shadow, snow on his hat, wet in the rain
  lightJo() {
    const p = this.player;
    if (!p || !p.art || !this.lightCache) return;
    const L = this.lightCache;
    const now = this.time.now;
    // pose overrides (a laugh, a shrug, sitting, sleeping, looking up)
    let key = null;
    if (this.napping) key = 'jo-sleep';
    else if (this.joSitting) key = now < this.poseUntil && this.poseKey === 'jo-sit-up' ? 'jo-sit-up' : this.barefoot ? 'jo-sit-bare' : this.sitAnim || 'jo-sit';
    else if (this.lookingUp) key = 'jo-lookup';
    else if (now < this.poseUntil && this.poseKey) key = this.poseKey;
    else if (this.barefoot) key = p.art.texture.key === 'jo-run' ? 'jo-run-bare' : p.art.texture.key === 'jo-stand' ? 'jo-stand-bare' : null;
    if (key && p.art.texture.key !== key) p.art.setTexture(key);
    const wet = now < this.wetUntil || this.weather.rain > 0.2;
    const tint = mulC(wet ? 0xb4bccc : 0xffffff, L.ambient);
    p.art.setTint(tint);
    p.hat.setTint(mulC(this.hatBase === undefined ? 0xffffff : this.hatBase, tint));
    this.joRim.setTexture(p.art.texture.key).setPosition(p.art.x - 1.5, p.art.y).setFlipX(p.art.flipX).setScale(p.art.scaleX, p.art.scaleY).setAngle(p.art.angle).setVisible(p.shown).setTintFill(L.rim).setAlpha(L.rimAlpha);
    const feet = this.joSitting && this.sitBench ? this.sitBench.y : p.y + 24;
    this.joShadow.setPosition(p.x - 6, feet - 1).setTint(L.shadow).setAlpha(p.shown ? L.shadowAlpha : 0).setScale(L.shadowLen * (this.joSitting ? 0.7 : 1), 1);
    // snow settles on his hat and shoulders too
    const cover = this.weather.cover;
    this.hatSnow.setVisible(cover > 0.1 && p.shown).setPosition(p.hat.x, p.hat.y - 6).setScale(1, 0.6 + cover).setAlpha(Math.min(1, cover * 2));
    if (wet && Math.random() < 0.08 && p.shown) {
      const d = this.add.image(p.hat.x + Phaser.Math.Between(-8, 8), p.hat.y + 4, 'ev-drop').setDepth(13.1).setTint(0xd8e8f8).setAlpha(0.7);
      this.tweens.add({ targets: d, y: d.y + 18, alpha: 0, duration: 400, onComplete: () => d.destroy() });
    }
    // things he's holding ride in his hands
    if (this.holdImg) this.holdImg.setPosition(p.art.x + (p.flipX ? -12 : 12), p.art.y + 2).setFlipX(p.flipX).setVisible(p.shown);
    if (this.carrying) this.carrying.img.setPosition(p.art.x + (p.flipX ? -14 : 14), p.art.y - 2).setVisible(p.shown);
    if (this.leafOnHat) this.leafOnHat.setPosition(p.hat.x + 4, p.hat.y - 6);
  }

  // warm light that breathes; after the rain, everything a little richer
  buildLight() {
    const cam = this.cameras.main;
    const w = cam.width / 0.55;
    const h = cam.height / 0.55;
    this.warm = this.add.rectangle(cam.width / 2, cam.height / 2, w, h, 0xf8b860, 0.06).setScrollFactor(0).setDepth(80);
    this.gold = this.add.rectangle(cam.width / 2, cam.height / 2, w, h, 0xf8d890, 0).setScrollFactor(0).setDepth(240);
    this.flash = this.add.rectangle(cam.width / 2, cam.height / 2, w, h, 0xffffff, 0).setScrollFactor(0).setDepth(241);
  }

  updateOverlay(time, light) {
    const night = Phaser.Math.Clamp((this.sky.phase - 3) / 3, 0, 1);
    const breath = this.director.breath;
    const after = time < this.saturateUntil ? 0.07 : 0;
    this.warm.setFillStyle(night > 0.5 ? 0x4060a0 : 0xf8b860, night > 0.5 ? 0.04 + (1 - night) * 0.02 : 0.045 + breath * 0.05 + after - this.weather.rain * 0.03);
    // the rainbow: over the sea, for anyone high enough to see it
    if (this.sky.rainbow.alpha > 0 && this.rainbowUntil && time > this.rainbowUntil) {
      this.rainbowUntil = 0;
      this.sky.showRainbow(false);
    }
    void light;
  }

  updateLamps(prog) {
    // the lamps come on as it gets dark (the town's stay gold-lit, just warm)
    const on = this.onRoadNow ? Phaser.Math.Clamp((prog - 2) / 2, 0, 1) : 0.25;
    for (const l of this.world.lamps) l.glow.setAlpha(on * (0.55 + Math.sin(this.time.now / 300 + l.x) * 0.05));
  }

  // ---- ground helpers -------------------------------------------------------
  ladderNear() {
    const p = this.player;
    const lg = this.ladderGrid;
    const tx = Math.floor(p.x / T);
    const ty = Math.floor((p.y + 24) / T);
    for (let dy = -1; dy <= 2; dy++) if (lg[ty + dy] && lg[ty + dy][tx]) return true;
    return false;
  }

  onIce() {
    const p = this.player;
    const sg = this.surfaceGrid;
    const tx = Math.floor(p.x / T);
    const ty = Math.floor((p.y + 26) / T);
    return !!(sg[ty] && sg[ty][tx] === 'ice');
  }

  slopeUnder() {
    const p = this.player;
    const sg = this.slopeGrid;
    const tx = Math.floor(p.x / T);
    const ty = Math.floor((p.y + 24) / T);
    return !!((sg[ty] && sg[ty][tx]) || (sg[ty + 1] && sg[ty + 1][tx]));
  }

  // ===========================================================================
  // sitting — the most important verb in the level
  // ===========================================================================
  joSit({ x = null } = {}) {
    const p = this.player;
    if (this.joSitting || !p.body.onFloor()) return;
    if (this.lookingUp) this.stopLookUp();
    // un-crouch: the hitbox must be whole again under the sitting drawing
    if (p.crouching) {
      p.crouching = false;
      p.body.setSize(24, 44, false).setOffset(4, 2);
    }
    let bench = null;
    if (x === null) {
      bench = this.world.benches.find((b) => Math.abs(b.x - p.x) < 34 && Math.abs(b.y - (p.y + 24)) < 30);
      if (bench) x = bench.x + (p.x < bench.x ? -10 : 10);
    }
    if (x !== null) {
      p.x = x;
      p.body.reset(x, p.y);
    }
    p.body.setVelocity(0, 0);
    this.joSitting = true;
    this.sitBench = bench;
    this.sitAnim = 'jo-sitdown';
    p.poseDy = 4;
    this.time.delayedCall(120, () => {
      if (!this.joSitting) return;
      this.sitAnim = 'jo-sit';
      p.poseDy = 8;
      p.artDy = bench ? -10 : 0;
    });
    this.sitT = 0;
    // the camera drifts out a little, the music thins, the place comes forward
    this.cameras.main.zoomTo(this.baseZoom() * 0.95, 1500, 'Sine.easeInOut', true);
  }

  joStand() {
    const p = this.player;
    if (!this.joSitting) return;
    this.joSitting = false;
    this.sitAnim = null;
    p.poseDy = 0;
    p.artDy = 0;
    this.sitBench = null;
    this.napping = false;
    if (this.leafOnHat && Math.random() < 0.7) {
      const l = this.leafOnHat;
      this.leafOnHat = null;
      this.tweens.add({ targets: l, y: l.y + 40, x: l.x + 20, angle: 200, alpha: 0, duration: 1400, onComplete: () => l.destroy() });
    }
    // (force: a zoom already running would otherwise swallow this one)
    this.cameras.main.zoomTo(this.baseZoom(), 900, 'Sine.easeInOut', true);
  }

  baseZoom() {
    const room = RoomBuilder.roomAt(this.built.rooms, this.player.x);
    return room && room.vista && !this.onRoadNow ? 0.75 : room && room.vista ? 0.85 : 1;
  }

  // the swing and the rowboat: Jo is drawn by the seat, not by physics
  joSeat(kind) {
    const p = this.player;
    this.joSeated = { kind, t: 0, img: this.add.image(p.x, p.y, 'jo-sit').setDepth(12), hat: this.add.image(p.x, p.y, 'jo-hat').setDepth(13) };
    p.shown = false;
    p.body.setVelocity(0, 0);
    p.body.setAllowGravity(false);
    if (kind === 'boat') {
      const b = this.world.rowboat;
      this.joSeated.bx = b.img.x;
      this.joSeated.dir = 1;
      this.tweens.killTweensOf(b.img);
    }
  }

  updateSeat(time, dt, { left, right, jump }) {
    const s = this.joSeated;
    const p = this.player;
    s.t += dt;
    if (s.kind === 'swing') {
      const sw = this.world.swing;
      // pump with left/right; the swing does the rest
      sw.v += (right ? 1 : left ? -1 : 0) * dt * 1.4 - sw.angle * dt * 2.2;
      sw.v *= 0.995;
      sw.angle = Phaser.Math.Clamp(sw.angle + sw.v * dt * 2, -0.9, 0.9);
      const r = 50;
      const sx = sw.pivot.x + Math.sin(sw.angle) * r;
      const sy = sw.pivot.y + Math.cos(sw.angle) * r;
      sw.rope.clear().lineStyle(1, 0x6a4a32, 1).lineBetween(sw.pivot.x - 9, sw.pivot.y, sx - 9, sy).lineBetween(sw.pivot.x + 9, sw.pivot.y, sx + 9, sy);
      sw.seat.setPosition(sx, sy).setAngle(Phaser.Math.RadToDeg(-sw.angle) * 0.4);
      s.img.setPosition(sx, sy - 20).setAngle(Phaser.Math.RadToDeg(-sw.angle) * 0.4).setTint(this.lightCache ? this.lightCache.ambient : 0xffffff);
      s.hat.setPosition(sx, sy - 34).setAngle(Phaser.Math.RadToDeg(-sw.angle) * 0.4);
      p.setPosition(sx, sy - 20);
      p.body.reset(sx, sy - 20);
      if (jump || this.pressed('E')) this.leaveSeat(sx);
    } else {
      // the rowboat: push off and drift, turning slowly; the sky is in the water
      const b = this.world.rowboat;
      const lg = this.world.lakeglass;
      s.bx += s.dir * 14 * dt;
      if (s.bx > lg.x1 - 40 || s.bx < lg.x0 + 40) s.dir *= -1;
      b.img.setPosition(s.bx, b.y + Math.sin(time / 900) * 1.5).setFlipX(s.dir < 0);
      s.img.setPosition(s.bx, b.y - 22).setFlipX(s.dir < 0).setTint(this.lightCache ? this.lightCache.ambient : 0xffffff);
      s.hat.setPosition(s.bx, b.y - 36).setFlipX(s.dir < 0);
      p.setPosition(s.bx, b.y - 30);
      p.body.reset(s.bx, b.y - 30);
      if (left || right || jump || this.pressed('E')) this.leaveSeat(s.bx, true);
    }
  }

  leaveSeat(x, boat = false) {
    const p = this.player;
    const s = this.joSeated;
    s.img.destroy();
    s.hat.destroy();
    this.joSeated = null;
    p.shown = true;
    p.body.setAllowGravity(true);
    // off the boat onto the jetty, which is right there
    const y = this.groundY(x, (boat ? 30 : 26) * T) - 26;
    p.setPosition(x, y);
    p.body.reset(x, y);
    if (this.activity && (this.activity.id === 'swing' || this.activity.id === 'boat')) this.activity.leave();
  }

  // special seats: the station bench ends the evening (§7); the hill bench is
  // for napping (A4.7); the ridge bench is the end of everything (§B6); the
  // fire is warm and nobody says anything
  updateSits(time, delta) {
    if (!this.joSitting) return;
    this.sitT += delta;
    const b = this.sitBench;
    if (!b || this.ending) return;
    if (b.id === 'station_bench' && !this.stationEnded && this.sitT > 20000) this.endingStation();
    if (b.id === 'hill_bench' && !this.napping && this.sitT > 90000 && time > this.napAt) this.nap();
    if (b.id === 'ridge_bench' && !this.ridgeEnded && this.sitT > 2500) this.endingRidge();
  }

  // A4.7 — Jo falls asleep; soft gold, sound underwater; he wakes with a leaf
  // (or snow) on his hat and a cat asleep next to him
  async nap() {
    this.napping = true;
    this.napAt = this.time.now + 180000;
    const out = audioOut();
    this.tweens.add({ targets: this.gold, alpha: 0.42, duration: 3000 });
    if (out) out.gain.setTargetAtTime(0.1, out.context.currentTime, 1.2);
    await wait(this, 7000);
    if (!this.joSitting) return;
    const p = this.player;
    this.leafOnHat && this.leafOnHat.destroy();
    this.leafOnHat = this.weather.cover > 0.2 ? this.add.rectangle(p.hat.x, p.hat.y - 6, 12, 3, 0xf4f8ff).setDepth(13.3) : this.add.image(p.hat.x, p.hat.y - 6, `ev-leaf-${Phaser.Math.Between(0, 2)}`).setDepth(13.3).setScale(1.4);
    const cat = this.cats.filter((c) => c.routine !== 'aloof').sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    if (cat) {
      cat.x = p.x + 26;
      cat.y = this.groundY(cat.x, p.y - 20);
      cat.state = 'sleep';
      cat.target = null;
      cat.following = false;
    }
    this.tweens.add({ targets: this.gold, alpha: 0, duration: 2500 });
    if (out) out.gain.setTargetAtTime(0.35, out.context.currentTime, 1.0);
    this.napping = false;
    this.noticedNap = true;
    this.director.noticed += 1;
  }

  // ---- looking up (B4): the camera tilts, the ground leaves the frame --------
  startLookUp() {
    this.lookingUp = true;
    this.tweens.killTweensOf(this.cameras.main.followOffset);
    this.tweens.add({ targets: this.cameras.main.followOffset, y: this.baseOffsetY + 260, duration: 1400, ease: 'Sine.easeInOut' });
    this.player.hatKnock.angle = this.player.flipX ? 12 : -12;
  }

  stopLookUp() {
    this.lookingUp = false;
    this.upHeld = 0;
    this.tweens.killTweensOf(this.cameras.main.followOffset);
    this.tweens.add({ targets: this.cameras.main.followOffset, y: this.baseOffsetY, duration: 900, ease: 'Sine.easeInOut' });
    this.player.hatKnock.angle = 0;
  }

  pose(key, ms) {
    this.poseKey = key;
    this.poseUntil = this.time.now + ms;
  }

  // Jo has no dialogue options. He grins, shrugs, rolls his eyes, laughs, or
  // gives a two-note toot on the trumpet that always gets a groan.
  joReact(kind, who = null) {
    if (this.ending) return;
    const p = this.player;
    this.lastRoaster = who;
    this.lastRoastAt = this.time.now;
    switch (kind) {
      case 'toot':
        joNote(5, 0.16);
        this.time.delayedCall(200, () => joNote(7, 0.3));
        if (who) this.time.delayedCall(800, () => this.talk.groanAt(who));
        break;
      case 'laugh':
        this.pose('jo-laugh', 1100);
        laughSfx(0.85);
        this.tweens.add({ targets: p.squashScale, y: 0.94, duration: 110, yoyo: true, repeat: 3 });
        break;
      case 'grin':
        this.pose('jo-laugh', 700);
        break;
      case 'shrug':
        this.pose('jo-shrug', 850);
        this.tweens.add({ targets: p.hatKnock, y: -3, duration: 120, yoyo: true });
        break;
      case 'eye_roll':
        this.pose('jo-lookup', 650);
        break;
      default:
        break;
    }
  }

  // ===========================================================================
  // play: the trumpet comes back, and there's nothing to solve with it
  // ===========================================================================
  playNote(up, down) {
    if (this.trumpetDown || this.joSeated) return;
    this.noteStep = Phaser.Math.Clamp(this.noteStep + (up ? 2 : down ? -2 : Phaser.Math.Between(-2, 2)), 0, 9);
    joNote(this.noteStep);
    const tool = this.player.tool;
    this.tweens.add({ targets: tool, angle: this.player.flipX ? 18 : -18, duration: 90, yoyo: true });
    this.onJoPlayed();
  }

  onJoPlayed() {
    const p = this.player;
    const near = (x, tiles) => Math.abs(x - p.x) < tiles * T;
    // birds lift, cats look up, a window opens somewhere
    this.flocks.forEach((f) => near(f.x, 7) && f.lift());
    this.cats.forEach((c) => near(c.x, 9) && c.lookUp());
    this.herons.forEach((h) => near(h.x, 6) && h.takeOff());
    this.motes.forEach((m) => m.kind === 'firefly' && near(m.x, 14) && m.scatter());
    if (Math.random() < 0.3) {
      const cand = this.horizon.windows.filter((w) => !w.on);
      if (cand.length) this.horizon.lightWindow(cand[Math.floor(Math.random() * cand.length)]);
    }
    // somebody somewhere joins in for a bar
    if (this.time.now > (this.joinedAt || 0)) {
      this.joinedAt = this.time.now + 9000;
      const base = this.noteStep;
      this.time.delayedCall(700, () => [0, 1, 2, 3].forEach((i) => playFx([262, 294, 330, 392, 440, 523, 587, 659, 784, 880][(base + i * 2) % 10] / 2, 0.35, 'triangle', 0.025, i * 0.32)));
    }
    // a toot right after a roast gets a groan
    if (this.lastRoaster && this.time.now - (this.lastRoastAt || 0) < 3000) this.talk.groanAt(this.lastRoaster);
    // snow slides off a roof with a soft thump
    if (this.weather.cover > 0.35 && this.weather.strips.size) {
      let best = null;
      this.weather.strips.forEach((r) => {
        if (r.visible && Math.abs(r.x - p.x) < 4 * T && r.y < p.y - 20 && (!best || r.y < best.y)) best = r;
      });
      if (best) {
        const chunk = this.add.rectangle(best.x, best.y, 30, 6, 0xf4f8ff).setDepth(9);
        best.setVisible(false);
        const gy = this.groundY(best.x, best.y + 4);
        this.tweens.add({ targets: chunk, y: gy, duration: 500, ease: 'quad.in', onComplete: () => {
          sfx('thump');
          this.tweens.add({ targets: chunk, scaleX: 1.6, scaleY: 0.5, alpha: 0, duration: 900, onComplete: () => chunk.destroy() });
        } });
      }
    }
  }

  photograph() {
    sfx('shutter');
    this.flash.setAlpha(0.85);
    this.tweens.add({ targets: this.flash, alpha: 0, duration: 260 });
    this.photos += 1;
    // snapshot after the flash has cleared, so the photo isn't white
    this.time.delayedCall(300, () => takePhoto(this));
  }

  // ===========================================================================
  // E: help, pick up, put down, sit with, take, leave
  // ===========================================================================
  interactions() {
    const p = this.player;
    const cands = [];
    const add = (x, y, label, fn, r = 52) => {
      const d = Phaser.Math.Distance.Between(p.x, p.y, x, y);
      if (d < r) cands.push({ x, y, label, fn, d });
    };
    const busy = !!this.activity || this.joSeated;
    if (!busy) {
      // the people's activities
      for (const a of this.world.anchors) {
        const act = this.activities[a.id];
        if (act) {
          if (!act.available()) continue;
          add(a.x, a.y, act.verb, () => this.startActivity(act), 58);
        } else if (a.id === 'postbox') add(a.x, a.y, 'post something', () => this.postbox(), 44);
        else if (a.id === 'swing') add(a.x, a.y, 'swing', () => this.startActivity(this.activities.swing), 50);
      }
      // rain: grab the sheets off the line
      if (this.activities.sheets.available() && this.laundryLine) add(this.laundryLine.mid, this.laundryLine.y + 40, 'grab the sheets', () => this.startActivity(this.activities.sheets), 7 * T);
      // snow: the snowman's head
      if (this.snowHeadImg && !this.carrying && this.activities.snowman.available()) add(this.snowHeadImg.x, this.snowHeadImg.y, 'carry the head', () => {
        this.snowHeadImg.destroy();
        this.snowHeadImg = null;
        this.startActivity(this.activities.snowman);
      }, 50);
      // the old dog: let him come
      if (this.dog && !this.dog.following) add(this.dog.x, this.dog.y - 10, 'sit with him', () => {
        this.dog.wake();
        this.noteHelped('dog');
      }, 48);
      // the camera on the hill bench
      if (this.world.camera && !this.hasCamera) add(this.world.camera.x, this.world.camera.y, 'a camera', () => this.pickCamera(), 46);
      // the trumpet: set it down on a bench, and it stays; take it back whenever
      if (this.joSitting && this.sitBench && this.sitT > 3000 && !this.trumpetDown && !this.trumpetKid) add(p.x, p.y, 'set the trumpet down', () => this.setTrumpetDown(), 30);
      if (this.trumpetDown) add(this.trumpetDown.x, this.trumpetDown.y, 'the trumpet', () => this.takeTrumpet(), 44);
      if (this.trumpetKid) add(this.trumpetKid.x, this.trumpetKid.y - 20, 'ask for the horn back', () => this.askHorn(), 44);
      // shoes back on
      if (this.shoesImg) add(this.shoesImg.x, this.shoesImg.y, 'shoes on', () => this.toggleShoes(), 40);
      // things to carry
      if (!this.carrying) for (const c of this.world.carry) if (c.img.active) add(c.img.x, c.img.y, 'pick up', () => this.pickUp(c), 40);
    }
    cands.sort((a, b) => a.d - b.d);
    const best = cands[0];
    if (best) {
      this.prompt.setVisible(true).setText(`e · ${best.label}`).setPosition(best.x, best.y - 38);
      if (this.pressed('E')) {
        this._pressed.E = false;
        best.fn();
      }
    } else {
      this.prompt.setVisible(false);
      // E with nothing nearby while carrying: put it down, anywhere at all
      if (this.carrying && (!this.activity || this.activity.id === 'snowman') && this.pressed('E')) this.putDown();
    }
  }

  startActivity(act) {
    if (this.activity && this.activity.running) this.activity.leave();
    this.activity = act;
    this.prompt.setVisible(false);
    act.join();
    if (!act.running) this.activity = null;
  }

  postbox() {
    // nothing to post. that's fine.
    const t = this.add.text(this.player.x, this.player.y - 60, '(nothing to post.)', { fontFamily: 'monospace', fontSize: '12px', color: '#c8c0b0' }).setOrigin(0.5).setDepth(90);
    this.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 2600, onComplete: () => t.destroy() });
  }

  pickCamera() {
    this.hasCamera = true;
    this.world.camera.img.destroy();
    sfx('pickup');
    const t = this.add.text(this.player.x, this.player.y - 64, '(an old camera. [C])', { fontFamily: 'monospace', fontSize: '12px', color: '#f2e9d8' }).setOrigin(0.5).setDepth(90);
    this.tweens.add({ targets: t, y: t.y - 16, alpha: 0, delay: 1600, duration: 1600, onComplete: () => t.destroy() });
  }

  setTrumpetDown() {
    const p = this.player;
    this.trumpetDown = this.add.image(p.x + (p.flipX ? -18 : 18), (this.sitBench ? this.sitBench.y : p.y + 24) - 14, 'tool-trumpet').setDepth(7.5);
    this.trumpetDownAt = this.time.now;
    p.tool.setVisible(false).setAlpha(0);
    p.tool.setScale(0);
  }

  takeTrumpet() {
    if (this.trumpetDown) this.trumpetDown.destroy();
    this.trumpetDown = null;
    const t = this.player.tool;
    t.setScale(1).setAlpha(0.95).setVisible(true);
    sfx('pickup');
  }

  // A4.3 — left long enough, a kid picks it up and plays it terribly
  updateTrumpetKid(time) {
    if (this.trumpetDown && time - this.trumpetDownAt > 180000 && !this.trumpetKid) {
      const kid = ['stones_kid', 'kite', 'waiting_kid'].map((id) => this.folk[id]).filter((f) => f && f.visible && !f.busy).sort((a, b) => Math.abs(a.x - this.trumpetDown.x) - Math.abs(b.x - this.trumpetDown.x))[0];
      if (kid) {
        this.trumpetKid = kid;
        kid.busy = { kid: true };
        kid.walkTo(this.trumpetDown.x, () => {
          if (!this.trumpetDown) {
            kid.busy = null;
            this.trumpetKid = null;
            return;
          }
          kid.carrying = this.trumpetDown;
          this.trumpetDown = null;
          kid.busy = null;
        }, 90);
      }
    }
    const k = this.trumpetKid;
    if (k && k.carrying && time > (this.kidToot || 0) && this.canHear(k.x, 16)) {
      // terribly: the only notes in the whole evening that aren't in the key
      this.kidToot = time + Phaser.Math.Between(2500, 6000);
      [0, 0.2, 0.45].forEach((w) => playFx(300 + Math.random() * 400, 0.25, 'square', 0.05, w));
    }
  }

  askHorn() {
    const k = this.trumpetKid;
    if (!k) return;
    k.say(['Aww.', 'I was getting good.', 'Fine. It was too loud anyway.'][Phaser.Math.Between(0, 2)]);
    if (k.carrying) k.carrying.destroy();
    k.carrying = null;
    this.trumpetKid = null;
    this.takeTrumpet();
  }

  // --- carry: anything can be carried anywhere and put down anywhere -------
  pickUp(c) {
    this.world.carry = this.world.carry.filter((x) => x !== c);
    this.director.forgetDrop(c.img);
    this.carrying = { item: c.item, img: c.img.setDepth(12.8) };
    sfx('pickup');
  }

  giveCarry(item) {
    const key = { loaf: 'ev-loaf', ball: 'ev-ball', can: 'ev-can', stick: 'ev-stick', snowhead: 'ev-snowball' }[item];
    if (this.carrying) this.putDown();
    const img = this.add.image(this.player.x, this.player.y, key).setDepth(12.8);
    if (item === 'snowhead') img.setScale(1.7);
    this.carrying = { item, img };
  }

  putDown() {
    const c = this.carrying;
    if (!c) return;
    this.carrying = null;
    const p = this.player;
    const x = p.x + (p.flipX ? -18 : 18);
    const y = this.groundY(x, p.y - 10);
    c.img.setPosition(x, y - c.img.displayHeight / 2).setDepth(9);
    // the snowman's head goes on the snowman, crooked
    if (c.item === 'snowhead' && this.snowBody && Math.abs(x - this.snowBody.x) < 40) {
      c.img.setPosition(this.snowBody.x + 3, this.snowBody.y - this.snowBody.displayHeight + 4).setAngle(-14);
      this.snowmanHeadPlaced = true;
      sfx('crunch');
      // picked up again after a first try: that's still a snowman
      if (!(this.activity && this.activity.id === 'snowman') && !this.snowmanDone) {
        this.snowmanDone = true;
        this.snowmanScene();
      }
      return;
    }
    if (c.item === 'snowhead') {
      // a snowball on the ground is just a snowball — you can pick it back up
      this.world.carry.push({ item: 'snowhead', img: c.img });
      return;
    }
    this.world.carry.push({ item: c.item, img: c.img });
    this.director.noteDrop(c.item, c.img);
  }

  forgetCarryable(img) {
    this.world.carry = this.world.carry.filter((c) => c.img !== img);
  }

  // X: throw the stick for the dog (or, once, a snowball back at her)
  throwThing() {
    const p = this.player;
    if (this.snowballFight && this.snowballFight.active) return this.snowballFight.throwBack();
    if (!this.carrying || this.carrying.item !== 'stick') return;
    const img = this.carrying.img;
    this.carrying = null;
    const dir = p.flipX ? -1 : 1;
    const tx = p.x + dir * Phaser.Math.Between(5, 7) * T;
    const ty = this.groundY(tx, p.y - 60) - 4;
    img.landed = false;
    this.tweens.add({ targets: img, x: tx, duration: 800 });
    this.tweens.add({ targets: img, y: Math.min(p.y, ty) - 70, duration: 400, ease: 'quad.out', yoyo: false, onComplete: () => this.tweens.add({ targets: img, y: ty, duration: 400, ease: 'quad.in', onComplete: () => (img.landed = true) }) });
    this.tweens.add({ targets: img, angle: dir * 540, duration: 800 });
    if (this.dog && this.dog.following) this.dog.fetch = img;
    else this.world.carry.push({ item: 'stick', img });
  }

  dogHasStick(img) {
    const p = this.player;
    // back he comes; drops it at Jo's feet
    this.time.delayedCall(900, () => {
      img.setPosition(p.x + (p.flipX ? -20 : 20), this.groundY(p.x, p.y) - 4).setAngle(0);
      this.world.carry.push({ item: 'stick', img });
      sfx('woof');
    });
  }

  // --- A4.6 shoes off: an actual animation; then stand in the sea ------------
  toggleShoes() {
    const p = this.player;
    if (!this.barefoot) {
      this.pose('jo-sitdown', 700);
      this.time.delayedCall(500, () => {
        this.barefoot = true;
        this.shoesImg = this.add.image(p.x - (p.flipX ? -14 : 14), this.groundY(p.x, p.y) - 3, 'ev-shoes').setDepth(9);
      });
    } else {
      this.pose('jo-sitdown', 600);
      this.time.delayedCall(450, () => {
        this.barefoot = false;
        if (this.shoesImg) this.shoesImg.destroy();
        this.shoesImg = null;
      });
    }
  }

  // ---- ball, bread, sweep, stones: the scene side of the activities --------
  spawnBall(x) {
    const c = this.world.carry.find((k) => k.item === 'ball');
    let img;
    if (c) {
      img = c.img;
      this.forgetCarryable(img);
    } else img = this.add.image(x, this.groundY(x, this.player.y) - 8, 'ev-ball');
    this.physics.add.existing(img);
    img.body.setCircle(6).setBounce(0.55).setDragX(90).setCollideWorldBounds(true);
    img.collider = this.physics.add.collider(img, this.solids);
    img.setDepth(10.7);
    return img;
  }

  dropBall(img) {
    if (!img || !img.body) return;
    if (img.collider) this.physics.world.removeCollider(img.collider);
    this.physics.world.disable(img);
    this.world.carry.push({ item: 'ball', img });
  }

  noorGoesHome() {
    const kid = this.folk.waiting_kid;
    const mum = this.folk.mother;
    this.noorGone = true;
    const gate = this.world.marks.school_gate ? this.world.marks.school_gate.x : px(310);
    kid.walkTo(gate + 30, () => kid.hide(), 70);
    mum.walkTo(gate + 40, () => mum.hide(), 60);
    // she's back later, waiting again; it's that kind of evening
    this.time.delayedCall(240000, () => {
      kid.show();
      kid.teleport(kid.home.x);
      this.noorGone = false;
    });
  }

  trayLoaves(n) {
    if (this.holdImg && this.holdImg.texture.key === 'ev-tray') this.holdImg.setScale(Math.max(0.5, n / 6), 1);
  }

  joHold(key) {
    if (this.holdImg) this.holdImg.destroy();
    this.holdImg = null;
    if (!key) return;
    if (key === 'broom') {
      this.holdImg = this.add.image(0, 0, 'ev-stick').setDepth(12.9).setAngle(70).setScale(1.6);
      return;
    }
    this.holdImg = this.add.image(0, 0, key).setDepth(12.9);
  }

  sweepLeaves(x, y) {
    for (const l of this.leaves) {
      if (l.settled && Math.abs(l.img.x - x) < 26 && Math.abs(l.img.y - y) < 20) {
        l.settled = false;
        l.vx = (l.img.x < x ? -1 : 1) * Phaser.Math.Between(60, 120);
        l.vy = -Phaser.Math.Between(40, 90);
        l.swept = true;
      }
    }
  }

  // a stone skips n times across the nearest water, rings on each touch
  skimStone(x, y, dir, n, onDone) {
    const lake = this.world.lakeglass;
    const onLake = lake && x > lake.x0 - 6 * T && x < lake.x1 + 6 * T;
    const wx0 = onLake ? lake.x0 : px(196);
    const wx1 = onLake ? lake.x1 : px(207);
    const wy = onLake ? lake.y - 6 : px(36) - T / 2 + 4;
    dir = x < (wx0 + wx1) / 2 ? 1 : -1;
    const stone = this.add.image(x, y - 10, 'ev-stone').setDepth(12.7);
    const hops = [];
    let hx = dir > 0 ? Math.max(x, wx0) + 20 : Math.min(x, wx1) - 20;
    for (let i = 0; i < n; i++) {
      hops.push(hx);
      hx += dir * Math.max(8, 44 - i * 5);
    }
    let i = 0;
    const hop = () => {
      if (i >= hops.length) {
        this.tweens.add({ targets: stone, alpha: 0, duration: 200, onComplete: () => stone.destroy() });
        if (onDone) onDone();
        return;
      }
      const tx = hops[i++];
      this.tweens.add({
        targets: stone,
        x: tx,
        y: wy,
        duration: i === 1 ? 380 : 180 - i * 8,
        ease: 'quad.in',
        onComplete: () => {
          sfx('splash');
          const ring = this.add.ellipse(tx, wy + 2, 6, 2).setStrokeStyle(1, 0xe8f0f8, 0.8).setDepth(-8.4);
          this.tweens.add({ targets: ring, scaleX: 4, scaleY: 2.2, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
          if (i < hops.length) this.tweens.add({ targets: stone, y: wy - 14 + i, duration: 90, ease: 'quad.out', onComplete: hop });
          else hop();
        },
      });
    };
    hop();
  }

  // ===========================================================================
  // the wrap: one frame, identical meadows, nobody can tell
  // ===========================================================================
  wrapCheck() {
    const p = this.player;
    if (p.y < (EV.DECK + 2) * T) return; // up on the viaduct: no wrap
    if (p.x < px(EV.WRAP_WEST) && p.body.velocity.x <= 0) this.wrap(WRAP_DX);
    else if (p.x > px(EV.E0 + EV.WRAP_EAST) && p.x < px(EV.R0) && p.body.velocity.x >= 0) this.wrap(-WRAP_DX);
  }

  wrap(dx) {
    const p = this.player;
    const vx = p.body.velocity.x;
    const vy = p.body.velocity.y;
    p.x += dx;
    p.body.reset(p.x, p.y);
    p.body.setVelocity(vx, vy);
    p.lastPos.x += dx;
    this.cameras.main.scrollX += dx;
    this.lastX = p.x;
    // whoever's with him comes too
    if (this.dog && this.dog.following) this.dog.teleport(dx);
    this.cats.forEach((c) => c.following && c.teleport(dx));
    if (this.her && this.her.f) {
      this.her.f.x += dx;
      if (this.her.f.target !== null) this.her.f.target += dx;
    }
    for (const f of Object.values(this.folk)) if (f.companion && f !== (this.her && this.her.f)) f.teleport(f.x + dx);
  }

  // the doorway he came through becomes an arch the moment he's out of it
  updateArrival() {
    const a = this.world.arch;
    if (!a || a.opened) return;
    if (this.player.x > a.x + 40) {
      a.opened = true;
      this.tweens.add({ targets: a.door, alpha: 0, duration: 1600, ease: 'Sine.easeInOut', onComplete: () => a.door.destroy() });
    }
  }

  // the hill is a vista (zoom 0.75); walking looks a little ahead
  updateCameraFrame() {
    const cam = this.cameras.main;
    const p = this.player;
    if (this.ending) return;
    const room = RoomBuilder.roomAt(this.built.rooms, p.x);
    if (room !== this._room) {
      this._room = room;
      if (!this.joSitting) cam.zoomTo(this.baseZoom(), 1400, 'Sine.easeInOut', true);
    }
    if (Math.abs(p.body.velocity.x) > 40) cam.followOffset.x = p.body.velocity.x > 0 ? -40 : 40;
  }

  // the km on the last card, and the stillness clock
  trackWalk() {
    const p = this.player;
    if (this.lastX === null) this.lastX = p.x;
    const d = Math.abs(p.x - this.lastX);
    if (d < 200) this.distance += d;
    this.lastX = p.x;
  }

  // the child's map remembers where Jo has been (A4.4)
  markPlace(force) {
    const place = placeAt(Math.floor(this.player.x / T));
    if (place.id === this.placeNow && !force) return;
    this.placeNow = place.id;
    if (!this.visitedPlaces.has(place.id)) {
      this.visitedPlaces.add(place.id);
      updateSave((s) => (s.evening.map[place.id] = (s.evening.map[place.id] || 0) + 1));
    }
    // her line when going back to town (and she comes too)
    if (this.onRoadNow) this.wasOnRoad = true;
    if (this.herWalking && this.wasOnRoad && !this.onRoadNow && place.id !== 'meadow' && !this.roadBeats.has('back')) {
      this.roadBeats.add('back');
      this.her.line(HER_LINES.back_to_town[0], true);
    }
  }

  critterCtx(light) {
    const p = this.player;
    return {
      player: p,
      light,
      rain: this.weather.rain > 0.2,
      snowy: this.weather.cover > 0.25,
      stillFor: this.stillFor,
      catComing: this.catComing || null,
      claimCat: (c) => {
        this.catComing = c;
        this.time.delayedCall(20000, () => (this.catComing = null));
      },
      shelterFor: (x) => {
        const aw = this.world.awnings.slice().sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - x) - Math.abs((b.x0 + b.x1) / 2 - x))[0];
        const arch = this.world.arch ? this.world.arch.x : px(55);
        if (aw && Math.abs((aw.x0 + aw.x1) / 2 - x) < Math.abs(arch - x)) return (aw.x0 + aw.x1) / 2;
        return arch + 20;
      },
      bakeryX: this.world.bakery ? this.world.bakery.x - 30 : null,
      print: (x, y, s) => this.footprint(x, y, s),
      near: (x, y, r) => Math.abs(p.x - x) < r && Math.abs(p.y - y) < r * 1.5,
      running: Math.abs(p.body.velocity.x) > 160,
      joSitting: this.joSitting,
      onRoad: this.onRoadNow,
      dogHasStick: (img) => this.dogHasStick(img),
      dark: Phaser.Math.Clamp((this.sky.phase - 3) / 2, 0, 1),
    };
  }

  footprint(x, y, size = 4) {
    if (this.prints.length > 90) this.prints.shift().destroy();
    const pr = this.add.ellipse(x, y - 1, size * 1.6, size * 0.6, 0x7a88a8, 0.45).setDepth(-9.3);
    this.prints.push(pr);
  }

  // ---- Jo's small life: steps, prints, fidgets, rolls, looking at things ----
  joSmallLife(time, delta) {
    const p = this.player;
    if (!p.shown) return;
    // footsteps (and prints in the snow)
    const key = p.art.texture.key;
    if (key !== this.lastArtKey) {
      if ((key === 'jo-run' || key === 'jo-run-bare') && p.body.onFloor()) {
        const snowy = this.weather.cover > 0.25 || p.x > 638 * T;
        sfx(snowy ? 'crunch' : 'step');
        if (snowy) this.footprint(p.x + (p.flipX ? 4 : -4), p.y + 24);
        // splashes in the shallows
        const sh = this.world.shallows;
        if (sh && p.x > sh.x0 && p.x < sh.x1 && Math.abs(p.y + 24 - sh.y) < 12) {
          sfx('splash');
          for (let i = 0; i < 3; i++) {
            const d = this.add.circle(p.x + Phaser.Math.Between(-6, 6), sh.y - 4, 1.5, 0xd8ecf8, 0.9).setDepth(12.7);
            this.tweens.add({ targets: d, y: d.y - Phaser.Math.Between(6, 14), x: d.x + Phaser.Math.Between(-10, 10), alpha: 0, duration: 380, onComplete: () => d.destroy() });
          }
        }
      }
      this.lastArtKey = key;
    }
    // fall damage: none. long drops end in a roll and a laugh
    if (!p.body.onFloor()) this.maxFall = Math.max(this.maxFall, p.body.velocity.y);
    else {
      if (this.maxFall > 760 && !p.climbing) {
        this.tweens.add({ targets: p.art, angle: p.flipX ? -360 : 360, duration: 380, onComplete: () => p.art.setAngle(0) });
        this.time.delayedCall(350, () => this.joReact('laugh'));
      }
      this.maxFall = 0;
    }
    // idle fidgets, longer than anywhere else; and he looks at things
    if (!this.joSitting && !this.lookingUp && this.stillFor > 1500 && !this.ending) {
      const target = this.interesting();
      if (target !== null) p.setFlipX(target < p.x);
      if (this.stillFor > 7000 && time > this.nextFidget) {
        this.nextFidget = time + Phaser.Math.Between(6000, 10000);
        const r = Math.random();
        if (r < 0.4) this.tweens.add({ targets: p.hatKnock, angle: p.flipX ? 8 : -8, duration: 200, yoyo: true, hold: 300 });
        else if (r < 0.7) this.tweens.add({ targets: p.squashScale, x: 1.04, y: 0.97, duration: 300, yoyo: true });
        else this.pose('jo-lookup', 900);
      }
    }
  }

  // the nearest interesting thing within six tiles: a cat, a person, the dog
  interesting() {
    const p = this.player;
    let best = null;
    let bd = 6 * T;
    const consider = (x, y) => {
      const d = Math.abs(x - p.x);
      if (d < bd && d > 12 && Math.abs(y - (p.y + 24)) < 3 * T) {
        bd = d;
        best = x;
      }
    };
    this.cats.forEach((c) => consider(c.x, c.y));
    if (this.dog) consider(this.dog.x, this.dog.y);
    for (const f of Object.values(this.folk)) if (f.visible) consider(f.x, f.y);
    return best;
  }

  // ===========================================================================
  // leaves: always falling, from off-screen, across every layer, at three
  // speeds. On the play layer they land on things and stay a while.
  // ===========================================================================
  buildLeaves() {
    this.leaves = [];
    for (let i = 0; i < 44; i++) {
      const img = this.add.image(-100, -100, `ev-leaf-${i % 3}`).setDepth(i % 5 === 0 ? 13.6 : 9.6).setVisible(false);
      this.leaves.push({ img, settled: false, active: false, vx: 0, vy: 0, until: 0, ph: Math.random() * 6 });
    }
    const leafCfg = (speed, scale, alpha, freq) => ({
      x: { min: -200, max: 1160 },
      y: -20,
      lifespan: 16000,
      speedY: { min: speed * 0.8, max: speed * 1.2 },
      speedX: { min: -8, max: 14 },
      rotate: { min: 0, max: 360 },
      scale: { min: scale * 0.8, max: scale * 1.2 },
      alpha,
      frequency: freq,
      quantity: 1,
    });
    this.leafFar = this.add.particles(0, 0, 'ev-leaf-2', leafCfg(16, 0.45, 0.45, 1400)).setScrollFactor(0).setDepth(-24.1);
    this.leafMid = this.add.particles(0, 0, 'ev-leaf-0', leafCfg(34, 0.8, 0.6, 2200)).setScrollFactor(0).setDepth(-23);
    this.leafFore = this.add.particles(0, 0, 'ev-leaf-1', leafCfg(110, 2.2, 0.5, 3600)).setScrollFactor(0).setDepth(66);
  }

  updateLeaves(time, dt) {
    const cam = this.cameras.main;
    const w = this.weather.wind;
    const t = time / 1000;
    // fewer leaves up where the trees give out, none in the snow country
    const p = this.player;
    const rate = p.x > 638 * T ? 0 : this.weather.snow > 0.3 ? 0.5 : 2.4;
    const on = rate > 0;
    [this.leafFar, this.leafMid, this.leafFore].forEach((e) => {
      if (on && !e.emitting) e.start();
      if (!on && e.emitting) e.stop();
    });
    if (Math.random() < dt * rate) {
      const l = this.leaves.find((x) => !x.active);
      if (l) {
        l.active = true;
        l.settled = false;
        l.img.setVisible(true).setAlpha(1).setPosition(cam.scrollX + Phaser.Math.Between(-200, cam.width + 200), cam.scrollY - 20);
        l.vx = 0;
        l.vy = Phaser.Math.Between(28, 46);
      }
    }
    for (const l of this.leaves) {
      if (!l.active) continue;
      const img = l.img;
      if (l.settled) {
        // leaves land ON things and stay twenty seconds
        if (time > l.until) {
          img.setAlpha(img.alpha - dt);
          if (img.alpha <= 0) {
            l.active = false;
            img.setVisible(false);
          }
        }
        continue;
      }
      if (l.swept) {
        l.vy += 200 * dt;
        l.vx *= 0.97;
      } else {
        l.vx = (w * 80 - 12 + Math.sin(t * 1.3 + l.ph) * 26) * (w > 0.7 ? 1.6 : 1);
        if (w > 0.7) l.vy = 30 + Math.cos(t * 3 + l.ph) * 40; // spirals, in the wind
        else l.vy = Math.max(l.vy, 30);
      }
      img.x += l.vx * dt;
      img.y += l.vy * dt;
      img.angle += (40 + w * 200) * dt;
      const gy = this.groundY(img.x, img.y - 2);
      if (img.y >= gy - 1 && gy - img.y < 12) {
        img.y = gy - 1;
        l.settled = true;
        l.swept = false;
        l.until = time + 20000;
      }
      if (img.y > cam.scrollY + cam.height + 200 || img.x < cam.scrollX - 600 || img.x > cam.scrollX + cam.width + 600) {
        l.active = false;
        img.setVisible(false);
      }
    }
  }

  updateTufts(time) {
    const w = this.weather.wind;
    const cam = this.cameras.main;
    for (const t of this.world.tufts || []) {
      if (t.x < cam.scrollX - 100 || t.x > cam.scrollX + cam.width + 100) continue;
      t.angle = w * 18 + Math.sin(time / (600 - w * 300) + t.ph) * (5 + w * 10);
    }
  }

  // ===========================================================================
  // rain's reflections: the puddles, and the lake that has the sky in it
  // ===========================================================================
  updatePuddles(time) {
    if (time < (this.puddleT || 0)) return;
    this.puddleT = time + 90;
    const cam = this.cameras.main;
    const rain = this.weather.rain;
    const sky = this.sky.skyCols || [0x5a6aa0, 0xe8a868, 0xf8d890];
    for (const pd of this.world.puddles) {
      pd.size += ((rain > 0.1 ? 1 : 0) - pd.size) * (rain > 0.1 ? 0.02 : 0.002);
      pd.g.clear();
      if (pd.size < 0.05 || pd.x < cam.scrollX - 80 || pd.x > cam.scrollX + cam.width + 80) continue;
      const w = pd.w * pd.size;
      const wob = 1 + Math.sin(time / 300 + pd.x) * 0.04;
      const g = pd.g;
      // a flipped, dimmed, wobbling copy of the world above: the sky's
      // colours upside down, dark rooflines, and the sun in it
      g.fillStyle(lerpC(sky[2], 0x2a3050, 0.35), 0.85).fillEllipse(pd.x, pd.y, w * wob, 7 * pd.size + 2);
      g.fillStyle(lerpC(sky[0], 0x2a3050, 0.3), 0.8).fillEllipse(pd.x, pd.y + 1, w * 0.7 * wob, 4 * pd.size + 1);
      for (let i = -2; i <= 2; i++) g.fillStyle(0x4a3a44, 0.5).fillRect(pd.x + i * w * 0.18 - 2, pd.y - 1, 4, 3 * pd.size + 1);
      if (!this.onRoadNow) g.fillStyle(0xf8d890, 0.8).fillRect(pd.x - w * 0.3 + Math.sin(time / 200) * 2, pd.y - 1, Math.max(3, w * 0.12), 2);
      if (rain > 0.2 && Math.random() < 0.5) g.lineStyle(1, 0xe8f0f8, 0.6).strokeEllipse(pd.x + (Math.random() - 0.5) * w * 0.6, pd.y, 6, 2);
    }
  }

  updateLake(time) {
    const lg = this.world.lakeglass;
    if (!lg || time < (this.lakeT || 0)) return;
    this.lakeT = time + 80;
    const cam = this.cameras.main;
    lg.g.clear();
    if (lg.x1 < cam.scrollX - 100 || lg.x0 > cam.scrollX + cam.width / cam.zoom + 100) return;
    const [top, mid, hor] = this.sky.skyCols || [0x5a6aa0, 0xe8a868, 0xf8d890];
    const g = lg.g;
    // still water that mirrors the whole sky: horizon at the top, zenith deep
    const h = 3 * T - 6;
    for (let i = 0; i < 6; i++) g.fillStyle(lerpC(hor, lerpC(mid, top, i / 5), i / 5), 0.85).fillRect(lg.x0, lg.y + (i * h) / 6, lg.x1 - lg.x0, h / 6 + 1);
    // stars in it
    const sp = this.sky.starPhase;
    if (sp > 5) {
      for (let i = 0; i < 24; i++) {
        const sx = lg.x0 + ((i * 97) % (lg.x1 - lg.x0));
        const sy = lg.y + 6 + ((i * 53) % (h - 8));
        g.fillStyle(0xf2f0ff, Math.min(0.8, (sp - 5) / 2) * (0.5 + 0.5 * Math.sin(time / 600 + i))).fillRect(sx, sy, 1, 1);
      }
    }
    // the moon's path, when there's a moon
    if (this.sky.moonPos && this.sky.moonPos.up > 0.1) {
      const mx = cam.scrollX + this.sky.moonPos.x;
      if (mx > lg.x0 && mx < lg.x1) for (let k = 0; k < 7; k++) g.fillStyle(0xe8f0ff, 0.6 - k * 0.06).fillRect(mx - 6 - k + Math.sin(time / 400 + k) * 2, lg.y + 4 + k * 10, 12 + k * 2, 2);
    }
    // the aurora, in the lake if you go back down
    if (this.sky.aurora > 0.05) g.fillStyle(this.sky.auroraGround || 0x60e8a0, this.sky.aurora * 0.25).fillRect(lg.x0, lg.y, lg.x1 - lg.x0, h * 0.6);
    // ripples from a drifting boat
    if (this.joSeated && this.joSeated.kind === 'boat') g.lineStyle(1, 0xf2f6ff, 0.35).strokeEllipse(this.joSeated.bx, lg.y + 2, 60, 5);
  }

  // ===========================================================================
  // sound
  // ===========================================================================
  updateSound(time, delta) {
    const p = this.player;
    const f = this.world.fountain;
    const tx = Math.floor(p.x / T);
    const above = this.materialAbove();
    const road = this.onRoadNow ? this.roadMusic() : null;
    const bo = this.folk.bo;
    const boD = bo && bo.visible ? Math.abs(bo.x - p.x) : 99999;
    const sourceBo = !road && boD < 12 * T && !this.ending;
    this.soundscape.update(time, delta, {
      wind: this.weather.wind,
      water: this.placeNow === 'canal' || this.placeNow === 'lake' ? 1 : this.placeNow === 'first_stars' || this.placeNow === 'stream' ? 0.6 : 0,
      fountainDist: f ? Math.abs(f.x - p.x) / T : null,
      rain: this.weather.rain,
      rainMaterial: above,
      fire: this.world.fire && Math.abs(this.world.fire.x - p.x) < 8 * T ? 1 - Math.abs(this.world.fire.x - p.x) / (8 * T) : 0,
      bees: this.placeNow === 'allotments' ? 1 : 0,
      snow: this.weather.snow,
      place: this.placeNow,
      road: this.onRoadNow,
    });
    const snowHush = this.weather.snow > 0.3 ? 0.35 : 1;
    const rainHush = this.weather.rain > 0.1 ? 0.6 : 1; // the rain: piano only, near enough
    this.ensemble.volume = this.musicHushUntil && time < this.musicHushUntil ? 0 : 1;
    this.ensemble.update(delta, {
      duck: (this.joSitting ? 0.4 : 1) * (this.lookingUp ? 0.25 : 1) * snowHush * rainHush,
      source: sourceBo ? 'bo' : null,
      sourceVol: sourceBo ? 1 - boD / (12 * T) : 1,
      road,
    });
    void tx;
  }

  // B5 — music thins as the light does
  roadMusic() {
    const s = this.roadProgress;
    if (s < 1) return null;
    if (s < 3) return { stage: 'piano' };
    if (s < 4) return { stage: 'bass' };
    if (s < 5.5) return { stage: 'held' };
    if (this.sky.aurora > 0.15) return { stage: 'band', amount: Math.min(1, this.sky.aurora * 1.4) };
    return { stage: 'silence' };
  }

  // what's above Jo, for the rain: stone, tin, water, cloth
  materialAbove() {
    const p = this.player;
    for (const a of this.world.awnings) if (p.x > a.x0 && p.x < a.x1 && p.y > a.y) return 'cloth';
    const gh = this.world.marks.greenhouse;
    const shed = this.world.marks.shed;
    if ((gh && p.x > gh.x0 && p.x < gh.x1) || (shed && p.x > shed.x0 && p.x < shed.x1)) return 'tin';
    if (this.placeNow === 'canal' || this.placeNow === 'lake') return 'water';
    return 'stone';
  }

  // ===========================================================================
  // the weather, and how the town takes it
  // ===========================================================================
  weatherHooks() {
    const W = this.weather;
    W.on('rainStart', () => this.rainStarts());
    W.on('rainEnd', () => this.rainEnds());
    W.on('snowStart', () => this.snowStarts());
    W.on('windStart', () => {
      // a door banging somewhere
      [2000, 7000, 13000].forEach((d) => this.time.delayedCall(d, () => this.canHear(this.player.x, 1) && sfx('knock')));
    });
    W.on('clear', (prev) => {
      if (prev === 'snow') this.snowmanDone = false;
    });
  }

  rainStarts() {
    const F = this.folk;
    this.sheltered = [];
    // the baker pulls his tray in
    if (F.baker && !F.baker.busy) F.baker.walkTo(this.world.bakery ? this.world.bakery.x : F.baker.x, () => F.baker.hide());
    // the chess players stay and play on, under an umbrella
    if (this.world.chess) this.umbrella = this.add.image(this.world.chess.x, this.world.chess.y - 64, 'ev-umbrella').setDepth(11.8).setScale(2.2);
    // Fereshteh runs for the sheets
    if (F.fereshteh && !F.fereshteh.busy) {
      F.fereshteh.say('The sheets!');
      const loop = () => {
        if (this.weather.rain < 0.1 || !this.lineSheets.length || F.fereshteh.busy) return;
        F.fereshteh.walkTo(this.laundryLine.mid, () => {
          this.takeSheets(1);
          F.fereshteh.walkTo(this.laundryDoor, () => this.time.delayedCall(800, loop), 105);
        }, 105);
      };
      loop();
    }
    // the kids stay out and stamp in puddles
    for (const id of ['waiting_kid', 'stones_kid', 'kite', 'marcus_kid']) {
      const k = F[id];
      if (!k || !k.visible || k.busy) continue;
      const pd = this.world.puddles.slice().sort((a, b) => Math.abs(a.x - k.x) - Math.abs(b.x - k.x))[0];
      if (pd && Math.abs(pd.x - k.x) < 14 * T) {
        k.walkTo(pd.x, () => {
          k.stamp = this.tweens.add({ targets: k, hop: 6, duration: 160, yoyo: true, repeat: -1, repeatDelay: 240 });
        }, 90);
      }
    }
    // everyone else ducks under the nearest awning or door; the fisherman
    // doesn't move at all
    const stayers = new Set(['fisherman', 'hamid', 'wren', 'baker', 'fereshteh', 'waiting_kid', 'stones_kid', 'kite', 'marcus_kid', 'sleeper', 'mother', 'ray']);
    for (const f of Object.values(F)) {
      if (stayers.has(f.id) || !f.visible || f.busy || f.companion) continue;
      const aw = this.world.awnings.slice().sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - f.x) - Math.abs((b.x0 + b.x1) / 2 - f.x))[0];
      if (aw && Math.abs((aw.x0 + aw.x1) / 2 - f.x) < 16 * T) {
        this.sheltered.push(f);
        f.stand();
        f.walkTo((aw.x0 + aw.x1) / 2 + Phaser.Math.Between(-30, 30), null, 120);
      } else if (f.state !== 'sit') {
        this.sheltered.push(f);
        f.walkTo(this.nearestDoor(f.x), () => f.hide(), 110);
      }
    }
  }

  rainEnds() {
    // the rain stops mid-bar: five seconds of nothing but dripping
    this.musicHushUntil = this.time.now + 5000;
    this.soundscape.drips(5);
    // then: steam off warm stone, everything a little richer, a rainbow,
    // everyone back out, somebody singing
    this.saturateUntil = this.time.now + 70000;
    this.rainbowUntil = this.time.now + 150000;
    this.sky.showRainbow(true);
    this.steam();
    this.wetUntil = this.time.now + 30000;
    this.time.delayedCall(30000, () => this.shakeOff());
    const F = this.folk;
    if (this.umbrella) {
      this.umbrella.destroy();
      this.umbrella = null;
    }
    this.time.delayedCall(5000, () => {
      if (F.baker) {
        F.baker.show();
        F.baker.walkTo(F.baker.home.x);
      }
      for (const f of this.sheltered || []) {
        if (f.inside) {
          f.show();
          f.teleport(this.nearestDoor(f.home.x));
        }
        f.walkTo(f.home.x, () => f.homeSit && f.sitDown());
      }
      this.sheltered = [];
      for (const id of ['waiting_kid', 'stones_kid', 'kite', 'marcus_kid']) {
        const k = F[id];
        if (k && k.stamp) {
          k.stamp.remove();
          k.stamp = null;
          k.hop = 0;
          k.walkTo(k.home.x);
        }
      }
      // somebody starts singing
      const singer = Object.values(F).filter((f) => f.visible && !f.def.silent && this.canHear(f.x, 16))[0];
      if (singer) {
        singer.say('♪ …la la, laaa… ♪', 3000);
        ORB_THEME.slice(4, 8).forEach((fq, i) => playFx(fq / 2, 0.6, 'sine', 0.035, i * 0.55));
      }
      this.rooftopRainbow();
    });
  }

  // after the rain everyone comes up to the roof for the rainbow
  rooftopRainbow() {
    const spot = this.world.marks.rooftop_spot;
    if (!spot) return;
    const who = ['wren', 'bo', 'bilal', 'kite', 'hamid'].map((id) => this.folk[id]).filter((f) => f && f.visible && !f.busy && !f.companion);
    let arrived = 0;
    const members = [];
    who.forEach((f, i) => {
      f.stand();
      f.walkTo(spot.x - 60 + i * 30, () => {
        arrived++;
        members.push(f);
        f.look(spot.x);
        if (arrived === who.length) this.talk.runGroup('rooftop_rainbow', members, null, { onDone: () => members.forEach((m) => m.walkTo(m.home.x, () => m.homeSit && m.sitDown())) });
      }, 95);
    });
  }

  steam() {
    const cam = this.cameras.main;
    for (let i = 0; i < 26; i++) {
      this.time.delayedCall(i * 500, () => {
        const x = cam.scrollX + Phaser.Math.Between(0, cam.width);
        const y = this.groundY(x, cam.scrollY + 40);
        if (y > cam.scrollY + cam.height) return;
        const s = this.add.ellipse(x, y - 4, 12, 5, 0xf2ece8, 0.3).setDepth(9.8);
        this.tweens.add({ targets: s, y: y - 44, scaleX: 2.2, alpha: 0, duration: 2600, onComplete: () => s.destroy() });
      });
    }
  }

  shakeOff() {
    const p = this.player;
    if (!p.shown || this.joSitting) return;
    this.tweens.add({ targets: p.art, angle: { from: -8, to: 8 }, duration: 70, yoyo: true, repeat: 4, onComplete: () => p.art.setAngle(0) });
    for (let i = 0; i < 10; i++) {
      const d = this.add.circle(p.x, p.y - 10, 1.5, 0xd8e8f8, 0.8).setDepth(13);
      this.tweens.add({ targets: d, x: p.x + Phaser.Math.Between(-30, 30), y: p.y + Phaser.Math.Between(-30, 10), alpha: 0, duration: 450, onComplete: () => d.destroy() });
    }
  }

  snowStarts() {
    // the kids build a snowman in the school yard; the dog loses his mind
    const spot = this.world.marks.snowman_spot;
    if (spot && !this.snowBody) {
      this.snowBody = this.add.image(spot.x, spot.y, 'ev-snowbody').setOrigin(0.5, 1).setDepth(9.2).setScale(0.2);
      this.tweens.add({ targets: this.snowBody, scale: 1.4, duration: 60000 });
      this.time.delayedCall(30000, () => {
        if (this.snowmanHeadPlaced) return;
        const hx = spot.x - 6 * T;
        this.snowHeadImg = this.add.image(hx, this.groundY(hx, spot.y - 60) - 12, 'ev-snowball').setDepth(9).setScale(1.7);
      });
      for (const id of ['waiting_kid', 'stones_kid', 'kite']) {
        const k = this.folk[id];
        if (k && k.visible && !k.busy) k.walkTo(spot.x + Phaser.Math.Between(-60, 60), () => k.look(spot.x), 80);
      }
    }
    if (this.dog && this.dog.following) {
      this.time.delayedCall(9000, () => this.dog.zoomies());
      this.time.delayedCall(20000, () => this.dog.roll());
    }
  }

  // the head goes on, crooked; the whole cast drifts in for this one
  snowmanScene() {
    const spot = this.world.marks.snowman_spot;
    const who = Object.values(this.folk).filter((f) => f.visible && !f.busy && !f.companion && f.id !== 'sleeper' && Math.abs(f.x - spot.x) < 60 * T);
    const members = [];
    who.slice(0, 6).forEach((f, i) => {
      f.stand();
      f.walkTo(spot.x + (i % 2 ? 1 : -1) * (40 + i * 16), () => {
        members.push(f);
        f.look(spot.x);
        if (members.length === Math.min(6, who.length)) this.talk.runGroup('snowman', members, null, { onDone: () => members.forEach((m) => m.walkTo(m.home.x, () => m.homeSit && m.sitDown())) });
      }, 100);
    });
    for (const id of ['waiting_kid', 'stones_kid', 'kite']) this.noteHelped(id);
  }

  nearestDoor(x) {
    let best = this.world.doors[0];
    for (const d of this.world.doors) if (Math.abs(d.x - x) < Math.abs(best.x - x)) best = d;
    return best ? best.x : x;
  }

  // §8 rare — a wedding party crossing the square
  weddingParty() {
    const y = px(31);
    const party = [];
    for (let i = 0; i < 7; i++) {
      const look = i === 1 ? 1 : i % 5;
      const f = new Townsfolk(this, `x${i}`, { voice: 1, look: { pal: {} } }, px(144) - i * 26, y, { key: `ev-x-${look}` });
      f.walkTo(px(186) - i * 26, () => f.destroy(), 60);
      party.push(f);
    }
    const petals = this.add.particles(0, 0, 'ev-dot', {
      follow: party[1].art,
      lifespan: 1600,
      speedY: { min: -40, max: 10 },
      speedX: { min: -30, max: 30 },
      gravityY: 40,
      tint: [0xe86a8a, 0xf2ece0, 0xf2d580],
      frequency: 90,
      scale: 1.4,
    }).setDepth(12.2);
    this.time.delayedCall(20000, () => petals.destroy());
    this.weddingFolk = party;
    party[0].say('Mind the step — MIND THE—', 2400);
    this.time.delayedCall(3000, () => party.forEach((f, i) => this.time.delayedCall(i * 150, () => f.visible && f.laugh(i === 0))));
    // Bo plays them across, of course
    if (this.folk.bo) this.folk.bo.say('♪ ♪ ♪', 3000);
  }

  // ===========================================================================
  // §4 — sit, and after eight seconds something happens near you
  // ===========================================================================
  stageSitEvent(id) {
    const p = this.player;
    const near = (list) => list.slice().sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const floatLine = (text) => {
      const t = this.add.text(p.x + Phaser.Math.Between(-60, 60), p.y - 90, text, { fontFamily: 'monospace', fontSize: '12px', color: '#e8dcc8', fontStyle: 'italic' }).setOrigin(0.5).setDepth(90).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 0.9, duration: 800, hold: 2600, yoyo: true, onComplete: () => t.destroy() });
    };
    if (SIT_EVENT_LINES[id]) floatLine(SIT_EVENT_LINES[id][Math.floor(Math.random() * SIT_EVENT_LINES[id].length)]);
    switch (id) {
      case 'leaf_hat': {
        if (this.leafOnHat) break;
        const l = this.add.image(p.hat.x + 60, p.hat.y - 120, `ev-leaf-${Phaser.Math.Between(0, 2)}`).setDepth(13.3).setScale(1.4);
        this.tweens.add({ targets: l, x: p.hat.x + 4, y: p.hat.y - 6, angle: 380, duration: 3200, ease: 'sine.inout', onComplete: () => (this.leafOnHat = l) });
        break;
      }
      case 'heron_takes_off': {
        const h = near(this.herons);
        if (h) h.takeOff();
        break;
      }
      case 'pigeons_land': {
        const f = near(this.flocks.filter((x) => x.kind === 'pigeon'));
        if (f) {
          f.lift();
          f.upUntil = this.time.now + 2500;
        }
        break;
      }
      case 'cat_arrives': {
        const c = near(this.cats.filter((x) => x.routine !== 'aloof' && x.routine !== 'sleeper'));
        if (c) c.goTo(p.x + 24, 60);
        break;
      }
      case 'shutter_opens': {
        const cand = this.horizon.windows.filter((w) => !w.on);
        if (cand.length) this.horizon.lightWindow(cand[Math.floor(Math.random() * cand.length)]);
        sfx('knock');
        break;
      }
      case 'someone_sings':
        ORB_THEME.slice(...THEME_PARTS.adaeze).forEach((fq, i) => playFx(fq / 2, 0.6, 'sine', 0.03, i * 0.6));
        break;
      case 'radio_plays':
        ORB_THEME.slice(...THEME_PARTS.radio).forEach((fq, i) => playFx(fq / 2, 0.5, 'triangle', 0.02, i * 0.5));
        break;
      case 'bell':
        sfx('far_bell');
        break;
      case 'bike_bell':
        sfx('bike_bell');
        break;
      case 'goat_bleats':
        playFx(420, 0.35, 'sawtooth', 0.04, 0, 380);
        if (this.goat) this.tweens.add({ targets: this.goat.img, angle: 6, duration: 120, yoyo: true, repeat: 2 });
        break;
      case 'dog_sighs':
        sfx('purr_soft');
        break;
      case 'apple_falls': {
        const ax = p.x + Phaser.Math.Between(-60, 60);
        const a = this.add.image(ax, p.y - 110, 'ev-apple').setDepth(9.5);
        this.tweens.add({ targets: a, y: this.groundY(ax, p.y - 30) - 3, duration: 700, ease: 'bounce.out' });
        break;
      }
      case 'swallows':
        if (!this.flocks.some((f) => f.kind === 'swallow' && Math.abs(f.x - p.x) < 20 * T)) this.flocks.push(new Flock(this, p.x, p.y - 150, 5, 'swallow'));
        break;
      case 'swing_creaks':
      case 'swing_moves':
        if (this.world.swing) this.world.swing.v += 0.6;
        break;
      case 'fountain_glint':
      case 'sea_glint':
      case 'whole_town':
      case 'town_lights':
        this.pose('jo-sit-up', 2000);
        break;
      case 'board_clacks':
        if (this.world.board) this.flickerBoard(this.world.board.txt, this.world.board.txt.text, 3);
        break;
      case 'moths':
        this.motes.push(new Motes(this, p.x, p.y - 40, 4, 'moth'));
        break;
      case 'star_appears':
      case 'aurora_flare':
        if (this.sky.ribbons) this.sky.ribbons[Phaser.Math.Between(0, this.sky.ribbons.length - 1)].flare = 1;
        this.pose('jo-sit-up', 2400);
        break;
      case 'shooting_star':
        this.sky.shootingStar();
        break;
      case 'fireflies':
        this.motes.push(new Motes(this, p.x, p.y - 20, 8, 'firefly'));
        break;
      case 'fish_rises': {
        const w = this.ground.water(this.cameras.main);
        if (w) {
          sfx('splash');
          const ring = this.add.ellipse(w.x, w.y, 6, 2).setStrokeStyle(1, 0xe8f0f8, 0.8).setDepth(-8.4);
          this.tweens.add({ targets: ring, scaleX: 5, scaleY: 3, alpha: 0, duration: 1400, onComplete: () => ring.destroy() });
        }
        break;
      }
      case 'snow_drops':
        sfx('thump');
        break;
      case 'deer_look':
        if (this.deer) this.deer.img.setFlipX(p.x < this.deer.x);
        break;
      default:
        break;
    }
  }

  // ===========================================================================
  // §7 — the end of the evening, which is now the middle of it
  // ===========================================================================
  flickerBoard(txt, final, times = 5, big = false) {
    for (let i = 0; i < times; i++) {
      this.time.delayedCall(i * 110, () => {
        txt.setAlpha(i % 2 ? 1 : 0.1);
        sfx('clack');
      });
    }
    this.time.delayedCall(times * 110, () => {
      txt.setAlpha(1).setText(final);
      if (big) txt.setFontSize(15).setColor('#e9b84a').setLetterSpacing(3).setShadow(2, 2, '#6b4a1f', 0, false, true);
    });
  }

  // Screen-fixed things still scale with the camera's zoom (the vista, the
  // ridge's long pull-back). A pinned object is counter-scaled every frame so
  // cards, credits and the pause map stay the size they were written at.
  pinUI(obj, x = obj.x, y = obj.y, s = 1) {
    const pin = { obj, x, y, s };
    this.uiPins.push(pin);
    return pin;
  }

  updateUIPins() {
    if (!this.uiPins.length) return;
    const cam = this.cameras.main;
    const z = cam.zoom || 1;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    this.uiPins = this.uiPins.filter((pin) => {
      if (!pin.obj.active) return false;
      pin.obj.setScale(pin.s / z).setPosition(cx + (pin.x - cx) / z, cy + (pin.y - cy) / z);
      return true;
    });
  }

  // the rope swing moves on its own when nobody's on it (a sit event can
  // nudge it), and its ropes are always drawn
  updateSwingIdle(dt) {
    const sw = this.world.swing;
    if (!sw || (this.joSeated && this.joSeated.kind === 'swing')) return;
    sw.v += -sw.angle * dt * 2.2;
    sw.v *= 0.99;
    sw.angle = Phaser.Math.Clamp(sw.angle + sw.v * dt * 2 + Math.sin(this.time.now / 1400) * this.weather.wind * 0.002, -0.9, 0.9);
    const r = 50;
    const sx = sw.pivot.x + Math.sin(sw.angle) * r;
    const sy = sw.pivot.y + Math.cos(sw.angle) * r;
    sw.rope.clear().lineStyle(1, 0x6a4a32, 1).lineBetween(sw.pivot.x - 9, sw.pivot.y, sx - 9, sy).lineBetween(sw.pivot.x + 9, sw.pivot.y, sx + 9, sy);
    sw.seat.setPosition(sx, sy).setAngle(Phaser.Math.RadToDeg(-sw.angle) * 0.4);
  }

  // a line of text on the golden world (never on black)
  cardLine(text, ms = 3400, y = null) {
    const cam = this.cameras.main;
    const t = this.add
      .text(cam.width / 2, y === null ? cam.height * 0.3 : y, text, { fontFamily: 'monospace', fontSize: '18px', color: '#f2e9d8', align: 'center', stroke: '#2a2030', strokeThickness: 3 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);
    this.pinUI(t);
    this.tweens.add({ targets: t, alpha: 1, duration: 900 });
    this.time.delayedCall(ms, () => this.tweens.add({ targets: t, alpha: 0, duration: 900, onComplete: () => t.destroy() }));
    return wait(this, ms + 700);
  }

  countLine(tmpl) {
    const N = getSave().dreamsCaught;
    const M = momentsFound() + this.director.noticed;
    const D = ((this.distance / T) * 8 / 1000).toFixed(1);
    return tmpl.replace('{N}', N).replace('{M}', M).replace('{D}', D).replace(/\b1 dreams\b/, '1 dream').replace(/\b1 small things\b/, '1 small thing');
  }

  async endingStation() {
    this.stationEnded = true;
    this.ending = true;
    this.prompt.setVisible(false);
    if (this.activity) this.activity.leave();
    const b = this.world.board;
    this.flickerBoard(b.txt, "YOU'RE HERE", 7, true);
    await wait(this, 3000);
    // the people he helped go home along the platform, on their own business
    const order = ['fereshteh', 'baker', 'marcus_kid', 'marcus', 'waiting_kid', 'mother', 'sweeper'];
    const helpedBy = { marcus_kid: 'marcus', mother: 'waiting_kid' };
    const deckY = EV.DECK * T;
    const passers = order.filter((id) => this.folk[id] && (id === 'sweeper' || this.helped.has(helpedBy[id] || id)));
    for (const id of passers) {
      const f = this.folk[id];
      if (f.talking) this.talk.end(f.talking);
      if (f.busy && f.busy.leave) f.busy.leave();
      f.busy = { walking: true };
      f.free = true; // an empty basket, an empty tray
      f.show();
      f.stand();
      f.x = px(377);
      f.y = deckY;
      f.walkTo(px(401), () => {
        f.hide();
        this.time.delayedCall(4000, () => {
          f.free = false;
          f.busy = null;
          f.show();
          // find the ground from where they live, not from the deck: from
          // deck height the sweeper's hill column is solid and buries him
          f.y = f.home.y;
          f.teleport(f.home.x);
          if (f.homeSit) f.sitDown();
        });
      }, id === 'marcus_kid' ? 140 : 105);
      await wait(this, 2000);
    }
    // the dog trots after the last of them — and, since the road, comes back
    if (this.dog && this.dog.following) {
      this.dog.fetch = { active: true, x: px(399), landed: false };
      await wait(this, 2500);
      this.dog.fetch = null;
    }
    await wait(this, 1500);
    for (const l of CARDS.station) await this.cardLine(this.countLine(l));
    await wait(this, 3500);
    await this.cardLine(CARDS.station_last, 4200);
    // control returns. the game does not exit
    this.ending = false;
    await wait(this, 7000);
    this.flickerBoard(b.txt, "THERE'S A ROAD", 7, true);
    await wait(this, 1200);
    this.openRoad(false);
  }

  // the hedge, which was always there, has a gap in it now
  openRoad(instant) {
    if (this.roadOpen) return;
    this.roadOpen = true;
    this.solids.children.iterate((img) => {
      if (img && img.tileRole === 'breakable' && EV.HEDGE.includes(img.tx)) {
        img.body.enable = false;
        img.setVisible(false);
      }
    });
    for (const h of this.world.hedge) {
      const dir = h.tx === EV.HEDGE[0] ? -1 : 1;
      if (instant) h.setVisible(false);
      else this.tweens.add({ targets: h, x: h.x + dir * 22, scaleX: 0.6, alpha: 0.35, duration: 2600, ease: 'sine.inout' });
    }
    if (!instant) sfx('flap');
    // she's already there, on the wall, coat on, as if she'd assumed
    const w = this.folk[HER];
    const seat = this.world.marks.wall_seat;
    if (w && seat && !instant) {
      if (w.talking) this.talk.end(w.talking);
      w.busy = { waiting: true };
      w.show();
      w.x = seat.x;
      w.y = seat.y - 14;
      w.sitDown();
      w.look(px(390));
      this.herWaiting = true;
    }
  }

  // B3 — stop by her, and she comes; walk past without stopping, and she
  // stays on the wall and says "…suit yourself"
  updateHerAtHedge(time) {
    if (!this.herWaiting || this.herDecided) return;
    const w = this.folk[HER];
    const p = this.player;
    const d = Math.abs(p.x - w.x);
    if (d < 3 * T && Math.abs(p.body.velocity.x) < 20 && p.body.onFloor()) {
      this.herStopT = (this.herStopT || 0) + this.game.loop.delta;
      if (this.herStopT > 1000) {
        this.herDecided = true;
        this.herWaiting = false;
        w.say(HER_LINES.hedge_greet[Math.floor(Math.random() * HER_LINES.hedge_greet.length)], null, { slow: 1.2 });
        this.time.delayedCall(1800, () => this.startHer(w.x, false));
      }
    } else this.herStopT = 0;
    if (p.x > w.x + 2.5 * T && p.y < (EV.DECK + 1) * T) {
      this.herDecided = true;
      this.herWaiting = false;
      this.walkedAlone = true;
      w.say(HER_LINES.hedge_alone[0], 2600);
      this.time.delayedCall(700, () => w.laugh(false));
    }
    void time;
  }

  startHer(x, instant) {
    const w = this.folk[HER];
    if (!w) return;
    if (w.talking) this.talk.end(w.talking);
    w.show();
    w.stand();
    w.busy = null;
    if (instant) {
      w.x = x;
      w.y = this.groundY(x, this.player.y - 20);
    } else {
      w.y = this.groundY(w.x, w.y - 10);
    }
    const s = this.save;
    const roasts = Object.entries(HER_LINES.roast)
      .filter(([dream]) => s.met[dream] || s.dreams[dream])
      .map(([, lines]) => lines[0]);
    this.her = new Companion(this, w, { roasts });
    this.herWalking = true;
    this.herDecided = true;
    this.herWaiting = false;
    this.walkedAlone = false;
  }

  // ===========================================================================
  // the road: distance is time
  // ===========================================================================
  updateRoad(time) {
    if (!this.onRoadNow) return;
    const p = this.player;
    const tx = p.x / T;
    const beat = (id, cond, fn) => {
      if (!this.roadBeats.has(id) && cond) {
        this.roadBeats.add(id);
        fn();
      }
    };
    const her = this.herWalking && this.her;
    const point = (kind) => her && this.her.point(kind);
    beat('lake', tx > 556 && tx < 572, () => point('lake'));
    beat('first_star', tx > 582 && this.sky.starPhase > 4, () => {
      point('first_star');
      this.pose('jo-lookup', 1800);
    });
    beat('owl', tx > 650 && tx < 662, () => point('owl'));
    beat('snowball', tx > 659 && tx < 667 && her, () => this.snowballFightStart());
    beat('moon', this.sky.moonUp > 0.12, () => point('moon'));
    beat('deer', this.deer && Math.abs(this.deer.x - p.x) < 7 * T, () => point('deer'));
    beat('constellation', this.sky.starPhase > 6.6 && tx > 690, () => {
      point('constellation');
      if (her) this.time.delayedCall(3200, () => {
        this.joReact(Math.random() < 0.5 ? 'shrug' : 'toot', this.her.f);
        this.time.delayedCall(1800, () => this.her.line(HER_LINES.point.constellation_insist, true));
      });
    });
    beat('town', tx > 712, () => point('town'));
    // the snow on the switchbacks under the aurora is the shot of the game
    beat('snow', tx > 700, () => this.weather.requestSnow());
    beat('aurora', this.sky.aurora > 0.2, () => point('aurora'));
    // the dog drinks at the stream, rolls in the snow
    beat('drink', tx > 676 && tx < 686 && this.dog && this.dog.following, () => this.dog.drink());
    beat('roll', tx > 640 && this.dog && this.dog.following, () => this.dog.roll());
    void time;
  }

  // B4 — snowball, once, on the pine road. She starts it. She wins.
  snowballFightStart() {
    const w = this.her.f;
    const p = this.player;
    this.her.line(HER_LINES.snowball[0], true);
    const fight = { active: true, hits: 0, back: 0 };
    this.snowballFight = fight;
    const throwAt = (fromX, fromY, toX, toY, onHit) => {
      const b = this.add.image(fromX, fromY, 'ev-snowball').setDepth(13.4).setScale(0.8);
      this.tweens.add({ targets: b, x: toX, duration: 520 });
      this.tweens.add({ targets: b, y: Math.min(fromY, toY) - 50, duration: 260, ease: 'quad.out', onComplete: () => this.tweens.add({ targets: b, y: toY, duration: 260, ease: 'quad.in', onComplete: () => {
        sfx('crunch');
        for (let i = 0; i < 6; i++) {
          const d = this.add.circle(toX, toY, 1.5, 0xf4f8ff, 0.9).setDepth(13.4);
          this.tweens.add({ targets: d, x: toX + Phaser.Math.Between(-16, 16), y: toY + Phaser.Math.Between(-14, 8), alpha: 0, duration: 400, onComplete: () => d.destroy() });
        }
        b.destroy();
        if (onHit) onHit();
      } }) });
    };
    const herThrow = () => {
      if (!fight.active) return;
      throwAt(w.x, w.y - 30, p.x, p.hat.y, () => {
        p.knockHat();
        fight.hits++;
        if (fight.hits >= 3) {
          fight.active = false;
          w.laugh();
          this.time.delayedCall(900, () => this.her.line(HER_LINES.snowball[1], true));
          this.time.delayedCall(1200, () => this.joReact('laugh'));
        } else this.time.delayedCall(Phaser.Math.Between(1400, 2400), herThrow);
      });
    };
    this.time.delayedCall(1200, herThrow);
    fight.throwBack = () => {
      if (!fight.active) return;
      fight.back++;
      // she dodges. obviously.
      throwAt(p.x, p.y - 20, w.x + (w.x > p.x ? 26 : -26), w.y - 20, () => this.tweens.add({ targets: w, x: w.x + (w.x > p.x ? 12 : -12), duration: 110, yoyo: true }));
    };
  }

  // ===========================================================================
  // §B6 — the ending, on the ridge
  // ===========================================================================
  async endingRidge() {
    this.ridgeEnded = true;
    this.ending = true;
    this.prompt.setVisible(false);
    const cam = this.cameras.main;
    const p = this.player;
    // the dog puts his head on their feet
    if (this.dog && this.dog.following) {
      this.dog.x = p.x + (this.her ? 0 : 20);
      this.dog.state = 'lie';
    }
    // she leans on his shoulder (Companion handles the sitting)
    if (this.her) {
      const f = this.her.f;
      const side = f.x < p.x ? -1 : 1;
      f.x = p.x + side * 16;
      f.sitDown();
      f.y = this.sitBench.y - 8;
      f.art.setAngle(side * -9);
      f.look(p.x);
    }
    // the camera pulls back and up, slowly, for a long time
    cam.stopFollow();
    this.tweens.add({ targets: cam, zoom: 0.6, duration: 26000, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: cam, scrollY: cam.scrollY - 260, scrollX: cam.scrollX - 220, duration: 26000, ease: 'Sine.easeInOut' });
    await wait(this, 9000);
    const cards = [];
    const total = momentsFound();
    if (total >= MOMENT_TOTAL) cards.push(CARDS.all_moments);
    cards.push(...CARDS.ridge.map((l) => this.countLine(l)));
    for (const l of cards) await this.cardLine(l, 3600, cam.height * 0.26);
    await wait(this, 5000);
    // the last cards, and their variants
    const trumpetLeft = !!this.trumpetDown || !!this.trumpetKid;
    updateSave((s) => (s.evening.trumpet_left = trumpetLeft));
    await this.cardLine(CARDS.ridge_last[0], 3600, cam.height * 0.26);
    let last = CARDS.ridge_last[1];
    if (this.walkedAlone || !this.herWalking) last = CARDS.alone;
    if (trumpetLeft) last = CARDS.horn;
    await this.cardLine(last, 4600, cam.height * 0.26);
    // three of his own photographs, over the aurora
    const urls = randomPhotos(3);
    if (urls.length) {
      const keys = await photoTextures(this, urls);
      for (const k of keys) {
        const img = this.add.image(cam.width / 2 + Phaser.Math.Between(-120, 120), cam.height * 0.36, k).setScrollFactor(0).setDepth(199).setAlpha(0).setAngle(Phaser.Math.Between(-4, 4));
        img.setDisplaySize(300, 169);
        const frame = this.add.rectangle(img.x, img.y, 310, 179, 0xf2ece0).setScrollFactor(0).setDepth(198.9).setAlpha(0).setAngle(img.angle);
        this.pinUI(img, img.x, img.y, img.scaleX);
        this.pinUI(frame);
        this.tweens.add({ targets: [img, frame], alpha: 0.95, duration: 1400, hold: 2600, yoyo: true, onComplete: () => [img, frame].forEach((o) => o.destroy()) });
        await wait(this, 5800);
      }
    }
    // the logo, small, at the bottom; and slow credits, over a sky that keeps moving
    const logo = this.add.text(cam.width / 2, cam.height - 42, 'DREAMCATCHER', { fontFamily: 'monospace', fontSize: '16px', color: '#e9b84a' }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0).setLetterSpacing(4).setShadow(2, 2, '#6b4a1f', 0, false, true);
    this.pinUI(logo);
    this.tweens.add({ targets: logo, alpha: 0.85, duration: 3000 });
    const credits = ['DREAMCATCHER', '', 'Jo', 'the town', 'the road', HER_NAME, 'the old dog', 'seven cats', 'a goat nobody explains', '', 'thank you for staying'];
    const roll = this.add.text(cam.width / 2, cam.height + 20, credits.join('\n\n'), { fontFamily: 'monospace', fontSize: '13px', color: '#d8d0c0', align: 'center', lineSpacing: 4 }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200).setAlpha(0.85);
    const rollPin = this.pinUI(roll);
    await new Promise((res) => this.tweens.add({ targets: rollPin, y: -roll.height - 40, duration: 50000, ease: 'Linear', onComplete: res }));
    roll.destroy();
    this.tweens.add({ targets: logo, alpha: 0, duration: 4000, onComplete: () => logo.destroy() });
    updateSave((s) => (s.evening.finished = true));
    // control returns, on the ridge, with no text at all
    await wait(this, 2000);
    this.tweens.add({ targets: cam, zoom: 1, duration: 5000, ease: 'Sine.easeInOut' });
    cam.startFollow(p, true, 0.04, 0.04);
    this.ending = false;
  }

  // ===========================================================================
  // the pause: the map is a child's drawing; the album holds his photos
  // ===========================================================================
  openPause() {
    const cam = this.cameras.main;
    this.physics.pause();
    this.tweens.pauseAll();
    this.time.paused = true;
    // A is also walk-left and nothing else reads its JustDown: a held A would
    // open the album on its own
    Phaser.Input.Keyboard.JustDown(this.keyA);
    const objs = [];
    const add = (o) => (objs.push(o.setScrollFactor(0).setDepth(260)), this.pinUI(o), o);
    add(this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x0e0b14, 0.6));
    this.drawMap(add);
    add(this.add.text(cam.width / 2, cam.height - 40, '[X] stay     [A] the photos     [Q] back to the station', { fontFamily: 'monospace', fontSize: '12px', color: '#c8c0b0' }).setOrigin(0.5));
    this.paused = { objs, album: null, openedAt: this.game.loop.time };
  }

  // A4.4 — wobbly lines, wrong proportions, labels in a child's hand; it gets
  // more detailed the more places Jo has been, because the kid keeps drawing
  drawMap(add) {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2 - 20;
    const W = 620;
    const H = 330;
    add(this.add.rectangle(cx, cy, W, H, 0xf6efe0).setAngle(-1.2));
    [[-W / 2 + 20, -H / 2 + 6], [W / 2 - 20, -H / 2 + 6], [-W / 2 + 20, H / 2 - 6], [W / 2 - 20, H / 2 - 6]].forEach(([x, y], i) => add(this.add.rectangle(cx + x, cy + y, 54, 14, 0xe8e0c8, 0.75).setAngle(i % 2 ? 24 : -24)));
    const g = add(this.add.graphics());
    const map = getSave().evening.map;
    const rand = new Phaser.Math.RandomDataGenerator(['crayon']);
    const wob = () => rand.between(-3, 3);
    const places = ['arch', 'orchard', 'laundry', 'square', 'canal', 'steep', 'rooftops', 'school', 'allotments', 'hill', 'station'];
    const x0 = cx - W / 2 + 40;
    const step = (W - 170) / places.length;
    const baseY = cy + 40;
    // the ground line, in crayon
    g.lineStyle(3, 0x6a8a4a, 0.9);
    g.beginPath();
    g.moveTo(x0 - 20, baseY + wob());
    for (let i = 0; i <= places.length * 3; i++) g.lineTo(x0 + (i * step) / 3, baseY + wob() - (i > 27 && i < 31 ? 40 : 0));
    g.strokePath();
    // the sun, always there, too big
    g.fillStyle(0xf2c040, 0.9).fillCircle(x0 + 10, cy - H / 2 + 60, 26);
    g.lineStyle(2, 0xf2c040, 0.8);
    for (let a = 0; a < 8; a++) g.lineBetween(x0 + 10 + Math.cos(a) * 32, cy - H / 2 + 60 + Math.sin(a) * 32, x0 + 10 + Math.cos(a) * 44, cy - H / 2 + 60 + Math.sin(a) * 44);
    const doodle = {
      arch: (x, y) => g.lineStyle(3, 0x9a8a6a, 1).strokeRect(x - 10, y - 30, 20, 30) && g.fillStyle(0x5a8a4a, 1).fillCircle(x - 10, y - 30, 4),
      orchard: (x, y) => [0, 12].forEach((d) => g.fillStyle(0x5a8a4a, 1).fillCircle(x - 6 + d, y - 24, 9) && g.fillStyle(0x7a5a3a, 1).fillRect(x - 7 + d, y - 16, 3, 16)),
      laundry: (x, y) => g.lineStyle(1, 0x3a3030, 1).lineBetween(x - 16, y - 30, x + 16, y - 30) && [0, 1, 2].forEach((k) => g.fillStyle([0x88b8d8, 0xe86a6a, 0xf2d580][k], 1).fillRect(x - 14 + k * 10, y - 29, 8, 10)),
      square: (x, y) => g.lineStyle(2, 0x6a8ab8, 1).strokeCircle(x, y - 10, 10) && g.lineBetween(x, y - 20, x, y - 30),
      canal: (x, y) => g.fillStyle(0x6a9ac8, 1).fillRect(x - 18, y - 4, 36, 6) && g.fillStyle(0x2e6a4a, 1).fillRect(x - 10, y - 10, 20, 6),
      steep: (x, y) => g.lineStyle(2, 0x9a6a4a, 1).lineBetween(x - 14, y, x + 14, y - 26),
      rooftops: (x, y) => g.fillStyle(0xb85a3a, 1).fillTriangle(x - 16, y - 20, x + 16, y - 20, x, y - 36) && g.fillStyle(0xe86a6a, 1).fillTriangle(x + 18, y - 50, x + 24, y - 44, x + 18, y - 38),
      school: (x, y) => g.lineStyle(2, 0x3a3a44, 1).strokeCircle(x, y - 6, 5),
      allotments: (x, y) => [0, 8, 16].forEach((d) => g.fillStyle(0x6a9a4a, 1).fillRect(x - 12 + d, y - 8, 5, 8)),
      hill: (x, y) => g.fillStyle(0x5a8a4a, 1).fillCircle(x, y - 70, 12) && g.fillStyle(0x7a5a3a, 1).fillRect(x - 2, y - 60, 4, 16),
      station: (x, y) => g.lineStyle(2, 0x3a3a44, 1).strokeRect(x - 14, y - 22, 28, 12) && g.fillStyle(0x3a6a3a, 1).fillRect(x + 16, y - 24, 8, 24),
    };
    places.forEach((id, i) => {
      const visits = map[id] || 0;
      if (!visits) return;
      const x = x0 + i * step + step / 2;
      const y = baseY - (id === 'hill' ? 10 : 0);
      (doodle[id] || (() => {}))(x, y);
      // more visits, more detail: a person, a cat, then colouring-in
      if (visits >= 2) g.fillStyle(0x3a3a44, 1).fillCircle(x + 14, y - 16, 3) && g.lineStyle(2, 0x3a3a44, 1).lineBetween(x + 14, y - 13, x + 14, y - 4);
      if (visits >= 3) g.fillStyle(0xe8843a, 1).fillCircle(x - 16, y - 4, 3);
      if (visits >= 5) g.fillStyle(0xf2d580, 0.35).fillCircle(x, y - 14, 16);
      // the label, in wobbly handwriting
      const name = { allotments: 'gardns', rooftops: 'roofs', laundry: 'washing', steep: 'hill st' }[id] || id;
      [...name].forEach((ch, k) => add(this.add.text(x - name.length * 3.5 + k * 7, y + 12 + rand.between(-2, 2), ch, { fontFamily: 'monospace', fontSize: '11px', color: '#3a3050' }).setAngle(rand.between(-10, 10))));
    });
    // the road off the edge, going up, if he has been
    if (map.hedge) {
      g.lineStyle(3, 0x8a7a5a, 0.9).beginPath();
      g.moveTo(x0 + places.length * step, baseY - 40);
      g.lineTo(x0 + places.length * step + 60, baseY - 80);
      g.lineTo(x0 + places.length * step + 100, baseY - 140);
      g.strokePath();
      if (map.ridge) g.fillStyle(0x60e8a0, 0.6).fillRect(x0 + places.length * step + 70, cy - H / 2 + 30, 60, 8);
    }
    add(this.add.text(cx + W / 2 - 60, cy + H / 2 - 30, 'my town', { fontFamily: 'monospace', fontSize: '12px', color: '#c03a2a' }).setAngle(-6));
  }

  async openAlbum() {
    const cam = this.cameras.main;
    const pz = this.paused;
    if (!pz || pz.album) return;
    pz.album = [];
    const add = (o) => (pz.album.push(o.setScrollFactor(0).setDepth(270)), this.pinUI(o, o.x, o.y, o.scaleX), o);
    add(this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x0e0b14, 0.92));
    const list = loadAlbum();
    if (!list.length) {
      add(this.add.text(cam.width / 2, cam.height / 2, 'no photos yet.', { fontFamily: 'monospace', fontSize: '14px', color: '#c8c0b0' }).setOrigin(0.5));
      return;
    }
    const keys = await photoTextures(this, list);
    if (!this.paused || !pz.album) return;
    keys.forEach((k, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);
      const x = 70 + col * 116;
      const y = 60 + row * 82;
      add(this.add.rectangle(x, y, 110, 66, 0xf2ece0));
      add(this.add.image(x, y, k).setDisplaySize(104, 59));
    });
  }

  updatePause() {
    this.updateUIPins();
    const pz = this.paused;
    if (this.game.loop.time - pz.openedAt < 250) return;
    const close = () => {
      pz.objs.forEach((o) => o.destroy());
      (pz.album || []).forEach((o) => o.destroy());
      this.paused = null;
      this.physics.resume();
      this.tweens.resumeAll();
      this.time.paused = false;
    };
    if (pz.album && (Phaser.Input.Keyboard.JustDown(this.keyEsc) || Phaser.Input.Keyboard.JustDown(this.player.keys.X))) {
      pz.album.forEach((o) => o.destroy());
      pz.album = null;
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyA)) this.openAlbum();
    else if (Phaser.Input.Keyboard.JustDown(this.player.keys.X) || Phaser.Input.Keyboard.JustDown(this.keyEsc)) close();
    else if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
      close();
      this.soundscape.stop();
      this.cameras.main.fadeOut(800, 20, 14, 8);
      this.time.delayedCall(850, () => this.scene.start('Hub'));
    }
  }
}
