import { Handle, Position } from "@xyflow/react";
import type { Technology } from "../../../mocks/technologies.types";
import type { ZoneKind } from "../../data/zones";

type Props = {
  data: Technology & { zoneKind?: ZoneKind }; // le pasamos la zona para tematizar colores
};

const THEME: Record<
  ZoneKind,
  { bg: string; border: string; text: string; accent: string }
> = {
  cloud: {
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-900",
    accent: "text-cyan-600",
  },
  dmz: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
    accent: "text-amber-600",
  },
  lan: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-900",
    accent: "text-sky-600",
  },
  datacenter: {
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    text: "text-fuchsia-900",
    accent: "text-fuchsia-600",
  },
  ot: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-900",
    accent: "text-orange-600",
  },
};

export default function TechNode({ data }: Props) {
  const kind = (data.zoneKind ?? "lan") as ZoneKind;
  const theme = THEME[kind];

  return (
    <div
      className={`px-3 py-2 rounded-xl shadow-sm min-w-[220px] border-2 ${theme.bg} ${theme.border}`}
    >
      <div className="flex items-center gap-3">
        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt={data.name}
            className="w-8 h-8 rounded object-contain"
          />
        ) : (
          <div className={`w-8 h-8 rounded bg-white/70 ${theme.border}`} />
        )}
        <div className="min-w-0">
          <div className={`text-sm font-semibold truncate ${theme.text}`}>
            {data.name}
          </div>
          {data.provider && (
            <div className={`text-xs truncate ${theme.accent}`}>
              {data.provider}
            </div>
          )}
        </div>
      </div>

      {/* chips de tags */}
      {!!data.tags?.length && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-[2px] rounded bg-white/60 text-black/70"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Entradas */}
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="target" position={Position.Right} id="r" />
      <Handle type="target" position={Position.Bottom} id="b" />
      {/* Salidas */}
      <Handle type="source" position={Position.Top} id="st" />
      <Handle type="source" position={Position.Left} id="sl" />
      <Handle type="source" position={Position.Right} id="sr" />
      <Handle type="source" position={Position.Bottom} id="sb" />
    </div>
  );
}
