// src/hooks/useSheets.ts
import { create } from "zustand";
import { useApi } from "./useApi";
import type {
  SheetEntity,
  CreateSheetRequest,
  UpdateSheetRequest,
} from "../models";

/** Normaliza un Sheet desde camel o snake (defensivo) */
function normalizeSheet(raw: any): SheetEntity {
  return {
    id: raw.id ?? raw.cod_sheet ?? raw.sheet_id,
    documentId: raw.documentId ?? raw.document_id,
    name: raw.name ?? raw.title ?? raw.name_sheet,
    data: raw.data ?? raw.data_sheet ?? {},
    orderIndex: raw.orderIndex ?? raw.order_index ?? raw.position ?? 0,
    isActive: raw.isActive ?? raw.is_active ?? true,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    version: raw.version ?? 0, // 👈 importante para colab/concurrencia
  } as SheetEntity;
}

/* ================== STORE PARA LA HOJA ABIERTA (Editor) ================== */

type State = { sheet?: SheetEntity; loading: boolean; error?: string };
type Actions = {
  setApiReady: (fn: () => ReturnType<typeof useApi>) => void;
  load: (sheetId: string) => Promise<void>;
  applyLocalPatch: (patch: Partial<SheetEntity["data"]>) => void;
  save: () => Promise<void>;
  setSheet: (sheet?: SheetEntity) => void;
  setName: (name: string) => void;
  setOrderIndex: (idx: number) => void;
  clearError: () => void;
};

// pequeña inyección para usar el mismo axios del resto de la app
let getApi: null | (() => ReturnType<typeof useApi>) = null;

export const useSheetStore = create<State & Actions>((set, get) => ({
  sheet: undefined,
  loading: false,
  error: undefined,

  setApiReady(fn) {
    getApi = fn;
  },

  async load(sheetId) {
    if (!getApi) throw new Error("API no inicializada");
    set({ loading: true, error: undefined });
    try {
      const api = getApi();
      const { data } = await api.get(`/documents/sheets/${sheetId}`);
      set({ sheet: normalizeSheet(data), loading: false });
    } catch (e: any) {
      set({
        error: e?.message ?? "Error al cargar la hoja",
        loading: false,
      });
    }
  },

  applyLocalPatch(patch) {
    const sheet = get().sheet;
    if (!sheet) return;
    set({
      sheet: { ...sheet, data: { ...(sheet.data ?? {}), ...(patch ?? {}) } },
    });
  },

  async save() {
    if (!getApi) throw new Error("API no inicializada");
    const sheet = get().sheet;
    if (!sheet) return;
    try {
      const api = getApi();
      const body: UpdateSheetRequest = {
        name: sheet.name,
        data: sheet.data,
        orderIndex: sheet.orderIndex,
      };
      const { data } = await api.patch(`/documents/sheets/${sheet.id}`, body);
      set({ sheet: normalizeSheet(data), error: undefined });
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 409 || s === 412) {
        // conflicto → rehídrata
        const api = getApi();
        const { data } = await api.get(`/documents/sheets/${sheet.id}`);
        set({
          sheet: normalizeSheet(data),
          error: "Conflicto de versión, se recargó la hoja",
        });
      } else {
        set({ error: e?.message ?? "Error al guardar la hoja" });
      }
    }
  },

  setSheet(sheet) {
    set({ sheet });
  },

  setName(name) {
    const sh = get().sheet;
    if (sh) set({ sheet: { ...sh, name } });
  },

  setOrderIndex(orderIndex) {
    const sh = get().sheet;
    if (sh) set({ sheet: { ...sh, orderIndex } });
  },

  clearError() {
    set({ error: undefined });
  },
}));

/* ================== HELPERS DE API (normal + shared) ================== */

