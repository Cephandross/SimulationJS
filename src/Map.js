// src/Map.js

const BIOME_VARIANTS = {
  deepWater:    ['DeepWater1','DeepWater2'],
  shallowWater: ['ShallowWater1','ShallowWater2'],
  sand:         ['Sand1','Sand2'],
  grass:        ['DeadGrassBland1','DeadGrassBland2','DeadGrassPointLeft','DeadGrassPointRight','Grass1','Grass2']
};

const POINT_MAP = {
  DeadGrassPointLeft: 'DeadGrassPointRight',
  GrassPointLeft:     'GrassPointRight'
};

// Corrected Tile class for pointy-top hexes in Map.js

class Tile {
  constructor(xcoord, ycoord, tiletype, sprite) {
    this.xcoord      = xcoord;
    this.ycoord      = ycoord;
    this.tiletype    = tiletype;
    this.sprite      = sprite;
    this.building    = null;
    this.unit        = null;
    this.needsUpdating = false;
  }

  // Pointy-top hex positioning (odd-r offset coordinates)
  get pixelX() {
    // For pointy-top hexes: horizontal spacing = sqrt(3) * size
    const hexWidth = Math.sqrt(3) * (TILE_SIZE / 2);
    return this.xcoord * hexWidth + (this.ycoord & 1) * (hexWidth / 2);
  }
  
  get pixelY() {
    // For pointy-top hexes: vertical spacing = 3/4 * size  
    const hexHeight = TILE_SIZE * 3/4;
    return this.ycoord * hexHeight;
  }

  // ... rest of methods stay the same
  isEmpty() {
    return !this.building && !this.unit;
  }
  placeUnit(unit) {
    if (!this.isEmpty()) return false;
    this.unit = unit;
    unit.coords = [this.xcoord, this.ycoord];
    return true;
  }
  clearUnit() { this.unit = null; }
  clear()     { this.building = this.unit = null; }
  isBuildable() { return this.tiletype !== 'water'; }
  isPassable()  { return this.tiletype !== 'water'; }
  isSailable()  { return this.tiletype === 'sand' || this.tiletype === 'water'; }

  // six neighbors for odd-r (pointy-top) grid
  neighbors(tilemap) {
    const odd = this.ycoord & 1;
    const deltas = odd
      ? [[+1,0],[ 0,-1],[-1,0],[ 0,+1],[+1,-1],[+1,+1]]
      : [[+1,0],[ 0,-1],[-1,0],[ 0,+1],[-1,-1],[-1,+1]];
    return deltas
      .map(([dx,dy]) => tilemap[this.ycoord + dy]?.[this.xcoord + dx])
      .filter(t => t);
  }

  highlight(color, alpha = 0.3) {
    this.sprite.setTintFill(color).setAlpha(alpha);
  }
  clearHighlight() {
    this.sprite.clearTint().setAlpha(1);
  }

  get coords() {
    return [this.xcoord, this.ycoord];
  }
}


class TileMap {
  constructor(scene) {
    this.scene = scene;
    this.simplex = new SimplexNoise();
    this.tilesToUpdate = new Set();

    // full‐world render texture
    const hexHeight = Math.sqrt(3)/2 * TILE_SIZE;
    this.rt = scene.add.renderTexture(
      0, 0,
      GRID_SIZE * TILE_SIZE + TILE_SIZE/2,
      GRID_SIZE * hexHeight + hexHeight/2
    ).setDepth(0);

    this.tiles = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(null)
    );

    this.generateBiomes();
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
  getTile(x, y) {
    return this.tiles[y]?.[x] ?? null;
  }

  // building/unit placement methods unchanged…

  generateBiomes() {
    this.rt.clear();
    const deepT  = 0.1,
          waterT = 0.2,
          hexHeight = Math.sqrt(3)/2 * TILE_SIZE;

    for (let y = 0; y < GRID_SIZE; y++) {
      let pendingRight = false, leftKey = null;

      for (let x = 0; x < GRID_SIZE; x++) {
        let key, biome;

        if (pendingRight) {
          key = POINT_MAP[leftKey];
          biome = 'grass';
          pendingRight = false;
        } else {
          const v = (this.simplex.noise2D(x/50, y/50) + 1) * 0.5;
          if      (v < deepT)  { biome = 'water'; key = Phaser.Math.RND.pick(BIOME_VARIANTS.deepWater); }
          else if (v < waterT) { biome = 'water'; key = Phaser.Math.RND.pick(BIOME_VARIANTS.shallowWater); }
          else if (v < 0.35)   { biome = 'sand';  key = Phaser.Math.RND.pick(BIOME_VARIANTS.sand); }
          else                 { biome = 'grass'; key = Phaser.Math.RND.pick(BIOME_VARIANTS.grass); }

          if (POINT_MAP[key]) {
            pendingRight = true;
            leftKey = key;
          }
        }

        const tile = new Tile(x, y, biome, null);
        tile.biome = biome;
        this.tiles[y][x] = tile;

        // draw ground hex
        this.rt.draw(key, tile.pixelX, tile.pixelY);

        // overlay coords
        this.scene.add.text(
          tile.pixelX + TILE_SIZE/2,
          tile.pixelY + hexHeight/2,
          `(${x},${y})`,
          { fontSize: '12px', color: '#000000' }
        ).setOrigin(0.5).setDepth(1);
      }
    }
  }
}

window.TileMap = TileMap;
