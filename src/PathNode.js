const Coord = require("./Coord");

module.exports = class PathNode {

    /**
     * 
     * @param {Coord} coord 
     * @param {PathNode|undefined} prev 
     */
    constructor(coord, prev) {
        this.coord = coord;

        if (prev) {
            this.prev = prev;
            /** @type {number} */
            this.steps = prev.steps + 1;
        }
    }

    get isStart() {
        return !this.prev
    }
}