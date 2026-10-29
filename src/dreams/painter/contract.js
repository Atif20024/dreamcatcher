// The commission's contract (THE MASTER'S LADDER): what Messer Corso's notary
// wrote, in Roman numbers, kept on the HUD once it is signed, and spent
// stroke by stroke in the giornata. Ultramarine is the precious thing:
// two ounces of it, against ten books of gold leaf.
//   ULTRAMARINE II
//   GOLD LEAF X
import { hud } from '../../ui/hud.js';

export const CONTRACT = { ultramarine: 2, gold: 10 };

// the giornata, in sections of wet plaster (the clock refills for each);
// `uses` spends the contract's materials
export const GIORNATA_STEPS = [
  { section: 0, label: 'pounce the cartoon' },
  { section: 0, label: 'lay the wet plaster' },
  { section: 1, label: 'the sky, ultramarine (I)', uses: 'ultramarine' },
  { section: 1, label: 'the sky, ultramarine (II)', uses: 'ultramarine' },
  { section: 2, label: 'the stars, gold leaf (X books)', uses: 'gold' },
  { section: 2, label: 'the mantle' },
  { section: 2, label: 'the fold' },
  { section: 3, label: "the face: Bice's hand", auto: 2600 },
];

const ROMAN = ['SPENT', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// what is left of the contract's materials after `stepsDone` giornata steps
export function contractLeft(stepsDone = 0) {
  let blue = CONTRACT.ultramarine;
  let gold = CONTRACT.gold;
  GIORNATA_STEPS.slice(0, stepsDone).forEach((s) => {
    if (s.uses === 'ultramarine') blue -= 1;
    if (s.uses === 'gold') gold = 0;
  });
  return { blue, gold };
}

export function contractLines(left) {
  return [`ULTRAMARINE ${ROMAN[left.blue]}`, `GOLD LEAF ${ROMAN[left.gold]}`];
}

// show (or hide) the two contract lines on the HUD's tool slot
let shown = null;
export function showContract(left) {
  const lines = left ? contractLines(left) : ['', ''];
  const key = lines.join('|');
  if (key === shown) return;
  shown = key;
  hud.toolLine(1, 'accent').setText(lines[0]).setVisible(!!lines[0]);
  hud.toolLine(2, 'accent').setText(lines[1]).setVisible(!!lines[1]);
}
export function resetContract() {
  shown = null;
}
