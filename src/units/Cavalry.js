// src/units/Cavalry.js

class Cavalry extends Unit {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Cavalry',
      owner: owner,
      coords: coords,
      scene: scene,
      hp: 25,
      movePts: 2,
      actionPts: 1
    });
    this.attack = 8;
    this.defense = 5;
  }
}
window.Cavalry = Cavalry;

class MountedArcher extends Unit {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'MountedArcher',
      owner: owner,
      coords: coords,
      scene: scene,
      hp: 20,
      movePts: 3,  // Faster than heavy cavalry
      actionPts: 1
    });
    this.attack = 6;
    this.defense = 3;
    this.range = 2;     // Ranged attack
  }
  
  createSprite() {
    // Call parent method first
    super.createSprite();
    
    // Add bow icon overlay
    if (this.scene && this.sprite) {
      const [x, y] = hexToPixel(this.coords[0], this.coords[1]);
      this.bowIcon = this.scene.add.text(x + 15, y - 15, '🏹', {
        fontSize: '12px'
      }).setDepth(4);
    }
  }
  
  setPosition(q, r) {
    // Call parent method first
    super.setPosition(q, r);
    
    // Move bow icon with unit
    if (this.bowIcon) {
      const [x, y] = hexToPixel(q, r);
      this.bowIcon.setPosition(x + 15, y - 15);
    }
  }
  
  destroy() {
    // Clean up bow icon first
    if (this.bowIcon) {
      this.bowIcon.destroy();
      this.bowIcon = null;
    }
    
    // Call parent destroy
    super.destroy();
  }
}
window.MountedArcher = MountedArcher;

// Legacy unit names for compatibility
class LightRider extends Cavalry {
  constructor(coords, owner = null, scene = null) {
    super(coords, owner, scene);
    this.type = 'LightRider';
  }
}
window.LightRider = LightRider;

class HeavyCavalry extends Cavalry {
  constructor(coords, owner = null, scene = null) {
    super(coords, owner, scene);
    this.type = 'HeavyCavalry';
  }
}
window.HeavyCavalry = HeavyCavalry;

// Legacy alias for AdminPanel compatibility
window.Archer = MountedArcher;  // Archer -> MountedArcher