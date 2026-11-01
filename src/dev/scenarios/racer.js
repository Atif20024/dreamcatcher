// THE LONG STRAIGHT, stage 1: the race scene and its hand-off, through the real
// door, the real keys and the real save. Silent, as every dev run is: the engine
// is checked by what it asks of the oscillators, not by ear.
//   racer-race-start    door → Race; lights hold the car; gas moves it; wheels by distance; parallax rates
//   racer-finish-return the line saves the result before any card; back at the garage it pays once, a Continue does not pay again
//   racer-fail-message  second place: the message, no pay, a retry counted, the whisper after three
//   racer-fail-fair     a wall: back at the last lamp, driving, within 3 s
//   racer-pause         Esc stops the road and the engine; resume; restart from the lamp; the menu's way out
//   racer-touch         real touches on the pedals and lane buttons
//   racer-draft         3 s behind a rival fills the bar; pull out and sling
//   racer-engine-offline the engine's real graph rendered offline: level and pitch, no speakers
//   racer-frame-time    work per frame at speed against 16.67 ms
//   racer-platform      platform 10 on the station: its train, its row, boards through the real code; nothing counts it
//   racer-beat          the draft by state: the two notes, the beat, the streaks that show it with the sound off
//   racer-beat-offline  the real graph rendered offline: the beat is in the signal, and stops in the slot (no speakers)
//   racer-sight-strip   beyond the view only, no gap before the road shows it, a pulse by time to contact, no digits
//   racer-again         a lost race asks on the dark frame, one key, and Drive on brings the road back
//   racer-spin-pause    a pause in a spin holds the dark; the lamp is not for sale; no blind driving
//   racer-hit-stop      a press in a hit-stop lands when it ends
//   racer-bend-visible  a bend slides the road and the land to its outside, the HUD stays put
//   racer-hud-diet      the static plates go, grip stays hidden, the call has its units and its side
//   racer-card          the result card says what the run did
//   racer-garage-lines  the bench and the rack answer [E]
import { getRun, clearRun, getSave } from '../../utils/save.js';
import { flagOf } from '../../dreams/racer/race/result.js';
import { CAR_LEN, TUNE } from '../../engines/race.js';
import { LANE_Y } from '../../dreams/racer/race/RaceRoad.js';
import { TRACKS } from '../../dreams/racer/race/tracks.js';
import { packsFor } from '../../art/baked.js';
import { caughtRunning, runningCount } from '../../systems/hubState.js';
import { enableTouch } from '../../ui/TouchControls.js';
import { EngineSynth } from '../../audio/engineSynth.js';
import { touchState } from '../../input/touchState.js';
import { hud } from '../../ui/hud.js';
import { BAYS, bayIndex } from '../../data/hub/rooms.js';
import { BUDGET } from '../../core/PerfBudget.js';

const until = async (dc, test, max = 400) => {
  for (let i = 0; i < max; i++) {
    if (test()) return i;
    await dc.run(1);
    await new Promise((r) => setTimeout(r, 0));
  }
  return -1;
};

async function garage(dc) {
  clearRun('racer');
  dc.warp('racer', 'garage');
  await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Dream' && dc.scene().interaction && dc.scene().interaction.items.has('race:test'));
  await dc.run(20);
  return dc.scene();
}

async function toRace(dc) {
  const s = await garage(dc);
  s.interaction.items.get('race:test').onUse();
  await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Race' && dc.scene().race);
  return dc.scene();
}

// past the lights, cars rolling, the scene in charge
async function rolling(dc, jo = {}) {
  const r = await toRace(dc);
  const race = r.race;
  race.t = 0.5;
  race.launchTried = true;
  Object.assign(race.jo, jo);
  await dc.run(2);
  return r;
}

const nearLine = (r, joFirst) => {
  const L = r.track.length;
  r.race.t = 40;
  r.race.launchTried = true;
  r.race.jo.d = joFirst ? L - 5 : L - 60;
  r.race.jo.lampD = 600;
  r.race.jo.v = 30;
  r.race.jo.y = 1;
  r.race.jo.lane = 1;
  r.race.rivals[0].d = joFirst ? L - 80 : L - 5;
  r.race.rivals[0].v = 30;
};

