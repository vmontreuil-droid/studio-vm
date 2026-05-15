import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import {
  capabilitySlugs,
  getCapabilityDetail,
  getCapabilityDetails,
} from "@/lib/capabilities";
import { getProjectBySlug } from "@/lib/projects";
import {
  BreadcrumbJsonLd,
  FaqJsonLd,
  ServiceJsonLd,
} from "@/components/json-ld";
import { LoadingRace } from "@/components/loading-race";
import { BeforeAfter } from "@/components/before-after";
import {
  LOCALES,
  isValidLocale,
  localePath,
  type Locale,
} from "@/lib/i18n/config";

type Params = { locale: string; slug: string };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    capabilitySlugs.map((slug) => ({ locale, slug })),
  );
}

const ui: Record<
  Locale,
  {
    back: string;
    whatYouGet: string;
    howItWorks: string;
    examples: string;
    faq: string;
    more: string;
    pricingCta: string;
    talk: string;
  }
> = {
  nl: {
    back: "Alle mogelijkheden",
    whatYouGet: "Wat je krijgt",
    howItWorks: "Hoe het werkt",
    examples: "In de praktijk",
    faq: "Veelgestelde vragen",
    more: "Andere mogelijkheden",
    pricingCta: "Bekijk de pakketten",
    talk: "Praat met me",
  },
  fr: {
    back: "Toutes les capacités",
    whatYouGet: "Ce que vous obtenez",
    howItWorks: "Comment ça marche",
    examples: "En pratique",
    faq: "Questions fréquentes",
    more: "Autres capacités",
    pricingCta: "Voir les forfaits",
    talk: "Discutons-en",
  },
  en: {
    back: "All capabilities",
    whatYouGet: "What you get",
    howItWorks: "How it works",
    examples: "In practice",
    faq: "Frequently asked questions",
    more: "Other capabilities",
    pricingCta: "See the packages",
    talk: "Let's talk",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const d = getCapabilityDetail(slug, locale);
  if (!d) return {};
  return {
    title: `${d.title} — Studio VM`,
    description: d.heroIntro,
    openGraph: { title: `${d.title} — Studio VM`, description: d.heroIntro },
  };
}

export default async function CapabilityDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();
  const d = getCapabilityDetail(slug, locale);
  if (!d) notFound();
  const t = ui[locale];
  const Icon = d.icon;
  const others = getCapabilityDetails(locale)
    .filter((c) => c.slug !== slug)
    .slice(0, 3);

  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: "Studio VM", url: `https://studio-vm.be/${locale}` },
          {
            name: "Mogelijkheden",
            url: `https://studio-vm.be/${locale}/mogelijkheden`,
          },
          {
            name: d.title,
            url: `https://studio-vm.be/${locale}/mogelijkheden/${slug}`,
          },
        ]}
      />
      <ServiceJsonLd
        name={d.title}
        description={d.heroIntro}
        url={`https://studio-vm.be/${locale}/mogelijkheden/${slug}`}
      />
      <FaqJsonLd items={d.faq} />

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <Link
            href={localePath(locale, "/mogelijkheden")}
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            {t.back}
          </Link>
          <div className="mt-8 flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-card">
              <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
            </span>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {d.title}
            </p>
          </div>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {d.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {d.heroIntro}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
              {t.whatYouGet}
            </h2>
            <ul className="mt-6 space-y-3">
              {d.whatYouGet.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check
                    className="mt-1 h-4 w-4 flex-shrink-0 text-accent"
                    strokeWidth={2.5}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
              {t.howItWorks}
            </h2>
            <ol className="mt-6 space-y-5">
              {d.howItWorks.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="font-mono text-lg font-semibold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
            {t.examples}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {d.examples.map((ex) => {
              const project = getProjectBySlug(ex.slug, locale);
              if (!project) return null;
              return (
                <Link
                  key={ex.slug}
                  href={localePath(locale, `/werk/${ex.slug}`)}
                  className="group rounded-2xl border bg-background p-6 transition-colors hover:bg-card-hover"
                >
                  <div
                    aria-hidden
                    className="mb-4 h-20 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${project.accent}, ${project.accent}cc)`,
                    }}
                  />
                  <h3 className="flex items-center gap-1.5 text-lg font-semibold tracking-tight">
                    {project.name}
                    <ArrowUpRight
                      className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={1.5}
                    />
                  </h3>
                  <p className="mt-2 text-sm text-muted">{ex.note}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {slug === "websites" && (
        <section className="border-b bg-card">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
            <LoadingRace />
          </div>
        </section>
      )}

      {slug === "migratie" && (
        <section className="border-b bg-card">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
            <BeforeAfter />
          </div>
        </section>
      )}

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
            {t.faq}
          </h2>
          <dl className="space-y-4">
            {d.faq.map((f) => (
              <div key={f.q} className="rounded-2xl border bg-card p-6">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-2 text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {d.ctaTitle}
          </h2>
          <p className="mt-4 text-muted">{d.ctaText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={localePath(locale, "/#contact")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t.talk}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href={localePath(locale, "/pricing")}
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
            >
              {t.pricingCta}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
            {t.more}
          </h2>
          <div className="grid gap-px bg-border sm:grid-cols-3">
            {others.map((o) => {
              const OIcon = o.icon;
              return (
                <Link
                  key={o.slug}
                  href={localePath(locale, `/mogelijkheden/${o.slug}`)}
                  className="group flex flex-col bg-card p-6 transition-colors hover:bg-card-hover"
                >
                  <OIcon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                  <h3 className="mt-4 flex items-center gap-1.5 font-semibold tracking-tight">
                    {o.title}
                    <ArrowUpRight
                      className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={1.5}
                    />
                  </h3>
                  <p className="mt-2 text-sm text-muted">{o.short}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
