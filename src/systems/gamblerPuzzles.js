import Phaser from 'phaser';
import { Modal } from './puzzles.js';
import { sfx } from './audio.js';
import { seededRng, newDeck, bjValue, isTenValue, isBlackjack, evalPoker, comparePoker, pokerStrength, keepMask, Tell, drawCard, flipCard, cardTextureKey, rankLabel } from './cards.js';

// THE LAST HAND §6 — the six card games. All keyboard, all modal, all seeded
// per save, and every one of them has a tell or a visible shoe. The scene
// pays and collects; these panels only say what happened.

const GOLD = '#f2d580';
const DIM = '#6a6478';
const INK = '#e8dcc8';
const RED = '#e86a6a';

const portrait = (m, scene, x, y, key, scale = 0.9) => m.add(scene.add.image(x, y, key).setScale(scale).setScrollFactor(0).setDepth(m.depth + 2));
const rect = (m, scene, x, y, w, h, c, a = 1) => m.add(scene.add.rectangle(x, y, w, h, c, a).setScrollFactor(0).setDepth(m.depth + 1));
const felt = (m, scene, cx, cy, w, h) => {
  rect(m, scene, cx, cy, w, h, 0x1e4a30);
  rect(m, scene, cx, cy, w - 8, h - 8, 0x245a3a);
};
const cardAt = (m, scene, x, y, card, faceDown = false, scale = 2) => m.add(drawCard(scene, x, y, card, { faceDown, scale, depth: m.depth + 3 }));
const wait = (scene, ms) => new Promise((r) => scene.time.delayedCall(ms, r));
// a handler that stays attached across awaits; Modal.close removes it
const listenAsync = (m, fn) => {
  m.keyHandler = (e) => fn(e.code);
  m.scene.input.keyboard.on('keydown', m.keyHandler);
};
const waitKey = (m, codes) =>
  new Promise((resolve) => {
    m._pending = (code) => {
      if (!codes || codes.includes(code)) {
        m._pending = null;
        resolve(code);
      }
    };
  });

// ---- the stake selector --------------------------------------------------------
// At a table: chips or hearts. Resolves { kind, n } or false.
export function stakeSelector(scene, { chips, hearts, odds = 'even money', name = '' }) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, `BET — ${name}`, `${odds}. Chips are house money until they are cashed. Hearts are not.\n←/→ choose the stake · [Enter] sit down`);
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 10;
    const opts = [];
    for (const n of [1, 2, 5, 10]) if (chips >= n) opts.push({ kind: 'chips', n, label: `${n} CHIP${n > 1 ? 'S' : ''}` });
    if (hearts > 1) opts.push({ kind: 'hearts', n: 1, label: '1 HEART' });
    if (!opts.length) {
      m.text(cx, cy, 'Nothing to stake. (A chip, a heart — anything.)', 14, DIM);
      m.listen(() => m.close(false, resolve), resolve);
      return;
    }
    let cur = 0;
    const labels = opts.map((o, i) => m.text(cx - ((opts.length - 1) * 70) / 2 + i * 140, cy, o.label, 16));
    const note = m.text(cx, cy + 50, '', 12, DIM);
    const render = () => {
      labels.forEach((t, i) => t.setColor(i === cur ? GOLD : DIM));
      const o = opts[cur];
      note.setText(o.kind === 'hearts' ? 'a heart lost is a heart gone. a heart won is real.' : `${o.n} pending. win and it is ${o.n * 2}. lose and it is gone.`);
    };
    render();
    m.listen((code) => {
      if (code === 'ArrowLeft') cur = (cur + opts.length - 1) % opts.length;
      else if (code === 'ArrowRight') cur = (cur + 1) % opts.length;
      else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        sfx('clack');
        m.close(opts[cur], resolve);
        return;
      }
      sfx('click');
      render();
    }, resolve);
  });
}

// ---- P1 — higher or lower (the door game) ----------------------------------------
// Three right in a row opens the door. The remaining deck is spread on the
// counter. Equal is wrong (the house's ties). Free; losing just deals again.
export function higherLower(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'HIGHER OR LOWER', 'The doorman flips a card. Call the next one: [↑] higher · [↓] lower.\nThree in a row opens the door. The rest of the deck is on the counter.');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 10;
    const rng = seededRng('p1');
    let deck = newDeck(rng);
    let cur = deck.pop();
    let streak = 0;
    let busy = false;
    felt(m, scene, cx, cy - 40, 300, 120);
    const curImg = cardAt(m, scene, cx - 50, cy - 40, cur);
    const nextImg = cardAt(m, scene, cx + 50, cy - 40, null, true);
    const pips = [0, 1, 2].map((i) => rect(m, scene, cx - 30 + i * 30, cy + 40, 18, 18, 0x2a2a34));
    const status = m.text(cx, cy + 72, 'call it.', 13, INK);
    // the counter: what is left, by rank, as a row of small cards
    const spreadY = cy + 120;
    m.text(cx, spreadY - 30, 'ON THE COUNTER', 10, DIM);
    const spread = [];
    const renderSpread = () => {
      spread.forEach((s) => s.destroy());
      spread.length = 0;
      const byRank = {};
      for (const c of deck) byRank[c.r] = (byRank[c.r] || 0) + 1;
      const ranks = Object.keys(byRank).map(Number).sort((a, b) => a - b);
      ranks.forEach((r, i) => {
        const x = cx - ((ranks.length - 1) * 42) / 2 + i * 42;
        const n = byRank[r];
        for (let k = 0; k < n; k++) spread.push(m.add(drawCard(scene, x, spreadY + 20 - k * 4, { r, s: ['S', 'H', 'D', 'C'][k] }, { scale: 1, depth: m.depth + 3 })));
      });
      pips.forEach((p, i) => p.setFillStyle(i < streak ? 0xf2d580 : 0x2a2a34));
    };
    renderSpread();
    m.listen((code) => {
      if (busy || (code !== 'ArrowUp' && code !== 'ArrowDown')) return;
      busy = true;
      const next = deck.pop();
      flipCard(scene, nextImg, next, false);
      sfx('clack');
      const right = code === 'ArrowUp' ? next.r > cur.r : next.r < cur.r;
      scene.time.delayedCall(260, () => {
        if (right) {
          streak += 1;
          sfx('chime');
          status.setText(streak >= 3 ? 'three. the door opens.' : `${streak} of three.`);
        } else {
          streak = 0;
          sfx('tick');
          status.setText(next.r === cur.r ? 'a pair. ties go to the door.' : 'no. again — it costs nothing.');
        }
        renderSpread();
        if (streak >= 3) {
          scene.time.delayedCall(700, () => m.close({ won: true, chips: 2 }, resolve));
          return;
        }
        scene.time.delayedCall(500, () => {
          cur = next;
          curImg.setTexture(nextImg.texture.key);
          curImg.card = next;
          nextImg.setTexture('gm-card-back');
          if (deck.length < 6) deck = newDeck(rng);
          renderSpread();
          busy = false;
        });
      });
    }, resolve);
  });
}

