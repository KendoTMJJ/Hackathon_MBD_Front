import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Header: React.FC = () => {
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
      <div
        className="flex cursor-pointer items-center gap-3"
        onClick={() => nav("/")}
        aria-label="Home"
      >
        <span className="grid h-9 w-12 place-items-center select-none rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 font-bold text-white shadow-sm">
          BHA
        </span>
        <span className="font-semibold tracking-tight text-gray-900">
          Black Hat Archetype
        </span>
      </div>

      <div className="flex max-w-full items-center gap-3">
        <input
          className="hidden md:block w-[360px] max-w-[40vw] rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          placeholder={t("header.searchPlaceholder")!}
          aria-label={t("header.searchPlaceholder")!}
        />
        <button
          onClick={() => nav("/Board")} // sin id ni POST
          title={t("header.new")!}
          aria-label={t("header.new")!}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-colors font-medium"
        >
          {t("header.new")}
        </button>
      </div>
    </header>
  );
};

export default Header;
