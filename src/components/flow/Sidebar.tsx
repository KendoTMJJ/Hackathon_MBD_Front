import React, { useEffect, useRef, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../public/LanguageToggle";
import { User } from "lucide-react";
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
    "block rounded-lg px-3 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors font-medium";
  const linkActive = "bg-blue-50 text-blue-700 border-r-2 border-blue-600";

  const handleNew = async () => {
    if (!isAuthenticated) {
      const uiLocale = i18n.language?.startsWith("en") ? "en" : "es";
      await loginWithRedirect({
        appState: { returnTo: "/" },
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
    nav(`/Board?${q.toString()}`); // draft con projectId
  };

  const uiLocale = i18n.language?.startsWith("en") ? "en" : "es";

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Top: usuario + acciones rápidas + navegación */}
      <div className="flex flex-col gap-4">
        {/* User chip + menú */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 select-none place-items-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 font-bold text-white shadow-sm"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {isAuthenticated ? displayName : "Usuario"}
              </div>
              <div className="text-xs text-gray-500">
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
                    appState: { returnTo: "/" },
                    authorizationParams: { ui_locales: uiLocale },
                  })
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                title={t("navbar.login")}
              >
                <User size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  ⋯
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white text-sm shadow-lg z-10"
                  >
                    <button
                      role="menuitem"
                      className="block w-full px-4 py-2.5 text-left text-white hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setMenuOpen(false);
                        nav("/profile");
                      }}
                    >
                      {t("navbar.profile", { defaultValue: "Mi perfil" })}
                    </button>
                    <button
                      role="menuitem"
                      className="block w-full px-4 py-2.5 text-left text-white hover:bg-gray-50 transition-colors"
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
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-white hover:from-blue-700 hover:to-blue-600 shadow-sm transition-colors font-medium"
          onClick={handleNew}
        >
          + {t("sidebar.new")}
        </button>

        {/* Nav links */}
        <nav className="mt-3 flex flex-col gap-1.5" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : ""}`
            }
          >
            {t("sidebar.home")}
          </NavLink>

          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : ""}`
            }
          >
            {t("sidebar.documents")}
          </NavLink>

          <NavLink
            to="/templates"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : ""}`
            }
          >
            {t("sidebar.templates")}
          </NavLink>
        </nav>
      </div>

      {/* Bottom: selector de idioma */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <LanguageToggle />
      </div>
    </div>
  );
};

export default Sidebar;
