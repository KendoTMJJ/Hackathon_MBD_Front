// src/types/collaboration.ts
import type { Node, Edge } from "@xyflow/react";

export interface CollabSnapshot {
  data: {
    nodes?: Node[];
    edges?: Edge[];
    title?: string;
    [key: string]: any;
  };
  version: number;
  updatedAt?: string;
}

export interface CollabPeer {
  id: string;
  userSub?: string;
  name?: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  selection?: any;
  lastSeen: number;
  joined?: number;
  color?: string;
}

export interface CollabChange {
  apply?: Partial<CollabSnapshot["data"]>;
  version?: number;
  timestamp?: number;
  userId?: string;
}

export interface CollabPresence {
  cursor?: { x: number; y: number };
  selection?: {
    nodes?: string[];
    edges?: string[];
  };
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  timestamp?: number;
}

export type CollabPermission = "read" | "edit";

export interface CollabState {
  snapshot: CollabSnapshot | null;
  permission: CollabPermission;
  peers: Record<string, CollabPeer>;
  connected: boolean;
  error: string | null;
  sendChange: (change: CollabChange) => void;
  sendPresence: (presence: CollabPresence) => void;
}

// Utilidades para trabajar con colaboración
export const CollabUtils = {
  /**
   * Aplica un cambio colaborativo a un snapshot existente
   */
  applyChange(
    snapshot: CollabSnapshot | null,
    change: CollabChange
  ): CollabSnapshot | null {
    if (!snapshot || !change.apply) return snapshot;

    return {
      ...snapshot,
      data: {
        ...snapshot.data,
        ...change.apply,
      },
      version: change.version || snapshot.version,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Crea un cambio colaborativo a partir de nodos y edges
   */
  createChange(
    nodes?: Node[],
    edges?: Edge[],
    title?: string,
    version?: number
  ): CollabChange {
    const apply: any = {};

    if (nodes !== undefined) apply.nodes = nodes;
    if (edges !== undefined) apply.edges = edges;
    if (title !== undefined) apply.title = title;

    return {
      apply,
      version,
      timestamp: Date.now(),
    };
  },

  /**
   * Extrae nodos y edges de un snapshot
   */
  extractFlow(snapshot: CollabSnapshot | null): {
    nodes: Node[];
    edges: Edge[];
    title: string;
  } {
    return {
      nodes: (snapshot?.data?.nodes as Node[]) || [],
      edges: (snapshot?.data?.edges as Edge[]) || [],
      title: snapshot?.data?.title || "",
    };
  },

  /**
   * Genera un color único para un peer basado en su ID
   */
  getPeerColor(peerId: string): string {
    const colors = [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];

    let hash = 0;
    for (let i = 0; i < peerId.length; i++) {
      hash = ((hash << 5) - hash + peerId.charCodeAt(i)) & 0xffffffff;
    }

    return colors[Math.abs(hash) % colors.length];
  },

  /**
   * Verifica si un peer está activo (visto recientemente)
   */
  isPeerActive(peer: CollabPeer, maxInactiveMs: number = 30000): boolean {
    return Date.now() - peer.lastSeen < maxInactiveMs;
  },

  /**
   * Filtra peers activos
   */
  getActivePeers(
    peers: Record<string, CollabPeer>
  ): Record<string, CollabPeer> {
    return Object.fromEntries(
      Object.entries(peers).filter(([, peer]) => CollabUtils.isPeerActive(peer))
    );
  },
};
