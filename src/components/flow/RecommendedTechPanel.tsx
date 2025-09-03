"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Server,
  HelpCircle,
  Sparkles,
  Plus,
  Shield,
  Cpu,
  Database,
  Cloud,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import type { Technology, ZoneKind } from "../../mocks/technologies.types";
import { useTechnologies } from "../../mocks/useTechnologies";

type Selected = { zoneKind: ZoneKind; subzoneId: string } | null;

export interface RecommendedTechPanelProps {
  selected: Selected;
  onAddTechnology?: (tech: Technology) => void;
  onClose?: () => void;
  className?: string;
}

const ZoneIcon = ({ zoneKind }: { zoneKind: ZoneKind }) => {
  const iconProps = "h-4 w-4";

  switch (zoneKind) {
    case "cloud":
      return <Cloud className={`${iconProps} text-blue-500`} />;
    case "dmz":
      return <Shield className={`${iconProps} text-purple-500`} />;
    case "datacenter":
      return <Database className={`${iconProps} text-emerald-500`} />;
    case "ot":
      return <Cpu className={`${iconProps} text-amber-500`} />;
    case "lan":
      return <Server className={`${iconProps} text-cyan-500`} />;
    default:
      return <Server className={`${iconProps} text-muted-foreground`} />;
  }
};

export default function RecommendedTechPanel({
  selected,
  onAddTechnology,
  onClose,
  className = "",
}: RecommendedTechPanelProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (selected) {
      setOpen(true);
      setExpanded(true);
      setActiveTooltip(null);
    }
  }, [selected]); // Updated to use the entire selected object

  const params = useMemo(
    () =>
      selected
        ? { zoneKind: selected.zoneKind, subzoneId: selected.subzoneId }
        : {},
    [selected]
  );

  const { data: techs, loading } = useTechnologies(params as any);

  if (!selected || !open) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-96 ${className}`}>
      <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl shadow-black/30 transition-all duration-300 ease-out">
        <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Tecnologías Recomendadas
              </h3>
              <p className="text-xs text-gray-400">Para tu zona seleccionada</p>
            </div>

            <div className="relative">
              <button
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                onMouseEnter={() => setActiveTooltip("help")}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() =>
                  setActiveTooltip((v) => (v === "help" ? null : "help"))
                }
                aria-label="Ayuda"
              >
                <HelpCircle className="h-4 w-4" />
              </button>

              {activeTooltip === "help" && (
                <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-gray-600 bg-gray-800 p-4 shadow-2xl">
                  <div className="mb-2 text-sm font-medium text-white">
                    ¿Cómo usar este panel?
                  </div>
                  <div className="space-y-2 text-xs text-gray-300">
                    <p>• Selecciona una zona en el diagrama de red</p>
                    <p>• Revisa las tecnologías sugeridas para esa zona</p>
                    <p>• Haz clic en "+" para añadir la tecnología</p>
                    <p>• Las tecnologías se añadirán a la zona activa</p>
                  </div>
                  <div className="absolute -top-1 right-4 h-3 w-3 rotate-45 border-l border-t border-gray-600 bg-gray-800" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
              aria-label={expanded ? "Contraer panel" : "Expandir panel"}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => (onClose ? onClose() : setOpen(false))}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
              aria-label="Cerrar panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="p-5">
            <div className="mb-5 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-700">
                  <ZoneIcon zoneKind={selected.zoneKind} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white capitalize">
                    Zona {selected.zoneKind}
                  </div>
                  <div className="text-xs text-gray-400">
                    Configuración de seguridad
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-gray-700 px-3 py-2 font-mono text-xs text-gray-300 border border-gray-600">
                ID: {selected.subzoneId}
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-400"></div>
                  Cargando recomendaciones...
                </div>
              </div>
            )}

            {!loading && techs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-700">
                  <Zap className="h-6 w-6 text-gray-400" />
                </div>
                <div className="mb-1 text-sm font-medium text-white">
                  Sin recomendaciones
                </div>
                <div className="text-xs text-gray-400">
                  No hay tecnologías sugeridas para esta zona
                </div>
              </div>
            )}

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {techs.map((tech) => (
                <div
                  key={tech.id}
                  className="group relative cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-4 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 hover:bg-gray-750"
                  onClick={() => onAddTechnology?.(tech)}
                  title="Haz clic para añadir esta tecnología"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                      <Server className="h-5 w-5 text-blue-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-white">
                          {tech.name}
                        </h4>
                        {tech.provider && (
                          <p className="mt-1 text-xs text-gray-400">
                            por {tech.provider}
                          </p>
                        )}
                      </div>

                      {tech.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-300">
                          {tech.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <Plus className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
              ))}
            </div>

            {techs.length > 0 && (
              <div className="mt-5 flex items-center justify-between border-t border-gray-700 pt-4 text-xs">
                <span className="text-gray-400">
                  {techs.length}{" "}
                  {techs.length === 1 ? "tecnología" : "tecnologías"}
                </span>
                <div className="flex items-center gap-1 text-blue-400">
                  <Sparkles className="h-3 w-3" />
                  <span>Compatibles con {selected.zoneKind}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
