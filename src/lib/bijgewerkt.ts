import type { Locale } from "./i18n/config";

// Eén bron voor datums: sitemap (lastmod), artikels (datePublished /
// dateModified, Open Graph) en "laatst bijgewerkt" op de juridische pagina's.
//
// VANDAAG is bewust een vaste tekst en wordt nooit tijdens het draaien
// berekend: een datum die bij elke build verspringt, zegt zoekmachines niets.
// Pas hem aan wanneer de inhoud echt wijzigt.
const VANDAAG = "2026-10-02";

export const PAGINA_BIJGEWERKT: Record<
  | ""
  | "/3d-modellen"
  | "/realisaties"
  | "/tarieven"
  | "/offerte"
  | "/kennis"
  | "/over"
  | "/voorwaarden"
  | "/privacy"
  | "/cookies",
  string
> = {
  "": VANDAAG,
  "/3d-modellen": VANDAAG,
  "/realisaties": VANDAAG,
  "/tarieven": VANDAAG,
  "/offerte": VANDAAG,
  "/kennis": VANDAAG,
  "/over": VANDAAG,
  "/voorwaarden": VANDAAG,
  // 3/10: bezoekstatistieken met UTM, herkomst van aanvragen, sociale media.
  "/privacy": "2026-10-03",
  "/cookies": VANDAAG,
};

const EERSTE_REEKS = "2026-10-01T14:22:15+02:00";
const TWEEDE_REEKS = "2026-10-01T19:45:18+02:00";

export const KENNIS_DATUM: Record<string, { gepubliceerd: string; bijgewerkt: string }> = {
  "wat-is-een-3d-model": { gepubliceerd: EERSTE_REEKS, bijgewerkt: VANDAAG },
  "lijnwerk-en-breeklijnen": { gepubliceerd: EERSTE_REEKS, bijgewerkt: VANDAAG },
  coordinatenstelsels: { gepubliceerd: EERSTE_REEKS, bijgewerkt: VANDAAG },
  "bestanden-per-merk": { gepubliceerd: EERSTE_REEKS, bijgewerkt: VANDAAG },
  "wat-aanleveren": { gepubliceerd: EERSTE_REEKS, bijgewerkt: VANDAAG },
  "controle-en-toleranties": { gepubliceerd: EERSTE_REEKS, bijgewerkt: VANDAAG },
  "veelgestelde-vragen": { gepubliceerd: EERSTE_REEKS, bijgewerkt: VANDAAG },
  "van-pdf-naar-model": { gepubliceerd: TWEEDE_REEKS, bijgewerkt: VANDAAG },
  "grondverzet-en-volumes": { gepubliceerd: TWEEDE_REEKS, bijgewerkt: VANDAAG },
};

export function kennisDatum(slug: string): { gepubliceerd: string; bijgewerkt: string } {
  return KENNIS_DATUM[slug] ?? { gepubliceerd: EERSTE_REEKS, bijgewerkt: VANDAAG };
}

const DATUM_LOCALE: Record<Locale, string> = {
  nl: "nl-BE",
  fr: "fr-BE",
  en: "en-GB",
  de: "de-DE",
  es: "es-ES",
};

/** Leesbare datum, bv. "2 oktober 2026" / "2 October 2026". */
export function datumLabel(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(DATUM_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Brussels",
  }).format(new Date(iso));
}
