// src/ai/AISystem.js - Advanced AI system for player automation

/**
 * AI System for automating player behavior with different strategies and monitoring
 * Provides sophisticated decision-making for resource management, unit control, and combat
 */
class AISystem {
  constructor(player, gameWorld, aiType = 'balanced') {
    this.player = player;
    this.gameWorld = gameWorld;
    this.scene = gameWorld.scene;
    
    // AI configuration
    this.aiType = aiType;
    this.enabled = true;
    this.debugMode = false;
    
    // Task tracking for monitoring
    this.currentTasks = [];
    this.completedTasks = [];
    this.taskHistory = [];
    this.priorities = new Map();
    
    // Decision tracking
    this.lastDecisions = [];
    this.decisionFactors = new Map();
    this.performanceMetrics = {
      resourceEfficiency: 0,
      militaryStrength: 0,
      economicGrowth: 0,
      territoryControl: 0
    };
    
    // AI strategies configuration
    this.strategies = {
      'peaceful': {
        name: 'Peaceful Builder',
        description: 'Focuses on economic growth and peaceful expansion',
        militaryFocus: 0.2,
        economicFocus: 0.8,
        aggressionLevel: 0.1,
        expansionRate: 0.5,
        primaryGoals: ['economy', 'population', 'technology']
      },
      'aggressive': {
        name: 'Military Aggressor',
        description: 'Prioritizes military units and combat engagement',
        militaryFocus: 0.8,
        economicFocus: 0.2,
        aggressionLevel: 0.9,
        expansionRate: 0.7,
        primaryGoals: ['military', 'conquest', 'territory']
      },
      'balanced': {
        name: 'Balanced Strategy',
        description: 'Balances economic and military development',
        militaryFocus: 0.5,
        economicFocus: 0.5,
        aggressionLevel: 0.5,
        expansionRate: 0.6,
        primaryGoals: ['economy', 'military', 'territory']
      },
      'economic': {
        name: 'Economic Powerhouse',
        description: 'Maximizes resource generation and trade',
        militaryFocus: 0.3,
        economicFocus: 0.7,
        aggressionLevel: 0.2,
        expansionRate: 0.4,
        primaryGoals: ['economy', 'resources', 'technology']
      },
      'expansionist': {
        name: 'Territorial Expansionist',
        description: 'Rapidly expands territory and builds outposts',
        militaryFocus: 0.6,
        economicFocus: 0.4,
        aggressionLevel: 0.6,
        expansionRate: 0.9,
        primaryGoals: ['territory', 'expansion', 'military']
      }
    };
    
    // Current strategy
    this.currentStrategy = this.strategies[aiType] || this.strategies['balanced'];
    
    // Tick timing - configurable update frequency
    this.lastUpdate = 0;
    this.lastTickUpdate = null; // Track last game tick for tick-based updates
    this.updateInterval = 3000; // Default: Update every 3 seconds (used when tick-based is false)
    this.tickBasedUpdates = false; // When true, updates every game tick regardless of time
    
    // Initialize AI
    this.initialize();
    
    console.log(`🤖 AI System initialized for ${player.name} with ${this.currentStrategy.name} strategy`);
  }

  /**
   * Initialize AI systems and set up monitoring
   */
  initialize() {
    this.addTask('initialize', 'Setting up AI systems', 'system');
    this.updatePerformanceMetrics();
    this.completeTask('initialize');
  }

  /**
   * Main AI update loop - called periodically by the game
   * Can operate on tick-based or time-based updates
   */
  update(gameTime, gameTick = null) {
    if (!this.enabled) return;
    
    // Check if we should update based on mode
    const shouldUpdate = this.tickBasedUpdates ? 
      (gameTick !== null && gameTick !== this.lastTickUpdate) :
      (gameTime - this.lastUpdate >= this.updateInterval);
    
    if (!shouldUpdate) return;
    
    // Update tracking
    if (this.tickBasedUpdates) {
      this.lastTickUpdate = gameTick;
    } else {
      this.lastUpdate = gameTime;
    }
    
    try {
      // Update performance metrics
      this.updatePerformanceMetrics();
      
      // Execute AI decisions based on current strategy
      this.executeStrategy();
      
      // Clean up old tasks and decisions
      this.cleanupHistory();
      
    } catch (error) {
      console.error(`❌ AI System error for ${this.player.name}:`, error);
      this.addTask('error_recovery', `Recovering from error: ${error.message}`, 'system');
    }
  }