// ---- P2 — twenty-one vs Lou ------------------------------------------------------------
// Six hands. Dealer stands on 17, ties go to the house, blackjack pays 3:2.
// The shoe is on the table and empties as it deals; Lou touches his cufflink
// when his hole card is a ten-value. Three of six takes the lounge ticket.
export function twentyOne(scene, stake, { chips, hearts, difficulty = 0 }) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'TWENTY-ONE', 'Six hands against Lou. [H] hit · [S] stand · [D] double. He stands on 17; ties go to the house.\nThe shoe is on the table. Three of six wins the lounge ticket.');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 10;
    const rng = seededRng('p2');
    let shoe = newDeck(rng);
    const draw = () => {
      if (shoe.length < 12) shoe = newDeck(rng);
      return shoe.pop();
    };
    let hand = 0;
    let wins = 0;
    let netChips = 0;
    let netHearts = 0;
    const bet = { ...stake };
    felt(m, scene, cx, cy - 10, 560, 230);
    const lou = portrait(m, scene, cx - 240, cy - 70, 'portrait-lou');
    m.text(cx - 240, cy - 20, 'LOU', 10, GOLD);
    const tell = new Tell(scene, lou, { base: 'portrait-lou', tell: 'portrait-lou-tell', condition: (c) => isTenValue(c.hole), difficulty });
    const shoeText = m.text(cx + 220, cy - 70, '', 9, INK);
    m.text(cx + 220, cy - 108, 'THE SHOE', 10, DIM);
    const dealerLabel = m.text(cx, cy - 92, '', 12, INK);
    const playerLabel = m.text(cx, cy + 92, '', 12, INK);
    const status = m.text(cx, cy + 150, '', 13, GOLD);
    const tally = m.text(cx, cy + 172, '', 11, DIM);
    const betText = m.text(cx - 240, cy + 60, '', 11, INK);
    const felted = m.text(cx, cy + 118, 'TIES GO TO THE HOUSE · DEALER STANDS ON 17 · BLACKJACK PAYS 3:2', 9, '#6aa07a');
    void felted;
    let cards = [];
    const clearCards = () => {
      cards.forEach((c) => c.destroy());
      cards = [];
    };
    const renderShoe = () => {
      if (difficulty >= 2) {
        shoeText.setText(`${shoe.length} cards left`);
        return;
      }
      const by = {};
      for (const c of shoe) by[rankLabel(c.r)] = (by[rankLabel(c.r)] || 0) + 1;
      const order = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
      shoeText.setText(order.map((r) => `${r.padStart(2)} ×${by[r] || 0}`).join('\n'));
    };
    const renderTally = () => tally.setText(`hand ${Math.min(6, hand)} of 6 · won ${wins} · chips ${chips + netChips} pending · ♥ ${hearts + netHearts}`);
    const showHands = (dealer, player, hole) => {
      clearCards();
      dealer.forEach((c, i) => cards.push(cardAt(m, scene, cx - 40 + i * 44, cy - 50, c, hole && i === 1)));
      player.forEach((c, i) => cards.push(cardAt(m, scene, cx - 40 + i * 44, cy + 48, c)));
      dealerLabel.setText(hole ? `Lou shows ${bjValue([dealer[0]])}` : `Lou: ${bjValue(dealer)}`);
      playerLabel.setText(`Jo: ${bjValue(player)}`);
    };
    const canAfford = () => (bet.kind === 'chips' ? chips + netChips >= bet.n : hearts + netHearts > 1);
    const settle = (mult, msg) => {
      if (bet.kind === 'chips') netChips += bet.n * mult;
      else netHearts += Math.sign(mult);
      status.setText(msg);
      if (mult > 0) {
        wins += 1;
        scene.winFx(bet.kind === 'chips' ? bet.n * mult : 1, { big: mult >= 1.5 });
      } else if (mult < 0) scene.lossFx();
      renderTally();
    };

    const playHand = async () => {
      hand += 1;
      if (hand > 6) return finish();
      if (!canAfford()) {
        status.setText(bet.kind === 'chips' ? 'no chips left to put down.' : 'no heart to spare.');
        await wait(scene, 900);
        return finish();
      }
      betText.setText(`stake: ${bet.n} ${bet.kind}\n←/→ change`);
      const player = [draw(), draw()];
      const dealer = [draw(), draw()];
      renderShoe();
      showHands(dealer, player, true);
      renderTally();
      status.setText('');
      await wait(scene, 300);
      tell.play({ hole: dealer[1] });
      if (isBlackjack(player)) {
        await wait(scene, 500);
        showHands(dealer, player, false);
        if (isBlackjack(dealer)) settle(-1, 'two blackjacks. ties go to the house.');
        else settle(1.5, 'blackjack. three to two.');
        await wait(scene, 1300);
        return playHand();
      }
      let doubled = false;
      status.setText('[H] hit · [S] stand · [D] double');
      for (;;) {
        const code = await waitKey(m, ['KeyH', 'KeyS', 'KeyD', 'ArrowLeft', 'ArrowRight']);
        if (code === 'ArrowLeft' || code === 'ArrowRight') {
          if (bet.kind === 'chips' && player.length === 2) {
            const steps = [1, 2, 5, 10].filter((n) => chips + netChips >= n);
            const i = steps.indexOf(bet.n);
            bet.n = steps[(i + (code === 'ArrowRight' ? 1 : steps.length - 1)) % steps.length] || 1;
            betText.setText(`stake: ${bet.n} ${bet.kind}\n←/→ change`);
            sfx('click');
          }
          continue;
        }
        if (code === 'KeyD' && player.length === 2 && bet.kind === 'chips' && chips + netChips >= bet.n * 2) {
          bet.n *= 2;
          doubled = true;
          player.push(draw());
          showHands(dealer, player, true);
          sfx('clack');
          break;
        }
        if (code === 'KeyH') {
          player.push(draw());
          showHands(dealer, player, true);
          renderShoe();
          sfx('clack');
          if (bjValue(player) > 21) break;
          continue;
        }
        if (code === 'KeyS') break;
      }
      if (bjValue(player) > 21) {
        showHands(dealer, player, false);
        settle(-1, 'bust.');
      } else {
        showHands(dealer, player, false);
        await wait(scene, 500);
        while (bjValue(dealer) < 17) {
          dealer.push(draw());
          showHands(dealer, player, false);
          renderShoe();
          sfx('clack');
          await wait(scene, 420);
        }
        const d = bjValue(dealer);
        const p = bjValue(player);
        if (d > 21) settle(1, 'Lou busts.');
        else if (p > d) settle(1, `${p} over ${d}.`);
        else if (p === d) settle(-1, `${p} all. ties go to the house.`);
        else settle(-1, `${d} over ${p}.`);
      }
      if (doubled) bet.n /= 2;
      await wait(scene, 1400);
      return playHand();
    };
    const finish = () => {
      const won = wins >= 3;
      status.setText(won ? `${wins} of six. Lou slides a ticket across.` : `${wins} of six. "Sir. The table's always open."`);
      scene.time.delayedCall(1200, () => m.close({ won, wins, netChips, netHearts }, resolve));
    };
    listenAsync(m, (code) => {
      if (code === 'Escape') {
        if (hand <= 1 && netChips === 0 && netHearts === 0) m.close(false, resolve);
        return;
      }
      if (m._pending) m._pending(code);
    });
    playHand();
  });
}

