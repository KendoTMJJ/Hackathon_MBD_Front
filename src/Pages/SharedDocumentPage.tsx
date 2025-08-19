import type React from "react"
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
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useState, useCallback, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { TechnologyPanel } from "../components/flow/TechnologyPanel"
import { nodeTypes } from "../components/flow/nodes"
import { edgeTypes } from "../components/flow/edges"


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
]
const initialEdges: Edge[] = [{ id: "e-n1-n2", source: "n1", target: "n2" }]

const fitViewOptions: FitViewOptions = { padding: 0.2 }
const defaultEdgeOptions: DefaultEdgeOptions = { animated: true }
const onNodeDrag: OnNodeDrag = () => {}

interface SharedDocumentData {
  document: any
  permission: "read" | "edit"
}

export default function SharedDocumentPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [sharedData, setSharedData] = useState<SharedDocumentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [password, setPassword] = useState("")

  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [title, setTitle] = useState<string>("")

  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rf, setRf] = useState<ReactFlowInstance | null>(null)

  const loadSharedDocument = async (pwd?: string) => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
      const response = await fetch(`${backendUrl}/shared/${token}${pwd ? `?password=${pwd}` : ""}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 400 && errorData.message?.includes("Password required")) {
          setPasswordRequired(true)
          return
        }
        throw new Error(errorData.message || "Error accessing shared document")
      }

      const result = await response.json()
      setSharedData(result)
      setPasswordRequired(false)

      if (result.document) {
        const docData = result.document.data || {}
        setNodes(Array.isArray(docData.nodes) ? docData.nodes : initialNodes)
        setEdges(Array.isArray(docData.edges) ? docData.edges : initialEdges)
        setTitle(result.document.title || "Documento Compartido")
      }
    } catch (err: any) {
      if (err.message.includes("Password required")) {
        setPasswordRequired(true)
      } else {
        setError(err.message || "Error accessing shared document")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSharedDocument()
  }, [token])

  const canEdit = sharedData?.permission === "edit"

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (!canEdit) return // Bloquear cambios si no tiene permisos de edición
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [canEdit],
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (!canEdit) return // Bloquear cambios si no tiene permisos de edición
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [canEdit],
  )

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!canEdit) return // Bloquear conexiones si no tiene permisos de edición
      setEdges((eds) => addEdge({ ...connection, type: "secure", animated: true }, eds))
    },
    [canEdit],
  )

  useEffect(() => {
    const t = setTimeout(() => rf?.fitView(fitViewOptions), 220)
    return () => clearTimeout(t)
  }, [sidebarOpen, rf])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadSharedDocument(password)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1115]">
        <div className="text-white">Cargando documento compartido...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1115]">
        <div className="rounded-lg bg-red-900/20 border border-red-500 p-6 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  if (passwordRequired) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1115]">
        <div className="w-full max-w-md rounded-lg bg-[#1a1a1a] p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Documento protegido</h2>
          <p className="text-gray-300 mb-4">Este documento requiere una contraseña para acceder.</p>
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
    )
  }

  if (!sharedData) return null

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
                nodesDraggable={canEdit} // Deshabilitar drag si es solo lectura
                nodesConnectable={canEdit} // Deshabilitar conexiones si es solo lectura
                elementsSelectable={canEdit} // Deshabilitar selección si es solo lectura
              >
                <Background />
                <Controls />
                <MiniMap />

                {/* Título */}
                <Panel position="top-left">
                  <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#0f1115]/90 p-2">
                    <span className="px-2 py-1 text-white">{title}</span>
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      {sharedData.permission === "edit" ? "Edición" : "Solo lectura"}
                    </span>
                  </div>
                </Panel>

                {/* Controles de UI */}
                <Panel position="top-right">
                  <div className="flex gap-2 rounded-md border border-white/10 bg-[#0f1115]/90 p-2">
                    <button
                      onClick={() => setSidebarOpen((v) => !v)}
                      className="rounded-md border border-white/10 bg-[#171727] px-3 py-2 text-xs text-white hover:brightness-110"
                    >
                      {sidebarOpen ? "Ocultar tecnologías" : "Mostrar tecnologías"}
                    </button>
                  </div>
                </Panel>
              </ReactFlow>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
