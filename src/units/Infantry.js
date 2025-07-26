// src/units/Infantry.js - Clean unit definitions only

/**
 * FootSoldier → Basic Infantry (frame 1)
 * Shieldbearer → Armored Infantry (frame 7) 
 * Healer → Cleric (frame 15)
 */

class FootSoldier extends Unit {
  constructor(coords, owner = null, scene = null) {
    super({ 
      type: 'FootSoldier', 
      coords, 
      owner, 
      scene, 
      hp: 15, 
      movePts: 1, 
      actionPts: 1 
    });
    
    // Combat stats
    this.attack = 5;
    this.defense = 3;
    this.range = 1;
  }
}

class Shieldbearer extends Unit {
  constructor(coords, owner = null, scene = null) {
    super({ 
      type: 'Shieldbearer', 
      coords, 
      owner, 
      scene, 
      hp: 20, 
      movePts: 1, 
      actionPts: 1 
    });
    
    // Combat stats - defensive specialist
    this.attack = 3;
    this.defense = 6;
    this.range = 1;
  }

  // Override level up for defensive bonuses
  levelUp() {
    super.levelUp();
    this.defense += 1; // Extra defense on level up
  }
}

class Healer extends Unit {
  constructor(coords, owner = null, scene = null) {
    super({ 
      type: 'Healer', 
      coords, 
      owner, 
      scene, 
      hp: 12, 
      movePts: 1, 
      actionPts: 1 
    });
    
    // Healing stats
    this.healAmt = 4;
    this.healRange = 1;
    this.attack = 1; // Minimal combat ability
    this.defense = 2;
  }

  // Override level up for healing bonuses
  levelUp() {
    super.levelUp();
    this.healAmt += 1; // Better healing on level up
  }
}

// Export to global scope
window.FootSoldier = FootSoldier;
window.Shieldbearer = Shieldbearer;
window.Healer = Healer;