import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function NameModal({
  open,
  // Si no te pasan labels, toma las traducciones por defecto
  title,
  placeholder,
  confirmLabel,
  cancelLabel,
  initialValue = "",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const { t } = useTranslation("common");
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  if (!open) return null;

  const finalTitle =
    title ?? t("home.nameDiagramTitle", { defaultValue: "Nombrar diagrama" });
  const finalPlaceholder =
    placeholder ??
    t("home.nameDiagramPlaceholder", {
      defaultValue: "p. ej., Flujo de ventas Q3",
    });
  const finalConfirm =
    confirmLabel ?? t("home.continue", { defaultValue: "Continuar" });
  const finalCancel =
    cancelLabel ?? t("home.cancel", { defaultValue: "Cancelar" });

  const trimmed = value.trim();
  const handleConfirm = () => onConfirm(trimmed);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onKeyDown={(e) => {
        if (e.key === "Enter" && trimmed) handleConfirm();
        if (e.key === "Escape") onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={finalTitle}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#3498DB]/20 bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-[#2C3E50]">{finalTitle}</h3>

        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={finalPlaceholder}
          className="mb-6 w-full rounded-xl border border-[#3498DB]/30 bg-[#F8F9FA] px-4 py-3.5 text-[#2C3E50] outline-none focus:border-[#3498DB] focus:ring-2 focus:ring-[#3498DB]/20 transition-all"
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-5 py-2.5 transition-all !bg-white !text-[#2C3E50] !border !border-[#3498DB]/30 hover:!bg-[#F0F4F8] focus:!outline-none focus:!ring-0"
          >
            {finalCancel}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!trimmed}
            className="rounded-xl px-5 py-2.5 transition-all !bg-[#3498DB] !text-white hover:!bg-[#2980B9] !border !border-transparent disabled:opacity-60 disabled:cursor-not-allowed focus:!outline-none focus:!ring-0"
          >
            {finalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
