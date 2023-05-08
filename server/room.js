const WebSocket = require("ws");
const words = require("./data/words.json");

const getRandomWord = () => {
  return words[Math.floor(Math.random() * words.length)];
};

class Room {
  static maxConnections = 5;

  // Game states
  static GAME_WAITING = 0;
  static GAME_ONGOING = 1;

  constructor() {
    this.id = Math.floor(Math.random() * 500);

    this.connections = new Set();
    this.players = new Array();
    this.completed = new Set();
    this.drawerIndex = -1;
    this.maxRounds = 3;
    this.round = 0;
    this.roundTime = 10;
    this.word = getRandomWord();
    this.gameState = Room.GAME_WAITING;

    // Bind methods
    this.join = this.join.bind(this);
    this.start = this.start.bind(this);
    this.leave = this.leave.bind(this);
    this.finish = this.finish.bind(this);
    this.nextTurn = this.nextTurn.bind(this);
    this.broadcast = this.broadcast.bind(this);
  }

  join(ws) {
    if (this.connections.size >= Room.maxConnections)
      throw new Error(`Room limit reached`);

    // Avoid pushing duplicate connections
    if (!this.connections.has(ws)) this.players.push(ws);
    this.connections.add(ws);
    ws.roomId = this.id;

    // Notify join
    this.broadcast({
      type: "ROOM_MEMBER_JOIN",
      players: this.players.map((player) => ({
        name: player.handle,
        score: player.score,
        state: this.gameState,
      })),
    });
  }

  leave(ws) {
    this.connections.delete(ws);
    this.players.splice(this.players.indexOf(ws), 1);
    ws.roomId = undefined;

    // Notify leave
    this.broadcast({
      type: "ROOM_MEMBER_LEAVE",
      players: this.players.map((player, idx) => ({
        name: player.handle,
        score: player.score,
      })),
    });
  }

  nextTurn() {
    // Notify previous player that their turn has ended
    if (this.drawerIndex >= 0)
      this.players[this.drawerIndex].send(
        JSON.stringify({ type: "GAME_END_TURN" })
      );

    // Go to next turn or round or conclude game
    this.drawerIndex = (this.drawerIndex + 1) % this.players.length;
    if (this.drawerIndex === 0 && ++this.round >= this.maxRounds) {
      this.finish();
      return;
    } else setTimeout(this.nextTurn, this.roundTime * 1000);

    // Next word
    this.word = getRandomWord();
    this.broadcast({
      type: "GAME_NEXT_WORD",
      word: this.word,
      drawer: this.drawerIndex,
    });

    // Notify next player that their turn has begun
    this.players[this.drawerIndex].send(
      JSON.stringify({ type: "GAME_START_TURN" })
    );
    this.completed.clear();
    this.completed.add(this.players[this.drawerIndex]);

    console.log(this.drawerIndex + "/" + this.players.length);
  }

  start() {
    if (this.connections.size <= 1) {
      this.broadcast({
        type: "CHAT_PUBLIC_SERVER_MESSAGE",
        text: "There must be at least two players before the game can start!",
      });
      return;
    }

    this.gameState = Room.GAME_ONGOING;
    this.nextTurn();

    this.broadcast({ type: "GAME_START" });
  }

  finish() {
    // Rest for next game
    this.gameState = Room.GAME_WAITING;
    this.round = this.drawerIndex = -1;
    this.completed.clear();

    this.broadcast({ type: "GAME_END" });
  }

  onmessage(ws, message) {
    switch (message.type) {
      case "CHAT_PUBLIC_CLIENT_MESSAGE":
        if (
          message.text === this.word &&
          !this.completed.has(ws) &&
          this.gameState === Room.GAME_ONGOING
        ) {
          // Client guessed the word
          this.completed.add(ws);
          this.broadcast({
            type: "CHAT_PUBLIC_SERVER_MESSAGE",
            text: `${message.sender} guessed the word!`,
          });

          // Check if everyone has guessed
          if (this.completed.size === this.connections.size) this.nextTurn();
        } else {
          // Set filter if client already guessed
          this.broadcast(
            message,
            this.completed.has(ws)
              ? (client) => this.completed.has(client)
              : () => true
          );
        }
        break;

      case "CANVAS_CLEAR":
      case "CANVAS_UPDATE":
        this.broadcast(message);
        break;

      case "GAME_REQUEST_START":
        this.start();
        break;

      default:
        console.warn(`Received unknown message type ${message.type}`);
        break;
    }
  }

  broadcast(message, filter = () => true) {
    Array.from(this.connections)
      .filter(filter)
      .forEach((connection) => {
        if (connection.readyState === WebSocket.OPEN)
          connection.send(JSON.stringify(message));
      });
  }
}

module.exports = Room;
