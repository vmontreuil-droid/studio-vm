// SEO-opvolging voor het admin-dashboard: wat Vincent zelf moet doen buiten
// de site (Search Console, Bing, Bedrijfsprofiel…). Een taak verschijnt pas
// vanaf de dag dat ze zinvol is; afgevinkt wordt bewaard in app_settings
// onder de sleutel `seo_taak:<id>` (waarde = datum van afvinken).

export type SeoTaak = {
  id: string;
  titel: string;
  uitleg: string;
  /** Vanaf deze dag (YYYY-MM-DD) tonen. */
  vanaf: string;
  link?: { label: string; href: string };
  /** Terugkerend: na afvinken komt de taak na zoveel dagen terug. */
  herhaalDagen?: number;
  /** Bij terugkerende fototaken: de beelden in volgorde, per beurt `perBeurt` stuks. */
  reeks?: { map: string; bestanden: string[]; perBeurt: number };
};

// De projectbeelden voor het Bedrijfsprofiel staan op het bureaublad.
export const GBP_FOTO_MAP = "Bureaublad › studio-vm-google › extra";
const GBP_FOTOS = [
  "10-tracé-op-luchtfoto.jpg",
  "11-plan-met-hoogtelijnen-en-lijnwerk.jpg",
  "12-parking-afwatering-hellingen.jpg",
  "13-grondwerk-reliëf.jpg",
  "14-bouwput-reliëf.jpg",
  "17-terrein-hoogtekleuren.jpg",
  "22-talud-in-bocht.jpg",
  "23-funderingsplaten-op-niveau.jpg",
  "25-wegennet-verkaveling.jpg",
  "15-sportterrein-reliëf.jpg",
  "16-weg-met-kruispunt.jpg",
  "18-terrein-lijnwerk.jpg",
  "20-platform-hellingcontrole.jpg",
  "21-bestaand-terrein-hoogtekleuren.jpg",
  "24-terrein-modellering.jpg",
];

/** Waarde in app_settings: "YYYY-MM-DD" of, bij terugkerende taken, "YYYY-MM-DD|aantal". */
export function leesTaakWaarde(v: string | null | undefined): { datum: string; aantal: number } {
  const [datum, n] = String(v ?? "").split("|");
  return { datum: datum || "", aantal: Number(n) || (datum ? 1 : 0) };
}

export function plusDagen(datum: string, dagen: number): string {
  const d = new Date(`${datum}T00:00:00`);
  d.setDate(d.getDate() + dagen);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** De beelden voor de volgende beurt van een fototaak (loopt rond als de reeks op is). */
export function volgendeBeelden(taak: SeoTaak, aantalGedaan: number): string[] {
  if (!taak.reeks) return [];
  const { bestanden, perBeurt } = taak.reeks;
  return Array.from({ length: perBeurt }, (_, i) => bestanden[(aantalGedaan * perBeurt + i) % bestanden.length]);
}

export const SEO_TAAK_PREFIX = "seo_taak:";

export const SEO_TAKEN: SeoTaak[] = [
  {
    id: "gsc-sitemap",
    titel: "Sitemap indienen in Google Search Console",
    uitleg: "https://www.studio-vm.be/sitemap.xml onder Sitemaps.",
    vanaf: "2026-10-02",
    link: { label: "Search Console", href: "https://search.google.com/search-console" },
  },
  {
    id: "gsc-indexering",
    titel: "Indexering aanvragen voor de hoofdpagina's",
    uitleg: "URL-inspectie → Indexering aanvragen voor /nl, /fr, /nl/3d-modellen en /nl/offerte.",
    vanaf: "2026-10-02",
    link: { label: "Search Console", href: "https://search.google.com/search-console" },
  },
  {
    id: "bing",
    titel: "Bing Webmaster Tools koppelen",
    uitleg: "Kies 'Importeren uit Google Search Console' — dekt ook DuckDuckGo en Ecosia.",
    vanaf: "2026-10-02",
    link: { label: "Bing Webmaster", href: "https://www.bing.com/webmasters" },
  },
  {
    id: "gbp",
    titel: "Google Bedrijfsprofiel aanmaken",
    uitleg: "Categorie Landmeter, servicegebied i.p.v. adres, diensten en beschrijving zoals voorgesteld.",
    vanaf: "2026-10-03",
    link: { label: "Bedrijfsprofiel", href: "https://business.google.com" },
  },
  {
    id: "gbp-fotos",
    titel: "Nieuwe foto's toevoegen aan het Bedrijfsprofiel",
    uitleg: "Een profiel dat regelmatig nieuwe beelden krijgt, ziet Google als actief. Bedrijfsprofiel → Foto's → Foto's toevoegen.",
    vanaf: "2026-10-03",
    herhaalDagen: 14,
    reeks: { map: GBP_FOTO_MAP, bestanden: GBP_FOTOS, perBeurt: 3 },
    link: { label: "Bedrijfsprofiel", href: "https://business.google.com" },
  },
  {
    id: "gbp-update",
    titel: "Update plaatsen op het Bedrijfsprofiel",
    uitleg: "Een recente realisatie: één beeld, twee zinnen (soort werk, regio, systeem) en de knop 'Meer informatie' naar studio-vm.be/nl/realisaties.",
    vanaf: "2026-10-09",
    herhaalDagen: 30,
    link: { label: "Bedrijfsprofiel", href: "https://business.google.com" },
  },
  {
    id: "linkedin",
    titel: "LinkedIn-bedrijfspagina Studio VM",
    uitleg: "Zelfde naam, adres en telefoon als op de site; link naar studio-vm.be.",
    vanaf: "2026-10-03",
    link: { label: "LinkedIn", href: "https://www.linkedin.com/company/setup/new/" },
  },
  {
    id: "gsc-paginas",
    titel: "Search Console › Pagina's nakijken",
    uitleg: "Welke pagina's zijn geïndexeerd en welke niet, met de reden. Een redirect bij oude websiteadressen is normaal.",
    vanaf: "2026-10-05",
    link: { label: "Search Console", href: "https://search.google.com/search-console" },
  },
  {
    id: "gsc-verbeteringen",
    titel: "Search Console › Verbeteringen nakijken",
    uitleg: "Leest Google de veelgestelde vragen, broodkruimels en bedrijfsgegevens zonder fouten?",
    vanaf: "2026-10-06",
    link: { label: "Search Console", href: "https://search.google.com/search-console" },
  },
  {
    id: "reviews",
    titel: "Eerste klanten om een Google-review vragen",
    uitleg: "Pas zodra het Bedrijfsprofiel geverifieerd is. Echte reviews wegen zwaar voor lokale zoekresultaten.",
    vanaf: "2026-10-10",
  },
  {
    id: "gsc-prestaties",
    titel: "Search Console › Prestaties bekijken",
    uitleg: "Op welke zoekwoorden verschijnt u, hoe vaak en op welke positie? Stuur de lijst door, dan sturen we de teksten bij.",
    vanaf: "2026-10-12",
    link: { label: "Search Console", href: "https://search.google.com/search-console" },
  },
];
