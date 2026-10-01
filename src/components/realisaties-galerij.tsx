"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { REALISATIES, CATEGORIEEN, type Categorie } from "@/lib/realisaties";
import type { Locale } from "@/lib/i18n/config";

const ALLE = { nl: "Alle", fr: "Tous", en: "All" };

export function RealisatiesGalerij({ locale }: { locale: Locale }) {
  const [filter, setFilter] = useState<Categorie | "alle">("alle");
  const [open, setOpen] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lijst = useMemo(() => REALISATIES.filter((r) => filter === "alle" || r.cat === filter), [filter]);

  const vorige = useCallback(() => setOpen((i) => (i === null ? i : (i - 1 + lijst.length) % lijst.length)), [lijst.length]);
  const volgende = useCallback(() => setOpen((i) => (i === null ? i : (i + 1) % lijst.length)), [lijst.length]);

  useEffect(() => {
    if (open === null) return;
    const toets = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowLeft") vorige();
      if (e.key === "ArrowRight") volgende();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", toets);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", toets);
    };
  }, [open, vorige, volgende]);

  const aantal = (c: Categorie) => REALISATIES.filter((r) => r.cat === c).length;
  const huidig = open === null ? null : lijst[open];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {(["alle", ...Object.keys(CATEGORIEEN)] as (Categorie | "alle")[]).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === c ? "border-foreground bg-foreground text-background" : "hover:bg-card-hover"
            }`}
          >
            {c === "alle" ? ALLE[locale] : CATEGORIEEN[c][locale]}
            <span className="ml-2 font-mono text-xs opacity-60">{c === "alle" ? REALISATIES.length : aantal(c)}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {lijst.map((r, i) => (
          <button
            key={r.id}
            onClick={() => setOpen(i)}
            className="group overflow-hidden rounded-3xl border bg-card text-left transition-colors hover:border-accent"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image src={r.licht} alt={r[locale].titel} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="alleen-licht object-cover transition-transform duration-700 group-hover:scale-105" />
              <Image src={r.donker} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="alleen-donker object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-4 w-4" strokeWidth={2} />
              </span>
            </div>
            <div className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{CATEGORIEEN[r.cat][locale]}</p>
              <p className="mt-1.5 font-semibold tracking-tight">{r[locale].titel}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{r[locale].tekst}</p>
            </div>
          </button>
        ))}
      </div>

      {mounted && huidig &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={huidig[locale].titel}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-[95] flex flex-col bg-background/95 backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{CATEGORIEEN[huidig.cat][locale]}</p>
                <p className="font-semibold tracking-tight">{huidig[locale].titel}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted">{(open ?? 0) + 1} / {lijst.length}</span>
                <button aria-label="×" onClick={() => setOpen(null)} className="rounded-full border p-2 hover:bg-card-hover">
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-4 pb-6 sm:px-16" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-full max-h-[78vh] w-full max-w-6xl overflow-hidden rounded-3xl border bg-card">
                <Image src={huidig.licht} alt={huidig[locale].titel} fill sizes="100vw" className="alleen-licht object-contain" />
                <Image src={huidig.donker} alt="" fill sizes="100vw" className="alleen-donker object-contain" />
              </div>
              <button aria-label="←" onClick={vorige} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-background/80 p-3 hover:bg-card-hover sm:left-4">
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <button aria-label="→" onClick={volgende} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-background/80 p-3 hover:bg-card-hover sm:right-4">
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <p className="px-5 pb-5 text-center text-sm text-muted" onClick={(e) => e.stopPropagation()}>{huidig[locale].tekst}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
