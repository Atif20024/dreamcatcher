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
    // §8: body ×1 (cap 9) on the sign's own cream board
    const text = uiText(s, x, floor - 74, g.hint, { size: 'body', color: '#2a2018', align: 'center', wrap: 150, backing: 0xe8dcc0 }).setOrigin(0.5).setDepth(D.INTERACT + 1);
    const marks = uiText(s, x, 0, '', { size: 'body', color: '#7a2a1a', align: 'center', backing: 0xe8dcc0 }).setOrigin(0.5).setDepth(D.INTERACT + 1);
    const w = Math.max(84, text.width + 18);
    const h = text.height + 26;
    // §8: two gates side by side: the later sign is raised over the other
    let base = floor - 44;
    for (const o of this.signs.values()) {
      if (Math.abs(o.x - x) < (o.w + w) / 2 + 8 && base > o.top - 10 && base - h < o.base + 10) base = o.top - 10;
    }
    if (base !== floor - 44) post.setSize(4, floor - base).setY((floor + base) / 2);
    const board = s.add.graphics().setDepth(D.INTERACT);
    board.fillStyle(0x2a2018, 1).fillRect(x - w / 2 - 2, base - h - 2, w + 4, h + 4);
    board.fillStyle(0xe8dcc0, 1).fillRect(x - w / 2, base - h, w, h);
    text.setY(base - h + 6 + text.height / 2);
    marks.setY(base - 10);
    const sign = { g, x, w, base, top: base - h - 2, post, board, text, marks, last: null, objs: [post, board, text, marks] };
    sign.text.name = `gate-sign:${g.id}`;
    this.signs.set(g.id, sign);
    return sign;
  }

  // shown: the room on screen (DreamScene). A sign stands on its gate's
  // approach side, in the gate's room: past a seam frame, in the next room,
  // it is not drawn (the camera can still see a sliver of that side)
  update(gates, flags, shown = null) {
    for (const s of this.signs.values()) {
      const vis = !shown || !s.g.room || s.g.room === shown;
      for (const o of s.objs) o.setVisible(vis);
    }
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
