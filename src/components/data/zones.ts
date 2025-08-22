export const zoneTemplates = [
  {
    id: "dmz",
    name: "DMZ",
    color: "#ffa500",
    description: "Zona desmilitarizada",
    level: "medium" as const,
  },
  {
    id: "lan",
    name: "LAN",
    color: "#4ecdc4",
    description: "Red local interna",
    level: "high" as const,
  },
  {
    id: "datacenter",
    name: "Data Center",
    color: "#45b7d1",
    description: "Centro de datos",
    level: "high" as const,
  },
  {
    id: "cloud",
    name: "Cloud",
    color: "#6c5ce7",
    description: "Servicios en la nube",
    level: "medium" as const,
  },
  {
    id: "ot",
    name: "OT",
    color: "#00b894",
    description: "Tecnología operacional",
    level: "high" as const,
  },
] as const;

export type ZoneKind = (typeof zoneTemplates)[number]["id"];
