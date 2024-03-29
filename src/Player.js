const Item = require("./Item");
const Constants = require("./Constants");
let index = 0;

module.exports = class Player {
    
    constructor() {

        this.index = index++;
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

        /** @type {string[]} */
        this.inputs = [];
        /** @type {string[]} */
        this.outputs = [];
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

    /** @param {string} line */
    sendInputLine(line) {
        this.inputs.push(line);
    }

    execute() {

    }

}