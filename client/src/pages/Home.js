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

  const handleCreate = async (e) => {
    // ws.current.send(JSON.stringify({ type: "ROOM_CREATE" }));
    e.preventDefault();
    sendJsonMessage({ type: "ROOM_CREATE" });
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-8">
      <div className="z-10">
        <h1 className="text-5xl mb-3">Ready to play?</h1>
        <h2 className="text-xl mb-6">
          What would you like others to know you as?
        </h2>

        <form onSubmit={handleCreate} className="flex flex-col">
          <input
            className="mb-2 text-center p-2 border border-gray-500 rounded dark:bg-gray-700"
            type="text"
            value={user}
            placeholder="captain cool"
            onChange={(e) => setUser(e.target.value)}
          />
          <button className="bg-blue-500 hover:bg-blue-700 p-3 rounded">
            Create Room
          </button>
        </form>
      </div>
    </div>
  );
}

export default Home;
