import React from "react";
import { useNavigate } from "react-router-dom";

const Sidebar: React.FC = () => {
  const nav = useNavigate();
  return (
    <aside className="sidebar">
      <div className="user-chip">
        <div className="avatar">DB</div>
        <div>
          <div className="user-name">diego</div>
          <div className="user-plan">Personal</div>
        </div>
      </div>
      <button className="sidebar-btn" onClick={() => nav("/Board")}>+ Nuevo</button>
      <nav className="side-nav">
        <a className="nav-link active">Inicio</a>
        <a className="nav-link">Documentos</a>
        <a className="nav-link">Plantillas</a>
      </nav>
    </aside>
  );
};

export default Sidebar;
