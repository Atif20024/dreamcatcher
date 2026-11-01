// Phase 3a scenarios: the framework, on THE STOPPED HOUR (once the proof
// dream; ?warp=clockmaker:start).
//   clockmaker-playthrough   scripted inputs from the lane to the ending card: walk
//                       (hops when blocked), talk to Wren with [E], the door,
//                       climb to the clock, win the encounter, back out, the
//                       gate opens, up the hill, catch the orb, return to the station
//   clockmaker-seam-dip  walking lane → green through the hedge arch: one dip
//                       through dark, never two backdrops on screen, the room
//                       flips once at full dark, the camera, zoom and layers
//                       jump only under it, control never locked
//   clockmaker-door          [E] at the clock house door fades through black into
//                       the interior at the paired portal, and back out
//   clockmaker-talk-on-e     standing beside Wren never opens the scene box (a bark
//                       may play on the caption bar); [E] does
//   clockmaker-perf          every room under the budget (objects, draw calls), only
//                       the current room + its neighbours live
import { clearRun, getSave, updateSave } from '../../utils/save.js';

// scenarios write to the real save: put a caught dream back on the board
export function uncatch(id) {
  updateSave((s) => {
    if (s.dreams[id]) {
      delete s.dreams[id];
      s.dreamsCaught = Math.max(0, s.dreamsCaught - 1);
    }
  });
}
import { BUDGET } from '../../core/PerfBudget.js';

const T = 32;

async function boot(dc, place = 'start') {
  clearRun('clockmaker');
  dc.warp('clockmaker', place);
  await dc.run(40);
  const s = dc.scene();
  s.invulnUntil = Infinity;
  return s;
}

function put(s, x, y) {
  s.player.setPosition(x, y);
  s.player.body.reset(x, y);
}

