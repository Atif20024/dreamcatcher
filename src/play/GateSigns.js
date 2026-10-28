// Gate signs (plan §2.7, F#5): every requirement-bearing gate wears a sign on
// its approach side naming what opens it (the gate's `hint`, from room data),
// with one mark per requirement that fills as each is met (○ → ●). It reads
// OPEN once the gate opens. Drawn in world space, so it is seen on approach.
import { uiText } from '../ui/text.js';
import { D } from '../builders/depths.js';

const T = 32;

export default class GateSigns {
  constructor(scene) {
    this.scene = scene;
    this.signs = new Map();
  }

  make(g) {
    const s = this.scene;
    const side = g.signSide === 'right' ? 1 : -1;
    const x = g.wx + side * 2.5 * T;
    const floor = (g.ty + (g.h || 5)) * T;
    const post = s.add.rectangle(x, floor - 22, 4, 44, 0x4a3a2a).setOrigin(0.5).setDepth(D.INTERACT - 1);
    const text = uiText(s, x, floor - 74, g.hint, { size: 'small', color: '#2a2018', align: 'center', wrap: 150 }).setOrigin(0.5).setDepth(D.INTERACT + 1);
    const marks = uiText(s, x, 0, '', { size: 'small', color: '#7a2a1a', align: 'center' }).setOrigin(0.5).setDepth(D.INTERACT + 1);
    const w = Math.max(84, text.width + 18);
    const h = text.height + 26;
    const board = s.add.graphics().setDepth(D.INTERACT);
    board.fillStyle(0x2a2018, 1).fillRect(x - w / 2 - 2, floor - 44 - h - 2, w + 4, h + 4);
    board.fillStyle(0xe8dcc0, 1).fillRect(x - w / 2, floor - 44 - h, w, h);
    text.setY(floor - 44 - h + 6 + text.height / 2);
    marks.setY(floor - 44 - 10);
    const sign = { g, x, post, board, text, marks, last: null, objs: [post, board, text, marks] };
    sign.text.name = `gate-sign:${g.id}`;
    this.signs.set(g.id, sign);
    return sign;
  }

  update(gates, flags) {
    for (const g of gates) {
      if (!g.hint || !(g.requires && g.requires.length)) continue;
      const sign = this.signs.get(g.id) || this.make(g);
      const marks = g.open ? 'OPEN' : g.requires.map((f) => (flags[f] ? '●' : '○')).join(' ');
      if (marks !== sign.last) {
        sign.last = marks;
        sign.marks.setText(marks);
        if (g.open) sign.objs.forEach((o) => o.setAlpha(0.55));
      }
    }
  }

  // harness: what a sign says
  state(id) {
    const s = this.signs.get(id);
    return s ? { hint: s.g.hint, marks: s.last, x: s.x, visible: s.text.visible && s.text.alpha > 0 } : null;
  }
}
