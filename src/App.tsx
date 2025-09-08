// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import BoardPage from "./Pages/BoardPage";
import ProfilePage from "./Pages/ProfilePage";
import LandingPage from "./Pages/LandingPage/LandingPage";
import RequireAuth from "./components/auth/RequireAuth";

export default function App() {
  return (
    <div
      className="w-screen min-h-screen overflow-x-hidden overflow-y-auto"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      <main className="min-h-dvh">
        <Routes>
          {/* Landing principal */}
          <Route path="/" element={<LandingPage />} />

          {/* Home (opcional) */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/templates" element={<HomePage />} />
          <Route path="/documents" element={<HomePage />} />

          {/* Board protegido */}
          <Route
            path="/Board/:documentId"
            element={
              <RequireAuth>
                <BoardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/Board"
            element={
              <RequireAuth>
                <BoardPage />
              </RequireAuth>
            }
          />

          {/* Perfil protegido */}
          <Route
            path="/profile"
            element={
              <RequireAuth redirectTo="/profile">
                <ProfilePage />
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
