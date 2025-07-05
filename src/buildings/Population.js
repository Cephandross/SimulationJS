// src/buildings/Population.js

class House extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'House',
      category: 'Population',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:50, stone:20 },
      hitpoints: 100,
      buildTime: 4
    });
  }
}
window.House = House;

class LogCabin extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'LogCabin',
      category: 'Population',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:100, stone:50 },
      hitpoints: 150,
      buildTime: 6
    });
  }
}
window.LogCabin = LogCabin;