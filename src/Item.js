const Constants = require("./Constants");

class Item {
    /** @param {number} typeId */
    constructor(typeId) {
        this.typeId = typeId;
    }
}

module.exports = {
    ORE:   new Item(Constants.TYPE_ORE),
    TRAP:  new Item(Constants.TYPE_TRAP),
    NONO:  new Item(Constants.TYPE_NONE),
    RADAR: new Item(Constants.TYPE_RADAR),
}
