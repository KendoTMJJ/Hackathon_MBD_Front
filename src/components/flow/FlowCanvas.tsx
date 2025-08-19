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

import { useState, useCallback, useEffect, useMemo } from "react";
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

import { useProjects } from "../../hooks/useProject";
import type { DocumentData } from "../../models";
import { useTemplates } from "../../hooks/useTemplate";

import ShareModal from "../modals/ShareModal";
import { useSheets } from "../../hooks/useSheets";
import SheetTabs from "../modals/SheetTabs";

const initialNodes: Node[] = [
  {
    id: "n1",
    type: "cloud",
    position: { x: 0, y: 0 },
    data: { label: "Servidor en la nube" },
  },
  {
    id: "n2",
    type: "cloud",
    position: { x: 0, y: 100 },
    data: { label: "Base de Datos en Nube" },
  },
];
const initialEdges: Edge[] = [{ id: "e-n1-n2", source: "n1", target: "n2" }];

const fitViewOptions: FitViewOptions = { padding: 0.2 };
const defaultEdgeOptions: DefaultEdgeOptions = { animated: true };
const onNodeDrag: OnNodeDrag = () => {};
const TOOLBAR_H = 65;

export default function FlowCanvas() {
  const nav = useNavigate();

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
  const projectsApi = useProjects();

  // Store + colab (solo cuando hay documentId)
  const { doc, load, save, applyLocalPatch, setApiReady, setDoc } =
    useDocumentStore();
  const { sendChange: collabSendChange } = useCollab(documentId);
  const sendChange = documentId ? collabSendChange : (_p: any) => {};

  // Inyecta axios real al store (necesario para save/load internos del store)
  useEffect(() => {
    setApiReady(() => api);
  }, [api, setApiReady]);

  // Carga documento si hay id
  useEffect(() => {
    if (documentId) load(documentId);
  }, [documentId, load]);

  // 3) Estado dual: persistido (store) o borrador (local)
  const storeNodes = useMemo<Node[]>(
    () => (doc?.data?.nodes as Node[]) ?? initialNodes,
    [doc]
  );
  const storeEdges = useMemo<Edge[]>(
    () => (doc?.data?.edges as Edge[]) ?? initialEdges,
    [doc]
  );

  const [draftNodes, setDraftNodes] = useState<Node[]>(initialNodes);
  const [draftEdges, setDraftEdges] = useState<Edge[]>(initialEdges);
  const [title, setTitle] = useState<string>("");

  const [sheetNodes, setSheetNodes] = useState<Node[]>([]);
  const [sheetEdges, setSheetEdges] = useState<Edge[]>([]);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  // Sheets
  const { update, create: createSheet } = useSheets(); // Agregado create para crear hojas
  const [activeSheet, setActiveSheet] = useState<any>(null);
  const [isChangingSheet, setIsChangingSheet] = useState(false);

  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

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
        setDraftNodes(
          Array.isArray(tplData.nodes) && tplData.nodes.length > 0
            ? tplData.nodes
            : initialNodes
        );
        setDraftEdges(
          Array.isArray(tplData.edges) && tplData.edges.length > 0
            ? tplData.edges
            : initialEdges
        );
      } catch {
        setDraftNodes(initialNodes);
        setDraftEdges(initialEdges);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, draftTemplateId, draftTitleQ, doc?.title]);

  useEffect(() => {
    if (!activeSheet) {
      setSheetNodes([]);
      setSheetEdges([]);
      return;
    }

    setIsChangingSheet(true);
    try {
      const newNodes = Array.isArray(activeSheet.data?.nodes)
        ? activeSheet.data.nodes
        : [];
      const newEdges = Array.isArray(activeSheet.data?.edges)
        ? activeSheet.data.edges
        : [];

      setSheetNodes(newNodes);
      setSheetEdges(newEdges);

      setTimeout(() => rf?.fitView(fitViewOptions), 100);
    } catch (error) {
      console.error("Error loading sheet data:", error);
      setSheetNodes([]);
      setSheetEdges([]);
    } finally {
      setIsChangingSheet(false);
    }
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

  const createInitialSheet = useCallback(
    async (docId: string) => {
      try {
        await createSheet(docId, {
          name: "Hoja 1",
          data: {
            nodes: draftNodes,
            edges: draftEdges,
          },
        });

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

  // 8) FitView al abrir/cerrar paneles
  useEffect(() => {
    const t = setTimeout(() => rf?.fitView(fitViewOptions), 220);
    return () => clearTimeout(t);
  }, [sidebarOpen, rf]);
  useEffect(() => {
    const t = setTimeout(() => rf?.fitView(fitViewOptions), 220);
    return () => clearTimeout(t);
  }, [toolbarOpen, rf]);

  const displayNodes = useMemo(() => {
    return activeSheet ? sheetNodes : documentId ? storeNodes : draftNodes;
  }, [activeSheet, sheetNodes, documentId, storeNodes, draftNodes]);

  const displayEdges = useMemo(() => {
    return activeSheet ? sheetEdges : documentId ? storeEdges : draftEdges;
  }, [activeSheet, sheetEdges, documentId, storeEdges, draftEdges]);

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
                <TechnologyPanel />
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
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDrag={onNodeDrag}
                fitView
                fitViewOptions={fitViewOptions}
                defaultEdgeOptions={defaultEdgeOptions}
                onInit={setRf}
              >
                <Background />
                <Controls />
                <MiniMap />

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
