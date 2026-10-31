// THE LAST HAND on the framework (src/dreams/gambler/).
//   gambler-board        platform 7: [E] at the gate, the conductor, the walk-in
//                        (IntroScene), then DreamScene plays 'gambler' on the
//                        quay with its title, objective and the half-dime HUD
//   gambler-places       every ?warp=gambler:<place> lands in its room with an
//                        objective, a board title, under budget, only it and
//                        its neighbours live, its own music key, loop and acoustics
//   gambler-coins        40–55 half dimes placed, worth 5 each
//   gambler-legacy       ?warp=gambler_legacy still plays the neon casino
//   gambler-quay         Lou, then the slate by real input (three numbers), the
//                        purse and the HUD slate; the saloon door opens
//   gambler-saloon       a comp on Mr Pell's book (TILT), the faro bank by real
//                        input to $80 (a bust goes back to the quay, bar reset)
//   gambler-cards        the three tables played on the tells by real input
//                        (STAND UP after a pot), the third opens, the rake and
//                        the folds go to the ledger
//   gambler-tilt         tilted: the bet creeps, Lou is drowned, the tells blur;
//                        ten seconds on the guard and it is gone
//   gambler-office       a marker: the corridor ceiling drops a tile, the lamps
//                        dim, Crake walks it; the stair up
//   gambler-deck         the escape pipes scald on their beat; the ladder to
//                        the texas roof; the pilot house door
//   gambler-playthrough  board-less, quay to landing with real inputs at every
//                        table; at the last table the hand is TAKEN first (no
//                        orb, ever: a win deals another, a loss is the quay),
//                        then Jo comes back and STANDS UP: the lamp dips, the
//                        landing, Lou's line, the coin, CAUGHT, the station
import { clearRun, getSave } from '../../utils/save.js';
import { dreamById } from '../../data/dreams.js';
import { uncatch } from './phase3.js';
import { BUDGET } from '../../core/PerfBudget.js';
import { buses } from '../../audio/AudioBus.js';
import { hud } from '../../ui/hud.js';
import { bestVerb } from '../../engines/showdown.js';

const T = 32;
const keyOf = (dc) => dc.scene() && dc.scene().sys.settings.key;

async function boot(dc, place = 'start') {
  clearRun('gambler');
  dc.warp('gambler', place);
  await dc.run(40);
  for (let k = 0; k < 3 && !(keyOf(dc) === 'Dream' && dc.scene().beats && dc.scene().roomId); k++) {
    dc.warp('gambler', place);
    await dc.run(40);
  }
  const s = dc.scene();
  safe(s);
  await clearCards(dc, s);
  return s;
}

function safe(s) {
  s.invulnUntil = Infinity;
  if (s.health && s.health.setInvulnerable) s.health.setInvulnerable(s.time.now, 1e9);
  for (const f of s.foes || []) f.passive = true;
}

async function clearCards(dc, s) {
  for (let i = 0; i < 6 && (s.tutorialActive || s.cardActive); i++) {
    dc.press('action', 2);
    await dc.run(12);
  }
}

function put(s, x, y) {
  s.player.setPosition(x, y);
  s.player.body.reset(x, y);
}

const at = (s, room, tx, ty) => {
  const r = s.graph.room(room);
  return { x: (r.tx + tx) * T + T / 2, y: (r.ty + ty) * T + T - 22 };
};

async function walkTo(dc, s, x, { frames = 900, tol = 30, hurt = false } = {}) {
  let stuck = 0;
  let lastX = s.player.x;
  for (let f = 0; f < frames; f++) {
    if (!hurt) safe(s);
    if (s.tutorialActive) await clearCards(dc, s);
    const p = s.player;
    const d = x - p.x;
    if (Math.abs(d) < 56) {
      dc.releaseAll();
      for (let i = 0; i < 30 && Math.abs(p.body.velocity.x) > 5; i++) await dc.run(1);
      await dc.run(2);
      if (Math.abs(x - p.x) <= tol) return true;
      dc.hold(x - p.x > 0 ? 'right' : 'left');
      await dc.run(2);
      dc.releaseAll();
      continue;
    }
    const dir = d > 0 ? 'right' : 'left';
    for (const o of ['left', 'right']) if (o !== dir && dc.state().held.includes(o)) dc.release(o);
    dc.hold(dir);
    const b = p.body;
    const blocked = (d > 0 && b.blocked.right) || (d < 0 && b.blocked.left);
    stuck = Math.abs(p.x - lastX) < 0.5 ? stuck + 1 : 0;
    lastX = p.x;
    if ((blocked || stuck > 6) && b.blocked.down) {
      dc.hold('jump');
      await dc.run(16);
      dc.release('jump');
    }
    await dc.run(1);
  }
  dc.releaseAll();
  return false;
}

