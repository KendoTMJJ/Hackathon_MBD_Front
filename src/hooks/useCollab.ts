// src/hooks/useCollab.ts
import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { useDocumentStore } from "./useDocument";
import { createAuthedSocket, setSocketAuth } from "../lib/socket";

/** Presencia remota */
export type Presence = {
  userSub: string;
  kind: "user" | "guest";
  cursor?: { x: number; y: number };
  selection?: any;
};

/** Snapshot colaborativo */
type SnapshotState = { data: any; version: number };

/** Estado del hook */
export interface CollaborationState {
  snapshot: SnapshotState | null;
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

type ChangeAck = { ok: true; version: number };

export function useCollab(documentId?: string): CollaborationState {
  const { getAccessTokenSilently } = useAuth0();
  const sref = useRef<Socket | null>(null);

  const [peers, setPeers] = useState<Record<string, Presence>>({});
  const [snapshot, setSnapshot] = useState<SnapshotState | null>(null);
  const [permission, setPermission] = useState<"read" | "edit" | null>(null);

  // Acceso directo a Zustand
  const getStore = useDocumentStore.getState;
  const setDoc = useDocumentStore.getState().setDoc;

  // Última presencia enviada (re-emitir en reconexión)
  const lastPresence = useRef<{
    cursor?: { x: number; y: number };
    selection?: any;
  }>({});

  /** Conexión + join */
  // src/hooks/useCollab.ts
  // ...
  useEffect(() => {
    if (!documentId) return;

    let closed = false;

    (async () => {
      let jwt = "";
      try {
        jwt = await getAccessTokenSilently({
          authorizationParams: { audience: AUDIENCE },
        });
      } catch (e) {
        console.warn("[collab] no se pudo obtener token:", e);
      }
      
      const s = createAuthedSocket(jwt);
      sref.current = s;

      const onConnect = () => {
        if (closed) return;
        s.emit("join", { documentId }, (res: any) => {
          if (closed) return;
          if (!res?.ok) return;

          const snap = (res.snapshot || null) as SnapshotState | null;
          setSnapshot(snap);
          setPermission((res.permission as "read" | "edit") || "edit");

          const current = getStore().doc;
          if (current) {
            setDoc({
              ...current,
              data: snap?.data ?? current.data,
              version: snap?.version ?? current.version,
            });
          }

          const p = lastPresence.current || {};
          s.emit("presence", { documentId, ...p, timestamp: Date.now() });
        });
      };

      const onPresenceJoined = (p: Presence) => {
        setPeers((prev) => ({ ...prev, [p.userSub]: p }));
      };
      const onPresence = (p: Presence) => {
        setPeers((prev) => ({
          ...prev,
          [p.userSub]: { ...(prev[p.userSub] || {}), ...p },
        }));
      };
      const onPresenceLeft = (p: Presence) => {
        setPeers((prev) => {
          const next = { ...prev };
          delete next[p.userSub];
          return next;
        });
      };
      const onChange = (msg: { version: number; ops: any; actor: string }) => {
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

        setSnapshot((prev) => {
          const base = prev ?? { data: { nodes: [], edges: [] }, version: 0 };
          const snext: SnapshotState = {
            ...base,
            version: msg.version,
            data: { ...(base.data ?? {}) },
          };
          if (msg.ops?.nodes) (snext.data as any).nodes = msg.ops.nodes;
          if (msg.ops?.edges) (snext.data as any).edges = msg.ops.edges;
          if (typeof msg.ops?.title === "string")
            (snext as any).title = msg.ops.title;
          return snext;
        });
      };

      s.on("connect", onConnect);
      s.on("presence:joined", onPresenceJoined);
      s.on("presence", onPresence);
      s.on("presence:left", onPresenceLeft);
      s.on("change", onChange);

      // 🔁 refresh de token antes de reintentar
      s.io.on("reconnect_attempt", async () => {
        try {
          const newJwt = await getAccessTokenSilently({
            authorizationParams: { audience: AUDIENCE },
          });
          setSocketAuth({ token: newJwt }); // <- debe actualizar socket.auth/io.opts.auth
        } catch (e) {
          console.warn("[collab] refresh token failed on reconnect_attempt", e);
        }
      });

      s.io.on("reconnect", () => {
        const p = lastPresence.current || {};
        s.emit("presence", { documentId, ...p, timestamp: Date.now() });
      });

      s.on("connect_error", async (e: any) => {
        console.warn("[collab] connect_error", e?.message || e);
        try {
          const newJwt = await getAccessTokenSilently({
            authorizationParams: { audience: AUDIENCE },
          });
          setSocketAuth({ token: newJwt });
        } catch (err) {
          console.warn("[collab] unable to refresh token on error:", err);
        }
      });

      s.on("disconnect", () => {
        if (!closed) console.warn("[collab] disconnected");
      });
    })();

    return () => {
      closed = true;
      try {
        const s = sref.current;
        if (s) {
          s.removeAllListeners();
          s.disconnect();
        }
      } catch {}
      sref.current = null;
      setSnapshot(null);
      setPermission(null);
      setPeers({});
    };
  }, [documentId, getAccessTokenSilently]);

  /** Enviar cambio con ACK de versión (soluciona el error de tipos) */
  const sendChange = useCallback(
    (ops: any) => {
      if (!documentId || !sref.current) return;
      const socket = sref.current;

      // Versión actual (store o snapshot)
      const current = getStore().doc;
      const version = current?.version ?? snapshot?.version ?? 0;

      socket.emit(
        "change",
        { documentId, version, ops },
        (ack: ChangeAck | undefined) => {
          if (!ack || !ack.ok) return;
          const newVersion = ack.version;

          // Avanza versión local del emisor para mantenerse en sync
          const cur = getStore().doc;
          if (cur) {
            setDoc({ ...cur, version: newVersion });
          }
          setSnapshot((prev: SnapshotState | null): SnapshotState => {
            const base: SnapshotState = prev ?? {
              data: { nodes: [], edges: [] },
              version: 0,
            };
            return { ...base, version: newVersion };
          });
        }
      );
    },
    [documentId, snapshot, getStore, setDoc]
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

  const sendPresence = useMemo(
    () => throttle(_sendPresence, 80),
    [_sendPresence]
  );

  return { snapshot, permission, sendChange, sendPresence, peers };
}
