// src/hooks/useCollabGuest.ts
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

export type SheetMsg = {
  sheetId: string;
  nodes: any[];
  edges: any[];
  version?: number;
  actor?: string;
  timestamp?: number;
};

export interface CollabGuestState {
  snapshot: Snapshot | null;
  permission: "read" | "edit";
  peers: Record<string, Presence>;
  connected: boolean;
  error: string | null;

  sendChange: (ops: any) => void;
  sendPresence: (p: { cursor?: { x: number; y: number }; selection?: any }) => void;

  // Hoja (opcional)
  sendSheetChange?: (sheetId: string, nodes: any[], edges: any[], baseVersion?: number) => void;
  onRemoteSheetChange?: (cb: (msg: SheetMsg) => void) => () => void;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, "") || "http://localhost:3000";

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

  const lastPresence = useRef<{ cursor?: { x: number; y: number }; selection?: any }>({});

  // acceso directo al store global de documento
  const setDoc = useDocumentStore.getState().setDoc;
  const getDoc = useDocumentStore.getState;

  // callback para notificar cambios de hoja
  const sheetCb = useRef<((msg: SheetMsg) => void) | null>(null);

  // === presencia (cliente -> server) ===
  const sendPresence = useCallback((p: { cursor?: { x: number; y: number }; selection?: any }) => {
    const s = sref.current;
    if (!s || !s.connected) return;
    lastPresence.current = p;
    s.emit("presence", { documentId, ...p, timestamp: Date.now() });
  }, [documentId]);

  // === cambios de documento (cliente -> server, con ACK de versión) ===
  const sendChange = useCallback((ops: any) => {
    const s = sref.current;
    if (!s || !s.connected || permission !== "edit") return;

    const version = getDoc().doc?.version ?? snapshot?.version ?? 0;

    s.emit(
      "change",
      { documentId, version, ops, timestamp: Date.now() },
      (ack?: { ok?: boolean; version?: number }) => {
        if (!ack?.ok || typeof ack.version !== "number") return;

        // Avanza local
        const current = getDoc().doc;
        if (current) {
          const next = { ...current, version: ack.version, data: { ...(current.data ?? {}) } };
          if (ops?.nodes) next.data.nodes = ops.nodes;
          if (ops?.edges) next.data.edges = ops.edges;
          if (typeof ops?.title === "string") (next as any).title = ops.title;
          setDoc(next);
        }

        setSnapshot((prev): Snapshot => {
          const base: Snapshot = prev ?? { data: { nodes: [], edges: [] }, version: 0 };
          const snext: Snapshot = { version: ack.version!, data: { ...(base.data ?? {}) } };
          if (ops?.nodes) snext.data.nodes = ops.nodes; else snext.data.nodes = base.data?.nodes ?? [];
          if (ops?.edges) snext.data.edges = ops.edges; else snext.data.edges = base.data?.edges ?? [];
          if (typeof ops?.title === "string") (snext as any).title = ops.title;
          return snext;
        });
      }
    );
  }, [documentId, permission, snapshot, getDoc, setDoc]);

  // === ciclo de vida del socket ===
useEffect(() => {
  if (!documentId || !sharedToken) return;

  let closed = false;
  setError(null);
  setConnected(false);

  const s = io(`${API_BASE}/collab`, {
    // ⚠️ NO fuerces sólo websocket
    transports: ["websocket", "polling"],
    path: "/socket.io",
    withCredentials: true,

    auth: { sharedToken, sharedPassword: password, type: "guest" },
    query: { documentId, mode: "shared" },

    timeout: 12000,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });

  sref.current = s;

  s.on("connect", () => {
    if (closed) return;
    setConnected(true);

    s.emit("join", { documentId }, (res: any) => {
      if (closed) return;

      // 👇 deja este log unas pruebas
      console.info("[guest] join ack:", res);

      if (!res?.ok) {
        setError(res?.error || "No se pudo acceder al documento");
        return;
      }

      const snap: Snapshot | null = res.snapshot ?? null;
      setSnapshot(snap);
      if (res.permission) setPermission(res.permission); // "read" | "edit"

      // hidratar store
      const current = getDoc().doc;
      if (current) {
        setDoc({
          ...current,
          data: snap?.data ?? current.data,
          version: typeof snap?.version === "number" ? snap.version : current.version,
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
    });
  });

  s.on("disconnect", () => { if (!closed) setConnected(false); });

  s.on("connect_error", (err) => {
    if (closed) return;
    console.error("[guest] connect_error:", err?.message || err);
    // Para depurar handshake rechazado:
    console.log("[guest] auth used:", { sharedToken: !!sharedToken, hasPassword: !!password });
    setError(err.message || "Error de conexión");
    setConnected(false);
  });

  s.io.on("reconnect", () => {
    const p = lastPresence.current || {};
    s.emit("presence", { documentId, ...p, timestamp: Date.now() });
  });

  // cambios de documento
  s.on("change", (msg: { version: number; ops: any; actor: string }) => {
    setSnapshot((prev): Snapshot => {
      const base: Snapshot = prev ?? { data: { nodes: [], edges: [] }, version: 0 };
      const next: Snapshot = { version: msg.version, data: { ...(base.data ?? {}) } };
      next.data.nodes = msg.ops?.nodes ?? base.data?.nodes ?? [];
      next.data.edges = msg.ops?.edges ?? base.data?.edges ?? [];

      const current = getDoc().doc;
      if (current) setDoc({ ...current, data: next.data, version: next.version });
      return next;
    });
  });

  // hoja (server -> cliente)
  s.on("sheet:snapshot", (msg: SheetMsg) => {
    sheetCb.current?.(msg);
  });

  s.on("document:error", (err: any) => !closed && setError(err?.message || "Error en documento"));
  s.on("permission:changed", (perm: "read" | "edit") => !closed && setPermission(perm));

  s.on("presence:joined", (p: Presence) => {
    if (closed) return;
    const userSub = p.userSub || `guest:${sharedToken}:${p["id"] ?? ""}`;
    setPeers(prev => ({ ...prev, [userSub]: { ...p, userSub, kind: "guest" } }));
  });
  s.on("presence:left", (p: Presence) => {
    if (closed) return;
    const userSub = p.userSub || `guest:${sharedToken}:${p["id"] ?? ""}`;
    setPeers(prev => { const next = { ...prev }; delete next[userSub]; return next; });
  });
  s.on("presence", (p: Presence) => {
    if (closed) return;
    const userSub = p.userSub || `guest:${sharedToken}:${p["id"] ?? ""}`;
    setPeers(prev => ({ ...prev, [userSub]: { ...(prev[userSub] || {}), ...p, userSub, kind: "guest" } }));
  });

  return () => {
    closed = true;
    try { if (s.connected) s.emit("leave", { documentId }); s.disconnect(); } catch {}
    sheetCb.current = null;
  };
}, [documentId, sharedToken, password, setDoc]);

  // === HOJAS (cliente -> server y callback) ===
  const sendSheetChange = useCallback(
    (sheetId: string, nodes: any[], edges: any[], baseVersion = 0) => {
      const s = sref.current; if (!s || !s.connected) return;
      s.emit("sheet:patch", { sheetId, nodes, edges, baseVersion });
    },
    []
  );

  const onRemoteSheetChange = useCallback((cb: (msg: SheetMsg) => void) => {
    sheetCb.current = cb;
    return () => { if (sheetCb.current === cb) sheetCb.current = null; };
  }, []);

  return {
    snapshot,
    permission,
    peers,
    connected,
    error,
    sendChange,
    sendPresence,
    sendSheetChange,
    onRemoteSheetChange,
  };
}
