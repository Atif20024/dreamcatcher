import Phaser from 'phaser';
import { Modal } from './puzzles.js';
import { sfx } from './audio.js';
import { NAPKIN, SCENES, HERRINGS, PAGE_THREE } from '../data/writer/cast.js';

// THE SECOND DRAFT §6 — the puzzle-boxes. All keyboard, all modal.

// P1 — the napkin: put the overheard fragments in the order that reads.
// A clashing pair (out of order, side by side) is underlined in red.
export function napkin(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'THE NAPKIN', "Wren's challenge: eight overheard lines, one paragraph.\n←/→ move · [Enter] pick up / put down · a red line means the pair clashes");
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 10;
    const rand = new Phaser.Math.RandomDataGenerator(['napkin']);
    let order = NAPKIN.map((_, i) => i);
    do order = rand.shuffle(order);
    while (order.every((v, i) => v === i));
    let cur = 0;
    let held = null;
    const slots = order.map((_, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = cx - 150 + col * 300;
      const y = cy - 90 + row * 46;
      const box = m.add(scene.add.rectangle(x, y, 270, 36, 0x24202e).setScrollFactor(0).setDepth(m.depth + 1).setStrokeStyle(1, 0x4a4458));
      const t = m.text(x, y, '', 13);
      const clash = m.add(scene.add.rectangle(x, y + 15, 250, 2, 0xe86a6a).setScrollFactor(0).setDepth(m.depth + 2).setVisible(false));
      return { box, t, clash, x, y };
    });
    const status = m.text(cx, cy + 120, '', 13, '#c8c0b0');
    const render = () => {
      slots.forEach((s, i) => {
        s.t.setText(NAPKIN[order[i]]);
        s.box.setStrokeStyle(2, i === cur ? 0xf2d580 : held === i ? 0xe86a6a : 0x4a4458);
        s.t.setColor(held === i ? '#f2e0a0' : '#e8dcc8');
        const clash = i > 0 && order[i] < order[i - 1];
        s.clash.setVisible(clash);
      });
      const n = order.filter((v, i) => i > 0 && v < order[i - 1]).length;
      status.setText(n ? `reads badly in ${n} place${n > 1 ? 's' : ''}` : 'it reads.');
    };
    render();
    m.listen((code) => {
      if (code === 'ArrowLeft' || code === 'ArrowUp') cur = (cur + order.length - 1) % order.length;
      else if (code === 'ArrowRight' || code === 'ArrowDown') cur = (cur + 1) % order.length;
      else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        if (held === null) held = cur;
        else {
          [order[held], order[cur]] = [order[cur], order[held]];
          held = null;
          sfx('clack');
        }
      }
      sfx('click');
      render();
      if (order.every((v, i) => v === i)) {
        sfx('chime');
        status.setText('it reads. Wren nods.');
        scene.time.delayedCall(700, () => m.close(true, resolve));
      }
    }, resolve);
  });
}

// the rule every structure must pass: rises, dips exactly once, ends highest
export function shapeOf(ts) {
  if (ts.length < 3) return 'too thin to tell';
  let dips = 0;
  for (let i = 1; i < ts.length; i++) if (ts[i] < ts[i - 1]) dips += 1;
  const max = Math.max(...ts);
  if (dips === 0) return 'it never dips. nobody believes a straight climb';
  if (dips > 1) return `it sags ${dips} times`;
  if (ts[ts.length - 1] !== max) return "it doesn't end highest";
  return null;
}

