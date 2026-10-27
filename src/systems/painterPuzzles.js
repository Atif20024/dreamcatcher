import Phaser from 'phaser';
import { Modal } from './puzzles.js';
import { sfx } from './audio.js';
import { PIGMENTS, areComplements, complementOf } from './paint.js';
import { mix } from '../art/paint.js';

// THE YELLOW HOUSE §7 — the puzzle-boxes. All keyboard, all modal.
const HEX = (c) => `#${(c >>> 0).toString(16).padStart(6, '0')}`;
const swatch = (m, scene, x, y, w, h, colour) => m.add(scene.add.rectangle(x, y, w, h, colour).setScrollFactor(0).setDepth(m.depth + 1).setStrokeStyle(2, 0x1f3a5f));

// P1 — THE PALETTE: three target swatches; mix parts of yellow, blue and red
// in proportion. Two parts yellow to one blue is a different green than one
// to one. Three pigments at once is mud.
const TARGETS = [
  { name: 'a spring green', parts: { yellow: 2, blue: 1 } },
  { name: 'a sun orange', parts: { red: 1, yellow: 1 } },
  { name: 'an iris violet', parts: { blue: 1, red: 2 } },
];
function mixedHex(parts) {
  const n = parts.yellow + parts.blue + parts.red;
  if (!n) return 0x8a7a68;
  let r = 0, g = 0, b = 0;
  for (const [k, v] of Object.entries(parts)) {
    const c = PIGMENTS[k].hex;
    r += ((c >> 16) & 255) * v;
    g += ((c >> 8) & 255) * v;
    b += (c & 255) * v;
  }
  const out = (Math.round(r / n) << 16) | (Math.round(g / n) << 8) | Math.round(b / n);
  const used = Object.values(parts).filter((v) => v > 0).length;
  return used === 3 ? mix(out, 0x6b4e2e, 0.6) : out; // mud
}
function sameRatio(a, b) {
  const ka = Object.keys(a).filter((k) => a[k] > 0).sort();
  const kb = Object.keys(b).filter((k) => b[k] > 0).sort();
  if (ka.join() !== kb.join() || ka.length !== 2) return false;
  return a[ka[0]] * b[ka[1]] === a[ka[1]] * b[ka[0]];
}
export function palette(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'THE PALETTE', 'Isak\'s note: "you never get it right; too much blue." Three targets.\n←/→ pick a target · [Y] [B] [R] add a part · [Backspace] wipe · [Enter] compare');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 20;
    let cur = 0;
    const mixes = TARGETS.map(() => ({ yellow: 0, blue: 0, red: 0 }));
    const cols = TARGETS.map((t, i) => {
      const x = cx - 180 + i * 180;
      m.text(x, cy - 80, t.name, 12, '#c8c0b0');
      const target = swatch(m, scene, x, cy - 40, 90, 40, mixedHex(t.parts));
      const mine = swatch(m, scene, x, cy + 20, 90, 40, 0x8a7a68);
      const parts = m.text(x, cy + 58, '', 11, '#e8dcc8');
      const box = m.add(scene.add.rectangle(x, cy - 10, 120, 150, 0x000000, 0).setScrollFactor(0).setDepth(m.depth + 1).setStrokeStyle(2, 0x4a4458));
      return { target, mine, parts, box };
    });
    const status = m.text(cx, cy + 110, '', 13, '#c8c0b0');
    const render = () => {
      cols.forEach((c, i) => {
        const p = mixes[i];
        c.mine.setFillStyle(mixedHex(p));
        const used = Object.values(p).filter((v) => v > 0).length;
        c.parts.setText(used === 3 ? "that's mud." : `Y ${p.yellow}  B ${p.blue}  R ${p.red}`);
        c.parts.setColor(used === 3 ? '#e86a6a' : '#e8dcc8');
        c.box.setStrokeStyle(2, i === cur ? 0xf2d580 : 0x4a4458);
      });
    };
    render();
    m.listen((code) => {
      const p = mixes[cur];
      if (code === 'ArrowLeft') cur = (cur + 2) % 3;
      else if (code === 'ArrowRight') cur = (cur + 1) % 3;
      else if (code === 'KeyY' || code === 'KeyB' || code === 'KeyR') {
        const k = { KeyY: 'yellow', KeyB: 'blue', KeyR: 'red' }[code];
        if (p.yellow + p.blue + p.red >= 5) {
          status.setText('the well is full. wipe it.');
          sfx('fail');
        } else p[k] += 1;
        if (Object.values(p).filter((v) => v > 0).length === 3) {
          sfx('fail');
          status.setText("that's mud. the board is wiped.");
          scene.time.delayedCall(600, () => {
            mixes[cur] = { yellow: 0, blue: 0, red: 0 };
            render();
          });
        }
      } else if (code === 'Backspace') mixes[cur] = { yellow: 0, blue: 0, red: 0 };
      else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        const ok = TARGETS.map((t, i) => sameRatio(t.parts, mixes[i]));
        if (ok.every(Boolean)) {
          sfx('chime');
          status.setText('three greens, three oranges, three violets. he can mix.').setColor('#7ec87e');
          scene.time.delayedCall(900, () => m.close(true, resolve));
          return;
        }
        sfx('fail');
        const bad = ok.findIndex((v) => !v);
        status.setText(`${TARGETS[bad].name}: not that. (count the parts)`).setColor('#e86a6a');
        scene.time.delayedCall(1200, () => status.setColor('#c8c0b0'));
      }
      sfx('click');
      render();
    }, resolve);
  });
}

