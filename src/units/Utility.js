/**
 * Worker & Builder — both use Farmer/Worker (frame 74)
 */
class Worker extends Unit {
    constructor(coords) {
      super({ type: 'Worker', coords, hp: 10, movePts: 1, actionPts: 2 });
      this.spriteKey   = 'UnitSheet1';
      this.spriteFrame = 74;  // Farmer/Worker
    }
  }
  window.Worker = Worker;
  class Builder extends Unit {
    /**
     * @param {[number,number]} coords  starting [x,y]
     */
    constructor(coords) {
      super({ type: 'Builder', coords, hp: 10, movePts: 1, actionPts: 2 });
      this.spriteKey   = 'UnitSheet1';
      this.spriteFrame = 74;
    }
  
    /**
     * Only build on an orthogonally adjacent tile.
     * @param {class} BuildingClass
     * @param {[number,number]} coords  [tx,ty]
     * @param {Phaser.Scene} scene
     * @returns {boolean} success
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
  
      // Delegate to the player’s build() as before
      return this.owner.build(BuildingClass, coords, scene);
    }
  }
  
  window.Builder = Builder;