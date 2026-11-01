// Encounter presenters (plan 2.10): the visual half of an encounter. The
// engine is pure logic; a presenter only draws its state(). 'world' stages it
// in the room at the encounter's anchor (the camera closes in, the HUD tool
// slot carries the count); 'modal' draws the same thing in a centred panel
// through the ModalManager, for anything kept as a menu.
//
//   makePresenter(scene, def, engine, ctx) → { enter(state), render(state, outcome), outro(result) → Promise, destroy() }
import ModalManager from '../ui/ModalManager.js';
import { panel, dim, drawPanel } from '../ui/Panel.js';
import { uiText } from '../ui/text.js';
import { hud } from '../ui/hud.js';
import { playTone, trumpetHz, bassHz, sfx } from '../systems/audio.js';
import { noteHz } from '../audio/modes.js';
import { beatCorrection } from '../engines/rhythm.js';
import { craftWorld } from './craftPresenter.js';
import { slatePresenter, faroPresenter, showdownPresenter } from '../dreams/gambler/table.js';
import { escapementWorld } from '../dreams/clockmaker/presenter.js';

const RAD = Math.PI / 180;

// the clock: a dial with the gear windows (brass) and the sweeping hand
function drawDial(g, cx, cy, R, st, flash) {
  g.clear();
  g.fillStyle(0x140e14, 0.35).fillCircle(cx, cy, R + 6);
  st.windows.forEach((w, i) => {
    const seated = i < st.seated;
    const cur = i === st.seated;
    const a0 = (w.center - w.half - 90) * RAD;
    const a1 = (w.center + w.half - 90) * RAD;
    const col = seated ? 0x7ec87e : cur ? (st.inWindow ? 0xf6d98a : 0xe9b84a) : 0x6b4a1f;
    // the brass window glows for the first half second of each sweep
    g.lineStyle(cur ? (st.angle < 70 ? 14 : 10) : 7, col, seated ? 0.9 : cur ? 0.95 : 0.6);
    g.beginPath();
    g.arc(cx, cy, R - 8, a0, a1, false);
    g.strokePath();
    // a symbol as well as a colour (accessibility): a tick for seated
    const am = (w.center - 90) * RAD;
    const px = cx + Math.cos(am) * (R + 10);
    const py = cy + Math.sin(am) * (R + 10);
    if (seated) g.fillStyle(0x7ec87e, 1).fillCircle(px, py, 4);
    else g.lineStyle(2, col, 0.9).strokeCircle(px, py, 4);
  });
  const a = (st.angle - 90) * RAD;
  g.lineStyle(4, flash === 'miss' ? 0xd5443c : 0x1a1420, 1);
  g.beginPath();
  g.moveTo(cx - Math.cos(a) * 10, cy - Math.sin(a) * 10);
  g.lineTo(cx + Math.cos(a) * (R - 4), cy + Math.sin(a) * (R - 4));
  g.strokePath();
  g.fillStyle(0xc8963a, 1).fillCircle(cx, cy, 6);
}

function clockworkWorld(scene, def, engine, ctx) {
  const a = ctx.anchor || { x: scene.player.x, y: scene.player.y - 120 };
  const R = def.radius || 52;
  const g = scene.add.graphics().setDepth(-11);
  const tool = hud.toolLine(3, 'accent');
  let flash = null;
  let flashT = 0;
  const marks = (st) => Array.from({ length: def.gearTotal || st.gears }, (_, i) => (i < st.seated ? '●' : '○')).join(' ');
  return {
    enter(st) {
      drawDial(g, a.x, a.y, R, st, null);
      tool.setText(`GEARS ${marks(st)}`).setVisible(true);
      hud.set('context', def.hint || '[E] when the hand is in the brass');
    },
    render(st, outcome) {
      if (outcome) {
        flash = outcome;
        flashT = scene.time.now;
        try {
          if (outcome === 'hit') [523, 659].forEach((f, i) => playTone(f, 0.18, 'triangle', 0.12, i * 0.06));
          else playTone(140, 0.2, 'square', 0.08);
        } catch {
          /* no audio */
        }
        scene.cameras.main.shake(outcome === 'hit' ? 90 : 60, outcome === 'hit' ? 0.002 : 0.004);
      }
      if (flash && scene.time.now - flashT > 220) flash = null;
      drawDial(g, a.x, a.y, R, st, flash);
      tool.setText(`GEARS ${marks(st)}`);
      if (def.onRender) def.onRender(scene, st);
    },
    outro() {
      return new Promise((res) => {
        try {
          [392, 523, 659, 784].forEach((f, i) => playTone(f, 0.5, 'sine', 0.12, i * 0.12));
        } catch {
          /* no audio */
        }
        const ring = scene.add.circle(a.x, a.y, R, 0xf6d98a, 0).setStrokeStyle(4, 0xf6d98a, 1).setDepth(-10);
        scene.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
        scene.time.delayedCall(750, res);
      });
    },
    destroy() {
      g.destroy();
      tool.setText('').setVisible(false);
      hud.set('context', '');
    },
  };
}

