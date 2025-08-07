// src/ui/AdminPanel.js - Modern Admin Panel with Tabbed Interface

class ModernAdminPanel extends BaseModal {
  constructor(scene) {
    super(scene, {
      width: 420,
      height: 700,
      x: window.innerWidth - 440,
      y: 60,
      title: '⚡ Admin Panel',
      closable: true,
      tabs: [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'players', label: 'Players', icon: '👥' },
        { id: 'ai', label: 'AI Systems', icon: '🤖' },
        { id: 'battle', label: 'Battle', icon: '⚔️' },
        { id: 'world', label: 'World', icon: '🌍' },
        { id: 'resources', label: 'Resources', icon: '💰' },
        { id: 'saves', label: 'Save/Load', icon: '💾' }
      ]
    });

    this.selectedPlayer = null;
    this.timeMultiplier = 1;
    this.godMode = false;
    this.autoSaveEnabled = false;
    this.currentSaveSystem = 'quick';
    
    // Battle system state
    this.battleSystemEnabled = true;
    
    this.createPanelContent();
    this.setupEventHandlers();
    this.setFooterText('Modern Admin Panel v2.0 - Use tabs for navigation');
  }

  createPanelContent() {
    this.createOverviewTab();
    this.createPlayersTab();
    this.createAITab();
    this.createBattleTab();
    this.createWorldTab();
    this.createResourcesTab();
    this.createSavesTab();
    
    // Switch to overview tab by default
    this.switchTab('overview');
  }

  createOverviewTab() {
    const content = this.getTabContent('overview');
    
    // Game Status Card
    const { card: statusCard, content: statusContent } = this.createCard('📊 Game Status', 'Current game state and controls');
    
    // Time Controls
    const timeCard = document.createElement('div');
    timeCard.className = 'bg-secondary p-md mb-md';
    timeCard.style.borderRadius = '8px';
    timeCard.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">⏰ Time Control</h4>
      <div class="flex items-center gap-sm mb-sm">
        <label style="color: var(--text-secondary); font-size: 12px;">Speed:</label>
        <select id="timeMultiplier" class="form-select" style="flex: 1;">
          <option value="0.5">0.5x</option>
          <option value="1" selected>1x Normal</option>
          <option value="2">2x</option>
          <option value="5">5x</option>
          <option value="10">10x</option>
        </select>
      </div>
      <div class="flex gap-sm">
        <button id="pauseBtn" class="btn btn-secondary btn-sm">⏸️ Pause</button>
        <button id="stepBtn" class="btn btn-secondary btn-sm">⏭️ Step</button>
      </div>
    `;
    statusContent.appendChild(timeCard);
    
    // God Mode Toggle
    const godModeCard = document.createElement('div');
    godModeCard.className = 'bg-secondary p-md';
    godModeCard.style.borderRadius = '8px';
    godModeCard.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">🎯 Admin Mode</h4>
      <label class="flex items-center gap-sm mb-sm">
        <input type="checkbox" id="godModeToggle" style="accent-color: var(--accent-primary);">
        <span style="color: var(--text-secondary); font-size: 12px;">Enable God Mode</span>
      </label>
      <p style="color: var(--text-muted); font-size: 11px; margin: 0;">
        Unlocks advanced tabs and unlimited resources
      </p>
    `;
    statusContent.appendChild(godModeCard);
    
    content.appendChild(statusCard);
    
    // Quick Actions Card
    const { card: actionsCard, content: actionsContent } = this.createCard('🚀 Quick Actions', 'Common administrative tasks');
    
    const actionsGrid = document.createElement('div');
    actionsGrid.className = 'flex flex-col gap-sm';
    actionsGrid.innerHTML = `
      <button id="resetGameBtn" class="btn btn-danger">🔄 Reset Game</button>
      <button id="toggleUIBtn" class="btn btn-secondary">👁️ Toggle UI</button>
      <button id="screenshotBtn" class="btn btn-secondary">📸 Screenshot</button>
      <button id="exportLogBtn" class="btn btn-secondary">📄 Export Logs</button>
    `;
    
    actionsContent.appendChild(actionsGrid);
    content.appendChild(actionsCard);
  }

  createPlayersTab() {
    const content = this.getTabContent('players');
    
    // Player List Card
    const { card: playersCard, content: playersContent } = this.createCard('👥 Player Management', 'Manage players and AI');
    
    const playerSelect = document.createElement('div');
    playerSelect.className = 'mb-md';
    playerSelect.innerHTML = `
      <label style="color: var(--text-secondary); font-size: 12px; display: block; margin-bottom: 4px;">Selected Player:</label>
      <select id="playerSelect" class="form-select">
        <option value="">Choose a player...</option>
        <option value="player1">🔵 Player 1 (Human)</option>
        <option value="ai1">🤖 AI Player 1</option>
        <option value="ai2">🤖 AI Player 2</option>
      </select>
    `;
    playersContent.appendChild(playerSelect);
    
    // Player Stats
    const statsDiv = document.createElement('div');
    statsDiv.id = 'playerStats';
    statsDiv.className = 'bg-secondary p-md mb-md';
    statsDiv.style.borderRadius = '8px';
    statsDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">📈 Player Statistics</h4>
      <div class="text-muted" style="font-size: 12px;">Select a player to view stats</div>
    `;
    playersContent.appendChild(statsDiv);
    
    // Player Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'flex flex-col gap-sm';
    actionsDiv.innerHTML = `
      <button id="addAIBtn" class="btn btn-primary">➕ Add AI Player</button>
      <button id="removePlayerBtn" class="btn btn-danger" disabled>❌ Remove Selected</button>
      <button id="switchPlayerBtn" class="btn btn-secondary" disabled>🔄 Switch Control</button>
    `;
    playersContent.appendChild(actionsDiv);
    
    content.appendChild(playersCard);
  }

  createAITab() {
    const content = this.getTabContent('ai');
    
    // AI System Status Card
    const { card: aiCard, content: aiContent } = this.createCard('🤖 AI System Control', 'Manage artificial intelligence');
    
    // AI Enable/Disable
    const aiToggle = document.createElement('div');
    aiToggle.className = 'bg-secondary p-md mb-md';
    aiToggle.style.borderRadius = '8px';
    aiToggle.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">🎛️ AI Controls</h4>
      <label class="flex items-center gap-sm mb-sm">
        <input type="checkbox" id="aiSystemToggle" checked style="accent-color: var(--accent-primary);">
        <span style="color: var(--text-secondary); font-size: 12px;">AI System Active</span>
      </label>
      <div class="flex items-center gap-sm">
        <label style="color: var(--text-secondary); font-size: 12px;">Update Frequency:</label>
        <select id="aiFrequency" class="form-select" style="flex: 1;">
          <option value="500">0.5s (Fast)</option>
          <option value="1000" selected>1s (Normal)</option>
          <option value="2000">2s (Slow)</option>
          <option value="5000">5s (Very Slow)</option>
        </select>
      </div>
    `;
    aiContent.appendChild(aiToggle);
    
    // AI Difficulty
    const aiDifficulty = document.createElement('div');
    aiDifficulty.className = 'bg-secondary p-md';
    aiDifficulty.style.borderRadius = '8px';
    aiDifficulty.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">⚙️ AI Difficulty</h4>
      <div class="flex items-center gap-sm">
        <label style="color: var(--text-secondary); font-size: 12px;">Level:</label>
        <select id="aiDifficulty" class="form-select" style="flex: 1;">
          <option value="easy">🟢 Easy</option>
          <option value="normal" selected>🟡 Normal</option>
          <option value="hard">🔴 Hard</option>
          <option value="expert">🟣 Expert</option>
        </select>
      </div>
    `;
    aiContent.appendChild(aiDifficulty);
    
    content.appendChild(aiCard);
    
    // AI Debug Info
    const { card: debugCard, content: debugContent } = this.createCard('🔍 AI Debug Info', 'Real-time AI status');
    
    const debugInfo = document.createElement('div');
    debugInfo.id = 'aiDebugInfo';
    debugInfo.className = 'bg-secondary p-md';
    debugInfo.style.cssText = 'border-radius: 8px; font-size: 11px;';
    debugInfo.innerHTML = `
      <div class="text-muted">AI system status will appear here...</div>
    `;
    debugContent.appendChild(debugInfo);
    content.appendChild(debugCard);
  }

  createBattleTab() {
    const content = this.getTabContent('battle');
    
    // Battle System Card
    const { card: battleCard, content: battleContent } = this.createCard('⚔️ Battle System', 'Combat mechanics and testing');
    
    // Battle System Status
    const statusDiv = document.createElement('div');
    statusDiv.className = 'bg-secondary p-md mb-md';
    statusDiv.style.borderRadius = '8px';
    statusDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">🛡️ System Status</h4>
      <div class="flex items-center gap-sm mb-sm">
        <div class="status-indicator online"></div>
        <span style="color: var(--text-secondary); font-size: 12px;">Battle System: Active</span>
      </div>
      <label class="flex items-center gap-sm">
        <input type="checkbox" id="battleSystemToggle" checked style="accent-color: var(--accent-primary);">
        <span style="color: var(--text-secondary); font-size: 12px;">Enable Auto-battles</span>
      </label>
    `;
    battleContent.appendChild(statusDiv);
    
    // Test Battles
    const testDiv = document.createElement('div');
    testDiv.className = 'bg-secondary p-md';
    testDiv.style.borderRadius = '8px';
    testDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">🎯 Battle Testing</h4>
      <div class="flex flex-col gap-sm">
        <button id="testBattleBtn" class="btn btn-primary btn-sm">⚔️ Start Test Battle</button>
        <button id="runBattleSystemTestBtn" class="btn btn-secondary btn-sm">🧪 Run System Tests</button>
        <button id="clearBattleHistoryBtn" class="btn btn-secondary btn-sm">🗑️ Clear History</button>
      </div>
    `;
    battleContent.appendChild(testDiv);
    
    content.appendChild(battleCard);
    
    // Active Battles
    const { card: activeBattlesCard, content: activeBattlesContent } = this.createCard('⚡ Active Battles', 'Ongoing combat situations');
    
    const battlesList = document.createElement('div');
    battlesList.id = 'activeBattlesList';
    battlesList.className = 'bg-secondary p-md';
    battlesList.style.borderRadius = '8px';
    battlesList.innerHTML = `
      <div class="text-muted text-center" style="font-size: 12px;">No active battles</div>
    `;
    activeBattlesContent.appendChild(battlesList);
    content.appendChild(activeBattlesCard);
  }

  createWorldTab() {
    const content = this.getTabContent('world');
    
    // World Controls
    const { card: worldCard, content: worldContent } = this.createCard('🌍 World Management', 'Map and environment controls');
    
    // Map Controls
    const mapDiv = document.createElement('div');
    mapDiv.className = 'bg-secondary p-md mb-md';
    mapDiv.style.borderRadius = '8px';
    mapDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">🗺️ Map Controls</h4>
      <div class="flex flex-col gap-sm">
        <button id="regenerateMapBtn" class="btn btn-primary btn-sm">🎲 Regenerate Map</button>
        <button id="revealMapBtn" class="btn btn-secondary btn-sm">👁️ Reveal All</button>
        <button id="hideMapBtn" class="btn btn-secondary btn-sm">🫥 Hide All</button>
      </div>
    `;
    worldContent.appendChild(mapDiv);
    
    // Environment
    const envDiv = document.createElement('div');
    envDiv.className = 'bg-secondary p-md';
    envDiv.style.borderRadius = '8px';
    envDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">🌤️ Environment</h4>
      <div class="mb-sm">
        <label style="color: var(--text-secondary); font-size: 12px; display: block; margin-bottom: 4px;">Weather:</label>
        <select id="weatherSelect" class="form-select">
          <option value="clear">☀️ Clear</option>
          <option value="rain">🌧️ Rain</option>
          <option value="storm">⛈️ Storm</option>
          <option value="fog">🌫️ Fog</option>
        </select>
      </div>
      <div>
        <label style="color: var(--text-secondary); font-size: 12px; display: block; margin-bottom: 4px;">Season:</label>
        <select id="seasonSelect" class="form-select">
          <option value="spring">🌸 Spring</option>
          <option value="summer" selected>☀️ Summer</option>
          <option value="autumn">🍂 Autumn</option>
          <option value="winter">❄️ Winter</option>
        </select>
      </div>
    `;
    worldContent.appendChild(envDiv);
    
    content.appendChild(worldCard);
  }

  createResourcesTab() {
    const content = this.getTabContent('resources');
    
    // God Mode Required Notice
    const notice = document.createElement('div');
    notice.className = 'bg-card p-md mb-md';
    notice.style.borderRadius = '8px';
    notice.innerHTML = `
      <div class="flex items-center gap-sm">
        <span>🔒</span>
        <span style="color: var(--text-secondary); font-size: 12px;">
          Enable God Mode to access resource controls
        </span>
      </div>
    `;
    content.appendChild(notice);
    
    // Resource Controls (initially hidden)
    const resourceControls = document.createElement('div');
    resourceControls.id = 'resourceControls';
    resourceControls.style.display = 'none';
    
    const { card: resourceCard, content: resourceContent } = this.createCard('💰 Resource Management', 'Modify player resources');
    
    // Resource Grant Section
    const grantDiv = document.createElement('div');
    grantDiv.className = 'bg-secondary p-md';
    grantDiv.style.borderRadius = '8px';
    grantDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">💎 Grant Resources</h4>
      <div class="flex flex-col gap-sm">
        <input type="number" id="grantAmount" placeholder="Amount" class="form-input" value="1000">
        <select id="grantResource" class="form-select">
          <option value="food">🍎 Food</option>
          <option value="wood">🪵 Wood</option>
          <option value="stone">🪨 Stone</option>
          <option value="gold">🪙 Gold</option>
          <option value="iron">⚡ Iron</option>
        </select>
        <button id="grantResourceBtn" class="btn btn-primary btn-sm">✨ Grant Resource</button>
      </div>
    `;
    resourceContent.appendChild(grantDiv);
    
    resourceControls.appendChild(resourceCard);
    content.appendChild(resourceControls);
  }

  createSavesTab() {
    const content = this.getTabContent('saves');
    
    // Save/Load System
    const { card: saveCard, content: saveContent } = this.createCard('💾 Save & Load System', 'Game state management');
    
    // Quick Save/Load
    const quickDiv = document.createElement('div');
    quickDiv.className = 'bg-secondary p-md mb-md';
    quickDiv.style.borderRadius = '8px';
    quickDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">⚡ Quick Save</h4>
      <div class="flex flex-col gap-sm">
        <button id="quickSaveBtn" class="btn btn-primary btn-sm">💾 Quick Save</button>
        <button id="quickLoadBtn" class="btn btn-secondary btn-sm">📁 Quick Load</button>
      </div>
    `;
    saveContent.appendChild(quickDiv);
    
    // Full Save System
    const fullDiv = document.createElement('div');
    fullDiv.className = 'bg-secondary p-md mb-md';
    fullDiv.style.borderRadius = '8px';
    fullDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">🏛️ Full Save System</h4>
      <div class="flex flex-col gap-sm">
        <input type="text" id="saveSlotName" placeholder="Save name..." class="form-input">
        <div class="flex gap-sm">
          <button id="fullSaveBtn" class="btn btn-primary btn-sm" style="flex: 1;">💿 Save Game</button>
          <button id="fullLoadBtn" class="btn btn-secondary btn-sm" style="flex: 1;">📀 Load Game</button>
        </div>
      </div>
    `;
    saveContent.appendChild(fullDiv);
    
    // Auto Save
    const autoDiv = document.createElement('div');
    autoDiv.className = 'bg-secondary p-md';
    autoDiv.style.borderRadius = '8px';
    autoDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: var(--text-primary);">🔄 Auto Save</h4>
      <label class="flex items-center gap-sm">
        <input type="checkbox" id="autoSaveToggle" style="accent-color: var(--accent-primary);">
        <span style="color: var(--text-secondary); font-size: 12px;">Enable Auto Save (every 5 min)</span>
      </label>
    `;
    saveContent.appendChild(autoDiv);
    
    content.appendChild(saveCard);
  }

  setupEventHandlers() {
    // God Mode Toggle
    setTimeout(() => {
      const godModeToggle = document.getElementById('godModeToggle');
      if (godModeToggle) {
        godModeToggle.addEventListener('change', (e) => {
          this.godMode = e.target.checked;
          this.toggleGodModeFeatures(this.godMode);
        });
      }

      // Battle System Test Button
      const testBattleBtn = document.getElementById('runBattleSystemTestBtn');
      if (testBattleBtn) {
        testBattleBtn.addEventListener('click', () => {
          window.open('/test_battle_system.html', '_blank');
        });
      }
    }, 100);
  }

  toggleGodModeFeatures(enabled) {
    // Show/hide resource controls
    const resourceControls = document.getElementById('resourceControls');
    if (resourceControls) {
      resourceControls.style.display = enabled ? 'block' : 'none';
    }
    
    console.log(`God Mode: ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  onTabChange(tabId) {
    console.log(`Admin Panel switched to: ${tabId}`);
  }
}

// Maintain backward compatibility
window.AdminPanel = ModernAdminPanel;
window.ModernAdminPanel = ModernAdminPanel;