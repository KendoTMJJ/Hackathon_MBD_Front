// src/Pages/HomePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";

import Header from "../components/flow/Header";
import Sidebar from "../components/flow/Sidebar";
import TemplateCard from "../components/templates/TemplateCard";
import DocumentCard from "../components/templates/DocumentCard";
import NavBar from "../components/public/NavBar";
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

  // Estilos
  const btn =
    "px-3 py-2 rounded-[10px] border border-[#313138] bg-[#1b1b1f] text-white hover:border-[#3a3a41]";
  const btnAccent =
    "px-3 py-2 rounded-[10px] bg-[#ec1e79] text-white hover:brightness-105";

  // Render por vista (desde Sidebar)
  return (
    <div className="flex h-screen w-full flex-col bg-[#0f0f10] text-[#f0f0f0]">
      <NavBar />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden md:block w-[240px] shrink-0 bg-[#151517] border-r border-[#313138] p-[14px]">
          <Sidebar />
        </aside>

        <div className="flex h-full min-w-0 flex-1 flex-col">
          <Header />

          <div className="min-w-0 flex-1 overflow-auto p-[18px]">
            {/* ---------- HOME ---------- */}
            {view === "home" && (
              <>
                <section className="mb-4 flex items-center justify-between rounded-[14px] border border-[#313138] bg-gradient-to-b from-[#141417] to-[#121215] p-[18px]">
                  <div>
                    <h1 className="text-2xl font-bold">{t("home.welcome")}</h1>
                    <p className="mt-1 text-[#c8c8cc]">{t("home.subtitle")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className={btn} onClick={handleSeedTemplate}>
                      {t("home.loadSample", {
                        defaultValue: "Cargar plantilla de prueba",
                      })}
                    </button>
                    <button className={btnAccent} onClick={handleCreateBlank}>
                      {t("home.blankBoard", {
                        defaultValue: "Tablero en blanco",
                      })}
                    </button>
                  </div>
                </section>

                <section className="mb-4 flex flex-wrap gap-2">
                  {(
                    ["orgChart", "mindMap", "flowchart", "conceptMap"] as const
                  ).map((key) => (
                    <div
                      key={key}
                      className="rounded-full border border-[#313138] bg-[#121214] px-[10px] py-[6px] text-[#c8c8cc] hover:border-[#3a3a41] hover:text-white"
                    >
                      {t(`sections.${key}`)}
                    </div>
                  ))}
                </section>
              </>
            )}

            {/* ---------- TEMPLATES ---------- */}
            {view === "templates" && (
              <>
                <h2 className="mb-3 text-lg font-semibold">Plantillas</h2>
                {loadingTpls && (
                  <p>
                    {t("home.loadingTemplates", {
                      defaultValue: "Cargando plantillas…",
                    })}
                  </p>
                )}
                {errTpls && <p className="text-red-400">{errTpls}</p>}

                {!loadingTpls && !templates.length && (
                  <p className="text-[#c8c8cc]">
                    {t("home.noTemplates", {
                      defaultValue:
                        "No tienes plantillas aún. Usa “Cargar plantilla de prueba” o crea una desde el editor.",
                    })}
                  </p>
                )}

                {!!templates.length && (
                  <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                <h2 className="mb-3 text-lg font-semibold">Documentos</h2>
                {loadingDocs && (
                  <p>
                    {t("home.loadingDocuments", {
                      defaultValue: "Cargando documentos…",
                    })}
                  </p>
                )}
                {errDocs && <p className="text-red-400">{errDocs}</p>}
                {!loadingDocs && !documents.length && (
                  <p className="text-[#c8c8cc]">Aún no tienes documentos.</p>
                )}

                {!!documents.length && (
                  <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc as any}
                        onOpen={(d: DocumentEntity) =>
                          navigate(`/Board/${d.id}`)
                        }
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
