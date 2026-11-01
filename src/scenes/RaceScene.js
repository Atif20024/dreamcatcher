// RaceScene (THE LONG STRAIGHT, docs/dream_racer.md): the driving, a scene of its
// own in its own JS chunk, started from a door in the garage. The rules are the
// pure engine (src/engines/race.js); this only draws them and hears the keys.
// It reuses the shared pieces rather than BaseLevel, which is built for a body
// on a tile grid: ModalManager and PauseMenu for the menus, the saved run for
// the result (src/dreams/racer/race/result.js), the HUD's grid, the train wipe.
//
//   this.scene.start('Race', { track: 'test' })
//   → back: this.scene.start('Dream', { dreamId: 'racer', resume: true, quietResume: true })
import Phaser from 'phaser';
import { Race, TUNE, chalkAt, raceLost } from '../engines/race.js';
import { TRACKS, RACE_PAD } from '../dreams/racer/race/tracks.js';
import { RaceRoad, M, laneY, laneScale, ROAD_BOT, ROAD_TOP, ROAD_SLIDE } from '../dreams/racer/race/RaceRoad.js';
import { RaceHud } from '../dreams/racer/race/RaceHud.js';
import { applyResult, restarted, softAid, prizeOwed, clock, flagOf, costliest } from '../dreams/racer/race/result.js';
import { WHEEL_STEPS, WHEEL_DEG, CAR_SIZE } from '../art/carKit.js';
import { EngineSynth } from '../audio/engineSynth.js';
import { InputMap, attachInput } from '../input/InputMap.js';
import ModalManager from '../ui/ModalManager.js';
import PauseMenu from '../ui/PauseMenu.js';
import { settingsItems } from '../ui/settingsItems.js';
import { hud } from '../ui/hud.js';
import { touchState } from '../input/touchState.js';
import { trainWipe } from '../ui/TrainWipe.js';
import { setupLook } from '../art/look.js';
import { createLampTextures } from '../art/identityArt.js';
import { ambience } from '../audio/Ambience.js';
import { buses } from '../audio/AudioBus.js';
import { sfx, musicDirector, chime } from '../systems/audio.js';
import { getRun, setRun } from '../utils/save.js';
import { RunState } from '../play/RunState.js';

const DREAM = 'racer';
const NIGHT = [0x14, 0x12, 0x2a];
const WHEEL_R_M = CAR_SIZE.wheelM / 2;
const BLUR_AT = 7.5; // m/s: past here 8 spokes alias, so the wheel is a blur that still turns
const CAR_X = [360, 250]; // the car's place on screen, at rest and at top speed: the look ahead
const ZOOM = [1, 0.9]; // the design's pull back near top speed
const SPIN_DARK_AT = 1.6; // s into a spin the picture fades: 0.4 s to the dark, then the lamp (TUNE.resetAt)
const AIR = { streaks: 3, wave: 3, gap: 11 }; // the rival's air: the beat you can see
const ORDINAL = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];

// Ottavia, on the radio (a few words, on a caption)
const RADIO = {
  go: "Don't lift.",
  lights: 'Green, then Space.',
  jump_start: 'Early. Next time.',
  launch: 'That was the green. Good.',
  armed: 'You are in his air. Space when you pull out.',
  sling: 'Now she sings.',
  straw: 'Straw. Slower into that one.',
  bale: 'Mind the bales.',
  spin: 'Breathe. I have you at the lamp.',
  lamp: 'Lamp. If it goes wrong now, it goes wrong from here.',
  rub: 'That was paint.',
  hit: 'That was more than paint.',
};
const TOUCH_RADIO = { armed: 'You are in his air. SLING when you pull out.', lights: 'Green, then SLING.' };

