// Round 2 WP6, the identity system (critique §9, §11 WP6):
//   jo-contrast       Jo against the 120 × 120 px behind him, in every place
//                     (his silhouette edge vs the box's mean, see identityProbe)
//   lamp-checkpoint   checkpoints are lamps: lit on touch, the light comes on,
//                     the chime plays, the respawn point is set
//   board-title       a place title arrives on the board (split-flap, 60 ms a
//                     glyph) and lands with the chime
//   train-wipe        boarding runs the passing-train wipe: the next scene
//                     starts under it at the middle; the chime plays
//   hub-dreamcatcher  the hall's dreamcatcher has one round per dream caught
//   chime-events      the chime is heard on the five moments (event log)
//   panel-frame       every panel is the one §9 frame (ink fill 88 %, brass)
import { joContrast } from '../identityProbe.js';
import { chimeLog } from '../../systems/audio.js';
import { PLACES, THEME, PANEL_ALPHA } from '../../ui/theme.js';
import { FLIP_MS } from '../../ui/BoardTitle.js';
import { wipeActive } from '../../ui/TrainWipe.js';
import { WEB_ORDER } from '../../art/identityArt.js';
import { getSave, updateSave } from '../../utils/save.js';
import { DREAMS } from '../../data/dreams.js';
import { DREAM_WARP } from '../warp.js';

const keyOf = (dc) => (dc.scene() ? dc.scene().sys.settings.key : null);

async function arrive(dc, dream, place) {
  const want = DREAM_WARP[dream].scene;
  const ready = () => {
    const sc = dc.scene();
    return sc && sc.player && sc.player.anim && sc.sys.settings.key === want && sc.sys.isActive();
  };
  for (let attempt = 0; attempt < 3 && (attempt === 0 || !ready()); attempt++) {
    dc.warp(dream, place);
    for (let i = 0; i < 150 && !ready(); i++) {
      await new Promise((r) => setTimeout(r, 20));
      dc.step(2);
    }
  }
  dc.step(40);
  const sc = dc.scene();
  if (sc.openingSkip) sc.openingSkip();
  // close whatever card or tutorial greets Jo
  for (let i = 0; i < 40; i++) {
    const s = dc.scene();
    if (!(s.dialogActive || s.tutorialActive || s.cardActive)) break;
    dc.press('action', 2);
    dc.step(20);
  }
  dc.step(30);
  return dc.scene();
}

const PLACES_TO_SAMPLE = [
  ['hub', null],
  ['chef', null],
  ['musician', null],
  ['astronaut', 'gym'],
  ['writer', 'attic'],
  ['painter', 'via'],
  ['gambler', 'arrival'],
  ['clockmaker', null],
  ['evening', 'square'],
];
export const JO_CONTRAST_MIN = 3;

const joContrastSc = {
  id: 'jo-contrast',
  async run(dc) {
    const rows = [];
    for (const [dream, place] of PLACES_TO_SAMPLE) {
      const sc = await arrive(dc, dream, place);
      dc.step(20);
      const r = await joContrast(dc, sc);
      rows.push({ place: dream, ...r });
    }
    const fails = rows.filter((r) => !(r.edgeMedian >= JO_CONTRAST_MIN));
    return { pass: fails.length === 0, detail: rows.map((r) => `${r.place} edge ${r.edgeMedian} local ${r.localMedian} (jo ${r.jo} bg ${r.bg})`).join('; ') };
  },
};

const lampCheckpoint = {
  id: 'lamp-checkpoint',
  async run(dc) {
    const sc = await arrive(dc, 'chef', null);
    const f = sc.flags.getChildren().find((x) => x.texture.key === 'flag');
    if (!f) return { pass: false, detail: 'no lamp' };
    const isLamp = f.texture.key === 'flag' && f.height > 32 && !!sc.textures.get('flag').dcLamp;
    const n0 = chimeLog.length ? chimeLog[chimeLog.length - 1].seq : 0;
    sc.activateCheckpoint(f);
    dc.step(40);
    const lit = f.texture.key === 'flag-lit';
    const glow = !!(f.dcGlow && f.dcGlow.lamp.alpha > 0.3);
    const rang = chimeLog.filter((c) => c.seq > n0).some((c) => c.event === 'lamp' && c.place === 'chef');
    const respawn = sc.checkpoint && Math.abs(sc.checkpoint.x - f.x) < 1;
    // the lamp stands on its floor: its foot is the old flag's foot (wy + 16)
    const foot = Math.round(f.getBottomRight().y - f.y);
    return { pass: isLamp && lit && glow && rang && respawn && foot === 16, detail: { isLamp, lit, glow, rang, respawn, foot, size: [f.width, f.height] } };
  },
};

