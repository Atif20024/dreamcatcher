# Audio pass: the whole game

The owner asked for two things. First, "music should be appropriate based on which level, era, inside/outside". Second, "sound of some other elements present in the game, maybe npc chatter, birds, or anything you can think of". The plan was `docs/redesign/advice/audio_advice.md`, and this pass builds its list from the top.

Nothing was heard. Dev is silent and nobody listened. Every number below comes from an offline render of the game's real audio code (`tests/audioMix.test.js`). Tuning by ear is the owner's job, with `?sound=1`.

## What changed

### The mix (build items 1, 2 and 10)
- **Master chain** (`src/systems/audio.js`). Every sound passes through it in this order:
  - master gain 0.35
  - compressor: -14 dB, 4:1, 5 ms attack, 200 ms release
  - limiter: -3 dB, 20:1
  - soft ceiling at -1 dBFS
  - mute, which DEV_SILENT holds at 0
- **Make-up gain.** The browser's compressor adds make-up gain on its own, so a trim removes it again. The chain can only turn things down.
- **Dev creates no AudioContext at all.** No nodes are created, nothing is scheduled, and no audio thread runs. Before this pass, dev kept a suspended context and leaked a node for every sound.
- **One synth voice** (`src/audio/synth.js`) makes every sound:
  - 5 ms ramps, so nothing starts with a hard step. Before this pass, a gain started at 1 before its envelope, so every triangle clicked at full scale on its first sample.
  - Square waves always go through a low-pass at 3 kHz or below. Past four squares a second, the next one plays as a triangle.
  - The trumpet and accordion get a 15–20 ms attack and a 2.2–2.5 kHz low-pass. The woof is now a saw through 600 Hz.
  - Voice cap: 24 oscillators and 8 noise sources. A new voice steals the oldest voice of lower priority: chatter first, then one-shots, then the music's pulse. A stinger is never stolen.
  - Noise comes from one shared buffer, so nothing is allocated per shot. Each voice disconnects itself when it ends.
- **Buses** (`src/audio/AudioBus.js`):
  - Ducking: music -4 dB and ambience -3 dB while a dialogue modal is open, hooked in `ModalManager`. Music dips -6 dB under a stinger and recovers over 800 ms.
  - A wall stage: two low-passes at 900 Hz and -9 dB.
  - A `chatter` bus, which follows the ambience slider.
  - Calibration trims, so each bus lands on its target level.
- **A reverb fix.** The room reverb's damping filter had a +2 dB bump at its cutoff. With the hall and chapel feedback, that made the combs ring up without end. This affects the painter's chapel too. The filter is flat now, and the wet level is normalised by RMS (it had been about 15 dB too quiet).
- **The music clock** (`src/audio/clock.js`) schedules every note on the audio clock with a 150 ms look-ahead. The game's `beat` event fires at the beat's own moment.
  - When no context is running, the clock falls back to the page clock: in dev, or before the first click.
  - A stall, such as a background tab, re-anchors the beat grid instead of firing a burst of missed beats.

### Places (build items 3–8, 11 and 13)
- **Bands for the legacy places** (`src/audio/bands.js`). They replace the one shared swing band, and its old `setInterval` gig helpers now push parts of the place's own band. See the table below.
- **Framework keys:**
  - clockmaker: `src/dreams/clockmaker/music.js`
  - musician: `src/dreams/musician/music.js`
  - Each room names its `key`, `acoustics`, `events` and `wall`.
- **Instruments** (`src/audio/instruments.js`) cover the Renaissance set plus about 25 new ones: piano, felt piano, music box, fiddle, pizzicato, upright, brushes, cup-muted trumpet, Rhodes, power chord, kick, snare, arp, vibes, 70s synth pad, nylon guitar, harmonica and more.
- **Loops:**
  - New: the hall (`hub_hall` + `hub_crowd`), `pistol`, `monitors`.
  - Second layers of other lengths, so a bed never lines up the same way twice: rain 6 s + 9 s, two clocks at 1.0 s and 1.37 s, the casino murmur, the station vent, the kitchen fan, and rain on the writer's window.
- **EventBed** (`src/audio/events.js`, `places.js`): about 50 one-shots, made from synth voices and filtered noise.
  - Each fires at random within its own interval, with a pan, a distance level, ±6% pitch and ±2 dB level. Nothing fires before 6 s, and no shot plays twice in a row.
  - A pass-by (traffic, a train, a trolley) pans across the field.
