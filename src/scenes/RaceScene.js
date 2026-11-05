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
import { raceLost } from '../engines/race.js';
import { raceFor } from '../dreams/racer/race/script.js';
import { carTune } from '../dreams/racer/race/car.js';
import { TRACKS } from '../dreams/racer/race/tracks.js';
import { RoadView, freeRoad } from '../dreams/racer/race/RoadView.js';
import { RaceHud } from '../dreams/racer/race/RaceHud.js';
import { RACE_KEYS, RACE_PAD, driveInput } from '../dreams/racer/race/controls.js';
import { sheetPace } from '../dreams/racer/race/pace.js';
import { applyResult, restarted, softAid, prizeOwed, clock, flagOf, costliest, spoken, shownTime } from '../dreams/racer/race/result.js';
import { EngineSynth } from '../audio/engineSynth.js';
import { InputMap, attachInput, rawInput } from '../input/InputMap.js';
import ModalManager from '../ui/ModalManager.js';
import PauseMenu from '../ui/PauseMenu.js';
import { settingsItems } from '../ui/settingsItems.js';
import { hud } from '../ui/hud.js';
import { touchState } from '../input/touchState.js';
import { trainWipe } from '../ui/TrainWipe.js';
import { setupLook } from '../art/look.js';
import { ambience } from '../audio/Ambience.js';
import { buses } from '../audio/AudioBus.js';
import { sfx, musicDirector, chime } from '../systems/audio.js';
import { getRun, setRun } from '../utils/save.js';
import { RunState } from '../play/RunState.js';

const DREAM = 'racer';
const NIGHT = [0x14, 0x12, 0x2a];
const SING_UNDER = 3; // m/s under a bend's limit at the way in: closer than this, it was the right brake
const SPIN_DARK_AT = 1.6; // s into a spin the picture fades: 0.4 s to the dark, then the lamp (TUNE.resetAt)
const ORDINAL = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];

// Ottavia, on the radio (a few words, on a caption)
const RADIO = {
  go: "Don't lift.",
  lights: 'Green, then gas.',
  jump_start: 'Early. Next time.',
  launch: 'That was the green. Good.',
  armed: "You are in his air. Out, when you're ready.",
  sling: 'Now she sings.',
  straw: 'Straw. Slower into that one.',
  bale: 'Mind the bales.',
  spin: 'Breathe. I have you at the lamp.',
  lamp: 'Lamp. If it goes wrong now, it goes wrong from here.',
  rub: 'That was paint.',
  hit: 'That was more than paint.',
  verge: 'Off the verge. It eats the tyres.',
  crest: 'Right, over the top. Trust the board. You will not see it.',
};

// the card, from what the run actually did
function cardLines(track, { place, time, gap, flags: run }, pass, flags, owed, sang) {
  const gate = track.gate || {};
  const him = (track.rivals?.[0] || track.rival)?.name || 'Him';
  const manners = run.clean ? 'Clean.' : run.spins ? `${run.spins} ${run.spins === 1 ? 'spin' : 'spins'}.` : run.rubs ? `${run.rubs} ${run.rubs === 1 ? 'rub' : 'rubs'}.` : 'Not clean.';
  const slings = run.slings ? ` ${run.slings} ${run.slings === 1 ? 'sling' : 'slings'}.` : '';
  const lines = [];
  if (gate.time !== undefined) {
    const said = spoken(shownTime(time, gate, pass));
    lines.push(pass ? `"${said}. He is pretending not to smile. The seat is yours."` : `"${said}. He says again. He says it kindly."`);
    lines.push(`Aldo's time: ${clock(gate.time)}. ${manners}`);
  } else {
    const name = ORDINAL[place - 1] || `P${place}`;
    const lifts = run.lifts === 0 ? 'you never lifted' : run.lifts === 1 ? 'I heard you lift once' : run.lifts === 2 ? 'I heard you lift only twice' : `I heard you lift ${run.lifts} times`;
    const say = place === 1 ? `${name}, and ${lifts}.` : pass ? `${name}. On the sheet. It will do.` : `${name}. He has the road and you have the next try.`;
    const gapLine = gap === null ? '' : gap >= 0 ? `${him}: ${gap.toFixed(1)} s behind you. ` : `${him}: ${(-gap).toFixed(1)} s ahead. `;
    lines.push(`Ottavia: "${say}"`, `${gapLine}${manners}${slings}`);
  }
  if (sang) lines.push(`${sang} of ${track.bends.length} bends sang.`);
  const lesson = costliest(run);
  if (lesson) lines.push(lesson);
  if (track.target) lines.push(time <= track.target ? `Ottavia's time: ${clock(track.target)}. You have it.` : `Ottavia's time: ${clock(track.target)}.`);
  if (owed) lines.push(`The prize tin is waiting at the garage: ${owed} brass nuts.`);
  else if (pass) lines.push('Nothing more in the tin for that.');
  if (!pass) lines.push(`Your best here: ${clock(flags[flagOf(track.id, 'time')])}.${gate.place ? ` The gate wants ${gate.place === 1 ? 'first' : `top ${gate.place}`}.` : ''}`);
  return lines;
}

