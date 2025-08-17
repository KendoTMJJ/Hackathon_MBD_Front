import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const nav = useNavigate();
  return (
    <header className="app-header">
      <div className="brand" onClick={() => nav('/')}>
        <span className="logo">Bl</span>
        <span className="brand-name">Black Hat</span>
      </div>
      <div className="header-actions">
        <input className="search" placeholder="Buscar plantillas o documentos..." />
        <button className="btn btn-primary" onClick={() => nav('/Board')}>Nuevo</button>
      </div>
    </header>
  );
};

export default Header;
