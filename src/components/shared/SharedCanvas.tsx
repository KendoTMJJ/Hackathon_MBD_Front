import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useState, useCallback, useEffect } from "react";

type Props = {
  snapshot: { data: { nodes: Node[]; edges: Edge[] }; version: number } | null;
  permission: "read" | "edit";
  onChange: (patch: { nodes?: Node[]; edges?: Edge[] }) => void;
  onPresence?: (p: {
    cursor?: { x: number; y: number };
    selection?: any;
  }) => void;

  nodeTypes?: Record<string, any>;
  edgeTypes?: Record<string, any>;
};

export default function SharedCanvas({
  snapshot,
  permission,
  onChange,
}: //   onPresence,
Props) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // actualizar cuando llega snapshot remoto
  useEffect(() => {
    if (!snapshot) return;
    setNodes(snapshot.data.nodes ?? []);
    setEdges(snapshot.data.edges ?? []);
  }, [snapshot]);

  const readonly = permission !== "edit";

  const onNodesChange = useCallback(
    (changes: any[]) => {
      if (readonly) return;
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        onChange({ nodes: next });
        return next;
      });
    },
    [readonly, onChange]
  );

  const onEdgesChange = useCallback(
    (changes: any[]) => {
      if (readonly) return;
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        onChange({ edges: next });
        return next;
      });
    },
    [readonly, onChange]
  );

  const onConnect = useCallback(
    (conn: any) => {
      if (readonly) return;
      setEdges((eds) => {
        const next = addEdge(conn, eds);
        onChange({ edges: next });
        return next;
      });
    },
    [readonly, onChange]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
