// src/player.js

class Player {
  constructor(name, color) {
    this.name       = name;
    this.color      = color;      // tint color, e.g. 0xff0000
    this.resources  = {
      food:   0,
      wood:   0,
      stone:  0,
      iron:   0,
      copper: 0,
      coal: 0,
      gold:   0,
      coins:  0
    };
    this.buildings  = [];         // Building instances (in‐progress or complete)
    this.units      = [];         // Unit instances
    this.population = 0;          // cap minus used (managed elsewhere)
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

  /** True if player has ≥ each cost[k]. */
  canAfford(costs) {
    return Object.entries(costs).every(
      ([k, v]) => (this.resources[k] || 0) >= v
    );
  }

  /** Deduct costs if affordable; return true on success. */
  spendResources(costs) {
    if (!this.canAfford(costs)) return false;
    for (let k in costs) {
      this.resources[k] -= costs[k];
    }
    return true;
  }

    /**
   * Try to place a building of class BuildingClass at [tx,ty].
   * Deducts resources, registers ownership, updates map & sprite.
   * @param {class} BuildingClass
   * @param {[number,number]} coords  [tx, ty]
   * @param {Phaser.Scene} scene
   * @returns {boolean} success
   */
    // src/player.js
build(BuildingClass, [tx, ty], scene) {
  const map  = scene.map;
  const tile = map.getTile(tx, ty);
  if (!tile || !tile.isEmpty()) return false;

  // 1) instantiate so we can inspect category & resourcetype
  const building = new BuildingClass([tx, ty]);
  const costs    = building.costs;

  // 2) tile‐type gating
  if (building.category !== 'Gathering') {
    // only pure grass/sand, no overlays
    if (!['grass','sand'].includes(tile.tiletype)
     || ['forest','mountain'].includes(tile.biome)
     || tile.biome.endsWith('_deposit')) {
      return false;
    }
  } else {
    // Gathering must match its resource
    const R = building.resourcetype;
    if (R === 'wood' && tile.biome !== 'forest')      return false;
    if (R === 'stone' && tile.biome !== 'mountain')   return false;
    if (['coal','iron','copper','gold'].includes(R)
        && tile.biome !== `${R}_deposit`)             return false;
    // e.g. food/seeds can go anywhere—or tighten as you wish
  }

  // 3) cost check & deduct
  for (let [res, amt] of Object.entries(costs)) {
    if ((this.resources[res] || 0) < amt) return false;
    this.resources[res] -= amt;
  }

  // 4) register & place
  building.owner = this;
  this.buildings.push(building);
  map.placeBuildingState(building, tx, ty);
  map.placeBuildingSprite(building, tx, ty, this.color);

  return true;
}


  
  

  /**
   * Called each tick to:
   * 1) Gather resources
   * 2) Train units
   * 3) Consume upkeep
   */
  tick() {
    // 1) Produce from Gathering buildings
    this.buildings.forEach(b => {
      if (b.category === 'Gathering' && b.completed) {
        b.gatherUpdate();
      }
    });

    /* // 2) Train units in Training buildings
    this.buildings.forEach(b => {
      if (b.category === 'Training' && b.completed) {
        const unit = b.tryTrain();
        if (unit) this.addUnit(unit);
      }
    }); */

    // 3) Food upkeep: 1 per pop-used
    const upkeep = Math.max(0, this.population - this.units.length);
    if (upkeep > 0) {
      this.resources.food = Math.max(0, this.resources.food - upkeep);
    }

     // advance all building constructions
     for (let b of this.buildings) {
      b.tickBuild();
    }
    // advance all unit movements
    for (let u of this.units) {
      if (typeof u.update === 'function') {
        u.update();
      }
    }
    
  }

  /** Register a finished unit. */
  addUnit(unit) {
    this.units.push(unit);
    unit.owner = this;
  }

  /**
   * Move a unit; simple range check omitted.
   * @param {Unit} unit
   * @param {[x,y]} target
   */
  moveUnit(unit, target) {
    if (unit.movementPoints <= 0) return false;
    unit.coords = target;
    unit.movementPoints--;
    return true;
  }

  /**
   * Simple probabilistic attack.
   * @param {Unit} attacker
   * @param {Unit} defender
   */
  attack(attacker, defender) {
    const atk  = attacker.attackPower;
    const def  = defender.defensePower;
    const roll = Math.random();
    if (roll < atk / (atk + def)) {
      defender.takeDamage(atk);
      if (defender.isDestroyed()) {
        // remove from its owner
        const idx = defender.owner.units.indexOf(defender);
        if (idx >= 0) defender.owner.units.splice(idx, 1);
      }
      return true;
    }
    return false;
  }


    /**
/**
 * Pick a random 2×2 pure-grass patch (no overlays)
 * with ≥4 surrounding grass tiles.
 * @param {TileMap} map
 * @returns {[number,number]|null}
 */
// Add this method to Player class
findValidStartLocation(map) {
  const maxDistanceFromCenter = 100;
  const attempts = 200;
  
  console.log(`🔍 ${this.name}: Searching for start location...`);
  
  for (let i = 0; i < attempts; i++) {
    const q = Phaser.Math.Between(-maxDistanceFromCenter, maxDistanceFromCenter);
    const r = Phaser.Math.Between(-maxDistanceFromCenter, maxDistanceFromCenter);
    
    const distanceFromCenter = (Math.abs(q) + Math.abs(r) + Math.abs(-q-r)) / 2;
    if (distanceFromCenter > maxDistanceFromCenter) continue;
    
    const startTile = map.getTile(q, r);
    if (!startTile) continue;
    
    if (!['grass', 'light_grass'].includes(startTile.biome)) continue;
    
    // Check for 1x1 clear area
    const tile = map.getTile(q, r);
    let validArea = tile && tile.isEmpty() && ['grass', 'light_grass'].includes(tile.biome);
    
    if (!validArea) continue;
    
    // Check for resources within 20 tiles
    const nearbyResources = this.findNearbyResources(map, q, r, 20);
    
    console.log(`  Attempt ${i}: [${q}, ${r}] - Wood: ${nearbyResources.wood.length}, Stone: ${nearbyResources.stone.length}, Food: ${nearbyResources.food.length}`);
    
    // Need at least wood, stone, and food potential  
    if (nearbyResources.wood.length > 0 && nearbyResources.stone.length > 0 && nearbyResources.food.length > 0) {
      console.log(`✅ ${this.name}: Found valid start at [${q}, ${r}]`);
      return { coords: [q, r], resources: nearbyResources };
    }
  }
  
  console.error(`❌ ${this.name}: Failed to find valid start after ${attempts} attempts`);
  return null;
}

findNearbyResources(map, startQ, startR, range) {
  const resources = { wood: [], stone: [], food: [], ore: [] };
  
  // Search in expanding rings
  for (let radius = 1; radius <= range; radius++) {
    for (let q = startQ - radius; q <= startQ + radius; q++) {
      for (let r = startR - radius; r <= startR + radius; r++) {
        // Skip if not on ring edge
        const distance = Math.abs(q - startQ) + Math.abs(r - startR) + Math.abs(-q - r + startQ + startR);
        if (distance / 2 !== radius) continue;
        
        const tile = map.getTile(q, r);
        if (!tile) continue;
        
        // Check for resource potential
        if (['forest', 'pine_forest', 'dark_forest'].includes(tile.biome)) {
          resources.wood.push([q, r]);
        }
        if (['mountain', 'snow_mountain', 'hills'].includes(tile.biome)) {
          resources.stone.push([q, r]);
          if (tile.oreType) {
            resources.ore.push({coords: [q, r], type: tile.oreType});
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
  
    /**
     * Full CPU bootstrap:
     * – pick start, save to registry
     * – build TownCenter + Workshop
     * – spawn a builder, send it to a resource, build gatherer
     */
    // src/player.js
    initializeBase(scene) {
  // Find valid start location
  const startInfo = this.findValidStartLocation(scene.map);
  if (!startInfo) {
    console.error(`❌ ${this.name}: No valid start location found`);
    return;
  }
  
  const [startQ, startR] = startInfo.coords;
  this.startCoords = [startQ, startR];
  scene.registry.set(`${this.name}Start`, [startQ, startR]);
  
  console.log(`🏛️ ${this.name} TOWN CENTER at [${startQ}, ${startR}]`);
  
  // Build TownCenter
  this.build(TownCenter, [startQ, startR], scene);
  
  // Place guaranteed gathering buildings
  this.placeStartingGatherers(scene, startInfo.resources);
}

placeStartingGatherers(scene, nearbyResources) {
  // Place one of each gathering building type within 20 tiles
  if (nearbyResources.wood.length > 0) {
    const [q, r] = nearbyResources.wood[0];
    this.build(LumberCamp, [q, r], scene);
  }
  
  if (nearbyResources.stone.length > 0) {
    const [q, r] = nearbyResources.stone[0];
    this.build(Quarry, [q, r], scene);
  }
  
  // Place a farm on nearby grass
  if (nearbyResources.food.length > 0) {
    const [q, r] = nearbyResources.food[0];
    this.build(FruitGatherer, [q, r], scene); // or whatever your food building is
  }
  
  // Place ore gatherer if available
  if (nearbyResources.ore.length > 0) {
    const ore = nearbyResources.ore[0];
    const [q, r] = ore.coords;
    
    // Choose appropriate gatherer for ore type
    let GathererClass;
    switch (ore.type) {
      case 'coal': GathererClass = CoalGatherer; break;
      case 'iron': GathererClass = IronGatherer; break;
      case 'copper': GathererClass = CopperGatherer; break;
      case 'gold': GathererClass = GoldGatherer; break;
    }
    
    if (GathererClass) {
      this.build(GathererClass, [q, r], scene);
    }
  }
}
    

    

  /** Get a compact status for UI. */
  getStatus() {
    return {
      name:       this.name,
      color:      this.color,
      resources:  { ...this.resources },
      population: this.population,
      buildings:  this.buildings.length,
      units:      this.units.length
    };
  }

  /** Accessors if needed elsewhere */
  getBuildings() { return this.buildings.slice(); }
  getUnits()     { return this.units.slice(); }
}

// expose globally
window.Player = Player;
