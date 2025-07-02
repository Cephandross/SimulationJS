// src/buildings/Training.js

class Barracks extends Building {
  constructor(coords) {
    super({
      type: 'Barracks',
      category: 'Training',
      coords,
      costs:    { wood:100, stone:50 },
      hitpoints: 200,
      buildTime:  4
    });
    this.spriteKey   = 'Barracks';
    this.spriteFrame = 0;       // infantry trainer
  }
}
window.Barracks = Barracks;

class Stables extends Building {
  constructor(coords) {
    super({
      type: 'Stables',
      category: 'Training',
      coords,
      costs:    { wood:150, stone:75 },
      hitpoints: 200,
      buildTime:  5
    });
    this.spriteKey   = 'Workshops';  
    this.spriteFrame = 1;       // pick an available frame for cavalry stable
  }
}
window.Stables = Stables;

class Workshop extends Building {
  constructor(coords) {
    super({
      type: 'Workshop',
      category: 'Training',
      coords,
      costs:    { wood: 80, stone: 80 },
      hitpoints: 150,
      buildTime:  4
    });
    this.spriteKey   = 'Workshops';
    this.spriteFrame = 0;       // generic workshop
  }
}
window.Workshop = Workshop;
