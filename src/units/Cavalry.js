/**
 * LightRider, HeavyCavalry — both use the horse icon (frame 371)
 */
class LightRider extends Unit {
    constructor(coords) {
      super({ type: 'LightRider', coords, hp: 18, movePts: 2, actionPts: 1 });
      this.attack      = 6;
      this.defense     = 4;
      this.spriteKey   = 'UnitSheet1';
      this.spriteFrame = 371; // Horse
    }
  }
  
  class HeavyCavalry extends Unit {
    constructor(coords) {
      super({ type: 'HeavyCavalry', coords, hp: 25, movePts: 2, actionPts: 1 });
      this.attack      = 8;
      this.defense     = 5;
      this.spriteKey   = 'UnitSheet1';
      this.spriteFrame = 371; // same horse icon
    }
  }
  