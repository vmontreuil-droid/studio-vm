"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, X, FileText, Briefcase, Newspaper } from "lucide-react";
import { search, type SearchEntry } from "@/lib/search-index";

export function SearchTrigger() {
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
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const results = useMemo(() => search(query), [query]);

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

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlight]) goto(results[highlight]);
    }
  };

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
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted">
              Niets gevonden voor "{query}".
            </li>
          ) : (
            results.map((entry, i) => (
              <li key={entry.href}>
                <button
                  type="button"
                  onClick={() => goto(entry)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    i === highlight ? "bg-card-hover" : ""
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
            ))
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
