import type { Locale } from "./i18n/config";

// Eén bron voor naam, adres, telefoon en identiteit (NAP). Footer, contact,
// juridische pagina's en gestructureerde gegevens lezen allemaal hieruit.
//
// De site spreekt als "Studio VM". De naam van de houder staat publiek
// enkel in de wettelijke identiteitsregel (footer, /voorwaarden, /privacy)
// en als legalName in de gestructureerde gegevens.

export const BEDRIJF = {
  naam: "Studio VM",
  houder: "Vincent Montreuil",
  straat: "Nieuwpoortstraat 14-301",
  postcode: "8570",
  gemeente: "Anzegem",
  provincie: "West-Vlaanderen",
  landCode: "BE",
  telefoon: "+32 477 99 56 51",
  telefoonE164: "+32477995651",
  email: "info@studio-vm.be",
  btw: "BE 0672.960.066",
  btwCompact: "BE0672960066",
} as const;

// Profielen van Studio VM op sociale media en platformen, in de volgorde van
// de footer. Een lege tekst = (nog) geen profiel: de footer en sameAs in de
// gestructureerde gegevens slaan het dan over. De privacyverklaring noemt
// de platformen in vaste tekst ("heeft, of opent binnenkort, …") en
// verwijst voor de bestaande profielen naar de footer.
// Altijd het kale profieladres, zonder UTM (rel="me" en sameAs moeten exact
// naar het profiel wijzen). LinkedIn: enkel een bedrijfspagina Studio VM,
// nooit het persoonlijke profiel (draagt naam en foto).
export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "google"
  | "youtube"
  | "tiktok"
  | "pinterest"
  | "x"
  | "threads"
  | "bluesky";

export const SOCIAL: Record<SocialPlatform, string> = {
  facebook: "https://www.facebook.com/profile.php?id=61590220986288",
  instagram: "https://www.instagram.com/studio_vm.be/",
  linkedin: "https://www.linkedin.com/company/studio-vm-be/",
  // Google-bedrijfsprofiel: de Maps-link (https://maps.google.com/?cid=…)
  google: "",
  youtube: "",
  tiktok: "",
  pinterest: "",
  x: "",
  threads: "",
  bluesky: "",
};

export const SOCIAL_NAAM: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  google: "Google",
  youtube: "YouTube",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  x: "X",
  threads: "Threads",
  bluesky: "Bluesky",
};

/** De ingevulde profielen, in footervolgorde. */
export function socialProfielen(): { platform: SocialPlatform; naam: string; url: string }[] {
  return (Object.keys(SOCIAL) as SocialPlatform[])
    .filter((p) => SOCIAL[p].trim() !== "")
    .map((p) => ({ platform: p, naam: SOCIAL_NAAM[p], url: SOCIAL[p].trim() }));
}

export const LAND: Record<Locale, string> = {
  nl: "België",
  fr: "Belgique",
  en: "Belgium",
  de: "Belgien",
  es: "Bélgica",
};

export const PROVINCIE: Record<Locale, string> = {
  nl: "West-Vlaanderen",
  fr: "Flandre-Occidentale",
  en: "West Flanders",
  de: "Westflandern",
  es: "Flandes Occidental",
};

// Beroepstitel: enige bron voor site, mails en gestructureerde gegevens.
// Nooit "landmeter", "géomètre", "Vermesser" of "land surveyor":
// landmeter-expert is een beschermde titel.
export const FUNCTIE: Record<Locale, string> = {
  nl: "3D-Topograaf",
  fr: "Topographe 3D",
  en: "3D Topographer",
  de: "3D-Topograf",
  es: "Topógrafo 3D",
};

const RECHTSVORM: Record<Locale, string> = {
  nl: "eenmanszaak",
  fr: "entreprise individuelle",
  en: "sole proprietorship",
  de: "Einzelunternehmen",
  es: "empresa individual",
};

const ONDERNEMINGSNUMMER: Record<Locale, string> = {
  nl: "ondernemingsnummer",
  fr: "numéro d'entreprise",
  en: "company number",
  de: "Unternehmensnummer",
  es: "número de empresa",
};

/**
 * Volledige wettelijke identiteitsregel, enkel voor de footer, /privacy en
 * /voorwaarden (de enige publieke plekken met de naam van de houder):
 * "Studio VM · Vincent Montreuil (eenmanszaak) · Nieuwpoortstraat 14-301,
 * 8570 Anzegem, België · +32 477 99 56 51 · info@studio-vm.be ·
 * ondernemingsnummer BE 0672.960.066"
 */
export function identiteitsregel(locale: Locale): string {
  const b = BEDRIJF;
  return [
    b.naam,
    `${b.houder} (${RECHTSVORM[locale]})`,
    `${b.straat}, ${b.postcode} ${b.gemeente}, ${LAND[locale]}`,
    b.telefoon,
    b.email,
    `${ONDERNEMINGSNUMMER[locale]} ${b.btw}`,
  ].join(" · ");
}
