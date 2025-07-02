// src/Map.js

/**
 * One map‐tile at grid coords (col,row).
 */
class Tile {
    /**
     * @param {number} xcoord   Column index (0…GRID_SIZE−1)
     * @param {number} ycoord   Row index    (0…GRID_SIZE−1)
     * @param {string} tiletype e.g. 'grass','sand','water'
     * @param {Phaser.GameObjects.Sprite} sprite  Already‐created ground sprite
     */
    constructor(xcoord, ycoord, tiletype, sprite) {
      this.xcoord   = xcoord;
      this.ycoord   = ycoord;
      this.tiletype = tiletype;
      this.sprite   = sprite;
      this.building = null;
      this.unit     = null;
      this.needsUpdating = false;
    }
  
    get pixelX() { return this.xcoord * TILE_SIZE; }
    get pixelY() { return this.ycoord * TILE_SIZE; }
  
    /** True if no building or unit on this tile */
    isEmpty() {
      return this.building === null && this.unit === null;
    }
  
    /** Try placing a unit here; false if occupied */
    placeUnit(unit) {
      if (!this.isEmpty()) return false;
      this.unit = unit;
      unit.coords = [this.xcoord, this.ycoord];
      return true;
    }

      /** Remove any unit but keep buildings intact */
  clearUnit() {
    this.unit = null;
  }

  
    /** Remove any occupant */
    clear() {
      this.building = null;
      this.unit     = null;
    }
  
    /** True if this terrain can ever be built on (e.g. not water). */
    isBuildable() {
      return this.tiletype !== "water";
    }
  
    /** True if a unit may traverse this tile (e.g. land only). */
    isPassable() {
        return this.tiletype !== 'water'
        && !['forest','mountain'].includes(this.biome)
        && !this.biome.endsWith('_deposit');
    }

    isSailable(){
        return this.tiletype === "sand" || this.tiletype === "water";
    }

  
    /** Returns the four orthogonal neighbors from a 2D tilemap array. */
    neighbors(tilemap) {
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      return dirs
        .map(([dx,dy]) => tilemap[this.ycoord+dy]?.[this.xcoord+dx])
        .filter(t => t);
    }
  
    /**
     * Tint the ground sprite (for “valid placement” preview).
     * @param {number} color  e.g. 0x00ff00
     * @param {number} alpha  e.g. 0.3
     */
    highlight(color, alpha = 0.3) {
      this.sprite.setTintFill(color).setAlpha(alpha);
    }
  
    /** Remove any tint/highlight. */
    clearHighlight() {
      this.sprite.clearTint().setAlpha(1);
    }

    get coords() {
        return [ this.xcoord, this.ycoord ];
      }
  }
  
  
  /**
   * Manages a GRID_SIZE×GRID_SIZE of Tiles,
   * generates terrain via Simplex noise + rivers + shore + smoothing,
   * then applies forests, mountains, deposits, and instantiates Tiles.
   */
  // src/Map.js

// src/Map.js
/* global Phaser, SimplexNoise, TILE_SIZE, GRID_SIZE */

class TileMap {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
      this.scene         = scene;
      this.simplex       = new SimplexNoise();
      this.tilesToUpdate = new Set();
  
      // one big static canvas for ground + overlays
      this.rt = scene.add.renderTexture(
        0, 0,
        GRID_SIZE * TILE_SIZE,
        GRID_SIZE * TILE_SIZE
      ).setDepth(0);
  
      // placeholder for our Tile instances
      this.tiles = Array.from({ length: GRID_SIZE }, () =>
        Array(GRID_SIZE).fill(null)
      );
  
