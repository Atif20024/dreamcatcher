// The race's HUD, in bitmap type on the UI camera. The grid's slots carry what
// they can (the track's name, the goal, place and time, the grip and draft
// meters, Ottavia on the radio); this draws what they cannot: the speedometer
// with the next bend's speed marked on it, the road's progress, the start
// lights and the sight strip (the view is only 14-17 m ahead, so the lanes tell
// you what is coming until the road itself shows it: never a label on a thing in
// plain sight, and a pulse by the time to contact, not arithmetic in metres).
import { hud } from '../../../ui/hud.js';
import { UI } from '../../../ui/ui.js';
import { uiText, PLATE } from '../../../ui/text.js';
import { THEME } from '../../../ui/theme.js';
import { gripBand, TUNE, CAR_LEN, bendSafe, gripFactor, brakePoint, turnSide } from '../../../engines/race.js';
import { touchState } from '../../../input/touchState.js';
import { clock } from './result.js';
import { LANE_Y } from './RaceRoad.js';

const DEPTH = 140; // under the grid's own plates, over the world
const KMH = 3.6;
const SPEEDO = { x: 330, y: 482, w: 300, h: 46 };
const STRIP = { x: 300, y: 92, w: 360, h: 4 };
const BAND = { green: 0x6fbf6f, worn: 0xd8a840, bald: 0xd5443c };
const WARN = { cart: 0xd5443c, bale: 0xe8c050, car: 0xf2e6cc };
const SIGHT_X = 664; // in from the edge: on the eye's way from the car to the road ahead (clear of the pedals)
const PULSE_TTC = 1.5; // s to contact: the chevron starts to pulse
const GROW_TTC = 4.5; // s: and grows from here
const OTHER_LANE = 0.45; // what is not in Jo's lane stands back
const HUD_FADE_AT = 5; // s of racing: the plates that never change have been read
const BAR = { x: SPEEDO.x + 96, y: SPEEDO.y + 28, w: SPEEDO.w - 104 };
const SPEED_SCALE = (TUNE.vMax * 1.18) / BAR.w; // m/s per px of the bar

// how much a thing ahead shows: its time to contact, and the pulse it has reached
export function sightOf(a, v, now) {
  const closing = v - a.v;
  const ttc = closing > 0.5 ? a.dist / closing : Infinity;
  const k = Math.max(0, Math.min(1, (GROW_TTC - ttc) / (GROW_TTC - PULSE_TTC)));
  const pulse = ttc < PULSE_TTC ? 0.5 + 0.5 * Math.sin(now * Math.PI * 2 * (2 + (PULSE_TTC - ttc) * 3)) : 1;
  return { ttc, scale: 1 + 0.7 * k, alpha: ttc < PULSE_TTC ? 0.45 + 0.55 * pulse : 0.55 + 0.45 * k };
}