const raceStart = {
  id: 'racer-race-start',
  expect: 'pass',
  async run(dc) {
    const s = await garage(dc);
    const rows = {};
    s.interaction.items.get('race:test').onUse();
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Race' && dc.scene().race);
    const r = dc.scene();
    rows.savedAtDoor = !!getRun('racer');
    rows.checkpoint = getRun('racer').checkpointLabel;
    const race = r.race;
    rows.lightsAt = race.t;
    dc.hold('right');
    await dc.run(60);
    rows.heldBeforeGo = race.jo.d;
    await until(dc, () => race.t > 0);
    const d0 = race.jo.d;
    await dc.run(120);
    rows.moved = race.jo.d - d0;
    rows.v = race.jo.v;
    // the wheel turns by distance: its angle is d / r, whatever the speed
    const deg = r.joCar.wheelDeg;
    rows.wheelOk = deg >= ((race.jo.prevD / 0.31) * 180) / Math.PI - 1 && deg <= ((race.jo.d / 0.31) * 180) / Math.PI + 1;
    // parallax at the design's rates
    rows.parallax = r.road.layers.map((L) => L.f);
    const road0 = r.road.road.tilePositionX;
    const far0 = r.road.layers[0].ts.tilePositionX;
    await dc.run(10);
    rows.roadMoved = (r.road.road.tilePositionX - road0 + 512) % 512;
    rows.farMoved = (r.road.layers[0].ts.tilePositionX - far0 + 1024) % 1024;
    // the lane glide, the depth scale
    dc.press('up', 3);
    await dc.run(40);
    rows.lane = race.jo.lane;
    rows.scale = r.joCar.box.scaleX;
    rows.engine = r.engine.state();
    dc.releaseAll();
    rows.readability = dc.readability();
    const ok = rows.savedAtDoor && rows.checkpoint === 'THE PEREVAL GARAGE' && !rows.readability.length && rows.lightsAt < 0 && rows.heldBeforeGo === 0 && rows.moved > 10 && rows.wheelOk && rows.parallax.join() === '0.1,0.35,0.7' && rows.farMoved < rows.roadMoved && rows.lane === 0 && Math.abs(rows.scale - 0.92) < 0.01 && rows.engine.voices.length === 2 && rows.engine.voices[0].freq > 52;
    return { pass: ok, detail: rows };
  },
};

const finishReturn = {
  id: 'racer-finish-return',
  expect: 'pass',
  async run(dc) {
    const r = await toRace(dc);
    const wallet0 = getSave().wallet.total;
    nearLine(r, true);
    dc.hold('right');
    await until(dc, () => r.race.result);
    dc.releaseAll();
    await dc.run(1);
    const rows = {};
    // on the line, before any card: the result is in the save, nothing paid yet
    const f = (w) => flagOf('test', w);
    let run = getRun('racer');
    rows.savedOnLine = { best: run.flags[f('best')], passed: run.flags[f('passed')], paid: run.flags[f('paid')] };
    rows.notPaidYet = getSave().wallet.total === wallet0;
    await until(dc, () => r.pauseMenu.isOpen);
    rows.card = r.pauseMenu.state();
    await dc.run(50); // the guard
    r.pauseMenu.choose('garage');
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Dream' && dc.scene().F && dc.scene().F[f('paid')]);
    await dc.run(5);
    const s = dc.scene();
    rows.back = { room: s.roomId, resuming: s.resuming, x: Math.round(s.player.x), goal: hud.s.objective };
    const worth = 3 * TRACKS.test.prize[1];
    rows.paid = getSave().wallet.total - wallet0;
    run = getRun('racer');
    rows.flagSaved = run.flags[f('paid')];
    rows.walletDelta = run.walletDelta;
    // a Continue: the scene again from the save, as the station does it. Twice.
    for (let i = 0; i < 2; i++) {
      s.scene.start('Dream', { dreamId: 'racer', resume: true });
      await until(dc, () => dc.scene() && dc.scene().F && dc.scene().F[f('paid')]);
      await dc.run(10);
    }
    rows.paidAfterContinues = getSave().wallet.total - wallet0;
    rows.coins = dc.scene().levelCoins;
    return { pass: rows.savedOnLine.best === 1 && rows.savedOnLine.passed === true && rows.savedOnLine.paid === undefined && rows.notPaidYet && rows.card.items.includes('garage') && rows.back.room === 'garage' && rows.back.resuming && /season/.test(rows.back.goal) && rows.paid === worth && rows.paidAfterContinues === worth && rows.flagSaved === TRACKS.test.prize[1] && rows.coins === TRACKS.test.prize[1], detail: rows };
  },
};

const failMessage = {
  id: 'racer-fail-message',
  expect: 'pass',
  async run(dc) {
    let r = await toRace(dc);
    const wallet0 = getSave().wallet.total;
    const f = (w) => flagOf('test', w);
    const rows = { tries: [] };
    for (let i = 0; i < 3; i++) {
      nearLine(r, false);
      await until(dc, () => r.pauseMenu.isOpen, 900);
      rows.tries.push(getRun('racer').flags[f('tries')]);
      rows.state = r.pauseMenu.state();
      rows.lines = r.pauseMenu.lines;
      rows.modal = r.modals.state();
      await dc.run(50);
      r.pauseMenu.choose('again');
      await dc.run(40);
      await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Race' && dc.scene().race && dc.scene().race.t < -1 && !dc.scene().leaving);
      r = dc.scene();
    }
    rows.aidNow = r.aid;
    rows.paid = getSave().wallet.total - wallet0;
    return { pass: rows.tries.join() === '1,2,3' && rows.state.items[0] === 'again' && rows.aidNow === true && rows.paid === 0 && /gate/.test(rows.lines.join(' ')), detail: rows };
  },
};

const failFair = {
  id: 'racer-fail-fair',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc);
    const race = r.race;
    const b = TRACKS.test.bends.find((x) => x.outside === 'wall');
    race.jo.lampD = 600;
    race.jo.d = b.from - 2;
    race.jo.v = 36;
    dc.hold('right');
    await until(dc, () => race.jo.state === 'spin', 200);
    const t0 = race.t;
    const backAt = await until(dc, () => race.jo.state === 'run', 400);
    dc.releaseAll();
    const rows = { spent: race.t - t0, frames: backAt, at: race.jo.d, v: race.jo.v, spins: race.jo.spins };
    return { pass: rows.spins === 1 && rows.at >= 700 && rows.at < 703 && rows.spent <= 3.2, detail: rows };
  },
};