// the card, from what the run actually did
function cardLines(track, { place, time, gap, flags: run }, pass, flags, owed) {
  const name = ORDINAL[place - 1] || `P${place}`;
  const lifts = run.lifts === 0 ? 'you never lifted' : run.lifts === 1 ? 'I heard you lift once' : run.lifts === 2 ? 'I heard you lift only twice' : `I heard you lift ${run.lifts} times`;
  const say = place === 1 ? `${name}, and ${lifts}.` : pass ? `${name}. On the sheet. It will do.` : `${name}. He has the road and you have the next try.`;
  const gapLine = gap === null ? '' : gap >= 0 ? `The Corsa: ${gap.toFixed(1)} s behind you. ` : `The Corsa: ${(-gap).toFixed(1)} s ahead. `;
  const manners = run.clean ? 'Clean.' : run.spins ? `${run.spins} ${run.spins === 1 ? 'spin' : 'spins'}.` : run.rubs ? `${run.rubs} ${run.rubs === 1 ? 'rub' : 'rubs'}.` : 'Not clean.';
  const slings = run.slings ? ` ${run.slings} ${run.slings === 1 ? 'sling' : 'slings'}.` : '';
  const lines = [`Ottavia: "${say}"`, `${gapLine}${manners}${slings}`];
  const lesson = costliest(run);
  if (lesson) lines.push(lesson);
  if (track.target) lines.push(time <= track.target ? `Ottavia's time: ${clock(track.target)}. You have it.` : `Ottavia's time: ${clock(track.target)}.`);
  if (owed) lines.push(`The prize tin is waiting at the garage: ${owed} brass nuts.`);
  else if (pass) lines.push('Nothing more in the tin for that.');
  if (!pass) lines.push(`Your best here: ${clock(flags[flagOf(track.id, 'time')])}. The gate wants first.`);
  return lines;
}

export default class RaceScene extends Phaser.Scene {
  constructor() {
    super('Race');
    this.touchProfile = 'race'; // pedals and lane buttons (src/input/touchLayout.js)
  }

  init(data = {}) {
    this.track = TRACKS[data.track] || TRACKS.test;
    this.dreamId = DREAM;
  }

  create() {
    const track = this.track;
    this.modals = ModalManager.for(this);
    this.pauseMenu = new PauseMenu(this);
    this.inputs = attachInput(new InputMap());
    this.inputs.bind('jump', 'keyboard', ['Space']); // (W is a lane here, not a jump)
    for (const [action, codes] of Object.entries(RACE_PAD)) this.inputs.bind(action, 'gamepad', codes);
    const flags = (getRun(DREAM) || {}).flags || {};
    this.aid = softAid(flags, track.id);
    this.firstRace = flags[flagOf(track.id, 'best')] === undefined && !flags[flagOf(track.id, 'tries')];
    this.race = new Race(track, { rivals: [track.rival] });
    this.ended = false;
    this.saidGo = false; // (scene.restart reuses this object)
    this.saidLights = false;
    this.saidLamp = false;
    this.keepGoing = false; // he chose to drive on: she does not ask again this race
    this.spinDark = false;
    this.lean = 0;
    this.beatPhase = 0;
    this.air = { hz: 0, on: false, alpha: 0, wave: 0 };
    this.leaving = false;
    this.holdMs = 0;
    this.camX = CAR_X[0];
    this.zoom = ZOOM[0];
    this.bank = 0;
    this.spun = 0;
    this.radioUntil = 0;
    this.escUp = true;
    this.wheelTurn = {};
    this.cameras.main.setBackgroundColor(0x8ec4e0);
    hud.bind(this, 'hub'); // the grid without hearts: nothing here costs a heart
    createLampTextures(this);
    this.road = new RaceRoad(this);
    this.buildTrackside();
    this.joCar = this.makeCar(this.race.jo, 'heron');
    this.rivalCars = this.race.rivals.map((r) => this.makeCar(r, track.rival.livery || 'roche'));
    this.dust = Array.from({ length: 16 }, () => this.add.image(-200, 0, 'cars', 'puff').setVisible(false).setDepth(50));
    this.dustNext = 0;
    this.spark = this.add.image(-200, 0, 'cars', 'spark').setVisible(false).setDepth(55);
    this.lines = Array.from({ length: 7 }, (_, i) => this.add.rectangle(-200, 200 + i * 40, 120, 2, 0xffffff, 0.75).setVisible(false).setDepth(70));
    this.airStreaks = Array.from({ length: AIR.streaks }, () => this.add.rectangle(-200, 0, 100, 2, 0xf2e6cc, 0).setOrigin(1, 0.5).setVisible(false));
    this.hudView = new RaceHud(this, track, { aid: this.aid, teachBrake: this.firstRace });
    this.look = setupLook(this, { vignette: 0.55, grain: 0.03 });
    musicDirector.stop();
    ambience.stop();
    buses.ensure();
    buses.setAcoustics('open', true);
    this.engine = new EngineSynth();
    this.cameras.main.fadeIn(340, ...NIGHT);
    if (this.aid) this.radio('I will whisper the brake marks. Listen for me.', 3200);
    this.events.once('shutdown', () => this.teardown());
    this.renderWorld();
  }

