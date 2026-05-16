import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Minus, X, ArrowRight } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Cell = "yes" | "no" | "meh";
type Row = { feature: string; values: Cell[] };

type Copy = {
  metaTitle: string;
  metaDesc: string;
  eyebrow: string;
  title: string;
  lead: string;
  cols: string[];
  rows: Row[];
  honestTitle: string;
  honest: { t: string; d: string }[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Vergelijking — Studio VM",
    metaDesc:
      "Eerlijk: Studio VM (pure Next.js + Supabase, volledige herbouw) naast WordPress, Shopify en een agency. Geen verkooppraatje, geen verborgen kosten.",
    eyebrow: "Vergelijking",
    title: "Waarom een volledige herbouw?",
    lead: "Geen thema, geen pluginstapel: ik herschrijf je site volledig in Next.js + Supabase, zodat de flow klopt en je aan élk detail kan sleutelen. Hieronder eerlijk hoe dat zich verhoudt tot WordPress, Shopify of een agency.",
    cols: ["", "Studio VM", "WordPress", "Shopify", "Agency"],
    rows: [
      { feature: "Snelheid (PageSpeed 95+)", values: ["yes", "meh", "meh", "meh"] },
      { feature: "Geen maandelijkse plugin-kosten", values: ["yes", "no", "no", "meh"] },
      { feature: "Eigen admin op maat", values: ["yes", "meh", "no", "yes"] },
      { feature: "Je houdt de code", values: ["yes", "yes", "no", "meh"] },
      { feature: "Lage maandelijkse kost", values: ["yes", "meh", "no", "no"] },
      { feature: "Snel live (1–2 weken)", values: ["yes", "yes", "yes", "no"] },
      { feature: "Geen technische kennis nodig om te starten", values: ["yes", "meh", "yes", "yes"] },
      { feature: "Eén vast aanspreekpunt", values: ["yes", "no", "no", "meh"] },
      { feature: "Tweetalig met echte SEO", values: ["yes", "meh", "meh", "yes"] },
      { feature: "Schaalt naar maatwerk", values: ["yes", "meh", "no", "yes"] },
    ],
    honestTitle: "Eerlijk: wanneer is een herbouw zinvol?",
    honest: [
      { t: "Wanneer het wél loont", d: "Trage of verouderde site, je kan niets zelf aanpassen, maandelijkse plugin-/abonnementskosten lopen op, of je groeit uit een template. Dan verdient een volledige herbouw zich snel terug." },
      { t: "Wanneer het níet hoeft", d: "Werkt je huidige site prima en verandert er weinig? Dan is herbouwen geld weggooien — dat zeg ik je gewoon, geen herbouw om de herbouw." },
      { t: "Wat je écht koopt", d: "Geen thema of pluginstapel: een site die volledig in Next.js + Supabase herschreven is, met een eigen admin zodat je aan álles kan sleutelen. Snel, van jou, geen lock-in." },
      { t: "Kies Studio VM als…", d: "je een snelle, eigen site of shop wil zonder maandelijkse kostenexplosie, één vast aanspreekpunt, en code die van jou blijft. Lokale ondernemers, KMO's en ateliers — daar zit mijn sterkte." },
    ],
    ctaTitle: "Niet zeker of een herbouw zinvol is?",
    ctaText: "Vertel me kort over je situatie. Werkt je huidige site prima, dan zeg ik dat eerlijk — geen herbouw om de herbouw.",
    ctaButton: "Vraag eerlijk advies",
  },
  fr: {
    metaTitle: "Comparaison — Studio VM",
    metaDesc:
      "Honnête : Studio VM (pur Next.js + Supabase, refonte complète) face à WordPress, Shopify et une agence. Pas de baratin, pas de coûts cachés.",
    eyebrow: "Comparaison",
    title: "Pourquoi une refonte complète ?",
    lead: "Pas de thème, pas d'empilement de plugins : je réécris votre site entièrement en Next.js + Supabase, pour un flux qui tient la route et un contrôle sur chaque détail. Voici, honnêtement, comment cela se compare à WordPress, Shopify ou une agence.",
    cols: ["", "Studio VM", "WordPress", "Shopify", "Agence"],
    rows: [
      { feature: "Vitesse (PageSpeed 95+)", values: ["yes", "meh", "meh", "meh"] },
      { feature: "Pas de coûts plugins mensuels", values: ["yes", "no", "no", "meh"] },
      { feature: "Admin propre sur mesure", values: ["yes", "meh", "no", "yes"] },
      { feature: "Vous gardez le code", values: ["yes", "yes", "no", "meh"] },
      { feature: "Coût mensuel faible", values: ["yes", "meh", "no", "no"] },
      { feature: "Rapide en ligne (1–2 semaines)", values: ["yes", "yes", "yes", "no"] },
      { feature: "Aucune connaissance technique pour démarrer", values: ["yes", "meh", "yes", "yes"] },
      { feature: "Un interlocuteur fixe", values: ["yes", "no", "no", "meh"] },
      { feature: "Bilingue avec vrai SEO", values: ["yes", "meh", "meh", "yes"] },
      { feature: "Évolue vers du sur-mesure", values: ["yes", "meh", "no", "yes"] },
    ],
    honestTitle: "Honnête : quand une refonte est-elle utile ?",
    honest: [
      { t: "Quand ça vaut le coup", d: "Site lent ou daté, vous ne pouvez rien modifier vous-même, des frais mensuels de plugins/abonnements s'accumulent, ou vous êtes à l'étroit dans un template. La refonte se rentabilise vite." },
      { t: "Quand ce n'est pas nécessaire", d: "Votre site actuel fonctionne bien et bouge peu ? Refaire serait jeter de l'argent — je vous le dis franchement, pas de refonte pour la refonte." },
      { t: "Ce que vous achetez vraiment", d: "Pas de thème ni d'empilement de plugins : un site entièrement réécrit en Next.js + Supabase, avec un admin propre pour tout ajuster. Rapide, à vous, sans lock-in." },
      { t: "Choisissez Studio VM si…", d: "vous voulez un site/boutique rapide et propre sans explosion de coûts mensuels, un interlocuteur fixe, et un code qui reste vôtre. PME, ateliers, indépendants — c'est là ma force." },
    ],
    ctaTitle: "Pas sûr qu'une refonte soit utile ?",
    ctaText: "Parlez-moi de votre situation. Si votre site actuel fonctionne bien, je vous le dis honnêtement — pas de refonte pour la refonte.",
    ctaButton: "Demander un conseil honnête",
  },
  en: {
    metaTitle: "Comparison — Studio VM",
    metaDesc:
      "Honest: Studio VM (pure Next.js + Supabase, full rebuild) next to WordPress, Shopify and an agency. No sales pitch, no hidden costs.",
    eyebrow: "Comparison",
    title: "Why a full rebuild?",
    lead: "No theme, no plugin stack: I rewrite your site entirely in Next.js + Supabase, so the flow is right and you can tweak every detail. Here's how that honestly compares to WordPress, Shopify or an agency.",
    cols: ["", "Studio VM", "WordPress", "Shopify", "Agency"],
    rows: [
      { feature: "Speed (PageSpeed 95+)", values: ["yes", "meh", "meh", "meh"] },
      { feature: "No monthly plugin costs", values: ["yes", "no", "no", "meh"] },
      { feature: "Own custom admin", values: ["yes", "meh", "no", "yes"] },
      { feature: "You keep the code", values: ["yes", "yes", "no", "meh"] },
      { feature: "Low monthly cost", values: ["yes", "meh", "no", "no"] },
      { feature: "Fast live (1–2 weeks)", values: ["yes", "yes", "yes", "no"] },
      { feature: "No technical knowledge to start", values: ["yes", "meh", "yes", "yes"] },
      { feature: "One fixed point of contact", values: ["yes", "no", "no", "meh"] },
      { feature: "Multilingual with real SEO", values: ["yes", "meh", "meh", "yes"] },
      { feature: "Scales to custom work", values: ["yes", "meh", "no", "yes"] },
    ],
    honestTitle: "Honest: when is a rebuild worth it?",
    honest: [
      { t: "When it pays off", d: "Slow or dated site, you can't change anything yourself, monthly plugin/subscription fees pile up, or you've outgrown a template. A full rebuild pays for itself fast." },
      { t: "When it isn't needed", d: "Your current site works fine and barely changes? Rebuilding would be throwing money away — I'll tell you straight, no rebuild for the sake of it." },
      { t: "What you actually buy", d: "No theme or plugin stack: a site fully rewritten in Next.js + Supabase, with an own admin so you can tweak everything. Fast, yours, no lock-in." },
      { t: "Choose Studio VM if…", d: "you want a fast, own site or shop without monthly cost explosion, one fixed point of contact, and code that stays yours. Local entrepreneurs, SMEs, studios — that's my strength." },
    ],
    ctaTitle: "Not sure a rebuild is worth it?",
    ctaText: "Tell me briefly about your situation. If your current site works fine, I'll say so honestly — no rebuild for the sake of it.",
    ctaButton: "Ask for honest advice",
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

function CellIcon({ v }: { v: Cell }) {
  if (v === "yes")
    return <Check className="mx-auto h-4 w-4 text-accent" strokeWidth={2.5} />;
  if (v === "no")
    return <X className="mx-auto h-4 w-4 text-muted/50" strokeWidth={2} />;
  return <Minus className="mx-auto h-4 w-4 text-muted" strokeWidth={2} />;
}

export default async function VergelijkingPage({
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
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-card">
                  {c.cols.map((col, i) => (
                    <th
                      key={i}
                      className={`p-4 font-mono text-[11px] uppercase tracking-widest ${
                        i === 1 ? "text-accent" : "text-muted"
                      } ${i === 0 ? "text-left" : "text-center"}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {c.rows.map((row) => (
                  <tr key={row.feature}>
                    <td className="p-4 font-medium">{row.feature}</td>
                    {row.values.map((v, i) => (
                      <td
                        key={i}
                        className={`p-4 text-center ${
                          i === 0 ? "bg-accent/5" : ""
                        }`}
                      >
                        <CellIcon v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-accent" strokeWidth={2.5} /> sterk
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Minus className="h-3 w-3" strokeWidth={2} /> wisselend
            </span>
            <span className="inline-flex items-center gap-1.5">
              <X className="h-3 w-3 text-muted/50" strokeWidth={2} /> zwak
            </span>
          </p>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-10 font-mono text-xs uppercase tracking-widest text-accent">
            {c.honestTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {c.honest.map((h) => (
              <div key={h.t} className="rounded-2xl border bg-background p-6">
                <h3 className="font-semibold tracking-tight">{h.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {h.d}
                </p>
              </div>
            ))}
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