- **ChatterVoice** (`babble.js`, `chatter.js`): wordless voices, made of a saw through three vowel formants.
  - Someone talks when Jo comes within 220 px, panned and low-passed by distance and silent at 320 px.
  - Each person has an 8–12 s cooldown, and at most 3 talk at once.
  - A voice comes from the id, so the same person always sounds the same.
  - In DreamScene the speakers are the NPCs. In the legacy scenes they are the built level's `npc` objects, and in the station they are its people.
- **Chase and catch** (DreamScene):
  - When a person is alert, the music turns tense: the throb comes in, the lead drops 6 dB, and the tempo rises 8%. It returns to the room's state 4 s after the last foe loses Jo.
  - A catch cuts the band for 250 ms, then plays one low note.
- **The station** has the hall's air and crowd. The crowd thins, and the reverb grows from wet 0.14 to 0.30, as dreams are caught. It also gets the one-shots in the table below.

## Per place (offline, 10 s, pre-master dBFS RMS; output after the master chain)

Targets: music about -18 to -22, ambience about -26 (rain -22), a voice while it talks about -26, output peak at or below -1 dBFS.

| Place | Music | Ambience (loop + layers) | One-shots | Music | Amb. | Voice | Out RMS / peak |
|---|---|---|---|---|---|---|---|
| Station hall | F Lydian 72; piano, triangle bass, saw pad, brushes, soft trumpet; stripped per HubState; the sweeper's hum when empty | hub_hall + hub_crowd (crowd × travellers) | announce (ding-dong + PA voice), pigeons, wings, far train, trolley, door, turnstile | -19.8 | -25.6 | -25.8 | -28.0 / -11.4 |
| Station, 5 caught | as above, pad + hum only | hub_hall + thin crowd | same | -18.1 | -29.5 | -25.9 | -27.1 / -11.3 |
| Clockmaker green | G Ionian 3/4 78; music box, pizzicato oom-pah-pah, fiddle, quiet tick | meadow_dusk | birds, swifts, far dog, church bell | -19.1 | -29.6 | -26.0 | -28.2 / -6.8 |
| Clock house (room) | G Aeolian 3/4 54; music box alone over the escapement | clock_room + clock_slow | cuckoo, spring creak, gear whirr, the hour | -21.8 | -32.2 | -25.9 | -30.9 / -8.1 |
| Rain street | D Dorian 96; upright, brushes, cup mute, Rhodes chords | rain_street + rain_far | traffic pass-by, horn, drain, far siren | -20.2 | -22.3 | -25.9 | -27.3 / -9.5 |
| Alley (cellar through the wall) | the cellar's trio, 900 Hz, -9 dB | rain_street + rain_far | as street | -15.4 → wall | -22.3 | -25.9 | -29.2 / -12.6 |
| Blue Cellar (club) | D Dorian 86 trio, Rhodes | club_room | glass clink, chair scrape, laugh, applause | -20.7 | -28.7 | -26.0 | -29.3 / -10.3 |
| Backstage (room, door 700 Hz) | E Mixolydian 110 rock, driven lead | festival | cheer, "check one-two", feedback, case latches | -18.7 | -24.7 | -25.8 | -32.1 / -16.0 |
| Arena (hall) | E Mixolydian 120; power chords, kick, snare, arp | festival | cheer, feedback | -19.0 | -24.8 | -25.8 | -27.2 / -12.4 |
| Painter piazza / street / bottega | unchanged keys | unchanged loops | piazza: bell for the hour, swifts | -17.9 / -17.8 / -17.3 | -26.2 / -30.0 / -31.0 | -26 | -26.8 / -10.3 |
| Painter speziale / hall / palazzo / chapel | unchanged keys, levelled (gain 1.5 / 0.45 / 1.4 / 0.2) | unchanged | — | -22.1 / -18.9 / -20.6 / -17.3 | -32 / -32 / -33 / -30 | -26 | -26.5…-30.7 |
| Chef kitchen (room) | radio swing C Ionian 112, band-passed 400–3400 Hz, crackle | sizzle + kitchen_fan | pan clatter, ticket bell, chopping, order called, steam | -20.9 | -25.8 | -25.8 | -29.7 / -9.2 |
| Writer attic (room) | felt piano A Dorian 60, typewriter pulse | typewriter + rain_window | carriage bell, paper, crumple, the hour | -19.9 | -31.4 | -26.3 | -28.8 / -12.2 |
| Astronaut hull | 70s synth D Lydian 66, plinks, heartbeat as danger | engines + station_vent | console beeps, relay, airlock, radio chirp | -19.4 | -22.9 | -25.8 | -26.9 / -11.5 |
| Casino floor (room) | lounge swing F Dorian, vibes, slow horn | slots + casino_murmur | chips, slot jingle, win bell, shuffle, dice, cheer | -18.6 | -23.6 | -26.0 | -26.8 / -10.9 |
| The Evening | its own Ensemble (felt piano, harmonica, nylon guitar now), at its old level | Soundscape, at its old level | its own | -35.7 | -15.7 | -25.9 | -24.8 / -12.5 |

