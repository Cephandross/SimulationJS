// src/buildings/Founding.js

class TownCenter extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'TownCenter',
      category: 'Founding',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:200, stone:100 },
      hitpoints: 500,
      buildTime: 8,
      footprint: 1
    });
  }
}
window.TownCenter = TownCenter;

class Village extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Village',
      category: 'Founding',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:300, stone:200 },
      hitpoints: 750,
      buildTime: 10
    });
  }
}
window.Village = Village;

class City extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'City',
      category: 'Founding',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:400, stone:300 },
      hitpoints: 1000,
      buildTime: 12
    });
  }
}
window.City = City;