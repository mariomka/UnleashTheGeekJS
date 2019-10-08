const { EventEmitter } = require("events");

const Game = require("./Game");
const CommandManager = require("./CommandManager");

module.exports = class Referee extends EventEmitter {

    /** @param {import("./Player")[]} players */
    constructor(...players) {
        super();
        this.players = players;
        this.gap = 1000;
        this.maxTurns = 200;
    }

    reset() {

        this.game = new Game();
        this.game.players = this.players;

        this.game.init();
        this.game.initGameState();

        this.loop = false;
        this.turns = 0;
    }

    get grid() { return this.game.grid }

    async start() {
        if (this.game.players.length !== 2)
            return console.error(`There must be 2 players to start the game`);
        
        this.loop = true;

        while(this.loop) {
            await new Promise(resolve => setTimeout(() => resolve(this.gameTurn()), this.gap));
        }
    }

    async gameTurn() {
        this.game.resetGameTurnData();

        for (let player of this.game.players) {
            player.sendInputLine(...this.game.getCurrentFrameInfoFor(player));
            await player.execute();
        }

        this.handlePlayerCommands();

        this.game.performGameUpdate();

        if (this.game.gameOver()) {
            this.loop = false;
            this.emit("gameover");  
        }
        this.emit("turn");
    }

    handlePlayerCommands() {
        for (let player of this.game.players) {
            CommandManager.handleCommands(player, player.outputs);
        }
    }
}