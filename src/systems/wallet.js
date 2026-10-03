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

// THE LAST HAND §3.1/§3.5 — house money. Chips are `pending` until they are
// cashed at a cage; the `marker` is debt that never goes away. Both live on
// the wallet so a quit mid-level keeps the tally honest. cash(): pending −
// marker → total (in chip worth); whatever the marker ate stays owed.
export function getPending() {
  return getSave().wallet.pending || 0;
}
export function getMarker() {
  return getSave().wallet.marker || 0;
}
export function setPending(n) {
  return updateSave((sv) => (sv.wallet.pending = Math.max(0, n))).wallet;
}
export function addMarker(n) {
  return updateSave((sv) => (sv.wallet.marker = Math.max(0, (sv.wallet.marker || 0) + n))).wallet;
}
// returns { chips, debt, paid, remainder } — the cage's receipt
export function cash(dreamId = 'gambler') {
  const worth = coinWorth(dreamId);
  let out = null;
  updateSave((sv) => {
    const chips = sv.wallet.pending || 0;
    const debt = sv.wallet.marker || 0;
    const paid = Math.min(chips, debt);
    const remainder = chips - paid;
    sv.wallet.marker = debt - paid;
    sv.wallet.pending = 0;
    sv.wallet.total += remainder * worth;
    sv.wallet.byDream[dreamId] = (sv.wallet.byDream[dreamId] || 0) + remainder * worth;
    out = { chips, debt, paid, remainder };
  });
  return out;
}
// the dream ends: pending chips are voided (the ending card says how many)
export function voidPending() {
  let n = 0;
  updateSave((sv) => {
    n = sv.wallet.pending || 0;
    sv.wallet.pending = 0;
  });
  return n;
}
