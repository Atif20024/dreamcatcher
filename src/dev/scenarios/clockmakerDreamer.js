// THE STOPPED HOUR's dreamer and its wheels (docs/dream_clockmaker_dreamer.md).
//   clockmaker-playthrough   scripted inputs from the lane to the station: every
//                       train hung by hand (the climb, the knocks and the carrying
//                       are real), "go home" under the bell, the door, the orb
//   clockmaker-choice-stays  the same with "strike it with me": he stays at the rope,
//                       counts, waits at his door, and the ending's line differs
//   clockmaker-wheels   the verb's edges: wrong way, three that touch, fouling, set
//                       down, a knock drops it, a door sends it home, saved runs
//   clockmaker-length   the whole dream at a reader's pace, talking to everyone:
//                       a bot's number, with no looking around or thinking in it
import { clearRun, getSave } from '../../utils/save.js';
import { boot, put, walkTo as walk, jumpTo, playEncounter, uncatch } from './phase3.js';

const T = 32;
// a long scripted run must let the page breathe (microtasks alone never do)
const breathe = () => new Promise((r) => setTimeout(r));
const walkTo = async (...a) => {
  const r = await walk(...a);
  await breathe();
  return r;
};

function bot(dc, s, { pick = 0, read = false } = {}) {
  const b = {
    log: [],
    rooms: {},
    ok(k, v) {
      b.log.push(`${k}:${v ? 'ok' : 'FAIL'}`);
      // the time since the last check goes to the room Jo is in now
      const now = s.time.now;
      b.rooms[s.roomId] = (b.rooms[s.roomId] || 0) + (now - (b.last ?? now));
      b.last = now;
      window.__dcClock = b.log; // its progress can be read from outside
      // the first thing wrong ends the run (the rest would only wait out its timeouts)
      if (!v) throw new Error(b.log.join(' '));
      return v;
    },
    wx: (room, col) => (s.graph.room(room).tx + col) * T + 16,
    // a conversation: at a reader's pace the line types out and then sits
    async talk() {
      for (let i = 0; i < 400 && s.sceneBox.active; i++) {
        await breathe();
        const box = s.sceneBox;
        if (box.choosing) {
          box.choiceIdx = pick;
          box.renderChoices();
          if (read) await dc.run(180);
        } else if (read) {
          for (let k = 0; k < 900 && box.active && box.shown < box.full.length; k++) await dc.run(1);
          await dc.run(36);
        } else await dc.run(16);
        if (!s.sceneBox.active) break;
        dc.press('action', 2);
        await dc.run(4);
      }
    },
    async quiet() {
      for (let i = 0; i < 6000 && (s.beats.busy || s.sceneBox.active || s.transitions.busy); i++) {
        if (s.sceneBox.active) await b.talk();
        else await dc.run(1);
        if (i % 60 === 0) await breathe();
      }
    },
    async use() {
      dc.press('interact', 3);
      await dc.run(8);
    },
    async door() {
      await b.use();
      await dc.run(70);
      await b.quiet();
    },
    // talk to someone, if they are there
    async chat(id) {
      const n = s.npcs.get(id);
      if (!n) return false;
      // (he may have paced on while Jo was walking over)
      for (let i = 0; i < 4 && Math.abs(n.x - s.player.x) > 60; i++) await walkTo(dc, s, n.x - 36, { frames: 900, tol: 20 });
      await b.use();
      await b.talk();
      await b.quiet();
      return true;
    },
    train: (id) => s.verbs.find((v) => v.mod.id === 'wheels').ctx.state.trains.find((t) => t.def.id === id),
    // at a peg or wheel, [E]; `want` is the interaction that must be under the hand
    async at(x, want, tol = 12) {
      await walkTo(dc, s, x, { frames: 900, tol });
      await dc.run(2);
      const cur = s.interaction.current;
      if (!cur || cur.id !== want) return false;
      await b.use();
      return true;
    },
    async peg(t, id) {
      const a = t.def.arbors.find((p) => p.id === id);
      return b.at(t.ox + a.x, `peg:${t.def.id}:${id}`);
    },
  };
  return b;
}

