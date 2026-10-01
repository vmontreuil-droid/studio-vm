import { KENNIS } from "@/lib/kennis";
import { localePath, type Locale } from "@/lib/i18n/config";

export type SearchEntry = {
  title: string;
  href: string;
  kind: "Page" | "Werk" | "Journal" | "Module";
  hint?: string;
};

const pageDefs: Record<Locale, { title: string; path: string; hint?: string }[]> = {
  nl: [
    { title: "Home", path: "/", hint: "3D-modellen voor machinesturing" },
    { title: "3D-modellen", path: "/3d-modellen", hint: "Wat zit er in een model" },
    { title: "Realisaties", path: "/realisaties", hint: "Wegenis, grondwerk, bouwputten, terreinen" },
    { title: "Tarieven", path: "/tarieven", hint: "Uurtarieven vroegtijdig, normaal, last-minute" },
    { title: "Offerte aanvragen", path: "/offerte", hint: "Plannen opladen, werfadres, machinesturing" },
    { title: "Kennisbank", path: "/kennis", hint: "Uitleg over modellen, stelsels, bestanden" },
    { title: "Over Vincent", path: "/over", hint: "Wie maakt de modellen" },
    { title: "Klantenportaal", path: "/portail", hint: "Projecten, offertes, downloads" },
    { title: "Privacy", path: "/privacy" },
    { title: "Cookies", path: "/cookies" },
    { title: "Algemene voorwaarden", path: "/voorwaarden" },
  ],
  fr: [
    { title: "Accueil", path: "/", hint: "Modèles 3D pour le guidage d'engins" },
    { title: "Modèles 3D", path: "/3d-modellen", hint: "Que contient un modèle" },
    { title: "Réalisations", path: "/realisaties", hint: "Voiries, terrassements, fouilles, terrains" },
    { title: "Tarifs", path: "/tarieven", hint: "Tarifs horaires anticipé, normal, urgent" },
    { title: "Demander un devis", path: "/offerte", hint: "Plans, adresse du chantier, guidage" },
    { title: "Base de connaissances", path: "/kennis", hint: "Modèles, systèmes, fichiers" },
    { title: "À propos de Vincent", path: "/over", hint: "Qui réalise les modèles" },
    { title: "Espace client", path: "/portail", hint: "Projets, devis, téléchargements" },
    { title: "Confidentialité", path: "/privacy" },
    { title: "Cookies", path: "/cookies" },
    { title: "Conditions générales", path: "/voorwaarden" },
  ],
  en: [
    { title: "Home", path: "/", hint: "3D models for machine control" },
    { title: "3D models", path: "/3d-modellen", hint: "What is in a model" },
    { title: "Projects", path: "/realisaties", hint: "Roads, earthworks, excavations, terrain" },
    { title: "Rates", path: "/tarieven", hint: "Hourly rates early, standard, last-minute" },
    { title: "Request a quote", path: "/offerte", hint: "Plans, site address, machine control" },
    { title: "Knowledge base", path: "/kennis", hint: "Models, systems, files" },
    { title: "About Vincent", path: "/over", hint: "Who builds the models" },
    { title: "Client portal", path: "/portail", hint: "Projects, quotes, downloads" },
    { title: "Privacy", path: "/privacy" },
    { title: "Cookies", path: "/cookies" },
    { title: "Terms & conditions", path: "/voorwaarden" },
  ],
  de: [
    { title: "Start", path: "/", hint: "3D-Modelle für Maschinensteuerung" },
    { title: "3D-Modelle", path: "/3d-modellen", hint: "Was ein Modell enthält" },
    { title: "Referenzen", path: "/realisaties", hint: "Straßenbau, Erdarbeiten, Baugruben, Gelände" },
    { title: "Preise", path: "/tarieven", hint: "Stundensätze frühzeitig, normal, kurzfristig" },
    { title: "Angebot anfordern", path: "/offerte", hint: "Pläne hochladen, Baustellenadresse, Maschinensteuerung" },
    { title: "Wissensdatenbank", path: "/kennis", hint: "Modelle, Koordinatensysteme, Dateien" },
    { title: "Über Vincent", path: "/over", hint: "Wer die Modelle erstellt" },
    { title: "Kundenportal", path: "/portail", hint: "Projekte, Angebote, Downloads" },
    { title: "Datenschutz", path: "/privacy" },
    { title: "Cookies", path: "/cookies" },
    { title: "Allgemeine Geschäftsbedingungen", path: "/voorwaarden" },
  ],
  es: [
    { title: "Inicio", path: "/", hint: "Modelos 3D para control de máquinas" },
    { title: "Modelos 3D", path: "/3d-modellen", hint: "Qué contiene un modelo" },
    { title: "Proyectos", path: "/realisaties", hint: "Viales, movimiento de tierras, excavaciones, terrenos" },
    { title: "Tarifas", path: "/tarieven", hint: "Tarifas por hora: anticipada, normal, urgente" },
    { title: "Solicitar presupuesto", path: "/offerte", hint: "Subir planos, dirección de la obra, control de máquinas" },
    { title: "Base de conocimientos", path: "/kennis", hint: "Modelos, sistemas de coordenadas, archivos" },
    { title: "Sobre Vincent", path: "/over", hint: "Quién elabora los modelos" },
    { title: "Portal de clientes", path: "/portail", hint: "Proyectos, presupuestos, descargas" },
    { title: "Privacidad", path: "/privacy" },
    { title: "Cookies", path: "/cookies" },
    { title: "Condiciones generales", path: "/voorwaarden" },
  ],
};

export function getSearchIndex(locale: Locale): SearchEntry[] {
  const pages: SearchEntry[] = pageDefs[locale].map((p) => ({
    title: p.title,
    href: localePath(locale, p.path),
    kind: "Page",
    hint: p.hint,
  }));
  const kennis: SearchEntry[] = KENNIS.map((a) => {
    const tekst = a.i18n[locale] ?? a.i18n.en;
    return {
      title: tekst.titel,
      href: localePath(locale, `/kennis/${a.slug}`),
      kind: "Journal",
      hint: tekst.samenvatting.slice(0, 70),
    };
  });
  return [...pages, ...kennis];
}

export function search(
  query: string,
  locale: Locale,
  limit = 8,
): SearchEntry[] {
  const index = getSearchIndex(locale);
  const q = query.trim().toLowerCase();
  if (!q) return index.slice(0, limit);
  return index
    .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((m) => m.entry);
}

function scoreEntry(entry: SearchEntry, q: string): number {
  const title = entry.title.toLowerCase();
  const hint = entry.hint?.toLowerCase() ?? "";
  if (title === q) return 100;
  if (title.startsWith(q)) return 50;
  if (title.includes(q)) return 25;
  if (hint.includes(q)) return 10;
  let qi = 0;
  for (const c of title) {
    if (c === q[qi]) qi++;
    if (qi === q.length) return 5;
  }
  return 0;
}
