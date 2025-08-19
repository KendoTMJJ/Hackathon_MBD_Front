import { Home, Save, FilePlus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
  /** Volver al Home (si no se provee, navega a "/") */
  onBack?: () => void;

  /** Guardar (si hay documentId) o crear (si es borrador) */
  onSave: () => void;
  saving?: boolean;

  /** true cuando NO hay documentId y SÍ hay templateId en la URL */
  canUpdateTemplate?: boolean;

  /** PATCH a /templates/:id */
  onUpdateTemplate?: () => void;
  updatingTemplate?: boolean;

  /** Si es borrador mostramos "Crear", si no "Guardar" */
  isDraft?: boolean;
};

export default function Toolbar({
  onBack,
  onSave,
  saving,
  canUpdateTemplate,
  onUpdateTemplate,
  updatingTemplate,
  isDraft,
}: Props) {
  const nav = useNavigate();

  // Botón base con misma estética del Header
  const btnBase =
    "rounded-[10px] border border-[#313138] bg-[#2a2a2f] p-2 text-white hover:border-[#3a3a41] focus:outline-none focus:ring-1 focus:ring-[#3a3a41] disabled:opacity-50";

  const handleBrandClick = () => {
    if (onBack) return onBack();
    nav("/");
  };

  return (
    <header className="flex items-center justify-between border-b border-[#313138] bg-[#151517] px-4 py-3">
      {/* Marca / Inicio (igual estilo que Header) */}
      <div
        className="flex cursor-pointer items-center gap-2"
        onClick={handleBrandClick}
        aria-label="Home"
        title="Inicio"
      >
        <span className="grid h-7 w-7 place-items-center select-none rounded-md bg-[#ec1e79] font-extrabold text-white">
          Bl
        </span>
        <span className="font-semibold tracking-tight text-white">
          Black Hat
        </span>

        {/* Botón Home adicional (opcional). Si prefieres solo la marca de la izquierda, puedes quitarlo.
        <button
          onClick={handleBrandClick}
          className={btnBase}
          title="Inicio"
          aria-label="Inicio"
        >
          <Home size={18} />
          <span className="sr-only">Inicio</span>
        </button> */}
      </div>

      {/* Acciones principales (alineación y espaciado como en Header) */}
      <div className="flex items-center gap-2">
        {/* Guardar / Crear (mismo look & feel del botón del Header) */}
        <button
          onClick={onSave}
          disabled={!!saving}
          className={btnBase}
          title={isDraft ? "Crear documento" : "Guardar documento"}
          aria-label={isDraft ? "Crear documento" : "Guardar documento"}
        >
          {isDraft ? <FilePlus size={18} /> : <Save size={18} />}
          <span className="sr-only">
            {saving ? "Guardando…" : isDraft ? "Crear" : "Guardar"}
          </span>
        </button>

        {/* Actualizar plantilla del catálogo (mismo estilo visual) */}
        {canUpdateTemplate && (
          <button
            onClick={onUpdateTemplate}
            disabled={!!updatingTemplate}
            className={btnBase}
            title="Actualizar plantilla del catálogo"
            aria-label="Actualizar plantilla del catálogo"
          >
            <RefreshCw size={18} />
            <span className="sr-only">
              {updatingTemplate ? "Actualizando…" : "Actualizar plantilla"}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
