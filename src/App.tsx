import BoardPage from "./pages/BoardPage"
import HomePage from "./pages/HomePage"
import { Route, Routes } from "react-router-dom"
import RequireAuth from "./components/auth/RequireAuth"
import NavBar from "./components/public/NavBar"
import ProfilePage from "./pages/ProfilePage"

function App() {
  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      <NavBar />
      <div className="px-4 py-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Board" element={<RequireAuth><BoardPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth redirectTo="/profile"><ProfilePage /></RequireAuth>} />
        </Routes>
      </div>
    </div>
  )
}
export default App