// Gear train (pure logic, no Phaser): THE STOPPED HOUR's wheels. Jo carries
// brass wheels and hangs them on pegs. Wheels whose teeth touch turn each other,
// each the opposite way; the output has a pawl and only turns one way.
//   def  { drive: {x, y, r}, output: {x, y, r, turns: 1 | -1}, arbors: [{id, x, y}], wheels: [{id, size, x, y}] }
//        px, room-local. The drive turns +1.
//   st   { hung: {arborId: wheelId}, lying: {wheelId: {x, y}}, carried: wheelId | null }
//        plain JSON, so a run's flags can keep it
// Right = the drive reaches the output, it turns the way of its pawl, and no
// closed loop of an odd count has locked the train. Nothing here can be lost:
// any wheel lifts off again until the train runs.
export const WHEEL_R = { small: 24, big: 32 };
const TOL = 3; // px of slack in "these teeth touch"

export const teeth = (r) => Math.round(r / 2); // one module, so any two sizes mesh

export const newTrain = (def) => ({ hung: {}, lying: Object.fromEntries(def.wheels.map((w) => [w.id, { x: w.x, y: w.y }])), carried: null });

const wheelR = (def, id) => WHEEL_R[def.wheels.find((w) => w.id === id).size];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const gap = (a, b) => dist(a, b) - (a.r + b.r);

// every wheel on the wall, the drive and the output included
function parts(def, st) {
  const out = [{ id: 'drive', x: def.drive.x, y: def.drive.y, r: def.drive.r }, { id: 'output', x: def.output.x, y: def.output.y, r: def.output.r }];
  for (const a of def.arbors) if (st.hung[a.id]) out.push({ id: st.hung[a.id], x: a.x, y: a.y, r: wheelR(def, st.hung[a.id]) });
  return out;
}

export function take(def, st, wheelId) {
  if (st.carried || !st.lying[wheelId]) return false;
  delete st.lying[wheelId];
  st.carried = wheelId;
  return true;
}

// the carried wheel onto an empty peg: 'hung', or 'fouls' if it would sit inside a neighbour
export function hang(def, st, arborId) {
  const a = def.arbors.find((x) => x.id === arborId);
  if (!st.carried || !a || st.hung[arborId]) return null;
  const me = { x: a.x, y: a.y, r: wheelR(def, st.carried) };
  if (parts(def, st).some((p) => gap(me, p) < -TOL)) return 'fouls';
  st.hung[arborId] = st.carried;
  st.carried = null;
  return 'hung';
}

export function lift(def, st, arborId) {
  if (st.carried || !st.hung[arborId]) return false;
  st.carried = st.hung[arborId];
  delete st.hung[arborId];
  return true;
}

// the carried wheel, set down (or dropped) at a spot
export function lay(st, x, y) {
  if (!st.carried) return null;
  const id = st.carried;
  st.lying[id] = { x, y };
  st.carried = null;
  return id;
}

// the carried wheel back where the room had it (Jo left the room, or the run was saved)
export function goHome(def, st) {
  if (!st.carried) return null;
  const w = def.wheels.find((x) => x.id === st.carried);
  return lay(st, w.x, w.y);
}

// what the wall does now. `turning[id]` = { ratio, phase }: the part's angle is
// ratio * (the drive's angle) + phase, with the teeth interleaved. held: the
// pawl or a locked loop stops everything joined to the drive.
export function trainState(def, st) {
  const ps = parts(def, st);
  const turning = { drive: { ratio: 1, phase: 0 } };
  let bound = false;
  const q = [ps[0]];
  while (q.length) {
    const a = q.shift();
    const ta = turning[a.id];
    for (const b of ps) {
      if (a === b || Math.abs(gap(a, b)) > TOL) continue;
      const k = a.r / b.r;
      const ratio = -k * ta.ratio;
      if (turning[b.id]) {
        if (Math.sign(turning[b.id].ratio) !== Math.sign(ratio)) bound = true;
        continue;
      }
      const phi = Math.atan2(b.y - a.y, b.x - a.x);
      turning[b.id] = { ratio, phase: -k * ta.phase + phi + Math.PI + Math.PI / teeth(b.r) + k * phi };
      q.push(b);
    }
  }
  const reached = !!turning.output;
  const wrongWay = reached && Math.sign(turning.output.ratio) !== def.output.turns;
  return { turning, reached, bound, wrongWay, held: bound || wrongWay, running: reached && !bound && !wrongWay };
}

export default trainState;
