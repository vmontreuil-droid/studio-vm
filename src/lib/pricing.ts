import type { Locale } from "@/lib/i18n/config";

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

type Bundle = { oneShot: PricingTier[]; subscription: PricingTier[] };

const data: Record<Locale, Bundle> = {
  nl: {
    oneShot: [
      { slug: "starter", name: "Starter", tagline: "Voor wie net begint", price: "€ 950", priceNote: "eenmalig, excl. btw", features: ["Tot 5 pagina's", "Eigen design op jouw merk", "Mobile + dark mode", "Contactformulier", "SEO + sitemap + Open Graph", "1 ronde aanpassingen"], ctaLabel: "Start gesprek", ctaHref: "/#contact" },
      { slug: "pro", name: "Pro", tagline: "Meest gekozen", price: "€ 1 900", priceNote: "eenmalig, excl. btw", features: ["Tot 15 pagina's", "Tweetalig (NL/FR of NL/EN)", "Eigen admin om content te wijzigen", "Newsletter signup", "Structured data + analytics", "2 rondes aanpassingen"], highlighted: true, ctaLabel: "Start gesprek", ctaHref: "/#contact" },
      { slug: "webshop", name: "Webshop", tagline: "Voor verkoop online", price: "vanaf € 3 900", priceNote: "eenmalig, excl. btw", features: ["Alles van Pro", "Volledige webshop met Mollie of Stripe", "Voorraad, kortingscodes, gift cards", "Klantportaal voor bestellingen", "Bestellingen-admin met facturen", "Tot 100 producten inbegrepen"], ctaLabel: "Bespreek shop", ctaHref: "/#contact" },
      { slug: "custom", name: "Custom", tagline: "Op maat", price: "op aanvraag", priceNote: "scope-afhankelijk", features: ["Multi-app systemen", "Integraties (boekhouding, CRM, ERP)", "Migratie van WordPress/Squarespace", "Custom admin workflows", "Booking-systemen, ticketing, ...", "Wat je ook nodig hebt"], ctaLabel: "Praat met me", ctaHref: "/#contact" },
    ],
    subscription: [
      { slug: "care", name: "Care", tagline: "Wij houden 't draaiend", price: "€ 49", priceNote: "per maand, excl. btw", features: ["Hosting (Vercel + Supabase)", "SSL + automatische backups", "Security updates", "1u support per maand", "Maandelijkse uptime-rapport"], ctaLabel: "Start abonnement", ctaHref: "/#contact" },
      { slug: "plus", name: "Plus", tagline: "Meest gekozen", price: "€ 149", priceNote: "per maand, excl. btw", features: ["Alles van Care", "Tot 4u support per maand", "Content-updates door mij", "Performance + SEO rapport", "Reactie binnen 1 werkdag"], highlighted: true, ctaLabel: "Start abonnement", ctaHref: "/#contact" },
      { slug: "scale", name: "Scale", tagline: "Voor wie blijft groeien", price: "€ 399", priceNote: "per maand, excl. btw", features: ["Alles van Plus", "Onbeperkt support", "5u nieuwe features per maand", "Prioriteit reactie binnen 4u", "Strategie-call elke maand"], ctaLabel: "Start abonnement", ctaHref: "/#contact" },
    ],
  },
  fr: {
    oneShot: [
      { slug: "starter", name: "Starter", tagline: "Pour bien démarrer", price: "€ 950", priceNote: "unique, HTVA", features: ["Jusqu'à 5 pages", "Design propre à votre marque", "Mobile + dark mode", "Formulaire de contact", "SEO + sitemap + Open Graph", "1 tour de modifications"], ctaLabel: "Démarrer", ctaHref: "/#contact" },
      { slug: "pro", name: "Pro", tagline: "Le plus choisi", price: "€ 1 900", priceNote: "unique, HTVA", features: ["Jusqu'à 15 pages", "Bilingue (NL/FR ou NL/EN)", "Admin propre pour modifier le contenu", "Inscription newsletter", "Données structurées + analytics", "2 tours de modifications"], highlighted: true, ctaLabel: "Démarrer", ctaHref: "/#contact" },
      { slug: "webshop", name: "Boutique", tagline: "Pour vendre en ligne", price: "dès € 3 900", priceNote: "unique, HTVA", features: ["Tout de Pro", "Boutique complète avec Mollie ou Stripe", "Stock, codes promo, cartes-cadeaux", "Espace client pour les commandes", "Admin commandes avec factures", "Jusqu'à 100 produits inclus"], ctaLabel: "Discuter boutique", ctaHref: "/#contact" },
      { slug: "custom", name: "Sur mesure", tagline: "Personnalisé", price: "sur demande", priceNote: "selon le scope", features: ["Systèmes multi-apps", "Intégrations (compta, CRM, ERP)", "Migration WordPress/Squarespace", "Workflows admin personnalisés", "Systèmes de réservation, ticketing, ...", "Tout ce dont vous avez besoin"], ctaLabel: "Discutons-en", ctaHref: "/#contact" },
    ],
    subscription: [
      { slug: "care", name: "Care", tagline: "On garde tout en marche", price: "€ 49", priceNote: "par mois, HTVA", features: ["Hébergement (Vercel + Supabase)", "SSL + sauvegardes automatiques", "Mises à jour de sécurité", "1h de support par mois", "Rapport uptime mensuel"], ctaLabel: "S'abonner", ctaHref: "/#contact" },
      { slug: "plus", name: "Plus", tagline: "Le plus choisi", price: "€ 149", priceNote: "par mois, HTVA", features: ["Tout de Care", "Jusqu'à 4h de support par mois", "Mises à jour de contenu par moi", "Rapport performance + SEO", "Réponse sous 1 jour ouvré"], highlighted: true, ctaLabel: "S'abonner", ctaHref: "/#contact" },
      { slug: "scale", name: "Scale", tagline: "Pour ceux qui grandissent", price: "€ 399", priceNote: "par mois, HTVA", features: ["Tout de Plus", "Support illimité", "5h de nouvelles fonctions par mois", "Réponse prioritaire sous 4h", "Appel stratégie chaque mois"], ctaLabel: "S'abonner", ctaHref: "/#contact" },
    ],
  },
  en: {
    oneShot: [
      { slug: "starter", name: "Starter", tagline: "For getting started", price: "€ 950", priceNote: "one-off, excl. VAT", features: ["Up to 5 pages", "Custom design on your brand", "Mobile + dark mode", "Contact form", "SEO + sitemap + Open Graph", "1 round of revisions"], ctaLabel: "Start a chat", ctaHref: "/#contact" },
      { slug: "pro", name: "Pro", tagline: "Most chosen", price: "€ 1,900", priceNote: "one-off, excl. VAT", features: ["Up to 15 pages", "Bilingual (NL/FR or NL/EN)", "Own admin to edit content", "Newsletter signup", "Structured data + analytics", "2 rounds of revisions"], highlighted: true, ctaLabel: "Start a chat", ctaHref: "/#contact" },
      { slug: "webshop", name: "Webshop", tagline: "For selling online", price: "from € 3,900", priceNote: "one-off, excl. VAT", features: ["Everything in Pro", "Full webshop with Mollie or Stripe", "Stock, discount codes, gift cards", "Customer portal for orders", "Orders admin with invoices", "Up to 100 products included"], ctaLabel: "Discuss a shop", ctaHref: "/#contact" },
      { slug: "custom", name: "Custom", tagline: "Tailor-made", price: "on request", priceNote: "scope-dependent", features: ["Multi-app systems", "Integrations (accounting, CRM, ERP)", "WordPress/Squarespace migration", "Custom admin workflows", "Booking systems, ticketing, ...", "Whatever you need"], ctaLabel: "Let's talk", ctaHref: "/#contact" },
    ],
    subscription: [
      { slug: "care", name: "Care", tagline: "We keep it running", price: "€ 49", priceNote: "per month, excl. VAT", features: ["Hosting (Vercel + Supabase)", "SSL + automatic backups", "Security updates", "1h support per month", "Monthly uptime report"], ctaLabel: "Subscribe", ctaHref: "/#contact" },
      { slug: "plus", name: "Plus", tagline: "Most chosen", price: "€ 149", priceNote: "per month, excl. VAT", features: ["Everything in Care", "Up to 4h support per month", "Content updates by me", "Performance + SEO report", "Reply within 1 working day"], highlighted: true, ctaLabel: "Subscribe", ctaHref: "/#contact" },
      { slug: "scale", name: "Scale", tagline: "For those who keep growing", price: "€ 399", priceNote: "per month, excl. VAT", features: ["Everything in Plus", "Unlimited support", "5h new features per month", "Priority reply within 4h", "Strategy call every month"], ctaLabel: "Subscribe", ctaHref: "/#contact" },
    ],
  },
};

export function getPricing(locale: Locale): Bundle {
  return data[locale];
}
