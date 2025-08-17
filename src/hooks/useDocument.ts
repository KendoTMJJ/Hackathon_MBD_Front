import { create } from "zustand";
import { useApi } from "./useApi";
import type { DocumentEntity, DocumentData } from "../models";

/** Normaliza un Document desde camel o snake */
function normalizeDoc(raw: any): DocumentEntity {
  return {
    id: raw.id ?? raw.cod_document,
    title: raw.title ?? raw.title_document,
    kind: raw.kind ?? raw.kind_document,
    data: raw.data ?? raw.data_document ?? { nodes: [], edges: [] },
    version: raw.version,
    templateId: raw.templateId ?? raw.template_id ?? null,
    isArchived: raw.isArchived ?? raw.is_archived ?? false,
    createdBy: raw.createdBy ?? raw.created_by,
    projectId: raw.projectId ?? raw.project_id,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  } as DocumentEntity;
}

/* ============ STORE PARA EL DOCUMENTO ABIERTO (Editor) ============ */

type State = {
  doc?: DocumentEntity;
  loading: boolean;
  error?: string;
};

type Actions = {
  /** Inicializa un getter para axios (como no podemos usar hooks dentro del store) */
  setApiReady: (fn: () => ReturnType<typeof useApi>) => void;

  /** Carga un documento por id */
  load: (id: string) => Promise<void>;

  /** Aplica un patch local (no persiste) */
  applyLocalPatch: (patch: Partial<DocumentData>) => void;

  /** Guarda contra el backend (lock optimista) */
  save: () => Promise<void>;

  /** Reemplaza el doc completo (útil tras crear) */
  setDoc: (doc?: DocumentEntity) => void;

  /** Limpia errores */
  clearError: () => void;
};

// truco para inyectar el hook useApi al store
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
      set({ error: e?.message ?? "Error al cargar", loading: false });
    }
  },

  applyLocalPatch(patch) {
    const doc = get().doc;
    if (!doc) return;
    const next: DocumentEntity = {
      ...doc,
      data: { ...doc.data, ...patch },
    };
    set({ doc: next });
  },

  async save() {
    if (!getApi) throw new Error("API no inicializada");
    const doc = get().doc;
    if (!doc) return;

    try {
      const api = getApi();
      const { data } = await api.patch(`/documents/${doc.id}`, {
        version: doc.version, // lock optimista
        data: doc.data,
        title: doc.title, // opcional
      });
      set({ doc: normalizeDoc(data), error: undefined });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409 || status === 412) {
        // conflicto: recarga desde servidor
        const api = getApi();
        const { data } = await api.get(`/documents/${doc.id}`);
        set({
          doc: normalizeDoc(data),
          error: "Conflicto de versión, se recargó el documento",
        });
      } else {
        set({ error: e?.message ?? "Error al guardar" });
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

/* ============ HELPERS DE API (operaciones no ligadas al editor) ============ */

export function useDocumentsApi() {
  const api = useApi();

  return {
    async get(id: string): Promise<DocumentEntity> {
      const { data } = await api.get(`/documents/${id}`);
      return normalizeDoc(data);
    },

    async listByProject(projectId: string): Promise<DocumentEntity[]> {
      const { data } = await api.get(`/documents`, { params: { projectId } });
      return (data as any[]).map(normalizeDoc);
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

    // Si en algún momento agregas un endpoint clone-from-template
    async createFromTemplate(opts: {
      templateId: string;
      projectId: string;
      title: string;
    }): Promise<DocumentEntity> {
      const { data } = await api.post(
        `/documents/${opts.templateId}/clone`,
        null,
        {
          params: { projectId: opts.projectId, title: opts.title },
        }
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