// ---- the shaft's floors, by the row Jo stands on, and the ladder between each ----
const FLOORS = [32, 25, 18, 11];
const LADDERS = { 32: 17, 25: 7, 18: 14 }; // the ladder up from each floor (room column)

const BOB_ON = { 32: 0, 25: 1, 18: 2 }; // which pendulum swings over each floor

// what a person does: watch the bob, and go when it is up at the end of its swing
async function watchBob(dc, s, floor) {
  const d = s.graph.room('shaft').data.pendulums[BOB_ON[floor]];
  if (!d) return;
  for (let i = 0; i < 300 && Math.abs(Math.sin((2 * Math.PI * s.time.now) / d.period)) < 0.97; i++) await dc.run(1);
}

async function climbTo(dc, s, b, target) {
  const r = s.graph.room('shaft');
  const p = s.player;
  const level = () => FLOORS.reduce((best, f) => (Math.abs((p.body.bottom - r.ty * T) / T - f) < Math.abs((p.body.bottom - r.ty * T) / T - best) ? f : best), FLOORS[0]);
  for (let guard = 0; guard < 40 && level() !== target; guard++) {
    const here = level();
    const up = target < here;
    const lad = up ? LADDERS[here] : LADDERS[here + 7];
    await watchBob(dc, s, here);
    if (!(await walkTo(dc, s, b.wx('shaft', lad), { frames: 500, tol: 6 }))) continue;
    // the chain: straight after the bob has gone by, and up
    if (lad === LADDERS[18]) {
      const T3 = s.graph.room('shaft').data.pendulums[2].period;
      for (let i = 0; i < 400 && Math.abs(((s.time.now / T3) % 0.5) - 0.06) > 0.012; i++) await dc.run(1);
    }
    const dir = up ? 'up' : 'down';
    dc.hold(dir);
    let was = false;
    for (let f = 0; f < 300; f++) {
      await dc.run(1);
      if (p.climbing) was = true;
      if (was && p.body.blocked.down && !p.climbing) break;
    }
    dc.release(dir);
    await dc.run(6);
  }
  return level() === target;
}

// a wheel from where it lies to its peg, past whatever knocks it off him
async function carryUp(dc, s, b, t, wheelId, peg) {
  for (let tries = 0; tries < 20 && !Object.values(t.st.hung).includes(wheelId); tries++) {
    if (t.st.carried !== wheelId) {
      const l = t.st.lying[wheelId];
      const floor = FLOORS.find((f) => Math.abs((l.y + 32) / T - f) < 1.5);
      await climbTo(dc, s, b, floor);
      await watchBob(dc, s, floor);
      await walkTo(dc, s, t.ox + l.x, { frames: 500, tol: 14 });
      await b.use();
      if (t.st.carried !== wheelId) continue;
    }
    await climbTo(dc, s, b, 11);
    if (t.st.carried === wheelId) await b.peg(t, peg);
  }
  return Object.values(t.st.hung).includes(wheelId);
}

