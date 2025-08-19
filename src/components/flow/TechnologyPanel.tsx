import {
  ChevronDown,
  ChevronRight,
  Search,
  Globe,
  Shield,
  Database,
  Cloud as CloudIcon,
  Cpu,
  Network,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  SecurityCategory,
  SecurityTechnology,
} from "../types/securityTypes";
import { securityTechnologies } from "../data/SecurityTechnologies";
import { zoneTemplates } from "../data/zones"; // <-- ajusta si tu ruta es distinta

interface SidebarProps {
  onNodeSelect?: (nodeType: string) => void; // opcional
  onCreateZone?: (templateId: string) => void; // crear zona por click
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

const zoneIcon = (id: string) => {
  switch (id) {
    case "internet":
      return Globe;
    case "dmz":
      return Shield;
    case "datacenter":
      return Database;
    case "cloud":
      return CloudIcon;
    case "ot":
      return Cpu;
    case "lan":
    default:
      return Network;
  }
};

export const TechnologyPanel: React.FC<SidebarProps> = ({
  className = "",
  onNodeSelect,
  onCreateZone,
}) => {
  const [expanded, setExpanded] = useState<Set<SecurityCategory>>(
    () => new Set<SecurityCategory>(["firewall", "waf", "ips"])
  );
  const [zonesOpen, setZonesOpen] = useState(false); // 👈 desplegable de zonas
  const [searchTerm, setSearchTerm] = useState("");

  // DRAG de tecnologías (igual que antes)
  const onTechDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("text/plain", nodeType);
    event.dataTransfer.effectAllowed = "move";
    onNodeSelect?.(nodeType);
  };

  // DRAG de zonas (payload JSON + fallback)
  const onZoneDragStart = (event: React.DragEvent, templateId: string) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ kind: "zone", templateId })
    );

    event.dataTransfer.setData("text/plain", `zone:${templateId}`);
    event.dataTransfer.effectAllowed = "move";
  };

  // Filtro (solo tecnologías; si quieres que afecte a zonas avísame y lo integro)
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

      {/* Zonas (desplegable compacto) */}
      <div className="px-3 pt-3">
        <button
          onClick={() => setZonesOpen((o) => !o)}
          className="w-full flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.06] transition"
          aria-expanded={zonesOpen}
        >
          <span className="text-sm font-medium">
            Zonas de Seguridad{" "}
            <span className="opacity-60">({zoneTemplates.length})</span>
          </span>
          {zonesOpen ? (
            <ChevronDown className="h-4 w-4 text-white/60" />
          ) : (
            <ChevronRight className="h-4 w-4 text-white/60" />
          )}
        </button>

        {zonesOpen && (
          <div className="mt-2 space-y-2">
            {zoneTemplates.map((z) => {
              const Icon = zoneIcon(z.id);
              return (
                <div
                  key={z.id}
                  draggable
                  onDragStart={(e) => onZoneDragStart(e, z.id)}
                  onClick={() => onCreateZone?.(z.id)}
                  className="cursor-grab active:cursor-grabbing p-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition flex items-center gap-3"
                >
                  <div
                    className="p-2 rounded-md"
                    style={{ backgroundColor: `${z.color}22`, color: z.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{z.name}</div>
                    <div className="text-xs text-white/60 truncate">
                      {z.description}
                    </div>
                  </div>
                  <div className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/60">
                    {z.level.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista scrollable de tecnologías */}
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
                      draggable
                      onDragStart={(event) => onTechDragStart(event, t.id)}
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
