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
import { localePath, isValidLocale, type Locale } from "@/lib/i18n/config";

export function SearchTrigger({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);

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
        aria-label="Zoeken"
        className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground"
      >
        <SearchIcon className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">Zoek</span>
        <kbd className="hidden rounded bg-card px-1.5 py-0.5 font-mono text-[10px] sm:inline">
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

  const cmdLabels =
    locale === "fr"
      ? { theme: "Basculer le thème", scan: "Scanner mon site", offerte: "Calculateur de devis", lang: (l: string) => `Passer en ${l.toUpperCase()}` }
      : locale === "en"
        ? { theme: "Toggle theme", scan: "Scan my site", offerte: "Quote calculator", lang: (l: string) => `Switch to ${l.toUpperCase()}` }
        : { theme: "Wissel thema", scan: "Scan mijn site", offerte: "Offerte-calculator", lang: (l: string) => `Schakel naar ${l.toUpperCase()}` };

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
    { id: "scan", label: cmdLabels.scan, run: () => { onClose(); router.push(localePath(locale, "/scan")); } },
    { id: "offerte", label: cmdLabels.offerte, run: () => { onClose(); router.push(localePath(locale, "/offerte")); } },
    ...(["nl", "fr", "en"] as Locale[])
      .filter((l) => l !== locale)
      .map((l) => ({ id: `lang-${l}`, label: cmdLabels.lang(l), run: () => switchLang(l) })),
  ];

  const q = query.trim().toLowerCase();
  const matchedCmds = q
    ? commands.filter((c) => c.label.toLowerCase().includes(q))
    : commands;
  const results = useMemo(() => search(query, locale), [query, locale]);
  const total = matchedCmds.length + results.length;

  useEffect(() => {
    inputRef.current?.focus();
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
      aria-label="Zoeken"
      className="fixed inset-0 z-[90] flex items-start justify-center p-4 sm:p-12"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <SearchIcon className="h-4 w-4 text-muted" strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Zoek pages, werk of journal..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="rounded p-1 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-2">
          {total === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted">
              Niets gevonden voor "{query}".
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
                      {locale === "fr" ? "Action" : locale === "en" ? "Action" : "Actie"}
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
                        {entry.kind}
                      </span>
                    </button>
                  </li>
                );
              })}
            </>
          )}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t bg-card px-4 py-2 font-mono text-[10px] text-muted">
          <span>↑↓ navigeren · Enter openen</span>
          <span>Esc sluiten</span>
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
