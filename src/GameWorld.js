// src/GameWorld.js - Central game coordinator

/**
 * Central coordinator that manages all game entities and provides
 * spatial queries without tile state tracking
 */
class GameWorld {
  constructor(scene) {
    this.scene = scene;
    this.players = [];
    this.tickCount = 0;
    this.battleManager = null;
    this.aiManager = null;
    
    // Check if battle system is available
    try {
      if (typeof BattleManager !== 'undefined') {
        this.battleManager = new BattleManager(this);
        console.log('🗡️ Battle system initialized in GameWorld');
      }
    } catch (error) {
      console.warn('⚠️ Battle system not available:', error);
    }
    
    // Initialize AI Manager
    try {
      if (typeof AIManager !== 'undefined') {
        this.aiManager = new AIManager(this);
        console.log('🧠 AI Manager initialized in GameWorld');
      }
    } catch (error) {
      console.warn('⚠️ AI Manager not available:', error);
    }
  }

  addPlayer(player) {
    player.gameWorld = this; // Ensure back-reference
    this.players.push(player);
    
    // Add AI system for non-human players
    if (this.aiManager && player.name.startsWith('CPU')) {
      // Default AI types for CPU players
      const aiTypes = ['balanced', 'economic', 'aggressive', 'peaceful', 'expansionist'];
      const defaultType = aiTypes[this.players.length % aiTypes.length];
      this.aiManager.addAISystem(player, defaultType);
    }
  }

  /**
   * Get all units across all players
   */
  getAllUnits() {
    return this.players.flatMap(player => player.units);
  }

  /**
   * Get all buildings across all players
   */
  getAllBuildings() {
    return this.players.flatMap(player => player.buildings);
  }

  /**
   * Get all units at specific coordinates (supports stacking)
   */
  getUnitsAt(q, r) {
    return this.getAllUnits().filter(unit => 
      unit.coords[0] === q && unit.coords[1] === r
    );
  }

  /**
   * Find unit at specific coordinates (legacy compatibility - returns first unit)
   * @deprecated Use getUnitsAt() for stacking support
   */
  getUnitAt(q, r) {
    const units = this.getUnitsAt(q, r);
    return units.length > 0 ? units[0] : null;
  }

  /**
   * Get the number of units stacked at specific coordinates
   */
  getStackSize(q, r) {
    return this.getUnitsAt(q, r).length;
  }

  /**
   * Check if more units can be added to a hex (stack limit check)
   */
  canAddToStack(q, r) {
    const maxStackSize = typeof MAX_STACK_SIZE !== 'undefined' ? MAX_STACK_SIZE : 5;
    return this.getStackSize(q, r) < maxStackSize;
  }

  /**
   * Add unit to stack at coordinates (with validation)
   */
  addUnitToStack(unit, q, r) {
    if (!this.canAddToStack(q, r)) {
      console.warn(`❌ Cannot add ${unit.type} to stack at [${q}, ${r}] - stack limit reached`);
      return false;
    }
    
    // Update unit coordinates
    unit.setPosition(q, r);
    console.log(`📦 ${unit.type} added to stack at [${q}, ${r}] (${this.getStackSize(q, r)} units)`);
    return true;
  }

  /**
   * Get stack composition summary for UI display
   */
  getStackInfo(q, r) {
    const units = this.getUnitsAt(q, r);
    if (units.length === 0) return null;

    // Group by type and owner for compact display
    const composition = {};
    units.forEach(unit => {
      const key = `${unit.type}_${unit.owner.name}`;
      if (!composition[key]) {
        composition[key] = { type: unit.type, owner: unit.owner, count: 0 };
      }
      composition[key].count++;
    });

    return {
      totalUnits: units.length,
      composition: Object.values(composition),
      canAddMore: this.canAddToStack(q, r),
      topUnit: units[units.length - 1] // Most recently added unit (top of stack)
    };
  }

  /**
   * Find building at specific coordinates
   */
  getBuildingAt(q, r) {
    return this.getAllBuildings().find(building => 
      building.coords[0] === q && building.coords[1] === r
    );
  }

  /**
   * Get all units within range of a position
   */
  getUnitsInRange(centerQ, centerR, range) {
    return this.getAllUnits().filter(unit => {
      const [unitQ, unitR] = unit.coords;
      const distance = this.hexDistance(centerQ, centerR, unitQ, unitR);
      return distance <= range;
    });
  }

  /**
   * Get all buildings within range of a position
   */
  getBuildingsInRange(centerQ, centerR, range) {
    return this.getAllBuildings().filter(building => {
      const [buildingQ, buildingR] = building.coords;
      const distance = this.hexDistance(centerQ, centerR, buildingQ, buildingR);
      return distance <= range;
    });
  }

