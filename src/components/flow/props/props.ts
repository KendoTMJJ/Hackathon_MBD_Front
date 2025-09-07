import type { EdgePreset } from "../edges/EdgeStylePopover";

export interface CanvasActionsPanelProps {
  open: boolean;
  onClose: () => void;
  // sidebarOpen: boolean;
  toolbarOpen: boolean;
  // onToggleSidebar: () => void;
  // onToggleToolbar: () => void;

  onShowTools: () => void;

  onToggleTools: () => void;
}

export default interface ViewProps {
  onBack?: () => void;

  // permitir sync o async para evitar errores de tipo
  onSave: () => void | Promise<void>;
  saving?: boolean;

  canUpdateTemplate?: boolean;
  onUpdateTemplate?: () => void | Promise<void>;
  updatingTemplate?: boolean;

  isDraft?: boolean;

  hasPendingChanges?: boolean;

  isEdgeStyleBarVisible?: boolean;
  onToggleEdgeStyleBar?: () => void;

  isCanvasActionsPanelVisible?: boolean;
  onToggleCanvasActionsPanel?: () => void;

  edgeStyle?: EdgePreset;
  onEdgeStyleChange?: (style: EdgePreset) => void;

  toolbarOpen: boolean;
  onToggleTools: () => void;

  onOpenShare: () => void;
  onOpenInfo: () => void;

  onExportPdf?: () => void; // 👈 NUEVO
  onExportImg?: () => void;
}
