import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, MapPin, ArrowRight, Quote } from "lucide-react";
import { getProjects } from "@/lib/projects";
import { getCapabilities } from "@/lib/capabilities";
import { getTestimonials } from "@/lib/testimonials";
import { ProjectCard } from "@/components/project-card";
import { ContactForm } from "@/components/contact-form";
import { RotatingHeadline } from "@/components/rotating-headline";
import { CtaBanner } from "@/components/cta-banner";
import { getMessages } from "@/lib/i18n";
import { getCapacity } from "@/lib/now-db";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { Sparkles, Search, MousePointerClick, ShieldCheck, Rocket } from "lucide-react";

const X: Record<
  Locale,
  {
    outcome: string[];
    riskEyebrow: string;
    riskTitle: string;
    riskIntro: string;
    risk: { t: string; d: string; href: string; cta: string }[];
    werkEyebrow: string;
    werkTitle: string;
    werkIntro: string;
  }
> = {
  nl: {
    outcome: [
      "Volledig herbouwd in 1–2 weken",
      "Code + eigen admin van jou",
      "Geen code-lock-in — je bezit code + data",
    ],
    riskEyebrow: "Zonder risico",
    riskTitle: "Eerst zien, dan beslissen",
    riskIntro:
      "Je hoeft niets blind te tekenen. Test eerst, in je eigen tempo — pas als het klopt, gaan we verder.",
    risk: [
      { t: "Gratis site-scan", d: "Eerlijk rapport van je huidige site — snelheid, SEO, valkuilen. Geen account, geen verkooptrechter.", href: "/scan", cta: "Scan mijn site" },
      { t: "Bouw zelf je voorontwerp", d: "Klik je site in elkaar in de builder — pagina's, secties, je eigen teksten. Ik werk 'm daarna af.", href: "/builder", cta: "Open de builder" },
      { t: "Alles blijft van jou", d: "Code én eigen admin in jouw handen. Geen lock-in op je code — je bezit alles wat ik oplever.", href: "/offerte", cta: "Stel je pakket samen" },
      { t: "Live in 1–2 weken", d: "Strak herbouwd in Next.js + Supabase. Timing hangt enkel af van domeinvrijgave en fotomateriaal.", href: "/aanpak", cta: "Zo werk ik" },
    ],
    werkEyebrow: "Realisaties",
    werkTitle: "Échte, live sites — geen mockups",
    werkIntro:
      "Geen verzonnen showcase. Dit zijn projecten die vandaag draaien voor echte ondernemers. Klik door en zie het zelf.",
  },
  fr: {
    outcome: [
      "Entièrement reconstruit en 1–2 semaines",
      "Code + admin propre à vous",
      "Pas de lock-in sur le code — vous possédez code + data",
    ],
    riskEyebrow: "Sans risque",
    riskTitle: "D'abord voir, puis décider",
    riskIntro:
      "Rien à signer à l'aveugle. Testez d'abord, à votre rythme — on continue seulement quand ça colle.",
    risk: [
      { t: "Scan gratuit du site", d: "Rapport honnête de votre site actuel — vitesse, SEO, pièges. Sans compte, sans entonnoir de vente.", href: "/scan", cta: "Scanner mon site" },
      { t: "Construisez votre maquette", d: "Composez votre site dans le builder — pages, sections, vos textes. Je le finalise ensuite.", href: "/builder", cta: "Ouvrir le builder" },
      { t: "Tout reste à vous", d: "Le code et un admin propre entre vos mains. Pas de lock-in sur le code — vous possédez tout ce que je livre.", href: "/offerte", cta: "Composez votre forfait" },
      { t: "En ligne en 1–2 semaines", d: "Reconstruit proprement en Next.js + Supabase. Le délai dépend juste du domaine et des photos.", href: "/aanpak", cta: "Ma méthode" },
    ],
    werkEyebrow: "Réalisations",
    werkTitle: "De vrais sites en ligne — pas des maquettes",
    werkIntro:
      "Pas de vitrine inventée. Des projets qui tournent aujourd'hui pour de vrais entrepreneurs. Cliquez et voyez.",
  },
  en: {
    outcome: [
      "Fully rebuilt in 1–2 weeks",
      "Code + own admin, yours",
      "No code lock-in — you own code + data",
    ],
    riskEyebrow: "Zero risk",
    riskTitle: "See it first, then decide",
    riskIntro:
      "Nothing to sign blind. Try it first, at your own pace — we only continue when it fits.",
    risk: [
      { t: "Free site scan", d: "Honest report on your current site — speed, SEO, pitfalls. No account, no sales funnel.", href: "/scan", cta: "Scan my site" },
      { t: "Build your own draft", d: "Click your site together in the builder — pages, sections, your own copy. I finish it.", href: "/builder", cta: "Open the builder" },
      { t: "It all stays yours", d: "Code and an own admin in your hands. No code lock-in — you own everything I deliver.", href: "/offerte", cta: "Build your package" },
      { t: "Live in 1–2 weeks", d: "Cleanly rebuilt in Next.js + Supabase. Timing only depends on domain release and photos.", href: "/aanpak", cta: "How I work" },
    ],
    werkEyebrow: "Work",
    werkTitle: "Real, live sites — no mockups",
    werkIntro:
      "No invented showcase. Projects running today for real businesses. Click through and see for yourself.",
  },
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = getMessages(locale);
  const x = X[locale];
  const capacity = await getCapacity(locale);

  return (
    <main>
      <Hero locale={locale} t={t} x={x} capacity={capacity} />
      <Stats t={t} />
      <Werk locale={locale} t={t} x={x} />
      <RiskReversal locale={locale} x={x} />
      <Testimonials t={t} locale={locale} />
      <Mogelijkheden t={t} locale={locale} />
      <CtaBanner
        locale={locale}
        eyebrow={t.ctaBanner.eyebrow}
        title={t.ctaBanner.title}
        sub={t.ctaBanner.sub}
        button={t.ctaBanner.button}
      />
      <Contact t={t} />
    </main>
  );
}

