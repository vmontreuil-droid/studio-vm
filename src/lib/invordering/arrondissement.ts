// Gerechtelijk arrondissement van een Belgische postcode. Een
// gerechtsdeurwaarder is bevoegd binnen zijn arrondissement: voor de snelste
// afhandeling neemt Studio VM de deurwaarder van het arrondissement van de
// klant (schuldenaar). Puur rekenwerk, zonder databank.

export type Arrondissement =
  | "antwerpen" | "limburg" | "oost-vlaanderen" | "west-vlaanderen" | "leuven" | "brussel"
  | "waals-brabant" | "henegouwen" | "luik" | "luxemburg" | "namen" | "eupen";

export const ARRONDISSEMENTEN: Record<Arrondissement, { naam: string; taal: "nl" | "fr" | "de" }> = {
  antwerpen: { naam: "Antwerpen", taal: "nl" },
  limburg: { naam: "Limburg", taal: "nl" },
  "oost-vlaanderen": { naam: "Oost-Vlaanderen", taal: "nl" },
  "west-vlaanderen": { naam: "West-Vlaanderen", taal: "nl" },
  leuven: { naam: "Leuven", taal: "nl" },
  brussel: { naam: "Brussel (incl. Halle-Vilvoorde)", taal: "nl" },
  "waals-brabant": { naam: "Waals-Brabant", taal: "fr" },
  henegouwen: { naam: "Henegouwen", taal: "fr" },
  luik: { naam: "Luik", taal: "fr" },
  luxemburg: { naam: "Luxemburg", taal: "fr" },
  namen: { naam: "Namen", taal: "fr" },
  eupen: { naam: "Eupen", taal: "de" },
};

export function isArrondissement(v: unknown): v is Arrondissement {
  return typeof v === "string" && v in ARRONDISSEMENTEN;
}

/** Arrondissement voor een Belgische postcode (1000–9999), anders null. */
export function arrondissementVoorPostcode(pc: number | null | undefined): Arrondissement | null {
  if (!pc || !Number.isInteger(pc) || pc < 1000 || pc > 9999) return null;
  if (pc < 1300) return "brussel";
  if (pc < 1500) return "waals-brabant";
  if (pc < 2000) return "brussel"; // Halle-Vilvoorde hoort bij het arrondissement Brussel
  if (pc < 3000) return "antwerpen";
  if (pc < 3500) return "leuven";
  if (pc < 4000) return "limburg";
  if (pc >= 4700 && pc < 4800) return "eupen"; // Duitstalige Gemeenschap
  if (pc < 5000) return "luik";
  if (pc < 6000) return "namen";
  if (pc < 6600) return "henegouwen";
  if (pc < 7000) return "luxemburg";
  if (pc < 8000) return "henegouwen";
  if (pc < 9000) return "west-vlaanderen";
  return "oost-vlaanderen";
}

/**
 * Belgische postcode uit een vrij adres ("Kortrijkstraat 1\n8500 Kortrijk").
 * Neemt een viercijferig getal gevolgd door een plaatsnaam; huisnummers
 * ervoor tellen niet. Null als er geen (Belgische) postcode in staat.
 */
export function postcodeUitAdres(adres: string | null | undefined): number | null {
  const tekst = String(adres ?? "");
  const kandidaten = [...tekst.matchAll(/(?:^|[\s,])(?:B-|BE-)?([1-9]\d{3})\s+[A-Za-zÀ-ÿ'’-]{2,}/g)].map((m) => Number(m[1]));
  return kandidaten.length ? kandidaten[kandidaten.length - 1] : null;
}

const BUITENLAND =
  /\b(nederland|netherlands|pays-bas|niederlande|france|frankrijk|frankreich|deutschland|duitsland|allemagne|germany|luxembourg|luxemburg|grand-duch[eé]|schweiz|suisse|zwitserland|switzerland|united kingdom|verenigd koninkrijk|royaume-uni|espa[ñn]a|spanje|espagne)\b/i;

/**
 * Ligt de klant (vermoedelijk) buiten België? Een buitenlands btw-nummer,
 * een landnaam in het adres, of een Nederlandse postcode ("8011 AB") die
 * anders voor een Belgische zou doorgaan.
 */
export function isBuitenlands(adres: string | null | undefined, btw: string | null | undefined): boolean {
  const nr = String(btw ?? "").replace(/[\s.-]/g, "").toUpperCase();
  if (/^[A-Z]{2}/.test(nr) && !nr.startsWith("BE")) return true;
  const tekst = String(adres ?? "");
  if (BUITENLAND.test(tekst)) return true;
  return /(?:^|[\s,])[1-9]\d{3}\s?[A-Z]{2}(?:\s|,|$)/.test(tekst);
}

/** Arrondissement van de klant, of null (buitenland of geen postcode gevonden). */
export function arrondissementVanKlant(adres: string | null | undefined, btw: string | null | undefined): Arrondissement | null {
  if (isBuitenlands(adres, btw)) return null;
  return arrondissementVoorPostcode(postcodeUitAdres(adres));
}
