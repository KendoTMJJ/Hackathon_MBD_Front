import BoardPage from "./pages/BoardPage";
import HomePage from "./pages/HomePage";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />}></Route>
      <Route path="/Board" element={<BoardPage />}></Route>
    </Routes>
  );
}

export default App;
