"use client";

import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

const T: Record<
  Locale,
  { title: string; rows: [string, string][]; hint: string; close: string }
> = {
  nl: {
    title: "Sneltoetsen",
    rows: [
      ["⌘K / Ctrl K", "Zoeken & commando's (thema, taal, scan…)"],
      ["?", "Deze hulp tonen/verbergen"],
      ["↑ ↓", "Door resultaten navigeren"],
      ["Enter", "Open / voer uit"],
      ["Esc", "Sluiten"],
    ],
    hint: "Druk ? ergens op de site",
    close: "Sluiten",
  },
  fr: {
    title: "Raccourcis clavier",
    rows: [
      ["⌘K / Ctrl K", "Recherche & commandes (thème, langue, scan…)"],
      ["?", "Afficher/masquer cette aide"],
      ["↑ ↓", "Naviguer dans les résultats"],
      ["Entrée", "Ouvrir / exécuter"],
      ["Échap", "Fermer"],
    ],
    hint: "Appuyez sur ? n'importe où",
    close: "Fermer",
  },
  en: {
    title: "Keyboard shortcuts",
    rows: [
      ["⌘K / Ctrl K", "Search & commands (theme, language, scan…)"],
      ["?", "Show/hide this help"],
      ["↑ ↓", "Navigate results"],
      ["Enter", "Open / run"],
      ["Esc", "Close"],
    ],
    hint: "Press ? anywhere on the site",
    close: "Close",
  },
};

export function ShortcutsOverlay({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const t = T[locale];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if (e.key === "?" && !typing) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      className="fixed inset-0 z-[95] flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <Keyboard className="h-4 w-4" strokeWidth={2} />
            {t.title}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.close}
            className="rounded p-1 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <ul className="divide-y">
          {t.rows.map(([k, v]) => (
            <li
              key={k}
              className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
            >
              <span className="text-muted">{v}</span>
              <kbd className="whitespace-nowrap rounded-md border bg-card px-2 py-1 font-mono text-[11px]">
                {k}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
