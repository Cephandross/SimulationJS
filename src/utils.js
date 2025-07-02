// Helper functions (globals)

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  function make2DArray(width, height, factory) {
    const a = [];
    for (let y = 0; y < height; y++) {
      a[y] = [];
      for (let x = 0; x < width; x++) {
        a[y][x] = factory(x, y);
      }
    }
    return a;
  }
  
  function randomBiome() {
    const n = Math.random();
    if (n < 0.2) return 'water';
    if (n < 0.5) return 'grass';
    if (n < 0.8) return 'plains';
    if (n < 0.85) return 'mountain';
    if (n < 0.9) return 'silver';
    return 'gold';
  }
  
  function getFrameIndices(scene, key) {
    return scene.textures
      .get(key)
      .getFrameNames()
      .filter(f => f !== '__BASE')
      .map(f => parseInt(f, 10));
  }
  
  function togglePanel() {
    panelVisible = !panelVisible;
    statusPanel.setVisible(panelVisible);
  }
  