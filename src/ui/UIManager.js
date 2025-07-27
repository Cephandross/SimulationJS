// src/ui/UIManager.js - Updated with always-on horizontal overview

class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.selectionUI = null;
    this.buildingUI = null;
    this.adminPanel = null;
    this.playerOverviewUI = null;
    this.selectedEntity = null;
    this.selectedTile = null;
    this.ghostSprite = null;
    this.placementMode = null;
    
    // Guard flags to prevent recursion
    this.eventListenersSetup = false;
    this._handlingRightClick = false;
    this._cancellingPlacement = false;
    this._emittingCancellation = false;
    
    this.initialize();
  }

  initialize() {
    // Create UI components - PlayerOverview is now always visible
    this.selectionUI = new SelectionUI(this.scene);
    this.buildingUI = new BuildingPlacementUI(this.scene);
    this.adminPanel = new AdminPanel(this.scene);
    this.playerOverviewUI = new PlayerOverviewUI(this.scene); // Always created and visible
    
    // Setup input handling
    this.setupInputHandlers();
    this.setupEventListeners();
    
    console.log('✅ UIManager initialized - PlayerOverview always visible');
  }

  setupInputHandlers() {
    // Handle mouse clicks for entity selection and building placement
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        this.handleClick(pointer);
      } else if (pointer.rightButtonDown()) {
        this.handleRightClick(pointer);
      }
    });

    // Building menu hotkey
    this.scene.input.keyboard.on('keydown-B', () => {
      this.toggleBuildMenu();
    });

    // Admin panel hotkeys (F12 or ~ key)
    this.scene.input.keyboard.on('keydown-F12', () => {
      this.toggleAdminPanel();
    });

    this.scene.input.keyboard.on('keydown-BACKTICK', () => {
      this.toggleAdminPanel();
    });

    // Removed P key toggle - PlayerOverview is now always visible

    // Category hotkeys (1-5)
    for (let i = 1; i <= 5; i++) {
      this.scene.input.keyboard.on(`keydown-${i}`, () => {
        if (this.buildingUI.isVisible) {
          const categories = Object.keys(this.buildingUI.categories);
          if (categories[i - 1]) {
            this.buildingUI.selectedCategory = categories[i - 1];
            this.buildingUI.buildInterface();
          }
        }
      });
    }

    // Building hotkeys (Q, W, E, R, T, Y, U, I, O, P)
    const buildingHotkeys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
    buildingHotkeys.forEach(key => {
      this.scene.input.keyboard.on(`keydown-${key}`, () => {
        this.handleBuildingHotkey(key);
      });
    });

    // Clear selection on escape key
    this.scene.input.keyboard.on('keydown-ESC', () => {
      if (this.placementMode) {
        this.cancelBuildingPlacement();
      } else {
        this.clearSelection();
      }
    });

    // Mouse movement for ghost preview
    this.scene.input.on('pointermove', (pointer) => {
      if (this.placementMode) {
        this.updateGhostPreview(pointer);
      }
    });
  }

  setupEventListeners() {
    // Guard against duplicate setup
    if (this.eventListenersSetup) {
      console.warn('Event listeners already set up, skipping...');
      return;
    }
    this.eventListenersSetup = true;

    // Building placement events
    this.scene.events.on('buildingPlacementStarted', (building) => {
      this.startBuildingPlacement(building);
    });

    this.scene.events.on('buildingPlacementCancelled', () => {
      this.cancelBuildingPlacement();
    });

    this.scene.events.on('buildingPlaced', () => {
      // Building was successfully placed, ghost will be updated automatically
    });
  }

  handleClick(pointer) {
    // Convert screen coordinates to world coordinates
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const [q, r] = pixelToHex(worldX, worldY);

    if (this.placementMode) {
      // Try to place building
      this.attemptBuildingPlacement(q, r);
    } else {
      // Normal entity selection
      this.handleEntitySelection(q, r);
    }
  }

  handleRightClick(pointer) {
    // Guard against recursion
    if (this._handlingRightClick) {
      return;
    }
    this._handlingRightClick = true;

    try {
      // Right-click cancels placement or clears selection
      if (this.placementMode) {
        this.cancelBuildingPlacement();
      } else {
        this.clearSelection();
      }
    } finally {
      // Always clear the flag
      this._handlingRightClick = false;
    }
  }

  handleEntitySelection(q, r) {
    // Find what was clicked
    const clickedEntity = this.findEntityAt(q, r);
    
    if (clickedEntity) {
      this.selectEntity(clickedEntity);
    } else {
      // Select the tile itself
      const tile = this.scene.map.getTile(q, r);
      if (tile) {
        this.selectTile(tile);
      } else {
        this.clearSelection();
      }
    }
  }

  findEntityAt(q, r) {
    // Check for units first (they're on top)
    const unit = this.scene.gameWorld.getUnitAt(q, r);
    if (unit) return unit;

    // Check for buildings
    const building = this.scene.gameWorld.getBuildingAt(q, r);
    if (building) return building;

    return null;
  }

  selectEntity(entity) {
    this.selectedEntity = entity;
    this.selectedTile = null;
    
    // Emit event for SelectionUI to handle
    this.scene.events.emit('entitySelected', entity);
    
    console.log(`🎯 Selected ${entity.type} at [${entity.coords[0]}, ${entity.coords[1]}]`);
  }

  selectTile(tile) {
    this.selectedTile = tile;
    this.selectedEntity = null;
    
    // Update building UI with selected tile info
    if (this.buildingUI.isVisible) {
      this.buildingUI.selectedTile = tile;
      this.buildingUI.buildInterface();
    }

    // Emit event for tile selection
    this.scene.events.emit('tileSelected', tile);
    
    console.log(`🎯 Selected tile [${tile.q}, ${tile.r}] (${tile.biome})`);
  }

  clearSelection() {
    if (this.selectedEntity) {
      console.log(`❌ Cleared entity selection`);
      this.selectedEntity = null;
      this.scene.events.emit('selectionCleared');
    }
    
    if (this.selectedTile) {
      console.log(`❌ Cleared tile selection`);
      this.selectedTile = null;
      this.scene.events.emit('tileSelectionCleared');
    }
  }

  // UI Panel Management
  toggleBuildMenu() {
    this.buildingUI.toggle();
  }

  toggleAdminPanel() {
    this.adminPanel.toggle();
    console.log(`⚡ Admin Panel ${this.adminPanel.isVisible ? 'opened' : 'closed'}`);
  }

  // PlayerOverview is always visible - no toggle methods needed

  openAdminPanel() {
    this.adminPanel.show();
  }

  closeAdminPanel() {
    this.adminPanel.hide();
  }

  // Building placement methods
  startBuildingPlacement(building) {
    console.log(`🏗️ Starting placement of ${building.name}`);
    this.placementMode = building;
    this.createGhostPreview();
  }

  cancelBuildingPlacement() {
    // Guard against recursive calls
    if (this._cancellingPlacement) {
      return;
    }
    this._cancellingPlacement = true;

    try {
      console.log(`❌ Cancelled building placement`);
      this.placementMode = null;
      this.destroyGhostPreview();
      
      // Only emit if we're not already handling a cancellation
      if (!this._emittingCancellation) {
        this._emittingCancellation = true;
        this.scene.events.emit('buildingPlacementCancelled');
        this._emittingCancellation = false;
      }
    } finally {
      this._cancellingPlacement = false;
    }
  }

  attemptBuildingPlacement(q, r) {
    if (!this.placementMode) return;

    const buildingClass = window[this.placementMode.class];
    if (!buildingClass) {
      console.error(`Building class ${this.placementMode.class} not found`);
      return;
    }

    // Get the human player (assume first player for now)
    const humanPlayer = this.scene.gameWorld.players[0];
    if (!humanPlayer) {
      console.error('No human player found');
      return;
    }

    // Try to build
    const success = humanPlayer.build(buildingClass, [q, r]);
    
    if (success) {
      console.log(`✅ Successfully placed ${this.placementMode.name} at [${q}, ${r}]`);
      this.scene.events.emit('buildingPlaced', { building: this.placementMode, coords: [q, r] });
      
      // Keep placement mode active for rapid building
      this.updateGhostPreview(this.scene.input.activePointer);
    } else {
      console.log(`❌ Failed to place ${this.placementMode.name} at [${q}, ${r}]`);
      this.showPlacementError(q, r);
    }
  }

  showPlacementError(q, r) {
    // Create temporary error indicator
    const [x, y] = hexToPixel(q, r);
    const errorText = this.scene.add.text(x, y, '❌', {
      fontSize: '24px',
      color: '#ff0000'
    }).setOrigin(0.5, 0.5).setDepth(10);
    
    // Fade out and destroy
    this.scene.tweens.add({
      targets: errorText,
      alpha: 0,
      y: y - 30,
      duration: 1000,
      onComplete: () => errorText.destroy()
    });
  }

  createGhostPreview() {
    if (!this.placementMode) return;

    this.destroyGhostPreview(); // Clean up any existing ghost

    // Create a semi-transparent preview sprite
    const [x, y] = hexToPixel(0, 0); // Start at origin, will be moved by mouse
    
    try {
      // Try to use the building's sprite
      const spriteInfo = BUILDING_SPRITES[this.placementMode.name];
      if (spriteInfo) {
        this.ghostSprite = this.scene.add.sprite(x, y, spriteInfo.key, spriteInfo.frame)
          .setOrigin(0.5, 0.5)
          .setDepth(5)
          .setAlpha(0.5)
          .setScale(0.8);
      } else {
        // Fallback to colored rectangle
        this.ghostSprite = this.scene.add.rectangle(x, y, 32, 32, 0xffffff, 0.5)
          .setDepth(5);
      }
      
      // Initially hide until mouse moves
      this.ghostSprite.setVisible(false);
      
    } catch (error) {
      console.warn('Failed to create ghost preview:', error);
    }
  }

  updateGhostPreview(pointer) {
    if (!this.placementMode || !this.ghostSprite) return;

    const [q, r] = pixelToHex(pointer.worldX, pointer.worldY);
    const [x, y] = hexToPixel(q, r);
    
    this.ghostSprite.setPosition(x, y);
    this.ghostSprite.setVisible(true);

    // Change color based on whether placement is valid
    const tile = this.scene.map.getTile(q, r);
    const buildingClass = window[this.placementMode.class];
    
    if (tile && buildingClass) {
      const humanPlayer = this.scene.gameWorld.players[0];
      const canPlace = Building.canPlaceAt(buildingClass, q, r, this.scene, humanPlayer);
      const canAfford = humanPlayer ? humanPlayer.canAfford(this.placementMode.cost) : false;
      
      if (canPlace && canAfford) {
        this.ghostSprite.setTint(0x00ff00); // Green for valid
      } else if (canPlace) {
        this.ghostSprite.setTint(0xffff00); // Yellow for valid placement but can't afford
      } else {
        this.ghostSprite.setTint(0xff0000); // Red for invalid
      }
    } else {
      this.ghostSprite.setTint(0xff0000); // Red for invalid
    }
  }

  destroyGhostPreview() {
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }
  }

  handleBuildingHotkey(key) {
    if (!this.buildingUI.isVisible) return;

    // Find building with matching hotkey in current category
    const currentCategory = this.buildingUI.categories[this.buildingUI.selectedCategory];
    if (!currentCategory) return;

    const building = currentCategory.buildings.find(b => b.hotkey === key);
    if (building) {
      // Check if we can afford and place this building
      const humanPlayer = this.scene.gameWorld.players[0];
      if (humanPlayer && humanPlayer.canAfford(building.cost)) {
        this.buildingUI.selectBuilding(building);
      }
    }
  }

  // Admin Panel Integration Methods
  enableGodMode() {
    if (this.adminPanel) {
      this.adminPanel.godMode = true;
      this.adminPanel.buildInterface();
      console.log('⚡ God Mode ENABLED via UIManager');
    }
  }

  disableGodMode() {
    if (this.adminPanel) {
      this.adminPanel.godMode = false;
      this.adminPanel.buildInterface();
      console.log('⚡ God Mode DISABLED via UIManager');
    }
  }

  giveResourcesCurrentPlayer(amount) {
    if (this.adminPanel && this.adminPanel.godMode) {
      const currentPlayer = this.getSelectedPlayer();
      if (currentPlayer) {
        this.adminPanel.selectedPlayer = currentPlayer;
        this.adminPanel.giveResources(amount);
      }
    }
  }

  getSelectedPlayer() {
    // Return currently selected player or first human player
    if (this.adminPanel && this.adminPanel.selectedPlayer) {
      return this.adminPanel.selectedPlayer;
    }
    return this.scene.gameWorld.players[0]; // Default to first player
  }

  setTimeSpeed(multiplier) {
    if (this.adminPanel) {
      this.adminPanel.setTimeSpeed(multiplier);
    }
  }

  // Clean method to reset all flags (useful for debugging)
  resetFlags() {
    this._handlingRightClick = false;
    this._cancellingPlacement = false;
    this._emittingCancellation = false;
    console.log('🔧 Reset UIManager flags');
  }

  // Utility methods
  getSelectedEntity() {
    return this.selectedEntity;
  }

  getSelectedTile() {
    return this.selectedTile;
  }

  isEntitySelected(entity) {
    return this.selectedEntity === entity;
  }

  isInPlacementMode() {
    return this.placementMode !== null;
  }

  getCurrentPlacementBuilding() {
    return this.placementMode;
  }

  isAdminPanelOpen() {
    return this.adminPanel && this.adminPanel.isVisible;
  }

  // PlayerOverview is always visible
  isPlayerOverviewOpen() {
    return true; // Always visible now
  }

  destroy() {
    this.destroyGhostPreview();
    
    if (this.selectionUI) {
      this.selectionUI.destroy();
    }
    
    if (this.buildingUI) {
      this.buildingUI.destroy();
    }

    if (this.adminPanel) {
      this.adminPanel.destroy();
    }

    if (this.playerOverviewUI) {
      this.playerOverviewUI.destroy();
    }
  }
}

