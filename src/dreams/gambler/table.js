// THE LAST HAND's table presenters (views lq_slate, lq_faro, lq_cards in
// src/play/encounterPresenters.js): the gangway slate, the faro bank and
// SHOWDOWN, staged in the room (the camera closes on the table, Jo sits in
// Lou's chair) with the hand on a panel at the foot of the screen, in the
// bitmap fonts at the §8 screen sizes:
//   the players (name, the card they show, their tell, in words as well as
//   on the person), Jo's three cards and what they make, the pot and the
//   house's slot (a brass coin drops into it: the rake), the verbs, and one
//   line under them: Lou's whisper, what just happened, or the rule book.
// TILT is drawn here too: tilted, the tells blur and Lou is drowned out.
// The purse (F.purse) is written back on every hand; the HUD reads it.
import { drawPanel } from '../../ui/Panel.js';
import { uiText } from '../../ui/text.js';
import { hud } from '../../ui/hud.js';
import { playTone } from '../../systems/audio.js';
import { RULES, TELLS } from '../../engines/showdown.js';
import { FARO_RANKS } from '../../engines/faro.js';
import { LOU_TIPS } from './dialogue.js';

const D = 160; // UI depth (adopted by the UI scene: never zoomed)
const PX = 40;
const PY = 318;
const PW = 880;
const PH = 196;
const INK = '#f2e9d8';
const DIM = '#9c8f7a';
const ACC = '#e9b84a';
const RED = 0xb02a2a;
const BLACK = 0x1e1a22;

const tone = (f, d, type = 'sine', v = 0.06, w = 0) => {
  try {
    playTone(f, d, type, v, w);
  } catch {
    /* no audio */
  }
};

// a card face at panel scale: ivory, a rank in the corner, a pip by suit
// (spades and clubs ink, hearts and diamonds red); `back` is the boat's red
export function drawCard(g, x, y, card, { w = 36, h = 50, back = false, dim = false } = {}) {
  g.fillStyle(0x0e0b14, 0.5).fillRoundedRect(x + 2, y + 2, w, h, 3);
  if (back || !card) {
    g.fillStyle(0x7a2430, 1).fillRoundedRect(x, y, w, h, 3);
    g.lineStyle(2, 0xd8c8a0, 1).strokeRoundedRect(x + 3, y + 3, w - 6, h - 6, 2);
    return;
  }
  g.fillStyle(dim ? 0xb8b0a0 : 0xf4ecd8, 1).fillRoundedRect(x, y, w, h, 3);
  g.lineStyle(1, 0x6b4a1f, 1).strokeRoundedRect(x, y, w, h, 3);
  const red = card.s === 1 || card.s === 2;
  const col = red ? RED : BLACK;
  const cx = x + w / 2;
  const cy = y + h * 0.64;
  g.fillStyle(col, 1);
  if (card.s === 0) {
    // spade: a heart upside down, a stem
    g.fillCircle(cx - 4, cy + 1, 4.5).fillCircle(cx + 4, cy + 1, 4.5).fillTriangle(cx - 9, cy, cx + 9, cy, cx, cy - 10).fillTriangle(cx, cy + 2, cx - 4, cy + 9, cx + 4, cy + 9);
  } else if (card.s === 1) {
    g.fillCircle(cx - 4, cy - 2, 4.5).fillCircle(cx + 4, cy - 2, 4.5).fillTriangle(cx - 9, cy, cx + 9, cy, cx, cy + 9);
  } else if (card.s === 2) {
    g.fillTriangle(cx, cy - 9, cx + 7, cy, cx, cy + 9).fillTriangle(cx, cy - 9, cx - 7, cy, cx, cy + 9);
  } else {
    g.fillCircle(cx, cy - 5, 4).fillCircle(cx - 5, cy + 2, 4).fillCircle(cx + 5, cy + 2, 4).fillTriangle(cx, cy, cx - 3, cy + 9, cx + 3, cy + 9);
  }
}

