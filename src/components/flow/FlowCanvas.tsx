// src/components/flow/FlowCanvas.tsx
import type React from "react";

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
  type ReactFlowInstance,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { useAuth0 } from "@auth0/auth0-react";

import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";
import { TechnologyPanel } from "./TechnologyPanel";

import { useApi } from "../../hooks/useApi";
import { useDocumentStore, useDocumentsApi } from "../../hooks/useDocument";

import { useProject } from "../../hooks/useProject";
import type { DocumentData } from "../../models";
import { useTemplates } from "../../hooks/useTemplate";

import ShareModal from "../modals/ShareModal";
import { useSheets } from "../../hooks/useSheets";
import SheetTabs from "../modals/SheetTabs";

import { cloudZones } from "../data/CloudZones";
import { dmzZones } from "../data/DmzZones";
import { zoneTypes } from "./zones";
import { lanZones } from "../data/LanZones";
import { datacenterZones } from "../data/DatacenterZones";
import { otZones } from "../data/OtZones";
import RecommendedTechPanel from "./RecommendedTechPanel";
import type { Technology } from "../../mocks/technologies.types";
import type { ZoneKind } from "../data/zones";
import type { TechLike } from "../TechnicalSheet/TechDetailsPanel";
import TechDetailsPanel from "../TechnicalSheet/TechDetailsPanel";
import SubZoneModal from "../modals/SubZoneModal";
import EdgeStylePopover, { type EdgePreset } from "./edges/EdgeStylePopover";
import TitlePanel from "./TitlePanel";
import CanvasActionsPanel from "./CanvasActionsPanel";
import { exportGapPdf } from "../gap/ExportGapPdfButton";
import Toolbar from "./Toolbar";
import {
  fetchTechRequirements,
  type RequirementsMap,
} from "../../hooks/useTecnologies";
import { SWITCH_TECH, type SwitchPayload } from "./nodes/SwitchNode";
import CanvasHelpButtons from "./CanvasHelpButtons";
import { captureFlowAsPng } from "../gap/captureCanvas";

// Colab + Presencia
import { useCollabAdapter } from "../../hooks/useCollabAdapter";
import PresenceChips from "../collab/PresenceChips";
import CursorLayer from "../collab/CursorLayer";

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const fitViewOptions: FitViewOptions = { padding: 0.2 };
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "colorEdge",
  animated: false,
};
const onNodeDrag: OnNodeDrag = () => {};
const TOOLBAR_H = 60;
const allNodeTypes = { ...nodeTypes, ...zoneTypes };

type FlowCanvasProps = {
  mode?: "full" | "shared";
  initialPermission?: "read" | "edit";
  sharedToken?: string;
  sharedPassword?: string;
  documentIdOverride?: string;
};

