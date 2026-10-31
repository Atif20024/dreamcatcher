import Phaser from 'phaser';

// THE LAST HAND §3.3 — the Deal. Every room with card platforms has its own
// seeded sequence: number cards hold, face cards flip Jo off backward, aces
// are solid and pay a chip. The room shows its deck somewhere (a discard
// tray, a mural) — except the back-room corridor, which shows nothing.
export const DECKS = {
  pit: { seed: 'the-pit', shown: 'tray' },
  terrace: { seed: 'cigar-terrace', shown: 'tray', shuffled: true },
  corridor: { seed: 'nobody-shows', shown: null },
};

const SUITS = ['S', 'H', 'D', 'C'];

// difficulty §7: aces 20% -> 10%, faces 20% -> 30%
export function dealSequence(id, n, difficulty = 0, salt = '') {
  const rand = new Phaser.Math.RandomDataGenerator([DECKS[id].seed + salt]);
  const aceP = difficulty >= 2 ? 0.1 : 0.2;
  const faceP = difficulty >= 2 ? 0.3 : 0.2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = rand.frac();
    const s = SUITS[rand.between(0, 3)];
    if (t < aceP) out.push({ r: 14, s, kind: 'ace' });
    else if (t < aceP + faceP) out.push({ r: rand.between(11, 13), s, kind: 'face' });
    else out.push({ r: rand.between(2, 10), s, kind: 'number' });
  }
  // the first card is always a number, so the row is never a wall at its start
  if (out[0].kind !== 'number') out[0] = { r: 7, s: out[0].s, kind: 'number' };
  return out;
}
