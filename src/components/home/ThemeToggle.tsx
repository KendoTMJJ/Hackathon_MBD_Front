import { useEffect, useState } from "react";
import { initTheme, toggleTheme, getCurrentTheme } from "../../theme";
import type { Theme } from "../../theme";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    initTheme();
    setTheme(getCurrentTheme());
  }, []);

  const onClick = () => {
    toggleTheme();
    setTheme(t => (t === "dark" ? "light" : "dark"));
  };

  const isDark = theme === "dark";

  const btnClass =
    "fixed bottom-4 right-4 z-50 rounded-full p-3 backdrop-blur-sm shadow-md hover:scale-105 transition no-invert " +
    (isDark
      ? "bg-black/60 border border-white/10 text-white"
      : "bg-white/80 border border-black/10 text-black");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
      title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
      className={btnClass}
    >
      {isDark ? (
        <Moon className="w-5 h-5 text-white" />
      ) : (
        <Sun className="w-5 h-5 text-white" />
      )}
    </button>
  );
}