  teardown() {
    if (this.engine) this.engine.destroy();
    this.engine = null;
    hud.region('race-speedo', null);
    hud.region('race-strip', null);
    if (this.pauseMenu) this.pauseMenu.destroy();
  }

  // ---- what stands on the road's edges ----------------------------------------
  buildTrackside() {
    const t = this.track;
    const add = (d, y, frame, depth, scale = 1, texture = 'cars') => {
      const img = this.add.image(-400, y, texture, texture === 'cars' ? frame : undefined).setOrigin(0.5, 1).setDepth(depth).setScale(scale);
      this.side.push({ d, img });
      return img;
    };
    this.side = [];
    const farY = ROAD_TOP + 3;
    const nearY = ROAD_BOT + 40;
    add(14, farY, 'gantry', 4.5);
    add(t.length, farY, 'finish', 4.5);
    add(t.length, nearY, 'finish', 58);
    this.lampImgs = new Map();
    for (const l of t.lamps || []) this.lampImgs.set(l, add(l, farY, 'flag', 4.5, 1, 'flag'));
    (t.bends || []).forEach((b, i) => {
      const clearFrom = i ? t.bends[i - 1].to : 0; // (no board stands in the bend before)
      for (const n of [150, 100, 50]) if (b.from - n > clearFrom) add(b.from - n, farY, `board-${n}`, 4.5);
      // the outside of the bend: straw on the near verge, a stone wall on the far
      for (let d = b.from - 6; d < b.to + 6; d += b.outside === 'wall' ? 2.15 : 3) {
        if (b.side > 0) add(d, nearY - 10, 'bale', 50);
        else add(d, farY + 6, 'wall', 4.6);
      }
      for (let d = b.from; d < b.to; d += 24) add(d, b.side > 0 ? farY : nearY, 'chevron', b.side > 0 ? 4.5 : 58);
      if (this.aid) {
        // Ottavia's chalk on the road: where to brake from the top speed, lane by lane (a lane is a line)
        for (const lane of [0, 1, 2]) {
          const mark = this.add.rectangle(-400, laneY(lane) - 16, 8, 30, 0xf2e6cc, 0.8).setDepth(5.5);
          this.side.push({ d: chalkAt(b, lane), img: mark });
        }
      }
    });
    for (const o of this.race.obstacles) {
      const img = this.add.image(-400, laneY(o.lane), 'cars', o.kind).setOrigin(0, 1).setScale(laneScale(o.lane)).setDepth(10 + o.lane * 10 - 1);
      this.side.push({ d: o.d, img, ob: o });
    }
  }

  makeCar(car, livery) {
    const body = this.add.image(0, 0, 'cars', `car-${livery}`).setOrigin(0.5, 1);
    const shadow = this.add.ellipse(0, 1, 168, 12, 0x14101a, 0.38);
    const offX = (x) => x - CAR_SIZE.frameW / 2;
    const r = 14;
    const wheels = CAR_SIZE.wheelX.map((x) => this.add.image(offX(x), -r, 'cars', 'wheel-0'));
    const lamp = this.add.image(offX(4), -25, 'cars', 'brakelamp').setVisible(false);
    const box = this.add.container(0, 0, [shadow, body, ...wheels, lamp]);
    return { car, livery, box, body, wheels, lamp, spin: 0 };
  }