  /**
   * Calculate hex distance between two points
   */
  hexDistance(q1, r1, q2, r2) {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  }

  /**
   * Find nearest unit of specific type to a position
   */
  findNearestUnit(q, r, unitType, owner = null) {
    let candidates = this.getAllUnits().filter(unit => unit.type === unitType);
    
    if (owner) {
      candidates = candidates.filter(unit => unit.owner === owner);
    }

    let nearest = null;
    let nearestDistance = Infinity;

    candidates.forEach(unit => {
      const [unitQ, unitR] = unit.coords;
      const distance = this.hexDistance(q, r, unitQ, unitR);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = unit;
      }
    });

    return nearest;
  }

  /**
   * Find nearest building of specific type to a position
   */
  findNearestBuilding(q, r, buildingType, owner = null) {
    let candidates = this.getAllBuildings().filter(building => building.type === buildingType);
    
    if (owner) {
      candidates = candidates.filter(building => building.owner === owner);
    }

    let nearest = null;
    let nearestDistance = Infinity;

    candidates.forEach(building => {
      const [buildingQ, buildingR] = building.coords;
      const distance = this.hexDistance(q, r, buildingQ, buildingR);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = building;
      }
    });

    return nearest;
  }

  /**
   * Check if a position is occupied by any entity
   */
  isPositionOccupied(q, r) {
    return this.getUnitAt(q, r) !== undefined || this.getBuildingAt(q, r) !== undefined;
  }

  /**
   * Get all entities (units + buildings) in area
   */
  getEntitiesInArea(centerQ, centerR, range) {
    return {
      units: this.getUnitsInRange(centerQ, centerR, range),
      buildings: this.getBuildingsInRange(centerQ, centerR, range)
    };
  }

  /**
   * Game tick - update all players
   */
  tick() {
    this.tickCount++;
    
    // Update all players
    this.players.forEach(player => {
      player.tick();
    });

    // Update AI systems if available (enhanced with tick-based updates)
    if (this.aiManager) {
      this.aiManager.update(Date.now(), this.tickCount);
    }

    // Update battle system if available
    if (this.battleManager) {
      this.battleManager.tick();
    }

    // Clean up destroyed entities
    this.cleanup();
  }

  /**
   * Remove destroyed units and buildings
   */
  cleanup() {
    this.players.forEach(player => {
      // Remove destroyed units
      player.units = player.units.filter(unit => unit.isAlive());
      
      // Remove destroyed buildings
      player.buildings = player.buildings.filter(building => !building.isDestroyed());
    });
  }

  /**
   * Debug: Log current game state
   */
  debugState() {
    console.log(`=== GAME STATE (Tick ${this.tickCount}) ===`);
    this.players.forEach(player => {
      console.log(`${player.name}: ${player.units.length} units, ${player.buildings.length} buildings`);
      console.log(`  Resources:`, player.resources);
    });
    console.log(`Total entities: ${this.getAllUnits().length} units, ${this.getAllBuildings().length} buildings`);
  }

  /**
   * Get battle statistics for admin panel
   */
  getBattleStats() {
    if (!this.battleManager) {
      return {
        activeBattles: 0,
        unitsInBattle: 0,
        idleUnits: this.getAllUnits().filter(u => u.isAlive()).length,
        longestBattle: 0,
        battleLocations: []
      };
    }

    const battles = this.battleManager.getActiveBattles();
    const unitsInBattle = battles.reduce((total, battle) => 
      total + battle.attackers.length + battle.defenders.length, 0);
    const longestBattle = battles.reduce((max, battle) => 
      Math.max(max, this.tickCount - battle.startTick), 0);

    return {
      activeBattles: battles.length,
      unitsInBattle: unitsInBattle,
      idleUnits: this.getAllUnits().filter(u => u.isAlive()).length - unitsInBattle,
      longestBattle: longestBattle,
      battleLocations: battles.map(battle => battle.hex)
    };
  }

  /**
   * End all battles forcefully
   */
  endAllBattles() {
    if (!this.battleManager) return;

    const battles = this.battleManager.getActiveBattles();
    battles.forEach(battle => {
      this.battleManager.endBattle(battle);
    });
  }

  /**
   * Get nearest battle to specified coordinates
   */
  getNearestBattle(q, r) {
    if (!this.battleManager) return null;

    const battles = this.battleManager.getActiveBattles();
    if (battles.length === 0) return null;

    let nearest = null;
    let nearestDistance = Infinity;

    battles.forEach(battle => {
      const [battleQ, battleR] = battle.hex;
      const distance = this.hexDistance(q, r, battleQ, battleR);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = battle;
      }
    });

    return nearest;
  }
}

window.GameWorld = GameWorld;