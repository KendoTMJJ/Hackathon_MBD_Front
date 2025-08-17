import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth0 } from "@auth0/auth0-react";
import { useDocumentStore } from "./useDocument";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE ?? "";

export function useCollab(documentId?: string) {
  const { getAccessTokenSilently } = useAuth0();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!documentId) return;

    (async () => {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUDIENCE },
      });

      const socket = io(`${API_BASE}/collab`, {
        transports: ["websocket"],
        auth: { token },
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join", { documentId });
      });

      socket.on("change", ({ documentId: id, patch }: any) => {
        const { doc, applyLocalPatch } = useDocumentStore.getState();
        if (!doc || doc.cod_document !== id) return;
        applyLocalPatch(patch);
      });

      // socket.on("presence", (p) => { /* opcional */ });
    })();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [documentId, getAccessTokenSilently]);

  const sendChange = (patch: any) => {
    socketRef.current?.emit("change", { documentId, patch });
  };
  const sendPresence = (presence: any) => {
    socketRef.current?.emit("presence", { documentId, ...presence });
  };

  return { sendChange, sendPresence };
}
