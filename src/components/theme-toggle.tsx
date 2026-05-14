"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "auto";

const STORAGE_KEY = "theme";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  if (t === "light") root.classList.add("theme-light");
  if (t === "dark") root.classList.add("theme-dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("auto");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "auto";
      setTheme(saved);
    } catch {}
    setHydrated(true);
  }, []);

  const cycle = () => {
    const next: Theme = theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
    setTheme(next);
    applyTheme(next);
    try {
      if (next === "auto") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label =
    theme === "light" ? "Licht" : theme === "dark" ? "Donker" : "Systeem";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Thema: ${label} — klik om te wisselen`}
      title={`Thema: ${label}`}
      className="rounded-full border p-2 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
      suppressHydrationWarning
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      <span className="sr-only">Thema: {hydrated ? label : "—"}</span>
    </button>
  );
}
