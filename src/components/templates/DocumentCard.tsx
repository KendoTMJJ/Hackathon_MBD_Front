import "@xyflow/react/dist/style.css";
import { ReactFlow, Background } from "@xyflow/react";
import { useMemo, useRef, useState } from "react";
import type { DocumentEntity } from "../../models";
import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";
import { useDocumentsApi } from "../../hooks/useDocument";
import { Trash2, Clock, FileText, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DocumentCard({
  doc,
  onOpen,
  onDeleted,
}: {
  doc: DocumentEntity;
  onOpen: (doc: DocumentEntity) => void;
  onDeleted?: (id: string) => void;
}) {
  const { t } = useTranslation("common", { keyPrefix: "documents" });

  const nodes = useMemo(() => doc?.data?.nodes ?? [], [doc]);
  const edges = useMemo(() => doc?.data?.edges ?? [], [doc]);
  const { remove } = useDocumentsApi();

  const [deleting, setDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    const ok = window.confirm(t("deleteConfirm", { name: doc.title }));
    if (!ok) return;

    try {
      setDeleting(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      await remove(doc.id);
      onDeleted?.(doc.id);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        status === 403
          ? t("errors.forbidden")
          : status === 404
          ? t("errors.notFound")
          : t("errors.genericDelete");
      console.error(e);
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Formatear fecha de modificación
  const formatDate = (dateString: string) => {
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
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(doc)}
    >
      {/* Preview del diagrama con overlay */}
      <div className="h-[140px] relative border-b border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
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
          <Background color="#e5e7eb" gap={16} />
        </ReactFlow>

        {/* Overlay con efecto de hover */}
        <div
          className={`absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center ${
            isHovered ? "bg-opacity-10" : ""
          }`}
        >
          {isHovered && (
            <div className="flex items-center justify-center bg-white rounded-full p-2 shadow-lg">
              <ExternalLink size={16} className="text-blue-600" />
            </div>
          )}
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight flex-1 mr-2">
            {doc.title}
          </h3>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title={t("delete")}
            className={`inline-flex items-center gap-1.5 rounded-lg p-1.5 text-xs transition-colors ${
              deleting
                ? "cursor-wait text-red-400"
                : "text-gray-400 hover:text-red-500 hover:bg-red-50"
            }`}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Metadatos */}
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <Clock size={12} className="mr-1" />
          <span className="mr-3">
            {doc.updatedAt
              ? formatDate(doc.updatedAt)
              : formatDate(doc.createdAt)}
          </span>

          <FileText size={12} className="mr-1" />
          <span>
            {nodeCount} nodos • {edgeCount} conexiones
          </span>
        </div>

        {/* Botón de acción */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(doc);
          }}
          disabled={deleting}
          className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <ExternalLink size={14} />
          {t("open")}
        </button>
      </div>
    </article>
  );
}
