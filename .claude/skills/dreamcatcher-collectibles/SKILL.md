---
name: dreamcatcher-collectibles
description: Rules for designing and placing everything the player picks up in Dreamcatcher — coins (with per-dream value), required key items (ingredients, vessels, instruments, tools that gate progress), heart shards, and Small Moments — and for placing them so the player MUST take the difficult path instead of skipping it. Use this skill whenever you add, move, or balance a coin, pickup, key item, gate requirement, pedestal, secret, reward, or the coin/inventory HUD; when building or revising any room, section, or level (placement is part of room design, not an afterthought); when someone says "players skip this part", "make this path worth it", "what should the coins do", "where do I put the saffron", or asks about economy, shops, or what coins buy. Also use it when writing a new dream spec so its item list and coin value are defined up front.
---

# Dreamcatcher Collectibles & Placement

Pickups are how a level *steers* the player. A coin is a promise ("this way is worth it"), a key item is a lock ("you are not leaving until you've done this"), and where they sit decides whether the hard path gets played or skipped. This skill gives the rules; `references/placement-patterns.md` has the concrete patterns with ASCII diagrams; `references/dream-items.md` lists coin values and key items per dream.

## 1. The three currencies
| Pickup | What it is | Shown | Persists |
|---|---|---|---|
| **Coin** | the dream's *pay*. Each dream has one coin sprite and one **worth** (chef 5, musician 1, athlete 20 …). Picking up a coin adds `worth` to Jo's **wallet**. | HUD top-right, under the objective: dream coin icon + count this level, and a `$` total worth. Ledger at the station. | wallet persists across dreams; per-level count resets |
| **Key item** | a physical thing the dream *requires* — an ingredient, a vessel, a valve wheel, a valve for the trumpet, a ticket. Carried (Part A carry system) or slotted into the **satchel** (up to 3 shown as icons under hearts). Gates and stations check for it. | satchel icons; objective HUD names the next one | per level; lost on section restart |
| **Heart shard** | 3 = +1 max heart. One per section, always hidden behind the section's hardest optional route. | `★` under hearts | permanent |
Small Moments are not pickups (they are places) but obey the same placement rules (§4).

