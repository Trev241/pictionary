import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";

import { UserContext } from "../components/UserProvider";

function Home() {
  const { user, setUser } = useContext(UserContext);
  const { lastJsonMessage, sendJsonMessage } = useWebSocket(
    "ws://localhost:8080",
    {
      share: true,
    }
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (!lastJsonMessage) return;

    switch (lastJsonMessage.type) {
      case "ROOM_CREATE_SUCCESS":
        navigate(`/game?id=${lastJsonMessage.id}`);
        break;
      case "ROOM_JOIN_FAILURE":
        navigate("/error");
        break;
      case "ROOM_JOIN_SUCCESS":
        break;
      default:
        console.warn(`Received unknown message type ${lastJsonMessage.type}`);
        break;
    }
  }, [lastJsonMessage, navigate]);

  const handleCreate = async () => {
    // ws.current.send(JSON.stringify({ type: "ROOM_CREATE" }));
    sendJsonMessage({ type: "ROOM_CREATE" });
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div>
        <h1 className="text-3xl font-bold mb-12">
          What name would you like to go by?
        </h1>

        <div className="flex flex-col">
          <input
            className="mb-8 text-center block w-full p-4 border border-gray-500 rounded dark:text-black"
            type="text"
            value={user}
            placeholder="cool quirky name"
            onChange={(e) => setUser(e.target.value)}
          />
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-2"
            onClick={handleCreate}
          >
            Create Room
          </button>
          {/* <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleJoin}
          >
            Join
          </button> */}
        </div>
      </div>
    </div>
  );
}

export default Home;
