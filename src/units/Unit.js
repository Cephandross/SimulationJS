// src/units/Unit.js - Modular Base Class with Combat System

/**
 * Self-contained Unit base class with modular combat system
 */
class Unit {
  constructor({ type, owner, coords, scene, hp = 10, movePts = 1, actionPts = 1 }) {
    this.type = type;
    this.owner = owner;
    this.coords = coords;     // [q, r] - single source of truth
    this.scene = scene;
    this.hp = hp;
    this.maxHp = hp;          // Store original HP for healing
    this.movePts = movePts;
    this.maxMovePts = movePts;
    this.actionPts = actionPts;
    this.maxActionPts = actionPts;
    
    // Combat stats (can be overridden by subclasses)
    this.attack = 0;
    this.defense = 0;
    this.range = 1;
    this.experience = 0;
    
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

  // =============================================================================
  // MODULAR COMBAT SYSTEM
  // =============================================================================

  /**
   * Check if this unit can attack the target
   */
  canAttack(target) {
    if (!target || !target.isAlive()) return false;
    if (target.owner === this.owner) return false; // No friendly fire
    if (this.attack <= 0) return false; // Non-combat unit
    
    // Check range
    const [myQ, myR] = this.coords;
    const [targetQ, targetR] = target.coords;
    const distance = this.hexDistance(myQ, myR, targetQ, targetR);
    
    return distance <= this.range;
  }

  /**
   * Attack another unit
   */
  attackUnit(target) {
    if (!this.canAttack(target)) {
      console.warn(`❌ ${this.type} cannot attack ${target.type}`);
      return false;
    }

    // Get terrain for modifiers
    const terrain = this.scene.map.getTile(target.coords[0], target.coords[1]);
    
    // Calculate damage with terrain modifiers
    const result = CombatResolver.resolveCombat(this, target, terrain);
    
    // Award experience
    this.gainExperience(1);
    
    return result;
  }

  /**
   * Check if this unit can heal the target
   */
  canHeal(target) {
    if (!target || !target.isAlive()) return false;
    if (target.owner !== this.owner) return false; // Only heal allies
    if (!this.healAmt || this.healAmt <= 0) return false; // Not a healer
    if (target.hp >= target.maxHp) return false; // Already at full health
    
    // Check range
    const [myQ, myR] = this.coords;
    const [targetQ, targetR] = target.coords;
    const distance = this.hexDistance(myQ, myR, targetQ, targetR);
    
    return distance <= (this.healRange || 1);
  }

  /**
   * Heal another unit
   */
  healUnit(target) {
    if (!this.canHeal(target)) {
      console.warn(`❌ ${this.type} cannot heal ${target.type}`);
      return false;
    }

    const healAmount = this.healAmt;
    const oldHp = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + healAmount);
    const actualHeal = target.hp - oldHp;
    
    if (actualHeal > 0) {
      console.log(`💚 ${this.type} heals ${target.type} for ${actualHeal} HP`);
      this.gainExperience(1);
      return { healed: actualHeal };
    }
    
    return false;
  }

  /**
   * Calculate hex distance between two points
   */
  hexDistance(q1, r1, q2, r2) {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  }

  /**
   * Gain experience and potentially level up
   */
  gainExperience(amount) {
    this.experience = (this.experience || 0) + amount;
    
    // Simple leveling system
    const newLevel = Math.floor(this.experience / 10) + 1;
    const oldLevel = this.level || 1;
    
    if (newLevel > oldLevel) {
      this.level = newLevel;
      this.levelUp();
    }
  }

  /**
   * Level up bonuses (can be overridden by subclasses)
   */
  levelUp() {
    // Base level up: +1 HP, +0.1 attack/defense
    this.maxHp += 1;
    this.hp = Math.min(this.hp + 1, this.maxHp); // Heal 1 HP on level up
    this.attack = Math.floor((this.attack || 0) * 1.1 + 0.5);
    this.defense = Math.floor((this.defense || 0) * 1.1 + 0.5);
    
    console.log(`🆙 ${this.type} leveled up to ${this.level}! Stats increased.`);
  }

  /**
   * Take damage from combat or other sources
   */
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    
    // Visual feedback for damage
    if (this.sprite && amount > 0) {
      // Flash red briefly
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(200, () => {
        if (this.sprite) this.sprite.clearTint();
      });
    }
    
    if (!this.isAlive()) {
      this.destroy();
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

  resetPoints() {
    this.movePts = this.maxMovePts;
    this.actionPts = this.maxActionPts;
  }

  // Get combat summary for UI
  getCombatStats() {
    return {
      attack: this.attack || 0,
      defense: this.defense || 0,
      range: this.range || 1,
      hp: this.hp,
      maxHp: this.maxHp,
      experience: this.experience || 0,
      level: this.level || 1
    };
  }
}

// =============================================================================
// MODULAR COMBAT RESOLVER (SEPARATE CLASS)
// =============================================================================

class CombatResolver {
  static resolveCombat(attacker, defender, terrain = null) {
    // Terrain modifiers
    let attackMod = 1.0;
    let defenseMod = 1.0;

    if (terrain) {
      // Forest gives defense bonus
      if (['forest', 'pine_forest', 'dark_forest'].includes(terrain.biome)) {
        defenseMod = 1.2;
      }
      // Hills give attack bonus
      if (['hills', 'mountain'].includes(terrain.biome)) {
        attackMod = 1.1;
      }
      // River penalties
      if (terrain.biome === 'river') {
        attackMod = 0.9;
        defenseMod = 0.9;
      }
    }

    const baseDamage = Math.floor((attacker.attack || 1) * attackMod);
    const defense = Math.floor((defender.defense || 0) * defenseMod);
    const actualDamage = Math.max(1, baseDamage - defense);

    console.log(`⚔️ Combat: ${attacker.type} (${baseDamage} atk) vs ${defender.type} (${defense} def) = ${actualDamage} dmg`);
    
    defender.takeDamage(actualDamage);

    // Check if defender died
    if (!defender.isAlive()) {
      console.log(`💀 ${defender.type} was defeated by ${attacker.type}!`);
      return { result: 'victory', damage: actualDamage };
    }

    return { result: 'hit', damage: actualDamage };
  }

  // Batch combat for large battles
  static resolveBatchCombat(attackers, defenders, terrain = null) {
    const results = [];
    
    attackers.forEach(attacker => {
      if (!attacker.isAlive()) return;
      
      // Find closest defender
      const target = this.findClosestTarget(attacker, defenders);
      if (target && attacker.canAttack(target)) {
        const result = this.resolveCombat(attacker, target, terrain);
        results.push({ attacker, target, result });
      }
    });
    
    return results;
  }

  static findClosestTarget(unit, targets) {
    let closest = null;
    let closestDistance = Infinity;
    
    targets.forEach(target => {
      if (!target.isAlive()) return;
      if (target.owner === unit.owner) return;
      
      const distance = unit.hexDistance(...unit.coords, ...target.coords);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = target;
      }
    });
    
    return closest;
  }
}

window.Unit = Unit;
window.CombatResolver = CombatResolver;