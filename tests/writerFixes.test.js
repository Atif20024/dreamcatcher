import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import rooms from '../src/data/writer/rooms.js';
import { DIALOGUES, FIRST_PARAGRAPH, NAMES, NAPKIN, PAGE_THREE, rentScene, wrongWordLine } from '../src/data/writer/cast.js';
import { CARDS } from '../src/data/teach.js';
import { BEDS, LEGACY_ROOMS } from '../src/audio/places.js';
import { SHOTS } from '../src/audio/events.js';
import { PAGE_GATES, DESK_TEXT, KEPT_WORDS, TYPO_CAP, carryTypos, deskPay, deskTotal, deskWords, dropIndex, garble, keyOf, keyVerdict, tailText } from '../src/data/writer/economy.js';

const scene = readFileSync(new URL('../src/scenes/WriterScene.js', import.meta.url), 'utf8');
const idx = (id) => rooms.findIndex((r) => r.id === id);
const objects = rooms.flatMap((r, room) => r.objects.map((o) => ({ ...o, room })));

// W-M5: every word the pen can want, and where a normal run gets it.
// Words handed over by a person are in the scene's code: this table says where.
const SPOKEN = { honest: 'cafe', true: 'cafe', necessary: 'library', again: 'rewrite', fast: 'agent' };
function sources() {
  const out = {};
  const add = (w, room) => (out[w] ||= []).push(room);
  for (const o of objects) if (['word', 'source', 'foe'].includes(o.type) && o.word) add(o.word, o.room);
  for (const [w, r] of Object.entries(SPOKEN)) add(w, idx(r));
  return out;
}

