export type Theme = "dark" | "light" | "system";

const THEME_KEY = "loop:theme";

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", resolveTheme(theme));
}

export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

let systemListenerAttached = false;

export function initTheme() {
  applyTheme(getStoredTheme());

  if (systemListenerAttached) return;
  systemListenerAttached = true;
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });
}