// ---- the whole dream ---------------------------------------------------------------
async function fullRun(dc, opts = {}) {
  clearRun('clockmaker');
  const s = await boot(dc);
  const b = bot(dc, s, opts);
  const { ok } = b;
  const p = s.player;
  const t0 = s.time.now;
  s.invulnUntil = 0; // the knocks are part of it (none takes the last heart)
  // 1. the lane; for the long run, what is there to do in it
  if (opts.read) {
    await b.at(b.wx('lane', 4), 'moment:m_table', 20);
    await b.quiet();
    await walkTo(dc, s, b.wx('lane', 23), { frames: 900, tol: 30 });
    await dc.run(240);
    dc.press('KeyQ', 3);
    await dc.run(180);
    // (the puddle dip is in front of him: a hop, which walkTo won't do this near its target)
    await walkTo(dc, s, b.wx('lane', 36), { frames: 600, tol: 20 });
    await jumpTo(dc, s, 'right', 18);
    await b.chat('watch');
  }
  await walkTo(dc, s, b.wx('green', 18) - 36, { frames: 1400, tol: 20 });
  ok('at-nell', s.roomId === 'green');
  if (opts.read) await b.chat('pie');
  await b.chat('nell');
  ok('met-nell', !!s.F.met_nell);
  // 2. the clock house, the bench: no dial until the wheels are hung
  await walkTo(dc, s, b.wx('green', 33), { frames: 900 });
  await b.door();
  ok('inside', s.roomId === 'clockhouse');
  const ch = s.graph.room('clockhouse');
  await b.chat('keeper_bench');
  ok('met-keeper', !!s.F.met_keeper);
  const bench = b.train('bench');
  ok('dial-shut', !s.interaction.items.get('enc:clockwork').enabled());
  ok('take-floor-wheel', await b.at(bench.ox + 480, 'wheel:bench1', 16));
  ok('carrying', bench.st.carried === 'bench1');
  // the wrong way first, as anyone will: one wheel across the top
  ok('hang-a', await b.peg(bench, 'a'));
  ok('wrong-way', !s.F.bench_done && !bench.st.carried);
  await dc.run(opts.read ? 240 : 30);
  ok('lift-a', await b.peg(bench, 'a'));
  ok('hang-b', await b.peg(bench, 'b'));
  await walkTo(dc, s, 15.5 * T, { frames: 600 });
  await jumpTo(dc, s, null, 16);
  ok('take-shelf-wheel', await b.at(bench.ox + 512, 'wheel:bench2', 16));
  ok('hang-c', await b.peg(bench, 'c'));
  await b.quiet();
  ok('bench-runs', !!s.F.bench_done);
  // 3. the shelf, the mezzanine, the dial
  await walkTo(dc, s, 15.5 * T, { frames: 600 });
  await jumpTo(dc, s, null, 16);
  await walkTo(dc, s, 17.6 * T, { frames: 200 });
  await jumpTo(dc, s, 'right', 18);
  await walkTo(dc, s, 24 * T + 16, { frames: 400 });
  ok('on-mezzanine', p.y < (ch.ty + 8) * T);
  await b.use();
  await dc.run(20);
  ok('dial', s.encounters.busy);
  await playEncounter(dc, s);
  await b.quiet();
  ok('gear1', !!s.F.gear1);
  await walkTo(dc, s, 21 * T + 16, { frames: 300, tol: 20 });
  await b.door();
  // 4. the shaft: the wheels up past the bobs, the cage, the gear
  ok('in-shaft', s.roomId === 'shaft');
  const shaftT = b.train('shaft');
  ok('hang-big', await carryUp(dc, s, b, shaftT, 'shaft_big', 'p1'));
  ok('hang-small', await carryUp(dc, s, b, shaftT, 'shaft_small', 'p2'));
  await b.quiet();
  ok('cage-up', !!s.F.shaft_train);
  await walkTo(dc, s, b.wx('shaft', 18), { frames: 200, tol: 14 });
  await dc.run(30);
  ok('gear2', !!s.F.gear2);
  await b.quiet();
  await walkTo(dc, s, b.wx('shaft', 9), { frames: 300, tol: 16 });
  await b.door();
  ok('in-belfry', s.roomId === 'belfry');
  // 5. the bell chamber: four wheels from four places, then he says why
  const bt = b.train('belfry');
  const floorRow = 12;
  const onFloor = async () => {
    // off the west end of the gallery (or the east end of the joists), down to the floor
    const up = () => (p.body.bottom - s.graph.room('belfry').ty * T) / T < floorRow - 0.5;
    const x16 = b.wx('belfry', 16);
    for (let tries = 0; tries < 4 && up(); tries++) {
      const dir = p.x > x16 ? 'left' : 'right';
      dc.hold(dir);
      for (let f = 0; f < 400 && up() && (dir === 'left' ? p.x > x16 : p.x < x16); f++) await dc.run(1);
      dc.release(dir);
      await dc.run(40);
    }
  };
  const toJoists = async () => {
    await onFloor();
    await walkTo(dc, s, b.wx('belfry', 14), { frames: 400, tol: 12 });
    await jumpTo(dc, s, null, 16);
  };
  const toGallery = async () => {
    await toJoists();
    await walkTo(dc, s, b.wx('belfry', 15), { frames: 100, tol: 8 });
    await jumpTo(dc, s, 'right', 18);
  };
  for (const [wheel, peg, fetch] of [
    ['bell1', 's3', onFloor],
    ['bell2', 's4', toJoists],
    ['bell3', 's5', toGallery],
    ['bell4', 's6', toGallery],
  ]) {
    for (let tries = 0; tries < 10 && !Object.values(bt.st.hung).includes(wheel); tries++) {
      if (bt.st.carried !== wheel) {
        const l = bt.st.lying[wheel];
        // (a knock may have moved it: then it is on the floor)
        await (l.y > 320 ? onFloor : fetch)();
        await walkTo(dc, s, bt.ox + l.x, { frames: 600, tol: 14 });
        await b.use();
        if (bt.st.carried !== wheel) continue;
      }
      await onFloor();
      await b.peg(bt, peg);
    }
    ok(`hung-${wheel}`, Object.values(bt.st.hung).includes(wheel));
  }
  await b.quiet();
  ok('belfry-runs', !!s.F.belfry_train);
  await toGallery();
  ok('heard', await b.chat('keeper_sat'));
  ok('the-choice', opts.pick ? !!s.F.keeper_stays && !s.F.keeper_goes : !!s.F.keeper_goes && !s.F.keeper_stays);
  ok('gear3-given', !!s.F.gear3_given);
  await walkTo(dc, s, b.wx('belfry', 21), { frames: 200, tol: 16 });
  await b.use();
  await dc.run(20);
  ok('third-gear', s.encounters.busy);
  const tickBefore = s.music.cur.tick;
  await playEncounter(dc, s);
  await dc.run(10);
  await b.quiet();
  await dc.run(5);
  ok('clock-wound', !!s.F.clock_wound);
  ok('tick-starts', !tickBefore && !!s.music.cur.tick);
  ok('he-went-out', !!s.F.keeper_out && !s.npcs.get('keeper_rise'));
  ok('gate-still-shut', s.gates.every((g) => !g.open));
  // 6. the hill: strike seven
  await walkTo(dc, s, b.wx('belfry', 26), { frames: 200, tol: 16 });
  await b.door();
  ok('on-hill', s.roomId === 'yard');
  await dc.run(30);
  await b.quiet();
  const hill = s.npcs.get('keeper_hill');
  const hx0 = hill ? hill.x : 0;
  await walkTo(dc, s, b.wx('yard', 27), { frames: 200, tol: 16 });
  await b.use();
  await dc.run(20);
  ok('strike', s.encounters.busy);
  await playEncounter(dc, s);
  if (opts.pick) ok('he-stayed-at-the-rope', Math.abs(hill.x - hx0) < 2);
  else ok('he-went-down-the-hill', hill.x < hx0 - 16 * T && Math.abs(hill.y - (s.graph.room('yard').ty * T + 16 * T)) < 4);
  await dc.run(10);
  await b.quiet();
  await dc.run(30);
  ok('struck', !!s.F.struck && !!s.F.lamp_7);
  ok('yard-gate-open', s.gates.filter((g) => g.id === 'g_yard_in').every((g) => g.open));
  ok('no-orb-yet', !s.orb);
  // 7. the green: Nell's lamp, "you're late", he walks on
  await walkTo(dc, s, b.wx('green', 50), { frames: 1400 });
  for (let i = 0; i < 900 && !s.F.green_lit; i++) await dc.run(1);
  ok('green-lit', s.roomId === 'green' && !!s.F.nell_lamp && !!s.F.green_lit);
  if (opts.read) await b.chat('nell');
  ok('objective-lane', /down the lane/.test(s.objectiveText ? s.objectiveText.text : 'down the lane'));
  // 8. his door
  await walkTo(dc, s, b.wx('lane', 10), { frames: 1800, tol: 20 });
  for (let i = 0; i < 300 && !s.beats.busy && !s.F.home; i++) await dc.run(1);
  if (opts.pick) ok('he-waits-at-the-door', !!s.npcs.get('keeper_door') || !!s.F.home);
  else ok('he-is-already-in', !s.npcs.get('keeper_door'));
  await b.quiet();
  ok('home', !!s.F.home);
  ok('orb-on-step', !!s.orb && s.roomId === 'lane');
  await dc.run(10);
  ok('met-for-the-evening', !!getSave().met.ansel);
  await walkTo(dc, s, b.wx('lane', 7), { frames: 600, tol: 20 });
  for (let i = 0; i < 40 && !s.ending.active; i++) await jumpTo(dc, s, null, 10);
  ok('ending', s.ending.active);
  for (let i = 0; i < 1200 && !s.ending.waitingForReturn; i++) await dc.run(1);
  ok('ending-card', !!s.ending.waitingForReturn && s.ending.caught);
  return { s, b, ms: s.time.now - t0, hits: s.F.pendulum_hits || 0, hearts: s.health.hearts };
}

