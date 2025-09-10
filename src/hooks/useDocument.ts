// src/hooks/useDocument.ts
import { create } from "zustand";
import { useApi } from "./useApi";
import type { DocumentEntity, DocumentData } from "../models";

/** Normaliza un Document desde camel o snake */
function normalizeDoc(raw: any): DocumentEntity {
  return {
    id: raw?.id ?? raw?.cod_document,
    title: raw?.title ?? raw?.title_document ?? "",
    kind: raw?.kind ?? raw?.kind_document ?? "diagram",
    data: raw?.data ?? raw?.data_document ?? { nodes: [], edges: [] },
    version: raw?.version ?? 0,
    templateId: raw?.templateId ?? raw?.template_id ?? null,
    isArchived: raw?.isArchived ?? raw?.is_archived ?? false,
    createdBy: raw?.createdBy ?? raw?.created_by ?? null,
    projectId: raw?.projectId ?? raw?.project_id ?? null,
    createdAt: raw?.createdAt ?? raw?.created_at,
    updatedAt: raw?.updatedAt ?? raw?.updated_at,
  } as DocumentEntity;
}

/* ================= STORE DEL EDITOR (compatible con el código actual) ================= */

type State = {
  doc?: DocumentEntity;
  loading: boolean;
  error?: string;
};

type Actions = {
  /** Inyecta un getter de axios (no se pueden usar hooks dentro del store) */
  setApiReady: (fn: () => ReturnType<typeof useApi>) => void;

  /** Carga documento por id */
  load: (id: string) => Promise<void>;

  /** Parche local (NO persiste) */
  applyLocalPatch: (patch: Partial<DocumentData>) => void;

  /** Guarda con lock optimista */
  save: () => Promise<void>;

  /** Reemplaza el doc completo (útil tras crear) */
  setDoc: (doc?: DocumentEntity) => void;

  /** Limpia error */
  clearError: () => void;
};

// guardamos el getter del api para que el store lo use
let getApi: null | (() => ReturnType<typeof useApi>) = null;

export const useDocumentStore = create<State & Actions>((set, get) => ({
  doc: undefined,
  loading: false,
  error: undefined,

  setApiReady(fn) {
    getApi = fn;
  },

  async load(id) {
    if (!getApi) throw new Error("API no inicializada");
    set({ loading: true, error: undefined });
    try {
      const api = getApi();
      const { data } = await api.get(`/documents/${id}`);
      set({ doc: normalizeDoc(data), loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? "Error al cargar documento", loading: false });
    }
  },

  applyLocalPatch(patch) {
    const cur = get().doc;
    if (!cur) return;
    set({
      doc: {
        ...cur,
        data: { ...(cur.data ?? {}), ...(patch ?? {}) },
      },
    });
  },

  async save() {
    if (!getApi) throw new Error("API no inicializada");
    const cur = get().doc;
    if (!cur) return;
    try {
      const api = getApi();
      const { data } = await api.patch(`/documents/${cur.id}`, {
        version: cur.version, // lock optimista
        data: cur.data,
        title: cur.title, // opcional
      });
      set({ doc: normalizeDoc(data), error: undefined });
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 409 || s === 412) {
        // conflicto → rehidratar del server
        const api = getApi();
        const { data } = await api.get(`/documents/${cur.id}`);
        set({
          doc: normalizeDoc(data),
          error: "Conflicto de versión: se recargó el documento",
        });
      } else {
        set({ error: e?.message ?? "Error al guardar documento" });
      }
    }
  },

  setDoc(doc) {
    set({ doc });
  },

  clearError() {
    set({ error: undefined });
  },
}));

/* ================= Helpers de API externos al editor (SIN cambiar firmas) ================= */

export function useDocumentsApi() {
  const api = useApi();

  return {
    async get(id: string): Promise<DocumentEntity> {
      const { data } = await api.get(`/documents/${id}`);
      return normalizeDoc(data);
    },

    async listByProject(projectId: string): Promise<DocumentEntity[]> {
      const { data } = await api.get(`/documents`, { params: { projectId } });
      return (Array.isArray(data) ? data : data?.items ?? []).map(normalizeDoc);
    },

    async createBlank(opts: {
      projectId: string;
      title: string;
    }): Promise<DocumentEntity> {
      const { data } = await api.post(`/documents`, {
        title: opts.title,
        kind: "diagram",
        data: { nodes: [], edges: [] },
        projectId: opts.projectId,
      });
      return normalizeDoc(data);
    },

    async createFromTemplate(opts: {
      templateId: string;
      projectId: string;
      title: string;
    }): Promise<DocumentEntity> {
      const { data } = await api.post(
        `/documents/${opts.templateId}/clone`,
        null,
        { params: { projectId: opts.projectId, title: opts.title } }
      );
      return normalizeDoc(data);
    },

    async update(doc: {
      id: string;
      version: number;
      data: DocumentData;
      title?: string;
    }): Promise<DocumentEntity> {
      const { data } = await api.patch(`/documents/${doc.id}`, {
        version: doc.version,
        data: doc.data,
        title: doc.title,
      });
      return normalizeDoc(data);
    },

    async remove(id: string): Promise<void> {
      await api.delete(`/documents/${id}`);
    },
  };
}
