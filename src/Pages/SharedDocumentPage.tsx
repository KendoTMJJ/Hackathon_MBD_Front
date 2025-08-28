import type React from "react";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type FitViewOptions,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type OnNodeDrag,
  type DefaultEdgeOptions,
  Background,
  MiniMap,
  Controls,
  Panel,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TechnologyPanel } from "../components/flow/TechnologyPanel";
import { nodeTypes } from "../components/flow/nodes";
import { edgeTypes } from "../components/flow/edges";
import { zoneTypes } from "../components/flow/zones";
import { UserPresence, UserCursors } from "../components/shared/UserPresence";
import RecommendedTechPanel from "../components/flow/RecommendedTechPanel";
import { useSharedDocument } from "../hooks/useSharedDocument";
import { useWebSocket } from "../context/WebSocketContext";

import { cloudZones } from "../components/data/CloudZones";
import { dmzZones } from "../components/data/DmzZones";
import { lanZones } from "../components/data/LanZones";
import { datacenterZones } from "../components/data/DatacenterZones";
import { otZones } from "../components/data/OtZones";
import type { Technology } from "../mocks/technologies.types";

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const fitViewOptions: FitViewOptions = { padding: 0.2 };
const defaultEdgeOptions: DefaultEdgeOptions = { animated: true };

const allNodeTypes = { ...nodeTypes, ...zoneTypes };

type ZoneKind = "cloud" | "dmz" | "lan" | "datacenter" | "ot";

type ZoneTpl = {
  id: string;
  name: string;
  description?: string;
  color: string;
  level: "low" | "medium" | "high";
  kind: ZoneKind;
};

