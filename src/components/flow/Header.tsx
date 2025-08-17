import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Header: React.FC = () => {
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between border-b border-[#313138] bg-[#151517] px-4 py-3">
      <div
        className="flex cursor-pointer items-center gap-2"
        onClick={() => nav("/")}
        aria-label="Home"
      >
        <span className="grid h-7 w-7 place-items-center select-none rounded-md bg-[#ec1e79] font-extrabold text-white">
          Bl
        </span>
        <span className="font-semibold tracking-tight">Black Hat</span>
      </div>

      <div className="flex max-w-full items-center gap-2">
        <input
          className="hidden md:block w-[360px] max-w-[40vw] rounded-[10px] border border-[#313138] bg-[#0f0f10] px-2.5 py-2 text-white outline-none placeholder:text-[#c8c8cc]/80 focus:border-[#3a3a41] focus:ring-1 focus:ring-[#3a3a41]"
          placeholder={t("header.searchPlaceholder")!}
          aria-label={t("header.searchPlaceholder")!}
        />
        <button
          onClick={() => nav("/Board")} // sin id ni POST
          title={t("header.new")!}
          aria-label={t("header.new")!}
          className="rounded-[10px] border border-[#313138] bg-[#2a2a2f] px-3 py-2 text-white hover:border-[#3a3a41]"
        >
          {t("header.new")}
        </button>
      </div>
    </header>
  );
};

export default Header;
