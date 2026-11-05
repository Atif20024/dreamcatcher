// THE LONG STRAIGHT: the drive and its hand-off, through the real door, the real keys
// and the real save. Silent, as every dev run is: the engine is checked by what it
// asks of the oscillators, not by ear. Race 1 (Pinewood) is what the door opens; the
// flat `test` road has the one rival, the wall and the placeholder gate.
//   racer-race-start    door → Race; lights hold the car; gas moves it; the wheel moves it across the road
//   racer-finish-return the line saves the result before any card; back at the garage it pays once, a Continue does not pay again
//   racer-fail-message  over Aldo's time: the message, no pay, a retry counted, the whisper after three
//   racer-fail-fair     a wall: back at the last lamp, driving, within 3 s
//   racer-pause         Esc stops the road and the engine; resume; restart from the lamp; the menu's way out
//   racer-touch         real touches on the pedals and the slab; a thumb slides across it without lifting
//   racer-draft         behind a rival fills the bar; pull out and the sling fires itself
//   racer-engine-offline the engine's real graph rendered offline: level and pitch, no speakers
//   racer-frame-time    work per frame at speed, full and slow, against the plan's budget; draw calls; the door
//   racer-textures      every race texture's bytes while racing, none after leaving
//   racer-platform      platform 10 on the station: its train, its row, boards through the real code; nothing counts it
//   racer-beat          the draft by state: the two notes and the beat
//   racer-beat-offline  the real graph rendered offline: the beat is in the signal, and stops in the slot (no speakers)
//   racer-again         a lost race asks on the dark frame, one key, and Drive on brings the road back
//   racer-spin-pause    a pause in a spin holds the dark; the lamp is not for sale; no blind driving
//   racer-hit-stop      a press in a hit-stop lands when it ends
//   racer-bend-visible  the road on the screen curves the way the bend goes, far more at 100 m than at 20
//   racer-crest         the crest hides the blind right until the top, and cuts off what stands behind it
//   racer-hud-diet      the static plates go, grip stays hidden, the call has its units and its side
//   racer-card          the result card says what the run did, by the kind of gate
//   racer-garage-lines  the bench and the rack offer their verbs (src/dev/scenarios/racerPlaces.js does them)
import { getRun, clearRun, getSave } from '../../utils/save.js';
import { flagOf } from '../../dreams/racer/race/result.js';
import { CAR_LEN, TUNE } from '../../engines/race.js';
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

// the flat road, with the rival and the wall: the same scene, restarted on it
async function toTest(dc) {
  const r = await toRace(dc);
  r.keepTheme = true;
  r.scene.restart({ track: 'test' });
  await until(dc, () => dc.scene() && dc.scene().race && dc.scene().track.id === 'test' && dc.scene().race !== r.race);
  return dc.scene();
}

const past = (r, jo) => {
  const race = r.race;
  race.t = 0.5;
  race.launchTried = true;
  Object.assign(race.jo, jo);
  if (jo.d !== undefined) race.jo.prevD = jo.d;
};

// past the lights, cars rolling, the scene in charge
async function rolling(dc, jo = {}) {
  const r = await toRace(dc);
  past(r, jo);
  await dc.run(2);
  return r;
}

async function rollingTest(dc, jo = {}) {
  const r = await toTest(dc);
  past(r, jo);
  await dc.run(2);
  return r;
}

// the last few metres: over or under the sheet's time
const nearLine = (r, inTime) => {
  const L = r.track.length;
  r.race.t = inTime ? 28 : 40;
  r.race.launchTried = true;
  Object.assign(r.race.jo, { d: L - 5, prevD: L - 5, lampD: 350, v: 30, x: 0, prevX: 0 });
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
    rows.track = r.track.id;
    rows.savedAtDoor = !!getRun('racer');
    rows.checkpoint = getRun('racer').checkpointLabel;
    const race = r.race;
    rows.lightsAt = race.t;
    dc.hold('up');
    await dc.run(60);
    rows.heldBeforeGo = race.jo.d;
    await until(dc, () => race.t > 0);
    const d0 = race.jo.d;
    await dc.run(120);
    rows.moved = race.jo.d - d0;
    rows.v = race.jo.v;
    rows.squat = r.view.squat;
    // the wheel: across the road, the car still on its mark and the road sliding under it
    const x0 = race.jo.x;
    const roadX0 = r.view.lastStrips.at(-1).x;
    dc.hold('right');
    await dc.run(30);
    rows.steered = race.jo.x - x0;
    rows.carStays = Math.abs(r.view.body.x - 480) <= 12;
    rows.roadSlid = r.view.lastStrips.at(-1).x - roadX0;
    rows.engine = r.engine.state();
    dc.releaseAll();
    rows.readability = dc.readability();
    const ok = rows.track === 'pinewood' && rows.savedAtDoor && rows.checkpoint === 'THE PEREVAL GARAGE' && !rows.readability.length && rows.lightsAt < 0 && rows.heldBeforeGo === 0 && rows.moved > 10 && rows.squat > 0.3 && rows.steered > 0.1 && rows.carStays && rows.engine.voices.length === 1 && rows.engine.voices[0].freq > 52;
    return { pass: ok, detail: { ...rows, engine: rows.engine.voices.length } };
  },
};

