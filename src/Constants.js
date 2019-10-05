const Coord = require("./Coord");

class Adjacency {
    /** @param {Coord[]} deltas */
    constructor(...deltas) {
        this.deltas = deltas;
    }
}

const FOUR_ADJACENCY  = new Adjacency(new Coord(-1, 0), new Coord(1, 0), new Coord(0, -1), new Coord(0, 1));
const EIGHT_ADJACENCY = new Adjacency(
    new Coord(-1, 0), new Coord(1, 0), new Coord(0, -1), new Coord(0, 1), new Coord(-1, -1),
    new Coord(1, -1), new Coord(-1, 1), new Coord(1, 1)
);

module.exports = {

    FOUR_ADJACENCY,
    EIGHT_ADJACENCY,
    ADJACENCY: FOUR_ADJACENCY,

    TYPE_NONE: -1,
    TYPE_MY_AGENT: 0,
    TYPE_FOE_AGENT: 1,
    TYPE_RADAR: 2,
    TYPE_TRAP: 3,
    TYPE_ORE: 4,

    AGENTS_MOVE_DISTANCE: 4,
    AGENTS_PER_PLAYER: 5,
    AGENT_INTERACT_RADIUS: 1,
    AGENT_RESPAWN_TIME: 999,
    MAP_CLUSTER_SIZE: 5,
    MAP_ORE_COEFF_X: 0.55,
    MAP_HEIGHT: 15,
    MAP_WIDTH: 30,
    MAP_CLUSTER_DISTRIBUTION_MAX: 0.064,
    MAP_CLUSTER_DISTRIBUTION_MIN: 0.032,
    MAP_ORE_IN_CELL_MAX: 3,
    MAP_ORE_IN_CELL_MIN: 1,
    RADAR_COOLDOWN: 5,
    RADAR_RANGE: 4,
    ROBOTS_CAN_OCCUPY_SAME_CELL: true,
    TRAP_CHAIN_REACTION: true,
    TRAP_FRIENDLY_FIRE: true,
    TRAP_COOLDOWN: 5,
    TRAP_RANGE: 1,
    EUCLIDEAN_RADAR: false,
    AGENTS_START_PACKED: true,
}