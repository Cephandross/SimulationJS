// src/ui/modals/BuildingPlacementUI.js
// Complete building placement interface

class BuildingPlacementUI extends BaseModal {
  constructor(scene) {
    super(scene, {
      width: 320,
      height: 600,
      x: 20,
      y: 20,
      title: '🏗️ Build Menu',
      closable: true
    });

    this.selectedCategory = 'Founding';
    this.placementMode = null;
    this.showOnlyAffordable = false;
    this.showOnlyPlaceableHere = false;
    this.searchQuery = '';
    this.selectedTile = null;

    // Building categories with data
    this.categories = {
      'Founding': {
        icon: '🏛️',
        color: '#a855f7',
        hotkey: '1',
        buildings: [
          {
            name: 'TownCenter',
            class: 'TownCenter',
            cost: { wood: 200, stone: 100 },
            description: 'Population +10, enables other buildings',
            hotkey: 'Q',
            terrainRequired: ['grass', 'light_grass'],
            requiredTech: null,
            population: 0,
            produces: null
          },
          {
            name: 'Village',
            class: 'Village',
            cost: { wood: 300, stone: 200 },
            description: 'Advanced settlement, population +20',
            hotkey: 'W',
            terrainRequired: ['grass', 'light_grass'],
            requiredTech: 'Advanced Construction',
            population: 0,
            produces: null
          }
        ]
      },
      'Population': {
        icon: '🏠',
        color: '#3b82f6',
        hotkey: '2',
        buildings: [
          {
            name: 'House',
            class: 'House',
            cost: { wood: 50, stone: 20 },
            description: 'Population +4',
            hotkey: 'E',
            terrainRequired: ['grass', 'light_grass', 'rough'],
            requiredTech: null,
            population: 0,
            produces: { type: 'population', amount: 4 }
          },
          {
            name: 'LogCabin',
            class: 'LogCabin',
            cost: { wood: 100, stone: 50 },
            description: 'Population +8, cold resistance',
            hotkey: 'R',
            terrainRequired: ['grass', 'light_grass', 'rough'],
            requiredTech: null,
            population: 0,
            produces: { type: 'population', amount: 8 }
          }
        ]
      },
      'Gathering': {
        icon: '🌲',
        color: '#10b981',
        hotkey: '3',
        buildings: [
          {
            name: 'LumberCamp',
            class: 'LumberCamp',
            cost: { wood: 50, stone: 20 },
            description: 'Produces wood on forest tiles',
            hotkey: 'T',
            terrainRequired: ['forest', 'pine_forest', 'dark_forest'],
            requiredTech: null,
            population: 2,
            produces: { type: 'wood', amount: 5 }
          },
          {
            name: 'Quarry',
            class: 'Quarry',
            cost: { wood: 20, stone: 50 },
            description: 'Produces stone on mountain tiles',
            hotkey: 'Y',
            terrainRequired: ['mountain', 'snow_mountain', 'hills'],
            requiredTech: null,
            population: 2,
            produces: { type: 'stone', amount: 5 }
          },
          {
            name: 'IronGatherer',
            class: 'IronGatherer',
            cost: { wood: 30, stone: 30 },
            description: 'Mines iron ore deposits',
            hotkey: 'U',
            terrainRequired: ['mountain', 'snow_mountain'],
            requiredTech: null,
            population: 3,
            produces: { type: 'iron', amount: 2 },
            requiresOre: 'iron'
          }
        ]
      },
      'Training': {
        icon: '⚔️',
        color: '#ef4444',
        hotkey: '4',
        buildings: [
          {
            name: 'Barracks',
            class: 'Barracks',
            cost: { wood: 100, stone: 50 },
            description: 'Trains infantry units',
            hotkey: 'I',
            terrainRequired: ['grass', 'light_grass', 'rough'],
            requiredTech: null,
            population: 1,
            produces: null
          },
          {
            name: 'Stables',
            class: 'Stables',
            cost: { wood: 150, stone: 75 },
            description: 'Trains cavalry units',
            hotkey: 'O',
            terrainRequired: ['grass', 'light_grass'],
            requiredTech: null,
            population: 2,
            produces: null
          }
        ]
      },
      'Crafting': {
        icon: '🔨',
        color: '#f97316',
        hotkey: '5',
        buildings: [
          {
            name: 'Blacksmith',
            class: 'Blacksmith',
            cost: { wood: 20, iron: 10 },
            description: 'Crafts weapons and tools',
            hotkey: 'P',
            terrainRequired: ['grass', 'light_grass', 'rough'],
            requiredTech: null,
            population: 2,
            produces: null
          }
        ]
      }
    };

    this.buildInterface();
    this.setupEventListeners();
  }

