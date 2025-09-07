"use client";

import type React from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import {
  Maximize2,
  Settings,
  Trash2,
  Shield,
  Database,
  CloudIcon,
  Cpu,
  Network,
} from "lucide-react";

type ZoneKind = "dmz" | "lan" | "datacenter" | "cloud" | "ot";

export interface SecurityZone {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface ZoneNodeProps {
  data: SecurityZone & {
    kind: ZoneKind;
    badgeText?: string;
    dropHint?: string;
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
    badgeText: string;
    dropHint: string;
    image?: string;
  }
> = {
  dmz: {
    Icon: Shield,
    badgeText: "DMZ",
    dropHint: "Suelta servicios públicos",
    image: "/images/dmz-titulo.png",
  },
  lan: {
    Icon: Network,
    badgeText: "LAN Interna",
    dropHint: "Suelta tecnologías internas",
    image: "/images/lan-titulo.png",
  },
  datacenter: {
    Icon: Database,
    badgeText: "Data Center",
    dropHint: "Suelta servidores/ALB/DB",
    image: "/images/datacenter-titulo.png",
  },
  cloud: {
    Icon: CloudIcon,
    badgeText: "Cloud",
    dropHint: "Suelta servicios cloud",
    image: "/images/nube-titulo.png",
  },
  ot: {
    Icon: Cpu,
    badgeText: "OT",
    dropHint: "Suelta equipos industriales",
  },
};

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

  // Overrides (para subzonas)
  const badgeText = data.badgeText ?? variant.badgeText;
  const dropHint = data.dropHint ?? variant.dropHint;

  return (
    <div
      className={`group relative w-full h-full min-w-[280px] min-h-[180px] rounded-xl border-2 bg-white backdrop-blur-sm p-5 pointer-events-auto transition-all duration-200 shadow-sm ${
        selected
          ? "ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/10 scale-[1.02]"
          : "hover:shadow-lg hover:shadow-gray-200/50"
      }`}
      style={{ borderColor, backgroundColor: bgColor }}
    >
      {variant.image && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            <img
              src={variant.image || "/placeholder.svg"}
              alt={`${badgeText} Title`}
              className="w-24 h-auto"
            />
          </div>
        </div>
      )}

      <NodeResizer
        isVisible={!!selected}
        minWidth={280}
        minHeight={180}
        lineStyle={{ borderColor, borderWidth: 2 }}
        handleStyle={{
          backgroundColor: borderColor,
          width: 8,
          height: 8,
          borderRadius: 4,
          border: "2px solid rgba(255,255,255,0.8)",
        }}
      />

      {[
        { type: "target", position: Position.Top, id: "top" },
        { type: "target", position: Position.Left, id: "left" },
        { type: "target", position: Position.Right, id: "right" },
        { type: "target", position: Position.Bottom, id: "bottom" },
        { type: "source", position: Position.Top, id: "top-source" },
        { type: "source", position: Position.Left, id: "left-source" },
        { type: "source", position: Position.Right, id: "right-source" },
        { type: "source", position: Position.Bottom, id: "bottom-source" },
      ].map((handle) => (
        <Handle
          key={`${handle.type}-${handle.id}`}
          className="!w-4 !h-4 !bg-gray-300 !border-2 rounded-full opacity-0 group-hover:!opacity-100 transition-all duration-200 hover:!scale-125"
          type={handle.type as any}
          position={handle.position}
          id={handle.id}
          style={{ borderColor }}
        />
      ))}

      <div className="zone-drag-handle relative mb-4 flex cursor-move select-none items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="rounded-xl p-3 shadow-sm"
            style={{
              backgroundColor: `${borderColor}20`,
              color: borderColor,
              boxShadow: `0 2px 8px ${borderColor}15`,
            }}
          >
            <Icon size={20} />
          </div>
          <div className="space-y-2">
            <div
              className="text-xl font-bold leading-tight tracking-tight"
              style={{ color: borderColor }}
              title={data.name}
            >
              {data.name}
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-medium px-2 py-1 rounded-md border"
                style={{
                  backgroundColor: `${borderColor}15`,
                  color: `${borderColor}dd`,
                  borderColor: `${borderColor}30`,
                }}
              >
                {badgeText}
              </span>
            </div>
            {data.description && (
              <div className="text-sm text-gray-700 max-w-[200px] leading-relaxed">
                {data.description}
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
          {data.onExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onExpand!(data.id);
              }}
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200 nodrag nowheel"
              title="Expandir zona"
              aria-label="Expandir zona"
            >
              <Maximize2
                size={16}
                className="text-gray-600 hover:text-gray-800"
              />
            </button>
          )}
          {data.onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onEdit!(data);
              }}
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors duration-200 nodrag nowheel"
              title="Editar zona"
              aria-label="Editar zona"
            >
              <Settings
                size={16}
                className="text-gray-600 hover:text-gray-800"
              />
            </button>
          )}
          {data.onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete!(data.id);
              }}
              className="rounded-lg p-2 hover:bg-red-50 transition-colors duration-200 nodrag nowheel"
              title="Eliminar zona"
              aria-label="Eliminar zona"
            >
              <Trash2 size={16} className="text-red-500 hover:text-red-600" />
            </button>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-4 top-24 flex items-center justify-center rounded-xl border-2 border-dashed border-transparent transition-all duration-300">
        <div className="text-center opacity-30 transition-all duration-300 group-hover:opacity-70 group-hover:scale-105">
          <div className="text-sm font-medium text-gray-700 mb-1">
            {dropHint}
          </div>
          <div className="text-xs text-gray-500">Arrastra elementos aquí</div>
        </div>
      </div>
    </div>
  );
}
