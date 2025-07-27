// src/UIScene.js - Simplified without resource bar

class UIScene extends Phaser.Scene {
  constructor() { 
    super({ key: 'UIScene' }); 
  }

  create() {
    // Just create a simple tick counter in bottom right
    this.tickText = this.add.text(this.scale.width - 120, this.scale.height - 30, 'Tick: 0', {
      font: '14px Arial', 
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(1000);

    console.log('✅ Simplified UIScene created - no resource bar');
  }

  updateTick(tick) {
    this.tickText?.setText('Tick: ' + tick);
  }

  updateResources() {
    // No longer needed - handled by PlayerOverviewUI
  }
}

window.UIScene = UIScene;