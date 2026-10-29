// Room transitions (docs/redesign/advice/room_transitions_advice.md): no
// seam ever shows two rooms' backdrops; every room change is a short dip
// through dark inside a drawn frame, walked into, never locked.
//   dream-seams-dip       every seam in every framework dream, walked both
//                         ways: one dip each way, the room swapped at full
//                         dark, never two backdrops visible on any frame,
//                         control never locked, Jo still walking after it
//   hub-thresholds-dip    the station's doorway and arches, both ways: the
//                         same, on the parallax (one sprite per slot, one
//                         sky, one face of each wall)
//   hub-threshold-no-flicker  Jo stepping to and fro in each doorway for
//                         120 frames: no room change, no dip
import { clearRun } from '../../utils/save.js';
import { FRAME_HALF } from '../../world/thresholds.js';

const T = 32;
const line = (row) => (row + 1) * T; // the station: the floor line under a tile row
// the flags that open each dream's gates on the way through a seam
const DREAMS = [
  ['clockmaker', { clock_wound: true }],
  ['musician', {}],
  ['painter', { assistant: true }],
];

function put(s, x, y) {
  s.player.setPosition(x, y);
  s.player.body.reset(x, y);
}

// hold a direction until `done()` and the screen is back up; every frame,
// what the eye could see
async function walkThrough(dc, s, dir, done, read, max = 360) {
  const cam = s.cameras.main;
  const out = { both: 0, locked: 0, darkest: 0, swapDark: 1, stopped: 0, frames: 0 };
  let room = read.room();
  dc.hold(dir);
  let hopUntil = -1;
  for (let f = 0; f < max; f++) {
    // hop a kerb or a bin in the way (a frame waits for him to land)
    const b = s.player.body;
    if (hopUntil < 0 && b.blocked.down && (dir === 'right' ? b.blocked.right : b.blocked.left)) {
      dc.hold('jump');
      hopUntil = f + 14;
    } else if (f === hopUntil) {
      dc.release('jump');
      hopUntil = -1;
    }
    await dc.run(1);
    out.frames = f;
    const dark = cam.fadeEffect.alpha || 0;
    out.darkest = Math.max(out.darkest, dark);
    if (read.shown() > 1) out.both += 1;
    if (read.locked()) out.locked += 1;
    const now = read.room();
    if (now !== room) {
      out.swapDark = Math.min(out.swapDark, dark);
      room = now;
    }
    // Jo keeps walking through it (velocity the way he was going)
    if (out.darkest > 0.5 && Math.sign(s.player.body.velocity.x) !== (dir === 'right' ? 1 : -1)) out.stopped += 1;
    if (done() && dark === 0 && out.darkest > 0) break;
  }
  dc.releaseAll();
  await dc.run(4);
  return out;
}

const ok = (w) => w.both === 0 && w.locked === 0 && w.darkest >= 0.99 && w.swapDark >= 0.99 && w.stopped === 0;
const fmt = (w) => `dark ${w.darkest.toFixed(2)}, swap at ${w.swapDark.toFixed(2)}, two-backdrop frames ${w.both}, locked ${w.locked}, stopped ${w.stopped}`;

const dreamSeams = {
  id: 'dream-seams-dip',
  async run(dc) {
    const lines = [];
    let pass = true;
    for (const [dream, flags] of DREAMS) {
      const seams = (await (async () => {
        clearRun(dream);
        dc.warp(dream, 'start');
        await dc.run(40);
        return dc.scene().graph.seams();
      })());
      for (const seam of seams) {
        clearRun(dream);
        dc.warp(dream, seam.left);
        await dc.run(30);
        const s = dc.scene();
        s.invulnUntil = Infinity;
        Object.assign(s.F, flags);
        // where Jo stands at the seam: the left room's portal row
        const p = s.graph.portal(seam.portal);
        const lp = p.room === seam.left ? p : s.graph.partner(seam.portal);
        const y = s.transitions.standAt(lp).y;
        put(s, seam.x - 5 * T, y);
        await dc.run(40);
        while (s.sceneBox.active) {
          dc.press('enter', 2);
          await dc.run(10);
        }
        const read = {
          room: () => s.roomId,
          shown: () => new Set(s.backdrop.probe().filter((l) => l.alpha > 0.001).map((l) => l.room)).size,
          locked: () => s.inputs.suspended,
        };
        const d0 = s.transitions.dips;
        const there = await walkThrough(dc, s, 'right', () => s.roomId === seam.right && s.player.x > seam.x + FRAME_HALF + 24, read);
        const inR = s.roomId === seam.right;
        const back = await walkThrough(dc, s, 'left', () => s.roomId === seam.left && s.player.x < seam.x - FRAME_HALF - 24, read);
        const dips = s.transitions.dips - d0;
        const good = inR && s.roomId === seam.left && dips === 2 && ok(there) && ok(back);
        if (!good) pass = false;
        lines.push(`${dream} ${seam.left}|${seam.right}: ${good ? 'ok' : 'FAIL'} (dips ${dips}; in ${inR ? seam.right : s.roomId}; there: ${fmt(there)}; back: ${fmt(back)})`);
      }
      clearRun(dream);
    }
    return { pass, detail: lines.join('; ') };
  },
};

