import { FIRST_PARAGRAPH, NAPKIN, PAGE_THREE } from './cast.js';

// THE SECOND DRAFT: the sums behind the desks and the pen, pure so tests can
// run them without a browser.

// The pages each gate wants. Perfect desks and the napkin come to 60; the
// lowest a sat desk pays comes to 47, so these leave room for a poor typist,
// one pigeon and a redraft. The flag names are the old 12/30/60, kept because
// saved runs and the warps carry them.
export const PAGE_GATES = { pages12: 10, pages30: 25, pages60: 50 };

export const DESK_TYPO_CAP = 3; // what one desk can add to the debt
export const TYPO_CAP = 8; // what is ever carried to the printworks

// a sitting pays three quarters for turning up, the last quarter for accuracy
export const deskPay = (pages, hits, total) => Math.round(pages * (0.75 + (0.25 * hits) / (total || 1)));

// A desk can be sat again until it has paid in full: the best sitting counts,
// and a redraft always gains at least a page, so nobody is locked out of a
// gate by their typing.
export const deskTotal = (pages, best, hits, total) => (best > 0 ? Math.min(pages, Math.max(best + 1, deskPay(pages, hits, total))) : deskPay(pages, hits, total));

export const carryTypos = (carried, typos) => Math.min(TYPO_CAP, carried + Math.min(DESK_TYPO_CAP, typos));

// a key pressed `ms` from the nearest letter's moment: on the beat it is judged;
// close by it is a typo; with no letter near it was a hand on the keyboard
export const keyVerdict = (ms, window = 170, near = 400) => (ms <= window ? 'judge' : ms <= near ? 'typo' : 'ignore');

// W-M3: the desks type the book. Desk 1 and the ending share a sentence; desks
// 2 and 4 are most of page three, so chapter 5 is a page Jo has already typed.
const PAGE3 = PAGE_THREE.join(' ');
const between = (text, from, to) => text.slice(text.indexOf(from), text.indexOf(to) + to.length);
export const DESK_TEXT = {
  desk1: between(FIRST_PARAGRAPH, 'He got up', 'from him.'),
  desk2: between(PAGE3, 'The copy shop', 'an hour;'),
  desk3: NAPKIN.join(' '),
  desk4: `${between(PAGE3, 'He said the machines', 'when it was watched.')} ${between(PAGE3, 'He put the good', 'on top.')}`,
};
export const deskWords = (id) => DESK_TEXT[id].split(' ');
export const keyOf = (word) => word.match(/[a-z]/i)[0].toLowerCase();

// how a word prints when the key was missed: two letters swapped
export function garble(word) {
  const i = word.search(/[a-z]{2}/i);
  return i < 0 ? word : word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
}

// the foot of the typing box holds the last line or two of what is written
export function tailText(s, max = 96) {
  return s.length <= max ? s : s.slice(s.indexOf(' ', s.length - max) + 1);
}

// ---- the satchel ----------------------------------------------------------
export const KEPT_WORDS = ['honest']; // what survives the bag
// edits the dream cannot pass without: their word is never the one dropped
export const REQUIRED_EDITS = ['typewriter', 'trunk', 'machine1', 'machine2', 'machine3', 'machine4', 'gap', 'bench', 'alcove', 'shelf'];

// The satchel is full: the oldest word that is neither kept nor still needed.
export function dropIndex(words, needed = []) {
  const i = words.findIndex((w) => !KEPT_WORDS.includes(w) && !needed.includes(w));
  return i >= 0 ? i : words.findIndex((w) => !KEPT_WORDS.includes(w));
}
