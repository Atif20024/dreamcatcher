import Phaser from 'phaser';

// D5 — deaths never just delete a sprite: they burst into "dream-dust",
// per-pixel particles carrying the sprite's own colours.
export function dreamDust(scene, sprite, opts = {}) {
  const n = opts.count || 16;
  const colors = opts.colors || [0xe8dcc8, 0xf2d580, 0x8a8aa8];
  const x = sprite.x;
  const y = sprite.y;
  const spread = opts.spread || 18;
  for (let i = 0; i < n; i++) {
    const p = scene.add
      .rectangle(
        x + Phaser.Math.Between(-spread, spread),
        y + Phaser.Math.Between(-spread, spread),
        3,
        3,
        colors[i % colors.length]
      )
      .setDepth(45);
    scene.tweens.add({
      targets: p,
      x: p.x + Phaser.Math.Between(-50, 50),
      y: p.y - Phaser.Math.Between(10, 70),
      alpha: 0,
      angle: Phaser.Math.Between(-180, 180),
      duration: Phaser.Math.Between(500, 1000),
      ease: 'quad.out',
      onComplete: () => p.destroy(),
    });
  }
}

// D5 — 60ms hit-stop on impact.
export function hitStop(scene, ms = 60) {
  if (scene._hitStopping) return;
  scene._hitStopping = true;
  scene.physics.world.pause();
  scene.time.delayedCall(ms, () => {
    scene._hitStopping = false;
    if (!scene.cardActive && !scene.dialogActive && !scene.puzzleActive) scene.physics.resume();
  });
}

// D5 — land squash.
export function squash(scene, sprite) {
  scene.tweens.add({ targets: sprite, scaleX: 1.2, scaleY: 0.8, yoyo: true, duration: 70 });
}
