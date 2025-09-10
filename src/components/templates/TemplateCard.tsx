// src/components/templates/TemplateCard.tsx
import "@xyflow/react/dist/style.css";
import { ReactFlow, Background } from "@xyflow/react";
import { useMemo, useRef, useState } from "react";
import type { TemplateEntity } from "../../models";
import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";
import { useTemplates } from "../../hooks/useTemplate";
import { Trash2, Clock, FileText, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCan } from "../auth/acl";

function normalizeTpl(raw: any) {
  return {
    id:
      raw.id ??
      raw.cod_template ??
      raw.templateId ??
      raw.id_template ??
      raw.cod_document,
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

export default function TemplateCard({
  tpl,
  onUse,
  onDeleted,
}: {
  tpl: TemplateEntity;
  onUse: (tpl: TemplateEntity) => void;
  onDeleted?: (id: string) => void;
}) {
  const { t } = useTranslation("common", { keyPrefix: "templates" });

  // Igual que DocumentCard pero para templates:
  const { remove } = useTemplates();
  const [deleting, setDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const canDelete = useCan("template:delete");

  // Soporta estructuras distintas de TemplateEntity
  const doc = useMemo(() => normalizeTpl(tpl), [tpl]);
  const nodes = useMemo(() => (doc?.data?.nodes as any[]) ?? [], [doc]);
  const edges = useMemo(() => (doc?.data?.edges as any[]) ?? [], [doc]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;

    const ok = window.confirm(t("deleteConfirm", { name: doc.title }));
    if (!ok) return;

    try {
      setDeleting(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      // Misma llamada que en DocumentCard: await remove(doc.id)
      await remove(doc.id);
      onDeleted?.(String(doc.id));
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

  const formatDate = (dateString?: string) => {
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
      className="group overflow-hidden rounded-2xl border border-[#3498DB]/20 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onUse(tpl)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onUse(tpl);
        }
      }}
      aria-label={t("use")}
    >
      {/* Preview */}
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

        {/* Overlay hover */}
        <div
          className={`pointer-events-none absolute inset-0 bg-[#3498DB] bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center ${
            isHovered ? "bg-opacity-10" : ""
          }`}
        >
          {isHovered && (
            <div className="pointer-events-none flex items-center justify-center bg-white rounded-full p-3 shadow-lg">
              <ExternalLink size={18} className="text-[#3498DB]" />
            </div>
          )}
        </div>

        {/* Etiqueta de tipo */}
        {doc.kind && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium text-[#3498DB] shadow-sm">
            {doc.kind}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-[#2C3E50] text-base line-clamp-2 leading-tight flex-1 mr-3">
            {doc.title}
          </h3>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title={t("delete")}
              className={`has-tip inline-flex items-center gap-1.5 rounded-xl p-2 text-xs transition-all ${
                deleting
                  ? "cursor-wait text-red-400"
                  : "text-[#7F8C8D] hover:text-red-500 hover:bg-red-50"
              }`}
              data-tip={t("delete")}
              aria-label={t("delete")}
              aria-busy={deleting}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Metadatos */}
        <div className="flex items-center text-sm text-[#7F8C8D] mb-4">
          <Clock size={14} className="mr-1.5" />
          <span className="mr-4">
            {doc.updatedAt
              ? formatDate(doc.updatedAt)
              : formatDate(doc.createdAt)}
          </span>
          <FileText size={14} className="mr-1.5" />
          <span>
            {nodeCount} {t("nodes", { defaultValue: "nodos" })} • {edgeCount}{" "}
            {t("connections", { defaultValue: "conexiones" })}
          </span>
        </div>

        {/* Usar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUse(tpl);
          }}
          disabled={deleting}
          className="has-tip w-full rounded-xl bg-[#3498DB] px-4 py-2.5 text-white hover:bg-[#2980B9] disabled:opacity-50 transition-all font-medium flex items-center justify-center gap-2"
          data-tip={t("use")}
          aria-label={t("use")}
        >
          <ExternalLink size={16} />
          {t("use")}
        </button>
      </div>
    </article>
  );
}
