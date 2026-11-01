import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import rooms from '../src/data/astronaut/rooms.js';
import { A_DIALOGUES, BOARD_QUESTIONS, FLASHCARDS, CARDS_TO_PASS, SEAT_QUESTION, SEAT_REPLY, boutPlan, numbersLine, windupChance, priyaLiesInCrater } from '../src/data/astronautData.js';
import { BEDS, LEGACY_ROOMS } from '../src/audio/places.js';
import { SHOTS } from '../src/audio/events.js';
import { BANDS } from '../src/audio/bands.js';

const scene = readFileSync(new URL('../src/scenes/AstronautScene.js', import.meta.url), 'utf8');
const puzzles = readFileSync(new URL('../src/systems/astroPuzzles.js', import.meta.url), 'utf8');
const body = (name) => {
  const start = scene.indexOf(`  async ${name}(`);
  return scene.slice(start, scene.indexOf('\n  }\n', start));
};

describe('A-M1: the rejection reaches everybody on the first attempt', () => {
  const fn = body('faceTheBoard');
  it('attempt 1 cannot reach d_selected: every branch of it ends in rejection()', () => {
    const selectAt = fn.indexOf('A_DIALOGUES.d_selected');
    const firstAttempt = fn.indexOf('if (attempt === 1) {\n      await this.boardVerdict();\n      const short');
    expect(firstAttempt).toBeGreaterThan(-1);
    expect(firstAttempt).toBeLessThan(selectAt);
    expect(fn.slice(firstAttempt, selectAt)).toMatch(/return;/);
  });
  it('the stat gate still stands at the second attempt, before the questions', () => {
    expect(fn.indexOf('attempt > 1 && !this.statsReady()')).toBeLessThan(fn.indexOf('selectionBoard('));
  });
  it('the trained player hears the seat line, and a short one hears the numbers', () => {
    expect(fn).toMatch(/short\.length \? \[A_DIALOGUES\.d_rejected\[0\], \.\.\.short\] : A_DIALOGUES\.d_seat/);
    expect(A_DIALOGUES.d_seat[0].text).toMatch(/It is not yours\./);
  });
  it('the letter plays once, in rejection()', () => {
    expect(body('rejection').match(/d_rejected\[1\]/g).length).toBe(1);
    expect(fn).not.toMatch(/\.\.\.A_DIALOGUES\.d_rejected\b/);
  });
  it('the grey lifts when he is selected, and the year holds real silence', () => {
    expect(fn).toMatch(/this\.greyYear = null/);
    expect(body('rejection')).toMatch(/musicDirector\.setMix\(\{\}\)/);
    expect(body('rejection')).toMatch(/musicDirector\.clearMix\(\)/);
  });
  it('[Esc] from the Board is walking out, not a rejection', () => {
    expect(fn).toMatch(/if \(res === false\) return/);
  });
});

