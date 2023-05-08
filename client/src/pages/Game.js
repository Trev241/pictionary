import { useContext, useEffect, useState } from "react";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { useNavigate, useSearchParams } from "react-router-dom";

import { UserContext } from "../components/UserProvider";
import "./Game.css";
import Canvas from "../components/Canvas";

function Game() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [word, setWord] = useState("");
  const [gameState, setGameState] = useState("GAME_WAITING");
  const [isDrawing, setIsDrawing] = useState(false);
  const [players, setPlayers] = useState([
    "Trev",
    "Vert",
    "Cow",
    "Dog",
    "Car",
    "Scooter",
    "Neeko",
    "Karma",
    "Wilson",
    "Willow",
  ]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { user } = useContext(UserContext);
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
    if (readyState !== WebSocket.OPEN) return;

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
      case "CHAT_PUBLIC_SERVER_MESSAGE":
        setMessages((messages) => [
          ...messages,
          { ...lastJsonMessage, style: "font-semibold" },
        ]);
        break;
      case "CHAT_PUBLIC_CLIENT_MESSAGE":
        setMessages((messages) => [...messages, lastJsonMessage]);
        break;
      case "GAME_NEXT_WORD":
        setWord(lastJsonMessage.word);
        setMessages((messages) => [
          ...messages,
          { text: "A new word has been chosen." },
        ]);
        break;
      case "GAME_START":
        setGameState("GAME_ONGOING");
        break;
      case "GAME_END":
        setGameState("GAME_WAITING");
        break;
      case "ROOM_JOIN_FAILURE":
        navigate("/error");
        break;
      case "GAME_START_TURN":
        setIsDrawing(true);
        break;
      case "GAME_END_TURN":
        setIsDrawing(false);
        break;
      default:
        console.warn(`Received unknown message type ${lastJsonMessage.type}`);
        break;
    }
  }, [lastJsonMessage, readyState, navigate]);

  // Send a message to the server when the form is submitted
  const handleSubmit = (event) => {
    event.preventDefault();
    const message = {
      sender: user,
      type: "CHAT_PUBLIC_CLIENT_MESSAGE",
      text: inputValue,
    };
    sendJsonMessage(message);
    setInputValue("");
  };

  const handleStart = () => {
    sendJsonMessage({ type: "GAME_REQUEST_START" });
  };

  return (
    <div className="grid grid-cols-12 h-full gap-1">
      <div className="lg:col-span-9 max-lg:col-span-12 flex flex-col justify-center p-2">
        <h1 className="text-3xl text-center font-bold tracking-widest">
          {gameState === "GAME_WAITING"
            ? "WAITING FOR PLAYERS"
            : isDrawing
            ? word.toUpperCase()
            : word
                .split("")
                .map(() => "_")
                .join("")}
        </h1>
        <div className="grid grid-cols-2 mb-3">
          <h1 className="my-auto">
            <span className="font-semibold">Alice</span> is now drawing
          </h1>
          <h1 className="my-auto ms-auto tracking-widest">00:00</h1>
        </div>
        <div className="relative z-0">
          <Canvas enabled={isDrawing} />
          {gameState === "GAME_WAITING" && (
            <div className="absolute inset-0 flex justify-center items-center rounded-2xl bg-black bg-opacity-60 z-50">
              <button
                className="bg-green-600 hover:bg-green-500 p-4 px-12 text-2xl tracking-widest rounded-2xl text-white"
                onClick={handleStart}
              >
                START GAME
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap mt-8">
          {players.map((player, idx) => (
            <div
              key={idx}
              className="w-44 bg-gray-300 dark:bg-gray-900 p-4 rounded-2xl m-1 flex-grow flex items-center shadow-md"
              // style={{ flexBasis: idx < 3 ? "30%" : "auto" }}
            >
              {ordinalSuffixOf(idx + 1)}
              &nbsp;&nbsp;
              <span className="text-xl overflow-hidden">{player}</span>
              <span className="ms-auto">43</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3 max-lg:col-span-12 flex items-center bg-gray-300 dark:bg-gray-900">
        <div className="flex flex-col flex-1 justify-end h-screen max-h-screen max-lg:max-h-96 max-w-full overflow-y-auto bg-gray-200 dark:bg-gray-800 m-3 rounded-xl">
          <div className="overflow-y-auto max-h-full px-3 my-4">
            <ul className="flex flex-col justify-end">
              {messages.map((message, idx) => (
                <li
                  key={idx}
                  className={`flex break-words ${message.style} ${
                    idx % 2 && ""
                  } px-4 py-2 mb-2 border border-x-0 border-t-0 border-gray-700`}
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
            />
          </form>
        </div>
      </div>
    </div>
  );
}

export default Game;
