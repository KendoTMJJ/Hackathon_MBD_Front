// src/hooks/useCollabAdapter.ts
import { useCollab } from "./useCollab";
import { useCollabGuest } from "./useCollabGuest";

export interface CollabAdapter {
  snapshot: any;
  permission: "read" | "edit" | undefined;
  sendChange: (patch: any) => void;
  sendPresence: (presence: any) => void;
  peers: Record<string, any>;
  connected: boolean;
  error?: string;
}

/**
 * Adaptador unificado para colaboración que funciona tanto para usuarios
 * autenticados como para invitados con links compartidos
 */
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

  // Hook de colaboración para invitados
  const guestResult = useCollabGuest(
    documentId || "",
    opts?.sharedToken || "",
    opts?.password
  );

  // Hook de colaboración normal
  const normalResult = useCollab(documentId);

  if (isShared && documentId && opts?.sharedToken) {
    return {
      snapshot: guestResult.snapshot,
      permission: guestResult.permission,
      sendChange: guestResult.sendChange,
      sendPresence: guestResult.sendPresence,
      peers: guestResult.peers || {},
      connected: Boolean(guestResult.snapshot),
      error: undefined, // Podrías añadir manejo de errores aquí
    };
  }

  if (documentId) {
    return {
      snapshot: null, // Los documentos normales no usan snapshot colaborativo
      permission: "edit" as const,
      sendChange: normalResult?.sendChange || (() => {}),
      sendPresence: normalResult?.sendPresence || (() => {}),
      peers: normalResult?.peers || {},
      connected: Boolean(normalResult?.sendChange),
      error: undefined,
    };
  }

  // Modo borrador o sin documento
  return {
    snapshot: null,
    permission: "edit" as const,
    sendChange: () => {},
    sendPresence: () => {},
    peers: {},
    connected: false,
  };
}
