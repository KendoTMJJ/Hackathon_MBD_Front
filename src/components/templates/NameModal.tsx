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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#141420] p-4 text-white shadow-xl">
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="mb-4 w-full rounded-md border border-white/10 bg-[#0f0f10] px-3 py-2 outline-none focus:border-white/20"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-white/10 bg-[#1b1b1f] px-3 py-1.5 hover:brightness-110"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onConfirm(value.trim())}
            className="rounded-md bg-[#ec1e79] px-3 py-1.5 text-white hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
