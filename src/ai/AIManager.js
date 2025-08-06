// src/ai/AIManager.js - Coordinates multiple AI systems and provides monitoring

/**
 * AI Manager for coordinating multiple AI systems and providing centralized monitoring
 * Manages AI systems for multiple players and provides analytics
 */
class AIManager {
  constructor(gameWorld) {
    this.gameWorld = gameWorld;
    this.scene = gameWorld.scene;
    
    // AI systems for each player
    this.aiSystems = new Map(); // playerId -> AISystem
    
    // Global AI monitoring
    this.globalStats = {
      totalAISystems: 0,
      activeAISystems: 0,
      totalDecisions: 0,
      totalTasks: 0,
      averagePerformance: 0
    };
    
    // Performance tracking
    this.performanceHistory = [];
    this.lastGlobalUpdate = 0;
    this.globalUpdateInterval = 5000; // Update global stats every 5 seconds
    
    console.log('🧠 AI Manager initialized');
  }

  /**
   * Add AI system for a player
   */
  addAISystem(player, aiType = 'balanced') {
    if (this.aiSystems.has(player.id || player.name)) {
      console.warn(`AI System already exists for ${player.name}`);
      return null;
    }
    
    const aiSystem = new AISystem(player, this.gameWorld, aiType);
    this.aiSystems.set(player.id || player.name, aiSystem);
    this.updateGlobalStats();
    
    console.log(`🤖 Added AI System for ${player.name} with ${aiType} strategy`);
    return aiSystem;
  }

  /**
   * Remove AI system for a player
   */
  removeAISystem(player) {
    const playerId = player.id || player.name;
    if (this.aiSystems.has(playerId)) {
      this.aiSystems.delete(playerId);
      this.updateGlobalStats();
      console.log(`🤖 Removed AI System for ${player.name}`);
      return true;
    }
    return false;
  }

  /**
   * Get AI system for a player
   */
  getAISystem(player) {
    const playerId = player.id || player.name;
    return this.aiSystems.get(playerId);
  }

  /**
   * Update all AI systems
   */
  update(gameTime) {
    // Update individual AI systems
    for (const [playerId, aiSystem] of this.aiSystems) {
      if (aiSystem.enabled) {
        aiSystem.update(gameTime);
      }
    }
    
    // Update global statistics
    if (gameTime - this.lastGlobalUpdate > this.globalUpdateInterval) {
      this.updateGlobalStats();
      this.recordGlobalPerformance();
      this.lastGlobalUpdate = gameTime;
    }
  }

  /**
   * Update global AI statistics
   */
  updateGlobalStats() {
    const systems = Array.from(this.aiSystems.values());
    
    this.globalStats.totalAISystems = systems.length;
    this.globalStats.activeAISystems = systems.filter(ai => ai.enabled).length;
    
    // Sum up all decisions and tasks
    this.globalStats.totalDecisions = systems.reduce((sum, ai) => 
      sum + ai.lastDecisions.length, 0);
    this.globalStats.totalTasks = systems.reduce((sum, ai) => 
      sum + ai.currentTasks.length + ai.completedTasks.length, 0);
    
    // Calculate average performance across all AI systems
    const totalPerformance = systems.reduce((sum, ai) => {
      const metrics = ai.performanceMetrics;
      return sum + metrics.resourceEfficiency + metrics.militaryStrength + 
             metrics.economicGrowth + metrics.territoryControl;
    }, 0);
    
    this.globalStats.averagePerformance = systems.length > 0 ? 
      totalPerformance / (systems.length * 4) : 0; // 4 metrics per system
  }

