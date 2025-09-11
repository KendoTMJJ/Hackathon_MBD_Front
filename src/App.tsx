import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage/LandingPage";
import SharedDocumentPage from "./pages/SharedDocumentPage";
import RequireAuth from "./components/auth/RequireAuth";
import BoardPage from "./pages/BoardPage";
import ProfilePage from "./pages/ProfilePage";
import "./i18n";

export default function App() {
  return (
    <div
      className="w-screen min-h-screen overflow-x-hidden overflow-y-auto"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      <main className="min-h-dvh">
        <Routes>
          {/* Landing principal (página pública de marketing) */}
          <Route path="/" element={<LandingPage />} />
          {/* Público */}
          <Route path="/" element={<HomePage />} />
          <Route path="/templates" element={<HomePage />} />
          <Route path="/documents" element={<HomePage />} />
          <Route path="/shared/:token" element={<SharedDocumentPage />} />{" "}
          {/* Zona de app */}
          <Route
            path="/home"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route
            path="/templates"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route
            path="/documents"
            element={
              <RequireAuth>
                <HomePage />
              </RequireAuth>
            }
          />
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
          {/* Fallback: rutas desconocidas -> Home (no a la landing) */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}
