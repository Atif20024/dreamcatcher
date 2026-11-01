// What stands on each platform's concourse, so nine bays read as nine places:
// data/dreams.js `propsKind` names it. Painted at the §7 scale (1 m = 44 px)
// with the station's own brushes, lit from the west. A kind with no painter
// gets a plain stack of crates, so a dream added later still has its corner.
import { paintTexture, rgba, hex } from './paint.js';
import { block, cyl, cshadow } from './hubArt.js';

const crate = (ctx, x, y, w, h, c = 0x6a4a32) => {
  block(ctx, x, y - h, w, h, c, { r: 1 });
  ctx.fillStyle = rgba(0x14141c, 0.3);
  ctx.fillRect(x + 1, y - h + 5, w - 2, 1);
  ctx.fillRect(x + 1, y - h + 11, w - 2, 1);
};
const fruit = (ctx, x, y, c) => {
  ctx.fillStyle = hex(c);
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(0xffffff, 0.35);
  ctx.fillRect(x - 2, y - 2, 1.5, 1.5);
};

const PAINT = {
  // the kitchen's delivery: crates of tomatoes and oranges
  produce: [70, 44, (ctx, w, h) => {
    cshadow(ctx, 30, h, 62, 0.3, 3);
    crate(ctx, 4, h, 30, 26);
    crate(ctx, 34, h, 26, 20, 0x7a5a3a);
    for (const x of [10, 18, 26]) fruit(ctx, x, h - 29, 0xc84a4a);
    for (const x of [40, 48, 55]) fruit(ctx, x, h - 23, 0xe8a030);
  }],
  // a flight case and a mic stand
  posters: [60, 70, (ctx, w, h) => {
    cshadow(ctx, 22, h, 44, 0.35, 3);
    block(ctx, 2, h - 22, 40, 22, 0x26262e, { r: 2 });
    ctx.fillStyle = rgba(0x9a9aa2, 0.9);
    for (const [x, y] of [[4, 20], [38, 20], [4, 3], [38, 3]]) ctx.fillRect(x, h - y, 2, 2);
    ctx.fillStyle = rgba(0xf2d580, 0.75);
    ctx.fillRect(10, h - 14, 22, 3);
    cyl(ctx, 50, 8, 2, h - 10, 0x3a3a44);
    ctx.fillRect(46, h - 2, 10, 2);
    block(ctx, 48, 2, 6, 8, 0x8a8a94, { r: 2 });
  }],
  // starting blocks and a stack of hurdles
  blocks: [70, 44, (ctx, w, h) => {
    cshadow(ctx, 22, h, 42, 0.3, 3);
    block(ctx, 2, h - 6, 34, 6, 0x9a9aa2, { r: 1 });
    block(ctx, 6, h - 16, 9, 10, 0xd8d8e0, { r: 1 });
    block(ctx, 22, h - 13, 9, 7, 0xd0d0d8, { r: 1 });
    cyl(ctx, 44, h - 40, 2, 40, 0x2a2a30);
    cyl(ctx, 64, h - 40, 2, 40, 0x2a2a30);
    block(ctx, 42, h - 42, 26, 6, 0xf2e6cc, { r: 0.5 });
    ctx.fillStyle = rgba(0x2e6a4a, 0.9);
    ctx.fillRect(48, h - 41, 5, 4);
    ctx.fillRect(58, h - 41, 5, 4);
  }],
  // a typewriter on a tied bale of drafts, more paper round it
  pages: [64, 50, (ctx, w, h) => {
    cshadow(ctx, 30, h, 56, 0.3, 3);
    for (let i = 0; i < 6; i++) block(ctx, 6 + (i % 2), h - 5 - i * 5, 38, 5, i % 2 ? 0xe8e4d8 : 0xd8d2c0, { r: 0.5, litK: 0.1, dimK: 0.2 });
    ctx.fillStyle = rgba(0x8a5a34, 0.9);
    ctx.fillRect(24, h - 30, 2, 30);
    block(ctx, 12, h - 44, 26, 14, 0x3a3a44, { r: 1.5 });
    block(ctx, 17, h - 49, 16, 6, 0xf2ece0, { r: 0.5, litK: 0.1, dimK: 0.2 });
    ctx.fillStyle = rgba(0xc8c0a8, 0.9);
    for (let i = 0; i < 4; i++) ctx.fillRect(15, h - 40 + i * 2.5, 20, 1);
    block(ctx, 48, h - 2, 14, 2, 0xe8e4d8, { r: 0 });
    block(ctx, 46, h - 4, 12, 2, 0xf2ece0, { r: 0 });
  }],
  // an easel with a panel on it, a bucket of brushes
  easels: [70, 84, (ctx, w, h) => {
    cshadow(ctx, 30, h, 46, 0.3, 3);
    ctx.strokeStyle = hex(0x6a5a3a);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, h);
    ctx.lineTo(28, 2);
    ctx.moveTo(42, h);
    ctx.lineTo(28, 2);
    ctx.stroke();
    block(ctx, 10, 14, 36, 34, 0xf2e6cc, { r: 0.5, litK: 0.1, dimK: 0.2 });
    ctx.fillStyle = hex(0x22408a);
    ctx.fillRect(14, 18, 28, 12);
    ctx.fillStyle = hex(0xd8a840);
    ctx.fillRect(14, 30, 28, 14);
    ctx.fillStyle = hex(0x6a5a3a);
    ctx.fillRect(8, 50, 40, 3);
    block(ctx, 54, h - 14, 12, 14, 0x8a6a4a, { r: 1 });
    ctx.fillStyle = hex(0xc4a25c);
    for (const x of [56, 60, 63]) ctx.fillRect(x, h - 24, 1.5, 10);
  }],
  // a shipping crate, a helmet on top
  crates: [60, 70, (ctx, w, h) => {
    cshadow(ctx, 28, h, 56, 0.35, 3);
    block(ctx, 4, h - 40, 46, 40, 0x4a5a42, { r: 1 });
    ctx.strokeStyle = rgba(0x2a3a26, 0.9);
    ctx.lineWidth = 2;
    ctx.strokeRect(5, h - 39, 44, 38);
    ctx.fillStyle = rgba(0xf2e6cc, 0.7);
    ctx.fillRect(10, h - 34, 16, 5);
    ctx.fillStyle = hex(0xe8e8f0);
    ctx.beginPath();
    ctx.arc(26, h - 52, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(0x2a3448);
    ctx.fillRect(18, h - 57, 16, 9);
    ctx.fillStyle = rgba(0xf2c078, 0.7);
    ctx.fillRect(20, h - 56, 5, 2);
  }],
  // a barrel for a table: a lantern, a hand of cards, stacks of chips
  chips: [56, 76, (ctx, w, h) => {
    cshadow(ctx, 26, h, 50, 0.3, 3);
    block(ctx, 8, h - 40, 36, 40, 0x5a3a24, { r: 3 });
    ctx.fillStyle = rgba(0x2a2a30, 0.8);
    ctx.fillRect(8, h - 32, 36, 2);
    ctx.fillRect(8, h - 10, 36, 2);
    for (const [x, n, c] of [[14, 3, 0xc03a2a], [22, 4, 0xe8e0d0], [30, 2, 0x2e6a4a]]) for (let i = 0; i < n; i++) block(ctx, x, h - 42 - i * 2, 7, 2, c, { r: 0.5 });
    cyl(ctx, 38, h - 56, 6, 12, 0x3a3a44);
    ctx.fillStyle = rgba(0xffc870, 0.95);
    ctx.fillRect(39, h - 53, 4, 7);
  }],
  // ward lockers, a clipboard on a door
  lockers: [52, 84, (ctx, w, h) => {
    cshadow(ctx, 25, h, 50, 0.35, 3);
    for (let i = 0; i < 3; i++) {
      block(ctx, 2 + i * 15, 4, 14, h - 4, 0x8a9aa8, { r: 1 });
      ctx.fillStyle = rgba(0x14141c, 0.35);
      ctx.fillRect(4 + i * 15, 10, 10, 1);
      ctx.fillRect(4 + i * 15, 13, 10, 1);
      ctx.fillStyle = hex(0x3a3a44);
      ctx.fillRect(12 + i * 15, 42, 2, 5);
    }
    block(ctx, 18, 22, 11, 15, 0xf2e6cc, { r: 0.5, litK: 0.1, dimK: 0.2 });
  }],
  // a longcase clock with its door open, a pan of cogs at its foot
  clocks: [60, 88, (ctx, w, h) => {
    cshadow(ctx, 22, h, 44, 0.35, 3);
    block(ctx, 8, 2, 28, 26, 0x4a3020, { r: 2 });
    ctx.fillStyle = hex(0xf2e6cc);
    ctx.beginPath();
    ctx.arc(22, 15, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hex(0x2a2230);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(22, 15);
    ctx.lineTo(22, 8);
    ctx.moveTo(22, 15);
    ctx.lineTo(27, 15);
    ctx.stroke();
    block(ctx, 12, 28, 20, 44, 0x3a2418, { r: 1 });
    cyl(ctx, 21, 32, 2, 30, 0xc8a050);
    block(ctx, 8, 72, 28, 16, 0x4a3020, { r: 1 });
    block(ctx, 42, h - 5, 16, 5, 0x8a8a94, { r: 1 });
    for (const x of [46, 52]) {
      ctx.fillStyle = hex(0xc8a050);
      ctx.beginPath();
      ctx.arc(x, h - 7, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }],
};

export function bayPropTex(scene, kind) {
  const [w, h, paint] = PAINT[kind] || [50, 34, (ctx, W, H) => {
    cshadow(ctx, 24, H, 46, 0.3, 3);
    crate(ctx, 4, H, 28, 22);
    crate(ctx, 22, H - 22, 22, 12, 0x7a5a3a);
  }];
  const key = `hub-bayprop-${PAINT[kind] ? kind : 'crate'}`;
  return paintTexture(scene, key, w, h, paint);
}

// Jo's lapel: a flower from the seller, worn in the station and at the last stop
export function lapelFlower(scene, p, depth) {
  // 12 px, a stem and a dark rim: smaller was lost against the coat and the lamps
  const key = paintTexture(scene, 'jo-lapel', 12, 12, (ctx) => {
    const petals = [[4, 1], [1, 4], [7, 4], [4, 6]]; // each 3 x 3
    ctx.fillStyle = hex(0x1a1420);
    for (const [x, y] of petals) ctx.fillRect(x - 1, y - 1, 5, 5);
    ctx.fillRect(4, 9, 3, 3); // round the stem
    ctx.fillStyle = hex(0x4a8a4a);
    ctx.fillRect(5, 9, 1, 3);
    ctx.fillStyle = hex(0xe86a7a);
    for (const [x, y] of petals) ctx.fillRect(x, y, 3, 3);
    ctx.fillStyle = hex(0xf2d580);
    ctx.fillRect(4, 4, 3, 2);
  });
  const img = scene.add.image(p.x, p.y, key).setDepth(depth);
  return () => img.setPosition(p.art.x + (p.flipX ? -5 : 5), p.art.y - 50).setVisible(p.shown && !p.climbing);
}
