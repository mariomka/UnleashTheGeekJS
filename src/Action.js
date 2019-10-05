const Item = require("./Item");

class Action {
    constructor() {
        this.isMove = false;
        this.isDig  = false;
        this.isRequest = false;

        this.item   = Item.NONE;
        
        /** @type {import("./Coord")} */
        this.target = null;
    }
}

Action.NONE = new Action();

Action.Dig  = class DigAction extends Action {

    /** @param {import("./Coord")} target */
    constructor(target) {
        super();
        this.target = target;
        this.isDig  = true;
    }
}

Action.Move = class MoveAction extends Action {

    /** @param {import("./Coord")} dist */
    constructor(dist) {
        super();
        this.dist = dist;
        this.isMove  = true;

        /** @type {import("./Coord")[]} */
        this.path = null;
    }
}

Action.Request = class RequestionAction extends Action {

    /** @param {number} item */
    constructor(item) {
        super();
        this.item = item;
        this.isRequest = true;
    }
}

module.exports = Action;