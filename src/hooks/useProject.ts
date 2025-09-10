import type { AxiosInstance } from "axios";
import { useApi } from "./useApi";
import type { Project } from "../models";

type ProjectApiOpts = {
  api?: AxiosInstance;
  isShared?: boolean;
  sharedToken?: string;
};

export function useProject(opts: ProjectApiOpts = {}) {
  const api =
    opts.api ?? useApi({ isShared: opts.isShared, sharedToken: opts.sharedToken });

  return {
    async list(): Promise<Project[]> {
      const { data } = await api.get<Project[]>("/projects");
      return Array.isArray(data) ? data : [];
    },

    async get(id: string): Promise<Project> {
      const { data } = await api.get<Project>(`/projects/${id}`);
      return data;
    },

    async create(name: string): Promise<Project> {
      const { data } = await api.post<Project>("/projects", { name });
      return data;
    },

    async ensureDefault(defaultName = "My Diagrams"): Promise<Project> {
      const { data: projs } = await api.get<Project[]>("/projects");
      if (Array.isArray(projs) && projs.length > 0) return projs[0];
      const { data } = await api.post<Project>("/projects", { name: defaultName });
      return data;
    },
  };
}