const pause = {
  id: 'racer-pause',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { v: 30, d: 300 });
    const race = r.race;
    dc.hold('right');
    await dc.run(20);
    const rows = {};
    dc.press('esc', 3);
    await dc.run(3);
    rows.open = r.pauseMenu.isOpen;
    rows.items = r.pauseMenu.state().items;
    const d0 = race.jo.d;
    await dc.run(30);
    rows.frozen = race.jo.d === d0;
    rows.silent = r.engine.state().silent;
    r.pauseMenu.choose('resume');
    await dc.run(30);
    rows.resumed = race.jo.d > d0 && !r.pauseMenu.isOpen;
    rows.heard = r.engine.state().voices.length;
    // Esc closes the menu, and the same press must not open it again
    dc.press('esc', 3);
    await dc.run(3);
    dc.press('esc', 3);
    await dc.run(10);
    rows.escCloses = !r.pauseMenu.isOpen;
    dc.press('esc', 3);
    await dc.run(3);
    rows.escReopens = r.pauseMenu.isOpen;
    // from the lamp
    race.jo.lampD = 600;
    race.jo.d = 720;
    r.pauseMenu.choose('restart');
    await dc.run(2);
    rows.lamp = Math.round(race.jo.d);
    dc.releaseAll();
    dc.press('esc', 3);
    await dc.run(3);
    r.pauseMenu.choose('garage');
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Dream' && dc.scene().F);
    rows.garage = dc.scene().sys.settings.key;
    return { pass: rows.open && rows.frozen && rows.silent && rows.resumed && rows.heard === 2 && rows.escCloses && rows.escReopens && rows.lamp >= 600 && rows.lamp < 610 && rows.garage === 'Dream' && rows.items.includes('restartRace') && rows.items.includes('station'), detail: rows };
  },
};

const live = new Map();
function touch(type, id, gx, gy) {
  const canvas = window.game.canvas;
  const b = touchState.controls.rect();
  const t = new Touch({ identifier: id, target: canvas, clientX: b.left + (gx / 960) * b.width, clientY: b.top + (gy / 540) * b.height, radiusX: 8, radiusY: 8, force: 1 });
  if (type === 'touchend') live.delete(id);
  else live.set(id, t);
  canvas.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: [...live.values()], targetTouches: [...live.values()], changedTouches: [t] }));
}

const touchDrive = {
  id: 'racer-touch',
  expect: 'pass',
  async run(dc) {
    const was = touchState.on;
    enableTouch(true);
    const r = await rolling(dc);
    const race = r.race;
    await dc.run(3);
    const L = touchState.controls.layout;
    const by = (id) => L.buttons.find((b) => b.id === id);
    const rows = { pad: L.pad, ids: L.buttons.map((b) => b.id) };
    // hold GAS with one thumb
    touch('touchstart', 1, by('right').x, by('right').y);
    await dc.run(60);
    rows.gasV = race.jo.v;
    // tap lane up with the other, gas still held
    touch('touchstart', 2, by('up').x, by('up').y);
    await dc.run(3);
    touch('touchend', 2, by('up').x, by('up').y);
    await dc.run(40);
    rows.lane = race.jo.lane;
    rows.gasStill = race.jo.throttle;
    // the sling button on a full bar
    race.jo.armed = true;
    race.jo.draft = 1;
    race.jo.slingCool = 0;
    touch('touchstart', 3, by('jump').x, by('jump').y);
    await dc.run(3);
    touch('touchend', 3, by('jump').x, by('jump').y);
    rows.sling = race.jo.slings;
    // a thumb rolls across to BRAKE without lifting
    touch('touchmove', 1, by('left').x, by('left').y);
    await dc.run(30);
    rows.braking = race.jo.braking;
    rows.vBraked = race.jo.v;
    touch('touchend', 1, by('left').x, by('left').y);
    await dc.run(2);
    rows.letGo = !race.jo.braking && !race.jo.throttle;
    // pause by its button: the pedals step aside
    touch('touchstart', 4, by('pause').x, by('pause').y);
    await dc.run(3);
    touch('touchend', 4, by('pause').x, by('pause').y);
    await dc.run(3);
    rows.paused = r.pauseMenu.isOpen;
    rows.playHidden = touchState.controls.play === false;
    r.pauseMenu.destroy();
    await dc.run(3);
    rows.back = touchState.controls.play === true;
    rows.readability = dc.readability();
    if (!was) enableTouch(false);
    return { pass: rows.pad === null && rows.gasV > 8 && rows.lane === 0 && rows.gasStill && rows.sling === 1 && rows.braking && rows.letGo && rows.paused && rows.playHidden && rows.back, detail: rows };
  },
};

