import TemplateCard from "../templates/TemplateCard";
import type { TemplateEntity } from "../../models";

export function TemplatesSection({
  templates,
  onUse,
}: {
  templates: TemplateEntity[];
  onUse: (tpl: TemplateEntity) => void;
}) {
  if (!templates.length) {
    return (
      <p className="text-[#c8c8cc]">
        No tienes plantillas aún. Usa “Cargar plantilla de prueba” o crea una
        desde el editor.
      </p>
    );
  }
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((tpl) => (
        <TemplateCard key={tpl.id} tpl={tpl as any} onUse={onUse as any} />
      ))}
    </section>
  );
}
