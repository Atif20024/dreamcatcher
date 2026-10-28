# Round 2: the owner's own feedback

The owner played the game after phase 2. These points are first-hand and override any reviewer who disagrees. Every one must be verified, located in code, and fixed in the round 2 fixes.

1. **Scale mismatch.** Jo is now big (~82 px), but everything else is at the old scale: NPCs, foes, buildings and backgrounds, interactable elements, props.
   - Trees are about the same height as Jo, which is impossible.
   - The trains are far too small next to Jo. Rethink how the train is presented (for example, a carriage at platform level that Jo boards through a door, with the rest of the train reading at a plausible length). It must feel natural, not "built by a noob".
   - Check the aspect ratio and real-world proportion of every entity relative to Jo.
2. **Readability.** Pause (Esc) works well now, but text is still hard to read in places.
3. **Give the whole game a character.** A coherent identity across the title, station, dreams and finale.
4. **Jo's hat** sat behind his head and was misaligned. A fix landed in commit 92737f5 (no one-frame lag, drawn above the body). Confirm it in every pose.
5. **The shadow jumps with Jo.** When Jo jumps, his ground shadow rises with him. It should stay on the ground below him, shrinking and fading with height, and disappear over gaps or snap to whatever ground is under him.
6. **Slopes and stairs are not smooth.** Walking from a slope or staircase onto flat ground (and from flat onto a slope or stairs), Jo hops or snaps at the end instead of transitioning smoothly. Walking up and down stairs and slopes, and the joins between them and the flat, must be continuous with no jump, bump or catch.
