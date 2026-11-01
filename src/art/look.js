import Phaser from 'phaser';

// The "look": what sits between the painted world and the player's eyes.
// A painted vignette (multiplied), and a fine moving grain so the flat
// colour of a screen reads like paper. Camera post-pipelines were tried
// and dropped: rendering the camera through a framebuffer dimmed and
// greyed the whole frame on this stack, so everything here is a sprite.
export function setupLook(scene, opts = {}) {
  const cam = scene.cameras.main;
  const look = { vignette: null, grain: null };
  if (!scene.textures.exists('ev-vignette')) {
    const ct = scene.textures.createCanvas('ev-vignette', 512, 288);
    const ctx = ct.getContext();
    const g = ctx.createRadialGradient(256, 150, 60, 256, 150, 330);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.55, 'rgba(255,250,240,1)');
    g.addColorStop(0.85, 'rgba(210,196,190,1)');
    g.addColorStop(1, 'rgba(150,138,140,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 288);
    ct.refresh();
    scene.textures.get('ev-vignette').setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
  look.vignette = scene.add.image(cam.width / 2, cam.height / 2, 'ev-vignette');
  look.vignette.keepInWorld = true; // a world overlay, not UI (src/ui/ui.js)
  look.vignette.setScrollFactor(0).setDepth(189).setBlendMode(Phaser.BlendModes.MULTIPLY).setAlpha(opts.vignette ?? 0.8);
  if (!scene.textures.exists('ev-grain')) {
    const ct = scene.textures.createCanvas('ev-grain', 256, 256);
    const ctx = ct.getContext();
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) {
      const v = 128 + (Math.random() - 0.5) * 255;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    ct.refresh();
  }
  if (scene.textures.exists('ev-grain')) {
    look.grain = scene.add.tileSprite(cam.width / 2, cam.height / 2, cam.width / 0.5, cam.height / 0.5, 'ev-grain');
    look.grain.keepInWorld = true;
    look.grain.setScrollFactor(0).setDepth(190).setAlpha(opts.grain ?? 0.04).setBlendMode(Phaser.BlendModes.OVERLAY);
  }
  look.update = (time, delta, light) => {
    const z = cam.zoom || 1;
    if (look.grain) {
      look.grain.tilePositionX = (time * 0.37) % 256;
      look.grain.tilePositionY = (time * 0.23) % 256;
      look.grain.setScale(1 / z);
    }
    if (look.vignette) {
      // cover the view at any zoom; deeper at night
      look.vignette.setScale((cam.width / 512) / z * 1.02, (cam.height / 288) / z * 1.02);
      look.vignette.setAlpha((opts.vignette ?? 0.8) + (light ? (light.night ?? 0) * 0.2 : 0));
    }
    void delta;
  };
  return look;
}

export const GLOW_DEPTH = 10.999;

// Round 2 WP6 (critique §9 "Light"): the place's night grade. Every place is
// a station at night: the world behind Jo is multiplied toward the place's
// cool indigo, so most of the frame is shadow and the warm practicals and Jo
// stand out of it. It sits just under Jo and the foes, over the
// terrain, props and passers-by; Jo is never graded, so he stays the
// highest-contrast thing on screen.
export function setupGrade(scene, color, { depth = GLOW_DEPTH - 0.001 } = {}) {
  if (color === undefined || color === null || color === 0xffffff) return null;
  if (!scene.textures.exists('dc-grade')) {
    const ct = scene.textures.createCanvas('dc-grade', 4, 4);
    const ctx = ct.getContext();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, 4);
    ct.refresh();
  }
  const cam = scene.cameras.main;
  const img = scene.add.image(cam.width / 2, cam.height / 2, 'dc-grade');
  img.keepInWorld = true; // a world overlay, not UI (src/ui/ui.js)
  img.setScrollFactor(0).setDepth(depth).setBlendMode(Phaser.BlendModes.MULTIPLY).setTint(color);
  img.name = 'place-grade';
  // cover the view at any camera zoom
  const fit = () => {
    if (!img.scene) return;
    const z = cam.zoom || 1;
    img.setScale((cam.width / 4 / z) * 1.1, (cam.height / 4 / z) * 1.1);
  };
  fit();
  scene.events.on('postupdate', fit);
  scene.events.once('shutdown', () => scene.events.off('postupdate', fit));
  img.color = color;
  return img;
}

