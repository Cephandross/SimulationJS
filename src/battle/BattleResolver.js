/**
 * BattleResolver - Combat calculations and damage application
 * 
 * This class contains all the combat calculation logic for the battle system.
 * It handles damage calculations, terrain modifiers, unit type bonuses,
 * and provides utilities for battle predictions and targeting.
 * 
 * Key Features:
 * - Realistic combat calculations with terrain and unit type modifiers
 * - Battle outcome prediction for strategic planning
 * - Flexible targeting priority system
 * - Support for Area of Effect (AoE) attacks
 * - Status effect application framework
 * 
 * @class BattleResolver
 */
class BattleResolver {
  
  /**
   * Resolve combat between two units with full terrain and type modifiers
   * 
   * This is the core combat resolution method that calculates damage based on:
   * - Attacker's base attack stat
   * - Terrain modifiers (defensive bonuses/penalties)
   * - Unit type interactions (rock-paper-scissors style)
   * - Random variance (±20% for unpredictability)
   * - Defender's armor/defense stat
   * 
   * @param {Object} attacker - The attacking unit
   * @param {Object} defender - The defending unit  
   * @param {Object} terrain - Terrain tile object with type and properties
   * @returns {Object} Combat result with damage and outcome
   */
  static resolveCombat(attacker, defender, terrain = null) {
    // Validate inputs - combat can't proceed with dead units
    if (!attacker.isAlive() || !defender.isAlive()) {
      return { result: 'invalid', damage: 0 };
    }

    // Start with base damage from attacker's attack stat
    let baseDamage = Math.max(1, attacker.attack || 1);
    
    // Apply terrain modifiers (defensive bonuses, attack bonuses)
    const terrainMod = this.getTerrainModifier(attacker, defender, terrain);
    baseDamage *= terrainMod;
    
    // Apply unit type bonuses (cavalry vs infantry, etc.)
    const typeMod = this.getUnitTypeModifier(attacker, defender);
    baseDamage *= typeMod;
    
    // Add random variance (±20%) to prevent perfectly predictable combat
    const variance = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier
    baseDamage *= variance;
    
    // Apply defender's armor/defense to reduce incoming damage
    const defense = defender.defense || 0;
    let actualDamage = Math.max(1, Math.floor(baseDamage - defense)); // Minimum 1 damage
    
    // Apply damage to the defender
    defender.takeDamage(actualDamage);
    
    // Check if defender was killed by this attack
    if (!defender.isAlive()) {
      console.log(`💀 ${defender.type} was defeated by ${attacker.type}!`);
      return { result: 'victory', damage: actualDamage };
    }

    return { result: 'hit', damage: actualDamage };
  }

  /**
   * Calculate overall terrain modifier for combat
   * 
   * Combines both defensive bonuses for the defender and attack bonuses for the attacker
   * to create a single modifier that affects the combat outcome.
   * 
   * @param {Object} attacker - The attacking unit
   * @param {Object} defender - The defending unit
   * @param {Object} terrain - Terrain object with type property
   * @returns {number} Combined terrain modifier (usually 0.5 to 2.0)
   */
  static getTerrainModifier(attacker, defender, terrain) {
    if (!terrain) return 1.0;
    
    // Calculate separate bonuses for attacker and defender
    const defenderMod = this.getDefensiveTerrainBonus(defender, terrain);
    const attackerMod = this.getAttackTerrainBonus(attacker, terrain);
    
    // Combined modifier: attacker bonus divided by defender bonus
    return attackerMod / defenderMod;
  }

  /**
   * Get defensive bonus from terrain for the defending unit
   * 
   * Different terrain types provide different levels of defensive advantage.
   * Higher elevations and dense terrain generally provide better defense.
   * 
   * @param {Object} unit - The defending unit
   * @param {Object} terrain - Terrain object
   * @returns {number} Defensive multiplier (1.0 = no bonus, >1.0 = bonus, <1.0 = penalty)
   */
  static getDefensiveTerrainBonus(unit, terrain) {
    switch (terrain.type) {
      case 'forest': 
        return 1.2; // 20% defensive bonus - trees provide cover
      case 'mountain': 
        return 1.5; // 50% defensive bonus - high ground advantage
      case 'hill': 
        return 1.3; // 30% defensive bonus - elevated position
      case 'swamp': 
        return 1.1; // 10% defensive bonus - difficult to attack through
      case 'desert': 
        return 0.9; // 10% defensive penalty - no cover, harsh conditions
      case 'plains': 
        return 1.0; // No defensive modifier - open ground
      case 'water': 
        return 0.8; // 20% penalty - unless unit is naval/amphibious
      default: 
        return 1.0; // Unknown terrain defaults to no modifier
    }
  }

