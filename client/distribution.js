const Constants = require("../src/Constants");
const Referee = require("../src/Referee");
const Player = require("../src/Player");
const SIMULATIONS = 100000;

let p1 = new Player(), p2 = new Player();

const Grid = Array.from({ length: Constants.MAP_HEIGHT }).map(() => []);

for (let y = 0; y < Constants.MAP_HEIGHT; y++) {
    for (let x = 0; x < Constants.MAP_WIDTH; x++) {
        Grid[y].push(0);
    }
}

const referee = new Referee(p1, p2);

const TILE_SIZE = 40;

window.onload = async () => {

    let status = document.createElement("h1");
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    canvas.width  = canvas.style.width  = Constants.MAP_WIDTH  * TILE_SIZE;
    canvas.height = canvas.style.height = Constants.MAP_HEIGHT * TILE_SIZE;

    document.body.appendChild(status);
    document.body.appendChild(canvas);

    const simulate = i => {
        referee.reset();
        referee.grid.cells.forEach(c => Grid[c.y][c.x] += c.ore && 1);
    
        if (!(i % 1000)) {
            status.innerHTML = `Running Simulation ${i || 1}`;
            requestAnimationFrame(() => simulate(i + 1));
            return;
        }

        if (i < SIMULATIONS) {
            setImmediate(() =>simulate(i + 1));
            return;
        }

        console.log("Here's the grid if you want to do anything with it (window.grid)", Grid);
        window.grid = Grid;
    
        for (let y in Grid) {
            let row = Grid[y];
            for (let x in row) {
                let ore = row[x];
                let freq = ore / SIMULATIONS;
                let greyScale = ~~(500 * freq);
                let color = `rgb(${greyScale},${greyScale},${greyScale})`;
    
                ctx.fillStyle = color;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                ctx.strokeStyle = "2px black";
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    
                ctx.fillStyle = greyScale > 255 / 2 ? "black" : "white";
                ctx.textAlign = "center";
                ctx.font = "Arial 14px";
                ctx.fillText(freq.toFixed(4), x * TILE_SIZE + TILE_SIZE / 2, 
                    y * TILE_SIZE + TILE_SIZE / 2 + 7);
            }
        }
    }

    simulate(0);
}