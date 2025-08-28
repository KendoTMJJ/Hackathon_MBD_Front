import React from "react";
import {
  Handle,
  Position,
  NodeResizer,
  useReactFlow,
  useNodeId,
} from "@xyflow/react";
import {
  Maximize2,
  Settings,
  Trash2,
  Shield,
  Database,
  Cloud as CloudIcon,
  Cpu,
  Network,
  Pencil,
  Check,
  X,
} from "lucide-react";

type ZoneKind = "dmz" | "lan" | "datacenter" | "cloud" | "ot";

export interface SecurityZone {
  id: string;
  name: string; // nombre técnico de la zona
  description?: string;
  color: string;
  level: "low" | "medium" | "high" | (string & {});
}

interface ZoneNodeProps {
  data: SecurityZone & {
    kind: ZoneKind;

    /** Título personalizado del usuario (se edita inline) */
    title?: string;

    /** Overrides por subzona (p.ej. “Certificados como servicio”) */
    badgeText?: string;
    dropHint?: string;

    /** Callbacks opcionales (persistencia/acciones externas) */
    onRename?: (zoneId: string, newTitle: string) => void;
    onEdit?: (zone: SecurityZone) => void;
    onDelete?: (zoneId: string) => void;
    onExpand?: (zoneId: string) => void;
  };
  selected?: boolean;
}

const VARIANTS: Record<
  ZoneKind,
  {
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    // gradient: string;
    badgeText: string;
    dropHint: string;
  }
> = {
  // internet: {
  //   Icon: Globe,
  //   gradient: "from-red-950/40 via-red-900/10 to-transparent",
  //   badgeText: "Pública",
  //   dropHint: "Arrastra perímetros/edge",
  // },
  dmz: {
    Icon: Shield,
    // gradient: "from-amber-900/40 via-amber-800/10 to-transparent",
    badgeText: "DMZ",
    dropHint: "Suelta servicios públicos",
  },
  lan: {
    Icon: Network,
    // gradient: "from-teal-900/40 via-teal-800/10 to-transparent",
    badgeText: "LAN Interna",
    dropHint: "Suelta tecnologías internas",
  },
  datacenter: {
    Icon: Database,
    // gradient: "from-sky-900/40 via-sky-800/10 to-transparent",
    badgeText: "Data Center",
    dropHint: "Suelta servidores/ALB/DB",
  },
  cloud: {
    Icon: CloudIcon,
    // gradient: "from-violet-900/40 via-violet-800/10 to-transparent",
    badgeText: "Cloud",
    dropHint: "Suelta servicios cloud",
  },
  ot: {
    Icon: Cpu,
    // gradient: "from-emerald-900/40 via-emerald-800/10 to-transparent",
    badgeText: "OT",
    dropHint: "Suelta equipos industriales",
  },
};

const levelBadge = (lvl: string) =>
  lvl === "high"
    ? "bg-green-500/20 text-green-400"
    : lvl === "medium"
    ? "bg-yellow-500/20 text-yellow-400"
    : "bg-red-500/20 text-red-400";

