const PLAYER_MOVE_PATTERN = /^MOVE\s+(?<x>-?\d+)\s+(?<y>-?\d+)(?:\s+(?<message>.+))?\s*$/i;
const PLAYER_INTERACT_PATTERN = /^INTERACT|DIG)\s+(?<x>-?\d+)\s+(?<y>-?\d+)(?:\s+(?<message>.+))?\s*$/i;
const PLAYER_REQUEST_PATTERN = /^REQUEST\s+(?<item>(?:TRAP|RADAR))(?:\s+(?<message>.+))?\s*$/i;
const PLAYER_WAIT_PATTERN = /^WAIT(?:\s+(?<message>.+))?\s*$/i;
// const EXPECTED = "DIG <x> <y> | REQUEST <item> | MOVE <x> <y> | WAIT";

const Action = require("./Action");
const Coord = require("./Coord");
const Item = require("./Item");

module.exports = class CommandManager {

    /**
     * 
     * @param {import("./Player")} player 
     * @param {string[]} lines 
     */
    static handleCommands(player, lines) {
        let i =0;
        for (let line of lines) {

            let agent = player.agents[i++];
            if (agent.dead) continue;

            let match = line.match(PLAYER_WAIT_PATTERN);

            if (match) {
                this.matchMessage(agent, match);
                continue;
            }

            match = line.match(PLAYER_MOVE_PATTERN);

            if (match) {
                let x = ~~match.groups.x;
                let y = ~~match.groups.y;

                agent.action = new Action.Move(new Coord(x, y));

                this.matchMessage(agent, match);
                continue;
            }

            match = line.match(PLAYER_INTERACT_PATTERN);

            if (match) {
                let x = ~~match.groups.x;
                let y = ~~match.groups.y;

                agent.action = new Action.Dig(new Coord(x, y));

                this.matchMessage(agent, match);
                continue;
            }

            match = line.match(PLAYER_REQUEST_PATTERN);

            if (match) {
                let item = Item[match.groups.item.toUpperCase()];

                agent.action = new Action.Request(item);

                this.matchMessage(agent, match);
                continue;
            }

            console.error(`Error: player#${player.index} has invalid input: ${line}.`);
        }
    }

    /**
     * 
     * @param {import("./Agent")} agent 
     * @param {RegExpMatchArray} match 
     */
    static matchMessage(agent, match) {
        agent.message = match.groups.message;
    }
}