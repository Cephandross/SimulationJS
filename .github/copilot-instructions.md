# SimulationJS - Hex-Based Strategy Game

SimulationJS is a browser-based hex grid strategy simulation game built with Phaser.js. The game features a comprehensive battle system, hex tile map generation, unit management, building placement, and resource management.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Dependencies
- **Node.js Setup**: `node --version` (requires v14+, tested with v20.19.4)
- **Install dependencies**: `npm install --include=optional` -- takes 10-30 seconds. NEVER CANCEL.
- **Sharp dependency fix**: If hexify fails with sharp errors, run: `npm install sharp --include=optional`

### Asset Processing
- **Process hex tiles**: `npm run hexify` -- takes 0.21 seconds. Creates 297 hex tiles from source PNG files. NEVER CANCEL.
- **Alternative**: `node hexify-sharp.js` (same result, same timing)
- **Asset verification**: `find assets/hex_tiles -name "*.png" | wc -l` should return exactly 297
- **Processing speed**: Very fast (~0.2s), no timeout needed

### Running the Application
- **Start local server**: `python3 -m http.server 8080` or any HTTP server on port 8080. NEVER CANCEL.
- **Access main game**: http://localhost:8080/
- **Battle system tests**: http://localhost:8080/test_battle_system.html

### CDN Dependencies Issue
- **CRITICAL**: External CDN dependencies (Phaser.js, SimplexNoise) may be blocked in some environments
- **Main app failure**: If console shows "Phaser is not defined", CDN access is blocked
- **Workaround needed**: Download dependencies to `lib/` directory and update index.html script paths
- **Download commands** (if internet access available):
  ```bash
  mkdir -p lib
  wget -O lib/phaser.js "https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.js"
  wget -O lib/simplex-noise.min.js "https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/simplex-noise.min.js"
  ```

## Validation

### Battle System Validation (Always Works)
- **Test URL**: http://localhost:8080/test_battle_system.html
- **Expected result**: All 9 tests pass (✅ green checkmarks) - see screenshot for reference
- **Test coverage**: BattleData, BattleResolver, BattleManager, BattleInterface classes
- **Validation time**: 2-3 seconds
- **Success indicators**: 
  - "🎯 Battle System Test Complete" heading
  - "All battle system components are properly loaded and functional for AdminPanel testing"
  - No red ❌ failure indicators

### Main Application Validation (CDN Dependent)
- **Test URL**: http://localhost:8080/
- **Success indicators**: Game canvas loads, no "Phaser is not defined" errors
- **Failure indicators**: Console errors about blocked CDN resources
- **Manual testing**: Click and drag to pan map, use admin panel (if accessible)

### Asset Processing Validation
- **Command**: `npm run hexify && find assets/hex_tiles -name "*.png" | wc -l`
- **Expected output**: 297 PNG files
- **Time**: Under 1 second

## Project Structure

### Repository Root
```
├── .github/                 # GitHub configuration
├── assets/hex_tiles/        # 297 processed hex tile images
├── lib/                     # Local dependencies (if CDN blocked)
├── node_modules/            # npm dependencies (gitignored)
├── src/                     # Source code
│   ├── battle/              # Battle system (4 files)
│   ├── buildings/           # Building types and logic
│   ├── ui/                  # UI components and panels
│   ├── units/               # Unit types and logic
│   ├── persistence/         # Save/load functionality
│   ├── main.js              # Main game scene
│   ├── config.js            # Game constants and asset lists
│   └── utils.js             # Utility functions
├── index.html               # Main entry point
├── hexify-sharp.js          # Asset processing script
├── package.json             # npm configuration
└── test_battle_system.html  # Battle system test suite
```

