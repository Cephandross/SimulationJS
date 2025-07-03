// src/buildings/Founding.js

class TownCenter extends Building {
  constructor(coords) {
    super({
      type: 'TownCenter',
      category: 'Founding',
      coords,
      costs:     { wood:200, stone:100 },
      hitpoints: 500,
      buildTime:  8,
      footprint: 2
    });
    
  }
}
window.TownCenter = TownCenter;

class Village extends Building {
  constructor(coords) {
    super({
      type: 'Village',
      category: 'Founding',
      coords,
      costs:     { wood:300, stone:200 },
      hitpoints: 750,
      buildTime: 10
    });
   
  }
}
window.Village = Village;

class City extends Building {
  constructor(coords) {
    super({
      type: 'City',
      category: 'Founding',
      coords,
      costs:     { wood:400, stone:300 },
      hitpoints:1000,
      buildTime: 12
    });
    
  }
}
window.City = City;
