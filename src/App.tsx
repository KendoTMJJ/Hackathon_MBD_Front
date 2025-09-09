// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import BoardPage from "./Pages/BoardPage";
import ProfilePage from "./Pages/ProfilePage";
import LandingPage from "./Pages/LandingPage/LandingPage";
import RequireAuth from "./components/auth/RequireAuth";
import ThemeToggle from "./components/home/ThemeToggle";
import SharedDocumentPage from "./pages/SharedDocumentPage"; // ⬅️ NUEVO

import "./theme.css";

export default function App() {
  return (
    <div
      className="w-screen min-h-screen overflow-x-hidden overflow-y-auto"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      <main className="min-h-dvh">
        <Routes>
          {/* Público */}
          <Route path="/" element={<HomePage />} />
          <Route path="/templates" element={<HomePage />} />
          <Route path="/documents" element={<HomePage />} />
          <Route path="/shared/:token" element={<SharedDocumentPage />} />{" "}
          {/* ⬅️ NUEVO */}
          {/* Protegido */}
=======
          {/* Landing principal */}
          <Route path="/" element={<LandingPage />} />

          {/* Home (opcional) */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/templates" element={<HomePage />} />
          <Route path="/documents" element={<HomePage />} />

          {/* Board protegido */}
>>>>>>> ea76df76abe91c5a5d3293577789f62ff7746924
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
<<<<<<< HEAD
=======

          {/* Perfil protegido */}
>>>>>>> ea76df76abe91c5a5d3293577789f62ff7746924
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
