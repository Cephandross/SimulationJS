/**
 * BattleManager - Core battle system management and coordination
 * 
 * Manages all active battles in the game world, coordinates unit participation,
 * processes combat rounds, and interfaces with the UI system.
 * 
 * Key Responsibilities:
 * - Track all active battles by hex location
 * - Manage unit participation in battles (adding/removing units)
 * - Process combat rounds using BattleResolver
 * - Coordinate with BattleInterface for UI updates
 * - Handle battle lifecycle (start, tick, end)
 * 
 * @class BattleManager
 */
class BattleManager {
  /**
   * Create a new BattleManager instance
   * @param {Object} gameWorld - Reference to the main game world
   */
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
    this.scene = gameWorld.scene;
    
    // Map of active battles: key = "q,r" coordinate string, value = BattleData instance
    this.battles = new Map();
    
    // Map tracking which battle each unit is in: key = unit object, value = BattleData instance
    this.unitBattleMap = new Map();
  }

  /**
   * Start battle between attacking unit and all defending units at target hex
   * This is the main method for initiating stack-vs-stack battles
   * 
   * @param {Object} attacker - The attacking unit
   * @param {Array} targetHex - Target hex coordinates [q, r]
   * @returns {BattleData|null} The battle instance or null if no valid targets
   */
  startBattleAtHex(attacker, targetHex) {
    const [q, r] = targetHex;
    
    // Get all units at target hex
    const unitsAtHex = this.gameWorld.getUnitsAt(q, r);
    
    // Filter to enemy units only
    const defenders = unitsAtHex.filter(unit => 
      unit.owner !== attacker.owner && unit.isAlive()
    );
    
    if (defenders.length === 0) {
      console.log(`⚔️ No enemy units to fight at [${q}, ${r}]`);
      return null;
    }
    
    console.log(`⚔️ Starting battle: ${attacker.type} vs ${defenders.length} defenders at [${q}, ${r}]`);
    return this.startBattle(targetHex, [attacker], defenders);
  }

  /**
   * Start battle involving all units at a hex location
   * Useful for when stacks collide or reinforcements arrive
   * 
   * @param {Array} hex - Hex coordinates [q, r]
   * @returns {BattleData|null} The battle instance or null if no conflict
   */
  startBattleWithAllUnitsAt(hex) {
    const [q, r] = hex;
    const allUnits = this.gameWorld.getUnitsAt(q, r);
    
    if (allUnits.length < 2) {
      return null; // Need at least 2 units
    }
    
    // Group units by owner
    const unitsByOwner = new Map();
    allUnits.forEach(unit => {
      if (!unitsByOwner.has(unit.owner)) {
        unitsByOwner.set(unit.owner, []);
      }
      unitsByOwner.get(unit.owner).push(unit);
    });
    
    // Need at least 2 different owners to have a battle
    const owners = Array.from(unitsByOwner.keys());
    if (owners.length < 2) {
      return null; // All units belong to same owner
    }
    
    // First owner's units are attackers, others are defenders
    const attackers = unitsByOwner.get(owners[0]);
    const defenders = [];
    for (let i = 1; i < owners.length; i++) {
      defenders.push(...unitsByOwner.get(owners[i]));
    }
    
    console.log(`⚔️ Stack battle at [${q}, ${r}]: ${attackers.length} vs ${defenders.length}`);
    return this.startBattle(hex, attackers, defenders);
  }
   * 
   * This method handles both new battle creation and reinforcement of existing battles.
   * If a battle already exists at the specified hex, new units are added to appropriate sides.
   * 
   * @param {Array} hex - Hex coordinates [q, r] where battle takes place
   * @param {Array} attackers - Array of attacking unit objects
   * @param {Array} defenders - Array of defending unit objects
   * @returns {BattleData} The battle instance (new or existing)
   */
  startBattle(hex, attackers, defenders) {
    const [q, r] = hex;
    const battleKey = `${q},${r}`;
    
    // Check if battle already exists at this location
    let battle = this.battles.get(battleKey);
    
    if (battle) {
      // Battle exists - add new units as reinforcements
      attackers.forEach(unit => this.addUnitToBattle(unit, battle));
      return battle;
    }

    // Create new battle using BattleData class from BattleData.js
    battle = new BattleData(battleKey, hex, attackers, defenders, this.scene.tickCount);
    this.battles.set(battleKey, battle);
    
    // Track which units are participating in this battle
    [...attackers, ...defenders].forEach(unit => {
      this.unitBattleMap.set(unit, battle);
    });

    console.log(`⚔️ Battle started at [${q}, ${r}]: ${attackers.length} vs ${defenders.length}`);
    
    // Show battle interface if any units belong to human player
    this.showBattleInterface(battle);
    
    return battle;
  }

  /**
   * Add a unit to an existing battle, determining which side they join
   * 
   * Units are assigned to sides based on their owner's relationship with existing participants.
   * If the unit's owner already has units on a side, they join that side.
   * Otherwise, they default to the attacking side.
   * 
   * @param {Object} unit - The unit to add to the battle
   * @param {BattleData} battle - The battle to join
   */
  addUnitToBattle(unit, battle) {
    // Determine which side the unit should join based on their owner
    const isAttacker = battle.attackers.some(u => u.owner === unit.owner);
    const isDefender = battle.defenders.some(u => u.owner === unit.owner);
    
    if (isAttacker) {
      battle.attackers.push(unit);
    } else if (isDefender) {
      battle.defenders.push(unit);
    } else {
      // New faction - add to attackers by default (could be made configurable)
      battle.attackers.push(unit);
    }
    
    // Track this unit's participation
    this.unitBattleMap.set(unit, battle);
    console.log(`⚔️ ${unit.type} joined battle at [${battle.hex}]`);
  }

  /**
   * Get the active battle at specific hex coordinates
   * 
   * @param {Array} hex - Hex coordinates [q, r]
   * @returns {BattleData|undefined} Battle at the location, or undefined if none
   */
  getBattleAt(hex) {
    const [q, r] = hex;
    return this.battles.get(`${q},${r}`);
  }

  /**
   * Get the battle that a specific unit is participating in
   * 
   * @param {Object} unit - The unit to check
   * @returns {BattleData|null} The battle the unit is in, or null if not in battle
   */
  getUnitBattle(unit) {
    return this.unitBattleMap.get(unit) || null;
  }

  /**
   * Remove a unit from battle (typically for retreating)
   * 
   * This method safely removes a unit from both battle sides and the tracking map.
   * After removal, it checks if the battle should end due to one side having no units.
   * 
   * @param {Object} unit - The unit to remove from battle
   * @param {BattleData} battle - The battle to remove the unit from
   */
  retreatUnit(unit, battle) {
    // Remove unit from both attacking and defending sides (defensive programming)
    battle.attackers = battle.attackers.filter(u => u !== unit);
    battle.defenders = battle.defenders.filter(u => u !== unit);
    
    // Remove from battle tracking
    this.unitBattleMap.delete(unit);
    
    console.log(`🏃 ${unit.type} retreated from battle at [${battle.hex}]`);
    
    // Check if battle should end due to lack of participants
    this.checkBattleEnd(battle);
  }

  /**
   * Process all active battles each game tick
   * 
   * This is the main update loop for the battle system. It processes combat rounds
   * for all active battles and cleans up finished battles.
   * 
   * Called once per game tick from the main game loop.
   */
  tick() {
    const battlesToRemove = [];
    
    // Process each active battle
    for (const [key, battle] of this.battles) {
      // Process battle round (every tick for now, could be configured)
      if (this.scene.tickCount - battle.lastCombatTick >= 1) {
        this.processBattleRound(battle);
        battle.lastCombatTick = this.scene.tickCount;
      }
      
      // Check if battle has ended and mark for cleanup
      if (this.shouldBattleEnd(battle)) {
        this.endBattle(battle);
        battlesToRemove.push(key);
      }
    }
    
    // Clean up ended battles to prevent memory leaks
    battlesToRemove.forEach(key => this.battles.delete(key));
  }

  /**
   * Process one round of combat for a battle
   * 
   * Each round, all units from both sides attack simultaneously using the
   * BattleResolver to calculate damage and apply results.
   * 
   * @param {BattleData} battle - The battle to process
   */
  processBattleRound(battle) {
    const resolver = new BattleResolver();
    
    // Both sides attack simultaneously (not turn-based)
    const attackerResults = this.processAttacks(battle.attackers, battle.defenders, battle);
    const defenderResults = this.processAttacks(battle.defenders, battle.attackers, battle);
    
    // Update battle interface with combined results
    this.updateBattleInterface(battle, [...attackerResults, ...defenderResults]);
  }

  /**
   * Process attacks from one side against another
   * 
   * Each unit on the attacking side selects a target and attempts to attack.
   * Results are collected and returned for UI display.
   * 
   * @param {Array} attackers - Units performing attacks
   * @param {Array} defenders - Units being attacked
   * @param {BattleData} battle - The battle context
   * @returns {Array} Array of attack result objects
   */
  processAttacks(attackers, defenders, battle) {
    const results = [];
    
    attackers.forEach(attacker => {
      // Skip dead units
      if (!attacker.isAlive()) return;
      
      // Find target using priority system (closest, weakest, etc.)
      const target = this.selectTarget(attacker, defenders);
      if (!target) return; // No valid targets
      
      // Get terrain for combat modifiers
      const terrain = this.scene.map.getTile(...battle.hex);
      
      // Resolve combat using BattleResolver
      const result = BattleResolver.resolveCombat(attacker, target, terrain);
      
      // Store result for UI display
      results.push({
        attacker: attacker,
        target: target,
        result: result
      });
      
      // Award experience for participation
      attacker.gainExperience(1);
      
      console.log(`⚔️ ${attacker.type} attacks ${target.type} for ${result.damage} damage`);
    });
    
    return results;
  }

  /**
   * Select the best target for an attacker using priority system
   * 
   * Current priority:
   * 1. Units the attacker can actually attack (range, alive, etc.)
   * 2. Prefer units with lower range (eliminate threats first)
   * 3. Prefer units with lower HP (easier kills)
   * 
   * @param {Object} attacker - The attacking unit
   * @param {Array} enemies - Potential target units
   * @returns {Object|null} The selected target, or null if none available
   */
  selectTarget(attacker, enemies) {
    // Filter to only valid targets (alive, in range, etc.)
    const validTargets = enemies.filter(enemy => 
      enemy.isAlive() && attacker.canAttack(enemy)
    );
    
    if (validTargets.length === 0) return null;
    
    // Sort by priority: range (lowest first), then HP (lowest first)
    return validTargets.sort((a, b) => {
      // Primary sort: prefer lower range (eliminate ranged threats first)
      if (a.range !== b.range) return a.range - b.range;
      // Secondary sort: prefer lower HP (easier kills)
      return a.hp - b.hp;
    })[0];
  }

  /**
   * Check if a battle should end
   * 
   * A battle ends when one side has no living units remaining.
   * 
   * @param {BattleData} battle - The battle to check
   * @returns {boolean} True if battle should end
   */
  shouldBattleEnd(battle) {
    const aliveAttackers = battle.attackers.filter(u => u.isAlive()).length;
    const aliveDefenders = battle.defenders.filter(u => u.isAlive()).length;
    
    return aliveAttackers === 0 || aliveDefenders === 0;
  }

  /**
   * End a battle and perform cleanup
   * 
   * Determines the victor, logs the result, removes unit tracking,
   * and hides the battle interface.
   * 
   * @param {BattleData} battle - The battle to end
   */
  endBattle(battle) {
    const aliveAttackers = battle.attackers.filter(u => u.isAlive()).length;
    const aliveDefenders = battle.defenders.filter(u => u.isAlive()).length;
    
    // Determine victor
    let victor = null;
    if (aliveAttackers > 0 && aliveDefenders === 0) {
      victor = 'attackers';
    } else if (aliveDefenders > 0 && aliveAttackers === 0) {
      victor = 'defenders';
    }
    // If both sides have units, it's a draw (shouldn't happen with current logic)
    
    console.log(`🏆 Battle at [${battle.hex}] ended. Victor: ${victor || 'draw'}`);
    
    // Remove all units from battle tracking to free memory
    [...battle.attackers, ...battle.defenders].forEach(unit => {
      this.unitBattleMap.delete(unit);
    });
    
    // Hide battle interface
    this.hideBattleInterface(battle);
  }

  /**
   * Check if battle should end after unit retreat and clean up if so
   * 
   * @param {BattleData} battle - The battle to check
   */
  checkBattleEnd(battle) {
    if (this.shouldBattleEnd(battle)) {
      this.endBattle(battle);
      this.battles.delete(battle.id);
    }
  }

  /**
   * Show battle interface for players with units in the battle
   * 
   * The UI system determines which players should see the interface
   * based on their unit participation.
   * 
   * @param {BattleData} battle - The battle to display
   */
  showBattleInterface(battle) {
    if (this.scene.uiManager && this.scene.uiManager.battleInterface) {
      this.scene.uiManager.showBattleInterface(battle);
    }
  }

  /**
   * Update battle interface with latest combat results
   * 
   * @param {BattleData} battle - The battle being displayed
   * @param {Array} results - Combat results from this round
   */
  updateBattleInterface(battle, results) {
    if (this.scene.uiManager && this.scene.uiManager.battleInterface) {
      this.scene.uiManager.battleInterface.update(battle, results);
    }
  }

  /**
   * Hide the battle interface
   * 
   * @param {BattleData} battle - The battle whose interface to hide
   */
  hideBattleInterface(battle) {
    if (this.scene.uiManager && this.scene.uiManager.battleInterface) {
      this.scene.uiManager.hideBattleInterface();
    }
  }

  /**
   * Get all currently active battles
   * 
   * @returns {Array} Array of BattleData objects
   */
  getActiveBattles() {
    return Array.from(this.battles.values());
  }

  /**
   * Debug method: Print current battle manager state to console
   * 
   * Useful for AdminPanel debugging and development.
   */
  debugState() {
    console.log(`=== BATTLE MANAGER (${this.battles.size} active battles) ===`);
    for (const [key, battle] of this.battles) {
      const aliveAttackers = battle.attackers.filter(u => u.isAlive()).length;
      const aliveDefenders = battle.defenders.filter(u => u.isAlive()).length;
      console.log(`  Battle ${key}: ${aliveAttackers} vs ${aliveDefenders} (Started: tick ${battle.startTick})`);
    }
    console.log(`Total units in battles: ${this.unitBattleMap.size}`);
  }
}

// Note: BattleData class is defined in /src/battle/BattleData.js
// This file only exports BattleManager to avoid duplicate class definitions

window.BattleManager = BattleManager;