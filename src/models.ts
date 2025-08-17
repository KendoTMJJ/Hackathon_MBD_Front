export type Role = "owner" | "editor" | "reader";
export type Kind = "diagram" | "template";

export interface RFViewport {
  x: number;
  y: number;
  zoom: number;
}
export interface RFNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data?: any;
}
export interface RFEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: any;
}

export interface DocumentData {
  nodes: RFNode[];
  edges: RFEdge[];
  viewport?: RFViewport;
  meta?: Record<string, any>;
}

export interface DocumentEntity {
  id: string;
  title: string;
  kind: Kind;
  data: DocumentData;
  version: number;
  templateId: string | null;
  isArchived: boolean;
  createdBy: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  cod_collaborator: string;
  document_id: string;
  user_sub: string;
  role_collab: Role;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  ownerSub: string;
  createdAt: string;
  updatedAt: string;
}
