import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";

import "./App.css";
import Game from "./pages/Game";
import Home from "./pages/Home";
import Error from "./pages/Error";
import { UserProvider } from "./components/UserProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import NavigationBar from "./components/NavigationBar";

function App() {
  useWebSocket("ws://localhost:8080", {
    onOpen: () => {
      console.log("Connection established");
    },
    share: true,
  });

  return (
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <div className="flex flex-col h-screen">
            <NavigationBar />
            {/* Introducing min-h-0 is necessary to prevent children from exceeding flex-grow's height */}
            <div className="dark:bg-gray-800 dark:text-white flex-grow">
              <Routes>
                <Route element={<Home />} path="/" index />
                <Route element={<Game />} path="/game" />
                <Route element={<Error />} path="*" />
              </Routes>
            </div>
          </div>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
