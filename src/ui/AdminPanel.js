// src/ui/AdminPanel.js - Complete with Save/Load and Battle System Integration

class AdminPanel extends BaseModal {
  constructor(scene) {
    super(scene, {
      width: 380,
      height: 850, // Reduced height to avoid overlap
      x: window.innerWidth - 400,
      y: 60, // Moved down to avoid top player bar
      title: '⚡ Admin Panel',
      closable: true
    });

    this.selectedPlayer = null;
    this.timeMultiplier = 1;
    this.godMode = false;
    this.autoSaveEnabled = false;
    this.currentSaveSystem = 'quick'; // 'quick' or 'full'
    
    // NEW: Battle system state
    this.battleSystemEnabled = true;
    
    // Override container styling for better visibility
    this.container.style.cssText = `
      position: fixed;
      left: ${window.innerWidth - 400}px;
      top: 60px;
      width: 380px;
      height: 850px;
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
      overflow-y: auto;
      max-height: calc(100vh - 80px);
    `;
    
    // NEW: Check if battle system is available
    this.checkBattleSystemAvailability();
    
    // NEW: Check if AI system is available  
    this.checkAISystemAvailability();
    
    this.buildInterface();
    this.setupHotkeys();
    
    console.log('✅ AdminPanel created and styled - Battle system:', 
      this.battleSystemEnabled ? 'enabled' : 'disabled');
  }

  // NEW: Check if battle system components are available
  checkBattleSystemAvailability() {
    this.battleSystemEnabled = !!(
      this.scene.gameWorld && 
      this.scene.gameWorld.battleManager &&
      typeof BattleManager !== 'undefined'
    );
    
    // Additional checks for battle system components
    if (!this.battleSystemEnabled) {
      // Try alternative availability checks
      this.battleSystemEnabled = !!(
        typeof BattleData !== 'undefined' ||
        typeof BattleResolver !== 'undefined' ||
        this.scene.battleSystemEnabled
      );
    }
    
    console.log('🗡️ Battle system availability check:', {
      gameWorld: !!this.scene.gameWorld,
      battleManager: !!this.scene.gameWorld?.battleManager,
      BattleManager: typeof BattleManager !== 'undefined',
      enabled: this.battleSystemEnabled
    });
  }

  // NEW: Check if AI system components are available
  checkAISystemAvailability() {
    this.aiSystemEnabled = !!(
      this.scene.gameWorld && 
      this.scene.gameWorld.aiManager &&
      typeof AIManager !== 'undefined'
    );
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
  // BATTLE SYSTEM INTEGRATION (NEW)
  // ==========================================

  /**
   * NEW: Create battle system section
   */
  createBattleSection() {
    if (!this.godMode) return;

    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(220, 38, 38, 0.1);
    `;

    const header = document.createElement('h3');
    header.textContent = '⚔️ Battle System';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    // Battle availability status
    const statusIndicator = document.createElement('div');
    statusIndicator.style.cssText = `
      background: ${this.battleSystemEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 12px;
      text-align: center;
      font-size: 12px;
      border: 1px solid ${this.battleSystemEnabled ? '#22c55e' : '#ef4444'};
    `;
    statusIndicator.innerHTML = `
      <div style="color: ${this.battleSystemEnabled ? '#22c55e' : '#ef4444'}; font-weight: bold;">
        ${this.battleSystemEnabled ? '✅ Battle System Active' : '❌ Battle System Disabled'}
      </div>
      <div style="font-size: 10px; color: rgb(156, 163, 175); margin-top: 4px;">
        ${this.battleSystemEnabled ? 
          'All battle features available' : 
          'Add battle system files to enable'
        }
      </div>
    `;
    section.appendChild(statusIndicator);

    if (this.battleSystemEnabled) {
      // Battle control buttons
      const battleButtons = document.createElement('div');
      battleButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;';

      const battleOptions = [
        { label: '🗡️ Spawn Test Armies', action: () => this.spawnTestArmies(), color: 'rgba(239, 68, 68, 0.8)' },
        { label: '⚔️ Start Test Battle', action: () => this.simulateTestBattle(), color: 'rgba(220, 38, 38, 0.8)' },
        { label: '👁️ Show Nearest Battle', action: () => this.showNearestBattle(), color: 'rgba(168, 85, 247, 0.8)' },
        { label: '🏁 End All Battles', action: () => this.endAllBattles(), color: 'rgba(107, 114, 128, 0.8)' }
      ];

      battleOptions.forEach(({ label, action, color }) => {
        const btn = document.createElement('button');
        btn.innerHTML = label;
        btn.style.cssText = `
          padding: 10px;
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
        battleButtons.appendChild(btn);
      });

      section.appendChild(battleButtons);

      // Battle statistics display
      const statsContainer = document.createElement('div');
      statsContainer.style.cssText = `
        background: rgba(31, 41, 55, 0.5);
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 8px;
      `;

      const statsTitle = document.createElement('div');
      statsTitle.textContent = '📊 Battle Statistics';
      statsTitle.style.cssText = 'font-size: 12px; font-weight: bold; color: rgb(156, 163, 175); margin-bottom: 6px;';
      statsContainer.appendChild(statsTitle);

      const statsDisplay = document.createElement('div');
      statsDisplay.id = 'battle-stats-display';
      statsDisplay.style.cssText = 'font-size: 11px; color: rgb(209, 213, 219);';
      this.updateBattleStats(statsDisplay);
      statsContainer.appendChild(statsDisplay);

      section.appendChild(statsContainer);

      // Battle debug controls
      const debugContainer = document.createElement('div');
      debugContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 6px;';

      const debugBattlesBtn = document.createElement('button');
      debugBattlesBtn.innerHTML = '🔍 Debug Battles';
      debugBattlesBtn.style.cssText = `
        padding: 6px;
        border: none;
        border-radius: 3px;
        background: rgba(75, 85, 99, 0.8);
        color: white;
        cursor: pointer;
        font-size: 10px;
      `;
      debugBattlesBtn.onclick = () => this.debugBattles();

      const refreshStatsBtn = document.createElement('button');
      refreshStatsBtn.innerHTML = '🔄 Refresh Stats';
      refreshStatsBtn.style.cssText = `
        padding: 6px;
        border: none;
        border-radius: 3px;
        background: rgba(75, 85, 99, 0.8);
        color: white;
        cursor: pointer;
        font-size: 10px;
      `;
      refreshStatsBtn.onclick = () => this.refreshBattleStats();

      debugContainer.appendChild(debugBattlesBtn);
      debugContainer.appendChild(refreshStatsBtn);
      section.appendChild(debugContainer);

    } else {
      // Battle system disabled message
      const disabledMessage = document.createElement('div');
      disabledMessage.style.cssText = `
        text-align: center;
        color: rgb(156, 163, 175);
        font-size: 12px;
        font-style: italic;
        padding: 16px;
      `;
      disabledMessage.textContent = 'Add battle system files to enable tactical combat features';
      section.appendChild(disabledMessage);
    }

