import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";

export default function SecureEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        ...style,
        stroke: "#00c853",
        strokeWidth: 3,
      }}
      markerEnd={markerEnd}
    />
  );
}