// the panel and its bits: graphics for the frame and the cards, a pool of
// texts rebuilt only when the hand changes (not every frame)
function stage(scene) {
  const frame = scene.add.graphics().setScrollFactor(0).setDepth(D);
  frame.isDCPanel = true;
  frame.panelRect = { x: PX, y: PY, w: PW, h: PH };
  const g = scene.add.graphics().setScrollFactor(0).setDepth(D + 1);
  let texts = [];
  const text = (x, y, s, { color = INK, align = 'left', size = 'small', wrap = 0 } = {}) => {
    const t = uiText(scene, Math.round(x), Math.round(y), s, { size, scale: 2, color, wrap })
      .setScrollFactor(0)
      .setDepth(D + 2)
      .setOrigin(align === 'center' ? 0.5 : align === 'right' ? 1 : 0, 0);
    texts.push(t);
    return t;
  };
  return {
    frame,
    g,
    text,
    clear() {
      texts.forEach((t) => t.destroy());
      texts = [];
      g.clear();
    },
    drawFrame(accent = null, glow = 0) {
      frame.clear();
      drawPanel(frame, PX, PY, PW, PH, { accent });
      if (glow) frame.lineStyle(2, 0xf6d98a, glow).strokeRoundedRect(PX - 3, PY - 3, PW + 6, PH + 6, 6);
    },
    destroy() {
      texts.forEach((t) => t.destroy());
      frame.destroy();
      g.destroy();
    },
  };
}

// a row of options with a cursor box (dark: drawn unlit, but there)
function options(ui, items, cursor, y, { active = true } = {}) {
  const n = items.length;
  const slot = (PW - 40) / n;
  items.forEach((it, i) => {
    const cx = PX + 20 + slot * i + slot / 2;
    const on = active && i === cursor;
    const col = !it.enabled ? DIM : it.dark ? '#c8bca8' : on ? ACC : INK;
    const t = ui.text(cx, y, it.label, { color: col, align: 'center' });
    if (on) {
      const w = t.width + 18;
      ui.g.lineStyle(2, 0xe9b84a, 1).strokeRoundedRect(cx - w / 2, y - 5, w, 26, 3);
    }
    if (it.dark && it.enabled) ui.g.fillStyle(0x0e0b14, 0.35).fillRoundedRect(cx - t.width / 2 - 8, y - 4, t.width + 16, 24, 3);
  });
}

// ---- the gangway slate -------------------------------------------------------
export function slatePresenter(scene, def, engine) {
  const ui = stage(scene);
  let sig = null;
  const draw = (st) => {
    const k = JSON.stringify([st.row, st.rows.map((r) => r.value)]);
    if (k === sig) return;
    sig = k;
    ui.clear();
    ui.drawFrame(0xc8a24a);
    ui.text(PX + 24, PY + 14, 'THE SLATE: CHALK YOUR LINE BEFORE THE FIRST CARD', { color: ACC });
    // the slate itself: dark board, chalk numbers
    ui.g.fillStyle(0x6a4a2e, 1).fillRect(PX + 24, PY + 40, 520, 120);
    ui.g.fillStyle(0x263030, 1).fillRect(PX + 30, PY + 46, 508, 108);
    st.rows.forEach((r, i) => {
      const y = PY + 54 + i * 32;
      const on = st.row === i;
      ui.text(PX + 44, y, r.label, { color: on ? ACC : INK });
      ui.text(PX + 300, y, `${r.first ? ' ' : '<'}  $${r.value}  ${r.last ? ' ' : '>'}`, { color: on ? ACC : INK });
      if (on) ui.g.lineStyle(2, 0xe9b84a, 1).strokeRect(PX + 36, y - 5, 496, 26);
    });
    const hints = ['what comes aboard of Lou\'s $100', 'under this line, the night is over', 'at this line, the night is won'];
    ui.text(PX + 564, PY + 50, st.confirm ? 'Chalk it. It stays on you all night; nobody makes you obey it.' : hints[st.row], { color: INK, wrap: 300 });
    const btnY = PY + 166;
    ui.text(PX + 564, btnY, 'CHALK IT', { color: st.confirm ? ACC : DIM });
    if (st.confirm) ui.g.lineStyle(2, 0xe9b84a, 1).strokeRoundedRect(PX + 556, btnY - 5, 112, 26, 3);
    ui.text(PX + 24, PY + 170, '[UP][DOWN] row  [LEFT][RIGHT] number  [E] next', { color: DIM });
  };
  return {
    enter(st) {
      hud.set('context', '');
      draw(st);
    },
    render(st, outcome) {
      for (const e of engine.takeEvents()) if (e === 'chalk') tone(2400, 0.04, 'triangle', 0.03);
      if (outcome === 'move') tone(1800, 0.03, 'triangle', 0.02);
      draw(st);
    },
    outro(result) {
      if (result && result.ok && def.onResult) def.onResult(scene, result);
      return new Promise((res) => scene.time.delayedCall(200, res));
    },
    destroy() {
      ui.destroy();
    },
  };
}