// The grade dims the lamps along with the walls. A glow copy gives a light
// back: the same pixels, tinted (1 - grade), added just over the grade, so
//   pixel × grade + pixel × (1 - grade) = pixel
// and the lit shape shows as painted while the wall beside it stays night.
// Grade and copies sit just under 11, the depth of the NPCs, who drew over the
// grade already and so never get a light showing through them.

// the tint that makes up what the grade took (times the room's own tint)
export function glowTint(color, tint = 0xffffff) {
  const ch = (s) => Math.round((255 - ((color >> s) & 255)) * (((tint >> s) & 255) / 255));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

// how lit a pixel is, 0 to 1, from how bright it is. `from` 0 is every pixel:
// for a shape whose rect is exactly the pane.
export function litAlpha(r, g, b, from) {
  if (from <= 0) return 1;
  return Math.min(1, Math.max(0, (Math.max(r, g, b) - from) / 40));
}

// Draws the lit pixels of `src` (a canvas or image) into a new canvas texture.
// `rects` are [x, y, w, h, from?] in the picture's own pixels; `box` crops it.
export function litTexture(scene, key, src, rects, box, from = 170) {
  if (scene.textures.exists(key)) return key;
  const [bx, by, bw, bh] = box;
  const ct = scene.textures.createCanvas(key, bw, bh);
  const ctx = ct.getContext();
  const out = ctx.createImageData(bw, bh);
  const read = document.createElement('canvas');
  read.width = bw;
  read.height = bh;
  const rc = read.getContext('2d', { willReadFrequently: true });
  rc.drawImage(src, -bx, -by);
  const px = rc.getImageData(0, 0, bw, bh).data;
  for (const [x, y, w, h, f = from] of rects) {
    const x1 = Math.min(bw, Math.round(x + w) - bx);
    const y1 = Math.min(bh, Math.round(y + h) - by);
    for (let v = Math.max(0, Math.round(y) - by); v < y1; v++) {
      for (let u = Math.max(0, Math.round(x) - bx); u < x1; u++) {
        const i = (v * bw + u) * 4;
        out.data[i] = px[i];
        out.data[i + 1] = px[i + 1];
        out.data[i + 2] = px[i + 2];
        out.data[i + 3] = px[i + 3] * litAlpha(px[i], px[i + 1], px[i + 2], f);
      }
    }
  }
  ctx.putImageData(out, 0, 0);
  ct.refresh();
  return key;
}

// takes what stands in front (`src` at x, y; a frame's cut of it) out of a copy
export function cutOut(scene, key, src, x, y, w, h, fr = null) {
  const ct = scene.textures.get(key);
  const ctx = ct.getContext();
  ctx.globalCompositeOperation = 'destination-out';
  if (fr) ctx.drawImage(src, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, x, y, w, h);
  else ctx.drawImage(src, x, y);
  ctx.globalCompositeOperation = 'source-over';
  ct.refresh();
}

// A person in front of a light: over the copies, and graded by tint instead
// (the same colour, so nothing else changes), so the light does not show
// through him.
export function aboveGlows(scene, img) {
  if (!scene.grade || !img) return img;
  const ch = (a, b, s) => Math.round((((a >> s) & 255) * ((b >> s) & 255)) / 255);
  const c = scene.grade.color;
  const t = img.tintTopLeft;
  return img.setDepth(GLOW_DEPTH + 0.0005).setTint((ch(t, c, 16) << 16) | (ch(t, c, 8) << 8) | ch(t, c, 0));
}

// what stands in front of a copy's source: anything solid that holds still
const solidFront = (o, depth) => o.type === 'Image' && o.depth > depth && o.depth < GLOW_DEPTH && o.visible && o.alpha === 1 && o.blendMode === 0 && !o.stride && o.scrollFactorX === 1;

// Copies for loose images (the station): every image whose texture `shapesOf`
// knows gets a copy that follows it, through containers, crops and a texture
// change (a lamp going out). shapesOf(key) → { rects, from, as? } or null.
// shortcut: what stands in front is cut out of the copy once, here; a thing
// that moves off later leaves its hole. Fine for gates; people use aboveGlows.
export function followGlows(scene, shapesOf) {
  if (!scene.grade) return;
  const tint = glowTint(scene.grade.color);
  const textureFor = (src, front = []) => {
    const shape = shapesOf(src.texture.key);
    if (!shape) return null;
    const f = src.frame;
    const from = document.createElement('canvas');
    from.width = f.cutWidth;
    from.height = f.cutHeight;
    from.getContext('2d').drawImage(f.source.image, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);
    const b = front.length ? src.getBounds() : null;
    const hit = front.filter((o) => {
      const r = o.getBounds();
      return r.x < b.right && r.right > b.x && r.y < b.bottom && r.bottom > b.y;
    });
    const key = `lit:${hit.length ? `${src.texture.key}@${Math.round(b.x)}` : shape.as || src.texture.key}`;
    if (scene.textures.exists(key)) return key;
    litTexture(scene, key, from, shape.rects, [0, 0, f.cutWidth, f.cutHeight], shape.from);
    for (const o of hit) {
      const r = o.getBounds();
      const fr = o.frame;
      cutOut(scene, key, fr.source.image, r.x - b.x, r.y - b.y, r.width, r.height, fr);
    }
    return key;
  };
  const copies = [];
  const walk = (list, root) => {
    for (const o of list) {
      if (o.list) walk(o.list, root || o);
      else if (o.type === 'Image' && shapesOf(o.texture.key)) {
        const depth = (root || o).depth;
        const c = scene.add.image(0, 0, textureFor(o, scene.children.list.filter((x) => solidFront(x, depth)))).setBlendMode(Phaser.BlendModes.ADD).setTint(tint).setDepth(GLOW_DEPTH).setOrigin(o.originX, o.originY);
        c.setScrollFactor((root || o).scrollFactorX, (root || o).scrollFactorY);
        copies.push({ c, o, root, key: o.texture.key });
      }
    }
  };
  walk(scene.children.list.slice());
  const tm = new Phaser.GameObjects.Components.TransformMatrix();
  const pm = new Phaser.GameObjects.Components.TransformMatrix();
  const sync = () => {
    for (let i = copies.length - 1; i >= 0; i--) {
      const e = copies[i];
      const { c, o } = e;
      if (!o.scene) {
        c.destroy();
        copies.splice(i, 1);
        continue;
      }
      if (o.texture.key !== e.key) {
        e.key = o.texture.key;
        const t = textureFor(o);
        if (t) c.setTexture(t);
        e.off = !t;
      }
      c.setVisible(!e.off && o.visible && (!e.root || e.root.visible));
      if (!c.visible) continue;
      if (e.root) {
        const m = o.getWorldTransformMatrix(tm, pm);
        c.setPosition(m.tx, m.ty).setScale(m.scaleX, m.scaleY);
      } else c.setPosition(o.x, o.y).setScale(o.scaleX, o.scaleY);
      c.setAlpha(o.alpha * (e.root ? e.root.alpha : 1)).setFlipX(o.flipX);
      if (o.isCropped) c.setCrop(o._crop.x, o._crop.y, o._crop.width, o._crop.height);
    }
  };
  sync();
  scene.events.on('postupdate', sync);
  scene.events.once('shutdown', () => scene.events.off('postupdate', sync));
}