// ---- P3 — concentration vs Favour ----------------------------------------------------------
// A 4x6 grid shown for a few seconds, then eight turns to match six pairs.
// Between turns Favour swaps two face-down cards; his hand rests on the
// table edge when he does, and the cards shiver. Losing costs a heart.
export function concentration(scene, { difficulty = 0 }) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'CONCENTRATION', 'Twenty-four cards, twelve pairs. Look while you can; then eight turns to match six.\n←→↑↓ move · [Enter] turn a card. Favour never touches the cards. Hardly ever.');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 22;
    const rng = seededRng('p3');
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const pool = rng.shuffle([...ranks.map((r) => ({ r, s: 'S' })), ...ranks.map((r) => ({ r, s: 'H' }))]);
    const grid = pool.map((card, i) => ({ card, matched: false, up: false, img: null, i }));
    const COLS = 6;
    const ROWS = 4;
    const posOf = (i) => ({ x: cx - 150 + (i % COLS) * 60, y: cy - 70 + Math.floor(i / COLS) * 50 });
    felt(m, scene, cx, cy, 420, 230);
    const favour = portrait(m, scene, cx - 300, cy - 60, 'portrait-favour');
    m.text(cx - 300, cy - 10, 'MR. FAVOUR', 10, GOLD);
    const tell = new Tell(scene, favour, { base: 'portrait-favour', tell: 'portrait-favour-tell', condition: () => true, difficulty });
    for (const g of grid) {
      const p = posOf(g.i);
      g.img = cardAt(m, scene, p.x, p.y, g.card, false, 1.3);
    }
    const cursor = rect(m, scene, 0, 0, 44, 60, 0xf2d580, 0);
    cursor.setStrokeStyle(2, 0xf2d580).setDepth(m.depth + 4);
    const status = m.text(cx, cy + 128, 'look.', 13, GOLD);
    const tally = m.text(cx + 300, cy - 40, '', 11, INK);
    let cur = 0;
    let turns = 0;
    let pairs = 0;
    let first = null;
    let busy = true;
    let swapsSeen = 0;
    const renderTally = () => tally.setText(`turns ${turns}/8\npairs ${pairs}/6`);
    const render = () => {
      for (const g of grid) {
        if (!scene.tweens.isTweening(g.img)) g.img.setTexture(g.matched || g.up ? cardTextureKey(scene, g.card) : 'gm-card-back');
        g.img.setAlpha(g.matched ? 0.45 : 1);
      }
      const p = posOf(cur);
      cursor.setPosition(p.x, p.y);
      renderTally();
    };
    renderTally();
    // Favour's swap: two face-down unmatched cards trade places (truly), the
    // tell plays, and the two cards shiver for a beat
    const swap = () => {
      const down = grid.filter((g) => !g.matched && !g.up);
      if (down.length < 2) return;
      const a = down[rng.between(0, down.length - 1)];
      let b = down[rng.between(0, down.length - 1)];
      while (b === a) b = down[rng.between(0, down.length - 1)];
      [a.card, b.card] = [b.card, a.card];
      tell.play({});
      swapsSeen += 1;
      for (const g of [a, b]) {
        scene.tweens.add({ targets: g.img, x: g.img.x + 3, duration: 70, yoyo: true, repeat: difficulty >= 2 ? 0 : 1 });
      }
    };
    const start = async () => {
      await wait(scene, difficulty >= 2 ? 2500 : 4000);
      for (const g of grid) g.up = false;
      render();
      status.setText('eight turns. six pairs.');
      busy = false;
    };
    for (const g of grid) g.up = true;
    render();
    start();
    listenAsync(m, async (code) => {
      if (code === 'Escape') {
        if (turns === 0) m.close(false, resolve);
        return;
      }
      if (busy) return;
      if (code === 'ArrowLeft') cur = (cur + 23) % 24;
      else if (code === 'ArrowRight') cur = (cur + 1) % 24;
      else if (code === 'ArrowUp') cur = (cur + 18) % 24;
      else if (code === 'ArrowDown') cur = (cur + 6) % 24;
      else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        const g = grid[cur];
        if (g.matched || g.up) return;
        g.up = true;
        flipCard(scene, g.img, g.card, false);
        sfx('clack');
        if (first === null) {
          first = g;
          render();
          return;
        }
        busy = true;
        turns += 1;
        await wait(scene, 500);
        if (first.card.r === g.card.r) {
          first.matched = g.matched = true;
          pairs += 1;
          sfx('chime');
          status.setText(`a pair. ${pairs} of six.`);
        } else {
          first.up = g.up = false;
          sfx('tick');
          status.setText('no.');
        }
        first = null;
        render();
        if (pairs >= 6) {
          status.setText('six. Favour smiles, and means it less.');
          scene.time.delayedCall(900, () => m.close({ won: true, swapsSeen }, resolve));
          return;
        }
        if (turns >= 8) {
          status.setText(`${pairs} of six. "Again? Of course."`);
          scene.time.delayedCall(900, () => m.close({ won: false, pairs }, resolve));
          return;
        }
        // between turns, the host cheats (every turn at d2+, every other at d0)
        if (difficulty >= 2 || turns % 2 === 1) {
          await wait(scene, 250);
          swap();
          await wait(scene, 450);
        }
        busy = false;
        return;
      }
      sfx('click');
      render();
    });
  });
}

