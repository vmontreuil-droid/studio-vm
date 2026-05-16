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
      { slug: "onepager", name: "One-pager", tagline: "Klein beginnen", price: "€ 750", priceNote: "eenmalig, excl. btw", features: ["1 sterke pagina (alles op één scroll)", "Maatwerk-design in jouw stijl", "Mobile + dark mode inbegrepen", "Contactformulier inbegrepen", "Teksten / copywriting inbegrepen", "Cookiebanner & GDPR inbegrepen", "1 extra taal inbegrepen", "Extra ronde aanpassingen inbegrepen", "Care-abonnement verplicht (€ 49/maand, vanaf maand 1)"], ctaLabel: "Start gesprek", ctaHref: "/#contact" },
      { slug: "starter", name: "Starter", tagline: "Voor wie net begint", price: "€ 1 250", priceNote: "eenmalig, excl. btw", features: ["Tot 5 pagina's", "Maatwerk-design in jouw stijl", "Eigen admin / CMS inbegrepen", "Mobile + dark mode inbegrepen", "Contactformulier + teksten inbegrepen", "2 extra talen inbegrepen", "Cookiebanner & GDPR inbegrepen", "Blog / nieuws-CMS inbegrepen", "Extra ronde aanpassingen inbegrepen", "Care-abonnement verplicht (€ 49/maand, vanaf maand 1)"], ctaLabel: "Start gesprek", ctaHref: "/#contact" },
      { slug: "pro", name: "Pro", tagline: "Meest gekozen", price: "€ 1 900", priceNote: "eenmalig, excl. btw", features: ["Tot 15 pagina's", "Alles van Starter — meertalig inbegrepen", "SEO-behoud bij migratie inbegrepen", "SEO + sitemap + Open Graph inbegrepen", "Newsletter signup inbegrepen", "Structured data + analytics inbegrepen", "Reservatie / afspraken inbegrepen", "Ledenzone inbegrepen", "Formulieren + opvolging inbegrepen", "2 rondes aanpassingen", "Plus-abonnement verplicht (€ 149/maand, vanaf maand 1)"], highlighted: true, ctaLabel: "Start gesprek", ctaHref: "/#contact" },
      { slug: "webshop", name: "Webshop", tagline: "Voor verkoop online", price: "vanaf € 3 900", priceNote: "eenmalig, excl. btw", features: ["Alles van Pro inbegrepen", "Volledige webshop met Mollie of Stripe", "Voorraad, kortingscodes, gift cards", "Klantportaal voor bestellingen", "Bestellingen-admin met facturen", "Tot 100 producten inbegrepen", "Plus-abonnement verplicht (€ 149/maand, vanaf maand 1)"], ctaLabel: "Bespreek shop", ctaHref: "/#contact" },
      { slug: "custom", name: "Custom", tagline: "Op maat", price: "op aanvraag", priceNote: "scope-afhankelijk", features: ["Multi-app systemen", "Integraties (boekhouding, CRM, ERP)", "Migratie van WordPress/Squarespace", "Custom admin workflows", "Booking-systemen, ticketing, ...", "Wat je ook nodig hebt"], ctaLabel: "Praat met me", ctaHref: "/#contact" },
    ],
    subscription: [
      { slug: "care", name: "Care", tagline: "Wij houden 't draaiend", price: "€ 49", priceNote: "per maand, excl. btw", features: ["Hosting (Vercel + Supabase)", "SSL + automatische backups", "Security updates", "1u support per maand", "Maandelijkse uptime-rapport"], ctaLabel: "Start abonnement", ctaHref: "/#contact" },
      { slug: "plus", name: "Plus", tagline: "Meest gekozen", price: "€ 149", priceNote: "per maand, excl. btw", features: ["Alles van Care", "Tot 4u support per maand", "Content-updates door mij", "Performance + SEO rapport", "Reactie binnen 1 werkdag"], highlighted: true, ctaLabel: "Start abonnement", ctaHref: "/#contact" },
      { slug: "scale", name: "Scale", tagline: "Voor wie blijft groeien", price: "€ 399", priceNote: "per maand, excl. btw", features: ["Alles van Plus", "Onbeperkt support", "5u nieuwe features per maand", "Prioriteit reactie binnen 4u", "Strategie-call elke maand"], ctaLabel: "Start abonnement", ctaHref: "/#contact" },
      { slug: "partner", name: "Partner", tagline: "Vaste digitale partner", price: "€ 799", priceNote: "per maand, excl. btw", features: ["Alles van Scale", "Onbeperkte support én ontwikkeling", "Wekelijkse vooruitgang", "Eigen roadmap & prioriteiten", "Ik als vast aanspreekpunt"], ctaLabel: "Start abonnement", ctaHref: "/#contact" },
    ],
    addons: [
      { name: "Extra taal", price: "€ 75", desc: "Volledige extra taal, nette switch + hreflang voor SEO." },
      { name: "Formulieren + opvolging", price: "€ 100", desc: "Contact/offerte met spamfilter en mailopvolging." },
      { name: "Reservatie / afspraken", price: "€ 200", desc: "Boekingsmodule met agenda en bevestigingsmails." },
      { name: "Blog / nieuws-CMS", price: "€ 125", desc: "Eigen redactie-omgeving voor artikels." },
      { name: "Ledenzone", price: "€ 175", desc: "Afgeschermd gedeelte met logins en rollen." },
      { name: "SEO-behoud bij migratie", price: "€ 95", desc: "Volledig 301-plan zodat je Google-posities meeverhuizen." },
      { name: "Fotoshoot", price: "€ 450", desc: "Halve dag professionele shoot, bewerkt en webklaar." },
      { name: "Cookiebanner & GDPR", price: "€ 65", desc: "Consent-banner die scripts pas na toestemming laadt — boetevrij." },
      { name: "Teksten / copywriting", price: "€ 145", desc: "Professionele, SEO-bewuste webteksten voor je pagina's." },
      { name: "Contactformulier", price: "€ 0", desc: "Contactformulier met spamfilter — standaard inbegrepen in elk pakket." },
      { name: "Admin / CMS", price: "€ 450", desc: "Eigen beheeromgeving om teksten, beelden en pagina's zelf te wijzigen — geen factuur per aanpassing." },
      { name: "Mobile + dark mode", price: "€ 150", desc: "Volledig responsief, met automatische licht/donker-modus." },
      { name: "SEO + sitemap + Open Graph", price: "€ 115", desc: "Technische SEO-basis, sitemap en nette social-previews." },
      { name: "Structured data + analytics", price: "€ 350", desc: "Schema.org-data en privacyvriendelijke analytics." },
      { name: "Newsletter signup", price: "€ 135", desc: "Inschrijfveld gekoppeld aan je mailinglijst." },
      { name: "Extra ronde aanpassingen", price: "€ 200", desc: "Bijkomende revisieronde na oplevering." },
      { name: "Integratie Mollie / Stripe", price: "€ 275", desc: "Online betalen met Mollie of Stripe, volledig ingericht." },
    ],
  },
  fr: {
    oneShot: [
      { slug: "onepager", name: "One-pager", tagline: "Commencer petit", price: "€ 750", priceNote: "unique, HTVA", features: ["1 page forte (tout en un scroll)", "Design sur mesure à votre image", "Mobile + dark mode inclus", "Formulaire de contact inclus", "Textes / rédaction inclus", "Bannière cookies & RGPD incluse", "1 langue supplémentaire incluse", "Tour de modifications supplémentaire inclus", "Abonnement Care obligatoire (€ 49/mois, dès le 1er mois)"], ctaLabel: "Démarrer", ctaHref: "/#contact" },
      { slug: "starter", name: "Starter", tagline: "Pour bien démarrer", price: "€ 1 250", priceNote: "unique, HTVA", features: ["Jusqu'à 5 pages", "Design sur mesure à votre image", "Admin / CMS inclus", "Mobile + dark mode inclus", "Formulaire de contact + textes inclus", "2 langues supplémentaires incluses", "Bannière cookies & RGPD incluse", "CMS blog / actus inclus", "Tour de modifications supplémentaire inclus", "Abonnement Care obligatoire (€ 49/mois, dès le 1er mois)"], ctaLabel: "Démarrer", ctaHref: "/#contact" },
      { slug: "pro", name: "Pro", tagline: "Le plus choisi", price: "€ 1 900", priceNote: "unique, HTVA", features: ["Jusqu'à 15 pages", "Tout de Starter — multilingue inclus", "Préservation SEO (migration) incluse", "SEO + sitemap + Open Graph inclus", "Inscription newsletter incluse", "Données structurées + analytics inclus", "Réservation / rendez-vous inclus", "Espace membres inclus", "Formulaires + suivi inclus", "2 tours de modifications", "Abonnement Plus obligatoire (€ 149/mois, dès le 1er mois)"], highlighted: true, ctaLabel: "Démarrer", ctaHref: "/#contact" },
      { slug: "webshop", name: "Boutique", tagline: "Pour vendre en ligne", price: "dès € 3 900", priceNote: "unique, HTVA", features: ["Tout de Pro inclus", "Boutique complète avec Mollie ou Stripe", "Stock, codes promo, cartes-cadeaux", "Espace client pour les commandes", "Admin commandes avec factures", "Jusqu'à 100 produits inclus", "Abonnement Plus obligatoire (€ 149/mois, dès le 1er mois)"], ctaLabel: "Discuter boutique", ctaHref: "/#contact" },
      { slug: "custom", name: "Sur mesure", tagline: "Personnalisé", price: "sur demande", priceNote: "selon le scope", features: ["Systèmes multi-apps", "Intégrations (compta, CRM, ERP)", "Migration WordPress/Squarespace", "Workflows admin personnalisés", "Systèmes de réservation, ticketing, ...", "Tout ce dont vous avez besoin"], ctaLabel: "Discutons-en", ctaHref: "/#contact" },
    ],
    subscription: [
      { slug: "care", name: "Care", tagline: "On garde tout en marche", price: "€ 49", priceNote: "par mois, HTVA", features: ["Hébergement (Vercel + Supabase)", "SSL + sauvegardes automatiques", "Mises à jour de sécurité", "1h de support par mois", "Rapport uptime mensuel"], ctaLabel: "S'abonner", ctaHref: "/#contact" },
      { slug: "plus", name: "Plus", tagline: "Le plus choisi", price: "€ 149", priceNote: "par mois, HTVA", features: ["Tout de Care", "Jusqu'à 4h de support par mois", "Mises à jour de contenu par moi", "Rapport performance + SEO", "Réponse sous 1 jour ouvré"], highlighted: true, ctaLabel: "S'abonner", ctaHref: "/#contact" },
      { slug: "scale", name: "Scale", tagline: "Pour ceux qui grandissent", price: "€ 399", priceNote: "par mois, HTVA", features: ["Tout de Plus", "Support illimité", "5h de nouvelles fonctions par mois", "Réponse prioritaire sous 4h", "Appel stratégie chaque mois"], ctaLabel: "S'abonner", ctaHref: "/#contact" },
      { slug: "partner", name: "Partner", tagline: "Partenaire digital fixe", price: "€ 799", priceNote: "par mois, HTVA", features: ["Tout de Scale", "Support et développement illimités", "Avancement hebdomadaire", "Roadmap & priorités propres", "Moi comme interlocuteur fixe"], ctaLabel: "S'abonner", ctaHref: "/#contact" },
    ],
    addons: [
      { name: "Langue supplémentaire", price: "€ 75", desc: "Langue complète en plus, bascule propre + hreflang SEO." },
      { name: "Formulaires + suivi", price: "€ 100", desc: "Contact/devis avec anti-spam et suivi mail." },
      { name: "Réservation / rendez-vous", price: "€ 200", desc: "Module de réservation avec agenda et confirmations." },
      { name: "CMS blog / actus", price: "€ 125", desc: "Environnement de rédaction propre pour les articles." },
      { name: "Espace membres", price: "€ 175", desc: "Zone protégée avec logins et rôles." },
      { name: "Préservation SEO (migration)", price: "€ 95", desc: "Plan 301 complet pour conserver vos positions Google." },
      { name: "Shooting photo", price: "€ 450", desc: "Demi-journée de shooting pro, retouché et prêt web." },
      { name: "Bannière cookies & RGPD", price: "€ 65", desc: "Bannière de consentement qui ne charge les scripts qu'après accord." },
      { name: "Textes / rédaction", price: "€ 145", desc: "Textes web professionnels et optimisés SEO pour vos pages." },
      { name: "Formulaire de contact", price: "€ 0", desc: "Formulaire de contact anti-spam — inclus dans chaque forfait." },
      { name: "Admin / CMS", price: "€ 450", desc: "Votre espace de gestion pour modifier textes, images et pages vous-même." },
      { name: "Mobile + dark mode", price: "€ 150", desc: "Entièrement responsive, avec mode clair/sombre automatique." },
      { name: "SEO + sitemap + Open Graph", price: "€ 115", desc: "Base SEO technique, sitemap et aperçus sociaux soignés." },
      { name: "Données structurées + analytics", price: "€ 350", desc: "Données Schema.org et analytics respectueux de la vie privée." },
      { name: "Inscription newsletter", price: "€ 135", desc: "Champ d'inscription lié à votre liste de diffusion." },
      { name: "Tour de modifications supplémentaire", price: "€ 200", desc: "Cycle de révision additionnel après livraison." },
      { name: "Intégration Mollie / Stripe", price: "€ 275", desc: "Paiement en ligne avec Mollie ou Stripe, entièrement configuré." },
    ],
  },
  en: {
    oneShot: [
      { slug: "onepager", name: "One-pager", tagline: "Start small", price: "€ 750", priceNote: "one-off, excl. VAT", features: ["1 strong page (all on one scroll)", "Bespoke design in your style", "Mobile + dark mode included", "Contact form included", "Copywriting / texts included", "Cookie & GDPR banner included", "1 extra language included", "Extra revision round included", "Care subscription required (€ 49/month, from month 1)"], ctaLabel: "Start a chat", ctaHref: "/#contact" },
      { slug: "starter", name: "Starter", tagline: "For getting started", price: "€ 1,250", priceNote: "one-off, excl. VAT", features: ["Up to 5 pages", "Bespoke design in your style", "Own admin / CMS included", "Mobile + dark mode included", "Contact form + texts included", "2 extra languages included", "Cookie & GDPR banner included", "Blog / news CMS included", "Extra revision round included", "Care subscription required (€ 49/month, from month 1)"], ctaLabel: "Start a chat", ctaHref: "/#contact" },
      { slug: "pro", name: "Pro", tagline: "Most chosen", price: "€ 1,900", priceNote: "one-off, excl. VAT", features: ["Up to 15 pages", "Everything in Starter — multilingual included", "SEO migration safeguard included", "SEO + sitemap + Open Graph included", "Newsletter signup included", "Structured data + analytics included", "Booking / appointments included", "Members area included", "Forms + follow-up included", "2 rounds of revisions", "Plus subscription required (€ 149/month, from month 1)"], highlighted: true, ctaLabel: "Start a chat", ctaHref: "/#contact" },
      { slug: "webshop", name: "Webshop", tagline: "For selling online", price: "from € 3,900", priceNote: "one-off, excl. VAT", features: ["Everything in Pro included", "Full webshop with Mollie or Stripe", "Stock, discount codes, gift cards", "Customer portal for orders", "Orders admin with invoices", "Up to 100 products included", "Plus subscription required (€ 149/month, from month 1)"], ctaLabel: "Discuss a shop", ctaHref: "/#contact" },
      { slug: "custom", name: "Custom", tagline: "Tailor-made", price: "on request", priceNote: "scope-dependent", features: ["Multi-app systems", "Integrations (accounting, CRM, ERP)", "WordPress/Squarespace migration", "Custom admin workflows", "Booking systems, ticketing, ...", "Whatever you need"], ctaLabel: "Let's talk", ctaHref: "/#contact" },
    ],
    subscription: [
      { slug: "care", name: "Care", tagline: "We keep it running", price: "€ 49", priceNote: "per month, excl. VAT", features: ["Hosting (Vercel + Supabase)", "SSL + automatic backups", "Security updates", "1h support per month", "Monthly uptime report"], ctaLabel: "Subscribe", ctaHref: "/#contact" },
      { slug: "plus", name: "Plus", tagline: "Most chosen", price: "€ 149", priceNote: "per month, excl. VAT", features: ["Everything in Care", "Up to 4h support per month", "Content updates by me", "Performance + SEO report", "Reply within 1 working day"], highlighted: true, ctaLabel: "Subscribe", ctaHref: "/#contact" },
      { slug: "scale", name: "Scale", tagline: "For those who keep growing", price: "€ 399", priceNote: "per month, excl. VAT", features: ["Everything in Plus", "Unlimited support", "5h new features per month", "Priority reply within 4h", "Strategy call every month"], ctaLabel: "Subscribe", ctaHref: "/#contact" },
      { slug: "partner", name: "Partner", tagline: "Dedicated digital partner", price: "€ 799", priceNote: "per month, excl. VAT", features: ["Everything in Scale", "Unlimited support and development", "Weekly progress", "Own roadmap & priorities", "Me as fixed point of contact"], ctaLabel: "Subscribe", ctaHref: "/#contact" },
    ],
    addons: [
      { name: "Extra language", price: "€ 75", desc: "Full extra language, clean switch + hreflang for SEO." },
      { name: "Forms + follow-up", price: "€ 100", desc: "Contact/quote with spam filter and mail follow-up." },
      { name: "Booking / appointments", price: "€ 200", desc: "Booking module with calendar and confirmations." },
      { name: "Blog / news CMS", price: "€ 125", desc: "Own editorial environment for articles." },
      { name: "Member area", price: "€ 175", desc: "Gated section with logins and roles." },
      { name: "SEO preservation (migration)", price: "€ 95", desc: "Full 301 plan so your Google rankings move with you." },
      { name: "Photo shoot", price: "€ 450", desc: "Half-day professional shoot, edited and web-ready." },
      { name: "Cookie banner & GDPR", price: "€ 65", desc: "Consent banner that loads scripts only after approval — fine-free." },
      { name: "Copywriting / texts", price: "€ 145", desc: "Professional, SEO-aware web copy for your pages." },
      { name: "Contact form", price: "€ 0", desc: "Anti-spam contact form — included in every package." },
      { name: "Admin / CMS", price: "€ 450", desc: "Your own admin to edit texts, images and pages yourself." },
      { name: "Mobile + dark mode", price: "€ 150", desc: "Fully responsive, with automatic light/dark mode." },
      { name: "SEO + sitemap + Open Graph", price: "€ 115", desc: "Technical SEO base, sitemap and clean social previews." },
      { name: "Structured data + analytics", price: "€ 350", desc: "Schema.org data and privacy-friendly analytics." },
      { name: "Newsletter signup", price: "€ 135", desc: "Signup field connected to your mailing list." },
      { name: "Extra revision round", price: "€ 200", desc: "Additional revision cycle after delivery." },
      { name: "Mollie / Stripe integration", price: "€ 275", desc: "Online payments with Mollie or Stripe, fully set up." },
    ],
  },
};

