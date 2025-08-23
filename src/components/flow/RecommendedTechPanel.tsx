import { useMemo } from "react";
import { GripVertical, Plus, Server } from "lucide-react";
import type { Technology, ZoneKind } from "../../mocks/technologies.types";
import { useTechnologies } from "../../mocks/useTechnologies";

type Selected = { zoneKind: ZoneKind; subzoneId: string } | null;

export interface RecommendedTechPanelProps {
  /** zona/subzona actualmente seleccionada en el canvas */
  selected: Selected;
  /** callback opcional para insertar por click (sin drag & drop) */
  onAddTechnology?: (tech: Technology) => void;
  className?: string;
}

export default function RecommendedTechPanel({
  selected,
  onAddTechnology,
  className = "",
}: RecommendedTechPanelProps) {
  const params = useMemo(
    () =>
      selected
        ? { zoneKind: selected.zoneKind, subzoneId: selected.subzoneId }
        : {},
    [selected]
  );

  const { data: techs, loading } = useTechnologies(params as any);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    tech: Technology
  ) => {
    // Opción 1 (funciona sin tocar FlowCanvas):
    // manda un nodeType conocido por tu front (si lo tienes en tus nodeTypes)
    // y el canvas creará un nodo con ese type y label = type.
    // Si no tienes un type por tecnología, puedes elegir 'default'.
    const nodeType = (tech as any).nodeType ?? "default";
    e.dataTransfer.setData("text/plain", nodeType);

    // Opción 2 (recomendada, requiere un bloque pequeño en onDrop):
    // e.dataTransfer.setData(
    //   "application/reactflow",
    //   JSON.stringify({ kind: "tech", tech })
    // );

    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      className={[
        "border-t border-white/10 bg-[#0f1115]/90 backdrop-blur p-3",
        className,
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white/80 tracking-wide">
          Recomendadas {selected ? "para la zona" : ""}
        </h3>
        {selected ? (
          <span className="text-[11px] text-white/50">
            {selected.zoneKind} · {selected.subzoneId}
          </span>
        ) : (
          <span className="text-[11px] text-white/50">
            Sin zona seleccionada
          </span>
        )}
      </div>

      {loading && (
        <div className="text-xs text-white/60">Cargando tecnologías…</div>
      )}

      {!loading && techs.length === 0 && (
        <div className="text-xs text-white/60">
          No hay tecnologías recomendadas para esta zona.
        </div>
      )}

      <div className="space-y-2">
        {techs.map((t) => (
          <div
            key={t.id}
            draggable
            onDragStart={(e) => handleDragStart(e, t)}
            className="group cursor-grab active:cursor-grabbing rounded-md border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition p-2 flex items-center gap-3"
            title="Arrastra al lienzo"
          >
            <div className="shrink-0 rounded-md bg-white/[0.06] p-2">
              {/* usa tu imagen si la tienes */}
              <Server className="h-4 w-4 text-white/70" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{t.name}</div>
              {t.provider && (
                <div className="text-[11px] text-white/50 truncate">
                  {t.provider}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div
                className="rounded border border-white/10 px-2 py-1 text-[11px] text-white/70 bg-white/[0.02]"
                title="Drag"
              >
                <span className="inline-flex items-center gap-1">
                  <GripVertical className="h-3 w-3" />
                  Drag
                </span>
              </div>
              {!!onAddTechnology && (
                <button
                  onClick={() => onAddTechnology?.(t)}
                  className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] hover:bg-white/[0.1]"
                  title="Insertar por click"
                >
                  <span className="inline-flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add
                  </span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
