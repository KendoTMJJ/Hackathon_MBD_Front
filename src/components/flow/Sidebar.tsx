// src/components/flow/Sidebar.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";
import { useApi } from "../../hooks/useApi";
import LanguageToggle from "../public/LanguageToggle";

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
  const api = useApi();

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

  const displayName = String(user?.name || user?.email || "diego");
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "DB";

  const linkBase =
    "block rounded-md px-2.5 py-2 text-[#c8c8cc] hover:bg-[#1b1b1f] hover:text-white";
  const linkActive = "bg-[#1b1b1f] text-white";

  // mismo comportamiento que tenías para crear/obtener proyecto por defecto
  async function ensureDefaultProject() {
    const { data: projs } = await api.get("/projects");
    if (!Array.isArray(projs) || projs.length === 0) {
      const created = await api.post("/projects", {
        name: t("home.defaultProjectName", { defaultValue: "My Diagrams" }),
      });
      return created.data;
    }
    return projs[0];
  }

  const handleNew = async () => {
    if (!isAuthenticated) {
      const uiLocale = i18n.language?.startsWith("en") ? "en" : "es";
      await loginWithRedirect({
        appState: { returnTo: "/" },
        authorizationParams: { ui_locales: uiLocale },
      });
      return;
    }
    const project = await ensureDefaultProject();
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
      <div className="flex flex-col gap-3">
        {/* User chip + menú */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-9 w-9 select-none place-items-center rounded-lg bg-[#2a2a2f] font-bold text-white"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div>
              <div className="font-semibold">
                {isAuthenticated ? displayName : "diego"}
              </div>
              <div className="text-xs text-[#c8c8cc]">
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
                className="rounded-md border border-white/10 bg-[#171727] px-2.5 py-1.5 text-sm text-white hover:bg-[#1c1c2e]"
                title={t("navbar.login")}
              >
                {t("navbar.login")}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-md px-2 py-1.5 text-sm text-white hover:bg-white/5"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  ⋯
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-44 overflow-hidden rounded-md border border-white/10 bg-[#141420] text-sm shadow-lg"
                  >
                    <button
                      role="menuitem"
                      className="block w-full px-3 py-2 text-left hover:bg-white/5"
                      onClick={() => {
                        setMenuOpen(false);
                        nav("/profile");
                      }}
                    >
                      {t("navbar.profile", { defaultValue: "Mi perfil" })}
                    </button>
                    <button
                      role="menuitem"
                      className="block w-full px-3 py-2 text-left hover:bg-white/5"
                      onClick={() => {
                        setMenuOpen(false);
                        logout({
                          logoutParams: { returnTo: window.location.origin },
                        });
                      }}
                    >
                      {t("navbar.logout")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* New button */}
        <button
          className="w-full rounded-[10px] bg-[#ec1e79] px-3 py-2.5 text-white hover:brightness-105"
          onClick={handleNew}
        >
          + {t("sidebar.new")}
        </button>

        {/* Nav links */}
        <nav className="mt-2 flex flex-col gap-1.5" aria-label="Primary">
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
      <div className="mt-4 border-t border-white/10 pt-3">
        <LanguageToggle />
      </div>
    </div>
  );
};

export default Sidebar;
