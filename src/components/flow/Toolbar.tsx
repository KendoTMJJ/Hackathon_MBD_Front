import {
  Save,
  FilePlus,
  RefreshCw,
  Download,
  Eye,
  Share2,
  Info,
  // ImageIcon,
} from "lucide-react";
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
  hasPendingChanges = false,

  isCanvasActionsPanelVisible,
  onToggleCanvasActionsPanel,
  onToggleTools,

  onOpenShare,
  onOpenInfo,

  onExportPdf,
}: // onExportImg,
ViewProps) {
  const nav = useNavigate();

  const btnBase =
    "flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors text-white";

  const ghostBtn =
    "border border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 shadow-sm";

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 shadow-md relative z-50">
      {/* Marca / Inicio */}
      <div className="flex items-center gap-4">
        <div
          className="flex cursor-pointer items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          onClick={() => (onBack ? onBack() : nav("/"))}
          aria-label="Home"
          title="Volver al inicio"
        >
          <img
            src="/images/logo.png"
            alt="Black Hat Archetype"
            className="h-11 object-contain rounded-lg"
          />
          <span className="font-bold tracking-tight text-lg text-gray-900">
            Black Hat Archetype
          </span>
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300" />
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Estado: guardado / cambios / borrador / guardando */}
        <div
          className={[
            "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border shadow-sm",
            saving
              ? "bg-blue-100 text-blue-800 border-blue-300"
              : hasPendingChanges
              ? "bg-amber-100 text-amber-900 border-amber-300"
              : isDraft
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-green-100 text-green-800 border-green-300",
          ].join(" ")}
          title={
            saving
              ? "Guardando…"
              : hasPendingChanges
              ? "Tienes cambios sin guardar"
              : isDraft
              ? "Borrador"
              : "Sin cambios pendientes"
          }
        >
          <span
            className={[
              "inline-block h-2.5 w-2.5 rounded-full",
              saving
                ? "bg-blue-500 animate-pulse"
                : hasPendingChanges
                ? "bg-amber-500"
                : isDraft
                ? "bg-amber-500"
                : "bg-green-500",
            ].join(" ")}
          />
          {saving
            ? "Guardando…"
            : hasPendingChanges
            ? "Cambios sin guardar"
            : isDraft
            ? "Borrador"
            : "Sin cambios"}
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300 mx-2" />

        {/* Guardar / Crear */}
        <button
          onClick={onSave}
          disabled={!!saving}
          className={[
            btnBase,
            saving
              ? "border border-blue-300 bg-blue-200 text-blue-700 cursor-wait shadow-sm"
              : hasPendingChanges
              ? "border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg"
              : "border border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 shadow-sm",
          ].join(" ")}
          title={isDraft ? "Crear documento" : "Guardar documento"}
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isDraft ? (
            <FilePlus size={18} />
          ) : (
            <Save size={18} />
          )}
          <span className="hidden sm:inline">
            {isDraft ? "Crear" : "Guardar"}
          </span>
        </button>

        {/* Exportar PDF */}
        <button
          onClick={onExportPdf}
          className={[btnBase, ghostBtn].join(" ")}
          title="Exportar reporte de seguridad en PDF"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Exportar</span>
        </button>

        {/* <button
          onClick={onExportImg}
          className={[btnBase, ghostBtn].join(" ")}
          title="Exportar imagen del diagrama (PNG)"
        >
          <ImageIcon size={18} />
          <span className="hidden sm:inline">Exportar PNG</span>
        </button> */}

        {/* Actualizar plantilla (modo plantilla) */}
        {canUpdateTemplate && (
          <button
            onClick={onUpdateTemplate}
            disabled={!!updatingTemplate}
            className={[
              btnBase,
              updatingTemplate
                ? "border border-purple-300 bg-purple-200 text-purple-700 cursor-wait shadow-sm"
                : "border border-purple-600 bg-purple-600 text-white hover:bg-purple-700 hover:border-purple-700 active:bg-purple-800 shadow-md hover:shadow-lg",
            ].join(" ")}
            title="Actualizar plantilla del catálogo"
          >
            {updatingTemplate ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <RefreshCw size={18} />
            )}
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        )}

        {/* Compartir */}
        <button
          onClick={onOpenShare}
          className={[btnBase, ghostBtn].join(" ")}
          aria-label="Compartir"
          title="Compartir"
        >
          <Share2 size={20} />
        </button>

        {/* Información */}
        <button
          onClick={onOpenInfo}
          className={[btnBase, ghostBtn].join(" ")}
          aria-label="Información"
          title="Información relevante"
        >
          <Info size={20} />
        </button>

        {/* Vista / Panel de acciones del canvas */}
        <button
          onClick={() => {
            onToggleCanvasActionsPanel?.();
            onToggleTools?.();
          }}
          className={[
            btnBase,
            isCanvasActionsPanelVisible
              ? "border border-blue-500 bg-blue-100 text-blue-700 ring-2 ring-blue-500/20 shadow-sm"
              : ghostBtn,
          ].join(" ")}
          title="Configurar vista del canvas"
        >
          <Eye size={20} />
        </button>
      </div>
    </header>
  );
}