  buildInterface() {
    this.clearContent();

    // Search and filters section
    this.createSearchAndFilters();

    // Main content area with tabs and buildings
    this.createMainContent();

    // Footer with instructions
    this.createFooter();
  }

  createSearchAndFilters() {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: rgba(31, 41, 55, 0.5);
    `;

    // Search input
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      position: relative;
      margin-bottom: 12px;
    `;

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search buildings...';
    searchInput.value = this.searchQuery;
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: rgba(31, 41, 55, 0.8);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 4px;
      color: white;
      font-size: 13px;
      box-sizing: border-box;
    `;
    searchInput.oninput = (e) => {
      this.searchQuery = e.target.value;
      this.updateBuildingsList();
    };

    searchContainer.appendChild(searchInput);

    // Filter buttons
    const filtersContainer = document.createElement('div');
    filtersContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    `;

    const affordableBtn = this.createFilterButton(
      '💰 Affordable',
      this.showOnlyAffordable,
      () => {
        this.showOnlyAffordable = !this.showOnlyAffordable;
        this.buildInterface();
      }
    );

    const placeableBtn = this.createFilterButton(
      '📍 Valid Here',
      this.showOnlyPlaceableHere,
      () => {
        this.showOnlyPlaceableHere = !this.showOnlyPlaceableHere;
        this.buildInterface();
      }
    );

    filtersContainer.appendChild(affordableBtn);
    filtersContainer.appendChild(placeableBtn);

    // Selected tile info
    const tileInfo = document.createElement('div');
    tileInfo.style.cssText = `
      font-size: 11px;
      color: rgb(156, 163, 175);
    `;
    
    if (this.selectedTile) {
      tileInfo.innerHTML = `Selected: ${this.selectedTile.biome}${this.selectedTile.oreType ? ` (${this.selectedTile.oreType} ore)` : ''}`;
    } else {
      tileInfo.textContent = 'No tile selected';
    }

    section.appendChild(searchContainer);
    section.appendChild(filtersContainer);
    section.appendChild(tileInfo);
    this.addToContent(section);
  }

  createFilterButton(text, active, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.onclick = onClick;
    
    const bgColor = active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(75, 85, 99, 0.5)';
    const textColor = active ? 'rgb(34, 197, 94)' : 'rgb(156, 163, 175)';
    
    btn.style.cssText = `
      padding: 4px 8px;
      border: 1px solid ${active ? 'rgba(34, 197, 94, 0.3)' : 'rgb(75, 85, 99)'};
      border-radius: 4px;
      background: ${bgColor};
      color: ${textColor};
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
    `;

    btn.onmouseover = () => {
      if (!active) {
        btn.style.background = 'rgba(75, 85, 99, 0.8)';
        btn.style.color = 'white';
      }
    };

    btn.onmouseout = () => {
      if (!active) {
        btn.style.background = 'rgba(75, 85, 99, 0.5)';
        btn.style.color = 'rgb(156, 163, 175)';
      }
    };

    return btn;
  }

