// src/main.js
let map;
let players = [];        // <<< ensure this is declared too
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });

    this.tickCount = 0;
    this.lastTick = 0;
    this.isDragging = false;
    this.playerTextObjects = [];
  }

  preload() {
    SPRITE_SHEETS.forEach(sheet => {
      this.load.spritesheet(
        sheet.key,
        ASSET_PATH + sheet.file,
        { frameWidth: sheet.width, frameHeight: sheet.height }
      );
    });
    
  }
  
  // in MainScene…

create() {
  // reset tick
  this.tickCount   = 0;
  this.lastTick    = 0;
  this.isDragging  = false;
  this.map = new TileMap(this);
  map = this.map;
  // resume audio on first click
  this.input.once('pointerdown', () => {
    if (this.sound?.context.state === 'suspended') {
      this.sound.context.resume();
    }
  });

  // cache frame indices
  this.sheetFrames = {};
  for (const biome in BIOME_ASSETS) {
    const key = BIOME_ASSETS[biome];
    this.sheetFrames[key] = this.textures
      .get(key)
      .getFrameNames()
      .filter(f => f !== '__BASE')
      .map(f => parseInt(f, 10));
  }

  // camera bounds & world
  this.cameras.main.setBounds(0,0, GRID_SIZE*TILE_SIZE, GRID_SIZE*TILE_SIZE);
  // after preload…



  // bootstrap two CPU players & give them big resource pools
  if (players.length === 0) {
    players.push(
      new Player('CPU1', 0xff0000),
      new Player('CPU2', 0x0000ff)
    );
    players.forEach(p =>
      p.addResources({
        food:10000, wood:10000, stone:10000,
        iron:5000, copper:5000, coal:5000, gold:2000, coins:10000
      })
    );

    this.registry.set('players', players);
    // launch your UI on top
    this.scene.launch('UIScene');
    players.forEach(p => p.initializeBase(this));
  }

  // simple pan handlers
  this.input.on('pointerdown', pointer => {
    if (pointer.y > 40) {
      this.isDragging = true;
      this.dragX = pointer.x;
      this.dragY = pointer.y;
    }
  });
  this.input.on('pointermove', pointer => {
    if (!this.isDragging) return;
    const dx = pointer.x - this.dragX;
    const dy = pointer.y - this.dragY;
    this.cameras.main.scrollX -= dx;
    this.cameras.main.scrollY -= dy;
    this.dragX = pointer.x;
    this.dragY = pointer.y;
  });
  this.input.on('pointerup', () => this.isDragging = false);

  // scroll‐wheel zoom
  this.input.on('wheel', (_ptr,_objs,_dx,dy) => {
    const nextZoom = Phaser.Math.Clamp(
      this.cameras.main.zoom - dy * 0.001,
      0.5, 2
    );
    this.cameras.main.setZoom(nextZoom);
  });


}


  // inside MainScene…

update(time) {
  // stop drag‐to‐pan when pointer lifts
  if (this.isDragging && !this.input.activePointer.isDown) {
    this.isDragging = false;
  }

  // only run once per tick interval
  if (time - this.lastTick > TICK_INTERVAL) {
    this.lastTick = time;
    this.tickCount++;

    // ─── your CPU “build” tests ───
    // each tick, have your two CPUs attempt to build a TownCenter

    // ─── advance game logic ───
    players.forEach(p => p.tick());

    // ─── update UI exactly once ───
    const ui = this.scene.get('UIScene');
    if (ui) {
      ui.updateTick(this.tickCount);
      ui.updateResources();
    }

    // ─── update all build‐progress bars ───
    // inside your update(time) after you advance builds…
    for (let i = buildProgressBars.length - 1; i >= 0; i--) {
      const bar      = buildProgressBars[i];
      const { building, graphics } = bar;
    
      
      bar.progress = building.ticksBuild / building.buildTime;
    
      if (building.completed) {
        if (bar.graphics) bar.graphics.destroy();
        buildProgressBars.splice(i, 1);
        continue;
      }
    
      if (!bar.graphics) {
        bar.graphics = this.add.graphics().setScrollFactor(1)
        .setDepth(4);
      }
      bar.graphics.clear();
      bar.graphics.fillStyle(0xffffff, 0.5);
    
      const size     = building.footprint * TILE_SIZE;
      const progH    = size * bar.progress;
      // compute the center of the footprint in pixels
      const cx       = building.coords[0] * TILE_SIZE + size / 2;
      const cy       = building.coords[1] * TILE_SIZE + size / 2;
      // draw from bottom of the footprint up
      bar.graphics.fillRect(
        cx - size / 2,        // left edge
        cy + size / 2 - progH,// bottom edge minus current height
        size,                 // width
        progH                  // height
      );
    };
  }
}







  debugSpriteSheet(sheetKey, framesPerRow = 16, startX = 10, startY = 50) {
    const padding = 2;
    const names = this.textures.get(sheetKey)
      .getFrameNames()
      .filter(f => f !== '__BASE');

    names.forEach((name, i) => {
      const idx = parseInt(name, 10);
      const x = startX + (i % framesPerRow) * (TILE_SIZE + padding);
      const y = startY + Math.floor(i / framesPerRow) * (TILE_SIZE + padding + 10);
      this.add.sprite(x, y, sheetKey, idx).setOrigin(0);
      this.add.text(x, y + TILE_SIZE, name, { fontSize: '8px', fill: '#ffffff' }).setOrigin(0);
    });
  }

  


  
  
}




// ----------------------------------
// CONFIG & GLOBALS
// ----------------------------------
const config = {
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1600,
    height: 800
  },
  scene: [MainScene, UIScene]
};

let selectedBuildingType = null;
let previewSprite = null;
let previewRect = null;
const buildingButtons = {};
const buildProgressBars = [];
window.MainScene = MainScene;
// ----------------------------------
// BOOTSTRAP
// ----------------------------------
window.onload = () => {
  new Phaser.Game(config);
};
