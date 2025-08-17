type TabKey = "home" | "templates" | "documents";

export function CategoryTabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const base =
    "px-3 py-2 text-sm rounded-md border border-transparent hover:border-white/10";
  const activeCls = "bg-white/10";
  const idle = "bg-transparent";

  return (
    <div className="mb-4 flex gap-2">
      <button
        className={`${base} ${active === "home" ? activeCls : idle}`}
        onClick={() => onChange("home")}
      >
        Home
      </button>
      <button
        className={`${base} ${active === "templates" ? activeCls : idle}`}
        onClick={() => onChange("templates")}
      >
        Templates
      </button>
      <button
        className={`${base} ${active === "documents" ? activeCls : idle}`}
        onClick={() => onChange("documents")}
      >
        Documents
      </button>
    </div>
  );
}
