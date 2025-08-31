import "@xyflow/react/dist/style.css";
import { ReactFlow, Background } from "@xyflow/react";
import { useMemo } from "react";
import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";
import { useTranslation } from "react-i18next";

function normalizeDoc(raw: any) {
  return {
    id: raw.id ?? raw.cod_document,
    title: raw.title ?? raw.title_template ?? raw.title_document,
    kind: raw.kind ?? raw.kind_template ?? raw.kind_document,
    data:
      raw.data ??
      raw.data_template ??
      raw.data_document ??
      { nodes: [], edges: [] },
    projectId: raw.projectId ?? raw.project_id,
  };
}

type Props = {
  tpl: any; // TemplateEntity/DocumentEntity
  onUse: (tpl: any) => void;
};

export default function TemplateCard({ tpl, onUse }: Props) {
  // 👇 Usa namespace 'common' y prefijo 'templates'
  const { t } = useTranslation("common", { keyPrefix: "templates" });

  const doc = useMemo(() => normalizeDoc(tpl), [tpl]);
  const nodes = useMemo(() => (doc.data?.nodes as any[]) ?? [], [doc]);
  const edges = useMemo(() => (doc.data?.edges as any[]) ?? [], [doc]);

  return (
    <article className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--panel)]">
      {/* Preview */}
      <div className="relative h-[120px] border-b border-[var(--border)] bg-[linear-gradient(0deg,rgba(0,0,0,0.2),rgba(0,0,0,0.2)),radial-gradient(circle_at_20%_30%,#ec1e79_0%,transparent_40%),linear-gradient(135deg,#1d1d22,#222228)]">
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
        <div className="mt-1 text-xs text-[var(--muted)]">{t("type")}</div>

        <button
          onClick={() => onUse(doc)}
          className="mt-2 w-full rounded-[10px] border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm hover:bg-[color:oklch(from_var(--panel)_l_c_h/_0.98)]"
        >
          {t("use")}
        </button>
      </div>
    </article>
  );
}