export function getPricing(locale: Locale): Bundle {
  return data[locale];
}

// --- Offerte-bouwer (admin): prijzen als centen, NL-catalogus ---
export function priceToCents(s: string): number {
  // "€ 1 250" / "vanaf € 3 900" -> 125000 / 390000
  const m = s.replace(/\s/g, "").match(/(\d+)/g);
  if (!m) return 0;
  return parseInt(m.join(""), 10) * 100;
}

export type CatalogItem = {
  key: string;
  slug?: string;
  name: string;
  cents: number;
  desc?: string;
};

export function offerCatalog(): {
  bases: CatalogItem[];
  addons: CatalogItem[];
  subs: CatalogItem[];
} {
  const nl = data.nl;
  const bases = nl.oneShot
    .filter((t) => t.slug !== "custom")
    .map((t) => ({
      key: `base:${t.slug}`,
      slug: t.slug,
      name: `${t.name} — ${t.tagline}`,
      cents: priceToCents(t.price),
    }));
  const subs = nl.subscription.map((t) => ({
    key: `sub:${t.slug}`,
    slug: t.slug,
    name: `Abonnement ${t.name} (${t.price}/maand)`,
    cents: 0,
    desc: t.features.join(" · "),
  }));
  const addons = nl.addons.map((a, i) => ({
    key: `addon:${i}`,
    name: a.name,
    cents: priceToCents(a.price),
    desc: a.desc,
  }));
  return { bases, addons, subs };
}