// P2 — THE HOUR: a sundial. Set the hour at which three subjects all have
// their colour at once. The shadow moves.
export function hour(scene, subjects) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'THE HOUR', 'The sundial on the hill. Three subjects, three windows of light.\n←/→ turn the hour · [Enter] set up the easel');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 30;
    let h = 7;
    m.add(scene.add.circle(cx - 200, cy, 60, 0xc8c0b0).setScrollFactor(0).setDepth(m.depth + 1).setStrokeStyle(2, 0x1f3a5f));
    const gnomon = m.add(scene.add.rectangle(cx - 200, cy, 4, 56, 0x5b3a7a).setOrigin(0.5, 1).setScrollFactor(0).setDepth(m.depth + 2));
    const hourText = m.text(cx - 200, cy + 80, '', 18, '#f2d580');
    const rows = subjects.map((s, i) => {
      const y = cy - 50 + i * 44;
      const name = m.text(cx + 60, y - 14, s.title, 12, '#e8dcc8');
      const bar = m.add(scene.add.rectangle(cx + 60, y + 6, 300, 10, 0x2a2a34).setScrollFactor(0).setDepth(m.depth + 1));
      const win = m.add(scene.add.rectangle(cx + 60 - 150 + ((s.hour[0] - 6) / 16) * 300, y + 6, ((s.hour[1] - s.hour[0]) / 16) * 300, 10, 0x3a6a3a).setOrigin(0, 0.5).setScrollFactor(0).setDepth(m.depth + 1));
      const mark = m.add(scene.add.rectangle(cx + 60 - 150, y + 6, 4, 18, 0xf2d580).setScrollFactor(0).setDepth(m.depth + 2));
      return { name, bar, win, mark, s };
    });
    const status = m.text(cx, cy + 130, '', 13, '#c8c0b0');
    const render = () => {
      gnomon.setAngle(((h - 6) / 16) * 180 - 90);
      hourText.setText(`${h}:00`);
      rows.forEach((r) => {
        r.mark.x = cx + 60 - 150 + ((h - 6) / 16) * 300;
        const ok = h >= r.s.hour[0] && h <= r.s.hour[1];
        r.name.setColor(ok ? '#7ec87e' : '#e8dcc8');
      });
    };
    render();
    m.listen((code) => {
      if (code === 'ArrowLeft') h = Math.max(6, h - 1);
      else if (code === 'ArrowRight') h = Math.min(22, h + 1);
      else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        if (rows.every((r) => h >= r.s.hour[0] && h <= r.s.hour[1])) {
          sfx('chime');
          status.setText(`${h}:00. all three, at once.`).setColor('#7ec87e');
          scene.time.delayedCall(800, () => m.close(h, resolve));
          return;
        }
        sfx('fail');
        status.setText('one of them is in the dark at that hour.');
      }
      sfx('click');
      render();
    }, resolve);
  });
}

