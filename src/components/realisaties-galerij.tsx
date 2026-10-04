"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { REALISATIES, CATEGORIEEN, BEELD_ALT, type Categorie, type Realisatie } from "@/lib/realisaties";
import type { Locale } from "@/lib/i18n/config";
import { SITE_ADRES } from "@/lib/utm";
import { SysteemChips } from "@/components/systeem-chips";
import { DeelKnoppen } from "@/components/deel-knoppen";

const ALLE: Record<Locale, string> = { nl: "Alle", fr: "Tous", en: "All", de: "Alle", es: "Todos" };

// Tekst bij het delen van de hele galerij en schermlezerlabel van de deelrij
// in het groot beeld.
const DEEL: Record<Locale, { pagina: string; model: string }> = {
  nl: { pagina: "Realisaties: 3D-modellen voor machinesturing", model: "Dit model delen" },
  fr: { pagina: "Réalisations : modèles 3D pour le guidage d'engins", model: "Partager ce modèle" },
  en: { pagina: "Projects: 3D models for machine control", model: "Share this model" },
  de: { pagina: "Referenzen: 3D-Modelle für Maschinensteuerung", model: "Dieses Modell teilen" },
  es: { pagina: "Proyectos: modelos 3D para control de maquinaria", model: "Compartir este modelo" },
};

const geenAbonnement = () => () => {};

// Het groot beeld volgt het #anker van het adres (#t029): zo opent een
// gedeelde link meteen dat model en klopt de adresbalk altijd met wat er
// openstaat. Wisselen gaat met replaceState (geen extra stappen in de
// geschiedenis) plus een eigen gebeurtenis, want replaceState meldt zelf niets.
const ANKER_GEBEURTENIS = "svm-anker";
function abonneerAnker(cb: () => void) {
  window.addEventListener("hashchange", cb);
  window.addEventListener("popstate", cb);
  window.addEventListener(ANKER_GEBEURTENIS, cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener("popstate", cb);
    window.removeEventListener(ANKER_GEBEURTENIS, cb);
  };
}
function leesAnker(): string {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
}
function zetAnker(id: string | null) {
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, "", `${pathname}${search}${id ? `#${encodeURIComponent(id)}` : ""}`);
  window.dispatchEvent(new Event(ANKER_GEBEURTENIS));
}

// Alt-tekst met context, bv. "Aftakking — 3D-model voor machinesturing, wegenis".
// Duits houdt de hoofdletter: zelfstandige naamwoorden blijven daar groot.
function beeldAlt(r: Realisatie, locale: Locale): string {
  const cat = CATEGORIEEN[r.cat][locale];
  return `${r[locale].titel} — ${BEELD_ALT[locale]}, ${locale === "de" ? cat : cat.toLowerCase()}`;
}

export function RealisatiesGalerij({ locale }: { locale: Locale }) {
  const [filter, setFilter] = useState<Categorie | "alle">("alle");
  // Portaal naar document.body kan pas in de browser (server: false).
  const mounted = useSyncExternalStore(geenAbonnement, () => true, () => false);
  const anker = useSyncExternalStore(abonneerAnker, leesAnker, () => "");

  const lijst = useMemo(() => REALISATIES.filter((r) => filter === "alle" || r.cat === filter), [filter]);
  // Een gedeeld model dat buiten de filter valt, bladert door alle modellen.
  const blader = useMemo(() => (lijst.some((r) => r.id === anker) ? lijst : REALISATIES), [lijst, anker]);
  const open = blader.findIndex((r) => r.id === anker);
  const huidig = open < 0 ? null : blader[open];

  const sluit = useCallback(() => zetAnker(null), []);
  const vorige = useCallback(() => {
    if (open >= 0) zetAnker(blader[(open - 1 + blader.length) % blader.length].id);
  }, [open, blader]);
  const volgende = useCallback(() => {
    if (open >= 0) zetAnker(blader[(open + 1) % blader.length].id);
  }, [open, blader]);

  const isOpen = huidig !== null;
  useEffect(() => {
    if (!isOpen) return;
    const toets = (e: KeyboardEvent) => {
      if (e.key === "Escape") sluit();
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
  }, [isOpen, sluit, vorige, volgende]);

  const aantal = (c: Categorie) => REALISATIES.filter((r) => r.cat === c).length;
  // Canoniek adres (= canoniek() uit lib/seo, dat hier niet in de browserbundel hoort).
  const paginaUrl = `${SITE_ADRES}/${locale}/realisaties`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
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
        {/* Op de gsm deelt men een model vanuit het groot beeld; hier zou de rij tussen filters en kaarten staan. */}
        <div className="hidden sm:block">
          <DeelKnoppen locale={locale} url={paginaUrl} tekst={DEEL[locale].pagina} />
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
        {lijst.map((r) => (
          <button
            key={r.id}
            id={r.id}
            onClick={() => zetAnker(r.id)}
            className="group flex scroll-mt-28 flex-col overflow-hidden rounded-3xl border bg-card text-left transition-colors hover:border-accent"
          >
            <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
              <Image src={r.licht} alt={beeldAlt(r, locale)} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="alleen-licht object-cover transition-transform duration-700 group-hover:scale-105" />
              <Image src={r.donker} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="alleen-donker object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-4 w-4" strokeWidth={2} />
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{CATEGORIEEN[r.cat][locale]}</p>
              <p className="mt-1.5 font-semibold tracking-tight">{r[locale].titel}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{r[locale].tekst}</p>
              <SysteemChips systemen={r.systemen} locale={locale} className="mt-auto pt-3" />
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
            onClick={sluit}
            className="fixed inset-0 z-[95] flex flex-col bg-background/95 backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  {CATEGORIEEN[huidig.cat][locale]}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <p className="font-semibold tracking-tight">{huidig[locale].titel}</p>
                  <SysteemChips systemen={huidig.systemen} locale={locale} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="whitespace-nowrap font-mono text-xs text-muted">{open + 1} / {blader.length}</span>
                <button aria-label="×" onClick={sluit} className="rounded-full border p-2 hover:bg-card-hover">
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-4 pb-6 sm:px-16" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-full max-h-[78vh] w-full max-w-6xl 2xl:max-h-[82vh] 2xl:max-w-[110rem] overflow-hidden rounded-3xl border bg-card">
                <Image src={huidig.licht} alt={beeldAlt(huidig, locale)} fill sizes="100vw" className="alleen-licht object-contain" />
                <Image src={huidig.donker} alt="" fill sizes="100vw" className="alleen-donker object-contain" />
              </div>
              <button aria-label="←" onClick={vorige} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-background/80 p-3 hover:bg-card-hover sm:left-4">
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <button aria-label="→" onClick={volgende} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-background/80 p-3 hover:bg-card-hover sm:right-4">
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3 px-5 pb-5" onClick={(e) => e.stopPropagation()}>
              <p className="text-center text-sm text-muted">{huidig[locale].tekst}</p>
              <DeelKnoppen
                key={huidig.id}
                locale={locale}
                url={`${paginaUrl}#${huidig.id}`}
                tekst={`${huidig[locale].titel} — ${BEELD_ALT[locale]}`}
                ariaLabel={DEEL[locale].model}
                className="justify-center text-center"
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
