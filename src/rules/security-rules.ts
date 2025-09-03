// rules/security-rules.ts
// ================================================================
// 1) Normalización de nombres de tecnologías
// ================================================================

import type { ZoneKind } from "../mocks/technologies.types";
import { cloudZones } from "../components/data/CloudZones";
import { dmzZones } from "../components/data/DmzZones";
import { lanZones } from "../components/data/LanZones";
import { datacenterZones } from "../components/data/DatacenterZones";
import { otZones } from "../components/data/OtZones";

export const TECH_ALIASES: Record<string, string> = {
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
  "anti phishing": "Anti Phishing",
  antiphising: "Anti Phishing",
  "anti phising": "Anti Phishing",
  "control de amenazas avanzadas": "Control de amenazas avanzadas",
  "analisis de vulnerabilidad": "Análisis de vulnerabilidad",
  "control de vulnerabilidad ": "Control de vulnerabilidad",
  "gestion de id": "Gestión de identidad",
  "antivirus de navegacion": "Antivirus de Navegación",
  "monitoreo de integridad": "Monitoreo de integridad",
  "correlacion de logs": "Correlación de logs",
  "fuga de informacion": "Fuga de información",
  "certificados digitales": "Certificados Digitales",
  "firmas digitales": "Firmas Digitales",
  "cifrado de canal": "Cifrado de canal",
  cifrado: "Cifrado",
  "control de url": "Control de URL",
  "control de aplicaciones": "Control de aplicaciones",
  "ipv4/ipv6": "IPv4/IPv6",
  backup: "Backup",
  "balanceador de carga": "Balanceador de carga",
  "servidor virtual": "Servidor virtual",
  "edr análisis forense": "EDR Análisis forense",
  siem: "SIEM",
  soc: "SOC",
  "seguridad activa": "Seguridad Activa",
  "seguridad pasiva": "Seguridad Pasiva",
  "seguimiento forense": "Seguimiento Forense",
};

export function canon(s?: string): string {
  const key = (s ?? "").trim();
  const lower = key.toLowerCase();
  return TECH_ALIASES[lower] ?? key;
}

// ================================================================
// 2) Subzonas disponibles (solo ids/nombres)
// ================================================================

const SUBZONES_BY_ZONE: Record<ZoneKind, { id: string; name: string }[]> = {
  cloud: cloudZones.map((z) => ({ id: z.id, name: z.name })),
  dmz: dmzZones.map((z) => ({ id: z.id, name: z.name })),
  lan: lanZones.map((z) => ({ id: z.id, name: z.name })),
  datacenter: datacenterZones.map((z) => ({ id: z.id, name: z.name })),
  ot: otZones.map((z) => ({ id: z.id, name: z.name })),
};

// ================================================================
// 3) Presencia en el canvas + detección de tecnologías/checks
// ================================================================

/** ¿Existe en el canvas la subzona (nodo type 'zone' con data.id=subzoneId)? */
export function isSubzonePresent(nodes: any[], subzoneId: string): boolean {
  return nodes.some(
    (n) => n.type === "zone" && String(n?.data?.id) === subzoneId
  );
}

/** ¿Qué zonas (cloud/dmz/lan/datacenter/ot) están presentes en el canvas? */
export function getZoneKindsPresent(nodes: any[]): Set<ZoneKind> {
  const s = new Set<ZoneKind>();
  nodes.forEach((n) => {
    if (n.type === "zone" && n?.data?.kind) s.add(n.data.kind as ZoneKind);
  });
  return s;
}

/** Tecnologías presentes dentro de una subzona (hijos type 'tech') */
export function getPresentTechsForSubzone(
  nodes: any[],
  subzoneId: string
): string[] {
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

/** Checks presentes en OT (si los modelas) */
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

// ================================================================
// 4) Requisitos dinámicos desde el backend
// ================================================================

export type RequirementsMap = Record<string, string[]>;

// ================================================================
// 5) Reporte de brechas (incluye presencia de subzona)
// ================================================================

export function buildGapReport(
  nodes: any[],
  zone: ZoneKind,
  requirements: RequirementsMap
) {
  const subzones = SUBZONES_BY_ZONE[zone] ?? [];

  return subzones.map((sz) => {
    const subzonePresent = isSubzonePresent(nodes, sz.id);

    const requiredTechs = (requirements[sz.id] ?? []).map(canon);

    const presentTechs = subzonePresent
      ? getPresentTechsForSubzone(nodes, sz.id).map(canon)
      : [];

    const presentChecks =
      zone === "ot" && subzonePresent
        ? getPresentChecksForSubzone(nodes, sz.id)
        : [];

    const have = new Set(presentTechs.map(canon));
    const missingTechs = requiredTechs.filter((t) => !have.has(canon(t)));

    return {
      subzoneId: sz.id,
      subzoneName: sz.name,
      subzonePresent, // << NUEVO
      presentTechs,
      presentChecks,
      missingTechs,
      missingChecks: [],
    };
  });
}