// P3 — VIBRATO: six tiles into the cells so every shared edge is a
// complementary pair. Three fixed tiles; three groups.
const CELLS = [
  { id: 0, x: -200, y: -40, fixed: 'yellow' }, { id: 1, x: -140, y: -40 }, { id: 2, x: -80, y: -40 },
  { id: 3, x: 40, y: -40, fixed: 'blue' }, { id: 4, x: 100, y: -40 }, { id: 5, x: 40, y: 20 },
  { id: 6, x: -140, y: 60 }, { id: 7, x: -80, y: 60, fixed: 'red' }, { id: 8, x: -20, y: 60 },
];
const EDGES = [[0, 1], [1, 2], [3, 4], [3, 5], [6, 7], [7, 8]];
export function vibrato(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'VIBRATO', 'Every shared edge must be a complementary pair, or it will not sing.\n←/→ choose a cell · ↑/↓ try a tile from the hand · [Enter] listen');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 20;
    const hand = ['violet', 'yellow', 'orange', 'orange', 'green', 'green'];
    const placed = {};
    const open = CELLS.filter((c) => !c.fixed).map((c) => c.id);
    let cur = 0;
    for (const [a, b] of EDGES) {
      const A = CELLS[a], B = CELLS[b];
      m.add(scene.add.line(0, 0, cx + A.x, cy + A.y, cx + B.x, cy + B.y, 0x4a4458).setOrigin(0).setScrollFactor(0).setDepth(m.depth + 1).setLineWidth(3));
    }
    const edgeMarks = EDGES.map(([a, b]) => {
      const A = CELLS[a], B = CELLS[b];
      return m.add(scene.add.circle(cx + (A.x + B.x) / 2, cy + (A.y + B.y) / 2, 5, 0xe86a6a).setScrollFactor(0).setDepth(m.depth + 3).setVisible(false));
    });
    const boxes = CELLS.map((c) => swatch(m, scene, cx + c.x, cy + c.y, 44, 44, c.fixed ? PIGMENTS[c.fixed].hex : 0x2a2a34));
    const handText = m.text(cx + 160, cy + 20, '', 12, '#c8c0b0');
    const status = m.text(cx, cy + 130, '', 13, '#c8c0b0');
    const remaining = () => {
      const left = [...hand];
      for (const v of Object.values(placed)) {
        const i = left.indexOf(v);
        if (i >= 0) left.splice(i, 1);
      }
      return left;
    };
    const render = () => {
      CELLS.forEach((c, i) => {
        const col = c.fixed || placed[c.id];
        boxes[i].setFillStyle(col ? PIGMENTS[col].hex : 0x2a2a34);
        boxes[i].setStrokeStyle(open[cur] === c.id ? 3 : 2, open[cur] === c.id ? 0xf2d580 : 0x1f3a5f);
      });
      EDGES.forEach(([a, b], i) => {
        const ca = CELLS[a].fixed || placed[a];
        const cb = CELLS[b].fixed || placed[b];
        edgeMarks[i].setVisible(!!ca && !!cb && !areComplements(ca, cb));
      });
      handText.setText(`in hand:\n${remaining().join('\n') || '—'}`);
    };
    render();
    m.listen((code) => {
      const id = open[cur];
      if (code === 'ArrowLeft') cur = (cur + open.length - 1) % open.length;
      else if (code === 'ArrowRight') cur = (cur + 1) % open.length;
      else if (code === 'ArrowUp' || code === 'ArrowDown') {
        const left = remaining();
        const pool = placed[id] ? [placed[id], ...left] : [null, ...left];
        const uniq = [...new Set(pool)];
        const i = uniq.indexOf(placed[id] || null);
        const next = uniq[(i + (code === 'ArrowUp' ? 1 : uniq.length - 1)) % uniq.length];
        if (next) placed[id] = next;
        else delete placed[id];
      } else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        const full = open.every((i) => placed[i]);
        const bad = EDGES.some(([a, b]) => !areComplements(CELLS[a].fixed || placed[a], CELLS[b].fixed || placed[b]));
        if (full && !bad) {
          sfx('chime');
          status.setText('the whole terrace sings.').setColor('#7ec87e');
          scene.time.delayedCall(900, () => m.close(true, resolve));
          return;
        }
        sfx('fail');
        status.setText(full ? 'a red edge hums wrong.' : 'every cell wants a tile.');
      }
      sfx('click');
      render();
    }, resolve);
  });
}

