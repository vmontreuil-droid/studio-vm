"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sun, Moon, Monitor } from "lucide-react";
import { DEFAULT_LOCALE, isValidLocale, type Locale } from "@/lib/i18n/config";

type Theme = "light" | "dark" | "auto";

const STORAGE_KEY = "theme";

// `thema` bevat het dubbelpunt: het Frans zet er een spatie voor.
const TXT: Record<Locale, { thema: string; licht: string; donker: string; systeem: string; wissel: string }> = {
  nl: { thema: "Thema:", licht: "Licht", donker: "Donker", systeem: "Systeem", wissel: "klik om te wisselen" },
  fr: { thema: "Thème :", licht: "Clair", donker: "Sombre", systeem: "Système", wissel: "cliquez pour changer" },
  en: { thema: "Theme:", licht: "Light", donker: "Dark", systeem: "System", wissel: "click to switch" },
  de: { thema: "Design:", licht: "Hell", donker: "Dunkel", systeem: "System", wissel: "zum Wechseln klicken" },
  es: { thema: "Tema:", licht: "Claro", donker: "Oscuro", systeem: "Sistema", wissel: "haga clic para cambiar" },
};

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  if (t === "light") root.classList.add("theme-light");
  if (t === "dark") root.classList.add("theme-dark");
}

/**
 * Wisselt tussen systeem, licht en donker. De taal komt uit `locale` of
 * anders uit het eerste padsegment (admin en andere paden zonder taal: nl).
 */
export function ThemeToggle({ locale }: { locale?: Locale } = {}) {
  const seg = usePathname()?.split("/")[1];
  const taal: Locale = locale ?? (isValidLocale(seg) ? seg : DEFAULT_LOCALE);
  const tx = TXT[taal];
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      // Niets bewaard = standaard donker.
      const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "dark";
      setTheme(saved);
    } catch {}
    setHydrated(true);
  }, []);

  const cycle = () => {
    const next: Theme = theme === "dark" ? "light" : theme === "light" ? "auto" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = theme === "light" ? tx.licht : theme === "dark" ? tx.donker : tx.systeem;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${tx.thema} ${label} — ${tx.wissel}`}
      title={`${tx.thema} ${label}`}
      className="rounded-full border p-2 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
      suppressHydrationWarning
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      <span className="sr-only">
        {tx.thema} {hydrated ? label : "—"}
      </span>
    </button>
  );
}
