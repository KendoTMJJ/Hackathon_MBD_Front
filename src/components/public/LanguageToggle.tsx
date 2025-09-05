import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const isES = i18n.language.startsWith("es");

  const toggle = () => {
    i18n.changeLanguage(isES ? "en" : "es");
  };

  return (
    <button
      onClick={toggle}
      aria-label={t("lang.switch")}
      title={t("lang.switch")}
      className="rounded-md border px-2 py-1 text-sm text-white"
    >
      {isES ? "EN" : "ES"}
    </button>
  );
}
