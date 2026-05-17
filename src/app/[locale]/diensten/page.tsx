import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Globe,
  ShoppingBag,
  LayoutDashboard,
  ArrowRightLeft,
  Smartphone,
  Languages,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

const icons: LucideIcon[] = [
  Globe,
  ShoppingBag,
  LayoutDashboard,
  ArrowRightLeft,
  Smartphone,
  Languages,
];

type ServiceText = {
  title: string;
  intro: string;
  details: string[];
  pricing: string;
  pricingHref: string;
};

type Copy = {
  metaTitle: string;
  heroEyebrow: string;
  heroTitle: string;
  heroIntro: string;
  services: ServiceText[];
  processEyebrow: string;
  processTitle: string;
  steps: { n: string; title: string; desc: string }[];
  ctaTitle: string;
  ctaButton: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Diensten — Studio VM",
    heroEyebrow: "Diensten",
    heroTitle: "Eén stack. Eén aanspreekpunt. Heel veel modules.",
    heroIntro:
      "Onder de motorkap zit telkens dezelfde technologie — Next.js, Supabase, Tailwind, Vercel. Welke modules jij nodig hebt hangt af van je zaak.",
    services: [
      { title: "Website", intro: "Een snelle, mooie website die echt voor je zaak werkt. Mobile-first, dark mode, SEO-klaar.", details: ["Custom design op jouw merk", "Snelle laadtijden (PageSpeed 95+)", "Native dark mode", "Open Graph + structured data", "Geen onderhoudsdrama achteraf"], pricing: "vanaf €950", pricingHref: "/pricing#starter" },
      { title: "Webshop", intro: "Een eigen verkoopkanaal, geen Etsy/Shopify-marge. Mollie of Stripe, eigen klantportaal, alles van jou.", details: ["Mollie of Stripe checkout", "Producten, varianten, voorraad", "Kortingscodes + gift cards", "Klantportaal met bestellingen", "Bestellingen-admin met facturen"], pricing: "vanaf €3 900", pricingHref: "/pricing#webshop" },
      { title: "Admin op maat", intro: "Een dashboard voor jou en je team. Geen WordPress-plugins die over een jaar breken.", details: ["Login + rollen", "Producten, klanten, content", "Foto-upload met optimalisatie", "Exports naar CSV / Excel", "Werkt op mobiel"], pricing: "in Pro pakket", pricingHref: "/pricing#pro" },
      { title: "Migratie WordPress / Squarespace", intro: "Bestaande site overzetten naar Next.js. Geen SEO-verlies, geen blanco pagina op dag 1.", details: ["Volledige content-import", "Permanente 301-redirects", "Sitemap + structured data overgenomen", "Visuele audit voor live-gang", "Soft launch + monitoring"], pricing: "via de configurator", pricingHref: "/offerte" },
      { title: "Progressive Web App", intro: "Installeerbare web-apps. Werken offline, voelen aan als een echte app, geen App-Store-gedoe.", details: ["Installable op iOS + Android", "Werkt offline", "Push notifications", "Eén codebase voor web + app", "Auto-updates"], pricing: "module in Pro", pricingHref: "/pricing#pro" },
      { title: "Tweetalig (NL / FR / EN)", intro: "Voor wie buiten Vlaanderen klanten wil bereiken. Vertaalbare content, SEO per taal.", details: ["Volledig vertaalde routes", "Taalkeuze in header", "SEO-tags per taal", "Admin om vertalingen te beheren", "Auto-detect browser-taal"], pricing: "module in Pro", pricingHref: "/pricing#pro" },
    ],
    processEyebrow: "Hoe ik werk",
    processTitle: "Vijf stappen, zonder verrassingen",
    steps: [
      { n: "01", title: "Kennismaking", desc: "Vrijblijvend gesprek (digitaal of bij jou). Wat heb je, wat wil je, wat budget. Duurt ~45 min." },
      { n: "02", title: "Scope + offerte", desc: "Schriftelijk wat ik bouw, wat ik niet bouw, wat 't kost en wanneer 't klaar is. Geen verrassingen." },
      { n: "03", title: "Design", desc: "Eerste klikbare versie binnen 2 weken. Iteratief, jouw input op elke stap." },
      { n: "04", title: "Development", desc: "Build van de site + admin. Tussentijdse demo's. Zelf testen op een staging-omgeving." },
      { n: "05", title: "Lancering + nazorg", desc: "Launch + 30 dagen gratis bug-fix. Daarna loopt je verplichte onderhoudsabonnement (Care/Plus/Scale/Partner) — vanaf maand 1." },
    ],
    ctaTitle: "Klaar om te beginnen?",
    ctaButton: "Stel je pakket samen",
  },
  fr: {
    metaTitle: "Services — Studio VM",
    heroEyebrow: "Services",
    heroTitle: "Une stack. Un interlocuteur. Beaucoup de modules.",
    heroIntro:
      "Sous le capot, toujours la même technologie — Next.js, Supabase, Tailwind, Vercel. Les modules dont vous avez besoin dépendent de votre activité.",
    services: [
      { title: "Site web", intro: "Un site rapide et soigné qui travaille vraiment pour votre activité. Mobile-first, dark mode, prêt pour le SEO.", details: ["Design propre à votre marque", "Temps de chargement rapides (PageSpeed 95+)", "Dark mode natif", "Open Graph + données structurées", "Pas de drame de maintenance après"], pricing: "dès €950", pricingHref: "/pricing#starter" },
      { title: "Boutique", intro: "Votre propre canal de vente, sans marge Etsy/Shopify. Mollie ou Stripe, espace client propre, tout à vous.", details: ["Checkout Mollie ou Stripe", "Produits, variantes, stock", "Codes promo + cartes-cadeaux", "Espace client avec commandes", "Admin commandes avec factures"], pricing: "dès €3 900", pricingHref: "/pricing#webshop" },
      { title: "Admin sur mesure", intro: "Un tableau de bord pour vous et votre équipe. Pas de plugins WordPress qui cassent dans un an.", details: ["Connexion + rôles", "Produits, clients, contenu", "Upload photos avec optimisation", "Exports CSV / Excel", "Fonctionne sur mobile"], pricing: "dans le forfait Pro", pricingHref: "/pricing#pro" },
      { title: "Migration WordPress / Squarespace", intro: "Transférer un site existant vers Next.js. Sans perte de SEO, sans page blanche au jour 1.", details: ["Import complet du contenu", "Redirections 301 permanentes", "Sitemap + données structurées repris", "Audit visuel avant mise en ligne", "Soft launch + monitoring"], pricing: "via le configurateur", pricingHref: "/offerte" },
      { title: "Progressive Web App", intro: "Apps web installables. Fonctionnent hors ligne, comme une vraie app, sans App-Store.", details: ["Installable sur iOS + Android", "Fonctionne hors ligne", "Notifications push", "Une codebase pour web + app", "Mises à jour automatiques"], pricing: "module dans Pro", pricingHref: "/pricing#pro" },
      { title: "Bilingue (NL / FR / EN)", intro: "Pour atteindre des clients au-delà de la Flandre. Contenu traduisible, SEO par langue.", details: ["Routes entièrement traduites", "Choix de langue dans le header", "Balises SEO par langue", "Admin pour gérer les traductions", "Détection auto de la langue"], pricing: "module dans Pro", pricingHref: "/pricing#pro" },
    ],
    processEyebrow: "Comment je travaille",
    processTitle: "Cinq étapes, sans surprises",
    steps: [
      { n: "01", title: "Rencontre", desc: "Entretien sans engagement (en ligne ou chez vous). Ce que vous avez, ce que vous voulez, le budget. ~45 min." },
      { n: "02", title: "Périmètre + devis", desc: "Par écrit ce que je construis, ce que je ne construis pas, le prix et le délai. Pas de surprises." },
      { n: "03", title: "Design", desc: "Première version cliquable sous 2 semaines. Itératif, votre avis à chaque étape." },
      { n: "04", title: "Développement", desc: "Build du site + admin. Démos intermédiaires. Tests sur un environnement de staging." },
      { n: "05", title: "Lancement + suivi", desc: "Lancement + 30 jours de correction de bugs gratuite. Ensuite votre abonnement de maintenance obligatoire (Care/Plus/Scale/Partner) — dès le 1er mois." },
    ],
    ctaTitle: "Prêt à commencer ?",
    ctaButton: "Composez votre forfait",
  },
  en: {
    metaTitle: "Services — Studio VM",
    heroEyebrow: "Services",
    heroTitle: "One stack. One point of contact. Lots of modules.",
    heroIntro:
      "Under the hood it's always the same technology — Next.js, Supabase, Tailwind, Vercel. Which modules you need depends on your business.",
    services: [
      { title: "Website", intro: "A fast, polished website that truly works for your business. Mobile-first, dark mode, SEO-ready.", details: ["Custom design on your brand", "Fast load times (PageSpeed 95+)", "Native dark mode", "Open Graph + structured data", "No maintenance drama afterwards"], pricing: "from €950", pricingHref: "/pricing#starter" },
      { title: "Webshop", intro: "Your own sales channel, no Etsy/Shopify margin. Mollie or Stripe, own customer portal, all yours.", details: ["Mollie or Stripe checkout", "Products, variants, stock", "Discount codes + gift cards", "Customer portal with orders", "Orders admin with invoices"], pricing: "from €3,900", pricingHref: "/pricing#webshop" },
      { title: "Custom admin", intro: "A dashboard for you and your team. No WordPress plugins that break in a year.", details: ["Login + roles", "Products, clients, content", "Photo upload with optimization", "Exports to CSV / Excel", "Works on mobile"], pricing: "in Pro package", pricingHref: "/pricing#pro" },
      { title: "WordPress / Squarespace migration", intro: "Move an existing site to Next.js. No SEO loss, no blank page on day 1.", details: ["Full content import", "Permanent 301 redirects", "Sitemap + structured data carried over", "Visual audit before go-live", "Soft launch + monitoring"], pricing: "via the configurator", pricingHref: "/offerte" },
      { title: "Progressive Web App", intro: "Installable web apps. Work offline, feel like a real app, no App Store hassle.", details: ["Installable on iOS + Android", "Works offline", "Push notifications", "One codebase for web + app", "Auto-updates"], pricing: "module in Pro", pricingHref: "/pricing#pro" },
      { title: "Multilingual (NL / FR / EN)", intro: "For reaching clients beyond Flanders. Translatable content, per-language SEO.", details: ["Fully translated routes", "Language switcher in header", "SEO tags per language", "Admin to manage translations", "Auto-detect browser language"], pricing: "module in Pro", pricingHref: "/pricing#pro" },
    ],
    processEyebrow: "How I work",
    processTitle: "Five steps, no surprises",
    steps: [
      { n: "01", title: "First meeting", desc: "Non-binding chat (online or at your place). What you have, what you want, the budget. ~45 min." },
      { n: "02", title: "Scope + quote", desc: "In writing what I build, what I don't, what it costs and when it's ready. No surprises." },
      { n: "03", title: "Design", desc: "First clickable version within 2 weeks. Iterative, your input at every step." },
      { n: "04", title: "Development", desc: "Build of the site + admin. Interim demos. Test it yourself on a staging environment." },
      { n: "05", title: "Launch + aftercare", desc: "Launch + 30 days free bug fixing. Then your mandatory maintenance subscription (Care/Plus/Scale/Partner) — from month 1." },
    ],
    ctaTitle: "Ready to start?",
    ctaButton: "Build your package",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { title: copy[locale].metaTitle };
}

export default async function DienstenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.heroEyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {c.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {c.heroIntro}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {c.services.map((s, i) => {
              const Icon = icons[i];
              return (
                <article key={s.title} className="flex flex-col bg-card p-8">
                  <Icon className="h-8 w-8 text-accent" strokeWidth={1.5} />
                  <h2 className="mt-5 text-xl font-semibold tracking-tight">
                    {s.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{s.intro}</p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {s.details.map((d) => (
                      <li key={d} className="flex gap-2 text-muted">
                        <span className="text-accent">·</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <span className="font-mono text-xs text-muted">{s.pricing}</span>
                    <Link
                      href={localePath(locale, s.pricingHref)}
                      className="font-mono text-xs text-accent transition-opacity hover:opacity-80"
                    >
                      →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {c.processEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {c.processTitle}
            </h2>
          </div>
          <ol className="space-y-6">
            {c.steps.map((s) => (
              <li
                key={s.n}
                className="flex gap-6 rounded-2xl border bg-background p-6"
              >
                <span className="font-mono text-2xl font-semibold text-accent">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.ctaTitle}
          </h2>
          <Link
            href={localePath(locale, "/offerte")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {c.ctaButton}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}
