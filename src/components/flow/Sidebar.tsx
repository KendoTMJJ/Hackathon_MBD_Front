// src/components/flow/Sidebar.tsx
import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";
import { useApi } from "../../hooks/useApi";

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
  const { t } = useTranslation();
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();
  const api = useApi();

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
      await loginWithRedirect({ appState: { returnTo: "/" } });
      return;
    }
    const project = await ensureDefaultProject();
    const q = new URLSearchParams({
      projectId: String(project.id),
      title: defaultTitle(),
    });
    nav(`/Board?${q.toString()}`); // draft con projectId
  };

  return (
    <div className="flex flex-col gap-3">
      {/* User chip */}
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
          <div className="text-xs text-[#c8c8cc]">{t("sidebar.personal")}</div>
        </div>
      </div>

      {/* New button */}
      <button
        className="w-full rounded-[10px] bg-[#ec1e79] px-3 py-2.5 text-white hover:brightness-105"
        onClick={handleNew}
      >
        + {t("sidebar.new")}
      </button>

      {/* Nav */}
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
  );
};

export default Sidebar;
