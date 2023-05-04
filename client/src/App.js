import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";

import './App.css';
import Game from "./pages/Game";
import Home from "./pages/Home";
import Error from "./pages/Error";
import { UserProvider } from "./components/UserProvider";

function App() {
  useWebSocket("ws://localhost:8080", {
    onOpen: () => {
      console.log("Connection established");
    },
    share: true
  });

  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route element={<Home />} path="/" index />
          <Route element={<Game />} path="/game" />
          <Route element={<Error />} path="*" />
        </Routes>
      </UserProvider>
    </BrowserRouter>    
  )
}

export default App;
