import { getSave, updateSave } from '../utils/save.js';
import { dreamById } from '../data/dreams.js';

// Collectibles §8 — the wallet. Coins are added the moment they are picked
// up and deducted when death scatters them; both write the save, so quitting
// mid-level never loses what was honestly collected (or dodges the scatter).
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