type T = ReturnType<typeof getMessages>;

type Xt = (typeof X)[Locale];

function Hero({
  locale,
  t,
  x,
  capacity,
}: {
  locale: Locale;
  t: T;
  x: Xt;
  capacity: string;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b">
      <div aria-hidden className="hero-backdrop">
        <div className="hero-grid" />
        <div className="hero-blob hero-blob-a" />
        <div className="hero-blob hero-blob-b" />
        <div className="hero-blob hero-blob-c" />
        <div className="hero-blob hero-blob-d" />
        <div className="hero-blob hero-blob-e" />
        <div className="hero-sweep" />
        <div className="hero-sweep hero-sweep-rev" />
        <div className="hero-sweep hero-sweep-down" />
        <div className="hero-sweep hero-sweep-up" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
          {t.hero.eyebrow}
        </p>
        <RotatingHeadline
          titles={t.hero.titles}
          subtitles={t.hero.subtitles}
          className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl"
          subtitleClassName="mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl"
        />
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {x.outcome.map((o) => (
            <li
              key={o}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <ShieldCheck
                className="h-4 w-4 text-accent"
                strokeWidth={2}
              />
              {o}
            </li>
          ))}
        </ul>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          {capacity}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={localePath(locale, "/offerte")}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {locale === "fr"
              ? "Composez votre forfait"
              : locale === "en"
                ? "Build your package"
                : "Stel je pakket samen"}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <Link
            href={localePath(locale, "/pricing")}
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            {t.hero.ctaPricing}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <a
            href="#werk"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            {t.hero.ctaWerk}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      </div>
    </section>
  );
}