  /**
   * Get attack bonus from terrain for the attacking unit
   * 
   * Some units perform better in certain terrain types. For example,
   * cavalry excels on open plains, while naval units dominate on water.
   * 
   * @param {Object} unit - The attacking unit
   * @param {Object} terrain - Terrain object
   * @returns {number} Attack multiplier (1.0 = no bonus, >1.0 = bonus, <1.0 = penalty)
   */
  static getAttackTerrainBonus(unit, terrain) {
    switch (terrain.type) {
      case 'plains': 
        return 1.1; // Slight bonus on open ground - easier maneuvering
      case 'water': 
        // Naval units get bonus, land units get penalty
        return unit.type === 'ship' ? 1.2 : 0.5;
      default: 
        return 1.0; // Most terrain types don't affect attack
    }
  }

  /**
   * Get unit type combat modifiers (rock-paper-scissors system)
   * 
   * Different unit types have advantages and disadvantages against each other.
   * This creates strategic depth where unit composition matters in battle.
   * 
   * Current relationships:
   * - Cavalry > Infantry, Archers (mobility advantage)
   * - Infantry > Archers (close combat advantage) 
   * - Archers > Cavalry (ranged advantage)
   * - Siege units > Buildings (specialized equipment)
   * 
   * @param {Object} attacker - The attacking unit
   * @param {Object} defender - The defending unit
   * @returns {number} Type advantage modifier (usually 0.8 to 2.0)
   */
  static getUnitTypeModifier(attacker, defender) {
    // Define unit type advantage matrix
    const bonuses = {
      // Cavalry advantages
      cavalry: { 
        infantry: 1.3, // Cavalry charge advantage
        archer: 1.4    // Can close distance quickly
      },
      // Infantry advantages
      infantry: { 
        archer: 1.2,   // Close combat superiority
        cavalry: 0.8   // Vulnerable to cavalry charges
      },
      // Archer advantages
      archer: { 
        cavalry: 1.1,  // Can kite and harass
        infantry: 0.9  // Weak in melee
      },
      // Siege equipment
      catapult: { 
        building: 2.0  // Specialized for structure destruction
      },
      // Warrior class bonuses
      warrior: { 
        archer: 1.1    // Basic melee advantage
      },
      // Elite unit bonuses
      knight: { 
        infantry: 1.3, // Heavy armor and training
        warrior: 1.2   // Superior equipment
      }
      // Add more unit types as the game expands
    };

    const attackerType = attacker.type.toLowerCase();
    const defenderType = defender.type.toLowerCase();
    
    // Return bonus if it exists, otherwise 1.0 (no modifier)
    return bonuses[attackerType]?.[defenderType] || 1.0;
  }

