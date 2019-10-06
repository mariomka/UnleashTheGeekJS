const Item = require("./Item");
const Constants = require("./Constants");

module.exports = class Player {
    
    /** @param {number} index */
    constructor(index) {

        this.index = index;
        this.ore = 0;

        /** @type {import("./Agent")[]} */
        this.agents = [];

        /** @type {Object<number, number} */
        this.cooldowns = {};

        this.cooldowns[Item.TRAP]  = 0;
        this.cooldowns[Item.RADAR] = 0;

        /** @type {Object<number, number} */
        this.cooldownTimes = {};
        
        this.cooldownTimes[Item.TRAP]  = Constants.TRAP_COOLDOWN;
        this.cooldownTimes[Item.RADAR] = Constants.RADAR_COOLDOWN;
    }

    /** @param {import("./Agent")} agent */
    addAgent(agent) {
        this.agents.push(agent);
    }

    decrementCooldowns() {
        for (let k in this.cooldowns) {
            this.cooldowns[k] && this.cooldowns[k]--;
        }
    }

    /** @param {number} item */
    startCooldown(item) {
        this.cooldowns[item] = this.cooldownTimes[item];
    }

    get expectedOutputLines() {
        return this.agents.length;
    }

    reset() {
        this.agents.forEach(a => a.reset());
    }

    scoreOre() {
        this.ore++;
    }

    get score() {
        return this.ore;
    }

}