// P4 — THE SAME CHAIR: paint Jo's chair cell by cell; Paul's fills itself one
// step "better". Then AGREE or DISAGREE.
const CHAIR_CELLS = [[0, 1], [1, 0], [1, 1], [2, 0], [2, 2]]; // back, seat, seat, leg, leg
export function sameChair(scene, available) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'THE SAME CHAIR', 'Two easels, one chair. Paint yours; his paints itself.\n←/→ a part of the chair · [1] [2] [3] a well · then AGREE or DISAGREE');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 20;
    const wells = available.length ? available : ['yellow', 'blue', 'red'];
    const better = (c) => ({ yellow: 'orange', blue: 'violet', red: 'orange', green: 'blue', orange: 'red', violet: 'blue', white: 'yellow' }[c] || 'orange');
    const jo = {};
    const paul = {};
    let cur = 0;
    let phase = 'paint';
    let choice = 1;
    const size = 40;
    const grid = (ox, who) =>
      CHAIR_CELLS.map(([r, c]) => swatch(m, scene, cx + ox + (c - 1) * size, cy - 20 + (r - 1) * size, size - 6, size - 6, 0x2a2a34).setData('who', who));
    m.text(cx - 160, cy - 100, "JO'S", 14, '#f2d580');
    m.text(cx + 160, cy - 100, "PAUL'S", 14, '#e86a6a');
    const joCells = grid(-160, 'jo');
    const paulCells = grid(160, 'paul');
    const wellText = m.text(cx, cy - 100, wells.map((w, i) => `[${i + 1}] ${w}`).join('   '), 12, '#c8c0b0');
    const agree = m.text(cx - 90, cy + 90, 'AGREE', 18, '#6a6478');
    const disagree = m.text(cx + 90, cy + 90, 'DISAGREE', 18, '#6a6478');
    const status = m.text(cx, cy + 130, '', 12, '#c8c0b0');
    const render = () => {
      CHAIR_CELLS.forEach((_, i) => {
        joCells[i].setFillStyle(jo[i] ? PIGMENTS[jo[i]].hex : 0x2a2a34).setStrokeStyle(phase === 'paint' && i === cur ? 3 : 2, phase === 'paint' && i === cur ? 0xf2d580 : 0x1f3a5f);
        paulCells[i].setFillStyle(paul[i] ? PIGMENTS[paul[i]].hex : 0x2a2a34);
      });
      const done = CHAIR_CELLS.every((_, i) => jo[i]);
      agree.setColor(phase === 'choose' ? (choice === 0 ? '#f2d580' : '#6a6478') : '#2a2a34');
      disagree.setColor(phase === 'choose' ? (choice === 1 ? '#f2d580' : '#6a6478') : '#2a2a34');
      if (phase === 'paint') status.setText(done ? 'his is more decided. (press Enter)' : `${Object.keys(jo).length}/5 — his is always one step ahead.`);
      else status.setText(choice === 0 ? "agree: his chair goes on your easel. he stays a day." : "disagree: the argument. he leaves tonight.");
    };
    render();
    m.listen((code) => {
      if (phase === 'paint') {
        if (code === 'ArrowLeft') cur = (cur + 4) % 5;
        else if (code === 'ArrowRight') cur = (cur + 1) % 5;
        else if (code === 'Digit1' || code === 'Digit2' || code === 'Digit3') {
          const w = wells[Number(code.slice(-1)) - 1];
          if (w) {
            jo[cur] = w;
            paul[cur] = better(w);
            sfx('squish');
            cur = (cur + 1) % 5;
          }
        } else if ((code === 'Enter' || code === 'KeyE' || code === 'Space') && CHAIR_CELLS.every((_, i) => jo[i])) {
          phase = 'choose';
          sfx('clack');
        }
      } else {
        if (code === 'ArrowLeft' || code === 'ArrowRight') choice = 1 - choice;
        else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
          sfx(choice ? 'fail' : 'chime');
          m.close({ choice: choice ? 'disagreed' : 'agreed', jo: { ...jo }, paul: { ...paul } }, resolve);
          return;
        }
      }
      sfx('click');
      render();
    }, resolve);
  });
}

