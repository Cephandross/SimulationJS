// src/ui/BattleInterface.js
// Battle UI popup and real-time updates

class BattleInterface {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.currentBattle = null;
    this.container = null;
    this.updateInterval = null;
    
    this.createInterface();
  }

  /**
   * Create the battle interface DOM elements
   */
  createInterface() {
    // Create main battle container
    this.container = document.createElement('div');
    this.container.id = 'battle-interface';
    this.container.className = 'battle-interface hidden';
    
    // CSS styles
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      min-height: 400px;
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      border: 3px solid #4a5568;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      font-family: 'Segoe UI', sans-serif;
      color: #e2e8f0;
      z-index: 1000;
      padding: 0;
      overflow: hidden;
    `;

    // Create header
    const header = document.createElement('div');
    header.className = 'battle-header';
    header.style.cssText = `
      background: linear-gradient(90deg, #e53e3e 0%, #c53030 100%);
      padding: 16px 20px;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      color: white;
      position: relative;
    `;
    header.innerHTML = '⚔️ BATTLE IN PROGRESS ⚔️';
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.addEventListener('click', () => this.hide());
    header.appendChild(closeBtn);

    // Create main content area
    const content = document.createElement('div');
    content.className = 'battle-content';
    content.style.cssText = `
      padding: 20px;
      max-height: 500px;
      overflow-y: auto;
    `;

    // Battle status section
    const statusSection = document.createElement('div');
    statusSection.className = 'battle-status';
    statusSection.style.cssText = `
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    `;

    // Forces display section
    const forcesSection = document.createElement('div');
    forcesSection.className = 'battle-forces';
    forcesSection.style.cssText = `
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      margin-bottom: 20px;
    `;

    // Combat log section
    const logSection = document.createElement('div');
    logSection.className = 'battle-log';
    logSection.style.cssText = `
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      padding: 16px;
      max-height: 200px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    `;

    // Action buttons section
    const actionsSection = document.createElement('div');
    actionsSection.className = 'battle-actions';
    actionsSection.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 20px;
    `;

    // Assemble the interface
    content.appendChild(statusSection);
    content.appendChild(forcesSection);
    content.appendChild(logSection);
    content.appendChild(actionsSection);
    
    this.container.appendChild(header);
    this.container.appendChild(content);
    
    // Add to page
    document.body.appendChild(this.container);
    
    // Store references
    this.statusSection = statusSection;
    this.forcesSection = forcesSection;
    this.logSection = logSection;
    this.actionsSection = actionsSection;
  }

  /**
   * Show battle interface for a specific battle
   */
  show(battle, options = {}) {
    this.currentBattle = battle;
    this.isVisible = true;
    
    // Update content
    this.updateContent();
    
    // Show container
    this.container.classList.remove('hidden');
    this.container.style.display = 'block';
    
    // Start real-time updates
    this.startUpdates();
    
    console.log(`🎮 Battle interface shown for battle at [${battle.hex}]`);
  }

  /**
   * Hide battle interface
   */
  hide() {
    this.isVisible = false;
    this.currentBattle = null;
    
    // Hide container
    this.container.classList.add('hidden');
    this.container.style.display = 'none';
    
    // Stop updates
    this.stopUpdates();
  }

  /**
   * Update battle interface content
   */
  updateContent() {
    if (!this.currentBattle) return;
    
    this.updateStatus();
    this.updateForces();
    this.updateActions();
  }

  /**
   * Update battle status section
   */
  updateStatus() {
    const battle = this.currentBattle;
    const ticksElapsed = this.scene.tickCount - battle.startTick;
    const terrain = this.scene.map.getTile(...battle.hex);
    
    this.statusSection.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div style="font-weight: bold; color: #ffd700; margin-bottom: 8px;">📍 Battle Location</div>
          <div>Hex: [${battle.hex.join(', ')}]</div>
          <div>Terrain: ${terrain?.type || 'Unknown'}</div>
          <div>Duration: ${ticksElapsed} ticks</div>
        </div>
        <div>
          <div style="font-weight: bold; color: #ffd700; margin-bottom: 8px;">⏱️ Next Round</div>
          <div style="font-size: 24px; color: #48bb78;">
            ${Math.max(0, 1 - (this.scene.tickCount - battle.lastCombatTick))}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update forces display
   */
  updateForces() {
    const battle = this.currentBattle;
    
    // Attackers column
    const attackersHtml = this.renderForces(battle.attackers, 'Attackers', '#e53e3e');
    
    // VS separator
    const vsHtml = `
      <div style="display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #ffd700;">
        ⚔️<br>VS
      </div>
    `;
    
    // Defenders column
    const defendersHtml = this.renderForces(battle.defenders, 'Defenders', '#3182ce');
    
    this.forcesSection.innerHTML = attackersHtml + vsHtml + defendersHtml;
  }

  /**
   * Render forces list for one side
   */
  renderForces(units, title, color) {
    const aliveUnits = units.filter(u => u.isAlive());
    const totalHp = aliveUnits.reduce((sum, u) => sum + u.hp, 0);
    const maxHp = aliveUnits.reduce((sum, u) => sum + u.maxHp, 0);
    
    const unitsHtml = aliveUnits.map(unit => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <span>${unit.type}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="background: rgba(0,0,0,0.3); border-radius: 10px; width: 60px; height: 8px; overflow: hidden;">
            <div style="background: ${color}; height: 100%; width: ${(unit.hp / unit.maxHp) * 100}%; transition: width 0.3s;"></div>
          </div>
          <span style="font-size: 11px; color: #a0aec0;">${unit.hp}/${unit.maxHp}</span>
        </div>
      </div>
    `).join('');

    return `
      <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px;">
        <div style="font-weight: bold; color: ${color}; margin-bottom: 12px; text-align: center;">
          ${title} (${aliveUnits.length})
        </div>
        <div style="margin-bottom: 12px; text-align: center;">
          <div style="font-size: 12px; color: #a0aec0;">Total HP</div>
          <div style="font-size: 18px; font-weight: bold;">${totalHp}/${maxHp}</div>
        </div>
        <div style="max-height: 150px; overflow-y: auto;">
          ${unitsHtml || '<div style="text-align: center; color: #718096;">No units remaining</div>'}
        </div>
      </div>
    `;
  }

  /**
   * Update action buttons
   */
  updateActions() {
    const battle = this.currentBattle;
    const playerUnits = battle.getAllUnits().filter(unit => unit.owner === this.scene.humanPlayer);
    
    let buttonsHtml = '';
    
    // Retreat button (if player has units in battle)
    if (playerUnits.length > 0) {
      buttonsHtml += `
        <button id="retreat-btn" style="
          background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          🏃 Retreat All Units
        </button>
      `;
    }
    
    // Spectate/Close button
    buttonsHtml += `
      <button id="spectate-btn" style="
        background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
        border: none;
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        👁️ Spectate
      </button>
    `;
    
    this.actionsSection.innerHTML = buttonsHtml;
    
    // Add event listeners
    const retreatBtn = document.getElementById('retreat-btn');
    if (retreatBtn) {
      retreatBtn.addEventListener('click', () => this.retreatPlayerUnits());
    }
    
    const spectateBtn = document.getElementById('spectate-btn');
    if (spectateBtn) {
      spectateBtn.addEventListener('click', () => this.hide());
    }
  }

  /**
   * Update interface with battle results
   */
  update(battle, results) {
    this.currentBattle = battle;
    
    // Update main content
    this.updateContent();
    
    // Add combat results to log
    this.addCombatResults(results);
  }

  /**
   * Add combat results to the battle log
   */
  addCombatResults(results) {
    if (!results || results.length === 0) return;
    
    const timestamp = new Date().toLocaleTimeString();
    let logHtml = `<div style="color: #ffd700; font-weight: bold; margin: 8px 0;">[${timestamp}] Combat Round</div>`;
    
    results.forEach(result => {
      const { attacker, target, result: combatResult } = result;
      const damageColor = combatResult.result === 'victory' ? '#e53e3e' : '#f6ad55';
      
      logHtml += `
        <div style="margin: 4px 0; padding-left: 12px;">
          <span style="color: #48bb78;">${attacker.type}</span> 
          attacks 
          <span style="color: #ed8936;">${target.type}</span>
          for <span style="color: ${damageColor}; font-weight: bold;">${combatResult.damage}</span> damage
          ${combatResult.result === 'victory' ? '<span style="color: #e53e3e;">💀 DEFEATED!</span>' : ''}
        </div>
      `;
    });
    
    // Add to log and scroll to bottom
    this.logSection.innerHTML += logHtml;
    this.logSection.scrollTop = this.logSection.scrollHeight;
    
    // Limit log length to prevent memory issues
    const logEntries = this.logSection.children;
    if (logEntries.length > 50) {
      for (let i = 0; i < 10; i++) {
        this.logSection.removeChild(logEntries[0]);
      }
    }
  }

  /**
   * Retreat all player units from battle
   */
  retreatPlayerUnits() {
    if (!this.currentBattle) return;
    
    const battleManager = this.scene.gameWorld.battleManager;
    const playerUnits = this.currentBattle.getAllUnits().filter(unit => unit.owner === this.scene.humanPlayer);
    
    playerUnits.forEach(unit => {
      battleManager.retreatUnit(unit, this.currentBattle);
    });
    
    this.addCombatResults([{
      attacker: { type: 'Player' },
      target: { type: 'All Units' },
      result: { result: 'retreat', damage: 0 }
    }]);
    
    // Update interface
    this.updateContent();
  }

  /**
   * Start real-time updates
   */
  startUpdates() {
    this.stopUpdates(); // Clear any existing interval
    
    this.updateInterval = setInterval(() => {
      if (this.isVisible && this.currentBattle) {
        this.updateStatus(); // Update countdown timer
      }
    }, 100); // Update every 100ms for smooth countdown
  }

  /**
   * Stop real-time updates
   */
  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Show battle prediction before battle starts
   */
  showPrediction(attackers, defenders, terrain) {
    const prediction = BattleResolver.predictBattleOutcome(attackers, defenders, terrain);
    
    const predictionHtml = `
      <div style="background: rgba(255,215,0,0.1); border: 2px solid #ffd700; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <div style="font-weight: bold; color: #ffd700; text-align: center; margin-bottom: 12px;">🔮 Battle Prediction</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center;">
          <div>
            <div style="color: #e53e3e; font-weight: bold;">Attackers</div>
            <div>${Math.round(prediction.attackerWinChance * 100)}% chance</div>
            <div style="color: #a0aec0; font-size: 12px;">Strength: ${Math.round(prediction.attackerStrength)}</div>
          </div>
          <div>
            <div style="color: #3182ce; font-weight: bold;">Defenders</div>
            <div>${Math.round(prediction.defenderWinChance * 100)}% chance</div>
            <div style="color: #a0aec0; font-size: 12px;">Strength: ${Math.round(prediction.defenderStrength)}</div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 12px; color: #a0aec0; font-size: 12px;">
          Estimated Duration: ~${prediction.estimatedRounds} rounds
        </div>
      </div>
    `;
    
    // Add prediction to status section
    this.statusSection.innerHTML += predictionHtml;
  }

  /**
   * Clean up interface when destroyed
   */
  destroy() {
    this.stopUpdates();
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Add global CSS for battle interface
const battleCSS = `
  .battle-interface.hidden {
    display: none !important;
  }
  
  .battle-interface::-webkit-scrollbar {
    width: 8px;
  }
  
  .battle-interface::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
  }
  
  .battle-interface::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 4px;
  }
  
  .battle-interface::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.5);
  }
  
  .battle-interface button:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  
  .battle-interface button:active {
    transform: scale(0.98) !important;
  }
`;

// Inject CSS
if (!document.getElementById('battle-interface-css')) {
  const style = document.createElement('style');
  style.id = 'battle-interface-css';
  style.textContent = battleCSS;
  document.head.appendChild(style);
}

window.BattleInterface = BattleInterface;