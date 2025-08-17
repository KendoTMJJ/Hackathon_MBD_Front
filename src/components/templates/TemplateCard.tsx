// src/components/templates/TemplateCard.tsx
import "@xyflow/react/dist/style.css";
import { ReactFlow, Background } from "@xyflow/react";
import { useMemo } from "react";
import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";

// Acepta cualquier doc (snake o camel) y lo normaliza
function normalizeDoc(raw: any) {
  return {
    id: raw.id ?? raw.cod_document,
    title: raw.title ?? raw.title_document,
    kind: raw.kind ?? raw.kind_document,
    data: raw.data ?? raw.data_document ?? { nodes: [], edges: [] },
    projectId: raw.projectId ?? raw.project_id,
  };
}

type Props = {
  tpl: any;                     // DocumentEntity (camel o snake)
  onUse: (tpl: any) => void;    // callback cuando el usuario usa la plantilla
};

export default function TemplateCard({ tpl, onUse }: Props) {
  const doc = useMemo(() => normalizeDoc(tpl), [tpl]);
  const nodes = useMemo(() => (doc.data?.nodes as any[]) ?? [], [doc]);
  const edges = useMemo(() => (doc.data?.edges as any[]) ?? [], [doc]);

  return (
    <article className="tpl-card">
      <div className="tpl-thumb">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes as any}
          edgeTypes={edgeTypes as any}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnDrag={false}
        >
          <Background />
        </ReactFlow>
      </div>

      <div className="tpl-meta">
        <div className="tpl-title">{doc.title}</div>
        <div className="tpl-sub">Plantilla</div>

        <button
          onClick={() => onUse(doc)}
          className="btn btn-primary"
          style={{ marginTop: 8 }}
        >
          Usar plantilla
        </button>
      </div>
    </article>
  );
}
