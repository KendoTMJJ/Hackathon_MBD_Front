import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

// Tipos de líneas de colores para diferentes propósitos
export const EDGE_COLORS = {
  security: "#E51212",
  servidores: "#E3ED2B",

  dmz: "#F59E0B",
  lan: "#22F0F0",
  datacenter: "#E300A4",
  cloud: "#707070",
  ot: "#992E08",
} as const;

export type EdgeColor = keyof typeof EDGE_COLORS;

export interface ColoredEdgeData {
  color?: EdgeColor;
  label?: string;
  animated?: boolean;
  dashed?: boolean;
  thickness?: "thin" | "normal" | "thick";
}

export function ColoredEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data = {},
  markerEnd,
}: EdgeProps & { data?: ColoredEdgeData }) {
  const color = data?.color ? EDGE_COLORS[data.color] : "#6b7280";
  const thickness =
    data?.thickness === "thick" ? 4 : data?.thickness === "thin" ? 1 : 2;
  const animated = data?.animated ?? false;
  const dashed = data?.dashed ?? false;

  // ➜ camino ortogonal
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8, // pon 0 si quieres esquinas rectas
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: thickness,
          strokeDasharray: dashed ? "5,5" : undefined,
          animation: animated ? "dash 1s linear infinite" : undefined,
        }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: "all",
            }}
            className="bg-black/80 text-white px-2 py-1 rounded text-xs border border-white/20"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>
    </>
  );
}
