import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import common_en from "./locales/en/common.json";
import common_es from "./locales/es/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: common_en },
      es: { common: common_es },
    },
    fallbackLng: "es",
    supportedLngs: ["es", "en"],
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  })
  .then(() => {
    // 👇 fija el lang inicial del <html>
    const lng = i18n.resolvedLanguage || i18n.language || "es";
    document.documentElement.setAttribute("lang", lng);
  });

// 👇 y cuando cambie el idioma, vuelve a actualizar el <html lang="...">
i18n.on("languageChanged", (lng) => {
  document.documentElement.setAttribute("lang", lng);
});

// 👇 helper en dev para probar en consola: i18next.t('templates.use', { ns: 'common' })
if (import.meta.env.DEV) {
  (window as any).i18next = i18n;
}

export default i18n;
