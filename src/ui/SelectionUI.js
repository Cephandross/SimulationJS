// src/ui/SelectionUI.js - Modular selection panel system

class SelectionUI {
  constructor(scene) {
    this.scene = scene;
    this.selectedEntity = null;
    this.panel = null;
    this.isVisible = false;
    
    // Panel configuration
    this.config = {
      width: 280,
      height: 'auto',
      x: this.scene.scale.width - 300,
      y: this.scene.scale.height - 20,
      padding: 16,
      borderRadius: 8
    };
    
    this.createPanel();
    this.setupEventListeners();
  }

  createPanel() {
    // Main panel container
    this.panel = this.scene.add.container(this.config.x, this.config.y);
    this.panel.setDepth(1000); // Always on top
    this.panel.setScrollFactor(0); // Fixed to camera
    this.panel.setVisible(false);

    // Background
    this.background = this.scene.add.rectangle(0, 0, this.config.width, 200, 0x000000, 0.85);
    this.background.setStrokeStyle(2, 0x666666);
    this.background.setOrigin(1, 1); // Bottom-right anchor
    this.panel.add(this.background);

    // Content container for dynamic elements
    this.content = this.scene.add.container(-this.config.width + this.config.padding, -this.config.padding);
    this.panel.add(this.content);
  }

  setupEventListeners() {
    // Listen for selection events
    this.scene.events.on('entitySelected', (entity) => {
      this.selectEntity(entity);
    });

    this.scene.events.on('selectionCleared', () => {
      this.clearSelection();
    });

    // Update panel each tick for live data
    this.scene.events.on('update', () => {
      if (this.isVisible && this.selectedEntity) {
        this.updatePanel();
      }
    });
  }

  selectEntity(entity) {
    this.selectedEntity = entity;
    this.showPanel();
    this.buildPanelContent();
  }

  clearSelection() {
    this.selectedEntity = null;
    this.hidePanel();
  }

  showPanel() {
    this.isVisible = true;
    this.panel.setVisible(true);
    
    // Future: Add slide-in animation
    // this.scene.tweens.add({
    //   targets: this.panel,
    //   x: this.config.x,
    //   duration: 200,
    //   ease: 'Power2'
    // });
  }

  hidePanel() {
    this.isVisible = false;
    this.panel.setVisible(false);
    this.clearContent();
  }

  clearContent() {
    // Remove all dynamic content
    this.content.removeAll(true);
  }

  buildPanelContent() {
    this.clearContent();
    
    if (!this.selectedEntity) return;

    // Determine entity type and build appropriate panel
    if (this.selectedEntity.category) {
      // It's a building
      this.buildBuildingPanel(this.selectedEntity);
    } else if (this.selectedEntity.type) {
      // It's a unit
      this.buildUnitPanel(this.selectedEntity);
    }

    // Adjust background height based on content
    this.adjustPanelHeight();
  }

  buildUnitPanel(unit) {
    let yOffset = 0;

    // Header with team color and unit info
    const header = this.createHeader(unit.type, unit.owner.color, 'Unit');
    this.content.add(header);
    yOffset += 30;

    // Health bar
    const healthBar = this.createHealthBar(unit.hp, unit.maxHp || unit.hp);
    healthBar.y = yOffset;
    this.content.add(healthBar);
    yOffset += 35;

    // Stats grid
    const stats = this.createStatsGrid([
      { label: 'Attack', value: unit.attack || 'N/A' },
      { label: 'Defense', value: unit.defense || 'N/A' },
      { label: 'Movement', value: `${unit.movePts}/${unit.maxMovePts}` },
      { label: 'Range', value: unit.range || '1' }
    ]);
    stats.y = yOffset;
    this.content.add(stats);
    yOffset += 60;

    // Mission/destination info
    if (unit.destination || unit.mission) {
      const mission = this.createMissionInfo(unit);
      mission.y = yOffset;
      this.content.add(mission);
      yOffset += 50;
    }

    return yOffset;
  }

