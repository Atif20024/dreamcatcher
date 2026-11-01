// The purse on the HUD, and the air (THE LAST HAND; no keys of its own).
// The stack is a bar with the slate on it: a red post at the stop-loss, a
// gold one at the goal; under it the slate's numbers, then TILT, all on one
// plate under the coins (hud.meter groups). Nothing tells Jo to leave:
// the slate speaks.
// TILT comes down only in the air: walking an open deck (a room's `air`
// columns: the card room's guard, the hurricane deck) cools it, ten seconds
// from full to nothing. Tilted, the edges of the world blur (a vignette
// that breathes) and the run carries the flag `tilted` (Lou says so).
// It also keeps the run's derived flags: the third table opens when the
// first two are beaten, the card room is done when the third is.
// The slate's lines go live at the card room door (rebase: on what Jo walks
// in with, net of debt); the bar shows the stack less what is owed.
// The first time TILT bites, Lou says so (a caption, the meter pulses), and
// once more when Jo gets up from a table still steaming.
import { hud } from '../../../ui/hud.js';
import { newPurse, cool, isTilted, line, rebase, net } from '../../../engines/purse.js';
import { LOU_TILT_FIRST, LOU_TILT_AIR } from '../dialogue.js';

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
    // one block under the coins (a single plate): the stack and its bar,
    // the slate's two numbers, TILT
    ctx.state.stack = hud.meter('stack', { label: 'STACK $100', color: COLORS.between, order: 3, group: 'purse' });
    ctx.state.slate = hud.meter('slate', { label: '', color: '#f2e9d8', order: 3.5, group: 'purse', bar: false, visible: false });
    ctx.state.tilt = hud.meter('tilt', { label: 'TILT', color: '#c86a8a', order: 4, group: 'purse', visible: false });
    // what is owed (a comp's stake, the markers): its own short row, so the
    // plate stays narrow enough to clear a two-line goal
    ctx.state.owes = hud.meter('owes', { label: '', color: '#e86a5a', order: 4.5, group: 'purse', bar: false, visible: false });
    // the blur at the edges: in the world (zoomed with it), scaled to cover the view
    ctx.state.vig = s.add.image(0, 0, vignetteKey(s)).setScrollFactor(0).setDepth(90).setAlpha(0).setOrigin(0.5);
    ctx.state.vig.keepInWorld = true;
  },
  update(ctx, dt) {
    const s = ctx.scene;
    const F = ctx.flags;
    const p = F.purse || (F.purse = newPurse());
    const st = ctx.state;
    // the card room door: the slate's lines go onto what Jo carries in
    if (s.roomId === 'cards' && !p.based && F.slate_set) rebase(p);
    // the bar: the stack (with what is at the faro bank right now) less what
    // is owed, the slate on it (borrowed money never lights the goal)
    const stack = p.stack + (p.atBank || 0);
    const own = net({ ...p, stack });
    const top = Math.max(p.goal * 1.25, own, 1);
    const ln = line({ ...p, stack });
    st.stack.set(Math.max(0, own) / top).setLabel(`STACK $${stack}`).setColor(COLORS[ln]).setTicks([
      { at: p.stop / top, color: '#d5443c' },
      { at: p.goal / top, color: '#f6d98a' },
    ]);
    // before the card room the slate reads as chalked: down / up at the tables
    const slateLabel = p.based ? `STOP $${p.stop} · GOAL $${p.goal}` : `STOP -$${p.down} · GOAL +$${p.up}`;
    st.owes.setLabel(`OWES MR PELL $${p.debt || 0}`).setVisible(!!F.slate_set && (p.debt || 0) > 0);
    st.slate.setLabel(slateLabel).setColor(ln === 'below' ? '#e86a5a' : '#f2e9d8').setVisible(!!F.slate_set);
    st.tilt.set(p.tilt).setVisible(!!F.slate_set);
    // the first time it bites: Lou says so, and the meter pulses
    const room = s.graph && s.roomId ? s.graph.room(s.roomId) : null;
    const tilted = isTilted(p);
    if (tilted && !F.tilt_told) {
      F.tilt_told = true;
      st.pulse = s.time.now;
      s.caption.say('lou', room && room.data.air && room.id !== 'cards' ? LOU_TILT_AIR : LOU_TILT_FIRST, { ms: 4200 });
    } else if (tilted && st.wasEnc && !s.encounterActive && !F.tilt_told_up) {
      // up from the table still steaming: the same line, once
      F.tilt_told_up = true;
      st.pulse = s.time.now;
      s.caption.say('lou', LOU_TILT_FIRST, { ms: 4200 });
    }
    st.wasEnc = !!s.encounterActive;
    const pk = st.pulse ? s.time.now - st.pulse : Infinity;
    if (pk < 2400) st.tilt.setLabel(Math.floor(pk / 200) % 2 ? 'TILT' : 'TILTED').setColor(Math.floor(pk / 200) % 2 ? '#c86a8a' : '#ff5a4a');
    else st.tilt.setLabel('TILT').setColor('#c86a8a');
    // the air: walking an open deck cools the head
    const pl = ctx.player;
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
