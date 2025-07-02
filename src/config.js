// src/config.js
// ——————————————————————————
// Global constants & sprite lists
// ——————————————————————————

/** Where to load your .png files from (relative to index.html) */
const ASSET_PATH = 'assets/';

/** Every sheet you want Phaser to load */
const SPRITE_SHEETS = [
  { key:'PineTrees',         file:'PineTrees.png',          width:16, height:16 },
  { key:'Rocks',             file:'Rocks.png',              width:16, height:16 },
  { key:'Trees',             file:'Trees.png',              width:16, height:16 },
  { key:'Wheatfield',        file:'Wheatfield.png',         width:16, height:16 },
  { key:'DeadGrass',         file:'DeadGrass.png',          width:16, height:16 },
  { key:'Grass',             file:'Grass.png',              width:16, height:16 },
  { key:'Shore',             file:'Shore.png',              width:16, height:16 },
  { key:'TexturedGrass',     file:'TexturedGrass.png',      width:16, height:16 },
  { key:'Barracks',          file:'Barracks.png',           width:16, height:16 },
  { key:'CaveV2',            file:'CaveV2.png',             width:16, height:16 },
  { key:'Chapels',           file:'Chapels.png',            width:16, height:16 },
  { key:'Houses',            file:'Houses.png',             width:16, height:16 },
  { key:'Huts',              file:'Huts.png',               width:16, height:16 },
  { key:'Keep',              file:'Keep.png',               width:32, height:32 },
  { key:'Market',            file:'Market.png',             width:16, height:16 },
  { key:'Resources',         file:'Resources.png',          width:16, height:16 },
  { key:'Taverns',           file:'Taverns.png',            width:16, height:16 },
  { key:'Workshops',         file:'Workshops.png',          width:16, height:16 },
  { key:'Chicken',           file:'Chicken.png',            width:16, height:16 },
  { key:'Sheep',             file:'Sheep.png',              width:16, height:16 },
  { key:'trimmed_compact_sheet', file:'trimmed_compact_sheet.png', width:16, height:16 },
  { key:'UnitSheet1',        file:'UnitSheet1.png',         width:16, height:16 }
];

/** Biome → which sheet key to use */
const BIOME_ASSETS = {
  water:    'Shore',
  grass:    'Grass',
  plains:   'TexturedGrass',
  mountain: 'trimmed_compact_sheet',
  silver:   'trimmed_compact_sheet',
  gold:     'trimmed_compact_sheet'
};

/** World dimensions & timing */
const TILE_SIZE     = 16;
const GRID_SIZE     = 400;
const TICK_INTERVAL = 500; // ms

/** Simulation state */
let tickCounter = 0;
let lastTick    = 0;
let tiles       = [];       // will hold {biome, sprite} per tile
// src/config.js
const GAME_CONFIG = {
    type: Phaser.AUTO,
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1600,
      height: 800
    },
    // run both scenes:
    scene: [ window.MainScene, window.UIScene ]
  };
  
  // expose it:
  window.GAME_CONFIG = GAME_CONFIG;
  