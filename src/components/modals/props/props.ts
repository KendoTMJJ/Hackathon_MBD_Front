import type { ZoneKind } from "../../data/zones";

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

export interface ShareLink {
  id: string;
  token: string;
  permission: "read" | "edit";
  expiresAt: string | null;
  createdAt: string;
}

// info Zonas

export interface infoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** zona con la que arranca el modal */
  initialZone?: ZoneKind;
  /** imagen opcional por zona: { cloud:'/img/cloud.png', ... } */
  zoneImages?: Partial<Record<ZoneKind, string>>;
  /** se dispara cuando el usuario cambia subzona (útil para cargar datos reales) */
  onChange?: (zone: ZoneKind, subzoneId: string) => void;
}

export interface imgModalProps {
  isOpen: boolean;
  onClose: () => void;
}
