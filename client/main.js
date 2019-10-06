const GUI = require("./gui");
const Referee = require("../src/Referee");

window.onload = async () => {
    let referee = new Referee();

    let gui = new GUI(referee);

    await gui.init();

    // referee.start();
}