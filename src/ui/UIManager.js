// src/ui/UIManager.js - Complete with Save/Load and Battle System Integration

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
    
    // NEW: Battle system components
    this.battleInterface = null;
    this.battleNotifications = [];
    this.notificationContainer = null;
    this.battleSystemEnabled = false;
    
    this.initialize();
  }

  initialize() {
    // Create UI components - PlayerOverview is now always visible
    this.selectionUI = new SelectionUI(this.scene);
    this.buildingUI = new BuildingPlacementUI(this.scene);
    this.adminPanel = new AdminPanel(this.scene);
    this.playerOverviewUI = new PlayerOverviewUI(this.scene); // Always created and visible
    
    // NEW: Initialize battle interface if available
    this.initializeBattleSystem();
    
    // Setup input handling
    this.setupInputHandlers();
    this.setupEventListeners();
    
    console.log('✅ UIManager initialized - PlayerOverview always visible, Battle system:', 
      this.battleSystemEnabled ? 'enabled' : 'disabled');
  }

  // NEW: Initialize battle system components
  initializeBattleSystem() {
    try {
      // Check if battle system classes are available
      if (typeof BattleInterface !== 'undefined') {
        this.battleInterface = new BattleInterface(this.scene);
        this.notificationContainer = this.createNotificationContainer();
        this.battleSystemEnabled = true;
        console.log('🗡️ Battle interface initialized');
      } else {
        console.log('ℹ️ Battle interface not available - running without battle UI');
        this.battleSystemEnabled = false;
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize battle system:', error);
      this.battleSystemEnabled = false;
    }
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

    // Admin panel hotkeys (F12 or L key)
    this.scene.input.keyboard.on('keydown-F12', () => {
      this.toggleAdminPanel();
    });

    this.scene.input.keyboard.on('keydown-L', () => {
      this.toggleAdminPanel();
    });

    // Save/Load hotkeys - Preserved exactly
    this.scene.input.keyboard.on('keydown-F5', () => {
      // F5 = Quick Save (localStorage)
      this.performQuickSave();
    });

    this.scene.input.keyboard.on('keydown-F9', () => {
      // F9 = Quick Load (localStorage)
      this.performQuickLoad();
    });

    this.scene.input.keyboard.on('keydown-F6', (event) => {
      // F6 = Full World Save (hold Shift for full world load)
      if (event.shiftKey) {
        this.performFullWorldLoad();
      } else {
        this.performFullWorldSave();
      }
    });

    // NEW: Battle system hotkeys (only if battle system enabled)
    if (this.battleSystemEnabled) {
      this.setupBattleHotkeys();
    }

    // Category hotkeys (1-5) - Preserved exactly
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

    // Building hotkeys (Q, W, E, R, T, Y, U, I, O, P) - Preserved exactly
    const buildingHotkeys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
    buildingHotkeys.forEach(key => {
      this.scene.input.keyboard.on(`keydown-${key}`, () => {
        this.handleBuildingHotkey(key);
      });
    });

    // Clear selection on escape key (enhanced for battle system)
    this.scene.input.keyboard.on('keydown-ESC', () => {
      // NEW: Close battle interface first if open
      if (this.battleSystemEnabled && this.battleInterface && this.battleInterface.isVisible) {
        this.hideBattleInterface();
      } else if (this.placementMode) {
        this.cancelBuildingPlacement();
      } else {
        this.clearSelection();
      }
    });

    // Mouse movement for ghost preview - Preserved exactly
    this.scene.input.on('pointermove', (pointer) => {
      if (this.placementMode) {
        this.updateGhostPreview(pointer);
      }
    });
  }

  // NEW: Set up battle-related hotkeys
  setupBattleHotkeys() {
    try {
      // V key: Show nearest battle interface (if not conflicting with other features)
      this.scene.input.keyboard.on('keydown-V', () => {
        this.toggleBattleInterface();
      });

      console.log('⌨️ Battle hotkeys enabled: V (toggle battle interface), ESC (close battle)');
    } catch (error) {
      console.warn('⚠️ Failed to setup battle hotkeys:', error);
    }
  }

  // ==========================================
  // BATTLE SYSTEM METHODS (NEW)
  // ==========================================

  /**
   * NEW: Show battle interface for a specific battle
   */
  showBattleInterface(battleData, options = {}) {
    if (!this.battleSystemEnabled || !this.battleInterface) {
      console.warn('❌ Battle interface not available');
      return;
    }
    
    this.battleInterface.show(battleData, options);
    
    // Show battle prediction if requested
    if (options.showPrediction) {
      const terrain = this.scene.map.getTile(...battleData.hex);
      this.battleInterface.showPrediction(battleData.attackers, battleData.defenders, terrain);
    }
  }

  /**
   * NEW: Hide battle interface
   */
  hideBattleInterface() {
    if (this.battleSystemEnabled && this.battleInterface) {
      this.battleInterface.hide();
    }
  }

  /**
   * NEW: Toggle battle interface visibility
   */
  toggleBattleInterface() {
    if (!this.battleSystemEnabled) {
      this.showBattleNotification('Battle system not available', 'info', 2000);
      return;
    }

    if (!this.battleInterface) return;
    
    if (this.battleInterface.isVisible) {
      this.hideBattleInterface();
    } else {
      // Show nearest battle
      const centerHex = this.scene.getViewportCenter ? this.scene.getViewportCenter() : [0, 0];
      const nearestBattle = this.scene.gameWorld.getNearestBattle ? 
        this.scene.gameWorld.getNearestBattle(...centerHex) : null;
      
      if (nearestBattle) {
        this.showBattleInterface(nearestBattle, { showPrediction: true });
      } else {
        this.showBattleNotification('No active battles found', 'info', 2000);
      }
    }
  }

  /**
   * NEW: Create notification container for battle alerts
   */
  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'battle-notifications';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      z-index: 2000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  /**
   * NEW: Show battle notification
   */
  showBattleNotification(message, type = 'info', duration = 3000) {
    // Fall back to save notification system if battle notifications not available
    if (!this.notificationContainer) {
      this.showSaveNotification(message, type);
      return;
    }

    const notification = document.createElement('div');
    const id = 'notification-' + Date.now();
    notification.id = id;
    
    // Style based on type
    let bgColor = 'rgba(74, 85, 104, 0.95)'; // default
    let borderColor = '#4a5568';
    let icon = '📢';
    
    switch (type) {
      case 'battle-start':
        bgColor = 'rgba(229, 62, 62, 0.95)';
        borderColor = '#e53e3e';
        icon = '⚔️';
        break;
      case 'battle-end':
        bgColor = 'rgba(72, 187, 120, 0.95)';
        borderColor = '#48bb78';
        icon = '🏆';
        break;
      case 'retreat':
        bgColor = 'rgba(237, 137, 54, 0.95)';
        borderColor = '#ed8936';
        icon = '🏃';
        break;
      case 'victory':
        bgColor = 'rgba(255, 215, 0, 0.95)';
        borderColor = '#ffd700';
        icon = '👑';
        break;
      case 'info':
        bgColor = 'rgba(14, 165, 233, 0.95)';
        borderColor = '#0ea5e9';
        icon = 'ℹ️';
        break;
    }
    
    notification.style.cssText = `
      background: ${bgColor};
      border-left: 4px solid ${borderColor};
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 6px;
      color: white;
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(320px);
      transition: transform 0.3s ease;
      pointer-events: auto;
      cursor: pointer;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">${icon}</span>
        <span>${message}</span>
      </div>
    `;
    
    // Add click to dismiss
    notification.addEventListener('click', () => {
      this.dismissNotification(id);
    });
    
    this.notificationContainer.appendChild(notification);
    this.battleNotifications.push({ id, element: notification, timeout: null });
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 50);
    
    // Auto-dismiss
    const timeoutId = setTimeout(() => {
      this.dismissNotification(id);
    }, duration);
    
    // Update timeout reference
    const notif = this.battleNotifications.find(n => n.id === id);
    if (notif) notif.timeout = timeoutId;
  }

  /**
   * NEW: Dismiss a notification
   */
  dismissNotification(id) {
    const notifIndex = this.battleNotifications.findIndex(n => n.id === id);
    if (notifIndex === -1) return;
    
    const notif = this.battleNotifications[notifIndex];
    
    // Clear timeout
    if (notif.timeout) {
      clearTimeout(notif.timeout);
    }
    
    // Animate out
    notif.element.style.transform = 'translateX(320px)';
    
    // Remove after animation
    setTimeout(() => {
      if (notif.element.parentNode) {
        notif.element.parentNode.removeChild(notif.element);
      }
      this.battleNotifications.splice(notifIndex, 1);
    }, 300);
  }

  /**
   * NEW: Handle battle events and show appropriate notifications
   */
  onBattleEvent(event, data) {
    switch (event) {
      case 'battle-started':
        this.showBattleNotification(
          `Battle started at [${data.hex.join(', ')}]`,
          'battle-start'
        );
        break;
        
      case 'battle-ended':
        const victor = data.victor || 'None';
        this.showBattleNotification(
          `Battle ended at [${data.hex.join(', ')}] - Victor: ${victor}`,
          'battle-end'
        );
        break;
        
      case 'unit-retreated':
        this.showBattleNotification(
          `${data.unit.type} retreated from battle`,
          'retreat'
        );
        break;
        
      case 'player-victory':
        this.showBattleNotification(
          `Victory! Your forces won the battle at [${data.hex.join(', ')}]`,
          'victory',
          5000
        );
        break;
    }
  }

  /**
   * NEW: Update UI elements each tick
   */
  tick() {
    // Update battle-related UI elements
    if (this.battleSystemEnabled) {
      this.updateBattleIndicators();
      this.cleanupNotifications();
    }
  }

  /**
   * NEW: Update battle indicators on the map
   */
  updateBattleIndicators() {
    if (!this.scene.gameWorld || !this.scene.gameWorld.battleManager) return;
    
    const battles = this.scene.gameWorld.battleManager.getActiveBattles();
    
    // For now, just log active battles (could add map indicators later)
    if (battles.length > 0 && this.scene.tickCount % 10 === 0) {
      // Only log every 10 ticks to avoid spam
      console.log(`⚔️ ${battles.length} active battle(s)`);
    }
  }

  /**
   * NEW: Clean up old notifications
   */
  cleanupNotifications() {
    // Remove notifications older than 30 seconds
    const now = Date.now();
    this.battleNotifications.forEach(notif => {
      const age = now - parseInt(notif.id.split('-')[1]);
      if (age > 30000) { // 30 seconds
        this.dismissNotification(notif.id);
      }
    });
  }

  /**
   * NEW: Show battle summary popup
   */
  showBattleSummary(battleResult) {
    const summary = document.createElement('div');
    summary.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      border: 3px solid #4a5568;
      border-radius: 12px;
      padding: 24px;
      color: #e2e8f0;
      font-family: 'Segoe UI', sans-serif;
      z-index: 1500;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    `;
    
    const victor = battleResult.victor || 'Draw';
    const victorColor = victor === 'attackers' ? '#e53e3e' : victor === 'defenders' ? '#3182ce' : '#ffd700';
    
    summary.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: ${victorColor}; margin: 0 0 8px 0;">🏆 Battle Complete!</h2>
        <div style="font-size: 18px; font-weight: bold;">Victor: ${victor}</div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="text-align: center;">
          <div style="color: #e53e3e; font-weight: bold;">Attackers</div>
          <div>${battleResult.attackerCasualties || 0} casualties</div>
          <div>${battleResult.attackerSurvivors || 0} survivors</div>
        </div>
        <div style="text-align: center;">
          <div style="color: #3182ce; font-weight: bold;">Defenders</div>
          <div>${battleResult.defenderCasualties || 0} casualties</div>
          <div>${battleResult.defenderSurvivors || 0} survivors</div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        ">Close</button>
      </div>
    `;
    
    document.body.appendChild(summary);
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (summary.parentNode) {
        summary.parentNode.removeChild(summary);
      }
    }, 10000);
  }

  // ==========================================
  // SAVE/LOAD HOTKEY METHODS (Preserved exactly)
  // ==========================================

  performQuickSave() {
    if (!window.gamePersistence) {
      window.gamePersistence = new GamePersistence();
    }
    
    const result = window.gamePersistence.saveGame(
      this.scene, 
      'quicksave_f5', 
      'F5 Quick Save'
    );
    
    if (result.success) {
      this.showSaveNotification('⚡ Quick Saved (F5)', 'success');
    } else {
      this.showSaveNotification('❌ Quick Save Failed', 'error');
    }
  }

  performQuickLoad() {
    if (!window.gamePersistence) {
      window.gamePersistence = new GamePersistence();
    }
    
    const loadResult = window.gamePersistence.loadGame('quicksave_f5');
    if (loadResult.success) {
      const restoreResult = window.gamePersistence.restoreGameState(this.scene, loadResult.gameState);
      if (restoreResult.success) {
        this.showSaveNotification('⚡ Quick Loaded (F9)', 'success');
        // Refresh UI
        if (this.adminPanel && this.adminPanel.isVisible) {
          this.adminPanel.buildInterface();
        }
      } else {
        this.showSaveNotification('❌ Restore Failed', 'error');
      }
    } else {
      this.showSaveNotification('❌ No Quick Save Found', 'error');
    }
  }

  async performFullWorldSave() {
    if (!window.fullWorldPersistence) {
      window.fullWorldPersistence = new FullWorldPersistence();
    }
    
    this.showSaveNotification('🌍 Saving Full World...', 'info');
    
    try {
      const result = await window.fullWorldPersistence.saveFullWorld(
        this.scene,
        'fullworld_f6',
        'F6 Full World Save'
      );
      
      if (result.success) {
        const sizeMB = (result.size / (1024 * 1024)).toFixed(1);
        this.showSaveNotification(`🌍 Full World Saved (${sizeMB}MB)`, 'success');
      } else {
        this.showSaveNotification('❌ Full World Save Failed', 'error');
      }
    } catch (error) {
      this.showSaveNotification('❌ Save Error: ' + error.message, 'error');
    }
  }

  async performFullWorldLoad() {
    if (!window.fullWorldPersistence) {
      window.fullWorldPersistence = new FullWorldPersistence();
    }
    
    try {
      // Find the quick save
      const saves = await window.fullWorldPersistence.getAllSaves();
      const quickSave = saves.find(s => s.name === 'fullworld_f6');
      
      if (quickSave) {
        this.showSaveNotification('🌍 Loading Full World...', 'info');
        
        const result = await window.fullWorldPersistence.loadFullWorld(quickSave.id, this.scene);
        
        if (result.success) {
          this.showSaveNotification('🌍 Full World Loaded (Shift+F6)', 'success');
          // Refresh UI
          if (this.adminPanel && this.adminPanel.isVisible) {
            this.adminPanel.buildInterface();
          }
        } else {
          this.showSaveNotification('❌ Full World Load Failed', 'error');
        }
      } else {
        this.showSaveNotification('❌ No Full World Save Found', 'error');
      }
    } catch (error) {
      this.showSaveNotification('❌ Load Error: ' + error.message, 'error');
    }
  }

  showSaveNotification(message, type = 'info') {
    // Create a temporary notification overlay
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-size: 16px;
      font-weight: bold;
      z-index: 5000;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      opacity: 0;
      scale: 0.8;
      transition: all 0.3s ease;
      pointer-events: none;
    `;

    // Style based on type
    const colors = {
      success: '#059669',
      error: '#dc2626',
      info: '#0ea5e9'
    };
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.scale = '1';
    }, 100);

    // Auto-remove after 2 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.scale = '0.8';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  // ==========================================
  // EXISTING METHODS (Preserved exactly)
  // ==========================================

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

  // UI Panel Management - Preserved exactly
  toggleBuildMenu() {
    this.buildingUI.toggle();
  }

  toggleAdminPanel() {
    this.adminPanel.toggle();
    console.log(`⚡ Admin Panel ${this.adminPanel.isVisible ? 'opened' : 'closed'}`);
  }

  openAdminPanel() {
    this.adminPanel.show();
  }

  closeAdminPanel() {
    this.adminPanel.hide();
  }

  // Building placement methods - Preserved exactly
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

  // Admin Panel Integration Methods - Preserved exactly
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

  // Clean method to reset all flags (useful for debugging) - Preserved exactly
  resetFlags() {
    this._handlingRightClick = false;
    this._cancellingPlacement = false;
    this._emittingCancellation = false;
    console.log('🔧 Reset UIManager flags');
  }

  // Utility methods - Preserved exactly
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

  // PlayerOverview is always visible - Preserved exactly
  isPlayerOverviewOpen() {
    return true; // Always visible now
  }

  // NEW: Battle system status methods
  isBattleSystemEnabled() {
    return this.battleSystemEnabled;
  }

  isBattleInterfaceOpen() {
    return this.battleSystemEnabled && this.battleInterface && this.battleInterface.isVisible;
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

    // NEW: Clean up battle interface
    if (this.battleInterface) {
      this.battleInterface.destroy();
    }
    
    // Clean up notifications
    this.battleNotifications.forEach(notif => {
      if (notif.timeout) clearTimeout(notif.timeout);
    });
    
    if (this.notificationContainer && this.notificationContainer.parentNode) {
      this.notificationContainer.parentNode.removeChild(this.notificationContainer);
    }
  }
}

// Enhanced debug utilities for browser console - Enhanced with battle features
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
  console.log('- Battle system enabled:', ui.battleSystemEnabled);
  console.log('- Battle interface open:', ui.isBattleInterfaceOpen());
  console.log('- Active battle notifications:', ui.battleNotifications.length);
  
  return ui;
};

window.resetUIManager = function() {
  const ui = window.debugUIManager();
  if (ui) {
    ui.resetFlags();
    console.log('✅ UIManager flags reset');
  }
};

// Quick admin commands for console - Enhanced with battle features
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

// NEW: Battle system debug commands
window.showBattle = function() {
  const ui = window.debugUIManager();
  if (ui) {
    ui.toggleBattleInterface();
  }
};

window.testBattleNotification = function(message = 'Test battle notification', type = 'battle-start') {
  const ui = window.debugUIManager();
  if (ui) {
    ui.showBattleNotification(message, type);
  }
};

window.UIManager = UIManager;