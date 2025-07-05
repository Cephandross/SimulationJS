// src/buildings/Crafting.js

class Smelter extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Smelter',
      category: 'Crafting',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:50, stone:30 },
      hitpoints: 100,
      buildTime: 5
    });
  }
}
window.Smelter = Smelter;

class Bakery extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Bakery',
      category: 'Crafting',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:20 },
      hitpoints: 80,
      buildTime: 4
    });
  }
}
window.Bakery = Bakery;

class Blacksmith extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Blacksmith',
      category: 'Crafting',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:20, iron:10 },
      hitpoints: 80,
      buildTime: 4
    });
  }
}
window.Blacksmith = Blacksmith;