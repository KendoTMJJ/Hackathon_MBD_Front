import type { ZoneKind } from "../mocks/technologies.types";
import type { SubzoneRule, ZoneRuleSet } from "./props/props";

// =============================================================================
// SECCIÓN 1: NORMALIZACIÓN DE NOMBRES DE TECNOLOGÍAS
// =============================================================================

/**
 * Diccionario de alias para normalizar nombres de tecnologías
 * Mapea variaciones comunes -> nombre canónico
 */
export const TECH_ALIASES: Record<string, string> = {
  // Seguridad de red y aplicaciones
  waf: "WAF",
  proxi: "Proxy",
  "proxy directo": "Proxy",
  "ips/ids": "IPS",
  ips: "IPS",
  firewall: "Firewall",
  nac: "NAC",
  antibot: "Antibot",
  antispam: "Anti Spam",
  antimalware: "Antimalware",

  // Protección contra amenazas
  "anti phishing": "Anti Phishing",
  antiphising: "Anti Phishing",
  "anti phising": "Anti Phishing",
  "control de amenazas avanzadas": "Control de amenazas avanzadas",

  // Gestión de vulnerabilidades
  "analisis de vulnerabilidad": "Análisis de vulnerabilidad",
  "control de vulnerabilidad ": "Control de vulnerabilidad",

  // Gestión de identidad
  "gestion de id": "Gestión de identidad",

  // Protección endpoints
  "antivirus de navegacion": "Antivirus de Navegación",
  "monitoreo de integridad": "Monitoreo de integridad",

  // Gestión de logs y información
  "correlacion de logs": "Correlación de logs",
  "fuga de informacion": "Fuga de información",

  // Cifrado y certificación
  "certificados digitales": "Certificados Digitales",
  "firmas digitales": "Firmas Digitales",
  "cifrado de canal": "Cifrado de canal",
  cifrado: "Cifrado",

  // Control de acceso y contenido
  "control de url": "Control de URL",
  "control de aplicaciones": "Control de aplicaciones",

  // Infraestructura
  "ipv4/ipv6": "IPv4/IPv6",
  backup: "Backup",
  "balanceador de carga": "Balanceador de carga",
  "servidor virtual": "Servidor virtual",

  // Detección y respuesta
  "edr análisis forense": "EDR Análisis forense",
  siem: "SIEM",
  soc: "SOC",

  // Checks OT
  "seguridad activa": "Seguridad Activa",
  "seguridad pasiva": "Seguridad Pasiva",
  "seguimiento forense": "Seguimiento Forense",
};

/**
 * Normaliza un nombre de tecnología a su forma canónica
 * @param s - Nombre de tecnología a normalizar
 * @returns Nombre normalizado
 */
export function canon(s?: string): string {
  const key = (s ?? "").trim();
  const lower = key.toLowerCase();
  return TECH_ALIASES[lower] ?? key;
}

// =============================================================================
// SECCIÓN 2: DEFINICIÓN DE REGLAS POR ZONA (SOLO IDs NUEVOS)
// =============================================================================

// -----------------------------
// ZONA CLOUD
// -----------------------------
export const CLOUD_RULES: ZoneRuleSet = {
  zone: "cloud",
  subzones: [
    {
      id: "cloud-platform-security",
      name: "Seguridad en Plataformas como Servicio",
      requiredTechs: [
        "Firewall",
        "Control de aplicaciones",
        "Control de vulnerabilidad",
        "Análisis de vulnerabilidad",
        "Control de URL",
        "Correlación de logs",
        "Backup",
        "Antimalware",
        "Antibot",
      ],
    },
    {
      id: "digital-certificates-aas",
      name: "Certificados Digitales como Servicio",
      requiredTechs: ["Certificados Digitales"],
    },
    {
      id: "proxy-aas",
      name: "Proxy como Servicio",
      requiredTechs: [
        "Fuga de información",
        "Antimalware",
        "Control de URL",
        "Control de aplicaciones",
        "Antibot",
      ],
    },
    {
      id: "email-gateway-aas",
      name: "Gateway de Correo como Servicio",
      requiredTechs: [
        "Anti Phishing",
        "Anti Spam",
        "Antivirus de correo",
        "Control de amenazas avanzadas",
      ],
    },
    // Subzona opcional
    {
      id: "ddos-protection",
      name: "Protección DDoS",
      requiredTechs: [],
    },
  ],
};

