// src/main.js - Updated for hex tiles with Battle System Integration

// NEW: Battle system imports (with error handling)
try {
  // These will be loaded if battle system files exist
  if (typeof BattleManager !== 'undefined') {
    console.log('🗡️ Battle system components loaded');
  }
} catch (error) {
  console.warn('⚠️ Battle system not available:', error);
}

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
    
    // NEW: Battle system state
    this.battleSystemEnabled = false;
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
    
    // NEW: Check if battle system is available and enabled
    this.battleSystemEnabled = this.gameWorld.battleManager !== null;
    if (this.battleSystemEnabled) {
      console.log('🗡️ Battle system initialized successfully');
    }
    
    // Create UI manager (includes battle interface if available)
    this.uiManager = new UIManager(this);

    // Set camera bounds
    const worldSize = 200 * HEX_SIZE * 2;
    this.cameras.main.setBounds(-worldSize/2, -worldSize/2, worldSize, worldSize);
    this.cameras.main.centerOn(0, 0);

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

      // NEW: Spawn some initial units for battle testing (if battle system enabled)
      if (this.battleSystemEnabled) {
        this.spawnInitialTestUnits(cpu1, cpu2);
      }

      this.registry.set('players', this.gameWorld.players);
      this.scene.launch('UIScene');
      
      // Initialize their bases
      cpu1.initializeBase();
      cpu2.initializeBase();
    }

    // NEW: Set up human player reference for battle interface
    this.humanPlayer = null; // Will be set when human player joins

    this.setupInputHandlers();
    
    // NEW: Display battle system status
    this.displayBattleSystemStatus();
  }

  // NEW: Spawn initial units for testing battles
  spawnInitialTestUnits(cpu1, cpu2) {
    try {
      // Only spawn if we have the unit classes available
      if (typeof Warrior !== 'undefined' && typeof Archer !== 'undefined') {
        // CPU1 starting units (red team)
        const cpu1Pos = [5, 5];
        cpu1.spawnUnit(Warrior, cpu1Pos);
        cpu1.spawnUnit(Archer, [cpu1Pos[0] + 1, cpu1Pos[1]]);
        
        // CPU2 starting units (blue team)  
        const cpu2Pos = [-5, -5];
        cpu2.spawnUnit(Warrior, cpu2Pos);
        cpu2.spawnUnit(Archer, [cpu2Pos[0] - 1, cpu2Pos[1]]);
        
        console.log('🗡️ Initial battle test units spawned');
      } else {
        console.warn('⚠️ Unit classes not available for battle testing');
      }
    } catch (error) {
      console.warn('⚠️ Failed to spawn initial test units:', error);
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
    // Mouse/touch pan controls (preserved exactly)
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

    // Zoom with mouse wheel (preserved exactly)
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

    // Keyboard controls (preserved exactly)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,S,A,D');
    
    // Debug key to show hex coordinates (preserved exactly)
    this.input.keyboard.on('keydown-H', () => {
      this.toggleHexDebug();
    });

    // Sprite inspector (preserved exactly)
    this.input.keyboard.on('keydown-I', () => {
      if (this.inspectorObjects) {
        this.closeInspector();
      } else {
        this.createSpriteInspector();
      }
    });

    // NEW: Battle system hotkeys (only if battle system enabled)
    if (this.battleSystemEnabled) {
      this.setupBattleHotkeys();
    }
  }

  // NEW: Set up battle-related hotkeys
  setupBattleHotkeys() {
    try {
      // Battle system hotkeys
      this.input.keyboard.on('keydown-B', () => {
        // Toggle battle debug info
        if (this.gameWorld.battleManager) {
          this.gameWorld.battleManager.debugState();
        }
      });
      
      this.input.keyboard.on('keydown-V', () => {
        // Show nearest battle interface
        const centerHex = this.getViewportCenter();
        const nearestBattle = this.gameWorld.getNearestBattle(...centerHex);
        if (nearestBattle && this.uiManager.battleInterface) {
          this.uiManager.showBattleInterface(nearestBattle, { showPrediction: true });
        } else {
          console.log('📍 No battles found near viewport center');
        }
      });
      
      this.input.keyboard.on('keydown-ESC', () => {
        // Close battle interface
        if (this.uiManager.battleInterface) {
          this.uiManager.hideBattleInterface();
        }
      });

      console.log('⌨️ Battle hotkeys enabled: B (debug), V (show battle), ESC (close battle)');
    } catch (error) {
      console.warn('⚠️ Failed to setup battle hotkeys:', error);
    }
  }

  // NEW: Get viewport center in hex coordinates
  getViewportCenter() {
    try {
      const camera = this.cameras.main;
      const screenCenterX = camera.worldView.x + camera.worldView.width / 2;
      const screenCenterY = camera.worldView.y + camera.worldView.height / 2;
      
      // Convert to hex coordinates
      return this.map.screenToHex(screenCenterX, screenCenterY);
    } catch (error) {
      console.warn('⚠️ Failed to get viewport center:', error);
      return [0, 0]; // Fallback to origin
    }
  }

  toggleHexDebug() {
    // Toggle hex coordinate display for debugging (preserved exactly)
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
    // Handle keyboard camera movement (preserved exactly)
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

    // Stop dragging if pointer is released (preserved exactly)
    if (this.isDragging && !this.input.activePointer.isDown) {
      this.isDragging = false;
    }

    // Game tick logic using GameWorld (enhanced for battle system)
    const currentMultiplier = this.timeMultiplier || 1;
    const effectiveTickInterval = TICK_INTERVAL / currentMultiplier;
    
    if (time - this.lastTick > effectiveTickInterval) {
      this.lastTick = time;
      this.tickCount++;

      // Use GameWorld for centralized tick (now includes battle processing)
      this.gameWorld.tick();

      // NEW: Update battle-related UI elements
      if (this.battleSystemEnabled && this.uiManager) {
        this.uiManager.tick();
      }

      // Update UI (preserved exactly)
      const ui = this.scene.get('UIScene');
      if (ui) {
        ui.updateTick(this.tickCount);
        ui.updateResources();
      }
    }
  }

  // NEW: Display battle system status on startup
  displayBattleSystemStatus() {
    if (this.battleSystemEnabled) {
      console.log(`
🗡️ BATTLE SYSTEM READY! 🗡️
Use the Admin Panel (F12 or ~) for all battle controls:
- Spawn Test Armies
- Start Test Battle  
- Show Nearest Battle
- End All Battles
- View Battle Statistics

Hotkeys:
- B: Show battle debug info
- V: Show nearest battle interface  
- ESC: Close battle interface
- F12 or ~: Toggle Admin Panel
      `);
    } else {
      console.log(`
ℹ️ Battle system not available
Game running in basic mode - add battle system files to enable combat popups
      `);
    }
  }

  // NEW: Create sprite inspector (placeholder - may need implementation)
  createSpriteInspector() {
    // This method was referenced but not implemented in the original
    // Adding placeholder to prevent errors
    console.log('🔍 Sprite inspector not implemented yet');
  }

  // NEW: Close inspector (placeholder - may need implementation)  
  closeInspector() {
    // This method was referenced but not implemented in the original
    // Adding placeholder to prevent errors
    if (this.inspectorObjects) {
      this.inspectorObjects = null;
    }
  }

  // NEW: Helper method for admin panel integration
  getGameState() {
    return {
      tick: this.tickCount,
      players: this.gameWorld.players.length,
      units: this.gameWorld.getAllUnits().length,
      buildings: this.gameWorld.getAllBuildings().length,
      battleSystemEnabled: this.battleSystemEnabled,
      activeBattles: this.battleSystemEnabled ? 
        this.gameWorld.battleManager.getActiveBattles().length : 0
    };
  }

  // NEW: Method for programmatic battle testing (called from admin panel)
  simulateBattleForTesting() {
    if (!this.battleSystemEnabled) {
      console.warn('❌ Battle system not enabled');
      return false;
    }

    try {
      // Find two different players' units
      const allUnits = this.gameWorld.getAllUnits();
      const players = [...new Set(allUnits.map(u => u.owner))];
      
      if (players.length < 2) {
        console.log('❌ Need at least 2 players to simulate battle');
        return false;
      }
      
      const player1Units = allUnits.filter(u => u.owner === players[0] && u.isAlive());
      const player2Units = allUnits.filter(u => u.owner === players[1] && u.isAlive());
      
      if (player1Units.length === 0 || player2Units.length === 0) {
        console.log('❌ Both players need living units to simulate battle');
        return false;
      }
      
      // Move units close to each other and start battle
      const attacker = player1Units[0];
      const defender = player2Units[0];
      
      // Move attacker next to defender
      const [defX, defY] = defender.coords;
      attacker.setPosition(defX + 1, defY);
      
      // Start battle
      console.log('🎮 Simulating battle for testing...');
      return attacker.attackUnit(defender);
    } catch (error) {
      console.error('❌ Battle simulation failed:', error);
      return false;
    }
  }

  // NEW: Set time speed multiplier
  setTimeSpeed(multiplier) {
    this.timeMultiplier = multiplier;
    console.log(`⏰ MainScene time speed set to ${multiplier}x`);
    
    // The multiplier will be applied in the update loop tick logic
    // by modifying TICK_INTERVAL dynamically or by calling tick multiple times
    return true;
  }
}

// Globals (keeping for compatibility) - preserved exactly
let selectedBuildingType = null;
let previewSprite = null;
let previewRect = null;
const buildingButtons = {};
const buildProgressBars = [];

window.MainScene = MainScene;

// Bootstrap (preserved exactly with enhanced logging)
window.onload = () => {
  // Store the game instance globally for debugging
  window.game = new Phaser.Game({
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
  
  console.log('🎮 Game started and available as window.game');
  
  // NEW: Global reference for admin panel access
  window.getMainScene = () => {
    return window.game?.scene?.getScene('MainScene');
  };
};