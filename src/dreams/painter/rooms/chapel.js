// THE NEW CHAPEL: the contest. Pole-and-beam scaffolds lashed with rope
// climb to the vault, ladders between the planks, a plaster trough and the
// altar's candles below. The vault has two bays: Maestro Dori's (left) is
// going in day by day, ours (right) is rough plaster with the red sinopia
// drawn on it. Bruno the foreman, who thinks the job should have been his
// master's, hid the cartoon on the fourth plank. At the top, with the
// cartoon, Jo and Bice paint the bay in one giornata, before the plaster
// dries, and the bell judges.
import { grid } from './grid.js';

const g = grid(40, 40);
g.fill(0, 0, 39, 1); // the vault's springing
g.fill(0, 38, 39, 39); // the floor
g.fill(0, 2, 1, 37); // the walls
g.fill(38, 2, 39, 37);
// our scaffold: planks every five rows (x 20–37), ladders alternating sides
for (const row of [33, 28, 23, 18, 13]) g.put(20, row, '==================');
g.put(2, 8, '====================================');  // the top deck under the vault (x 2–37)
const ladder = (x, y0, y1) => {
  for (let y = y0; y <= y1; y++) g.put(x, y, 'H');
};
ladder(21, 32, 37); // the floor → plank 1
ladder(36, 27, 32); // 1 → 2
ladder(21, 22, 27); // 2 → 3
ladder(36, 17, 22); // 3 → 4
ladder(21, 12, 17); // 4 → 5
ladder(36, 7, 12); // 5 → the deck
// a window sill and a putlog on the way (coins off the ladder line)
g.put(17, 30, '===');
g.put(17, 20, '===');

export const VAULT = { x: 20, y: 1, w: 17, h: 6 }; // our bay (tiles: x, y, w, h)
export const VAULT_RIVAL = { x: 3, y: 1, w: 15, h: 6 };

export default {
  id: 'chapel',
  origin: { tx: 60, ty: 70 },
  grid: g.rows(),
  material: 'chapel_stone',
  regions: [
    { rect: [2, 8, 37, 33], material: 'scaffold' },
  ],
  decor: [],
  props: [
    { prop: 'vault_rival', x: VAULT_RIVAL.x, y: VAULT_RIVAL.y, dx: -16, dy: -16, layer: 'back' },
    { prop: 'vault_bare', x: VAULT.x, y: VAULT.y, dx: -16, dy: -16, layer: 'back', unless: 'judged' },
    { prop: 'vault_done', x: VAULT.x, y: VAULT.y, dx: -16, dy: -16, layer: 'back', when: 'judged' },
    { prop: 'scaffold_poles', x: 20, y: 38, dx: -16, layer: 'back' },
    { prop: 'scaffold_poles', x: 2, y: 38, dx: -16, layer: 'back' },
    { prop: 'altar', x: 10, y: 38 },
    { prop: 'candle_stand', x: 5, y: 38 },
    { prop: 'candle_stand', x: 15, y: 38 },
    { prop: 'plaster_trough', x: 27, y: 38 },
    { prop: 'plaster_trough', x: 30, y: 33 },
    { prop: 'candle_stand', x: 24, y: 8 },
  ],
  lights: [{ x: 10, y: 34, r: 180, color: 0xffd090 }, { x: 28, y: 6, r: 200, color: 0xfff0d0 }, { x: 28, y: 22, r: 140, color: 0xffe0b0 }],
  enclosure: { backWall: 'blocks', wainscot: false, posts: 0, ceiling: true, pillars: true, frames: [{ x: 2, y: 35, w: 2, h: 3 }], palette: { wall: 0xc8bca0, wood: 0x5a4028, accent: 0x22408a, deep: 0x2a2428, lit: 0xfff0d0 } },
  light: { tint: 0xf4ece4 },
  backdrop: null,
  ambience: 'rn_chapel',
  acoustics: 'chapel',
  music: { state: 'tense', bpm: 60, key: 'chapel' },
  objective: [
    { text: 'find_cartoon' },
    { text: 'climb_vault', flag: 'cartoon' },
    { text: 'after', flag: 'judged' },
  ],
  titleCard: 'THE NEW CHAPEL',
  entities: [
    { type: 'portal', id: 'chapel>piazza', kind: 'door', x: 3, y: 37, to: { room: 'piazza', portal: 'piazza>chapel' }, door: { prompt: 'out to the square', fade: 300 } },
    { type: 'checkpoint', id: 'cp_chapel', label: 'THE NEW CHAPEL', x: 7, y: 37 },
    { type: 'checkpoint', id: 'cp_scaffold', label: 'THE SCAFFOLD', x: 30, y: 22 },
    // Bruno, the jealous foreman, guarding the plank where he hid the cartoon
    { type: 'foe', kind: 'foreman', x: 30, y: 17, patrol: [24, 34] },
    { type: 'foe', kind: 'pigeon', x: 28, y: 27, patrol: [24, 33] },
    { type: 'foe', kind: 'pigeon', x: 30, y: 12, patrol: [25, 34] },
    { type: 'keyitem', id: 'cartoon', x: 23, y: 17, beat: 'got_cartoon' },
    // the deck: the gate to our bay, Bice, Dori at his bay, the giornata
    { type: 'gate', id: 'g_vault', x: 33, y: 2, h: 6, requires: ['cartoon'], hint: 'THE VAULT WAITS FOR ITS CARTOON' },
    { type: 'npc', id: 'bice_deck', cast: 'npc-rn-bice', x: 31, y: 7, facing: -1, talk: [{ conv: 'bice_deck_after', if: 'judged' }, { conv: 'bice_deck' }] },
    { type: 'npc', id: 'dori_deck', cast: 'npc-rn-dori', x: 9, y: 7, facing: 1, talk: [{ conv: 'dori_deck_after', if: 'judged' }, { conv: 'dori_deck' }] },
    { type: 'encounter', id: 'giornata', x: 27, y: 7, anchor: { x: 28, y: 10 }, prompt: 'paint the giornata', when: 'cartoon', unless: 'judged' },
    { type: 'orb', id: 'orb', x: 24, y: 5, when: 'judged' },
    // giglio coins: the sill and the putlog off the ladder line, the deck's far end
    { type: 'coins', id: 'c_sill', x: 17, y: 28, n: 3 },
    { type: 'coins', id: 'c_putlog', x: 17, y: 18, n: 3 },
    { type: 'coins', id: 'c_deck', x: 3, y: 5, n: 4 },
    { type: 'coin', id: 'c_plank', x: 33, y: 31 },
  ],
};
