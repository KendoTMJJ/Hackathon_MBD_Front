// props/props.ts
import type { EdgePreset } from "../edges/EdgeStylePopover";

// 👉 export nombrado (NO default)
export interface CanvasActionsPanelProps {
  open: boolean;
  onClose: () => void;
  sidebarOpen: boolean;
  toolbarOpen: boolean;
  onToggleSidebar: () => void;
  onToggleToolbar: () => void;
  onOpenShare: () => void;
  onOpenInfo: () => void;
}

// 👉 export default (para Toolbar)
export default interface ViewProps {
  onBack?: () => void;

  // permitir sync o async para evitar errores de tipo
  onSave: () => void | Promise<void>;
  saving?: boolean;

  canUpdateTemplate?: boolean;
  onUpdateTemplate?: () => void | Promise<void>;
  updatingTemplate?: boolean;

  isDraft?: boolean;

  isEdgeStyleBarVisible?: boolean;
  onToggleEdgeStyleBar?: () => void;

  isCanvasActionsPanelVisible?: boolean;
  onToggleCanvasActionsPanel?: () => void;

  // opcionales, por si querés propagar el preset desde Toolbar
  edgeStyle?: EdgePreset;
  onEdgeStyleChange?: (style: EdgePreset) => void;
}
