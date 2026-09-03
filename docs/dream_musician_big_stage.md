# DREAMCATCHER — DREAM SPEC: MUSICIAN — "THE BIG STAGE"

This document extends the global standard (Part A of `dreamcatcher_spec.md`). Everything there applies. This level is **Jo's own dream**, so it is the longest, the hardest, and the most personal one in the game. Target playtime: **15–18 minutes** first run.

**Assumptions (change if wrong):** Jo plays **trumpet** (fits the pixel-art hat/silhouette and is portable for platforming). The dream is set in one unnamed jazz city; time is compressed — each section is a "day" that stands for months. Jo's train arrives at night and leaves the next dawn, but inside the dream years pass.

---

## 1. STORY (read this first — every design decision serves it)

**Logline:** Jo gets exactly what he always wanted — a spot on the big festival stage — and learns that the night he's been chasing lasts eleven minutes, and the years he thought he was *waiting* were the actual life.

**Theme of the level:** the gap between *being heard* and *being listened to.* Applause is loud and short. The people who really listened were never in the crowd — they were beside him.

**Arc (seven "days"):**
1. **Tuesday** — Open-mic at *The Blue Cellar*. Jo plays to nine people and a bartender. Delphine, the owner, says "come back Tuesday." First taste. Shiny.
2. **The Corner** — Busking to pay for a broken valve. Coins, cops, cold. A kid stops to listen. Nia (bassist) hears him from across the street. Shiny inside dark.
3. **The Band** — Rehearsing in Nia's basement with Marcus (drums). Ray, an old saxophonist, tells Jo he's "playing notes, not music." Dark, then a breakthrough.
4. **The Road** — A van tour of three towns. Gig 1 great, gig 2 cancelled, van dies in the rain. Marcus quits. Dark.
5. **The Studio / The Offer** — Session work for money. A promoter called *Mr. Tally* (an echo of The Counter) offers the festival slot — if Jo plays a "safer" set and drops Nia. The player must choose. Grey.
6. **The Big Stage** — The festival. Eleven minutes. Blinding. Jo's mind goes blank mid-set, and he finds his way back with Ray's lesson. Shiny.
7. **After** — Backstage. Crew resets for the next act. Someone asks "who was that?" The orb floats over an empty folding chair. "Was it enough?"

**What the player should feel by the end:** proud, slightly hollow, and certain the best moment was the basement with Nia and Marcus on Day 3.

---

## 2. CAST

