import Link from "next/link";
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Diensten — Studio VM",
  description:
    "Wat ik doe: websites, webshops, admins op maat, migraties, PWA's en tweetalige sites. Eén stack, één aanspreekpunt.",
};

type Service = {
  icon: LucideIcon;
  title: string;
  intro: string;
  details: string[];
  pricing: string;
  pricingHref: string;
};

const services: Service[] = [
  {
    icon: Globe,
    title: "Website",
    intro:
      "Een snelle, mooie website die echt voor je zaak werkt. Mobile-first, dark mode, SEO-klaar.",
    details: [
      "Custom design op jouw merk",
      "Snelle laadtijden (PageSpeed 95+)",
      "Native dark mode",
      "Open Graph + structured data",
      "Geen onderhoudsdrama achteraf",
    ],
    pricing: "vanaf €2 500",
    pricingHref: "/pricing#starter",
  },
  {
    icon: ShoppingBag,
    title: "Webshop",
    intro:
      "Een eigen verkoopkanaal, geen Etsy/Shopify-marge. Mollie of Stripe, eigen klantportaal, alles van jou.",
    details: [
      "Mollie of Stripe checkout",
      "Producten, varianten, voorraad",
      "Kortingscodes + gift cards",
      "Klantportaal met bestellingen",
      "Bestellingen-admin met facturen",
    ],
    pricing: "vanaf €7 500",
    pricingHref: "/pricing#webshop",
  },
  {
    icon: LayoutDashboard,
    title: "Admin op maat",
    intro:
      "Een dashboard voor jou en je team. Geen WordPress-plugins die over een jaar breken.",
    details: [
      "Login + rollen",
      "Producten, klanten, content",
      "Foto-upload met optimalisatie",
      "Exports naar CSV / Excel",
      "Werkt op mobiel",
    ],
    pricing: "in Pro pakket",
    pricingHref: "/pricing#pro",
  },
  {
    icon: ArrowRightLeft,
    title: "Migratie WordPress / Squarespace",
    intro:
      "Bestaande site overzetten naar Next.js. Geen SEO-verlies, geen blanco pagina op dag 1.",
    details: [
      "Volledige content-import",
      "Permanente 301-redirects",
      "Sitemap + structured data overgenomen",
      "Visuele audit voor live-gang",
      "Soft launch + monitoring",
    ],
    pricing: "scope-afhankelijk",
    pricingHref: "/pricing#custom",
  },
  {
    icon: Smartphone,
    title: "Progressive Web App",
    intro:
      "Installeerbare web-apps. Werken offline, voelen aan als een echte app, geen App-Store-gedoe.",
    details: [
      "Installable op iOS + Android",
      "Werkt offline",
      "Push notifications",
      "Eén codebase voor web + app",
      "Auto-updates",
    ],
    pricing: "module in Pro",
    pricingHref: "/pricing#pro",
  },
  {
    icon: Languages,
    title: "Tweetalig (NL / FR / EN)",
    intro:
      "Voor wie buiten Vlaanderen klanten wil bereiken. Vertaalbare content, SEO per taal.",
    details: [
      "Volledig vertaalde routes",
      "Taalkeuze in header",
      "SEO-tags per taal",
      "Admin om vertalingen te beheren",
      "Auto-detect browser-taal",
    ],
    pricing: "module in Pro",
    pricingHref: "/pricing#pro",
  },
];

export default function DienstenPage() {
  return (
    <main>
      <Hero />
      <ServicesGrid />
      <ProcessSection />
      <ClosingCTA />
    </main>
  );
}

function Hero() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
          Diensten
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Eén stack. Eén aanspreekpunt. Heel veel modules.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Onder de motorkap zit telkens dezelfde technologie — Next.js, Supabase,
          Tailwind, Vercel. Welke modules jij nodig hebt hangt af van je zaak.
        </p>
      </div>
    </section>
  );
}

function ServicesGrid() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article key={s.title} className="flex flex-col bg-card p-8">
              <s.icon className="h-8 w-8 text-accent" strokeWidth={1.5} />
              <h2 className="mt-5 text-xl font-semibold tracking-tight">{s.title}</h2>
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
                  href={s.pricingHref}
                  className="font-mono text-xs text-accent transition-opacity hover:opacity-80"
                >
                  Bekijk →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "01",
    title: "Kennismaking",
    desc: "Vrijblijvend gesprek (digitaal of bij jou). Wat heb je, wat wil je, wat budget. Duurt ~45 min.",
  },
  {
    n: "02",
    title: "Scope + offerte",
    desc: "Schriftelijk wat ik bouw, wat ik niet bouw, wat 't kost en wanneer 't klaar is. Geen verrassingen.",
  },
  {
    n: "03",
    title: "Design",
    desc: "Eerste klikbare versie binnen 2 weken. Iteratief, jouw input op elke stap.",
  },
  {
    n: "04",
    title: "Development",
    desc: "Build van de site + admin. Tussentijdse demo's. Zelf testen op een staging-omgeving.",
  },
  {
    n: "05",
    title: "Lancering + nazorg",
    desc: "Launch + 30 dagen gratis bug-fix. Daarna optioneel een Care/Plus/Scale abonnement.",
  },
];

function ProcessSection() {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            Hoe ik werk
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Vijf stappen, zonder verrassingen
          </h2>
        </div>
        <ol className="space-y-6">
          {steps.map((s) => (
            <li
              key={s.n}
              className="flex gap-6 rounded-2xl border bg-background p-6"
            >
              <span className="font-mono text-2xl font-semibold text-accent">{s.n}</span>
              <div>
                <h3 className="font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Klaar om te beginnen?
        </h2>
        <Link
          href="/#contact"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Plan een gesprek
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
