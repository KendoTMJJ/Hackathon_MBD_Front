export type LanZoneId =
  | "lan-endpoint-client"
  | "lan-pos"
  | "lan-mobile-device"
  | "lan-video"
  | "lan-nac"
  | "lan-identity-management";

export interface LanZone {
  id: LanZoneId;
  name: string;
  description?: string;
  caracteristics: string;
  color: string;
  level: "low" | "medium" | "high";
  icon?: string;
}

export const lanZones: LanZone[] = [
  {
    id: "lan-endpoint-client",
    name: "Cliente Punto Final",
    description:
      "Protección de endpoints: AV/EDR, control de dispositivos, hardening y filtrado web.",
    caracteristics:"El Cliente Punto Final corresponde a los equipos de escritorio, portátiles y estaciones de trabajo que utilizan los "+
    "empleados dentro de la red local. Aquí se aplican medidas de seguridad como antivirus, control de dispositivos USB, filtros de navegación, protección contra malware avanzado y gestión de aplicaciones, con el fin de proteger tanto al usuario como a la infraestructura interna.",
    color: "#22F0F0",
    level: "high",
    icon: "💻",
  },
  {
    id: "lan-pos",
    name: "POS",
    description:
      "Terminales de punto de venta: segmentación, monitoreo y protección de aplicaciones.",
    caracteristics: "POS (Point of Sale) hace referencia a los terminales de punto de venta utilizados en comercios y entidades financieras. "+
    "Estos dispositivos manejan transacciones sensibles y, por lo tanto, requieren medidas de protección contra malware, accesos indebidos y fraudes que puedan comprometer la información financiera.",
    color: "#22F0F0",
    level: "medium",
    icon: "🧾",
  },
  {
    id: "lan-mobile-device",
    name: "Dispositivo Móvil",
    description:
      "MDM/MAM, protección de apps y cumplimiento para smartphones y tablets.",
    caracteristics: "Los Dispositivos Móviles forman parte esencial de la red local, ya que empleados y usuarios acceden a aplicaciones y "+
    "datos corporativos desde sus teléfonos y tabletas. Por su movilidad y exposición a redes externas, representan un punto crítico de seguridad, siendo necesario aplicar controles para evitar la entrada de malware o la fuga de información.",
    color: "#22F0F0",
    level: "medium",
    icon: "📱",
  },
  {
    id: "lan-video",
    name: "Video",
    description: "CCTV/Video IP, NVR y segmentación de red.",
    caracteristics: "En la subzona de Video, se encuentran los sistemas de videovigilancia y cámaras de seguridad conectadas a la red. "+
    "Estos equipos deben ser gestionados de forma segura para evitar accesos no autorizados, manipulación de grabaciones o ataques que comprometan la privacidad de las imágenes.",
    color: "#22D3EE",
    level: "medium",
    icon: "🎥",
  },
  {
    id: "lan-nac",
    name: "NAC",
    description:
      "Control de acceso 802.1X, perfilado de dispositivos y políticas por rol.",
    caracteristics: "NAC (Network Access Control) se encarga de verificar y controlar qué dispositivos pueden conectarse a la red. Solo los "+
    "equipos que cumplan con las políticas de seguridad definidas (como parches actualizados, antivirus activo o configuraciones correctas) son autorizados, bloqueando los que representen un riesgo.",
    color: "#22F0F0",
    level: "high",
    icon: "🚦",
  },
  {
    id: "lan-identity-management",
    name: "Gestión de ID",
    description:
      "Gestión de identidades y accesos (SSO/MFA), directorios e IAM.",
    caracteristics: "La Gestión de ID permite administrar la identidad digital de los usuarios, controlando su autenticación y autorización "+
    "dentro de la red. Este sistema asegura que cada persona acceda únicamente a los recursos que le corresponden, reduciendo riesgos de accesos indebidos o suplantaciones.",
    color: "#22F0F0",
    level: "high",
    icon: "🆔",
  },
];
