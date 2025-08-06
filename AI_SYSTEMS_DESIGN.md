# CPU/AI Player Decision Making System Design

## Overview
This document outlines the design and implementation plan for intelligent CPU players in SimulationJS. The AI system will provide strategic decision-making for computer-controlled players to create engaging and challenging gameplay.

## AI Architecture

### Core AI Components

#### 1. AI Director
- **Purpose**: Main AI controller that coordinates all CPU player decisions
- **Responsibilities**: 
  - Evaluate game state every few ticks
  - Assign priorities to different strategies
  - Coordinate multiple CPU players to avoid identical behavior
  - Adjust difficulty based on human player performance

#### 2. Strategic Planner
- **Purpose**: High-level strategic decision making
- **Responsibilities**:
  - Choose overall strategy (economic, military, expansion)
  - Set long-term goals and objectives
  - Adapt strategy based on current game situation
  - Evaluate threats and opportunities

#### 3. Economic Manager
- **Purpose**: Resource and building management
- **Responsibilities**:
  - Optimize resource collection and usage
  - Plan building construction priorities
  - Manage worker allocation
  - Balance economic growth vs military spending

#### 4. Military Commander
- **Purpose**: Unit production and combat strategy
- **Responsibilities**:
  - Plan unit composition and army size
  - Coordinate attacks and defenses
  - Manage unit positioning and formations
  - Execute tactical retreats when necessary

#### 5. Tactical Processor
- **Purpose**: Real-time combat and movement decisions
- **Responsibilities**:
  - Control individual unit actions in battle
  - Optimize unit positioning for combat bonuses
  - Execute micro-management during fights
  - Coordinate group movements and attacks

## Decision Making Framework

### Priority System
Each AI decision is weighted by priority levels:
1. **Survival** (Priority 10): Defend against immediate threats
2. **Critical Resources** (Priority 8): Maintain essential resource production
3. **Military Response** (Priority 7): Counter enemy military buildup
4. **Economic Growth** (Priority 6): Expand resource generation
5. **Territorial Expansion** (Priority 5): Claim new areas
6. **Unit Production** (Priority 4): Build military forces
7. **Exploration** (Priority 3): Scout unknown areas
8. **Optimization** (Priority 2): Improve efficiency
9. **Opportunistic** (Priority 1): Take advantage of enemy mistakes

### State Evaluation
The AI continuously evaluates:
- **Resource Levels**: Current and projected resource stocks
- **Military Strength**: Unit count, types, and positioning relative to enemies
- **Territory Control**: Amount and quality of controlled territory
- **Enemy Activity**: Threat assessment and opportunity identification
- **Economic Health**: Resource generation rate and efficiency
- **Strategic Position**: Defensibility and expansion opportunities

## AI Personality Types

### 1. Aggressive (Red AI)
- **Characteristics**: Fast expansion, early military pressure
- **Strategy**: Rush tactics, constant harassment, high risk/high reward
- **Building Focus**: Military production, minimal defense
- **Unit Preference**: Fast, cheap units in large numbers
- **Behavior**: Attacks early and often, sacrifices economy for military

### 2. Economic (Blue AI)
- **Characteristics**: Strong economy, late-game power
- **Strategy**: Defensive turtling, economic boom, quality over quantity
- **Building Focus**: Resource generation, heavy defenses
- **Unit Preference**: Expensive, high-quality units
- **Behavior**: Focuses on economic growth, powerful late-game armies

### 3. Balanced (Green AI)
- **Characteristics**: Adaptable, well-rounded approach
- **Strategy**: Responds to threats, maintains balance
- **Building Focus**: Mixed development, adapts to situation
- **Unit Preference**: Versatile unit compositions
- **Behavior**: Reacts to player actions, mirrors successful strategies

### 4. Opportunistic (Yellow AI)
- **Characteristics**: Exploits weaknesses, unpredictable
- **Strategy**: Adapts to exploit enemy mistakes
- **Building Focus**: Flexible, changes based on opportunities
- **Unit Preference**: Whatever counters enemy forces
- **Behavior**: Punishes overextension, strikes at weak points

## Implementation Plan

### Phase 1: Basic AI Infrastructure
1. **AI Director Class**: Create main AI controller
2. **State Evaluation**: Implement game state analysis
3. **Priority Queue**: Decision-making priority system
4. **Basic Behaviors**: Simple economic and military actions

### Phase 2: Strategic Intelligence
1. **Strategy Selection**: Implement AI personality types
2. **Threat Assessment**: Enemy strength evaluation
3. **Resource Planning**: Optimized building and unit production
4. **Territorial Strategy**: Expansion and defense planning

### Phase 3: Tactical Combat
1. **Battle Participation**: Smart unit engagement
2. **Formation Fighting**: Coordinated group combat
3. **Micro-management**: Individual unit optimization
4. **Retreat Logic**: Strategic withdrawal decisions

### Phase 4: Advanced Features
1. **Adaptive Difficulty**: AI scales to player skill
2. **Cooperative AI**: Multiple AIs coordinate against human
3. **Learning System**: AI improves based on successful strategies
4. **Emotional Responses**: AI reacts to player actions

## Decision Making Algorithms

### Economic Decisions
```javascript
function makeEconomicDecision(aiPlayer) {
  const needs = evaluateResourceNeeds(aiPlayer);
  const priorities = calculateBuildingPriorities(needs);
  
  if (priorities.urgentResource) {
    return buildResourceBuilding(priorities.urgentResource);
  }
  
  if (canAffordExpansion(aiPlayer)) {
    return expandTerritory();
  }
  
  return optimizeExistingBuildings();
}
```

### Military Decisions
```javascript
function makeMilitaryDecision(aiPlayer) {
  const threats = evaluateThreats(aiPlayer);
  const armyStrength = calculateArmyStrength(aiPlayer);
  
  if (threats.immediate) {
    return defendAgainstThreat(threats.immediate);
  }
  
  if (armyStrength.ratio > enemyStrength.ratio * 1.5) {
    return planAttack(findWeakestEnemy());
  }
  
  return buildDefensiveUnits();
}
```

### Tactical Combat
```javascript
function manageCombat(units, enemies) {
  const formations = calculateOptimalFormations(units, enemies);
  const targets = prioritizeTargets(enemies);
  
  units.forEach(unit => {
    const bestTarget = findBestTarget(unit, targets);
    const bestPosition = findOptimalPosition(unit, formation);
    
    if (unit.canAttack(bestTarget)) {
      unit.attack(bestTarget);
    } else {
      unit.moveTo(bestPosition);
    }
  });
}
```

## Performance Considerations
- **Update Frequency**: AI decisions every 5-10 ticks to avoid performance impact
- **Caching**: Store calculated values to avoid redundant computations  
- **Lazy Evaluation**: Only calculate complex decisions when necessary
- **Threaded Processing**: Use web workers for complex AI calculations if needed

## Testing and Balancing
- **AI vs AI**: Test different personality types against each other
- **Difficulty Scaling**: Ensure AI provides appropriate challenge
- **Player Feedback**: Monitor win/loss ratios and adjust accordingly
- **Performance Monitoring**: Ensure AI doesn't impact game framerate

## Future Enhancements
- **Machine Learning**: Train AI on successful human strategies
- **Dynamic Personalities**: AI adapts personality based on game state
- **Communication**: AI players negotiate and form alliances
- **Scenario AI**: Specialized AI for campaign missions and challenges

This AI system will transform CPU players from passive participants into engaging opponents that provide meaningful challenge and replayability to SimulationJS.