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

export type Addon = { name: string; price: string; desc: string };

type Bundle = {
  oneShot: PricingTier[];
  subscription: PricingTier[];
  addons: Addon[];
};

const data: Record<Locale, Bundle> = {
  nl: {
    oneShot: [
      { slug: "onepager", name: "One-pager", tagline: "Klein beginnen", price: "€ 550", priceNote: "eenmalig, excl. btw", features: ["1 sterke pagina (alles op één scroll)", "Eigen design op jouw merk", "Mobile + dark mode", "Contactformulier", "SEO-basis + Open Graph"], ctaLabel: "Start gesprek", ctaHref: "/#contact" },
      { slug: "starter", name: "Starter", tagline: "Voor wie net begint", price: "€ 950", priceNote: "eenmalig, excl. btw", features: ["Tot 5 pagina's", "Eigen design op jouw merk", "Mobile + dark mode", "Contactformulier", "SEO + sitemap + Open Graph", "1 ronde aanpassingen"], ctaLabel: "Start gesprek", ctaHref: "/#contact" },
      { slug: "pro", name: "Pro", tagline: "Meest gekozen", price: "€ 1 900", priceNote: "eenmalig, excl. btw", features: ["Tot 15 pagina's", "Tweetalig (NL/FR of NL/EN)", "Eigen admin om content te wijzigen", "Newsletter signup", "Structured data + analytics", "2 rondes aanpassingen"], highlighted: true, ctaLabel: "Start gesprek", ctaHref: "/#contact" },
      { slug: "webshop", name: "Webshop", tagline: "Voor verkoop online", price: "vanaf € 3 900", priceNote: "eenmalig, excl. btw", features: ["Alles van Pro", "Volledige webshop met Mollie of Stripe", "Voorraad, kortingscodes, gift cards", "Klantportaal voor bestellingen", "Bestellingen-admin met facturen", "Tot 100 producten inbegrepen"], ctaLabel: "Bespreek shop", ctaHref: "/#contact" },
      { slug: "custom", name: "Custom", tagline: "Op maat", price: "op aanvraag", priceNote: "scope-afhankelijk", features: ["Multi-app systemen", "Integraties (boekhouding, CRM, ERP)", "Migratie van WordPress/Squarespace", "Custom admin workflows", "Booking-systemen, ticketing, ...", "Wat je ook nodig hebt"], ctaLabel: "Praat met me", ctaHref: "/#contact" },
    ],
    subscription: [
      { slug: "basis", name: "Basis", tagline: "Veilig & online", price: "€ 19", priceNote: "per maand, excl. btw", features: ["Hosting (Vercel + Supabase)", "SSL-certificaat", "Automatische backups", "Uptime-monitoring"], ctaLabel: "Start abonnement", ctaHref: "/#contact" },
      { slug: "care", name: "Care", tagline: "Wij houden 't draaiend", price: "€ 49", priceNote: "per maand, excl. btw", features: ["Hosting (Vercel + Supabase)", "SSL + automatische backups", "Security updates", "1u support per maand", "Maandelijkse uptime-rapport"], ctaLabel: "Start abonnement", ctaHref: "/#contact" },
      { slug: "plus", name: "Plus", tagline: "Meest gekozen", price: "€ 149", priceNote: "per maand, excl. btw", features: ["Alles van Care", "Tot 4u support per maand", "Content-updates door mij", "Performance + SEO rapport", "Reactie binnen 1 werkdag"], highlighted: true, ctaLabel: "Start abonnement", ctaHref: "/#contact" },
      { slug: "scale", name: "Scale", tagline: "Voor wie blijft groeien", price: "€ 399", priceNote: "per maand, excl. btw", features: ["Alles van Plus", "Onbeperkt support", "5u nieuwe features per maand", "Prioriteit reactie binnen 4u", "Strategie-call elke maand"], ctaLabel: "Start abonnement", ctaHref: "/#contact" },
      { slug: "partner", name: "Partner", tagline: "Vaste digitale partner", price: "€ 799", priceNote: "per maand, excl. btw", features: ["Alles van Scale", "Onbeperkte support én ontwikkeling", "Wekelijkse vooruitgang", "Eigen roadmap & prioriteiten", "Ik als vast aanspreekpunt"], ctaLabel: "Start abonnement", ctaHref: "/#contact" },
    ],
    addons: [
      { name: "Extra taal", price: "€ 350", desc: "Volledige extra taal, nette switch + hreflang voor SEO." },
      { name: "Formulieren + opvolging", price: "€ 200", desc: "Contact/offerte met spamfilter en mailopvolging." },
      { name: "Reservatie / afspraken", price: "€ 600", desc: "Boekingsmodule met agenda en bevestigingsmails." },
      { name: "Blog / nieuws-CMS", price: "€ 350", desc: "Eigen redactie-omgeving voor artikels." },
      { name: "Ledenzone", price: "€ 900", desc: "Afgeschermd gedeelte met logins en rollen." },
      { name: "SEO-behoud bij migratie", price: "€ 250", desc: "Volledig 301-plan zodat je Google-posities meeverhuizen." },
      { name: "Fotoshoot", price: "€ 450", desc: "Halve dag professionele shoot, bewerkt en webklaar." },
      { name: "Cookiebanner & GDPR", price: "€ 150", desc: "Consent-banner die scripts pas na toestemming laadt — boetevrij." },
      { name: "Teksten / copywriting", price: "€ 300", desc: "Professionele, SEO-bewuste webteksten voor je pagina's." },
    ],
  },
  fr: {
    oneShot: [
      { slug: "onepager", name: "One-pager", tagline: "Commencer petit", price: "€ 550", priceNote: "unique, HTVA", features: ["1 page forte (tout en un scroll)", "Design propre à votre marque", "Mobile + dark mode", "Formulaire de contact", "SEO de base + Open Graph"], ctaLabel: "Démarrer", ctaHref: "/#contact" },
      { slug: "starter", name: "Starter", tagline: "Pour bien démarrer", price: "€ 950", priceNote: "unique, HTVA", features: ["Jusqu'à 5 pages", "Design propre à votre marque", "Mobile + dark mode", "Formulaire de contact", "SEO + sitemap + Open Graph", "1 tour de modifications"], ctaLabel: "Démarrer", ctaHref: "/#contact" },
      { slug: "pro", name: "Pro", tagline: "Le plus choisi", price: "€ 1 900", priceNote: "unique, HTVA", features: ["Jusqu'à 15 pages", "Bilingue (NL/FR ou NL/EN)", "Admin propre pour modifier le contenu", "Inscription newsletter", "Données structurées + analytics", "2 tours de modifications"], highlighted: true, ctaLabel: "Démarrer", ctaHref: "/#contact" },
      { slug: "webshop", name: "Boutique", tagline: "Pour vendre en ligne", price: "dès € 3 900", priceNote: "unique, HTVA", features: ["Tout de Pro", "Boutique complète avec Mollie ou Stripe", "Stock, codes promo, cartes-cadeaux", "Espace client pour les commandes", "Admin commandes avec factures", "Jusqu'à 100 produits inclus"], ctaLabel: "Discuter boutique", ctaHref: "/#contact" },
      { slug: "custom", name: "Sur mesure", tagline: "Personnalisé", price: "sur demande", priceNote: "selon le scope", features: ["Systèmes multi-apps", "Intégrations (compta, CRM, ERP)", "Migration WordPress/Squarespace", "Workflows admin personnalisés", "Systèmes de réservation, ticketing, ...", "Tout ce dont vous avez besoin"], ctaLabel: "Discutons-en", ctaHref: "/#contact" },
    ],
    subscription: [
      { slug: "basis", name: "Basis", tagline: "Sûr & en ligne", price: "€ 19", priceNote: "par mois, HTVA", features: ["Hébergement (Vercel + Supabase)", "Certificat SSL", "Sauvegardes automatiques", "Surveillance uptime"], ctaLabel: "S'abonner", ctaHref: "/#contact" },
      { slug: "care", name: "Care", tagline: "On garde tout en marche", price: "€ 49", priceNote: "par mois, HTVA", features: ["Hébergement (Vercel + Supabase)", "SSL + sauvegardes automatiques", "Mises à jour de sécurité", "1h de support par mois", "Rapport uptime mensuel"], ctaLabel: "S'abonner", ctaHref: "/#contact" },
      { slug: "plus", name: "Plus", tagline: "Le plus choisi", price: "€ 149", priceNote: "par mois, HTVA", features: ["Tout de Care", "Jusqu'à 4h de support par mois", "Mises à jour de contenu par moi", "Rapport performance + SEO", "Réponse sous 1 jour ouvré"], highlighted: true, ctaLabel: "S'abonner", ctaHref: "/#contact" },
      { slug: "scale", name: "Scale", tagline: "Pour ceux qui grandissent", price: "€ 399", priceNote: "par mois, HTVA", features: ["Tout de Plus", "Support illimité", "5h de nouvelles fonctions par mois", "Réponse prioritaire sous 4h", "Appel stratégie chaque mois"], ctaLabel: "S'abonner", ctaHref: "/#contact" },
      { slug: "partner", name: "Partner", tagline: "Partenaire digital fixe", price: "€ 799", priceNote: "par mois, HTVA", features: ["Tout de Scale", "Support et développement illimités", "Avancement hebdomadaire", "Roadmap & priorités propres", "Moi comme interlocuteur fixe"], ctaLabel: "S'abonner", ctaHref: "/#contact" },
    ],
    addons: [
      { name: "Langue supplémentaire", price: "€ 350", desc: "Langue complète en plus, bascule propre + hreflang SEO." },
      { name: "Formulaires + suivi", price: "€ 200", desc: "Contact/devis avec anti-spam et suivi mail." },
      { name: "Réservation / rendez-vous", price: "€ 600", desc: "Module de réservation avec agenda et confirmations." },
      { name: "CMS blog / actus", price: "€ 350", desc: "Environnement de rédaction propre pour les articles." },
      { name: "Espace membres", price: "€ 900", desc: "Zone protégée avec logins et rôles." },
      { name: "Préservation SEO (migration)", price: "€ 250", desc: "Plan 301 complet pour conserver vos positions Google." },
      { name: "Shooting photo", price: "€ 450", desc: "Demi-journée de shooting pro, retouché et prêt web." },
      { name: "Bannière cookies & RGPD", price: "€ 150", desc: "Bannière de consentement qui ne charge les scripts qu'après accord." },
      { name: "Textes / rédaction", price: "€ 300", desc: "Textes web professionnels et optimisés SEO pour vos pages." },
    ],
  },
  en: {
    oneShot: [
      { slug: "onepager", name: "One-pager", tagline: "Start small", price: "€ 550", priceNote: "one-off, excl. VAT", features: ["1 strong page (all on one scroll)", "Custom design on your brand", "Mobile + dark mode", "Contact form", "SEO basics + Open Graph"], ctaLabel: "Start a chat", ctaHref: "/#contact" },
      { slug: "starter", name: "Starter", tagline: "For getting started", price: "€ 950", priceNote: "one-off, excl. VAT", features: ["Up to 5 pages", "Custom design on your brand", "Mobile + dark mode", "Contact form", "SEO + sitemap + Open Graph", "1 round of revisions"], ctaLabel: "Start a chat", ctaHref: "/#contact" },
      { slug: "pro", name: "Pro", tagline: "Most chosen", price: "€ 1,900", priceNote: "one-off, excl. VAT", features: ["Up to 15 pages", "Bilingual (NL/FR or NL/EN)", "Own admin to edit content", "Newsletter signup", "Structured data + analytics", "2 rounds of revisions"], highlighted: true, ctaLabel: "Start a chat", ctaHref: "/#contact" },
      { slug: "webshop", name: "Webshop", tagline: "For selling online", price: "from € 3,900", priceNote: "one-off, excl. VAT", features: ["Everything in Pro", "Full webshop with Mollie or Stripe", "Stock, discount codes, gift cards", "Customer portal for orders", "Orders admin with invoices", "Up to 100 products included"], ctaLabel: "Discuss a shop", ctaHref: "/#contact" },
      { slug: "custom", name: "Custom", tagline: "Tailor-made", price: "on request", priceNote: "scope-dependent", features: ["Multi-app systems", "Integrations (accounting, CRM, ERP)", "WordPress/Squarespace migration", "Custom admin workflows", "Booking systems, ticketing, ...", "Whatever you need"], ctaLabel: "Let's talk", ctaHref: "/#contact" },
    ],
    subscription: [
      { slug: "basis", name: "Basis", tagline: "Safe & online", price: "€ 19", priceNote: "per month, excl. VAT", features: ["Hosting (Vercel + Supabase)", "SSL certificate", "Automatic backups", "Uptime monitoring"], ctaLabel: "Subscribe", ctaHref: "/#contact" },
      { slug: "care", name: "Care", tagline: "We keep it running", price: "€ 49", priceNote: "per month, excl. VAT", features: ["Hosting (Vercel + Supabase)", "SSL + automatic backups", "Security updates", "1h support per month", "Monthly uptime report"], ctaLabel: "Subscribe", ctaHref: "/#contact" },
      { slug: "plus", name: "Plus", tagline: "Most chosen", price: "€ 149", priceNote: "per month, excl. VAT", features: ["Everything in Care", "Up to 4h support per month", "Content updates by me", "Performance + SEO report", "Reply within 1 working day"], highlighted: true, ctaLabel: "Subscribe", ctaHref: "/#contact" },
      { slug: "scale", name: "Scale", tagline: "For those who keep growing", price: "€ 399", priceNote: "per month, excl. VAT", features: ["Everything in Plus", "Unlimited support", "5h new features per month", "Priority reply within 4h", "Strategy call every month"], ctaLabel: "Subscribe", ctaHref: "/#contact" },
      { slug: "partner", name: "Partner", tagline: "Dedicated digital partner", price: "€ 799", priceNote: "per month, excl. VAT", features: ["Everything in Scale", "Unlimited support and development", "Weekly progress", "Own roadmap & priorities", "Me as fixed point of contact"], ctaLabel: "Subscribe", ctaHref: "/#contact" },
    ],
    addons: [
      { name: "Extra language", price: "€ 350", desc: "Full extra language, clean switch + hreflang for SEO." },
      { name: "Forms + follow-up", price: "€ 200", desc: "Contact/quote with spam filter and mail follow-up." },
      { name: "Booking / appointments", price: "€ 600", desc: "Booking module with calendar and confirmations." },
      { name: "Blog / news CMS", price: "€ 350", desc: "Own editorial environment for articles." },
      { name: "Member area", price: "€ 900", desc: "Gated section with logins and roles." },
      { name: "SEO preservation (migration)", price: "€ 250", desc: "Full 301 plan so your Google rankings move with you." },
      { name: "Photo shoot", price: "€ 450", desc: "Half-day professional shoot, edited and web-ready." },
      { name: "Cookie banner & GDPR", price: "€ 150", desc: "Consent banner that loads scripts only after approval — fine-free." },
      { name: "Copywriting / texts", price: "€ 300", desc: "Professional, SEO-aware web copy for your pages." },
    ],
  },
};

export function getPricing(locale: Locale): Bundle {
  return data[locale];
}
