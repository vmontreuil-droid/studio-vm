"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search as SearchIcon,
  X,
  FileText,
  Briefcase,
  Newspaper,
  SunMoon,
  Languages,
  ScanLine,
  Calculator,
} from "lucide-react";
import { search, type SearchEntry } from "@/lib/search-index";
import { localePath, isValidLocale, LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";

type SearchUi = {
  open: string;
  short: string;
  placeholder: string;
  close: string;
  none: (q: string) => string;
  nav: string;
  esc: string;
  action: string;
  theme: string;
  scan: string;
  offerte: string;
  lang: (name: string) => string;
  kinds: Record<SearchEntry["kind"], string>;
};

const UI: Record<Locale, SearchUi> = {
  nl: {
    open: "Zoeken",
    short: "Zoek",
    placeholder: "Zoek pagina's, realisaties of kennis...",
    close: "Sluiten",
    none: (q) => `Niets gevonden voor "${q}".`,
    nav: "↑↓ navigeren · Enter openen",
    esc: "Esc sluiten",
    action: "Actie",
    theme: "Wissel thema",
    scan: "Realisaties",
    offerte: "Offerte aanvragen",
    lang: (n) => `Schakel naar ${n}`,
    kinds: { Page: "Pagina", Werk: "Realisatie", Journal: "Kennis", Module: "Module" },
  },
  fr: {
    open: "Rechercher",
    short: "Recherche",
    placeholder: "Rechercher des pages, réalisations ou articles...",
    close: "Fermer",
    none: (q) => `Aucun résultat pour « ${q} ».`,
    nav: "↑↓ naviguer · Entrée ouvrir",
    esc: "Échap fermer",
    action: "Action",
    theme: "Basculer le thème",
    scan: "Réalisations",
    offerte: "Demander un devis",
    lang: (n) => `Passer en ${n}`,
    kinds: { Page: "Page", Werk: "Réalisation", Journal: "Savoir", Module: "Module" },
  },
  en: {
    open: "Search",
    short: "Search",
    placeholder: "Search pages, projects or articles...",
    close: "Close",
    none: (q) => `Nothing found for "${q}".`,
    nav: "↑↓ navigate · Enter open",
    esc: "Esc close",
    action: "Action",
    theme: "Toggle theme",
    scan: "Projects",
    offerte: "Request a quote",
    lang: (n) => `Switch to ${n}`,
    kinds: { Page: "Page", Werk: "Project", Journal: "Knowledge", Module: "Module" },
  },
  de: {
    open: "Suchen",
    short: "Suche",
    placeholder: "Seiten, Referenzen oder Artikel durchsuchen...",
    close: "Schließen",
    none: (q) => `Keine Ergebnisse für „${q}“.`,
    nav: "↑↓ navigieren · Enter öffnen",
    esc: "Esc schließen",
    action: "Aktion",
    theme: "Design wechseln",
    scan: "Referenzen",
    offerte: "Angebot anfordern",
    lang: (n) => `Wechseln zu ${n}`,
    kinds: { Page: "Seite", Werk: "Referenz", Journal: "Wissen", Module: "Modul" },
  },
  es: {
    open: "Buscar",
    short: "Buscar",
    placeholder: "Buscar páginas, proyectos o artículos...",
    close: "Cerrar",
    none: (q) => `No se encontraron resultados para «${q}».`,
    nav: "↑↓ navegar · Intro abrir",
    esc: "Esc cerrar",
    action: "Acción",
    theme: "Cambiar tema",
    scan: "Proyectos",
    offerte: "Solicitar presupuesto",
    lang: (n) => `Cambiar a ${n}`,
    kinds: { Page: "Página", Werk: "Proyecto", Journal: "Conocimientos", Module: "Módulo" },
  },
};

export function SearchTrigger({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const ui = UI[locale] ?? UI.nl;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ui.open}
        className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground"
      >
        <SearchIcon className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="hidden sm:inline xl:hidden 2xl:inline">{ui.short}</span>
        <kbd className="hidden rounded bg-card px-1.5 py-0.5 font-mono text-[10px] sm:inline xl:hidden 2xl:inline">
          ⌘K
        </kbd>
      </button>
      {open && <SearchDialog locale={locale} onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchDialog({
  locale,
  onClose,
}: {
  locale: Locale;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const ui = UI[locale] ?? UI.nl;
  const cmdLabels = {
    theme: ui.theme,
    scan: ui.scan,
    offerte: ui.offerte,
    lang: (l: Locale) => ui.lang(LOCALE_NAMES[l]),
  };

  type Cmd = { id: string; label: string; run: () => void };

  const switchLang = (target: Locale) => {
    document.cookie = `locale=${target}; path=/; max-age=${365 * 86400}; SameSite=Lax`;
    const seg = pathname.split("/").filter(Boolean);
    if (seg.length > 0 && isValidLocale(seg[0])) seg[0] = target;
    else seg.unshift(target);
    onClose();
    router.push(`/${seg.join("/")}`);
    router.refresh();
  };

  const cycleTheme = () => {
    const root = document.documentElement;
    const cur = root.classList.contains("theme-dark")
      ? "dark"
      : root.classList.contains("theme-light")
        ? "light"
        : "auto";
    const next = cur === "auto" ? "light" : cur === "light" ? "dark" : "auto";
    root.classList.remove("theme-light", "theme-dark");
    if (next === "light") root.classList.add("theme-light");
    if (next === "dark") root.classList.add("theme-dark");
    try {
      if (next === "auto") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
    onClose();
  };

  const commands: Cmd[] = [
    { id: "theme", label: cmdLabels.theme, run: cycleTheme },
    { id: "scan", label: cmdLabels.scan, run: () => { onClose(); router.push(localePath(locale, "/realisaties")); } },
    { id: "offerte", label: cmdLabels.offerte, run: () => { onClose(); router.push(localePath(locale, "/offerte")); } },
    ...LOCALES
      .filter((l) => l !== locale)
      .map((l) => ({ id: `lang-${l}`, label: cmdLabels.lang(l), run: () => switchLang(l) })),
  ];

  const q = query.trim().toLowerCase();
  const matchedCmds = q
    ? commands.filter((c) => c.label.toLowerCase().includes(q))
    : commands;
  const results = useMemo(() => search(query, locale), [query, locale]);
  const total = matchedCmds.length + results.length;

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll<HTMLElement>(
        'button, input, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);
    return () => {
      document.removeEventListener("keydown", onTab);
      prev?.focus?.();
    };
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  const goto = (entry: SearchEntry) => {
    onClose();
    router.push(entry.href);
  };

  const runAt = (idx: number) => {
    if (idx < matchedCmds.length) matchedCmds[idx].run();
    else {
      const entry = results[idx - matchedCmds.length];
      if (entry) goto(entry);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(highlight);
    }
  };

  const cmdIcon = (id: string) =>
    id === "theme" ? (
      <SunMoon className="h-4 w-4 flex-shrink-0 text-accent" strokeWidth={1.5} />
    ) : id === "scan" ? (
      <ScanLine className="h-4 w-4 flex-shrink-0 text-accent" strokeWidth={1.5} />
    ) : id === "offerte" ? (
      <Calculator className="h-4 w-4 flex-shrink-0 text-accent" strokeWidth={1.5} />
    ) : (
      <Languages className="h-4 w-4 flex-shrink-0 text-accent" strokeWidth={1.5} />
    );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ui.open}
      className="fixed inset-0 z-[90] flex items-start justify-center p-4 sm:p-12"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border bg-background shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <SearchIcon className="h-4 w-4 text-muted" strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={ui.placeholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={ui.close}
            className="rounded p-1 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-2">
          {total === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted">
              {ui.none(query)}
            </li>
          ) : (
            <>
              {matchedCmds.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => c.run()}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      i === highlight ? "bg-card-hover" : ""
                    }`}
                  >
                    {cmdIcon(c.id)}
                    <div className="flex-1">
                      <p className="font-medium">{c.label}</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                      {ui.action}
                    </span>
                  </button>
                </li>
              ))}
              {results.map((entry, i) => {
                const idx = matchedCmds.length + i;
                return (
                  <li key={entry.href}>
                    <button
                      type="button"
                      onClick={() => goto(entry)}
                      onMouseEnter={() => setHighlight(idx)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        idx === highlight ? "bg-card-hover" : ""
                      }`}
                    >
                      <KindIcon kind={entry.kind} />
                      <div className="flex-1">
                        <p className="font-medium">{entry.title}</p>
                        {entry.hint && (
                          <p className="text-xs text-muted">{entry.hint}</p>
                        )}
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        {ui.kinds[entry.kind]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </>
          )}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t bg-card px-4 py-2 font-mono text-[10px] text-muted">
          <span>{ui.nav}</span>
          <span>{ui.esc}</span>
        </div>
      </div>
    </div>
  );
}

function KindIcon({ kind }: { kind: SearchEntry["kind"] }) {
  const Icon =
    kind === "Werk" ? Briefcase : kind === "Journal" ? Newspaper : FileText;
  return <Icon className="h-4 w-4 flex-shrink-0 text-muted" strokeWidth={1.5} />;
}
