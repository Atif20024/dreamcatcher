// THE MASTER'S LADDER on the framework (src/dreams/painter/).
//   painter-board        the hub's platform 5: [E] at the gate, the conductor,
//                        the walk-in (IntroScene), then DreamScene plays
//                        'painter' in the bottega with its title, objective
//                        and the giglio HUD
//   painter-places       every ?warp=painter:<place> lands in its room with an
//                        objective, a board title, under budget, only that
//                        room and its neighbours live; inside rooms set their
//                        acoustics, every room its own music key and loop
//   painter-coins        80–100 giglio coins placed, worth 3 each
//   painter-legacy       ?warp=painter_legacy still plays THE YELLOW HOUSE
//   painter-ladder       Jo climbs a scaffold ladder with real input (up held)
//   painter-playthrough  board-less, real inputs where it matters: the master,
//                        the slab, the street, the colour-seller (a real ladder
//                        climb), the lapis, the drapery, the guild's chain, the
//                        seam to the square, the test piece, the seal, the
//                        palazzo (the contract, Bice named), the gold, the
//                        chapel (a real ladder), the cartoon, the giornata
//                        against Dori, the bell, the orb, caught, the hub
import { clearRun, getSave } from '../../utils/save.js';
import { dreamById } from '../../data/dreams.js';
import { uncatch } from './phase3.js';
import { BUDGET } from '../../core/PerfBudget.js';
import { buses } from '../../audio/AudioBus.js';
import { hud } from '../../ui/hud.js';

const T = 32;
const keyOf = (dc) => dc.scene() && dc.scene().sys.settings.key;

async function boot(dc, place = 'start') {
  clearRun('painter');
  dc.warp('painter', place);
  await dc.run(40);
  // a boot-time first scene may still arrive after the warp (the harness
  // race MUSICIAN_REPORT notes): warp again until the dream is up
  for (let k = 0; k < 3 && !(keyOf(dc) === 'Dream' && dc.scene().beats && dc.scene().roomId); k++) {
    dc.warp('painter', place);
    await dc.run(40);
  }
  const s = dc.scene();
  safe(s);
  await clearCards(dc, s);
  return s;
}

// no hurt, no grabs: the playthrough tests the flow, not Jo's reflexes
function safe(s) {
  s.invulnUntil = Infinity;
  if (s.health && s.health.setInvulnerable) s.health.setInvulnerable(s.time.now, 1e9);
  for (const f of s.foes || []) f.passive = true;
}

// a Teach card (SHOVE, LADDERS…) blocks input until dismissed
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

// a room's tile → world px (the standing tile's centre, feet on its floor)
const at = (s, room, tx, ty) => {
  const r = s.graph.room(room);
  return { x: (r.tx + tx) * T + T / 2, y: (r.ty + ty) * T + T - 22 };
};

async function walkTo(dc, s, x, { frames = 900, tol = 30 } = {}) {
  let stuck = 0;
  let lastX = s.player.x;
  for (let f = 0; f < frames; f++) {
    safe(s);
    if (s.tutorialActive) await clearCards(dc, s);
    const p = s.player;
    const d = x - p.x;
    const dir = d > 0 ? 'right' : 'left';
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
    for (const o of ['left', 'right']) if (o !== dir && dc.state().held.includes(o)) dc.release(o);
    dc.hold(dir);
    const b = p.body;
    const blocked = (d > 0 && b.blocked.right) || (d < 0 && b.blocked.left);
    stuck = Math.abs(p.x - lastX) < 0.5 ? stuck + 1 : 0;
    lastX = p.x;
    if ((blocked || stuck > 6) && (b.blocked.down || p.onSlope)) {
      dc.hold('jump');
      await dc.run(16);
      dc.release('jump');
    }
    await dc.run(1);
  }
  dc.releaseAll();
  return false;
}

// talk through a scene box; `pick` chooses by choice index at choice nodes
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

async function talk(dc, s, pick = 0) {
  dc.press('interact', 3);
  await dc.run(12);
  await talkThrough(dc, s, pick);
  await waitBeats(dc, s);
}

async function waitBeats(dc, s, limit = 900) {
  for (let i = 0; i < limit && (s.beats.busy || s.sceneBox.active); i++) {
    if (s.sceneBox.active) await talkThrough(dc, s);
    await dc.run(1);
  }
  await clearCards(dc, s);
}

async function door(dc, s, want) {
  dc.press('interact', 3);
  for (let i = 0; i < 120 && s.roomId !== want; i++) await dc.run(1);
  await dc.run(10);
  await clearCards(dc, s);
  return s.roomId === want;
}

