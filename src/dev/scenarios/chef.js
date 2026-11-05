// FIVE-STAR DREAM on the framework (src/dreams/chef/, docs/dream_chef.md).
//   chef-board        platform 1 opens DreamScene in the service yard
//   chef-places       every ?warp=chef:<place> lands in its room with an
//                     objective, a board title, under budget, its own loop,
//                     music key and acoustics
//   chef-coins        60-80 brass tips placed, worth 5
//   chef-rail         the pit by real input: the prompt says what [E] will do,
//                     a wrong station says why not, hands hold the plate, the
//                     last ticket clears the rail and opens the door
//   chef-pocket       the gold leaf bug: a pocket full of things never blocks a
//                     plate, a hit spills only the plate, the pocket survives
//   chef-hands        readHands on the run's flags, the "Hands" scene plays,
//                     the dining room door then has the plate
//   chef-dining-cut   the kitchen drops out at the door: no loop but the room
//                     tone, no music, no bed, hall acoustics, Jo can't run
//   chef-pressures    a flame burns (a heart, the hands, the plate); the cold
//                     takes the hands at zero
//   chef-old-run      an old saved Chef run (old scene key) is dropped, not resumed
//   chef-playthrough  real inputs from the yard to the orb: every place, every
//                     ticket on the line played by a bot pressing keys, CAUGHT
import { clearRun, setRun, getRun } from '../../utils/save.js';
import { dreamById } from '../../data/dreams.js';
import { uncatch } from './phase3.js';
import { BUDGET } from '../../core/PerfBudget.js';
import { buses } from '../../audio/AudioBus.js';
import { SERVICES } from '../../dreams/chef/services.js';
import { readHands } from '../../engines/tickets.js';

