import { Save, FilePlus, RefreshCw, Download, Eye, Share2, Info } from "lucide-react";
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
}: ViewProps) {
  const nav = useNavigate();

  return (
    <header className="toolbar flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 shadow-md relative z-50">
      {/* Marca / Inicio */}
      <div className="flex items-center gap-4">
        <div
          className="flex cursor-pointer items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => (onBack ? onBack() : nav("/home"))}
          aria-label="Ir al panel de trabajo"
          title="Ir al panel de trabajo"
        >
          <img src="/images/logo.png" alt="Black Hat Archetype" className="h-11 object-contain rounded-lg" />
          <span className="font-bold tracking-tight text-lg text-gray-900">Black Hat Archetype</span>
        </div>
        <div className="h-6 w-px bg-gray-300" />
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Estado */}
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
          {saving ? "Guardando…" : hasPendingChanges ? "Cambios sin guardar" : isDraft ? "Borrador" : "Sin cambios"}
        </div>

        <div className="h-6 w-px bg-gray-300 mx-2" />

        {/* Guardar / Crear */}
        <button
          onClick={onSave}
          disabled={!!saving}
          className={["capsule", saving ? "capsule--saving" : hasPendingChanges ? "capsule--primary" : ""].join(" ")}
          aria-label={isDraft ? "Crear documento" : "Guardar documento"}
          title={isDraft ? "Crear documento" : "Guardar documento"}
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isDraft ? (
            <FilePlus size={18} />
          ) : (
            <Save size={18} />
          )}
          <span className="ml-1 hidden sm:inline">{isDraft ? "Crear" : "Guardar"}</span>
        </button>

        {/* Exportar PDF */}
        <button
          onClick={onExportPdf}
          className="capsule"
          aria-label="Exportar reporte de seguridad en PDF"
          title="Exportar reporte de seguridad en PDF"
        >
          <Download size={18} />
          <span className="ml-1 hidden sm:inline">Exportar</span>
        </button>

        {/* Actualizar plantilla */}
        {canUpdateTemplate && (
          <button
            onClick={onUpdateTemplate}
            disabled={!!updatingTemplate}
            className={["capsule", updatingTemplate ? "capsule--saving" : "capsule--purple"].join(" ")}
            aria-label="Actualizar plantilla del catálogo"
            title="Actualizar plantilla del catálogo"
          >
            {updatingTemplate ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <RefreshCw size={18} />
            )}
            <span className="ml-1 hidden sm:inline">Actualizar</span>
          </button>
        )}

        {/* Compartir */}
        <button onClick={onOpenShare} className="capsule" aria-label="Compartir" title="Compartir">
          <Share2 size={20} />
        </button>

        {/* Información */}
        <button onClick={onOpenInfo} className="capsule" aria-label="Información relevante" title="Información relevante">
          <Info size={20} />
        </button>

        {/* Vista / Panel de acciones del canvas */}
        <button
          onClick={() => {
            onToggleCanvasActionsPanel?.();
            onToggleTools?.();
          }}
          className={["capsule", isCanvasActionsPanelVisible ? "ring-2 ring-white/85" : ""].join(" ")}
          aria-label="Configurar vista del canvas"
          title="Configurar vista del canvas"
        >
          <Eye size={20} />
        </button>
      </div>
    </header>
  );
}
