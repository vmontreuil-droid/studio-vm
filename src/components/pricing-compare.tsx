"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  offerCatalog,
  OFFER_INCLUDED,
  subscriptionCents,
} from "@/lib/pricing";
import { localePath, type Locale } from "@/lib/i18n/config";

const DOMAIN_YEAR = 3900; // € 39 / jaar (cents)
const eur = (c: number) =>
  "€ " + Math.round(c / 100).toLocaleString("nl-BE");

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    pkg: string;
    horizon: string;
    yr: (n: number) => string;
    altMonthly: string;
    altOnce: string;
    studio: string;
    elsewhere: string;
    studioNote: (o: string, m: string) => string;
    total: (n: number) => string;
    avg: string;
    save: (n: number) => string;
    extra: (n: number) => string;
    disclaimer: string;
    cta: string;
  }
> = {
  nl: {
    eyebrow: "Vergelijk eerlijk",
    title: "Wat kost het je écht — over de jaren?",
    intro:
      "De Studio VM-zijde komt rechtstreeks van deze pagina. Vul rechts in wat je nu (of elders) zou betalen — dan zie je het echte plaatje.",
    pkg: "Pakket",
    horizon: "Over",
    yr: (n) => `${n} jaar`,
    altMonthly: "Elders per maand (onderhoud/hosting/abonnement)",
    altOnce: "Eenmalige kost elders (optioneel)",
    studio: "Studio VM — alles inbegrepen",
    elsewhere: "Elders — jouw cijfers (indicatief)",
    studioNote: (o, m) => `Eenmalig ${o} · onderhoud ${m}/mnd · domein € 39/jr`,
    total: (n) => `Totaal over ${n} jaar`,
    avg: "gemiddeld / jaar",
    save: (n) => `Je bespaart over ${n} jaar`,
    extra: (n) => `Je betaalt over ${n} jaar méér`,
    disclaimer:
      "Indicatief. De Studio VM-cijfers zijn vast (excl. btw, verplicht onderhoud + domein meegerekend). De 'elders'-cijfers vul je zelf in — pas ze aan naar jouw situatie.",
    cta: "Stel jouw prijs samen",
  },
  fr: {
    eyebrow: "Comparez honnêtement",
    title: "Combien ça vous coûte vraiment — sur les années ?",
    intro:
      "Le côté Studio VM vient directement de cette page. Indiquez à droite ce que vous payez (ou ailleurs) — vous voyez le vrai tableau.",
    pkg: "Forfait",
    horizon: "Sur",
    yr: (n) => `${n} ans`,
    altMonthly: "Ailleurs par mois (maintenance/hébergement/abonnement)",
    altOnce: "Coût unique ailleurs (facultatif)",
    studio: "Studio VM — tout inclus",
    elsewhere: "Ailleurs — vos chiffres (indicatif)",
    studioNote: (o, m) => `Unique ${o} · maintenance ${m}/mois · domaine € 39/an`,
    total: (n) => `Total sur ${n} ans`,
    avg: "moyenne / an",
    save: (n) => `Vous économisez sur ${n} ans`,
    extra: (n) => `Vous payez en plus sur ${n} ans`,
    disclaimer:
      "Indicatif. Les chiffres Studio VM sont fixes (HTVA, maintenance obligatoire + domaine inclus). Les chiffres 'ailleurs' sont les vôtres — adaptez-les à votre situation.",
    cta: "Composez votre prix",
  },
  en: {
    eyebrow: "Compare honestly",
    title: "What does it really cost you — over the years?",
    intro:
      "The Studio VM side comes straight from this page. Enter on the right what you'd pay now (or elsewhere) — see the real picture.",
    pkg: "Package",
    horizon: "Over",
    yr: (n) => `${n} years`,
    altMonthly: "Elsewhere per month (maintenance/hosting/subscription)",
    altOnce: "One-off cost elsewhere (optional)",
    studio: "Studio VM — all included",
    elsewhere: "Elsewhere — your figures (indicative)",
    studioNote: (o, m) => `One-off ${o} · maintenance ${m}/mo · domain € 39/yr`,
    total: (n) => `Total over ${n} years`,
    avg: "average / year",
    save: (n) => `You save over ${n} years`,
    extra: (n) => `You pay more over ${n} years`,
    disclaimer:
      "Indicative. The Studio VM figures are fixed (excl. VAT, required maintenance + domain included). The 'elsewhere' figures are yours — adjust them to your situation.",
    cta: "Build your price",
  },
};

