const PRIME = 31;
let Constants;

module.exports = class Coord {

    /**
     * Constructor
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        if (!Constants) {
           Constants = require("./Constants");
        }
        this.x = x;
        this.y = y;
    }

    /**
     * DistanceTo
     * @param {number} x 
     * @param {number} y 
     */
    euclideanTo(x, y) {
        return Math.sqrt(this.sqrEuclideanTo(x, y));
    }

    /**
     * SqrDistanceTo
     * @param {number} x 
     * @param {number} y 
     */
    sqrEuclideanTo(x, y) {
        return (x - this.x) ** 2 + (y - this.y) ** 2;
    }

    /**
     * Manhatten distance
     * @param {Coord|number} x 
     * @param {number} y 
     */
    manhattanTo(x, y) {
        if (x instanceof Coord) {
            return this.manhattanTo(x.x, x.y);
        } else {
            return Math.abs(x - this.x) + Math.abs(y - this.y);
        }
    }

    /**
     * Chebyshev distance
     * @param {Coord|number} x 
     * @param {number} y 
     */
    chebyshevTo(x, y) {
        if (x instanceof Coord) {
            return this.chebyshevTo(x.x, x.y);
        } else {
            return Math.max(Math.abs(x - this.x) + Math.abs(y - this.y));
        }
    }

    /**
     * Game distance
     * @param {Coord|number} x 
     * @param {number} y
     * @return {number}
     */
    distanceTo(x, y) {
        if (x instanceof Coord) {
            return this.distanceTo(x.x, x.y);
        } else {
            return Constants.ADJACENCY == Constants.FOUR_ADJACENCY ?
                   this.manhattanTo(x, y) : this.chebyshevTo(x, y);
        }
    }

    valueOf() {
        let result = PRIME + this.x;
        return PRIME * result + this.y;
    }

    /** @param {Coord} other */
    equals(other) {
        return this.valueOf() == other.valueOf();
    }

    toString() {
        return `(${this.x}, ${this.y})`;
    }

    clone() {
        return new Coord(this.x, this.y);
    }
}