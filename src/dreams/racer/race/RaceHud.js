// The race's HUD, in bitmap type on the UI camera. The grid's slots carry what they
// can (the track's name, the goal, place or the clock, the grip and draft meters);
// this draws what they cannot: the speedometer under the car with the next bend's
// speed marked on it, the road's progress with everybody's dot and the lamps, the
// call for the next bend, Ottavia on the radio (up where the eye is, not over the
// car), and the start lights.
import { hud } from '../../../ui/hud.js';
import { UI } from '../../../ui/ui.js';
import { uiText, PLATE } from '../../../ui/text.js';
import { THEME } from '../../../ui/theme.js';
import { gripBand, TUNE, bendSafe, gripFactor, brakePoint, turnSide } from '../../../engines/race.js';
import { touchState } from '../../../input/touchState.js';
import { clock } from './result.js';
import { DOT } from './carArt.js';

const DEPTH = 140; // under the grid's own plates, over the world
const KMH = 3.6;
const SPEEDO = { x: 346, y: 497, w: 268, h: 36 };
const STRIP = { x: 300, y: 52, w: 360, h: 4 };
const BAND = { green: 0x6fbf6f, worn: 0xd8a840, bald: 0xd5443c };
const HUD_FADE_AT = 5; // s of racing: the plates that never change have been read
const BAR = { x: SPEEDO.x + 86, y: SPEEDO.y + 21, w: SPEEDO.w - 94 };
const SPEED_SCALE = (TUNE.vMax * 1.18) / BAR.w; // m/s per px of the bar
const CALL_Y = 68;
const RADIO = { x: 16, y: 84, wrap: 330 }; // Ottavia, up on the left over the sky: the middle above the horizon is the road's
const LIGHTS_Y = 146;
const SPLIT_MS = 3200;

// what this race asks for, in a few words (the grid's goal line). Up for the first seconds, then the road has the room
export function goalLine(gate, F = {}) {
  if (gate?.time !== undefined) return `under Aldo's time: ${clock(gate.time)}`;
  if (gate?.scripted) return "stay in Aldo's air";
  if (gate?.place === 1) return 'win the Coppa';
  if (gate?.place) return F.sable_orders ? `top ${gate.place}: hold behind Dante` : `on the sheet: top ${gate.place}`;
  return 'to the line';
}

// the day: who Jo is this morning, and what he has come for. On the grid, under the lights
export const DAY_CARD = {
  pinewood: { line: 'A stranger with good hands, and a borrowed car.', goal: "EARN THE SEAT: BEAT ALDO'S TIME" },
  harbour: { line: 'His first start for the team. Aldo goes first.', goal: "STAY IN ALDO'S AIR" },
  salt: { line: 'Aldo is in the hospital. The sheet pays.', goal: 'FINISH IN THE TOP THREE' },
  coppa: { line: 'Two laps of the whole coast. Whose car it is.', goal: 'WIN' },
};

