// src/battle/BattleResolver.js
// Combat calculations and damage application

class BattleResolver {
  
  /**
   * Resolve combat between two units with terrain modifiers
   */
  static resolveCombat(attacker, defender, terrain = null) {
    if (!attacker.isAlive() || !defender.isAlive()) {
      return { result: 'invalid', damage: 0 };
    }

    // Base damage calculation
    let baseDamage = Math.max(1, attacker.attack || 1);
    
    // Apply terrain modifiers
    const terrainMod = this.getTerrainModifier(attacker, defender, terrain);
    baseDamage *= terrainMod;
    
    // Apply unit type bonuses (if any)
    const typeMod = this.getUnitTypeModifier(attacker, defender);
    baseDamage *= typeMod;
    
    // Apply random variance (±20%)
    const variance = 0.8 + Math.random() * 0.4;
    baseDamage *= variance;
    
    // Apply defender armor/defense
    const defense = defender.defense || 0;
    let actualDamage = Math.max(1, Math.floor(baseDamage - defense));
    
    // Apply damage
    defender.takeDamage(actualDamage);
    
    // Check if defender died
    if (!defender.isAlive()) {
      console.log(`💀 ${defender.type} was defeated by ${attacker.type}!`);
      return { result: 'victory', damage: actualDamage };
    }

    return { result: 'hit', damage: actualDamage };
  }

  /**
   * Get terrain modifier for combat
   */
  static getTerrainModifier(attacker, defender, terrain) {
    if (!terrain) return 1.0;
    
    const defenderMod = this.getDefensiveTerrainBonus(defender, terrain);
    const attackerMod = this.getAttackTerrainBonus(attacker, terrain);
    
    return attackerMod / defenderMod;
  }

  /**
   * Get defensive bonus from terrain
   */
  static getDefensiveTerrainBonus(unit, terrain) {
    switch (terrain.type) {
      case 'forest': return 1.2; // 20% defensive bonus
      case 'mountain': return 1.5; // 50% defensive bonus
      case 'hill': return 1.3; // 30% defensive bonus
      case 'swamp': return 1.1; // 10% defensive bonus
      case 'desert': return 0.9; // 10% defensive penalty
      case 'plains': return 1.0; // No bonus
      case 'water': return 0.8; // 20% penalty (unless unit can swim)
      default: return 1.0;
    }
  }

  /**
   * Get attack bonus from terrain
   */
  static getAttackTerrainBonus(unit, terrain) {
    // Some units might get attack bonuses in certain terrain
    // For now, most units are neutral
    switch (terrain.type) {
      case 'plains': return 1.1; // Slight bonus on open ground
      case 'water': 
        // Naval units would get bonus, others penalty
        return unit.type === 'ship' ? 1.2 : 0.5;
      default: return 1.0;
    }
  }

  /**
   * Get unit type combat modifiers
   */
  static getUnitTypeModifier(attacker, defender) {
    // Rock-paper-scissors style combat bonuses
    const bonuses = {
      // Cavalry vs Infantry
      cavalry: { infantry: 1.3, archer: 1.4 },
      // Infantry vs Archers
      infantry: { archer: 1.2, cavalry: 0.8 },
      // Archers vs Cavalry
      archer: { cavalry: 1.1, infantry: 0.9 },
      // Siege units vs Buildings (if we add building combat)
      catapult: { building: 2.0 },
      // Default interactions
      warrior: { archer: 1.1 },
      knight: { infantry: 1.3, warrior: 1.2 }
    };

    const attackerType = attacker.type.toLowerCase();
    const defenderType = defender.type.toLowerCase();
    
    return bonuses[attackerType]?.[defenderType] || 1.0;
  }

  /**
   * Calculate battle prediction for UI display
   */
  static predictBattleOutcome(attackers, defenders, terrain = null) {
    let attackerStrength = 0;
    let defenderStrength = 0;
    
    // Calculate total strength for each side
    attackers.forEach(unit => {
      if (unit.isAlive()) {
        const baseStrength = (unit.attack || 1) * (unit.hp / unit.maxHp);
        const terrainMod = this.getTerrainModifier(unit, defenders[0], terrain);
        attackerStrength += baseStrength * terrainMod;
      }
    });
    
    defenders.forEach(unit => {
      if (unit.isAlive()) {
        const baseStrength = (unit.attack || 1) * (unit.hp / unit.maxHp);
        const terrainMod = this.getTerrainModifier(unit, attackers[0], terrain);
        defenderStrength += baseStrength * terrainMod;
      }
    });
    
    // Calculate win probability
    const total = attackerStrength + defenderStrength;
    const attackerChance = total > 0 ? attackerStrength / total : 0.5;
    const defenderChance = 1 - attackerChance;
    
    return {
      attackerStrength,
      defenderStrength,
      attackerWinChance: attackerChance,
      defenderWinChance: defenderChance,
      estimatedRounds: Math.ceil(total / 10) // Rough estimate
    };
  }

