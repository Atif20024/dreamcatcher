// THE LONG STRAIGHT, stage 2: the coast and the walk-in places, each room's goal
// and fail state through its real [E], the choice and its payoff. Silent, as every
// dev run is.
//   racer-tune          a real hold: the fumes throb, go still in the slot, a miss and a flood; hot without it
//   racer-shop          the rack and the bench: nuts buy tyres and chalk, into the car's tune, never its speed
//   racer-season        the door counts for each stand-in, in order; doors open behind them
//   racer-choice        keep or give the tyres: the corridor says different lines, the Heron differs
//   racer-cup-morning   after the stand-in for the Cup: Nino's word, Aldo gone, his gloves to take
//   racer-corridor      a real climb; a drop off the iron stairs sends Jo back; the gloves go on the chair
//   racer-kitchen       the tin, the jars, the fail: short the rent and she says nothing; the rack's price moves
//   racer-sponsor       three papers: struck or whole, what it pays and what it binds
//   racer-chalk         the marks in order; the washout is back to the lamp
//   racer-pit           the drill: a miss too many is again; a clean stop ends the road for now
//   racer-rooms         every place: objective, card, music, under budget, no text rule broken
//   racer-contrast      Jo at 3:1 or better in every room
//   racer-touch-verbs   TUNE by a real touch on E
//   racer-coins         the dream's budget of nuts is placed
//   racer-quit-window   quit and Continue during the talk that follows a verb: the story's flag is already saved
import { clearRun, getRun } from '../../utils/save.js';
import { hud } from '../../ui/hud.js';
import { dreamById } from '../../data/dreams.js';
import { TRACKS } from '../../dreams/racer/race/tracks.js';
import { HOOKS, doneOf, softPrice, PRICES, nextHook } from '../../dreams/racer/season.js';
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
    const open = (id, f) => s.F[f];
    void open;
    Object.assign(s.F, { done_race2: true });
    await dc.run(2);
    rows.doors.afterCup = await locked('quay>hospital');
    Object.assign(s.F, { gloves_left: true });
    await dc.run(2);
    rows.doors.afterChair = await locked('quay>kitchen');
    Object.assign(s.F, { done_race3: true });
    await dc.run(2);
    rows.doors.afterRace3 = await locked('quay>sponsor');
    Object.assign(s.F, { done_race5: true });
    await dc.run(2);
    rows.doors.afterRace5 = [await locked('quay>pit'), await locked('quay>gull')];
    // the door counts for the hook, at the line: through the real door and the real finish
    const g = await at(dc, 'garage', { tuned: true });
    g.interaction.items.get('race:test').onUse();
    await until(dc, () => dc.scene() && dc.scene().sys.settings.key === 'Race' && dc.scene().race);
    const r = dc.scene();
    r.race.t = 40;
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
    const ok = rows.doors.start.every((p) => !/^(in|up|through|walk)/.test(p)) && /quietly/.test(rows.doors.afterCup) && /Castellanes/.test(rows.doors.afterChair) && /Sable/.test(rows.doors.afterRace3) && /through/.test(rows.doors.afterRace5[0]) && /walk/.test(rows.doors.afterRace5[1]) && rows.line.done === true && rows.line.pending === undefined;
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
    const ok = k.soft && !g.soft && k.settled && g.settled && line(k.corridor, /bolted them on/) && !line(g.corridor, /bolted them on/) && line(g.corridor, /your tyres on/) && !line(k.corridor, /your tyres on/) && line(k.again, /grateful/) && k.silent && line(g.tullio_after, /twice/) && line(k.tullio_after, /His were old/) && line(g.nino_after, /Your tyres/) && line(k.nino_after, /His old tyres/);
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
    return { pass: rows.slow.misses === 3 && !rows.slow.drilled && rows.clean.drilled && /written/.test(rows.goalAfter), detail: rows };
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
    rows.kitchen = { jars: !!s.F.jars_done, hook: (nextHook({ ...s.F, done_race1: true }) || {}).id };
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
    const ok = rows.kitchenTalking && rows.kitchen.jars && rows.kitchen.hook === 'race3' && rows.sable.signed && rows.sable.hook === 'race4' && rows.chalk.apex && rows.chalk.chalked && rows.ward.told && rows.ward.chair && !rows.ward.give;
    clearRun('racer');
    return { pass: ok, detail: rows };
  },
};

export default [tuneVerb, shop, season, choice, cupMorning, corridor, kitchen, sponsor, chalk, pit, places, contrast, touchVerbs, coins, quitWindow];
