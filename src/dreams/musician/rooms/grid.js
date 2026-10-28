// A tiny grid builder for THE BIG STAGE's rooms: start from air, then draw
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
    clear(x0, y0, x1, y1) {
      return api.fill(x0, y0, x1, y1, '.');
    },
    rows: () => rows.map((r) => r.join('')),
  };
  return api;
}