// ---- P4 — three cups --------------------------------------------------------------------------
// Twelve moves, speed rising. From the third round the dealer palms the ball:
// the cups lie. Before the last move he glances at the cup it is really under.
export function threeCups(scene, stake, { chips, difficulty = 0 }) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'THREE CUPS', 'A ball, three cups, twelve moves. Pays two to one.\n←/→ pick a cup · [Enter] lift it. Three rounds. Watch the cups — or watch him.');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 20;
    const rng = seededRng('p4');
    felt(m, scene, cx, cy, 400, 180);
    const dealer = portrait(m, scene, cx - 290, cy - 50, 'portrait-dealer');
    m.text(cx - 290, cy, 'THE DEALER', 10, GOLD);
    const tell = new Tell(scene, dealer, { base: 'portrait-dealer', tell: (c) => (c.real === 0 ? 'portrait-dealer-tell-l' : c.real === 2 ? 'portrait-dealer-tell-r' : 'portrait-dealer'), condition: () => true, difficulty });
    const xs = [cx - 110, cx, cx + 110];
    const cups = xs.map((x) => m.add(scene.add.image(x, cy - 10, 'gm-cup').setScale(2).setScrollFactor(0).setDepth(m.depth + 3)));
    const ball = m.add(scene.add.circle(cx, cy + 14, 8, 0xe8e4d8).setScrollFactor(0).setDepth(m.depth + 2).setVisible(false));
    const cursor = rect(m, scene, cx, cy + 46, 40, 6, 0xf2d580);
    const status = m.text(cx, cy + 112, '', 13, GOLD);
    const tally = m.text(cx + 290, cy - 40, '', 11, INK);
    let round = 0;
    let won = 0;
    let net = 0;
    let lostThird = false;
    let pick = 1;
    let picking = false;
    const renderTally = () => tally.setText(`round ${Math.min(3, round)}/3\nwon ${won}\nchips ${chips + net}`);
    const liftAll = async (ms) => {
      cups.forEach((c) => scene.tweens.add({ targets: c, y: cy - 50, duration: 200, yoyo: true, hold: ms }));
      await wait(scene, 200 + ms + 200);
    };
    const playRound = async () => {
      round += 1;
      if (round > 3) return finish();
      const bet = Math.min(stake.n, chips + net);
      if (bet <= 0) {
        status.setText('nothing left to put down.');
        await wait(scene, 900);
        lostThird = true;
        return finish();
      }
      renderTally();
      let shown = rng.between(0, 2);
      let real = shown;
      ball.setPosition(xs[shown], cy + 14).setVisible(true);
      status.setText(`round ${round}. ${bet} chip${bet > 1 ? 's' : ''} down.`);
      await liftAll(500);
      ball.setVisible(false);
      // the shuffle: the cups change places; from the third round the ball doesn't follow
      const order = [0, 1, 2]; // order[slot] = cup index at that slot
      const palms = round >= 3;
      const moves = 12;
      for (let k = 0; k < moves; k++) {
        const ms = Math.max(90, 260 - k * 14 - round * 20);
        const a = rng.between(0, 2);
        let b = rng.between(0, 2);
        while (b === a) b = rng.between(0, 2);
        [order[a], order[b]] = [order[a], order[b]];
        const ca = cups[order[a]];
        const cb = cups[order[b]];
        scene.tweens.add({ targets: ca, x: xs[a], duration: ms });
        scene.tweens.add({ targets: cb, x: xs[b], duration: ms });
        if (shown === a) shown = b;
        else if (shown === b) shown = a;
        await wait(scene, ms + 20);
      }
      // the palm: from the third round the ball is wherever he likes it least
      // for you. Either way, before the shuffle ends, he glances at the truth.
      real = palms ? (shown + 1 + rng.between(0, 1)) % 3 : shown;
      tell.play({ real });
      await wait(scene, 320);
      picking = true;
      pick = 1;
      cursor.setX(xs[pick]).setVisible(true);
      status.setText('which one?');
      for (;;) {
        const code = await waitKey(m, ['ArrowLeft', 'ArrowRight', 'Enter', 'KeyE', 'Space']);
        if (code === 'ArrowLeft') pick = (pick + 2) % 3;
        else if (code === 'ArrowRight') pick = (pick + 1) % 3;
        else break;
        cursor.setX(xs[pick]);
        sfx('click');
      }
      picking = false;
      cursor.setVisible(false);
      ball.setPosition(xs[real], cy + 14).setVisible(true);
      // the cup at slot `pick` lifts; the cups are visually at xs[slot] now
      const cupAt = cups.find((c) => Math.abs(c.x - xs[pick]) < 4) || cups[pick];
      scene.tweens.add({ targets: cupAt, y: cy - 60, duration: 220 });
      await wait(scene, 400);
      if (pick === real) {
        won += 1;
        net += bet * 2;
        status.setText(`there. two to one: ${bet * 2}.`);
        scene.winFx(bet * 2, { big: true });
      } else {
        net -= bet;
        if (round === 3) lostThird = true;
        status.setText(palms ? 'it was never under the cups.' : 'no.');
        scene.lossFx();
      }
      renderTally();
      await wait(scene, 1400);
      scene.tweens.add({ targets: cupAt, y: cy - 10, duration: 200 });
      ball.setVisible(false);
      cups.forEach((c, i) => (c.x = xs[i]));
      await wait(scene, 300);
      return playRound();
    };
    const finish = () => {
      status.setText(lostThird ? 'the window at the end of the corridor rattles open.' : `${won} of three.`);
      scene.time.delayedCall(1100, () => m.close({ won, net, lostThird, passed: won >= 2 }, resolve));
    };
    listenAsync(m, (code) => {
      if (code === 'Escape') {
        if (round <= 1 && !picking && net === 0) m.close(false, resolve);
        return;
      }
      if (m._pending) m._pending(code);
    });
    playRound();
  });
}

