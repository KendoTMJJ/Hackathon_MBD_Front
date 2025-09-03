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
import { useMemo, useState } from "react";
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

  return (
    <aside
      className={[
        "h-full w-full",
        "bg-white text-gray-900",
        "border-r border-gray-200",
        "flex flex-col",
        className,
      ].join(" ")}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="px-4 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-gray-900">
              Zonas de Red
            </h2>
            <button
              className="text-gray-400 transition-colors hover:text-gray-600"
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
          <span className="text-[11px] text-gray-500">
            {filteredZones.length}/{zoneTemplates.length}
          </span>
        </div>

        {/* Tooltip de ayuda */}
        {activeTooltip === "help" && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 mx-3 p-3 rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="mb-2 text-sm font-medium text-gray-900">
              ¿Cómo usar el panel de zonas?
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• Arrastra zonas al lienzo para crearlas</p>
              <p>• Haz clic en zonas para ver sus detalles</p>
              <p>
                • Las zonas con subzonas (nube) contienen opciones específicas
              </p>
              <p>• Usa la búsqueda para filtrar zonas y subzonas</p>
            </div>
          </div>
        )}

        <div className="relative px-4 pb-4 pt-3">
          <Search className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar zonas o subzonas…"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filteredZones.map((z) => {
          const Icon = zoneIcon(z.id);
          const isOpen = openZones.has(z.id);
          const subzones = SUBZONES_BY_ZONE[z.id]; // undefined si no tiene

          return (
            <div
              key={z.id}
              className="rounded-xl border border-gray-200 hover:shadow-md transition-all"
            >
              {/* Cabecera */}
              <button
                onClick={() => toggleZone(z.id)}
                className="w-full flex items-cente gap-3 px-4 py-3 hover:bg-gray-50 transition bg-gradient-to-r bg-amber-950 to-blue-600"
                // para cambiar los colores arriba, toca con el bg-gradient-to-r porque como es
                // un button tiene estilos globales del css negros por defecto,
                // si le quieren cambiar el a todo el button es from-(color)-(escala) to-(color)-escala
                aria-expanded={isOpen}
                aria-controls={`zone-panel-${z.id}`}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${z.color}15`, color: z.color }}
                >
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-white truncate">
                    {z.name}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {z.description}
                  </div>
                </div>

                {/* Drag de la zona principal (opcional) */}
                {!subzones && (
                  <div
                    title="Arrastrar zona"
                    className="mr-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 bg-gray-50 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors"
                    draggable
                    onDragStart={(e) => onZoneDragStart(e, z.id)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="inline-flex items-center gap-1">
                      <GripVertical className="h-3 w-3" />
                      Arrastrar
                    </span>
                  </div>
                )}

                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>

              {/* Panel */}
              {isOpen && (
                <div
                  id={`zone-panel-${z.id}`}
                  className="px-4 pb-4 pt-3 space-y-3 border-t border-gray-200"
                >
                  {/* Si NO tiene subzonas → botones estándar */}
                  {!subzones && (
                    <>
                      <div className="flex items-center justify-betwee">
                        <div className="text-xs text-gray-600">
                          Nivel:{" "}
                          <span
                            className="uppercase font-medium"
                            style={{ color: z.color }}
                          ></span>
                        </div>
                        <button
                          onClick={() => onCreateZone?.(z.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-all hover:scale-105 shadow-sm"
                          title="Crear zona en el lienzo"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Crear zona
                        </button>
                      </div>
                      <div className="text-xs text-gray-600">
                        {z.description}
                      </div>
                    </>
                  )}

                  {/* Si TIENE subzonas (Cloud) → lista de ítems arrastrables */}
                  {subzones && (
                    <div className="space-y-3">
                      <div className="text-xs text-gray-600 px-1">
                        Subzonas disponibles:
                      </div>
                      {filterSubzones(z.id).map((s) => (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={(e) => onSubZoneDragStart(e, s.id)}
                          onClick={() => onCreateZone?.(s.id)}
                          className="group cursor-grab active:cursor-grabbing p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all hover:scale-[1.02] flex items-center gap-3 shadow-sm"
                          style={{ borderLeft: `3px solid ${s.color}` }}
                        >
                          <div
                            className="px-2 py-1 rounded-md"
                            style={{ color: s.color }}
                          >
                            {s.icon ?? "•"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {s.name}
                            </div>
                            {s.description && (
                              <div className="text-xs text-gray-600 truncate">
                                {s.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {filterSubzones(z.id).length === 0 && (
                        <div className="text-xs text-gray-500 px-1 py-2 text-center">
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
          <div className="text-xs text-gray-500 px-1 py-4 text-center">
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
