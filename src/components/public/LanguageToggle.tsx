import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const isES = i18n.language?.startsWith("es");

  const toggle = () => {
    i18n.changeLanguage(isES ? "en" : "es");
    // i18next-browser-languagedetector lo guardará en localStorage
  };

  return (
    <button
      onClick={toggle}
      className="rounded-md px-3 py-1.5 border border-white/10 hover:bg-white/5"
      title={isES ? "Switch to English" : "Cambiar a Español"}
    >
      {isES ? "EN" : "ES"}
    </button>
  );
}