const finishReturn = {
  id: 'racer-finish-return',
  expect: 'pass',
  async run(dc) {
    const r = await toRace(dc);
    const wallet0 = getSave().wallet.total;
    nearLine(r, true);
    dc.hold('up');
    await until(dc, () => r.race.result);
    dc.releaseAll();
    await dc.run(1);
    const rows = {};
    // on the line, before any card: the result is in the save, nothing paid yet
    const f = (w) => flagOf('pinewood', w);
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
    const worth = 3 * TRACKS.pinewood.prize[1];
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
    return { pass: rows.savedOnLine.best === 1 && rows.savedOnLine.passed === true && rows.savedOnLine.paid === undefined && rows.notPaidYet && rows.card.items.includes('garage') && rows.back.room === 'garage' && rows.back.resuming && !!rows.back.goal && rows.paid === worth && rows.paidAfterContinues === worth && rows.flagSaved === TRACKS.pinewood.prize[1] && rows.coins === TRACKS.pinewood.prize[1], detail: rows };
  },
};

const failMessage = {
  id: 'racer-fail-message',
  expect: 'pass',
  async run(dc) {
    let r = await toRace(dc);
    const wallet0 = getSave().wallet.total;
    const f = (w) => flagOf('pinewood', w);
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
    rows.chalk = r.view.chalk.length;
    rows.paid = getSave().wallet.total - wallet0;
    return { pass: rows.tries.join() === '1,2,3' && rows.state.items[0] === 'again' && rows.aidNow === true && rows.chalk === TRACKS.pinewood.bends.length && rows.paid === 0 && /kindly/.test(rows.lines.join(' ')) && /0:34\.0/.test(rows.lines.join(' ')), detail: rows };
  },
};

const failFair = {
  id: 'racer-fail-fair',
  expect: 'pass',
  async run(dc) {
    const r = await rollingTest(dc);
    const race = r.race;
    const b = TRACKS.test.bends.find((x) => x.outside === 'wall');
    Object.assign(race.jo, { lampD: 840, d: b.from + 2, prevD: b.from + 2, v: 36, x: 1.2 * b.side, prevX: 1.2 * b.side });
    dc.hold('up');
    await until(dc, () => race.jo.state === 'spin', 200);
    const t0 = race.t;
    const backAt = await until(dc, () => race.jo.state === 'run', 400);
    dc.releaseAll();
    const rows = { spent: race.t - t0, frames: backAt, at: race.jo.d, v: race.jo.v, spins: race.jo.spins };
    return { pass: rows.spins === 1 && rows.at >= 840 && rows.at < 843 && rows.spent <= 3.2, detail: rows };
  },
};

