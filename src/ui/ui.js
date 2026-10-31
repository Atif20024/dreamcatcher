// The UI layer's shared state (plan §2.11). UIScene runs over every gameplay
// scene with a camera that is never zoomed. Gameplay code keeps writing
// screen-space objects the way it always has (`setScrollFactor(0)` at a UI
// depth); the moment such an object exists it is moved onto UIScene's display
// list, so it is drawn by the UI camera at zoom 1 and never scales with the
// world. Objects that must stay in the world (the vignette, grain, mood
// washes) set `keepInWorld = true` before their scroll factor.
//
// Adopted objects still belong to their scene (its tweens, timers and input
// drive them) and are destroyed when that scene shuts down.
import Phaser from 'phaser';

export const UI_KEY = 'UI';
export const UI_MIN_DEPTH = 100;

export const UI = {
  scene: null,
  pending: new Set(),
};

const isScreen = (o) => o.scrollFactorX === 0 && o.scrollFactorY === 0;

export function wantsUI(o) {
  return !o.__ui && !o.keepInWorld && !o.parentContainer && isScreen(o) && o.depth >= UI_MIN_DEPTH;
}

function track(owner, obj) {
  const ui = UI.scene;
  let set = ui.adopted.get(owner);
  if (!set) {
    set = new Set();
    ui.adopted.set(owner, set);
    owner.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      ui.adopted.delete(owner);
      for (const o of set) if (o.active || o.scene) o.destroy();
    });
  }
  set.add(obj);
  obj.once(Phaser.GameObjects.Events.DESTROY, () => set.delete(obj));
}

export function adopt(obj) {
  if (!wantsUI(obj)) return obj;
  const owner = obj.scene;
  if (!owner || !owner.sys || owner.sys.settings.key === UI_KEY) return obj;
  if (!obj.displayList || obj.displayList !== owner.sys.displayList) return obj;
  const ui = UI.scene;
  if (!ui || !ui.sys.displayList) {
    UI.pending.add(obj);
    return obj;
  }
  obj.__ui = owner;
  obj.addToDisplayList(ui.sys.displayList);
  track(owner, obj);
  return obj;
}

export function flushPending() {
  const list = [...UI.pending];
  UI.pending.clear();
  for (const o of list) if (o.active && o.scene) adopt(o);
}

// patch the classes whose instances can be screen-space UI
let patched = false;
export function installAdoption() {
  if (patched) return;
  patched = true;
  const G = Phaser.GameObjects;
  const classes = [G.BitmapText, G.Image, G.Sprite, G.Rectangle, G.Arc, G.Ellipse, G.Graphics, G.Container, G.TileSprite, G.Triangle, G.Polygon, G.Line, G.Star, G.NineSlice, G.RenderTexture, G.Text, G.Zone].filter(Boolean);
  for (const C of classes) {
    const p = C.prototype;
    for (const m of ['setScrollFactor', 'setDepth']) {
      const orig = p[m];
      if (!orig || orig.__dcPatched) continue;
      const fn = function (...args) {
        const r = orig.apply(this, args);
        if (this.depth >= UI_MIN_DEPTH && this.scrollFactorX === 0) adopt(this);
        return r;
      };
      fn.__dcPatched = true;
      p[m] = fn;
    }
  }
}

// the gameplay scene the UI is serving (the top running scene that is not UI)
export function ownerScene(game) {
  const list = game.scene.getScenes(true);
  for (let i = list.length - 1; i >= 0; i--) if (list[i].sys.settings.key !== UI_KEY) return list[i];
  return null;
}
