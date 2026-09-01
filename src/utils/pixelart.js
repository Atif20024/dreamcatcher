// Build pixel-art textures from string maps, so the whole game ships without
// binary assets until the real art pass (M6).
//
// opts.outline: a colour drawn into every empty cell that touches a filled
// one. Characters and props need it — without a rim they disappear into a
// backdrop of the same value, which is exactly how this game used to read.
// The rim is drawn INSIDE the grid's own bounds so texture sizes (and the
// hitboxes measured against them) never change.
export function createPixelTexture(scene, key, rows, palette, pixelSize = 1, opts = {}) {
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = rows[0].length;
  const h = rows.length;
  const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && palette[rows[y][x]] !== undefined;

  if (opts.outline !== undefined) {
    g.fillStyle(opts.outline, 1);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (filled(x, y)) continue;
        if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) {
          g.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }

  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (color === undefined) return; // '.' = transparent
      g.fillStyle(color, 1);
      g.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    });
  });
  g.generateTexture(key, w * pixelSize, h * pixelSize);
  g.destroy();
  return key;
}

// C1.2 — a set of frames for one thing. Returns the texture keys in order;
// Foe/Player step through them in proportion to distance travelled, so
// nothing ever slides along the floor with its legs still.
export function createFrames(scene, key, frames, palette, pixelSize = 1, opts = {}) {
  return frames.map((rows, i) =>
    createPixelTexture(scene, i === 0 ? key : `${key}#${i}`, rows, palette, pixelSize, opts)
  );
}

export function frameKeys(scene, key, count) {
  const out = [key];
  for (let i = 1; i < count; i++) if (scene.textures.exists(`${key}#${i}`)) out.push(`${key}#${i}`);
  return out;
}