  /**
   * Calculate battle prediction for UI display and AI planning
   * 
   * Analyzes two armies and predicts the likely outcome based on unit stats,
   * terrain, and type advantages. Used by the AdminPanel and potentially AI.
   * 
   * @param {Array} attackers - Array of attacking units
   * @param {Array} defenders - Array of defending units
   * @param {Object} terrain - Terrain where battle will take place
   * @returns {Object} Prediction data with win chances and strength calculations
   */
  static predictBattleOutcome(attackers, defenders, terrain = null) {
    let attackerStrength = 0;
    let defenderStrength = 0;
    
    // Calculate total effective strength for attacking side
    attackers.forEach(unit => {
      if (unit.isAlive()) {
        // Base strength is attack power * health percentage
        const baseStrength = (unit.attack || 1) * (unit.hp / unit.maxHp);
        
        // Apply terrain modifier (approximate using first defender as reference)
        const terrainMod = defenders.length > 0 ? 
          this.getTerrainModifier(unit, defenders[0], terrain) : 1.0;
        
        attackerStrength += baseStrength * terrainMod;
      }
    });
    
    // Calculate total effective strength for defending side
    defenders.forEach(unit => {
      if (unit.isAlive()) {
        // Base strength is attack power * health percentage
        const baseStrength = (unit.attack || 1) * (unit.hp / unit.maxHp);
        
        // Apply terrain modifier (approximate using first attacker as reference)
        const terrainMod = attackers.length > 0 ? 
          this.getTerrainModifier(unit, attackers[0], terrain) : 1.0;
        
        defenderStrength += baseStrength * terrainMod;
      }
    });
    
    // Calculate win probabilities based on relative strength
    const total = attackerStrength + defenderStrength;
    const attackerChance = total > 0 ? attackerStrength / total : 0.5;
    const defenderChance = 1 - attackerChance;
    
    return {
      attackerStrength,
      defenderStrength,
      attackerWinChance: attackerChance,
      defenderWinChance: defenderChance,
      estimatedRounds: Math.ceil(total / 10) // Rough estimate based on total strength
    };
  }

  /**
   * Process multiple units attacking in a single batch for efficiency
   * 
   * Used by BattleManager to process entire battle rounds efficiently.
   * Each attacker selects their best target and resolves combat.
   * 
   * @param {Array} attackers - Units performing attacks
   * @param {Array} defenders - Units being attacked
   * @param {Object} terrain - Terrain modifiers
   * @returns {Array} Array of combat result objects
   */
  static resolveBatchCombat(attackers, defenders, terrain = null) {
    const results = [];
    
    // Process each attacker individually
    attackers.forEach(attacker => {
      // Skip dead attackers
      if (!attacker.isAlive()) return;
      
      // Find best target using targeting priority system
      const target = this.selectBestTarget(attacker, defenders);
      if (!target) return; // No valid targets available
      
      // Resolve combat between this attacker and target
      const result = this.resolveCombat(attacker, target, terrain);
      
      // Store result for UI display and logging
      results.push({
        attacker: attacker,
        target: target,
        result: result
      });
    });
    
    return results;
  }

  /**
   * Select the best target for an attacker using game's targeting priority
   * 
   * Priority system (in order):
   * 1. Must be alive and attackable (range, line of sight, etc.)
   * 2. Prefer units with lower range (eliminate threats first)
   * 3. Prefer units with lower HP (easier to finish off)
   * 
   * This creates realistic combat behavior where units try to eliminate
   * threats efficiently rather than attacking randomly.
   * 
   * @param {Object} attacker - The unit selecting a target
   * @param {Array} enemies - Potential target units
   * @returns {Object|null} The selected target, or null if none available
   */
  static selectBestTarget(attacker, enemies) {
    // Filter to only targets the attacker can actually engage
    const validTargets = enemies.filter(enemy => 
      enemy.isAlive() && attacker.canAttack(enemy)
    );
    
    if (validTargets.length === 0) return null;
    
    // Sort by targeting priority
    return validTargets.sort((a, b) => {
      // Primary priority: eliminate ranged threats first (lower range = higher priority)
      if (a.range !== b.range) return a.range - b.range;
      
      // Secondary priority: finish off wounded units (lower HP = higher priority)
      return a.hp - b.hp;
    })[0];
  }

