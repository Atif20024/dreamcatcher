import { getSave, updateSave } from '../utils/save.js';
import { dreamById } from '../data/dreams.js';

// Collectibles §8 — the wallet. Coins are added the moment they are picked
// up and deducted when death scatters them; both write the save, so quitting
// mid-level never loses what was honestly collected (or dodges the scatter).
// Hearts: caught dreams add up to five (tiers stop at two catches, so hearts must
// not run on ahead of them); every whole heart of shards (found or bought) is one
// more on top of that, up to the cap. (Coins are never required: this is the most
// a full wallet and every shard can do.)
export const HEARTS_CAP = 8;
const CAUGHT_HEARTS_CAP = 5;
export function heartsMax(difficulty = 0, shards = 0) {
  return Math.min(HEARTS_CAP, Math.min(CAUGHT_HEARTS_CAP, 3 + difficulty) + Math.floor((shards || 0) / 3));
}
// the row is as long as it gets: another shard buys nothing
export const heartsFull = (difficulty = 0, shards = 0) => heartsMax(difficulty, shards) >= HEARTS_CAP;

// Bilal's prices. A full run pays about 1,850 (every coin; a real one maybe 1,100)
// against about 2,300 on the shelf: enough for what matters, not for everything.
export const PRICES = { tea: 20, shards: [60, 120, 200], postcard: 100, ticket: 150 };

export function getWallet() {
  return getSave().wallet;
}

export function coinWorth(dreamId) {
  const d = dreamById(dreamId);
  return (d && d.coin && d.coin.worth) || 1;
}

// n coins of one dream -> worth added; returns the new totals
export function addCoins(dreamId, n = 1) {
  const worth = coinWorth(dreamId) * n;
  const s = updateSave((sv) => {
    sv.wallet.total += worth;
    sv.wallet.byDream[dreamId] = (sv.wallet.byDream[dreamId] || 0) + worth;
  });
  return s.wallet;
}

// death scatter: remove worth (floored at zero) before re-collection
export function deductWorth(dreamId, worth) {
  const s = updateSave((sv) => {
    const take = Math.min(worth, sv.wallet.total);
    sv.wallet.total -= take;
    sv.wallet.byDream[dreamId] = Math.max(0, (sv.wallet.byDream[dreamId] || 0) - take);
  });
  return s.wallet;
}

// Bilal's stall: spend from the total. Returns false if it cannot be paid.
export function spend(cost) {
  let ok = false;
  updateSave((sv) => {
    if (sv.wallet.total >= cost) {
      sv.wallet.total -= cost;
      ok = true;
    }
  });
  return ok;
}
