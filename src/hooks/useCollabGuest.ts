import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useDocumentStore } from "./useDocument";

export type Presence = {
  userSub: string;
  kind: "user" | "guest";
  cursor?: { x: number; y: number };
  selection?: any;
  id?: string;
};

type Snapshot = { data: any; version: number };

export interface CollabGuestState {
  snapshot: Snapshot | null;
  permission: "read" | "edit";
  peers: Record<string, Presence>;
  connected: boolean;
  error: string | null;
  sendChange: (ops: any) => void;
  sendPresence: (p: {
    cursor?: { x: number; y: number };
    selection?: any;
  }) => void;

  // 👇 NUEVO
  sendSheetChange?: (sheetId: string, nodes: any[], edges: any[]) => void;
  onRemoteSheetChange?: (
    cb: (msg: {
      sheetId: string;
      nodes: any[];
      edges: any[];
      actor?: string;
      timestamp?: number;
    }) => void
  ) => () => void;
}

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, "") || "";

export function useCollabGuest(
  documentId: string,
  sharedToken: string,
  password?: string
): CollabGuestState {
  const sref = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [permission, setPermission] = useState<"read" | "edit">("read");
  const [peers, setPeers] = useState<Record<string, Presence>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastPresence = useRef<{
    cursor?: { x: number; y: number };
    selection?: any;
  }>({});

  // acceso directo al store
  const setDoc = useDocumentStore.getState().setDoc;
  const getDoc = useDocumentStore.getState;

  // callback para sheet:change
  const sheetChangeCb = useRef<
    | ((msg: {
        sheetId: string;
        nodes: any[];
        edges: any[];
        actor?: string;
        timestamp?: number;
      }) => void)
    | null
  >(null);

  const sendPresence = useCallback(
    (p: { cursor?: { x: number; y: number }; selection?: any }) => {
      const socket = sref.current;
      if (!socket || !socket.connected) return;
      lastPresence.current = p;
      socket.emit("presence", { documentId, ...p, timestamp: Date.now() });
    },
    [documentId]
  );

  const sendChange = useCallback(
    (ops: any) => {
      const socket = sref.current;
      if (!socket || !socket.connected || permission !== "edit") return;

      const version = getDoc().doc?.version ?? snapshot?.version ?? 0;

      socket.emit(
        "change",
        { documentId, version, ops, timestamp: Date.now() },
        (ack?: { ok?: boolean; version?: number }) => {
          if (!ack?.ok || typeof ack.version !== "number") return;

          // Avanza localmente (el servidor no rebota al emisor)
          const current = getDoc().doc;
          if (current) {
            const next = { ...current, version: ack.version };
            if (ops?.nodes)
              next.data = { ...(next.data ?? {}), nodes: ops.nodes };
            if (ops?.edges)
              next.data = { ...(next.data ?? {}), edges: ops.edges };
            if (typeof ops?.title === "string") (next as any).title = ops.title;
            setDoc(next);
          }

          setSnapshot((prev): Snapshot => {
            const base: Snapshot = prev ?? {
              data: { nodes: [], edges: [] },
              version: 0,
            };
            const snext: Snapshot = {
              version: ack.version!,
              data: { ...(base.data ?? {}) },
            };
            if (ops?.nodes) snext.data.nodes = ops.nodes;
            else snext.data.nodes = base.data?.nodes ?? [];
            if (ops?.edges) snext.data.edges = ops.edges;
            else snext.data.edges = base.data?.edges ?? [];
            if (typeof ops?.title === "string")
              (snext as any).title = ops.title;
            return snext;
          });
        }
      );
    },
    [documentId, permission, snapshot, getDoc, setDoc]
  );

  useEffect(() => {
    if (!documentId || !sharedToken) return;

    let closed = false;
    setError(null);
    setConnected(false);

    const s = io(`${API_BASE}/collab`, {
      transports: ["websocket"],
      auth: { sharedToken, sharedPassword: password, type: "guest" },
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    sref.current = s;

    s.on("connect", () => {
      if (closed) return;
      setConnected(true);
      setError(null);

      // JOIN
      s.emit("join", { documentId }, (res: any) => {
        if (closed) return;

        if (res?.ok) {
          const snap: Snapshot | null = res.snapshot ?? null;
          setSnapshot(snap);
          if (res.permission) setPermission(res.permission);

          // hidrata store ya
          const current = getDoc().doc;
          if (current) {
            setDoc({
              ...current,
              data: snap?.data ?? current.data,
              version:
                typeof snap?.version === "number"
                  ? snap.version
                  : current.version,
            });
          } else {
            setDoc({
              id: documentId,
              title: "",
              kind: "diagram",
              data: snap?.data ?? { nodes: [], edges: [] },
              version: typeof snap?.version === "number" ? snap.version : 0,
              templateId: null,
              isArchived: false,
              createdBy: "",
              projectId: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              sheets: [],
            } as any);
          }

          // presencia inicial
          const p = lastPresence.current || {};
          s.emit("presence", { documentId, ...p, timestamp: Date.now() });
        } else {
          const errorMsg = res?.error || "No se pudo acceder al documento";
          setError(errorMsg);
          console.error("Join error:", errorMsg);
        }
      });
    });

    s.on("disconnect", () => {
      if (closed) return;
      setConnected(false);
    });

    s.on("connect_error", (err) => {
      if (closed) return;
      console.error("Socket connection error:", err);
      setError(err.message || "Error de conexión");
      setConnected(false);
    });

    s.io.on("reconnect", () => {
      const p = lastPresence.current || {};
      s.emit("presence", { documentId, ...p, timestamp: Date.now() });
    });

    // CAMBIOS REMOTOS (otros clientes)
    s.on("change", (msg: { version: number; ops: any; actor: string }) => {
      setSnapshot((prev): Snapshot => {
        const base: Snapshot = prev ?? {
          data: { nodes: [], edges: [] },
          version: 0,
        };
        const next: Snapshot = {
          version: msg.version,
          data: { ...(base.data ?? {}) },
        };
        if (msg.ops?.nodes) next.data.nodes = msg.ops.nodes;
        else next.data.nodes = base.data?.nodes ?? [];
        if (msg.ops?.edges) next.data.edges = msg.ops.edges;
        else next.data.edges = base.data?.edges ?? [];

        // hidratar store inmediatamente
        const current = getDoc().doc;
        if (current) {
          setDoc({
            ...current,
            data: next.data ?? current.data,
            version: next.version ?? current.version,
          });
        }
        return next;
      });
    });

    // HOJAS: cambios remotos
    s.on("sheet:change", (msg: any) => {
      sheetChangeCb.current?.(msg);
    });

    s.on("document:error", (err: any) => {
      if (closed) return;
      console.error("Document error:", err);
      setError(err.message || "Error en el documento");
    });

    s.on("permission:changed", (newPermission: "read" | "edit") => {
      if (closed) return;
      setPermission(newPermission);
    });

    // presencia
    s.on("presence:joined", (p: Presence) => {
      if (closed) return;
      const userSub = p.userSub || `guest:${sharedToken}:${p["id"] ?? ""}`;
      setPeers((prev) => ({
        ...prev,
        [userSub]: { ...p, userSub, kind: "guest" },
      }));
    });
    s.on("presence:left", (p: Presence) => {
      if (closed) return;
      const userSub = p.userSub || `guest:${sharedToken}:${p["id"] ?? ""}`;
      setPeers((prev) => {
        const next = { ...prev };
        delete next[userSub];
        return next;
      });
    });
    s.on("presence", (p: Presence) => {
      if (closed) return;
      const userSub = p.userSub || `guest:${sharedToken}:${p["id"] ?? ""}`;
      setPeers((prev) => ({
        ...prev,
        [userSub]: { ...(prev[userSub] || {}), ...p, userSub, kind: "guest" },
      }));
    });

    return () => {
      closed = true;
      try {
        if (s.connected) s.emit("leave", { documentId });
        s.disconnect();
      } catch (err) {
        console.error("Error disconnecting socket:", err);
      }
      sheetChangeCb.current = null;
    };
  }, [documentId, sharedToken, password, setDoc]);

  // Hoja: emisor
  const sendSheetChange = useCallback(
    (sheetId: string, nodes: any[], edges: any[]) => {
      const socket = sref.current;
      if (!socket || !socket.connected) return;
      socket.emit("sheet:change", { documentId, sheetId, nodes, edges });
    },
    [documentId]
  );

  // Hoja: suscriptor
  const onRemoteSheetChange = useCallback(
    (
      cb: (msg: {
        sheetId: string;
        nodes: any[];
        edges: any[];
        actor?: string;
        timestamp?: number;
      }) => void
    ) => {
      sheetChangeCb.current = cb;
      return () => {
        if (sheetChangeCb.current === cb) sheetChangeCb.current = null;
      };
    },
    []
  );

  return {
    snapshot,
    permission,
    sendChange,
    sendPresence,
    peers,
    connected,
    error,
    sendSheetChange,
    onRemoteSheetChange,
  };
}
