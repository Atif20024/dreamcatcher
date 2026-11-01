// The race's HUD, in bitmap type on the UI camera. The grid's slots carry what
// they can (the track's name, the goal, place and time, the grip and draft
// meters, Ottavia on the radio); this draws what they cannot: the speedometer
// with the next bend's speed marked on it, the road's progress, the start
// lights and the sight strip (the view is only 18 m ahead at top speed, so the
// lanes tell you what is coming, for as long as it takes to act on it).
import { hud } from '../../../ui/hud.js';
import { uiText, PLATE } from '../../../ui/text.js';
import { THEME } from '../../../ui/theme.js';
import { gripBand, TUNE } from '../../../engines/race.js';
import { touchState } from '../../../input/touchState.js';
import { clock } from './result.js';
import { LANE_Y } from './RaceRoad.js';

const DEPTH = 140; // under the grid's own plates, over the world
const KMH = 3.6;
const SPEEDO = { x: 330, y: 482, w: 300, h: 46 };
const STRIP = { x: 300, y: 92, w: 360, h: 4 };
const BAND = { green: 0x6fbf6f, worn: 0xd8a840, bald: 0xd5443c };
const WARN = { cart: 0xd5443c, bale: 0xe8c050, car: 0xf2e6cc };
const BAR = { x: SPEEDO.x + 96, y: SPEEDO.y + 28, w: SPEEDO.w - 104 };
const SPEED_SCALE = (TUNE.vMax * 1.18) / BAR.w; // m/s per px of the bar

export class RaceHud {
  constructor(scene, track, { aid = false } = {}) {
    const s = (this.scene = scene);
    this.track = track;
    this.aid = aid;
    const obj = (o) => o.setScrollFactor(0).setDepth(DEPTH);
    const rect = (x, y, w, h, c, a = 1) => obj(s.add.rectangle(x, y, w, h, c, a).setOrigin(0, 0));
    hud.set('level', track.title);
    hud.set('objective', 'beat the black Corsa to the line');
    hud.set('footer', touchState.on ? '' : '[Esc] pause');
    hud.region('race-speedo', { x: SPEEDO.x, y: SPEEDO.y - 2, w: SPEEDO.w, h: SPEEDO.h + 4 });
    hud.region('race-strip', { x: STRIP.x - 8, y: STRIP.y - 8, w: STRIP.w + 16, h: 20 });
    this.grip = hud.meter('grip', { label: 'GRIP', color: '#6fbf6f', order: 1 });
    this.draft = hud.meter('draft', { label: 'DRAFT', color: '#88b8d8', order: 2 });
    this.draft.set(0);

    // the speedometer
    rect(SPEEDO.x, SPEEDO.y, SPEEDO.w, SPEEDO.h, PLATE.dark, PLATE.alpha);
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

    // the sight strip: one chevron per lane at the screen's edge (clear of the pedals)
    const edge = touchState.on ? 742 : 932;
    this.warn = LANE_Y.map((y) => {
      const g = obj(s.add.triangle(edge, y - 22, 0, 0, 16, 11, 0, 22, 0xffffff).setOrigin(0.5));
      const t = obj(uiText(s, edge - 12, y - 22, '', { size: 'small', color: 'ink', screen: true, bg: PLATE.dark }).setOrigin(1, 0.5));
      g.setVisible(false);
      t.setVisible(false);
      return { g, t };
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

  update(race) {
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
    const band = gripBand(c.grip);
    this.grip.set(c.grip).setColor(`#${BAND[band].toString(16).padStart(6, '0')}`);
    this.draft.set(c.draft).setLabel(c.armed ? 'FULL' : 'DRAFT');

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
      this.notch.x = BAR.x + Math.min(BAR.w - 3, b.safe / SPEED_SCALE);
      const safeK = Math.round(b.safe * KMH);
      const tight = inBend ? `IN THE BEND: ${safeK}` : `BEND ${Math.max(0, Math.round(dist / 10) * 10)} M: ${safeK}`;
      const brake = this.aid && !inBend && v > b.safe && (v * v - b.safe * b.safe) / (2 * TUNE.brake) + 14 >= dist;
      this.setText('call', this.callTx, brake ? 'BRAKE NOW' : tight);
      this.callTx.setVisible(true);
    } else this.callTx.setVisible(false);

    const near = [null, null, null];
    for (const a of race.ahead(160)) if (!near[a.lane] || a.dist < near[a.lane].dist) near[a.lane] = a;
    near.forEach((a, i) => {
      const w = this.warn[i];
      const show = !!a && a.dist > 10 && !race.result;
      w.g.setVisible(show);
      w.t.setVisible(show);
      if (!show) return;
      w.g.setFillStyle(WARN[a.kind] ?? 0xffffff);
      w.g.setScale(a.dist < 60 ? 1.4 : 1);
      this.setText(`warn${i}`, w.t, `${Math.round(a.dist / 10) * 10} M`);
    });
  }
}
