import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import "./App.css";
import Game from "./pages/Game";
import Home from "./pages/Home";
import Error from "./pages/Error";
import { UserProvider } from "./components/UserProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import NavigationBar from "./components/NavigationBar";
import Sky from "./components/Sky";
import { useState } from "react";

function App() {
  const [connStatus, setConnStatus] = useState("CONNECTING");

  useWebSocket(process.env.REACT_APP_WEBSOCKET_URL, {
    onOpen: () => setConnStatus("CONNECTION_OPEN"),
    onClose: () => setConnStatus("CONNECTION_CLOSED"),
    onError: () => setConnStatus("CONNECTION_ERROR"),
    onReconnectStop: () => setConnStatus("RECONNECTION_STOP"),
    reconnectAttempts: 5,
    share: true,
  });

  return (
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <div className="flex flex-col h-screen">
            <NavigationBar />
            <div className="bg-amber-50 dark:from-blue-950 dark:to-gray-950 bg-gradient-to-t dark:text-white flex-grow">
              {connStatus === "CONNECTION_OPEN" && (
                /* Introducing min-h-0 is necessary to prevent children from exceeding flex-grow's height */
                <>
                  <Sky />
                  <Routes>
                    <Route element={<Home />} path="/" index />
                    <Route element={<Game />} path="/game" />
                    <Route element={<Error />} path="*" />
                  </Routes>
                </>
              )}

              {(connStatus === "CONNECTION_ERROR" ||
                connStatus === "RECONNECTION_STOP" ||
                connStatus === "CONNECTION_CLOSED") && (
                <Error
                  title="Connection Error"
                  body="Could not connect to the server. Refresh the page and try again later."
                />
              )}

              {connStatus === "CONNECTING" && (
                <div className="flex justify-center items-center h-full">
                  Connecting to server...
                </div>
              )}
            </div>
          </div>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
