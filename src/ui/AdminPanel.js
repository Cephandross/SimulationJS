// src/ui/AdminPanel.js - Fixed with Better Styling

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
    
    // Override container styling for better visibility
    this.container.style.cssText = `
      position: fixed;
      left: ${window.innerWidth - 420}px;
      top: 20px;
      width: 400px;
      height: 700px;
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

  // Selected unit info
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

    // Control buttons
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