  createMainContent() {
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `
      display: flex;
      flex: 1;
      min-height: 0;
    `;

    // Category tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.style.cssText = `
      width: 80px;
      border-right: 1px solid rgb(75, 85, 99);
      background: rgba(31, 41, 55, 0.8);
      display: flex;
      flex-direction: column;
    `;

    Object.entries(this.categories).forEach(([category, data]) => {
      const tab = this.createCategoryTab(category, data);
      tabsContainer.appendChild(tab);
    });

    // Buildings list
    this.buildingsContainer = document.createElement('div');
    this.buildingsContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
    `;

    mainContainer.appendChild(tabsContainer);
    mainContainer.appendChild(this.buildingsContainer);
    this.addToContent(mainContainer);

    this.updateBuildingsList();
  }

  createCategoryTab(category, data) {
    const tab = document.createElement('button');
    tab.style.cssText = `
      padding: 12px 8px;
      border: none;
      border-bottom: 1px solid rgb(75, 85, 99);
      background: ${this.selectedCategory === category ? 'rgba(75, 85, 99, 0.8)' : 'transparent'};
      color: ${this.selectedCategory === category ? 'white' : 'rgb(156, 163, 175)'};
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      position: relative;
      transition: all 0.2s;
    `;

    // Icon
    const icon = document.createElement('div');
    icon.textContent = data.icon;
    icon.style.fontSize = '16px';
    tab.appendChild(icon);

    // Category name
    const name = document.createElement('div');
    name.textContent = category;
    name.style.cssText = `
      font-size: 10px;
      text-align: center;
      line-height: 1.2;
    `;
    tab.appendChild(name);

    // Hotkey
    const hotkey = document.createElement('div');
    hotkey.textContent = data.hotkey;
    hotkey.style.cssText = `
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 10px;
      color: rgb(107, 114, 128);
    `;
    tab.appendChild(hotkey);

    tab.onclick = () => {
      this.selectedCategory = category;
      this.buildInterface();
    };

    tab.onmouseover = () => {
      if (this.selectedCategory !== category) {
        tab.style.background = 'rgba(75, 85, 99, 0.4)';
        tab.style.color = 'white';
      }
    };

    tab.onmouseout = () => {
      if (this.selectedCategory !== category) {
        tab.style.background = 'transparent';
        tab.style.color = 'rgb(156, 163, 175)';
      }
    };

    return tab;
  }

  updateBuildingsList() {
    if (!this.buildingsContainer) return;

    this.buildingsContainer.innerHTML = '';
    const buildings = this.getFilteredBuildings();

    if (buildings.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        padding: 24px;
        text-align: center;
        color: rgb(107, 114, 128);
      `;
      emptyState.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">🔍</div>
        <div>No buildings match your filters</div>
        <button onclick="this.parentNode.parentNode.parentNode.querySelector('.building-placement-ui').clearFilters()" 
                style="color: rgb(59, 130, 246); background: none; border: none; cursor: pointer; margin-top: 8px; font-size: 12px;">
          Clear filters
        </button>
      `;
      this.buildingsContainer.appendChild(emptyState);
      return;
    }

    buildings.forEach(building => {
      const buildingElement = this.createBuildingElement(building);
      this.buildingsContainer.appendChild(buildingElement);
    });
  }

