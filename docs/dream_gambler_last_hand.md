# DREAMCATCHER — DREAM SPEC: GAMBLER — "THE LAST HAND"

Follows Parts A, C, D and the three skills. Target first-run playtime: **18–22 minutes**, built around **six card games** that are real, learnable, and rigged exactly as much as a casino is — which is to say honestly, and in the house's favour. Names are placeholders; rename in `src/data/gambler/cast.js`.

**Design stance:** the game never says "don't gamble." It makes betting feel great, makes winning feel enormous, makes the slide gradual, and then shows the player the bill. The level's one true lesson is taught by a single button that is always on screen and that the player must, in the end, choose not to press.

---

## 1. STORY

**Logline:** Jo walks into a casino that never closes with one chip and the belief that tonight is the night. He wins, gets comped, gets a marker, pawns his trumpet, loses the marker, and at dawn is dealt one last hand face-up — and the only winning move is to stand up and go find his horn.

**Theme:** the dream you don't earn. Every other dream is work. This one is luck, and luck is the house's.

**Arc (six "hands"):**
1. **The Floor** — bright, loud, generous. Everyone wins the first hour. Jo learns to bet.
2. **The Lounge** — velvet, quiet, comped. **Mr. Favour** takes his coat and his name. A key to the high-roller room, won at a memory game Favour cheats at.
3. **The Back Rooms** — markers. Jo loses, borrows, and **pawns the trumpet**. The dream gets harder because he can't play, shove, or interact.
4. **The Car Park** — dawn. The cashier's cage. A bus. **Sal**, who has been losing here every night since 1987 and is happy. The dark hand.
5. **The Last Hand** — the private table. Cards face up. One more marker on offer. The button.
6. **Lost and Found** — a cardboard box. The trumpet. The orb inside the bell.

---

## 2. CAST
- **Jo** — player. Level tool: the trumpet (until Hand 3); then nothing (until Hand 6).
- **Mr. Favour** — the host. Perfect suit, remembers everyone's name, takes your coat, comps your drink, pays for nothing. Never rude. The dream's face of The Counter.
- **Lou** — blackjack dealer, ex-jazz pianist, knows Jo's type. Deals clean, tells the truth with his face. The mentor who can only say "Sir, the table's open" and "Sir, I'd go."
- **Dede** — cocktail waitress, twenty years on the floor, has seen every version of Jo. Small Moment NPC.
- **Sal** — regular, 70s, cardigan, one chip at a time since 1987. The dream's heart.
- **The Collector** — foe (person class). Shows up in Hand 3. Grabs = "a word outside" (thrown to checkpoint, −1 heart, and the marker grows).
- **Three players at the poker table** — *The Widow* (never bluffs), *The Kid* (always bluffs), *The Accountant* (bluffs on a tell).
- **Foes:** *Floor Security* (post/patrol; caught = "escorted out" to the last checkpoint), *The Collector*, *Chip Runners* (scalper-class; snatch a chip stack if Jo stands still at a table >5 s), *The Pit* (a pit boss who follows Jo at 50% speed once Jo is "up" more than 10 chips — a slow pressure like the Inner Editor, never grabs, just makes every table close as he arrives).

---

## 3. LEVEL MECHANICS (unique to this dream)

### 3.1 CHIPS and the WALLET
This dream's coin is a **chip, worth 25** — but chips are **house money**: the HUD shows them as `PENDING` in a separate column. They become real only if cashed at the **cage** (the cashier window, two of them in the level). If Jo leaves the dream with pending chips, they are **voided** (the ending text says so). Budget: 40–50 chips placed, plus whatever he wins. Jo arrives with **1 chip**.

### 3.2 BET — the button that is always there
From the first table, a **BET** prompt lives in the HUD under the hearts. At any table (`T` glyph) Jo can stake chips **or hearts**. Hearts staked are hearts gone if he loses; won hearts are real (up to 5). The odds are the printed odds: even money on most games, 2:1 at the shell game, 35:1 on a roulette number. **The house edge is implemented exactly** — the dealer wins ties, the shell game dealer palms on a schedule, the roulette has two zeros. Over the level, a player who bets every chance **will** end up at zero. A player who reads tells and walks away "up" is possible and is the good ending's prerequisite.
Visual law: a win is **enormous** — gold confetti, the music swells, chips rain into the stack with a rising stinger; a loss is **tiny** — one chip slides away, a quiet "tick." That asymmetry is deliberate and must be kept.

