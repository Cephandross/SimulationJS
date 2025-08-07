// src/player.js - Refactored version

class Player {
  constructor(name, color, gameWorld) {
    this.name = name;
    this.color = color;
    this.gameWorld = gameWorld; // Reference to central coordinator
    this.scene = gameWorld.scene;
    
    this.resources = {
      food: 0, wood: 0, stone: 0, iron: 0,
      copper: 0, coal: 0, gold: 0, coins: 0
    };
    
    this.buildings = [];  // Array of Building instances
    this.units = [];      // Array of Unit instances
    this.population = 0;
    this.startCoords = null;
    
    // NEW: Track building counts for exponential scaling
    this.buildingCounts = {};
  }

  addResources(typeOrMap, amount) {
    if (typeof typeOrMap === 'object') {
      // bulk-update: p.addResources({ wood:100, stone:50, … })
      for (const [res, amt] of Object.entries(typeOrMap)) {
        this.resources[res] = (this.resources[res] || 0) + amt;
      }
    } else {
      // single update: p.addResources('wood', 10)
      this.resources[typeOrMap] = (this.resources[typeOrMap] || 0) + amount;
    }
  }

  canAfford(costs) {
    return Object.entries(costs).every(
      ([k, v]) => (this.resources[k] || 0) >= v
    );
  }

  spendResources(costs) {
    if (!this.canAfford(costs)) return false;
    for (let k in costs) {
      this.resources[k] -= costs[k];
    }
    return true;
  }

  /**
   * Calculate scaled costs based on existing buildings of same type
   */
  getScaledBuildingCosts(BuildingClass) {
    const tempBuilding = new BuildingClass([0, 0]); // Create temp instance for base costs
    const baseCosts = tempBuilding.costs;
    const buildingType = tempBuilding.type;
    
    // Count existing buildings of this type
    const existingCount = this.buildingCounts[buildingType] || 0;
    
    // Apply exponential scaling: cost = baseCost * (multiplier ^ existingCount)
    const multiplier = 1.5; // 50% increase per building
    const scalingFactor = Math.pow(multiplier, existingCount);
    
    // Calculate scaled costs
    const scaledCosts = {};
    for (const [resource, amount] of Object.entries(baseCosts)) {
      scaledCosts[resource] = Math.ceil(amount * scalingFactor);
    }
    
    console.log(`💰 ${buildingType} #${existingCount + 1}: Base ${JSON.stringify(baseCosts)} → Scaled ${JSON.stringify(scaledCosts)} (${scalingFactor.toFixed(2)}x)`);
    
    return scaledCosts;
  }

  /**
   * Try to place a building - now with exponential cost scaling!
   */
  build(BuildingClass, [q, r]) {
    // Check if placement is valid
    if (!Building.canPlaceAt(BuildingClass, q, r, this.scene, this)) {
      console.warn(`❌ Cannot place ${BuildingClass.name} at [${q}, ${r}]`);
      return false;
    }

    // Get scaled costs instead of base costs
    const scaledCosts = this.getScaledBuildingCosts(BuildingClass);

    // Check affordability with scaled costs
    if (!this.spendResources(scaledCosts)) {
      console.warn(`❌ Cannot afford ${BuildingClass.name}: need`, scaledCosts);
      return false;
    }

    // Create the actual building
    const building = new BuildingClass([q, r], this, this.scene);
    this.buildings.push(building);
    
    // Update building count for this type
    this.buildingCounts[building.type] = (this.buildingCounts[building.type] || 0) + 1;
    
    console.log(`🏗️ ${this.name} built ${building.type} #${this.buildingCounts[building.type]} at [${q}, ${r}] for ${JSON.stringify(scaledCosts)}`);
    return true;
  }

  /**
   * Spawn a unit - much simpler now!
   */
  spawnUnit(UnitClass, [q, r]) {
    // Check if position is valid
    const tile = this.scene.map.getTile(q, r);
    if (!tile || !tile.isPassable()) {
      console.warn(`❌ Cannot spawn ${UnitClass.name} at [${q}, ${r}] - impassable`);
      return false;
    }

    // Check for existing unit at position
    if (this.gameWorld.getUnitAt(q, r)) {
      console.warn(`❌ Cannot spawn ${UnitClass.name} at [${q}, ${r}] - occupied`);
      return false;
    }

    // Create the unit
    const unit = new UnitClass([q, r], this, this.scene);
    this.units.push(unit);
    console.log(`👤 ${this.name} spawned ${unit.type} at [${q}, ${r}]`);
    return unit;
  }

