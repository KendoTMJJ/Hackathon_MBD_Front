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
  | "ot-pcl"
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
  caracteristics?: string;
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
    caracteristics: "El Corporate Firewall protege la comunicación entre la red corporativa y la red industrial, evitando accesos no "+
    "autorizados y posibles ataques que puedan comprometer los sistemas de producción. Junto a él, el Network IPS monitorea el tráfico de red para identificar y detener actividades maliciosas que intenten infiltrarse en el entorno de control industrial.",
    color: "#992E08",
    level: "high",
    icon: "🧱",
  },
  {
    id: "ot-network-ips",
    name: "Network IPS",
    description: "Inspección y bloqueo de tráfico industrial.",
    caracteristics: "El Network IPS dentro de la zona OT tiene la tarea de monitorear el tráfico de red en tiempo real para identificar "+
    "y detener intentos de intrusión. A diferencia de los sistemas de detección, este componente puede bloquear directamente paquetes o conexiones sospechosas, protegiendo la infraestructura industrial frente a ataques dirigidos o comportamientos anómalos que podrían afectar los procesos críticos.",
    color: "#992E08",
    level: "high",
    icon: "⚡",
  },
  {
    id: "ot-corporate-lt",
    name: "Corporate L.T",
    description: "Interconexión con la red corporativa (LT).",
    caracteristics: "El Corporate I.T. representa la integración entre los sistemas de tecnología corporativa y los de tecnología operacional. "+
    "Su función es permitir que la información fluya entre el entorno empresarial y el industrial de manera controlada, garantizando que los procesos productivos estén alineados con las necesidades de negocio sin comprometer la seguridad de la red de producción.",
    color: "#992E08",
    level: "high",
    icon: "🏢",
  },
  {
    id: "ot-erp-server",
    name: "ERP Server",
    description: "Integración OT-IT con sistemas ERP.",
    caracteristics: "El ERP Server conecta la capa de negocio con la capa de producción, integrando información financiera, logística y "+
    "operativa. Gracias a él, la empresa puede tomar decisiones basadas en datos en tiempo real que provienen directamente de la planta.",
    color: "#992E08",
    level: "high",
    icon: "🗄️",
  },

  {
    id: "ot-production-management",
    name: "Production Management",
    description: "MES/MOM y orquestación de procesos.",
    caracteristics: "El sistema de Production Management coordina y optimiza los procesos de fabricación, asegurando que los recursos se "+
    "utilicen de manera eficiente y que la producción cumpla con los tiempos y estándares de calidad definidos.",
    color: "#992E08",
    level: "high",
    icon: "🏭",
  },
  {
    id: "ot-data-historian-scada-server",
    name: "Data Historian/Scada Server",
    description: "Historiador y servicios SCADA/HMI.",
    caracteristics: "El Data Historian o SCADA Server se encarga de recopilar, almacenar y organizar grandes volúmenes de datos generados "+
    "por los procesos industriales. Este servidor es clave para analizar tendencias, supervisar operaciones y garantizar la continuidad de la producción. Para apoyar su gestión, existen las Consolas de Supervisión, que permiten a los operadores visualizar y controlar en tiempo real el estado de la red de producción y sus procesos.",
    color: "#992E08",
    level: "high",
    icon: "📈",
  },
  {
    id: "ot-maintenance-laptop",
    name: "Mantenance Laptop",
    description: "Equipo de ingeniería con acceso controlado.",
    caracteristics: "El Maintenance Laptop es el equipo portátil que utilizan los técnicos para realizar labores de soporte, configuración "+
    "y diagnóstico en los sistemas industriales. Debido a que se conecta directamente a equipos sensibles como PLC o servidores SCADA, debe contar con estrictos controles de seguridad para evitar que se convierta en un punto de entrada de malware o accesos no autorizados.",
    color: "#992E08",
    level: "medium",
    icon: "💻",
  },

  {
    id: "ot-supervision-console-1",
    name: "Supervision Console 1",
    description: "Puesto de operación SCADA/HMI.",
    caracteristics: "La Supervision Console 1 es una estación dedicada a la supervisión en tiempo real de los procesos industriales. "+
    "Desde esta consola los operadores pueden monitorear el estado de los equipos, visualizar alarmas y ejecutar acciones inmediatas en caso de anomalías o incidentes dentro de la planta.",
    color: "#992E08",
    level: "medium",
    icon: "🖥️",
  },
  {
    id: "ot-supervision-console-2",
    name: "Supervision Console 2",
    description: "Consola redundante/alternativa.",
    caracteristics: "La Supervision Console 2 generalmente se utiliza como redundancia o para tareas específicas de control. Tener varias "+
    "consolas de supervisión permite distribuir responsabilidades entre operadores y asegurar que la red de producción esté vigilada de manera constante, minimizando riesgos de fallos o interrupciones.",
    color: "#992E08",
    level: "medium",
    icon: "🖥️",
  },

  {
    id: "ot-inspection-network",
    name: "Inspection Network",
    description: "Segmento de monitoreo fuera de banda.",
    caracteristics: "La Inspection Network refuerza la seguridad al revisar el tráfico que circula dentro de la red de producción, "+
    "asegurando que las comunicaciones entre equipos y sistemas críticos sean legítimas y estén libres de amenazas.",
    color: "#992E08",
    level: "medium",
    icon: "🔍",
  },

  {
    id: "ot-rtu",
    name: "Remote Terminal UNIT",
    description: "Unidades remotas de campo.",
    caracteristics: "Los dispositivos de Remote Terminal Unit (RTU) son elementos fundamentales en la automatización industrial. Los "+
    "RTU permiten la supervisión remota de equipos en campo",
    color: "#992E08",
    level: "high",
    icon: "📡",
  },

  {
    id: "ot-pcl",
    name: "PCL",
    description: "Controladores lógicos programables.",
    caracteristics: "Los PLC (Controladores Lógicos Programables) controlan directamente las máquinas y procesos industriales. Estos "+
    "equipos requieren una protección especial debido a su papel crítico en la operación.",
    color: "#992E08",
    level: "high",
    icon: "🔧",
  },

  {
    id: "ot-wireless-industrial-network",
    name: "Wireless Industrial Network",
    description: "Conectividad inalámbrica para sensores/actuadores.",
    caracteristics: "La Wireless Industrial Network ofrece conectividad inalámbrica en los entornos de producción, facilitando la "+
    "comunicación entre dispositivos y sensores. Aunque aumenta la flexibilidad, también demanda medidas de seguridad reforzadas para evitar accesos indebidos.",
    color: "#992E08",
    level: "medium",
    icon: "📶",
  },

  {
    id: "ot-work-station",
    name: "Work Station",
    description: "Puesto de operación/ingeniería.",
    caracteristics: "Las Work Stations son las estaciones de trabajo que utilizan los operadores y técnicos para interactuar con el "+
    "sistema de control industrial. Desde ellas se ejecutan tareas de supervisión, configuración y respuesta ante incidentes en la planta.",
    color: "#992E08",
    level: "medium",
    icon: "🖱️",
  },

  {
    id: "ot-mobile",
    name: "Movil",
    description: "Terminales móviles en planta.",
    caracteristics: "Los Dispositivos Móviles en la red OT permiten a los técnicos y operadores acceder a sistemas y datos desde cualquier "+
    "lugar de la planta, facilitando la movilidad y la respuesta rápida, aunque también exigen medidas de seguridad estrictas para evitar brechas.",
    color: "#992E08",
    level: "low",
    icon: "📱",
  },

  {
    id: "ot-critical-infrastructure-video",
    name: "Video infraestructura Critica",
    description: "CCTV/VMS y videoseguridad industrial.",
    caracteristics: "Video Infraestructura Crítica se encarga de la vigilancia y monitoreo visual de las áreas más sensibles del entorno "+
    "industrial. Estas cámaras y sistemas de video proporcionan una capa adicional de seguridad, tanto en lo físico como en lo digital, para proteger la continuidad de las operaciones.",
    color: "#992E08",
    level: "high",
    icon: "🎥",
  },
];
