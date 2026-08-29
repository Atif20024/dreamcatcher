import Phaser from 'phaser';
import SelectScene from './scenes/SelectScene.js';
import IntroScene from './scenes/IntroScene.js';
import LevelScene from './scenes/LevelScene.js';

window.game = new Phaser.Game({
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
  scene: [SelectScene, IntroScene, LevelScene],
});
