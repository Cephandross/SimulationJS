// src/HexMap.js - New hex-based map system

/**
 * One hex tile at axial coordinates (q,r)
 */
class HexTile {
  constructor(q, r, biome) {
    this.q = q;              // Axial coordinate
    this.r = r;              // Axial coordinate  
    this.biome = biome;      // grass, water, sand, etc.
    this.building = null;
    this.unit = null;
    this.sprite = null;
    this.needsUpdating = false;
  }

  get coords() {
    return [this.q, this.r];
  }

  get pixelPos() {
    return hexToPixel(this.q, this.r);
  }

  isEmpty() {
    return this.building === null && this.unit === null;
  }

  placeUnit(unit) {
    if (this.unit) return false;
    this.unit = unit;
    unit.coords = [this.q, this.r];
    return true;
  }

   

  clearUnit() {
    this.unit = null;
  }

  isBuildable() {
    return !['water', 'deep_water'].includes(this.biome);
  }

  isPassable() {
    return !['water', 'deep_water'].includes(this.biome) && !this.building;
  }

  getNeighbors(hexMap) {
    return hexNeighbors(this.q, this.r)
      .map(([nq, nr]) => hexMap.getTile(nq, nr))
      .filter(tile => tile !== null);
  }
}

/**
 * Hex-based tilemap using your actual assets
 */

class HexTileMap {
  constructor(scene) {
    this.scene = scene;
    this.simplex = new SimplexNoise();
    this.tiles = new Map();
    this.tilesToUpdate = new Set();
    
    // World generation data
    this.elevationMap = new Map();
    this.temperatureMap = new Map();
    this.moistureMap = new Map();
    this.riverPaths = [];
    this.oreDeposits = [];
    
    this.generateRealisticWorld();
  }

  generateRealisticWorld() {
    const radius = 125; // Larger world
   

    
    // Step 1: Generate base maps
    this.generateElevationMap(radius);
    this.generateClimateMap(radius);
    
    // Step 2: Generate major features
    this.generateRiverNetwork(radius);
    this.generateOreDeposits(radius);
    
    // Step 3: Generate biomes and create tiles
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      
      for (let r = r1; r <= r2; r++) {
        const biome = this.generateRealisticBiome(q, r, radius);
        const tile = new HexTile(q, r, biome);
        this.setTile(q, r, tile);
        this.createTileSprite(tile);
      }
    }
    
