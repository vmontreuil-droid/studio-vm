"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";

type Dia = { basis: string; label: Record<Locale, string>; sub: Record<Locale, string> };

// De sterkste beelden: van tracé op luchtfoto tot terreinmodel (public/3d/h, licht + donker).
const DIAS: Dia[] = [
  { basis: "/3d/h/trace-luchtfoto", label: {nl: "Wegtracé",fr: "Tracé routier",en: "Road alignment",de: "Straßentrasse",es: "Trazado vial"}, sub: {nl: "Model op de luchtfoto",fr: "Modèle sur la photo aérienne",en: "Model on the aerial photo",de: "Modell auf dem Luftbild",es: "Modelo sobre la ortofoto"} },
  { basis: "/3d/h/plan-hoogtelijnen", label: {nl: "Hoogtelijnen",fr: "Courbes de niveau",en: "Contours",de: "Höhenlinien",es: "Curvas de nivel"}, sub: {nl: "Op het inplantingsplan",fr: "Sur le plan d'implantation",en: "On the site layout plan",de: "Auf dem Lageplan",es: "Sobre el plano de replanteo"} },
  { basis: "/3d/h/parking-hellingen", label: {nl: "Hellingen",fr: "Pentes",en: "Slopes",de: "Neigungen",es: "Pendientes"}, sub: {nl: "Parking met afwatering",fr: "Parking avec écoulement",en: "Car park with drainage",de: "Parkplatz mit Entwässerung",es: "Aparcamiento con drenaje"} },
  { basis: "/3d/h/relief-grondwerk", label: {nl: "Grondwerk",fr: "Terrassement",en: "Earthworks",de: "Erdbau",es: "Movimiento de tierras"}, sub: {nl: "Platformen in reliëf",fr: "Plateformes en relief",en: "Platforms in relief",de: "Plana im Relief",es: "Plataformas en relieve"} },
  { basis: "/3d/h/weg-kruispunt", label: {nl: "Wegenis",fr: "Voiries",en: "Roads",de: "Straßenbau",es: "Viales"}, sub: {nl: "Weg met kruispunt",fr: "Route avec carrefour",en: "Road with junction",de: "Straße mit Kreuzung",es: "Carretera con cruce"} },
  { basis: "/3d/h/relief-bouwput", label: {nl: "Bouwput",fr: "Fouille",en: "Excavation",de: "Baugrube",es: "Excavación"}, sub: {nl: "Uitgraving met werkvloer",fr: "Excavation avec fond de fouille",en: "Pit with formation level",de: "Aushub mit Sohle",es: "Vaciado con fondo de excavación"} },
  { basis: "/3d/h/terrein-spectrum", label: {nl: "Terreinmodel",fr: "Modèle de terrain",en: "Terrain model",de: "Geländemodell",es: "Modelo de terreno"}, sub: {nl: "In hoogtekleuren",fr: "En couleurs hypsométriques",en: "In height colours",de: "In Höhenfarben",es: "En colores hipsométricos"} },
];

const DUUR = 4200;

// Dia k en de volgende erbij: de volgende staat al klaar (onzichtbaar) zodat
// de overgang vloeiend blijft. Nieuwe lijst, nooit de oude aanpassen.
function metVolgende(gezien: number[], k: number): number[] {
  const nieuw = [k, (k + 1) % DIAS.length].filter((x) => !gezien.includes(x));
  return nieuw.length ? [...gezien, ...nieuw] : gezien;
}

export function HeroCarrousel({ locale }: { locale: Locale }) {
  const [i, setI] = useState(0);
  // Enkel dia's die al getoond zijn of als volgende klaarstaan worden gemount:
  // zo laadt de eerste weergave twee beelden in plaats van veertien.
  const [gezien, setGezien] = useState<number[]>([0, 1]);
  const [pauze, setPauze] = useState(false);
  // Systeeminstelling "minder beweging" (server: false).
  const rustig = useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  const naar = (k: number) => {
    setI(k);
    setGezien((g) => metVolgende(g, k));
  };

  useEffect(() => {
    if (pauze) return;
    const t = setTimeout(() => {
      const k = (i + 1) % DIAS.length;
      setI(k);
      setGezien((g) => metVolgende(g, k));
    }, rustig ? DUUR * 2 : DUUR);
    return () => clearTimeout(t);
  }, [i, pauze, rustig]);

  const d = DIAS[i];
  return (
    <div className="relative" onMouseEnter={() => setPauze(true)} onMouseLeave={() => setPauze(false)}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-black/10">
        {DIAS.map((dia, k) => {
          if (!gezien.includes(k)) return null;
          const actief = k === i;
          // Geen preload (zou ook het verborgen donkere beeld laden): de eerste dia
          // krijgt voorrang via fetchPriority, lazy laden houdt het andere thema stil.
          const voorrang = k === 0 ? "high" : undefined;
          const cls = `object-cover transition-[opacity,transform] ease-out ${actief ? "opacity-100" : "opacity-0"} ${
            rustig ? "duration-700" : `duration-[1200ms] ${actief ? "scale-[1.06]" : "scale-100"}`
          }`;
          return (
            <div key={dia.basis} className="absolute inset-0" aria-hidden={!actief}>
              <Image src={`${dia.basis}-licht.webp`} alt={actief ? `${dia.label[locale]} — ${dia.sub[locale]}` : ""} fill fetchPriority={voorrang} sizes="(max-width: 1024px) 100vw, 50vw" className={`alleen-licht ${cls}`} style={{ transitionDuration: actief && !rustig ? `1200ms, ${DUUR + 1200}ms` : undefined }} />
              <Image src={`${dia.basis}-donker.webp`} alt="" fill fetchPriority={voorrang} sizes="(max-width: 1024px) 100vw, 50vw" className={`alleen-donker ${cls}`} style={{ transitionDuration: actief && !rustig ? `1200ms, ${DUUR + 1200}ms` : undefined }} />
            </div>
          );
        })}
        {/* voortgangsbalk */}
        {!pauze && !rustig && (
          <div key={i} className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[hero-voortgang_linear_forwards] bg-accent/70" style={{ animationDuration: `${DUUR}ms` }} />
        )}
      </div>

      <div className="absolute -bottom-5 -left-4 hidden min-w-48 rounded-2xl border bg-background/90 px-4 py-3 shadow-lg backdrop-blur sm:block">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          {String(i + 1).padStart(2, "0")} / {String(DIAS.length).padStart(2, "0")} · {d.label[locale]}
        </p>
        <p key={d.basis} className="mt-1 animate-[hero-in_500ms_ease-out] text-sm font-medium">{d.sub[locale]}</p>
      </div>

      <div className="mt-4 flex justify-end gap-1.5 sm:mt-0 sm:absolute sm:-bottom-3 sm:right-4">
        {DIAS.map((dia, k) => (
          <button
            key={dia.basis}
            type="button"
            aria-label={dia.label[locale]}
            onClick={() => naar(k)}
            className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-accent" : "w-1.5 bg-foreground/25 hover:bg-foreground/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
