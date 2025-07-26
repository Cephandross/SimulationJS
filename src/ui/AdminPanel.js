// src/ui/AdminPanel.js - God Mode Development Tools

class AdminPanel extends BaseModal {
  constructor(scene) {
    super(scene, {
      width: 400,
      height: 700,
      x: window.innerWidth - 420,
      y: 20,
      title: '⚡ Admin Panel',
      closable: true
    });

    this.selectedPlayer = null;
    this.timeMultiplier = 1;
    this.godMode = false;
    
    this.buildInterface();
    this.setupHotkeys();
  }

  buildInterface() {
    this.clearContent();

    // God Mode Toggle
    this.createGodModeSection();
    
    // Player Management
    this.createPlayerSection();
    
    // Resource Management
    this.createResourceSection();
    
    // Time Controls
    this.createTimeSection();
    
    // Entity Spawning
    this.createSpawningSection();
    
    // World Controls
    this.createWorldSection();
    
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
    `;
    
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
      background: rgba(31, 41, 55, 0.8);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 4px;
      color: white;
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
        background: rgba(31, 41, 55, 0.5);
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        color: rgb(156, 163, 175);
      `;
      
      const resources = this.selectedPlayer.resources;
      info.innerHTML = `
        <div><strong style="color: white;">${this.selectedPlayer.name}</strong></div>
        <div>Buildings: ${this.selectedPlayer.buildings.length} | Units: ${this.selectedPlayer.units.length}</div>
        <div>Resources: Food ${resources.food}, Wood ${resources.wood}, Stone ${resources.stone}</div>
      `;
      section.appendChild(info);
    }

    this.addToContent(section);
  }

  createResourceSection() {
    if (!this.godMode) return;

    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
    `;

    const header = document.createElement('h3');
    header.textContent = '💰 Resource Control';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    // Quick resource buttons
    const quickButtons = document.createElement('div');
    quickButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;';

    const resourceAmounts = [
      { label: '+1K All', amount: 1000 },
      { label: '+10K All', amount: 10000 },
      { label: 'Max All', amount: 999999 },
      { label: 'Clear All', amount: 0 }
    ];

    resourceAmounts.forEach(({ label, amount }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = `
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: rgba(59, 130, 246, 0.8);
        color: white;
        cursor: pointer;
        font-size: 12px;
      `;
      btn.onclick = () => this.giveResources(amount);
      quickButtons.appendChild(btn);
    });

    section.appendChild(quickButtons);

    // Individual resource controls
    if (this.selectedPlayer) {
      const resources = ['food', 'wood', 'stone', 'iron', 'copper', 'coal', 'gold', 'coins'];
      resources.forEach(resource => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';

        const label = document.createElement('span');
        label.textContent = resource.charAt(0).toUpperCase() + resource.slice(1);
        label.style.cssText = 'width: 60px; font-size: 12px; color: white;';

        const input = document.createElement('input');
        input.type = 'number';
        input.value = this.selectedPlayer.resources[resource] || 0;
        input.style.cssText = `
          flex: 1;
          padding: 4px 8px;
          background: rgba(31, 41, 55, 0.8);
          border: 1px solid rgb(75, 85, 99);
          border-radius: 4px;
          color: white;
          font-size: 12px;
        `;

        const setBtn = document.createElement('button');
        setBtn.textContent = 'Set';
        setBtn.style.cssText = `
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          background: rgba(34, 197, 94, 0.8);
          color: white;
          cursor: pointer;
          font-size: 12px;
        `;
        setBtn.onclick = () => {
          this.selectedPlayer.resources[resource] = parseInt(input.value) || 0;
          console.log(`💰 Set ${this.selectedPlayer.name} ${resource} to ${input.value}`);
        };

        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(setBtn);
        section.appendChild(row);
      });
    }

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
      btn.style.cssText = `
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: ${this.timeMultiplier === multiplier ? 'rgba(59, 130, 246, 0.8)' : 'rgba(75, 85, 99, 0.8)'};
        color: white;
        cursor: pointer;
        font-size: 12px;
      `;
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
    `;
    section.appendChild(speedDisplay);

    this.addToContent(section);
  }

  createSpawningSection() {
    if (!this.godMode) return;

    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
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
      `;
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
    `;
    section.appendChild(instructions);

    this.addToContent(section);
  }

  createWorldSection() {
    if (!this.godMode) return;

    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
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
      `;
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
      background: rgba(31, 41, 55, 0.5);
      padding: 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      color: rgb(156, 163, 175);
    `;

    const players = this.scene.gameWorld.players || [];
    const totalUnits = players.reduce((sum, p) => sum + p.units.length, 0);
    const totalBuildings = players.reduce((sum, p) => sum + p.buildings.length, 0);
    const tickCount = this.scene.tickCount || 0;

    debugInfo.innerHTML = `
      <div>Tick: ${tickCount}</div>
      <div>Players: ${players.length}</div>
      <div>Total Units: ${totalUnits}</div>
      <div>Total Buildings: ${totalBuildings}</div>
      <div>Time Speed: ${this.timeMultiplier}x</div>
      <div>God Mode: ${this.godMode ? 'ON' : 'OFF'}</div>
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
    // This would need to be implemented in your main game loop
    if (this.scene.setTimeSpeed) {
      this.scene.setTimeSpeed(multiplier);
    }
    
    console.log(`⏰ Time speed set to ${multiplier}x`);
    this.buildInterface();
  }

  spawnUnit(unitType) {
    console.log(`👤 Click on map to spawn ${unitType}`);
    this.spawnMode = { type: 'unit', unitType };
    // Set up click listener for spawning
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
          this.selectedPlayer.build(BuildingClass, [q, r]);
          console.log(`🏗️ Spawned ${this.spawnMode.buildingType} at [${q}, ${r}]`);
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
  }

  setupHotkeys() {
    // Admin panel hotkey (F12 or ~)
    this.scene.input.keyboard.on('keydown-F12', () => {
      this.toggle();
    });

    this.scene.input.keyboard.on('keydown-BACKTICK', () => {
      this.toggle();
    });
  }

  // Override base modal methods
  onShow() {
    this.buildInterface();
    console.log('⚡ Admin Panel opened');
  }

  onHide() {
    console.log('⚡ Admin Panel closed');
  }
}

window.AdminPanel = AdminPanel;