export default function SharedDocumentPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const webSocket = useWebSocket();

  const {
    sharedData,
    sheets,
    loading,
    error,
    saving,
    loadSharedDocument,
    saveSheetData,
    createSheet,
    deleteSheet,
    canEdit,
  } = useSharedDocument(token);

  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");

  const [mainNodes, setMainNodes] = useState<Node[]>(initialNodes);
  const [mainEdges, setMainEdges] = useState<Edge[]>(initialEdges);
  const [title, setTitle] = useState<string>("");

  const [activeSheetIdx, setActiveSheetIdx] = useState<number | null>(null);
  const [sheetNodes, setSheetNodes] = useState<Node[]>([]);
  const [sheetEdges, setSheetEdges] = useState<Edge[]>([]);
  const [sheets_cache, setSheetsCache] = useState<
    Record<string, { nodes: Node[]; edges: Edge[] }>
  >({});
  const [isChangingSheet, setIsChangingSheet] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const hasUserInteracted = useRef(false);
  const lastInteractionTime = useRef(0);
  const hasInitiallyLoaded = useRef(false);
  const hasInitializedDocument = useRef(false);

  const [selectedZone, setSelectedZone] = useState<{
    zoneKind: ZoneKind;
    subzoneId: string;
  } | null>(null);

  const clickCreateOffsetRef = useRef(0);
  const sheetsCacheRef = useRef(sheets_cache);
  const isSyncingRef = useRef(false);

  const sheetNodesRef = useRef<Node[]>([]);
  const sheetEdgesRef = useRef<Edge[]>([]);

  useEffect(() => {
    sheetNodesRef.current = sheetNodes;
  }, [sheetNodes]);

  useEffect(() => {
    sheetEdgesRef.current = sheetEdges;
  }, [sheetEdges]);

  useEffect(() => {
    sheetsCacheRef.current = sheets_cache;
  }, [sheets_cache]);

  const handleViewportChange = useCallback(() => {
    hasUserInteracted.current = true;
    lastInteractionTime.current = Date.now();
  }, []);

  const extractNodesEdges = useCallback((entity: any) => {
    if (!entity)
      return { extractedNodes: initialNodes, extractedEdges: initialEdges };

    const data = entity?.data ?? entity;

    let extractedNodes = initialNodes;
    let extractedEdges = initialEdges;

    if (Array.isArray(data?.nodes)) {
      extractedNodes = data.nodes;
    } else if (Array.isArray(entity?.nodes)) {
      extractedNodes = entity.nodes;
    } else if (data?.content?.nodes) {
      extractedNodes = data.content.nodes;
    }

    if (Array.isArray(data?.edges)) {
      extractedEdges = data.edges;
    } else if (Array.isArray(entity?.edges)) {
      extractedEdges = entity.edges;
    } else if (data?.content?.edges) {
      extractedEdges = data.content.edges;
    }

    return { extractedNodes, extractedEdges };
  }, []);

  const loadFromEntity = useCallback(
    (entity: any, skipAutoFit = false) => {
      const { extractedNodes, extractedEdges } = extractNodesEdges(entity);

      if (activeSheetIdx !== null) {
        setSheetNodes(extractedNodes);
        setSheetEdges(extractedEdges);
      } else {
        setMainNodes(extractedNodes);
        setMainEdges(extractedEdges);
      }

      setTitle(
        entity?.title ??
          entity?.name ??
          sharedData?.document?.title ??
          "Documento Compartido"
      );

      if (!skipAutoFit && !hasInitiallyLoaded.current && rf) {
        setTimeout(() => {
          rf.fitView(fitViewOptions);
          hasInitiallyLoaded.current = true;
        }, 200);
      }
    },
    [extractNodesEdges, rf, sharedData?.document?.title, activeSheetIdx]
  );

  const saveDataNow = useCallback(
    (sheetId: string, nodes: Node[], edges: Edge[]) => {
      if (!canEdit) return;

      const data = { nodes, edges };

      setSheetsCache((prev) => ({
        ...prev,
        [sheetId]: data,
      }));

      saveSheetData(sheetId, data).catch((err) => {
        console.error("[saveDataNow] Error al guardar:", err);
        setSheetsCache((prev) => {
          const next = { ...prev };
          delete next[sheetId];
          return next;
        });
      });
    },
    [saveSheetData, canEdit]
  );
  const handleSelectSheet = useCallback(
    (index: number) => {
      if (index === activeSheetIdx || isChangingSheet) return;

      const sheet = sheets[index];
      if (!sheet) {
        console.error("[v0] Sheet not found at index:", index);
        return;
      }

      console.log("[v0] Selecting sheet:", sheet.name, "at index:", index);

      setIsChangingSheet(true);

      try {
        if (activeSheetIdx !== null && sheets[activeSheetIdx]) {
          const currentSheet = sheets[activeSheetIdx];
          const currentNodes = activeSheetIdx !== null ? sheetNodes : mainNodes;
          const currentEdges = activeSheetIdx !== null ? sheetEdges : mainEdges;

          setSheetsCache((prev) => ({
            ...prev,
            [currentSheet.id]: { nodes: currentNodes, edges: currentEdges },
          }));
        }

        setActiveSheetIdx(index);

        const cached = sheetsCacheRef.current[sheet.id];
        if (cached) {
          setSheetNodes(cached.nodes);
          setSheetEdges(cached.edges);
        } else {
          const { extractedNodes, extractedEdges } = extractNodesEdges(sheet);
          setSheetNodes(extractedNodes);
          setSheetEdges(extractedEdges);
          setSheetsCache((prev) => ({
            ...prev,
            [sheet.id]: { nodes: extractedNodes, edges: extractedEdges },
          }));
        }

        setTitle(sheet.name || `Hoja ${index + 1}`);
      } catch (error) {
        setSheetNodes([]);
        setSheetEdges([]);
      } finally {
        setTimeout(() => {
          setIsChangingSheet(false);
        }, 100);
      }
    },
    [
      sheets,
      activeSheetIdx,
      isChangingSheet,
      extractNodesEdges,
      sheetNodes,
      mainNodes,
      sheetEdges,
      mainEdges,
    ]
  );

  const handleCreateSheet = useCallback(
    async (name: string) => {
      try {
        const newSheet = await createSheet({
          name,
          data: { nodes: initialNodes, edges: initialEdges },
        });

        if (newSheet) {
          setTimeout(() => {
            const newIndex = sheets.findIndex((s) => s.id === newSheet.id);
            if (newIndex !== -1) {
              handleSelectSheet(newIndex);
            }
          }, 100);
        }
      } catch (error) {
        console.error("Error creating sheet:", error);
        throw error;
      }
    },
    [createSheet, sheets, handleSelectSheet]
  );

  const handleDeleteSheet = useCallback(
    async (sheetId: string) => {
      const currentSheet = sheets[activeSheetIdx || 0];

      await deleteSheet(sheetId);

      setSheetsCache((prev) => {
        const next = { ...prev };
        delete next[sheetId];
        return next;
      });

      if (currentSheet?.id === sheetId) {
        const remainingSheets = sheets.filter((s) => s.id !== sheetId);
        if (remainingSheets.length > 0) {
          setTimeout(() => {
            handleSelectSheet(0);
          }, 100);
        } else {
          setActiveSheetIdx(null);
          setSheetNodes([]);
          setSheetEdges([]);
          if (sharedData?.document) {
            loadFromEntity(sharedData.document);
          } else {
            setMainNodes(initialNodes);
            setMainEdges(initialEdges);
            setTitle("Documento Compartido");
          }
        }
      }
    },
    [
      sheets,
      activeSheetIdx,
      deleteSheet,
      handleSelectSheet,
      sharedData?.document,
      loadFromEntity,
    ]
  );

  const displayNodes = useMemo(() => {
    return activeSheetIdx !== null ? sheetNodes : mainNodes;
  }, [activeSheetIdx, sheetNodes, mainNodes]);

  const displayEdges = useMemo(() => {
    return activeSheetIdx !== null ? sheetEdges : mainEdges;
  }, [activeSheetIdx, sheetEdges, mainEdges]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (!canEdit || isChangingSheet || isSyncingRef.current) return;

      if (activeSheetIdx !== null) {
        const currentSheet = sheets[activeSheetIdx];
        if (!currentSheet) return;

        setSheetNodes((nds) => {
          const newNodes = applyNodeChanges(changes, nds);
          if (hasUserInteracted.current && !isSyncingRef.current) {
            saveDataNow(currentSheet.id, newNodes, sheetEdges);
          }
          return newNodes;
        });
      } else {
        setMainNodes((nds) => applyNodeChanges(changes, nds));
      }
    },
    [canEdit, isChangingSheet, activeSheetIdx, sheets, sheetEdges, saveDataNow]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (!canEdit || isChangingSheet || isSyncingRef.current) return;

      if (activeSheetIdx !== null) {
        const currentSheet = sheets[activeSheetIdx];
        if (!currentSheet) return;

        setSheetEdges((eds) => {
          const newEdges = applyEdgeChanges(changes, eds);
          if (hasUserInteracted.current && !isSyncingRef.current) {
            saveDataNow(currentSheet.id, sheetNodes, newEdges);
          }
          return newEdges;
        });
      } else {
        setMainEdges((eds) => applyEdgeChanges(changes, eds));
      }
    },
    [canEdit, isChangingSheet, activeSheetIdx, sheets, sheetNodes, saveDataNow]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!canEdit || isChangingSheet || isSyncingRef.current) return;

      if (activeSheetIdx !== null) {
        const currentSheet = sheets[activeSheetIdx];
        if (!currentSheet) return;

        setSheetEdges((eds) => {
          const newEdges = addEdge(
            { ...connection, type: "secure", animated: true },
            eds
          );
          saveDataNow(currentSheet.id, sheetNodes, newEdges);
          return newEdges;
        });
      } else {
        setMainEdges((eds) =>
          addEdge({ ...connection, type: "secure", animated: true }, eds)
        );
      }
    },
    [canEdit, isChangingSheet, activeSheetIdx, sheets, sheetNodes, saveDataNow]
  );

  const onNodeDrag: OnNodeDrag = useCallback(
    (_event, node) => {
      if (canEdit) {
        webSocket.updateCursor(node.position.x, node.position.y);
      }
    },
    [canEdit, webSocket]
  );

  const getSubZoneTemplateById = useCallback(
    (templateId: string): ZoneTpl | null => {
      const c = cloudZones.find((z) => z.id === templateId);
      if (c) return { ...c, kind: "cloud" };

      const d = dmzZones.find((z) => z.id === templateId);
      if (d) return { ...d, kind: "dmz" };

      const l = lanZones.find((z) => z.id === templateId);
      if (l) return { ...l, kind: "lan" };

      const dc = datacenterZones.find((z) => z.id === templateId);
      if (dc) return { ...dc, kind: "datacenter" };

      const o = otZones.find((z) => z.id === templateId);
      if (o) return { ...o, kind: "ot" };

      return null;
    },
    []
  );

  const createZoneNodeFromTemplate = useCallback(
    (tpl: ZoneTpl | null, position: { x: number; y: number }): Node | null => {
      if (!tpl) return null;
      const width = 420;
      const height = 160;

      return {
        id: `zone-${tpl.id}-${Date.now()}`,
        type: "zone",
        position,
        data: {
          id: tpl.id,
          name: tpl.name,
          description: tpl.description,
          color: tpl.color,
          level: tpl.level,
          kind: tpl.kind,
          title: "",
          onRename: (nodeId: string, newTitle: string) => {
            if (activeSheetIdx !== null) {
              const currentSheet = sheets[activeSheetIdx];
              if (!currentSheet) return;

              setSheetNodes((nds) => {
                const next = nds.map((n) =>
                  n.id === nodeId
                    ? { ...n, data: { ...n.data, title: newTitle } }
                    : n
                );
                saveDataNow(currentSheet.id, next, sheetEdges);
                return next;
              });
            } else {
              setMainNodes((nds) =>
                nds.map((n) =>
                  n.id === nodeId
                    ? { ...n, data: { ...n.data, title: newTitle } }
                    : n
                )
              );
            }
          },
        },
        style: { width, height },
        zIndex: 0,
      };
    },
    [activeSheetIdx, sheets, sheetEdges, saveDataNow]
  );

  const handleCreateZone = useCallback(
    (templateId: string) => {
      if (!canEdit) return;

      const tpl = getSubZoneTemplateById(templateId);
      if (!tpl) return;

      const baseX = sidebarOpen
        ? 320 + (window.innerWidth - 320) / 2
        : window.innerWidth / 2;
      const baseY = window.innerHeight / 2;

      const base = rf
        ? rf.screenToFlowPosition({ x: baseX, y: baseY })
        : { x: 120, y: 80 };

      const off = (clickCreateOffsetRef.current =
        (clickCreateOffsetRef.current + 24) % 120);

      const position = { x: base.x + off, y: base.y + off };
      const newNode = createZoneNodeFromTemplate(tpl, position);
      if (!newNode) return;

      if (activeSheetIdx !== null) {
        const currentSheet = sheets[activeSheetIdx];
        if (!currentSheet) return;

        setSheetNodes((nds) => {
          const next = [...nds, newNode];
          saveDataNow(currentSheet.id, next, sheetEdges);
          return next;
        });
      } else {
        setMainNodes((nds) => [...nds, newNode]);
      }
    },
    [
      canEdit,
      getSubZoneTemplateById,
      rf,
      sidebarOpen,
      createZoneNodeFromTemplate,
      activeSheetIdx,
      sheets,
      sheetEdges,
      saveDataNow,
    ]
  );

  const handleAddTechnology = useCallback(
    (t: Technology) => {
      if (!canEdit || !selectedZone) return;

      const allNodes = displayNodes;
      const parent = allNodes.find(
        (n) =>
          n.type === "zone" && (n.data as any)?.id === selectedZone.subzoneId
      );
      if (!parent) return;

      const rel = { x: 40 + Math.random() * 120, y: 40 + Math.random() * 80 };
      const techNode: Node = {
        id: `tech-${Date.now()}`,
        type: (t as any).nodeType ?? "default",
        position: rel,
        parentId: parent.id,
        extent: "parent",
        data: { label: t.name },
        zIndex: 1,
      };

      if (activeSheetIdx !== null) {
        const currentSheet = sheets[activeSheetIdx];
        if (!currentSheet) return;

        setSheetNodes((nds) => {
          const next = [...nds, techNode];
          saveDataNow(currentSheet.id, next, sheetEdges);
          return next;
        });
      } else {
        setMainNodes((nds) => [...nds, techNode]);
      }
    },
    [
      canEdit,
      selectedZone,
      displayNodes,
      activeSheetIdx,
      sheets,
      sheetEdges,
      saveDataNow,
    ]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!rf || !canEdit) return;

      const raw = event.dataTransfer.getData("application/reactflow");
      const txt = event.dataTransfer.getData("text/plain");

      const position = rf.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let newNode: Node | null = null;

      if (raw) {
        try {
          const payload = JSON.parse(raw);
          if (payload?.kind === "zone" && payload?.templateId) {
            const tpl = getSubZoneTemplateById(payload.templateId);
            newNode = createZoneNodeFromTemplate(tpl, position);
          }
        } catch {
        }
      }

      if (!newNode) {
        const nodeType = raw || txt || "default";
        const zones = displayNodes.filter((n) => n.type === "zone");
        const parent = zones.find((z) => pointInRect(position, z));

        if (parent) {
          const rel = {
            x: position.x - parent.position.x,
            y: position.y - parent.position.y,
          };
          newNode = {
            id: `n-${Date.now()}`,
            type: nodeType,
            position: rel,
            data: { label: nodeType },
            parentId: parent.id,
            extent: "parent",
            zIndex: 1,
          };
        } else {
          newNode = {
            id: `n-${Date.now()}`,
            type: nodeType,
            position,
            data: { label: nodeType },
          };
        }
      }

      if (!newNode) return;

      if (activeSheetIdx !== null) {
        const currentSheet = sheets[activeSheetIdx];
        if (!currentSheet) return;

        setSheetNodes((nds) => {
          const next = [...nds, newNode!];
          saveDataNow(currentSheet.id, next, sheetEdges);
          return next;
        });
      } else {
        setMainNodes((nds) => [...nds, newNode!]);
      }
    },
    [
      rf,
      canEdit,
      getSubZoneTemplateById,
      createZoneNodeFromTemplate,
      displayNodes,
      activeSheetIdx,
      sheets,
      sheetEdges,
      saveDataNow,
    ]
  );

  function pointInRect(p: { x: number; y: number }, n: Node) {
    const w = Number((n.style as any)?.width ?? 0);
    const h = Number((n.style as any)?.height ?? 0);
    return (
      w > 0 &&
      h > 0 &&
      p.x >= n.position.x &&
      p.y >= n.position.y &&
      p.x <= n.position.x + w &&
      p.y <= n.position.y + h
    );
  }

  const miniMapNodeColor = useCallback((n: Node) => {
    if (n.type === "zone") {
      return (n.data as any)?.color ?? "#7c7c86";
    }
    return "#94a3b8";
  }, []);

  const miniMapStrokeColor = useCallback((n: Node) => {
    return n.type === "zone" ? "#FFFFFF66" : "#00000033";
  }, []);

