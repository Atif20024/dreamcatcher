import Phaser from 'phaser';
import { paintTexture, hex, rgba } from '../art/paint.js';
import { getSave } from '../utils/save.js';

// THE LAST HAND §6 — the engine under the six games: a seeded deck, hand
// evaluation for blackjack and draw poker, a Tell (a frame and the truth it
// carries), and one card renderer shared by every panel and the Deal.

export const SUITS = ['S', 'H', 'D', 'C'];
export const SUIT_GLYPH = { S: '♠', H: '♥', D: '♦', C: '♣' };
// four suits in the level's accent (brass) and danger (red) colours
export const SUIT_COLOR = { S: '#e9b84a', C: '#e9b84a', H: '#d5443c', D: '#d5443c' };
const RANKS = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
export const rankLabel = (r) => RANKS[r] || String(r);
export const cardLabel = (c) => `${rankLabel(c.r)}${SUIT_GLYPH[c.s]}`;

// one generator per game per save, so retries are the same cards, not new luck
export function seededRng(tag, salt = 0) {
  const sv = getSave();
  const seed = `${tag}:${sv.dreamsCaught || 0}:${(sv.flags && sv.flags.gm && sv.flags.gm.seed) || 'tonight'}:${salt}`;
  return new Phaser.Math.RandomDataGenerator([seed]);
}

export function newDeck(rng) {
  const d = [];
  for (const s of SUITS) for (let r = 2; r <= 14; r++) d.push({ r, s });
  return rng ? rng.shuffle(d) : d;
}

// ---- blackjack --------------------------------------------------------------
export function bjValue(hand) {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.r === 14) {
      aces += 1;
      total += 11;
    } else total += Math.min(10, c.r);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}
export const isTenValue = (c) => c.r >= 10 && c.r <= 13;
export const isBlackjack = (hand) => hand.length === 2 && bjValue(hand) === 21;

// ---- draw poker ---------------------------------------------------------------
const CATS = ['high card', 'a pair', 'two pair', 'three of a kind', 'a straight', 'a flush', 'a full house', 'four of a kind', 'a straight flush'];
export function evalPoker(hand) {
  const ranks = hand.map((c) => c.r).sort((a, b) => b - a);
  const counts = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([r, n]) => ({ r: +r, n }))
    .sort((a, b) => b.n - a.n || b.r - a.r);
  const flush = hand.every((c) => c.s === hand[0].s);
  const uniq = [...new Set(ranks)];
  let straight = uniq.length === 5 && uniq[0] - uniq[4] === 4;
  let top = uniq[0];
  if (!straight && uniq.length === 5 && uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) {
    straight = true; // the wheel
    top = 5;
  }
  let cat = 0;
  if (straight && flush) cat = 8;
  else if (groups[0].n === 4) cat = 7;
  else if (groups[0].n === 3 && groups[1].n === 2) cat = 6;
  else if (flush) cat = 5;
  else if (straight) cat = 4;
  else if (groups[0].n === 3) cat = 3;
  else if (groups[0].n === 2 && groups[1].n === 2) cat = 2;
  else if (groups[0].n === 2) cat = 1;
  const order = straight ? [top] : groups.map((g) => g.r);
  return { cat, name: CATS[cat], order, groups };
}
export function comparePoker(a, b) {
  const ea = evalPoker(a);
  const eb = evalPoker(b);
  if (ea.cat !== eb.cat) return ea.cat - eb.cat;
  for (let i = 0; i < Math.max(ea.order.length, eb.order.length); i++) {
    const d = (ea.order[i] || 0) - (eb.order[i] || 0);
    if (d) return d;
  }
  return 0;
}
// a hand's rough strength 0..1, for the opponents' decisions
export function pokerStrength(hand) {
  const e = evalPoker(hand);
  return Math.min(1, e.cat / 6 + (e.cat === 0 ? (e.order[0] - 2) / 60 : e.cat === 1 ? (e.order[0] - 2) / 40 : 0));
}
// which cards a sensible player keeps on the draw
export function keepMask(hand) {
  const e = evalPoker(hand);
  const keep = hand.map(() => false);
  if (e.cat >= 4) return hand.map(() => true);
  const keepRanks = new Set(e.groups.filter((g) => g.n >= 2).map((g) => g.r));
  if (keepRanks.size) return hand.map((c) => keepRanks.has(c.r));
  // nothing: keep the two highest
  const sorted = [...hand].sort((a, b) => b.r - a.r);
  return hand.map((c) => c === sorted[0] || c === sorted[1]);
  void keep;
}

