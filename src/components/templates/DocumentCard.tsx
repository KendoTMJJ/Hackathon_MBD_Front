import "@xyflow/react/dist/style.css";
import { ReactFlow, Background } from "@xyflow/react";
import { useMemo, useRef, useState } from "react";
import type { DocumentEntity } from "../../models";
import { nodeTypes } from "../flow/nodes";
import { edgeTypes } from "../flow/edges";
import { useDocumentsApi } from "../../hooks/useDocument";
import { Trash2 } from "lucide-react";

export default function DocumentCard({
  doc,
  onOpen,
  onDeleted, // opcional: el padre quita la card del estado al instante
}: {
  doc: DocumentEntity;
  onOpen: (doc: DocumentEntity) => void;
  onDeleted?: (id: string) => void;
}) {
  const nodes = useMemo(() => doc?.data?.nodes ?? [], [doc]);
  const edges = useMemo(() => doc?.data?.edges ?? [], [doc]);
  const { remove } = useDocumentsApi();

  const [deleting, setDeleting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleDelete = async () => {
    if (deleting) return;

    const ok = window.confirm(
      `¿Eliminar definitivamente "${doc.title}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    try {
      setDeleting(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // Llamada a DELETE /documents/:id
      await remove(doc.id);

      // Notificar al padre para que quite el documento de su lista
      onDeleted?.(doc.id);
    } catch (e: any) {
      // Mensaje más claro según código
      const status = e?.response?.status;
      const msg =
        status === 403
          ? "No tienes permiso para eliminar este documento."
          : status === 404
          ? "El documento ya no existe."
          : "No se pudo eliminar el documento.";
      console.error(e);
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

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
        <div className="font-semibold flex items-center justify-between">
          <span className="truncate">{doc.title}</span>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Eliminar documento"
            className={`ml-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
              deleting
                ? "cursor-wait border-red-500/40 bg-red-500/20 text-red-200/70"
                : "border-red-500/40 bg-red-500/20 text-red-200 hover:bg-red-500/30"
            }`}
          >
            <Trash2 size={14} />
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>

        <div className="mt-1 text-xs text-white/60">Documento</div>

        <button
          onClick={() => onOpen(doc)}
          disabled={deleting}
          className="mt-2 rounded-md border border-white/10 bg-[#202237] px-3 py-1.5 text-xs hover:brightness-110 disabled:opacity-50"
        >
          Abrir
        </button>
      </div>
    </article>
  );
}
