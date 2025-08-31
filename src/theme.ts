// theme.ts — aplica/persiste tema
export type Theme = "dark" | "light";
const STORAGE_KEY = "bha-theme";

export function getSystemPref(): Theme {
  const m = window.matchMedia("(prefers-color-scheme: light)");
  return m.matches ? "light" : "dark";
}

export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : null;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement; // <html>
  root.dataset.theme = theme;
  (root as HTMLElement).style.colorScheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme() {
  const stored = getStoredTheme();
  const theme = stored ?? getSystemPref();
  applyTheme(theme);
}

export function toggleTheme() {
  const root = document.documentElement;
  const current = (root.dataset.theme as Theme) || getSystemPref();
  applyTheme(current === "dark" ? "light" : "dark");
}

export function getCurrentTheme(): Theme {
  const root = document.documentElement;
  return (root.dataset.theme as Theme) || getSystemPref();
}
