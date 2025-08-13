import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  SecurityCategory,
  SecurityTechnology,
} from "../types/securityTypes";
import { securityTechnologies } from "../data/SecurityTechnologies";

interface TechnologyPanelProps {
  /** Handler opcional para iniciar drag hacia React Flow */
  onDragStart?: (
    event: React.DragEvent,
    technology: SecurityTechnology
  ) => void;
  /** Permite sobreescribir clases externas (ancho, bordes, etc.) */
  className?: string;
}

const categoryNames: Record<SecurityCategory, string> = {
  firewall: "Firewalls",
  waf: "Web App Firewalls",
  proxy: "Proxy/Gateway",
  nac: "Network Access",
  ips: "Intrusion Prevention",
  ids: "Intrusion Detection",
  siem: "SIEM/Analytics",
  endpoint: "Endpoint Security",
  encryption: "Encryption",
  authentication: "Identity/Auth",
  monitoring: "Monitoring",
  backup: "Backup/Recovery",
  server: "Servers",
  network: "Network",
};

export const TechnologyPanel: React.FC<TechnologyPanelProps> = ({
  onDragStart,
  className = "",
}) => {
  const [expanded, setExpanded] = useState<Set<SecurityCategory>>(
    // categorías abiertas por defecto en la demo
    () => new Set<SecurityCategory>(["firewall", "waf", "ips"])
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return securityTechnologies;
    return securityTechnologies.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.manufacturer ?? "").toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const grouped = useMemo(() => {
    const acc: Record<SecurityCategory, SecurityTechnology[]> = {} as any;
    for (const t of filtered) {
      (acc[t.category] ??= []).push(t);
    }
    return acc;
  }, [filtered]);

  const toggle = (cat: SecurityCategory) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  return (
    <aside
      className={[
        "h-full w-full",
        "bg-[#0f1115] text-white/90",
        "border-r border-white/10",
        "flex flex-col",
        className,
      ].join(" ")}
    >
      {/* Header sticky: título + búsqueda */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0f1115]/95 backdrop-blur">
        <div className="px-3 pt-3">
          <h2 className="text-sm font-semibold tracking-wide">Tecnologías</h2>
        </div>
        <div className="relative px-3 pb-3 pt-2">
          <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar tecnologías…"
            className="w-full rounded-md border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
          />
        </div>
      </div>

      {/* Lista scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2">
        {Object.entries(grouped).length === 0 && (
          <div className="text-xs text-white/60 px-2">
            No se encontraron resultados.
          </div>
        )}

        {Object.entries(grouped).map(([catKey, techs]) => {
          const cat = catKey as SecurityCategory;
          const open = expanded.has(cat);
          return (
            <div key={cat} className="rounded-lg border border-white/10">
              <button
                onClick={() => toggle(cat)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5"
                aria-expanded={open}
              >
                <span className="text-sm font-medium">
                  {categoryNames[cat]}{" "}
                  <span className="opacity-60">({techs.length})</span>
                </span>
                {open ? (
                  <ChevronDown className="h-4 w-4 text-white/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/60" />
                )}
              </button>

              {open && (
                <div className="pb-2">
                  {techs.map((t) => (
                    <div
                      key={t.id}
                      draggable={!!onDragStart}
                      onDragStart={
                        onDragStart ? (e) => onDragStart(e, t) : undefined
                      }
                      className={[
                        "mx-3 mb-2 rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                        "cursor-grab active:cursor-grabbing",
                        "transition-shadow hover:shadow",
                        "p-3",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl leading-none">{t.icon}</div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {t.name}
                          </div>
                          {t.manufacturer && (
                            <div className="truncate text-xs text-white/70">
                              {t.manufacturer}
                            </div>
                          )}
                          <div className="mt-1 line-clamp-2 text-xs text-white/60">
                            {t.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
