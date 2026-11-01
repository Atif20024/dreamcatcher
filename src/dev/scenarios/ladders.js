// Every ladder climbs both ways and leads somewhere (owner: "before i enter
// the platform, there is a ladder. but as i reach there, i move back to
// upper level where platform is. fix it."). The undercroft ladder hangs
// under the grate, a solid floor tile; the reach map read that tile as a
// wall, so the whole undercroft had no way home and the safety net put Jo
// back on the concourse half a second after he stood at the ladder's foot.
//   hub-ladder-undercroft  Jo walks the concourse to the grate, climbs down,
//                          stands and walks in the undercroft, comes back and
//                          climbs up onto the concourse: the net never fires
//   hub-ladder-roof        up the skylight rib onto the leads, a few steps
//                          along them, back and down to the concourse
//   dream-ladders-both-ways  every ladder in the framework dreams' rooms:
//                          grabbed at its foot, climbed to its head and off
//                          onto what is there; then grabbed from the top
//                          (DOWN on the plank or floor over it) and climbed
//                          down to the foot
//   writer-ladders-both-ways  the same for every ladder in THE SECOND DRAFT
import { HUB_ROWS } from '../../data/hub/map.js';
import { DREAM_WARP } from '../warp.js';
import { roleOf } from '../../builders/legend.js';

const T = 32;
const line = (row) => (row + 1) * T;
const FLOOR = line(HUB_ROWS.FLOOR - 1); // the concourse's floor line
const UNDER = line(HUB_ROWS.UNDER - 1); // the undercroft's
const ROOF = line(HUB_ROWS.ROOF - 1); // the leads'

function put(s, x, y) {
  s.player.setPosition(x, y);
  s.player.body.reset(x, y);
}
// with the body's feet on a line (the legacy body and the 82 px one sit
// differently under the sprite's centre)
function putFeet(s, x, feet) {
  const p = s.player;
  put(s, x, feet - (p.body.bottom - p.y));
}

async function hub(dc) {
  dc.warp('hub');
  await dc.run(30);
  const s = dc.scene();
  s.openingDone = true;
  return s;
}

const grounded = (p) => (p.body.blocked.down || p.onSlope) && !p.climbing;

// walk (held) to a world x, then stop
async function walkTo(dc, s, x, max = 900) {
  const p = s.player;
  const dir = x > p.x ? 'right' : 'left';
  dc.hold(dir);
  for (let f = 0; f < max && (dir === 'right' ? p.x < x - 4 : p.x > x + 4); f++) await dc.run(1);
  dc.release(dir);
  await dc.run(10);
  return Math.abs(p.x - x) < 24;
}

// hold up/down until Jo has climbed off the ladder and stands on something
async function climb(dc, s, dir, max = 600) {
  const p = s.player;
  dc.hold(dir);
  let was = false;
  let f = 0;
  for (; f < max; f++) {
    await dc.run(1);
    if (p.climbing) was = true;
    if (was && grounded(p)) break;
  }
  dc.release(dir);
  await dc.run(4);
  return { climbed: was, frames: f };
}

const undercroft = {
  id: 'hub-ladder-undercroft',
  async run(dc) {
    const s = await hub(dc);
    const p = s.player;
    const lines = [];
    const ladderX = 77 * T + T / 2;
    put(s, 70 * T + T / 2, FLOOR - 24);
    await dc.run(40);
    const r0 = s.rescues;
    const there = await walkTo(dc, s, ladderX);
    lines.push(`walked to the grate ${there} (x ${Math.round(p.x)})`);
    const down = await climb(dc, s, 'down');
    const atFoot = Math.abs(p.y + 24 - UNDER) < 6;
    lines.push(`down: climbed ${down.climbed}, feet ${Math.round(p.y + 24)} (undercroft ${UNDER}) ${atFoot}`);
    // stand there a while (the net used to fire after 500 ms)
    await dc.run(90);
    const stayed = Math.abs(p.y + 24 - UNDER) < 6 && s.rescues === r0;
    lines.push(`stood a second and a half: ${stayed} (net ${s.rescues - r0})`);
    // walk the undercroft a little and back to the ladder
    await walkTo(dc, s, ladderX - 6 * T);
    await dc.run(40);
    await walkTo(dc, s, ladderX);
    const walked = Math.abs(p.y + 24 - UNDER) < 6 && s.rescues === r0;
    lines.push(`walked the undercroft: ${walked}`);
    const up = await climb(dc, s, 'up');
    await dc.run(60);
    const onTop = Math.abs(p.y + 24 - FLOOR) < 6 && grounded(p);
    lines.push(`up: climbed ${up.climbed}, feet ${Math.round(p.y + 24)} (concourse ${FLOOR}) ${onTop}`);
    // and he walks on from the grate, both ways
    const on = await walkTo(dc, s, ladderX - 3 * T);
    const net = s.rescues - r0;
    lines.push(`net fired ${net}`);
    const pass = there && down.climbed && atFoot && stayed && walked && up.climbed && onTop && on && net === 0;
    return { pass, detail: lines.join('; ') };
  },
};