const draft = {
  id: 'racer-draft',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc);
    const race = r.race;
    const rival = race.rivals[0];
    Object.assign(race.jo, { d: 100, v: 30, lane: 1, y: 1 });
    Object.assign(rival, { d: 100 + 3.8 * 3.5, v: 30, lane: 1, y: 1 });
    dc.hold('right');
    const rows = {};
    let filled = null;
    for (let i = 0; i < 180; i++) {
      await dc.run(1);
      if (filled === null && race.jo.draft >= 1) filled = race.t;
    }
    rows.filledAfter = filled === null ? null : +(filled - 0.5).toFixed(2);
    rows.draft = race.jo.draft;
    rows.armed = race.jo.armed;
    rows.hudLabel = hud.s.meters.find((m) => m.id === 'draft').label;
    rows.gap = +(rival.d - race.jo.d).toFixed(1);
    const v0 = race.jo.v;
    dc.press('down', 3);
    await dc.run(30);
    dc.press('jump', 3);
    await dc.run(2);
    rows.slingT = race.jo.slingT;
    rows.slings = race.jo.slings;
    await dc.run(100);
    rows.gain = +(race.jo.v - v0).toFixed(1);
    rows.lines = r.lines.filter((l) => l.visible).length;
    await dc.run(100);
    rows.passed = race.jo.d > rival.d;
    rows.rubs = race.jo.rubs;
    dc.releaseAll();
    return { pass: rows.filledAfter !== null && rows.armed && rows.slings === 1 && rows.gain > 2 && rows.passed && rows.rubs === 0, detail: rows };
  },
};

// Dev is silent, so no ear has heard this: render the real graph into an offline
// buffer (it never reaches the speakers) and read the signal. Level and pitch only.
const engineOffline = {
  id: 'racer-engine-offline',
  expect: 'pass',
  async run() {
    const render = async (cars, slip = 0, speed = 30) => {
      const ctx = new OfflineAudioContext(1, 22050, 44100);
      const e = new EngineSynth({ ctx, dest: ctx.destination });
      e.update({ cars, slip, speed });
      const asked = e.state().voices.map((v) => +v.freq.toFixed(1));
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0).subarray(8000);
      let rms = 0;
      let peak = 0;
      for (const x of d) {
        rms += x * x;
        peak = Math.max(peak, Math.abs(x));
      }
      // the strongest repeat in the signal, between 40 and 500 Hz
      let best = 0;
      let bestLag = 0;
      for (let lag = 88; lag < 1100; lag++) {
        let s = 0;
        for (let i = 0; i + lag < 8000; i++) s += d[i] * d[i + lag];
        if (s > best) {
          best = s;
          bestLag = lag;
        }
      }
      return { asked, rms: +Math.sqrt(rms / d.length).toFixed(4), peak: +peak.toFixed(3), heardHz: +(44100 / bestLag).toFixed(1) };
    };
    const car = (v, throttle = true, dx = 0) => ({ id: 'jo', v, throttle, dx, closing: 0 });
    const rows = {
      idle: await render([car(0, false)], 0, 0),
      mid: await render([car(18)]),
      top: await render([car(36)]),
      lifted: await render([car(36, false)]),
      three: await render([car(30), { ...car(30, true, 10), id: 'a', base: 65 }, { ...car(30, true, -20), id: 'b', base: 72 }, { ...car(30, true, 70), id: 'c', base: 79 }]),
      squeal: await render([car(30)], 10),
    };
    const near = (a, b) => Math.abs(a - b) / b < 0.2;
    const ok = rows.mid.rms > 0.01 && rows.top.peak < 1 && rows.top.heardHz > rows.mid.heardHz && rows.mid.heardHz > rows.idle.heardHz && near(rows.top.heardHz, rows.top.asked[0] / 2) /* the sub an octave down carries the repeat */ && rows.lifted.rms < rows.top.rms && rows.three.asked.length === 3 && rows.squeal.rms > rows.mid.rms * 0.9;
    return { pass: ok, detail: rows };
  },
};

