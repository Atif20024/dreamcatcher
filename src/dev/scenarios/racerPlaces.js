// THE LONG STRAIGHT, stage 2: the coast and the walk-in places, each room's goal
// and fail state through its real [E], the choice and its payoff. Silent, as every
// dev run is.
//   racer-tune          a real hold: the fumes throb, go still in the slot, a miss and a flood; hot without it
//   racer-shop          the rack and the bench: nuts buy tyres and chalk, into the car's tune, never its speed
//   racer-season        each door opens on its flag; the shutter says why not; the door counts for the race due
//   racer-choice        keep or give the tyres: the corridor says different lines, the Heron differs
//   racer-cup-morning   after the stand-in for the Cup: Nino's word, Aldo gone, his gloves to take
//   racer-corridor      a real climb; a drop off the iron stairs sends Jo back; the gloves go on the chair
//   racer-kitchen       the tin, the jars, the fail: short the rent and she says nothing; the rack's price moves
//   racer-sponsor       three papers: struck or whole, what it pays and what it binds
//   racer-chalk         the marks in order; the washout is back to the lamp
//   racer-pit           the drill: a miss too many is again; a clean stop hands on to the Coppa
//   racer-rooms         every place: objective, card, music, under budget, no text rule broken
//   racer-contrast      Jo at 3:1 or better in every room
//   racer-touch-verbs   TUNE by a real touch on E
//   racer-coins         the dream's budget of nuts is placed
//   racer-quit-window   quit and Continue during the talk that follows a verb: the story's flag is already saved
//   racer-tragedy       the Harbour: no finish, whatever Jo does; the lamp goes dark; the morning after, the gloves
//   racer-finale-brake  the Coppa through the real door: stop for Roche, 6 s, win, the crew, the note, CAUGHT
//   racer-finale-pass   the same, driving by him
//   racer-coppa-again   second at the Coppa is "again": nothing ends, the door still opens
//   racer-quit-anywhere quit to the garage and the station from the grid, the dark, the pit, the choice
//   racer-old-save      runs with done_race3..5 from the stand-in days continue, through real doors
//   racer-length        the tidy bot's four races, in race seconds
//   racer-flow-keep     the whole season from the bench to the ending, through real doors: one set of choices
//   racer-flow-give     the same with the other choices
// Where RaceScene does not yet end race 2 or save the script's flags (the view's stage D),
// these do it for it, and say so in `detail.sceneMissed`: they test the rooms, not that.
import { clearRun, getRun, getSave, updateSave } from '../../utils/save.js';
import { hud } from '../../ui/hud.js';
import { dreamById } from '../../data/dreams.js';
import { TRACKS } from '../../dreams/racer/race/tracks.js';
import { TUNE } from '../../engines/race.js';
import { HOOKS, doneOf, softPrice, PRICES, nextHook, endingLines, slateRows } from '../../dreams/racer/season.js';
import { tidy, coppaBot, runRace } from '../../../tests/raceBots.js';
import { SOFT_TYRES } from '../../dreams/racer/race/car.js';
import { LOOPS } from '../../audio/synthLoops.js';
import { joContrast } from '../identityProbe.js';
import { auditText } from '../readability.js';
import { BUDGET } from '../../core/PerfBudget.js';
import { enableTouch } from '../../ui/TouchControls.js';
import { touchState } from '../../input/touchState.js';

const T = 32;
const ROOMS = ['garage', 'quay', 'hospital', 'kitchen', 'sponsor', 'nightbefore', 'pitlane'];
const until = async (dc, test, max = 400) => {
  for (let i = 0; i < max; i++) {
    if (test()) return i;
    await dc.run(1);
    await new Promise((r) => setTimeout(r, 0));
  }
  return -1;
};

async function at(dc, room, flags = {}) {
  clearRun('racer');
  dc.warp('racer', room);
  await until(dc, () => {
    const s = dc.scene();
    return s && s.sys.settings.key === 'Dream' && s.def && s.def.id === 'racer' && s.interaction && s.roomId === room;
  });
  await dc.run(10);
  const s = dc.scene();
  Object.assign(s.F, flags);
  s.invulnUntil = Infinity;
  await dc.run(2);
  return s;
}

// stand Jo at a thing and press its [E] for real
async function pressAt(dc, s, id) {
  const it = s.interaction.items.get(id);
  const pos = typeof it.at === 'function' ? it.at() : it;
  s.player.setPosition(pos.x, it.y !== undefined && !it.at ? s.player.y : s.player.y);
  s.player.body.reset(pos.x, s.player.y);
  await dc.run(4);
  const shown = s.interaction.current && s.interaction.current.id;
  dc.press('KeyE', 2);
  await dc.run(2);
  return shown;
}

// walk a scene box: `pick` chooses by choice text; returns everything it said
async function talkThrough(dc, s, pick = null) {
  const said = [];
  for (let i = 0; i < 400 && s.sceneBox.active; i++) {
    const b = s.sceneBox;
    const n = b.runner && b.runner.node;
    if (n && said[said.length - 1] !== n.text) said.push(n.text);
    if (n && n.choices && b.runner.choices().length) {
      const ch = b.runner.choices();
      const idx = pick ? Math.max(0, ch.findIndex((c) => pick.test(c.text))) : 0;
      said.push(`> ${ch[idx].text}`);
      for (let k = 0; k < 60 && !b.choosing; k++) {
        dc.press('Enter', 2);
        await dc.run(10);
      }
      b.choiceIdx = idx;
      dc.press('Enter', 2);
      await dc.run(8);
      continue;
    }
    dc.press('Enter', 2);
    await dc.run(12);
  }
  return said;
}

const live = new Map();
function touch(type, id, gx, gy) {
  const canvas = window.game.canvas;
  const b = touchState.controls.rect();
  const t = new Touch({ identifier: id, target: canvas, clientX: b.left + (gx / 960) * b.width, clientY: b.top + (gy / 540) * b.height, radiusX: 8, radiusY: 8, force: 1 });
  if (type === 'touchend') live.delete(id);
  else live.set(id, t);
  canvas.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: [...live.values()], targetTouches: [...live.values()], changedTouches: [t] }));
}

const tuneVerb = {
  id: 'racer-tune',
  expect: 'pass',
  async run(dc) {
    const s = await at(dc, 'garage');
    const rows = {};
    rows.goal = hud.s.objective;
    rows.prompt = await pressAt(dc, s, 'race:bench');
    await until(dc, () => s.encounters.busy, 40);
    await dc.run(20); // (the encounter's 250 ms before it hears a key)
    dc.hold('KeyE');
    const engine = () => s.encounters.active.engine;
    await dc.run(30);
    const p = s.tunePresenter;
    rows.far = { hz: +p.last.hz.toFixed(1), still: p.last.still, wave: +p.last.wave.toFixed(1) };
    // into the slot
    await until(dc, () => engine().state().hz === 0, 400);
    rows.slot = { still: (await dc.run(1), s.tunePresenter.last.still), wave: s.tunePresenter.last.wave };
    // past it, let go: a miss, and the next hold turns it back
    await until(dc, () => engine().state().hz > 2, 200);
    const say = s.caption.say;
    let said = null;
    s.caption.say = function (w, t, o) {
      said = t;
      return say.call(this, w, t, o);
    };
    dc.release('KeyE');
    await dc.run(3);
    s.caption.say = say;
    rows.miss = engine().state().misses;
    rows.slotWider = engine().state().slot > 0.06;
    rows.pastLine = said;
    dc.hold('KeyE');
    await until(dc, () => engine().state().hz === 0, 300);
    dc.release('KeyE');
    await until(dc, () => !s.encounters.busy, 120);
    await dc.run(5);
    rows.tuned = !!s.F.tuned;
    rows.goalAfter = hud.s.objective;
    // the room hears it: the idle's own beat is gone
    const idle = s.graph.room('garage').data.ambience;
    rows.idle = { beating: idle({}), tuned: idle(s.F), known: !!LOOPS[idle(s.F)] };
    // the flood, on the engine's own terms
    const t = s.def.encounters.tune.engine({});
    t.press();
    for (let i = 0; i < 400; i++) t.update(16);
    rows.flood = t.state().floods;
    // walking away with her beating: the race says so, and only says
    const s2 = await at(dc, 'garage');
    s2.interaction.items.get('race:test').onUse();
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Race' && dc.scene().race);
    const r = dc.scene();
    await dc.run(2);
    rows.hot = { hot: r.hot, meter: !!r.heat, vMax: r.race.tune.vMax };
    const ok = rows.slotWider && /Past it/.test(rows.pastLine) && rows.idle.beating === 'pv_garage' && rows.idle.tuned === 'pv_garage_tuned' && rows.idle.known && rows.far.hz > 1 && !rows.far.still && rows.far.wave > 0 && rows.slot.still && rows.slot.wave === 0 && rows.miss === 1 && rows.tuned && rows.flood >= 1 && rows.hot.hot && rows.hot.meter && rows.hot.vMax === 36;
    return { pass: ok, detail: rows };
  },
};