export default class RaceScene extends Phaser.Scene {
  constructor() {
    super('Race');
    this.touchProfile = 'race'; // pedals and the steering slab (src/input/touchLayout.js)
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
    for (const [action, codes] of Object.entries(RACE_KEYS)) this.inputs.bind(action, 'keyboard', codes);
    for (const [action, codes] of Object.entries(RACE_PAD)) this.inputs.bind(action, 'gamepad', codes);
    const flags = (getRun(DREAM) || {}).flags || {};
    this.aid = softAid(flags, track.id);
    this.firstRace = flags[flagOf(track.id, 'best')] === undefined && !flags[flagOf(track.id, 'tries')];
    const tune = carTune(track, flags);
    this.race = raceFor(track, flags, { tune });
    this.hot = !flags.tuned; // she left the bench still beating: a warning to look at, not a retune
    this.ended = false;
    this.saidGo = false; // (scene.restart reuses this object)
    this.saidLights = false;
    this.saidLamp = false;
    this.saidVerge = false;
    this.keepGoing = false; // he chose to drive on: she does not ask again this race
    this.spinDark = false;
    this.leaving = false;
    this.holdMs = 0;
    this.steer = 0;
    this.sang = 0;
    this.bendNow = null;
    this.bendSlid = false;
    this.radioUntil = 0;
    this.escUp = true;
    this.cameras.main.setBackgroundColor(track.theme.background);
    hud.bind(this, 'hub'); // the grid without hearts: nothing here costs a heart
    this.keepTheme = false; // (a restart keeps the textures: only leaving the race frees them)
    this.view = new RoadView(this, track, this.race, { slow: touchState.on, chalk: this.aid || tune.chalk, joLivery: track.joLivery || (track.id === 'pinewood' ? 'dante' : 'heron') });
    this.pace = sheetPace(track);
    this.hudView = new RaceHud(this, track, { aid: this.aid, teachBrake: this.firstRace, pace: this.pace });
    this.look = setupLook(this, track.theme.look);
    this.heat = this.hot ? hud.meter('race-heat', { label: 'HOT', color: '#d5443c', order: 3 }) : null;
    if (this.heat) this.heat.set(0);
    musicDirector.stop();
    ambience.stop();
    buses.ensure();
    buses.setAcoustics('open', true);
    this.engine = new EngineSynth();
    this.cameras.main.fadeIn(340, ...NIGHT);
    if (this.aid) this.radio('I will whisper the brake marks. Listen for me.', 3200);
    else if (track.id === 'pinewood') this.radio('Thirty-four seconds, I did it in. In that car. Go on.', 2600, 'ALDO');
    else if (this.hot) this.radio('You left her beating. Watch the temperature.', 3200);
    this.events.once('shutdown', () => this.teardown());
    this.view.update(0, false);
  }

