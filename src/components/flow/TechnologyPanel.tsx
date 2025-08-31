// src/components/TechnologyPanel.tsx
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
  GripVertical,
  Plus,
  HelpCircle,
} from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
import { zoneTemplates } from "../data/zones";
import { cloudZones } from "../data/CloudZones";
import { dmzZones } from "../data/DmzZones";
import { lanZones } from "../data/LanZones";
import { datacenterZones } from "../data/DatacenterZones";
import { otZones } from "../data/OtZones";

interface SidebarProps {
  onNodeSelect?: (nodeType: string) => void;
  onCreateZone?: (templateId: string) => void;
  className?: string;
}

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

const SUBZONES_BY_ZONE: Record<
  string,
  Array<{
    id: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
  }>
> = {
  cloud: cloudZones,
  dmz: dmzZones,
  lan: lanZones,
  datacenter: datacenterZones,
  ot: otZones,
};

export const TechnologyPanel: React.FC<SidebarProps> = ({
  className = "",
  onCreateZone,
}) => {
  // Set con zonas principales abiertas
  const [openZones, setOpenZones] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const toggleZone = (id: string) => {
    setOpenZones((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Arrastrar zona principal
  const onZoneDragStart = (event: React.DragEvent, templateId: string) => {
    event.stopPropagation();
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ kind: "zone", templateId })
    );
    event.dataTransfer.setData("text/plain", `zone:${templateId}`);
    event.dataTransfer.effectAllowed = "move";
  };

  // Arrastrar subzona (Cloud)
  const onSubZoneDragStart = (event: React.DragEvent, subId: string) => {
    event.stopPropagation();
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ kind: "zone", templateId: subId })
    );
    event.dataTransfer.setData("text/plain", `zone:${subId}`);
    event.dataTransfer.effectAllowed = "move";
  };

  // Búsqueda: filtra zonas principales y también subzonas
  const filteredZones = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return zoneTemplates;

    return zoneTemplates.filter((z) => {
      const inTitle =
        z.name.toLowerCase().includes(q) ||
        (z.description ?? "").toLowerCase().includes(q);

      const subzones = SUBZONES_BY_ZONE[z.id] ?? [];
      const inSub = subzones.some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description ?? "").toLowerCase().includes(q)
      );

      // Si coincide alguna subzona, aseguro que el acordeón aparezca abierto
      if (inSub) {
        // open by default when filtering (no side effects during render)
        setTimeout(() => {
          setOpenZones((prev) => {
            const next = new Set(prev);
            next.add(z.id);
            return next;
          });
        }, 0);
      }

      return inTitle || inSub;
    });
  }, [searchTerm]);

  // Filtro de subzonas por texto (solo para pintar dentro)
  const filterSubzones = (zoneId: string) => {
    const q = searchTerm.trim().toLowerCase();
    const all = SUBZONES_BY_ZONE[zoneId] ?? [];
    if (!q) return all;
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
    );
  };

  // Funcionalidad de arrastre para el panel
  const handleMouseDown = (e: React.MouseEvent) => {
    if (panelRef.current) {
      setIsDragging(true);
      const rect = panelRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <aside
      ref={panelRef}
      className={[
        "fixed z-40 w-80 h-[calc(100vh-100px)]",
        "bg-[#0f1115] text-white/90",
        "border border-white/10 rounded-lg",
        "flex flex-col shadow-xl",
        "select-none",
        isDragging ? "cursor-grabbing" : "cursor-default",
        className,
      ].join(" ")}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Header con capacidad de arrastre */}
      <div
        className="sticky top-0 z-10 border-b border-white/10 bg-[#0f1115]/95 backdrop-blur rounded-t-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="px-3 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide">
              Zonas de Red
            </h2>
            <button
              className="text-white/40 transition-colors hover:text-white/70"
              onMouseEnter={() => setActiveTooltip("help")}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() =>
                setActiveTooltip(activeTooltip === "help" ? null : "help")
              }
              aria-label="Ayuda"
            >
              <HelpCircle size={16} />
            </button>
          </div>
          <span className="text-[11px] text-white/50">
            {filteredZones.length}/{zoneTemplates.length}
          </span>
        </div>

        {/* Tooltip de ayuda */}
        {activeTooltip === "help" && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 mx-3 p-3 rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
            <div className="mb-2 text-sm font-medium text-white">
              ¿Cómo usar el panel de zonas?
            </div>
            <div className="space-y-1 text-xs text-gray-300">
              <p>• Arrastra zonas al lienzo para crearlas</p>
              <p>• Haz clic en zonas para ver sus detalles</p>
              <p>
                • Las zonas con subzonas (nube) contienen opciones específicas
              </p>
              <p>• Usa la búsqueda para filtrar zonas y subzonas</p>
              <p>• Arrastra el panel por el título para moverlo</p>
            </div>
          </div>
        )}

        <div className="relative px-3 pb-3 pt-2">
          <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar zonas o subzonas…"
            className="w-full rounded-md border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {filteredZones.map((z) => {
          const Icon = zoneIcon(z.id);
          const isOpen = openZones.has(z.id);
          const subzones = SUBZONES_BY_ZONE[z.id]; // undefined si no tiene

          return (
            <div
              key={z.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
            >
              {/* Cabecera */}
              <button
                onClick={() => toggleZone(z.id)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.06] transition"
                aria-expanded={isOpen}
                aria-controls={`zone-panel-${z.id}`}
              >
                <div
                  className="p-2 rounded-md"
                  style={{ backgroundColor: `${z.color}22`, color: z.color }}
                >
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium truncate">{z.name}</div>
                  <div className="text-xs text-white/60 truncate">
                    {z.description}
                  </div>
                </div>

                {/* Drag de la zona principal (opcional) */}
                {!subzones && (
                  <div
                    title="Arrastrar zona"
                    className="mr-2 rounded border border-white/10 px-2 py-1 text-xs text-white/70 bg-white/[0.02] cursor-grab active:cursor-grabbing hover:bg-white/[0.05] transition-colors"
                    draggable
                    onDragStart={(e) => onZoneDragStart(e, z.id)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="inline-flex items-center gap-1">
                      <GripVertical className="h-3 w-3" />
                      Drag
                    </span>
                  </div>
                )}

                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-white/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/60" />
                )}
              </button>

              {/* Panel */}
              {isOpen && (
                <div
                  id={`zone-panel-${z.id}`}
                  className="px-3 pb-3 pt-2 space-y-2 border-t border-white/10"
                >
                  {/* Si NO tiene subzonas → botones estándar */}
                  {!subzones && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-white/60">
                          Nivel:{" "}
                          <span
                            className="uppercase font-medium"
                            style={{ color: z.color }}
                          ></span>
                        </div>
                        <button
                          onClick={() => onCreateZone?.(z.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs hover:bg-white/[0.08] transition-all hover:scale-105"
                          title="Crear zona en el lienzo"
                        >
                          <Plus className="h-3 w-3" />
                          Crear zona
                        </button>
                      </div>
                      <div className="text-xs text-white/70">
                        {z.description}
                      </div>
                    </>
                  )}

                  {/* Si TIENE subzonas (Cloud) → lista de ítems arrastrables */}
                  {subzones && (
                    <div className="space-y-2">
                      <div className="text-xs text-white/60 px-1">
                        Subzonas disponibles:
                      </div>
                      {filterSubzones(z.id).map((s) => (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={(e) => onSubZoneDragStart(e, s.id)}
                          onClick={() => onCreateZone?.(s.id)}
                          className="group cursor-grab active:cursor-grabbing p-3 rounded-lg border border-white/10 hover:bg-white/[0.06] transition-all hover:scale-[1.02] flex items-center gap-3"
                          style={{ borderLeft: `3px solid ${s.color}` }}
                        >
                          <div
                            className="px-2 py-1 rounded-md"
                            style={{ color: s.color }}
                          >
                            {s.icon ?? "•"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {s.name}
                            </div>
                            {s.description && (
                              <div className="text-xs text-white/60 truncate">
                                {s.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {filterSubzones(z.id).length === 0 && (
                        <div className="text-xs text-white/60 px-1 py-2 text-center">
                          No hay subzonas que coincidan con "{searchTerm}".
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredZones.length === 0 && (
          <div className="text-xs text-white/60 px-1 py-4 text-center">
            No se encontraron zonas.
            {searchTerm && (
              <div className="mt-1">
                Intenta con otros términos de búsqueda.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