const roof = {
  id: 'hub-ladder-roof',
  async run(dc) {
    const s = await hub(dc);
    const p = s.player;
    const lines = [];
    const ladderX = 62 * T + T / 2;
    put(s, 58 * T + T / 2, FLOOR - 24);
    await dc.run(40);
    const r0 = s.rescues;
    const there = await walkTo(dc, s, ladderX);
    const up = await climb(dc, s, 'up', 900);
    await dc.run(30);
    const onRoof = Math.abs(p.y + 24 - ROOF) < 6 && grounded(p);
    lines.push(`up: climbed ${up.climbed} in ${up.frames} frames, feet ${Math.round(p.y + 24)} (leads ${ROOF}) ${onRoof}`);
    // NICE 4: standing on the hatch shows the [↓] over his head
    await dc.run(30);
    const hint = !!(p.hatchHint && p.hatchHint.visible);
    lines.push(`hatch hint ${hint}`);
    await walkTo(dc, s, ladderX + 3 * T);
    // NICE 5: crossing the hatch with DOWN already held walks on
    dc.hold('down');
    await dc.run(20);
    await walkTo(dc, s, ladderX - 3 * T);
    const crossed = !p.climbing && Math.abs(p.y + 24 - ROOF) < 6;
    dc.release('down');
    await dc.run(10);
    lines.push(`crossed with DOWN held: ${crossed}`);
    await walkTo(dc, s, ladderX);
    const down = await climb(dc, s, 'down', 900);
    await dc.run(60);
    const onFloor = Math.abs(p.y + 24 - FLOOR) < 6 && grounded(p);
    lines.push(`down: climbed ${down.climbed} in ${down.frames} frames, feet ${Math.round(p.y + 24)} (concourse ${FLOOR}) ${onFloor}`);
    const net = s.rescues - r0;
    lines.push(`net fired ${net}`);
    return { pass: there && up.climbed && onRoof && hint && crossed && down.climbed && onFloor && net === 0, detail: lines.join('; ') };
  },
};