function clockworkModal(scene, def, engine) {
  const cam = scene.cameras.main;
  const h = ModalManager.for(scene).open({ kind: 'encounter', name: `encounter:${def.id}`, freeze: 'none' });
  h.add(dim(scene, 0.55, 220));
  h.add(panel(scene, cam.width / 2, cam.height / 2, 420, 340, { depth: 221, accent: 0xe9b84a }));
  h.add(uiText(scene, cam.width / 2, cam.height / 2 - 150, def.title || 'THE CLOCK', { size: 'display', color: 'accent', align: 'center' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(222));
  const g = h.add(scene.add.graphics().setScrollFactor(0).setDepth(222));
  return {
    enter(st) {
      drawDial(g, cam.width / 2, cam.height / 2 + 20, 100, st, null);
    },
    render(st, outcome) {
      drawDial(g, cam.width / 2, cam.height / 2 + 20, 100, st, outcome);
    },
    destroy() {
      h.close();
    },
  };
}

// ---- the gig (the Musician's call and response, src/engines/rhythm.js) ------
// Staged in the room: the phrase hangs over the stage as a row of brass notes
// (a filled note to play, a hollow ring for a rest, a long bar for a held
// note, faint heads when it must be played by ear); a cursor sweeps the PLAY
// bar; the house lights dim and a spot finds Jo; the audience the room placed
// (scene.audience) turns toward the stage on every phrase he lands; NERVE is
// a HUD meter. Notes sit on the staff by pitch and sound in def.scale, the
// room's key. A phrase's voice 'bass' is Nia (the blank), 'clap' is Ray.
// def.cues (flags → cues, or a table) are the people around him: captions on
// a bar, on a freeze, on a rushed third bar, and the songs' names.
const NOTE = 0xf2d580;
const NOTE_DIM = 0x8a7448;
const HIT = 0x7ec87e;
const BAD = 0xd06050;

function drawStaff(g, cx, cy, st, flash) {
  g.clear();
  const n = Math.max(1, st.len);
  const gap = st.div < 1 ? 38 : 54;
  const w = st.hold ? 220 : (st.beats.length - 1) * gap;
  const x0 = cx - w / 2;
  // the plate: night at 88 %, a brass line (the identity's frame)
  // (a third bar wears the teal: somebody is listening for this one)
  drawPanel(g, x0 - 44, cy - 40, w + 88, 80, { accent: st.third ? 0x2e7d9a : 0xc8a24a });
  // five staff lines
  g.lineStyle(1, 0xc8a24a, 0.28);
  for (let k = -2; k <= 2; k++) g.lineBetween(x0 - 30, cy + k * 8, x0 + w + 30, cy + k * 8);
  if (st.phase === 'lead' || st.phase === 'frozen' || st.phase === 'breath' || st.phase === 'done') return;
  const listen = st.phase === 'listen';
  if (st.hold) {
    const lit = listen ? Math.min(1, st.beat / n) : st.heldFrac;
    g.fillStyle(NOTE_DIM, 0.6).fillRect(x0, cy - 6, w, 12);
    g.fillStyle(st.hits[0] === false ? BAD : listen ? NOTE : HIT, 1).fillRect(x0, cy - 6, Math.max(16, w * lit), 12);
    g.fillStyle(NOTE, 1).fillCircle(x0, cy, 12);
    return;
  }
  // the tune is drawn as it sounds: a higher note sits higher
  const sung = (st.notes || []).filter((n) => n !== null && n !== undefined);
  const mid = sung.length ? (Math.min(...sung) + Math.max(...sung)) / 2 : 0;
  st.beats.forEach((b, i) => {
    const x = x0 + i * gap;
    const y = b === 1 && st.notes && st.notes[i] != null ? cy - Math.max(-16, Math.min(16, (st.notes[i] - mid) * 4)) : cy;
    const hit = st.hits[i];
    const pulse = listen && Math.floor(st.beat) === i ? 1.35 : 1;
    const col = hit === true ? HIT : hit === false ? BAD : NOTE;
    const a = st.blind && hit == null ? 0.16 : 1;
    if (b === 1) {
      g.fillStyle(col, a).fillEllipse(x, y + 4, 22 * pulse, 16 * pulse);
      g.lineStyle(3, col, a).lineBetween(x + 9 * pulse, y + 2, x + 9 * pulse, y - 26 * pulse);
    } else {
      // a rest: a hollow ring with the rest's zig (do not play)
      const rc = hit === false ? BAD : 0x9c8f7a;
      g.lineStyle(3, rc, a).strokeCircle(x, y, 11 * pulse);
      g.lineStyle(2, rc, a);
      g.lineBetween(x - 3, y - 6, x + 3, y - 1);
      g.lineBetween(x + 3, y - 1, x - 3, y + 3);
      g.lineBetween(x - 3, y + 3, x + 2, y + 7);
    }
  });
  if (st.phase === 'play') {
    const cx2 = x0 + Math.max(0, Math.min(st.beats.length - 1 + 0.4, st.beat)) * gap;
    g.lineStyle(3, flash === 'bad' ? BAD : 0xf6d98a, 0.95).lineBetween(cx2, cy - 32, cx2, cy + 32);
  }
}

function rhythmWorld(scene, def, engine, ctx) {
  const a = ctx.anchor || { x: scene.player.x, y: scene.player.y - 160 };
  const g = scene.add.graphics().setDepth(40);
  const cam = scene.cameras.main;
  // the house lights go down; a spot on Jo
  const dimR = scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width * 3, cam.height * 3, 0x14122a, 1).setAlpha(0).setScrollFactor(0).setDepth(11.5);
  const spot = scene.add.image(scene.player.x, scene.player.y - 30, 'dc-glow').setBlendMode('ADD').setTint(0xffe0a0).setScale(1.6, 2.4).setAlpha(0).setDepth(11.6);
  scene.tweens.add({ targets: dimR, alpha: 0.42, duration: 700 });
  scene.tweens.add({ targets: spot, alpha: 0.5, duration: 700 });
  const tool = hud.toolLine(3, 'accent');
  const nerve = hud.meter('nerve', { label: 'NERVE', color: '#d06050', order: 5 });
  // what to do now rides the HUD's context line (screen space: always legible)
  let said = null;
  const label = {
    setText(t) {
      if (t === said) return;
      said = t;
      hud.set('context', t);
    },
  };
  const retries = (engine.retries ?? 2);
  let flash = null;
  let flashT = 0;
  const flags = ctx.flags || {};
  const cues = (typeof def.cues === 'function' ? def.cues(flags) : def.cues) || {};
  const say = (c) => c && scene.caption && scene.caption.say(c.who, c.text, { ms: c.ms || 2200 });
  const key = def.scale || { root: 261.6, mode: 'ionian', oct: 0 };
  const horn = (d) => noteHz(key, d ?? 0);
  // the band's clock: a call starts on the beat the band is on
  let bandBeatAt = null;
  const onBandBeat = () => (bandBeatAt = scene.time.now);
  scene.events.on('beat', onBandBeat);
  // the song's camera: closer with each song, popped at the end
  let songShot = null;
  const songName = (i) => (cues.songs && i != null ? cues.songs[i] : null);
  let nextSong = null;
  let freezesSaid = 0;
  const marks = (st) => `${songName(st.song) || def.title || 'THE SET'}  ${Math.min(st.idx + 1, st.total)}/${st.total}`;
  const hint = (st) => {
    if (st.phase === 'frozen') return '…frozen. breathe.';
    if (st.phase === 'breath') return nextSong ? `next: ${nextSong}` : 'breathe.';
    if (st.third && st.phase === 'play' && !st.silent && cues.thirdAhead) return "the third bar. don't rush it";
    if (st.phase === 'lead') return def.lead || 'the band counts you in…';
    if (st.phase === 'listen') return st.blind ? 'LISTEN. no notes to read: play it by ear' : st.silent ? 'LISTEN… then leave the whole bar empty' : st.hold ? 'LISTEN: one long note' : 'LISTEN…';
    if (st.phase === 'play') return st.hold ? 'PLAY: press [E] and HOLD it' : st.silent ? 'say nothing. let the room breathe' : 'PLAY: [E] or [Q] on every note, nothing on a ring';
    if (st.phase === 'judge') return st.lastOk ? 'yes.' : st.tries < retries ? 'again, a little slower' : 'the band carries you';
    return '';
  };
  // a gig with a warned third bar and nobody left to warn: the plate says nothing either
  const staffOf = (st) => (cues.third && !cues.thirdAhead ? { ...st, third: false } : st);
  const react = (ok) => {
    // (the room next door is streamed in: the alley's neon must not turn the Cellar)
    const aud = (scene.audience || []).filter((a) => a.room === scene.roomId);
    if (!ok || !aud.length) return;
    // (every chair has turned by the last bar of a clean run)
    for (let n = Math.ceil(aud.length / engine.state().total); n > 0; n--) {
      const next = aud.find((p) => !p.turned) || aud[Math.floor(Math.random() * aud.length)];
      if (next && next.react) next.react(true);
    }
  };
  return {
    enter(st) {
      drawStaff(g, a.x, a.y, staffOf(st), null);
      tool.setText(marks(st)).setVisible(true);
      nerve.set(st.nerve / 100).setVisible(def.nerve !== false);
      label.setText(hint(st));
    },
    render(st, outcome) {
      for (const ev of engine.takeEvents()) {
        if (ev.type === 'lead') {
          sfx('crowd_clap');
        } else if (ev.type === 'phrase') {
          if (bandBeatAt !== null && scene.music && !ev.tries) engine.nudge(beatCorrection(scene.time.now - bandBeatAt, 60000 / scene.music.bpm));
          if (!ev.tries && cues.phrase) say(cues.phrase[ev.idx]);
          if (!ev.tries && engine.phrases[ev.idx].third) say(cues.thirdAhead);
        } else if (ev.type === 'preview' || ev.type === 'answer') {
          // Nia's bass comes from the dark, even on a rest; Ray claps; the horn
          // plays the tune Jo is about to answer
          if (ev.voice === 'bass') bassHz(noteHz({ ...key, oct: 0 }, ev.pitch ?? 0), 0.5, 0.3);
          else if (ev.voice === 'clap') {
            // (Ray claps the call, then leaves the bar to Jo)
            if (ev.type === 'preview' && ev.note) sfx('clap');
          } else if (ev.note) trumpetHz(horn(ev.pitch), ev.hold ? (ev.hold * st.beatMs) / 1000 : Math.min(0.3, (st.beatMs / 1000) * 0.8), 0.18);
          else sfx('click');
        } else if (ev.type === 'hit') {
          // right note, right place: the answer is the call
          trumpetHz(horn(ev.pitch), ev.hold ? (st.hold * st.beatMs) / 1000 : Math.min(0.3, (st.beatMs / 1000) * 0.9), 0.3);
          if (scene.player && scene.player.pose) scene.player.pose('play_trumpet');
        } else if (ev.type === 'rest' || (ev.type === 'held' && !ev.ok)) {
          flash = 'bad';
          flashT = scene.time.now;
          sfx('fail');
        } else if (ev.type === 'judge') {
          react(ev.ok);
          if (ev.ok) [7, 9, 11].forEach((d, i) => playTone(horn(d), 0.16, 'triangle', 0.08, i * 0.05));
          if (ev.rushed) say(cues.third);
        } else if (ev.type === 'freeze') {
          cam.shake(220, 0.006);
          sfx('fail');
          // (twice is help; every time is nagging)
          if ((freezesSaid += 1) <= 2) say(cues.freeze);
        } else if (ev.type === 'breath') {
          // between songs: the lights come up, the crowd answers, the camera moves in
          nextSong = songName((ev.song ?? -1) + 1);
          sfx('roar');
          scene.tweens.add({ targets: dimR, alpha: 0.12, duration: 300, yoyo: true, hold: 500 });
          if (scene.camDir) {
            const old = songShot;
            songShot = scene.camDir.push({ zoom: (def.camera?.zoom || 1.2) + 0.09 * ((ev.song ?? 0) + 1), focus: () => ({ x: scene.player.x, y: scene.player.y - 60 }), ms: 900 });
            if (old) scene.camDir.pop(old, 900);
          }
        } else if (ev.type === 'held' && ev.ok) {
          // the last note lands: everything at once
          cam.shake(420, 0.008);
          sfx('roar');
        }
      }
      if (outcome === 'miss' || outcome === 'rest') {
        flash = 'bad';
        flashT = scene.time.now;
      }
      if (flash && scene.time.now - flashT > 220) flash = null;
      drawStaff(g, a.x, a.y, staffOf(st), flash);
      tool.setText(marks(st));
      nerve.set(st.nerve / 100);
      label.setText(hint(st));
      // the blank: the house goes dark and the spot leaves Jo for the bass
      const solo = st.silent && cues.soloist && scene.npcs ? scene.npcs.get(cues.soloist) : null;
      if (solo) spot.setPosition(solo.x, solo.y - 60);
      else spot.setPosition(scene.player.x, scene.player.y - 30);
      // the held note opens the room up as it goes
      spot.setScale(1.6 + (st.hold ? st.heldFrac * 3 : 0), 2.4 + (st.hold ? st.heldFrac * 3 : 0));
      if (!scene.tweens.isTweening(dimR)) {
        if (st.phase === 'frozen' || solo) dimR.setAlpha(0.7);
        else if (st.hold && st.holding) dimR.setAlpha(0.42 * (1 - st.heldFrac));
        else if (st.hold && st.phase === 'judge' && st.lastOk) dimR.setAlpha(0);
        else if (st.phase !== 'lead') dimR.setAlpha(0.42);
      }
    },
    outro(result) {
      return new Promise((res) => {
        if (result && result.ok) {
          try {
            [4, 7, 9, 11].forEach((d, i) => playTone(horn(d), 0.5, 'sine', 0.12, i * 0.12));
          } catch {
            /* no audio */
          }
          const ring = scene.add.circle(a.x, a.y, 60, 0xf6d98a, 0).setStrokeStyle(4, 0xf6d98a, 1).setDepth(40);
          scene.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 800, onComplete: () => ring.destroy() });
        }
        scene.tweens.add({ targets: [dimR, spot], alpha: 0, duration: 600 });
        scene.time.delayedCall(result && result.ok ? 850 : 200, res);
      });
    },
    destroy() {
      g.destroy();
      dimR.destroy();
      spot.destroy();
      scene.events.off('beat', onBandBeat);
      if (songShot && scene.camDir) scene.camDir.pop(songShot, 500);
      tool.setText('').setVisible(false);
      nerve.setVisible(false);
      hud.set('context', '');
    },
  };
}

export const PRESENTERS = {
  clockwork: { world: clockworkWorld, modal: clockworkModal },
  // THE STOPPED HOUR: the third gear, the seven strikes
  escapement: { world: escapementWorld },
  rhythm: { world: rhythmWorld },
  // THE MASTER'S LADDER: grind, drapery, the masterpiece, the giornata
  craft: { world: craftWorld },
  // THE LAST HAND: the gangway slate, the faro bank, SHOWDOWN (src/dreams/gambler/table.js)
  lq_slate: { world: slatePresenter },
  lq_faro: { world: faroPresenter },
  lq_cards: { world: showdownPresenter },
};

export function makePresenter(scene, def, engine, ctx) {
  const set = PRESENTERS[def.view || def.id];
  if (!set) return null;
  const kind = def.presenter === 'modal' ? 'modal' : 'world';
  return (set[kind] || set.world)(scene, def, engine, ctx);
}
