const GUI = require("./gui");
const Referee = require("../src/Referee");
const Player = require("../src/Player");

window.onload = async () => {

    
    let p1 = new Player();
    let p2 = new Player();
    
    let referee = new Referee(p1, p2);

    let gui = new GUI(referee);

    await gui.init();

    // referee.start();
}