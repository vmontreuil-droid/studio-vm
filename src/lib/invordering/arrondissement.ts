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

// Landnamen in het adres (nl/fr/de/en/eigen taal) → ISO-landcode.
const LANDWOORD: [RegExp, string][] = [
  [/\b(nederland|netherlands|pays-bas|niederlande|holland)\b/i, "NL"],
  [/\b(deutschland|duitsland|allemagne|germany)\b/i, "DE"],
  [/\b(france|frankrijk|frankreich)\b/i, "FR"],
  [/\b(grand-duch[eé]|groothertogdom|gro(ß|ss)herzogtum)\b/i, "LU"],
  [/\b(schweiz|suisse|zwitserland|switzerland|svizzera)\b/i, "CH"],
  [/\b(united kingdom|verenigd koninkrijk|royaume-uni|vereinigtes k[öo]nigreich|england|scotland)\b/i, "GB"],
  [/\b(espa[ñn]a|spanje|espagne|spanien|spain)\b/i, "ES"],
  [/\b(italia|itali[ëe]|italien|italy)\b/i, "IT"],
  [/\b([öo]sterreich|oostenrijk|autriche|austria)\b/i, "AT"],
  [/\b(polska|polen|pologne|poland)\b/i, "PL"],
];

/**
 * Land van de klant (ISO, bv. "BE", "NL"), of null als het niet uit te maken
 * valt. Volgorde: btw-nummer, "België" in het adres, landprefix bij de
 * postcode (L-1234, D-52062, F-59000, NL-8011), landnaam, Nederlandse
 * postcode ("8011 AB"), Belgische postcode. "Luxembourg" zonder meer kan ook
 * de Belgische provincie zijn: enkel buitenland zonder Belgische postcode.
 */
export function landVanKlant(adres: string | null | undefined, btw: string | null | undefined): string | null {
  const nr = String(btw ?? "").replace(/[\s.-]/g, "").toUpperCase();
  if (/^[A-Z]{2}[0-9A-Z]/.test(nr)) return nr.startsWith("EL") ? "GR" : nr.slice(0, 2);
  const tekst = String(adres ?? "");
  if (/\bbelgi(ë|e|que|um|en)\b/i.test(tekst)) return "BE";
  const prefix = tekst.match(/(?:^|[\s,])(L|D|F|NL|A|CH)-\d{4,5}\b/);
  if (prefix) return ({ L: "LU", D: "DE", F: "FR", NL: "NL", A: "AT", CH: "CH" } as Record<string, string>)[prefix[1]];
  for (const [re, iso] of LANDWOORD) if (re.test(tekst)) return iso;
  if (/(?:^|[\s,])[1-9]\d{3}\s?[A-Z]{2}(?:\s|,|$)/.test(tekst)) return "NL";
  const pc = postcodeUitAdres(tekst);
  if (/\b(luxembourg|luxemburg)\b/i.test(tekst) && !pc) return "LU";
  return pc ? "BE" : null;
}

/** Ligt de klant (vermoedelijk) buiten België? */
export function isBuitenlands(adres: string | null | undefined, btw: string | null | undefined): boolean {
  const land = landVanKlant(adres, btw);
  return !!land && land !== "BE";
}

/** Arrondissement van de klant, of null (buitenland of geen postcode gevonden). */
export function arrondissementVanKlant(adres: string | null | undefined, btw: string | null | undefined): Arrondissement | null {
  if (isBuitenlands(adres, btw)) return null;
  return arrondissementVoorPostcode(postcodeUitAdres(adres));
}

// ── Vaste partner per land (invordering in het buitenland) ──────────────

export type LandPartner = "land-nl" | "land-de" | "land-fr" | "land-lu";

export const LANDEN_PARTNER: Record<LandPartner, { iso: string; naam: string; taal: "nl" | "fr" | "de" }> = {
  "land-nl": { iso: "NL", naam: "Nederland", taal: "nl" },
  "land-de": { iso: "DE", naam: "Duitsland", taal: "de" },
  "land-fr": { iso: "FR", naam: "Frankrijk", taal: "fr" },
  "land-lu": { iso: "LU", naam: "Luxemburg (land)", taal: "fr" },
};

/** Waar de invordering gebeurt: een Belgisch arrondissement of een land met een vaste partner. */
export type Gebied = Arrondissement | LandPartner;

export function isLandPartner(v: unknown): v is LandPartner {
  return typeof v === "string" && v in LANDEN_PARTNER;
}

export function isGebied(v: unknown): v is Gebied {
  return isArrondissement(v) || isLandPartner(v);
}

/** Naam in het Nederlands (beheer). */
export function gebiedNaam(g: string | null | undefined): string | null {
  if (isArrondissement(g)) return ARRONDISSEMENTEN[g].naam;
  if (isLandPartner(g)) return LANDEN_PARTNER[g].naam;
  return null;
}

/** Gebied van de klant: zijn arrondissement, of zijn land als daar een vaste partner voor kan bestaan. */
export function gebiedVanKlant(adres: string | null | undefined, btw: string | null | undefined): Gebied | null {
  const land = landVanKlant(adres, btw);
  if (land && land !== "BE") {
    const g = `land-${land.toLowerCase()}`;
    return isLandPartner(g) ? g : null;
  }
  return arrondissementVoorPostcode(postcodeUitAdres(adres));
}
