// src/hooks/useCollab.ts
import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { useDocumentStore } from "./useDocument";
import { createAuthedSocket } from "../lib/socket";

/** Presencia remota */
export type Presence = {
  userSub: string;
  kind: "user" | "guest";
  cursor?: { x: number; y: number };
  selection?: any;
};

/** Estado de colaboración */
export interface CollaborationState {
  snapshot: { data: any; version: number } | null;
  permission: "read" | "edit" | null;
  sendChange: (ops: any) => void;
  sendPresence: (presence: {
    cursor?: { x: number; y: number };
    selection?: any;
  }) => void;
  peers: Record<string, Presence>;
}

const AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE as string;

/** Throttle simple (ms) */
function throttle<T extends (...args: any[]) => void>(fn: T, wait = 80): T {
  let last = 0;
  let timer: any;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer);
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  } as T;
}

export function useCollab(documentId?: string): CollaborationState {
  const { getAccessTokenSilently } = useAuth0();
  const sref = useRef<Socket | null>(null);

  const [peers, setPeers] = useState<Record<string, Presence>>({});
  const [snapshot, setSnapshot] = useState<{
    data: any;
    version: number;
  } | null>(null);
  const [permission, setPermission] = useState<"read" | "edit" | null>(null);

  // Acceso directo a Zustand (sin usar hook dentro del efecto)
  const getStore = useDocumentStore.getState;
  const setDoc = useDocumentStore.getState().setDoc;

  // Última presencia enviada (para re-emitir en reconexiones e inmediatamente tras join)
  const lastPresence = useRef<{
    cursor?: { x: number; y: number };
    selection?: any;
  }>({});

  /** Conexión + join */
  useEffect(() => {
    if (!documentId) return;

    let closed = false;

    (async () => {
      // 1) JWT
      const jwt = await getAccessTokenSilently({
        authorizationParams: { audience: AUDIENCE },
      });

      // 2) conectar socket
      const s = createAuthedSocket(jwt);
      sref.current = s;

      s.on("connect", () => {
        if (closed) return;

        // 3) join
        s.emit("join", { documentId }, (res: any) => {
          if (closed) return;
          if (!res?.ok) return;

          // Snapshot/permission del server
          const snap = res.snapshot || null;
          setSnapshot(snap);
          setPermission(res.permission || "edit");

          // Hidratar el store inmediatamente para que ReactFlow pinte YA
          const current = getStore().doc;
          if (current) {
            setDoc({
              ...current,
              data: snap?.data ?? current.data,
              version: snap?.version ?? current.version,
            });
          }

          // Presencia inicial (aunque el usuario aún no mueva el mouse)
          const p = lastPresence.current || {};
          s.emit("presence", { documentId, ...p, timestamp: Date.now() });
        });
      });

      // 4) presencia
      s.on("presence:joined", (p: Presence) => {
        setPeers((prev) => ({ ...prev, [p.userSub]: p }));
      });

      s.on("presence", (p: Presence) => {
        setPeers((prev) => ({
          ...prev,
          [p.userSub]: { ...(prev[p.userSub] || {}), ...p },
        }));
      });

      s.on("presence:left", (p: Presence) => {
        setPeers((prev) => {
          const next = { ...prev };
          delete next[p.userSub];
          return next;
        });
      });

      // 5) cambios remotos — hidratar store (fuente de verdad del canvas)
      s.on(
        "change",
        (msg: {
          version: number;
          ops: any;
          actor: string;
          timestamp?: number;
        }) => {
          const current = getStore().doc;
          if (!current) return;

          const next = { ...current, version: msg.version };
          if (msg.ops?.nodes)
            next.data = { ...(next.data ?? {}), nodes: msg.ops.nodes };
          if (msg.ops?.edges)
            next.data = { ...(next.data ?? {}), edges: msg.ops.edges };
          if (typeof msg.ops?.title === "string")
            (next as any).title = msg.ops.title;

          setDoc(next);
          // Mantén el snapshot alineado para clientes que lo lean
          setSnapshot((prev) => {
            const base = prev ?? { data: { nodes: [], edges: [] }, version: 0 };
            const snext = {
              ...base,
              version: msg.version,
              data: { ...(base.data ?? {}) },
            };
            if (msg.ops?.nodes) snext.data.nodes = msg.ops.nodes;
            if (msg.ops?.edges) snext.data.edges = msg.ops.edges;
            if (typeof msg.ops?.title === "string")
              (snext as any).title = msg.ops.title;
            return snext;
          });
        }
      );

      // 6) reconexión — reemitir presencia
      s.io.on("reconnect", () => {
        const p = lastPresence.current || {};
        s.emit("presence", { documentId, ...p, timestamp: Date.now() });
      });

      s.on("connect_error", (e) => {
        console.warn("[collab] connect_error", e.message);
      });

      s.on("disconnect", () => {
        if (!closed) console.warn("[collab] disconnected");
      });
    })();

    return () => {
      closed = true;
      try {
        sref.current?.disconnect();
      } catch {}
      sref.current = null;
      setSnapshot(null);
      setPermission(null);
      setPeers({});
    };
  }, [documentId, getAccessTokenSilently]);

  /** Enviar cambio (patch) */
  const sendChange = useCallback(
    (ops: any) => {
      if (!documentId || !sref.current) return;
      // Usa la versión del store (si existe) o la del snapshot
      const current = getStore().doc;
      const version = current?.version ?? snapshot?.version ?? 0;
      sref.current.emit("change", { documentId, version, ops });
    },
    [documentId, snapshot]
  );

  /** Enviar presencia (throttle interno) */
  const _sendPresence = useCallback(
    (p: { cursor?: { x: number; y: number }; selection?: any }) => {
      if (!documentId || !sref.current) return;
      lastPresence.current = p;
      sref.current.emit("presence", { documentId, ...p });
    },
    [documentId]
  );

  const sendPresence = useRef(throttle(_sendPresence, 80)).current;

  return { snapshot, permission, sendChange, sendPresence, peers };
}
