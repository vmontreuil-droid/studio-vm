export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string | null;
  stack: string[];
  accent: string;
  year: string;
  scope: string[];
  challenge: string;
  solution: string;
  highlights: string[];
};

export const projects: Project[] = [
  {
    slug: "cottage-waregem",
    name: "Cottage Waregem",
    tagline: "Restaurant — Waregem",
    description:
      "Migratie van Squarespace naar Next.js. Reservaties, menukaart per seizoen, vacaturepagina, Open Graph cards. Sneller en goedkoper te onderhouden.",
    url: "https://cottage-waregem.be",
    stack: ["Next.js 16", "Tailwind v4", "Supabase"],
    accent: "#7c3a2e",
    year: "2026",
    scope: ["Strategie", "Design", "Development", "Migratie", "SEO"],
    challenge:
      "Squarespace was traag, duur en moeilijk te wijzigen. De menukaart aanpassen voor een nieuw seizoen was telkens een gedoe, en mobiele bezoekers haakten af.",
    solution:
      "Volledige rebuild in Next.js met een eigen admin voor menu, vacatures en openingsuren. Alle bestaande content overgezet met permanente redirects om SEO te bewaren. Open Graph cards voor mooie deellinks.",
    highlights: [
      "PageSpeed-score van 32 → 98",
      "Menu-update van 30 min → 2 min",
      "Vacatures inclusief NL/FR mailflow",
    ],
  },
  {
    slug: "barbotte",
    name: "Bar'Botte",
    tagline: "Bistro — Brussel",
    description:
      "Tweetalige (NL/FR) restaurantsite met menu en reservaties. Kleinste zus-zaak van Cottage, eigen identiteit.",
    url: "https://barbotte.be",
    stack: ["Next.js 16", "Tailwind v4", "Supabase", "i18n"],
    accent: "#1f4e3d",
    year: "2026",
    scope: ["Design", "Development", "i18n NL/FR", "Reservaties"],
    challenge:
      "Brussels publiek is zowel NL als FR. De vorige site stond enkel in 't Nederlands en miste een groot deel van de buurt.",
    solution:
      "Volledig tweetalige site met taalkeuze, gedeeld admin met Cottage (zelfde keuken, andere identiteit), en een reservatieformulier dat rechtstreeks naar de zaak mailt.",
    highlights: [
      "NL/FR vertalingen via gedeelde admin",
      "Eigen identiteit, gedeeld backend",
      "Reservaties bevestigd binnen één dag",
    ],
  },
  {
    slug: "celine-interieur",
    name: "Céline Intérieur",
    tagline: "Interieurstyling — West-Vlaanderen",
    description:
      "Portfolio + admin als drie aparte PWA's: shop, werven en verhuur. Foto's, klanten, offertes, alles in één plek.",
    url: "https://celine-interieur.vercel.app",
    stack: ["Next.js 16", "Supabase", "PWA", "Tailwind v4"],
    accent: "#a8763e",
    year: "2025–2026",
    scope: ["Design", "Development", "PWA × 3", "Admin", "Shop"],
    challenge:
      "Drie heel verschillende business-stromen: een interieurshop, werven en verhuur. Eén admin had te veel ruis, drie aparte tools was te duur.",
    solution:
      "Eén Supabase database, drie installeerbare PWA's met elk hun eigen iconen. Céline werkt vanop haar telefoon, klanten zien enkel de publieke kant.",
    highlights: [
      "3 installeerbare PWA's (Shop, Werven, Verhuur)",
      "Foto's, klanten, offertes in één plek",
      "Werkt offline op de werf",
    ],
  },
  {
    slug: "allardphilippe",
    name: "Allard Philippe",
    tagline: "Wildlife fotografie — webshop",
    description:
      "Volledige webshop voor fine-art prints. Mollie betalingen, gift cards, kortingscodes, newsletter, klantenportaal. NL/FR.",
    url: "https://allardphilippe.be",
    stack: ["Next.js 16", "Supabase", "Mollie", "Resend", "i18n"],
    accent: "#3a4a5c",
    year: "2025–2026",
    scope: [
      "Design",
      "Development",
      "Webshop",
      "i18n NL/FR",
      "Newsletter",
      "Klantportaal",
    ],
    challenge:
      "Wildlife-fotograaf met fine-art prints. Wilde over de jaren een echte shop, maar Etsy/Instagram pakten te veel marge en gaven geen klanten-data terug.",
    solution:
      "Eigen Mollie-webshop met klantportaal, gift cards en kortingscodes. Newsletter ingebouwd met open/click tracking. NL/FR voor zowel het Vlaamse als Waalse publiek.",
    highlights: [
      "Mollie betalingen + gift cards",
      "Newsletter met tracking",
      "Klantenportaal voor bestellingen",
    ],
  },
  {
    slug: "jp-montreuil",
    name: "JP Montreuil",
    tagline: "Atelier kunstenaar",
    description:
      "WordPress-site herbouwd in Next.js + Supabase admin. Tentoonstellingen, galerij per album, ibook, alles beheerbaar.",
    url: "https://jp.montreuil.be",
    stack: ["Next.js 16", "Supabase", "i18n"],
    accent: "#5b3a52",
    year: "2026",
    scope: [
      "Design",
      "Development",
      "Migratie WordPress",
      "Admin",
      "i18n NL/FR",
    ],
    challenge:
      "WordPress met te veel plugins en te traag, en de kunstenaar wilde tentoonstellingen + galerijen zelf kunnen toevoegen zonder een ontwikkelaar te bellen.",
    solution:
      "Volledige rebuild in Next.js + Supabase admin. Tentoonstellingen, albums per galerij en een ibook-module. Volledig NL/FR vertaalbaar.",
    highlights: [
      "Eigen admin voor exhibitions",
      "Albums met drag-drop sort",
      "ibook-module voor publicaties",
    ],
  },
  {
    slug: "mari-lines",
    name: "Mari Lines",
    tagline: "Wegmarkeringen — bedrijfssite",
    description:
      "Diensten, projectreferenties, offerte-aanvraag. Schoon, technisch, vertrouwen-wekkend voor B2B-klanten.",
    url: "https://mari-lines.be",
    stack: ["Next.js 16", "Tailwind v4"],
    accent: "#2d3142",
    year: "2026",
    scope: ["Design", "Development", "Offerte-flow"],
    challenge:
      "Een wegmarkering-bedrijf zonder online aanwezigheid, terwijl 80% van de B2B-leads vandaag eerst online zoekt naar 'wie doet dit'.",
    solution:
      "Schone, geloofwaardige B2B-site met diensten, projectreferenties en een offerte-aanvraagformulier. Genoeg om leads te genereren, niet meer dan dat.",
    highlights: [
      "Snelle, vertrouwen-wekkende B2B-positionering",
      "Offerte-formulier naar e-mail",
      "Mobile-first design",
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getOtherProjects(slug: string, count = 3): Project[] {
  return projects.filter((p) => p.slug !== slug).slice(0, count);
}
