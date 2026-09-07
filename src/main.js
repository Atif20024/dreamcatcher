import Phaser from 'phaser';
import HubScene from './scenes/HubScene.js';
import IntroScene from './scenes/IntroScene.js';
import MusicianScene from './scenes/MusicianScene.js';
import ChefScene from './scenes/ChefScene.js';
import AstronautScene from './scenes/AstronautScene.js';

const warpTo = new URLSearchParams(window.location.search).get('at');

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
  // the game opens mid-life, at the station's front steps -- never on a menu.
  // ?at=<phase> is a dev warp straight into the astronaut dream (see
  // AstronautScene.devWarp); without it nothing about the boot changes.
  scene: warpTo
    ? [AstronautScene, HubScene, IntroScene, MusicianScene, ChefScene]
    : [HubScene, IntroScene, MusicianScene, ChefScene, AstronautScene],
});
