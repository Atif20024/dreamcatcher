import Phaser from 'phaser';
import HubScene from './scenes/HubScene.js';
import IntroScene from './scenes/IntroScene.js';
import MusicianScene from './scenes/MusicianScene.js';
import ChefScene from './scenes/ChefScene.js';
import RigTestScene from './scenes/RigTestScene.js';

// dev: ?scene=rigtest opens the rig proof scene instead of the station
const wanted = new URLSearchParams(location.search).get('scene');

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  pixelArt: true,
  backgroundColor: '#2d2d44',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1200 },
    },
  },
  // the game opens mid-life, at the station's front steps -- never on a menu
  scene: [HubScene, IntroScene, MusicianScene, ChefScene, RigTestScene],
});

if (wanted === 'rigtest') {
  window.game.events.once('ready', () => {
    window.game.scene.stop('Hub');
    window.game.scene.start('RigTest');
  });
}
