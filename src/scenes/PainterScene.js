import Phaser from 'phaser';
// placeholder while the dream is being built; the real scene replaces this file
export default class PainterScene extends Phaser.Scene {
  constructor() { super('Painter'); }
  create() { this.scene.start('Hub'); }
}
