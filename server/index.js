const WebSocket = require("ws");
const Room = require("./room");

// Create a new server
const wss = new WebSocket.Server({ port: 8080 });
let rooms = {};

// Listen for new connections
wss.on("connection", (ws) => {
  console.log(
    `Client connected. Total number of connections: ${wss.clients.size}`
  );

  // Listen for messages from the client
  ws.on("message", (message) => {
    message = JSON.parse(message);
    console.log(message);

    switch (message.type) {
      case "ROOM_CREATE":
        const room = new Room();
        rooms[room.id] = room;
        ws.send(
          JSON.stringify({
            type: "ROOM_CREATE_SUCCESS",
            id: room.id,
          })
        );
        console.log(`Created room ${room.id}`);
        break;

      case "ROOM_LEAVE":
        rooms[message.id].leave(ws);
        break;

      case "ROOM_JOIN":
        const reply = {};
        try {
          ws.handle = message.name;
          rooms[message.id].join(ws);
          reply.type = "ROOM_JOIN_SUCCESS";
        } catch (err) {
          console.error(err);
          reply.type = "ROOM_JOIN_FAILURE";
          reply.text = err;
        } finally {
          ws.send(JSON.stringify(reply));
        }
        break;

      default:
        try {
          rooms[ws.roomId].onmessage(ws, message);
        } catch (err) {
          console.error(err);
          ws.send(JSON.stringify({ type: "ROOM_DOES_NOT_EXIST" }));
        }
        break;
    }
  });

  // Listen for disconnections
  ws.on("close", () => {
    console.log(
      `Client disconnected. Existing connections: ${wss.clients.size}`
    );

    if (ws.roomId && rooms[ws.roomId]) {
      const roomId = ws.roomId;
      rooms[roomId].leave(ws);

      // Destroy room if no players are left
      if (rooms[roomId].connections.size <= 0) {
        rooms[roomId] = null;
        console.log("Empty room destroyed. Existing rooms:");
        console.log(rooms);
      }
    }
  });
});

wss.broadcast = (message, filter = () => true) => {
  Array.from(wss.clients)
    .filter(filter)
    .forEach((client) => {
      if (client.readyState === WebSocket.OPEN)
        client.send(JSON.stringify(message));
    });
};
