//
// Handled WebSocket connections

const Log = require("./Log").wrap("WSServer")
const http = require("http")
const express = require("express")
const WebSocket = require("ws")
const bodyParser = require('body-parser');

module.exports = class WSServer {

  constructor(port) {

    // Stores all active connections
    this.connections = []

    // Stores all buffers used by the HTTP API
    this.buffers = []

    // Create Express server
    this.express = express()
    this.express.use(bodyParser.json());

    // Create HTTP server
    this.httpServer = http.createServer(this.express);

    // Create websocket server
    this.wss = new WebSocket.Server({ server: this.httpServer })

    // Add WebSocket event listeners
    this.wss.on("connection", this.onConnection.bind(this))
    this.wss.on("error", err => Log.error("Backend socket error: " + (err.message || err)))

    // Add a post message handler
    this.express.post("/message", this.onHTTPMessage.bind(this))

    // Add a buffer fetch handler
    this.express.post("/fetch", this.onHTTPFetch.bind(this))

    // Start listening
    Log.info("Starting server on port " + port)
    this.httpServer.listen(port, e => {
      Log.info("Server is up")
    })

    // Send ping to all clients every 5 seconds
    this.pingTimer = setInterval(this.sendPings.bind(this), 5000)

  }

  /** Sends a ping to all clients */
  sendPings() {

    try {

      // Send a ping to all WebSocket connections
      for (var conn of this.connections)
        conn.ping()

      // Remove all buffers which are old
      for (var i = 0 ; i < this.buffers.length ; i++)
        if (this.buffers[i].lastActive + 1000 * 60 * 5 < Date.now())
          this.buffers.splice(i--, 1)

    } catch (e) {
      Log.warning("Unable to send pings! " + e.message)
    }

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
      this.gotMessage(msg.channel, msg.data)

    } else {

      // Unknown action
      Log.warning("Client sent unknown action " + msg.action)

    }

  }

  /** Called when a message is received on a channel */
  gotMessage(channel, data) {

    // Send to WebSocket clients
    var payload = JSON.stringify({ channel: channel, data: data })
    for (var client of this.connections)
      if (client.channels.includes(channel))
        client.send(payload)

    // Append to buffers
    for (var buffer of this.buffers) {

      // Check if listening to this channel
      if (!buffer.channels.includes(channel))
        continue

      // Ensure we don't run out of memory, limit buffer size
      if (buffer.messages.length > 1024 * 4)
        continue

      // Append to buffer
      buffer.messages.push(payload)

    }

  }

  /** Called when the HTTP POST /message endpoint is called */
  onHTTPMessage(req, res) {

    // Post to all listeners
    Log.debug("Client posted message via HTTP to channel " + req.body.channel)
    this.gotMessage(req.body.channel, req.body.data)

    // Return success
    res.json({
      success: true
    })

  }

  /** Called when the HTTP POST /fetch endpoint is called. */
  onHTTPFetch(req, res) {

    // Get buffer
    var buffer = this.buffers.find(b => b.id == req.body.id)

    // Create buffer if necessary
    if (!buffer) {

      // Create it
      buffer = { id: req.body.id, lastActive: 0, channels: [], messages: [] }
      Log.debug("Created HTTP buffer " + buffer.id)
      this.buffers.push(buffer)

    }

    // Update list of listening channels
    buffer.channels = req.body.channels || buffer.channels

    // Return list of messages
    res.json({
      success: true,
      messages: buffer.messages
    })

    // Empty out messages and update last active date
    buffer.messages = []
    buffer.lastActive = Date.now()

  }

}
