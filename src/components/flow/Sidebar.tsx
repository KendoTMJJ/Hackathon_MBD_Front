import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";

const Sidebar: React.FC = () => {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth0();

  const displayName = String(user?.name || user?.email || "diego");
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "DB";

  const go = (path: string) => () => nav(path);

  return (
    <aside className="sidebar">
      <div className="user-chip">
        <div className="avatar" aria-hidden="true">
          {initials}
        </div>
        <div>
          <div className="user-name">{isAuthenticated ? displayName : "diego"}</div>
          <div className="user-plan">{t("sidebar.personal")}</div>
        </div>
      </div>

      <button className="sidebar-btn" onClick={go("/Board")}>
        + {t("sidebar.new")}
      </button>

      <nav className="side-nav" aria-label="Primary">
        <a
          className={`nav-link ${pathname === "/" ? "active" : ""}`}
          onClick={go("/")}
          role="link"
          tabIndex={0}
        >
          {t("sidebar.home")}
        </a>
        <a
          className={`nav-link ${pathname.startsWith("/documents") ? "active" : ""}`}
          onClick={go("/documents")}
          role="link"
          tabIndex={0}
        >
          {t("sidebar.documents")}
        </a>
        <a
          className={`nav-link ${pathname.startsWith("/templates") ? "active" : ""}`}
          onClick={go("/templates")}
          role="link"
          tabIndex={0}
        >
          {t("sidebar.templates")}
        </a>
      </nav>
    </aside>
  );
};

export default Sidebar;
