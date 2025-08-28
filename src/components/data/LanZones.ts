export type LanZoneId =
  | "lan-endpoint-client"
  | "lan-pos"
  | "lan-mobile-device"
  | "lan-video"
  | "lan-nac"
  | "lan-identity-management";

export interface LanZone {
  id: LanZoneId;
  name: string;
  description?: string;
  color: string;
  level: "low" | "medium" | "high";
  icon?: string;
}

export const lanZones: LanZone[] = [
  {
    id: "lan-endpoint-client",
    name: "Cliente Punto Final",
    description:
      "Protección de endpoints: AV/EDR, control de dispositivos, hardening y filtrado web.",
    color: "#22F0F0",
    level: "high",
    icon: "💻",
  },
  {
    id: "lan-pos",
    name: "POS",
    description:
      "Terminales de punto de venta: segmentación, monitoreo y protección de aplicaciones.",
    color: "#22F0F0",
    level: "medium",
    icon: "🧾",
  },
  {
    id: "lan-mobile-device",
    name: "Dispositivo Móvil",
    description:
      "MDM/MAM, protección de apps y cumplimiento para smartphones y tablets.",
    color: "#22F0F0",
    level: "medium",
    icon: "📱",
  },
  {
    id: "lan-video",
    name: "Video",
    description: "CCTV/Video IP, NVR y segmentación de red.",
    color: "#22D3EE",
    level: "medium",
    icon: "🎥",
  },
  {
    id: "lan-nac",
    name: "NAC",
    description:
      "Control de acceso 802.1X, perfilado de dispositivos y políticas por rol.",
    color: "#22F0F0",
    level: "high",
    icon: "🚦",
  },
  {
    id: "lan-identity-management",
    name: "Gestión de ID",
    description:
      "Gestión de identidades y accesos (SSO/MFA), directorios e IAM.",
    color: "#22F0F0",
    level: "high",
    icon: "🆔",
  },
];
