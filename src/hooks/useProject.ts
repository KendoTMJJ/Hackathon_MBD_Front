// src/hooks/useProjects.ts
import { useApi } from "./useApi";
import type { Project } from "../models";

export function useProjects() {
  const api = useApi();

  return {
    async list(): Promise<Project[]> {
      const { data } = await api.get<Project[]>("/projects");
      return data;
    },

    async get(id: string): Promise<Project> {
      const { data } = await api.get<Project>(`/projects/${id}`);
      return data;
    },

    async create(name: string): Promise<Project> {
      const { data } = await api.post<Project>("/projects", { name });
      return data;
    },

    /**
     * Devuelve el primer proyecto del usuario. Si no hay, lo crea.
     * Puedes pasar el nombre por defecto (por ejemplo "My Diagrams").
     */
    async ensureDefault(defaultName = "My Diagrams"): Promise<Project> {
      const { data: projs } = await api.get<Project[]>("/projects");
      if (Array.isArray(projs) && projs.length > 0) return projs[0];
      const { data } = await api.post<Project>("/projects", {
        name: defaultName,
      });
      return data;
    },
  };
}
