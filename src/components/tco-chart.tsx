"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

const MONTHS = 60;

type Plan = { key: string; label: string; color: string; setup: number; monthly: number; pctRevenue: number };

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    revenue: string;
    perMonth: string;
    over5y: string;
    year: string;
    plans: Record<string, string>;
    method: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
    locale: string;
  }
> = {
  nl: {
    eyebrow: "5-jaars kostenvergelijking",
    title: "Wat kost het écht, over vijf jaar?",
    lead: "De bouwprijs is maar het begin. Schuif met je maandelijkse online-omzet en zie de totale kost (TCO) over 60 maanden — inclusief hosting, plugins, onderhoud en Shopify-transactiekosten.",
    revenue: "Online-omzet",
    perMonth: "per maand",
    over5y: "Totaal over 5 jaar",
    year: "jaar",
    plans: {
      svm: "Studio VM (Pro + Care)",
      wp: "WordPress + plugins + onderhoud",
      shopify: "Shopify (+ 2% fees)",
      agency: "Agency (build + retainer)",
    },
    method:
      "Indicatief model. Studio VM: €1 900 eenmalig + €49/m. WordPress: €2 500 + ~€115/m (plugins, security, hosting). Shopify: €1 500 setup + €36/m + 2% van de omzet (app/transactie-overhead). Agency: €12 000 + €200/m. Jouw echte cijfers bepalen we samen.",
    ctaTitle: "De goedkoopste lijn op lange termijn is meestal de eigen build.",
    ctaText: "Niet omdat 't moet — omdat de cijfers het zeggen. Laten we ze op jouw situatie zetten.",
    ctaButton: "Bereken mijn geval",
    locale: "nl-BE",
  },
  fr: {
    eyebrow: "Comparaison de coûts sur 5 ans",
    title: "Combien ça coûte vraiment, sur cinq ans ?",
    lead: "Le prix du build n'est qu'un début. Ajustez votre chiffre d'affaires mensuel en ligne et voyez le coût total (TCO) sur 60 mois — hébergement, plugins, maintenance et frais de transaction Shopify inclus.",
    revenue: "CA en ligne",
    perMonth: "par mois",
    over5y: "Total sur 5 ans",
    year: "an",
    plans: {
      svm: "Studio VM (Pro + Care)",
      wp: "WordPress + plugins + maintenance",
      shopify: "Shopify (+ 2% de frais)",
      agency: "Agence (build + forfait)",
    },
    method:
      "Modèle indicatif. Studio VM : €1 900 unique + €49/m. WordPress : €2 500 + ~€115/m (plugins, sécurité, hébergement). Shopify : €1 500 setup + €36/m + 2% du CA (overhead app/transaction). Agence : €12 000 + €200/m. Vos vrais chiffres, on les définit ensemble.",
    ctaTitle: "La ligne la moins chère à long terme est souvent le build propre.",
    ctaText: "Pas par principe — parce que les chiffres le disent. Appliquons-les à votre cas.",
    ctaButton: "Calculer mon cas",
    locale: "fr-BE",
  },
  en: {
    eyebrow: "5-year cost comparison",
    title: "What does it really cost, over five years?",
    lead: "The build price is just the start. Slide your monthly online revenue and see the total cost (TCO) over 60 months — including hosting, plugins, maintenance and Shopify transaction fees.",
    revenue: "Online revenue",
    perMonth: "per month",
    over5y: "Total over 5 years",
    year: "year",
    plans: {
      svm: "Studio VM (Pro + Care)",
      wp: "WordPress + plugins + maintenance",
      shopify: "Shopify (+ 2% fees)",
      agency: "Agency (build + retainer)",
    },
    method:
      "Indicative model. Studio VM: €1,900 one-off + €49/m. WordPress: €2,500 + ~€115/m (plugins, security, hosting). Shopify: €1,500 setup + €36/m + 2% of revenue (app/transaction overhead). Agency: €12,000 + €200/m. Your real numbers we define together.",
    ctaTitle: "The cheapest line long-term is usually the own build.",
    ctaText: "Not on principle — because the numbers say so. Let's apply them to your case.",
    ctaButton: "Calculate my case",
    locale: "en-GB",
  },
};