async function talkThrough(dc, s, pick = 0, limit = 1600) {
  for (let i = 0; i < limit && s.sceneBox.active; i += 12) {
    if (s.sceneBox.choosing && pick > 0) {
      for (let k = 0; k < pick; k++) dc.press('down', 2);
      pick = 0;
      await dc.run(4);
    }
    dc.press('action', 2);
    await dc.run(10);
  }
  return !s.sceneBox.active;
}

async function waitBeats(dc, s, limit = 900) {
  for (let i = 0; i < limit && (s.beats.busy || s.sceneBox.active); i++) {
    if (s.sceneBox.active) await talkThrough(dc, s);
    await dc.run(1);
  }
  await clearCards(dc, s);
}

async function talk(dc, s, pick = 0) {
  dc.press('interact', 3);
  await dc.run(12);
  await talkThrough(dc, s, pick);
  await waitBeats(dc, s);
}

async function door(dc, s, want) {
  for (let k = 0; k < 3 && s.roomId !== want; k++) {
    for (let i = 0; i < 30 && !s.player.body.blocked.down; i++) await dc.run(1);
    dc.press('interact', 3);
    for (let i = 0; i < 120 && s.roomId !== want; i++) await dc.run(1);
  }
  await dc.run(10);
  await clearCards(dc, s);
  return s.roomId === want;
}

async function sitDown(dc, s) {
  dc.press('interact', 3);
  await dc.run(24);
  return s.encounters.busy;
}

// move a menu's cursor with the arrows to `i`, by real key presses
async function cursorTo(dc, eng, i, field = 'cursor') {
  for (let k = 0; k < 12 && eng.state()[field] !== i; k++) {
    dc.press(eng.state()[field] < i ? 'right' : 'left', 2);
    await dc.run(3);
  }
  return eng.state()[field] === i;
}

// the slate: three numbers by real input (left/right on each row, [E] down)
async function playSlate(dc, s, moves = [0, 0, 0]) {
  const a = s.encounters.active;
  if (!a) return false;
  await dc.run(20);
  for (const m of moves) {
    for (let k = 0; k < Math.abs(m); k++) {
      dc.press(m < 0 ? 'left' : 'right', 2);
      await dc.run(3);
    }
    dc.press('interact', 2);
    await dc.run(4);
  }
  dc.press('interact', 2);
  for (let i = 0; i < 60 && s.encounters.busy; i++) await dc.run(2);
  return !s.encounters.busy;
}

// the faro bank: BET $20 on the seven until the bank is doubled or busted
async function playFaro(dc, s, limit = 4000) {
  const a = s.encounters.active;
  if (!a) return null;
  await dc.run(20);
  const e = a.engine;
  await cursorTo(dc, e, 1, 'pick');
  let bets = 0;
  for (let i = 0; i < limit && s.encounters.busy; i++) {
    const st = e.state();
    if (st.phase === 'choose') {
      dc.press('interact', 2);
      bets++;
    }
    await dc.run(4);
  }
  return { bets, result: a.engine.result };
}

