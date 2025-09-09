// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BoardPage from "./pages/BoardPage";
import ProfilePage from "./pages/ProfilePage";
import RequireAuth from "./components/auth/RequireAuth";
import ThemeToggle from "./components/home/ThemeToggle";
import SharedDocumentPage from "./pages/SharedDocumentPage"; // ⬅️ NUEVO

import "./theme.css";

export default function App() {
  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-[#0f1115]">
      <main className="h-full">
        <ThemeToggle />
        <Routes>
          {/* Público */}
          <Route path="/" element={<HomePage />} />
          <Route path="/templates" element={<HomePage />} />
          <Route path="/documents" element={<HomePage />} />
          <Route path="/shared/:token" element={<SharedDocumentPage />} />{" "}
          {/* ⬅️ NUEVO */}
          {/* Protegido */}
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