  createBuildingElement(building) {
    const player = this.scene.gameWorld.players.find(p => p.name === 'CPU1'); // Get human player
    const resources = player ? player.resources : {};
    
    const affordable = ResourceCost.canAfford(building.cost, resources);
    const placeable = this.canPlaceBuilding(building);
    const available = affordable && placeable;

    const element = document.createElement('div');
    element.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgb(75, 85, 99);
      cursor: ${available ? 'pointer' : 'not-allowed'};
      background: ${this.placementMode?.name === building.name ? 'rgba(59, 130, 246, 0.2)' : 'transparent'};
      transition: background 0.2s;
    `;

    if (available) {
      element.onmouseover = () => {
        if (this.placementMode?.name !== building.name) {
          element.style.background = 'rgba(75, 85, 99, 0.4)';
        }
      };
      element.onmouseout = () => {
        if (this.placementMode?.name !== building.name) {
          element.style.background = 'transparent';
        }
      };
      element.onclick = () => this.selectBuilding(building);
    }

    // Building header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    `;

    const titleSection = document.createElement('div');
    titleSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const title = document.createElement('div');
    title.textContent = building.name;
    title.style.cssText = `
      font-weight: bold;
      color: ${available ? 'white' : 'rgb(107, 114, 128)'};
    `;

    const hotkey = document.createElement('span');
    hotkey.textContent = building.hotkey;
    hotkey.style.cssText = `
      font-size: 10px;
      background: rgba(75, 85, 99, 0.5);
      color: rgb(156, 163, 175);
      padding: 2px 4px;
      border-radius: 2px;
    `;

    const terrainIcon = this.getTerrainIcon(building.terrainRequired);

    titleSection.appendChild(title);
    titleSection.appendChild(hotkey);
    titleSection.appendChild(terrainIcon);

    const costDisplay = ResourceCost.create(building.cost, resources, { size: 'small' });

    header.appendChild(titleSection);
    header.appendChild(costDisplay);

    // Requirements
    const requirements = document.createElement('div');
    requirements.style.cssText = `
      margin-bottom: 8px;
      font-size: 11px;
    `;

    const reqMessages = [];
    if (building.requiredTech && !this.hasTech(building.requiredTech)) {
      reqMessages.push(`🔒 Requires: ${building.requiredTech}`);
    }
    if (this.selectedTile && !building.terrainRequired.includes(this.selectedTile.biome)) {
      reqMessages.push(`⚠️ Needs: ${building.terrainRequired.join(', ')}`);
    }
    if (building.requiresOre && this.selectedTile && this.selectedTile.oreType !== building.requiresOre) {
      reqMessages.push(`⛏️ Needs: ${building.requiresOre} ore deposit`);
    }
    if (building.population > 0) {
      reqMessages.push(`👥 Requires ${building.population} population`);
    }

    requirements.innerHTML = reqMessages.map(msg => `<div style="color: rgb(239, 68, 68); margin-bottom: 2px;">${msg}</div>`).join('');

    // Production info
    const production = document.createElement('div');
    if (building.produces) {
      production.style.cssText = `
        font-size: 11px;
        color: rgb(34, 197, 94);
        margin-bottom: 8px;
      `;
      production.textContent = `📈 Produces: +${building.produces.amount} ${building.produces.type}/turn`;
    }

    // Description
    const description = document.createElement('div');
    description.textContent = building.description;
    description.style.cssText = `
      font-size: 11px;
      color: rgb(156, 163, 175);
    `;

    element.appendChild(header);
    element.appendChild(requirements);
    element.appendChild(production);
    element.appendChild(description);

    return element;
  }

