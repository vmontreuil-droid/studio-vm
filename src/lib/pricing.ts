export type PricingTier = {
  slug: string;
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
  ctaHref: string;
};

export const oneShotTiers: PricingTier[] = [
  {
    slug: "starter",
    name: "Starter",
    tagline: "Voor wie net begint",
    price: "€ 2 500",
    priceNote: "eenmalig, excl. btw",
    features: [
      "Tot 5 pagina's",
      "Eigen design op jouw merk",
      "Mobile + dark mode",
      "Contactformulier",
      "SEO + sitemap + Open Graph",
      "1 ronde aanpassingen",
    ],
    ctaLabel: "Start gesprek",
    ctaHref: "/#contact",
  },
  {
    slug: "pro",
    name: "Pro",
    tagline: "Meest gekozen",
    price: "€ 4 500",
    priceNote: "eenmalig, excl. btw",
    features: [
      "Tot 15 pagina's",
      "Tweetalig (NL/FR of NL/EN)",
      "Eigen admin om content te wijzigen",
      "Newsletter signup",
      "Structured data + analytics",
      "2 rondes aanpassingen",
    ],
    highlighted: true,
    ctaLabel: "Start gesprek",
    ctaHref: "/#contact",
  },
  {
    slug: "webshop",
    name: "Webshop",
    tagline: "Voor verkoop online",
    price: "vanaf € 7 500",
    priceNote: "eenmalig, excl. btw",
    features: [
      "Alles van Pro",
      "Volledige webshop met Mollie of Stripe",
      "Voorraad, kortingscodes, gift cards",
      "Klantportaal voor bestellingen",
      "Bestellingen-admin met facturen",
      "Tot 100 producten inbegrepen",
    ],
    ctaLabel: "Bespreek shop",
    ctaHref: "/#contact",
  },
  {
    slug: "custom",
    name: "Custom",
    tagline: "Op maat",
    price: "op aanvraag",
    priceNote: "scope-afhankelijk",
    features: [
      "Multi-app systemen",
      "Integraties (boekhouding, CRM, ERP)",
      "Migratie van WordPress/Squarespace",
      "Custom admin workflows",
      "Booking-systemen, ticketing, ...",
      "Wat je ook nodig hebt",
    ],
    ctaLabel: "Praat met me",
    ctaHref: "/#contact",
  },
];

export const subscriptionTiers: PricingTier[] = [
  {
    slug: "care",
    name: "Care",
    tagline: "Wij houden 't draaiend",
    price: "€ 49",
    priceNote: "per maand, excl. btw",
    features: [
      "Hosting (Vercel + Supabase)",
      "SSL + automatische backups",
      "Security updates",
      "1u support per maand",
      "Maandelijkse uptime-rapport",
    ],
    ctaLabel: "Start abonnement",
    ctaHref: "/#contact",
  },
  {
    slug: "plus",
    name: "Plus",
    tagline: "Meest gekozen",
    price: "€ 149",
    priceNote: "per maand, excl. btw",
    features: [
      "Alles van Care",
      "Tot 4u support per maand",
      "Content-updates door mij",
      "Performance + SEO rapport",
      "Reactie binnen 1 werkdag",
    ],
    highlighted: true,
    ctaLabel: "Start abonnement",
    ctaHref: "/#contact",
  },
  {
    slug: "scale",
    name: "Scale",
    tagline: "Voor wie blijft groeien",
    price: "€ 399",
    priceNote: "per maand, excl. btw",
    features: [
      "Alles van Plus",
      "Onbeperkt support",
      "5u nieuwe features per maand",
      "Prioriteit reactie binnen 4u",
      "Strategie-call elke maand",
    ],
    ctaLabel: "Start abonnement",
    ctaHref: "/#contact",
  },
];
