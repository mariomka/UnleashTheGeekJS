
class Cell {
    /**
     * Constructor
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
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

    equals(other) {
        return other instanceof Cell && other.x === this.x && other.y === this.y;
    }
}

let noCell = new Cell();
noCell.valid = false;
noCell.ore = 0;
noCell.x = -1;
noCell.y = -1;
Cell.NO_CELL = noCell;

module.exports = Cell;