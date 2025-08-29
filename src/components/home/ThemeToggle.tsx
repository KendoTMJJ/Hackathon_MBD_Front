import { useEffect } from "react";
import { initTheme, toggleTheme } from "../../theme";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  useEffect(() => {
    initTheme(); // Aplica preferencia guardada o la del sistema
  }, []);

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      aria-label="Cambiar contraste"
      title="Cambiar contraste"
      className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg border bg-black/60 hover:scale-105 transition p-3 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 text-white">
        <Sun className="w-5 h-5" />
        <Moon className="w-5 h-5" />
      </div>
    </button>
  );
}
