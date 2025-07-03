// src/config.js
// ——————————————————————————
// Global constants & asset lists
// ——————————————————————————

// where to find your PNGs (relative to index.html)
window.ASSET_PATH = 'assets/';

// 64×64 hex‐ground tiles (loaded as individual images)
window.HEX_TILES = [
  'DeadGrassBland1','DeadGrassBland2',
  'DeadGrassPointLeft','DeadGrassPointRight',
  'DeepWater1','DeepWater2',
  'ShallowWater1','ShallowWater2',
  'Grass1','Grass2',
  'GrassPointLeft','GrassPointRight',
  'Sand1','Sand2',
  'Wheatfield1','Wheatfield2','Wheatfield3','Wheatfield4' 
];

// pair each “PointLeft” with its matching “PointRight”
window.POINT_MAP = {
  DeadGrassPointLeft: 'DeadGrassPointRight',
  GrassPointLeft:     'GrassPointRight'
};

// all other 16×16 sheets (units, buildings, UI, etc.)
window.SPRITE_SHEETS = [
  { key:'PineTrees',      file:'PineTrees.png',      width:16, height:16 },
  { key:'Rocks',          file:'Rocks.png',          width:16, height:16 },
  { key:'Trees',          file:'Trees.png',          width:16, height:16 },
  { key:'Wheatfield',     file:'Wheatfield.png',     width:16, height:16 },
  { key:'DeadGrass',      file:'DeadGrass.png',      width:16, height:16 },
  { key:'Grass',          file:'Grass.png',          width:16, height:16 },
  { key:'Shore',          file:'Shore.png',          width:16, height:16 },
  { key:'TexturedGrass',  file:'TexturedGrass.png',  width:16, height:16 },
  { key:'Barracks',       file:'Barracks.png',       width:16, height:16 },
  { key:'CaveV2',         file:'CaveV2.png',         width:16, height:16 },
  { key:'Chapels',        file:'Chapels.png',        width:16, height:16 },
  { key:'Houses',         file:'Houses.png',         width:16, height:16 },
  { key:'Huts',           file:'Huts.png',           width:16, height:16 },
  { key:'Keep',           file:'Keep.png',           width:32, height:32 },
  { key:'Market',         file:'Market.png',         width:16, height:16 },
  { key:'Resources',      file:'Resources.png',      width:16, height:16 },
  { key:'Taverns',        file:'Taverns.png',        width:16, height:16 },
  { key:'Workshops',      file:'Workshops.png',      width:16, height:16 },
  { key:'Chicken',        file:'Chicken.png',        width:16, height:16 },
  { key:'Sheep',          file:'Sheep.png',          width:16, height:16 },
  { key:'trimmed_compact_sheet', file:'trimmed_compact_sheet.png', width:16, height:16 },
  { key:'UnitSheet1',     file:'UnitSheet1.png',     width:16, height:16 }
];

// tile & world dimensions
window.TILE_SIZE     = 64;
window.GRID_SIZE     = 100;
window.TICK_INTERVAL = 2000; // ms

// Phaser game config
window.GAME_CONFIG = {
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1600,
    height: 800
  },
  scene: [ window.MainScene, window.UIScene ]
};
