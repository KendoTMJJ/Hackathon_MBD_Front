// services/technologies.ts
import axios from "axios";
import type { Technology } from "../mocks/technologies.types"; // ajusta si moviste el tipo
import type { ZoneKind } from "../components/data/zones";

const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

// Tipo de parámetros que usará el hook/componente
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
    // El backend espera zone y subzone
    params: { zone: zoneKind, subzone: subzoneId, q, limit, offset },
  });
  return data;
}

// utilidades opcionales
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

// ✅ exporta la función, no la ejecutes
export default fetchTechnologies;