    console.log(`Generated ${this.tiles.size} hex tiles with realistic terrain`);
  }

  generateElevationMap(radius) {
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      
      for (let r = r1; r <= r2; r++) {
        // Multi-octave noise for realistic elevation
       const continental = this.simplex.noise2D(q * 0.03, r * 0.03) * 0.4;   // Smaller continents
const regional = this.simplex.noise2D(q * 0.08, r * 0.08) * 0.4;     // Much more regional variation
const local = this.simplex.noise2D(q * 0.15, r * 0.15) * 0.2;       // Lots of local detail
        
        // Distance from center for island effect
        const distance = Math.sqrt(q * q + r * r) / radius;
        const islandEffect = Math.max(0, 1 - distance * 1.2);
        
        const elevation = (continental + regional + local + 1) * 0.5 * islandEffect;
        this.elevationMap.set(`${q},${r}`, elevation);
      }
    }
  }

  generateClimateMap(radius) {
    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);
      
      for (let r = r1; r <= r2; r++) {
        // Temperature based on latitude (r-coordinate)
        const latitude = Math.abs(r) / radius;
const baseTemp = 1.0 - latitude * 3;  
const tempNoise = this.simplex.noise2D(q * 0.05, r * 0.05) * 0.4;  
const temperature = Math.max(0, Math.min(1, baseTemp + tempNoise));


const moistureNoise1 = this.simplex.noise2D(q * 0.06, r * 0.06) * 0.6;
const moistureNoise2 = this.simplex.noise2D(q * 0.12, r * 0.12) * 0.4;
const moisture = (moistureNoise1 + moistureNoise2 + 1) * 0.5;
        
        this.temperatureMap.set(`${q},${r}`, temperature);
        this.moistureMap.set(`${q},${r}`, moisture);
      }
    }
  }

  generateRiverNetwork(radius) {
    const riverCount = 5; // Number of major rivers
    
    for (let i = 0; i < riverCount; i++) {
      const river = this.generateMeanderingRiver(radius);
      this.riverPaths.push(...river);
    }
  }

  generateMeanderingRiver(radius) {
    // Start from a high elevation point
    let bestStart = null;
    let highestElevation = 0;
    
    // Find mountain starting point
    for (let attempt = 0; attempt < 50; attempt++) {
      const q = Phaser.Math.Between(-radius + 20, radius - 20);
      const r = Phaser.Math.Between(-radius + 20, radius - 20);
      const elevation = this.elevationMap.get(`${q},${r}`) || 0;
      
      if (elevation > highestElevation && elevation > 0.6) {
        highestElevation = elevation;
        bestStart = [q, r];
      }
    }
    
    if (!bestStart) return [];
    
    const riverPath = [];
    let [currentQ, currentR] = bestStart;
    const maxLength = 80;
    const wanderStrength = 0.3;
    
    for (let step = 0; step < maxLength; step++) {
      riverPath.push([currentQ, currentR]);
      
      // Find lowest neighboring elevation
      const neighbors = hexNeighbors(currentQ, currentR);
      let bestNext = null;
      let lowestElevation = Infinity;
      
      neighbors.forEach(([nq, nr]) => {
        const elevation = this.elevationMap.get(`${nq},${nr}`);
        if (elevation !== undefined && elevation < lowestElevation) {
          lowestElevation = elevation;
          bestNext = [nq, nr];
        }
      });
      
      if (!bestNext) break;
      
      // Add some meandering
      if (Math.random() < wanderStrength) {
        const randomNeighbor = Phaser.Utils.Array.GetRandom(neighbors);
        const randomElevation = this.elevationMap.get(`${randomNeighbor[0]},${randomNeighbor[1]}`);
        if (randomElevation !== undefined && randomElevation <= lowestElevation + 0.1) {
          bestNext = randomNeighbor;
        }
      }
      
      [currentQ, currentR] = bestNext;
      
      // Stop if we reach water or edge
      const distance = Math.sqrt(currentQ * currentQ + currentR * currentR);
      if (distance > radius - 5 || lowestElevation < 0.1) break;
    }
    
    return riverPath;
  }

  generateOreDeposits(radius) {
    const oreTypes = [
      { type: 'iron', count: 10, color: 0x8B4513 },
      { type: 'copper', count: 8, color: 0xB87333 },
      { type: 'coal', count: 6, color: 0x2F2F2F },
      { type: 'gold', count: 4, color: 0xFFD700 }
    ];
    
    oreTypes.forEach(ore => {
      for (let i = 0; i < ore.count; i++) {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
          const q = Phaser.Math.Between(-radius + 10, radius - 10);
          const r = Phaser.Math.Between(-radius + 10, radius - 10);
          const elevation = this.elevationMap.get(`${q},${r}`) || 0;
          
          // Place ore in mountains (high elevation)
          if (elevation > 0.6) {
            // Check distance from other ore deposits
            const tooClose = this.oreDeposits.some(existing => {
              const distance = Math.abs(q - existing.q) + Math.abs(r - existing.r);
              return distance < 8; // Minimum distance between deposits
            });
            
            if (!tooClose) {
              this.oreDeposits.push({ q, r, type: ore.type, color: ore.color });
              placed = true;
            }
          }
          attempts++;
        }
      }
    });
    
    console.log(`Placed ${this.oreDeposits.length} ore deposits`);
  }

  generateRealisticBiome(q, r, radius) {
    const elevation = this.elevationMap.get(`${q},${r}`) || 0;
    const temperature = this.temperatureMap.get(`${q},${r}`) || 0.5;
    const moisture = this.moistureMap.get(`${q},${r}`) || 0.5;
    const distance = Math.sqrt(q * q + r * r) / radius;
    
    // Check if this is a river tile
    const isRiver = this.riverPaths.some(([rq, rr]) => rq === q && rr === r);
    if (isRiver) return 'river';
    
    // Ocean at very low elevations and map edges
    if (elevation < 0.15 || (distance > 0.9 && elevation < 0.3)) {
      return 'ocean';
    }
    
    // Lakes in low areas away from edges
    if (elevation < 0.25 && distance < 0.8 && moisture > 0.6) {
      return 'lake';
    }
    
    // Mountains at high elevation
    if (elevation > 0.7) {
      return temperature < 0.3 ? 'snow_mountain' : 'mountain';
    }
    
    // Hills at medium-high elevation
    if (elevation > 0.5) {
      return 'hills';
    }
    
    // Climate-based biomes for lower elevations
    if (temperature < 0.2) {
      // Arctic
      return moisture > 0.4 ? 'snow_forest' : 'snow';
    } else if (temperature < 0.5) {
      // Temperate
      if (moisture > 0.7) return 'swamp';
      if (moisture > 0.5) return 'forest';
      if (moisture > 0.3) return 'grass';
      return 'rough';
    } else if (temperature < 0.8) {
      // Warm temperate
      if (moisture > 0.7) return 'jungle';
      if (moisture > 0.5) return 'forest';
      if (moisture > 0.3) return 'grass';
      return 'desert';
    } else {
      // Hot
      if (moisture > 0.6) return 'jungle';
      if (moisture > 0.3) return 'desert';
      return 'desert';
    }
  }

  createTileSprite(tile) {
    const [x, y] = tile.pixelPos;
    const spriteOptions = BIOME_ASSETS[tile.biome];
    
    if (!spriteOptions || spriteOptions.length === 0) {
      console.warn(`No sprites for biome: ${tile.biome}`);
      return;
    }
    
    // Pick random sprite variant
    const spriteKey = Phaser.Utils.Array.GetRandom(spriteOptions);
    
    try {
      tile.sprite = this.scene.add.sprite(x, y, spriteKey)
        .setOrigin(0.5, 0.5)
        .setDepth(0);
        
      // Add ore deposit indicator
      const ore = this.oreDeposits.find(deposit => deposit.q === tile.q && deposit.r === tile.r);
      if (ore) {
        // Small colored square in upper right
        const indicator = this.scene.add.rectangle(x + 25, y - 25, 8, 8, ore.color)
          .setDepth(1);
        tile.oreIndicator = indicator;
        tile.oreType = ore.type;
      }
      
    } catch (error) {
      console.error(`Failed to create sprite ${spriteKey}:`, error);
    }
  }

  getTile(q, r) {
    const key = `${q},${r}`;
    return this.tiles.get(key) || null;
  }

  setTile(q, r, tile) {
    const key = `${q},${r}`;
    this.tiles.set(key, tile);
  }

  placeUnitSprite(unit, q, r, tint) {
    const [x, y] = hexToPixel(q, r);
    
    // Try to use the unit's sprite if it has one
    if (unit.spriteKey) {
      try {
        return this.scene.add.sprite(x, y, unit.spriteKey, unit.spriteFrame || 0)
          .setOrigin(0.5, 0.5)
          .setDepth(3)
          .setTint(tint);
      } catch (error) {
        console.warn(`Unit sprite ${unit.spriteKey} failed:`, error);
      }
    }
    
    // Try to use chicken sprite if it's a worker/builder
    if (['Worker', 'Builder'].includes(unit.type)) {
      try {
        return this.scene.add.sprite(x, y, 'ChickenForward1')
          .setOrigin(0.5, 0.5)
          .setDepth(3)
          .setTint(tint);
      } catch (error) {
        console.warn('Chicken sprite failed, using circle');
      }
    }
    
    // Fallback to colored circle
    return this.scene.add.circle(x, y, 15, tint)
      .setDepth(3);
}

  markForUpdate(tile) {
    if (!tile.needsUpdating) {
      tile.needsUpdating = true;
      this.tilesToUpdate.add(tile);
    }
  }

  unmarkUpdate(tile) {
    if (tile.needsUpdating) {
      tile.needsUpdating = false;
      this.tilesToUpdate.delete(tile);
    }
  }

  generateHexWorld() {
    const radius = 50; // Start with smaller world for testing
    
    
    
    
    // Generate hexagonal area
    for (let q = -radius; q <= radius; q++) {
  for (let r = -radius; r <= radius; r++) {
    // Skip if outside hexagonal boundary
    if (Math.abs(q) + Math.abs(r) + Math.abs(-q-r) > radius * 2) continue;
        const biome = this.generateBiome(q, r);
        const tile = new HexTile(q, r, biome);
        this.setTile(q, r, tile);
        
        // Create sprite for this tile
        this.createTileSprite(tile);
      }
    }
    
    console.log(`Generated ${this.tiles.size} hex tiles`);
  }

  generateBiome(q, r) {
  // Use simplex noise for altitude/elevation
  const scale = 0.05; // Adjust for different terrain scales
  const altitude = (this.simplex.noise2D(q * scale, r * scale) + 1) * 0.5;
  
  // Distance from origin for radial effects
  const distance = Math.sqrt(q * q + r * r);
  const normalizedDistance = distance / 50; // Normalize by map radius
  
  // Multi-octave noise for terrain complexity
  const roughness = 
    this.simplex.noise2D(q * 0.02, r * 0.02) * 0.5 +
    this.simplex.noise2D(q * 0.08, r * 0.08) * 0.3 +
    this.simplex.noise2D(q * 0.15, r * 0.15) * 0.2;
  
  const finalElevation = altitude + roughness * 0.3;
  
  
  if (finalElevation < 0.15) return 'water';
  if (finalElevation < 0.35 && Math.random() > 0.7) return 'shallow_water';
  
  // Coastal areas
  if (finalElevation < 0.45) return 'sand';
  
  // Temperature simulation (distance from equator - middle of map)
  //const temperature = 1.0 - Math.abs(r) / 50;
  
  // Moisture simulation
  //const moisture = this.simplex.noise2D(q * 0.03, r * 0.03);
  
  // Biome determination
  //if (finalElevation > 0.75) return 'mountain';
 // if (temperature > 0.7 && moisture > 0.3) return 'wheat';
  //if (temperature < 0.4) return 'dead_grass';
  
  return 'grass';
}

  createTileSprite(tile) {
    const [x, y] = tile.pixelPos;
    const spriteOptions = BIOME_ASSETS[tile.biome];
    
    if (!spriteOptions || spriteOptions.length === 0) {
      console.warn(`No sprites for biome: ${tile.biome}`);
      return;
    }
    
    // Pick random sprite variant for this biome
    const spriteKey = Phaser.Utils.Array.GetRandom(spriteOptions);
    
    try {
      tile.sprite = this.scene.add.sprite(x, y, spriteKey)
        .setOrigin(0.5, 0.5)
        .setDepth(0);
    } catch (error) {
      console.error(`Failed to create sprite ${spriteKey}:`, error);
      // Fallback to first available sprite
      try {
        const fallback = Object.values(BIOME_ASSETS).flat()[0];
        tile.sprite = this.scene.add.sprite(x, y, fallback)
          .setOrigin(0.5, 0.5)
          .setDepth(0);
      } catch (fallbackError) {
        console.error('Complete sprite failure:', fallbackError);
      }
    }
  }

   /**
   * Place a building sprite properly centered on hex tile
   * 32x32 building sprite centered on 64x64 hex tile
   */
  placeBuildingSprite(building, q, r, tint) {
  const [pixelX, pixelY] = hexToPixel(q, r);
  
  // DEBUG: Log building sprite details
  console.log('=== BUILDING SPRITE DEBUG ===');
  console.log('Building type:', building.type);
  console.log('Sprite key:', building.spriteKey);
  console.log('Sprite frame:', building.spriteFrame);
  console.log('Position:', pixelX, pixelY);
  console.log('Tint:', tint);
  
  // Check if sprite key exists
  const texture = this.scene.textures.get(building.spriteKey);
  console.log('Texture exists:', !!texture);
  if (texture) {
    console.log('Frame exists:', texture.frames[building.spriteFrame] !== undefined);
  }
  
  
  
}

  /**
   * Enhanced building placement with adjacency checking
   */
  placeBuildingState(building, q, r) {
    const tile = this.getTile(q, r);
    
    // Basic placement validation
    if (!tile || !tile.isBuildable() || !tile.isEmpty()) {
      return false;
    }
    
    // Category-specific placement rules
    if (!this.validateBuildingPlacement(building, q, r)) {
      return false;
    }
    
    // Place the building
    tile.building = building;
    building.coords = [q, r];
    this.markForUpdate(tile);
    
    // Calculate adjacency bonuses
    this.calculateAdjacencyEffects(building, q, r);
    
    return true;
  }

  /**
   * Validate building placement based on category and adjacency rules
   */
  validateBuildingPlacement(building, q, r) {
    const neighbors = this.getNeighbors(q, r);
    
    switch (building.category) {
      case 'Founding':
        // Town centers need open space around them
        const nearbyBuildings = neighbors.filter(n => n && n.building);
        return nearbyBuildings.length <= 2; // Max 2 adjacent buildings
        
      case 'Population':
        // Houses prefer to be near other houses or town centers
        const nearbyHousing = neighbors.filter(n => 
          n && n.building && ['Population', 'Founding'].includes(n.building.category)
        );
        return nearbyHousing.length >= 1; // Must be near at least 1 compatible building
        
      case 'Gathering':
        // Resource buildings must be on correct biome
        return this.validateResourcePlacement(building, q, r);
        
      case 'Training':
        // Military buildings prefer to be near town centers
        const nearbyTowns = neighbors.filter(n => 
          n && n.building && n.building.category === 'Founding'
        );
        return true; // No hard restrictions for now
        
      case 'Crafting':
        // Crafting buildings like to be near resources and housing
        return true; // No hard restrictions for now
        
      default:
        return true;
    }
  }

  /**
   * Validate resource gathering building placement
   */
  validateResourcePlacement(building, q, r) {
  const tile = this.getTile(q, r);
  if (!tile) return false;
  
  const resourceType = building.resourcetype;
  
  // Resource requirements
  const resourceBiomes = {
    'wood': ['forest', 'pine_forest', 'dark_forest'],
    'stone': ['mountain', 'snow_mountain', 'hills'],
    'food': ['grass', 'light_grass'], // Farms on grassland only
    'coal': ['mountain', 'snow_mountain'], // Must be on mountains...
    'iron': ['mountain', 'snow_mountain'],
    'copper': ['mountain', 'snow_mountain'], 
    'gold': ['mountain', 'snow_mountain']
  };
  
  const requiredBiomes = resourceBiomes[resourceType];
  if (!requiredBiomes) return true;
  
  // For ore, also check for deposit
  if (['coal', 'iron', 'copper', 'gold'].includes(resourceType)) {
    return requiredBiomes.includes(tile.biome) && tile.oreType === resourceType;
  }
  
  return requiredBiomes.includes(tile.biome);
}

  /**
   * Calculate adjacency bonuses for buildings
   */
  calculateAdjacencyEffects(building, q, r) {
    const neighbors = this.getNeighbors(q, r);
    
    // Reset adjacency bonuses
    building.adjacencyBonus = {
      production: 1.0,
      efficiency: 1.0,
      defense: 1.0
    };
    
    neighbors.forEach(neighbor => {
      if (!neighbor || !neighbor.building) return;
      
      const neighborBuilding = neighbor.building;
      
      // Calculate synergy bonuses
      this.applyAdjacencyBonus(building, neighborBuilding);
    });
  }

  /**
   * Apply specific adjacency bonuses between building types
   */
  applyAdjacencyBonus(building, neighbor) {
    const synergies = {
      // Houses near town centers get population bonus
      'Population + Founding': { production: 1.2 },
      
      // Crafting buildings near resources get efficiency bonus
      'Crafting + Gathering': { efficiency: 1.3 },
      
      // Military buildings near each other get defense bonus
      'Training + Training': { defense: 1.4 },
      
      // Markets near houses increase trade
      'Trade + Population': { production: 1.15 },
      
      // Farms near water get fertility bonus
      'Gathering(food) + Water': { production: 1.25 }
    };
    
    // Check for synergy matches
    const key1 = `${building.category} + ${neighbor.category}`;
    const key2 = `${neighbor.category} + ${building.category}`;
    
    const bonus = synergies[key1] || synergies[key2];
    if (bonus) {
      Object.keys(bonus).forEach(stat => {
        building.adjacencyBonus[stat] *= bonus[stat];
      });
    }
  }

  /**
   * Get all neighboring tiles for a hex coordinate
   */
  getNeighbors(q, r) {
    return hexNeighbors(q, r)
      .map(([nq, nr]) => this.getTile(nq, nr))
      .filter(tile => tile !== null);
  }

  /**
   * Get all buildings within range (for area effects)
   */
  getBuildingsInRange(q, r, range) {
    const buildings = [];
    
    // Use hex distance calculation
    for (let [tileQ, tileR, tile] of this.getAllTilesWithCoords()) {
      const distance = this.hexDistance(q, r, tileQ, tileR);
      if (distance <= range && tile.building) {
        buildings.push({
          building: tile.building,
          distance: distance,
          coords: [tileQ, tileR]
        });
      }
    }
    
    return buildings;
  }

  /**
   * Calculate hex distance between two coordinates
   */
  hexDistance(q1, r1, q2, r2) {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  }

  /**
   * Helper to get all tiles with their coordinates
   */
  getAllTilesWithCoords() {
    const result = [];
    for (let [key, tile] of this.tiles) {
      const [q, r] = key.split(',').map(Number);
      result.push([q, r, tile]);
    }
    return result;
  }

  getAllTiles() {
  return Array.from(this.tiles.values());
}
}


window.HexTileMap = HexTileMap;
window.HexTile = HexTile;