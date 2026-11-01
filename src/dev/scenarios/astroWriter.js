// The Astronaut and Writer fixes that no other scenario walks through, by real keys:
//   astro-first-board  a trained player who passes still gets the letter, [E]
//                      mashed through the verdict opens nothing, the grey year
//                      lifts at selection
//   astro-priya-carry  caught carrying her: she lies in the crater again, and
//                      she can be gone back for and reeled out
//   writer-pen-gates   the pen never opens on the answer, a wrong word costs ink
//                      and does not take; pages 10 / 25 / 50; a desk can be redrafted
//   writer-press-route INK, then off web 1's end onto web 2 and PRESS, ahead of the Editor
import { BOARD_QUESTIONS } from '../../data/astronautData.js';

const T = 32;

function settle(dc) {
  for (let i = 0; i < 40; i++) {
    const s = dc.scene();
    if (!(s.dialogActive || s.tutorialActive || s.cardActive)) break;
    dc.press('action', 2);
    dc.step(20);
  }
  dc.step(3);
}

// (screen text lives on UIScene)
function texts(re) {
  const out = [];
  const walk = (list) => {
    for (const o of list) {
      if (o.list) walk(o.list);
      if (typeof o.text === 'string' && o.visible && o.alpha > 0.05 && re.test(o.text)) out.push(o.text);
    }
  };
  for (const sc of window.game.scene.getScenes(true)) walk(sc.children.list);
  return out;
}

const to = async (dc, p, x, y, frames = 15) => {
  p.body.reset(x, y);
  await dc.run(frames);
  settle(dc);
};

const norm = (t) => t.toLowerCase().replace(/\s+/g, ' ');

// answer every question on the panel, then the seventh's first choice
async function passBoard(dc, s) {
  for (let i = 0; i < 12 && s.puzzleActive; i++) {
    const q = texts(/^\d\/7/)[0];
    if (!q) break;
    const a = norm(BOARD_QUESTIONS[+q[0] - 1].a);
    const k = [1, 2, 3, 4].findIndex((n) => norm(texts(new RegExp(`^\\[${n}\\]`))[0] || '').includes(a));
    dc.press(`Digit${k + 1}`, 2);
    await dc.run(6);
  }
  await dc.run(30);
  dc.press('action', 2); // the question's text, typed out
  await dc.run(40);
  dc.press('Enter', 2);
  await dc.run(40);
}

async function talk(dc, s) {
  for (let i = 0; i < 12 && s.dialogActive; i++) {
    await dc.run(100);
    dc.press('action', 2);
    await dc.run(12);
  }
}

const firstBoard = {
  id: 'astro-first-board',
  async run(dc) {
    dc.warp('astronaut', 'gate');
    await dc.run(20);
    settle(dc);
    const s = dc.scene();
    const fails = [];
    if (!s.statsReady()) fails.push('warp is not trained');
    const door = s.obj('board_door');
    await to(dc, s.player, door.wx - 10, door.wy - 4);
    dc.press('KeyE');
    await dc.run(10);
    await passBoard(dc, s);
    await talk(dc, s); // "Noted." ends at the verdict
    let opened = 0;
    for (let i = 0; i < 180 && !s.dialogActive; i++) {
      if (i % 6 === 0) dc.press('KeyE', 1);
      await dc.run(1);
      if (s.puzzleActive) opened += 1;
    }
    if (opened) fails.push('[E] opened the Board in the verdict');
    if (!s.F.rejected) fails.push('a trained player who passed was not rejected');
    if (s.F.selected) fails.push('selected at the first attempt');
    await talk(dc, s);
    for (let i = 0; i < 80 && !s.dialogActive; i++) {
      if (i % 6 === 0) dc.press('KeyE', 1);
      await dc.run(1);
      if (s.puzzleActive) opened += 1;
    }
    if (opened) fails.push('[E] opened the Board in the fade');
    await talk(dc, s);
    await dc.run(10);
    if (!s.greyYear) fails.push('no grey year');
    if (s.boarding) fails.push('the door stayed locked');
    await to(dc, s.player, door.wx - 10, door.wy - 4);
    dc.press('KeyE');
    await dc.run(10);
    await passBoard(dc, s);
    await talk(dc, s);
    if (!s.F.selected) fails.push('not selected at the second attempt');
    await dc.run(130);
    const grey = s.children.list.filter((o) => o.fillColor === 0x50525e && o.width === s.cameras.main.width);
    if (grey.length || s.greyYear) fails.push('the grey year did not lift');
    return { pass: !fails.length, detail: fails.join('; ') || 'letter, locked verdict, second Board, grey gone' };
  },
};

