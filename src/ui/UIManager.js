// src/ui/UIManager.js - Central UI coordinator

class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.selectionUI = null;
    this.selectedEntity = null;
    
    this.initialize();
  }

  initialize() {
    // Create UI components
    this.selectionUI = new SelectionUI(this.scene);
    
    // Setup input handling
    this.setupInputHandlers();
    
    console.log('✅ UIManager initialized');
  }

  setupInputHandlers() {
    // Handle mouse clicks for entity selection
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        this.handleClick(pointer);
      }
    });

    // Clear selection on escape key
    this.scene.input.keyboard.on('keydown-ESC', () => {
      this.clearSelection();
    });
  }

  handleClick(pointer) {
    // Convert screen coordinates to world coordinates
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const [q, r] = pixelToHex(worldX, worldY);

    // Find what was clicked
    const clickedEntity = this.findEntityAt(q, r);
    
    if (clickedEntity) {
      this.selectEntity(clickedEntity);
    } else {
      this.clearSelection();
    }
  }

  findEntityAt(q, r) {
    // Check for units first (they're on top)
    const unit = this.scene.gameWorld.getUnitAt(q, r);
    if (unit) {
      return unit;
    }

    // Check for buildings
    const building = this.scene.gameWorld.getBuildingAt(q, r);
    if (building) {
      return building;
    }

    return null;
  }

  selectEntity(entity) {
    this.selectedEntity = entity;
    
    // Emit event for SelectionUI to handle
    this.scene.events.emit('entitySelected', entity);
    
    console.log(`🎯 Selected ${entity.type} at [${entity.coords[0]}, ${entity.coords[1]}]`);
  }

  clearSelection() {
    if (this.selectedEntity) {
      console.log(`❌ Cleared selection`);
      this.selectedEntity = null;
      this.scene.events.emit('selectionCleared');
    }
  }

  getSelectedEntity() {
    return this.selectedEntity;
  }

  // Utility methods for future features
  isEntitySelected(entity) {
    return this.selectedEntity === entity;
  }

  // Future: Add methods for building placement UI
  // startBuildingPlacement(buildingType) { }
  // cancelBuildingPlacement() { }
  
  // Future: Add methods for unit commands
  // issueUnitCommand(command, target) { }
  // showUnitContextMenu(unit, x, y) { }

  destroy() {
    if (this.selectionUI) {
      this.selectionUI.destroy();
    }
  }
}

window.UIManager = UIManager;