  /**
   * Game tick - much cleaner now!
   */
  tick() {
    // 1) Advance building construction
    this.buildings.forEach(building => {
      building.tickBuild();
      if (building.completed && building.category === 'Gathering') {
        building.gatherUpdate();
      }
    });

    // 2) Update unit movement/AI
    this.units.forEach(unit => {
      unit.tick();
    });

    // 3) Food upkeep
    const upkeep = Math.max(0, this.population - this.units.length);
    if (upkeep > 0) {
      this.resources.food = Math.max(0, this.resources.food - upkeep);
    }
  }

  /**
   * Initialize CPU player base
   */
  initializeBase() {
    // Find valid start location
    const startInfo = this.findValidStartLocation();
    if (!startInfo) {
      console.error(`❌ ${this.name}: No valid start location found`);
      return;
    }

    const [startQ, startR] = startInfo.coords;
    this.startCoords = [startQ, startR];
    this.scene.registry.set(`${this.name}Start`, [startQ, startR]);

    console.log(`🏛️ ${this.name} starting at [${startQ}, ${startR}]`);

    // Build initial structures
    this.build(TownCenter, [startQ, startR]);
    this.placeStartingGatherers(startInfo.resources);

    // Spawn initial builder
    this.spawnBootstrapBuilder([startQ, startR]);
  }

  findValidStartLocation() {
    const maxDistanceFromCenter = 100;
    const attempts = 200;

    console.log(`🔍 ${this.name}: Searching for start location...`);

    for (let i = 0; i < attempts; i++) {
      const q = Phaser.Math.Between(-maxDistanceFromCenter, maxDistanceFromCenter);
      const r = Phaser.Math.Between(-maxDistanceFromCenter, maxDistanceFromCenter);

      const distanceFromCenter = (Math.abs(q) + Math.abs(r) + Math.abs(-q - r)) / 2;
      if (distanceFromCenter > maxDistanceFromCenter) continue;

      const startTile = this.scene.map.getTile(q, r);
      if (!startTile) continue;

      if (!['grass', 'light_grass'].includes(startTile.biome)) continue;

      // Check if position is free
      if (this.gameWorld.getBuildingAt(q, r)) continue;

      // Check for resources within 20 tiles
      const nearbyResources = this.findNearbyResources(q, r, 20);

      if (nearbyResources.wood.length > 0 && nearbyResources.stone.length > 0 && nearbyResources.food.length > 0) {
        console.log(`✅ ${this.name}: Found valid start at [${q}, ${r}]`);
        return { coords: [q, r], resources: nearbyResources };
      }
    }

    console.error(`❌ ${this.name}: Failed to find valid start after ${attempts} attempts`);
    return null;
  }

  findNearbyResources(startQ, startR, range) {
    const resources = { wood: [], stone: [], food: [], ore: [] };

    for (let radius = 1; radius <= range; radius++) {
      for (let q = startQ - radius; q <= startQ + radius; q++) {
        for (let r = startR - radius; r <= startR + radius; r++) {
          const distance = Math.abs(q - startQ) + Math.abs(r - startR) + Math.abs(-q - r + startQ + startR);
          if (distance / 2 !== radius) continue;

          const tile = this.scene.map.getTile(q, r);
          if (!tile) continue;

          // Check for resource potential
          if (['forest', 'pine_forest', 'dark_forest'].includes(tile.biome)) {
            resources.wood.push([q, r]);
          }
          if (['mountain', 'snow_mountain', 'hills'].includes(tile.biome)) {
            resources.stone.push([q, r]);
            if (tile.oreType) {
              resources.ore.push({ coords: [q, r], type: tile.oreType });
            }
          }
          if (['grass', 'light_grass'].includes(tile.biome)) {
            resources.food.push([q, r]);
          }
        }
      }
    }

    return resources;
  }

