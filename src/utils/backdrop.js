import Phaser from 'phaser';

// Dusk city skyline. Gradient sky is screen-fixed; buildings parallax slowly.
// TODO(M6): real art pass — see TODO.md.
export function drawCityBackdrop(scene, worldWidth, worldHeight) {
  const cam = scene.cameras.main;

  const g = scene.add.graphics().setScrollFactor(0);
  g.fillGradientStyle(0x1b1b3a, 0x1b1b3a, 0x8a4a5e, 0xb56a52, 1);
  g.fillRect(0, 0, cam.width, cam.height);

  scene.add.circle(cam.width * 0.72, cam.height * 0.78, 60, 0xf2c078, 0.9).setScrollFactor(0);
  scene.add.circle(cam.width * 0.72, cam.height * 0.78, 80, 0xf2c078, 0.25).setScrollFactor(0);

  const parallax = 0.25;
  const coverW = cam.width + Math.max(0, worldWidth - cam.width) * parallax + 200;
  const rand = new Phaser.Math.RandomDataGenerator(['dreamcatcher']);
  for (let x = 0; x < coverW; ) {
    const bw = rand.between(50, 110);
    const bh = rand.between(120, 300);
    scene.add
      .rectangle(x + bw / 2, worldHeight - bh / 2, bw, bh, 0x232342)
      .setScrollFactor(parallax, 0);
    for (let wy = worldHeight - bh + 14; wy < worldHeight - 20; wy += 26) {
      for (let wx = x + 10; wx < x + bw - 10; wx += 20) {
        if (rand.frac() < 0.35) {
          scene.add.rectangle(wx, wy, 8, 10, 0xf2d590, 0.8).setScrollFactor(parallax, 0);
        }
      }
    }
    x += bw + rand.between(8, 30);
  }
}
