import type React from "react";

// src/components/Flow/CanvasHelpButtons.tsx
import { useState } from "react";
import {
  HelpCircle,
  Trash2,
  MousePointer2,
  Brush,
  Undo2,
  Redo2,
} from "lucide-react";

type Props = {
  /** abre/cierra el popover de estilos (EdgeStylePopover) */
  onToggleEdgeStyleBar: () => void;
  /** si el popover de estilos está visible para pintar el botón como activo */
  isEdgeStyleBarVisible: boolean;

  /** activa/desactiva el modo borrar por clic */
  onToggleDeleteMode: () => void;
  isDeleteMode: boolean;

  /** deshacer y rehacer */
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  className?: string;
};

export default function CanvasHelpButtons({
  onToggleEdgeStyleBar,
  isEdgeStyleBarVisible,
  onToggleDeleteMode,
  isDeleteMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  className = "",
}: Props) {
  const [openHelp, setOpenHelp] = useState(false);

  const Btn = (p: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      {...p}
      className={[
        "rounded-lg px-3 py-2 text-sm transition-all duration-200",
        "text-white hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed",
        "border border-gray-200 bg-white shadow-sm hover:shadow-md",
        p.className || "",
      ].join(" ")}
    />
  );

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      {/* Estilos de conexión */}
      <Btn
        title="Configurar estilos de conexión"
        aria-label="Estilos de conexión"
        onClick={onToggleEdgeStyleBar}
        className={
          isEdgeStyleBarVisible
            ? "bg-blue-500 text-white border-blue-500 shadow-lg ring-2 ring-blue-200 hover:bg-blue-600 hover:text-white"
            : undefined
        }
      >
        <Brush size={18} />
      </Btn>

      {/* Deshacer / Rehacer */}
      <Btn title="Deshacer (Ctrl/Cmd + Z)" onClick={onUndo} disabled={!canUndo}>
        <Undo2 size={18} />
      </Btn>
      <Btn
        title="Rehacer (Ctrl+Y o Ctrl/Cmd+Shift+Z)"
        onClick={onRedo}
        disabled={!canRedo}
      >
        <Redo2 size={18} />
      </Btn>

      <Btn
        title={
          isDeleteMode
            ? "Modo borrar activo: haz clic en nodos/edges para eliminarlos (Esc para salir)"
            : "Activar modo borrar: clic y luego toca elementos para eliminarlos"
        }
        aria-pressed={isDeleteMode}
        onClick={onToggleDeleteMode}
        className={
          isDeleteMode
            ? "bg-red-500 text-white border-red-500 shadow-lg ring-2 ring-red-200 hover:bg-red-600 hover:text-white animate-pulse"
            : "hover:border-red-300 hover:text-red-600"
        }
      >
        <Trash2 size={18} />
      </Btn>

      {/* Ayuda / tips */}
      <Btn
        title="Ayuda / atajos"
        aria-label="Ayuda"
        onClick={() => setOpenHelp((v) => !v)}
        className={openHelp ? "bg-gray-100 text-gray-900" : undefined}
      >
        <HelpCircle size={18} />
      </Btn>

      {openHelp && (
        <div className="absolute z-[70] top-full right-0 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <MousePointer2 className="h-4 w-4 text-blue-500" />
            Consejos rápidos
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              • Mantén <span className="font-medium text-gray-900">Shift</span>{" "}
              para selección múltiple (clic o lazo).
            </li>
            <li>
              •{" "}
              <span className="font-medium text-gray-900">Supr/Backspace</span>{" "}
              borra la selección.
            </li>
            <li>• Doble clic en zona para editar título.</li>
            <li>• Rueda: zoom · Clic medio: pan.</li>
            <li>
              • <span className="font-medium text-gray-900">Ctrl/Cmd+Z</span>{" "}
              deshacer ·{" "}
              <span className="font-medium text-gray-900">
                Ctrl+Y / Ctrl/Cmd+Shift+Z
              </span>{" "}
              rehacer.
            </li>
            <li>
              • Activa el{" "}
              <span className="font-medium text-red-600">modo borrar</span> y
              toca elementos para eliminarlos.
            </li>
            <li>
              • <span className="font-medium text-gray-900">Esc</span> sale del
              modo borrar.
            </li>
          </ul>
          <div className="absolute -top-1 right-4 h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
        </div>
      )}
    </div>
  );
}
