// The purse on the HUD, and the air (THE LAST HAND; no keys of its own).
// The stack is a bar with the slate on it: a red post at the stop-loss, a
// gold one at the goal; under it TILT. The slate's numbers ride the tool
// line all night. Nothing tells Jo to leave: the slate speaks.
// TILT comes down only in the air: walking an open deck (a room's `air`
// columns: the card room's guard, the hurricane deck) cools it, ten seconds
// from full to nothing. Tilted, the edges of the world blur (a vignette
// that breathes) and the run carries the flag `tilted` (Lou says so).
// It also keeps the run's derived flags: the third table opens when the
// first two are beaten, the card room is done when the third is.
import { hud } from '../../../ui/hud.js';
import { newPurse, cool, isTilted, line } from '../../../engines/purse.js';

const T = 32;
const COLORS = { below: '#d5443c', between: '#e9b84a', goal: '#f6d98a' };

function vignetteKey(scene) {
  const key = 'lq-tilt-vignette';
  if (scene.textures.exists(key)) return key;
  const ct = scene.textures.createCanvas(key, 480, 270);
  const ctx = ct.getContext();
  const g = ctx.createRadialGradient(240, 135, 80, 240, 135, 290);
  g.addColorStop(0, 'rgba(40,10,20,0)');
  g.addColorStop(0.6, 'rgba(40,10,20,0.35)');
  g.addColorStop(1, 'rgba(20,6,12,0.9)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 480, 270);
  ct.refresh();
  return key;
}

export default {
  id: 'purse',
  keys: [],
  always: true, // the bar moves while the cards are out
  create(ctx) {
    const s = ctx.scene;
    if (!ctx.flags.purse) ctx.flags.purse = newPurse();
    ctx.state.stack = hud.meter('stack', { label: 'STACK $100', color: COLORS.between, order: 3 });
    ctx.state.tilt = hud.meter('tilt', { label: 'TILT', color: '#c86a8a', order: 4, visible: false });
    ctx.state.slate = hud.toolLine(2, 'ink');
    // the blur at the edges: in the world (zoomed with it), scaled to cover the view
    ctx.state.vig = s.add.image(0, 0, vignetteKey(s)).setScrollFactor(0).setDepth(90).setAlpha(0).setOrigin(0.5);
    ctx.state.vig.keepInWorld = true;
  },
  update(ctx, dt) {
    const s = ctx.scene;
    const F = ctx.flags;
    const p = F.purse || (F.purse = newPurse());
    const st = ctx.state;
    // the bar: the stack (with what is at the faro bank right now), the slate on it
    const stack = p.stack + (p.atBank || 0);
    const top = Math.max(p.goal * 1.25, stack, 1);
    const ln = line({ ...p, stack });
    st.stack.set(stack / top).setLabel(p.debt ? `STACK $${stack} OWES $${p.debt}` : `STACK $${stack}`).setColor(COLORS[ln]).setTicks([
      { at: p.stop / top, color: '#d5443c' },
      { at: p.goal / top, color: '#f6d98a' },
    ]);
    st.slate.setText(F.slate_set ? `STOP $${p.stop} GOAL $${p.goal}` : 'LOU: $100').setColor(ln === 'below' ? 'danger' : 'ink');
    st.tilt.set(p.tilt).setVisible(!!F.slate_set);
    // the air: walking an open deck cools the head
    const pl = ctx.player;
    const room = s.graph && s.roomId ? s.graph.room(s.roomId) : null;
    const air = room && room.data.air;
    if (air && !s.encounterActive && p.tilt > 0) {
      const col = Math.floor(pl.x / T) - room.tx;
      const walking = pl.body.blocked.down && Math.abs(pl.body.velocity.x) > 40;
      if (col >= air[0] && col <= air[1]) cool(p, dt, walking);
    }
    F.tilted = isTilted(p);
    // tilted, the world blurs at the edges and breathes
    const cam = s.cameras.main;
    const want = p.tilt > 0.3 ? Math.min(0.85, (p.tilt - 0.3) * 1.6) * (0.85 + 0.15 * Math.sin(s.time.now / 600)) : 0;
    st.vig.setAlpha(st.vig.alpha + (want - st.vig.alpha) * 0.08);
    st.vig.setPosition(cam.width / 2, cam.height / 2).setScale((2 * 1.06) / cam.zoom);
    // derived flags (never while a table is running: its own flag first)
    if (!s.encounterActive) {
      if (F.t1_won && F.t2_won && !F.table3_open) F.table3_open = true;
      if (F.t3_won && !F.tables_done) F.tables_done = true;
    }
  },
};
