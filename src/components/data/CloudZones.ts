export type CloudZoneId =
  | "cloud-platform-security"
  | "digital-certificates-aas"
  | "proxy-aas"
  | "ddos-protection"
  | "email-gateway-aas";

export interface CloudZone {
  id: CloudZoneId;
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

export const cloudZones: CloudZone[] = [
  {
    id: "cloud-platform-security",
    name: "Seguridad en Plataformas como Servicio",
    description: "AWS · Azure · Otros proveedores",
    caracteristics: "Seguridad en Plataformas como Servicio incluye proveedores como AWS, Azure u otros, que ofrecen entornos seguros para "+
    "aplicaciones y datos. Estos servicios proporcionan herramientas de protección integradas, como gestión de identidades, monitoreo de amenazas y cifrado, garantizando que los recursos en la nube estén defendidos contra ataques externos y vulnerabilidades.",
    color: "#707070",
    icon: "☁️",
  },
  {
    id: "digital-certificates-aas",
    name: "Certificados Digitales como Servicio",
    description: "Gestión y emisión de certificados",
    caracteristics: "Los Certificados Digitales como Servicio permiten autenticar identidades y asegurar las comunicaciones en línea mediante "+
    "cifrado. Al ofrecerlos desde la nube, se facilita la emisión, gestión y renovación de certificados, asegurando que las conexiones sean confiables y que la información transmitida no pueda ser interceptada ni manipulada.",
    color: "#707070",
    icon: "✅",
  },
  {
    id: "proxy-aas",
    name: "Proxy como Servicio",
    description: "Secure Web Gateway / filtrado URL",
    caracteristics: "El Proxy como Servicio funciona como un intermediario seguro entre los usuarios y los recursos externos a los que "+
    "intentan acceder. Al estar en la nube, este servicio filtra y analiza el tráfico, bloquea accesos no autorizados, protege contra malware y controla la navegación de los usuarios desde cualquier ubicación, sin depender de la infraestructura física local.",
    color: "#707070",
    icon: "🌐",
  },
  {
    id: "email-gateway-aas",
    name: "Gateway de Correo como Servicio",
    description: "Antispam · anti-malware · DLP",
    caracteristics: "El Gateway de Correo como Servicio protege los sistemas de mensajería electrónica alojados en la nube. Este servicio "+
    "filtra correos entrantes y salientes para detectar spam, intentos de phishing y amenazas avanzadas, evitando que correos maliciosos alcancen a los usuarios y protegiendo así la integridad de la comunicación empresarial.",
    color: "#707070",
    icon: "📧",
  },
];
