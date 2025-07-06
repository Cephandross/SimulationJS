// src/units/Unit.js - Refactored self-contained version

/**
 * Self-contained Unit class that manages its own sprite and position
 */
class Unit {
  /**
   * @param {object} opts
   * @param {string} opts.type
   * @param {Player} opts.owner
   * @param {[number,number]} opts.coords
   * @param {Phaser.Scene} opts.scene
   * @param {number} opts.hp
   * @param {number} opts.movePts
   * @param {number} opts.actionPts
   */
  constructor({ type, owner, coords, scene, hp = 10, movePts = 1, actionPts = 1 }) {
    this.type = type;
    this.owner = owner;
    this.coords = coords;     // [q, r] - single source of truth
    this.scene = scene;
    this.hp = hp;
    this.movePts = movePts;
    this.maxMovePts = movePts;
    this.actionPts = actionPts;
    this.maxActionPts = actionPts;
    
    // Movement/AI state
    this.destination = null;
    this.onArrive = null;
    this.mission = null;

    // Set sprite info and create sprite
    this.setSpriteInfo();
    this.createSprite();
  }

  setSpriteInfo() {
  // Use rogues sheet for units (7x7 grid, some frames empty)
  const unitSpriteMap = {
    // Military Units - Infantry
    'LightInfantry': { key: 'rogues_sheet', frame: 1 },
    'LightArcher': { key: 'rogues_sheet', frame: 2 },
    'Assassin': { key: 'rogues_sheet', frame: 3 },
    'Crossbowman': { key: 'rogues_sheet', frame: 4 },
    'ArmoredInfantry': { key: 'rogues_sheet', frame: 7 },
    'HeavyInfantry': { key: 'rogues_sheet', frame: 11 },
    'Halberd': { key: 'rogues_sheet', frame: 21 },
    'Mace': { key: 'rogues_sheet', frame: 22 },
    'Duelist': { key: 'rogues_sheet', frame: 25 },
    'Berserker': { key: 'rogues_sheet', frame: 26 },
    'Militia': { key: 'rogues_sheet', frame: 35 },
    
    // Military Units - Magic
    'Cleric': { key: 'rogues_sheet', frame: 15 },
    'Monk': { key: 'rogues_sheet', frame: 16 },
    'Sorcerer': { key: 'rogues_sheet', frame: 19 },
    'Apprentice': { key: 'rogues_sheet', frame: 32 },
    'Archmage': { key: 'rogues_sheet', frame: 29 },
    'Spellblade': { key: 'rogues_sheet', frame: 33 },
    
    // Military Units - Elite
    'Maul': { key: 'rogues_sheet', frame: 17 },
    'Broadsword': { key: 'rogues_sheet', frame: 18 },
    
    // Cavalry Units
    'Cavalry': { key: 'Cavalry', frame: 0 },
    'MountedArcher': { key: 'Cavalry', frame: 0 },
    
    // Civilian Units
    'Worker': { key: 'rogues_sheet', frame: 36 },
    'Builder': { key: 'rogues_sheet', frame: 39 },
    'Farmer': { key: 'rogues_sheet', frame: 37 },
    'Scholar': { key: 'rogues_sheet', frame: 40 },
    'Trader': { key: 'rogues_sheet', frame: 42 },
    'Peasant': { key: 'rogues_sheet', frame: 44 },
    
    // Legacy unit names (for compatibility)
    'FootSoldier': { key: 'rogues_sheet', frame: 1 },    // Light Infantry
    'Shieldbearer': { key: 'rogues_sheet', frame: 7 },   // Armored Infantry
    'Healer': { key: 'rogues_sheet', frame: 15 },        // Cleric
    'LightRider': { key: 'Cavalry', frame: 0 },          // Cavalry
    'HeavyCavalry': { key: 'Cavalry', frame: 0 },        // Cavalry
    'Engineer': { key: 'rogues_sheet', frame: 39 }       // Builder
  };

  const spriteInfo = unitSpriteMap[this.type];
  if (spriteInfo) {
    this.spriteKey = spriteInfo.key;
    this.spriteFrame = spriteInfo.frame;
  } else {
    // Fallback to a basic character
    console.warn(`No sprite mapping for unit type: ${this.type}`);
    this.spriteKey = 'rogues_sheet';
    this.spriteFrame = 36; // Default to Worker
  }
}