const frameTime = {
  id: 'racer-frame-time',
  expect: 'pass',
  async run(dc) {
    // the door: every frame of the dip into the race, as room-entry-budget times a door
    const s = await garage(dc);
    s.interaction.items.get('race:test').onUse();
    let doorMax = 0;
    for (let i = 0; i < 200 && !(dc.scene() && dc.scene().sys.settings.key === 'Race' && dc.scene().race); i++) {
      const t0 = performance.now();
      dc.step(1);
      doorMax = Math.max(doorMax, performance.now() - t0);
      await new Promise((res) => setTimeout(res, 0));
    }
    const r = dc.scene();
    {
      const t0 = performance.now();
      dc.step(1);
      doorMax = Math.max(doorMax, performance.now() - t0);
    }
    r.race.t = 0.5;
    r.race.launchTried = true;
    Object.assign(r.race.jo, { v: 34, d: 100 });
    dc.hold('right');
    const times = [];
    // the same measure as SPEED_REPORT: the wait on a 1-pixel read after the frame is
    // included, and the real draw calls are counted, so the frame is known to have been drawn
    const gl = window.game.renderer.gl;
    const px1 = new Uint8Array(4);
    let draws = 0;
    const drawArrays = gl.drawArrays;
    gl.drawArrays = function (...a) {
      draws += 1;
      return drawArrays.apply(this, a);
    };
    for (let i = 0; i < 600; i++) {
      // keep the road busy: both cars on screen, the slingshot's lines on half the time
      if (i % 200 === 0) {
        Object.assign(r.race.jo, { d: 100, v: 34 });
        Object.assign(r.race.rivals[0], { d: 106, v: 33, y: 0, lane: 0 });
      }
      r.race.jo.slingT = i % 200 < 100 ? 1 : 0;
      const t0 = performance.now();
      dc.step(1);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);
      times.push(performance.now() - t0);
      if (i % 60 === 0) await new Promise((res) => setTimeout(res, 0));
    }
    gl.drawArrays = drawArrays;
    dc.releaseAll();
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const list = r.sys.displayList.getChildren();
    const pack = r.textures.get('cars').source[0];
    const racerPacks = packsFor('racer').map((p) => p.key);
    const rows = {
      frames: times.length,
      avgMs: +avg.toFixed(2),
      p95Ms: +times[Math.floor(times.length * 0.95)].toFixed(2),
      maxMs: +times[times.length - 1].toFixed(2),
      budgetMs: 16.67,
      objects: list.length,
      drawsPerFrame: +(draws / times.length).toFixed(1),
      doorWorstMs: +doorMax.toFixed(1),
      doorBudgetMs: BUDGET.doorFrameMs,
      carsPackMB: +((pack.width * pack.height * 4) / 1048576).toFixed(2),
      racerPacks,
    };
    return { pass: rows.avgMs < 16.67 && rows.p95Ms < 16.67 && rows.drawsPerFrame > 0 && rows.doorWorstMs <= BUDGET.doorFrameMs && racerPacks.includes('cars'), detail: rows };
  },
};

const platform = {
  id: 'racer-platform',
  expect: 'pass',
  async run(dc) {
    clearRun('racer');
    dc.warp('hub');
    await until(dc, () => dc.scene() && dc.scene().trains && dc.scene().trains.racer);
    await dc.run(10);
    const s = dc.scene();
    const t = s.trains.racer;
    const rows = {};
    rows.bay = BAYS[bayIndex(10)];
    rows.g = BAYS[bayIndex('G')];
    rows.train = { x0: t.x0, state: t.state, out: t.outOfService, gate: t.gateX };
    rows.row = s.board.rows.find((x) => x.platform === 10);
    rows.lastRow = s.board.rows.find((x) => x.platform === 'G').title;
    rows.running = runningCount();
    rows.caught = caughtRunning({ dreams: { racer: true } });
    rows.turnstile = s.obj('turnstile').wx;
    // the real door: walk up, [E], "Board this train"
    const show = s.dialog.show.bind(s.dialog);
    let asked = null;
    s.dialog.show = (entries) => {
      asked = entries[0];
      return Promise.resolve('board');
    };
    s.player.setPosition(t.gateX - 10, s.player.y);
    await dc.run(20);
    rows.prompt = hud.s.prompt.text;
    await s.board_(s.save && t && (await import('../../data/dreams.js')).dreamById('racer'));
    s.dialog.show = show;
    rows.asked = asked && asked.text.slice(0, 30);
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Intro', 900);
    rows.intro = dc.scene().sys.settings.key;
    await dc.run(30);
    dc.press('interact', 3);
    dc.press('action', 3);
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Dream' && dc.scene().dreamId === 'racer' && dc.scene().F, 900);
    rows.dream = dc.scene().dreamId;
    rows.room = dc.scene().roomId;
    await dc.run(30);
    rows.objective = hud.s.objective;
    return { pass: rows.bay === 155 && rows.g === 148 && rows.row.status === 'BOARDING' && !rows.train.out && rows.running === 7 && rows.caught === 0 && rows.turnstile > rows.train.gate + 100 && rows.intro === 'Intro' && rows.dream === 'racer' && rows.room === 'garage', detail: rows };
  },
};

// put the rival `lengths` of clear road ahead of Jo, both at the same speed, same lane
const setGap = (race, lengths, dy = 0) => {
  const rival = race.rivals[0];
  race.jo.v = rival.v = 30;
  Object.assign(rival, { d: race.jo.d + CAR_LEN + lengths * CAR_LEN, prevD: race.jo.d + CAR_LEN + lengths * CAR_LEN, y: race.jo.y + dy, prevY: race.jo.y + dy, lane: race.jo.lane + dy, state: 'run' });
};