function Stats({ t }: { t: T }) {
  const stats = [
    { value: "14+", label: t.stats.projects },
    { value: "3", label: t.stats.languages },
    { value: "100", label: t.stats.pagespeed },
    { value: "100%", label: t.stats.stack },
    { value: "99.9%", label: t.stats.uptime },
    { value: "8", label: t.stats.ervaring },
    { value: "< 1d", label: t.stats.respons },
    { value: "0", label: t.stats.plugins },
  ];
  return (
    <section className="reveal-on-scroll border-b bg-card">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-6 py-8 text-center">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {s.label}
              </dt>
              <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Werk({ locale, t, x }: { locale: Locale; t: T; x: Xt }) {
  void t;
  return (
    <section id="werk" className="reveal-on-scroll border-b">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {x.werkEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {x.werkTitle}
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted">{x.werkIntro}</p>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2">
          {getProjects(locale).map((p) => (
            <ProjectCard key={p.slug} project={p} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RiskReversal({ locale, x }: { locale: Locale; x: Xt }) {
  const icons = [Search, MousePointerClick, ShieldCheck, Rocket];
  return (
    <section className="reveal-on-scroll border-b bg-card">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            {x.riskEyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {x.riskTitle}
          </h2>
          <p className="mt-4 text-muted">{x.riskIntro}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {x.risk.map((r, i) => {
            const Icon = icons[i] ?? Sparkles;
            return (
              <div
                key={r.t}
                className="flex flex-col rounded-2xl border bg-background p-6"
              >
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                <h3 className="mt-4 font-semibold tracking-tight">{r.t}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {r.d}
                </p>
                <Link
                  href={localePath(locale, r.href)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  {r.cta}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ t, locale }: { t: T; locale: Locale }) {
  const items = getTestimonials(locale);
  if (items.length === 0) return null;
  return (
    <section className="reveal-on-scroll border-b bg-card">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            {t.testimonials.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.testimonials.title}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((tm) => (
            <figure
              key={tm.author}
              className="flex h-full flex-col rounded-2xl border bg-background p-6"
            >
              <Quote className="h-5 w-5 text-accent" strokeWidth={1.5} />
              <blockquote className="mt-4 flex-1 leading-relaxed">
                "{tm.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t pt-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 font-mono text-xs font-semibold text-accent">
                  {tm.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold">{tm.author}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {tm.role}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Mogelijkheden({ t, locale }: { t: T; locale: Locale }) {
  return (
    <section id="mogelijkheden" className="reveal-on-scroll border-b bg-card">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mb-16 max-w-2xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            {t.mogelijkheden.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.mogelijkheden.title}
          </h2>
          <p className="mt-6 text-muted">{t.mogelijkheden.intro}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {getCapabilities(locale).map((c) => (
            <Link
              key={c.slug}
              href={localePath(locale, `/mogelijkheden/${c.slug}`)}
              className="group rounded-2xl border bg-background p-6 transition-colors hover:bg-card-hover"
            >
              <c.icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
              <h3 className="mt-4 flex items-center gap-1.5 font-semibold tracking-tight">
                {c.title}
                <ArrowRight
                  className="h-4 w-4 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                  strokeWidth={2}
                />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {c.description}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href={localePath(locale, "/mogelijkheden")}
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            {locale === "fr"
              ? "Toutes les capacités en détail"
              : locale === "en"
                ? "All capabilities in detail"
                : "Alle mogelijkheden in detail"}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Contact({ t }: { t: T }) {
  return (
    <section id="contact" className="reveal-on-scroll border-b">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {t.contact.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.contact.title}
            </h2>
            <p className="mt-6 max-w-xl text-muted">{t.contact.intro}</p>
            <div className="mt-8 space-y-3">
              <a
                href="mailto:info@studio-vm.be"
                className="flex items-center gap-3 text-sm transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4 text-accent" strokeWidth={1.5} />
                info@studio-vm.be
              </a>
              <a
                href="tel:+32477995651"
                className="flex items-center gap-3 text-sm transition-colors hover:text-accent"
              >
                <Phone className="h-4 w-4 text-accent" strokeWidth={1.5} />
                +32 477 99 56 51
              </a>
              <p className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-accent" strokeWidth={1.5} />
                {t.contact.location}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
