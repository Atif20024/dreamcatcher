import Phaser from 'phaser';
import HubScene from './scenes/HubScene.js';
import IntroScene from './scenes/IntroScene.js';
import MusicianScene from './scenes/MusicianScene.js';
import ChefScene from './scenes/ChefScene.js';
import AstronautScene from './scenes/AstronautScene.js';
import EveningScene from './scenes/EveningScene.js';

const params = new URLSearchParams(window.location.search);
const warpTo = params.get('at');
const eveningAt = params.get('ev');

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
  // AstronautScene.devWarp); ?ev=<place> opens THE LONG EVENING there (see
  // EveningScene.devWarp). Without either, nothing about the boot changes.
  scene: eveningAt
    ? [EveningScene, HubScene, IntroScene, MusicianScene, ChefScene, AstronautScene]
    : warpTo
      ? [AstronautScene, HubScene, IntroScene, MusicianScene, ChefScene, EveningScene]
      : [HubScene, IntroScene, MusicianScene, ChefScene, AstronautScene, EveningScene],
});
