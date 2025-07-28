// src/ui/AdminPanel.js - Complete with Save/Load Integration

class AdminPanel extends BaseModal {
  constructor(scene) {
    super(scene, {
      width: 400,
      height: 800, // Increased height for save/load section
      x: window.innerWidth - 420,
      y: 20,
      title: '⚡ Admin Panel',
      closable: true
    });

    this.selectedPlayer = null;
    this.timeMultiplier = 1;
    this.godMode = false;
    this.autoSaveEnabled = false;
    this.currentSaveSystem = 'quick'; // 'quick' or 'full'
    
    // Override container styling for better visibility
    this.container.style.cssText = `
      position: fixed;
      left: ${window.innerWidth - 420}px;
      top: 20px;
      width: 400px;
      height: 800px;
      background: rgba(17, 24, 39, 0.98);
      border: 2px solid rgb(75, 85, 99);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      z-index: 2000;
      font-family: Arial, sans-serif;
      color: white;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      display: none;
    `;
    
    this.buildInterface();
    this.setupHotkeys();
    
    console.log('✅ AdminPanel created and styled');
  }

  show() {
    super.show();
    // Force visibility and bring to front
    this.container.style.display = 'flex';
    this.container.style.zIndex = '2000';
    console.log('⚡ AdminPanel show() called - should be visible now');
  }

  hide() {
    super.hide();
    this.container.style.display = 'none';
    console.log('⚡ AdminPanel hide() called');
  }

  // ==========================================
  // SAVE/LOAD SYSTEM INTEGRATION
  // ==========================================

  createSaveLoadSection() {
    if (!this.godMode) return;

    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(124, 58, 237, 0.1);
    `;

    const header = document.createElement('h3');
    header.textContent = '💾 Save & Load System';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    // Initialize persistence systems
    this.initializePersistenceSystems();

    // Save system selector
    this.createSaveSystemSelector(section);

    // Quick actions
    this.createQuickSaveActions(section);

    // Full save/load interface
    this.createFullSaveInterface(section);

    // Storage info
    this.createStorageInfo(section);

    this.addToContent(section);
  }

  initializePersistenceSystems() {
    // Initialize both persistence systems
    if (!this.gamePersistence) {
      this.gamePersistence = new GamePersistence();
    }
    if (!this.fullWorldPersistence) {
      this.fullWorldPersistence = new FullWorldPersistence();
    }
    if (!this.currentSaveSystem) {
      this.currentSaveSystem = 'quick'; // 'quick' or 'full'
    }
  }

  createSaveSystemSelector(section) {
    const selectorContainer = document.createElement('div');
    selectorContainer.style.cssText = `
      display: flex;
      margin-bottom: 12px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid rgb(75, 85, 99);
    `;

    const quickBtn = document.createElement('button');
    quickBtn.textContent = 'Quick Save (5MB)';
    quickBtn.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: none;
      background: ${this.currentSaveSystem === 'quick' ? '#7c3aed' : '#374151'};
      color: white;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.2s;
    `;
    quickBtn.onclick = () => this.switchSaveSystem('quick');

    const fullBtn = document.createElement('button');
    fullBtn.textContent = 'Full World (50MB)';
    fullBtn.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: none;
      background: ${this.currentSaveSystem === 'full' ? '#7c3aed' : '#374151'};
      color: white;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.2s;
    `;
    fullBtn.onclick = () => this.switchSaveSystem('full');

    selectorContainer.appendChild(quickBtn);
    selectorContainer.appendChild(fullBtn);
    section.appendChild(selectorContainer);

    // System description
    const description = document.createElement('div');
    description.style.cssText = `
      font-size: 10px;
      color: rgb(156, 163, 175);
      text-align: center;
      margin-bottom: 12px;
      padding: 6px;
      background: rgba(31, 41, 55, 0.5);
      border-radius: 4px;
    `;

    if (this.currentSaveSystem === 'quick') {
      description.innerHTML = `
        <strong>Quick Save:</strong> Game state only, world regenerated<br>
        Fast saves, smaller files, uses localStorage
      `;
    } else {
      description.innerHTML = `
        <strong>Full World:</strong> Complete terrain preservation<br>
        Perfect world recreation, larger files, uses IndexedDB
      `;
    }

    section.appendChild(description);
  }

  createQuickSaveActions(section) {
    const quickActions = document.createElement('div');
    quickActions.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;';

    const quickSaveBtn = document.createElement('button');
    quickSaveBtn.innerHTML = this.currentSaveSystem === 'quick' ? '⚡ Quick Save' : '🌍 Full Save';
    quickSaveBtn.style.cssText = `
      padding: 10px;
      border: none;
      border-radius: 4px;
      background: #059669;
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
    `;
    quickSaveBtn.onclick = () => this.performQuickSave();

    const quickLoadBtn = document.createElement('button');
    quickLoadBtn.innerHTML = this.currentSaveSystem === 'quick' ? '⚡ Quick Load' : '🌍 Full Load';
    quickLoadBtn.style.cssText = `
      padding: 10px;
      border: none;
      border-radius: 4px;
      background: #0d9488;
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
    `;
    quickLoadBtn.onclick = () => this.performQuickLoad();

    quickActions.appendChild(quickSaveBtn);
    quickActions.appendChild(quickLoadBtn);
    section.appendChild(quickActions);
  }

  createFullSaveInterface(section) {
    const interfaceContainer = document.createElement('div');
    interfaceContainer.style.cssText = 'margin-bottom: 12px;';

    // Save name input
    const saveNameInput = document.createElement('input');
    saveNameInput.type = 'text';
    saveNameInput.placeholder = 'Enter save name...';
    saveNameInput.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 8px;
      background: rgba(31, 41, 55, 0.9);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 4px;
      color: white;
      font-size: 12px;
      box-sizing: border-box;
    `;
    this.saveNameInput = saveNameInput;

    // Save dropdown (dynamically populated)
    const saveDropdown = document.createElement('select');
    saveDropdown.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 8px;
      background: rgba(31, 41, 55, 0.9);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 4px;
      color: white;
      font-size: 11px;
    `;
    this.saveDropdown = saveDropdown;

    // Update dropdown based on current system
    this.updateSaveDropdown();

    // Action buttons
    const actionButtons = document.createElement('div');
    actionButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Save';
    saveBtn.style.cssText = `
      padding: 8px;
      border: none;
      border-radius: 4px;
      background: rgba(124, 58, 237, 0.8);
      color: white;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.2s;
    `;
    saveBtn.onclick = () => this.saveToNamedSlot();

    const loadBtn = document.createElement('button');
    loadBtn.textContent = '📁 Load';
    loadBtn.style.cssText = `
      padding: 8px;
      border: none;
      border-radius: 4px;
      background: rgba(5, 150, 105, 0.8);
      color: white;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.2s;
    `;
    loadBtn.onclick = () => this.loadFromNamedSlot();

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.style.cssText = `
      padding: 8px;
      border: none;
      border-radius: 4px;
      background: rgba(239, 68, 68, 0.8);
      color: white;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.2s;
    `;
    deleteBtn.onclick = () => this.deleteNamedSlot();

    actionButtons.appendChild(saveBtn);
    actionButtons.appendChild(loadBtn);
    actionButtons.appendChild(deleteBtn);

    interfaceContainer.appendChild(saveNameInput);
    interfaceContainer.appendChild(saveDropdown);
    interfaceContainer.appendChild(actionButtons);
    section.appendChild(interfaceContainer);

    // Auto-save toggle (only for quick saves)
    if (this.currentSaveSystem === 'quick') {
      this.createAutoSaveToggle(section);
    }
  }

  createAutoSaveToggle(section) {
    const autoSaveContainer = document.createElement('div');
    autoSaveContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: rgba(31, 41, 55, 0.5);
      border-radius: 4px;
      margin-bottom: 8px;
    `;

    const autoSaveLabel = document.createElement('span');
    autoSaveLabel.textContent = 'Auto-save (5min):';
    autoSaveLabel.style.cssText = 'font-size: 11px; color: rgb(156, 163, 175);';

    const autoSaveToggle = document.createElement('button');
    autoSaveToggle.textContent = this.autoSaveEnabled ? 'ON' : 'OFF';
    autoSaveToggle.style.cssText = `
      padding: 4px 12px;
      border: none;
      border-radius: 3px;
      background: ${this.autoSaveEnabled ? '#059669' : '#6b7280'};
      color: white;
      cursor: pointer;
      font-size: 10px;
      font-weight: bold;
      transition: all 0.2s;
    `;
    autoSaveToggle.onclick = () => this.toggleAutoSave(autoSaveToggle);

    autoSaveContainer.appendChild(autoSaveLabel);
    autoSaveContainer.appendChild(autoSaveToggle);
    section.appendChild(autoSaveContainer);
  }

