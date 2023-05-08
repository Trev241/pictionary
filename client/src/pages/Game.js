import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { MdClear } from "react-icons/md";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { useNavigate, useSearchParams } from "react-router-dom";

import { UserContext } from "../components/UserProvider";
import useFabric from "../hooks/useFabric";
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

  const canvasRef = useRef(null);

  const colors = {
    "bg-black": "#000000",
    "bg-yellow-300": "#FDE047",
    "bg-red-600": "#DC2626",
    "bg-rose-500": "#F43F5E",
    "bg-blue-500": "#3B82F6",
    "bg-blue-950": "#172554",
    "bg-green-600": "#16A34A",
    "bg-violet-700": "#6D28D9",
    "bg-white": "#FFFFFF",
    "bg-orange-500": "#F97316",
    "bg-orange-800": "#9A3412",
    "bg-gray-500": "#6B7280",
    "bg-gray-800": "#1F2937",
    "bg-lime-600": "#65A30D",
    "bg-green-800": "#166534",
    "bg-pink-400": "#F472B6",
  };

  // const ref = useFabric(
  //   useCallback(
  //     (fabricCanvas) => {
  //       fabricCanvas.setWidth(
  //         document.getElementById("canvas-container").offsetWidth
  //       );
  //       fabricCanvas.isDrawingMode = true;
  //       fabricCanvas.freeDrawingBrush.width = 10;
  //       fabricCanvas.on("mouse:up", () =>
  //         sendJsonMessage({
  //           type: "CANVAS_UPDATE",
  //           canvas: fabricCanvas.toDatalessJSON(),
  //         })
  //       );
  //       canvasRef.current = fabricCanvas;
  //     },
  //     [sendJsonMessage]
  //   )
  // );

  // // Register listener
  // useEffect(() => {
  //   const resizeCanvas = () => {
  //     if (canvasRef.current)
  //       canvasRef.current.setWidth(
  //         document.getElementById("canvas-container").offsetWidth
  //       );
  //   };
  //   window.addEventListener("resize", resizeCanvas);
  //   return () => window.removeEventListener("resize", resizeCanvas);
  // }, []);

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
      default:
        console.warn(`Received unknown message type ${lastJsonMessage.type}`);
        break;
    }
  }, [lastJsonMessage, readyState, navigate]);

  // Listen for canvas related messages
  // useEffect(() => {
  //   if (!canvasRef || !lastJsonMessage) return;

  //   switch (lastJsonMessage.type) {
  //     case "CANVAS_UPDATE":
  //       canvasRef.current.loadFromJSON(lastJsonMessage.canvas);
  //       break;
  //     case "CANVAS_CLEAR":
  //       canvasRef.current.clear();
  //       break;
  //     case "GAME_START_TURN":
  //       canvasRef.current.isDrawingMode = true;
  //       setIsDrawing(true);
  //       break;
  //     case "GAME_END_TURN":
  //       canvasRef.current.isDrawingMode = false;
  //       setIsDrawing(false);
  //       break;
  //     default:
  //       console.warn(`Received unknown message type ${lastJsonMessage.type}`);
  //       break;
  //   }
  // }, [lastJsonMessage, canvasRef]);

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
    // <div className="grid grid-cols-12 min-h-screen">
    //   <div className="max-lg:col-span-12 lg:col-span-2">
    //     <div className="p-4">
    //       <h1 className="text-2xl">Room</h1>
    //     </div>
    //   </div>

    //   <div className="max-lg:col-span-12 lg:col-span-8 flex flex-col justify-center items-center overflow-auto max-h-screen">
    //     {/* CANVAS */}
    //     <div>
    //       <div className="text-center p-4 mb-4">
    //         {gameState === "GAME_WAITING" ? (
    //           <h1 className="text-4xl font-bold tracking-wider">
    //             WAITING FOR PLAYERS
    //           </h1>
    //         ) : (
    //           <>
    //             <h1>You have to {isDrawing ? "draw" : "guess"}</h1>
    //             <h1 className="text-4xl font-bold tracking-widest">
    //               {isDrawing
    //                 ? word.toUpperCase()
    //                 : word
    //                     .split("")
    //                     .map(() => "_")
    //                     .join("")}
    //             </h1>
    //           </>
    //         )}
    //       </div>
    //       <div className="relative z-0">
    //         <canvas
    //           ref={ref}
    //           width="768"
    //           height="640"
    //           className="border border-gray-500 rounded mb-4"
    //         />
    //         {gameState === "GAME_WAITING" && (
    //           <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-60 z-50">
    //             <button
    //               className="bg-green-500 hover:bg-green-700 p-4 px-12 text-2xl tracking-widest rounded text-white"
    //               onClick={handleStart}
    //             >
    //               START
    //             </button>
    //           </div>
    //         )}
    //       </div>

    //       {/* TOOLS */}
    //       <div className={`${!isDrawing && "invisible"}`}>
    //         <div className="mt-6 font-semibold">
    //           Slide to adjust brush width
    //           <input
    //             className=""
    //             type="range"
    //             min="5"
    //             max="100"
    //             defaultValue="10"
    //             onChange={(e) =>
    //               (canvasRef.current.freeDrawingBrush.width = parseFloat(
    //                 e.target.value
    //               ))
    //             }
    //           />
    //         </div>
    //         <div className="flex align-middle w-full justify-between">
    //           <div className="flex flex-col">
    //             <div className="flex justify-evenly">
    //               {Object.keys(colors)
    //                 .slice(0, 8)
    //                 .map((tailwindClass) => (
    //                   <button
    //                     className={`w-8 h-8 m-1 rounded border border-gray-500 ${tailwindClass}`}
    //                     onClick={() =>
    //                       (canvasRef.current.freeDrawingBrush.color =
    //                         colors[tailwindClass])
    //                     }
    //                   />
    //                 ))}
    //             </div>
    //             <div className="flex justify-evenly">
    //               {Object.keys(colors)
    //                 .slice(8)
    //                 .map((tailwindClass) => (
    //                   <button
    //                     className={`w-8 h-8 m-1 rounded border border-gray-500 ${tailwindClass}`}
    //                     onClick={() =>
    //                       (canvasRef.current.freeDrawingBrush.color =
    //                         colors[tailwindClass])
    //                     }
    //                   />
    //                 ))}
    //             </div>
    //             <div className="flex items-center font-semibold">
    //               Click
    //               <input
    //                 type="color"
    //                 className="mx-2"
    //                 onChange={(e) =>
    //                   (canvasRef.current.freeDrawingBrush.color =
    //                     e.target.value)
    //                 }
    //               />
    //               to select from more colors
    //             </div>
    //           </div>
    //           <button
    //             className="bg-red-600 hover:bg-red-800 p-2 px-5 rounded text-white"
    //             onClick={() => sendJsonMessage({ type: "CANVAS_CLEAR" })}
    //           >
    //             <MdClear className="text-6xl" />
    //             Clear
    //           </button>
    //         </div>
    //       </div>
    //     </div>
    //   </div>

    //   <div className="max-lg:col-span-12 lg:col-span-2 flex flex-col justify-end border-l-2 border-gray-300 h-screen">
    //     <div className="mb-4 overflow-y-auto p-4">
    //       <ul className="flex flex-col justify-end">
    //         {messages.map((message, idx) => (
    //           <li
    //             key={idx}
    //             className={`${message.style} ${
    //               idx % 2 && "bg-gray-100"
    //             } p-1 px-2 rounded`}
    //           >
    //             <span className="font-bold">
    //               {message.sender ? `${message.sender}:` : ""}
    //             </span>{" "}
    //             {message.text}
    //           </li>
    //         ))}
    //       </ul>
    //     </div>
    //     <form className="w-full" onSubmit={handleSubmit}>
    //       <input
    //         className="border border-gray-500 rounded p-2 w-full max-w-full"
    //         type="text"
    //         value={inputValue}
    //         onChange={(e) => setInputValue(e.target.value)}
    //         placeholder="Type a message..."
    //       />
    //     </form>
    //   </div>
    // </div>

    // <div className="bg-gray-600 h-full max-h-full overflow-y-auto">
    //   {/* {[1, 2, 3, 4].map((i) => (
    //     <div className="p-96">{i}</div>
    //   ))} */}
    //   hello world
    // </div>
    <div className="grid grid-cols-12 h-full gap-1">
      {/* <div className="lg:col-span-3 max-lg:col-span-12 flex items-center p-4">
        <div className="flex-1">
          <ul>
            {players.map((player, idx) => (
              <li
                key={idx}
                className={`${
                  idx % 2
                    ? "bg-gray-100 dark:bg-gray-600"
                    : "bg-gray-200 dark:bg-gray-700"
                } rounded-3xl p-6 mb-1 hover:bg-gray-300 dark:hover:bg-gray-500 text-xl`}
              >
                {player}
              </li>
            ))}
          </ul>
        </div>
      </div> */}

      <div className="lg:col-span-9 max-lg:col-span-12 flex flex-col justify-center p-2">
        <h1 className="text-3xl text-center tracking-widest">
          WAITING FOR PLAYERS
        </h1>
        <div className="grid grid-cols-2 mb-3">
          <h1 className="my-auto">
            <span className="font-semibold">Alice</span> is now drawing
          </h1>
          <h1 className="my-auto ms-auto tracking-widest">00:00</h1>
        </div>
        <Canvas />
      </div>

      <div className="lg:col-span-3 max-lg:col-span-12 flex items-center dark:bg-gray-900">
        <div className="flex flex-col flex-1 justify-end h-screen max-h-screen max-lg:max-h-96 max-w-full overflow-y-auto dark:bg-gray-800 m-4 rounded-xl">
          <div className="overflow-y-auto max-h-full px-3 my-4">
            <ul className="flex flex-col justify-end">
              {messages.map((message, idx) => (
                <li
                  key={idx}
                  className={`flex break-words ${message.style} ${
                    idx % 2 && "bg-gray-200 dark:bg-gray-700"
                  } px-4 py-2 rounded-xl`}
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