useEffect(() => {
  const unsubscribe = webSocket.onDocumentChange((change) => {
    if (change.userId === webSocket.currentUser?.id) return;

    console.log("[v0] Received real-time change from other user:", change);

    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }

    switch (change.type) {
      case "sheet_update":
        if (change.sheetId) {
          isSyncingRef.current = true;
          
          const { nodes: newNodes, edges: newEdges } = change.data.data;

          setSheetsCache((prev) => ({
            ...prev,
            [String(change.sheetId)]: { nodes: newNodes, edges: newEdges },
          }));

          if (
            activeSheetIdx !== null &&
            sheets[activeSheetIdx]?.id === change.sheetId
          ) {
            console.log("[v0] Updating active sheet with real-time changes");
            setSheetNodes(newNodes);
            setSheetEdges(newEdges);
          }
          
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 100);
        }
        break;
    }
  });

  return unsubscribe;
}, [webSocket, sheets, activeSheetIdx]);

useEffect(() => {
  const initializeDocument = async () => {
    if (!token || hasInitializedDocument.current) return;

    try {
      const result = await loadSharedDocument();
      hasInitializedDocument.current = true;

      if (result?.document?.id) {
        if (webSocket.isConnected) {
          webSocket.joinDocument(result.document.id, token);
        } else {
          const interval = setInterval(() => {
            if (webSocket.isConnected) {
              webSocket.joinDocument(result.document.id, token);
              clearInterval(interval);
            }
          }, 100);
        }
      }

      if (result?.sheets && result.sheets.length > 0) {
        setTimeout(() => {
          handleSelectSheet(0);
        }, 100);
      } else if (result?.document) {
        setActiveSheetIdx(null);
        loadFromEntity(result.document, false);
      }
    } catch (err: any) {
      if (err.message === "PASSWORD_REQUIRED") {
        setPasswordRequired(true);
      }
    }
  };

  initializeDocument();
}, [token, webSocket.isConnected]);

  useEffect(() => {
    if (
      sheets.length > 0 &&
      activeSheetIdx === null &&
      !isChangingSheet &&
      hasInitializedDocument.current
    ) {
      setTimeout(() => {
        handleSelectSheet(0);
      }, 50);
    }
  }, [sheets.length, activeSheetIdx, isChangingSheet, handleSelectSheet]);

  useEffect(() => {
    if (
      webSocket.isConnected &&
      sharedData?.document?.id &&
      token &&
      hasInitializedDocument.current
    ) {
      webSocket.joinDocument(sharedData.document.id, token);
    }
  }, [webSocket.isConnected, sharedData?.document?.id, token, webSocket]);

  useEffect(() => {
    return () => {
      webSocket.leaveDocument();
      isSyncingRef.current = false;
    };
  }, [webSocket]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loadSharedDocument(password);
      setPasswordRequired(false);
    } catch (error) {
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1115]">
        <div className="text-white">Cargando documento compartido...</div>
      </div>
    );
  }

  if (error && !passwordRequired) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1115]">
        <div className="rounded-lg bg-red-900/20 border border-red-500 p-6 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1115]">
        <div className="w-full max-w-md rounded-lg bg-[#1a1a1a] p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Documento protegido</h2>
          <p className="text-gray-300 mb-4">
            Este documento requiere una contraseña para acceder.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña"
              className="w-full rounded bg-gray-700 p-3 text-white placeholder:text-gray-400"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Acceder"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!sharedData) return null;

  return (
  <div className="w-screen h-[100dvh] overflow-hidden bg-[#0f1115]">
    {/* CSS para ocultar scrollbar en todos los navegadores */}
    <style>
      {`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}
    </style>

    <UserPresence />

    <div className="flex h-full w-full flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside
          className={`shrink-0 border-r border-white/10 bg-[#0f1115]/95 backdrop-blur transition-[width] duration-200 overflow-hidden ${
            sidebarOpen ? "w-80" : "w-0"
          }`}
        >
          {sidebarOpen && (
            <div className="h-full overflow-y-auto">
              <TechnologyPanel
                onNodeSelect={(nodeType) => {
                  console.log("Arrastrando nodo:", nodeType);
                }}
                onCreateZone={handleCreateZone}
              />

              <RecommendedTechPanel
                selected={selectedZone}
                onAddTechnology={handleAddTechnology}
              />
            </div>
          )}
        </aside>

        {/* Canvas */}
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 pb-16">
            <ReactFlow
              key={
                activeSheetIdx !== null
                  ? `sheet-${sheets[activeSheetIdx]?.id}`
                  : `main-${sharedData.document?.id}`
              }
              nodes={displayNodes}
              edges={displayEdges}
              nodeTypes={allNodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDrag={onNodeDrag}
              fitView
              fitViewOptions={fitViewOptions}
              defaultEdgeOptions={defaultEdgeOptions}
              onInit={setRf}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onViewportChange={handleViewportChange}
              nodesDraggable={canEdit}
              nodesConnectable={canEdit}
              elementsSelectable={canEdit}
              onNodeClick={(_, node) => {
                if (node.type === "zone") {
                  setSelectedZone({
                    zoneKind: (node.data as any).kind as ZoneKind,
                    subzoneId: (node.data as any).id as string,
                  });
                } else {
                  setSelectedZone(null);
                }
              }}
            >
              <Background />
              <Controls />
              <MiniMap
                nodeColor={miniMapNodeColor}
                nodeStrokeColor={miniMapStrokeColor}
                nodeStrokeWidth={2}
                pannable
                zoomable
              />

              {/* Cursores de otros usuarios */}
              <UserCursors />

              <Panel position="top-left">
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#0f1115]/90 p-2">
                  <span className="px-2 py-1 text-white">
                    {title}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    {canEdit ? "Edición" : "Solo lectura"}
                  </span>

                  {saving && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-600/20 border border-yellow-500/30 px-2 py-1 text-xs text-yellow-300">
                      <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
                      Guardando...
                    </span>
                  )}
                </div>
              </Panel>

              <Panel position="top-right">
                <div className="flex gap-2 rounded-md border border-white/10 bg-[#0f1115]/90 p-2">
                  <button
                    onClick={() => setSidebarOpen((v) => !v)}
                    className="rounded-md border border-white/10 bg-[#171727] px-3 py-2 text-xs text-white hover:brightness-110"
                  >
                    {sidebarOpen
                      ? "Ocultar tecnologías"
                      : "Mostrar tecnologías"}
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="rounded-md border border-blue-500/20 bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700"
                  >
                    Crear tu propio diagrama
                  </button>
                </div>
              </Panel>
            </ReactFlow>
          </div>

          {/* Sheet Tabs - Mejorados */}
          {sheets.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <div className="flex items-center bg-[#0f1115] border-t border-white/10 px-4 py-2">
                {/* Contenedor de pestañas con scroll horizontal */}
                <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide flex-1 pr-4">
                  {sheets.map((sheet, index) => (
                    <button
                      key={sheet.id}
                      className={`relative min-w-[100px] px-3 py-2 text-sm font-medium rounded-t-lg border-t-2 transition-all duration-200 flex items-center gap-2 flex-shrink-0 ${
                        activeSheetIdx === index
                          ? "bg-blue-600 text-white border-blue-400 shadow-lg"
                          : "bg-[#1a1a1a] text-gray-300 border-transparent hover:bg-[#2a2a2a] hover:text-white"
                      }`}
                      onClick={() => handleSelectSheet(index)}
                    >
                      <span className="truncate">
                        {sheet.name || `Hoja ${index + 1}`}
                      </span>
                      
                      {/* Botón X más grande con círculo rojo centrado */}
                      {canEdit && sheets.length > 1 && (
                        <span
                          className="ml-1 flex items-center justify-center w-5 h-5 text-red-400 hover:text-white hover:bg-red-500 rounded-full transition-colors cursor-pointer font-bold flex-shrink-0"
                          style={{ fontSize: '14px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const sheetName = sheet.name || `Hoja ${index + 1}`;
                            if (window.confirm(`¿Eliminar "${sheetName}"?`)) {
                              handleDeleteSheet(sheet.id);
                            }
                          }}
                          title="Eliminar hoja"
                        >
                          ×
                        </span>
                      )}
                      
                      {activeSheetIdx === index && (
                        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Botón + para crear nueva hoja - Verde */}
                {canEdit && (
                  <button
                    className="flex items-center justify-center w-8 h-8 bg-gray-700 hover:bg-gray-600 text-green-500 rounded-full transition-colors duration-200 flex-shrink-0 ml-2"
                    onClick={() => handleCreateSheet(`Hoja ${sheets.length + 1}`)}
                    title="Crear nueva hoja"
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}