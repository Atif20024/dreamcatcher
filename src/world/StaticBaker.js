// StaticBaker (plan 2.3.7): static layers (terrain, decor, static props,
// enclosure) are painted into one canvas per layer per room, then cut into
// chunks ≤ 1024 px wide (≤ 2048 tall) and handed to Phaser as canvas
// textures: a room's whole static look costs a handful of display objects.
// Textures are cached per scene (a room streamed out and back in is not
// repainted) and freed when the scene shuts down.

export const CHUNK_W = 1024;
export const MAX_TEX = 2048;

export class StaticBaker {
  constructor(scene) {
    this.scene = scene;
    this.keys = new Set();
    scene.events.once('shutdown', () => this.freeAll());
  }

  has(key) {
    return this.scene.textures.exists(`${key}#0`);
  }

  // canvas → chunk textures; returns the list of { key, x, w }
  bake(key, canvas) {
    if (canvas.height > MAX_TEX) throw new Error(`StaticBaker: ${key} is ${canvas.height} px tall (max ${MAX_TEX})`);
    const out = [];
    for (let x = 0, i = 0; x < canvas.width; x += CHUNK_W, i++) {
      const w = Math.min(CHUNK_W, canvas.width - x);
      const k = `${key}#${i}`;
      if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
      const ct = this.scene.textures.createCanvas(k, w, canvas.height);
      ct.getContext().drawImage(canvas, x, 0, w, canvas.height, 0, 0, w, canvas.height);
      ct.refresh();
      this.keys.add(k);
      out.push({ key: k, x, w });
    }
    return out;
  }

  // display images for baked chunks at a world origin
  images(chunks, x0, y0, depth) {
    return chunks.map((c) => this.scene.add.image(x0 + c.x, y0, c.key).setOrigin(0, 0).setDepth(depth));
  }

  freeAll() {
    for (const k of this.keys) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
    this.keys.clear();
  }
}

export default StaticBaker;