export default function FlowCanvas({
  mode = "full",
  initialPermission = "edit",
  sharedToken,
  sharedPassword,
  documentIdOverride,
}: FlowCanvasProps) {
  const nav = useNavigate();
  const [selectedTech, setSelectedTech] = useState<TechLike | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const lastSavedRef = useRef<string>("");
  const flowContainerRef = useRef<HTMLDivElement | null>(null);

  type Snapshot = { nodes: Node[]; edges: Edge[] };
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const lastSnapRef = useRef<string>("");
  const canvasRef = useRef<HTMLDivElement>(null);

  // 👇 track versión última aplicada desde snapshot para evitar re-aplicar
  const lastAppliedVersionRef = useRef<number>(-1);

  // Estado del viewport para CursorLayer
  const [viewport, setViewport] = useState<{
    x: number;
    y: number;
    zoom: number;
  }>({
    x: 0,
    y: 0,
    zoom: 1,
  });

  // --- Edge selection (para editar estilos existentes) ---
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const lastSelectionRef = useRef<string[]>([]);
  const sameIds = (a: string[], b: string[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  const miniMapNodeColor = useCallback((n: Node) => {
    if (n.type === "zone") return (n.data as any)?.color ?? "#7c7c86";
    return "#94a3b8";
  }, []);
  const miniMapStrokeColor = useCallback((n: Node) => {
    return n.type === "zone" ? "#00000055" : "#00000033";
  }, []);

  // 1) documentId o modo borrador (query)
  const { documentId: paramId } = useParams<{ documentId?: string }>();
  const q = new URLSearchParams(useLocation().search);
  const documentId =
    documentIdOverride || paramId || q.get("doc") || q.get("id") || undefined;

  // En borrador vienen:
  const draftProjectId = q.get("projectId") || undefined;
  const draftTemplateId = q.get("templateId") || undefined;
  const draftTitleQ = q.get("title") || undefined;

  const { isAuthenticated, loginWithRedirect } = useAuth0();

  // Hooks de API
  const api = useApi();
  const documentsApi = useDocumentsApi();
  const templatesApi = useTemplates();
  const projectsApi = useProject();

  // Store
  const { doc, load, save, applyLocalPatch, setApiReady, setDoc } =
    useDocumentStore();

  // ---- ADAPTADOR DE COLAB ----
  const isShared = Boolean(mode === "shared" && sharedToken && documentId);
  const { snapshot, permission, sendChange, sendPresence, peers, connected } =
    useCollabAdapter(documentId, {
      mode: isShared ? "shared" : "normal",
      sharedToken,
      password: sharedPassword,
    });

  const effectivePermission = (permission ?? initialPermission) as
    | "read"
    | "edit";
  const readOnly = Boolean(isShared && effectivePermission === "read");

  // Inyecta axios real al store
  useEffect(() => {
    setApiReady(() => api);
  }, [api, setApiReady]);

  // Carga por API sólo en modo editor normal
  useEffect(() => {
    if (!documentId) return;
    if (mode === "shared") return;
    load(documentId);
  }, [documentId, load, mode]);

  // 👉 sync ref de versión cuando el doc del store cambie
  useEffect(() => {
    if (doc?.version != null) {
      lastAppliedVersionRef.current = doc.version;
    }
  }, [doc?.version]);

  // 👉 aplicar SIEMPRE el snapshot en vivo si su versión es más nueva
  useEffect(() => {
    if (!documentId || !snapshot) return;
    const incomingVersion = snapshot.version ?? 0;
    if (incomingVersion <= lastAppliedVersionRef.current) return;

    const current = useDocumentStore.getState().doc;
    const nextData = snapshot.data ?? { nodes: [], edges: [] };

    if (current) {
      setDoc({
        ...current,
        data: nextData,
        version: incomingVersion,
      });
    } else {
      setDoc({
        id: documentId,
        title: "",
        kind: "diagram",
        data: nextData,
        version: incomingVersion,
        templateId: null,
        isArchived: false,
        createdBy: "",
        projectId: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sheets: [],
      } as any);
    }

    lastAppliedVersionRef.current = incomingVersion;
  }, [documentId, snapshot?.version, snapshot?.data, setDoc]);

  useEffect(() => {
    if (!documentId) return;
    const currentDoc = useDocumentStore.getState().doc;
    if (currentDoc) {
      const cleanSnapshot = JSON.stringify({
        title: currentDoc.title ?? "",
        nodes: (currentDoc.data?.nodes as Node[]) ?? [],
        edges: (currentDoc.data?.edges as Edge[]) ?? [],
      });
      lastSavedRef.current = cleanSnapshot;
      setHasPendingChanges(false);
    }
  }, [documentId, doc?.version]);

  const storeNodes = useMemo<Node[]>(
    () => (doc?.data?.nodes as Node[]) ?? [],
    [doc]
  );
  const storeEdges = useMemo<Edge[]>(
    () => (doc?.data?.edges as Edge[]) ?? [],
    [doc]
  );
  const [draftNodes, setDraftNodes] = useState<Node[]>([]);
  const [draftEdges, setDraftEdges] = useState<Edge[]>([]);
  const [title, setTitle] = useState<string>("");

  const [sheetNodes, setSheetNodes] = useState<Node[]>([]);
  const [sheetEdges, setSheetEdges] = useState<Edge[]>([]);

  const [edgePreset, setEdgePreset] = useState<EdgePreset>({
    color: "security",
    thickness: "normal",
    dashed: false,
    animated: false,
  });

  const [sheets, setSheets] = useState<
    Record<string, { nodes: Node[]; edges: Edge[] }>
  >({});
  const sheetsRef = useRef(sheets);
  useEffect(() => {
    sheetsRef.current = sheets;
  }, [sheets]);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Sheets
  const { update, create: createSheet } = useSheets();
  const [activeSheet, setActiveSheet] = useState<any>(null);
  const [isChangingSheet, setIsChangingSheet] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  // Track viewport interaction
  const hasUserInteracted = useRef(false);
  const lastInteractionTime = useRef(0);
  const handleViewportChange = useCallback(() => {
    hasUserInteracted.current = true;
    lastInteractionTime.current = Date.now();
    setHasInteracted(true);
    if (rf) {
      // @ts-ignore
      const t =
        (rf as any)?.getViewport?.() || (rf as any)?.toObject?.()?.viewport;
      if (
        t &&
        typeof t.x === "number" &&
        typeof t.y === "number" &&
        typeof t.zoom === "number"
      ) {
        setViewport({ x: t.x, y: t.y, zoom: t.zoom });
      }
    }
  }, [rf]);

  // cargar plantilla (borrador)
  useEffect(() => {
    if (documentId) {
      setTitle(doc?.title ?? "");
      return;
    }
    setTitle(draftTitleQ || "Nuevo diagrama");
    (async () => {
      if (!draftTemplateId) {
        setDraftNodes(initialNodes);
        setDraftEdges(initialEdges);
        return;
      }
      try {
        const tpl = await templatesApi.get(String(draftTemplateId));
        const tplData = (tpl?.data ?? {}) as { nodes?: Node[]; edges?: Edge[] };
        const newNodes =
          Array.isArray(tplData.nodes) && tplData.nodes.length > 0
            ? tplData.nodes
            : initialNodes;
        const newEdges =
          Array.isArray(tplData.edges) && tplData.edges.length > 0
            ? tplData.edges
            : initialEdges;

        setDraftNodes(newNodes);
        setDraftEdges(newEdges);
        setHasInteracted(false);

        setTimeout(() => {
          if (rf && newNodes.length > 0) {
            rf.fitView({ padding: 0.2, duration: 300 });
          }
        }, 100);
      } catch {
        setDraftNodes(initialNodes);
        setDraftEdges(initialEdges);
      }
    })();
  }, [documentId, draftTemplateId, draftTitleQ, doc?.title]);

  // detectar cambios pendientes
  useEffect(() => {
    if (!documentId) return;
    const currentSnapshot = JSON.stringify({
      title,
      nodes: storeNodes,
      edges: storeEdges,
    });
    if (!lastSavedRef.current) lastSavedRef.current = currentSnapshot;
    setHasPendingChanges(currentSnapshot !== lastSavedRef.current);
  }, [documentId, title, storeNodes, storeEdges]);

  // cambio de hoja
  useEffect(() => {
    if (!activeSheet) {
      setSheetNodes([]);
      setSheetEdges([]);
      return;
    }
    setIsChangingSheet(true);
    try {
      const cached = sheetsRef.current[activeSheet.id];
      if (cached) {
        setSheetNodes(cached.nodes);
        setSheetEdges(cached.edges);
      } else {
        const newNodes = Array.isArray(activeSheet.data?.nodes)
          ? (activeSheet.data.nodes as Node[])
          : [];
        const newEdges = Array.isArray(activeSheet.data?.edges)
          ? (activeSheet.data.edges as Edge[])
          : [];
        setSheetNodes(newNodes);
        setSheetEdges(newEdges);
        setSheets((prev) => ({
          ...prev,
          [activeSheet.id]: { nodes: newNodes, edges: newEdges },
        }));
      }
      const timeSinceInteraction = Date.now() - lastInteractionTime.current;
      if (!hasUserInteracted.current || timeSinceInteraction > 3000) {
        setTimeout(() => rf?.fitView(fitViewOptions), 100);
      }
      setHasInteracted(false);
    } catch (err) {
      console.error("Error loading sheet data:", err);
      setSheetNodes([]);
      setSheetEdges([]);
    } finally {
      setIsChangingSheet(false);
    }
  }, [activeSheet, rf]);

  // 4) UI
  const [toolbarOpen, setToolbarOpen] = useState(true);

  // 5) Autosave
  const debouncedSave = useDebouncedCallback(() => {
    if (documentId) save();
  }, 1000);

  const persistSheet = useDebouncedCallback(
    async (nodes: Node[], edges: Edge[]) => {
      if (!activeSheet?.id) return;
      setSheets((prev) => ({
        ...prev,
        [activeSheet.id]: { nodes, edges },
      }));
      try {
        await update(activeSheet.id, { data: { nodes, edges } });
      } catch (e) {
        console.error("Error saving sheet:", e);
      }
    },
    1000
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (isChangingSheet) return;
      if (documentId && readOnly) return;

      pushHistory();
      if (activeSheet) {
        setSheetNodes((nds) => {
          const next = applyNodeChanges(changes, nds);
          persistSheet(next, sheetEdges);
          return next;
        });
      } else if (documentId) {
        const current = useDocumentStore.getState().doc;
        const currentNodes = (current?.data?.nodes as Node[]) ?? [];
        const nextNodes = applyNodeChanges(changes, currentNodes);
        const patch = { nodes: nextNodes };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftNodes((nds) => applyNodeChanges(changes, nds));
      }
    },
    [
      documentId,
      readOnly,
      applyLocalPatch,
      sendChange,
      activeSheet,
      sheetEdges,
      persistSheet,
      isChangingSheet,
      debouncedSave,
    ]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (isChangingSheet) return;
      if (documentId && readOnly) return;

      pushHistory();
      if (activeSheet) {
        setSheetEdges((eds) => {
          const next = applyEdgeChanges(changes, eds);
          persistSheet(sheetNodes, next);
          return next;
        });
      } else if (documentId) {
        const current = useDocumentStore.getState().doc;
        const currentEdges = (current?.data?.edges as Edge[]) ?? [];
        const nextEdges = applyEdgeChanges(changes, currentEdges);
        const patch = { edges: nextEdges };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftEdges((eds) => applyEdgeChanges(changes, eds));
      }
    },
    [
      documentId,
      readOnly,
      applyLocalPatch,
      sendChange,
      activeSheet,
      sheetNodes,
      persistSheet,
      isChangingSheet,
      debouncedSave,
    ]
  );

  const makeSnapshot = useCallback((): Snapshot => {
    const nodes = activeSheet
      ? sheetNodes
      : documentId
      ? storeNodes
      : draftNodes;
    const edges = activeSheet
      ? sheetEdges
      : documentId
      ? storeEdges
      : draftEdges;
    return { nodes, edges };
  }, [
    activeSheet,
    sheetNodes,
    sheetEdges,
    documentId,
    storeNodes,
    storeEdges,
    draftNodes,
    draftEdges,
  ]);

  const applySnapshot = useCallback(
    (s: Snapshot) => {
      if (activeSheet) {
        setSheetNodes(s.nodes);
        setSheetEdges(s.edges);
        persistSheet(s.nodes, s.edges);
      } else if (documentId) {
        if (readOnly) return;
        const patch = { nodes: s.nodes, edges: s.edges };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftNodes(s.nodes);
        setDraftEdges(s.edges);
      }
    },
    [
      activeSheet,
      documentId,
      readOnly,
      applyLocalPatch,
      sendChange,
      debouncedSave,
      persistSheet,
    ]
  );

  const pushHistory = useCallback(() => {
    const snap = makeSnapshot();
    const key = JSON.stringify({ n: snap.nodes, e: snap.edges });
    if (key === lastSnapRef.current) return;
    lastSnapRef.current = key;
    setPast((p) => [...p, snap]);
    setFuture([]);
  }, [makeSnapshot]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      const newPast = p.slice(0, -1);
      setFuture((f) => [makeSnapshot(), ...f]);
      applySnapshot(prev);
      lastSnapRef.current = JSON.stringify({ n: prev.nodes, e: prev.edges });
      return newPast;
    });
  }, [applySnapshot, makeSnapshot]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      const newFuture = f.slice(1);
      setPast((p) => [...p, makeSnapshot()]);
      applySnapshot(next);
      lastSnapRef.current = JSON.stringify({ n: next.nodes, e: next.edges });
      return newFuture;
    });
  }, [applySnapshot, makeSnapshot]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const toggleDeleteMode = useCallback(() => setIsDeleteMode((v) => !v), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDeleteMode) {
        setIsDeleteMode(false);
      }
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlOrCmd && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      } else if (
        (ctrlOrCmd && e.key.toLowerCase() === "y") ||
        (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDeleteMode, canUndo, canRedo, undo, redo]);

  // Aplica preset a edges seleccionadas
  const applyPresetToSelectedEdges = useCallback(
    (preset: EdgePreset) => {
      if (!selectedEdgeIds.length) return;
      if (documentId && readOnly) return;

      pushHistory();

      const mapEdge = (e: Edge): Edge =>
        selectedEdgeIds.includes(e.id)
          ? {
              ...e,
              type: "colorEdge",
              animated: preset.animated,
              data: { ...(e.data ?? {}), ...preset },
            }
          : e;

      if (activeSheet) {
        setSheetEdges((eds) => {
          const next = eds.map(mapEdge);
          persistSheet(sheetNodes, next);
          return next;
        });
      } else if (documentId) {
        const current = useDocumentStore.getState().doc;
        const currentEdges = (current?.data?.edges as Edge[]) ?? [];
        const nextEdges = currentEdges.map(mapEdge);
        const patch = { edges: nextEdges };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftEdges((eds) => eds.map(mapEdge));
      }
    },
    [
      selectedEdgeIds,
      documentId,
      readOnly,
      activeSheet,
      sheetNodes,
      persistSheet,
      applyLocalPatch,
      sendChange,
      debouncedSave,
      pushHistory,
    ]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (documentId && readOnly) return;

      const payload = {
        ...connection,
        type: "colorEdge",
        animated: edgePreset.animated,
        data: edgePreset,
      };

      pushHistory();

      if (activeSheet) {
        setSheetEdges((eds) => {
          const next = addEdge(payload, eds);
          persistSheet(sheetNodes, next);
          return next;
        });
      } else if (documentId) {
        const current = useDocumentStore.getState().doc;
        const currentEdges = (current?.data?.edges as Edge[]) ?? [];
        const nextEdges = addEdge(payload, currentEdges);
        const patch = { edges: nextEdges };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftEdges((eds) => addEdge(payload, eds));
      }
    },
    [
      documentId,
      readOnly,
      activeSheet,
      sheetNodes,
      persistSheet,
      applyLocalPatch,
      sendChange,
      edgePreset,
      debouncedSave,
      pushHistory,
    ]
  );

  const handleTitleInput = useCallback(
    (v: string) => {
      setTitle(v);
      if (documentId) {
        if (readOnly) return;
        const current = useDocumentStore.getState().doc;
        if (current) setDoc({ ...current, title: v });
        debouncedSave();
      }
    },
    [documentId, readOnly, setDoc, debouncedSave]
  );

  useEffect(() => {
    if (!documentId) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [documentId, hasPendingChanges]);

  // Guardar / Crear
  const [isSaving, setIsSaving] = useState(false);
  const { update: _ignoreUpdateTpl } = useTemplates();

  const createInitialSheet = useCallback(
    async (docId: string) => {
      try {
        const sheet = await createSheet(docId, {
          name: "Hoja 1",
          data: { nodes: draftNodes, edges: draftEdges },
        });
        setSheets((prev) => ({
          ...prev,
          [sheet.id]: { nodes: draftNodes, edges: draftEdges },
        }));
        load(docId);
      } catch (error) {
        console.error("Error creando hoja inicial:", error);
      }
    },
    [draftNodes, draftEdges, createSheet, load]
  );

  const handleSave = useCallback(async () => {
    // En modo compartido no hay guardado manual; los cambios persisten vía socket/back
    if (mode === "shared") return;

    if (!isAuthenticated) {
      await loginWithRedirect({
        appState: {
          returnTo: window.location.pathname + window.location.search,
        },
      });
      return;
    }

    if (documentId) {
      if (readOnly) return;
      setIsSaving(true);
      try {
        await save();
        const current = useDocumentStore.getState().doc;
        const cleanSnapshot = JSON.stringify({
          title: current?.title ?? title,
          nodes: (current?.data?.nodes as Node[]) ?? [],
          edges: (current?.data?.edges as Edge[]) ?? [],
        });
        lastSavedRef.current = cleanSnapshot;
        setHasPendingChanges(false);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Borrador → asegurar projectId
    let projectId = draftProjectId ?? undefined;
    if (!projectId) {
      try {
        const project = await projectsApi.ensureDefault("My Diagrams");
        projectId = project.id;
      } catch (e) {
        console.error(e);
        alert("No se pudo preparar el proyecto para guardar el documento.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: DocumentData = { nodes: draftNodes, edges: draftEdges };
      const created = await documentsApi.createBlank({
        projectId: projectId!,
        title: title || "Sin título",
      });
      const updated = await documentsApi.update({
        id: created.id,
        version: created.version,
        data: payload,
        title: title || created.title,
      });
      await createInitialSheet(updated.id);
      nav(`/Board/${updated.id}`, { replace: true });
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar. Revisa la consola.");
    } finally {
      setIsSaving(false);
    }
  }, [
    mode,
    isAuthenticated,
    loginWithRedirect,
    documentId,
    readOnly,
    save,
    draftProjectId,
    title,
    draftNodes,
    draftEdges,
    documentsApi,
    projectsApi,
    nav,
    createInitialSheet,
  ]);

  // Actualizar Template
  const [isUpdatingTpl, setIsUpdatingTpl] = useState(false);
  const showUpdateTemplate = !documentId && !!draftTemplateId;

  const handleUpdateTemplate = useCallback(async () => {
    if (!isAuthenticated) {
      await loginWithRedirect({
        appState: {
          returnTo: window.location.pathname + window.location.search,
        },
      });
      return;
    }
    if (!draftTemplateId) {
      alert("No hay templateId en la URL.");
      return;
    }
    setIsUpdatingTpl(true);
    try {
      const tpl = await templatesApi.get(String(draftTemplateId));
      await templatesApi.update(String(draftTemplateId), {
        version: Number(tpl.version ?? 0),
        data: { nodes: draftNodes, edges: draftEdges },
        title: title || tpl.title || "Plantilla",
      });
      alert("Plantilla actualizada");
    } catch (e: any) {
      if (e?.response?.status === 409) {
        alert("Conflicto de versión. Recarga la página e inténtalo de nuevo.");
      } else {
        console.error(e);
        alert("No se pudo actualizar la plantilla.");
      }
    } finally {
      setIsUpdatingTpl(false);
    }
  }, [
    isAuthenticated,
    loginWithRedirect,
    draftTemplateId,
    templatesApi,
    draftNodes,
    draftEdges,
    title,
  ]);

  // Nodos/edges visibles según contexto
  const displayNodes = useMemo(() => {
    return activeSheet ? sheetNodes : documentId ? storeNodes : draftNodes;
  }, [activeSheet, sheetNodes, documentId, storeNodes, draftNodes]);
  const displayEdges = useMemo(() => {
    return activeSheet ? sheetEdges : documentId ? storeEdges : draftEdges;
  }, [activeSheet, sheetEdges, documentId, storeEdges, draftEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  useEffect(() => {
    if (draftTemplateId && !hasInteracted) {
      const timer = setTimeout(() => {
        if (rf && displayNodes.length > 0) rf.fitView(fitViewOptions);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [draftTemplateId, rf, displayNodes, hasInteracted]);

  useEffect(() => {
    if (activeSheet && !hasInteracted) {
      const timer = setTimeout(() => {
        if (rf && displayNodes.length > 0) rf.fitView(fitViewOptions);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeSheet, rf, displayNodes, hasInteracted]);

  // Helpers zonas
  const clickCreateOffsetRef = useRef(0);
  type ZoneTpl = {
    id: string;
    name: string;
    description?: string;
    color: string;
    kind: ZoneKind;
  };

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
          kind: tpl.kind,
          title: "",
          onRename: (nodeId: string, newTitle: string) => {
            if (activeSheet) {
              setSheetNodes((nds) => {
                const next = nds.map((n) =>
                  n.id === nodeId
                    ? { ...n, data: { ...n.data, title: newTitle } }
                    : n
                );
                persistSheet(next, sheetEdges);
                return next;
              });
            } else if (documentId) {
              if (readOnly) return;
              const current = useDocumentStore.getState().doc;
              const currentNodes = (current?.data?.nodes as Node[]) ?? [];
              const nextNodes = currentNodes.map((n) =>
                n.id === nodeId
                  ? { ...n, data: { ...n.data, title: newTitle } }
                  : n
              );
              const patch = { nodes: nextNodes };
              applyLocalPatch(patch);
              sendChange(patch);
              debouncedSave();
            } else {
              setDraftNodes((nds) =>
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
    [
      activeSheet,
      sheetEdges,
      documentId,
      readOnly,
      applyLocalPatch,
      sendChange,
      persistSheet,
      debouncedSave,
    ]
  );

  const handleCreateZone = useCallback(
    (templateId: string) => {
      const tpl = getSubZoneTemplateById(templateId);
      if (!tpl) return;

      const baseX = toolbarOpen
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

      if (documentId && readOnly) return;

      pushHistory();

      if (activeSheet) {
        setSheetNodes((nds) => {
          const next = [...nds, newNode];
          persistSheet(next, sheetEdges);
          return next;
        });
      } else if (documentId) {
        const current = useDocumentStore.getState().doc;
        const currentNodes = (current?.data?.nodes as Node[]) ?? [];
        const nextNodes = [...currentNodes, newNode];
        const patch = { nodes: nextNodes };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftNodes((nds) => nds.concat(newNode));
      }
    },
    [
      rf,
      toolbarOpen,
      activeSheet,
      sheetEdges,
      documentId,
      readOnly,
      applyLocalPatch,
      sendChange,
      persistSheet,
      getSubZoneTemplateById,
      createZoneNodeFromTemplate,
      debouncedSave,
      pushHistory,
    ]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!rf) return;
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
          /* not json */
        }
      }
      if (!newNode) {
        const nodeType = raw || txt || "default";
        const allNodes = activeSheet
          ? sheetNodes
          : documentId
          ? (useDocumentStore.getState().doc?.data?.nodes as Node[]) ?? []
          : draftNodes;

        const zones = allNodes.filter((n) => n.type === "zone");
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
      if (documentId && readOnly) return;

      pushHistory();

      if (activeSheet) {
        setSheetNodes((nds) => {
          const next = [...nds, newNode!];
          persistSheet(next, sheetEdges);
          return next;
        });
      } else if (documentId) {
        const current = useDocumentStore.getState().doc;
        const currentNodes = (current?.data?.nodes as Node[]) ?? [];
        const nextNodes = [...currentNodes, newNode];
        const patch = { nodes: nextNodes };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftNodes((nds) => nds.concat(newNode!));
      }
    },
    [
      rf,
      activeSheet,
      sheetNodes,
      sheetEdges,
      documentId,
      readOnly,
      draftNodes,
      applyLocalPatch,
      sendChange,
      persistSheet,
      getSubZoneTemplateById,
      createZoneNodeFromTemplate,
      debouncedSave,
      pushHistory,
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

  // --- Selección de zona + inserción de tecnologías ---
  const [selectedZone, setSelectedZone] = useState<{
    zoneKind: ZoneKind;
    subzoneId: string;
  } | null>(null);

  const handleAddTechnology = useCallback(
    (t: Technology) => {
      if (!selectedZone) return;

      const allNodes = activeSheet
        ? sheetNodes
        : documentId
        ? storeNodes
        : draftNodes;
      const parent = allNodes.find(
        (n) =>
          n.type === "zone" && (n.data as any)?.id === selectedZone.subzoneId
      );
      if (!parent) return;

      const rel = { x: 40 + Math.random() * 120, y: 40 + Math.random() * 80 };
      const techNode: Node = {
        id: `tech-${Date.now()}`,
        type: "tech",
        position: rel,
        parentId: parent.id,
        extent: "parent",
        data: { ...t, ZoneKind: selectedZone.zoneKind },
        zIndex: 1,
      };

      if (documentId && readOnly) return;

      pushHistory();

      if (activeSheet) {
        setSheetNodes((nds) => {
          const next = [...nds, techNode];
          persistSheet(next, sheetEdges);
          return next;
        });
      } else if (documentId) {
        const current = useDocumentStore.getState().doc;
        const currentNodes = (current?.data?.nodes as Node[]) ?? [];
        const patch = { nodes: [...currentNodes, techNode] };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftNodes((nds) => nds.concat(techNode));
      }
    },
    [
      selectedZone,
      documentId,
      readOnly,
      activeSheet,
      sheetNodes,
      sheetEdges,
      storeNodes,
      draftNodes,
      persistSheet,
      applyLocalPatch,
      sendChange,
      debouncedSave,
      pushHistory,
    ]
  );

  const handleAddSwitch = useCallback(() => {
    if (!rf) return;
    if (documentId && readOnly) return;

    const pt = rf.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const data: SwitchPayload = { kind: "switch", technology: SWITCH_TECH };
    const node: Node = {
      id: `switch-${Date.now()}`,
      type: "switch",
      position: { x: pt.x - 60, y: pt.y - 20 },
      data: data as unknown as Record<string, unknown>,
      zIndex: 1,
    };

    pushHistory();

    if (activeSheet) {
      setSheetNodes((nds) => {
        const next = [...nds, node];
        persistSheet(next, sheetEdges);
        return next;
      });
    } else if (documentId) {
      const current = useDocumentStore.getState().doc;
      const currentNodes = (current?.data?.nodes as Node[]) ?? [];
      const patch = { nodes: [...currentNodes, node] };
      applyLocalPatch(patch);
      sendChange(patch);
      debouncedSave();
    } else {
      setDraftNodes((nds) => nds.concat(node));
    }
  }, [
    rf,
    documentId,
    readOnly,
    activeSheet,
    sheetEdges,
    persistSheet,
    applyLocalPatch,
    sendChange,
    debouncedSave,
    setDraftNodes,
    setSheetNodes,
    pushHistory,
  ]);

  const [isEdgeStyleBarVisible, setIsEdgeStyleBarVisible] = useState(false);
  const [isCanvasActionsPanelVisible, setIsCanvasActionsPanelVisible] =
    useState(false);

  const [reqs, setReqs] = useState<RequirementsMap | null>(null);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    const ids = (displayNodes ?? [])
      .filter((n) => n.type === "zone")
      .map((n) => String(n?.data?.id))
      .filter(Boolean);
    const key = Array.from(new Set(ids)).sort().join("|");
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    if (!key) {
      setReqs(null);
      return;
    }
    let cancelled = false;
    fetchTechRequirements({ subzones: key.split("|") })
      .then((r) => !cancelled && setReqs(r))
      .catch((e) => {
        console.error("Error cargando requirements:", e);
        if (!cancelled) setReqs({});
      });
    return () => {
      cancelled = true;
    };
  }, [displayNodes]);

  const handleExportPdf = useCallback(async () => {
    let map = reqs;
    if (!map) {
      const zoneIds = Array.from(
        new Set(
          (displayNodes ?? [])
            .filter((n) => n.type === "zone")
            .map((n) => String((n.data as any)?.id))
            .filter(Boolean)
        )
      );
      map = zoneIds.length
        ? await fetchTechRequirements({ subzones: zoneIds })
        : {};
    }
    await exportGapPdf(displayNodes, map!);
  }, [displayNodes, reqs]);

  const handleShowTools = () => {
    setToolbarOpen(true);
    setIsCanvasActionsPanelVisible(false);
  };

  const handleSelectionChange = useCallback(
    ({ edges }: { nodes: Node[]; edges: Edge[] }) => {
      const next = edges.map((e) => e.id).sort();
      const prev = lastSelectionRef.current;
      if (sameIds(prev, next)) return;
      lastSelectionRef.current = next;
      setSelectedEdgeIds(next);
    },
    []
  );

  const deleteEdgesById = useCallback(
    (ids: string[]) => {
      if (documentId && readOnly) return;

      pushHistory();
      const apply = (edges: Edge[]) => edges.filter((e) => !ids.includes(e.id));

      if (activeSheet) {
        setSheetEdges((eds) => {
          const next = apply(eds);
          persistSheet(sheetNodes, next);
          return next;
        });
      } else if (documentId) {
        const current = useDocumentStore.getState().doc;
        const currEdges = (current?.data?.edges as Edge[]) ?? [];
        const nextEdges = apply(currEdges);
        const patch = { edges: nextEdges };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftEdges((eds) => apply(eds));
      }
    },
    [
      documentId,
      readOnly,
      activeSheet,
      sheetNodes,
      persistSheet,
      applyLocalPatch,
      sendChange,
      debouncedSave,
      pushHistory,
    ]
  );

  const deleteNodesById = useCallback(
    (ids: string[]) => {
      if (documentId && readOnly) return;

      pushHistory();

      const apply = (nodes: Node[], edges: Edge[]) => {
        const nodeIdSet = new Set(ids);
        const nextNodes = nodes.filter((n) => !nodeIdSet.has(n.id));
        const nextEdges = edges.filter(
          (e) => !nodeIdSet.has(e.source) && !nodeIdSet.has(e.target)
        );
        return { nodes: nextNodes, edges: nextEdges };
      };

      if (activeSheet) {
        setSheetNodes((nds) => {
          const result = apply(nds, sheetEdges);
          setSheetEdges(result.edges);
          persistSheet(result.nodes, result.edges);
          return result.nodes;
        });
      } else if (documentId) {
        const current = useDocumentStore.getState().doc;
        const currNodes = (current?.data?.nodes as Node[]) ?? [];
        const currEdges = (current?.data?.edges as Edge[]) ?? [];
        const result = apply(currNodes, currEdges);
        const patch = { nodes: result.nodes, edges: result.edges };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftNodes((nds) => {
          const result = apply(nds, draftEdges);
          setDraftEdges(result.edges);
          return result.nodes;
        });
      }
    },
    [
      documentId,
      readOnly,
      activeSheet,
      sheetEdges,
      persistSheet,
      applyLocalPatch,
      sendChange,
      debouncedSave,
      draftEdges,
      pushHistory,
    ]
  );

  const handleExportImage = useCallback(async () => {
    if (!flowContainerRef.current) return;
    await captureFlowAsPng(flowContainerRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      padding: 16,
      downloadFileName: `${(title || "diagrama").trim() || "diagrama"}.png`,
    });
  }, [title]);

  // 👇 Enviar presencia en coords del diagrama (no de pantalla)
  useEffect(() => {
    if (!documentId || !rf) return;
    const onMove = (e: MouseEvent) => {
      const flowPos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      sendPresence({ cursor: { x: flowPos.x, y: flowPos.y } });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [documentId, sendPresence, rf]);

  // Helpers para mostrar presencia: mapeamos peers -> CursorLayer
  const remoteCursors = useMemo(() => {
    const list: {
      userId: string;
      x: number;
      y: number;
      name: string;
      color: string;
    }[] = [];
    const entries = Object.values(peers || {});
    for (const p of entries as any[]) {
      if (!p?.cursor) continue;
      const userId = p.userSub || "guest";
      const name =
        (p.profileName as string) ||
        (userId.startsWith("guest:") ? "Invitado" : userId.slice(0, 6));
      const color = colorFromId(userId);
      list.push({ userId, x: p.cursor.x, y: p.cursor.y, name, color });
    }
    return list;
  }, [peers]);

  const presenceUsers = useMemo(() => {
    const entries = Object.values(peers || {});
    return (entries as any[]).map((p) => ({
      id: p.userSub || "guest",
      name:
        (p.profileName as string) ||
        ((p.userSub as string) ? (p.userSub as string).slice(0, 6) : "guest"),
      color: colorFromId(p.userSub || "guest"),
    }));
  }, [peers]);

  const connStatus: "connected" | "connecting" | "disconnected" | "error" =
    connected ? "connected" : "connecting";

  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-slate-50">
      <style>
        {`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .react-flow__container,.react-flow__renderer,.react-flow__pane { z-index: 0 !important; }
        .tooltip-high-z { z-index: 9999 !important; }
      `}
      </style>

      <div className="flex h-full w-full flex-col">
        <header
          className="border-b border-slate-200 bg-white/90 backdrop-blur transition-[height] duration-200 relative"
          style={{ height: toolbarOpen ? TOOLBAR_H : 0 }}
        >
          {toolbarOpen && (
            <Toolbar
              onSave={handleSave}
              saving={isSaving}
              canUpdateTemplate={showUpdateTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              updatingTemplate={isUpdatingTpl}
              isDraft={!documentId}
              hasPendingChanges={documentId ? hasPendingChanges : false}
              isEdgeStyleBarVisible={isEdgeStyleBarVisible}
              onToggleEdgeStyleBar={() => setIsEdgeStyleBarVisible((v) => !v)}
              isCanvasActionsPanelVisible={isCanvasActionsPanelVisible}
              toolbarOpen={toolbarOpen}
              onToggleTools={() => setToolbarOpen((v) => !v)}
              onToggleCanvasActionsPanel={() =>
                setIsCanvasActionsPanelVisible((v) => !v)
              }
              onExportPdf={handleExportPdf}
              onExportImg={handleExportImage}
              onOpenShare={() => setShareModalOpen(true)}
              onOpenInfo={() => setInfoModalOpen(true)}
            />
          )}
        </header>

        <div className="flex min-h-0 flex-1">
          <aside
            className={`shrink-0 border-r border-slate-200 bg-white/90 transition-[width] duration-200 overflow-hidden ${
              toolbarOpen ? "w-85" : "w-0"
            }`}
          >
            <div className="h-full flex flex-col">
              <div className="overflow-hidden">
                <TechnologyPanel
                  onNodeSelect={(nodeType) => {
                    console.log("Arrastrando nodo:", nodeType);
                  }}
                  onCreateZone={handleCreateZone}
                />
              </div>
            </div>
          </aside>

          <div className="relative min-h-0 flex-1" ref={flowContainerRef}>
            <div ref={canvasRef} className="absolute inset-0 pb-10">
              <ReactFlow
                key={
                  activeSheet
                    ? `sheet-${activeSheet.id}`
                    : documentId
                    ? `doc-${documentId}`
                    : "draft"
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
                onInit={(inst) => {
                  setRf(inst);
                  try {
                    // @ts-ignore
                    const t =
                      (inst as any)?.getViewport?.() ||
                      (inst as any)?.toObject?.()?.viewport;
                    if (t) setViewport({ x: t.x, y: t.y, zoom: t.zoom });

                    // presencia inicial en el centro
                    const mid = inst.screenToFlowPosition({
                      x: window.innerWidth / 2,
                      y: window.innerHeight / 2,
                    });
                    sendPresence({ cursor: { x: mid.x, y: mid.y } });
                  } catch {}
                }}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onViewportChange={handleViewportChange}
                onNodeClick={(_, node) => {
                  if (isDeleteMode) {
                    deleteNodesById([node.id]);
                    return;
                  }
                  if (node.type === "zone") {
                    setSelectedZone({
                      zoneKind: (node.data as any).kind as ZoneKind,
                      subzoneId: (node.data as any).id as string,
                    });
                    setSelectedTech(null);
                  } else if (node.type === "tech") {
                    setSelectedZone(null);
                    setSelectedTech(node.data as any);
                  } else {
                    setSelectedZone(null);
                    setSelectedTech(null);
                  }
                }}
                onEdgeClick={(_, edge) => {
                  if (isDeleteMode) {
                    deleteEdgesById([edge.id]);
                    return;
                  }
                  const one = [edge.id];
                  if (!sameIds(lastSelectionRef.current, one)) {
                    lastSelectionRef.current = one;
                    setSelectedEdgeIds(one);
                  }
                  setIsEdgeStyleBarVisible(true);
                }}
                onSelectionChange={handleSelectionChange}
              >
                <Background size={2} />
                <Controls />
                <MiniMap
                  nodeColor={miniMapNodeColor}
                  nodeStrokeColor={miniMapStrokeColor}
                  nodeStrokeWidth={2}
                  pannable
                  zoomable
                  style={{ backgroundColor: "#ffffff" }}
                />

                <Panel position="top-left" className="pointer-events-auto">
                  <div className="flex flex-wrap items-center gap-2">
                    <TitlePanel
                      title={title}
                      onChangeTitle={handleTitleInput}
                      isDraft={!documentId}
                    />

                    <CanvasHelpButtons
                      onToggleEdgeStyleBar={() =>
                        setIsEdgeStyleBarVisible((v) => !v)
                      }
                      isEdgeStyleBarVisible={isEdgeStyleBarVisible}
                      onToggleDeleteMode={toggleDeleteMode}
                      isDeleteMode={isDeleteMode}
                      onUndo={undo}
                      onRedo={redo}
                      canUndo={canUndo}
                      canRedo={canRedo}
                    />
                  </div>
                </Panel>

                <CanvasActionsPanel
                  open={isCanvasActionsPanelVisible}
                  onClose={() => setIsCanvasActionsPanelVisible(false)}
                  toolbarOpen={toolbarOpen}
                  onToggleTools={() => setToolbarOpen((v) => !v)}
                  onShowTools={handleShowTools}
                />
              </ReactFlow>

              {/* Presencia visual integrada */}
              <PresenceChips users={presenceUsers} status={connStatus} />
              <CursorLayer cursors={remoteCursors} viewport={viewport} />

              <TechDetailsPanel
                tech={selectedTech}
                onClose={() => setSelectedTech(null)}
              />

              <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                documentId={documentId || ""}
              />

              {documentId && (
                <SheetTabs
                  documentId={documentId}
                  activeSheetId={activeSheet?.id || null}
                  onSheetChange={(sheet) => setActiveSheet(sheet)}
                />
              )}

              <SubZoneModal
                isOpen={infoModalOpen}
                onClose={() => setInfoModalOpen(false)}
                title="Información de las zonas"
              />

              <EdgeStylePopover
                open={isEdgeStyleBarVisible}
                value={edgePreset}
                onChange={(p) => {
                  setEdgePreset(p);
                  applyPresetToSelectedEdges(p);
                }}
                onClose={() => setIsEdgeStyleBarVisible(false)}
                onAddSwitch={handleAddSwitch}
              />

              <RecommendedTechPanel
                selected={selectedZone}
                onAddTechnology={handleAddTechnology}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Color determinista por usuario (para chips/cursor) */
function colorFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 70%, 45%)`;
}