// a table, read on the tells: the sharp's verb for these cards and tells;
// STAND UP once a pot is won there. Returns the engine's result.
async function playTable(dc, s, { maxHands = 40, takeLast = false } = {}) {
  const a = s.encounters.active;
  if (!a) return null;
  const e = a.engine;
  await dc.run(20);
  const log = { hands: 0, verbs: {} };
  for (let i = 0; i < 6000 && s.encounters.busy; i++) {
    const st = e.state();
    if (st.phase === 'decide') {
      let verb;
      if (st.mode === 'final') verb = takeLast ? 'call' : 'stand';
      else verb = st.won || st.hand > maxHands ? 'stand' : bestVerb(st.jo, st.opps.map((o) => o.tell));
      const idx = st.menu.findIndex((m) => m.id === verb && m.enabled);
      await cursorTo(dc, e, idx < 0 ? st.menu.findIndex((m) => m.id === 'call') : idx);
      log.verbs[verb] = (log.verbs[verb] || 0) + 1;
      log.hands += 1;
      dc.press('interact', 2);
      await dc.run(4);
      if (takeLast && st.mode === 'final') {
        // the hand plays out: stop at its reveal (the caller looks at it)
        for (let k = 0; k < 40 && e.state().phase !== 'reveal'; k++) await dc.run(1);
        return { ...log, last: e.state().last, engine: e };
      }
    } else if (st.phase === 'reveal' && i % 40 === 0) dc.press('interact', 2);
    await dc.run(1);
  }
  return { ...log, result: e.result };
}

async function hub(dc) {
  dc.warp('hub', null);
  dc.step(4);
  for (let i = 0; i < 300; i++) {
    const sc = dc.scene();
    if (sc && sc.player && keyOf(dc) === 'Hub' && sc.trains && sc.interacts && sc.sys.isActive()) break;
    await new Promise((r) => setTimeout(r, 20));
    dc.step(2);
  }
  dc.step(60);
  const sc = dc.scene();
  if (sc.openingSkip) sc.openingSkip();
  return sc;
}

const board = {
  id: 'gambler-board',
  async run(dc) {
    uncatch('gambler');
    clearRun('gambler');
    const sc = await hub(dc);
    const d = dreamById('gambler');
    const t = sc.trains.gambler;
    const row = sc.board.rows.find((r) => r.platform === 7);
    sc.player.setPosition(t.gateX - 10, sc.player.y);
    dc.step(20);
    const show = sc.dialog.show.bind(sc.dialog);
    let asked = null;
    sc.dialog.show = async (pages) => {
      asked = pages && pages[0] && pages[0].text;
      return 'board';
    };
    const it = sc.interacts.find((i) => i.label === 'train' && Math.abs(i.x - t.gateX) < 4);
    const prompted = !!it && it.when();
    it.cb();
    await Promise.resolve();
    for (let i = 0; i < 400 && keyOf(dc) === 'Hub'; i++) await dc.run(1);
    sc.dialog.show = show;
    const intro = keyOf(dc) === 'Intro' && dc.scene().levelKey === 'gambler';
    for (let i = 0; i < 900 && keyOf(dc) === 'Intro'; i++) await dc.run(1);
    for (let i = 0; i < 200 && !(dc.scene() && dc.scene().roomId); i++) await dc.run(1);
    await dc.run(20);
    const ds = dc.scene();
    const inDream = keyOf(dc) === 'Dream' && ds.dreamId === 'gambler' && ds.roomId === 'quay';
    const title = inDream && !!ds._titleCard;
    const coinHud = inDream && !!ds.coinMgr && ds.coinIcon === 'coin-gambler-0';
    clearRun('gambler');
    const pass = !!row && row.title === d.title && /BOARDING/.test(row.status) && prompted && asked === d.conductor && intro && inDream && title && coinHud;
    return { pass, detail: { row: row && { title: row.title, status: row.status }, prompted, conductor: asked === d.conductor, intro, inDream, title, coinHud } };
  },
};