// ---- the faro bank -------------------------------------------------------------
const KIND_WORD = { win: 'YOUR CARD CAME. THE BANK PAYS', lose: "THE BANK'S CARD. IT TAKES YOUR STAKE", split: 'A SPLIT: BOTH CARDS ALIKE. THE BANK TAKES HALF' };
export function faroPresenter(scene, def, engine) {
  const ui = stage(scene);
  let sig = null;
  const draw = (st) => {
    const k = JSON.stringify([st.phase, st.row, st.card, st.pick, st.now, st.bets]);
    if (k === sig) return;
    sig = k;
    ui.clear();
    ui.drawFrame(st.now >= st.target ? 0xf6d98a : null);
    ui.text(PX + 24, PY + 12, `THE FARO BANK   AT THE BANK $${st.now}   GOAL $${st.target}`, { color: ACC });
    // the layout: thirteen spades enamelled on the baize
    ui.g.fillStyle(0x1e5a3a, 1).fillRect(PX + 24, PY + 38, 560, 66);
    FARO_RANKS.forEach((r, i) => {
      const x = PX + 32 + i * 42;
      const on = st.card === i;
      ui.g.fillStyle(on ? 0xfff4d0 : 0xe8e0c8, 1).fillRoundedRect(x, PY + 44, 34, 46, 3);
      ui.g.fillStyle(BLACK, 1).fillCircle(x + 17, PY + 76, 4);
      ui.text(x + 17, PY + 50, r, { color: '#1e1a22', align: 'center' });
      if (on) ui.g.lineStyle(2, st.row === 0 ? 0xe9b84a : 0x6b4a1f, 1).strokeRoundedRect(x - 3, PY + 41, 40, 52, 4);
    });
    // the box: the two cards just drawn (the bank's, then the player's)
    const l = st.last;
    const bx = PX + 610;
    ui.text(bx, PY + 40, "BANK'S", { color: DIM });
    ui.text(bx + 120, PY + 40, 'PLAYER\'S', { color: DIM });
    if (l && st.phase !== 'draw') {
      drawCard(ui.g, bx + 6, PY + 60, { r: l.banker === 0 ? 14 : l.banker + 1, s: 2 });
      drawCard(ui.g, bx + 126, PY + 60, { r: l.player === 0 ? 14 : l.player + 1, s: 3 });
    } else {
      drawCard(ui.g, bx + 6, PY + 60, null, { back: true });
      drawCard(ui.g, bx + 126, PY + 60, null, { back: true });
    }
    // the bets
    options(ui, st.actions, st.pick, PY + 120, { active: st.row === 1 && st.phase === 'choose' });
    let line;
    if (st.phase === 'draw') line = l.draws > 1 ? `The dealer turns ${l.draws} pairs before your ${FARO_RANKS[st.card]} shows…` : 'The dealer turns a pair…';
    else if (st.phase === 'show' && l) {
      line = `${KIND_WORD[l.kind]}${l.kind === 'win' ? ` $${l.stake}, LESS $${l.rake} TO THE HOUSE` : l.free ? ' (THE HOUSE STAKED IT)' : ` $${-l.net}`}`;
    } else line = st.row === 0 ? `Your card: ${st.cardLabel}. [LEFT][RIGHT] to change, [DOWN] to the bets.` : st.houseMoney ? 'The house stakes this first bet (a comp on Mr Pell\'s book).' : '[UP] picks the card. Splits go to the bank: that is the edge.';
    ui.text(PX + 24, PY + 160, line, { color: st.phase === 'show' && l && l.kind === 'win' ? ACC : INK });
  };
  const at0 = engine.state().now;
  return {
    enter(st) {
      hud.set('context', '');
      draw(st);
    },
    render(st) {
      for (const e of engine.takeEvents()) {
        if (e === 'win') tone(523, 0.25, 'triangle', 0.05);
        if (e === 'lose' || e === 'split') tone(196, 0.3, 'sine', 0.05);
        if (e === 'rake') tone(1568, 0.08, 'triangle', 0.04, 0.12); // the brass coin in the slot
      }
      draw(st);
      // the purse follows the bank as it moves
      if (scene.F.purse) scene.F.purse.atBank = st.now - at0;
    },
    outro(result) {
      if (def.onResult) def.onResult(scene, result || { ok: false, left: true, ...engine.state() });
      return new Promise((res) => scene.time.delayedCall(result && result.ok ? 700 : 200, res));
    },
    destroy() {
      if (scene.F.purse) delete scene.F.purse.atBank;
      ui.destroy();
    },
  };
}