export class RaceHud {
  constructor(scene, track, { aid = false, teachBrake = false, pace = null, flags = {} } = {}) {
    const s = (this.scene = scene);
    this.track = track;
    this.aid = aid;
    this.pace = pace;
    this.teachBrake = teachBrake; // the first race: BRAKE NOW for the first bend only (design §5)
    this.gripShown = !!track.gripMatters || !!flags.tyres_short || track.id === 'coppa'; // (the plan: from the lights, when they matter from the lights)
    this.flags = flags;
    const obj = (o) => o.setScrollFactor(0).setDepth(DEPTH);
    const rect = (x, y, w, h, c, a = 1) => obj(s.add.rectangle(x, y, w, h, c, a).setOrigin(0, 0));
    hud.set('level', track.title);
    hud.set('objective', goalLine(track.gate, flags));
    hud.set('footer', touchState.on ? '' : '[Esc] pause');
    // a new car, a new way to hold it: the keys, until the plates go (a phone's are labelled)
    if (teachBrake && !touchState.on) hud.set('context', '↑ GAS  ↓ BRAKE  ←→ STEER');
    hud.region('race-speedo', { x: SPEEDO.x, y: SPEEDO.y - 2, w: SPEEDO.w, h: SPEEDO.h + 4 });
    hud.region('race-strip', { x: STRIP.x - 8, y: STRIP.y - 6, w: STRIP.w + 16, h: 12 });
    this.grip = hud.meter('grip', { label: 'GRIP', color: '#6fbf6f', order: 1, visible: this.gripShown });
    this.draft = track.rivals?.length || track.rival ? hud.meter('draft', { label: 'DRAFT', color: '#88b8d8', order: 2 }) : null;
    if (this.draft) this.draft.set(0);

    // the speedometer, a dash under the car
    rect(SPEEDO.x, SPEEDO.y, SPEEDO.w, SPEEDO.h, PLATE.dark);
    rect(SPEEDO.x, SPEEDO.y, SPEEDO.w, 1, PLATE.edge);
    rect(BAR.x, BAR.y, BAR.w, 8, 0x2a2a34);
    this.bar = rect(BAR.x, BAR.y, 1, 8, THEME['brass-light']);
    this.notch = rect(BAR.x, BAR.y - 4, 3, 16, THEME.danger).setVisible(false);
    this.speedTx = obj(uiText(s, SPEEDO.x + 78, SPEEDO.y + 3, '0', { size: 'display', scale: 1, color: 'ink', screen: true, plate: false }).setOrigin(1, 0));
    this.unitTx = obj(uiText(s, BAR.x, SPEEDO.y + 3, 'KM/H', { size: 'small', color: 'ink-dim', screen: true, plate: false }));
    this.slingTx = obj(uiText(s, SPEEDO.x + SPEEDO.w - 8, SPEEDO.y + 3, '', { size: 'small', color: 'accent', screen: true, plate: false }).setOrigin(1, 0));

    // the road: where everyone is, the bends and the lamps
    rect(STRIP.x, STRIP.y, STRIP.w, STRIP.h, 0x14122a, 0.85);
    const at = (d) => STRIP.x + (d / track.length) * STRIP.w;
    for (const b of track.bends || []) rect(at(b.from), STRIP.y, Math.max(3, at(b.to) - at(b.from)), STRIP.h, THEME.danger);
    for (const l of track.lamps || []) rect(at(l) - 1, STRIP.y - 3, 2, 10, THEME['brass-light']);
    this.dots = scene.race.rivals.map((r) => rect(STRIP.x, STRIP.y - 3, 4, 10, DOT[r.id] ?? 0x8a8478));
    this.dotAldo = pace ? rect(STRIP.x, STRIP.y - 3, 4, 10, 0xf2e6cc) : null;
    this.dotJo = rect(STRIP.x, STRIP.y - 3, 4, 10, 0x4ae0d0);
    this.at = at;

    // the call: the next bend, and how fast it goes
    this.callTx = uiText(s, 480, CALL_Y, '', { size: 'small', color: 'accent', screen: true, align: 'center', bg: PLATE.dark }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH);
    this.radioTx = uiText(s, RADIO.x, RADIO.y, '', { size: 'small', color: 'ink', screen: true, align: 'left', bg: PLATE.dark, wrap: RADIO.wrap }).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH).setVisible(false);
    // how Jo stands against the sheet, as he passes a lamp
    this.splitTx = uiText(s, 712, 12, '', { size: 'small', color: 'accent', screen: true, align: 'right', bg: PLATE.dark }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH).setVisible(false);
    this.splitUntil = 0;

