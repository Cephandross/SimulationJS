// src/units/Utility.js

class Worker extends Unit {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Worker',
      owner: owner,
      coords: coords,
      scene: scene,
      hp: 10,
      movePts: 1,
      actionPts: 2
    });
  }
}
window.Worker = Worker;

class Builder extends Unit {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Builder',
      owner: owner,
      coords: coords,
      scene: scene,
      hp: 10,
      movePts: 1,
      actionPts: 2
    });
  }

  /**
   * Only build on an orthogonally adjacent tile.
   */
  build(BuildingClass, coords, scene) {
    const [tx, ty] = coords;
    const [bx, by] = this.coords;

    // Manhattan distance must be 1
    const dist = Math.abs(tx - bx) + Math.abs(ty - by);
    if (dist !== 1) {
      console.warn('Builder too far:', this.coords, '→', coords);
      return false;
    }

    // Delegate to the player's build() method
    return this.owner.build(BuildingClass, coords);
  }
}
window.Builder = Builder;