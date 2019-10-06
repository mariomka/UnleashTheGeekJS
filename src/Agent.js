const Item = require("./Item");
const Action = require("./Action");
const Constants = require("./Constants");

module.exports = class Agent {
    
    /**
     * Constructor
     * @param {number} id 
     * @param {import("./Player")} owner 
     * @param {import("./Coord")} pos 
     */
    constructor(id, owner, pos) {
        this.id = id;
        this.owner = owner;
        this.pos = pos;
        this.action = Action.NONE;
        this.initialPos = pos.clone();
        this.inventory = Item.NONE;
        this.message = "";
        this.respawnIn = 0;
        this.dead = false;
    }

    reset() {
        this.action = Action.NONE;
        this.message = "";
    }

    receiveOre() {
        this.inventory = Item.ORE;
    }

    factoryReset() {
        this.reset();
        this.pos = this.initialPos;
        this.inventory = Item.NONE;
        this.dead = false;
    }

    die() {
        this.dead = true;
        this.action = Action.NONE;
        this.respawnIn = Constants.AGENT_RESPAWN_TIME;
    }

    decrementRespawnTimer() {
        this.respawnIn--;
    }

    get shoulwRespawn() {
        return this.dead && this.respawnIn <= 0;
    }

}