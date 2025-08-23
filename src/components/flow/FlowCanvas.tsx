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
  Panel,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { useAuth0 } from "@auth0/auth0-react";

import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";
import { TechnologyPanel } from "./TechnologyPanel";
import Toolbar from "./Toolbar";

import { useCollab } from "../../hooks/useCollab";
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

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const fitViewOptions: FitViewOptions = { padding: 0.2 };
const defaultEdgeOptions: DefaultEdgeOptions = { animated: true };
const onNodeDrag: OnNodeDrag = () => {};
const TOOLBAR_H = 65;

const allNodeTypes = { ...nodeTypes, ...zoneTypes };

// Kinds que usaremos en zonas nuevas
type ZoneKind = "cloud" | "dmz" | "lan" | "datacenter" | "ot";

export default function FlowCanvas() {
  const nav = useNavigate();

  const miniMapNodeColor = useCallback((n: Node) => {
    if (n.type === "zone") {
      return (n.data as any)?.color ?? "#7c7c86";
    }
    return "#94a3b8";
  }, []);

  const miniMapStrokeColor = useCallback((n: Node) => {
    return n.type === "zone" ? "#FFFFFF66" : "#00000033";
  }, []);

  // 1) documentId o modo borrador (query)
  const { documentId: paramId } = useParams<{ documentId?: string }>();
  const q = new URLSearchParams(useLocation().search);
  const documentId = paramId || q.get("doc") || q.get("id") || undefined;

  // En borrador vienen:
  const draftProjectId = q.get("projectId") || undefined;
  const draftTemplateId = q.get("templateId") || undefined;
  const draftTitleQ = q.get("title") || undefined;

  const { isAuthenticated, loginWithRedirect } = useAuth0();

  // Hooks de API
  const api = useApi(); // para inyectar en el store
  const documentsApi = useDocumentsApi();
  const templatesApi = useTemplates();
  const projectsApi = useProject();

  // Store + colab (solo cuando hay documentId)
  const { doc, load, save, applyLocalPatch, setApiReady, setDoc } =
    useDocumentStore();
  const { sendChange: collabSendChange } = useCollab(documentId);
  const sendChange = documentId ? collabSendChange : (_p: any) => {};

  // Inyecta axios real al store (necesario para save/load internos del store)
  useEffect(() => {
    setApiReady(() => api);
  }, [api, setApiReady]);

  useEffect(() => {
    if (documentId) load(documentId);
  }, [documentId, load]);

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

  const [sheets, setSheets] = useState<
    Record<string, { nodes: Node[]; edges: Edge[] }>
  >({});

  const sheetsRef = useRef(sheets);
  useEffect(() => {
    sheetsRef.current = sheets;
  }, [sheets]);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  // Sheets
  const { update, create: createSheet } = useSheets(); // Agregado create para crear hojas
  const [activeSheet, setActiveSheet] = useState<any>(null);
  const [isChangingSheet, setIsChangingSheet] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  // Track if user has interacted with the viewport manually
  const hasUserInteracted = useRef(false);
  const lastInteractionTime = useRef(0);

  // Handler para detectar interacción del usuario
  const handleViewportChange = useCallback(() => {
    hasUserInteracted.current = true;
    lastInteractionTime.current = Date.now();
    setHasInteracted(true);
  }, []);

  // cargar plantilla (borrador) con useTemplates()
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

        // Reset interaction flag when loading template to allow auto-fit
        setHasInteracted(false);

        // Forzar un nuevo renderizado y ajuste de vista después de cargar la plantilla
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

  // Handle sheet changes with improved fitView logic
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
        // guarda en caché para futuros switches
        setSheets((prev) => ({
          ...prev,
          [activeSheet.id]: { nodes: newNodes, edges: newEdges },
        }));
      }

      // Solo auto-fit si el usuario no interactuó recientemente
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
    // 🔴 Importante: NO dependemos de `sheets` aquí para evitar re-fit en cada autosave
  }, [activeSheet, rf]);

  // 4) UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toolbarOpen, setToolbarOpen] = useState(true);

  // 5) Autosave solo en persistido
  const debouncedSave = useDebouncedCallback(() => {
    if (documentId) save();
  }, 1000);

  const persistSheet = useDebouncedCallback(
    async (nodes: Node[], edges: Edge[]) => {
      if (!activeSheet?.id) return;

      // Update local state immediately for instant UI updates
      setSheets((prev) => ({
        ...prev,
        [activeSheet.id]: { nodes, edges },
      }));

      try {
        // Then persist to database
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
      applyLocalPatch,
      sendChange,
      debouncedSave,
      activeSheet,
      sheetEdges,
      persistSheet,
      isChangingSheet,
    ]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (isChangingSheet) return;

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
      applyLocalPatch,
      sendChange,
      debouncedSave,
      activeSheet,
      sheetNodes,
      persistSheet,
      isChangingSheet,
    ]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (isChangingSheet) return;

      if (activeSheet) {
        setSheetEdges((eds) => {
          const next = addEdge(
            { ...connection, type: "secure", animated: true },
            eds
          );
          persistSheet(sheetNodes, next);
          return next;
        });
      } else if (documentId) {
        const current = useDocumentStore.getState().doc;
        const currentEdges = (current?.data?.edges as Edge[]) ?? [];
        const nextEdges = addEdge(
          { ...connection, type: "secure", animated: true },
          currentEdges
        );
        const patch = { edges: nextEdges };
        applyLocalPatch(patch);
        sendChange(patch);
        debouncedSave();
      } else {
        setDraftEdges((eds) =>
          addEdge({ ...connection, type: "secure", animated: true }, eds)
        );
      }
    },
    [
      documentId,
      applyLocalPatch,
      sendChange,
      debouncedSave,
      activeSheet,
      sheetNodes,
      persistSheet,
      isChangingSheet,
    ]
  );

  const handleTitleInput = useCallback(
    (v: string) => {
      setTitle(v);
      if (documentId) {
        const current = useDocumentStore.getState().doc;
        if (current) {
          setDoc({ ...current, title: v });
          debouncedSave();
        }
      }
    },
    [documentId, setDoc, debouncedSave]
  );

  // Guardar al cerrar pestaña/cambiar visibilidad (solo persistido)
  useEffect(() => {
    if (!documentId) return;
    const saveNow = () => useDocumentStore.getState().save();
    const onBeforeUnload = () => saveNow();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") saveNow();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [documentId]);

  // 7) Guardar / Crear (Documents) usando hooks
  const [isSaving, setIsSaving] = useState(false);

  const { update: _ignoreUpdateTpl } = useTemplates(); // se usa arriba en efectos

  const createInitialSheet = useCallback(
    async (docId: string) => {
      try {
        const sheet = await createSheet(docId, {
          name: "Hoja 1",
          data: {
            nodes: draftNodes,
            edges: draftEdges,
          },
        });

        // Initialize local state for this sheet
        setSheets((prev) => ({
          ...prev,
          [sheet.id]: { nodes: draftNodes, edges: draftEdges },
        }));

        // Recargar documento para obtener hojas actualizadas
        load(docId);
      } catch (error) {
        console.error("Error creando hoja inicial:", error);
      }
    },
    [draftNodes, draftEdges, createSheet, load]
  );

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) {
      await loginWithRedirect({
        appState: {
          returnTo: window.location.pathname + window.location.search,
        },
      });
      return;
    }

    if (documentId) {
      setIsSaving(true);
      try {
        await save();
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
      // crea en blanco y luego actualiza con el contenido del canvas
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
    isAuthenticated,
    loginWithRedirect,
    documentId,
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

  // 7.b) Actualizar Template usando useTemplates()
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

  // Mover displayNodes y displayEdges antes de los useEffect que los usan
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
      // Ajustar la vista solo cuando se carga una plantilla y no hay interacción previa
      const timer = setTimeout(() => {
        if (rf && displayNodes.length > 0) {
          rf.fitView(fitViewOptions);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [draftTemplateId, rf, displayNodes, hasInteracted]);

  // Y este efecto específico para hojas
  useEffect(() => {
    if (activeSheet && !hasInteracted) {
      // Ajustar la vista solo cuando se cambia de hoja y no hay interacción previa
      const timer = setTimeout(() => {
        if (rf && displayNodes.length > 0) {
          rf.fitView(fitViewOptions);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeSheet, rf, displayNodes, hasInteracted]);

  // ---------- Helpers para nuevas zonas (Cloud + DMZ) ----------
  const clickCreateOffsetRef = useRef(0);

  type ZoneTpl = {
    id: string;
    name: string;
    description?: string;
    color: string;
    level: "low" | "medium" | "high";
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
          level: tpl.level,
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
      applyLocalPatch,
      sendChange,
      debouncedSave,
      persistSheet,
    ]
  );

  // 👇 Crear zona al hacer CLIC desde el panel (Cloud o DMZ)
  const handleCreateZone = useCallback(
    (templateId: string) => {
      const tpl = getSubZoneTemplateById(templateId);
      if (!tpl) return;

      // Centro visual (aprox.) + offset incremental
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
      sidebarOpen,
      activeSheet,
      sheetEdges,
      documentId,
      applyLocalPatch,
      sendChange,
      debouncedSave,
      persistSheet,
      setSheetNodes,
      setDraftNodes,
      getSubZoneTemplateById,
      createZoneNodeFromTemplate,
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
            // ⬇️ Ahora resolvemos tanto Cloud como DMZ
            const tpl = getSubZoneTemplateById(payload.templateId);
            newNode = createZoneNodeFromTemplate(tpl, position);
          }
        } catch {
          /* no era JSON, cae abajo como tecnología */
        }
      }

      if (!newNode) {
        const nodeType = raw || txt || "default";

        // busca zonas existentes (type === 'zone')
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
      draftNodes,
      applyLocalPatch,
      sendChange,
      debouncedSave,
      persistSheet,
      getSubZoneTemplateById,
      createZoneNodeFromTemplate,
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
        type: (t as any).nodeType ?? "default",
        position: rel,
        parentId: parent.id,
        extent: "parent",
        data: { label: t.name },
        zIndex: 1,
      };

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
      activeSheet,
      sheetNodes,
      sheetEdges,
      documentId,
      storeNodes,
      draftNodes,
      persistSheet,
      applyLocalPatch,
      sendChange,
      debouncedSave,
    ]
  );

  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-[#0f1115]">
      <div className="flex h-full w-full flex-col">
        {/* Toolbar (ahora contiene Guardar/Crear y Actualizar plantilla) */}
        <header
          className="border-b border-white/10 bg-[#0f1115]/95 backdrop-blur overflow-hidden transition-[height] duration-200"
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
            />
          )}
        </header>

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
            <div className="absolute inset-0 pb-10">
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
                onInit={setRf}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onViewportChange={handleViewportChange}
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

                {/* Título */}
                <Panel position="top-left">
                  <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#0f1115]/90 p-2">
                    <input
                      value={title}
                      onChange={(e) => handleTitleInput(e.target.value)}
                      placeholder="Sin título"
                      className="w-64 rounded-md bg-transparent px-2 py-1 text-white outline-none placeholder:text-white/40"
                    />
                    {!documentId && (
                      <span
                        className="ml-1 inline-block h-2 w-2 rounded-full bg-yellow-400"
                        title="Borrador: aún no guardado"
                      />
                    )}
                  </div>
                </Panel>

                {/* Acciones de UI locales (solo toggles) */}
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
                      onClick={() => setToolbarOpen((v) => !v)}
                      className="rounded-md border border-white/10 bg-[#171727] px-3 py-2 text-xs text-white hover:brightness-110"
                    >
                      {toolbarOpen ? "Ocultar toolbar" : "Mostrar toolbar"}
                    </button>
                    <button
                      onClick={() => setShareModalOpen(true)}
                      className="rounded-md border border-white/10 bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700"
                    >
                      Compartir
                    </button>
                  </div>
                </Panel>
              </ReactFlow>
              <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                documentId={documentId || ""}
              />
              {/* Tabs de hojas */}
              {documentId && (
                <SheetTabs
                  documentId={documentId}
                  activeSheetId={activeSheet?.id || null}
                  onSheetChange={(sheet) => setActiveSheet(sheet)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
