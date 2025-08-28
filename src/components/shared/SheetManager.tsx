import React, { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import type { SheetEntity } from '../../models';

interface SheetManagerProps {
  sheets: SheetEntity[];
  activeSheetIdx: number | null;
  onSelectSheet: (index: number) => void;
  onCreateSheet: (name: string) => Promise<void>;
  onDeleteSheet: (sheetId: string) => Promise<void>;
  onReorderSheets: (newOrder: string[]) => Promise<void>;
  canEdit: boolean;
  saving?: boolean;
}

export function SheetManager({
  sheets,
  activeSheetIdx,
  onSelectSheet,
  onCreateSheet,
  onDeleteSheet,
  onReorderSheets,
  canEdit,
  saving = false
}: SheetManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [creating, setCreating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetName.trim() || creating) return;

    setCreating(true);
    try {
      await onCreateSheet(newSheetName.trim());
      setNewSheetName('');
      setShowCreateDialog(false);
    } catch (error) {
      alert('Error creando la hoja');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSheet = async (sheetId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta hoja?')) {
      return;
    }

    try {
      await onDeleteSheet(sheetId);
    } catch (error) {
      alert('Error eliminando la hoja');
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newSheets = [...sheets];
      const [draggedSheet] = newSheets.splice(draggedIndex, 1);
      newSheets.splice(dragOverIndex, 0, draggedSheet);
      
      const newOrder = newSheets.map(sheet => sheet.id);
      
      try {
        await onReorderSheets(newOrder);
      } catch (error) {
        alert('Error reordenando las hojas');
      }
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <div className="absolute left-4 bottom-4 z-30 flex items-center gap-2">
      <div className="flex gap-2 rounded-md border border-white/10 bg-[#0f1115]/95 backdrop-blur p-2 max-w-md overflow-x-auto">
        {sheets.length > 0 ? (
          sheets.map((sheet, idx) => (
            <div
              key={sheet.id}
              className={`relative flex items-center gap-1 px-3 py-1 rounded text-sm cursor-pointer transition-all ${
                activeSheetIdx === idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#171727] text-gray-300 hover:bg-[#2a2a3a]'
              } ${
                draggedIndex === idx ? 'opacity-50' : ''
              } ${
                dragOverIndex === idx ? 'ring-2 ring-blue-400' : ''
              }`}
              onClick={() => onSelectSheet(idx)}
              draggable={canEdit}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
            >
              {canEdit && (
                <GripVertical className="h-3 w-3 text-gray-400 cursor-grab" />
              )}
              
              <span className="whitespace-nowrap">
                {sheet.name || `Hoja ${idx + 1}`}
              </span>

              {canEdit && sheets.length > 1 && (
                <button
                  onClick={(e) => handleDeleteSheet(sheet.id, e)}
                  className="ml-1 p-0.5 rounded hover:bg-red-600/20 text-gray-400 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="px-3 py-1 text-sm text-gray-300">
            No hay hojas disponibles
          </div>
        )}
      </div>
      
      {/* Botón para crear nueva hoja */}
      {canEdit && (
        <button
          onClick={() => setShowCreateDialog(true)}
          className="rounded-md bg-green-600 p-2 text-white hover:bg-green-700 flex items-center justify-center transition-colors"
          title="Crear nueva hoja"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}

      {/* Indicador de guardado */}
      {saving && (
        <div className="rounded-md bg-yellow-600/20 border border-yellow-500/30 px-2 py-1 flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
          <span className="text-xs text-yellow-300">Guardando...</span>
        </div>
      )}

      {/* Dialog para crear hoja */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-[#1a1a1a] p-6 text-white">
            <h3 className="mb-4 text-lg font-semibold">Crear nueva hoja</h3>
            
            <form onSubmit={handleCreateSheet} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Nombre de la hoja
                </label>
                <input
                  type="text"
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  placeholder="Ej: Arquitectura, Frontend, Backend..."
                  className="w-full rounded bg-gray-700 p-2 text-white placeholder:text-gray-400"
                  maxLength={50}
                  required
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setNewSheetName('');
                  }}
                  className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newSheetName.trim()}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}