// src/context/WebSocketContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

// ===== Tipos de dominio =====
export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface DocumentChange {
  type:
    | "nodes"
    | "edges"
    | "sheet_update"
    | "sheet_create"
    | "sheet_delete"
    | "sheet_reorder"
    | "snapshot";
  data: any;
  userId: string;
  timestamp: number;
  sheetId?: string;
}

type ConnStatus = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: ConnStatus;
  users: User[];
  currentUser: User | null;

  joinDocument: (documentId: string, token?: string) => void;
  leaveDocument: () => void;

  sendChange: (change: Omit<DocumentChange, "userId" | "timestamp">) => void;
  onDocumentChange: (cb: (change: DocumentChange) => void) => () => void;

  onUserJoin: (cb: (user: User) => void) => () => void;
  onUserLeave: (cb: (userId: string) => void) => () => void;

  updateCursor: (x: number, y: number) => void;
  reconnect: () => void;

  lastError: string | null;
}

// ===== Config =====
const WebSocketContext = createContext<WebSocketContextType | null>(null);
const SOCKET_PATH = "/socket.io"; // explícito por si hay proxy/nginx
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

const USER_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#EC4899",
  "#84CC16",
  "#6366F1",
];

function keyOf(ch: Pick<DocumentChange, "type" | "sheetId">) {
  return `${ch.type}-${ch.sheetId || "main"}`;
}

