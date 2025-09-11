// src/components/flow/Sidebar.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";
import { BookText, House, StickyNote, User } from "lucide-react";
import { useProject } from "../../hooks/useProject";

function defaultTitle() {
  const d = new Date();
  const stamp = d.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `Diagrama ${stamp}`;
}

const Sidebar: React.FC = () => {
  const nav = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const projectsApi = useProject();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const displayName = String(user?.name || user?.email || "Usuario");
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "DB";

  const linkBase =
    "block rounded-xl px-4 py-3 text-[#ECF0F1] hover:bg-[#34495E] hover:text-white transition-all font-medium flex items-center gap-3";
  const linkActive = "bg-[#34495E] text-white border-r-4 border-[#3498DB]";

  const handleNew = async () => {
    if (!isAuthenticated) {
      const uiLocale = i18n.language?.startsWith("en") ? "en" : "es";
      await loginWithRedirect({
        appState: { returnTo: "/home" },
        authorizationParams: { ui_locales: uiLocale },
      });
      return;
    }
    const project = await projectsApi.ensureDefault(
      t("home.defaultProjectName", { defaultValue: "My Diagrams" })
    );
    const q = new URLSearchParams({
      projectId: String(project.id),
      title: defaultTitle(),
    });
    nav(`/Board?${q.toString()}`);
  };

  const uiLocale = i18n.language?.startsWith("en") ? "en" : "es";

  return (
    <div className="flex h-full flex-col justify-between text-white">
      {/* Top: usuario + acciones rápidas + navegación */}
      <div className="flex flex-col gap-5">
        {/* User chip + menú */}
        <div className="flex items-center justify-between gap-3 p-3 bg-[#34495E] rounded-xl">
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 select-none place-items-center rounded-xl bg-white font-bold text-[#2C3E50] shadow-md"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div>
              <div className="font-semibold text-white">
                {isAuthenticated ? displayName : "Usuario"}
              </div>
              <div className="text-xs text-[#BDC3C7]">
                {t("sidebar.personal")}
              </div>
            </div>
          </div>

          {/* Menú usuario / login */}
          <div className="relative" ref={menuRef}>
            {!isAuthenticated ? (
              <button
                onClick={() =>
                  loginWithRedirect({
                    appState: { returnTo: "/home" },
                    authorizationParams: { ui_locales: uiLocale },
                  })
                }
                title={t("navbar.login")}
              >
                <User size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-xl px-3 py-1.5 text-sm text-[#BDC3C7] hover:text-white hover:bg-[#34495E] transition-all"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  ⋯
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-[#3498DB] bg-[#2C3E50] text-sm shadow-lg z-10"
                  >
                    <button
                      role="menuitem"
                      className="block w-full px-4 py-3 text-left text-white hover:bg-[#34495E] transition-all"
                      onClick={() => {
                        setMenuOpen(false);
                        nav("/profile");
                      }}
                    >
                      {t("navbar.profile", { defaultValue: "Mi perfil" })}
                    </button>
                    <button
                      role="menuitem"
                      className="block w-full px-4 py-3 text-left text-white hover:bg-[#34495E] transition-all"
                      onClick={() => {
                        setMenuOpen(false);
                        logout({
                          logoutParams: { returnTo: window.location.origin },
                        });
                      }}
                    >
                      {t("logout")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* New button */}
        <button
          className="w-full rounded-xl bg-white px-5 py-3.5 text-white hover:bg-[#ECF0F1] shadow-md transition-all font-medium flex items-center justify-center gap-2"
          onClick={handleNew}
        >
          <span className="text-lg">+</span>
          {t("sidebar.new")}
        </button>

        {/* Nav links */}
        <nav className="mt-4 flex flex-col gap-2" aria-label="Primary">
          <NavLink
            to="/home"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : ""}`
            }
          >
            <House className="text-white" />
            <span className="text-white">{t("sidebar.home")}</span>
          </NavLink>

          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : ""}`
            }
          >
            <BookText className="text-white" />
            <span className="text-white">{t("sidebar.documents")}</span>
          </NavLink>

          <NavLink
            to="/templates"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : ""}`
            }
          >
            <StickyNote className="text-white" />
            <span className="text-white">{t("sidebar.templates")}</span>
          </NavLink>
        </nav>
      </div>

      {/* Bottom: (eliminado el selector de idioma) */}
      {/* Antes aquí estaba <LanguageToggle />; se removió para ocultar el botón EN/ES del borde inferior izquierdo. */}
      <div className="mt-4 border-t border-transparent pt-4" />
    </div>
  );
};

export default Sidebar;
