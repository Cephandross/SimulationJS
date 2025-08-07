// src/ui/components/StackDisplay.js - UI component for displaying unit stacks

/**
 * StackDisplay - Visual component for showing unit stack information
 * 
 * Displays stack count badges and unit composition when hovering over stacks
 */
class StackDisplay {
  constructor(scene) {
    this.scene = scene;
    this.stackBadges = new Map(); // hex key -> badge sprite
    this.tooltip = null;
    this.currentHex = null;
  }

  /**
   * Update all stack displays in the game world
   */
  updateAllStacks() {
    if (!this.scene.gameWorld) return;

    // Clear existing badges
    this.clearAllBadges();

    // Get all hexes with units
    const unitHexes = new Set();
    this.scene.gameWorld.getAllUnits().forEach(unit => {
      const key = `${unit.coords[0]},${unit.coords[1]}`;
      unitHexes.add(key);
    });

    // Create badges for stacks with multiple units
    for (const hexKey of unitHexes) {
      const [q, r] = hexKey.split(',').map(Number);
      const stackInfo = this.scene.gameWorld.getStackInfo(q, r);
      
      if (stackInfo && stackInfo.totalUnits > 1) {
        this.createStackBadge(q, r, stackInfo);
      }
    }
  }

  /**
   * Create a stack count badge at the specified hex
   */
  createStackBadge(q, r, stackInfo) {
    if (typeof hexToPixel === 'undefined') return;

    const [x, y] = hexToPixel(q, r);
    const hexKey = `${q},${r}`;

    // Create badge background
    const badge = this.scene.add.circle(x + 25, y - 25, 12, 0x000000, 0.8)
      .setDepth(10)
      .setStroke(0xffffff, 2);

    // Create badge text
    const text = this.scene.add.text(x + 25, y - 25, stackInfo.totalUnits.toString(), {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold'
    })
      .setOrigin(0.5, 0.5)
      .setDepth(11);

    // Store badge components
    this.stackBadges.set(hexKey, { badge, text });

    // Make badge interactive for tooltip display
    badge.setInteractive()
      .on('pointerover', () => this.showStackTooltip(q, r, stackInfo))
      .on('pointerout', () => this.hideStackTooltip());
  }

  /**
   * Show detailed stack tooltip
   */
  showStackTooltip(q, r, stackInfo) {
    if (typeof hexToPixel === 'undefined') return;

    const [x, y] = hexToPixel(q, r);
    this.currentHex = [q, r];

    // Create tooltip background
    const tooltipWidth = 200;
    const tooltipHeight = Math.max(60, stackInfo.composition.length * 20 + 40);
    
    this.tooltip = this.scene.add.container(x + 40, y - tooltipHeight / 2);

    const bg = this.scene.add.rectangle(0, 0, tooltipWidth, tooltipHeight, 0x000000, 0.9)
      .setStroke(0xffffff, 1);
    
    this.tooltip.add(bg);

    // Title
    const title = this.scene.add.text(0, -tooltipHeight/2 + 15, `Stack at [${q}, ${r}]`, {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    
    this.tooltip.add(title);

    // Unit composition
    let yOffset = -tooltipHeight/2 + 35;
    stackInfo.composition.forEach(comp => {
      const unitText = this.scene.add.text(0, yOffset, `${comp.count}x ${comp.type} (${comp.owner.name})`, {
        fontSize: '12px',
        fill: '#cccccc'
      }).setOrigin(0.5, 0.5);
      
      this.tooltip.add(unitText);
      yOffset += 18;
    });

    this.tooltip.setDepth(15);
  }

  /**
   * Hide stack tooltip
   */
  hideStackTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
    this.currentHex = null;
  }

  /**
   * Clear all stack badges
   */
  clearAllBadges() {
    for (const [key, { badge, text }] of this.stackBadges) {
      badge.destroy();
      text.destroy();
    }
    this.stackBadges.clear();
  }

  /**
   * Update stack display for specific hex (when units move)
   */
  updateStackAt(q, r) {
    const hexKey = `${q},${r}`;
    
    // Remove existing badge
    if (this.stackBadges.has(hexKey)) {
      const { badge, text } = this.stackBadges.get(hexKey);
      badge.destroy();
      text.destroy();
      this.stackBadges.delete(hexKey);
    }

    // Create new badge if needed
    const stackInfo = this.scene.gameWorld.getStackInfo(q, r);
    if (stackInfo && stackInfo.totalUnits > 1) {
      this.createStackBadge(q, r, stackInfo);
    }

    // Update tooltip if it's showing for this hex
    if (this.currentHex && this.currentHex[0] === q && this.currentHex[1] === r) {
      this.hideStackTooltip();
      if (stackInfo && stackInfo.totalUnits > 1) {
        this.showStackTooltip(q, r, stackInfo);
      }
    }
  }

  /**
   * Destroy all stack display elements
   */
  destroy() {
    this.clearAllBadges();
    this.hideStackTooltip();
  }
}

window.StackDisplay = StackDisplay;