// the craft auto-player: a press when the brush is over the gold mark
export async function playCraft(dc, s, limit = 20000, until = null) {
  let presses = 0;
  for (let i = 0; i < limit && s.encounters.busy && !(until && until()); i++) {
    const a = s.encounters.active;
    const d = a && !a.ending && a.t > 300 ? a.engine.due() : null;
    if (d && Math.abs(d.p - d.at) < d.half * 0.6) {
      dc.press('interact', 1);
      presses += 1;
      await dc.run(3);
      continue;
    }
    await dc.run(1);
  }
  return presses;
}

async function startEncounterOnE(dc, s) {
  dc.press('interact', 3);
  await dc.run(20);
  return s.encounters.busy;
}

// climb a ladder with real input: hold up until Jo is above `topY` px
// (up held all the way: Jo climbs past the ladder's top and steps out onto
// the plank or shelf beside it, standing)
async function climb(dc, s, topY, frames = 400) {
  dc.hold('up');
  let i = 0;
  for (; i < frames && !(s.player.y <= topY && !s.player.climbing && s.player.body.blocked.down); i++) await dc.run(1);
  dc.releaseAll();
  await dc.run(10);
  return s.player.y <= topY && !s.player.climbing && s.player.body.blocked.down;
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
  id: 'painter-board',
  async run(dc) {
    uncatch('painter');
    clearRun('painter');
    const sc = await hub(dc);
    const d = dreamById('painter');
    const t = sc.trains.painter;
    const row = sc.board.rows.find((r) => r.platform === 5);
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
    const intro = keyOf(dc) === 'Intro' && dc.scene().levelKey === 'painter';
    for (let i = 0; i < 900 && keyOf(dc) === 'Intro'; i++) await dc.run(1);
    for (let i = 0; i < 200 && !(dc.scene() && dc.scene().roomId); i++) await dc.run(1);
    await dc.run(20);
    const ds = dc.scene();
    const inDream = keyOf(dc) === 'Dream' && ds.dreamId === 'painter' && ds.roomId === 'bottega';
    const title = inDream && !!ds._titleCard;
    const coinHud = inDream && !!ds.coinMgr && ds.coinIcon === 'coin-painter-0';
    clearRun('painter');
    const pass = !!row && row.title === d.title && /BOARDING/.test(row.status) && prompted && asked === d.conductor && intro && inDream && title && coinHud;
    return { pass, detail: { row: row && { title: row.title, status: row.status }, prompted, conductor: asked === d.conductor, intro, inDream, title, coinHud } };
  },
};

const PLACES = [['start', 'bottega'], ['bottega', 'bottega'], ['via', 'via'], ['speziale', 'speziale'], ['piazza', 'piazza'], ['guild', 'guild'], ['palazzo', 'palazzo'], ['chapel', 'chapel']];
const places = {
  id: 'painter-places',
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
    clearRun('painter');
    return { pass: ok, detail: out.join('; ') };
  },
};

const coins = {
  id: 'painter-coins',
  async run(dc) {
    const s = await boot(dc, 'start');
    const d = dreamById('painter');
    const placed = (s.placedCoins || []).length;
    const before = getSave().wallet.total;
    const c = s.placedCoins[0];
    put(s, c.img.x, c.img.y + 10);
    await dc.run(10);
    const gained = getSave().wallet.total - before;
    clearRun('painter');
    const pass = placed >= d.coin.budget[0] && placed <= d.coin.budget[1] && s.levelCoins >= 1 && gained === s.levelCoins * d.coin.worth && d.coin.worth === 3;
    return { pass, detail: { placed, budget: d.coin.budget, gained, levelCoins: s.levelCoins } };
  },
};

const legacy = {
  id: 'painter-legacy',
  async run(dc) {
    dc.warp('painter_legacy', 'arrival');
    for (let i = 0; i < 100 && keyOf(dc) !== 'Painter'; i++) await dc.run(2);
    await dc.run(30);
    const k = keyOf(dc);
    clearRun('painter');
    return { pass: k === 'Painter', detail: { scene: k } };
  },
};

const ladder = {
  id: 'painter-ladder',
  async run(dc) {
    const s = await boot(dc, 'chapel');
    let p = at(s, 'chapel', 21, 37);
    put(s, p.x, p.y);
    await dc.run(20);
    const y0 = s.player.y;
    const up = await climb(dc, s, at(s, 'chapel', 21, 32).y + 4);
    // step off onto the plank and stand there
    dc.hold('right');
    await dc.run(14);
    dc.releaseAll();
    await dc.run(30);
    const onPlank = s.player.body.blocked.down && s.player.y < y0 - 4 * T;
    clearRun('painter');
    return { pass: up && onPlank, detail: { y0: Math.round(y0), y: Math.round(s.player.y), up, onPlank } };
  },
};