    // the lights
    this.lights = [0, 1, 2].map((i) => obj(s.add.image(432 + i * 48, LIGHTS_Y, 'cars', 'light-off').setScale(2)));
    // the day's card, under the lights: gone with the green
    const day = DAY_CARD[track.id];
    this.day = day
      ? [
          uiText(s, 480, LIGHTS_Y + 40, track.title, { size: 'display', scale: 1, color: 'accent', screen: true, align: 'center', bg: PLATE.dark }),
          uiText(s, 480, LIGHTS_Y + 76, day.line, { size: 'small', color: 'ink', screen: true, align: 'center', bg: PLATE.dark }),
          uiText(s, 480, LIGHTS_Y + 106, day.goal, { size: 'small', color: 'accent', screen: true, align: 'center', bg: PLATE.dark }),
        ].map((x) => x.setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH))
      : [];
    this._last = {};
    this.flashUntil = 0;
    this.flashText = '';
  }

  setText(k, tx, v) {
    if (this._last[k] !== v) {
      this._last[k] = v;
      tx.setText(v);
    }
  }

  say(text) {
    this.radioTx.setVisible(!!text);
    if (text) this.setText('radio', this.radioTx, text);
  }

  // a word on the dash, for a moment
  flash(text, ms = 1400) {
    this.flashText = text;
    this.flashUntil = this.scene.time.now + ms;
  }

  // Jo at a lamp, against the sheet
  split(race, d) {
    if (!this.pace) return;
    const delta = race.t - this.pace.at(d);
    this.splitTx.setColor(delta <= 0 ? 'calm' : 'danger').setVisible(true);
    this.setText('split', this.splitTx, `ALDO ${delta <= 0 ? '-' : '+'}${Math.abs(delta).toFixed(1)}`);
    this.splitUntil = this.scene.time.now + SPLIT_MS;
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

    if (this.day.length && t >= -0.2) {
      this.day.forEach((x) => x.setVisible(false));
      this.day = [];
    }

    this.setText('speed', this.speedTx, String(Math.round(v * KMH)));
    // (she left the bench still beating: the needle will not sit still)
    const flicker = race.tune.untuned && v > 2 ? Math.sin(t * Math.PI * 4) * 3 : 0;
    this.bar.scaleX = Math.max(1, Math.min(BAR.w, v / SPEED_SCALE + flicker));
    // (the sling's pull is blue, a sung bend's is gold: either way the bar says she is pulling harder)
    this.bar.setFillStyle(c.slingT > 0 ? 0x88e8ff : c.singT > 0 ? 0xffe070 : THEME['brass-light']);
    // race 2 asks one thing: whether he is in Aldo's air. The dash and the bar say it the moment he is not
    const air = race.script?.air;
    const word = this.scene.time.now < this.flashUntil ? this.flashText : c.slingT > 0 ? 'OUT!' : air === false ? 'NO AIR' : c.armed && c.slingCool <= 0 ? 'FULL' : '';
    if (this._last.sling !== word) this.slingTx.setColor(word === 'NO AIR' ? 'danger' : 'accent');
    this.setText('sling', this.slingTx, word);
    if (this.draft && air !== undefined && this._last.air !== air) {
      this._last.air = air;
      this.draft.setColor(air === false ? '#d5443c' : '#88b8d8');
    }
    // the grip meter earns its place: on a race where it matters, or when the tyres are going
    const band = gripBand(c.grip);
    if (!this.gripShown && band !== 'green') {
      this.gripShown = true;
      this.grip.setVisible(true);
    }
    this.grip.set(c.grip).setColor(`#${BAND[band].toString(16).padStart(6, '0')}`);
    if (this.draft) this.draft.set(c.draft);

    const time = race.result ? race.result.time : Math.max(0, t);
    // (the grid redraws on change: a tenth of a second is plenty)
    if (track.gate?.time !== undefined) hud.set('coins', { text: `${clock(time)}  ALDO ${clock(track.gate.time)}` });
    else if (track.gate?.scripted) hud.set('coins', { text: clock(time) }); // (nobody is racing for a place here)
    else {
      const shown = race.result ? race.result.place : 1 + race.rivals.filter((r) => r.d > c.d).length;
      hud.set('coins', { text: `P${shown}   ${clock(time)}` });
    }
    if (this.splitTx.visible && this.scene.time.now > this.splitUntil) this.splitTx.setVisible(false);

    this.dotJo.x = this.at(Math.min(track.length, c.d)) - 2;
    race.rivals.forEach((r, i) => {
      this.dots[i].x = this.at(Math.min(track.length, r.d)) - 2;
    });
    if (this.dotAldo) this.dotAldo.x = this.at(this.pace.dAt(Math.max(0, t))) - 2;

    const b = race.nextBend(c.d);
    const inBend = b && c.d >= b.from;
    const dist = b ? b.from - c.d : Infinity;
    const told = this.storyCall(race);
    const call = (dist < 260 || inBend) && !race.result && !told && !['wide', 'dark', 'over'].includes(race.script?.state);
    this.notch.setVisible(!!call);
    if (call) {
      // the speed of the line Jo is on, to the nearest 5 km/h and easing with it: it must not flicker
      const gf = gripFactor(c.grip);
      const safe = bendSafe(b, c.x, gf);
      this.notch.x = BAR.x + Math.min(BAR.w - 3, safe / SPEED_SCALE);
      const safeK = Math.round((safe * KMH) / 5) * 5;
      const side = turnSide(b);
      // (the distance moves in the boards' own 50 m steps: a tenth of a second is no time to read a number)
      const tight = inBend ? `${side}: HOLD ${safeK} KM/H` : `${side} ${Math.ceil(dist / 50) * 50} M: ${safeK} KM/H`;
      const whisper = this.aid || (this.teachBrake && b === (track.bends || [])[0]);
      const brake = whisper && !inBend && v > safe && c.d >= brakePoint(b, c.x, v, gf) - v * TUNE.chalkReact;
      this.setText('call', this.callTx, brake ? 'BRAKE NOW' : tight);
      this.callTx.setVisible(true);
    } else if (told) {
      this.setText('call', this.callTx, told);
      this.callTx.setVisible(true);
    } else this.callTx.setVisible(false);

    // the plates that never change have been read by now (the goal too: the day card said it on the grid, and
  // the card says it again at the end): they go, and the road has the room
    if (t >= HUD_FADE_AT && !this.faded && !race.result) {
      this.faded = true;
      this.fadeStatics();
    }
  }

  // what the road is asking right now, when it is not a bend: the box, the choice
  storyCall(race) {
    const s = race.script;
    const jo = race.jo;
    if (!s || race.result) return '';
    if (s.wheel === 'off') return 'ROCHE IS OUT: BRAKE TO STOP, OR DRIVE ON';
    if (s.wheel === 'helping') return '';
    const box = race.track.script?.box;
    if (box && s.pit === 'ahead') {
      const to = box.d - (jo.d + 1.9);
      if (to < 120) return to > 0 ? `THE BOX ${Math.ceil(to / 10) * 10} M: STOP ON THE PAINT` : 'STOP ON THE PAINT';
    }
    if (s.pit === 'in') return `THE CREW: ${Math.ceil(s.holdT)}`;
    return '';
  }

  fadeStatics() {
    const grid = UI.scene && UI.scene.hudGrid;
    for (const key of ['level', 'footer', 'context', 'objective']) {
      const tx = grid && grid.texts[key];
      if (!tx || !hud.s[key]) continue;
      this.scene.tweens.add({ targets: tx, alpha: 0, duration: 500, onComplete: () => {
        hud.set(key, '');
        tx.setAlpha(1);
      } });
    }
  }
}
