// src/buildings/Training.js

class Barracks extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Barracks',
      category: 'Training',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:100, stone:50 },
      hitpoints: 200,
      buildTime: 4
    });
  }
}
window.Barracks = Barracks;

class Stables extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Stables',
      category: 'Training',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:150, stone:75 },
      hitpoints: 200,
      buildTime: 5
    });
  }
}
window.Stables = Stables;

class Workshop extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Workshop',
      category: 'Training',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood: 80, stone: 80 },
      hitpoints: 150,
      buildTime: 4
    });
  }
}
window.Workshop = Workshop;