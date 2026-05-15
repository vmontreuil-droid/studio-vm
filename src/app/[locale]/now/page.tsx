import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Briefcase, Lightbulb, Rocket } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { dbNow } from "@/lib/now-db";

export const dynamic = "force-dynamic";

const lastUpdate = "2026-05-15";

type Copy = {
  metaTitle: string;
  title: string;
  introA: string;
  introLink: string;
  introB: string;
  updated: string;
  workTitle: string;
  work: string[];
  ideasTitle: string;
  ideas: string[];
  recentTitle: string;
  bandwidthTitle: string;
  bandwidthA: string;
  bandwidthLink: string;
  bandwidthB: string;
  localeCode: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Nu — Studio VM",
    title: "Wat ik nu doe.",
    introA: "Dit is een ",
    introLink: "now-page",
    introB:
      ": eerlijk en simpel overzicht van wat me bezighoudt. Bijgewerkt op ",
    updated: "",
    workTitle: "Werk in uitvoering",
    work: [
      "Webshop voor Allard Philippe (wildlife-fotografie) — gift cards en kortingscodes deze sprint.",
      "Migratie van JP Montreuil van WordPress naar Next.js + Supabase admin.",
      "Doorbouwen aan Studio VM zelf (deze site) — volledig drietalig nu.",
    ],
    ideasTitle: "Ideeën die rondzweven",
    ideas: [
      "Een templates-marktplaats waar lokale ondernemers op een dag kunnen starten.",
      "Een mini-CRM bovenop Supabase, geoptimaliseerd voor freelancers.",
      "Een Cal.com-achtige booking-widget voor restaurants, in éigen stack.",
    ],
    recentTitle: "Recent gelanceerd",
    bandwidthTitle: "Bandbreedte",
    bandwidthA:
      "Geen ruimte voor nieuwe grote projecten dit kwartaal. Kleine opdrachten (websites tot 5 pagina's, urgent fixes) wel mogelijk. ",
    bandwidthLink: "Stuur een bericht",
    bandwidthB: " om te zien of het past.",
    localeCode: "nl-BE",
  },
  fr: {
    metaTitle: "Maintenant — Studio VM",
    title: "Ce que je fais maintenant.",
    introA: "Ceci est une ",
    introLink: "now-page",
    introB:
      " : un aperçu honnête et simple de ce qui m'occupe. Mise à jour le ",
    updated: "",
    workTitle: "Travail en cours",
    work: [
      "Boutique pour Allard Philippe (photographie animalière) — cartes-cadeaux et codes promo ce sprint.",
      "Migration de JP Montreuil de WordPress vers Next.js + admin Supabase.",
      "Développement continu de Studio VM (ce site) — entièrement trilingue maintenant.",
    ],
    ideasTitle: "Idées qui flottent",
    ideas: [
      "Une marketplace de templates où les entrepreneurs locaux peuvent démarrer en un jour.",
      "Un mini-CRM au-dessus de Supabase, optimisé pour les freelances.",
      "Un widget de réservation type Cal.com pour restaurants, dans ma propre stack.",
    ],
    recentTitle: "Récemment lancé",
    bandwidthTitle: "Disponibilité",
    bandwidthA:
      "Pas de place pour de nouveaux grands projets ce trimestre. Petites missions (sites jusqu'à 5 pages, corrections urgentes) possibles. ",
    bandwidthLink: "Envoyez un message",
    bandwidthB: " pour voir si ça colle.",
    localeCode: "fr-BE",
  },
  en: {
    metaTitle: "Now — Studio VM",
    title: "What I'm doing now.",
    introA: "This is a ",
    introLink: "now-page",
    introB:
      ": an honest, simple overview of what's keeping me busy. Updated on ",
    updated: "",
    workTitle: "Work in progress",
    work: [
      "Webshop for Allard Philippe (wildlife photography) — gift cards and discount codes this sprint.",
      "Migration of JP Montreuil from WordPress to Next.js + Supabase admin.",
      "Continuing to build Studio VM itself (this site) — fully trilingual now.",
    ],
    ideasTitle: "Ideas floating around",
    ideas: [
      "A templates marketplace where local entrepreneurs can launch in a day.",
      "A mini-CRM on top of Supabase, optimized for freelancers.",
      "A Cal.com-style booking widget for restaurants, in my own stack.",
    ],
    recentTitle: "Recently launched",
    bandwidthTitle: "Bandwidth",
    bandwidthA:
      "No room for big new projects this quarter. Small jobs (sites up to 5 pages, urgent fixes) are possible. ",
    bandwidthLink: "Send a message",
    bandwidthB: " to see if it fits.",
    localeCode: "en-GB",
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

export default async function NowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];
  const ov = await dbNow(locale);
  const work = ov?.work?.length ? ov.work : c.work;
  const ideas = ov?.ideas?.length ? ov.ideas : c.ideas;
  const bandwidthBefore = ov?.bandwidth || c.bandwidthA;
  const bandwidthAfter = ov?.bandwidth ? " " : c.bandwidthB;
  const fmtDate = new Date(ov?.updated || lastUpdate).toLocaleDateString(
    c.localeCode,
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            /now
          </p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mt-4 text-muted">
            {c.introA}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              {c.introLink}
            </a>
            {c.introB}
            {fmtDate}.
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl space-y-8 px-6 py-12">
          <Block icon={Briefcase} title={c.workTitle}>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-foreground/90">
              {work.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Block>

          <Block icon={Lightbulb} title={c.ideasTitle}>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-foreground/90">
              {ideas.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </Block>

          <Block icon={Rocket} title={c.recentTitle}>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-foreground/90">
              <li>
                <Link
                  href={localePath(locale, "/werk/cottage-waregem")}
                  className="text-accent hover:underline"
                >
                  cottage-waregem.be
                </Link>{" "}
                — Squarespace → Next.js.
              </li>
              <li>
                <Link
                  href={localePath(locale, "/werk/celine-interieur")}
                  className="text-accent hover:underline"
                >
                  celine-interieur.vercel.app
                </Link>{" "}
                — 3 PWA's.
              </li>
              <li>
                <Link
                  href={localePath(locale, "/werk/mari-lines")}
                  className="text-accent hover:underline"
                >
                  mari-lines.be
                </Link>{" "}
                — B2B.
              </li>
            </ul>
          </Block>

          <Block icon={Clock} title={c.bandwidthTitle}>
            <p className="mt-3 text-foreground/90">
              {bandwidthBefore}
              <Link
                href={localePath(locale, "/#contact")}
                className="text-accent hover:underline"
              >
                {c.bandwidthLink}
              </Link>
              {bandwidthAfter}
            </p>
          </Block>
        </div>
      </section>
    </main>
  );
}

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Clock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
        {title}
      </h2>
      <div className="mt-1 leading-relaxed">{children}</div>
    </section>
  );
}
