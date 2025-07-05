// src/buildings/Building.js - Refactored self-contained version

const BUILDING_SPRITES = {
  // Founding Buildings
  'TownCenter': { key: 'TownCenter', frame: 0 },
  'Village': { key: 'Village', frame: 0 },
  'City': { key: 'Village', frame: 0 }, // Reuse village for now
  
  // Population Buildings
  'House': { key: 'House', frame: 0 },
  'LogCabin': { key: 'LogCabin', frame: 0 },
  
  // Training Buildings
  'Barracks': { key: 'Barracks', frame: 0 },
  'Stables': { key: 'Stables', frame: 0 },
  'Workshop': { key: 'Workshop', frame: 0 },
  
  // Gathering Buildings
  'FruitGatherer': { key: 'FruitGatherer', frame: 0 },
  'SeedsGatherer': { key: 'SeedsGatherer', frame: 0 },
  'Farmland': { key: 'FruitGatherer', frame: 0 }, // Reuse FruitGatherer
  'LumberCamp': { key: 'LumberCamp', frame: 0 },
  'Quarry': { key: 'Quarry', frame: 0 },
  'CoalGatherer': { key: 'Quarry', frame: 0 }, // Reuse Quarry for ore
  'IronGatherer': { key: 'Quarry', frame: 0 },
  'CopperGatherer': { key: 'Quarry', frame: 0 },
  'GoldGatherer': { key: 'Quarry', frame: 0 },
  
  // Crafting Buildings
  'Smelter': { key: 'Smelter', frame: 0 },
  'Bakery': { key: 'Bakery', frame: 0 },
  'Blacksmith': { key: 'Blacksmith', frame: 0 }
};

/**
 * Self-contained Building class that manages its own sprite and position
 */
class Building {
  constructor({
    type,
    category,
    owner,
    coords,
    scene,
    costs = {},
    hitpoints = 100,
    buildTime = 1,
    footprint = 1,
    resourcetype = null,
    resourceamount = 0
  }) {
    this.type = type;
    this.category = category;
    this.owner = owner;
    this.coords = coords;           // [q, r] - single source of truth
    this.scene = scene;
    this.costs = costs;
    this.hitpoints = hitpoints;
    this.buildTime = buildTime;
    this.completed = false;
    this.ticksBuild = 0;
    this.footprint = footprint;
    this.resourcetype = resourcetype;
    this.resourceamount = resourceamount;
    
    // Set sprite info and create sprite
    this.setSpriteInfo();
if (this.scene) {
  this.createSprite();
}
  }

  setSpriteInfo() {
    const spriteInfo = BUILDING_SPRITES[this.type];
    if (spriteInfo) {
      this.spriteKey = spriteInfo.key;
      this.spriteFrame = spriteInfo.frame;
    } else {
      console.warn(`❌ No sprite mapping for building type: ${this.type}`);
      this.spriteKey = 'monsters_sheet';
      this.spriteFrame = 87; // Default to rock golem
    }
  }

 createSprite() {
  if (!this.scene) return;

  const [x, y] = hexToPixel(this.coords[0], this.coords[1]);
  
  try {
    // Create sprite without heavy tint, scaled down to fit hex
    this.sprite = this.scene.add.sprite(x, y, this.spriteKey, this.spriteFrame)
      .setOrigin(0.5, 0.5)
      .setDepth(2)
      .setScale(0.8); // Scale down from 64x64 to ~58x58 to fit in 72x72 hex
    
    // Add colored border/indicator instead of tinting
    this.teamIndicator = this.scene.add.circle(x + 25, y - 25, 6, this.owner.color)
      .setDepth(3);
    
  } catch (error) {
    // fallback...
  }
}

