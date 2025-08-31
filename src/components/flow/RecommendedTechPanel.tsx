import { useEffect, useMemo, useState } from "react";
import {
  Server,
  HelpCircle,
  Zap,
  PlusCircle,
  ExternalLink,
  Shield,
  Cpu,
  Database,
  Cloud,
  X,
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
  switch (zoneKind) {
    case "cloud":
      return <Cloud className="h-4 w-4 text-blue-400" />;
    case "dmz":
      return <Shield className="h-4 w-4 text-purple-400" />;
    case "datacenter":
      return <Database className="h-4 w-4 text-green-400" />;
    case "ot":
      return <Cpu className="h-4 w-4 text-amber-400" />;
    case "lan":
      return <Server className="h-4 w-4 text-cyan-400" />;
    default:
      return <Server className="h-4 w-4 text-gray-400" />;
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
  const [open, setOpen] = useState(true); // cierre local si no se pasa onClose

  // 👉 Si el usuario selecciona otra zona (o vuelve a seleccionar una),
  // re-abrimos el panel automáticamente.
  useEffect(() => {
    if (selected) {
      setOpen(true);
      setExpanded(true);
      setActiveTooltip(null);
    }
  }, [selected?.zoneKind, selected?.subzoneId]); // cambios relevantes

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
    <div className={`fixed bottom-4 right-4 z-50 w-80 ${className}`}>
      <div className="overflow-hidden rounded-xl border border-white/15 bg-[#0f1116]/95 backdrop-blur-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#0f1116] to-[#1a1d28] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-white/90">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold">
                Tecnologías Recomendadas
              </span>
            </div>
            {/* ícono de ayuda - tip igual a EdgeStyleBar */}
            <div className="relative">
              <button
                className="text-white/40 transition-colors hover:text-white/70"
                onMouseEnter={() => setActiveTooltip("help")}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() =>
                  setActiveTooltip((v) => (v === "help" ? null : "help"))
                }
                aria-label="Ayuda"
                title="¿Cómo usar?"
              >
                <HelpCircle className="h-4 w-4" />
              </button>

              {activeTooltip === "help" && (
                <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-xl">
                  <div className="mb-1 text-sm font-medium text-white">
                    ¿Cómo usar?
                  </div>
                  <div className="space-y-1 text-xs text-gray-300">
                    <p>• Selecciona una zona del diagrama.</p>
                    <p>• Revisa las sugerencias para esa zona.</p>
                    <p>• Usa “+” para añadir la tecnología seleccionada.</p>
                    <p>• Si tienes hojas, se agregará en la hoja activa.</p>
                  </div>
                  <div className="absolute -top-1 right-3 h-3 w-3 rotate-45 border-l border-t border-gray-700 bg-gray-900" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* expand/collapse */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={expanded ? "Contraer panel" : "Expandir panel"}
              title={expanded ? "Contraer" : "Expandir"}
            >
              {expanded ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              )}
            </button>

            {/* cerrar */}
            <button
              onClick={() => (onClose ? onClose() : setOpen(false))}
              className="rounded-md p-1 text-white/60 transition-colors hover:bg-red-500/20 hover:text-white"
              aria-label="Cerrar panel"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="p-4">
            {/* info zona */}
            <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2">
                <ZoneIcon zoneKind={selected.zoneKind} />
                <span className="capitalize text-sm font-medium text-white/90">
                  {selected.zoneKind}
                </span>
              </div>
              <div className="rounded bg-black/20 px-2 py-1 font-mono text-xs text-white/60">
                {selected.subzoneId}
              </div>
            </div>

            {loading && (
              <div className="py-6 text-center">
                <div className="inline-flex items-center gap-2 text-xs text-white/60">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white/60"></div>
                  Cargando tecnologías...
                </div>
              </div>
            )}

            {!loading && techs.length === 0 && (
              <div className="py-6 text-center">
                <Server className="mx-auto mb-2 h-8 w-8 text-white/30" />
                <div className="mb-1 text-xs text-white/60">
                  No hay recomendaciones
                </div>
                <div className="text-xs text-white/40">
                  Selecciona otra zona
                </div>
              </div>
            )}

            <div className="max-h-96 space-y-3 overflow-y-auto">
              {techs.map((t) => (
                <div
                  key={t.id}
                  className="group relative rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 rounded-md p-2">
                      <Server className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="truncate text-sm font-medium text-white/90">
                            {t.name}
                          </div>
                          {t.provider && (
                            <div className="mt-1 text-xs text-white/60">
                              {t.provider}
                            </div>
                          )}
                        </div>

                        {!!onAddTechnology && (
                          <button
                            onClick={() => onAddTechnology?.(t)}
                            className="ml-2 rounded-md bg-blue-600/20 p-1.5 text-blue-400 transition-colors hover:bg-blue-600/30 hover:text-blue-300"
                            title="Añadir tecnología"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {t.description && (
                        <div className="mt-2 line-clamp-2 text-xs text-white/50">
                          {t.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* indicador secundario */}
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <ExternalLink className="h-3 w-3" />
                      <span>Arrastrar</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">
                  {techs.length} tecnologías
                </span>
                <span className="text-blue-400/60">
                  Compatibles con {selected.zoneKind}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
