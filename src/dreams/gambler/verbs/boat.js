// The boat's two pressures (THE LAST HAND; no keys of its own):
//   the escape pipes on the texas roof (room.vents): each blows a column of
//     steam on its own beat, with a hiss and a wisp first so it can be read.
//     Tilted, there is no warning wisp and the blow lasts longer: a hot head
//     misjudges the gaps. Steam scalds (a heart, knocked back).
//   the purser's corridor (room.corridor): every marker signed brings its
//     ceiling down a tile (a solid plank across, painted), to three tiles at
//     the least, and dims its lamps a notch. Nobody has to sign one.
import { isTilted } from '../../../engines/purse.js';

const T = 32;

export default {
  id: 'boat',
  keys: [],
  create(ctx) {
    const s = ctx.scene;
    ctx.state.vents = [];
    ctx.state.planks = [];
    ctx.state.markers = 0;
    for (const r of s.graph.rooms.values()) {
      for (const v of r.data.vents || []) {
        const x = (r.tx + v.x) * T + T / 2;
        const y0 = (r.ty + v.y0) * T;
        const y1 = (r.ty + v.y1 + 1) * T;
        const g = s.add.graphics().setDepth(12);
        ctx.state.vents.push({ ...v, x, y0, y1, g, hurtAt: 0 });
      }
      if (r.data.corridor) {
        const c = r.data.corridor;
        ctx.state.corridor = { x0: (r.tx + c.x0) * T, x1: (r.tx + c.x1 + 1) * T, rows: c.rows.map((y) => (r.ty + y) * T), lamps: (r.data.props || []).filter((p) => p.prop === 'wall_lamp').map((p) => ({ x: (r.tx + p.x) * T + T / 2 + 4, y: (r.ty + p.y) * T + T / 2 })) };
      }
    }
    const c = ctx.state.corridor;
    if (c) ctx.state.glows = c.lamps.map((l) => s.add.image(l.x, l.y, 'dc-glow').setBlendMode('ADD').setTint(0xffc870).setScale(0.9).setDepth(13).setAlpha(0.5));
  },
  update(ctx) {
    const s = ctx.scene;
    const F = ctx.flags;
    const p = ctx.player;
    const now = s.time.now;
    const tilted = F.purse && isTilted(F.purse);
    // the escape pipes
    for (const v of ctx.state.vents) {
      const period = v.period;
      const on = tilted ? v.on * 1.35 : v.on;
      const warn = tilted ? 0 : 450;
      const t = (now + v.phase) % period;
      const blowing = t < on;
      const warning = !blowing && t > period - warn;
      v.g.clear();
      if (blowing) {
        const k = t / on;
        for (let i = 0; i < 9; i++) {
          const yy = v.y1 - ((i / 9) * (v.y1 - v.y0)) - k * 10;
          const r = 9 + i * 1.6 + Math.sin(now / 90 + i) * 2;
          v.g.fillStyle(0xf2f0f4, 0.55 - i * 0.04).fillCircle(v.x + Math.sin(now / 130 + i * 1.7) * 5, yy, r);
        }
      } else if (warning) {
        v.g.fillStyle(0xe8e8f0, 0.45).fillCircle(v.x, v.y1 - 8 - ((t - (period - warn)) / warn) * 14, 5);
      }
      if (blowing && !s.encounterActive && now - v.hurtAt > 900) {
        const b = p.body;
        if (b.right > v.x - 18 && b.left < v.x + 18 && b.bottom > v.y0 && b.top < v.y1) {
          v.hurtAt = now;
          s.hurt({ sourceX: v.x });
        }
      }
    }
    // the corridor: a plank down per marker (to three tiles of headroom at least)
    const c = ctx.state.corridor;
    if (!c) return;
    const n = Math.min(c.rows.length, F.purse ? F.purse.markers : 0);
    while (ctx.state.planks.length < n) {
      const y = c.rows[ctx.state.planks.length];
      const g = s.add.graphics().setDepth(-7);
      g.fillStyle(0x2a160e, 1).fillRect(c.x0, y, c.x1 - c.x0, T);
      g.fillStyle(0x4a2a1a, 1).fillRect(c.x0, y + 4, c.x1 - c.x0, T - 8);
      g.fillStyle(0xc8a050, 0.6).fillRect(c.x0, y + T - 3, c.x1 - c.x0, 2);
      for (let x = c.x0 + 40; x < c.x1; x += 96) g.fillStyle(0x1a0e08, 1).fillRect(x, y, 6, T);
      const z = s.add.zone(c.x0, y, c.x1 - c.x0, T).setOrigin(0, 0);
      s.physics.add.existing(z, true);
      const col = s.physics.add.collider(p, z);
      ctx.state.planks.push({ g, z, col });
      s.cameras.main.shake(160, 0.003);
    }
    // the lamp dims a notch a marker
    for (const gl of ctx.state.glows || []) gl.setAlpha(Math.max(0.08, 0.5 - n * 0.14) * (0.92 + 0.08 * Math.sin(now / 300)));
  },
};
