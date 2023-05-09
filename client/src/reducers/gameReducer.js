const INITIAL_STATE = {
  messages: [],
  inputMessage: "",
  word: "",
  status: "GAME_WAITING",
  isDrawing: false,
  players: [],
  round: 1,
};

function gameReducer(state, action) {
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
      return {
        ...state,
        players: action.payload.players,
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
    default:
      return state;
  }
}

export { INITIAL_STATE, gameReducer };
