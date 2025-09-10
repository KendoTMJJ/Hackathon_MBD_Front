// // src/lib/socket.ts
// import { io, Socket } from "socket.io-client";

// let socket: Socket | null = null;

// type Transport = "websocket" | "polling";

// type CreateOpts = {
//   /** Access Token (JWT) para usuario autenticado */
//   jwt?: string;
//   /** Token del enlace compartido (modo invitado) */
//   sharedToken?: string;
//   /** Contraseña opcional del enlace compartido */
//   sharedPassword?: string;
//   /** Forzar tipo (por defecto: 'guest' si hay sharedToken; si no, 'user') */
//   type?: "guest" | "user";
//   /** Querystring para el handshake (documentId, mode, etc.) */
//   query?: Record<string, string | number | boolean | undefined>;
//   /** Override de transports */
//   transports?: Transport[];
// };

// const baseRaw =
//   (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";
// const API_BASE = baseRaw.replace(/\/$/, "");

// const NAMESPACE = "/collab";
// const PATH = "/socket.io";

// /**
//  * Crea un socket conectado SIEMPRE al namespace /collab del backend.
//  * Se asegura de cerrar cualquier socket previo antes de crear uno nuevo.
//  */
// export const createAuthedSocket = (opts: CreateOpts | string): Socket => {
//   // Cierra el socket previo si existe
//   if (socket) {
//     try {
//       socket.off();
//       socket.disconnect();
//     } catch {}
//     socket = null;
//   }

//   const options: CreateOpts =
//     typeof opts === "string" ? { jwt: opts } : (opts ?? {});

//   const inferredType: "guest" | "user" =
//     options.type ??
//     (options.sharedToken && !options.jwt ? "guest" : "user");

//   // auth del handshake
//   const auth: Record<string, any> = {
//     type: inferredType,
//   };
//   if (options.jwt) auth.token = options.jwt;
//   if (options.sharedToken) auth.sharedToken = options.sharedToken;
//   if (options.sharedPassword) auth.sharedPassword = options.sharedPassword;

//   // query del handshake
//   const query: Record<string, any> = {};
//   if (options.query) {
//     for (const [k, v] of Object.entries(options.query)) {
//       if (v !== undefined) query[k] = String(v);
//     }
//   }

//   // Crea el socket al namespace /collab
//   socket = io(`${API_BASE}${NAMESPACE}`, {
//     path: PATH,
//     transports: options.transports ?? ["websocket", "polling"],
//     withCredentials: true,
//     forceNew: true,
//     reconnection: true,
//     reconnectionAttempts: 10,
//     reconnectionDelay: 800,
//     reconnectionDelayMax: 5000,
//     timeout: 20000,
//     auth,
//     query,
//   });

//   // Logs útiles para depurar
//   socket.on("connect", () => {
//     console.info("[socket] connected", {
//       url: `${API_BASE}${NAMESPACE}${PATH}`,
//       id: socket?.id,
//       type: inferredType,
//     });
//   });

//   socket.on("connect_error", (err) => {
//     console.error("[socket] connect_error:", err?.message || err);
//     console.log("[socket] auth used:", {
//       API_BASE,
//       namespace: NAMESPACE,
//       path: PATH,
//       type: inferredType,
//       hasJWT: !!options.jwt,
//       hasSharedToken: !!options.sharedToken,
//       hasPassword: !!options.sharedPassword,
//       query,
//       transports: options.transports ?? ["websocket", "polling"],
//     });
//   });

//   socket.on("ws:ready", () => console.info("[socket] ws:ready"));
//   socket.on("ws:deny", (m) => console.warn("[socket] ws:deny", m));

//   return socket;
// };

// export const getSocket = (): Socket | null => socket;

// export const setSocketAuth = (patch: Record<string, any>) => {
//   if (!socket) return;
//   (socket as any).auth = { ...(socket as any).auth, ...patch };
// };

// export const disconnectSocket = (): void => {
//   if (socket) {
//     try {
//       socket.off();
//       socket.disconnect();
//     } finally {
//       socket = null;
//     }
//   }
// };
