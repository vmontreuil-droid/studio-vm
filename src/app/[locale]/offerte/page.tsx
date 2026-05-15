"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, ArrowRight, Send, RotateCcw } from "lucide-react";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

type BaseKind = "website" | "webshop" | "migratie" | "custom";

const basePrice: Record<BaseKind, number> = {
  website: 2500,
  webshop: 7500,
  migratie: 3500,
  custom: 6000,
};

const moduleKeys = [
  "meertalig",
  "admin",
  "pwa",
  "newsletters",
  "boekingen",
  "media",
] as const;
type ModuleKey = (typeof moduleKeys)[number];

const modulePrice: Record<ModuleKey, number> = {
  meertalig: 1200,
  admin: 1500,
  pwa: 800,
  newsletters: 900,
  boekingen: 700,
  media: 900,
};

type PlanKey = "geen" | "care" | "plus" | "scale";
const planMonthly: Record<PlanKey, number> = {
  geen: 0,
  care: 49,
  plus: 149,
  scale: 399,
};

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    step1: string;
    step2: string;
    step3: string;
    bases: Record<BaseKind, { label: string; desc: string }>;
    modules: Record<ModuleKey, { label: string; desc: string }>;
    plans: Record<PlanKey, { label: string; desc: string }>;
    estimate: string;
    estimateNote: string;
    oneOff: string;
    monthly: string;
    reset: string;
    sendTitle: string;
    sendText: string;
    sendButton: string;
    mailSubject: string;
    mailIntro: string;
    mailBase: string;
    mailModules: string;
    mailPlan: string;
    mailEstimate: string;
    mailOutro: string;
    pricingLink: string;
    excl: string;
  }
