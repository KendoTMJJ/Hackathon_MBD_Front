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
  /** Características de la subzona */
  caracteristics: string;
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
    caracteristics: "Gateway de Correo se encarga de proteger las comunicaciones de correo electrónico." +
    "Este sistema filtra los mensajes antes de que lleguen a los servidores internos, bloqueando spam, " +
    "intentos de phishing y malware oculto en adjuntos o enlaces. Así garantiza que solo correos legítimos puedan entrar a la red de la empresa.",
    color: "#F59E0B",
    level: "high",
    icon: "📧",
  },
  {
    id: "dmz-load-balancer",
    name: "Balanceador de Carga",
    description: "L4/L7, health checks, SSL offload, persistence",
    caracteristics: "El Balanceador de Carga distribuye el tráfico entre varios servidores para evitar que uno solo se sobrecargue. " +
    "Gracias a esto, las aplicaciones y servicios web funcionan de forma más estable, con mejor rendimiento y disponibilidad, incluso si uno de los servidores llegara a fallar.",
    color: "#F59E0B",
    level: "medium",
    icon: "⚖️",
  },
  {
    id: "dmz-web-gateway",
    name: "Gateway de Navegación",
    description: "SWG/URL filtering, sandboxing, malware protection",
    caracteristics: "El Gateway de Navegación controla todo lo que los usuarios acceden en Internet. Este sistema filtra páginas maliciosas, "+
    "bloquea contenido no autorizado y revisa aplicaciones web, impidiendo descargas o accesos que puedan poner en riesgo la seguridad de la red interna.",
    color: "#F59E0B",
    level: "high",
    icon: "🌐",
  },
  {
    id: "dmz-web-publishing",
    name: "Publicación Web",
    description: "Reverse proxy / publicación de aplicaciones",
    caracteristics: "La subzona de Publicación Web permite que servicios y aplicaciones internos se expongan de manera segura hacia Internet. "+
    "Actúa como un intermediario que protege la infraestructura real, permitiendo a usuarios externos conectarse a portales, APIs o aplicaciones sin comprometer los servidores internos.",
    color: "#F59E0B",
    level: "medium",
    icon: "🗂️",
  },
  {
    id: "dmz-waf",
    name: "WAF",
    description: "Protección OWASP Top 10, API security, bot mitigation",
    caracteristics: "El WAF (Web Application Firewall) es un cortafuegos especializado en aplicaciones web. Se encarga de detectar y bloquear"+
    " ataques comunes como inyecciones SQL, cross-site scripting (XSS) o intentos de robo de datos en peticiones HTTP y HTTPS, asegurando así la integridad de los sitios web y APIs expuestos.",
    color: "#F59E0B",
    level: "high",
    icon: "🛡️",
  },
  {
    id: "dmz-proxy",
    name: "Proxy",
    description: "Proxy directo o transparente para tráfico saliente",
    caracteristics: "El Proxy actúa como intermediario entre los usuarios y los servicios externos a los que quieren acceder. Además de "+
    "ocultar las direcciones IP internas para proteger la identidad de la red, permite aplicar políticas de navegación, mejorar la privacidad, filtrar accesos y hasta almacenar contenido en caché para optimizar el rendimiento de las conexiones.",
    color: "#F59E0B",
    level: "medium",
    icon: "🧭",
  },
];