describe('the pen: every word has a source a normal run reaches', () => {
  const theft = objects.find((o) => o.type === 'wake').room;
  const labels = objects.filter((o) => o.noun && o.to);

  it('the spoken words are really handed over in the scene', () => {
    const given = [...scene.matchAll(/addWord\('(\w+)'/g)].map((m) => m[1]);
    expect(new Set(given)).toEqual(new Set(Object.keys(SPOKEN)));
  });

  it('each label: its word is available by the time Jo stands there, theft included', () => {
    const src = sources();
    const bad = [];
    for (const l of labels) {
      const from = src[l.to] || [];
      const ok = from.some((r) => r <= l.room && (l.room <= theft || r > theft || KEPT_WORDS.includes(l.to)));
      if (!ok) bad.push(`${l.adj} ${l.noun} wants "${l.to}" (room ${rooms[l.room].id}, sources ${from.map((r) => rooms[r].id)})`);
    }
    expect(bad).toEqual([]);
  });

  it('the city needs neither word to pass: no gate, and the crane runs either way', () => {
    const city = objects.filter((o) => o.room === idx('city'));
    expect(city.filter((o) => o.type === 'gate')).toEqual([]);
    expect(city.map((o) => o.word).filter(Boolean)).toContain('wide'); // on a rooftop before the ledge
    const crane = city.find((o) => o.type === 'crane');
    expect(crane.to).toBe('fast');
    expect(scene).toMatch(/const speed = c\.fast \? 150 : 40/);
  });

  it('the pen has work after the bag: a label for each thing Jo can still hold', () => {
    const after = labels.filter((l) => l.room > theft).map((l) => l.to);
    expect(after).toEqual(expect.arrayContaining(['honest', 'wide', 'fast']));
  });

  it('the dev warp gifts no word the run has not reached', () => {
    const city = scene.match(/city: \{[^\n]*/)[0];
    expect(city).not.toMatch(/'wide'/);
  });

  it('a full satchel keeps honest, and a word the way on still needs', () => {
    expect(dropIndex(['honest', 'lit', 'old'], ['lit'])).toBe(2);
    expect(dropIndex(['lit', 'honest'], ['lit'])).toBe(0); // nothing else to drop
  });
});

describe('the pen: wrong words', () => {
  it('open on the first word, never on the answer', () => {
    const src = readFileSync(new URL('../src/systems/labels.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/indexOf\(label\.to\)/);
  });
  it('have a line for every label noun, short enough for one float', () => {
    for (const l of objects.filter((o) => o.noun && o.to)) {
      for (const w of ['quiet', 'old', 'honest', 'again']) {
        const line = wrongWordLine(l.noun, w, l.adj);
        expect(line).toContain(l.noun);
        expect(line.length).toBeLessThan(70);
      }
    }
    expect(wrongWordLine('machine', 'quiet', 'jammed')).toBe('a quiet machine. still jammed. politely.');
    expect(wrongWordLine('machine', 'old', 'jammed')).toMatch(/^an old/);
    expect(wrongWordLine('crane', 'honest', 'slow')).toBe("an honest crane. it admits it's still slow.");
  });
});

describe('the desks', () => {
  const desks = objects.filter((o) => o.type === 'desk' && !o.fixTypos);

  it('type the book, not a nonsense ring', () => {
    const page3 = PAGE_THREE.join(' ');
    expect(FIRST_PARAGRAPH.startsWith(DESK_TEXT.desk1)).toBe(true);
    expect(page3.startsWith(DESK_TEXT.desk2)).toBe(true);
    expect(DESK_TEXT.desk2).toContain('the colour of skimmed milk.');
    expect(DESK_TEXT.desk3).toBe(NAPKIN.join(' '));
    expect(DESK_TEXT.desk4).toContain('Number four sulked on Mondays.');
    expect(DESK_TEXT.desk4).toContain('He put the good ones on top.');
    for (const d of desks) expect(deskWords(d.id).every((w) => /^[a-z]$/.test(keyOf(w)))).toBe(true);
  });
  it('a desk is close to its old length', () => {
    const old = { desk1: 16, desk2: 20, desk3: 24, desk4: 28 };
    for (const d of desks) expect(Math.abs(deskWords(d.id).length - old[d.id])).toBeLessThanOrEqual(4);
  });
  it('a missed key prints as a visible typo', () => {
    expect(garble('copy')).toBe('ocpy');
    expect(garble('shop,')).toBe('hsop,');
    expect(garble('a')).toBe('a');
  });
  it('pages scale a little with accuracy; a perfect run is the old sixty', () => {
    const pages = desks.map((d) => d.pages);
    expect(pages.reduce((a, b) => a + b, 0) + 6).toBe(60);
    expect(deskPay(12, 24, 24)).toBe(12);
    expect(deskPay(12, 0, 24)).toBe(9);
  });
  it('the gates: fair at a middling hand, never locked at the worst', () => {
    const [d1, d2, d3, d4] = desks.map((d) => d.pages);
    const NAPKIN_PAGES = 6;
    const PIGEON = 1;
    const at = (a) => {
      const p = (n) => deskPay(n, a, 1);
      return [p(d1) + p(d2) - PIGEON, p(d1) + p(d2) + NAPKIN_PAGES + p(d3) - PIGEON, p(d1) + p(d2) + NAPKIN_PAGES + p(d3) + p(d4) - PIGEON];
    };
    const [g1, g2, g3] = at(0.5);
    expect(g1).toBeGreaterThanOrEqual(PAGE_GATES.pages12);
    expect(g2).toBeGreaterThanOrEqual(PAGE_GATES.pages30);
    expect(g3).toBeGreaterThanOrEqual(PAGE_GATES.pages60);
    // no hits at all: a redraft always gains a page, up to what the desk pays
    let best = deskTotal(d2, 0, 0, 1);
    let sat = 1;
    while (best < d2) {
      const next = deskTotal(d2, best, 0, 1);
      expect(next).toBeGreaterThan(best);
      best = next;
      sat += 1;
    }
    expect(sat).toBeLessThan(5);
    expect(d1 + d2 - PIGEON).toBeGreaterThanOrEqual(PAGE_GATES.pages12);
    expect(d1 + d2 + NAPKIN_PAGES + d3 - PIGEON).toBeGreaterThanOrEqual(PAGE_GATES.pages30);
    expect(d1 + d2 + NAPKIN_PAGES + d3 + d4 - PIGEON).toBeGreaterThanOrEqual(PAGE_GATES.pages60);
  });
  it('typos are capped per desk and in all', () => {
    expect(carryTypos(0, 20)).toBe(3);
    expect(carryTypos(7, 3)).toBe(TYPO_CAP);
  });
  it('a stray key with no letter near the line is not a typo', () => {
    expect(keyVerdict(100)).toBe('judge');
    expect(keyVerdict(300)).toBe('typo');
    expect(keyVerdict(900)).toBe('ignore');
  });
  it('the foot of the box holds the tail, from a word boundary', () => {
    const t = tailText('one two three four five six seven', 12);
    expect(t).toBe('six seven');
    expect('one two').toBe(tailText('one two', 12));
  });
});

describe('the rest of the review', () => {
  it('W-M4: a card teaches [Q], near the first talker and the dog', () => {
    expect(CARDS.noise.key).toBe('Q');
    const zones = CARDS.noise.triggers.map((t) => t.zone);
    const cafe = rooms[idx('cafe')];
    const x0 = rooms.slice(0, idx('cafe')).reduce((n, r) => n + r.grid[0].length, 0);
    const dog = cafe.objects.find((o) => o.id === 'dog');
    const talker = cafe.objects.find((o) => o.kind === 'talker');
    expect(x0).toBe(120);
    expect(zones.some((z) => z.x0 <= dog.x && dog.x <= z.x1)).toBe(true);
    expect(zones.some((z) => z.x0 <= talker.x && talker.x <= z.x1)).toBe(true);
    expect(cafe.objects.find((o) => o.id === 'g_dog').hint).toMatch(/\(Q\)/);
  });
  it('W-S5: the moments have people, and none sits on a checkpoint', () => {
    const ms = objects.filter((o) => o.type === 'moment');
    expect(ms.map((m) => m.who)).toEqual(['tomasz', 'hat', 'landlady']);
    const cps = objects.filter((o) => o.type === 'checkpoint');
    for (const m of ms) expect(cps.some((c) => c.room === m.room && c.x === m.x)).toBe(false);
    for (const m of ms) expect(NAMES[m.who]).toBeTruthy();
  });
  it('W-S6: no Editor in the city or at the agent; the press has one', () => {
    const eds = objects.filter((o) => o.type === 'editor').map((o) => rooms[o.room].id);
    expect(eds).toEqual(['rain', 'editor', 'press']);
  });
  it('W-S7: the ladder word is on the ground, before the mezzanine it opens', () => {
    const talkers = rooms[idx('cafe')].objects.filter((o) => o.kind === 'talker');
    expect(talkers.find((t) => t.word === 'fixed').y).toBe(33);
  });
  it('W-S1 / N4: the rent scene says who paid, and what really changed hands', () => {
    const says = (paid) => rentScene(paid, 12).map((d) => d.text).join(' ');
    expect(says(12)).toMatch(/Tomasz paid me/);
    expect(says(12)).toMatch(/It's all here/);
    for (const paid of [0, 1, 5, 11]) expect(says(paid)).not.toMatch(/all here/);
    expect(says(5)).toMatch(/5 pennies/);
    expect(says(1)).toMatch(/One penny/);
    expect(says(0)).toMatch(/left them on the floor/);
    expect(scene).toMatch(/const RENT = 12/);
    // the price is worked out before she speaks, and the flag does not hang on it
    expect(scene.indexOf('const paid = Math.min(RENT')).toBeLessThan(scene.indexOf('rentScene(paid, RENT)'));
  });
  it('N1: the Editor undoing the timetable is said, where it can be seen', () => {
    expect(scene).toMatch(/if \(revert\) \{\s+const l = this\.labels\.get\('timetable'\)/);
    expect(scene).toMatch(/onCamera\(this, l\.x, l\.y\)/);
  });
  it('N1 / N2: the pen costs no time: the menu halts the Editor, and an edit locks nothing', () => {
    const labels = readFileSync(new URL('../src/systems/labels.js', import.meta.url), 'utf8');
    const base = readFileSync(new URL('../src/scenes/BaseLevel.js', import.meta.url), 'utf8');
    const editor = readFileSync(new URL('../src/entities/InnerEditor.js', import.meta.url), 'utf8');
    expect(labels).toMatch(/s\.puzzleActive = true;/);
    expect(base).toMatch(/this\.dialogActive \|\| this\.puzzleActive \|\| this\.tutorialActive\) return true/);
    expect(scene.indexOf('if (this.handleModalUpdate()) return;')).toBeLessThan(scene.indexOf('for (const ed of this.editors) ed.update'));
    expect(editor).toMatch(/this\.scene\.puzzleActive/);
    expect(labels).not.toMatch(/controlLockUntil/);
  });
  it('S3: what Tomasz says about his machines matches the room', () => {
    const machines = rooms[idx('copyshop')].objects.filter((o) => o.kind === 'machine');
    const jammed = machines.filter((m) => m.adj === 'jammed').length;
    const empty = machines.filter((m) => m.adj === 'empty').length;
    expect([machines.length, jammed, empty]).toEqual([6, 5, 1]);
    expect(machines.filter((m) => m.to === 'working').length).toBe(4);
    expect(DIALOGUES.tomasz[0].text).toMatch(/^Six machines\. Five jammed, one empty/);
  });
  it('W-S2: the spare machines are not counted against the four', () => {
    expect(scene).toMatch(/const spare = id === 'machine5' \|\| id === 'machine6'/);
  });
  it('W-S9: the copy shop, café and press have beds of their own, of real shots', () => {
    const w = LEGACY_ROOMS.writer;
    expect(new Set([w.copyshop.events, w.cafe.events, w.press.events, w.library.events, w.postoffice.events]).size).toBe(5);
    for (const key of ['copyshop', 'cafe', 'library', 'post', 'press']) for (const e of BEDS[key].events) expect(SHOTS[e.shot], e.shot).toBeTypeOf('function');
  });
});
