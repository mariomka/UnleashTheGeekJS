/** @typedef {"Bleu_Creuse"| "Bleu_Deterre"| "Bleu_Enterre"| "Bleu_Roule"| 
    "Piege"| "Piege_Explosion"| "Radar"| "Rouge_Creuse"| "Rouge_Deterre"| "Rouge_Enterre"| "Rouge_Roule"} AnimationName */

/** @typedef {"Bras_Robot"|"Cristal"|"Cristal_2"|"Cristal_2_shadow"|"Cristal_3"|"Cristal_3_shadow"|"Hud_dessus_left"|
    "Hud_dessus_right"|"HUD_Piege_Off"|"HUD_Piege_Ok"|"HUD_Radar_Off"|"HUD_Radar_Ok"|"Piege"|"Piege_2"|"Radar"|"Radar_2"|"Terre"} ElementName */

const Tile = require("./tile");
const Coord = require("../src/Coord");

/** @typedef {{pos: Coord, lastPos: Coord, item: number, lastItem: number, owner: number}} DisplayAgent */

const OFFSET_X = 78  + Tile.SIZE / 2;
const OFFSET_Y = 154 + Tile.SIZE / 2;
const TOOLTIP_TEXT_PADDING = 5;
const MOUSE_OFFSET_X = 15;
const MOUSE_OFFSET_Y = 25;

