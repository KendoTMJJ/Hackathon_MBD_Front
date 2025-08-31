import { Panel } from "@xyflow/react";

type Props = {
  sidebarOpen: boolean;
  toolbarOpen: boolean;
  onToggleSidebar: () => void;
  onToggleToolbar: () => void;
  onOpenShare: () => void;
  onOpenInfo: () => void;
};

export default function CanvasActionsPanel({
  sidebarOpen,
  toolbarOpen,
  onToggleSidebar,
  onToggleToolbar,
  onOpenShare,
  onOpenInfo,
}: Props) {
  return (
    <Panel position="top-right">
      <div className="flex gap-2 rounded-md border border-white/10 bg-[#0f1115]/90 p-2">
        <button
          onClick={onToggleSidebar}
          className="rounded-md border border-white/10 bg-[#171727] px-3 py-2 text-xs text-white hover:brightness-110"
        >
          {sidebarOpen ? "Ocultar tecnologías" : "Mostrar tecnologías"}
        </button>
        <button
          onClick={onToggleToolbar}
          className="rounded-md border border-white/10 bg-[#171727] px-3 py-2 text-xs text-white hover:brightness-110"
        >
          {toolbarOpen ? "Ocultar toolbar" : "Mostrar toolbar"}
        </button>
        <button
          onClick={onOpenShare}
          className="rounded-md border border-white/10 bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700"
        >
          Compartir
        </button>
        <button
          onClick={onOpenInfo}
          className="rounded-md border border-white/10 bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700"
        >
          Información
        </button>
      </div>
    </Panel>
  );
}
