/*

// src/hooks/useCollabAdapter.ts
import { useCollab } from "./useCollab";
import { useCollabGuest } from "./useCollabGuest";
import type { SheetMsg } from "./useCollabGuest";


export interface CollabAdapter {
  snapshot: any;
  permission: "read" | "edit" | undefined;
  sendChange: (patch: any) => void;
  sendPresence: (presence: any) => void;
  peers: Record<string, any>;
  connected: boolean;
  error?: string;

  // canal por hoja
  sendSheetChange?: (sheetId: string, nodes: any[], edges: any[], baseVersion?: number) => void;
  onRemoteSheetChange?: (cb: (msg: SheetMsg) => void) => () => void;
}
 

export function useCollabAdapter(
  documentId: string | undefined,
  opts?: {
    sharedToken?: string;
    password?: string;
    mode?: "normal" | "shared";
  }
): CollabAdapter {
  const isShared = Boolean(
    opts?.mode === "shared" && opts?.sharedToken && documentId
  );

  // Invitados (link compartido)
  const guest = isShared
    ? useCollabGuest(documentId || "", opts?.sharedToken || "", opts?.password)
    : null;

  // Usuarios autenticados
  const normal = !isShared ? useCollab(documentId) : null;

  if (isShared && guest) {
    return {
      snapshot: guest.snapshot,
      permission: guest.permission,
      sendChange: guest.sendChange,
      sendPresence: guest.sendPresence,
      peers: guest.peers || {},
      connected: !!guest.connected,
      error: guest.error || undefined,
      
      sendSheetChange: guest.sendSheetChange,
      onRemoteSheetChange: guest.onRemoteSheetChange,
    };
  }

if (documentId && normal) {
  return {
    snapshot: normal.snapshot,
    permission: (normal.permission ?? undefined) as "read" | "edit" | undefined,
    sendChange: normal.sendChange,
    sendPresence: normal.sendPresence,
    peers: normal.peers || {},
    connected: normal.permission != null,
    error: undefined,

    // podrían no existir en 'useCollab' aún
    sendSheetChange: (normal as any)?.sendSheetChange,
    onRemoteSheetChange: (normal as any)?.onRemoteSheetChange,
  };
}

  // Sin documento
  return {
    snapshot: null,
    permission: "edit",
    sendChange: () => {},
    sendPresence: () => {},
    peers: {},
    connected: false,
  };
}
*/