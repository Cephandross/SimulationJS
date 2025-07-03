// src/buildings/Population.js

class House extends Building {
  constructor(coords) {
    super({
      type: 'House',
      category: 'Population',
      coords,
      costs:     { wood:50, stone:20 },
      hitpoints: 100,
      buildTime:  4
    });
   
  }
}
window.House = House;

class LogCabin extends Building {
  constructor(coords) {
    super({
      type: 'LogCabin',
      category: 'Population',
      coords,
      costs:     { wood:100, stone:50 },
      hitpoints: 150,
      buildTime:  6
    });
   
  }
}
window.LogCabin = LogCabin;
