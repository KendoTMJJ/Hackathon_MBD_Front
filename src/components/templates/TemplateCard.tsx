// src/components/templates/TemplateCard.tsx
import "@xyflow/react/dist/style.css";
import { ReactFlow, Background } from "@xyflow/react";
import { useMemo, useState } from "react";
import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";
import { useTranslation } from "react-i18next";
import { Plus, FileText, Clock } from "lucide-react";

function normalizeDoc(raw: any) {
  return {
    id: raw.id ?? raw.cod_document,
    title: raw.title ?? raw.title_template ?? raw.title_document,
    kind: raw.kind ?? raw.kind_template ?? raw.kind_document,
    data: raw.data ?? raw.data_template ?? raw.data_document ?? { nodes: [], edges: [] },
    projectId: raw.projectId ?? raw.project_id,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

type Props = {
  tpl: any; // TemplateEntity/DocumentEntity
  onUse: (tpl: any) => void;
};

export default function TemplateCard({ tpl, onUse }: Props) {
  const { t } = useTranslation("common", { keyPrefix: "templates" });
  const [isHovered, setIsHovered] = useState(false);

  const doc = useMemo(() => normalizeDoc(tpl), [tpl]);
  const nodes = useMemo(() => (doc.data?.nodes as any[]) ?? [], [doc]);
  const edges = useMemo(() => (doc.data?.edges as any[]) ?? [], [doc]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  return (
    <article
      className="group overflow-hidden rounded-2xl border border-[#3498DB]/20 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview */}
      <div className="relative h-[160px] border-b border-[#3498DB]/20 bg-gradient-to-br from-[#3498DB]/5 to-white overflow-hidden">
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
            <Background color="#3498DB10" gap={16} />
          </ReactFlow>
        </div>

        <div
          className={`absolute inset-0 bg-[#3498DB] bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 ${
            isHovered ? "bg-opacity-10" : ""
          }`}
        />

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium text-[#3498DB] shadow-sm">
          {doc.kind || "Template"}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5">
        <h3 className="font-semibold text-[#2C3E50] text-base line-clamp-2 leading-tight mb-3">
          {doc.title}
        </h3>

        <div className="flex items-center text-sm text-[#7F8C8D] mb-5">
          <div className="flex items-center mr-4">
            <FileText size={14} className="mr-1.5" />
            <span>
              {nodeCount} nodos • {edgeCount} conexiones
            </span>
          </div>
          {doc.updatedAt && (
            <div className="flex items-center">
              <Clock size={14} className="mr-1.5" />
              <span>{formatDate(doc.updatedAt)}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => onUse(doc)}
          className="has-tip w-full rounded-xl bg-[#3498DB] px-4 py-3 text-white hover:bg-[#2980B9] transition-all font-medium flex items-center justify-center gap-2 group/btn"
          data-tip={t("use")}
          aria-label={t("use")}
        >
          <Plus size={18} className="transition-transform group-hover/btn:scale-110" />
          {t("use")}
        </button>
      </div>
    </article>
  );
}