const pause = {
  id: 'racer-pause',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { v: 30, d: 320, x: 0.6, prevX: 0.6 });
    const race = r.race;
    dc.hold('up');
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
    race.jo.lampD = 350;
    race.jo.d = 420;
    r.pauseMenu.choose('restart');
    await dc.run(2);
    rows.lamp = Math.round(race.jo.d);
    dc.releaseAll();
    dc.press('esc', 3);
    await dc.run(3);
    r.pauseMenu.choose('garage');
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Dream' && dc.scene().F);
    rows.garage = dc.scene().sys.settings.key;
    return { pass: rows.open && rows.frozen && rows.silent && rows.resumed && rows.heard === 1 && rows.escCloses && rows.escReopens && rows.lamp >= 350 && rows.lamp < 360 && rows.garage === 'Dream' && rows.items.includes('restartRace') && rows.items.includes('station'), detail: rows };
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
    touch('touchstart', 1, by('up').x, by('up').y);
    await dc.run(60);
    rows.gasV = race.jo.v;
    // the slab with the other, gas still held: left, then a slide across without lifting
    const x0 = race.jo.x;
    touch('touchstart', 2, by('left').x, by('left').y);
    await dc.run(20);
    rows.wentLeft = race.jo.x - x0;
    rows.gasStill = race.jo.throttle;
    const x1 = race.jo.x;
    touch('touchmove', 2, by('right').x, by('right').y);
    await dc.run(20);
    rows.wentRight = race.jo.x - x1;
    // off the plate's edge the thumb still has the wheel; on the dead strip it lets go
    touch('touchmove', 2, by('right').x, L.slab.top - 20);
    await dc.run(3);
    rows.heldOffPlate = r.steer > 0;
    touch('touchmove', 2, L.slab.mid, by('right').y);
    await dc.run(12);
    rows.deadStrip = r.steer;
    touch('touchend', 2, L.slab.mid, by('right').y);
    // a thumb rolls across to BRAKE without lifting
    touch('touchmove', 1, by('down').x, by('down').y);
    await dc.run(30);
    rows.braking = race.jo.braking;
    rows.vBraked = race.jo.v;
    touch('touchend', 1, by('down').x, by('down').y);
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
    return { pass: rows.pad === null && rows.gasV > 8 && rows.wentLeft < -0.05 && rows.wentRight > 0.05 && rows.heldOffPlate && rows.deadStrip === 0 && rows.gasStill && rows.braking && rows.letGo && rows.paused && rows.playHidden && rows.back, detail: rows };
  },
};

const draft = {
  id: 'racer-draft',
  expect: 'pass',
  async run(dc) {
    const r = await rollingTest(dc);
    const race = r.race;
    const rival = race.rivals[0];
    Object.assign(race.jo, { d: 40, prevD: 40, v: 30, x: 0.5, prevX: 0.5 });
    Object.assign(rival, { d: 40 + 3.8 * 3.5, prevD: 40 + 3.8 * 3.5, v: 30, x: 0.5, prevX: 0.5 });
    race.track = { ...race.track, bends: [] };
    dc.hold('up');
    const rows = {};
    let filled = null;
    for (let i = 0; i < 100; i++) {
      await dc.run(1);
      if (filled === null && race.jo.draft >= 1) filled = race.t;
    }
    rows.filledAfter = filled === null ? null : +(filled - 0.5).toFixed(2);
    rows.armed = race.jo.armed;
    rows.hudLabel = hud.s.meters.find((m) => m.id === 'draft').label;
    const v0 = race.jo.v;
    rows.seen = r.view.pool.filter((p) => p.visible && p.frame.name.startsWith('rear-roche')).length;
    dc.hold('left');
    await dc.run(30);
    dc.releaseAll();
    dc.hold('up');
    rows.slings = race.jo.slings;
    await dc.run(100);
    rows.gain = +(race.jo.v - v0).toFixed(1);
    await dc.run(100);
    rows.passed = race.jo.d > rival.d;
    rows.rubs = race.jo.rubs;
    dc.releaseAll();
    return { pass: rows.filledAfter !== null && rows.armed && rows.slings === 1 && rows.gain > 1 && rows.passed && rows.rubs === 0 && rows.seen === 1, detail: rows };
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
    // (the land, one layer a frame behind the fade)
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      dc.step(1);
      doorMax = Math.max(doorMax, performance.now() - t0);
    }
    r.race.t = 0.5;
    r.race.launchTried = true;
    dc.hold('up');
    const gl = window.game.renderer.gl;
    const px1 = new Uint8Array(4);
    let draws = 0;
    const drawArrays = gl.drawArrays;
    gl.drawArrays = function (...a) {
      draws += 1;
      return drawArrays.apply(this, a);
    };
    // the same measure as SPEED_REPORT: the wait on a 1-pixel read after the frame is included
    const lap = async (slow) => {
      const times = [];
      const sprites = [];
      draws = 0;
      for (let i = 0; i < 480; i++) {
        // up the road and round: the bends, the crest, the busiest stretches
        if (i % 120 === 0) Object.assign(r.race.jo, { d: 40 + (i / 120) * 120, prevD: 40 + (i / 120) * 120, v: 30, x: 0, prevX: 0, grip: 1 });
        r.view.slow = slow;
        const t0 = performance.now();
        dc.step(1);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);
        times.push(performance.now() - t0);
        sprites.push(r.view.stats.sprites);
        if (i % 60 === 0) await new Promise((res) => setTimeout(res, 0));
      }
      times.sort((a, b) => a - b);
      return {
        avgMs: +(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
        p95Ms: +times[Math.floor(times.length * 0.95)].toFixed(2),
        maxMs: +times[times.length - 1].toFixed(2),
        drawsPerFrame: +(draws / times.length).toFixed(1),
        spritesMax: Math.max(...sprites),
      };
    };
    const full = await lap(false);
    const slow = await lap(true);
    gl.drawArrays = drawArrays;
    r.view.slow = false;
    dc.releaseAll();
    const pack = r.textures.get('cars').source[0];
    const racerPacks = packsFor('racer').map((p) => p.key);
    const rows = { full, slow, objects: r.sys.displayList.getChildren().length, doorWorstMs: +doorMax.toFixed(1), doorBudgetMs: BUDGET.doorFrameMs, carsPackMB: +((pack.width * pack.height * 4) / 1048576).toFixed(2), racerPacks };
    return { pass: full.avgMs < 8 && full.p95Ms < 12 && slow.avgMs <= full.avgMs + 1 && slow.spritesMax < full.spritesMax && full.drawsPerFrame > 0 && rows.doorWorstMs <= BUDGET.doorFrameMs && racerPacks.includes('cars'), detail: rows };
  },
};

