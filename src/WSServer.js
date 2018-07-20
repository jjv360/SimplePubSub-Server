//
// Handled WebSocket connections

const Log = require("./Log").wrap("WSServer")
const WebSocket = require("ws")

module.exports = class WSServer {

  constructor(port) {

    // Stores all active connections
    this.connections = []

    // Create websocket server
    Log.info("Starting server on port " + port)
    this.wss = new WebSocket.Server({ port })

    // Add event listeners
    this.wss.on("connection", this.onConnection.bind(this))
    this.wss.on("error", err => Log.error("Backend socket error: " + (err.message || err)))
    this.wss.on("listening", e => Log.info("Server is up"))

  }

  /** Called when a new websocket connection is received */
  onConnection(ws) {

    // Store connection
    Log.debug("Client connected")
    this.connections.push(ws)

    // Create list of subscribed channels
    ws.channels = []

    // Add event listeners
    ws.on("message", this.onMessage.bind(this, ws))
    ws.on("close", this.onClose.bind(this, ws))
    ws.on("error", err => Log.warn("Client error: " + (err.message || err)))

  }

  /** Called when a client connection is closed */
  onClose(ws, code, reason) {

    // Remove connection
    var idx = this.connections.indexOf(ws)
    if (idx != -1)
      this.connections.splice(idx, 1)

    Log.debug(`Client disconnected, reason: ${code} ${reason}`)

  }

  /** Called when a message is received from a client */
  onMessage(ws, msg) {

    // Decode message
    try {
      msg = JSON.parse(msg)
    } catch (e) {
      Log.warning("Client sent non-JSON data")
      return
    }

    // Check what they wanted
    if (msg.action == "join") {

      // They want to register on a channel
      Log.debug("Client joined channel " + msg.channel)
      if (!ws.channels.includes(msg.channel))
        ws.channels.push(msg.channel)

    } else if (msg.action == "leave") {

      // They want to unregister from a channel
      Log.debug("Client left channel " + msg.channel)
      var idx = ws.channels.indexOf(msg.channel)
      if (idx != -1)
        ws.channels.splice(idx, 1)

    } else if (msg.action == "post") {

      // They want to post a message on a channel, send to all interested connections
      Log.debug("Client posted message to channel " + msg.channel)
      var payload = JSON.stringify({ channel: msg.channel, data: msg.data })
      for (var client of this.connections)
        if (client != ws && client.channels.includes(msg.channel))
          client.send(payload)

    } else {

      // Unknown action
      Log.warning("Client sent unknown action " + msg.action)

    }

  }

}
