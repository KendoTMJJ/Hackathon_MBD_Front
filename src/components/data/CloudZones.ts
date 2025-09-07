export type CloudZoneId =
  | "cloud-platform-security"
  | "digital-certificates-aas"
  | "proxy-aas"
  | "ddos-protection"
  | "email-gateway-aas";

export interface CloudZone {
  id: CloudZoneId;
  /** Título visible en la pastilla */
  name: string;
  /** Texto corto para tooltip o lista */
  description?: string;
  /** Color base (borde/Minimap) */
  color: string;
  /** Emoji/char para mostrar en el panel (opcional) */
  icon?: string;
}

export const cloudZones: CloudZone[] = [
  {
    id: "cloud-platform-security",
    name: "Seguridad en Plataformas como Servicio",
    description: "AWS · Azure · Otros proveedores",
    color: "#707070",
    icon: "☁️",
  },
  {
    id: "digital-certificates-aas",
    name: "Certificados Digitales como Servicio",
    description: "Gestión y emisión de certificados",
    color: "#707070",
    icon: "✅",
  },
  {
    id: "proxy-aas",
    name: "Proxy como Servicio",
    description: "Secure Web Gateway / filtrado URL",
    color: "#707070",
    icon: "🌐",
  },
  {
    id: "email-gateway-aas",
    name: "Gateway de Correo como Servicio",
    description: "Antispam · anti-malware · DLP",
    color: "#707070",
    icon: "📧",
  },
];