  placeStartingGatherers(nearbyResources) {
    // Place initial gathering buildings
    if (nearbyResources.wood.length > 0) {
      const [q, r] = nearbyResources.wood[0];
      this.build(LumberCamp, [q, r]);
    }

    if (nearbyResources.stone.length > 0) {
      const [q, r] = nearbyResources.stone[0];
      this.build(Quarry, [q, r]);
    }

    if (nearbyResources.food.length > 0) {
      const [q, r] = nearbyResources.food[0];
      this.build(FruitGatherer, [q, r]);
    }

    // Place ore gatherer if available
    if (nearbyResources.ore.length > 0) {
      const ore = nearbyResources.ore[0];
      const [q, r] = ore.coords;

      let GathererClass;
      switch (ore.type) {
        case 'coal': GathererClass = CoalGatherer; break;
        case 'iron': GathererClass = IronGatherer; break;
        case 'copper': GathererClass = CopperGatherer; break;
        case 'gold': GathererClass = GoldGatherer; break;
      }

      if (GathererClass) {
        this.build(GathererClass, [q, r]);
      }
    }
  }

  spawnBootstrapBuilder([townQ, townR]) {
    // Find empty adjacent tile
    const neighbors = this.scene.map.getNeighbors(townQ, townR);
    const validTile = neighbors.find(tile => {
      return tile && tile.isPassable() && !this.gameWorld.getUnitAt(tile.q, tile.r);
    });

    if (!validTile) {
      console.warn(`❌ ${this.name}: No space to spawn builder`);
      return;
    }

    // Spawn builder
    const builder = this.spawnUnit(Builder, [validTile.q, validTile.r]);
    if (!builder) return;

    // Find nearest forest
    const nearestForest = this.findNearestForest(validTile.q, validTile.r);
    if (nearestForest) {
      console.log(`🔨 ${this.name}: Builder heading to forest at [${nearestForest[0]}, ${nearestForest[1]}]`);
      builder.mission = { type: 'build', target: nearestForest, buildingClass: LumberCamp };
      builder.moveTo(nearestForest);
builder.onArrive = () => {
  console.log(`🏗️ ${this.name}: Builder arrived, finding adjacent build site`);
  const buildSite = this.findAdjacentBuildSite(nearestForest, 'LumberCamp');
  if (buildSite) {
    console.log(`🏗️ ${this.name}: Building LumberCamp at [${buildSite[0]}, ${buildSite[1]}]`);
    this.build(LumberCamp, buildSite);
  } else {
    console.warn(`❌ ${this.name}: Builder couldn't find valid build site near forest`);
  }
};
    }
  }

  findNearestForest(startQ, startR) {
    const maxRange = 30;
    const forestBiomes = ['forest', 'pine_forest', 'dark_forest'];

    for (let range = 1; range <= maxRange; range++) {
      for (let q = startQ - range; q <= startQ + range; q++) {
        for (let r = startR - range; r <= startR + range; r++) {
          const distance = Math.abs(q - startQ) + Math.abs(r - startR) + Math.abs(-q - r + startQ + startR);
          if (distance / 2 !== range) continue;

          const tile = this.scene.map.getTile(q, r);
          if (tile && forestBiomes.includes(tile.biome) && !this.gameWorld.getBuildingAt(q, r)) {
            return [q, r];
          }
        }
      }
    }

    console.warn(`❌ ${this.name}: No forest found within ${maxRange} tiles`);
    return null;
  }

  /**
   * Find a valid adjacent tile to build on near a resource
   */
  findAdjacentBuildSite(resourceCoords, buildingType) {
    const [resourceQ, resourceR] = resourceCoords;
    
    // Get all adjacent tiles to the resource
    const neighbors = this.scene.map.getNeighbors(resourceQ, resourceR);
    
    // Find the first valid build site
    for (const neighbor of neighbors) {
      if (!neighbor) continue;
      
      const [q, r] = [neighbor.q, neighbor.r];
      
      // Check if this tile is buildable and empty
      if (neighbor.isBuildable() && !this.gameWorld.getBuildingAt(q, r) && !this.gameWorld.getUnitAt(q, r)) {
        // For gathering buildings, make sure we can actually build this type here
        if (buildingType === 'LumberCamp') {
          // LumberCamp should be adjacent to forest, not necessarily ON forest
          console.log(`✅ Found build site for ${buildingType} at [${q}, ${r}] adjacent to forest`);
          return [q, r];
        }
        
        // For other building types, add validation as needed
        console.log(`✅ Found build site for ${buildingType} at [${q}, ${r}]`);
        return [q, r];
      }
    }
    
    console.warn(`❌ No valid build site found adjacent to [${resourceQ}, ${resourceR}] for ${buildingType}`);
    return null;
  }

  getStatus() {
    return {
      name: this.name,
      color: this.color,
      resources: { ...this.resources },
      population: this.population,
      buildings: this.buildings.length,
      units: this.units.length
    };
  }
}

window.Player = Player;