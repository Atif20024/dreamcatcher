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
import { raceLost, TUNE } from '../engines/race.js';
import { raceFor, triedIt } from '../dreams/racer/race/script.js';
import { carTune } from '../dreams/racer/race/car.js';
import { TRACKS } from '../dreams/racer/race/tracks.js';
import { RoadView, freeRoad } from '../dreams/racer/race/RoadView.js';
import { RaceHud } from '../dreams/racer/race/RaceHud.js';
import { RACE_KEYS, RACE_PAD, driveInput } from '../dreams/racer/race/controls.js';
import { sheetPace } from '../dreams/racer/race/pace.js';
import { applyResult, restarted, softAid, prizeOwed, clock, flagOf, shownTime } from '../dreams/racer/race/result.js';
import { CUES, STORY, AIR, RADIO, cardLines, gridLine } from '../dreams/racer/race/words.js';
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
const SPIN_DARK_AT = 1.6; // s into a spin the picture fades: 0.4 s to the dark, then the lamp (TUNE.resetAt)

const BOARD_NEAR = 170; // m: Tullio has the slate up by here, and what is on it is on it for this pass
const PA_LEVEL = 0.018; // the Coppa's public address, under everything
const RUN_FLAGS = { salt: ['broke_orders'], coppa: ['helped_cassian', 'passed_cassian'] }; // (a script's flags that a new run answers again)
const ONCE = new Set(['block_tell', 'mistake', 'fade', 'oil']);
const NOW = new Set(['block_tell', 'mistake', 'oil', 'crossing_bell', 'gate', 'wheel', 'aldo_wide', 'pit_through', 'stop_go']); // (the rest of the story waits for a straight)
const WAIT_MAX = 6000; // ms a story line waits for a quiet road before it is dropped
const HARD_NEAR = 150; // m to a bend's way in: from here the call is what he reads, and the radio keeps to a few words
const HARD_SHORT = 28; // characters the radio may still say then
const READ_MIN = 1500; // ms a story line stays up before the next one may replace it …
const READ_CHAR = 45; // … or this much a character, if longer

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
    let track = this.track;
    this.modals = ModalManager.for(this);
    this.pauseMenu = new PauseMenu(this);
    this.inputs = attachInput(new InputMap());
    for (const [action, codes] of Object.entries(RACE_KEYS)) this.inputs.bind(action, 'keyboard', codes);
    for (const [action, codes] of Object.entries(RACE_PAD)) this.inputs.bind(action, 'gamepad', codes);
    const flags = (getRun(DREAM) || {}).flags || {};
    this.aid = softAid(flags, track.id);
    // (the keys and the green are taught once, on the first road of his life)
    this.firstRace = ['pinewood', 'test'].includes(track.id) && flags[flagOf(track.id, 'best')] === undefined && !flags[flagOf(track.id, 'tries')];
    const tune = carTune(track, flags);
    this.flags = flags;
    // (the help a failed try buys rides in the race's own copy of the track: the HUD, the sheet and the card all read the gate from it)
    this.race = raceFor(track, flags, { tune, tries: flags[flagOf(track.id, 'tries')] || 0 });
    this.track = track = this.race.track;
    this.saidOnce = new Set();
    this.quiet = new Set(); // the engines that have stopped
    this.boardAt = null; // the slate Jo is coming up to
    this.darkFaded = false;
    this.hot = !!tune.untuned; // she runs hot (left beating on the bench, or Sable's oil): a warning to look at, not a retune
    this.ended = false;
    this.saidGo = false; // (scene.restart reuses this object)
    this.storyUntil = 0;
    this.saidLights = false;
    this.saidLamp = false;
    this.saidVerge = false;
    this.keepGoing = false; // he chose to drive on: she does not ask again this race
    this.spinDark = false;
    this.leaving = false;
    this.holdMs = 0;
    this.steer = 0;
    this.sang = 0;
    this.lampOwed = false; // the first lamp's lesson, waiting for a quiet stretch of road
    this.waiting = null; // a line of the story, waiting the same way
    this.airSaid = new Set();
    this.radioUntil = 0;
    this.readUntil = 0;
    this.deferred = null;
    this.escUp = true;
    this.cameras.main.setBackgroundColor(track.theme.background);
    hud.bind(this, 'hub'); // the grid without hearts: nothing here costs a heart
    this.keepTheme = false; // (a restart keeps the textures: only leaving the race frees them)
    this.view = new RoadView(this, track, this.race, { slow: touchState.on, chalk: this.aid || tune.chalk, joLivery: track.joLivery || (track.id === 'pinewood' ? 'dante' : 'heron'), flags });
    this.pace = sheetPace(track);
    this.hudView = new RaceHud(this, track, { aid: this.aid, teachBrake: this.firstRace, pace: this.pace, flags });
    this.look = setupLook(this, track.theme.look);
    this.heat = this.hot ? hud.meter('race-heat', { label: 'HOT', color: '#d5443c', order: 3 }) : null;
    if (this.heat) this.heat.set(0);
    musicDirector.stop();
    ambience.stop();
    buses.ensure();
    buses.setAcoustics('open', true);
    this.engine = new EngineSynth();
    this.cameras.main.fadeIn(340, ...NIGHT);
    const grid = gridLine(track, { aid: this.aid, hot: this.hot, flags });
    if (grid) this.radio(grid[1], grid[2], grid[0]);
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
    const input = driveInput(this.inputs, rawInput().pad, this.steer, dt, touchState.on ? touchState.steer : null);
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
    this.watchStory(jo);
    if (this.lampOwed && !this.hardMoment() && this.radio(RADIO.lamp, 3000)) this.lampOwed = false;
    if (this.waiting && (this.time.now > this.waiting.until || !this.hardMoment())) {
      const [who, text] = this.waiting.line;
      if (this.time.now <= this.waiting.until) this.radio(text, Math.max(2400, text.length * 60), who, true);
      this.waiting = null;
    }
    this.view.startFrame();
    this.view.update(dt);
    this.hudView.update(this.race);
    this.updateAudio();
    if (this.heat) this.heat.set(Math.min(1, jo.d / (this.track.length * this.race.tune.hotAfter)));
    if (this.look) this.look.update(time, dt, null);
    if (this.deferred && this.time.now >= (this.readUntil || 0)) {
      const d = this.deferred;
      this.deferred = null;
      this.radio(d.text, d.ms, d.who, true, d.urgent);
    }
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

  // what the road's script does over time, and the slate
  watchStory(jo) {
    const s = this.race.script;
    // the Harbour: 1.5 s after his lights go, the picture goes too; the script holds 2 s on the dark
    if (s?.state === 'dark' && s.t >= 1.5 && !this.darkFaded) {
      this.darkFaded = true;
      this.cameras.main.fadeOut(350, 4, 4, 10);
    }
    const slates = (this.track.things || []).filter((o) => o.kind === 'pitboard').flatMap((o) => (this.track.lapLen ? [o.d, o.d + this.track.lapLen] : [o.d]));
    const next = slates.find((d) => d > jo.d - 2 && d - jo.d < BOARD_NEAR);
    if (next === undefined) return;
    // (the script's word is live; the rest is what Tullio wrote for this pass)
    const word = this.scriptWord(jo);
    if (next !== this.boardAt) {
      this.boardAt = next;
      this.boardText = this.boardWord(jo);
    }
    this.view.setSlate(word || this.boardText);
  }

  scriptWord(jo) {
    const s = this.race.script;
    const box = this.track.script?.box;
    if (s?.board === 'GO' && box && jo.d > box.d + 100) return ''; // (he has gone: GO was for that stop)
    return s?.board || '';
  }

  // what the pit wall has to say this time past: the plan's slate, in order of how much it matters
  boardWord(jo) {
    const r = this.race;
    if (jo.grip < 0.4) return 'TYRES';
    if (jo.lifts >= 2 && !this.saidOnce.has('lift')) {
      this.saidOnce.add('lift');
      return 'LIFT';
    }
    if (this.track.id === 'salt' && !this.saidOnce.has('aldo-board')) {
      this.saidOnce.add('aldo-board');
      return 'ALDO'; // (Tullio's hand, once)
    }
    const ahead = r.rivals.filter((c) => c.d > jo.d && !c.out).sort((a, b) => a.d - b.d)[0];
    const behind = r.rivals.filter((c) => c.d <= jo.d && !c.out).sort((a, b) => b.d - a.d)[0];
    const place = 1 + r.rivals.filter((c) => c.d > jo.d).length;
    const other = ahead || behind;
    if (!other) return `P${place}`;
    const gap = Math.abs(other.d - jo.d) / Math.max(jo.v, 10);
    return `P${place} ${ahead ? '+' : '-'}${gap.toFixed(1)}`;
  }

  say(key) {
    if (ONCE.has(key)) {
      if (this.saidOnce.has(key)) return;
      this.saidOnce.add(key);
    }
    const line = STORY[key];
    if (!line) return;
    if (!NOW.has(key) && this.hardMoment()) {
      this.waiting = { line, until: this.time.now + WAIT_MAX };
      return;
    }
    this.radio(line[1], Math.max(2400, line[1].length * 60), line[0], true);
  }

  // a bend's way in is near, or he is in it: the call is what he reads now
  hardMoment() {
    const jo = this.race.jo;
    const b = this.race.nextBend(jo.d);
    return !!b && (jo.d >= b.from || b.from - jo.d < HARD_NEAR);
  }

  // (a line of the story is not talked over: a rub or a lamp waits its turn, and is dropped. Nor is a
  // line still being read, and at a bend only a few words get through. Returns whether it was said)
  radio(text, ms = 2400, who = 'OTTAVIA', story = false, urgent = false) {
    const now = this.time.now;
    if (!story && !urgent) {
      if (now < (this.storyUntil || 0) || now < this.radioUntil - 600) return false;
      if (text.length > HARD_SHORT && this.race.t > 0 && this.hardMoment()) return false;
    }
    // (nor is a story line replaced before it can be read: the next one waits for it, and is said then)
    if (story && now < (this.readUntil || 0)) {
      this.deferred = { text, ms, who, urgent };
      return true;
    }
    if (story) {
      this.storyUntil = now + ms;
      this.readUntil = now + Math.max(READ_MIN, text.length * READ_CHAR);
    }
    this.hudView.say(`${who}: ${text}`);
    this.radioUntil = now + ms;
    return true;
  }

  onEvent(e) {
    const cam = this.cameras.main;
    this.view.react(e);
    // (the rivals' own verge, sling and straw are nobody's business; the rest of these name who, or what)
    if (e.id && e.id !== 'jo' && ['jump_start', 'launch', 'armed', 'sling', 'straw', 'bale', 'verge', 'bump', 'spin', 'back', 'reset', 'lamp', 'oil'].includes(e.type)) return;
    switch (e.type) {
      case 'cue': {
        const line = CUES[e.id];
        if ((e.id === 'crest' || e.id === 'line') && this.track.id !== 'pinewood') break;
        if (line) this.radio(line[1], Math.max(3000, line[1].length * 60), line[0], true);
        break;
      }
      case 'block_tell':
        if (this.engine) this.engine.sting('tell');
        this.say('block_tell');
        break;
      case 'mistake':
      case 'fade':
      case 'teo_through':
      case 'orders_broken':
      case 'pit_through':
        this.say(e.type);
        break;
      case 'oil':
        this.say('oil');
        sfx('knock');
        cam.shake(180, 0.004);
        break;
      case 'crossing_bell':
        if (this.engine) this.engine.bell(true);
        this.say('crossing_bell');
        break;
      case 'crossing_open':
        if (this.engine) this.engine.bell(false);
        break;
      case 'aldo_wide':
        this.say('aldo_wide');
        break;
      case 'aldo_dark':
        // his note stops; nobody says anything
        this.quiet.add('aldo');
        this.hudView.say('');
        this.radioUntil = 0;
        break;
      case 'race_over':
        this.saveFlags((f) => ({ ...applyResult(f, this.track, { place: 1, time: this.race.t }), ...e.flags }));
        this.ended = true;
        this.leaving = true;
        this.scene.start('Dream', { dreamId: DREAM, resume: true, quietResume: true });
        break;
      case 'gull_lamp':
        // (lit on the first pass: the chime, and Ottavia says nothing for once)
        if (e.state === 'lit') chime('lamp', DREAM);
        break;
      case 'board':
        break;
      case 'pit':
        this.radio(e.how === 'box' ? 'Good. Sit still.' : e.how === 'short' ? 'Short. They have to run to you.' : 'Long. They have to run to you.', 2400, 'TULLIO', true);
        sfx('knock');
        break;
      case 'pit_go':
        this.radio('Go.', 1600, 'TULLIO', true);
        break;
      case 'wheel':
        this.quiet.add(e.id);
        if (this.engine) this.engine.sting('crack');
        cam.shake(160, 0.004);
        this.say('wheel');
        break;
      case 'choice':
        if (e.how === 'stop') this.radio('You stopped. Idiot. Go!', 3000, 'CASSIAN', true);
        else this.radio('…Drive.', 2400, 'OTTAVIA', true);
        break;
      case 'stop_go':
        this.say('stop_go');
        break;
      case 'jump_start':
        this.radio(RADIO.jump_start);
        break;
      case 'launch':
        this.radio(RADIO.launch);
        sfx('snap');
        cam.shake(120, 0.003);
        break;
      case 'armed':
        if (!this.saidOnce.has('armed') && this.radio(RADIO.armed)) this.saidOnce.add('armed');
        sfx('click');
        break;
      case 'sing':
        // the loan paid back: the bend taken on its limit, and she pulls out of it (race.js singPull)
        this.sang += 1;
        this.hudView.flash('SHE SINGS', TUNE.singTime * 1000);
        chime('lamp', DREAM);
        cam.shake(90, 0.002);
        break;
      case 'air': {
        // race 2's whole ask: out of his air is said once, and getting back in is said once
        const key = e.held ? (this.airSaid.has('out') ? 'back' : null) : 'out';
        if (key && !this.airSaid.has(key)) {
          this.airSaid.add(key);
          this.radio(AIR[key][1], 2400, AIR[key][0], key === 'out'); // (getting back in is good news: it gives way to the story)
        }
        if (e.held) this.hudView.flash('IN HIS AIR', 1400);
        sfx('click');
        break;
      }
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
        if (!this.saidVerge) this.saidVerge = this.radio(RADIO.verge);
        break;
      case 'bump':
        sfx('knock');
        cam.shake(120, 0.005);
        if (e.why === 'gate') this.say('gate');
        break;
      case 'lamp': {
        chime('lamp', DREAM);
        // (once, on his first road, and when the road is quiet: after that the chime says it)
        if (this.firstRace && !this.saidLamp) this.lampOwed = true;
        this.saidLamp = true;
        this.view.lightLamp(e.d);
        this.hudView.split(this.race, e.d);
        break;
      }
      case 'spin':
        this.radio(RADIO.spin, 3000, 'OTTAVIA', false, true);
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
    const car = (c, i) => ({ id: c.id, v: c.v, throttle: c.throttle, dx: c.d - jo.d, closing: i ? jo.v - c.v : 0, base: i ? 58 + i * 7 : 52, detune: i ? 9 : this.hot ? 6 : 0 }); // (tuned: Jo's own two oscillators are dead on)
    const beat = r.beat();
    this.engine.update({
      cars: r.cars.filter((c) => !this.quiet.has(c.id)).map(car),
      slip: jo.slip,
      speed: jo.v,
      beat: beat && !this.quiet.has(beat.id) ? beat : null,
      untuned: this.hot,
      verge: jo.onVerge ? jo.v : 0,
      murmur: this.track.id === 'coppa' ? PA_LEVEL : 0,
    });
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
    const flags = this.saveFlags((f) => {
      const out = applyResult(f, this.track, result);
      // (the story's choices: the latest finish stands, except that a run short of the gate does not unsay one that passed)
      if (pass || !f[flagOf(this.track.id, 'passed')]) {
        for (const k of RUN_FLAGS[this.track.id] || []) delete out[k];
        Object.assign(out, this.race.script?.flags);
      }
      return out;
    });
    this.lastResult = { ...result, pass };
    hud.set('objective', pass ? 'back to the garage' : 'again');
    this.hudView.say('');
    // the Coppa: first over the line, and the note. One note, held, dead on, and only then anyone speaks
    const won = this.track.id === 'coppa' && pass;
    if (won && this.engine) this.engine.holdNote();
    if (won) this.time.delayedCall(1300, () => this.sys.isActive() && this.radio("That's it. That's dead on.", 2200, 'OTTAVIA', true));
    this.time.delayedCall(won ? 3600 : 1400, () => this.sys.isActive() && this.showCard(result, pass, flags));
  }

  showCard(result, pass, flags) {
    const { place, time } = result;
    const id = this.track.id;
    const owed = prizeOwed(flags, id);
    const jo = this.race.jo;
    const nearest = this.race.rivals.reduce((w, c) => (!w || Math.abs(c.d - jo.d) < Math.abs(w.d - jo.d) ? c : w), null)?.id;
    const lines = cardLines(this.track, result, pass, flags, owed, this.sang, nearest);
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
      ...(this.race.jo.state === 'run' && !['wide', 'dark', 'over'].includes(this.race.script?.state) ? [{ id: 'restart', label: 'Restart from the lamp', action: () => this.restartFromLamp() }] : []),
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
    if (countIt) this.countTry();
    this.pauseMenu.destroy();
    const cam = this.cameras.main;
    this.keepTheme = true;
    cam.once('camerafadeoutcomplete', () => this.scene.restart({ track: this.track.id }));
    cam.fadeOut(300, ...NIGHT);
  }

  // (a try is a real attempt: one given up past half the road. A restart in the first half is no attempt, and buys no help)
  countTry() {
    if (!this.ended && triedIt(this.race)) this.saveFlags((f) => restarted(f, this.track));
  }

  // back through the shutter: the dip through dark, the run resumes at the garage's lamp
  leaveToGarage() {
    if (this.leaving) return;
    this.leaving = true;
    this.countTry();
    this.pauseMenu.destroy();
    const cam = this.cameras.main;
    cam.once('camerafadeoutcomplete', () => this.scene.start('Dream', { dreamId: DREAM, resume: true, quietResume: true }));
    cam.fadeOut(340, ...NIGHT);
  }

  leaveToStation() {
    if (this.leaving) return;
    this.leaving = true;
    this.countTry();
    this.pauseMenu.destroy();
    trainWipe(this, () => this.scene.start('Hub'), { place: DREAM, event: 'return' });
  }
}