// -----------------------------
// ZONA DMZ
// -----------------------------
export const DMZ_RULES: ZoneRuleSet = {
  zone: "dmz",
  subzones: [
    {
      id: "dmz-email-gateway",
      name: "Gateway de correo",
      requiredTechs: [
        "Anti Phishing",
        "Fuga de información",
        "Anti Spam",
        "Antivirus de correo",
        "WAF (DMZ)",
        "Email Gateway (On-Prem)",
      ],
    },
    {
      id: "dmz-load-balancer",
      name: "Balanceador de carga",
      requiredTechs: ["Balanceador de carga", "WAF", "IPv4/IPv6"],
    },
    {
      id: "dmz-web-gateway",
      name: "Gateway de Navegación",
      requiredTechs: [
        "Fuga de información",
        "Antibot",
        "Antimalware",
        "Control de aplicaciones",
        "Control de URL",
      ],
    },
    {
      id: "dmz-web-publishing",
      name: "Publicación Web",
      requiredTechs: [
        "Anti Phishing",
        "Monitoreo de integridad",
        "Servidor virtual",
      ],
    },
    {
      id: "dmz-waf",
      name: "WAF",
      requiredTechs: ["WAF"],
    },
    {
      id: "dmz-proxy",
      name: "Proxy",
      requiredTechs: ["Proxy"],
    },
  ],
};

// -----------------------------
// ZONA LAN
// -----------------------------
export const LAN_RULES: ZoneRuleSet = {
  zone: "lan",
  subzones: [
    {
      id: "lan-endpoint-client",
      name: "Cliente Punto Final",
      requiredTechs: [
        "Backup",
        "Control de aplicaciones",
        "Firewall",
        "EDR Análisis forense",
        "Antimalware",
        "Antivirus de correo",
        "Control de URL",
        "Control de amenazas avanzadas",
        "Anti Phishing",
        "Firmas Digitales",
        "Cifrado",
        "Antivirus de Navegación",
        "Análisis de vulnerabilidad",
        "Fuga de información",
        "Control de vulnerabilidad",
      ],
    },
    {
      id: "lan-pos",
      name: "POS",
      requiredTechs: [
        "EDR Análisis forense",
        "Antimalware",
        "Monitoreo de integridad",
      ],
    },
    {
      id: "lan-mobile-device",
      name: "Dispositivo Móvil",
      requiredTechs: ["Antimalware", "Control de aplicaciones"],
    },
    {
      id: "lan-video",
      name: "Video",
      requiredTechs: ["Cibercamera"],
    },
    {
      id: "lan-nac",
      name: "NAC",
      requiredTechs: ["NAC"],
    },
    {
      id: "lan-identity-management",
      name: "Gestión de Identidad",
      requiredTechs: ["Gestión de identidad"],
    },
  ],
};

// -----------------------------
// ZONA DATA CENTER
// -----------------------------
export const DC_RULES: ZoneRuleSet = {
  zone: "datacenter",
  subzones: [
    {
      id: "dc-ips-ids",
      name: "IPS/IDS",
      requiredTechs: ["IPS"],
    },
    {
      id: "dc-id-management",
      name: "Gestión de Identidad",
      requiredTechs: ["Gestión de identidad"],
    },
    {
      id: "dc-email-and-protection",
      name: "Correo + Protección de correo",
      requiredTechs: [
        "Anti Phishing",
        "Fuga de información",
        "Anti Spam",
        "Antivirus de correo",
      ],
    },
    {
      id: "dc-storage",
      name: "Almacenamiento",
      requiredTechs: [
        "Análisis de vulnerabilidad",
        "Control de vulnerabilidad",
        "Firewall",
        "Antimalware",
      ],
    },
    {
      id: "dc-backup-server",
      name: "Servidor de Backup",
      requiredTechs: [
        "Monitoreo de integridad",
        "Antimalware",
        "Firewall",
        "Backup",
      ],
    },
    {
      id: "dc-print-server",
      name: "Servidor de Impresión",
      requiredTechs: [
        "Análisis de vulnerabilidad",
        "Control de vulnerabilidad",
        "Firewall",
        "Antimalware",
      ],
    },
    {
      id: "dc-intranet",
      name: "Intranet",
      requiredTechs: ["Anti Spam", "Antivirus de correo", "Backup"],
    },
    {
      id: "dc-messaging-servers",
      name: "Servidores de Mensajería",
      requiredTechs: [
        "Análisis de vulnerabilidad",
        "Control de vulnerabilidad",
        "Firewall",
        "Antimalware",
        "Fuga de información",
        "Certificados Digitales",
      ],
    },
    {
      id: "dc-directory-dns-dhcp-ntp",
      name: "Directorio Activo, DNS, DHCP, NTP",
      requiredTechs: [
        "Análisis de vulnerabilidad",
        "Control de vulnerabilidad",
        "Firewall",
        "Antimalware",
      ],
    },
    {
      id: "dc-virtual-servers",
      name: "Servidores Virtuales",
      requiredTechs: [
        "Antibot",
        "Antimalware",
        "Control de aplicaciones",
        "Control de URL",
        "Backup",
        "Firewall",
        "Control de vulnerabilidad",
        "Correlación de logs",
        "Análisis de vulnerabilidad",
        "Monitoreo de integridad",
      ],
    },
    {
      id: "dc-channel-encryption",
      name: "Cifrados de canal",
      requiredTechs: ["Cifrado de canal"],
    },
    {
      id: "dc-app-servers",
      name: "Servidores de Aplicaciones",
      requiredTechs: [
        "Análisis de vulnerabilidad",
        "Control de vulnerabilidad",
        "Firewall",
        "Antimalware",
      ],
    },
    {
      id: "dc-db-waf",
      name: "WAF Base de Datos",
      requiredTechs: ["WAF"],
    },
    {
      id: "dc-databases",
      name: "Base de Datos",
      requiredTechs: [
        "Análisis de vulnerabilidad",
        "Control de vulnerabilidad",
        "Firewall",
        "Antimalware",
      ],
    },
    // Subzona opcional
    {
      id: "dc-dev-qa",
      name: "Serv. de Desarrollo, Calidad y Pruebas",
      requiredTechs: [],
    },
  ],
};

