import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Item = { name: string; hint?: string; url?: string };
type Group = { title: string; intro?: string; items: Item[] };

const groupsByLocale: Record<
  Locale,
  {
    metaTitle: string;
    title: string;
    intro: string;
    introLink: string;
    introEnd: string;
    groups: Group[];
    footerA: string;
    footerLink: string;
  }
> = {
  nl: {
    metaTitle: "Uses — Studio VM",
    title: "Mijn dagelijkse uitrusting.",
    intro:
      "Geen affiliate-links, geen sponsoring. Gewoon de tools waar ik na jaren bij terechtkwam. Geïnspireerd door ",
    introLink: "uses.tech",
    introEnd: ".",
    groups: [
      { title: "Stack", intro: "De technische basis voor zo goed als elk project.", items: [
        { name: "Next.js 16", hint: "App Router, React Server Components, Turbopack", url: "https://nextjs.org" },
        { name: "React 19", hint: "Met de nieuwe React Compiler", url: "https://react.dev" },
        { name: "Tailwind v4", hint: "CSS-first met @theme inline", url: "https://tailwindcss.com" },
        { name: "Supabase", hint: "Postgres + auth + storage in EU regio", url: "https://supabase.com" },
        { name: "Vercel", hint: "Hosting + edge functions + CDN", url: "https://vercel.com" },
        { name: "TypeScript", hint: "Strict mode, altijd", url: "https://typescriptlang.org" },
      ] },
      { title: "Bibliotheken die telkens terugkomen", items: [
        { name: "lucide-react", hint: "Iconen", url: "https://lucide.dev" },
        { name: "Mollie", hint: "Belgische betalingen, lagere fees dan Stripe voor lokaal", url: "https://mollie.com" },
        { name: "Stripe", hint: "Voor internationale e-commerce", url: "https://stripe.com" },
        { name: "Resend", hint: "Transactionele e-mail (incl. React Email)", url: "https://resend.com" },
        { name: "React Email", hint: "Mails ontwerpen als React-componenten", url: "https://react.email" },
        { name: "next/og", hint: "Dynamische Open Graph images" },
      ] },
      { title: "Editor & dev", items: [
        { name: "VS Code", hint: "Met Tailwind, ESLint, Prettier" },
        { name: "Claude Code (CLI)", hint: "Pair-programming voor de zware refactors", url: "https://claude.com/code" },
        { name: "GitHub", hint: "Eén repo per klant, Vincent + klant beide eigenaar" },
        { name: "Playwright", hint: "End-to-end tests voor de webshops" },
      ] },
      { title: "Design & content", items: [
        { name: "Figma", hint: "Voor klanten die hun eigen schetsen willen delen" },
        { name: "Sharp", hint: "Image-pipeline server-side" },
        { name: "Geist Sans + Mono", hint: "Standaard fonts (Vercel)", url: "https://vercel.com/font" },
      ] },
      { title: "Hardware", items: [
        { name: "MacBook Pro", hint: "Dagelijks werkpaard" },
        { name: "iPhone + iPad", hint: "Voor mobile testing en PWA installs" },
      ] },
    ],
    footerA: "Vraag of suggestie? ",
    footerLink: "Stuur een bericht",
  },
  fr: {
    metaTitle: "Uses — Studio VM",
    title: "Mon équipement quotidien.",
    intro:
      "Pas de liens affiliés, pas de sponsoring. Juste les outils auxquels je suis arrivé après des années. Inspiré par ",
    introLink: "uses.tech",
    introEnd: ".",
    groups: [
      { title: "Stack", intro: "La base technique de quasiment chaque projet.", items: [
        { name: "Next.js 16", hint: "App Router, React Server Components, Turbopack", url: "https://nextjs.org" },
        { name: "React 19", hint: "Avec le nouveau React Compiler", url: "https://react.dev" },
        { name: "Tailwind v4", hint: "CSS-first avec @theme inline", url: "https://tailwindcss.com" },
        { name: "Supabase", hint: "Postgres + auth + storage en région EU", url: "https://supabase.com" },
        { name: "Vercel", hint: "Hébergement + edge functions + CDN", url: "https://vercel.com" },
        { name: "TypeScript", hint: "Strict mode, toujours", url: "https://typescriptlang.org" },
      ] },
      { title: "Bibliothèques récurrentes", items: [
        { name: "lucide-react", hint: "Icônes", url: "https://lucide.dev" },
        { name: "Mollie", hint: "Paiements belges, frais plus bas que Stripe en local", url: "https://mollie.com" },
        { name: "Stripe", hint: "Pour l'e-commerce international", url: "https://stripe.com" },
        { name: "Resend", hint: "E-mail transactionnel (avec React Email)", url: "https://resend.com" },
        { name: "React Email", hint: "Concevoir des mails comme des composants React", url: "https://react.email" },
        { name: "next/og", hint: "Images Open Graph dynamiques" },
      ] },
      { title: "Éditeur & dev", items: [
        { name: "VS Code", hint: "Avec Tailwind, ESLint, Prettier" },
        { name: "Claude Code (CLI)", hint: "Pair-programming pour les gros refactors", url: "https://claude.com/code" },
        { name: "GitHub", hint: "Un dépôt par client, Vincent + client co-propriétaires" },
        { name: "Playwright", hint: "Tests end-to-end pour les boutiques" },
      ] },
      { title: "Design & contenu", items: [
        { name: "Figma", hint: "Pour les clients qui partagent leurs croquis" },
        { name: "Sharp", hint: "Pipeline d'images côté serveur" },
        { name: "Geist Sans + Mono", hint: "Polices par défaut (Vercel)", url: "https://vercel.com/font" },
      ] },
      { title: "Matériel", items: [
        { name: "MacBook Pro", hint: "Cheval de bataille quotidien" },
        { name: "iPhone + iPad", hint: "Pour les tests mobiles et installs PWA" },
      ] },
    ],
    footerA: "Question ou suggestion ? ",
    footerLink: "Envoyez un message",
  },
  en: {
    metaTitle: "Uses — Studio VM",
    title: "My daily kit.",
    intro:
      "No affiliate links, no sponsoring. Just the tools I landed on after years. Inspired by ",
    introLink: "uses.tech",
    introEnd: ".",
    groups: [
      { title: "Stack", intro: "The technical base for nearly every project.", items: [
        { name: "Next.js 16", hint: "App Router, React Server Components, Turbopack", url: "https://nextjs.org" },
        { name: "React 19", hint: "With the new React Compiler", url: "https://react.dev" },
        { name: "Tailwind v4", hint: "CSS-first with @theme inline", url: "https://tailwindcss.com" },
        { name: "Supabase", hint: "Postgres + auth + storage in EU region", url: "https://supabase.com" },
        { name: "Vercel", hint: "Hosting + edge functions + CDN", url: "https://vercel.com" },
        { name: "TypeScript", hint: "Strict mode, always", url: "https://typescriptlang.org" },
      ] },
      { title: "Libraries that keep coming back", items: [
        { name: "lucide-react", hint: "Icons", url: "https://lucide.dev" },
        { name: "Mollie", hint: "Belgian payments, lower fees than Stripe locally", url: "https://mollie.com" },
        { name: "Stripe", hint: "For international e-commerce", url: "https://stripe.com" },
        { name: "Resend", hint: "Transactional email (incl. React Email)", url: "https://resend.com" },
        { name: "React Email", hint: "Design mails as React components", url: "https://react.email" },
        { name: "next/og", hint: "Dynamic Open Graph images" },
      ] },
      { title: "Editor & dev", items: [
        { name: "VS Code", hint: "With Tailwind, ESLint, Prettier" },
        { name: "Claude Code (CLI)", hint: "Pair programming for heavy refactors", url: "https://claude.com/code" },
        { name: "GitHub", hint: "One repo per client, Vincent + client both owners" },
        { name: "Playwright", hint: "End-to-end tests for the webshops" },
      ] },
      { title: "Design & content", items: [
        { name: "Figma", hint: "For clients who want to share their own sketches" },
        { name: "Sharp", hint: "Server-side image pipeline" },
        { name: "Geist Sans + Mono", hint: "Default fonts (Vercel)", url: "https://vercel.com/font" },
      ] },
      { title: "Hardware", items: [
        { name: "MacBook Pro", hint: "Daily workhorse" },
        { name: "iPhone + iPad", hint: "For mobile testing and PWA installs" },
      ] },
    ],
    footerA: "Question or suggestion? ",
    footerLink: "Send a message",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { title: groupsByLocale[locale].metaTitle };
}

export default async function UsesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = groupsByLocale[locale];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            /uses
          </p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mt-4 text-muted">
            {c.intro}
            <a
              href="https://uses.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              {c.introLink}
            </a>
            {c.introEnd}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl space-y-12 px-6 py-12">
          {c.groups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xl font-semibold tracking-tight">
                {group.title}
              </h2>
              {group.intro && (
                <p className="mt-2 text-sm text-muted">{group.intro}</p>
              )}
              <ul className="mt-4 divide-y rounded-2xl border bg-card">
                {group.items.map((item) => (
                  <li key={item.name} className="flex items-start gap-4 p-4">
                    <div className="flex-1">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold tracking-tight transition-colors hover:text-accent"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <p className="font-semibold tracking-tight">{item.name}</p>
                      )}
                      {item.hint && (
                        <p className="mt-0.5 text-sm text-muted">{item.hint}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-12 text-center">
          <p className="text-sm text-muted">
            {c.footerA}
            <Link
              href={localePath(locale, "/#contact")}
              className="text-accent hover:underline"
            >
              {c.footerLink}
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
