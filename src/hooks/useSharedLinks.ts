// src/hooks/useSharedLinksApi.ts
import { useApi } from "./useApi";

export type CreateSharedLinkDto = {
  documentId: string;
  permission: "read" | "edit"; // front
  expiresAt?: string | null;
  password?: string | null;
  maxUses?: number | null;
  // opcional: scope si tu back lo necesita explícito
  // scope?: "document" | "project";
};

type ShareLink = {
  id: string;
  slug?: string;
  token?: string;
  permission?: "read" | "edit";
  minRole?: "reader" | "editor";
  expiresAt?: string | null;
  isActive?: boolean;
  createdAt?: string;
  uses?: number;
  maxUses?: number | null;
  documentId?: string;
};

type CreateShareResponse =
  | { shareUrl: string; link?: ShareLink }
  | { token?: string; slug?: string; link?: ShareLink };

export function useSharedLinksApi() {
  const api = useApi();
  const base = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, "");

  const mapPermissionToMinRole = (p: "read" | "edit"): "reader" | "editor" =>
    p === "edit" ? "editor" : "reader";

  return {
    /** Crea link (JWT) */
    async create(dto: CreateSharedLinkDto) {
      // Si tu back espera minRole/scope, mapea aquí:
      const payload = {
        documentId: dto.documentId,
        // scope: dto.scope ?? "document",
        minRole: mapPermissionToMinRole(dto.permission),
        expiresAt: dto.expiresAt ?? null,
        password: dto.password ?? null,
        maxUses: dto.maxUses ?? null,
      };
      const { data } = await api.post<CreateShareResponse>(
        "/share-links",
        payload
      );
      return data;
    },

    /** Lista por documento (JWT) */
    async listByDocument(documentId: string) {
      const { data } = await api.get<ShareLink[]>("/share-links", {
        params: { documentId },
      });
      return data;
    },

    /** Revocar (JWT) */
    async revoke(linkId: string) {
      await api.patch(`/share-links/${linkId}`, { isActive: false });
    },

    /** Preview público (SIN JWT) con fallback al legado */
    async previewPublic(token: string, password?: string) {
      const tryFetch = async (url: string) => {
        const res = await fetch(url, {
          headers: password ? { "x-shared-password": password } : undefined,
          credentials: "include",
        });
        return res;
      };

      // intento 1: nuevo
      let res = await tryFetch(`${base}/share-links/${token}`);

      // 403 => password requerida
      if (res.status === 403) return { status: 403 } as const;

      // 404 => probar legado
      if (res.status === 404) {
        res = await tryFetch(`${base}/shared/${token}`);
        if (res.status === 403) return { status: 403 } as const;
      }

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Preview failed ${res.status}: ${msg}`);
      }

      const data = (await res.json()) as ShareLink;
      return { status: 200, data } as const;
    },
  };
}