    this.addToContent(section);
  }

  /**
   * NEW: Spawn test armies for battle testing
   */
  spawnTestArmies() {
    if (!this.battleSystemEnabled) {
      this.showNotification('Battle system not enabled', 'error');
      return;
    }

    const players = this.scene.gameWorld.players;
    if (players.length < 2) {
      this.showNotification('Need at least 2 players for test armies', 'error');
      return;
    }

    const player1 = players[0];
    const player2 = players[1];

    // Clear existing units
    let totalCleared = 0;
    [player1, player2].forEach(player => {
      totalCleared += player.units.length;
      player.units.forEach(unit => unit.destroy());
      player.units = [];
    });

    // Spawn armies near each other
    const army1Pos = [0, 0];
    const army2Pos = [3, 0];

    let totalSpawned = 0;

    try {
      console.log('🗡️ Starting army spawn...');
      console.log('FootSoldier available:', typeof FootSoldier !== 'undefined');
      console.log('MountedArcher available:', typeof MountedArcher !== 'undefined');
      
      // Player 1 army (Red)
      for (let i = 0; i < 3; i++) {
        const pos1 = [army1Pos[0], army1Pos[1] + i];
        const pos2 = [army1Pos[0] - 1, army1Pos[1] + i];
        
        console.log(`Attempting to spawn FootSoldier for Player1 at [${pos1[0]}, ${pos1[1]}]`);
        if (typeof FootSoldier !== 'undefined') {
          const unit = player1.spawnUnit(FootSoldier, pos1);
          if (unit) {
            totalSpawned++;
            console.log(`✓ Spawned FootSoldier at [${pos1[0]}, ${pos1[1]}]`);
          } else {
            console.log(`✗ Failed to spawn FootSoldier at [${pos1[0]}, ${pos1[1]}]`);
          }
        }
        
        console.log(`Attempting to spawn MountedArcher for Player1 at [${pos2[0]}, ${pos2[1]}]`);
        if (typeof MountedArcher !== 'undefined') {
          const unit = player1.spawnUnit(MountedArcher, pos2);
          if (unit) {
            totalSpawned++;
            console.log(`✓ Spawned MountedArcher at [${pos2[0]}, ${pos2[1]}]`);
          } else {
            console.log(`✗ Failed to spawn MountedArcher at [${pos2[0]}, ${pos2[1]}]`);
          }
        }
      }

      // Player 2 army (Blue)  
      for (let i = 0; i < 3; i++) {
        const pos1 = [army2Pos[0], army2Pos[1] + i];
        const pos2 = [army2Pos[0] + 1, army2Pos[1] + i];
        
        console.log(`Attempting to spawn FootSoldier for Player2 at [${pos1[0]}, ${pos1[1]}]`);
        if (typeof FootSoldier !== 'undefined') {
          const unit = player2.spawnUnit(FootSoldier, pos1);
          if (unit) {
            totalSpawned++;
            console.log(`✓ Spawned FootSoldier at [${pos1[0]}, ${pos1[1]}]`);
          } else {
            console.log(`✗ Failed to spawn FootSoldier at [${pos1[0]}, ${pos1[1]}]`);
          }
        }
        
        console.log(`Attempting to spawn MountedArcher for Player2 at [${pos2[0]}, ${pos2[1]}]`);
        if (typeof MountedArcher !== 'undefined') {
          const unit = player2.spawnUnit(MountedArcher, pos2);
          if (unit) {
            totalSpawned++;
            console.log(`✓ Spawned MountedArcher at [${pos2[0]}, ${pos2[1]}]`);
          } else {
            console.log(`✗ Failed to spawn MountedArcher at [${pos2[0]}, ${pos2[1]}]`);
          }
        }
      }

      this.showNotification(`🗡️ Test armies spawned! ${totalSpawned} units created`, 'success');
      console.log(`🗡️ Test armies spawned (cleared ${totalCleared}, spawned ${totalSpawned})`);
      
    } catch (error) {
      this.showNotification('❌ Failed to spawn armies: ' + error.message, 'error');
      console.error('Army spawning error:', error);
    }
    
    this.buildInterface(); // Refresh the interface
  }

  /**
   * NEW: Simulate a test battle
   */
  simulateTestBattle() {
    if (!this.battleSystemEnabled) {
      this.showNotification('Battle system not enabled', 'error');
      return;
    }

    try {
      // Find two different players' units
      const allUnits = this.scene.gameWorld.getAllUnits();
      const players = [...new Set(allUnits.map(u => u.owner))];
      
      if (players.length < 2) {
        this.showNotification('Need at least 2 players to simulate battle', 'error');
        return;
      }
      
      const player1Units = allUnits.filter(u => u.owner === players[0] && u.isAlive());
      const player2Units = allUnits.filter(u => u.owner === players[1] && u.isAlive());
      
      if (player1Units.length === 0 || player2Units.length === 0) {
        this.showNotification('Both players need living units to simulate battle', 'error');
        return;
      }
      
      // Move units close to each other and start battle
      const attacker = player1Units[0];
      const defender = player2Units[0];
      
      // Move attacker next to defender
      const [defX, defY] = defender.coords;
      attacker.setPosition(defX + 1, defY);
      
      // Start battle
      console.log(`⚔️ Starting test battle: ${attacker.type} vs ${defender.type}`);
      const battleStarted = attacker.attackUnit(defender);
      
      if (battleStarted) {
        this.showNotification(`⚔️ Battle started between ${attacker.type} and ${defender.type}!`, 'success');
      } else {
        this.showNotification('❌ Failed to start battle', 'error');
      }
      
    } catch (error) {
      this.showNotification('❌ Battle simulation failed: ' + error.message, 'error');
      console.error('Battle simulation error:', error);
    }
    
    this.refreshBattleStats();
  }

  /**
   * NEW: Show nearest battle interface
   */
  showNearestBattle() {
    if (!this.battleSystemEnabled) {
      this.showNotification('❌ Battle system not enabled', 'error');
      return;
    }

    if (!this.scene.gameWorld.battleManager) {
      this.showNotification('❌ Battle manager not initialized', 'error');
      return;
    }

    const battles = this.scene.gameWorld.battleManager.getActiveBattles();
    if (battles.length === 0) {
      this.showNotification('No active battles found', 'info');
      return;
    }

    // Show the first active battle
    const battle = battles[0];
    if (this.scene.uiManager && this.scene.uiManager.battleInterface) {
      this.scene.uiManager.showBattleInterface(battle, { showPrediction: true });
      this.showNotification(`👁️ Showing battle at [${battle.hex.join(', ')}]`, 'success');
    } else {
      this.showNotification('❌ Battle interface not available', 'error');
    }
  }

  /**
   * NEW: End all active battles
   */
  endAllBattles() {
    if (!this.battleSystemEnabled) {
      this.showNotification('❌ Battle system not enabled', 'error');
      return;
    }

    if (!this.scene.gameWorld.battleManager) {
      this.showNotification('❌ Battle manager not initialized', 'error');
      return;
    }

    const battles = this.scene.gameWorld.battleManager.getActiveBattles();
    if (battles.length === 0) {
      this.showNotification('No active battles to end', 'info');
      return;
    }

    // Force end all battles
    this.scene.gameWorld.endAllBattles();
    this.showNotification(`🏁 Force-ended ${battles.length} battle(s)`, 'success');
    
    this.refreshBattleStats();
  }

  /**
   * NEW: Update battle statistics display
   */
  updateBattleStats(container) {
    if (!this.battleSystemEnabled || !this.scene.gameWorld.battleManager) {
      container.innerHTML = 'Battle system not available';
      return;
    }

    const stats = this.scene.gameWorld.getBattleStats();
    if (!stats) {
      container.innerHTML = 'No battle statistics available';
      return;
    }

    container.innerHTML = `
      <div>Active Battles: <span style="color: #fbbf24;">${stats.activeBattles}</span></div>
      <div>Units in Battle: <span style="color: #ef4444;">${stats.unitsInBattle}</span></div>
      <div>Idle Units: <span style="color: #10b981;">${stats.idleUnits}</span></div>
      <div>Longest Battle: <span style="color: #8b5cf6;">${stats.longestBattle} ticks</span></div>
    `;

    if (stats.battleLocations.length > 0) {
      const locations = stats.battleLocations.map(loc => `[${loc.join(',')}]`).join(', ');
      container.innerHTML += `<div style="margin-top: 4px; font-size: 10px; color: rgb(156, 163, 175);">Locations: ${locations}</div>`;
    }
  }

  /**
   * NEW: Refresh battle statistics
   */
  refreshBattleStats() {
    const statsDisplay = document.getElementById('battle-stats-display');
    if (statsDisplay) {
      this.updateBattleStats(statsDisplay);
    }
  }

  // ==========================================
  // UNIT STACKING SYSTEM (NEW)
  // ==========================================

  /**
   * NEW: Create unit stacking management section
   */
  createStackingSection() {
    if (!this.godMode) return;

    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(34, 197, 94, 0.1);
    `;

    const header = document.createElement('h3');
    header.textContent = '📦 Unit Stacking System';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    // Stacking system status
    const maxStackSize = typeof MAX_STACK_SIZE !== 'undefined' ? MAX_STACK_SIZE : 5;
    const statusIndicator = document.createElement('div');
    statusIndicator.style.cssText = `
      background: rgba(34, 197, 94, 0.2);
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 12px;
      text-align: center;
      font-size: 12px;
      border: 1px solid #22c55e;
    `;
    statusIndicator.innerHTML = `
      <div style="color: #22c55e; font-weight: bold;">
        ✅ Stacking System Active
      </div>
      <div style="font-size: 10px; color: rgb(156, 163, 175); margin-top: 4px;">
        Max stack size: ${maxStackSize} units
      </div>
    `;
    section.appendChild(statusIndicator);

    // Stacking control buttons
    const stackButtons = document.createElement('div');
    stackButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;';

    const stackOptions = [
      { label: '📦 Create Test Stack', action: () => this.createTestStack(), color: 'rgba(34, 197, 94, 0.8)' },
      { label: '🔍 Show Stack Info', action: () => this.showStackInfo(), color: 'rgba(59, 130, 246, 0.8)' },
      { label: '⚔️ Stack vs Stack Battle', action: () => this.simulateStackBattle(), color: 'rgba(239, 68, 68, 0.8)' },
      { label: '🧹 Clear All Stacks', action: () => this.clearAllStacks(), color: 'rgba(107, 114, 128, 0.8)' }
    ];

    stackOptions.forEach(({ label, action, color }) => {
      const btn = document.createElement('button');
      btn.innerHTML = label;
      btn.style.cssText = `
        padding: 10px;
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
      stackButtons.appendChild(btn);
    });

    section.appendChild(stackButtons);

    // Stack statistics display
    const statsContainer = document.createElement('div');
    statsContainer.id = 'stack-stats-display';
    statsContainer.style.cssText = `
      background: rgba(31, 41, 55, 0.5);
      border-radius: 4px;
      padding: 8px;
      font-size: 11px;
      color: rgb(156, 163, 175);
      line-height: 1.4;
    `;
    
    this.updateStackStats(statsContainer);
    section.appendChild(statsContainer);

    this.contentArea.appendChild(section);
  }

  /**
   * Create a test stack at a random location
   */
  createTestStack() {
    if (!this.scene.gameWorld) {
      this.showNotification('❌ Game world not available', 'error');
      return;
    }

    try {
      const players = this.scene.gameWorld.players;
      if (players.length === 0) {
        this.showNotification('❌ No players available to create units', 'error');
        return;
      }

      // Pick a random location
      const q = Math.floor(Math.random() * 20) - 10;
      const r = Math.floor(Math.random() * 20) - 10;
      
      // Check if location can fit a stack
      if (!this.scene.gameWorld.canAddToStack(q, r)) {
        this.showNotification(`❌ Cannot create stack at [${q}, ${r}] - location full`, 'error');
        return;
      }

      // Create multiple units of different types at the same location
      const unitTypes = ['Warrior', 'Archer', 'Scout'];
      const player = players[0];
      let unitsCreated = 0;

      unitTypes.forEach((unitType, index) => {
        if (this.scene.gameWorld.canAddToStack(q, r)) {
          const unit = new Unit({ 
            type: unitType, 
            coords: [q, r], 
            owner: player, 
            scene: this.scene 
          });
          
          // Set basic combat stats
          unit.attack = 5 + index * 2;
          unit.defense = 3 + index;
          unit.range = 1 + (index === 1 ? 1 : 0); // Archer has range 2
          
          player.units.push(unit);
          unitsCreated++;
        }
      });

      if (unitsCreated > 0) {
        this.showNotification(`📦 Created test stack of ${unitsCreated} units at [${q}, ${r}]`, 'success');
        this.updateStackStats(document.getElementById('stack-stats-display'));
      } else {
        this.showNotification('❌ Could not create any units in stack', 'error');
      }

    } catch (error) {
      this.showNotification('❌ Failed to create test stack: ' + error.message, 'error');
      console.error('Stack creation error:', error);
    }
  }

  /**
   * Show information about all stacks in the game
   */
  showStackInfo() {
    if (!this.scene.gameWorld) {
      this.showNotification('❌ Game world not available', 'error');
      return;
    }

    const allUnits = this.scene.gameWorld.getAllUnits();
    const stackLocations = new Map();

    // Group units by location
    allUnits.forEach(unit => {
      const key = `${unit.coords[0]},${unit.coords[1]}`;
      if (!stackLocations.has(key)) {
        stackLocations.set(key, []);
      }
      stackLocations.get(key).push(unit);
    });

    // Find stacks with multiple units
    const stacks = Array.from(stackLocations.entries())
      .filter(([key, units]) => units.length > 1);

    if (stacks.length === 0) {
      this.showNotification('📦 No multi-unit stacks found in the game', 'info');
      return;
    }

    // Show stack information
    let message = `📦 Found ${stacks.length} stack(s):\\n\\n`;
    stacks.forEach(([key, units]) => {
      const [q, r] = key.split(',');
      const stackInfo = this.scene.gameWorld.getStackInfo(parseInt(q), parseInt(r));
      message += `[${q}, ${r}]: ${units.length} units\\n`;
      if (stackInfo) {
        stackInfo.composition.forEach(comp => {
          message += `  • ${comp.count}x ${comp.type} (${comp.owner.name})\\n`;
        });
      }
      message += '\\n';
    });

    this.showNotification(message, 'info');
    console.log('Stack info:', stacks);
  }

  /**
   * Simulate a battle between two stacks
   */
  simulateStackBattle() {
    if (!this.battleSystemEnabled) {
      this.showNotification('❌ Battle system not enabled', 'error');
      return;
    }

    try {
      const allUnits = this.scene.gameWorld.getAllUnits();
      const players = [...new Set(allUnits.map(u => u.owner))];
      
      if (players.length < 2) {
        this.showNotification('Need at least 2 players to simulate stack battle', 'error');
        return;
      }

      // Find or create stacks for each player
      let player1Stack = null;
      let player2Stack = null;
      
      // Look for existing stacks first
      const stackLocations = new Map();
      allUnits.forEach(unit => {
        const key = `${unit.coords[0]},${unit.coords[1]}`;
        if (!stackLocations.has(key)) {
          stackLocations.set(key, []);
        }
        stackLocations.get(key).push(unit);
      });

      const stacks = Array.from(stackLocations.entries())
        .filter(([key, units]) => units.length > 1);

      // Find stacks for different players
      for (const [key, units] of stacks) {
        const [q, r] = key.split(',').map(Number);
        const player1Units = units.filter(u => u.owner === players[0]);
        const player2Units = units.filter(u => u.owner === players[1]);
        
        if (player1Units.length > 0 && !player1Stack) {
          player1Stack = { coords: [q, r], units: player1Units };
        }
        if (player2Units.length > 0 && !player2Stack) {
          player2Stack = { coords: [q, r], units: player2Units };
        }
      }

      // If no suitable stacks found, create them
      if (!player1Stack || !player2Stack) {
        this.showNotification('Creating test stacks for battle...', 'info');
        
        // Create player 1 stack
        const q1 = 5, r1 = 5;
        for (let i = 0; i < 2; i++) {
          const unit = new Unit({ 
            type: i === 0 ? 'Warrior' : 'Archer', 
            coords: [q1, r1], 
            owner: players[0], 
            scene: this.scene 
          });
          unit.attack = 8; unit.defense = 4; unit.range = i === 1 ? 2 : 1;
          players[0].units.push(unit);
        }
        player1Stack = { coords: [q1, r1], units: this.scene.gameWorld.getUnitsAt(q1, r1) };

        // Create player 2 stack
        const q2 = 6, r2 = 5;
        for (let i = 0; i < 2; i++) {
          const unit = new Unit({ 
            type: i === 0 ? 'Scout' : 'Warrior', 
            coords: [q2, r2], 
            owner: players[1], 
            scene: this.scene 
          });
          unit.attack = 7; unit.defense = 3; unit.range = 1;
          players[1].units.push(unit);
        }
        player2Stack = { coords: [q2, r2], units: this.scene.gameWorld.getUnitsAt(q2, r2) };
      }

      // Start battle between stacks
      const attacker = player1Stack.units[0];
      const battle = this.scene.gameWorld.battleManager.startBattleAtHex(attacker, player2Stack.coords);
      
      if (battle) {
        this.showNotification(
          `⚔️ Stack battle started!\\n` +
          `Player 1 stack: ${player1Stack.units.length} units\\n` +
          `Player 2 stack: ${player2Stack.units.length} units`, 
          'success'
        );
      } else {
        this.showNotification('❌ Failed to start stack battle', 'error');
      }

    } catch (error) {
      this.showNotification('❌ Stack battle simulation failed: ' + error.message, 'error');
      console.error('Stack battle error:', error);
    }
  }

  /**
   * Clear all multi-unit stacks (spread units out)
   */
  clearAllStacks() {
    if (!this.scene.gameWorld) {
      this.showNotification('❌ Game world not available', 'error');
      return;
    }

    try {
      const allUnits = this.scene.gameWorld.getAllUnits();
      const stackLocations = new Map();

      // Group units by location
      allUnits.forEach(unit => {
        const key = `${unit.coords[0]},${unit.coords[1]}`;
        if (!stackLocations.has(key)) {
          stackLocations.set(key, []);
        }
        stackLocations.get(key).push(unit);
      });

      // Find and clear stacks
      let stacksCleared = 0;
      let unitsSpread = 0;

      for (const [key, units] of stackLocations.entries()) {
        if (units.length > 1) {
          const [baseQ, baseR] = key.split(',').map(Number);
          stacksCleared++;
          
          // Spread units in a spiral pattern around the original location
          const spiralOffsets = [[0,0], [1,0], [0,1], [-1,0], [0,-1], [1,-1], [-1,1]];
          
          units.forEach((unit, index) => {
            if (index === 0) return; // Leave first unit in original position
            
            const offsetIndex = (index - 1) % spiralOffsets.length;
            const [dq, dr] = spiralOffsets[offsetIndex];
            const newQ = baseQ + dq + Math.floor((index - 1) / spiralOffsets.length);
            const newR = baseR + dr;
            
            // Check if new position is passable
            if (this.scene.map && this.scene.map.getTile(newQ, newR)?.isPassable()) {
              unit.setPosition(newQ, newR);
              unitsSpread++;
            }
          });
        }
      }

      if (stacksCleared > 0) {
        this.showNotification(`🧹 Cleared ${stacksCleared} stack(s), spread ${unitsSpread} units`, 'success');
        this.updateStackStats(document.getElementById('stack-stats-display'));
      } else {
        this.showNotification('📦 No multi-unit stacks found to clear', 'info');
      }

    } catch (error) {
      this.showNotification('❌ Failed to clear stacks: ' + error.message, 'error');
      console.error('Clear stacks error:', error);
    }
  }

  /**
   * Update stack statistics display
   */
  updateStackStats(container) {
    if (!this.scene.gameWorld) {
      container.innerHTML = 'Game world not available';
      return;
    }

    const allUnits = this.scene.gameWorld.getAllUnits();
    const stackLocations = new Map();

    // Group units by location
    allUnits.forEach(unit => {
      const key = `${unit.coords[0]},${unit.coords[1]}`;
      if (!stackLocations.has(key)) {
        stackLocations.set(key, []);
      }
      stackLocations.get(key).push(unit);
    });

    const stacks = Array.from(stackLocations.values())
      .filter(units => units.length > 1);
    
    const totalUnits = allUnits.length;
    const unitsInStacks = stacks.reduce((sum, stack) => sum + stack.length, 0);
    const singleUnits = totalUnits - unitsInStacks;
    const maxStackSize = stacks.length > 0 ? Math.max(...stacks.map(s => s.length)) : 0;

    container.innerHTML = `
      <div>Total Units: <span style="color: #3b82f6;">${totalUnits}</span></div>
      <div>Multi-unit Stacks: <span style="color: #22c55e;">${stacks.length}</span></div>
      <div>Units in Stacks: <span style="color: #f59e0b;">${unitsInStacks}</span></div>
      <div>Single Units: <span style="color: #6b7280;">${singleUnits}</span></div>
      <div>Largest Stack: <span style="color: #ef4444;">${maxStackSize} units</span></div>
    `;

    if (stacks.length > 0) {
      const stackInfo = stacks.slice(0, 3).map(stack => 
        `[${stack[0].coords.join(',')}]: ${stack.length}`
      ).join(', ');
      container.innerHTML += `<div style="margin-top: 4px; font-size: 10px; color: rgb(156, 163, 175);">Examples: ${stackInfo}${stacks.length > 3 ? '...' : ''}</div>`;
    }
  }

  /**
   * NEW: Debug battles to console
   */
  debugBattles() {
    if (!this.battleSystemEnabled) {
      this.showNotification('❌ Battle system not enabled', 'error');
      return;
    }

    if (!this.scene.gameWorld.battleManager) {
      this.showNotification('❌ Battle manager not initialized', 'error');
      return;
    }

    this.scene.gameWorld.battleManager.debugState();
    this.scene.gameWorld.debugState();
    
    const stats = this.scene.gameWorld.getBattleStats();
    console.log('📊 Detailed Battle Statistics:', stats);
    
    this.showNotification('🔍 Battle debug info logged to console', 'info');
  }

  /**
   * NEW: Tick method to refresh battle and AI stats periodically
   */
  tick() {
    // Refresh battle stats every 5 ticks to avoid spam
    if (this.battleSystemEnabled && this.scene.tickCount % 5 === 0) {
      this.refreshBattleStats();
    }
    
    // Refresh AI stats every 10 ticks to avoid spam
    if (this.aiSystemEnabled && this.scene.tickCount % 10 === 0) {
      this.refreshAIStats();
    }
  }

  // ==========================================
  // SAVE/LOAD SYSTEM INTEGRATION (Preserved exactly)
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
  // SAVE/LOAD ACTION METHODS (Preserved exactly)
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
  // AI SYSTEM INTEGRATION (NEW)
  // ==========================================

  /**
   * NEW: Create AI system management section
   */
  createAISection() {
    if (!this.godMode) return;

    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(168, 85, 247, 0.1);
    `;

    const header = document.createElement('h3');
    header.textContent = '🧠 AI System Management';
    header.style.cssText = 'margin: 0 0 12px 0; color: white; font-size: 16px;';
    section.appendChild(header);

    // AI availability status
    const statusIndicator = document.createElement('div');
    statusIndicator.style.cssText = `
      background: ${this.aiSystemEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 12px;
      text-align: center;
      font-size: 12px;
      border: 1px solid ${this.aiSystemEnabled ? '#22c55e' : '#ef4444'};
    `;
    statusIndicator.innerHTML = `
      <div style="color: ${this.aiSystemEnabled ? '#22c55e' : '#ef4444'}; font-weight: bold;">
        ${this.aiSystemEnabled ? '✅ AI System Active' : '❌ AI System Disabled'}
      </div>
      <div style="font-size: 10px; color: rgb(156, 163, 175); margin-top: 4px;">
        ${this.aiSystemEnabled ? 
          'All AI features available' : 
          'Add AI system files to enable'
        }
      </div>
    `;
    section.appendChild(statusIndicator);

    if (this.aiSystemEnabled) {
      // Global AI controls
      const globalControls = document.createElement('div');
      globalControls.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;';

      const globalOptions = [
        { label: '🟢 Enable All AI', action: () => this.enableAllAI(), color: 'rgba(34, 197, 94, 0.8)' },
        { label: '🔴 Disable All AI', action: () => this.disableAllAI(), color: 'rgba(239, 68, 68, 0.8)' },
        { label: '🔧 Debug Mode', action: () => this.toggleAIDebugMode(), color: 'rgba(107, 114, 128, 0.8)' },
        { label: '📊 AI Status', action: () => this.showAIStatus(), color: 'rgba(59, 130, 246, 0.8)' },
        { label: '⚡ Per-Tick AI', action: () => this.enablePerTickAI(), color: 'rgba(236, 72, 153, 0.8)' },
        { label: '⏰ Normal Speed', action: () => this.setNormalAISpeed(), color: 'rgba(168, 85, 247, 0.8)' }
      ];

      globalOptions.forEach(({ label, action, color }) => {
        const btn = document.createElement('button');
        btn.innerHTML = label;
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
        globalControls.appendChild(btn);
      });

      section.appendChild(globalControls);

      // Player-specific AI controls
      this.createPlayerAIControls(section);

      // AI performance statistics
      this.createAIStatsDisplay(section);

      // Strategy management
      this.createStrategyControls(section);

    } else {
      // AI system disabled message
      const disabledMessage = document.createElement('div');
      disabledMessage.style.cssText = `
        text-align: center;
        color: rgb(156, 163, 175);
        font-size: 12px;
        font-style: italic;
        padding: 16px;
      `;
      disabledMessage.textContent = 'Add AI system files to enable advanced player automation';
      section.appendChild(disabledMessage);
    }

    this.addToContent(section);
  }

  /**
   * Create player-specific AI controls
   */
  createPlayerAIControls(parentSection) {
    const playersContainer = document.createElement('div');
    playersContainer.style.cssText = `
      background: rgba(31, 41, 55, 0.5);
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 12px;
    `;

    const playersTitle = document.createElement('div');
    playersTitle.textContent = '👥 Player AI Controls';
    playersTitle.style.cssText = 'font-size: 12px; font-weight: bold; color: rgb(156, 163, 175); margin-bottom: 8px;';
    playersContainer.appendChild(playersTitle);

    const players = this.scene.gameWorld.players || [];
    
    players.forEach(player => {
      const playerControl = document.createElement('div');
      playerControl.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
        padding: 4px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      `;

      // Player info
      const playerInfo = document.createElement('div');
      playerInfo.style.cssText = `
        color: #${player.color.toString(16).padStart(6, '0')};
        font-size: 11px;
        font-weight: bold;
        flex: 1;
      `;
      
      const aiSystem = this.scene.gameWorld.aiManager?.getAISystem(player);
      const aiEnabled = aiSystem?.enabled || false;
      const aiType = aiSystem?.aiType || 'none';
      
      playerInfo.innerHTML = `
        ${player.name}<br>
        <span style="font-size: 9px; color: rgb(156, 163, 175);">
          AI: ${aiEnabled ? aiType : 'disabled'}
        </span>
      `;
      playerControl.appendChild(playerInfo);

      // Strategy selector
      const strategySelect = document.createElement('select');
      strategySelect.style.cssText = `
        margin-right: 4px;
        padding: 2px;
        background: rgba(31, 41, 55, 0.9);
        border: 1px solid rgb(75, 85, 99);
        border-radius: 3px;
        color: white;
        font-size: 9px;
      `;

      const strategies = ['peaceful', 'aggressive', 'balanced', 'economic', 'expansionist'];
      strategies.forEach(strategy => {
        const option = document.createElement('option');
        option.value = strategy;
        option.textContent = strategy;
        option.selected = strategy === aiType;
        option.style.background = 'rgb(31, 41, 55)';
        strategySelect.appendChild(option);
      });

      strategySelect.onchange = (e) => {
        this.changePlayerAIStrategy(player, e.target.value);
      };
      playerControl.appendChild(strategySelect);

      // Enable/Disable toggle
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = aiEnabled ? 'ON' : 'OFF';
      toggleBtn.style.cssText = `
        padding: 2px 8px;
        border: none;
        border-radius: 3px;
        background: ${aiEnabled ? '#22c55e' : '#6b7280'};
        color: white;
        cursor: pointer;
        font-size: 9px;
        font-weight: bold;
        transition: all 0.2s;
        min-width: 30px;
      `;
      toggleBtn.onclick = () => this.togglePlayerAI(player, toggleBtn);
      playerControl.appendChild(toggleBtn);

      // Frequency control
      const freqBtn = document.createElement('button');
      const aiSystemFreq = this.scene.gameWorld.aiManager.getAISystem(player);
      const currentFreq = aiSystemFreq ? aiSystemFreq.getUpdateConfig().frequency : '3000ms';
      const isPerTick = currentFreq === 'every_tick';
      
      freqBtn.textContent = isPerTick ? '⚡' : '⏰';
      freqBtn.title = isPerTick ? 'Per-tick updates' : `Time-based: ${currentFreq}`;
      freqBtn.style.cssText = `
        padding: 2px 6px;
        border: none;
        border-radius: 3px;
        background: ${isPerTick ? '#ec4899' : '#8b5cf6'};
        color: white;
        cursor: pointer;
        font-size: 9px;
        margin-left: 2px;
        min-width: 20px;
      `;
      freqBtn.onclick = () => this.togglePlayerAIFrequency(player, freqBtn);
      playerControl.appendChild(freqBtn);

      playersContainer.appendChild(playerControl);
    });

    parentSection.appendChild(playersContainer);
  }

  /**
   * Create AI statistics display
   */
  createAIStatsDisplay(parentSection) {
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
      background: rgba(31, 41, 55, 0.5);
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 8px;
    `;

    const statsTitle = document.createElement('div');
    statsTitle.textContent = '📈 AI Performance Metrics';
    statsTitle.style.cssText = 'font-size: 12px; font-weight: bold; color: rgb(156, 163, 175); margin-bottom: 6px;';
    statsContainer.appendChild(statsTitle);

    const statsDisplay = document.createElement('div');
    statsDisplay.id = 'ai-stats-display';
    statsDisplay.style.cssText = 'font-size: 11px; color: rgb(209, 213, 219);';
    this.updateAIStats(statsDisplay);
    statsContainer.appendChild(statsDisplay);

    parentSection.appendChild(statsContainer);
  }

  /**
   * Create strategy management controls
   */
  createStrategyControls(parentSection) {
    const strategyContainer = document.createElement('div');
    strategyContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 6px;';

    const strategyActions = [
      { label: '⚡ Force Action', action: () => this.forceAIAction() },
      { label: '🔄 Refresh Stats', action: () => this.refreshAIStats() }
    ];

    strategyActions.forEach(({ label, action }) => {
      const btn = document.createElement('button');
      btn.innerHTML = label;
      btn.style.cssText = `
        padding: 6px;
        border: none;
        border-radius: 3px;
        background: rgba(75, 85, 99, 0.8);
        color: white;
        cursor: pointer;
        font-size: 10px;
      `;
      btn.onclick = action;
      strategyContainer.appendChild(btn);
    });

    parentSection.appendChild(strategyContainer);
  }

  /**
   * AI action methods
   */
  enableAllAI() {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      this.showNotification('❌ AI system not available', 'error');
      return;
    }

    const count = this.scene.gameWorld.aiManager.setAllAIEnabled(true);
    this.showNotification(`🟢 Enabled AI for ${count} players`, 'success');
    this.buildInterface();
  }

  disableAllAI() {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      this.showNotification('❌ AI system not available', 'error');
      return;
    }

    const count = this.scene.gameWorld.aiManager.setAllAIEnabled(false);
    this.showNotification(`🔴 Disabled AI for ${count} players`, 'info');
    this.buildInterface();
  }

  enablePerTickAI() {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      this.showNotification('❌ AI system not available', 'error');
      return;
    }

    const count = this.scene.gameWorld.aiManager.setAllAIFrequency('every_tick');
    this.showNotification(`⚡ Enabled per-tick updates for ${count} AI systems`, 'info');
  }

  setNormalAISpeed() {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      this.showNotification('❌ AI system not available', 'error');
      return;
    }

    const count = this.scene.gameWorld.aiManager.setAllAIFrequency(3000); // 3 second default
    this.showNotification(`⏰ Set normal update speed (3s) for ${count} AI systems`, 'info');
  }

  toggleAIDebugMode() {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      this.showNotification('❌ AI system not available', 'error');
      return;
    }

    // Toggle debug mode state
    this.aiDebugMode = !this.aiDebugMode;
    const count = this.scene.gameWorld.aiManager.setGlobalDebugMode(this.aiDebugMode);
    this.showNotification(`🔧 ${this.aiDebugMode ? 'Enabled' : 'Disabled'} debug mode for ${count} AI systems`, 'info');
  }

  showAIStatus() {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      this.showNotification('❌ AI system not available', 'error');
      return;
    }

    this.scene.gameWorld.aiManager.debugAllSystems();
    this.showNotification('📊 AI status logged to console', 'info');
    this.refreshAIStats();
  }

  togglePlayerAIFrequency(player, button) {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      this.showNotification('❌ AI system not available', 'error');
      return;
    }

    const aiSystem = this.scene.gameWorld.aiManager.getAISystem(player);
    if (!aiSystem) {
      this.showNotification(`❌ No AI system for ${player.name}`, 'error');
      return;
    }

    const currentConfig = aiSystem.getUpdateConfig();
    const newFrequency = currentConfig.tickBasedUpdates ? 3000 : 'every_tick';
    
    if (this.scene.gameWorld.aiManager.setPlayerAIFrequency(player, newFrequency)) {
      const isPerTick = newFrequency === 'every_tick';
      button.textContent = isPerTick ? '⚡' : '⏰';
      button.title = isPerTick ? 'Per-tick updates' : `Time-based: ${newFrequency}ms`;
      button.style.background = isPerTick ? '#ec4899' : '#8b5cf6';
      
      this.showNotification(
        `🔄 ${player.name}: ${isPerTick ? 'Per-tick' : 'Time-based'} AI updates`, 
        'info'
      );
    }
  }

  changePlayerAIStrategy(player, strategy) {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      this.showNotification('❌ AI system not available', 'error');
      return;
    }

    if (this.scene.gameWorld.aiManager.setPlayerAIType(player, strategy)) {
      this.showNotification(`🔄 Changed ${player.name} to ${strategy} strategy`, 'success');
      this.buildInterface();
    } else {
      this.showNotification(`❌ Failed to change ${player.name} strategy`, 'error');
    }
  }

  togglePlayerAI(player, buttonElement) {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      this.showNotification('❌ AI system not available', 'error');
      return;
    }

    const aiSystem = this.scene.gameWorld.aiManager.getAISystem(player);
    const newState = !aiSystem?.enabled;
    
    if (this.scene.gameWorld.aiManager.setPlayerAIEnabled(player, newState)) {
      buttonElement.textContent = newState ? 'ON' : 'OFF';
      buttonElement.style.background = newState ? '#22c55e' : '#6b7280';
      this.showNotification(`${newState ? '🟢' : '🔴'} ${player.name} AI ${newState ? 'enabled' : 'disabled'}`, 'success');
      this.buildInterface();
    } else {
      this.showNotification(`❌ Failed to toggle ${player.name} AI`, 'error');
    }
  }

  forceAIAction() {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      this.showNotification('❌ AI system not available', 'error');
      return;
    }

    // Show a simple prompt for action type
    const action = prompt('Enter AI action to force:\n\nAvailable actions:\n- ensure_survival\n- manage_economy\n- build_military\n- expand_territory\n- conduct_warfare\n- optimize_resources', 'ensure_survival');
    
    if (action) {
      const results = this.scene.gameWorld.aiManager.forceActionOnAll(action);
      const successCount = results.filter(r => r.success).length;
      this.showNotification(`⚡ Forced ${action} on ${successCount}/${results.length} AI systems`, 'info');
      console.log('Force action results:', results);
    }
  }

  updateAIStats(container) {
    if (!this.aiSystemEnabled || !this.scene.gameWorld.aiManager) {
      container.innerHTML = 'AI system not available';
      return;
    }

    const allStatus = this.scene.gameWorld.aiManager.getAllAIStatus();
    if (!allStatus) {
      container.innerHTML = 'No AI statistics available';
      return;
    }

    const stats = allStatus.globalStats;
    const activeSystems = allStatus.systems.filter(s => s.status.enabled);

    container.innerHTML = `
      <div>AI Systems: <span style="color: #10b981;">${stats.totalAISystems}</span></div>
      <div>Active: <span style="color: #22c55e;">${stats.activeAISystems}</span></div>
      <div>Total Decisions: <span style="color: #3b82f6;">${stats.totalDecisions}</span></div>
      <div>Current Tasks: <span style="color: #f59e0b;">${activeSystems.reduce((sum, s) => sum + s.status.currentTasks.length, 0)}</span></div>
      <div>Avg Performance: <span style="color: #8b5cf6;">${stats.averagePerformance.toFixed(1)}</span></div>
    `;

    // Show strategy distribution
    const strategies = {};
    activeSystems.forEach(s => {
      const strategy = s.status.aiType;
      strategies[strategy] = (strategies[strategy] || 0) + 1;
    });

    if (Object.keys(strategies).length > 0) {
      const strategyText = Object.entries(strategies)
        .map(([strategy, count]) => `${strategy}:${count}`)
        .join(', ');
      container.innerHTML += `<div style="margin-top: 4px; font-size: 10px; color: rgb(156, 163, 175);">Strategies: ${strategyText}</div>`;
    }
  }

  refreshAIStats() {
    const statsDisplay = document.getElementById('ai-stats-display');
    if (statsDisplay) {
      this.updateAIStats(statsDisplay);
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
        ${stats.isInBattle ? `<div style="color: #ef4444;">⚔️ IN BATTLE at [${stats.battleHex?.join(', ') || 'unknown'}]</div>` : ''}
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

      // NEW: Battle-specific controls (if unit is in battle)
      if (stats.isInBattle) {
        const battleControls = document.createElement('div');
        battleControls.style.cssText = `
          background: rgba(220, 38, 38, 0.1);
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 8px;
          border: 1px solid rgba(220, 38, 38, 0.3);
        `;

        const battleTitle = document.createElement('div');
        battleTitle.textContent = '⚔️ Battle Controls';
        battleTitle.style.cssText = 'font-size: 12px; font-weight: bold; margin-bottom: 6px; color: #ef4444;';
        battleControls.appendChild(battleTitle);

        const battleButtons = document.createElement('div');
        battleButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 6px;';

        const retreatBtn = document.createElement('button');
        retreatBtn.textContent = '🏃 Retreat';
        retreatBtn.style.cssText = `
          padding: 6px;
          border: none;
          border-radius: 3px;
          background: rgba(239, 68, 68, 0.8);
          color: white;
          cursor: pointer;
          font-size: 10px;
          font-weight: 500;
        `;
        retreatBtn.onclick = () => {
          if (this.controlledUnit.retreatFromBattle()) {
            this.showNotification(`🏃 ${this.controlledUnit.type} retreated from battle`, 'success');
            this.buildInterface();
          }
        };

        const viewBattleBtn = document.createElement('button');
        viewBattleBtn.textContent = '👁️ View Battle';
        viewBattleBtn.style.cssText = `
          padding: 6px;
          border: none;
          border-radius: 3px;
          background: rgba(168, 85, 247, 0.8);
          color: white;
          cursor: pointer;
          font-size: 10px;
          font-weight: 500;
        `;
        viewBattleBtn.onclick = () => {
          const battle = this.controlledUnit.getBattle();
          if (battle && this.scene.uiManager.battleInterface) {
            this.scene.uiManager.showBattleInterface(battle, { showPrediction: true });
          }
        };

        battleButtons.appendChild(retreatBtn);
        battleButtons.appendChild(viewBattleBtn);
        battleControls.appendChild(battleButtons);
        section.appendChild(battleControls);
      }

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

  // Unit control methods - Enhanced with battle awareness
  startMoveOrder() {
    if (!this.controlledUnit) return;
    if (this.controlledUnit.isInBattle && this.controlledUnit.isInBattle()) {
      this.showNotification('Unit cannot move while in battle. Retreat first!', 'error');
      return;
    }
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
    if (this.controlledUnit.isInBattle && this.controlledUnit.isInBattle()) {
      this.showNotification('Unit cannot chase while in battle. Retreat first!', 'error');
      return;
    }
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
        if (unit.moveTo) {
          unit.moveTo([q, r]);
          console.log(`🏃 ${unit.type} ordered to move to [${q}, ${r}]`);
        } else {
          unit.destination = [q, r];
          console.log(`🏃 ${unit.type} destination set to [${q}, ${r}]`);
        }
        
      } else if (this.orderMode.type === 'attack') {
        const target = this.scene.gameWorld.getUnitAt(q, r);
        if (target && target.owner !== unit.owner) {
          const result = unit.attackUnit(target);
          console.log(`⚔️ Attack result:`, result);
          if (this.battleSystemEnabled) {
            this.refreshBattleStats(); // Update battle stats after attack
          }
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

      // Check if chaser is now in battle (can't chase while in battle)
      if (chaser.isInBattle && chaser.isInBattle()) {
        console.log(`🎯 ${chaser.type} stopped chasing - now in battle`);
        chaser.chaseTarget = null;
        return;
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
        if (chaser.moveTo) {
          chaser.moveTo([targetQ, targetR]);
        } else {
          chaser.destination = [targetQ, targetR];
        }
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

      // Don't auto-battle if unit is already in battle (battle manager handles it)
      if (unit.isInBattle && unit.isInBattle()) {
        setTimeout(battleUpdate, 2000); // Check again later
        return;
      }

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
          if (unit.moveTo) {
            unit.moveTo(closest.coords);
          } else {
            unit.destination = closest.coords;
          }
        }
      }

      // Continue auto-battle
      setTimeout(battleUpdate, 1500);
    };

    battleUpdate();
  }

  buildInterface() {
    // Check battle system availability on each build
    this.checkBattleSystemAvailability();
    // Check AI system availability on each build 
    this.checkAISystemAvailability();
    
    this.clearContent();

    // God Mode Toggle
    this.createGodModeSection();
    
    // Player Management
    this.createPlayerSection();
    
    // Resource Management (only if god mode)
    if (this.godMode) {
      this.createResourceSection();
    }
    
    // Save/Load System (only if god mode) - Preserved
    if (this.godMode) {
      this.createSaveLoadSection();
    }

    // NEW: AI System (only if god mode)
    if (this.godMode) {
      this.createAISection();
    }

    // NEW: Battle System (only if god mode)
    if (this.godMode) {
      this.createBattleSection();
    }

    // NEW: Unit Stacking System (only if god mode)
    if (this.godMode) {
      this.createStackingSection();
    }
    
    // Time Controls
    this.createTimeSection();
    
    // Entity Spawning (only if god mode) - Enhanced with battle units
    if (this.godMode) {
      this.createSpawningSection();
      this.createUnitControlSection();
    }
    
    // World Controls (only if god mode)
    if (this.godMode) {
      this.createWorldSection();
    }
    
    // Debug Information - Enhanced with battle info
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
    
    // Clear existing options first
    playerSelect.innerHTML = '';
    
    // Add default option if no players
    if (players.length === 0) {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'No players available';
      defaultOption.style.background = 'rgb(31, 41, 55)';
      defaultOption.style.color = '#ef4444';
      playerSelect.appendChild(defaultOption);
    } else {
      players.forEach((player, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${player.name} (${player.buildings.length} buildings, ${player.units.length} units)`;
        option.style.background = 'rgb(31, 41, 55)';
        option.style.color = `#${player.color.toString(16).padStart(6, '0')}`;
        playerSelect.appendChild(option);
      });
    }

    // Improved change handler with error handling
    playerSelect.onchange = (e) => {
      try {
        const selectedIndex = parseInt(e.target.value);
        if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < players.length) {
          this.selectedPlayer = players[selectedIndex];
          console.log(`👥 Selected player: ${this.selectedPlayer.name}`);
          this.buildInterface();
        } else {
          console.warn('⚠️ Invalid player selection');
        }
      } catch (error) {
        console.error('❌ Error in player selection:', error);
      }
    };

    // Set default selection more robustly
    if (!this.selectedPlayer && players.length > 0) {
      this.selectedPlayer = players[0];
      playerSelect.value = '0';
    } else if (this.selectedPlayer) {
      // Try to maintain current selection
      const currentIndex = players.indexOf(this.selectedPlayer);
      if (currentIndex >= 0) {
        playerSelect.value = currentIndex.toString();
      }
    }

    section.appendChild(playerSelect);

    // Player info - Enhanced with battle information
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
      const battlingUnits = this.battleSystemEnabled ? 
        this.selectedPlayer.units.filter(unit => unit.isInBattle && unit.isInBattle()).length : 0;
      const idleUnits = this.selectedPlayer.units.length - battlingUnits;
      
      info.innerHTML = `
        <div style="color: #${this.selectedPlayer.color.toString(16).padStart(6, '0')}; font-weight: bold; margin-bottom: 4px;">
          ${this.selectedPlayer.name}
        </div>
        <div>Buildings: ${this.selectedPlayer.buildings.length} | Units: ${this.selectedPlayer.units.length}</div>
        ${this.battleSystemEnabled ? `<div>Units: ${idleUnits} idle, ${battlingUnits} battling</div>` : ''}
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

    // Quick spawn buttons - Enhanced with battle units
    const spawnButtons = document.createElement('div');
    spawnButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;';

    const spawnOptions = [
      { label: 'Worker', action: () => this.spawnUnit('Worker'), color: 'rgba(59, 130, 246, 0.8)' },
      { label: 'Warrior', action: () => this.spawnUnit('Warrior'), color: 'rgba(239, 68, 68, 0.8)' },
      { label: 'Archer', action: () => this.spawnUnit('Archer'), color: 'rgba(34, 197, 94, 0.8)' },
      { label: 'Scout', action: () => this.spawnUnit('Scout'), color: 'rgba(168, 85, 247, 0.8)' },
      { label: 'Builder', action: () => this.spawnUnit('Builder'), color: 'rgba(107, 114, 128, 0.8)' },
      { label: 'FootSoldier', action: () => this.spawnUnit('FootSoldier'), color: 'rgba(220, 38, 38, 0.8)' }
    ];

    spawnOptions.forEach(({ label, action, color }) => {
      const btn = document.createElement('button');
      btn.innerHTML = label;
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
      spawnButtons.appendChild(btn);
    });

    section.appendChild(spawnButtons);

    // Building spawn buttons
    const buildingButtons = document.createElement('div');
    buildingButtons.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;';

    const buildingOptions = [
      { label: 'House', action: () => this.spawnBuilding('House') },
      { label: 'LumberCamp', action: () => this.spawnBuilding('LumberCamp') },
      { label: 'Barracks', action: () => this.spawnBuilding('Barracks') },
      { label: 'Mine', action: () => this.spawnBuilding('Mine') }
    ];

    buildingOptions.forEach(({ label, action }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = `
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: rgba(168, 85, 247, 0.6);
        color: white;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s;
      `;
      
      btn.onmouseover = () => {
        btn.style.background = 'rgba(168, 85, 247, 0.8)';
        btn.style.transform = 'scale(1.02)';
      };
      
      btn.onmouseout = () => {
        btn.style.background = 'rgba(168, 85, 247, 0.6)';
        btn.style.transform = 'scale(1)';
      };
      
      btn.onclick = action;
      buildingButtons.appendChild(btn);
    });

    section.appendChild(buildingButtons);

    // NEW: Army spawning button (if battle system enabled)
    if (this.battleSystemEnabled) {
      const armyButton = document.createElement('button');
      armyButton.innerHTML = '🗡️ Spawn Test Armies';
      armyButton.style.cssText = `
        width: 100%;
        padding: 10px;
        border: none;
        border-radius: 4px;
        background: rgba(220, 38, 38, 0.8);
        color: white;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s;
        margin-bottom: 8px;
      `;
      armyButton.onclick = () => this.spawnTestArmies();
      section.appendChild(armyButton);
    }

    // Instructions
    const instructions = document.createElement('div');
    instructions.textContent = this.battleSystemEnabled ? 
      'Click buttons then click on map for units, or use Test Armies for instant battle setup' :
      'Click buttons then click on map to spawn entities';
    instructions.style.cssText = `
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

    // NEW: Battle system debug info
    let battleInfo = '';
    if (this.battleSystemEnabled && this.scene.gameWorld.battleManager) {
      const activeBattles = this.scene.gameWorld.battleManager.getActiveBattles().length;
      const battlingUnits = this.scene.gameWorld.getBattlingUnits ? this.scene.gameWorld.getBattlingUnits().length : 0;
      battleInfo = `
        <div style="color: #ef4444;">Active Battles: ${activeBattles}</div>
        <div style="color: #f59e0b;">Units in Battle: ${battlingUnits}</div>
      `;
    }

    debugInfo.innerHTML = `
      <div style="color: #10b981;">Tick: ${tickCount}</div>
      <div>Players: ${players.length}</div>
      <div>Total Units: ${totalUnits}</div>
      <div>Total Buildings: ${totalBuildings}</div>
      <div style="color: #f59e0b;">Time Speed: ${this.timeMultiplier}x</div>
      <div style="color: ${this.godMode ? '#ef4444' : '#10b981'};">God Mode: ${this.godMode ? 'ON' : 'OFF'}</div>
      <div style="color: ${this.battleSystemEnabled ? '#10b981' : '#6b7280'};">Battle System: ${this.battleSystemEnabled ? 'ENABLED' : 'DISABLED'}</div>
      ${battleInfo}
    `;

    section.appendChild(debugInfo);
    this.addToContent(section);
  }

  // Action Methods - All preserved with battle awareness
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
    } else {
      // Fallback: Store the multiplier for manual application in update loop
      this.scene.timeMultiplier = multiplier;
      console.log(`⏰ Time speed stored as scene property: ${multiplier}x`);
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
    console.log('- Battle system enabled:', this.battleSystemEnabled);
    
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

// Debug functions for browser console - Enhanced with battle features
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

// NEW: Battle system debug commands for admin panel
window.testBattleFromAdmin = function() {
  const panel = window.debugAdminPanel();
  if (panel && panel.battleSystemEnabled) {
    panel.simulateTestBattle();
  } else {
    console.log('❌ Battle system not available in admin panel');
  }
};

window.spawnArmiesFromAdmin = function() {
  const panel = window.debugAdminPanel();
  if (panel && panel.battleSystemEnabled) {
    panel.spawnTestArmies();
  } else {
    console.log('❌ Battle system not available in admin panel');
  }
};

window.AdminPanel = AdminPanel;