  buildBuildingPanel(building) {
    let yOffset = 0;

    // Header
    const header = this.createHeader(building.type, building.owner.color, building.category);
    this.content.add(header);
    yOffset += 30;

    // Health/Construction bar
    const maxHp = building.hitpoints;
    const currentHp = building.completed ? building.hitpoints : 
      Math.floor((building.ticksBuild / building.buildTime) * building.hitpoints);
    const healthBar = this.createHealthBar(currentHp, maxHp, !building.completed);
    healthBar.y = yOffset;
    this.content.add(healthBar);
    yOffset += 35;

    // Building-specific stats
    const stats = [];
    if (building.completed) {
      stats.push({ label: 'Status', value: '✅ Complete' });
    } else {
      const progress = Math.floor((building.ticksBuild / building.buildTime) * 100);
      stats.push({ label: 'Progress', value: `${progress}%` });
    }

    if (building.category === 'Gathering' && building.resourcetype) {
      stats.push({ 
        label: 'Produces', 
        value: `${building.resourceamount} ${building.resourcetype}` 
      });
    }

    const statsGrid = this.createStatsGrid(stats);
    statsGrid.y = yOffset;
    this.content.add(statsGrid);
    yOffset += Math.max(40, stats.length * 25);

    return yOffset;
  }

  createHeader(name, teamColor, type) {
    const header = this.scene.add.container(0, 0);

    // Team indicator
    const teamDot = this.scene.add.circle(6, 0, 6, teamColor);
    header.add(teamDot);

    // Unit/building name
    const nameText = this.scene.add.text(20, 0, name, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    header.add(nameText);

    // Type label
    const typeText = this.scene.add.text(nameText.width + 25, 0, type, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);
    header.add(typeText);

    return header;
  }

  createHealthBar(current, max, isConstruction = false) {
    const container = this.scene.add.container(0, 0);

    // Label
    const label = isConstruction ? 'Construction' : 'Health';
    const labelText = this.scene.add.text(0, 0, label, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#cccccc'
    }).setOrigin(0, 0);
    container.add(labelText);

    // Progress bar background
    const barBg = this.scene.add.rectangle(0, 15, this.config.width - 40, 8, 0x333333);
    barBg.setOrigin(0, 0);
    container.add(barBg);

    // Progress bar fill
    const fillWidth = (current / max) * (this.config.width - 40);
    const fillColor = isConstruction ? 0x4444ff : 0x44aa44;
    const barFill = this.scene.add.rectangle(0, 15, fillWidth, 8, fillColor);
    barFill.setOrigin(0, 0);
    container.add(barFill);

    // HP text
    const hpText = this.scene.add.text(this.config.width - 40, 25, `${current} / ${max}`, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#cccccc'
    }).setOrigin(1, 0);
    container.add(hpText);

    return container;
  }

  createStatsGrid(stats) {
    const container = this.scene.add.container(0, 0);
    
    stats.forEach((stat, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col * (this.config.width - 40) / 2;
      const y = row * 25;

      // Stat background
      const bg = this.scene.add.rectangle(x, y, (this.config.width - 50) / 2, 20, 0x333333, 0.5);
      bg.setOrigin(0, 0);
      container.add(bg);

      // Stat label
      const label = this.scene.add.text(x + 5, y + 10, stat.label, {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#cccccc'
      }).setOrigin(0, 0.5);
      container.add(label);

      // Stat value
      const value = this.scene.add.text(x + (this.config.width - 50) / 2 - 5, y + 10, stat.value, {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);
      container.add(value);
    });

    return container;
  }

  createMissionInfo(unit) {
    const container = this.scene.add.container(0, 0);

    // Mission background
    const bg = this.scene.add.rectangle(0, 0, this.config.width - 40, 40, 0x444444, 0.3);
    bg.setStrokeStyle(1, 0x4444ff);
    bg.setOrigin(0, 0);
    container.add(bg);

    // Mission label
    const label = this.scene.add.text(5, 5, 'CURRENT MISSION', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#aaaaaa'
    }).setOrigin(0, 0);
    container.add(label);

    // Mission text
    let missionText = 'Idle';
    if (unit.destination) {
      missionText = `Moving to [${unit.destination.q}, ${unit.destination.r}]`;
    }
    if (unit.mission) {
      missionText += `\n🎯 ${unit.mission.type}`;
    }

    const text = this.scene.add.text(5, 20, missionText, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0, 0);
    container.add(text);

    return container;
  }

  adjustPanelHeight() {
    // Calculate content height and adjust background
    const contentBounds = this.content.getBounds();
    const newHeight = Math.max(100, contentBounds.height + this.config.padding * 2);
    this.background.setSize(this.config.width, newHeight);
  }

  updatePanel() {
    // Rebuild panel content to show live updates
    if (this.selectedEntity) {
      this.buildPanelContent();
    }
  }

  destroy() {
    if (this.panel) {
      this.panel.destroy();
    }
  }
}

window.SelectionUI = SelectionUI;