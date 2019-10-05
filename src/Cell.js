
class Cell {
    constructor() {
        this.valid = true;
        this.accessToHQ = false;
        this.hole = false;
        this.ore = 0;
    }
}

let noCell = new Cell();
noCell.valid = false;
noCell.ore = 0;
Cell.NO_CELL = noCell;

module.exports = Cell;