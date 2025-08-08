import BoardPage from "./Pages/BoardPage";
import HomePage from "./Pages/HomePage";
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
