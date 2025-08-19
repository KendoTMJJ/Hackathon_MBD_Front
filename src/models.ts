// src/models/index.ts
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

// ===== Entidades =====
export interface DocumentEntity {
  id: string; // cod_document
  title: string; // title_document
  kind: Kind; // kind_document
  data: DocumentData; // data_document
  version: number;
  templateId: string | null; // template_id
  isArchived: boolean; // is_archived
  createdBy: string; // created_by
  projectId: string; // project_id
  createdAt: string; // created_at
  updatedAt: string; // updated_at
}

export interface TemplateEntity {
  id: string; // cod_template
  title: string; // title_template
  data: DocumentData; // data_template
  version: number;
  isArchived: boolean; // is_archived
  createdBy: string; // created_by
  createdAt: string; // created_at
  updatedAt: string; // updated_at
  /** tu entity tiene kind_template; lo dejamos opcional en el front */
  kind?: Kind; // kind_template (opcional en front)
}

export interface Collaborator {
  id: string; // cod_collaborator
  documentId: string; // document_id
  userSub: string; // user_sub
  role: Role; // role_collab
  createdAt: string; // created_at
}

export interface Project {
  id: string; // cod_project
  name: string; // name_project
  ownerSub: string; // owner_sub
  createdAt: string; // created_at
  updatedAt: string; // updated_at
}

export interface SharedLinkEntity {
  id: string;
  token: string;
  permission: "read" | "edit";
  expiresAt: string | null;
  passwordHash: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  documentId: string;
}

export interface CreateShareLinkRequest {
  permission: "read" | "edit";
  expiresAt?: string;
  password?: string;
}

export interface ShareLinkResponse {
  shareUrl: string;
  link: SharedLinkEntity;
}

export interface SharedDocumentAccess {
  document: any;
  permission: "read" | "edit";
}

export interface SheetEntity {
  id: string;
  name: string;
  orderIndex: number;
  data: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  documentId: string;
}

export interface CreateSheetRequest {
  name: string;
  data?: Record<string, any>;
}

export interface UpdateSheetRequest {
  name?: string;
  data?: Record<string, any>;
  orderIndex?: number;
}

export interface ReorderSheetsRequest {
  sheetIds: string[];
}


