// src/data/DatacenterZones.ts

export type DatacenterZoneId =
  | "dc-id-management"
  | "dc-dev-qa"
  | "dc-ips-ids"
  | "dc-email-and-protection"
  | "dc-storage"
  | "dc-intranet"
  | "dc-print-server"
  | "dc-backup-server"
  | "dc-messaging-servers"
  | "dc-directory-dns-dhcp-ntp"
  | "dc-virtual-servers"
  | "dc-channel-encryption"
  | "dc-app-servers"
  | "dc-databases"
  | "dc-waf-databases"
  | "dc-firewall-ips/id"
  | "dc-admin-canal"
  | "dc-Ddos-protection";

export interface DatacenterZone {
  id: DatacenterZoneId;
  /** Título visible en la pastilla */
  name: string;
  /** Texto corto para tooltip o lista */
  description?: string;
  /** Color base (borde/Minimap) */
  color: string;
  /** Emoji/char para mostrar en el panel (opcional) */
  icon?: string;
}

export const datacenterZones: DatacenterZone[] = [
  {
    id: "dc-Ddos-protection",
    name: "DDoS",
    description:
      "Punto de defensa dedicado a la detección y mitigación de ataques DDoS en el perímetro de red.",
    color: "#E51212",
    icon: "🧱",
  },
  {
    id: "dc-firewall-ips/id",
    name: "Firewall IPS/IDS",
    description:
      "Sistema de firewall perimetral con funciones de detección y prevención de intrusiones para proteger el datacenter frente a accesos no autorizados y ataques avanzados.",
    color: "#E51212",
    icon: "🛡️",
  },

  {
    id: "dc-admin-canal",
    name: "Administrador de Canal",
    description:
      "Componente de seguridad perimetral encargado de la gestión de tráfico y la mitigación de amenazas a nivel de canal en el datacenter.",
    color: "#E53935",
    icon: "📡",
  },

  {
    id: "dc-id-management",
    name: "Gestión de ID",
    description: "IAM/SSO/MFA y gobierno de identidades dentro del DC.",
    color: "#E300A4",
    icon: "🆔",
  },
  {
    id: "dc-dev-qa",
    name: "Serv. de Desarrollo, Calidad y Pruebas",
    description: "Ambientes Dev/QA con aislamiento y controles de cambio.",
    color: "#DFE300",
    icon: "🧪",
  },
  {
    id: "dc-ips-ids",
    name: "IPS/IDS",
    description: "Detección y prevención de intrusiones en el DC.",
    color: "#E300A4",
    icon: "⚡",
  },
  {
    id: "dc-email-and-protection",
    name: "Correo + Protección de Correo",
    description: "Servidores de correo con antispam/antimalware/DLP.",
    color: "#E300A4",
    icon: "📧",
  },
  {
    id: "dc-storage",
    name: "Almacenamiento",
    description: "Cabinas/NAS/SAN con cifrado y snapshots.",
    color: "#E300A4",
    icon: "🗄️",
  },
  {
    id: "dc-intranet",
    name: "Intranet",
    description: "Portales internos y aplicaciones corporativas.",
    color: "#E300A4",
    icon: "🏢",
  },
  {
    id: "dc-print-server",
    name: "Servidor de Impresión",
    description: "Spoolers y control de impresión seguros.",
    color: "#E300A4",
    icon: "🖨️",
  },
  {
    id: "dc-backup-server",
    name: "Servidor de Backup",
    description: "Respaldos, retención, inmutabilidad y recuperación.",
    color: "#E300A4",

    icon: "💽",
  },
  {
    id: "dc-messaging-servers",
    name: "Servidores de Mensajería",
    description: "Colaboración/IM/colas internas.",
    color: "#E300A4",

    icon: "💬",
  },
  {
    id: "dc-directory-dns-dhcp-ntp",
    name: "Directorio Activo, DNS, DHCP, NTP",
    description: "Servicios de directorio y esenciales de red.",
    color: "#E300A4",

    icon: "📁",
  },
  {
    id: "dc-virtual-servers",
    name: "Servidores Virtuales",
    description: "Clusters de virtualización, hipervisores y VM.",
    color: "#E300A4",

    icon: "🖥️",
  },
  {
    id: "dc-channel-encryption",
    name: "Cifrados de Canal",
    description: "TLS/IPsec, túneles y cifrado de comunicaciones.",
    color: "#E300A4",

    icon: "🔐",
  },
  {
    id: "dc-app-servers",
    name: "Servidores de Aplicaciones",
    description: "App servers, middlewares y APIs internas.",
    color: "#E300A4",
    icon: "🧩",
  },
  {
    id: "dc-waf-databases",
    name: "WAF Base de Datos",
    description: "Protección y auditoría para bases de datos.",
    color: "#E300A4",
    icon: "🗄️",
  },

  {
    id: "dc-databases",
    name: "Base de Datos",
    description: "Motores relacionales y NoSQL con HA/replicación.",
    color: "#E300A4",

    icon: "🗃️",
  },
];