  /**
   * Execute the current AI strategy
   */
  executeStrategy() {
    this.addTask('strategy_execution', `Executing ${this.currentStrategy.name}`, 'strategy');
    
    // Priority order based on strategy
    const priorities = this.calculatePriorities();
    
    // Execute decisions in priority order
    for (const [priority, actions] of priorities) {
      for (const action of actions) {
        if (this.executeAction(action)) {
          break; // Only execute one high-priority action per update
        }
      }
    }
    
    this.completeTask('strategy_execution');
  }

  /**
   * Calculate action priorities based on current strategy and game state
   */
  calculatePriorities() {
    const priorities = new Map();
    const strategy = this.currentStrategy;
    
    // Economic priorities
    if (strategy.economicFocus > 0.5) {
      this.addPriority(priorities, 'high', 'manage_economy');
      this.addPriority(priorities, 'medium', 'expand_infrastructure');
    }
    
    // Military priorities
    if (strategy.militaryFocus > 0.5) {
      this.addPriority(priorities, 'high', 'build_military');
      this.addPriority(priorities, 'medium', 'conduct_warfare');
    }
    
    // Expansion priorities
    if (strategy.expansionRate > 0.6) {
      this.addPriority(priorities, 'medium', 'expand_territory');
      this.addPriority(priorities, 'low', 'build_outposts');
    }
    
    // Always include basic survival tasks
    this.addPriority(priorities, 'high', 'ensure_survival');
    this.addPriority(priorities, 'low', 'optimize_resources');
    
    return new Map([...priorities.entries()].sort((a, b) => {
      const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a[0]] - priorityOrder[b[0]];
    }));
  }

  /**
   * Add action to priority list
   */
  addPriority(priorities, level, action) {
    if (!priorities.has(level)) {
      priorities.set(level, []);
    }
    priorities.get(level).push(action);
  }

  /**
   * Execute a specific AI action
   */
  executeAction(actionType) {
    const actions = {
      'ensure_survival': () => this.ensureSurvival(),
      'manage_economy': () => this.manageEconomy(),
      'build_military': () => this.buildMilitary(),
      'expand_territory': () => this.expandTerritory(),
      'conduct_warfare': () => this.conductWarfare(),
      'expand_infrastructure': () => this.expandInfrastructure(),
      'build_outposts': () => this.buildOutposts(),
      'optimize_resources': () => this.optimizeResources()
    };
    
    if (actions[actionType]) {
      this.addTask(actionType, `Executing ${actionType.replace('_', ' ')}`, 'action');
      const result = actions[actionType]();
      
      // Record decision
      this.recordDecision(actionType, result);
      
      if (result.success) {
        this.completeTask(actionType);
        if (this.debugMode) {
          console.log(`🤖 ${this.player.name}: ${actionType} completed - ${result.message}`);
        }
        return true;
      } else {
        this.failTask(actionType, result.reason);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Ensure basic survival needs are met
   */
  ensureSurvival() {
    const resources = this.player.resources;
    
    // Check critical resource levels
    const criticalResources = [];
    if (resources.food < 10) criticalResources.push('food');
    if (resources.wood < 10) criticalResources.push('wood');
    if (resources.stone < 10) criticalResources.push('stone');
    
    if (criticalResources.length > 0) {
      // Focus on gathering critical resources
      for (const resource of criticalResources) {
        if (this.buildResourceGatherer(resource)) {
          return { success: true, message: `Built ${resource} gatherer for survival` };
        }
      }
      return { success: false, reason: `Cannot build gatherers for ${criticalResources.join(', ')}` };
    }
    
    // Check if we need more population
    if (this.player.units.length < 3) {
      if (this.spawnWorkerUnit()) {
        return { success: true, message: 'Spawned worker for population growth' };
      }
    }
    
    return { success: true, message: 'Survival needs are met' };
  }

  /**
   * Manage economic development
   */
  manageEconomy() {
    const strategy = this.currentStrategy;
    
    // Build economic buildings based on strategy
    if (strategy.economicFocus > 0.6) {
      // High economic focus - build advanced economic structures
      if (this.buildEconomicBuilding()) {
        return { success: true, message: 'Built economic building' };
      }
    }
    
    // Optimize resource production
    if (this.optimizeResourceProduction()) {
      return { success: true, message: 'Optimized resource production' };
    }
    
    // Train economic units
    if (this.trainEconomicUnits()) {
      return { success: true, message: 'Trained economic units' };
    }
    
    return { success: false, reason: 'No economic actions available' };
  }

  /**
   * Build and manage military forces
   */
  buildMilitary() {
    const strategy = this.currentStrategy;
    const militaryUnits = this.player.units.filter(unit => this.isMilitaryUnit(unit));
    const targetMilitarySize = Math.max(2, Math.floor(this.player.units.length * strategy.militaryFocus));
    
    if (militaryUnits.length < targetMilitarySize) {
      // Need more military units
      if (this.buildMilitaryBuilding()) {
        return { success: true, message: 'Built military building' };
      }
      
      if (this.trainMilitaryUnit()) {
        return { success: true, message: 'Trained military unit' };
      }
    }
    
    // Organize military units for combat
    if (this.organizeMilitary()) {
      return { success: true, message: 'Organized military forces' };
    }
    
    return { success: false, reason: 'No military actions needed' };
  }

  /**
   * Conduct warfare against enemies
   */
  conductWarfare() {
    const strategy = this.currentStrategy;
    
    if (strategy.aggressionLevel < 0.4) {
      return { success: false, reason: 'Strategy does not favor warfare' };
    }
    
    // Find enemy targets
    const enemies = this.findEnemyTargets();
    if (enemies.length === 0) {
      return { success: false, reason: 'No enemy targets found' };
    }
    
    // Attack weakest enemy
    const target = this.selectBestTarget(enemies);
    if (this.attackTarget(target)) {
      return { success: true, message: `Attacked ${target.player.name} at [${target.coords.join(', ')}]` };
    }
    
    return { success: false, reason: 'Attack failed' };
  }

  /**
   * Expand territorial control
   */
  expandTerritory() {
    const strategy = this.currentStrategy;
    
    if (strategy.expansionRate < 0.5) {
      return { success: false, reason: 'Strategy does not favor expansion' };
    }
    
    // Find good expansion locations
    const expansionSite = this.findExpansionSite();
    if (!expansionSite) {
      return { success: false, reason: 'No suitable expansion sites found' };
    }
    
    // Send a unit to claim territory
    if (this.claimTerritory(expansionSite)) {
      return { success: true, message: `Expanding to [${expansionSite.join(', ')}]` };
    }
    
    return { success: false, reason: 'Could not claim territory' };
  }

  /**
   * Build infrastructure and support buildings
   */
  expandInfrastructure() {
    // Build roads, storage, or support structures
    const infrastructureTypes = ['storage', 'road', 'defensive'];
    
    for (const type of infrastructureTypes) {
      if (this.buildInfrastructure(type)) {
        return { success: true, message: `Built ${type} infrastructure` };
      }
    }
    
    return { success: false, reason: 'No infrastructure building opportunities' };
  }

  /**
   * Build outposts for territorial control
   */
  buildOutposts() {
    const outpostSite = this.findOutpostSite();
    if (outpostSite && this.buildOutpost(outpostSite)) {
      return { success: true, message: `Built outpost at [${outpostSite.join(', ')}]` };
    }
    
    return { success: false, reason: 'Cannot build outpost' };
  }

  /**
   * Optimize resource management
   */
  optimizeResources() {
    // Balance resource production and consumption
    const optimization = this.analyzeResourceFlow();
    
    if (optimization.actions.length > 0) {
      const action = optimization.actions[0]; // Take first suggested action
      if (this.executeOptimization(action)) {
        return { success: true, message: `Optimized: ${action.description}` };
      }
    }
    
    return { success: false, reason: 'No optimization available' };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Update performance metrics for monitoring
   */
  updatePerformanceMetrics() {
    const resources = this.player.resources;
    const units = this.player.units;
    const buildings = this.player.buildings;
    
    // Calculate resource efficiency (resources per building)
    const totalBuildings = buildings.length || 1;
    const totalResources = Object.values(resources).reduce((sum, val) => sum + val, 0);
    this.performanceMetrics.resourceEfficiency = totalResources / totalBuildings;
    
    // Calculate military strength
    const militaryUnits = units.filter(unit => this.isMilitaryUnit(unit));
    this.performanceMetrics.militaryStrength = militaryUnits.reduce((sum, unit) => {
      return sum + (unit.attack || 0) + (unit.hp || 0) + (unit.defense || 0);
    }, 0);
    
    // Calculate economic growth (change in resources over time)
    if (!this.lastResourceTotal) this.lastResourceTotal = totalResources;
    this.performanceMetrics.economicGrowth = totalResources - this.lastResourceTotal;
    this.lastResourceTotal = totalResources;
    
    // Calculate territory control (number of buildings and units)
    this.performanceMetrics.territoryControl = buildings.length + units.length;
  }

  /**
   * Record an AI decision for monitoring
   */
  recordDecision(actionType, result) {
    const decision = {
      timestamp: Date.now(),
      action: actionType,
      success: result.success,
      message: result.message || result.reason,
      strategy: this.currentStrategy.name,
      factors: this.getCurrentFactors()
    };
    
    this.lastDecisions.unshift(decision);
    if (this.lastDecisions.length > 20) {
      this.lastDecisions = this.lastDecisions.slice(0, 20);
    }
  }

  /**
   * Get current decision factors
   */
  getCurrentFactors() {
    return {
      resources: { ...this.player.resources },
      unitCount: this.player.units.length,
      buildingCount: this.player.buildings.length,
      militaryStrength: this.performanceMetrics.militaryStrength,
      economicGrowth: this.performanceMetrics.economicGrowth
    };
  }

  /**
   * Task management for monitoring
   */
  addTask(id, description, category = 'general') {
    const task = {
      id,
      description,
      category,
      startTime: Date.now(),
      status: 'active'
    };
    
    this.currentTasks.push(task);
    this.taskHistory.unshift({ ...task, action: 'started' });
  }

  completeTask(id) {
    const taskIndex = this.currentTasks.findIndex(task => task.id === id);
    if (taskIndex >= 0) {
      const task = this.currentTasks.splice(taskIndex, 1)[0];
      task.status = 'completed';
      task.endTime = Date.now();
      task.duration = task.endTime - task.startTime;
      
      this.completedTasks.unshift(task);
      this.taskHistory.unshift({ ...task, action: 'completed' });
      
      // Keep only recent completed tasks
      if (this.completedTasks.length > 50) {
        this.completedTasks = this.completedTasks.slice(0, 50);
      }
    }
  }

  failTask(id, reason) {
    const taskIndex = this.currentTasks.findIndex(task => task.id === id);
    if (taskIndex >= 0) {
      const task = this.currentTasks.splice(taskIndex, 1)[0];
      task.status = 'failed';
      task.reason = reason;
      task.endTime = Date.now();
      task.duration = task.endTime - task.startTime;
      
      this.taskHistory.unshift({ ...task, action: 'failed' });
    }
  }

  /**
   * Clean up old history data
   */
  cleanupHistory() {
    // Keep only recent task history
    if (this.taskHistory.length > 100) {
      this.taskHistory = this.taskHistory.slice(0, 100);
    }
  }

  // ============================================
  // PLACEHOLDER IMPLEMENTATION METHODS
  // ============================================
  // These methods provide basic implementations
  // They can be enhanced based on specific game mechanics

  buildResourceGatherer(resourceType) {
    // Try to build appropriate gatherer for resource type
    const buildingMap = {
      'wood': 'LumberCamp',
      'stone': 'Quarry', 
      'food': 'FruitGatherer',
      'iron': 'IronGatherer'
    };
    
    const buildingType = buildingMap[resourceType];
    if (buildingType && window[buildingType]) {
      return this.findAndBuild(window[buildingType]);
    }
    return false;
  }

  /**
   * NEW: Check if AI can afford building with scaled costs
   */
  canAffordBuilding(buildingType) {
    // Get the actual building class
    const BuildingClass = window[buildingType];
    if (!BuildingClass) return false;
    
    // Use the scaled costs instead of hardcoded costs
    const scaledCosts = this.player.getScaledBuildingCosts(BuildingClass);
    
    return this.player.canAfford(scaledCosts);
  }

  spawnWorkerUnit() {
    if (window.Worker && this.player.spawnUnit) {
      const spawnSite = this.findUnitSpawnSite();
      if (spawnSite) {
        return this.player.spawnUnit(Worker, spawnSite);
      }
    }
    return false;
  }

  buildEconomicBuilding() {
    const economicBuildings = ['House', 'Market', 'Warehouse'];
    for (const buildingName of economicBuildings) {
      if (window[buildingName] && this.findAndBuild(window[buildingName])) {
        return true;
      }
    }
    return false;
  }

  optimizeResourceProduction() {
    // Simple optimization: build more gatherers if resources are low
    const resources = this.player.resources;
    const lowResources = Object.entries(resources)
      .filter(([resource, amount]) => amount < 50)
      .map(([resource]) => resource);
    
    for (const resource of lowResources) {
      if (this.buildResourceGatherer(resource)) {
        return true;
      }
    }
    return false;
  }

  trainEconomicUnits() {
    // Try to train workers or builders
    const economicUnits = ['Worker', 'Builder'];
    for (const unitName of economicUnits) {
      if (window[unitName] && this.spawnUnit(window[unitName])) {
        return true;
      }
    }
    return false;
  }

  buildMilitaryBuilding() {
    const militaryBuildings = ['Barracks', 'ArcheryRange', 'Fortress'];
    for (const buildingName of militaryBuildings) {
      if (window[buildingName] && this.findAndBuild(window[buildingName])) {
        return true;
      }
    }
    return false;
  }

  trainMilitaryUnit() {
    const militaryUnits = ['Warrior', 'Archer', 'Scout'];
    for (const unitName of militaryUnits) {
      if (window[unitName] && this.spawnUnit(window[unitName])) {
        return true;
      }
    }
    return false;
  }

  isMilitaryUnit(unit) {
    const militaryTypes = ['Warrior', 'Archer', 'Scout', 'Knight', 'FootSoldier'];
    return militaryTypes.includes(unit.type);
  }

  organizeMilitary() {
    // Group military units and assign simple formations or patrol routes
    const militaryUnits = this.player.units.filter(unit => this.isMilitaryUnit(unit));
    if (militaryUnits.length >= 2) {
      // Simple: move military units to a central rally point
      const rallyPoint = this.findRallyPoint();
      if (rallyPoint) {
        militaryUnits.forEach(unit => {
          if (unit.moveTo) unit.moveTo(rallyPoint);
        });
        return true;
      }
    }
    return false;
  }

  findEnemyTargets() {
    const enemies = [];
    const allPlayers = this.gameWorld.players;
    
    for (const otherPlayer of allPlayers) {
      if (otherPlayer !== this.player) {
        // Add enemy units and buildings as potential targets
        otherPlayer.units.forEach(unit => {
          enemies.push({ type: 'unit', target: unit, player: otherPlayer, coords: unit.coords });
        });
        otherPlayer.buildings.forEach(building => {
          enemies.push({ type: 'building', target: building, player: otherPlayer, coords: building.coords });
        });
      }
    }
    
    return enemies;
  }

  selectBestTarget(enemies) {
    // Simple target selection: closest enemy
    if (enemies.length === 0) return null;
    
    const playerUnits = this.player.units.filter(unit => this.isMilitaryUnit(unit));
    if (playerUnits.length === 0) return null;
    
    const baseUnit = playerUnits[0];
    return enemies.reduce((closest, enemy) => {
      const closestDist = this.getDistance(baseUnit.coords, closest.coords);
      const enemyDist = this.getDistance(baseUnit.coords, enemy.coords);
      return enemyDist < closestDist ? enemy : closest;
    });
  }

  attackTarget(target) {
    const militaryUnits = this.player.units.filter(unit => this.isMilitaryUnit(unit));
    if (militaryUnits.length === 0) return false;
    
    // Send the first available military unit to attack
    const attacker = militaryUnits[0];
    if (attacker.attackUnit && target.target) {
      return attacker.attackUnit(target.target);
    }
    return false;
  }

  findExpansionSite() {
    // Find a suitable location for expansion
    const playerBuildings = this.player.buildings;
    if (playerBuildings.length === 0) return null;
    
    const baseBuilding = playerBuildings[0];
    const [baseQ, baseR] = baseBuilding.coords || [0, 0];
    
    // Look for empty tiles at moderate distance
    for (let distance = 5; distance <= 15; distance++) {
      const site = this.findEmptyTileAtDistance(baseQ, baseR, distance);
      if (site) return site;
    }
    
    return null;
  }

  claimTerritory(coords) {
    // Send a unit to the location to claim it
    const availableUnits = this.player.units.filter(unit => !unit.destination);
    if (availableUnits.length > 0) {
      const unit = availableUnits[0];
      if (unit.moveTo) {
        unit.moveTo(coords);
        return true;
      }
    }
    return false;
  }

  buildInfrastructure(type) {
    // Placeholder for infrastructure building
    return false;
  }

  findOutpostSite() {
    return this.findExpansionSite(); // Same logic for now
  }

  buildOutpost(coords) {
    // Try to build a simple defensive structure
    if (window.Fortress && this.player.build) {
      return this.player.build(Fortress, coords);
    }
    return false;
  }

  analyzeResourceFlow() {
    // Simple resource flow analysis
    const resources = this.player.resources;
    const actions = [];
    
    // Suggest building gatherers for low resources
    for (const [resource, amount] of Object.entries(resources)) {
      if (amount < 30) {
        actions.push({
          type: 'build_gatherer',
          description: `Build ${resource} gatherer`,
          priority: amount < 10 ? 'high' : 'medium'
        });
      }
    }
    
    return { actions };
  }

  executeOptimization(action) {
    if (action.type === 'build_gatherer') {
      const resourceType = action.description.split(' ')[1]; // Extract resource type
      return this.buildResourceGatherer(resourceType);
    }
    return false;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  findAndBuild(BuildingClass) {
    const buildSite = this.findBuildingSite();
    if (buildSite && this.player.build) {
      return this.player.build(BuildingClass, buildSite);
    }
    return false;
  }

  findBuildingSite() {
    // Find an empty, buildable tile near player's buildings
    const playerBuildings = this.player.buildings;
    if (playerBuildings.length === 0) {
      // For initial building placement, try to find a suitable starting location
      const startCoords = this.player.startCoords || [0, 0];
      return this.findEmptyTileAtDistance(startCoords[0], startCoords[1], 2);
    }
    
    const baseBuilding = playerBuildings[0];
    const [baseQ, baseR] = baseBuilding.coords || [0, 0];
    
    // Try expanding search radius if initial search fails
    for (let distance = 2; distance <= 8; distance++) {
      const site = this.findEmptyTileAtDistance(baseQ, baseR, distance);
      if (site) return site;
    }
    
    // Fallback: try a random nearby location
    return [baseQ + Phaser.Math.Between(-3, 3), baseR + Phaser.Math.Between(-3, 3)];
  }

  findUnitSpawnSite() {
    return this.findBuildingSite(); // Same logic for simplicity
  }

  spawnUnit(UnitClass) {
    const spawnSite = this.findUnitSpawnSite();
    if (spawnSite && this.player.spawnUnit) {
      return this.player.spawnUnit(UnitClass, spawnSite);
    }
    return false;
  }

  findRallyPoint() {
    // Find a central location for military units
    const playerBuildings = this.player.buildings;
    if (playerBuildings.length > 0) {
      const mainBuilding = playerBuildings[0];
      return mainBuilding.coords || [0, 0];
    }
    return [0, 0];
  }

  findEmptyTileAtDistance(centerQ, centerR, distance) {
    // Look for empty tiles at specified distance
    for (let q = centerQ - distance; q <= centerQ + distance; q++) {
      for (let r = centerR - distance; r <= centerR + distance; r++) {
        const actualDistance = Math.abs(q - centerQ) + Math.abs(r - centerR) + Math.abs(-q - r + centerQ + centerR);
        if (actualDistance / 2 === distance) {
          const tile = this.scene.map?.getTile(q, r);
          if (tile && tile.isPassable && tile.isPassable() && 
              !this.gameWorld.getBuildingAt(q, r) && 
              !this.gameWorld.getUnitAt(q, r)) {
            return [q, r];
          }
        }
      }
    }
    return null;
  }

  getDistance(coords1, coords2) {
    const [q1, r1] = coords1;
    const [q2, r2] = coords2;
    return Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(-q1 - r1 + q2 + r2);
  }

  // ============================================
  // PUBLIC API FOR MONITORING AND CONTROL
  // ============================================

  /**
   * Change AI strategy type
   */
  setAIType(newType) {
    if (this.strategies[newType]) {
      this.aiType = newType;
      this.currentStrategy = this.strategies[newType];
      this.addTask('strategy_change', `Changed to ${this.currentStrategy.name}`, 'system');
      console.log(`🤖 ${this.player.name}: Strategy changed to ${this.currentStrategy.name}`);
      return true;
    }
    return false;
  }

  /**
   * Enable or disable AI
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.addTask('ai_enabled', 'AI system enabled', 'system');
      console.log(`🤖 ${this.player.name}: AI enabled`);
    } else {
      this.addTask('ai_disabled', 'AI system disabled', 'system');
      console.log(`🤖 ${this.player.name}: AI disabled`);
    }
  }

  /**
   * Set update frequency - can be time-based or tick-based
   * @param {number|string} frequency - Time in ms, or 'every_tick' for per-tick updates
   */
  setUpdateFrequency(frequency) {
    if (frequency === 'every_tick') {
      this.tickBasedUpdates = true;
      this.updateInterval = 0;
      console.log(`🤖 ${this.player.name}: Switched to per-tick AI updates`);
    } else if (typeof frequency === 'number' && frequency > 0) {
      this.tickBasedUpdates = false;
      this.updateInterval = frequency;
      console.log(`🤖 ${this.player.name}: AI update interval set to ${frequency}ms`);
    } else {
      console.warn(`🤖 ${this.player.name}: Invalid frequency ${frequency}`);
      return false;
    }
    return true;
  }

  /**
   * Get current update configuration
   */
  getUpdateConfig() {
    return {
      tickBasedUpdates: this.tickBasedUpdates,
      updateInterval: this.updateInterval,
      frequency: this.tickBasedUpdates ? 'every_tick' : `${this.updateInterval}ms`
    };
  }
  setDebugMode(debug) {
    this.debugMode = debug;
    console.log(`🤖 ${this.player.name}: Debug mode ${debug ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current AI status for monitoring
   */
  getStatus() {
    return {
      enabled: this.enabled,
      aiType: this.aiType,
      strategy: this.currentStrategy,
      updateConfig: this.getUpdateConfig(),
      currentTasks: this.currentTasks,
      completedTasks: this.completedTasks.slice(0, 10), // Recent completed tasks
      lastDecisions: this.lastDecisions.slice(0, 10), // Recent decisions
      performanceMetrics: { ...this.performanceMetrics },
      taskHistory: this.taskHistory.slice(0, 20) // Recent task history
    };
  }

  /**
   * Get available AI strategies
   */
  getAvailableStrategies() {
    return Object.entries(this.strategies).map(([key, strategy]) => ({
      key,
      name: strategy.name,
      description: strategy.description,
      isCurrent: key === this.aiType
    }));
  }

  /**
   * Force execute a specific action (for debugging)
   */
  forceAction(actionType) {
    this.addTask('force_action', `Force executing ${actionType}`, 'debug');
    return this.executeAction(actionType);
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      player: this.player.name,
      enabled: this.enabled,
      strategy: this.currentStrategy.name,
      lastUpdate: this.lastUpdate,
      updateInterval: this.updateInterval,
      priorities: Array.from(this.priorities.entries()),
      decisionFactors: Array.from(this.decisionFactors.entries())
    };
  }
}

// Export for use in other modules
window.AISystem = AISystem;