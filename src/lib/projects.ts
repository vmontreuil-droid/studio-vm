import type { Locale } from "@/lib/i18n/config";

type ProjectContent = {
  tagline: string;
  description: string;
  scope: string[];
  challenge: string;
  solution: string;
  highlights: string[];
};

export type ProjectBase = {
  slug: string;
  name: string;
  url: string | null;
  stack: string[];
  accent: string;
  year: string;
  content: Record<Locale, ProjectContent>;
};

export type Project = Omit<ProjectBase, "content"> &
  ProjectContent & { image?: string };

// Slugs met een gecureerde screenshot in public/werk/<slug>.webp.
// Voeg de slug hier toe zodra je het bestand hebt geplaatst → kaart toont
// de voorpagina; anders blijft de kleurband (nette fallback).
const WITH_SHOT = new Set<string>([
  // "cottage-waregem", "barbotte", "celine-interieur", ...
]);
function shot(slug: string): string | undefined {
  return WITH_SHOT.has(slug) ? `/werk/${slug}.webp` : undefined;
}

const base: ProjectBase[] = [
  {
    slug: "cottage-waregem",
    name: "Cottage Waregem",
    url: "https://cottage-waregem.be",
    stack: ["Next.js 16", "Tailwind v4", "Supabase"],
    accent: "#7c3a2e",
    year: "2026",
    content: {
      nl: {
        tagline: "Restaurant — Waregem",
        description:
          "Migratie van Squarespace naar Next.js. Reservaties, menukaart per seizoen, vacaturepagina, Open Graph cards. Sneller en goedkoper te onderhouden.",
        scope: ["Strategie", "Design", "Development", "Migratie", "SEO"],
        challenge:
          "Squarespace was traag, duur en moeilijk te wijzigen. De menukaart aanpassen voor een nieuw seizoen was telkens een gedoe, en mobiele bezoekers haakten af.",
        solution:
          "Volledige rebuild in Next.js met een eigen admin voor menu, vacatures en openingsuren. Alle bestaande content overgezet met permanente redirects om SEO te bewaren. Open Graph cards voor mooie deellinks.",
        highlights: [
          "Van traag Squarespace naar near-instant laadtijd",
          "Menukaart aanpassen: van gedoe naar enkele minuten",
          "Vacatures inclusief NL/FR mailflow",
        ],
      },
      fr: {
        tagline: "Restaurant — Waregem",
        description:
          "Migration de Squarespace vers Next.js. Réservations, carte saisonnière, page d'emplois, cartes Open Graph. Plus rapide et moins cher à entretenir.",
        scope: ["Stratégie", "Design", "Développement", "Migration", "SEO"],
        challenge:
          "Squarespace était lent, cher et difficile à modifier. Adapter la carte pour une nouvelle saison était à chaque fois une corvée, et les visiteurs mobiles décrochaient.",
        solution:
          "Reconstruction complète en Next.js avec un admin sur mesure pour la carte, les emplois et les heures d'ouverture. Tout le contenu existant transféré avec des redirections permanentes pour préserver le SEO. Cartes Open Graph pour de beaux liens partagés.",
        highlights: [
          "De Squarespace lent à un chargement quasi instantané",
          "Modifier la carte : de la corvée à quelques minutes",
          "Emplois avec flux e-mail NL/FR",
        ],
      },
      en: {
        tagline: "Restaurant — Waregem",
        description:
          "Migration from Squarespace to Next.js. Reservations, seasonal menu, jobs page, Open Graph cards. Faster and cheaper to maintain.",
        scope: ["Strategy", "Design", "Development", "Migration", "SEO"],
        challenge:
          "Squarespace was slow, expensive and hard to change. Updating the menu for a new season was always a hassle, and mobile visitors bounced.",
        solution:
          "Full rebuild in Next.js with a custom admin for menu, jobs and opening hours. All existing content migrated with permanent redirects to preserve SEO. Open Graph cards for clean shareable links.",
        highlights: [
          "From slow Squarespace to near-instant load",
          "Editing the menu: from a chore to a few minutes",
          "Jobs with NL/FR email flow",
        ],
      },
    },
  },
  {
    slug: "barbotte",
    name: "Bar'Botte",
    url: "https://barbotte.be",
    stack: ["Next.js 16", "Tailwind v4", "Supabase", "i18n"],
    accent: "#1f4e3d",
    year: "2026",
    content: {
      nl: {
        tagline: "Bistro — Brussel",
        description:
          "Tweetalige (NL/FR) restaurantsite met menu en reservaties. Kleinste zus-zaak van Cottage, eigen identiteit.",
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
      fr: {
        tagline: "Bistro — Bruxelles",
        description:
          "Site de restaurant bilingue (NL/FR) avec carte et réservations. Petite sœur de Cottage, identité propre.",
        scope: ["Design", "Développement", "i18n NL/FR", "Réservations"],
        challenge:
          "Le public bruxellois est à la fois NL et FR. L'ancien site n'était qu'en néerlandais et ratait une grande partie du quartier.",
        solution:
          "Site entièrement bilingue avec choix de langue, admin partagé avec Cottage (même cuisine, identité différente), et un formulaire de réservation qui écrit directement à l'établissement.",
        highlights: [
          "Traductions NL/FR via admin partagé",
          "Identité propre, backend partagé",
          "Réservations confirmées sous un jour",
        ],
      },
      en: {
        tagline: "Bistro — Brussels",
        description:
          "Bilingual (NL/FR) restaurant site with menu and reservations. Cottage's little sister, its own identity.",
        scope: ["Design", "Development", "i18n NL/FR", "Reservations"],
        challenge:
          "The Brussels audience is both NL and FR. The previous site was Dutch-only and missed a large part of the neighbourhood.",
        solution:
          "Fully bilingual site with language switching, shared admin with Cottage (same kitchen, different identity), and a reservation form that emails the venue directly.",
        highlights: [
          "NL/FR translations via shared admin",
          "Own identity, shared backend",
          "Reservations confirmed within a day",
        ],
      },
    },
  },
  {
    slug: "celine-interieur",
    name: "Céline Intérieur",
    url: "https://celine-interieur.vercel.app",
    stack: ["Next.js 16", "Supabase", "PWA", "Tailwind v4"],
    accent: "#a8763e",
    year: "2025–2026",
    content: {
      nl: {
        tagline: "Interieurstyling — West-Vlaanderen",
        description:
          "Portfolio + admin als drie aparte PWA's: shop, werven en verhuur. Foto's, klanten, offertes, alles in één plek.",
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
      fr: {
        tagline: "Décoration d'intérieur — Flandre-Occidentale",
        description:
          "Portfolio + admin sous forme de trois PWA distinctes : boutique, chantiers et location. Photos, clients, devis, tout au même endroit.",
        scope: ["Design", "Développement", "PWA × 3", "Admin", "Boutique"],
        challenge:
          "Trois flux d'activité très différents : une boutique déco, des chantiers et de la location. Un seul admin créait trop de bruit, trois outils séparés coûtaient trop cher.",
        solution:
          "Une base Supabase, trois PWA installables avec chacune leur icône. Céline travaille depuis son téléphone, les clients ne voient que la partie publique.",
        highlights: [
          "3 PWA installables (Boutique, Chantiers, Location)",
          "Photos, clients, devis au même endroit",
          "Fonctionne hors ligne sur le chantier",
        ],
      },
      en: {
        tagline: "Interior styling — West Flanders",
        description:
          "Portfolio + admin as three separate PWAs: shop, projects and rental. Photos, clients, quotes, all in one place.",
        scope: ["Design", "Development", "PWA × 3", "Admin", "Shop"],
        challenge:
          "Three very different business streams: an interior shop, project sites and rental. One admin was too noisy, three separate tools too expensive.",
        solution:
          "One Supabase database, three installable PWAs each with their own icons. Céline works from her phone, clients only see the public side.",
        highlights: [
          "3 installable PWAs (Shop, Projects, Rental)",
          "Photos, clients, quotes in one place",
          "Works offline on site",
        ],
      },
    },
  },
  {
    slug: "allardphilippe",
    name: "Allard Philippe",
    // Domein nog niet live (project draait op Vercel) — externe link uit tot
    // de juiste URL bekend is, zodat er geen kapotte link op het portfolio staat.
    url: null,
    stack: ["Next.js 16", "Supabase", "Mollie", "Resend", "i18n"],
    accent: "#3a4a5c",
    year: "2025–2026",
    content: {
      nl: {
        tagline: "Wildlife fotografie — webshop",
        description:
          "Volledige webshop voor fine-art prints. Mollie betalingen, gift cards, kortingscodes, newsletter, klantenportaal. NL/FR.",
        scope: ["Design", "Development", "Webshop", "i18n NL/FR", "Newsletter", "Klantportaal"],
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
      fr: {
        tagline: "Photographie animalière — boutique",
        description:
          "Boutique complète pour tirages fine-art. Paiements Mollie, cartes-cadeaux, codes promo, newsletter, espace client. NL/FR.",
        scope: ["Design", "Développement", "Boutique", "i18n NL/FR", "Newsletter", "Espace client"],
        challenge:
          "Photographe animalier avec des tirages fine-art. Voulait depuis des années une vraie boutique, mais Etsy/Instagram prenaient trop de marge et ne renvoyaient aucune donnée client.",
        solution:
          "Boutique Mollie propre avec espace client, cartes-cadeaux et codes promo. Newsletter intégrée avec suivi des ouvertures/clics. NL/FR pour le public flamand comme wallon.",
        highlights: [
          "Paiements Mollie + cartes-cadeaux",
          "Newsletter avec suivi",
          "Espace client pour les commandes",
        ],
      },
      en: {
        tagline: "Wildlife photography — webshop",
        description:
          "Full webshop for fine-art prints. Mollie payments, gift cards, discount codes, newsletter, customer portal. NL/FR.",
        scope: ["Design", "Development", "Webshop", "i18n NL/FR", "Newsletter", "Customer portal"],
        challenge:
          "Wildlife photographer with fine-art prints. Wanted a real shop for years, but Etsy/Instagram took too much margin and returned no customer data.",
        solution:
          "Own Mollie webshop with customer portal, gift cards and discount codes. Newsletter built in with open/click tracking. NL/FR for both Flemish and Walloon audiences.",
        highlights: [
          "Mollie payments + gift cards",
          "Newsletter with tracking",
          "Customer portal for orders",
        ],
      },
    },
  },
  {
    slug: "jp-montreuil",
    name: "JP Montreuil",
    url: "https://jp.montreuil.be",
    stack: ["Next.js 16", "Supabase", "i18n"],
    accent: "#5b3a52",
    year: "2026",
    content: {
      nl: {
        tagline: "Atelier kunstenaar",
        description:
          "WordPress-site herbouwd in Next.js + Supabase admin. Tentoonstellingen, galerij per album, ibook, alles beheerbaar.",
        scope: ["Design", "Development", "Migratie WordPress", "Admin", "i18n NL/FR"],
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
      fr: {
        tagline: "Atelier d'artiste",
        description:
          "Site WordPress reconstruit en Next.js + admin Supabase. Expositions, galerie par album, ibook, tout gérable.",
        scope: ["Design", "Développement", "Migration WordPress", "Admin", "i18n NL/FR"],
        challenge:
          "WordPress avec trop de plugins et trop lent, et l'artiste voulait pouvoir ajouter expositions + galeries lui-même sans appeler un développeur.",
        solution:
          "Reconstruction complète en Next.js + admin Supabase. Expositions, albums par galerie et un module ibook. Entièrement traduisible NL/FR.",
        highlights: [
          "Admin propre pour les expositions",
          "Albums avec tri drag-drop",
          "Module ibook pour publications",
        ],
      },
      en: {
        tagline: "Artist studio",
        description:
          "WordPress site rebuilt in Next.js + Supabase admin. Exhibitions, gallery per album, ibook, all manageable.",
        scope: ["Design", "Development", "WordPress migration", "Admin", "i18n NL/FR"],
        challenge:
          "WordPress with too many plugins and too slow, and the artist wanted to add exhibitions + galleries himself without calling a developer.",
        solution:
          "Full rebuild in Next.js + Supabase admin. Exhibitions, albums per gallery and an ibook module. Fully translatable NL/FR.",
        highlights: [
          "Own admin for exhibitions",
          "Albums with drag-drop sort",
          "ibook module for publications",
        ],
      },
    },
  },
  {
    slug: "mari-lines",
    name: "Mari Lines",
    url: "https://mari-lines.be",
    stack: ["Next.js 16", "Tailwind v4"],
    accent: "#2d3142",
    year: "2026",
    content: {
      nl: {
        tagline: "Wegmarkeringen — bedrijfssite",
        description:
          "Diensten, projectreferenties, offerte-aanvraag. Schoon, technisch, vertrouwen-wekkend voor B2B-klanten.",
        scope: ["Design", "Development", "Offerte-flow"],
        challenge:
          "Een wegmarkering-bedrijf zonder online aanwezigheid, terwijl het gros van de B2B-leads vandaag eerst online zoekt naar 'wie doet dit'.",
        solution:
          "Schone, geloofwaardige B2B-site met diensten, projectreferenties en een offerte-aanvraagformulier. Genoeg om leads te genereren, niet meer dan dat.",
        highlights: [
          "Snelle, vertrouwen-wekkende B2B-positionering",
          "Offerte-formulier naar e-mail",
          "Mobile-first design",
        ],
      },
      fr: {
        tagline: "Marquage routier — site d'entreprise",
        description:
          "Services, références de projets, demande de devis. Propre, technique, rassurant pour les clients B2B.",
        scope: ["Design", "Développement", "Flux de devis"],
        challenge:
          "Une entreprise de marquage routier sans présence en ligne, alors que la plupart des leads B2B cherchent aujourd'hui d'abord en ligne « qui fait ça ».",
        solution:
          "Site B2B propre et crédible avec services, références de projets et un formulaire de demande de devis. Assez pour générer des leads, pas plus.",
        highlights: [
          "Positionnement B2B rapide et rassurant",
          "Formulaire de devis vers e-mail",
          "Design mobile-first",
        ],
      },
      en: {
        tagline: "Road marking — company site",
        description:
          "Services, project references, quote request. Clean, technical, trust-building for B2B clients.",
        scope: ["Design", "Development", "Quote flow"],
        challenge:
          "A road-marking company with no online presence, while most B2B leads today first search online for 'who does this'.",
        solution:
          "Clean, credible B2B site with services, project references and a quote request form. Enough to generate leads, no more than that.",
        highlights: [
          "Fast, trust-building B2B positioning",
          "Quote form to email",
          "Mobile-first design",
        ],
      },
    },
  },
];

export function getProjects(locale: Locale): Project[] {
  return base.map(({ content, ...rest }) => ({
    ...rest,
    ...content[locale],
    image: shot(rest.slug),
  }));
}

export function getProjectBySlug(slug: string, locale: Locale): Project | undefined {
  const p = base.find((x) => x.slug === slug);
  if (!p) return undefined;
  const { content, ...rest } = p;
  return { ...rest, ...content[locale], image: shot(rest.slug) };
}

export function getOtherProjects(
  slug: string,
  locale: Locale,
  count = 3,
): Project[] {
  return getProjects(locale)
    .filter((p) => p.slug !== slug)
    .slice(0, count);
}

export const projectSlugs = base.map((p) => p.slug);
