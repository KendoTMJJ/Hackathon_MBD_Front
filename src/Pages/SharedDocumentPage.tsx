import { useState, useCallback, useEffect } from "react";
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
import type { SharedDocumentAccess, SheetEntity } from "../models";

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

export default function SharedDocumentPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [sharedData, setSharedData] = useState<SharedDocumentAccess | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [title, setTitle] = useState<string>("");

  // sheets state
  const [sheets, setSheets] = useState<SheetEntity[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState<number | null>(null);

  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  const extractNodesEdges = (entity: any) => {
    // entity may be: { data: { nodes, edges } } or { nodes, edges } or custom
    const data = entity?.data ?? entity;
    const extractedNodes = Array.isArray(data?.nodes)
      ? data.nodes
      : Array.isArray(entity?.nodes)
      ? entity.nodes
      : initialNodes;
    const extractedEdges = Array.isArray(data?.edges)
      ? data.edges
      : Array.isArray(entity?.edges)
      ? entity.edges
      : initialEdges;
    return { extractedNodes, extractedEdges };
  };

  const loadFromEntity = (entity: any) => {
    const { extractedNodes, extractedEdges } = extractNodesEdges(entity ?? {});
    setNodes(extractedNodes);
    setEdges(extractedEdges);
    // titulo preferente: sheet.name || sheet.title || document.title
    setTitle(
      entity?.title ??
        entity?.name ??
        sharedData?.document?.title ??
        "Documento Compartido"
    );
    // fit view un poco después
    setTimeout(() => rf?.fitView(fitViewOptions), 200);
  };

  const loadSharedDocument = async (pwd?: string) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const backendUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const url = `${backendUrl}/shared/${token}${
        pwd ? `?password=${encodeURIComponent(pwd)}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (
          response.status === 400 &&
          errorData.message?.includes("Password required")
        ) {
          setPasswordRequired(true);
          return;
        }
        throw new Error(errorData.message || "Error accessing shared document");
      }

      const result = await response.json();
      console.log("API Response:", result); // Para debugging

      setSharedData(result);
      setPasswordRequired(false);

      // Manejar diferentes formatos de respuesta
      const sheetsFromResult = Array.isArray(result.sheets)
        ? result.sheets
        : Array.isArray(result.document?.sheets)
        ? result.document.sheets
        : [];

      setSheets(sheetsFromResult);

      // Intentar cargar la primera hoja o el documento principal
      if (sheetsFromResult.length > 0) {
        setActiveSheetIdx(0);
        loadFromEntity(sheetsFromResult[0]);
      } else if (result.document) {
        setActiveSheetIdx(null);
        loadFromEntity(result.document);
      }
    } catch (err: any) {
      setError(err.message || "Error accessing shared document");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSharedDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSelectSheet = (index: number) => {
    const s = sheets[index];
    if (!s) return;
    setActiveSheetIdx(index);
    loadFromEntity(s);
  };

  const canEdit = sharedData?.permission === "edit";

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (!canEdit) return; // Bloquear cambios si no tiene permisos de edición
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [canEdit]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (!canEdit) return; // Bloquear cambios si no tiene permisos de edición
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [canEdit]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!canEdit) return; // Bloquear conexiones si no tiene permisos de edición
      setEdges((eds) =>
        addEdge({ ...connection, type: "secure", animated: true }, eds)
      );
    },
    [canEdit]
  );

  useEffect(() => {
    const t = setTimeout(() => rf?.fitView(fitViewOptions), 220);
    return () => clearTimeout(t);
  }, [sidebarOpen, rf]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSharedDocument(password);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1115]">
        <div className="text-white">Cargando documento compartido...</div>
      </div>
    );
  }

  if (error) {
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
              <TechnologyPanel />
            </div>
          )}
        </aside>

        {/* Canvas */}
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 pb-16"> {/* Añadido padding inferior */}
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
              nodesDraggable={canEdit}
              nodesConnectable={canEdit}
              elementsSelectable={canEdit}
            >
              <Background />
              <Controls />
              <MiniMap />

              <Panel position="top-left">
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#0f1115]/90 p-2">
                  <span className="px-2 py-1 text-white">{title}</span>
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    {sharedData.permission === "edit"
                      ? "Edición"
                      : "Solo lectura"}
                  </span>
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
                    className="rounded-md border border-white/10 bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700"
                  >
                    Crear tu propio diagrama
                  </button>
                </div>
              </Panel>
            </ReactFlow>
          </div>

          {/* Tabs de hojas en la parte inferior izquierda */}
          <div className="absolute left-4 bottom-4 z-30 flex items-center gap-2">
            <div className="flex gap-2 rounded-md border border-white/10 bg-[#0f1115]/90 p-2">
              {sheets.length > 0 ? (
                sheets.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSheet(idx)}
                    className={`px-3 py-1 rounded text-sm ${
                      activeSheetIdx === idx
                        ? "bg-blue-600 text-white"
                        : "bg-[#171727] text-gray-300 hover:bg-[#2a2a3a]"
                    }`}
                  >
                    {s.name || `Hoja ${idx + 1}`}
                  </button>
                ))
              ) : (
                <div className="px-3 py-1 text-sm text-gray-300">
                  No hay hojas disponibles
                </div>
              )}
            </div>
            
            {/* Botón para crear nueva hoja (solo si tiene permisos de edición) */}
            {canEdit && (
              <button
                className="rounded-md bg-green-600 p-2 text-white hover:bg-green-700 flex items-center justify-center"
                title="Crear nueva hoja"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