const textures = {
  id: 'racer-textures',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { d: 60, v: 30 });
    await dc.run(10);
    const bytes = r.view.textureBytes();
    const rows = { bytes, totalMB: +(Object.values(bytes).reduce((a, b) => a + b, 0) / 1048576).toFixed(2) };
    // a restart keeps them, leaving frees them
    r.leaveToStation();
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Hub', 600);
    rows.afterLeaving = dc.scene().textures.getTextureKeys().filter((k) => k.startsWith('race:'));
    return { pass: rows.totalMB < 6 && Object.keys(bytes).length >= 3 && rows.afterLeaving.length === 0, detail: rows };
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

// put the rival `lengths` of clear road ahead of Jo, both at the same speed; dx across the road
const setGap = (race, lengths, dx = 0) => {
  const rival = race.rivals[0];
  race.jo.v = rival.v = 30;
  const d = race.jo.d + CAR_LEN + lengths * CAR_LEN;
  Object.assign(rival, { d, prevD: d, x: race.jo.x + dx, prevX: race.jo.x + dx, state: 'run' });
};

const beatState = {
  id: 'racer-beat',
  expect: 'pass',
  async run(dc) {
    const r = await rollingTest(dc, { d: 40, v: 30 });
    const race = r.race;
    race.track = { ...race.track, bends: [], obstacles: [] };
    race.obstacles = [];
    const read = async (lengths, dx = 0) => {
      setGap(race, lengths, dx);
      await dc.run(2);
      const e = r.engine.state();
      const [jo, rv] = e.voices;
      return { hz: e.beat && e.beat.hz, asked: rv ? +(rv.freq - jo.freq).toFixed(2) : null, joDetune: jo.detune, flutter: jo.flutter };
    };
    const slot = (TUNE.draftNear + TUNE.draftFar) / 2;
    const rows = { slot: await read(slot), edge: await read(TUNE.draftFar), near: await read(TUNE.draftNear), wide: await read(5.5), line: await read(slot, 0.4) };
    setGap(race, 40);
    await dc.run(3);
    rows.far = { beat: r.engine.state().beat };
    const close = (a, b) => Math.abs(a - b) < 0.01;
    const pass = rows.slot.hz === 0 && close(rows.slot.asked, 0) && rows.slot.joDetune === 0 && rows.slot.flutter === 0 && close(rows.edge.hz, rows.edge.asked) && rows.edge.hz > 3 && rows.near.hz > 3 && rows.wide.hz > rows.edge.hz && rows.line.hz > rows.edge.hz && rows.far.beat === null;
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

const again = {
  id: 'racer-again',
  expect: 'pass',
  async run(dc) {
    const r = await rollingTest(dc);
    const race = r.race;
    const b = TRACKS.test.bends.find((x) => x.outside === 'wall');
    const rows = {};
    const atWall = { lampD: 840, d: b.from + 2, prevD: b.from + 2, v: 36, x: 1.2 * b.side, prevX: 1.2 * b.side, ghost: 0 };
    Object.assign(race.jo, atWall);
    race.lampRivals = [{ r: race.rivals[0], d: 1000, v: 30, x: 0.5, finished: null, state: 'run' }];
    // his own Restart from the lamp is his choice: no question on top of it, lost or not
    dc.press('esc', 3);
    await dc.run(3);
    r.pauseMenu.choose('restart');
    await dc.run(3);
    rows.restartQuiet = !r.pauseMenu.isOpen && race.jo.state === 'run' && race.jo.d < 850;
    Object.assign(race.jo, atWall);
    dc.hold('up');
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
    Object.assign(race.jo, atWall);
    const spins0 = race.jo.spins;
    dc.hold('up');
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
    return { pass: rows.restartQuiet && rows.state.title === 'Again?' && rows.state.items[0] === 'again' && rows.joState === 'reset' && rows.dark && rows.rivalBack < 1040 && rows.drivenOn && rows.lit && rows.noNag && rows.fresh && rows.tried === 1, detail: rows };
  },
};

const spinPause = {
  id: 'racer-spin-pause',
  expect: 'pass',
  async run(dc) {
    const r = await rollingTest(dc);
    const race = r.race;
    race.track = { ...race.track, gate: undefined }; // (this one is about the dark, not the question)
    const b = TRACKS.test.bends.find((x) => x.outside === 'wall');
    Object.assign(race.jo, { lampD: 840, d: b.from + 2, prevD: b.from + 2, v: 36, x: 1.2 * b.side, prevX: 1.2 * b.side });
    dc.hold('up');
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
    rows.stillSpinning = race.jo.state === 'spin' && race.jo.d > b.from;
    const backAt = await until(dc, () => race.jo.state === 'run', 500);
    rows.spent = +(race.jo.stateT).toFixed(2);
    rows.back = { frames: backAt, d: Math.round(race.jo.d) };
    await dc.run(40);
    rows.seeing = r.cameras.main.fadeEffect.alpha === 0;
    return { pass: rows.open && rows.notFadedInPause && rows.held && rows.noRestart && rows.stillSpinning && rows.back.d >= 840 && rows.back.d < 860 && rows.seeing, detail: rows };
  },
};

const hitStop = {
  id: 'racer-hit-stop',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { d: 20, v: 30 });
    const race = r.race;
    r.holdMs = 80;
    const d0 = race.jo.d;
    const x0 = race.jo.x;
    dc.hold('right');
    await dc.run(2);
    const rows = { moved: race.jo.d - d0, xInHold: race.jo.x - x0 };
    await dc.run(12);
    rows.x = race.jo.x - x0;
    dc.releaseAll();
    return { pass: rows.moved === 0 && rows.xInHold === 0 && rows.x > 0, detail: rows };
  },
};

