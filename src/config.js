// src/config.js - Updated for hex tiles
// ——————————————————————————
// Global constants & sprite lists for HEX GRID
// ——————————————————————————

/** Where to load your .png files from (relative to index.html) */
const ASSET_PATH = 'assets/hex_tiles/';
// Updated config.js for realistic world generation

/** Updated hex tile configuration for 72x72 tiles */
const HEX_SIZE = 36;        // Radius (was 32)
const TILE_SIZE = 72;       // Overall tile size (was 64)
const GRID_SIZE = 400;      // Keep same for now
const TICK_INTERVAL = 500;  // ms

const INDIVIDUAL_IMAGES = [
  { key: '003Clear1', file: '003Clear1.png' },
  { key: '003Clear2', file: '003Clear2.png' },
  { key: '003Clear3', file: '003Clear3.png' },
  { key: '003Clear4', file: '003Clear4.png' },
  { key: '003Clear5', file: '003Clear5.png' },
  { key: 'Arid_Brush01', file: 'Arid_Brush01.png' },
  { key: 'Arid_Brush02', file: 'Arid_Brush02.png' },
  { key: 'Arid_Brush03', file: 'Arid_Brush03.png' },
  { key: 'Arid_Brush04', file: 'Arid_Brush04.png' },
  { key: 'Arid_Brush05', file: 'Arid_Brush05.png' },
  { key: 'Arid_Cactus01', file: 'Arid_Cactus01.png' },
  { key: 'Arid_Cactus02', file: 'Arid_Cactus02.png' },
  { key: 'Arid_Cactus03', file: 'Arid_Cactus03.png' },
  { key: 'Arid_Cactus04', file: 'Arid_Cactus04.png' },
  { key: 'Arid_Cactus05', file: 'Arid_Cactus05.png' },
  { key: 'Arid_Clear01', file: 'Arid_Clear01.png' },
  { key: 'Arid_Clear02', file: 'Arid_Clear02.png' },
  { key: 'Arid_Clear03', file: 'Arid_Clear03.png' },
  { key: 'Arid_Clear04', file: 'Arid_Clear04.png' },
  { key: 'Arid_Clear05', file: 'Arid_Clear05.png' },
  { key: 'Arid_Hills01', file: 'Arid_Hills01.png' },
  { key: 'Arid_Hills02', file: 'Arid_Hills02.png' },
  { key: 'Arid_Hills03', file: 'Arid_Hills03.png' },
  { key: 'Arid_Hills04', file: 'Arid_Hills04.png' },
  { key: 'Arid_Hills05', file: 'Arid_Hills05.png' },
  { key: 'Arid_Rough01', file: 'Arid_Rough01.png' },
  { key: 'Arid_Rough02', file: 'Arid_Rough02.png' },
  { key: 'Arid_Rough03', file: 'Arid_Rough03.png' },
  { key: 'Arid_Rough04', file: 'Arid_Rough04.png' },
  { key: 'Arid_Rough05', file: 'Arid_Rough05.png' },
  { key: 'BoulderHills1', file: 'BoulderHills1.png' },
  { key: 'BoulderHills2', file: 'BoulderHills2.png' },
  { key: 'BoulderHills3', file: 'BoulderHills3.png' },
  { key: 'BoulderHills4', file: 'BoulderHills4.png' },
  { key: 'BoulderHills5', file: 'BoulderHills5.png' },
  { key: 'Brambles1', file: 'Brambles1.png' },
  { key: 'Brambles2', file: 'Brambles2.png' },
  { key: 'Brambles3', file: 'Brambles3.png' },
  { key: 'Brambles4', file: 'Brambles4.png' },
  { key: 'Brambles5', file: 'Brambles5.png' },
  { key: 'BrnHills01', file: 'BrnHills01.png' },
  { key: 'BrnHills02', file: 'BrnHills02.png' },
  { key: 'BrnHills03', file: 'BrnHills03.png' },
  { key: 'BrnHills04', file: 'BrnHills04.png' },
  { key: 'BrnHills05', file: 'BrnHills05.png' },
  { key: 'BrownHills1', file: 'BrownHills1.png' },
  { key: 'BrownHills2', file: 'BrownHills2.png' },
  { key: 'BrownHills3', file: 'BrownHills3.png' },
  { key: 'BrownHills4', file: 'BrownHills4.png' },
  { key: 'BrownHills5', file: 'BrownHills5.png' },
  { key: 'Brush1', file: 'Brush1.png' },
  { key: 'Brush2', file: 'Brush2.png' },
  { key: 'Brush3', file: 'Brush3.png' },
  { key: 'Brush4', file: 'Brush4.png' },
  { key: 'Brush5', file: 'Brush5.png' },
  { key: 'DarkWoods2_1', file: 'DarkWoods2_1.png' },
  { key: 'DarkWoods2_2', file: 'DarkWoods2_2.png' },
  { key: 'DarkWoods2_3', file: 'DarkWoods2_3.png' },
  { key: 'DarkWoods2_4', file: 'DarkWoods2_4.png' },
  { key: 'DarkWoods2_5', file: 'DarkWoods2_5.png' },
  { key: 'DarkWoods2_6', file: 'DarkWoods2_6.png' },
  { key: 'DarkWoods2_7', file: 'DarkWoods2_7.png' },
  { key: 'Desert1', file: 'Desert1.png' },
  { key: 'Desert2', file: 'Desert2.png' },
  { key: 'Desert3', file: 'Desert3.png' },
  { key: 'Desert4', file: 'Desert4.png' },
  { key: 'Desert5', file: 'Desert5.png' },
  { key: 'DesertScrub1', file: 'DesertScrub1.png' },
  { key: 'DesertScrub2', file: 'DesertScrub2.png' },
  { key: 'DesertScrub3', file: 'DesertScrub3.png' },
  { key: 'DesertScrub4', file: 'DesertScrub4.png' },
  { key: 'DesertScrub5', file: 'DesertScrub5.png' },
  { key: 'Grass1', file: 'Grass1.png' },
  { key: 'Grass2', file: 'Grass2.png' },
  { key: 'Grass3', file: 'Grass3.png' },
  { key: 'Grass4', file: 'Grass4.png' },
  { key: 'Grass5', file: 'Grass5.png' },
  { key: 'Hills1', file: 'Hills1.png' },
  { key: 'Hills2', file: 'Hills2.png' },
  { key: 'Hills3', file: 'Hills3.png' },
  { key: 'Hills4', file: 'Hills4.png' },
  { key: 'Hills5', file: 'Hills5.png' },
  { key: 'HillsGreen1', file: 'HillsGreen1.png' },
  { key: 'HillsGreen2', file: 'HillsGreen2.png' },
  { key: 'HillsGreen3', file: 'HillsGreen3.png' },
  { key: 'HillsGreen4', file: 'HillsGreen4.png' },
  { key: 'HillsGreen5', file: 'HillsGreen5.png' },
  { key: 'HillsIsland1', file: 'HillsIsland1.png' },
  { key: 'HillsIsland2', file: 'HillsIsland2.png' },
  { key: 'HillsIsland3', file: 'HillsIsland3.png' },
  { key: 'HillsIsland4', file: 'HillsIsland4.png' },
  { key: 'HillsIsland5', file: 'HillsIsland5.png' },
  { key: 'Ice1', file: 'Ice1.png' },
  { key: 'Ice2', file: 'Ice2.png' },
  { key: 'Ice3', file: 'Ice3.png' },
  { key: 'Ice4', file: 'Ice4.png' },
  { key: 'Ice5', file: 'Ice5.png' },
  { key: 'Jung2_1', file: 'Jung2_1.png' },
  { key: 'Jung2_2', file: 'Jung2_2.png' },
  { key: 'Jung2_3', file: 'Jung2_3.png' },
  { key: 'Jung2_4', file: 'Jung2_4.png' },
  { key: 'Jung2_5', file: 'Jung2_5.png' },
  { key: 'Jungle1', file: 'Jungle1.png' },
  { key: 'Jungle2', file: 'Jungle2.png' },
  { key: 'Jungle3', file: 'Jungle3.png' },
  { key: 'Jungle4', file: 'Jungle4.png' },
  { key: 'Jungle5', file: 'Jungle5.png' },
  { key: 'Lake1', file: 'Lake1.png' },
  { key: 'Lake2', file: 'Lake2.png' },
  { key: 'Lake3', file: 'Lake3.png' },
  { key: 'Lake4', file: 'Lake4.png' },
  { key: 'Lake5', file: 'Lake5.png' },
  { key: 'LightGrass1', file: 'LightGrass1.png' },
  { key: 'LightGrass2', file: 'LightGrass2.png' },
  { key: 'LightGrass3', file: 'LightGrass3.png' },
  { key: 'LightGrass4', file: 'LightGrass4.png' },
  { key: 'LightGrass5', file: 'LightGrass5.png' },
  { key: 'LowHills1', file: 'LowHills1.png' },
  { key: 'LowHills2', file: 'LowHills2.png' },
  { key: 'LowHills3', file: 'LowHills3.png' },
  { key: 'LowHills4', file: 'LowHills4.png' },
  { key: 'LowHills5', file: 'LowHills5.png' },
  { key: 'Mangrove1', file: 'Mangrove1.png' },
  { key: 'Mangrove2', file: 'Mangrove2.png' },
  { key: 'Mangrove3', file: 'Mangrove3.png' },
  { key: 'Mangrove4', file: 'Mangrove4.png' },
  { key: 'Mangrove5', file: 'Mangrove5.png' },
  { key: 'Marsh1', file: 'Marsh1.png' },
  { key: 'Marsh2', file: 'Marsh2.png' },
  { key: 'Marsh3', file: 'Marsh3.png' },
  { key: 'Marsh4', file: 'Marsh4.png' },
  { key: 'Marsh5', file: 'Marsh5.png' },
  { key: 'Mountains1', file: 'Mountains1.png' },
  { key: 'Mountains2', file: 'Mountains2.png' },
  { key: 'Mountains3', file: 'Mountains3.png' },
  { key: 'Mountains4', file: 'Mountains4.png' },
  { key: 'Mountains5', file: 'Mountains5.png' },
  { key: 'Mud1', file: 'Mud1.png' },
  { key: 'Mud2', file: 'Mud2.png' },
  { key: 'Mud3', file: 'Mud3.png' },
  { key: 'Mud4', file: 'Mud4.png' },
  { key: 'Mud5', file: 'Mud5.png' },
  { key: 'Ocean1', file: 'Ocean1.png' },
  { key: 'Ocean2', file: 'Ocean2.png' },
  { key: 'Ocean3', file: 'Ocean3.png' },
  { key: 'Ocean4', file: 'Ocean4.png' },
  { key: 'Ocean5', file: 'Ocean5.png' },
  { key: 'Orchards1', file: 'Orchards1.png' },
  { key: 'Orchards2', file: 'Orchards2.png' },
  { key: 'Orchards3', file: 'Orchards3.png' },
  { key: 'Orchards4', file: 'Orchards4.png' },
  { key: 'Orchards5', file: 'Orchards5.png' },
  { key: 'PineForest1', file: 'PineForest1.png' },
  { key: 'PineForest2', file: 'PineForest2.png' },
  { key: 'PineForest3', file: 'PineForest3.png' },
  { key: 'PineForest4', file: 'PineForest4.png' },
  { key: 'PineForest5', file: 'PineForest5.png' },
  { key: 'PointyHills1', file: 'PointyHills1.png' },
  { key: 'PointyHills2', file: 'PointyHills2.png' },
  { key: 'PointyHills3', file: 'PointyHills3.png' },
  { key: 'PointyHills4', file: 'PointyHills4.png' },
  { key: 'PointyHills5', file: 'PointyHills5.png' },
  { key: 'River1-3', file: 'River1-3.png' },
  { key: 'River1-4', file: 'River1-4.png' },
  { key: 'River1-5', file: 'River1-5.png' },
  { key: 'River2-4', file: 'River2-4.png' },
  { key: 'River2-5', file: 'River2-5.png' },
  { key: 'River3-6', file: 'River3-6.png' },
  { key: 'River4-6', file: 'River4-6.png' },
  { key: 'Rough1', file: 'Rough1.png' },
  { key: 'Rough2', file: 'Rough2.png' },
  { key: 'Rough3', file: 'Rough3.png' },
  { key: 'Rough4', file: 'Rough4.png' },
  { key: 'Rough5', file: 'Rough5.png' },
  { key: 'RoughIsland1', file: 'RoughIsland1.png' },
  { key: 'RoughIsland2', file: 'RoughIsland2.png' },
  { key: 'RoughIsland3', file: 'RoughIsland3.png' },
  { key: 'RoughIsland4', file: 'RoughIsland4.png' },
  { key: 'RoughIsland5', file: 'RoughIsland5.png' },
  { key: 'SaltBush1', file: 'SaltBush1.png' },
  { key: 'SaltBush2', file: 'SaltBush2.png' },
  { key: 'SaltBush3', file: 'SaltBush3.png' },
  { key: 'SaltBush4', file: 'SaltBush4.png' },
  { key: 'SaltBush5', file: 'SaltBush5.png' },
  { key: 'SciFiA1', file: 'SciFiA1.png' },
  { key: 'SciFiA2', file: 'SciFiA2.png' },
  { key: 'SciFiA3', file: 'SciFiA3.png' },
  { key: 'SciFiA4', file: 'SciFiA4.png' },
  { key: 'SciFiA5', file: 'SciFiA5.png' },
  { key: 'SciFiB1', file: 'SciFiB1.png' },
  { key: 'SciFiB2', file: 'SciFiB2.png' },
  { key: 'SciFiB3', file: 'SciFiB3.png' },
  { key: 'SciFiB4', file: 'SciFiB4.png' },
  { key: 'SciFiB5', file: 'SciFiB5.png' },
  { key: 'ScrubbyWoods01', file: 'ScrubbyWoods01.png' },
  { key: 'ScrubbyWoods02', file: 'ScrubbyWoods02.png' },
  { key: 'ScrubbyWoods03', file: 'ScrubbyWoods03.png' },
  { key: 'ScrubbyWoods04', file: 'ScrubbyWoods04.png' },
  { key: 'ScrubbyWoods05', file: 'ScrubbyWoods05.png' },
  { key: 'Snow1', file: 'Snow1.png' },
  { key: 'Snow2', file: 'Snow2.png' },
  { key: 'Snow2_1', file: 'Snow2_1.png' },
  { key: 'Snow2_2', file: 'Snow2_2.png' },
  { key: 'Snow2_3', file: 'Snow2_3.png' },
  { key: 'Snow2_4', file: 'Snow2_4.png' },
  { key: 'Snow2_5', file: 'Snow2_5.png' },
  { key: 'Snow3', file: 'Snow3.png' },
  { key: 'Snow4', file: 'Snow4.png' },
  { key: 'Snow5', file: 'Snow5.png' },
  { key: 'SnowLandClear01', file: 'SnowLandClear01.png' },
  { key: 'SnowLandClear02', file: 'SnowLandClear02.png' },
  { key: 'SnowLandClear03', file: 'SnowLandClear03.png' },
  { key: 'SnowLandClear04', file: 'SnowLandClear04.png' },
  { key: 'SnowLandClear05', file: 'SnowLandClear05.png' },
  { key: 'SnowLandTrees01', file: 'SnowLandTrees01.png' },
  { key: 'SnowLandTrees02', file: 'SnowLandTrees02.png' },
  { key: 'SnowLandTrees03', file: 'SnowLandTrees03.png' },
  { key: 'SnowLandTrees04', file: 'SnowLandTrees04.png' },
  { key: 'SnowLandTrees05', file: 'SnowLandTrees05.png' },
  { key: 'SnowMount1', file: 'SnowMount1.png' },
  { key: 'SnowMount2', file: 'SnowMount2.png' },
  { key: 'SnowMount3', file: 'SnowMount3.png' },
  { key: 'SnowMount4', file: 'SnowMount4.png' },
  { key: 'SnowMount5', file: 'SnowMount5.png' },
  { key: 'Swamp1', file: 'Swamp1.png' },
  { key: 'Swamp2', file: 'Swamp2.png' },
  { key: 'Swamp3', file: 'Swamp3.png' },
  { key: 'Swamp4', file: 'Swamp4.png' },
  { key: 'Swamp5', file: 'Swamp5.png' },
  { key: 'SymSwamp1', file: 'SymSwamp1.png' },
  { key: 'SymSwamp2', file: 'SymSwamp2.png' },
  { key: 'SymSwamp3', file: 'SymSwamp3.png' },
  { key: 'SymSwamp4', file: 'SymSwamp4.png' },
  { key: 'SymSwamp5', file: 'SymSwamp5.png' },
  { key: 'SymWoods1', file: 'SymWoods1.png' },
  { key: 'SymWoods2', file: 'SymWoods2.png' },
  { key: 'SymWoods3', file: 'SymWoods3.png' },
  { key: 'SymWoods4', file: 'SymWoods4.png' },
  { key: 'SymWoods5', file: 'SymWoods5.png' },
  { key: 'Water1', file: 'Water1.png' },
  { key: 'Water2', file: 'Water2.png' },
  { key: 'Water3', file: 'Water3.png' },
  { key: 'Water4', file: 'Water4.png' },
  { key: 'Water5', file: 'Water5.png' },
  { key: 'Woods1', file: 'Woods1.png' },
  { key: 'Woods2', file: 'Woods2.png' },
  { key: 'Woods2_1', file: 'Woods2_1.png' },
  { key: 'Woods2_2', file: 'Woods2_2.png' },
  { key: 'Woods2_3', file: 'Woods2_3.png' },
  { key: 'Woods2_4', file: 'Woods2_4.png' },
  { key: 'Woods2_5', file: 'Woods2_5.png' },
  { key: 'Woods3', file: 'Woods3.png' },
  { key: 'Woods3_1', file: 'Woods3_1.png' },
  { key: 'Woods3_2', file: 'Woods3_2.png' },
  { key: 'Woods3_3', file: 'Woods3_3.png' },
  { key: 'Woods3_4', file: 'Woods3_4.png' },
  { key: 'Woods3_5', file: 'Woods3_5.png' },
  { key: 'Woods4', file: 'Woods4.png' },
  { key: 'Woods4_1', file: 'Woods4_1.png' },
  { key: 'Woods4_2', file: 'Woods4_2.png' },
  { key: 'Woods4_3', file: 'Woods4_3.png' },
  { key: 'Woods4_4', file: 'Woods4_4.png' },
  { key: 'Woods4_5', file: 'Woods4_5.png' },
  { key: 'Woods5', file: 'Woods5.png' },
  { key: 'WoodsDark1', file: 'WoodsDark1.png' },
  { key: 'WoodsDark2', file: 'WoodsDark2.png' },
  { key: 'WoodsDark3', file: 'WoodsDark3.png' },
  { key: 'WoodsDark4', file: 'WoodsDark4.png' },
  { key: 'WoodsDark5', file: 'WoodsDark5.png' },
  { key: 'WoodsIsland1', file: 'WoodsIsland1.png' },
  { key: 'WoodsIsland2', file: 'WoodsIsland2.png' },
  { key: 'WoodsIsland3', file: 'WoodsIsland3.png' },
  { key: 'WoodsIsland4', file: 'WoodsIsland4.png' },
  { key: 'WoodsIsland5', file: 'WoodsIsland5.png' }
];

