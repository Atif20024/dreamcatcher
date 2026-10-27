import Phaser from 'phaser';
import HubScene from './scenes/HubScene.js';
import IntroScene from './scenes/IntroScene.js';
import MusicianScene from './scenes/MusicianScene.js';
import ChefScene from './scenes/ChefScene.js';
import AstronautScene from './scenes/AstronautScene.js';
import EveningScene from './scenes/EveningScene.js';
import WriterScene from './scenes/WriterScene.js';
import PainterScene from './scenes/PainterScene.js';
import GamblerScene from './scenes/GamblerScene.js';
import UIScene from './ui/UIScene.js';
import { installAdoption } from './ui/ui.js';

import { applyWarpToLocation, firstSceneKey } from './dev/warp.js';
import { initFlags } from './core/flags.js';

// ?warp=<dream>:<place> is rewritten onto the legacy per-scene params (dev only)
if (import.meta.env.DEV) applyWarpToLocation();
initFlags(window.location.search);
// screen-space objects at UI depths move onto UIScene (src/ui/ui.js)
installAdoption();
const firstKey = firstSceneKey(window.location.search);

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
  // EveningScene.devWarp); ?wr=, ?pt=, ?gm= do the same for the writer, the
  // painter and the gambler. Without any, nothing about the boot changes.
  scene: (() => {
    const ALL = [HubScene, IntroScene, MusicianScene, ChefScene, AstronautScene, EveningScene, WriterScene, PainterScene, GamblerScene];
    // a dev warp puts its scene first so it boots directly
    const BY_KEY = { Hub: HubScene, Chef: ChefScene, Musician: MusicianScene, Astronaut: AstronautScene, Evening: EveningScene, Writer: WriterScene, Painter: PainterScene, Gambler: GamblerScene };
    const first = BY_KEY[firstKey] || null;
    // UIScene last: it draws over every gameplay scene, at zoom 1
    return [...(first ? [first, ...ALL.filter((S) => S !== first)] : ALL), UIScene];
  })(),
});

// dev-only harness (window.__dc); stripped from production builds
if (import.meta.env.DEV) import('./dev/harness.js');