// P5 — WHAT THE TREE IS: four colours; any answer is the answer.
export function tree(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'WHAT THE TREE IS', "Dr. Rey's question. The tree in the yard, underpainted. Paint it.\n←/→ a colour · [Enter] that one");
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 20;
    const opts = ['green', 'blue', 'violet', 'orange'];
    let cur = 0;
    const boxes = opts.map((c, i) => swatch(m, scene, cx - 150 + i * 100, cy - 10, 70, 90, PIGMENTS[c].hex));
    const labels = opts.map((c, i) => m.text(cx - 150 + i * 100, cy + 60, c, 12, '#c8c0b0'));
    const status = m.text(cx, cy + 120, '', 13, '#c8c0b0');
    const render = () => boxes.forEach((b, i) => b.setStrokeStyle(i === cur ? 3 : 2, i === cur ? 0xf2d580 : 0x1f3a5f));
    render();
    m.listen((code) => {
      if (code === 'ArrowLeft') cur = (cur + 3) % 4;
      else if (code === 'ArrowRight') cur = (cur + 1) % 4;
      else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        sfx('chime');
        const c = opts[cur];
        status.setText(`(he writes: "${c}. he sees it ${c} today.")`).setColor('#7ec87e');
        scene.time.delayedCall(1100, () => m.close(c, resolve));
        return;
      }
      sfx('click');
      render();
      void labels;
    }, resolve);
  });
}

// P6 — WHICH STAR: twelve canvases in the sky; one is not his.
export function whichStar(scene, canvases) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'WHICH STAR', 'Twelve stars. Eleven are pictures you painted. One is not yours.\n←/→/↑/↓ a star · [Enter] that one');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 20;
    let cur = 0;
    const cells = canvases.map((c, i) => {
      const x = cx - 180 + (i % 4) * 120;
      const y = cy - 70 + Math.floor(i / 4) * 80;
      const star = m.add(scene.add.image(x, y, 'pt-star').setScrollFactor(0).setDepth(m.depth + 1).setScale(1.8).setAlpha(0.8));
      const thumb = m.add(scene.add.image(x, y, c.thumb).setScrollFactor(0).setDepth(m.depth + 2).setDisplaySize(48, 36));
      const t = m.text(x, y + 30, c.title, 9, '#c8c0b0');
      return { star, thumb, t, c };
    });
    const status = m.text(cx, cy + 135, '', 13, '#c8c0b0');
    const render = () => cells.forEach((cell, i) => cell.star.setAlpha(i === cur ? 1 : 0.55).setScale(i === cur ? 2.1 : 1.8));
    render();
    m.listen((code) => {
      if (code === 'ArrowLeft') cur = (cur + 11) % 12;
      else if (code === 'ArrowRight') cur = (cur + 1) % 12;
      else if (code === 'ArrowUp') cur = (cur + 8) % 12;
      else if (code === 'ArrowDown') cur = (cur + 4) % 12;
      else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        if (cells[cur].c.notYours) {
          sfx('fail');
          status.setText('not yours.').setColor('#e86a6a');
          scene.time.delayedCall(900, () => status.setText('').setColor('#c8c0b0'));
          return;
        }
        sfx('orb');
        status.setText(`${cells[cur].c.title}. yours.`).setColor('#7ec87e');
        scene.time.delayedCall(900, () => m.close(cur, resolve));
        return;
      }
      sfx('click');
      render();
    }, resolve);
  });
}

void Phaser;
void HEX;
void complementOf;
