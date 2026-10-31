// The gangway slate (pure logic, no Phaser): before the first card, Jo chalks
// three numbers with Lou's stake in his pocket. A pro decides the exit before
// the entrance.
//   BUY-IN     what comes aboard of Lou's $100 (the rest stays in his pocket)
//   STOP-LOSS  the line under which the night is over
//   GOAL       the line at which it is won
// The slate stays on the HUD all night; nothing ever forces Jo to obey it.
//
//   const e = slate(); e.move('down'); e.move('right'); e.press(); e.result → { ok, buyin, stop, goal }

export const SLATE_ROWS = Object.freeze([
  { id: 'buyin', label: 'BUY-IN', values: [60, 80, 100], at: 2 },
  { id: 'stop', label: 'STOP-LOSS', values: [30, 40, 50, 60, 70, 80], at: 3 },
  { id: 'goal', label: 'GOAL', values: [120, 140, 160, 180, 200], at: 1 },
]);

export function slate({ rows = SLATE_ROWS } = {}) {
  const s = { row: 0, at: rows.map((r) => r.at), done: false, result: null, events: [] };
  const val = (i) => rows[i].values[s.at[i]];
  // the stop-loss must sit under the buy-in (else the night ends at once)
  const fix = () => {
    const b = val(0);
    while (val(1) >= b && s.at[1] > 0) s.at[1] -= 1;
  };
  const api = {
    get done() {
      return s.done;
    },
    get result() {
      return s.result;
    },
    update() {},
    move(dir) {
      if (s.done) return null;
      if (dir === 'up') s.row = Math.max(0, s.row - 1);
      else if (dir === 'down') s.row = Math.min(rows.length, s.row + 1);
      else if (s.row < rows.length) {
        const n = rows[s.row].values.length;
        s.at[s.row] = Math.max(0, Math.min(n - 1, s.at[s.row] + (dir === 'left' ? -1 : 1)));
        fix();
        s.events.push('chalk');
      }
      return 'move';
    },
    // [E] on a number goes to the next row; on CHALK IT the slate is set
    press() {
      if (s.done) return 'done';
      if (s.row < rows.length) {
        s.row += 1;
        return 'move';
      }
      s.done = true;
      s.result = { ok: true, buyin: val(0), stop: val(1), goal: val(2) };
      return 'done';
    },
    takeEvents() {
      const e = s.events;
      s.events = [];
      return e;
    },
    state() {
      return { row: s.row, rows: rows.map((r, i) => ({ id: r.id, label: r.label, value: val(i), first: s.at[i] === 0, last: s.at[i] === r.values.length - 1 })), confirm: s.row === rows.length };
    },
  };
  fix();
  return api;
}

export default slate;
