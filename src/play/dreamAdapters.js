// Dream adapters (phase 3b, FRAMEWORK §17 "foes, coins and Teach cards"):
// room entities → the phase-1 services that expected legacy room objects
// (wx / wy / room). DreamScene.spawnEntity hands these types here:
//
//   { type: 'foe', kind, x, y, patrol: [c0, c1] (room cols), facing, floats }
//        → BaseLevel.addFoe (src/entities/Foe.js, data/kinds.js FOES[dream]);
//          colliders with the room's terrain, destroyed with the room
//   { type: 'keyitem', id, x, y }   a key item on its lit pedestal
//        (collectibles §5); dream.items[id] = { name, card, paint(ctx, w, h) };
//        touching it sets item:<id> and <id>, joins the satchel, shows its card
//   { type: 'audience', id, cast, x, y, facing }  a seated listener; an
//        encounter presenter turns them toward the stage (scene.audience)
//   { type: 'resonant', id, x, y, r, set?, beat?, once }  something Jo's
//        verb can ring (scene.ringAt), glowing faintly when he is near
//   { type: 'moment', id, x, y, beat, prompt }  a Small Moment: [E] plays its
//        beat once and records it in the save (recordMoment)
//   { type: 'sign', text, x, y, scale?, board?, ink?, rim? }  a painted board
//        with its words in the bitmap font (§8: body at 2× by default, on
//        the board's own colour, lifted to 4.5:1; x, y = the board's centre)
// and `when` / `unless` on any of these (and npc / orb) make the entity
// appear and go with its flag (watch()).
import Phaser from 'phaser';
import { D } from '../builders/depths.js';
import { Npc } from '../actors/Npc.js';
import { castFrame } from '../art/baked.js';
import { recordMoment } from '../utils/save.js';
import { sfx } from '../systems/audio.js';
import { hud } from '../ui/hud.js';
import { uiText } from '../ui/text.js';

const T = 32;
export const WATCHED = new Set(['npc', 'orb', 'foe', 'keyitem', 'audience', 'resonant', 'moment', 'sign']);

// an entity with `when` / `unless`: spawned while its flags hold, removed when not
export function watch(scene, e, room, spawn) {
  const w = { inner: null, on: null };
  const check = () => {
    const F = scene.F || {};
    const on = (!e.when || !!F[e.when]) && (!e.unless || !F[e.unless]);
    if (on === w.on) return;
    w.on = on;
    if (on) w.inner = spawn({ ...e, _watched: true }, room);
    else if (w.inner) {
      if (w.inner.destroy) w.inner.destroy();
      w.inner = null;
    }
  };
  scene.watchers.add(check);
  check();
  return {
    destroy: () => {
      scene.watchers.delete(check);
      if (w.inner && w.inner.destroy) w.inner.destroy();
      w.inner = null;
    },
  };
}

export function spawnFoe(scene, e, room) {
  const r = room.r;
  const wx = (r.tx + e.x) * T + T / 2;
  const feet = (r.ty + e.y) * T + T;
  const foe = scene.addFoe({ ...e, wx, wy: feet - (e.floats ? 0 : 30), patrol: e.patrol ? e.patrol.map((c) => r.tx + c) : null });
  if (!foe) return null;
  if (e.floats) {
    foe.body.setAllowGravity(false);
    foe.floatY = feet;
  }
  if (e.facing) foe.setFlipX(e.facing < 0);
  foe.roomId = room.id;
  const cols = [scene.physics.add.collider(foe, room.colliders.solids), scene.physics.add.collider(foe, room.colliders.oneWays)];
  return {
    foe,
    destroy() {
      cols.forEach((c) => c.destroy());
      if (foe.active) foe.destroy();
    },
  };
}

// Jo touches a foe: a creature is stomped from above or hurts; a person
// only ever grabs (Foe.update handles the windup and the throw-out)
export function foeContact(scene, foe) {
  if (!foe.active || foe.human) return;
  const p = scene.player;
  if (p.body.velocity.y > 40 && p.body.bottom < foe.body.center.y + 6) {
    if (foe.die()) p.body.setVelocityY(-280);
    return;
  }
  scene.hurt({ sourceX: foe.x });
}