const playthrough = {
  id: 'clockmaker-playthrough',
  async run(dc) {
    const { s, b, ms, hits, hearts } = await fullRun(dc, { pick: 0 });
    b.ok('ending-line', /Nobody saw him go in/.test(s.def.ending.lines(s.F).join(' ')));
    dc.press('action', 3);
    for (let i = 0; i < 90 && !(dc.scene() && dc.scene().sys.settings.key === 'Hub'); i++) await dc.run(1);
    await dc.run(2);
    const hub = dc.scene();
    b.ok('back-at-station', hub && hub.sys.settings.key === 'Hub');
    b.ok('caught-flag', !!getSave().dreams.clockmaker);
    b.ok('returned-from', hub && hub.returnedFrom === 'clockmaker');
    for (let i = 0; i < 700 && hub.trains && hub.trains.clockmaker && hub.trains.clockmaker.state !== 'dead' && hub.trains.clockmaker.state !== 'gone'; i++) await dc.run(1);
    await dc.run(30);
    const row = hub.board && hub.board.rows.find((r) => r.platform === 9);
    b.ok('board-caught', !!row && /CAUGHT/.test(row.status));
    uncatch('clockmaker');
    clearRun('clockmaker');
    return { pass: b.log.every((l) => l.endsWith(':ok')), detail: `${b.log.join(' ')}; ${(ms / 60000).toFixed(1)} min of game time, no reading; ${hits} knocks, ${hearts} hearts left; ${Object.entries(b.rooms).map(([k, v]) => `${k} ${(v / 1000).toFixed(0)}s`).join(', ')}` };
  },
};

