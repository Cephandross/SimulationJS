// src/UIScene.js
class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  create() {
    this.players    = this.registry.get('players') || [];
    const panelWidth = 745,
          lineH      = 24,
          panelH     = 40 + this.players.length * lineH,
          x0         = this.scale.width - panelWidth,
          y0         = 0;

    this.add.rectangle(x0, y0, panelWidth, panelH, 0x000000, 0.6)
      .setOrigin(0).setScrollFactor(0);

    this.tickText = this.add.text(x0 + 10, y0 + 10, 'Tick: 0', {
      font: '16px Arial', fill: '#ffffff'
    }).setScrollFactor(0);

    this.statTexts  = [];
    this.startTexts = [];

    this.players.forEach((p, idx) => {
      // resource line
      const stat = this.add.text(
        x0 + 10,
        y0 + 36 + idx * lineH,
        this._formatPlayerLine(p),
        { font: '14px Arial', fill: `#${p.color.toString(16).padStart(6,'0')}` }
      ).setScrollFactor(0);
      this.statTexts.push(stat);

      // start‐coord line (right‐aligned)
      const sc = this.registry.get(`${p.name}Start`) || [0, 0];
      const startTxt = this.add.text(
        x0 + panelWidth - 10,
        y0 + 36 + idx * lineH,
        `Start: [${sc[0]},${sc[1]}]`,
        { font: '14px Arial', fill: `#${p.color.toString(16).padStart(6,'0')}` }
      )
      .setOrigin(1, 0)
      .setScrollFactor(0);
      this.startTexts.push(startTxt);
    });
  }

  updateTick(tick) {
    this.tickText?.setText('Tick: ' + tick);
  }

  updateResources() {
    this.players = this.registry.get('players') || [];
    this.players.forEach((p, idx) => {
      this.statTexts[idx].setText(this._formatPlayerLine(p));
      const sc = this.registry.get(`${p.name}Start`) || [0, 0];
      this.startTexts[idx].setText(`Start: [${sc[0]},${sc[1]}]`);
    });
  }

  _formatPlayerLine(p) {
    const { food, wood, stone, iron, coal, copper, gold, coins } = p.resources;
    return `${p.name} → Food:${food} Wood:${wood} Stone:${stone} Iron:${iron} Coal:${coal} Cu:${copper} Gold:${gold} Coins:${coins}`;
  }
  
}
window.UIScene = UIScene;