const priya = {
  id: 'astro-priya-carry',
  async run(dc) {
    dc.warp('astronaut', 'crater');
    await dc.run(20);
    settle(dc);
    const s = dc.scene();
    const p = s.player;
    const fails = [];
    s.alarmOn = true; // the warp sets rescue_on, which startRescue would have done
    s.activateCheckpoint(s.flags.getChildren().find((f) => f.cpId === 'CP5c'));
    await dc.run(5);
    settle(dc);
    const pd = s.obj('priya_down');
    const take = async (n) => {
      await to(dc, p, pd.wx - 10, pd.wy - 10, 20);
      if (!s.priyaDown.visible) fails.push(`${n}: she is not there`);
      if (!/Priya/.test(s.promptText.visible ? s.promptText.text : '')) fails.push(`${n}: no prompt`);
      dc.press('KeyE');
      await dc.run(6);
      if (!s.carryingPriya || s.priyaDown.visible) fails.push(`${n}: not picked up`);
      if (/go back/.test(s.objectiveText.text)) fails.push(`${n}: objective still says go back`);
    };
    await take('first');
    s.respawnAtCheckpoint();
    await dc.run(20);
    settle(dc);
    if (s.carryingPriya || !s.priyaDown.visible) fails.push('she did not go back to the crater');
    if (!/go back for her/.test(s.objectiveText.text)) fails.push(`objective after the catch: ${s.objectiveText.text}`);
    await take('again');
    dc.press('KeyF', 2);
    await dc.run(10);
    if (s.alarmOn) fails.push('[F] did not fix the alarm');
    // a catch during the reel plays no rim scene and leaves gravity on
    await to(dc, p, 459.5 * T, 50 * T, 2);
    dc.hold('KeyF');
    await dc.run(30);
    if (!s.reeling) fails.push('the winch did not reel');
    s.respawnAtCheckpoint();
    await dc.run(40);
    dc.release('KeyF');
    if (s.reeling || !p.body.allowGravity || s.F.priya_safe) fails.push('a catch did not end the reel');
    await take('third');
    await to(dc, p, 459.5 * T, 50 * T, 2);
    dc.hold('KeyF');
    for (let i = 0; i < 900 && !s.F.priya_safe; i++) await dc.run(1);
    dc.release('KeyF');
    if (!s.F.priya_safe) fails.push('the reel did not reach the rim');
    return { pass: !fails.length, detail: fails.join('; ') || 'caught, went back, reeled out' };
  },
};

