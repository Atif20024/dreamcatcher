// THE STOPPED HOUR on platform 9 (the proof dream, made a train):
//   clockmaker-board   the hub has a platform 9 bay with its board row; [E]
//                      at its gate → Jo walks in → the full-scale arrival
//                      (IntroScene) → DreamScene plays 'clockmaker' in the lane,
//                      with the dream's title, objective and coin HUD
//   clockmaker-coins   30–40 brass cogs placed (the dream's budget), worth 3
//                      each into the wallet when picked up
//   clockmaker-alias   ?warp=proof:start still opens the same dream
//   last-stop-board    from the hub spawn Jo walks right to platform G, [E] at
//                      its gate, the conductor's question, the walk-in, and
//                      THE LONG EVENING starts (EveningScene)
//   last-stop-turnstile the old way still works: [E] at the turnstile (The
//                      Counter speaks once), [E] again shows the card, and
//                      [E] on the card goes through to the Evening (the card
//                      used to answer only X, so E did nothing: owner bug)
// The full run (lane → clock → bell yard → caught → the hub's return, the
// board row CAUGHT) is clockmaker-playthrough in phase3.js.
import { clearRun, getSave, updateSave } from '../../utils/save.js';
import { DREAMS, LAST_STOP, dreamById } from '../../data/dreams.js';
import { uncatch } from './phase3.js';

const keyOf = (dc) => dc.scene() && dc.scene().sys.settings.key;

async function hub(dc) {
  dc.warp('hub', null);
  // a restart keeps the scene instance (old fields linger): let it begin first
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
  id: 'clockmaker-board',
  async run(dc) {
    uncatch('clockmaker');
    clearRun('clockmaker');
    const sc = await hub(dc);
    const d = dreamById('clockmaker');
    const t = sc.trains.clockmaker;
    const row = sc.board.rows.find((r) => r.platform === 9);
    const platforms = DREAMS.map((x) => x.platform);
    const uniquePlatform = new Set(platforms).size === platforms.length;
    const bayLit = !!t && !t.outOfService && t.state === 'idle';
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
    const intro = keyOf(dc) === 'Intro' && dc.scene().levelKey === 'clockmaker';
    const isc = dc.scene();
    // the arrival: a full-scale train in the dream's livery, Jo steps down
    const arrival = intro && !!isc.train && isc.train.sillY < isc.groundY;
    for (let i = 0; i < 900 && keyOf(dc) === 'Intro'; i++) await dc.run(1);
    for (let i = 0; i < 200 && !(dc.scene() && dc.scene().roomId); i++) await dc.run(1);
    await dc.run(20);
    const ds = dc.scene();
    const inDream = keyOf(dc) === 'Dream' && ds.dreamId === 'clockmaker' && ds.roomId === 'lane';
    const title = inDream && !!ds._titleCard;
    const objective = inDream ? ds.objectiveText || (ds.hud && ds.hud.get && ds.hud.get('objective')) || ds.def.objectives.find_lamplighter : null;
    const coinHud = inDream && !!ds.coinMgr && ds.coinIcon === 'coin-clockmaker-0';
    clearRun('clockmaker');
    const pass = uniquePlatform && !!row && row.title === d.title && /BOARDING/.test(row.status) && bayLit && prompted && asked === d.conductor && intro && arrival && inDream && title && coinHud;
    return { pass, detail: { row, uniquePlatform, bayLit, prompted, conductor: asked === d.conductor, intro, arrival, inDream, title, objective, coinHud } };
  },
};

const coins = {
  id: 'clockmaker-coins',
  async run(dc) {
    clearRun('clockmaker');
    dc.warp('clockmaker', 'start');
    await dc.run(40);
    const s = dc.scene();
    s.invulnUntil = Infinity;
    const d = dreamById('clockmaker');
    const placed = (s.placedCoins || []).length;
    const before = getSave().wallet.total;
    // walk Jo onto the first cog on the wall
    const c = s.placedCoins[0];
    s.player.setPosition(c.img.x, c.img.y + 10);
    s.player.body.reset(c.img.x, c.img.y + 10);
    await dc.run(10);
    const gained = getSave().wallet.total - before;
    clearRun('clockmaker');
    // the magnet may take a neighbour too: every cog is worth 3
    const pass = placed >= d.coin.budget[0] && placed <= d.coin.budget[1] && s.levelCoins >= 1 && gained === s.levelCoins * d.coin.worth;
    return { pass, detail: { placed, budget: d.coin.budget, gained, levelCoins: s.levelCoins } };
  },
};

