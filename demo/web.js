const express = require("express");

express()
    .use("/", express.static(`${__dirname}/../web`))
    .listen(80, () => console.log("Server open"));