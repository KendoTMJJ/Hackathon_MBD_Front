// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

type CreateOpts = {
  /** Access Token (JWT) para usuario autenticado */
  jwt?: string;
  /** Token de enlace compartido (modo invitado) */
  sharedToken?: string;
  /** Contraseña opcional del enlace compartido */
  sharedPassword?: string;
};

/**
 * Crea una conexión a /collab con auth.
 * Reemplaza cualquier socket previo.
 */
export const createAuthedSocket = (jwtOrOpts?: string | CreateOpts): Socket => {
  // Cierra conexión anterior si existía (evita leaks)
  if (socket) {
    try {
      socket.disconnect();
    } catch {}
    socket = null;
  }

  const baseRaw = (import.meta.env.VITE_API_BASE_URL as string) || "";
  const API_BASE = baseRaw.replace(/\/$/, ""); // sin slash final

  // Normaliza parámetros
  const opts: CreateOpts =
    typeof jwtOrOpts === "string" ? { jwt: jwtOrOpts } : jwtOrOpts ?? {};

  // Auth para el handshake
  const auth: Record<string, any> = {};
  if (opts.jwt) auth.token = opts.jwt;
  if (opts.sharedToken) auth.sharedToken = opts.sharedToken;
  if (opts.sharedPassword) auth.sharedPassword = opts.sharedPassword;

  socket = io(`${API_BASE}/collab`, {
    transports: ["websocket"],
    withCredentials: true, // hace match con CORS del gateway
    forceNew: true, // no reutiliza conexión
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    auth,
  });

  return socket;
};

/** Devuelve el socket actual (si existe) */
export const getSocket = (): Socket | null => socket;

/** Patch de auth en caliente (útil al refrescar token) */
export const setSocketAuth = (patch: Record<string, any>) => {
  if (!socket) return;
  (socket as any).auth = { ...(socket as any).auth, ...patch };
};

/** Desconecta y limpia la referencia global */
export const disconnectSocket = (): void => {
  if (socket) {
    try {
      socket.disconnect();
    } finally {
      socket = null;
    }
  }
};