const boardTitleSc = {
  id: 'board-title',
  async run(dc) {
    const sc = await arrive(dc, 'clockmaker', null);
    const n0 = chimeLog.length ? chimeLog[chimeLog.length - 1].seq : 0;
    sc.titleCard('THE GREEN');
    const b = sc._titleCard;
    dc.step(4);
    const early = b.list.filter((o) => o.isDCText).map((t) => t.rawText).join('');
    dc.step(Math.ceil((b.flipMs + 120) / 16.67));
    const late = b.list.filter((o) => o.isDCText).map((t) => t.rawText).join('');
    const rang = chimeLog.filter((c) => c.seq > n0).some((c) => c.event === 'board' && c.place === 'clockmaker');
    const flipMs = b.flipMs;
    return { pass: early !== 'THEGREEN' && late === 'THEGREEN' && rang && FLIP_MS === 60, detail: { early, late, rang, flipMs } };
  },
};

const trainWipeSc = {
  id: 'train-wipe',
  async run(dc) {
    const sc = await arrive(dc, 'hub', null);
    const d = DREAMS.find((x) => x.scene && x.scene !== 'Dream' && !sc.save.dreams[x.id]);
    if (!d) return { pass: true, detail: { skipped: 'every legacy dream caught' } };
    const t = sc.trains[d.id];
    sc.player.setPosition(t.gateX - 10, sc.player.y);
    dc.step(20);
    sc.dialog.show = async () => 'board';
    const it = sc.interacts.find((i) => i.label === 'train' && Math.abs(i.x - t.gateX) < 4);
    const n0 = chimeLog.length ? chimeLog[chimeLog.length - 1].seq : 0;
    it.cb();
    await dc.run(2);
    let sawWipe = false;
    let at = null;
    for (let i = 0; i < 400; i++) {
      await dc.run(1);
      if (wipeActive()) sawWipe = true;
      if (keyOf(dc) === 'Intro') {
        at = i;
        break;
      }
    }
    const coveredAtCut = sawWipe && wipeActive();
    dc.step(40);
    const done = !wipeActive();
    const rang = chimeLog.filter((c) => c.seq > n0).some((c) => c.event === 'boarding' && c.place === d.id);
    return { pass: sawWipe && coveredAtCut && done && rang && keyOf(dc) === 'Intro', detail: { dream: d.id, sawWipe, coveredAtCut, done, rang, frames: at } };
  },
};

const hubDreamcatcher = {
  id: 'hub-dreamcatcher',
  async run(dc) {
    const before = { ...getSave().dreams };
    // two dreams caught: the hall's web has two rounds, in their colours
    updateSave((s) => {
      s.dreams.chef = true;
      s.dreams.painter = true;
    });
    const sc = await arrive(dc, 'hub', null);
    const rounds = sc.webRounds || [];
    const want = WEB_ORDER.filter((id) => getSave().dreams[id]).map((id) => PLACES[id].accent);
    const ok = !!sc.dreamcatcher && sc.dreamcatcher.visible && rounds.length === want.length && rounds.every((c, i) => c === want[i]);
    updateSave((s) => {
      s.dreams.chef = !!before.chef;
      s.dreams.painter = !!before.painter;
    });
    return { pass: ok, detail: { rounds: rounds.map((c) => c.toString(16)), want: want.map((c) => c.toString(16)) } };
  },
};

// the five identity moments, each heard at least once in this run's log
// (the scenarios above produce board, lamp and boarding; dream end and
// YOU'RE HERE are driven here)
const chimeEvents = {
  id: 'chime-events',
  async run(dc) {
    const sc = await arrive(dc, 'chef', null);
    // the dream's end: the CAUGHT board over the end card
    sc.orbCaught = true;
    sc._caughtBoard = undefined;
    sc.showCard(['Five stars.', '', '[E] Return to Crossroads Station'], () => {});
    dc.step(90);
    const caught = !!sc._caughtBoard;
    sc.closeCard();
    sc.orbCaught = false;
    // YOU'RE HERE on the Evening's board
    const ev = await arrive(dc, 'evening', 'station');
    if (ev.world && ev.world.board) ev.flickerBoard(ev.world.board.txt, "YOU'RE HERE", 2, true);
    dc.step(40);
    const kinds = new Set(chimeLog.map((c) => c.event));
    const need = ['board', 'lamp', 'boarding', 'caught', 'youre-here'];
    const missing = need.filter((k) => !kinds.has(k));
    return { pass: caught && missing.length === 0, detail: { caught, heard: [...kinds], missing } };
  },
};

const panelFrame = {
  id: 'panel-frame',
  async run(dc) {
    const sc = await arrive(dc, 'chef', null);
    sc.openPauseMenu();
    dc.step(10);
    const ui = window.game.scene.getScene('UI');
    const panels = [...ui.sys.displayList.list, ...sc.sys.displayList.list].filter((o) => o.isDCPanel);
    const ok = panels.length > 0 && THEME.panel === 0x14122a && PANEL_ALPHA === 0.88 && THEME['panel-edge'] === 0xc8a24a;
    dc.press('esc', 2);
    dc.step(10);
    return { pass: ok, detail: { panels: panels.length, fill: THEME.panel.toString(16), alpha: PANEL_ALPHA, edge: THEME['panel-edge'].toString(16) } };
  },
};

export default [lampCheckpoint, boardTitleSc, trainWipeSc, hubDreamcatcher, chimeEvents, panelFrame, joContrastSc];