const beatState = {
  id: 'racer-beat',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { d: 100, v: 30 });
    const race = r.race;
    race.track = { ...race.track, bends: [], obstacles: [] };
    race.obstacles = [];
    const read = async (lengths, dy = 0) => {
      setGap(race, lengths, dy);
      await dc.run(2);
      const e = r.engine.state();
      const [jo, rv] = e.voices;
      const a = [];
      for (let i = 0; i < 12; i++) {
        setGap(race, lengths, dy);
        await dc.run(1);
        a.push(+r.airStreaks[0].alpha.toFixed(3));
      }
      return { hz: r.air.hz, asked: +(rv.freq - jo.freq).toFixed(2), joDetune: jo.detune, flutter: jo.flutter, wave: r.air.wave, alphaSpread: +(Math.max(...a) - Math.min(...a)).toFixed(3), shown: r.airStreaks[0].visible, beat: e.beat && e.beat.hz };
    };
    const slot = (TUNE.draftNear + TUNE.draftFar) / 2;
    const rows = { slot: await read(slot), edge: await read(TUNE.draftFar), near: await read(TUNE.draftNear), wide: await read(5.5), lane: await read(slot, 1) };
    setGap(race, 40);
    await dc.run(3);
    rows.far = { shown: r.airStreaks[0].visible, beat: r.engine.state().beat };
    const close = (a, b) => Math.abs(a - b) < 0.01;
    const pass = rows.slot.hz === 0 && close(rows.slot.asked, 0) && rows.slot.wave === 0 && rows.slot.alphaSpread === 0 && rows.slot.shown && rows.slot.joDetune === 0 && rows.slot.flutter === 0
      && close(rows.edge.hz, rows.edge.asked) && rows.edge.hz > 3 && rows.edge.wave > 0 && rows.edge.alphaSpread > 0
      && rows.near.hz > 3 && rows.wide.hz > rows.edge.hz && rows.lane.hz > rows.edge.hz && !rows.far.shown && rows.far.beat === null;
    return { pass, detail: rows };
  },
};

// the depth of the slow throb in a rendered signal, and its rate: the loudness over
// windows of 20 ms, the strongest repeat between 0.5 and 12 Hz
function envelopeBeat(d, rate) {
  const w = Math.floor(rate * 0.02);
  const env = [];
  for (let i = 0; i + w < d.length; i += w) {
    let s = 0;
    for (let j = 0; j < w; j++) s += d[i + j] * d[i + j];
    env.push(Math.sqrt(s / w));
  }
  const mean = env.reduce((a, b) => a + b, 0) / env.length;
  let bestHz = 0;
  let bestAmp = 0;
  for (let hz = 0.5; hz <= 12; hz += 0.25) {
    let re = 0;
    let im = 0;
    env.forEach((v, i) => {
      const t = i * 0.02;
      re += (v - mean) * Math.cos(2 * Math.PI * hz * t);
      im += (v - mean) * Math.sin(2 * Math.PI * hz * t);
    });
    const amp = (2 * Math.hypot(re, im)) / env.length;
    if (amp > bestAmp) {
      bestAmp = amp;
      bestHz = hz;
    }
  }
  return { hz: bestHz, depth: +(bestAmp / mean).toFixed(3), rms: +mean.toFixed(4) };
}

const beatOffline = {
  id: 'racer-beat-offline',
  expect: 'pass',
  async run() {
    const render = async (hz) => {
      const rate = 44100;
      const ctx = new OfflineAudioContext(1, rate * 4, rate);
      const e = new EngineSynth({ ctx, dest: ctx.destination });
      const car = (id, dx, closing, base, detune) => ({ id, v: 33, throttle: true, dx, closing, base, detune });
      e.update({ cars: [car('jo', 0, 0, 52, 6), car('roche', 10, 2, 65, 9)], slip: 0, speed: 0, beat: { id: 'roche', hz, hear: 1 } });
      const buf = await ctx.startRendering();
      return envelopeBeat(buf.getChannelData(0).subarray(rate), rate);
    };
    const rows = { still: await render(0), one: await render(1), edge: await render(4), rough: await render(9) };
    const near = (a, b) => Math.abs(a - b) <= 0.5;
    const pass = rows.still.depth < rows.edge.depth / 3 && near(rows.one.hz, 1) && near(rows.edge.hz, 4) && near(rows.rough.hz, 9) && rows.edge.depth > 0.1;
    return { pass, detail: rows };
  },
};

const sightStrip = {
  id: 'racer-sight-strip',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { d: 100, v: 36, lane: 1, y: 1 });
    const race = r.race;
    race.track = { ...race.track, bends: [] };
    race.rivals[0].d = 50; // behind, out of it
    race.obstacles = [{ d: 330, lane: 1, kind: 'cart', gone: false }];
    r.side.filter((s) => s.ob).forEach((s) => (s.ob = race.obstacles[0]));
    dc.hold('right');
    const w = r.hudView.warn[1];
    const rows = { text: r.hudView.warn.every((x) => x.t.type === 'Rectangle'), x: w.g.x, y: w.g.y, laneY: LANE_Y[1] };
    let gapFrames = 0;
    let firstSeen = null;
    let hiddenAt = null;
    let pulseStart = null;
    const scales = [];
    for (let i = 0; i < 400 && race.jo.state === 'run' && race.jo.d < 335; i++) {
      await dc.run(1);
      const dist = 330 - race.jo.d;
      const view = r.viewAhead();
      if (dist <= 160 && firstSeen === null && w.g.visible) firstSeen = +dist.toFixed(1);
      if (w.g.visible) {
        scales.push(w.g.scaleX);
        if (dist / race.jo.v < 1.5 && pulseStart === null) pulseStart = +dist.toFixed(1);
      }
      if (!w.g.visible && firstSeen !== null && hiddenAt === null) hiddenAt = { dist: +dist.toFixed(1), view: +view.toFixed(1), v: +race.jo.v.toFixed(1) };
      if (firstSeen !== null && !w.g.visible && dist > view + 0.5) gapFrames += 1;
    }
    dc.releaseAll();
    const needed = 11.7; // the last press that still clears it, at the top speed (the gamer's arithmetic)
    rows.firstSeen = firstSeen;
    rows.pulseStart = pulseStart;
    rows.hiddenAt = hiddenAt;
    rows.gapFrames = gapFrames;
    rows.grew = scales[scales.length - 1] > scales[0];
    rows.reactionS = +((pulseStart - needed) / 36).toFixed(2);
    return { pass: rows.text && rows.x < 700 && rows.x > 620 && firstSeen > 100 && hiddenAt && hiddenAt.dist > needed && hiddenAt.dist <= hiddenAt.view + 0.5 && gapFrames === 0 && rows.grew && rows.reactionS > 0.8, detail: rows };
  },
};

