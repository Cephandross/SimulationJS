// src/buildings/Crafting.js

class Smelter extends Building {
  constructor(coords) {
    super({
      type: 'Smelter',
      category: 'Crafting',
      coords,
      costs:     { wood:50, stone:30 },
      hitpoints: 100,
      buildTime:  5
    });
    
  }
}
window.Smelter = Smelter;

class Bakery extends Building {
  constructor(coords) {
    super({
      type: 'Bakery',
      category: 'Crafting',
      coords,
      costs:     { wood:20 },
      hitpoints:  80,
      buildTime:  4
    });
   
  }
}
window.Bakery = Bakery;

class Blacksmith extends Building {
  constructor(coords) {
    super({
      type: 'Blacksmith',
      category: 'Crafting',
      coords,
      costs:     { wood:20, iron:10 },
      hitpoints:  80,
      buildTime:  4
    });
   
  }
}
window.Blacksmith = Blacksmith;
