// src/ui/PlayerOverviewUI.js - Main player dashboard

class PlayerOverviewUI {
  constructor(scene) {
    this.scene = scene;
    this.selectedPlayer = null;
    this.panelElement = null;
    this.resourceHistory = new Map(); // Track resource changes for per-tick calculation
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
      top: 10px;
      right: 10px;
      width: 380px;
      min-height: 300px;
      background: rgba(17, 24, 39, 0.95);
      border: 2px solid rgb(75, 85, 99);
      border-radius: 8px;
      font-family: Arial, sans-serif;
      color: white;
      z-index: 1500;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
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
    
    // Header with player selector
    this.createHeader();
    
    if (this.selectedPlayer) {
      // Resources section
      this.createResourcesSection();
      
      // Unit movements section
      this.createMovementSection();
      
      // Building queue section
      this.createBuildingQueueSection();
      
      // Quick stats section
      this.createQuickStatsSection();
    }
  }

  createHeader() {
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(31, 41, 55, 0.8);
      border-radius: 6px 6px 0 0;
    `;

    // Player selector dropdown
    const playerSelector = document.createElement('select');
    playerSelector.style.cssText = `
      width: 100%;
      padding: 8px;
      background: rgba(31, 41, 55, 0.9);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 4px;
      color: white;
      font-size: 14px;
      font-weight: bold;
    `;

    // Add players to dropdown
    this.scene.gameWorld.players.forEach((player, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${player.name} - ${player.buildings.length} buildings, ${player.units.length} units`;
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

    header.appendChild(playerSelector);
    this.panelElement.appendChild(header);
  }

  createResourcesSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid rgb(75, 85, 99);
    `;

    const title = document.createElement('h3');
    title.textContent = '📊 Resources';
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      color: rgb(156, 163, 175);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    section.appendChild(title);

    // Resource grid
    const resourceGrid = document.createElement('div');
    resourceGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    `;

    const resources = this.selectedPlayer.resources;
    const resourceOrder = ['food', 'wood', 'stone', 'iron', 'copper', 'coal', 'gold', 'coins'];
    