  /**
   * Check if this building can be placed at target coordinates
   */
  static canPlaceAt(buildingClass, q, r, scene, owner) {
    const tile = scene.map.getTile(q, r);
    if (!tile || !tile.isBuildable()) return false;
    
    // Check for other buildings at this position
    const otherBuilding = owner.gameWorld.getBuildingAt(q, r);
    if (otherBuilding) return false;
    
    // Create temporary instance to check terrain requirements
    const tempBuilding = new buildingClass([q, r]);
    
    // Category-specific placement rules
    if (tempBuilding.category === 'Gathering') {
      return Building.validateResourcePlacement(tempBuilding, tile);
    } else {
      // Non-gathering buildings need flat buildable terrain
      const buildableTerrains = ['grass', 'light_grass', 'rough'];
      return buildableTerrains.includes(tile.biome);
    }
  }

  /**
   * Validate resource gathering building placement
   */
  static validateResourcePlacement(building, tile) {
    const resourceType = building.resourcetype;
    const biome = tile.biome;
    
    const resourceBiomes = {
      'wood': ['forest', 'pine_forest', 'dark_forest'],
      'stone': ['mountain', 'snow_mountain', 'hills'],
      'food': ['grass', 'light_grass'],
      'seeds': ['grass', 'light_grass'],
      'coal': ['mountain', 'snow_mountain'],
      'iron': ['mountain', 'snow_mountain'],
      'copper': ['mountain', 'snow_mountain'], 
      'gold': ['mountain', 'snow_mountain']
    };
    
    const requiredBiomes = resourceBiomes[resourceType];
    if (!requiredBiomes) return true;
    
    // Check basic biome requirement
    if (!requiredBiomes.includes(biome)) {
      console.warn(`❌ ${building.type} requires ${requiredBiomes.join('/')} but tile is ${biome}`);
      return false;
    }
    
    // For ore, also check for specific deposit
    if (['coal', 'iron', 'copper', 'gold'].includes(resourceType)) {
      if (tile.oreType !== resourceType) {
        console.warn(`❌ ${building.type} requires ${resourceType} deposit but tile has ${tile.oreType || 'none'}`);
        return false;
      }
    }
    
    //console.log(`✅ ${building.type} placement valid on ${biome}${tile.oreType ? ` (${tile.oreType})` : ''}`);
    return true;
  }

  /**
   * Advance building construction
   */
  tickBuild() {
    if (this.completed) return;
    
    this.ticksBuild++;
    if (this.ticksBuild >= this.buildTime) {
      this.completed = true;
      console.log(`🏗️ ${this.type} construction completed!`);
      
      // Visual feedback for completion (could add a different tint/effect)
      if (this.sprite) {
        this.sprite.setAlpha(1.0); // Full opacity when complete
      }
    } else {
      // Show construction progress with transparency
      if (this.sprite) {
        const progress = this.ticksBuild / this.buildTime;
        this.sprite.setAlpha(0.5 + (progress * 0.5)); // 50% to 100% opacity
      }
    }
  }

  /**
   * Produce resources (for gathering buildings)
   */
  gatherUpdate() {
    if (!this.completed || !this.resourcetype) return;
    
    // Validate still on correct terrain
    const tile = this.scene.map.getTile(this.coords[0], this.coords[1]);
    if (tile && Building.validateResourcePlacement(this, tile)) {
      this.owner.addResources(this.resourcetype, this.resourceamount);
      //console.log(`🌾 ${this.type} produced ${this.resourceamount} ${this.resourcetype} for ${this.owner.name}`);
    }
  }

  /**
   * Remove this building from the game
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    
    // Remove from owner's building list
    const index = this.owner.buildings.indexOf(this);
    if (index >= 0) {
      this.owner.buildings.splice(index, 1);
    }
  }

  takeDamage(amount) {
    this.hitpoints = Math.max(0, this.hitpoints - amount);
    if (this.hitpoints <= 0) {
      this.destroy();
    }
  }

  isDestroyed() {
    return this.hitpoints <= 0;
  }
}

window.Building = Building;