// a pedestal: a stone plinth, a spot of light from above (painted once)
function pedestalTexture(scene) {
  const key = 'dc-pedestal';
  if (scene.textures.exists(key)) return key;
  const ct = scene.textures.createCanvas(key, 56, 120);
  const ctx = ct.getContext();
  const g = ctx.createLinearGradient(0, 0, 0, 120);
  g.addColorStop(0, 'rgba(255,236,180,0)');
  g.addColorStop(1, 'rgba(255,236,180,0.28)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(34, 0);
  ctx.lineTo(54, 92);
  ctx.lineTo(2, 92);
  ctx.fill();
  ctx.fillStyle = '#6a6070';
  ctx.fillRect(10, 92, 36, 6);
  ctx.fillStyle = '#4a4252';
  ctx.fillRect(14, 98, 28, 16);
  ctx.fillStyle = '#8a8090';
  ctx.fillRect(14, 98, 28, 2);
  ctx.fillStyle = '#3a3242';
  ctx.fillRect(8, 114, 40, 6);
  ct.refresh();
  return key;
}

export function spawnKeyItem(scene, e, room) {
  if (scene.F[`item:${e.id}`]) return null;
  const spec = (scene.def.items || {})[e.id] || { name: e.id.toUpperCase() };
  const r = room.r;
  const x = (r.tx + e.x) * T + T / 2;
  const feet = (r.ty + e.y) * T + T;
  const ped = scene.add.image(x, feet, pedestalTexture(scene)).setOrigin(0.5, 1).setDepth(D.INTERACT - 1);
  const tk = `item:${scene.dreamId}:${e.id}`;
  if (!scene.textures.exists(tk)) {
    const ct = scene.textures.createCanvas(tk, spec.w || 28, spec.h || 28);
    if (spec.paint) spec.paint(ct.getContext(), spec.w || 28, spec.h || 28);
    else {
      const c = ct.getContext();
      c.fillStyle = '#f2d580';
      c.fillRect(4, 4, 20, 20);
    }
    ct.refresh();
  }
  const icon = scene.add.image(x, feet - 44, tk).setDepth(D.INTERACT);
  const glint = scene.add.image(x, feet - 44, 'dc-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffe6a0).setScale(0.3).setAlpha(0.5).setDepth(D.INTERACT - 0.5);
  const tw = scene.tweens.add({ targets: [icon, glint], y: feet - 50, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  const it = { id: e.id, x, y: feet - 44, spec, e, icon, taken: false };
  scene.keyItems.add(it);
  return {
    destroy() {
      scene.keyItems.delete(it);
      tw.remove();
      ped.destroy();
      icon.destroy();
      glint.destroy();
    },
  };
}

// each frame: Jo within reach of a key item takes it
export function updateKeyItems(scene) {
  const p = scene.player;
  for (const it of scene.keyItems) {
    if (it.taken || Math.abs(it.x - p.x) > 26 || Math.abs(it.y - (p.y - 10)) > 56) continue;
    it.taken = true;
    scene.F[`item:${it.id}`] = true;
    scene.F[it.e.sets || it.id] = true;
    if (scene.satchel && !scene.satchel.includes(it.spec.name)) scene.satchel.push(it.spec.name);
    sfx('shard');
    hud.toolLine(1, 'accent').setText(`HAVE: ${it.spec.name}`).setVisible(true);
    if (scene.caption && it.spec.card) scene.caption.say('jo', it.spec.card, { ms: 3200 });
    scene.floatText(it.x, it.y - 30, it.spec.name, '#f2d580');
    it.icon.setVisible(false);
    if (it.e.beat && scene.beats.has(it.e.beat)) scene.beats.play(it.e.beat);
    scene.saveRun();
  }
}

export function spawnAudience(scene, e, room) {
  const r = room.r;
  const x = (r.tx + e.x) * T + T / 2 + (e.dx || 0);
  const feet = (r.ty + e.y) * T + T;
  const npc = new Npc(scene, { id: e.id, x, y: feet, cast: e.cast, pose: 'sit', facing: e.facing || 1, depth: e.front ? D.PLAYER + 1 : D.PLAYER - 2 });
  const who = {
    npc,
    turned: false,
    react() {
      who.turned = true;
      npc.laugh(1400);
      npc.img.setTint(0xfff0d0);
    },
  };
  scene.audience.push(who);
  scene.npcs.set(`aud:${e.id}`, npc);
  return {
    destroy() {
      scene.audience = scene.audience.filter((a) => a !== who);
      scene.npcs.delete(`aud:${e.id}`);
      npc.destroy();
    },
  };
}

export function spawnResonant(scene, e, room) {
  const r = room.r;
  const res = { id: e.id, e, x: (r.tx + e.x) * T + T / 2, y: (r.ty + e.y) * T + T / 2, r: (e.r || 3) * T, done: false };
  res.glow = scene.add.image(res.x, res.y, 'dc-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(e.tint || 0xf2d580).setScale(0.35).setAlpha(0).setDepth(D.INTERACT);
  scene.resonants.add(res);
  return {
    destroy() {
      scene.resonants.delete(res);
      res.glow.destroy();
    },
  };
}

// the faint "this can be played" glow (spec 3.1: within 3 tiles)
export function updateResonants(scene, time) {
  const p = scene.player;
  for (const r of scene.resonants) {
    const near = !r.done && Math.hypot(r.x - p.x, r.y - p.y) < r.r + 64;
    r.glow.setAlpha(near ? 0.35 + Math.sin(time / 260) * 0.12 : 0);
  }
}

// Jo's note rings everything resonant in reach; people stop to listen,
// feedback creatures fall silent
export function ringAt(scene, x, y, radius) {
  const hit = [];
  for (const r of scene.resonants) {
    if (r.done || Math.hypot(r.x - x, r.y - y) > Math.max(radius, r.r)) continue;
    if (r.e.once !== false) r.done = true;
    if (r.e.set) scene.F[r.e.set] = true;
    if (r.e.beat && scene.beats.has(r.e.beat)) scene.beats.play(r.e.beat).catch((err) => console.warn('[dream] beat', err));
    hit.push(r.id);
  }
  for (const f of scene.foes || []) {
    if (!f.active || Math.hypot(f.x - x, f.y - y) > radius) continue;
    if (f.human) f.distract(x);
    else if (f.def && f.def.silenced !== false) f.die();
  }
  return hit;
}

// A dialogue portrait cut from a cast person's own rig (the head and
// shoulders of their standing frame, 3× nearest, on the night plate), so
// the SceneBox face is the face walking about the room. cast[who].face
// names the cast key; the portrait is made once as cast[who].portrait.
export function castPortrait(scene, key, face) {
  if (scene.textures.exists(key)) return key;
  const fk = castFrame(scene, face);
  if (!fk) return null;
  const fr = scene.textures.getFrame(fk);
  const src = fr.source.image;
  const W = fr.cutWidth;
  const H = fr.cutHeight;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const cx = c.getContext('2d');
  cx.drawImage(src, fr.cutX, fr.cutY, W, H, 0, 0, W, H);
  let top = -1;
  let x0 = W;
  let x1 = 0;
  try {
    const d = cx.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H && top < 0; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40) {
      top = y;
      break;
    }
    for (let y = Math.max(0, top); y < Math.min(H, top + 22); y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
    }
  } catch {
    return null;
  }
  if (top < 0) return null;
  const S = 30; // the crop: a 30 px square around the head
  const mid = Math.round((x0 + x1) / 2);
  const out = scene.textures.createCanvas(key, 96, 96);
  const o = out.getContext();
  o.fillStyle = '#14122a';
  o.fillRect(0, 0, 96, 96);
  o.fillStyle = '#2e2a48';
  o.fillRect(0, 60, 96, 36);
  o.imageSmoothingEnabled = false;
  o.drawImage(c, mid - S / 2, top - 2, S, S, 3, 6, S * 3, S * 3);
  o.strokeStyle = '#c8a24a';
  o.strokeRect(0.5, 0.5, 95, 95);
  out.refresh();
  return key;
}

export function spawnMoment(scene, e, room) {
  const at = { x: (room.r.tx + e.x) * T + T / 2, y: (room.r.ty + e.y) * T + T };
  return scene.interaction.register({
    id: `moment:${e.id}`,
    x: at.x,
    y: at.y,
    radius: 48,
    prompt: e.prompt || 'stay a moment',
    enabled: () => !scene.F[`moment:${e.id}`] && !scene.beats.busy,
    onUse: async () => {
      scene.F[`moment:${e.id}`] = true;
      if (e.beat && scene.beats.has(e.beat)) await scene.beats.play(e.beat);
      recordMoment(scene.dreamId, e.id);
    },
  });
}

// a sign: a board (its colour, a 2 px rim, a darker frame) and the words on
// it, uiText in the world with the board declared as its backing (the
// readability audit checks the glyphs against it). Body ×2 unless the sign
// says otherwise; never smaller than body ×1 (cap 9 at zoom 1).
export function spawnSign(scene, e, room) {
  const r = room.r;
  const x = Math.round((r.tx + e.x) * T + T / 2 + (e.dx || 0));
  const y = Math.round((r.ty + e.y) * T + T / 2 + (e.dy || 0));
  const board = e.board ?? 0x2a1c16;
  const scale = e.scale || 2;
  const t = uiText(scene, x, y, e.text, { size: e.size || 'body', scale, color: e.ink ?? 0xf2d580, backing: board, align: 'center', wrap: e.wrap || 0 })
    .setOrigin(0.5)
    .setDepth(e.depth ?? -8.5);
  const padX = e.padX ?? 10;
  const padY = e.padY ?? 6;
  const w = Math.max(e.w || 0, Math.ceil(t.width) + padX * 2);
  const h = Math.ceil(t.height) + padY * 2;
  const g = scene.add.graphics().setDepth((e.depth ?? -8.5) - 0.01);
  g.fillStyle(e.frame ?? 0x14100e, 1).fillRect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6);
  g.fillStyle(board, 1).fillRect(x - w / 2, y - h / 2, w, h);
  g.lineStyle(2, e.rim ?? 0xb08a3a, 1).strokeRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4);
  t.isSign = true;
  return {
    text: t,
    destroy() {
      t.destroy();
      g.destroy();
    },
  };
}
