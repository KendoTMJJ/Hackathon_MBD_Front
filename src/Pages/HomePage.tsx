// import React from "react";

import { useNavigate } from "react-router-dom";
import NavBar from "../components/public/NavBar";

function HomePage() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/Board");
  };

  return (
    <div>
      <NavBar></NavBar>
      <div className="text-white">
        <h1>Página de Inicio</h1>
        <button onClick={handleClick}>Ir al tablero</button>
      </div>
    </div>
  );
}

export default HomePage;
