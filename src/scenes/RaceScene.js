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
import { Race, TUNE } from '../engines/race.js';
import { TRACKS } from '../dreams/racer/race/tracks.js';
import { RaceRoad, M, laneY, laneScale, ROAD_BOT, ROAD_TOP } from '../dreams/racer/race/RaceRoad.js';
import { RaceHud } from '../dreams/racer/race/RaceHud.js';
import { applyResult, restarted, softAid, prizeOwed, clock, flagOf } from '../dreams/racer/race/result.js';
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

// Ottavia, on the radio (a few words, on a caption)
const RADIO = {
  go: "Don't lift.",
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
const TOUCH_RADIO = { armed: 'You are in his air. SLING when you pull out.' };

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
    this.aid = softAid((getRun(DREAM) || {}).flags || {}, track.id);
    this.race = new Race(track, { rivals: [track.rival] });
    this.ended = false;
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
    this.hudView = new RaceHud(this, track, { aid: this.aid });
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
    for (const b of t.bends || []) {
      for (const n of [150, 100, 50]) add(b.from - n, farY, `board-${n}`, 4.5);
      // the outside of the bend: straw on the near verge, a stone wall on the far
      for (let d = b.from - 6; d < b.to + 6; d += b.outside === 'wall' ? 2.15 : 3) {
        if (b.side > 0) add(d, nearY - 10, 'bale', 50);
        else add(d, farY + 6, 'wall', 4.6);
      }
      for (let d = b.from; d < b.to; d += 24) add(d, b.side > 0 ? farY : nearY, 'chevron', b.side > 0 ? 4.5 : 58);
      if (this.aid) {
        // Ottavia's chalk on the road: where to brake from the top speed
        const mark = this.add.rectangle(-400, (ROAD_TOP + ROAD_BOT) / 2, 8, ROAD_BOT - ROAD_TOP - 12, 0xf2e6cc, 0.8).setDepth(5.5);
        this.side.push({ d: b.from - (TUNE.vMax * TUNE.vMax - b.safe * b.safe) / (2 * TUNE.brake) - 14, img: mark });
      }
    }
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
      this.hudView.update(this.race);
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
    if (this.holdMs > 0) this.holdMs -= dt; // hit-stop: the picture holds, the keys wait
    else this.race.advance(input, dt);
    for (const e of this.race.drain()) this.onEvent(e);
    this.renderWorld(dt);
    this.hudView.update(this.race);
    this.updateAudio();
    if (this.look) this.look.update(time, dt, null);
    if (this.radioUntil && time > this.radioUntil) {
      hud.set('caption', '');
      this.radioUntil = 0;
    }
    if (!this.saidGo && this.race.t >= 0) {
      this.saidGo = true;
      this.radio(RADIO.go);
    }
  }

  radio(text, ms = 2400) {
    hud.set('caption', `OTTAVIA: ${text}`);
    this.radioUntil = this.time.now + ms;
  }

  onEvent(e) {
    const cam = this.cameras.main;
    if (e.id && e.id !== 'jo' && !['rub', 'hit'].includes(e.type)) return;
    switch (e.type) {
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
        this.radio(RADIO.lamp);
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
        this.time.delayedCall(1600, () => this.sys.isActive() && cam.fadeOut(300, ...NIGHT));
        break;
      case 'reset':
        this.camX = CAR_X[0];
        if (cam.fadeEffect.isRunning) cam.once('camerafadeoutcomplete', () => cam.fadeIn(300, ...NIGHT));
        else cam.fadeIn(300, ...NIGHT);
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
    this.bank += ((b ? -b.side * 0.018 * Math.min(1, c.v / 18) : 0) - this.bank) * (1 - Math.exp(-dt / 220));
    cam.setRotation(this.bank);
    this.road.update(jd, c.v);
    const X = (d) => this.camX + (d - jd) * M;
    for (const s of this.side) {
      const x = X(s.d);
      const on = x > -300 && x < 1260 && !(s.ob && s.ob.gone);
      s.img.setVisible(on);
      if (on) s.img.x = Math.round(x);
    }
    this.drawCar(this.joCar, this.camX, dt);
    for (const v of this.rivalCars) {
      const d = v.car.prevD + (v.car.d - v.car.prevD) * a;
      this.drawCar(v, X(d), dt);
    }
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

  drawCar(v, x, dt) {
    const c = v.car;
    const a = this.race.alpha();
    const y = c.prevY + (c.y - c.prevY) * a;
    const on = x > -200 && x < 1200;
    v.box.setVisible(on);
    if (!on) return;
    const ly = laneY(y);
    // the road's small shake grows with speed; nose down on the brake, squat on the throttle
    const buzz = c.v > 10 ? Math.round(Math.sin(c.d * 9) * Math.min(1, c.v / 30)) : 0;
    v.box.setPosition(Math.round(x), Math.round(ly) + buzz).setDepth(10 + y * 10).setScale(laneScale(y));
    const pitch = c.braking && c.v > 1 ? 0.9 : c.throttle && c.v < 25 ? -0.6 : 0;
    v.body.setAngle(pitch).setY(c.braking && c.v > 1 ? 1 : c.throttle ? -1 : 0);
    v.lamp.setVisible(c.braking && c.v > 0.5);
    // the wheels turn by the road travelled: never faster, never slower
    const deg = ((c.d / WHEEL_R_M) * 180) / Math.PI;
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
    this.engine.update({ cars: r.cars.map(car), slip: jo.slip, speed: jo.v });
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

  showCard({ place, time }, pass, flags) {
    const id = this.track.id;
    const owed = prizeOwed(flags, id);
    const lines = pass
      ? [`Ottavia: "${place === 1 ? 'First. And I heard you lift only twice.' : 'On the sheet. It will do.'}"`, owed ? `The prize tin is waiting at the garage: ${owed} brass nuts.` : 'Nothing more in the tin for that.']
      : [`Ottavia: "Second. He has the road and you have the next try."`, `Your best here: ${clock(flags[flagOf(id, 'time')])}. The gate wants first.`];
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
      { id: 'restart', label: 'Restart from the lamp', action: () => this.restartFromLamp() },
      { id: 'restartRace', label: 'Restart this race', action: () => this.restartRace(true) },
      { id: 'garage', label: 'Back to the garage', action: () => this.leaveToGarage() },
      { id: 'station', label: 'Back to station', action: () => this.leaveToStation() },
      { id: 'settings', label: 'Settings', action: (m) => m.setItems(settingsItems({ back: { id: 'back', label: 'Back', action: (x) => x.setItems(main(), { title: 'Paused', lines: info() }) } }), { title: 'Settings', lines: ['←/→ change a volume'] }) },
    ];
    this.pauseMenu.open({ title: 'Paused', lines: info(), items: main(), canClose: true });
  }

  restartFromLamp() {
    this.pauseMenu.destroy();
    const c = this.race.jo;
    // on the grid there is no lamp to go back to: the grid is the lamp
    if (!c.lampD && c.d < 1) return;
    this.race.toLamp(c, true);
    this.cameras.main.fadeIn(300, ...NIGHT);
  }

  restartRace(countIt) {
    if (this.leaving) return;
    this.leaving = true;
    if (countIt && !this.ended) this.saveFlags((f) => restarted(f, this.track));
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
