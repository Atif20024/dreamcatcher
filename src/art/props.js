// PropLibrary painters (plan 2.3.4, 4.5): props are painted canvases in
// the game's painterly style (light from the top-left, weight at the foot,
// grain). A prop definition:
//   { id, w, h, anchor: [ax, ay] (0..1 of w/h), paint(ctx, w, h, P), light?: { x, y, r, color }, solid? }
// Static props bake into the room's chunks; `live` props (lights, the clock
// face an encounter animates) stay display objects. Dreams may add their own
// props (dream.props) with the same shape; these are the shared ones.
import { mix, rgba, hex, stamp, dab, gradientV, grain, foliage, trunk, clump } from './paint.js';

const P0 = {
  lit: 0xf6dcae, deep: 0x161220, warm: 0xf2b45a, glow: 0xffd88a, iron: 0x2a2630, ironLit: 0x6a6070,
  wood: 0x6a4428, woodLit: 0xa8784a, stone: 0x8a8070, stoneLit: 0xc8b898, plaster: 0xd8c8a8, roof: 0x5a3a44,
  leaf: 0x4a6a3a, leafLit: 0x9ab860, brass: 0xc8963a, brassLit: 0xf2d080, glass: 0x2a3450, cloth: 0x8a3a3a,
};

function rand(seed) {
  let s = (seed * 7919 + 17) % 233280;
  const f = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return { frac: f, realInRange: (a, b) => a + f() * (b - a), between: (a, b) => Math.floor(a + f() * (b - a + 1)) };
}

// a lit box: gradient face with a lit left edge and shaded right edge
function box(ctx, x, y, w, h, col, P, { top = true } = {}) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, hex(mix(col, P.lit, 0.28)));
  g.addColorStop(0.35, hex(col));
  g.addColorStop(1, hex(mix(col, P.deep, 0.45)));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  if (top) {
    ctx.fillStyle = rgba(P.lit, 0.35);
    ctx.fillRect(x, y, w, 1);
  }
  ctx.fillStyle = rgba(P.deep, 0.7);
  ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillRect(x, y + h - 1, w, 1);
}

function window_(ctx, x, y, w, h, P, { lit = true, panes = 2, shutters = false } = {}) {
  box(ctx, x - 3, y - 3, w + 6, h + 6, P.wood, P);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (lit) {
    g.addColorStop(0, hex(mix(P.warm, 0xffffff, 0.25)));
    g.addColorStop(1, hex(mix(P.warm, 0x8a4020, 0.35)));
  } else {
    g.addColorStop(0, hex(mix(P.glass, 0x6a7aa0, 0.4)));
    g.addColorStop(1, hex(P.glass));
  }
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rgba(P.deep, 0.85);
  for (let i = 1; i < panes; i++) ctx.fillRect(x + Math.round((w * i) / panes), y, 2, h);
  ctx.fillRect(x, y + Math.round(h / 2), w, 2);
  if (lit) {
    // a figure of warm light: curtain edges
    ctx.fillStyle = rgba(P.cloth, 0.55);
    ctx.fillRect(x, y, 4, h);
    ctx.fillRect(x + w - 4, y, 4, h);
  }
  ctx.fillStyle = rgba(0xffffff, 0.25);
  ctx.fillRect(x + 2, y + 2, 2, Math.round(h / 2) - 4);
  box(ctx, x - 5, y + h + 2, w + 10, 4, P.stone, P);
  if (shutters) {
    box(ctx, x - 14, y - 2, 9, h + 4, mix(P.leaf, P.deep, 0.3), P);
    box(ctx, x + w + 5, y - 2, 9, h + 4, mix(P.leaf, P.deep, 0.3), P);
  }
}

