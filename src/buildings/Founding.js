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
    this.spriteKey   = 'Keep';
    this.spriteFrame = 0;   // base
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
    this.spriteKey   = 'Keep';
    this.spriteFrame = 1;   // upgrade level 1
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
    this.spriteKey   = 'Keep';
    this.spriteFrame = 2;   // upgrade level 2
  }
}
window.City = City;
