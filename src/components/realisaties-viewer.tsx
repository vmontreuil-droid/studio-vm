"use client";

import { useState } from "react";
import Image from "next/image";
import { Palette, TrendingUp, Spline, Triangle } from "lucide-react";
import { UITGELICHT, WEERGAVEN, type Weergave } from "@/lib/realisaties";
import type { Locale } from "@/lib/i18n/config";

const VOLGORDE: { w: Weergave; icoon: typeof Palette }[] = [
  { w: "hoogte", icoon: Palette },
  { w: "helling", icoon: TrendingUp },
  { w: "hoogtelijn", icoon: Spline },
  { w: "draad", icoon: Triangle },
];

function Beeld({ src, alt, actief, voorrang }: { src: string; alt: string; actief: boolean; voorrang: boolean }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      fetchPriority={voorrang ? "high" : undefined}
      sizes="(max-width: 1024px) 100vw, 60vw"
      className={`object-cover transition-opacity duration-500 ${actief ? "opacity-100" : "opacity-0"}`}
    />
  );
}

export function RealisatiesViewer({ locale }: { locale: Locale }) {
  return (
    <div className="space-y-16 2xl:space-y-24">
      {UITGELICHT.map((p, i) => (
        <Project key={p.id} id={p.id} titel={p[locale].titel} tekst={p[locale].tekst} omgekeerd={i % 2 === 1} eerste={i === 0} locale={locale} />
      ))}
    </div>
  );
}

function Project({ id, titel, tekst, omgekeerd, eerste, locale }: { id: string; titel: string; tekst: string; omgekeerd: boolean; eerste: boolean; locale: Locale }) {
  const [w, setW] = useState<Weergave>("hoogte");
  // Weergaven die al gemount mogen worden: de actieve plus wat de bezoeker al
  // aanwees, aantikte of met de toetsenbord-focus bereikte.
  const [geladen, setGeladen] = useState<Weergave[]>(["hoogte"]);
  const laad = (v: Weergave) => setGeladen((g) => (g.includes(v) ? g : [...g, v]));
  const zichtbaar = VOLGORDE.filter(({ w: v }) => v === w || geladen.includes(v));
  return (
    <div className={`grid items-center gap-8 lg:gap-12 2xl:gap-20 ${omgekeerd ? "lg:grid-cols-[1fr_1.5fr]" : "lg:grid-cols-[1.5fr_1fr]"}`}>
      <div className={omgekeerd ? "lg:order-2" : ""}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border bg-card shadow-xl shadow-black/5">
          {/* Enkel de actieve weergave + wat al aangewezen werd; die blijven gemount,
              dus terugwisselen gaat zonder wachten met een overvloeiing. Per thema licht/donker. */}
          {zichtbaar.map(({ w: v }) => (
            <div key={v} className="alleen-licht absolute inset-0">
              <Beeld src={`/3d/r/p-${id}-${v}-licht.webp`} alt={`${titel} — ${WEERGAVEN[v][locale]}`} actief={w === v} voorrang={eerste && w === v} />
            </div>
          ))}
          {zichtbaar.map(({ w: v }) => (
            <div key={v + "d"} className="alleen-donker absolute inset-0">
              <Beeld src={`/3d/r/p-${id}-${v}-donker.webp`} alt="" actief={w === v} voorrang={eerste && w === v} />
            </div>
          ))}
          <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur">
            {WEERGAVEN[w][locale]}
          </span>
        </div>
        <div role="tablist" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {VOLGORDE.map(({ w: v, icoon: Icoon }) => (
            <button
              key={v}
              role="tab"
              aria-selected={w === v}
              onPointerEnter={() => laad(v)}
              onFocus={() => laad(v)}
              onClick={() => {
                laad(v);
                setW(v);
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
                w === v ? "border-foreground bg-foreground text-background" : "hover:bg-card-hover"
              }`}
            >
              <Icoon className="h-4 w-4" strokeWidth={1.75} />
              {WEERGAVEN[v][locale]}
            </button>
          ))}
        </div>
      </div>
      <div className={`max-w-xl ${omgekeerd ? "lg:order-1" : ""}`}>
        <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titel}</h3>
        <p className="mt-4 text-lg leading-relaxed text-muted">{tekst}</p>
      </div>
    </div>
  );
}
