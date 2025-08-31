import "@xyflow/react/dist/style.css";
import { ReactFlow, Background } from "@xyflow/react";
import { useMemo, useRef, useState } from "react";
import type { DocumentEntity } from "../../models";
import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";
import { useDocumentsApi } from "../../hooks/useDocument";
import { Trash2 } from "lucide-react";
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
  // 👇 Usa namespace 'common' y prefijo 'documents'
  const { t } = useTranslation("common", { keyPrefix: "documents" });

  const nodes = useMemo(() => doc?.data?.nodes ?? [], [doc]);
  const edges = useMemo(() => doc?.data?.edges ?? [], [doc]);
  const { remove } = useDocumentsApi();

  const [deleting, setDeleting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleDelete = async () => {
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

  return (
    <article className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--panel)]">
      <div className="h-[120px] border-b border-[var(--border)] bg-gradient-to-br from-[#1d1d22] to-[#222228]">
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
        <div className="flex items-center justify-between font-semibold">
          <span className="truncate">{doc.title}</span>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title={t("delete")}
            className={`ml-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
              deleting
                ? "cursor-wait border-red-500/40 bg-red-500/20 text-red-200/70"
                : "border-red-500/40 bg-red-500/20 text-red-200 hover:bg-red-500/30"
            }`}
          >
            <Trash2 size={14} />
            {deleting ? t("deleting") : t("delete")}
          </button>
        </div>

        <div className="mt-1 text-xs text-[var(--muted)]">{t("type")}</div>

        <button
          onClick={() => onOpen(doc)}
          disabled={deleting}
          className="mt-2 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs text-white hover:brightness-110 disabled:opacity-50"
        >
          {t("open")}
        </button>
      </div>
    </article>
  );
}
