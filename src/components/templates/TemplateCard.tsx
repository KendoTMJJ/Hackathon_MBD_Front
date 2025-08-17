import "@xyflow/react/dist/style.css";
import { ReactFlow, Background } from "@xyflow/react";
import { useMemo } from "react";
import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";

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
  tpl: any; // DocumentEntity (camel o snake)
  onUse: (tpl: any) => void;
};

export default function TemplateCard({ tpl, onUse }: Props) {
  const doc = useMemo(() => normalizeDoc(tpl), [tpl]);
  const nodes = useMemo(() => (doc.data?.nodes as any[]) ?? [], [doc]);
  const edges = useMemo(() => (doc.data?.edges as any[]) ?? [], [doc]);

  return (
    <article className="overflow-hidden rounded-[14px] border border-[#313138] bg-[#151517]">
      {/* Thumb con preview */}
      <div className="relative h-[120px] border-b border-[#313138] bg-[linear-gradient(0deg,rgba(0,0,0,0.2),rgba(0,0,0,0.2)),radial-gradient(circle_at_20%_30%,#ec1e79_0%,transparent_40%),linear-gradient(135deg,#1d1d22,#222228)]">
        <div className="absolute inset-0">
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
      </div>

      {/* Meta */}
      <div className="p-3">
        <div className="font-semibold">{doc.title}</div>
        <div className="mt-1 text-xs text-[#c8c8cc]">Plantilla</div>

        <button
          onClick={() => onUse(doc)}
          className="mt-2 w-full rounded-[10px] border border-[#313138] bg-[#1b1b1f] px-3 py-2 text-sm text-white hover:border-[#3a3a41]"
        >
          Usar plantilla
        </button>
      </div>
    </article>
  );
}