const PLACES = [['start', 'quay'], ['quay', 'quay'], ['saloon', 'saloon'], ['cards', 'cards'], ['office', 'office'], ['deck', 'deck'], ['pilot', 'pilot'], ['landing', 'landing']];
const places = {
  id: 'gambler-places',
  async run(dc) {
    const out = [];
    let ok = true;
    for (const [place, room] of PLACES) {
      const s = await boot(dc, place);
      await dc.run(30);
      const p = s.perf.sample();
      const live = [...s.streamer.live.keys()];
      const allowed = new Set([s.roomId, ...s.graph.neighbours(s.roomId)]);
      const obj = (s.objectiveText && s.objectiveText.text) || s._objective || '';
      const data = s.graph.room(room).data;
      const sound = data.ambience && data.music && data.music.key && s.music.key === data.music.key && buses.preset === (data.acoustics || 'open');
      const good = s.roomId === room && !!obj && p.objects + p.ui <= BUDGET.objects && p.drawCalls <= BUDGET.drawCalls && live.every((id) => allowed.has(id)) && !!data.titleCard && sound;
      ok = ok && good;
      out.push(`${place}→${s.roomId}${good ? '' : ' FAIL'}: "${obj}", ${p.objects + p.ui} obj, ~${p.drawCalls} dc, paint ${s.streamer.paintMs[room]} ms, ${data.ambience}/${s.music.key}/${buses.preset}`);
    }
    clearRun('gambler');
    return { pass: ok, detail: out.join('; ') };
  },
};

const coins = {
  id: 'gambler-coins',
  async run(dc) {
    const s = await boot(dc, 'start');
    const d = dreamById('gambler');
    const placed = (s.placedCoins || []).length;
    const before = getSave().wallet.total;
    const c = s.placedCoins[0];
    put(s, c.img.x, c.img.y + 10);
    await dc.run(10);
    const gained = getSave().wallet.total - before;
    clearRun('gambler');
    const pass = placed >= d.coin.budget[0] && placed <= d.coin.budget[1] && s.levelCoins >= 1 && gained === s.levelCoins * d.coin.worth && d.coin.worth === 5;
    return { pass, detail: { placed, budget: d.coin.budget, gained, levelCoins: s.levelCoins } };
  },
};

const legacy = {
  id: 'gambler-legacy',
  async run(dc) {
    dc.warp('gambler_legacy', 'arrival');
    for (let i = 0; i < 100 && keyOf(dc) !== 'Gambler'; i++) await dc.run(2);
    await dc.run(30);
    const k = keyOf(dc);
    clearRun('gambler');
    return { pass: k === 'Gambler', detail: { scene: k } };
  },
};

// the quay: Lou, then the slate by real input
async function quayPart(dc, s, ok) {
  await waitBeats(dc, s);
  let p = at(s, 'quay', 26, 15);
  await walkTo(dc, s, p.x - 36, { frames: 600, tol: 16 });
  await dc.run(4);
  const near = s.interaction.current && s.interaction.current.id;
  await talk(dc, s);
  if (!ok('met-lou', !!s.F.met_lou)) ok(`(near ${near} at ${Math.round(s.player.x)})`, false);
  ok('door-locked', !s.F.slate_set);
  p = at(s, 'quay', 29, 15);
  await walkTo(dc, s, p.x, { frames: 300, tol: 18 });
  ok('slate-started', await sitDown(dc, s));
  // buy-in $100, stop-loss one lower ($50), goal one higher ($160)
  ok('slate-chalked', await playSlate(dc, s, [0, -1, 1]));
  await waitBeats(dc, s);
  await dc.run(4);
  const P = s.F.purse;
  ok('purse', !!s.F.slate_set && P.buyin === 100 && P.stop === 50 && P.goal === 160 && P.stack === 100);
  ok('hud-slate', /STOP \$50 {2}GOAL \$160/.test(JSON.stringify(hud.get('tool'))) && hud.get('meters').some((m) => m.id === 'stack' && m.ticks && m.ticks.length === 2));
  p = at(s, 'quay', 70, 15);
  ok('reach-door', await walkTo(dc, s, p.x, { frames: 2400, tol: 20 }));
  ok('into-saloon', await door(dc, s, 'saloon'));
}

const quayScenario = {
  id: 'gambler-quay',
  async run(dc) {
    const log = [];
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    const s = await boot(dc, 'start');
    await quayPart(dc, s, ok);
    clearRun('gambler');
    return { pass: log.every((l) => l.endsWith(':ok')), detail: log.join(' ') };
  },
};

