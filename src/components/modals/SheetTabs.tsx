import { useEffect, useState } from "react";
import { useSheets } from "../../hooks/useSheets";
import type { SheetEntity } from "../../models";

interface Props {
  documentId: string;
  activeSheetId: string | null;
  onSheetChange: (sheet: SheetEntity) => void;
}

export default function SheetTabs({ documentId, activeSheetId, onSheetChange }: Props) {
  const { listByDocument, create, update, remove } = useSheets();
  const [sheets, setSheets] = useState<SheetEntity[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // cargar hojas
  useEffect(() => {
    (async () => {
      try {
        const result = await listByDocument(documentId);
        setSheets(result);
        // si no hay activa, activa la primera
        if (!activeSheetId && result.length) onSheetChange(result[0]);
      } catch (e) {
        console.error("Error cargando hojas:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const handleSelect = (sheet: SheetEntity) => onSheetChange(sheet);

  const handleCreate = async () => {
    try {
      const newSheet = await create(documentId, {
        name: `Hoja ${sheets.length + 1}`,
        data: { nodes: [], edges: [] }, // Asegurar que esté vacía
      });
      const next = [...sheets, newSheet].sort((a, b) => a.orderIndex - b.orderIndex);
      setSheets(next);
      onSheetChange(newSheet); // Cambiar a la nueva hoja inmediatamente
    } catch (e) {
      console.error("Error creando hoja:", e);
    }
  };

  const startEdit = (s: SheetEntity) => {
    setEditingId(s.id);
    setEditName(s.name || "");
  };

  const commitEdit = async () => {
    if (!editingId) return;
    const name = editName.trim() || "Sin título";
    try {
      const updated = await update(editingId, { name });
      setSheets((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      if (activeSheetId === updated.id) onSheetChange(updated);
    } catch (e) {
      console.error("Error renombrando hoja:", e);
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (sheets.length <= 1) return alert("No puedes eliminar la última hoja");
    if (!confirm("¿Eliminar esta hoja?")) return;
    try {
      await remove(id);
      const next = sheets.filter((s) => s.id !== id);
      setSheets(next);
      if (activeSheetId === id && next.length) onSheetChange(next[0]);
    } catch (e) {
      console.error("Error eliminando hoja:", e);
    }
  };

  return (
    // wrapper que NO bloquea el drag fuera de los botones
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
                title="Doble click para renombrar"
              >
                {s.name || "Sin título"}
              </button>
            )}

            {sheets.length > 1 && (
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

        <button
          onClick={handleCreate}
          className="rounded-md border border-white/10 bg-[#171727] px-3 py-2 text-xs text-green-400 hover:brightness-110"
          title="Agregar hoja"
        >
          +
        </button>
      </div>
    </div>
  );
}