describe('round 2', () => {
  it('M1: dropping Priya puts her back, so the finale can always be finished', () => {
    const F = { rescue_on: true };
    expect(priyaLiesInCrater({}, false)).toBe(false); // before the rescue
    expect(priyaLiesInCrater(F, false)).toBe(true);
    expect(priyaLiesInCrater(F, true)).toBe(false); // on his back
    expect(priyaLiesInCrater(F, false)).toBe(true); // caught: dropCarry clears the carry, she is there again
    expect(priyaLiesInCrater({ rescue_on: true, priya_safe: true }, false)).toBe(false);
    // the scene derives both the sprite and the prompt from the rule, every frame
    expect(scene).toMatch(/when: \(\) => priyaLiesInCrater\(this\.F, this\.carryingPriya\)/);
    expect(scene).toMatch(/this\.priyaDown\.setVisible\(lying\)/);
    expect(scene).not.toMatch(/priyaDown\.visible/);
  });
  it('S1: the strike only cuts the line it was aimed at', () => {
    const strike = scene.slice(scene.indexOf('  evaStrike() {'), scene.indexOf('  nudgePlate() {'));
    expect(strike.indexOf('this.tether !== hook')).toBeGreaterThan(-1);
    expect(strike.indexOf('this.tether !== hook')).toBeLessThan(strike.indexOf('this.tether = null'));
  });
  it('N3: the verdict locks Jo, and [E] cannot reopen the door behind it', () => {
    const v = body('boardVerdict');
    expect(v.indexOf('controlLockUntil = this.time.now')).toBeLessThan(v.indexOf('await wait'));
    expect(v).toMatch(/p\.controlLockUntil = 0/);
    expect(scene).toMatch(/!this\.F\.selected && !this\.boarding/);
  });
  it('N5: a resumed second year wears the grey, and only one overlay is ever made', () => {
    const extra = scene.slice(scene.indexOf('  applyRunExtra(x) {'), scene.indexOf('  devWarp() {'));
    expect(extra).toMatch(/this\.F\.rejected && !this\.F\.selected\) this\.greyOverlay\(\)/);
    expect(scene).toMatch(/this\.greyYear \|\|= /);
  });
  it('N6: [Esc] from the cards does not float "false/5"', () => {
    const at = scene.indexOf('await systemsCards(this)');
    expect(scene.indexOf('right === false', at)).toBeLessThan(scene.indexOf('right >= CARDS_TO_PASS', at));
  });
  it('a catch ends the winch reel, so a respawn cannot play the rim scene alone', () => {
    const drop = scene.slice(scene.indexOf('  dropCarry() {'), scene.indexOf('  // ------- update'));
    expect(drop).toMatch(/this\.reeling = false/);
    expect(drop).toMatch(/setAllowGravity\(true\)/);
  });
  it('S2: after a failed quiz Halvorsen does not say the questions were fine', () => {
    const fn = body('faceTheBoard');
    const failed = fn.slice(fn.indexOf('if (!res.passed)'), fn.indexOf('SEAT_QUESTION'));
    expect(failed).not.toMatch(/never the problem/);
    expect(fn.slice(fn.indexOf('SEAT_QUESTION'))).toMatch(/never the problem/);
  });
});

describe('A-S2: the seventh question is a choice', () => {
  it('the quiz has six keyed questions; the seat is not among them', () => {
    expect(BOARD_QUESTIONS.length).toBe(6);
    expect(BOARD_QUESTIONS.some((q) => /seat/i.test(q.q))).toBe(false);
  });
  it('each choice has a reply and the flow does not branch on it', () => {
    for (const c of SEAT_QUESTION.choices) expect(SEAT_REPLY[c.value]).toBeTruthy();
    expect(body('faceTheBoard').match(/seat === /g).length).toBe(1); // only the gave_seat flag
  });
});

describe('A-M2, A-M3, A-M4: what the game says is true', () => {
  it('Osei says why the moon, once, before the descent, and never says good', () => {
    const lines = A_DIALOGUES.d_moon.map((d) => d.text).join(' ');
    expect(lines).toMatch(/Priya Raman/);
    expect(lines).not.toMatch(/\bgood\b/i);
    expect(scene.indexOf('A_DIALOGUES.d_moon')).toBeLessThan(scene.indexOf('await this.descend()'));
  });
  it('no bus', () => {
    const roomsSrc = readFileSync(new URL('../src/data/astronaut/rooms.js', import.meta.url), 'utf8');
    expect(scene + roomsSrc).not.toMatch(/\bthe bus\b/);
  });
  it('the g1 sign names what g1 wants', () => {
    const study = rooms.find((r) => r.id === 'p1_study');
    const g1 = study.objects.find((o) => o.id === 'g1');
    expect(g1.requires).toEqual(['physical']);
    expect(g1.hint).toMatch(/PHYSICAL/);
    expect(g1.hint).not.toMatch(/pip/);
    expect(study.objective[0]).toMatch(/physical/);
  });
});