// the saloon: a comp, then the faro bank (a bust is the quay; come back)
async function saloonPart(dc, s, ok, { comp = true } = {}) {
  safe(s);
  if (comp) {
    const st = s.npcs.get('steward');
    put(s, st.x - 30, s.player.y);
    await dc.run(6);
    const t0 = s.F.purse.tilt;
    await talk(dc, s, 0);
    ok('comp-on-the-book', s.F.purse.comps === 1 && s.F.purse.tilt > t0);
  }
  let res = null;
  let busts = 0;
  for (let tries = 0; tries < 8 && !s.F.faro_done; tries++) {
    const p = at(s, 'saloon', 43, 11);
    put(s, p.x - 40, p.y);
    await dc.run(10);
    await walkTo(dc, s, p.x, { frames: 300, tol: 14 });
    if (!(await sitDown(dc, s))) break;
    res = await playFaro(dc, s);
    await waitBeats(dc, s, 2400);
    if (res && res.result && res.result.bust) {
      busts += 1;
      for (let i = 0; i < 200 && s.roomId !== 'quay'; i++) await dc.run(1);
      await dc.run(60);
      if (busts === 1) ok('bust-to-quay', s.roomId === 'quay' && s.F.purse.stack === s.F.purse.buyin && s.F.purse.busts === 1);
      // back aboard, through the door
      const d = at(s, 'quay', 70, 15);
      put(s, d.x, d.y);
      await dc.run(10);
      await door(dc, s, 'saloon');
    }
  }
  ok('faro-doubled', !!s.F.faro_done && s.F.purse.stack >= s.F.purse.buyin + 40 - 4);
  return { busts, faro: res && res.result };
}

const saloonScenario = {
  id: 'gambler-saloon',
  async run(dc) {
    const log = [];
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    const s = await boot(dc, 'saloon');
    s.F.slate_set = true;
    s.F._seed = 2;
    const info = await saloonPart(dc, s, ok);
    let p = at(s, 'saloon', 56, 11);
    if (s.roomId !== 'saloon') await door(dc, s, 'saloon');
    put(s, p.x - 30, p.y);
    await dc.run(10);
    ok('into-cards', await door(dc, s, 'cards'));
    clearRun('gambler');
    return { pass: log.every((l) => l.endsWith(':ok')), detail: `${log.join(' ')}; ${JSON.stringify(info)}` };
  },
};

// the card room: three tables on the tells, standing up after a pot
async function cardsPart(dc, s, ok) {
  const stats = {};
  for (const [id, col] of [['t1', 8], ['t2', 20], ['t3', 32]]) {
    for (let tries = 0; tries < 4 && !s.F[`${id}_won`]; tries++) {
      if (s.roomId !== 'cards') {
        const q = at(s, 'cards', col, 11);
        put(s, q.x, q.y);
        await dc.run(30);
      }
      safe(s);
      // cool off first if steaming (the guard), as a sharp would
      if (s.F.purse.tilt >= 0.5) {
        await walkTo(dc, s, at(s, 'cards', 44, 11).x, { frames: 900 });
        await walkTo(dc, s, at(s, 'cards', 52, 11).x, { frames: 900 });
        await walkTo(dc, s, at(s, 'cards', 44, 11).x, { frames: 900 });
        await walkTo(dc, s, at(s, 'cards', 52, 11).x, { frames: 900 });
      }
      const p = at(s, 'cards', col, 11);
      await walkTo(dc, s, p.x, { frames: 900, tol: 14 });
      if (!(await sitDown(dc, s))) {
        ok(`${id}-sat`, false);
        break;
      }
      stats[id] = await playTable(dc, s);
      await waitBeats(dc, s, 2400);
      for (let i = 0; i < 200 && s.roomId !== 'cards'; i++) await dc.run(1);
    }
    ok(`${id}-won`, !!s.F[`${id}_won`]);
    await dc.run(10);
  }
  ok('table3-opened', !!s.F.table3_open);
  ok('tables-done', !!s.F.tables_done);
  const P = s.F.purse;
  ok('ledger', P.hands >= 3 && P.rake >= 1);
  return stats;
}

const cardsScenario = {
  id: 'gambler-cards',
  async run(dc) {
    const log = [];
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    const s = await boot(dc, 'cards');
    Object.assign(s.F, { slate_set: true, faro_done: true, _seed: 5 });
    const stats = await cardsPart(dc, s, ok);
    const p = at(s, 'cards', 56, 11);
    await walkTo(dc, s, p.x, { frames: 1200, tol: 16 });
    ok('into-office', await door(dc, s, 'office'));
    clearRun('gambler');
    return { pass: log.every((l) => l.endsWith(':ok')), detail: `${log.join(' ')}; ${JSON.stringify(stats)}; purse ${JSON.stringify(s.F.purse)}` };
  },
};

