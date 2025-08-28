import type { TemplateEntity } from "../models";
import { useApi } from "./useApi";

function normalizeTemplate(raw: any): TemplateEntity {
  return {
    id: raw.id ?? raw.cod_template,
    title: raw.title ?? raw.title_template,
    data: raw.data ?? raw.data_template ?? {},
    version: raw.version,
    isArchived: raw.isArchived ?? raw.is_archived ?? false,
    createdBy: raw.createdBy ?? raw.created_by,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    kind: raw.kind ?? raw.kind_template,
  } as TemplateEntity;
}

export function useTemplates() {
  const api = useApi();

  return {
    /** Lista plantillas (tu controlador exige JWT) */
    async list(includeArchived = false): Promise<TemplateEntity[]> {
      const { data } = await api.get(`/templates`, {
        params: { includeArchived },
      });
      return (data as any[]).map(normalizeTemplate);
    },

    /** Obtiene una plantilla por id */
    async get(id: string): Promise<TemplateEntity> {
      const { data } = await api.get(`/templates/${id}`);
      return normalizeTemplate(data);
    },

    /** Crea una plantilla (CreateTemplateDto). Si tu servicio usa dto.kind, puedes pasarlo opcional */
    async create(body: {
      title: string;
      data: any;
      description?: string;
      kind?: string;
    }) {
      const { data } = await api.post(`/templates`, body);
      return normalizeTemplate(data);
    },

    /** Actualiza plantilla con lock optimista (UpdateTemplateDto requiere version) */
    async update(
      id: string,
      body: { version: number; data: any; title?: string; description?: string }
    ) {
      const { data } = await api.patch(`/templates/${id}`, body);
      return normalizeTemplate(data);
    },

    /** Archivado lógico */
    async archive(id: string) {
      const { data } = await api.post(`/templates/${id}/archive`);
      return normalizeTemplate(data);
    },

    /** Desarchivar */
    async unarchive(id: string) {
      const { data } = await api.post(`/templates/${id}/unarchive`);
      return normalizeTemplate(data);
    },

    /** Eliminación física (si la usas) */
    async remove(id: string) {
      await api.delete(`/templates/${id}`);
    },
  };
}
