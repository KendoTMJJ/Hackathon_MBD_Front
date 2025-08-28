import type { ZoneKind } from "../components/data/zones";
import { TECHNOLOGIES } from "./technologies.data";
import type { SubzoneId, Technology } from "./technologies.types";

export interface FetchTechParams {
  zoneKind?: ZoneKind; // 'cloud' | 'dmz' | ...
  subzoneId?: SubzoneId; // ej: 'cloud-proxy-como-servicio'
  q?: string; // texto libre
  limit?: number;
  offset?: number;
}

/** “GET /technologies” */
export async function fetchTechnologies(
  params: FetchTechParams = {}
): Promise<Technology[]> {
  const { zoneKind, subzoneId, q, limit = 100, offset = 0 } = params;

  let rows = TECHNOLOGIES.slice();

  if (zoneKind) {
    rows = rows.filter((t) => t.allowedZones.includes(zoneKind));
  }
  if (subzoneId) {
    rows = rows.filter((t) =>
      !t.allowedSubzones || t.allowedSubzones.length === 0
        ? true
        : t.allowedSubzones.includes(subzoneId)
    );
  }
  if (q && q.trim()) {
    const s = q.trim().toLowerCase();
    rows = rows.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        (t.description ?? "").toLowerCase().includes(s) ||
        (t.provider ?? "").toLowerCase().includes(s) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(s))
    );
  }

  // Orden simple y paginación
  rows.sort((a, b) => a.name.localeCompare(b.name));
  const page = rows.slice(offset, offset + limit);

  return page;
}

/** “GET /technologies/:id” */
export async function fetchTechnologyById(
  id: string
): Promise<Technology | undefined> {
  return TECHNOLOGIES.find((t) => t.id === id);
}
