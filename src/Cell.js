
class Cell {
    constructor() {
        this.valid = true;
        this.accessToHQ = false;
        this.hole = false;
        this.ore = 0;
    }

    /** @param {number} amount */
    reduceOre(amount) {
        this.ore = Math.max(0, this.ore - amount);
    }

    incrementOre() {
        this.ore++;
    }
}

let noCell = new Cell();
noCell.valid = false;
noCell.ore = 0;
Cell.NO_CELL = noCell;

module.exports = Cell;