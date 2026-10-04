// Deelbeeld (og:image) per publieke pagina: welke render, welke kop, in
// welke taal. Licht module (geen next/og, geen sharp): pagina's lezen hier
// enkel het beeldadres uit, de route /beeld/og/… rendert de kaart.
//
// Adres = /beeld/og + paginapad + .jpg, met ?v=<inhoudshash>: verandert de
// tekst, de prijs of het ontwerp, dan verandert het adres en halen Facebook
// en WhatsApp het nieuwe beeld op in plaats van hun bewaarde kopie.

import { LOCALES, type Locale } from "@/lib/i18n/config";
import { FUNCTIE } from "@/lib/bedrijf";
import { KENNIS, kennisArtikel } from "@/lib/kennis";
import { KOPBEELD } from "@/components/kennis-illustraties";
import { CATEGORIEEN, REALISATIES } from "@/lib/realisaties";
import { ARCHIEF, archiefBeeld, archiefProject } from "@/lib/archief";
import { UURTARIEF_CENT, euro } from "@/lib/tarieven";
import type { Merkkaart } from "./merkkaart";

/** Ophogen bij elke ontwerpwijziging in ./merkkaart.tsx: komt mee in elke ?v=. */
export const MERKKAART_VERSIE = "2";

// Labels boven de kop (zelfde woorden als het kruimelpad; hier apart zodat
// lib/seo.ts deze module kan inlezen zonder kringverwijzing).
const LABEL: Record<"modellen" | "over" | "kennis", Record<Locale, string>> = {
  modellen: { nl: "3D-modellen", fr: "Modèles 3D", en: "3D models", de: "3D-Modelle", es: "Modelos 3D" },
  over: { nl: "Over Studio VM", fr: "À propos de Studio VM", en: "About Studio VM", de: "Über Studio VM", es: "Sobre Studio VM" },
  kennis: { nl: "Kennisbank", fr: "Base de connaissances", en: "Knowledge base", de: "Wissensdatenbank", es: "Base de conocimiento" },
};

export type PaginaSleutel =
  | "home"
  | "3d-modellen"
  | "realisaties"
  | "tarieven"
  | "over"
  | "kennis"
  | "offerte"
  | `kennis/${string}`
  | `realisaties/${string}`;

const VASTE_SLEUTELS = ["home", "3d-modellen", "realisaties", "tarieven", "over", "kennis", "offerte"] as const;

const MERKEN = "Trimble · Topcon · Leica · Unicontrol · CHCNAV";

const HOME: Record<Locale, { kop: string; prijs: (p: string) => string }> = {
  nl: { kop: "Uw plannen als 3D-model voor machinesturing", prijs: (p) => `vanaf ${p}/uur` },
  fr: { kop: "Vos plans en modèle 3D pour le guidage d'engins", prijs: (p) => `dès ${p}/h` },
  en: { kop: "Your drawings as 3D models for machine control", prijs: (p) => `from ${p}/hour` },
  de: { kop: "Ihre Pläne als 3D-Modell für die Maschinensteuerung", prijs: (p) => `ab ${p}/Std.` },
  es: { kop: "Sus planos como modelo 3D para control de maquinaria", prijs: (p) => `desde ${p}/h` },
};

const MODELLEN: Record<Locale, { kop: string; sub: string }> = {
  nl: { kop: "Van plan naar 3D-model, klaar voor de machine", sub: "Oppervlak · lijnwerk · hoogtelijnen · hellingen" },
  fr: { kop: "Du plan au modèle 3D, prêt pour l'engin", sub: "Surface · filaire · courbes de niveau · pentes" },
  en: { kop: "From drawing to 3D model, ready for the machine", sub: "Surface · linework · contours · slopes" },
  de: { kop: "Vom Plan zum 3D-Modell, bereit für die Maschine", sub: "DGM · Linien · Höhenlinien · Neigungen" },
  es: { kop: "Del plano al modelo 3D, listo para la máquina", sub: "Superficie · líneas · curvas de nivel · pendientes" },
};

const REAL: Record<Locale, { kop: (n: number) => string; sub: string }> = {
  nl: { kop: (n) => `${n} realisaties`, sub: "Van wegtracé tot bouwput" },
  fr: { kop: (n) => `${n} réalisations`, sub: "Du tracé routier à la fouille" },
  en: { kop: (n) => `${n} projects`, sub: "From road alignment to excavation" },
  de: { kop: (n) => `${n} Referenzen`, sub: "Von der Straßentrasse bis zur Baugrube" },
  es: { kop: (n) => `${n} proyectos`, sub: "Del trazado de carreteras a la excavación" },
};

