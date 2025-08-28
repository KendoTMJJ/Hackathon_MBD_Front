export type DmzZoneId =
  | "dmz-email-gateway"
  | "dmz-load-balancer"
  | "dmz-web-gateway"
  | "dmz-web-publishing"
  | "dmz-waf"
  | "dmz-proxy";

export interface DmzZone {
  id: DmzZoneId;
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

export const dmzZones: DmzZone[] = [
  {
    id: "dmz-email-gateway",
    name: "Gateway de Correo",
    description: "Antispam, anti-malware, DLP en correo entrante/saliente",
    color: "#F59E0B",
    level: "high",
    icon: "📧",
  },
  {
    id: "dmz-load-balancer",
    name: "Balanceador de Carga",
    description: "L4/L7, health checks, SSL offload, persistence",
    color: "#F59E0B",
    level: "medium",
    icon: "⚖️",
  },
  {
    id: "dmz-web-gateway",
    name: "Gateway de Navegación",
    description: "SWG/URL filtering, sandboxing, malware protection",
    color: "#F59E0B",
    level: "high",
    icon: "🌐",
  },
  {
    id: "dmz-web-publishing",
    name: "Publicación Web",
    description: "Reverse proxy / publicación de aplicaciones",
    color: "#F59E0B",
    level: "medium",
    icon: "🗂️",
  },
  {
    id: "dmz-waf",
    name: "WAF",
    description: "Protección OWASP Top 10, API security, bot mitigation",
    color: "#F59E0B",
    level: "high",
    icon: "🛡️",
  },
  {
    id: "dmz-proxy",
    name: "Proxy",
    description: "Proxy directo o transparente para tráfico saliente",
    color: "#F59E0B",
    level: "medium",
    icon: "🧭",
  },
];