  /**
   * Calculate area of effect damage for siege weapons and spells
   * 
   * This method handles attacks that affect multiple units in an area,
   * such as catapult shots, fireballs, or other explosive attacks.
   * 
   * @param {Object} attacker - Unit performing AoE attack
   * @param {Array} centerHex - Center coordinates [q, r] of the attack
   * @param {number} radius - Radius of effect in hexes
   * @param {Array} allUnits - All units that could be affected
   * @param {Object} terrain - Terrain modifiers
   * @returns {Array} Array of damage results for each affected unit
   */
  static resolveAoECombat(attacker, centerHex, radius, allUnits, terrain = null) {
    const results = [];
    const [centerQ, centerR] = centerHex;
    
    // Find all units within the area of effect
    const targetsInRange = allUnits.filter(unit => {
      // Skip dead units and friendly fire (unless specifically enabled)
      if (!unit.isAlive() || unit.owner === attacker.owner) return false;
      
      // Calculate distance from center of attack
      const [unitQ, unitR] = unit.coords;
      const distance = attacker.hexDistance(centerQ, centerR, unitQ, unitR);
      return distance <= radius;
    });
    
    // Apply damage to all targets with distance-based falloff
    targetsInRange.forEach(target => {
      const [unitQ, unitR] = target.coords;
      const distance = attacker.hexDistance(centerQ, centerR, unitQ, unitR);
      
      // Calculate damage falloff: full damage at center, reduced at edges
      const damageMod = Math.max(0.3, 1 - (distance / radius) * 0.5);
      
      // Create temporary attacker with reduced damage for this target
      const tempAttacker = { ...attacker, attack: (attacker.attack || 1) * damageMod };
      const result = this.resolveCombat(tempAttacker, target, terrain);
      
      results.push({
        attacker: attacker,
        target: target,
        result: result,
        distance: distance,
        damageMod: damageMod
      });
    });
    
    return results;
  }

  /**
   * Apply status effects from combat (framework for future expansion)
   * 
   * This method provides a framework for applying ongoing effects from combat,
   * such as poison, burning, freezing, or other magical effects.
   * 
   * Currently supports:
   * - Fire mage: burning status (damage over time)
   * - Ice mage: slowed status (movement penalty)
   * 
   * @param {Object} attacker - Unit applying the effect
   * @param {Object} defender - Unit receiving the effect
   * @param {Object} result - Combat result from resolveCombat
   */
  static applyStatusEffects(attacker, defender, result) {
    // Only apply effects on successful hits
    if (result.result !== 'hit' && result.result !== 'victory') return;
    
    // Initialize status effects object if it doesn't exist
    if (!defender.statusEffects) {
      defender.statusEffects = {};
    }
    
    // Fire mage burning effect
    if (attacker.type === 'fire_mage') {
      defender.statusEffects.burning = { 
        duration: 3,    // Lasts 3 turns
        damage: 2       // Deals 2 damage per turn
      };
    }
    
    // Ice mage slowing effect
    if (attacker.type === 'ice_mage') {
      defender.statusEffects.slowed = { 
        duration: 2,         // Lasts 2 turns
        moveReduction: 0.5   // 50% movement speed reduction
      };
    }
    
    // Add more status effects as new unit types are introduced
    // Examples: poison, paralysis, fear, blessing, etc.
  }

  /**
   * Debug method: Log detailed combat calculation breakdown
   * 
   * Provides detailed information about a combat calculation for debugging
   * and balancing purposes. Useful during development and testing.
   * 
   * @param {Object} attacker - The attacking unit
   * @param {Object} defender - The defending unit
   * @param {Object} terrain - Terrain modifiers
   */
  static debugCombat(attacker, defender, terrain = null) {
    console.log(`=== COMBAT DEBUG: ${attacker.type} vs ${defender.type} ===`);
    
    // Unit stats
    console.log(`Attacker: ${attacker.attack} attack, ${attacker.hp}/${attacker.maxHp} HP`);
    console.log(`Defender: ${defender.defense || 0} defense, ${defender.hp}/${defender.maxHp} HP`);
    
    // Modifier calculations
    const terrainMod = this.getTerrainModifier(attacker, defender, terrain);
    const typeMod = this.getUnitTypeModifier(attacker, defender);
    
    console.log(`Terrain modifier: ${terrainMod.toFixed(2)}`);
    console.log(`Type modifier: ${typeMod.toFixed(2)}`);
    console.log(`Terrain: ${terrain?.type || 'none'}`);
    
    // Expected damage range
    const baseDamage = (attacker.attack || 1) * terrainMod * typeMod;
    const minDamage = Math.max(1, Math.floor(baseDamage * 0.8 - (defender.defense || 0)));
    const maxDamage = Math.max(1, Math.floor(baseDamage * 1.2 - (defender.defense || 0)));
    
    console.log(`Expected damage range: ${minDamage} - ${maxDamage}`);
    console.log('===');
  }
}

window.BattleResolver = BattleResolver;