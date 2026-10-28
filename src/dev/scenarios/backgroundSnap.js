// F#4 / T2a / F§5.2: room transitions are a continuous blend driven by the
// camera centre, never a swap.
//   background-snap     walking left out of the gambler's floor, no parallax
//                       layer moves more than 8 px between frames
//   blend-continuity    the camera crosses every room boundary in each place;
//                       no visible layer y jump > 8 px, no alpha jump > 0.1,
//                       no zoom jump > 0.02 per frame
//   boundary-no-flicker the camera wobbling on a boundary for 120 frames
//                       never changes the committed room
const T = 32;
const DREAMS = [
  ['hub', null],
  ['chef', null],
  ['musician_legacy', null],
  ['astronaut', null],
  ['writer', null],
  ['painter', null],
  ['gambler', null],
  ['evening', null],
];

const busy = (sc) => !sc || sc.dialogActive || sc.tutorialActive || sc.cardActive || sc.puzzleActive || sc.paused;

function settle(dc) {
  for (let i = 0; i < 40; i++) {
    const sc = dc.scene();
    if (sc && !busy(sc)) break;
    dc.press('enter', 2);
    dc.press('action', 2);
    dc.step(20);
  }
}

async function enter(dc, dream, place) {
  dc.warp(dream, place);
  dc.step(60);
  // a scene with a preload (the Evening) is still loading: give it real time
  for (let i = 0; i < 50 && !(dc.scene() && dc.scene().built); i++) {
    await new Promise((r) => setTimeout(r, 100));
    dc.step(2);
  }
  for (let i = 0; i < 40; i++) {
    const sc = dc.scene();
    if (sc && !(sc.dialogActive || sc.tutorialActive || sc.cardActive || (sc.modals && sc.modals.state && sc.modals.state().length))) break;
    dc.press('enter', 2);
    dc.press('action', 2);
    dc.step(20);
  }
  dc.step(5);
  return dc.scene();
}

// every backdrop object whose y/alpha the eye can follow, keyed stably
function sample(sc) {
  const out = {};
  const cam = sc.cameras.main;
  out.zoom = { y: 0, a: cam.zoom, zoom: true };
  const px = sc.parallax;
  if (px) {
    // sky is opaque: what the eye sees of a sprite is its alpha times what
    // the sprites above it leave uncovered
    let cover = 0;
    for (const s of [...px.sky].sort((a, b) => b.depth - a.depth)) {
      out[`sky${px.sky.indexOf(s)}:${s.bgName}`] = { y: s.y, a: s.alpha * (1 - cover) };
      cover += s.alpha * (1 - cover);
    }
    for (const [name, slot] of px.slots) slot.pair.forEach((s, i) => (out[`${name}${i}:${s.bgName}`] = { y: s.y, a: s.alpha }));
    for (const [room, d] of px.decor) {
      out[`scenery:${room.id}`] = { y: d.scenery.y, a: d.scenery.alpha };
      if (d.landmark) out[`landmark:${room.id}`] = { y: d.landmark.y, a: d.landmark.alpha };
    }
  } else if (sc.horizon) {
    for (const [name, b] of Object.entries(sc.horizon.bands)) out[`band:${name}`] = { y: b.ts.y, a: b.ts.alpha };
  }
  return out;
}

// pin the camera centre (follow off) so the scene's own update sees it
function aim(sc, cx) {
  const cam = sc.cameras.main;
  cam.stopFollow();
  if (cam.panEffect) cam.panEffect.reset();
  if (cam.zoomEffect && cam.zoomEffect.isRunning) cam.zoomEffect.reset();
  // clamped as the camera itself will clamp it, so the scene never sees a
  // scroll position that is never rendered
  const x = cx - cam.width / 2;
  cam.scrollX = cam.useBounds ? cam.clampX(x) : x;
}

function crossAll(dc, sc) {
  const rooms = sc.built.rooms;
  const worst = { y: 0, a: 0, z: 0, where: '' };
  let crossed = 0;
  for (let i = 1; i < rooms.length; i++) {
    const b = rooms[i]._bx ?? rooms[i]._x0 * T; // the edge the camera can reach
    for (const dir of [1, -1]) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const r = crossOne(dc, sc, b, dir, rooms[i].id, worst);
        if (r === 'frozen') {
          settle(dc); // a card or a conversation stopped the world mid-crossing: redo it
          continue;
        }
        if (r) crossed++;
        break;
      }
    }
  }
  return { worst, crossed, n: (rooms.length - 1) * 2 };
}

