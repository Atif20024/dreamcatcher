// THE STOPPED HOUR on platform 9 (the proof dream, made a train):
//   clockmaker-board   the hub has a platform 9 bay with its board row; [E]
//                      at its gate → Jo walks in → the full-scale arrival
//                      (IntroScene) → DreamScene plays 'clockmaker' in the lane,
//                      with the dream's title, objective and coin HUD
//   clockmaker-coins   30–40 brass cogs placed (the dream's budget), worth 3
//                      each into the wallet when picked up
//   clockmaker-alias   ?warp=proof:start still opens the same dream
// The full run (lane → clock → bell yard → caught → the hub's return, the
// board row CAUGHT) is clockmaker-playthrough in phase3.js.
import { clearRun, getSave } from '../../utils/save.js';
import { DREAMS, dreamById } from '../../data/dreams.js';
import { uncatch } from './phase3.js';

const keyOf = (dc) => dc.scene() && dc.scene().sys.settings.key;

async function hub(dc) {
  dc.warp('hub', null);
  for (let i = 0; i < 300; i++) {
    const sc = dc.scene();
    if (sc && sc.player && keyOf(dc) === 'Hub' && sc.trains) break;
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
    const pass = placed >= d.coin.budget[0] && placed <= d.coin.budget[1] && gained === d.coin.worth && s.levelCoins >= 1;
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

export default [board, coins, alias];
