// src/persistence/FullWorldPersistence.js
// Complete world save system using File API and IndexedDB

class FullWorldPersistence {
  constructor() {
    this.dbName = 'HexCiv4X_WorldSaves';
    this.dbVersion = 1;
    this.db = null;
    this.initializeDB();
  }

  async initializeDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for world saves
        if (!db.objectStoreNames.contains('worldSaves')) {
          const store = db.createObjectStore('worldSaves', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // ==========================================
  // FULL WORLD CAPTURE
  // ==========================================

  async saveFullWorld(scene, saveName, description = '') {
    try {
      console.log('🌍 Starting full world capture...');
      
      // Capture complete world state
      const worldData = await this.captureCompleteWorld(scene);
      
      // Compress the data
      const compressedData = await this.compressWorldData(worldData);
      
      // Create save metadata
      const saveFile = {
        id: this.generateSaveId(),
        name: saveName,
        description: description || `Full world save at tick ${scene.tickCount}`,
        timestamp: Date.now(),
        version: '2.0.0',
        worldData: compressedData,
        metadata: {
          tick: scene.tickCount,
          totalPlayers: scene.gameWorld.players.length,
          totalBuildings: scene.gameWorld.getAllBuildings().length,
          totalUnits: scene.gameWorld.getAllUnits().length,
          worldRadius: 125,
          totalTiles: worldData.tiles.length,
          uncompressedSize: JSON.stringify(worldData).length,
          compressedSize: compressedData.length
        }
      };
      
      // Save to IndexedDB
      await this.saveToIndexedDB(saveFile);
      
      // Also offer browser download as backup
      await this.offerBrowserDownload(saveFile, saveName);
      
      console.log(`✅ Full world saved: ${saveName}`);
      console.log(`📊 Size: ${(saveFile.metadata.compressedSize / (1024*1024)).toFixed(2)}MB`);
      
      return {
        success: true,
        saveId: saveFile.id,
        size: saveFile.metadata.compressedSize,
        compressionRatio: saveFile.metadata.uncompressedSize / saveFile.metadata.compressedSize
      };
      
    } catch (error) {
      console.error('❌ Full world save failed:', error);
      return { success: false, error: error.message };
    }
  }

  async captureCompleteWorld(scene) {
    const startTime = performance.now();
    
    // Capture every single tile
    const allTiles = [];
    scene.map.getAllTiles().forEach(tile => {
      allTiles.push({
        q: tile.q,
        r: tile.r,
        biome: tile.biome,
        oreType: tile.oreType || null,
        // Add generation data if available
        elevation: scene.map.elevationMap?.get(`${tile.q},${tile.r}`) || 0,
        temperature: scene.map.temperatureMap?.get(`${tile.q},${tile.r}`) || 0.5,
        moisture: scene.map.moistureMap?.get(`${tile.q},${tile.r}`) || 0.5
      });
    });
    
    // Capture complete world features
    const worldFeatures = {
      rivers: scene.map.riverPaths || [],
      oreDeposits: scene.map.oreDeposits || [],
      elevationMap: scene.map.elevationMap ? this.mapToArray(scene.map.elevationMap) : [],
      temperatureMap: scene.map.temperatureMap ? this.mapToArray(scene.map.temperatureMap) : [],
      moistureMap: scene.map.moistureMap ? this.mapToArray(scene.map.moistureMap) : []
    };
    
    // Capture all game entities
    const gameState = {
      tick: scene.tickCount,
      players: this.serializePlayersComplete(scene.gameWorld.players)
    };
    
    const captureTime = performance.now() - startTime;
    console.log(`📊 World capture completed in ${captureTime.toFixed(1)}ms`);
    console.log(`📊 Captured ${allTiles.length} tiles, ${worldFeatures.rivers.length} river segments`);
    
    return {
      tiles: allTiles,
      worldFeatures,
      gameState,
      generationMetadata: {
        timestamp: Date.now(),
        captureTime,
        worldRadius: 125
      }
    };
  }

  // ==========================================
  // DATA COMPRESSION
  // ==========================================

  async compressWorldData(worldData) {
    console.log('🗜️ Compressing world data...');
    const startTime = performance.now();
    
    // Apply multiple compression strategies
    const optimizedData = {
      tiles: this.compressTileData(worldData.tiles),
      worldFeatures: this.compressWorldFeatures(worldData.worldFeatures),
      gameState: worldData.gameState,
      generationMetadata: worldData.generationMetadata
    };
    
    // Convert to binary format for maximum compression
    const binaryData = this.convertToBinary(optimizedData);
    
    const compressionTime = performance.now() - startTime;
    const originalSize = JSON.stringify(worldData).length;
    const compressedSize = binaryData.length;
    const ratio = originalSize / compressedSize;
    
    console.log(`🗜️ Compression completed in ${compressionTime.toFixed(1)}ms`);
    console.log(`📊 ${(originalSize/(1024*1024)).toFixed(2)}MB → ${(compressedSize/(1024*1024)).toFixed(2)}MB (${ratio.toFixed(1)}x reduction)`);
    
    return binaryData;
  }

  compressTileData(tiles) {
    // Run-Length Encoding for biomes (most tiles are ocean/grass)
    const compressedTiles = [];
    
    // Sort tiles by coordinates for better compression
    tiles.sort((a, b) => {
      if (a.q !== b.q) return a.q - b.q;
      return a.r - b.r;
    });
    
    // Group consecutive tiles with same biome
    let currentGroup = null;
    
    tiles.forEach(tile => {
      if (currentGroup && 
          currentGroup.biome === tile.biome && 
          currentGroup.oreType === tile.oreType &&
          Math.abs(currentGroup.elevation - tile.elevation) < 0.1) {
        // Extend current group
        currentGroup.count++;
        currentGroup.endQ = tile.q;
        currentGroup.endR = tile.r;
      } else {
        // Start new group
        if (currentGroup) {
          compressedTiles.push(currentGroup);
        }
        currentGroup = {
          startQ: tile.q,
          startR: tile.r,
          endQ: tile.q,
          endR: tile.r,
          biome: tile.biome,
          oreType: tile.oreType,
          elevation: tile.elevation,
          temperature: tile.temperature,
          moisture: tile.moisture,
          count: 1
        };
      }
    });
    
    if (currentGroup) {
      compressedTiles.push(currentGroup);
    }
    
    console.log(`🗜️ Tiles: ${tiles.length} → ${compressedTiles.length} groups`);
    return compressedTiles;
  }

  compressWorldFeatures(features) {
    // Compress river paths using path simplification
    const simplifiedRivers = features.rivers.map(river => {
      if (river.length < 3) return river;
      
      // Douglas-Peucker algorithm simplified for hex coordinates
      return this.simplifyPath(river, 2.0); // 2 hex tolerance
    });
    
    return {
      rivers: simplifiedRivers,
      oreDeposits: features.oreDeposits, // Keep full precision
      elevationMap: this.compressFloatArray(features.elevationMap),
      temperatureMap: this.compressFloatArray(features.temperatureMap),
      moistureMap: this.compressFloatArray(features.moistureMap)
    };
  }

  convertToBinary(data) {
    // Convert to binary using ArrayBuffer for maximum compression
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    return encoder.encode(jsonString);
  }

  // ==========================================
  // SAVE/LOAD TO INDEXEDDB
  // ==========================================

  async saveToIndexedDB(saveFile) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['worldSaves'], 'readwrite');
      const store = transaction.objectStore('worldSaves');
      const request = store.put(saveFile);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async loadFromIndexedDB(saveId) {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['worldSaves'], 'readonly');
      const store = transaction.objectStore('worldSaves');
      const request = store.get(saveId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSaves() {
    if (!this.db) await this.initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['worldSaves'], 'readonly');
      const store = transaction.objectStore('worldSaves');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  // BROWSER DOWNLOAD BACKUP
  // ==========================================

  async offerBrowserDownload(saveFile, filename) {
    try {
      // Create downloadable file
      const saveJson = JSON.stringify(saveFile, null, 2);
      const blob = new Blob([saveJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.hexciv`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      console.log(`💾 Backup file offered for download: ${filename}.hexciv`);
      
    } catch (error) {
      console.warn('⚠️ Could not offer download backup:', error);
    }
  }

  // ==========================================
  // WORLD RESTORATION
  // ==========================================

  async loadFullWorld(saveId, scene) {
    try {
      console.log(`🌍 Loading full world: ${saveId}`);
      
      // Load from IndexedDB
      const saveFile = await this.loadFromIndexedDB(saveId);
      if (!saveFile) {
        throw new Error('Save file not found');
      }
      
      // Decompress world data
      const worldData = await this.decompressWorldData(saveFile.worldData);
      
      // Clear current world
      this.clearCurrentWorld(scene);
      
      // Restore complete world
      await this.restoreCompleteWorld(scene, worldData);
      
      // Restore game state
      this.restoreGameState(scene, worldData.gameState);
      
      console.log(`✅ Full world loaded: ${saveFile.name}`);
      return { success: true, saveFile };
      
    } catch (error) {
      console.error('❌ Full world load failed:', error);
      return { success: false, error: error.message };
    }
  }

  async decompressWorldData(compressedData) {
    console.log('🗜️ Decompressing world data...');
    
    // Convert from binary back to JSON
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(compressedData);
    const optimizedData = JSON.parse(jsonString);
    
    // Expand compressed tile data
    const expandedTiles = this.expandTileData(optimizedData.tiles);
    
    return {
      tiles: expandedTiles,
      worldFeatures: optimizedData.worldFeatures,
      gameState: optimizedData.gameState,
      generationMetadata: optimizedData.generationMetadata
    };
  }

  expandTileData(compressedTiles) {
    const tiles = [];
    
    compressedTiles.forEach(group => {
      // Recreate all tiles in this group
      for (let q = group.startQ; q <= group.endQ; q++) {
        for (let r = group.startR; r <= group.endR; r++) {
          tiles.push({
            q, r,
            biome: group.biome,
            oreType: group.oreType,
            elevation: group.elevation,
            temperature: group.temperature,
            moisture: group.moisture
          });
        }
      }
    });
    
    console.log(`🗜️ Expanded ${compressedTiles.length} groups to ${tiles.length} tiles`);
    return tiles;
  }

  async restoreCompleteWorld(scene, worldData) {
    console.log('🌍 Restoring complete world...');
    
    // Restore all tile data
    const tileMap = new Map();
    worldData.tiles.forEach(tileData => {
      tileMap.set(`${tileData.q},${tileData.r}`, tileData);
    });
    
    // Recreate world maps
    scene.map.elevationMap = this.arrayToMap(worldData.worldFeatures.elevationMap);
    scene.map.temperatureMap = this.arrayToMap(worldData.worldFeatures.temperatureMap);
    scene.map.moistureMap = this.arrayToMap(worldData.worldFeatures.moistureMap);
    scene.map.riverPaths = worldData.worldFeatures.rivers;
    scene.map.oreDeposits = worldData.worldFeatures.oreDeposits;
    
    // Recreate all tiles with correct data
    scene.map.tiles.clear();
    tileMap.forEach((tileData, coordKey) => {
      const tile = new HexTile(tileData.q, tileData.r, tileData.biome);
      tile.oreType = tileData.oreType;
      scene.map.setTile(tileData.q, tileData.r, tile);
      scene.map.createTileSprite(tile);
    });
    
    console.log(`🌍 Restored ${tileMap.size} tiles with complete data`);
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  generateSaveId() {
    return 'world_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  mapToArray(map) {
    return Array.from(map.entries());
  }

  arrayToMap(array) {
    return new Map(array);
  }

  compressFloatArray(array) {
    // Convert float arrays to 16-bit integers for space savings
    return array.map(([key, value]) => [key, Math.round(value * 1000)]);
  }

  simplifyPath(path, tolerance) {
    if (path.length <= 2) return path;
    
    // Very basic path simplification
    const simplified = [path[0]];
    let lastIndex = 0;
    
    for (let i = 1; i < path.length - 1; i++) {
      const distance = this.distanceToLine(path[i], path[lastIndex], path[path.length - 1]);
      if (distance > tolerance) {
        simplified.push(path[i]);
        lastIndex = i;
      }
    }
    
    simplified.push(path[path.length - 1]);
    return simplified;
  }

  distanceToLine(point, lineStart, lineEnd) {
    // Simple distance calculation for hex coordinates
    return Math.abs(point[0] - lineStart[0]) + Math.abs(point[1] - lineStart[1]);
  }

  clearCurrentWorld(scene) {
    // Clear all existing data
    scene.gameWorld.players.forEach(player => {
      player.buildings.forEach(b => {
        if (b.sprite) b.sprite.destroy();
        if (b.teamIndicator) b.teamIndicator.destroy();
      });
      player.units.forEach(u => {
        if (u.sprite) u.sprite.destroy();
        if (u.teamIndicator) u.teamIndicator.destroy();
      });
    });
    
    scene.gameWorld.players = [];
    scene.tickCount = 0;
  }

  restoreGameState(scene, gameState) {
    console.log('🎮 Restoring complete game state...');
    
    gameState.players.forEach(playerData => {
      console.log(`👤 Restoring player: ${playerData.name}`);
      
      // Create player
      const player = new Player(playerData.name, playerData.color, scene.gameWorld);
      player.resources = { ...playerData.resources };
      player.startCoords = playerData.startCoords;
      
      // ==========================================
      // RESTORE BUILDINGS (FIXED!)
      // ==========================================
      if (playerData.buildings && playerData.buildings.length > 0) {
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
            if (buildingData.resourcetype) {
              building.resourcetype = buildingData.resourcetype;
            }
            if (buildingData.resourceamount) {
              building.resourceamount = buildingData.resourceamount;
            }
            
            player.buildings.push(building);
            
            console.log(`🏗️ Restored ${buildingData.type} at [${buildingData.coords[0]}, ${buildingData.coords[1]}]`);
          } else {
            console.warn(`⚠️ Building class ${buildingData.type} not found`);
          }
        });
      }
      
      // ==========================================
      // RESTORE UNITS (FIXED!)
      // ==========================================
      if (playerData.units && playerData.units.length > 0) {
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
            unit.experience = unitData.experience || 0;
            unit.level = unitData.level || 1;
            unit.attack = unitData.attack || unit.attack; // Keep class default if not saved
            unit.defense = unitData.defense || unit.defense;
            unit.range = unitData.range || unit.range;
            
            // Restore movement/AI state
            if (unitData.destination) {
              unit.destination = {
                q: unitData.destination.q,
                r: unitData.destination.r
              };
            }
            unit.mission = unitData.mission || null;
            
            player.units.push(unit);
            
            console.log(`👤 Restored ${unitData.type} at [${unitData.coords[0]}, ${unitData.coords[1]}]`);
          } else {
            console.warn(`⚠️ Unit class ${unitData.type} not found`);
          }
        });
      }
      
      scene.gameWorld.addPlayer(player);
      console.log(`✅ Player ${playerData.name}: ${player.buildings.length} buildings, ${player.units.length} units`);
    });
    
    // Restore tick count
    scene.tickCount = gameState.tick;
    
    // Update UI
    const ui = scene.scene.get('UIScene');
    if (ui) {
      ui.updateTick(scene.tickCount);
    }
    
    console.log('✅ Complete game state restoration finished');
  }

  // ==========================================
  // ALSO FIX: Make sure serialization captures everything
  // ==========================================
  serializePlayersComplete(players) {
    console.log('📦 Serializing complete player data...');
    
    return players.map(player => {
      const playerData = {
        name: player.name,
        color: player.color,
        resources: { ...player.resources },
        startCoords: player.startCoords ? [...player.startCoords] : null,
        buildings: [],
        units: []
      };
      
      // Serialize buildings with full data
      if (player.buildings && player.buildings.length > 0) {
        playerData.buildings = player.buildings.map(building => ({
          type: building.type,
          category: building.category,
          coords: [...building.coords],
          completed: building.completed,
          ticksBuild: building.ticksBuild,
          buildTime: building.buildTime,
          hitpoints: building.hitpoints,
          resourcetype: building.resourcetype || null,
          resourceamount: building.resourceamount || 0
        }));
      }
      
      // Serialize units with full data
      if (player.units && player.units.length > 0) {
        playerData.units = player.units.map(unit => ({
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
        }));
      }
      
      console.log(`📦 Serialized ${player.name}: ${playerData.buildings.length} buildings, ${playerData.units.length} units`);
      return playerData;
    });
  }

  // ==========================================
  // VERIFICATION METHOD - Add this for debugging
  // ==========================================
  async verifyFullWorldSave(saveId) {
    try {
      const saveFile = await this.loadFromIndexedDB(saveId);
      if (!saveFile) {
        return { valid: false, error: 'Save file not found' };
      }
      
      const worldData = await this.decompressWorldData(saveFile.worldData);
      const gameState = worldData.gameState;
      
      let totalBuildings = 0;
      let totalUnits = 0;
      
      gameState.players.forEach(player => {
        totalBuildings += (player.buildings || []).length;
        totalUnits += (player.units || []).length;
      });
      
      return {
        valid: true,
        saveFile: saveFile.name,
        timestamp: new Date(saveFile.timestamp).toLocaleString(),
        players: gameState.players.length,
        totalBuildings,
        totalUnits,
        totalTiles: worldData.tiles.length,
        tick: gameState.tick
      };
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

// ==========================================
// NEW CONSOLE COMMAND FOR VERIFICATION
// ==========================================
window.verifyFullWorldSave = async function(saveId) {
  if (!window.fullWorldPersistence) {
    window.fullWorldPersistence = new FullWorldPersistence();
  }
  
  const result = await window.fullWorldPersistence.verifyFullWorldSave(saveId);
  
  if (result.valid) {
    console.log('✅ Full World Save Verification:');
    console.log(`📁 Save: ${result.saveFile}`);
    console.log(`📅 Date: ${result.timestamp}`);
    console.log(`👥 Players: ${result.players}`);
    console.log(`🏗️ Buildings: ${result.totalBuildings}`);
    console.log(`👤 Units: ${result.totalUnits}`);
    console.log(`🌍 Tiles: ${result.totalTiles}`);
    console.log(`⏱️ Tick: ${result.tick}`);
  } else {
    console.error('❌ Save verification failed:', result.error);
  }
  
  return result;
};

// Replace the existing FullWorldPersistence class
window.FullWorldPersistence = FullWorldPersistence;

// Browser console utilities
window.saveFullWorld = async function(name = 'full_world_save') {
  const scene = window.game?.scene?.getScene('MainScene');
  if (!scene) {
    console.error('❌ No MainScene found');
    return;
  }
  
  if (!window.fullWorldPersistence) {
    window.fullWorldPersistence = new FullWorldPersistence();
  }
  
  return await window.fullWorldPersistence.saveFullWorld(scene, name, 'Full world save from console');
};

window.loadFullWorld = async function(saveId) {
  const scene = window.game?.scene?.getScene('MainScene');
  if (!scene) {
    console.error('❌ No MainScene found');
    return;
  }
  
  if (!window.fullWorldPersistence) {
    window.fullWorldPersistence = new FullWorldPersistence();
  }
  
  return await window.fullWorldPersistence.loadFullWorld(saveId, scene);
};

window.listFullWorldSaves = async function() {
  if (!window.fullWorldPersistence) {
    window.fullWorldPersistence = new FullWorldPersistence();
  }
  
  const saves = await window.fullWorldPersistence.getAllSaves();
  console.table(saves.map(s => ({
    id: s.id,
    name: s.name,
    timestamp: new Date(s.timestamp).toLocaleString(),
    size: `${(s.metadata.compressedSize / (1024*1024)).toFixed(2)}MB`,
    tiles: s.metadata.totalTiles,
    tick: s.metadata.tick
  })));
  return saves;
};