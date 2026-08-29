import Phaser from 'phaser';
import PlaygroundScene from './scenes/PlaygroundScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  pixelArt: true,
  backgroundColor: '#2d2d44',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1200 },
    },
  },
  scene: [PlaygroundScene],
});