// ---- tells ----------------------------------------------------------------------
// A tell is true information: a frame (a texture) and the condition under
// which it shows. It plays for a beat — two beats at difficulty 0-1, one at
// difficulty 2+ (§7) — then the face returns. `falsePositive` is the
// Accountant's 20% at d3+.
export class Tell {
  constructor(scene, img, { base, tell, condition, difficulty = 0, falsePositive = 0, ms = null }) {
    this.scene = scene;
    this.img = img;
    this.base = base;
    this.tell = tell;
    this.condition = condition;
    this.frames = difficulty >= 2 ? 1 : 2;
    this.ms = ms || (difficulty >= 2 ? 220 : 420);
    this.falsePositive = falsePositive;
    this.rng = seededRng('tell-noise');
  }

  // decide for this situation and show the frame if it applies; returns what showed
  play(ctx) {
    let shows = !!this.condition(ctx);
    if (!shows && this.falsePositive > 0 && this.rng.frac() < this.falsePositive) shows = true;
    if (!shows || !this.img || !this.img.active) return false;
    const tex = typeof this.tell === 'function' ? this.tell(ctx) : this.tell;
    if (tex === this.base) {
      // the tell is a nod, not a frame: the head dips
      this.scene.tweens.add({ targets: this.img, y: this.img.y + 4, duration: this.ms / 2, yoyo: true, repeat: this.frames - 1 });
      return true;
    }
    this.img.setTexture(tex);
    for (let i = 1; i < this.frames; i++) {
      this.scene.time.delayedCall(this.ms * i, () => this.img.active && this.img.setTexture(i % 2 ? this.base : tex));
    }
    this.scene.time.delayedCall(this.ms * this.frames, () => this.img.active && this.img.setTexture(this.base));
    return true;
  }
}

// ---- the renderer --------------------------------------------------------------
// 7x10 cells at 2x: a 28x40 face, painted once per card and cached. Suits in
// accent/danger. `faceDown` draws the lattice back.
export function cardTextureKey(scene, card, faceDown = false) {
  if (faceDown || !card) return 'gm-card-back';
  const key = `gm-card-${rankLabel(card.r)}${card.s}`;
  if (scene.textures.exists(key)) return key;
  paintTexture(scene, key, 28, 40, (ctx, w, h) => {
    ctx.fillStyle = hex(0xf2eee4);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = rgba(0x8a8480, 0.9);
    ctx.fillRect(0, 0, w, 1);
    ctx.fillRect(0, h - 1, w, 1);
    ctx.fillRect(0, 0, 1, h);
    ctx.fillRect(w - 1, 0, 1, h);
    ctx.fillStyle = rgba(0xc8c0b0, 0.5);
    ctx.fillRect(1, h - 3, w - 2, 2);
    ctx.fillStyle = SUIT_COLOR[card.s];
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(rankLabel(card.r), 3, 2);
    ctx.font = '12px monospace';
    ctx.fillText(SUIT_GLYPH[card.s], 3, 13);
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SUIT_GLYPH[card.s], w / 2 + 4, h / 2 + 8);
  }, `${card.r}${card.s}`);
  return key;
}

// a card on screen (HUD-space when `fixed`), scaled 2x by default
export function drawCard(scene, x, y, card, { faceDown = false, scale = 2, depth = 302, fixed = true } = {}) {
  const img = scene.add.image(x, y, cardTextureKey(scene, card, faceDown)).setScale(scale).setDepth(depth);
  if (fixed) img.setScrollFactor(0);
  img.card = card;
  img.faceDown = faceDown;
  return img;
}

// flip a drawn card over (a squeeze on x, then the other face)
export function flipCard(scene, img, card, faceDown = false, ms = 160) {
  const sx = img.scaleX;
  scene.tweens.add({
    targets: img,
    scaleX: 0.05,
    duration: ms / 2,
    ease: 'quad.in',
    onComplete: () => {
      if (!img.active) return;
      img.setTexture(cardTextureKey(scene, card, faceDown));
      img.card = card;
      img.faceDown = faceDown;
      scene.tweens.add({ targets: img, scaleX: sx, duration: ms / 2, ease: 'quad.out' });
    },
  });
}

void Phaser;
