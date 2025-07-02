// src/buildings/Building.js

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

    /** NEW: spawn a unit on a free tile next to this building */
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
