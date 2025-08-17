"use client"

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react"

// Tipos de líneas de colores para diferentes propósitos
export const EDGE_COLORS = {
  // Seguridad
  security: "#10b981", // Verde - Tráfico seguro
  threat: "#ef4444", // Rojo - Amenazas/ataques
  data: "#3b82f6", // Azul - Flujo de datos
  management: "#f59e0b", // Naranja - Gestión/administración
  backup: "#8b5cf6", // Púrpura - Respaldos
  monitoring: "#06b6d4", // Cian - Monitoreo
  // Zonas de red
  dmz: "#f59e0b", // Naranja - DMZ
  lan: "#3b82f6", // Azul - LAN
  wan: "#ef4444", // Rojo - WAN/Internet
  datacenter: "#8b5cf6", // Púrpura - Data Center
  cloud: "#10b981", // Verde - Cloud
  ot: "#f97316", // Naranja oscuro - OT/Industrial
} as const

export type EdgeColor = keyof typeof EDGE_COLORS

export interface ColoredEdgeData {
  color?: EdgeColor
  label?: string
  animated?: boolean
  dashed?: boolean
  thickness?: "thin" | "normal" | "thick"
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
  const color = data?.color ? EDGE_COLORS[data.color] : "#6b7280"
  const thickness = data?.thickness === "thick" ? 4 : data?.thickness === "thin" ? 1 : 2
  const animated = data?.animated ?? false
  const dashed = data?.dashed ?? false

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

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
  )
}
