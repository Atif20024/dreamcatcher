// A tiny grid builder for THE LAST HAND's rooms: start from air, then draw
// the solid ground, walls, ledges and one-way landings as rectangles. The
// result is the collision ASCII the framework reads (legend.js roles).
//   const g = grid(40, 20); g.fill(0, 16, 39, 19); g.put(12, 14, '=====');
//   export default { grid: g.rows(), ... }
export function grid(w, h) {
  const rows = Array.from({ length: h }, () => Array(w).fill('.'));
  const api = {
    // a rectangle of one char, inclusive
    fill(x0, y0, x1, y1, ch = '#') {
      for (let y = Math.max(0, y0); y <= Math.min(h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) rows[y][x] = ch;
      return api;
    },
    // a string written left to right from (x, y)
    put(x, y, s) {
      [...s].forEach((ch, i) => {
        if (x + i >= 0 && x + i < w && y >= 0 && y < h) rows[y][x + i] = ch;
      });
      return api;
    },
    // a ladder up column x from y1 (its foot) to y0; a row in `decks` stays a
    // plank ('=') over the ladder's head: Jo climbs up through it and, past
    // the top rung, stands on the deck (and [down] on the deck climbs down)
    ladder(x, y0, y1, decks = []) {
      for (let y = y0; y <= y1; y++) api.put(x, y, decks.includes(y) ? '=' : 'H');
      return api;
    },
    clear(x0, y0, x1, y1) {
      return api.fill(x0, y0, x1, y1, '.');
    },
    rows: () => rows.map((r) => r.join('')),
  };
  return api;
}