  createStorageInfo(section) {
    const storageContainer = document.createElement('div');
    storageContainer.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    `;

    // Quick save storage info
    const quickStorageInfo = this.gamePersistence.getStorageUsage();
    const quickInfo = document.createElement('div');
    quickInfo.style.cssText = `
      font-size: 10px;
      color: rgb(107, 114, 128);
      text-align: center;
      padding: 6px;
      background: rgba(31, 41, 55, 0.3);
      border-radius: 3px;
    `;
    quickInfo.innerHTML = `
      <div style="font-weight: bold; color: #10b981;">Quick Saves</div>
      <div>${quickStorageInfo.totalSizeMB}MB used</div>
      <div>${quickStorageInfo.slots.length} saves</div>
    `;

    // Full world storage info (placeholder for now)
    const fullInfo = document.createElement('div');
    fullInfo.style.cssText = `
      font-size: 10px;
      color: rgb(107, 114, 128);
      text-align: center;
      padding: 6px;
      background: rgba(31, 41, 55, 0.3);
      border-radius: 3px;
    `;
    fullInfo.innerHTML = `
      <div style="font-weight: bold; color: #7c3aed;">Full Worlds</div>
      <div>IndexedDB</div>
      <div>~10-20MB each</div>
    `;

    storageContainer.appendChild(quickInfo);
    storageContainer.appendChild(fullInfo);
    section.appendChild(storageContainer);
  }

  // ==========================================
  // SAVE/LOAD ACTION METHODS
  // ==========================================

  switchSaveSystem(system) {
    this.currentSaveSystem = system;
    this.buildInterface(); // Refresh interface
    console.log(`🔄 Switched to ${system} save system`);
  }

  async performQuickSave() {
    const slotName = this.currentSaveSystem === 'quick' ? 'quicksave' : 'fullworld_quick';
    
    try {
      if (this.currentSaveSystem === 'quick') {
        const result = this.gamePersistence.saveGame(
          this.scene, 
          slotName, 
          'Quick save from admin panel'
        );
        
        if (result.success) {
          this.showNotification('⚡ Quick saved successfully', 'success');
        } else {
          this.showNotification('❌ Quick save failed: ' + result.error, 'error');
        }
      } else {
        const result = await this.fullWorldPersistence.saveFullWorld(
          this.scene,
          slotName,
          'Full world quick save from admin panel'
        );
        
        if (result.success) {
          this.showNotification(`🌍 Full world saved (${(result.size/(1024*1024)).toFixed(1)}MB)`, 'success');
        } else {
          this.showNotification('❌ Full world save failed: ' + result.error, 'error');
        }
      }
    } catch (error) {
      this.showNotification('❌ Save failed: ' + error.message, 'error');
    }
  }

  async performQuickLoad() {
    const slotName = this.currentSaveSystem === 'quick' ? 'quicksave' : 'fullworld_quick';
    
    if (!confirm(`Load ${this.currentSaveSystem} save? Current progress will be lost.`)) {
      return;
    }

    try {
      if (this.currentSaveSystem === 'quick') {
        const loadResult = this.gamePersistence.loadGame(slotName);
        
        if (loadResult.success) {
          const restoreResult = this.gamePersistence.restoreGameState(this.scene, loadResult.gameState);
          
          if (restoreResult.success) {
            this.showNotification('⚡ Quick loaded successfully', 'success');
            this.buildInterface();
          } else {
            this.showNotification('❌ Restore failed: ' + restoreResult.error, 'error');
          }
        } else {
          this.showNotification('❌ Quick load failed: ' + loadResult.error, 'error');
        }
      } else {
        // For full world, we need to get the save ID from the slot name
        const saves = await this.fullWorldPersistence.getAllSaves();
        const targetSave = saves.find(s => s.name === slotName);
        
        if (targetSave) {
          const result = await this.fullWorldPersistence.loadFullWorld(targetSave.id, this.scene);
          
          if (result.success) {
            this.showNotification('🌍 Full world loaded successfully', 'success');
            this.buildInterface();
          } else {
            this.showNotification('❌ Full world load failed: ' + result.error, 'error');
          }
        } else {
          this.showNotification('❌ No full world quick save found', 'error');
        }
      }
    } catch (error) {
      this.showNotification('❌ Load failed: ' + error.message, 'error');
    }
  }

  async saveToNamedSlot() {
    const saveName = this.saveNameInput.value.trim();
    if (!saveName) {
      this.showNotification('❌ Please enter a save name', 'error');
      return;
    }

    try {
      if (this.currentSaveSystem === 'quick') {
        const result = this.gamePersistence.saveGame(
          this.scene, 
          saveName, 
          `Manual save: ${saveName}`
        );

        if (result.success) {
          this.showNotification(`💾 Saved as "${saveName}"`, 'success');
          this.updateSaveDropdown();
          this.saveNameInput.value = '';
        } else {
          this.showNotification('❌ Save failed: ' + result.error, 'error');
        }
      } else {
        const result = await this.fullWorldPersistence.saveFullWorld(
          this.scene,
          saveName,
          `Full world save: ${saveName}`
        );

        if (result.success) {
          this.showNotification(`🌍 Full world saved as "${saveName}" (${(result.size/(1024*1024)).toFixed(1)}MB)`, 'success');
          this.updateSaveDropdown();
          this.saveNameInput.value = '';
        } else {
          this.showNotification('❌ Full world save failed: ' + result.error, 'error');
        }
      }
    } catch (error) {
      this.showNotification('❌ Save failed: ' + error.message, 'error');
    }
  }

  async loadFromNamedSlot() {
    const selectedValue = this.saveDropdown.value;
    if (!selectedValue) {
      this.showNotification('❌ Please select a save slot', 'error');
      return;
    }

    const [saveName, saveId] = selectedValue.split('|');
    
    if (!confirm(`Load "${saveName}"? Current progress will be lost.`)) {
      return;
    }

    try {
      if (this.currentSaveSystem === 'quick') {
        const loadResult = this.gamePersistence.loadGame(saveName);
        
        if (loadResult.success) {
          const restoreResult = this.gamePersistence.restoreGameState(this.scene, loadResult.gameState);
          
          if (restoreResult.success) {
            this.showNotification(`💾 Loaded "${saveName}"`, 'success');
            this.buildInterface();
          } else {
            this.showNotification('❌ Restore failed: ' + restoreResult.error, 'error');
          }
        } else {
          this.showNotification('❌ Load failed: ' + loadResult.error, 'error');
        }
      } else {
        const result = await this.fullWorldPersistence.loadFullWorld(saveId, this.scene);
        
        if (result.success) {
          this.showNotification(`🌍 Loaded "${saveName}"`, 'success');
          this.buildInterface();
        } else {
          this.showNotification('❌ Full world load failed: ' + result.error, 'error');
        }
      }
    } catch (error) {
      this.showNotification('❌ Load failed: ' + error.message, 'error');
    }
  }

  async deleteNamedSlot() {
    const selectedValue = this.saveDropdown.value;
    if (!selectedValue) {
      this.showNotification('❌ Please select a save slot', 'error');
      return;
    }

    const [saveName, saveId] = selectedValue.split('|');
    
    if (!confirm(`Delete save "${saveName}"?`)) {
      return;
    }

    try {
      if (this.currentSaveSystem === 'quick') {
        if (this.gamePersistence.deleteSave(saveName)) {
          this.showNotification(`🗑️ Deleted "${saveName}"`, 'success');
          this.updateSaveDropdown();
        } else {
          this.showNotification('❌ Delete failed', 'error');
        }
      } else {
        // For full world saves, we'd need to implement deletion in FullWorldPersistence
        // For now, show a placeholder message
        this.showNotification('🚧 Full world save deletion not yet implemented', 'warning');
      }
    } catch (error) {
      this.showNotification('❌ Delete failed: ' + error.message, 'error');
    }
  }

  async updateSaveDropdown() {
    if (!this.saveDropdown) return;

    this.saveDropdown.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select save slot...';
    defaultOption.style.background = 'rgb(31, 41, 55)';
    this.saveDropdown.appendChild(defaultOption);

    try {
      if (this.currentSaveSystem === 'quick') {
        const saves = this.gamePersistence.getSaveSlots();
        saves.forEach(save => {
          const option = document.createElement('option');
          option.value = save.name;
          const date = new Date(save.timestamp).toLocaleDateString();
          const time = new Date(save.timestamp).toLocaleTimeString();
          const size = (save.size / 1024).toFixed(1);
          option.textContent = `${save.name} (${date} ${time}) [${size}KB]`;
          option.style.background = 'rgb(31, 41, 55)';
          option.style.color = save.isValid ? 'white' : '#ef4444';
          this.saveDropdown.appendChild(option);
        });
      } else {
        const saves = await this.fullWorldPersistence.getAllSaves();
        saves.forEach(save => {
          const option = document.createElement('option');
          option.value = `${save.name}|${save.id}`;
          const date = new Date(save.timestamp).toLocaleDateString();
          const time = new Date(save.timestamp).toLocaleTimeString();
          const size = (save.metadata.compressedSize / (1024 * 1024)).toFixed(1);
          option.textContent = `${save.name} (${date} ${time}) [${size}MB]`;
          option.style.background = 'rgb(31, 41, 55)';
          option.style.color = 'white';
          this.saveDropdown.appendChild(option);
        });
      }
    } catch (error) {
      console.warn('Could not update save dropdown:', error);
    }
  }

  toggleAutoSave(toggleButton) {
    this.autoSaveEnabled = !this.autoSaveEnabled;

    if (this.autoSaveEnabled) {
      this.gamePersistence.startAutoSave(this.scene, 5); // 5 minute intervals
      toggleButton.textContent = 'ON';
      toggleButton.style.background = '#059669';
      this.showNotification('⏰ Auto-save enabled (5min)', 'success');
    } else {
      this.gamePersistence.stopAutoSave();
      toggleButton.textContent = 'OFF';
      toggleButton.style.background = '#6b7280';
      this.showNotification('⏰ Auto-save disabled', 'info');
    }
  }

  // ==========================================
  // EXISTING METHODS (keeping all existing functionality)
  // ==========================================

  createUnitControlSection() {
    if (!this.godMode) return;

    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(59, 130, 246, 0.1);
    `;

    const header = document.createElement('h3');
    header.textContent = '🎮 Unit Control';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    // Unit selector dropdown
    const unitSelector = document.createElement('select');
    unitSelector.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 12px;
      background: rgba(31, 41, 55, 0.9);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 4px;
      color: white;
      font-size: 12px;
    `;

    // Populate with all units
    const allUnits = this.scene.gameWorld.getAllUnits();
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a unit...';
    defaultOption.style.background = 'rgb(31, 41, 55)';
    unitSelector.appendChild(defaultOption);

    allUnits.forEach((unit, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${unit.owner.name} ${unit.type} [${unit.coords[0]}, ${unit.coords[1]}] HP:${unit.hp}/${unit.maxHp}`;
      option.style.background = 'rgb(31, 41, 55)';
      option.style.color = `#${unit.owner.color.toString(16).padStart(6, '0')}`;
      unitSelector.appendChild(option);
    });

    unitSelector.onchange = (e) => {
      if (e.target.value) {
        this.controlledUnit = allUnits[e.target.value];
        this.scene.uiManager.selectEntity(this.controlledUnit);
        console.log(`🎮 Selected unit: ${this.controlledUnit.type} at [${this.controlledUnit.coords[0]}, ${this.controlledUnit.coords[1]}]`);
        this.buildInterface();
      } else {
        this.controlledUnit = null;
      }
    };

    section.appendChild(unitSelector);

    // Selected unit info and controls (keeping existing implementation)
    if (this.controlledUnit && this.controlledUnit.isAlive()) {
      const unitInfo = document.createElement('div');
      unitInfo.style.cssText = `
        background: rgba(31, 41, 55, 0.6);
        padding: 8px;
        border-radius: 4px;
        font-size: 11px;
        color: rgb(156, 163, 175);
        border: 1px solid rgba(75, 85, 99, 0.5);
        margin-bottom: 12px;
      `;
      
      const stats = this.controlledUnit.getCombatStats();
      unitInfo.innerHTML = `
        <div style="color: #${this.controlledUnit.owner.color.toString(16).padStart(6, '0')}; font-weight: bold; margin-bottom: 4px;">
          ${this.controlledUnit.type} (Level ${stats.level})
        </div>
        <div>Position: [${this.controlledUnit.coords[0]}, ${this.controlledUnit.coords[1]}]</div>
        <div>HP: ${stats.hp}/${stats.maxHp} | ATK: ${stats.attack} | DEF: ${stats.defense} | RNG: ${stats.range}</div>
        <div>Experience: ${stats.experience} | Owner: ${this.controlledUnit.owner.name}</div>
        ${this.controlledUnit.destination ? `<div style="color: #10b981;">Moving to [${this.controlledUnit.destination.q}, ${this.controlledUnit.destination.r}]</div>` : ''}
      `;
      section.appendChild(unitInfo);

      // Control buttons (keeping existing implementation)
      const controlButtons = document.createElement('div');
      controlButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;';

      const controlActions = [
        { label: '🏃 Move Here', action: () => this.startMoveOrder(), color: '#10b981' },
        { label: '⚔️ Attack Target', action: () => this.startAttackOrder(), color: '#ef4444' },
        { label: '🎯 Chase Unit', action: () => this.startChaseOrder(), color: '#f59e0b' },
        { label: '🛑 Stop Orders', action: () => this.stopUnitOrders(), color: '#6b7280' },
        { label: '💚 Heal Target', action: () => this.startHealOrder(), color: '#22c55e' },
        { label: '🔄 Auto Battle', action: () => this.toggleAutoBattle(), color: '#8b5cf6' }
      ];

      controlActions.forEach(({ label, action, color }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
          padding: 8px;
          border: none;
          border-radius: 4px;
          background: ${color};
          color: white;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s;
        `;
        
        btn.onmouseover = () => {
          btn.style.transform = 'scale(1.05)';
          btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        };
        
        btn.onmouseout = () => {
          btn.style.transform = 'scale(1)';
          btn.style.boxShadow = 'none';
        };
        
        btn.onclick = action;
        controlButtons.appendChild(btn);
      });

      section.appendChild(controlButtons);

      // Quick unit stats modification (god mode)
      const statsSection = document.createElement('div');
      statsSection.style.cssText = `
        background: rgba(168, 85, 247, 0.1);
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 8px;
      `;

      const statsTitle = document.createElement('div');
      statsTitle.textContent = '⚡ Quick Modifications';
      statsTitle.style.cssText = 'font-size: 12px; font-weight: bold; margin-bottom: 6px; color: white;';
      statsSection.appendChild(statsTitle);

      const quickMods = document.createElement('div');
      quickMods.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;';

      const modActions = [
        { label: '+10 HP', action: () => this.modifyUnit('hp', 10) },
        { label: '+5 ATK', action: () => this.modifyUnit('attack', 5) },
        { label: '+5 DEF', action: () => this.modifyUnit('defense', 5) },
        { label: 'Full Heal', action: () => this.modifyUnit('heal', 0) },
        { label: '+1 Range', action: () => this.modifyUnit('range', 1) },
        { label: 'Level Up', action: () => this.modifyUnit('levelup', 0) }
      ];

      modActions.forEach(({ label, action }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
          padding: 4px;
          border: none;
          border-radius: 3px;
          background: rgba(168, 85, 247, 0.7);
          color: white;
          cursor: pointer;
          font-size: 10px;
          transition: all 0.2s;
        `;
        btn.onclick = action;
        quickMods.appendChild(btn);
      });

      statsSection.appendChild(quickMods);
      section.appendChild(statsSection);
    }

    // Instructions
    const instructions = document.createElement('div');
    instructions.textContent = this.controlledUnit ? 
      'Click buttons then click on map for orders' : 
      'Select a unit from dropdown to control';
    instructions.style.cssText = `
      text-align: center;
      color: rgb(156, 163, 175);
      font-size: 11px;
      font-style: italic;
    `;
    section.appendChild(instructions);

    this.addToContent(section);
  }

  // Unit control methods
  startMoveOrder() {
    if (!this.controlledUnit) return;
    console.log(`🏃 Click on map to move ${this.controlledUnit.type}`);
    this.orderMode = { type: 'move', unit: this.controlledUnit };
    this.setupOrderListener();
  }

  startAttackOrder() {
    if (!this.controlledUnit) return;
    console.log(`⚔️ Click on enemy unit to attack with ${this.controlledUnit.type}`);
    this.orderMode = { type: 'attack', unit: this.controlledUnit };
    this.setupOrderListener();
  }

  startChaseOrder() {
    if (!this.controlledUnit) return;
    console.log(`🎯 Click on enemy unit to chase and attack with ${this.controlledUnit.type}`);
    this.orderMode = { type: 'chase', unit: this.controlledUnit };
    this.setupOrderListener();
  }

  startHealOrder() {
    if (!this.controlledUnit) return;
    console.log(`💚 Click on friendly unit to heal with ${this.controlledUnit.type}`);
    this.orderMode = { type: 'heal', unit: this.controlledUnit };
    this.setupOrderListener();
  }

  stopUnitOrders() {
    if (!this.controlledUnit) return;
    this.controlledUnit.destination = null;
    this.controlledUnit.mission = null;
    this.controlledUnit.chaseTarget = null;
    console.log(`🛑 Stopped all orders for ${this.controlledUnit.type}`);
    this.buildInterface();
  }

  toggleAutoBattle() {
    if (!this.controlledUnit) return;
    
    this.controlledUnit.autoBattle = !this.controlledUnit.autoBattle;
    if (this.controlledUnit.autoBattle) {
      console.log(`🤖 ${this.controlledUnit.type} auto-battle ENABLED`);
      this.startUnitAutoBattle(this.controlledUnit);
    } else {
      console.log(`🤖 ${this.controlledUnit.type} auto-battle DISABLED`);
    }
    this.buildInterface();
  }

  modifyUnit(type, amount) {
    if (!this.controlledUnit) return;
    
    switch(type) {
      case 'hp':
        this.controlledUnit.maxHp += amount;
        this.controlledUnit.hp += amount;
        break;
      case 'attack':
        this.controlledUnit.attack = (this.controlledUnit.attack || 0) + amount;
        break;
      case 'defense':
        this.controlledUnit.defense = (this.controlledUnit.defense || 0) + amount;
        break;
      case 'range':
        this.controlledUnit.range = (this.controlledUnit.range || 1) + amount;
        break;
      case 'heal':
        this.controlledUnit.hp = this.controlledUnit.maxHp;
        break;
      case 'levelup':
        this.controlledUnit.gainExperience(100); // Force level up
        break;
    }
    
    console.log(`⚡ Modified ${this.controlledUnit.type}: ${type} ${amount > 0 ? '+' : ''}${amount}`);
    this.buildInterface();
  }

  // Enhanced order listener with chase functionality
  setupOrderListener() {
    const orderListener = (pointer) => {
      if (!this.orderMode) return;

      const [q, r] = pixelToHex(pointer.worldX, pointer.worldY);
      const unit = this.orderMode.unit;

      if (this.orderMode.type === 'move') {
        unit.moveTo([q, r]);
        console.log(`🏃 ${unit.type} ordered to move to [${q}, ${r}]`);
        
      } else if (this.orderMode.type === 'attack') {
        const target = this.scene.gameWorld.getUnitAt(q, r);
        if (target && target.owner !== unit.owner) {
          const result = unit.attackUnit(target);
          console.log(`⚔️ Attack result:`, result);
        } else {
          console.warn('❌ No valid enemy target at that location');
        }
        
      } else if (this.orderMode.type === 'chase') {
        const target = this.scene.gameWorld.getUnitAt(q, r);
        if (target && target.owner !== unit.owner) {
          unit.chaseTarget = target;
          unit.mission = { type: 'chase', target: target };
          this.startChaseSequence(unit, target);
          console.log(`🎯 ${unit.type} now chasing ${target.type}`);
        } else {
          console.warn('❌ No valid enemy target to chase');
        }
        
      } else if (this.orderMode.type === 'heal') {
        const target = this.scene.gameWorld.getUnitAt(q, r);
        if (target && target.owner === unit.owner && unit.healUnit) {
          unit.healUnit(target);
        } else {
          console.warn('❌ No valid friendly target to heal');
        }
      }

      // Remove listener after one use
      this.scene.input.off('pointerdown', orderListener);
      this.orderMode = null;
      this.buildInterface();
    };

    this.scene.input.once('pointerdown', orderListener);
  }

  // Chase sequence - unit follows target and attacks when in range
  startChaseSequence(chaser, target) {
    const chaseUpdate = () => {
      if (!chaser.isAlive() || !target.isAlive() || !chaser.chaseTarget) {
        return; // Stop chasing
      }

      // Move towards target
      const [chaserQ, chaserR] = chaser.coords;
      const [targetQ, targetR] = target.coords;
      
      // Check if in attack range
      if (chaser.canAttack(target)) {
        // Attack!
        const result = chaser.attackUnit(target);
        console.log(`🎯 Chase attack: ${chaser.type} → ${target.type}`, result);
        
        // Continue chasing if target survives
        if (target.isAlive()) {
          setTimeout(chaseUpdate, 1000); // Attack every second
        }
      } else {
        // Move closer
        chaser.moveTo([targetQ, targetR]);
        setTimeout(chaseUpdate, 500); // Check every half second
      }
    };

    chaseUpdate();
  }

  // Auto-battle for individual units
  startUnitAutoBattle(unit) {
    if (!unit.autoBattle || !unit.isAlive()) return;

    const battleUpdate = () => {
      if (!unit.autoBattle || !unit.isAlive()) return;

      // Find nearest enemy
      const allUnits = this.scene.gameWorld.getAllUnits();
      const enemies = allUnits.filter(other => 
        other.owner !== unit.owner && 
        other.isAlive() && 
        unit.hexDistance(...unit.coords, ...other.coords) <= 5 // Within 5 hexes
      );

      if (enemies.length > 0) {
        // Attack closest enemy if in range
        const closest = enemies.reduce((prev, curr) => {
          const prevDist = unit.hexDistance(...unit.coords, ...prev.coords);
          const currDist = unit.hexDistance(...unit.coords, ...curr.coords);
          return currDist < prevDist ? curr : prev;
        });

        if (unit.canAttack(closest)) {
          unit.attackUnit(closest);
        } else {
          // Move towards closest enemy
          unit.moveTo(closest.coords);
        }
      }

      // Continue auto-battle
      setTimeout(battleUpdate, 1500);
    };

    battleUpdate();
  }

  buildInterface() {
    this.clearContent();

    // God Mode Toggle
    this.createGodModeSection();
    
    // Player Management
    this.createPlayerSection();
    
    // Resource Management (only if god mode)
    if (this.godMode) {
      this.createResourceSection();
    }
    
    // Save/Load System (only if god mode) - NEW SECTION
    if (this.godMode) {
      this.createSaveLoadSection();
    }
    
    // Time Controls
    this.createTimeSection();
    
    // Entity Spawning (only if god mode)
    if (this.godMode) {
      this.createSpawningSection();
      this.createUnitControlSection();
    }
    
    // World Controls (only if god mode)
    if (this.godMode) {
      this.createWorldSection();
    }
    
    // Debug Information
    this.createDebugSection();
  }

  createGodModeSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(139, 69, 19, 0.2);
    `;

    const toggle = document.createElement('button');
    toggle.textContent = this.godMode ? '⚡ God Mode: ON' : '🔒 God Mode: OFF';
    toggle.style.cssText = `
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 6px;
      background: ${this.godMode ? '#dc2626' : '#16a34a'};
      color: white;
      font-weight: bold;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    `;
    
    toggle.onmouseover = () => {
      toggle.style.transform = 'scale(1.02)';
    };
    
    toggle.onmouseout = () => {
      toggle.style.transform = 'scale(1)';
    };
    
    toggle.onclick = () => {
      this.godMode = !this.godMode;
      this.buildInterface();
      console.log(`⚡ God Mode: ${this.godMode ? 'ENABLED' : 'DISABLED'}`);
    };

    section.appendChild(toggle);
    this.addToContent(section);
  }

  createPlayerSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
    `;

    const header = document.createElement('h3');
    header.textContent = '👥 Player Management';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    // Player selector
    const playerSelect = document.createElement('select');
    playerSelect.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 12px;
      background: rgba(31, 41, 55, 0.9);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 4px;
      color: white;
      font-size: 14px;
    `;

    const players = this.scene.gameWorld.players || [];
    players.forEach((player, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${player.name} (${player.buildings.length} buildings, ${player.units.length} units)`;
      option.style.background = 'rgb(31, 41, 55)';
      playerSelect.appendChild(option);
    });

    playerSelect.onchange = (e) => {
      this.selectedPlayer = players[e.target.value];
      this.buildInterface();
    };

    if (!this.selectedPlayer && players.length > 0) {
      this.selectedPlayer = players[0];
    }

    section.appendChild(playerSelect);

    // Player info
    if (this.selectedPlayer) {
      const info = document.createElement('div');
      info.style.cssText = `
        background: rgba(31, 41, 55, 0.6);
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        color: rgb(156, 163, 175);
        border: 1px solid rgba(75, 85, 99, 0.5);
      `;
      
      const resources = this.selectedPlayer.resources;
      info.innerHTML = `
        <div style="color: #${this.selectedPlayer.color.toString(16).padStart(6, '0')}; font-weight: bold; margin-bottom: 4px;">
          ${this.selectedPlayer.name}
        </div>
        <div>Buildings: ${this.selectedPlayer.buildings.length} | Units: ${this.selectedPlayer.units.length}</div>
        <div>Food: ${resources.food} | Wood: ${resources.wood} | Stone: ${resources.stone} | Iron: ${resources.iron}</div>
      `;
      section.appendChild(info);
    }

    this.addToContent(section);
  }

  createResourceSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(34, 197, 94, 0.1);
    `;

    const header = document.createElement('h3');
    header.textContent = '💰 Resource Control';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    // Quick resource buttons
    const quickButtons = document.createElement('div');
    quickButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;';

    const resourceAmounts = [
      { label: '+1K All', amount: 1000, color: '#10b981' },
      { label: '+10K All', amount: 10000, color: '#059669' },
      { label: 'Max All', amount: 999999, color: '#047857' },
      { label: 'Clear All', amount: 0, color: '#dc2626' }
    ];

    resourceAmounts.forEach(({ label, amount, color }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = `
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: ${color};
        color: white;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
      `;
      
      btn.onmouseover = () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      };
      
      btn.onmouseout = () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
      };
      
      btn.onclick = () => this.giveResources(amount);
      quickButtons.appendChild(btn);
    });

    section.appendChild(quickButtons);
    this.addToContent(section);
  }

  createTimeSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
    `;

    const header = document.createElement('h3');
    header.textContent = '⏰ Time Controls';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    // Time speed buttons
    const speedButtons = document.createElement('div');
    speedButtons.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px;';

    const speeds = [
      { label: '0.5x', multiplier: 0.5 },
      { label: '1x', multiplier: 1 },
      { label: '2x', multiplier: 2 },
      { label: '5x', multiplier: 5 }
    ];

    speeds.forEach(({ label, multiplier }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      const isActive = this.timeMultiplier === multiplier;
      btn.style.cssText = `
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: ${isActive ? '#3b82f6' : '#6b7280'};
        color: white;
        cursor: pointer;
        font-size: 12px;
        font-weight: ${isActive ? 'bold' : 'normal'};
        transition: all 0.2s;
      `;
      
      btn.onmouseover = () => {
        if (!isActive) {
          btn.style.background = '#9ca3af';
        }
      };
      
      btn.onmouseout = () => {
        if (!isActive) {
          btn.style.background = '#6b7280';
        }
      };
      
      btn.onclick = () => this.setTimeSpeed(multiplier);
      speedButtons.appendChild(btn);
    });

    section.appendChild(speedButtons);

    // Current speed display
    const speedDisplay = document.createElement('div');
    speedDisplay.textContent = `Current Speed: ${this.timeMultiplier}x`;
    speedDisplay.style.cssText = `
      text-align: center;
      color: rgb(156, 163, 175);
      font-size: 12px;
      font-weight: bold;
    `;
    section.appendChild(speedDisplay);

    this.addToContent(section);
  }

  createSpawningSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(168, 85, 247, 0.1);
    `;

    const header = document.createElement('h3');
    header.textContent = '🏗️ Entity Spawning';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    // Quick spawn buttons
    const spawnButtons = document.createElement('div');
    spawnButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;';

    const spawnOptions = [
      { label: 'Worker', action: () => this.spawnUnit('Worker') },
      { label: 'Builder', action: () => this.spawnUnit('Builder') },
      { label: 'FootSoldier', action: () => this.spawnUnit('FootSoldier') },
      { label: 'House', action: () => this.spawnBuilding('House') },
      { label: 'LumberCamp', action: () => this.spawnBuilding('LumberCamp') },
      { label: 'Barracks', action: () => this.spawnBuilding('Barracks') }
    ];

    spawnOptions.forEach(({ label, action }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = `
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: rgba(168, 85, 247, 0.8);
        color: white;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      `;
      
      btn.onmouseover = () => {
        btn.style.background = 'rgba(168, 85, 247, 1)';
        btn.style.transform = 'scale(1.02)';
      };
      
      btn.onmouseout = () => {
        btn.style.background = 'rgba(168, 85, 247, 0.8)';
        btn.style.transform = 'scale(1)';
      };
      
      btn.onclick = action;
      spawnButtons.appendChild(btn);
    });

    section.appendChild(spawnButtons);

    // Instructions
    const instructions = document.createElement('div');
    instructions.textContent = 'Click on the map after selecting spawn type';
    instructions.style.cssText = `
      margin-top: 8px;
      text-align: center;
      color: rgb(156, 163, 175);
      font-size: 11px;
      font-style: italic;
    `;
    section.appendChild(instructions);

    this.addToContent(section);
  }

  createWorldSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(239, 68, 68, 0.1);
    `;

    const header = document.createElement('h3');
    header.textContent = '🌍 World Controls';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    const worldButtons = document.createElement('div');
    worldButtons.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

    const worldActions = [
      { label: '🎯 Center on Human Player', action: () => this.centerOnPlayer() },
      { label: '🔄 Regenerate World', action: () => this.regenerateWorld() },
      { label: '💀 Kill All Units', action: () => this.killAllUnits() },
      { label: '🏗️ Complete All Buildings', action: () => this.completeAllBuildings() }
    ];

    worldActions.forEach(({ label, action }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = `
        padding: 10px;
        border: none;
        border-radius: 4px;
        background: rgba(239, 68, 68, 0.8);
        color: white;
        cursor: pointer;
        font-size: 12px;
        text-align: left;
        font-weight: 500;
        transition: all 0.2s;
      `;
      
      btn.onmouseover = () => {
        btn.style.background = 'rgba(239, 68, 68, 1)';
        btn.style.transform = 'translateX(2px)';
      };
      
      btn.onmouseout = () => {
        btn.style.background = 'rgba(239, 68, 68, 0.8)';
        btn.style.transform = 'translateX(0)';
      };
      
      btn.onclick = action;
      worldButtons.appendChild(btn);
    });

    section.appendChild(worldButtons);
    this.addToContent(section);
  }

  createDebugSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
    `;

    const header = document.createElement('h3');
    header.textContent = '🔧 Debug Info';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    const debugInfo = document.createElement('div');
    debugInfo.style.cssText = `
      background: rgba(31, 41, 55, 0.6);
      padding: 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: rgb(156, 163, 175);
      border: 1px solid rgba(75, 85, 99, 0.5);
    `;

    const players = this.scene.gameWorld.players || [];
    const totalUnits = players.reduce((sum, p) => sum + p.units.length, 0);
    const totalBuildings = players.reduce((sum, p) => sum + p.buildings.length, 0);
    const tickCount = this.scene.tickCount || 0;

    debugInfo.innerHTML = `
      <div style="color: #10b981;">Tick: ${tickCount}</div>
      <div>Players: ${players.length}</div>
      <div>Total Units: ${totalUnits}</div>
      <div>Total Buildings: ${totalBuildings}</div>
      <div style="color: #f59e0b;">Time Speed: ${this.timeMultiplier}x</div>
      <div style="color: ${this.godMode ? '#ef4444' : '#10b981'};">God Mode: ${this.godMode ? 'ON' : 'OFF'}</div>
    `;

    section.appendChild(debugInfo);
    this.addToContent(section);
  }

  // Action Methods
  giveResources(amount) {
    if (!this.selectedPlayer) return;

    if (amount === 0) {
      // Clear all resources
      Object.keys(this.selectedPlayer.resources).forEach(resource => {
        this.selectedPlayer.resources[resource] = 0;
      });
      console.log(`💰 Cleared all resources for ${this.selectedPlayer.name}`);
    } else {
      // Add to all resources
      Object.keys(this.selectedPlayer.resources).forEach(resource => {
        this.selectedPlayer.resources[resource] = (this.selectedPlayer.resources[resource] || 0) + amount;
      });
      console.log(`💰 Gave ${amount} of all resources to ${this.selectedPlayer.name}`);
    }

    this.buildInterface();
  }

  setTimeSpeed(multiplier) {
    this.timeMultiplier = multiplier;
    
    // Update the game's tick interval if possible
    if (this.scene.setTimeSpeed) {
      this.scene.setTimeSpeed(multiplier);
    }
    
    console.log(`⏰ Time speed set to ${multiplier}x`);
    this.buildInterface();
  }

  spawnUnit(unitType) {
    console.log(`👤 Click on map to spawn ${unitType}`);
    this.spawnMode = { type: 'unit', unitType };
    this.setupSpawnListener();
  }

  spawnBuilding(buildingType) {
    console.log(`🏗️ Click on map to spawn ${buildingType}`);
    this.spawnMode = { type: 'building', buildingType };
    this.setupSpawnListener();
  }

  setupSpawnListener() {
    // Add temporary click listener for spawning
    const spawnListener = (pointer) => {
      if (!this.spawnMode || !this.selectedPlayer) return;

      const [q, r] = pixelToHex(pointer.worldX, pointer.worldY);
      
      if (this.spawnMode.type === 'unit') {
        const UnitClass = window[this.spawnMode.unitType];
        if (UnitClass) {
          this.selectedPlayer.spawnUnit(UnitClass, [q, r]);
          console.log(`👤 Spawned ${this.spawnMode.unitType} at [${q}, ${r}]`);
        }
      } else if (this.spawnMode.type === 'building') {
        const BuildingClass = window[this.spawnMode.buildingType];
        if (BuildingClass) {
          // Give resources temporarily if in god mode
          if (this.godMode) {
            const originalResources = { ...this.selectedPlayer.resources };
            // Give enough resources
            Object.keys(this.selectedPlayer.resources).forEach(resource => {
              this.selectedPlayer.resources[resource] += 10000;
            });
            
            const success = this.selectedPlayer.build(BuildingClass, [q, r]);
            
            if (success) {
              console.log(`🏗️ Spawned ${this.spawnMode.buildingType} at [${q}, ${r}]`);
            } else {
              // Restore resources if failed
              this.selectedPlayer.resources = originalResources;
              console.log(`❌ Failed to spawn ${this.spawnMode.buildingType} at [${q}, ${r}]`);
            }
          } else {
            this.selectedPlayer.build(BuildingClass, [q, r]);
          }
        }
      }

      // Remove listener after one use
      this.scene.input.off('pointerdown', spawnListener);
      this.spawnMode = null;
    };

    this.scene.input.once('pointerdown', spawnListener);
  }

  centerOnPlayer() {
    if (!this.selectedPlayer || !this.selectedPlayer.startCoords) {
      console.warn('No player start coordinates found');
      return;
    }

    const [q, r] = this.selectedPlayer.startCoords;
    const [x, y] = hexToPixel(q, r);
    this.scene.cameras.main.centerOn(x, y);
    console.log(`🎯 Centered camera on ${this.selectedPlayer.name} at [${q}, ${r}]`);
  }

  regenerateWorld() {
    if (confirm('Regenerate world? This will destroy all current progress!')) {
      console.log('🔄 Regenerating world...');
      // This would need to be implemented in your HexMap class
      if (this.scene.map.regenerateWorld) {
        this.scene.map.regenerateWorld();
      } else {
        console.warn('World regeneration not implemented yet');
      }
    }
  }

  killAllUnits() {
    if (confirm('Kill all units on the map?')) {
      let totalKilled = 0;
      this.scene.gameWorld.players.forEach(player => {
        totalKilled += player.units.length;
        player.units.forEach(unit => unit.destroy());
        player.units = [];
      });
      console.log(`💀 Killed ${totalKilled} units`);
      this.buildInterface(); // Refresh display
    }
  }

  completeAllBuildings() {
    let totalCompleted = 0;
    this.scene.gameWorld.players.forEach(player => {
      player.buildings.forEach(building => {
        if (!building.completed) {
          building.completed = true;
          building.ticksBuild = building.buildTime;
          totalCompleted++;
        }
      });
    });
    console.log(`🏗️ Completed ${totalCompleted} buildings`);
    this.buildInterface(); // Refresh display
  }

  setupHotkeys() {
    // Admin panel hotkey (F12 or ~) - handled by UIManager now
    // Just keeping this method for consistency
  }

  // Override base modal methods
  onShow() {
    this.buildInterface();
    console.log('⚡ Admin Panel opened - interface built');
  }

  onHide() {
    console.log('⚡ Admin Panel closed');
  }

  // Debug method to force visibility
  forceShow() {
    this.container.style.display = 'flex';
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '1';
    this.container.style.zIndex = '9999';
    this.isVisible = true;
    this.buildInterface();
    console.log('🔧 Force showing admin panel with debug styling');
    
    // Log container position and size
    const rect = this.container.getBoundingClientRect();
    console.log('📍 Admin panel position:', {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      visible: this.container.style.display !== 'none'
    });
  }

  // Debug method to test if DOM element exists
  debugElement() {
    console.log('🔧 AdminPanel Debug:');
    console.log('- Container exists:', !!this.container);
    console.log('- Container in DOM:', document.body.contains(this.container));
    console.log('- Container display:', this.container?.style.display);
    console.log('- Container zIndex:', this.container?.style.zIndex);
    console.log('- isVisible flag:', this.isVisible);
    
    if (this.container) {
      const rect = this.container.getBoundingClientRect();
      console.log('- Position:', { x: rect.left, y: rect.top, w: rect.width, h: rect.height });
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 140px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-size: 13px;
      font-weight: 500;
      z-index: 3000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;

    const colors = {
      success: '#059669',
      error: '#dc2626',
      info: '#0ea5e9',
      warning: '#d97706'
    };
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Debug functions for browser console
window.debugAdminPanel = function() {
  const scene = window.game?.scene?.getScene('MainScene');
  const panel = scene?.uiManager?.adminPanel;
  
  if (!panel) {
    console.error('❌ AdminPanel not found');
    return null;
  }
  
  panel.debugElement();
  return panel;
};

window.forceShowAdmin = function() {
  const panel = window.debugAdminPanel();
  if (panel) {
    panel.forceShow();
  }
};

window.AdminPanel = AdminPanel;