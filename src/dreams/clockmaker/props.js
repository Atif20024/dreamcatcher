// THE STOPPED HOUR's own props (FRAMEWORK §4.3): painted at 1 m = 44 px; the
// sizes come from src/data/scale.js CLOCK_PROP_SIZES, which lint:scale reads.
//   { w, h, anchor: [ax, ay], paint(ctx, w, h, P) }
import { hex, rgba, mix } from '../../art/paint.js';
import { CLOCK_PROP_SIZES as S } from '../../data/scale.js';

const prop = (id, paint) => ({ w: S[id][0], h: S[id][1], anchor: [0.5, 1], paint });

// the child at the lit window of the lane's house (the window is 30 × 40)
function child(ctx, w, h, wave) {
  // (the same child as the caption's chip: ev-p-waiting_kid's bun, skin and blue)
  ctx.fillStyle = hex(0x6a4630);
  ctx.beginPath();
  ctx.arc(w / 2, h - 18, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hex(0x1e1a20);
  ctx.fillRect(w / 2 - 7, h - 26, 14, 6);
  ctx.fillRect(w / 2 - 3, h - 30, 6, 4);
  ctx.fillStyle = hex(0xf2e6cc);
  ctx.fillRect(w / 2 - 3, h - 19, 2, 2);
  ctx.fillRect(w / 2 + 2, h - 19, 2, 2);
  ctx.fillStyle = hex(0x50a0c0);
  ctx.fillRect(w / 2 - 8, h - 11, 16, 11);
  ctx.fillStyle = hex(0x6a4630);
  if (wave) ctx.fillRect(w / 2 + 8, h - 24, 4, 16);
  else ctx.fillRect(w / 2 + 6, h - 8, 4, 6);
}

export default {
  // the great bell, hanging from its beam (1.6 m across the lip)
  great_bell: prop('great_bell', (ctx, w, h, P) => {
    ctx.fillStyle = hex(P.wood);
    ctx.fillRect(0, 0, w, 10);
    ctx.fillStyle = hex(P.iron);
    ctx.fillRect(w / 2 - 4, 10, 8, 10);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, hex(P.brassLit));
    g.addColorStop(0.45, hex(P.brass));
    g.addColorStop(1, hex(mix(P.brass, P.deep, 0.55)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w * 0.34, 28);
    ctx.quadraticCurveTo(w / 2, 14, w * 0.66, 28);
    ctx.lineTo(w * 0.74, h - 16);
    ctx.quadraticCurveTo(w * 0.86, h - 8, w * 0.92, h - 4);
    ctx.lineTo(w * 0.08, h - 4);
    ctx.quadraticCurveTo(w * 0.14, h - 8, w * 0.26, h - 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(P.deep, 0.35);
    ctx.fillRect(w * 0.14, h - 14, w * 0.72, 3);
    ctx.fillStyle = hex(P.iron);
    ctx.beginPath();
    ctx.arc(w / 2, h - 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }),
  // the clock's iron weight, stopped halfway down its shaft, on its chain
  clock_weight: prop('clock_weight', (ctx, w, h, P) => {
    ctx.fillStyle = hex(P.iron);
    for (let y = 0; y < h - 62; y += 10) ctx.fillRect(w / 2 - 2, y, 4, 7);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, hex(mix(P.iron, P.lit, 0.3)));
    g.addColorStop(0.5, hex(P.iron));
    g.addColorStop(1, hex(P.deep));
    ctx.fillStyle = g;
    ctx.fillRect(4, h - 60, w - 8, 60);
    ctx.fillStyle = rgba(P.deep, 0.5);
    ctx.fillRect(4, h - 50, w - 8, 3);
    ctx.fillRect(4, h - 10, w - 8, 3);
  }),
  // the foot of the clock tower on the hill: stone, one little door
  tower_foot: prop('tower_foot', (ctx, w, h, P) => {
    ctx.fillStyle = hex(mix(P.stone, P.deep, 0.35));
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rgba(P.deep, 0.3);
    for (let y = 8, i = 0; y < h; y += 16, i++) {
      ctx.fillRect(0, y, w, 2);
      for (let x = i % 2 ? 0 : 20; x < w; x += 40) ctx.fillRect(x, y, 2, 16);
    }
    ctx.fillStyle = hex(mix(P.wood, P.deep, 0.4));
    ctx.fillRect(w / 2 - 30, h - 104, 60, 104);
    ctx.fillStyle = hex(P.wood);
    ctx.fillRect(w / 2 - 25, h - 99, 50, 99);
    ctx.fillStyle = hex(P.brassLit);
    ctx.fillRect(w / 2 + 16, h - 50, 4, 4);
  }),
  window_child: prop('window_child', (ctx, w, h) => child(ctx, w, h, false)),
  window_child_wave: prop('window_child_wave', (ctx, w, h) => child(ctx, w, h, true)),
};