  teardown() {
    if (this.engine) this.engine.destroy();
    this.engine = null;
    if (!this.keepTheme) freeRoad(this, this.track.theme);
    hud.set('context', '');
    hud.region('race-speedo', null);
    hud.region('race-strip', null);
    if (this.heat) this.heat.setVisible(false);
    if (this.pauseMenu) this.pauseMenu.destroy();
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
      this.view.update(dt, false);
      return;
    }
    if (this.engine) this.engine.silence(false);
    // the key that closed a menu must be let go before it can open one
    if (!this.escUp) this.escUp = !this.inputs.isDown('pause');
    else if (this.inputs.justDown('pause') && !this.ended) {
      this.openPause();
      return;
    }
    const input = driveInput(this.inputs, rawInput().pad, this.steer, dt);
    this.steer = input.steer;
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
    this.watchBend(jo);
    this.view.startFrame();
    this.view.update(dt);
    this.hudView.update(this.race);
    this.updateAudio();
    if (this.heat) this.heat.set(Math.min(1, jo.d / (this.track.length * 0.6)));
    if (this.look) this.look.update(time, dt, null);
    if (this.radioUntil && time > this.radioUntil) {
      this.hudView.say('');
      this.radioUntil = 0;
    }
    // teach the launch on the third light, in the first race only
    if (this.firstRace && !this.saidLights && this.race.t >= -1) {
      this.saidLights = true;
      this.radio(RADIO.lights, 1600);
    }
    if (!this.saidGo && this.race.t >= 0) {
      this.saidGo = true;
      if (!this.race.launchTried) this.radio(RADIO.go);
    }
  }

  // the loan paid back: a bend taken close to its limit without a slide. She sings
  watchBend(jo) {
    const b = this.race.bendAt(jo.d);
    if (b && !this.bendNow) {
      this.bendNow = b;
      this.bendSlid = false;
    }
    if (b && (jo.slip > 1 || jo.onVerge)) this.bendSlid = true; // (a tyre at its limit, not over it, is the point)
    if (this.bendNow && b !== this.bendNow) {
      const under = jo.under.get(this.bendNow) ?? Infinity;
      if (!this.bendSlid && under <= SING_UNDER && jo.state === 'run') {
        this.sang += 1;
        this.hudView.flash('SHE SINGS');
        sfx('click');
      }
      this.bendNow = null;
    }
  }

  radio(text, ms = 2400, who = 'OTTAVIA') {
    this.hudView.say(`${who}: ${text}`);
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
        this.radio(RADIO.armed);
        sfx('click');
        break;
      case 'sling':
        this.radio(RADIO.sling, 1400);
        sfx('snap');
        cam.shake(160, 0.004);
        break;
      case 'rub':
        this.radio(RADIO.rub);
        sfx('knock');
        cam.shake(120, 0.005);
        this.view.sparkAt(1);
        this.holdMs = 40;
        break;
      case 'hit':
        this.radio(RADIO.hit);
        sfx('clang');
        cam.shake(240, 0.012);
        this.view.sparkAt(-1);
        this.holdMs = 80;
        break;
      case 'straw':
      case 'bale':
        this.radio(RADIO[e.type]);
        sfx('knock');
        cam.shake(150, 0.006);
        this.view.burst(8, 0xe4cc78);
        break;
      case 'verge':
        cam.shake(90, 0.003);
        if (!this.saidVerge) this.radio(RADIO.verge);
        this.saidVerge = true;
        break;
      case 'bump':
        sfx('knock');
        cam.shake(120, 0.005);
        break;
      case 'cue':
        if (RADIO[e.id]) this.radio(RADIO[e.id], 3400);
        break;
      case 'lamp': {
        chime('lamp', DREAM);
        if (!this.saidLamp) this.radio(RADIO.lamp); // (once: after that the chime says it)
        this.saidLamp = true;
        this.view.lightLamp(e.d);
        this.hudView.split(this.race, e.d);
        break;
      }
      case 'spin':
        this.radio(RADIO.spin, 3000);
        sfx('fail');
        cam.shake(280, 0.014);
        this.holdMs = 90;
        break;
      case 'reset': {
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
    const pass = result.passed;
    const flags = this.saveFlags((f) => applyResult(f, this.track, result));
    this.lastResult = { ...result, pass };
    hud.set('objective', pass ? 'back to the garage' : 'again');
    this.hudView.say('');
    this.time.delayedCall(1400, () => this.sys.isActive() && this.showCard(result, pass, flags));
  }

  showCard(result, pass, flags) {
    const { place, time } = result;
    const id = this.track.id;
    const owed = prizeOwed(flags, id);
    const lines = cardLines(this.track, result, pass, flags, owed, this.sang);
    if (!pass && softAid(flags, id)) lines.push('She will whisper the brake marks from now on.');
    const again = { id: 'again', label: pass ? 'Race it again' : 'Race again', action: () => this.restartRace(false) };
    const back = { id: 'garage', label: 'Back to the garage', action: () => this.leaveToGarage() };
    this.pauseMenu.open({ title: this.track.gate?.time !== undefined ? clock(shownTime(time, this.track.gate, pass)) : `P${place}   ${clock(time)}`, lines, items: pass ? [back, again] : [again, back], canClose: false, guardMs: 700 });
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
    this.keepTheme = true;
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
