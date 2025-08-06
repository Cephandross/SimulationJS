/**
 * BattleData - Comprehensive battle state data structures and management
 * 
 * This class provides a robust data structure for tracking battle state, participants,
 * events, and outcomes. It supports both modern and legacy initialization patterns
 * to maintain compatibility with existing code while providing advanced features.
 * 
 * Key Features:
 * - Dual initialization patterns (modern constructor vs legacy initialize method)
 * - Comprehensive battle logging with event tracking
 * - Memory management with destruction cleanup
 * - Serialization/deserialization for network sync
 * - Statistical analysis and battle metrics
 * - Null safety and defensive programming throughout
 * - Support for spectators and reinforcements
 * 
 * Initialization Patterns:
 * 1. Modern: new BattleData(id, hex, attackers, defenders, startTick)
 * 2. Legacy: new BattleData() + initialize(attacker, defender, hex)
 * 
 * The class automatically detects which pattern is being used and configures
 * itself accordingly, ensuring maximum compatibility.
 * 
 * @class BattleData
 * @version 2.0.0
 * @author SimulationJS Battle System
 */
class BattleData {
    /**
     * Create a BattleData instance
     * @param {string|null} id - Battle identifier (optional for legacy pattern)
     * @param {Array|null} hex - Hex coordinates [q, r] (optional for legacy)
     * @param {Array} attackers - Array of attacking units (optional for legacy)
     * @param {Array} defenders - Array of defending units (optional for legacy)
     * @param {number} startTick - Game tick when battle started (optional for legacy)
     */
    constructor(id = null, hex = null, attackers = [], defenders = [], startTick = 0) {
        // Support both constructor patterns - modern and legacy
        if (id && hex) {
            // Modern pattern from battle system
            this.id = id;
            this.hex = hex; // [q, r] coordinates
            this.attackers = [...attackers];
            this.defenders = [...defenders];
            this.startTick = startTick;
            this.lastCombatTick = startTick;
            this.spectators = new Set();
            this.status = 'active';
        } else {
            // Legacy pattern
            this.armies = {
                attacker: null,
                defender: null
            };
            this.hex = null;
            this.status = 'pending';
        }
        
        // Common properties
        this.turnCount = 0;
        this.maxTurns = 10;
        this.resolution = null;
        this.battleLog = [];
        this._destroyed = false; // Memory management flag
    }

    /**
     * Initialize battle with legacy pattern
     * @param {Object} attacker - Attacking force {player, units}
     * @param {Object} defender - Defending force {player, units} 
     * @param {Array} hex - Hex coordinates [q, r]
     */
    initialize(attacker, defender, hex) {
        if (this._destroyed) {
            console.warn('BattleData: Attempting to initialize destroyed battle');
            return;
        }

        // Defensive programming - validate inputs
        if (!attacker?.player || !defender?.player || !hex) {
            throw new Error('BattleData.initialize: Invalid parameters');
        }

        this.armies = {
            attacker: {
                player: attacker.player,
                units: attacker.units || [],
                casualties: []
            },
            defender: {
                player: defender.player,
                units: defender.units || [],
                casualties: []
            }
        };
        this.hex = hex;
        this.status = 'active';
        this.turnCount = 0;
        this.battleLog = [];
        
        this.logEvent('Battle initialized', {
            location: hex,
            attacker: attacker.player.name,
            defender: defender.player.name,
            attackerUnits: attacker.units?.length || 0,
            defenderUnits: defender.units?.length || 0
        });
    }

    /**
     * Log battle event with timestamp and validation
     * @param {string} type - Event type
     * @param {Object} data - Event data
     */
    logEvent(type, data) {
        if (this._destroyed) return;

        // Defensive programming - validate inputs
        if (!type || typeof type !== 'string') {
            console.warn('BattleData.logEvent: Invalid event type');
            return;
        }

        this.battleLog.push({
            turn: this.turnCount,
            type: type,
            data: data || {},
            timestamp: Date.now()
        });

        // Performance: Limit log size to prevent memory bloat
        if (this.battleLog.length > 100) {
            this.battleLog = this.battleLog.slice(-50); // Keep last 50 entries
        }
    }

    /**
     * Add casualty with null safety
     * @param {Object} unit - Unit that was killed
     * @param {string} side - 'attacker' or 'defender'
     */
    addCasualty(unit, side) {
        if (this._destroyed || !unit || !side) return;

        if (this.armies?.[side]?.casualties) {
            this.armies[side].casualties.push(unit);
            this.logEvent('casualty', {
                side: side,
                unit: unit.type || 'unknown',
                remainingUnits: this.armies[side].units?.length || 0
            });
        }
    }

    /**
     * Set battle resolution with validation
     * @param {string} winner - Winner identifier
     * @param {string} details - Resolution details
     */
    setResolution(winner, details) {
        if (this._destroyed || this.status === 'resolved') return;

        this.status = 'resolved';
        this.resolution = {
            winner: winner || 'unknown',
            details: details || 'No details provided',
            endTurn: this.turnCount,
            timestamp: Date.now()
        };
        
        this.logEvent('resolution', {
            winner: winner,
            details: details,
            totalTurns: this.turnCount
        });
    }

