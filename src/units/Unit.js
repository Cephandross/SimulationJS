// src/units/Unit.js - Complete Unit with Battle System Integration

/**
 * Self-contained Unit base class with modular combat system and battle integration
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
    this.level = 1;
    
    // Movement/AI state
    this.destination = null;
    this.onArrive = null;
    this.mission = null;
    
    // NEW: Battle system state
    this.statusEffects = {};  // For poison, burning, etc.
    this.autoBattle = false;  // For AI auto-combat

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
      'Engineer': { key: 'rogues_sheet', frame: 39 },      // Builder
      
      // Common unit names used in testing
      'Warrior': { key: 'rogues_sheet', frame: 1 },        // Light Infantry
      'Archer': { key: 'rogues_sheet', frame: 2 },         // Light Archer
      'Scout': { key: 'rogues_sheet', frame: 3 },          // Assassin
      'Knight': { key: 'rogues_sheet', frame: 7 }          // Armored Infantry
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
    this.updateSpritePosition();
  }

  /**
   * Update sprite position to match coordinates
   */
  updateSpritePosition() {
    if (!this.sprite) return;
    
    const [x, y] = hexToPixel(this.coords[0], this.coords[1]);
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

  // =============================================================================
  // MOVEMENT SYSTEM (Updated with Battle Integration)
  // =============================================================================

  /**
   * Tell this unit to walk to a target tile
   */
  moveTo(targetCoords, onArrive = null) {
    // Check if unit is in battle
    if (this.isInBattle()) {
      console.warn(`⚔️ ${this.type} cannot move while in battle! Use retreat first.`);
      return false;
    }
    
    console.log(`${this.type} moving from [${this.coords[0]}, ${this.coords[1]}] to [${targetCoords[0]}, ${targetCoords[1]}]`);
    this.destination = { q: targetCoords[0], r: targetCoords[1] };
    this.onArrive = onArrive;
    return true;
  }

  /**
   * Set destination with battle state checking
   */
  setDestination(q, r) {
    // Check if unit is in battle
    if (this.isInBattle()) {
      console.warn(`⚔️ ${this.type} cannot move while in battle! Use retreat first.`);
      return false;
    }
    
    // Original movement logic
    this.destination = [q, r];
    this.calculatePath();
    return true;
  }

  /**
   * Calculate path to destination (placeholder for pathfinding)
   */
  calculatePath() {
    // Simple direct movement for now
    // Could be enhanced with proper pathfinding later
  }

  /**
   * Update movement (called each tick) - renamed from update() to avoid conflicts
   */
  processMovement() {
    if (!this.destination || this.isInBattle()) return;

    const [currentQ, currentR] = this.coords;
    const targetQ = Array.isArray(this.destination) ? this.destination[0] : this.destination.q;
    const targetR = Array.isArray(this.destination) ? this.destination[1] : this.destination.r;
    
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
  // BATTLE SYSTEM INTEGRATION
  // =============================================================================

  /**
   * Attack another unit - NOW TRIGGERS BATTLE SYSTEM
   */
  attackUnit(target) {
    if (!this.canAttack(target)) {
      console.warn(`❌ ${this.type} cannot attack ${target.type}`);
      return false;
    }

    // Check if battle manager exists
    if (!this.scene.gameWorld || !this.scene.gameWorld.battleManager) {
      console.warn('❌ Battle manager not initialized - falling back to instant combat');
      return this.instantCombat(target); // Fallback to old system
    }

    // Check if battle already exists at target location
    const battleHex = target.coords;
    const existingBattle = this.scene.gameWorld.battleManager.getBattleAt(battleHex);
    
    if (existingBattle) {
      // Join existing battle
      this.scene.gameWorld.battleManager.addUnitToBattle(this, existingBattle);
      console.log(`⚔️ ${this.type} joined existing battle at [${battleHex}]`);
    } else {
      // Start new battle
      this.scene.gameWorld.battleManager.startBattle(battleHex, [this], [target]);
      console.log(`⚔️ ${this.type} started battle with ${target.type} at [${battleHex}]`);
    }
    
    return true;
  }

  /**
   * Check if unit is currently in a battle
   */
  isInBattle() {
    if (!this.scene.gameWorld || !this.scene.gameWorld.battleManager) return false;
    return this.scene.gameWorld.battleManager.getUnitBattle(this) !== null;
  }

  /**
   * Get the battle this unit is participating in
   */
  getBattle() {
    if (!this.scene.gameWorld || !this.scene.gameWorld.battleManager) return null;
    return this.scene.gameWorld.battleManager.getUnitBattle(this);
  }

  /**
   * Get the hex where this unit's battle is taking place
   */
  getBattleHex() {
    const battle = this.getBattle();
    return battle ? battle.hex : null;
  }

  /**
   * Retreat from current battle
   */
  retreatFromBattle() {
    const battle = this.getBattle();
    if (battle) {
      this.scene.gameWorld.battleManager.retreatUnit(this, battle);
      console.log(`🏃 ${this.type} retreated from battle at [${battle.hex}]`);
      return true;
    }
    return false;
  }

  /**
   * Fallback instant combat for when battle system is not available
   */
  instantCombat(target) {
    // Get terrain for modifiers
    const terrain = this.scene.map.getTile(target.coords[0], target.coords[1]);
    
    // Use the existing CombatResolver
    const result = CombatResolver.resolveCombat(this, target, terrain);
    
    // Award experience
    this.gainExperience(1);
    
    return result;
  }

  // =============================================================================
  // ENHANCED COMBAT SYSTEM
  // =============================================================================

  /**
   * Check if this unit can attack the target (enhanced for battle system)
   */
  canAttack(target) {
    if (!target || !target.isAlive()) return false;
    if (target.owner === this.owner) return false; // No friendly fire
    if (this.attack <= 0) return false; // Non-combat unit
    if (this.isInBattle() && !this.getBattle().getAllUnits().includes(target)) {
      // Can only attack units in the same battle
      return false;
    }
    
    // Check range
    const [myQ, myR] = this.coords;
    const [targetQ, targetR] = target.coords;
    const distance = this.hexDistance(myQ, myR, targetQ, targetR);
    
    return distance <= this.range;
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
   * Get units that this unit can currently attack
   */
  getAttackableTargets() {
    const allUnits = this.scene.gameWorld.getAllUnits();
    return allUnits.filter(unit => this.canAttack(unit));
  }

  /**
   * Get strategic value of attacking a specific target
   */
  getAttackPriority(target) {
    if (!this.canAttack(target)) return 0;
    
    let priority = 0;
    
    // Prefer low-health targets (easier kills)
    priority += (target.maxHp - target.hp) * 2;
    
    // Prefer high-value targets
    if (target.type.includes('commander') || target.type.includes('hero')) {
      priority += 50;
    }
    
    // Prefer ranged units (eliminate threats)
    if (target.range > 1) {
      priority += 20;
    }
    
    // Distance penalty
    const distance = this.hexDistance(...this.coords, ...target.coords);
    priority -= distance * 5;
    
    return priority;
  }

  /**
   * Find the best target to attack based on tactical considerations
   */
  findBestTarget() {
    const targets = this.getAttackableTargets();
    if (targets.length === 0) return null;
    
    // Sort by attack priority
    targets.sort((a, b) => this.getAttackPriority(b) - this.getAttackPriority(a));
    
    return targets[0];
  }

  // =============================================================================
  // TICK SYSTEM (Enhanced for Battle Integration)
  // =============================================================================

  /**
   * Main tick method - handles all unit updates
   */
  tick() {
    // If unit is in battle, don't process normal AI
    if (this.isInBattle()) {
      // Units in battle are controlled by the battle manager
      // Just update sprite position if needed
      this.updateSpritePosition();
      return;
    }
    
    // Normal tick behavior when not in battle
    this.processMissions();
    this.processMovement();
    this.processAutoActions();
    this.processStatusEffects();
    this.updateSpritePosition();
  }

  /**
   * Process unit missions/AI
   */
  processMissions() {
    // Placeholder for mission system
    if (this.mission) {
      // Process current mission
    }
  }

  /**
   * Process automatic actions (like auto-battle)
   */
  processAutoActions() {
    if (this.autoBattle) {
      this.processAutoBattle();
    }
  }

  /**
   * Enhanced auto-battle AI that uses the battle system
   */
  processAutoBattle() {
    if (!this.autoBattle) return;
    if (this.isInBattle()) return; // Already in battle
    
    // Find nearest enemy within range
    const enemies = this.scene.gameWorld.getAllUnits().filter(unit => 
      unit.owner !== this.owner && 
      unit.isAlive() && 
      this.canAttack(unit)
    );
    
    if (enemies.length === 0) return;
    
    // Sort by distance and attack the closest
    const [myQ, myR] = this.coords;
    enemies.sort((a, b) => {
      const distA = this.hexDistance(myQ, myR, ...a.coords);
      const distB = this.hexDistance(myQ, myR, ...b.coords);
      return distA - distB;
    });
    
    const target = enemies[0];
    console.log(`🤖 ${this.type} auto-attacking ${target.type}`);
    this.attackUnit(target);
  }

  /**
   * Process status effects (burning, poison, etc.)
   */
  processStatusEffects() {
    if (!this.statusEffects) return;
    
    for (const [effect, data] of Object.entries(this.statusEffects)) {
      switch (effect) {
        case 'burning':
          this.takeDamage(data.damage);
          data.duration--;
          console.log(`🔥 ${this.type} burning for ${data.damage} damage (${data.duration} turns left)`);
          break;
          
        case 'poison':
          this.takeDamage(data.damage);
          data.duration--;
          console.log(`☠️ ${this.type} poisoned for ${data.damage} damage (${data.duration} turns left)`);
          break;
          
        case 'slowed':
          // Movement speed reduction is handled in movement logic
          data.duration--;
          break;
      }
      
      // Remove expired effects
      if (data.duration <= 0) {
        delete this.statusEffects[effect];
      }
    }
  }

  // =============================================================================
  // CORE UNIT MECHANICS (Preserved from Original)
  // =============================================================================

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
   * Remove this unit from the game (enhanced for battle cleanup)
   */
  destroy() {
    // If unit was in battle, remove from battle tracking
    if (this.isInBattle()) {
      const battle = this.getBattle();
      if (battle && this.scene.gameWorld && this.scene.gameWorld.battleManager) {
        this.scene.gameWorld.battleManager.retreatUnit(this, battle);
      }
    }
    
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
    if (this.owner && this.owner.units) {
      const index = this.owner.units.indexOf(this);
      if (index >= 0) {
        this.owner.units.splice(index, 1);
      }
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Check if unit can move (not in battle, not dead, etc.)
   */
  canMove() {
    return this.isAlive() && !this.isInBattle();
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
      level: this.level || 1,
      isInBattle: this.isInBattle(),
      battleHex: this.getBattleHex()
    };
  }
}

// =============================================================================
// MODULAR COMBAT RESOLVER (Preserved - used as fallback)
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