> = {
  nl: {
    eyebrow: "Offerte-calculator",
    title: "Reken je project even uit.",
    intro:
      "Kies wat je nodig hebt en zie meteen een richtprijs. Geen verplichting — een exacte offerte volgt na een gesprek. Dit geeft je alvast een eerlijk idee.",
    step1: "1 · Wat heb je nodig?",
    step2: "2 · Extra modules",
    step3: "3 · Onderhoud achteraf",
    bases: {
      website: { label: "Website", desc: "Vitrine-site, tot ~15 pagina's" },
      webshop: { label: "Webshop", desc: "Verkoop online, Mollie/Stripe" },
      migratie: { label: "Migratie", desc: "Van WordPress/Squarespace" },
      custom: { label: "Custom", desc: "Multi-app, integraties, op maat" },
    },
    modules: {
      meertalig: { label: "Tweetalig (NL/FR/EN)", desc: "Vertaalde routes + SEO per taal" },
      admin: { label: "Admin op maat", desc: "Eigen dashboard, jij beheert" },
      pwa: { label: "Progressive Web App", desc: "Installeerbaar, offline" },
      newsletters: { label: "Newsletters", desc: "Mailing-tool in de admin" },
      boekingen: { label: "Reservaties", desc: "Boekingsflow + bevestigingen" },
      media: { label: "Beeld-pipeline", desc: "Bulk-upload + optimalisatie" },
    },
    plans: {
      geen: { label: "Geen", desc: "Free tier, support per uur" },
      care: { label: "Care", desc: "Hosting + backups + 1u/m" },
      plus: { label: "Plus", desc: "+ content-updates + 4u/m" },
      scale: { label: "Scale", desc: "+ features + onbeperkt support" },
    },
    estimate: "Richtprijs",
    estimateNote:
      "Indicatief, excl. btw. De exacte prijs hangt af van de scope — die bepalen we samen in een vrijblijvend gesprek.",
    oneOff: "eenmalig",
    monthly: "per maand",
    reset: "Opnieuw",
    sendTitle: "Klaar om dit concreet te maken?",
    sendText:
      "Stuur deze samenvatting door. Ik bekijk 't en kom met een exacte offerte — meestal binnen één werkdag.",
    sendButton: "Stuur naar Studio VM",
    mailSubject: "Offerte-aanvraag via de calculator",
    mailIntro: "Hoi Vincent,\n\nIk rekende een project uit op studio-vm.be/offerte:",
    mailBase: "Type",
    mailModules: "Modules",
    mailPlan: "Onderhoud",
    mailEstimate: "Richtprijs",
    mailOutro: "Kan je hier een exacte offerte van maken?\n\nGroeten",
    pricingLink: "Of bekijk de vaste pakketten",
    excl: "excl. btw",
  },
  fr: {
    eyebrow: "Calculateur de devis",
    title: "Estimez votre projet.",
    intro:
      "Choisissez ce dont vous avez besoin et voyez un prix indicatif immédiat. Sans engagement — un devis exact suit après un entretien. Cela vous donne déjà une idée honnête.",
    step1: "1 · De quoi avez-vous besoin ?",
    step2: "2 · Modules supplémentaires",
    step3: "3 · Maintenance ensuite",
    bases: {
      website: { label: "Site web", desc: "Site vitrine, jusqu'à ~15 pages" },
      webshop: { label: "Boutique", desc: "Vente en ligne, Mollie/Stripe" },
      migratie: { label: "Migration", desc: "Depuis WordPress/Squarespace" },
      custom: { label: "Sur mesure", desc: "Multi-app, intégrations" },
    },
    modules: {
      meertalig: { label: "Bilingue (NL/FR/EN)", desc: "Routes traduites + SEO par langue" },
      admin: { label: "Admin sur mesure", desc: "Dashboard propre, vous gérez" },
      pwa: { label: "Progressive Web App", desc: "Installable, hors ligne" },
      newsletters: { label: "Newsletters", desc: "Outil d'emailing dans l'admin" },
      boekingen: { label: "Réservations", desc: "Flux de réservation + confirmations" },
      media: { label: "Pipeline d'images", desc: "Upload masse + optimisation" },
    },
    plans: {
      geen: { label: "Aucun", desc: "Free tier, support à l'heure" },
      care: { label: "Care", desc: "Hébergement + backups + 1h/m" },
      plus: { label: "Plus", desc: "+ mises à jour contenu + 4h/m" },
      scale: { label: "Scale", desc: "+ fonctions + support illimité" },
    },
    estimate: "Prix indicatif",
    estimateNote:
      "Indicatif, HTVA. Le prix exact dépend du scope — on le définit ensemble lors d'un entretien sans engagement.",
    oneOff: "unique",
    monthly: "par mois",
    reset: "Recommencer",
    sendTitle: "Prêt à concrétiser ?",
    sendText:
      "Envoyez ce résumé. Je l'examine et reviens avec un devis exact — généralement sous un jour ouvré.",
    sendButton: "Envoyer à Studio VM",
    mailSubject: "Demande de devis via le calculateur",
    mailIntro: "Bonjour Vincent,\n\nJ'ai estimé un projet sur studio-vm.be/offerte :",
    mailBase: "Type",
    mailModules: "Modules",
    mailPlan: "Maintenance",
    mailEstimate: "Prix indicatif",
    mailOutro: "Pouvez-vous en faire un devis exact ?\n\nCordialement",
    pricingLink: "Ou voir les forfaits fixes",
    excl: "HTVA",
  },
  en: {
    eyebrow: "Quote calculator",
    title: "Estimate your project.",
    intro:
      "Pick what you need and see an indicative price right away. No obligation — an exact quote follows after a chat. This gives you an honest idea up front.",
    step1: "1 · What do you need?",
    step2: "2 · Extra modules",
    step3: "3 · Maintenance afterwards",
    bases: {
      website: { label: "Website", desc: "Showcase site, up to ~15 pages" },
      webshop: { label: "Webshop", desc: "Sell online, Mollie/Stripe" },
      migratie: { label: "Migration", desc: "From WordPress/Squarespace" },
      custom: { label: "Custom", desc: "Multi-app, integrations" },
    },
    modules: {
      meertalig: { label: "Multilingual (NL/FR/EN)", desc: "Translated routes + per-language SEO" },
      admin: { label: "Custom admin", desc: "Own dashboard, you manage" },
      pwa: { label: "Progressive Web App", desc: "Installable, offline" },
      newsletters: { label: "Newsletters", desc: "Mailing tool in the admin" },
      boekingen: { label: "Reservations", desc: "Booking flow + confirmations" },
      media: { label: "Image pipeline", desc: "Bulk upload + optimization" },
    },
    plans: {
      geen: { label: "None", desc: "Free tier, hourly support" },
      care: { label: "Care", desc: "Hosting + backups + 1h/m" },
      plus: { label: "Plus", desc: "+ content updates + 4h/m" },
      scale: { label: "Scale", desc: "+ features + unlimited support" },
    },
    estimate: "Indicative price",
    estimateNote:
      "Indicative, excl. VAT. The exact price depends on scope — we define that together in a no-obligation chat.",
    oneOff: "one-off",
    monthly: "per month",
    reset: "Start over",
    sendTitle: "Ready to make this concrete?",
    sendText:
      "Send this summary. I'll review it and come back with an exact quote — usually within one working day.",
    sendButton: "Send to Studio VM",
    mailSubject: "Quote request via the calculator",
    mailIntro: "Hi Vincent,\n\nI estimated a project on studio-vm.be/offerte:",
    mailBase: "Type",
    mailModules: "Modules",
    mailPlan: "Maintenance",
    mailEstimate: "Indicative price",
    mailOutro: "Can you turn this into an exact quote?\n\nBest",
    pricingLink: "Or see the fixed packages",
    excl: "excl. VAT",
  },
};

