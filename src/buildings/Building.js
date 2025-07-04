// src/buildings/Building.js


const BUILDING_SPRITES = {
  // Founding Buildings - use powerful creatures
  'TownCenter': { key: 'monsters_sheet', frame: 74 },    // Blue elephant-like creature
  'Village': { key: 'monsters_sheet', frame: 50 },       // Lich/skeleton
  'City': { key: 'monsters_sheet', frame: 132 },         // Angel (bottom area)
  
  // Population Buildings - use smaller/peaceful creatures  
  'House': { key: 'monsters_sheet', frame: 84 },         // Centaur
  'LogCabin': { key: 'monsters_sheet', frame: 96 },      // Forest creature
  
  // Training Buildings - use military monsters
  'Barracks': { key: 'monsters_sheet', frame: 3 },       // Orc warrior
  'Stables': { key: 'monsters_sheet', frame: 84 },       // Centaur (horse-like)
  'Workshop': { key: 'monsters_sheet', frame: 87 },      // Rock golem
  
  // Gathering Buildings
  'FruitGatherer': { key: 'monsters_sheet', frame: 96 }, // Nature creature
  'SeedsGatherer': { key: 'monsters_sheet', frame: 97 }, // Plant creature  
  'Farmland': { key: 'monsters_sheet', frame: 144 },     // Mushroom creature
  'LumberCamp': { key: 'monsters_sheet', frame: 87 },    // Rock golem
  'Quarry': { key: 'monsters_sheet', frame: 87 },        // Rock golem
  'CoalGatherer': { key: 'monsters_sheet', frame: 37 },  // Fire demon
  'IronGatherer': { key: 'monsters_sheet', frame: 87 },  // Rock golem
  'CopperGatherer': { key: 'monsters_sheet', frame: 87 }, // Rock golem
  'GoldGatherer': { key: 'monsters_sheet', frame: 74 },  // Blue creature (valuable)
  
  // Crafting Buildings
  'Smelter': { key: 'monsters_sheet', frame: 37 },       // Fire demon
  'Bakery': { key: 'monsters_sheet', frame: 144 },       // Mushroom
  'Blacksmith': { key: 'monsters_sheet', frame: 87 }     // Rock golem
};

class Building {
  constructor({
    type,
    category,
    coords,
    costs = {},
    hitpoints = 100,
    buildTime = 1,
    footprint = 1,
    resourcetype = null,        // ← pull these from the subclass opts
    resourceamount = 0
  }) {
    this.type           = type;
    this.category       = category;
    this.coords         = coords;
    this.costs          = costs;
    this.hitpoints      = hitpoints;
    this.buildTime      = buildTime;
    this.completed      = false;
    this.ticksBuild     = 0;
    this.onComplete     = null;
    this.footprint      = footprint;
    this.spriteKey      = null;
    this.spriteFrame    = 0;
    this.resourcetype   = resourcetype;   // ← now set from subclass
    this.resourceamount = resourceamount;  // ← ditto
    this.owner          = null;
 // Set sprite info from mapping
  const spriteInfo = BUILDING_SPRITES[type];
  if (spriteInfo) {
    this.spriteKey = spriteInfo.key;
    this.spriteFrame = spriteInfo.frame;
    console.log(`📋 ${type} sprite: ${this.spriteKey} frame ${this.spriteFrame}`);
  } else {
    console.warn(`❌ No sprite mapping for building type: ${type}`);
    this.spriteKey = 'monsters_sheet';
    this.spriteFrame = 87; // Default to rock golem
  }
    
  }

  
  tickBuild() {
    if (this.completed) return;
      this.ticksBuild++;
      if (this.ticksBuild >= this.buildTime) {
        this.completed = true;
        if (typeof this.onComplete === 'function'){
          this.onComplete();
      }
    }
  }

  takeDamage(amount) {
    this.hitpoints = Math.max(0, this.hitpoints - amount);
  }

  isDestroyed() {
    return this.hitpoints <= 0;
  }

   
    spawnUnit(UnitClass, scene) {
      if (!this.completed) return null;
  
      const [bx, by] = this.coords;
      const size     = this.footprint;
      let spawnTile  = null;
  
      // 1) search an area from (bx-1,by-1) to (bx+size, by+size)
      outer:
      for (let dy = -1; dy <= size; dy++) {
        for (let dx = -1; dx <= size; dx++) {
          const tx = bx + dx;
          const ty = by + dy;
          const t  = scene.map.getTile(tx, ty);
          if (t && t.isEmpty() && t.isPassable()) {
            spawnTile = t;
            break outer;
          }
        }
      }
      if (!spawnTile) return null;
  
      // 2) instantiate the unit on that tile
      const x = spawnTile.xcoord;
      const y = spawnTile.ycoord;
      const unit = new UnitClass({ coords: [x, y] });
      unit.owner = this.owner;
  
      // 3) claim map‐state & draw
      spawnTile.placeUnit(unit);
      scene.map.markForUpdate(spawnTile);
      unit.sprite = scene.map.placeUnitSprite(unit, x, y, this.owner.color);
  
      // 4) register on the player
      this.owner.units.push(unit);
      return unit;
    }

    gatherUpdate(){
      if (!this.resourcetype) return;
      this.owner.addResources(this.resourcetype, this.resourceamount);
    }
  
}

window.Building = Building;
