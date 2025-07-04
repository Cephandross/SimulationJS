// src/units/Unit.js

/**
 * Base Unit class — all units live in UnitSheet1
 */
class Unit {
  /**
   * @param {object} opts
   * @param {string} opts.type
   * @param {[number,number]} opts.coords
   * @param {number} opts.hp
   * @param {number} opts.movePts
   * @param {number} opts.actionPts
   */
  constructor({ type, coords, hp = 10, movePts = 1, actionPts = 1 }) {
    this.type         = type;
    this.coords       = coords;     // [x, y]
    this.hp           = hp;
    this.movePts      = movePts;
    this.maxMovePts   = movePts;
    this.actionPts    = actionPts;
    this.maxActionPts = actionPts;
    this.owner        = null;       // set by spawnUnit
    this.spriteKey    = 'UnitSheet1';
    this.spriteFrame  = 0;
    this.sprite       = null;       // filled by spawnUnit
    this.destination  = null;       // set by moveTo()
    this.onArrive     = null;       // optional callback

    // Use rogues sheet for units (7x7 grid, some frames empty)
const unitSpriteMap = {
  'Worker': { key: 'rogues_sheet', frame: 37 },        // 6th row worker
  'Builder': { key: 'rogues_sheet', frame: 36 },       // 6th row builder (as specified)
  'FootSoldier': { key: 'rogues_sheet', frame: 0 },    // Top-left warrior
  'Shieldbearer': { key: 'rogues_sheet', frame: 8 },   // 2nd row armored
  'Healer': { key: 'rogues_sheet', frame: 24 },        // 4th row mage/healer
  'LightRider': { key: 'rogues_sheet', frame: 16 },    // 3rd row rider
  'HeavyCavalry': { key: 'rogues_sheet', frame: 17 },  // 3rd row heavy rider
  'Engineer': { key: 'rogues_sheet', frame: 38 }       // 6th row engineer
};

const spriteInfo = unitSpriteMap[type];
if (spriteInfo) {
  this.spriteKey = spriteInfo.key;
  this.spriteFrame = spriteInfo.frame;
} else {
  // Fallback to a basic character
  this.spriteKey = 'rogues_sheet';
  this.spriteFrame = 0; // Default to top-left
}
  }

  isAlive() {
    return this.hp > 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  resetPoints() {
    this.movePts   = this.maxMovePts;
    this.actionPts = this.maxActionPts;
  }

  /**
   * Tell this unit to walk to a target tile.
   * @param {[number,number]} coords  [tx,ty]
   * @param {Phaser.Scene} scene
   */
  moveTo([tx, ty], scene) {
    console.log('moveTo called:', this.type, '→', tx, ty);
    this.destination = { x: tx, y: ty };
    this.scene       = scene;
    const [cx, cy]   = this.coords;
    scene.map.getTile(cx, cy)?.clearUnit();
  }

  /**
   * Must be called once per tick (e.g. via Player.tick).
   * Moves 1 step toward destination; fires onArrive() on arrival.
   */
  update() {
    if (!this.destination) return;
  
    const [cx, cy]    = this.coords;
    const dxTotal     = this.destination.x - cx;
    const dyTotal     = this.destination.y - cy;
    const absDx       = Math.abs(dxTotal);
    const absDy       = Math.abs(dyTotal);
  
    // arrived?
    if (absDx === 0 && absDy === 0) {
      this.destination = null;
      if (this.onArrive) this.onArrive();
      return;
    }
  
    // build ordered list of candidate steps
    const candidates = [];
    if (absDx >= absDy) {
      candidates.push([ Math.sign(dxTotal), 0 ]);
      candidates.push([ 0, Math.sign(dyTotal) ]);
    } else {
      candidates.push([ 0, Math.sign(dyTotal) ]);
      candidates.push([ Math.sign(dxTotal), 0 ]);
    }
    candidates.push([ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ]);
  
    // try each candidate until one is passable & empty
    for (let [mx, my] of candidates) {
      const nx   = cx + mx;
      const ny   = cy + my;
      const tile = this.scene.map.getTile(nx, ny);
  
      if (tile && tile.isPassable() && tile.isEmpty()) {
        // clear old tile and flag for update
        const oldTile = this.scene.map.getTile(cx, cy);
        oldTile.clearUnit();
        this.scene.map.unmarkUpdate(oldTile);
  
        // step into new tile and flag for update
        this.coords = [ nx, ny ];
        tile.placeUnit(this);
        this.scene.map.markForUpdate(tile);
  
        // move the sprite
        this.sprite.setPosition(nx * TILE_SIZE, ny * TILE_SIZE);
        break;
      }
    }
  }
  
    
}

window.Unit = Unit;
