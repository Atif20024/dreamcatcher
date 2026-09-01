// One depth scale for the whole game.
//
// Everything the backdrop and the terrain draw sits BELOW zero, because a
// scene that calls `scene.add.image(...)` without a depth gets 0 — and with
// the terrain at a positive depth those props rendered behind the floor and
// were simply invisible. Anything a level adds without thinking about depth
// now lands in front of the world, which is the safe default.
export const D = {
  SKY: -30,
  BG_FAR: -26,
  BG_SCENERY: -24,
  BG_MID: -22,
  BG_LANDMARK: -21,
  BG_NEAR: -20,
  ZONE_TINT: -15, // room mood washes: over the backdrop, under the terrain
  BEHIND: -11, // decor meant to be occluded by the level (distant glows, birds)
  SUPPORT: -12,
  SUPPORT_SHADOW: -11,
  TERRAIN: -10,
  LIQUID_TOP: -9,
  HAZARD: -8,
  // 0 = a level prop that never asked for a depth. In front of the world.
  PROP_SHADOW: 5,
  INTERACT: 8,
  FOE: 12,
  PLAYER: 12,
  PLAYER_ATTACH: 13,
};