export function PricingCompare({ locale }: { locale: Locale }) {
  const t = T[locale];
  const { bases } = useMemo(() => offerCatalog(), []);
  const [slug, setSlug] = useState("starter");
  const [years, setYears] = useState(3);
  const [altMonthly, setAltMonthly] = useState(150);
  const [altOnce, setAltOnce] = useState(0);

  const base = bases.find((b) => b.slug === slug) ?? bases[0];
  const subSlug = OFFER_INCLUDED[base.slug ?? "starter"]?.sub ?? "care";
  const subCents = subscriptionCents(subSlug);

  const studioTotal =
    base.cents + subCents * 12 * years + DOMAIN_YEAR * years;
  const altTotal = altOnce * 100 + altMonthly * 100 * 12 * years;
  const diff = altTotal - studioTotal;

  const fld =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <section className="border-b">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            {t.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 text-muted">{t.intro}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          {/* Inputs */}
          <div className="rounded-2xl border bg-card p-6">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {t.pkg}
            </label>
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={`mt-1.5 ${fld}`}
            >
              {bases.map((b) => (
                <option key={b.key} value={b.slug}>
                  {b.name} · {eur(b.cents)}
                </option>
              ))}
            </select>

            <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-muted">
              {t.horizon}
            </p>
            <div className="mt-1.5 flex gap-2">
              {[1, 3, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setYears(n)}
                  className={`flex-1 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                    years === n
                      ? "border-accent bg-accent text-white"
                      : "hover:bg-card-hover"
                  }`}
                >
                  {t.yr(n)}
                </button>
              ))}
            </div>

            <label className="mt-5 block font-mono text-[10px] uppercase tracking-widest text-muted">
              {t.altMonthly}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-sm text-muted">€</span>
              <input
                type="number"
                min={0}
                value={altMonthly}
                onChange={(e) =>
                  setAltMonthly(Math.max(0, Number(e.target.value) || 0))
                }
                className={fld}
              />
              <span className="whitespace-nowrap text-sm text-muted">
                / {locale === "fr" ? "mois" : locale === "en" ? "mo" : "mnd"}
              </span>
            </div>

            <label className="mt-4 block font-mono text-[10px] uppercase tracking-widest text-muted">
              {t.altOnce}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-sm text-muted">€</span>
              <input
                type="number"
                min={0}
                value={altOnce}
                onChange={(e) =>
                  setAltOnce(Math.max(0, Number(e.target.value) || 0))
                }
                className={fld}
              />
            </div>
          </div>

          {/* Resultaat */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                {t.studio}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {eur(studioTotal)}
              </p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {t.total(years)} ·{" "}
                {eur(Math.round(studioTotal / years))} {t.avg}
              </p>
              <p className="mt-3 text-xs text-muted">
                {t.studioNote(eur(base.cents), eur(subCents))}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {t.elsewhere}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {eur(altTotal)}
              </p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {t.total(years)} ·{" "}
                {eur(Math.round(altTotal / years))} {t.avg}
              </p>
            </div>

            {altTotal > 0 && (
              <div
                className={`rounded-2xl p-5 text-center ${
                  diff >= 0
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}
              >
                <p className="text-sm font-medium">
                  {diff >= 0 ? t.save(years) : t.extra(years)}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {eur(Math.abs(diff))}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="mx-auto max-w-2xl font-mono text-[11px] leading-relaxed text-muted">
            {t.disclaimer}
          </p>
          <Link
            href={localePath(locale, "/offerte")}
            className="group/btn inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            {t.cta}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
              strokeWidth={2.5}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
