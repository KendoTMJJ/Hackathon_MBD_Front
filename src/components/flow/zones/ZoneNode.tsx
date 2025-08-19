// src/components/zones/ZoneNode.tsx
import React from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Maximize2,
  Settings,
  Trash2,
  Globe,
  Shield,
  Database,
  Cloud as CloudIcon,
  Cpu,
  Network,
} from "lucide-react";

type ZoneKind = "internet" | "dmz" | "lan" | "datacenter" | "cloud" | "ot";

export interface SecurityZone {
  id: string;
  name: string;
  description?: string;
  color: string;
  level: "low" | "medium" | "high" | (string & {});
  // añade aquí lo que ya tengas en tu tipo real
}

interface ZoneNodeProps {
  data: SecurityZone & {
    kind: ZoneKind;
    // iconName?: IconName; // si quieres forzar un icono desde fuera
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
    gradient: string; // overlay visual
    badgeText: string;
    dropHint: string;
  }
> = {
  internet: {
    Icon: Globe,
    gradient: "from-red-950/40 via-red-900/10 to-transparent",
    badgeText: "Pública",
    dropHint: "Arrastra perímetros/edge",
  },
  dmz: {
    Icon: Shield,
    gradient: "from-amber-900/40 via-amber-800/10 to-transparent",
    badgeText: "DMZ",
    dropHint: "Suelta servicios públicos",
  },
  lan: {
    Icon: Network,
    gradient: "from-teal-900/40 via-teal-800/10 to-transparent",
    badgeText: "LAN Interna",
    dropHint: "Suelta tecnologías internas",
  },
  datacenter: {
    Icon: Database,
    gradient: "from-sky-900/40 via-sky-800/10 to-transparent",
    badgeText: "Data Center",
    dropHint: "Suelta servidores/ALB/DB",
  },
  cloud: {
    Icon: CloudIcon,
    gradient: "from-violet-900/40 via-violet-800/10 to-transparent",
    badgeText: "Cloud",
    dropHint: "Suelta servicios cloud",
  },
  ot: {
    Icon: Cpu,
    gradient: "from-emerald-900/40 via-emerald-800/10 to-transparent",
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

export function ZoneNode({ data, selected }: ZoneNodeProps) {
  const variant = VARIANTS[data.kind];
  const { Icon } = variant;
  const borderColor = data.color;
  const bgColor = withAlpha(data.color, 0.08);

  return (
    <div
      className={`group relative rounded-xl border-2 p-4 min-w-[260px] min-h-[160px] bg-[#0b0e13]/80 ${
        selected ? "ring-2 ring-blue-500/40 shadow-lg" : ""
      }`}
      style={{ borderColor, backgroundColor: bgColor }}
    >
      {/* Overlay de gradiente por tipo */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br ${variant.gradient}`}
      />

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

      {/* Header */}
      <div className="flex items-start justify-between mb-3 relative">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${borderColor}26`, color: borderColor }}
          >
            <Icon size={16} />
          </div>
          <div>
            <div
              className="text-lg font-bold leading-5"
              style={{ color: borderColor }}
            >
              {data.name}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] text-white/60">
                {variant.badgeText}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${levelBadge(
                  String(data.level)
                )}`}
              >
                {String(data.level).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {data.onExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onExpand!(data.id);
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
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
              className="p-1 hover:bg-white/10 rounded transition-colors"
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
              className="p-1 hover:bg-red-600/20 rounded transition-colors"
              title="Eliminar zona"
              aria-label="Eliminar zona"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Descripción */}
      {data.description && (
        <p className="text-xs text-white/75 mb-3 relative">
          {data.description}
        </p>
      )}

      {/* Indicador de drop por tipo */}
      <div className="pointer-events-none absolute inset-3 top-14 border-2 border-dashed border-transparent rounded-lg transition-all duration-200 flex items-center justify-center group">
        <div className="text-center opacity-20 group-hover:opacity-60 transition-opacity">
          <div className="text-xs text-white/70 font-medium">
            {variant.dropHint}
          </div>
          <div className="text-[10px] text-white/50">Arrastra aquí</div>
        </div>
      </div>
    </div>
  );
}