// ---- P5 — five-card draw -------------------------------------------------------------------------
// Three opponents, eight hands, one draw, a raise cap of three. The Widow
// never bluffs; the Kid always does (his check is strength); the Accountant
// bluffs only when he adjusts his glasses — and he reads Jo's eyebrow,
// unless Jo holds [↓] for a poker face. The trumpet is in the pot.
export function fiveCardDraw(scene, { chips, difficulty = 0, trumpetHolder = 'pot' }) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'FIVE-CARD DRAW', 'Ante 1. Five cards, one draw of up to three, one round of betting, showdown. Eight hands.\n←/→ + [Enter] mark discards · [D] draw · [C] check/call · [B] bet/raise · [F] fold · hold [↓] for a poker face');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 24;
    const rng = seededRng('p5');
    felt(m, scene, cx, cy - 6, 640, 290);
    const OPP = [
      { id: 'widow', name: 'THE WIDOW', x: cx - 200 },
      { id: 'kid', name: 'THE KID', x: cx },
      { id: 'accountant', name: 'THE ACCOUNTANT', x: cx + 200 },
    ];
    const ps = OPP.map((o) => {
      const img = portrait(m, scene, o.x, cy - 118, `portrait-${o.id}`, 0.8);
      const label = m.text(o.x, cy - 80, o.name, 9, GOLD);
      const stack = m.text(o.x, cy - 68, '', 9, INK);
      return { ...o, img, label, stack, chips: 12, cards: [], in: true, cardImgs: [], action: m.text(o.x, cy - 32, '', 10, INK) };
    });
    const accTell = new Tell(scene, ps[2].img, { base: 'portrait-accountant', tell: 'portrait-accountant-tell', condition: (c) => c.bluffing, difficulty, falsePositive: difficulty >= 3 ? 0.2 : 0 });
    const joImg = portrait(m, scene, cx - 290, cy + 70, 'portrait-jo', 0.9);
    m.text(cx - 290, cy + 118, 'JO', 10, GOLD);
    const joStack = m.text(cx - 290, cy + 132, '', 10, INK);
    const potText = m.text(cx, cy + 4, '', 12, GOLD);
    const horn = m.add(scene.add.image(cx + 60, cy + 4, 'tool-trumpet').setScale(1.6).setScrollFactor(0).setDepth(m.depth + 3));
    const status = m.text(cx, cy + 150, '', 12, INK);
    const tally = m.text(cx + 290, cy + 120, '', 10, DIM);
    const downKey = scene.input.keyboard.addKey('DOWN');
    let jo = { chips, cards: [], imgs: [], marks: [false, false, false, false, false], in: true };
    let hand = 0;
    let pot = 0;
    let holder = trumpetHolder; // 'pot' | 'jo' | opponent id
    let cur = 0;
    let gotTrumpet = false;
    let bust = false;
    const cardY = cy + 80;
    const cardX = (i) => cx - 100 + i * 50;
    const renderStacks = () => {
      ps.forEach((p) => p.stack.setText(`${p.chips} chips${holder === p.id ? ' · the horn' : ''}`));
      joStack.setText(`${jo.chips} chips${holder === 'jo' ? ' · the horn' : ''}`);
      potText.setText(`POT ${pot}`);
      horn.setVisible(holder === 'pot');
      tally.setText(`hand ${Math.min(8, hand)}/8`);
    };
    const renderJo = (cursorOn) => {
      jo.imgs.forEach((img, i) => {
        img.setY(cardY - (jo.marks[i] ? 14 : 0));
        img.setTint(jo.marks[i] ? 0x9a9aaa : 0xffffff);
      });
      cursor.setVisible(cursorOn).setX(cardX(cur));
    };
    const cursor = rect(m, scene, 0, cardY + 48, 44, 5, 0xf2d580).setVisible(false);
    const clearTable = () => {
      jo.imgs.forEach((i) => i.destroy());
      jo.imgs = [];
      ps.forEach((p) => {
        p.cardImgs.forEach((i) => i.destroy());
        p.cardImgs = [];
        p.action.setText('');
      });
    };
    const showOppCards = (p, up) => {
      p.cardImgs.forEach((i) => i.destroy());
      p.cardImgs = p.cards.map((c, i) => cardAt(m, scene, p.x - 44 + i * 22, cy - 50, c, !up, 0.9));
      if (!p.in) p.cardImgs.forEach((i) => i.setAlpha(0.35));
    };
    const strengthOf = (p) => pokerStrength(p.cards);

    const playHand = async () => {
      hand += 1;
      if (hand > 8) return finish();
      if (jo.chips < 1) {
        bust = true;
        return finish();
      }
      clearTable();
      const deck = newDeck(rng);
      pot = 0;
      jo.chips -= 1;
      pot += 1;
      ps.forEach((p) => {
        p.in = p.chips >= 1;
        if (p.in) {
          p.chips -= 1;
          pot += 1;
        }
      });
      jo.in = true;
      jo.cards = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
      ps.forEach((p) => (p.cards = p.in ? [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()] : []));
      jo.marks = [false, false, false, false, false];
      jo.imgs = jo.cards.map((c, i) => cardAt(m, scene, cardX(i), cardY, c, false, 1.6));
      ps.forEach((p) => p.in && showOppCards(p, false));
      // the horn rides in the pot whenever its holder is dealt in
      const hornIn = holder === 'pot' || (holder !== 'jo' && ps.find((p) => p.id === holder && p.in)) || holder === 'jo';
      horn.setVisible(!!hornIn && holder !== 'jo');
      renderStacks();
      joImg.setTexture('portrait-jo');
      // --- the draw
      cur = 0;
      status.setText('mark up to three to throw away, then [D] draw.');
      renderJo(true);
      for (;;) {
        const code = await waitKey(m, ['ArrowLeft', 'ArrowRight', 'Enter', 'Space', 'KeyE', 'KeyD']);
        if (code === 'ArrowLeft') cur = (cur + 4) % 5;
        else if (code === 'ArrowRight') cur = (cur + 1) % 5;
        else if (code === 'KeyD') break;
        else {
          const n = jo.marks.filter(Boolean).length;
          if (jo.marks[cur] || n < 3) jo.marks[cur] = !jo.marks[cur];
          else sfx('fail');
        }
        sfx('click');
        renderJo(true);
      }
      jo.cards = jo.cards.map((c, i) => (jo.marks[i] ? deck.pop() : c));
      jo.marks = [false, false, false, false, false];
      jo.imgs.forEach((img, i) => flipCard(scene, img, jo.cards[i]));
      ps.forEach((p) => {
        if (!p.in) return;
        const keep = keepMask(p.cards);
        const thrown = keep.filter((k) => !k).length;
        p.cards = p.cards.map((c, i) => (keep[i] ? c : deck.pop()));
        p.action.setText(thrown ? `draws ${thrown}` : 'stands pat');
      });
      renderJo(false);
      await wait(scene, 600);
      // --- Jo's tell: the eyebrow, unless he holds the face
      const joStrong = pokerStrength(jo.cards) >= 0.5;
      const pokerFace = downKey.isDown;
      const browShown = joStrong && !pokerFace;
      if (browShown) joImg.setTexture('portrait-jo-brow');
      // --- betting: the three act, then Jo
      let toCall = 0;
      let raises = 0;
      const decide = (p) => {
        const s = strengthOf(p);
        if (p.id === 'widow') return s >= 0.45 ? 'bet' : 'check';
        if (p.id === 'kid') return s >= 0.45 ? 'check' : 'bet';
        const bluff = s < 0.5 && rng.frac() < 0.3;
        p.bluffing = bluff;
        return s >= 0.5 || bluff ? 'bet' : 'check';
      };
      for (const p of ps) {
        if (!p.in) continue;
        const act = decide(p);
        if (p.id === 'accountant') accTell.play({ bluffing: !!p.bluffing });
        if (act === 'bet' && raises < 3 && p.chips >= 1) {
          p.chips -= 1;
          pot += 1;
          toCall = 1;
          raises += 1;
          p.action.setText(toCall ? 'bets 1' : 'checks');
        } else p.action.setText(toCall ? 'calls' : 'checks');
        if (act !== 'bet' && toCall && p.chips >= 1) {
          p.chips -= 1;
          pot += 1;
        }
        renderStacks();
        await wait(scene, 450);
      }
      status.setText(toCall ? `1 to call. [C] call · [B] raise · [F] fold${pokerFace ? ' · poker face' : ''}` : `[C] check · [B] bet · [F] fold${pokerFace ? ' · poker face' : ''}`);
      let joRaised = false;
      for (;;) {
        const code = await waitKey(m, ['KeyC', 'KeyB', 'KeyF']);
        if (code === 'KeyF') {
          jo.in = false;
          status.setText('folded.');
          break;
        }
        if (code === 'KeyC') {
          if (toCall && jo.chips >= 1) {
            jo.chips -= 1;
            pot += 1;
          } else if (toCall) {
            jo.in = false;
            status.setText('nothing to call with.');
          }
          break;
        }
        if (code === 'KeyB') {
          if (jo.chips < toCall + 1 || raises >= 3) {
            sfx('fail');
            continue;
          }
          jo.chips -= toCall + 1;
          pot += toCall + 1;
          raises += 1;
          joRaised = true;
          break;
        }
      }
      renderStacks();
      if (jo.in && joRaised) {
        // they call or fold: the Widow with a hand, the Kid on nerve, the
        // Accountant unless he has read the eyebrow
        for (const p of ps) {
          if (!p.in) continue;
          const s = strengthOf(p);
          let call;
          if (p.id === 'widow') call = s >= 0.45;
          else if (p.id === 'kid') call = s >= 0.3 || rng.frac() < 0.5;
          else call = browShown ? false : s >= 0.4 || p.bluffing;
          if (call && p.chips >= 1) {
            p.chips -= 1;
            pot += 1;
            p.action.setText('calls');
          } else {
            p.in = false;
            p.action.setText(p.id === 'accountant' && browShown ? 'folds. (he saw the eyebrow)' : 'folds');
            showOppCards(p, false);
          }
          renderStacks();
          await wait(scene, 400);
        }
      }
      // --- showdown
      const alive = ps.filter((p) => p.in);
      await wait(scene, 300);
      let winner = null;
      if (!jo.in) {
        winner = alive.sort((a, b) => comparePoker(b.cards, a.cards))[0] || null;
        alive.forEach((p) => showOppCards(p, true));
      } else if (alive.length === 0) winner = 'jo';
      else {
        alive.forEach((p) => showOppCards(p, true));
        let best = 'jo';
        let bestCards = jo.cards;
        for (const p of alive) {
          const d = comparePoker(p.cards, bestCards);
          if (d > 0) {
            best = p;
            bestCards = p.cards;
          }
        }
        winner = best;
      }
      const hornWasIn = horn.visible;
      if (winner === 'jo') {
        jo.chips += pot;
        status.setText(`Jo takes ${pot} with ${evalPoker(jo.cards).name}.`);
        if (hornWasIn) {
          holder = 'jo';
          gotTrumpet = true;
          status.setText(`Jo takes ${pot} — and the horn — with ${evalPoker(jo.cards).name}.`);
        }
        scene.winFx(pot, { big: pot >= 6 });
      } else if (winner) {
        winner.chips += pot;
        status.setText(`${winner.name} takes ${pot}${jo.in ? ` with ${evalPoker(winner.cards).name}` : ''}.`);
        if (hornWasIn) holder = winner.id;
        if (jo.in) scene.lossFx();
      }
      pot = 0;
      renderStacks();
      await wait(scene, 1700);
      return playHand();
    };
    const finish = () => {
      status.setText(bust ? 'out. the door opens from the other side.' : gotTrumpet ? 'eight hands. the horn goes back in its case.' : 'eight hands. the horn stays on the table.');
      scene.time.delayedCall(1200, () => m.close({ chips: jo.chips, trumpet: gotTrumpet, bust, hands: hand }, resolve));
    };
    listenAsync(m, (code) => {
      if (code === 'Escape') {
        if (hand <= 1 && pot === 0) m.close(false, resolve);
        return;
      }
      if (m._pending) m._pending(code);
    });
    playHand();
  });
}

