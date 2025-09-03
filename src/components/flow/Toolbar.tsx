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
    "rounded-lg border p-3 text-sm transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium";

  return (
    <header className="flex items-center justify-between border-b border-[#313138] bg-white px-4 py-2.5 shadow-md relative z-50">
      {/* Marca / Inicio */}
      <div className="flex items-center gap-4">
        <div
          className="flex cursor-pointer items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          onClick={() => (onBack ? onBack() : nav("/"))}
          aria-label="Home"
          title="Volver al inicio"
        >
          <span className="grid h-8 w-10 place-items-center select-none rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 font-bold text-white shadow-sm">
            BHA
          </span>
          <span className="font-bold tracking-tight text-lg text-gray-900">
            Black Hat Archetype
          </span>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300"></div>

        {/* Estado del documento */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              isDraft
                ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
                : "bg-green-100 text-green-800 border border-green-300 shadow-sm"
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
              ? "border-blue-500 bg-blue-100 text-blue-700 ring-2 ring-blue-500/20 shadow-sm"
              : "border-gray-300 bg-white text-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 shadow-sm"
          }`}
          title="Configurar estilos de conexión"
        >
          <Settings size={18} />
          <span className="hidden sm:inline">Conexiones</span>
        </button>

        <button
          onClick={onToggleCanvasActionsPanel}
          className={`${btnBase} ${
            isCanvasActionsPanelVisible
              ? "border-blue-500 bg-blue-100 text-blue-700 ring-2 ring-blue-500/20 shadow-sm"
              : "border-gray-300 bg-white text-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 shadow-sm"
          }`}
          title="Configurar vista del canvas"
        >
          <Settings size={18} />
          <span className="hidden sm:inline">Vista</span>
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300 mx-2"></div>

        {/* Botón de guardar/crear */}
        <button
          onClick={onSave}
          disabled={!!saving}
          className={`${btnBase} ${
            saving
              ? "border-blue-300 bg-blue-200 text-blue-700 cursor-wait shadow-sm"
              : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg"
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
          <span className="hidden sm:inline">
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
                ? "border-purple-300 bg-purple-200 text-purple-700 cursor-wait shadow-sm"
                : "border-purple-600 bg-purple-600 text-white hover:bg-purple-700 hover:border-purple-700 active:bg-purple-800 shadow-md hover:shadow-lg"
            }`}
            title="Actualizar plantilla del catálogo"
          >
            {updatingTemplate ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <RefreshCw size={18} />
            )}
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        )}

        {/* Información de estado */}
        <div className="ml-2 flex items-center">
          <div className="text-xs text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm hidden md:block">
            {saving && "Guardando..."}
            {updatingTemplate && "Actualizando..."}
            {!saving && !updatingTemplate && "Listo"}
          </div>
        </div>
      </div>
    </header>
  );
}
