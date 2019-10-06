const TILE_SIZE = 61;
const Coord = require("../src/Coord");

module.exports = class Tile {
    
    /**
     * @param {import("./gui")} gui
     * @param {import("../src/Cell")} cell
     */
    constructor(gui, cell) {
        this.gui = gui;
        this.cell = cell;
        this.gfx = new PIXI.Graphics();
        this.gui.tileContainer.addChild(this.gfx);


        this.gfx.position.set(this.x * TILE_SIZE, this.y * TILE_SIZE);
        this.gfx.interactive = true;
        this.gfx.hitArea = new PIXI.Rectangle(0, 0, TILE_SIZE, TILE_SIZE);
        this.gfx.on("mousemove", event => {
            this.gui.tileover(this, event.data.global.x, event.data.global.y);
        });
        this.gfx.pivot.set(TILE_SIZE / 2, TILE_SIZE / 2);

        this.update();
    }

    get x() { return this.cell.x }
    get y() { return this.cell.y }
    get game() { return this.gui.referee.game }

    clear() {
        this.gfx.clear();
    }

    drawHole() {

    }

    drawFrame() {
        this.gfx.lineStyle(1, 0);
        this.gfx.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
    }

    drawOre() {
        let sprite = this.gui.getElement("Cristal_2");
        
        this.gfx.beginTextureFill(sprite.texture);
        this.gfx.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
        this.gfx.endFill();
        this.gfx.angle = [0, 90, 180, 270][~~(Math.random() * 4)];
    }

    drawRadar() {
        this.gfx.beginTextureFill(this.gui.getElement("Radar"));
        this.gfx.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
        this.gfx.endFill();
    }

    update() {
        this.clear();
        this.drawFrame();

        // Hole changed
        if (this.cell.hole) {
            this.drawHole();
        }

        if (this.cell.ore) {
            this.drawOre();
        }

        // Radar appeared
        if (this.game.grid.hasRadar(new Coord(this.cell.x, this.cell.y))) {
            this.drawRadar();
        }

        // Radar BOOM
        if (this.lastCell && 
               !this.game.grid.hasRadar(new Coord(this.lastCell.x, this.lastCell.y)) && 
                this.game.grid.hasRadar(new Coord(this.cell.x, this.cell.y))) {
            // this.drawRadar();
        }
        
        this.lastCell = Object.assign({}, this.cell);
    }
}

module.exports.SIZE = TILE_SIZE;