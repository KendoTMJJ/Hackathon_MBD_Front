import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import type {
  SharedDocumentAccess,
  SheetEntity,
  CreateSheetRequest,
} from "../models";
import { useApi } from "./useApi";

export function useSharedDocument(token: string | undefined) {
  const api = useApi();
  const webSocket = useWebSocket();

  const [sharedData, setSharedData] = useState<SharedDocumentAccess | null>(null);
  const [sheets, setSheets] = useState<SheetEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const saveTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const pendingPromisesRef = useRef<Record<string, Promise<void> | null>>({});

  const loadSharedDocument = useCallback(
    async (password?: string) => {
      if (!token) {
        setError("Token no válido");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
        const url = `${backendUrl}/shared/${token}${password ? `?password=${encodeURIComponent(password)}` : ""}`;

        console.log('Loading shared document from:', url);
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 400 && errorData.message?.includes("Password required")) {
            throw new Error("PASSWORD_REQUIRED");
          }
          throw new Error(errorData.message || "Error accessing shared document");
        }

        const result = await response.json();
        console.log("Shared document loaded:", result);
        console.log("Sheets from result:", result.sheets?.length || 0);

        setSharedData(result);

        const sheetsFromResult: SheetEntity[] = Array.isArray(result.sheets)
          ? result.sheets
          : Array.isArray(result.document?.sheets)
          ? result.document.sheets
          : [];

        console.log("Processing sheets:", sheetsFromResult.map(s => ({
          id: s.id,
          name: s.name,
          isActive: s.isActive
        })));
        
        const activeSheets = sheetsFromResult.filter(sheet => sheet.isActive !== false);
        console.log("Active sheets after filtering:", activeSheets.length);
        
        const sortedSheets = activeSheets.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setSheets(sortedSheets);

        if (result.document?.id && webSocket.isConnected) {
          webSocket.joinDocument(result.document.id, token);
        }

        return result;
      } catch (err: any) {
        const message = err.message || "Error accessing shared document";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [token, webSocket]
  );


const saveSheetData = useCallback(
  (sheetId: string, data: any) => {
    if (!sharedData?.document?.id || sharedData.permission !== "edit") {
      return Promise.reject(new Error("No permission or document id"));
    }

    const existing = saveTimeoutsRef.current[sheetId];
    if (existing) {
      clearTimeout(existing);
    }

    return new Promise<void>(async (resolve, reject) => {
      setSaving(true);
      try {
        const payload = {
          data,
          updatedAt: new Date().toISOString(),
        };

        const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
        const url = `${backendUrl}/shared/${token}/sheets/${sheetId}`;

        console.log("Saving to URL:", url);
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setSheets((prev) =>
          prev.map((sheet) =>
            sheet.id === sheetId ? { ...sheet, data, updatedAt: payload.updatedAt } : sheet
          )
        );

        webSocket.sendChange({
          type: "sheet_update",
          data: { sheetId, data },
          sheetId,
        });

        resolve();
      } catch (err) {
        console.error("Error saving sheet data:", err);
        reject(err);
      } finally {
        setSaving(false);
        saveTimeoutsRef.current[sheetId] = null;
        pendingPromisesRef.current[sheetId] = null;
      }
    });
  },
  [sharedData, token, webSocket]
);

const createSheet = useCallback(
  async (sheetData: CreateSheetRequest) => {
    if (!sharedData?.document?.id || sharedData.permission !== "edit") return;

    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const url = `${backendUrl}/shared/${token}/sheets`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sheetData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newSheet = await response.json();

      setSheets((prev) =>
        [...prev, newSheet].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      );

      webSocket.sendChange({
        type: "sheet_create",
        data: newSheet,
      });

      return newSheet;
    } catch (error) {
      console.error("Error creating sheet:", error);
      throw error;
    }
  },
  [sharedData, token, webSocket]
);

const deleteSheet = useCallback(
  async (sheetId: string) => {
    if (!sharedData?.document?.id || sharedData.permission !== "edit") return;

    console.log('Deleting sheet:', sheetId);
    
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const url = `${backendUrl}/shared/${token}/sheets/${sheetId}`;
      
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Sheet deleted successfully, updating local state');
      
      setSheets((prev) => prev.filter((sheet) => sheet.id !== sheetId));
      webSocket.sendChange({
        type: "sheet_delete",
        data: { sheetId },
      });
      
      console.log('Delete operation completed');
    } catch (error) {
      console.error("Error deleting sheet:", error);
      throw error;
    }
  },
  [sharedData, token, webSocket]
);
  const reorderSheets = useCallback(
    async (newOrder: string[]) => {
      if (!sharedData?.document?.id || sharedData.permission !== "edit") return;

      try {
        await api.put(`/documents/${sharedData.document.id}/sheets/reorder`, {
          sheetIds: newOrder,
        });

        const reorderedSheets = newOrder
          .map((id, index) => {
            const sheet = sheets.find((s) => s.id === id);
            return sheet ? { ...sheet, orderIndex: index } : null;
          })
          .filter(Boolean) as SheetEntity[];

        setSheets(reorderedSheets);

        webSocket.sendChange({
          type: "sheet_reorder",
          data: { newOrder },
        });
      } catch (error) {
        console.error("Error reordering sheets:", error);
        throw error;
      }
    },
    [api, sharedData, sheets, webSocket]
  );

  useEffect(() => {
    const unsubscribe = webSocket.onDocumentChange((change) => {
      if (change.userId === webSocket.currentUser?.id) return;

      console.log("Received WebSocket change:", change);

      switch (change.type) {
        case "sheet_update":
          if (change.data?.sheetId) {
            const incoming = change.data.data ?? change.data; 
            setSheets((prev) =>
              prev.map((sheet) =>
                sheet.id === change.data.sheetId
                  ? { ...sheet, data: incoming, updatedAt: new Date().toISOString() }
                  : sheet
              )
            );
          }
          break;

        case "sheet_create":
          setSheets((prev) => {
            const exists = prev.some((sheet) => sheet.id === change.data.id);
            if (exists) return prev;
            return [...prev, change.data].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
          });
          break;

        case "sheet_delete":
          setSheets((prev) => prev.filter((sheet) => sheet.id !== change.data.sheetId));
          break;

        case "sheet_reorder":
          {
            const reordered = (change.data?.newOrder ?? []).map((id: string, idx: number) => {
              const s = sheets.find((x) => x.id === id);
              return s ? { ...s, orderIndex: idx } : null;
            }).filter(Boolean) as SheetEntity[];
            if (reordered.length) setSheets(reordered);
          }
          break;
      }
    });

    return unsubscribe;
  }, [webSocket, sheets]);

  useEffect(() => {
    if (webSocket.isConnected && sharedData?.document?.id && token) {
      webSocket.joinDocument(sharedData.document.id, token);
    }
  }, [webSocket.isConnected, sharedData?.document?.id, token, webSocket]);

  useEffect(() => {
    return () => {
      const map = saveTimeoutsRef.current;
      Object.keys(map).forEach((k) => {
        const t = map[k];
        if (t) clearTimeout(t);
      });
      webSocket.leaveDocument();
    };
  }, [webSocket]);

  return {
    sharedData,
    sheets,
    loading,
    error,
    saving,
    loadSharedDocument,
    saveSheetData,
    createSheet,
    deleteSheet,
    reorderSheets,
    canEdit: sharedData?.permission === "edit",
  };
}