const stays = {
  id: 'clockmaker-choice-stays',
  async run(dc) {
    const { s, b, ms } = await fullRun(dc, { pick: 1 });
    b.ok('ending-line', /someone saw him do it/.test(s.def.ending.lines(s.F).join(' ')));
    uncatch('clockmaker');
    clearRun('clockmaker');
    return { pass: b.log.every((l) => l.endsWith(':ok')), detail: `${b.log.join(' ')}; ${(ms / 60000).toFixed(1)} min` };
  },
};

const length = {
  id: 'clockmaker-length',
  async run(dc) {
    const { b, ms, hits } = await fullRun(dc, { pick: 0, read: true });
    const rooms = Object.entries(b.rooms).map(([k, v]) => `${k} ${(v / 1000).toFixed(0)}s`).join(', ');
    uncatch('clockmaker');
    clearRun('clockmaker');
    return { pass: b.log.every((l) => l.endsWith(':ok')), detail: `${(ms / 60000).toFixed(1)} min of game time at a reader's pace, talking to everyone; a bot: no thinking at the wall, no looking around, no wrong turns; ${hits} knocks; ${rooms}` };
  },
};

const wheels = {
  id: 'clockmaker-wheels',
  async run(dc) {
    const s = await boot(dc, 'clockhouse');
    const b = bot(dc, s);
    const { ok } = b;
    const verb = s.verbs.find((v) => v.mod.id === 'wheels').ctx.state;
    const bench = b.train('bench');
    ok('no-wheel-before-he-speaks', !s.interaction.items.get('wheel:bench1').enabled());
    s.F.met_keeper = true;
    // on his back; set down with nothing else in reach, it lies on the floor under him
    ok('take', await b.at(bench.ox + 480, 'wheel:bench1', 16));
    await walkTo(dc, s, 8 * T, { frames: 400, tol: 20 });
    await dc.run(2);
    ok('down-offered', s.interaction.current && s.interaction.current.id === 'wheel:down');
    await b.use();
    ok('down', !bench.st.carried && bench.st.lying.bench1.y === 13 * T - 32);
    ok('stored-as-a-string', typeof s.F.train_bench === 'string');
    // the wrong way, then three that touch: neither runs, both judder, both lift off
    await b.at(bench.ox + bench.st.lying.bench1.x, 'wheel:bench1', 16);
    ok('hang', await b.peg(bench, 'a'));
    ok('pawl-holds', !s.F.bench_done && bench.judder > 0);
    await dc.run(40);
    const a0 = bench.imgs.bench1.img.rotation;
    await dc.run(40);
    ok('held-means-still', Math.abs(bench.imgs.bench1.img.rotation - a0) < 0.001);
    await walkTo(dc, s, 15.5 * T, { frames: 600 });
    await jumpTo(dc, s, null, 16);
    await b.at(bench.ox + 512, 'wheel:bench2', 16);
    ok('hang-second', await b.peg(bench, 'b'));
    ok('locked', bench.judder > 0 && !s.F.bench_done);
    await b.peg(bench, 'b');
    ok('carried', bench.st.carried === 'bench2');
    // a saved run, continued: the wall comes back as it was, and nothing on his back
    s.saveRun();
    window.history.replaceState(null, '', window.location.pathname);
    dc.scene().scene.start('Dream', { dreamId: 'clockmaker', resume: true });
    for (let i = 0; i < 200 && !(dc.scene() && dc.scene() !== s && dc.scene().player && dc.scene().verbs); i++) {
      await breathe();
      dc.step(1);
    }
    await dc.run(10);
    const again = dc.scene();
    const t2 = again.verbs.find((v) => v.mod.id === 'wheels').ctx.state.trains.find((t) => t.def.id === 'bench');
    ok('continue-wall', t2.st.hung.a === 'bench1');
    ok('continue-empty-handed', !t2.st.carried && t2.st.lying.bench2.x === 512);
    ok('continue-flag', !!again.F.met_keeper);
    await this.doors(dc, ok);
    clearRun('clockmaker');
    return { pass: b.log.every((l) => l.endsWith(':ok')), detail: b.log.join(' ') };
  },
  async doors(dc, ok) {
    const s = await boot(dc, 'clockhouse');
    const b = bot(dc, s);
    const verb = s.verbs.find((v) => v.mod.id === 'wheels').ctx.state;
    const bench = b.train('bench');
    s.F.met_keeper = true;
    await b.at(bench.ox + 480, 'wheel:bench1', 16);
    ok('carried-again', bench.st.carried === 'bench1');
    // through a door a wheel does not go: it goes home
    verb.carrying = bench;
    s.roomId = 'green';
    await dc.run(2);
    s.roomId = 'clockhouse';
    ok('home-through-a-door', !bench.st.carried && bench.st.lying.bench1.x === 480);
    // the shaft: a wheel that fouls stays on his back; a knock drops it
    const s2 = await boot(dc, 'shaft');
    const b2 = bot(dc, s2);
    const v2 = s2.verbs.find((v) => v.mod.id === 'wheels');
    const sh = b2.train('shaft');
    const r = s2.graph.room('shaft');
    await walkTo(dc, s2, sh.ox + 416, { frames: 200, tol: 16 });
    await b2.use();
    ok('shaft-take', sh.st.carried === 'shaft_big');
    put(s2, r.tx * T + 480, (r.ty + 11) * T - 24);
    await dc.run(10);
    const fouls = s2.interaction.current && s2.interaction.current.id === 'peg:shaft:p2';
    await b2.use();
    ok('fouls-stays-on-back', fouls && sh.st.carried === 'shaft_big');
    put(s2, r.tx * T + 8 * 32, (r.ty + 25) * T - 24);
    await dc.run(10);
    s2.F.pendulum_hits = (s2.F.pendulum_hits || 0) + 1;
    await dc.run(30);
    ok('knock-drops-it', !sh.st.carried && sh.st.lying.shaft_big.y === 25 * T - 32 && !!v2);
  },
};

export default [playthrough, stays, wheels, length];
