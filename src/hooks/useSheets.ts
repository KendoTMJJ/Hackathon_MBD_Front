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
  } as SheetEntity;
}

/* ============ STORE PARA LA HOJA ABIERTA (Editor) ============ */

type State = {
  sheet?: SheetEntity;
  loading: boolean;
  error?: string;
};

type Actions = {
  /** Inyecta un getter para axios (mismo patrón que useDocuments) */
  setApiReady: (fn: () => ReturnType<typeof useApi>) => void;

  /** Carga una hoja por id */
  load: (sheetId: string) => Promise<void>;

  /** Patch local SOLO sobre el contenido de la hoja (data) */
  applyLocalPatch: (patch: Partial<SheetEntity["data"]>) => void;

  /** Guarda contra el backend (sin version explícita en tu modelo) */
  save: () => Promise<void>;

  /** Reemplaza la hoja completa (útil tras crear/recargar) */
  setSheet: (sheet?: SheetEntity) => void;

  /** Helpers opcionales para metacampos */
  setName: (name: string) => void;
  setOrderIndex: (idx: number) => void;

  /** Limpia errores */
  clearError: () => void;
};

// truco para inyectar el hook useApi al store (igual que en useDocuments)
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
      set({ error: e?.message ?? "Error al cargar la hoja", loading: false });
    }
  },

  applyLocalPatch(patch) {
    const sheet = get().sheet;
    if (!sheet) return;
    const next: SheetEntity = {
      ...sheet,
      data: { ...(sheet.data ?? {}), ...(patch ?? {}) },
    };
    set({ sheet: next });
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
      const status = e?.response?.status;
      if (status === 409 || status === 412) {
        // si el backend usa lock/ETag por dentro, rehidrata en conflicto
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
    const sheet = get().sheet;
    if (!sheet) return;
    set({ sheet: { ...sheet, name } });
  },

  setOrderIndex(orderIndex) {
    const sheet = get().sheet;
    if (!sheet) return;
    set({ sheet: { ...sheet, orderIndex } });
  },

  clearError() {
    set({ error: undefined });
  },
}));

/* ============ HELPERS DE API (operaciones fuera del editor) ============ */

// src/hooks/useSheets.ts
export function useSheets() {
  const api = useApi();

  return {
    /** Lista hojas por documento (si falla, devuelve []) */
    async listByDocument(documentId: string): Promise<SheetEntity[]> {
      try {
        const { data } = await api.get(`/documents/${documentId}/sheets`);
        const arr = Array.isArray(data) ? data : data?.items ?? [];
        return arr.map(normalizeSheet);
      } catch (e: any) {
        const s = e?.response?.status;
        if (s === 204 || s === 404 || s === 500) {
          console.warn("[useSheets] listByDocument devolvió", s, "→ []");
          return [];
        }
        console.error("[useSheets] listByDocument error:", e);
        throw e;
      }
    },

    async get(sheetId: string): Promise<SheetEntity> {
      const { data } = await api.get(`/documents/sheets/${sheetId}`);
      return normalizeSheet(data);
    },

    async create(
      documentId: string,
      dto: CreateSheetRequest
    ): Promise<SheetEntity> {
      const { data } = await api.post(`/documents/${documentId}/sheets`, dto);
      return normalizeSheet(data);
    },

    async update(
      sheetId: string,
      dto: UpdateSheetRequest
    ): Promise<SheetEntity> {
      const { data } = await api.patch(`/documents/sheets/${sheetId}`, dto);
      return normalizeSheet(data);
    },

    async remove(sheetId: string): Promise<void> {
      await api.delete(`/documents/sheets/${sheetId}`);
    },

    async reorder(documentId: string, sheetIds: string[]): Promise<void> {
      await api.post(`/documents/${documentId}/sheets/reorder`, { sheetIds });
    },
  };
}