### 3.3 LUCK — the world runs on it
- **The Deal (card platforms):** rows of face-down cards 1 tile wide hang in the air; they flip as Jo lands. **Number cards hold.** **Face cards flip him** off (a 1-tile launch backward). **Aces** are solid and reward a coin. The sequence is seeded per room — and the **room's deck is displayed** somewhere in the background (a discard tray, a card-counting board, a mural), so the player who *reads the room* knows which cards are coming. Nobody is told this.
- **Roulette doors:** a wheel on the wall; Jo stops it with the tool/E; the ball lands; the door opens on red or black (as marked) and sometimes on a number. The wheel is honest and **visible**: the ball's speed decays predictably, and a patient player can time it. A hurried one can't.
- **Slot columns:** vertical reels are climbable walls; landing on one spins it; three matching symbols pay a coin, a `7-7-7` opens a hidden door, and a `BAR-BAR-BAR` **drops** the reel one floor. The symbols are on the reel; read before you jump.
- **Dice bridges:** stepping on the first tile rolls two dice shown huge on the wall; the bridge is that many tiles long; the gap beyond is always 12 − roll. Low rolls make long gaps — and a long jump needs the running start the bridge is too short for. Unless you re-roll (costs a chip).

### 3.4 TELLS — the only skill in the room
Every dealer and opponent has a **tell**: a 2-frame animation on the hand, eye, or mouth (character-motion skill: signature idles). Tells are **true information** about the next card, the hidden card, or the bluff. Learning to read them is the level's skill curve, and the puzzle-boxes are built so a player who watches can win and a player who only clicks can't.

### 3.5 THE MARKER
In Hand 3 Jo can take **markers** (loans) from The Collector's window: +10 chips, with the debt displayed on a tally board in the HUD. The marker never goes away. It grows by 2 every time The Collector catches him. At the Last Hand the marker is the stake on the table.

### 3.6 NO TRUMPET (Hands 3–5)
Pawning the trumpet removes the level tool: no shove, no noise burst, no ringing bells (checkpoints must be touched, not rung), no striking switches (plates and levers only). Jo's carry-idle changes (hands in pockets). The music loses the trumpet stem. Winning it back (P5) restores everything, and the first note he plays after cracks a chandelier.

---

## 4. SECTION MAP & TIMING

| # | Hand | Time | Checkpoints | Flags |
|---|---|---|---|---|
| 0 | Arrival — the sign that never turns off | 0:45 | CP0 | — |
| 1 | The Floor | 4:00 | CP1a–c | `gm.first_win`, `gm.cashed_once` |
| 2 | The Lounge | 3:30 | CP2a, CP2b | `gm.coat_taken`, `gm.key` |
| 3 | The Back Rooms | 4:30 | CP3a–c | `gm.marker`, `gm.trumpet_pawned`, `gm.trumpet_back` |
| 4 | The Car Park — dawn | 2:30 | CP4 | `gm.sal`, `gm.dawn` |
| 5 | The Last Hand | 2:00 | CP5 | `gm.stood_up` or `gm.took_marker` |
| 6 | Lost and Found — the Orb | 1:00 | — | `dreams.gambler` |

**Palette:** sign — neon magenta on black → floor — red carpet with a gold pattern, brass, mirror ceiling, every light on, no clocks, no windows → lounge — oxblood velvet, low lamps, cigar amber → back rooms — bare bulbs, green baize, grey concrete, a safe → car park — the first grey-blue daylight in the dream, sodium lamps still on, exhaust → last hand — a single hanging lamp over green baize, everything else black → lost and found — a cardboard box under a fluorescent tube, and then the orb's gold.
**Music stems:** (1) walking bass + brushes (always, swing), (2) vibraphone (floor — the "winning" sound), (3) muted trumpet (until pawned), (4) low piano chords (back rooms, car park), (5) a single ride cymbal (last hand), (6) silence then one trumpet note (lost and found). Wins trigger a brass **stinger** that is the game's happiest sound; the stinger gets **slightly shorter** every time it plays in the level, and nobody will notice until it's one note.

