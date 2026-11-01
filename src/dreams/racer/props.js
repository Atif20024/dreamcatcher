// THE LONG STRAIGHT's garage props, painted at 1 m = 44 px.
import { hex, rgba } from '../../art/paint.js';

const prop = (w, h, paint) => ({ w, h, anchor: [0.5, 1], paint });

export default {
  // a roller shutter, 4 m wide and 3 m high, half up on the morning outside
  garage_shutter: prop(176, 132, (ctx, w, h) => {
    ctx.fillStyle = hex(0xc8e0e8);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hex(0x4a7a5a);
    ctx.fillRect(0, h - 44, w, 20);
    ctx.fillStyle = hex(0x6a6668);
    ctx.fillRect(0, h - 24, w, 24);
    ctx.fillStyle = hex(0x5a5650);
    ctx.fillRect(0, 0, w, 64);
    for (let y = 0; y < 64; y += 8) {
      ctx.fillStyle = hex(0x3a3630);
      ctx.fillRect(0, y, w, 1);
    }
    ctx.fillStyle = hex(0x2a2420);
    ctx.fillRect(0, 0, 6, h);
    ctx.fillRect(w - 6, 0, 6, h);
    ctx.fillStyle = hex(0xf2e6cc);
    ctx.fillRect(w / 2 - 34, 26, 68, 14);
    ctx.fillStyle = hex(0x1f7a78);
    ctx.fillRect(w / 2 - 32, 28, 64, 2);
    ctx.fillRect(w / 2 - 32, 36, 64, 2);
  }),
  // hanging tyres on a rack
  tyre_rack: prop(120, 110, (ctx, w, h) => {
    ctx.fillStyle = hex(0x3a2a20);
    ctx.fillRect(0, 8, w, 5);
    ctx.fillRect(4, 8, 4, h - 8);
    ctx.fillRect(w - 8, 8, 4, h - 8);
    for (let i = 0; i < 4; i++) {
      const x = 22 + i * 26;
      ctx.fillStyle = hex(0x1e1c22);
      ctx.beginPath();
      ctx.arc(x, 42, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(0x6a5240, 1);
      ctx.beginPath();
      ctx.arc(x, 42, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = hex(0x1e1c22);
    ctx.fillRect(14, h - 30, 90, 8);
    ctx.fillRect(14, h - 21, 90, 8);
    ctx.fillRect(14, h - 12, 90, 12);
  }),
  // the bench: a vice, tins, and the radio Ottavia talks through
  work_bench: prop(140, 62, (ctx, w, h) => {
    ctx.fillStyle = hex(0x6a4a2c);
    ctx.fillRect(0, 18, w, 8);
    ctx.fillStyle = hex(0x3a2a20);
    ctx.fillRect(6, 26, 8, h - 26);
    ctx.fillRect(w - 14, 26, 8, h - 26);
    ctx.fillRect(14, h - 16, w - 28, 4);
    ctx.fillStyle = hex(0x8a8a92);
    ctx.fillRect(16, 6, 22, 12);
    ctx.fillStyle = hex(0xb8302a);
    ctx.fillRect(52, 8, 10, 10);
    ctx.fillStyle = hex(0x1f7a78);
    ctx.fillRect(66, 4, 10, 14);
    ctx.fillStyle = hex(0x4a3020);
    ctx.fillRect(90, 0, 36, 18);
    ctx.fillStyle = hex(0xf2c078);
    ctx.fillRect(94, 4, 14, 8);
    ctx.fillStyle = hex(0xe8dcc0);
    ctx.fillRect(112, 5, 10, 2);
    ctx.fillRect(112, 9, 10, 2);
  }),
};
