import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string; // debe venir definido en persistidos
}

interface ShareLink {
  id: string;
  token: string;
  permission: "read" | "edit";
  expiresAt: string | null;
  createdAt: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  documentId,
}: ShareModalProps) {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [permission, setPermission] = useState<"read" | "edit">("read");
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");

  const hasDoc = Boolean(documentId);

  const loadShares = async () => {
    if (!hasDoc) return;
    try {
      const { data } = await api.get(`/documents/${documentId}/shares`);
      setShareLinks(data);
    } catch (error) {
      console.error("Error loading shares:", error);
    }
  };

  const createShare = async () => {
    if (!hasDoc) {
      alert("El documento aún no está guardado.");
      return;
    }
    setLoading(true);
    try {
      const payload: any = { permission };
      if (expiresAt) payload.expiresAt = expiresAt;
      if (password) payload.password = password;

      const { data } = await api.post(
        `/documents/${documentId}/share`,
        payload
      );

      await navigator.clipboard.writeText(data.shareUrl);
      alert("¡Link copiado al portapapeles!");

      await loadShares();

      setPermission("read");
      setExpiresAt("");
      setPassword("");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error creando link");
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (linkId: string) => {
    if (!hasDoc) return;
    try {
      await api.delete(`/documents/shares/${linkId}`);
      await loadShares();
    } catch {
      alert("Error revocando link");
    }
  };

  // Cargar cada vez que se abre y hay documentId
  useEffect(() => {
    if (isOpen && hasDoc) loadShares();
  }, [isOpen, hasDoc, documentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-[#1a1a1a] p-6 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Compartir documento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {!hasDoc ? (
          <div className="rounded border border-yellow-600 bg-yellow-500/10 p-4 text-sm text-yellow-300">
            Este documento aún no está guardado. Guarda primero para generar un
            link de compartido.
          </div>
        ) : (
          <>
            {/* Crear nuevo link */}
            <div className="mb-6 space-y-4 rounded border border-gray-600 p-4">
              <h3 className="font-medium">Crear nuevo link</h3>

              <div>
                <label className="block text-sm text-gray-300">Permiso</label>
                <select
                  value={permission}
                  onChange={(e) =>
                    setPermission(e.target.value as "read" | "edit")
                  }
                  className="w-full rounded bg-gray-700 p-2"
                >
                  <option value="read">Solo lectura</option>
                  <option value="edit">Edición</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300">
                  Expira (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded bg-gray-700 p-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300">
                  Contraseña (opcional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dejar vacío para acceso libre"
                  className="w-full rounded bg-gray-700 p-2"
                />
              </div>

              <button
                onClick={createShare}
                disabled={loading}
                className="w-full rounded bg-blue-600 p-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creando..." : "Crear y copiar link"}
              </button>
            </div>

            {/* Links existentes */}
            <div>
              <h3 className="mb-2 font-medium">Links activos</h3>
              {shareLinks.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No hay links compartidos
                </p>
              ) : (
                <div className="space-y-2">
                  {shareLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between rounded bg-gray-800 p-2 text-sm"
                    >
                      <div>
                        <span className="font-mono text-xs text-gray-300">
                          ...{link.token.slice(-8)}
                        </span>
                        <span className="ml-2 text-blue-400">
                          {link.permission}
                        </span>
                        {link.expiresAt && (
                          <span className="ml-2 text-yellow-400">
                            Expira:{" "}
                            {new Date(link.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => revokeShare(link.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Revocar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
