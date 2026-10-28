// DreamGate (plan 2.7, 4.9): a requirement-bearing gate in a framework
// room. A painted iron gate between two stone posts, solid until every flag
// in `requires` is set; then it swings open on its hinge, emits gate:open and
// stops colliding. It carries the fields GateSigns reads (id, wx, ty, h,
// hint, requires, open, signSide), so the sign on its approach side names
// what opens it and ticks per requirement.
//   { type: 'gate', id, x, y (top tile row), h: 4, requires: ['clock_wound'], hint: 'OPENS WHEN THE CLOCK STRIKES' }
import { events } from '../core/events.js';

const T = 32;

function paintGate(scene, key, h) {
  if (scene.textures.exists(key)) return key;
  const W = 64;
  const H = h * T;
  const ct = scene.textures.createCanvas(key, W, H);
  const ctx = ct.getContext();
  const iron = '#2a2630';
  const lit = 'rgba(150,140,160,0.7)';
  for (let x = 6; x < W; x += 10) {
    ctx.fillStyle = iron;
    ctx.fillRect(x, 10, 4, H - 10);
    ctx.fillStyle = lit;
    ctx.fillRect(x, 10, 1, H - 10);
    // spear tips
    ctx.fillStyle = iron;
    ctx.beginPath();
    ctx.moveTo(x - 2, 12);
    ctx.lineTo(x + 2, 2);
    ctx.lineTo(x + 6, 12);
    ctx.fill();
  }
  for (const y of [22, H / 2, H - 16]) {
    ctx.fillStyle = iron;
    ctx.fillRect(0, y, W, 5);
    ctx.fillStyle = lit;
    ctx.fillRect(0, y, W, 1);
  }
  // scrolls between the top rails
  ctx.strokeStyle = iron;
  ctx.lineWidth = 2;
  for (let x = 11; x < W - 6; x += 20) {
    ctx.beginPath();
    ctx.arc(x + 5, 34, 5, 0, Math.PI * 1.5);
    ctx.stroke();
  }
  // a padlock on the chain
  ctx.fillStyle = '#c8963a';
  ctx.fillRect(W / 2 - 5, H / 2 + 6, 10, 9);
  ctx.strokeStyle = '#c8963a';
  ctx.beginPath();
  ctx.arc(W / 2, H / 2 + 6, 4, Math.PI, 0);
  ctx.stroke();
  ct.refresh();
  return key;
}

export class DreamGate {
  constructor(scene, def, room) {
    this.scene = scene;
    this.id = def.id;
    this.requires = def.requires || [];
    this.hint = def.hint;
    this.signSide = def.signSide || 'left';
    this.h = def.h || 4;
    this.tx = room.tx + def.x;
    this.ty = room.ty + def.y;
    this.wx = this.tx * T + T / 2;
    this.open = false;
    const key = paintGate(scene, `gate-iron-${this.h}`, this.h);
    this.img = scene.add.image(this.tx * T - 16, this.ty * T, key).setOrigin(0, 0).setDepth(-9);
    this.zone = scene.add.zone(this.tx * T, this.ty * T, T, this.h * T).setOrigin(0, 0);
    scene.physics.add.existing(this.zone, true);
    this.posts = [-24, 40].map((dx) => scene.add.rectangle(this.tx * T + dx, this.ty * T - 4, 14, this.h * T + 8, 0x6a6258).setOrigin(0, 0).setDepth(-8).setStrokeStyle(2, 0x2a2630));
    this.caps = [-27, 37].map((dx) => scene.add.rectangle(this.tx * T + dx, this.ty * T - 10, 20, 8, 0x9a9080).setOrigin(0, 0).setDepth(-8));
  }

  satisfied(F) {
    return this.requires.every((f) => F[f]);
  }

  // per frame from the scene; returns true on the frame it opens
  update(F, { instant = false } = {}) {
    if (this.open || !this.satisfied(F)) return false;
    this.open = true;
    this.zone.body.enable = false;
    if (instant) this.img.setScale(0.2, 1).setAlpha(0.8);
    else this.scene.tweens.add({ targets: this.img, scaleX: 0.2, duration: 700, ease: 'quad.out' });
    events.emit('gate:open', { id: this.id });
    return true;
  }

  destroy() {
    [this.img, this.zone, ...this.posts, ...this.caps].forEach((o) => o.destroy());
  }
}

export default DreamGate;