// Eén sterke render per soort werk (wegenis, grondwerk, bouwput, terrein).
const MOZAIEK = [
  "/3d/weg-kruispunt-donker.png",
  "/3d/r/t033-donker.webp",
  "/3d/relief-bouwput-donker.png",
  "/3d/r/t023-donker.webp",
];

const TARIEF: Record<Locale, { kop: string; cats: [string, string, string]; voet: string }> = {
  nl: { kop: "Uurtarieven voor 3D-modellen", cats: ["Vroegtijdig", "Normaal", "Last-minute"], voet: "per uur, excl. btw · extra systemen zonder meerprijs" },
  fr: { kop: "Tarifs horaires des modèles 3D", cats: ["Anticipé", "Normal", "Urgent"], voet: "par heure HTVA · systèmes supplémentaires sans surcoût" },
  en: { kop: "Hourly rates for 3D models", cats: ["Early", "Standard", "Last-minute"], voet: "per hour excl. VAT · extra systems at no extra cost" },
  de: { kop: "Stundensätze für 3D-Modelle", cats: ["Frühzeitig", "Normal", "Kurzfristig"], voet: "pro Stunde zzgl. MwSt. · weitere Systeme ohne Aufpreis" },
  es: { kop: "Tarifas por hora de modelos 3D", cats: ["Anticipada", "Normal", "Urgente"], voet: "por hora, IVA no incluido · sistemas adicionales sin coste" },
};

const OVER: Record<Locale, { kop: string; overal: string }> = {
  nl: { kop: "Eén aanspreekpunt, van plan tot model", overal: "heel Europa" },
  fr: { kop: "Un seul interlocuteur, du plan au modèle", overal: "toute l'Europe" },
  en: { kop: "One point of contact, from plan to model", overal: "all of Europe" },
  de: { kop: "Ein Ansprechpartner, vom Plan bis zum Modell", overal: "ganz Europa" },
  es: { kop: "Un único interlocutor, del plano al modelo", overal: "toda Europa" },
};

const KENNISBANK: Record<Locale, { kop: string; sub: (n: number) => string }> = {
  nl: { kop: "Praktische kennis over 3D-modellen", sub: (n) => `${n} artikels voor aannemers en machinisten` },
  fr: { kop: "L'essentiel sur les modèles 3D", sub: (n) => `${n} articles pour entrepreneurs et conducteurs d'engins` },
  en: { kop: "Practical know-how on 3D models", sub: (n) => `${n} articles for contractors and machine operators` },
  de: { kop: "Praxiswissen zu 3D-Modellen", sub: (n) => `${n} Artikel für Bauunternehmen und Maschinenführer` },
  es: { kop: "Lo esencial de los modelos 3D", sub: (n) => `${n} artículos para contratistas y operadores` },
};

const OFFERTE: Record<Locale, { kop: string; sub: string }> = {
  nl: { kop: "Vraag een offerte aan", sub: "Plannen opladen · 3D-model in het formaat van uw machine" },
  fr: { kop: "Demandez un devis", sub: "Envoyez vos plans · modèle 3D au format de votre engin" },
  en: { kop: "Request a quote", sub: "Upload your plans · 3D model in your machine's format" },
  de: { kop: "Fordern Sie ein Angebot an", sub: "Pläne hochladen · 3D-Modell im Format Ihrer Maschine" },
  es: { kop: "Solicite un presupuesto", sub: "Suba sus planos · modelo 3D en el formato de su máquina" },
};