  /**
   * Batch combat for processing multiple units efficiently
   */
  static resolveBatchCombat(attackers, defenders, terrain = null) {
    const results = [];
    
    // Process each attacker
    attackers.forEach(attacker => {
      if (!attacker.isAlive()) return;
      
      // Find best target using range priority
      const target = this.selectBestTarget(attacker, defenders);
      if (!target) return;
      
      // Resolve combat
      const result = this.resolveCombat(attacker, target, terrain);
      results.push({
        attacker: attacker,
        target: target,
        result: result
      });
    });
    
    return results;
  }

  /**
   * Select best target using game's targeting priority
   */
  static selectBestTarget(attacker, enemies) {
    const validTargets = enemies.filter(enemy => 
      enemy.isAlive() && attacker.canAttack(enemy)
    );
    
    if (validTargets.length === 0) return null;
    
    // Sort by range (lowest first), then by HP (lowest first)
    return validTargets.sort((a, b) => {
      if (a.range !== b.range) return a.range - b.range;
      return a.hp - b.hp;
    })[0];
  }

  /**
   * Calculate area of effect damage (for future siege weapons)
   */
  static resolveAoECombat(attacker, centerHex, radius, allUnits, terrain = null) {
    const results = [];
    const [centerQ, centerR] = centerHex;
    
    // Find all units in range
    const targetsInRange = allUnits.filter(unit => {
      if (!unit.isAlive() || unit.owner === attacker.owner) return false;
      
      const [unitQ, unitR] = unit.coords;
      const distance = attacker.hexDistance(centerQ, centerR, unitQ, unitR);
      return distance <= radius;
    });
    
    // Apply damage to all targets (reduced for AoE)
    targetsInRange.forEach(target => {
      const [unitQ, unitR] = target.coords;
      const distance = attacker.hexDistance(centerQ, centerR, unitQ, unitR);
      const damageMod = Math.max(0.3, 1 - (distance / radius) * 0.5); // Falloff
      
      const tempAttacker = { ...attacker, attack: (attacker.attack || 1) * damageMod };
      const result = this.resolveCombat(tempAttacker, target, terrain);
      
      results.push({
        attacker: attacker,
        target: target,
        result: result,
        distance: distance
      });
    });
    
    return results;
  }

  /**
   * Apply status effects from combat (poison, burn, etc.)
   */
  static applyStatusEffects(attacker, defender, result) {
    // Placeholder for future status effect system
    // Could add poison, burning, freezing, etc.
    
    if (attacker.type === 'fire_mage' && result.result === 'hit') {
      // Apply burning status
      defender.statusEffects = defender.statusEffects || {};
      defender.statusEffects.burning = { duration: 3, damage: 2 };
    }
    
    if (attacker.type === 'ice_mage' && result.result === 'hit') {
      // Apply slow status
      defender.statusEffects = defender.statusEffects || {};
      defender.statusEffects.slowed = { duration: 2, moveReduction: 0.5 };
    }
  }

  /**
   * Debug: Log detailed combat calculation
   */
  static debugCombat(attacker, defender, terrain = null) {
    console.log(`=== COMBAT DEBUG: ${attacker.type} vs ${defender.type} ===`);
    console.log(`Attacker: ${attacker.attack} attack, ${attacker.hp}/${attacker.maxHp} HP`);
    console.log(`Defender: ${defender.defense || 0} defense, ${defender.hp}/${defender.maxHp} HP`);
    
    const terrainMod = this.getTerrainModifier(attacker, defender, terrain);
    const typeMod = this.getUnitTypeModifier(attacker, defender);
    
    console.log(`Terrain modifier: ${terrainMod.toFixed(2)}`);
    console.log(`Type modifier: ${typeMod.toFixed(2)}`);
    console.log(`Terrain: ${terrain?.type || 'none'}`);
  }
}

window.BattleResolver = BattleResolver;