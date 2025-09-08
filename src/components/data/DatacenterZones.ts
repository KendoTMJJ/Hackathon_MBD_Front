// src/data/DatacenterZones.ts

export type DatacenterZoneId =
  | "dc-id-management"
  | "dc-dev-qa"
  | "dc-ips-ids"
  | "dc-email-and-protection"
  | "dc-storage"
  | "dc-intranet"
  | "dc-print-server"
  | "dc-backup-server"
  | "dc-messaging-servers"
  | "dc-directory-dns-dhcp-ntp"
  | "dc-virtual-servers"
  | "dc-channel-encryption"
  | "dc-app-servers"
  | "dc-databases"
  | "dc-waf-databases"
  | "dc-firewall-ips/id"
  | "dc-admin-canal"
  | "dc-Ddos-protection";

export interface DatacenterZone {
  id: DatacenterZoneId;
  /** Título visible en la pastilla */
  name: string;
  /** Texto corto para tooltip o lista */
  description?: string;
  caracteristics: string;
  /** Color base (borde/Minimap) */
  color: string;
  /** Emoji/char para mostrar en el panel (opcional) */
  icon?: string;
}

export const datacenterZones: DatacenterZone[] = [
  {
    id: "dc-Ddos-protection",
    name: "DDoS",
    description:
      "Punto de defensa dedicado a la detección y mitigación de ataques DDoS en el perímetro de red.",
    caracteristics: "DDoS (Distributed Denial of Service) se enfoca en la protección contra ataques masivos de denegación de servicio. Estos "+
    "ataques buscan saturar servidores, aplicaciones o servicios en línea mediante un volumen excesivo de tráfico malicioso proveniente de múltiples orígenes, lo que puede dejar inoperativos los sistemas. La defensa contra DDoS en la nube utiliza mecanismos de absorción y mitigación de tráfico a gran escala, asegurando que las aplicaciones y servicios permanezcan disponibles incluso cuando enfrentan intentos de interrupción por parte de atacantes.",
    color: "#E51212",
    icon: "🧱",
  },
  {
    id: "dc-firewall-ips/id",
    name: "Firewall IPS/IDS",
    description:
      "Sistema de firewall perimetral con funciones de detección y prevención de intrusiones para proteger el datacenter frente a accesos no autorizados y ataques avanzados.",
    caracteristics: "El Firewall IPS/IDS combina las funciones de un cortafuegos tradicional con las capacidades de detección y prevención de intrusiones. Por un lado, actúa "+
    "como una barrera que filtra el tráfico entrante y saliente según políticas de seguridad establecidas; y por otro, analiza en profundidad el tráfico para identificar comportamientos sospechosos, posibles ataques o vulnerabilidades explotadas. Mientras el IDS detecta y alerta sobre anomalías, el IPS puede detenerlas en tiempo real, ofreciendo así una protección más completa frente a amenazas externas e internas.",
    color: "#E51212",
    icon: "🛡️",
  },

  {
    id: "dc-admin-canal",
    name: "Administrador de Canal",
    description:
      "Componente de seguridad perimetral encargado de la gestión de tráfico y la mitigación de amenazas a nivel de canal en el datacenter.",
    caracteristics: "El Administrador de Canal es un componente que se encarga de gestionar y supervisar las conexiones de comunicación entre diferentes "+
    "sistemas y servicios, especialmente en entornos de red donde se maneja un alto volumen de datos. Su función es garantizar que el flujo de información se realice de forma ordenada, segura y eficiente, evitando saturaciones, pérdidas de información o accesos indebidos en los canales de comunicación críticos.",
    color: "#E53935",
    icon: "📡",
  },

  {
    id: "dc-id-management",
    name: "Gestión de ID",
    description: "IAM/SSO/MFA y gobierno de identidades dentro del DC.",
    caracteristics: "la Gestión de ID permite controlar la identidad digital de los usuarios y sistemas que acceden a los recursos críticos "+
    "del centro de datos. Su función es garantizar que las autenticaciones y autorizaciones se realicen de manera segura, reduciendo riesgos de accesos indebidos y suplantaciones.",
    color: "#E300A4",
    icon: "🆔",
  },
  {
    id: "dc-dev-qa",
    name: "Serv. de Desarrollo, Calidad y Pruebas",
    description: "Ambientes Dev/QA con aislamiento y controles de cambio.",
    caracteristics: "Los Servidores de Desarrollo, Calidad y Pruebas son espacios controlados donde los equipos de tecnología crean, "+
    "verifican y validan aplicaciones antes de pasarlas a producción. Estos entornos permiten detectar errores y vulnerabilidades con anticipación, protegiendo la estabilidad del entorno productivo.",
    color: "#DFE300",
    icon: "🧪",
  },
  {
    id: "dc-ips-ids",
    name: "IPS/IDS",
    description: "Detección y prevención de intrusiones en el DC.",
    caracteristics: "IPS/IDS (Intrusion Prevention System / Intrusion Detection System) cumple la función de detectar y, en algunos casos, "+
    "bloquear actividades maliciosas dentro de la red. Un IDS se centra en monitorear el tráfico para identificar comportamientos "+
    "sospechosos, alertando sobre intentos de intrusión o anomalías. Por su parte, un IPS va un paso más allá, ya que además de detectar puede prevenir, bloqueando en tiempo real conexiones o paquetes dañinos antes de que alcancen los sistemas críticos. Este mecanismo es clave para anticiparse a ataques y mantener la seguridad del entorno del data center.",
    color: "#E300A4",
    icon: "⚡",
  },
  {
    id: "dc-email-and-protection",
    name: "Correo + Protección de Correo",
    description: "Servidores de correo con antispam/antimalware/DLP.",
    caracteristics: "El servicio de Correo y Protección de Correo asegura la mensajería dentro de la organización. No solo gestiona el envío "+
    "y recepción de correos, sino que también añade filtros contra spam, malware y phishing, protegiendo la comunicación interna y externa.",
    color: "#E300A4",
    icon: "📧",
  },
  {
    id: "dc-storage",
    name: "Almacenamiento",
    description: "Cabinas/NAS/SAN con cifrado y snapshots.",
    caracteristics: "El área de Almacenamiento concentra los repositorios de datos críticos de la organización. Aquí se resguardan grandes "+
    "volúmenes de información y se aplican medidas de seguridad como cifrado, redundancia y protección contra accesos no autorizados.",
    color: "#E300A4",
    icon: "🗄️",
  },
  {
    id: "dc-intranet",
    name: "Intranet",
    description: "Portales internos y aplicaciones corporativas.",
    caracteristics: "La Intranet funciona como una red privada interna que conecta a empleados con aplicaciones y recursos corporativos. "+
    "Al estar protegida dentro del data center, permite el intercambio seguro de información y la colaboración entre áreas.",
    color: "#E300A4",
    icon: "🏢",
  },
  {
    id: "dc-print-server",
    name: "Servidor de Impresión",
    description: "Spoolers y control de impresión seguros.",
    caracteristics: "El Servidor de Impresión centraliza y gestiona las peticiones de impresión de la red corporativa. Este control evita "+
    "abusos, mantiene registros de actividad y protege documentos sensibles dentro de la infraestructura interna.",
    color: "#E300A4",
    icon: "🖨️",
  },
  {
    id: "dc-backup-server",
    name: "Servidor de Backup",
    description: "Respaldos, retención, inmutabilidad y recuperación.",
    caracteristics: "El Servidor de Backup es responsable de realizar copias de seguridad de la información crítica. Su objetivo es garantizar"+
    " la recuperación de datos en caso de fallos, ataques o pérdidas, brindando continuidad al negocio.",
    color: "#E300A4",

    icon: "💽",
  },
  {
    id: "dc-messaging-servers",
    name: "Servidores de Mensajería",
    description: "Colaboración/IM/colas internas.",
    caracteristics: "Los Servidores de Mensajería permiten el envío de mensajes internos entre usuarios y sistemas, funcionando como soporte "+
    "de la comunicación empresarial. Se integran con servicios de directorio y autenticación para mayor seguridad.",
    color: "#E300A4",

    icon: "💬",
  },
  {
    id: "dc-directory-dns-dhcp-ntp",
    name: "Directorio Activo, DNS, DHCP, NTP",
    description: "Servicios de directorio y esenciales de red.",
    caracteristics: "El Directorio Activo, DNS, DHCP y NTP forman el núcleo de la gestión de red y usuarios. Estos servicios permiten la "+
    "administración centralizada de identidades, la resolución de nombres de dominio, la asignación de direcciones IP y la sincronización horaria, elementos clave para la estabilidad y seguridad de la infraestructura.",
    color: "#E300A4",

    icon: "📁",
  },
  {
    id: "dc-virtual-servers",
    name: "Servidores Virtuales",
    description: "Clusters de virtualización, hipervisores y VM.",
    caracteristics: "Los Servidores Virtuales alojan múltiples sistemas operativos y aplicaciones dentro de una misma infraestructura física "+
    "mediante virtualización. Esta capacidad permite optimizar recursos, reducir costos y mejorar la flexibilidad en la gestión del data center.",
    color: "#E300A4",

    icon: "🖥️",
  },
  {
    id: "dc-channel-encryption",
    name: "Cifrados de Canal",
    description: "TLS/IPsec, túneles y cifrado de comunicaciones.",
    caracteristics: "El Cifrado de Canal asegura que las comunicaciones entre servidores, aplicaciones y usuarios estén protegidas mediante "+
    "cifrado. Esto impide que terceros puedan interceptar o manipular los datos durante la transmisión.",
    color: "#E300A4",

    icon: "🔐",
  },
  {
    id: "dc-app-servers",
    name: "Servidores de Aplicaciones",
    description: "App servers, middlewares y APIs internas.",
    caracteristics: "Los Servidores de Aplicaciones alojan y gestionan aplicaciones críticas para la organización. Están diseñados para "+
    "brindar disponibilidad, rendimiento y seguridad en el acceso a los sistemas corporativos.",
    color: "#E300A4",
    icon: "🧩",
  },
  {
    id: "dc-waf-databases",
    name: "WAF Base de Datos",
    description: "Protección y auditoría para bases de datos.",
    caracteristics: "El WAF para Bases de Datos protege específicamente las bases de datos contra ataques dirigidos, como inyecciones SQL "+
    "o accesos no autorizados. Este control garantiza la integridad y confidencialidad de la información almacenada.", 
    color: "#E300A4",
    icon: "🗄️",
  },

  {
    id: "dc-databases",
    name: "Base de Datos",
    description: "Motores relacionales y NoSQL con HA/replicación.",
    caracteristics: "Las Bases de Datos concentran la información esencial del negocio, desde registros de clientes hasta transacciones "+
    "financieras. Su gestión dentro del data center asegura un almacenamiento confiable, con medidas de redundancia, respaldo y control de accesos.",
    color: "#E300A4",

    icon: "🗃️",
  },
];
