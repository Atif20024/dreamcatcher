import Phaser from 'phaser';
import { registerAtlases } from '../art/baked.js';

// Boot (plan §2.17): load public/atlas/index.json, then every atlas it
// lists, register them, and hand over to the title (or a dev warp's scene).
// The runtime string-art stays only as the fallback when a frame is missing.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }


  preload() {
    const { width, height } = this.cameras.main;
    const bar = this.add.rectangle(width / 2 - 120, height / 2, 0, 6, 0xd8c8a0).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2, 244, 10).setStrokeStyle(1, 0x6a6458);
    this.load.on('progress', (p) => bar.setSize(240 * p, 6));
    this.load.json('atlas-index', 'atlas/index.json');
    this.load.once('filecomplete-json-atlas-index', (_k, _t, index) => {
      for (const p of (index && index.packs) || []) this.load.atlas(p.key, p.png, p.json);
    });
  }

  create() {
    const index = this.cache.json.get('atlas-index');
    if (index) registerAtlases(this.textures, index);
    else console.warn('[boot] no atlas index: characters fall back to runtime string-art');
    this.registry.set('booted', true);
    this.scene.start(this.registry.get('firstScene') || 'Title');
  }
}
