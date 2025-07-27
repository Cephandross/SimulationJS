// src/ui/PlayerOverviewUI.js - Horizontal layout across top

class PlayerOverviewUI {
  constructor(scene) {
    this.scene = scene;
    this.selectedPlayer = null;
    this.panelElement = null;
    this.resourceHistory = new Map();
    this.updateInterval = null;
    
    this.createPanel();
    this.setupEventListeners();
    this.startUpdating();
  }

  createPanel() {
    this.panelElement = document.createElement('div');
    this.panelElement.className = 'player-overview-panel';
    this.panelElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 120px;
      background: rgba(17, 24, 39, 0.95);
      border-bottom: 2px solid rgb(75, 85, 99);
      font-family: Arial, sans-serif;
      color: white;
      z-index: 1500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      display: flex;
      padding: 12px;
      gap: 16px;
    `;
    
    document.body.appendChild(this.panelElement);
    this.updateDisplay();
  }

  updateDisplay() {
    if (!this.panelElement) return;

    // Get current player (default to first player if none selected)
    if (!this.selectedPlayer && this.scene.gameWorld.players.length > 0) {
      this.selectedPlayer = this.scene.gameWorld.players[0];
    }

    this.panelElement.innerHTML = '';
    
    if (this.selectedPlayer) {
      // Left section: Player info and selector
      this.createPlayerSection();
      
      // Center section: Resources grid
      this.createResourcesSection();
      
      // Right section: Quick stats and actions
      this.createQuickInfoSection();
    }
  }

  createPlayerSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      width: 280px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    // Player selector dropdown
    const playerSelector = document.createElement('select');
    playerSelector.style.cssText = `
      padding: 8px;
      background: rgba(31, 41, 55, 0.9);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 4px;
      color: white;
      font-size: 13px;
      font-weight: bold;
    `;

    // Add players to dropdown
    this.scene.gameWorld.players.forEach((player, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${player.name}`;
      option.style.background = 'rgb(31, 41, 55)';
      option.style.color = `#${player.color.toString(16).padStart(6, '0')}`;
      if (player === this.selectedPlayer) {
        option.selected = true;
      }
      playerSelector.appendChild(option);
    });

    playerSelector.onchange = (e) => {
      this.selectedPlayer = this.scene.gameWorld.players[e.target.value];
      this.updateDisplay();
    };

    section.appendChild(playerSelector);

    // Current tick and time info
    const tickInfo = document.createElement('div');
    tickInfo.style.cssText = `
      background: rgba(31, 41, 55, 0.6);
      padding: 8px;
      border-radius: 4px;
      border: 1px solid rgba(75, 85, 99, 0.5);
      text-align: center;
    `;

    tickInfo.innerHTML = `
      <div style="font-size: 16px; font-weight: bold; color: #10b981;">Tick: ${this.scene.tickCount || 0}</div>
      <div style="font-size: 11px; color: rgb(156, 163, 175);">
        ${this.selectedPlayer.buildings.length} buildings • ${this.selectedPlayer.units.length} units
      </div>
    `;

    section.appendChild(tickInfo);
    this.panelElement.appendChild(section);
  }

  createResourcesSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      flex: 1;
      min-width: 500px;
    `;

    // Resources grid - 2 rows x 4 columns
    const resourceGrid = document.createElement('div');
    resourceGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 8px;
      height: 96px;
    `;

    const resources = this.selectedPlayer.resources;
    const resourceOrder = ['food', 'wood', 'stone', 'iron', 'copper', 'coal', 'gold', 'coins'];
    
    resourceOrder.forEach(resourceType => {
      const amount = resources[resourceType] || 0;
      const perTick = this.calculateResourcePerTick(resourceType);
      
      const resourceItem = document.createElement('div');
      resourceItem.style.cssText = `
        background: rgba(31, 41, 55, 0.6);
        padding: 6px 8px;
        border-radius: 4px;
        border: 1px solid rgba(75, 85, 99, 0.5);
        display: flex;
        flex-direction: column;
        justify-content: center;
      `;

      resourceItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span style="font-size: 11px; font-weight: 500; color: ${this.getResourceColor(resourceType)};">
            ${this.getResourceIcon(resourceType)} ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
          </span>
          <span style="font-size: 14px; font-weight: bold; color: white;">
            ${this.formatNumber(amount)}
          </span>
        </div>
        <div style="font-size: 9px; color: ${perTick >= 0 ? '#10b981' : '#ef4444'}; text-align: right;">
          ${perTick >= 0 ? '+' : ''}${this.formatNumber(perTick)}/tick
        </div>
      `;

      resourceGrid.appendChild(resourceItem);
    });

    section.appendChild(resourceGrid);
    this.panelElement.appendChild(section);
  }

  createQuickInfoSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      width: 300px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    // Construction queue (if any)
    const buildingQueue = this.selectedPlayer.buildings.filter(building => !building.completed);
    
    if (buildingQueue.length > 0) {
      const constructionInfo = document.createElement('div');
      constructionInfo.style.cssText = `
        background: rgba(245, 158, 11, 0.2);
        padding: 8px;
        border-radius: 4px;
        border: 1px solid rgba(245, 158, 11, 0.3);
      `;

      const building = buildingQueue[0]; // Show first in queue
      const progress = building.ticksBuild / building.buildTime;
      const remainingTicks = building.buildTime - building.ticksBuild;

      constructionInfo.innerHTML = `
        <div style="font-size: 11px; color: #f59e0b; font-weight: bold; margin-bottom: 4px;">
          🏗️ BUILDING: ${building.type}
        </div>
        <div style="background: rgba(75, 85, 99, 0.5); height: 6px; border-radius: 3px; margin: 4px 0; overflow: hidden;">
          <div style="background: #f59e0b; height: 100%; width: ${Math.floor(progress * 100)}%; transition: width 0.3s;"></div>
        </div>
        <div style="font-size: 10px; color: rgb(156, 163, 175);">
          ${remainingTicks} ticks remaining • [${building.coords[0]}, ${building.coords[1]}]
        </div>
      `;

      section.appendChild(constructionInfo);
    }

    // Unit movements (if any)
    const movingUnits = this.selectedPlayer.units.filter(unit => unit.destination);
    
    if (movingUnits.length > 0) {
      const movementInfo = document.createElement('div');
      movementInfo.style.cssText = `
        background: rgba(59, 130, 246, 0.2);
        padding: 8px;
        border-radius: 4px;
        border: 1px solid rgba(59, 130, 246, 0.3);
      `;

      const unit = movingUnits[0]; // Show first moving unit
      const distance = this.calculateDistance(unit.coords, [unit.destination.q, unit.destination.r]);
      const eta = Math.ceil(distance / (unit.maxMovePts || 1));

      movementInfo.innerHTML = `
        <div style="font-size: 11px; color: #3b82f6; font-weight: bold; margin-bottom: 4px;">
          🏃 MOVING: ${unit.type}
        </div>
        <div style="font-size: 10px; color: rgb(156, 163, 175);">
          [${unit.coords[0]}, ${unit.coords[1]}] → [${unit.destination.q}, ${unit.destination.r}]
        </div>
        <div style="font-size: 10px; color: #10b981; margin-top: 2px;">
          ETA: ${eta} ticks
        </div>
      `;

      section.appendChild(movementInfo);
    }

    // Stats summary
    const statsInfo = document.createElement('div');
    statsInfo.style.cssText = `
      background: rgba(31, 41, 55, 0.6);
      padding: 8px;
      border-radius: 4px;
      border: 1px solid rgba(75, 85, 99, 0.5);
      flex: 1;
    `;

    const completedBuildings = this.selectedPlayer.buildings.filter(b => b.completed).length;
    const totalBuildings = this.selectedPlayer.buildings.length;

    statsInfo.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: center;">
        <div>
          <div style="font-size: 16px; color: #10b981;">✅</div>
          <div style="font-size: 12px; font-weight: bold; color: white;">${completedBuildings}</div>
          <div style="font-size: 9px; color: rgb(156, 163, 175);">Complete</div>
        </div>
        <div>
          <div style="font-size: 16px; color: #f59e0b;">🔨</div>
          <div style="font-size: 12px; font-weight: bold; color: white;">${totalBuildings - completedBuildings}</div>
          <div style="font-size: 9px; color: rgb(156, 163, 175);">Building</div>
        </div>
      </div>
    `;

    section.appendChild(statsInfo);
    this.panelElement.appendChild(section);
  }

  // Helper methods (same as before)
  calculateResourcePerTick(resourceType) {
    const playerId = this.selectedPlayer.name;
    const historyKey = `${playerId}_${resourceType}`;
    
    if (!this.resourceHistory.has(historyKey)) {
      this.resourceHistory.set(historyKey, []);
    }
    
    const history = this.resourceHistory.get(historyKey);
    const currentAmount = this.selectedPlayer.resources[resourceType] || 0;
    
    history.push({ tick: this.scene.tickCount, amount: currentAmount });
    
    if (history.length > 10) {
      history.shift();
    }
    
    if (history.length < 2) return 0;
    
    const recent = history.slice(-5);
    let totalChange = 0;
    let validPairs = 0;
    
    for (let i = 1; i < recent.length; i++) {
      totalChange += recent[i].amount - recent[i-1].amount;
      validPairs++;
    }
    
    return validPairs > 0 ? Math.round((totalChange / validPairs) * 10) / 10 : 0;
  }

  calculateDistance(from, to) {
    const [q1, r1] = from;
    const [q2, r2] = to;
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  }

  getResourceIcon(resourceType) {
    const icons = {
      food: '🌾', wood: '🪵', stone: '🪨', iron: '⚙️',
      copper: '🔶', coal: '⚫', gold: '🟡', coins: '💰'
    };
    return icons[resourceType] || '📦';
  }

  getResourceColor(resourceType) {
    const colors = {
      food: '#10b981', wood: '#8b4513', stone: '#6b7280', iron: '#374151',
      copper: '#d97706', coal: '#1f2937', gold: '#fbbf24', coins: '#eab308'
    };
    return colors[resourceType] || '#9ca3af';
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
  }

  setupEventListeners() {
    this.scene.events.on('update', () => {
      if (this.scene.tickCount % 30 === 0) {
        this.updateDisplay();
      }
    });
  }

  startUpdating() {
    this.updateInterval = setInterval(() => {
      if (this.selectedPlayer) {
        this.updateDisplay();
      }
    }, 2000);
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement);
    }
  }
}

window.PlayerOverviewUI = PlayerOverviewUI;