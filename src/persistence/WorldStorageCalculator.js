// World Storage Size Calculator
// Calculates exact storage requirements for full world saves

class WorldStorageCalculator {
  static calculateWorldSize(radius = 125) {
    // Your current world: radius 125 = ~47,000 tiles
    const hexCount = this.calculateHexCount(radius);
    
    // Per-tile storage (optimized format)
    const bytesPerTile = {
      coordinates: 8,        // q, r as 32-bit integers
      biome: 1,             // biome ID as byte
      oreType: 1,           // ore type ID as byte (0 = none)
      elevation: 2,         // elevation as 16-bit float
      temperature: 1,       // temperature as byte (0-255)
      moisture: 1           // moisture as byte (0-255)
    };
    
    const totalBytesPerTile = Object.values(bytesPerTile).reduce((a, b) => a + b, 0);
    
    // Core world data
    const worldDataSize = hexCount * totalBytesPerTile;
    
    // Additional world features
    const riverData = 5000 * 8;        // 5000 river segments * 8 bytes each
    const oreDeposits = 100 * 12;      // 100 ore deposits * 12 bytes each
    const metadata = 1000;             // World generation metadata
    
    // Game state (entities)
    const maxBuildings = 500;          // Reasonable max buildings
    const maxUnits = 1000;             // Reasonable max units
    const buildingSize = 50;           // bytes per building
    const unitSize = 40;               // bytes per unit
    
    const entityDataSize = (maxBuildings * buildingSize) + (maxUnits * unitSize);
    
    // Total calculation
    const totalBytes = worldDataSize + riverData + oreDeposits + metadata + entityDataSize;
    const totalMB = totalBytes / (1024 * 1024);
    
    return {
      hexCount,
      worldDataSize,
      entityDataSize,
      totalBytes,
      totalMB: totalMB.toFixed(2),
      breakdown: {
        tiles: `${(worldDataSize / (1024 * 1024)).toFixed(2)}MB`,
        rivers: `${(riverData / 1024).toFixed(1)}KB`,
        ores: `${(oreDeposits / 1024).toFixed(1)}KB`,
        entities: `${(entityDataSize / 1024).toFixed(1)}KB`,
        metadata: `${(metadata / 1024).toFixed(1)}KB`
      }
    };
  }
  
  static calculateHexCount(radius) {
    // Formula for hex grid: 3 * radius^2 + 3 * radius + 1
    return 3 * radius * radius + 3 * radius + 1;
  }
  
  static calculateCompressionSavings() {
    // Biome compression: most tiles are ocean/grass
    const biomeCompression = 0.3;      // 70% reduction via RLE
    
    // Coordinate compression: sequential hex coordinates
    const coordCompression = 0.2;      // 80% reduction via delta encoding
    
    // Overall compression estimate
    const overallCompression = 0.4;    // 60% reduction total
    
    return {
      biomeCompression,
      coordCompression,
      overallCompression
    };
  }
}

// Calculate current world size
const worldSize = WorldStorageCalculator.calculateWorldSize(125);
const compression = WorldStorageCalculator.calculateCompressionSavings();

console.log('🌍 Full World Save Analysis:');
console.log(`Hex count: ${worldSize.hexCount.toLocaleString()}`);
console.log(`Raw size: ${worldSize.totalMB}MB`);
console.log(`Compressed size: ${(worldSize.totalMB * compression.overallCompression).toFixed(2)}MB`);
console.log('Breakdown:', worldSize.breakdown);