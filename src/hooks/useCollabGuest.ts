// src/hooks/useCollabGuest.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useDocumentStore } from "./useDocument"; // 👈 importa el store

export type Presence = {
  userSub: string;
  kind: "user" | "guest";
  cursor?: { x: number; y: number };
  selection?: any;
  id?: string;
};

export interface CollabGuestState {
  snapshot: { data: any; version: number } | null;
  permission: "read" | "edit";
  peers: Record<string, Presence>;
  connected: boolean;
  error: string | null;
  sendChange: (ops: any) => void;
  sendPresence: (p: {
    cursor?: { x: number; y: number };
    selection?: any;
  }) => void;
}

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, "") || "";

export function useCollabGuest(
  documentId: string,
  sharedToken: string,
  password?: string
): CollabGuestState {
  const sref = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<{
    data: any;
    version: number;
  } | null>(null);
  const [permission, setPermission] = useState<"read" | "edit">("read");
  const [peers, setPeers] = useState<Record<string, Presence>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastPresence = useRef<{
    cursor?: { x: number; y: number };
    selection?: any;
  }>({});

  // 👇 acceso directo al store (sin hook dentro de efectos)
  const setDoc = useDocumentStore.getState().setDoc;
  const getDoc = useDocumentStore.getState;

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
      socket.emit("change", {
        documentId,
        version,
        ops,
        timestamp: Date.now(),
      });
    },
    [documentId, permission, snapshot]
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
          const snap = res.snapshot ?? null;
          setSnapshot(snap);
          if (res.permission) setPermission(res.permission);

          // ✅ hidrata el store para que ReactFlow pinte YA
          const current = getDoc().doc;
          if (current) {
            setDoc({
              ...current,
              data: snap?.data ?? current.data,
              version: snap?.version ?? current.version,
            });
          } else {
            setDoc({
              id: documentId,
              title: "",
              kind: "diagram",
              data: snap?.data ?? { nodes: [], edges: [] },
              version: snap?.version ?? 0,
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

    // ✅ CAMBIOS REMOTOS → actualizar snapshot y store
    s.on("change", (msg: { version: number; ops: any; actor: string }) => {
      setSnapshot((prev) => {
        const base = prev ?? { data: { nodes: [], edges: [] }, version: 0 };
        const next = {
          ...base,
          version: msg.version,
          data: { ...(base.data ?? {}) },
        };

        if (msg.ops?.nodes) next.data.nodes = msg.ops.nodes;
        if (msg.ops?.edges) next.data.edges = msg.ops.edges;
        if (typeof msg.ops?.title === "string")
          (next as any).title = msg.ops.title;

        // hidratar store inmediatamente (sin depender de FlowCanvas useEffect)
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

    // PRESENCIA
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

    s.on("document:error", (err: any) => {
      if (closed) return;
      console.error("Document error:", err);
      setError(err.message || "Error en el documento");
    });

    s.on("permission:changed", (newPermission: "read" | "edit") => {
      if (closed) return;
      setPermission(newPermission);
    });

    return () => {
      closed = true;
      try {
        if (s.connected) s.emit("leave", { documentId });
        s.disconnect();
      } catch (err) {
        console.error("Error disconnecting socket:", err);
      }
    };
  }, [documentId, sharedToken, password, setDoc]);

  return {
    snapshot,
    permission,
    sendChange,
    sendPresence,
    peers,
    connected,
    error,
  };
}