  /**
   * Record global performance for historical tracking
   */
  recordGlobalPerformance() {
    const performance = {
      timestamp: Date.now(),
      ...this.globalStats,
      systemDetails: Array.from(this.aiSystems.entries()).map(([playerId, ai]) => ({
        playerId,
        playerName: ai.player.name,
        aiType: ai.aiType,
        enabled: ai.enabled,
        currentTasks: ai.currentTasks.length,
        completedTasks: ai.completedTasks.length,
        recentDecisions: ai.lastDecisions.length,
        performance: ai.performanceMetrics
      }))
    };
    
    this.performanceHistory.unshift(performance);
    
    // Keep only recent history (last 100 records)
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(0, 100);
    }
  }

  /**
   * Set AI type for a specific player
   */
  setPlayerAIType(player, aiType) {
    const aiSystem = this.getAISystem(player);
    if (aiSystem) {
      return aiSystem.setAIType(aiType);
    }
    return false;
  }

  /**
   * Enable/disable AI for a specific player
   */
  setPlayerAIEnabled(player, enabled) {
    const aiSystem = this.getAISystem(player);
    if (aiSystem) {
      aiSystem.setEnabled(enabled);
      this.updateGlobalStats();
      return true;
    }
    return false;
  }

  /**
   * Enable/disable AI for all players
   */
  setAllAIEnabled(enabled) {
    let count = 0;
    for (const [playerId, aiSystem] of this.aiSystems) {
      aiSystem.setEnabled(enabled);
      count++;
    }
    this.updateGlobalStats();
    console.log(`🤖 ${enabled ? 'Enabled' : 'Disabled'} AI for ${count} players`);
    return count;
  }

  /**
   * Set debug mode for all AI systems
   */
  setGlobalDebugMode(debug) {
    let count = 0;
    for (const [playerId, aiSystem] of this.aiSystems) {
      aiSystem.setDebugMode(debug);
      count++;
    }
    console.log(`🤖 ${debug ? 'Enabled' : 'Disabled'} debug mode for ${count} AI systems`);
    return count;
  }

  /**
   * Force an action on all AI systems (for testing)
   */
  forceActionOnAll(actionType) {
    const results = [];
    for (const [playerId, aiSystem] of this.aiSystems) {
      if (aiSystem.enabled) {
        const result = aiSystem.forceAction(actionType);
        results.push({
          player: aiSystem.player.name,
          success: result
        });
      }
    }
    return results;
  }

  /**
   * Get comprehensive AI status for all players
   */
  getAllAIStatus() {
    const systemsStatus = [];
    
    for (const [playerId, aiSystem] of this.aiSystems) {
      systemsStatus.push({
        playerId,
        playerName: aiSystem.player.name,
        playerColor: aiSystem.player.color,
        status: aiSystem.getStatus(),
        availableStrategies: aiSystem.getAvailableStrategies(),
        debugInfo: aiSystem.getDebugInfo()
      });
    }
    
    return {
      globalStats: this.globalStats,
      systems: systemsStatus,
      performanceHistory: this.performanceHistory.slice(0, 10) // Recent history
    };
  }

  /**
   * Get available AI strategies (common across all systems)
   */
  getAvailableStrategies() {
    // Use the first AI system to get strategy list
    const firstSystem = Array.from(this.aiSystems.values())[0];
    if (firstSystem) {
      return firstSystem.getAvailableStrategies();
    }
    
    // Fallback if no AI systems exist
    return [
      { key: 'peaceful', name: 'Peaceful Builder', description: 'Focuses on economic growth' },
      { key: 'aggressive', name: 'Military Aggressor', description: 'Prioritizes military units' },
      { key: 'balanced', name: 'Balanced Strategy', description: 'Balances economic and military' },
      { key: 'economic', name: 'Economic Powerhouse', description: 'Maximizes resource generation' },
      { key: 'expansionist', name: 'Territorial Expansionist', description: 'Rapidly expands territory' }
    ];
  }

  /**
   * Analyze AI performance trends
   */
  getPerformanceTrends() {
    if (this.performanceHistory.length < 2) {
      return { trend: 'insufficient_data', message: 'Need more data for trends' };
    }
    
    const recent = this.performanceHistory[0];
    const older = this.performanceHistory[Math.min(10, this.performanceHistory.length - 1)];
    
    const trends = {
      averagePerformance: {
        current: recent.averagePerformance,
        previous: older.averagePerformance,
        change: recent.averagePerformance - older.averagePerformance,
        trend: recent.averagePerformance > older.averagePerformance ? 'improving' : 'declining'
      },
      totalDecisions: {
        current: recent.totalDecisions,
        previous: older.totalDecisions,
        change: recent.totalDecisions - older.totalDecisions,
        trend: recent.totalDecisions > older.totalDecisions ? 'increasing' : 'decreasing'
      },
      activeAI: {
        current: recent.activeAISystems,
        previous: older.activeAISystems,
        change: recent.activeAISystems - older.activeAISystems
      }
    };
    
    return trends;
  }

  /**
   * Get AI recommendations based on current state
   */
  getAIRecommendations() {
    const recommendations = [];
    const allStatus = this.getAllAIStatus();
    
    // Check for inactive AI systems
    const inactiveCount = allStatus.systems.filter(s => !s.status.enabled).length;
    if (inactiveCount > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Inactive AI Systems',
        message: `${inactiveCount} AI system(s) are disabled. Enable them for automated gameplay.`,
        action: 'enable_all_ai'
      });
    }
    
    // Check for underperforming AI
    const lowPerformance = allStatus.systems.filter(s => 
      s.status.performanceMetrics.resourceEfficiency < 10
    );
    if (lowPerformance.length > 0) {
      recommendations.push({
        type: 'suggestion',
        title: 'Low Resource Efficiency',
        message: `${lowPerformance.length} AI system(s) have low resource efficiency. Consider switching to economic strategy.`,
        action: 'suggest_economic_strategy'
      });
    }
    
    // Check for failed tasks
    const systemsWithFailures = allStatus.systems.filter(s => 
      s.status.taskHistory.some(task => task.action === 'failed')
    );
    if (systemsWithFailures.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'AI Task Failures',
        message: `${systemsWithFailures.length} AI system(s) have recent task failures. Enable debug mode for details.`,
        action: 'enable_debug_mode'
      });
    }
    
    // Strategy recommendations based on game state
    const aggressiveSystems = allStatus.systems.filter(s => s.status.aiType === 'aggressive').length;
    const peacefulSystems = allStatus.systems.filter(s => s.status.aiType === 'peaceful').length;
    
    if (aggressiveSystems > peacefulSystems * 2) {
      recommendations.push({
        type: 'balance',
        title: 'Too Many Aggressive AI',
        message: 'Consider balancing with more peaceful or economic AI strategies for variety.',
        action: 'suggest_balance'
      });
    }
    
    return recommendations;
  }

  /**
   * Execute bulk AI operations
   */
  executeBulkOperation(operation, parameters = {}) {
    const results = [];
    
    switch (operation) {
      case 'enable_all':
        results.push({ 
          operation: 'enable_all', 
          count: this.setAllAIEnabled(true) 
        });
        break;
        
      case 'disable_all':
        results.push({ 
          operation: 'disable_all', 
          count: this.setAllAIEnabled(false) 
        });
        break;
        
      case 'set_all_strategy':
        if (parameters.strategy) {
          let count = 0;
          for (const [playerId, aiSystem] of this.aiSystems) {
            if (aiSystem.setAIType(parameters.strategy)) {
              count++;
            }
          }
          results.push({ 
            operation: 'set_all_strategy', 
            strategy: parameters.strategy, 
            count 
          });
        }
        break;
        
      case 'force_action_all':
        if (parameters.action) {
          const actionResults = this.forceActionOnAll(parameters.action);
          results.push({ 
            operation: 'force_action_all', 
            action: parameters.action, 
            results: actionResults 
          });
        }
        break;
        
      case 'enable_debug_all':
        results.push({ 
          operation: 'enable_debug_all', 
          count: this.setGlobalDebugMode(true) 
        });
        break;
        
      case 'disable_debug_all':
        results.push({ 
          operation: 'disable_debug_all', 
          count: this.setGlobalDebugMode(false) 
        });
        break;
    }
    
    return results;
  }

  /**
   * Debug method to get all AI system details
   */
  debugAllSystems() {
    console.log('🧠 AI Manager Debug Information:');
    console.log('Global Stats:', this.globalStats);
    
    for (const [playerId, aiSystem] of this.aiSystems) {
      console.log(`\n🤖 ${aiSystem.player.name} (${playerId}):`);
      console.log('  Status:', aiSystem.getStatus());
      console.log('  Debug Info:', aiSystem.getDebugInfo());
    }
    
    console.log('\n📊 Performance History:', this.performanceHistory.slice(0, 5));
    console.log('📈 Trends:', this.getPerformanceTrends());
    console.log('💡 Recommendations:', this.getAIRecommendations());
  }

  /**
   * Clean up AI systems (call when shutting down)
   */
  shutdown() {
    this.aiSystems.clear();
    this.performanceHistory = [];
    console.log('🧠 AI Manager shut down');
  }
}

// Export for use in other modules
window.AIManager = AIManager;