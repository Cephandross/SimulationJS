// src/persistence/GamePersistence.js
// Simple localStorage-based save/load system for single-player

class GamePersistence {
  constructor() {
    this.storagePrefix = 'hexCiv4X_';
    this.maxSaveSlots = 10;
  }

  /**
   * Save complete game state to localStorage
   */
  saveGame(scene, slotName = 'autosave', description = '') {
    try {
      // Collect world state (since no seed system exists yet)
      const worldState = this.captureWorldState(scene.map);
      
      const gameState = {
        version: '1.0.0',
        timestamp: Date.now(),
        description: description || `Auto-save at tick ${scene.tickCount}`,
        metadata: {
          tick: scene.tickCount,
          totalPlayers: scene.gameWorld.players.length,
          totalBuildings: scene.gameWorld.getAllBuildings().length,
          totalUnits: scene.gameWorld.getAllUnits().length,
          mapSize: worldState.tiles.length
        },
        
        // Core game state
        gameWorld: {
          tickCount: scene.tickCount,
          players: this.serializePlayers(scene.gameWorld.players),
          worldState: worldState
        }
      };

      // Save to localStorage
      const key = this.storagePrefix + slotName;
      const serialized = JSON.stringify(gameState);
      
      // Check storage space (5MB limit for localStorage)
      if (serialized.length > 4.5 * 1024 * 1024) {
        throw new Error('Save file too large (>4.5MB). Try reducing world size.');
      }
      
      localStorage.setItem(key, serialized);
      
      console.log(`💾 Game saved successfully to slot: ${slotName}`);
      console.log(`📊 Save size: ${(serialized.length / 1024).toFixed(1)}KB`);
      
      return {
        success: true,
        slotName,
        size: serialized.length,
        timestamp: gameState.timestamp
      };
      
    } catch (error) {
      console.error('❌ Save failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load game state from localStorage
   */
  loadGame(slotName = 'autosave') {
    try {
      const key = this.storagePrefix + slotName;
      const saved = localStorage.getItem(key);
      
      if (!saved) {
        throw new Error(`Save slot '${slotName}' not found`);
      }
      
      const gameState = JSON.parse(saved);
      
      // Version compatibility check
      if (!gameState.version || gameState.version !== '1.0.0') {
        console.warn('⚠️ Loading save from different version, may cause issues');
      }
      
      console.log(`💾 Loaded game from slot: ${slotName}`);
      console.log(`📊 Save from: ${new Date(gameState.timestamp).toLocaleString()}`);
      
      return {
        success: true,
        gameState
      };
      
    } catch (error) {
      console.error('❌ Load failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore game state to active scene
   */
  restoreGameState(scene, gameState) {
    try {
      console.log('🔄 Restoring game state...');
      
      // Clear existing state
      this.clearCurrentGame(scene);
      
      // Restore world state
      this.restoreWorldState(scene, gameState.gameWorld.worldState);
      
      // Restore players
      this.restorePlayers(scene, gameState.gameWorld.players);
      
      // Restore tick count
      scene.tickCount = gameState.gameWorld.tickCount;
      
      // Update UI
      const ui = scene.scene.get('UIScene');
      if (ui) {
        ui.updateTick(scene.tickCount);
      }
      
      console.log('✅ Game state restored successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Restore failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get list of all save slots
   */
  getSaveSlots() {
    const slots = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        try {
          const slotName = key.replace(this.storagePrefix, '');
          const data = JSON.parse(localStorage.getItem(key));
          
          slots.push({
            name: slotName,
            description: data.description || 'No description',
            timestamp: data.timestamp,
            metadata: data.metadata,
            size: localStorage.getItem(key).length,
            isValid: !!data.gameWorld
          });
          
        } catch (error) {
          console.warn(`⚠️ Invalid save slot: ${key}`);
        }
      }
    }
    
    return slots.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete a save slot
   */
  deleteSave(slotName) {
    const key = this.storagePrefix + slotName;
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`🗑️ Deleted save slot: ${slotName}`);
      return true;
    }
    return false;
  }

  /**
   * Auto-save functionality
   */
  startAutoSave(scene, intervalMinutes = 5) {
    this.stopAutoSave(); // Clear any existing auto-save
    
    this.autoSaveInterval = setInterval(() => {
      this.saveGame(scene, 'autosave', `Auto-save at ${new Date().toLocaleTimeString()}`);
    }, intervalMinutes * 60 * 1000);
    
    console.log(`⏰ Auto-save enabled (every ${intervalMinutes} minutes)`);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // ========================================
  // SERIALIZATION METHODS
  // ========================================

  serializePlayers(players) {
    return players.map(player => ({
      name: player.name,
      color: player.color,
      resources: { ...player.resources },
      startCoords: player.startCoords ? [...player.startCoords] : null,
      
      buildings: player.buildings.map(building => ({
        type: building.type,
        category: building.category,
        coords: [...building.coords],
        completed: building.completed,
        ticksBuild: building.ticksBuild,
        buildTime: building.buildTime,
        hitpoints: building.hitpoints,
        resourcetype: building.resourcetype,
        resourceamount: building.resourceamount
      })),
      
      units: player.units.map(unit => ({
        type: unit.type,
        coords: [...unit.coords],
        hp: unit.hp,
        maxHp: unit.maxHp,
        experience: unit.experience || 0,
        level: unit.level || 1,
        attack: unit.attack || 0,
        defense: unit.defense || 0,
        range: unit.range || 1,
        destination: unit.destination ? {
          q: unit.destination.q,
          r: unit.destination.r
        } : null,
        mission: unit.mission || null
      }))
    }));
  }

  captureWorldState(hexMap) {
    // Since we don't have seeds, capture the actual tile data
    const importantTiles = [];
    
    hexMap.getAllTiles().forEach(tile => {
      // Only save non-standard tiles to reduce size
      if (tile.building || tile.unit || tile.oreType || 
          !['grass', 'ocean', 'mountain', 'forest'].includes(tile.biome)) {
        importantTiles.push({
          q: tile.q,
          r: tile.r,
          biome: tile.biome,
          oreType: tile.oreType || null
        });
      }
    });
    
    return {
      tiles: importantTiles,
      generationParams: {
        radius: 125, // Current world radius
        timestamp: Date.now()
      },
      oreDeposits: hexMap.oreDeposits || [],
      riverPaths: hexMap.riverPaths || []
    };
  }

  // ========================================
  // RESTORATION METHODS
  // ========================================

  clearCurrentGame(scene) {
    // Clear existing players
    scene.gameWorld.players.forEach(player => {
      // Destroy all sprites
      player.buildings.forEach(building => {
        if (building.sprite) building.sprite.destroy();
        if (building.teamIndicator) building.teamIndicator.destroy();
      });
      
      player.units.forEach(unit => {
        if (unit.sprite) unit.sprite.destroy();
        if (unit.teamIndicator) unit.teamIndicator.destroy();
      });
    });
    
    // Reset game world
    scene.gameWorld.players = [];
    scene.tickCount = 0;
  }

  restoreWorldState(scene, worldState) {
    console.log('🌍 Regenerating world from save data...');
    
    // Regenerate base world (since we don't have seeds)
    scene.map.generateRealisticWorld();
    
    // Apply saved tile modifications
    worldState.tiles.forEach(tileData => {
      const tile = scene.map.getTile(tileData.q, tileData.r);
      if (tile) {
        tile.biome = tileData.biome;
        tile.oreType = tileData.oreType;
        
        // Recreate tile sprite with new biome
        if (tile.sprite) {
          tile.sprite.destroy();
        }
        scene.map.createTileSprite(tile);
      }
    });
    
    // Restore ore deposits and rivers
    if (worldState.oreDeposits) {
      scene.map.oreDeposits = worldState.oreDeposits;
    }
    if (worldState.riverPaths) {
      scene.map.riverPaths = worldState.riverPaths;
    }
  }

  restorePlayers(scene, playersData) {
    playersData.forEach(playerData => {
      console.log(`👤 Restoring player: ${playerData.name}`);
      
      // Create player
      const player = new Player(playerData.name, playerData.color, scene.gameWorld);
      player.resources = { ...playerData.resources };
      player.startCoords = playerData.startCoords;
      
      // Restore buildings
      playerData.buildings.forEach(buildingData => {
        const BuildingClass = window[buildingData.type];
        if (BuildingClass) {
          const building = new BuildingClass(
            buildingData.coords,
            player,
            scene
          );
          
          // Restore building state
          building.completed = buildingData.completed;
          building.ticksBuild = buildingData.ticksBuild;
          building.buildTime = buildingData.buildTime;
          building.hitpoints = buildingData.hitpoints;
          
          player.buildings.push(building);
          
          console.log(`🏗️ Restored ${buildingData.type} at [${buildingData.coords[0]}, ${buildingData.coords[1]}]`);
        } else {
          console.warn(`⚠️ Building class ${buildingData.type} not found`);
        }
      });
      
      // Restore units
      playerData.units.forEach(unitData => {
        const UnitClass = window[unitData.type];
        if (UnitClass) {
          const unit = new UnitClass(
            unitData.coords,
            player,
            scene
          );
          
          // Restore unit state
          unit.hp = unitData.hp;
          unit.maxHp = unitData.maxHp;
          unit.experience = unitData.experience;
          unit.level = unitData.level;
          unit.attack = unitData.attack;
          unit.defense = unitData.defense;
          unit.range = unitData.range;
          unit.destination = unitData.destination;
          unit.mission = unitData.mission;
          
          player.units.push(unit);
          
          console.log(`👤 Restored ${unitData.type} at [${unitData.coords[0]}, ${unitData.coords[1]}]`);
        } else {
          console.warn(`⚠️ Unit class ${unitData.type} not found`);
        }
      });
      
      scene.gameWorld.addPlayer(player);
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  getStorageUsage() {
    let totalSize = 0;
    const gameSlots = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        const size = localStorage.getItem(key).length;
        totalSize += size;
        gameSlots.push({
          slot: key.replace(this.storagePrefix, ''),
          size: size
        });
      }
    }
    
    return {
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      availableSpace: (5 * 1024 * 1024) - totalSize, // 5MB localStorage limit
      slots: gameSlots
    };
  }

  cleanup() {
    this.stopAutoSave();
  }
}

// Export and create global instance
window.GamePersistence = GamePersistence;

// Browser console utilities
window.saveGame = function(slotName = 'manual_save') {
  const scene = window.game?.scene?.getScene('MainScene');
  if (!scene) {
    console.error('❌ No MainScene found');
    return;
  }
  
  if (!window.gamePersistence) {
    window.gamePersistence = new GamePersistence();
  }
  
  return window.gamePersistence.saveGame(scene, slotName, `Manual save from console`);
};

window.loadGame = function(slotName = 'manual_save') {
  const scene = window.game?.scene?.getScene('MainScene');
  if (!scene) {
    console.error('❌ No MainScene found');
    return;
  }
  
  if (!window.gamePersistence) {
    window.gamePersistence = new GamePersistence();
  }
  
  const result = window.gamePersistence.loadGame(slotName);
  if (result.success) {
    return window.gamePersistence.restoreGameState(scene, result.gameState);
  }
  return result;
};

window.listSaves = function() {
  if (!window.gamePersistence) {
    window.gamePersistence = new GamePersistence();
  }
  
  const slots = window.gamePersistence.getSaveSlots();
  console.table(slots);
  return slots;
};

window.deleteSave = function(slotName) {
  if (!window.gamePersistence) {
    window.gamePersistence = new GamePersistence();
  }
  
  return window.gamePersistence.deleteSave(slotName);
};

window.storageInfo = function() {
  if (!window.gamePersistence) {
    window.gamePersistence = new GamePersistence();
  }
  
  const info = window.gamePersistence.getStorageUsage();
  console.log('💾 localStorage Usage:');
  console.log(`Total: ${info.totalSizeMB}MB`);
  console.log(`Available: ${(info.availableSpace / (1024*1024)).toFixed(2)}MB`);
  console.table(info.slots);
  return info;
};