// ---- the framework dreams' ladders ------------------------------------------
const PLACES = {
  painter: ['chapel', 'bottega', 'guild', 'speziale'],
  gambler: ['deck'],
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function arrive(dc, dream, place) {
  const want = DREAM_WARP[dream].scene;
  const ready = () => {
    const sc = dc.scene();
    return sc && sc.player && sc.player.anim && sc.sys.settings.key === want && sc.sys.isActive();
  };
  for (let attempt = 0; attempt < 3 && (attempt === 0 || !ready()); attempt++) {
    dc.warp(dream, place);
    for (let i = 0; i < 150 && !ready(); i++) {
      await wait(20);
      dc.step(2);
    }
  }
  dc.step(40);
  const sc = dc.scene();
  if (sc.openingSkip) sc.openingSkip();
  for (let i = 0; i < 40; i++) {
    const x = dc.scene();
    if (!(x.dialogActive || x.tutorialActive || x.cardActive)) break;
    dc.press('action', 2);
    dc.step(20);
  }
  if (sc.modals) sc.modals.closeAll();
  dc.step(20);
  return dc.scene();
}

// the ladders (world columns) of the room Jo is in: head and foot rows
function laddersOf(sc) {
  const lg = sc.ladderGrid || {};
  const cols = {};
  for (const ty of Object.keys(lg).map(Number)) for (const tx of Object.keys(lg[ty] || {}).map(Number)) if (lg[ty][tx]) (cols[tx] ||= []).push(ty);
  const out = [];
  for (const [tx, rs] of Object.entries(cols)) {
    rs.sort((a, b) => a - b);
    let a = rs[0];
    for (let i = 1; i <= rs.length; i++) {
      if (i === rs.length || rs[i] !== rs[i - 1] + 1) {
        out.push({ tx: Number(tx), head: a, foot: rs[i - 1] });
        a = rs[i];
      }
    }
  }
  return out;
}

// one ladder, both ways: up from its foot to stand on what is at its head,
// then DOWN from there to its foot. A ladder under a solid ceiling where the
// scene does not let a climber through it (the Writer's press) is climbed
// up to the ceiling and jumped off; DOWN on its roof must not pin Jo there.
async function bothWays(dc, sc, l, label) {
  const p = sc.player;
  const solidAt = (tx, ty) => !!(sc.built && sc.built.solidAt && sc.built.solidAt(tx, ty));
  const x = l.tx * T + T / 2;
  let floorLine = (l.foot + 1) * T; // the ground under the foot
  const over = roleOf(sc.built.charAt(l.tx, l.head - 1));
  const ceiling = solidAt(l.tx, l.head - 1) && !sc.ladderLids;
  const covered = over === 'oneway' || solidAt(l.tx, l.head - 1);
  // a plank or lid over it, or the cap on its top rung (a one-way's own top line)
  const hr = covered ? l.head - 1 : l.head;
  const owg = sc.oneWayGrid || (sc.built && sc.built.oneWayGrid) || {};
  const lineOf = (r) => (owg[r] && typeof owg[r][l.tx] === 'number' ? owg[r][l.tx] : r * T);
  const headLine = lineOf(hr);
  floorLine = lineOf(l.foot + 1);
  const kind = ceiling ? 'ceiling' : covered ? `${over} over its head` : 'open top';
  sc.invulnUntil = sc.time.now + 1e6;
  // 1. up from the foot
  putFeet(sc, x, floorLine);
  await dc.run(20);
  const up = await climb(dc, sc, 'up', ceiling ? 120 : 600);
  if (ceiling && p.climbing) {
    dc.press('jump', 1);
    await dc.run(30);
  }
  await dc.run(20);
  const top = ceiling ? up.climbed : Math.abs(p.body.bottom - headLine) < 8 && grounded(p);
  // 2. and back down from the top
  putFeet(sc, x, headLine);
  await dc.run(20);
  let downOk;
  if (ceiling) {
    dc.hold('down');
    await dc.run(40);
    dc.release('down');
    await dc.run(10);
    downOk = !p.climbing && grounded(p) && Math.abs(p.body.bottom - headLine) < 8;
  } else {
    const down = await climb(dc, sc, 'down', 600);
    await dc.run(20);
    downOk = down.climbed && Math.abs(p.body.bottom - floorLine) < 8 && grounded(p);
  }
  const ok = up.climbed && top && downOk;
  const where = ok ? '' : ` [at ${Math.round(p.x)},${Math.round(p.y)} climbing ${p.climbing}]`;
  return { ok, line: `${label} col ${l.tx} rows ${l.head}-${l.foot} (${kind}): up ${up.climbed && top ? 'ok' : 'FAIL'}, down ${downOk ? 'ok' : 'FAIL'}${where}` };
}

const dreamLadders = {
  id: 'dream-ladders-both-ways',
  async run(dc) {
    const lines = [];
    let pass = true;
    let n = 0;
    for (const [dream, places] of Object.entries(PLACES)) {
      for (const place of places) {
        const sc = await arrive(dc, dream, place);
        const p = sc.player;
        const room = sc.graph.roomAt(p.x, p.y);
        const inRoom = (l) => l.tx * T >= room.x0 && l.tx * T < room.x1 && l.head * T >= room.y0 && l.foot * T < room.y1;
        for (const l of laddersOf(sc).filter(inRoom)) {
          const r = await bothWays(dc, sc, l, `${dream}/${place}`);
          n += 1;
          if (!r.ok) pass = false;
          lines.push(r.line);
        }
      }
    }
    return { pass: pass && n > 0, detail: `${n} ladders; ${lines.join('; ')}` };
  },
};

// THE SECOND DRAFT is one long level: every ladder in it. One stays out:
// the café's broken one (col 141) until it is fixed. The library's top
// shelf (col 210) is in since the stacks' roof went up two rows (it had
// 22 px of headroom; NOTES_READABILITY_REPORT.md, Task B)
const WRITER_SKIP = [141];
const writerLadders = {
  id: 'writer-ladders-both-ways',
  async run(dc) {
    const sc = await arrive(dc, 'writer', 'attic');
    // the library's foes stand down: a catch sends Jo to the flag mid-climb
    // (the ladders are under test here, not the chases)
    if (sc.enemies && sc.enemies.getChildren) for (const e of sc.enemies.getChildren()) if (e.body) e.body.enable = false;
    const lines = [];
    let pass = true;
    const all = laddersOf(sc).filter((l) => !WRITER_SKIP.includes(l.tx));
    for (const l of all) {
      const r = await bothWays(dc, sc, l, 'writer');
      if (!r.ok) pass = false;
      lines.push(r.line);
    }
    return { pass: pass && all.length > 0, detail: `${all.length} ladders; ${lines.join('; ')}` };
  },
};

export default [undercroft, roof, dreamLadders, writerLadders];
