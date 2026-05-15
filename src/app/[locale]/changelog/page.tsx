import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Rocket, Sparkles, Wrench, Bug, ArrowRight } from "lucide-react";
import { getChangelog, type ChangeKind } from "@/lib/changelog";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

const copy: Record<
  Locale,
  {
    metaTitle: string;
    metaDesc: string;
    eyebrow: string;
    title: string;
    lead: string;
    kinds: Record<ChangeKind, string>;
    rss: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
    localeCode: string;
  }
> = {
  nl: {
    metaTitle: "Changelog — Studio VM",
    metaDesc:
      "Publiek logboek van wat ik aan deze site bouw. Transparant: ik onderhoud wat ik lever.",
    eyebrow: "Changelog",
    title: "Wat ik bouw, in de open.",
    lead: "Een site is nooit 'af'. Dit is het eerlijke, gedateerde logboek van studio-vm.be zelf — zodat je ziet dat ik onderhoud wat ik lever, en niet stilval na de launch.",
    kinds: { launch: "Lancering", feature: "Nieuw", improve: "Beter", fix: "Fix" },
    rss: "RSS",
    ctaTitle: "Zo onderhoud ik ook jouw site.",
    ctaText: "Geen 'klaar en weg', maar een levende site die meegroeit.",
    ctaButton: "Bespreek je project",
    localeCode: "nl-BE",
  },
  fr: {
    metaTitle: "Changelog — Studio VM",
    metaDesc:
      "Journal public de ce que je construis sur ce site. Transparent : j'entretiens ce que je livre.",
    eyebrow: "Changelog",
    title: "Ce que je construis, à découvert.",
    lead: "Un site n'est jamais 'fini'. Voici le journal honnête et daté de studio-vm.be lui-même — pour que vous voyiez que j'entretiens ce que je livre, sans m'arrêter après le lancement.",
    kinds: { launch: "Lancement", feature: "Nouveau", improve: "Amélioré", fix: "Correctif" },
    rss: "RSS",
    ctaTitle: "C'est ainsi que j'entretiens aussi votre site.",
    ctaText: "Pas 'livré et parti', mais un site vivant qui évolue.",
    ctaButton: "Discuter de votre projet",
    localeCode: "fr-BE",
  },
  en: {
    metaTitle: "Changelog — Studio VM",
    metaDesc:
      "Public log of what I build on this site. Transparent: I maintain what I deliver.",
    eyebrow: "Changelog",
    title: "What I build, in the open.",
    lead: "A site is never 'done'. This is the honest, dated log of studio-vm.be itself — so you see I maintain what I deliver, and don't go quiet after launch.",
    kinds: { launch: "Launch", feature: "New", improve: "Improved", fix: "Fix" },
    rss: "RSS",
    ctaTitle: "That's how I maintain your site too.",
    ctaText: "Not 'delivered and gone', but a living site that grows with you.",
    ctaButton: "Discuss your project",
    localeCode: "en-GB",
  },
};

const kindIcon: Record<ChangeKind, typeof Rocket> = {
  launch: Rocket,
  feature: Sparkles,
  improve: Wrench,
  fix: Bug,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const c = copy[locale];
  return {
    title: c.metaTitle,
    description: c.metaDesc,
    alternates: {
      types: {
        "application/rss+xml": `https://studio-vm.be/${locale}/changelog/rss.xml`,
      },
    },
  };
}

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];
  const entries = getChangelog(locale);

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {c.eyebrow}
            </p>
            <Link
              href={localePath(locale, "/changelog/rss.xml")}
              className="rounded-full border px-3 py-1 font-mono text-[11px] text-muted transition-colors hover:text-foreground"
            >
              {c.rss} →
            </Link>
          </div>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {c.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {c.lead}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <ol className="relative space-y-8 border-l pl-8">
            {entries.map((e) => {
              const Icon = kindIcon[e.kind];
              return (
                <li key={`${e.date}-${e.version}`} className="relative">
                  <span className="absolute -left-[2.6rem] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent bg-background">
                    <Icon className="h-3 w-3 text-accent" strokeWidth={2} />
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-card px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                      {c.kinds[e.kind]}
                    </span>
                    <time className="font-mono text-xs text-muted">
                      {new Date(e.date).toLocaleDateString(c.localeCode, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                    <span className="font-mono text-[11px] text-muted">
                      v{e.version}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight">
                    {e.title}
                  </h2>
                  <p className="mt-1 leading-relaxed text-muted">{e.detail}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.ctaTitle}
          </h2>
          <p className="mt-4 text-muted">{c.ctaText}</p>
          <Link
            href={localePath(locale, "/#contact")}
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
