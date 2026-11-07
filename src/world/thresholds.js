// Thresholds (room transitions advice, docs/redesign/advice/
// room_transitions_advice.md): a room never dissolves into the next. Every
// walk-through room change happens inside a drawn frame (a doorway, an arch,
// a gate) as a short dip through dark: down, swap at full dark, hold, up.
// Jo keeps walking; nothing is locked. Pure (no Phaser): the RoomGraph, the
// station and the unit tests share it.
//
//   frame = { x (world px, the frame's centre), left, right (room ids),
//             y0?, y1? (the band it applies in), dip?, open? (no dip: the
//             same place both sides, e.g. one long train shed) }
//   frameCrossing(frames, x, y, cur)   the frame Jo is past, or null
//   sideOf(frames, x, y, fallback)     the room a fresh placement belongs to

// a frame triggers this far past its centre (the trigger rect is a tile
// wide), so standing in the doorway never flickers
export const FRAME_HALF = 16;

// ms down to dark, held at dark (the swap happens at its start), back up
export const DIPS = {
  inout: { down: 120, hold: 60, up: 160 }, // outside ↔ inside a building
  outout: { down: 180, hold: 80, up: 220 }, // the whole sky and horizon change
  inin: { down: 90, hold: 40, up: 110 }, // room to room indoors
};

export const dipFor = (aOutdoor, bOutdoor) => (aOutdoor && bOutdoor ? DIPS.outout : aOutdoor || bOutdoor ? DIPS.inout : DIPS.inin);

const inBand = (f, y) => (f.y0 === undefined || y >= f.y0) && (f.y1 === undefined || y <= f.y1);

// the frame Jo has walked through: he is on its far side by more than
// FRAME_HALF, seen from the room the screen is showing (`cur`)
export function frameCrossing(frames, x, y, cur) {
  for (const f of frames) {
    if (!inBand(f, y)) continue;
    if (cur === f.left && x > f.x + FRAME_HALF) return { ...f, from: f.left, to: f.right, dir: 1 };
    if (cur === f.right && x < f.x - FRAME_HALF) return { ...f, from: f.right, to: f.left, dir: -1 };
  }
  return null;
}

// which side of the frames a point is on (a spawn, a respawn, a warp): the
// room left of the first frame past x, else the right room of the last
export function sideOf(frames, x, y, fallback = null) {
  const list = frames.filter((f) => inBand(f, y)).sort((a, b) => a.x - b.x);
  for (const f of list) if (x < f.x) return f.left;
  return list.length ? list[list.length - 1].right : fallback;
}