function roof(ctx, x0, x1, y, h, P, r) {
  ctx.fillStyle = hex(P.roof);
  ctx.beginPath();
  ctx.moveTo(x0 - 10, y + h);
  ctx.lineTo((x0 + x1) / 2, y);
  ctx.lineTo(x1 + 10, y + h);
  ctx.closePath();
  ctx.fill();
  // tiles: rows of scallops, lit on the left slope
  ctx.save();
  ctx.clip();
  for (let yy = y + 4; yy < y + h; yy += 6) {
    for (let xx = x0 - 10 + ((yy / 6) % 2) * 5; xx < x1 + 10; xx += 10) {
      const left = xx < (x0 + x1) / 2;
      ctx.fillStyle = rgba(left ? mix(P.roof, P.lit, 0.25) : mix(P.roof, P.deep, 0.35), 0.9);
      ctx.beginPath();
      ctx.arc(xx + 5, yy, 5, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = rgba(P.deep, 0.4);
      ctx.fillRect(xx, yy + 4, 10, 1);
    }
  }
  ctx.restore();
  void r;
}

const PROPS = {
  lamp_post: {
    w: 48, h: 168, anchor: [0.5, 1], light: { x: 24, y: 26, r: 120, color: 0xffc870 },
    paint(ctx, w, h, P) {
      box(ctx, 14, h - 14, 20, 14, P.iron, P);
      box(ctx, 21, 40, 6, h - 54, P.iron, P);
      ctx.fillStyle = rgba(P.ironLit, 0.6);
      ctx.fillRect(21, 40, 1, h - 54);
      // the crossbar and the ladder rest
      box(ctx, 8, 46, 32, 3, P.iron, P);
      // the lantern: a cage with warm glass
      box(ctx, 13, 14, 22, 4, P.iron, P);
      const g = ctx.createLinearGradient(0, 18, 0, 38);
      g.addColorStop(0, hex(0xfff0c0));
      g.addColorStop(1, hex(P.warm));
      ctx.fillStyle = g;
      ctx.fillRect(15, 18, 18, 20);
      ctx.fillStyle = hex(P.iron);
      ctx.fillRect(15, 18, 2, 20);
      ctx.fillRect(23, 18, 2, 20);
      ctx.fillRect(31, 18, 2, 20);
      box(ctx, 12, 38, 24, 4, P.iron, P);
      ctx.fillStyle = hex(P.iron);
      ctx.beginPath();
      ctx.moveTo(12, 14);
      ctx.lineTo(24, 4);
      ctx.lineTo(36, 14);
      ctx.fill();
      stamp(ctx, 24, 3, 2.5, P.iron, 1, 0.1);
    },
  },
  lamp_post_dark: {
    w: 48, h: 168, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      PROPS.lamp_post.paint(ctx, w, h, { ...P, warm: 0x3a3a4a });
      ctx.fillStyle = rgba(0x2a3048, 0.85);
      ctx.fillRect(17, 18, 6, 20);
      ctx.fillRect(25, 18, 6, 20);
    },
  },
  bench: {
    w: 96, h: 44, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      for (const x of [10, 78]) box(ctx, x, 22, 6, 22, P.iron, P);
      for (let i = 0; i < 3; i++) box(ctx, 4, 6 + i * 6, 88, 4, P.wood, P);
      box(ctx, 4, 24, 88, 5, mix(P.wood, P.lit, 0.1), P);
      box(ctx, 6, 30, 84, 3, P.wood, P);
    },
  },
  barrel: {
    w: 36, h: 46, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      const g = ctx.createLinearGradient(2, 0, 34, 0);
      g.addColorStop(0, hex(mix(P.wood, P.lit, 0.3)));
      g.addColorStop(0.4, hex(P.wood));
      g.addColorStop(1, hex(mix(P.wood, P.deep, 0.55)));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(18, 23, 16, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = rgba(P.deep, 0.35);
      for (let x = 6; x < 34; x += 6) ctx.fillRect(x, 0, 1, h);
      for (const y of [8, 36]) box(ctx, 0, y, 36, 4, P.iron, P);
      ctx.restore();
      ctx.fillStyle = hex(mix(P.wood, P.deep, 0.3));
      ctx.beginPath();
      ctx.ellipse(18, 3, 13, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  crate: {
    w: 40, h: 38, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      box(ctx, 1, 1, 38, 37, mix(P.wood, P.lit, 0.15), P);
      ctx.strokeStyle = rgba(P.deep, 0.55);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.lineTo(36, 34);
      ctx.stroke();
      ctx.strokeStyle = rgba(P.deep, 0.5);
      ctx.lineWidth = 1;
      ctx.strokeRect(4.5, 4.5, 31, 29);
      for (const y of [12, 22]) {
        ctx.fillStyle = rgba(P.deep, 0.3);
        ctx.fillRect(2, y, 36, 1);
      }
    },
  },
  bush: {
    w: 120, h: 70, anchor: [0.5, 1],
    paint(ctx, w, h, P, seed = 1) {
      const r = rand(seed * 13);
      foliage(ctx, 60, 42, 54, 28, P.leaf, r, { density: 1.2 });
      for (let i = 0; i < 5; i++) stamp(ctx, 20 + r.frac() * 80, 30 + r.frac() * 20, 1.6, [0xe8a0a0, 0xf2e0a0][i % 2], 0.85, 0.3);
    },
  },
  tree: {
    w: 260, h: 320, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      const r = rand(7);
      trunk(ctx, 130, 150, 320, 18, 34, P.wood, r);
      // two branches
      ctx.strokeStyle = hex(mix(P.wood, P.deep, 0.2));
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(128, 200);
      ctx.quadraticCurveTo(100, 160, 70, 130);
      ctx.moveTo(134, 190);
      ctx.quadraticCurveTo(170, 150, 196, 128);
      ctx.stroke();
      foliage(ctx, 130, 110, 120, 92, P.leaf, r, { density: 1 });
      foliage(ctx, 70, 140, 60, 44, P.leaf, r, { density: 1 });
      foliage(ctx, 196, 136, 58, 44, P.leaf, r, { density: 1 });
      // roots flaring into the ground
      ctx.fillStyle = hex(mix(P.wood, P.deep, 0.25));
      ctx.beginPath();
      ctx.moveTo(100, 320);
      ctx.quadraticCurveTo(118, 300, 116, 280);
      ctx.lineTo(146, 280);
      ctx.quadraticCurveTo(146, 300, 164, 320);
      ctx.fill();
    },
  },
  // the clock house: a two-storey facade with a door, two lit windows and a clock
  house_clock: {
    w: 256, h: 288, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      const r = rand(3);
      box(ctx, 16, 92, 224, 196, P.plaster, P);
      // timber frame
      ctx.fillStyle = hex(mix(P.wood, P.deep, 0.3));
      for (const x of [16, 84, 172, 236]) ctx.fillRect(x, 92, 4, 196);
      ctx.fillRect(16, 180, 224, 5);
      ctx.fillRect(16, 92, 224, 5);
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(88 + i * 28, 186);
        ctx.rotate(-0.5);
        ctx.fillRect(0, 0, 4, 46);
        ctx.restore();
      }
      grain(ctx, 16, 92, 224, 196, 0.07, 3);
      roof(ctx, 8, 248, 22, 74, P, r);
      // the clock in the gable
      stamp(ctx, 128, 64, 22, P.deep, 0.5, 0.3);
      const g = ctx.createRadialGradient(124, 60, 2, 128, 64, 20);
      g.addColorStop(0, hex(0xfff6dc));
      g.addColorStop(1, hex(0xe0c8a0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(128, 64, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hex(P.brass);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = hex(P.deep);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(128, 64);
      ctx.lineTo(128, 50);
      ctx.moveTo(128, 64);
      ctx.lineTo(137, 68);
      ctx.stroke();
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        ctx.fillStyle = hex(P.deep);
        ctx.fillRect(128 + Math.cos(a) * 14 - 1, 64 + Math.sin(a) * 14 - 1, 2, 2);
      }
      window_(ctx, 34, 118, 34, 44, P, { lit: true, shutters: false });
      window_(ctx, 190, 118, 34, 44, P, { lit: true });
      window_(ctx, 34, 210, 34, 40, P, { lit: false });
      // the door (the portal sits in front of it)
      box(ctx, 106, 186, 52, 102, mix(P.wood, P.deep, 0.25), P);
      box(ctx, 112, 194, 40, 94, P.wood, P);
      ctx.fillStyle = rgba(P.deep, 0.5);
      ctx.fillRect(131, 194, 2, 94);
      for (const y of [214, 250]) ctx.fillRect(112, y, 40, 2);
      stamp(ctx, 145, 244, 2.5, P.brassLit, 1, 0.2);
      ctx.fillStyle = hex(mix(P.warm, 0xffffff, 0.2));
      ctx.beginPath();
      ctx.arc(132, 194, 20, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = hex(P.deep);
      ctx.fillRect(131, 174, 2, 20);
      // step and a sign over the door
      box(ctx, 98, 282, 68, 6, P.stone, P);
      box(ctx, 176, 196, 50, 22, P.wood, P);
      ctx.fillStyle = rgba(P.brassLit, 0.9);
      for (let k = 0; k < 3; k++) stamp(ctx, 186 + k * 15, 207, 3, P.brass, 0.95, 0.2);
      // flower box under the left window
      box(ctx, 28, 166, 46, 8, P.wood, P);
      for (let i = 0; i < 7; i++) clump(ctx, 32 + i * 6, 164, 4, i % 2 ? 0xe86a5a : P.leafLit, 0.95, r, 4);
    },
  },
  house_small: {
    w: 192, h: 224, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      const r = rand(5);
      box(ctx, 12, 74, 168, 150, mix(P.plaster, 0xa87858, 0.35), P);
      grain(ctx, 12, 74, 168, 150, 0.08, 9);
      // brick quoins
      for (let y = 78; y < 220; y += 10) {
        box(ctx, 12, y, 12 + ((y / 10) % 2) * 6, 8, 0x8a4a34, P);
        box(ctx, 168 - ((y / 10) % 2) * 6, y, 12 + ((y / 10) % 2) * 6, 8, 0x8a4a34, P);
      }
      roof(ctx, 4, 188, 12, 64, { ...P, roof: mix(P.roof, 0x3a4458, 0.5) }, r);
      window_(ctx, 40, 102, 30, 40, P, { lit: true, shutters: true });
      window_(ctx, 122, 102, 30, 40, P, { lit: false, shutters: true });
      box(ctx, 76, 150, 40, 74, mix(P.leaf, P.deep, 0.35), P);
      stamp(ctx, 108, 190, 2, P.brassLit, 1, 0.2);
      box(ctx, 140, 20, 18, 40, 0x7a4a38, P);
    },
  },
  // the seam between the lane and the green: a hedge arch you walk through
  arch_hedge: {
    w: 224, h: 248, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      const r = rand(11);
      // posts
      for (const x of [14, 178]) {
        box(ctx, x, 120, 32, 128, P.stone, P);
        box(ctx, x - 4, 112, 40, 12, P.stoneLit, P);
      }
      // the hedge over the arch
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, 150);
      ctx.clip();
      foliage(ctx, 112, 80, 108, 66, P.leaf, r, { density: 1.4 });
      ctx.restore();
      // carve the opening back out
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(46, 248);
      ctx.lineTo(46, 140);
      ctx.quadraticCurveTo(112, 54, 178, 140);
      ctx.lineTo(178, 248);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // inner shadow of the arch
      ctx.strokeStyle = rgba(P.deep, 0.5);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(48, 142);
      ctx.quadraticCurveTo(112, 58, 176, 142);
      ctx.stroke();
      // roses
      for (let i = 0; i < 9; i++) stamp(ctx, 20 + r.frac() * 184, 30 + r.frac() * 90, 2.4, i % 3 ? 0xe86a6a : 0xf2d0c0, 0.9, 0.3);
    },
  },
  arch_stone: {
    w: 200, h: 256, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      for (const x of [8, 160]) {
        box(ctx, x, 70, 32, 186, P.stone, P);
        for (let y = 78; y < 256; y += 18) {
          ctx.fillStyle = rgba(P.deep, 0.4);
          ctx.fillRect(x, y, 32, 1);
        }
      }
      ctx.fillStyle = hex(P.stone);
      ctx.beginPath();
      ctx.moveTo(8, 90);
      ctx.quadraticCurveTo(100, -20, 192, 90);
      ctx.lineTo(160, 96);
      ctx.quadraticCurveTo(100, 24, 40, 96);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(P.stoneLit, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, 88);
      ctx.quadraticCurveTo(100, -18, 190, 88);
      ctx.stroke();
      for (let k = 1; k < 9; k++) {
        const t = k / 9;
        const x = 8 + t * 184;
        ctx.strokeStyle = rgba(P.deep, 0.45);
        ctx.beginPath();
        ctx.moveTo(x, 90 - Math.sin(t * Math.PI) * 74);
        ctx.lineTo(40 + t * 120, 96 - Math.sin(t * Math.PI) * 56);
        ctx.stroke();
      }
      grain(ctx, 0, 0, w, h, 0.08, 4);
    },
  },
  signpost: {
    w: 72, h: 110, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      box(ctx, 33, 20, 6, 90, P.wood, P);
      ctx.fillStyle = hex(mix(P.wood, P.lit, 0.25));
      ctx.beginPath();
      ctx.moveTo(6, 24);
      ctx.lineTo(56, 24);
      ctx.lineTo(66, 32);
      ctx.lineTo(56, 40);
      ctx.lineTo(6, 40);
      ctx.fill();
      ctx.fillStyle = rgba(P.deep, 0.5);
      ctx.fillRect(12, 31, 40, 2);
      ctx.fillStyle = hex(mix(P.wood, P.lit, 0.15));
      ctx.beginPath();
      ctx.moveTo(66, 48);
      ctx.lineTo(16, 48);
      ctx.lineTo(6, 56);
      ctx.lineTo(16, 64);
      ctx.lineTo(66, 64);
      ctx.fill();
      ctx.fillStyle = rgba(P.deep, 0.5);
      ctx.fillRect(20, 55, 40, 2);
    },
  },
  // the seam between the green and the bell yard: a lychgate roof over the
  // iron gate's stone posts (DreamGate, 4.4 m), the fence running up to it.
  // Only the roof is painted: the posts and the gate are the live DreamGate.
  yard_lychgate: {
    w: 140, h: 252, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      const r = rand(23);
      const beam = h - 204; // just over the posts' caps
      // the tie beam and its brackets down onto the posts
      box(ctx, 6, beam, w - 12, 10, P.wood, P);
      for (const x of [26, w - 34]) {
        ctx.fillStyle = hex(mix(P.wood, P.deep, 0.2));
        ctx.beginPath();
        ctx.moveTo(x, beam + 10);
        ctx.lineTo(x + 8, beam + 10);
        ctx.lineTo(x + 4, beam + 24);
        ctx.fill();
      }
      // a steep tiled roof with a ridge, lit on its left slope
      const peak = beam - 44;
      ctx.fillStyle = hex(P.roof);
      ctx.beginPath();
      ctx.moveTo(0, beam + 2);
      ctx.lineTo(w / 2, peak);
      ctx.lineTo(w, beam + 2);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.clip();
      for (let y = peak + 6; y < beam; y += 7) {
        ctx.fillStyle = rgba(P.deep, 0.35);
        ctx.fillRect(0, y, w, 1);
        for (let x = (y / 7) % 2 ? 0 : 6; x < w; x += 12) ctx.fillRect(x, y - 6, 1, 6);
      }
      ctx.fillStyle = rgba(P.lit, 0.18);
      ctx.beginPath();
      ctx.moveTo(0, beam + 2);
      ctx.lineTo(w / 2, peak);
      ctx.lineTo(w / 2, beam + 2);
      ctx.fill();
      ctx.restore();
      box(ctx, w / 2 - 3, peak - 4, 6, 8, mix(P.roof, P.deep, 0.3), P);
      // moss on the tiles
      for (let i = 0; i < 6; i++) stamp(ctx, 16 + r.frac() * (w - 32), beam - 6 - r.frac() * 20, 2.2, P.leaf, 0.7, 0.4);
    },
  },
  fence: {
    w: 128, h: 48, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      for (let x = 4; x < w; x += 20) {
        box(ctx, x, 8, 8, 40, mix(P.wood, P.lit, 0.15), P);
        ctx.fillStyle = hex(mix(P.wood, P.lit, 0.15));
        ctx.beginPath();
        ctx.moveTo(x, 8);
        ctx.lineTo(x + 4, 2);
        ctx.lineTo(x + 8, 8);
        ctx.fill();
      }
      for (const y of [16, 34]) box(ctx, 0, y, w, 5, P.wood, P);
    },
  },
  well: {
    w: 96, h: 120, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      box(ctx, 10, 70, 76, 50, P.stone, P);
      for (let y = 78; y < 120; y += 10)
        for (let x = 10 + ((y / 10) % 2) * 9; x < 86; x += 18) {
          ctx.fillStyle = rgba(P.deep, 0.4);
          ctx.fillRect(x, y, 1, 10);
          ctx.fillRect(10, y, 76, 1);
        }
      for (const x of [16, 74]) box(ctx, x, 14, 6, 58, P.wood, P);
      ctx.fillStyle = hex(P.roof);
      ctx.beginPath();
      ctx.moveTo(4, 22);
      ctx.lineTo(48, 0);
      ctx.lineTo(92, 22);
      ctx.fill();
      box(ctx, 22, 34, 52, 5, P.wood, P);
      box(ctx, 42, 40, 12, 14, P.iron, P);
    },
  },
  // ---- interior ----
  wall_clock: {
    w: 160, h: 160, anchor: [0.5, 0.5], live: true,
    paint(ctx, w, h, P) {
      stamp(ctx, 82, 84, 76, P.deep, 0.45, 0.3);
      const g = ctx.createLinearGradient(0, 0, 160, 160);
      g.addColorStop(0, hex(mix(P.wood, P.lit, 0.35)));
      g.addColorStop(1, hex(mix(P.wood, P.deep, 0.4)));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(80, 80, 74, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hex(P.brass);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(80, 80, 62, 0, Math.PI * 2);
      ctx.stroke();
      const f = ctx.createRadialGradient(70, 66, 4, 80, 80, 60);
      f.addColorStop(0, hex(0xfff8e4));
      f.addColorStop(1, hex(0xd8c49c));
      ctx.fillStyle = f;
      ctx.beginPath();
      ctx.arc(80, 80, 59, 0, Math.PI * 2);
      ctx.fill();
      for (let k = 0; k < 60; k++) {
        const a = (k / 60) * Math.PI * 2;
        const L = k % 5 === 0 ? 8 : 3;
        ctx.strokeStyle = rgba(P.deep, k % 5 === 0 ? 0.9 : 0.45);
        ctx.lineWidth = k % 5 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(80 + Math.cos(a) * 55, 80 + Math.sin(a) * 55);
        ctx.lineTo(80 + Math.cos(a) * (55 - L), 80 + Math.sin(a) * (55 - L));
        ctx.stroke();
      }
      stamp(ctx, 80, 80, 6, P.brass, 1, 0.2);
    },
  },
  window_night: {
    w: 80, h: 112, anchor: [0.5, 0.5],
    paint(ctx, w, h, P) {
      box(ctx, 0, 0, 80, 112, P.wood, P);
      const g = ctx.createLinearGradient(0, 8, 0, 100);
      g.addColorStop(0, hex(0x1a2448));
      g.addColorStop(1, hex(0x5a4a6a));
      ctx.fillStyle = g;
      ctx.fillRect(8, 8, 64, 92);
      const r = rand(2);
      for (let i = 0; i < 9; i++) stamp(ctx, 10 + r.frac() * 60, 10 + r.frac() * 50, 1, 0xfff6d0, 0.9, 0.3);
      // a rooftop and a lit window across the lane
      ctx.fillStyle = hex(0x1a1830);
      ctx.fillRect(8, 72, 64, 28);
      ctx.beginPath();
      ctx.moveTo(8, 72);
      ctx.lineTo(30, 58);
      ctx.lineTo(52, 72);
      ctx.fill();
      ctx.fillStyle = hex(P.warm);
      ctx.fillRect(22, 80, 6, 8);
      ctx.fillStyle = rgba(P.deep, 0.9);
      ctx.fillRect(38, 8, 4, 92);
      ctx.fillRect(8, 52, 64, 4);
      box(ctx, -4, 100, 88, 8, P.wood, P);
      ctx.fillStyle = rgba(0xffffff, 0.12);
      ctx.fillRect(12, 12, 3, 36);
    },
  },
  shelf_jars: {
    w: 128, h: 80, anchor: [0.5, 0.5],
    paint(ctx, w, h, P) {
      const r = rand(4);
      for (const y of [30, 72]) {
        box(ctx, 0, y, 128, 6, P.wood, P);
        for (const x of [10, 112]) {
          ctx.fillStyle = hex(mix(P.wood, P.deep, 0.4));
          ctx.beginPath();
          ctx.moveTo(x, y + 6);
          ctx.lineTo(x + 6, y + 6);
          ctx.lineTo(x, y + 14);
          ctx.fill();
        }
      }
      let x = 6;
      while (x < 118) {
        const jw = 10 + r.between(0, 8);
        const jh = 12 + r.between(0, 12);
        const col = [0xc8783a, 0x7a9a5a, 0xd8c070, 0x8a5a8a, 0x5a7a9a][r.between(0, 4)];
        box(ctx, x, 30 - jh, jw, jh, col, P);
        box(ctx, x + 2, 30 - jh - 3, jw - 4, 3, P.iron, P);
        x += jw + 3;
      }
      x = 8;
      while (x < 112) {
        const bw = 6 + r.between(0, 4);
        const bh = 18 + r.between(0, 14);
        box(ctx, x, 72 - bh, bw, bh, [0x8a3a3a, 0x3a5a7a, 0x6a5a3a, 0x4a6a4a][r.between(0, 3)], P);
        x += bw + 1;
      }
    },
  },
  table: {
    w: 112, h: 52, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      box(ctx, 0, 0, 112, 8, mix(P.wood, P.lit, 0.2), P);
      for (const x of [8, 96]) box(ctx, x, 8, 8, 44, P.wood, P);
      box(ctx, 8, 14, 96, 4, P.wood, P);
    },
  },
  table_set: {
    w: 112, h: 80, anchor: [0.5, 1], light: { x: 26, y: 18, r: 60, color: 0xffc070 },
    paint(ctx, w, h, P) {
      ctx.save();
      ctx.translate(0, 28);
      PROPS.table.paint(ctx, 112, 52, P);
      ctx.restore();
      box(ctx, 23, 12, 6, 16, 0xf2e8d0, P);
      stamp(ctx, 26, 8, 4, 0xffd070, 1, 0.5);
      ctx.fillStyle = hex(0x3a5a7a);
      ctx.beginPath();
      ctx.ellipse(76, 18, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      stamp(ctx, 72, 14, 4, 0xffffff, 0.3, 0.5);
      box(ctx, 88, 14, 8, 3, 0x3a5a7a, P);
    },
  },
  chair: {
    w: 40, h: 72, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      box(ctx, 4, 0, 6, 72, P.wood, P);
      box(ctx, 4, 36, 32, 6, mix(P.wood, P.lit, 0.15), P);
      box(ctx, 30, 42, 5, 30, P.wood, P);
      for (const y of [8, 20]) box(ctx, 4, y, 4, 4, P.wood, P);
    },
  },
  hanging_lamp: {
    w: 48, h: 96, anchor: [0.5, 0], light: { x: 24, y: 80, r: 150, color: 0xffc070 },
    paint(ctx, w, h, P) {
      ctx.fillStyle = hex(P.iron);
      ctx.fillRect(23, 0, 2, 64);
      ctx.fillStyle = hex(P.brass);
      ctx.beginPath();
      ctx.moveTo(6, 82);
      ctx.lineTo(16, 64);
      ctx.lineTo(32, 64);
      ctx.lineTo(42, 82);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(P.brassLit, 0.8);
      ctx.fillRect(16, 66, 4, 14);
      stamp(ctx, 24, 86, 7, 0xfff0c0, 1, 0.4);
    },
  },
  cupboard: {
    w: 96, h: 150, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      box(ctx, 0, 0, 96, 150, mix(P.wood, P.deep, 0.1), P);
      box(ctx, 6, 8, 40, 62, P.wood, P);
      box(ctx, 50, 8, 40, 62, P.wood, P);
      box(ctx, 6, 78, 84, 30, P.wood, P);
      box(ctx, 6, 112, 84, 30, P.wood, P);
      for (const [x, y] of [[40, 40], [54, 40], [48, 92], [48, 126]]) stamp(ctx, x, y, 2, P.brassLit, 1, 0.2);
      box(ctx, -4, 0, 104, 6, mix(P.wood, P.lit, 0.15), P);
    },
  },
  workbench: {
    w: 160, h: 72, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      box(ctx, 0, 20, 160, 10, mix(P.wood, P.lit, 0.15), P);
      for (const x of [8, 144]) box(ctx, x, 30, 8, 42, P.wood, P);
      box(ctx, 16, 54, 128, 5, P.wood, P);
      // gears on the bench
      const gear = (x, y, rr, teeth) => {
        ctx.fillStyle = hex(P.brass);
        ctx.beginPath();
        for (let k = 0; k < teeth * 2; k++) {
          const a = (k / (teeth * 2)) * Math.PI * 2;
          const q = k % 2 ? rr : rr * 1.25;
          ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
        }
        ctx.closePath();
        ctx.fill();
        stamp(ctx, x - rr * 0.3, y - rr * 0.3, rr * 0.6, P.brassLit, 0.6, 0.6);
        stamp(ctx, x, y, rr * 0.35, P.deep, 1, 0.1);
      };
      gear(40, 12, 8, 8);
      gear(60, 14, 5, 6);
      box(ctx, 96, 6, 34, 14, P.iron, P);
      box(ctx, 120, 0, 4, 8, P.iron, P);
    },
  },
  rug: {
    w: 192, h: 12, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      ctx.fillStyle = hex(P.cloth);
      ctx.fillRect(4, 2, 184, 10);
      ctx.fillStyle = hex(mix(P.cloth, P.brassLit, 0.4));
      for (let x = 10; x < 182; x += 12) ctx.fillRect(x, 5, 6, 3);
      ctx.fillStyle = rgba(P.deep, 0.4);
      ctx.fillRect(4, 10, 184, 2);
      for (let x = 2; x < 190; x += 3) ctx.fillRect(x, 0, 1, 2);
    },
  },
  pendulum_case: {
    w: 64, h: 192, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      box(ctx, 8, 40, 48, 152, mix(P.wood, P.deep, 0.15), P);
      box(ctx, 0, 30, 64, 12, P.wood, P);
      box(ctx, 4, 182, 56, 10, P.wood, P);
      ctx.fillStyle = hex(0x1a1420);
      ctx.fillRect(16, 60, 32, 110);
      ctx.fillStyle = rgba(0xffffff, 0.08);
      ctx.fillRect(18, 62, 4, 100);
      const f = ctx.createRadialGradient(30, 12, 2, 32, 16, 18);
      f.addColorStop(0, hex(0xfff6dc));
      f.addColorStop(1, hex(0xd0b890));
      ctx.fillStyle = f;
      ctx.beginPath();
      ctx.arc(32, 16, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hex(P.brass);
      ctx.lineWidth = 3;
      ctx.stroke();
    },
  },
  door_wood: {
    w: 64, h: 112, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      box(ctx, 0, 0, 64, 112, mix(P.wood, P.deep, 0.4), P);
      box(ctx, 6, 6, 52, 106, P.wood, P);
      ctx.fillStyle = rgba(P.deep, 0.45);
      for (const x of [22, 40]) ctx.fillRect(x, 6, 2, 106);
      for (const y of [30, 76]) ctx.fillRect(6, y, 52, 3);
      stamp(ctx, 50, 62, 3, P.brassLit, 1, 0.2);
      ctx.fillStyle = rgba(P.warm, 0.5);
      ctx.fillRect(6, 108, 52, 4);
    },
  },
  // checkpoint lantern on a post (lit state is a live glow)
  lantern_post: {
    w: 40, h: 104, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      box(ctx, 17, 30, 6, 74, P.wood, P);
      box(ctx, 8, 22, 26, 4, P.iron, P);
      box(ctx, 26, 26, 3, 10, P.iron, P);
      box(ctx, 20, 36, 16, 18, P.glass, P);
      ctx.fillStyle = hex(P.iron);
      ctx.fillRect(20, 34, 16, 3);
      ctx.fillRect(20, 52, 16, 3);
      ctx.fillRect(27, 37, 2, 16);
      box(ctx, 12, 98, 16, 6, P.stone, P);
    },
  },
  bell_frame: {
    w: 160, h: 208, anchor: [0.5, 1],
    paint(ctx, w, h, P) {
      for (const x of [16, 136]) box(ctx, x, 30, 10, 178, P.wood, P);
      box(ctx, 6, 22, 148, 12, mix(P.wood, P.lit, 0.15), P);
      ctx.fillStyle = hex(P.roof);
      ctx.beginPath();
      ctx.moveTo(0, 24);
      ctx.lineTo(80, -2 + 2);
      ctx.lineTo(160, 24);
      ctx.fill();
      // the bell
      const g = ctx.createLinearGradient(54, 0, 106, 0);
      g.addColorStop(0, hex(P.brassLit));
      g.addColorStop(0.45, hex(P.brass));
      g.addColorStop(1, hex(mix(P.brass, P.deep, 0.55)));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(66, 42);
      ctx.quadraticCurveTo(80, 30, 94, 42);
      ctx.lineTo(100, 86);
      ctx.quadraticCurveTo(106, 94, 108, 96);
      ctx.lineTo(52, 96);
      ctx.quadraticCurveTo(54, 94, 60, 86);
      ctx.closePath();
      ctx.fill();
      stamp(ctx, 80, 98, 4, P.iron, 1, 0.2);
      box(ctx, 76, 34, 8, 8, P.iron, P);
      box(ctx, 12, 196, 136, 12, P.stone, P);
    },
  },
};

const cache = new Map();

export const PROP_IDS = Object.keys(PROPS);

export function propDef(id, extra = {}) {
  return extra[id] || PROPS[id] || null;
}

// a painted canvas for a prop (cached per id + palette)
export function paintProp(id, palette = {}, extra = {}) {
  const def = propDef(id, extra);
  if (!def) return null;
  const key = `${id}|${JSON.stringify(palette)}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = def.w;
  c.height = def.h;
  const ctx = c.getContext('2d');
  def.paint(ctx, def.w, def.h, { ...P0, ...palette });
  if (def.w * def.h < 120000) grain(ctx, 0, 0, def.w, def.h, 0.05, 11);
  const out = { def, c };
  cache.set(key, out);
  return out;
}

void dab;
void gradientV;