const withAlpha = (color: string, alpha = 0.08) => {
  if (!color) return undefined;
  if (/^#([0-9a-fA-F]{6})$/.test(color)) {
    const aa = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${aa}`;
  }
  return color;
};

export default function ZoneNode({ data, selected }: ZoneNodeProps) {
  const variant = VARIANTS[data.kind];
  const { Icon } = variant;
  const borderColor = data.color;
  const bgColor = withAlpha(data.color, 0.08);

  // Título editable
  const [editing, setEditing] = React.useState(false);
  const [tempTitle, setTempTitle] = React.useState(data.title ?? "");

  const rf = useReactFlow();
  const nodeId = useNodeId(); // id real del nodo

  // Sincroniza input temporal si cambia el nodo o su título
  React.useEffect(() => {
    setTempTitle(data.title ?? "");
  }, [data.id, data.title]);

  const commitTitle = React.useCallback(
    (ok: boolean) => {
      setEditing(false);
      if (!ok) {
        setTempTitle(data.title ?? "");
        return;
      }
      const next = tempTitle.trim();
      const current = (data.title ?? "").trim();
      if (next === current) return;

      if (data.onRename) {
        data.onRename(data.id, next);
      } else {
        // Fallback local
        rf.setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, title: next } } : n
          )
        );
      }
    },
    [data.id, data.title, data.onRename, rf, tempTitle, nodeId]
  );

  // Overrides (para subzonas)
  const badgeText = data.badgeText ?? variant.badgeText;
  const dropHint = data.dropHint ?? variant.dropHint;

  return (
    <div
      className={`group relative w-full h-full min-w-[260px] min-h-[160px] rounded-xl border-2 bg-[#0b0e13]/80 p-4 pointer-events-auto ${
        selected ? "ring-2 ring-blue-500/40 shadow-lg" : ""
      }`}
      style={{ borderColor, backgroundColor: bgColor }}
    >
      {/* Resizer */}
      <NodeResizer
        isVisible={!!selected}
        minWidth={260}
        minHeight={160}
        lineStyle={{ borderColor }}
        handleStyle={{ backgroundColor: borderColor }}
      />

      {/* Overlay visual por tipo */}
      <div
        aria-hidden
        // className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br ${variant.gradient}`}
        className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br`}
      />

      {/* Entradas */}
      <Handle
        className="!w-3 !h-3 !bg-gray-600 !border-2 rounded-full opacity-0 group-hover:!opacity-100 transition-opacity"
        type="target"
        position={Position.Top}
        id="top"
        style={{ borderColor }}
      />
      <Handle
        className="!w-3 !h-3 !bg-gray-600 !border-2 rounded-full opacity-0 group-hover:!opacity-100 transition-opacity"
        type="target"
        position={Position.Left}
        id="left"
        style={{ borderColor }}
      />
      <Handle
        className="!w-3 !h-3 !bg-gray-600 !border-2 rounded-full opacity-0 group-hover:!opacity-100 transition-opacity"
        type="target"
        position={Position.Right}
        id="right"
        style={{ borderColor }}
      />
      <Handle
        className="!w-3 !h-3 !bg-gray-600 !border-2 rounded-full opacity-0 group-hover:!opacity-100 transition-opacity"
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ borderColor }}
      />

      {/* Salidas */}
      <Handle
        className="!w-3 !h-3 !bg-gray-600 !border-2 rounded-full opacity-0 group-hover:!opacity-100 transition-opacity"
        type="source"
        position={Position.Top}
        id="top-source"
        style={{ borderColor }}
      />
      <Handle
        className="!w-3 !h-3 !bg-gray-600 !border-2 rounded-full opacity-0 group-hover:!opacity-100 transition-opacity"
        type="source"
        position={Position.Left}
        id="left-source"
        style={{ borderColor }}
      />
      <Handle
        className="!w-3 !h-3 !bg-gray-600 !border-2 rounded-full opacity-0 group-hover:!opacity-100 transition-opacity"
        type="source"
        position={Position.Right}
        id="right-source"
        style={{ borderColor }}
      />
      <Handle
        className="!w-3 !h-3 !bg-gray-600 !border-2 rounded-full opacity-0 group-hover:!opacity-100 transition-opacity"
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        style={{ borderColor }}
      />

      {/* Header — es el “drag handle” del nodo */}
      <div className="zone-drag-handle relative mb-2 flex cursor-move select-none items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg p-2"
            style={{ backgroundColor: `${borderColor}26`, color: borderColor }}
          >
            <Icon size={16} />
          </div>
          <div>
            <div
              className="text-lg font-bold leading-5"
              style={{ color: borderColor }}
              title={data.name}
            >
              {data.name}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] text-white/60">{badgeText}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${levelBadge(
                  String(data.level)
                )}`}
              >
                {String(data.level).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
          {data.onExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onExpand!(data.id);
              }}
              className="rounded p-1 hover:bg-white/10 nodrag nowheel"
              title="Expandir zona"
              aria-label="Expandir zona"
            >
              <Maximize2 size={14} className="text-white/70" />
            </button>
          )}
          {data.onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onEdit!(data);
              }}
              className="rounded p-1 hover:bg-white/10 nodrag nowheel"
              title="Editar zona"
              aria-label="Editar zona"
            >
              <Settings size={14} className="text-white/70" />
            </button>
          )}
          {data.onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete!(data.id);
              }}
              className="rounded p-1 hover:bg-red-600/20 nodrag nowheel"
              title="Eliminar zona"
              aria-label="Eliminar zona"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Título editable (NO es drag handle) */}
      <div className="mb-2">
        {!editing ? (
          <div className="flex items-center gap-2">
            <div
              className={`max-w-[520px] truncate text-base font-semibold ${
                data.title ? "text-white" : "text-white/50 italic"
              } nodrag nowheel`}
              title={data.title || "Añade un título…"}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              {data.title || "Añade un título…"}
            </div>
            <button
              className="rounded p-1 hover:bg-white/10 nodrag nowheel"
              title="Editar título"
              aria-label="Editar título"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              <Pencil size={14} className="text-white/70" />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") commitTitle(true);
                if (e.key === "Escape") commitTitle(false);
              }}
              onBlur={() => commitTitle(true)}
              className="w-[420px] max-w-[60vw] rounded-md border border-white/10 bg-[#101218] px-2 py-1 text-sm text-white outline-none focus:border-white/20 nodrag nowheel"
              placeholder="Escribe un título…"
            />
            <button
              className="rounded p-1 hover:bg-white/10 nodrag nowheel"
              title="Guardar"
              aria-label="Guardar"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commitTitle(true)}
            >
              <Check size={16} className="text-green-400" />
            </button>
            <button
              className="rounded p-1 hover:bg-white/10 nodrag nowheel"
              title="Cancelar"
              aria-label="Cancelar"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commitTitle(false)}
            >
              <X size={16} className="text-white/70" />
            </button>
          </div>
        )}
      </div>

      {/* Hint de drop */}
      <div className="pointer-events-none absolute inset-3 top-20 flex items-center justify-center rounded-lg border-2 border-dashed border-transparent transition-all duration-200">
        <div className="text-center opacity-20 transition-opacity group-hover:opacity-60">
          <div className="text-xs font-medium text-white/70">{dropHint}</div>
          <div className="text-[10px] text-white/50">Arrastra aquí</div>
        </div>
      </div>
    </div>
  );
}
