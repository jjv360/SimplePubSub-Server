![](https://img.shields.io/badge/status-ready-brightgreen.svg)

# Simple Pub/Sub - Server

This server provides a simple WebSocket interface for subscribing to channels, and posting and receiving messages to certain channels.

# Run on Docker

```sh
# Build the image
$ docker build . -t pubsub

# Run the image
$ docker run -d -p :8089:8089 --name pubsub --rm pubsub --restart=always
```

# Messaging API

```js
// Subscribe to a channel
{ action: "join", channel: "xxx" }

// Unsubscribe from a channel
{ action: "leave", channel: "xxx" }

// Send a message to a channel
{ action: "post", channel: "xxx", data: ... }

// Receive a message
{ channel: "xxx", data: ... }
```