const shop = {
  id: 'racer-shop',
  expect: 'pass',
  async run(dc) {
    const s = await at(dc, 'garage', { tuned: true });
    const rows = {};
    // Aldo's offer first: a rich man still cannot buy the set out from under it
    s.levelCoins = 99;
    await pressAt(dc, s, 'race:rack');
    await until(dc, () => s.sceneBox.active, 30);
    rows.beforeOffer = await talkThrough(dc, s, /Buy/);
    rows.heldForAldo = !s.F.tyre_soft && s.levelCoins === 99 && rows.beforeOffer.some((t) => /Aldo's/.test(t));
    s.F.tyres_settled = true;
    // short of the price: no buy offered
    s.levelCoins = 3;
    rows.promptRack = await pressAt(dc, s, 'race:rack');
    await until(dc, () => s.sceneBox.active, 30);
    rows.short = await talkThrough(dc, s);
    rows.stillStock = !s.F.tyre_soft;
    // now with the money, through the real choice
    const wallet = () => dc.save ? dc.save().wallet : null;
    s.levelCoins = PRICES.soft + PRICES.chalk;
    await pressAt(dc, s, 'race:rack');
    await until(dc, () => s.sceneBox.active, 30);
    rows.buyTyres = await talkThrough(dc, s, /Buy/);
    rows.afterTyres = { soft: !!s.F.tyre_soft, nuts: s.levelCoins };
    rows.promptBench = await pressAt(dc, s, 'race:bench');
    await until(dc, () => s.sceneBox.active, 30);
    rows.buyChalk = await talkThrough(dc, s, /Buy/);
    rows.afterChalk = { chalk: !!s.F.buy_chalk, nuts: s.levelCoins };
    void wallet;
    // into the car: grip's floor and the chalk marks, and nothing that goes faster
    s.interaction.items.get('race:test').onUse();
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Race' && dc.scene().race);
    const r = dc.scene();
    await dc.run(2);
    const t = r.race.tune;
    rows.tune = { gripMin: t.gripMin, chalk: t.chalk, vMax: t.vMax, accel: t.accel, brake: t.brake };
    rows.chalkMarks = r.view.chalk.length;
    rows.aid = r.aid;
    const ok = rows.heldForAldo && rows.stillStock && rows.afterTyres.soft && rows.afterTyres.nuts === PRICES.chalk && rows.afterChalk.chalk && rows.afterChalk.nuts === 0 && t.gripMin === SOFT_TYRES.gripMin && t.chalk && t.vMax === 36 && t.accel === 8.5 && t.brake === 8 && rows.chalkMarks === r.track.bends.length && !rows.aid;
    return { pass: ok, detail: rows };
  },
};

const season = {
  id: 'racer-season',
  expect: 'pass',
  async run(dc) {
    const s = await at(dc, 'quay');
    const rows = { doors: {} };
    const locked = async (id) => {
      const it = s.interaction.items.get(`door:${id}`);
      await dc.run(1);
      return it.prompt;
    };
    const DOORS = ['quay>kitchen', 'quay>sponsor', 'quay>hospital', 'quay>pit', 'quay>gull'];
    rows.doors.start = await Promise.all(DOORS.map(locked));
    Object.assign(s.F, { done_race2: true });
    await dc.run(2);
    rows.doors.afterCup = await locked('quay>hospital');
    Object.assign(s.F, { gloves_left: true });
    await dc.run(2);
    rows.doors.afterChair = await locked('quay>kitchen');
    rows.doors.sableShut = await locked('quay>sponsor');
    Object.assign(s.F, { jars_done: true });
    await dc.run(2);
    rows.doors.afterJars = await locked('quay>sponsor');
    rows.doors.coppaShut = [await locked('quay>pit'), await locked('quay>gull')];
    Object.assign(s.F, { garage_again: true });
    await dc.run(2);
    rows.doors.afterQuestion = [await locked('quay>pit'), await locked('quay>gull')];
    // the shutter says why not, and stays down
    const n = await at(dc, 'garage', { tuned: true, done_race1: true });
    const say = n.caption.say;
    let said = null;
    n.caption.say = function (w, t, o) {
      said = t;
      return say.call(this, w, t, o);
    };
    n.interaction.items.get('race:test').onUse();
    await dc.run(5);
    n.caption.say = say;
    rows.shutter = { said, scene: dc.scene().sys.settings.key };
    // the door counts for the hook, at the line: through the real door and the real finish
    const g = await at(dc, 'garage', { tuned: true });
    g.interaction.items.get('race:test').onUse();
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Race' && dc.scene().race);
    const r = dc.scene();
    r.race.t = 28;
    r.race.launchTried = true;
    r.race.jo.d = r.track.length - 5;
    r.race.jo.lampD = 600;
    r.race.jo.v = 30;
    dc.hold('up');
    await until(dc, () => r.race.result);
    dc.releaseAll();
    await dc.run(1);
    const saved = getRun('racer').flags;
    rows.line = { done: saved[doneOf(HOOKS[0].id)], pending: saved.season_pending };
    const ok = rows.doors.start.every((p) => !/^(in|up|through|walk)/.test(p)) && /quietly/.test(rows.doors.afterCup) && /Castellanes/.test(rows.doors.afterChair) && /appointment/.test(rows.doors.sableShut) && /Sable/.test(rows.doors.afterJars) && /shut/.test(rows.doors.coppaShut[0]) && /through/.test(rows.doors.afterQuestion[0]) && /walk/.test(rows.doors.afterQuestion[1]) && /Aldo/.test(rows.shutter.said) && rows.shutter.scene === 'Dream' && rows.line.done === true && rows.line.pending === undefined;
    return { pass: ok, detail: rows };
  },
};

const choice = {
  id: 'racer-choice',
  expect: 'pass',
  async run(dc) {
    const out = {};
    for (const [name, pick] of [['keep', /take them/], ['give', /your car/]]) {
      const s = await at(dc, 'garage', { tuned: true, done_race1: true });
      s.runConversation('aldo_tyres', null);
      await dc.run(3);
      const said = await talkThrough(dc, s, pick);
      const row = { said, soft: !!s.F.tyre_soft, settled: !!s.F.tyres_settled, kept: !!s.F.kept_tyres, gave: !!s.F.gave_tyres };
      s.F.done_race2 = true;
      s.F.cup_told = true;
      s.F['item:gloves'] = true;
      // the same run, the corridor
      s.runConversation('corridor', null);
      await dc.run(3);
      row.corridor = await talkThrough(dc, s, /Say nothing/);
      row.silent = !!s.F.ott_silent;
      // and the garage again, later
      s.runConversation('ottavia_again', null);
      await dc.run(3);
      row.again = await talkThrough(dc, s, /Aldo/);
      for (const id of ['tullio_after', 'nino_after']) {
        s.runConversation(id, null);
        await dc.run(3);
        row[id] = await talkThrough(dc, s);
      }
      out[name] = row;
    }
    const k = out.keep;
    const g = out.give;
    const line = (r, re) => r.some((t) => re.test(t));
    const ok = k.soft && !g.soft && k.settled && g.settled && !line(k.corridor, /bolted them on|your tyres on/) && line(k.again, /grateful/) && k.silent && line(g.tullio_after, /twice/) && line(k.tullio_after, /His were old/) && line(g.nino_after, /Your tyres/) && line(k.nino_after, /His old tyres/);
    return { pass: ok, detail: out };
  },
};

const cupMorning = {
  id: 'racer-cup-morning',
  expect: 'pass',
  async run(dc) {
    const s = await at(dc, 'garage', { tuned: true, done_race1: true, tyres_settled: true });
    const rows = { aldoBefore: !!s.npcs.get('aldo') };
    Object.assign(s.F, { done_race2: true });
    await until(dc, () => s.sceneBox.active, 60);
    rows.said = await talkThrough(dc, s);
    await dc.run(10);
    rows.aldoAfter = !!s.npcs.get('aldo');
    rows.ottaviaAfter = !!s.npcs.get('ottavia');
    rows.goal = hud.s.objective;
    // nobody is at the bench to sell anything until she is back
    const it = s.interaction.items.get('race:bench');
    const say = s.caption.say;
    let line = null;
    s.caption.say = (w, t) => (line = t);
    it.onUse();
    s.caption.say = say;
    rows.benchShut = line;
    // the gloves are there now: walk onto them
    const r = s.graph.room('garage');
    const x = (r.tx + 10) * T + T / 2;
    s.player.setPosition(x, s.player.y);
    s.player.body.reset(x, s.player.y);
    await until(dc, () => s.F['item:gloves'], 40);
    await dc.run(4);
    rows.got = !!s.F['item:gloves'];
    rows.goalAfter = hud.s.objective;
    return { pass: rows.aldoBefore && !rows.aldoAfter && !rows.ottaviaAfter && rows.said.some((t) => /no tail lights/.test(t)) && rows.got && /gloves/.test(rows.goal) && /hospital/.test(rows.goalAfter) && !!rows.benchShut, detail: rows };
  },
};

const corridor = {
  id: 'racer-corridor',
  expect: 'pass',
  async run(dc) {
    const s = await at(dc, 'hospital');
    const rows = { goal: hud.s.objective, walks: s.player.walkByDefault };
    const r = s.graph.room('hospital');
    // up on the top flight, then off it: the corridor hears
    const put = (col, row) => {
      const x = (r.tx + col) * T + T / 2;
      const y = (r.ty + row) * T - 22;
      s.player.setPosition(x, y);
      s.player.body.reset(x, y);
    };
    put(29, 10);
    await dc.run(10);
    rows.upThere = !!s.player.body.blocked.down;
    put(35, 10); // past the flight's end, in the air over the bottom corridor
    await until(dc, () => s.F.ward_noise, 120);
    rows.noise = s.F.ward_noise;
    await dc.run(70);
    await until(dc, () => !s.cameras.main.fadeEffect.isRunning, 60);
    const col = Math.floor(s.player.x / T) - r.tx;
    rows.backAt = col;
    rows.hearts = s.hearts !== undefined ? s.hearts : null;
    // the stairs one hop at a time make no noise
    const n0 = s.F.ward_noise;
    put(34, 17);
    await dc.run(10);
    put(33, 19);
    await dc.run(20);
    rows.quietDrop = s.F.ward_noise === n0;
    // the climb, on the real keys and at a walk: bottom corridor to the landing, no noise
    put(35, 19);
    await dc.run(8);
    const n1 = s.F.ward_noise;
    const hop = async (dir, want) => {
      dc.hold('jump');
      if (dir) dc.hold(dir);
      await until(dc, () => Math.floor((s.player.y + 22) / T) - r.ty <= want && s.player.body.blocked.down, 90);
      dc.releaseAll();
      await dc.run(8);
      return Math.floor((s.player.y + 22) / T) - r.ty;
    };
    rows.climb = [await hop(null, 17)];
    put(32, 16);
    await dc.run(6);
    rows.climb.push(await hop('left', 14));
    put(29, 13);
    await dc.run(6);
    rows.climb.push(await hop(null, 10));
    rows.climbQuiet = s.F.ward_noise === n1;
    // the chair says nothing yet; Ottavia has the talk; then the chair is the last, silent act
    put(9, 9);
    await dc.run(10);
    rows.chairFirst = !s.interaction.current;
    put(14, 9);
    await dc.run(10);
    rows.prompt = s.interaction.current && s.interaction.current.prompt;
    dc.press('KeyE', 2);
    await until(dc, () => s.sceneBox.active, 30);
    rows.said = await talkThrough(dc, s, /Why/);
    await dc.run(5);
    rows.why = !!s.F.ott_why;
    rows.leftTooSoon = !!s.F.gloves_left;
    rows.chairGoal = hud.s.objective;
    put(9, 9);
    await dc.run(10);
    rows.chairPrompt = s.interaction.current && s.interaction.current.prompt;
    dc.press('KeyE', 2);
    await dc.run(4);
    rows.boxAtChair = s.sceneBox.active;
    rows.left = !!s.F.gloves_left;
    rows.savedLeft = !!getRun('racer').flags.gloves_left;
    await dc.run(5);
    rows.goalAfter = hud.s.objective;
    const ok = rows.walks && rows.noise === 1 && rows.backAt === 34 && rows.quietDrop && rows.climb.join() === '17,14,10' && rows.climbQuiet && rows.chairFirst && /give her/.test(rows.prompt) && !rows.leftTooSoon && /chair/.test(rows.chairGoal) && /chair/.test(rows.chairPrompt) && !rows.boxAtChair && rows.left && rows.savedLeft && rows.why && rows.said.some((t) => /tide/.test(t)) && rows.said.some((t) => /told him/.test(t)) && !rows.said.some((t) => /tomorrow/.test(t));
    return { pass: ok, detail: rows };
  },
};

const kitchen = {
  id: 'racer-kitchen',
  expect: 'pass',
  async run(dc) {
    const s = await at(dc, 'kitchen');
    const rows = { goal: hud.s.objective, card: !!s.F['_card:kitchen'] };
    rows.noJarYet = !s.interaction.items.get('home:rent').enabled();
    await pressAt(dc, s, 'home:tin');
    rows.tin = !!s.F.tin_taken;
    await dc.run(2);
    rows.goal2 = hud.s.objective;
    // short the rent: 2 rent, 6 tyres, 4 medicine
    for (const [jar, n] of [['rent', 2], ['tyres', 6], ['medicine', 4]]) for (let i = 0; i < n; i++) await pressAt(dc, s, `home:${jar}`);
    // the twelfth coin commits nothing: a jar gives one back, and takes it again; then the tin closes
    rows.waits = !s.F.jars_done && !s.sceneBox.active;
    rows.closeShown = s.interaction.items.get('home:close').enabled();
    await dc.run(2);
    rows.closeGoal = hud.s.objective;
    await pressAt(dc, s, 'home:medicine');
    rows.tookBack = s.F.jar_medicine === 3 && !s.interaction.items.get('home:close').enabled();
    await pressAt(dc, s, 'home:medicine');
    rows.putBack = s.F.jar_medicine === 4;
    await pressAt(dc, s, 'home:close');
    await until(dc, () => s.sceneBox.active, 60);
    rows.said = await talkThrough(dc, s);
    await dc.run(10);
    rows.flags = { short: s.F.rent_short, med: s.F.med_short, tyres: s.F.tyres_short, done: s.F.jars_done };
    rows.price = softPrice(s.F);
    const ok = rows.waits && rows.closeShown && /close/.test(rows.closeGoal) && rows.tookBack && rows.putBack && rows.card && rows.noJarYet && rows.tin && rows.flags.short && !rows.flags.med && !rows.flags.tyres && rows.flags.done && rows.said.includes('…') && !rows.said.some((t) => /rent is in the jar/.test(t)) && rows.price === PRICES.soft - 12;
    return { pass: ok, detail: rows };
  },
};

const sponsor = {
  id: 'racer-sponsor',
  expect: 'pass',
  async run(dc) {
    const s = await at(dc, 'sponsor');
    const rows = { goal: hud.s.objective };
    s.levelCoins = 0;
    s.runConversation('sable_first', null);
    await dc.run(3);
    rows.first = await talkThrough(dc, s);
    rows.paperLocked = false;
    const papers = ['sable:team', 'sable:money', 'sable:garage'];
    const pick = [/Hold station/, /dinners/, /Initial/];
    for (let i = 0; i < 3; i++) {
      await pressAt(dc, s, papers[i]);
      await until(dc, () => s.modals && s.modals.active, 30);
      // the reading panel: page on until it closes
      for (let k = 0; k < 40 && !s.sceneBox.active; k++) {
        dc.press('KeyE', 2);
        await dc.run(10);
      }
      rows[`p${i}`] = await talkThrough(dc, s, pick[i]);
      await dc.run(6);
    }
    await until(dc, () => s.F.signed, 200);
    // strike a (team): b pays 2. Strike b (money): a pays 10 and binds. Whole (garage): 12, binds.
    rows.nuts = s.levelCoins;
    rows.binds = { orders: !!s.F.sable_orders, cut: !!s.F.sable_cut, lien: !!s.F.sable_lien };
    const ok = rows.first.length && rows.nuts === 24 && !rows.binds.orders && rows.binds.cut && rows.binds.lien && s.F.signed;
    return { pass: ok, detail: rows };
  },
};

const chalk = {
  id: 'racer-chalk',
  expect: 'pass',
  async run(dc) {
    const s = await at(dc, 'nightbefore');
    const rows = { goal: hud.s.objective, dark: s.player.light && s.player.light.state().kind };
    const r = s.graph.room('nightbefore');
    rows.orderHeld = !s.interaction.items.get('gull:mark_turn').enabled() && !s.interaction.items.get('gull:mark_apex').enabled();
    await pressAt(dc, s, 'gull:mark_brake');
    rows.brake = !!s.F.mark_brake;
    await pressAt(dc, s, 'gull:mark_turn');
    rows.turn = !!s.F.mark_turn;
    // the washout: a fall in the dark is back to the lamp, not the end
    const x = (r.tx + 51) * T + 16;
    const lastGood = (r.tx + 44) * T;
    s.player.setPosition(x, (r.ty + 12) * T);
    s.player.body.reset(x, (r.ty + 12) * T);
    await until(dc, () => s.player.x < lastGood + 8 * T && s.player.body.blocked.down, 300);
    rows.back = Math.floor(s.player.x / T) - r.tx;
    await dc.run(40);
    await pressAt(dc, s, 'gull:mark_apex');
    await dc.run(4);
    await until(dc, () => s.F.chalked, 120);
    rows.chalked = !!s.F.chalked;
    const ok = rows.orderHeld && rows.brake && rows.turn && rows.back < 50 && rows.chalked;
    return { pass: ok, detail: rows };
  },
};

const pit = {
  id: 'racer-pit',
  expect: 'pass',
  async run(dc) {
    const s = await at(dc, 'pitlane');
    const rows = { goal: hud.s.objective };
    const onBeat = async (miss) => {
      await pressAt(dc, s, 'enc:pitstop');
      await until(dc, () => s.encounters.busy, 30);
      await dc.run(20);
      const eng = s.encounters.active.engine;
      for (let n = 0; n < miss; n++) {
        await until(dc, () => !eng.state().inWindow, 100);
        dc.press('KeyE', 2);
        await dc.run(4);
      }
      for (let n = 0; n < 4; n++) {
        await until(dc, () => eng.done || eng.state().inWindow, 200);
        if (eng.done) break;
        dc.press('KeyE', 2);
        await dc.run(4);
      }
      await until(dc, () => !s.encounters.busy, 120);
      await dc.run(10);
    };
    await onBeat(3);
    rows.slow = { misses: s.F.pit_misses, drilled: !!s.F.pit_drilled };
    await until(dc, () => !s.beats.busy, 200);
    await onBeat(0);
    await until(dc, () => s.F.pit_drilled, 200);
    await dc.run(5);
    rows.clean = { misses: s.F.pit_misses, drilled: !!s.F.pit_drilled };
    rows.goalAfter = hud.s.objective;
    return { pass: rows.slow.misses === 3 && !rows.slow.drilled && rows.clean.drilled && !!s.F.pit_clean && /Gull|Coppa/.test(rows.goalAfter), detail: rows };
  },
};

const places = {
  id: 'racer-rooms',
  expect: 'pass',
  async run(dc) {
    const out = {};
    let ok = true;
    for (const room of ROOMS) {
      const s = await at(dc, room);
      const d = s.graph.room(room).data;
      await dc.run(20);
      // walk the room's length, with every flag that shows more text: nothing breaks a text rule
      const y = s.player.y;
      const w = d.grid[0].length;
      const found = [];
      for (let col = 4; col < w; col += 12) {
        const x = (s.graph.room(room).tx + col) * T + T / 2;
        s.player.setPosition(x, y);
        s.player.body.reset(x, y);
        await dc.run(12);
        found.push(...auditText(s));
      }
      const perf = s.perf.sample();
      const good = s.roomId === room && !!hud.s.objective && !!d.titleCard && perf.objects < BUDGET.objects && (d.music || {}).key && !found.length && (room === 'quay' || !!d.goal);
      ok = ok && good;
      out[room] = { goal: hud.s.objective, objects: perf.objects, card: d.goal || null, text: found.slice(0, 4) };
    }
    return { pass: ok, detail: out };
  },
};

// where a player arrives in each room, as jo-contrast samples a place: 3:1 or better. Three more
// spots are reported, not enforced: in front of a dresser or a desk, a dark coat on dark wood is lower
const contrast = {
  id: 'racer-contrast',
  expect: 'pass',
  async run(dc) {
    const arrive = {};
    const spots = {};
    for (const room of ROOMS) {
      const s = await at(dc, room);
      const r = s.graph.room(room);
      const y = s.player.y;
      await dc.run(280); // (the bark on arrival sits on the caption bar, over his feet)
      arrive[room] = (await joContrast(dc, s)).edgeMedian;
      const w = r.data.grid[0].length;
      spots[room] = [];
      for (const col of [Math.round(w * 0.25), Math.round(w * 0.5), Math.round(w * 0.75)]) {
        const x = (r.tx + col) * T + T / 2;
        s.player.setPosition(x, y);
        s.player.body.reset(x, y);
        await dc.run(30);
        spots[room].push((await joContrast(dc, s)).edgeMedian);
      }
    }
    return { pass: Object.values(arrive).every((v) => v >= 3), detail: { arrive, spots } };
  },
};

const touchVerbs = {
  id: 'racer-touch-verbs',
  expect: 'pass',
  async run(dc) {
    const was = touchState.on;
    enableTouch(true);
    const s = await at(dc, 'garage');
    const rows = {};
    await dc.run(3);
    const L = touchState.controls.layout;
    const E = L.buttons.find((b) => b.id === 'interact');
    rows.ids = L.buttons.map((b) => b.id);
    const bench = s.interaction.items.get('race:bench');
    s.player.setPosition(bench.x, s.player.y);
    s.player.body.reset(bench.x, s.player.y);
    await dc.run(4);
    touch('touchstart', 7, E.x, E.y);
    await dc.run(3);
    touch('touchend', 7, E.x, E.y);
    await until(dc, () => s.encounters.busy, 40);
    await dc.run(25);
    // a way out by touch: the Q button steps away, nothing tuned
    const Q = L.buttons.find((b) => b.id === 'alt');
    touch('touchstart', 8, Q.x, Q.y);
    await dc.run(2);
    touch('touchend', 8, Q.x, Q.y);
    await until(dc, () => !s.encounters.busy, 120);
    rows.steppedAway = !s.encounters.busy && !s.F.tuned;
    await dc.run(30);
    touch('touchstart', 7, E.x, E.y);
    await dc.run(3);
    touch('touchend', 7, E.x, E.y);
    await until(dc, () => s.encounters.busy, 40);
    await dc.run(25);
    const engine = s.encounters.active.engine;
    // the same E button, held, then let up in the slot
    touch('touchstart', 7, E.x, E.y);
    await until(dc, () => engine.state().hz === 0, 500);
    rows.turned = engine.state().holding;
    touch('touchend', 7, E.x, E.y);
    await until(dc, () => !s.encounters.busy, 120);
    await dc.run(4);
    rows.tuned = !!s.F.tuned;
    enableTouch(was);
    return { pass: rows.steppedAway && rows.turned && rows.tuned, detail: rows };
  },
};

const coins = {
  id: 'racer-coins',
  expect: 'pass',
  async run(dc) {
    const s = await at(dc, 'garage');
    const d = dreamById('racer');
    const placed = (s.placedCoins || []).length;
    return { pass: placed >= d.coin.budget[0] && placed <= d.coin.budget[1] && d.coin.worth === 3, detail: { placed, budget: d.coin.budget } };
  },
};

// the page goes away while the room is still talking: a Continue must not be a dead run
const quitWindow = {
  id: 'racer-quit-window',
  expect: 'pass',
  async run(dc) {
    const rows = {};
    const resume = async (s) => {
      s.scene.restart({ dreamId: 'racer', resume: true });
      await dc.run(10);
      await until(dc, () => {
        const n = dc.scene();
        return n && n.sys.settings.key === 'Dream' && n.interaction && n.roomId;
      });
      await dc.run(10);
      return dc.scene();
    };
    // the kitchen: the talk that follows the tin
    let s = await at(dc, 'kitchen');
    await pressAt(dc, s, 'home:tin');
    for (const [jar, n] of [['rent', 6], ['tyres', 3], ['medicine', 3]]) for (let i = 0; i < n; i++) await pressAt(dc, s, `home:${jar}`);
    await pressAt(dc, s, 'home:close');
    rows.kitchenTalking = (await until(dc, () => s.sceneBox.active, 60)) >= 0;
    s = await resume(s);
    rows.kitchen = { jars: !!s.F.jars_done, goal: hud.s.objective };
    // Sable's: the talk that follows the last paper
    s = await at(dc, 'sponsor', { met_sable: true });
    for (const id of ['team', 'money', 'garage']) {
      await pressAt(dc, s, `sable:${id}`);
      await until(dc, () => s.modals && s.modals.active, 30);
      for (let k = 0; k < 40 && !s.sceneBox.active; k++) {
        dc.press('KeyE', 2);
        await dc.run(10);
      }
      await talkThrough(dc, s, /Initial/);
      await dc.run(6);
    }
    s = await resume(s);
    rows.sable = { signed: !!s.F.signed, hook: (nextHook({ ...s.F, done_race1: true, done_race2: true }) || {}).id };
    // the Gull road: the caption after the last mark
    s = await at(dc, 'nightbefore');
    for (const id of ['mark_brake', 'mark_turn', 'mark_apex']) await pressAt(dc, s, `gull:${id}`);
    s = await resume(s);
    rows.chalk = { apex: !!s.F.mark_apex, chalked: !!s.F.chalked };
    // the corridor: quit between her talk and the chair, the chair still waits
    s = await at(dc, 'hospital');
    const land = (s.graph.room('hospital').ty + 10) * T - 22;
    s.player.setPosition(s.interaction.items.get('ward:give').x, land);
    s.player.body.reset(s.player.x, land);
    await dc.run(6);
    await pressAt(dc, s, 'ward:give');
    await until(dc, () => s.sceneBox.active, 30);
    await talkThrough(dc, s);
    await dc.run(4);
    s = await resume(s);
    rows.ward = { told: !!s.F.ward_told, chair: s.interaction.items.get('ward:chair').enabled(), give: s.interaction.items.get('ward:give').enabled() };
    const ok = rows.kitchenTalking && rows.kitchen.jars && rows.sable.signed && rows.sable.hook === 'race3' && rows.chalk.apex && rows.chalk.chalked && rows.ward.told && rows.ward.chair && !rows.ward.give;
    clearRun('racer');
    return { pass: ok, detail: rows };
  },
};

// ---- the season through real doors ------------------------------------------------
const put = (s, room, col, row) => {
  const r = s.graph.room(room);
  const x = (r.tx + col) * T + T / 2;
  const y = (r.ty + row) * T - 22;
  s.player.setPosition(x, y);
  s.player.body.reset(x, y);
};
// a door, for real: stand at it, [E], wait for the room behind it
async function through(dc, s, id, to) {
  const it = s.interaction.items.get(`door:${id}`);
  s.player.setPosition(it.x, it.y);
  s.player.body.reset(it.x, it.y);
  await dc.run(4);
  dc.press('KeyE', 2);
  await until(dc, () => s.roomId === to && !s.transitions.busy, 200);
  await dc.run(6);
}
async function talkAt(dc, s, id, pick) {
  await pressAt(dc, s, id);
  await until(dc, () => s.sceneBox.active, 40);
  return talkThrough(dc, s, pick);
}
const inScene = (dc, key) => () => dc.scene() && dc.scene().sys.settings.key === key && (key !== 'Race' || dc.scene().race) && (key !== 'Dream' || dc.scene().interaction);
// the shutter: the word first if there is one, then the road
async function shutter(dc, s, said = []) {
  await pressAt(dc, s, 'race:test');
  await dc.run(4);
  if (s.sceneBox.active) said.push(...(await talkThrough(dc, s)));
  await until(dc, inScene(dc, 'Race'), 300);
  const r = dc.scene();
  r.race.launchTried = true;
  return r;
}
// what the script earned is in the save; what the scene has not done yet, this does and says
function handOver(r, missed) {
  const want = (r.race.script && r.race.script.flags) || {};
  const run = getRun('racer');
  const lost = Object.keys(want).filter((k) => want[k] && !run.flags[k]);
  if (lost.length) {
    missed.push(`${r.track.id}: ${lost.join(',')}`);
    r.saveFlags((f) => ({ ...f, ...want }));
  }
}
async function backFromCard(dc, r, missed) {
  await until(dc, () => r.race.result, 300);
  dc.releaseAll();
  handOver(r, missed);
  await until(dc, () => r.pauseMenu.isOpen, 200);
  await dc.run(50);
  r.pauseMenu.choose('garage');
  await until(dc, inScene(dc, 'Dream'), 200);
  await dc.run(10);
  return dc.scene();
}
const toLine = (r, t) => {
  r.race.t = t;
  Object.assign(r.race.jo, { d: r.track.length - 5, prevD: r.track.length - 5, lampD: 350, v: 30, x: 0, prevX: 0 });
};
// the Harbour, jumped to the cue. Race 2 ends in RaceScene (stage D) or, until it does, here
async function harbourToDark(dc, r, missed, inAir) {
  const race = r.race;
  race.t = 30;
  const aldo = race.rivals.find((c) => c.id === 'aldo');
  const cue = r.track.script.gullCue;
  const gap = inAir ? 10 : 120;
  Object.assign(race.jo, { d: cue - 1, prevD: cue - 1, lampD: 660, v: 30, x: 0, prevX: 0 });
  Object.assign(aldo, { d: cue - 1 + gap, prevD: cue - 1 + gap, v: 30, x: 0, prevX: 0 });
  const seen = [];
  const drain = race.drain.bind(race);
  race.drain = () => {
    const e = drain();
    seen.push(...e.map((x) => x.type));
    return e;
  };
  if (inAir) Object.assign(race.jo, { draft: 1, inDraft: true, draftOf: aldo, armed: true });
  race.script.heldAt = inAir ? race.t : -1e9; // (held long enough just now, or never: script.js's own test)
  dc.hold('up');
  await until(dc, () => race.script.state === 'over' || dc.scene() !== r, 700);
  dc.releaseAll();
  const out = { lamp: race.script.lamp, result: race.result, seen };
  await dc.run(200);
  if (dc.scene() === r) {
    missed.push('harbour: race_over');
    handOver(r, missed);
    r.leaveToGarage();
  } else handOver(r, missed);
  await until(dc, inScene(dc, 'Dream'), 300);
  await dc.run(10);
  return { ...out, s: dc.scene() };
}
// all the Coppa wants, the door next
const READY = { tuned: true, done_race1: true, tyres_settled: true, kept_tyres: true, tyre_soft: true, done_race2: true, cup_told: true, gloves_left: true, ward_told: true, jars_done: true, rent_ok: true, signed: true, sable_struck: true, done_race3: true, letter_read: true, garage_again: true, car_for: 'jo', chalked: true, mark_brake: true, mark_turn: true, mark_apex: true, pit_drilled: true, pit_clean: true, 'item:gloves': true, race_salt_passed: true, race_salt_best: 3 };
// the Coppa's second lap, jumped to the wheel; brake for him or do not
async function theWheel(dc, r, how) {
  const race = r.race;
  const sc = race.script;
  const L = race.track;
  sc.pit = 'done';
  sc.lamp = 'lit';
  for (const c of race.rivals) c.pitted = true;
  const b = L.bends.filter((q) => q.name === L.script.gull)[1];
  race.t = 75;
  const cas = race.rivals.find((c) => c.id === 'cassian');
  Object.assign(race.jo, { d: b.from - 30, prevD: b.from - 30, lampD: 900, v: 18, x: 0, prevX: 0 });
  Object.assign(cas, { d: b.from - 2, prevD: b.from - 2, v: 20, x: 0, prevX: 0 });
  for (const c of race.rivals) if (c !== cas) Object.assign(c, { d: 100, prevD: 100, v: 0 });
  dc.hold(how === 'pass' ? 'up' : 'down');
  await until(dc, () => sc.wheel !== 'wait', 300);
  const off = sc.wheel;
  await until(dc, () => ['helping', 'helped', 'passed'].includes(sc.wheel), 900);
  const choice = sc.wheel;
  if (how === 'stop-now') return { off, choice };
  if (how === 'stop') {
    const t0 = race.t;
    await until(dc, () => sc.wheel === 'helped', 900);
    dc.releaseAll();
    return { off, choice, lost: race.t - t0 };
  }
  dc.releaseAll();
  return { off, choice };
}
// home with it: the crew, the orb, the catch, the card, the station
async function homeToStation(dc, s0) {
  let s = s0;
  const rows = {};
  await until(dc, () => s.sceneBox.active, 400);
  rows.crew = await talkThrough(dc, s);
  await until(dc, () => s.orb, 100);
  await dc.run(10);
  rows.goal = hud.s.objective;
  rows.noCardYet = !s.ending.active;
  // on his own feet, along the floor, to her
  dc.hold('right');
  rows.walked = await until(dc, () => s.ending.active, 900);
  dc.releaseAll();
  rows.lines = endingLines(s.F);
  await until(dc, () => s.ending.waitingForReturn, 1800);
  rows.card = s.ending.step;
  rows.audit = dc.readability().slice(0, 4);
  rows.caught = !!getSave().dreams.racer;
  dc.press('Enter', 2);
  await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Hub', 900);
  rows.back = dc.scene().sys.settings.key;
  rows.runGone = !getRun('racer');
  // (a caught dream's platform says NO RETURN: the other scenarios want it boarding)
  updateSave((sv) => {
    delete sv.dreams.racer;
    sv.dreamsCaught = Math.max(0, sv.dreamsCaught - 1);
  });
  return rows;
}

const tragedy = {
  id: 'racer-tragedy',
  expect: 'pass',
  async run(dc) {
    const rows = { sceneMissed: [] };
    for (const [name, inAir] of [['air', true], ['back', false]]) {
      const s = await at(dc, 'garage', { tuned: true, done_race1: true, tyres_settled: true, kept_tyres: true, tide_asked: true });
      const said = [];
      const r = await shutter(dc, s, said);
      const out = await harbourToDark(dc, r, rows.sceneMissed, inAir);
      const n = out.s;
      await until(dc, () => n.sceneBox.active, 200);
      const morning = await talkThrough(dc, n);
      await dc.run(10);
      rows[name] = { said, track: r.track.id, lamp: out.lamp, finished: !!out.result, finishSeen: out.seen.includes('finish'), dark: out.seen.includes('aldo_dark'), held: n.F.held_aldo, done: !!n.F.done_race2, morning, goal: hud.s.objective, slate: slateRows(n.F) };
    }
    const good = (v, held) => v.track === 'harbour' && v.said.length && v.lamp === 'dark' && !v.finished && !v.finishSeen && v.dark && !!v.held === held && v.done && v.morning.some((t) => /no tail lights/.test(t)) && /gloves/.test(v.goal) && /no finish/.test(v.slate);
    return { pass: good(rows.air, true) && good(rows.back, false), detail: rows };
  },
};

const finale = (how) => ({
  id: `racer-finale-${how === 'stop' ? 'brake' : 'pass'}`,
  expect: 'pass',
  async run(dc) {
    const rows = { sceneMissed: [] };
    const s = await at(dc, 'garage', READY);
    rows.eve = [];
    const r = await shutter(dc, s, rows.eve);
    rows.track = r.track.id;
    rows.wheel = await theWheel(dc, r, how);
    toLine(r, 95);
    dc.hold('up');
    const n = await backFromCard(dc, r, rows.sceneMissed);
    rows.place = n.F.race_coppa_best;
    rows.done = !!n.F.done_coppa;
    Object.assign(rows, { stoppedFlag: !!n.F.helped_cassian, passedFlag: !!n.F.passed_cassian });
    Object.assign(rows, await homeToStation(dc, n));
    const said = rows.lines.join(' ');
    const ok = rows.track === 'coppa' && rows.eve.some((t) => /lift/.test(t)) && rows.wheel.off !== 'wait' && rows.place === 1 && rows.done && rows.crew.some((t) => /still ringing/.test(t)) && /stand by her/.test(rows.goal) && rows.noCardYet && rows.walked >= 0 && rows.caught && rows.back === 'Hub' && rows.runGone && (how === 'stop' ? rows.stoppedFlag && !rows.passedFlag && /stopped for Roche/.test(said) && Math.abs(rows.wheel.lost - TUNE.stopHelp) < 0.2 : rows.passedFlag && !rows.stoppedFlag && /went by Roche/.test(said)) && /first/.test(rows.lines[0]) && /somebody asks/.test(rows.lines.at(-1));
    return { pass: ok, detail: rows };
  },
});

const coppaAgain = {
  id: 'racer-coppa-again',
  expect: 'pass',
  async run(dc) {
    const rows = { sceneMissed: [] };
    const s = await at(dc, 'garage', READY);
    const r = await shutter(dc, s, []);
    const race = r.race;
    race.script.pit = 'done';
    race.script.wheel = 'passed';
    race.rivals.find((c) => c.id === 'teo').finished = 90;
    Object.assign(race.rivals.find((c) => c.id === 'teo'), { d: r.track.length + 50 });
    toLine(r, 95);
    dc.hold('up');
    const n = await backFromCard(dc, r, rows.sceneMissed);
    rows.place = n.F.race_coppa_best;
    rows.done = !!n.F.done_coppa;
    rows.goal = hud.s.objective;
    rows.hook = (nextHook(n.F) || {}).id;
    rows.noCatch = !n.ending.active && !n.orb;
    const again = await shutter(dc, n, (rows.said = []));
    rows.again = again.track.id;
    return { pass: rows.place === 2 && !rows.done && /not second/.test(rows.goal) && rows.hook === 'coppa' && rows.noCatch && rows.again === 'coppa' && !rows.said.length, detail: rows };
  },
};

const quitAnywhere = {
  id: 'racer-quit-anywhere',
  expect: 'pass',
  async run(dc) {
    const rows = {};
    const STATES = {
      grid: { flags: READY, set: () => {} },
      pit: { flags: READY, set: async (r) => {
        const b = r.track.script.box;
        Object.assign(r.race, { t: 50 });
        Object.assign(r.race.jo, { d: b.d + 2, prevD: b.d + 2, v: 0, lampD: 755 });
        await dc.run(4);
        return r.race.script.pit;
      } },
      choice: { flags: READY, set: async (r) => (await theWheel(dc, r, 'stop-now')).off, },
      dark: { flags: { tuned: true, done_race1: true, tyres_settled: true, tide_asked: true }, set: async (r) => {
        r.race.t = 30;
        const cue = r.track.script.gullCue;
        Object.assign(r.race.jo, { d: cue + 1, prevD: cue + 1, v: 20 });
        await until(dc, () => r.race.script.lamp === 'dark', 500);
        return r.race.script.state;
      } },
    };
    const open = async (r, id) => {
      r.openPause();
      await dc.run(30);
      r.pauseMenu.choose(id);
      await until(dc, () => dc.scene() !== r && dc.scene() && dc.scene().sys.settings.key !== 'Race', 500);
      await dc.run(10);
      return dc.scene();
    };
    let ok = true;
    try {
    for (const [name, st] of Object.entries(STATES)) {
      for (const to of ['garage', 'station']) {
        const s = await at(dc, 'garage', st.flags);
        rows.at = `${name}>${to}`;
        const r = await shutter(dc, s, []);
        const at0 = await st.set(r);
        dc.releaseAll();
        let n = await open(r, to);
        const key = n.sys.settings.key;
        if (to === 'station') {
          n.scene.start('Dream', { dreamId: 'racer', resume: true, quietResume: true });
          await until(dc, inScene(dc, 'Dream'), 300);
          await dc.run(10);
          n = dc.scene();
        }
        // the door still works: the run goes on
        const hook = (nextHook(n.F) || {}).id;
        // (quit in the dark and the Cup is already over: the story has moved on to his gloves, and the door says so)
        if (!hook) {
          const story = !!n.F.done_race2 && !n.F.gloves_left;
          rows[`${name}>${to}`] = { state: at0, key, room: n.roomId, hook, story };
          ok = ok && story && n.roomId === 'garage' && key === (to === 'station' ? 'Hub' : 'Dream');
          continue;
        }
        const again = await shutter(dc, n, []);
        const live = dc.scene().sys.settings.key === 'Race';
        again.pauseMenu.destroy();
        rows[`${name}>${to}`] = { state: at0, key, room: n.roomId, hook, live };
        ok = ok && live && n.roomId === 'garage' && key === (to === 'station' ? 'Hub' : 'Dream');
      }
    }
    } catch (e) {
      rows.threw = String(e);
      rows.scene = dc.scene() && dc.scene().sys.settings.key;
      ok = false;
    }
    clearRun('racer');
    return { pass: ok, detail: rows };
  },
};

// the old flags, saved and resumed: what the HUD asks for is there to do, and the Coppa is still ahead
const oldSave = {
  id: 'racer-old-save',
  expect: 'pass',
  async run(dc) {
    const rows = {};
    const home = { tuned: true, done_race1: true, tyres_settled: true, done_race2: true, cup_told: true, 'item:gloves': true, gloves_left: true, jars_done: true, ward_told: true };
    const load = async (flags) => {
      const s = await at(dc, 'garage', flags);
      s.saveRun();
      s.scene.start('Dream', { dreamId: 'racer', resume: true, quietResume: true });
      await dc.run(4);
      await until(dc, () => inScene(dc, 'Dream')() && dc.scene() !== s, 300);
      await dc.run(20);
      return dc.scene();
    };
    // the old order: the stand-in for race 3 done, Sable's door next, unsigned
    let s = await load({ ...home, done_race3: true, letter_read: true });
    rows.unsigned = { goal: hud.s.objective, hook: nextHook(s.F), whose: !!s.F.whose_due };
    await through(dc, s, 'garage>quay', 'quay');
    await through(dc, s, 'quay>sponsor', 'sponsor');
    rows.unsigned.reached = s.roomId;
    // done_race4: Ottavia's question next, the Coppa's doors behind it
    s = await load({ ...home, done_race3: true, done_race4: true, signed: true, letter_read: true });
    rows.d4 = { goal: hud.s.objective, gull: s.F.garage_again };
    rows.d4.said = await talkAt(dc, s, 'npc:ottavia_back', /Aldo/);
    await dc.run(4);
    rows.d4.after = hud.s.objective;
    await through(dc, s, 'garage>quay', 'quay');
    await through(dc, s, 'quay>gull', 'nightbefore');
    rows.d4.reached = s.roomId;
    // done_race5 at the old end of the road: the Coppa is not won, and it is due
    s = await load({ ...home, done_race3: true, done_race4: true, done_race5: true, signed: true, garage_again: true, chalked: true, pit_drilled: true, pit_clean: true, race_test_prize: 12, race_test_paid: 0 });
    rows.d5 = { goal: hud.s.objective, hook: (nextHook(s.F) || {}).id, paid: s.F.race_test_paid };
    const r = await shutter(dc, s, []);
    rows.d5.track = r.track.id;
    r.pauseMenu.destroy();
    clearRun('racer');
    const ok = /Sable/.test(rows.unsigned.goal) && !rows.unsigned.hook && rows.unsigned.reached === 'sponsor' && /question/.test(rows.d4.goal) && rows.d4.said.some((t) => /Whose car/.test(t)) && /Gull/.test(rows.d4.after) && rows.d4.reached === 'nightbefore' && /Coppa/.test(rows.d5.goal) && rows.d5.hook === 'coppa' && rows.d5.track === 'coppa' && rows.d5.paid === 12;
    return { pass: ok, detail: rows };
  },
};

const length = {
  id: 'racer-length',
  expect: 'pass',
  async run() {
    const F = { tuned: true };
    const times = {
      pinewood: runRace(TRACKS.pinewood, F, tidy()).r.result.time,
      harbour: (() => {
        const h = runRace(TRACKS.harbour, F, tidy({ air: 'aldo' }));
        return h.r.t;
      })(),
      salt: runRace(TRACKS.salt, F, tidy()).r.result.time,
      coppa: runRace(TRACKS.coppa, F, coppaBot()).r.result.time,
    };
    const total = Object.values(times).reduce((a, b) => a + b, 0);
    return { pass: total < 260, detail: { times, total } };
  },
};

// the whole of it: bench to ending, through the real doors, one set of choices
const flow = (name, c) => ({
  id: `racer-flow-${name}`,
  expect: 'pass',
  async run(dc) {
    const rows = { sceneMissed: [], goals: {}, said: {} };
    const goal = async (k) => {
      await dc.run(3);
      rows.goals[k] = hud.s.objective;
    };
    let s = await at(dc, 'garage', { tuned: true });
    s.levelCoins = 0;
    await goal('start');
    // Pinewood: under Aldo's time
    let r = await shutter(dc, s);
    rows.pinewood = r.track.id;
    toLine(r, 28);
    dc.hold('up');
    s = await backFromCard(dc, r, rows.sceneMissed);
    await goal('seat');
    rows.said.aldoFirst = null;
    rows.said.aldo = await talkAt(dc, s, 'npc:aldo', c.tyres);
    await goal('wall');
    // the sea wall, by the real door, before the shutter will open
    rows.shutShut = !nextHook(s.F);
    await through(dc, s, 'garage>quay', 'quay');
    rows.said.wall = await talkAt(dc, s, 'npc:aldo_wall', c.tide);
    await goal('tyres');
    await through(dc, s, 'quay>garage', 'garage');
    // the Harbour: the eve, the road, the dark
    r = await shutter(dc, s, (rows.said.harbourEve = []));
    let out = await harbourToDark(dc, r, rows.sceneMissed, c.air);
    s = out.s;
    await until(dc, () => s.sceneBox.active, 200);
    rows.said.morning = await talkThrough(dc, s);
    await goal('morning');
    put(s, 'garage', 10, 11);
    await until(dc, () => s.F['item:gloves'], 60);
    await goal('gloves');
    await through(dc, s, 'garage>quay', 'quay');
    await through(dc, s, 'quay>hospital', 'hospital');
    put(s, 'hospital', 14, 10);
    await dc.run(6);
    rows.said.corridor = await talkAt(dc, s, 'ward:give', c.corridor);
    await dc.run(4);
    await goal('chair');
    put(s, 'hospital', 9, 10);
    await dc.run(6);
    dc.press('KeyE', 2);
    await dc.run(10);
    await goal('left');
    rows.gloves = !!s.F.gloves_left;
    await through(dc, s, 'hospital>quay', 'quay');
    await through(dc, s, 'quay>kitchen', 'kitchen');
    await pressAt(dc, s, 'home:tin');
    for (const [jar, n] of Object.entries(c.jars)) for (let i = 0; i < n; i++) await pressAt(dc, s, `home:${jar}`);
    await pressAt(dc, s, 'home:close');
    await until(dc, () => s.sceneBox.active, 60);
    rows.said.signora = await talkThrough(dc, s);
    await goal('sable');
    await through(dc, s, 'kitchen>quay', 'quay');
    // on the way to Sable's: Teo, by the pole
    put(s, 'quay', 33, 15);
    await until(dc, () => s.sceneBox.active, 60);
    rows.said.teo = await talkThrough(dc, s, c.teo);
    await until(dc, () => s.F.teo_met, 40);
    await through(dc, s, 'quay>sponsor', 'sponsor');
    rows.said.sable = await talkAt(dc, s, 'npc:sable');
    s.levelCoins = 0;
    for (const [i, id] of ['team', 'money', 'garage'].entries()) {
      await pressAt(dc, s, `sable:${id}`);
      await until(dc, () => s.modals && s.modals.active, 30);
      for (let k = 0; k < 40 && !s.sceneBox.active; k++) {
        dc.press('KeyE', 2);
        await dc.run(10);
      }
      rows.said.signed = await talkThrough(dc, s, c.papers[i]); // (the last one runs on into his closing word)
      await dc.run(6);
    }
    await until(dc, () => s.F.signed && !s.beats.busy, 200);
    rows.advance = s.levelCoins;
    await goal('salt');
    // the money has somewhere to go: the rack, if the advance reaches it
    await through(dc, s, 'sponsor>quay', 'quay');
    await through(dc, s, 'quay>garage', 'garage');
    await until(dc, () => s.sceneBox.active, 120);
    rows.said.dante = await talkThrough(dc, s);
    await dc.run(6);
    if (c.buy) {
      s.levelCoins = 99;
      rows.said.rack = await talkAt(dc, s, 'race:rack', /Buy/);
      rows.boughtOut = !s.F.tyres_short;
    }
    // the Salt Road: the eve says what the kitchen and the desk decided
    r = await shutter(dc, s, (rows.said.saltEve = []));
    rows.worn = r.race.jo.grip;
    const race = r.race;
    const [cas, dante] = ['cassian', 'dante'].map((id) => race.rivals.find((x) => x.id === id));
    const L = r.track.length;
    Object.assign(cas, { d: L + 100, finished: 60 });
    if (c.hold) Object.assign(dante, { d: L + 80, finished: 61 });
    else Object.assign(dante, { d: L - 200 });
    const nuts0 = s.levelCoins;
    toLine(r, 62);
    dc.hold('up');
    s = await backFromCard(dc, r, rows.sceneMissed);
    await dc.run(5);
    rows.salt = { best: s.F.race_salt_best, done: !!s.F.done_race3, rentPaid: !!s.F.rent_paid, nuts: s.levelCoins - nuts0, broke: !!s.F.broke_orders };
    await until(dc, () => s.sceneBox.active, 400);
    rows.said.letter = await talkThrough(dc, s, c.letter);
    await goal('question');
    rows.slate = slateRows(s.F);
    rows.said.whose = await talkAt(dc, s, 'npc:ottavia_back', c.whose);
    await goal('gull');
    rows.said.danteAfter = await talkAt(dc, s, 'npc:dante');
    if (c.roche) {
      s.levelCoins = 0;
      rows.said.rocheRack = await talkAt(dc, s, 'race:rack', /Roche/);
      rows.fitted = !!s.F.roche_fitted && !!s.F.tyre_soft && s.levelCoins === 0;
    }
    // the chest: the jar was short, and twelve nuts are on the table, or not
    await through(dc, s, 'garage>quay', 'quay');
    rows.said.pia = await talkAt(dc, s, 'npc:pia');
    rows.said.rosa = await talkAt(dc, s, 'npc:rosa');
    rows.said.beppe = await talkAt(dc, s, 'npc:beppe');
    await through(dc, s, 'quay>kitchen', 'kitchen');
    rows.chestBad = !!s.F.chest_bad && !!s.npcs.get('signora_sit');
    rows.said.signoraLate = await talkAt(dc, s, s.F.chest_bad ? 'npc:signora_sit' : 'npc:signora');
    if (c.paysChemist) {
      s.levelCoins = 12;
      await pressAt(dc, s, 'home:chemist');
      await dc.run(4);
      await until(dc, () => !s.beats.busy, 300);
      await dc.run(4);
      rows.chestAfter = { ok: !!s.F.med_ok, sat: !!s.npcs.get('signora_sit'), nuts: s.levelCoins };
    }
    await through(dc, s, 'kitchen>quay', 'quay');
    await through(dc, s, 'quay>gull', 'nightbefore');
    await pressAt(dc, s, 'gull:mark_brake');
    put(s, 'nightbefore', 28, 13);
    await until(dc, () => s.sceneBox.active, 60);
    rows.said.cassian = await talkThrough(dc, s);
    await dc.run(6);
    for (const id of ['mark_turn', 'mark_apex']) await pressAt(dc, s, `gull:${id}`);
    await dc.run(10);
    await until(dc, () => !s.beats.busy, 300);
    await goal('pit');
    await through(dc, s, 'gull>quay', 'quay');
    await through(dc, s, 'quay>pit', 'pitlane');
    rows.signoraAtWall = !!s.npcs.get('signora_pit');
    rows.said.nino = await talkAt(dc, s, 'npc:nino_pit');
    rows.said.tullio = await talkAt(dc, s, 'npc:tullio_pit');
    await pressAt(dc, s, 'enc:pitstop');
    await until(dc, () => s.encounters.busy, 30);
    await dc.run(20);
    const eng = s.encounters.active.engine;
    for (let n = 0; n < 4; n++) {
      await until(dc, () => eng.done || eng.state().inWindow, 200);
      if (eng.done) break;
      dc.press('KeyE', 2);
      await dc.run(4);
    }
    await until(dc, () => !s.encounters.busy, 120);
    await until(dc, () => s.F.pit_drilled, 300);
    await until(dc, () => !s.beats.busy, 300);
    await goal('coppa');
    await through(dc, s, 'pit>quay', 'quay');
    await through(dc, s, 'quay>garage', 'garage');
    // the Coppa
    r = await shutter(dc, s, (rows.said.coppaEve = []));
    rows.wheel = await theWheel(dc, r, c.cassian);
    toLine(r, 95);
    dc.hold('up');
    s = await backFromCard(dc, r, rows.sceneMissed);
    Object.assign(rows, await homeToStation(dc, s));
    const want = c.want(rows);
    // what a first play reads: 40 characters a second, a beat for each press
    const lines = Object.values(rows.said).flat().filter(Boolean).concat(rows.crew);
    rows.reading = { lines: lines.length, chars: lines.join('').length, seconds: Math.round(lines.join('').length / 40 + lines.length * 0.6) };
    return { pass: Object.values(want).every(Boolean), detail: { ...rows, want } };
  },
});

const flowKeep = flow('keep', {
  tyres: /take them/,
  tide: /Going out/,
  teo: /late/,
  roche: true,
  air: true,
  corridor: /Say nothing/,
  jars: { rent: 2, tyres: 7, medicine: 3 }, // the rent and the chest go short, and nobody pays the chemist
  papers: [/bonnet/, /dinners/, /Sable oil/], // the orders, the fifth and the debts all stand
  hold: true,
  letter: /pocket/,
  whose: /Aldo/,
  cassian: 'stop',
  want: (r) => ({
    order: r.pinewood === 'pinewood',
    goals: /Beat Aldo/.test(r.goals.start) && /Aldo is at his car/.test(r.goals.seat) && /Harbour/.test(r.goals.tyres) && /gloves/.test(r.goals.morning) && /hospital/.test(r.goals.gloves) && /chair/.test(r.goals.chair) && /Castellanes/.test(r.goals.left) && /Sable/.test(r.goals.sable) && /Salt/.test(r.goals.salt) && /question/.test(r.goals.question) && /Gull/.test(r.goals.gull) && /pit lane/.test(r.goals.pit) && /Coppa/.test(r.goals.coppa),
    airLine: r.said.corridor.some((t) => /right there/.test(t)),
    wall: r.shutShut && /sea wall/.test(r.goals.wall) && r.said.wall.some((t) => /third step/.test(t)) && r.said.wall.some((t) => /A length sooner/.test(t)),
    teo: r.said.teo.some((t) => /my gap/.test(t)) && r.said.teo.some((t) => /Watch my tyres/.test(t)),
    dante: r.said.dante.some((t) => /did not write it/.test(t)) && r.said.danteAfter.some((t) => /noticed/.test(t)),
    cassian: r.said.cassian.some((t) => /kept my letter/.test(t)) && r.said.cassian.some((t) => /Nobody stops/.test(t)),
    town: r.said.pia.some((t) => /Write your name/.test(t)) === false && r.said.rosa.length > 0 && r.said.beppe.length > 0,
    rocheFitted: r.fitted && r.said.coppaEve.some((t) => /Roche's rubber/.test(t)),
    chest: r.chestBad && !r.signoraAtWall && r.said.signoraLate.some((t) => /sitting because I choose/.test(t)) && r.crew.some((t) => /from the window/.test(t)) && /only her chest/.test(r.lines.join(' ')) && /Roche's tyres/.test(r.lines.join(' ')),
    orders: r.said.signed.some((t) => /behind Mr Mir/.test(t)),
    eve: r.said.saltEve.some((t) => /rent/.test(t)) && r.said.saltEve.some((t) => /jar paid/.test(t)) === false,
    rent: r.salt.best === 3 && r.salt.rentPaid && r.salt.nuts === 2, // third, 8, a fifth to Sable: 6; 4 to the rent
    held: !r.salt.broke,
    letter: r.said.whose.some((t) => /four tyres in black paper/.test(t)) && !r.said.whose.some((t) => /You held/.test(t)), // (HOLD is told by the card and Dante, not again here)
    lien: r.said.tullio.some((t) => /thirty days/i.test(t)),
    nino: r.said.nino.some((t) => /tide/.test(t)),
    crew: r.crew.some((t) => /rent was late/.test(t)) && r.crew.some((t) => /Sable on Monday/.test(t)) && !r.crew.some((t) => /next month|the letter/.test(t)), // (the tyres and the letter are told elsewhere: tullio_after, the ending)
    ending: /stopped for Roche/.test(r.lines.join(' ')) && /rent was late/.test(r.lines.join(' ')),
    caught: r.caught && r.back === 'Hub',
  }),
});

const flowGive = flow('give', {
  tyres: /your car/,
  tide: /Coming in/,
  teo: /Say nothing/,
  paysChemist: true,
  air: false,
  corridor: /Why/,
  jars: { rent: 6, tyres: 3, medicine: 3 }, // the tyres go short and the advance buys them out; the chest goes short and twelve nuts answer it
  papers: [/Hold/, /fifth/, /debts/], // the bad clauses struck
  buy: true,
  hold: false,
  letter: /stove/,
  whose: /Mine/,
  cassian: 'pass',
  want: (r) => ({
    backLine: r.said.corridor.some((t) => /from back there/.test(t)),
    chest: r.chestBad && r.chestAfter.ok && !r.chestAfter.sat && r.chestAfter.nuts === 0 && r.signoraAtWall && r.crew.some((t) => /with soup/i.test(t)) && /with soup/.test(r.lines.join(' ')),
    stoveCassian: r.said.cassian.some((t) => /burnt my letter/.test(t)),
    bought: r.boughtOut && r.worn === 1,
    good: r.said.saltEve.some((t) => /Good rubber/.test(t)) && r.said.saltEve.some((t) => /sheet pays/.test(t)),
    prize: r.salt.best === 2 && !r.salt.rentPaid,
    stove: r.said.whose.some((t) => /good paper/.test(t)),
    nolien: !r.said.tullio.some((t) => /thirty days/i.test(t)),
    crew: r.crew.some((t) => /bank/.test(t)) && !r.crew.some((t) => /one new set/.test(t)),
    ending: /went by Roche/.test(r.lines.join(' ')) && /rent was paid/.test(r.lines.join(' ')) && /read the paper/.test(r.lines.join(' ')),
    caught: r.caught && r.back === 'Hub',
  }),
});

export default [tuneVerb, shop, season, choice, cupMorning, corridor, kitchen, sponsor, chalk, pit, places, contrast, touchVerbs, coins, quitWindow, tragedy, finale('stop'), finale('pass'), coppaAgain, quitAnywhere, oldSave, length, flowKeep, flowGive];
