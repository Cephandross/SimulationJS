/**
 * FootSoldier → Basic Infantry (frame 27)
 * Shieldbearer → Armored Infantry (frame 28)
 * Healer → Wizard (frame 24)
 */
class FootSoldier extends Unit {
    constructor(coords) {
      super({ type: 'FootSoldier', coords, hp: 15, movePts: 1, actionPts: 1 });
      this.attack      = 5;
      this.defense     = 3;
      this.spriteKey   = 'UnitSheet1';
      this.spriteFrame = 27;  // Basic Infantry
    }
  }
  
  class Shieldbearer extends Unit {
    constructor(coords) {
      super({ type: 'Shieldbearer', coords, hp: 20, movePts: 1, actionPts: 1 });
      this.attack      = 3;
      this.defense     = 6;
      this.spriteKey   = 'UnitSheet1';
      this.spriteFrame = 28;  // Armored Infantry
    }
  }
  
  class Healer extends Unit {
    constructor(coords) {
      super({ type: 'Healer', coords, hp: 12, movePts: 1, actionPts: 1 });
      this.healAmt     = 4;
      this.spriteKey   = 'UnitSheet1';
      this.spriteFrame = 24;  // Wizard (as a placeholder for healer)
    }
  }
  