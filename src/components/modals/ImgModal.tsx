import { useEffect } from "react";
import type { imgModalProps } from "./props/props";
import { X } from "lucide-react";

export default function ImgModal({ isOpen, onClose }: imgModalProps) {
  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevenir scroll del body
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-white/20 bg-[#0f1115] text-white shadow-2xl">
        {/* Header con botón de cerrar */}
        <div className="absolute right-4 top-4 z-10">
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full bg-black/70 p-2 text-white/90 transition-all duration-200 hover:bg-red-500/90 hover:text-white backdrop-blur-sm"
            aria-label="Cerrar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenedor de la imagen */}
        <div className="relative h-[80vh] w-full overflow-hidden">
          <img
            src="/images/mapa.jpg"
            alt="Mapa de infraestructura"
            className="h-full w-full object-contain"
          />

          {/* Overlay de información (opcional) */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-white">
                Mapa de Infraestructura
              </h2>
              <p className="mt-2 text-white/80">
                Visualización completa de la arquitectura de red y distribución
                de zonas.
              </p>
            </div>
          </div>
        </div>

        {/* Footer con controles (opcional) */}
        <div className="flex items-center justify-between border-t border-white/10 bg-[#0a0c10] px-6 py-3">
          <span className="text-sm text-white/60">Mapa de infraestructura</span>
          <div className="flex gap-2">
            <button className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/20">
              Zoom +
            </button>
            <button className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/20">
              Zoom -
            </button>
            <button className="rounded-lg bg-blue-600/90 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700">
              Descargar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
