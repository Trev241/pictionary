const WebSocket = require("ws");
const words = require("./data/words.json");

const getRandomWord = () => {
  return words[Math.floor(Math.random() * words.length)];
};

class Room {
  static maxConnections = 5;

  // Game states
  static GAME_WAITING = "GAME_WAITING";
  static GAME_ONGOING = "GAME_ONGOING";

  constructor() {
    this.id = Math.floor(Math.random() * 500);

    this.connections = new Set();
    this.players = new Array();
    this.completed = new Set();
    this.drawerIndex = -1;
    this.maxRounds = 3;
    this.round = 0;
    this.roundTime = 10;
    this.deadline = 0;
    this.word = getRandomWord();
    this.gameState = Room.GAME_WAITING;
    this.timeoutId = null;

    // Bind methods
    this.join = this.join.bind(this);
    this.start = this.start.bind(this);
    this.leave = this.leave.bind(this);
    this.finish = this.finish.bind(this);
    this.nextTurn = this.nextTurn.bind(this);
    this.broadcast = this.broadcast.bind(this);
    this.appointHost = this.appointHost.bind(this);
  }

  appointHost() {
    // Appoint the first player as the room's host
    if (this.players.length > 0)
      this.players[0].send(JSON.stringify({ type: "ROOM_APPOINT_AS_HOST" }));
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
      player: { name: ws.handle },
      players: this.players.map((player, idx) => ({
        name: player.handle,
        score: player.score,
        isDrawing: this.drawerIndex === idx,
      })),
      status: this.gameState,
      word: this.word,
      deadline: this.deadline,
    });

    this.appointHost();
  }

  leave(ws) {
    const playerIdx = this.players.indexOf(ws);
    this.players.splice(playerIdx, 1);
    this.connections.delete(ws);
    ws.roomId = null;

    // Notify leave
    this.broadcast({
      type: "ROOM_MEMBER_LEAVE",
      player: { name: ws.handle },
      players: this.players.map((player, idx) => ({
        name: player.handle,
        score: player.score,
        isDrawing: this.drawerIndex === idx,
      })),
    });

    // Prevent next player's turn from getting skipped if the player who left was drawing
    if (playerIdx === this.drawerIndex) {
      this.drawerIndex--;
      this.nextTurn();
    }

    this.appointHost();
  }

  nextTurn() {
    // Clear previous round timer
    clearTimeout(this.timeoutId);

    // Notify previous player that their turn has ended
    if (this.drawerIndex >= 0)
      this.players[this.drawerIndex].send(
        JSON.stringify({ type: "GAME_END_TURN" })
      );

    // Go to next turn or round or conclude game
    // this.drawerIndex = (this.drawerIndex + 1) % this.players.length;
    this.drawerIndex++;
    if (this.drawerIndex === this.players.length) {
      this.round++; // Advance round if last player has finished their turn
      this.drawerIndex %= this.players.length; // Cycle turn back to first player
    }

    // Conclude the game if all rounds are over or if only one player is left
    if (this.players.length === 1 || this.round >= this.maxRounds) {
      this.finish();
      return;
    } else this.timeoutId = setTimeout(this.nextTurn, this.roundTime * 1000);

    // Next word
    const currentTime = Date.now();
    this.deadline =
      currentTime + (1000 - (currentTime % 1000)) + this.roundTime * 1000;

    this.word = getRandomWord();
    this.broadcast({
      type: "GAME_NEXT_WORD",
      word: this.word,
      deadline: this.deadline,
      drawer: this.drawerIndex,
      round: this.round,
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

    // Reset scores
    for (let i = 0; i < this.players.length; i++) this.players[i].score = 0;

    this.gameState = Room.GAME_ONGOING;
    this.nextTurn();

    this.broadcast({
      type: "GAME_START",
      players: this.players.map((player, idx) => ({
        name: player.handle,
        score: player.score,
        isDrawing: this.drawerIndex === idx,
      })),
    });
  }

  finish() {
    // Rest for next game
    this.gameState = Room.GAME_WAITING;
    this.drawerIndex = -1;
    this.round = 0;
    this.completed.clear();

    this.broadcast({ type: "GAME_END" });
  }

  onmessage(ws, message) {
    switch (message.type) {
      case "CHAT_PUBLIC_CLIENT_MESSAGE":
        if (
          message.text.toUpperCase() === this.word.toUpperCase() &&
          !this.completed.has(ws) &&
          this.gameState === Room.GAME_ONGOING
        ) {
          // Client guessed the word
          this.completed.add(ws);

          // Update client's score based on remaining time left
          const roundTimeMs = this.roundTime * 1000;
          const startTime = this.deadline - roundTimeMs;
          const points = Math.round(
            (100.0 * (roundTimeMs - Date.now() + startTime)) / roundTimeMs
          );

          const player = this.players.find((player) => ws === player);
          player.score = (player.score || 0) + points;

          // Broadcast scores
          this.broadcast({
            type: "GAME_SUCCESSFUL_GUESS",
            guesser: ws.handle,
            players: this.players.map((player, idx) => ({
              name: player.handle,
              score: player.score,
              isDrawing: this.drawerIndex === idx,
            })),
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
        this.maxRounds = Math.min(10, Math.max(1, message.rounds));
        this.roundTime = Math.min(180, Math.max(10, message.roundTime));
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