const tiltScenario = {
  id: 'gambler-tilt',
  async run(dc) {
    const log = [];
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    const s = await boot(dc, 'cards');
    Object.assign(s.F, { slate_set: true, faro_done: true });
    s.F.purse.tilt = 0.9;
    await dc.run(10);
    ok('tilted-flag', !!s.F.tilted);
    // at a table, tilted: the cursor drifts to the big bet on its own; Lou is drowned
    const p = at(s, 'cards', 8, 11);
    put(s, p.x, p.y);
    await dc.run(10);
    await sitDown(dc, s);
    const e = s.encounters.active.engine;
    for (let i = 0; i < 60 && e.state().phase !== 'decide'; i++) await dc.run(1);
    const c0 = e.state().cursor;
    await dc.run(260);
    const st = e.state();
    const big = st.menu[st.cursor].id;
    ok('bet-creeps', st.cursor !== c0 && (big === 'raise' || big === 'bluff'));
    ok('tells-blur', st.tilted);
    // STAND UP (the verb is the way out; the creep fights the cursor)
    await cursorTo(dc, e, st.menu.findIndex((m) => m.id === 'stand'));
    dc.press('interact', 2);
    for (let i = 0; i < 120 && s.encounters.busy; i++) await dc.run(1);
    ok('stood-up', !s.encounters.busy);
    // ten seconds on the guard, walking
    const before = s.F.purse.tilt;
    const a = at(s, 'cards', 44, 11);
    const b = at(s, 'cards', 52, 11);
    put(s, a.x, a.y);
    await dc.run(10);
    for (let k = 0; k < 24 && s.F.purse.tilt > 0; k++) await walkTo(dc, s, k % 2 ? a.x : b.x, { frames: 400, tol: 30 });
    ok('air-cools', before > 0.5 && s.F.purse.tilt === 0 && !s.F.tilted);
    // standing still at a table does not cool it
    s.F.purse.tilt = 0.6;
    put(s, at(s, 'cards', 14, 11).x, a.y);
    await dc.run(300);
    ok('no-cooling-inside', s.F.purse.tilt === 0.6);
    clearRun('gambler');
    return { pass: log.every((l) => l.endsWith(':ok')), detail: log.join(' ') };
  },
};

async function officePart(dc, s, ok, { sign = 1 } = {}) {
  safe(s);
  const pell = s.npcs.get('pell');
  put(s, pell.x + 50, s.player.y);
  await dc.run(10);
  for (let k = 0; k < sign; k++) {
    const stack = s.F.purse.stack;
    await talk(dc, s, 0);
    await dc.run(30);
    ok(`marker-${k + 1}`, s.F.purse.markers === k + 1 && s.F.purse.stack === stack + 50 && s.F.purse.debt === 50 * (k + 1));
  }
  if (sign) {
    await dc.run(30);
    const planks = s.verbs.find((v) => v.mod.id === 'boat').ctx.state.planks.length;
    ok('corridor-narrows', planks === sign);
    ok('crake-walks', (s.foes || []).some((f) => f.active && f.texture.key.startsWith('foe-lq-crake')));
  } else {
    // decline
    await talk(dc, s, 1);
    ok('declined', s.F.purse.markers === 0);
  }
  const p = at(s, 'office', 43, 11);
  ok('through-corridor', await walkTo(dc, s, p.x, { frames: 1500, tol: 16 }));
  ok('up-to-deck', await door(dc, s, 'deck'));
}

const officeScenario = {
  id: 'gambler-office',
  async run(dc) {
    const log = [];
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    const s = await boot(dc, 'office');
    Object.assign(s.F, { slate_set: true, faro_done: true, tables_done: true });
    await officePart(dc, s, ok, { sign: 2 });
    clearRun('gambler');
    return { pass: log.every((l) => l.endsWith(':ok')), detail: log.join(' ') };
  },
};

