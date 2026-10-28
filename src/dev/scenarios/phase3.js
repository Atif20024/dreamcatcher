// Phase 3a scenarios: the framework, on THE STOPPED HOUR (once the proof
// dream; ?warp=clockmaker:start).
//   clockmaker-playthrough   scripted inputs from the lane to the ending card: walk
//                       (hops when blocked), talk to Wren with [E], the door,
//                       climb to the clock, win the encounter, back out, the
//                       gate opens, up the hill, catch the orb, return to the station
//   clockmaker-seam-no-snap  walking lane → green: the camera, zoom and every backdrop
//                       layer move continuously; the committed room flips once
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
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    // 1. the lane, across the seam to Wren
    const wren = () => s.npcs.get('wren');
    let reached = await walkTo(dc, s, (44 + 18) * T - 36, { frames: 1400, tol: 20 });
    ok('reach-wren', reached && s.roomId === 'green' && !!wren());
    ok('no-box-by-proximity', s.sceneBox.opened === 0);
    dc.press('interact', 3);
    await dc.run(10);
    ok('box-on-E', s.sceneBox.active);
    await talkThrough(dc, s);
    ok('met-wren', !!s.F.met_wren);
    // 2. up the terrace steps to the clock house door
    reached = await walkTo(dc, s, (44 + 33) * T + 16, { frames: 900 });
    ok('reach-door', reached);
    dc.press('interact', 3);
    await dc.run(70);
    ok('inside', s.roomId === 'clockhouse');
    // 3. the shelf, the mezzanine, the clock
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
    ok('clock-wound', !!s.F.clock_wound);
    // 4. back out (drop off the mezzanine), the gate is open
    reached = await walkTo(dc, s, 4 * T + 16, { frames: 900 });
    dc.press('interact', 3);
    await dc.run(70);
    ok('back-on-green', s.roomId === 'green');
    ok('gate-open', s.gates.length > 0 && s.gates.every((g) => g.open));
    // 5. the bell yard, up the hill, the orb
    reached = await walkTo(dc, s, (100 + 24) * T + 16, { frames: 1800 });
    for (let i = 0; i < 60 && !s.ending.active; i++) {
      await jumpTo(dc, s, null, 10);
    }
    ok('ending', s.ending.active);
    for (let i = 0; i < 900 && !s.ending.waitingForReturn; i++) await dc.run(1);
    ok('ending-card', !!s.ending.waitingForReturn && s.ending.caught);
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
    return { pass, detail: `${log.join(' ')}; encounter presses ${presses}` };
  },
};

const seam = {
  id: 'clockmaker-seam-no-snap',
  async run(dc) {
    const s = await boot(dc);
    put(s, 34 * T, 14 * T + 10);
    await dc.run(40);
    const rooms = [];
    let worst = { cam: 0, camY: 0, zoom: 0, layerY: 0, alpha: 0 };
    let prev = null;
    let both = 0;
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
      const c = s.camDir.center;
      const probe = s.backdrop.probe();
      const cur = { x: c.x, y: c.y, zoom: s.cameras.main.zoom, layers: new Map(probe.filter((l) => !l.sky).map((l, i) => [`${l.room}:${i}`, l])) };
      if (new Set(probe.map((l) => l.room)).size > 1) both += 1;
      if (prev) {
        worst.cam = Math.max(worst.cam, Math.abs(cur.x - prev.x));
        worst.camY = Math.max(worst.camY, Math.abs(cur.y - prev.y));
        worst.zoom = Math.max(worst.zoom, Math.abs(cur.zoom - prev.zoom));
        for (const [k, l] of cur.layers) {
          const q = prev.layers.get(k);
          if (!q) continue;
          worst.layerY = Math.max(worst.layerY, Math.abs(l.y - q.y));
          worst.alpha = Math.max(worst.alpha, Math.abs(l.alpha - q.alpha));
        }
      }
      prev = cur;
      if (rooms[rooms.length - 1] !== s.roomId) rooms.push(s.roomId);
    }
    dc.releaseAll();
    const pass = rooms.join('>') === 'lane>green' && worst.cam <= 12 && worst.camY <= 6 && worst.zoom <= 0.02 && worst.layerY <= 8 && worst.alpha <= 0.1 && both > 10;
    const r = (v) => Math.round(v * 1000) / 1000;
    return { pass, detail: `rooms ${rooms.join('>')}; frames with both backdrops ${both}; worst per-frame: cam x ${r(worst.cam)} px, cam y ${r(worst.camY)} px, zoom ${r(worst.zoom)}, layer y ${r(worst.layerY)} px, alpha ${r(worst.alpha)}` };
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
    const pass = inside && atPortal && live === 'clockhouse,green' && camIn && black > 0.95 && out && s.transitions.count === 2;
    return { pass, detail: `inside ${inside}, at paired portal ${atPortal}, live [${live}], camera inside ${camIn}, fade peak ${Math.round(black * 100) / 100}, back out ${out}, transitions ${s.transitions.count}` };
  },
};

const talkOnE = {
  id: 'clockmaker-talk-on-e',
  async run(dc) {
    const s = await boot(dc, 'green');
    const w = s.npcs.get('wren');
    put(s, w.x - 44, 15 * T + 10);
    await dc.run(200);
    const opened = s.sceneBox.opened;
    const bark = s.caption.log.some((l) => l.who === 'wren');
    const prompt = s.interaction.current && s.interaction.current.id;
    dc.press('interact', 3);
    await dc.run(10);
    const onE = s.sceneBox.active;
    const node = s.sceneBox.state().node;
    await talkThrough(dc, s);
    const pass = opened === 0 && !s.dialogActive && bark && prompt === 'npc:wren' && onE && node === 'start';
    return { pass, detail: `box opened by standing near: ${opened}, bark on caption: ${bark}, prompt ${prompt}, opened on E: ${onE} at node ${node}` };
  },
};

const perf = {
  id: 'clockmaker-perf',
  async run(dc) {
    const out = [];
    let ok = true;
    for (const [room, place] of [['lane', 'start'], ['green', 'green'], ['clockhouse', 'clockhouse'], ['yard', 'yard']]) {
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

export default [seam, door, talkOnE, perf, playthrough];
