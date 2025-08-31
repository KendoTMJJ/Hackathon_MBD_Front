// hooks/useCollab.ts
import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE ?? "";

type ChangeListener = (change: any) => void;

type PresenceUser = { id: string; name: string; color: string };
type Cursor = {
  userId: string;
  x: number;
  y: number;
  name?: string;
  color?: string;
};

function randomColor() {
  const colors = [
    "#00E5FF",
    "#FF7A00",
    "#8A5CF6",
    "#00D68F",
    "#FF3D71",
    "#FFC107",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useCollab(documentId?: string, sharedToken?: string) {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();

  const socketRef = useRef<Socket | null>(null);
  const selfRef = useRef<PresenceUser | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [canEdit, setCanEdit] = useState<boolean>(true); // por ahora asumimos true

  // listeners para cambios de documento
  const changeListenersRef = useRef<Set<ChangeListener>>(new Set());

  const onChange = useCallback((cb: ChangeListener) => {
    changeListenersRef.current.add(cb);
    return () => changeListenersRef.current.delete(cb);
  }, []);

  const sendChange = useCallback(
    (payload: any) => {
      const s = socketRef.current;
      if (!s || !documentId) return;
      // El gateway espera { documentId, change }
      s.emit("document_change", { documentId, change: payload });
    },
    [documentId]
  );

  const updateCursor = useCallback(
    (pos: { x: number; y: number }) => {
      const s = socketRef.current;
      const self = selfRef.current;
      if (!s || !documentId || !self) return;
      s.emit("cursor_update", { documentId, userId: self.id, cursor: pos });
    },
    [documentId]
  );

  // conectar socket y unirse a la room
  useEffect(() => {
    if (!documentId) return;

    let cancelled = false;

    (async () => {
      // usuario local (para presencia/cursor)
      const self: PresenceUser = {
        id: uuid(),
        name:
          (user?.name as string) ?? (user?.nickname as string) ?? "Invitado",
        color: randomColor(),
      };
      selfRef.current = self;

      // token JWT (si hay sesión)
      let jwt: string | undefined;
      if (isAuthenticated) {
        try {
          jwt = await getAccessTokenSilently({
            authorizationParams: { audience: AUDIENCE },
          });
        } catch {
          // sin token -> seguimos como público
          jwt = undefined;
        }
      }

      if (cancelled) return;

      const socket = io(`${API_BASE}/collab`, {
        transports: ["websocket"],
        auth: jwt ? { token: jwt } : {},
        withCredentials: true,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        // El gateway espera 'join_document' con: { documentId, token?, user }
        socket.emit("join_document", {
          documentId,
          token: sharedToken,
          user: self,
        });
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
        setUsers([]);
        setCursors([]);
      });

      // Lista completa de usuarios presentes en el doc
      socket.on("users_list", (list: PresenceUser[]) => {
        setUsers(list ?? []);
      });

      // Un usuario actualiza su cursor
      socket.on(
        "user_cursor",
        (p: { userId: string; cursor: { x: number; y: number } }) => {
          setCursors((prev) => {
            const others = prev.filter((c) => c.userId !== p.userId);
            const meta = (users || []).find((u) => u.id === p.userId);
            return [
              ...others,
              {
                userId: p.userId,
                x: p.cursor.x,
                y: p.cursor.y,
                name: meta?.name,
                color: meta?.color,
              },
            ];
          });
        }
      );

      // Cambios de documento (broadcast desde el gateway)
      socket.on("document_change", (change: any) => {
        changeListenersRef.current.forEach((cb) => cb(change));
      });

      // (Opcional) si en algún momento emites 'session_info' con permiso:
      // socket.on("session_info", (info: { permission: "read" | "edit" }) => {
      //   setCanEdit(info?.permission === "edit");
      // });
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setUsers([]);
      setCursors([]);
    };
  }, [
    documentId,
    sharedToken,
    isAuthenticated,
    getAccessTokenSilently,
    user?.name,
    user?.nickname,
  ]);

  return {
    // envío
    sendChange,
    // suscripción a cambios remotos
    onChange,
    // cursores/presencia
    updateCursor,
    cursors,
    users,
    // estado
    canEdit,
    isConnected,
  };
}