const alias = {
  id: 'clockmaker-alias',
  async run(dc) {
    dc.warp('proof', 'start');
    await dc.run(40);
    const s = dc.scene();
    const pass = keyOf(dc) === 'Dream' && s.dreamId === 'clockmaker' && s.def.title === 'THE STOPPED HOUR';
    clearRun('clockmaker');
    return { pass, detail: { scene: keyOf(dc), dreamId: s.dreamId, title: s.def.title } };
  },
};

// walk right with real input until Jo is within `tol` of x (hop when blocked)
async function walkRight(dc, s, x, frames = 1800) {
  dc.hold('walk'); // Shift: the station is walked by default, Jo runs
  dc.hold('right');
  for (let f = 0; f < frames && s.player.x < x; f++) {
    const b = s.player.body;
    if (b.blocked.right && b.blocked.down) {
      dc.hold('jump');
      await dc.run(14);
      dc.release('jump');
    }
    await dc.run(1);
  }
  dc.releaseAll();
  for (let i = 0; i < 40 && Math.abs(s.player.body.velocity.x) > 5; i++) await dc.run(1);
  return s.player.x >= x - 40;
}

async function waitEvening(dc, frames = 600) {
  for (let i = 0; i < frames && keyOf(dc) !== 'Evening'; i++) {
    await dc.run(1);
    if (i % 30 === 0) await new Promise((r) => setTimeout(r, 10)); // the Evening's loader
  }
  return keyOf(dc) === 'Evening';
}

const lastStopBoard = {
  id: 'last-stop-board',
  async run(dc) {
    const s = await hub(dc);
    const t = s.trains[LAST_STOP.id];
    const row = s.board.rows.find((r) => r.platform === 'G');
    const startX = Math.round(s.player.x);
    const reached = !!t && (await walkRight(dc, s, t.gateX - 12));
    await dc.run(10);
    const show = s.dialog.show.bind(s.dialog);
    let asked = null;
    s.dialog.show = async (pages) => {
      asked = pages && pages[0] && pages[0].text;
      return 'board';
    };
    const it = s.interacts.find((i) => i.label === 'train' && Math.abs(i.x - t.gateX) < 4);
    const prompted = !!it && Math.hypot(s.player.x - it.x, s.player.y - it.y) < it.radius;
    dc.press('interact', 2);
    await dc.run(4);
    let walked = false;
    for (let i = 0; i < 400 && keyOf(dc) === 'Hub'; i++) {
      await dc.run(1);
      if (t.state === 'boarding') walked = true;
    }
    s.dialog.show = show;
    const evening = await waitEvening(dc);
    const pass = !!row && /BOARDING/.test(row.status) && reached && prompted && asked === LAST_STOP.conductor && walked && evening;
    return { pass, detail: { row, startX, gateX: t && t.gateX, reached, prompted, conductor: asked === LAST_STOP.conductor, walked, evening } };
  },
};

const lastStopTurnstile = {
  id: 'last-stop-turnstile',
  async run(dc) {
    updateSave((sv) => (sv.flags.hub.gateSpoke = false));
    const s = await hub(dc);
    const it = s.interacts.find((i) => i.label === 'gate');
    s.player.setPosition(it.x - 260, s.player.y); // on the concourse, short of the turnstile step
    s.player.body.reset(it.x - 260, s.player.y);
    await dc.run(10);
    const reached = await walkRight(dc, s, it.x - 8, 300);
    const inRange = Math.hypot(s.player.x - it.x, s.player.y - it.y) < it.radius;
    // first [E]: The Counter speaks (a dialog); advance it with [E]
    dc.press('interact', 2);
    for (let i = 0; i < 60 && !s.dialogActive; i++) await dc.run(1);
    const spoke = !!s.dialogActive && !!getSave().flags.hub.gateSpoke;
    for (let i = 0; i < 60 && s.dialogActive; i++) {
      dc.press('interact', 2);
      await dc.run(20);
    }
    await dc.run(30);
    // second [E]: the card
    dc.press('interact', 2);
    for (let i = 0; i < 60 && !s.cardActive; i++) await dc.run(1);
    const card = !!s.cardActive;
    await dc.run(30);
    // [E] on the card goes through (it used to answer only X)
    dc.press('interact', 2);
    await dc.run(10);
    const closed = !s.cardActive;
    const evening = await waitEvening(dc);
    const pass = reached && inRange && spoke && card && closed && evening;
    return { pass, detail: { reached, inRange, spoke, card, closed, evening } };
  },
};

export default [board, coins, alias, lastStopBoard, lastStopTurnstile];
