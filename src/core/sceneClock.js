// Phaser only sets a scene clock's `now` in its update, so a scene started again
// reads, all through create(), the moment it last ran. `now + 99999` taken there
// has already passed on the first frame: back from any dream over 100 s, Jo was
// not locked through the train's return. Start each run on the loop's own time.
export function installSceneClock(Clock) {
  const start = Clock.prototype.start;
  Clock.prototype.start = function () {
    start.call(this);
    this.now = this.systems.game.loop.now; // (the time the scene's update gets, not loop.time)
  };
}
