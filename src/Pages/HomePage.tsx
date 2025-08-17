// src/Pages/HomePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import Header from "../components/flow/Header";
import Sidebar from "../components/flow/Sidebar";
import TemplateCard from "../components/templates/TemplateCard";
import NavBar from "../components/public/NavBar";   
import "../home.css";

import { useApi } from "../hooks/useApi";
import type { Project, DocumentEntity } from "../models";
import {
  SAMPLE_TEMPLATE_DATA,
  SAMPLE_TEMPLATE_TITLE,
} from "../features/templates/sample";

const sections = [
  { title: "Organigrama" },
  { title: "Mapa mental" },
  { title: "Diagrama de flujo" },
  { title: "Mapa conceptual" },
];

function normalizeDoc(raw: any) {
  return {
    id: raw.id ?? raw.cod_document,
    title: raw.title ?? raw.title_document,
    kind: raw.kind ?? raw.kind_document,
    data: raw.data ?? raw.data_document ?? { nodes: [], edges: [] },
    projectId: raw.projectId ?? raw.project_id,
  } as DocumentEntity;
}

export default function HomePage() {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();
  const api = useApi();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<DocumentEntity[]>([]);
  const [error, setError] = useState<string | undefined>();

  const loadedOnce = useRef(false);

  async function loadData() {
    setLoading(true);
    setError(undefined);
    try {
      let { data: projs } = await api.get<Project[]>("/projects");
      if (!projs.length) {
        const created = await api.post<Project>("/projects", { name: "My Diagrams" });
        projs = [created.data];
      }
      setProjects(projs);

      const docsByProject = await Promise.all(
        projs.map((p: any) =>
          api.get("/documents", { params: { projectId: p.id ?? p.cod_project } })
        )
      );
      const allRaw = docsByProject.flatMap((r) => r.data as any[]);
      const allDocs = allRaw.map(normalizeDoc);
      const tpls = allDocs.filter((d) => (d.kind ?? "").toLowerCase() === "template");
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
      setLoading(false);
      setProjects([]);
      setTemplates([]);
      return;
    }
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    loadData();
  }, [isLoading, isAuthenticated]);

  const targetProject = useMemo(() => {
    if (!projects.length) return undefined;
    return (
      projects.find((p: any) => (p.name ?? "").toLowerCase() !== "templates") ?? projects[0]
    );
  }, [projects]);

  async function ensureTemplatesProject(): Promise<Project> {
    const found = projects.find((x: any) => (x.name ?? "").toLowerCase() === "templates");
    if (found) return found;
    const { data } = await api.post<Project>("/projects", { name: "Templates" });
    setProjects((prev) => [...prev, data]);
    return data;
  }

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
      projectId: (targetProject as any).id ?? (targetProject as any).cod_project,
    });
    navigate(`/Board/${(data as any).id ?? (data as any).cod_document}`);
  }

  async function handleUseTemplate(tpl: DocumentEntity) {
    if (!isAuthenticated) {
      await loginWithRedirect({ appState: { returnTo: "/" } });
      return;
    }
    if (!targetProject) return;
    const title = `Mi ${tpl.title}`;
    const tplId = (tpl as any).id ?? (tpl as any).cod_document;
    const { data } = await api.post<DocumentEntity>(`/documents/${tplId}/clone`, null, {
      params: {
        projectId: (targetProject as any).id ?? (targetProject as any).cod_project,
        title,
      },
    });
    navigate(`/Board/${(data as any).id ?? (data as any).cod_document}`);
  }

  async function handleSeedTemplate() {
    if (!isAuthenticated) {
      await loginWithRedirect({ appState: { returnTo: "/" } });
      return;
    }
    const templatesProject = await ensureTemplatesProject();
    await api.post("/documents", {
      title: SAMPLE_TEMPLATE_TITLE,
      kind: "template",
      data: SAMPLE_TEMPLATE_DATA,
      projectId: (templatesProject as any).id ?? (templatesProject as any).cod_project,
    });
    await loadData();
  }

  return (
    <div className="home-shell">
      <NavBar />

      <div className="shell-body">
        <Sidebar />

        <div className="home-main">
          <Header />

          <div className="main-content">
            <section className="hero">
              <div>
                <h1>Bienvenido</h1>
                <p className="muted">Crea diagramas claros y colabora en tiempo real.</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={handleSeedTemplate}>
                  Cargar plantilla de prueba
                </button>
                <button className="btn btn-accent" onClick={handleCreateBlank}>
                  Tablero en blanco
                </button>
              </div>
            </section>

            <section className="chip-row">
              {sections.map((s) => (
                <div key={s.title} className="chip">
                  {s.title}
                </div>
              ))}
            </section>

            {loading && <p>Cargando tus plantillas…</p>}
            {error && <p className="text-red-400">{error}</p>}
            {!loading && !templates.length && (
              <p className="muted">
                No tienes plantillas aún. Usa “Cargar plantilla de prueba” o crea una desde el editor.
              </p>
            )}

            <section className="grid">
              {templates.map((tpl: any) => (
                <TemplateCard
                  key={(tpl.id ?? tpl.cod_document) as string}
                  tpl={tpl}
                  onUse={handleUseTemplate}
                />
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