  // ---- input and time ------------------------------------------------------------
  update(time, delta) {
    const dt = Math.min(delta, 50);
    this.inputs.poll();
    const menu = this.pauseMenu.isOpen || this.leaving;
    if (this.modals.active || menu) {
      this.escUp = false;
      if (this.engine) this.engine.silence(true);
      this.hudView.update(this.race, this.viewAhead());
      this.renderWorld();
      return;
    }
    if (this.engine) this.engine.silence(false);
    // the key that closed a menu must be let go before it can open one
    if (!this.escUp) this.escUp = !this.inputs.isDown('pause');
    else if (this.inputs.justDown('pause') && !this.ended) {
      this.openPause();
      return;
    }
    const inp = this.inputs;
    const input = { throttle: inp.isDown('right'), brake: inp.isDown('left'), laneUp: inp.justDown('up'), laneDown: inp.justDown('down'), sling: inp.justDown('jump') };
    // hit-stop: the picture holds, the keys wait (time 0 runs no step, and keeps the presses)
    if (this.holdMs > 0) {
      this.holdMs -= dt;
      this.race.advance(input, 0);
    } else this.race.advance(input, dt);
    for (const e of this.race.drain()) this.onEvent(e);
    // the dark of a spin follows the race's own clock, so a pause holds it too
    const jo = this.race.jo;
    if (jo.state === 'spin' && jo.stateT >= SPIN_DARK_AT && !this.spinDark) {
      this.spinDark = true;
      this.cameras.main.fadeOut(300, ...NIGHT);
    }
    this.renderWorld(dt);
    this.hudView.update(this.race, this.viewAhead());
    this.updateAudio();
    if (this.look) this.look.update(time, dt, null);
    if (this.radioUntil && time > this.radioUntil) {
      hud.set('caption', '');
      this.radioUntil = 0;
    }
    // teach the launch on the third light, in the first race only
    if (this.firstRace && !this.saidLights && this.race.t >= -1) {
      this.saidLights = true;
      this.radio(touchState.on ? TOUCH_RADIO.lights : RADIO.lights, 1600);
    }
    if (!this.saidGo && this.race.t >= 0) {
      this.saidGo = true;
      if (!this.race.launchTried) this.radio(RADIO.go);
    }
  }

  // metres of road the camera shows ahead of the car, this frame
  viewAhead() {
    const cam = this.cameras.main;
    return (cam.width / 2 + cam.width / 2 / this.zoom - this.camX) / M;
  }

  radio(text, ms = 2400) {
    hud.set('caption', `OTTAVIA: ${text}`);
    this.radioUntil = this.time.now + ms;
  }

  onEvent(e) {
    const cam = this.cameras.main;
    if (e.id && e.id !== 'jo' && !['rub', 'hit', 'rival_home'].includes(e.type)) return;
    switch (e.type) {
      case 'jump_start':
        this.radio(RADIO.jump_start);
        break;
      case 'launch':
        this.radio(RADIO.launch);
        sfx('snap');
        cam.shake(120, 0.003);
        break;
      case 'armed':
        this.radio(touchState.on ? TOUCH_RADIO.armed : RADIO.armed);
        sfx('click');
        break;
      case 'sling':
        this.radio(RADIO.sling, 1400);
        sfx('snap');
        cam.shake(160, 0.004);
        break;
      case 'lane':
        this.puff(this.joCar, 2);
        break;
      case 'rub':
        this.radio(RADIO.rub);
        sfx('knock');
        cam.shake(120, 0.005);
        this.sparkAt(this.joCar);
        this.holdMs = 40;
        break;
      case 'hit':
        this.radio(RADIO.hit);
        sfx('clang');
        cam.shake(240, 0.012);
        this.sparkAt(this.joCar);
        this.holdMs = 80;
        break;
      case 'straw':
      case 'bale':
        this.radio(RADIO[e.type]);
        sfx('knock');
        cam.shake(150, 0.006);
        this.puff(this.joCar, 6);
        break;
      case 'bump':
        sfx('knock');
        cam.shake(120, 0.005);
        break;
      case 'lamp': {
        chime('lamp', DREAM);
        if (!this.saidLamp) this.radio(RADIO.lamp); // (once: after that the chime says it)
        this.saidLamp = true;
        const img = this.lampImgs.get(e.d);
        if (img) img.setTexture('flag-lit');
        break;
      }
      case 'spin':
        this.radio(RADIO.spin, 3000);
        sfx('fail');
        cam.shake(280, 0.014);
        this.holdMs = 90;
        this.spun = 0;
        break;
      case 'reset': {
        this.camX = CAR_X[0];
        this.spinDark = false;
        const lift = () => cam.fadeIn(300, ...NIGHT);
        // past saving: Ottavia asks on the dark frame, one key (the road comes back if he drives on)
        // (not on his own Restart from the lamp, or once he has said no)
        if (!e.now && !this.keepGoing && raceLost(this.race)) {
          this.askAgain(lift);
          break;
        }
        // (only a fade to dark is worth waiting for: no other ends in that event)
        if (cam.fadeEffect.isRunning && cam.fadeEffect.direction) cam.once('camerafadeoutcomplete', lift);
        else lift();
        break;
      }
      case 'rival_home':
        if (!this.keepGoing && raceLost(this.race) && this.track.length - this.race.jo.d > 100) this.askAgain();
        break;
      case 'finish':
        this.onFinish(e);
        break;
      default:
    }
  }

