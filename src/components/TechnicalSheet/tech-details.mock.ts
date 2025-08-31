// Servicio "mock" para ficha técnica (reemplazable por axios + Nest en el futuro)
export type TechDetails = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  provider?: string;
  allowedZones?: string[];
  allowedSubzones?: string[];
  tags?: string[];
  // Campos extendidos para la ficha:
  features?: string[];
  pros?: string[];
  cons?: string[];
  docsUrl?: string;
  vendorUrl?: string;
  notes?: string;
};

const DB: Record<string, TechDetails> = {
  "cloud-cspm": {
    id: "cloud-cspm",
    name: "CSPM",
    description: "Postura de seguridad en la nube (CSPM).",
    provider: "CloudGuard",
    imageUrl: "/assets/tech/cspm.png",
    features: [
      "Evaluación de configuración multi-cloud",
      "Alertas de desviaciones de postura",
      "Integración con CI/CD",
    ],
    pros: ["Cobertura multicloud", "Buenas integraciones", "Alertado claro"],
    cons: ["Curva de aprendizaje", "Costo por volumen"],
    docsUrl: "https://docs.example.com/cspm",
    vendorUrl: "https://vendor.example.com/cspm",
    notes: "Ideal para organizaciones con varias cuentas/proveedores cloud.",
  },
  "dmz-waf": {
    id: "dmz-waf",
    name: "WAF",
    description: "Protección de aplicaciones web expuestas.",
    provider: "AppShield",
    imageUrl: "/assets/tech/waf.png",
    features: [
      "Reglas OWASP Top 10",
      "Bot management básico",
      "Virtual Patching",
    ],
    pros: ["Fácil de operar", "Buen rendimiento L7"],
    cons: ["Bot management limitado en versión base"],
    docsUrl: "https://docs.example.com/waf",
  },
  "lan-nac": {
    id: "lan-nac",
    name: "NAC",
    description: "Control de acceso a la red (802.1X, MAB).",
    provider: "NetAuth",
    imageUrl: "/assets/tech/nac.png",
    features: ["802.1X/MAB", "Guest Portal", "Postura de endpoint"],
    pros: ["Gran visibilidad de endpoints"],
    cons: ["Despliegue inicial complejo"],
  },
  "dc-siem": {
    id: "dc-siem",
    name: "SIEM",
    description: "Correlación de eventos y búsqueda de amenazas.",
    provider: "BH Architype",
    imageUrl: "/assets/tech/siem.png",
    features: ["Ingesta masiva", "Búsqueda avanzada", "Dashboards"],
    pros: ["Escala", "Ecosistema amplio"],
    cons: ["Coste por GB/día"],
  },
  "ot-ips-industrial": {
    id: "ot-ips-industrial",
    name: "Network IPS (Industrial)",
    description: "Detección/bloqueo para protocolos ICS/SCADA.",
    provider: "OT Secure",
    imageUrl: "/assets/tech/ips-ot.png",
    features: ["Firmas ICS", "Anomalías en red OT", "Bloqueo in-line"],
  },
};

// Simula latencia de red y devuelve una promesa
export async function fetchTechnologyDetailsMock(
  id: string
): Promise<TechDetails | null> {
  await new Promise((r) => setTimeout(r, 200)); // 200ms mock
  return DB[id] ?? null;
}