const playthrough = {
  id: 'painter-playthrough',
  async run(dc) {
    uncatch('painter');
    const log = [];
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    const s = await boot(dc, 'start');
    await waitBeats(dc, s);
    const t0 = s.time.now;
    const pr = {};
    // 1. the bottega: the master, the slab (errand boy → apprentice)
    let p = at(s, 'bottega', 14, 11);
    await walkTo(dc, s, p.x + 40, { frames: 500, tol: 24 });
    await talk(dc, s);
    ok('met-master', !!s.F.met_master);
    p = at(s, 'bottega', 25, 11);
    await walkTo(dc, s, p.x, { frames: 600, tol: 20 });
    ok('grind-started', await startEncounterOnE(dc, s));
    pr.grind = await playCraft(dc, s);
    await waitBeats(dc, s);
    ok('apprentice', !!s.F.ground && !!s.F.apprentice);
    // 2. out to the street, into the colour-seller
    p = at(s, 'bottega', 3, 11);
    await walkTo(dc, s, p.x, { frames: 900, tol: 20 });
    ok('to-via', await door(dc, s, 'via'));
    safe(s);
    p = at(s, 'via', 47, 15);
    ok('reach-speziale', await walkTo(dc, s, p.x, { frames: 1500, tol: 20 }));
    ok('into-speziale', await door(dc, s, 'speziale'));
    safe(s);
    // 3. the shelves: the first ladder by real input, then the top shelf
    p = at(s, 'speziale', 13, 17);
    await walkTo(dc, s, p.x, { frames: 400, tol: 6 });
    ok('ladder-climbed', await climb(dc, s, at(s, 'speziale', 13, 13).y + 4));
    p = at(s, 'speziale', 33, 5);
    put(s, p.x, p.y);
    await dc.run(20);
    p = at(s, 'speziale', 35, 5);
    await walkTo(dc, s, p.x, { frames: 300, tol: 14 });
    await dc.run(20);
    await waitBeats(dc, s);
    ok('lapis', !!s.F.lapis && !!s.F['item:lapis']);
    // 4. home: the drapery (apprentice → assistant), the chain drops
    p = at(s, 'speziale', 3, 17);
    put(s, p.x + 40, p.y);
    await dc.run(10);
    await walkTo(dc, s, p.x, { frames: 300, tol: 20 });
    ok('back-to-via', await door(dc, s, 'via'));
    p = at(s, 'via', 9, 15);
    await walkTo(dc, s, p.x, { frames: 1500, tol: 20 });
    ok('back-to-bottega', await door(dc, s, 'bottega'));
    p = at(s, 'bottega', 18, 11);
    await walkTo(dc, s, p.x, { frames: 900, tol: 20 });
    ok('drapery-started', await startEncounterOnE(dc, s));
    pr.drapery = await playCraft(dc, s);
    await waitBeats(dc, s);
    ok('assistant', !!s.F.drapery_done && !!s.F.assistant);
    p = at(s, 'bottega', 3, 11);
    await walkTo(dc, s, p.x, { frames: 900, tol: 20 });
    await door(dc, s, 'via');
    safe(s);
    // 5. through the guild's chain and the gate (the seam) to the square
    p = at(s, 'piazza', 8, 15);
    ok('chain-open', s.gates.filter((g) => g.id === 'g_chain').every((g) => g.open));
    ok('reach-piazza', await walkTo(dc, s, p.x, { frames: 2400, tol: 30 }) && s.roomId === 'piazza');
    safe(s);
    // 6. the guild hall: Folco, the test piece, the seal
    p = at(s, 'piazza', 13, 15);
    await walkTo(dc, s, p.x, { frames: 400, tol: 18 });
    ok('into-guild', await door(dc, s, 'guild'));
    safe(s);
    p = at(s, 'guild', 39, 12);
    put(s, p.x, p.y);
    await dc.run(20);
    await talk(dc, s);
    ok('trial-set', !!s.F.trial_set);
    p = at(s, 'guild', 36, 12);
    await walkTo(dc, s, p.x, { frames: 300, tol: 14 });
    ok('trial-started', await startEncounterOnE(dc, s));
    pr.trial = await playCraft(dc, s);
    await waitBeats(dc, s);
    ok('guild-master', !!s.F.guild_master);
    p = at(s, 'guild', 38, 12);
    await walkTo(dc, s, p.x, { frames: 300, tol: 10 });
    await dc.run(20);
    await waitBeats(dc, s);
    ok('seal', !!s.F.seal);
    p = at(s, 'guild', 3, 13);
    put(s, p.x + 40, p.y);
    await dc.run(10);
    await walkTo(dc, s, p.x, { frames: 300, tol: 20 });
    await door(dc, s, 'piazza');
    safe(s);
    // 7. the palazzo: Corso (name Bice), the gold along the gallery
    p = at(s, 'piazza', 58, 15);
    await walkTo(dc, s, p.x, { frames: 1500, tol: 18 });
    ok('into-palazzo', await door(dc, s, 'palazzo'));
    safe(s);
    p = at(s, 'palazzo', 38, 12);
    put(s, p.x, p.y);
    await dc.run(20);
    await talk(dc, s, 0);
    ok('commission', !!s.F.commission && !!s.F.choice_bice);
    ok('contract-hud', /ULTRAMARINE II.*GOLD LEAF X/.test(JSON.stringify(hud.get('tool')) || ''));
    p = at(s, 'palazzo', 46, 12);
    await walkTo(dc, s, p.x, { frames: 400, tol: 12 });
    await dc.run(20);
    await waitBeats(dc, s);
    ok('gold-leaf', !!s.F.gold_leaf);
    p = at(s, 'palazzo', 3, 19);
    put(s, p.x + 40, p.y);
    await dc.run(10);
    await walkTo(dc, s, p.x, { frames: 300, tol: 20 });
    await door(dc, s, 'piazza');
    safe(s);
    // 8. the chapel: the first ladder by real input, the cartoon, the deck
    p = at(s, 'piazza', 82, 15);
    await walkTo(dc, s, p.x, { frames: 1600, tol: 18 });
    ok('into-chapel', await door(dc, s, 'chapel'));
    safe(s);
    p = at(s, 'chapel', 21, 37);
    await walkTo(dc, s, p.x, { frames: 600, tol: 6 });
    ok('scaffold-climbed', await climb(dc, s, at(s, 'chapel', 21, 32).y + 4));
    p = at(s, 'chapel', 26, 17);
    put(s, p.x, p.y);
    await dc.run(20);
    p = at(s, 'chapel', 23, 17);
    await walkTo(dc, s, p.x, { frames: 300, tol: 12 });
    await dc.run(20);
    await waitBeats(dc, s);
    ok('cartoon', !!s.F.cartoon);
    await dc.run(30);
    ok('vault-gate-open', s.gates.filter((g) => g.id === 'g_vault').every((g) => g.open));
    p = at(s, 'chapel', 30, 7);
    put(s, p.x, p.y);
    await dc.run(20);
    await talk(dc, s);
    p = at(s, 'chapel', 27, 7);
    await walkTo(dc, s, p.x, { frames: 300, tol: 14 });
    ok('giornata-started', await startEncounterOnE(dc, s));
    await dc.run(5);
    const contract0 = JSON.stringify(hud.get('tool'));
    // paint up to the mantle: the blue and the gold are spent by then
    pr.giornata = await playCraft(dc, s, 20000, () => s.encounters.active && s.encounters.active.engine.state().idx >= 5);
    await dc.run(3);
    const contract1 = JSON.stringify(hud.get('tool'));
    pr.giornata += await playCraft(dc, s, 40000);
    await waitBeats(dc, s, 2400);
    if (!ok('contract-spent', /ULTRAMARINE II/.test(contract0) && /GOLD LEAF X/.test(contract0) && /ULTRAMARINE SPENT/.test(contract1) && /GOLD LEAF SPENT/.test(contract1))) log.push(`(contract ${contract0} → ${contract1})`);
    ok('judged', !!s.F.judged && !!s.F['result:giornata']);
    // 9. the orb on the deck, the ending, the hub
    p = at(s, 'chapel', 24, 7);
    await walkTo(dc, s, p.x, { frames: 300, tol: 10 });
    for (let i = 0; i < 40 && !s.ending.active; i++) {
      dc.hold('jump');
      await dc.run(10);
      dc.release('jump');
      await dc.run(10);
    }
    ok('ending', s.ending.active);
    for (let i = 0; i < 1400 && !s.ending.waitingForReturn; i++) await dc.run(1);
    ok('ending-card', !!s.ending.waitingForReturn && s.ending.caught);
    const minutes = (s.time.now - t0) / 60000;
    dc.press('action', 3);
    for (let i = 0; i < 160 && keyOf(dc) !== 'Hub'; i++) await dc.run(1);
    await dc.run(2);
    const hubSc = dc.scene();
    ok('back-at-station', keyOf(dc) === 'Hub');
    ok('caught-flag', !!getSave().dreams.painter);
    ok('returned-from', hubSc && hubSc.returnedFrom === 'painter');
    uncatch('painter');
    clearRun('painter');
    const pass = log.every((l) => l.endsWith(':ok'));
    return { pass, detail: `${log.join(' ')}; presses ${JSON.stringify(pr)}; scripted run ${minutes.toFixed(1)} min of game time` };
  },
};

export default [board, places, coins, legacy, ladder, playthrough];
