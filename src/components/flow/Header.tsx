import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "../home/LanguageSwitch"; 

const Header: React.FC = () => {
  const nav = useNavigate();
  const { t } = useTranslation("common");

  return (
    <header className="flex items-center justify-between bg-[#2C3E50] px-6 py-4 shadow-lg">
      <div
        className="flex cursor-pointer items-center gap-3"
        onClick={() => nav("/")}
        aria-label={t("sidebar.home")}
        title={t("sidebar.home")}
      >
        <img
          src="/images/logo.png"
          alt="Black Hat Archetype"
          className="h-13 object-contain rounded-lg"
        />
      </div>

      <div className="flex max-w-full items-center gap-4">
        {/* Botón New */}
        <button
          onClick={() => nav("/Board")}
          title={t("header.new")!}
          aria-label={t("header.new")!}
          className="rounded-xl border border-[#3498DB] bg-[#3498DB] px-5 py-2.5 text-white hover:bg-[#2980B9] focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 shadow-sm transition-all font-medium flex items-center gap-2"
        >
          <span aria-hidden>+</span>
          {t("header.new")}
        </button>

        {/* Switch ES/EN */}
        <LanguageSwitch />
      </div>
    </header>
  );
};

export default Header;
