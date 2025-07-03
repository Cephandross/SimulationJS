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
  console.log('Loading hex assets...');
  console.log('INDIVIDUAL_IMAGES:', INDIVIDUAL_IMAGES?.length || 'undefined');
  console.log('SPRITE_SHEETS:', SPRITE_SHEETS?.length || 'undefined');
  
  // Load individual images
  INDIVIDUAL_IMAGES.forEach(img => {
    console.log(`Loading image: ${img.key}`);
    this.load.image(img.key, ASSET_PATH + img.file);
  });
  
  // Load sprite sheets
  SPRITE_SHEETS.forEach(sheet => {
    console.log(`Loading spritesheet: ${sheet.key}`);
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
     // DEBUG: Test monster spritesheet loading
  console.log('=== MONSTER SPRITE DEBUG ===');
  const monsterTexture = this.textures.get('monsters_sheet');
  console.log('Monster texture:', monsterTexture);
  console.log('Frame total:', monsterTexture.frameTotal);
  console.log('Available frames:', Object.keys(monsterTexture.frames));

  // Test creating a sprite with frame 0
  try {
    const testSprite = this.add.sprite(100, 100, 'monsters_sheet', 0);
    console.log('Test sprite frame 0: SUCCESS');
  } catch (error) {
    console.error('Test sprite frame 0: FAILED', error);
  }
  
  // Test creating a sprite with frame 66
  try {
    const testSprite = this.add.sprite(150, 100, 'monsters_sheet', 66);
    console.log('Test sprite frame 66: SUCCESS');
  } catch (error) {
    console.error('Test sprite frame 66: FAILED', error);
  }
    // Create hex map
    this.map = new HexTileMap(this);
    map = this.map;

    // Set camera bounds (larger for hex world)
    const worldSize = 200 * HEX_SIZE * 2; // Rough estimate
    this.cameras.main.setBounds(-worldSize/2, -worldSize/2, worldSize, worldSize);
    this.cameras.main.centerOn(0, 0);

    // Bootstrap CPU players (simplified for now)
    if (players.length === 0) {
      players.push(
        new Player('CPU1', 0xff0000),
        new Player('CPU2', 0x0000ff)
      );
      
      // Give them basic resources
      players.forEach(p =>
        p.addResources({
          food: 1000, wood: 1000, stone: 1000
        })
      );

      this.registry.set('players', players);
      this.scene.launch('UIScene');
      
      // For now, just spawn some chickens as test units
      this.spawnTestUnits();
       this.spawnTestBuildings();
    }

    // Input handlers
    this.setupInputHandlers();
    
    console.log('Hex world created!');

    



};
   spawnTestBuildings() {
    if (typeof TownCenter === 'undefined') {
    console.warn('Building classes not loaded yet');
    return;}
  // Spawn some test buildings around the center
const buildingTests = [
  { pos: [8, 45], type: TownCenter, player: 0 },    // Move away from center water
  { pos: [46, 8], type: Barracks, player: 0 },
  { pos: [10, 30], type: House, player: 0 },
  { pos: [-18, -5], type: TownCenter, player: 1 },  // Opposite side
  { pos: [-6, -8], type: Workshop, player: 1 },
  { pos: [-10, -3], type: LumberCamp, player: 1 }
];
  
  buildingTests.forEach(({ pos, type, player }) => {
    const [q, r] = pos;
    const tile = this.map.getTile(q, r);
    if (tile && tile.isBuildable() && tile.isEmpty()) {
      const building = new type([q, r]);
      building.owner = players[player];
      building.completed = true;
      
      if (this.map.placeBuildingState(building, q, r)) {
        building.sprite = this.map.placeBuildingSprite(building, q, r, building.owner.color);
        players[player].buildings.push(building);
        console.log(`Placed ${building.type} for ${building.owner.name} at [${q},${r}]`);
      }
    }
  });
}

createSpriteInspector() {
  console.log('Creating sprite frame inspector...');
  
  const monsterTexture = this.textures.get('monsters_sheet');
  if (!monsterTexture) {
    console.error('Monster texture not found');
    return;
  }
  
  const frameWidth = 32;
  const frameHeight = 32;
  const scale = 3; // Make it bigger for easier viewing
  const startX = 50; // Position on screen
  const startY = 50;
  
  // Calculate grid dimensions from the source image
  const sourceWidth = monsterTexture.source[0].width;
  const sourceHeight = monsterTexture.source[0].height;
  const cols = Math.floor(sourceWidth / frameWidth);
  const rows = Math.floor(sourceHeight / frameHeight);
  
  console.log(`Monster sheet: ${sourceWidth}x${sourceHeight}, Grid: ${cols}x${rows}, Total frames: ${cols * rows}`);
  
  // Create a background for the inspector
  const bg = this.add.rectangle(
    startX + (cols * frameWidth * scale) / 2,
    startY + (rows * frameHeight * scale) / 2,
    cols * frameWidth * scale + 20,
    rows * frameHeight * scale + 20,
    0x000000,
    0.8
  ).setDepth(100);
  
  // Create sprites for each frame with frame numbers
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const frameIndex = row * cols + col;
      
      if (frameIndex >= monsterTexture.frameTotal) break;
      
      const x = startX + col * frameWidth * scale + (frameWidth * scale / 2);
      const y = startY + row * frameHeight * scale + (frameHeight * scale / 2);
      
      // Create the sprite
      const sprite = this.add.sprite(x, y, 'monsters_sheet', frameIndex)
        .setScale(scale)
        .setDepth(101);
      
      // Add frame number overlay
      const text = this.add.text(x, y, frameIndex.toString(), {
        fontSize: '12px',
        fill: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 2, y: 1 }
      })
      .setOrigin(0.5, 0.5)
      .setDepth(102);
      
      // Make sprites clickable to log frame info
      sprite.setInteractive();
      sprite.on('pointerdown', () => {
        console.log(`Frame ${frameIndex}: Row ${row}, Col ${col}`);
        console.log(`Use frame ${frameIndex} for buildings`);
      });
    }
  }}


  closeInspector() {
  if (this.inspectorObjects) {
    this.inspectorObjects.forEach(obj => obj.destroy());
    this.inspectorObjects = null;
  }
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
    if (time - this.lastTick > TICK_INTERVAL) {
      this.lastTick = time;
      this.tickCount++;

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