export function TcoChart() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = T[locale];
  const [rev, setRev] = useState(8000);

  const plans: Plan[] = [
    { key: "svm", label: t.plans.svm, color: "#b45309", setup: 1900, monthly: 49, pctRevenue: 0 },
    { key: "wp", label: t.plans.wp, color: "#6b7280", setup: 2500, monthly: 115, pctRevenue: 0 },
    { key: "shopify", label: t.plans.shopify, color: "#16a34a", setup: 1500, monthly: 36, pctRevenue: 0.02 },
    { key: "agency", label: t.plans.agency, color: "#7c3aed", setup: 12000, monthly: 200, pctRevenue: 0 },
  ];

  const cost = (p: Plan, m: number) =>
    p.setup + m * (p.monthly + p.pctRevenue * rev);

  const maxY = Math.max(...plans.map((p) => cost(p, MONTHS)));
  const W = 640;
  const H = 280;
  const padL = 56;
  const padB = 28;
  const x = (m: number) => padL + (m / MONTHS) * (W - padL - 10);
  const y = (v: number) => H - padB - (v / maxY) * (H - padB - 12);

  const fmt = (n: number) =>
    "€ " + (Math.round(n / 100) * 100).toLocaleString(t.locale);

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
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-8 max-w-md">
            <div className="mb-2 flex items-baseline justify-between">
              <label className="text-sm font-medium">{t.revenue}</label>
              <span className="font-mono text-sm text-accent">
                € {rev.toLocaleString(t.locale)} {t.perMonth}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30000}
              step={500}
              value={rev}
              onChange={(e) => setRev(Number(e.target.value))}
              aria-label={t.revenue}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-accent"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border bg-card p-4">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full min-w-[560px]"
              role="img"
              aria-label="TCO"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                <g key={g}>
                  <line
                    x1={padL}
                    x2={W - 10}
                    y1={y(maxY * g)}
                    y2={y(maxY * g)}
                    stroke="currentColor"
                    className="text-border"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y(maxY * g) + 3}
                    textAnchor="end"
                    className="fill-muted"
                    style={{ fontSize: 9, fontFamily: "monospace" }}
                  >
                    €{Math.round((maxY * g) / 1000)}k
                  </text>
                </g>
              ))}
              {[12, 24, 36, 48, 60].map((m) => (
                <text
                  key={m}
                  x={x(m)}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-muted"
                  style={{ fontSize: 9, fontFamily: "monospace" }}
                >
                  {m / 12} {t.year}
                </text>
              ))}
              {plans.map((p) => {
                const d = Array.from({ length: MONTHS + 1 }, (_, m) =>
                  `${m === 0 ? "M" : "L"}${x(m).toFixed(1)},${y(cost(p, m)).toFixed(1)}`,
                ).join(" ");
                return (
                  <path
                    key={p.key}
                    d={d}
                    fill="none"
                    stroke={p.color}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  >
                    <animate
                      attributeName="stroke-dasharray"
                      from="0 2000"
                      to="2000 0"
                      dur="0.9s"
                      fill="freeze"
                    />
                  </path>
                );
              })}
            </svg>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p) => (
              <div
                key={p.key}
                className="rounded-2xl border bg-card p-4"
                style={{ borderColor: `${p.color}55` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="text-xs font-medium">{p.label}</span>
                </div>
                <p className="mt-3 text-xl font-semibold tracking-tight">
                  {fmt(cost(p, MONTHS))}
                </p>
                <p className="font-mono text-[10px] text-muted">{t.over5y}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-muted">
            {t.method}
          </p>
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
