import { useState } from "react";
import { X, Zap, HelpCircle, Activity, Slash } from "lucide-react";
import {
  EDGE_COLORS,
  type ColoredEdgeData,
  type EdgeColor,
} from "./ColoredEdge";

/** Preset que guardaremos en data del edge nuevo */
export type EdgePreset = Required<
  Pick<ColoredEdgeData, "animated" | "dashed" | "thickness">
> & { color: EdgeColor };

type PopoverProps = {
  open: boolean;
  value: EdgePreset;
  onChange: (v: EdgePreset) => void;
  onClose: () => void;
  onAddSwitch?: () => void;
};

type StyleBarProps = {
  value: EdgePreset;
  onChange: (v: EdgePreset) => void;
  className?: string;
};

/** Barra de estilo de conexiones interna */
function EdgeStyleBar({ value, onChange, className = "" }: StyleBarProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const options = Object.keys(EDGE_COLORS) as EdgeColor[];
  const safeColor: EdgeColor = options.includes(value.color)
    ? value.color
    : options[0];

  const set = (patch: Partial<EdgePreset>) => onChange({ ...value, ...patch });

  const thicknessConfig = {
    thin: { label: "Delgado", value: 1 },
    normal: { label: "Mediano", value: 2 },
    thick: { label: "Grueso", value: 4 },
  } as const;

  const getThicknessDisplay = (size: number) => (
    <div className="flex w-full items-center justify-center">
      <div
        className="bg-white rounded-full"
        style={{ height: size, width: "70%" }}
      />
    </div>
  );

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header informativo con tip (toggle) */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">
              Estilo de conexión
            </h3>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Personaliza el aspecto visual de las conexiones
          </p>
        </div>
        <div className="relative">
          <button
            className="text-gray-500 transition-colors hover:text-gray-700 hover:bg-gray-100 rounded-md p-1.5"
            onMouseEnter={() => setActiveTooltip("help")}
            onMouseLeave={() => setActiveTooltip(null)}
            onClick={() =>
              setActiveTooltip((s) => (s === "help" ? null : "help"))
            }
            aria-label="Ayuda"
          >
            <HelpCircle size={16} />
          </button>

          {activeTooltip === "help" && (
            <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
              <div className="mb-1 text-sm font-medium text-gray-900">
                ¿Cómo usar?
              </div>
              <div className="space-y-1 text-xs text-gray-700">
                <p>• Selecciona un color para el tipo de conexión</p>
                <p>• Ajusta el grosor según la importancia</p>
                <p>• Línea discontinua para conexiones especiales</p>
                <p>• Animación para conexiones críticas</p>
              </div>
              <div className="absolute -top-1 right-3 h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
            </div>
          )}
        </div>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Color</span>
          <span className="text-xs capitalize bg-white">{safeColor}</span>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {options.map((key) => (
            <div key={key} className="relative">
              <button
                title={`Color: ${key}`}
                onClick={() => set({ color: key })}
                onMouseEnter={() => setActiveTooltip(`color-${key}`)}
                onMouseLeave={() => setActiveTooltip(null)}
                aria-pressed={value.color === key}
                className={`flex h-8 w-full items-center justify-center rounded-lg border-2 transition-all duration-200 ${
                  value.color === key
                    ? "scale-105 ring-2 ring-blue-300 shadow-lg border-blue-400"
                    : "hover:scale-105 border-gray-300"
                }`}
                style={{
                  background: EDGE_COLORS[key],
                }}
              >
                {value.color === key && (
                  <div className="h-2 w-2 rounded-full bg-white shadow-sm" />
                )}
              </button>

              {activeTooltip === `color-${key}` && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 transform rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 shadow-lg">
                  {key}
                  <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-gray-200 bg-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grosor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Grosor</span>
          <span className="text-xs text-gray-600">
            {thicknessConfig[value.thickness].label}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["thin", "normal", "thick"] as const).map((t) => (
            <button
              key={t}
              title={`Grosor: ${thicknessConfig[t].label}`}
              onClick={() => set({ thickness: t })}
              onMouseEnter={() => setActiveTooltip(`thickness-${t}`)}
              onMouseLeave={() => setActiveTooltip(null)}
              aria-pressed={value.thickness === t}
              className={`flex flex-col items-center gap-2 rounded-lg border p-2 transition-all  ${
                value.thickness === t
                  ? "border-blue-300 bg-blue-50 shadow-inner"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {getThicknessDisplay(thicknessConfig[t].value)}
              <span className="text-xs text-white">
                {thicknessConfig[t].label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Estilos */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-900">Estilos</span>
        <div className="grid grid-cols-2 gap-2 ">
          {[
            {
              key: "dashed",
              label: "Discontinua",
              icon: Slash,
              variant: "blue" as const,
              active: value.dashed,
            },
            {
              key: "animated",
              label: "Animación",
              icon: Activity,
              variant: "purple" as const,
              active: value.animated,
            },
          ].map(({ key, label, icon: Icon, variant, active }) => (
            <button
              key={key}
              title={`${label} ${active ? "activado" : "desactivado"}`}
              onClick={() => set({ [key]: !active } as any)}
              onMouseEnter={() => setActiveTooltip(key)}
              onMouseLeave={() => setActiveTooltip(null)}
              aria-pressed={active}
              className={`flex items-center justify-center gap-2 rounded-lg border p-2 transition-all ${
                active
                  ? variant === "blue"
                    ? "bg-blue-50 border-blue-300"
                    : "bg-purple-50 border-purple-300"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  active
                    ? variant === "blue"
                      ? "text-blue-600"
                      : "text-purple-600"
                    : "text-gray-500"
                }`}
              />
              <span className="text-xs font-medium text-white">{label}</span>
              <div
                className={`ml-auto h-2 w-2 rounded-full transition-all ${
                  active
                    ? variant === "blue"
                      ? "bg-blue-500"
                      : "bg-purple-500"
                    : "bg-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Vista previa */}
      <div className="space-y-2 border-t border-gray-200 pt-2">
        <span className="text-sm font-medium text-gray-900">Vista previa</span>
        <div className="flex h-8 items-center justify-center rounded-lg bg-gray-50 p-2 border border-gray-200">
          <div
            className="relative w-full overflow-hidden rounded-full"
            style={{
              background: value.dashed
                ? `repeating-linear-gradient(90deg, ${EDGE_COLORS[safeColor]} 0 3px, transparent 3px 6px)`
                : EDGE_COLORS[safeColor],
              opacity: value.animated ? 0.8 : 1,
              height:
                ({ thin: 1, normal: 2, thick: 4 } as any)[value.thickness] *
                1.5,
            }}
          >
            {value.animated && (
              <div className="absolute inset-0 animate-pulse bg-white opacity-30" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Panel anclado (sin drag) */
export default function EdgeStylePopover({
  open,
  value,
  onChange,
  onClose,
  onAddSwitch,
}: PopoverProps) {
  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[380px]">
      <div className="rounded-xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="text-sm font-medium text-gray-900">
            Estilos de conexión
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <EdgeStyleBar value={value} onChange={onChange} />
          {onAddSwitch && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              <button
                onClick={onAddSwitch}
                className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Añadir Switch al lienzo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
