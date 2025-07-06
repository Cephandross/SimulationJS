// src/ui/SelectionUI.js - Modular selection panel system

class SelectionUI {
  constructor(scene) {
    this.scene = scene;
    this.selectedEntity = null;
    this.panelElement = null;  // DOM element instead of Phaser panel
    this.isVisible = false;
    
    this.createPanel();
    this.setupEventListeners();
  }

  createPanel() {
    // Create DOM element instead of Phaser objects
    this.panelElement = document.createElement('div');
    this.panelElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #666;
      border-radius: 8px;
      padding: 16px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 1000;
      display: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    `;
    
    document.body.appendChild(this.panelElement);
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
    if (this.panelElement) {
      this.panelElement.style.display = 'block';
    }
  }

  hidePanel() {
    this.isVisible = false;
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
  }

  buildPanelContent() {
    if (!this.selectedEntity) return;
    
    let html = '';
    
    if (this.selectedEntity.category) {
      // Building
      html = `
        <div style="color: #${this.selectedEntity.owner.color.toString(16).padStart(6, '0')}; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center;">
          <div style="width: 12px; height: 12px; background: #${this.selectedEntity.owner.color.toString(16).padStart(6, '0')}; border-radius: 50%; margin-right: 8px;"></div>
          ${this.selectedEntity.type}
          <span style="color: #aaa; font-weight: normal; margin-left: 8px;">${this.selectedEntity.category}</span>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; color: #ccc; margin-bottom: 4px;">${this.selectedEntity.completed ? 'Health' : 'Construction'}</div>
          <div style="background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; background: ${this.selectedEntity.completed ? '#44aa44' : '#4444ff'}; width: ${this.selectedEntity.completed ? '100' : Math.floor((this.selectedEntity.ticksBuild / this.selectedEntity.buildTime) * 100)}%;"></div>
          </div>
          <div style="font-size: 11px; color: #ccc; margin-top: 2px;">${this.selectedEntity.completed ? this.selectedEntity.hitpoints : Math.floor((this.selectedEntity.ticksBuild / this.selectedEntity.buildTime) * this.selectedEntity.hitpoints)} / ${this.selectedEntity.hitpoints} HP</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
          <div style="background: rgba(255,255,255,0.1); padding: 4px 6px; border-radius: 4px; font-size: 11px;">
            <span style="color: #ccc;">Status</span><br>
            <span style="color: #fff; font-weight: bold;">${this.selectedEntity.completed ? '✅ Complete' : '🔨 Building...'}</span>
          </div>
          ${this.selectedEntity.category === 'Gathering' && this.selectedEntity.resourcetype ? `
          <div style="background: rgba(255,255,255,0.1); padding: 4px 6px; border-radius: 4px; font-size: 11px;">
            <span style="color: #ccc;">Produces</span><br>
            <span style="color: #fff; font-weight: bold;">${this.selectedEntity.resourceamount} ${this.selectedEntity.resourcetype}</span>
          </div>
          ` : '<div></div>'}
        </div>
      `;
    } else {
      // Unit
      html = `
        <div style="color: #${this.selectedEntity.owner.color.toString(16).padStart(6, '0')}; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center;">
          <div style="width: 12px; height: 12px; background: #${this.selectedEntity.owner.color.toString(16).padStart(6, '0')}; border-radius: 50%; margin-right: 8px;"></div>
          ${this.selectedEntity.type}
          <span style="color: #aaa; font-weight: normal; margin-left: 8px;">Unit</span>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; color: #ccc; margin-bottom: 4px;">Health</div>
          <div style="background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; background: #44aa44; width: ${Math.floor((this.selectedEntity.hp / (this.selectedEntity.maxHp || this.selectedEntity.hp)) * 100)}%;"></div>
          </div>
          <div style="font-size: 11px; color: #ccc; margin-top: 2px;">${this.selectedEntity.hp} / ${this.selectedEntity.maxHp || this.selectedEntity.hp} HP</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
          <div style="background: rgba(255,255,255,0.1); padding: 4px 6px; border-radius: 4px; font-size: 11px;">
            <span style="color: #ccc;">Attack</span><br>
            <span style="color: #fff; font-weight: bold;">${this.selectedEntity.attack || 'N/A'}</span>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 4px 6px; border-radius: 4px; font-size: 11px;">
            <span style="color: #ccc;">Defense</span><br>
            <span style="color: #fff; font-weight: bold;">${this.selectedEntity.defense || 'N/A'}</span>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 4px 6px; border-radius: 4px; font-size: 11px;">
            <span style="color: #ccc;">Movement</span><br>
            <span style="color: #fff; font-weight: bold;">${this.selectedEntity.movePts}/${this.selectedEntity.maxMovePts}</span>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 4px 6px; border-radius: 4px; font-size: 11px;">
            <span style="color: #ccc;">Range</span><br>
            <span style="color: #fff; font-weight: bold;">${this.selectedEntity.range || '1'}</span>
          </div>
        </div>
        ${this.selectedEntity.destination || this.selectedEntity.mission ? `
        <div style="background: rgba(100, 100, 255, 0.2); border-left: 3px solid #4444ff; padding: 8px; border-radius: 4px;">
          <div style="font-size: 11px; color: #aaa; text-transform: uppercase; margin-bottom: 4px;">Current Mission</div>
          <div style="font-size: 12px; color: #fff;">
            ${this.selectedEntity.destination ? `Moving to [${this.selectedEntity.destination.q}, ${this.selectedEntity.destination.r}]` : 'Idle'}
            ${this.selectedEntity.mission ? `<br>🎯 ${this.selectedEntity.mission.type}` : ''}
          </div>
        </div>
        ` : ''}
      `;
    }
    
    this.panelElement.innerHTML = html;
  }

  updatePanel() {
    // Rebuild panel content to show live updates
    if (this.selectedEntity) {
      this.buildPanelContent();
    }
  }

  destroy() {
    if (this.panelElement) {
      document.body.removeChild(this.panelElement);
      this.panelElement = null;
    }
  }
}

window.SelectionUI = SelectionUI;