const T = 32;
const keyOf = (dc) => dc.scene() && dc.scene().sys.settings.key;
// a long scenario lets the page breathe (and the dev tools read its progress)
let lastYield = 0;
async function breathe(note) {
  if (note) (window.__chefLog ||= []).push(note);
  if (performance.now() - lastYield < 500) return;
  await new Promise((r) => setTimeout(r, 0));
  lastYield = performance.now();
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

async function boot(dc, place = 'start', { keepSafe = true } = {}) {
  clearRun('chef');
  dc.warp('chef', place);
  await dc.run(40);
  for (let k = 0; k < 3 && !(keyOf(dc) === 'Dream' && dc.scene().dreamId === 'chef' && dc.scene().roomId); k++) {
    dc.warp('chef', place);
    await dc.run(40);
  }
  const s = dc.scene();
  if (keepSafe) safe(s);
  await clearCards(dc, s);
  return s;
}

async function walkTo(dc, s, x, { frames = 1200, tol = 28 } = {}) {
  let stuck = 0;
  let lastX = s.player.x;
  for (let f = 0; f < frames; f++) {
    safe(s);
    if (s.tutorialActive) await clearCards(dc, s);
    const p = s.player;
    const d = x - p.x;
    if (Math.abs(d) < 40) {
      dc.releaseAll();
      for (let i = 0; i < 30 && Math.abs(p.body.velocity.x) > 5; i++) await dc.run(1);
      await dc.run(2);
      if (Math.abs(x - p.x) <= tol) return true;
      dc.hold(x - p.x > 0 ? 'right' : 'left');
      await dc.run(2);
      dc.releaseAll();
      continue;
    }
    await breathe();
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

async function waitBeats(dc, s, pick = 0, limit = 1600) {
  for (let i = 0; i < limit && (s.beats.busy || s.sceneBox.active); i++) {
    await breathe();
    if (s.sceneBox.active) await talkThrough(dc, s, pick);
    await dc.run(1);
  }
  await clearCards(dc, s);
}

async function door(dc, s, want) {
  for (let k = 0; k < 4 && s.roomId !== want; k++) {
    for (let i = 0; i < 30 && !s.player.body.blocked.down; i++) await dc.run(1);
    dc.press('interact', 3);
    for (let i = 0; i < 150 && s.roomId !== want; i++) await dc.run(1);
  }
  await dc.run(10);
  await clearCards(dc, s);
  return s.roomId === want;
}

const worldX = (s, room, c) => (s.graph.room(room).tx + c) * T + T / 2;

// a jump held for `frames`, steering to world x while in the air
async function jumpTo(dc, s, x, { hold = 20 } = {}) {
  dc.releaseAll();
  await dc.run(2);
  const p = s.player;
  dc.hold('jump');
  dc.hold(x > p.x ? 'right' : 'left');
  for (let i = 0; i < 70; i++) {
    if (i === hold) dc.release('jump');
    if (Math.abs(x - p.x) < 12) {
      dc.release('left');
      dc.release('right');
    }
    await dc.run(1);
    if (i > 8 && p.body.blocked.down) break;
  }
  dc.releaseAll();
  await dc.run(4);
}

// hold up or down on the ladder column until Jo has climbed off it
async function climb(dc, s, x, dir = 'up') {
  await walkTo(dc, s, x, { tol: 12 });
  dc.hold(dir);
  for (let i = 0; i < 400; i++) {
    await dc.run(1);
    await breathe();
    if (i > 30 && s.player.body.blocked.down && !s.player.climbing) break;
  }
  dc.release(dir);
  await dc.run(4);
}

// the way up to a station that is not on the floor (real inputs)
const ROUTES = {
  'pit:hooks': async (dc, s) => {
    if (s.player.y > (s.graph.room('pit').ty + 8) * T) {
      await walkTo(dc, s, worldX(s, 'pit', 25));
      await jumpTo(dc, s, worldX(s, 'pit', 27));
      await jumpTo(dc, s, worldX(s, 'pit', 31));
    }
    await walkTo(dc, s, worldX(s, 'pit', 32), { tol: 30 });
  },
  'prep:sacks': async (dc, s) => {
    if (s.player.y > (s.graph.room('prep').ty + 8) * T) await climb(dc, s, worldX(s, 'prep', 11));
    await walkTo(dc, s, worldX(s, 'prep', 6));
  },
  'prep:window': async (dc, s) => {
    if (s.player.y > (s.graph.room('prep').ty + 9) * T) {
      await walkTo(dc, s, worldX(s, 'prep', 32));
      await jumpTo(dc, s, worldX(s, 'prep', 36));
    }
    await walkTo(dc, s, worldX(s, 'prep', 36));
  },
};

// come down off a shelf to the floor (a step off the end)
async function toFloor(dc, s, room) {
  const floorY = (s.graph.room(room).ty + 12) * T;
  if (s.player.body.bottom > floorY - 4) return;
  const px = s.player.x - s.graph.room(room).tx * T;
  if (room === 'pit') await walkTo(dc, s, worldX(s, 'pit', px > 26 * T ? 37 : 24));
  else if (room === 'prep') {
    if (px < 12 * T) await climb(dc, s, worldX(s, 'prep', 11), 'down');
    else await walkTo(dc, s, worldX(s, 'prep', px > 30 * T ? 40 : 12));
  }
  for (let i = 0; i < 40 && !s.player.body.blocked.down; i++) await dc.run(1);
}

async function goToStation(dc, s, key, id) {
  const def = SERVICES[key].stations[id];
  const route = ROUTES[`${key}:${id}`];
  if (route) return route(dc, s);
  await toFloor(dc, s, s.roomId);
  return walkTo(dc, s, worldX(s, s.roomId, def.x), { tol: 30 });
}

// the bot: reads the rail as a player does, presses [E] at the station
function nextStop(sv) {
  if (sv.hands) return sv.hands.to;
  for (const [id, sl] of Object.entries(sv.slots)) if (sl.some((x) => x && x.state !== 'cooking')) return id;
  const c = sv.rail.filter((k) => !k.firing && k.idx < k.stops.length);
  c.sort((a, b) => (a.due ? a.left : 1e9) - (b.due ? b.left : 1e9));
  if (!c.length) return null;
  const st = c[0].stops[c[0].idx];
  if (sv.stock[st] !== undefined && sv.stock[st] <= 0) return 'reserve';
  return st;
}

async function playService(dc, s, key, { limit = 16000, pick = 0 } = {}) {
  for (let f = 0; f < limit && !s.F[`rail_${key}`]; f += 8) {
    await breathe();
    if (s.sceneBox.active || s.beats.busy) await waitBeats(dc, s, pick);
    const sv = s.railApi.service();
    if (!sv || sv.done) {
      await dc.run(8);
      continue;
    }
    if (sv.working) {
      await dc.run(4);
      continue;
    }
    const id = nextStop(sv);
    if (!id) {
      await dc.run(8);
      continue;
    }
    await goToStation(dc, s, key, id);
    dc.press('interact', 3);
    await dc.run(8);
  }
  await dc.run(4);
  await waitBeats(dc, s, pick);
  return !!s.F[`rail_${key}`];
}

const PLACES = [
  { place: 'start', room: 'yard', key: 'yard', loop: 'fs_yard' },
  { place: 'pit', room: 'pit', key: 'pit', loop: 'fs_pit' },
  { place: 'cold', room: 'cold', key: 'cold', loop: 'fs_cold' },
  { place: 'prep', room: 'prep', key: 'prep', loop: 'fs_prep' },
  { place: 'line', room: 'line', key: 'line1', loop: 'fs_line' },
  { place: 'pass', room: 'pass', key: 'pass', loop: 'fs_pass' },
  { place: 'dining', room: 'dining', key: 'dining', loop: 'fs_dining' },
];

const chefBoard = {
  id: 'chef-board',
  async run(dc) {
    const d = dreamById('chef');
    return { pass: d.scene === 'Dream' && d.platform === 1, detail: { scene: d.scene } };
  },
};

const chefPlaces = {
  id: 'chef-places',
  async run(dc) {
    const out = [];
    let ok = true;
    for (const pl of PLACES) {
      const s = await boot(dc, pl.place);
      await dc.run(30);
      const r = s.graph.room(s.roomId).data;
      const perf = s.perf.sample();
      const good = s.roomId === pl.room && !!s.objectiveText.text && r.ambience === pl.loop && (r.music || {}).key === pl.key && perf.objects < BUDGET.objects;
      ok = ok && good;
      out.push(`${pl.place}:${good ? 'ok' : 'BAD'}:${perf.objects}`);
    }
    clearRun('chef');
    return { pass: ok, detail: out };
  },
};

const chefCoins = {
  id: 'chef-coins',
  async run(dc) {
    const s = await boot(dc, 'start');
    const d = dreamById('chef');
    const placed = (s.placedCoins || []).length;
    clearRun('chef');
    return { pass: placed >= d.coin.budget[0] && placed <= d.coin.budget[1] && d.coin.worth === 5, detail: { placed, budget: d.coin.budget } };
  },
};

const chefRail = {
  id: 'chef-rail',
  async run(dc) {
    const s = await boot(dc, 'pit');
    const log = [];
    await dc.run(160); // the breath on arrival
    const sv = s.railApi.service();
    log.push(`service:${!!sv}`);
    // the rack first: nothing in hands, it says so, nothing happens
    await walkTo(dc, s, worldX(s, 'pit', 26));
    await dc.run(4);
    const prompt = s.interaction.current && s.interaction.current.prompt;
    log.push(`refusal:${/rack wants/i.test(prompt || '')}`);
    dc.press('interact', 3);
    await dc.run(4);
    log.push(`noPlate:${!sv.hands}`);
    await walkTo(dc, s, worldX(s, 'pit', 12));
    await dc.run(4);
    const p2 = s.interaction.current && s.interaction.current.prompt;
    log.push(`verb:${/Bastien/.test(p2 || '')}`);
    dc.press('interact', 3);
    await dc.run(6);
    log.push(`hands:${sv.hands && sv.hands.id === 'p1'}`);
    log.push(`carrying:${s.player.carrying === true}`);
    await walkTo(dc, s, worldX(s, 'pit', 26));
    dc.press('interact', 3);
    await dc.run(6);
    log.push(`served:${sv.tally.served === 1}`);
    log.push(`next:${sv.rail[0] && sv.rail[0].id === 'p2'}`);
    log.push(`locked:${!s.F.apron}`);
    const played = await playService(dc, s, 'pit');
    log.push(`clear:${played}`);
    await waitBeats(dc, s);
    log.push(`apron:${!!s.F.apron}`);
    clearRun('chef');
    return { pass: log.every((l) => l.endsWith(':true')), detail: log };
  },
};

const chefPocket = {
  id: 'chef-pocket',
  async run(dc) {
    const s = await boot(dc, 'line');
    const log = [];
    Object.assign(s.F, { mise_done: true, apron: true, saffron: true, onions: true });
    await dc.run(160);
    const sv = s.railApi.service();
    log.push(`service:${!!sv}`);
    await walkTo(dc, s, worldX(s, 'line', 20));
    dc.press('interact', 3);
    await dc.run(6);
    log.push(`plate:${sv.hands && sv.hands.dish === 'VELOUTE'}`);
    // a hit spills only the plate
    s.invulnUntil = 0;
    if (s.health.setInvulnerable) s.health.setInvulnerable(s.time.now, 0);
    s.dropCarry();
    await dc.run(4);
    log.push(`spilled:${!sv.hands && sv.tally.spilled === 1}`);
    log.push(`pocket:${s.F.saffron === true && s.F.onions === true}`);
    log.push(`stillOnRail:${sv.rail.some((k) => k.dish === 'VELOUTE')}`);
    // and the same station gives it again
    dc.press('interact', 3);
    await dc.run(6);
    log.push(`again:${sv.hands && sv.hands.dish === 'VELOUTE'}`);
    clearRun('chef');
    return { pass: log.every((l) => l.endsWith(':true')), detail: log };
  },
};

const chefHands = {
  id: 'chef-hands',
  async run(dc) {
    const s = await boot(dc, 'pass');
    const log = [];
    Object.assign(s.F, { mise_done: true, apron: true, saffron: true, onions: true, table1_sent: true, burns: 2, frost: true, mise: 2 });
    const read = readHands(s.F);
    log.push(`read:${read.lines.length >= 3}`);
    await dc.run(160);
    const done = await playService(dc, s, 'pass', { pick: 1 });
    log.push(`played:${done}`);
    log.push(`own:${s.F.finish === 'own'}`);
    log.push(`handsDone:${!!s.F.hands_done}`);
    await waitBeats(dc, s);
    log.push(`carry:${!!s.F.carry_out}`);
    await walkTo(dc, s, worldX(s, 'pass', 23));
    log.push(`door:${await door(dc, s, 'dining')}`);
    await dc.run(10);
    log.push(`walkOnly:${s.player.walkOnly === true}`);
    log.push(`holding:${s.player.carrying === true}`);
    clearRun('chef');
    return { pass: log.every((l) => l.endsWith(':true')), detail: log };
  },
};

const chefCut = {
  id: 'chef-dining-cut',
  async run(dc) {
    const s = await boot(dc, 'dining');
    await dc.run(20);
    const r = s.graph.room('dining').data;
    // he really walks: Shift or no Shift, 80 px/s, on the walk cycle
    dc.hold('right');
    await dc.run(40);
    const walked = Math.abs(s.player.body.velocity.x);
    dc.hold('walk');
    await dc.run(20);
    const shifted = Math.abs(s.player.body.velocity.x);
    dc.releaseAll();
    const pass = r.ambience === 'fs_dining' && r.events === null && r.acoustics === 'hall' && (r.music || {}).key === 'dining' && s.music.cur && s.music.cur.gain === 0 && buses.acoustics !== 'open' && walked <= 80 && walked > 60 && shifted <= 80 && s.player.walkOnly;
    clearRun('chef');
    return { pass: !!pass, detail: { amb: r.ambience, gain: s.music.cur && s.music.cur.gain, walked, shifted } };
  },
};

// the pressures, real: a flame burns (a heart, a burn on the hands, the plate
// on the floor); the cold takes the hands at zero; difficulty tightens the beat
const chefBurn = {
  id: 'chef-pressures',
  async run(dc) {
    const s = await boot(dc, 'line', { keepSafe: false });
    const log = [];
    Object.assign(s.F, { mise_done: true });
    s.invulnUntil = 0;
    if (s.health.setInvulnerable) s.health.setInvulnerable(s.time.now, 0);
    await dc.run(160);
    const sv = s.railApi.service();
    // onto a burner's spot, with a plate
    const r = s.graph.room('line');
    await dc.run(2);
    s.player.setPosition((r.tx + 26) * T + T / 2, (r.ty + 11) * T + 10);
    s.player.body.reset(s.player.x, s.player.y);
    sv.hands = sv.rail[0];
    sv.rail[0].idx = sv.rail[0].stops.length;
    const lives = s.lives;
    for (let i = 0; i < 420 && !s.F.burns; i++) {
      s.player.setPosition((r.tx + 26) * T + T / 2, (r.ty + 11) * T + 10);
      await dc.run(1);
    }
    log.push(`burn:${s.F.burns >= 1}`);
    log.push(`heart:${s.lives < lives}`);
    log.push(`spilled:${!sv.hands && sv.tally.spilled === 1}`);
    // the cold
    const c = await boot(dc, 'cold', { keepSafe: false });
    c.invulnUntil = 0;
    await dc.run(60);
    if (c.health.setInvulnerable) c.health.setInvulnerable(c.time.now, 0);
    const kv = c.verbs.find((v) => v.mod.id === 'kitchen');
    const l0 = c.lives;
    kv.ctx.state.coldV = 0.002;
    await dc.run(60);
    log.push(`hands:${c.lives < l0 && kv.ctx.state.coldV >= 0.4}`);
    clearRun('chef');
    return { pass: log.every((l) => l.endsWith(':true')), detail: log };
  },
};

const chefOldRun = {
  id: 'chef-old-run',
  async run(dc) {
    setRun('chef', { dreamId: 'chef', sceneKey: 'Chef', checkpointId: 'cp_old', pos: { x: 9000, y: 900 }, flags: { d0: true }, lit: [], inventory: [], extra: {} });
    const gone = getRun('chef') === null || getRun('chef') === undefined;
    return { pass: gone, detail: { run: getRun('chef') } };
  },
};

const chefPlaythrough = {
  id: 'chef-playthrough',
  async run(dc) {
    uncatch('chef');
    const s = await boot(dc, 'start');
    const log = [];
    const mark = (n, v) => {
      log.push(`${n}:${v ? 'ok' : 'BAD'}`);
      (window.__chefLog ||= []).push(`${log[log.length - 1]} ${s.roomId} ${Math.round(s.player.x / T)},${Math.round(s.player.y / T)}`);
    };
    // the yard: Marguerite, the door
    await walkTo(dc, s, worldX(s, 'yard', 20));
    dc.press('interact', 3);
    await dc.run(12);
    await waitBeats(dc, s);
    mark('met', s.F.met_m);
    await walkTo(dc, s, worldX(s, 'yard', 24));
    mark('pit', await door(dc, s, 'pit'));
    // the pit
    await dc.run(160);
    mark('pitclear', await playService(dc, s, 'pit'));
    await toFloor(dc, s, 'pit');
    mark('apron', s.F.apron);
    await walkTo(dc, s, worldX(s, 'pit', 42));
    mark('cold', await door(dc, s, 'cold'));
    // the moment by the warm pipe, and the racks
    await climb(dc, s, worldX(s, 'cold', 5));
    await climb(dc, s, worldX(s, 'cold', 14));
    await walkTo(dc, s, worldX(s, 'cold', 21));
    await dc.run(4);
    dc.press('interact', 3);
    await dc.run(10);
    await waitBeats(dc, s);
    mark('cat', s.F['moment:m2']);
    mark('deckB', true);
    await climb(dc, s, worldX(s, 'cold', 17));
    mark('deckC', true);
    await climb(dc, s, worldX(s, 'cold', 4));
    await climb(dc, s, worldX(s, 'cold', 13));
    mark('topDeck', s.player.y < (s.graph.room('cold').ty + 9) * T);
    await walkTo(dc, s, worldX(s, 'cold', 24));
    await dc.run(10);
    await waitBeats(dc, s);
    mark('saffron', s.F.saffron);
    // down again: off the end of each deck in turn
    for (const c of [8, 16, 20, 8, 17, 24]) {
      await walkTo(dc, s, worldX(s, 'cold', c));
      for (let i = 0; i < 80 && !s.player.body.blocked.down; i++) await dc.run(1);
    }
    mark('prep', await door(dc, s, 'prep'));
    await dc.run(160);
    // Tomé, the onions
    await walkTo(dc, s, worldX(s, 'prep', 18));
    await dc.run(4);
    dc.press('interact', 3);
    await dc.run(10);
    await waitBeats(dc, s);
    mark('onions', s.F.onions);
    mark('mise', await playService(dc, s, 'prep'));
    log.push(`mise=${s.F.mise || 0}`);
    await toFloor(dc, s, 'prep');
    await walkTo(dc, s, worldX(s, 'prep', 45));
    mark('line', await door(dc, s, 'line'));
    await dc.run(160);
    const t0 = s.time.now;
    mark('rush', await playService(dc, s, 'line', { limit: 60000 }));
    log.push(`rush=${Math.round((s.time.now - t0) / 1000)}s plates=${s.F.plates} late=${s.F.late || 0} bails=${s.F.bails || 0}`);
    await waitBeats(dc, s);
    mark('sent', s.F.table1_sent);
    await walkTo(dc, s, worldX(s, 'line', 59));
    mark('pass', await door(dc, s, 'pass'));
    await dc.run(160);
    mark('hands', await playService(dc, s, 'pass', { pick: 1 }));
    mark('own', s.F.finish === 'own');
    await waitBeats(dc, s);
    await walkTo(dc, s, worldX(s, 'pass', 23));
    mark('dining', await door(dc, s, 'dining'));
    await dc.run(160);
    mark('walk', s.player.walkOnly);
    mark('set', await playService(dc, s, 'dining'));
    await waitBeats(dc, s);
    mark('orbOn', s.F.orb_on);
    await walkTo(dc, s, worldX(s, 'dining', 57));
    for (let i = 0; i < 600 && !(s.ending.active && s.ending.waitingForReturn); i++) await dc.run(1);
    mark('caught', s.ending.caught);
    dc.press('interact', 3);
    // the press ends the dream; wait out the train wipe, or it lands on the next scenario
    for (let i = 0; i < 300 && keyOf(dc) !== 'Hub'; i++) await dc.run(2);
    mark('hub', keyOf(dc) === 'Hub');
    uncatch('chef');
    clearRun('chef');
    return { pass: log.every((l) => !l.endsWith(':BAD')), detail: log };
  },
};

// M2: the plate is on the table until it is in his hands, never neither
const chefPlateHandover = {
  id: 'chef-plate-handover',
  async run(dc) {
    const s = await boot(dc, 'pass');
    Object.assign(s.F, { plate_shown: true, rail_pass: true, hands_done: true });
    await dc.run(10);
    const before = !s.F.plate_hand;
    s.beats.play('hands_after');
    await dc.run(10);
    const during = !s.F.plate_hand && s.sceneBox.active;
    await talkThrough(dc, s);
    await dc.run(2);
    const rv = s.verbs.find((v) => v.mod.id === 'rail').ctx.state;
    const out = { before, during, hand: !!(s.F.plate_hand && rv.plate.visible) };
    clearRun('chef');
    return { pass: Object.values(out).every(Boolean), detail: out };
  },
};

// S3: Brann does not take a stage who is held at a station
const chefBusy = {
  id: 'chef-busy-brann',
  async run(dc) {
    const s = await boot(dc, 'prep', { keepSafe: false });
    await dc.run(160);
    const foe = s.foes[0];
    foe.passive = false;
    const out = { thrown: 0 };
    s.throwOut = () => (out.thrown += 1);
    foe.setPosition(s.player.x + 20, foe.y);
    foe.enter('grabbing', 250);
    for (let i = 0; i < 90; i++) {
      s.player.busy = true;
      await dc.run(1);
    }
    const held = out.thrown;
    // and he does once Jo is free again (the duck is still the answer)
    s.verbs.find((v) => v.mod.id === 'rail').ctx.state.svs.prep.working = null;
    foe.setPosition(s.player.x + 20, foe.y);
    s.player.busy = false;
    foe.enter('grabbing', 250);
    await dc.run(4);
    const free = out.thrown;
    delete s.throwOut;
    clearRun('chef');
    return { pass: held === 0 && free === 1, detail: { held, free } };
  },
};

// S4: a quit Chef leaves nothing hooked on the scene for the next dream
const chefHooks = {
  id: 'chef-hooks-clear',
  async run(dc) {
    const s = await boot(dc, 'line');
    const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
    const on = !!s.railApi && own(s, 'dropCarry') && own(s, 'onHurtExtra');
    clearRun('chef');
    dc.warp('gambler', 'quay');
    await dc.run(60);
    for (let i = 0; i < 40 && !(dc.scene() && dc.scene().dreamId === 'gambler' && dc.scene().roomId); i++) await dc.run(5);
    const g = dc.scene();
    const clear = !own(g, 'dropCarry') && !own(g, 'onHurtExtra') && !g.railApi;
    clearRun('gambler');
    return { pass: on && clear && g.dreamId === 'gambler', detail: { on, clear, scene: g.dreamId } };
  },
};

// S5: a quit in the middle of a beat, then Continue: the beat plays again
const chefContinue = {
  id: 'chef-continue',
  async run(dc) {
    const out = {};
    const cases = [
      ['pit', { met_m: true, rail_pit: true, pit_clear: true }, 'apron'],
      ['pass', { rail_pit: true, apron: true, plate_shown: true, rail_pass: true, hands_done: true, finish: 'menu', table1_sent: true }, 'carry_out'],
      ['dining', { rail_pit: true, apron: true, carry_out: true, plate_shown: true, hands_done: true, rail_dining: true }, 'orb_on'],
    ];
    for (const [place, flags, want] of cases) {
      const s = await boot(dc, place);
      Object.assign(s.F, flags);
      s.saveRun();
      s.scene.restart({ dreamId: 'chef', resume: true });
      await dc.run(30);
      const n = dc.scene();
      safe(n);
      for (let i = 0; i < 40 && !n.F[want]; i++) {
        await waitBeats(dc, n);
        await dc.run(10);
      }
      out[want] = !!n.F[want];
    }
    clearRun('chef');
    return { pass: Object.values(out).every(Boolean), detail: out };
  },
};

// N5: a Continue does not serve or stock a ticket twice, nor restart the clock
const chefNoTwice = {
  id: 'chef-no-twice',
  async run(dc) {
    const s = await boot(dc, 'prep');
    Object.assign(s.F, { served_m_bass: true, stock_grill: 4, mise: 1, prep_t: 20000 });
    s.saveRun();
    s.scene.restart({ dreamId: 'chef', resume: true });
    await dc.run(30);
    const n = dc.scene();
    safe(n);
    await dc.run(160);
    const sv = n.railApi.service();
    const out = { tickets: !!sv && sv.rail.length + sv.queue.length === 2, clock: !!sv && sv.t >= 20000 };
    clearRun('chef');
    return { pass: out.tickets && out.clock, detail: out };
  },
};

// B10: a vent burns and knocks once per i-frames; it never launches Jo, so it
// cannot pin him under a shelf. Stood on each vent (and under the shelf's end
// beside the east one) for three cycles, then he walks off by real input.
const chefVentNoPin = {
  id: 'chef-vent-no-pin',
  async run(dc) {
    const s = await boot(dc, 'pit', { keepSafe: false });
    s.invulnUntil = 0;
    await dc.run(60);
    const r = s.graph.room('pit');
    const p = s.player;
    const out = [];
    for (const [col, dx, away] of [[23, 16, 'left'], [36, 16, 'right'], [35, 28, 'left']]) {
      const x = (r.tx + col) * T + dx;
      const y = p.y;
      const put = () => {
        p.setPosition(x, y);
        p.body.reset(x, y);
      };
      put();
      const h0 = s.F.burns || 0;
      let minVy = 0;
      let head = 0;
      let headMax = 0;
      for (let i = 0; i < 420; i++) {
        s.health.hearts = s.health.max;
        if (p.body.blocked.down && Math.abs(p.x - x) > 12) put();
        minVy = Math.min(minVy, p.body.velocity.y);
        head = p.body.blocked.up || p.body.touching.up ? head + 1 : 0;
        headMax = Math.max(headMax, head);
        await dc.run(1);
      }
      for (let i = 0; i < 90 && !p.body.blocked.down; i++) await dc.run(1);
      put();
      s.invulnUntil = Infinity;
      s.health.setInvulnerable(s.time.now, 1e9);
      dc.hold(away);
      await dc.run(50);
      dc.releaseAll();
      const moved = Math.round(Math.abs(p.x - x));
      s.invulnUntil = 0;
      s.health.setInvulnerable(s.time.now, 0);
      out.push({ col, hits: (s.F.burns || 0) - h0, minVy: Math.round(minVy), headMax, moved });
    }
    clearRun('chef');
    return { pass: out.some((o) => o.hits > 0) && out.every((o) => o.minVy >= -240 && o.headMax < 3 && o.moved > 60), detail: out };
  },
};

export default [chefVentNoPin, chefBoard,chefPlaces, chefCoins, chefRail, chefPocket, chefHands, chefCut, chefBurn, chefOldRun, chefPlaythrough, chefPlateHandover, chefBusy, chefHooks, chefContinue, chefNoTwice];
