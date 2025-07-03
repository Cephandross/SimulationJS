// src/main.js

// track build‐progress bars
const buildProgressBars = [];
// CPU players
let players = [];

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.tickCount  = 0;
    this.lastTick   = 0;
    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
  }

  preload() {
    // load 64×64 hex ground tiles
    window.HEX_TILES.forEach(key => {
      this.load.image(
        key,
        `${window.ASSET_PATH}hex_tiles/Ground/${key}.png`
      );
    });
    // load the rest of your 16×16 sheets
    window.SPRITE_SHEETS.forEach(sheet => {
      this.load.spritesheet(
        sheet.key,
        `${window.ASSET_PATH}${sheet.file}`,
        { frameWidth: sheet.width, frameHeight: sheet.height }
      );
    });
  }

  create() {
    // reset tick state
    this.tickCount  = 0;
    this.lastTick   = 0;
    this.isDragging = false;

    // build the hex map
    this.map = new TileMap(this);
    // expose globally so player.js can call map.placeBuildingState(...)
    window.map = this.map;

    // resume audio on first click
    this.input.once('pointerdown', () => {
      if (this.sound?.context.state === 'suspended') {
        this.sound.context.resume();
      }
    });

    // set camera bounds to our hex‐grid extents
    this.cameras.main.setBounds(
      0, 0,
      this.map.worldWidth,
      this.map.worldHeight
    );

    // bootstrap two CPU players
    if (players.length === 0) {
      players.push(
        new Player('CPU1', 0xff0000),
        new Player('CPU2', 0x0000ff)
      );
      players.forEach(p =>
        p.addResources({
          food:10000, wood:10000, stone:10000,
          iron:5000, copper:5000, coal:5000,
          gold:2000, coins:10000
        })
      );
      this.registry.set('players', players);
      this.scene.launch('UIScene');
      players.forEach(p => p.initializeBase(this));
    }

    // pan via drag - simplified approach
    this.input.on('pointerdown', ptr => {
      if (ptr.y > 40) {
        this.isDragging = true;
        this.lastPointerX = ptr.x;
        this.lastPointerY = ptr.y;
      }
    });
    
    this.input.on('pointermove', ptr => {
      if (!this.isDragging) return;
      const dx = ptr.x - this.lastPointerX;
      const dy = ptr.y - this.lastPointerY;
      this.cameras.main.scrollX -= dx;
      this.cameras.main.scrollY -= dy;
      this.lastPointerX = ptr.x;
      this.lastPointerY = ptr.y;
    });
    
    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // zoom via wheel
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const currentZoom = this.cameras.main.zoom;
      const zoomChange = deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Phaser.Math.Clamp(currentZoom + zoomChange, 0.3, 3.0);
      this.cameras.main.setZoom(newZoom);
    });
  }

  update(time) {
    // end drag if pointer lifted outside move event
    if (this.isDragging && !this.input.activePointer.isDown) {
      this.isDragging = false;
    }

    // advance game logic once per tick interval
    if (time - this.lastTick > window.TICK_INTERVAL) {
      this.lastTick = time;
      this.tickCount++;

      // have each CPU tick
      players.forEach(p => p.tick());

      // update UI scene
      const ui = this.scene.get('UIScene');
      if (ui) {
        ui.updateTick(this.tickCount);
        ui.updateResources();
      }

      // update build‐progress bars
      for (let i = buildProgressBars.length - 1; i >= 0; i--) {
        const bar = buildProgressBars[i];
        bar.progress = bar.building.ticksBuild / bar.building.buildTime;
        if (bar.building.completed) {
          bar.graphics?.destroy();
          buildProgressBars.splice(i, 1);
          continue;
        }
        if (!bar.graphics) {
          bar.graphics = this.add
            .graphics()
            .setScrollFactor(1)
            .setDepth(4);
        }
        bar.graphics.clear().fillStyle(0xffffff, 0.5);
        const size = bar.building.footprint * window.TILE_SIZE;
        const bx = bar.building.coords[0] * window.TILE_SIZE;
        const by = bar.building.coords[1] * window.TILE_SIZE;
        const progH = size * bar.progress;
        bar.graphics.fillRect(
          bx,
          by + size - progH,
          size,
          progH
        );
      }
    }
  }
}

window.MainScene = MainScene;
window.onload = () => {
  new Phaser.Game(window.GAME_CONFIG);
};