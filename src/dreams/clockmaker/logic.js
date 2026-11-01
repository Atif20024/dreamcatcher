// THE STOPPED HOUR's pure rules (no Phaser), tested in tests/clockmaker.test.js.
const T = 32;

// the loose pendulum: where its bob is at time t. `def` is in room tiles
// { x, row (the pivot), len, amp (radians), period (ms), phase? }. Once the
// clock is wound it is caught: a small, even swing that harms nobody.
export function bobAt(def, t, wound = false) {
  const amp = wound ? def.amp * 0.2 : def.amp;
  const th = amp * Math.sin((2 * Math.PI * (t + (def.phase || 0))) / def.period);
  return { x: (def.x + 0.5 + def.len * Math.sin(th)) * T, y: (def.row + def.len * Math.cos(th)) * T };
}

export const BOB_R = 20;

// circle against Jo's body rectangle (room-local px, same frame as bobAt)
export function bobHits(bob, { left, right, top, bottom }, r = BOB_R) {
  const cx = Math.max(left, Math.min(bob.x, right));
  const cy = Math.max(top, Math.min(bob.y, bottom));
  return (bob.x - cx) ** 2 + (bob.y - cy) ** 2 <= r * r;
}

// the gentlest dream: the first knock is free, and it never takes the last heart
export function pendulumToll(hitsBefore, hearts) {
  return hitsBefore === 0 || hearts <= 1 ? 0 : 1;
}

// the seven lamps up the hill, from the gate to Jo, one a strike
export function lampFlags(F, count) {
  for (let i = 1; i <= 7; i++) if (i <= count) F[`lamp_${i}`] = true;
}

// where a dropped wheel comes to rest: the top of the first floor under (x, y),
// room-local px. Ladders are not floors. null if nothing is under it
export function floorUnder(rows, x, y) {
  const col = Math.floor(x / T);
  for (let row = Math.max(0, Math.floor(y / T)); row < rows.length; row++) if ('#=/\\'.includes(rows[row][col] || '.')) return row * T;
  return null;
}

// the yard's hill under a walker (room px x → room px y of the ground): the floor
// is row 16, stepping up a row on each slope tile to row 12 at the top
const HILL = [[9, 16], [13, 15], [17, 14], [20, 13]];
export function hillFloor(x) {
  const col = x / T;
  let row = 16;
  for (const [c, r] of HILL) if (col >= c) row = col >= c + 1 ? r - 1 : r - (col - c);
  return row * T;
}

// what the seven strikes make of the keeper, if he went on ahead: how far down the hill (a column)
export const keeperAtStrike = (count) => 25 - (22 * Math.min(count, 7)) / 7;
