export type ZoneKind = "cloud" | "dmz" | "lan" | "datacenter" | "ot";

/** Identificador de subzona. Debe coincidir con los ids que ya tienes en
 * CloudZones, DmzZones, LanZones, DatacenterZones y OtZones. */
export type SubzoneId = string;

export interface Technology {
  id: string; // uuid o slug
  name: string;
  description?: string;
  imageUrl?: string; // ruta estática o CDN
  provider?: string; // opcional
  /** Zonas donde esta tecnología está permitida (nivel general). */
  allowedZones: ZoneKind[];
  /** Subzonas concretas donde aplica (opcional). Si está vacío, aplica a todas las subzonas de esas zonas. */
  allowedSubzones?: SubzoneId[];
  /** Etiquetas rápidas para buscar/filtrar en el panel. */
  tags?: string[];
}
