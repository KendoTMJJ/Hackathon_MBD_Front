import { useEffect, useRef, useState } from "react";
import {
  X,
  GripVertical,
  Zap,
  HelpCircle,
  Activity,
  Slash,
} from "lucide-react";
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
    <div className="flex items-center justify-center w-full">
      <div
        className="rounded-full bg-white"
        style={{ height: size, width: "70%" }}
      />
    </div>
  );

  const VARIANT = {
    blue: {
      activeBtn: "bg-blue-500/20 border-blue-400/30",
      activeIcon: "text-blue-300",
      dot: "bg-blue-400",
    },
    purple: {
      activeBtn: "bg-purple-500/20 border-purple-400/30",
      activeIcon: "text-purple-300",
      dot: "bg-purple-400",
    },
    idleBtn: "bg-white/5 border-white/15 hover:bg-white/10",
    idleIcon: "text-white/60",
    idleDot: "bg-white/30",
  } as const;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-blue-400" />
            <h3 className="text-base font-semibold text-white">
              Estilo de conexión
            </h3>
          </div>
          <p className="mt-1 text-xs text-white/60">
            Personaliza el aspecto visual de las conexiones
          </p>
        </div>
        <div className="relative">
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

          {activeTooltip === "help" && (
            <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-xl">
              <div className="mb-1 text-sm font-medium text-white">
                ¿Cómo usar?
              </div>
              <div className="space-y-1 text-xs text-gray-300">
                <p>• Selecciona un color para el tipo de conexión</p>
                <p>• Ajusta el grosor según la importancia</p>
                <p>• Línea discontinua para conexiones especiales</p>
                <p>• Animación para conexiones críticas</p>
              </div>
              <div className="absolute -top-1 right-3 h-3 w-3 rotate-45 border-l border-t border-gray-700 bg-gray-900" />
            </div>
          )}
        </div>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/90">Color</span>
          <span className="text-xs capitalize text-white/60">{safeColor}</span>
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
                    ? "scale-105 ring-2 ring-white/80 shadow-lg"
                    : "scale-100 hover:scale-105"
                }`}
                style={{
                  background: EDGE_COLORS[key],
                  borderColor:
                    value.color === key
                      ? "rgba(255,255,255,.5)"
                      : "rgba(255,255,255,.2)",
                }}
              >
                {value.color === key && (
                  <div className="h-2 w-2 rounded-full bg-white/90" />
                )}
              </button>

              {activeTooltip === `color-${key}` && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 transform rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white">
                  {key}
                  <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-gray-700 bg-gray-900" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grosor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/90">Grosor</span>
          <span className="text-xs text-white/60">
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
              className={`flex flex-col items-center gap-2 rounded-lg border p-2 transition-all ${
                value.thickness === t
                  ? "border-white/25 bg-white/15 shadow-inner"
                  : "border-white/15 bg-transparent hover:bg-white/5"
              }`}
            >
              {getThicknessDisplay(thicknessConfig[t].value)}
              <span className="text-xs text-white/70">
                {thicknessConfig[t].label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Estilos adicionales */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-white/90">Estilos</span>
        <div className="grid grid-cols-2 gap-2">
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
                active ? VARIANT[variant].activeBtn : VARIANT.idleBtn
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  active ? VARIANT[variant].activeIcon : VARIANT.idleIcon
                }`}
              />
              <span className="text-xs font-medium text-white/90">{label}</span>
              <div
                className={`ml-auto h-2 w-2 rounded-full transition-all ${
                  active ? VARIANT[variant].dot : VARIANT.idleDot
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Vista previa */}
      <div className="space-y-2 border-t border-white/10 pt-2">
        <span className="text-sm font-medium text-white/90">Vista previa</span>
        <div className="flex h-8 items-center justify-center rounded-lg bg-white/5 p-2">
          <div
            className="relative h-1.5 w-full overflow-hidden rounded-full"
            style={{
              background: value.dashed
                ? `repeating-linear-gradient(90deg, ${EDGE_COLORS[safeColor]} 0 3px, transparent 3px 6px)`
                : EDGE_COLORS[safeColor],
              opacity: value.animated ? 0.8 : 1,
              height: thicknessConfig[value.thickness].value * 1.5,
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

/** Panel flotante draggable para configurar edges */
export default function EdgeStylePopover({
  open,
  value,
  onChange,
  onClose,
}: PopoverProps) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 76 });

  // Centrar al abrir
  useEffect(() => {
    if (!open) return;
    const w = boxRef.current?.offsetWidth ?? 380;
    const centerX = Math.max(12, window.innerWidth / 2 - w / 2);
    setPos({ x: centerX, y: 76 });
  }, [open]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const x = Math.min(
        Math.max(8, e.clientX - offsetRef.current.x),
        window.innerWidth - 8
      );
      const y = Math.min(
        Math.max(8, e.clientY - offsetRef.current.y),
        window.innerHeight - 8
      );
      setPos({ x, y });
    };
    const onUp = () => (draggingRef.current = false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      ref={boxRef}
      className="fixed z-[60] select-none"
      style={{ left: pos.x, top: pos.y, width: 380 }}
    >
      {/* Contenedor con header draggable */}
      <div className="rounded-xl border border-white/15 bg-[#0f1116]/95 backdrop-blur-lg shadow-2xl">
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            draggingRef.current = true;
            const rect = (
              e.currentTarget.parentElement as HTMLDivElement
            ).getBoundingClientRect();
            offsetRef.current = {
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            };
          }}
        >
          <div className="flex items-center gap-2 text-white/80">
            <GripVertical size={16} />
            <span className="text-sm font-medium">Estilos de conexión</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4">
          <EdgeStyleBar value={value} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
