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
import { FolderOpen, PencilLine } from "lucide-react";
import { useCan } from "../components/auth/acl";

function defaultTitle(
  kind: "diagram" | "template",
  t: (k: string, opts?: any) => string
) {
  const d = new Date();
  const lang =
    document.documentElement.getAttribute("lang") || navigator.language || "es";
  const stamp = d.toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" });
  return kind === "template"
    ? `${t("templates.type", { defaultValue: "Plantilla" })} ${stamp}`
    : `${t("documents.type", { defaultValue: "Diagrama" })} ${stamp}`;
}

export default function HomePage() {
  const { pathname } = useLocation();
  const view: "home" | "templates" | "documents" = useMemo(() => {
    if (pathname.startsWith("/templates")) return "templates";
    if (pathname.startsWith("/documents")) return "documents";
    return "home";
  }, [pathname]);

  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();
  const { t } = useTranslation("common");
  const api = useApi();
  const navigate = useNavigate();
  const canCreate = useCan("template:create");

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
        name: t("home.defaultProjectName", { defaultValue: "My diagrams" }),
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
      title: defaultTitle("diagram", t),
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
    setSuggestedName(`${tpl.title ?? t("documents.type", { defaultValue: "Diagrama" })}`);
    setAskNameOpen(true);
  };

  async function confirmTemplateName(name: string) {
    if (!pendingTpl) return;
    const project = await ensureDefaultProject();
    const q = new URLSearchParams({
      projectId: String(project.id),
      templateId: String(pendingTpl.id),
      title: (name && name.trim()) || defaultTitle("diagram", t),
    });
    setAskNameOpen(false);
    setPendingTpl(null);
    navigate(`/Board?${q.toString()}`); // draft
  }

  // 🔹 Handler para eliminación optimista en la vista de documentos
  const handleCardDeleted = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleTemplateDeleted = (id: string) => {
    setTemplates((prev) =>
      prev.filter((t) => String(t.id ?? (t as any).cod_template) !== String(id))
    );
  };

  // Render por vista (desde Sidebar)
  return (
    <div className="flex h-screen w-full flex-col bg-gradient-to-br from-blue-50 to-gray-50 text-gray-800">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden md:block w-[240px] shrink-0 bg-[#2C3E50] border-r border-[#34495E] p-4">
          <Sidebar />
        </aside>
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <Header />
          <div className="min-w-0 flex-1 overflow-auto p-6">
            {/* ---------- HOME ---------- */}
            {view === "home" && (
              <>
                {/* HERO con 2 botones traducidos */}
                <section className="mb-8 flex flex-col md:flex-row items-center justify-between rounded-2xl border border-[#3498DB]/20 bg-white p-8 shadow-lg">
                  <div className="mb-4 md:mb-0">
                    <h1 className="text-4xl font-bold text-[#2C3E50]">
                      {t("home.welcome")}
                    </h1>
                    <p className="mt-3 text-lg text-[#7F8C8D] max-w-lg">
                      {t("home.subtitle")}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <button
                      className="px-6 py-3 rounded-xl border border-[#3498DB] bg-white text-white hover:bg-[#3498DB] hover:text-white transition-all shadow-sm font-medium flex items-center gap-2"
                      onClick={handleSeedTemplate}
                      title={t("header.loadSample")}
                      aria-label={t("header.loadSample")}
                    >
                      <FolderOpen className="text-white" />
                      {t("header.loadSample")}
                    </button>
                    <button
                      className="px-6 py-3 rounded-xl bg-[#2ECC71] text-white hover:bg-[#27AE60] transition-all shadow-md font-medium flex items-center gap-2"
                      onClick={handleCreateBlank}
                      title={t("header.blankBoard")}
                      aria-label={t("header.blankBoard")}
                    >
                      <PencilLine className="text-white" />
                      {t("header.blankBoard")}
                    </button>
                  </div>
                </section>

                {/* Servicios de seguridad (4 tarjetas traducidas) */}
                <section className="mb-8">
                  <h2 className="text-2xl font-bold mb-5 text-[#2C3E50]">
                    {t("home.servicesTitle")}
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    {(
                      [
                        "diagnostico",
                        "prueba-penetracion",
                        "ponderacion",
                        "analisis-forense",
                      ] as const
                    ).map((key) => {
                      const sectionConfig = {
                        diagnostico: {
                          image: "images/DiagnosticoSeguridad.png",
                          text: t("services.diagnostico.title"),
                          description: t("services.diagnostico.desc"),
                        },
                        "prueba-penetracion": {
                          image: "images/PruebaPenetracion.png",
                          text: t("services.prueba.title"),
                          description: t("services.prueba.desc"),
                        },
                        ponderacion: {
                          image: "images/PonderacionSeguridad.png",
                          text: t("services.ponderacion.title"),
                          description: t("services.ponderacion.desc"),
                        },
                        "analisis-forense": {
                          image: "images/AnalisisForense.png",
                          text: t("services.forense.title"),
                          description: t("services.forense.desc"),
                        },
                      } as const;

                      return (
                        <div
                          key={key}
                          className="flex-1 min-w-[250px] rounded-xl border border-[#3498DB]/20 bg-white p-4 text-[#7F8C8D] hover:border-[#3498DB] hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="mb-3">
                              <img
                                src={sectionConfig[key].image}
                                alt={sectionConfig[key].text}
                                className="w-23 h-20 rounded-lg"
                              />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium block mb-2 text-[#2C3E50]">
                                {sectionConfig[key].text}
                              </span>
                              <p className="text-xs text-[#7F8C8D] leading-relaxed">
                                {sectionConfig[key].description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {/* ---------- TEMPLATES ---------- */}
            {view === "templates" && (
              <>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-[#2C3E50]">
                    {t("templates.title")}
                  </h2>

                  {canCreate && (
                    <button
                      className="px-5 py-2.5 rounded-xl bg-[#2ECC71] text-white hover:bg-[#27AE60] transition-all shadow-md font-medium flex items-center gap-2"
                      onClick={handleSeedTemplate}
                    >
                      <span>+</span>
                      {t("home.newTemplateBtn", { defaultValue: "Nueva plantilla" })}
                    </button>
                  )}
                </div>

                {loadingTpls && (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3498DB]"></div>
                  </div>
                )}

                {errTpls && (
                  <div className="bg-red-100 border border-red-300 text-red-700 px-5 py-4 rounded-xl mb-5">
                    {errTpls}
                  </div>
                )}

                {!loadingTpls && !templates.length && (
                  <div className="bg-[#3498DB]/10 border border-[#3498DB]/20 rounded-2xl p-8 text-center">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="text-[#2C3E50] mb-5 text-lg">
                      {t("templates.hint")}
                    </p>
                    <button
                      className="px-5 py-2.5 rounded-xl bg-[#3498DB] text-white hover:bg-[#2980B9] transition-all shadow-md font-medium"
                      onClick={handleSeedTemplate}
                    >
                      {t("home.createSampleTemplate", {
                        defaultValue: "Crear plantilla de ejemplo",
                      })}
                    </button>
                  </div>
                )}

                {!!templates.length && (
                  <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((tpl) => (
                      <TemplateCard
                        key={tpl.id}
                        tpl={tpl as any}
                        onUse={() => handleUseTemplate(tpl)}
                        onDeleted={handleTemplateDeleted}
                      />
                    ))}
                  </section>
                )}
              </>
            )}

            {/* ---------- DOCUMENTS ---------- */}
            {view === "documents" && (
              <>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-[#2C3E50]">
                    {t("documents.title")}
                  </h2>
                  <button
                    className="px-5 py-2.5 rounded-xl bg-[#2ECC71] text-white hover:bg-[#27AE60] transition-all shadow-md font-medium flex items-center gap-2"
                    onClick={handleCreateBlank}
                  >
                    <span>+</span>
                    {t("home.newDocumentBtn", { defaultValue: "Nuevo documento" })}
                  </button>
                </div>

                {loadingDocs && (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3498DB]"></div>
                  </div>
                )}

                {errDocs && (
                  <div className="bg-red-100 border border-red-300 text-red-700 px-5 py-4 rounded-xl mb-5">
                    {errDocs}
                  </div>
                )}

                {!loadingDocs && !documents.length && (
                  <div className="bg-[#3498DB]/10 border border-[#3498DB]/20 rounded-2xl p-8 text-center">
                    <div className="text-5xl rounded-lg bg-blue-100 p-3 inline-block">
                      <FolderOpen className="w-25 h-25" />
                    </div>
                    <p className="text-[#2C3E50] mb-5 text-lg">
                      {t("documents.empty")}
                    </p>
                    <button
                      className="px-5 py-2.5 rounded-xl bg-[#3498DB] text-white hover:bg-[#2980B9] transition-all shadow-md font-medium"
                      onClick={handleCreateBlank}
                    >
                      {t("home.createFirstDoc", { defaultValue: "Crear primer documento" })}
                    </button>
                  </div>
                )}

                {!!documents.length && (
                  <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc as any}
                        onOpen={(d: DocumentEntity) => navigate(`/Board/${d.id}`)}
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
        title={t("home.nameDiagramTitle", { defaultValue: "Nombrar diagrama" })}
        placeholder={t("home.nameDiagramPlaceholder", {
          defaultValue: "p. ej., Flujo de ventas Q3",
        })}
        initialValue={suggestedName}
        confirmLabel={t("home.continue", { defaultValue: "Continuar" })}
        cancelLabel={t("home.cancel", { defaultValue: "Cancelar" })}
        onCancel={() => {
          setAskNameOpen(false);
          setPendingTpl(null);
        }}
        onConfirm={confirmTemplateName}
      />
    </div>
  );
}