async function hub(dc) {
  dc.warp('hub');
  await dc.run(30);
  const s = dc.scene();
  s.openingDone = true; // the first visit's vista is not under test here
  return s;
}

// what the station shows: a slot with two sprites up, two skies, a wall
// with both faces, decor of a room off screen
function hubShown(s) {
  const px = s.parallax;
  let n = 1;
  for (const [, slot] of px.slots) n = Math.max(n, slot.pair.filter((sp) => sp.alpha > 0.01).length);
  n = Math.max(n, px.sky.filter((sp) => sp.alpha > 0.01).length);
  for (const w of s.walls) {
    const l = w.d.sides.left[0].visible;
    const r = w.d.sides.right[0].visible;
    if (l === r) n = Math.max(n, 2);
  }
  for (const [room, d] of px.decor) if (room !== s._room && !px.sameSet(room, s._room) && d.scenery.alpha > 0.01) n = Math.max(n, 2);
  return n;
}

const hubThresholds = {
  id: 'hub-thresholds-dip',
  async run(dc) {
    const s = await hub(dc);
    const lines = [];
    let pass = true;
    const read = { room: () => s._room && s._room.id, shown: () => hubShown(s), locked: () => s.time.now < s.player.controlLockUntil };
    for (const f of s.hubFrames.filter((x) => !x.open)) {
      put(s, f.x - 5 * T, line(25) - 24);
      await dc.run(40);
      const d0 = s.dips;
      const there = await walkThrough(dc, s, 'right', () => s._room.id === f.right && s.player.x > f.x + FRAME_HALF + 24, read, 420);
      const inR = s._room.id === f.right;
      const back = await walkThrough(dc, s, 'left', () => s._room.id === f.left && s.player.x < f.x - FRAME_HALF - 24, read, 420);
      const dips = s.dips - d0;
      const good = inR && s._room.id === f.left && dips === 2 && ok(there) && ok(back);
      if (!good) pass = false;
      lines.push(`${f.left}|${f.right}: ${good ? 'ok' : 'FAIL'} (dips ${dips}; there: ${fmt(there)}; back: ${fmt(back)})`);
    }
    return { pass, detail: lines.join('; ') };
  },
};


const hubNoFlicker = {
  id: 'hub-threshold-no-flicker',
  async run(dc) {
    const s = await hub(dc);
    let changes = 0;
    const per = [];
    for (const f of s.hubFrames) {
      put(s, f.x - 4, line(25) - 24);
      await dc.run(20);
      let r = s._room;
      const d0 = s.dips;
      let n = 0;
      for (let i = 0; i < 120; i++) {
        // Jo shuffling in the doorway, never more than a half-tile out of it
        put(s, f.x + Math.sin(i / 4) * (FRAME_HALF - 2), s.player.y);
        await dc.run(1);
        if (s._room !== r) {
          n++;
          r = s._room;
        }
      }
      n += s.dips - d0;
      if (n) per.push(`${f.left}|${f.right}:${n}`);
      changes += n;
    }
    return { pass: changes === 0, detail: `${s.hubFrames.length} doorways x 120 frames, ${changes} room changes or dips${per.length ? ` ${per.join(' ')}` : ''}` };
  },
};

export default [dreamSeams, hubThresholds, hubNoFlicker];