### Key Files and Their Purpose
- **index.html**: Main entry point with dependency loading order
- **src/main.js**: Phaser main scene with game initialization
- **src/config.js**: Game constants, hex grid settings, asset definitions
- **src/battle/**: Complete battle system (BattleData, BattleManager, BattleResolver, BattleInterface)
- **hexify-sharp.js**: Converts square PNG assets to hexagonal tiles
- **test_battle_system.html**: Comprehensive test suite for battle system

## Common Commands

### npm Scripts
```bash
npm run test     # Fails with "Error: no test specified" (expected)
npm run hexify   # Processes assets (~0.2s)
```

### Development Workflow
```bash
# 1. Install dependencies
npm install --include=optional

# 2. Process assets
npm run hexify

# 3. Start server
python3 -m http.server 8080

# 4. Test battle system
# Open: http://localhost:8080/test_battle_system.html

# 5. Test main app (CDN dependent)
# Open: http://localhost:8080/
```

### Asset Information
- **Source images**: Various terrain/unit PNG files
- **Processed tiles**: 297 hexagonal PNG files (64x64 pixels)
- **Processing time**: ~0.2 seconds
- **Dependencies**: Sharp library for image processing

## Dependencies

### Runtime Dependencies
- **Phaser.js v3.60.0**: Game engine (loaded from CDN or lib/)
- **SimplexNoise v2.4.0**: Noise generation (loaded from CDN or lib/)

### Build Dependencies
- **Node.js v14+**: JavaScript runtime
- **Sharp**: Image processing library for hexify script
- **npm**: Package manager

### Dependency Issues
- **CDN blocking**: External CDN access may be blocked, preventing main app from loading
- **Sharp platform**: Sharp may need platform-specific installation
- **Fix command**: `npm install sharp --include=optional`

## Known Issues and Limitations

### CDN Dependencies
- **Issue**: Phaser.js and SimplexNoise loaded from CDN may be blocked
- **Impact**: Main application fails to load ("Phaser is not defined")
- **Solution**: Download dependencies to lib/ and update script paths in index.html
- **Battle system**: Works independently, not affected by CDN issues

### No Build Process
- **Status**: Pure HTML/JS application with no build step required
- **Processing**: Only asset processing via hexify script
- **Deployment**: Serve static files via any HTTP server

### Testing Limitations
- **Unit tests**: Not implemented (npm test fails by design)
- **Manual testing**: Battle system has comprehensive test suite
- **Integration testing**: Requires manual validation via browser

## Development Notes

### Battle System
- **Status**: Fully functional and well-tested
- **Files**: 4 core files in src/battle/ directory
- **Testing**: Comprehensive test suite with 9 test cases
- **Integration**: Works with main game via AdminPanel

### Asset Pipeline
- **Purpose**: Converts square PNG images to hexagonal tiles
- **Speed**: Very fast (~0.2s for 297 images)
- **Requirements**: Sharp library, source PNG files
- **Output**: Hex-shaped PNG tiles in assets/hex_tiles/

### Game Architecture
- **Engine**: Phaser.js 3.60.0
- **Map**: Hex grid system with custom tile loading
- **UI**: Modal-based interface with admin panel
- **State**: In-memory with persistence system available

## Troubleshooting

### "Phaser is not defined" Error
- **Cause**: CDN dependencies blocked
- **Solution**: Download Phaser.js and SimplexNoise to lib/ directory
- **Update**: Change script src paths in index.html from CDN to local files

### Sharp Installation Issues
- **Error**: "Could not load the sharp module"
- **Solution**: `npm install sharp --include=optional`
- **Platform**: May need platform-specific Sharp binaries

### Assets Not Loading
- **Check**: Verify hex tiles exist: `find assets/hex_tiles -name "*.png" | wc -l`
- **Regenerate**: Run `npm run hexify` to reprocess assets
- **Time**: Asset processing is very fast (~0.2s)

### Battle System Issues
- **Test**: Always run http://localhost:8080/test_battle_system.html first
- **Expected**: All 9 tests should pass
- **Debug**: Check browser console for detailed error messages

## Performance Expectations

### Command Timing (NEVER CANCEL)
- **npm install**: 10-30 seconds depending on network/platform. NEVER CANCEL.
- **npm run hexify**: 0.21 seconds (297 images processed) - very fast, no timeout needed
- **Battle system tests**: 2-3 seconds for all 9 tests
- **Server startup**: Immediate (python3 -m http.server)
- **node hexify-sharp.js**: 0.21 seconds (same as npm run hexify)

### Resource Usage
- **Memory**: Battle system test uses minimal memory
- **Storage**: 297 hex tiles (~4MB total)
- **Processing**: Asset processing is CPU-light and very fast

## Comprehensive Validation Workflow

### Complete Setup and Test Sequence
```bash
# 1. Verify environment
node --version  # Should be v14+ (tested with v20.19.4)

# 2. Install dependencies  
npm install --include=optional  # 10-30 seconds, NEVER CANCEL

# 3. Process assets
npm run hexify  # 0.21 seconds - very fast

# 4. Verify assets
find assets/hex_tiles -name "*.png" | wc -l  # Should return 297

# 5. Start server
python3 -m http.server 8080 &  # Runs in background

# 6. Test battle system (primary validation)
# Open: http://localhost:8080/test_battle_system.html
# Expected: All 9 tests pass with green checkmarks

# 7. Test main app (CDN dependent)
# Open: http://localhost:8080/
# Expected: May fail with "Phaser is not defined" if CDN blocked
```

### Expected Output Examples

#### Successful npm run hexify:
```
> simulationjs@1.0.0 hexify
> node hexify-sharp.js

real    0m0.21s
user    0m0.20s
sys     0m0.04s
```

#### Successful battle system test:
- Page loads with "🗡️ Battle System Test" heading
- All 9 test sections show green ✅ checkmarks
- Final message: "🎯 Battle System Test Complete"
- Console shows no error messages

#### CDN dependency issue (main app):
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
ReferenceError: Phaser is not defined
```

Always validate functionality using the battle system test suite before making changes to core game logic.