  createSprite() {
  const [x, y] = hexToPixel(this.coords[0], this.coords[1]);
  
  try {
    this.sprite = this.scene.add.sprite(x, y, this.spriteKey, this.spriteFrame)
      .setOrigin(0.5, 0.5)
      .setDepth(3);

    // Add team indicator instead (reuse x,y variables)
    this.teamIndicator = this.scene.add.circle(x + 15, y - 15, 4, this.owner.color)
      .setDepth(4);
      
    console.log(`✅ Created ${this.type} sprite at [${this.coords[0]}, ${this.coords[1]}]`);
  } catch (error) {
    console.warn(`Failed to create ${this.type} sprite:`, error);
    // Fallback to colored circle
    this.sprite = this.scene.add.circle(x, y, 15, this.owner.color)
      .setDepth(3);
  }
}

  /**
   * Move to new hex coordinates (single source of truth)
   */
  setPosition(q, r) {
  this.coords = [q, r];
  const [x, y] = hexToPixel(q, r);
  this.sprite.setPosition(x, y);
  
  // Move team indicator with unit
  if (this.teamIndicator) {
    this.teamIndicator.setPosition(x + 15, y - 15);
  }
}

  /**
   * Check if this unit can move to target coordinates
   */
  canMoveTo(q, r) {
    const tile = this.scene.map.getTile(q, r);
    if (!tile || !tile.isPassable()) return false;
    
    // Check for other units at this position
    const otherUnit = this.owner.gameWorld.getUnitAt(q, r);
    return !otherUnit || otherUnit === this;
  }

  /**
   * Tell this unit to walk to a target tile
   */
  moveTo(targetCoords, onArrive = null) {
    console.log(`${this.type} moving from [${this.coords[0]}, ${this.coords[1]}] to [${targetCoords[0]}, ${targetCoords[1]}]`);
    this.destination = { q: targetCoords[0], r: targetCoords[1] };
    this.onArrive = onArrive;
  }

  /**
   * Update movement (called each tick)
   */
  update() {
    if (!this.destination) return;

    const [currentQ, currentR] = this.coords;
    const { q: targetQ, r: targetR } = this.destination;
    
    // Check if arrived
    if (currentQ === targetQ && currentR === targetR) {
      this.destination = null;
      if (this.onArrive) {
        this.onArrive();
        this.onArrive = null;
      }
      return;
    }

    // Calculate next step
    const dq = targetQ - currentQ;
    const dr = targetR - currentR;
    
    // Build ordered list of candidate steps (prefer direct path)
    const candidates = [];
    if (Math.abs(dq) >= Math.abs(dr)) {
      candidates.push([Math.sign(dq), 0]);
      candidates.push([0, Math.sign(dr)]);
    } else {
      candidates.push([0, Math.sign(dr)]);
      candidates.push([Math.sign(dq), 0]);
    }
    
    // Add all hex directions as fallbacks
    candidates.push([1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]);

    // Try each candidate until one works
    for (const [mq, mr] of candidates) {
      const newQ = currentQ + mq;
      const newR = currentR + mr;
      
      if (this.canMoveTo(newQ, newR)) {
        this.setPosition(newQ, newR);
        break;
      }
    }
  }

  /**
   * Remove this unit from the game
   */
  destroy() {
  if (this.sprite) {
    this.sprite.destroy();
    this.sprite = null;
  }
  
  // Clean up team indicator 
  if (this.teamIndicator) {
    this.teamIndicator.destroy();
    this.teamIndicator = null;
  }
  
  // Remove from owner's unit list
  const index = this.owner.units.indexOf(this);
  if (index >= 0) {
    this.owner.units.splice(index, 1);
  }
}

  // Game mechanics
  isAlive() {
    return this.hp > 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (!this.isAlive()) {
      this.destroy();
    }
  }

  resetPoints() {
    this.movePts = this.maxMovePts;
    this.actionPts = this.maxActionPts;
  }
}

window.Unit = Unit;