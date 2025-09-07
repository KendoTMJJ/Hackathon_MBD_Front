// src/utils/captureCanvas.ts
import { toPng } from "html-to-image";

/**
 * Opciones para la exportación de imagen del canvas
 */
export type CaptureOptions = {
  /** Fondo del PNG exportado (por defecto blanco) */
  backgroundColor?: string;
  /** zoom para exportar (1 = 100%) */
  scale?: number;
  /** padding alrededor del diagrama (px) */
  padding?: number;
  /** callback opcional para descargar automáticamente */
  downloadFileName?: string | null; // null => no descarga, sólo devuelve dataUrl
};

/**
 * Elementos de React Flow que NO queremos dibujar en la imagen
 * (controles, minimapa, paneles flotantes, etc.)
 */
export function defaultFilter(node: HTMLElement): boolean {
  const cls = node.classList;
  // Excluir UI de React Flow y overlays tuyos
  if (
    cls.contains("react-flow__minimap") ||
    cls.contains("react-flow__controls") ||
    cls.contains("react-flow__attribution") ||
    (cls.contains("react-flow__edges") && cls.contains("is-selection")) ||
    cls.contains("no-export") || // utilidad manual
    node.getAttribute("data-no-export") === "true"
  ) {
    return false;
  }
  return true;
}

/**
 * Captura el contenedor que envuelve al ReactFlow y genera un PNG (data URL).
 * NO usa `preferCssPageSize` (eso es de jsPDF, no de html-to-image).
 */
export async function captureFlowAsPng(
  containerEl: HTMLElement,
  opts: CaptureOptions = {}
): Promise<string> {
  const padding = opts.padding ?? 16;
  const scale = opts.scale ?? 2;
  const backgroundColor = opts.backgroundColor ?? "#ffffff";

  // Tamaño real del contenedor
  const rect = containerEl.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  // Generar dataUrl
  const dataUrl = await toPng(containerEl, {
    cacheBust: true,
    backgroundColor,
    filter: defaultFilter,
    width: width + padding * 2,
    height: height + padding * 2,
    style: {
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      padding: `${padding}px`,
      background: backgroundColor,
    },
    canvasWidth: (width + padding * 2) * scale,
    canvasHeight: (height + padding * 2) * scale,
    pixelRatio: scale,
    imagePlaceholder:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8z8DwHwAFtALH6yJYVwAAAABJRU5ErkJggg==",
  });

  // Descarga automática si se pide
  if (opts.downloadFileName) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = opts.downloadFileName.endsWith(".png")
      ? opts.downloadFileName
      : `${opts.downloadFileName}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return dataUrl;
}
