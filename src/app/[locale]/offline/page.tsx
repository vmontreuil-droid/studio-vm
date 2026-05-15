import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WifiOff, RefreshCw } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

const copy: Record<
  Locale,
  { metaTitle: string; eyebrow: string; title: string; intro: string; button: string }
> = {
  nl: {
    metaTitle: "Offline — Studio VM",
    eyebrow: "Geen verbinding",
    title: "Lijkt erop dat je offline bent.",
    intro:
      "Geen paniek — je verloor enkel je internetverbinding. Probeer 't opnieuw zodra je terug online bent.",
    button: "Probeer opnieuw",
  },
  fr: {
    metaTitle: "Hors ligne — Studio VM",
    eyebrow: "Pas de connexion",
    title: "Vous semblez être hors ligne.",
    intro:
      "Pas de panique — vous avez seulement perdu votre connexion internet. Réessayez dès que vous êtes de nouveau en ligne.",
    button: "Réessayer",
  },
  en: {
    metaTitle: "Offline — Studio VM",
    eyebrow: "No connection",
    title: "Looks like you're offline.",
    intro:
      "No panic — you only lost your internet connection. Try again as soon as you're back online.",
    button: "Try again",
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

export default async function OfflinePage({
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
        <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border bg-card">
            <WifiOff className="h-7 w-7 text-muted" strokeWidth={1.5} />
          </div>
          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted">{c.intro}</p>
          <div className="mt-10 flex justify-center gap-3">
            <Link
              href={localePath(locale, "/")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2} />
              {c.button}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
