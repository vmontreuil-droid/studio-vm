import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { getCapabilityDetails } from "@/lib/capabilities";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

const copy: Record<
  Locale,
  {
    metaTitle: string;
    eyebrow: string;
    title: string;
    intro: string;
    detail: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
  }
> = {
  nl: {
    metaTitle: "Mogelijkheden — Studio VM",
    eyebrow: "Mogelijkheden",
    title: "Wat ik allemaal kan bouwen",
    intro:
      "Onder de motorkap zit telkens dezelfde stack — Next.js, Supabase, Tailwind. Klik door voor de volledige uitleg, voorbeelden en veelgestelde vragen per module.",
    detail: "Volledige uitleg",
    ctaTitle: "Niet zeker wat je nodig hebt?",
    ctaText:
      "Vertel me kort over je zaak. Ik zeg eerlijk welke modules zinvol zijn — en welke je (nog) niet nodig hebt.",
    ctaButton: "Praat met me",
  },
  fr: {
    metaTitle: "Capacités — Studio VM",
    eyebrow: "Capacités",
    title: "Ce que je peux construire",
    intro:
      "Sous le capot, toujours la même stack — Next.js, Supabase, Tailwind. Cliquez pour l'explication complète, des exemples et une FAQ par module.",
    detail: "Explication complète",
    ctaTitle: "Pas sûr de ce dont vous avez besoin ?",
    ctaText:
      "Parlez-moi brièvement de votre activité. Je dis honnêtement quels modules sont utiles — et lesquels vous n'avez pas (encore) besoin.",
    ctaButton: "Discutons-en",
  },
  en: {
    metaTitle: "Capabilities — Studio VM",
    eyebrow: "Capabilities",
    title: "What I can build for you",
    intro:
      "Under the hood it's always the same stack — Next.js, Supabase, Tailwind. Click through for the full explanation, examples and FAQ per module.",
    detail: "Full explanation",
    ctaTitle: "Not sure what you need?",
    ctaText:
      "Tell me briefly about your business. I'll honestly say which modules make sense — and which you don't need (yet).",
    ctaButton: "Let's talk",
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

export default async function MogelijkhedenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];
  const caps = getCapabilityDetails(locale);

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {c.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {c.intro}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {caps.map((cap) => {
              const Icon = cap.icon;
              return (
                <Link
                  key={cap.slug}
                  href={localePath(locale, `/mogelijkheden/${cap.slug}`)}
                  className="group flex flex-col bg-card p-8 transition-colors hover:bg-card-hover"
                >
                  <Icon className="h-7 w-7 text-accent" strokeWidth={1.5} />
                  <h2 className="mt-5 flex items-center gap-2 text-lg font-semibold tracking-tight">
                    {cap.title}
                    <ArrowUpRight
                      className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                      strokeWidth={1.5}
                    />
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {cap.short}
                  </p>
                  <span className="mt-5 font-mono text-xs text-accent">
                    {c.detail} →
                  </span>
                </Link>
              );
            })}
          </div>
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