// P2 (structure) and P3 (from memory): twelve slots on a three-act line.
// `fixed` pre-fills slots; `hand` is what can be placed. Resolves with the
// placed cards (or false).
function lineBox(scene, { title, instruction, hand, fixed = [], minPlaced = 12, onHerring }) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, title, instruction);
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const line = Array.from({ length: 12 }, (_, i) => fixed[i] || null);
    const handCards = [...hand];
    let row = 'hand'; // or 'line'
    let hi = 0;
    let li = 0;
    let carried = null;
    // hand: two rows of 7
    const handObjs = [];
    for (let i = 0; i < 14; i++) {
      const x = cx - 270 + (i % 7) * 90;
      const y = cy - 105 + Math.floor(i / 7) * 34;
      handObjs.push({
        box: m.add(scene.add.rectangle(x, y, 84, 28, 0x24202e).setScrollFactor(0).setDepth(m.depth + 1)),
        t: m.text(x, y, '', 10),
      });
    }
    // the line: 12 slots with a tension bar under each
    const slotObjs = [];
    for (let i = 0; i < 12; i++) {
      const x = cx - 275 + i * 50;
      const y = cy + 20;
      m.text(x, y - 22, i < 4 ? 'I' : i < 8 ? 'II' : 'III', 9, '#6a6478');
      slotObjs.push({
        box: m.add(scene.add.rectangle(x, y, 46, 30, 0x1e1a28).setScrollFactor(0).setDepth(m.depth + 1).setStrokeStyle(1, 0x4a4458)),
        t: m.text(x, y, '', 8),
        bar: m.add(scene.add.rectangle(x, y + 60, 30, 2, 0xf2d580).setScrollFactor(0).setDepth(m.depth + 1).setOrigin(0.5, 1)),
      });
    }
    const status = m.text(cx, cy + 135, '', 12, '#c8c0b0');
    const help = m.text(cx, cy + 158, '↑/↓ hand / line · ←/→ move · [Enter] pick up / put down · [C] check the shape', 10, '#6a6478');
    void help;
    const render = () => {
      handObjs.forEach((o, i) => {
        const c = handCards[i];
        o.t.setText(c ? `${c.name}` : '');
        o.box.setVisible(!!c || (row === 'hand' && i === hi));
        o.box.setStrokeStyle(2, row === 'hand' && i === hi ? 0xf2d580 : 0x4a4458);
        o.t.setColor(carried === c && c ? '#f2e0a0' : '#e8dcc8');
      });
      slotObjs.forEach((o, i) => {
        const c = line[i];
        o.t.setText(c ? c.name.split(' ').slice(-2).join('\n') : '');
        o.t.setColor(c && c.fixed ? '#8ab0c0' : '#e8dcc8');
        o.box.setStrokeStyle(2, row === 'line' && i === li ? 0xf2d580 : c && c.fixed ? 0x3a5a6a : 0x4a4458);
        o.bar.setSize(30, c ? 6 + c.t * 8 : 2);
        o.bar.setFillStyle(c ? 0xf2d580 : 0x4a4458);
      });
      const placed = line.filter(Boolean).length;
      status.setText(carried ? `carrying "${carried.name}"` : `${placed}/12 placed`);
    };
    render();
    m.listen((code) => {
      if (code === 'ArrowUp' || code === 'ArrowDown') row = row === 'hand' ? 'line' : 'hand';
      else if (code === 'ArrowLeft') {
        if (row === 'hand') hi = (hi + 13) % 14;
        else li = (li + 11) % 12;
      } else if (code === 'ArrowRight') {
        if (row === 'hand') hi = (hi + 1) % 14;
        else li = (li + 1) % 12;
      } else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        if (row === 'hand') {
          if (carried) {
            handCards[handCards.indexOf(carried) >= 0 ? handCards.indexOf(carried) : handCards.length] = carried;
            if (!handCards.includes(carried)) handCards.push(carried);
            carried = null;
          } else if (handCards[hi]) {
            carried = handCards[hi];
            handCards.splice(hi, 1);
          }
        } else if (line[li] && line[li].fixed) {
          sfx('fail');
          status.setText('that one he remembers.');
          render();
          return;
        } else if (carried) {
          if (carried.wren) {
            sfx('fail');
            slotObjs[li].box.setFillStyle(0x6a2a2a);
            scene.time.delayedCall(300, () => slotObjs[li].box.setFillStyle(0x1e1a28));
            status.setText('not yours.');
            if (onHerring) onHerring();
            handCards.push(carried);
            carried = null;
            render();
            return;
          }
          const was = line[li];
          line[li] = carried;
          carried = was || null;
        } else if (line[li]) {
          carried = line[li];
          line[li] = null;
        }
        sfx('clack');
      } else if (code === 'KeyC') {
        const placed = line.filter(Boolean);
        if (placed.length < minPlaced) {
          status.setText(minPlaced === 12 ? 'every slot needs a scene.' : `at least ${minPlaced} must be filled.`);
          sfx('fail');
          return;
        }
        const problem = shapeOf(placed.map((c) => c.t));
        if (problem) {
          status.setText(problem + '.');
          sfx('fail');
          return;
        }
        sfx('chime');
        status.setText('that is a book.');
        scene.time.delayedCall(700, () => m.close(line.map((c) => c || null), resolve));
        return;
      }
      sfx('click');
      render();
    }, resolve);
  });
}

export function structure(scene) {
  const rand = new Phaser.Math.RandomDataGenerator(['structure']);
  const hand = rand.shuffle([...SCENES, ...HERRINGS].map((c) => ({ ...c })));
  return lineBox(scene, {
    title: 'STRUCTURE',
    instruction: "Emmerich lays your thirty pages out as cards. Twelve scenes on three acts:\nthe line must rise, dip once, and end highest. Two cards are not yours.",
    hand,
  });
}

// P3 — the same line, six scenes remembered, six blanks to fill from what
// he paid attention to. `fragments` are {name, t} from collected words and
// the sources' spines. Resolves { placed, used } or false.
export function memory(scene, solved, fragments) {
  const fixed = [];
  // remember every other scene from the solved order
  solved.forEach((c, i) => {
    if (c && i % 2 === 0) fixed[i] = { ...c, fixed: true };
  });
  const rand = new Phaser.Math.RandomDataGenerator(['memory']);
  const hand = rand.shuffle(fragments.map((f) => ({ ...f })));
  return lineBox(scene, {
    title: 'FROM MEMORY',
    instruction: 'The bag is gone. Six scenes he remembers; six he must rebuild from what he\nwrote down along the way. Fewer fragments, thinner book. At least three.',
    hand,
    fixed,
    minPlaced: 9,
  }).then((line) => {
    if (!line) return false;
    const used = line.filter((c) => c && !c.fixed).length;
    return { placed: line, used };
  });
}

// P4 — page three, in full. Keep it or cut it.
export function pageThree(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'PAGE THREE', 'The paragraph Emmerich told you to cut, in Chapter Two. Read it.');
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    m.text(cx, cy - 20, PAGE_THREE.join('\n'), 12, '#e8dcc8');
    let choice = 1; // 0 keep, 1 cut
    const keep = m.text(cx - 90, cy + 110, 'KEEP', 18);
    const cut = m.text(cx + 90, cy + 110, 'CUT', 18);
    const note = m.text(cx, cy + 140, '', 11, '#c8c0b0');
    const render = () => {
      keep.setColor(choice === 0 ? '#f2d580' : '#6a6478');
      cut.setColor(choice === 1 ? '#f2d580' : '#6a6478');
      note.setText(choice === 0 ? 'keep it, and find six more pages to lose elsewhere' : 'cut it, and the door is that much nearer');
    };
    render();
    m.listen((code) => {
      if (code === 'ArrowLeft' || code === 'ArrowRight') {
        choice = 1 - choice;
        sfx('click');
        render();
      } else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        sfx(choice ? 'scratch' : 'chime');
        m.close(choice ? 'cut' : 'kept', resolve);
      }
    }, resolve);
  });
}