// -----------------------------
// ZONA OT (Operational Technology)
// -----------------------------
export const OT_RULES: ZoneRuleSet = {
  zone: "ot",
  subzones: [
    {
      id: "ot-corporate-firewall",
      name: "Corporate Firewall",
      requiredTechs: ["Firewall"],
    },
    {
      id: "ot-network-ips",
      name: "Network IPS",
      requiredTechs: ["IPS"],
    },

    {
      id: "ot-corporate-lt",
      name: "Corporate L.T",
      requiredChecks: ["Seguridad Activa", "Seguimiento Forense"],
    },
    {
      id: "ot-erp-server",
      name: "ERP Server",
      requiredChecks: ["Seguridad Activa", "Seguimiento Forense"],
    },

    {
      id: "ot-supervision-console-1",
      name: "Supervision Console 1",
      requiredChecks: ["Seguridad Activa"],
    },
    {
      id: "ot-supervision-console-2",
      name: "Supervision Console 2",
      requiredChecks: ["Seguridad Activa"],
    },

    {
      id: "ot-data-historian-scada-server",
      name: "Data Historian/Scada Server",
      requiredChecks: ["Seguridad Activa", "Seguridad Pasiva"],
    },
    {
      id: "ot-maintenance-laptop",
      name: "Mantenance Laptop",
      requiredChecks: ["Seguridad Activa", "Seguridad Pasiva"],
    },

    {
      id: "ot-inspection-network",
      name: "Inspection Network",
      requiredTechs: [],
    },
    {
      id: "ot-rtu",
      name: "Remote Terminal UNIT",
      requiredTechs: [],
    },

    {
      id: "ot-plc",
      name: "PLC",
      requiredTechs: ["Wireless Industrial Network"],
    },
    {
      id: "ot-wireless-industrial-network",
      name: "Wireless Industrial Network",
      requiredTechs: [],
    },

    {
      id: "ot-work-station",
      name: "Work Station",
      requiredTechs: ["PLC 1", "PLC 2"],
      requiredChecks: ["Seguridad Pasiva"],
    },
    {
      id: "ot-mobile",
      name: "Móvil",
      requiredChecks: ["Seguridad Pasiva", "Seguridad Activa"],
    },

    {
      id: "ot-production-management",
      name: "Production Management",
      requiredTechs: [],
    },
    {
      id: "ot-critical-infrastructure-video",
      name: "Video infraestructura Crítica",
      requiredTechs: [],
    },
  ],
};

// =============================================================================
// SECCIÓN 3: CONJUNTO COMPLETO DE REGLAS
// =============================================================================

/**
 * Conjunto completo de todas las reglas organizadas por zona
 */
export const RULESETS: ZoneRuleSet[] = [
  CLOUD_RULES,
  DMZ_RULES,
  LAN_RULES,
  DC_RULES,
  OT_RULES,
];

