const PLAYER_MOVE_PATTERN = /^MOVE\s+(?<x>-?\d+)\s+(?<y>-?\d+)(?:\s+(?<message>.+))?\s*$/i;
const PLAYER_INTERACT_PATTERN = /^INTERACT|DIG)\s+(?<x>-?\d+)\s+(?<y>-?\d+)(?:\s+(?<message>.+))?\s*$/i;
const PLAYER_REQUEST_PATTERN = /^REQUEST\s+(?<item>(?:TRAP|RADAR))(?:\s+(?<message>.+))?\s*$/i;
const PLAYER_WAIT_PATTERN = /^WAIT(?:\s+(?<message>.+))?\s*$/i;
const EXPECTED = "DIG <x> <y> | REQUEST <item> | MOVE <x> <y> | WAIT";

module.exports = class CommandManager {

    /**
     * 
     * @param {} player 
     * @param {string[]} lines 
     */
    static handleCommands(player, lines) {

        for (let i in lines) {

            let line = lines[i];
            let match = line.match(PLAYER_WAIT_PATTERN);

            if (match) {
                this.matchMessage(agent, match);
                continue;
            }

            match = line.match(PLAYER_MOVE_PATTERN);

            if (match) {
                let x = ~~match.groups.x;
                let y = ~~match.groups.y;

                
            }
        }
    }

    /**
     * 
     * @param {} agent 
     * @param {RegExpMatchArray} match 
     */
    static matchMessage(agent, match) {
        let message = match.groups.message;
        agent.setMessage(message);
    }
}