// ===== Provider =====
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnStatus>("disconnected");
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const lastLocalTsByKey = useRef<Map<string, number>>(new Map());
  // recuerda el último cambio remoto aplicado por tipo/hoja
  const lastRemoteTsByKey = useRef<Map<string, number>>(new Map());

  // callbacks externos
  const changeCallbacks = useRef(new Set<(c: DocumentChange) => void>());
  const userJoinCallbacks = useRef(new Set<(u: User) => void>());
  const userLeaveCallbacks = useRef(new Set<(id: string) => void>());

  // control de envíos
  const changeQueue = useRef<DocumentChange[]>([]);
  const flushTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorThrottle = useRef<ReturnType<typeof setTimeout> | null>(null);

  // recordar último token para re-join en reconexiones
  const lastTokenRef = useRef<string | undefined>(undefined);

  // usuario local pseudo-aleatorio
  useEffect(() => {
    const id = uuidv4();
    const name = `Usuario ${id.slice(0, 8)}`;
    const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    setCurrentUser({ id, name, color });
  }, []);

  // --- helpers de limpieza ---
  const cleanupTimers = useCallback(() => {
    if (flushTimeout.current) {
      clearTimeout(flushTimeout.current);
      flushTimeout.current = null;
    }
    if (cursorThrottle.current) {
      clearTimeout(cursorThrottle.current);
      cursorThrottle.current = null;
    }
    changeQueue.current = [];
  }, []);

  // --- flush de cambios en cola ---
  const flushChanges = useCallback(() => {
    if (
      changeQueue.current.length === 0 ||
      !socket ||
      !documentId ||
      !currentUser ||
      !isConnected
    ) {
      flushTimeout.current = null;
      return;
    }
    // consolidar por tipo/hoja (nos quedamos con el último)
    const latest = new Map<string, DocumentChange>();
    for (const ch of changeQueue.current) {
      const key = `${ch.type}-${ch.sheetId || "main"}`;
      latest.set(key, ch);
    }
    latest.forEach((ch) => {
      socket.emit("document_change", { documentId, change: ch });
    });
    changeQueue.current = [];
    flushTimeout.current = null;
  }, [socket, documentId, currentUser, isConnected]);

  // --- inicialización del socket ---
  const initializeSocket = useCallback(() => {
    // cerrar socket anterior si existía
    if (socket) {
      try {
        socket.off();
        socket.close();
      } catch {}
      setSocket(null);
    }

    setConnectionStatus("connecting");
    setLastError(null);

    const s = io(API_BASE, {
      path: SOCKET_PATH,
      transports: ["websocket", "polling"],
      withCredentials: true,
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    setSocket(s);

    // --- conexión ---
    s.on("connect", () => {
      setIsConnected(true);
      setConnectionStatus("connected");
      setLastError(null);

      if (documentId && currentUser) {
        s.emit("join_document", {
          documentId,
          user: currentUser,
          token: lastTokenRef.current,
        });
        queueMicrotask(() => flushChanges());
      }
    });

    s.on("disconnect", (reason) => {
      setIsConnected(false);
      setConnectionStatus("disconnected");
      setUsers([]);
      if (reason === "io server disconnect") {
        // servidor cortó: intentamos reconectar
        setTimeout(() => {
          try {
            s.connect();
          } catch {}
        }, 1000);
      }
    });

    s.io.on("reconnect", () => {
      setConnectionStatus("connected");
      setLastError(null);
      if (documentId && currentUser) {
        s.emit("join_document", {
          documentId,
          user: currentUser,
          token: lastTokenRef.current,
        });
        queueMicrotask(() => flushChanges());
      }
    });
    s.io.on("reconnect_attempt", () => setConnectionStatus("connecting"));
    s.io.on("reconnect_error", (err: any) => {
      setConnectionStatus("error");
      setLastError(`Reconnection failed: ${err?.message || err}`);
    });
    s.io.on("reconnect_failed", () => {
      setConnectionStatus("error");
      setLastError("Failed to reconnect to server");
    });
    s.on("connect_error", (err) => {
      setConnectionStatus("error");
      setLastError(`Connection error: ${err?.message || err}`);
    });

    // --- eventos de dominio ---
    s.on("document_change", (change: DocumentChange) => {
      if (!currentUser) return;
      if (change.userId === currentUser.id) return; // mi eco

      const k = keyOf(change);
      const lastMine = lastLocalTsByKey.current.get(k) ?? -1;
      const lastRemote = lastRemoteTsByKey.current.get(k) ?? -1;

      if (change.timestamp <= lastMine) {
        // broadcast viejo que llego después de mi cambio -> ignorar
        return;
      }
      if (change.timestamp <= lastRemote) {
        // remoto repetido o fuera de orden -> ignorar
        return;
      }

      lastRemoteTsByKey.current.set(k, change.timestamp);

      // propaga a tus callbacks reales
      changeCallbacks.current.forEach((cb) => {
        try {
          cb(change);
        } catch (e) {
          console.error("Error in change callback:", e);
        }
      });
    });

    s.on("user_joined", (joined: User) => {
      if (currentUser && joined.id === currentUser.id) return;
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== joined.id);
        return [...filtered, joined];
      });
      userJoinCallbacks.current.forEach((cb) => {
        try {
          cb(joined);
        } catch (e) {
          console.error("Error in user join callback:", e);
        }
      });
    });

    s.on("user_left", (userId: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      userLeaveCallbacks.current.forEach((cb) => {
        try {
          cb(userId);
        } catch (e) {
          console.error("Error in user leave callback:", e);
        }
      });
    });

    s.on("users_list", (list: User[]) => {
      // filtra al usuario local para no duplicarlo
      setUsers(() => {
        if (!currentUser) return list;
        return list.filter((u) => u.id !== currentUser.id);
      });
    });

    s.on(
      "user_cursor",
      ({
        userId,
        cursor,
      }: {
        userId: string;
        cursor: { x: number; y: number };
      }) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, cursor } : u))
        );
      }
    );

    return s;
  }, [socket, documentId, currentUser, flushChanges]);

  // montar / desmontar
  useEffect(() => {
    const s = initializeSocket();
    return () => {
      cleanupTimers();
      try {
        s?.off();
        s?.close();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- API pública ---
  const joinDocument = useCallback(
    (docId: string, token?: string) => {
      setDocumentId(docId);
      lastTokenRef.current = token;
      if (!socket || !currentUser || !isConnected) return;
      socket.emit("join_document", {
        documentId: docId,
        user: currentUser,
        token,
      });
    },
    [socket, currentUser, isConnected]
  );

  const leaveDocument = useCallback(() => {
    if (!socket || !documentId) return;
    socket.emit("leave_document", { documentId });
    setDocumentId(null);
    setUsers([]);
  }, [socket, documentId]);

  const sendChange = useCallback(
    (change: Omit<DocumentChange, "userId" | "timestamp">) => {
      if (!currentUser) return;
      const full: DocumentChange = {
        ...change,
        userId: currentUser.id,
        timestamp: Date.now(),
      };

      lastLocalTsByKey.current.set(keyOf(full), full.timestamp);

      changeQueue.current.push(full);
      if (flushTimeout.current) clearTimeout(flushTimeout.current);
      flushTimeout.current = setTimeout(flushChanges, 100); // 100ms debounce
    },
    [currentUser, flushChanges]
  );

  const onDocumentChange = useCallback((cb: (c: DocumentChange) => void) => {
    changeCallbacks.current.add(cb);
    return () => {
      changeCallbacks.current.delete(cb);
    };
  }, []);

  const onUserJoin = useCallback((cb: (u: User) => void) => {
    userJoinCallbacks.current.add(cb);
    return () => {
      userJoinCallbacks.current.delete(cb);
    };
  }, []);

  const onUserLeave = useCallback((cb: (id: string) => void) => {
    userLeaveCallbacks.current.add(cb);
    return () => {
      userLeaveCallbacks.current.delete(cb);
    };
  }, []);

  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (!socket || !documentId || !currentUser || !isConnected) return;
      if (cursorThrottle.current) return;
      cursorThrottle.current = setTimeout(() => {
        try {
          socket.emit("cursor_update", {
            documentId,
            userId: currentUser.id,
            cursor: { x, y },
          });
        } finally {
          cursorThrottle.current = null;
        }
      }, 16); // ~60fps
    },
    [socket, documentId, currentUser, isConnected]
  );

  const reconnect = useCallback(() => {
    setLastError(null);
    initializeSocket();
  }, [initializeSocket]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    users,
    currentUser,
    joinDocument,
    leaveDocument,
    sendChange,
    onDocumentChange,
    onUserJoin,
    onUserLeave,
    updateCursor,
    reconnect,
    lastError,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// ===== Hook de consumo =====
export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx)
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  return ctx;
}
