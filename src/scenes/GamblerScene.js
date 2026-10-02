import Phaser from 'phaser';
// placeholder while the dream is being built; the real scene replaces this file
export default class GamblerScene extends Phaser.Scene {
  constructor() { super('Gambler'); }
  create() { this.scene.start('Hub'); }
}
