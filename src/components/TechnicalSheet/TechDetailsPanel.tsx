"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Info,
  Shield,
  Zap,
  Globe,
  Server,
  Monitor,
  X,
  BookOpen,
  ExternalLink,
} from "lucide-react";

export type TechLike = {
  id?: string;
  name?: string;
  imageUrl?: string;
  provider?: string; // Keep legacy field for compatibility
  providers?: string[]; // Add new providers array field
  description?: string;
  tags?: string[];
  ZoneKind?: string;
};

type Props = {
  tech: TechLike | null;
  onClose: () => void;
};

/** ------------------ MOCK DATA ------------------ */
type MockDetails = {
  longDescription: string;
  features: string[];
  bestFor: string[];
  docsUrl?: string;
};

const MOCK_DETAILS: Record<string, MockDetails> = {
  antispam: {
    longDescription:
      "Pasarela de correo que protege contra spam, phishing, malware y URLs maliciosas. Incluye reputación, sandbox y DLP opcional.",
    features: [
      "Antispam/antiphishing con reputación",
      "Reescritura/validación de URLs",
      "Análisis de adjuntos (sandbox)",
      "Políticas por dominio/grupo",
    ],
    bestFor: ["DMZ (Email Gateway)", "Cloud (SEG SaaS)"],
    docsUrl: "#",
  },
  balanceadorcarga: {
    longDescription:
      "Balanceo L4/L7 con terminación TLS, health-checks, persistencia y reescritura de cabeceras/URLs.",
    features: [
      "Round-robin / least-connections",
      "Terminación TLS y SNI",
      "Health-checks activos y pasivos",
      "Reglas L7 y WAF opcional",
    ],
    bestFor: ["DMZ (Load Balancer)", "Data Center (App Servers)"],
    docsUrl: "#",
  },
  edr: {
    longDescription:
      "Protección de endpoints con detección y respuesta, telemetría y contención remota.",
    features: [
      "Prevención (NGAV) y EDR",
      "Aislamiento de host",
      "Búsqueda de amenazas (Threat Hunting)",
      "Integración con SIEM/SOAR",
    ],
    bestFor: ["LAN (Endpoint Client)"],
    docsUrl: "#",
  },
  monitoreoint: {
    longDescription:
      "Supervisión de infraestructura y aplicaciones: métricas, logs y alertas con tableros.",
    features: [
      "Colección de métricas y logs",
      "Alertas y dashboards",
      "Descubrimiento y health-checks",
      "Integración con herramientas APM",
    ],
    bestFor: ["Data Center", "LAN"],
    docsUrl: "#",
  },
  switch: {
    longDescription:
      "Conmutador L2/L3 con VLANs, PoE y routing básico. Soporta 802.1Q y QoS.",
    features: ["VLANs y trunking", "PoE/PoE+", "STP/RSTP/MSTP", "ACLs y QoS"],
    bestFor: ["LAN", "Data Center (Access/ToR)"],
    docsUrl: "#",
  },
  waf: {
    longDescription:
      "Firewall de aplicaciones web con firmas y aprendizaje para mitigar OWASP Top 10.",
    features: [
      "Protección OWASP Top 10",
      "Virtual patching",
      "Modo detección/bloqueo",
      "Integración con CDN/Proxy",
    ],
    bestFor: ["DMZ (WAF)", "Data Center (frente a apps)"],
    docsUrl: "#",
  },
};

function toKey(t: TechLike | null): string | null {
  if (!t) return null;
  const base = (t.id || t.name || "").toString();
  if (!base) return null;
  return base
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getTechIcon(name: string) {
  const iconMap: Record<string, any> = {
    antispam: Shield,
    balanceadorcarga: Globe,
    edr: Shield,
    monitoreoint: Monitor,
    switch: Server,
    waf: Shield,
  };

  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const IconComponent = iconMap[key] || Zap;
  return <IconComponent className="h-6 w-6" />;
}

function ZoneBadge({ zone }: { zone?: string }) {
  if (!zone) return null;

  const COLORS: Record<string, string> = {
    dmz: "bg-amber-100 text-amber-800 border-amber-300",
    lan: "bg-emerald-100 text-emerald-800 border-emerald-300",
    datacenter: "bg-blue-100 text-blue-800 border-blue-300",
    cloud: "bg-purple-100 text-purple-800 border-purple-300",
    ot: "bg-teal-100 text-teal-800 border-teal-300",
  };

  const cls = COLORS[zone] || "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {zone.toUpperCase()}
    </span>
  );
}

