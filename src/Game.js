const Grid = require("./Grid");
const Action = require("./Action");
const Agent = require("./Agent");
const Constants = require("./Constants");
const Coord = require("./Coord");
const Item = require("./Item");
const { randomInt, interpolate, shuffle, getLargetSize } = require("../util/JavaFunctions");

module.exports = class Game {
    constructor() {
        this.trapsPlaced = 0;
        this.robotDestroyed = 0;
        this.oreDelivered = 0;

        /** @type {Grid} */
        this.grid = null;

        /** @type {import("./Agent")[]} */
        this.deadAgents = [];

        /** @type {import("./Player")[]} */
        this.players = [];
    }

    /**
     * @return {import("./Agent")[]}
     */
    get allAgents() {
        return [].concat(...this.players.map(p => p.agents));
    }

    convertActions() {
        for (let agent of this.allAgents) {
            let action = agent.action;

            if (action.isDig) {
                let cell = this.grid.get(action.target);
                if (!cell.valid || cell.accessToHQ) {
                    agent.action = new Action.Move(action.target);
                } else if (agent.pos.distanceTo(action.target) > Constants.AGENT_INTERACT_RADIUS) {
                    let closest = this.grid.getClosestTarget(agent.pos, this.grid.getNeighbours(action.target));
                    let target = closest[~~(Math.random() * closest.length)];
                    agent.action = new Action.Move(target);
                }
            } else if (action.isRequest) {
                if (!this.grid.get(agent.pos).accessToHQ) {
                    let closest = this.grid.getClosestTarget(agent.pos, this.grid.getHQAccesses());
                    let target = closest[~~(Math.random() * closest.length)];
                    agent.action = new Action.Move(target);
                }
            }

            if (action.isMove) {
                if (agent.pos.equals(action.target)) {
                    agent.action = Action.NONE;
                }
            }
        }
    }

    decrementCooldowns() {
        this.deadAgents.forEach(da => da.decrementRespawnTimer());
        this.players.forEach(p => p.decrementCooldowns());
    }

    /** @param {import("./Agent")} agent */
    destoryAgent(agent) {
        agent.die();
        this.deadAgents.push(agent);
        this.robotDestroyed++;
    }

    generateMap() {
        let grid = this.newMap();

        // Set up ore
        let cellCount = Constants.MAP_WIDTH * Constants.MAP_HEIGHT;
        let clustersMin = Math.max(1, ~~(cellCount * Constants.MAP_CLUSTER_DISTRIBUTION_MIN));
        let clustersMax = Math.max(clustersMin, ~~(cellCount * Constants.MAP_CLUSTER_DISTRIBUTION_MAX));
        let oreClusterCount = randomInt(clustersMin, clustersMax);

        let padding = {
            left: 3,
            right: 2,
            top: 2,
            bottom: 2
        };

        let tries = 0;
        // Magic number bruh
        while (oreClusterCount > 0 && tries < 1000) {

            let factor = Math.pow(Math.random(), Constants.MAP_ORE_COEFF_X);
            let x = interpolate(padding.left, Constants.MAP_WIDTH - padding.right, factor);
            let y = randomInt(padding.top, Constants.MAP_HEIGHT - padding.bottom);

            if (!grid.get(x, y).ore) {
                let clusterCenter = new Coord(x, y);
                for (let i = 0; i < Constants.MAP_CLUSTER_SIZE; i++) {
                    for (let j = 0; j < Constants.MAP_CLUSTER_SIZE; j++) {
                        x = clusterCenter.x + ~~(i - Constants.MAP_CLUSTER_SIZE / 2);
                        y = clusterCenter.y + ~~(j - Constants.MAP_CLUSTER_SIZE / 2);

                        let chances = clusterCenter.manhattanTo(x, y) * 2 + 1;
                        let hit = randomInt(chances);

                        if (!hit) {
                            let amount = randomInt(Constants.MAP_ORE_IN_CELL_MIN, Constants.MAP_ORE_IN_CELL_MAX + 1);
                            grid.get(x, y).ore = amount;
                        }
                    }
                }
                oreClusterCount--;
            }
            tries++;
        }

        return grid;
    }

    newMap() {
        let grid = new Grid(Constants.MAP_WIDTH, Constants.MAP_HEIGHT, this.players.length);

        for (let y = 0; y < Constants.MAP_HEIGHT; y++) {
            grid.get(0, y).accessToHQ = true;
        }
        return grid;
    }

    /**
     * @param {import("./Agent")[][]} teams 
     * @param {number} index 
     */
    getAllAgentsOfIndex(teams, index) {
        return teams.filter(team => team.length > index).map(team => team[index]);
    }

    getCurrentFrameData() {
    }

    agentToAgentFrameData() {

    }

    /** @param {import("./Player")} player */
    getCurrentFrameInfoFor(player) {
        let lines = [];
        let opponent = player.index == 1 ? this.players[0] : this.players[1];

        lines.push(`${player.ore} ${opponent.ore}`);

        for (let y = 0; y < this.grid.height; y++) {
            let row = [];
            for (let x = 0; x < this.grid.width; x++) {
                let c = this.grid.get(x, y);

                let oreValue = this.grid.isOreVisibleTo(x, y, player) ? c.ore : "?";
                row.push(`${oreValue} ${c.hole ? 1 : 0}`);
            }

            lines.push(row.join("\n"));
        }

        /** @type {Array<string>} */
        let entities = [];

        // <id> <type(owner)> <x> <y> <item>
        this.allAgents.forEach(agent => entities.push(this.agentToString(agent, player)));
        entities.push(...this.itemsToString(player, Item.RADAR));
        entities.push(...this.itemsToString(player, Item.TRAP));

        lines.push(`${entities.length} ${player.cooldowns[Item.RADAR]} ${player.cooldowns[Item.TRAP]}`);
        lines.push(...entities);

        return lines;
    }

    /** 
     * @param {import("./Player")} player 
     * @param {number} item 
     */
    itemsToString(player, item) {
        return [...this.grid.getItems(item, player)].map(pos => `${pos.id} ${item} ${pos.x} ${pos.y} ${item}`);
    }

    /**
     * @param {(value: (import("./Agent"))) => boolean} filter 
     */
    getFilteredTeams(filter) {
        return this.getTeamList().map(team => team.filter(filter));
    }

    getGlobalInfo() {
        return [`${Constants.MAP_WIDTH} ${Constants.MAP_HEIGHT}`];
    }

    getTeamList() {
        return this.players.map(p => p.agents);
    }

    init() {

    }

    /** @param {stirng} state */
    initGameState(state) {
        if (!state) {
            this.grid = this.generateMap();
            this.initPlayers();
        } else {
            console.error("NOPE");
        }
    }

    initPlayers() {
        let spaces = ~~(Constants.MAP_HEIGHT / 2);

        /** @type {number[]} */
        let available = [];

        for (let i = 0; i < spaces; i++)
            available.push(i);

        available = shuffle(available);
        
        for (let i = 0; i < Constants.AGENTS_PER_PLAYER; i++) {
            let y = available.length ? available.shift() : randomInt(spaces);

            for (let player of this.players) {
                let pos = new Coord(0, y + 2 * (Constants.AGENTS_START_PACKED ? 0 : player.index));
                let agent = new Agent(Constants.AGENTS_PER_PLAYER * player.index + i, player, pos);
                player.addAgent(agent);
            }
        }
    }

    performGameUpdate() {
        this.convertActions();

        this.resolveTraps();
        this.resolveDigs();
        this.resolveRequests();

        this.decrementCooldowns();

        this.resolveMoves();
        this.resolveDelivers();
        this.respawnDeadAgents();
    }

    resetGameTurnData() {
        this.players.forEach(p => p.reset());
    }

    resolveDelivers() {
        this.allAgents
            .filter(agent => !agent.dead && this.grid.get(agent.pos).accessToHQ)
            .forEach(agent => {
                if (agent.inventory == Item.ORE) {
                    agent.owner.scoreOre();
                    agent.inventory = Item.NONE;

                    this.oreDelivered++;
                }
            });
    }

    resolveDigs() {
        /** @type {Map<Coord, Agent[][]>} */
        let digRequests = this.allAgents
            .map(agent => agent.action)
            .filter(action => action.isDig)
            .map(action => action.target)
            // Unique
            .reduce(
                /** @param {Coord[]} prev */
                (prev, curr) => {
                    if (!prev.some(c => curr.equals(c))) {
                        prev.push(curr);
                    }
                    return prev;
                }, [])
            .reduce(
                /** @param {Map<Coord, Agent[][]>} prev */
                (prev, curr) => {
                    prev.set(curr, this.getFilteredTeams(agent => 
                        agent.action.isDig && agent.action.target.equals(curr)));
                    return prev;
                }, new Map());

        for (let [pos, teams] of digRequests) {
            let cell = this.grid.get(pos);
            let maxAgentsInTeam = getLargetSize(teams);

            /** @type {Object<number, number[]>} */
            let burried = new {};

            teams
                .filter(team => team.length)
                .map(team => team[0])
                .forEach(agent => {
                    let destoryed = this.grid.destroyedRadar(pos, agent.owner);
                    // TODO: Emit some event
                });
            

            // Collect Ores
            for (let index = 0; index < maxAgentsInTeam; index++) {
                let currentDiggers = this.getAllAgentsOfIndex(teams, index);
                /** @type {Agent[]} */
                let oreCollectors = [];

                currentDiggers.forEach(agent => {
                    // TODO: Emit some event

                    if (agent.inventory != Item.ORE) {
                        oreCollectors.push(agent);
                    }
                    if (agent.inventory != Item.NONE) {
                        if (!burried[agent.owner.index]) 
                            burried[agent.owner.index] = [];
                        burried[agent.owner.index].push(agent.inventory);

                        agent.inventory = Item.NONE;
                    }
                    if (agent.inventory == Item.TRAP) {
                        this.trapsPlaced++;
                    }
                });

                // Drill hole
                if (!cell.hole) {
                    cell.hole = true;
                }
                if (cell.ore > 0) {
                    cell.reduceOre(oreCollectors.length);
                    oreCollectors.forEach(agent => {
                        agent.receiveOre();

                        // TODO: emit some event
                    });
                }
            }

            // Inset items
            for (let playerIndex in burried) {
                for (let item of burried[playerIndex]) {
                    if (item == Item.ORE) {
                        cell.incrementOre();
                    } else {
                        this.grid.insertItem(pos, item, this.players[playerIndex]);
                    }
                }
            }
        }        
    }

    getMoversByTeam() {
        return this.getFilteredTeams(agent => agent.action.isMove);
    }

    resolveMoves() {
        let movers = this.getMoversByTeam();

        for (let team of movers) {
            for (let agent of team) {
                let action = agent.action;

                let obstacles = Constants.ROBOTS_CAN_OCCUPY_SAME_CELL ? [] :
                    team.map(agent => agent.pos);

                let path = this.grid.findPath(agent.pos, action.target, obstacles);
                
                if (path.length) {
                    agent.pos = path[path.length - 1];
                }
            }
        }
    }

    /**
     * @param {Agent} a 
     * @param {Agent} b 
     */
    compareByInventorySpace(a, b) {
        let hasItemA = a.inventory != Item.NONE;
        let hasItemB = b.inventory != Item.NONE;
        if (hasItemA && hasItemB)
            return 1;
        if (!hasItemA && !hasItemB)
            return -1;
        return 0;
    }

    resolveRequests() {
        this.allAgents
            .filter(agent => agent.action.isRequest)
            .sort(this.compareByInventorySpace)
            .forEach(agent => {
                let item = agent.action.item;
                if (agent.owner.cooldowns[item] == 0) {
                    agent.owner.startCooldown(item);
                    agent.inventory = item;

                    // TODO: emit some event
                } else {
                    // Blabla
                }
            })
    }

    resolveTraps() {
        let triggeredTraps = this.allAgents
            .map(agent => agent.action)
            .filter(action => action.isDig)
            .filter(action => this.grid.hasTrap(action.target))
            .map(action => action.target);

        /** @type {Coord[]} */
        let deathZone = [];

        if (Constants.TRAP_CHAIN_REACTION) {
            deathZone = [].concat(triggeredTraps);
            /** @type {Coord[]} */
            let exploding = [].concat(triggeredTraps);

            while(exploding.length) {
                let trap = exploding.shift();

                this.grid.getCellsInRange(trap, Constants.TRAP_RANGE)
                    .forEach(c => {
                        if (!deathZone.some(d => d.equals(c)))
                            deathZone.push(c);

                        if (this.grid.hasTrap(c) && !triggeredTraps.some(t => t.equals(c))) {
                            exploding.push(c);
                            triggeredTraps.push(c);
                        }
                    });
            }
        } else {
            deathZone = [].concat(...triggeredTraps.map(coord => this.grid.getCellsInRange(coord, Constants.TRAP_RANGE)));
        }
        deathZone.forEach(coord => this.grid.removeTrap(coord));

        this.allAgents
            .filter(agent => !agent.dead && deathZone.some(coord => agent.pos.equals(coord)))
            .forEach(agent => this.destoryAgent(agent));

        for (let triggerPos of triggeredTraps) {
            // TODO: emit some events
        }
    }

    respawnDeadAgents() {
        this.deadAgents
            .filter(agent => agent.shoulwRespawn)
            .forEach(agent => {
                this.deadAgents.some((da, index, array) => {
                    if (agent == da) {
                        array.splice(index, 1);
                        return true;
                    }
                });

                agent.factoryReset();

                // TODO: emit some events
            });
    }

    /**
     * @param {import("./Agent")} agent 
     * @param {import("./Player")} player 
     */
    agentToString(agent, player) {
        return `${agent.id} ${player == agent.owner ? Constants.TYPE_MY_AGENT : Constants.TYPE_FOE_AGENT} ` + 
               `${agent.dead ? -1 : agent.pos.x} ${agent.dead ? -1 : agent.pos.y} ` + 
               `${player == agent.owner ? agent.inventory : Item.NONE}`;
    }

    gameOver() {
        if (!this.getRemainingOre())
            return true;
        
        let players = this.players;

        // Player with most ore is only player with live bots
        let playerWithMostOre = this.getPlayerWithMostOre();
        if (playerWithMostOre) {
            players = this.players.filter(player => player != playerWithMostOre);
        }
        
        // No bots left
        /** @type {Agent[]} */
        let agents = [].concat(...players.map(p => p.agents));

        return agents.every(agent => agent.dead);
    }

    getPlayerWithMostOre() {
        let most = 0;
        let result;

        for (let player of this.players) {
            if (!result || player.ore > most) {
                most = player.ore;
                result = player;
            } else if (player.ore == most) {
                return;
            }
        }
        return result;
    }

    getRemainingOre() {
        let remainingOre = 0;

        for (let c of this.grid.cells) {
            remainingOre += c.ore;
        }
        for (let player of this.players) {
            for (let agent of player.agents) {
                if (agent.inventory == Item.ORE) {
                    remainingOre++;
                }
            }
        }
        return remainingOre;
    }
}
