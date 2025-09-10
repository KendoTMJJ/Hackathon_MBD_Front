import { useEffect, useState } from "react";
import type { SheetEntity } from "../../models";
import { useSheets } from "../../hooks/useSheets";

interface Props {
  documentId: string;
  activeSheetId: string | null;
  onSheetChange: (sheet: SheetEntity) => void;

  // === NUEVO ===
  isSharedDocument?: boolean;
  sharedToken?: string;

  canEdit?: boolean;
  sheets?: SheetEntity[];
  onCreateSheet?: (name: string) => Promise<void>;
  onDeleteSheet?: (sheetId: string) => Promise<void>;
  onReorderSheets?: (sheets: SheetEntity[]) => Promise<void>;
  saving?: boolean;
}

export default function SheetTabs({
  documentId,
  activeSheetId,
  onSheetChange,
  isSharedDocument = false,
  sharedToken,
  canEdit = true,
  sheets: externalSheets,
  onCreateSheet,
  onDeleteSheet,
  saving = false,
}: Props) {
  const { listByDocument, listByDocumentShared, create, update, remove } = useSheets();
  const [internalSheets, setInternalSheets] = useState<SheetEntity[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const sheets = externalSheets || internalSheets;

  useEffect(() => {
    if (externalSheets) return;

    (async () => {
      try {
        const result = isSharedDocument && sharedToken
          ? await listByDocumentShared(documentId, sharedToken)
          : await listByDocument(documentId);

        setInternalSheets(result);
        if (!activeSheetId && result.length) onSheetChange(result[0]);
      } catch (e) {
        console.error("Error cargando hojas:", e);
      }
    })();
  }, [documentId, externalSheets, isSharedDocument, sharedToken]);

  const handleSelect = (sheet: SheetEntity) => onSheetChange(sheet);

  const handleCreate = async () => {
    if (!canEdit) return;
    try {
      if (onCreateSheet) {
        await onCreateSheet(`Hoja ${sheets.length + 1}`);
      } else {
        const newSheet = await create(
          documentId,
          { name: `Hoja ${sheets.length + 1}`, data: { nodes: [], edges: [] } },
          isSharedDocument && sharedToken ? { sharedToken } : undefined
        );

        const next = [...internalSheets, newSheet].sort((a, b) => a.orderIndex - b.orderIndex);
        setInternalSheets(next);
        onSheetChange(newSheet);
      }
    } catch (e) {
      console.error("Error creando hoja:", e);
    }
  };

  const startEdit = (s: SheetEntity) => {
    if (!canEdit) return;
    setEditingId(s.id);
    setEditName(s.name || "");
  };

  const commitEdit = async () => {
    if (!editingId) return;
    const name = editName.trim() || "Sin título";
    try {
      const updated = await update(
        editingId,
        { name },
        isSharedDocument && sharedToken ? { sharedToken, documentId } : undefined
      );

      if (!externalSheets) {
        setInternalSheets(prev => prev.map(x => (x.id === updated.id ? updated : x)));
      }
      if (activeSheetId === updated.id) onSheetChange(updated);
    } catch (e) {
      console.error("Error renombrando hoja:", e);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (sheets.length <= 1) return alert("No puedes eliminar la última hoja");
    if (!confirm("¿Eliminar esta hoja?")) return;

    try {
      if (onDeleteSheet) {
        await onDeleteSheet(id);
      } else {
        await remove(
          id,
          isSharedDocument && sharedToken ? { sharedToken, documentId } : undefined
        );
        const next = internalSheets.filter(s => s.id !== id);
        setInternalSheets(next);
        if (activeSheetId === id && next.length) onSheetChange(next[0]);
      }
    } catch (e) {
      console.error("Error eliminando hoja:", e);
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20">
      <div className="pointer-events-auto flex h-10 items-center gap-1 border-t border-white/10 bg-[#0f1115]/95 px-2">
        {sheets.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center rounded-md border border-white/10 ${
              s.id === activeSheetId ? "bg-blue-600 text-white" : "bg-[#171727] text-gray-300"
            }`}
          >
            {editingId === s.id ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="w-28 bg-transparent px-3 py-2 text-xs outline-none"
                autoFocus
              />
            ) : (
              <button
                onClick={() => handleSelect(s)}
                onDoubleClick={() => startEdit(s)}
                className="px-3 py-2 text-xs"
                title={canEdit ? "Doble click para renombrar" : s.name || "Sin título"}
              >
                {s.name || "Sin título"}
              </button>
            )}

            {canEdit && sheets.length > 1 && (
              <button
                onClick={() => handleDelete(s.id)}
                className="px-2 text-xs text-red-300 opacity-0 group-hover:opacity-100"
                title="Eliminar hoja"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {canEdit && (
          <button
            onClick={handleCreate}
            className="rounded-md border border-white/10 bg-[#171727] px-3 py-2 text-xs text-green-400 hover:brightness-110"
            title="Agregar hoja"
            disabled={saving}
          >
            {saving ? "..." : "+"}
          </button>
        )}

        {saving && (
          <div className="flex items-center gap-1 px-2 text-xs text-yellow-300">
            <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
            Guardando...
          </div>
        )}
      </div>
    </div>
  );
}