    /**
     * Get current battle state with null safety
     * @returns {Object} Battle state summary
     */
    getBattleState() {
        if (this._destroyed) {
            return { status: 'destroyed', error: 'Battle data has been cleaned up' };
        }

        if (this.armies?.attacker) {
            // Legacy pattern
            return {
                location: this.hex,
                status: this.status,
                turn: this.turnCount,
                attacker: {
                    name: this.armies.attacker.player?.name || 'Unknown',
                    units: this.armies.attacker.units?.length || 0,
                    casualties: this.armies.attacker.casualties?.length || 0
                },
                defender: {
                    name: this.armies.defender.player?.name || 'Unknown',
                    units: this.armies.defender.units?.length || 0,
                    casualties: this.armies.defender.casualties?.length || 0
                }
            };
        } else {
            // Modern pattern - compatible with BattleManager
            return {
                id: this.id,
                location: this.hex,
                status: this.status,
                turn: this.turnCount,
                startTick: this.startTick,
                lastCombatTick: this.lastCombatTick,
                attackers: this.attackers?.length || 0,
                defenders: this.defenders?.length || 0,
                spectators: this.spectators?.size || 0
            };
        }
    }

    /**
     * Advance to next turn with safety checks
     * @returns {boolean} True if turn advanced successfully
     */
    nextTurn() {
        if (this._destroyed || this.status !== 'active') return false;
        
        this.turnCount++;
        
        // Check for turn limit (configurable)
        if (this.turnCount >= this.maxTurns) {
            this.setResolution('stalemate', 'Maximum turns reached');
            return false;
        }
        
        this.logEvent('turn_advance', { turn: this.turnCount });
        return true;
    }

    // Modern pattern methods with error handling

    /**
     * Get all units with null safety
     * @returns {Array} All units in battle
     */
    getAllUnits() {
        if (this._destroyed) return [];
        
        if (this.attackers && this.defenders) {
            return [...(this.attackers || []), ...(this.defenders || [])];
        }
        return [];
    }

    /**
     * Get living units only
     * @returns {Array} Units that are still alive
     */
    getAliveUnits() {
        return this.getAllUnits().filter(unit => {
            try {
                return unit?.isAlive && unit.isAlive();
            } catch (e) {
                console.warn('BattleData.getAliveUnits: Unit.isAlive() error', e);
                return false;
            }
        });
    }

    /**
     * Get living attackers
     * @returns {Array} Attacking units that are alive
     */
    getAliveAttackers() {
        if (this._destroyed || !this.attackers) return [];
        
        return this.attackers.filter(unit => {
            try {
                return unit?.isAlive && unit.isAlive();
            } catch (e) {
                console.warn('BattleData.getAliveAttackers: Unit.isAlive() error', e);
                return false;
            }
        });
    }

    /**
     * Get living defenders
     * @returns {Array} Defending units that are alive
     */
    getAliveDefenders() {
        if (this._destroyed || !this.defenders) return [];
        
        return this.defenders.filter(unit => {
            try {
                return unit?.isAlive && unit.isAlive();
            } catch (e) {
                console.warn('BattleData.getAliveDefenders: Unit.isAlive() error', e);
                return false;
            }
        });
    }

    /**
     * Add unit to battle with validation
     * @param {Object} unit - Unit to add
     * @param {string} side - 'attacker' or 'defender'
     * @returns {boolean} Success status
     */
    addUnit(unit, side = 'attacker') {
        if (this._destroyed || !unit || this.status !== 'active') {
            return false;
        }

        try {
            if (this.attackers && this.defenders) {
                if (side === 'attacker') {
                    this.attackers.push(unit);
                } else {
                    this.defenders.push(unit);
                }
                
                this.logEvent('reinforcement', {
                    side: side,
                    unit: unit.type || 'unknown',
                    totalUnits: side === 'attacker' ? this.attackers.length : this.defenders.length
                });
                return true;
            }
        } catch (e) {
            console.error('BattleData.addUnit: Error adding unit', e);
        }
        return false;
    }

    /**
     * Remove unit from battle (for retreats)
     * @param {Object} unit - Unit to remove
     * @returns {boolean} Success status
     */
    removeUnit(unit) {
        if (this._destroyed || !unit) return false;

        try {
            if (this.attackers) {
                const attackerIndex = this.attackers.indexOf(unit);
                if (attackerIndex !== -1) {
                    this.attackers.splice(attackerIndex, 1);
                    this.logEvent('retreat', {
                        side: 'attacker',
                        unit: unit.type || 'unknown'
                    });
                    return true;
                }
            }
            
            if (this.defenders) {
                const defenderIndex = this.defenders.indexOf(unit);
                if (defenderIndex !== -1) {
                    this.defenders.splice(defenderIndex, 1);
                    this.logEvent('retreat', {
                        side: 'defender',
                        unit: unit.type || 'unknown'
                    });
                    return true;
                }
            }
        } catch (e) {
            console.error('BattleData.removeUnit: Error removing unit', e);
        }
        
        return false;
    }

