"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MoveHorizontal } from "lucide-react";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const T: Record<
  Locale,
  { title: string; before: string; after: string; drag: string; note: string }
> = {
  nl: {
    title: "Sleep om te onthullen",
    before: "Vóór",
    after: "Na",
    drag: "Versleep de greep",
    note: "Illustratief — een typische overvolle, trage site versus een rustige, snelle build.",
  },
  fr: {
    title: "Glissez pour révéler",
    before: "Avant",
    after: "Après",
    drag: "Faites glisser la poignée",
    note: "Illustratif — un site typique surchargé et lent versus un build calme et rapide.",
  },
  en: {
    title: "Drag to reveal",
    before: "Before",
    after: "After",
    drag: "Drag the handle",
    note: "Illustrative — a typical cluttered, slow site versus a calm, fast build.",
  },
};

export function BeforeAfter() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = T[locale];
  const [pos, setPos] = useState(50);

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        {t.title}
      </p>

      <div className="relative mt-4 h-72 select-none overflow-hidden rounded-2xl border">
        {/* VÓÓR: overvol, traag */}
        <div className="absolute inset-0 bg-[#f4f4f5] p-4 text-[#18181b]">
          <div className="flex items-center justify-between rounded bg-red-600 px-3 py-1 text-[10px] font-bold text-white">
            <span>!!! MEGA SALE -70% — KLIK NU !!!</span>
            <span>✕</span>
          </div>
          <div className="mt-2 flex gap-2">
            <div className="h-10 flex-1 rounded bg-yellow-300" />
            <div className="h-10 w-16 rounded bg-blue-500" />
            <div className="h-10 w-10 rounded bg-pink-500" />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded"
                style={{
                  background: ["#a3a3a3", "#86efac", "#fda4af", "#93c5fd", "#fcd34d", "#c4b5fd"][i],
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-500">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
            Laden… (4,8s) · 31 scripts · pop-up volgt
          </div>
          <div className="mt-2 rounded border border-dashed border-neutral-400 p-2 text-[9px] text-neutral-500">
            🍪 Wij gebruiken 47 cookies. [Alles accepteren] [Beheren] [Sluiten] [×]
          </div>
        </div>

        {/* NA: rustig, snel — onthuld via clip */}
        <div
          className="absolute inset-0 bg-[#fafaf9] p-6 text-[#1c1917]"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#b45309]">
            Bistro Lumière
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">
            Seizoensgebonden, lokaal, rustig gebracht.
          </h3>
          <div className="mt-4 flex gap-2">
            <span className="rounded-full bg-[#1c1917] px-3 py-1.5 text-[10px] text-[#fafaf9]">
              Reserveer
            </span>
            <span className="rounded-full border border-[#e7e5e4] px-3 py-1.5 text-[10px]">
              Menu
            </span>
          </div>
          <div className="mt-5 flex items-center gap-2 font-mono text-[10px] text-[#78716c]">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            0,7s · PageSpeed 98 · 3 scripts · geen pop-up
          </div>
        </div>

        {/* Handle */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-accent"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-accent bg-background shadow">
            <MoveHorizontal className="h-4 w-4 text-accent" strokeWidth={2} />
          </span>
        </div>

        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white">
          {t.before}
        </span>
        <span className="absolute right-3 top-3 z-10 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] text-white">
          {t.after}
        </span>

        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={t.drag}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>

      <p className="mt-4 font-mono text-[11px] text-muted">{t.note}</p>
    </div>
  );
}