// =============================================================================
// SECCIÓN 4: FUNCIONES AUXILIARES PARA DETECCIÓN Y REPORTE
// =============================================================================

/**
 * Extrae nombres de tecnologías presentes en una subzona
 * @param nodes - Lista de nodos del grafo
 * @param subzoneId - ID de la subzona a evaluar
 * @returns Array con los nombres de las tecnologías presentes
 */
export function getPresentTechsForSubzone(
  nodes: any[],
  subzoneId: string
): string[] {
  // Busca la zona por data.id (nuevo)
  const zoneNode = nodes.find(
    (n) => n.type === "zone" && String(n?.data?.id) === subzoneId
  );
  if (!zoneNode) return [];

  const techs = nodes.filter(
    (n) => n.type === "tech" && n.parentId === zoneNode.id
  );
  const getName = (n: any) => canon(n?.data?.name ?? n?.data?.label ?? "");
  return Array.from(new Set(techs.map(getName).filter(Boolean)));
}

/**
 * Para OT: obtiene checks presentes (en data.checks o como hijos type 'otCheck')
 * @param nodes - Lista de nodos del grafo
 * @param subzoneId - ID de la subzona a evaluar
 * @returns Array con los nombres de los checks presentes
 */
export function getPresentChecksForSubzone(
  nodes: any[],
  subzoneId: string
): string[] {
  const zoneNode = nodes.find(
    (n) => n.type === "zone" && String(n?.data?.id) === subzoneId
  );
  if (!zoneNode) return [];

  const fromZone = Array.isArray(zoneNode?.data?.checks)
    ? (zoneNode.data.checks as string[])
    : [];
  const fromChildren = nodes
    .filter((n) => n.parentId === zoneNode.id && n.type === "otCheck")
    .map((n) => canon(n?.data?.name ?? n?.data?.label ?? ""));

  return Array.from(new Set([...fromZone.map(canon), ...fromChildren]));
}

/**
 * Encuentra la regla correspondiente a una subzona
 * @param zone - Tipo de zona
 * @param subzoneId - ID de la subzona
 * @returns Regla de la subzona o undefined si no se encuentra
 */
export function findSubzoneRule(
  zone: ZoneKind,
  subzoneId: string
): SubzoneRule | undefined {
  const set = RULESETS.find((s) => s.zone === zone);
  return set?.subzones.find(
    (sz) => sz.id === subzoneId || sz.name === subzoneId
  );
}

/**
 * Identifica tecnologías y checks faltantes para una subzona
 * @param zone - Tipo de zona
 * @param subzoneId - ID de la subzona
 * @param presentTechs - Tecnologías presentes
 * @param presentChecks - Checks presentes
 * @returns Objeto con tecnologías y checks faltantes
 */
export function getMissingForSubzone(
  zone: ZoneKind,
  subzoneId: string,
  presentTechs: string[],
  presentChecks: string[] = []
) {
  const rule = findSubzoneRule(zone, subzoneId);
  if (!rule) return { missingTechs: [], missingChecks: [] };

  const have = new Set(presentTechs.map(canon));
  const haveChecks = new Set(presentChecks.map(canon));

  const missingTechs = (rule.requiredTechs ?? []).filter(
    (t) => !have.has(canon(t))
  );
  const missingChecks = (rule.requiredChecks ?? []).filter(
    (c) => !haveChecks.has(canon(c))
  );

  return { missingTechs, missingChecks };
}

/**
 * Genera un reporte de brechas para una zona específica (usa SOLO IDs nuevos)
 * @param nodes - Lista de nodos del grafo
 * @param zone - Tipo de zona a evaluar
 * @returns Array con el reporte de brechas por subzona
 */
export function buildGapReport(nodes: any[], zone: ZoneKind) {
  const set = RULESETS.find((s) => s.zone === zone);
  if (!set) return [];

  return set.subzones.map((sz) => {
    const presentTechs = getPresentTechsForSubzone(nodes, sz.id);
    const presentChecks =
      zone === "ot" ? getPresentChecksForSubzone(nodes, sz.id) : [];
    const { missingTechs, missingChecks } = getMissingForSubzone(
      zone,
      sz.id,
      presentTechs,
      presentChecks
    );
    return {
      subzoneId: sz.id,
      subzoneName: sz.name,
      presentTechs,
      presentChecks,
      missingTechs,
      missingChecks,
    };
  });
}
