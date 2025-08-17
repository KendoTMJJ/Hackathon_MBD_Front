// src/components/flow/FlowCanvas.tsx
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
import {
  useDocumentStore,
  useDocumentsApi, // para crear/actualizar fuera del store
} from "../../hooks/useDocument";

import { useProjects } from "../../hooks/useProject";
import type { DocumentData } from "../../models";
import { useTemplates } from "../../hooks/useTemplate";

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
const TOOLBAR_H = 70;

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
  const api = useApi(); // <- para inyectar en el store
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
          Array.isArray(tplData.nodes) ? tplData.nodes : initialNodes
        );
        setDraftEdges(
          Array.isArray(tplData.edges) ? tplData.edges : initialEdges
        );
      } catch {
        setDraftNodes(initialNodes);
        setDraftEdges(initialEdges);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, draftTemplateId, draftTitleQ, doc?.title]);

  const nodes = documentId ? storeNodes : draftNodes;
  const edges = documentId ? storeEdges : draftEdges;

  // 4) UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  // 5) Autosave solo en persistido (usa el save del store, que ya es robusto)
  const debouncedSave = useDebouncedCallback(() => {
    if (documentId) save();
  }, 1000);

  // 6) Handlers
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (documentId) {
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
    [documentId, applyLocalPatch, sendChange, debouncedSave]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (documentId) {
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
    [documentId, applyLocalPatch, sendChange, debouncedSave]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (documentId) {
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
    [documentId, applyLocalPatch, sendChange, debouncedSave]
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

  // 6.b) Guardar al cerrar pestaña/cambiar de visibilidad (solo persistido)
  useEffect(() => {
    if (!documentId) return;

    const saveNow = () => useDocumentStore.getState().save();
    const onBeforeUnload = () => {
      saveNow();
    };
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

    // Draft → necesitamos un projectId (si no viene, lo creamos con useProjects)
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
      // Crear doc con datos actuales; si tu API permite create con data, úsalo.
      const payload: DocumentData = { nodes: draftNodes, edges: draftEdges };
      // Fallback: createBlank + update
      const tmp = await documentsApi.createBlank({
        projectId: projectId!,
        title: title || "Sin título",
      });
      const created = await documentsApi.update({
        id: tmp.id,
        version: tmp.version,
        data: payload,
        title: title || tmp.title,
      });

      nav(`/Board/${created.id}`, { replace: true });
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

  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-[#0f1115]">
      <div className="flex h-full w-full flex-col">
        {/* Toolbar */}
        <header
          className="border-b border-white/10 bg-[#0f1115]/95 backdrop-blur overflow-hidden transition-[height] duration-200"
          style={{ height: toolbarOpen ? TOOLBAR_H : 0 }}
        >
          {toolbarOpen && <Toolbar />}
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
            <div className="absolute inset-0">
              <ReactFlow
                nodes={nodes}
                edges={edges}
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

                {/* Acciones */}
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

                    {/* Guardar/Crear Document */}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="rounded-md border border-green-500/20 bg-green-900/20 px-3 py-2 text-xs text-green-400 hover:bg-green-900/30 hover:border-green-500/30 transition-colors disabled:opacity-50"
                    >
                      {isSaving
                        ? "Guardando…"
                        : documentId
                        ? "Guardar"
                        : "Crear"}
                    </button>

                    {/* Actualizar Template (solo visible si es borrador con templateId) */}
                    {showUpdateTemplate && (
                      <button
                        onClick={handleUpdateTemplate}
                        disabled={isUpdatingTpl}
                        className="rounded-md border border-blue-500/20 bg-blue-900/20 px-3 py-2 text-xs text-blue-300 hover:bg-blue-900/30 hover:border-blue-500/30 transition-colors disabled:opacity-50"
                        title="Actualizar plantilla del catálogo"
                      >
                        {isUpdatingTpl
                          ? "Actualizando…"
                          : "Actualizar plantilla"}
                      </button>
                    )}
                  </div>
                </Panel>
              </ReactFlow>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
