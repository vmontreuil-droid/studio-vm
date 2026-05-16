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
      "Eerlijk: Studio VM vs WordPress vs Shopify vs een agency vs zelf doen. Wanneer kies je wat? Geen verkooppraatje.",
    eyebrow: "Vergelijking",
    title: "Wanneer ben ik níet de juiste keuze?",
    lead: "Een eerlijke vergelijking helpt jou meer dan een lijst superlatieven. Hieronder waar Studio VM sterk in is — en waar WordPress, Shopify, een agency of zelf-doen beter passen.",
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
    honestTitle: "Eerlijk: wanneer kies je iets anders?",
    honest: [
      { t: "Kies Shopify als…", d: "je morgen wil starten, geen budget hebt voor een build, en puur standaard producten verkoopt. Het is snel en het werkt — tot je over een bepaalde omzet gaat en de fees pijn doen." },
      { t: "Kies WordPress als…", d: "je een grote redactie hebt die dagelijks blogt en al jaren in WordPress-workflows zit. Voor pure content-volumes met veel auteurs blijft het een redelijke keuze." },
      { t: "Kies een agency als…", d: "je een groot, complex project hebt met meerdere stakeholders en een budget dat overhead toelaat. Meer mensen kan nodig zijn — al betaal je dan ook voor de overhead." },
      { t: "Kies Studio VM als…", d: "je een snelle, eigen site of shop wil zonder maandelijkse kostenexplosie, één aanspreekpunt, en code die van jou blijft. Lokale ondernemers, KMO's, ateliers — daar zit mijn sterkte." },
    ],
    ctaTitle: "Niet zeker waar jij in past?",
    ctaText: "Vertel me kort over je situatie. Als ik niet de juiste keuze ben, zeg ik dat — en verwijs ik je door.",
    ctaButton: "Vraag eerlijk advies",
  },
  fr: {
    metaTitle: "Comparaison — Studio VM",
    metaDesc:
      "Honnête : Studio VM vs WordPress vs Shopify vs une agence vs faire soi-même. Quand choisir quoi ? Pas de baratin.",
    eyebrow: "Comparaison",
    title: "Quand ne suis-je PAS le bon choix ?",
    lead: "Une comparaison honnête vous aide plus qu'une liste de superlatifs. Ci-dessous où Studio VM est fort — et où WordPress, Shopify, une agence ou le faire soi-même conviennent mieux.",
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
    honestTitle: "Honnête : quand choisir autre chose ?",
    honest: [
      { t: "Choisissez Shopify si…", d: "vous voulez démarrer demain, sans budget pour un build, et vendez des produits standard. C'est rapide et ça marche — jusqu'à un certain CA où les frais font mal." },
      { t: "Choisissez WordPress si…", d: "vous avez une grande rédaction qui blogue chaque jour et des années de workflows WordPress. Pour de gros volumes de contenu multi-auteurs, ça reste raisonnable." },
      { t: "Choisissez une agence si…", d: "vous avez un grand projet complexe à plusieurs parties prenantes et un budget qui supporte l'overhead. Plus de monde peut être nécessaire — mais vous payez aussi l'overhead." },
      { t: "Choisissez Studio VM si…", d: "vous voulez un site/boutique propre et rapide sans explosion de coûts mensuels, un interlocuteur, et un code qui reste vôtre. PME, ateliers, indépendants — c'est là ma force." },
    ],
    ctaTitle: "Pas sûr où vous vous situez ?",
    ctaText: "Parlez-moi de votre situation. Si je ne suis pas le bon choix, je le dis — et je vous oriente.",
    ctaButton: "Demander un conseil honnête",
  },
  en: {
    metaTitle: "Comparison — Studio VM",
    metaDesc:
      "Honest: Studio VM vs WordPress vs Shopify vs an agency vs DIY. When to choose what? No sales pitch.",
    eyebrow: "Comparison",
    title: "When am I NOT the right choice?",
    lead: "An honest comparison helps you more than a list of superlatives. Below where Studio VM is strong — and where WordPress, Shopify, an agency or DIY fit better.",
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
    honestTitle: "Honest: when to choose something else?",
    honest: [
      { t: "Choose Shopify if…", d: "you want to start tomorrow, no budget for a build, and sell purely standard products. It's fast and it works — until you go past a certain revenue and the fees hurt." },
      { t: "Choose WordPress if…", d: "you have a large editorial team blogging daily and years of WordPress workflows. For pure content volume with many authors it stays reasonable." },
      { t: "Choose an agency if…", d: "you have a large, complex project with multiple stakeholders and a budget that allows overhead. More people may be needed — but you also pay for the overhead." },
      { t: "Choose Studio VM if…", d: "you want a fast, own site or shop without monthly cost explosion, one point of contact, and code that stays yours. Local entrepreneurs, SMEs, studios — that's my strength." },
    ],
    ctaTitle: "Not sure where you fit?",
    ctaText: "Tell me briefly about your situation. If I'm not the right choice, I'll say so — and point you elsewhere.",
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
