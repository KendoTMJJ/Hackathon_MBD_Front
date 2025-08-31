// src/components/templates/TemplateCard.tsx
import { useTranslation } from "react-i18next";
import type { TemplateEntity } from "../../models";

export default function TemplateCard({
  tpl,
  onUse,
}: {
  tpl: TemplateEntity;
  onUse: (tpl: TemplateEntity) => void;
}) {
  const { t } = useTranslation();

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
      {/* preview (sigue igual, solo decorativo) */}
      <div className="h-28 w-full bg-[linear-gradient(90deg,#ec1e79,#1b1c1f)] opacity-60" />

      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{tpl.title}</h3>
          {/* i18n del subtítulo/“tipo” */}
          <p className="text-xs text-[var(--muted)]">{t("templates.type")}</p>
        </div>

        <button
          onClick={() => onUse(tpl)}
          className="rounded-md bg-[var(--accent)] px-3 py-1 text-sm text-white"
        >
          {t("templates.use")}
        </button>
      </div>
    </article>
  );
}