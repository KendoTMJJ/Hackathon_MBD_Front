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
    data: raw.data ??
      raw.data_template ??
      raw.data_document ?? { nodes: [], edges: [] },
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

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Contar nodos y conexiones
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  return (
    <article
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview con overlay */}
      <div className="relative h-[140px] border-b border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
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
            <Background color="#e5e7eb" gap={16} />
          </ReactFlow>
        </div>

        {/* Overlay con efecto de hover */}
        <div
          className={`absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 ${
            isHovered ? "bg-opacity-10" : ""
          }`}
        ></div>

        {/* Badge de tipo */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
          {doc.kind || "Template"}
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight mb-2">
          {doc.title}
        </h3>

        {/* Metadatos */}
        <div className="flex items-center text-xs text-gray-500 mb-4">
          <div className="flex items-center mr-3">
            <FileText size={12} className="mr-1" />
            <span>
              {nodeCount} nodos • {edgeCount} conexiones
            </span>
          </div>

          {doc.updatedAt && (
            <div className="flex items-center">
              <Clock size={12} className="mr-1" />
              <span>{formatDate(doc.updatedAt)}</span>
            </div>
          )}
        </div>

        {/* Botón de uso */}
        <button
          onClick={() => onUse(doc)}
          className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm text-white hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 group/btn"
        >
          <Plus
            size={16}
            className="transition-transform group-hover/btn:scale-110"
          />
          {t("use")}
        </button>
      </div>
    </article>
  );
}