- **Jo** — player. Carries his trumpet (level tool) and a battered case.
- **Delphine** — owner of The Blue Cellar. 60s, cigarette, reading glasses on a chain. Kind by being blunt. Gatekeeper NPC.
- **Nia** — upright bassist. Dry humor, always tuning. Becomes Jo's closest collaborator. Companion NPC on Days 3–6 (follows Jo, can be "called" to hold a platform or a door).
- **Marcus** — drummer. Loud, generous, has a daughter and a rent problem. Quits on Day 4. His leaving must hurt.
- **Ray** — old tenor sax player who hangs at the Cellar. Mentor NPC. Says very little. Dies? **No.** He simply isn't at the festival. Jo looks for him in the crowd and he isn't there — he's at the Cellar on a Tuesday.
- **Mr. Tally** — promoter. Neat suit, clipboard, counts everything ("nine people, Jo. Nine."). Never hostile, always reasonable — that's what makes him dangerous. Foreshadows The Counter.
- **The Kid** — a girl with a backpack who stops at the busking corner. Never speaks. Appears again in the festival crowd (only if the player got Small Moment #1).
- **Enemies:** *Hecklers* (throw bottles from balconies), *Feedback Wisps* (screeching sound-spirits that chase; silenced by playing the right note), *Metronome Walkers* (mechanical legs that stomp on the beat), *Ticket Scalpers* (grab Jo's case and run), *Roadies* (on the stage, carry heavy cases across the path — unkillable, avoid), *The Static* (Day 6 only: creeping noise that erases the screen).

---

## 3. LEVEL MECHANICS (unique to this dream)

### 3.1 PLAY (core)
Press **Q** to play a note. Hold for a sustained note. Notes are visible as expanding golden rings.
- **Resonant objects** react to a ring: hanging signs swing, glass cracks, bells ring, dormant neon lights turn on, a dog stops barking, a bridge of light appears. Resonant objects glow faintly when Jo is within 3 tiles so the player knows they're playable.
- **Call & Response:** some objects show 4 note-icons above them (a phrase). Jo must play the phrase back **in rhythm** — press Q on 4 beats matching a visible metronome bar. Success = object activates. Failing three times shows a slower demo. This is the "puzzle in the world" mechanic.
- **Breath meter** (small bar under hearts): playing drains it; refills in 2 s of silence. Prevents infinite platforms.

### 3.2 SOUND BRIDGE
Hold Q while airborne near a **staff anchor** (a glowing treble clef) to extend a **line of light** from the anchor for as long as breath lasts (max 2.5 s). Jo can run on it. It fades 0.5 s after release. Chaining anchors across chasms is the level's signature platforming.

### 3.3 NERVE (performance sections only)
During gigs, a **Nerve meter** replaces Breath. Missing notes or getting hit raises Nerve. At 100% Jo "freezes" — controls lock for 1.5 s, crowd murmurs. Applause (successful phrases) lowers it. At difficulty ≥ 2, Nerve also rises slowly while standing still.

### 3.4 THE CASE
Jo carries his trumpet case in non-performance sections. It can be **set down** (E) to use as a 1-tile step or to weigh down a plate. Ticket Scalpers try to steal it — if stolen, chase and ladle— *no*, hit them with a played note (they drop it and flee). Losing the case for good = respawn.

### 3.5 COMPANION: NIA
From Day 3, Nia follows Jo. Press **F** to call her: she comes to Jo's position if reachable. She can: stand on a plate; hold a door; play a **bass note** that opens *low-resonance* objects (marked with a bass clef) Jo's trumpet cannot. Some puzzles require Jo on one switch and Nia on another. She cannot jump gaps > 3 tiles — the player must find her a path (rolling a barrel, lowering a plank).

---

## 4. SECTION MAP & TIMING

| Day | Section | Time | Checkpoints | Flags |
|---|---|---|---|---|
| 0 | Arrival — Rain on the Marquee | 0:45 | CP0 | — |
| 1 | Tuesday — The Blue Cellar | 2:30 | CP1a, CP1b | `mus.cellar_gig` |
| 2 | The Corner — Busking | 2:30 | CP2 | `mus.valve_fixed`, `mus.met_nia` |
| 3 | The Band — Nia's Basement | 3:00 | CP3a, CP3b | `mus.rehearsal`, `mus.ray_lesson` |
| 4 | The Road — Three Towns & a Dead Van | 3:30 | CP4a, CP4b, CP4c | `mus.tour_done`, `mus.marcus_left` |
| 5 | The Studio & The Offer | 2:30 | CP5 | `mus.mix_done`, `mus.choice` |
| 6 | THE BIG STAGE — The Set | 3:00 | CP6a, CP6b | `mus.set_done` |
| 7 | After — The Orb | 1:00 | — | `dreams.musician` |

**Palette progression:** Day 1 amber/indigo → Day 2 cold blue-gray with sodium orange → Day 3 warm brown, one lamp → Day 4 rain-slate desaturating to near mono by the van scene → Day 5 clinical white/teal → Day 6 pure stage color (magenta, cyan, white) → Day 7 dawn grey-gold. (Global darkness shader applies on top.)

**Music stems:** (1) walking bass (always outside gigs), (2) ride cymbal + brushes (Day 3+), (3) Jo's trumpet (only when Jo plays — reactive), (4) full band (Day 4 gig 1, Day 6), (5) solo muted trumpet (Day 4 van, Day 7).

---

## 5. SECTION DETAILS

### DAY 0 — Arrival: Rain on the Marquee (0:45)
Train hisses into a street-level siding. Rain. A theater marquee across the street reads **"MERIDIAN JAZZ FESTIVAL — SAT — THE BIG STAGE."** Jo stands under it for the title card: **"DREAM — THE BIG STAGE."**
**Props:** puddles reflecting neon (shader), a trumpet-shop window with a horn under a spotlight (resonant — play it and it rings; Jo's first note), fire escape, newspaper stand, a saxophone case abandoned by a bin (foreshadows Ray), pigeons.
**Dialogue D0:** Jo (to himself, first and only self-talk in the game): "Saturday. Big stage. That's… that's the whole thing. Everything before that is just waiting." *(This line is the lie the level disproves.)*
**HUD objective:** "Get to The Blue Cellar (open-mic, Tuesday)."
**CP0** — the marquee ticket booth bell.

---

### DAY 1 — Tuesday: The Blue Cellar (2:30)
**Layout:** street (1 screen) → stairs down → the club: a long basement with a tiny stage at the far end, then a back alley (1 screen).
**Teaches:** PLAY, resonant objects, first Call & Response, first performance (Nerve).

**Screen 1 — Street:** Bouncer at the Cellar door won't let Jo in with a case ("Musicians' entrance is round back"). Alley route: dumpsters, a fire escape too high — **first Sound Bridge tutorial**: a staff anchor glows on the wall; hold Q mid-jump to run the light-line up to the fire escape. Hecklers ×2 on a balcony throw bottles (telegraph: they lean back). A neon sign is dead — play it (resonant) and it buzzes on, lighting a hidden ladder.
**Screen 2 — Backstage corridor:** Cables to jump, a swinging boom mic (pendulum), Delphine at a desk.
**Dialogue D1:** Delphine: "Open mic. Two songs. If the bartender stops washing glasses, you were good. If Ray looks up, you were *very* good." (Ray is visible at the bar, not looking up.)
**Screen 3 — The Room (first performance, Nerve mechanic):** The stage is the platforming space: monitor wedges as platforms, a low ceiling of pipes. **Song 1** = a Call & Response sequence of **6 phrases** shown as note-icons drifting from the back of the room; play each in rhythm. Each hit = one audience member turns toward the stage (nine chairs, mostly empty). Misses raise Nerve; a bottle from a Heckler in the corner arrives on every 2nd miss. **Song 2** = the same but Feedback Wisps ×2 circle the stage and must be silenced (play a note when they're inside a ring) or they screech and add Nerve.
On finishing: the bartender has stopped washing glasses. Ray has **not** looked up. Nine people clap. **This is the first shiny moment — make it land:** slow-mo 1 s, warm light, a single sustained trumpet note, hearts refill.
**Dialogue D2:** Delphine: "Come back Tuesday." Jo: "That's it?" Delphine: "That's *everything*, honey. Tuesday's the whole job."
**Small Moment #1 — "Nine":** After the gig, go back to the stage instead of leaving. Jo sits on the edge and counts the chairs. A woman who stayed is still sitting with her coat on, eyes closed. 6 s. Text: *"She'd stayed for the second song."*
**Exit:** back alley — a **Ticket Scalper** grabs the case; chase him over bins and fences; a played note makes him drop it. Sets `mus.cellar_gig`.
**CP1a** backstage desk bell; **CP1b** alley streetlamp.

---

### DAY 2 — The Corner: Busking (2:30)
**Palette:** cold blue-gray, sodium-orange streetlights, breath visible. Jo's trumpet has a **stuck valve** (HUD shows the trumpet icon with a red valve): notes are randomly delayed 0–0.3 s. This is deliberate friction — Call & Response feels unfair until it's fixed.
**Layout:** a subway-mouth corner (1 screen) → three-block walk with rooftops (3 screens) → repair shop (1 screen).

**Objective 1 — Earn 12 coins:** stand on the corner and **play** to passers-by (NPCs stream by on a loop). A **Call & Response** phrase appears over each passer-by's head when they're near; hitting it = they drop 1–2 coins into the case. Missing = they walk on. Some pedestrians are **cops** — if Jo plays while a cop is on screen, he must stop (release Q) or lose 3 coins ("permit?"). Wind gusts push the case; keep it near or coins scatter.
**Objective 2 — Cross three blocks to the repair shop (rooftop route):** the street is blocked by a parade barricade; go up a fire escape and across rooftops. Hazards: **rooftop vents** (steam, launch upward), **loose slates** (crumble 0.8 s), **washing lines** (grab and swing), **Metronome Walkers** ×3 (mechanical legs that stomp in 4/4 — cross on the off-beat; the beat is audible in the music). Two **staff anchors** across an alley gap.
**Repair shop — Puzzle-box P1: "Tuning":** Modal. The repairman ("Old Sol") lets Jo fix the valve himself. Screen shows three horizontal **waveforms**; the player slides each valve slug (three sliders) until each waveform matches a reference waveform overlaid in gold (amplitude + frequency). Feedback: the closer you get, the purer the tone sounds (procedural audio). A "cents" readout shows deviation. Success = clean note, red valve icon clears, note delay removed. Sets `mus.valve_fixed`.
**Dialogue D3 (Old Sol, after):** "Twelve coins. That's four hours of your life for a spring the size of a fingernail. Worth it?" Jo: "…Yes." Sol: "Good answer. Wrong reason. You'll learn."
**Meet Nia:** back on the corner at dusk, Jo plays with the fixed valve — a **bass note** answers from across the street. Nia leans on a lamppost with her upright bass. **Dialogue D4:** Nia: "You rush the third bar." Jo: "Who are you?" Nia: "Someone who's going to keep telling you that. Basement, Thursday. Bring the horn, not the ego." Sets `mus.met_nia`.
**Small Moment #2 — "The Kid":** during busking, one passer-by is a girl with a backpack who **stops** and doesn't leave. If Jo plays a full phrase for her (any phrase, even imperfect), she stays through it, then goes. No coins. 8 s. Text: *"She didn't have any money. She had time."* (Flag `mus.moment2` — she reappears on Day 6.)
**CP2** — the repair shop bell.

---

### DAY 3 — The Band: Nia's Basement (3:00)
**Palette:** warm brown, one hanging bulb, posters, a space heater glow. Music: brushes stem enters. **Nia becomes a companion.**
**Layout:** basement (2 screens wide, cluttered) → boiler room (1 screen) → The Blue Cellar again (jam night, 1 screen).

**Introduce Marcus:** he's assembling a drum kit; cymbal stands everywhere (they're platforms; hitting one makes it crash and drop). **Dialogue D5:** Marcus: "Jo! Nia says you rush. Everybody rushes. Rushing's just wanting it too bad." He laughs. Jo should like him instantly. Make him warm.

**Puzzle in the world — "The Space Heater":** the basement fuse keeps tripping. Three breakers on three levels. Requires Jo and Nia on two pressure plates simultaneously while Marcus (NPC, scripted) hits the third with a drumstick on a **Call & Response** cue Jo plays. Order matters: plates → phrase → Marcus hits → lights stay on → boiler room door unlocks. Sets `mus.rehearsal`.
**Boiler room (vertical, 2 screens):** pipes hiss steam (launch), a **bass-clef object** (a heavy grate) only Nia can open — Jo must lower a plank so she can reach it. Feedback Wisps ×3 live in the boiler (the building's hum) — silence them as a trio: they only die when **Jo and Nia play together** (press Q while Nia is within 2 tiles and she auto-plays).
**Jam night at the Cellar — RAY'S LESSON (the emotional pivot of the level):** Jo, Nia, Marcus play. It's a 5-phrase Call & Response, easy. The crowd is bigger (twenty). Jo nails every phrase — and Ray gets up and walks out mid-song. Nerve spikes to 60% by script.
**Dialogue D6 (alley, Ray, lighting a cigarette):**
> Ray: "You played every note right."
> Jo: "…Thank you?"
> Ray: "Wasn't a compliment. A player piano plays every note right. You're playing *notes*, son. Play the *room*."
> Jo: "I don't know what that means."
> Ray: "Then stop playing until you do."
**Puzzle-box P2: "Play the Room":** Modal. A dark stage with a single spotlight. A phrase appears — but this time **no note-icons**: the player hears a 4-note phrase (audio only, plus a faint rhythm pulse on screen) and must play it back. Then a second phrase asks Jo to **answer, not copy**: three answer options are offered as icons (copy / harmony / silence), and the correct one is *silence* for the last bar. The puzzle explains nothing; it lets the player discover that leaving the last bar empty makes the spotlight widen and the room "breathe." Three rounds. Success sets `mus.ray_lesson` — and from now on, **Call & Response phrases include a "rest" note** (a hollow icon: do NOT press). This permanently changes the level's core mechanic. Ray, outside, nods once. He still doesn't say anything.
**Small Moment #3 — "The Third Take":** In the basement after the jam, Marcus's daughter (asleep on a beanbag) has drawn the band on a napkin. Jo picks it up. 6 s. Text: *"Three stick figures. One had a hat."*
**CP3a** basement bulb (play it to swing it — it's the bell); **CP3b** Cellar alley lamp.

---

### DAY 4 — The Road: Three Towns & a Dead Van (3:30) — THE DARK DAY
**Structure:** three short stops connected by van "driving" interludes (side-scrolling van on a highway, Jo on the roof? No — keep it grounded: the van interior is a **rest screen** with dialogue; the map between towns is a road sign that pans).

**Stop 1 — Riverside Pavilion (shiny, 1:00):** an outdoor bandstand at sunset, gold light, ninety people. Full-band stem. A **7-phrase** Call & Response with rests; Nia and Marcus visible playing behind Jo; lanterns over the water light up with each hit. Perfect run = fireworks (cheap, 2 s). Delphine is there ("drove two hours, don't make it weird"). Everything is right. **The player must be allowed to feel the whole shape of the dream here.**
**Van interlude 1 — Dialogue D7:** Marcus: "That's it. That's the feeling. I could do this forever." Nia: "You can't do it for free forever." Marcus (quieter): "Yeah." *Plant the seed.*

**Stop 2 — The Saltbox (dark, 0:45):** a bar in a strip mall. Rain begins. Sign on the door: **"BAND CANCELLED — TV NIGHT."** No gig. The section is a **stealth-platform** through the back lot to retrieve their deposit from the office: a barking dog (resonant — play a soft sustained note to calm it), a manager who paces (avoid his flashlight cone), a locked office (Nia bass-note opens the vent). The deposit envelope is **empty**. No dialogue. Just the envelope and the rain. Sets nothing; the player just leaves.

**Stop 3 — The Highway (dark, 1:45):** the van dies on a shoulder in the rain at night. Palette nearly monochrome; only tail-lights red. Music: solo muted trumpet, then **nothing** — this is the only silent section in the game.
**Objective — "Get to the gas station lights (1.2 km):"** a long walk right in rain, wind pushing left. The **case is heavy** now: run speed −20% while carrying. Hazards: passing trucks spray water (telegraph: headlights growing), a broken guardrail gap needing a staff anchor bridge — but **rain damps Jo's notes**: bridges last half as long, so two anchors must be chained faster. Marcus lags behind; call him with F — but he stops responding halfway.
**Dialogue D8 (under a bridge, sheltering):**
> Marcus: "Jo. I got the call. The warehouse job. Days, benefits. Starts Monday."
> Jo: "We've got the festival in—"
> Marcus: "You've got the festival. I've got a kid who thinks daddy's a drummer because he saw a napkin."
> Nia: (nothing. She's looking at the road.)
> Marcus: "Play the room, right? Well, I *am* the room, man. I'm telling you what I need."
> Jo: [choice] **"Then go."** / **"Stay one more week."** / **[say nothing]**
Choices affect one line and one memory: *Then go* → Marcus hugs him, leaves. *Stay* → "I'll stay till the festival. Then I'm gone." (He is on the Day 6 stage, playing.) *Nothing* → he waits, then walks. (Day 6 has a session drummer who never looks at Jo.) Sets `mus.marcus_left = go|stay|silent`.
At the gas station: neon buzzing, a payphone (resonant — play it and it rings, weirdly, no one answers). Sets `mus.tour_done`.
**CP4a** pavilion lantern; **CP4b** Saltbox back door; **CP4c** bridge underpass (a dripping pipe — play it).

---

### DAY 5 — The Studio & The Offer (2:30) — THE GREY DAY
**Palette:** clinical white, teal LEDs, acoustic foam. Everything is quiet, padded. Jo is here for money: a session for a car commercial.
**Layout:** live room (1 screen, isolation booths as rooms) → control room (puzzle) → rooftop parking lot (the offer).

**Live room:** platforming over mic stands and baffles; **"Red light" hazard** — when the RECORDING light is on, any footstep noise (landing without a crouch, hitting props) fails the take: the room flashes, Jo restarts at the booth door. Teach: land while holding Down = silent landing. Metronome Walkers ×2 (the click track, literally) patrol the floor.
**The take:** a Call & Response of **8 phrases with no rests allowed** — the producer wants every bar filled ("sell it, sell it!"). Rest icons appear (from Ray's lesson) and the player must **ignore his instinct and press anyway**; each filled rest makes the producer thumbs-up and makes Jo's portrait wince. It should feel wrong. That's the point.
**Puzzle-box P3: "The Mix":** Modal. A mixing desk with six faders (Trumpet, Bass, Drums, Click, Voice-over, Jingle). A meter shows "CLIENT APPROVAL." Target: raise approval to 100%. The only solution: Jingle and Voice-over up, Trumpet down to −12 dB (barely audible). The desk audibly lets the player hear the result. Success sets `mus.mix_done`. Producer: "Perfect. Nobody'll even notice you." Jo gets paid (case now has a "$" icon — the van gets fixed offscreen).
**Rooftop — Mr. Tally:** lawn chair, clipboard, sunset over a parking lot.
**Dialogue D9:**
> Tally: "Nine people at the Cellar. Ninety at the pavilion. Zero at the Saltbox. I count. It's what I'm for."
> Tally: "I book the Big Stage. Saturday. Eleven minutes, four-thirty slot, right before the headliner. Eight thousand people."
> Jo: "…"
> Tally: "Two conditions. One: the set list is mine — crowd-pleasers, no rests, no… *silences*. Two: the bass player. She's not television. I've got a session guy."
> Jo: [choice] **"Deal."** / **"Nia plays or I don't."** / **"Let me think."**
- **Deal** → `mus.choice = tally`. Nia isn't on Day 6. Day 6 has no rests; the set is easier mechanically and emotionally hollow; Jo's mind-blank moment cannot be recovered with Ray's lesson (see Day 6) — the player must brute-force it. End message adds a line.
- **Nia plays or I don't** → Tally shrugs: "Four-forty-five then. After the headliner. Half the crowd will have left." `mus.choice = nia`. Day 6 is harder (smaller crowd = Nerve rises faster) but the rests are there and the recovery works.
- **Let me think** → Tally: "Sure. Think till Friday." A second dialogue on the Day 6 loading dock forces the same choice.
**CP5** — control room talkback button.

---

### DAY 6 — THE BIG STAGE: The Set (3:00) — THE CLIMAX
**Approach (0:45):** festival backstage. Roadies carry cases across catwalks (unkillable; time your crossings), cable-bridges sway, a **lighting rig** is the vertical climb: trusses, moving-head lights that sweep (their beam is a hazard — it blinds: the screen whites out 0.5 s if Jo stands in it), and **Feedback Wisps** ×6 in the wing monitors. Jo looks for Ray in the crowd from the wing: not there. (If `mus.moment2`, The Kid is visible on someone's shoulders, front row.) Nia (if present) says: "Rush the third bar and I'll end you." Marcus/session drummer per `mus.marcus_left`.
**The set — three songs, one long sequence (2:15). The stage is the arena.** The platforms are risers that **move on the beat**; the crowd is a rolling wave of silhouettes at the bottom (falling into it = lost 4 s and +20 Nerve, hoisted back). Hazards escalate per song: pyro jets (song 2), a **camera crane** sweeping (song 3), and **The Static** — a wall of grey noise creeping from the left that erases the level; it advances on misses, retreats on hits.
- **Song 1 "Tuesday"** — 8 phrases with rests (or without, per choice). Straightforward, big.
- **Song 2 "The Corner"** — 10 phrases; Hecklers reappear as *two* balcony bottle-throwers; the risers now split into two lanes and phrases alternate lanes (move + play).
- **Song 3 "The Road"** — 12 phrases, the fastest. Halfway through, scripted: **Jo goes blank.** The screen goes black except Jo; the crowd sound cuts; the Nerve meter is at 100. A single hollow note-icon (a **rest**) appears. If `mus.choice = nia`: the bass note comes in from the dark — Nia's ring — and the player recovers by **doing nothing for one bar** (Ray's lesson) as the lights come back one at a time. If `mus.choice = tally`: no bass note; the player must mash through a 6-phrase blind Call & Response with only audio cues and gets back a colder version of the stage.
**Final phrase = a single sustained note (hold Q for 4 s, breath meter drains to exactly zero).** Freeze. Eight thousand (or four thousand) silhouettes. Applause is **huge and short — 3 s, hard cut**. Sets `mus.set_done`.
**CP6a** loading dock; **CP6b** side-stage (mid-set, after song 2).

---

### DAY 7 — After: The Orb (1:00)
Backstage. Dawn is starting. The crew is already striking the stage — Roadies roll cases past Jo without looking. The headliner's banner unfurls where Jo's name was. Someone in the dark (a stagehand): "Who was that?" Another: "Dunno. Trumpet guy."
No hazards. One long walk right through the emptying backstage, past a folding chair with Jo's case on it. Nia (if present) is packing her bass; she hands him a coffee and says nothing — she nods at the chair. Music: solo piano (the global Orb stem) with a single muted trumpet answering.
The **orb** floats above the folding chair. Jo catches it. White fade.
Text cards: *"The Big Stage."* → *"Eleven minutes."* → *"Was it enough?"* → Small-Moment message per global rule, plus:
- if `mus.choice = tally`: *"You didn't rush the third bar. Nobody was listening for it."*
- if `mus.choice = nia`: *"Somebody was listening for the third bar."*
- if `mus.marcus_left = stay`: *"Marcus drove home Sunday. He kept the napkin."*
Sets `dreams.musician = true`.

---

## 6. DIFFICULTY DESIGN (this level must not be easy)
- Rhythm windows: Perfect ±60 ms, Good ±120 ms at difficulty 0; shrink 10 ms per difficulty step.
- Day 4 highway: rain damping halves bridge duration; at difficulty ≥ 2 wind gusts also knock Jo off bridges.
- Day 6: Static advances 1 tile per miss (2 at d≥2); at d≥3 song 3 has no side-stage checkpoint.
- Nerve rises passively in all gigs at d≥2.
- Hecklers: +1 per gig at d≥1. Feedback Wisps: +2 per section at d≥2.
- Fail states are never "game over": every gig restarts at the current song, every walk at the last checkpoint. Punish with *repetition*, not deletion.

## 7. IMPLEMENTATION NOTES
**Tiled layers:** as global, plus `resonant` (object layer: `{kind, phrase:"1,0,1,1" (1=note,0=rest), reaction}`), `anchors` (staff anchor points), `crowd` (parallax silhouette bands with mood parameter).
**New object types:** `resonant{...}`, `anchor{maxLen}`, `companion_spawn{npc:"nia"}`, `bassclef{...}`, `gig{songId, phrases:[...], hazards:[...]}`, `choice_dialogue{id, flagWrites}`, `record_light{period}`, `static{speed}`.
**Flags:** `mus.cellar_gig, mus.valve_fixed, mus.met_nia, mus.rehearsal, mus.ray_lesson, mus.tour_done, mus.marcus_left(go|stay|silent), mus.mix_done, mus.choice(tally|nia), mus.set_done, mus.moment1, mus.moment2, mus.moment3, dreams.musician`.
**Rhythm engine:** all Call & Response uses a single beat clock synced to the music stem (BPM per section: Cellar 96, Corner 88, Basement 104, Pavilion 120, Saltbox —, Highway —, Studio 110, Big Stage 128). Input latency calibration screen in Options (tap to a click, 8 taps, average offset stored).
**Audio:** Jo's trumpet is a sampled note set (12 pitches) triggered by Q; pitch chosen by the phrase, not the player. Nia's bass: 6 pitches. Procedural "purity" filter for P1 tuning.
**Sound list (minimum 30):** trumpet ×12, bass ×6, ring-resonance, glass crack, neon buzz-on, bottle smash, heckle ×3, feedback screech, wisp silence-pop, metronome stomp, coin drop, case thud, cop whistle, wind gust, slate crumble, vent hiss, cymbal crash, fuse trip, boiler hum, applause small/medium/huge, rain loop, truck pass, van cough-die, payphone ring, record-light beep, take-fail buzzer, pyro, crane sweep, static grow, hard-cut silence.

## 8. ACCEPTANCE (in addition to global checklist)
- First-time playtime ≥ 15 min; at least one tester fails Day 6 song 3 once.
- A tester who did not read this doc can explain, unprompted, why Ray walked out.
- Day 4 highway has no music and testers report it as the "worst" day — and Day 3 basement as their favorite. If Day 6 is the favorite, the level has failed.
- Both `mus.choice` branches are fully playable to the orb.
- No screen violates the global density rule, including the highway (rain, trucks, signs, guardrail, wreckage, litter, a single glowing gas-station sign in the distance count as props).