const bendVisible = {
  id: 'racer-bend-visible',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { d: 100, v: 24 });
    const race = r.race;
    const atBend = async (b) => {
      race.t = 1;
      Object.assign(race.jo, { d: b.from + 4, prevD: b.from + 4, v: 20, x: 0, prevX: 0 });
      const u0 = r.hudView.speedTx.y;
      await dc.run(3);
      Object.assign(race.jo, { x: 0, prevX: 0 });
      await dc.run(1);
      const strip = (z) => r.view.lastStrips.reduce((best, s) => (Math.abs(s.z - z) < Math.abs(best.z - z) ? s : best));
      return { turn: -b.side, at20: Math.round(strip(20).x - 480), at60: Math.round(strip(60).x - 480), hudStill: r.hudView.speedTx.y === u0, kerbSeg: strip(20).seg.curve !== 0, sprites: r.view.stats.sprites };
    };
    const [first, second] = TRACKS.pinewood.bends;
    const rows = { first: await atBend(first), second: await atBend(second) };
    const goes = (R) => Math.sign(R.at60) === R.turn && Math.abs(R.at60) > 100 && Math.abs(R.at60) > Math.abs(R.at20) * 2;
    return { pass: goes(rows.first) && goes(rows.second) && rows.first.hudStill && rows.first.kerbSeg, detail: rows };
  },
};

