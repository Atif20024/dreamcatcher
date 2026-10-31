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

// Round 2 WP6 (critique §9 "Light"): the place's night grade. Every place is
// a station at night: the world behind Jo is multiplied toward the place's
// cool indigo, so most of the frame is shadow and the warm practicals and Jo
// stand out of it. It sits just under Jo and the foes (depth 11), over the
// terrain, props and passers-by; Jo is never graded, so he stays the
// highest-contrast thing on screen.
export function setupGrade(scene, color, { depth = 11 } = {}) {
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
  return img;
}
