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
};

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