export class RaceHud {
  constructor(scene, track, { aid = false, teachBrake = false } = {}) {
    const s = (this.scene = scene);
    this.track = track;
    this.aid = aid;
    this.teachBrake = teachBrake; // the first race: BRAKE NOW for the first bend only (design §5)
    this.gripShown = !!track.gripMatters;
    const obj = (o) => o.setScrollFactor(0).setDepth(DEPTH);
    const rect = (x, y, w, h, c, a = 1) => obj(s.add.rectangle(x, y, w, h, c, a).setOrigin(0, 0));
    hud.set('level', track.title);
    hud.set('objective', 'beat the black Corsa to the line');
    hud.set('footer', touchState.on ? '' : '[Esc] pause');
    hud.region('race-speedo', { x: SPEEDO.x, y: SPEEDO.y - 2, w: SPEEDO.w, h: SPEEDO.h + 4 });
    hud.region('race-strip', { x: STRIP.x - 8, y: STRIP.y - 8, w: STRIP.w + 16, h: 20 });
    hud.region('race-sight', { x: SIGHT_X - 44, y: LANE_Y[0] - 40, w: 66, h: LANE_Y[2] - LANE_Y[0] + 44 });
    this.grip = hud.meter('grip', { label: 'GRIP', color: '#6fbf6f', order: 1, visible: this.gripShown });
    this.draft = hud.meter('draft', { label: 'DRAFT', color: '#88b8d8', order: 2 });
    this.draft.set(0);

    // the speedometer
    // (opaque: at speed the kerb's top edge crosses this plate, and showed through it as a second, dimmer strip)
    rect(SPEEDO.x, SPEEDO.y, SPEEDO.w, SPEEDO.h, PLATE.dark);
    rect(SPEEDO.x, SPEEDO.y, SPEEDO.w, 1, PLATE.edge);
    rect(BAR.x, BAR.y, BAR.w, 10, 0x2a2a34);
    this.bar = rect(BAR.x, BAR.y, 1, 10, THEME['brass-light']);
    this.notch = rect(BAR.x, BAR.y - 4, 3, 18, THEME.danger).setVisible(false);
    this.speedTx = obj(uiText(s, SPEEDO.x + 86, SPEEDO.y + 9, '0', { size: 'display', scale: 2, color: 'ink', screen: true, plate: false }).setOrigin(1, 0));
    this.unitTx = obj(uiText(s, BAR.x, SPEEDO.y + 5, 'KM/H', { size: 'small', color: 'ink-dim', screen: true, plate: false }));
    this.slingTx = obj(uiText(s, SPEEDO.x + SPEEDO.w - 8, SPEEDO.y + 5, '', { size: 'small', color: 'accent', screen: true, plate: false }).setOrigin(1, 0));

    // the road: where everyone is, the bends and the lamp
    rect(STRIP.x, STRIP.y, STRIP.w, STRIP.h, 0x14122a, 0.85);
    const at = (d) => STRIP.x + (d / track.length) * STRIP.w;
    for (const b of track.bends || []) rect(at(b.from), STRIP.y, Math.max(3, at(b.to) - at(b.from)), STRIP.h, THEME.danger);
    for (const l of track.lamps || []) rect(at(l) - 1, STRIP.y - 4, 2, 12, THEME['brass-light']);
    this.dotRival = rect(STRIP.x, STRIP.y - 3, 4, 10, 0x8a8478);
    this.dotJo = rect(STRIP.x, STRIP.y - 3, 4, 10, 0x4ae0d0);
    this.at = at;

    // the call: the next bend, and how fast it goes
    this.callTx = uiText(s, 480, 106, '', { size: 'small', color: 'accent', screen: true, align: 'center', bg: PLATE.dark }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH);

    // the sight strip: one chevron per lane, at the lane's own height, and a tick
    // that runs back along the lane towards the car (the lane cue)
    this.warn = LANE_Y.map((y) => {
      const g = obj(s.add.triangle(SIGHT_X, y - 22, 0, 0, 16, 11, 0, 22, 0xffffff).setOrigin(0.5));
      const t = rect(SIGHT_X - 40, y - 23, 26, 2, 0xffffff);
      g.setVisible(false);
      t.setVisible(false);
      return { g, t, fade: 0 };
    });

    // the lights
    this.lights = [0, 1, 2].map((i) => obj(s.add.image(432 + i * 48, 150, 'cars', 'light-off').setScale(2)));
    this._last = {};
  }

  setText(k, tx, v) {
    if (this._last[k] !== v) {
      this._last[k] = v;
      tx.setText(v);
    }
  }

