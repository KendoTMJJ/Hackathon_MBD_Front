// src/pages/HomePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/public/NavBar";
import { useApi } from "../hooks/useApi";
import type { Project, DocumentEntity } from "../models";
import { useAuth0 } from "@auth0/auth0-react";
import TemplateCard from "../components/templates/TemplateCard";
import {
  SAMPLE_TEMPLATE_DATA,
  SAMPLE_TEMPLATE_TITLE,
} from "../features/templates/sample";

export default function HomePage() {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();
  const api = useApi();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<DocumentEntity[]>([]);
  const [error, setError] = useState<string | undefined>();

  const loadOnce = useRef(false);

  async function loadData() {
    setLoading(true);
    setError(undefined);
    try {
      // 1) Proyectos del usuario (si no hay, crea uno)
      let { data: projs } = await api.get<Project[]>("/projects");
      if (!projs.length) {
        const created = await api.post<Project>("/projects", {
          name: "My Diagrams",
        });
        projs = [created.data];
      }
      setProjects(projs);

      // 2) Documentos por proyecto y filtra plantillas (camelCase)
      const docsByProject = await Promise.all(
        projs.map((p) =>
          api.get<DocumentEntity[]>("/documents", {
            params: { projectId: p.id },
          })
        )
      );
      const allDocs = docsByProject.flatMap((r) => r.data);
      const tpls = allDocs.filter((d) => d.kind === "template"); // ← antes: kind_document
      setTemplates(tpls);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      // Usuario no autenticado: no llames API protegida
      setLoading(false);
      setProjects([]);
      setTemplates([]);
      return;
    }
    // Evita doble ejecución en StrictMode
    if (loadOnce.current) return;
    loadOnce.current = true;
    loadData();
  }, [isLoading, isAuthenticated]);

  // Proyecto destino por defecto
  const targetProject = useMemo(() => {
    if (!projects.length) return undefined;
    return (
      projects.find((p) => (p.name ?? "").toLowerCase() !== "templates") ||
      projects[0]
    );
  }, [projects]);

  // Asegura (o crea) proyecto "Templates"
  async function ensureTemplatesProject(): Promise<Project> {
    const found = projects.find(
      (x) => (x.name ?? "").toLowerCase() === "templates"
    );
    if (found) return found;
    const { data } = await api.post<Project>("/projects", {
      name: "Templates",
    });
    setProjects((prev) => [...prev, data]);
    return data;
  }

  // --- Acciones ---
  async function handleCreateBlank() {
    if (!isAuthenticated) {
      await loginWithRedirect({ appState: { returnTo: "/" } });
      return;
    }
    if (!targetProject) return;
    const { data } = await api.post<DocumentEntity>("/documents", {
      title: "Nuevo diagrama",
      kind: "diagram",
      data: { nodes: [], edges: [] },
      projectId: targetProject.id,
    });
    navigate(`/Board/${data.id}`); // ← antes: cod_document
  }

  async function handleUseTemplate(tpl: DocumentEntity) {
    if (!isAuthenticated) {
      await loginWithRedirect({ appState: { returnTo: "/" } });
      return;
    }
    if (!targetProject) return;
    const title = `Mi ${tpl.title}`; // ← antes: title_document
    const { data } = await api.post<DocumentEntity>(
      `/documents/${tpl.id}/clone`, // ← antes: cod_document
      null,
      { params: { projectId: targetProject.id, title } }
    );
    navigate(`/Board/${data.id}`); // ← antes: cod_document
  }

  async function handleSeedTemplate() {
    if (!isAuthenticated) {
      await loginWithRedirect({ appState: { returnTo: "/" } });
      return;
    }
    const templatesProject = await ensureTemplatesProject();
    await api.post<DocumentEntity>("/documents", {
      title: SAMPLE_TEMPLATE_TITLE,
      kind: "template",
      data: SAMPLE_TEMPLATE_DATA,
      projectId: templatesProject.id,
    });
    await loadData(); // refresca lista
  }

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-6xl p-6 text-white">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Página de Inicio</h1>
          <div className="flex gap-3">
            <button
              onClick={handleSeedTemplate}
              className="rounded-md border border-white/10 bg-[#202237] px-4 py-2 text-sm hover:brightness-110"
            >
              Cargar plantilla de prueba
            </button>
            <button
              onClick={handleCreateBlank}
              className="rounded-md border border-white/10 bg-[#171727] px-4 py-2 text-sm hover:brightness-110"
              disabled={!targetProject}
            >
              Crear diagrama en blanco
            </button>
          </div>
        </header>

        {loading && <div>Cargando tus plantillas…</div>}
        {error && <div className="text-red-400">{error}</div>}

        {!loading && !templates.length && (
          <p className="text-white/80">
            No tienes plantillas aún. Usa “Cargar plantilla de prueba” o crea
            una desde el editor.
          </p>
        )}

        {/* Grid de plantillas */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id} // ← antes: cod_document
              tpl={tpl} // tpl.title / tpl.id / tpl.projectId
              onUse={handleUseTemplate}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