module.exports = class GUI {

    /** @param {import("../src/Referee")} referee */
    constructor(referee) {

        this.referee = referee;

        /** @type {Object<string,PIXI.Texture>} */
        this.elements = {};
        /** @type {Object<string,PIXI.Texture[]} */
        this.animations = {};

        this.width  = 1920;
        this.height = 1080;

        /** @type {Tile[]} */
        this.tiles = [];

        this.xMin = OFFSET_X;
        this.yMin = OFFSET_Y;
        this.xMax = OFFSET_X + this.gameGrid.width  * Tile.SIZE;
        this.yMax = OFFSET_Y + this.gameGrid.height * Tile.SIZE;

        /** @type {Object<string,DisplayAgent>} */
        this.agents = {};

        referee.on("turn", () => {
            console.log(`Turn#${this.referee.turns} done`);
            this.updateAgents();
            this.updateAllCells();
        });

        window.game = this.game;
    }

    get gameGrid() {
        return this.referee.game.grid;
    }

    /** @param {ElementName} name */
    getElement(name) {
        return new PIXI.Sprite(this.elements[name]);
    }

    /** @param {AnimationName} name */
    getAnimation(name) {
        return new PIXI.AnimatedSprite(this.animations[name]);
    }

    get renderer() { return this.app.renderer; }
    get game() { return this.referee.game; }

    async init() {
        this.app = new PIXI.Application({
            width: this.width,
            height: this.height,
            antialias: true
        });

        this.renderer.plugins.interaction.moveWhenInside = true;

        document.body.appendChild(this.app.view);

        const loader = new PIXI.Loader();
        loader.add("elems", "./assets/img/elems.json");
        
        await new Promise(resolve => loader.load(resolve));

        let elemTextures = loader.resources.elems.textures;

        for (let k in elemTextures) {
            let texture = elemTextures[k];
            this.elements[k] = texture;
        }

        loader.add("sheet", "./assets/img/sprites.json");
        
        await new Promise(resolve => loader.load(resolve));

        let sheet = loader.resources.sheet.textures;

        /** @type {Object<string,PIXI.Texture[]} */
        let textureArrays = {};
        for (let k in sheet) {
            let key = k.replace(/\d/g, "");
            if (!textureArrays[key])
                textureArrays[key] = [];
            
            let texture = sheet[k];
            textureArrays[key].push(texture);
        }

        for (let key in textureArrays) {
            this.animations[key] = textureArrays[key];
        }

        loader.add("background", "./assets/img/Background.jpg");
        loader.add("hud_left", "./assets/img/Hud_left.png");
        loader.add("hud_top", "./assets/img/Hud_top.png");
        
        await new Promise(resolve => loader.load(resolve));

        this.background = new PIXI.Sprite(loader.resources.background.texture);
        this.hud_left   = new PIXI.Sprite(loader.resources.hud_left.texture);
        this.hud_top    = new PIXI.Sprite(loader.resources.hud_top.texture);

        this.tooltip = new PIXI.Graphics();
        this.tooltip.beginFill(0, .75);
        this.tooltip.drawRect(0, 0, 100, 120);
        this.tooltip.endFill();
        this.tooltip.zIndex = 10;
        this.tooltipText = new PIXI.Text("", { fontFamily : 'Arial', fontSize: 24, fill: 0xffffff, align: 'left' });
        this.tooltipText.position.set(TOOLTIP_TEXT_PADDING, TOOLTIP_TEXT_PADDING);
        this.tooltip.addChild(this.tooltipText);

        this.tooltip.alpha = 0;
        this.tooltipText.alpha = 0;

        this.app.stage.sortableChildren = true;
        this.app.stage.addChild(this.tooltip);

        this.setupStage();
    }

    setupStage() {
        this.app.stage.addChild(this.background, this.hud_left, this.hud_top);
        this.tileContainer = new PIXI.Container();
        this.tileContainer.position.set(OFFSET_X, OFFSET_Y);
        this.app.stage.addChild(this.tileContainer);

        for (let cell of this.referee.game.grid.cells) {
            this.addTile(cell);
        }

        this.updateAgents();

        this.background.alpha = 0.8;
        this.background.interactive = true;
        this.background.hitArea = new PIXI.Rectangle(0, 0, this.background.width, this.background.height);
        this.background.on("mouseover", event => {
            if (event.data.global.x < this.xMin || event.data.global.y < this.yMin ||
                event.data.global.x < this.xMax || event.data.global.y > this.yMax) {
                this.tooltip.alpha = 0;
                this.tooltipText.alpha = 0;
            } else {
                this.tooltip.alpha = 1;
                this.tooltipText.alpha = 1;
            }
        });
    }

    /** @param {import("../src/Cell")} cell */
    addTile(cell) {
        this.tiles.push(new Tile(this, cell));
    }

    get xLimit() {
        return this.referee.game.grid.width * Tile.SIZE + OFFSET_X - this.tooltip.width;
    }

    get yLimit() {
        return this.referee.game.grid.height * Tile.SIZE + OFFSET_Y - this.tooltip.height;
    }

    /**
     * @param {Tile} tile 
     * @param {number} x 
     * @param {number} y 
     */
    tileover(tile, x, y) {

        x += MOUSE_OFFSET_X;
        y += MOUSE_OFFSET_Y;

        this.tooltip.alpha = 1;
        this.tooltipText.alpha = 1;
        this.tooltipText.text = `x: ${tile.x}\ny: ${tile.y}\nore: ${tile.cell.ore}`;

        let radarResult = this.referee.game.grid.hasRadar(new Coord(tile.x, tile.y));
        if (radarResult) {
            this.tooltipText.text += `\nRADAR (${["blue", "red"][radarResult[0]]} player)`;
        } else {
            let trapResult = this.referee.game.grid.hasTrap(new Coord(tile.x, tile.y));

            if (trapResult)
                this.tooltipText.text += `\nTRAP (${["blue", "red"][trapResult[o]]} player)`;
        }

        this.tooltipText.calculateBounds();

        this.tooltip.clear();
        this.tooltip.beginFill(0, .75);
        this.tooltip.drawRect(0, 0, this.tooltipText.width + 2 * TOOLTIP_TEXT_PADDING, 
            this.tooltipText.height + 2 * TOOLTIP_TEXT_PADDING);
        this.tooltip.endFill();
        this.tooltip.calculateBounds();

        this.tooltip.pivot.set(x > this.xLimit ? this.tooltip.width  : 0, 0);
        this.tooltip.position.set(x, Math.min(y, this.yLimit));
    }

    updateAgents() {
        
        this.game.allAgents.forEach(agent => {
            
            let obj = this.agents[agent.id];
            if (obj) {

                obj.lastPos = obj.pos.clone();
                obj.pos = agent.pos.clone();
                obj.lastItem = obj.item;
                obj.item = agent.inventory;

            } else {

                let sprite = this.getAnimation(agent.owner.index ? 
                    "Bleu_Roule" : "Rouge_Roule");

                sprite.pivot.set(Tile.SIZE / 2, Tile.SIZE / 2);

                sprite.width = 1.2 * Tile.SIZE;
                sprite.height = 1.2 * Tile.SIZE;

                sprite.position.set(agent.pos.x * Tile.SIZE, 
                    agent.pos.y * Tile.SIZE);

                sprite.angle = 90;

                this.tileContainer.addChild(sprite);

                this.agents[agent.id] = {
                    owner: agent.owner,
                    lastPos: agent.pos.clone(),
                    pos: agent.pos.clone(),
                    item: agent.inventory,
                    lastItem: agent.inventory,
                    sprite
                };
                
                sprite.play();
            }
        });

        this.drawAgents(0);
    }

    drawAgents(delta) {
        for (let id in this.agents) {

        }
    }

    updateAllCells() {
        this.tiles.forEach(tile => tile.update());
    }
}