  // ---- the picture ------------------------------------------------------------------
  renderWorld(dt = 16.67) {
    const r = this.race;
    const c = r.jo;
    const a = r.alpha();
    const jd = c.prevD + (c.d - c.prevD) * a;
    const speedK = Math.min(1, c.v / TUNE.vMax);
    const ease = 1 - Math.exp(-dt / 300);
    this.camX += (CAR_X[0] + (CAR_X[1] - CAR_X[0]) * speedK - this.camX) * ease;
    const wantZoom = ZOOM[0] + (ZOOM[1] - ZOOM[0]) * speedK - (c.slingT > 0 ? 0.015 : 0);
    this.zoom += (wantZoom - this.zoom) * ease;
    const cam = this.cameras.main;
    cam.setZoom(this.zoom);
    // a bend leans the world a little: the eye reads the road turning
    const b = r.bendAt(c.d);
    const turn = b ? b.side * Math.min(1, c.v / 18) : 0;
    const easeTurn = 1 - Math.exp(-dt / 220);
    this.bank += (-turn * 0.018 - this.bank) * easeTurn;
    cam.setRotation(this.bank);
    // and slides it, towards the outside: the road the car is being thrown across
    this.lean += (turn - this.lean) * easeTurn;
    cam.scrollY = Math.round(-this.lean * ROAD_SLIDE);
    this.road.update(jd, c.v, this.lean);
    const X = (d) => this.camX + (d - jd) * M;
    for (const s of this.side) {
      const x = X(s.d);
      const on = x > -300 && x < 1260 && !(s.ob && s.ob.gone);
      s.img.setVisible(on);
      if (on) s.img.x = Math.round(x);
    }
    this.drawCar(this.joCar, this.camX, dt, jd);
    for (const v of this.rivalCars) {
      const d = v.car.prevD + (v.car.d - v.car.prevD) * a;
      this.drawCar(v, X(d), dt, d);
    }
    this.drawAir(X, dt, jd);
    // the sense of speed: dust off a slide, motion lines only on the slingshot
    if (c.slip > 1 && this.time.now % 3 < 1) this.puff(this.joCar, 1);
    for (const p of this.dust) {
      if (!p.visible) continue;
      p.life -= dt;
      p.x -= (c.v * M * 0.72 * dt) / 1000;
      p.y -= dt * 0.012;
      p.setAlpha(Math.max(0, p.life / 500) * 0.75).setScale(p.scaleX + dt * 0.001);
      if (p.life <= 0) p.setVisible(false);
    }
    this.lines.forEach((l, i) => {
      const on = c.slingT > 0;
      l.setVisible(on);
      if (on) {
        l.x -= (c.v * M * 1.6 * dt) / 1000;
        if (l.x < -200) l.setPosition(1160 + i * 70, 200 + ((i * 53 + Math.floor(jd)) % 270));
      }
    });
    if (this.spark.visible) {
      this.spark.sparkLife -= dt;
      if (this.spark.sparkLife <= 0) this.spark.setVisible(false);
    }
  }

  // HEAR THE DRAFT, seen: the rival's air, three streaks off his tail that wave and
  // throb at the beat of the two engines, and lie still and bright when it stops
  drawAir(X, dt, jd) {
    const beat = this.race.result ? null : this.race.beat();
    const on = !!beat;
    this.air = { on, hz: on ? beat.hz : 0, hear: on ? beat.hear : 0, alpha: 0, wave: 0 };
    for (const s of this.airStreaks) s.setVisible(on);
    if (!on) return;
    const view = this.rivalCars.find((v) => v.car.id === beat.id);
    this.beatPhase = (this.beatPhase + (Math.PI * 2 * beat.hz * dt) / 1000) % (Math.PI * 2);
    const still = beat.hz === 0;
    const wave = still ? 0 : AIR.wave * Math.min(1, beat.hz / TUNE.beatEdge);
    const alpha = beat.hear * (still ? 0.9 : 0.3 + 0.25 * (1 + Math.sin(this.beatPhase)));
    this.air.alpha = alpha;
    this.air.wave = wave;
    const c = view.car;
    const tail = X(c.prevD + (c.d - c.prevD) * this.race.alpha()) - (CAR_SIZE.frameW / 2) * view.box.scaleX;
    const len = Math.min(120, Math.max(40, (tail - this.camX) - 70)); // (from his tail back towards Jo's nose)
    this.airStreaks.forEach((s, i) => {
      const y = view.box.y - 12 - i * AIR.gap + Math.sin(this.beatPhase + i * 0.9) * wave;
      s.setPosition(Math.round(tail), Math.round(y)).setSize(len - i * 14, 2).setAlpha(alpha).setDepth(view.box.depth + 0.2);
      s.setFillStyle(still ? 0x88e8ff : 0xf2e6cc, alpha);
    });
  }

