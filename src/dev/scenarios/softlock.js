// The station's soft-lock (owner: "i went using ladder, on top, and fell
// down. now i have nowhere to go"). The roof stopped one tile short of the
// service gate, and a drop off its end landed in a two-tile shaft behind the
// gate with no way out. The east end wall now runs from the leads to the
// earth, and a safety net puts Jo back on safe ground if he is ever stuck.
//   hub-roof-drops      Jo walks off every edge of the roof (and the clock
//                       tower and the water tower on it), lands, and is
//                       somewhere with a way back to the hall; the net never
//                       has to fire on a real route
//   hub-safety-net      below the undercroft floor, or standing in a cell
//                       with no way home: one short dip, back on safe ground
import { HUB_ROWS } from '../../data/hub/map.js';

const T = 32;
const line = (row) => (row + 1) * T;

function put(s, x, y) {
  s.player.setPosition(x, y);
  s.player.body.reset(x, y);
}

async function hub(dc) {
  dc.warp('hub');
  await dc.run(30);
  const s = dc.scene();
  s.openingDone = true; // the first visit's vista is not under test here
  return s;
}

// every edge up top: a feet cell on the leads (or a tower on them) with no
// footing beside it, and the way off it
function roofEdges(s) {
  const g = s.reach;
  const out = [];
  for (let r = 0; r <= HUB_ROWS.ROOF; r++) {
    for (let c = 0; c < g.W; c++) {
      if (!g.node(c, r)) continue;
      if (c > 0 && !g.node(c - 1, r)) out.push({ c, r, dir: 'left' });
      if (c < g.W - 1 && !g.node(c + 1, r)) out.push({ c, r, dir: 'right' });
      if (c === g.W - 1) out.push({ c, r, dir: 'right' }); // the east end, against the wall
    }
  }
  return out;
}

const roofDrops = {
  id: 'hub-roof-drops',
  async run(dc) {
    const s = await hub(dc);
    const lines = [];
    let pass = true;
    const edges = roofEdges(s);
    for (const e of edges) {
      put(s, e.c * T + T / 2, line(e.r) - 24);
      s.safeGround = { x: s.player.x, y: s.player.y };
      await dc.run(10);
      const r0 = s.rescues;
      dc.hold(e.dir);
      await dc.run(40);
      dc.release(e.dir);
      // let him land (the longest drop, roof to concourse, is under a second)
      let f = 0;
      for (; f < 120 && !(s.player.body.blocked.down || s.player.onSlope || s.player.climbing); f++) await dc.run(1);
      await dc.run(45);
      const p = s.player;
      const home = s.atHome(p);
      const fired = s.rescues - r0;
      const good = home && fired === 0;
      if (!good) pass = false;
      const at = `${Math.floor(p.x / T)},${Math.floor((p.y + 24) / T) - 1}`;
      lines.push(`${e.dir} off ${e.c},${e.r} -> ${at}: ${good ? 'ok' : `FAIL (home ${home}, net ${fired})`}`);
    }
    // and the old trap itself: the cells behind the gate are wall now
    const g = s.reach;
    const shaft = [165, 166].some((c) => g.node(c, HUB_ROWS.FLOOR + 1));
    if (shaft) pass = false;
    lines.push(`shaft behind the gate: ${shaft ? 'OPEN (FAIL)' : 'walled'}`);
    return { pass: pass && edges.length >= 6, detail: `${edges.length} edges; ${lines.join('; ')}` };
  },
};

const safetyNet = {
  id: 'hub-safety-net',
  async run(dc) {
    const s = await hub(dc);
    const lines = [];
    let pass = true;
    const safe = { x: 50 * T + T / 2, y: line(HUB_ROWS.FLOOR - 1) - 24 };
    const rescueFrom = async (label, setup) => {
      put(s, safe.x, safe.y);
      await dc.run(30);
      s.safeGround = { ...safe };
      const r0 = s.rescues;
      const undo = setup();
      let f = 0;
      for (; f < 180 && s.rescues === r0; f++) await dc.run(1);
      await dc.run(30); // the dip comes back up
      if (undo) undo();
      const p = s.player;
      const back = Math.abs(p.x - safe.x) < 4 && Math.abs(p.y - safe.y) < 8;
      const good = s.rescues === r0 + 1 && back && !s.rescuing && s._room && s._room.id === 'hall';
      if (!good) pass = false;
      lines.push(`${label}: ${good ? 'ok' : 'FAIL'} (net ${s.rescues - r0} after ${f} frames, at ${Math.round(p.x)},${Math.round(p.y)}, room ${s._room && s._room.id})`);
    };
    // fell below the playable floor (under the undercroft)
    await rescueFrom('below the floor', () => {
      put(s, 120 * T, line(HUB_ROWS.UNDER) + 3 * T);
      return null;
    });
    // standing somewhere the reach map has no way home from (a stand-in
    // pocket: the cells round a spot on the platforms are taken out of home)
    await rescueFrom('stuck in a pocket', () => {
      const c = 100;
      const r = HUB_ROWS.FLOOR - 1;
      const g = s.reach;
      const was = s.homeCells;
      const fake = new Set(was);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) fake.delete((r + dy) * g.W + c + dx);
      s.homeCells = fake;
      put(s, c * T + T / 2, line(r) - 24);
      return () => (s.homeCells = was);
    });
    return { pass, detail: lines.join('; ') };
  },
};

export default [roofDrops, safetyNet];