// ---- SHOWDOWN ---------------------------------------------------------------------
// what the line under the verbs says
function infoLine(st) {
  const L = st.last;
  if (st.phase === 'deal') return { text: st.mode === 'final' ? 'The Judge slides the deck across. "One more, Jo."' : 'Antes in. The cards come round…', color: DIM };
  if (st.phase === 'reveal' && L) {
    if (L.kind === 'fold' || L.kind === 'stand') {
      if (L.saved) return { text: `FOLDED. SAVED $${L.saved}: calling would have lost.`, color: ACC };
      return { text: `Folded. That hand would have taken a pot of $${L.missed}.`, color: DIM };
    }
    if (L.kind === 'final') return L.joWins ? { text: `Your card. +$${L.back - L.put}, the house took $${L.rake}. He shuffles another.`, color: INK } : { text: 'His card. The night\'s profit goes across the table.', color: INK };
    const rake = L.joWins ? ` The house took $${L.rake} of the $${L.pot} pot.` : '';
    if (L.kind === 'bluff') {
      if (L.bluffWorked) return { text: `Bluff: everyone folded (the tells said scared or weak).${rake}`, color: ACC };
      return { text: `Bluff called: ${L.callers.map((id) => st.opps.find((o) => o.id === id).name).join(', ')} had something. The tell said so.`, color: INK };
    }
    if (L.joWins) return { text: `${L.split ? 'Split pot' : 'Your pot'} with ${L.joHand.toLowerCase()}.${rake}`, color: ACC };
    return { text: `Their hand is better. -$${L.put}.`, color: INK };
  }
  if (st.mode === 'final') return { text: 'CALL plays for the night\'s profit. RAISE, for everything. STAND UP takes it home.', color: INK };
  if (st.tip) {
    if (st.tilted) return { text: 'LOU: …   (you can\'t hear him: you\'re steaming)', color: DIM };
    return { text: `LOU: ${LOU_TIPS[st.tip.say]}`, color: INK };
  }
  return { text: RULES, color: DIM };
}