// the deck: the hatch, the ladder, the pipes on their beat, the pilot house
async function deckPart(dc, s, ok, { timed = true } = {}) {
  safe(s);
  // the open hatch: a running jump over it
  const st0 = at(s, 'deck', 3, 25);
  put(s, st0.x, st0.y);
  await dc.run(20);
  dc.hold('right');
  await dc.run(14);
  dc.hold('jump');
  await dc.run(18);
  dc.release('jump');
  for (let i = 0; i < 90 && !s.player.body.blocked.down; i++) await dc.run(1);
  dc.releaseAll();
  ok('over-the-hatch', s.player.x > at(s, 'deck', 10, 25).x && s.player.body.blocked.down);
  let p = at(s, 'deck', 15, 25);
  await walkTo(dc, s, p.x, { frames: 900, tol: 6 });
  dc.hold('up');
  for (let i = 0; i < 300 && !(s.player.y < at(s, 'deck', 15, 18).y + 6 && !s.player.climbing); i++) await dc.run(1);
  dc.hold('right');
  await dc.run(20);
  dc.releaseAll();
  await dc.run(20);
  ok('on-texas-roof', s.player.y < at(s, 'deck', 15, 20).y);
  // the pipes: wait for a gap after each, as Dev says
  const boat = s.verbs.find((v) => v.mod.id === 'boat').ctx.state;
  for (const v of boat.vents) {
    if (timed) {
      for (let i = 0; i < 400; i++) {
        const t = (s.time.now + v.phase) % v.period;
        if (t > v.on + 50 && t < v.on + 200) break;
        await dc.run(1);
      }
    }
    await walkTo(dc, s, v.x + 48, { frames: 200, tol: 20, hurt: true });
  }
  p = at(s, 'deck', 35, 18);
  ok('reach-pilot-door', await walkTo(dc, s, p.x, { frames: 600, tol: 16, hurt: true }));
  ok('into-pilot', await door(dc, s, 'pilot'));
}

const deckScenario = {
  id: 'gambler-deck',
  async run(dc) {
    const log = [];
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    const s = await boot(dc, 'deck');
    // the pipes scald on their beat (a heart: real hurt, not the scenario's shield)
    const boat = s.verbs.find((v) => v.mod.id === 'boat').ctx.state;
    const v = boat.vents[0];
    s.invulnUntil = 0;
    if (s.health && s.health.setInvulnerable) s.health.setInvulnerable(s.time.now, 0);
    const h0 = s.health ? s.health.hearts : null;
    for (let i = 0; i < 400; i++) {
      const t = (s.time.now + v.phase) % v.period;
      if (t > 50 && t < v.on - 200) break;
      await dc.run(1);
    }
    put(s, v.x, v.y1 - 30);
    await dc.run(6);
    ok('steam-scalds', !!s.health && s.health.hearts < h0);
    const s2 = await boot(dc, 'deck');
    await deckPart(dc, s2, ok);
    clearRun('gambler');
    return { pass: log.every((l) => l.endsWith(':ok')), detail: log.join(' ') };
  },
};

