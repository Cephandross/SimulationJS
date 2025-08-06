// src/battle/BattleManager.js
// Core battle logic and state management

class BattleManager {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
    this.scene = gameWorld.scene;
    this.battles = new Map(); // key: "q,r", value: Battle object
    this.unitBattleMap = new Map(); // key: unit, value: battle
  }

  /**
   * Start a new battle or join existing one at hex location
   */
  startBattle(hex, attackers, defenders) {
    const [q, r] = hex;
    const battleKey = `${q},${r}`;
    
    // Check if battle already exists
    let battle = this.battles.get(battleKey);
    
    if (battle) {
      // Add units to existing battle
      attackers.forEach(unit => this.addUnitToBattle(unit, battle));
      return battle;
    }

    // Create new battle
    battle = new BattleData(battleKey, hex, attackers, defenders, this.scene.tickCount);
    this.battles.set(battleKey, battle);
    
    // Track which units are in this battle
    [...attackers, ...defenders].forEach(unit => {
      this.unitBattleMap.set(unit, battle);
    });

    console.log(`⚔️ Battle started at [${q}, ${r}]: ${attackers.length} vs ${defenders.length}`);
    
    // Show battle interface if any units belong to human player
    this.showBattleInterface(battle);
    
    return battle;
  }

  /**
   * Add a unit to an existing battle
   */
  addUnitToBattle(unit, battle) {
    // Determine which side the unit joins
    const isAttacker = battle.attackers.some(u => u.owner === unit.owner);
    const isDefender = battle.defenders.some(u => u.owner === unit.owner);
    
    if (isAttacker) {
      battle.attackers.push(unit);
    } else if (isDefender) {
      battle.defenders.push(unit);
    } else {
      // New faction - add to attackers by default
      battle.attackers.push(unit);
    }
    
    this.unitBattleMap.set(unit, battle);
    console.log(`⚔️ ${unit.type} joined battle at [${battle.hex}]`);
  }

  /**
   * Get battle at specific hex coordinates
   */
  getBattleAt(hex) {
    const [q, r] = hex;
    return this.battles.get(`${q},${r}`);
  }

  /**
   * Get battle that a unit is participating in
   */
  getUnitBattle(unit) {
    return this.unitBattleMap.get(unit) || null;
  }

  /**
   * Remove a unit from battle (retreat)
   */
  retreatUnit(unit, battle) {
    // Remove from battle sides
    battle.attackers = battle.attackers.filter(u => u !== unit);
    battle.defenders = battle.defenders.filter(u => u !== unit);
    
    // Remove from tracking
    this.unitBattleMap.delete(unit);
    
    console.log(`🏃 ${unit.type} retreated from battle at [${battle.hex}]`);
    
    // Check if battle should end
    this.checkBattleEnd(battle);
  }

  /**
   * Process all active battles each tick
   */
  tick() {
    const battlesToRemove = [];
    
    for (const [key, battle] of this.battles) {
      // Process battle round
      if (this.scene.tickCount - battle.lastCombatTick >= 1) {
        this.processBattleRound(battle);
        battle.lastCombatTick = this.scene.tickCount;
      }
      
      // Check if battle should end
      if (this.shouldBattleEnd(battle)) {
        this.endBattle(battle);
        battlesToRemove.push(key);
      }
    }
    
    // Clean up ended battles
    battlesToRemove.forEach(key => this.battles.delete(key));
  }

  /**
   * Process one round of combat for a battle
   */
  processBattleRound(battle) {
    const resolver = new BattleResolver();
    
    // Each side attacks simultaneously
    const attackerResults = this.processAttacks(battle.attackers, battle.defenders, battle);
    const defenderResults = this.processAttacks(battle.defenders, battle.attackers, battle);
    
    // Update battle interface
    this.updateBattleInterface(battle, [...attackerResults, ...defenderResults]);
  }

  /**
   * Process attacks from one side to another
   */
  processAttacks(attackers, defenders, battle) {
    const results = [];
    
    attackers.forEach(attacker => {
      if (!attacker.isAlive()) return;
      
      // Find target using range priority (lowest range first)
      const target = this.selectTarget(attacker, defenders);
      if (!target) return;
      
      // Calculate damage
      const terrain = this.scene.map.getTile(...battle.hex);
      const result = BattleResolver.resolveCombat(attacker, target, terrain);
      
      results.push({
        attacker: attacker,
        target: target,
        result: result
      });
      
      // Award experience
      attacker.gainExperience(1);
      
      console.log(`⚔️ ${attacker.type} attacks ${target.type} for ${result.damage} damage`);
    });
    
    return results;
  }

  /**
   * Select target using range priority system
   */
  selectTarget(attacker, enemies) {
    const validTargets = enemies.filter(enemy => 
      enemy.isAlive() && attacker.canAttack(enemy)
    );
    
    if (validTargets.length === 0) return null;
    
    // Sort by range (lowest first), then by HP (lowest first for easier kills)
    return validTargets.sort((a, b) => {
      if (a.range !== b.range) return a.range - b.range;
      return a.hp - b.hp;
    })[0];
  }

  /**
   * Check if battle should end
   */
  shouldBattleEnd(battle) {
    const aliveAttackers = battle.attackers.filter(u => u.isAlive()).length;
    const aliveDefenders = battle.defenders.filter(u => u.isAlive()).length;
    
    return aliveAttackers === 0 || aliveDefenders === 0;
  }

  /**
   * End a battle and clean up
   */
  endBattle(battle) {
    const aliveAttackers = battle.attackers.filter(u => u.isAlive()).length;
    const aliveDefenders = battle.defenders.filter(u => u.isAlive()).length;
    
    let victor = null;
    if (aliveAttackers > 0 && aliveDefenders === 0) {
      victor = 'attackers';
    } else if (aliveDefenders > 0 && aliveAttackers === 0) {
      victor = 'defenders';
    }
    
    console.log(`🏆 Battle at [${battle.hex}] ended. Victor: ${victor || 'draw'}`);
    
    // Remove all units from battle tracking
    [...battle.attackers, ...battle.defenders].forEach(unit => {
      this.unitBattleMap.delete(unit);
    });
    
    // Hide battle interface
    this.hideBattleInterface(battle);
  }

  /**
   * Check if battle should end after unit retreat
   */
  checkBattleEnd(battle) {
    if (this.shouldBattleEnd(battle)) {
      this.endBattle(battle);
      this.battles.delete(battle.id);
    }
  }

  /**
   * Show battle interface for players with units in battle
   */
  showBattleInterface(battle) {
    if (this.scene.uiManager && this.scene.uiManager.battleInterface) {
      this.scene.uiManager.showBattleInterface(battle);
    }
  }

  /**
   * Update battle interface with latest results
   */
  updateBattleInterface(battle, results) {
    if (this.scene.uiManager && this.scene.uiManager.battleInterface) {
      this.scene.uiManager.battleInterface.update(battle, results);
    }
  }

  /**
   * Hide battle interface
   */
  hideBattleInterface(battle) {
    if (this.scene.uiManager && this.scene.uiManager.battleInterface) {
      this.scene.uiManager.hideBattleInterface();
    }
  }

  /**
   * Get all active battles
   */
  getActiveBattles() {
    return Array.from(this.battles.values());
  }

  /**
   * Debug: Print current battle state
   */
  debugState() {
    console.log(`=== BATTLE MANAGER (${this.battles.size} active battles) ===`);
    for (const [key, battle] of this.battles) {
      const aliveAttackers = battle.attackers.filter(u => u.isAlive()).length;
      const aliveDefenders = battle.defenders.filter(u => u.isAlive()).length;
      console.log(`  Battle ${key}: ${aliveAttackers} vs ${aliveDefenders} (Tick ${battle.startTick})`);
    }
  }
}

// Battle data structure
class BattleData {
  constructor(id, hex, attackers, defenders, startTick) {
    this.id = id;
    this.hex = hex; // [q, r]
    this.attackers = [...attackers];
    this.defenders = [...defenders];
    this.startTick = startTick;
    this.lastCombatTick = startTick;
    this.spectators = new Set();
  }

  getAllUnits() {
    return [...this.attackers, ...this.defenders];
  }

  getAliveUnits() {
    return this.getAllUnits().filter(unit => unit.isAlive());
  }
}

window.BattleManager = BattleManager;
window.BattleData = BattleData;