// ---- P6 — face up ----------------------------------------------------------------------------------
// Dealt face up. Jo has nothing; Favour has a full house; the stake is the
// marker. BET glows. STAND UP sits small and dim where [Esc] usually is.
// Resolves 'bet' or 'stand'. Escape does nothing here.
export function faceUp(scene, { marker, chips }) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'FACE UP', 'One hand. For everything.');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 10;
    felt(m, scene, cx, cy - 20, 520, 220);
    const favour = portrait(m, scene, cx - 290, cy - 60, 'portrait-favour');
    m.text(cx - 290, cy - 10, 'MR. FAVOUR', 10, GOLD);
    const joCards = [{ r: 2, s: 'C' }, { r: 5, s: 'D' }, { r: 7, s: 'H' }, { r: 9, s: 'S' }, { r: 11, s: 'D' }];
    const favCards = [{ r: 13, s: 'S' }, { r: 13, s: 'H' }, { r: 13, s: 'D' }, { r: 8, s: 'C' }, { r: 8, s: 'S' }];
    const fImgs = favCards.map((c, i) => cardAt(m, scene, cx - 100 + i * 50, cy - 70, c, false, 1.6));
    const jImgs = joCards.map((c, i) => cardAt(m, scene, cx - 100 + i * 50, cy + 40, c, false, 1.6));
    const fLabel = m.text(cx, cy - 20, 'Favour: a full house, kings over eights.', 12, INK);
    const jLabel = m.text(cx, cy + 92, 'Jo: nothing. Jack high.', 12, INK);
    const stakeText = m.text(cx, cy + 118, `THE STAKE: the marker (${marker})${chips ? ` and ${chips} pending` : ''}`, 11, GOLD);
    const betBtn = m.text(cx, cy + 150, 'BET', 26, GOLD);
    const glow = rect(m, scene, cx, cy + 150, 120, 40, 0xf2d580, 0.12);
    scene.tweens.add({ targets: glow, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    // where "[Esc] step away" sits in every other panel: small, dim, true
    const esc = m.objs[4];
    esc.setText('STAND UP').setColor(DIM).setFontSize(11);
    let choice = 'bet';
    const render = () => {
      betBtn.setColor(choice === 'bet' ? GOLD : '#8a8478');
      glow.setVisible(choice === 'bet');
      esc.setColor(choice === 'stand' ? INK : DIM);
    };
    render();
    listenAsync(m, async (code) => {
      if (m.busy) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(code)) {
        choice = choice === 'bet' ? 'stand' : 'bet';
        sfx('click');
        render();
        return;
      }
      if (code === 'Enter' || code === 'KeyE' || code === 'Space' || code === 'KeyX') {
        if (choice === 'stand') {
          m.busy = true;
          sfx('clack');
          m.close('stand', resolve);
          return;
        }
        m.busy = true;
        sfx('clack');
        stakeText.setText(`THE STAKE: the marker (${marker + 10}). A second marker. Of course.`);
        await wait(scene, 900);
        // the re-deal: the cards come again, and this time they are his
        const royal = [{ r: 10, s: 'S' }, { r: 11, s: 'S' }, { r: 12, s: 'S' }, { r: 13, s: 'S' }, { r: 14, s: 'S' }];
        const pair = [{ r: 4, s: 'C' }, { r: 4, s: 'H' }, { r: 9, s: 'D' }, { r: 6, s: 'C' }, { r: 2, s: 'S' }];
        jImgs.forEach((img, i) => scene.time.delayedCall(i * 120, () => flipCard(scene, img, royal[i])));
        fImgs.forEach((img, i) => scene.time.delayedCall(i * 120, () => flipCard(scene, img, pair[i])));
        await wait(scene, 900);
        jLabel.setText('Jo: a royal flush.');
        fLabel.setText('Favour: a pair of fours.');
        betBtn.setText('YOU WIN');
        sfx('chime');
        await wait(scene, 1400);
        m.close('bet', resolve);
      }
    });
  });
}