  drawCar(v, x, dt, d = v.car.d) {
    const c = v.car;
    const a = this.race.alpha();
    const y = c.prevY + (c.y - c.prevY) * a;
    const on = x > -200 && x < 1200;
    v.box.setVisible(on);
    if (!on) return;
    const ly = laneY(y);
    // the road's small shake grows with speed; nose down on the brake, squat on the throttle
    const buzz = c.v > 10 ? Math.round(Math.sin(d * 9) * Math.min(1, c.v / 30)) : 0;
    v.box.setPosition(Math.round(x), Math.round(ly) + buzz).setDepth(10 + y * 10).setScale(laneScale(y));
    const pitch = c.braking && c.v > 1 ? 0.9 : c.throttle && c.v < 25 ? -0.6 : 0;
    v.body.setAngle(pitch).setY(c.braking && c.v > 1 ? 1 : c.throttle ? -1 : 0);
    v.lamp.setVisible(c.braking && c.v > 0.5);
    // the wheels turn by the road travelled: never faster, never slower
    const deg = ((d / WHEEL_R_M) * 180) / Math.PI;
    for (const w of v.wheels) {
      if (c.v > BLUR_AT) w.setFrame('wheel-blur').setAngle(deg % 360);
      else w.setFrame(`wheel-${Math.floor(((deg % 45) + 45) % 45 / WHEEL_DEG) % WHEEL_STEPS}`).setAngle(0);
    }
    v.wheelDeg = deg;
    // a spin is all the picture's: the engine has the car at the lamp soon after
    if (c.state === 'spin') {
      v.spin = Math.min(720, v.spin + dt * 0.75);
      v.box.setAngle(v.spin * (1 - c.stateT / 2.2));
    } else if (v.spin) {
      v.spin = 0;
      v.box.setAngle(0);
    } else v.box.setAngle(c.slip > 0 ? Math.min(5, c.slip * 0.6) * -Math.sign(this.race.bendAt(c.d)?.side || 1) : 0);
  }

  puff(view, n) {
    for (let i = 0; i < n; i++) {
      const p = this.dust[this.dustNext];
      this.dustNext = (this.dustNext + 1) % this.dust.length;
      p.life = 500;
      p.setVisible(true).setScale(0.5).setAlpha(0.75).setPosition(view.box.x - 70 + Math.random() * 20, view.box.y - 6 + Math.random() * 6);
      p.setDepth(view.box.depth + 0.5);
    }
  }

  sparkAt(view) {
    this.spark.sparkLife = 120;
    this.spark.setVisible(true).setPosition(view.box.x + 40, view.box.y - 24).setDepth(view.box.depth + 1);
  }

  updateAudio() {
    if (!this.engine) return;
    const r = this.race;
    const jo = r.jo;
    const car = (c, i) => ({ id: c.id, v: c.v, throttle: c.throttle, dx: c.d - jo.d, closing: i ? jo.v - c.v : 0, base: i ? 58 + i * 7 : 52, detune: i ? 9 : 6 });
    this.engine.update({ cars: r.cars.map(car), slip: jo.slip, speed: jo.v, beat: r.beat() });
  }

  // ---- the end of a race -----------------------------------------------------------
  // the result is saved here, on the line, before any card: closing the tab on
  // the card loses nothing, and the garage pays what is owed exactly once
  saveFlags(fn) {
    const run = RunState.from(getRun(DREAM) || { dreamId: DREAM, sceneKey: 'Dream' });
    run.flags = fn(run.flags);
    run.savedAt = Date.now();
    setRun(DREAM, run);
    return run.flags;
  }

  onFinish(result) {
    this.ended = true;
    const pass = result.place <= this.track.passPlace;
    const flags = this.saveFlags((f) => applyResult(f, this.track, result));
    this.lastResult = { ...result, pass };
    hud.set('objective', pass ? 'back to the garage' : 'again');
    this.time.delayedCall(1400, () => this.sys.isActive() && this.showCard(result, pass, flags));
  }

