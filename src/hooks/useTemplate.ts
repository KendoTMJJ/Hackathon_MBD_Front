import type { AxiosInstance } from "axios";
import { useApi } from "./useApi";
import type { TemplateEntity } from "../models";

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

type TemplatesApiOpts = {
  api?: AxiosInstance;
  isShared?: boolean;
  sharedToken?: string;
};

export function useTemplates(opts: TemplatesApiOpts = {}) {
  const api =
    opts.api ?? useApi({ isShared: opts.isShared, sharedToken: opts.sharedToken });

  return {
    async list(includeArchived = false): Promise<TemplateEntity[]> {
      const { data } = await api.get(`/templates`, { params: { includeArchived } });
      const arr = Array.isArray(data) ? data : data?.items ?? [];
      return arr.map(normalizeTemplate);
    },

    async get(id: string): Promise<TemplateEntity> {
      const { data } = await api.get(`/templates/${id}`);
      return normalizeTemplate(data);
    },

    async create(body: {
      title: string;
      data: any;
      description?: string;
      kind?: string;
    }) {
      const { data } = await api.post(`/templates`, body);
      return normalizeTemplate(data);
    },

    async update(
      id: string,
      body: { version: number; data: any; title?: string; description?: string }
    ) {
      const { data } = await api.patch(`/templates/${id}`, body);
      return normalizeTemplate(data);
    },

    async archive(id: string) {
      const { data } = await api.post(`/templates/${id}/archive`);
      return normalizeTemplate(data);
    },

    async unarchive(id: string) {
      const { data } = await api.post(`/templates/${id}/unarchive`);
      return normalizeTemplate(data);
    },

    async remove(id: string) {
      await api.delete(`/templates/${id}`);
    },
  };
}
