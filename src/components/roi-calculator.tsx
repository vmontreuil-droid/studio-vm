"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, TrendingDown, Gauge } from "lucide-react";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    visitors: string;
    conv: string;
    value: string;
    load: string;
    perMonth: string;
    sec: string;
    nowTitle: string;
    fastTitle: string;
    lostTitle: string;
    lostNote: string;
    perYear: string;
    method: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
    locale: string;
  }
> = {
  nl: {
    eyebrow: "ROI-calculator",
    title: "Wat kost een trage site je écht?",
    lead: "Elke seconde laadtijd boven één kost conversie. Schuif met je eigen cijfers en zie het jaarlijkse prijskaartje van traagheid — eerlijk, indicatief, geen verkoopmagie.",
    visitors: "Bezoekers",
    conv: "Conversie nu",
    value: "Waarde per klant/lead",
    load: "Huidige laadtijd",
    perMonth: "per maand",
    sec: "sec",
    nowTitle: "Nu",
    fastTitle: "Met < 1 s (Studio VM-doel)",
    lostTitle: "Wat traagheid je kost",
    lostNote: "geschat verlies per jaar door extra laadtijd",
    perYear: "per jaar",
    method:
      "Model: elke seconde boven 1 s verlaagt de conversie met ~7% (gangbare e-commerce-vuistregel, Akamai/Google). Indicatief — je echte cijfers bepalen we samen.",
    ctaTitle: "Dit bedrag laat je liggen.",
    ctaText: "Een snelle build verdient zichzelf vaak in maanden terug. Laten we 't concreet maken.",
    ctaButton: "Bespreek mijn site",
    locale: "nl-BE",
  },
  fr: {
    eyebrow: "Calculateur ROI",
    title: "Que vous coûte vraiment un site lent ?",
    lead: "Chaque seconde de chargement au-delà d'une coûte de la conversion. Ajustez vos chiffres et voyez le prix annuel de la lenteur — honnête, indicatif, sans magie commerciale.",
    visitors: "Visiteurs",
    conv: "Conversion actuelle",
    value: "Valeur par client/lead",
    load: "Temps de chargement actuel",
    perMonth: "par mois",
    sec: "s",
    nowTitle: "Maintenant",
    fastTitle: "Avec < 1 s (objectif Studio VM)",
    lostTitle: "Ce que la lenteur vous coûte",
    lostNote: "perte estimée par an due au temps de chargement",
    perYear: "par an",
    method:
      "Modèle : chaque seconde au-delà d'1 s réduit la conversion d'environ 7% (règle e-commerce courante, Akamai/Google). Indicatif — vos vrais chiffres, on les définit ensemble.",
    ctaTitle: "Vous laissez ce montant sur la table.",
    ctaText: "Un build rapide se rembourse souvent en quelques mois. Concrétisons.",
    ctaButton: "Discuter de mon site",
    locale: "fr-BE",
  },
  en: {
    eyebrow: "ROI calculator",
    title: "What does a slow site really cost you?",
    lead: "Every second of load time over one costs conversion. Slide your own numbers and see the yearly price of slowness — honest, indicative, no sales magic.",
    visitors: "Visitors",
    conv: "Current conversion",
    value: "Value per customer/lead",
    load: "Current load time",
    perMonth: "per month",
    sec: "sec",
    nowTitle: "Now",
    fastTitle: "With < 1 s (Studio VM target)",
    lostTitle: "What slowness costs you",
    lostNote: "estimated loss per year due to load time",
    perYear: "per year",
    method:
      "Model: every second over 1 s drops conversion by ~7% (common e-commerce rule of thumb, Akamai/Google). Indicative — your real numbers we define together.",
    ctaTitle: "You're leaving this amount on the table.",
    ctaText: "A fast build often pays for itself in months. Let's make it concrete.",
    ctaButton: "Discuss my site",
    locale: "en-GB",
  },
};

export function RoiCalculator() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = T[locale];

  const [visitors, setVisitors] = useState(5000);
  const [conv, setConv] = useState(2);
  const [value, setValue] = useState(60);
  const [load, setLoad] = useState(4);

  // Elke seconde boven 1s ≈ 7% relatieve conversiedaling.
  const penalty = Math.max(0, load - 1) * 0.07;
  const effConv = conv * (1 - penalty);
  const revNow = (visitors * (effConv / 100) * value) * 12;
  const revFast = (visitors * (conv / 100) * value) * 12;
  const lost = Math.max(0, revFast - revNow);

  const fmt = (n: number) =>
    "€ " + Math.round(n).toLocaleString(t.locale);

  return (
    <>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {t.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {t.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {t.lead}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <Slider
              label={t.visitors}
              suffix={t.perMonth}
              min={200}
              max={100000}
              step={200}
              value={visitors}
              display={visitors.toLocaleString(t.locale)}
              onChange={setVisitors}
            />
            <Slider
              label={t.conv}
              suffix="%"
              min={0.2}
              max={10}
              step={0.1}
              value={conv}
              display={conv.toFixed(1)}
              onChange={setConv}
            />
            <Slider
              label={t.value}
              suffix="€"
              min={5}
              max={2000}
              step={5}
              value={value}
              display={value.toLocaleString(t.locale)}
              onChange={setValue}
            />
            <Slider
              label={t.load}
              suffix={t.sec}
              min={0.5}
              max={10}
              step={0.1}
              value={load}
              display={load.toFixed(1)}
              onChange={setLoad}
            />
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4">
              <div className="rounded-2xl border bg-card p-6">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                  <Gauge className="h-3.5 w-3.5" strokeWidth={2} />
                  {t.nowTitle}
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {fmt(revNow)}{" "}
                  <span className="text-sm font-normal text-muted">
                    {t.perYear}
                  </span>
                </p>
                <p className="mt-1 font-mono text-xs text-muted">
                  conv. {effConv.toFixed(2)}%
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-6">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent">
                  {t.fastTitle}
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {fmt(revFast)}{" "}
                  <span className="text-sm font-normal text-muted">
                    {t.perYear}
                  </span>
                </p>
                <p className="mt-1 font-mono text-xs text-muted">
                  conv. {conv.toFixed(2)}%
                </p>
              </div>
              <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent">
                  <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />
                  {t.lostTitle}
                </div>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-accent">
                  {fmt(lost)}
                </p>
                <p className="mt-1 text-xs text-muted">{t.lostNote}</p>
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                {t.method}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.ctaTitle}
          </h2>
          <p className="mt-4 text-muted">{t.ctaText}</p>
          <Link
            href={localePath(locale, "/#contact")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {t.ctaButton}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </>
  );
}

function Slider({
  label,
  suffix,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  label: string;
  suffix: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="font-mono text-sm text-accent">
          {display} {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-accent"
        aria-label={label}
      />
    </div>
  );
}
