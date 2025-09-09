// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const createAuthedSocket = (jwt: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

  socket = io(`${API_BASE}/collab`, {
    transports: ["websocket"],
    auth: {
      token: jwt,
    },
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
