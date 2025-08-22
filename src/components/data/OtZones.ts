export type OtZoneId =
  | "ot-corporate-lt"
  | "ot-corporate-firewall"
  | "ot-network-ips"
  | "ot-maintenance-laptop"
  | "ot-data-historian-scada-server"
  | "ot-supervision-console-1"
  | "ot-supervision-console-2"
  | "ot-erp-server"
  | "ot-production-management"
  | "ot-inspection-network"
  | "ot-rtu"
  | "ot-plc"
  | "ot-wireless-industrial-network"
  | "ot-work-station"
  | "ot-mobile"
  | "ot-critical-infrastructure-video";
export interface OtZone {
  id: OtZoneId;
  /** Título visible en la pastilla */
  name: string;
  /** Texto corto para tooltip o lista */
  description?: string;
  /** Color base (borde/Minimap) */
  color: string;
  /** Nivel relativo para badges o filtros */
  level: "low" | "medium" | "high";
  /** Emoji/char para mostrar en el panel (opcional) */
  icon?: string;
}
export const otZones: OtZone[] = [
  {
    id: "ot-corporate-firewall",
    name: "Corporate Firewall",
    description: "Perímetro entre red corporativa e industrial.",
    color: "#992E08",
    level: "high",
    icon: "🧱",
  },
  {
    id: "ot-network-ips",
    name: "Network IPS",
    description: "Inspección y bloqueo de tráfico industrial.",
    color: "#992E08",
    level: "high",
    icon: "⚡",
  },
  {
    id: "ot-corporate-lt",
    name: "Corporate L.T",
    description: "Interconexión con la red corporativa (LT).",
    color: "#992E08",
    level: "high",
    icon: "🏢",
  },
  {
    id: "ot-erp-server",
    name: "ERP Server",
    description: "Integración OT-IT con sistemas ERP.",
    color: "#992E08",
    level: "high",
    icon: "🗄️",
  },

  {
    id: "ot-production-management",
    name: "Production Management",
    description: "MES/MOM y orquestación de procesos.",
    color: "#992E08",
    level: "high",
    icon: "🏭",
  },
  {
    id: "ot-data-historian-scada-server",
    name: "Data Historian/Scada Server",
    description: "Historiador y servicios SCADA/HMI.",
    color: "#992E08",
    level: "high",
    icon: "📈",
  },
  {
    id: "ot-maintenance-laptop",
    name: "Mantenance Laptop",
    description: "Equipo de ingeniería con acceso controlado.",
    color: "#992E08",
    level: "medium",
    icon: "💻",
  },

  {
    id: "ot-supervision-console-1",
    name: "Supervision Console 1",
    description: "Puesto de operación SCADA/HMI.",
    color: "#992E08",
    level: "medium",
    icon: "🖥️",
  },
  {
    id: "ot-supervision-console-2",
    name: "Supervision Console 2",
    description: "Consola redundante/alternativa.",
    color: "#992E08",
    level: "medium",
    icon: "🖥️",
  },

  {
    id: "ot-inspection-network",
    name: "Inspection Network",
    description: "Segmento de monitoreo fuera de banda.",
    color: "#992E08",
    level: "medium",
    icon: "🔍",
  },

  {
    id: "ot-rtu",
    name: "Remote Terminal UNIT",
    description: "Unidades remotas de campo.",
    color: "#992E08",
    level: "high",
    icon: "📡",
  },

  {
    id: "ot-plc",
    name: "PLC",
    description: "Controladores lógicos programables.",
    color: "#992E08",
    level: "high",
    icon: "🔧",
  },

  {
    id: "ot-wireless-industrial-network",
    name: "Wireless Industrial Network",
    description: "Conectividad inalámbrica para sensores/actuadores.",
    color: "#992E08",
    level: "medium",
    icon: "📶",
  },

  {
    id: "ot-work-station",
    name: "Work Station",
    description: "Puesto de operación/ingeniería.",
    color: "#992E08",
    level: "medium",
    icon: "🖱️",
  },

  {
    id: "ot-mobile",
    name: "Movil",
    description: "Terminales móviles en planta.",
    color: "#992E08",
    level: "low",
    icon: "📱",
  },

  {
    id: "ot-critical-infrastructure-video",
    name: "Video infraestructura Critica",
    description: "CCTV/VMS y videoseguridad industrial.",
    color: "#992E08",
    level: "high",
    icon: "🎥",
  },
];