/** De merkkaart van een pagina, of null als de sleutel niet bestaat. */
export function paginaKaart(l: Locale, sleutel: PaginaSleutel): Merkkaart | null {
  const prijs = (c: keyof typeof UURTARIEF_CENT) => euro(UURTARIEF_CENT[c], l);
  switch (sleutel) {
    case "home":
      return {
        kop: HOME[l].kop,
        sub: MERKEN,
        chips: [{ tekst: HOME[l].prijs(prijs("vroegtijdig")) }],
        beeld: "/3d/relief-bouwput-donker.png",
      };
    case "3d-modellen":
      return { label: LABEL.modellen[l], ...MODELLEN[l], beeld: "/3d/h/plan-hoogtelijnen-donker.webp" };
    case "realisaties":
      return { kop: REAL[l].kop(REALISATIES.length), sub: REAL[l].sub, beeld: MOZAIEK };
    case "tarieven":
      return {
        kop: TARIEF[l].kop,
        chips: [
          { tekst: prijs("vroegtijdig"), label: TARIEF[l].cats[0], nadruk: true },
          { tekst: prijs("normaal"), label: TARIEF[l].cats[1] },
          { tekst: prijs("last-minute"), label: TARIEF[l].cats[2] },
        ],
        voet: TARIEF[l].voet,
        beeld: "/3d/relief-grondwerk-donker.png",
        gedempt: true,
      };
    case "over":
      return {
        label: LABEL.over[l],
        kop: OVER[l].kop,
        sub: `${FUNCTIE[l]} · ${OVER[l].overal}`,
        beeld: "/3d/h/trace-luchtfoto-donker.webp",
      };
    case "kennis":
      return {
        label: LABEL.kennis[l],
        kop: KENNISBANK[l].kop,
        sub: KENNISBANK[l].sub(KENNIS.length),
        beeld: "/3d/h/terrein-spectrum-donker.webp",
      };
    case "offerte":
      return { ...OFFERTE[l], beeld: "/3d/r/t013-donker.webp" };
  }
  if (sleutel.startsWith("realisaties/")) {
    const p = archiefProject(sleutel.slice("realisaties/".length));
    if (!p) return null;
    return { label: CATEGORIEEN[p.cat][l], kop: p[l].titel, sub: p.systemen.join(" · "), beeld: archiefBeeld(p.code, "3d") };
  }
  const slug = sleutel.startsWith("kennis/") ? sleutel.slice("kennis/".length) : "";
  const a = slug ? kennisArtikel(slug) : null;
  if (!a) return null;
  return {
    label: LABEL.kennis[l],
    kop: a.i18n[l].titel,
    beeld: KOPBEELD[a.slug]?.donker ?? "/3d/r/t023-donker.webp",
  };
}

/** Pad van het deelbeeld, zonder versie: /beeld/og/nl.jpg, /beeld/og/nl/kennis/x.jpg. */
export function ogBeeldPad(l: Locale, sleutel: PaginaSleutel): string {
  return sleutel === "home" ? `/beeld/og/${l}.jpg` : `/beeld/og/${l}/${sleutel}.jpg`;
}

// FNV-1a, twee rondes: kort en stabiel, zonder node:crypto.
function inhoudsHash(s: string): string {
  let a = 2166136261;
  let b = 5381;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619);
    b = Math.imul(b, 33) ^ c;
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36);
}

/**
 * og:image voor paginaMeta(): adres met ?v=<hash van kaart + ontwerpversie>
 * en een alt-tekst. Onbekende kennisslug → de kaart van de kennisbank.
 */
export function ogBeeld(l: Locale, sleutel: PaginaSleutel): { url: string; alt: string } {
  let s = sleutel;
  let kaart = paginaKaart(l, s);
  if (!kaart) {
    s = "kennis";
    kaart = paginaKaart(l, s)!;
  }
  const v = inhoudsHash(`${MERKKAART_VERSIE}|${JSON.stringify(kaart)}`);
  const alt = [kaart.kop, kaart.sub].filter(Boolean).join(" · ");
  return { url: `${ogBeeldPad(l, s)}?v=${v}`, alt: `${alt} — Studio VM` };
}

/** Alle paginabeelden, voor generateStaticParams van de route. */
export function alleOgPaden(): { pad: string[] }[] {
  const sleutels: PaginaSleutel[] = [
    ...VASTE_SLEUTELS,
    ...KENNIS.map((a) => `kennis/${a.slug}` as const),
    ...ARCHIEF.map((p) => `realisaties/${p.code}` as const),
  ];
  return LOCALES.flatMap((l) =>
    sleutels.map((s) => ({ pad: ogBeeldPad(l, s).replace(/^\/beeld\/og\//, "").split("/") })),
  );
}

/** Omgekeerd: ["nl", "kennis", "x.jpg"] → { l: "nl", sleutel: "kennis/x" }. */
export function sleutelUitPad(pad: string[]): { l: Locale; sleutel: PaginaSleutel } | null {
  const delen = [...pad];
  const laatste = delen.pop();
  if (!laatste || !laatste.endsWith(".jpg")) return null;
  delen.push(laatste.slice(0, -4));
  const [l, ...rest] = delen;
  if (!(LOCALES as readonly string[]).includes(l)) return null;
  const sleutel = (rest.length ? rest.join("/") : "home") as PaginaSleutel;
  if (rest[0] === "home") return null; // enkel /beeld/og/nl.jpg is de startpagina
  return paginaKaart(l as Locale, sleutel) ? { l: l as Locale, sleutel } : null;
}