// the last table: take the hand (never an orb), then stand up (the catch)
async function finale(dc, s, ok, log) {
  safe(s);
  const P = s.F.purse;
  const p = at(s, 'pilot', 11, 11);
  // 1. take the hand, as many times as it lets us, until it is lost
  let takes = 0;
  let lost = false;
  for (let k = 0; k < 8 && !lost; k++) {
    if (s.roomId !== 'pilot') {
      put(s, p.x, p.y);
      await dc.run(30);
    }
    await walkTo(dc, s, p.x, { frames: 300, tol: 14 });
    if (!s.encounters.busy && !(await sitDown(dc, s))) break;
    const r = await playTable(dc, s, { takeLast: true });
    takes += 1;
    ok(`take-${takes}-no-orb`, !s.orb && !getSave().dreams.gambler && !s.F.stood_up);
    if (r && r.last && !r.last.joWins) {
      for (let i = 0; i < 400 && s.encounters.busy; i++) await dc.run(1);
      await waitBeats(dc, s, 2400);
      for (let i = 0; i < 300 && s.roomId !== 'quay'; i++) await dc.run(1);
      await dc.run(60);
      lost = s.roomId === 'quay';
      ok('lost-night-to-quay', lost && P.stack <= P.buyin && (s.F.lost_nights || 0) >= 1);
    } else {
      // a win: the Judge slides another; the table is still up, still no orb
      for (let i = 0; i < 300 && r.engine.state().phase !== 'decide'; i++) await dc.run(1);
      ok(`win-${takes}-another-hand`, s.encounters.busy && r.engine.state().phase === 'decide' && r.engine.state().hand === takes + 1);
    }
  }
  log.push(`(took the last hand ${takes}×, ${lost ? 'lost the night' : 'never lost'})`);
  // 2. back to the pilot house; the Judge deals again; STAND UP
  if (!s.encounters.busy) {
    put(s, p.x, p.y);
    await dc.run(30);
    ok('back-at-the-table', await sitDown(dc, s));
  }
  await playTable(dc, s);
  await waitBeats(dc, s, 2400);
  ok('stood-up', !!s.F.stood_up && !s.encounters.busy);
  ok('no-orb-in-the-room', !s.orb);
  const d = at(s, 'pilot', 28, 11);
  await walkTo(dc, s, d.x, { frames: 600, tol: 16 });
  ok('down-to-landing', await door(dc, s, 'landing'));
  const lou = s.npcs.get('lou_end');
  await walkTo(dc, s, lou.x - 40, { frames: 600, tol: 20 });
  await talk(dc, s);
  ok('heard-lou', !!s.F.heard_lou);
  await dc.run(20);
  ok('orb-on-the-quay', !!s.orb);
  await walkTo(dc, s, s.orb.x, { frames: 900, tol: 12 });
  for (let i = 0; i < 40 && !s.ending.active; i++) {
    dc.hold('jump');
    await dc.run(10);
    dc.release('jump');
    await dc.run(10);
  }
  ok('ending', s.ending.active);
  for (let i = 0; i < 1600 && !s.ending.waitingForReturn; i++) await dc.run(1);
  ok('ending-card', !!s.ending.waitingForReturn && s.ending.caught);
  const lines = s.def.ending.lines(s.F);
  ok('honest-ledger', lines.length >= 4 && /rake/.test(lines.join(' ')) && /Home with/.test(lines.join(' ')));
  log.push(`(ledger: ${lines.join(' | ')})`);
  dc.press('action', 3);
  for (let i = 0; i < 160 && keyOf(dc) !== 'Hub'; i++) await dc.run(1);
  await dc.run(2);
  ok('back-at-station', keyOf(dc) === 'Hub');
  ok('caught-flag', !!getSave().dreams.gambler);
}

const playthrough = {
  id: 'gambler-playthrough',
  async run(dc) {
    uncatch('gambler');
    const log = [];
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    const s = await boot(dc, 'start');
    s.F._seed = 3;
    const t0 = s.time.now;
    await quayPart(dc, s, ok);
    await saloonPart(dc, s, ok);
    if (s.roomId !== 'saloon') await door(dc, s, 'saloon');
    let p = at(s, 'saloon', 56, 11);
    await walkTo(dc, s, p.x, { frames: 1500, tol: 16 });
    ok('into-cards', await door(dc, s, 'cards'));
    await cardsPart(dc, s, ok);
    p = at(s, 'cards', 56, 11);
    if (s.roomId !== 'cards') put(s, p.x, p.y);
    await walkTo(dc, s, p.x, { frames: 1500, tol: 16 });
    ok('into-office', await door(dc, s, 'office'));
    await officePart(dc, s, ok, { sign: 0 });
    await deckPart(dc, s, ok);
    await finale(dc, s, ok, log);
    const minutes = (s.time.now - t0) / 60000;
    uncatch('gambler');
    clearRun('gambler');
    const pass = log.filter((l) => /:(ok|FAIL)$/.test(l)).every((l) => l.endsWith(':ok'));
    return { pass, detail: `${log.join(' ')}; scripted run ${minutes.toFixed(1)} min of game time` };
  },
};

export default [board, places, coins, legacy, quayScenario, saloonScenario, cardsScenario, tiltScenario, officeScenario, deckScenario, playthrough];
