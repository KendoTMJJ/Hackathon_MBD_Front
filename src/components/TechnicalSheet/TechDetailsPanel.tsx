import { useEffect, useMemo } from "react";

export type TechLike = {
  id?: string;
  name?: string;
  imageUrl?: string;
  provider?: string;
  description?: string;
  tags?: string[];
  ZoneKind?: string; // opcional (cloud|dmz|...)
};

type Props = {
  tech: TechLike | null; // null = cerrado
  onClose: () => void;
};

/** ------------------ MOCK “base de datos” ------------------ */
/** Usa keys "slug" para que funcione con nombre o id */
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

/** Normaliza un id/nombre a slug para buscar en MOCK_DETAILS */
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

/** Badge simple por zona (opcional) */
function ZoneBadge({ zone }: { zone?: string }) {
  if (!zone) return null;
  const COLORS: Record<string, string> = {
    dmz: "bg-amber-500/20 text-amber-300",
    lan: "bg-teal-500/20 text-teal-300",
    datacenter: "bg-sky-500/20 text-sky-300",
    cloud: "bg-violet-500/20 text-violet-300",
    ot: "bg-emerald-500/20 text-emerald-300",
  };
  const cls = COLORS[zone] || "bg-white/10 text-white/70";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {zone.toUpperCase()}
    </span>
  );
}

/** ------------------ Componente principal ------------------ */
export default function TechDetailsPanel({ tech, onClose }: Props) {
  const key = toKey(tech);
  const data = useMemo(() => (key ? MOCK_DETAILS[key] : undefined), [key]);

  // Cerrar con ESC
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // No render si está cerrado
  if (!tech) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {/* backdrop */}
      <div
        className="pointer-events-auto absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* panel lateral */}
      <aside className="pointer-events-auto absolute right-0 top-0 h-full w-[380px] max-w-[90vw] bg-[#0f1115] border-l border-white/10 shadow-xl">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <img
            src={tech.imageUrl || "/images/placeholder.png"}
            alt={tech.name || "tech"}
            className="h-8 w-8 rounded object-contain bg-white/5"
          />
          <div className="min-w-0">
            <h3 className="text-white text-sm font-semibold truncate">
              {tech.name || "Tecnología"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <ZoneBadge zone={tech.ZoneKind} />
              {tech.provider && (
                <span className="text-xs text-white/60 truncate">
                  {tech.provider}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-md px-2 py-1 text-white/70 hover:text-white hover:bg-white/10"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="px-4 py-3 space-y-4 overflow-y-auto h-[calc(100%-48px)] scrollbar-hide">
          {/* Descripción corta (si viene en el nodo) */}
          {tech.description && (
            <p className="text-sm text-white/80">{tech.description}</p>
          )}

          {/* Descripción larga (mock) */}
          {data?.longDescription && (
            <p className="text-sm text-white/70">{data.longDescription}</p>
          )}

          {/* Features */}
          {data?.features?.length ? (
            <section>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">
                Características
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-white/80">
                {data.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Casos ideales */}
          {data?.bestFor?.length ? (
            <section>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">
                Ideal para
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.bestFor.map((b, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-white/5 text-xs text-white/70"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* Tags si vienen del nodo */}
          {tech.tags?.length ? (
            <section>
              <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {tech.tags.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-white/5 text-xs text-white/70"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* Acción/documentación (mock) */}
          <div className="pt-2">
            <a
              href={data?.docsUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/10"
            >
              Ver documentación
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