describe('the rest', () => {
  it('A-S1: she goes down where she stands, the prompt follows, the line is true', () => {
    expect(scene).toMatch(/this\.priyaHurtPrompt\.x = pr\.x/);
    expect(A_DIALOGUES.d3[0].text).not.toMatch(/kilometre/);
    expect(A_DIALOGUES.d3[1].text).toBe('You carried me for a year.');
  });
  it('A-S3: the next hook is in reach wherever the line can snap', () => {
    const eva = rooms.find((r) => r.id === 'p4_eva').objects.filter((o) => o.type === 'hook').map((o) => o.x);
    expect(eva.length).toBeGreaterThanOrEqual(4);
    expect(eva[3] - eva[2]).toBeLessThanOrEqual(6); // F's reach is 6.5 tiles
    expect(scene).toMatch(/h\.y\) < 6\.5 \* T/);
    expect(scene).toMatch(/else this\.driftAway\(\);/); // and missing it costs the real thing
  });
  it('A-S4: the hinge does not print its answer', () => {
    const hinge = puzzles.slice(puzzles.indexOf('export function hinge'));
    expect(hinge).not.toMatch(/BOLT_ORDER\.join/);
    expect(scene).toMatch(/BOLT_ORDER\.join\(' '\)/); // the plate does
  });
  it('A-S5: the year reads as a year', () => {
    const parallax = readFileSync(new URL('../src/builders/parallax.js', import.meta.url), 'utf8');
    expect(parallax).toMatch(/EST\. 1974/);
  });
  it('A-S6: Halvorsen reads the real numbers', () => {
    expect(numbersLine({ lungs: 2, grip: 1, legs: 2, nerve: 1 })).toMatch(/^Lungs two\. Grip one\. Legs two\. Nerve one\./);
    expect(numbersLine({ lungs: 3, grip: 3, legs: 3, nerve: 3 }, 4)).toMatch(/minimum is four/);
  });
  it('A-S7: the gym has its own bed and pulse; the moon stops beeping', () => {
    const a = LEGACY_ROOMS.astronaut;
    for (const r of ['p1_track', 'p1_pool', 'p1_wall_ring']) expect(a[r].events).toBe('gym');
    for (const e of BEDS.gym.events) expect(SHOTS[e.shot], e.shot).toBeTypeOf('function');
    expect(BANDS.astronaut.parts.hum.voice).toBe('kick');
    for (const r of ['p4_eva', 'p5_moonfield', 'p5_crevasse', 'p5_crater']) expect(a[r].events).toBeNull();
    expect(a.p6_field.events).toBe('green');
    // every room of the dream is in the table, so none inherits the last bed
    for (const r of rooms) expect(a[r.id], r.id).toBeTruthy();
  });
  it('A-S8: round 1 is round 1, and each bout is different', () => {
    expect([1, 2, 3, 4, 5].map((n) => boutPlan(n).round)).toEqual([1, 2, 3, 4, 4]);
    expect(boutPlan(1).feint).toBeUndefined();
    expect(boutPlan(2).feint).toBeGreaterThan(0);
    expect(boutPlan(3).blocksDuck).toBe(true);
    expect(boutPlan(4).vsPriya).toBe(true);
    expect(new Set([1, 2, 3].map((n) => boutPlan(n).who)).size).toBe(3);
  });
  it('A-S9: the dead pieces are gone or alive', () => {
    expect(scene).not.toMatch(/rejectedTwice/);
    expect(scene).toMatch(/spare: !!this\.F\.cards_done/);
    expect(FLASHCARDS.length).toBe(5);
    expect(CARDS_TO_PASS).toBeLessThanOrEqual(FLASHCARDS.length);
    for (const [, right, ...wrong] of FLASHCARDS) expect(wrong).not.toContain(right);
  });
  it('the wind-up chance is the same per second at any refresh rate', () => {
    const perSecond = (hz) => 1 - (1 - windupChance(1000 / hz)) ** hz;
    expect(perSecond(30)).toBeCloseTo(perSecond(60), 10);
    expect(perSecond(144)).toBeCloseTo(perSecond(60), 10);
    expect(windupChance(1000 / 60)).toBeCloseTo(0.012, 5); // the old feel at 60 Hz
  });
});
