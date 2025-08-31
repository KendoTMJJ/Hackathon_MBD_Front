import { Panel } from "@xyflow/react";
import {
  Layout,
  Settings,
  Share2,
  Info,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import type { CanvasActionsPanelProps } from "./props/props";

export default function CanvasActionsPanel({
  open,
  onClose,
  sidebarOpen,
  toolbarOpen,
  onToggleSidebar,
  onToggleToolbar,
  onOpenShare,
  onOpenInfo,
}: CanvasActionsPanelProps) {
  if (!open) return null;
  return (
    <Panel position="top-right" className="z-40">
      <div className="flex flex-col gap-2 rounded-lg border border-gray-600 bg-gray-900/80 backdrop-blur-sm p-2 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-medium text-white/80">
            Estilos de conexión
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
        {/* Botón de tecnologías */}
        <div className="relative group">
          <button
            onClick={onToggleSidebar}
            className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm transition-all duration-150 ${
              sidebarOpen
                ? "bg-blue-500/20 text-blue-300"
                : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
            }`}
            aria-label={
              sidebarOpen ? "Ocultar tecnologías" : "Mostrar tecnologías"
            }
          >
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span>{sidebarOpen ? "Ocultar" : "Tecnologías"}</span>
            </div>
            {sidebarOpen ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Botón de herramientas */}
        <div className="relative group">
          <button
            onClick={onToggleToolbar}
            className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm transition-all duration-150 ${
              toolbarOpen
                ? "bg-purple-500/20 text-purple-300"
                : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
            }`}
            aria-label={
              toolbarOpen ? "Ocultar herramientas" : "Mostrar herramientas"
            }
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>{toolbarOpen ? "Ocultar" : "Herramientas"}</span>
            </div>
            {toolbarOpen ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Separador sutil */}
        <div className="border-t border-gray-700/50 my-1"></div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={onOpenShare}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs text-gray-300 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
            aria-label="Compartir"
          >
            <Share2 className="h-3 w-3" />
            <span>Compartir</span>
          </button>

          <button
            onClick={onOpenInfo}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs text-gray-300 hover:bg-green-500/20 hover:text-green-300 transition-colors"
            aria-label="Información"
          >
            <Info className="h-3 w-3" />
            <span>Info</span>
          </button>
        </div>
      </div>
    </Panel>
  );
}
