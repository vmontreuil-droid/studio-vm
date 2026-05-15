import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  HeartHandshake,
  Unlock,
  MapPin,
  Gauge,
} from "lucide-react";
import { StackDiagram } from "@/components/stack-diagram";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Value = { title: string; desc: string };
type Copy = {
  metaTitle: string;
  metaDesc: string;
  eyebrow: string;
  title: string;
  lead: string;
  storyTitle: string;
  story: string[];
  valuesTitle: string;
  values: Value[];
  whyTitle: string;
  why: string[];
  factsTitle: string;
  facts: { k: string; v: string }[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  nowLink: string;
  usesLink: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Over Vincent — Studio VM",
    metaDesc:
      "De mens achter Studio VM: Vincent Montreuil, freelance webdeveloper in West-Vlaanderen. Eerlijk advies, geen lock-in, jij houdt de code.",
    eyebrow: "Over",
    title: "Eén persoon die je hele stack kent.",
    lead: "Geen agency met vijf tussenpersonen, geen account manager die je doorverbindt. Je praat met de persoon die ook bouwt. Dat maakt 't sneller, eerlijker en goedkoper.",
    storyTitle: "Kort verhaal",
    story: [
      "Ik ben Vincent Montreuil, freelance webdeveloper in West-Vlaanderen. Ik bouw websites, webshops en admins voor lokale ondernemers — restaurants, ateliers, fotografen, KMO's.",
      "Te vaak zag ik zaakvoerders vastzitten in een trage WordPress-site die ze niet zelf konden aanpassen, met een factuur voor elke kleine wijziging. Dat kan beter: snelle sites, een admin die jij begrijpt, en code die van jou is.",
      "Studio VM is bewust klein. Geen overhead, geen ruis. Wat je betaalt gaat naar het werk, niet naar een kantoor in een dure straat.",
    ],
    valuesTitle: "Waar ik op sta",
    values: [
      { title: "Eerlijk advies", desc: "Ik zeg je ook wat je níet nodig hebt. Een kleinere factuur en een tevreden klant is betere reclame dan een opgeblazen project." },
      { title: "Geen lock-in", desc: "De code zit in jouw GitHub-repo. Stoppen we ooit? Dan blijft alles van jou. Geen gijzeling, geen verrassingen." },
      { title: "Lokaal en bereikbaar", desc: "West-Vlaanderen + Brussel. Voor een eerste gesprek kom ik graag bij je langs. Je belt een mens, geen ticketsysteem." },
      { title: "Snelheid als basis", desc: "Geen trage sites. PageSpeed 95+ is geen extra — het is het minimum waarmee ik oplever." },
    ],
    whyTitle: "Waarom met mij werken",
    why: [
      "Je praat rechtstreeks met wie bouwt — geen telefoonspel.",
      "Eén stack (Next.js + Supabase) die ik door en door ken.",
      "Vaste, gepubliceerde prijzen. Geen offertes met sterretjes.",
      "Je houdt de code, de data en de controle.",
    ],
    factsTitle: "In het kort",
    facts: [
      { k: "Basis", v: "West-Vlaanderen, België" },
      { k: "Stack", v: "Next.js · Supabase · Tailwind · Vercel" },
      { k: "Talen", v: "NL · FR · EN" },
      { k: "Aanpak", v: "Solo, geen agency-overhead" },
    ],
    ctaTitle: "Klinkt dit als iemand met wie je wil werken?",
    ctaText: "Een eerste gesprek is vrijblijvend en kost niets. Ik zeg eerlijk of ik de juiste persoon voor je project ben.",
    ctaButton: "Praat met me",
    nowLink: "Wat ik nu doe",
    usesLink: "Tools die ik gebruik",
  },
  fr: {
    metaTitle: "À propos de Vincent — Studio VM",
    metaDesc:
      "L'humain derrière Studio VM : Vincent Montreuil, développeur web freelance en Flandre-Occidentale. Conseil honnête, pas de lock-in, le code est à vous.",
    eyebrow: "À propos",
    title: "Une personne qui connaît toute votre stack.",
    lead: "Pas une agence avec cinq intermédiaires, pas d'account manager qui vous transfère. Vous parlez à la personne qui construit aussi. C'est plus rapide, plus honnête et moins cher.",
    storyTitle: "En bref",
    story: [
      "Je suis Vincent Montreuil, développeur web freelance en Flandre-Occidentale. Je construis sites, boutiques et admins pour les entrepreneurs locaux — restaurants, ateliers, photographes, PME.",
      "Trop souvent j'ai vu des gérants coincés dans un site WordPress lent qu'ils ne pouvaient pas modifier eux-mêmes, avec une facture pour chaque petit changement. On peut faire mieux : des sites rapides, un admin que vous comprenez, et un code qui est le vôtre.",
      "Studio VM est volontairement petit. Pas d'overhead, pas de bruit. Ce que vous payez va au travail, pas à un bureau dans une rue chère.",
    ],
    valuesTitle: "Mes principes",
    values: [
      { title: "Conseil honnête", desc: "Je vous dis aussi ce dont vous n'avez pas besoin. Une facture plus petite et un client content font une meilleure pub qu'un projet gonflé." },
      { title: "Pas de lock-in", desc: "Le code est dans votre dépôt GitHub. On arrête un jour ? Tout reste à vous. Pas de prise d'otage, pas de surprises." },
      { title: "Local et joignable", desc: "Flandre-Occidentale + Bruxelles. Pour un premier entretien je passe volontiers. Vous appelez un humain, pas un système de tickets." },
      { title: "La vitesse comme base", desc: "Pas de sites lents. PageSpeed 95+ n'est pas un extra — c'est le minimum à la livraison." },
    ],
    whyTitle: "Pourquoi travailler avec moi",
    why: [
      "Vous parlez directement à celui qui construit — pas de jeu de téléphone.",
      "Une stack (Next.js + Supabase) que je connais à fond.",
      "Prix fixes et publiés. Pas de devis avec astérisques.",
      "Vous gardez le code, les données et le contrôle.",
    ],
    factsTitle: "En résumé",
    facts: [
      { k: "Base", v: "Flandre-Occidentale, Belgique" },
      { k: "Stack", v: "Next.js · Supabase · Tailwind · Vercel" },
      { k: "Langues", v: "NL · FR · EN" },
      { k: "Approche", v: "Solo, sans overhead d'agence" },
    ],
    ctaTitle: "Ça ressemble à quelqu'un avec qui vous voulez travailler ?",
    ctaText: "Un premier entretien est sans engagement et gratuit. Je dis honnêtement si je suis la bonne personne pour votre projet.",
    ctaButton: "Discutons-en",
    nowLink: "Ce que je fais maintenant",
    usesLink: "Mes outils",
  },
  en: {
    metaTitle: "About Vincent — Studio VM",
    metaDesc:
      "The person behind Studio VM: Vincent Montreuil, freelance web developer in West Flanders. Honest advice, no lock-in, you own the code.",
    eyebrow: "About",
    title: "One person who knows your whole stack.",
    lead: "Not an agency with five middlemen, no account manager forwarding you. You talk to the person who also builds. That makes it faster, more honest and cheaper.",
    storyTitle: "Short story",
    story: [
      "I'm Vincent Montreuil, freelance web developer in West Flanders. I build websites, webshops and admins for local entrepreneurs — restaurants, studios, photographers, SMEs.",
      "Too often I saw owners stuck in a slow WordPress site they couldn't edit themselves, with an invoice for every small change. It can be better: fast sites, an admin you understand, and code that's yours.",
      "Studio VM is deliberately small. No overhead, no noise. What you pay goes to the work, not to an office on an expensive street.",
    ],
    valuesTitle: "What I stand for",
    values: [
      { title: "Honest advice", desc: "I also tell you what you don't need. A smaller invoice and a happy client is better marketing than a bloated project." },
      { title: "No lock-in", desc: "The code is in your GitHub repo. Ever part ways? Everything stays yours. No hostage situation, no surprises." },
      { title: "Local and reachable", desc: "West Flanders + Brussels. For a first chat I'm happy to come by. You call a human, not a ticket system." },
      { title: "Speed as the baseline", desc: "No slow sites. PageSpeed 95+ isn't an extra — it's the minimum I deliver with." },
    ],
    whyTitle: "Why work with me",
    why: [
      "You talk directly to who builds — no telephone game.",
      "One stack (Next.js + Supabase) I know inside out.",
      "Fixed, published prices. No quotes with asterisks.",
      "You keep the code, the data and the control.",
    ],
    factsTitle: "In short",
    facts: [
      { k: "Based", v: "West Flanders, Belgium" },
      { k: "Stack", v: "Next.js · Supabase · Tailwind · Vercel" },
      { k: "Languages", v: "NL · FR · EN" },
      { k: "Approach", v: "Solo, no agency overhead" },
    ],
    ctaTitle: "Sound like someone you want to work with?",
    ctaText: "A first chat is non-binding and free. I'll honestly say whether I'm the right person for your project.",
    ctaButton: "Let's talk",
    nowLink: "What I'm doing now",
    usesLink: "Tools I use",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const c = copy[locale];
  return { title: c.metaTitle, description: c.metaDesc };
}

const valueIcons = [HeartHandshake, Unlock, MapPin, Gauge];

export default async function OverPage({
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
            {c.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {c.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {c.lead}
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link
              href={localePath(locale, "/now")}
              className="text-accent hover:underline"
            >
              {c.nowLink} →
            </Link>
            <Link
              href={localePath(locale, "/uses")}
              className="text-accent hover:underline"
            >
              {c.usesLink} →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
              {c.storyTitle}
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-foreground/90">
              {c.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <aside>
            <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
              {c.factsTitle}
            </h2>
            <dl className="mt-6 space-y-4">
              {c.facts.map((f) => (
                <div key={f.k}>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {f.k}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{f.v}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <StackDiagram />
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <h2 className="mb-12 font-mono text-xs uppercase tracking-widest text-accent">
            {c.valuesTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {c.values.map((v, i) => {
              const Icon = valueIcons[i];
              return (
                <div
                  key={v.title}
                  className="rounded-2xl border bg-background p-6"
                >
                  <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                  <h3 className="mt-4 font-semibold tracking-tight">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
            {c.whyTitle}
          </h2>
          <ul className="space-y-3">
            {c.why.map((w) => (
              <li key={w} className="flex items-start gap-3">
                <ArrowRight
                  className="mt-1 h-4 w-4 flex-shrink-0 text-accent"
                  strokeWidth={2.5}
                />
                <span className="text-lg">{w}</span>
              </li>
            ))}
          </ul>
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
