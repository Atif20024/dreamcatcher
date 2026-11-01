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
//   racer-frame-time    work per frame at speed against 16.67 ms
//   racer-platform      platform 10 on the station: its train, its row, boards through the real code; nothing counts it
import { getRun, clearRun, getSave } from '../../utils/save.js';
import { flagOf } from '../../dreams/racer/race/result.js';
import { TRACKS } from '../../dreams/racer/race/tracks.js';
import { packsFor } from '../../art/baked.js';
import { caughtRunning, runningCount } from '../../systems/hubState.js';
import { enableTouch } from '../../ui/TouchControls.js';
import { touchState } from '../../input/touchState.js';
import { hud } from '../../ui/hud.js';
import { BAYS, bayIndex } from '../../data/hub/rooms.js';

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
    const saved0 = !!getRun('racer');
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
    rows.wheelOk = Math.abs(deg - ((race.jo.d / 0.31) * 180) / Math.PI) < 1;
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
    const ok = !saved0 && rows.savedAtDoor && rows.lightsAt < 0 && rows.heldBeforeGo === 0 && rows.moved > 10 && rows.wheelOk && rows.parallax.join() === '0.1,0.35,0.7' && rows.farMoved < rows.roadMoved && rows.lane === 0 && Math.abs(rows.scale - 0.92) < 0.01 && rows.engine.voices.length === 2 && rows.engine.voices[0].freq > 52;
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
    rows.back = { room: s.roomId, resuming: s.resuming, x: Math.round(s.player.x) };
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
    return { pass: rows.savedOnLine.best === 1 && rows.savedOnLine.passed === true && rows.savedOnLine.paid === undefined && rows.notPaidYet && rows.card.items.includes('garage') && rows.back.room === 'garage' && rows.back.resuming && rows.paid === worth && rows.paidAfterContinues === worth && rows.flagSaved === TRACKS.test.prize[1] && rows.coins === TRACKS.test.prize[1], detail: rows };
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
    const b = TRACKS.test.bends[1]; // the wall
    race.jo.lampD = 600;
    race.jo.d = b.from - 2;
    race.jo.v = 36;
    dc.hold('right');
    await until(dc, () => race.jo.state === 'spin', 200);
    const t0 = race.t;
    const backAt = await until(dc, () => race.jo.state === 'run', 400);
    dc.releaseAll();
    const rows = { spent: race.t - t0, frames: backAt, at: race.jo.d, v: race.jo.v, spins: race.jo.spins };
    return { pass: rows.spins === 1 && rows.at >= 600 && rows.at < 603 && rows.spent <= 3.2, detail: rows };
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
    rows.passed = race.jo.d > rival.d;
    rows.rubs = race.jo.rubs;
    dc.releaseAll();
    return { pass: rows.draft === 1 && rows.armed && rows.slings === 1 && rows.gain > 2 && rows.passed && rows.rubs === 0, detail: rows };
  },
};

const frameTime = {
  id: 'racer-frame-time',
  expect: 'pass',
  async run(dc) {
    const r = await rolling(dc, { v: 34, d: 100 });
    dc.hold('right');
    const times = [];
    for (let i = 0; i < 600; i++) {
      // keep the road busy: both cars on screen, the slingshot's lines on half the time
      if (i % 200 === 0) {
        Object.assign(r.race.jo, { d: 100, v: 34 });
        Object.assign(r.race.rivals[0], { d: 106, v: 33, y: 0, lane: 0 });
      }
      r.race.jo.slingT = i % 200 < 100 ? 1 : 0;
      const t0 = performance.now();
      dc.step(1);
      times.push(performance.now() - t0);
      if (i % 60 === 0) await new Promise((res) => setTimeout(res, 0));
    }
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
      carsPackMB: +((pack.width * pack.height * 4) / 1048576).toFixed(2),
      racerPacks,
    };
    return { pass: rows.avgMs < 16.67 && rows.p95Ms < 16.67 && racerPacks.includes('cars'), detail: rows };
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

export default [raceStart, finishReturn, failMessage, failFair, pause, touchDrive, draft, frameTime, platform];