// Wat zit standaard in welk pakket (inbegrepen → € 0 op de offerte).
// addons: exacte namen uit data.nl.addons. sub: bijhorend abonnement.
export const OFFER_INCLUDED: Record<
  string,
  { addons: string[]; sub: "care" | "plus"; lang: string }
> = {
  onepager: {
    addons: [
      "Teksten / copywriting",
      "Cookiebanner & GDPR",
      "Contactformulier",
      "Extra taal",
      "Mobile + dark mode",
      "Extra ronde aanpassingen",
    ],
    sub: "care",
    lang: "incl. 1 extra taal",
  },
  starter: {
    addons: [
      "Teksten / copywriting",
      "Cookiebanner & GDPR",
      "Contactformulier",
      "Extra taal",
      "Mobile + dark mode",
      "Extra ronde aanpassingen",
      "Admin / CMS",
      "Blog / nieuws-CMS",
    ],
    sub: "care",
    lang: "incl. 2 extra talen",
  },
  pro: {
    addons: [
      "Teksten / copywriting",
      "Cookiebanner & GDPR",
      "Contactformulier",
      "Extra taal",
      "Mobile + dark mode",
      "Extra ronde aanpassingen",
      "Admin / CMS",
      "Blog / nieuws-CMS",
      "SEO-behoud bij migratie",
      "SEO + sitemap + Open Graph",
      "Newsletter signup",
      "Structured data + analytics",
      "Reservatie / afspraken",
      "Ledenzone",
      "Formulieren + opvolging",
    ],
    sub: "plus",
    lang: "meertalig inbegrepen",
  },
  webshop: {
    addons: [
      "Teksten / copywriting",
      "Cookiebanner & GDPR",
      "Contactformulier",
      "Extra taal",
      "Mobile + dark mode",
      "Extra ronde aanpassingen",
      "Admin / CMS",
      "Blog / nieuws-CMS",
      "SEO-behoud bij migratie",
      "SEO + sitemap + Open Graph",
      "Newsletter signup",
      "Structured data + analytics",
      "Reservatie / afspraken",
      "Ledenzone",
      "Formulieren + opvolging",
      "Integratie Mollie / Stripe",
    ],
    sub: "plus",
    lang: "alles inbegrepen",
  },
};
