// src/components/templates/NameModal.tsx
import { useEffect, useState } from "react";

export default function NameModal({
  open,
  title = "Nombre",
  placeholder = "Escribe un nombre…",
  initialValue = "",
  confirmLabel = "Continuar",
  cancelLabel = "Cancelar",
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
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#3498DB]/20 bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-[#2C3E50]">{title}</h3>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="mb-6 w-full rounded-xl border border-[#3498DB]/30 bg-[#F8F9FA] px-4 py-3.5 text-[#2C3E50] outline-none focus:border-[#3498DB] focus:ring-2 focus:ring-[#3498DB]/20 transition-all"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-[#3498DB]/30 bg-white px-5 py-2.5 text-[#2C3E50] hover:bg-[#F8F9FA] transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onConfirm(value.trim())}
            className="rounded-xl bg-[#2ECC71] px-5 py-2.5 text-white hover:bg-[#27AE60] transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}