      this.generateBiomes();
    }
  
    /** Mark a tile for per-tick logic */
    markForUpdate(tile) {
      if (!tile.needsUpdating) {
        tile.needsUpdating = true;
        this.tilesToUpdate.add(tile);
      }
    }
  
    /** Remove a tile from the update set */
    unmarkUpdate(tile) {
      if (tile.needsUpdating) {
        tile.needsUpdating = false;
        this.tilesToUpdate.delete(tile);
      }
    }
  
    /** Look up a Tile by grid coords */
    getTile(x, y) {
      return this.tiles[y]?.[x] ?? null;
    }
  
    /**
     * Reserve map‐state for a building footprint
     * and flag those tiles for redraw.
     */
    placeBuildingState(building, x, y) {
      for (let dx = 0; dx < building.footprint; dx++) {
        for (let dy = 0; dy < building.footprint; dy++) {
          const tile = this.getTile(x + dx, y + dy);
          if (!tile?.isBuildable() || !tile.isEmpty()) return false;
          tile.building = building;
          this.markForUpdate(tile);
        }
      }
      building.coords = [x, y];
      return true;
    }
  
    /** Spawn & tint a building sprite above the RT */
    placeBuildingSprite(building, x, y, tint) {
      const baseX = x * TILE_SIZE;
      const baseY = y * TILE_SIZE;
      if (building.footprint === 1) {
        return this.scene.add.sprite(baseX, baseY, building.spriteKey, building.spriteFrame)
          .setOrigin(0, 0).setDepth(2).setTint(tint);
      } else {
        const half = building.footprint * TILE_SIZE / 2;
        return this.scene.add.sprite(baseX + half, baseY + half, building.spriteKey, building.spriteFrame)
          .setOrigin(0.5, 0.5).setDepth(2).setTint(tint);
      }
    }
  
    /** Spawn & tint a unit sprite above the RT */
    placeUnitSprite(unit, x, y, tint) {
      return this.scene.add.sprite(
        x * TILE_SIZE,
        y * TILE_SIZE,
        unit.spriteKey,
        unit.spriteFrame
      )
      .setOrigin(0, 0)
      .setDepth(2)
      .setTint(tint);
    }
  
    /** Procedurally generate everything, draw into RT, and build Tiles */
    generateBiomes() {
      const N             = GRID_SIZE;
      const scale         = 50;
      const waterT        = 0.2;
      const mtnT          = 1;
      const shoreT        = waterT + 0.05;
      const rivers        = 3;
      const forestCount   = Phaser.Math.Between(20, 30);
      const mountainCount = Phaser.Math.Between(9, 18);
      const depositDefs   = [
        { name:'coal_deposit',   count:Phaser.Math.Between(24,60), size:[2,6], frame:0 },
        { name:'iron_deposit',   count:Phaser.Math.Between(16,48), size:[2,6], frame:2 },
        { name:'copper_deposit', count:Phaser.Math.Between(12,32), size:[2,6], frame:1 },
        { name:'gold_deposit',   count:Phaser.Math.Between(10,20), size:[2,4], frame:3 }
      ];
  
      // 0) clear out the renderTexture
      this.rt.clear();
  
      // 1) Height map
      const heightMap = Array.from({ length: N }, (_, y) =>
        Array.from({ length: N }, (_, x) =>
          (this.simplex.noise2D(x/scale, y/scale) + 1) * 0.5
        )
      );
  
      // 2) Initial terrain bands
      const typeMap = heightMap.map(row =>
        row.map(h => h < waterT ? 'water' : h > mtnT ? 'mountain' : 'grass')
      );
  
      // 3) Greedy rivers
      for (let i = 0; i < rivers; i++) {
        let x = Phaser.Math.Between(0, N-1),
            y = Phaser.Math.Between(0, N-1);
        if (heightMap[y][x] < mtnT) continue;
        while (true) {
          typeMap[y][x] = 'water';
          const nbrs = [];
          for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
            if (dx||dy) {
              const nx = x+dx, ny = y+dy;
              if (nx>=0&&nx<N&&ny>=0&&ny<N)
                nbrs.push({ x:nx, y:ny, h:heightMap[ny][nx] });
            }
          }
          const next = nbrs.reduce((a,b)=>a.h<b.h?a:b);
          if (typeMap[next.y][next.x]==='water') break;
          x = next.x; y = next.y;
        }
      }
  
      // 4) Wavy sand shoreline
      for (let y=0; y<N; y++) {
        for (let x=0; x<N; x++) {
          if (typeMap[y][x] !== 'water'
           && [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>typeMap[y+dy]?.[x+dx]==='water')
           && heightMap[y][x] + (Math.random()*0.2 - 0.1) < shoreT
          ) {
            typeMap[y][x] = 'sand';
          }
        }
      }
  
      // 5) Two‐pass CA smoothing on water/grass
      for (let pass=0; pass<2; pass++) {
        const copy = typeMap.map(r=>r.slice());
        for (let y=0; y<N; y++) {
          for (let x=0; x<N; x++) {
            const wcount = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
              .reduce((c,[dx,dy]) => c + (copy[y+dy]?.[x+dx]==='water'), 0);
            if (wcount >= 5)      typeMap[y][x] = 'water';
            else if (wcount <= 2) typeMap[y][x] = 'grass';
          }
        }
      }
  
      // 6+7) Random-walk forest & mountain blobs
      for (let i=0; i<forestCount;   i++) this._randomWalk(typeMap, 'forest',   10, 30);
      for (let i=0; i<mountainCount; i++) this._randomWalk(typeMap, 'mountain', 15, 40);
  
      // 8) Ore deposits
      for (let cfg of depositDefs) {
        for (let i=0; i<cfg.count; i++) {
          const cluster = [[Phaser.Math.Between(0,N-1), Phaser.Math.Between(0,N-1)]];
          const sz = Phaser.Math.Between(...cfg.size);
          for (let j=1; j<sz; j++) {
            const [px,py] = Phaser.Math.RND.pick(cluster);
            cluster.push([
              Phaser.Math.Clamp(px+Phaser.Math.Between(-1,1),0,N-1),
              Phaser.Math.Clamp(py+Phaser.Math.Between(-1,1),0,N-1)
            ]);
          }
          for (let [cx,cy] of cluster) {
            if (['grass','mountain'].includes(typeMap[cy][cx])) {
              typeMap[cy][cx] = cfg.name;
            }
          }
        }
      }
  
      // 9) Draw ground into RT + instantiate Tiles
      for (let y=0; y<N; y++) {
        for (let x=0; x<N; x++) {
          const b = typeMap[y][x];
          let key, frame, terrainType;
          switch (b) {
            case 'water':
              key = 'Shore'; frame = Phaser.Math.RND.pick([2,3,4]); terrainType = 'water';
              break;
            case 'sand':
              key = 'Shore'; frame = 0; terrainType = 'sand';
              break;
            default:
              key = 'Grass'; frame = Phaser.Math.RND.pick([1,2]); terrainType = 'grass';
          }
          // MUST use drawFrame here
          this.rt.drawFrame(key, frame, x*TILE_SIZE, y*TILE_SIZE);
  
          const tile = new Tile(x, y, terrainType, null);
          tile.biome = b;
          this.tiles[y][x] = tile;
        }
      }
  
      // 10) Draw overlays
      for (let y=0; y<N; y++) {
        for (let x=0; x<N; x++) {
          const b = typeMap[y][x];
          if (b==='forest' || b==='mountain' || b.endsWith('_deposit')) {
            let ovKey, ovFrame;
            if (b==='forest')      { ovKey='Trees';                 ovFrame=Phaser.Math.RND.pick([1,2,3]); }
            else if (b==='mountain'){ ovKey='trimmed_compact_sheet'; ovFrame=Phaser.Math.RND.pick([69,81]); }
            else {
              ovKey   = 'trimmed_compact_sheet';
              ovFrame = { coal_deposit:0, copper_deposit:1, iron_deposit:2, gold_deposit:3 }[b];
            }
            const tile = this.tiles[y][x];
            this.rt.drawFrame(ovKey, ovFrame, tile.pixelX, tile.pixelY);
          }
        }
      }
    }
  
    /** helper for random-walk clusters */
    _randomWalk(typeMap, biome, minLen, maxLen) {
      const N = GRID_SIZE;
      let length = Phaser.Math.Between(minLen, maxLen);
      let x = Phaser.Math.Between(0, N-1),
          y = Phaser.Math.Between(0, N-1);
      for (let i=0; i<length; i++) {
        if (typeMap[y][x]==='grass') typeMap[y][x] = biome;
        const [dx,dy] = Phaser.Math.RND.pick([[1,0],[-1,0],[0,1],[0,-1]]);
        x = Phaser.Math.Clamp(x+dx, 0, N-1);
        y = Phaser.Math.Clamp(y+dy, 0, N-1);
      }
    }
  }
  
  window.TileMap = TileMap;
  