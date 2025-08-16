// src/components/templates/TemplateCard.tsx
import "@xyflow/react/dist/style.css";
import { ReactFlow, Background } from "@xyflow/react";
import type { DocumentEntity } from "../../models";
import { nodeTypes } from "../flow/nodes"; // ajusta el path si están en otro sitio
import { edgeTypes } from "../flow/edges"; // idem
import { useMemo } from "react";

type Props = {
  tpl: DocumentEntity;
  onUse: (tpl: DocumentEntity) => void;
};

export default function TemplateCard({ tpl, onUse }: Props) {
  const nodes = useMemo(() => (tpl.data_document?.nodes as any[]) ?? [], [tpl]);
  const edges = useMemo(() => (tpl.data_document?.edges as any[]) ?? [], [tpl]);

  return (
    <article className="rounded-xl border border-white/10 bg-[#141420] p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">{tpl.title_document}</h3>
        <p className="text-xs text-white/60">Plantilla</p>
      </div>

      {/* Preview no interactivo */}
      <div className="mb-4 h-32 rounded-md overflow-hidden bg-black/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes as any}
          edgeTypes={edgeTypes as any}
          fitView
          proOptions={{ hideAttribution: true }}
          // Desactivar interacción para que sea “thumbnail”
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnDrag={false}
        >
          <Background />
        </ReactFlow>
      </div>

      <button
        onClick={() => onUse(tpl)}
        className="w-full rounded-md border border-white/10 bg-[#202237] px-3 py-2 text-sm hover:brightness-110"
      >
        Usar plantilla
      </button>
    </article>
  );
}