export function showdownPresenter(scene, def, engine, ctx) {
  const ui = stage(scene);
  const anchor = ctx.anchor || { x: scene.player.x + 60, y: scene.player.y - 60 };
  const world = scene.add.graphics().setDepth(12); // the tells, on the people
  const coin = scene.add.circle(0, 0, 5, 0xc8a050).setScrollFactor(0).setDepth(D + 3).setVisible(false);
  const st0 = engine.state();
  const led0 = { ...st0.ledger };
  let sig = null;
  let lastHand = 0;
  let creepFlash = 0;
  const F = scene.F;
  const P = F.purse;
  const flag = def.flag || null;
  const draw = (st) => {
    const k = JSON.stringify([st.phase, st.hand, st.cursor, st.tilted, st.won, !!st.last]);
    if (k === sig) return;
    sig = k;
    ui.clear();
    // the slate speaks: the table dims under the stop-loss, brightens at the goal
    const line = P ? (st.stack < P.stop ? 'below' : st.stack >= P.goal ? 'goal' : 'between') : 'between';
    ui.drawFrame(line === 'goal' ? 0xf6d98a : line === 'below' ? 0x6a3a3a : null, line === 'goal' ? 0.6 : 0);
    const showAll = st.phase === 'reveal' || st.phase === 'done';
    // the players
    const ow = Math.min(190, 560 / Math.max(1, st.opps.length));
    st.opps.forEach((o, i) => {
      const x = PX + 22 + i * ow;
      ui.text(x, PY + 10, o.name, { color: o.folded ? DIM : ACC });
      // the last table: two up, the third face down until it is played
      const cards = showAll ? o.cards : st.mode === 'final' ? [o.cards[0], o.cards[1], null] : [o.up[0], null, null];
      cards.forEach((c, j) => drawCard(ui.g, x + j * 30, PY + 34, c, { back: !c, w: 32, h: 44, dim: o.folded }));
      if (showAll) ui.text(x, PY + 84, o.folded ? 'FOLDED' : o.hand, { color: o.folded ? DIM : INK });
      else {
        const word = st.tilted ? '· · ·' : TELLS[o.tell].word;
        ui.text(x, PY + 84, word, { color: st.tilted ? DIM : INK });
      }
    });
    // Jo's hand, the pot, the house
    const jx = PX + 600;
    ui.text(jx, PY + 10, st.mode === 'final' ? "LOU'S CHAIR" : 'YOUR HAND', { color: ACC });
    const hidden = st.mode === 'final' && !showAll;
    st.jo.forEach((c, j) => drawCard(ui.g, jx + j * 42, PY + 32, hidden && j === 2 ? null : c, { back: hidden && j === 2 }));
    ui.text(jx, PY + 88, hidden ? 'KINGS AND NINES' : st.joHand, { color: INK });
    ui.text(PX + PW - 20, PY + 10, `POT $${st.pot}`, { color: INK, align: 'right' });
    // the house's slot: where the rake goes, shown
    ui.g.fillStyle(0x3a2a1a, 1).fillRect(PX + PW - 64, PY + 40, 44, 10);
    ui.g.fillStyle(0x0e0b14, 1).fillRect(PX + PW - 58, PY + 43, 32, 4);
    ui.text(PX + PW - 20, PY + 56, 'HOUSE', { color: DIM, align: 'right' });
    // the verbs, then one line
    options(ui, st.menu, st.cursor, PY + 122, { active: st.phase === 'decide' });
    const info = infoLine(st);
    ui.text(PX + 22, PY + 160, info.text, { color: info.color, wrap: PW - 44 });
  };
  // the tells, on the people (true, never random); a hum's notes, the
  // little finger off the glass, the hand at the collar or flat on the baize
  const drawTells = (st, t) => {
    world.clear();
    if (st.phase !== 'decide' && st.phase !== 'deal') return;
    for (const o of st.opps) {
      const n = [...scene.npcs.values()].find((p) => p.body && p.body.key === `npc-lq-${o.id === 'judge' ? 'voe' : o.id}` && Math.abs(p.x - anchor.x) < 200);
      if (!n) continue;
      const jitter = st.tilted ? Math.sin(t / 37 + n.x) * 3 : 0;
      const a = st.tilted ? 0.35 + 0.25 * Math.sin(t / 90) : 1;
      const hx = n.x - 14 + jitter;
      const hy = n.y - 46;
      if (o.tell === 'hum') {
        for (let i = 0; i < 2; i++) {
          const k = ((t / 1400 + i * 0.5) % 1);
          const nx = n.x + 6 + i * 8 + jitter;
          const ny = n.y - 70 - k * 24;
          world.fillStyle(0xf2e9d8, a * (1 - k)).fillCircle(nx, ny, 3).fillRect(nx + 2, ny - 10, 1.5, 10);
        }
      } else if (o.tell === 'pinky' || o.tell === 'still') {
        world.fillStyle(0xc8e0e8, a * 0.9).fillRect(hx - 2, hy - 8, 6, 9);
        world.fillStyle(0xe0bca0, a).fillCircle(hx + 1, hy + 2, 3.5);
        if (o.tell === 'pinky') world.fillRect(hx + 4, hy + 1 - Math.abs(Math.sin(t / 300)) * 2, 5, 1.5);
      } else if (o.tell === 'collar') {
        const k = Math.abs(Math.sin(t / 420));
        world.fillStyle(0xd8b090, a).fillCircle(n.x - 2 + jitter, n.y - 56 - k * 3, 3.5);
        world.fillStyle(0x8a0a0a, a * 0.25 * k).fillCircle(n.x - 1, n.y - 66, 7); // the flush
      } else if (o.tell === 'flat') {
        world.fillStyle(0xd8b090, a).fillRect(n.x - 22 + jitter, n.y - 36, 8, 3).fillRect(n.x - 12 + jitter, n.y - 36, 8, 3);
      }
    }
  };
  // the purse follows every hand; the ledger is settled at the end
  const sync = (st) => {
    if (!P) return;
    P.stack = st.stack;
    P.tilt = st.tilt;
    if (P.stack < P.stop) P.crossedStop = true;
    if (P.stack >= P.goal) P.reachedGoal = true;
    P.peak = Math.max(P.peak || 0, P.stack);
    if (st.won && flag && !F[flag]) F[flag] = true;
  };
  return {
    enter(st) {
      hud.set('context', '');
      draw(st);
      sync(st);
    },
    render(st, outcome) {
      const t = scene.time.now;
      for (const e of engine.takeEvents()) {
        if (e === 'deal') tone(2600, 0.03, 'triangle', 0.02);
        if (e === 'fold_chime') tone(220, 0.9, 'sine', 0.07); // the loudest thing in the room: a good fold
        if (e === 'win') tone(659, 0.4, 'triangle', 0.04); // one note, never a fanfare
        if (e === 'lose') tone(147, 0.4, 'sine', 0.04);
        if (e === 'creep') creepFlash = t;
      }
      if (outcome === 'move') tone(1800, 0.02, 'triangle', 0.015);
      // the rake: a brass coin drops from the pot into the house's slot
      if (st.phase === 'reveal' && st.hand !== lastHand && st.last && st.last.joWins && st.last.rake) {
        lastHand = st.hand;
        coin.setPosition(PX + PW - 40, PY + 24).setVisible(true).setAlpha(1);
        scene.tweens.add({ targets: coin, y: PY + 45, duration: 420, ease: 'quad.in', onComplete: () => coin.setVisible(false) });
        tone(1568, 0.08, 'triangle', 0.035, 0.4);
      }
      draw(st);
      drawTells(st, t);
      sync(st);
      // tilted, the bet creeping is seen: the cursor box blinks red a moment
      if (creepFlash && t - creepFlash < 300) ui.g.lineStyle(2, 0xd5443c, 1).strokeRect(PX + 4, PY + 116, PW - 8, 34);
    },
    outro(result) {
      return new Promise((res) => scene.time.delayedCall(result && result.ok ? 600 : 250, res));
    },
    destroy() {
      const st = engine.state();
      sync(st);
      if (P) {
        const L = st.ledger;
        P.hands += L.hands - led0.hands;
        P.folds += L.folds - led0.folds;
        P.saved += L.saved - led0.saved;
        P.rake += L.rake - led0.rake;
        P.won += L.won - led0.won;
        P.lost += L.lost - led0.lost;
      }
      world.destroy();
      coin.destroy();
      ui.destroy();
    },
  };
}
