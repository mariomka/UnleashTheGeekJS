const Coord = require("./Coord");
const Constants = require("./Constants");
let instance = 0;

module.exports = class ItemCoord extends Coord {

    /** 
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        super(x, y);
        this.id = instance++ + Constants.AGENTS_PER_PLAYER * 2;
    }
}