  // view: metres of road the camera shows ahead of the car, this frame
  update(race, view = 18) {
    const c = race.jo;
    const v = c.v;
    const track = this.track;
    // the lights: three reds, one a second, all green on GO, gone a second later
    const t = race.t;
    const lit = t >= 0 ? 'light-green' : 'light-red';
    this.lights.forEach((l, i) => {
      l.setVisible(t < 1.2);
      if (t < 1.2) l.setFrame(t >= 0 || t >= -3 + i * 1 ? lit : 'light-off');
    });

    this.setText('speed', this.speedTx, String(Math.round(v * KMH)));
    this.bar.scaleX = Math.max(1, Math.min(BAR.w, v / SPEED_SCALE));
    this.bar.setFillStyle(c.slingT > 0 ? 0x88e8ff : THEME['brass-light']);
    this.setText('sling', this.slingTx, c.slingT > 0 ? 'SLING!' : c.armed && c.slingCool <= 0 ? 'SLING READY' : c.slingCool > 0 ? 'COOLING' : '');
    // the grip meter earns its place: on a race where it matters, or when the tyres are going
    const band = gripBand(c.grip);
    if (!this.gripShown && band !== 'green') {
      this.gripShown = true;
      this.grip.setVisible(true);
    }
    this.grip.set(c.grip).setColor(`#${BAND[band].toString(16).padStart(6, '0')}`);
    this.draft.set(c.draft);

    const shown = race.result ? race.result.place : 1 + race.rivals.filter((r) => r.d > c.d).length;
    const time = race.result ? race.result.time : Math.max(0, t);
    // (the grid redraws on change: a tenth of a second is plenty)
    hud.set('coins', { text: `P${shown}   ${clock(time)}` });

    this.dotJo.x = this.at(Math.min(track.length, c.d)) - 2;
    if (race.rivals[0]) this.dotRival.x = this.at(Math.min(track.length, race.rivals[0].d)) - 2;

    const b = race.nextBend(c.d);
    const inBend = b && c.d >= b.from;
    const dist = b ? b.from - c.d : Infinity;
    const call = dist < 260 || inBend;
    this.notch.setVisible(!!call);
    if (call) {
      // the speed of the line Jo is on (the lane he has asked for: it does not flicker in the glide)
      const gf = gripFactor(c.grip);
      const safe = bendSafe(b, c.lane, gf);
      this.notch.x = BAR.x + Math.min(BAR.w - 3, safe / SPEED_SCALE);
      const safeK = Math.round((safe * KMH) / 2) * 2;
      const side = turnSide(b);
      // (the distance moves in the boards' own 50 m steps: a tenth of a second is no time to read a number)
      const tight = inBend ? `${side}: HOLD ${safeK} KM/H` : `${side} IN ${Math.ceil(dist / 50) * 50} M: TAKE AT ${safeK} KM/H`;
      const whisper = this.aid || (this.teachBrake && b === (track.bends || [])[0]);
      const brake = whisper && !inBend && v > safe && c.d >= brakePoint(b, c.lane, v, gf) - v * TUNE.chalkReact;
      this.setText('call', this.callTx, brake ? 'BRAKE NOW' : tight);
      this.callTx.setVisible(true);
    } else this.callTx.setVisible(false);

    const near = [null, null, null];
    for (const a of race.ahead(160)) if (!near[a.lane] || a.dist < near[a.lane].dist) near[a.lane] = a;
    near.forEach((a, i) => {
      const w = this.warn[i];
      // beyond the view only: once the road shows the thing, the road does the telling
      // (a car's nose reaches the view before its middle does)
      const show = !!a && a.dist - (a.kind === 'car' ? CAR_LEN / 2 : 0) > view && !race.result;
      w.fade = show ? Math.min(1, w.fade + 0.12) : 0;
      w.g.setVisible(show);
      w.t.setVisible(show);
      if (!show) return;
      const { scale, alpha } = sightOf(a, v, Math.max(0, t));
      const on = alpha * w.fade * (c.lane === i ? 1 : OTHER_LANE);
      w.g.setFillStyle(WARN[a.kind] ?? 0xffffff).setScale(scale).setAlpha(on);
      w.t.setFillStyle(WARN[a.kind] ?? 0xffffff).setAlpha(on);
    });

    // the plates that never change have been read by now: they go, and the road has the room
    if (t >= HUD_FADE_AT && !this.faded && !race.result) {
      this.faded = true;
      this.fadeStatics();
    }
  }

  fadeStatics() {
    const grid = UI.scene && UI.scene.hudGrid;
    for (const key of ['level', 'objective', 'footer']) {
      const tx = grid && grid.texts[key];
      if (!tx || !hud.s[key]) continue;
      this.scene.tweens.add({ targets: tx, alpha: 0, duration: 500, onComplete: () => {
        hud.set(key, '');
        tx.setAlpha(1);
      } });
    }
  }
}
