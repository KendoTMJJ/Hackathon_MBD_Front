// src/collab/CollabProvider.tsx
import React, { useEffect, useMemo } from "react";
import { useCollabGuest } from "../../hooks/useCollabGuest";
import { useCollab } from "../../hooks/useCollab";
import { useDocumentStore } from "../../hooks/useDocument";
import type { DocumentEntity } from "../../models";
import { CollabContext, type CollabCtx } from "./CollabContext";

type Props = {
  documentId: string;
  mode: "normal" | "shared";
  sharedToken?: string;
  password?: string;
  children: React.ReactNode;
};

export default function CollabProvider({
  documentId,
  mode,
  sharedToken,
  password,
  children,
}: Props) {
  const isShared = mode === "shared";

  // Hooks de colaboración
  const guest =
    isShared && sharedToken
      ? useCollabGuest(documentId, sharedToken, password)
      : null;
  const authed = !isShared ? useCollab(documentId) : null;

  // Zustand setters
  const setDoc = useDocumentStore((s) => s.setDoc);

  // Hidratar el store con snapshot (solo en modo compartido)
  useEffect(() => {
    if (!isShared) return;
    if (!documentId) return;

    const snap = guest?.snapshot;
    if (!snap) return;

    const current = useDocumentStore.getState().doc;

    if (current) {
      const next: DocumentEntity = {
        ...current,
        id: documentId,
        data: snap.data ?? current.data ?? { nodes: [], edges: [] },
        version:
          typeof snap.version === "number"
            ? snap.version
            : current.version ?? 0,
        updatedAt: new Date().toISOString(),
      };
      setDoc(next);
    } else {
      const now = new Date().toISOString();
      const next: DocumentEntity = {
        id: documentId,
        title: "",
        kind: "diagram",
        data: snap.data ?? { nodes: [], edges: [] },
        version: typeof snap.version === "number" ? snap.version : 0,
        templateId: null,
        isArchived: false,
        createdBy: "",
        projectId: "",
        createdAt: now,
        updatedAt: now,
        sheets: [],
      };
      setDoc(next);
    }
  }, [isShared, documentId, guest?.snapshot?.version, setDoc]);

  const ctx: CollabCtx = useMemo(() => {
    if (isShared) {
      return {
        permission: guest?.permission ?? "read",
        sendChange: guest?.sendChange ?? (() => {}),
        sendPresence: guest?.sendPresence ?? (() => {}),
        peers: guest?.peers ?? {},
      };
    }
    return {
      permission: authed?.permission ?? "edit",
      sendChange: authed?.sendChange ?? (() => {}),
      sendPresence: authed?.sendPresence ?? (() => {}),
      peers: authed?.peers ?? {},
    };
  }, [
    isShared,
    guest?.permission,
    guest?.sendChange,
    guest?.sendPresence,
    guest?.peers,
    authed?.permission,
    authed?.sendChange,
    authed?.sendPresence,
    authed?.peers,
  ]);

  return (
    <CollabContext.Provider value={ctx}>{children}</CollabContext.Provider>
  );
}
