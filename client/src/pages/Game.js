import { useContext, useEffect, useReducer, useRef } from "react";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { useNavigate, useSearchParams } from "react-router-dom";

import { UserContext } from "../components/UserProvider";
import "./Game.css";
import Canvas from "../components/Canvas";
import Modal from "../components/Modal";
import useTimer from "../hooks/useTimer";
import { INITIAL_STATE, gameReducer } from "../reducers/gameReducer";

function Game() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatRef = useRef();

  const { user } = useContext(UserContext);
  const { seconds, setDeadline } = useTimer(Date.now());
  const { lastJsonMessage, readyState, sendJsonMessage } = useWebSocket(
    "ws://localhost:8080",
    {
      share: true,
    }
  );

  const ordinalSuffixOf = (i) => {
    var j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return i + "st";
    }
    if (j === 2 && k !== 12) {
      return i + "nd";
    }
    if (j === 3 && k !== 13) {
      return i + "rd";
    }
    return i + "th";
  };

  // Join room
  useEffect(() => {
    if (readyState !== WebSocket.OPEN || !user) return;

    sendJsonMessage({
      type: "ROOM_JOIN",
      name: user,
      id: searchParams.get("id"),
    });
  }, [searchParams, readyState, user, sendJsonMessage]);

  // Listen for game and chat related messages
  useEffect(() => {
    if (readyState !== WebSocket.OPEN || !lastJsonMessage) return;

    switch (lastJsonMessage.type) {
      case "ROOM_MEMBER_JOIN":
      case "GAME_NEXT_WORD":
        dispatch({
          type: lastJsonMessage.type,
          payload: lastJsonMessage,
        });
        setDeadline(lastJsonMessage.deadline);
        break;
      case "CHAT_PUBLIC_SERVER_MESSAGE":
      case "CHAT_PUBLIC_CLIENT_MESSAGE":
      case "GAME_START":
      case "GAME_END":
      case "GAME_START_TURN":
      case "GAME_END_TURN":
      case "ROOM_MEMBER_LEAVE":
      case "ROOM_APPOINT_AS_HOST":
        dispatch({
          type: lastJsonMessage.type,
          payload: lastJsonMessage,
        });
        break;
      case "ROOM_JOIN_FAILURE":
        navigate("/error");
        break;
      default:
        console.warn(`Received unknown message type ${lastJsonMessage.type}`);
        break;
    }
  }, [lastJsonMessage, readyState, navigate, setDeadline]);

  // Send a message to the server when the form is submitted
  const handleSubmit = (event) => {
    event.preventDefault();
    const message = {
      sender: user,
      type: "CHAT_PUBLIC_CLIENT_MESSAGE",
      text: state.inputMessage,
    };
    sendJsonMessage(message);
    // setInputValue("");
    dispatch({ type: "CHAT_TYPE_MESSAGE", payload: "" });
  };

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTo(0, chatRef.current.scrollHeight);
  }, [state.messages]);

  const handleStart = () => {
    sendJsonMessage({
      type: "GAME_REQUEST_START",
      rounds: state.rounds,
      roundTime: state.roundTime,
    });
  };

  return (
    <div className="grid grid-cols-12 h-full gap-1">
      {!user && <Modal />}
      <div className="lg:col-span-9 max-lg:col-span-12 flex flex-col justify-center p-3">
        <div className="relative z-0">
          <div className="flex gap-4 mb-4">
            <div className="bg-amber-100 dark:bg-gray-900 p-4 text-center rounded-s-2xl flex-grow">
              <h1 className="text-center flex-grow">Round {state.round + 1}</h1>
              <h1 className="text-4xl mb-3 text-center font-bold tracking-widest">
                {state.status === "GAME_WAITING"
                  ? "WAITING FOR PLAYERS"
                  : state.isDrawing
                  ? state.word.toUpperCase()
                  : state.word
                      .split("")
                      .map(() => "_")
                      .join("")}
              </h1>
              <h1>
                <span className="font-semibold">
                  {state.players.filter((player) => player.isDrawing)[0]
                    ?.name || "No one"}
                </span>{" "}
                is now drawing
              </h1>
            </div>

            <div className="flex justify-center items-center w-40 p-4 text-6xl bg-amber-100 dark:bg-gray-900 rounded-e-2xl">
              {seconds}
            </div>
          </div>
          <div className="relative z-0">
            <Canvas enabled={state.isDrawing} />
            {state.status === "GAME_WAITING" && (
              <div className="absolute inset-0 flex justify-center items-center rounded-2xl bg-gray-800 dark:bg-black bg-opacity-30 dark:bg-opacity-60 z-50">
                {state.isHost ? (
                  <div className="flex flex-col bg-amber-200 dark:bg-gray-900 rounded-lg p-8 shadow-xl">
                    <h1 className="text-3xl mb-6 font-semibold">
                      Room Settings
                    </h1>

                    <div className="flex w-96 justify-between gap-4 mb-2">
                      <h1>Number of rounds</h1>
                      <select
                        className="p-1 rounded dark:bg-gray-800"
                        value={state.rounds}
                        onChange={(e) =>
                          dispatch({
                            type: "CHANGE_NUMBER_OF_ROUNDS",
                            payload: e.target.value,
                          })
                        }
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex w-96 justify-between gap-4 mb-4">
                      <h1>Time per round (seconds)</h1>
                      <select
                        className="rounded p-1 dark:bg-gray-800"
                        value={state.roundTime}
                        onChange={(e) =>
                          dispatch({
                            type: "CHANGE_ROUND_TIME",
                            payload: e.target.value,
                          })
                        }
                      >
                        {[10, 15, 30, 45, 60, 120, 180].map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      className="bg-green-600 hover:bg-green-500 px-8 py-2 text-2xl rounded-lg text-white"
                      onClick={handleStart}
                    >
                      Start
                    </button>
                  </div>
                ) : (
                  <h1 className="text-xl">Waiting for host to begin...</h1>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-wrap mt-8">
          {state.players.map((player, idx) => (
            <div
              key={idx}
              className={`w-44 bg-amber-300 dark:bg-gray-900 p-4 rounded-2xl flex-grow flex items-center shadow-md ${
                player.isDrawing && "bg-amber-500 dark:bg-green-600"
              }`}
              style={{ flexBasis: idx < 3 ? "30%" : "auto" }}
            >
              {ordinalSuffixOf(idx + 1)}
              &nbsp;&nbsp;
              <span className="text-xl overflow-hidden">{player.name}</span>
              <span className="ms-auto">{player.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3 max-lg:col-span-12 flex">
        <div className="flex flex-col flex-1 justify-end h-screen max-h-screen max-lg:max-h-96 max-w-full overflow-y-auto bg-amber-100 dark:bg-gray-900 m-3 rounded shadow-md">
          <div ref={chatRef} className="overflow-y-auto max-h-full px-3 my-4">
            <ul className="flex flex-col justify-end">
              {state.messages.map((message, idx) => (
                <li
                  key={idx}
                  className={`flex break-words ${message.style} ${
                    idx % 2 && "bg-amber-200 dark:bg-gray-800"
                  } px-4 py-2 mb-3 border border-x-0 border-t-0 border-amber-200 dark:border-gray-800`}
                >
                  <div className="max-w-full break-words">
                    <span className="font-semibold">
                      {message.sender && message.sender + ": "}
                    </span>
                    {message.text}
                    {/* <span className="ms-auto">{new Date().toLocaleString()}</span> */}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <form className="m-3" onSubmit={handleSubmit}>
            <input
              className="border border-gray-500 rounded p-2 w-full max-w-full dark:bg-gray-700 dark:border-gray-800 focus:outline-none"
              type="text"
              value={state.inputMessage}
              onChange={(e) =>
                dispatch({ type: "CHAT_TYPE_MESSAGE", payload: e.target.value })
              }
              placeholder="Type a message..."
            />
          </form>
        </div>
      </div>
    </div>
  );
}

export default Game;
