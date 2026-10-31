import Phaser from 'phaser';
import HubScene from './scenes/HubScene.js';
import TitleScene from './scenes/TitleScene.js';
import IntroScene from './scenes/IntroScene.js';
import MusicianScene from './scenes/MusicianScene.js';
import ChefScene from './scenes/ChefScene.js';
import AstronautScene from './scenes/AstronautScene.js';
import EveningScene from './scenes/EveningScene.js';
import WriterScene from './scenes/WriterScene.js';
import PainterScene from './scenes/PainterScene.js';
import GamblerScene from './scenes/GamblerScene.js';
import DreamScene from './scenes/DreamScene.js';
import UIScene from './ui/UIScene.js';
import BootScene from './scenes/BootScene.js';
import { installAdoption } from './ui/ui.js';

import { applyWarpToLocation, firstSceneKey } from './dev/warp.js';
import { initFlags } from './core/flags.js';
import { initTouch } from './input/touchState.js';

// ?warp=<dream>:<place> is rewritten onto the legacy per-scene params (dev only)
if (import.meta.env.DEV) applyWarpToLocation();
initFlags(window.location.search);
// phones and tablets get on-screen controls (?touch=1 forces them on a desktop)
initTouch(window);
// screen-space objects at UI depths move onto UIScene (src/ui/ui.js)
installAdoption();
const firstKey = firstSceneKey(window.location.search) || 'Title';

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  pixelArt: true,
  backgroundColor: '#14122a', // §9: the night indigo, never black
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
    // fills the browser keeping 16:9; the leftover edges are plain black
    // (index.html), not the game's indigo
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1200 },
    },
  },
  // the game opens on the title (Continue / New game / Settings), then the
  // station's front steps.
  // ?at=<phase> is a dev warp straight into the astronaut dream (see
  // AstronautScene.devWarp); ?ev=<place> opens THE LONG EVENING there (see
  // EveningScene.devWarp); ?wr=, ?pt=, ?gm= do the same for the writer, the
  // painter and the gambler. Without any, nothing about the boot changes.
  scene: (() => {
    // no warp: Boot → Title (Continue / New game / Settings) → the station
    const ALL = [TitleScene, HubScene, IntroScene, MusicianScene, ChefScene, AstronautScene, EveningScene, WriterScene, PainterScene, GamblerScene, DreamScene];
    // Boot first: it loads the atlases, then starts the title or the warp's scene
    return [BootScene, ...ALL, UIScene];
  })(),
});

window.game.registry.set('firstScene', firstKey);

// dev-only harness (window.__dc); stripped from production builds
if (import.meta.env.DEV) import('./dev/harness.js');
