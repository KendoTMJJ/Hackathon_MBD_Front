export const zoneTemplates = [
  {
    id: "dmz",
    name: "DMZ",
    img: "/images/dmz.jpg",
    color: "#F59E0B",
    description: "Zona desmilitarizada",
  },
  {
    id: "lan",
    name: "LAN",
    img: "/images/lan.jpg",
    color: "#22F0F0",
    description: "Red local interna",
  },
  {
    id: "datacenter",
    name: "Data Center",
    // img: "/images/dtc.jpg",
    img: "",
    color: "#E300A4",
    description: "Centro de datos",
  },
  {
    id: "cloud",
    name: "Cloud",
    img: "/images/nube.jpg",
    color: "#707070",
    description: "Servicios en la nube",
  },
  {
    id: "ot",
    name: "OT",
    img: "/images/ot.jpg",
    color: "#992E08",
    description: "Tecnología operacional",
  },
] as const;

export type ZoneKind = (typeof zoneTemplates)[number]["id"];