// Updated BIOME_ASSETS to match your actual files
const BIOME_ASSETS = {
  // Water features
  ocean: ['Ocean1', 'Ocean2', 'Ocean3', 'Ocean4', 'Ocean5'],
  lake: ['Lake1', 'Lake2', 'Lake3', 'Lake4', 'Lake5'],
  river: ['Water1', 'Water2', 'Water3', 'Water4', 'Water5'],
  
  // Mountains and hills
  mountain: ['Mountains1', 'Mountains2', 'Mountains3', 'Mountains4', 'Mountains5'],
  snow_mountain: ['SnowMount1', 'SnowMount2', 'SnowMount3', 'SnowMount4', 'SnowMount5'],
  hills: ['Hills1', 'Hills2', 'Hills3', 'Hills4', 'Hills5'],
  
  // Forests
  forest: ['Woods1', 'Woods2', 'Woods3', 'Woods4', 'Woods5'],
  pine_forest: ['PineForest1', 'PineForest2', 'PineForest3', 'PineForest4', 'PineForest5'],
  dark_forest: ['DarkWoods2_1', 'DarkWoods2_2', 'DarkWoods2_3', 'DarkWoods2_4', 'DarkWoods2_5'],
  jungle: ['Jungle1', 'Jungle2', 'Jungle3', 'Jungle4', 'Jungle5'],
  
  // Grasslands
  grass: ['Grass1', 'Grass2', 'Grass3', 'Grass4', 'Grass5'],
  light_grass: ['LightGrass1', 'LightGrass2', 'LightGrass3', 'LightGrass4', 'LightGrass5'],
  rough: ['Rough1', 'Rough2', 'Rough3', 'Rough4', 'Rough5'],
  
  // Arid/Desert
  desert: ['Desert1', 'Desert2', 'Desert3', 'Desert4', 'Desert5'],

  
  // Wetlands
  swamp: ['Swamp1', 'Swamp2', 'Swamp3', 'Swamp4', 'Swamp5'],
  marsh: ['Marsh1', 'Marsh2', 'Marsh3', 'Marsh4', 'Marsh5'],
  
  // Arctic
  snow: ['Snow1', 'Snow2', 'Snow3', 'Snow4', 'Snow5'],
  snow_forest: ['Snow1', 'Snow2', 'Snow3', 'Snow4', 'Snow5'],
};

