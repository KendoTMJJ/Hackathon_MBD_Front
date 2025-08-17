import { create } from "zustand";
import type { DocumentEntity, DocumentData } from "../models";
import { useApi } from "./useApi";

type State = {
  doc?: DocumentEntity;
  loading: boolean;
  error?: string;
};

type Actions = {
  load: (id: string) => Promise<void>;
  applyLocalPatch: (patch: Partial<DocumentData>) => void;
  save: () => Promise<void>;
  setApiReady: (fn: () => ReturnType<typeof useApi>) => void;
};

// ⚠️ pequeño truco: como Zustand no puede usar hooks, inyectamos un getter del api.
let getApi: null | (() => ReturnType<typeof useApi>) = null;

export const useDocumentStore = create<State & Actions>((set, get) => ({
  loading: false,
  setApiReady(fn) {
    getApi = fn;
  },
  async load(id) {
    if (!getApi) throw new Error("API no inicializada");
    set({ loading: true, error: undefined });
    try {
      const api = getApi();
      const { data } = await api.get<DocumentEntity>(`/documents/${id}`);
      set({ doc: data, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? "Error al cargar", loading: false });
    }
  },
  applyLocalPatch(patch) {
    const doc = get().doc;
    if (!doc) return;
    const next: DocumentEntity = {
      ...doc,
      data_document: { ...doc.data_document, ...patch },
    };
    set({ doc: next });
  },
  async save() {
    if (!getApi) throw new Error("API no inicializada");
    const doc = get().doc;
    if (!doc) return;
    try {
      const api = getApi();
      const { data } = await api.patch<DocumentEntity>(
        `/documents/${doc.cod_document}`,
        {
          version: doc.version, // <- lock optimista
          data: doc.data_document,
          title: doc.title_document, // opcional
        }
      );
      set({ doc: data });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409 || status === 412) {
        const api = getApi();
        const { data } = await api.get<DocumentEntity>(
          `/documents/${doc.cod_document}`
        );
        set({
          doc: data,
          error: "Conflicto de versión, se recargó el documento",
        });
      } else {
        set({ error: e?.message ?? "Error al guardar" });
      }
    }
  },
}));
