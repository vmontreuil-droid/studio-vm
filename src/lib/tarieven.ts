// Uurtarieven voor 3D-modellen (excl. btw). Eén plek: tarievenpagina,
// offerteformulier en offertes lezen allemaal hieruit.

export type Categorie = "vroegtijdig" | "normaal" | "last-minute";

export const UURTARIEF_CENT: Record<Categorie, number> = {
  vroegtijdig: 4500,
  normaal: 5000,
  "last-minute": 7500,
};

/** Minimum aantal aangerekende uren per opdracht. */
export const MINIMUM_UREN = 1;

export function euro(cent: number, locale: string = "nl"): string {
  const l =
    locale === "fr" ? "fr-BE" : locale === "en" ? "en-GB" : locale === "de" ? "de-DE" : locale === "es" ? "es-ES" : "nl-BE";
  return new Intl.NumberFormat(l, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cent % 100 ? 2 : 0,
  }).format(cent / 100);
}