  getTerrainIcon(terrains) {
    const iconElement = document.createElement('div');
    iconElement.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    `;

    if (terrains.some(t => ['forest', 'pine_forest', 'dark_forest'].includes(t))) {
      iconElement.textContent = '🌲';
      iconElement.style.cssText = 'font-size: 12px;';
    } else if (terrains.some(t => ['mountain', 'snow_mountain', 'hills'].includes(t))) {
      iconElement.textContent = '⛰️';
      iconElement.style.cssText = 'font-size: 12px;';
    } else if (terrains.some(t => ['ocean', 'lake', 'river'].includes(t))) {
      iconElement.textContent = '🌊';
      iconElement.style.cssText = 'font-size: 12px;';
    } else {
      iconElement.style.background = 'rgb(34, 197, 94)';
    }

    return iconElement;
  }

  getFilteredBuildings() {
    const categoryBuildings = this.categories[this.selectedCategory]?.buildings || [];
    
    return categoryBuildings.filter(building => {
      // Search filter
      if (this.searchQuery && !building.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
        return false;
      }

      // Affordability filter
      if (this.showOnlyAffordable) {
        const player = this.scene.gameWorld.players.find(p => p.name === 'CPU1');
        const resources = player ? player.resources : {};
        if (!ResourceCost.canAfford(building.cost, resources)) {
          return false;
        }
      }

      // Terrain filter
      if (this.showOnlyPlaceableHere && !this.canPlaceBuilding(building)) {
        return false;
      }

      return true;
    });
  }

  canPlaceBuilding(building) {
    if (!this.selectedTile) return true; // If no tile selected, assume placeable

    // Check terrain requirements
    if (!building.terrainRequired.includes(this.selectedTile.biome)) {
      return false;
    }

    // Check ore requirements
    if (building.requiresOre && this.selectedTile.oreType !== building.requiresOre) {
      return false;
    }

    // Check tech requirements
    if (building.requiredTech && !this.hasTech(building.requiredTech)) {
      return false;
    }

    return true;
  }

  hasTech(techName) {
    // Mock tech system - assume basic techs are always available
    const unlockedTech = ['Carpentry', 'Masonry', 'Basic Mining'];
    return !techName || unlockedTech.includes(techName);
  }

  selectBuilding(building) {
    if (this.placementMode?.name === building.name) {
      // Deselect if clicking same building
      this.placementMode = null;
      this.scene.events.emit('buildingPlacementCancelled');
    } else {
      // Select new building
      this.placementMode = building;
      this.scene.events.emit('buildingPlacementStarted', building);
    }
    this.updateBuildingsList();
  }

  createFooter() {
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 12px;
      border-top: 1px solid rgb(75, 85, 99);
      background: rgba(31, 41, 55, 0.8);
      font-size: 11px;
      color: rgb(156, 163, 175);
    `;

    footer.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
        <div>B - Toggle menu</div>
        <div>ESC - Cancel placement</div>
        <div>1-5 - Category tabs</div>
        <div>Q,W,E... - Quick build</div>
      </div>
      ${this.placementMode ? `
        <div style="text-align: center; padding: 8px; background: rgba(59, 130, 246, 0.2); border-radius: 4px; color: rgb(147, 197, 253);">
          🏗️ Placing ${this.placementMode.name} - Click on a valid hex tile
        </div>
      ` : ''}
    `;

    this.addToContent(footer);
  }

  setupEventListeners() {
    // Listen for tile selection changes
    this.scene.events.on('tileSelected', (tile) => {
      this.selectedTile = tile;
      this.buildInterface();
    });

    // Listen for placement completion
    this.scene.events.on('buildingPlaced', () => {
      // Keep placement mode active for rapid building
      this.buildInterface();
    });

    // Listen for placement cancellation
    this.scene.events.on('buildingPlacementCancelled', () => {
      this.placementMode = null;
      this.buildInterface();
    });
  }

  // Public methods for UIManager integration
  startPlacement(buildingClass) {
    const building = Object.values(this.categories)
      .flatMap(cat => cat.buildings)
      .find(b => b.class === buildingClass);
    
    if (building) {
      this.selectBuilding(building);
    }
  }

  cancelPlacement() {
    this.placementMode = null;
    this.buildInterface();
  }

  getCurrentPlacement() {
    return this.placementMode;
  }

  clearFilters() {
    this.searchQuery = '';
    this.showOnlyAffordable = false;
    this.showOnlyPlaceableHere = false;
    this.buildInterface();
  }

  // Override base modal methods
  onShow() {
    this.buildInterface();
  }

  onHide() {
    if (this.placementMode) {
      this.scene.events.emit('buildingPlacementCancelled');
      this.placementMode = null;
    }
  }
}

window.BuildingPlacementUI = BuildingPlacementUI;