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

  const useLabel =
    t("templates.use", { defaultValue: "Usar" }) +
    ` “${tpl.title ?? ""}”`;

  return (
    <article
      className="rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden"
      title={tpl.title}
      aria-label={tpl.title}
    >
      {/* preview (decorativo) */}
      <div
        className="h-28 w-full bg-[linear-gradient(90deg,#ec1e79,#1b1c1f)] opacity-60"
        aria-hidden="true"
      />

      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 title={tpl.title} className="font-semibold">
            {tpl.title}
          </h3>
          <p
            className="text-xs text-[var(--muted)]"
            title={t("templates.type")}
          >
            {t("templates.type")}
          </p>
        </div>

        <button
          onClick={() => onUse(tpl)}
          className="rounded-md bg-[var(--accent)] px-3 py-1 text-sm text-white"
          title={useLabel}
          aria-label={useLabel}
        >
          {t("templates.use", { defaultValue: "Usar" })}
        </button>
      </div>
    </article>
  );
}