const again = {
  id: 'racer-again',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc);
    const race = r.race;
    const b = TRACKS.test.bends.find((x) => x.outside === 'wall');
    const rows = {};
    Object.assign(race.jo, { lampD: 700, d: b.from - 2, v: 36, lane: 1, y: 1 });
    race.lampRivals = [{ r: race.rivals[0], d: 790, v: 30, y: 1, lane: 1, finished: null, state: 'run' }];
    // his own Restart from the lamp is his choice: no question on top of it, lost or not
    dc.press('esc', 3);
    await dc.run(3);
    r.pauseMenu.choose('restart');
    await dc.run(3);
    rows.restartQuiet = !r.pauseMenu.isOpen && race.jo.state === 'run' && race.jo.d < 710;
    Object.assign(race.jo, { lampD: 700, d: b.from - 2, v: 36, lane: 1, y: 1, ghost: 0 });
    dc.hold('right');
    await until(dc, () => r.pauseMenu.isOpen, 400);
    dc.releaseAll();
    rows.state = r.pauseMenu.state();
    rows.joState = race.jo.state;
    rows.dark = r.cameras.main.fadeEffect.alpha === 1;
    rows.rivalBack = Math.round(race.rivals[0].d);
    await dc.run(30);
    r.pauseMenu.choose('on');
    await dc.run(90);
    rows.drivenOn = !r.pauseMenu.isOpen && race.jo.state === 'run';
    rows.lit = r.cameras.main.fadeEffect.alpha === 0;
    // Drive on sticks: the next spin does not ask
    Object.assign(race.jo, { d: b.from - 2, v: 36, lane: 1, y: 1, ghost: 0 });
    const spins0 = race.jo.spins;
    dc.hold('right');
    await until(dc, () => race.jo.spins > spins0, 200);
    dc.releaseAll();
    await until(dc, () => race.jo.state === 'run', 500);
    rows.noNag = !r.pauseMenu.isOpen;
    // and one choice is a new race
    r.askAgain();
    await dc.run(30);
    const tries0 = (getRun('racer').flags || {})[flagOf('test', 'tries')] || 0;
    r.pauseMenu.choose('again');
    await until(dc, () => dc.scene() && dc.scene().race && dc.scene().race !== race && dc.scene().race.t < 0, 200);
    rows.fresh = dc.scene().race.jo.d === 0 && dc.scene().race.jo.spins === 0;
    rows.tried = (getRun('racer').flags || {})[flagOf('test', 'tries')] - tries0;
    return { pass: rows.restartQuiet && rows.state.title === 'Again?' && rows.state.items[0] === 'again' && rows.joState === 'reset' && rows.dark && rows.rivalBack < 800 && rows.drivenOn && rows.lit && rows.noNag && rows.fresh && rows.tried === 1, detail: rows };
  },
};

const spinPause = {
  id: 'racer-spin-pause',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc);
    const race = r.race;
    race.track = { ...race.track, passPlace: undefined }; // (this one is about the dark, not the question)
    const b = TRACKS.test.bends.find((x) => x.outside === 'wall');
    Object.assign(race.jo, { lampD: 700, d: b.from - 2, v: 36, lane: 1, y: 1 });
    dc.hold('right');
    await until(dc, () => race.jo.state === 'spin', 200);
    dc.releaseAll();
    await dc.run(30);
    const rows = {};
    dc.press('esc', 3);
    await dc.run(3);
    rows.open = r.pauseMenu.isOpen;
    const t0 = race.jo.stateT;
    await dc.run(180); // long past when the old timer would have faded
    rows.notFadedInPause = r.cameras.main.fadeEffect.alpha === 0;
    rows.held = race.jo.stateT === t0;
    rows.noRestart = !r.pauseMenu.state().items.includes('restart');
    r.pauseMenu.choose('resume');
    await dc.run(2);
    rows.stillSpinning = race.jo.state === 'spin' && race.jo.d > 800;
    const backAt = await until(dc, () => race.jo.state === 'run', 500);
    rows.spent = +(race.jo.stateT).toFixed(2);
    rows.back = { frames: backAt, d: Math.round(race.jo.d) };
    await dc.run(40);
    rows.seeing = r.cameras.main.fadeEffect.alpha === 0;
    return { pass: rows.open && rows.notFadedInPause && rows.held && rows.noRestart && rows.stillSpinning && rows.back.d >= 700 && rows.back.d < 720 && rows.seeing, detail: rows };
  },
};

