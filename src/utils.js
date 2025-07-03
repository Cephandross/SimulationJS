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
  

// at top or bottom of src/utils.js
window.hexifyImage = function(src) {
  return new Promise((resolve, reject) => {
    const SIZE = 64, r = SIZE/2, h = Math.sqrt(3)/2 * r;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = SIZE;
      const ctx = canvas.getContext('2d');

      ctx.beginPath();
      ctx.moveTo(r+r, r);
      ctx.lineTo(r+r/2, r+h);
      ctx.lineTo(r-r/2, r+h);
      ctx.lineTo(r-r,   r);
      ctx.lineTo(r-r/2, r-h);
      ctx.lineTo(r+r/2, r-h);
      ctx.closePath();
      ctx.save();
      ctx.clip();

      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      ctx.restore();
      resolve(canvas);
    };
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
};