// one camera pass across boundary b; true if the blend's middle was seen
function crossOne(dc, sc, b, dir, id, worstOut) {
  const px = sc.parallax;
  const worst = { ...worstOut };
  let cx = b - dir * 300;
  aim(sc, cx);
  dc.step(3);
  let prev = sample(sc);
  let sawMid = false;
  for (let f = 0; f < 150; f++) {
    cx += dir * 4;
    aim(sc, cx);
    const fr = px && px.frames;
    dc.step(1);
    if (busy(sc) || (px && px.frames === fr)) return 'frozen';
    const cur = sample(sc);
    for (const k of Object.keys(cur)) {
      const p = prev[k];
      const c = cur[k];
      // a sprite that was or is invisible may be re-textured/re-hung: its y is not seen
      const dz = c.zoom ? Math.abs(c.a - (p ? p.a : c.a)) : 0;
      const da = c.zoom ? 0 : Math.abs(c.a - (p ? p.a : 0));
      const dy = p && p.a > 0.01 && c.a > 0.01 && !c.zoom ? Math.abs(c.y - p.y) : 0;
      if (dy > worst.y) Object.assign(worst, { y: dy, where: `${k} @${id}` });
      if (da > worst.a) Object.assign(worst, { a: da, whereA: `${k} @${id}` });
      if (dz > worst.z) Object.assign(worst, { z: dz, whereZ: `@${id} dir ${dir} f ${f}` });
    }
    for (const k of Object.keys(prev)) if (!cur[k] && prev[k].a > 0.1 && !prev[k].zoom) worst.a = Math.max(worst.a, prev[k].a);
    prev = cur;
    const t = sc.parallax && sc.parallax.blend ? sc.parallax.blend.t : 0.5;
    if (t > 0.3 && t < 0.7) sawMid = true;
  }
  Object.assign(worstOut, worst);
  return sawMid;
}

function wobble(dc, sc) {
  const rooms = sc.built.rooms;
  let changes = 0;
  const per = [];
  for (let i = 1; i < rooms.length; i++) {
    const b = rooms[i]._bx ?? rooms[i]._x0 * T; // the edge the camera can reach
    aim(sc, b - 4);
    dc.step(5);
    let r = sc._room;
    let n = 0;
    for (let f = 0; f < 120; f++) {
      // standing on the line, plus a follow-lerp sized wobble across it
      aim(sc, b + Math.sin(f / 4) * 20);
      dc.step(1);
      if (sc._room !== r) {
        n++;
        r = sc._room;
      }
    }
    if (n) per.push(`${rooms[i].id}:${n}`);
    changes += n;
  }
  return { changes, per };
}

async function each(dc, fn) {
  const lines = [];
  let pass = true;
  for (const [dream, place] of DREAMS) {
    let r;
    try {
      r = fn(await enter(dc, dream, place), dream);
    } catch (e) {
      r = { pass: false, detail: `threw ${e.message} (scenes ${window.game.scene.getScenes(true).map((x) => x.sys.settings.key)})` };
    }
    if (!r.pass) pass = false;
    lines.push(`${dream}: ${r.pass ? 'ok' : 'FAIL'} (${r.detail})`);
    dc.releaseAll();
  }
  return { pass, detail: lines.join('; ') };
}

const backgroundSnap = {
  id: 'background-snap',
  async run(dc) {
    dc.warp('gambler', 'floor');
    dc.step(30);
    dc.press('Enter', 2); // dismiss any first-time tutorial card
    dc.step(20);
    const sc = dc.scene();
    const layers = () => sc.parallax.slots.flatMap(([name, slot]) => slot.pair.map((s, i) => [`${name}${i}`, { y: s.y, a: s.alpha }]));
    let prev = Object.fromEntries(layers());
    const room0 = dc.state().room;
    let worst = { d: 0, layer: null, frame: -1 };
    dc.hold('left');
    let crossed = false;
    for (let f = 0; f < 400; f++) {
      dc.step(1);
      const cur = Object.fromEntries(layers());
      for (const k of Object.keys(cur)) {
        const p = prev[k];
        const d = p && p.a > 0.01 && cur[k].a > 0.01 ? Math.abs(cur[k].y - p.y) : 0;
        if (d > worst.d) worst = { d, layer: k, frame: f };
      }
      prev = cur;
      if (dc.state().room !== room0) crossed = true;
      if (crossed && f > worst.frame + 30) break;
    }
    dc.release('left');
    if (!crossed) return { pass: false, detail: `never left room ${room0}; harness walk failed` };
    return { pass: worst.d <= 8, detail: `${room0} -> ${dc.state().room}: largest one-frame visible layer y change ${worst.d.toFixed(1)}px (${worst.layer}, frame ${worst.frame}); limit 8px` };
  },
};

const blendContinuity = {
  id: 'blend-continuity',
  async run(dc) {
    return each(dc, (sc) => {
      const { worst, crossed, n } = crossAll(dc, sc);
      const ok = worst.y <= 8 && worst.a <= 0.1 && worst.z <= 0.02 && (sc.parallax ? crossed === n : true);
      return {
        pass: ok,
        detail: `${crossed}/${n} crossings, max dy ${worst.y.toFixed(1)}px${worst.y > 8 ? ` ${worst.where}` : ''}, max dalpha ${worst.a.toFixed(3)}${worst.a > 0.1 ? ` ${worst.whereA}` : ''}, max dzoom ${worst.z.toFixed(3)}${worst.z > 0.02 ? ` ${worst.whereZ}` : ''}`,
      };
    });
  },
};

const boundaryNoFlicker = {
  id: 'boundary-no-flicker',
  async run(dc) {
    return each(dc, (sc) => {
      const { changes, per } = wobble(dc, sc);
      return { pass: changes === 0, detail: `${sc.built.rooms.length - 1} boundaries x 120 frames, ${changes} room changes${per.length ? ` ${per.join(' ')}` : ''}` };
    });
  },
};

export default [backgroundSnap, blendContinuity, boundaryNoFlicker];
