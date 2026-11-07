// The ticket rail on screen (FIVE-STAR DREAM): a steel bar under the objective
// with real paper tickets clipped to it. Each ticket reads top to bottom: table
// and dish, its stops in order (done ticked, the next one lit), where it goes.
// The paper scorches from the bottom as its time runs and turns red near the
// end. Every glyph in the game has a baked dark outline, so the words sit on a
// dark docket inside the cream paper: small ×2 (14 px caps) in cream, and
// the HUD region keeps the grid's overlap rule honest.
import { uiText } from '../../ui/text.js';
import { hud } from '../../ui/hud.js';

const D = 118; // under menus (adopted by the UI scene: never zoomed)
const TW = 156;
const TH = 112;
const GAP = 8;
const X0 = 480 - (TW * 3 + GAP * 2) / 2;
const Y0 = 62;
const PAPER = 0xf2e6cc;
const DOCKET = 0x221a18;
const INK = '#f2e6cc';
const DIM = '#b8a88e';
const NOW = '#f2b84a';
const ROWS = 4;

function label(k) {
  const t = typeof k.table === 'number' ? `T${k.table} ` : '';
  return `${t}${k.dish}`.slice(0, 12);
}

export class RailHud {
  constructor(scene) {
    this.scene = scene;
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(D);
    this.slots = [0, 1, 2].map((i) => {
      const x = X0 + i * (TW + GAP);
      const text = (dy, opts = {}) =>
        uiText(scene, x + 7, Y0 + 10 + dy, '', { size: 'small', scale: 2, color: INK, backing: DOCKET, screen: true, ...opts })
          .setScrollFactor(0)
          .setDepth(D + 1)
          .setVisible(false);
      return { x, head: text(0), rows: Array.from({ length: ROWS }, (_, r) => text(20 + r * 20, { color: DIM })) };
    });
    this.visible = false;
    this.flash = [0, 0, 0];
  }

  destroy() {
    this.g.destroy();
    for (const s of this.slots) {
      s.head.destroy();
      s.rows.forEach((r) => r.destroy());
    }
    hud.region('rail', null);
  }

  // view: Service.view(); now: the clock for the pulses
  render(view, now) {
    const g = this.g;
    g.clear();
    const on = !!view && view.length > 0;
    if (on !== this.visible) {
      this.visible = on;
      hud.region('rail', on ? { x: X0 - 6, y: Y0 - 8, w: TW * 3 + GAP * 2 + 12, h: TH + 14 } : null);
    }
    this.slots.forEach((s, i) => {
      const k = on ? view[i] : null;
      s.head.setVisible(!!k);
      s.rows.forEach((r) => r.setVisible(false));
      if (!k) return;
      const x = s.x;
      // the paper, a slight shadow, the scorch rising from the bottom
      g.fillStyle(0x0e0b14, 0.55).fillRect(x + 3, Y0 + 3, TW, TH);
      g.fillStyle(PAPER, 1).fillRect(x, Y0, TW, TH);
      g.fillStyle(DOCKET, 1).fillRect(x + 4, Y0 + 5, TW - 8, TH - 9);
      if (k.timed && !k.held) {
        const burnt = 1 - k.frac;
        const col = k.frac < 0.25 ? 0x8a2414 : k.frac < 0.5 ? 0x6a3c14 : 0x4a3a1c;
        const h = Math.round(burnt * (TH - 9));
        g.fillStyle(col, k.frac < 0.25 ? 0.85 + 0.15 * Math.sin(now / 90) : 0.9).fillRect(x + 4, Y0 + TH - 4 - h, TW - 8, h);
      }
      // the edge: gold in Jo's hands, red when called back
      const edge = k.held ? 0xd8a020 : k.refires ? 0xc0392b : 0x8a7a58;
      g.lineStyle(k.held || k.refires ? 3 : 1, edge, 1).strokeRect(x + 1, Y0 + 1, TW - 2, TH - 2);
      s.head.setText(label(k)).setColor(k.refires ? '#ff9a7a' : INK);
      const rows = [];
      if (k.note) rows.push({ t: k.note, c: NOW });
      for (const st of k.stops) {
        if (rows.length >= ROWS - 1) break;
        let t = st.label;
        let c = DIM;
        if (st.done) t = `+ ${t}`;
        else if (st.state === 'cooking') (t = `~ ${t} ON`), (c = '#f2a84a');
        else if (st.state === 'ready') (t = `> ${t} UP!`), (c = Math.floor(now / 180) % 2 ? '#8ae88a' : '#f2e6cc');
        else if (st.state === 'burnt') (t = `! ${t} OUT`), (c = '#ff8a6a');
        else if (st.now) (t = `> ${t}`), (c = NOW);
        else t = `  ${t}`;
        rows.push({ t: t.slice(0, 12), c });
      }
      const allDone = k.held || k.stops.every((st) => st.done);
      rows.push({ t: `${allDone ? '> ' : '  '}${k.toLabel}`.slice(0, 12), c: allDone ? NOW : DIM });
      rows.forEach((row, r) => s.rows[r].setText(row.t).setColor(row.c).setVisible(true));
      // the clip that holds it to the rail
      g.fillStyle(0x8a929a, 1).fillRect(x + TW / 2 - 7, Y0 - 5, 14, 9);
    });
    if (on) {
      g.fillStyle(0x4a4e56, 1).fillRect(X0 - 6, Y0 - 8, TW * 3 + GAP * 2 + 12, 5);
      g.fillStyle(0xc8d0d8, 1).fillRect(X0 - 6, Y0 - 8, TW * 3 + GAP * 2 + 12, 1);
    }
  }
}