    resourceOrder.forEach(resourceType => {
      const amount = resources[resourceType] || 0;
      const perTick = this.calculateResourcePerTick(resourceType);
      
      const resourceItem = document.createElement('div');
      resourceItem.style.cssText = `
        background: rgba(31, 41, 55, 0.6);
        padding: 8px;
        border-radius: 4px;
        border: 1px solid rgba(75, 85, 99, 0.5);
      `;

      resourceItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; text-transform: capitalize; color: ${this.getResourceColor(resourceType)};">
            ${this.getResourceIcon(resourceType)} ${resourceType}
          </span>
          <span style="font-size: 12px; font-weight: bold; color: white;">
            ${this.formatNumber(amount)}
          </span>
        </div>
        <div style="font-size: 10px; color: ${perTick >= 0 ? '#10b981' : '#ef4444'}; margin-top: 2px;">
          ${perTick >= 0 ? '+' : ''}${this.formatNumber(perTick)}/tick
        </div>
      `;

      resourceGrid.appendChild(resourceItem);
    });

    section.appendChild(resourceGrid);
    this.panelElement.appendChild(section);
  }

  createMovementSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid rgb(75, 85, 99);
    `;

    const title = document.createElement('h3');
    title.textContent = '🏃 Unit Movements';
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      color: rgb(156, 163, 175);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    section.appendChild(title);

    // Find units that are moving
    const movingUnits = this.selectedPlayer.units.filter(unit => unit.destination);
    
    if (movingUnits.length === 0) {
      const noMovements = document.createElement('div');
      noMovements.textContent = 'No unit movements';
      noMovements.style.cssText = `
        color: rgb(107, 114, 128);
        font-size: 12px;
        font-style: italic;
        text-align: center;
        padding: 8px;
      `;
      section.appendChild(noMovements);
    } else {
      // Show next 3 movements
      movingUnits.slice(0, 3).forEach(unit => {
        const movementItem = document.createElement('div');
        movementItem.style.cssText = `
          background: rgba(31, 41, 55, 0.6);
          padding: 8px;
          border-radius: 4px;
          border: 1px solid rgba(75, 85, 99, 0.5);
          margin-bottom: 6px;
        `;

        const distance = this.calculateDistance(unit.coords, [unit.destination.q, unit.destination.r]);
        const eta = Math.ceil(distance / (unit.maxMovePts || 1));

        movementItem.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: bold; color: white;">
              ${unit.type}
            </span>
            <span style="font-size: 11px; color: #10b981;">
              ETA: ${eta} ticks
            </span>
          </div>
          <div style="font-size: 10px; color: rgb(156, 163, 175); margin-top: 2px;">
            [${unit.coords[0]}, ${unit.coords[1]}] → [${unit.destination.q}, ${unit.destination.r}]
          </div>
        `;

        section.appendChild(movementItem);
      });

      if (movingUnits.length > 3) {
        const moreMovements = document.createElement('div');
        moreMovements.textContent = `+${movingUnits.length - 3} more movements...`;
        moreMovements.style.cssText = `
          color: rgb(107, 114, 128);
          font-size: 11px;
          text-align: center;
          padding: 4px;
        `;
        section.appendChild(moreMovements);
      }
    }

    this.panelElement.appendChild(section);
  }

  createBuildingQueueSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid rgb(75, 85, 99);
    `;

    const title = document.createElement('h3');
    title.textContent = '🏗️ Construction Queue';
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      color: rgb(156, 163, 175);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    section.appendChild(title);

    // Find buildings under construction
    const buildingQueue = this.selectedPlayer.buildings.filter(building => !building.completed);
    
    if (buildingQueue.length === 0) {
      const noBuildings = document.createElement('div');
      noBuildings.textContent = 'No buildings in queue';
      noBuildings.style.cssText = `
        color: rgb(107, 114, 128);
        font-size: 12px;
        font-style: italic;
        text-align: center;
        padding: 8px;
      `;
      section.appendChild(noBuildings);
    } else {
      // Show next 3 buildings
      buildingQueue.slice(0, 3).forEach(building => {
        const buildingItem = document.createElement('div');
        buildingItem.style.cssText = `
          background: rgba(31, 41, 55, 0.6);
          padding: 8px;
          border-radius: 4px;
          border: 1px solid rgba(75, 85, 99, 0.5);
          margin-bottom: 6px;
        `;

        const progress = building.ticksBuild / building.buildTime;
        const remainingTicks = building.buildTime - building.ticksBuild;

        buildingItem.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: bold; color: white;">
              ${building.type}
            </span>
            <span style="font-size: 11px; color: #f59e0b;">
              ${remainingTicks} ticks
            </span>
          </div>
          <div style="background: rgba(75, 85, 99, 0.5); height: 6px; border-radius: 3px; margin: 4px 0; overflow: hidden;">
            <div style="background: #10b981; height: 100%; width: ${Math.floor(progress * 100)}%; transition: width 0.3s;"></div>
          </div>
          <div style="font-size: 10px; color: rgb(156, 163, 175);">
            [${building.coords[0]}, ${building.coords[1]}] - ${Math.floor(progress * 100)}% complete
          </div>
        `;

        section.appendChild(buildingItem);
      });

      if (buildingQueue.length > 3) {
        const moreBuildings = document.createElement('div');
        moreBuildings.textContent = `+${buildingQueue.length - 3} more in queue...`;
        moreBuildings.style.cssText = `
          color: rgb(107, 114, 128);
          font-size: 11px;
          text-align: center;
          padding: 4px;
        `;
        section.appendChild(moreBuildings);
      }
    }

    this.panelElement.appendChild(section);
  }

  createQuickStatsSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px 16px;
    `;

    const title = document.createElement('h3');
    title.textContent = '📈 Quick Stats';
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 14px;
      color: rgb(156, 163, 175);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    section.appendChild(title);

    const statsGrid = document.createElement('div');
    statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    `;

    const stats = [
      { label: 'Buildings', value: this.selectedPlayer.buildings.length, icon: '🏗️' },
      { label: 'Units', value: this.selectedPlayer.units.length, icon: '👥' },
      { label: 'Completed', value: this.selectedPlayer.buildings.filter(b => b.completed).length, icon: '✅' },
      { label: 'Population', value: this.selectedPlayer.population || this.selectedPlayer.units.length, icon: '🏘️' }
    ];

    stats.forEach(stat => {
      const statItem = document.createElement('div');
      statItem.style.cssText = `
        background: rgba(31, 41, 55, 0.6);
        padding: 8px;
        border-radius: 4px;
        border: 1px solid rgba(75, 85, 99, 0.5);
        text-align: center;
      `;

      statItem.innerHTML = `
        <div style="font-size: 16px; margin-bottom: 2px;">${stat.icon}</div>
        <div style="font-size: 14px; font-weight: bold; color: white;">${stat.value}</div>
        <div style="font-size: 10px; color: rgb(156, 163, 175);">${stat.label}</div>
      `;

      statsGrid.appendChild(statItem);
    });

    section.appendChild(statsGrid);
    this.panelElement.appendChild(section);
  }

  // Helper methods
  calculateResourcePerTick(resourceType) {
    const playerId = this.selectedPlayer.name;
    const historyKey = `${playerId}_${resourceType}`;
    
    if (!this.resourceHistory.has(historyKey)) {
      this.resourceHistory.set(historyKey, []);
    }
    
    const history = this.resourceHistory.get(historyKey);
    const currentAmount = this.selectedPlayer.resources[resourceType] || 0;
    
    // Add current amount to history
    history.push({ tick: this.scene.tickCount, amount: currentAmount });
    
    // Keep only last 10 ticks of history
    if (history.length > 10) {
      history.shift();
    }
    
    // Calculate average change per tick
    if (history.length < 2) return 0;
    
    const recent = history.slice(-5); // Last 5 ticks
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
      food: '🌾',
      wood: '🪵', 
      stone: '🪨',
      iron: '⚙️',
      copper: '🔶',
      coal: '⚫',
      gold: '🟡',
      coins: '💰'
    };
    return icons[resourceType] || '📦';
  }

  getResourceColor(resourceType) {
    const colors = {
      food: '#10b981',
      wood: '#8b4513',
      stone: '#6b7280',
      iron: '#374151',
      copper: '#d97706',
      coal: '#1f2937',
      gold: '#fbbf24',
      coins: '#eab308'
    };
    return colors[resourceType] || '#9ca3af';
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
  }

  setupEventListeners() {
    // Update when game state changes
    this.scene.events.on('update', () => {
      // Update every few frames, not every frame
      if (this.scene.tickCount % 30 === 0) {
        this.updateDisplay();
      }
    });
  }

  startUpdating() {
    // Update every 2 seconds for smooth resource tracking
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