const hitStop = {
  id: 'racer-hit-stop',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { d: 100, v: 30 });
    const race = r.race;
    race.jo.lane = race.jo.y = 1;
    r.holdMs = 80;
    const d0 = race.jo.d;
    dc.press('up', 2);
    await dc.run(2);
    const rows = { moved: race.jo.d - d0, laneInHold: race.jo.lane };
    await dc.run(10);
    rows.lane = race.jo.lane;
    return { pass: rows.lane === 0, detail: rows };
  },
};

const bendVisible = {
  id: 'racer-bend-visible',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { d: 200, v: 24 });
    const race = r.race;
    const atBend = async (b) => {
      Object.assign(race.jo, { d: b.from + 2, v: 20, lane: 1, y: 1 });
      race.rivals[0].d = 10;
      const u0 = r.hudView.speedTx.y;
      await dc.run(60);
      return { side: b.side, scrollY: r.cameras.main.scrollY, far: r.road.layers[0].ts.y - r.road.layers[0].y, near: r.road.layers[2].ts.y - r.road.layers[2].y, verge: r.road.farVerge.y - r.road.horizon, hudStill: r.hudView.speedTx.y === u0, uiCam: r.hudView.speedTx.__ui === r };
    };
    const bends = TRACKS.test.bends;
    const rows = { straw: await atBend(bends[0]), wall: await atBend(bends[2]) };
    return { pass: rows.straw.scrollY < 0 && rows.straw.far > rows.straw.near && rows.straw.near > 0 && rows.wall.scrollY > 0 && rows.wall.far < 0 && rows.wall.verge < 0 && rows.straw.hudStill && rows.straw.uiCam, detail: rows };
  },
};

const hudDiet = {
  id: 'racer-hud-diet',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { d: 100, v: 30 });
    const race = r.race;
    const rows = { levelAt0: hud.s.level, goalAt0: hud.s.objective };
    const grip = () => hud.s.meters.find((m) => m.id === 'grip').visible;
    rows.gripHidden = !grip();
    race.t = 5.2;
    await dc.run(50);
    rows.level = hud.s.level;
    rows.goal = hud.s.objective;
    rows.footer = hud.s.footer;
    const texts = new Set();
    race.jo.lane = race.jo.y = 1;
    race.jo.d = 100;
    for (let i = 0; i < 150; i++) {
      race.rivals[0].d = 10;
      await dc.run(1);
      if (r.hudView.callTx.visible) texts.add(r.hudView.callTx.text);
    }
    rows.calls = [...texts];
    rows.draftLabel = hud.s.meters.find((m) => m.id === 'draft').label;
    race.jo.grip = 0.4;
    await dc.run(2);
    rows.gripShownWhenWorn = grip();
    rows.gripLatched = (race.jo.grip = 0.9, await dc.run(2), grip());
    rows.readability = dc.readability();
    const callOk = rows.calls.length > 0 && rows.calls.every((c) => /(LEFT|RIGHT)/.test(c) && /KM\/H/.test(c));
    return { pass: rows.levelAt0 && rows.goalAt0 && rows.gripHidden && !rows.level && !rows.goal && !rows.footer && callOk && rows.calls.length < 8 && rows.draftLabel === 'DRAFT' && rows.gripShownWhenWorn && rows.gripLatched && !rows.readability.length, detail: rows };
  },
};

const card = {
  id: 'racer-card',
  expect: 'pass',
  async run(dc) {
    const r = await toRace(dc);
    nearLine(r, true);
    Object.assign(r.race.jo, { lifts: 5, rubs: 2, spins: 0, slings: 1, offroads: 0 });
    r.race.launched = true;
    dc.hold('right');
    await until(dc, () => r.pauseMenu.isOpen, 400);
    dc.releaseAll();
    const lines = r.pauseMenu.lines.join(' | ');
    const rows = { win: lines };
    return { pass: /5 times/.test(lines) && /Rubbing the Corsa cost you the most/.test(lines) && /2 rubs/.test(lines) && /1 sling/.test(lines) && /behind you/.test(lines) && /Ottavia's time: 0:44\.5/.test(lines) && !/only twice/.test(lines), detail: rows };
  },
};

const garageLines = {
  id: 'racer-garage-lines',
  expect: 'pass',
  async run(dc) {
    const s = await garage(dc);
    const rows = {};
    for (const id of ['race:rack', 'race:bench']) {
      const it = s.interaction.items.get(id);
      rows[id] = { x: it.x, prompt: it.prompt };
      s.player.setPosition(it.x, s.player.y);
      await dc.run(8);
      rows[id].shown = hud.s.prompt.visible && hud.s.prompt.text;
      const say = s.caption.say;
      s.caption.say = (who, line) => (rows[id].said = line);
      it.onUse();
      s.caption.say = say;
    }
    return { pass: Object.values(rows).every((v) => v.shown && /look/.test(v.shown) && v.said), detail: rows };
  },
};

export default [raceStart, finishReturn, failMessage, failFair, pause, touchDrive, draft, engineOffline, frameTime, platform, beatState, beatOffline, sightStrip, again, spinPause, hitStop, bendVisible, hudDiet, card, garageLines];