const penGates = {
  id: 'writer-pen-gates',
  async run(dc) {
    dc.warp('writer', 'attic');
    await dc.run(30);
    settle(dc);
    const s = dc.scene();
    const fails = [];
    s.words.push('working', 'light');
    s.updateSatchel();
    s.player.setPosition(37 * T + 16, 20 * T + 6);
    s.player.body.reset(s.player.x, s.player.y);
    await dc.run(20);
    settle(dc);
    const choice = () => texts(/◂/)[0] || '';
    const l = s.labels.get('typewriter');
    dc.press('KeyE');
    await dc.run(3);
    if (/working/.test(choice())) fails.push('the pen opened on the answer');
    const ink = s.ink;
    dc.press('Enter');
    await dc.run(10);
    if (s.ink !== ink - 1) fails.push('a wrong word cost no ink');
    if (!texts(/still jammed/).length) fails.push('a wrong word had no line');
    await dc.run(100);
    if (l.adj !== 'jammed' || l.adjText.text !== 'jammed') fails.push('a wrong word took');
    dc.press('KeyE');
    await dc.run(3);
    dc.press('ArrowLeft');
    await dc.run(2);
    dc.press('Enter');
    await dc.run(60);
    if (l.adj !== 'working') fails.push('the right word did not take');
    // a whole desk, no key pressed, then a redraft, every word hit
    dc.press('KeyE');
    await dc.run(3);
    settle(dc);
    const sit = async (hit) => {
      const t = s.typing;
      if (!t) return fails.push('the desk did not open');
      const done = new Set();
      for (let i = 0; i < 2000 && s.typing === t; i++) {
        for (const w of t.letters) {
          if (hit && !w.judged && !done.has(w) && Math.abs(s.time.now - w.hitAt) < 30) {
            done.add(w);
            dc.press(`Key${w.ch.toUpperCase()}`, 1);
          }
        }
        await dc.run(1);
      }
      return null;
    };
    await sit(false);
    await dc.run(5);
    const desk = s.desks.find((d) => d.id === 'desk1');
    if (s.pages !== 3 || s.typos !== 3 || desk.done) fails.push(`no hits: ${s.pages} pages, ${s.typos} typos, done ${desk.done}`);
    if (!texts(/0\/20 clean\. 20 typos/).length) fails.push('no desk line');
    if (!/redraft/.test(desk.interact.label)) fails.push('no redraft offered');
    await dc.run(200);
    settle(dc);
    dc.press('KeyE');
    await dc.run(3);
    settle(dc);
    await sit(true);
    await dc.run(5);
    if (s.pages !== 4 || !desk.done) fails.push(`the redraft: ${s.pages} pages, done ${desk.done}`);
    for (const [flag, need] of [['pages12', 10], ['pages30', 25], ['pages60', 50]]) {
      s.addPages(need - 1 - s.pages);
      if (s.F[flag]) fails.push(`${flag} open at ${need - 1}`);
      s.addPages(1);
      if (!s.F[flag]) fails.push(`${flag} shut at ${need}`);
    }
    return { pass: !fails.length, detail: fails.join('; ') || 'pen, line, ink, desk line, redraft, 10/25/50' };
  },
};

const pressRoute = {
  id: 'writer-press-route',
  async run(dc) {
    dc.warp('writer', 'press');
    await dc.run(10);
    settle(dc);
    const s = dc.scene();
    const p = s.player;
    const ed = s.editors.find((e) => e.room === 'press');
    const fails = [];
    // the floor past its mark, with nothing fed, wakes nothing
    await to(dc, p, 562 * T, 33 * T, 15);
    if (ed.started) fails.push('the Editor started before the feed');
    await to(dc, p, 557.5 * T, 16 * T, 10);
    const walk = async (key, cond, max = 400) => {
      dc.hold(key);
      for (let i = 0; i < max && !cond(); i++) {
        await dc.run(1);
        if (s.tutorialActive) {
          dc.releaseAll();
          settle(dc);
          dc.hold(key);
        }
      }
      dc.release(key);
      await dc.run(1);
    };
    await walk('right', () => p.x >= 566 * T);
    if (!s.fed || !ed.started) fails.push(`fed ${s.fed}, Editor started ${ed.started}`);
    dc.press('KeyE');
    await dc.run(2);
    s.lives = 3; // the rollers are timing, not what this checks
    await walk('right', () => p.y > 19 * T, 900); // off the end of web 1, right held all the way
    dc.hold('right');
    for (let i = 0; i < 120 && !p.body.blocked.down; i++) await dc.run(1);
    dc.release('right');
    if (Math.abs(p.y - 22.3 * T) > T) fails.push(`landed at row ${(p.y / T).toFixed(1)}, not on web 2`);
    await walk(p.x > 584.5 * T ? 'left' : 'right', () => Math.abs(p.x - 584.5 * T) < 16, 200);
    if (s.blanking) fails.push('caught before PRESS');
    const lead = Math.round(p.x - ed.x);
    dc.press('KeyE');
    await dc.run(2);
    if (s.leversPulled.length !== 2 || !ed.done) fails.push(`levers ${s.leversPulled}, Editor done ${ed.done}`);
    if (s.erased.length) fails.push('the floor it took did not come back');
    // on to FOLD: right held off web 2 stops at the frame and lands on web 3, not the floor past it
    await walk('right', () => p.y > 25 * T, 700);
    dc.hold('right');
    for (let i = 0; i < 120 && !p.body.blocked.down; i++) await dc.run(1);
    dc.release('right');
    if (Math.abs(p.y - 27.3 * T) > T) fails.push(`off web 2 landed at row ${(p.y / T).toFixed(1)}, not on web 3`);
    return { pass: !fails.length, detail: fails.join('; ') || `PRESS pulled ${lead} px ahead of the Editor` };
  },
};

export default [firstBoard, priya, penGates, pressRoute];
