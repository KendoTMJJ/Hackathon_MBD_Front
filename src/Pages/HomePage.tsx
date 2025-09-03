// src/Pages/HomePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";

import Header from "../components/flow/Header";
import Sidebar from "../components/flow/Sidebar";
import TemplateCard from "../components/templates/TemplateCard";
import DocumentCard from "../components/templates/DocumentCard";
import NameModal from "../components/templates/NameModal";

import { useApi } from "../hooks/useApi";
import type { DocumentEntity, Project, TemplateEntity } from "../models";
import {
  SAMPLE_TEMPLATE_DATA,
  SAMPLE_TEMPLATE_TITLE,
} from "../features/templates/sample";

function defaultTitle(kind: "diagram" | "template") {
  const d = new Date();
  const stamp = d.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return kind === "template" ? `Plantilla ${stamp}` : `Diagrama ${stamp}`;
}

export default function HomePage() {
  const { pathname } = useLocation();
  const view: "home" | "templates" | "documents" = useMemo(() => {
    if (pathname.startsWith("/templates")) return "templates";
    if (pathname.startsWith("/documents")) return "documents";
    return "home";
  }, [pathname]);

  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();
  const { t } = useTranslation();
  const api = useApi();
  const navigate = useNavigate();

  // Estados
  const [loadingTpls, setLoadingTpls] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [templates, setTemplates] = useState<TemplateEntity[]>([]);
  const [documents, setDocuments] = useState<DocumentEntity[]>([]);
  const [errTpls, setErrTpls] = useState<string | undefined>();
  const [errDocs, setErrDocs] = useState<string | undefined>();

  // Proyecto por defecto cacheado (para abrir Board en borrador)
  const [defaultProject, setDefaultProject] = useState<Project | null>(null);

  // Modal para nombrar el diagrama al usar una plantilla
  const [askNameOpen, setAskNameOpen] = useState(false);
  const [pendingTpl, setPendingTpl] = useState<TemplateEntity | null>(null);
  const [suggestedName, setSuggestedName] = useState("");

  // control de cargas por vista
  const loadedTplsOnce = useRef(false);
  const loadedDocsOnce = useRef(false);

  // Helpers
  async function ensureDefaultProject(): Promise<Project> {
    if (defaultProject) return defaultProject;
    const { data: projs } = await api.get<Project[]>("/projects");
    if (!Array.isArray(projs) || projs.length === 0) {
      const created = await api.post<Project>("/projects", {
        name: t("home.defaultProjectName", { defaultValue: "My Diagrams" }),
      });
      setDefaultProject(created.data);
      return created.data;
    }
    setDefaultProject(projs[0]);
    return projs[0];
  }

  // Cargas
  const loadTemplates = async () => {
    setLoadingTpls(true);
    setErrTpls(undefined);
    try {
      const { data } = await api.get<TemplateEntity[]>("/templates");
      setTemplates(data);
    } catch (e: any) {
      setErrTpls(
        e?.message ??
          t("home.loadError", { defaultValue: "Error cargando plantillas" })
      );
    } finally {
      setLoadingTpls(false);
    }
  };

  const loadDocuments = async () => {
    setLoadingDocs(true);
    setErrDocs(undefined);
    try {
      const project = await ensureDefaultProject();
      const { data } = await api.get<DocumentEntity[]>("/documents", {
        params: { projectId: project.id },
      });
      setDocuments(data);
    } catch (e: any) {
      setErrDocs(
        e?.message ??
          t("home.loadError", { defaultValue: "Error cargando documentos" })
      );
    } finally {
      setLoadingDocs(false);
    }
  };

  // Efectos: cargar según vista y auth
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setLoadingTpls(false);
      setLoadingDocs(false);
      setTemplates([]);
      setDocuments([]);
      return;
    }
    if (view === "templates" && !loadedTplsOnce.current) {
      loadedTplsOnce.current = true;
      void loadTemplates();
    }
    if (view === "documents" && !loadedDocsOnce.current) {
      loadedDocsOnce.current = true;
      void loadDocuments();
    }
  }, [isLoading, isAuthenticated, view]);

  // Acciones del Hero (solo en Home)
  async function handleCreateBlank() {
    if (!isAuthenticated) {
      await loginWithRedirect({ appState: { returnTo: "/" } });
      return;
    }
    const project = await ensureDefaultProject();
    const q = new URLSearchParams({
      projectId: String(project.id),
      title: defaultTitle("diagram"),
    });
    navigate(`/Board?${q.toString()}`); // draft
  }

  async function handleSeedTemplate() {
    if (!isAuthenticated) {
      await loginWithRedirect({ appState: { returnTo: "/" } });
      return;
    }
    await api.post("/templates", {
      title: SAMPLE_TEMPLATE_TITLE,
      data: SAMPLE_TEMPLATE_DATA,
      kind: "template",
    });
    // Redirige a /templates para verla
    navigate("/templates");
    // y recarga si ya se había abierto esa vista
    if (loadedTplsOnce.current) void loadTemplates();
  }

  // Acciones para usar plantilla (en la sección Templates)
  const handleUseTemplate = (tpl: TemplateEntity) => {
    if (!isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: "/templates" } });
      return;
    }
    setPendingTpl(tpl);
    setSuggestedName(`Mi ${tpl.title ?? "diagrama"}`);
    setAskNameOpen(true);
  };

  async function confirmTemplateName(name: string) {
    if (!pendingTpl) return;
    const project = await ensureDefaultProject();
    const q = new URLSearchParams({
      projectId: String(project.id),
      templateId: String(pendingTpl.id),
      title: (name && name.trim()) || defaultTitle("diagram"),
    });
    setAskNameOpen(false);
    setPendingTpl(null);
    navigate(`/Board?${q.toString()}`); // draft
  }

  // 🔹 Handler para eliminación optimista en la vista de documentos
  const handleCardDeleted = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Render por vista (desde Sidebar)
  return (
    <div className="flex h-screen w-full flex-col bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden md:block w-[240px] shrink-0 bg-white border-r border-gray-200 p-4 shadow-sm">
          <Sidebar />
        </aside>

        <div className="flex h-full min-w-0 flex-1 flex-col">
          <Header />

          <div className="min-w-0 flex-1 overflow-auto p-6">
            {/* ---------- HOME ---------- */}
            {view === "home" && (
              <>
                <section className="mb-8 flex flex-col md:flex-row items-center justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 md:mb-0">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {t("home.welcome")}
                    </h1>
                    <p className="mt-2 text-gray-600 max-w-lg">
                      {t("home.subtitle")}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                      className="px-5 py-3 rounded-lg border border-gray-300 bg-white text-white hover:bg-gray-50 transition-colors shadow-sm font-medium"
                      onClick={handleSeedTemplate}
                    >
                      {t("home.loadSample", {
                        defaultValue: "Cargar plantilla de prueba",
                      })}
                    </button>
                    <button
                      className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm font-medium"
                      onClick={handleCreateBlank}
                    >
                      {t("home.blankBoard", {
                        defaultValue: "Crear diagrama en blanco",
                      })}
                    </button>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">
                    Tipos de diagramas
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {(
                      [
                        "orgChart",
                        "mindMap",
                        "flowchart",
                        "conceptMap",
                      ] as const
                    ).map((key) => (
                      <div
                        key={key}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        {t(`sections.${key}`)}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Sección de accesos rápidos */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate("/templates")}
                  >
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">
                      Plantillas
                    </h3>
                    <p className="text-gray-600">
                      Explora plantillas para empezar rápidamente
                    </p>
                  </div>
                  <div
                    className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate("/documents")}
                  >
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">
                      Mis documentos
                    </h3>
                    <p className="text-gray-600">
                      Accede a tus diagramas guardados
                    </p>
                  </div>
                </section>
              </>
            )}

            {/* ---------- TEMPLATES ---------- */}
            {view === "templates" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Plantillas
                  </h2>
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                    onClick={handleSeedTemplate}
                  >
                    + Nueva plantilla
                  </button>
                </div>

                {loadingTpls && (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {errTpls && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {errTpls}
                  </div>
                )}

                {!loadingTpls && !templates.length && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <p className="text-blue-800 mb-4">
                      {t("home.noTemplates", {
                        defaultValue:
                          "No tienes plantillas aún. Usa “Cargar plantilla de prueba” o crea una desde el editor.",
                      })}
                    </p>
                    <button
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      onClick={handleSeedTemplate}
                    >
                      Crear plantilla de ejemplo
                    </button>
                  </div>
                )}

                {!!templates.length && (
                  <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((tpl) => (
                      <TemplateCard
                        key={tpl.id}
                        tpl={tpl as any}
                        onUse={() => handleUseTemplate(tpl)}
                      />
                    ))}
                  </section>
                )}
              </>
            )}

            {/* ---------- DOCUMENTS ---------- */}
            {view === "documents" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Mis Documentos
                  </h2>
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                    onClick={handleCreateBlank}
                  >
                    + Nuevo documento
                  </button>
                </div>

                {loadingDocs && (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {errDocs && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {errDocs}
                  </div>
                )}

                {!loadingDocs && !documents.length && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <p className="text-blue-800 mb-4">
                      Aún no tienes documentos.
                    </p>
                    <button
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      onClick={handleCreateBlank}
                    >
                      Crear primer documento
                    </button>
                  </div>
                )}

                {!!documents.length && (
                  <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc as any}
                        onOpen={(d: DocumentEntity) =>
                          navigate(`/Board/${d.id}`)
                        }
                        onDeleted={handleCardDeleted}
                      />
                    ))}
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal para nombrar el diagrama al usar una plantilla */}
      <NameModal
        open={askNameOpen}
        title="Nombrar diagrama"
        placeholder="p. ej., Flujo de ventas Q3"
        initialValue={suggestedName}
        confirmLabel="Continuar"
        cancelLabel="Cancelar"
        onCancel={() => {
          setAskNameOpen(false);
          setPendingTpl(null);
        }}
        onConfirm={confirmTemplateName}
      />
    </div>
  );
}
