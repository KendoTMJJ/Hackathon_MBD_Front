import { Eye } from "lucide-react";
import type { CanvasActionsPanelProps } from "./props/props";

export default function CanvasActionsPanel({
  toolbarOpen,
  onShowTools,
}: CanvasActionsPanelProps & { onShowTools?: () => void }) {
  if (toolbarOpen) return null;

  return (
    <button
      onClick={onShowTools}
      className="fixed top-4 right-4 z-50 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      title="Mostrar herramientas"
    >
      <Eye size={20} />
    </button>
  );
}