  showCard(result, pass, flags) {
    const { place, time } = result;
    const id = this.track.id;
    const owed = prizeOwed(flags, id);
    const lines = cardLines(this.track, result, pass, flags, owed);
    if (!pass && softAid(flags, id)) lines.push('She will whisper the brake marks from now on.');
    const again = { id: 'again', label: pass ? 'Race it again' : 'Race again', action: () => this.restartRace(false) };
    const back = { id: 'garage', label: 'Back to the garage', action: () => this.leaveToGarage() };
    this.pauseMenu.open({ title: `P${place}   ${clock(time)}`, lines, items: pass ? [back, again] : [again, back], canClose: false, guardMs: 700 });
  }

  // ---- the pause menu -----------------------------------------------------------------
  openPause() {
    const info = () => [this.race.jo.lampD ? `Last lamp: ${this.race.jo.lampD} m` : 'No lamp yet: you would start on the grid.', 'The dream is saved at the garage.'];
    const main = () => [
      { id: 'resume', label: 'Resume', action: () => this.pauseMenu.destroy() },
      // (not in a spin: the lamp is already coming, the 3 s are not for sale)
      ...(this.race.jo.state === 'run' ? [{ id: 'restart', label: 'Restart from the lamp', action: () => this.restartFromLamp() }] : []),
      { id: 'restartRace', label: 'Restart this race', action: () => this.restartRace(true) },
      { id: 'garage', label: 'Back to the garage', action: () => this.leaveToGarage() },
      { id: 'station', label: 'Back to station', action: () => this.leaveToStation() },
      { id: 'settings', label: 'Settings', action: (m) => m.setItems(settingsItems({ back: { id: 'back', label: 'Back', action: (x) => x.setItems(main(), { title: 'Paused', lines: info() }) } }), { title: 'Settings', lines: ['←/→ change a volume'] }) },
    ];
    this.pauseMenu.open({ title: 'Paused', lines: info(), items: main(), canClose: true });
  }

  // the race is out of reach: one key to go again. Whatever he chooses it is his.
  askAgain(andThen = null) {
    const c = this.race.jo;
    const lines = ['"He has the road now. Again?"', c.lampD ? `Or drive on from the ${c.lampD} m lamp.` : 'Or drive on.'];
    const items = [
      { id: 'again', label: 'Again', action: () => this.restartRace(true) },
      { id: 'on', label: 'Drive on', action: (m) => m.close() },
      { id: 'garage', label: 'Back to the garage', action: () => this.leaveToGarage() },
    ];
    const drivingOn = () => {
      this.keepGoing = true;
      if (andThen) andThen();
    };
    this.pauseMenu.open({ title: 'Again?', lines, items, canClose: true, onClose: drivingOn, guardMs: 350 });
  }

  restartFromLamp() {
    this.pauseMenu.destroy();
    const c = this.race.jo;
    // no lamp yet: the grid is the lamp, and the lights come with it
    if (!c.lampD) {
      if (c.d >= 1) this.restartRace(true);
      return;
    }
    this.race.toLamp(c, true); // (its 'reset' lifts the picture)
  }

  restartRace(countIt) {
    if (this.leaving) return;
    this.leaving = true;
    // (a try is a try once the race has run a little: Esc on the grid is no attempt)
    if (countIt && !this.ended && this.race.t > 3) this.saveFlags((f) => restarted(f, this.track));
    this.pauseMenu.destroy();
    const cam = this.cameras.main;
    cam.once('camerafadeoutcomplete', () => this.scene.restart({ track: this.track.id }));
    cam.fadeOut(300, ...NIGHT);
  }

  // back through the shutter: the dip through dark, the run resumes at the garage's lamp
  leaveToGarage() {
    if (this.leaving) return;
    this.leaving = true;
    this.pauseMenu.destroy();
    const cam = this.cameras.main;
    cam.once('camerafadeoutcomplete', () => this.scene.start('Dream', { dreamId: DREAM, resume: true, quietResume: true }));
    cam.fadeOut(340, ...NIGHT);
  }

  leaveToStation() {
    if (this.leaving) return;
    this.leaving = true;
    this.pauseMenu.destroy();
    trainWipe(this, () => this.scene.start('Hub'), { place: DREAM, event: 'return' });
  }
}
