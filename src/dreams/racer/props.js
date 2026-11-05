// THE LONG STRAIGHT's props, painted at 1 m = 44 px: the garage, the quay and its
// fronts, Mr Sable's office, the corridor, the kitchen, the Gull road, the pit lane.
import { hex, rgba } from '../../art/paint.js';

const prop = (w, h, paint) => ({ w, h, anchor: [0.5, 1], paint });

// dressed stone, courses picked out
function stoneFront(ctx, x, y, w, h, c = 0xdccfb2) {
  ctx.fillStyle = hex(c);
  ctx.fillRect(x, y, w, h);
  for (let row = 0, yy = y + 6; yy < y + h; row++, yy += 14) {
    for (let xx = x + (row % 2) * 18; xx < x + w; xx += 36) {
      ctx.fillStyle = rgba(0x2a2420, ((xx + row) % 7) * 0.012 + 0.04);
      ctx.fillRect(xx, yy, 34, 12);
    }
  }
}
function roofLine(ctx, x, y, w) {
  ctx.fillStyle = hex(0xa86a4a);
  ctx.fillRect(x - 4, y, w + 8, 14);
  ctx.fillStyle = hex(0x7a4a34);
  for (let xx = x; xx < x + w; xx += 16) ctx.fillRect(xx, y + 10, 8, 4);
}
// a door, 2.1 m, on the foot of the front
function door(ctx, x, foot, c, w = 70) {
  const h = 96;
  ctx.fillStyle = hex(0x4a4438);
  ctx.fillRect(x - 5, foot - h - 5, w + 10, h + 5);
  ctx.fillStyle = hex(c);
  ctx.fillRect(x, foot - h, w, h);
  ctx.fillStyle = rgba(0xffffff, 0.08);
  ctx.fillRect(x + 4, foot - h + 4, w / 2 - 6, h - 8);
  ctx.fillStyle = hex(0xc8a050);
  ctx.fillRect(x + w - 10, foot - 48, 4, 8);
}
function shuttered(ctx, x, y) {
  ctx.fillStyle = hex(0x3a6a5a);
  ctx.fillRect(x, y, 52, 80);
  ctx.fillStyle = hex(0x2a4e42);
  ctx.fillRect(x + 25, y, 2, 80);
  for (let yy = y + 6; yy < y + 78; yy += 8) ctx.fillRect(x + 2, yy, 48, 1);
}

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
  // ---- the garage ---------------------------------------------------------------
  // a drum of oil, 0.9 m
  oil_drum: prop(30, 40, (ctx, w, h) => {
    ctx.fillStyle = hex(0x3a4a4e);
    ctx.fillRect(1, 2, w - 2, h - 2);
    ctx.fillStyle = hex(0x56686c);
    ctx.fillRect(1, 2, 6, h - 2);
    ctx.fillStyle = hex(0x1e282a);
    ctx.fillRect(0, 12, w, 2);
    ctx.fillRect(0, 26, w, 2);
    ctx.fillRect(1, 0, w - 2, 3);
  }),
  // spanners on a painted board, outlined so anyone can see which one is gone
  tool_board: prop(110, 70, (ctx, w, h) => {
    ctx.fillStyle = hex(0x4a5a4e);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = hex(0x2a2420);
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    for (let i = 0; i < 6; i++) {
      const x = 12 + i * 16;
      const l = 22 + i * 5;
      ctx.fillStyle = hex(i === 3 ? 0x3a4a3e : 0x9a9aa2); // (one is on the bench)
      ctx.fillRect(x, 10, 4, l);
      ctx.fillRect(x - 3, 8, 10, 5);
    }
  }),
  // a shelf of tins and the wireless Ottavia frowns at
  wireless_shelf: prop(120, 60, (ctx, w, h) => {
    ctx.fillStyle = hex(0x3a2a20);
    ctx.fillRect(0, h - 6, w, 6);
    ctx.fillStyle = hex(0x4a3020);
    ctx.fillRect(8, h - 46, 54, 40);
    ctx.fillStyle = hex(0xf2c078);
    ctx.fillRect(14, h - 40, 26, 14);
    ctx.fillStyle = hex(0x2a1e16);
    for (let y = h - 22; y < h - 10; y += 3) ctx.fillRect(14, y, 26, 1);
    ctx.fillStyle = hex(0xc8a050);
    ctx.fillRect(46, h - 36, 10, 10);
    ctx.fillRect(46, h - 22, 10, 10);
    for (const [x, c] of [[72, 0xb8302a], [88, 0x1f7a78], [104, 0x8a8a92]]) {
      ctx.fillStyle = hex(c);
      ctx.fillRect(x, h - 26, 12, 20);
    }
  }),
  // the sheet over his car, once it comes back
  sheeted_car: prop(176, 62, (ctx, w, h) => {
    ctx.fillStyle = hex(0xbab4a0);
    ctx.beginPath();
    ctx.moveTo(4, h);
    ctx.quadraticCurveTo(20, 12, 70, 10);
    ctx.quadraticCurveTo(120, 6, 150, 22);
    ctx.quadraticCurveTo(172, 30, w - 2, h);
    ctx.fill();
    ctx.fillStyle = hex(0x8e8876);
    for (const x of [40, 86, 130]) ctx.fillRect(x, 18, 3, h - 18);
  }),
  // ---- the quay: stone fronts, 44 px to the metre --------------------------------
  // the garage's front, in a stone wall, a tall door and the roller shutter at the far end
  pereval_front: prop(360, 320, (ctx, w, h) => {
    stoneFront(ctx, 0, 0, w, h);
    roofLine(ctx, 0, 0, w);
    door(ctx, 60, h, 0x1f7a78);
    ctx.fillStyle = hex(0x5a5650);
    ctx.fillRect(190, h - 132, 150, 132);
    ctx.fillStyle = hex(0x3a3630);
    for (let y = h - 132; y < h; y += 8) ctx.fillRect(190, y, 150, 1);
    shuttered(ctx, 60, 60);
    shuttered(ctx, 240, 60);
  }),
  // the Castellane house: narrow, two floors, a pot of basil
  castellane_front: prop(264, 320, (ctx, w, h) => {
    stoneFront(ctx, 0, 0, w, h, 0xe4d8be);
    roofLine(ctx, 0, 0, w);
    door(ctx, 92, h, 0x7a4a2c);
    shuttered(ctx, 40, 60);
    shuttered(ctx, 170, 60);
    ctx.fillStyle = hex(0xb86a4a);
    ctx.fillRect(176, h - 18, 22, 18);
    ctx.fillStyle = hex(0x4a7a3a);
    ctx.beginPath();
    ctx.arc(187, h - 26, 14, 0, Math.PI * 2);
    ctx.fill();
  }),
  // the cafe with Sable Oil's office over it: an awning, a stair door, a green-blinded window
  cafe_front: prop(352, 340, (ctx, w, h) => {
    stoneFront(ctx, 0, 0, w, h, 0xdccfb0);
    roofLine(ctx, 0, 0, w);
    door(ctx, 26, h, 0x2e4a3a);
    // the cafe window
    ctx.fillStyle = hex(0x2a2a2e);
    ctx.fillRect(130, h - 120, 190, 96);
    ctx.fillStyle = hex(0xf2c878);
    ctx.fillRect(138, h - 112, 174, 80);
    ctx.fillStyle = hex(0x4a3020);
    ctx.fillRect(222, h - 112, 4, 80);
    // the office over it
    ctx.fillStyle = hex(0x2e4a3a);
    ctx.fillRect(150, 50, 150, 80);
    ctx.fillStyle = hex(0xc8a050);
    ctx.fillRect(150, 124, 150, 6);
  }),
  // a striped awning: 1.5 m deep from the front, you can stand on its frame
  cafe_awning: prop(208, 28, (ctx, w, h) => {
    for (let x = 0; x < w; x += 26) {
      ctx.fillStyle = hex((x / 26) % 2 ? 0xe8dcc0 : 0x2e4a3a);
      ctx.fillRect(x, 0, 26, h - 6);
    }
    ctx.fillStyle = hex(0x2a2420);
    ctx.fillRect(0, h - 6, w, 6);
  }),
  // the hospital's gate: pale, tall, one lamp, the only plaster on the quay
  hospital_front: prop(400, 400, (ctx, w, h) => {
    stoneFront(ctx, 0, 0, w, h, 0xece8d8);
    roofLine(ctx, 0, 0, w);
    door(ctx, 154, h, 0x4a5a58, 92);
    ctx.fillStyle = hex(0x8a9a8a);
    for (const x of [40, 110, 250, 320]) for (const y of [70, 190]) {
      ctx.fillRect(x, y, 44, 80);
      ctx.fillStyle = hex(0x3a4a4a);
      ctx.fillRect(x + 4, y + 4, 36, 72);
      ctx.fillStyle = hex(0x8a9a8a);
    }
    ctx.fillStyle = hex(0xf2c078);
    ctx.fillRect(196, h - 134, 8, 12);
  }),
  // an arch in a dry wall, the pit road or the Gull road past it
  road_arch: prop(200, 200, (ctx, w, h) => {
    stoneFront(ctx, 0, 0, w, h, 0xd0c4a8);
    ctx.fillStyle = hex(0xc8d8d4);
    ctx.fillRect(50, 70, 100, h - 70);
    ctx.beginPath();
    ctx.arc(100, 70, 50, 0, Math.PI * 2);
    ctx.fill();
  }),
  // a wall along the water, and the water
  sea_wall: prop(320, 66, (ctx, w, h) => {
    ctx.fillStyle = hex(0xd4c8ae);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hex(0xece2cc);
    ctx.fillRect(0, 0, w, 5);
    ctx.fillStyle = hex(0x8a8070);
    for (let x = 8; x < w; x += 30) ctx.fillRect(x, 10 + (x % 3) * 8, 18, 2);
  }),
  // an umbrella pine, 14 m: the camera crops it, as it should
  umbrella_pine: prop(400, 616, (ctx, w, h) => {
    ctx.strokeStyle = hex(0x5a4030);
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    ctx.quadraticCurveTo(w / 2 - 10, h - 280, w / 2 + 24, h - 480);
    ctx.stroke();
    for (const d of [-1, 1]) {
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(w / 2 + 16, h - 420);
      ctx.lineTo(w / 2 + 24 + d * 110, h - 510);
      ctx.stroke();
    }
    for (let i = 0; i < 46; i++) {
      const a = i / 46;
      ctx.fillStyle = hex(i % 3 ? 0x2e4a34 : 0x3e6444);
      ctx.beginPath();
      ctx.ellipse(10 + a * (w - 20), h - 520 - (1 - (a * 2 - 1) ** 2) * 80 + (i % 2) * 18, 34, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }),
  telegraph_pole: prop(36, 308, (ctx, w, h) => {
    ctx.fillStyle = hex(0x6a5238);
    ctx.fillRect(16, 6, 4, h - 6);
    ctx.fillStyle = hex(0x2e2620);
    ctx.fillRect(16, h - 44, 4, 44);
    ctx.fillStyle = hex(0x5a4630);
    ctx.fillRect(2, 8, 32, 3);
    ctx.fillStyle = hex(0xe8e4d8);
    ctx.fillRect(3, 4, 3, 4);
    ctx.fillRect(31, 4, 3, 4);
  }),
  milestone: prop(20, 31, (ctx, w, h) => {
    ctx.fillStyle = hex(0xece6d4);
    ctx.fillRect(2, 4, 16, h - 4);
    ctx.fillStyle = hex(0xa84a30);
    ctx.fillRect(2, 3, 16, 2);
    ctx.fillStyle = hex(0x4a4438);
    ctx.fillRect(6, 12, 8, 2);
  }),
  straw_bales: prop(132, 88, (ctx, w, h) => {
    for (const [x, y] of [[0, 44], [44, 44], [88, 44], [22, 0], [66, 0]]) {
      ctx.fillStyle = hex(0xc8a858);
      ctx.fillRect(x, y, 44, 44);
      ctx.fillStyle = hex(0x9a7e3c);
      for (let i = 0; i < 6; i++) ctx.fillRect(x + 4 + i * 6, y + 3 + (i % 3) * 12, 4, 10);
      ctx.fillStyle = hex(0x6a4a2c);
      ctx.fillRect(x, y + 14, 44, 2);
      ctx.fillRect(x, y + 30, 44, 2);
    }
  }),
  fishing_boat: prop(280, 110, (ctx, w, h) => {
    ctx.fillStyle = hex(0xdcd8c8);
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(w, 30);
    ctx.lineTo(w - 30, h);
    ctx.lineTo(24, h);
    ctx.fill();
    ctx.fillStyle = hex(0x2e5a6a);
    ctx.fillRect(10, 44, w - 30, 5);
    ctx.fillStyle = hex(0x5a4030);
    ctx.fillRect(130, 0, 5, 40);
  }),
  // ---- Mr Sable's office: green leather, brass, cigar haze ------------------------
  sable_desk: prop(264, 80, (ctx, w, h) => {
    ctx.fillStyle = hex(0x4a3020);
    ctx.fillRect(0, 10, w, 10);
    ctx.fillRect(10, 20, 44, h - 20);
    ctx.fillRect(w - 54, 20, 44, h - 20);
    ctx.fillStyle = hex(0x2e4a3a);
    ctx.fillRect(4, 4, w - 8, 8);
    ctx.fillStyle = hex(0xc8a050);
    ctx.fillRect(14, 30, 30, 3);
    ctx.fillRect(w - 44, 30, 30, 3);
  }),
  sable_chair: prop(70, 110, (ctx, w, h) => {
    ctx.fillStyle = hex(0x24382c);
    ctx.fillRect(10, 0, 50, h - 40);
    ctx.fillRect(4, h - 44, 62, 14);
    ctx.fillStyle = hex(0x3a5a48);
    ctx.fillRect(14, 4, 8, h - 50);
    ctx.fillStyle = hex(0x2a1e16);
    ctx.fillRect(12, h - 30, 6, 30);
    ctx.fillRect(52, h - 30, 6, 30);
  }),
  brass_lamp: prop(30, 40, (ctx, w, h) => {
    ctx.fillStyle = hex(0x2e6a4a);
    ctx.fillRect(2, 2, w - 4, 12);
    ctx.fillStyle = hex(0xc8a050);
    ctx.fillRect(13, 14, 4, h - 18);
    ctx.fillRect(6, h - 4, 18, 4);
  }),
  // the season's slate, a chalk board on the garage wall (the words are live: verbs/garage.js)
  season_slate: prop(190, 92, (ctx, w, h) => {
    ctx.fillStyle = hex(0x3a2a20);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hex(0x1e2a28);
    ctx.fillRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = rgba(0xf2e6cc, 0.06);
    ctx.fillRect(10, 12, w - 40, 3);
    ctx.fillRect(30, 60, w - 50, 4);
  }),
  // the Coppa's poster: the road, the sea, a number; going yellow in the salt
  coppa_poster: prop(60, 76, (ctx, w, h) => {
    ctx.fillStyle = hex(0xe8dcc0);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hex(0x20305a);
    ctx.fillRect(4, 4, w - 8, 40);
    ctx.fillStyle = hex(0xf2b868);
    ctx.beginPath();
    ctx.arc(w - 18, 18, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0xb8302a);
    ctx.beginPath();
    ctx.moveTo(6, 44);
    ctx.quadraticCurveTo(w / 2, 22, w - 12, 44);
    ctx.lineTo(w - 22, 44);
    ctx.quadraticCurveTo(w / 2, 32, 20, 44);
    ctx.fill();
    ctx.fillStyle = hex(0x2a2420);
    for (let i = 0; i < 3; i++) ctx.fillRect(8, 50 + i * 7, w - 16 - i * 8, 3);
  }),
  // an oil company's poster, in the taste of 1958: a sun and a can
  sable_poster: prop(90, 130, (ctx, w, h) => {
    ctx.fillStyle = hex(0xe8dcc0);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hex(0x2e4a3a);
    ctx.fillRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = hex(0xf2b868);
    ctx.beginPath();
    ctx.arc(w / 2, 50, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0xc8a050);
    ctx.fillRect(w / 2 - 14, 84, 28, 32);
  }),
  filing_cabinet: prop(52, 120, (ctx, w, h) => {
    ctx.fillStyle = hex(0x4e5a50);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hex(0x2a342c);
    for (let y = 0; y < h; y += 30) ctx.fillRect(0, y, w, 2);
    ctx.fillStyle = hex(0xc8a050);
    for (let y = 12; y < h; y += 30) ctx.fillRect(w / 2 - 8, y, 16, 3);
  }),
  // a paper on the desk (a live prop: it goes when it is signed)
  contract: prop(36, 8, (ctx, w, h) => {
    ctx.fillStyle = hex(0xf2ece0);
    ctx.fillRect(0, 2, w, h - 2);
    ctx.fillStyle = hex(0x4a4438);
    ctx.fillRect(4, 3, w - 8, 1);
  }),
  // ---- the corridor: pale green tile, one yellow lamp -----------------------------
  ward_door: prop(100, 110, (ctx, w, h) => {
    ctx.fillStyle = hex(0x3a4a48);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hex(0x5e7470);
    ctx.fillRect(4, 4, w / 2 - 6, h - 4);
    ctx.fillRect(w / 2 + 2, 4, w / 2 - 6, h - 4);
    ctx.fillStyle = hex(0x28343a);
    ctx.fillRect(14, 20, 20, 30);
    ctx.fillRect(w - 34, 20, 20, 30);
    ctx.fillStyle = hex(0xc8c4b0);
    ctx.fillRect(w / 2 - 6, 60, 3, 16);
    ctx.fillRect(w / 2 + 3, 60, 3, 16);
  }),
  wall_lamp_yellow: { w: 40, h: 40, anchor: [0.5, 0], light: { x: 20, y: 20, r: 180, color: 0xf2d080 }, paint(ctx, w) {
    ctx.fillStyle = hex(0x4a4438);
    ctx.fillRect(w / 2 - 2, 0, 4, 12);
    ctx.fillStyle = hex(0xf6dc90);
    ctx.fillRect(w / 2 - 10, 12, 20, 16);
    ctx.fillStyle = hex(0x6a6048);
    ctx.fillRect(w / 2 - 12, 10, 24, 3);
  } },
  linen_trolley: prop(120, 66, (ctx, w, h) => {
    ctx.fillStyle = hex(0x5a6a68);
    ctx.fillRect(4, 14, w - 8, 3);
    ctx.fillRect(4, 42, w - 8, 3);
    ctx.fillRect(4, 14, 3, h - 22);
    ctx.fillRect(w - 7, 14, 3, h - 22);
    ctx.fillStyle = hex(0xe8e4d8);
    ctx.fillRect(12, 2, w - 24, 12);
    ctx.fillRect(12, 30, w - 24, 12);
    ctx.fillStyle = hex(0x1e1c22);
    ctx.fillRect(6, h - 8, 8, 8);
    ctx.fillRect(w - 14, h - 8, 8, 8);
  }),
  wooden_chair: prop(40, 80, (ctx, w, h) => {
    ctx.fillStyle = hex(0x6a4a2c);
    ctx.fillRect(4, 0, 4, h);
    ctx.fillRect(4, 40, w - 8, 5);
    ctx.fillRect(w - 8, 40, 4, h - 40);
    ctx.fillRect(4, 6, 18, 3);
    ctx.fillRect(4, 18, 18, 3);
  }),
  // his gloves, on the seat: back of the hand up, the fingers together
  gloves_on_chair: prop(40, 12, (ctx, w, h) => {
    ctx.fillStyle = hex(0xc0945c);
    ctx.fillRect(8, 2, 22, h - 2);
    ctx.fillStyle = hex(0x7a5a38);
    for (let x = 12; x < 30; x += 4) ctx.fillRect(x, 2, 1, h - 2);
    ctx.fillStyle = hex(0xe0b880);
    ctx.fillRect(8, 2, 22, 2);
  }),
  // iron stair treads, under the planks that carry Jo
  iron_tread: prop(170, 16, (ctx, w, h) => {
    ctx.fillStyle = hex(0x3a4648);
    ctx.fillRect(0, 0, w, 8);
    ctx.fillStyle = hex(0x5a6a6c);
    ctx.fillRect(0, 0, w, 2);
    ctx.fillStyle = hex(0x2a3234);
    for (let x = 4; x < w; x += 18) ctx.fillRect(x, 8, 4, h - 8);
  }),
  // ---- the Castellane kitchen: terracotta, cream, evening -------------------------
  iron_stove: prop(120, 92, (ctx, w, h) => {
    ctx.fillStyle = hex(0x2a2628);
    ctx.fillRect(0, 12, w, h - 12);
    ctx.fillStyle = hex(0x46404a);
    ctx.fillRect(0, 12, w, 6);
    ctx.fillStyle = hex(0xe07a3a);
    ctx.fillRect(16, 40, 34, 22);
    ctx.fillStyle = hex(0x8a8a92);
    ctx.fillRect(70, 30, 34, 36);
    ctx.fillStyle = hex(0x6a4a3a);
    ctx.fillRect(38, 0, 40, 12); // the pot
  }),
  kitchen_table: prop(310, 70, (ctx, w, h) => {
    ctx.fillStyle = hex(0x4e321c);
    ctx.fillRect(0, 12, w, 10);
    ctx.fillStyle = hex(0x8a6238);
    ctx.fillRect(0, 12, w, 3);
    ctx.fillStyle = hex(0x3a2614);
    ctx.fillRect(12, 22, 12, h - 22);
    ctx.fillRect(w - 24, 22, 12, h - 22);
  }),
  dresser: prop(130, 170, (ctx, w, h) => {
    ctx.fillStyle = hex(0x6a4a2c);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hex(0x3a2a1a);
    ctx.fillRect(8, 8, w - 16, 44);
    ctx.fillRect(8, 60, w - 16, 44);
    ctx.fillStyle = hex(0xe8dcc0);
    for (let x = 16; x < w - 20; x += 22) ctx.fillRect(x, 30, 16, 20);
    ctx.fillStyle = hex(0x8a5a3a);
    ctx.fillRect(4, 110, w - 8, 56);
    ctx.fillStyle = hex(0xc8a050);
    ctx.fillRect(w / 2 - 12, 132, 24, 4);
  }),
  // the money tin, on the dresser, until Jo takes it
  prize_tin: prop(38, 20, (ctx, w, h) => {
    ctx.fillStyle = hex(0xb8302a);
    ctx.fillRect(0, 4, w, h - 4);
    ctx.fillStyle = hex(0xc8a050);
    ctx.fillRect(0, 2, w, 4);
    ctx.fillRect(w / 2 - 4, 8, 8, 6);
  }),
  // a stoneware jar: its coins are drawn over it, its label over them (verbs/places.js)
  jar: prop(44, 56, (ctx, w, h) => {
    ctx.fillStyle = hex(0x7a5a38);
    ctx.fillRect(4, 8, w - 8, h - 8);
    ctx.fillStyle = hex(0xa8805a);
    ctx.fillRect(6, 10, 7, h - 12);
    ctx.fillStyle = hex(0x8a7a5c);
    ctx.fillRect(8, 0, w - 16, 9);
    ctx.fillStyle = hex(0x4a3e2c);
    ctx.fillRect(8, 0, w - 16, 2);
  }),
  evening_window: prop(100, 110, (ctx, w, h) => {
    ctx.fillStyle = hex(0xe8dcc0);
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 8, 0, h - 8);
    g.addColorStop(0, '#d88a58');
    g.addColorStop(1, '#f2c078');
    ctx.fillStyle = g;
    ctx.fillRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = hex(0x5a4228);
    ctx.fillRect(w / 2 - 2, 8, 4, h - 16);
    ctx.fillRect(8, h / 2 - 2, w - 16, 4);
    ctx.fillStyle = hex(0x4a6a8a);
    ctx.fillRect(8, h - 30, w - 16, 12); // a line of sea
  }),
  kitchen_clock: prop(40, 40, (ctx, w) => {
    ctx.fillStyle = hex(0x4a3020);
    ctx.beginPath();
    ctx.arc(w / 2, 20, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0xf2e6cc);
    ctx.beginPath();
    ctx.arc(w / 2, 20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0x2a1e16);
    ctx.fillRect(w / 2 - 1, 8, 2, 12);
    ctx.fillRect(w / 2 - 1, 19, 10, 2);
  }),
  // ---- the night before: the bend on foot ------------------------------------------
  brake_board: prop(40, 120, (ctx, w, h) => {
    ctx.fillStyle = hex(0x5a4630);
    ctx.fillRect(w / 2 - 2, 30, 4, h - 30);
    ctx.fillStyle = hex(0xe8e0c8);
    ctx.fillRect(0, 0, w, 34);
    ctx.fillStyle = hex(0x2a2420);
    ctx.fillRect(6, 8, w - 12, 4);
    ctx.fillRect(6, 20, w - 12, 4);
  }),
  // what the chalk leaves on the road (live: it appears when it is made)
  chalk_mark: prop(66, 14, (ctx, w, h) => {
    ctx.fillStyle = hex(0xf2ece0);
    ctx.fillRect(0, h - 8, w, 3);
    ctx.fillRect(w / 2 - 2, 0, 4, h - 2);
    ctx.fillStyle = 'rgba(242,236,224,0.5)';
    ctx.fillRect(6, h - 4, w - 14, 2);
  }),
  cliff_wall: prop(320, 70, (ctx, w, h) => {
    ctx.fillStyle = hex(0x7a7a86);
    ctx.fillRect(0, 12, w, h - 12);
    ctx.fillStyle = hex(0x9a9aa6);
    for (let x = 0; x < w; x += 26) ctx.fillRect(x, 8 + (x % 3) * 2, 24, 10);
    ctx.fillStyle = hex(0x2a2a30);
    for (let x = 12; x < w; x += 30) ctx.fillRect(x, 30 + (x % 4) * 6, 18, 2);
  }),
  // ---- the pit lane -----------------------------------------------------------------
  pit_counter: prop(300, 96, (ctx, w, h) => {
    ctx.fillStyle = hex(0x8a8070);
    ctx.fillRect(0, 30, w, h - 30);
    ctx.fillStyle = hex(0xe8dcc0);
    ctx.fillRect(0, 24, w, 8);
    ctx.fillStyle = hex(0x1f7a78);
    ctx.fillRect(0, 34, w, 5);
    ctx.fillStyle = hex(0x6a4a2c);
    for (let x = 12; x < w; x += 60) ctx.fillRect(x, 0, 4, 26);
  }),
  // the signalling slate, on its pole
  pit_board: prop(50, 130, (ctx, w, h) => {
    ctx.fillStyle = hex(0x6a4a2c);
    ctx.fillRect(w / 2 - 2, 40, 4, h - 40);
    ctx.fillStyle = hex(0x24282a);
    ctx.fillRect(0, 0, w, 44);
    ctx.strokeStyle = hex(0xe8e0c8);
    ctx.strokeRect(2, 2, w - 4, 40);
  }),
  fuel_churn: prop(36, 56, (ctx, w, h) => {
    ctx.fillStyle = hex(0x8a2a24);
    ctx.fillRect(2, 12, w - 4, h - 12);
    ctx.fillStyle = hex(0xc8c4b0);
    ctx.fillRect(10, 0, w - 20, 12);
    ctx.fillStyle = hex(0x5a1e1a);
    ctx.fillRect(2, 28, w - 4, 2);
  }),
  tyre_stack: prop(60, 66, (ctx, w, h) => {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = hex(0x1e1c22);
      ctx.fillRect(2, h - (i + 1) * 15, w - 4, 13);
      ctx.fillStyle = hex(0x3a3640);
      ctx.fillRect(2, h - (i + 1) * 15, w - 4, 3);
    }
  }),
  bunting: prop(320, 40, (ctx, w) => {
    ctx.strokeStyle = hex(0x2a2420);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(w / 2, 22, w, 0);
    ctx.stroke();
    for (let i = 1; i < 12; i++) {
      const x = (i * w) / 12;
      const y = 22 * (1 - ((2 * i) / 12 - 1) ** 2);
      ctx.fillStyle = hex([0x1f7a78, 0xe8dcc0, 0xb8302a][i % 3]);
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x, y + 14);
      ctx.fill();
    }
  }),
};
