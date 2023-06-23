const INITIAL_STATE = {
  messages: [],
  inputMessage: "",
  word: "",
  status: "GAME_WAITING",
  isDrawing: false,
  players: [],
  round: 0,
  rounds: 3,
  roundTime: 30,
  isHost: false,
};

function gameReducer(state, action) {
  let message;

  switch (action.type) {
    case "GAME_START":
    case "GAME_END":
      return {
        ...state,
        status: action.type === "GAME_START" ? "GAME_ONGOING" : "GAME_WAITING",
      };
    case "GAME_NEXT_WORD":
      const _players = state.players;
      _players.forEach((_player) => (_player.isDrawing = false));
      _players[action.payload.drawer].isDrawing = true;

      return {
        ...state,
        word: action.payload.word,
        messages: [...state.messages, { text: "A new word has been chosen." }],
        players: _players,
        round: action.payload.round,
      };
    case "GAME_START_TURN":
    case "GAME_END_TURN":
      return {
        ...state,
        isDrawing: action.type === "GAME_START_TURN",
      };
    case "ROOM_MEMBER_JOIN":
    case "ROOM_MEMBER_LEAVE":
      message = {
        text: `${action.payload.player.name} has ${
          action.type === "ROOM_MEMBER_JOIN" ? "joined" : "left"
        } the game.`,
        style: "font-semibold",
      };

      return {
        ...state,
        players: action.payload.players,
        messages: [...state.messages, message],
        status: action.payload.status || state.status,
        word: action.payload.word || state.word,
      };
    case "CHAT_PUBLIC_CLIENT_MESSAGE":
    case "CHAT_PUBLIC_SERVER_MESSAGE":
      if (action.type === "CHAT_PUBLIC_SERVER_MESSAGE")
        action.payload.style = "font-semibold";

      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case "CHAT_TYPE_MESSAGE":
      return {
        ...state,
        inputMessage: action.payload,
      };
    case "CHANGE_NUMBER_OF_ROUNDS":
      return {
        ...state,
        rounds: action.payload,
      };
    case "CHANGE_ROUND_TIME":
      return {
        ...state,
        roundTime: action.payload,
      };
    case "ROOM_APPOINT_AS_HOST":
      return {
        ...state,
        isHost: true,
      };
    case "GAME_SUCCESSFUL_GUESS":
      return {
        ...state,
        players: action.payload.players,
      };
    default:
      return state;
  }
}

export { INITIAL_STATE, gameReducer };
