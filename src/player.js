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
findStartLocation(map) {
  const N   = GRID_SIZE;
  const max = N * N;

  // Offsets for counting neighbors around a 2×2 block
  const adj = [
    [ -1,  0 ], [ -1,  1 ],
    [  2,  0 ], [  2,  1 ],
    [  0, -1 ], [  1, -1 ],
    [  0,  2 ], [  1,  2 ]
  ];

  // 1) Random sampling
  for (let i = 0; i < max; i++) {
    const x = Phaser.Math.Between(0, N - 2);
    const y = Phaser.Math.Between(0, N - 2);

    // a) 2×2 block must be pure grass + empty
    const block = [
      [x  , y  ], [x+1, y  ],
      [x  , y+1], [x+1, y+1]
    ];
    const ok = block.every(([tx,ty]) => {
      const t = map.getTile(tx, ty);
      return t
          && t.tiletype === 'grass'
          && t.biome     === 'grass'
          && t.isEmpty();
    });
    if (!ok) continue;

    // b) count grass neighbors
    let grassCount = 0;
    for (let [dx,dy] of adj) {
      const t = map.getTile(x + dx, y + dy);
      if (t && t.tiletype === 'grass') grassCount++;
    }
    if (grassCount < 4) continue;

    return [x, y];
  }

  // 2) Deterministic fallback
  for (let y = 0; y < N - 1; y++) {
    for (let x = 0; x < N - 1; x++) {
      const block = [[x,y],[x+1,y],[x,y+1],[x+1,y+1]];
      if (!block.every(([tx,ty]) => {
        const t = map.getTile(tx, ty);
        return t
            && t.tiletype === 'grass'
            && t.biome     === 'grass'
            && t.isEmpty();
      })) continue;

      let grassCount = adj.reduce((count, [dx,dy]) => {
        const t = map.getTile(x + dx, y + dy);
        return count + (t && t.tiletype === 'grass');
      }, 0);
      if (grassCount < 4) continue;

      return [x, y];
    }
  }

  return null;
}

  
    /**
     * Full CPU bootstrap:
     * – pick start, save to registry
     * – build TownCenter + Workshop
     * – spawn a builder, send it to a resource, build gatherer
     */
    // src/player.js
    initializeBase(scene) {
      const map   = scene.map;
      const start = this.findStartLocation(map);
      if (!start) return;
      this.startCoords = start;
      scene.registry.set(`${this.name}Start`, start);
    
      // 1) TownCenter
      this.build(TownCenter, start, scene);
    
      // 2) Workshop — try several offsets until one works
      const adjOffsets = [
        [2,0], [-2,0], [0,2], [0,-2],
        [1,0], [-1,0], [0,1], [0,-1]
      ];
      let wsCoords = null;
      for (let [dx,dy] of adjOffsets) {
        const pos = [ start[0] + dx, start[1] + dy ];
        if (this.build(Workshop, pos, scene)) {
          wsCoords = pos;
          break;
        }
      }
      if (!wsCoords) {
        console.warn('No valid Workshop spot for', this.name);
        return;
      }
    
      // 3) Grab your Workshop instance
      const ws = this.buildings.find(b =>
        b instanceof Workshop &&
        b.coords[0] === wsCoords[0] &&
        b.coords[1] === wsCoords[1]
      );
      if (!ws) {
        console.warn('No Workshop for', this.name);
        return;
      }

  // 4) When it finishes, spawn & send builder
  ws.onComplete = () => {
    console.log(`${this.name}: Workshop complete at`, wsCoords);
    const builder = ws.spawnUnit(Builder, scene);
    if (!builder) {
      console.warn(`${this.name}: spawnUnit(Builder) failed`);
      return;
    }
  
    // find the resource tile as before
    const allTiles = map.tiles.flat();
    const target   = allTiles
      .filter(t => ['forest','mountain','coal_deposit','iron_deposit','copper_deposit','gold_deposit']
        .includes(t.biome))
      .reduce((best, t) => {
        const d = Math.abs(t.xcoord - builder.coords[0])
                + Math.abs(t.ycoord - builder.coords[1]);
        return d < best.d ? { t, d } : best;
      }, { t: null, d: Infinity }).t;
    if (!target) {
      console.warn(`${this.name}: no resource tile found`);
      return;
    }
  
    console.log(`${this.name}: target at`, target.xcoord, target.ycoord, target.biome);
  
    // ── NEW: pick an adjacent stand‐tile ──
    // ── pick the neighbor closest to the builder’s spawn spot ──
const neighOffsets = [[1,0],[-1,0],[0,1],[0,-1]];
// gather all valid tiles
const standTiles = neighOffsets
  .map(([dx,dy]) => map.getTile(target.xcoord + dx, target.ycoord + dy))
  .filter(t => t && t.isPassable() && t.isEmpty());

if (!standTiles.length) {
  console.warn(`${this.name}: no adjacent tile to stand on`);
  return;
}

// pick the one with minimal manhattan distance from where the builder started
let best = { t: null, d: Infinity };
for (let t of standTiles) {
  const d = Math.abs(t.xcoord - builder.coords[0])
          + Math.abs(t.ycoord - builder.coords[1]);
  if (d < best.d) best = { t, d };
}

const standPos = [ best.t.xcoord, best.t.ycoord ];
console.log(`${this.name}: moving builder to best adjacent`, standPos);
builder.moveTo(standPos, scene);

  
    builder.onArrive = () => {
      const b  = target.biome;
      let GathererClass;
    
      if (b === 'mountain') {
        // true mountain
        GathererClass = Quarry;
      } else if (b.endsWith('_deposit')) {
        // rock/ore deposits
        switch (b) {
          case 'coal_deposit':   GathererClass = CoalGatherer;   break;
          case 'iron_deposit':   GathererClass = IronGatherer;   break;
          case 'copper_deposit': GathererClass = CopperGatherer; break;
          case 'gold_deposit':   GathererClass = GoldGatherer;   break;
        }
      } else if (b === 'forest') {
        // wood
        GathererClass = LumberCamp;
      } else {
        console.warn(`Unknown biome '${b}'—defaulting to LumberCamp`);
        GathererClass = LumberCamp;
      }
    
      builder.build(GathererClass, [ target.xcoord, target.ycoord ], scene);
    };
  };
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
