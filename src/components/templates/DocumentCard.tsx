import "@xyflow/react/dist/style.css";
import { ReactFlow, Background } from "@xyflow/react";
import { useMemo } from "react";
import type { DocumentEntity } from "../../models";
import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";

export default function DocumentCard({
  doc,
  onOpen,
}: {
  doc: DocumentEntity;
  onOpen: (doc: DocumentEntity) => void;
}) {
  const nodes = useMemo(() => doc?.data?.nodes ?? [], [doc]);
  const edges = useMemo(() => doc?.data?.edges ?? [], [doc]);

  return (
    <article className="border border-[#313138] bg-[#151517] rounded-[14px] overflow-hidden">
      <div className="h-[120px] border-b border-[#313138] bg-gradient-to-br from-[#1d1d22] to-[#222228]">
        <ReactFlow
          nodes={nodes as any}
          edges={edges as any}
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
      <div className="p-3">
        <div className="font-semibold">{doc.title}</div>
        <div className="mt-1 text-xs text-white/60">Documento</div>
        <button
          onClick={() => onOpen(doc)}
          className="mt-2 rounded-md border border-white/10 bg-[#202237] px-3 py-1.5 text-xs hover:brightness-110"
        >
          Abrir
        </button>
      </div>
    </article>
  );
}
