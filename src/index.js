//
// Starting point

const WSServer = require("./WSServer")

const port = parseInt(process.env.PORT) || 8089
const server = new WSServer(port)
