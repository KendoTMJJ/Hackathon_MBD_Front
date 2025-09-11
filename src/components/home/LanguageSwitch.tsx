import { useTranslation } from "react-i18next";

export default function LanguageSwitch() {
  const { i18n, t } = useTranslation("common");
  const isEs = i18n.language?.startsWith("es");
  const next = isEs ? "en" : "es";

  return (
    <button
      onClick={() => i18n.changeLanguage(next)}
      title={t("lang.switch")}
      aria-label={t("lang.switch")}
      className="rounded-xl px-3 py-1 text-xs bg-slate-800 text-white"
    >
      {isEs ? t("lang.en") : t("lang.es")}
    </button>
  );
}
