// Tap zones: screen areas a finger can answer on a touch screen, for the
// menus that are not modals (the title, a table at THE LAST HAND, the
// hub's opening vista). Modals take their taps on the ModalManager handle
// (`tap` in the spec); see TouchControls.tap for the routing.
//
//   const off = addTapZone(scene, {
//     rects: () => [{ x, y, w, h }, …],      game px, re-read on every tap
//     onTap: (i, x, y) => …,                 i: the row tapped (pickRect), -1 none
//     when: () => true,                      live only while this is true
//     slop: 24,                              how far off a row still counts
//   });
//
// While a live zone is up, the play controls (d-pad, JUMP, E …) step aside
// (`hideControls`, default true): the screen is a menu. Nothing here runs
// unless the touch controls are on: desktop never sees a zone fire.
import { pickRect } from './touchLayout.js';

const zones = new Set();

export function addTapZone(scene, spec) {
  const z = { scene, slop: 24, hideControls: true, when: () => true, ...spec };
  zones.add(z);
  const off = () => zones.delete(z);
  if (scene && scene.events) scene.events.once('shutdown', off);
  return off;
}

const live = (z, owner) => (!owner || !z.scene || z.scene === owner) && (!z.scene || !z.scene.sys || z.scene.sys.isActive()) && z.when();

export function liveZones(owner) {
  return [...zones].filter((z) => live(z, owner));
}

// the newest live zone that takes the tap (a zone without rects takes any)
export function routeZoneTap(owner, x, y) {
  const list = liveZones(owner).reverse();
  for (const z of list) {
    if (!z.rects) {
      z.onTap(-1, x, y);
      return true;
    }
    const i = pickRect(z.rects() || [], x, y, z.slop);
    if (i >= 0 || z.anywhere) {
      z.onTap(i, x, y);
      return true;
    }
  }
  return false;
}

export const zonesHideControls = (owner) => liveZones(owner).some((z) => z.hideControls);

// a display object's screen rect (UI objects: scroll factor 0, zoom 1),
// padded to a finger's height
export function rectOf(o, padY = 6, minH = 30) {
  if (!o || !o.getBounds) return null;
  const b = o.getBounds();
  const h = Math.max(minH, b.height + padY * 2);
  return { x: b.x - 8, y: b.y + b.height / 2 - h / 2, w: b.width + 16, h };
}

// tests
export function _clearZones() {
  zones.clear();
}
