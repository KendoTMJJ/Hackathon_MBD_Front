export const zoneTemplates = [
  {
    id: "dmz",
    name: "DMZ",
    img: "/images/dmz.png",
    color: "#F59E0B",
    description: "Zona desmilitarizada",
    image: "/images/dmz-titulo-color.png"
  },
  {
    id: "lan",
    name: "LAN",
    img: "/images/lan.png",
    color: "#22F0F0",
    description: "Red local interna",
    image: "/images/lan-titulo-color.png"
  },
  {
    id: "datacenter",
    name: "Data Center",
    img: "/images/datacenter.png",
    color: "#E300A4",
    description: "Centro de datos",
    image: "/images/datacenter-titulo-color.png"
  },
  {
    id: "cloud",
    name: "Cloud",
    img: "/images/nube-info.png",
    color: "#707070",
    description: "Servicios en la nube",
    image: "/images/nube-titulo-color-sidebar.png"
  },
  {
    id: "ot",
    name: "OT",
    img: "/images/ot.png",
    color: "#992E08",
    description: "Tecnología operacional",
    image: "/images/ot-titulo-color.png"
  },
] as const;

export type ZoneKind = (typeof zoneTemplates)[number]["id"];
