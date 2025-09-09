// components/modals/ShareModal.tsx
import { useEffect, useMemo, useState } from "react";
import { useApi } from "../../hooks/useApi";

type Permission = "read" | "edit";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

interface ShareLink {
  id: string;
  token?: string; // back puede tener token
  slug?: string; // o slug
  permission?: Permission; // legacy
  minRole?: "editor" | "reader"; // o minRole
  expiresAt?: string | null;
  isActive?: boolean;
  createdAt?: string;
  uses?: number;
  maxUses?: number | null;
}

export default function ShareModal({
  isOpen,
  onClose,
  documentId,
}: ShareModalProps) {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [permission, setPermission] = useState<Permission>("edit");
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");

  const baseHost = useMemo(() => window.location.origin, []);

  async function load() {
    if (!documentId) return;
    try {
      // ✅ LISTAR
      const { data } = await api.get("/share-links", {
        params: { documentId },
      });

      setLinks(data ?? []);
    } catch (err) {
      console.error("Error loading shares:", err);
    }
  }

  async function create() {
    if (!documentId) {
      alert("Guarda el documento antes de compartir.");
      return;
    }
    setLoading(true);
    try {
      // ✅ CREAR
      const payload: any = {
        documentId,
        permission, // "read" | "edit"
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        password: password || null,
        maxUses: maxUses ? Number(maxUses) : null,
      };
      const { data } = await api.post(`/share-links`, payload);

      // el back puede devolver {shareUrl} o {token/slug}
      const token =
        data?.token ?? data?.slug ?? data?.link?.token ?? data?.link?.slug;
      const shareUrl = data?.shareUrl ?? `${baseHost}/shared/${token}`;

      await navigator.clipboard.writeText(shareUrl);
      alert("¡Link copiado al portapapeles!\n" + shareUrl);

      setPermission("edit");
      setExpiresAt("");
      setPassword("");
      setMaxUses("");

      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Error creando link");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: string) {
    try {
      // ✅ REVOCAR (usa PATCH o DELETE según tu back; aquí PATCH marca inactivo)
      await api.patch(`/share-links/${id}`, { isActive: false });
      await load();
    } catch {
      alert("Error revocando link");
    }
  }

  useEffect(() => {
    if (isOpen && documentId) load();
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-[#1a1a1a] p-6 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Compartir documento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {!documentId ? (
          <div className="rounded border border-yellow-600 bg-yellow-500/10 p-4 text-sm text-yellow-300">
            Guarda el documento para poder generar un link.
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-4 rounded border border-gray-600 p-4">
              <h3 className="font-medium">Crear nuevo link</h3>

              <label className="block text-sm">
                <span className="text-gray-300">Permiso</span>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as Permission)}
                  className="mt-1 w-full rounded bg-gray-700 p-2"
                >
                  <option value="edit">Edición</option>
                  <option value="read">Solo lectura</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-gray-300">Expira (opcional)</span>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1 w-full rounded bg-gray-700 p-2"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-300">Contraseña (opcional)</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded bg-gray-700 p-2"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-300">Usos máx. (opcional)</span>
                <input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="mt-1 w-full rounded bg-gray-700 p-2"
                />
              </label>

              <button
                onClick={create}
                disabled={loading}
                className="w-full rounded bg-blue-600 p-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creando..." : "Crear y copiar link"}
              </button>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Links activos</h3>
              {links.length === 0 ? (
                <p className="text-sm text-gray-400">No hay links</p>
              ) : (
                <div className="space-y-2">
                  {links.map((l) => {
                    const t = l.token ?? l.slug;
                    const url = `${baseHost}/shared/${t}`;
                    const perm =
                      l.permission ??
                      (l.minRole === "editor" ? "edit" : "read");
                    return (
                      <div
                        key={l.id}
                        className="flex items-center justify-between rounded bg-gray-800 p-2 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-xs text-gray-300 break-all">
                            {url}
                          </div>
                          <div className="text-xs text-gray-400">
                            permiso:{" "}
                            <span className="text-blue-300">{perm}</span>
                            {l.expiresAt
                              ? ` · expira: ${new Date(
                                  l.expiresAt
                                ).toLocaleString()}`
                              : ""}
                            {l.maxUses
                              ? ` · usos: ${l.uses ?? 0}/${l.maxUses}`
                              : ""}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(url)}
                            className="text-sky-400 hover:text-sky-300"
                          >
                            Copiar
                          </button>
                          <button
                            onClick={() => revoke(l.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Revocar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
