/**
 * BattleInterface - Real-time battle UI and player interaction
 * 
 * This class creates and manages the battle interface popup that appears when
 * players are involved in combat. It provides real-time updates, unit status,
 * combat logs, and player actions like retreating.
 * 
 * Key Features:
 * - Real-time battle status display with unit health bars
 * - Live combat log with timestamped events
 * - Player action buttons (retreat, spectate)
 * - Battle prediction display
 * - Responsive UI that updates during combat
 * - Clean, professional styling with animations
 * 
 * @class BattleInterface
 */
class BattleInterface {
  /**
   * Create a new BattleInterface instance
   * @param {Object} scene - Reference to the main game scene
   */
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.currentBattle = null;
    this.container = null;
    this.updateInterval = null;
    
    // References to DOM elements for efficient updates
    this.statusSection = null;
    this.forcesSection = null;
    this.logSection = null;
    this.actionsSection = null;
    
    this.createInterface();
  }

  /**
   * Create the complete battle interface DOM structure
   * 
   * Builds a modal-style interface with header, content sections, and styling.
   * Uses modern CSS with gradients, shadows, and smooth transitions.
   */
  createInterface() {
    // Create main battle container with modal styling
    this.container = document.createElement('div');
    this.container.id = 'battle-interface';
    this.container.className = 'battle-interface hidden';
    
    // Apply professional styling with gradients and shadows
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

    // Create header with battle title and close button
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
    
    // Close button with hover effects
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

    // Create scrollable content area
    const content = document.createElement('div');
    content.className = 'battle-content';
    content.style.cssText = `
      padding: 20px;
      max-height: 500px;
      overflow-y: auto;
    `;

    // Battle status section (location, duration, next round timer)
    const statusSection = document.createElement('div');
    statusSection.className = 'battle-status';
    statusSection.style.cssText = `
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    `;

    // Forces comparison section (attackers vs defenders)
    const forcesSection = document.createElement('div');
    forcesSection.className = 'battle-forces';
    forcesSection.style.cssText = `
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      margin-bottom: 20px;
    `;

    // Combat log section with monospace font for readability
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

    // Action buttons section (retreat, spectate, etc.)
    const actionsSection = document.createElement('div');
    actionsSection.className = 'battle-actions';
    actionsSection.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 20px;
    `;

    // Assemble the complete interface
    content.appendChild(statusSection);
    content.appendChild(forcesSection);
    content.appendChild(logSection);
    content.appendChild(actionsSection);
    
    this.container.appendChild(header);
    this.container.appendChild(content);
    
    // Add to page DOM
    document.body.appendChild(this.container);
    
    // Store references for efficient updates
    this.statusSection = statusSection;
    this.forcesSection = forcesSection;
    this.logSection = logSection;
    this.actionsSection = actionsSection;
  }

  /**
   * Show battle interface for a specific battle
   * 
   * Displays the interface, populates it with battle data, and starts
   * real-time updates for dynamic elements like timers.
   * 
   * @param {BattleData} battle - The battle to display
   * @param {Object} options - Display options (showPrediction, etc.)
   */
  show(battle, options = {}) {
    this.currentBattle = battle;
    this.isVisible = true;
    
    // Update all content sections with current battle data
    this.updateContent();
    
    // Show the interface with smooth transition
    this.container.classList.remove('hidden');
    this.container.style.display = 'block';
    
    // Start real-time updates for dynamic elements
    this.startUpdates();
    
    console.log(`🎮 Battle interface shown for battle at [${battle.hex}]`);
  }

  /**
   * Hide the battle interface
   * 
   * Smoothly hides the interface and stops all update timers to prevent
   * memory leaks and unnecessary processing.
   */
  hide() {
    this.isVisible = false;
    this.currentBattle = null;
    
    // Hide with transition
    this.container.classList.add('hidden');
    this.container.style.display = 'none';
    
    // Stop all update timers
    this.stopUpdates();
  }

  /**
   * Update all content sections with current battle data
   * 
   * Refreshes the status, forces display, and action buttons with the
   * latest information from the current battle.
   */
  updateContent() {
    if (!this.currentBattle) return;
    
    this.updateStatus();
    this.updateForces();
    this.updateActions();
  }

  /**
   * Update the battle status section
   * 
   * Shows battle location, terrain type, duration, and countdown to next round.
   * The countdown timer creates urgency and shows battle progression.
   */
  updateStatus() {
    const battle = this.currentBattle;
    const ticksElapsed = this.scene.tickCount - battle.startTick;
    const terrain = this.scene.map.getTile(...battle.hex);
    
    // Calculate time until next combat round
    const nextRoundIn = Math.max(0, 1 - (this.scene.tickCount - battle.lastCombatTick));
    
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
          <div style="font-size: 24px; color: ${nextRoundIn > 0 ? '#48bb78' : '#e53e3e'};">
            ${nextRoundIn}
          </div>
          <div style="font-size: 10px; color: #a0aec0;">
            ${nextRoundIn > 0 ? 'Ticks remaining' : 'Combat active!'}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update the forces comparison section
   * 
   * Shows attackers vs defenders with unit lists, health bars, and total HP.
   * Uses color coding and visual bars to make unit status immediately clear.
   */
  updateForces() {
    const battle = this.currentBattle;
    
    // Generate HTML for attackers (red theme)
    const attackersHtml = this.renderForces(battle.attackers, 'Attackers', '#e53e3e');
    
    // Central VS separator with dramatic styling
    const vsHtml = `
      <div style="display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #ffd700;">
        ⚔️<br>VS
      </div>
    `;
    
    // Generate HTML for defenders (blue theme)
    const defendersHtml = this.renderForces(battle.defenders, 'Defenders', '#3182ce');
    
    this.forcesSection.innerHTML = attackersHtml + vsHtml + defendersHtml;
  }

  /**
   * Render a forces list for one side (attackers or defenders)
   * 
   * Creates a styled unit list with health bars, unit names, and summary stats.
   * Each unit gets an individual health bar that updates in real-time.
   * 
   * @param {Array} units - Array of units to display
   * @param {string} title - Section title ("Attackers" or "Defenders")
   * @param {string} color - Theme color for this side
   * @returns {string} HTML string for this forces section
   */
  renderForces(units, title, color) {
    const aliveUnits = units.filter(u => u.isAlive());
    const totalHp = aliveUnits.reduce((sum, u) => sum + u.hp, 0);
    const maxHp = aliveUnits.reduce((sum, u) => sum + u.maxHp, 0);
    
    // Generate individual unit entries with health bars
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
   * Update action buttons based on player participation
   * 
   * Shows retreat button if player has units in battle, and always shows
   * a spectate/close button. Buttons have hover effects and clear labeling.
   */
  updateActions() {
    const battle = this.currentBattle;
    const playerUnits = battle.getAllUnits().filter(unit => unit.owner === this.scene.humanPlayer);
    
    let buttonsHtml = '';
    
    // Retreat button (only if player has units in this battle)
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
    
    // Spectate/Close button (always available)
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
    
    // Add event listeners for button functionality
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
   * Update interface with latest battle results
   * 
   * Called by BattleManager after each combat round to refresh the display
   * and add new combat events to the log.
   * 
   * @param {BattleData} battle - Updated battle state
   * @param {Array} results - Combat results from the latest round
   */
  update(battle, results) {
    this.currentBattle = battle;
    
    // Refresh all display sections
    this.updateContent();
    
    // Add latest combat results to the log
    this.addCombatResults(results);
  }

  /**
   * Add combat results to the scrolling battle log
   * 
   * Creates timestamped entries for each attack with color-coded damage.
   * Automatically scrolls to show the latest events and manages log length.
   * 
   * @param {Array} results - Array of combat result objects
   */
  addCombatResults(results) {
    if (!results || results.length === 0) return;
    
    const timestamp = new Date().toLocaleTimeString();
    let logHtml = `<div style="color: #ffd700; font-weight: bold; margin: 8px 0;">[${timestamp}] Combat Round</div>`;
    
    // Process each combat result
    results.forEach(result => {
      const { attacker, target, result: combatResult } = result;
      
      // Color-code damage based on result severity
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
    
    // Add to log and auto-scroll to bottom
    this.logSection.innerHTML += logHtml;
    this.logSection.scrollTop = this.logSection.scrollHeight;
    
    // Manage log length to prevent memory bloat
    const logEntries = this.logSection.children;
    if (logEntries.length > 50) {
      // Remove oldest 10 entries when we hit the limit
      for (let i = 0; i < 10; i++) {
        this.logSection.removeChild(logEntries[0]);
      }
    }
  }

  /**
   * Retreat all player units from the current battle
   * 
   * Uses the BattleManager to safely remove all player units from combat.
   * Logs the retreat action and updates the interface accordingly.
   */
  retreatPlayerUnits() {
    if (!this.currentBattle) return;
    
    const battleManager = this.scene.gameWorld.battleManager;
    const playerUnits = this.currentBattle.getAllUnits().filter(unit => unit.owner === this.scene.humanPlayer);
    
    // Remove each player unit from the battle
    playerUnits.forEach(unit => {
      battleManager.retreatUnit(unit, this.currentBattle);
    });
    
    // Log the retreat action in the combat log
    this.addCombatResults([{
      attacker: { type: 'Player' },
      target: { type: 'All Units' },
      result: { result: 'retreat', damage: 0 }
    }]);
    
    // Refresh the interface to reflect changes
    this.updateContent();
  }

  /**
   * Start real-time updates for dynamic elements
   * 
   * Creates an interval timer that updates the countdown timer and other
   * dynamic elements every 100ms for smooth visual feedback.
   */
  startUpdates() {
    this.stopUpdates(); // Clear any existing interval
    
    this.updateInterval = setInterval(() => {
      if (this.isVisible && this.currentBattle) {
        this.updateStatus(); // Refresh countdown timer
      }
    }, 100); // Update every 100ms for smooth countdown
  }

  /**
   * Stop all real-time updates
   * 
   * Clears the update interval to prevent memory leaks when the interface
   * is hidden or destroyed.
   */
  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Show battle prediction before battle starts
   * 
   * Displays win chances and strength calculations for both sides using
   * BattleResolver's prediction algorithms. Useful for strategic planning.
   * 
   * @param {Array} attackers - Attacking units
   * @param {Array} defenders - Defending units
   * @param {Object} terrain - Terrain modifiers
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
   * Clean up interface resources when destroyed
   * 
   * Stops all timers and removes the interface from the DOM to prevent
   * memory leaks when the battle system is shut down.
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