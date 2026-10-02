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
    id: "gbp-afwerken",
    titel: "Bedrijfsprofiel afwerken",
    uitleg: "De 9 Services, een eerste Post (foto 10-tracé-op-luchtfoto), Afspraken-link naar /nl/offerte en LinkedIn bij Profielen.",
    vanaf: "2026-10-02",
    link: { label: "Bedrijfsprofiel", href: "https://business.google.com" },
  },
  {
    id: "bing-places",
    titel: "Bing Places: importeren uit Google Bedrijfsprofiel",
    uitleg: "Een paar klikken — dan sta je ook op de kaart in Bing, DuckDuckGo en ChatGPT-zoeken.",
    vanaf: "2026-10-02",
    link: { label: "Bing Places", href: "https://www.bingplaces.com" },
  },
  {
    id: "linkedin",
    titel: "LinkedIn-profiel bijwerken",
    uitleg: "Kop: '3D-Topograaf · 3D-modellen voor machinesturing — Trimble, Topcon, Leica, Unicontrol | Studio VM' en https://www.studio-vm.be/nl bij contactgegevens. Optioneel een bedrijfspagina Studio VM.",
    vanaf: "2026-10-02",
    link: { label: "LinkedIn", href: "https://www.linkedin.com/in/vincentmontreuil" },
  },
  {
    id: "facebook-oud",
    titel: "Oude Facebookpagina 'Studio-vm' ombouwen of verwijderen",
    uitleg: "Staat nog als webdesigner met cover 'WEBSTUDIO · WAREGEM'. Naam Studio VM, 3D-beschrijving, nieuwe cover (10-tracé-op-luchtfoto), plaats Anzegem — of verwijderen. Idem voor andere oude profielen.",
    vanaf: "2026-10-03",
    link: { label: "Facebook", href: "https://www.facebook.com/pages/?category=your_pages" },
  },
  {
    id: "kbo",
    titel: "KBO via My Enterprise: website, e-mail en telefoon",
    uitleg: "Aanmelden met itsme; vul https://www.studio-vm.be, info@studio-vm.be en +32 477 99 56 51 in. Gidsen als companyweb, Trends en Gouden Gids nemen dat over.",
    vanaf: "2026-10-03",
    link: { label: "My Enterprise", href: "https://economie.fgov.be/nl/themas/ondernemingen/kruispuntbank-van/diensten-voor-iedereen/my-enterprise" },
  },
  {
    id: "apple",
    titel: "Apple Business Connect",
    uitleg: "Studio VM toevoegen met exact dezelfde gegevens — voor Apple Maps en Siri.",
    vanaf: "2026-10-04",
    link: { label: "Apple Business", href: "https://businessconnect.apple.com" },
  },
  {
    id: "gidsen",
    titel: "Gratis vermeldingen in bedrijvengidsen",
    uitleg: "Telkens exact: Studio VM (Vincent Montreuil) · Nieuwpoortstraat 14-301, 8570 Anzegem · +32 477 99 56 51 · info@studio-vm.be · https://www.studio-vm.be. Gidsen: Anzegem, goldenpages.be, cylex-belgie.be, infobel.com, europages.com, kompass.com.",
    vanaf: "2026-10-05",
  },
  {
    id: "backlinks",
    titel: "Links vragen bij vakpers en dealers",
    uitleg: "Terra Mag en GWW-Bouw (schreven in 2020 over je) en de dealers waarmee je echt samenwerkt (SITECH, Topcon, Leica, Unicontrol, CHCNAV): vraag een vermelding met link naar studio-vm.be.",
    vanaf: "2026-10-07",
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