/** Sprite sheets (monsters) */
const SPRITE_SHEETS = [
  {
    key: 'monsters_sheet',
    file: 'monsters.png',
    frameWidth: 32,
    frameHeight: 32
  }
];

// ... rest of config (hex functions, etc.)

/** Hex coordinate system helpers */
const HEX_DIRECTIONS = [
  [+1, 0], [+1, -1], [0, -1],
  [-1, 0], [-1, +1], [0, +1]
];

/** Convert hex coordinates to pixel position */
function hexToPixel(q, r) {
  // Flat-top hexagon layout (might fix the edge issue)
  const x = HEX_SIZE * (3/2 * q);
  const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return [x, y];
}

/** Convert pixel position to hex coordinates */
function pixelToHex(x, y) {
  const q = (2/3 * x) / HEX_SIZE;
  const r = (-1/3 * x + Math.sqrt(3)/3 * y) / HEX_SIZE;
  return hexRound(q, r);
}

/** Round fractional hex coordinates to nearest hex */
function hexRound(q, r) {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  
  return [rq, rr];
}

/** Get hex neighbors */
function hexNeighbors(q, r) {
  return HEX_DIRECTIONS.map(([dq, dr]) => [q + dq, r + dr]);
}

// Simulation state
let tickCounter = 0;
let lastTick = 0;
let tiles = [];

// Game config
const GAME_CONFIG = {
  type: Phaser.AUTO,
  backgroundColor: '#2c3e50',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1600,
    height: 800
  },
  scene: [window.MainScene, window.UIScene]
};

// Expose globals
window.GAME_CONFIG = GAME_CONFIG;