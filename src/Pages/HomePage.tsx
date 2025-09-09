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
import { SAMPLE_TEMPLATE_DATA, SAMPLE_TEMPLATE_TITLE } from "../features/templates/sample";
import { FolderOpen, PencilLine } from "lucide-react";

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
        e?.message ?? t("home.loadError", { defaultValue: "Error cargando plantillas" })
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
        e?.message ?? t("home.loadError", { defaultValue: "Error cargando documentos" })
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
    setSuggestedName(`${tpl.title ?? "diagrama"}`);
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
                    >
                      <FolderOpen className="text-white" />
                      {t("home.loadSample", {
                        defaultValue: "Cargar plantilla de prueba",
                      })}
                    </button>
                    <button
                      className="px-6 py-3 rounded-xl bg-[#2ECC71] text-white hover:bg-[#27AE60] transition-all shadow-md font-medium flex items-center gap-2"
                      onClick={handleCreateBlank}
                    >
                      <PencilLine className="text-white" />
                      {t("home.blankBoard", {
                        defaultValue: "Crear diagrama en blanco",
                      })}
                    </button>
                  </div>
                </section>

                <section className="mb-8">
  <h2 className="text-2xl font-bold mb-5 text-[#2C3E50]">
    Servicios de seguridad
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
          text: "Diagnóstico de Seguridad",
          description: "Con este diagnóstico, se hace una exploración en el sistema y se identifican las diferentes vulnerabilidades este puede llegar a tener, una vez el estudio concluye brindamos las herramientas más efectivas del mercado para ponerle fin a las deficiencias de seguridad que tenga tu compañía."
        },
        "prueba-penetracion": { 
          image: "images/PruebaPenetracion.png", 
          text: "Prueba de Penetración",
          description: "Esta prueba pretende verificar qué tan difícil es acceder a los servidores de la compañía, a través de un ataque directo a la infraestructura del servidor o la red desde un punto externo o interno que intentará realizar cambios, denegaciones o extracciones de información."
        },
        ponderacion: { 
          image: "images/PonderacionSeguridad.png", 
          text: "Ponderación de Seguridad", 
          description: "La ponderación permite saber si las medidas de control implementadas en la RED (Firewall, WAF, ADC, Antivirus, etc.) están actuando de forma coordinada y correcta frente a posibles amenazas externas, de esta forma podemos saber cuantitativamente el nivel de seguridad de la infraestructura."
        },
        "analisis-forense": { 
          image: "images/AnalisisForense.png", 
          text: "Análisis Forense",
          description: "El análisis forense es el proceso de investigación y recopilación de evidencia digital tras un evento de seguridad, como un ciberataque, acceso no autorizado o fraude. Su objetivo es identificar qué ocurrió, como sucedió y quién estuvo involucrado, utilizando tecnologías y técnicas avanzadas."
        }
      };

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
                    Plantillas
                  </h2>
                  <button
                    className="px-5 py-2.5 rounded-xl bg-[#2ECC71] text-white hover:bg-[#27AE60] transition-all shadow-md font-medium flex items-center gap-2"
                    onClick={handleSeedTemplate}
                  >
                    <span>+</span>
                    Nueva plantilla
                  </button>
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
                      {t("home.noTemplates", {
                        defaultValue:
                          'No tienes plantillas aún. Usa "Cargar plantilla de prueba" o crea una desde el editor.',
                      })}
                    </p>
                    <button
                      className="px-5 py-2.5 rounded-xl bg-[#3498DB] text-white hover:bg-[#2980B9] transition-all shadow-md font-medium"
                      onClick={handleSeedTemplate}
                    >
                      Crear plantilla de ejemplo
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
                    Mis Documentos
                  </h2>
                  <button
                    className="px-5 py-2.5 rounded-xl bg-[#2ECC71] text-white hover:bg-[#27AE60] transition-all shadow-md font-medium flex items-center gap-2"
                    onClick={handleCreateBlank}
                  >
                    <span>+</span>
                    Nuevo documento
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
                      <FolderOpen className="w-25 h-25"/>
                    </div>
                    <p className="text-[#2C3E50] mb-5 text-lg">
                      Aún no tienes documentos.
                    </p>
                    <button
                      className="px-5 py-2.5 rounded-xl bg-[#3498DB] text-white hover:bg-[#2980B9] transition-all shadow-md font-medium"
                      onClick={handleCreateBlank}
                    >
                      Crear primer documento
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