export default function OffertePage() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = T[locale];

  const [base, setBase] = useState<BaseKind>("website");
  const [mods, setMods] = useState<ModuleKey[]>([]);
  const [plan, setPlan] = useState<PlanKey>("care");

  const toggleMod = (m: ModuleKey) =>
    setMods((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));

  const oneOff =
    basePrice[base] + mods.reduce((sum, m) => sum + modulePrice[m], 0);
  const lo = Math.round((oneOff * 0.9) / 100) * 100;
  const hi = Math.round((oneOff * 1.15) / 100) * 100;
  const monthly = planMonthly[plan];

  const fmt = (n: number) => "€ " + n.toLocaleString("nl-BE");

  const reset = () => {
    setBase("website");
    setMods([]);
    setPlan("care");
  };

  const mailBody = [
    c.mailIntro,
    "",
    `${c.mailBase}: ${c.bases[base].label}`,
    `${c.mailModules}: ${mods.length ? mods.map((m) => c.modules[m].label).join(", ") : "—"}`,
    `${c.mailPlan}: ${c.plans[plan].label}${monthly ? ` (${fmt(monthly)}/m)` : ""}`,
    `${c.mailEstimate}: ${fmt(lo)} – ${fmt(hi)} (${c.excl})`,
    "",
    c.mailOutro,
  ].join("\n");

  const mailto = `mailto:info@studio-vm.be?subject=${encodeURIComponent(
    c.mailSubject,
  )}&body=${encodeURIComponent(mailBody)}`;

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {c.intro}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-12">
            <div>
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-accent">
                {c.step1}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(basePrice) as BaseKind[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBase(b)}
                    className={`rounded-2xl border p-5 text-left transition-colors ${
                      base === b
                        ? "border-accent bg-card-hover"
                        : "border-border bg-card hover:bg-card-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold tracking-tight">
                        {c.bases[b].label}
                      </span>
                      {base === b && (
                        <Check className="h-4 w-4 text-accent" strokeWidth={2.5} />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{c.bases[b].desc}</p>
                    <p className="mt-3 font-mono text-xs text-muted">
                      {b === "custom" ? "vanaf " : ""}
                      {fmt(basePrice[b])}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-accent">
                {c.step2}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {moduleKeys.map((m) => {
                  const on = mods.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMod(m)}
                      className={`rounded-2xl border p-5 text-left transition-colors ${
                        on
                          ? "border-accent bg-card-hover"
                          : "border-border bg-card hover:bg-card-hover"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold tracking-tight">
                          {c.modules[m].label}
                        </span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            on
                              ? "border-accent bg-accent text-white"
                              : "border-border"
                          }`}
                        >
                          {on && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {c.modules[m].desc}
                      </p>
                      <p className="mt-3 font-mono text-xs text-muted">
                        + {fmt(modulePrice[m])}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-accent">
                {c.step3}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(Object.keys(planMonthly) as PlanKey[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      plan === p
                        ? "border-accent bg-card-hover"
                        : "border-border bg-card hover:bg-card-hover"
                    }`}
                  >
                    <span className="font-semibold tracking-tight">
                      {c.plans[p].label}
                    </span>
                    <p className="mt-1 text-xs text-muted">{c.plans[p].desc}</p>
                    <p className="mt-2 font-mono text-xs text-muted">
                      {planMonthly[p] ? `${fmt(planMonthly[p])}/m` : "—"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border bg-card p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                {c.estimate}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {fmt(lo)} <span className="text-muted">–</span> {fmt(hi)}
              </p>
              <p className="mt-1 font-mono text-xs text-muted">
                {c.oneOff} · {c.excl}
              </p>
              {monthly > 0 && (
                <p className="mt-4 border-t pt-4 text-sm">
                  + <strong>{fmt(monthly)}</strong> {c.monthly}{" "}
                  <span className="text-muted">({c.plans[plan].label})</span>
                </p>
              )}
              <p className="mt-4 text-xs leading-relaxed text-muted">
                {c.estimateNote}
              </p>
              <a
                href={mailto}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
                {c.sendButton}
              </a>
              <button
                type="button"
                onClick={reset}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs text-muted transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={2} />
                {c.reset}
              </button>
              <Link
                href={localePath(locale, "/pricing")}
                className="mt-4 block text-center font-mono text-xs text-accent hover:underline"
              >
                {c.pricingLink} →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {c.sendTitle}
          </h2>
          <p className="mt-3 text-muted">{c.sendText}</p>
          <a
            href={mailto}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {c.sendButton}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      </section>
    </main>
  );
}
