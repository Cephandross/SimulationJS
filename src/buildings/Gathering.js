// src/buildings/Gathering.js

class FruitGatherer extends Building {
  constructor(coords) {
    super({
      type: 'FruitGatherer',
      category: 'Gathering',
      coords,
      costs:     { wood:30 },
      hitpoints:  50,
      buildTime:  3,
      resourcetype: "food",
      resourceamount: 2
    });
    this.spriteKey   = 'Resources';
    this.spriteFrame = 0;
  }
}
window.FruitGatherer = FruitGatherer;

class SeedsGatherer extends Building {
  constructor(coords) {
    super({
      type: 'SeedsGatherer',
      category: 'Gathering',
      coords,
      costs:     { wood:30 },
      hitpoints:  50,
      buildTime:  3,
      resourcetype: "seeds",
      resourceamount: 1
    });
    this.spriteKey   = 'Resources';
    this.spriteFrame = 1;
  }
}
window.SeedsGatherer = SeedsGatherer;

class Farmland extends Building {
  constructor(coords) {
    super({
      type: 'Farmland',
      category: 'Gathering',
      coords,
      costs:     { seeds:5 },
      hitpoints:  20,
      buildTime:  0,   // instant
      resourceamount: 50,
      resourcetype: "food"
    });
    this.spriteKey   = 'Resources';
    this.spriteFrame = 1;
  }
}
window.Farmland = Farmland;
class LumberCamp extends Building {
  constructor(coords) {
    super({
      type: 'LumberCamp',
      category: 'Gathering',
      coords,
      costs:     { wood:50, stone:20 },
      hitpoints: 100,
      buildTime:  10,
      footprint:  1,
      resourcetype: "wood",
      resourceamount: 5
    });
    this.spriteKey   = 'Resources';
    this.spriteFrame = 3;  // pick an appropriate frame
  }
}
window.LumberCamp = LumberCamp;
class Quarry extends Building {
  constructor(coords) {
    super({
      type: 'Quarry',
      category: 'Gathering',
      coords,
      costs:     { wood:20, stone:50 },
      hitpoints: 120,
      buildTime:  6,
      footprint:  1,
      resourceamount: 5,
      resourcetype: "stone"
    });
    this.spriteKey   = 'Resources';
    this.spriteFrame = 4;  // pick an appropriate frame
  }
}
window.Quarry = Quarry;
class CoalGatherer extends Building {
  constructor(coords) {
    super({
      type: 'CoalGatherer',
      category: 'Gathering',
      coords,
      costs:     { wood:30, stone:30 },
      hitpoints:  80,
      buildTime:  5,
      footprint:  1,
      resourceamount: 1,
      resourcetype: "coal"
    });
    this.spriteKey   = 'Resources';
    this.spriteFrame = 5;
  }
}
window.CoalGatherer = CoalGatherer;
class IronGatherer extends Building {
  constructor(coords) {
    super({
      type: 'IronGatherer',
      category: 'Gathering',
      coords,
      costs:     { wood:30, stone:30 },
      hitpoints:  80,
      buildTime:  5,
      footprint:  1,
      resourceamount: 1,
      resourcetype: "iron"
    });
    this.spriteKey   = 'Resources';
    this.spriteFrame = 6;
  }
}
window.IronGatherer = IronGatherer;

class CopperGatherer extends Building {
  constructor(coords) {
    super({
      type: 'CopperGatherer',
      category: 'Gathering',
      coords,
      costs:     { wood:30, stone:30 },
      hitpoints:  80,
      buildTime:  5,
      footprint:  1,
      resourceamount: 1,
      resourcetype: "copper"
    });
    this.spriteKey   = 'Resources';
    this.spriteFrame = 7;
  }
}
window.CopperGatherer = CopperGatherer;

class GoldGatherer extends Building {
  constructor(coords) {
    super({
      type: 'GoldGatherer',
      category: 'Gathering',
      coords,
      costs:     { wood:30, stone:30 },
      hitpoints:  80,
      buildTime:  5,
      footprint:  1,
      resourceamount: 5,
      resourcetype: "gold"
    });
    this.spriteKey   = 'Resources';
    this.spriteFrame = 8;
  }
}
window.GoldGatherer = GoldGatherer;

