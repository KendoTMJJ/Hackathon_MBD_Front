import { Save, FilePlus, RefreshCw, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type ViewProps from "./props/props";

export default function Toolbar({
  onBack,
  onSave,
  saving,
  canUpdateTemplate,
  onUpdateTemplate,
  updatingTemplate,
  isDraft,

  isEdgeStyleBarVisible,
  onToggleEdgeStyleBar,

  isCanvasActionsPanelVisible,
  onToggleCanvasActionsPanel,
}: ViewProps) {
  const nav = useNavigate();

  const btnBase =
    "rounded-lg border p-3 text-white transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <header className="flex items-center justify-between border-b border-[#313138] bg-[#151517] px-4 py-2.5 shadow-md relative z-50">
      {/* Marca / Inicio */}
      <div className="flex items-center gap-4">
        <div
          className="flex cursor-pointer items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          onClick={() => (onBack ? onBack() : nav("/"))}
          aria-label="Home"
          title="Volver al inicio"
        >
          <span className="grid h-8 w-10 place-items-center select-none rounded-md bg-gradient-to-br from-[#ec1e79] to-[#ff5e9a] font-extrabold text-white shadow-lg">
            BHA
          </span>
          <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Black Hat Archetype
          </span>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-[#313138]"></div>

        {/* Estado del documento */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              isDraft
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-green-500/20 text-green-300 border border-green-500/30"
            }`}
          >
            {isDraft ? "Borrador" : "Guardado"}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Botón de configuración de conexiones */}
        <button
          onClick={onToggleEdgeStyleBar}
          className={`${btnBase} ${
            isEdgeStyleBarVisible
              ? "border-blue-500/50 bg-blue-500/20 ring-2 ring-blue-500/30"
              : "border-[#313138] bg-[#2a2a2f] hover:border-[#3a3a41] hover:bg-[#323238]"
          }`}
          title="Configurar estilos de conexión"
        >
          <Settings size={18} />
          <span className="text-sm hidden sm:inline">Conexiones</span>
        </button>

        <button
          onClick={onToggleCanvasActionsPanel}
          className={`${btnBase} ${
            isCanvasActionsPanelVisible
              ? "border-blue-500/50 bg-blue-500/20 ring-2 ring-blue-500/30"
              : "border-[#313138] bg-[#2a2a2f] hover:border-[#3a3a41] hover:bg-[#323238]"
          }`}
          title="Configurar estilos de conexión"
        >
          <Settings size={18} />
          <span className="text-sm hidden sm:inline">Vista</span>
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-[#313138] mx-1"></div>

        {/* Botón de guardar/crear */}
        <button
          onClick={onSave}
          disabled={!!saving}
          className={`${btnBase} ${
            saving
              ? "border-blue-500/50 bg-blue-500/20 cursor-wait"
              : "border-emerald-600 bg-emerald-700 hover:bg-emerald-600 hover:border-emerald-500 active:bg-emerald-700 shadow-lg hover:shadow-emerald-700/20"
          }`}
          title={isDraft ? "Crear documento" : "Guardar documento"}
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : isDraft ? (
            <FilePlus size={18} />
          ) : (
            <Save size={18} />
          )}
          <span className="text-sm hidden sm:inline">
            {isDraft ? "Crear" : "Guardar"}
          </span>
        </button>

        {/* Botón de actualizar plantilla */}
        {canUpdateTemplate && (
          <button
            onClick={onUpdateTemplate}
            disabled={!!updatingTemplate}
            className={`${btnBase} ${
              updatingTemplate
                ? "border-purple-500/50 bg-purple-500/20 cursor-wait"
                : "border-purple-600 bg-purple-700 hover:bg-purple-600 hover:border-purple-500 active:bg-purple-700 shadow-lg hover:shadow-purple-700/20"
            }`}
            title="Actualizar plantilla del catálogo"
          >
            {updatingTemplate ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <RefreshCw size={18} />
            )}
            <span className="text-sm hidden sm:inline">Actualizar</span>
          </button>
        )}

        {/* Información de estado */}
        <div className="ml-2 flex items-center">
          <div className="text-xs text-gray-400 px-2 py-1 rounded border border-gray-700 bg-gray-800/50 hidden md:block">
            {saving && "Guardando..."}
            {updatingTemplate && "Actualizando..."}
            {!saving && !updatingTemplate && "Listo"}
          </div>
        </div>
      </div>
    </header>
  );
}