const crest = {
  id: 'racer-crest',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { d: 400, v: 30 });
    const race = r.race;
    const blind = TRACKS.pinewood.bends[2];
    const rows = {};
    const look = async (d) => {
      race.t = 1;
      Object.assign(race.jo, { d, prevD: d, v: 5, x: 0, prevX: 0 });
      await dc.run(2);
      const inBend = r.view.lastStrips.filter((s) => s.seg.d >= blind.from && s.seg.d < blind.to);
      return { strips: inBend.length, shown: inBend.filter((s) => s.visible).length, cut: r.view.pool.filter((p) => p.visible && p.wasCut).length };
    };
    rows.before = await look(470);
    rows.top = await look(blind.from - 20);
    return { pass: rows.before.strips > 0 && rows.before.shown === 0 && rows.before.cut > 0 && rows.top.shown > 3, detail: rows };
  },
};

const hudDiet = {
  id: 'racer-hud-diet',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { d: 20, v: 30 });
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
    Object.assign(race.jo, { d: 20, prevD: 20, x: 0, prevX: 0 });
    for (let i = 0; i < 150; i++) {
      await dc.run(1);
      if (r.hudView.callTx.visible) texts.add(r.hudView.callTx.rawText);
    }
    rows.calls = [...texts];
    rows.clock = hud.s.coins;
    race.jo.grip = 0.4;
    await dc.run(2);
    rows.gripShownWhenWorn = grip();
    rows.gripLatched = (race.jo.grip = 0.9, await dc.run(2), grip());
    rows.readability = dc.readability();
    const callOk = rows.calls.length > 0 && rows.calls.every((c) => /(LEFT|RIGHT|BRAKE)/.test(c));
    return { pass: /Aldo/.test(rows.goalAt0) && rows.levelAt0 && rows.gripHidden && !rows.level && !rows.goal && !rows.footer && callOk && rows.calls.length < 8 && rows.gripShownWhenWorn && rows.gripLatched && !rows.readability.length, detail: rows };
  },
};

const card = {
  id: 'racer-card',
  expect: 'pass',
  async run(dc) {
    // a time gate: the sheet, in Ottavia's words, and the seat
    const p = await toRace(dc);
    nearLine(p, true);
    dc.hold('up');
    await until(dc, () => p.pauseMenu.isOpen, 400);
    dc.releaseAll();
    const seat = p.pauseMenu.lines.join(' | ');
    const title = p.pauseMenu.state().title;
    // a place gate, with the rival on the road
    p.pauseMenu.destroy();
    const r = await toTest(dc);
    const L = r.track.length;
    r.race.t = 40;
    r.race.launchTried = true;
    Object.assign(r.race.jo, { d: L - 5, prevD: L - 5, lampD: 600, v: 30, lifts: 5, rubs: 2, spins: 0, slings: 1, offroads: 0 });
    r.race.rivals[0].d = L - 80;
    r.race.launched = true;
    dc.hold('up');
    await until(dc, () => r.pauseMenu.isOpen, 400);
    dc.releaseAll();
    const lines = r.pauseMenu.lines.join(' | ');
    const rows = { seat, title, win: lines };
    return { pass: /seat is yours/.test(seat) && /Aldo's time: 0:34\.0/.test(seat) && !/^P/.test(title) && /5 times/.test(lines) && /2 rubs/.test(lines) && /1 sling/.test(lines) && /behind you/.test(lines) && /Ottavia's time: 0:44\.5/.test(lines) && !/only twice/.test(lines), detail: rows };
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
      s.player.setPosition(it.x, s.player.y);
      await dc.run(8);
      rows[id] = { prompt: it.prompt, shown: hud.s.prompt.visible && hud.s.prompt.text };
    }
    return { pass: /tyres/.test(rows['race:rack'].shown) && /tune/.test(rows['race:bench'].shown), detail: rows };
  },
};

export default [raceStart, finishReturn, failMessage, failFair, pause, touchDrive, draft, engineOffline, frameTime, textures, platform, beatState, beatOffline, again, spinPause, hitStop, bendVisible, crest, hudDiet, card, garageLines];
