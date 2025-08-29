import axios from "axios";
import type { Technology } from "../mocks/technologies.types";
import type { ZoneKind } from "../components/data/zones";

const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

export async function fetchTechnologies({
  zoneKind,
  subzoneId,
  q,
  limit = 100,
  offset = 0,
}: {
  zoneKind?: ZoneKind;
  subzoneId?: string;
  q?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { data } = await http.get<Technology[]>("/tecnologies", {
    params: { zone: zoneKind, subzone: subzoneId, q, limit, offset },
  });
  return data;
}

export default fetchTechnologies();
