// App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BoardPage from "./pages/BoardPage";
import ProfilePage from "./pages/ProfilePage";
import RequireAuth from "./components/auth/RequireAuth";
import SharedDocument from "./pages/SharedDocumentPage";

export default function App() {
  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-[#0f1115]">
      <main className="h-full">
        <Routes>
          {/* Home público: lista proyectos y plantillas */}
          <Route path="/" element={<HomePage />} />

          {/* Board con :documentId (recomendado) */}
          <Route
            path="/Board/:documentId"
            element={
              <RequireAuth>
                <BoardPage />
              </RequireAuth>
            }
          />

          {/* OPCIONAL: Board leyendo ?doc=<id> o ?id=<id> */}
          <Route
            path="/Board"
            element={
              <RequireAuth>
                <BoardPage />
              </RequireAuth>
            }
          />

          {/* Perfil (protegido) */}
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

          <Route path="/" element={<HomePage />} />
          <Route path="/templates" element={<HomePage />} />
          <Route path="/documents" element={<HomePage />} />
          <Route path="/shared/:token" element={<SharedDocument />} />
        </Routes>
      </main>
    </div>
  );
}
