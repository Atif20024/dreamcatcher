// The passing-train wipe (round 2 WP6, critique §9 "Transitions"): hub ↔
// dream is one transition, a train going by close enough to fill the screen.
// Horizontal bands of coach side — the dream's accent livery, a row of lit
// windows — sweep across in 700 ms. At the middle, with the screen covered,
// the next scene starts underneath; the bands run on off the left edge and
// leave it showing. The chime plays as the train comes in.
//
// The bands live on the UI scene, which runs over every scene and survives a
// scene change, so one wipe spans the cut. (Death is a fade to the night
// indigo; room to room is the rooms' own crossfade; neither uses this.)
import { UI } from './ui.js';
import { IDENTITY, PLACES } from './theme.js';
import { chime } from '../systems/audio.js';
import { hex, rgba, mix } from '../art/paint.js';

export const WIPE_MS = 700;
const BANDS = 5;
const BAND_W = 2400;

let active = null;

export function wipeActive() {
  return !!active;
}

// the coach side as a band texture, per place: livery, windows, door, gaps
function bandTexture(scene, place, H) {
  const key = `dc-wipe-${place}-${H}`;
  if (scene.textures.exists(key)) return key;
  const P = PLACES[place] || PLACES.hub;
  const ct = scene.textures.createCanvas(key, BAND_W, H);
  const ctx = ct.getContext();
  const body = P.accent;
  const dark = mix(body, IDENTITY.night, 0.55);
  const coach = 600;
  for (let x0 = 0; x0 < BAND_W; x0 += coach) {
    // the gangway between coaches: the night showing through
    ctx.fillStyle = hex(IDENTITY.night);
    ctx.fillRect(x0, 0, 14, H);
    ctx.fillStyle = hex(body);
    ctx.fillRect(x0 + 14, 0, coach - 14, H);
    // the waist and the cant rail: a darker band and a brass line
    ctx.fillStyle = hex(dark);
    ctx.fillRect(x0 + 14, H * 0.74, coach - 14, H * 0.26);
    ctx.fillStyle = hex(IDENTITY.brass);
    ctx.fillRect(x0 + 14, Math.round(H * 0.72), coach - 14, 2);
    ctx.fillStyle = rgba(IDENTITY.night, 0.35);
    ctx.fillRect(x0 + 14, 0, coach - 14, Math.round(H * 0.1));
    // the windows, lit warm, smeared by the speed
    for (let k = 0; k < 6; k++) {
      const wx = x0 + 40 + k * 92;
      if (k === 3) {
        // a door: two droplights, darker
        ctx.fillStyle = hex(dark);
        ctx.fillRect(wx, H * 0.14, 46, H * 0.8);
        ctx.fillStyle = rgba(P.warm, 0.7);
        ctx.fillRect(wx + 8, H * 0.2, 30, H * 0.3);
        continue;
      }
      // the aperture, dark, then the lit saloon smeared along it
      ctx.fillStyle = hex(mix(body, IDENTITY.night, 0.8));
      ctx.fillRect(wx - 6, H * 0.16, 84, H * 0.5);
      const g = ctx.createLinearGradient(wx - 6, 0, wx + 78, 0);
      g.addColorStop(0, rgba(P.warm, 0.25));
      g.addColorStop(0.35, rgba(P.warm, 0.95));
      g.addColorStop(0.75, rgba(0xfff0d0, 1));
      g.addColorStop(1, rgba(P.warm, 0.35));
      ctx.fillStyle = g;
      ctx.fillRect(wx - 2, H * 0.2, 76, H * 0.42);
    }
  }
  ct.refresh();
  return key;
}

// Run the wipe; `go` (starting the next scene) is called at the middle.
export function trainWipe(fromScene, go, { place = 'hub', event = 'boarding', chime: ring = true } = {}) {
  const ui = UI.scene;
  if (active || !ui || !ui.sys || !ui.sys.displayList) {
    go();
    return false;
  }
  const W = ui.cameras.main.width;
  const H = ui.cameras.main.height;
  const bandH = Math.ceil(H / BANDS);
  const key = bandTexture(ui, place, bandH);
  const objs = [];
  // a night underlay, so nothing shows between the bands at the cut
  const under = ui.add.rectangle(W / 2, H / 2, W, H, IDENTITY.night, 0).setScrollFactor(0).setDepth(10000);
  objs.push(under);
  const travel = W + BAND_W; // from just off the right edge to just off the left
  const startX = W + BAND_W / 2;
  const state = { t: 0 };
  const bands = [];
  for (let i = 0; i < BANDS; i++) {
    const img = ui.add.image(startX, i * bandH + bandH / 2, key).setScrollFactor(0).setDepth(10001).setFlipX(i % 2 === 1);
    // each band slightly behind the one above: a train seen at an angle
    img.lag = (i - (BANDS - 1) / 2) * 0.035;
    bands.push(img);
    objs.push(img);
  }
  active = { objs, state };
  if (ring) chime(event, place);
  let cut = false;
  const tween = ui.tweens.add({
    targets: state,
    t: 1,
    duration: WIPE_MS,
    ease: 'Linear',
    onUpdate: () => {
      // the bands race through; the screen is fully covered around t = 0.5
      for (const b of bands) {
        const u = Math.min(1, Math.max(0, state.t + b.lag));
        b.x = startX - travel * (0.5 + (u - 0.5) * 1.15);
      }
      under.setFillStyle(IDENTITY.night, state.t < 0.5 ? Math.min(1, state.t * 2.6) : Math.max(0, 1 - (state.t - 0.5) * 2.6));
      if (!cut && state.t >= 0.5) {
        cut = true;
        try {
          go();
        } catch (e) {
          console.warn('[wipe]', e);
        }
      }
    },
    onComplete: () => {
      objs.forEach((o) => o.destroy());
      active = null;
    },
  });
  active.tween = tween;
  return true;
}
