"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";

type Dia = { basis: string; label: Record<Locale, string>; sub: Record<Locale, string> };

// Eerst één model in vier weergaven (het verhaal van een levering), daarna andere projecten.
const DIAS: Dia[] = [
  { basis: "/3d/r/p-platform-hoogte", label: { nl: "Hoogtekleuren", fr: "Couleurs hypsométriques", en: "Height colours", de: "Höhenfarben", es: "Colores hipsométricos" }, sub: { nl: "Ontwerpoppervlak", fr: "Surface de projet", en: "Design surface", de: "Planungsoberfläche", es: "Superficie de proyecto" } },
  { basis: "/3d/r/p-platform-helling", label: { nl: "Helling", fr: "Pente", en: "Slope", de: "Neigung", es: "Pendiente" }, sub: { nl: "Controle afwatering", fr: "Contrôle des écoulements", en: "Drainage check", de: "Entwässerungsprüfung", es: "Control de desagüe" } },
  { basis: "/3d/r/p-platform-hoogtelijn", label: { nl: "Hoogtelijnen", fr: "Courbes de niveau", en: "Contours", de: "Höhenlinien", es: "Curvas de nivel" }, sub: { nl: "Lezen en uitzetten", fr: "Lecture et implantation", en: "Reading and setting out", de: "Lesen und Abstecken", es: "Lectura y replanteo" } },
  { basis: "/3d/r/p-platform-draad", label: { nl: "Driehoeksnet", fr: "Réseau de triangles", en: "Triangle network", de: "Dreiecksnetz", es: "Red de triángulos" }, sub: { nl: "TIN · waarop de machine stuurt", fr: "TIN · ce que suit la machine", en: "TIN · what the machine follows", de: "TIN · woran die Maschine steuert", es: "TIN · lo que sigue la máquina" } },
  { basis: "/3d/r/t029", label: { nl: "Wegenis", fr: "Voiries", en: "Roads", de: "Straßenbau", es: "Viales" }, sub: { nl: "Aftakking met verkanting", fr: "Embranchement avec dévers", en: "Junction with crossfall", de: "Abzweigung mit Querneigung", es: "Bifurcación con peralte" } },
  { basis: "/3d/r/t014", label: { nl: "Platform", fr: "Plateforme", en: "Platform", de: "Planum", es: "Plataforma" }, sub: { nl: "Funderingsputten op niveau", fr: "Puits de fondation à niveau", en: "Foundation pits at level", de: "Fundamentgruben auf Höhe", es: "Pozos de cimentación a cota" } },
  { basis: "/3d/r/t013", label: { nl: "Terrein", fr: "Terrain", en: "Terrain", de: "Gelände", es: "Terreno" }, sub: { nl: "Bestaand maaiveld", fr: "Terrain existant", en: "Existing ground", de: "Bestehendes Gelände", es: "Terreno existente" } },
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
