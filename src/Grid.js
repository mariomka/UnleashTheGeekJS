const Coord = require("./Coord");
const ItemCoord = require("./ItemCoord");
const PathNode = require("./PathNode");
const Constants = require("./Constants");
const Cell = require("./Cell");
const PriorityQueue = require("../util/PriorityQueue");

module.exports = class Grid {

    /**
     * Constructor
     * @param {number} width 
     * @param {number} height 
     * @param {number} playerCount 
     */
    constructor(width, height, playerCount) {
        this.width = width;
        this.height = height;
        
        /** @type {Map<Coord, Cell>} */
        this.cells = new Map();

        /** @type {Map<number, Set<import("./ItemCoord")>[]>} */
        this.items = new Map();

        /** @type {Set<import("./ItemCoord")>[]} */
        this.traps = [];
        /** @type {Set<import("./ItemCoord")>[]} */
        this.radars = [];

        for (let i = 0; i < playerCount; i++) {
            this.radars.push(new Set());
            this.traps.push(new Set());
        }

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.cells.set(new Coord(x, y), new Cell());
            }
        }
    }

    /**
     * Get cell at (x, y) or of coord x
     * @param {number|Coord} x 
     * @param {number} y
     * @returns {Cell}
     */
    get(x, y) {
        if (x instanceof Coord) {
            return this.get(x.x, x.y);
        } else { 
            return this.cells.get(new Coord(x, y));
        }
    }

    /** @param {import("./PathNode")} current */
    unrollPath(current) {
        let path = [];
        while (!current.isStart) {
            path.unshift(current.coord);
            current = current.prev;
        }
        return path;
    }

    /**
     * Path finding (A* with custom distance function)
     * @param {Coord} start 
     * @param {Coord} target 
     * @param {Coord[]} restricted 
     */
    findPath(start, target, restricted) {
        let queue = new PriorityQueue(this.byDistanceTo(target));
        /** @type {Set<Coord>} */
        let computed = new Set();

        /** @type {PathNode[]} */
        let closest = [];
        let closestBy = 0;

        queue.add(new PathNode(start));
        computed.add(start);

        while(!queue.isEmpty()) {
            /** @type {PathNode} */
            let current = queue.poll();

            if (current.coord == target) {
                return this.unrollPath(current);
            } else {
                let dist = current.coord.distanceTo(target);
                if (!closest.length || closestBy > dist) {
                    closest = [current];
                    closestBy = dist;
                } else if (closest.length && closestBy === dist) {
                    closest.push(current);
                }
            }
            if (current.steps < Constants.AGENTS_MOVE_DISTANCE) {
                let neribours = this.getNeighbours(current.coord);
                for (let neigh of neribours) {
                    if (!restricted.includes(neigh) && !computed.has(neigh)) {
                        queue.add(new PathNode(neigh, current));
                        computed.add(neigh);
                    }
                }
            }
        }
        if (!closest.length) {
            return [];
        }
        return this.unrollPath(closest[~~(Math.random() * closest.length)]);
    }

    /** @param {Coord} pos */
    getNeighbours(pos) {
        /** @type {Coord[]} */
        let neighs = [];
        for (let delta of Constants.ADJACENCY.deltas) {
            let n = new Coord(pos.x, + delta.x, pos.y + delta.y);
            if (this.get(n) != Cell.NO_CELL) {
                neighs.push(n);
            }
        }
        return neighs;
    }

    /** @param {Coord} target */
    byDistanceTo(target) {
        
        /** @param {Coord} coord */
        function dist(coord) {
            return coord.distanceTo(target);
        }

        return dist;
    }

    /**
     * @param {Coord} from 
     * @param {Coord[]} targets 
     */
    getClosestTarget(from, targets) {
        /** @type {Coord[]} */
        let closest = [];
        let closestBy = 0;
        for (let neigh of targets) {
            let dist = from.distanceTo(neigh);
            if (!closest.length || closestBy > dist) {
                closest = [neigh];
                closestBy = dist;
            } else if (closest.length && closestBy == dist) {
                closest.push(neigh);
            }
        }
        return closest;
    }

    /** @param {Coord} pos */
    hasTrap(pos) {
        return this.traps.some(set => set.has(pos));
    }

    /** @param {Coord} pos */
    removeTrap(pos) {
        this.traps.forEach(set => set.delete(pos));
    }

    /**
     * 
     * @param {Coord} pos 
     * @param {import("./Player")} destroyer 
     */
    destroyedRadar(pos, destroyer) {
        let destroyed = false;
        for (let i = 0; i < this.radars.length; i++) {
            if (i != destroyer.index) {
                destroyed |= this.radars[i].delete(pos);
            }
        }
        return destroyed;
    }

    /**
     * 
     * @param {Coord} pos 
     * @param {number} item 
     * @param {import("./Player")} itemOwner 
     */
    insertItem(pos, item, itemOwner) {
        this.getItems(item, itemOwner).add(new ItemCoord(pos.x, pos.y));
    }

    getHQAccesses() {
        let coords = [];
        for (let y = 0; y < Constants.MAP_HEIGHT; y++) {
            coords.push(new Coord(0, y))
        }
        return coords;
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {import("./Player")} player 
     */
    isOreVisibleTo(x, y, player) {
        return [...this.radars[player.index]].some(pos => Constants.EUCLIDEAN_RADAR ?
            pos.euclideanTo(x, y) <= Constants.RADAR_RANGE :
            pos.distanceTo(x, y)  <= Constants.RADAR_RANGE);
    }

    /**
     * 
     * @param {number} item 
     * @param {import("./Player")} player 
     */
    getItems(item, player) {
        return this.items.get(item)[player.index];
    }

    /**
     * @param {Coord} coord 
     * @param {number} range 
     */
    getCellsInRange(coord, range) {
        /** @type {Set<Coord>} */
        let result = Set();
        /** @type {PathNode[]} */
        let queue = [];

        queue.push(new PathNode(coord));
        while(queue.length) {
            let e = queue.shift();
            result.add(e.coord);
            if (e.steps < range) {
                this.getNeighbours(e.coord).forEach(neigh => {
                    if (!result.has(neigh)) {
                        queue.push(new PathNode(neigh, e));
                    }
                });
            }
        }

        return result;
    }
}