    /**
     * Add spectator with validation
     * @param {Object} player - Player to add as spectator
     */
    addSpectator(player) {
        if (this._destroyed || !player || !this.spectators) return;
        
        try {
            this.spectators.add(player);
            this.logEvent('spectator_joined', { player: player.name || 'unknown' });
        } catch (e) {
            console.error('BattleData.addSpectator: Error adding spectator', e);
        }
    }

    /**
     * Remove spectator
     * @param {Object} player - Player to remove from spectators
     */
    removeSpectator(player) {
        if (this._destroyed || !player || !this.spectators) return;
        
        try {
            if (this.spectators.delete(player)) {
                this.logEvent('spectator_left', { player: player.name || 'unknown' });
            }
        } catch (e) {
            console.error('BattleData.removeSpectator: Error removing spectator', e);
        }
    }

    /**
     * Get battle statistics for UI display
     * @returns {Object} Battle statistics
     */
    getStatistics() {
        if (this._destroyed) {
            return { error: 'Battle data destroyed' };
        }

        const stats = {
            duration: this.turnCount,
            totalCasualties: 0,
            attackerLosses: 0,
            defenderLosses: 0,
            totalEvents: this.battleLog.length
        };

        try {
            if (this.armies) {
                stats.attackerLosses = this.armies.attacker?.casualties?.length || 0;
                stats.defenderLosses = this.armies.defender?.casualties?.length || 0;
                stats.totalCasualties = stats.attackerLosses + stats.defenderLosses;
            } else {
                // Calculate from unit health if using modern pattern
                const totalAttackers = this.attackers?.length || 0;
                const aliveAttackers = this.getAliveAttackers().length;
                const totalDefenders = this.defenders?.length || 0;
                const aliveDefenders = this.getAliveDefenders().length;
                
                stats.attackerLosses = totalAttackers - aliveAttackers;
                stats.defenderLosses = totalDefenders - aliveDefenders;
                stats.totalCasualties = stats.attackerLosses + stats.defenderLosses;
            }
        } catch (e) {
            console.error('BattleData.getStatistics: Error calculating stats', e);
            stats.error = 'Failed to calculate statistics';
        }

        return stats;
    }

    /**
     * Serialize for network sync (optimized for performance)
     * @returns {Object} Serialized battle data
     */
    serialize() {
        if (this._destroyed) {
            return { error: 'Battle data destroyed' };
        }

        return {
            id: this.id,
            hex: this.hex,
            status: this.status,
            turnCount: this.turnCount,
            maxTurns: this.maxTurns,
            startTick: this.startTick,
            lastCombatTick: this.lastCombatTick,
            resolution: this.resolution,
            battleLog: this.battleLog.slice(-10), // Keep last 10 events for network efficiency
            statistics: this.getStatistics(),
            timestamp: Date.now()
        };
    }

    /**
     * Create BattleData from serialized data
     * @param {Object} data - Serialized battle data
     * @returns {BattleData} Restored battle instance
     */
    static deserialize(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('BattleData.deserialize: Invalid data');
        }

        try {
            const battle = new BattleData();
            Object.assign(battle, data);
            
            if (data.spectators && Array.isArray(data.spectators)) {
                battle.spectators = new Set(data.spectators);
            } else {
                battle.spectators = new Set();
            }
            
            // Ensure battleLog is array
            if (!Array.isArray(battle.battleLog)) {
                battle.battleLog = [];
            }
            
            return battle;
        } catch (e) {
            console.error('BattleData.deserialize: Error deserializing', e);
            throw e;
        }
    }

    /**
     * Clean up resources and mark as destroyed
     * Call this when battle is permanently finished
     */
    destroy() {
        if (this._destroyed) return;
        
        this.logEvent('battle_destroyed', { finalTurn: this.turnCount });
        
        // Clear circular references
        this.attackers = null;
        this.defenders = null;
        this.spectators = null;
        this.armies = null;
        this.battleLog = null;
        
        this._destroyed = true;
        this.status = 'destroyed';
    }

    /**
     * Check if battle data is valid and not destroyed
     * @returns {boolean} True if battle is valid
     */
    isValid() {
        return !this._destroyed && this.status !== 'destroyed';
    }

    /**
     * Debug string representation
     * @returns {string} Human-readable battle description
     */
    toString() {
        if (this._destroyed) {
            return 'Battle [DESTROYED]';
        }

        if (this.id) {
            return `Battle ${this.id} at [${this.hex}] - ${this.getAliveAttackers().length} vs ${this.getAliveDefenders().length} (${this.status})`;
        } else {
            return `Battle at [${this.hex}] - Turn ${this.turnCount} - Status: ${this.status}`;
        }
    }
}

// Global export following project conventions
window.BattleData = BattleData;