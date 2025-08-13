import BoardPage from "./pages/BoardPage";
import HomePage from "./pages/HomePage";
import { Route, Routes } from "react-router-dom";
import RequireAuth from "./components/auth/RequireAuth";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-[#0f1115]">
      <main>
        <Routes>
          <Route path="/" element={<HomePage />}></Route>
          <Route path="/Board" element={<BoardPage />}></Route>
          <Route
            path="/profile"
            element={
              <RequireAuth redirectTo="/profile">
                <ProfilePage />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
export default App;
