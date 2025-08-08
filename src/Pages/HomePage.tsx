// import React from "react";

import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/Board");
  };

  return (
    <div className="text-white">
      <h1>Página de Inicio</h1>
      <button onClick={handleClick}>Ir al tablero</button>
    </div>
  );
}

export default HomePage;