---

## 5. SECTION DETAILS

### HAND 0 — Arrival (0:45)
The train stops under a sign so big it's a sky: **THE MERIDIAN — OPEN** with a burnt-out `24 HRS` under it. Rain on a parking structure. A valet stand with no valet. Title card: **DREAM — THE LAST HAND**. One chip in the gutter (the first coin, breadcrumb). Revolving door: Floor Security at the entrance. **D0** — Security: "Chip?" Jo shows it. Security: "Then you're a guest. Welcome home."
**Puzzle-box P1 — "Higher or Lower" (the door game, 0:30):** the doorman flips a card; Jo calls higher/lower for the next one; three correct in a row opens the door. The deck is **visible on the counter** (a spread of the remaining cards) — the tutorial for reading rooms. Win pays 2 chips. Lose = try again, no cost (the only free game in the level).

### HAND 1 — The Floor (4:00)
A casino floor the size of a station hall, two storeys, a mirrored ceiling that reflects a *second* Jo (cosmetic; it does what he does, a frame late). Slot columns, roulette doors, card platforms over the pit, a central fountain of chips (cosmetic, un-collectable, there to be wanted). Dede with a tray. Lou at the far blackjack table under the biggest lamp.
**Layout:** entry mezzanine → slots canyon (climb reels, read symbols; a `7-7-7` opens a service door with 5 chips and the first shard) → the pit (card platforms over a drop into a lower floor of roulette tables — falling is not death, it's a lower floor and a long climb) → the cage (cashier window 1 — cash pending chips; **D1** Dede: "Cash it. Nobody does. Cash it.") → Lou's table.
**Puzzle-box P2 — "Twenty-One" (Lou, 1:30):** real blackjack against Lou, 6 hands, standard rules, dealer stands on 17, ties go to the house (shown on the felt). The **shoe is visible**: the remaining cards are fanned on the table edge and *removed as dealt*, so a counting player knows the odds; and **Lou has a tell** — when his hole card is a ten-value, he touches his cufflink (2 frames). The player must win 3 of 6 to pass and take the lounge ticket Lou slides over. Betting is allowed in-puzzle (chips or hearts). Winning big here feels fantastic and is the hook. `gm.first_win`.
**D2** — Lou, dealing the last hand: "Sir. The table's always open. That's the problem with it."
**Foes:** Security (patrols; caught = escorted to CP), Chip Runners at every table. **Hazards:** reel drops, face-card flips, the pit.
**Small Moment #1 — "Dede's shoes":** the staff corridor behind the slots; Dede sitting on a crate with her shoes off, rubbing her feet, laughing at something on her phone. 6 s. Text: *"Twenty years of carpet."*
**CP1a** entry bell; **CP1b** the cage; **CP1c** Lou's table.

### HAND 2 — The Lounge (3:30)
A velvet room up a curved stair, quieter, the lights lower. Mr. Favour waits at the top with open hands. **D3** — Favour: "Jo. Of course. Let me take your coat — and the horn, you won't need it up here, I'll keep it safe." (A choice: hand over the trumpet **or keep it**. Keeping it: Favour smiles; the lounge's bouncers watch Jo more closely — the noise of the instrument is banned here, so playing it = caught. Handing it over: it's in the cloakroom, retrievable in Hand 3 by other means. Both are fine. `gm.coat_taken` either way — he takes the coat regardless, and with it Jo's name tag; NPCs call him "sir" from here, never Jo.)
**Mechanic — comps:** drinks, chips and hearts are handed to Jo for free by waiters. The HUD's `PENDING` grows without a single bet. Every comp adds 1 to a hidden `favour` counter; it's the marker before the marker.
**Layout:** cigar terrace (card platforms with a *shuffled* deck — the discard tray shows the order, but it's across the room, through smoke; the player has to go look first), the piano bar (a resonant piano; if Jo has the trumpet, a duet with the pianist is Small Moment #2), the billiards room (a ball-and-pocket plate puzzle: sink three balls into the pocket-plates with pushes to raise the lift), the private lift.
**Puzzle-box P3 — "Concentration" (Favour, 1:30):** a 4×6 memory grid; match pairs; 8 turns. The twist: **Favour cheats** — between turns he swaps two face-down cards, and the swap has a tell (his left hand rests on the table edge for a frame). A player who watches the hand instead of the grid can track the swap. Winning takes the **high-roller key** (`gm.key`). Losing costs a heart and he says "Again? Of course." No limit on tries; the heart cost is the limit.
**Small Moment #2 — "The pianist":** the piano bar at 3 a.m. (no clocks; the lamp is just lower). The pianist plays alone; Jo plays with him (if he has the horn) or sits (if not). 8 s. Text: *"He wasn't playing for the room either."*
**Foes:** lounge bouncers (bigger, slower, can't be shoved; hide behind curtains, distract with a dropped glass). **CP2a** the stair; **CP2b** the lift.

### HAND 3 — The Back Rooms (4:30) — THE SLIDE
The lift opens on concrete. Bare bulbs. A corridor of doors with no numbers. The Collector's window at the end, grille down. Three rooms:
**Room 1 — The shell game.** A dealer at a crate, three cups, one ball. **Puzzle-box P4 — "Three Cups" (1:00):** the cups shuffle (12 moves, speed rising); pick. The dealer **palms the ball** on the third round and after — unwinnable by watching cups. The tell: he glances at the cup it's really under before every shuffle ends. 2:1 pays. Three rounds to pass; losing the third means the marker window opens: **D4** — Collector: "Light tonight, sir? Ten. No paperwork." The first marker (`gm.marker`). Players who read the glance can pass without it.
**Room 2 — The pawn window.** A hatch with a scale. **D5** — the Pawnbroker (an arm and a voice): "Horn's worth twenty. Twenty-five with the case." The game *requires* **25 chips** to open the safe door to Room 3 (a bound lock; the slot counts chips). If Jo has them, he keeps the trumpet. If he doesn't — most players, by design, won't — the only ways are the marker (another 10, debt now 20) or the pawn. **`gm.trumpet_pawned`**: the tool is gone (§3.6), the carry pose changes, the music loses a stem, and Lou's voice comes faintly through a vent: "Sir, I'd go." (If the trumpet was left with Favour in Hand 2, the cloakroom ticket is what gets pawned — same effect.)
**Room 3 — The poker room.** **Puzzle-box P5 — "Five-Card Draw" (2:00): the big one.** Jo vs. The Widow, The Kid, The Accountant. Real draw poker: ante, deal 5, one draw (discard up to 3), bet/call/fold/raise, showdown. 8 hands or until Jo is out. **Tells (true):** the Widow never bluffs (if she bets, she has it); the Kid always bluffs (his raise means nothing; his *check* means strength); the Accountant bluffs **only when he adjusts his glasses**. Jo has a tell too — the HUD shows it: when his hand is strong, his portrait's eyebrow lifts, and the Accountant can read *him* (he folds against Jo's lifted eyebrow). The player can **suppress** Jo's tell by holding Down during the bet (a "poker face" that costs nothing but attention). The trumpet is on the table as the Pawnbroker's stake; winning the pot it's in gets it back (`gm.trumpet_back`). Going bust closes the room; the Collector escorts Jo to the car park with the marker at +5.
**Foes:** The Collector (patrols the corridor; caught = "a word outside," marker +2). **Hazards:** the corridor's **card platforms use a deck nobody shows** — the only unreadable Deal in the level; it's here to make the player feel what it's like to not know.
**Small Moment #3 — "Sal, winning":** a side room: Sal at a video-poker machine, one chip, hits a small pair, says "there we go" to nobody, puts in the next chip. 6 s. Text: *"He'd been winning like that for thirty-nine years."*
**CP3a** the lift; **CP3b** the pawn window; **CP3c** the poker-room door.

### HAND 4 — The Car Park (2:30) — DAWN
A fire door. Grey light. The first *outside* since the sign. The multi-storey car park's ramps are the platforming (slopes, a barrier arm that drops on the beat, an attendant's booth, a bus stop at the bottom). Sodium lamps still on; birds starting. The sign is still lit, and from here it's small.
**The cage (cashier window 2)** is at the top ramp. If Jo has pending chips, he can cash them here — this is the last chance, and **D6** — the Cashier (Dede, off shift, in a coat, behind the glass because her cousin is late): "Cash it. I'll say it once more. Cash it." Cashing with a marker outstanding pays the marker first; the HUD shows chips → debt → remainder. For most players, the remainder is zero or negative.
**Sal** is at the bus stop. He has one chip. **D7** —
> Sal: "Ah, you're the trumpet guy. Lou told me. You up or down?"
> Jo: "Down."
> Sal: "Everybody's down, son. I've been down since 'eighty-seven. I come for the coffee and the carpet. You want the chip?"
> Jo: [choice] **"Keep it."** / **"…Yeah."**
Taking it (`gm.sal_chip`) means Jo has exactly one chip for the Last Hand and Sal goes home with none, waving. Refusing means Jo has whatever he has (possibly nothing). Both reach Hand 5. The bus leaves without Jo either way.
**Foes:** none. **Hazards:** the barrier arm, a wet ramp, a reversing van (telegraphed beep). **CP4** the bus shelter.

### HAND 5 — The Last Hand (2:00)
Favour, in the car park, in the morning light, with a card table set up between two parked cars, a lamp plugged into the booth. **D8** — Favour: "One hand. For everything — the marker, the horn, the night. Sit."
**Puzzle-box P6 — "Face Up":** the cards are dealt **face up**. Jo's hand: nothing. Favour's: a full house. The felt shows the marker as the stake. The BET button glows. The only other control is **STAND UP** — a `small`-font option at the bottom of the panel, unhighlighted, where `[ESC] close` normally sits.
- **STAND UP** → `gm.stood_up`. Favour, pleasantly: "Suit yourself. Lost and found's past the booth." The table folds itself away. The music stops. Birds.
- **BET** → Favour: "Marker, then? Of course." A second marker; the hand is re-dealt — and Jo **wins**. Gold everywhere, the full stinger (restored to full length), the car park floods with chips, the sign flares, the music is enormous for ten seconds. Then it stops. A voice from behind the lamp — flat, pleasant, the one from the station gate — counts the chips, one by one, out loud, a number at a time, for as long as the player stands there, and hands Jo the orb from under the table like a prize. `gm.took_marker`. This path **also** completes the dream. It is worse, and the game lets you take it, and the ending text knows.
**CP5** the booth.

### HAND 6 — Lost and Found (1:00)
(The `stood_up` path.) Behind the booth, a door marked STAFF, a room with one fluorescent tube and shelves of umbrellas and a cardboard box labelled **LOST & FOUND** in marker. The trumpet is in it — Lou put it there; a note in his hand: *"Told you. — L."* Jo picks it up (the tool returns; the carry pose returns; the trumpet stem returns, one note, cracking nothing). The orb is **in the bell**, glowing through the brass. He tips it out into his hand. White fade.
Text cards: *"One night."* → *"Was it enough?"* → Small-Moment line, plus:
- `stood_up`: *"He left with the horn and nothing else. It was the most he'd had all night."*
- `took_marker`: *"He left with everything. Somebody's still counting it."*
- `gm.sal_chip`: *"Sal walked home. He didn't mind."* / refused: *"Sal played one more. He hit a pair."*
- pending chips voided: *"[N] chips, never cashed."*
Sets `dreams.gambler = true`. (The `took_marker` path gets the orb in Hand 5; its Hand 6 is the same room with the box **empty**.)

---

## 6. THE SIX CARD GAMES — implementation rules
All games are **seeded** per save so retries aren't RNG-fishing, **the house edge is real**, and **every game has a tell or a visible shoe** so attention beats luck.
| Id | Game | Rules | What makes it beatable | Stake |
|---|---|---|---|---|
| P1 | Higher/Lower | 3 in a row vs a 52-card shoe | the remaining deck is spread on the counter | free |
| P2 | Twenty-One | 6 hands, dealer stands 17, ties to house, blackjack pays 3:2 | visible shoe depleting; Lou's cufflink tell on 10-value hole | chips/hearts |
| P3 | Concentration | 4×6 grid, 8 turns, match 6 pairs | Favour's swap has a hand tell | 1 heart per loss |
| P4 | Three Cups | 12 moves, 3 rounds, 2:1 | dealer's glance before the shuffle ends | chips |
| P5 | Five-Card Draw | 3 opponents, 8 hands, one draw, raise cap 3 | three fixed opponent tells; Jo's own tell suppressible with Down | chips + the trumpet |
| P6 | Face Up | dealt face up; unwinnable | STAND UP | the marker |
Engine: `src/systems/cards.js` — a seeded deck, hand evaluation (poker + blackjack), a `Tell` component (frame + condition), a shared card renderer (string-art, 7×10 at 2× with 4 suits in the level accent/`danger` colours). Puzzle-box panels per the ui-type skill; opponent portraits with the tell animations drawn per the motion skill.

## 7. DIFFICULTY (the house wins more, not meaner)
- Tells get subtler: 2 frames (d0) → 1 frame (d≥2); the Accountant's glasses tell gets a 20% false-positive rate at d≥3.
- Shoe visibility: P2 shows all remaining cards (d0) → only the count (d≥2).
- Card platforms: aces 20% (d0) → 10%; face cards 20% → 30%.
- Chip Runners snatch at 5 s → 3 s. The Pit follows at 50% → 70%.
- Marker grows +2 per catch → +4. Comps in the lounge +1 → +3 (the slide is faster).
- Fail states: escorted/caught = checkpoint; bust in P5 = car park with marker +5 (never a reset); P6 cannot be failed.

## 8. KEY ITEMS & COINS (collectibles skill)
| Hand | Key item | Behind | Flag |
|---|---|---|---|
| 1 | Lounge ticket | P2 | `gm.first_win` |
| 2 | High-roller key | P3 (+ the billiards lift) | `gm.key` |
| 3 | 25 chips (the safe door) — or the marker, or the trumpet | P4 / the window / the pawn | `gm.marker`, `gm.trumpet_pawned` |
| 3 | The trumpet (back) | P5 | `gm.trumpet_back` |
| 4 | Sal's chip | the choice | `gm.sal_chip` |
| 6 | Lou's note | the box | — |
Chips: worth 25, 40–50 placed; all `PENDING` until cashed; **two cages**; ending voids the rest. Coin placement follows the skill, with one override: the chip fountain on the floor is **uncollectable** and must be the most beautiful pile of money in the game.

## 9. IMPLEMENTATION (Part D stack)
- `src/data/gambler/rooms.js`, `tiles.js`, `sprites.js`, `cast.js`, `decks.js` (per-room seeded Deal sequences + where the room displays them).
- Legend additions: `T` table (bet point), `c`-row cards as `?` (face-down platform, resolves from the room deck), `W` roulette wheel door, `S` slot reel column, `d` dice-bridge trigger, `$` cage.
- `src/systems/wallet.js` gains `pending` and `marker`; `cash()` at a cage: `pending − marker → total`.
- `BET` HUD element: present from Hand 1; at a `T` it opens the stake selector (chips / hearts); outside tables it's dimmed but **visible** — never hidden.
- `entities/Pit.js` reuses the Inner Editor follow logic with `onReach: closeNearestTable`.
- No-trumpet state: `player.tool = null` disables `shove/play/ring`; checkpoints switch to touch; `MusicDirector` drops the trumpet stem.
- Stinger length: `audio.stingers.win.duration *= 0.93` per play within the level (floor 1 note).
- The counting voice in Hand 5: reuse The Counter's synth voice from the hub gate.

## 10. ACCEPTANCE
- At least one tester ends the floor "up," refuses to cash out, and reaches the car park at zero — and says so unprompted.
- At least one tester pawns the trumpet and describes the back rooms as "wrong" or "quiet" without being told the stem was removed.
- A tester wins P5 by reading the Accountant's glasses and explains it afterward.
- At the Last Hand, testers split between STAND UP and BET on first play; nobody finds STAND UP by accident — it must be visible, un-highlighted, and chosen.
- The win stinger is one note by the end and no tester noticed it shrinking until told.
