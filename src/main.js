// src/main.js - Updated for hex tiles

let map;
let players = [];

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.tickCount = 0;
    this.lastTick = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
  }

  preload() {
 
  
  // Load individual images
  INDIVIDUAL_IMAGES.forEach(img => {
    
    this.load.image(img.key, ASSET_PATH + img.file);
  });

  // Load building images
BUILDING_IMAGES.forEach(img => {
  this.load.image(img.key, ASSET_PATH + img.file);
});
  
  // Load sprite sheets
  SPRITE_SHEETS.forEach(sheet => {
   
    this.load.spritesheet(sheet.key, ASSET_PATH + sheet.file, {
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight
    });
  });
}

 create() {    
  // Reset state
  this.tickCount = 0;
  this.lastTick = 0;
  this.isDragging = false;
  
  // Create hex map
  this.map = new HexTileMap(this);
  map = this.map;

  // Create game world coordinator
  this.gameWorld = new GameWorld(this);
   this.uiManager = new UIManager(this);

  // Set camera bounds
  const worldSize = 200 * HEX_SIZE * 2;
  this.cameras.main.setBounds(-worldSize/2, -worldSize/2, worldSize, worldSize);
  this.cameras.main.centerOn(0, 0);

  // Bootstrap CPU players with new architecture
  // Bootstrap CPU players with new architecture
if (this.gameWorld.players.length === 0) {
  const cpu1 = new Player('CPU1', 0xff0000, this.gameWorld);
  const cpu2 = new Player('CPU2', 0x0000ff, this.gameWorld);
  
  // Make sure they have scene references
  cpu1.scene = this;
  cpu2.scene = this;
  
  this.gameWorld.addPlayer(cpu1);
  this.gameWorld.addPlayer(cpu2);
  
  // Give them resources
  [cpu1, cpu2].forEach(p =>
    p.addResources({
      food: 1000, wood: 1000, stone: 1000
    })
  );

  this.registry.set('players', this.gameWorld.players);
  this.scene.launch('UIScene');
  
  // Initialize their bases
  cpu1.initializeBase();
  cpu2.initializeBase();
}

  this.setupInputHandlers();
}
   


  


    
  
  spawnTestUnits() {
    // Spawn some test chickens near center
    const testPositions = [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]];
    
    testPositions.forEach(([q, r], index) => {
      const tile = this.map.getTile(q, r);
      if (tile && tile.isPassable()) {
        // Create a simple test unit
        const unit = {
          type: 'Chicken',
          coords: [q, r],
          owner: players[index % players.length],
          spriteKey: 'ChickenForward1',
          spriteFrame: 0
        };
        
        tile.placeUnit(unit);
        unit.sprite = this.map.placeUnitSprite(unit, q, r, unit.owner.color);
      }
    });
  }

  setupInputHandlers() {
    // Mouse/touch pan controls
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y > 40) { // Skip UI area
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.isDragging && pointer.isDown) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;
        
        this.cameras.main.scrollX -= deltaX;
        this.cameras.main.scrollY -= deltaY;
        
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Zoom with mouse wheel
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      const zoomFactor = 0.1;
      const currentZoom = this.cameras.main.zoom;
      
      let newZoom;
      if (deltaY > 0) {
        newZoom = Math.max(0.2, currentZoom - zoomFactor);
      } else {
        newZoom = Math.min(3.0, currentZoom + zoomFactor);
      }
      
      this.cameras.main.setZoom(newZoom);
    });

    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    
    // Debug key to show hex coordinates
    this.input.keyboard.on('keydown-H', () => {
      this.toggleHexDebug();
    });

    // Add to your existing keyboard handlers
this.input.keyboard.on('keydown-I', () => {
  if (this.inspectorObjects) {
    this.closeInspector();
  } else {
    this.createSpriteInspector();
  }
});
  }

  toggleHexDebug() {
    // Toggle hex coordinate display for debugging
    this.showHexCoords = !this.showHexCoords;
    
    if (this.showHexCoords) {
      this.hexLabels = [];
      this.map.getAllTiles().forEach(tile => {
        const [x, y] = tile.pixelPos;
        const label = this.add.text(x, y, `${tile.q},${tile.r}`, {
          fontSize: '10px',
          fill: '#ffffff',
          backgroundColor: '#000000'
        })
        .setOrigin(0.5, 0.5)
        .setDepth(10);
        this.hexLabels.push(label);
      });
    } else if (this.hexLabels) {
      this.hexLabels.forEach(label => label.destroy());
      this.hexLabels = null;
    }
  }

  update(time) {
    // Handle keyboard camera movement
    const panSpeed = 300 / this.cameras.main.zoom;
    
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.cameras.main.scrollX -= panSpeed * (time - (this.lastFrameTime || time)) / 1000;
    }
    if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.cameras.main.scrollX += panSpeed * (time - (this.lastFrameTime || time)) / 1000;
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.cameras.main.scrollY -= panSpeed * (time - (this.lastFrameTime || time)) / 1000;
    }
    if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.cameras.main.scrollY += panSpeed * (time - (this.lastFrameTime || time)) / 1000;
    }
    
    this.lastFrameTime = time;

    // Stop dragging if pointer is released
    if (this.isDragging && !this.input.activePointer.isDown) {
      this.isDragging = false;
    }

    // Game tick logic (simplified for now)
    // Game tick logic using GameWorld
if (time - this.lastTick > TICK_INTERVAL) {
  this.lastTick = time;
  this.tickCount++;

  // Use GameWorld for centralized tick
  this.gameWorld.tick();

  // Update UI
  const ui = this.scene.get('UIScene');
  if (ui) {
    ui.updateTick(this.tickCount);
    ui.updateResources();
  }
}
  }
}

// Globals (keeping for compatibility)
let selectedBuildingType = null;
let previewSprite = null;
let previewRect = null;
const buildingButtons = {};
const buildProgressBars = [];

window.MainScene = MainScene;

// Bootstrap
window.onload = () => {
  new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: '#1a252f',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1600,
      height: 800
    },
    scene: [MainScene, UIScene]
  });
};