// walk toward a world x: hop when blocked or stuck; brake near the target
// (Jo carries momentum: holding a key in the last tile overshoots)
async function walkTo(dc, s, x, { frames = 900, tol = 30 } = {}) {
  let stuck = 0;
  let lastX = s.player.x;
  for (let f = 0; f < frames; f++) {
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

async function jumpTo(dc, s, dir, frames = 18) {
  if (dir) dc.hold(dir);
  dc.hold('jump');
  await dc.run(frames);
  dc.release('jump');
  await dc.run(24);
  dc.releaseAll();
  await dc.run(10);
}

async function talkThrough(dc, s, limit = 1200) {
  for (let i = 0; i < limit && s.sceneBox.active; i += 12) {
    dc.press('action', 2);
    await dc.run(10);
  }
  return !s.sceneBox.active;
}

async function playEncounter(dc, s) {
  let presses = 0;
  for (let i = 0; i < 4000 && s.encounters.busy; i++) {
    const a = s.encounters.active;
    if (a && !a.ending && a.t > 300 && a.engine.state().inWindow) {
      dc.press('interact', 2);
      presses += 1;
      await dc.run(2);
    } else await dc.run(1);
  }
  return presses;
}

const playthrough = {
  id: 'clockmaker-playthrough',
  async run(dc) {
    const log = [];
    const s = await boot(dc);
    const t0 = s.time.now;
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    // 1. the lane, across the seam to Nell
    const nell = () => s.npcs.get('nell');
    let reached = await walkTo(dc, s, (44 + 18) * T - 36, { frames: 1400, tol: 20 });
    ok('reach-nell', reached && s.roomId === 'green' && !!nell());
    ok('no-box-by-proximity', s.sceneBox.opened === 0);
    dc.press('interact', 3);
    await dc.run(10);
    ok('box-on-E', s.sceneBox.active);
    await talkThrough(dc, s);
    ok('met-nell', !!s.F.met_nell);
    // 2. up the terrace steps to the clock house door
    reached = await walkTo(dc, s, (44 + 33) * T + 16, { frames: 900 });
    ok('reach-door', reached);
    dc.press('interact', 3);
    await dc.run(70);
    ok('inside', s.roomId === 'clockhouse');
    // 3. the shelf, the mezzanine, the dial (gear 1)
    await walkTo(dc, s, 15.5 * T, { frames: 600 });
    await jumpTo(dc, s, null, 16);
    await walkTo(dc, s, 17.6 * T, { frames: 200 });
    await jumpTo(dc, s, 'right', 18);
    reached = await walkTo(dc, s, 24 * T + 16, { frames: 400 });
    ok('on-mezzanine', reached && s.player.y < (30 + 8) * T);
    dc.press('interact', 3);
    await dc.run(30);
    ok('encounter-started', s.encounters.busy || !!s.F.clock_wound);
    const presses = await playEncounter(dc, s);
    await dc.run(200);
    ok('gear1', !!s.F.gear1);
    // 4. the hatch; the shaft (Jo is shielded and put on the top plank: the
    // climb and the pendulums are clockmaker-shaft), gear 2, the belfry
    reached = await walkTo(dc, s, 21 * T + 16, { frames: 300, tol: 20 });
    dc.press('interact', 3);
    await dc.run(70);
    ok('in-shaft', s.roomId === 'shaft');
    const place = (room, x, y) => {
      const r = s.graph.room(room);
      put(s, (r.tx + x) * T + 16, (r.ty + y) * T + 10);
    };
    place('shaft', 16, 10);
    await dc.run(20);
    await walkTo(dc, s, (40 + 18) * T + 16, { frames: 200, tol: 14 });
    await dc.run(30);
    ok('gear2', !!s.F.gear2);
    for (let i = 0; i < 500 && s.beats.busy; i++) await dc.run(1);
    await walkTo(dc, s, (40 + 9) * T + 16, { frames: 300, tol: 16 });
    dc.press('interact', 3);
    await dc.run(70);
    ok('in-belfry', s.roomId === 'belfry');
    // 5. gear 3 on the beat: the clock is going, the tick is the music's
    place('belfry', 20, 7);
    await dc.run(20);
    await walkTo(dc, s, (70 + 21) * T + 16, { frames: 200, tol: 16 });
    dc.press('interact', 3);
    await dc.run(30);
    ok('third-gear-started', s.encounters.busy);
    const tickBefore = s.music.cur.tick;
    await playEncounter(dc, s);
    for (let i = 0; i < 700 && s.beats.busy; i++) await dc.run(1);
    await dc.run(10);
    ok('clock-wound', !!s.F.clock_wound);
    ok('tick-starts', !tickBefore && !!s.music.cur.tick);
    ok('gate-still-shut', s.gates.every((g) => !g.open));
    // 6. out on the hill: the shot of the gate; strike seven, a lamp a strike
    await walkTo(dc, s, (70 + 26) * T + 16, { frames: 200, tol: 16 });
    dc.press('interact', 3);
    await dc.run(70);
    ok('on-hill', s.roomId === 'yard');
    await dc.run(30);
    for (let i = 0; i < 500 && s.beats.busy; i++) await dc.run(1);
    await walkTo(dc, s, (100 + 27) * T + 16, { frames: 200, tol: 16 });
    dc.press('interact', 3);
    await dc.run(30);
    ok('strike-started', s.encounters.busy);
    await playEncounter(dc, s);
    for (let i = 0; i < 400 && s.beats.busy; i++) await dc.run(1);
    await dc.run(30);
    ok('struck', !!s.F.struck && !!s.F.lamp_7);
    ok('yard-gate-open', s.gates.filter((g) => g.id === 'g_yard_in').every((g) => g.open));
    ok('no-orb-yet', !s.orb);
    // 7. down through the gate: the town answers, Nell lights the last lamp
    reached = await walkTo(dc, s, (44 + 50) * T + 16, { frames: 1400 });
    for (let i = 0; i < 900 && !s.F.nell_lamp; i++) await dc.run(1);
    for (let i = 0; i < 300 && s.beats.busy; i++) await dc.run(1);
    ok('back-on-green', s.roomId === 'green' && !!s.F.green_lit && !!s.F.nell_lamp);
    // 8. back up the hill, the orb
    reached = await walkTo(dc, s, (100 + 24) * T + 16, { frames: 1800 });
    ok('orb-up', !!s.orb);
    for (let i = 0; i < 60 && !s.ending.active; i++) {
      await jumpTo(dc, s, null, 10);
    }
    ok('ending', s.ending.active);
    for (let i = 0; i < 900 && !s.ending.waitingForReturn; i++) await dc.run(1);
    ok('ending-card', !!s.ending.waitingForReturn && s.ending.caught);
    const minutes = (s.time.now - t0) / 60000;
    dc.press('action', 3);
    // the passing-train wipe (WP6) starts the station under it at its middle
    for (let i = 0; i < 90 && !(dc.scene() && dc.scene().sys.settings.key === 'Hub'); i++) await dc.run(1);
    await dc.run(2);
    const back = dc.scene() && dc.scene().sys.settings.key;
    ok('back-at-station', back === 'Hub');
    // the dream is caught: the save flag, and the hub plays the return
    const hub = dc.scene();
    ok('caught-flag', !!getSave().dreams.clockmaker);
    ok('returned-from', hub && hub.returnedFrom === 'clockmaker');
    for (let i = 0; i < 700 && hub.trains && hub.trains.clockmaker && hub.trains.clockmaker.state !== 'dead' && hub.trains.clockmaker.state !== 'gone'; i++) await dc.run(1);
    await dc.run(30);
    const row = hub.board && hub.board.rows.find((r) => r.platform === 9);
    ok('board-caught', !!row && /CAUGHT/.test(row.status));
    uncatch('clockmaker');
    clearRun('clockmaker');
    const pass = log.every((l) => l.endsWith(':ok'));
    return { pass, detail: `${log.join(' ')}; encounter presses ${presses}; scripted run ${minutes.toFixed(1)} min of game time (the shaft climb skipped)` };
  },
};

// the loose pendulum: the first knock costs nothing and moves Jo; a later one
// costs a heart; none takes the last; the wound clock's cannot touch him
const shaftHazard = {
  id: 'clockmaker-shaft',
  async run(dc) {
    const log = [];
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    const s = await boot(dc, 'shaft');
    ok('in-shaft', s.roomId === 'shaft');
    s.invulnUntil = 0;
    if (s.health.setInvulnerable) s.health.setInvulnerable(s.time.now, 0);
    const works = s.verbs.find((v) => v.mod.id === 'works').ctx.state;
    const def = works.rooms.find((r) => r.r.id === 'shaft').defs[0];
    const r = s.graph.room('shaft');
    const h0 = s.health.hearts;
    // wait for the bob to come through the middle, with Jo standing there
    put(s, (r.tx + def.x) * T + 16, (r.ty + 31) * T + 10);
    for (let i = 0; i < 400 && !(s.F.pendulum_hits >= 1); i++) await dc.run(1);
    ok('first-knock', s.F.pendulum_hits >= 1);
    ok('first-free', s.health.hearts === h0);
    ok('first-moved', Math.abs(s.player.body.velocity.x) > 0 || Math.abs(s.player.x - ((r.tx + def.x) * T + 16)) > 4);
    s.F.clock_wound = true;
    const hits = s.F.pendulum_hits;
    put(s, (r.tx + def.x) * T + 16, (r.ty + 31) * T + 10);
    await dc.run(240);
    ok('wound-harmless', s.F.pendulum_hits === hits);
    clearRun('clockmaker');
    return { pass: log.every((l) => l.endsWith(':ok')), detail: log.join(' ') };
  },
};

const seam = {
  id: 'clockmaker-seam-dip',
  async run(dc) {
    const s = await boot(dc);
    put(s, 34 * T, 14 * T + 10);
    await dc.run(40);
    const rooms = [];
    const cam = s.cameras.main;
    // per-frame changes seen with the screen up (fade < 0.99): the follow only
    let worst = { cam: 0, camY: 0, zoom: 0, layerY: 0 };
    let prev = null;
    let both = 0;
    let swapDark = 1;
    let locked = 0;
    let darkest = 0;
    let prevDark = 0;
    const dips0 = s.transitions.dips;
    dc.hold('right');
    let jumpUntil = -1;
    for (let f = 0; f < 260; f++) {
      // hop when blocked, measuring every frame of the hop too
      if (jumpUntil < 0 && s.player.body.blocked.right && s.player.body.blocked.down) {
        dc.hold('jump');
        jumpUntil = f + 14;
      } else if (f === jumpUntil) {
        dc.release('jump');
        jumpUntil = -1;
      }
      await dc.run(1);
      const dark = cam.fadeEffect.alpha || 0;
      darkest = Math.max(darkest, dark);
      if (s.inputs.suspended) locked += 1;
      const c = s.camDir.center;
      const probe = s.backdrop.probe();
      const shown = new Set(probe.filter((l) => l.alpha > 0.001).map((l) => l.room));
      if (shown.size > 1) both += 1;
      const cur = { x: c.x, y: c.y, zoom: cam.zoom, room: s.roomId, layers: new Map(probe.filter((l) => !l.sky && l.alpha > 0.001).map((l, i) => [`${l.room}:${i}`, l])) };
      if (prev && cur.room !== prev.room) swapDark = Math.min(swapDark, dark);
      if (prev && dark < 0.99 && prevDark < 0.99) {
        worst.cam = Math.max(worst.cam, Math.abs(cur.x - prev.x));
        worst.camY = Math.max(worst.camY, Math.abs(cur.y - prev.y));
        worst.zoom = Math.max(worst.zoom, Math.abs(cur.zoom - prev.zoom));
        for (const [k, l] of cur.layers) {
          const q = prev.layers.get(k);
          if (q) worst.layerY = Math.max(worst.layerY, Math.abs(l.y - q.y));
        }
      }
      prevDark = dark;
      prev = cur;
      if (rooms[rooms.length - 1] !== s.roomId) rooms.push(s.roomId);
    }
    dc.releaseAll();
    const dips = s.transitions.dips - dips0;
    const pass = rooms.join('>') === 'lane>green' && dips === 1 && both === 0 && swapDark >= 0.99 && darkest >= 0.99 && !locked && worst.cam <= 12 && worst.camY <= 6 && worst.zoom <= 0.02 && worst.layerY <= 8;
    const r = (v) => Math.round(v * 1000) / 1000;
    return { pass, detail: `rooms ${rooms.join('>')}; dips ${dips}; frames with two backdrops ${both}; swap at fade ${r(swapDark)}; locked frames ${locked}; worst per-frame with the screen up: cam x ${r(worst.cam)} px, cam y ${r(worst.camY)} px, zoom ${r(worst.zoom)}, layer y ${r(worst.layerY)} px` };
  },
};

const door = {
  id: 'clockmaker-door',
  async run(dc) {
    const s = await boot(dc, 'green');
    put(s, (44 + 33) * T + 16, 12 * T + 10);
    await dc.run(20);
    const cam = s.cameras.main;
    let black = 0;
    dc.press('interact', 3);
    for (let i = 0; i < 60; i++) {
      await dc.run(1);
      black = Math.max(black, cam.fadeEffect.alpha || 0);
    }
    const inside = s.roomId === 'clockhouse';
    const r = s.graph.room('clockhouse');
    const p = s.player;
    const atPortal = Math.abs(p.x - s.graph.portal('clock>green').wx) < 24 && p.y > r.y0 && p.y < r.y1;
    const live = [...s.streamer.live.keys()].sort().join(',');
    const camIn = s.camDir.center.y > r.y0 && s.camDir.center.y < r.y1;
    dc.press('interact', 3);
    await dc.run(60);
    const out = s.roomId === 'green';
    const pass = inside && atPortal && live === 'clockhouse,green,shaft' && camIn && black > 0.95 && out && s.transitions.count === 2;
    return { pass, detail: `inside ${inside}, at paired portal ${atPortal}, live [${live}], camera inside ${camIn}, fade peak ${Math.round(black * 100) / 100}, back out ${out}, transitions ${s.transitions.count}` };
  },
};

const talkOnE = {
  id: 'clockmaker-talk-on-e',
  async run(dc) {
    const s = await boot(dc, 'green');
    const w = s.npcs.get('nell');
    put(s, w.x - 44, 15 * T + 10);
    await dc.run(200);
    const opened = s.sceneBox.opened;
    const bark = s.caption.log.some((l) => l.who === 'nell');
    const prompt = s.interaction.current && s.interaction.current.id;
    dc.press('interact', 3);
    await dc.run(10);
    const onE = s.sceneBox.active;
    const node = s.sceneBox.state().node;
    await talkThrough(dc, s);
    const pass = opened === 0 && !s.dialogActive && bark && prompt === 'npc:nell' && onE && node === 'start';
    return { pass, detail: `box opened by standing near: ${opened}, bark on caption: ${bark}, prompt ${prompt}, opened on E: ${onE} at node ${node}` };
  },
};

const perf = {
  id: 'clockmaker-perf',
  async run(dc) {
    const out = [];
    let ok = true;
    for (const [room, place] of [['lane', 'start'], ['green', 'green'], ['clockhouse', 'clockhouse'], ['shaft', 'shaft'], ['belfry', 'belfry'], ['yard', 'yard']]) {
      const s = await boot(dc, place);
      await dc.run(30);
      const p = s.perf.sample();
      const live = [...s.streamer.live.keys()];
      const allowed = new Set([s.roomId, ...s.graph.neighbours(s.roomId)]);
      const liveOk = live.every((id) => allowed.has(id));
      const total = p.objects + p.ui;
      const good = s.roomId === room && total <= BUDGET.objects && p.drawCalls <= BUDGET.drawCalls && liveOk;
      ok = ok && good;
      out.push(`${room}: ${total} objects, ~${p.drawCalls} draw calls, live [${live.join(',')}], paint ${JSON.stringify(s.streamer.paintMs)}`);
    }
    clearRun('clockmaker');
    return { pass: ok, detail: out.join('; ') };
  },
};

export default [seam, door, talkOnE, perf, shaftHazard, playthrough];