// ---- the roulette tables (the floor's bet points) ---------------------------------------------
// Red or black at even money, or one number at 35:1. Thirty-eight pockets:
// two of them green, and the green is the house.
export function roulette(scene, stake) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'ROULETTE', 'Red or black pays even money. A number pays 35 to 1. Two greens.\n←/→ choose · ↑/↓ change the number · [Enter] spin');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 10;
    const rng = seededRng('roulette', scene.rouletteSpins || 0);
    felt(m, scene, cx, cy - 10, 420, 150);
    const opts = ['RED', 'BLACK', 'NUMBER'];
    let cur = 0;
    let num = 17;
    const labels = opts.map((o, i) => m.text(cx - 140 + i * 140, cy - 40, o, 18));
    const numText = m.text(cx + 140, cy - 12, '', 12, INK);
    const status = m.text(cx, cy + 40, '', 13, GOLD);
    const render = () => {
      labels.forEach((t, i) => t.setColor(i === cur ? GOLD : i === 0 ? RED : i === 1 ? INK : DIM));
      numText.setText(cur === 2 ? `${num}` : '');
    };
    render();
    let busy = false;
    m.listen((code) => {
      if (busy) return;
      if (code === 'ArrowLeft') cur = (cur + 2) % 3;
      else if (code === 'ArrowRight') cur = (cur + 1) % 3;
      else if (code === 'ArrowUp') num = (num + 1) % 37;
      else if (code === 'ArrowDown') num = (num + 36) % 37;
      else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
        busy = true;
        scene.rouletteSpins = (scene.rouletteSpins || 0) + 1;
        const pocket = rng.between(0, 37); // 0 and 37 are the greens
        const green = pocket === 0 || pocket === 37;
        const red = !green && pocket % 2 === 1;
        const label = green ? (pocket === 0 ? '0' : '00') : `${pocket} ${red ? 'red' : 'black'}`;
        let steps = 0;
        const tick = scene.time.addEvent({
          delay: 70,
          repeat: 14,
          callback: () => {
            steps += 1;
            status.setText(`…${rng.between(0, 36)}`);
            sfx('tick');
            if (steps === 15) {
              status.setText(label);
              const won = cur === 0 ? red : cur === 1 ? !green && !red : !green && pocket === num;
              const mult = cur === 2 ? 35 : 1;
              scene.time.delayedCall(500, () => m.close({ won, mult }, resolve));
              tick.remove();
            }
          },
        });
        return;
      }
      sfx('click');
      render();
    }, resolve);
  });
}

void Phaser;
