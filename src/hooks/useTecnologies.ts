// services/technologies.ts
import axios from "axios";
import type { Technology } from "../mocks/technologies.types";
import type { ZoneKind } from "../components/data/zones";

const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

/** =================== LISTADO DE TECNOLOGÍAS =================== */

export type FetchTechParams = {
  zoneKind?: ZoneKind;
  subzoneId?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

export async function fetchTechnologies({
  zoneKind,
  subzoneId,
  q,
  limit = 100,
  offset = 0,
}: FetchTechParams = {}): Promise<Technology[]> {
  const { data } = await http.get<Technology[]>("/tecnologies", {
    params: { zone: zoneKind, subzone: subzoneId, q, limit, offset },
  });
  return data;
}

export async function fetchTechnologyById(id: string) {
  const { data } = await http.get<Technology>(`/tecnologies/${id}`);
  return data;
}

export async function fetchTechnologyByName(name: string) {
  const { data } = await http.get<Technology>(
    `/tecnologies/by-name/${encodeURIComponent(name)}`
  );
  return data;
}

/** =================== REQUIREMENTS MAP =================== */
/** Devuelve: { [subzoneId]: ["WAF", "Anti Spam", ...] } */
export type RequirementsMap = Record<string, string[]>;

export type FetchRequirementsParams = {
  zone?: ZoneKind; // opcional
  subzones?: string[]; // opcional (CSV en el query)
};

export async function fetchTechRequirements({
  zone,
  subzones,
}: FetchRequirementsParams = {}): Promise<RequirementsMap> {
  const params: Record<string, string> = {};
  if (zone) params.zone = String(zone);
  if (subzones && subzones.length > 0) {
    params.subzones = subzones.join(",");
  }
  const { data } = await http.get<RequirementsMap>(
    "/tecnologies/requirements",
    {
      params,
    }
  );
  return data ?? {};
}

// por compatibilidad con tus imports existentes
export default fetchTechnologies;