## 2. What coins do (so they are worth wanting)
Coins are spent at **Crossroads Station only**, at Bilal's stall in the undercroft ("the Express"). Prices are in **worth**, so a musician coin (1) and a chef coin (5) buy the same things at different rates — that *is* the point: some dreams pay, some don't, and the player feels it.
| Buy | Cost | Effect |
|---|---|---|
| A tea (heart refill for the next dream's first section) | 20 | consumable |
| Heart shard | 150, 300, 600 | up to 3 |
| A "postcard" for a dream (marks its 3 Small Moment locations on the objective HUD) | 100 | per dream |
| A "return ticket" (one extra section-restart before hearts hit zero) | 250 | consumable |
| Hats (cosmetic, 6) | 50–400 | Auntie Ro comments on each |
Mr. Pemberton's ledger shows the wallet next to the tally; The Counter's gate counter also counts coins (§6). Coins are never required for progress. Coins are never a score.

## 3. Placement — the law
1. **The safe route pays nothing.** If there are two ways across a room, every coin is on the harder one. A player who takes the easy way sees the coins they didn't get.
2. **The hard route pays 3× the effort.** Price coins by risk: 1 coin over a safe hop, 3 in a line over spikes, 5 on a loose tile, 8 in an arc through a slicing gate, 10+ for a section-long optional detour. Use the tiers in `references/placement-patterns.md`.
3. **Coins are visible before the commitment.** Show the reward before the jump (vista, peek-down, or just on screen) so skipping is a *choice* the player makes and regrets.
4. **Coins draw the line the body should take.** A trail of coins is the jump arc, the slide path, the hang-drop landing. Never place coins where following them kills the player — coins are always honest.
5. **Key items are never skippable.** A key item sits **behind** the section's main challenge (its duel, its trap corridor, its puzzle-box) on a lit **pedestal** (Interactable/Carryable glyph, spotlight), and the section's exit **Gate requires it**. The lint fails any section whose key item can be reached without crossing at least one Foe encounter and one trap.
6. **One key item per gate, one gate per section.** More than that and the level becomes a fetch list; fewer and sections get skipped.
7. **Nothing free on the critical path** except 1–2 "breadcrumb" coins per screen that mark direction (a coin at the top of the correct ladder, one at the exit doorway). Breadcrumbs are worth 1 and never sit on a platform the player is already forced onto.
8. **Death drops coins.** Coins collected since the last checkpoint fly out of Jo on death (Sonic-style, up to 20 visible) and can be re-collected for 8 s. Key items return to their pedestal on death. Shards are kept.
9. **Difficulty scales placement, not amounts.** At `difficulty ≥ 2` move 30% of coins one tier riskier (over the hazard instead of beside it); at ≥ 3 remove all breadcrumbs.
10. **Every screen has something to want.** ≥ 1 coin cluster or pickup visible on every screen; a screen with nothing to pick up is a lint warning.

## 4. Where things hide (secrets, shards, Small Moments)
- Behind a **hinted** break (crack, draft, off-color tile, sound) — never behind an unmarked wall.
- Reached by a mechanic the section already taught, used *backwards* (hang-drop into a gap you'd normally jump over, sound-bridge from an anchor facing the wrong way).
- Never more than 20 s off the critical path and never past a one-way drop.
- Shard rooms contain the shard **and** 5–10 coins so a player who misses the shard still feels paid.

## 5. Key items are the dream's story in objects
Each dream defines 5–8 key items in `references/dream-items.md` (chef: saffron tin, stockpot lid, ticket spike, copper whisk, gold leaf…; musician: valve spring, coins for the repair, a setlist, the basement key, the festival wristband…). Rules:
- Each is a real object from the dream, drawn to the character-motion detail standard, with a **pedestal** sprite and a 1-line pickup card ("SAFFRON — the whole order dies without it").
- Picking one up **changes the objective HUD** and, where it fits, changes Jo's carry animation (a stockpot lid is held like a shield; a wristband shows on his arm).
- Delivering it plays a station animation (the risotto station flares; the trumpet valve clicks) and flips a flag the gate reads.
- Where a dream's mechanic allows, a key item is also a **tool for a room** (the lid blocks steam vents; the ticket spike pins a swinging pan) so the player uses it before spending it.

## 6. Coins and The Counter
The Counter counts. The gate's mechanical counter shows `dreamsCaught` and, under it, the wallet in tally marks. Nothing in the finale can be bought; the last thing Bilal says at 5 dreams is "Keep the change." The design intent: coins feel great in the dream and mean nothing at the end — but they must feel great first, or the point doesn't land.

## 7. Authoring workflow for a room
1. Draw the critical path and the optional routes on the room grid (D2 legend).
2. Place the key item behind the hardest mandatory beat; wire the exit gate `requires`.
3. Price every optional route by tier and lay coins on its motion line (arc, slide, drop).
4. Add 1–2 breadcrumbs on the critical path at decision points only.
5. Hide the shard / secret with a hint; add its consolation coins.
6. Run `npm run lint:rooms` — it checks: key item reachable only through ≥1 foe + ≥1 trap; gate requires the item; no coins on the forced path except breadcrumbs; every screen has ≥1 pickup; coin total per section within the dream's budget (`references/dream-items.md`).
7. Playtest: watch whether the tester *looks* at the hard route before choosing. If they don't see it, the coins aren't visible early enough (§3.3).

## 8. HUD & code
- `src/systems/wallet.js`: `{ total, byDream: {chef: n, …} }` in the save; `coin.worth` from `src/data/dreams.js`.
- `src/entities/Coin.js`: bob ±1 px at 2 Hz, 4-frame spin, magnet radius 1 tile, `coin` stinger pitch rises with each coin collected within 1 s (combo), `coin_drop` on death scatter.
- `src/entities/Pedestal.js` + `KeyItem.js`: spotlight cone, glint, pickup card via the tutorial-card panel, `satchel` array on Player, `Gate.requires` accepts `item:<id>`.
- HUD: coin icon + `small` count under the objective; `$` total right-aligned; satchel icons 9×9 under hearts.
