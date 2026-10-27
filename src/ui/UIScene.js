// UIScene (plan §2.11): runs in parallel over every gameplay scene (hub,
// dreams, the Evening, the intro). Its camera is never zoomed, so the HUD,
// cards, dialogue and menus keep their size whatever the world camera does.
// It renders the HudGrid from the published HUD state (src/ui/hud.js) and
// hosts every screen-space object a gameplay scene adopts (src/ui/ui.js).
import Phaser from 'phaser';
import { UI, UI_KEY, flushPending, ownerScene } from './ui.js';
import { ensureFonts } from './BitmapFonts.js';
import HudGrid from './HudGrid.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: UI_KEY, active: true });
  }

  create() {
    ensureFonts(this.game);
    UI.scene = this;
    this.adopted = new Map();
    this.cameras.main.setZoom(1).setScroll(0, 0);
    this.cameras.main.transparent = true;
    this.hudGrid = new HudGrid(this);
    flushPending();
    this.scene.bringToTop();
    this.events.once('shutdown', () => {
      if (UI.scene === this) UI.scene = null;
    });
  }

  update() {
    const owner = ownerScene(this.game);
    // the UI is above every scene, whatever started after it
    const list = this.game.scene.scenes;
    if (list[list.length - 1] !== this) this.scene.bringToTop();
    // a world fade to black fades the UI with it (as when the HUD lived on
    // the world camera); a fade the UI should survive draws its own black
    const cam = this.cameras.main;
    let a = 1;
    if (owner && owner.cameras && owner.cameras.main) {
      const f = owner.cameras.main.fadeEffect;
      if (f && (f.isRunning || f.isComplete)) a = 1 - f.alpha;
    }
    if (cam.alpha !== a) cam.setAlpha(a);
    this.hudGrid.update();
  }
}
