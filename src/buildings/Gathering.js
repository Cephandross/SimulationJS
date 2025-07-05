// src/buildings/Gathering.js

class FruitGatherer extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'FruitGatherer',
      category: 'Gathering',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:30 },
      hitpoints: 50,
      buildTime: 3,
      resourcetype: "food",
      resourceamount: 2
    });
  }
}
window.FruitGatherer = FruitGatherer;

class SeedsGatherer extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'SeedsGatherer',
      category: 'Gathering',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:30 },
      hitpoints: 50,
      buildTime: 3,
      resourcetype: "seeds",
      resourceamount: 1
    });
  }
}
window.SeedsGatherer = SeedsGatherer;

class Farmland extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Farmland',
      category: 'Gathering',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { seeds:5 },
      hitpoints: 20,
      buildTime: 0,
      resourceamount: 50,
      resourcetype: "food"
    });
  }
}
window.Farmland = Farmland;

class LumberCamp extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'LumberCamp',
      category: 'Gathering',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:50, stone:20 },
      hitpoints: 100,
      buildTime: 10,
      footprint: 1,
      resourcetype: "wood",
      resourceamount: 5
    });
  }
}
window.LumberCamp = LumberCamp;

class Quarry extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'Quarry',
      category: 'Gathering',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:20, stone:50 },
      hitpoints: 120,
      buildTime: 6,
      footprint: 1,
      resourceamount: 5,
      resourcetype: "stone"
    });
  }
}
window.Quarry = Quarry;

class CoalGatherer extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'CoalGatherer',
      category: 'Gathering',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:30, stone:30 },
      hitpoints: 80,
      buildTime: 5,
      footprint: 1,
      resourceamount: 1,
      resourcetype: "coal"
    });
  }
}
window.CoalGatherer = CoalGatherer;

class IronGatherer extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'IronGatherer',
      category: 'Gathering',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:30, stone:30 },
      hitpoints: 80,
      buildTime: 5,
      footprint: 1,
      resourceamount: 1,
      resourcetype: "iron"
    });
  }
}
window.IronGatherer = IronGatherer;

class CopperGatherer extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'CopperGatherer',
      category: 'Gathering',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:30, stone:30 },
      hitpoints: 80,
      buildTime: 5,
      footprint: 1,
      resourceamount: 1,
      resourcetype: "copper"
    });
  }
}
window.CopperGatherer = CopperGatherer;

class GoldGatherer extends Building {
  constructor(coords, owner = null, scene = null) {
    super({
      type: 'GoldGatherer',
      category: 'Gathering',
      owner: owner,
      coords: coords,
      scene: scene,
      costs: { wood:30, stone:30 },
      hitpoints: 80,
      buildTime: 5,
      footprint: 1,
      resourceamount: 5,
      resourcetype: "gold"
    });
  }
}
window.GoldGatherer = GoldGatherer;