The full mix of the arena, every stem, three stingers, a chime, four SFX and the trumpet at once peaks under -1 dBFS, with zero samples over 0.99.

**Inside vs outside.** Measured against outside, a `room` preset is more than 20 dB down above 8 kHz, and down 5–8 kHz too. Music through a wall is 8.5 dB or more down and dark: above 2 kHz it falls a further 20 dB or more. Dialogue ducks the music by 3–5 dB.

**CPU.** The voice cap held in every place. The busiest were the casino (19 oscillators, 8 noise sources, 3 one-shots dropped) and the hub (14 and 7). At most 25 sources sound at once, counting music, loop layers and LFOs. A place creates about 110–390 nodes in 10 s, and each is unplugged when it ends. The scheduler thinks 4 times a second and creates nothing per frame.

## Checks
- `npm test`: 150/150. New: `tests/audioMix.test.js` (20 tests over 21 places), using the offline renderer `tests/helpers/fakeAudio.js`.
- `lint:content`, `lint:rooms` and `lint:scale` are clean. `npx vite build` succeeds.
- Browser (port 5198, silent): the station, the clockmaker, the musician (alley, cellar, stage), the painter's chapel, chef, writer, astronaut and gambler all warp in with no errors. In each, beds fire, chatter fires near people, and keys follow the rooms. The beat clock runs on the page clock.
- Full scenario run (`__dc.runScenarios()`, once, at the end): **104/104 passed**.

## What to listen for (`?sound=1`)
1. **The station.** A two-tone ding-dong, then a muffled PA voice every 25–40 s. Pigeons in the roof, and a train going by far off.
   - Catch a dream and come back: the hall should be emptier and more echoing.
2. **Walk past people** in any dream. A short, wordless burst, from the side they stand on. They should not repeat themselves within about 8 s.
3. **The rain street.** Cars pass left to right. Walk into the alley: the cellar's trio comes muffled through the wall. Then into the cellar: the same tune is clear and close.
4. **The arena** should sound like 80s rock, and **backstage** like the same band behind a door.
5. **The clockmaker's green** is a waltz on a music box. In the clock house it is the music box alone over ticking.
6. **Kitchen music** is a radio, thin and crackly. The **writer** is a single felt piano. The **station in orbit** is a slow synth. The **casino** has vibes.
7. **Painter.** The chapel and guild hall should no longer drown the street, and the chapel's echo should die away instead of building up.
8. **A dialogue box** dips the music a little. A checkpoint's chime dips it for a moment.
9. **Squares.** No harsh buzz on the trumpet, the gate, the hurt sound or the coin.
10. **Getting caught** while being chased: the band stops for a breath, then plays one low note.

## Known gaps
- **The Evening** keeps its own Soundscape scheduler and the Ensemble's rotation. Only the timbres are new. The dusk-driven stem strip, the bird-to-cricket crossfade and the final chime in the Evening's voice are not built.
- **The Intro platform** has no bed of its own.
- **Legacy NPC chatter** comes from the built level's `npc` objects (26 across the legacy rooms) and the station's `npcs` map. Extra people a scene draws by hand are not registered.
- **Levels** are from offline RMS, not loudness (LUFS) and not ears. The trims (music ×8, ambience ×4, chatter ×3.5) and the per-key gains are starting values.
- **The Evening's ambience** sits at its old, hotter level, -16 dBFS pre-master.
- **The fake renderer** models Chrome's compressor make-up gain and the biquad Q in dB, but it is not the browser. Peaks in the browser may differ by a dB or two.
