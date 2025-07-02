/**
 * Engineer — using Elite Wizard (frame 80) as a placeholder
 */
class Engineer extends Unit {
    constructor(coords) {
      super({ type: 'Engineer', coords, hp: 12, movePts: 1, actionPts: 1 });
      this.bonus       = { siege: 1.2 };
      this.spriteKey   = 'UnitSheet1';
      this.spriteFrame = 80;  // Elite Wizard icon as support placeholder
    }
  }
      