function ExplainerTooltip({
  term,
  explanation,
}: {
  term: string;
  explanation: string;
}) {
  const [activeTooltip, setActiveTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
        onMouseEnter={() => setActiveTooltip(true)}
        onMouseLeave={() => setActiveTooltip(false)}
        onClick={() => setActiveTooltip(!activeTooltip)}
      >
        <span className="underline decoration-dotted">{term}</span>
        <Info className="h-4 w-4" />
      </button>

      {activeTooltip && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <p className="text-sm text-gray-700">{explanation}</p>
          <div className="absolute -top-1 left-4 h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
        </div>
      )}
    </div>
  );
}

/** ------------------ Componente principal ------------------ */
export default function TechDetailsPanel({ tech, onClose }: Props) {
  const key = toKey(tech);
  const data = useMemo(() => (key ? MOCK_DETAILS[key] : undefined), [key]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (tech) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [tech]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!tech) return null;

  const getAllProviders = () => {
    const providers = tech.providers || [];
    if (tech.provider && !providers.includes(tech.provider)) {
      providers.push(tech.provider);
    }
    return providers;
  };

  const allProviders = getAllProviders();

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop con overlay suave */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Panel lateral con animación de entrada */}
      <aside
        className={`absolute right-0 top-0 h-full w-[440px] max-w-[90vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
            {tech.imageUrl ? (
              <img
                src={tech.imageUrl || "/placeholder.svg"}
                alt={tech.name || "tech"}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <div className="text-blue-600">
                {getTechIcon(tech.name || "")}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 text-xl font-bold truncate">
              {tech.name || "Tecnología"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <ZoneBadge zone={tech.ZoneKind} />
              {allProviders.length > 0 && (
                <span className="text-sm text-gray-600 truncate">
                  {allProviders.length === 1
                    ? `por ${allProviders[0]}`
                    : `${allProviders.length} proveedores`}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar panel"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Contenido */}
        <div className="px-6 py-6 space-y-6 overflow-y-auto h-[calc(100%-88px)]">
          {/* Descripción principal */}
          {(tech.description || data?.longDescription) && (
            <section className="space-y-3">
              <h4 className="text-gray-900 font-semibold text-lg flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                ¿Qué hace esta tecnología?
              </h4>
              <div className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-100">
                {tech.description && (
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {tech.description}
                  </p>
                )}
                {data?.longDescription && (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {data.longDescription}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Características principales */}
          {data?.features?.length ? (
            <section className="space-y-3">
              <h4 className="text-gray-900 font-semibold text-lg flex items-center gap-3">
                <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                Características principales
              </h4>
              <div className="grid gap-3">
                {data.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-800 leading-relaxed">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Casos de uso */}
          {data?.bestFor?.length ? (
            <section className="space-y-3">
              <h4 className="text-gray-900 font-semibold text-lg flex items-center gap-3">
                <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                <ExplainerTooltip
                  term="¿Dónde se usa?"
                  explanation="Estas son las ubicaciones más comunes donde esta tecnología es más efectiva en una red empresarial."
                />
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.bestFor.map((use, i) => (
                  <span
                    key={i}
                    className="px-3 py-2 rounded-xl bg-purple-50 text-purple-800 text-sm font-medium border border-purple-200"
                  >
                    {use}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {allProviders.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-gray-900 font-semibold text-lg flex items-center gap-3">
                <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                {allProviders.length === 1 ? "Proveedor" : "Proveedores"}
              </h4>
              <div className="grid gap-2">
                {allProviders.map((provider, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 hover:shadow-sm transition-shadow"
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm font-medium text-gray-800">
                      {provider}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {tech.tags?.length ? (
            <section className="space-y-3">
              <h4 className="text-gray-900 font-semibold text-lg flex items-center gap-3">
                <div className="w-2 h-6 bg-gray-500 rounded-full"></div>
                Categorías
              </h4>
              <div className="flex flex-wrap gap-2">
                {tech.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* Botón de documentación */}
          <div className="pt-4 border-t border-gray-200">
            <a
              href={data?.docsUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              <BookOpen className="text-white h-5 w-5" />
              <span className="text-white">Documentación técnica</span>
              <ExternalLink className="text-white h-4 w-4" />
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
