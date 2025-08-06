# SimulationJS Project Understanding Summary

## Project Overview
SimulationJS is a hex-based real-time strategy simulation game built with Phaser.js. The game features multiple players, resource management, buildings, units, and a battle system.

## Core Architecture

### Map System
- **HexMap/HexTileMap**: Hexagonal tile-based world generation with different biomes
- **Tile Types**: Various terrain types affecting gameplay (forests, water, mountains, plains)
- **World Generation**: Procedural generation using noise algorithms

### Player System
- **Multiple Players**: Support for CPU and human players
- **Resource Management**: Food, Wood, Stone, Iron - standard RTS resources
- **Color-coded**: Each player has a unique color for visual identification

### Building System
- **Categories**: Founding, Population, Training, Gathering, Crafting
- **Resource Requirements**: Buildings cost resources and take time to construct
- **Production**: Buildings generate resources or provide capabilities
- **Placement System**: Click-to-place with validity checking

### Unit System
- **Types**: Infantry (Warriors), Cavalry, Support, Utility (Workers, Builders)
- **Combat Stats**: HP, Attack, Defense, Range, Experience/Leveling
- **Movement**: Hex-based pathfinding and positioning
- **Orders**: Move, Attack, Patrol, Build commands

### Battle System
- **Real-time Combat**: Units can engage in battles when in range
- **Battle Manager**: Centralized system for managing active conflicts
- **Battle Interface**: UI for viewing and predicting battle outcomes
- **Tactical Elements**: Terrain bonuses, unit types, positioning matter

### UI System
- **Modular Design**: Separate UI components for different functions
- **AdminPanel**: Debug/cheat interface for game manipulation
- **PlayerOverview**: Always-visible resource and status display
- **SelectionUI**: Entity inspection and command interface
- **BuildingUI**: Construction menu and placement interface

### Persistence System
- **Quick Save**: Game state only, world regenerated (localStorage)
- **Full World Save**: Complete terrain preservation (IndexedDB)
- **Auto-save**: Optional automatic saving every 5 minutes

## Technology Stack
- **Engine**: Phaser.js 3.60+ for game rendering and management
- **Graphics**: Sprite-based with hex tile rendering
- **Storage**: localStorage for quick saves, IndexedDB for full world saves
- **Assets**: PNG sprites and spritesheets for units and buildings

## Game Flow
1. **World Generation**: Procedural hex-based terrain creation
2. **Player Initialization**: CPU players spawn with starting resources
3. **Base Building**: Players construct buildings for resource production
4. **Unit Production**: Training combat and utility units
5. **Expansion**: Claiming territory and resources
6. **Combat**: Strategic battles between opposing forces
7. **Victory Conditions**: (To be implemented - likely territorial or elimination)

## Current Development State
- **Core Systems**: Functional map, buildings, units, resources
- **Battle System**: Recently integrated, needs testing and balancing
- **AI Players**: Basic CPU players exist but need intelligent decision-making
- **UI Polish**: AdminPanel and interfaces need refinement
- **Performance**: Optimized for real-time gameplay with adjustable speed

## Key Strengths
- **Modular Architecture**: Easy to extend and modify systems
- **Visual Appeal**: Attractive hex-based graphics with clear UI
- **Debug Tools**: Comprehensive admin panel for testing
- **Save System**: Robust persistence with multiple save options
- **Real-time**: Smooth gameplay with configurable time speeds

## Areas for Improvement
- **AI Intelligence**: CPU players need strategic decision-making
- **Balance**: Unit stats and resource costs need tuning
- **Victory Conditions**: Clear win/lose states needed
- **Tutorial**: New player onboarding system
- **Performance**: Large world optimization for late-game scenarios