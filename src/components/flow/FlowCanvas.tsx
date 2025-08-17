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
import { useLocation, useParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { useAuth0 } from "@auth0/auth0-react"

import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";
import { TechnologyPanel } from "./TechnologyPanel";
import Toolbar from "./Toolbar";

/* hooks de integración (ajusta paths si usas otra estructura) */
import { useApi } from "../../hooks/useApi";
import { useCollab } from "../../hooks/useCollab";
import { useDocumentStore } from "../../hooks/useDocument";

/* Fallback mientras carga */
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
// Corrige ids para que coincidan con initialNodes
const initialEdges: Edge[] = [{ id: "e-n1-n2", source: "n1", target: "n2" }];

const fitViewOptions: FitViewOptions = { padding: 0.2 };
const defaultEdgeOptions: DefaultEdgeOptions = { animated: true };
const onNodeDrag: OnNodeDrag = (_, node) =>
  console.log("drag event", node.data);
const TOOLBAR_H = 70;

export default function FlowCanvas() {
  // 1) documentId desde ruta o query
  const { documentId: paramId } = useParams<{ documentId?: string }>();
  const q = new URLSearchParams(useLocation().search);
  const documentId = paramId || q.get("doc") || q.get("id") || undefined;

  const { isAuthenticated, loginWithRedirect } = useAuth0()

  // 2) Integración backend/WS
  const api = useApi();
  const { doc, load, save, applyLocalPatch, setApiReady } = useDocumentStore();
  const { sendChange } = useCollab(documentId);

  // Inyecta axios auth en el store (una vez)
  useEffect(() => {
    setApiReady(() => api);
  }, [api, setApiReady]);

  // Carga doc al cambiar id
  useEffect(() => {
    if (documentId) load(documentId);
  }, [documentId, load]);

  // 3) Deriva nodos/edges del doc (o fallback)
  const nodes = useMemo<Node[]>(
    () => (doc?.data?.nodes as Node[]) ?? initialNodes,
    [doc]
  );
  const edges = useMemo<Edge[]>(
    () => (doc?.data?.edges as Edge[]) ?? initialEdges,
    [doc]
  );

  // 4) UI existente
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  // 5) Autosave con debounce
  const debouncedSave = useDebouncedCallback(() => {
    save();
  }, 1000);

  // 6) Handlers: patch local + WS + autosave
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const current = useDocumentStore.getState().doc;
      const currentNodes = (current?.data?.nodes as Node[]) ?? [];
      const nextNodes = applyNodeChanges(changes, currentNodes);
      const patch = { nodes: nextNodes };
      applyLocalPatch(patch);
      sendChange(patch);
      debouncedSave();
    },
    [applyLocalPatch, sendChange, debouncedSave]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const current = useDocumentStore.getState().doc;
      const currentEdges = (current?.data?.edges as Edge[]) ?? [];
      const nextEdges = applyEdgeChanges(changes, currentEdges);
      const patch = { edges: nextEdges };
      applyLocalPatch(patch);
      sendChange(patch);
      debouncedSave();
    },
    [applyLocalPatch, sendChange, debouncedSave]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
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
    },
    [applyLocalPatch, sendChange, debouncedSave]
  );

  const handleSaveAsTemplate = useCallback(async () => {
    if (!isAuthenticated) {
      await loginWithRedirect({
        appState: { returnTo: window.location.pathname },
      });
      return;
    }

    if (!doc || !api) {
      console.error("No hay documento o API disponible");
      return;
    }

    try {
      // Obtener el proyecto "Templates" o crearlo
      const { data: projects } = await api.get("/projects");
      let templatesProject = projects.find(
        (p: any) => (p.name ?? "").toLowerCase() === "templates"
      );

      if (!templatesProject) {
        const { data } = await api.post("/projects", { name: "Templates" });
        templatesProject = data;
      }

      // Guardar como plantilla
      const templateTitle = `Plantilla - ${doc.title || "Sin título"}`;
      await api.post("/templates", {
        title: templateTitle,
        kind: "template",
        data: { nodes, edges },
        projectId: templatesProject.id ?? templatesProject.cod_project,
      });

      // Mostrar confirmación (puedes reemplazar con un toast/notification)
      alert("¡Plantilla guardada exitosamente!");
    } catch (error) {
      console.error("Error guardando plantilla:", error);
      alert("Error al guardar la plantilla. Inténtalo de nuevo.");
    }
  }, [isAuthenticated, loginWithRedirect, doc, api, nodes, edges]);

  
  // 7) Re-encuadre al abrir/cerrar paneles
  useEffect(() => {
    const t = setTimeout(() => rf?.fitView(fitViewOptions), 220);
    return () => clearTimeout(t);
  }, [sidebarOpen, rf]);
  useEffect(() => {
    const t = setTimeout(() => rf?.fitView(fitViewOptions), 220);
    return () => clearTimeout(t);
  }, [toolbarOpen, rf]);

  if (!documentId) {
    return (
      <main className="p-6 text-white">
        Falta <code>documentId</code> en la URL. Usa{" "}
        <code>/Board/:documentId</code> o <code>?doc=&lt;uuid&gt;</code>.
      </main>
    );
  }
  if (!doc) {
    return <main className="p-6 text-white">Cargando documento…</main>;
  }

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

        {/* Fila: Sidebar + Canvas */}
        <div className="flex min-h-0 flex-1">
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
                <Panel position="top-left">
                  <div className="flex gap-2">
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
                      onClick={handleSaveAsTemplate}
                      className="rounded-md border border-green-500/20 bg-green-900/20 px-3 py-2 text-xs text-green-400 hover:bg-green-900/30 
                      hover:border-green-500/30 transition-colors"
                    >
                      Guardar
                    </button>
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
