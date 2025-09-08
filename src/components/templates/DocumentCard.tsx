// src/components/templates/DocumentCard.tsx
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
      className="group overflow-hidden rounded-2xl border border-[#3498DB]/20 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(doc)}
    >
      {/* Preview del diagrama con overlay */}
      <div className="h-[160px] relative border-b border-[#3498DB]/20 bg-gradient-to-br from-[#3498DB]/5 to-white overflow-hidden">
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
          <Background color="#3498DB10" gap={16} />
        </ReactFlow>

        {/* Overlay con efecto de hover */}
        <div
          className={`absolute inset-0 bg-[#3498DB] bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center ${
            isHovered ? "bg-opacity-10" : ""
          }`}
        >
          {isHovered && (
            <div className="flex items-center justify-center bg-white rounded-full p-3 shadow-lg">
              <ExternalLink size={18} className="text-[#3498DB]" />
            </div>
          )}
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-[#2C3E50] text-base line-clamp-2 leading-tight flex-1 mr-3">
            {doc.title}
          </h3>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title={t("delete")}
            className={`inline-flex items-center gap-1.5 rounded-xl p-2 text-xs transition-all ${
              deleting
                ? "cursor-wait text-red-400"
                : "text-[#7F8C8D] hover:text-red-500 hover:bg-red-50"
            }`}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Metadatos */}
        <div className="flex items-center text-sm text-[#7F8C8D] mb-4">
          <Clock size={14} className="mr-1.5" />
          <span className="mr-4">
            {doc.updatedAt ? formatDate(doc.updatedAt) : formatDate(doc.createdAt)}
          </span>
          <FileText size={14} className="mr-1.5" />
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
          className="w-full rounded-xl bg-[#3498DB] px-4 py-2.5 text-white hover:bg-[#2980B9] disabled:opacity-50 transition-all font-medium flex items-center justify-center gap-2"
        >
          <ExternalLink size={16} />
          {t("open")}
        </button>
      </div>
    </article>
  );
}