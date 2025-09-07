// src/components/Flow/ExportCanvasButton.tsx
import * as React from "react";
import { ImageDown } from "lucide-react";
import { captureFlowAsPng } from "./captureCanvas";

type Props = {
  /** referencia al contenedor que envuelve al ReactFlow (no al <ReactFlow/> en sí) */
  containerRef: React.RefObject<HTMLElement>;
  className?: string;
  fileName?: string;
};

export default function ExportCanvasButton({
  containerRef,
  className = "",
  fileName = "diagrama",
}: Props) {
  const [busy, setBusy] = React.useState(false);

  const onClick = async () => {
    if (!containerRef.current || busy) return;
    try {
      setBusy(true);
      await captureFlowAsPng(containerRef.current, {
        padding: 24,
        scale: 2,
        backgroundColor: "#ffffff",
        downloadFileName: fileName,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      title="Exportar diagrama como PNG"
      className={[
        "rounded-lg px-3 py-2 text-sm transition-all duration-200",
        "text-white hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed",
        "border border-gray-200 bg-white shadow-sm hover:shadow-md",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <ImageDown size={18} />
        <span>{busy ? "Exportando…" : "PNG"}</span>
      </div>
    </button>
  );
}
