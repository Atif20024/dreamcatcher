// Build pixel-art textures from string maps, so the whole game ships without
// binary assets until the real art pass (M6).
export function createPixelTexture(scene, key, rows, palette, pixelSize = 1) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (color === undefined) return; // '.' = transparent
      g.fillStyle(color, 1);
      g.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    });
  });
  g.generateTexture(key, rows[0].length * pixelSize, rows.length * pixelSize);
  g.destroy();
}