// Enhanced debug utilities for browser console
window.debugUIManager = function() {
  const scene = window.game?.scene?.getScene('MainScene');
  if (!scene?.uiManager) {
    console.error('UIManager not found');
    return;
  }
  
  const ui = scene.uiManager;
  console.log('🔧 UIManager Debug Info:');
  console.log('- Event listeners setup:', ui.eventListenersSetup);
  console.log('- Placement mode:', ui.placementMode?.name || 'none');
  console.log('- Handling right click:', ui._handlingRightClick);
  console.log('- Cancelling placement:', ui._cancellingPlacement);
  console.log('- Admin panel open:', ui.isAdminPanelOpen());
  console.log('- Player overview:', 'Always visible');
  console.log('- God mode active:', ui.adminPanel?.godMode || false);
  
  return ui;
};

window.resetUIManager = function() {
  const ui = window.debugUIManager();
  if (ui) {
    ui.resetFlags();
    console.log('✅ UIManager flags reset');
  }
};

// Quick admin commands for console
window.toggleAdmin = function() {
  const ui = window.debugUIManager();
  if (ui) {
    ui.toggleAdminPanel();
  }
};

window.enableGod = function() {
  const ui = window.debugUIManager();
  if (ui) {
    ui.enableGodMode();
  }
};

window.giveResources = function(amount = 10000) {
  const ui = window.debugUIManager();
  if (ui) {
    ui.giveResourcesCurrentPlayer(amount);
  }
};

window.setSpeed = function(speed = 2) {
  const ui = window.debugUIManager();
  if (ui) {
    ui.setTimeSpeed(speed);
  }
};

window.UIManager = UIManager;