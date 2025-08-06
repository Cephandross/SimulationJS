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
   * Find unit at specific coordinates
   */
  getUnitAt(q, r) {
    return this.getAllUnits().find(unit => 
      unit.coords[0] === q && unit.coords[1] === r
    );
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

    // Update AI systems if available
    if (this.aiManager) {
      this.aiManager.update(Date.now());
    }

    // Update battle system if available
    if (this.battleManager) {
      // Battle manager updates are handled elsewhere but could be added here
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
}

window.GameWorld = GameWorld;