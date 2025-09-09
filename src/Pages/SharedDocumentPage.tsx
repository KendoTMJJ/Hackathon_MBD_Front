// src/pages/SharedDocumentPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FlowCanvas from "../components/flow/FlowCanvas";
import { useSharedLinksApi } from "../hooks/useSharedLinks";

type Perm = "read" | "edit";

export default function SharedDocumentPage() {
  const { token } = useParams<{ token: string }>();
  const linksApi = useSharedLinksApi();

  const [docId, setDocId] = useState<string | null>(null);
  const [permission, setPermission] = useState<Perm>("read");
  const [needPw, setNeedPw] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (p?: string) => {
    setError(null);
    setLoading(true);

    if (!token) {
      setError("Token inválido.");
      setLoading(false);
      return;
    }

    try {
      const res = await linksApi.previewPublic(token, p);

      if (res.status === 403) {
        setNeedPw(true);
        setLoading(false);
        return;
      }

      const link = res.data!;
      setDocId(link.documentId ?? null);
      setPermission(
        (link.permission ??
          (link.minRole === "editor" ? "edit" : "read")) as Perm
      );
      setNeedPw(false);
    } catch (err: any) {
      console.error("Error loading shared link:", err);
      setError(err.message || "Error al cargar el link compartido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Sincroniza ?id=<docId> (opcional)
  useEffect(() => {
    if (!docId) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("id") !== docId) {
      url.searchParams.set("id", docId);
      window.history.replaceState({}, "", url.toString());
    }
  }, [docId]);

  if (loading) {
    return (
      <div className="w-screen h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documento compartido...</p>
        </div>
      </div>
    );
  }

  if (needPw) {
    return (
      <div className="w-screen h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Documento protegido
          </h2>
          <p className="text-gray-600 mb-4">
            Este documento requiere una contraseña para acceder.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(pw);
            }}
          >
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ingresa la contraseña"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              disabled={loading}
            >
              {loading ? "Verificando..." : "Acceder"}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Error de acceso
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => load()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!docId) {
    return (
      <div className="w-screen h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando documento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-[100dvh]">
      <FlowCanvas
        mode="shared"
        initialPermission={permission}
        sharedToken={token!}
        sharedPassword={pw || undefined}
        documentIdOverride={docId}
      />
    </div>
  );
}