export function useSheets() {
  const api = useApi();

  /** ----------- Endpoints protegidos (JWT) ----------- */
  async function listByDocument(documentId: string): Promise<SheetEntity[]> {
    try {
      const { data } = await api.get(`/documents/${documentId}/sheets`);
      const arr = Array.isArray(data) ? data : data?.items ?? [];
      return arr.map(normalizeSheet);
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 204 || s === 404) return [];
      throw e;
    }
  }

  /** ----------- Endpoints de link compartido (SIN JWT) ----------- */
  async function listByDocumentShared(
    documentId: string,
    token: string
  ): Promise<SheetEntity[]> {
    try {
      // ruta "oficial" del backend (según tu Swagger)
      const { data } = await api.get(
        `/shared-links/${token}/documents/${documentId}/sheets`
      );
      const arr = Array.isArray(data) ? data : data?.items ?? [];
      return arr.map(normalizeSheet);
    } catch (e1: any) {
      // fallback opcional a la ruta antigua /share/... si existiera
      try {
        const { data } = await api.get(
          `/share/documents/${documentId}/sheets`,
          { params: { token } }
        );
        const arr = Array.isArray(data) ? data : data?.items ?? [];
        return arr.map(normalizeSheet);
      } catch (e2) {
        throw e1; // conserva el error principal (404 si no existe la oficial)
      }
    }
  }

  async function create(
    documentId: string,
    dto: CreateSheetRequest,
    opts?: { sharedToken?: string }
  ): Promise<SheetEntity> {
    if (opts?.sharedToken) {
      // shared: POST /shared-links/:token/documents/:documentId/sheets
      try {
        const { data } = await api.post(
          `/shared-links/${opts.sharedToken}/documents/${documentId}/sheets`,
          dto
        );
        return normalizeSheet(data);
      } catch (e1) {
        // fallback a /share/documents/:id/sheets?token=...
        const { data } = await api.post(
          `/share/documents/${documentId}/sheets`,
          dto,
          { params: { token: opts.sharedToken } }
        );
        return normalizeSheet(data);
      }
    }
    // normal
    const { data } = await api.post(`/documents/${documentId}/sheets`, dto);
    return normalizeSheet(data);
  }

  async function update(
    sheetId: string,
    dto: UpdateSheetRequest,
    opts?: { sharedToken?: string; documentId?: string }
  ): Promise<SheetEntity> {
    if (opts?.sharedToken && opts?.documentId) {
      // shared: PATCH /shared-links/:token/documents/:documentId/sheets/:sheetId
      try {
        const { data } = await api.patch(
          `/shared-links/${opts.sharedToken}/documents/${opts.documentId}/sheets/${sheetId}`,
          dto
        );
        return normalizeSheet(data);
      } catch (e1) {
        // fallback a /share/...
        const { data } = await api.patch(
          `/share/documents/${opts.documentId}/sheets/${sheetId}`,
          dto,
          { params: { token: opts.sharedToken } }
        );
        return normalizeSheet(data);
      }
    }
    // normal
    const { data } = await api.patch(`/documents/sheets/${sheetId}`, dto);
    return normalizeSheet(data);
  }

  async function remove(
    sheetId: string,
    opts?: { sharedToken?: string; documentId?: string }
  ): Promise<void> {
    if (opts?.sharedToken && opts?.documentId) {
      // shared: DELETE /shared-links/:token/documents/:documentId/sheets/:sheetId
      try {
        await api.delete(
          `/shared-links/${opts.sharedToken}/documents/${opts.documentId}/sheets/${sheetId}`
        );
        return;
      } catch (e1) {
        // fallback a /share/...
        await api.delete(
          `/share/documents/${opts.documentId}/sheets/${sheetId}`,
          { params: { token: opts.sharedToken } }
        );
        return;
      }
    }
    // normal
    await api.delete(`/documents/sheets/${sheetId}`);
  }

  async function reorder(
    documentId: string,
    sheetIds: string[],
    opts?: { sharedToken?: string }
  ): Promise<void> {
    if (opts?.sharedToken) {
      // si quieres soportarlo en modo compartido, crea la ruta en el backend
      throw new Error("Reordenar aún no está soportado en modo compartido");
    }
    await api.post(`/documents/${documentId}/sheets/reorder`, { sheetIds });
  }

  return {
    // protegidos
    listByDocument,
    // compartidos
    listByDocumentShared,
    // CRUD
    create,
    update,
    remove,
    reorder,
  };
}
